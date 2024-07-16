// @ts-check

import * as KosherZmanim from "../../libraries/kosherZmanim/kosher-zmanim.esm.js";
import { HebrewNumberFormatter } from "../WebsiteCalendar.js";
const hiloulahIndex = new KosherZmanim.HiloulahYomiCalculator();
const jCal = new KosherZmanim.JewishCalendar();

const hNum = new HebrewNumberFormatter();

const daf = document.querySelector('[data-zfReplace="dafBavli"]');
const dafYerushalmi = document.querySelector('[data-zfReplace="DafYerushalmi"]');

if (jCal.getJewishYear() < 5684) {
	daf.innerHTML = "N/A. Daf Yomi (Bavli) was only created on Rosh Hashanah 5684 and continues onto this day"
} else {
	const dafObject = jCal.getDafYomiBavli();
	daf.innerHTML =
		dafObject.getMasechta() + " " +
		hNum.formatHebrewNumber(dafObject.getDaf());
}

const dafYerushalmiObject = jCal.getDafYomiYerushalmi();
if (!dafYerushalmiObject || dafYerushalmiObject.getDaf() == 0) {
	dafYerushalmi.innerHTML = "N/A";
} else {
	dafYerushalmi.innerHTML = dafYerushalmiObject.getMasechta() + " " + hNum.formatHebrewNumber(dafYerushalmiObject.getDaf());
}

const chafetzChayimYomi = jCal.getChafetzChayimYomi();
document.querySelector('[data-zfReplace="ccYomi"]').innerHTML = (chafetzChayimYomi.title + (chafetzChayimYomi.section ? (": " + chafetzChayimYomi.section) : "")) || "N/A";

const leilouNishmat = await hiloulahIndex.getHiloulah(jCal)
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