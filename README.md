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

### Offline use

The build also fills in the service worker's offline file list (`scripts/pwa/precache.mjs`): the home page,
both calendars and `/offline`, with every file they load or import from a fixed path. A file a page reaches
some other way (a URL put together at run time) has to be added to `EXTRA` there, or it's only stored once
it has been used. The launch screens for iOS are made by `node scripts/pwa/make-splash.mjs` (needs Playwright);
run it again after changing the icon.

### Images in several sizes

Images listed in `_data/images.yml` are served as lossless WebP copies, one per width, so each screen downloads
only what it shows. The build makes them from the source file (`scripts/images/build.mjs`, with sharp) into
`_site`, never into the repository, and keeps them in `.jekyll-cache/images` so unchanged ones aren't encoded
again. Put one on a page with `{% include image.html name="logo" sizes="208px" alt="…" %}`.

## The zmanim core (`assets/js/core/`)

`core/zmanimCore.js` is the calendar without a page: the settings that change the zemanim
(`core/zmanimSettings.js`), the calculator's configuration, the list of zemanim from `_data/zmanim.yml`,
and `ZmanimDay`, which gives a day's zemanim exactly as the calendar shows them. The calendar runs on it,
and so does the notification server ([Zemaneh-Yosef/website-notif](https://github.com/Zemaneh-Yosef/website-notif)),
which imports these files at a pinned commit of this repository and runs them in Deno.

Keep everything these files import free of browser-only APIs (DOM, `window`, `localStorage`): a change to the
zmanim logic reaches notifications once the server's pin is moved to the new commit.

## Our astronomy (`assets/js/astro/`) and the vendored libraries (`assets/libraries/`)

`assets/js/astro/` is this site's own astronomy: the refraction and visible-sunrise corrections on top of
kosher-zmanim's SPA calculator (`royzmanim-spa-corrections.js`), Delta-T, nutation, the weather providers,
nightfall by the stars, and the moon (`moon.js`). Import the moon from `astro/moon.js`, not from the
library: it sets Astronomy Engine to the same Delta-T as the sun.

`assets/libraries/` holds builds made elsewhere, kept byte-for-byte (`.gitattributes`). Two come from our
own repositories next to this one, kosher-zmanim (`../KosherZmanim`) and the moon calculator (`../moonrise`),
and the yahrzeit data comes from `../hiloulot`. `pnpm vendor` copies them in, and refuses files with
uncommitted changes so what the site ships always matches a commit (see `scripts/vendor.mjs`).
