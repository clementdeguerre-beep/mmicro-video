import { COULEURS } from '../config';
import { ICONES, NomIcone } from '../marque/icones';

/* Pastille hexagonale du site (forme --hex) avec une icône au trait */
export const POINTS_HEXA = '50,7 93,32 93,84 50,109 7,84 7,32';

export const Hexa: React.FC<{
  largeur: number; // la hauteur vaut 60/52 de la largeur, comme sur le site
  icone?: NomIcone;
  fond?: string;
  couleurIcone?: string;
  texte?: string; // à la place d'une icône (numéros d'étapes)
  style?: React.CSSProperties;
}> = ({ largeur, icone, fond = COULEURS.menthe, couleurIcone = COULEURS.vert, texte, style }) => {
  const hauteur = (largeur * 60) / 52;
  const tailleIcone = (largeur * 26) / 52;
  return (
    <div style={{ position: 'relative', width: largeur, height: hauteur, ...style }}>
      <svg viewBox="0 0 100 116" width={largeur} height={hauteur} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
        <polygon points={POINTS_HEXA} fill={fond} stroke={fond} strokeWidth={12} strokeLinejoin="round" />
      </svg>
      {icone ? (
        <svg
          viewBox="0 0 24 24"
          width={tailleIcone}
          height={tailleIcone}
          style={{ position: 'absolute', left: (largeur - tailleIcone) / 2, top: (hauteur - tailleIcone) / 2 }}
          fill="none"
          stroke={couleurIcone}
          strokeWidth={1.9}
          strokeLinecap="round"
          strokeLinejoin="round"
          dangerouslySetInnerHTML={{ __html: ICONES[icone] }}
        />
      ) : null}
      {texte ? (
        <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', color: couleurIcone, fontFamily: '"Outfit", sans-serif', fontWeight: 700, fontSize: largeur * 0.42 }}>
          {texte}
        </div>
      ) : null}
    </div>
  );
};
