import { Html5Audio, Sequence, staticFile } from 'remotion';
import { SON } from '../config';
import { useTemps } from '../outils/temps';

/* Effets sonores, calés sur l'image.
   Les fichiers sont fabriqués par scripts/effets-sonores.mjs (sons de synthèse,
   libres de droits) dans public/audio/effets/. */
export type Effet =
  | 'impact-grave'
  | 'souffle'
  | 'souffle-montant'
  | 'souffle-court'
  | 'clic'
  | 'clic-doux'
  | 'frappe'
  | 'validation'
  | 'notification'
  | 'scintillement'
  | 'rouleau'
  | 'tic';

export const Son: React.FC<{ effet: Effet; a: number; volume?: number }> = ({ effet, a, volume = 1 }) => {
  const { fps } = useTemps();
  return (
    <Sequence from={Math.round(a * fps)} layout="none" name={`son ${effet}`}>
      <Html5Audio src={staticFile(`audio/effets/${effet}.wav`)} volume={volume * SON.volumeEffets} />
    </Sequence>
  );
};
