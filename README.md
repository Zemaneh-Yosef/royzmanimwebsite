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

Write JavaScript and CSS as usual; the build takes care of newer syntax, top-level `await`, module workers
and fallbacks for `dvh`-style viewport units. PDF.js is left as shipped (modern browsers only).
Two things it can't fix: a regex literal using lookbehind (`(?<=…)`, `(?<!…)`) or the `d`/`v` flags fails
the build (patterns built with `new RegExp(…)` aren't checked), and browser APIs newer than those browsers
need a polyfill in `scripts/legacy/polyfills/` (then run `pnpm build:polyfills`).
New workers must be started with `spawnWorker()` from `assets/js/misc/worker.js` and listed in `WORKERS`.

## The zmanim core (`assets/js/core/`)

`core/zmanimCore.js` is the calendar without a page: the settings that change the zemanim
(`core/zmanimSettings.js`), the calculator's configuration, the list of zemanim from `_data/zmanim.yml`,
and `ZmanimDay`, which gives a day's zemanim exactly as the calendar shows them. The calendar runs on it,
and so does the notification server ([Zemaneh-Yosef/website-notif](https://github.com/Zemaneh-Yosef/website-notif)),
which imports these files at a pinned commit of this repository and runs them in Deno.

Keep everything these files import free of browser-only APIs (DOM, `window`, `localStorage`): a change to the
zmanim logic reaches notifications once the server's pin is moved to the new commit.
