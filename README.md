# Film de présentation MMICRO Multiservices

Vidéo en motion design du site MMICRO Multiservices : 55 secondes en 16:9 et 30 secondes en 9:16, 60 images par seconde. Elle est **programmée** avec [Remotion](https://www.remotion.dev) (React) : chaque image est calculée à partir du code et d'un fichier de réglages. Il n'y a donc pas de logiciel de montage à ouvrir. Pour changer un texte, on modifie une ligne, puis on relance le rendu.

---

## 1. Les fichiers livrés (dossier `livrables/`)

| Fichier | Pour quoi faire |
|---|---|
| `MMICRO-Multiservices-16x9.mp4` | Site, YouTube, LinkedIn (1920 × 1080, 55 s) |
| `MMICRO-Multiservices-16x9-sans-musique.mp4` | Même film, seulement les effets sonores |
| `MMICRO-Multiservices-9x16.mp4` | Instagram Reels, TikTok (1080 × 1920, 30,5 s) |
| `MMICRO-Multiservices-9x16-sans-musique.mp4` | Même film vertical, seulement les effets sonores |
| `MMICRO-Multiservices-9x16-whatsapp.mp4` | Version allégée (moins de 15 Mo) pour le statut WhatsApp |
| `MMICRO-Multiservices-16x9-poster.jpg` | Image d'aperçu du film 16:9 (miniature YouTube, vignette du site) |
| `MMICRO-Multiservices-9x16-poster.jpg` | Image d'aperçu du film vertical (couverture du Reel) |
| `rapport-rendu.json` | Mesures du dernier rendu : poids, volume sonore |

La version sans musique sert si vous voulez poser votre propre musique, par exemple celle proposée par Instagram ou TikTok au moment de publier.

---

## 2. Installer le projet (une seule fois)

1. Installez **Node.js** (version 22 ou plus récente) depuis [nodejs.org](https://nodejs.org).
2. Ouvrez un terminal dans ce dossier, puis tapez :

   ```bash
   npm install
   ```

   Cette commande télécharge Remotion et les autres outils (quelques minutes).

---

## 3. Prévisualiser le film

```bash
npm run studio
```

Remotion Studio s'ouvre dans votre navigateur (adresse `http://localhost:3000`). Dans la colonne de gauche :

- **Film-16x9** : le film horizontal ;
- **Film-9x16** : le film vertical ;
- **Poster-16x9**, **Poster-9x16** : les images d'aperçu.

La barre d'espace lance ou arrête la lecture. La ligne de temps en bas montre chaque scène et chaque transition. Les scènes 3D (ordinateur, téléphone) peuvent être moins fluides dans l'aperçu que dans le rendu final : c'est normal.

Studio se met à jour tout seul dès que vous enregistrez une modification.

---

## 4. Changer un texte

Tout se passe dans **un seul fichier : `src/config.ts`**. Ouvrez-le avec un éditeur de texte, par exemple [Visual Studio Code](https://code.visualstudio.com), qui est gratuit. Évitez Word.

1. Cherchez le texte à changer (Ctrl + F, ou Cmd + F sur Mac).
2. Modifiez **uniquement ce qui est entre les guillemets** `'…'`.
3. Enregistrez. L'aperçu se met à jour.

Exemples, dans la partie `TEXTES` :

```ts
signature: ['Petits travaux.', 'Grand soin.'],          // scène 2
services: { titre: ['Quatre métiers.', 'Un seul interlocuteur.'] },
rappel: { valeur: 24, unite: 'h', sousTitre: 'pour vous rappeler', … },
```

Le téléphone, le site et l'adresse se changent dans la partie `CONTACT`.

Bon à savoir :
- Pour mettre une apostrophe dans un texte, écrivez `\'`. Exemple : `'C\'est urgent'`.
- Ce qui s'affiche **dans les écrans** de l'ordinateur et du téléphone vient des **captures du vrai site**. Pour le changer, modifiez le site dans le dossier `site/`, puis refaites les captures (partie 8).
- Un texte beaucoup plus long peut déborder. Vérifiez toujours dans Studio.

---

## 5. Changer une durée

Toujours dans `src/config.ts`, partie `FILM_16_9` (film horizontal) ou `FILM_9_16` (film vertical) :

```ts
{ id: 'nuancier', duree: 6 },   // durée en secondes
```

- Les animations d'entrée gardent leur vitesse. Une scène plus longue laisse simplement ses textes plus longtemps à l'écran.
- Gardez des **multiples de 0,5 seconde** (5 ; 5,5 ; 6…) : la musique est à 120 battements par minute, soit un temps toutes les 0,5 s. Ainsi, chaque scène commence sur un temps.
- Pour changer l'ordre des scènes, déplacez les lignes. Pour retirer une scène, supprimez sa ligne.
- **Après un changement de durée, recomposez la musique** pour qu'elle reste calée :

  ```bash
  npm run sons
  ```

Les effets sonores suivent automatiquement : ils sont placés dans chaque scène, par rapport à son début.

---

## 6. Changer les couleurs

Partie `COULEURS` de `src/config.ts`. Les quatre couleurs de la marque sont `vert`, `petrole`, `menthe` et `blanc`. Les autres sont des nuances dérivées pour les fonds et les textes secondaires. Les couleurs du logo viennent du fichier SVG du logo.

Les réglages `IMAGE.grain` et `IMAGE.vignettage` dosent le grain de pellicule et l'assombrissement des bords.

---

## 7. La musique

Réglage `SON.musique` dans `src/config.ts` :

| Valeur | Résultat |
|---|---|
| `'originale'` (réglage actuel) | Musique composée pour ce film par `scripts/sons.mjs`, calée sur les scènes. Aucun droit à payer. |
| `'mon-fichier.mp3'` | Votre propre musique, déposée dans `public/audio/`. Elle est coupée à la durée du film, avec un fondu final. |
| `null` | Pas de musique |

`SON.volumeMusique` et `SON.volumeEffets` règlent l'équilibre entre la musique et les effets sonores.

### Musiques libres de droits proposées (usage commercial autorisé)

Le serveur qui a fabriqué le film n'avait pas accès à ces sites. Pour utiliser l'une d'elles, téléchargez le MP3, déposez-le dans `public/audio/`, puis indiquez son nom dans `SON.musique`.

| Titre | Artiste · source | Licence | Mention obligatoire |
|---|---|---|---|
| « Here's the Thing » (2:07) | Lee Rosevere · [Free Music Archive](https://freemusicarchive.org/music/lee-rosevere/music-for-podcasts-serious/heres-the-thing/) | CC BY 4.0 | « Here's the Thing » – Lee Rosevere, licence CC BY 4.0 |
| « Minimal Tech » (2:40) | PaulYudin · [Pixabay](https://pixabay.com/music/corporate-minimal-tech-151898/) | Licence de contenu Pixabay | Aucune |
| « Digital Lemonade » (3:00) | Kevin MacLeod · [incompetech.com](https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1700010) | CC BY 4.0 | « Digital Lemonade » Kevin MacLeod (incompetech.com), Licensed under Creative Commons: By Attribution 4.0 |

Avec une licence CC BY, écrivez la mention dans la description de la vidéo. Certaines musiques Pixabay déclenchent parfois une réclamation de droits sur YouTube : gardez votre justificatif de téléchargement pour la contester.

---

## 8. Relancer le rendu

```bash
npm run rendu              # les deux formats (environ 40 minutes)
npm run rendu -- 16x9      # seulement le film horizontal
npm run rendu -- 9x16      # seulement le film vertical
npm run rendu -- 9x16 --brouillon   # aperçu rapide en demi-résolution (dossier out/brouillon/)
```

Les fichiers finaux arrivent dans `livrables/`. Au premier rendu, Remotion télécharge un navigateur sans interface ; c'est automatique.

Autres commandes :

```bash
npm run captures     # refaire les captures du site (après une modification du dossier site/)
npm run sons         # recomposer la musique et les effets sonores
npm run storyboard   # régénérer les planches du storyboard (dossier storyboard/)
```

---

## 9. Ce qu'il y a dans le dossier

| Élément | Rôle |
|---|---|
| `src/config.ts` | **Le fichier à modifier** : textes, durées, couleurs, son |
| `src/Film.tsx` | L'enchaînement des scènes et les transitions |
| `src/scenes/` | Les 9 scènes (S1Logo … S9Fin) |
| `src/composants/` | Logo animé, textes animés, fonds, lumière, écrans du site et du formulaire, notification |
| `src/trois/` | Ordinateur et smartphone génériques en 3D (Three.js), éclairage de studio |
| `src/Posters.tsx` | Les deux images d'aperçu |
| `site/` | Copie du site, utilisée pour les captures |
| `public/captures/` | Captures réelles du site, faites avec Playwright |
| `public/audio/` | Effets sonores et musique, fabriqués par synthèse |
| `public/polices/`, `public/logo/` | Polices Outfit et Instrument Sans (licence OFL), logo SVG |
| `scripts/` | Captures, son, rendu, storyboard, vérifications |
| `storyboard/` | Planches du storyboard |
| `livrables/` | Les vidéos et les posters |

---

## 10. Vérifications faites sur les rendus

Voir la partie « Vérifications » en bas de ce fichier (lisibilité, fluidité, synchronisation du son, volume).

---

## 11. Crédits et licences

- **Logo, textes, captures** : MMICRO Multiservices (site fourni).
- **Polices** : Outfit et Instrument Sans, SIL Open Font License 1.1 (`public/polices/`).
- **Icônes** : celles du site (icône téléphone : Lucide, licence ISC).
- **Musique et effets sonores** : fabriqués par synthèse pour ce film (`scripts/sons.mjs`). Aucun enregistrement extérieur.
- **Appareils** : ordinateur portable et smartphone génériques modélisés pour ce film. Aucun logo, son ou élément de marque d'un fabricant.
- **Données du formulaire** : le prénom et le nom « Camille Martin » sont fictifs. Le téléphone, la description et la commune reprennent les exemples du site. La notification reprend l'objet d'e-mail que produit le formulaire du site : « Nouvelle demande de rappel – [type] – [commune] ».
