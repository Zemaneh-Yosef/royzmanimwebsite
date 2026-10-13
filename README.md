# royzmanimwebsite

Created by Elyahu Jacobi @Elyahu41 and Maor @NightScript

@NightScript is contracted to help build this website.

## Building

The site builds with Jekyll as before, and each build also makes its JavaScript work in older browsers
(Chrome 67, Firefox 78, Safari 14.1 and later — see `scripts/legacy/config.mjs`). That step runs on Node,
so install the Node packages once before building:

```sh
pnpm install
bundle exec jekyll serve
```

Write JavaScript as usual; the build takes care of newer syntax, top-level `await` and module workers.
Two things it can't fix: a regex literal using lookbehind (`(?<=…)`, `(?<!…)`) or the `d`/`v` flags fails
the build (patterns built with `new RegExp(…)` aren't checked), and browser APIs newer than those browsers
need a polyfill in `scripts/legacy/polyfills/` (then run `pnpm build:polyfills`).
New workers must be started with `spawnWorker()` from `assets/js/misc/worker.js` and listed in `WORKERS`.
