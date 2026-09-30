import { Composition } from 'remotion';
import { FILM_16_9, FILM_9_16, IPS } from './config';
import { dureeTotale, Film } from './Film';

export const Racine: React.FC = () => (
  <>
    <Composition
      id="Film-16x9"
      component={Film}
      defaultProps={{ format: '16x9' as const, musique: true }}
      durationInFrames={dureeTotale('16x9')}
      fps={IPS}
      width={FILM_16_9.largeur}
      height={FILM_16_9.hauteur}
    />
    <Composition
      id="Film-9x16"
      component={Film}
      defaultProps={{ format: '9x16' as const, musique: true }}
      durationInFrames={dureeTotale('9x16')}
      fps={IPS}
      width={FILM_9_16.largeur}
      height={FILM_9_16.hauteur}
    />
  </>
);
