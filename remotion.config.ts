import { Config } from '@remotion/cli/config';

Config.setVideoImageFormat('png');
Config.setOverwriteOutput(true);
// Rendu 3D (Three.js) sans carte graphique : moteur logiciel ANGLE
Config.setChromiumOpenGlRenderer('angle');
Config.setBrowserExecutable(process.env.REMOTION_CHROME ?? null);
