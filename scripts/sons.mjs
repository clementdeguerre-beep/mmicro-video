/*
 * Fabrique tout le son du film par synthèse (aucun enregistrement, aucun droit à payer) :
 *   - les effets sonores  → public/audio/effets/*.wav
 *   - la musique originale → public/audio/musique-16x9.wav et musique-9x16.wav
 *
 *   npm run sons
 *
 * La musique suit la chronologie de src/config.ts (120 battements par minute,
 * chaque scène commence sur un temps). Relancez cette commande après avoir
 * changé la durée d'une scène.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { FILM_16_9, FILM_9_16 } = await import(path.join(RACINE, 'src/config.ts'));

const SR = 48000;
const TAU = Math.PI * 2;

/* ============================== Outils DSP ============================== */

// Générateur pseudo-aléatoire reproductible
const hasard = (graine) => {
  let a = graine >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
const dbVersGain = (db) => Math.pow(10, db / 20);

class Stereo {
  constructor(secondes) {
    this.n = Math.ceil(secondes * SR);
    this.L = new Float32Array(this.n);
    this.R = new Float32Array(this.n);
  }
  ajouter(autre, gain = 1, decalage = 0) {
    const d = Math.round(decalage * SR);
    for (let i = 0; i < autre.n; i++) {
      const j = i + d;
      if (j < 0 || j >= this.n) continue;
      this.L[j] += autre.L[i] * gain;
      this.R[j] += autre.R[i] * gain;
    }
    return this;
  }
}

// Filtre biquad (formules RBJ), forme transposée
class Biquad {
  constructor(type, f, q = 0.707) {
    this.type = type;
    this.z1 = 0;
    this.z2 = 0;
    this.regler(f, q);
  }
  regler(f, q = this.q) {
    this.q = q;
    const w0 = (TAU * Math.min(f, SR * 0.45)) / SR;
    const c = Math.cos(w0);
    const alpha = Math.sin(w0) / (2 * q);
    let b0, b1, b2;
    if (this.type === 'passe-bas') [b0, b1, b2] = [(1 - c) / 2, 1 - c, (1 - c) / 2];
    else if (this.type === 'passe-haut') [b0, b1, b2] = [(1 + c) / 2, -(1 + c), (1 + c) / 2];
    else [b0, b1, b2] = [alpha, 0, -alpha]; // passe-bande
    const a0 = 1 + alpha;
    this.b0 = b0 / a0;
    this.b1 = b1 / a0;
    this.b2 = b2 / a0;
    this.a1 = (-2 * c) / a0;
    this.a2 = (1 - alpha) / a0;
  }
  tick(x) {
    const y = this.b0 * x + this.z1;
    this.z1 = this.b1 * x - this.a1 * y + this.z2;
    this.z2 = this.b2 * x - this.a2 * y;
    return y;
  }
}

// Réverbération (algorithme « Freeverb »)
const reverb = (entree, { taille = 0.8, amorti = 0.4, largeur = 1, humide = 1, sec = 0, passeBas = 7000 } = {}) => {
  const k = SR / 44100;
  const combs = [1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617];
  const allpass = [556, 441, 341, 225];
  const fabriquer = (decal) => ({
    c: combs.map((l) => ({ b: new Float32Array(Math.round((l + decal) * k)), i: 0, f: 0 })),
    a: allpass.map((l) => ({ b: new Float32Array(Math.round((l + decal) * k)), i: 0 })),
  });
  const canaux = [fabriquer(0), fabriquer(23)];
  const retour = taille * 0.28 + 0.7;
  const damp = amorti * 0.4;
  const sortie = new Stereo(entree.n / SR + 0.0001);
  const lpL = new Biquad('passe-bas', passeBas);
  const lpR = new Biquad('passe-bas', passeBas);
  for (let n = 0; n < entree.n; n++) {
    const x = (entree.L[n] + entree.R[n]) * 0.015;
    const res = [0, 0];
    for (let ch = 0; ch < 2; ch++) {
      const C = canaux[ch];
      let s = 0;
      for (const c of C.c) {
        const o = c.b[c.i];
        c.f = o * (1 - damp) + c.f * damp;
        c.b[c.i] = x + c.f * retour;
        if (++c.i >= c.b.length) c.i = 0;
        s += o;
      }
      for (const a of C.a) {
        const o = a.b[a.i];
        const y = -s + o;
        a.b[a.i] = s + o * 0.5;
        if (++a.i >= a.b.length) a.i = 0;
        s = y;
      }
      res[ch] = s;
    }
    const w1 = humide * (largeur / 2 + 0.5);
    const w2 = humide * ((1 - largeur) / 2);
    sortie.L[n] = lpL.tick(res[0] * w1 + res[1] * w2) + entree.L[n] * sec;
    sortie.R[n] = lpR.tick(res[1] * w1 + res[0] * w2) + entree.R[n] * sec;
  }
  return sortie;
};

// Écho ping-pong
const echo = (entree, { temps = 0.375, retour = 0.35, melange = 0.3, passeBas = 4000 }) => {
  const d = Math.round(temps * SR);
  const bL = new Float32Array(d);
  const bR = new Float32Array(d);
  const lp = new Biquad('passe-bas', passeBas);
  const sortie = new Stereo(entree.n / SR);
  let i = 0;
  for (let n = 0; n < entree.n; n++) {
    const oL = bL[i];
    const oR = bR[i];
    bL[i] = lp.tick((entree.L[n] + entree.R[n]) * 0.5 + oR * retour);
    bR[i] = oL * retour;
    if (++i >= d) i = 0;
    sortie.L[n] = entree.L[n] + oL * melange;
    sortie.R[n] = entree.R[n] + oR * melange;
  }
  return sortie;
};

// Dent de scie sans repliement (polyBLEP)
const polyblep = (t, dt) => {
  if (t < dt) {
    t /= dt;
    return t + t - t * t - 1;
  }
  if (t > 1 - dt) {
    t = (t - 1) / dt;
    return t * t + t + t + 1;
  }
  return 0;
};

// Enveloppe ADSR (secondes) ; `duree` = temps de maintien de la note
const adsr = (t, a, d, s, r, duree) => {
  if (t < 0) return 0;
  let v;
  if (t < a) v = t / a;
  else if (t < a + d) v = 1 - (1 - s) * ((t - a) / d);
  else v = s;
  if (t > duree) {
    const tr = t - duree;
    const vFin = duree < a ? duree / a : duree < a + d ? 1 - (1 - s) * ((duree - a) / d) : s;
    v = tr >= r ? 0 : vFin * (1 - tr / r) ** 2;
  }
  return v;
};

// Normalisation de crête
const normaliser = (s, creteDb = -1) => {
  let m = 0;
  for (let i = 0; i < s.n; i++) m = Math.max(m, Math.abs(s.L[i]), Math.abs(s.R[i]));
  const g = m > 0 ? dbVersGain(creteDb) / m : 1;
  for (let i = 0; i < s.n; i++) {
    s.L[i] *= g;
    s.R[i] *= g;
  }
  return s;
};

// Fondu d'entrée et de sortie très courts (évite les clics)
const bords = (s, entree = 0.002, sortie = 0.01) => {
  const a = Math.round(entree * SR);
  const b = Math.round(sortie * SR);
  for (let i = 0; i < a && i < s.n; i++) {
    s.L[i] *= i / a;
    s.R[i] *= i / a;
  }
  for (let i = 0; i < b && i < s.n; i++) {
    const j = s.n - 1 - i;
    s.L[j] *= i / b;
    s.R[j] *= i / b;
  }
  return s;
};

// Écriture d'un fichier WAV 16 bits stéréo (avec léger dithering)
const ecrireWav = async (fichier, s) => {
  const alea = hasard(7);
  const donnees = Buffer.alloc(s.n * 4);
  for (let i = 0; i < s.n; i++) {
    for (let c = 0; c < 2; c++) {
      const x = (c === 0 ? s.L : s.R)[i];
      const d = (alea() - alea()) / 32768;
      const v = Math.max(-1, Math.min(1, x + d));
      donnees.writeInt16LE(Math.round(v * 32767), i * 4 + c * 2);
    }
  }
  const tete = Buffer.alloc(44);
  tete.write('RIFF', 0);
  tete.writeUInt32LE(36 + donnees.length, 4);
  tete.write('WAVE', 8);
  tete.write('fmt ', 12);
  tete.writeUInt32LE(16, 16);
  tete.writeUInt16LE(1, 20);
  tete.writeUInt16LE(2, 22);
  tete.writeUInt32LE(SR, 24);
  tete.writeUInt32LE(SR * 4, 28);
  tete.writeUInt16LE(4, 32);
  tete.writeUInt16LE(16, 34);
  tete.write('data', 36);
  tete.writeUInt32LE(donnees.length, 40);
  await writeFile(fichier, Buffer.concat([tete, donnees]));
};

// Panoramique à puissance constante (-1 gauche … 1 droite)
const pan = (p) => [Math.cos(((p + 1) * Math.PI) / 4), Math.sin(((p + 1) * Math.PI) / 4)];

/* ============================ Effets sonores ============================ */

const EFFETS = {
  // Impact grave : chute de fréquence dans l'infra-grave + souffle sourd + queue de réverbération
  'impact-grave': () => {
    const s = new Stereo(3);
    const alea = hasard(11);
    const lp = new Biquad('passe-bas', 180);
    let ph = 0;
    for (let i = 0; i < s.n; i++) {
      const t = i / SR;
      const f = 38 + 62 * Math.exp(-t / 0.09);
      ph += (TAU * f) / SR;
      const corps = Math.sin(ph) * Math.exp(-t / 0.9) * Math.min(1, t / 0.004);
      const choc = lp.tick(alea() * 2 - 1) * Math.exp(-t / 0.06) * 1.6;
      const v = Math.tanh((corps + choc) * 1.3);
      s.L[i] = v;
      s.R[i] = v;
    }
    const r = reverb(s, { taille: 0.9, amorti: 0.7, humide: 1, passeBas: 900 });
    return normaliser(bords(new Stereo(3).ajouter(s, 1).ajouter(r, 0.9)), -1);
  },

  // Souffle : bruit filtré dont la fréquence monte puis redescend, qui traverse de gauche à droite
  souffle: () => souffle({ duree: 1.3, montee: 0.5, fBas: 350, fHaut: 2400, graine: 21 }),
  'souffle-court': () => souffle({ duree: 0.55, montee: 0.18, fBas: 700, fHaut: 3200, graine: 22 }),

  // Montée : bruit et ton qui s'élèvent (avant une plongée ou un changement de scène)
  'souffle-montant': () => {
    const duree = 1.7;
    const s = new Stereo(duree + 1);
    const alea = hasard(23);
    const bp = new Biquad('passe-bande', 300, 1.4);
    let ph = 0;
    for (let i = 0; i < Math.round(duree * SR); i++) {
      const t = i / SR;
      const p = t / duree;
      const f = 250 * Math.pow(22, p ** 1.6);
      if (i % 32 === 0) bp.regler(f, 1.6);
      ph += (TAU * (180 + 520 * p * p)) / SR;
      const env = Math.pow(p, 2.2) * (p > 0.96 ? (1 - p) / 0.04 : 1);
      const v = bp.tick(alea() * 2 - 1) * 2.2 + Math.sin(ph) * 0.12 * p;
      const [gl, gr] = pan(-0.6 + 1.2 * p);
      s.L[i] = v * env * gl;
      s.R[i] = v * env * gr;
    }
    const r = reverb(s, { taille: 0.75, amorti: 0.5, humide: 1 });
    return normaliser(bords(new Stereo(duree + 1).ajouter(s).ajouter(r, 0.5)), -3);
  },

  // Clics d'interface
  clic: () => clic({ f: 1850, corps: 950, graine: 31, force: 1 }),
  'clic-doux': () => clic({ f: 1150, corps: 600, graine: 32, force: 0.6 }),

  // Frappe douce sur l'écran (trois variantes pour éviter la répétition)
  'frappe-1': () => frappe(41, 1),
  'frappe-2': () => frappe(42, 1.08),
  'frappe-3': () => frappe(43, 0.93),

  // Petit « tic » de compteur
  tic: () => {
    const s = new Stereo(0.08);
    const alea = hasard(51);
    const hp = new Biquad('passe-bande', 4800, 2.5);
    let ph = 0;
    for (let i = 0; i < s.n; i++) {
      const t = i / SR;
      ph += (TAU * 3100) / SR;
      const v = Math.sin(ph) * Math.exp(-t / 0.004) * 0.6 + hp.tick(alea() * 2 - 1) * Math.exp(-t / 0.003) * 1.5;
      s.L[i] = v;
      s.R[i] = v;
    }
    return normaliser(bords(s, 0.0005, 0.01), -3);
  },

  // Validation : deux notes cristallines (mi puis si)
  validation: () => carillon([88, 95], [0, 0.09], 0.7, 61),
  // Notification : trois notes rapides (ré, fa dièse, la)
  notification: () => carillon([86, 90, 93], [0, 0.065, 0.13], 0.45, 62),

  // Scintillement : grains aigus, dispersés dans l'espace
  scintillement: () => {
    const s = new Stereo(1.8);
    const alea = hasard(71);
    const notes = [86, 90, 93, 97, 98, 102, 105];
    for (let k = 0; k < 18; k++) {
      const debut = alea() * 0.75;
      const f = mtof(notes[Math.floor(alea() * notes.length)]);
      const [gl, gr] = pan(alea() * 1.6 - 0.8);
      const amp = 0.25 + alea() * 0.5;
      const d = Math.round(debut * SR);
      for (let i = 0; i < SR * 0.5 && d + i < s.n; i++) {
        const t = i / SR;
        const v = Math.sin(TAU * f * t) * Math.exp(-t / 0.12) * Math.min(1, t / 0.003) * amp;
        s.L[d + i] += v * gl;
        s.R[d + i] += v * gr;
      }
    }
    const r = reverb(s, { taille: 0.85, amorti: 0.2, humide: 1 });
    return normaliser(bords(new Stereo(1.8).ajouter(s, 0.6).ajouter(r, 1)), -4);
  },

  // Rouleau de peinture : souffle mat, texturé, qui avance
  rouleau: () => {
    const duree = 1.3;
    const s = new Stereo(duree + 0.4);
    const alea = hasard(81);
    const lp = new Biquad('passe-bas', 1600, 0.8);
    const bp = new Biquad('passe-bande', 400, 0.9);
    let marron = 0;
    for (let i = 0; i < Math.round(duree * SR); i++) {
      const t = i / SR;
      const p = t / duree;
      marron = marron * 0.985 + (alea() * 2 - 1) * 0.12;
      if (i % 64 === 0) bp.regler(300 + 900 * p, 0.9);
      const grain = 0.75 + 0.25 * Math.sin(TAU * 11 * t + Math.sin(TAU * 3.1 * t) * 2);
      const env = Math.min(1, t / 0.08) * Math.min(1, (duree - t) / 0.35);
      const v = (lp.tick(alea() * 2 - 1) * 0.5 + bp.tick(marron) * 2.5) * grain * env;
      const [gl, gr] = pan(-0.7 + 1.4 * p);
      s.L[i] = v * gl;
      s.R[i] = v * gr;
    }
    return normaliser(bords(s), -4);
  },
};

function souffle({ duree, montee, fBas, fHaut, graine }) {
  const s = new Stereo(duree + 0.3);
  const alea = hasard(graine);
  const bp = new Biquad('passe-bande', fBas, 1.1);
  const lp = new Biquad('passe-bas', 260);
  for (let i = 0; i < Math.round(duree * SR); i++) {
    const t = i / SR;
    const env = t < montee ? Math.sin(((t / montee) * Math.PI) / 2) ** 2 : Math.exp(-((t - montee) / (duree - montee)) * 4);
    const f = t < montee ? fBas + (fHaut - fBas) * (t / montee) : fHaut - (fHaut - fBas) * 0.7 * ((t - montee) / (duree - montee));
    if (i % 32 === 0) bp.regler(f, 1.1);
    const n = alea() * 2 - 1;
    const v = (bp.tick(n) * 2 + lp.tick(n) * 0.7) * env;
    const [gl, gr] = pan(-0.8 + 1.6 * (t / duree));
    s.L[i] = v * gl;
    s.R[i] = v * gr;
  }
  return normaliser(bords(s), -3);
}

function clic({ f, corps, graine, force }) {
  const s = new Stereo(0.12);
  const alea = hasard(graine);
  const hp = new Biquad('passe-haut', 3000);
  let p1 = 0;
  let p2 = 0;
  for (let i = 0; i < s.n; i++) {
    const t = i / SR;
    p1 += (TAU * f) / SR;
    p2 += (TAU * corps) / SR;
    const v = Math.sin(p1) * Math.exp(-t / 0.006) * 0.7 + Math.sin(p2) * Math.exp(-t / 0.012) * 0.5 + hp.tick(alea() * 2 - 1) * Math.exp(-t / 0.0015) * 0.8;
    s.L[i] = v * force;
    s.R[i] = v * force;
  }
  return normaliser(bords(s, 0.0003, 0.02), force === 1 ? -3 : -8);
}

function frappe(graine, hauteur) {
  const s = new Stereo(0.09);
  const alea = hasard(graine);
  const bp = new Biquad('passe-bande', 2400 * hauteur, 1.3);
  let ph = 0;
  for (let i = 0; i < s.n; i++) {
    const t = i / SR;
    ph += (TAU * 190 * hauteur) / SR;
    const v = bp.tick(alea() * 2 - 1) * Math.exp(-t / 0.01) * 1.4 + Math.sin(ph) * Math.exp(-t / 0.015) * 0.35;
    s.L[i] = v;
    s.R[i] = v;
  }
  return normaliser(bords(s, 0.0003, 0.02), -6);
}

function carillon(notes, decalages, duree, graine) {
  const s = new Stereo(duree + 1.2);
  notes.forEach((m, k) => {
    const f = mtof(m);
    const d = Math.round(decalages[k] * SR);
    const [gl, gr] = pan(-0.3 + (0.6 * k) / Math.max(1, notes.length - 1));
    for (let i = 0; i + d < s.n && i < SR * duree; i++) {
      const t = i / SR;
      const env = Math.min(1, t / 0.004) * Math.exp(-t / (duree * 0.45));
      const v = (Math.sin(TAU * f * t) + 0.25 * Math.sin(TAU * f * 2.01 * t) * Math.exp(-t / 0.08) + 0.08 * Math.sin(TAU * f * 3.98 * t) * Math.exp(-t / 0.04)) * env;
      s.L[d + i] += v * gl;
      s.R[d + i] += v * gr;
    }
  });
  const r = reverb(s, { taille: 0.6, amorti: 0.35, humide: 1 });
  return normaliser(bords(new Stereo(duree + 1.2).ajouter(s).ajouter(r, 0.35)), -4);
}

/* ================================ Musique ================================ */
/* Électronique minimale et lumineuse, 120 battements par minute, en ré majeur.
   Chaque scène a son énergie ; les accords changent au début de chaque scène. */

const BPM = 120;
const TEMPS = 60 / BPM; // 0,5 s

const ACCORDS = {
  D: { basse: 38, notes: [50, 57, 61, 64, 66] }, // ré maj9
  Bm: { basse: 35, notes: [47, 54, 57, 62, 64] }, // si m11
  G: { basse: 31, notes: [43, 50, 57, 59, 66] }, // sol maj9
  A: { basse: 33, notes: [45, 52, 59, 61, 64] }, // la add9
  Em: { basse: 40, notes: [52, 55, 59, 62, 66] }, // mi m9
};

// Énergie et suite d'accords de chaque scène (0 = absent, 1 = plein)
const SECTIONS = {
  logo: { energie: 0.42, accords: ['D'], nappe: 0.55, sub: 0.5, arpege: 0, basse: 0, kick: 0, claque: 0, charley: 0, montee: 'fin' },
  signature: { energie: 0.58, accords: ['Bm', 'G'], nappe: 0.75, sub: 0.35, arpege: 0.45, filtreArp: 0.35, basse: 0, kick: 0, claque: 0, charley: 0 },
  ordinateur: { energie: 0.72, accords: ['D', 'A', 'Bm', 'G'], nappe: 0.65, sub: 0.2, arpege: 0.6, filtreArp: 0.45, basse: 0.55, kick: 0, claque: 0, charley: 0.35, montee: [4.1, 6.35], ouvreFiltre: [4.1, 6.35] },
  services: { energie: 1, accords: ['D', 'Bm', 'G', 'A'], nappe: 0.55, arpege: 0.85, filtreArp: 0.85, basse: 0.9, kick: 1, claque: 0.7, charley: 0.75, doubles: true },
  nuancier: { energie: 0.62, accords: ['G', 'A', 'Bm'], nappe: 0.85, sub: 0.3, arpege: 0.5, filtreArp: 0.4, basse: 0.25, kick: 0, claque: 0, charley: 0.25, montee: 'fin' },
  rappel: { energie: 0.86, accords: ['Bm', 'G', 'A'], nappe: 0.5, arpege: 0.35, filtreArp: 0.55, basse: 0.8, kick: 0.85, demiTemps: true, claque: 0.4, charley: 0.65, doubles: true },
  telephone: { energie: 1, accords: ['D', 'Bm', 'G', 'A'], nappe: 0.55, arpege: 0.8, filtreArp: 0.75, basse: 0.9, kick: 1, claque: 0.65, charley: 0.7, doubles: true, montee: 'fin' },
  zone: { energie: 0.7, accords: ['G', 'A'], nappe: 0.95, sub: 0.45, arpege: 0.55, filtreArp: 0.6, basse: 0.3, kick: 0, claque: 0, charley: 0.2 },
  fin: { energie: 0.8, accords: ['D'], nappe: 0.9, sub: 0.6, arpege: 0.2, filtreArp: 0.3, basse: 0.6, kick: 0, claque: 0, charley: 0, final: true },
};

const composer = (film) => {
  // Chronologie en secondes, alignée sur les images (60 i/s)
  let debut = 0;
  const scenes = film.scenes.map((s) => {
    const d = Math.round(s.duree * 60) / 60;
    const item = { id: s.id, debut, fin: debut + d, duree: d };
    debut += d;
    return item;
  });
  const total = debut;
  const alea = hasard(2026);

  // Plan des accords : une case d'environ deux secondes, calée sur les temps
  const plan = [];
  for (const sc of scenes) {
    const sec = SECTIONS[sc.id];
    const n = Math.max(1, Math.round(sc.duree / 2));
    const pas = Math.max(TEMPS, Math.round(sc.duree / n / TEMPS) * TEMPS);
    for (let k = 0; k < n; k++) {
      const a = sc.debut + k * pas;
      const b = k === n - 1 ? sc.fin : sc.debut + (k + 1) * pas;
      plan.push({ debut: a, fin: b, accord: ACCORDS[sec.accords[k % sec.accords.length]], scene: sc, sec });
    }
  }
  const sectionA = (t) => scenes.find((s) => t >= s.debut && t < s.fin) ?? scenes.at(-1);

  const bus = {
    nappe: new Stereo(total + 3),
    arpege: new Stereo(total + 3),
    basse: new Stereo(total + 3),
    batterie: new Stereo(total + 3),
    ciel: new Stereo(total + 3),
  };
  const declencheurs = []; // instants des grosses caisses (pour le « pompage » de la nappe)

  // ---- Nappe : dents de scie désaccordées, filtre qui respire, attaque lente ----
  for (const c of plan) {
    const niveau = c.sec.nappe;
    if (!niveau) continue;
    const longueur = c.fin - c.debut;
    const final = c.sec.final;
    const attaque = c.scene.id === 'logo' ? 2.2 : 0.35;
    const relache = final ? 2.5 : 0.9;
    c.accord.notes.forEach((m, v) => {
      const [gl, gr] = pan(((v % 2 ? 1 : -1) * (0.25 + v * 0.12)));
      const desaccords = [-0.11, -0.04, 0.05, 0.12];
      const phases = desaccords.map(() => alea());
      const lp = new Biquad('passe-bas', 1200, 0.6);
      const d0 = Math.round(c.debut * SR);
      const nb = Math.round((longueur + relache) * SR);
      for (let i = 0; i < nb; i++) {
        const t = i / SR;
        const tAbs = c.debut + t;
        if (i % 64 === 0) lp.regler(650 + 850 * niveau + 350 * Math.sin(TAU * 0.11 * tAbs + v));
        let x = 0;
        desaccords.forEach((dc, k) => {
          const f = mtof(m + dc);
          const dt = f / SR;
          phases[k] += dt;
          if (phases[k] >= 1) phases[k] -= 1;
          x += 2 * phases[k] - 1 - polyblep(phases[k], dt);
        });
        const env = adsr(t, attaque, 0.8, 0.85, relache, longueur);
        const y = lp.tick(x * 0.12) * env * niveau;
        if (d0 + i < bus.nappe.n) {
          bus.nappe.L[d0 + i] += y * gl;
          bus.nappe.R[d0 + i] += y * gr;
        }
      }
    });
  }

  // ---- Arpège : notes pincées, brillantes, en doubles-croches ou croches ----
  for (const c of plan) {
    const niveau = c.sec.arpege;
    if (!niveau) continue;
    const pas = c.sec.doubles ? TEMPS / 4 : TEMPS / 2;
    const motif = [0, 2, 4, 1, 3, 2, 4, 1];
    const hautes = c.accord.notes.map((m) => m + 24).filter((m) => m <= 93).concat(c.accord.notes.slice(0, 2).map((m) => m + 36));
    let k = Math.round((c.debut % (pas * 8)) / pas);
    for (let t0 = c.debut; t0 < c.fin - 0.01; t0 += pas, k++) {
      const m = hautes[motif[k % motif.length] % hautes.length];
      const f = mtof(m);
      // Ouverture du filtre pendant la plongée de la scène 3
      let ouverture = c.sec.filtreArp ?? 0.6;
      if (c.sec.ouvreFiltre) {
        const [a, b] = c.sec.ouvreFiltre;
        const local = t0 - c.scene.debut;
        ouverture = Math.min(1, ouverture + Math.max(0, Math.min(1, (local - a) / (b - a))) * 0.55);
      }
      const accent = k % 4 === 0 ? 1 : 0.72;
      const [gl, gr] = pan(Math.sin(k * 0.9) * 0.45);
      const lp = new Biquad('passe-bas', 3000, 1.1);
      let ph = alea();
      const d0 = Math.round(t0 * SR);
      const nb = Math.round(0.4 * SR);
      for (let i = 0; i < nb; i++) {
        const t = i / SR;
        if (i % 16 === 0) lp.regler(600 + 5200 * ouverture * Math.exp(-t / 0.07), 1.2);
        const dt = f / SR;
        ph += dt;
        if (ph >= 1) ph -= 1;
        const saw = 2 * ph - 1 - polyblep(ph, dt);
        const tri = 1 - 4 * Math.abs(ph - 0.5);
        const env = Math.min(1, t / 0.002) * Math.exp(-t / 0.13);
        const y = lp.tick(saw * 0.5 + tri * 0.6) * env * niveau * accent * 0.22;
        if (d0 + i < bus.arpege.n) {
          bus.arpege.L[d0 + i] += y * gl;
          bus.arpege.R[d0 + i] += y * gr;
        }
      }
    }
  }

  // ---- Basse : pulsation en croches, ronde et douce ; sous-basse tenue ----
  for (const c of plan) {
    const nd = Math.round((c.fin - c.debut) * SR);
    if (c.sec.basse) {
      for (let t0 = c.debut, k = 0; t0 < c.fin - 0.01; t0 += TEMPS / 2, k++) {
        if (c.sec.final && k > 0) break;
        const f = mtof(c.accord.basse + 12);
        const lp = new Biquad('passe-bas', 420, 0.9);
        let ph = 0;
        const d0 = Math.round(t0 * SR);
        const long = c.sec.final ? 3.2 : TEMPS / 2 - 0.02;
        const nb = Math.round((long + 0.1) * SR);
        const acc = k % 2 === 0 ? 1 : 0.8;
        for (let i = 0; i < nb; i++) {
          const t = i / SR;
          ph += f / SR;
          if (ph >= 1) ph -= 1;
          const x = Math.sin(TAU * ph) + 0.35 * (2 * ph - 1);
          const env = adsr(t, 0.004, 0.12, 0.6, 0.06, long);
          const y = Math.tanh(lp.tick(x) * 1.4) * env * c.sec.basse * acc * 0.32;
          if (d0 + i < bus.basse.n) {
            bus.basse.L[d0 + i] += y;
            bus.basse.R[d0 + i] += y;
          }
        }
      }
    }
    if (c.sec.sub) {
      const f = mtof(c.accord.basse);
      const d0 = Math.round(c.debut * SR);
      const long = c.fin - c.debut;
      let ph = 0;
      for (let i = 0; i < nd + SR; i++) {
        const t = i / SR;
        ph += f / SR;
        const y = Math.sin(TAU * ph) * adsr(t, 0.6, 0.5, 0.8, 0.9, long) * c.sec.sub * 0.28;
        if (d0 + i < bus.basse.n) {
          bus.basse.L[d0 + i] += y;
          bus.basse.R[d0 + i] += y;
        }
      }
    }
  }

  // ---- Batterie : grosse caisse ronde, claquement de doigts, charleston ----
  const kick = (t0, force) => {
    declencheurs.push(t0);
    const d0 = Math.round(t0 * SR);
    let ph = 0;
    for (let i = 0; i < SR * 0.45; i++) {
      const t = i / SR;
      ph += (TAU * (46 + 80 * Math.exp(-t / 0.035))) / SR;
      const y = Math.tanh(Math.sin(ph) * Math.exp(-t / 0.2) * 1.5) * force * 0.55;
      if (d0 + i < bus.batterie.n) {
        bus.batterie.L[d0 + i] += y;
        bus.batterie.R[d0 + i] += y;
      }
    }
  };
  const claque = (t0, force) => {
    const a = hasard(Math.round(t0 * 1000));
    const bp = new Biquad('passe-bande', 1700, 1.4);
    const d0 = Math.round(t0 * SR);
    for (let i = 0; i < SR * 0.3; i++) {
      const t = i / SR;
      const rafales = t < 0.03 ? Math.exp(-((t % 0.01) / 0.003)) : Math.exp(-(t - 0.02) / 0.09);
      const y = bp.tick(a() * 2 - 1) * rafales * force * 0.5;
      if (d0 + i < bus.batterie.n) {
        bus.batterie.L[d0 + i] += y * 0.9;
        bus.batterie.R[d0 + i] += y;
      }
    }
  };
  const charley = (t0, force, ouvert) => {
    const a = hasard(Math.round(t0 * 997));
    const hp = new Biquad('passe-haut', 7500, 0.8);
    const d0 = Math.round(t0 * SR);
    const dec = ouvert ? 0.12 : 0.028;
    const [gl, gr] = pan(0.35);
    for (let i = 0; i < SR * (dec * 5); i++) {
      const t = i / SR;
      const y = hp.tick(a() * 2 - 1) * Math.exp(-t / dec) * force * 0.16;
      if (d0 + i < bus.batterie.n) {
        bus.batterie.L[d0 + i] += y * gl;
        bus.batterie.R[d0 + i] += y * gr;
      }
    }
  };
  for (const sc of scenes) {
    const sec = SECTIONS[sc.id];
    for (let t0 = sc.debut, k = 0; t0 < sc.fin - 0.01; t0 += TEMPS / 2, k++) {
      const surTemps = k % 2 === 0;
      const numTemps = Math.floor(k / 2);
      if (sec.kick && surTemps && (!sec.demiTemps || numTemps % 2 === 0)) kick(t0, sec.kick);
      if (sec.claque && surTemps && numTemps % 2 === 1) claque(t0, sec.claque);
      if (sec.charley) {
        if (!surTemps) charley(t0, sec.charley, k % 8 === 7);
        if (sec.doubles) charley(t0 + TEMPS / 4, sec.charley * 0.45, false);
      }
    }
  }

  // ---- Ciel : scintillements aigus sur l'ouverture, les passages calmes et la fin ----
  for (const sc of scenes) {
    if (!['logo', 'zone', 'fin', 'nuancier'].includes(sc.id)) continue;
    const accord = plan.find((c) => c.scene === sc).accord;
    const n = Math.round(sc.duree * 2.2);
    for (let k = 0; k < n; k++) {
      const t0 = sc.debut + (sc.id === 'logo' ? 2.4 : 0.3) + alea() * (sc.duree - (sc.id === 'logo' ? 2.4 : 0.6));
      const m = accord.notes[Math.floor(alea() * accord.notes.length)] + 36;
      const f = mtof(Math.min(m, 100));
      const [gl, gr] = pan(alea() * 1.6 - 0.8);
      const d0 = Math.round(t0 * SR);
      for (let i = 0; i < SR * 0.8; i++) {
        const t = i / SR;
        const y = Math.sin(TAU * f * t) * Math.exp(-t / 0.25) * Math.min(1, t / 0.005) * 0.05;
        if (d0 + i < bus.ciel.n) {
          bus.ciel.L[d0 + i] += y * gl;
          bus.ciel.R[d0 + i] += y * gr;
        }
      }
    }
  }

  // ---- Montées de bruit avant les changements d'énergie ----
  const montee = (a, b, force) => {
    const al = hasard(Math.round(a * 100));
    const bp = new Biquad('passe-bande', 400, 1.2);
    const d0 = Math.round(a * SR);
    const nb = Math.round((b - a) * SR);
    for (let i = 0; i < nb; i++) {
      const p = i / nb;
      if (i % 32 === 0) bp.regler(300 * Math.pow(25, p), 1.3);
      const y = bp.tick(al() * 2 - 1) * Math.pow(p, 2) * force * 0.35;
      const [gl, gr] = pan(-0.5 + p);
      if (d0 + i < bus.ciel.n) {
        bus.ciel.L[d0 + i] += y * gl;
        bus.ciel.R[d0 + i] += y * gr;
      }
    }
  };
  for (const sc of scenes) {
    const sec = SECTIONS[sc.id];
    if (sec.montee === 'fin') montee(Math.max(sc.debut, sc.fin - 1.5), sc.fin, 1);
    else if (Array.isArray(sec.montee)) montee(sc.debut + sec.montee[0], sc.debut + sec.montee[1], 1.2);
  }

  // ---- Mixage ----
  // La nappe et l'arpège « respirent » sous la grosse caisse (compression déclenchée)
  const pompe = new Float32Array(bus.nappe.n).fill(1);
  for (const t0 of declencheurs) {
    const d0 = Math.round(t0 * SR);
    for (let i = 0; i < SR * 0.35; i++) {
      const t = i / SR;
      const g = 1 - 0.55 * Math.exp(-t / 0.09);
      if (d0 + i < pompe.length) pompe[d0 + i] = Math.min(pompe[d0 + i], g);
    }
  }
  for (const nom of ['nappe', 'arpege', 'basse']) {
    const b = bus[nom];
    const force = nom === 'basse' ? 1 : 0.8;
    for (let i = 0; i < b.n; i++) {
      const g = 1 - (1 - pompe[i]) * force;
      b.L[i] *= g;
      b.R[i] *= g;
    }
  }
  const arpegeEcho = echo(bus.arpege, { temps: TEMPS * 0.75, retour: 0.38, melange: 0.35, passeBas: 3500 });
  const envoiReverb = new Stereo(total + 3).ajouter(bus.nappe, 0.6).ajouter(arpegeEcho, 0.45).ajouter(bus.ciel, 0.9).ajouter(bus.batterie, 0.12);
  const salle = reverb(envoiReverb, { taille: 0.88, amorti: 0.45, largeur: 1, humide: 1, passeBas: 6500 });

  const mix = new Stereo(total + 3)
    .ajouter(bus.nappe, 0.78)
    .ajouter(arpegeEcho, 0.95)
    .ajouter(bus.basse, 1)
    .ajouter(bus.batterie, 0.9)
    .ajouter(bus.ciel, 0.8)
    .ajouter(salle, 0.75);

  // Courbe d'énergie : l'intro monte doucement, les scènes rythmées sont les plus fortes
  // (transitions lissées sur environ 0,4 s), puis coupe-bas très grave
  const hpL = new Biquad('passe-haut', 28);
  const hpR = new Biquad('passe-haut', 28);
  const lissage = Math.exp(-1 / (0.4 * SR));
  let energie = SECTIONS[scenes[0].id].energie;
  for (let i = 0; i < mix.n; i++) {
    const cible = SECTIONS[sectionA(i / SR).id].energie;
    energie = cible + (energie - cible) * lissage;
    mix.L[i] = hpL.tick(mix.L[i]) * energie;
    mix.R[i] = hpR.tick(mix.R[i]) * energie;
  }
  limiteur(mix, -1.5);

  // Fin : la musique s'éteint avec le fondu au noir
  const n = Math.round(total * SR);
  const fondu = Math.round(1.6 * SR);
  const sortie = new Stereo(total);
  for (let i = 0; i < n; i++) {
    const g = i > n - fondu ? ((n - i) / fondu) ** 1.5 : 1;
    const e = Math.min(1, i / (0.05 * SR));
    sortie.L[i] = mix.L[i] * g * e;
    sortie.R[i] = mix.R[i] * g * e;
  }
  return normaliser(sortie, -1);
};

// Limiteur à anticipation (évite toute saturation)
function limiteur(s, plafondDb) {
  const plafond = dbVersGain(plafondDb);
  const avance = Math.round(0.005 * SR);
  const relache = Math.exp(-1 / (0.12 * SR));
  let g = 1;
  // pré-normalisation autour du niveau cible
  let crete = 0;
  for (let i = 0; i < s.n; i++) crete = Math.max(crete, Math.abs(s.L[i]), Math.abs(s.R[i]));
  const pre = crete > 0 ? (plafond * 1.12) / crete : 1;
  const L = s.L.map((x) => x * pre);
  const R = s.R.map((x) => x * pre);
  for (let i = 0; i < s.n; i++) {
    const j = Math.min(s.n - 1, i + avance);
    const a = Math.max(Math.abs(L[j]), Math.abs(R[j]));
    const cible = a > plafond ? plafond / a : 1;
    g = cible < g ? cible : cible + (g - cible) * relache;
    s.L[i] = L[i] * g;
    s.R[i] = R[i] * g;
  }
}

/* ================================ Écriture ================================ */

const dossierEffets = path.join(RACINE, 'public/audio/effets');
await mkdir(dossierEffets, { recursive: true });
for (const [nom, fabriquer] of Object.entries(EFFETS)) {
  await ecrireWav(path.join(dossierEffets, `${nom}.wav`), fabriquer());
  process.stdout.write(`effet ${nom}\n`);
}
for (const [format, film] of [['16x9', FILM_16_9], ['9x16', FILM_9_16]]) {
  const debut = Date.now();
  const musique = composer(film);
  await ecrireWav(path.join(RACINE, `public/audio/musique-${format}.wav`), musique);
  process.stdout.write(`musique ${format} : ${(musique.n / SR).toFixed(2)} s (${((Date.now() - debut) / 1000).toFixed(1)} s de calcul)\n`);
}
