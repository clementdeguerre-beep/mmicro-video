/*
 * Rend des images fixes du film (plans clés du storyboard, posters, vérifications).
 *
 *   node scripts/images-fixes.mjs <dossier-sortie> <format>:<scene>:<seconde> [...]
 *   exemple : node scripts/images-fixes.mjs sortie/verif 16x9:logo:3.8 9x16:fin:2.5
 *
 * <seconde> est comptée depuis le début de la scène.
 */
import { bundle } from '@remotion/bundler';
import { renderStill, selectComposition } from '@remotion/renderer';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const [sortie, ...demandes] = process.argv.slice(2);
if (!sortie || demandes.length === 0) {
  console.error('Usage : node scripts/images-fixes.mjs <dossier> <format>:<scene>:<seconde> …');
  process.exit(1);
}
await mkdir(sortie, { recursive: true });

const serveUrl = await bundle({ entryPoint: path.join(RACINE, 'src/index.ts'), publicDir: path.join(RACINE, 'public') });
const chrome = process.env.REMOTION_CHROME || undefined;
const compositions = {};

for (const demande of demandes) {
  const [format, scene, seconde] = demande.split(':');
  const id = `Film-${format}`;
  compositions[id] ??= await selectComposition({ serveUrl, id, browserExecutable: chrome, chromiumOptions: { gl: 'angle' } });
  const composition = compositions[id];
  const debut = await debutScene(format, scene);
  const frame = Math.min(composition.durationInFrames - 1, debut + Math.round(Number(seconde) * composition.fps));
  const fichier = path.join(sortie, `${format}-${scene}-${seconde}.png`);
  await renderStill({ composition, serveUrl, output: fichier, frame, browserExecutable: chrome, chromiumOptions: { gl: 'angle' }, overwrite: true });
  console.log(`${fichier} (image ${frame})`);
}

async function debutScene(format, scene) {
  const { readFile } = await import('node:fs/promises');
  const src = await readFile(path.join(RACINE, 'src/config.ts'), 'utf8');
  const ips = Number(/export const IPS = (\d+)/.exec(src)[1]);
  const bloc = src.split(format === '16x9' ? 'FILM_16_9' : 'FILM_9_16')[1].split('} as const')[0];
  let debut = 0;
  for (const m of bloc.matchAll(/id: '([a-z0-9]+)', duree: ([\d.]+)/g)) {
    if (m[1] === scene) return debut;
    debut += Math.round(Number(m[2]) * ips);
  }
  throw new Error(`Scène inconnue : ${scene}`);
}
