// Pings staff (email + WhatsApp) on two events: a new order, and a new
// Contact-page message. Both are called by the SHOPPER's own browser right
// after the write succeeds (CheckoutForm.tsx / Contact.tsx) — there is no
// admin session at that point, which is why every check here is server-side:
// claim_order_notification / claim_message_notification are the anon-safe
// RPCs (migrations 0016, 0017), and the recipient list is read with the
// service-role key, never RLS.
//
// One dispatcher for both kinds, not two functions: the recipient lookup,
// the send helpers and the best-effort/idempotent shape are identical either
// way — only the claim RPC and the message body differ. Replaces the earlier
// `notify-order` function (delete it from your project once this is live —
// `supabase functions delete notify-order`).
//
// Deploy: supabase functions deploy notify
// (default JWT verification is fine — the anon key IS a valid Supabase JWT,
// and supabase-js sends it automatically for a signed-out caller)
//
// Secrets (shared with every function in the project, nothing new to set if
// notify-order was already configured):
//   supabase secrets set RESEND_API_KEY=... [RESEND_FROM=...] [SITE_ADMIN_URL=...]
//
// Best-effort by design, like deleteUploadedImage() in lib/upload.ts: this
// must never surface a failure to the shopper or affect the order/message.
// The caller `void`s the invoke and never reads the response.
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
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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

interface ClaimedMessage {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  subject: string | null;
  message: string;
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

  let body: { kind?: unknown; order_number?: unknown; message_id?: unknown };
  try {
    body = await req.json();
  } catch {
    return json({ code: "bad_request" }, 400);
  }

  const admin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } },
  );

  let subject: string;
  let text: string;

  if (body.kind === "order") {
    const orderNumber = String(body.order_number ?? "");
    if (!ORDER_NUMBER_RE.test(orderNumber)) return json({ code: "bad_request" }, 400);

    // Atomic claim: returns the order exactly once, ever. A retry, a
    // duplicate invoke, or a stranger replaying/guessing order numbers all
    // land here and all get the same response — nothing sent, nothing revealed.
    const { data: claimed, error } = await admin
      .rpc("claim_order_notification", { p_order_number: orderNumber })
      .maybeSingle<ClaimedOrder>();
    if (error || !claimed) return json({ ok: true, sent: 0 });

    const adminUrl = Deno.env.get("SITE_ADMIN_URL");
    subject = `Nouvelle commande — ${claimed.order_number}`;
    text =
      `Nouvelle commande ${claimed.order_number}\n` +
      `${claimed.customer_name} — ${claimed.customer_phone}\n` +
      `${claimed.city}, ${claimed.wilaya}\n` +
      `${claimed.item_count} article(s) — ${Number(claimed.total).toFixed(2)} DA` +
      (adminUrl ? `\n${adminUrl}/admin/orders` : "");
  } else if (body.kind === "message") {
    const messageId = String(body.message_id ?? "");
    if (!UUID_RE.test(messageId)) return json({ code: "bad_request" }, 400);

    const { data: claimed, error } = await admin
      .rpc("claim_message_notification", { p_id: messageId })
      .maybeSingle<ClaimedMessage>();
    if (error || !claimed) return json({ ok: true, sent: 0 });

    const adminUrl = Deno.env.get("SITE_ADMIN_URL");
    subject = `Nouveau message — ${claimed.name}`;
    text =
      `Nouveau message de contact\n` +
      `${claimed.name}${claimed.email ? " — " + claimed.email : ""}${claimed.phone ? " — " + claimed.phone : ""}\n` +
      (claimed.subject ? `Sujet : ${claimed.subject}\n` : "") +
      `${claimed.message.slice(0, 300)}` +
      (adminUrl ? `\n${adminUrl}/admin/messages` : "");
  } else {
    return json({ code: "bad_request" }, 400);
  }

  const { data: recipients } = await admin
    .from("admin_notification_prefs")
    .select(
      "email_enabled, notify_email, whatsapp_enabled, whatsapp_number, callmebot_apikey, admin_profiles!inner(active)",
    )
    .eq("admin_profiles.active", true)
    .returns<NotificationPrefRow[]>();

  const jobs: Promise<void>[] = [];
  for (const r of recipients ?? []) {
    if (r.email_enabled && r.notify_email) {
      jobs.push(sendEmail(r.notify_email, subject, text));
    }
    if (r.whatsapp_enabled && r.whatsapp_number && r.callmebot_apikey) {
      jobs.push(sendWhatsApp(r.whatsapp_number, r.callmebot_apikey, text));
    }
  }

  const results = await Promise.allSettled(jobs);
  const sent = results.filter((r) => r.status === "fulfilled").length;
  return json({ ok: true, sent });
});

async function sendEmail(to: string, subject: string, text: string): Promise<void> {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  if (!apiKey) return;
  const from = Deno.env.get("RESEND_FROM") ?? "Norlyn Coffee <onboarding@resend.dev>";
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to, subject, text }),
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
