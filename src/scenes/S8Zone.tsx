import { AbsoluteFill } from 'remotion';
import { COULEURS, TEXTES } from '../config';
import { Finition, Halo, Particules } from '../composants/Atmosphere';
import { MOTIF_HEX } from '../composants/Fonds';
import { MotsQuiMontent } from '../composants/Texte';
import { LOGO } from '../marque/logo';
import { TEXTE, TITRE } from '../outils/polices';
import { DOUX, FLUIDE, LENT, mix, prog, ressort, useTemps, versLaFin } from '../outils/temps';
import { Son } from '../son/Son';

/* Scène 8 — Carte stylisée avec Montpellier au centre ; les communes
   s'allument en cascade, les anneaux de 5 et 10 km s'étendent comme une onde.
   Coordonnées reprises de la carte du site (repère 640 × 560). */
export const COMMUNES = [
  { nom: 'Castelnau-le-Lez', x: 365, y: 210, ancre: 'start' },
  { nom: 'Le Crès', x: 441, y: 174, ancre: 'start' },
  { nom: 'Clapiers', x: 343, y: 146, ancre: 'end' },
  { nom: 'Jacou', x: 385, y: 136, ancre: 'start' },
  { nom: 'Montferrier-sur-Lez', x: 284, y: 118, ancre: 'end' },
  { nom: 'Saint-Clément-de-Rivière', x: 256, y: 76, ancre: 'start' },
  { nom: 'Grabels', x: 170, y: 169, ancre: 'end' },
  { nom: 'Juvignac', x: 192, y: 262, ancre: 'end' },
  { nom: 'Saint-Jean-de-Védas', x: 223, y: 362, ancre: 'end' },
  { nom: 'Lattes', x: 366, y: 384, ancre: 'start' },
  { nom: 'Pérols', x: 465, y: 392, ancre: 'start' },
  { nom: 'Vendargues', x: 500, y: 146, ancre: 'start' },
] as const;
const CENTRE = { x: 320, y: 270 };
// Côte du site, prolongée de part et d'autre pour se fondre dans le noir
const MER = 'M-420 476C-260 466 -120 486 0 470C90 452 180 482 290 470S480 450 640 474S860 462 1060 472V980H-420z';

