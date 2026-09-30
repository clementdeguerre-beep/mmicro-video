import { staticFile } from 'remotion';
import captures from '../../public/captures/captures.json';
import { COULEURS } from '../config';
import { TEXTE } from '../outils/polices';
import { FLUIDE, mix } from '../outils/temps';

/* Écran du smartphone : le vrai formulaire du site, rempli pas à pas.
   Chaque état d'un champ est une capture réelle (scripts/captures.mjs),
   posée à sa place exacte sur la capture de la section « Demande de rappel ». */

const F = captures.formulaire;
export const TEL = { largeur: 390, hauteur: 844, echelle: 3, barreEtat: 40, entete: 72 };
const VUE = TEL.hauteur - TEL.barreEtat - TEL.entete; // hauteur visible du contenu (px du site)

type Boite = { x: number; y: number; w: number; h: number };
type ImageEtat = { fichier: string; boite: Boite; curseur?: { x: number; y: number; h: number }; texte?: string; fin?: boolean };
type EtapeSaisie = { type: 'saisie'; id: string; valeur: string; images: ImageEtat[] };
type EtapeChoix = { type: 'choix' | 'case'; id: string; cible: Boite; avant: ImageEtat; apres: ImageEtat };
type EtapeEnvoi = { type: 'envoi'; bouton: Boite; image: ImageEtat };
const ETAPES = F.etapes as unknown as (EtapeSaisie | EtapeChoix | EtapeEnvoi)[];

/** Chronologie du remplissage (secondes, depuis le début du remplissage) */
export const SCRIPT_FORMULAIRE = [
  { id: 'prenom', debut: 0.0, duree: 0.34 },
  { id: 'nom', debut: 0.42, duree: 0.3 },
  { id: 'telephone', debut: 0.8, duree: 0.5 },
  { id: 'commune', debut: 1.45, duree: 0.45 },
  { id: 'besoin-peinture', debut: 2.02 },
  { id: 'description', debut: 2.22, duree: 0.8 },
  { id: 'urgence-semaine', debut: 3.12 },
  { id: 'consentement', debut: 3.32 },
  { id: 'envoi', debut: 3.62 },
  { id: 'succes', debut: 4.05 },
] as const;
export const DUREE_FORMULAIRE = 4.05;

/** Toutes les images à charger pour dessiner l'écran */
export const imagesFormulaire = () => {
  const liste = new Set<string>([F.fond.fichier, F.rempli.fichier, F.succes.fichier, F.entete.fichier]);
  for (const e of ETAPES) {
    if (e.type === 'saisie') e.images.forEach((i) => liste.add(i.fichier));
    else if (e.type === 'envoi') liste.add(e.image.fichier);
    else {
      liste.add(e.apres.fichier);
    }
  }
  return [...liste];
};
export const urlsFormulaire = () => imagesFormulaire().map((f) => staticFile(`captures/formulaire/${f}`));

const etape = (id: string) => ETAPES.find((e) => (e.type === 'envoi' ? id === 'envoi' : e.id === id))!;
const temps = (id: string) => SCRIPT_FORMULAIRE.find((s) => s.id === id)!;

/** Défilement (px de la section) : chaque champ se place vers le tiers haut de l'écran */
const cibleDefilement = (y: number, h: number, hauteurSection: number) =>
  Math.max(0, Math.min(hauteurSection - VUE, y + h / 2 - VUE * 0.38));

const defilementA = (t: number) => {
  const cles: [number, number][] = [[-0.9, 330]];
  for (const s of SCRIPT_FORMULAIRE) {
    if (s.id === 'succes') break;
    const e = etape(s.id);
    const b = e.type === 'saisie' ? e.images[0].boite : e.type === 'envoi' ? e.bouton : e.cible;
    cles.push([s.debut, cibleDefilement(b.y, b.h, F.fond.hauteur)]);
  }
  // Glisse vers chaque cible pendant les 0,4 s qui précèdent l'étape
  let d = cles[0][1];
  for (let k = 1; k < cles.length; k++) {
    const [tk, vk] = cles[k];
    const p = FLUIDE(Math.min(1, Math.max(0, (t - (tk - 0.42)) / 0.4)));
    d = mix(d, vk, p);
  }
  return d;
};

export type ImagesChargees = Record<string, HTMLImageElement>;

