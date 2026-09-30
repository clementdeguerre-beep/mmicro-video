import { useMemo } from 'react';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { rectangleArrondi } from './outils3d';

/* Ordinateur portable générique, modélisé simplement :
   socle en aluminium, clavier, pavé tactile, écran avec bordure en verre.
   Aucun logo ni détail propre à une marque. Unités : ~10 cm. */
export const DIM = {
  largeur: 3.1,
  profondeur: 2.15,
  epaisseurSocle: 0.075,
  hauteurCapot: 2.0,
  epaisseurCapot: 0.045,
  ecranL: 2.86,
  ecranH: 2.86 / 1.6, // 16:10
  ecranY: 1.035, // centre de l'écran dans le capot (depuis la charnière)
};

export const ANGLE_CAPOT = -18; // inclinaison vers l'arrière (degrés)

/** Centre et orientation de l'écran dans la scène (pour caler la caméra) */
export const repereEcran = (angle = ANGLE_CAPOT) => {
  const charniere = new THREE.Vector3(0, DIM.epaisseurSocle, -DIM.profondeur / 2 + 0.03);
  const rot = new THREE.Matrix4().makeRotationX(THREE.MathUtils.degToRad(angle));
  const centre = new THREE.Vector3(0, DIM.ecranY, DIM.epaisseurCapot / 2 + 0.002).applyMatrix4(rot).add(charniere);
  const normale = new THREE.Vector3(0, 0, 1).applyMatrix4(rot);
  const haut = new THREE.Vector3(0, 1, 0).applyMatrix4(rot);
  return { centre, normale, haut, charniere };
};

