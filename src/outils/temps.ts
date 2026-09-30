import { Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

/* Courbes de mouvement : jamais linéaires */
export const DOUX = Easing.bezier(0.2, 0.75, 0.2, 1); // arrivée douce (celle du site)
export const FLUIDE = Easing.bezier(0.65, 0, 0.35, 1); // accélère puis freine
export const SORTIE = Easing.bezier(0.55, 0, 0.9, 0.4); // départ qui accélère
export const LENT = Easing.bezier(0.33, 0, 0.15, 1); // travelling de caméra

/** Temps de la scène en cours (à l'intérieur d'une <Sequence>) */
export const useTemps = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames, width, height } = useVideoConfig();
  const t = frame / fps;
  const duree = durationInFrames / fps;
  return { frame, fps, t, duree, reste: duree - t, largeur: width, hauteur: height, vertical: height > width };
};

/** Progression 0 → 1 entre `debut` et `debut + duree` (secondes), avec courbe */
export const prog = (t: number, debut: number, duree: number, courbe: (x: number) => number = DOUX) =>
  interpolate(t, [debut, debut + duree], [0, 1], {
    easing: courbe,
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

/** Ressort amorti démarrant à `debut` (secondes) */
export const ressort = (
  t: number,
  fps: number,
  debut: number,
  config: { damping?: number; stiffness?: number; mass?: number } = {},
) =>
  spring({
    frame: Math.round((t - debut) * fps),
    fps,
    config: { damping: 18, stiffness: 120, mass: 1, ...config },
  });

/** Interpolation simple entre deux valeurs */
export const mix = (a: number, b: number, p: number) => a + (b - a) * p;

/** Sortie de scène : 0 → 1 pendant les `duree` dernières secondes */
export const versLaFin = (reste: number, duree: number, courbe: (x: number) => number = FLUIDE) =>
  courbe(Math.min(1, Math.max(0, 1 - reste / duree)));
