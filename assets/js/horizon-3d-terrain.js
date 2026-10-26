// @ts-check
/**
 * Terrain for the 3D horizon view (horizon-3d.js), kept off the page's main thread: it runs in
 * horizon-3d-terrain-worker.js (or, where a worker can't decode images, on the page itself).
 *
 * Heights come from web-Mercator Terrarium tiles: the refraction server's /v1/terrain-tiles (the same heights its
 * horizons are computed from) where it makes them in time, else the AWS Terrain Tiles. From them:
 *   heightmap(): a 65 x 65 grid of heights over a latitude / longitude rectangle (rows north to south), as Cesium's
 *                geographic heightmap tiles take them, bilinear;
 *   hillshade(): a Mercator tile's shaded relief (light from the north-west, 45 deg up), RGBA.
 */

const AWS_TERRARIUM = "https://s3.amazonaws.com/elevation-tiles-prod/terrarium";
/** Zooms the server makes tiles for (terrain_tiles.py MIN_ZOOM..MAX_ZOOM). */
export const SERVER_MIN_ZOOM = 8, SERVER_MAX_ZOOM = 14;
/** How long a terrain tile may take the server before AWS's is used instead (it may first download the 1-degree
 * tiles under it; it finishes and keeps its tile for the next visit). */
const SERVER_TILE_WAIT_MS = 5000;
const D2R = Math.PI / 180;
/** Decoded Mercator tiles kept (256 x 256 floats: 256 KB each). */
const CACHE_TILES = 400;

/**
 * @param {{ server: string, decode: (blob: Blob) => Promise<Uint8ClampedArray>, onTile?: (fromServer: boolean) => void }} opts
 *   decode: a PNG's RGBA pixels (an OffscreenCanvas in a worker, a canvas on the page)
 */
