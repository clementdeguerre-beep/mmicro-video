/* Largeur d'un texte à l'écran (polices chargées), pour placer les lignes au pixel près */
let toile: HTMLCanvasElement | null = null;

export const largeurTexte = (texte: string, taille: number, famille = '"Outfit"', graisse = 700, interlettrage = -0.045) => {
  toile ??= document.createElement('canvas');
  const ctx = toile.getContext('2d')!;
  ctx.font = `${graisse} ${taille}px ${famille}`;
  const l = ctx.measureText(texte).width;
  return l + interlettrage * taille * texte.length;
};
