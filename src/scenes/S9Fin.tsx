import { AbsoluteFill } from 'remotion';
import { COULEURS, CONTACT, TEXTES } from '../config';
import { Finition, Halo, Particules } from '../composants/Atmosphere';
import { Logo, LOGO_RATIO } from '../composants/Logo';
import { MonteeMasquee, MotsQuiMontent, TexteAuRouleau } from '../composants/Texte';
import { TEXTE, TITRE } from '../outils/polices';
import { FLUIDE, LENT, mix, prog, ressort, useTemps, versLaFin } from '../outils/temps';
import { Son } from '../son/Son';

/* Scène 9 — Fond noir. Logo, « Petits travaux. Grand soin. »,
   « 06 46 48 55 64 », « mmicromultiservices.com », « Montpellier et alentours ».
   Fondu au noir. */
export const S9Fin: React.FC = () => {
  const { t, fps, largeur, vertical, reste } = useTemps();
  const [s1, s2] = TEXTES.fin.signature;

  const logo = ressort(t, fps, 0.05, { damping: 22, stiffness: 70 });
  const reflet = prog(t, 0.6, 1.2, FLUIDE);
  const peinture = prog(t, 0.95, 0.7, FLUIDE);
  const camera = mix(1.0, 1.03, prog(t, 0, 4, LENT));
  const fondu = versLaFin(reste, 0.65, FLUIDE); // fondu au noir final

  const largeurLogo = vertical ? 400 : 390;
  const tailleSignature = vertical ? 118 : 104;

  const ligneContact = (texte: string, debut: number, style: React.CSSProperties) => (
    <div
      style={{
        opacity: prog(t, debut, 0.5),
        transform: `translateY(${(1 - prog(t, debut, 0.7)) * 22}px)`,
        filter: t < debut + 0.5 ? `blur(${(1 - prog(t, debut, 0.5)) * 6}px)` : undefined,
        ...style,
      }}
    >
      {texte}
    </div>
  );

  const textes = (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: vertical ? 'center' : 'flex-start', gap: vertical ? 10 : 6 }}>
      <MotsQuiMontent texte={s1} debut={0.35} taille={tailleSignature} ecart={0.1} />
      <MonteeMasquee debut={0.6} style={{ fontSize: tailleSignature }}>
        <TexteAuRouleau texte={s2} p={peinture} pGouttes={(t - 0.95) / 0.7} taille={tailleSignature} />
      </MonteeMasquee>
      <div style={{ height: vertical ? 70 : 46 }} />
      {ligneContact(CONTACT.telephone, 1.05, { fontFamily: TITRE, fontWeight: 700, fontSize: vertical ? 88 : 76, letterSpacing: '-0.02em', color: COULEURS.menthe, fontVariantNumeric: 'tabular-nums', lineHeight: 1.05 })}
      {ligneContact(CONTACT.site, 1.2, { fontFamily: TEXTE, fontWeight: 500, fontSize: vertical ? 44 : 38, color: COULEURS.blanc, marginTop: 10 })}
      {ligneContact(CONTACT.zone, 1.35, { fontFamily: TEXTE, fontWeight: 500, fontSize: vertical ? 38 : 32, color: COULEURS.texteSecondaireSombre, marginTop: 4 })}
    </div>
  );

  return (
    <AbsoluteFill style={{ background: COULEURS.noir, overflow: 'hidden' }}>
      <Halo x={vertical ? 50 : 30} y={vertical ? 24 : 50} taille={largeurLogo * 2.6} couleur="2,120,18" opacite={0.3} graine="s9a" />
      <Halo x={vertical ? 50 : 62} y={vertical ? 68 : 55} taille={largeur * 0.7} couleur="204,248,246" opacite={0.05} graine="s9b" />
      <Particules nombre={70} graine="s9p" opacite={0.6} />

      <AbsoluteFill
        style={{
          transform: `scale(${camera})`,
          flexDirection: vertical ? 'column' : 'row',
          justifyContent: 'center',
          alignItems: 'center',
          gap: vertical ? 90 : 110,
        }}
      >
        <div style={{ opacity: Math.min(1, logo * 1.5), transform: `scale(${mix(0.86, 1, logo)})`, filter: `drop-shadow(0 0 60px rgba(2,120,18,0.35))` }}>
          <Logo largeur={largeurLogo} etat={{ reflet }} />
        </div>
        {textes}
      </AbsoluteFill>

      {/* Fondu au noir */}
      <AbsoluteFill style={{ background: '#000', opacity: fondu }} />
      <Finition />
      <Son effet="impact-grave" a={0.05} volume={0.8} />
      <Son effet="scintillement" a={0.6} volume={0.35} />
      <Son effet="rouleau" a={0.9} volume={0.45} />
      <Son effet="souffle-court" a={1.05} volume={0.25} />
    </AbsoluteFill>
  );
};

export const HAUTEUR_LOGO_FIN = 390 * LOGO_RATIO;
