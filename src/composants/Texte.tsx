import React, { createContext, useContext } from 'react';

/* Dans la copie « brillance », seules les lettres sont dessinées */
const ModeBrillance = createContext(false);
import { random } from 'remotion';
import { COULEURS } from '../config';
import { TITRE } from '../outils/polices';
import { DOUX, FLUIDE, mix, prog, ressort, useTemps } from '../outils/temps';

/* ---------- Mots qui montent derrière un masque ----------
   Chaque mot sort de derrière une ligne invisible, avec un ressort amorti
   et un léger flou de mouvement pendant la montée. */
/* ---------- Brillance qui balaie un texte ----------
   Copie du texte remplie d'un dégradé : seule la forme des lettres s'éclaire. */
export const Brillance: React.FC<{ p: number; children: React.ReactNode; angle?: number; opacite?: number }> = ({
  p,
  children,
  angle = 105,
  opacite = 0.7,
}) => {
  const pos = -30 + p * 160;
  const actif = p > 0 && p < 1;
  return (
    <div style={{ position: 'relative' }}>
      {children}
      {actif ? (
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            WebkitTextFillColor: 'transparent',
            backgroundImage: `linear-gradient(${angle}deg, rgba(255,255,255,0) ${pos - 12}%, rgba(255,255,255,${opacite}) ${pos}%, rgba(255,255,255,0) ${pos + 12}%)`,
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            pointerEvents: 'none',
          }}
        >
          <ModeBrillance.Provider value>{children}</ModeBrillance.Provider>
        </div>
      ) : null}
    </div>
  );
};

