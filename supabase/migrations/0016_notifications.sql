-- Order notifications for admin/staff accounts, self-managed from
-- Mon compte → Notifications. Two channels, both opt-in per account:
--
--   • Email, sent through Resend.
--   • WhatsApp, sent through CallMeBot (a free personal-use API — each staff
--     phone must first message the CallMeBot bot number once to opt in and
--     receive its own apikey; see admin.account.notif* strings for the copy
--     that walks them through it).
--
-- The edge function that actually sends (supabase/functions/notify-order) is
-- called by the ANONYMOUS shopper's browser right after place_order succeeds
-- (see CheckoutForm.tsx) — deliberately best-effort and decoupled, so a
-- notification failure can never affect checkout. Two consequences follow:
--
--   1. It runs with no admin session, so `claim_order_notification` below is
--      grantable to anon and is the ONLY thing it may call.
--   2. Anyone who learns the function's URL could otherwise replay it for the
--      same order (spamming staff) or probe made-up order numbers. The claim
--      function closes both: it is an atomic UPDATE ... WHERE notified_at IS
--      NULL, so a given order can be claimed (and therefore notified) at most
--      once, and a nonexistent/already-claimed number returns nothing —
--      indistinguishable from a real one that was already sent.

-- ---------------------------------------------------- notification prefs
-- References admin_profiles (not auth.users directly): a prefs row can only
-- ever belong to an actual admin/staff account, and the FK is what lets the
-- edge function embed `admin_profiles!inner(active)` in one PostgREST query
-- instead of a second round trip.
create table if not exists admin_notification_prefs (
  user_id          uuid primary key references admin_profiles(user_id) on delete cascade,
  email_enabled    boolean not null default false,
  notify_email     text,
  whatsapp_enabled boolean not null default false,
  whatsapp_number  text,
  callmebot_apikey text,
  updated_at       timestamptz not null default now()
);

alter table admin_notification_prefs enable row level security;

-- Each account manages only its own row. There is no owner-manages-everyone
-- policy here on purpose — unlike section grants, a phone number and inbox
-- are personal, and the edge function reads across every row anyway using the
-- service-role key, which bypasses RLS entirely.
drop policy if exists "admin manages own notification prefs" on admin_notification_prefs;
create policy "admin manages own notification prefs" on admin_notification_prefs
  for all to authenticated
  using (user_id = auth.uid() and is_admin())
  with check (user_id = auth.uid() and is_admin());

-- ------------------------------------------------------- notify-order guard
alter table orders add column if not exists notified_at timestamptz;

create or replace function claim_order_notification(p_order_number text)
returns table (
  order_number   text,
  customer_name  text,
  customer_phone text,
  wilaya         text,
  city           text,
  total          numeric,
  item_count     integer,
  created_at     timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
    update orders o
       set notified_at = now()
     where o.order_number = p_order_number
       and o.notified_at is null
    returning
      o.order_number, o.customer_name, o.customer_phone, o.wilaya, o.city, o.total,
      (select count(*)::int from order_items oi where oi.order_id = o.id),
      o.created_at;
end;
$$;

revoke execute on function claim_order_notification(text) from public;
grant  execute on function claim_order_notification(text) to anon;
grant  execute on function claim_order_notification(text) to authenticated;
