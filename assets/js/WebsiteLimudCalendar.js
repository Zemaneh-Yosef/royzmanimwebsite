// @ts-check

import { Parsha, TehilimYomi, MishnaYomi, Temporal } from "../libraries/kosherZmanim/kosher-zmanim.js"
import WebsiteCalendar, { HebrewNumberFormatter } from "./WebsiteCalendar.js";
export default
class WebsiteLimudCalendar extends WebsiteCalendar {
    static hebrewParshaMap = {
		[Parsha.NONE]: '',
		[Parsha.BERESHIS]: '\u05D1\u05E8\u05D0\u05E9\u05D9\u05EA',
		[Parsha.NOACH]: '\u05E0\u05D7',
		[Parsha.LECH_LECHA]: '\u05DC\u05DA \u05DC\u05DA',
		[Parsha.VAYERA]: '\u05D5\u05D9\u05E8\u05D0',
		[Parsha.CHAYEI_SARA]: '\u05D7\u05D9\u05D9 \u05E9\u05E8\u05D4',
		[Parsha.TOLDOS]: '\u05EA\u05D5\u05DC\u05D3\u05D5\u05EA',
		[Parsha.VAYETZEI]: '\u05D5\u05D9\u05E6\u05D0',
		[Parsha.VAYISHLACH]: '\u05D5\u05D9\u05E9\u05DC\u05D7',
		[Parsha.VAYESHEV]: '\u05D5\u05D9\u05E9\u05D1',
		[Parsha.MIKETZ]: '\u05DE\u05E7\u05E5',
		[Parsha.VAYIGASH]: '\u05D5\u05D9\u05D2\u05E9',
		[Parsha.VAYECHI]: '\u05D5\u05D9\u05D7\u05D9',
		[Parsha.SHEMOS]: '\u05E9\u05DE\u05D5\u05EA',
		[Parsha.VAERA]: '\u05D5\u05D0\u05E8\u05D0',
		[Parsha.BO]: '\u05D1\u05D0',
		[Parsha.BESHALACH]: '\u05D1\u05E9\u05DC\u05D7',
		[Parsha.YISRO]: '\u05D9\u05EA\u05E8\u05D5',
		[Parsha.MISHPATIM]: '\u05DE\u05E9\u05E4\u05D8\u05D9\u05DD',
		[Parsha.TERUMAH]: '\u05EA\u05E8\u05D5\u05DE\u05D4',
		[Parsha.TETZAVEH]: '\u05EA\u05E6\u05D5\u05D4',
		[Parsha.KI_SISA]: '\u05DB\u05D9 \u05EA\u05E9\u05D0',
		[Parsha.VAYAKHEL]: '\u05D5\u05D9\u05E7\u05D4\u05DC',
		[Parsha.PEKUDEI]: '\u05E4\u05E7\u05D5\u05D3\u05D9',
		[Parsha.VAYIKRA]: '\u05D5\u05D9\u05E7\u05E8\u05D0',
		[Parsha.TZAV]: '\u05E6\u05D5',
		[Parsha.SHMINI]: '\u05E9\u05DE\u05D9\u05E0\u05D9',
		[Parsha.TAZRIA]: '\u05EA\u05D6\u05E8\u05D9\u05E2',
		[Parsha.METZORA]: '\u05DE\u05E6\u05E8\u05E2',
		[Parsha.ACHREI_MOS]: '\u05D0\u05D7\u05E8\u05D9 \u05DE\u05D5\u05EA',
		[Parsha.KEDOSHIM]: '\u05E7\u05D3\u05D5\u05E9\u05D9\u05DD',
		[Parsha.EMOR]: '\u05D0\u05DE\u05D5\u05E8',
		[Parsha.BEHAR]: '\u05D1\u05D4\u05E8',
		[Parsha.BECHUKOSAI]: '\u05D1\u05D7\u05E7\u05EA\u05D9',
		[Parsha.BAMIDBAR]: '\u05D1\u05DE\u05D3\u05D1\u05E8',
		[Parsha.NASSO]: '\u05E0\u05E9\u05D0',
		[Parsha.BEHAALOSCHA]: '\u05D1\u05D4\u05E2\u05DC\u05EA\u05DA',
		[Parsha.SHLACH]: '\u05E9\u05DC\u05D7 \u05DC\u05DA',
		[Parsha.KORACH]: '\u05E7\u05E8\u05D7',
		[Parsha.CHUKAS]: '\u05D7\u05D5\u05E7\u05EA',
		[Parsha.BALAK]: '\u05D1\u05DC\u05E7',
		[Parsha.PINCHAS]: '\u05E4\u05D9\u05E0\u05D7\u05E1',
		[Parsha.MATOS]: '\u05DE\u05D8\u05D5\u05EA',
		[Parsha.MASEI]: '\u05DE\u05E1\u05E2\u05D9',
		[Parsha.DEVARIM]: '\u05D3\u05D1\u05E8\u05D9\u05DD',
		[Parsha.VAESCHANAN]: '\u05D5\u05D0\u05EA\u05D7\u05E0\u05DF',
		[Parsha.EIKEV]: '\u05E2\u05E7\u05D1',
		[Parsha.REEH]: '\u05E8\u05D0\u05D4',
		[Parsha.SHOFTIM]: '\u05E9\u05D5\u05E4\u05D8\u05D9\u05DD',
		[Parsha.KI_SEITZEI]: '\u05DB\u05D9 \u05EA\u05E6\u05D0',
		[Parsha.KI_SAVO]: '\u05DB\u05D9 \u05EA\u05D1\u05D5\u05D0',
		[Parsha.NITZAVIM]: '\u05E0\u05E6\u05D1\u05D9\u05DD',
		[Parsha.VAYEILECH]: '\u05D5\u05D9\u05DC\u05DA',
		[Parsha.HAAZINU]: '\u05D4\u05D0\u05D6\u05D9\u05E0\u05D5',
		[Parsha.VZOS_HABERACHA]: '\u05D5\u05D6\u05D0\u05EA \u05D4\u05D1\u05E8\u05DB\u05D4 ',
		[Parsha.VAYAKHEL_PEKUDEI]: '\u05D5\u05D9\u05E7\u05D4\u05DC \u05E4\u05E7\u05D5\u05D3\u05D9',
		[Parsha.TAZRIA_METZORA]: '\u05EA\u05D6\u05E8\u05D9\u05E2 \u05DE\u05E6\u05E8\u05E2',
		[Parsha.ACHREI_MOS_KEDOSHIM]: '\u05D0\u05D7\u05E8\u05D9 \u05DE\u05D5\u05EA \u05E7\u05D3\u05D5\u05E9\u05D9\u05DD',
		[Parsha.BEHAR_BECHUKOSAI]: '\u05D1\u05D4\u05E8 \u05D1\u05D7\u05E7\u05EA\u05D9',
		[Parsha.CHUKAS_BALAK]: '\u05D7\u05D5\u05E7\u05EA \u05D1\u05DC\u05E7',
		[Parsha.MATOS_MASEI]: '\u05DE\u05D8\u05D5\u05EA \u05DE\u05E1\u05E2\u05D9',
		[Parsha.NITZAVIM_VAYEILECH]: '\u05E0\u05E6\u05D1\u05D9\u05DD \u05D5\u05D9\u05DC\u05DA',
		[Parsha.SHKALIM]: '\u05E9\u05E7\u05DC\u05D9\u05DD',
		[Parsha.ZACHOR]: '\u05D6\u05DB\u05D5\u05E8',
		[Parsha.PARA]: '\u05E4\u05E8\u05D4',
		[Parsha.HACHODESH]: '\u05D4\u05D7\u05D3\u05E9',
		[Parsha.SHUVA]: '\u05E9\u05D5\u05D1\u05D4',
		[Parsha.SHIRA]: '\u05E9\u05D9\u05E8\u05D4',
		[Parsha.HAGADOL]: '\u05D4\u05D2\u05D3\u05D5\u05DC',
		[Parsha.CHAZON]: '\u05D7\u05D6\u05D5\u05DF',
		[Parsha.NACHAMU]: '\u05E0\u05D7\u05DE\u05D5',
	};

