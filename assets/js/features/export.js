// @ts-check

import { settings } from "../settings/handler.js";
import WebsiteCalendar from "../WebsiteCalendar.js";
import TekufahCalculator from "../tekufot.js";
import { snapshotProvider } from "../refraction-snapshot.js";
import { spawnWorker } from "../misc/worker.js";

/**
 * The calculator setup for the export workers. postMessage can't carry the page's config as-is (its
 * atmosphere provider and deferVisibleSunrise are functions), so the workers get a plain copy of it and
 * the provider's results for the exported year; they rebuild the provider with providerFromSnapshot().
 * The terrain horizon is plain data and stays in the config, so the workers compute the same visible
 * sunrise as the page.
 * @param {import('../zmanimListUpdater.js').default} zmanLister
 * @param {[number, number, number, string]} firstDateParams the first month's PlainDate constructor arguments
 * @returns {{ config: import("../ROYZmanim.js").ZemanimConfig, refraction: import("./excelPrepare.js").ExportRefraction }}
 */
function workerCalcInputs(zmanLister, firstDateParams) {
	const { atmosphereProvider, deferVisibleSunrise: _deferred, ...config } = zmanLister.zmanCalc.config;
	const provider = zmanLister.refraction?.provider ?? atmosphereProvider ?? null;
	// a 13-month year plus a little on each side (some zmanim look at neighbouring days)
	const from = new Temporal.PlainDate(...firstDateParams).subtract({ days: 14 });
	return {
		config,
		refraction: {
			table: provider ? snapshotProvider(provider, zmanLister.geoLocation, from, 420) : {},
			normals: zmanLister.refraction?.normals ?? null
		}
	};
}

export default class exportFriendly {
	constructor() {
		this.midDownload = false;
	}

	/** @param {import('../zmanimListUpdater.js').default} zmanLister  */
	async handleICS(zmanLister) {
		if (this.midDownload)
			return;

		this.midDownload = true;

		const exportZmanList = Object.fromEntries(Object.entries(zmanLister.zmanimList)
			// @ts-ignore
			.filter(([key, value]) => document.getElementById(`exportzmanid-${key}`).checked))

		/** @type {[string, number, number, number, string]} */
		// @ts-ignore
		const glArgs = Object.values(settings.location).map(numberFunc => numberFunc())

		const { year: isoYear, calendarId: isoCalendar } = zmanLister.jCal.getDate()
		const calcInputs = workerCalcInputs(zmanLister, [isoYear, 1, 1, isoCalendar]);

		/** @type {Parameters<import('./icsPrepare.js')["default"]>} */
		const icsParams = [
			undefined,
			glArgs,
			calcInputs.config,
			zmanLister.jCal.getInIsrael(),
			exportZmanList,
			true,
			{
				// @ts-ignore
				language: settings.language() == "hb" ? "he" : settings.language(),
				timeFormat: settings.timeFormat(), seconds: settings.seconds(),
				calcConfig: [settings.calendarToggle.rtKulah(), settings.customTimes.tzeithIssurMelakha()],
				fasts: Object.fromEntries([...document.querySelector('[data-zfFind="FastDays"]').getElementsByTagName("h5")]
					.map(ogHeading => {
						/** @type {HTMLHeadingElement} */
						// @ts-ignore
						const heading = ogHeading.cloneNode(true);
						const [ hb, et, en ] = [...heading.children]
							.map(langElem => {
								while (langElem.querySelector('[data-zfFind="erevTzom"]'))
									langElem.querySelector('[data-zfFind="erevTzom"]').remove()

								return langElem.innerHTML.replace(/<.*?>/gm, '');
							})

						return [heading.getAttribute("data-zfFind"), { hb, "en-et": et, en }[settings.language()]]
					})),
				tahanun: Object.fromEntries([...document.querySelector('[data-zfFind="Tachanun"]').children]
					.map(/** @returns {[string, string]} */
						tachObj =>
						[
						tachObj.getAttribute('data-zfFind'),
						tachObj.childElementCount == 0
							? tachObj.innerHTML
							: [...tachObj.children]
								.find(langElem =>
									[...langElem.classList].find(cl => cl.startsWith('lang-')).replace('lang-', '') == settings.language().replace('en-et', 'et'))
								.innerHTML
						]
				)),
				refraction: calcInputs.refraction,
				learningTitle: Object.fromEntries(
					Object.keys(zmanLister.jCal.getAllLearning())
					.map(/** @returns {[string, {"he": string; "en-et": string; "en": string}]} */
						learnFind =>
						[learnFind,
							// @ts-ignore
							Object.fromEntries([...document.querySelector(`[data-zfReplace="${learnFind}"]`)
							.parentElement
							.getElementsByTagName("dt")]
							.map(titleElem => [
								[...titleElem.classList].find(cl => cl.startsWith('lang-')).replace('lang-', '').replace('hb', 'he').replace(/^et$/, 'en-et'),
								titleElem.innerHTML
							]))
						]
					))
			}
		]

		/** @type {import('../../libraries/ics/ics.esm.js').ics.EventAttributes[]} */
		let receiveData = [];
		let giveData = [];

		const postDataReceive = async () => {
			const ics = (await import('../../libraries/ics/ics.esm.js')).ics;

			receiveData = receiveData.flat();
			[isoYear + 3760, isoYear + 3761]
				.flatMap(hebrewYear => new TekufahCalculator(hebrewYear).calculateTekufotShemuel(!zmanLister.zmanCalc.config.fixedMil).slice(0, 4))
				.forEach((tekufa, index) => {
					if (tekufa.year != isoYear)
						return;

					const time = tekufa.toZonedDateTime("+02:00").withTimeZone(zmanLister.geoLocation.getTimeZone())
					const tekufaMonth = [
						WebsiteCalendar.TISHREI,
						WebsiteCalendar.TEVES,
						WebsiteCalendar.NISSAN,
						WebsiteCalendar.TAMMUZ,
						WebsiteCalendar.TISHREI,
						WebsiteCalendar.TEVES,
					]
						.map(month => (new WebsiteCalendar(zmanLister.jCal.getJewishYear(), month, 15)).formatJewishMonth())
						[index % 4]

					receiveData.push({
						start: time.subtract({ minutes: 30 }).epochMilliseconds,
						end: time.add({ minutes: 30 }).epochMilliseconds,
						title: {
							hb: "תקופת " + tekufaMonth.he,
							en: tekufaMonth.en + " Season",
							"en-et": "Tekufath " + tekufaMonth.en
						}[settings.language()]
					})
				})

			const calName = (!zmanLister.zmanCalc.config.fixedMil ? "Amudeh Hora'ah" : "Ohr Hachaim")
				+ ` Calendar (${isoYear}) - ` + zmanLister.geoLocation.getLocationName();

			const labeledEvents = this.dedupICSEntries(receiveData);
			for (const lEvent of labeledEvents) {
				lEvent.calName = calName;
				lEvent.startInputType = "utc";
				lEvent.endInputType = "utc";
			}

			const icsRespond = ics.createEvents(labeledEvents)
			if (icsRespond.error)
				throw icsRespond.error;

			const element = document.createElement('a');
			element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(icsRespond.value));
			element.setAttribute('download', calName + ".ics");

			element.style.display = 'none';
			document.body.appendChild(element);

			element.click();

			document.body.removeChild(element);
		}

