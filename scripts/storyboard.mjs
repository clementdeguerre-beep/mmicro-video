/*
 * Planche de storyboard : une image clé par scène (+ trois vignettes de déroulé),
 * avec timecodes, textes à l'écran, mouvements et sons.
 *
 *   node scripts/storyboard.mjs
 *
 * Sortie : storyboard/planche-16x9.png, storyboard/planche-9x16.png, storyboard/index.html
 */
import { execFileSync } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DOSSIER = path.join(RACINE, 'storyboard');
const IMAGES = path.join(DOSSIER, 'images');

const SCENES_16x9 = [
  {
    id: 'logo', titre: 'Ouverture', cle: 4.3, deroule: [0.7, 1.8, 3.0],
    ecran: 'Logo MMICRO Multiservices',
    image: "Noir profond. Un point de lumière verte s'allume, glisse vers le bas et trace l'hexagone du logo côté par côté. L'hexagone se remplit de menthe dans un éclat doux, la maison-marteau apparaît avec un petit rebond, un reflet balaie le logo, puis « MMICRO » et « MULTISERVICES » se resserrent lettre par lettre.",
    son: 'Souffle montant, impact grave au remplissage, scintillement sur le reflet.',
  },
  {
    id: 'signature', titre: 'Signature', cle: 4.2, deroule: [0.8, 1.6, 2.4],
    ecran: '« Petits travaux. » « Grand soin. »',
    image: "Les mots montent derrière un masque invisible. Un coup de rouleau menthe se peint sous « Grand soin. » de gauche à droite, avec quelques gouttes de peinture ; là où la peinture passe, les lettres prennent la couleur pétrole. Une brillance traverse les lettres, puis la caméra passe à travers le texte.",
    son: 'Souffles sur les mots, passage du rouleau.',
  },
  {
    id: 'ordinateur', titre: 'Le site sur ordinateur', cle: 3.0, deroule: [0.6, 5.4, 7.6],
    ecran: "Pas de message : la vraie page d'accueil, l'adresse mmicromultiservices.com dans la barre",
    image: "Un ordinateur portable générique (sans logo) apparaît flou puis net. La caméra tourne lentement autour ; l'écran s'allume sur la page d'accueil réelle, un reflet le balaie. Puis la caméra plonge dans l'écran jusqu'à ce que le site remplisse l'image, et la page défile jusqu'aux Services.",
    son: "Clic à l'allumage, grand souffle pendant la plongée.",
  },
  {
    id: 'services', titre: 'Quatre métiers', cle: 6.0, deroule: [0.3, 1.9, 3.1],
    ecran: '« Quatre métiers. » « Un seul interlocuteur. »',
    image: "Le site s'efface ; le titre monte en très grand au centre, puis rapetisse et glisse à gauche. Les quatre vraies cartes du site arrivent de la profondeur en 3D et s'emboîtent en grille ; chaque icône hexagonale apparaît avec un rebond. La grille pivote lentement (parallaxe).",
    son: 'Un souffle par carte, un petit clic par icône.',
  },
  {
    id: 'nuancier', titre: 'Nuancier', cle: 3.6, deroule: [0.6, 1.2, 5.6],
    ecran: '« Prix annoncé. » « Prix payé. »',
    image: "Gros plan studio sur le nuancier du site (Blanc mat, Menthe velours, Vert satiné, Pétrole laqué) qui s'ouvre en éventail. Profondeur de champ marquée : la nuance de devant est nette, les autres floues, et la mise au point glisse. Chaque finition a son reflet (aucun pour le mat, très net pour le laqué). Sortie : un hexagone pétrole grandit et remplit l'image.",
    son: "Souffle, petits « tic » à l'ouverture de l'éventail.",
  },
  {
    id: 'rappel', titre: '24 h', cle: 3.8, deroule: [0.6, 1.2, 2.2],
    ecran: '« 24 h » « pour vous rappeler » · « au plus, après votre demande, en jours ouvrés »',
    image: "Fond pétrole. Un compteur géant défile de 00 à 24 comme un compteur mécanique (flou de mouvement), ralentit et se pose ; le « h » glisse à sa place ; le sous-titre monte.",
    son: "Tic-tac du compteur qui ralentit, impact grave à l'arrivée.",
  },
  {
    id: 'telephone', titre: 'Demande de rappel', cle: 6.9, deroule: [1.2, 2.6, 4.2],
    ecran: '« Décrivez votre besoin. » puis « Nous vous rappelons. » · notification « Nouvelle demande de rappel – Peinture – Castelnau-le-Lez »',
    image: "Un smartphone générique en 3D arrive en pivotant. Dans l'écran, le vrai formulaire du site se remplit tout seul, caractère par caractère (captures réelles). Toucher sur « Envoyer ma demande », « Envoi en cours… », puis « Demande envoyée. » avec une coche qui se dessine. Une notification d'exemple glisse au-dessus du téléphone.",
    son: 'Frappe douce, clics, son de validation, son de notification.',
  },
  {
    id: 'zone', titre: "Zone d'intervention", cle: 2.9, deroule: [0.4, 0.9, 1.4],
    ecran: '« Montpellier et alentours. » · les 12 communes du site',
    image: "La carte du site, en version sombre : Montpellier au centre dans son hexagone. Une onde part du centre, les anneaux 5 km et 10 km se dessinent et les communes s'allument au passage de l'onde.",
    son: 'Impact doux, petits tics en cascade.',
  },
  {
    id: 'fin', titre: 'Fin', cle: 2.6, deroule: [0.5, 1.2, 3.8],
    ecran: 'Logo · « Petits travaux. Grand soin. » · 06 46 48 55 64 · mmicromultiservices.com · Montpellier et alentours',
    image: "Fond noir, halo vert. Le logo apparaît avec un reflet, la signature monte et le rouleau menthe repasse sous « Grand soin. », puis les coordonnées se posent. Fondu au noir.",
    son: 'Impact grave, rouleau.',
  },
];

