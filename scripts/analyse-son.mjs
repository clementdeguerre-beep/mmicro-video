/*
 * Outil de vérification : dessine l'énergie d'un fichier WAV par bandes de fréquence
 * (grave → aigu) au fil du temps, avec les débuts de scène.
 *   node --experimental-strip-types scripts/analyse-son.mjs <fichier.wav> <16x9|9x16> <sortie.png>
 */
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const [fichier, format, sortie] = process.argv.slice(2);
const { FILM_16_9, FILM_9_16 } = await import(path.join(RACINE, 'src/config.ts'));
const film = format === '9x16' ? FILM_9_16 : FILM_16_9;

const buf = await readFile(fichier);
const sr = buf.readUInt32LE(24);
const canaux = buf.readUInt16LE(22);
const debutDonnees = buf.indexOf('data') + 8;
const n = (buf.length - debutDonnees) / (2 * canaux);
const mono = new Float32Array(n);
for (let i = 0; i < n; i++) {
  let s = 0;
  for (let c = 0; c < canaux; c++) s += buf.readInt16LE(debutDonnees + (i * canaux + c) * 2) / 32768;
  mono[i] = s / canaux;
}
// Bandes par filtres passe-bande simples (biquad RBJ)
const bandes = [[20, 90], [90, 300], [300, 1200], [1200, 4500], [4500, 16000]];
const pasT = Math.round(sr * 0.02);
const colonnes = Math.floor(n / pasT);
const energies = bandes.map(([a, b]) => {
  const f0 = Math.sqrt(a * b);
  const q = f0 / (b - a);
  const w0 = (2 * Math.PI * f0) / sr;
  const alpha = Math.sin(w0) / (2 * q);
  const a0 = 1 + alpha;
  const [b0, b2, a1, a2] = [alpha / a0, -alpha / a0, (-2 * Math.cos(w0)) / a0, (1 - alpha) / a0];
  let z1 = 0, z2 = 0;
  const e = new Float32Array(colonnes);
  for (let i = 0; i < colonnes * pasT; i++) {
    const x = mono[i];
    const y = b0 * x + z1;
    z1 = -a1 * y + z2;
    z2 = b2 * x - a2 * y;
    e[Math.floor(i / pasT)] += y * y;
  }
  return Array.from(e, (v) => 10 * Math.log10(v / pasT + 1e-12));
});
const global = Array.from({ length: colonnes }, (_, k) => {
  let s = 0;
  for (let i = k * pasT; i < (k + 1) * pasT; i++) s += mono[i] * mono[i];
  return 10 * Math.log10(s / pasT + 1e-12);
});
let t = 0;
const scenes = film.scenes.map((s) => { const x = { id: s.id, debut: t }; t += s.duree; return x; });

const html = `<canvas id=c width=${colonnes} height=420></canvas><script>
const E=${JSON.stringify(energies.map((b) => b.map((v) => Math.round(v))))}, G=${JSON.stringify(global.map((v) => Math.round(v)))}, S=${JSON.stringify(scenes)}, pas=${pasT / sr};
const c=document.getElementById('c').getContext('2d'); c.fillStyle='#111'; c.fillRect(0,0,${colonnes},420);
E.forEach((b,k)=>{ b.forEach((v,x)=>{ const a=Math.max(0,Math.min(1,(v+60)/50)); c.fillStyle='hsl('+(160-a*120)+',80%,'+(a*55)+'%)'; c.fillRect(x,300-(k+1)*56,1,54); }); });
c.strokeStyle='#fff'; c.beginPath(); G.forEach((v,x)=>{ const y=410-Math.max(0,(v+60))*1.6; x?c.lineTo(x,y):c.moveTo(x,y); }); c.stroke();
c.fillStyle='#fff'; c.font='12px sans-serif'; S.forEach(s=>{ const x=s.debut/pas; c.fillRect(x,0,1,420); c.fillText(s.id,x+3,12); });
['<90','90-300','300-1k2','1k2-4k5','>4k5'].forEach((l,k)=>c.fillText(l,${colonnes}-60,300-(k+1)*56+30));
</script>`;
const tmp = path.join(path.dirname(sortie), '_analyse.html');
await writeFile(tmp, html);
const nav = await chromium.launch();
const p = await nav.newPage({ viewport: { width: colonnes, height: 420 } });
await p.goto('file://' + tmp);
await p.screenshot({ path: sortie });
await nav.close();
console.log(sortie);
