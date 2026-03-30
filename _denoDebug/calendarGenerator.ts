import { ZemanimMathBase } from '../assets/js/ROYZmanim.js';
import * as KosherZmanim from '../assets/libraries/kosherZmanim/kosher-zmanim.js'
import { Temporal } from '../assets/libraries/kosherZmanim/kosher-zmanim.js'

const dates = [
	Temporal.PlainDate.from({ year: 2025, month: 3, day: 20 }),
	Temporal.PlainDate.from({ year: 2025, month: 6, day: 20 }),
	Temporal.PlainDate.from({ year: 2025, month: 12, day: 20 })
]

const locales = [
	new KosherZmanim.GeoLocation("Miami, USA", 25.7743, -80.1937, 6, "America/New_York"),
	new KosherZmanim.GeoLocation("Jerusalem, Israel", 31.7690, 35.2163, 786, "Asia/Jerusalem"),
	new KosherZmanim.GeoLocation("Baghdad, Iraq", 33.3406, 44.4009, 41, "Asia/Baghdad"),
	new KosherZmanim.GeoLocation("Los Angeles, USA", 34.0522, -118.2437, 96, "America/Los_Angeles"),
	new KosherZmanim.GeoLocation("Tehran, Iran", 35.6944, 51.4215, 1263, "Asia/Tehran"),
	new KosherZmanim.GeoLocation("Gibraltar", 36.1447, -5.3526, 11, "Europe/Gibraltar"),
	new KosherZmanim.GeoLocation("Tunis, Tunisia", 36.81897, 10.16579, 23, "Africa/Tunis"),
	new KosherZmanim.GeoLocation("Baltimore, USA", 39.2904, -76.6122, 35, "America/New_York"),
	new KosherZmanim.GeoLocation("Deal, New Jersey, USA", 40.243168, -74.000693, 8, "America/New_York"),
	new KosherZmanim.GeoLocation("Thessaloniki, Greece", 40.6436, 22.9309, 8, "Europe/Athens"),
	new KosherZmanim.GeoLocation("Brooklyn, New York, USA", 40.6501, -73.9496, 18, "America/New_York"),
	new KosherZmanim.GeoLocation("Toronto, Canada", 43.7001, -79.4163, 175, "America/Toronto"),
	new KosherZmanim.GeoLocation("Montreal, Canada", 45.5088, -73.5878, 216, "America/Toronto"),
	new KosherZmanim.GeoLocation("Vienna, Austria", 48.2085, 16.3721, 193, "Europe/Vienna"),
	new KosherZmanim.GeoLocation("Paris, France", 48.8534, 2.3488, 42, "Europe/Paris"),
	new KosherZmanim.GeoLocation("London, UK", 51.5085, -0.1257, 25, "Europe/London"),
	new KosherZmanim.GeoLocation("Amsterdam, Netherlands", 52.3740, 4.8897, 13, "Europe/Amsterdam"),
	new KosherZmanim.GeoLocation("Manchester, UK", 53.48095, -2.23743, 38, "Europe/London")
];

class OhrHachaim extends ZemanimMathBase {
	static getTitle() {
		return "O'H";
	}

	getAlotHashahar() {
		return this.timeRange.current.sunrise
			.subtract(this.fixedToSeasonal(Temporal.Duration.from({ minutes: 72 })))
	}

	getTzet() {
		return this.timeRange.current.sunset
			.add(this.fixedToSeasonal(Temporal.Duration.from({ minutes: 13, seconds: 30 })))
	}
}

class AmudehHoraah extends ZemanimMathBase {
	static getTitle() {
		return 'A"H';
	}

	getAlotHashahar() {
		return this.timeRange.current.sunrise
			.subtract(this.fixedToSeasonal(this.durationOfEquinoxDegreeSeasonalHour(16.04, false)))
	}

	getTzet() {
		return this.timeRange.current.sunset
			.add(this.fixedToSeasonal(this.durationOfEquinoxDegreeSeasonalHour(3.7, true)))
	}
}

class FixedMinutes extends ZemanimMathBase {
	static getTitle() {
		return "FixedMin";
	}
	getAlotHashahar() {
		return this.timeRange.current.sunrise
			.subtract({ minutes: 72 })
	}

	getTzet() {
		return this.timeRange.current.sunset.add({ minutes: 13, seconds: 30 })
	}
}

class DegreeMinutes extends ZemanimMathBase {
	static getTitle() {
		return 'Deg';
	}
	getAlotHashahar() {
		const deg = this.coreZC.getSunriseOffsetByDegrees(106.04)
		return deg || this.chainDate(this.coreZC.getDate().subtract({ days: 1 })).coreZC.getSolarMidnight()
	}

	getTzet() {
		return this.coreZC.getSunsetOffsetByDegrees(93.7);
	}
}

const calendarClasses = [
	OhrHachaim,
	AmudehHoraah,
	FixedMinutes,
	DegreeMinutes
]

function formatDate (zDT: Temporal.ZonedDateTime) {
	console.log(zDT)
	return zDT.toPlainTime().toLocaleString('he')
}

const resultData:Map<string, Map<KosherZmanim.GeoLocation, Map<Temporal.PlainDate, Record<"dawn"|"nightfall", Record<'range'|'duration'|'degree', string>>>>> = new Map();
for (const calendarClass of calendarClasses) {
	resultData.set(calendarClass.getTitle(), new Map())
	for (const locale of locales) {
		const cal = new calendarClass(locale);
		resultData.get(calendarClass.getTitle()).set(locale, new Map())
		for (const date of dates) {
			cal.setDate(date);

			const astCalc = cal.coreZC.getAstronomicalCalculator() as KosherZmanim.NOAACalculator

			console.log(calendarClass.getTitle(), locale.getLocationName(), date.toLocaleString())
			resultData.get(calendarClass.getTitle()).get(locale).set(date, {
				"dawn": {
					"range": [cal.getAlotHashahar(), cal.timeRange.current.sunrise]
						.map(formatDate)
						.join(" - "),
					"duration": cal.timeRange.current.sunrise.since(cal.getAlotHashahar())
						.total("minute")
						.toFixed(2),
					"degree": astCalc.getSolarElevation(cal.getAlotHashahar().toPlainDateTime(), locale)
						.toFixed(2)
				},
				"nightfall": {
					"range": [cal.timeRange.current.sunset, cal.getTzet()]
						.map(formatDate)
						.join(" - "),
					"duration": cal.timeRange.current.sunset.until(cal.getTzet())
						.total("minute")
						.toFixed(2),
					"degree": astCalc.getSolarElevation(cal.getTzet().toPlainDateTime(), locale)
						.toFixed(2)
				}
			})
		}
	}
}

console.log(resultData)
const output = Object.fromEntries(
    [...resultData.entries()].map(([className, localeMap]) => [
        className,
        Object.fromEntries(
            [...localeMap.entries()].map(([locale, dateMap]) => [
                locale.getLocationName(),
                Object.fromEntries(
                    [...dateMap.entries()].map(([date, data]) => [
                        date.toString(),
                        data
                    ])
                )
            ])
        )
    ])
);

await Deno.writeTextFile('zmanim_results.json', JSON.stringify(output, null, 2));