/** Dessine l'écran du téléphone à l'instant t (secondes depuis le début du remplissage) */
export const dessinerEcranFormulaire = (ctx: CanvasRenderingContext2D, img: ImagesChargees, t: number, heure = '14:08') => {
  const e = TEL.echelle;
  const W = TEL.largeur;
  ctx.save();
  ctx.setTransform(e, 0, 0, e, 0, 0);
  ctx.fillStyle = COULEURS.mentheLavis;
  ctx.fillRect(0, 0, W, TEL.hauteur);

  const hautContenu = TEL.barreEtat + TEL.entete;
  const tSucces = temps('succes').debut;
  const passage = Math.min(1, Math.max(0, (t - tSucces) / 0.3));

  // ---- Formulaire ----
  if (passage < 1) {
    const d = defilementA(t);
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, hautContenu, W, VUE);
    ctx.clip();
    ctx.translate(0, hautContenu - d);
    ctx.globalAlpha = 1 - passage;
    const fond = img[F.fond.fichier];
    ctx.drawImage(fond, 0, 0, W, F.fond.hauteur);
    for (const s of SCRIPT_FORMULAIRE) {
      if (s.id === 'succes') continue;
      const et = etape(s.id);
      const local = t - s.debut;
      if (local < 0) continue;
      if (et.type === 'saisie') {
        const duree = 'duree' in s ? s.duree : 0.4;
        const n = et.valeur.length;
        const k = local >= duree ? -1 : Math.min(n, Math.floor((local / duree) * (n + 1)));
        const etat = k === -1 ? et.images[et.images.length - 1] : et.images[k];
        poser(ctx, img, etat);
        if (k !== -1 && etat.curseur) {
          ctx.fillStyle = COULEURS.vert;
          ctx.fillRect(etat.curseur.x, etat.curseur.y + 2, 1.6, etat.curseur.h - 4);
        }
      } else if (et.type === 'choix' || et.type === 'case') {
        poser(ctx, img, et.apres);
        toucher(ctx, et.cible.x + et.cible.w / 2, et.cible.y + et.cible.h / 2, local);
      } else if (et.type === 'envoi') {
        const b = et.bouton;
        if (local < 0.12) {
          ctx.fillStyle = 'rgba(1,90,13,0.35)';
          arrondi(ctx, b.x, b.y, b.w, b.h, b.h / 2);
          ctx.fill();
        } else {
          poser(ctx, img, et.image); // « Envoi en cours… »
        }
        toucher(ctx, b.x + b.w * 0.55, b.y + b.h / 2, local);
      }
    }
    ctx.restore();
  }

  // ---- Confirmation « Demande envoyée. » ----
  if (passage > 0) {
    const s = F.succes;
    const dFin = Math.min(s.hauteur - VUE, Math.max(0, s.icone.y - 250));
    const dS = dFin + (1 - FLUIDE(passage)) * 60;
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, hautContenu, W, VUE);
    ctx.clip();
    ctx.translate(0, hautContenu - dS);
    ctx.globalAlpha = passage;
    ctx.drawImage(img[s.fichier], 0, 0, W, s.hauteur);
    // Coche animée par-dessus l'icône du site
    const local = t - tSucces - 0.15;
    const cx = s.icone.x + s.icone.w / 2;
    const cy = s.icone.y + s.icone.h / 2;
    const rond = FLUIDE(Math.min(1, Math.max(0, local / 0.35)));
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(cx, cy, s.icone.w / 2 + 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = COULEURS.menthe;
    ctx.beginPath();
    ctx.arc(cx, cy, (s.icone.w / 2) * (0.55 + 0.45 * rond), 0, Math.PI * 2);
    ctx.fill();
    const trace = FLUIDE(Math.min(1, Math.max(0, (local - 0.18) / 0.4)));
    if (trace > 0) {
      ctx.save();
      ctx.translate(cx - 15, cy - 15);
      ctx.scale(30 / 24, 30 / 24);
      ctx.strokeStyle = COULEURS.vert;
      ctx.lineWidth = 2.6;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      const longueur = 6.4 + 12.1;
      ctx.setLineDash([longueur * trace, longueur]);
      ctx.beginPath();
      ctx.moveTo(5, 12.5);
      ctx.lineTo(9.5, 17);
      ctx.lineTo(19, 7.5);
      ctx.stroke();
      ctx.restore();
    }
    // Onde qui s'élargit autour de la coche
    const onde = Math.min(1, Math.max(0, (local - 0.3) / 0.7));
    if (onde > 0 && onde < 1) {
      ctx.strokeStyle = `rgba(2,120,18,${0.35 * (1 - onde)})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, s.icone.w / 2 + onde * 40, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  // ---- En-tête du site et barre d'état ----
  ctx.drawImage(img[F.entete.fichier], 0, TEL.barreEtat, W, TEL.entete);
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, W, TEL.barreEtat);
  barreEtat(ctx, heure);
  ctx.restore();
};

const poser = (ctx: CanvasRenderingContext2D, img: ImagesChargees, etat: ImageEtat) => {
  const b = etat.boite;
  const i = img[etat.fichier];
  if (i) ctx.drawImage(i, b.x, b.y, b.w, b.h);
};

/* Petit cercle qui montre le toucher du doigt */
const toucher = (ctx: CanvasRenderingContext2D, x: number, y: number, local: number) => {
  if (local < 0 || local > 0.5) return;
  const p = local / 0.5;
  ctx.fillStyle = `rgba(13,57,52,${0.16 * (1 - p)})`;
  ctx.beginPath();
  ctx.arc(x, y, 12 + p * 26, 0, Math.PI * 2);
  ctx.fill();
};

/* Barre d'état générique : heure, réseau, batterie */
const barreEtat = (ctx: CanvasRenderingContext2D, heure: string) => {
  ctx.fillStyle = COULEURS.petrole;
  ctx.font = `600 15px ${TEXTE}`;
  ctx.textBaseline = 'middle';
  ctx.fillText(heure, 28, TEL.barreEtat / 2 + 1);
  // Réseau
  for (let i = 0; i < 4; i++) {
    const h = 4 + i * 2.5;
    ctx.fillRect(W_DROITE - 78 + i * 5, TEL.barreEtat / 2 + 6 - h, 3, h);
  }
  // Batterie
  ctx.strokeStyle = COULEURS.petrole;
  ctx.lineWidth = 1.2;
  arrondi(ctx, W_DROITE - 44, TEL.barreEtat / 2 - 6, 24, 12, 3.5);
  ctx.stroke();
  ctx.fillRect(W_DROITE - 19, TEL.barreEtat / 2 - 2.5, 2, 5);
  arrondi(ctx, W_DROITE - 42, TEL.barreEtat / 2 - 4, 16, 8, 2);
  ctx.fill();
};
const W_DROITE = TEL.largeur - 12;

const arrondi = (ctx: CanvasRenderingContext2D, x: number, y: number, l: number, h: number, r: number) => {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + l, y, x + l, y + h, r);
  ctx.arcTo(x + l, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + l, y, r);
  ctx.closePath();
};