const SCENES_9x16 = [
  { id: 'logo', titre: 'Ouverture', cle: 4.0 },
  { id: 'signature', titre: 'Signature', cle: 3.6 },
  { id: 'services', titre: 'Quatre métiers', cle: 4.2 },
  { id: 'rappel', titre: '24 h', cle: 3.4 },
  { id: 'telephone', titre: 'Demande de rappel', cle: 5.9 },
  { id: 'fin', titre: 'Fin', cle: 2.6 },
];

const config = await readFile(path.join(RACINE, 'src/config.ts'), 'utf8');
const ips = Number(/export const IPS = (\d+)/.exec(config)[1]);
const durees = (format) => {
  const bloc = config.split(format === '16x9' ? 'FILM_16_9' : 'FILM_9_16')[1].split('} as const')[0];
  const liste = [];
  let debut = 0;
  for (const m of bloc.matchAll(/id: '([a-z0-9]+)', duree: ([\d.]+)/g)) {
    const d = Math.round(Number(m[2]) * ips) / ips;
    liste.push({ id: m[1], debut, fin: debut + d });
    debut += d;
  }
  return liste;
};
const tc = (s) => {
  const m = Math.floor(s / 60);
  const r = Math.round((s - m * 60) * 10) / 10;
  const entier = Math.floor(r);
  const dixieme = Math.round((r - entier) * 10);
  return `${m}:${String(entier).padStart(2, '0')}${dixieme ? ',' + dixieme : ''}`;
};

// 1. Rendu des images
await mkdir(IMAGES, { recursive: true });
const demandes = [];
for (const s of SCENES_16x9) for (const x of [s.cle, ...s.deroule]) demandes.push(`16x9:${s.id}:${x}`);
for (const s of SCENES_9x16) demandes.push(`9x16:${s.id}:${s.cle}`);
if (!process.argv.includes('--sans-rendu')) {
  execFileSync('node', [path.join(RACINE, 'scripts/images-fixes.mjs'), IMAGES, ...demandes], { stdio: 'inherit' });
}

// 2. Mise en page
const chrono16 = durees('16x9');
const chrono9 = durees('9x16');
const total16 = chrono16.at(-1).fin;
const total9 = chrono9.at(-1).fin;
const img = (format, id, t) => `images/${format}-${id}-${t}.png`;

