const messageDialogues = {
	alotHashachar: ["Dawn - עלות השחר - Alot HaShachar",
		`In Tanach this time is called Alot HaShachar (בראשית לב:כה), whereas in the gemara it is called Amud HaShachar.

		This is the time when the day begins according to halacha. Most mitzvot (commandments), Arvit for example, that take place at night are not allowed to be done after this time.
		After this time, mitzvot that must be done in the daytime are allowed to be done B'dieved (after the fact) or B'shaat hadachak (in a time of need). However, one should ideally wait until sunrise to do them L'chatchila (optimally).

		This time is calculated as 72 zmaniyot/seasonal minutes (according to the GR"A) before sunrise. Both sunrise and sunset have elevation included.`],
	talith: ["Earliest Talit/Tefilin - טלית ותפילין - Misheyakir",
		`Misheyakir (literally "when you recognize") is the time when a person can distinguish between blue and white. The gemara (ברכות ט) explains that when a person can distinguish between the blue (techelet) and white strings of their tzitzit, that is the earliest time a person can put on their talit and tefilin for shacharit.

		This time is calculated as 6 zmaniyot/seasonal minutes (according to the GR"A) after Alot HaShachar (Dawn).

		Note: This time is only for people who need to go to work or leave early in the morning to travel, however, normally a person should put on his talit/tefilin 60 regular minutes (and in the winter 50 regular minutes) before sunrise.`],
	endOfhames: ["Eating Chametz - אכילת חמץ - Achilat Chametz",
		`This is the latest time a person can eat chametz.
		
		This is calculated as 4 zmaniyot/seasonal hours, according to the Magen Avraham, after Alot HaShachar (Dawn) with elevation included. Since Chametz is a mitzvah from the torah, we are stringent and we use the Magen Avraham's time to calculate the last time a person can eat chametz.`],
	biurHames: ["Burning Chametz - ביעור חמץ - Biur Chametz",
		`This is the latest time a person can own chametz before pesach begins. You should get rid of all chametz in your possession by this time.

		This is calculated as 5 zmaniyot/seasonal hours, according to the MG"A, after Alot HaShachar (Dawn) with elevation included.`],
	sunrise: ["Sunrise - הנץ - HaNetz",
		`This is the earliest time when all mitzvot (commandments) that are to be done during the daytime are allowed to be performed L'chatchila (optimally). Halachic sunrise is defined as the moment when the top edge of the sun appears on the horizon while rising. Whereas, the gentiles define sunrise as the moment when the sun is halfway through the horizon. This halachic sunrise is called mishor (sea level) sunrise and it is what many jews rely on when praying for Netz.

		However, it should be noted that the Shulchan Aruch writes in Orach Chayim 89:1, "The mitzvah of shacharit starts at Netz, like it says in the pasuk/verse, 'יראוך עם שמש'". Based on this, the poskim write that a person should wait until the sun is VISIBLE to say shacharit. In Israel, the Ohr HaChaim calendar uses a table of sunrise times from the luach/calendar 'לוח ביכורי יוסף' (Luach Bechoray Yosef) each year. These times were made by Chaim Keller, creator of the ChaiTables website. Ideally, you should download these VISIBLE sunrise times from his website with the capability of this app to use for the year. However, if you did not download the times, you will see 'Mishor' or 'Sea Level' sunrise instead.`],
	shemaMGA: ["Shema MGA - שמע מג'א",
		`This is the latest time a person can fulfill his obligation to say Shma everyday according to the Magen Avraham.

		The Magen Avraham/Terumat HeDeshen calculate this time as 3 zmaniyot/seasonal hours after Alot HaShachar (Dawn). They calculate a zmaniyot/seasonal hour by taking the time between Alot HaShachar (Dawn) and Tzeit Hachocavim (Nightfall) of Rabbeinu Tam and divide it into 12 equal parts.`],
	shemaGRA: ["Shema GRA - שמע גר'א",
		`This is the latest time a person can fulfill his obligation to say Shma everyday according to the GR"A (HaGaon Rabbeinu Eliyahu)

		The GR"A calculates this time as 3 zmaniyot/seasonal hours after sunrise (elevation included). The GR"A calculates a zmaniyot/seasonal hour by taking the time between sunrise and sunset (elevation included) and divides it into 12 equal parts.`],
	berachotShemaGRA: ["Brachot Shma - ברכות שמע",
		`This is the latest time a person can say the Brachot Shma according to the GR"A. However, a person can still say Pisukei D'Zimra until Chatzot.
		
		The GR"A calculates this time as 4 zmaniyot/seasonal hours after sunrise (elevation included). The GR"A calculates a zmaniyot/seasonal hour by taking the time between sunrise and sunset (elevation included) and divides it into 12 equal parts.`],
	hatzoth: ["Chatzot - חצות",
		`This is the middle of the halachic day, when the sun is exactly in the middle of the sky relative to the length of the day. It should be noted, that the sun can only be directly above every person, such that they don't even have shadows, in the Tropic of Cancer and the Tropic of Capricorn. Everywhere else, the sun will be at an angle even in the middle of the day.
		
		After this time, you can no longer say the Amidah prayer of Shacharit, and you should preferably say Musaf before this time.
		
		This time is calculated as 6 zmaniyot/seasonal hours after sunrise. The GR"A calculates a zmaniyot/seasonal hour by taking the time between sunrise and sunset (elevation included) and divides it into 12 equal parts.`],
	minhaGedolah: ["Earliest Mincha - מנחה גדולה - Mincha Gedola",
		`Mincha Gedolah, literally "Greater Mincha", is the earliest time a person can say Mincha. It is also the preferred time a person should say Mincha according to some poskim.

		It is called Mincha Gedolah because there is a lot of time left until sunset.

		A person should ideally start saying Korbanot AFTER this time.

		This time is calculated as 30 regular minutes after Chatzot (Mid-day). However, if the zmaniyot/seasonal minutes are longer, we use those minutes instead to be stringent. The GR"A calculates a zmaniyot/seasonal hour by taking the time between sunrise and sunset (elevation included) and divides it into 12 equal parts. Then we divide one of those 12 parts into 60 to get a zmaniyot/seasonal minute.`],
	minhaKetana: ["Mincha Ketana - מנחה קטנה",
		`Mincha Ketana, literally "Lesser Mincha", is the most preferred time a person can say Mincha according to some poskim.
		
		It is called Mincha Ketana because there is less time left until sunset.
		
		This time is calculated as 9 and a half zmaniyot/seasonal hours after sunrise. The GR"A calculates a zmaniyot/seasonal hour by taking the time between sunrise and sunset (elevation included) and divides it into 12 equal parts. Then we divide one of those 12 parts into 60 to get a zmaniyot/seasonal minute.`],
	plagMinha: ["Plag Hamincha - פלג המנחה",
		`Plag HaMincha, literally "Half of Mincha", is the midpoint between Mincha Ketana and sunset. Since Mincha Ketana is 2 and a half hours before sunset, Plag is half of that at an hour and 15 minutes before sunset.
		You can start saying arvit by this time according to Rabbi Yehuda in (ברכות כ'ו ע'א).
		
		A person should not accept shabbat before this time as well.
		
		This time is usually calculated as 10 and 3/4th zmaniyot/seasonal hours after sunrise, however, yalkut yosef says to calculate it as 1 hour and 15 zmaniyot/seasonal minutes before tzeit. The GR"A calculates a zmaniyot/seasonal hour by taking the time between sunrise and sunset (elevation included) and divides it into 12 equal parts. Then we divide one of those 12 parts into 60 to get a zmaniyot/seasonal minute.`],
	candleLighting: ["Candle Lighting - הדלקת נרות",
		`This is the ideal time for a person to light the candles before shabbat/chag starts.
		When there is candle lighting on a day that is Yom tov/Shabbat before another day that is Yom tov, the candles are lit after Tzeit/Nightfall. However, if the next day is Shabbat, the candles are lit at their usual time.
		
		This time is calculated as ${zmanimCalendar.getCandleLightingOffset()} regular minutes before sunset (elevation included).`],
	sunset: ["Sunset - שקיעה",
		`This is the time of the day that the day starts to transition into the next day according to halacha.

		Halachic sunset is defined as the moment when the top edge of the sun disappears on the horizon while setting (elevation included). Whereas, the gentiles define sunset as the moment when the sun is halfway through the horizon.

		Immediately after the sun sets, Bein Hashmashot/twilight starts according to the Geonim, however, according to Rabbeinu Tam the sun continues to set for another 58.5 minutes and only after that Bein Hashmashot starts for another 13.5 minutes.

		It should be noted that many poskim, like the Mishna Berura, say that a person should ideally say mincha BEFORE sunset and not before Tzeit/Nightfall.

		Most mitzvot that are to be done during the day should ideally be done before this time.`],
	tseith: ["Nightfall - צאת הכוכבים - Tzeit Hacochavim",
		`Tzeit/Nightfall is the time when the next halachic day starts after Bein Hashmashot/twilight finishes.
		
		This is the latest time a person can say Mincha according Rav Ovadiah Yosef Z"TL. A person should start mincha at least 2 minutes before this time.
		
		This time is calculated as 13 and a half zmaniyot/seasonal minutes after sunset (elevation included). The GR"A calculates a zmaniyot/seasonal hour by taking the time between sunrise and sunset (elevation included) and divides it into 12 equal parts. Then we divide one of those 12 parts into 60 to get a zmaniyot/seasonal minute.`],
	tseithTaanith: ["Fast Ends - צאת תענית - Tzeit Taanit",
		`This is the time that the fast/taanit ends.

		This time is calculated as 20 regular minutes after sunset (elevation included).`],
	tseithTaanithLehumra: ["Fast Ends (Stringent) - צאת תענית לחומרה - Tzeit Taanit L'Chumra",
		`This is the more stringent time that the fast/taanit ends. This time is according to the opinion of Chacham Ben Zion Abba Shaul.
		
		This time is calculated as 30 regular minutes after sunset (elevation included).`],
	tseithShabbath: ["Shabbat/Chag Ends - צאת שבת/חג - Tzeit Shabbat/Chag",
		`This is the time that Shabbat/Chag ends.

		Note that there are many customs on when shabbat ends, by default, I set it to 40 regular minutes after sunset (elevation included), however, you can change the time in the settings.

		This time is calculated as ${zmanimCalendar.getAteretTorahSunsetOffset()} regular minutes after sunset (elevation included).`],
	rabbenuTam: ["Rabbeinu Tam - רבינו תם",
		`This time is Tzeit/Nightfall according to Rabbeinu Tam.

		Tzeit/Nightfall is the time when the next halachic day starts after Bein Hashmashot/twilight finishes.
		
		This time is calculated as 72 zmaniyot/seasonal minutes after sunset (elevation included). According to Rabbeinu Tam, these 72 minutes are made up of 2 parts. The first part is 58 and a half minutes until the second sunset (see Pesachim 94a and Tosafot there). After the second sunset, there are an additional 13.5 minutes until Tzeit/Nightfall.

		The GR"A calculates a zmaniyot/seasonal hour by taking the time between sunrise and sunset (elevation included) and divides it into 12 equal parts. Then we divide one of those 12 parts into 60 to get a zmaniyot/seasonal minute in order to calculate 72 minutes. Another way of calculating this time is by calculating how many minutes are between sunrise and sunset. Take that number and divide it by 10, and then add the result to sunset. The app uses the first method.`],
	hatsothNight: ["Midnight - חצות לילה - Chatzot Layla",
		`This is the middle of the halachic night, when the sun is exactly in the middle of the sky beneath us.

		This time is calculated as 6 zmaniyot/seasonal hours after sunset. The GR"A calculates a zmaniyot/seasonal hour by taking the time between sunrise and sunset (elevation included) and divides it into 12 equal parts.`]
}

function showModal(identifier) {
	const modal = document.getElementById('explanationModal');
	modal.querySelector('h1').innerHTML = messageDialogues[identifier][0]
	modal.querySelector('.modal-body').innerHTML = messageDialogues[identifier][1].replaceAll('	', '').replaceAll('\n', '<br>')

	new bootstrap.Modal(modal).show()
}