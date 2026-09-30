import { AbsoluteFill } from 'remotion';
import { COULEURS, TEXTES } from '../config';
import { Finition, Halo, Particules } from '../composants/Atmosphere';
import { FondStudioClair } from '../composants/Fonds';
import { MotsQuiMontent } from '../composants/Texte';
import { TEXTE, TITRE } from '../outils/polices';
import { FLUIDE, LENT, mix, prog, ressort, useTemps, versLaFin } from '../outils/temps';
import { Son } from '../son/Son';

/* Scène 5 — Gros plan studio sur le nuancier qui s'ouvre en éventail,
   profondeur de champ marquée ; texte : « Prix annoncé. Prix payé. » */

// Proportions d'une nuance du site : 68 × 276 px
const L = 68;
const H = 276;
const PIVOT = { x: 34, y: 254 };

// Reflet propre à chaque finition : mat (aucun), velours, satiné, laqué
const REFLETS = [
  'none',
  'linear-gradient(115deg, rgba(255,255,255,0) 30%, rgba(255,255,255,0.22) 55%, rgba(255,255,255,0) 85%)',
  'linear-gradient(115deg, rgba(255,255,255,0) 38%, rgba(255,255,255,0.32) 52%, rgba(255,255,255,0) 66%)',
  'linear-gradient(115deg, rgba(255,255,255,0) 44%, rgba(255,255,255,0.55) 49%, rgba(255,255,255,0.08) 53%, rgba(255,255,255,0) 70%)',
];

export const S5Nuancier: React.FC = () => {
  const { t, fps, largeur, hauteur, vertical, reste } = useTemps();
  const [ligne1, ligne2] = TEXTES.nuancier.titre;
  const nuances = TEXTES.nuancier.nuances;

  const entree = prog(t, 0, 0.7, FLUIDE);
  const camera = prog(t, 0, 6, LENT);
  const sortie = versLaFin(reste, 0.6);

  const echelle = vertical ? 3.2 : 3.35;
  const pivot = vertical ? { x: largeur * 0.5, y: hauteur * 0.86 } : { x: largeur * 0.69, y: hauteur * 0.93 };
  const angles = vertical ? [-30, -10, 10, 30] : [-34, -14, 6, 26];
  const mise = mix(1.0, 1.07, camera);
  // Mise au point : glisse de la dernière nuance vers la troisième
  const focus = mix(3, 2.2, prog(t, 2.2, 2.5, FLUIDE));

  return (
    <AbsoluteFill style={{ background: COULEURS.mentheLavis, overflow: 'hidden' }}>
      <FondStudioClair x={vertical ? 50 : 66} y={vertical ? 60 : 48} motif={0.3} echelleMotif={2.2} />
      <Halo x={vertical ? 50 : 70} y={vertical ? 58 : 45} taille={largeur * 0.8} couleur="255,255,255" opacite={0.9} derive={20} graine="s5a" />
      <Particules nombre={40} couleur="13,57,52" graine="s5p" opacite={0.12} vitesse={0.5} />

      {/* Éventail */}
      <AbsoluteFill style={{ opacity: entree, transform: `scale(${mise})`, transformOrigin: `${(pivot.x / largeur) * 100}% ${(pivot.y / hauteur) * 100}%` }}>
        <AbsoluteFill style={{ perspective: 2200, perspectiveOrigin: `${(pivot.x / largeur) * 100}% 40%` }}>
          <div
            style={{
              position: 'absolute',
              left: pivot.x,
              top: pivot.y,
              transformStyle: 'preserve-3d',
              transform: `rotateX(${mix(24, 16, camera)}deg) rotateY(${mix(-20, -12, camera)}deg)`,
            }}
          >
            {/* Ombre portée douce */}
            <div
              style={{
                position: 'absolute',
                left: -520,
                top: -120,
                width: 1040,
                height: 260,
                borderRadius: '50%',
                background: 'radial-gradient(ellipse, rgba(13,57,52,0.22), rgba(13,57,52,0) 70%)',
                transform: 'translateZ(-40px) rotateX(70deg)',
                filter: 'blur(10px)',
              }}
            />
            {nuances.map((n, i) => {
              const p = ressort(t, fps, 0.45 + i * 0.12, { damping: 15, stiffness: 55, mass: 1.2 });
              const angle = mix(angles[0] + 4, angles[i], p);
              const flou = Math.abs(i - focus) * (vertical ? 3.2 : 3.6);
              return (
                <div
                  key={i}
                  style={{
                    position: 'absolute',
                    left: -PIVOT.x * echelle,
                    top: -PIVOT.y * echelle,
                    width: L * echelle,
                    height: H * echelle,
                    transformOrigin: `${PIVOT.x * echelle}px ${PIVOT.y * echelle}px`,
                    transform: `translateZ(${i * 14}px) rotate(${angle}deg)`,
                    filter: flou > 0.3 ? `blur(${flou}px)` : undefined,
                  }}
                >
                  <Nuance nom={n.nom} finition={n.finition} couleur={n.couleur} echelle={echelle} reflet={REFLETS[i]} t={t} i={i} />
                </div>
              );
            })}
          </div>
        </AbsoluteFill>
      </AbsoluteFill>

      {/* Texte */}
      <AbsoluteFill style={{ opacity: 1 - sortie }}>
        <div
          style={{
            position: 'absolute',
            left: vertical ? 0 : 130,
            right: vertical ? 0 : undefined,
            top: vertical ? 220 : hauteur * 0.34,
            display: 'flex',
            flexDirection: 'column',
            alignItems: vertical ? 'center' : 'flex-start',
            gap: 8,
          }}
        >
          <MotsQuiMontent texte={ligne1} debut={1.0} taille={vertical ? 118 : 132} couleur={COULEURS.petrole} />
          <MotsQuiMontent texte={ligne2} debut={1.85} taille={vertical ? 118 : 132} couleur={COULEURS.vert} />
        </div>
      </AbsoluteFill>

      <Finition vignette={0.2} grain={0.045} couleurVignette="13,57,52" />
      <Son effet="souffle" a={0.4} volume={0.45} />
      {nuances.map((_, i) => (
        <Son key={i} effet="tic" a={0.62 + i * 0.12} volume={0.35} />
      ))}
      <Son effet="souffle-court" a={1.0} volume={0.3} />
      <Son effet="souffle-court" a={1.85} volume={0.3} />
    </AbsoluteFill>
  );
};

