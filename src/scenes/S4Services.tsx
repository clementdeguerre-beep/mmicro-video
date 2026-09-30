import { AbsoluteFill, Img, random, staticFile } from 'remotion';
import captures from '../../public/captures/captures.json';
import { COULEURS, TEXTES } from '../config';
import { Finition, Halo, Particules } from '../composants/Atmosphere';
import { DEFILEMENT_SERVICES } from '../composants/EcranSite';
import { FondStudioClair } from '../composants/Fonds';
import { Hexa } from '../composants/Hexa';
import { MotsQuiMontent } from '../composants/Texte';
import { NomIcone } from '../marque/icones';
import { largeurTexte } from '../outils/mesure';
import { FLUIDE, LENT, mix, prog, ressort, useTemps, versLaFin } from '../outils/temps';
import { Son } from '../son/Son';
import { useImages } from '../trois/outils3d';
import { SitePleinEcran } from './S3Ordinateur';

/* Scène 4 — « Quatre métiers. Un seul interlocuteur. » Les cartes Peinture,
   Remise en état, Petits travaux et Dépannage arrivent en 3D et s'assemblent
   en grille avec parallaxe ; chaque icône hexagonale apparaît avec un rebond. */

type Carte = { id: string; icone: NomIcone; x: number; y: number; w: number; h: number; sombre?: boolean };

// Grille « ordinateur » : positions relevées sur le site (px du site)
const E = captures.ordinateur.elements;
const GRILLE: Carte[] = [
  { id: 'peinture', icone: 'rouleau', x: E.cartePeinture.x - E.bento.x, y: E.cartePeinture.y - E.bento.y, w: E.cartePeinture.w, h: E.cartePeinture.h },
  { id: 'remise', icone: 'maison', x: E.carteRemise.x - E.bento.x, y: E.carteRemise.y - E.bento.y, w: E.carteRemise.w, h: E.carteRemise.h },
  { id: 'petits', icone: 'boite', x: E.cartePetits.x - E.bento.x, y: E.cartePetits.y - E.bento.y, w: E.cartePetits.w, h: E.cartePetits.h },
  { id: 'depannage', icone: 'chrono', x: E.carteDepannage.x - E.bento.x, y: E.carteDepannage.y - E.bento.y, w: E.carteDepannage.w, h: E.carteDepannage.h, sombre: true },
];

// Grille « vertical » : cartes du site mobile, en deux colonnes
const M = captures.cartesMobile;
const GRILLE_MOBILE: Carte[] = [
  { id: 'peinture', icone: 'rouleau', x: 0, y: 0, w: M.peinture.w, h: M.peinture.h },
  { id: 'remise', icone: 'maison', x: M.peinture.w + 16, y: 0, w: M.remise.w, h: M.remise.h },
  { id: 'petits', icone: 'boite', x: 0, y: M.peinture.h + 16, w: M.petits.w, h: M.petits.h },
  { id: 'depannage', icone: 'chrono', x: M.peinture.w + 16, y: M.remise.h + 16, w: M.depannage.w, h: M.depannage.h, sombre: true },
];

