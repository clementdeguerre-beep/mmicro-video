import { AbsoluteFill, random, useCurrentFrame } from 'remotion';
import { noise2D, noise3D } from '@remotion/noise';
import { IMAGE } from '../config';
import { useTemps } from '../outils/temps';

/* ---------- Grain de pellicule ----------
   Une tuile de bruit calculée une fois, décalée au hasard à chaque image. */
const TUILE_GRAIN = `url("data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' width='256' height='256'><filter id='g'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/></filter><rect width='256' height='256' filter='url(#g)'/></svg>`,
)}")`;

export const Grain: React.FC<{ intensite?: number }> = ({ intensite = IMAGE.grain }) => {
  const frame = useCurrentFrame();
  if (intensite <= 0) return null;
  const x = Math.floor(random(`gx${frame}`) * 256);
  const y = Math.floor(random(`gy${frame}`) * 256);
  return (
    <AbsoluteFill
      style={{
        backgroundImage: TUILE_GRAIN,
        backgroundPosition: `${x}px ${y}px`,
        opacity: intensite,
        mixBlendMode: 'overlay',
        pointerEvents: 'none',
      }}
    />
  );
};

/* ---------- Vignettage discret ---------- */
export const Vignette: React.FC<{ force?: number; couleur?: string }> = ({ force = IMAGE.vignettage, couleur = '0,0,0' }) => (
  <AbsoluteFill
    style={{
      background: `radial-gradient(ellipse 75% 70% at 50% 50%, rgba(${couleur},0) 55%, rgba(${couleur},${force}) 100%)`,
      pointerEvents: 'none',
    }}
  />
);

/* ---------- Halo de lumière diffuse ---------- */
export const Halo: React.FC<{
  x: number; // centre, en % de la largeur
  y: number; // centre, en % de la hauteur
  taille: number; // diamètre, en px
  couleur: string; // 'r,g,b'
  opacite?: number;
  derive?: number; // amplitude de la dérive lente, en px
  graine?: string;
}> = ({ x, y, taille, couleur, opacite = 0.5, derive = 40, graine = 'h' }) => {
  const { t } = useTemps();
  const dx = noise2D(graine + 'x', t * 0.12, 0) * derive;
  const dy = noise2D(graine + 'y', t * 0.12, 0) * derive;
  const respiration = 1 + noise2D(graine + 's', t * 0.2, 0) * 0.06;
  return (
    <div
      style={{
        position: 'absolute',
        left: `calc(${x}% - ${taille / 2}px)`,
        top: `calc(${y}% - ${taille / 2}px)`,
        width: taille,
        height: taille,
        borderRadius: '50%',
        background: `radial-gradient(circle, rgba(${couleur},${opacite}) 0%, rgba(${couleur},${opacite * 0.45}) 28%, rgba(${couleur},0) 68%)`,
        transform: `translate(${dx}px, ${dy}px) scale(${respiration})`,
        pointerEvents: 'none',
      }}
    />
  );
};

/* ---------- Faisceaux de lumière ---------- */
export type Faisceau = { x: number; angle: number; largeur: number; opacite: number };