    getHebrewParasha() {
		return [
			WebsiteLimudCalendar.hebrewParshaMap[this.shabbat().getParshah()] || "No Parasha this week",
			WebsiteLimudCalendar.hebrewParshaMap[this.shabbat().getSpecialShabbos()]
		].filter(Boolean)
	}

	getAllLearning() {
		/** @type {Record<"dafBavli"|"DafYerushalmi"|"ccYomi"|"TehilimShvui"|"TehilimHodshi"|"MishnaYomi", string>} */
		const learning = {};
		const hNum = new HebrewNumberFormatter();

		if (this.getJewishYear() < 5684) {
			learning.dafBavli = "N/A. Daf Yomi (Bavli) was only created on Rosh Hashanah 5684"
		} else {
			const dafObject = this.getDafYomiBavli();
			learning.dafBavli =
				dafObject.getMasechta() + " " +
				hNum.formatHebrewNumber(dafObject.getDaf());
		}

		const dafYerushalmiObject = this.getDafYomiYerushalmi();
		if (!dafYerushalmiObject || dafYerushalmiObject.getDaf() == 0) {
			learning.DafYerushalmi = "N/A";
		} else {
			learning.DafYerushalmi = dafYerushalmiObject.getMasechta() + " " + hNum.formatHebrewNumber(dafYerushalmiObject.getDaf());
		}

		const chafetzChayimYomi = this.getChafetzChayimYomi();
		learning.ccYomi = (chafetzChayimYomi.title + (chafetzChayimYomi.section ? (": " + chafetzChayimYomi.section) : "")) || "N/A";

		learning.TehilimShvui = TehilimYomi.byWeek(this).map(num => num.toString()).join(' - ');
		learning.TehilimHodshi = TehilimYomi.byDayOfMonth(this).map(met => met.toString()).join(' - ');

		learning.MishnaYomi = MishnaYomi.getMishnaForDate(this, true) || "N/A";

		return learning;
	}