/* Une nuance du nuancier, fidèle au site, agrandie pour le gros plan */
const Nuance: React.FC<{ nom: string; finition: string; couleur: string; echelle: number; reflet: string; t: number; i: number }> = ({
  nom,
  finition,
  couleur,
  echelle: e,
  reflet,
  t,
  i,
}) => {
  const balayage = ((t * 0.18 + i * 0.07) % 1) * 100;
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: 8 * e,
        padding: 6 * e,
        borderRadius: `${12 * e}px ${12 * e}px ${16 * e}px ${16 * e}px`,
        background: '#FFFFFF',
        border: `${e}px solid #E4EFED`,
        boxShadow: `0 ${1 * e}px ${2 * e}px rgba(13,57,52,0.05), 0 ${10 * e}px ${28 * e}px -${8 * e}px rgba(13,57,52,0.22)`,
      }}
    >
      <div style={{ position: 'relative', flex: 1, borderRadius: 8 * e, background: couleur, boxShadow: `inset 0 0 0 ${e}px rgba(13,57,52,0.1)`, overflow: 'hidden' }}>
        {reflet !== 'none' ? (
          <div style={{ position: 'absolute', inset: '-20%', background: reflet, transform: `translateY(${balayage - 50}%)` }} />
        ) : null}
      </div>
      <div style={{ padding: `0 ${3 * e}px ${30 * e}px`, fontFamily: TITRE, fontSize: 12.5 * e, fontWeight: 600, lineHeight: 1.2, color: COULEURS.petrole }}>
        {nom}
        <div style={{ marginTop: 2 * e, fontFamily: TEXTE, fontSize: 10 * e, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#5E7572' }}>
          {finition}
        </div>
      </div>
      <div
        style={{
          position: 'absolute',
          left: '50%',
          bottom: 17 * e,
          width: 10 * e,
          height: 10 * e,
          marginLeft: -5 * e,
          borderRadius: '50%',
          background: '#D3E4E1',
          boxShadow: `inset 0 ${e}px ${e}px rgba(13,57,52,0.25)`,
        }}
      />
    </div>
  );
};
