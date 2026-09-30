/*
 * Captures du site MMICRO Multiservices avec Playwright (navigateur sans interface).
 *
 *   npm run captures
 *
 * Lit le site dans le dossier `site/` et écrit les images dans `public/captures/` :
 *   ordinateur/  pages 1440 × 900 (échelle 2 : images 2880 px de large)
 *   mobile/      pages 390 × 844 (échelle 3 : images 1170 px de large)
 *   elements/    cartes de services isolées, fond transparent (échelle 3)
 *   formulaire/  formulaire mobile rempli pas à pas, pour la scène du smartphone
 *   captures.json  positions des champs et des éléments, utilisées par l'animation
 *
 * Les valeurs tapées dans le formulaire sont définies dans FORMULAIRE ci-dessous.
 */
import { chromium } from 'playwright';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITE = pathToFileURL(path.join(RACINE, 'site', 'index.html')).href;
const SORTIE = path.join(RACINE, 'public', 'captures');

/* Exemple de demande tapée dans le formulaire (scène 7).
   Téléphone et description reprennent les exemples affichés par le site. */
export const FORMULAIRE = {
  prenom: 'Camille',
  nom: 'Martin',
  telephone: '06 12 34 56 78',
  commune: 'Castelnau-le-Lez',
  besoin: 'besoin-peinture',
  description: 'Salon de 20 m² à repeindre, murs et plafond',
  urgence: 'urgence-semaine',
};

const ORDINATEUR = { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 };
const MOBILE = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true };

/* Fond transparent pour isoler un élément (cartes) */
const CSS_TRANSPARENT = `
  #entete { visibility: hidden !important; }
  .barre-mobile { display: none !important; }
  html, body, main, .section, .section--lavis, .hero { background: transparent !important; }
  .hero::before, .section--rappel::before { display: none !important; }
`;

const meta = { genere: new Date().toISOString(), formulaire: FORMULAIRE };

async function nouvellePage(navigateur, options) {
  const contexte = await navigateur.newContext({ ...options, reducedMotion: 'reduce', locale: 'fr-FR' });
  const page = await contexte.newPage();
  // Le formulaire envoie vers Web3Forms : on simule une réponse positive, rien ne part sur Internet.
  await page.route('https://api.web3forms.com/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) }),
  );
  await page.goto(SITE, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(400);
  return { contexte, page };
}

async function allerA(page, selecteur, decalage = 0) {
  await page.evaluate(
    ([s, d]) => {
      const el = document.querySelector(s);
      const y = el.getBoundingClientRect().top + window.scrollY - d;
      window.scrollTo({ top: y, behavior: 'instant' });
    },
    [selecteur, decalage],
  );
  await page.waitForTimeout(250);
}

async function capturesOrdinateur(navigateur) {
  const dossier = path.join(SORTIE, 'ordinateur');
  await mkdir(dossier, { recursive: true });
  const { contexte, page } = await nouvellePage(navigateur, ORDINATEUR);

  await page.screenshot({ path: path.join(dossier, 'accueil.png') });
  // Bande haute de la page (accroche + services) pour faire défiler le site dans l'écran
  const hautServices = await page.evaluate(() => {
    const s = document.querySelector('#services');
    return Math.round(s.getBoundingClientRect().bottom + window.scrollY);
  });
  await page.screenshot({
    path: path.join(dossier, 'defilement.png'),
    fullPage: true,
    clip: { x: 0, y: 0, width: 1440, height: Math.min(hautServices, 3600) },
  });
  meta.ordinateur = { largeur: 1440, hauteur: 900, echelle: 2, defilementHauteur: Math.min(hautServices, 3600) };

  // Position des éléments de la page d'accueil et des services (pour les animations)
  meta.ordinateur.elements = await page.evaluate(() => {
    const boite = (s) => {
      const r = document.querySelector(s).getBoundingClientRect();
      return { x: r.x, y: r.y + window.scrollY, w: r.width, h: r.height };
    };
    return {
      titre: boite('#titre-accroche'),
      peint: boite('.peint'),
      services: boite('#services'),
      bento: boite('.bento'),
      cartePeinture: boite('.carte-service--peinture'),
      carteRemise: boite('.carte-service--remise'),
      cartePetits: boite('.carte-service--petits'),
      carteDepannage: boite('.carte-service--depannage'),
    };
  });

  for (const [nom, selecteur, decalage] of [
    ['services', '#services', 0],
    ['engagements', '#engagements', 0],
    ['zone', '#zone', 0],
    ['rappel', '#rappel', 0],
  ]) {
    await allerA(page, selecteur, decalage);
    await page.screenshot({ path: path.join(dossier, `${nom}.png`) });
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: path.join(dossier, 'page-complete.jpg'), fullPage: true, type: 'jpeg', quality: 86 });
  await contexte.close();
}

