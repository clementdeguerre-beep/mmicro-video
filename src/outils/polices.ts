import { continueRender, delayRender, staticFile } from 'remotion';

/* Polices du site : Outfit (titres) et Instrument Sans (textes), licence SIL OFL 1.1 */
export const TITRE = '"Outfit", sans-serif';
export const TEXTE = '"Instrument Sans", sans-serif';

const attente = delayRender('Chargement des polices');
const polices = [
  new FontFace('Outfit', `url(${staticFile('polices/outfit-variable.woff2')}) format("woff2")`, { weight: '100 900' }),
  new FontFace('Instrument Sans', `url(${staticFile('polices/instrument-sans-variable.woff2')}) format("woff2")`, { weight: '400 700' }),
];
Promise.all(polices.map((p) => p.load()))
  .then((chargees) => {
    chargees.forEach((p) => document.fonts.add(p));
    continueRender(attente);
  })
  .catch((e) => {
    console.error(e);
    continueRender(attente);
  });
