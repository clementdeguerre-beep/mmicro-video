import { AbsoluteFill } from 'remotion';
import { COULEURS, TEXTES } from '../config';
import { Faisceaux, Finition, Halo, Particules } from '../composants/Atmosphere';
import { FondPetrole } from '../composants/Fonds';
import { MotsQuiMontent } from '../composants/Texte';
import { TEXTE, TITRE } from '../outils/polices';
import { DOUX, FLUIDE, LENT, mix, prog, useTemps, versLaFin } from '../outils/temps';
import { Son } from '../son/Son';

/* Scène 6 — Fond pétrole. Un compteur géant défile jusqu'à « 24 h » ;
   sous-titre : « pour vous rappeler ». */
const FAISCEAUX = [
  { x: 35, angle: -12, largeur: 480, opacite: 0.06 },
  { x: 70, angle: 10, largeur: 360, opacite: 0.05 },
];

export const S6Rappel: React.FC = () => {
  const { t: tReel, largeur, hauteur, vertical, reste, duree } = useTemps();
  // Scène plus courte (version verticale) : la chronologie s'accélère
  const k = Math.min(1, duree / 6);
  const t = tReel / k;
  const { valeur, unite, sousTitre, precision } = TEXTES.rappel;

  const taille = vertical ? 470 : 500;
  const hChiffre = taille * 0.92;
  // Le compteur accélère puis ralentit longuement avant de se poser sur la valeur
  const v = valeur * prog(t, 0.25, 2.0, (x) => 1 - Math.pow(1 - x, 3.2));
  const vAvant = valeur * prog(t - 1 / (60 * k), 0.25, 2.0, (x) => 1 - Math.pow(1 - x, 3.2));
  const vitesse = Math.abs(v - vAvant) * 60; // unités par seconde
  const nbChiffres = String(valeur).length;
  const chiffres = new Array(nbChiffres).fill(0).map((_, k) => {
    const puissance = Math.pow(10, nbChiffres - 1 - k);
    // Rouleau de compteur : un chiffre ne tourne que lorsque le précédent passe de 9 à 0
    const brut = v / puissance;
    const entier = Math.floor(brut);
    const reste10 = (v % puissance) / puissance;
    const glisse = puissance === 1 ? brut : entier + Math.max(0, (reste10 - (1 - 1 / puissance)) * puissance);
    return glisse;
  });
  const echelleCompteur = mix(1.12, 1, prog(t, 0.25, 2.4, DOUX));
  const camera = mix(1, 1.035, prog(t, 0, 6, LENT));
  const sortie = versLaFin(reste, 0.6);

  return (
    <AbsoluteFill style={{ background: COULEURS.petrole, overflow: 'hidden' }}>
      <FondPetrole x={50} y={vertical ? 42 : 45} />
      <Halo x={50} y={vertical ? 42 : 44} taille={largeur * (vertical ? 1.3 : 0.75)} couleur="204,248,246" opacite={0.16} graine="s6a" />
      <Halo x={20} y={85} taille={largeur * 0.6} couleur="2,120,18" opacite={0.28} graine="s6b" />
      <Faisceaux faisceaux={FAISCEAUX} />
      <Particules nombre={90} faisceaux={FAISCEAUX} graine="s6p" />

      <AbsoluteFill
        style={{
          justifyContent: 'center',
          alignItems: 'center',
          transform: `scale(${camera * (1 + sortie * 0.25)})`,
          opacity: 1 - sortie,
          filter: sortie > 0 ? `blur(${sortie * 12}px)` : undefined,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: vertical ? -140 : -60 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', transform: `scale(${echelleCompteur})` }}>
            {/* Chiffres qui défilent */}
            <div style={{ display: 'flex', fontFamily: TITRE, fontWeight: 700, fontSize: taille, lineHeight: 1, letterSpacing: '-0.06em', color: COULEURS.menthe, fontVariantNumeric: 'tabular-nums' }}>
              {chiffres.map((c, k) => (
                <div
                  key={k}
                  style={{
                    position: 'relative',
                    height: hChiffre,
                    width: '0.56em',
                    overflow: 'hidden',
                    maskImage: 'linear-gradient(180deg, transparent 0%, #000 16%, #000 84%, transparent 100%)',
                    WebkitMaskImage: 'linear-gradient(180deg, transparent 0%, #000 16%, #000 84%, transparent 100%)',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      transform: `translateY(${-(c % 10) * hChiffre}px)`,
                      filter: vitesse > 1.5 && k === nbChiffres - 1 ? `blur(${Math.min(10, vitesse * 0.35)}px)` : undefined,
                    }}
                  >
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((d, j) => (
                      <div key={j} style={{ height: hChiffre, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '0.56em' }}>
                        {d}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            {/* Unité : glisse et se pose, sans décaler le compteur */}
            <div
              style={{
                marginLeft: taille * 0.1,
                fontFamily: TITRE,
                fontWeight: 700,
                fontSize: taille * 0.62,
                lineHeight: 1,
                color: COULEURS.menthe,
                opacity: prog(t, 2.0, 0.5),
                transform: `translateX(${(1 - prog(t, 2.0, 0.9, DOUX)) * taille * 0.35}px)`,
                filter: t < 2.7 ? `blur(${(1 - prog(t, 2.0, 0.7)) * 10}px)` : undefined,
              }}
            >
              {unite}
            </div>
          </div>
          <div style={{ marginTop: vertical ? 30 : 10 }}>
            <MotsQuiMontent texte={sousTitre} debut={2.3 * k} taille={vertical ? 92 : 84} couleur={COULEURS.blanc} graisse={600} interlettrage="-0.03em" />
          </div>
          <div
            style={{
              marginTop: vertical ? 34 : 26,
              fontFamily: TEXTE,
              fontSize: vertical ? 38 : 32,
              fontWeight: 500,
              color: COULEURS.texteSecondaireSombre,
              opacity: prog(t, 2.45, 0.6),
              transform: `translateY(${(1 - prog(t, 2.45, 0.8)) * 14}px)`,
              textAlign: 'center',
              maxWidth: vertical ? 760 : undefined,
              textWrap: 'balance',
            }}
          >
            {precision}
          </div>
        </div>
      </AbsoluteFill>

      <Finition vignette={0.5} />
      <Son effet="impact-grave" a={0.02} volume={0.55} />
      {new Array(12).fill(0).map((_, i) => (
        <Son key={i} effet="tic" a={(0.3 + (1 - Math.pow(1 - i / 12, 1 / 3.2)) * 2.0) * k} volume={0.22} />
      ))}
      <Son effet="impact-grave" a={2.25 * k} volume={0.45} />
      <Son effet="souffle-court" a={2.3 * k} volume={0.3} />
    </AbsoluteFill>
  );
};
