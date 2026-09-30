/* Icônes du site (sprite SVG de site/index.html), trait 24 × 24.
   Extraites telles quelles. Ne pas modifier à la main. */
export const ICONES = {
  "rouleau": "<rect x=\"3\" y=\"3.5\" width=\"13.5\" height=\"6\" rx=\"2\"/><path d=\"M16.5 6.5h2A1.5 1.5 0 0 1 20 8v2.5a1.5 1.5 0 0 1-1.5 1.5H12v3\"/><rect x=\"10.5\" y=\"15\" width=\"3\" height=\"6\" rx=\"1\"/>",
  "maison": "<path d=\"M3.5 10.5 12 3.5l8.5 7\"/><path d=\"M5.5 9v11h13V9\"/><path d=\"m9.2 14.2 2 2 3.8-4\"/>",
  "boite": "<rect x=\"3\" y=\"8\" width=\"18\" height=\"12\" rx=\"2\"/><path d=\"M8.5 8V6a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v2\"/><path d=\"M3 13.5h18\"/><path d=\"M10 12v3h4v-3\"/>",
  "chrono": "<circle cx=\"12\" cy=\"13.5\" r=\"7.5\"/><path d=\"M12 10v3.5l2.5 2\"/><path d=\"M9.5 2.5h5\"/><path d=\"M12 2.5V6\"/><path d=\"m18.3 6.7 1.4-1.4\"/>",
  "tel": "<path d=\"M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z\"/>",
  "check": "<path d=\"m5 12.5 4.5 4.5L19 7.5\"/>",
  "fleche": "<path d=\"M5 12h14\"/><path d=\"m13 6 6 6-6 6\"/>",
  "menu": "<path d=\"M4 7h16\"/><path d=\"M4 12h16\"/><path d=\"M4 17h16\"/>",
  "fermer": "<path d=\"M6 6l12 12\"/><path d=\"M18 6 6 18\"/>",
  "mail": "<rect x=\"3\" y=\"5\" width=\"18\" height=\"14\" rx=\"2.5\"/><path d=\"m3.5 7 8.5 6 8.5-6\"/>",
  "cadenas": "<rect x=\"4.5\" y=\"10.5\" width=\"15\" height=\"10\" rx=\"2.5\"/><path d=\"M8 10.5v-3a4 4 0 0 1 8 0v3\"/>",
  "personne": "<circle cx=\"12\" cy=\"8\" r=\"4\"/><path d=\"M4.5 20.5a7.5 7.5 0 0 1 15 0\"/>",
  "devis": "<path d=\"M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z\"/><path d=\"M14 3v5h5\"/><path d=\"M8.5 13h7\"/><path d=\"M8.5 17h5\"/>",
  "etiquette": "<path d=\"M3.5 12.2V5A1.5 1.5 0 0 1 5 3.5h7.2a1.5 1.5 0 0 1 1.06.44l7.3 7.3a1.5 1.5 0 0 1 0 2.12l-7.2 7.2a1.5 1.5 0 0 1-2.12 0l-7.3-7.3a1.5 1.5 0 0 1-.44-1.06z\"/><circle cx=\"8\" cy=\"8\" r=\"1.6\"/>",
  "bouclier": "<path d=\"M12 3 5 5.8v5.7c0 4.4 3 7.8 7 9.5 4-1.7 7-5.1 7-9.5V5.8z\"/><path d=\"m9 12 2.2 2.2L15.5 10\"/>",
  "horloge": "<circle cx=\"12\" cy=\"12\" r=\"8.5\"/><path d=\"M12 7.5V12l3 2\"/>",
  "photo": "<path d=\"M4.5 7.5h3L9.3 5h5.4l1.8 2.5h3A1.5 1.5 0 0 1 21 9v9.5a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18.5V9a1.5 1.5 0 0 1 1.5-1.5z\"/><circle cx=\"12\" cy=\"13.5\" r=\"3.5\"/>",
  "info": "<circle cx=\"12\" cy=\"12\" r=\"8.5\"/><path d=\"M12 11v5\"/><path d=\"M12 7.9v.1\"/>",
  "alerte": "<circle cx=\"12\" cy=\"12\" r=\"8.5\"/><path d=\"M12 7.5V13\"/><path d=\"M12 16.4v.1\"/>",
} as const;

export type NomIcone = keyof typeof ICONES;
