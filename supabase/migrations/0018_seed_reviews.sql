-- Three starter reviews for the storefront's testimonial section, requested
-- directly by the client so /avis isn't empty at launch. `active = true` so
-- they show immediately; editable/removable from Admin → Avis like any other.
--
-- Guarded with `where not exists`, not a bare INSERT: migrations elsewhere in
-- this project are pasted into the Supabase SQL editor by hand rather than
-- run through a CLI that tracks what already applied, and there is no unique
-- constraint on client_name to lean on — an accidental second paste of this
-- file must not silently double every review.
insert into client_reviews (client_name, stars, review_text, active)
select 'Amina B.', 5,
  'Le café Moriva a changé mes matins ! L''arôme est intense et la capsule bio en aluminium se recycle facilement. Livraison rapide sur Alger, payée à la réception comme promis.',
  true
where not exists (select 1 from client_reviews where client_name = 'Amina B.');

insert into client_reviews (client_name, stars, review_text, active)
select 'Yacine K.', 5,
  'Enfin un espresso à la hauteur des capsules importées, mais fabriqué ici. Le dosage est parfaitement calibré, aucune amertume. Je recommande l''intensité forte.',
  true
where not exists (select 1 from client_reviews where client_name = 'Yacine K.');

insert into client_reviews (client_name, stars, review_text, active)
select 'Sarah M.', 4,
  'Très bon goût et packaging soigné. Un seul bémol : j''aurais aimé plus de choix d''arômes, mais la qualité est vraiment au rendez-vous.',
  true
where not exists (select 1 from client_reviews where client_name = 'Sarah M.');
