import { AbsoluteFill } from 'remotion';
import { COULEURS, TEXTES } from '../config';
import { Faisceaux, Finition, Halo, Particules } from '../composants/Atmosphere';
import { Brillance, MonteeMasquee, MotsQuiMontent, TexteAuRouleau } from '../composants/Texte';
import { FLUIDE, LENT, mix, prog, useTemps, versLaFin } from '../outils/temps';
import { Son } from '../son/Son';

/* Scène 2 — « Petits travaux. » monte derrière un masque, puis « Grand soin. » ;
   un coup de rouleau menthe se peint de gauche à droite sous les mots,
   avec quelques particules de peinture. */
const FAISCEAUX = [
  { x: 58, angle: 12, largeur: 520, opacite: 0.08 },
  { x: 20, angle: -10, largeur: 300, opacite: 0.05 },
];

export const S2Signature: React.FC = () => {
  const { t, largeur, hauteur, vertical, reste, duree } = useTemps();
  const [ligne1, ligne2] = TEXTES.signature;

  const taille = vertical ? largeur * 0.142 : hauteur * 0.2;
  const entree = prog(t, 0, 0.6);
  const peinture = prog(t, 1.75, 1.15, FLUIDE);
  const reflet = prog(t, 3.2, 1.4, FLUIDE);
  const avance = mix(1, 1.045, prog(t, 0, 6, LENT));
  const sortie = versLaFin(reste, 0.7);

  return (
    <AbsoluteFill style={{ background: COULEURS.noir, overflow: 'hidden' }}>
      <AbsoluteFill style={{ opacity: entree }}>
        <AbsoluteFill style={{ background: `radial-gradient(ellipse 80% 70% at 50% 60%, ${COULEURS.petroleProfond} 0%, ${COULEURS.noir} 75%)` }} />
        <Halo x={62} y={62} taille={largeur * 0.8} couleur="2,120,18" opacite={0.22} graine="s2a" />
        <Halo x={30} y={30} taille={largeur * 0.5} couleur="204,248,246" opacite={0.06} graine="s2b" />
        <Faisceaux faisceaux={FAISCEAUX} />
        <Particules nombre={110} faisceaux={FAISCEAUX} graine="s2p" opacite={0.9} />
      </AbsoluteFill>

      <AbsoluteFill
        style={{
          justifyContent: 'center',
          alignItems: 'center',
          transform: `scale(${avance * (1 + sortie * 0.35)})`,
          opacity: 1 - sortie,
          filter: sortie > 0 ? `blur(${sortie * 14}px)` : undefined,
        }}
      >
        <Brillance p={reflet} opacite={0.55}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: taille * 0.1 }}>
            <MotsQuiMontent texte={ligne1} debut={0.35} taille={taille} ecart={0.12} />
            <MonteeMasquee debut={1.0} style={{ fontSize: taille }}>
              <TexteAuRouleau texte={ligne2} p={peinture} pGouttes={(t - 1.75) / 1.15} taille={taille} gouttes={reflet === 0} />
            </MonteeMasquee>
          </div>
        </Brillance>
      </AbsoluteFill>

      <Finition />
      <Son effet="souffle" a={0.3} volume={0.45} />
      <Son effet="souffle-court" a={1.0} volume={0.4} />
      <Son effet="rouleau" a={1.7} volume={0.7} />
      <Son effet="souffle-montant" a={duree - 0.9} volume={0.35} />
    </AbsoluteFill>
  );
};