export const S8Zone: React.FC = () => {
  const { t, fps, largeur, hauteur, vertical, reste } = useTemps();
  const zone = TEXTES.zone;
  const entree = prog(t, 0, 0.5);
  const camera = prog(t, 0, 4.5, LENT);
  const sortie = versLaFin(reste, 0.5);

  const onde = (debut: number, duree: number) => prog(t, debut, duree, (x) => 1 - Math.pow(1 - x, 2.4));
  const onde1 = onde(0.35, 1.4);
  const onde2 = onde(0.75, 1.4);
  const anneau5 = prog(t, 0.55, 0.7, FLUIDE);
  const anneau10 = prog(t, 0.85, 0.8, FLUIDE);
  const centre = ressort(t, fps, 0.15, { damping: 11, stiffness: 150 });

  const echelle = vertical ? 1.62 : 1.66;
  const cx = vertical ? largeur / 2 : 1320;
  const cy = vertical ? hauteur * 0.6 : hauteur / 2 + 10;

  return (
    <AbsoluteFill style={{ background: COULEURS.petroleProfond, overflow: 'hidden' }}>
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 65% 70% at ${(cx / largeur) * 100}% ${(cy / hauteur) * 100}%, ${COULEURS.petrole} 0%, ${COULEURS.petroleProfond} 70%, #03110F 100%)` }} />
      <Halo x={(cx / largeur) * 100} y={(cy / hauteur) * 100} taille={560 * echelle} couleur="2,120,18" opacite={0.3 * entree} derive={10} graine="s8a" />
      <Particules nombre={60} graine="s8p" opacite={0.5} vitesse={0.5} />

      <AbsoluteFill style={{ opacity: entree * (1 - sortie) }}>
        {/* Carte */}
        <AbsoluteFill style={{ perspective: 2400 }}>
          <div
            style={{
              position: 'absolute',
              left: cx - 320,
              top: cy - 280,
              width: 640,
              height: 560,
              transform: `scale(${echelle * mix(0.97, 1.04, camera)}) rotateX(${mix(22, 14, camera)}deg) rotateZ(${mix(-3, 0, camera)}deg)`,
              transformStyle: 'preserve-3d',
            }}
          >
            <svg viewBox="0 0 640 560" width={640} height={560} style={{ overflow: 'visible' }}>
              <defs>
                <radialGradient id="terre" cx="50%" cy="48%" r="60%">
                  <stop offset="0" stopColor={COULEURS.petroleClair} stopOpacity="0.9" />
                  <stop offset="1" stopColor={COULEURS.petroleProfond} stopOpacity="0" />
                </radialGradient>
                <pattern id="motif-carte" width="45.03" height="78" patternUnits="userSpaceOnUse">
                  <path d="M22.52 0 45.03 13v26L22.52 52 0 39V13zM22.52 52v26" fill="none" stroke={COULEURS.menthe} strokeOpacity="0.07" />
                </pattern>
                <radialGradient id="eclat-commune">
                  <stop offset="0" stopColor={COULEURS.menthe} stopOpacity="0.9" />
                  <stop offset="0.35" stopColor={COULEURS.vert} stopOpacity="0.5" />
                  <stop offset="1" stopColor={COULEURS.vert} stopOpacity="0" />
                </radialGradient>
                <mask id="masque-carte">
                  <radialGradient id="fondu" cx="50%" cy="48%" r="62%">
                    <stop offset="0.6" stopColor="#fff" />
                    <stop offset="1" stopColor="#000" />
                  </radialGradient>
                  <rect x="-200" y="-200" width="1040" height="960" fill="url(#fondu)" />
                </mask>
              </defs>
              <g mask="url(#masque-carte)">
                <rect x="-200" y="-200" width="1040" height="960" fill="url(#terre)" />
                <rect x="-200" y="-200" width="1040" height="960" fill="url(#motif-carte)" />
                <path d={MER} fill="#051A18" opacity={0.9} />
                <path d={MER} fill="none" stroke={COULEURS.menthe} strokeOpacity={0.18} strokeWidth={1.2} />
              </g>
              <text x={320} y={532} textAnchor="middle" fill={COULEURS.texteSecondaireSombre} fontFamily={TEXTE} fontSize={13} fontStyle="italic" letterSpacing="0.04em" opacity={prog(t, 1.4, 0.6)}>
                {zone.mer}
              </text>

              {/* Onde qui part du centre */}
              {[onde1, onde2].map((o, k) =>
                o > 0 && o < 1 ? (
                  <circle key={k} cx={CENTRE.x} cy={CENTRE.y} r={o * 260} fill="none" stroke={COULEURS.menthe} strokeWidth={2.5 - o * 1.5} opacity={(1 - o) * 0.7} />
                ) : null,
              )}
              {/* Anneaux de 5 et 10 km, en pointillés comme sur le site */}
              <circle cx={CENTRE.x} cy={CENTRE.y} r={120 * DOUX(anneau5)} fill="none" stroke={COULEURS.menthe} strokeOpacity={0.45} strokeWidth={1.4} strokeDasharray="3 6" />
              <circle cx={CENTRE.x} cy={CENTRE.y} r={240 * DOUX(anneau10)} fill="none" stroke={COULEURS.menthe} strokeOpacity={0.35} strokeWidth={1.4} strokeDasharray="3 6" />
              <text x={446} y={266} fill={COULEURS.menthe} fontFamily={TEXTE} fontSize={12} fontWeight={600} opacity={prog(t, 1.0, 0.4) * 0.8}>
                {zone.anneaux[0]}
              </text>
              <text x={566} y={266} fill={COULEURS.menthe} fontFamily={TEXTE} fontSize={12} fontWeight={600} opacity={prog(t, 1.35, 0.4) * 0.8}>
                {zone.anneaux[1]}
              </text>

              {/* Communes : elles s'allument au passage de l'onde */}
              {COMMUNES.map((c) => {
                const d = Math.hypot(c.x - CENTRE.x, c.y - CENTRE.y);
                const tAllume = 0.35 + (d / 260) * 1.05;
                const p = ressort(t, fps, tAllume, { damping: 10, stiffness: 160 });
                const eclat = prog(t, tAllume, 0.12) * (1 - prog(t, tAllume + 0.12, 0.8));
                const dx = c.ancre === 'end' ? -11 : 11;
                return (
                  <g key={c.nom}>
                    <circle cx={c.x} cy={c.y} r={26} fill="url(#eclat-commune)" opacity={0.25 + eclat * 0.75} transform={`translate(${c.x} ${c.y}) scale(${p}) translate(${-c.x} ${-c.y})`} />
                    <circle cx={c.x} cy={c.y} r={6 * p} fill={COULEURS.vert} stroke={COULEURS.menthe} strokeWidth={2} />
                    <text
                      x={c.x + dx}
                      y={c.y + 4}
                      textAnchor={c.ancre}
                      fill="#FFFFFF"
                      fontFamily={TEXTE}
                      fontSize={13.5}
                      fontWeight={500}
                      opacity={prog(t, tAllume + 0.05, 0.35)}
                      style={{ paintOrder: 'stroke' }}
                      stroke={COULEURS.petroleProfond}
                      strokeWidth={4}
                      strokeLinejoin="round"
                    >
                      {c.nom}
                    </text>
                  </g>
                );
              })}

              {/* Montpellier, au centre */}
              <g transform={`translate(${CENTRE.x} ${CENTRE.y}) scale(${centre}) translate(${-CENTRE.x} ${-CENTRE.y})`}>
                <circle cx={CENTRE.x} cy={CENTRE.y} r={46} fill="url(#eclat-commune)" opacity={0.8} />
                <polygon points="320,244 343,257 343,283 320,296 297,283 297,257" fill={COULEURS.menthe} stroke={COULEURS.menthe} strokeWidth={3} strokeLinejoin="round" />
                <g transform="translate(308.5 260.5) scale(0.0325) translate(-709.9 -610)" fill={COULEURS.petrole}>
                  <path d={LOGO.cheminee.d} />
                  <path d={LOGO.toit.d} />
                  <path d={LOGO.maison.d} />
                </g>
              </g>
              <text
                x={320}
                y={322}
                textAnchor="middle"
                fill="#FFFFFF"
                fontFamily={TITRE}
                fontSize={19}
                fontWeight={700}
                letterSpacing="-0.01em"
                opacity={prog(t, 0.35, 0.4)}
                style={{ paintOrder: 'stroke' }}
                stroke={COULEURS.petroleProfond}
                strokeWidth={5}
                strokeLinejoin="round"
              >
                Montpellier
              </text>
            </svg>
          </div>
        </AbsoluteFill>

        {/* Titre */}
        <div
          style={{
            position: 'absolute',
            left: vertical ? 60 : 120,
            right: vertical ? 60 : undefined,
            top: vertical ? 190 : hauteur * 0.36,
            width: vertical ? undefined : 600,
            display: 'flex',
            justifyContent: vertical ? 'center' : 'flex-start',
          }}
        >
          <MotsQuiMontent
            texte={zone.titre}
            debut={0.2}
            taille={vertical ? 110 : 104}
            couleur={COULEURS.blanc}
            style={{ whiteSpace: 'normal', textAlign: vertical ? 'center' : 'left', lineHeight: 1.04 }}
          />
        </div>
      </AbsoluteFill>

      <Finition vignette={0.55} />
      <Son effet="impact-grave" a={0.15} volume={0.4} />
      <Son effet="souffle" a={0.35} volume={0.5} />
      {COMMUNES.map((c, i) => {
        const d = Math.hypot(c.x - CENTRE.x, c.y - CENTRE.y);
        return <Son key={i} effet="tic" a={0.35 + (d / 260) * 1.05} volume={0.18} />;
      })}
    </AbsoluteFill>
  );
};