export const Ordinateur3D: React.FC<{
  texture: THREE.Texture;
  allumage: number; // 0 = écran éteint, 1 = allumé
  angleCapot?: number;
  verre?: number; // opacité du reflet du verre (0 pendant la plongée)
  reflet?: number | null; // bande de lumière qui balaie l'écran, 0 → 1
}> = ({ texture, allumage, angleCapot = ANGLE_CAPOT, verre = 1, reflet = null }) => {
  const g = useMemo(() => {
    const alu = new THREE.MeshPhysicalMaterial({ color: '#b7c0bf', metalness: 1, roughness: 0.3, clearcoat: 0.3, clearcoatRoughness: 0.4 });
    const aluSombre = new THREE.MeshPhysicalMaterial({ color: '#8d9695', metalness: 1, roughness: 0.42 });
    const touche = new THREE.MeshStandardMaterial({ color: '#1d2322', metalness: 0.2, roughness: 0.62 });
    const fondClavier = new THREE.MeshStandardMaterial({ color: '#0f1413', metalness: 0.4, roughness: 0.7 });
    const verre = new THREE.MeshPhysicalMaterial({ color: '#030404', metalness: 0, roughness: 0.06, clearcoat: 1, clearcoatRoughness: 0.03 });
    const pave = new THREE.MeshPhysicalMaterial({ color: '#a9b2b1', metalness: 0.9, roughness: 0.22, clearcoat: 0.8 });
    const reflet = new THREE.MeshPhysicalMaterial({ color: '#000000', metalness: 0, roughness: 0.02, transparent: true, opacity: 0.16, clearcoat: 1, depthWrite: false });

    const socle = new RoundedBoxGeometry(DIM.largeur, DIM.epaisseurSocle, DIM.profondeur, 5, 0.035);
    const capot = new RoundedBoxGeometry(DIM.largeur, DIM.hauteurCapot, DIM.epaisseurCapot, 5, 0.02);
    const bordure = rectangleArrondi(DIM.largeur - 0.05, DIM.hauteurCapot - 0.05, 0.06);
    const ecran = rectangleArrondi(DIM.ecranL, DIM.ecranH, 0.012);
    const zoneClavier = rectangleArrondi(2.78, 1.16, 0.05);
    const paveTactile = rectangleArrondi(1.25, 0.7, 0.06);
    const geoTouche = new RoundedBoxGeometry(0.168, 0.018, 0.168, 3, 0.022);
    const geoCharniere = new THREE.CylinderGeometry(0.045, 0.045, DIM.largeur * 0.82, 24);

    // Disposition générique des touches (6 rangées)
    const touches: { x: number; z: number; l: number; p: number }[] = [];
    const pas = 0.19;
    const x0 = -1.3;
    const rangees = [
      { n: 14, p: 0.1 },
      { n: 14, p: 0.168 },
      { n: 14, p: 0.168 },
      { n: 13, p: 0.168 },
      { n: 12, p: 0.168 },
      { n: 0, p: 0.168 },
    ];
    let z = -DIM.profondeur / 2 + 0.2;
    rangees.forEach((r, i) => {
      if (i < 5) {
        const largeurTotale = 2.6;
        const l = (largeurTotale - (r.n - 1) * (pas - 0.168)) / r.n;
        for (let k = 0; k < r.n; k++) touches.push({ x: x0 + l / 2 + k * (l + (pas - 0.168)), z: z + r.p / 2, l, p: r.p });
      } else {
        // dernière rangée : barre d'espace au centre
        const lt = [0.19, 0.19, 0.19, 0.25, 1.02, 0.25, 0.19, 0.19];
        let x = x0;
        lt.forEach((l) => {
          touches.push({ x: x + l / 2, z: z + r.p / 2, l, p: r.p });
          x += l + 0.02;
        });
      }
      z += r.p + 0.022;
    });
    return { alu, aluSombre, touche, fondClavier, verre, pave, reflet, socle, capot, bordure, ecran, zoneClavier, paveTactile, geoTouche, geoCharniere, touches };
  }, []);

  const matEcran = useMemo(() => new THREE.MeshBasicMaterial({ map: texture, toneMapped: false }), [texture]);
  matEcran.color.setScalar(allumage);
  g.reflet.opacity = 0.16 * verre;

  // Bande lumineuse diagonale, limitée à la surface du verre (texture décalée)
  const bande = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = 1024;
    c.height = 660;
    const x = c.getContext('2d')!;
    x.translate(512, 330);
    x.rotate(-0.45);
    const d = x.createLinearGradient(-200, 0, 200, 0);
    d.addColorStop(0, 'rgba(255,255,255,0)');
    d.addColorStop(0.35, 'rgba(255,255,255,0.08)');
    d.addColorStop(0.5, 'rgba(255,255,255,0.42)');
    d.addColorStop(0.65, 'rgba(255,255,255,0.08)');
    d.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = d;
    x.fillRect(-200, -900, 400, 1800);
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    return new THREE.MeshBasicMaterial({ map: tex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
  }, []);
  if (bande.map) bande.map.offset.x = reflet === null ? 2 : (0.5 - reflet) * 2.2;

  const e = DIM.epaisseurSocle;
  return (
    <group>
      {/* Socle */}
      <mesh geometry={g.socle} material={g.alu} position={[0, e / 2, 0]} />
      <mesh geometry={g.zoneClavier} material={g.fondClavier} rotation={[-Math.PI / 2, 0, 0]} position={[0, e + 0.0008, -0.34]} />
      {g.touches.map((k, i) => (
        <mesh key={i} geometry={g.geoTouche} material={g.touche} position={[k.x, e + 0.006, k.z]} scale={[k.l / 0.168, 1, k.p / 0.168]} />
      ))}
      <mesh geometry={g.paveTactile} material={g.pave} rotation={[-Math.PI / 2, 0, 0]} position={[0, e + 0.0008, 0.64]} />
      <mesh geometry={g.geoCharniere} material={g.aluSombre} rotation={[0, 0, Math.PI / 2]} position={[0, e + 0.01, -DIM.profondeur / 2 + 0.03]} />

      {/* Capot et écran */}
      <group position={[0, e, -DIM.profondeur / 2 + 0.03]} rotation={[THREE.MathUtils.degToRad(angleCapot), 0, 0]}>
        <mesh geometry={g.capot} material={g.alu} position={[0, DIM.hauteurCapot / 2 + 0.01, 0]} />
        <mesh geometry={g.bordure} material={g.verre} position={[0, DIM.hauteurCapot / 2 + 0.01, DIM.epaisseurCapot / 2 + 0.0008]} />
        <mesh geometry={g.ecran} material={matEcran} position={[0, DIM.ecranY, DIM.epaisseurCapot / 2 + 0.0016]} />
        <mesh geometry={g.bordure} material={g.reflet} position={[0, DIM.hauteurCapot / 2 + 0.01, DIM.epaisseurCapot / 2 + 0.0024]} />
        {reflet !== null && reflet > 0 && reflet < 1 ? (
          <mesh geometry={g.bordure} material={bande} position={[0, DIM.hauteurCapot / 2 + 0.01, DIM.epaisseurCapot / 2 + 0.003]} />
        ) : null}
      </group>
    </group>
  );
};
