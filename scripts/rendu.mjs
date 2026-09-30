/*
 * Rendu final des deux formats, avec et sans musique, et des posters.
 *
 *   npm run rendu                 # les deux formats
 *   npm run rendu -- 16x9         # un seul format
 *   npm run rendu -- 9x16 --brouillon   # aperçu rapide en demi-résolution
 *
 * Étapes, pour chaque format :
 *   1. Remotion calcule toutes les images et les effets sonores (vidéo H.264, 60 i/s) ;
 *   2. la musique est mélangée aux effets (ffmpeg) ;
 *   3. le volume est réglé pour les réseaux sociaux (-14 LUFS, crêtes sous -1 dB) ;
 *   4. deux fichiers MP4 sont écrits : avec musique et sans musique ;
 *   5. l'image d'aperçu (poster) est calculée.
 * Les fichiers finaux sont dans le dossier livrables/.
 */
import { bundle } from '@remotion/bundler';
import { renderMedia, renderStill, selectComposition } from '@remotion/renderer';
import { spawnSync } from 'node:child_process';
import { crete, ecrireWav, gainEtLimiteur, lireWav, lufs, masteriser } from './lib/audio.mjs';
import { existsSync } from 'node:fs';
import { mkdir, rm, stat, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { SON } = await import(path.join(RACINE, 'src/config.ts'));

const args = process.argv.slice(2);
const brouillon = args.includes('--brouillon');
const reprendre = args.includes('--reprendre'); // réutilise la vidéo maître déjà calculée
const formats = args.filter((a) => a === '16x9' || a === '9x16');
if (formats.length === 0) formats.push('16x9', '9x16');

const LIVRABLES = path.join(RACINE, brouillon ? 'out/brouillon' : 'livrables');
const TMP = path.join(RACINE, 'out/tmp');
await mkdir(LIVRABLES, { recursive: true });
await mkdir(TMP, { recursive: true });

const NOM = 'MMICRO-Multiservices';
const CIBLE_LUFS = -14;
const CRETE_MAX = -1;
const chrome = process.env.REMOTION_CHROME || undefined;
const chromiumOptions = { gl: 'angle' };

const ffmpeg = (params, { lire = false } = {}) => {
  const r = spawnSync('npx', ['remotion', 'ffmpeg', '-hide_banner', '-nostats', '-y', ...params], { cwd: RACINE, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  if (r.status !== 0) throw new Error(`ffmpeg a échoué :\n${r.stderr?.slice(-2000)}`);
  return lire ? r.stderr : '';
};

const mesurer = (fichier) => {
  const sortie = ffmpeg(['-i', fichier, '-vn', '-af', `loudnorm=I=${CIBLE_LUFS}:TP=${CRETE_MAX}:LRA=11:print_format=json`, '-f', 'null', '-'], { lire: true });
  const json = JSON.parse(sortie.slice(sortie.lastIndexOf('{'), sortie.lastIndexOf('}') + 1));
  return { lufs: Number(json.input_i), crete: Number(json.input_tp), plage: Number(json.input_lra) };
};

const taille = async (f) => `${((await stat(f)).size / 1024 / 1024).toFixed(1)} Mo`;

console.log('Préparation du projet…');
const serveUrl = await bundle({ entryPoint: path.join(RACINE, 'src/index.ts'), publicDir: path.join(RACINE, 'public') });
const rapport = {};

for (const format of formats) {
  const id = `Film-${format}`;
  const inputProps = { format, musique: false };
  const composition = await selectComposition({ serveUrl, id, inputProps, browserExecutable: chrome, chromiumOptions });
  const duree = composition.durationInFrames / composition.fps;
  const maitre = path.join(TMP, `maitre-${format}.mkv`);

  // 1. Images + effets sonores (son non compressé pour le mixage)
  console.log(`\n[${format}] Rendu de ${composition.durationInFrames} images (${duree.toFixed(1)} s)…`);
  const debut = Date.now();
  let dernier = -1;
  if (!(reprendre && existsSync(maitre))) await renderMedia({
    composition,
    serveUrl,
    codec: 'h264-mkv',
    audioCodec: 'pcm-16',
    outputLocation: maitre,
    inputProps,
    crf: brouillon ? 26 : 14, // vidéo maître quasi sans perte, réencodée ensuite
    x264Preset: brouillon ? 'veryfast' : 'medium',
    pixelFormat: 'yuv420p',
    colorSpace: 'bt709',
    imageFormat: brouillon ? 'jpeg' : 'png',
    jpegQuality: 90,
    scale: brouillon ? 0.5 : 1,
    concurrency: os.cpus().length,
    browserExecutable: chrome,
    chromiumOptions,
    onProgress: ({ progress }) => {
      const p = Math.floor(progress * 20) * 5;
      if (p !== dernier) {
        dernier = p;
        const ecoule = (Date.now() - debut) / 1000;
        process.stdout.write(`  ${p} % (${Math.round(ecoule)} s)\n`);
      }
    },
  });

  // 2. Effets seuls, puis mélange avec la musique
  const fichierEffets = path.join(TMP, `effets-${format}.wav`);
  ffmpeg(['-i', maitre, '-map', '0:a', '-c:a', 'pcm_s16le', '-ar', '48000', '-ac', '2', fichierEffets]);
  const effetsBruts = await lireWav(fichierEffets);
  const fichierMusique = SON.musique === 'originale' ? path.join(RACINE, `public/audio/musique-${format}.wav`) : SON.musique ? path.join(RACINE, 'public/audio', SON.musique) : null;
  const n = effetsBruts.n;
  const melange = { sr: 48000, n, L: Float32Array.from(effetsBruts.L), R: Float32Array.from(effetsBruts.R) };
  if (fichierMusique) {
    const musiqueWav = path.join(TMP, `musique-${format}.wav`);
    ffmpeg(['-i', fichierMusique, '-ar', '48000', '-ac', '2', '-c:a', 'pcm_s16le', musiqueWav]);
    const musique = await lireWav(musiqueWav);
    // Une musique externe est coupée à la durée du film, avec un fondu final de 1,5 s
    const fondu = SON.musique === 'originale' ? 0 : Math.round(1.5 * 48000);
    for (let i = 0; i < Math.min(n, musique.n); i++) {
      const f = fondu && i > n - fondu ? (n - i) / fondu : 1;
      melange.L[i] += musique.L[i] * SON.volumeMusique * f;
      melange.R[i] += musique.R[i] * SON.volumeMusique * f;
    }
  }

  // 3. Volume pour les réseaux : -14 LUFS, crêtes limitées à -1,5 dB.
  //    Le même gain est appliqué à la version sans musique : les effets y sonnent pareil.
  const { sortie: melangeFinal, gain, avant } = masteriser(melange, CIBLE_LUFS, CRETE_MAX - 0.5);
  const effetsFinal = gainEtLimiteur(effetsBruts, gain, CRETE_MAX - 0.5);
  const mix = path.join(TMP, `mix-final-${format}.wav`);
  const effets = path.join(TMP, `effets-final-${format}.wav`);
  await ecrireWav(mix, melangeFinal);
  await ecrireWav(effets, effetsFinal);
  rapport[format] = {
    duree,
    images: composition.durationInFrames,
    melange: { lufsAvant: Number(avant.toFixed(2)), gainDb: Number(gain.toFixed(2)), lufsApres: Number(lufs(melangeFinal).toFixed(2)), creteDb: Number(crete(melangeFinal).toFixed(2)) },
    fichiers: {},
  };

  // 4. Fichiers MP4 (H.264 High, débit plafonné pour les réseaux sociaux)
  //    16:9 : jusqu'à 10 Mb/s (YouTube, LinkedIn, site) ; 9:16 : jusqu'à 8 Mb/s (Reels, TikTok)
  //    + une version 9:16 allégée (moins de 15 Mo) pour le statut WhatsApp
  const plafond = format === '16x9' ? 10 : 8;
  const encodages = [
    { suffixe: '', source: mix, video: ['-crf', '19', '-maxrate', `${plafond}M`, '-bufsize', `${plafond * 2}M`] },
    { suffixe: '-sans-musique', source: effets, video: ['-crf', '19', '-maxrate', `${plafond}M`, '-bufsize', `${plafond * 2}M`] },
  ];
  if (format === '9x16') {
    const debit = Math.floor(((14.5 * 8 * 1024) / duree - 160) * 0.97); // kb/s pour rester sous 15 Mo
    encodages.push({ suffixe: '-whatsapp', source: mix, video: ['-b:v', `${debit}k`, '-maxrate', `${Math.round(debit * 1.5)}k`, '-bufsize', `${debit * 2}k`], audio: '160k' });
  }
  for (const v of encodages) {
    const final = path.join(LIVRABLES, `${NOM}-${format}${v.suffixe}.mp4`);
    ffmpeg([
      '-i', maitre,
      '-i', v.source,
      '-map', '0:v', '-map', '1:a',
      '-c:v', 'libx264', '-preset', brouillon ? 'veryfast' : 'slow', '-profile:v', 'high', '-pix_fmt', 'yuv420p',
      ...v.video,
      '-g', '120', '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709',
      '-c:a', 'aac', '-b:a', v.audio ?? '256k', '-ar', '48000',
      '-movflags', '+faststart',
      '-metadata', `title=MMICRO Multiservices – Petits travaux. Grand soin.`,
      '-shortest',
      final,
    ]);
    const mesure = mesurer(final);
    rapport[format].fichiers[path.basename(final)] = { taille: await taille(final), ...mesure };
    console.log(`  → ${path.relative(RACINE, final)} (${await taille(final)}, ${mesure.lufs} LUFS, crête ${mesure.crete} dB)`);
  }

  // 5. Poster
  if (!brouillon) {
    const poster = path.join(LIVRABLES, `${NOM}-${format}-poster.jpg`);
    const compoPoster = await selectComposition({ serveUrl, id: `Poster-${format}`, browserExecutable: chrome, chromiumOptions });
    await renderStill({ composition: compoPoster, serveUrl, output: poster, imageFormat: 'jpeg', jpegQuality: 92, browserExecutable: chrome, chromiumOptions, overwrite: true });
    rapport[format].poster = { fichier: path.basename(poster), taille: await taille(poster) };
    console.log(`  → ${path.relative(RACINE, poster)}`);
  }
  rapport[format].calcul = `${Math.round((Date.now() - debut) / 1000)} s`;
}

await writeFile(path.join(LIVRABLES, brouillon ? 'rapport-brouillon.json' : 'rapport-rendu.json'), JSON.stringify(rapport, null, 2));
if (!args.includes('--garder')) await rm(TMP, { recursive: true, force: true });
console.log('\nTerminé.');