export const MotsQuiMontent: React.FC<{
  texte: string;
  debut: number; // secondes
  ecart?: number; // décalage entre deux mots (s)
  taille: number; // px
  couleur?: string;
  graisse?: number;
  interlettrage?: string;
  style?: React.CSSProperties;
  sortie?: number; // instant où les mots redescendent (s), facultatif
}> = ({ texte, debut, ecart = 0.08, taille, couleur = COULEURS.blanc, graisse = 700, interlettrage = '-0.045em', style, sortie }) => {
  const { t, fps } = useTemps();
  const mots = texte.split(' ');
  return (
    <div
      style={{
        fontFamily: TITRE,
        fontSize: taille,
        fontWeight: graisse,
        letterSpacing: interlettrage,
        lineHeight: 1,
        color: couleur,
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      {mots.map((mot, i) => {
        const d = debut + i * ecart;
        const p = ressort(t, fps, d, { damping: 20, stiffness: 110, mass: 0.9 });
        const pAvant = ressort(t - 1 / fps, fps, d, { damping: 20, stiffness: 110, mass: 0.9 });
        const vitesse = Math.abs(p - pAvant) * fps; // hauteurs de ligne par seconde
        const s = sortie !== undefined ? prog(t, sortie + i * ecart * 0.6, 0.45, FLUIDE) : 0;
        const y = (1 - p) * 112 - s * 112;
        return (
          <React.Fragment key={i}>
            <span style={{ display: 'inline-block', overflow: 'hidden', padding: '0.06em 0.04em 0.16em', margin: '-0.06em -0.04em -0.16em', verticalAlign: 'top' }}>
              <span
                style={{
                  display: 'inline-block',
                  transform: `translateY(${y}%) rotate(${(1 - p) * 4}deg)`,
                  transformOrigin: '0% 100%',
                  filter: vitesse > 0.4 ? `blur(${Math.min(6, vitesse * 0.9)}px)` : undefined,
                }}
              >
                {mot}
              </span>
            </span>
            {i < mots.length - 1 ? ' ' : null}
          </React.Fragment>
        );
      })}
    </div>
  );
};

/* ---------- Lettres qui se resserrent ----------
   L'interlettrage passe d'un espacement large à l'espacement final. */
export const LettresSerrees: React.FC<{
  texte: string;
  debut: number;
  duree?: number;
  taille: number;
  couleur?: string;
  graisse?: number;
  depart?: number; // interlettrage de départ (em)
  arrivee?: number; // interlettrage final (em)
  famille?: string;
  style?: React.CSSProperties;
}> = ({ texte, debut, duree = 1.4, taille, couleur = COULEURS.blanc, graisse = 600, depart = 0.6, arrivee = 0.02, famille = TITRE, style }) => {
  const { t } = useTemps();
  const p = prog(t, debut, duree, DOUX);
  return (
    <div
      style={{
        fontFamily: famille,
        fontSize: taille,
        fontWeight: graisse,
        letterSpacing: `${mix(depart, arrivee, p)}em`,
        color: couleur,
        opacity: prog(t, debut, duree * 0.5),
        filter: p < 0.98 ? `blur(${(1 - p) * 8}px)` : undefined,
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      {texte}
    </div>
  );
};

/* ---------- Coup de rouleau (motif du site) ----------
   Forme du trait reprise de la feuille de style du site (--trait-pinceau). */
export const FORME_TRAIT =
  'M6 18C70 8 150 15 240 9s180 2 254-1c3 14-2 28 4 42-4 10 1 18-6 24-92-4-172 3-262-2S70 76 8 71C3 58 9 46 4 34c-2-6 1-12 2-16z';
const MASQUE_TRAIT = `url("data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 500 80' preserveAspectRatio='none'><path d='${FORME_TRAIT}'/></svg>`,
)}")`;

/** Texte avec coup de rouleau menthe peint dessous.
 *  Sur fond sombre, les lettres prennent la couleur pétrole là où la peinture passe. */
export const TexteAuRouleau: React.FC<{
  texte: string;
  p: number; // avancement de la peinture, 0 → 1
  taille: number;
  couleurTexte?: string;
  couleurSurPeinture?: string;
  couleurPeinture?: string;
  graisse?: number;
  gouttes?: boolean;
  pGouttes?: number; // avancement non borné, pour que les gouttes finissent leur course
}> = ({
  texte,
  p,
  taille,
  couleurTexte = COULEURS.blanc,
  couleurSurPeinture = COULEURS.petrole,
  couleurPeinture = COULEURS.menthe,
  graisse = 700,
  gouttes = true,
  pGouttes,
}) => {
  const brillance = useContext(ModeBrillance);
  const styleTexte: React.CSSProperties = {
    fontFamily: TITRE,
    fontWeight: graisse,
    letterSpacing: '-0.048em',
    lineHeight: 0.96,
    whiteSpace: 'nowrap',
  };
  const masque: React.CSSProperties = {
    maskImage: MASQUE_TRAIT,
    WebkitMaskImage: MASQUE_TRAIT,
    maskSize: '100% 100%',
    WebkitMaskSize: '100% 100%',
    maskRepeat: 'no-repeat',
    WebkitMaskRepeat: 'no-repeat',
  };
  // Boîte du trait, en em, identique au site : left -0.1em, right -0.14em, top 0.2em, bottom -0.02em
  const coupe = `inset(-5% ${(1 - p) * 100}% -5% 0)`;
  if (brillance) {
    return <div style={{ display: 'inline-block', fontSize: taille, ...styleTexte }}>{texte}</div>;
  }
  return (
    <div style={{ position: 'relative', display: 'inline-block', fontSize: taille, ...styleTexte, color: couleurTexte }}>
      <span>{texte}</span>
      <div style={{ position: 'absolute', left: '-0.1em', right: '-0.14em', top: '0.2em', bottom: '-0.02em', clipPath: coupe }}>
        <div style={{ position: 'absolute', inset: 0, ...masque }}>
          <div style={{ position: 'absolute', inset: 0, background: couleurPeinture }} />
          {/* Stries du rouleau, très discrètes */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'repeating-linear-gradient(180deg, rgba(255,255,255,0.10) 0 3px, rgba(13,57,52,0.035) 3px 7px, rgba(255,255,255,0) 7px 13px)',
            }}
          />
          <span style={{ position: 'absolute', left: '0.1em', top: '-0.2em', color: couleurSurPeinture }}>{texte}</span>
        </div>
      </div>
      {/* Bord frais de la peinture : légère surbrillance qui suit le rouleau */}
      {p > 0 && p < 1 ? (
        <div style={{ position: 'absolute', left: '-0.1em', right: '-0.14em', top: '0.2em', bottom: '-0.02em', clipPath: coupe }}>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              ...masque,
              background: `linear-gradient(90deg, rgba(255,255,255,0) ${p * 100 - 7}%, rgba(255,255,255,0.28) ${p * 100 - 0.5}%, rgba(255,255,255,0) ${p * 100}%)`,
            }}
          />
        </div>
      ) : null}
      {gouttes ? <GouttesDePeinture p={pGouttes ?? p} couleur={couleurPeinture} /> : null}
    </div>
  );
};

