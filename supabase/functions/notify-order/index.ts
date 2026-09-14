// Pings staff (email + WhatsApp) when a new order comes in. Called by the
// SHOPPER's own browser right after `place_order` succeeds (CheckoutForm.tsx)
// — there is no admin session at that point, which is why every check here is
// server-side: `claim_order_notification` is the anon-safe RPC (see migration
// 0016) and the sender lists are read with the service-role key, never RLS.
//
// Deploy: supabase functions deploy notify-order
// (default JWT verification is fine — the anon key IS a valid Supabase JWT,
// and supabase-js sends it automatically for a signed-out caller)
//
// Secrets: supabase secrets set RESEND_API_KEY=... [RESEND_FROM=...] [SITE_ADMIN_URL=...]
//   RESEND_FROM defaults to Resend's shared onboarding.resend.dev sender,
//   which only delivers to the Resend account's own inbox until norlyn.dz is
//   registered and verified in Resend — switch RESEND_FROM once that's done.
//
// Best-effort by design, like deleteUploadedImage() in lib/upload.ts: this
// must never surface a failure to the shopper or affect the order. The caller
// `void`s the invoke and never reads the response.
import { createClient } from "npm:@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

// NRL-YYYYMMDD-<10 hex> — see place_order() in supabase/migrations/0015_hardening.sql
const ORDER_NUMBER_RE = /^NRL-\d{8}-[0-9A-F]{10}$/;

interface ClaimedOrder {
  order_number: string;
  customer_name: string;
  customer_phone: string;
  wilaya: string;
  city: string;
  total: number;
  item_count: number;
  created_at: string;
}

interface NotificationPrefRow {
  email_enabled: boolean;
  notify_email: string | null;
  whatsapp_enabled: boolean;
  whatsapp_number: string | null;
  callmebot_apikey: string | null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ code: "method_not_allowed" }, 405);

  let body: { order_number?: unknown };
  try {
    body = await req.json();
  } catch {
    return json({ code: "bad_request" }, 400);
  }
  const orderNumber = String(body.order_number ?? "");
  if (!ORDER_NUMBER_RE.test(orderNumber)) return json({ code: "bad_request" }, 400);

  const admin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } },
  );

  // Atomic claim: returns the order exactly once, ever. A retry, a duplicate
  // invoke, or a stranger replaying/guessing order numbers all land here and
  // all get the same response — nothing is sent, nothing is revealed.
  const { data: claimed, error: claimError } = await admin
    .rpc("claim_order_notification", { p_order_number: orderNumber })
    .maybeSingle<ClaimedOrder>();

  if (claimError || !claimed) return json({ ok: true, sent: 0 });

  const { data: recipients } = await admin
    .from("admin_notification_prefs")
    .select(
      "email_enabled, notify_email, whatsapp_enabled, whatsapp_number, callmebot_apikey, admin_profiles!inner(active)",
    )
    .eq("admin_profiles.active", true)
    .returns<NotificationPrefRow[]>();

  const adminUrl = Deno.env.get("SITE_ADMIN_URL");
  const message =
    `Nouvelle commande ${claimed.order_number}\n` +
    `${claimed.customer_name} — ${claimed.customer_phone}\n` +
    `${claimed.city}, ${claimed.wilaya}\n` +
    `${claimed.item_count} article(s) — ${Number(claimed.total).toFixed(2)} DA` +
    (adminUrl ? `\n${adminUrl}/admin/orders` : "");

  const jobs: Promise<void>[] = [];
  for (const r of recipients ?? []) {
    if (r.email_enabled && r.notify_email) {
      jobs.push(sendEmail(r.notify_email, claimed.order_number, message));
    }
    if (r.whatsapp_enabled && r.whatsapp_number && r.callmebot_apikey) {
      jobs.push(sendWhatsApp(r.whatsapp_number, r.callmebot_apikey, message));
    }
  }

  const results = await Promise.allSettled(jobs);
  const sent = results.filter((r) => r.status === "fulfilled").length;
  return json({ ok: true, sent });
});

async function sendEmail(to: string, orderNumber: string, text: string): Promise<void> {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  if (!apiKey) return;
  const from = Deno.env.get("RESEND_FROM") ?? "Norlyn Coffee <onboarding@resend.dev>";
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to, subject: `Nouvelle commande — ${orderNumber}`, text }),
  });
  if (!res.ok) throw new Error(`resend ${res.status}`);
}

async function sendWhatsApp(phone: string, apikey: string, text: string): Promise<void> {
  const url =
    `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(phone)}` +
    `&text=${encodeURIComponent(text)}&apikey=${encodeURIComponent(apikey)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`callmebot ${res.status}`);
}