async function capturesElements(navigateur) {
  const dossier = path.join(SORTIE, 'elements');
  await mkdir(dossier, { recursive: true });
  // Cartes au format ordinateur (grille) puis au format mobile (pile)
  for (const [suffixe, options] of [
    ['', { ...ORDINATEUR, deviceScaleFactor: 3 }],
    ['-mobile', MOBILE],
  ]) {
    const { contexte, page } = await nouvellePage(navigateur, options);
    await page.addStyleTag({ content: CSS_TRANSPARENT });
    for (const carte of ['peinture', 'remise', 'petits', 'depannage']) {
      const loc = page.locator(`.carte-service--${carte}`);
      await loc.scrollIntoViewIfNeeded();
      await loc.screenshot({ path: path.join(dossier, `carte-${carte}${suffixe}.png`), omitBackground: true });
    }
    // Même cartes sans leur pastille hexagonale : l'icône est animée séparément
    await page.addStyleTag({ content: '.carte-service .hexa { visibility: hidden !important; }' });
    const cartes = {};
    for (const carte of ['peinture', 'remise', 'petits', 'depannage']) {
      const loc = page.locator(`.carte-service--${carte}`);
      await loc.scrollIntoViewIfNeeded();
      await loc.screenshot({ path: path.join(dossier, `carte-${carte}${suffixe}-sans-icone.png`), omitBackground: true });
      cartes[carte] = await loc.evaluate((el) => {
        const r = el.getBoundingClientRect();
        const h = el.querySelector('.hexa').getBoundingClientRect();
        return { w: r.width, h: r.height, hexa: { x: h.x - r.x, y: h.y - r.y, w: h.width, h: h.height } };
      });
    }
    meta[`cartes${suffixe === '' ? '' : 'Mobile'}`] = cartes;
    await contexte.close();
  }
}

async function capturesMobile(navigateur) {
  const dossier = path.join(SORTIE, 'mobile');
  await mkdir(dossier, { recursive: true });
  const { contexte, page } = await nouvellePage(navigateur, MOBILE);
  await page.screenshot({ path: path.join(dossier, 'accueil.png') });
  await page.screenshot({ path: path.join(dossier, 'page-complete.jpg'), fullPage: true, type: 'jpeg', quality: 86 });
  await allerA(page, '#services', 72);
  await page.screenshot({ path: path.join(dossier, 'services.png') });
  await contexte.close();
}

/* Formulaire mobile rempli pas à pas.
   - fond.png : la section « Demande de rappel » complète, formulaire vide, sans l'en-tête
   - entete.png : l'en-tête fixe du site, posé en haut de l'écran du téléphone
   - une petite image par caractère tapé, à superposer à l'emplacement du champ
   - rempli.png, envoi.png, succes.png : états complets */
