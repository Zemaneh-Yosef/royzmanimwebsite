// @ts-check

import { settings } from "../settings/handler.js";
import WebsiteCalendar from "../WebsiteCalendar.js";

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

		/** @type {Parameters<import('./icsPrepare.js')["default"]>} */
		const icsParams = [
			undefined,
			glArgs,
			zmanLister.zmanCalc.config,
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
						const [ he, et, en ] = [...heading.children]
							.map(langElem => {
								while (langElem.querySelector('[data-zfFind="erevTzom"]'))
									langElem.querySelector('[data-zfFind="erevTzom"]').remove()

								return langElem.innerHTML.replace(/<.*?>/gm, '');
							})

						return [heading.getAttribute("data-zfFind"), { he, "en-et": et, en }]
					})),
				tahanun: Object.fromEntries([...document.querySelector('[data-zfFind="Tachanun"]').children]
					.map(/** @returns {[string, string|{"he": string; "en-et": string; "en": string}]} */
						tachObj =>
						[
						tachObj.getAttribute('data-zfFind'),
						// @ts-ignore
						tachObj.childElementCount == 0
							? tachObj.innerHTML
							: Object.fromEntries([...tachObj.children]
								.map(langElem => [
									langElem.classList.values().find(cl => cl.startsWith('lang-')).replace('lang-', '').replace('hb', 'he'),
									langElem.innerHTML
								]))
					])),
				netzTimes: zmanLister.zmanCalc.vSunrise.preservedInts,
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
								titleElem.classList.values().find(cl => cl.startsWith('lang-')).replace('lang-', '').replace('hb', 'he'),
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

			receiveData = receiveData.flat()
			zmanLister.zmanCalc.tekufaCalc.calculateTekufotShemuel(!zmanLister.zmanCalc.config.fixedMil)
				.forEach((tekufa, index) => {
					if (tekufa.year != zmanLister.jCal.getGregorianYear())
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
						[index]

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
			this.midDownload = false;
		}

		for (let i = 1; i <= zmanLister.jCal.getDate().monthsInYear; i++) {
			const monthICSData = [...icsParams]
			monthICSData[0] = [isoYear, i, 1, isoCalendar]
			giveData.push(monthICSData)
		}

		for (const monthICSData of giveData) {
			if (window.Worker) {
				console.log('activate thread')
				const myWorker = new Worker("/assets/js/features/icsPrepare.js", { type: "module" });
				myWorker.postMessage(monthICSData)
				myWorker.addEventListener("message", async (message) => {
					console.log("received message from other thread");
					receiveData.push(await message.data)
					if (receiveData.length == giveData.length)
						await postDataReceive();
				})
			} else {
				const icsExport = (await import('./icsPrepare.js')).default;
				const icsData = icsExport.apply(icsExport, monthICSData);
				receiveData.push(await icsData);
				if (receiveData.length == giveData.length)
					await postDataReceive();
			}
		}
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

		let availableVS = zmanLister.zmanCalc.vSunrise.preservedInts;

		/** @type {Parameters<import('./excelPrepare.js')["default"]>} */
		const excelParams = [
			undefined,
			glArgs,
			zmanLister.zmanCalc.config,
			zmanLister.jCal.getInIsrael(),
			exportZmanList,
			false,
			{
				// @ts-ignore
				language: settings.language() == "hb" ? "he" : settings.language(),
				calcConfig: [settings.calendarToggle.rtKulah(), settings.customTimes.tzeithIssurMelakha()],
				seconds: settings.seconds(),
				timeFormat: settings.timeFormat(),
				netzTimes: availableVS
			}
		]

		/** @type {Parameters<import('../../libraries/xlsx.mjs')["utils"]["json_to_sheet"]>[1][]} */
		let workerData = [];
		let giveData = [];

		const title = (!zmanLister.zmanCalc.config.fixedMil ? "Amudeh Hora'ah" : "Ohr Hachaim")
				+ ` Calendar (${isoYear}) - ` + zmanLister.geoLocation.getLocationName();

		const postDataReceive = async () => {
			const headerRow = Object.fromEntries(
				[['DATE', {'hb': "יום", en: 'DATE', "en-et": "DATE"}[settings.language()]]]
					.concat(Object.entries(exportZmanList).map(entry => [entry[0], entry[1].title[settings.language()]]))
			);

			const tableData = [...new Set(workerData.flat().map(field => JSON.stringify(field)))]
				.map(field => JSON.parse(field))
				.sort((a, b) => {
					const aDate = new Date(a.DATE.v).getTime();
					const bDate = new Date(b.DATE.v).getTime();
					return aDate - bDate;
				});

			const { utils, writeFile } = (await import('../../libraries/xlsx.mjs'));
			const ws = utils.json_to_sheet([headerRow].concat(tableData), { skipHeader: true });
			const wb = utils.book_new();
			utils.book_append_sheet(wb, ws, "People");
			writeFile(wb, title + ".xlsx");

			this.midDownload = false;
		}

		for (let i = 1; i <= zmanLister.jCal.getDate().monthsInYear; i++) {
			const monthExcelData = [...excelParams]
			monthExcelData[0] = [isoYear, i, 1, isoCalendar]
			giveData.push(monthExcelData)
		}

		for (const monthExcelData of giveData) {
			if (window.Worker) {
				const myWorker = new Worker("/assets/js/features/excelPrepare.js", { type: "module" });
				myWorker.postMessage(monthExcelData)
				myWorker.addEventListener("message", async (message) => {
					workerData.push(message.data);
					if (workerData.length == giveData.length)
						await postDataReceive();
				})
			} else {
				const excelExport = (await import('./excelPrepare.js')).default;
				const icsData = excelExport.apply(excelExport, monthExcelData);
				workerData.push(icsData);
				if (workerData.length == giveData.length)
					await postDataReceive();
			}
		}
	}
}