import type { Lang } from "@/types/db";

/**
 * The legal pages — notice, privacy, terms of sale, cookies — in FR / AR / EN.
 *
 * Written for an Algerian online shop selling on cash-on-delivery:
 *  - Loi n° 18-07 du 10 juin 2018 (protection des personnes physiques dans le
 *    traitement des données à caractère personnel) — privacy;
 *  - Loi n° 18-05 du 10 mai 2018 (commerce électronique) — terms of sale;
 *  - Loi n° 09-03 du 25 février 2009 (protection du consommateur).
 *
 * ⚠ TO COMPLETE BEFORE LAUNCH — every `[…]` placeholder below (legal form,
 * registered address, RC / NIF / NIS numbers, publication director). They are
 * the client's company identifiers and must not be invented. This is a solid
 * template, not legal advice: have it reviewed by the client's counsel.
 *
 * `{email}` and `{phone}` are filled from src/lib/contact.ts at render time,
 * so the contact details exist in one place only.
 */

export type LegalSlug = "mentions-legales" | "confidentialite" | "conditions-de-vente" | "cookies";

export interface LegalSection {
  h: string;
  p: string[];
}

export interface LegalDoc {
  slug: LegalSlug;
  title: Record<Lang, string>;
  intro: Record<Lang, string>;
  sections: Record<Lang, LegalSection[]>;
}

/** date of the current wording, shown on every page */
export const LEGAL_UPDATED = "2026-11-13";

export const LEGAL_ORDER: LegalSlug[] = ["mentions-legales", "conditions-de-vente", "confidentialite", "cookies"];

