import { ThreeCanvas } from '@remotion/three';
import { useLayoutEffect, useRef } from 'react';
import { AbsoluteFill, staticFile } from 'remotion';
import * as THREE from 'three';
import { COULEURS } from '../config';
import { Faisceaux, Finition, Halo, Particules } from '../composants/Atmosphere';
import { DEFILEMENT_SERVICES, dessinerEcranSite, ECRAN } from '../composants/EcranSite';
import { FLUIDE, LENT, mix, prog, useTemps } from '../outils/temps';
import { Son } from '../son/Son';
import { Camera, orbite, Studio, useImages, useToile } from '../trois/outils3d';
import { DIM, Ordinateur3D, repereEcran } from '../trois/Ordinateur3D';

/* Scène 3 — Un ordinateur portable flotte dans l'obscurité et pivote
   lentement ; l'écran s'allume sur la page d'accueil ; la caméra plonge
   dans l'écran jusqu'à ce que le site remplisse l'image. */
const CHAMP = 30; // angle de champ vertical de la caméra (degrés)
const FAISCEAUX = [
  { x: 24, angle: -16, largeur: 420, opacite: 0.07 },
  { x: 80, angle: 18, largeur: 300, opacite: 0.05 },
];

// Moments clés (secondes)
const ALLUMAGE = 1.15;
const PLONGEE = 4.1;
const ARRIVEE = 6.35; // l'écran remplit l'image
const DEFILEMENT = 6.55;

