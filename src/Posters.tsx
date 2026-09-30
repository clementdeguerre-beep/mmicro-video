import { ThreeCanvas } from '@remotion/three';
import { useMemo } from 'react';
import { AbsoluteFill, staticFile } from 'remotion';
import * as THREE from 'three';
import { COULEURS, CONTACT, TEXTES } from './config';
import { Faisceaux, Finition, Halo, Particules } from './composants/Atmosphere';
import { dessinerEcranFormulaire, imagesFormulaire, ImagesChargees, TEL, urlsFormulaire } from './composants/EcranFormulaire';
import { dessinerEcranSite, ECRAN } from './composants/EcranSite';
import { FondStudioClair } from './composants/Fonds';
import { Logo } from './composants/Logo';
import { Notification } from './composants/Notification';
import { TexteAuRouleau } from './composants/Texte';
import './outils/polices';
import { TEXTE, TITRE } from './outils/polices';
import { Camera, orbite, Studio, useImages, useToile } from './trois/outils3d';
import { Ordinateur3D } from './trois/Ordinateur3D';
import { TEL3D, Telephone3D } from './trois/Telephone3D';

/* Images d'aperçu (posters) des deux versions du film */

const Signature: React.FC<{ taille: number; alignement: 'flex-start' | 'center'; clair?: boolean }> = ({ taille, alignement, clair = false }) => {
  const [s1, s2] = TEXTES.signature;
  const couleur = clair ? COULEURS.petrole : COULEURS.blanc;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: alignement, gap: taille * 0.08 }}>
      <div style={{ fontFamily: TITRE, fontWeight: 700, fontSize: taille, letterSpacing: '-0.048em', lineHeight: 0.96, color: couleur }}>{s1}</div>
      <TexteAuRouleau texte={s2} p={1} taille={taille} gouttes={false} couleurTexte={couleur} />
    </div>
  );
};

export const Poster16x9: React.FC = () => {
  const images = useImages([staticFile('captures/ordinateur/defilement.png')]);
  const { texture, ctx } = useToile(ECRAN.largeur * ECRAN.echelle, ECRAN.hauteur * ECRAN.echelle);
  if (images) {
    dessinerEcranSite(ctx, images[0], 0);
    texture.needsUpdate = true;
  }
  const faisceaux = [{ x: 70, angle: 14, largeur: 460, opacite: 0.08 }];
  const cible = new THREE.Vector3(-1.7, 0.85, -0.4);
  return (
    <AbsoluteFill style={{ background: COULEURS.noir }}>
      <Halo x={72} y={60} taille={1500} couleur="2,120,18" opacite={0.3} derive={0} />
      <Halo x={20} y={45} taille={900} couleur="204,248,246" opacite={0.05} derive={0} />
      <Faisceaux faisceaux={faisceaux} />
      <Particules nombre={90} faisceaux={faisceaux} graine="poster" />
      {images ? (
        <AbsoluteFill>
          <ThreeCanvas width={1920} height={1080} camera={{ fov: 30, near: 0.05, far: 100, position: [0, 1, 8] }} gl={{ antialias: true, alpha: true }}>
            <Studio intensite={1} />
            <ambientLight intensity={0.08} />
            <directionalLight position={[-4, 6, 5]} intensity={1.6} />
            <directionalLight position={[5, 2, -4]} intensity={2.2} color={COULEURS.menthe} />
            <directionalLight position={[-6, 1, -3]} intensity={1.4} color="#27b545" />
            <Camera position={orbite(cible, -22, 11, 7.4)} cible={cible} champ={30} />
            <Ordinateur3D texture={texture} allumage={1} reflet={0.62} />
          </ThreeCanvas>
        </AbsoluteFill>
      ) : null}
      <div style={{ position: 'absolute', left: 120, top: 230, display: 'flex', flexDirection: 'column', gap: 54 }}>
        <Logo largeur={250} etat={{}} style={{ filter: 'drop-shadow(0 0 50px rgba(2,120,18,0.35))' }} />
        <Signature taille={112} alignement="flex-start" />
        <div style={{ fontFamily: TEXTE, fontSize: 32, fontWeight: 500, color: COULEURS.texteSecondaireSombre }}>
          <span style={{ fontFamily: TITRE, fontWeight: 700, color: COULEURS.menthe }}>{CONTACT.telephone}</span>
          {'  ·  '}
          {CONTACT.zone}
        </div>
      </div>
      <Finition />
    </AbsoluteFill>
  );
};

export const Poster9x16: React.FC = () => {
  const noms = useMemo(() => imagesFormulaire(), []);
  const images = useImages(useMemo(() => urlsFormulaire(), []));
  const { texture, ctx } = useToile(TEL.largeur * TEL.echelle, TEL.hauteur * TEL.echelle);
  if (images) {
    const carte: ImagesChargees = {};
    noms.forEach((n, i) => (carte[n] = images[i]));
    dessinerEcranFormulaire(ctx, carte, 5.2);
    texture.needsUpdate = true;
  }
  const fraction = 0.5;
  const distance = TEL3D.hauteur / fraction / (2 * Math.tan(THREE.MathUtils.degToRad(15)));
  return (
    <AbsoluteFill style={{ background: COULEURS.mentheLavis }}>
      <FondStudioClair x={50} y={45} motif={0.45} />
      <Halo x={50} y={64} taille={1400} couleur="204,248,246" opacite={0.9} derive={0} />
      {images ? (
        <AbsoluteFill>
          <ThreeCanvas width={1080} height={1920} camera={{ fov: 30, near: 0.05, far: 100, position: [0, 0, distance] }} gl={{ antialias: true, alpha: true }}>
            <Studio intensite={1.1} clair />
            <ambientLight intensity={0.35} />
            <directionalLight position={[-3, 4, 5]} intensity={1.4} />
            <directionalLight position={[4, 1, -3]} intensity={1.6} color={COULEURS.menthe} />
            <Camera position={new THREE.Vector3(0, 0.62, distance)} cible={new THREE.Vector3(0, 0.62, 0)} champ={30} />
            <group rotation={[0.08, -0.28, 0.02]}>
              <Telephone3D texture={texture} reflet={0.35} />
            </group>
          </ThreeCanvas>
        </AbsoluteFill>
      ) : null}
      <div style={{ position: 'absolute', left: 0, right: 0, top: 130, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 44 }}>
        <Logo largeur={230} etat={{}} style={{ filter: 'drop-shadow(0 0 50px rgba(2,120,18,0.35))' }} />
        <Signature taille={112} alignement="center" clair />
      </div>
      <div style={{ position: 'absolute', left: 90, top: 940 }}>
        <Notification largeur={900} />
      </div>
      <Finition vignette={0.2} grain={0.04} couleurVignette="13,57,52" />
    </AbsoluteFill>
  );
};