		for (let i = 1; i <= zmanLister.jCal.getDate().monthsInYear; i++) {
			const monthICSData = [...icsParams]
			monthICSData[0] = [isoYear, i, 1, isoCalendar]
			giveData.push(monthICSData)
		}

		try {
			receiveData = await this.runMonths("/assets/js/features/icsPrepare.js", () => import('./icsPrepare.js'), giveData);
			await postDataReceive();
		} catch (error) {
			this.reportFailure(error);
		} finally {
			this.midDownload = false;
		}
	}

	/**
	 * Runs the export function once per month, each in its own worker when the browser has workers.
	 * Rejects as soon as one month fails; the workers are terminated either way.
	 * @param {string} workerURL
	 * @param {() => Promise<{ default: Function }>} load the same module, for browsers without workers
	 * @param {any[][]} giveData
	 * @returns {Promise<any[]>}
	 */
	async runMonths(workerURL, load, giveData) {
		if (!window.Worker) {
			const exportFunc = (await load()).default;
			const results = [];
			for (const monthData of giveData)
				results.push(await exportFunc.apply(exportFunc, monthData));
			return results;
		}

		const workers = giveData.map(() => spawnWorker(workerURL));
		try {
			return await Promise.all(workers.map((worker, index) => new Promise((resolve, reject) => {
				worker.addEventListener("message", message =>
					message.data?.error ? reject(new Error(message.data.error)) : resolve(message.data));
				worker.addEventListener("error", reject);
				worker.addEventListener("messageerror", reject);
				worker.postMessage(giveData[index]);
			})));
		} finally {
			workers.forEach(worker => worker.terminate());
		}
	}

	/** @param {unknown} error */
	reportFailure(error) {
		console.error("Export failed:", error);
		alert(settings.language() == "hb" ? "הייצוא נכשל. נא לנסות שוב." : "The export failed. Please try again.");
	}


	/**
	 * @function
	 * @template {any[]} A
	 * @param {A} values
	 * @returns {A}
	 */
	dedupICSEntries(values) {
		const setFromValues = new Set(values.map(value => JSON.stringify(value)));

		// @ts-ignore
		return [...setFromValues].map(value => JSON.parse(value));
	}

	/** @param {import('../zmanimListUpdater.js').default} zmanLister  */
	async handleExcel(zmanLister) {
		if (this.midDownload)
			return;

		this.midDownload = true;

		const exportZmanList = Object.fromEntries(Object.entries(zmanLister.zmanimList)
			// @ts-ignore
			.filter(([key]) => document.getElementById(`exportzmanid-${key}`).checked))

		/** @type {[string, number, number, number, string]} */
		// @ts-ignore
		const glArgs = Object.values(settings.location).map(numberFunc => numberFunc())

		const { year: isoYear, calendarId: isoCalendar } = zmanLister.jCal.getDate()
		const calcInputs = workerCalcInputs(zmanLister, [isoYear, 1, 1, isoCalendar]);

		/** @type {Parameters<import('./excelPrepare.js')["default"]>} */
		const excelParams = [
			undefined,
			glArgs,
			calcInputs.config,
			zmanLister.jCal.getInIsrael(),
			exportZmanList,
			false,
			Object.keys(zmanLister.jCal.getAllLearning())
				// @ts-expect-error
				.filter(learn => document.getElementById(`exportlimudid-${learn}`).checked),
			{
				// @ts-ignore
				language: settings.language() == "hb" ? "he" : settings.language(),
				calcConfig: [settings.calendarToggle.rtKulah(), settings.customTimes.tzeithIssurMelakha()],
				seconds: settings.seconds(),
				timeFormat: settings.timeFormat(),
				refraction: calcInputs.refraction
			}
		]

		/** @type {ReturnType<import("./excelPrepare.js").default>[]} */
		let workerData = [];
		let giveData = [];

		const title = (!zmanLister.zmanCalc.config.fixedMil ? "Amudeh Hora'ah" : "Ohr Hachaim")
				+ ` Calendar (${isoYear}) - ` + zmanLister.geoLocation.getLocationName();

		const postDataReceive = async () => {
			const { utils, writeFile } = (await import('../../libraries/xlsx.js'));
			const wb = utils.book_new();

			if (settings.language() === 'hb') {
				wb.Workbook = { Views: [{ RTL: true }] };
			}

			const headerZemanimRow = Object.fromEntries(
				[['DATE', {'hb': "יום", en: 'DATE', "en-et": "DATE"}[settings.language()]]]
					.concat(Object.entries(exportZmanList).map(entry => [entry[0], entry[1].title[settings.language()]]))
			);

			const zemanimTableData = [...new Set(workerData.flatMap(workerData => workerData.zemanim).flat().map(field => JSON.stringify(field)))]
				.map(field => JSON.parse(field))
				.sort((a, b) => {
					const aDate = new Date(a.DATE.v).getTime();
					const bDate = new Date(b.DATE.v).getTime();
					return aDate - bDate;
				});

			const zemanimWs = utils.json_to_sheet([headerZemanimRow].concat(zemanimTableData), { skipHeader: true });
			utils.book_append_sheet(wb, zemanimWs, "Zemanim");

			const limudimHeaders = Object.fromEntries(
				[['DATE', {'hb': "יום", en: 'DATE', "en-et": "DATE"}[settings.language()]]]
				.concat([...document.querySelector('[data-zffind="DafYomi"]').children]
				.map(limud => [
					limud.querySelector('[data-zfreplace]').getAttribute('data-zfreplace'),
					limud.querySelector(`.lang-${settings.language().replace('en-et', 'et')}`).innerHTML
				])
				.filter(learn => document.getElementById(`exportlimudid-${learn[0]}`).checked))
			)

			const limudimTableData = [...new Set(workerData.flatMap(workerData => workerData.limudim).flat().map(field => JSON.stringify(field)))]
				.map(field => JSON.parse(field))
				.sort((a, b) => {
					const aDate = new Date(a.DATE.v).getTime();
					const bDate = new Date(b.DATE.v).getTime();
					return aDate - bDate;
				});

			const limudimWs = utils.json_to_sheet([limudimHeaders].concat(limudimTableData), { skipHeader: true });
			utils.book_append_sheet(wb, limudimWs, "Limudim");

			writeFile(wb, title + ".xlsx");
		}

		for (let i = 1; i <= zmanLister.jCal.getDate().monthsInYear; i++) {
			const monthExcelData = [...excelParams]
			monthExcelData[0] = [isoYear, i, 1, isoCalendar]
			giveData.push(monthExcelData)
		}

		try {
			workerData = await this.runMonths("/assets/js/features/excelPrepare.js", () => import('./excelPrepare.js'), giveData);
			await postDataReceive();
		} catch (error) {
			this.reportFailure(error);
		} finally {
			this.midDownload = false;
		}
	}
}