export function terrainSource({ server, decode, onTile = () => {} }) {
	/** @type {Map<string, Promise<Float32Array | null>>} heights of a Mercator tile, by "z/x/y" */
	const tiles = new Map();

	/** Heights (m) of Terrarium tile z/x/y: the server's where it makes it in time, else AWS's (its sea bed at sea level). */
	function mercTile(z, x, y) {
		const key = `${z}/${x}/${y}`;
		let p = tiles.get(key);
		if (p) {
			tiles.delete(key);                       // most recently used last
			tiles.set(key, p);
			return p;
		}
		p = (async () => {
			let blob = null, fromAws = false;
			if (z >= SERVER_MIN_ZOOM && z <= SERVER_MAX_ZOOM) {
				try {
					const r = await fetch(`${server}/v1/terrain-tiles/${z}/${x}/${y}.png`, { signal: AbortSignal.timeout(SERVER_TILE_WAIT_MS) });
					if (r.ok) blob = await r.blob();
				} catch (e) { /* unreachable or slow: AWS's */ }
			}
			if (!blob) {
				const r = await fetch(`${AWS_TERRARIUM}/${z}/${x}/${y}.png`);
				if (!r.ok) return null;
				blob = await r.blob();
				fromAws = true;
			}
			onTile(!fromAws);
			const px = await decode(blob);
			const h = new Float32Array(256 * 256);
			for (let i = 0; i < h.length; i++) {
				const v = px[4 * i] * 256 + px[4 * i + 1] + px[4 * i + 2] / 256 - 32768;
				// AWS's tiles carry the sea bed (bathymetry): its water is drawn at sea level, as the server's
				h[i] = fromAws && v < 0 ? 0 : v;
			}
			return h;
		})();
		p.catch(() => tiles.delete(key));
		tiles.set(key, p);
		if (tiles.size > CACHE_TILES) tiles.delete(/** @type {string} */ (tiles.keys().next().value));
		return p;
	}

	/**
	 * 65 x 65 heights over [west, south, east, north] (deg), rows north to south, from the Mercator zoom whose
	 * pixels are about half a step of the grid at Cesium's `level`.
	 */
	async function heightmap(west, south, east, north, level) {
		const z = Math.max(0, Math.min(SERVER_MAX_ZOOM, level + 1));
		const n = 2 ** z;
		const mx = (lon) => (lon + 180) / 360 * n * 256;
		const my = (lat) => {
			const l = Math.max(-85.05, Math.min(85.05, lat)) * D2R;
			return (1 - Math.asinh(Math.tan(l)) / Math.PI) / 2 * n * 256;
		};
		const x0 = Math.floor(mx(west) / 256), x1 = Math.floor((mx(east) - 1e-6) / 256);
		const y0 = Math.floor(my(north) / 256), y1 = Math.floor((my(south) - 1e-6) / 256);
		const cols = x1 - x0 + 1;
		/** @type {(Float32Array | null)[]} */
		const got = await Promise.all([...Array(cols * (y1 - y0 + 1)).keys()].map(k =>
			mercTile(z, (((x0 + k % cols) % n) + n) % n, Math.max(0, Math.min(n - 1, y0 + Math.floor(k / cols))))));
		const at = (gx, gy) => {
			const tx = Math.max(x0, Math.min(x1, Math.floor(gx / 256))), ty = Math.max(y0, Math.min(y1, Math.floor(gy / 256)));
			const t = got[(ty - y0) * cols + (tx - x0)];
			if (!t) return 0;
			const px = Math.max(0, Math.min(255, Math.floor(gx - tx * 256))), py = Math.max(0, Math.min(255, Math.floor(gy - ty * 256)));
			return t[py * 256 + px];
		};
		const out = new Float32Array(65 * 65);
		for (let j = 0; j < 65; j++) {
			const gy = my(north + (south - north) * j / 64) - 0.5;
			const y_ = Math.floor(gy), fy = gy - y_;
			for (let i = 0; i < 65; i++) {
				const gx = mx(west + (east - west) * i / 64) - 0.5;
				const x_ = Math.floor(gx), fx = gx - x_;
				out[j * 65 + i] = at(x_, y_) * (1 - fx) * (1 - fy) + at(x_ + 1, y_) * fx * (1 - fy)
					+ at(x_, y_ + 1) * (1 - fx) * fy + at(x_ + 1, y_ + 1) * fx * fy;
			}
		}
		return out;
	}

	/** Shaded relief of Mercator tile z/x/y, RGBA 256 x 256 (transparent where there are no heights). */
	async function hillshade(z, x, y) {
		const out = new Uint8ClampedArray(256 * 256 * 4);
		const h = await mercTile(z, x, y);
		if (!h) return out;
		const n = 2 ** z;
		const lat = Math.atan(Math.sinh(Math.PI * (1 - 2 * (y + 0.5) / n)));
		const cell2 = 2 * 40075016.686 * Math.cos(lat) / n / 256;      // metres across two pixels
		const cz = Math.cos(45 * D2R), sz = Math.sin(45 * D2R);
		// light from the north-west: the unit vector toward it, in (east, north, up)
		const lx = -Math.SQRT1_2 * sz, ly = Math.SQRT1_2 * sz;
		for (let j = 0; j < 256; j++) {
			const jn = j > 0 ? j - 1 : 0, js = j < 255 ? j + 1 : 255;
			for (let i = 0; i < 256; i++) {
				const iw = i > 0 ? i - 1 : 0, ie = i < 255 ? i + 1 : 255;
				const dzdx = (h[j * 256 + ie] - h[j * 256 + iw]) / cell2, dzdy = (h[jn * 256 + i] - h[js * 256 + i]) / cell2;
				// the surface's normal is (-dzdx, -dzdy, 1) / |..|: lit by its cosine with the light
				const shade = (-dzdx * lx - dzdy * ly + cz) / Math.sqrt(dzdx * dzdx + dzdy * dzdy + 1);
				const v = Math.max(0, Math.min(255, 255 * (0.35 + 0.75 * shade)));
				const k = 4 * (j * 256 + i);
				out[k] = v * 0.98; out[k + 1] = v * 0.95; out[k + 2] = v * 0.88; out[k + 3] = 255;
			}
		}
		return out;
	}

	return { heightmap, hillshade };
}