export const S3Ordinateur: React.FC = () => {
  const { t, largeur, hauteur } = useTemps();
  const images = useImages([staticFile('captures/ordinateur/defilement.png')]);
  const { texture, ctx } = useToile(ECRAN.largeur * ECRAN.echelle, ECRAN.hauteur * ECRAN.echelle);

  const allumage = prog(t, ALLUMAGE, 0.9, FLUIDE);
  const mise_au_point = 1 - prog(t, 0.15, 1.4, FLUIDE);
  const entree = prog(t, 0, 0.6);

  // Écran : la page d'accueil (le défilement ne commence qu'en plein écran)
  if (images) {
    dessinerEcranSite(ctx, images[0], 0);
    texture.needsUpdate = true;
  }

  // ---- Caméra ----
  const ecran = repereEcran();
  const flottement = Math.sin(t * 1.1) * 0.03;
  const pA = prog(t, 0, PLONGEE + 0.6, LENT);
  const cibleA = new THREE.Vector3(0, mix(0.55, 0.75, pA) + flottement, mix(-0.3, -0.55, pA));
  const posA = orbite(cibleA, mix(-40, -14, pA), mix(16, 9, pA), mix(7.6, 6.6, pA));
  const dFinale = DIM.ecranL / (2 * Math.tan(THREE.MathUtils.degToRad(CHAMP / 2)) * (largeur / hauteur));
  const posFinale = ecran.centre.clone().add(ecran.normale.clone().multiplyScalar(dFinale));
  const pB = prog(t, PLONGEE, ARRIVEE - PLONGEE, (x) => FLUIDE(x) ** 1.15);
  const position = posA.clone().lerp(posFinale, pB);
  const cible = cibleA.clone().lerp(ecran.centre, Math.min(1, pB * 1.4));
  const haut = new THREE.Vector3(0, 1, 0).lerp(ecran.haut, pB).normalize();
  const plein = t >= ARRIVEE; // passage à la version plein écran (identique)

  // Lueur de l'écran projetée à l'image
  const cam = new THREE.PerspectiveCamera(CHAMP, largeur / hauteur, 0.05, 100);
  cam.position.copy(position);
  cam.up.copy(haut);
  cam.lookAt(cible);
  cam.updateMatrixWorld();
  const p2d = ecran.centre.clone().project(cam);
  const lueurX = ((p2d.x + 1) / 2) * 100;
  const lueurY = ((1 - p2d.y) / 2) * 100;

  const flouPlongee = pB > 0.55 && pB < 0.995 ? Math.sin(((pB - 0.55) / 0.45) * Math.PI) * 2.2 : 0;

  return (
    <AbsoluteFill style={{ background: COULEURS.noir, overflow: 'hidden' }}>
      <AbsoluteFill style={{ opacity: entree * (1 - pB) }}>
        <Halo x={22} y={78} taille={largeur * 0.7} couleur="2,120,18" opacite={0.2} graine="s3a" />
        <Halo x={78} y={20} taille={largeur * 0.55} couleur="204,248,246" opacite={0.07} graine="s3b" />
        <Faisceaux faisceaux={FAISCEAUX} />
        <Particules nombre={110} faisceaux={FAISCEAUX} graine="s3p" />
        <Halo x={lueurX} y={lueurY + 8} taille={largeur * 0.5} couleur="204,248,246" opacite={0.13 * allumage} derive={0} graine="s3l" />
      </AbsoluteFill>

      {!images ? null : !plein ? (
        <AbsoluteFill style={{ opacity: entree, filter: `blur(${mise_au_point * 14 + flouPlongee}px)` }}>
          <ThreeCanvas
            width={largeur}
            height={hauteur}
            camera={{ fov: CHAMP, near: 0.05, far: 100, position: [0, 1, 8] }}
            gl={{ antialias: true, alpha: true }}
          >
            <Studio intensite={1} />
            <ambientLight intensity={0.08} />
            <directionalLight position={[-4, 6, 5]} intensity={1.6} color="#ffffff" />
            <directionalLight position={[5, 2, -4]} intensity={2.2} color={COULEURS.menthe} />
            <directionalLight position={[-6, 1, -3]} intensity={1.4} color="#27b545" />
            <Camera position={position} cible={cible} haut={haut} champ={CHAMP} />
            <group position={[0, flottement, 0]} rotation={[0, Math.sin(t * 0.35) * 0.02, 0]}>
              <Ordinateur3D texture={texture} allumage={allumage} verre={1 - pB} reflet={prog(t, 2.2, 1.6, FLUIDE)} />
            </group>
          </ThreeCanvas>
        </AbsoluteFill>
      ) : (
        <SitePleinEcran site={images?.[0] ?? null} defilement={DEFILEMENT_SERVICES * prog(t, DEFILEMENT, 1.35, FLUIDE)} />
      )}

      <AbsoluteFill style={{ opacity: 1 - pB }}>
        <Finition />
      </AbsoluteFill>
      <AbsoluteFill style={{ opacity: pB }}>
        <Finition vignette={0.18} grain={0.035} />
      </AbsoluteFill>

      <Son effet="souffle" a={0.1} volume={0.4} />
      <Son effet="tic" a={ALLUMAGE} volume={0.5} />
      <Son effet="souffle-montant" a={PLONGEE + 0.3} volume={0.8} />
      <Son effet="souffle-court" a={DEFILEMENT} volume={0.35} />
    </AbsoluteFill>
  );
};

/** Le site en plein cadre, cadré exactement comme l'écran à la fin de la plongée */
export const SitePleinEcran: React.FC<{ site: HTMLImageElement | null; defilement: number; style?: React.CSSProperties }> = ({
  site,
  defilement,
  style,
}) => {
  const { largeur, hauteur } = useTemps();
  const ref = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    const c = ref.current;
    if (!c || !site) return;
    const ctx = c.getContext('2d')!;
    ctx.imageSmoothingQuality = 'high';
    dessinerEcranSite(ctx, site, defilement);
  }, [site, defilement]);
  const l = largeur;
  const h = (largeur * ECRAN.hauteur) / ECRAN.largeur;
  return (
    <canvas
      ref={ref}
      width={ECRAN.largeur * ECRAN.echelle}
      height={ECRAN.hauteur * ECRAN.echelle}
      style={{ position: 'absolute', left: 0, top: (hauteur - h) / 2, width: l, height: h, ...style }}
    />
  );
};
