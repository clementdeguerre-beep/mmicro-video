import { getLength, getPointAtLength } from '@remotion/paths';
import { useId, useMemo } from 'react';
import { COULEURS } from '../config';
import { LETTRES, LOGO, LOGO_VIEWBOX } from '../marque/logo';
import { FLUIDE, mix } from '../outils/temps';

const VB = LOGO_VIEWBOX;
export const LOGO_RATIO = VB.h / VB.w; // hauteur / largeur
export const CENTRE_LOGO = { x: VB.x + VB.w / 2, y: VB.y + VB.h / 2 };
// Centre du dessin de la maison (pour les zooms)
export const CENTRE_ICONE = { x: 1066, y: 905 };

export type EtatLogo = {
  trace?: number; // tracé de l'hexagone, 0 → 1 (segment par segment)
  remplissage?: number; // hexagone menthe, 0 → 1
  icone?: number; // maison-marteau, 0 → 1
  mot?: number; // « MMICRO », 0 → 1
  sous?: number; // « MULTISERVICES », 0 → 1
  reflet?: number | null; // reflet qui balaie, 0 → 1
  lueur?: number; // halo du tracé, 0 → 1
  couleurTrace?: string;
};

/** Tracé « ligne par ligne » : les six côtés se dessinent l'un après l'autre */
const parSegments = (p: number) => {
  if (p <= 0) return 0;
  if (p >= 1) return 1;
  const k = Math.min(5, Math.floor(p * 6));
  const local = p * 6 - k;
  return (k + FLUIDE(local)) / 6;
};

export const Logo: React.FC<{ largeur: number; etat: EtatLogo; style?: React.CSSProperties }> = ({ largeur, etat, style }) => {
  const {
    trace = 1,
    remplissage = 1,
    icone = 1,
    mot = 1,
    sous = 1,
    reflet = null,
    lueur = 0,
    couleurTrace = COULEURS.menthe,
  } = etat;
  const uid = useId().replace(/:/g, '');
  const longueur = useMemo(() => getLength(LOGO.hexagone.d), []);
  const pt = parSegments(trace);
  const tete = pt > 0 && pt < 1 ? getPointAtLength(LOGO.hexagone.d, longueur * pt) : null;
  const hauteur = largeur * LOGO_RATIO;
  const echelle = largeur / VB.w; // px par unité du logo

  // Lettres : elles se resserrent vers leur place finale
  const lettres = (liste: readonly { d: string; x: number }[], p: number, ecart: number, couleur: string) => {
    const centre = liste.reduce((s, l) => s + l.x, 0) / liste.length;
    return liste.map((l, i) => {
      const pl = Math.min(1, Math.max(0, p * 1.35 - (i / liste.length) * 0.35));
      const dx = (l.x - centre) * ecart * (1 - pl);
      return <path key={i} d={l.d} fill={couleur} opacity={pl} transform={`translate(${dx} 0)`} />;
    });
  };

  return (
    <svg
      width={largeur}
      height={hauteur}
      viewBox={`${VB.x} ${VB.y} ${VB.w} ${VB.h}`}
      style={{ overflow: 'visible', display: 'block', ...style }}
    >
      <defs>
        <filter id={`lueur-trace-${uid}`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation={10 / Math.max(0.2, echelle)} />
        </filter>
        <radialGradient id={`tete-trace-${uid}`}>
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="1" />
          <stop offset="0.25" stopColor={COULEURS.menthe} stopOpacity="0.9" />
          <stop offset="1" stopColor={COULEURS.vert} stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`remplissage-hexa-${uid}`} cx="50%" cy="45%" r="75%">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity={Math.max(0, 1 - remplissage) * 0.9} />
          <stop offset="1" stopColor={COULEURS.menthe} stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`reflet-logo-${uid}`} gradientUnits="userSpaceOnUse" x1={VB.x} y1={VB.y} x2={VB.x + VB.w} y2={VB.y + VB.h * 0.35}>
          {reflet !== null ? (
            <>
              <stop offset={Math.max(0, mix(-0.3, 1.2, reflet) - 0.12)} stopColor="#FFFFFF" stopOpacity="0" />
              <stop offset={Math.min(1, Math.max(0, mix(-0.3, 1.2, reflet)))} stopColor="#FFFFFF" stopOpacity="0.85" />
              <stop offset={Math.min(1, mix(-0.3, 1.2, reflet) + 0.12)} stopColor="#FFFFFF" stopOpacity="0" />
            </>
          ) : (
            <stop offset="0" stopColor="#FFFFFF" stopOpacity="0" />
          )}
        </linearGradient>
        <clipPath id={`clip-hexa-${uid}`}>
          <path d={LOGO.hexagone.d} />
        </clipPath>
      </defs>

      {/* Hexagone menthe qui se remplit de lumière */}
      <g opacity={remplissage}>
        <path d={LOGO.hexagone.d} fill={LOGO.hexagone.couleur} />
        <path d={LOGO.hexagone.d} fill={`url(#remplissage-hexa-${uid})`} />
      </g>

      {/* Tracé lumineux de l'hexagone */}
      {pt > 0 && lueur > 0 ? (
        <path
          d={LOGO.hexagone.d}
          fill="none"
          stroke={COULEURS.vert}
          strokeWidth={34}
          strokeDasharray={`${longueur * pt} ${longueur}`}
          filter={`url(#lueur-trace-${uid})`}
          opacity={lueur}
        />
      ) : null}
      {pt > 0 ? (
        <path
          d={LOGO.hexagone.d}
          fill="none"
          stroke={couleurTrace}
          strokeWidth={10}
          strokeLinecap="round"
          strokeDasharray={`${longueur * pt} ${longueur}`}
          opacity={Math.max(0, 1 - remplissage * 0.9)}
        />
      ) : null}
      {tete ? <circle cx={tete.x} cy={tete.y} r={120} fill={`url(#tete-trace-${uid})`} /> : null}

      {/* Maison-marteau */}
      <g
        opacity={Math.min(1, icone * 1.6)}
        transform={`translate(${CENTRE_ICONE.x} ${CENTRE_ICONE.y}) scale(${mix(0.86, 1, icone)}) translate(${-CENTRE_ICONE.x} ${-CENTRE_ICONE.y + (1 - icone) * 60})`}
      >
        <path d={LOGO.cheminee.d} fill={LOGO.cheminee.couleur} />
        <path d={LOGO.toit.d} fill={LOGO.toit.couleur} />
        <path d={LOGO.maison.d} fill={LOGO.maison.couleur} />
      </g>

      {/* MMICRO puis MULTISERVICES */}
      <g>{lettres(LETTRES.mot, mot, 0.35, LOGO.mot.couleur)}</g>
      <g>{lettres(LETTRES.sousTitre, sous, 0.9, LOGO.sousTitre.couleur)}</g>

      {/* Reflet qui balaie le logo (limité à l'hexagone) */}
      {reflet !== null && reflet > 0 && reflet < 1 ? (
        <rect
          x={VB.x}
          y={VB.y}
          width={VB.w}
          height={VB.h}
          fill={`url(#reflet-logo-${uid})`}
          clipPath={`url(#clip-hexa-${uid})`}
          style={{ mixBlendMode: 'soft-light' }}
        />
      ) : null}
    </svg>
  );
};