export const S4Services: React.FC = () => {
  const { t, largeur, hauteur, vertical, reste, duree } = useTemps();
  const images = useImages([staticFile('captures/ordinateur/defilement.png')]);
  const [ligne1, ligne2] = TEXTES.services.titre;

  // ---- Chronologie (secondes) ----
  const T = vertical
    ? { mots1: 0.25, mots2: 0.85, deplacement: 1.6, cartes: 1.8, icones: 2.5 }
    : { mots1: 0.45, mots2: 1.35, deplacement: 2.45, cartes: 2.6, icones: 3.45 };

  const dissolution = prog(t, 0.05, 0.7, FLUIDE);
  const deplacement = prog(t, T.deplacement, 1.05, FLUIDE);
  const sortie = versLaFin(reste, 0.55);

  // ---- Titre : très grand et centré, puis plus petit sur le côté ----
  const grand = vertical ? 132 : 158;
  const petit = vertical ? 84 : 80;
  const echelle = mix(1, petit / grand, deplacement);
  const lignes = [ligne1, ligne2];
  const interligne = grand * 1.02;
  const largeurs = lignes.map((l) => largeurTexte(l, grand));
  // Position de chaque ligne (coin haut gauche, à la taille « grand »)
  const placer = (k: number) => {
    const hBloc = interligne * lignes.length;
    const debut = { x: (largeur - largeurs[k]) / 2, y: (hauteur - hBloc) / 2 + k * interligne };
    const fin = vertical
      ? { x: (largeur - largeurs[k] * (petit / grand)) / 2, y: 150 + k * petit * 1.04 }
      : { x: 120, y: (hauteur - petit * 1.04 * 2) / 2 - 30 + k * petit * 1.04 };
    return { x: mix(debut.x, fin.x, deplacement), y: mix(debut.y, fin.y, deplacement) };
  };

  // ---- Grille de cartes ----
  const cartes = vertical ? GRILLE_MOBILE : GRILLE;
  const lG = vertical ? M.peinture.w * 2 + 16 : E.bento.w;
  const hG = vertical ? Math.max(M.peinture.h + M.petits.h, M.remise.h + M.depannage.h) + 16 : E.bento.h;
  const eG = vertical ? 1.22 : 0.74;
  const cxG = vertical ? largeur / 2 : 1385;
  const cyG = vertical ? 1185 : hauteur / 2 + 8;
  const tenue = prog(t, T.cartes + 0.8, 6, LENT); // lente dérive de la caméra
  const rotY = vertical ? mix(7, 3, tenue) : mix(-15, -8, tenue);
  const rotX = vertical ? mix(10, 6, tenue) : mix(6, 3, tenue);

  return (
    <AbsoluteFill style={{ background: COULEURS.mentheLavis, overflow: 'hidden' }}>
      <FondStudioClair x={vertical ? 50 : 62} y={vertical ? 55 : 45} />
      <Halo x={vertical ? 50 : 70} y={vertical ? 62 : 55} taille={largeur * 0.9} couleur="204,248,246" opacite={0.7} graine="s4a" />
      <Halo x={vertical ? 20 : 12} y={vertical ? 90 : 88} taille={largeur * 0.5} couleur="2,120,18" opacite={0.06} graine="s4b" />
      <Particules nombre={50} couleur="2,120,18" graine="s4p" opacite={0.18} vitesse={0.6} />

      {/* Le site s'efface : on ne garde que le message */}
      {dissolution < 1 && !vertical ? (
        <AbsoluteFill style={{ opacity: 1 - dissolution, transform: `scale(${mix(1, 0.93, dissolution)})`, filter: `blur(${dissolution * 12}px)` }}>
          <SitePleinEcran site={images?.[0] ?? null} defilement={DEFILEMENT_SERVICES} />
        </AbsoluteFill>
      ) : null}

      <AbsoluteFill style={{ opacity: 1 - sortie, transform: `scale(${1 + sortie * 0.06})` }}>
        {/* Titre */}
        {lignes.map((ligne, k) => {
          const p = placer(k);
          return (
            <div key={k} style={{ position: 'absolute', left: p.x, top: p.y, transform: `scale(${echelle})`, transformOrigin: '0 0' }}>
              <MotsQuiMontent texte={ligne} debut={k === 0 ? T.mots1 : T.mots2} taille={grand} couleur={COULEURS.petrole} ecart={0.1} />
            </div>
          );
        })}

        {/* Cartes en 3D */}
        <AbsoluteFill style={{ perspective: 2600, perspectiveOrigin: `${(cxG / largeur) * 100}% 50%` }}>
          <div
            style={{
              position: 'absolute',
              left: cxG - lG / 2,
              top: cyG - hG / 2,
              width: lG,
              height: hG,
              transformStyle: 'preserve-3d',
              transform: `scale(${eG}) rotateX(${rotX}deg) rotateY(${rotY}deg)`,
            }}
          >
            {cartes.map((c, i) => (
              <CarteVolante key={c.id} carte={c} i={i} debut={T.cartes + i * 0.13} debutIcone={T.icones + i * 0.16} vertical={vertical} />
            ))}
          </div>
        </AbsoluteFill>
      </AbsoluteFill>

      <Finition vignette={0.22} grain={0.045} couleurVignette="13,57,52" />

      <Son effet="souffle" a={0.1} volume={0.35} />
      <Son effet="souffle-court" a={T.mots1} volume={0.3} />
      <Son effet="souffle-court" a={T.mots2} volume={0.3} />
      {cartes.map((_, i) => (
        <Son key={`s${i}`} effet="souffle-court" a={T.cartes + i * 0.13} volume={0.35} />
      ))}
      {cartes.map((_, i) => (
        <Son key={`c${i}`} effet="clic" a={T.icones + i * 0.16 + 0.05} volume={0.55} />
      ))}
      <Son effet="souffle-montant" a={duree - 0.6} volume={0.3} />
    </AbsoluteFill>
  );
};