export const Faisceaux: React.FC<{ faisceaux: Faisceau[]; couleur?: string; intensite?: number }> = ({
  faisceaux,
  couleur = '204,248,246',
  intensite = 1,
}) => {
  const { t } = useTemps();
  return (
    <AbsoluteFill style={{ overflow: 'hidden', mixBlendMode: 'screen', pointerEvents: 'none' }}>
      {faisceaux.map((f, i) => {
        const oscille = 1 + noise2D(`f${i}`, t * 0.25, 0) * 0.25;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${f.x}%`,
              top: '-40%',
              width: f.largeur,
              height: '180%',
              marginLeft: -f.largeur / 2,
              transform: `rotate(${f.angle + noise2D(`fa${i}`, t * 0.1, 0) * 1.5}deg)`,
              transformOrigin: '50% 0%',
              background: `linear-gradient(90deg, rgba(${couleur},0) 0%, rgba(${couleur},${f.opacite * oscille * intensite}) 50%, rgba(${couleur},0) 100%)`,
              maskImage: 'linear-gradient(180deg, transparent 12%, black 40%, black 60%, transparent 92%)',
              WebkitMaskImage: 'linear-gradient(180deg, transparent 12%, black 40%, black 60%, transparent 92%)',
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

/* ---------- Fines particules en suspension ----------
   Plus brillantes dans les faisceaux ; les plus proches sont floues (bokeh). */
export const Particules: React.FC<{
  nombre?: number;
  couleur?: string;
  graine?: string;
  faisceaux?: Faisceau[];
  opacite?: number;
  vitesse?: number;
}> = ({ nombre = 90, couleur = '204,248,246', graine = 'p', faisceaux = [], opacite = 1, vitesse = 1 }) => {
  const { t, largeur, hauteur } = useTemps();
  const lumiere = (px: number, py: number) => {
    if (faisceaux.length === 0) return 1;
    let l = 0.25;
    for (const f of faisceaux) {
      // distance au faisceau (droite passant par le haut de l'image)
      const cx = (f.x / 100) * largeur;
      const cy = -0.4 * hauteur;
      const a = (f.angle * Math.PI) / 180;
      const dx = px - cx;
      const dy = py - cy;
      const d = Math.abs(dx * Math.cos(a) + dy * Math.sin(a));
      l = Math.max(l, Math.exp(-(d * d) / (2 * (f.largeur * 0.35) ** 2)));
    }
    return l;
  };
  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      {new Array(nombre).fill(0).map((_, i) => {
        const z = random(`${graine}z${i}`); // 0 = loin, 1 = près
        const x0 = random(`${graine}x${i}`) * largeur;
        const y0 = random(`${graine}y${i}`) * hauteur;
        const derive = t * vitesse * (6 + z * 22);
        const x = ((x0 + noise3D(graine, i, t * 0.05, 0) * 60 + derive * 0.4) % (largeur + 40)) - 20;
        const y = (((y0 - derive + noise3D(graine, i, 0, t * 0.05) * 60) % (hauteur + 40)) + hauteur + 40) % (hauteur + 40) - 20;
        const taille = z > 0.92 ? 10 + z * 16 : 1.2 + z * 3.2;
        const scintille = 0.6 + 0.4 * noise2D(`${graine}s${i}`, t * 0.8, 0);
        const a = Math.min(1, (z > 0.92 ? 0.22 : 0.55 + z * 0.4) * lumiere(x, y) * scintille * opacite);
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: x - taille / 2,
              top: y - taille / 2,
              width: taille,
              height: taille,
              borderRadius: '50%',
              background: `radial-gradient(circle, rgba(${couleur},${a}) 0%, rgba(${couleur},${a * 0.5}) ${z > 0.92 ? 55 : 40}%, rgba(${couleur},0) 72%)`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

/* ---------- Reflet qui balaie ----------
   Bande lumineuse diagonale ; `p` va de 0 (à gauche) à 1 (à droite). */
export const Reflet: React.FC<{ p: number; angle?: number; largeur?: number; opacite?: number }> = ({
  p,
  angle = 20,
  largeur = 22,
  opacite = 0.55,
}) => {
  const pos = -40 + p * 180;
  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(${90 + angle}deg, rgba(255,255,255,0) ${pos - largeur}%, rgba(255,255,255,${opacite}) ${pos}%, rgba(255,255,255,0) ${pos + largeur}%)`,
        mixBlendMode: 'soft-light',
        pointerEvents: 'none',
      }}
    />
  );
};

/* ---------- Finition commune à toutes les scènes ---------- */
export const Finition: React.FC<{ vignette?: number; grain?: number; couleurVignette?: string }> = ({
  vignette = IMAGE.vignettage,
  grain = IMAGE.grain,
  couleurVignette,
}) => (
  <>
    <Vignette force={vignette} couleur={couleurVignette} />
    <Grain intensite={grain} />
  </>
);
