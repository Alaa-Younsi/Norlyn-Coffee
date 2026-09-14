-- Three starter reviews for the storefront's testimonial section, requested
-- directly by the client so /avis isn't empty at launch. `active = true` so
-- they show immediately; editable/removable from Admin → Avis like any other.
insert into client_reviews (client_name, stars, review_text, active) values
  ('Amina B.', 5,
   'Le café Moriva a changé mes matins ! L''arôme est intense et la capsule bio en aluminium se recycle facilement. Livraison rapide sur Alger, payée à la réception comme promis.',
   true),
  ('Yacine K.', 5,
   'Enfin un espresso à la hauteur des capsules importées, mais fabriqué ici. Le dosage est parfaitement calibré, aucune amertume. Je recommande l''intensité forte.',
   true),
  ('Sarah M.', 4,
   'Très bon goût et packaging soigné. Un seul bémol : j''aurais aimé plus de choix d''arômes, mais la qualité est vraiment au rendez-vous.',
   true);