const style = `
  @font-face { font-family: Outfit; src: url(../public/polices/outfit-variable.woff2); font-weight: 100 900; }
  @font-face { font-family: Instrument; src: url(../public/polices/instrument-sans-variable.woff2); font-weight: 400 700; }
  * { box-sizing: border-box; }
  body { margin: 0; background: #EEFBFA; color: #0D3934; font: 500 17px/1.5 Instrument, sans-serif; }
  .page { padding: 56px 64px 64px; }
  h1 { font: 700 46px/1.05 Outfit; letter-spacing: -0.03em; margin: 0; }
  .sous { color: #36524E; font-size: 20px; margin-top: 10px; }
  .grille { display: grid; grid-template-columns: repeat(3, 1fr); gap: 28px; margin-top: 40px; }
  .scene { background: #fff; border: 1px solid #D3E4E1; border-radius: 22px; overflow: hidden; box-shadow: 0 20px 50px -24px rgba(13,57,52,.35); }
  .scene > img { display: block; width: 100%; }
  .deroule { display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px; padding: 4px; background: #0D3934; }
  .deroule img { width: 100%; display: block; border-radius: 4px; }
  .texte { padding: 18px 22px 22px; }
  .tete { display: flex; align-items: baseline; gap: 12px; }
  .num { display: inline-grid; place-items: center; width: 34px; height: 38px; color: #fff; font: 700 17px Outfit; background: #027812;
         clip-path: polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%); flex: none; }
  .titre { font: 650 25px/1.1 Outfit; letter-spacing: -0.02em; }
  .tc { margin-left: auto; font: 600 16px Instrument; color: #027812; white-space: nowrap; }
  .ligne { margin-top: 10px; font-size: 15.5px; color: #36524E; }
  .ligne b { color: #0D3934; font-weight: 700; display: block; font-size: 12px; letter-spacing: .1em; text-transform: uppercase; margin-bottom: 2px; }
  .ecran { font: 600 17px/1.35 Outfit; color: #0D3934; }
  .verticale { display: grid; grid-template-columns: repeat(6, 1fr); gap: 22px; margin-top: 36px; }
  .verticale .scene img { width: 100%; display: block; }
`;

const carte16 = (s, i) => {
  const c = chrono16.find((x) => x.id === s.id);
  return `<div class="scene">
    <img src="${img('16x9', s.id, s.cle)}">
    <div class="deroule">${s.deroule.map((t) => `<img src="${img('16x9', s.id, t)}">`).join('')}</div>
    <div class="texte">
      <div class="tete"><span class="num">${i + 1}</span><span class="titre">${s.titre}</span><span class="tc">${tc(c.debut)} – ${tc(c.fin)}</span></div>
      <div class="ligne"><b>À l'écran</b><span class="ecran">${s.ecran}</span></div>
      <div class="ligne"><b>Image et mouvement</b>${s.image}</div>
      <div class="ligne"><b>Son</b>${s.son}</div>
    </div>
  </div>`;
};
const carte9 = (s, i) => {
  const c = chrono9.find((x) => x.id === s.id);
  return `<div class="scene">
    <img src="${img('9x16', s.id, s.cle)}">
    <div class="texte"><div class="tete"><span class="num">${i + 1}</span><span class="titre">${s.titre}</span></div>
    <div class="tc" style="margin:6px 0 0">${tc(c.debut)} – ${tc(c.fin)}</div></div>
  </div>`;
};

const page16 = `<!doctype html><html lang="fr"><meta charset="utf-8"><style>${style}</style><body><div class="page">
  <h1>MMICRO Multiservices · storyboard du film 16:9</h1>
  <div class="sous">1920 × 1080 · 60 images par seconde · ${tc(total16)} · une grande image clé par scène, et trois vignettes qui montrent le déroulé</div>
  <div class="grille">${SCENES_16x9.map(carte16).join('')}</div>
</div></body></html>`;

const page9 = `<!doctype html><html lang="fr"><meta charset="utf-8"><style>${style}</style><body><div class="page">
  <h1>Version verticale 9:16 · réseaux sociaux</h1>
  <div class="sous">1080 × 1920 · 60 images par seconde · ${tc(total9)} · scènes 1, 2, 4, 6, 7 et 9 recomposées pour l'écran vertical</div>
  <div class="verticale">${SCENES_9x16.map(carte9).join('')}</div>
</div></body></html>`;

await writeFile(path.join(DOSSIER, 'planche-16x9.html'), page16);
await writeFile(path.join(DOSSIER, 'planche-9x16.html'), page9);

const navigateur = await chromium.launch();
for (const [nom, largeur] of [['planche-16x9', 2400], ['planche-9x16', 2400]]) {
  const page = await navigateur.newPage({ viewport: { width: largeur, height: 1000 } });
  await page.goto('file://' + path.join(DOSSIER, `${nom}.html`));
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(DOSSIER, `${nom}.png`), fullPage: true });
  await page.close();
}
await navigateur.close();
console.log('Planches écrites dans storyboard/');