	getWeeklyLearning() {
		/** @type {Record<"dafBavliWeek", string>} */
		const learning = {};
		const hNum = new HebrewNumberFormatter();

		// --- WEEKLY DAF YOMI RANGE ---
		const today = this.getDate(); // Temporal.PlainDate
		const dayOfWeek = today.dayOfWeek; // 1=Monday ... 7=Sunday (ISO)

		// Convert ISO to Jewish week: Sunday=1 ... Shabbat=7
		const offsetToSunday = (dayOfWeek === 7 ? 0 : dayOfWeek); 
		const sunday = today.subtract({ days: offsetToSunday });
		const shabbat = sunday.add({ days: 6 });

		/** @param {Temporal.PlainDate} date */
		const getDafForDate = (date) => {
			const calc = this.clone(); // or however you recompute for a different date
			calc.setDate(date);
			return calc.getDafYomiBavli();
		};

		const dafStart = getDafForDate(sunday);
		const dafEnd = getDafForDate(shabbat);

		const masechtaStart = dafStart.getMasechta();
		const masechtaEnd = dafEnd.getMasechta();

		const dafStartNum = hNum.formatHebrewNumber(dafStart.getDaf());
		const dafEndNum = hNum.formatHebrewNumber(dafEnd.getDaf());

		let weeklyString;

		if (masechtaStart === masechtaEnd) {
			// Same masechta all week
			weeklyString =
				`${masechtaStart} ${dafStartNum} – ${dafEndNum}`;
		} else {
			// Masechta changes mid‑week
			weeklyString =
				`${masechtaStart} ${dafStartNum} → ${masechtaEnd} ${dafEndNum}`;
		}

		learning.dafBavliWeek = weeklyString;

		return learning;
	}
}

