# Film de présentation MMICRO Multiservices

Vidéo en motion design du site MMICRO Multiservices, programmée avec [Remotion](https://www.remotion.dev) (React).

> **État : étape 1 terminée, en attente de validation du storyboard.**
> Le mode d'emploi complet (changer un texte, une durée, relancer le rendu) sera écrit à l'étape 4.

## Ce qu'il y a dans le dossier

| Élément | Rôle |
|---|---|
| `src/config.ts` | **Le fichier à modifier** : textes, durées des scènes, couleurs, son |
| `src/scenes/` | Les 9 scènes du film (S1Logo … S9Fin) |
| `src/composants/`, `src/trois/` | Briques visuelles : logo animé, textes, fonds, ordinateur et smartphone en 3D |
| `site/` | Copie du site, utilisée pour les captures |
| `public/captures/` | Captures réelles du site (Playwright) |
| `public/polices/`, `public/logo/` | Polices Outfit et Instrument Sans (licence OFL), logo SVG |
| `storyboard/` | Planches du storyboard (16:9 et 9:16) |
| `scripts/` | Captures, images fixes, storyboard |

## Commandes

```bash
npm install            # une seule fois
npm run captures       # refaire les captures du site (dossier site/)
npm run studio         # prévisualiser le film dans Remotion Studio
npm run storyboard     # régénérer les planches du storyboard
```
