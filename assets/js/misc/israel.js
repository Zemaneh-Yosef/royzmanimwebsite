// @ts-check

/**
 * A simplified outline of Israel, as [latitude, longitude] pairs, counter-clockwise from Rosh HaNikra.
 * It takes in Judea & Samaria, the Golan Heights and Eilat, and leaves out Gaza, Sinai (Taba), Jordan
 * (Aqaba, Irbid, Salt), Lebanon (Tyre) and Syria (Quneitra). Coastlines sit a little offshore.
 * @type {[number, number][]}
 */
const ISRAEL_OUTLINE = [
	// Mediterranean coast, north to south
	[33.093, 35.080], [32.930, 35.040], [32.830, 34.930], [32.600, 34.870], [32.350, 34.820],
	[32.050, 34.715], [31.850, 34.610], [31.700, 34.525], [31.600, 34.480],
	// Gaza Strip, north to south
	[31.590, 34.545], [31.545, 34.570], [31.470, 34.485], [31.330, 34.375], [31.220, 34.265],
	// Egypt
	[30.600, 34.490], [30.000, 34.710], [29.500, 34.905],
	// Gulf of Eilat
	[29.495, 34.920], [29.545, 34.978],
	// Arava and the Dead Sea (Jordan)
	[29.750, 35.040], [30.000, 35.080], [30.300, 35.150], [30.600, 35.250], [30.900, 35.380],
	[31.050, 35.400], [31.250, 35.440], [31.500, 35.500], [31.760, 35.560],
	// Jordan River and the Yarmouk
	[32.000, 35.540], [32.300, 35.565], [32.500, 35.570], [32.640, 35.580], [32.675, 35.670],
	[32.700, 35.780], [32.740, 35.870],
	// Golan Heights (Syria)
	[32.850, 35.890], [33.000, 35.870], [33.120, 35.810], [33.180, 35.800], [33.270, 35.795],
	[33.340, 35.800],
	// Lebanon
	[33.310, 35.740], [33.270, 35.625], [33.300, 35.610], [33.310, 35.570], [33.250, 35.560],
	[33.170, 35.530], [33.090, 35.500], [33.110, 35.350], [33.090, 35.200]
];

/**
 * Whether a point lies in Israel (see ISRAEL_OUTLINE for what counts), by ray casting.
 * @param {number} lat
 * @param {number} lng
 */
export function isInIsrael(lat, lng) {
	if (!Number.isFinite(lat) || !Number.isFinite(lng))
		return false;

	let inside = false;
	for (let i = 0, j = ISRAEL_OUTLINE.length - 1; i < ISRAEL_OUTLINE.length; j = i++) {
		const [latI, lngI] = ISRAEL_OUTLINE[i];
		const [latJ, lngJ] = ISRAEL_OUTLINE[j];
		if ((latI > lat) !== (latJ > lat) && lng < (lngJ - lngI) * (lat - latI) / (latJ - latI) + lngI)
			inside = !inside;
	}
	return inside;
}


/**
 * Store the settings whose defaults depend on whether the location is in Israel. Run whenever a
 * location is picked or edited.
 * @param {boolean} inIsrael
 * @param {URL} [url] the address about to be opened: same-named parameters there would override these
 */
export function applyLocationDefaults(inIsrael, url) {
	const defaults = inIsrael
		? { hourCalculators: "seasonal", rtKulah: "false", tzeitTaanitHumra: "true", tekufa: "arbitrary" }
		: { hourCalculators: "degrees", rtKulah: "true", tzeitTaanitHumra: "false", tekufa: "hatzoth" };

	for (const [key, value] of Object.entries(defaults)) {
		localStorage.setItem(key, value);
		url?.searchParams.delete(key);
	}
}
