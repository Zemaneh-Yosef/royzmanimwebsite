// @ts-check

import * as KosherZmanim from "../../libraries/kosherZmanim/kosher-zmanim.esm.js";
import LimudCalendar from "../WebsiteLimudCalendar.js";

const jCal = new LimudCalendar(KosherZmanim.Temporal.Now.plainDateISO());

for (const [key, value] of Object.entries(jCal.getAllLearning()))
	if (document.querySelector(`[data-zfReplace="${key}"]`) instanceof HTMLElement)
		document.querySelector(`[data-zfReplace="${key}"]`).innerHTML = value;

const hiloulahIndex = new KosherZmanim.HiloulahYomiCalculator();
await hiloulahIndex.init();

const leilouNishmat = hiloulahIndex.getHiloulah(jCal)
for (let leilouNishmatList of document.querySelectorAll('[data-zfFind="hiloulah"]')) {
	while (leilouNishmatList.firstElementChild) {
		leilouNishmatList.firstElementChild.remove()
	}

	/** @type {'en'|'he'} */
	// @ts-ignore
	const hLang = leilouNishmatList.getAttribute('data-zfIndex')
	if (!leilouNishmat[hLang].length) {
		const li = document.createElement('li');
		li.classList.add('list-group-item');
		li.appendChild(document.createTextNode(leilouNishmatList.getAttribute('data-fillText')));
		leilouNishmatList.appendChild(li);

		continue;
	}

	for (const neshama of leilouNishmat[hLang]) {
		const li = document.createElement('li');
		li.classList.add('list-group-item');
		li.appendChild(document.createTextNode(neshama.name))

		leilouNishmatList.appendChild(li);
	}
}

const mishna = KosherZmanim.MishnaYomi.getMishnaForDate(jCal, true);
for (const mishnaYomiContainer of document.querySelectorAll('[data-zfReplace="MishnaYomi"]'))
	mishnaYomiContainer.innerHTML = mishna || "N/A";

const makamObj = await (await fetch("/assets/js/makamObj.json")).json();
const makamIndex = new KosherZmanim.Makam(makamObj.sefarimList);

const makam = makamIndex.getTodayMakam(jCal.shabbat());
for (const makamContainer of document.querySelectorAll('[data-zfReplace="makamot"]'))
	makamContainer.innerHTML += makam.makam
		.map(mak => (typeof mak == "number" ? makamObj.makamNameMapEng[mak] : mak))
		.join(" / ");