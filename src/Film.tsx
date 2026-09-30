import { AbsoluteFill, Html5Audio, Sequence, staticFile } from 'remotion';
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

export const Film: React.FC<{ format: Format; musique?: boolean }> = ({ format, musique = true }) => (
  <AbsoluteFill style={{ background: COULEURS.noir }}>
    {chronologie(format).map(({ id, debut, duree }) => {
      const Scene = SCENES[id];
      return (
        <Sequence key={id} from={debut} durationInFrames={duree} name={id} premountFor={30}>
          <Scene />
        </Sequence>
      );
    })}
    {musique && SON.musique ? <Html5Audio src={staticFile(`audio/${SON.musique}`)} volume={SON.volumeMusique} /> : null}
  </AbsoluteFill>
);