/* Quelques particules de peinture projetées par le rouleau */
const GouttesDePeinture: React.FC<{ p: number; couleur: string }> = ({ p, couleur }) => {
  const N = 26;
  return (
    <div style={{ position: 'absolute', left: '-0.1em', right: '-0.14em', top: '0.2em', bottom: '-0.02em', pointerEvents: 'none' }}>
      {new Array(N).fill(0).map((_, i) => {
        const naissance = 0.05 + (i / N) * 0.9; // moment où la goutte quitte le rouleau
        const age = (p - naissance) * 2.2; // durée de vie en « avancements »
        if (age <= 0 || age > 1) return null;
        const r = (k: string) => random(`goutte-${k}-${i}`);
        const enHaut = r('h') < 0.55;
        const y0 = enHaut ? 0.02 : 0.98; // les gouttes partent des bords du trait
        const vx = 0.6 + r('vx') * 1.6; // vers l'avant
        const vy = enHaut ? -0.9 - r('vy') * 1.3 : 0.5 + r('vy') * 0.9;
        const x = naissance * 100 + vx * age * 9;
        const y = y0 * 100 + (vy * age + 2.6 * age * age) * 30;
        const taille = 0.016 + r('t') * 0.03;
        const angle = (Math.atan2(vy + 5.2 * age, vx) * 180) / Math.PI;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${x}%`,
              top: `${y}%`,
              width: `${taille * 1.9}em`,
              height: `${taille}em`,
              borderRadius: '50%',
              background: couleur,
              opacity: 1 - age * age,
              transform: `translate(-50%, -50%) rotate(${angle}deg)`,
              boxShadow: `0 0 0.06em rgba(204,248,246,0.6)`,
            }}
          />
        );
      })}
    </div>
  );
};

/* ---------- Bloc qui monte derrière un masque ---------- */
export const MonteeMasquee: React.FC<{ debut: number; children: React.ReactNode; style?: React.CSSProperties }> = ({
  debut,
  children,
  style,
}) => {
  const { t, fps } = useTemps();
  const p = ressort(t, fps, debut, { damping: 20, stiffness: 110, mass: 0.9 });
  const pAvant = ressort(t - 1 / fps, fps, debut, { damping: 20, stiffness: 110, mass: 0.9 });
  const vitesse = Math.abs(p - pAvant) * fps;
  return (
    <div style={{ overflow: 'hidden', padding: '0.08em 0.3em 0.22em', margin: '-0.08em -0.3em -0.22em', ...style }}>
      <div
        style={{
          transform: `translateY(${(1 - p) * 115}%) rotate(${(1 - p) * 3}deg)`,
          transformOrigin: '0% 100%',
          filter: vitesse > 0.4 ? `blur(${Math.min(6, vitesse * 0.9)}px)` : undefined,
        }}
      >
        {children}
      </div>
    </div>
  );
};