const CarteVolante: React.FC<{ carte: Carte; i: number; debut: number; debutIcone: number; vertical: boolean }> = ({
  carte,
  i,
  debut,
  debutIcone,
  vertical,
}) => {
  const { t, fps } = useTemps();
  const cfg = { damping: 17, stiffness: 62, mass: 1.1 };
  const p = ressort(t, fps, debut, cfg);
  const pAvant = ressort(t - 1 / fps, fps, debut, cfg);
  const vitesse = Math.abs(p - pAvant) * fps;
  const r = (k: string) => random(`carte-${k}-${i}`) - 0.5;
  // Point de départ : loin derrière, décalé vers l'extérieur, incliné
  // En 16:9 les cartes viennent de la droite, pour ne jamais passer devant le titre
  const sx = vertical ? (carte.x + carte.w / 2 < 370 ? -1 : 1) : 1;
  const sy = carte.y + carte.h / 2 < (vertical ? 500 : 520) ? -1 : 1;
  const dx = (1 - p) * sx * (vertical ? 700 : 700 + (carte.x > 400 ? 500 : 0) + r('x') * 300);
  const dy = (1 - p) * sy * (500 + r('y') * 200);
  const dz = (1 - p) * -2400 + [0, 50, 25, 75][i];
  const rx = (1 - p) * (sy * -38 + r('rx') * 20);
  const ry = (1 - p) * (sx * 46 + r('ry') * 20);
  const rz = (1 - p) * r('rz') * 24;
  const opacite = Math.min(1, p * 3);

  // Icône : rebond amorti
  const pi = ressort(t, fps, debutIcone, { damping: 9, stiffness: 170, mass: 0.8 });
  const hexa = (vertical ? M : captures.cartes)[carte.id as 'peinture'].hexa;
  const suffixe = vertical ? '-mobile' : '';

  return (
    <div
      style={{
        position: 'absolute',
        left: carte.x,
        top: carte.y,
        width: carte.w,
        height: carte.h,
        opacity: opacite,
        transform: `translate3d(${dx}px, ${dy}px, ${dz}px) rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${rz}deg)`,
        filter: vitesse > 0.35 ? `blur(${Math.min(7, vitesse * 3)}px)` : undefined,
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: vertical ? 28 : 28,
          boxShadow: '0 2px 6px rgba(13,57,52,0.05), 0 30px 70px -18px rgba(13,57,52,0.34)',
        }}
      />
      <Img src={staticFile(`captures/elements/carte-${carte.id}${suffixe}-sans-icone.png`)} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
      <div
        style={{
          position: 'absolute',
          left: hexa.x,
          top: hexa.y,
          transform: `scale(${pi}) rotate(${(1 - pi) * -25}deg)`,
          transformOrigin: '50% 60%',
        }}
      >
        <Hexa largeur={hexa.w} icone={carte.icone} couleurIcone={carte.sombre ? COULEURS.petrole : COULEURS.vert} />
      </div>
    </div>
  );
};
