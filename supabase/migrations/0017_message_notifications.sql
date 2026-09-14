-- Extends the order-notification pipeline (0016) to contact messages: the
-- same email/WhatsApp preferences an admin sets in Mon compte now also fire
-- when a shopper submits the Contact page form, through the same `notify`
-- edge function (renamed from notify-order — see that function's own header
-- for why one dispatcher serves both event kinds).
--
-- Mirrors 0016's shape exactly: an anon-safe atomic claim (idempotent, and
-- reveals nothing to a caller replaying/guessing an id) plus a `notified_at`
-- column so a message can trigger a send at most once.

-- ---------------------------------------------------- claim + guard column
alter table contact_messages add column if not exists notified_at timestamptz;

create or replace function claim_message_notification(p_id uuid)
returns table (
  id         uuid,
  name       text,
  email      text,
  phone      text,
  subject    text,
  message    text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
    update contact_messages m
       set notified_at = now()
     where m.id = p_id
       and m.notified_at is null
    returning m.id, m.name, m.email, m.phone, m.subject, m.message, m.created_at;
end;
$$;

revoke execute on function claim_message_notification(uuid) from public;
grant  execute on function claim_message_notification(uuid) to anon;
grant  execute on function claim_message_notification(uuid) to authenticated;

-- ------------------------------------------------- submit_contact_message()
-- Needs its new id back so the browser can hand it to the notify function —
-- CREATE OR REPLACE cannot change a return type, so this drops and recreates
-- the exact 0007 body with one addition (`returning id into v_id`).
drop function if exists submit_contact_message(jsonb);

create function submit_contact_message(payload jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name    text := btrim(coalesce(payload->>'name', ''));
  v_email   text := btrim(coalesce(payload->>'email', ''));
  v_phone   text := btrim(coalesce(payload->>'phone', ''));
  v_subject text := btrim(coalesce(payload->>'subject', ''));
  v_message text := btrim(coalesce(payload->>'message', ''));
  v_recent  integer;
  v_id      uuid;
begin
  if length(v_name) < 2 or length(v_name) > 80 then
    raise exception 'ERR_INVALID_INPUT: name';
  end if;
  if v_email <> '' and (length(v_email) > 120 or v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[a-zA-Z]{2,}$') then
    raise exception 'ERR_INVALID_INPUT: email';
  end if;
  if v_phone <> '' and v_phone !~ '^0[5-7][0-9]{8}$' then
    raise exception 'ERR_INVALID_INPUT: phone';
  end if;
  if v_email = '' and v_phone = '' then
    raise exception 'ERR_INVALID_INPUT: contact';
  end if;
  if length(v_message) < 10 or length(v_message) > 2000 then
    raise exception 'ERR_INVALID_INPUT: message';
  end if;

  -- throttle on whichever identity was given (5 per hour)
  select count(*) into v_recent
  from contact_messages
  where created_at > now() - interval '1 hour'
    and ((v_email <> '' and email = v_email) or (v_phone <> '' and phone = v_phone));

  if v_recent >= 5 then
    raise exception 'ERR_RATE_LIMIT: too many messages';
  end if;

  insert into contact_messages (name, email, phone, subject, message)
  values (v_name, nullif(v_email, ''), nullif(v_phone, ''),
          nullif(left(v_subject, 120), ''), left(v_message, 2000))
  returning id into v_id;

  return v_id;
end;
$$;

revoke execute on function submit_contact_message(jsonb) from public;
grant  execute on function submit_contact_message(jsonb) to anon;
