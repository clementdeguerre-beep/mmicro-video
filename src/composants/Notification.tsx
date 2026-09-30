import { COULEURS, TEXTES } from '../config';
import { ICONES } from '../marque/icones';
import { TEXTE, TITRE } from '../outils/polices';

/* Notification d'exemple : l'e-mail que reçoit l'entreprise (objet
   « Nouvelle demande de rappel – [type] – [commune] », défini par le site). */
export const Notification: React.FC<{ largeur: number; style?: React.CSSProperties }> = ({ largeur, style }) => {
  const n = TEXTES.telephone.notification;
  const e = largeur / 560; // dessinée pour 560 px de large
  return (
    <div
      style={{
        width: largeur,
        padding: `${20 * e}px ${22 * e}px ${20 * e}px ${20 * e}px`,
        borderRadius: 30 * e,
        background: 'rgba(255,255,255,0.84)',
        backdropFilter: 'blur(24px) saturate(1.6)',
        WebkitBackdropFilter: 'blur(24px) saturate(1.6)',
        border: `${1.5 * e}px solid rgba(255,255,255,0.9)`,
        boxShadow: `0 ${4 * e}px ${10 * e}px rgba(13,57,52,0.08), 0 ${40 * e}px ${80 * e}px -${20 * e}px rgba(13,57,52,0.45)`,
        display: 'flex',
        gap: 16 * e,
        alignItems: 'flex-start',
        ...style,
      }}
    >
      <div
        style={{
          flex: 'none',
          width: 58 * e,
          height: 58 * e,
          borderRadius: 16 * e,
          background: COULEURS.petrole,
          display: 'grid',
          placeItems: 'center',
        }}
      >
        <svg
          viewBox="0 0 24 24"
          width={30 * e}
          height={30 * e}
          fill="none"
          stroke={COULEURS.menthe}
          strokeWidth={1.9}
          strokeLinecap="round"
          strokeLinejoin="round"
          dangerouslySetInnerHTML={{ __html: ICONES.mail }}
        />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: TEXTE, fontSize: 17 * e, fontWeight: 600, color: '#5E7572', letterSpacing: '0.02em' }}>
          <span style={{ textTransform: 'uppercase', letterSpacing: '0.1em' }}>{n.application}</span>
          <span style={{ fontWeight: 500 }}>{n.heure}</span>
        </div>
        <div style={{ marginTop: 6 * e, fontFamily: TITRE, fontSize: 25 * e, fontWeight: 650, lineHeight: 1.18, letterSpacing: '-0.015em', color: COULEURS.petrole }}>
          {n.titre}
        </div>
        <div style={{ marginTop: 6 * e, fontFamily: TEXTE, fontSize: 19 * e, fontWeight: 500, color: '#36524E' }}>{n.expediteur}</div>
      </div>
    </div>
  );
};
