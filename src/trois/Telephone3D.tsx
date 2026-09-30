import { useMemo } from 'react';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { rectangleArrondi } from './outils3d';

/* Smartphone générique : cadre métal graphite, verre noir, écran à coins
   arrondis, petite caméra ronde en haut de l'écran. Aucun élément de marque. */
export const TEL3D = {
  largeur: 0.78,
  hauteur: 1.64,
  epaisseur: 0.062,
  ecranL: 0.73,
  ecranH: (0.73 * 844) / 390,
};

const forme = (l: number, h: number, r: number) => {
  const f = new THREE.Shape();
  const x = -l / 2;
  const y = -h / 2;
  f.moveTo(x + r, y);
  f.lineTo(x + l - r, y);
  f.absarc(x + l - r, y + r, r, -Math.PI / 2, 0, false);
  f.lineTo(x + l, y + h - r);
  f.absarc(x + l - r, y + h - r, r, 0, Math.PI / 2, false);
  f.lineTo(x + r, y + h);
  f.absarc(x + r, y + h - r, r, Math.PI / 2, Math.PI, false);
  f.lineTo(x, y + r);
  f.absarc(x + r, y + r, r, Math.PI, Math.PI * 1.5, false);
  return f;
};

export const Telephone3D: React.FC<{ texture: THREE.Texture; reflet?: number | null }> = ({ texture, reflet = null }) => {
  const g = useMemo(() => {
    const biseau = 0.012;
    const corps = new THREE.ExtrudeGeometry(forme(TEL3D.largeur - 2 * biseau, TEL3D.hauteur - 2 * biseau, 0.1), {
      depth: TEL3D.epaisseur - 2 * biseau,
      bevelEnabled: true,
      bevelThickness: biseau,
      bevelSize: biseau,
      bevelSegments: 6,
      curveSegments: 32,
    });
    corps.translate(0, 0, -(TEL3D.epaisseur - 2 * biseau) / 2);
    const cadre = new THREE.MeshPhysicalMaterial({ color: '#3d4847', metalness: 1, roughness: 0.22, clearcoat: 0.6 });
    const verre = new THREE.MeshPhysicalMaterial({ color: '#040505', metalness: 0, roughness: 0.05, clearcoat: 1, clearcoatRoughness: 0.02 });
    const dos = new THREE.MeshPhysicalMaterial({ color: '#27302f', metalness: 0.3, roughness: 0.38, clearcoat: 1, clearcoatRoughness: 0.2 });
    const face = new THREE.ShapeGeometry(forme(TEL3D.largeur - 0.012, TEL3D.hauteur - 0.012, 0.104), 32);
    const ecran = rectangleArrondi(TEL3D.ecranL, TEL3D.ecranH, 0.085);
    const camera = new THREE.CircleGeometry(0.017, 32);
    const bouton = new RoundedBoxGeometry(0.012, 0.16, 0.022, 3, 0.005);
    const reflet = new THREE.MeshPhysicalMaterial({ color: '#000000', roughness: 0.02, transparent: true, opacity: 0.12, clearcoat: 1, depthWrite: false });
    return { corps, cadre, verre, dos, face, ecran, camera, bouton, reflet };
  }, []);

  const matEcran = useMemo(() => new THREE.MeshBasicMaterial({ map: texture, toneMapped: false }), [texture]);

  const bande = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = 512;
    c.height = 1024;
    const x = c.getContext('2d')!;
    x.translate(256, 512);
    x.rotate(-0.6);
    const d = x.createLinearGradient(-160, 0, 160, 0);
    d.addColorStop(0, 'rgba(255,255,255,0)');
    d.addColorStop(0.4, 'rgba(255,255,255,0.08)');
    d.addColorStop(0.5, 'rgba(255,255,255,0.4)');
    d.addColorStop(0.6, 'rgba(255,255,255,0.08)');
    d.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = d;
    x.fillRect(-160, -1200, 320, 2400);
    const tex = new THREE.CanvasTexture(c);
    return new THREE.MeshBasicMaterial({ map: tex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
  }, []);
  if (bande.map) bande.map.offset.x = reflet === null ? 2 : (0.5 - reflet) * 2.4;

  const zAvant = TEL3D.epaisseur / 2;
  return (
    <group>
      <mesh geometry={g.corps} material={g.cadre} />
      <mesh geometry={g.face} material={g.dos} position={[0, 0, -zAvant - 0.0006]} rotation={[0, Math.PI, 0]} />
      <mesh geometry={g.face} material={g.verre} position={[0, 0, zAvant + 0.0006]} />
      <mesh geometry={g.ecran} material={matEcran} position={[0, 0, zAvant + 0.0012]} />
      <mesh geometry={g.camera} position={[0, TEL3D.ecranH / 2 - 0.028, zAvant + 0.0016]}>
        <meshBasicMaterial color="#020303" />
      </mesh>
      <mesh geometry={g.face} material={g.reflet} position={[0, 0, zAvant + 0.002]} />
      {reflet !== null && reflet > 0 && reflet < 1 ? <mesh geometry={g.ecran} material={bande} position={[0, 0, zAvant + 0.0024]} /> : null}
      {/* Boutons latéraux */}
      <mesh geometry={g.bouton} material={g.cadre} position={[TEL3D.largeur / 2 + 0.002, 0.34, 0]} />
      <mesh geometry={g.bouton} material={g.cadre} position={[-TEL3D.largeur / 2 - 0.002, 0.42, 0]} scale={[1, 0.6, 1]} />
      <mesh geometry={g.bouton} material={g.cadre} position={[-TEL3D.largeur / 2 - 0.002, 0.26, 0]} scale={[1, 0.6, 1]} />
    </group>
  );
};
