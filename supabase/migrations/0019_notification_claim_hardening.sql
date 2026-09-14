-- Security correction: claim_order_notification (0016) and
-- claim_message_notification (0017) are called ONLY by the `notify` edge
-- function, using the SERVICE ROLE key — which already bypasses every
-- function-level grant in a Supabase project. Granting them to
-- anon/authenticated in those migrations was an unreflective copy of
-- place_order's pattern (which genuinely needs anon), and it opened a real
-- hole: unlike get_order_by_number — which deliberately omits phone/address
-- for exactly this reason — claim_order_notification returns the customer's
-- PHONE NUMBER, and both functions can be called directly via
-- POST /rest/v1/rpc/<name> with nothing but the public anon key, bypassing
-- the edge function entirely. Because each row can be claimed at most once,
-- doing so also permanently blocks the real notification for that row.
--
-- Fix: revoke the anon/authenticated grants. Nothing else changes — the
-- edge function's service-role client is unaffected.
revoke execute on function claim_order_notification(text) from anon;
revoke execute on function claim_order_notification(text) from authenticated;
revoke execute on function claim_message_notification(uuid) from anon;
revoke execute on function claim_message_notification(uuid) from authenticated;
