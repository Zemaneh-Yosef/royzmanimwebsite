// @ts-check
/**
 * The ground height at a point, from the refraction server's terrain tiles (/v1/terrain-tiles: the heights its
 * horizons are computed from), else the AWS Terrain Tiles (the same Terrarium format, worldwide).
 *
 *   const m = await fetchGroundHeight(REFRACTION_SERVER, 40.7298, -73.8221);   // metres above sea level
 *
 * One 256 x 256 tile at zoom 14 (~10 m pixels at 30 deg; a few tens of KB), cached by the browser (the server's
 * for 30 days). The server makes a tile the first time it is asked for, which can take a while where it has no
 * terrain yet: after SERVER_WAIT_MS the AWS tile is used instead (the server still finishes and keeps its own).
 * Main thread or worker (needs createImageBitmap and a canvas).
 */

const AWS_TERRARIUM = "https://s3.amazonaws.com/elevation-tiles-prod/terrarium";
const ZOOM = 14;
const SERVER_WAIT_MS = 2500;

/** @param {Blob} blob @returns {Promise<Uint8ClampedArray>} RGBA */
async function decode(blob) {
	// no colour management or premultiplying: the colours are numbers
	const bmp = await createImageBitmap(blob, { colorSpaceConversion: "none", premultiplyAlpha: "none" });
	const canvas = typeof OffscreenCanvas !== "undefined" ? new OffscreenCanvas(256, 256)
		: Object.assign(document.createElement("canvas"), { width: 256, height: 256 });
	const ctx = /** @type {CanvasRenderingContext2D} */ (canvas.getContext("2d", { willReadFrequently: true }));
	ctx.drawImage(bmp, 0, 0);
	bmp.close?.();
	return ctx.getImageData(0, 0, 256, 256).data;
}

/**
 * @param {string} server the refraction server root (REFRACTION_SERVER)
 * @param {number} lat @param {number} lon
 * @returns {Promise<number>} metres above sea level (the sea, and AWS's sea bed, at 0)
 */
export async function fetchGroundHeight(server, lat, lon) {
	const n = 2 ** ZOOM;
	const l = Math.max(-85.05, Math.min(85.05, lat)) * Math.PI / 180;
	const px = (lon + 180) / 360 * n * 256, py = (1 - Math.asinh(Math.tan(l)) / Math.PI) / 2 * n * 256;
	const x = Math.floor(px / 256) % n, y = Math.floor(py / 256);
	const i = Math.min(255, Math.floor(py - y * 256)) * 256 + Math.min(255, Math.floor(px - Math.floor(px / 256) * 256));

	/** @type {Blob | null} */ let blob = null;
	let fromAws = false;
	try {
		const r = await fetch(`${server.replace(/\/+$/, "")}/v1/terrain-tiles/${ZOOM}/${x}/${y}.png`, { signal: AbortSignal.timeout(SERVER_WAIT_MS) });
		if (r.ok) blob = await r.blob();
	} catch { /* unreachable or slow: AWS's */ }
	if (!blob) {
		const r = await fetch(`${AWS_TERRARIUM}/${ZOOM}/${x}/${y}.png`);
		if (!r.ok) throw new Error(`terrain tile: HTTP ${r.status}`);
		blob = await r.blob();
		fromAws = true;
	}
	const p = await decode(blob);
	const h = p[4 * i] * 256 + p[4 * i + 1] + p[4 * i + 2] / 256 - 32768;
	return fromAws && h < 0 ? 0 : h;
}
