// Staff-account creation. Runs server-side because it needs the service-role
// key, which must never reach the browser. Supabase injects SUPABASE_URL and
// SUPABASE_SERVICE_ROLE_KEY automatically — nothing to configure.
//
// Deploy: supabase functions deploy create-worker
//
// Deno runtime — not part of the Vite app's tsconfig or eslint scope. The npm:
// specifier is self-contained (no import map), so this file pastes verbatim
// into the dashboard editor and still type-checks under the Deno LSP.
import { createClient } from "npm:@supabase/supabase-js@2";

// KEEP IN SYNC with src/lib/adminSections.ts and the has_section('…') strings
// in supabase/migrations/0004, 0006, 0007 and 0010.
const ALLOWED_SECTIONS = [
  "products",
  "categories",
  "orders",
  "delivery",
  "reviews",
  "content",
  "articles",
  "messages",
  "newsletter",
  "pixels",
  "finance",
  "store",
];

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ code: "method_not_allowed" }, 405);

  const admin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } },
  );

  // 1. Verify the CALLER — an authenticated worker must not be able to mint
  //    themselves a colleague.
  const jwt = req.headers.get("Authorization")?.replace("Bearer ", "") ?? "";
  if (!jwt) return json({ code: "unauthorized" }, 401);

  const { data: userData, error: userError } = await admin.auth.getUser(jwt);
  if (userError || !userData.user) return json({ code: "unauthorized" }, 401);

  const { data: profile } = await admin
    .from("admin_profiles")
    .select("is_owner, active")
    .eq("user_id", userData.user.id)
    .maybeSingle();

  if (!profile?.is_owner || !profile.active) return json({ code: "forbidden" }, 403);

  // 2. Read + re-validate the body server-side. The section list is client
  //    input: filter against the whitelist, never trust it.
  let body: { email?: string; password?: string; sections?: unknown };
  try {
    body = await req.json();
  } catch {
    return json({ code: "bad_request" }, 400);
  }

  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");
  const sections = Array.isArray(body.sections)
    ? body.sections.filter((s): s is string => typeof s === "string" && ALLOWED_SECTIONS.includes(s))
    : [];

  if (!/^[^@\s]+@[^@\s]+\.[a-zA-Z]{2,}$/.test(email)) return json({ code: "bad_request" }, 400);
  if (password.length < 8) return json({ code: "weak_password" }, 400);

  // 3. email_confirm: true — there is no inbox flow for a shop employee.
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (createError || !created.user) {
    const message = createError?.message?.toLowerCase() ?? "";
    if (message.includes("already") || message.includes("registered")) {
      return json({ code: "email_exists" }, 409);
    }
    return json({ code: "create_failed", detail: createError?.message }, 400);
  }

  const { error: profileError } = await admin.from("admin_profiles").insert({
    user_id: created.user.id,
    email,
    is_owner: false,
    sections,
    active: true,
  });

  // 4. Roll back on partial failure: a dangling auth user with no profile can
  //    log in, see the no-access screen forever, and blocks the email from
  //    ever being re-used.
  if (profileError) {
    await admin.auth.admin.deleteUser(created.user.id);
    return json({ code: "profile_failed", detail: profileError.message }, 400);
  }

  return json({ ok: true, user_id: created.user.id }, 200);
});
