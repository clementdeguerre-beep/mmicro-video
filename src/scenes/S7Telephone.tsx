import { ThreeCanvas } from '@remotion/three';
import { useMemo } from 'react';
import { AbsoluteFill } from 'remotion';
import { COULEURS, TEXTES } from '../config';
import { Finition, Halo, Particules } from '../composants/Atmosphere';
import { dessinerEcranFormulaire, DUREE_FORMULAIRE, imagesFormulaire, ImagesChargees, TEL, urlsFormulaire } from '../composants/EcranFormulaire';
import { FondStudioClair } from '../composants/Fonds';
import { Notification } from '../composants/Notification';
import { MotsQuiMontent } from '../composants/Texte';
import { FLUIDE, LENT, mix, prog, ressort, useTemps, versLaFin } from '../outils/temps';
import { Son } from '../son/Son';
import { SCRIPT_FORMULAIRE } from '../composants/EcranFormulaire';
import { Camera, Studio, useImages, useToile } from '../trois/outils3d';
import { TEL3D, Telephone3D } from '../trois/Telephone3D';
import * as THREE from 'three';

/* Scène 7 — Un smartphone en 3D ; le formulaire du site se remplit tout
   seul, bouton « Envoyer ma demande », coche animée « Demande envoyée » ;
   une notification d'exemple glisse. */
const CHAMP = 30;

