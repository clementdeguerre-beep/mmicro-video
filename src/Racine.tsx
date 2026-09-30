import { Composition, Still } from 'remotion';
import { FILM_16_9, FILM_9_16, IPS } from './config';
import { dureeTotale, Film } from './Film';
import { Poster16x9, Poster9x16 } from './Posters';

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
    <Still id="Poster-16x9" component={Poster16x9} width={FILM_16_9.largeur} height={FILM_16_9.hauteur} />
    <Still id="Poster-9x16" component={Poster9x16} width={FILM_9_16.largeur} height={FILM_9_16.hauteur} />
  </>
);
