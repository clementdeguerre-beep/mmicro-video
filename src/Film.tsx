import { AbsoluteFill, Html5Audio, Sequence, staticFile } from 'remotion';
import { APRES, AVANT, Fond, Transition } from './composants/Transition';
import { COULEURS, FILM_16_9, FILM_9_16, IPS, SON } from './config';
import './outils/polices';
import { S1Logo } from './scenes/S1Logo';
import { S2Signature } from './scenes/S2Signature';
import { S3Ordinateur } from './scenes/S3Ordinateur';
import { S4Services } from './scenes/S4Services';
import { S5Nuancier } from './scenes/S5Nuancier';
import { S6Rappel } from './scenes/S6Rappel';
import { S7Telephone } from './scenes/S7Telephone';
import { S8Zone } from './scenes/S8Zone';
import { S9Fin } from './scenes/S9Fin';

export type Format = '16x9' | '9x16';

const SCENES: Record<string, React.FC> = {
  logo: S1Logo,
  signature: S2Signature,
  ordinateur: S3Ordinateur,
  services: S4Services,
  nuancier: S5Nuancier,
  rappel: S6Rappel,
  telephone: S7Telephone,
  zone: S8Zone,
  fin: S9Fin,
};

/* Fond de chaque scène : sert à choisir la transition vers la scène suivante */
const FOND: Record<string, Fond> = {
  logo: 'noir',
  signature: 'noir',
  ordinateur: 'noir',
  services: 'clair',
  nuancier: 'clair',
  rappel: 'petrole',
  telephone: 'clair',
  zone: 'sombre',
  fin: 'noir',
};
// Enchaînements qui ont déjà leur propre transition (plongée dans l'écran)
const SANS_TRANSITION = ['ordinateur>services'];

export const filmDe = (format: Format) => (format === '16x9' ? FILM_16_9 : FILM_9_16);

/** Image de départ de chaque scène */
export const chronologie = (format: Format) => {
  let debut = 0;
  return filmDe(format).scenes.map((s) => {
    const duree = Math.round(s.duree * IPS);
    const item = { id: s.id, debut, duree };
    debut += duree;
    return item;
  });
};

export const dureeTotale = (format: Format) => chronologie(format).reduce((s, x) => s + x.duree, 0);

/** Fichier de musique à jouer (null = sans musique) */
export const fichierMusique = (format: Format) =>
  SON.musique === 'originale' ? `audio/musique-${format}.wav` : SON.musique ? `audio/${SON.musique}` : null;

export const Film: React.FC<{ format: Format; musique?: boolean }> = ({ format, musique = true }) => {
  const scenes = chronologie(format);
  const fichier = fichierMusique(format);
  return (
    <AbsoluteFill style={{ background: COULEURS.noir }}>
      {scenes.map(({ id, debut, duree }) => {
        const Scene = SCENES[id];
        return (
          <Sequence key={id} from={debut} durationInFrames={duree} name={id} premountFor={30}>
            <Scene />
          </Sequence>
        );
      })}
      {scenes.slice(1).map(({ id, debut }, i) => {
        const avant = scenes[i].id;
        if (FOND[avant] === FOND[id] || SANS_TRANSITION.includes(`${avant}>${id}`)) return null;
        return (
          <Sequence key={`transition-${id}`} from={debut - Math.round(AVANT * IPS)} durationInFrames={Math.round((AVANT + APRES) * IPS)} name={`→ ${id}`}>
            <Transition vers={FOND[id]} />
          </Sequence>
        );
      })}
      {musique && fichier ? <Html5Audio src={staticFile(fichier)} volume={SON.volumeMusique} /> : null}
    </AbsoluteFill>
  );
};
