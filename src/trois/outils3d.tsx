import { useThree } from '@react-three/fiber';
import { useEffect, useMemo, useState } from 'react';
import { continueRender, delayRender } from 'remotion';
import * as THREE from 'three';

/* ---------- Chargement d'images (le rendu attend qu'elles soient prêtes) ---------- */
export const useImages = (sources: string[]): HTMLImageElement[] | null => {
  const cle = sources.join('|');
  const [images, setImages] = useState<HTMLImageElement[] | null>(null);
  const [attente] = useState(() => delayRender(`Images : ${sources.length}`));
  useEffect(() => {
    let annule = false;
    Promise.all(
      sources.map(
        (src) =>
          new Promise<HTMLImageElement>((ok, ko) => {
            const img = new Image();
            img.onload = () => ok(img);
            img.onerror = () => ko(new Error(`Image introuvable : ${src}`));
            img.src = src;
          }),
      ),
    )
      .then((liste) => {
        if (!annule) setImages(liste);
        else continueRender(attente);
      })
      .catch((e) => {
        console.error(e);
        continueRender(attente);
      });
    return () => {
      annule = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cle]);
  // Le rendu reprend seulement une fois les images affichées (et la scène 3D créée)
  useEffect(() => {
    if (images) continueRender(attente);
  }, [images, attente]);
  return images;
};

/* ---------- Texture dessinée sur une toile (écran des appareils) ---------- */
export const useToile = (largeur: number, hauteur: number) =>
  useMemo(() => {
    const toile = document.createElement('canvas');
    toile.width = largeur;
    toile.height = hauteur;
    const texture = new THREE.CanvasTexture(toile);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.generateMipmaps = true;
    const ctx = toile.getContext('2d')!;
    ctx.imageSmoothingQuality = 'high';
    return { toile, texture, ctx };
  }, [largeur, hauteur]);

/* ---------- Éclairage de studio ----------
   Carte d'environnement fabriquée à partir de panneaux lumineux (boîte à
   lumière blanche, bandes menthe et verte) : ce sont eux qu'on voit se
   refléter sur l'aluminium et le verre des appareils. */
export const Studio: React.FC<{ intensite?: number; clair?: boolean }> = ({ intensite = 1, clair = false }) => {
  const { gl, scene } = useThree();
  const env = useMemo(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const s = new THREE.Scene();
    s.background = new THREE.Color(clair ? '#9fb9b5' : '#010202');
    const panneau = (l: number, h: number, couleur: string, force: number, pos: [number, number, number], rot: [number, number, number]) => {
      const m = new THREE.Mesh(
        new THREE.PlaneGeometry(l, h),
        new THREE.MeshBasicMaterial({ color: new THREE.Color(couleur).multiplyScalar(force), side: THREE.DoubleSide }),
      );
      m.position.set(...pos);
      m.rotation.set(...rot);
      s.add(m);
    };
    // Boîte à lumière principale, au-dessus et devant
    panneau(10, 6, '#ffffff', 3.2, [0, 9, 4], [Math.PI / 2, 0, 0]);
    // Bande menthe à gauche, bande verte à droite (reflets colorés sur les arêtes)
    panneau(1.2, 12, '#CCF8F6', 5, [-9, 2, 1], [0, Math.PI / 2, 0]);
    panneau(1.2, 12, '#1fae3a', 3.2, [9, 2, -1], [0, -Math.PI / 2, 0]);
    // Liseré fin et très lumineux derrière (contre-jour)
    panneau(14, 0.35, '#ffffff', 7, [0, 3.5, -9], [0, 0, 0]);
    // Réflecteur doux au sol
    panneau(16, 16, clair ? '#e6f7f5' : '#0b1917', 1, [0, -6, 0], [-Math.PI / 2, 0, 0]);
    const rt = pmrem.fromScene(s, 0.03);
    pmrem.dispose();
    return rt.texture;
  }, [gl, clair]);
  scene.environment = env;
  scene.environmentIntensity = intensite;
  return null;
};

/* ---------- Rectangle à coins arrondis (plan) ---------- */
export const rectangleArrondi = (l: number, h: number, r: number) => {
  const f = new THREE.Shape();
  const x = -l / 2;
  const y = -h / 2;
  f.moveTo(x + r, y);
  f.lineTo(x + l - r, y);
  f.quadraticCurveTo(x + l, y, x + l, y + r);
  f.lineTo(x + l, y + h - r);
  f.quadraticCurveTo(x + l, y + h, x + l - r, y + h);
  f.lineTo(x + r, y + h);
  f.quadraticCurveTo(x, y + h, x, y + h - r);
  f.lineTo(x, y + r);
  f.quadraticCurveTo(x, y, x + r, y);
  const g = new THREE.ShapeGeometry(f, 12);
  // coordonnées de texture de 0 à 1 sur toute la surface
  const pos = g.attributes.position;
  const uv = new Float32Array(pos.count * 2);
  for (let i = 0; i < pos.count; i++) {
    uv[i * 2] = (pos.getX(i) - x) / l;
    uv[i * 2 + 1] = (pos.getY(i) - y) / h;
  }
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  return g;
};

/* ---------- Caméra pilotée image par image ---------- */
export const Camera: React.FC<{
  position: THREE.Vector3;
  cible: THREE.Vector3;
  haut?: THREE.Vector3;
  champ?: number; // angle de champ vertical (degrés)
}> = ({ position, cible, haut, champ }) => {
  const { camera } = useThree();
  camera.position.copy(position);
  if (haut) camera.up.copy(haut);
  else camera.up.set(0, 1, 0);
  camera.lookAt(cible);
  if (champ && camera instanceof THREE.PerspectiveCamera && camera.fov !== champ) {
    camera.fov = champ;
    camera.updateProjectionMatrix();
  }
  camera.updateMatrixWorld();
  return null;
};

/** Point sur une sphère autour d'une cible (azimut et élévation en degrés) */
export const orbite = (cible: THREE.Vector3, azimut: number, elevation: number, distance: number) => {
  const a = THREE.MathUtils.degToRad(azimut);
  const e = THREE.MathUtils.degToRad(elevation);
  return new THREE.Vector3(
    cible.x + distance * Math.cos(e) * Math.sin(a),
    cible.y + distance * Math.sin(e),
    cible.z + distance * Math.cos(e) * Math.cos(a),
  );
};
