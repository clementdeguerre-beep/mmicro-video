import { AbsoluteFill } from 'remotion';
import { COULEURS } from '../config';
import { FLUIDE, mix, prog, useTemps } from '../outils/temps';
import { POINTS_HEXA } from './Hexa';

/* Transitions entre deux scènes dont le fond change.
   - vers un fond coloré : l'hexagone du logo grandit depuis le centre,
     bordé d'un fin liseré menthe, puis s'efface sur la scène suivante ;
   - vers le noir : fondu au noir. */
export type Fond = 'noir' | 'clair' | 'petrole' | 'sombre';

export const COULEUR_FOND: Record<Fond, string> = {
  noir: COULEURS.noir,
  clair: COULEURS.mentheLavis,
  petrole: COULEURS.petrole,
  sombre: COULEURS.petroleProfond,
};

export const AVANT = 0.5; // durée avant la coupe (s)
export const APRES = 0.4; // durée après la coupe (s)

export const Transition: React.FC<{ vers: Fond }> = ({ vers }) => {
  const { t, largeur, hauteur } = useTemps();
  const couleur = COULEUR_FOND[vers];
  const efface = prog(t, AVANT, APRES, FLUIDE);

  if (vers === 'noir') {
    const monte = prog(t, 0, AVANT, FLUIDE);
    return <AbsoluteFill style={{ background: couleur, opacity: monte * (1 - efface) }} />;
  }

  const p = prog(t, 0, AVANT, FLUIDE);
  // Taille finale : l'hexagone couvre toute l'image, coins compris
  const diagonale = Math.hypot(largeur, hauteur);
  const lFin = diagonale * 1.25;
  const l = mix(0, lFin, p);
  const h = (l * 116) / 100;
  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', opacity: 1 - efface, pointerEvents: 'none' }}>
      <svg viewBox="0 0 100 116" width={l} height={h} style={{ overflow: 'visible', position: 'absolute' }}>
        <polygon points={POINTS_HEXA} fill={couleur} stroke={couleur} strokeWidth={12} strokeLinejoin="round" />
        {p < 0.98 ? (
          <polygon
            points={POINTS_HEXA}
            fill="none"
            stroke={COULEURS.menthe}
            strokeOpacity={0.9 * (1 - p)}
            strokeWidth={Math.max(0.3, 2.2 * (1 - p)) * (100 / Math.max(1, l)) * 6}
            strokeLinejoin="round"
            transform="translate(50 58) scale(1.03) translate(-50 -58)"
          />
        ) : null}
      </svg>
    </AbsoluteFill>
  );
};