async function capturesFormulaire(navigateur) {
  const dossier = path.join(SORTIE, 'formulaire');
  await rm(dossier, { recursive: true, force: true });
  await mkdir(dossier, { recursive: true });
  const { contexte, page } = await nouvellePage(navigateur, MOBILE);

  await page.locator('#entete').screenshot({ path: path.join(dossier, 'entete.png') });
  // L'en-tête fixe et la barre d'appel mobile ne doivent pas apparaître dans les captures de la section
  await page.addStyleTag({
    content: `#entete { visibility: hidden !important; } .barre-mobile { display: none !important; }
      input::-webkit-calendar-picker-indicator { display: none !important; }`, // flèche de liste absente sur un vrai téléphone
  });
  const carteFormulaire = await page.evaluate(() => {
    const r = document.querySelector('.carte-formulaire').getBoundingClientRect();
    return { x: r.x, y: r.y + window.scrollY, w: r.width, h: r.height };
  });

  const zone = await page.evaluate(() => {
    const s = document.querySelector('#rappel').getBoundingClientRect();
    return { x: 0, y: Math.round(s.top + window.scrollY), w: 390, h: Math.round(s.height) };
  });
  const clipZone = { x: 0, y: zone.y, width: 390, height: zone.h };
  await page.screenshot({ path: path.join(dossier, 'fond.png'), fullPage: true, clip: clipZone });

  const boiteDoc = (selecteur) =>
    page.evaluate(
      ([s, y0]) => {
        const r = document.querySelector(s).getBoundingClientRect();
        return { x: r.x, y: r.y + window.scrollY - y0, w: r.width, h: r.height };
      },
      [selecteur, zone.y],
    );

  const MARGE = 6; // l'anneau de focus déborde de 4 px autour du champ
  const etapes = [];

  async function capturerChamp(selecteurCadre, fichier) {
    const b = await boiteDoc(selecteurCadre);
    const clip = { x: Math.max(0, b.x - MARGE), y: zone.y + b.y - MARGE, width: b.w + 2 * MARGE, height: b.h + 2 * MARGE };
    await page.screenshot({ path: path.join(dossier, fichier), fullPage: true, clip });
    return { x: clip.x, y: clip.y - zone.y, w: clip.width, h: clip.height };
  }

  // Position du curseur de saisie : on mesure le texte avec un double invisible du champ
  const mesurerCurseur = (id) =>
    page.evaluate(
      ([id, y0]) => {
        const el = document.getElementById(id);
        const st = getComputedStyle(el);
        const miroir = document.createElement('div');
        for (const p of ['fontFamily', 'fontSize', 'fontWeight', 'lineHeight', 'letterSpacing', 'paddingTop', 'paddingLeft', 'paddingRight', 'borderLeftWidth', 'borderTopWidth', 'boxSizing'])
          miroir.style[p] = st[p];
        miroir.style.position = 'absolute';
        miroir.style.visibility = 'hidden';
        miroir.style.width = el.getBoundingClientRect().width + 'px';
        miroir.style.whiteSpace = el.tagName === 'TEXTAREA' ? 'pre-wrap' : 'pre';
        miroir.style.borderStyle = 'solid';
        miroir.style.borderColor = 'transparent';
        miroir.textContent = el.value;
        const repere = document.createElement('span');
        repere.textContent = '​';
        miroir.appendChild(repere);
        document.body.appendChild(miroir);
        const r = el.getBoundingClientRect();
        const m = miroir.getBoundingClientRect();
        const q = repere.getBoundingClientRect();
        miroir.remove();
        return { x: r.x + (q.left - m.left), y: r.y + window.scrollY - y0 + (q.top - m.top), h: q.height };
      },
      [id, zone.y],
    );

  const champsTexte = [
    ['prenom', FORMULAIRE.prenom],
    ['nom', FORMULAIRE.nom],
    ['telephone', FORMULAIRE.telephone],
    ['commune', FORMULAIRE.commune],
    ['description', FORMULAIRE.description],
  ];

  for (const [id, valeur] of champsTexte) {
    const champ = page.locator(`#${id}`);
    await champ.focus();
    const liste = [];
    // Champ vide mais sélectionné (anneau vert)
    liste.push({ fichier: `${id}-00.png`, boite: await capturerChamp(`#${id}`, `${id}-00.png`), curseur: await mesurerCurseur(id), texte: '' });
    for (let i = 1; i <= valeur.length; i++) {
      await champ.evaluate((el, v) => { el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); }, valeur.slice(0, i));
      const fichier = `${id}-${String(i).padStart(2, '0')}.png`;
      liste.push({ fichier, boite: await capturerChamp(`#${id}`, fichier), curseur: await mesurerCurseur(id), texte: valeur.slice(0, i) });
    }
    // Champ rempli, sans sélection
    await champ.evaluate((el) => el.blur());
    await page.waitForTimeout(60);
    const fichier = `${id}-fin.png`;
    liste.push({ fichier, boite: await capturerChamp(`#${id}`, fichier), texte: valeur, fin: true });
    etapes.push({ type: 'saisie', id, valeur, images: liste });
  }

  // Choix par pastilles : type de besoin et urgence
  for (const [radio, groupe, fichier] of [
    [FORMULAIRE.besoin, '#groupe-besoin .choix', 'besoin.png'],
    [FORMULAIRE.urgence, 'fieldset:has(#urgence-urgent) .choix', 'urgence.png'],
  ]) {
    const avant = await capturerChamp(groupe, fichier.replace('.png', '-avant.png'));
    await page.locator(`#${radio}`).check();
    await page.locator(`#${radio}`).blur();
    const cible = await boiteDoc(`label:has(#${radio})`);
    etapes.push({ type: 'choix', id: radio, cible, avant: { fichier: fichier.replace('.png', '-avant.png'), boite: avant }, apres: { fichier, boite: await capturerChamp(groupe, fichier) } });
  }

  // Case de consentement
  const caseAvant = await capturerChamp('label.case', 'consentement-avant.png');
  await page.locator('#consentement').check();
  await page.locator('#consentement').blur();
  etapes.push({ type: 'case', id: 'consentement', cible: await boiteDoc('#consentement'), avant: { fichier: 'consentement-avant.png', boite: caseAvant }, apres: { fichier: 'consentement.png', boite: await capturerChamp('label.case', 'consentement.png') } });

  // Formulaire complet, bouton au repos
  await page.screenshot({ path: path.join(dossier, 'rempli.png'), fullPage: true, clip: clipZone });
  const bouton = await boiteDoc('#envoyer');
  // Bouton pendant l'envoi (texte du site : « Envoi en cours… »)
  await page.evaluate(() => { const b = document.getElementById('envoyer'); b.disabled = true; b.textContent = 'Envoi en cours…'; });
  const boiteEnvoi = await capturerChamp('#envoyer', 'bouton-envoi.png');
  await page.evaluate(() => { const b = document.getElementById('envoyer'); b.disabled = false; b.textContent = 'Envoyer ma demande'; });
  etapes.push({ type: 'envoi', bouton, image: { fichier: 'bouton-envoi.png', boite: boiteEnvoi } });

  // Envoi réel du formulaire (réponse simulée) : le site affiche « Demande envoyée. »
  // Une clé fictive évite le bandeau « Mode démonstration » ; l'envoi est intercepté par page.route.
  await page.evaluate(() => { document.getElementById('cle-web3forms').value = 'cle-video'; });
  await page.waitForTimeout(1600); // le site ignore les envois faits en moins d'1,5 s
  await page.locator('#envoyer').click();
  await page.locator('#succes').waitFor({ state: 'visible' });
  await page.waitForTimeout(300);
  const zoneSucces = await page.evaluate(() => {
    const s = document.querySelector('#rappel').getBoundingClientRect();
    return { y: Math.round(s.top + window.scrollY), h: Math.round(s.height) };
  });
  await page.screenshot({ path: path.join(dossier, 'succes.png'), fullPage: true, clip: { x: 0, y: zoneSucces.y, width: 390, height: zoneSucces.h } });
  const succes = await page.evaluate((y0) => {
    const b = (s) => { const r = document.querySelector(s).getBoundingClientRect(); return { x: r.x, y: r.y + window.scrollY - y0, w: r.width, h: r.height }; };
    return { carte: b('.carte-formulaire'), icone: b('.succes__icone'), titre: b('.succes h3'), texte: document.getElementById('succes-texte').textContent };
  }, zoneSucces.y);

  meta.formulaire = {
    ...meta.formulaire,
    echelle: 3,
    largeur: 390,
    hauteurEcran: 844,
    fond: { fichier: 'fond.png', hauteur: zone.h },
    rempli: { fichier: 'rempli.png', hauteur: zone.h },
    succes: { fichier: 'succes.png', hauteur: zoneSucces.h, ...succes },
    entete: { fichier: 'entete.png', hauteur: 72 },
    carte: { ...carteFormulaire, y: carteFormulaire.y - zone.y },
    etapes,
  };
  await contexte.close();
}

const navigateur = await chromium.launch();
try {
  await mkdir(SORTIE, { recursive: true });
  if (!existsSync(path.join(RACINE, 'site', 'index.html'))) throw new Error('Dossier site/ introuvable');
  console.log('Ordinateur…');
  await capturesOrdinateur(navigateur);
  console.log('Éléments…');
  await capturesElements(navigateur);
  console.log('Mobile…');
  await capturesMobile(navigateur);
  console.log('Formulaire…');
  await capturesFormulaire(navigateur);
  await writeFile(path.join(SORTIE, 'captures.json'), JSON.stringify(meta, null, 2));
  console.log('Captures terminées dans public/captures/');
} finally {
  await navigateur.close();
}
