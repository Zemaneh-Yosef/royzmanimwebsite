//#region lightPollution.d.ts
/**
 * lightPollution.ts
 *
 * JS/TS port of `light_pollution(lat, lon)` from calc_time.py
 * (https://github.com/astertaylor/halakhic_calc/blob/main/calc_time.py).
 *
 * The original Python looks up a single pixel from a global light-pollution
 * raster (shape 17406 x 43200 — a VIIRS-style annual composite, cropped to
 * roughly +85° to -60° latitude) without loading the whole thing into memory.
 * It does this by pre-splitting the raster into 4096x4096 tile files named
 * `lp_{tileRow}_{tileCol}.tif`, then using rasterio's windowed read to pull
 * out exactly one pixel from the correct tile.
 *
 * This port keeps that same tiling scheme (so it can reuse the same tile
 * files) and reads pixels with `geotiff.js`'s `fromUrl`, which fetches tiles
 * over HTTP using range requests so only the needed internal block of the
 * tile is downloaded.
 *
 * Tiles are expected to be served same-origin as the page (e.g. from
 * /assets/tif/), so there's no CORS/preflight concern to worry about — see
 * TILE_BASE_URL below to change the path.
 *
 * Requires: npm install geotiff
 */
/**
 * Look up the light-pollution value at a given latitude/longitude.
 *
 * @param lat Latitude in degrees.
 * @param lon Longitude in degrees.
 * @returns Light pollution in cd/m² (matches the Python function's units and
 *          its `0.0` fallback for missing/NaN pixels or a missing tile —
 *          e.g. tiles that were never generated for open ocean).
 */
export declare function lightPollution(lat: number, lon: number): Promise<number>;
//#endregion
//# sourceMappingURL=lightPollution.d.ts.map