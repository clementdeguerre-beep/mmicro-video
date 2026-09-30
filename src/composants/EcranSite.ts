import { COULEURS, CONTACT } from '../config';
import { TEXTE } from '../outils/polices';

/* Écran de l'ordinateur : une barre de navigateur neutre (adresse du site)
   au-dessus de la vraie capture du site (1440 × 900, échelle 2).
   Le même dessin sert à la texture 3D et à la version plein écran,
   pour que le passage de l'une à l'autre soit invisible. */
export const ECRAN = { largeur: 1440, hauteur: 900, barre: 44, echelle: 2 };

/** Défilement (px du site) à la fin de la plongée : en-tête de la section Services */
export const DEFILEMENT_SERVICES = 872;

export const dessinerEcranSite = (
  ctx: CanvasRenderingContext2D,
  site: HTMLImageElement,
  defilement: number,
  echelle = ECRAN.echelle,
) => {
  const { largeur, hauteur, barre } = ECRAN;
  const e = echelle;
  ctx.save();
  ctx.setTransform(e, 0, 0, e, 0, 0);
  // Contenu du site (la capture est à l'échelle 2)
  const hVue = hauteur - barre;
  const ratio = site.naturalWidth / largeur;
  ctx.drawImage(site, 0, defilement * ratio, site.naturalWidth, hVue * ratio, 0, barre, largeur, hVue);

  // Barre de navigateur générique
  ctx.fillStyle = '#F4F7F7';
  ctx.fillRect(0, 0, largeur, barre);
  ctx.fillStyle = '#DCE6E4';
  ctx.fillRect(0, barre - 1, largeur, 1);
  // Flèches et rechargement, en traits fins
  ctx.strokeStyle = '#7C8F8C';
  ctx.lineWidth = 1.6;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const fleche = (x: number, sens: number) => {
    ctx.beginPath();
    ctx.moveTo(x + 5 * sens, barre / 2 - 6);
    ctx.lineTo(x - 1 * sens, barre / 2);
    ctx.lineTo(x + 5 * sens, barre / 2 + 6);
    ctx.stroke();
  };
  fleche(24, 1);
  fleche(58, -1);
  ctx.beginPath();
  ctx.arc(88, barre / 2, 6.5, -Math.PI * 0.25, Math.PI * 1.45);
  ctx.stroke();
  // Champ d'adresse
  const lChamp = 460;
  const xChamp = (largeur - lChamp) / 2;
  ctx.fillStyle = '#E6EDEC';
  arrondi(ctx, xChamp, 8, lChamp, barre - 16, 9);
  ctx.fill();
  ctx.font = `500 14px ${TEXTE}`;
  const url = CONTACT.site;
  const lTexte = ctx.measureText(url).width;
  const xTexte = xChamp + (lChamp - lTexte) / 2 + 9;
  // Cadenas
  ctx.strokeStyle = COULEURS.texteSecondaireClair;
  ctx.lineWidth = 1.4;
  arrondi(ctx, xTexte - 21, barre / 2 - 3, 10, 8, 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(xTexte - 16, barre / 2 - 3, 3, Math.PI, 0);
  ctx.stroke();
  ctx.fillStyle = COULEURS.texteSecondaireClair;
  ctx.textBaseline = 'middle';
  ctx.fillText(url, xTexte, barre / 2 + 0.5);
  ctx.restore();
};

export const arrondi = (ctx: CanvasRenderingContext2D, x: number, y: number, l: number, h: number, r: number) => {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + l, y, x + l, y + h, r);
  ctx.arcTo(x + l, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + l, y, r);
  ctx.closePath();
};
