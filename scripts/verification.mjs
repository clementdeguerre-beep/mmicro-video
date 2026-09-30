/*
 * Vérifications automatiques d'un rendu :
 *   - fluidité : cadence, nombre d'images, écart entre images successives
 *     (un saut brutal hors d'un changement de scène serait signalé) ;
 *   - synchronisation : les attaques des effets sonores tombent-elles
 *     sur les repères visuels prévus ?
 *
 *   node --experimental-strip-types scripts/verification.mjs <video.mp4|.mkv> <16x9|9x16> [effets.wav]
 */
import { spawnSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const [video, format, fichierEffets] = process.argv.slice(2);
const { FILM_16_9, FILM_9_16, IPS } = await import(path.join(RACINE, 'src/config.ts'));
const film = format === '9x16' ? FILM_9_16 : FILM_16_9;

const ffmpeg = (params, binaire = false) => {
  const r = spawnSync('npx', ['remotion', 'ffmpeg', '-hide_banner', '-nostats', ...params], {
    cwd: RACINE,
    encoding: binaire ? 'buffer' : 'utf8',
    maxBuffer: 1024 * 1024 * 1024,
  });
  return r;
};

// ---- Chronologie attendue ----
let t = 0;
const scenes = film.scenes.map((s) => {
  const d = Math.round(s.duree * IPS) / IPS;
  const x = { id: s.id, debut: t, fin: t + d };
  t += d;
  return x;
});
const dureeAttendue = t;

// ---- Fluidité ----
const info = ffmpeg(['-i', video]).stderr;
const ips = Number(/, ([\d.]+) fps/.exec(info)?.[1]);
const L = format === '9x16' ? 54 : 96;
const H = format === '9x16' ? 96 : 54;
const brut = ffmpeg(['-i', video, '-map', '0:v', '-vf', `scale=${L}:${H}`, '-pix_fmt', 'gray', '-f', 'rawvideo', 'pipe:1'], true).stdout;
const taille = L * H;
const nb = Math.floor(brut.length / taille);
const ecarts = [];
const luminance = [];
for (let i = 0; i < nb; i++) {
  let s = 0;
  let d = 0;
  for (let k = 0; k < taille; k++) {
    const v = brut[i * taille + k];
    s += v;
    if (i > 0) d += Math.abs(v - brut[(i - 1) * taille + k]);
  }
  luminance.push(s / taille);
  if (i > 0) ecarts.push({ image: i, t: i / ips, ecart: d / taille });
}
const tries = [...ecarts].sort((a, b) => b.ecart - a.ecart);
const mediane = tries[Math.floor(tries.length / 2)].ecart;
const pres = (x) => scenes.some((s) => Math.abs(x - s.debut) < 0.6 || Math.abs(x - s.fin) < 0.6);
const sauts = tries.filter((e) => e.ecart > Math.max(12, mediane * 8));
const sautsHorsCoupe = sauts.filter((e) => !pres(e.t));
// Images figées : plus d'une demi-seconde sans aucun changement mesurable
let fige = 0;
let maxFige = 0;
for (const e of ecarts) {
  fige = e.ecart < 0.02 ? fige + 1 : 0;
  maxFige = Math.max(maxFige, fige);
}

console.log(`Fichier : ${path.relative(RACINE, video)}`);
console.log(`Cadence : ${ips} i/s · ${nb} images · ${(nb / ips).toFixed(2)} s (attendu ${dureeAttendue.toFixed(2)} s)`);
console.log(`Écart moyen entre images (médiane) : ${mediane.toFixed(2)} / 255`);
console.log(`Plus grands écarts : ${tries.slice(0, 6).map((e) => `${e.t.toFixed(2)} s (${e.ecart.toFixed(1)})`).join(', ')}`);
console.log(`Sauts brutaux hors changement de scène : ${sautsHorsCoupe.length === 0 ? 'aucun' : sautsHorsCoupe.map((e) => e.t.toFixed(2) + ' s').join(', ')}`);
console.log(`Plus longue suite d'images identiques : ${maxFige} image(s)`);

// ---- Synchronisation du son ----
if (fichierEffets) {
  const buf = await readFile(fichierEffets);
  const sr = buf.readUInt32LE(24);
  const ch = buf.readUInt16LE(22);
  const d0 = buf.indexOf('data') + 8;
  const n = (buf.length - d0) / (2 * ch);
  const fenetre = Math.round(sr * 0.005);
  const env = [];
  for (let i = 0; i + fenetre <= n; i += fenetre) {
    let e = 0;
    for (let j = i; j < i + fenetre; j++) {
      const v = buf.readInt16LE(d0 + j * ch * 2) / 32768;
      e += v * v;
    }
    env.push(10 * Math.log10(e / fenetre + 1e-10));
  }
  // Attaque : l'énergie monte d'au moins 12 dB par rapport aux 40 ms précédentes
  const attaques = [];
  for (let k = 8; k < env.length; k++) {
    const avant = Math.max(...env.slice(k - 8, k));
    if (env[k] - avant > 12 && env[k] > -45) {
      attaques.push((k * fenetre) / sr);
      k += 10;
    }
  }
  const sc = Object.fromEntries(scenes.map((s) => [s.id, s.debut]));
  const k1 = Math.min(1, (scenes.find((s) => s.id === 'logo').fin - sc.logo) / 5);
  // Repères visuels prévus dans le code des scènes (secondes depuis le début du film)
  const reperes = [['Impact : l’hexagone du logo se remplit', sc.logo + 2.35 * k1]];
  if (sc.ordinateur !== undefined) reperes.push(['Clic : l’écran de l’ordinateur s’allume', sc.ordinateur + 1.15]);
  if (sc.telephone !== undefined) {
    const v = format === '9x16' ? 1.3 : 1.1;
    const d = format === '9x16' ? 0.7 : 0.95;
    reperes.push(['Clic : toucher sur « Envoyer ma demande »', sc.telephone + d + 3.62 / v]);
    reperes.push(['Son de validation : « Demande envoyée. »', sc.telephone + d + 4.05 / v + 0.2]);
  }
  if (sc.fin !== undefined) reperes.push(['Impact : logo de fin', sc.fin + 0.05]);
  console.log('\nSynchronisation (attaque sonore mesurée / repère visuel prévu) :');
  for (const [nom, prevu] of reperes) {
    const proche = attaques.reduce((m, a) => (Math.abs(a - prevu) < Math.abs(m - prevu) ? a : m), Infinity);
    const ecartMs = Math.round((proche - prevu) * 1000);
    const images = (ecartMs / 1000) * ips;
    console.log(`  ${nom} : ${prevu.toFixed(3)} s → ${proche.toFixed(3)} s (écart ${ecartMs} ms, ${images.toFixed(1)} image)`);
  }
  // Repère visuel mesuré : la luminosité monte quand l'hexagone du logo se remplit
  const iDebut = Math.round((sc.logo + 2.2 * k1) * ips);
  let maxSaut = 0;
  let iSaut = iDebut;
  for (let i = iDebut; i < iDebut + Math.round(0.5 * ips); i++) {
    const s = luminance[i + 1] - luminance[i];
    if (s > maxSaut) {
      maxSaut = s;
      iSaut = i + 1;
    }
  }
  console.log(`  Image où l'hexagone s'illumine le plus vite : ${(iSaut / ips).toFixed(3)} s`);
}
