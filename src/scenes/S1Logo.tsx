import { AbsoluteFill } from 'remotion';
import { COULEURS } from '../config';
import { Faisceaux, Finition, Halo, Particules } from '../composants/Atmosphere';
import { CENTRE_LOGO, Logo, LOGO_RATIO } from '../composants/Logo';
import { LOGO_VIEWBOX } from '../marque/logo';
import { FLUIDE, LENT, mix, prog, ressort, useTemps, versLaFin } from '../outils/temps';
import { Son } from '../son/Son';

/* Scène 1 — Noir. Un point de lumière verte devient un hexagone tracé ligne
   par ligne ; la maison-marteau apparaît, un reflet la balaie ; « MMICRO »
   puis « MULTISERVICES » se révèlent. Impact sonore grave. */
const FAISCEAUX = [
  { x: 26, angle: -20, largeur: 380, opacite: 0.09 },
  { x: 76, angle: 16, largeur: 280, opacite: 0.07 },
];

export const S1Logo: React.FC = () => {
  const { t: tReel, fps, largeur, hauteur, vertical, reste, duree } = useTemps();
  // Scène plus courte (version verticale) : toute la chronologie s'accélère
  const k = Math.min(1, duree / 5);
  const t = tReel / k;

  const largeurLogo = vertical ? largeur * 0.56 : hauteur * 0.52;
  const hLogo = largeurLogo * LOGO_RATIO;
  const echelle = largeurLogo / LOGO_VIEWBOX.w;

  // Chronologie (secondes)
  const apparitionPoint = prog(t, 0.3, 0.6, FLUIDE);
  const descente = prog(t, 0.9, 0.3, FLUIDE); // le point rejoint le bas de l'hexagone
  const trace = prog(t, 1.2, 1.2, (x) => x);
  const remplissage = prog(t, 2.35, 0.5);
  const icone = ressort(t, fps * k, 2.5, { damping: 13, stiffness: 140 });
  const mot = prog(t, 2.7, 0.75);
  const sous = prog(t, 2.85, 0.7);
  const reflet = prog(t, 3.0, 1.1, FLUIDE);
  const eclat = prog(t, 2.35, 0.12) * (1 - prog(t, 2.47, 0.9)); // flash au remplissage

  // Caméra : avance lente, puis sortie vers la scène suivante
  const avance = mix(0.94, 1.03, prog(t, 0, 5, LENT));
  const sortie = versLaFin(reste, 0.45); // 0 → 1 dans les 0,45 dernières secondes
  const fin = 1 - sortie;

  // Position du point lumineux : centre de l'hexagone puis sommet du bas
  const cx = largeur / 2;
  const cy = hauteur / 2;
  const basHexa = cy + (2304 - CENTRE_LOGO.y) * echelle;
  const py = mix(cy, basHexa, descente);
  const rayonPoint = mix(0, 26, apparitionPoint) * (1 - descente * 0.6);
  const pointVisible = t < 1.25;

  return (
    <AbsoluteFill style={{ background: COULEURS.noir, overflow: 'hidden' }}>
      <Halo x={50} y={50} taille={largeurLogo * 2.6} couleur="2,120,18" opacite={0.34 * Math.max(apparitionPoint * 0.5, remplissage)} graine="s1a" />
      <Halo x={50} y={46} taille={largeurLogo * 1.5} couleur="204,248,246" opacite={0.16 * remplissage + eclat * 0.35} graine="s1b" />
      <Faisceaux faisceaux={FAISCEAUX} intensite={remplissage} />
      <Particules nombre={120} faisceaux={FAISCEAUX} opacite={0.35 + remplissage * 0.65} graine="s1p" />

      <AbsoluteFill style={{ transform: `scale(${avance * (1 + sortie * 0.08)})`, opacity: fin }}>
        {pointVisible ? (
          <div
            style={{
              position: 'absolute',
              left: cx - rayonPoint * 4,
              top: py - rayonPoint * 4,
              width: rayonPoint * 8,
              height: rayonPoint * 8,
              borderRadius: '50%',
              background: `radial-gradient(circle, #ffffff 0%, ${COULEURS.menthe} 9%, rgba(2,120,18,0.75) 22%, rgba(2,120,18,0) 62%)`,
              filter: descente > 0 && descente < 1 ? 'blur(1px)' : undefined,
            }}
          />
        ) : null}
        <div style={{ position: 'absolute', left: cx - largeurLogo / 2, top: cy - hLogo / 2 }}>
          <Logo
            largeur={largeurLogo}
            etat={{ trace, remplissage, icone, mot, sous, reflet, lueur: 1 - remplissage * 0.7 }}
          />
        </div>
        {/* Éclat lumineux au moment où l'hexagone se remplit */}
        <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 50%, rgba(204,248,246,${eclat * 0.5}), rgba(204,248,246,0) 45%)` }} />
      </AbsoluteFill>

      <Finition />
      <Son effet="souffle-montant" a={0.2 * k} volume={0.5} />
      <Son effet="impact-grave" a={2.35 * k} volume={1} />
      <Son effet="scintillement" a={3.0 * k} volume={0.4} />
    </AbsoluteFill>
  );
};
