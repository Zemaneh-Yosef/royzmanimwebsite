// @ts-check

/**
 * Is the JS engine's optimizing JIT working?
 *
 * Edge's Enhanced security mode (Strict, or Balanced on sites the user rarely visits) and some
 * locked-down setups turn the JIT off, which makes the visible-sunrise ray tracing ~30x slower.
 * No browser API reports this, so it is measured: a plain arithmetic loop, warmed up, is timed against
 * Float64Array.prototype.sort, which is native code in every engine mode. Both scale with the CPU, so
 * the ratio doesn't depend on how fast the machine is.
 *
 * Calibrated on V8 (Chrome / Edge / Node 26): ratio ≈ 0.7–1.2 with the optimizing JIT, ≈ 3.7–6.5
 * without it (jitless, or baseline compiler only). Other engines sort differently, so outside V8 treat
 * `jit` as a hint and look at `ratio`.
 *
 * Costs ~35 ms with a JIT and ~65 ms without. Call it once (in a worker or when idle) and keep the answer.
 *
 * @returns {{ jit: boolean, ratio: number }} ratio = loop time / sort time (lower = faster JS)
 */
export function detectJit() {
	const body = `
		let r = 6.4e6, b = 0.001, s = 0;
		for (let i = 0; i < n; i++) {
			const c = 1 - b * b * 0.5, d = b - b * b * b / 6;
			r += d * 80; b += (c / r) * 80; s += r * 1e-9;
		}
		return s;`;
	/** @type {(n: number) => number} */
	let loop;
	try {
		// Unique source per call: engines cache compiled code by source, so a repeat would start pre-optimized
		loop = /** @type {any} */ (new Function("n", `// ${Math.random()}\n${body}`));
	} catch {
		// A Content-Security-Policy without 'unsafe-eval' blocks new Function. This copy is only cold on
		// the first call in a page, which is fine when the answer is cached.
		loop = n => {
			let r = 6.4e6, b = 0.001, s = 0;
			for (let i = 0; i < n; i++) {
				const c = 1 - b * b * 0.5, d = b - b * b * b / 6;
				r += d * 80; b += (c / r) * 80; s += r * 1e-9;
			}
			return s;
		};
	}

	const data = new Float64Array(20000);
	let seed = 1;
	const fill = () => { for (let i = 0; i < data.length; i++) data[i] = (seed = (seed * 16807) % 2147483647); };
	let sink = 0;

	// Best of several samples, so a stray GC or task switch doesn't decide the answer
	/** @param {() => void} fn @param {number} samples */
	const best = (fn, samples) => {
		let min = Infinity;
		for (let k = 0; k < samples; k++) {
			const t = performance.now();
			fn();
			min = Math.min(min, performance.now() - t);
		}
		return min;
	};

	const warmUntil = performance.now() + 20;          // let the optimizer kick in
	while (performance.now() < warmUntil) sink += loop(2000);
	const loopMs = best(() => { sink += loop(100000); }, 3);
	const sortMs = best(() => { fill(); data.sort(); sink += data[0]; }, 3);
	const fillMs = best(() => { fill(); sink += data[0]; }, 3); // the refill is JS too: subtract it
	if (sink === 42) console.log(sink);                // keep the work from being optimized away

	const ratio = loopMs / Math.max(sortMs - fillMs, 1e-3);
	return { jit: ratio < 2.2, ratio: +ratio.toFixed(2) };
}