export const S7Telephone: React.FC = () => {
  const { t, fps, largeur, hauteur, vertical, reste } = useTemps();
  const [titre1, titre2] = TEXTES.telephone.titre;
  const noms = useMemo(() => imagesFormulaire(), []);
  const images = useImages(useMemo(() => urlsFormulaire(), []));
  const { texture, ctx } = useToile(TEL.largeur * TEL.echelle, TEL.hauteur * TEL.echelle);

  // Le formulaire se remplit un peu plus vite en vertical (scène plus courte)
  const debutFormulaire = vertical ? 0.7 : 0.95;
  const vitesse = vertical ? 1.3 : 1.1;
  const tSucces = debutFormulaire + DUREE_FORMULAIRE / vitesse;
  const tNotif = tSucces + 0.5;
  const tf = (t - debutFormulaire) * vitesse;

  if (images) {
    const carte: ImagesChargees = {};
    noms.forEach((n, i) => (carte[n] = images[i]));
    dessinerEcranFormulaire(ctx, carte, tf);
    texture.needsUpdate = true;
  }

  // ---- Téléphone ----
  const arrivee = ressort(t, fps, 0.05, { damping: 20, stiffness: 55, mass: 1.3 });
  const derive = prog(t, 0.8, 7, LENT);
  const apresSucces = prog(t, tSucces, 1.2, FLUIDE);
  const rotY = mix(-0.95, 0, arrivee) + mix(-0.34, -0.2, derive) + apresSucces * 0.1;
  const rotX = mix(0.35, 0, arrivee) + 0.05;
  const posY = mix(-1.6, 0, arrivee) + Math.sin(t * 1.2) * 0.012;
  const fraction = vertical ? 0.68 : 0.82; // part de la hauteur de l'image occupée par le téléphone
  const distance = TEL3D.hauteur / fraction / (2 * Math.tan(THREE.MathUtils.degToRad(CHAMP / 2)));
  const decalageX = vertical ? 0 : -0.38 * (TEL3D.hauteur / fraction) * (largeur / hauteur) * 0.5 * 0.9;
  const decalageY = vertical ? 0.05 : 0;
  const sortie = versLaFin(reste, 0.6);

  // ---- Notification ----
  const pNotif = ressort(t, fps, tNotif, { damping: 16, stiffness: 90, mass: 1 });

  return (
    <AbsoluteFill style={{ background: COULEURS.mentheLavis, overflow: 'hidden' }}>
      <FondStudioClair x={vertical ? 50 : 68} y={vertical ? 58 : 48} motif={0.4} />
      <Halo
        x={vertical ? 50 : 69}
        y={vertical ? 58 : 50}
        taille={largeur * (vertical ? 1.2 : 0.62)}
        couleur="204,248,246"
        opacite={0.9}
        graine="s7a"
      />
      <Halo x={vertical ? 80 : 90} y={vertical ? 80 : 88} taille={largeur * 0.5} couleur="2,120,18" opacite={0.07} graine="s7b" />
      <Particules nombre={40} couleur="13,57,52" graine="s7p" opacite={0.12} vitesse={0.5} />

      <AbsoluteFill style={{ opacity: 1 - sortie, transform: `scale(${1 - sortie * 0.05})` }}>
        {images ? (
          <ThreeCanvas
            width={largeur}
            height={hauteur}
            camera={{ fov: CHAMP, near: 0.05, far: 100, position: [0, 0, distance] }}
            gl={{ antialias: true, alpha: true }}
          >
            <Studio intensite={1.1} clair />
            <ambientLight intensity={0.35} />
            <directionalLight position={[-3, 4, 5]} intensity={1.4} />
            <directionalLight position={[4, 1, -3]} intensity={1.6} color={COULEURS.menthe} />
            <Camera position={new THREE.Vector3(decalageX, decalageY, distance)} cible={new THREE.Vector3(decalageX, decalageY, 0)} champ={CHAMP} />
            <group position={[0, posY, 0]} rotation={[rotX, rotY, 0.02 * (1 - arrivee)]}>
              <Telephone3D texture={texture} reflet={prog(t, 1.4, 1.8, FLUIDE)} />
            </group>
          </ThreeCanvas>
        ) : null}
      </AbsoluteFill>

      {/* Titre : il change au moment de l'envoi */}
      <AbsoluteFill style={{ opacity: 1 - sortie }}>
        <div
          style={{
            position: 'absolute',
            left: vertical ? 60 : 120,
            right: vertical ? 60 : undefined,
            top: vertical ? 150 : hauteur * 0.38,
            width: vertical ? undefined : 780,
            display: 'flex',
            justifyContent: vertical ? 'center' : 'flex-start',
          }}
        >
          {t < tSucces + 0.1 ? (
            <MotsQuiMontent
              texte={titre1}
              debut={0.35}
              taille={vertical ? 96 : 104}
              couleur={COULEURS.petrole}
              sortie={tSucces - 0.35}
              style={{ whiteSpace: 'normal', textAlign: vertical ? 'center' : 'left', lineHeight: 1.04 }}
            />
          ) : (
            <MotsQuiMontent
              texte={titre2}
              debut={tSucces + 0.1}
              taille={vertical ? 96 : 104}
              couleur={COULEURS.petrole}
              style={{ whiteSpace: 'normal', textAlign: vertical ? 'center' : 'left', lineHeight: 1.04 }}
            />
          )}
        </div>
      </AbsoluteFill>

      {/* Notification d'exemple */}
      {t > tNotif - 0.05 ? (
        <div
          style={{
            position: 'absolute',
            left: vertical ? (largeur - 900) / 2 : 1085,
            top: vertical ? 470 : 118,
            opacity: Math.min(1, pNotif * 2) * (1 - sortie),
            transform: `translateY(${(1 - pNotif) * -160}px) scale(${mix(0.92, 1, pNotif)})`,
            transformOrigin: '50% 0%',
          }}
        >
          <Notification largeur={vertical ? 900 : 700} />
        </div>
      ) : null}

      <Finition vignette={0.2} grain={0.04} couleurVignette="13,57,52" />

      <Son effet="souffle" a={0.05} volume={0.5} />
      {SCRIPT_FORMULAIRE.filter((s) => 'duree' in s).map((s) =>
        new Array(Math.max(3, Math.round(((s as { duree: number }).duree ?? 0.3) * 14)))
          .fill(0)
          .map((_, k) => <Son key={`${s.id}-${k}`} effet="frappe" a={debutFormulaire + s.debut / vitesse + k * 0.06} volume={0.2} />),
      )}
      {SCRIPT_FORMULAIRE.filter((s) => !('duree' in s) && s.id !== 'succes').map((s) => (
        <Son key={s.id} effet="clic" a={debutFormulaire + s.debut / vitesse} volume={0.5} />
      ))}
      <Son effet="validation" a={tSucces + 0.2} volume={0.7} />
      <Son effet="notification" a={tNotif} volume={0.7} />
      <Son effet="souffle-court" a={tNotif} volume={0.3} />
    </AbsoluteFill>
  );
};