export const LEGAL_DOCS: Record<LegalSlug, LegalDoc> = {
  /* ------------------------------------------------------------- notice */
  "mentions-legales": {
    slug: "mentions-legales",
    title: { fr: "Mentions légales", ar: "الإشعارات القانونية", en: "Legal notice" },
    intro: {
      fr: "Les informations qui identifient l’éditeur de ce site et ses prestataires techniques.",
      ar: "المعلومات التي تعرّف بناشر هذا الموقع ومزوّديه التقنيين.",
      en: "The information identifying the publisher of this website and its technical providers.",
    },
    sections: {
      fr: [
        {
          h: "Éditeur du site",
          p: [
            "Le site est édité par Norlyn Coffee, [forme juridique à compléter], au capital de [montant à compléter] DA.",
            "Siège social : [adresse à compléter], Alger, Algérie.",
            "Registre du commerce : [n° RC à compléter] — NIF : [à compléter] — NIS : [à compléter] — Article d’imposition : [à compléter].",
            "Contact : {email} — {phone}.",
            "Directeur de la publication : [nom à compléter].",
          ],
        },
        {
          h: "Marque",
          p: [
            "Moriva est une marque de café en capsules commercialisée par Norlyn Coffee. Les noms, logos, visuels et emballages Moriva et Norlyn sont la propriété de leur titulaire.",
          ],
        },
        {
          h: "Hébergement",
          p: [
            "Le site est hébergé par Vercel Inc., 340 S Lemon Ave #4133, Walnut, CA 91789, États-Unis.",
            "Les données de la boutique (commandes, messages, abonnements) sont stockées chez Supabase Inc., prestataire de base de données.",
          ],
        },
        {
          h: "Propriété intellectuelle",
          p: [
            "L’ensemble du contenu de ce site — textes, photographies, vidéos, animations, logos et code — est protégé. Toute reproduction ou réutilisation, même partielle, sans autorisation écrite préalable de Norlyn Coffee est interdite.",
          ],
        },
        {
          h: "Responsabilité",
          p: [
            "Norlyn Coffee s’efforce de tenir les informations de ce site exactes et à jour, notamment les prix et la disponibilité, mais ne peut garantir l’absence d’erreur. En cas d’écart, les informations confirmées lors de l’appel de confirmation de commande font foi.",
          ],
        },
        {
          h: "Conception",
          p: ["Conception et développement du site : Alaa Younsi."],
        },
      ],
      ar: [
        {
          h: "ناشر الموقع",
          p: [
            "يُنشر هذا الموقع من طرف نورلين كوفي، [الشكل القانوني يُستكمل]، برأسمال قدره [المبلغ يُستكمل] دج.",
            "المقر الاجتماعي: [العنوان يُستكمل]، الجزائر العاصمة، الجزائر.",
            "السجل التجاري: [رقم السجل يُستكمل] — الرقم الجبائي (NIF): [يُستكمل] — الرقم الإحصائي (NIS): [يُستكمل] — مادة الضريبة: [يُستكمل].",
            "الاتصال: {email} — {phone}.",
            "مدير النشر: [الاسم يُستكمل].",
          ],
        },
        {
          h: "العلامة التجارية",
          p: [
            "موريفا علامة قهوة في كبسولات تسوّقها نورلين كوفي. أسماء وشعارات وصور وتغليف موريفا ونورلين ملك لأصحابها.",
          ],
        },
        {
          h: "الاستضافة",
          p: [
            "يستضيف الموقع شركة Vercel Inc.، ‏340 S Lemon Ave #4133, Walnut, CA 91789، الولايات المتحدة الأمريكية.",
            "تُخزَّن بيانات المتجر (الطلبات، الرسائل، الاشتراكات) لدى Supabase Inc.، مزوّد قاعدة البيانات.",
          ],
        },
        {
          h: "الملكية الفكرية",
          p: [
            "جميع محتويات هذا الموقع — النصوص والصور والفيديوهات والرسوم المتحركة والشعارات والبرمجيات — محمية. يُمنع أي نسخ أو إعادة استعمال، ولو جزئياً، دون إذن كتابي مسبق من نورلين كوفي.",
          ],
        },
        {
          h: "المسؤولية",
          p: [
            "تحرص نورلين كوفي على دقة معلومات هذا الموقع وتحديثها، لا سيما الأسعار والتوفر، دون أن تضمن خلوّها من الأخطاء. في حال وجود اختلاف، يُعتمد ما يتم تأكيده خلال مكالمة تأكيد الطلب.",
          ],
        },
        {
          h: "التصميم",
          p: ["تصميم الموقع وتطويره: علاء يونسي."],
        },
      ],
      en: [
        {
          h: "Publisher",
          p: [
            "This website is published by Norlyn Coffee, [legal form to complete], with a share capital of [amount to complete] DZD.",
            "Registered office: [address to complete], Algiers, Algeria.",
            "Trade register: [RC no. to complete] — NIF: [to complete] — NIS: [to complete] — Tax article: [to complete].",
            "Contact: {email} — {phone}.",
            "Publication director: [name to complete].",
          ],
        },
        {
          h: "Brand",
          p: [
            "Moriva is a capsule coffee brand sold by Norlyn Coffee. The Moriva and Norlyn names, logos, visuals and packaging belong to their owner.",
          ],
        },
        {
          h: "Hosting",
          p: [
            "The website is hosted by Vercel Inc., 340 S Lemon Ave #4133, Walnut, CA 91789, United States.",
            "Shop data (orders, messages, subscriptions) is stored with Supabase Inc., the database provider.",
          ],
        },
        {
          h: "Intellectual property",
          p: [
            "All content on this website — text, photographs, videos, animations, logos and code — is protected. Any reproduction or reuse, even partial, without Norlyn Coffee’s prior written consent is prohibited.",
          ],
        },
        {
          h: "Liability",
          p: [
            "Norlyn Coffee keeps the information on this website accurate and up to date, prices and availability in particular, but cannot guarantee it is free of errors. In case of a discrepancy, what is confirmed during the order confirmation call prevails.",
          ],
        },
        {
          h: "Design",
          p: ["Website design and development: Alaa Younsi."],
        },
      ],
    },
  },

  /* ------------------------------------------------------ terms of sale */
  "conditions-de-vente": {
    slug: "conditions-de-vente",
    title: { fr: "Conditions générales de vente", ar: "الشروط العامة للبيع", en: "Terms of sale" },
    intro: {
      fr: "Les règles qui s’appliquent à chaque commande passée sur ce site, conformément à la loi n° 18-05 du 10 mai 2018 relative au commerce électronique.",
      ar: "القواعد المطبقة على كل طلب يتم عبر هذا الموقع، وفقاً للقانون رقم 18-05 المؤرخ في 10 ماي 2018 المتعلق بالتجارة الإلكترونية.",
      en: "The rules that apply to every order placed on this website, in accordance with Algerian Law No. 18-05 of 10 May 2018 on e-commerce.",
    },
    sections: {
      fr: [
        {
          h: "1. Objet",
          p: [
            "Les présentes conditions régissent la vente en ligne des capsules de café Moriva par Norlyn Coffee (le « vendeur ») à toute personne passant commande sur ce site (le « client »). Passer commande vaut acceptation de ces conditions.",
          ],
        },
        {
          h: "2. Produits",
          p: [
            "Les produits sont décrits le plus fidèlement possible (intensité, dosage, composition). Les photographies sont non contractuelles. Les offres sont valables dans la limite des stocks disponibles.",
          ],
        },
        {
          h: "3. Prix",
          p: [
            "Les prix sont indiqués en dinars algériens (DA), toutes taxes comprises. Les frais de livraison dépendent de la wilaya et du mode de livraison (à domicile ou au bureau) ; ils sont affichés avant la validation de la commande. Le prix facturé est celui en vigueur au moment de la commande, recalculé par notre serveur.",
          ],
        },
        {
          h: "4. Commande",
          p: [
            "Le client choisit ses produits, puis renseigne son nom, son numéro de téléphone, sa wilaya, sa commune et le mode de livraison. Un numéro de commande lui est attribué.",
            "Chaque commande est confirmée par un appel téléphonique de notre équipe. Une commande qui ne peut être confirmée (numéro injoignable, informations erronées) peut être annulée.",
          ],
        },
        {
          h: "5. Paiement",
          p: [
            "Le paiement s’effectue en espèces à la livraison, en main propre, au livreur. Aucun paiement n’est demandé en ligne.",
          ],
        },
        {
          h: "6. Livraison",
          p: [
            "Nous livrons dans les 69 wilayas, à domicile ou au bureau du transporteur. Les délais communiqués lors de la confirmation sont indicatifs et peuvent varier selon la wilaya.",
            "Le client vérifie l’état du colis à la réception. En cas de colis endommagé, il peut le refuser et doit nous en informer sans délai.",
          ],
        },
        {
          h: "7. Produit non conforme ou défectueux",
          p: [
            "Conformément à l’article 23 de la loi n° 18-05, en cas de livraison d’un produit non conforme à la commande ou défectueux, le client nous le retourne dans un délai de quatre (4) jours ouvrables à compter de la livraison, dans son emballage d’origine. Nous procédons alors, à son choix, à une nouvelle livraison conforme, à la réparation, à l’échange ou au remboursement, les frais de retour étant à notre charge.",
            "Pour des raisons d’hygiène et de conservation, une boîte de capsules ouverte ne peut être reprise que si elle est défectueuse.",
          ],
        },
        {
          h: "8. Données personnelles",
          p: [
            "Les informations fournies lors de la commande servent uniquement à la traiter et à la livrer. Leur traitement est décrit dans notre politique de confidentialité.",
          ],
        },
        {
          h: "9. Réclamations et litiges",
          p: [
            "Pour toute question ou réclamation : {email} ou {phone}. Les présentes conditions sont soumises au droit algérien. À défaut de solution amiable, tout litige relève des juridictions compétentes d’Alger.",
          ],
        },
      ],
      ar: [
        {
          h: "1. الموضوع",
          p: [
            "تنظّم هذه الشروط البيع عبر الإنترنت لكبسولات قهوة موريفا من طرف نورلين كوفي (« البائع ») لكل شخص يقدّم طلباً عبر هذا الموقع (« الزبون »). يُعدّ تقديم الطلب قبولاً لهذه الشروط.",
          ],
        },
        {
          h: "2. المنتجات",
          p: [
            "توصف المنتجات بأكبر قدر ممكن من الدقة (الشدة، الجرعة، التركيبة). الصور غير تعاقدية. العروض صالحة في حدود المخزون المتوفر.",
          ],
        },
        {
          h: "3. الأسعار",
          p: [
            "الأسعار معروضة بالدينار الجزائري (دج) شاملة لجميع الرسوم. تتوقف مصاريف التوصيل على الولاية ونمط التوصيل (إلى المنزل أو إلى المكتب)، وتُعرض قبل تأكيد الطلب. السعر المعتمد هو السعر الساري وقت الطلب، ويُعاد حسابه من طرف خادمنا.",
          ],
        },
        {
          h: "4. الطلب",
          p: [
            "يختار الزبون منتجاته ثم يدخل اسمه ورقم هاتفه وولايته وبلديته ونمط التوصيل، ويُمنح رقم طلب.",
            "يؤكد فريقنا كل طلب بمكالمة هاتفية. يمكن إلغاء الطلب الذي يتعذر تأكيده (رقم لا يرد أو معلومات خاطئة).",
          ],
        },
        {
          h: "5. الدفع",
          p: ["يتم الدفع نقداً عند الاستلام، يداً بيد، لعون التوصيل. لا يُطلب أي دفع عبر الإنترنت."],
        },
        {
          h: "6. التوصيل",
          p: [
            "نوصل إلى 69 ولاية، إلى المنزل أو إلى مكتب الناقل. المدد المبلغة عند التأكيد تقريبية وقد تختلف حسب الولاية.",
            "يتحقق الزبون من حالة الطرد عند الاستلام، ويمكنه رفض الطرد التالف مع إعلامنا بذلك دون تأخير.",
          ],
        },
        {
          h: "7. المنتج غير المطابق أو المعيب",
          p: [
            "طبقاً للمادة 23 من القانون رقم 18-05، في حال تسليم منتج غير مطابق للطلب أو معيب، يعيده الزبون إلينا في أجل أربعة (4) أيام عمل ابتداءً من تاريخ التسليم، في غلافه الأصلي. ونقوم حينها، حسب اختياره، بتسليم جديد مطابق أو بالإصلاح أو الاستبدال أو استرجاع المبلغ، وتكون مصاريف الإرجاع على عاتقنا.",
            "لأسباب صحية ولضمان الحفظ، لا تُسترجع علبة كبسولات مفتوحة إلا إذا كانت معيبة.",
          ],
        },
        {
          h: "8. المعطيات الشخصية",
          p: [
            "تُستعمل المعلومات المقدمة عند الطلب فقط لمعالجته وتوصيله، وتُوضَّح معالجتها في سياسة الخصوصية.",
          ],
        },
        {
          h: "9. الشكاوى والنزاعات",
          p: [
            "لأي سؤال أو شكوى: {email} أو {phone}. تخضع هذه الشروط للقانون الجزائري، وفي غياب حل ودي يعود الاختصاص إلى الجهات القضائية المختصة بالجزائر العاصمة.",
          ],
        },
      ],
      en: [
        {
          h: "1. Purpose",
          p: [
            "These terms govern the online sale of Moriva coffee capsules by Norlyn Coffee (the “seller”) to anyone placing an order on this website (the “customer”). Placing an order means accepting these terms.",
          ],
        },
        {
          h: "2. Products",
          p: [
            "Products are described as accurately as possible (intensity, dose, composition). Photographs are not contractual. Offers are valid while stocks last.",
          ],
        },
        {
          h: "3. Prices",
          p: [
            "Prices are shown in Algerian dinars (DZD), all taxes included. Delivery fees depend on the wilaya and the delivery method (home or pickup office) and are shown before the order is confirmed. The price charged is the one in force when the order is placed, recalculated by our server.",
          ],
        },
        {
          h: "4. Ordering",
          p: [
            "The customer chooses their products, then enters their name, phone number, wilaya, municipality and delivery method, and receives an order number.",
            "Every order is confirmed by a phone call from our team. An order that cannot be confirmed (unreachable number, incorrect details) may be cancelled.",
          ],
        },
        {
          h: "5. Payment",
          p: ["Payment is made in cash on delivery, in hand, to the courier. No online payment is ever requested."],
        },
        {
          h: "6. Delivery",
          p: [
            "We deliver to all 69 wilayas, to your door or to the carrier’s pickup office. Delivery times given during confirmation are indicative and may vary by wilaya.",
            "The customer checks the parcel on receipt and may refuse a damaged parcel, informing us without delay.",
          ],
        },
        {
          h: "7. Non-conforming or defective products",
          p: [
            "Under Article 23 of Law No. 18-05, if a product delivered does not match the order or is defective, the customer returns it to us within four (4) working days of delivery, in its original packaging. We then, at the customer’s choice, deliver a conforming product, repair, exchange or refund it, with return costs borne by us.",
            "For hygiene and freshness reasons, an opened box of capsules can only be taken back if it is defective.",
          ],
        },
        {
          h: "8. Personal data",
          p: [
            "The details provided with an order are used only to process and deliver it. How they are handled is described in our privacy policy.",
          ],
        },
        {
          h: "9. Complaints and disputes",
          p: [
            "For any question or complaint: {email} or {phone}. These terms are governed by Algerian law. Failing an amicable solution, any dispute falls under the competent courts of Algiers.",
          ],
        },
      ],
    },
  },

  /* ------------------------------------------------------------ privacy */
  confidentialite: {
    slug: "confidentialite",
    title: { fr: "Politique de confidentialité", ar: "سياسة الخصوصية", en: "Privacy policy" },
    intro: {
      fr: "Quelles données nous recueillons, pourquoi, combien de temps, et comment exercer vos droits — conformément à la loi n° 18-07 du 10 juin 2018.",
      ar: "ما هي المعطيات التي نجمعها، ولماذا، وإلى متى، وكيف تمارسون حقوقكم — طبقاً للقانون رقم 18-07 المؤرخ في 10 جوان 2018.",
      en: "What data we collect, why, for how long, and how to exercise your rights — in accordance with Algerian Law No. 18-07 of 10 June 2018.",
    },
    sections: {
      fr: [
        {
          h: "Responsable du traitement",
          p: ["Norlyn Coffee, [adresse à compléter], Alger — joignable à {email}."],
        },
        {
          h: "Données recueillies",
          p: [
            "Commande : nom, numéro de téléphone, wilaya, commune, mode de livraison et contenu du panier.",
            "Newsletter : adresse e-mail, si vous vous inscrivez.",
            "Formulaire de contact : nom, e-mail, téléphone (facultatif) et message.",
            "Nous ne recueillons aucune donnée bancaire : le paiement se fait à la livraison.",
          ],
        },
        {
          h: "Finalités",
          p: [
            "Traiter, confirmer et livrer vos commandes ; répondre à vos messages ; vous envoyer la newsletter si vous l’avez demandée ; et, uniquement avec votre accord, mesurer l’efficacité de nos publicités (voir la politique de cookies).",
          ],
        },
        {
          h: "Destinataires",
          p: [
            "Vos données sont accessibles à l’équipe Norlyn Coffee habilitée et au transporteur pour la seule livraison. Elles sont hébergées par nos prestataires techniques (Vercel, Supabase). Nous ne vendons ni ne louons vos données.",
          ],
        },
        {
          h: "Durée de conservation",
          p: [
            "Commandes : le temps nécessaire à leur traitement, puis selon nos obligations comptables et fiscales. Newsletter : jusqu’à votre désinscription. Messages : le temps de vous répondre et d’assurer le suivi.",
          ],
        },
        {
          h: "Vos droits",
          p: [
            "Vous disposez d’un droit d’information, d’accès, de rectification et d’opposition sur vos données. Pour l’exercer, écrivez-nous à {email} ; nous répondons dans les meilleurs délais.",
            "Vous pouvez également saisir l’Autorité nationale de protection des données à caractère personnel (ANPDP).",
          ],
        },
        {
          h: "Sécurité",
          p: [
            "Le site est servi en HTTPS, l’accès aux données de la boutique est restreint aux comptes autorisés, et les prix sont toujours recalculés par notre serveur.",
          ],
        },
      ],
      ar: [
        {
          h: "المسؤول عن المعالجة",
          p: ["نورلين كوفي، [العنوان يُستكمل]، الجزائر العاصمة — للتواصل: {email}."],
        },
        {
          h: "المعطيات المجمّعة",
          p: [
            "الطلب: الاسم، رقم الهاتف، الولاية، البلدية، نمط التوصيل ومحتوى السلة.",
            "النشرة البريدية: البريد الإلكتروني في حال الاشتراك.",
            "نموذج الاتصال: الاسم، البريد الإلكتروني، الهاتف (اختياري) والرسالة.",
            "لا نجمع أي معطيات بنكية: الدفع يتم عند الاستلام.",
          ],
        },
        {
          h: "الأغراض",
          p: [
            "معالجة طلباتكم وتأكيدها وتوصيلها؛ الرد على رسائلكم؛ إرسال النشرة البريدية إن طلبتموها؛ وقياس فعالية إعلاناتنا بموافقتكم فقط (انظر سياسة ملفات تعريف الارتباط).",
          ],
        },
        {
          h: "المتلقّون",
          p: [
            "يطّلع على معطياتكم فريق نورلين كوفي المخوّل والناقل لغرض التوصيل فقط، وتُستضاف لدى مزوّدينا التقنيين (Vercel وSupabase). لا نبيع معطياتكم ولا نؤجرها.",
          ],
        },
        {
          h: "مدة الحفظ",
          p: [
            "الطلبات: المدة اللازمة لمعالجتها ثم حسب التزاماتنا المحاسبية والجبائية. النشرة: إلى غاية إلغاء الاشتراك. الرسائل: المدة اللازمة للرد والمتابعة.",
          ],
        },
        {
          h: "حقوقكم",
          p: [
            "لكم حق الإعلام والاطلاع والتصحيح والاعتراض على معطياتكم. لممارسته راسلونا على {email}، ونرد في أقرب الآجال.",
            "كما يمكنكم إخطار السلطة الوطنية لحماية المعطيات ذات الطابع الشخصي.",
          ],
        },
        {
          h: "الأمان",
          p: [
            "يُقدَّم الموقع عبر HTTPS، ويقتصر الوصول إلى معطيات المتجر على الحسابات المخوّلة، ويُعاد حساب الأسعار دائماً من طرف خادمنا.",
          ],
        },
      ],
      en: [
        {
          h: "Data controller",
          p: ["Norlyn Coffee, [address to complete], Algiers — reachable at {email}."],
        },
        {
          h: "Data we collect",
          p: [
            "Orders: name, phone number, wilaya, municipality, delivery method and basket contents.",
            "Newsletter: your email address, if you subscribe.",
            "Contact form: name, email, phone (optional) and message.",
            "We never collect bank details: payment is made on delivery.",
          ],
        },
        {
          h: "Purposes",
          p: [
            "To process, confirm and deliver your orders; answer your messages; send you the newsletter if you asked for it; and, only with your consent, measure how well our advertising works (see the cookie policy).",
          ],
        },
        {
          h: "Recipients",
          p: [
            "Your data is accessible to authorised Norlyn Coffee staff and to the courier for delivery only. It is hosted by our technical providers (Vercel, Supabase). We never sell or rent your data.",
          ],
        },
        {
          h: "Retention",
          p: [
            "Orders: as long as needed to process them, then as required by our accounting and tax obligations. Newsletter: until you unsubscribe. Messages: as long as needed to reply and follow up.",
          ],
        },
        {
          h: "Your rights",
          p: [
            "You have the right to information, access, rectification and objection regarding your data. To exercise it, write to {email}; we reply as quickly as possible.",
            "You may also contact Algeria’s national personal data protection authority (ANPDP).",
          ],
        },
        {
          h: "Security",
          p: [
            "The website is served over HTTPS, access to shop data is restricted to authorised accounts, and prices are always recalculated by our server.",
          ],
        },
      ],
    },
  },

  /* ------------------------------------------------------------ cookies */
  cookies: {
    slug: "cookies",
    title: { fr: "Politique de cookies", ar: "سياسة ملفات تعريف الارتباط", en: "Cookie policy" },
    intro: {
      fr: "Ce que ce site enregistre sur votre appareil, et ce que vous pouvez refuser.",
      ar: "ما يحفظه هذا الموقع على جهازكم، وما يمكنكم رفضه.",
      en: "What this website stores on your device, and what you can refuse.",
    },
    sections: {
      fr: [
        {
          h: "Essentiels — toujours actifs",
          p: [
            "Ils font fonctionner la boutique et ne quittent jamais votre appareil : votre panier (norlyn-cart), votre langue (norlyn-lang) et votre choix concernant les cookies (norlyn-consent). Ils ne servent à aucun suivi.",
          ],
        },
        {
          h: "Mesure et publicité — avec votre accord",
          p: [
            "Si vous les acceptez, le pixel Meta (Meta Platforms Ireland Ltd.) mesure les visites et les commandes issues de nos publicités sur Facebook et Instagram. Il peut déposer ses propres cookies (par exemple _fbp).",
            "Si vous les refusez, aucun pixel n’est chargé et aucune donnée n’est envoyée à Meta.",
          ],
        },
        {
          h: "Changer d’avis",
          p: [
            "Vous pouvez modifier votre choix à tout moment avec le lien « Gérer les cookies » en bas de chaque page, ou effacer les données du site dans votre navigateur.",
          ],
        },
      ],
      ar: [
        {
          h: "الأساسية — مفعّلة دائماً",
          p: [
            "تُشغّل المتجر ولا تغادر جهازكم أبداً: سلتكم (norlyn-cart)، لغتكم (norlyn-lang) واختياركم بشأن ملفات تعريف الارتباط (norlyn-consent). لا تُستعمل لأي تتبع.",
          ],
        },
        {
          h: "القياس والإعلان — بموافقتكم",
          p: [
            "إذا قبلتموها، يقيس بكسل ميتا (Meta Platforms Ireland Ltd.) الزيارات والطلبات القادمة من إعلاناتنا على فيسبوك وإنستغرام، وقد يضع ملفاته الخاصة (مثل _fbp).",
            "إذا رفضتموها، لا يُحمَّل أي بكسل ولا تُرسل أي معطيات إلى ميتا.",
          ],
        },
        {
          h: "تغيير الاختيار",
          p: [
            "يمكنكم تعديل اختياركم في أي وقت عبر رابط « إدارة ملفات تعريف الارتباط » أسفل كل صفحة، أو مسح بيانات الموقع من متصفحكم.",
          ],
        },
      ],
      en: [
        {
          h: "Essential — always on",
          p: [
            "They make the shop work and never leave your device: your basket (norlyn-cart), your language (norlyn-lang) and your cookie choice (norlyn-consent). They are never used for tracking.",
          ],
        },
        {
          h: "Measurement and advertising — with your consent",
          p: [
            "If you accept them, the Meta pixel (Meta Platforms Ireland Ltd.) measures visits and orders that come from our ads on Facebook and Instagram. It may set its own cookies (for example _fbp).",
            "If you refuse, no pixel is loaded and no data is sent to Meta.",
          ],
        },
        {
          h: "Changing your mind",
          p: [
            "You can change your choice at any time with the “Manage cookies” link at the bottom of every page, or clear this site’s data in your browser.",
          ],
        },
      ],
    },
  },
};

export function isLegalSlug(value: string | undefined): value is LegalSlug {
  return !!value && value in LEGAL_DOCS;
}
