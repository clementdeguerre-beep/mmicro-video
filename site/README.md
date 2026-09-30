# Site MMICRO Multiservices

Site vitrine d'une page : présentation de l'activité et formulaire de demande de rappel. Chaque demande arrive par e-mail. Pas de base de données, pas de compte client, pas de paiement.

---

## 1. Ce qu'il y a dans le dossier

| Élément | À quoi il sert |
|---|---|
| `index.html` | La page d'accueil. **Tous les textes du site sont ici.** |
| `mentions-legales.html` | Mentions légales (champs à compléter) |
| `confidentialite.html` | Politique de confidentialité (champs à compléter) |
| `404.html` | Page affichée quand un lien est erroné |
| `images/` | Vos photos (réalisations, photo pleine largeur) |
| `assets/css/styles.css` | Le design (couleurs, tailles, mise en page) |
| `assets/js/main.js` | Le menu mobile et l'envoi du formulaire |
| `assets/fonts/` | Les polices, hébergées sur le site (aucun appel à Google) |
| `assets/logo/` | Le logo en SVG (versions complète, horizontale, blanche, icône) et le PDF d'origine |
| `robots.txt`, `sitemap.xml` | Fichiers pour Google |
| `favicon.ico`, `favicon.svg`, `apple-touch-icon.png`, `site.webmanifest`, `assets/icons/` | Icônes de l'onglet et de l'écran d'accueil |
| `og-image.png` | Image affichée quand on partage le lien (WhatsApp, Facebook, LinkedIn…) |

---

## 2. Avant la mise en ligne publique (obligatoire)

- [ ] **Société immatriculée** : ouvrez `mentions-legales.html` et `confidentialite.html`, cherchez `[` et remplacez chaque champ entre crochets. Il ne doit plus en rester un seul.
- [ ] **Clé du formulaire** renseignée dans `index.html` (voir section 3).
- [ ] **Nom de domaine** `mmicromultiservices.com` acheté et **adresse contact@** active (voir section 4).
- [ ] **Engagements validés** : le délai « 24 h » et les réponses de la FAQ (paiement, délais, fournitures) correspondent à ce que vous pouvez tenir.
- [ ] **Test réel** : une demande envoyée depuis le site en ligne arrive bien dans votre boîte mail.

Un site professionnel qui collecte des coordonnées doit afficher l'identité de l'entreprise : ne rendez pas l'adresse publique tant que les mentions légales sont incomplètes.

---

## 3. Brancher le formulaire (Web3Forms, gratuit)

1. Allez sur **web3forms.com**, saisissez l'adresse qui doit recevoir les demandes (contact@mmicromultiservices.com, ou votre Gmail en attendant), puis créez votre clé d'accès. Elle vous est envoyée par e-mail.
2. Ouvrez `index.html`, cherchez `VOTRE_CLE_WEB3FORMS` et remplacez-le par votre clé. Enregistrez.
3. Remettez le site en ligne (section 4), puis faites un essai.

