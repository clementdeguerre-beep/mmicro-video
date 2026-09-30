/* =====================================================================
   MMICRO Multiservices — film de présentation
   FICHIER DE CONFIGURATION UNIQUE : textes, durées, couleurs, son.

   Pour modifier le film, changez les valeurs ci-dessous puis relancez
   l'aperçu (npm run studio) ou le rendu (voir README.md).
   - Les durées sont en SECONDES.
   - Gardez les guillemets autour des textes. Espace insécable :
   ===================================================================== */

/* ---------- Couleurs de la marque ---------- */
export const COULEURS = {
  vert: '#027812',
  petrole: '#0D3934',
  menthe: '#CCF8F6',
  blanc: '#FFFFFF',
  // Nuances dérivées, utilisées pour les fonds et les textes secondaires
  noir: '#020706', // noir profond (très légèrement teinté pétrole)
  petroleProfond: '#061E1B',
  petroleClair: '#134841',
  mentheLavis: '#EEFBFA',
  texteSecondaireSombre: '#A9C4C0',
  texteSecondaireClair: '#36524E',
} as const;

/* ---------- Coordonnées ---------- */
export const CONTACT = {
  telephone: '06 46 48 55 64',
  site: 'mmicromultiservices.com',
  zone: 'Montpellier et alentours',
};

/* ---------- Textes affichés, scène par scène ---------- */
export const TEXTES = {
  signature: ['Petits travaux.', 'Grand soin.'],
  services: {
    titre: ['Quatre métiers.', 'Un seul interlocuteur.'],
  },
  nuancier: {
    titre: ['Prix annoncé.', 'Prix payé.'],
    // Nom et finition de chaque nuance, de la première à la dernière
    nuances: [
      { nom: 'Blanc', finition: 'Mat', couleur: '#FFFFFF' },
      { nom: 'Menthe', finition: 'Velours', couleur: '#CCF8F6' },
      { nom: 'Vert', finition: 'Satiné', couleur: '#027812' },
      { nom: 'Pétrole', finition: 'Laqué', couleur: '#0D3934' },
    ],
  },
  rappel: {
    valeur: 24, // le compteur défile jusqu'à ce nombre
    unite: 'h',
    sousTitre: 'pour vous rappeler',
    precision: 'au plus, après votre demande, en jours ouvrés',
  },
  telephone: {
    titre: ['Décrivez votre besoin.', 'Nous vous rappelons.'],
    notification: {
      application: 'E-mail',
      expediteur: 'Site MMICRO Multiservices',
      titre: 'Nouvelle demande de rappel – Peinture – Castelnau-le-Lez',
      heure: 'maintenant',
    },
  },
  zone: {
    titre: 'Montpellier et alentours.',
    anneaux: ['5 km', '10 km'],
    mer: 'Mer Méditerranée',
  },
  fin: {
    signature: ['Petits travaux.', 'Grand soin.'],
  },
};

/* ---------- Durées des scènes (en secondes) ----------
   L'ordre des lignes est l'ordre du film. Les animations d'entrée gardent
   leur vitesse ; une scène plus longue garde simplement ses textes plus
   longtemps à l'écran. */
export const FILM_16_9 = {
  largeur: 1920,
  hauteur: 1080,
  scenes: [
    { id: 'logo', duree: 5 },
    { id: 'signature', duree: 6 },
    { id: 'ordinateur', duree: 8 },
    { id: 'services', duree: 8 },
    { id: 'nuancier', duree: 6 },
    { id: 'rappel', duree: 6 },
    { id: 'telephone', duree: 8 },
    { id: 'zone', duree: 4 },
    { id: 'fin', duree: 4 },
  ],
} as const;

export const FILM_9_16 = {
  largeur: 1080,
  hauteur: 1920,
  scenes: [
    { id: 'logo', duree: 4.5 },
    { id: 'signature', duree: 5 },
    { id: 'services', duree: 5.5 },
    { id: 'rappel', duree: 4.5 },
    { id: 'telephone', duree: 7 },
    { id: 'fin', duree: 4 },
  ],
} as const;

/* Images par seconde */
export const IPS = 60;

/* ---------- Son ---------- */
export const SON = {
  // Fichier de musique dans public/audio/ (null = pas de musique)
  musique: null as string | null,
  volumeMusique: 0.55,
  volumeEffets: 0.9,
};

/* ---------- Réglages de l'image ---------- */
export const IMAGE = {
  grain: 0.07, // intensité du grain (0 = aucun)
  vignettage: 0.55, // assombrissement des bords (0 = aucun)
};
