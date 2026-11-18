# Permutation test

Runs the site's own code (`assets/js/astro`: the calculator, the path forecasts, the refraction server's air, the
normals, the terrain horizons) over 60 places (20 in Israel) and measures how each open decision moves the
elevated and visible sunrise and sunset. It changes one decision at a time, then tests pairs of decisions to show
which ones depend on each other.

| decision | levels (base setting **in bold**) |
|---|---|
| weather source | **site order** (path forecast > refraction server > normals), path forecast only, single-point Open-Meteo only, NWS only (US), server only, normals only, none (standard air) |
| terrain base | none (sea level, as the site is today), Definition C at 20 / 40 / 60 / **80** / 100 / 120 km |
| refraction at real heights | **on**, off |
| humidity | **off**, on |
| sea-surface layer | **off**, on |

## Running it on Windows

You need [Node.js](https://nodejs.org) 20 or newer (the LTS installer is fine) and this repository.

In PowerShell:

```powershell
cd path\to\royzmanimwebsite
git pull
cd tools\permutations
npm install
node fetch.mjs
node run.mjs --quick
```

Then open `tools\permutations\results\summary.md` (in VS Code, or any Markdown viewer).

### Step 1: `node fetch.mjs` (needs the internet)

Downloads everything the site would download for each place: the path forecast, the single-point forecasts, the
5-year normals, the server's air for a year, and the terrain horizon. Everything is saved under `cache\`, so the
weather is frozen: every setting is later compared on the same forecast.

- It prints each place as it goes, with time elapsed and time left.
- Right after saving a place it replays the data and warns if anything saved won't replay.
- **Open-Meteo's free limit** is 10,000 calls a day and 5,000 an hour, and each place costs a few hundred.
  So all 60 places won't fit in one day. When the limit is reached, the script waits as long as Open-Meteo says
  and carries on, so you can leave it running overnight. Israeli places go first.
- You can stop it at any time (Ctrl+C) and run it again: finished places are skipped, unless the site's code has
  since changed what it downloads for them (a new model or more pressure levels). Those are found by replaying
  the saved data and are downloaded again by themselves. `node fetch.mjs --refetch`
  downloads them again; `node fetch.mjs Jerusalem Denver` only fetches places whose names start with those words.

### Step 2: `node run.mjs` (offline)

Replays the saved data on all your CPU cores except one, with a progress bar and time left.

| command | what it does | rough time (8 cores) |
|---|---|---|
| `node run.mjs --quick --no-visible` | every 3rd forecast day, every 2nd month, elevated times only | a minute or two |
| `node run.mjs --quick` | as above, plus the visible times | about an hour |
| `node run.mjs` | every forecast day and every month | about 3 hours |

The visible times are the slow part, about a second each, because they trace every vantage point of the area
through the forecast air, just as the site does. Other options: `--threads 4` sets how many places run at once;
naming places (`node run.mjs Jerusalem Efrat`) runs only those. You can run step 2 as often as you like without
downloading again.

## What you get (`results\`)

- `summary.md`: the tables.
  1. Each decision on its own, for the elevated time.
  2. The visible time.
  3. Pairs of decisions: how much one decision's effect changes when the other is set differently. Near 0 means
     they can be decided separately; large means decide them together.
  4. Which data each place had, and how much weather data the site's own checks refused.

  Every cell reads **median / 95th percentile / largest (count)**, in seconds, for all places, Israel, abroad,
  the forecast days and the later dates.
- `summary.json`: the same numbers, for further processing.
- `rows.csv`: every computed time (place, date, sunrise/sunset, setting, UTC).

Please send me `summary.md` and `summary.json`. `rows.csv` is useful if something looks odd.

## Notes

- The terrain bases are the report's (Definition C at each width, at the solstices and equinoxes, interpolated
  by the sun's declination). The site doesn't set a base yet, so "none" is what it shows today.
- A single source ("path forecast only" and so on) is compared only on the dates it has air for.
- Humidity is tested on the forecasts. The 5-year normals are fetched without dew points, which would double their
  Open-Meteo cost.
- `--skip-open-meteo` (for `fetch.mjs`) fetches only the refraction server's data; those places stay marked
  incomplete.