Tant que la clé n'est pas renseignée, le formulaire fonctionne en **mode démonstration** : il vérifie les champs, affiche la confirmation, mais **n'envoie rien** (un message l'indique).

Cette clé n'est pas un mot de passe : Web3Forms la place volontairement dans le code du formulaire, c'est leur méthode standard.

**Ce que vous recevez** : un e-mail « Nouvelle demande de rappel – [type] – [commune] » avec prénom, nom, téléphone, e-mail, commune, type de besoin, urgence, créneau de rappel, description et date du consentement. Si le client a donné son e-mail, il suffit de cliquer sur « Répondre ».

**Limites de l'offre gratuite** : 250 demandes par mois, pas d'envoi de photos, pas d'accusé de réception automatique au client. Ces deux options demandent l'offre Pro.

**Anti-spam** : case piège invisible + filtre anti-spam de Web3Forms. Si vous recevez des spams, Web3Forms propose un captcha hCaptcha gratuit ; il faudra alors le mentionner dans la politique de confidentialité.

---

## 4. Mettre le site en ligne (Cloudflare Pages, gratuit)

### Première mise en ligne
1. Créez un compte gratuit sur **cloudflare.com**.
2. Dans le tableau de bord : **Workers & Pages** → **Create application** → **Get started** → **Drag and drop your files**.
3. Donnez un nom au projet (par exemple `mmicro`), glissez **le dossier du site** (celui qui contient `index.html`) ou son fichier ZIP, puis cliquez sur **Deploy site**.
4. Le site est en ligne à l'adresse `https://mmicro.pages.dev` (HTTPS inclus). Cette adresse sert aux essais.

Les intitulés du tableau de bord peuvent varier légèrement selon les mises à jour de Cloudflare.

### Brancher le nom de domaine
1. Achetez `mmicromultiservices.com` (chez Cloudflare directement, ou chez un autre registraire comme OVH).
2. Dans le projet Pages : **Custom domains** → ajoutez `mmicromultiservices.com`, puis `www.mmicromultiservices.com`. Suivez les instructions affichées. Le certificat HTTPS est créé automatiquement.

### Créer l'adresse contact@
Si le domaine est géré par Cloudflare, activez **Email Routing** (gratuit) : créez l'adresse `contact@mmicromultiservices.com` et faites-la suivre vers votre boîte habituelle (Gmail par exemple). Email Routing reçoit et transfère les e-mails, mais n'en envoie pas : pour **écrire** depuis contact@, il faudra une vraie boîte mail (offre e-mail de votre registraire, Google Workspace…).

### Publier une modification
Dans le projet Pages : **Create a new deployment**, puis glissez à nouveau le dossier complet.

### Alternative : Netlify
Même principe par glisser-déposer, avec un formulaire intégré. Mais l'offre gratuite est plafonnée à 300 crédits par mois (environ 15 crédits par mise en ligne, 20 crédits par Go de trafic) : si les crédits sont épuisés, le site est suspendu jusqu'au mois suivant. Cloudflare Pages est plus sûr pour un site d'entreprise.

---

## 5. Modifier un texte

1. Ouvrez `index.html` avec un éditeur de texte : **Visual Studio Code** (gratuit) est le plus confortable. Évitez Word.
2. Cherchez la phrase à modifier (Ctrl + F, ou Cmd + F sur Mac).
3. Modifiez uniquement le texte entre les balises. Ne touchez pas aux signes `<`, `>` et aux guillemets `"`.
4. Enregistrez, vérifiez en ouvrant `index.html` dans votre navigateur, puis publiez (section 4).

Bon à savoir :
- `&nbsp;` est une espace insécable (avant `:`, `?`, `!`). Gardez-la.
- Chaque section commence par un commentaire en majuscules, par exemple `<!-- ============ SERVICES ============ -->`, pour vous repérer.

**Changer le téléphone ou l'e-mail** : utilisez « Remplacer dans les fichiers » de votre éditeur sur tout le dossier. Le numéro apparaît sous trois formes : `06 46 48 55 64`, `+33646485564` et `tel:+33646485564`. Pensez aussi à `assets/js/main.js`.

**Changer le délai de rappel (24 h)** : cherchez `24` dans `index.html` (accroche, bulle, chiffre des engagements, étape 2, formulaire, description) et dans `assets/js/main.js` (message de confirmation).

**Changer la liste des communes** : trois endroits dans `index.html` : la liste des communes (section Zone), la liste de suggestions du formulaire (`<datalist>`) et les données pour Google en haut du fichier (`areaServed`). La carte est dessinée à la main : demandez de l'aide pour y ajouter une commune.

---

## 6. Ajouter vos photos

### Section « Réalisations » (avant / après)
1. Préparez 3 paires de photos avant/après, prises **du même endroit, avec le même cadrage**, à la lumière du jour, en format portrait.
2. Réduisez-les à environ 1200 × 1500 px et convertissez-les en WebP avec **squoosh.app** (gratuit, dans le navigateur).
3. Nommez-les `realisation-1-avant.webp`, `realisation-1-apres.webp`, … jusqu'à 3, et déposez-les dans `images/`.
4. Dans `index.html`, section `id="realisations"` : remplacez les textes entre crochets (descriptions `alt`, légendes), puis **supprimez le mot `hidden`** dans la balise `<section …>`.

### Photo pleine largeur
Une grande photo peut s'afficher entre « Pour qui » et « Nos engagements ». Déposez `images/bandeau.webp` (environ 2400 × 1200 px), décrivez-la dans `alt="…"`, puis supprimez le mot `hidden` de la section `bandeau-photo`.

Vos propres photos de chantier inspirent bien plus confiance que des photos de banque d'images. Si vous utilisez une photo libre de droits (Unsplash, Pexels), vérifiez que sa licence autorise l'usage commercial, notez l'auteur dans `CREDITS.md` et ne la présentez jamais comme une de vos réalisations.

---

## 7. Activer les avis clients

1. Créez votre fiche **Google Business Profile** et demandez un avis à chaque client satisfait.
2. Dans `index.html`, section `id="avis"` : copiez le modèle (en commentaire) pour chaque avis **réel**, avec l'accord du client.
3. Remplacez `[LIEN VERS VOTRE FICHE GOOGLE]` et supprimez le mot `hidden`.

N'inventez jamais d'avis : c'est une pratique commerciale trompeuse, interdite par la loi.

---

## 8. Après la mise en ligne

- [ ] **Google Business Profile** : créez la fiche « MMICRO Multiservices », zone desservie Montpellier et alentours, catégorie principale « Peintre en bâtiment » (ou la plus proche proposée), lien vers le site, horaires, photos de chantiers.
- [ ] **Google Search Console** : ajoutez le domaine, validez-le, puis envoyez `https://mmicromultiservices.com/sitemap.xml`.
- [ ] **Premiers avis** : demandez-les dès vos premiers chantiers, idéalement le jour même avec les photos avant/après.
- [ ] **Test du partage** : collez l'adresse du site dans WhatsApp pour vérifier l'image de partage.
- [ ] **Test mobile** : envoyez-vous une demande depuis votre téléphone.

---

## 9. Détails techniques (pour un développeur)

- HTML, CSS et JavaScript sans framework, aucune étape de compilation.
- Le logo et les icônes sont intégrés dans chaque page (sprite SVG en haut du `<body>`).
- Couleurs du logo : vert `#027812`, pétrole `#0D3934`, menthe `#CCF8F6` (variables CSS en tête de `styles.css`).
- Polices : Outfit (titres) et Instrument Sans (textes), variables, sous-ensemble latin, licence SIL OFL 1.1.
- Formulaire : envoi en JSON vers `https://api.web3forms.com/submit` ; le champ `email` sert d'adresse de réponse.
- Aucun cookie, aucun traceur : pas besoin de bandeau cookies.
- Données structurées schema.org `HousePainter`, Open Graph, sitemap, robots, page 404.
