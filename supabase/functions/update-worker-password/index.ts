// Owner-initiated password reset for a staff account. Runs server-side
// because it needs the service-role key (auth.admin.updateUserById), which
// must never reach the browser.
//
// Deploy: supabase functions deploy update-worker-password
//
// Deno runtime — not part of the Vite app's tsconfig or eslint scope. The npm:
// specifier is self-contained (no import map), so this file pastes verbatim
// into the dashboard editor and still type-checks under the Deno LSP.
import { createClient } from "npm:@supabase/supabase-js@2";

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

  // 1. Verify the CALLER — only an active owner may reset a colleague's
  //    password. Mirrors create-worker's authorization.
  const jwt = req.headers.get("Authorization")?.replace("Bearer ", "") ?? "";
  if (!jwt) return json({ code: "unauthorized" }, 401);

  const { data: userData, error: userError } = await admin.auth.getUser(jwt);
  if (userError || !userData.user) return json({ code: "unauthorized" }, 401);

  const { data: callerProfile } = await admin
    .from("admin_profiles")
    .select("is_owner, active")
    .eq("user_id", userData.user.id)
    .maybeSingle();

  if (!callerProfile?.is_owner || !callerProfile.active) return json({ code: "forbidden" }, 403);

  // 2. Read + validate the body.
  let body: { user_id?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return json({ code: "bad_request" }, 400);
  }

  const targetId = String(body.user_id ?? "");
  const password = String(body.password ?? "");
  if (!targetId) return json({ code: "bad_request" }, 400);
  if (password.length < 8) return json({ code: "weak_password" }, 400);

  // 3. The target must be a non-owner staff profile — an owner can't reset
  //    another owner's (or their own) password through this endpoint.
  const { data: targetProfile } = await admin
    .from("admin_profiles")
    .select("is_owner")
    .eq("user_id", targetId)
    .maybeSingle();

  if (!targetProfile || targetProfile.is_owner) return json({ code: "not_found" }, 404);

  const { error: updateError } = await admin.auth.admin.updateUserById(targetId, { password });
  if (updateError) return json({ code: "update_failed", detail: updateError.message }, 400);

  return json({ ok: true }, 200);
});
