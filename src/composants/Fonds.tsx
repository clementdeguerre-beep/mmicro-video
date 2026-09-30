import { AbsoluteFill } from 'remotion';
import { COULEURS } from '../config';

/* Motif hexagonal du site (en filigrane) */
export const MOTIF_HEX = (couleur = '%230D3934', opacite = 0.1) =>
  `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='45.03' height='78' viewBox='0 0 45.03 78'%3E%3Cpath d='M22.52 0 45.03 13v26L22.52 52 0 39V13zM22.52 52v26' fill='none' stroke='${couleur}' stroke-opacity='${opacite}' stroke-width='1'/%3E%3C/svg%3E")`;

/** Fond de studio clair : blanc au centre, menthe très clair sur les bords */
export const FondStudioClair: React.FC<{ x?: number; y?: number; motif?: number; echelleMotif?: number }> = ({
  x = 55,
  y = 42,
  motif = 0.55,
  echelleMotif = 1.6,
}) => (
  <AbsoluteFill>
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse 75% 70% at ${x}% ${y}%, #FFFFFF 0%, #F4FCFB 40%, ${COULEURS.mentheLavis} 62%, #D6F2EF 100%)`,
      }}
    />
    <AbsoluteFill
      style={{
        backgroundImage: MOTIF_HEX(),
        backgroundSize: `${45.03 * echelleMotif}px ${78 * echelleMotif}px`,
        opacity: motif,
        maskImage: `radial-gradient(ellipse 55% 60% at ${x + 10}% ${y}%, #000 0%, transparent 75%)`,
        WebkitMaskImage: `radial-gradient(ellipse 55% 60% at ${x + 10}% ${y}%, #000 0%, transparent 75%)`,
      }}
    />
  </AbsoluteFill>
);

/** Fond pétrole, avec une lumière douce */
export const FondPetrole: React.FC<{ x?: number; y?: number; motif?: number }> = ({ x = 50, y = 45, motif = 0.5 }) => (
  <AbsoluteFill>
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse 80% 75% at ${x}% ${y}%, ${COULEURS.petroleClair} 0%, ${COULEURS.petrole} 45%, ${COULEURS.petroleProfond} 100%)`,
      }}
    />
    <AbsoluteFill
      style={{
        backgroundImage: MOTIF_HEX('%23CCF8F6', 0.08),
        backgroundSize: `${45.03 * 1.8}px ${78 * 1.8}px`,
        opacity: motif,
        maskImage: `radial-gradient(ellipse 60% 60% at ${x}% ${y}%, #000 0%, transparent 80%)`,
        WebkitMaskImage: `radial-gradient(ellipse 60% 60% at ${x}% ${y}%, #000 0%, transparent 80%)`,
      }}
    />
  </AbsoluteFill>
);
