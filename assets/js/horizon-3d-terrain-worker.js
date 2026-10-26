// @ts-check
/**
 * The 3D horizon view's terrain work (horizon-3d-terrain.js) in a worker, so decoding tiles and building heightmaps
 * never holds up the page. Messages:
 *   { init: { server } }
 *   { id, heightmap: [west, south, east, north, level] }  ->  { id, heights: Float32Array }
 *   { id, hillshade: [z, x, y] }                           ->  { id, rgba: Uint8ClampedArray }
 * and, as tiles arrive, { tile: true | false } (from the server or not), for the page's count.
 */
import { terrainSource } from "./horizon-3d-terrain.js";

/** @type {ReturnType<typeof terrainSource> | null} */
let source = null;
const canvas = new OffscreenCanvas(256, 256);
const ctx = /** @type {OffscreenCanvasRenderingContext2D} */ (canvas.getContext("2d", { willReadFrequently: true }));

/** @param {Blob} blob */
async function decode(blob) {
	const bmp = await createImageBitmap(blob);
	ctx.clearRect(0, 0, 256, 256);
	ctx.drawImage(bmp, 0, 0);
	bmp.close();
	return ctx.getImageData(0, 0, 256, 256).data;
}

self.onmessage = async (e) => {
	const m = e.data;
	if (m.init) {
		source = terrainSource({ server: m.init.server, decode, onTile: (fromServer) => self.postMessage({ tile: fromServer }) });
		return;
	}
	if (!source) return;
	try {
		if (m.heightmap) {
			const heights = await source.heightmap(...m.heightmap);
			self.postMessage({ id: m.id, heights }, [heights.buffer]);
		} else if (m.hillshade) {
			const rgba = await source.hillshade(...m.hillshade);
			self.postMessage({ id: m.id, rgba }, [rgba.buffer]);
		}
	} catch (err) {
		self.postMessage({ id: m.id, error: String(/** @type {any} */ (err)?.message ?? err) });
	}
};
