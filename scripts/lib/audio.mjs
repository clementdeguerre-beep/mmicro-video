/* Outils audio partagés : lecture/écriture WAV, volume perçu (LUFS, norme
   ITU-R BS.1770) et limiteur de crêtes. */
import { readFile, writeFile } from 'node:fs/promises';

export const lireWav = async (fichier) => {
  const buf = await readFile(fichier);
  const canaux = buf.readUInt16LE(22);
  const sr = buf.readUInt32LE(24);
  const bits = buf.readUInt16LE(34);
  if (bits !== 16) throw new Error(`${fichier} : seuls les WAV 16 bits sont pris en charge`);
  let o = 12;
  while (buf.toString('ascii', o, o + 4) !== 'data') o += 8 + buf.readUInt32LE(o + 4);
  const debut = o + 8;
  const n = Math.floor(Math.min(buf.readUInt32LE(o + 4), buf.length - debut) / (2 * canaux));
  const L = new Float32Array(n);
  const R = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    L[i] = buf.readInt16LE(debut + i * canaux * 2) / 32768;
    R[i] = canaux > 1 ? buf.readInt16LE(debut + i * canaux * 2 + 2) / 32768 : L[i];
  }
  return { sr, L, R, n };
};

export const ecrireWav = async (fichier, { sr, L, R, n }) => {
  const donnees = Buffer.alloc(n * 4);
  let graine = 12345;
  const alea = () => ((graine = (graine * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
  for (let i = 0; i < n; i++) {
    for (let c = 0; c < 2; c++) {
      const x = (c === 0 ? L : R)[i] + (alea() - alea()) / 32768;
      donnees.writeInt16LE(Math.round(Math.max(-1, Math.min(1, x)) * 32767), i * 4 + c * 2);
    }
  }
  const tete = Buffer.alloc(44);
  tete.write('RIFF', 0);
  tete.writeUInt32LE(36 + donnees.length, 4);
  tete.write('WAVEfmt ', 8);
  tete.writeUInt32LE(16, 16);
  tete.writeUInt16LE(1, 20);
  tete.writeUInt16LE(2, 22);
  tete.writeUInt32LE(sr, 24);
  tete.writeUInt32LE(sr * 4, 28);
  tete.writeUInt16LE(4, 32);
  tete.writeUInt16LE(16, 34);
  tete.write('data', 36);
  tete.writeUInt32LE(donnees.length, 40);
  await writeFile(fichier, Buffer.concat([tete, donnees]));
};

/** Volume perçu intégré (LUFS), BS.1770-4, pour un signal à 48 kHz */
export const lufs = ({ L, R, n, sr }) => {
  if (sr !== 48000) throw new Error('Mesure LUFS prévue pour 48 kHz');
  const filtre = (x) => {
    const etages = [
      { b: [1.53512485958697, -2.69169618940638, 1.19839281085285], a: [-1.69065929318241, 0.73248077421585] },
      { b: [1.0, -2.0, 1.0], a: [-1.99004745483398, 0.99007225036621] },
    ];
    let y = x;
    for (const { b, a } of etages) {
      const s = new Float32Array(n);
      let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
      for (let i = 0; i < n; i++) {
        const v = b[0] * y[i] + b[1] * x1 + b[2] * x2 - a[0] * y1 - a[1] * y2;
        x2 = x1; x1 = y[i]; y2 = y1; y1 = v;
        s[i] = v;
      }
      y = s;
    }
    return y;
  };
  const fl = filtre(L);
  const fr = filtre(R);
  const bloc = Math.round(0.4 * sr);
  const pas = Math.round(0.1 * sr);
  const blocs = [];
  for (let d = 0; d + bloc <= n; d += pas) {
    let s = 0;
    for (let i = d; i < d + bloc; i++) s += fl[i] * fl[i] + fr[i] * fr[i];
    blocs.push(s / bloc);
  }
  const niveau = (z) => -0.691 + 10 * Math.log10(z);
  const absolus = blocs.filter((z) => niveau(z) > -70);
  if (absolus.length === 0) return -Infinity;
  const moyenne = absolus.reduce((a, b) => a + b, 0) / absolus.length;
  const relatifs = absolus.filter((z) => niveau(z) > niveau(moyenne) - 10);
  return niveau(relatifs.reduce((a, b) => a + b, 0) / relatifs.length);
};

export const crete = ({ L, R, n }) => {
  let m = 0;
  for (let i = 0; i < n; i++) m = Math.max(m, Math.abs(L[i]), Math.abs(R[i]));
  return 20 * Math.log10(m + 1e-12);
};

/** Gain (dB) puis limiteur à anticipation : aucune crête au-dessus du plafond */
export const gainEtLimiteur = ({ L, R, n, sr }, gainDb, plafondDb = -1.5) => {
  const g0 = Math.pow(10, gainDb / 20);
  const plafond = Math.pow(10, plafondDb / 20);
  const avance = Math.round(0.006 * sr);
  const relache = Math.exp(-1 / (0.12 * sr));
  const oL = new Float32Array(n);
  const oR = new Float32Array(n);
  // enveloppe de gain : minimum glissant sur la fenêtre d'anticipation
  const besoin = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const a = Math.max(Math.abs(L[i]), Math.abs(R[i])) * g0;
    besoin[i] = a > plafond ? plafond / a : 1;
  }
  let g = 1;
  for (let i = 0; i < n; i++) {
    let cible = 1;
    for (let j = i; j < Math.min(n, i + avance); j += 2) cible = Math.min(cible, besoin[j]);
    g = cible < g ? g + (cible - g) * 0.35 : cible + (g - cible) * relache;
    const gf = Math.min(g, besoin[i]);
    oL[i] = L[i] * g0 * gf;
    oR[i] = R[i] * g0 * gf;
  }
  return { sr, L: oL, R: oR, n };
};

/** Amène un signal au volume cible (LUFS) sans dépasser le plafond de crête */
export const masteriser = (signal, cibleLufs = -14, plafondDb = -1.5) => {
  const mesure = lufs(signal);
  let gain = cibleLufs - mesure;
  let sortie = gainEtLimiteur(signal, gain, plafondDb);
  // le limiteur retire un peu de volume : une seconde passe corrige
  const apres = lufs(sortie);
  gain += cibleLufs - apres;
  sortie = gainEtLimiteur(signal, gain, plafondDb);
  return { sortie, gain, avant: mesure };
};
