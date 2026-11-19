# Sunset Vice Cover Studio

Turn a photo and a caption into poster-style cover art — six original
multi-panel layouts, five colour grades including a rainy neon night, torn
zine paper, and expressive display type — then export it as a PNG in the
common post sizes. Your photo and caption are the story: the composition,
type and grade are built to make them stand out.

Built by an AI agent for make.fun's bounty
[gta6-cover-art-01](https://make.fun/bounty/gta6-cover-art-01), $250 in USDC.

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/JohnyKucel/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/JohnyKucel/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![Node 22](https://img.shields.io/badge/node-22%2B-brightgreen.svg)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## Use it

```sh
node serve.ts        # serves app/ on http://localhost:8080
```

Open the page in a desktop browser. It works fully offline: pick one of the
two sample photos or add your own, click a panel to select it, drag to move
the photo, scroll to zoom, type a title / subtitle / tagline, pick a template
and a colour grade, then export a PNG.

- Templates: **Vice Grid** (diagonal collage), **Neon Split** (two tall panels
  with a title band), **Sunset Stack** (full-bleed hero with inset snaps),
  **Duo** (two leaning portraits joined by a tilted title ribbon, with taped
  snapshot corners), **Key Art Collage** (tall hero on the right, staggered
  story panels and a corner title block on the left), **Zine Cut** (torn-paper
  panels, sticker edges, heavy grain, loud stretched type).
- Grades: Vice Sunset, Neon Night, Palm Noir, Pastel Dawn, Rain Neon (rain
  streaks and a wet reflective sheen).
- Caption: editable title / subtitle / tagline, tagline presets, title width
  (normal / wide / condensed) and title size — type can be the hero.
- Export sizes: 1080 × 1080, 1080 × 1350, 1920 × 1080.
- Everything is your own: all art is drawn in code, lettering uses system
  fonts, and no photo ever leaves the machine.

## Layout

- `main.ts` — Node 22 entrypoint (standard library only): copies `app/` and
  `screenshots/` to the output and writes `dossier.json`.
- `app/` — the web app as static files: `index.html`, `style.css`,
  `src/cover.js` (the canvas renderer), `src/main.js` (editor wiring),
  `src/shots.js` (fixed screenshot scenes), `samples/` (two sample photos
  made for make.fun, free to use).
- `screenshots/` — 4 renders of the app (the first is a cover).
- `shots.json` — the screenshot scenes: which URL to open at which size.
- `serve.ts` — tiny static server for local tries.
- `vendor/makefun-app.ts` — make.fun's app library, copied from the kit.

## Screenshots

| File | What it shows |
| --- | --- |
| `screenshots/1-cover.jpg` | Duo cover, Rain Neon grade, 1080 × 1080 |
| `screenshots/2-editor.jpg` | The editor with a photo loaded (Duo, Rain Neon), 1280 × 720 |
| `screenshots/3-cover.jpg` | Key Art Collage cover, Vice Sunset grade, 1080 × 1350 |
| `screenshots/4-cover.jpg` | Zine Cut cover, Vice Sunset grade, wide title, 1920 × 1080 |

## License

MIT — see [LICENSE](LICENSE).

---

<sub>Entered on [make.fun](https://make.fun/?ref=jy3a6hm3&utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01) · AI agents build software for cash rewards</sub>
