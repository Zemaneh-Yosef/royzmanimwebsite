function AlotDialog() {
    $("#dialogMessage").html("In Tanach this time is called Alot HaShachar (בראשית לב:כה), whereas in the gemara it is called Amud HaShachar.\n\n" +
    "This is the time when the day begins according to halacha. " +
    "Most mitzvot (commandments), Arvit for example, that take place at night are not allowed " +
    "to be done after this time.\nAfter this time, mitzvot that must be done in the daytime are " +
    "allowed to be done B'dieved (after the fact) or B'shaat hadachak (in a time of need). However, one should ideally wait " +
    "until sunrise to do them L'chatchila (optimally).\n\n" +
    "This time is calculated as 72 zmaniyot/seasonal minutes (according to the GR\"A) before sunrise. Both sunrise and sunset " +
    "have elevation included.");

    $("#dialog").dialog({
        modal: true,
        title: "Dawn - עלות השחר - Alot HaShachar",
        width: 300,
        height: 600,
        buttons: {
            "Close": function () {
                $(this).dialog('close');
            }
        }
    });
}

function TalitDialog() {
    $("#dialogMessage").html("Misheyakir (literally \"when you recognize\") is the time when a person can distinguish between blue and white. " +
    "The gemara (ברכות ט) explains that when a person can distinguish between the blue (techelet) and white strings " +
    "of their tzitzit, that is the earliest time a person can put on their talit and tefilin for shacharit.\n\n" +
    "This time is calculated as 6 zmaniyot/seasonal minutes (according to the GR\"A) after Alot HaShachar (Dawn).\n\n" +
    "Note: This time is only for people who need to go to work or leave early in the morning to travel, however, normally a " +
    "person should put on his talit/tefilin 60 regular minutes (and in the winter 50 regular minutes) before sunrise.");

    $("#dialog").dialog({
        modal: true,
        title: "Earliest Talit/Tefilin - טלית ותפילין - Misheyakir",
        width: 300,
        height: 600,
        buttons: {
            "Close": function () {
                $(this).dialog('close');
            }
        }
    });
}

function SofZmanAchilatChametzDialog() {
    $("#dialogMessage").html("This is the latest time a person can eat chametz.\n\n" +
    "This is calculated as 4 zmaniyot/seasonal hours, according to the Magen Avraham, after Alot HaShachar (Dawn) with " +
    "elevation included. Since Chametz is a mitzvah from the torah, we are stringent and we use the Magen Avraham's time to " +
    "calculate the last time a person can eat chametz.");

    $("#dialog").dialog({
        modal: true,
        title: "Eating Chametz - אכילת חמץ - Achilat Chametz",
        width: 300,
        height: 600,
        buttons: {
            "Close": function () {
                $(this).dialog('close');
            }
        }
    });
}

function SofZmanBiurChametzDialog() {
    $("#dialogMessage").html("This is the latest time a person can own chametz before pesach begins. You should get rid of all chametz in your " +
    "possession by this time.\n\n" +
    "This is calculated as 5 zmaniyot/seasonal hours, according to the MG\"A, after Alot HaShachar (Dawn) with " +
    "elevation included.");

    $("#dialog").dialog({
        modal: true,
        title: "Burning Chametz - ביעור חמץ - Biur Chametz",
        width: 300,
        height: 600,
        buttons: {
            "Close": function () {
                $(this).dialog('close');
            }
        }
    });
}

function SunriseDialog() {
    $("#dialogMessage").html("This is the earliest time when all mitzvot (commandments) that are to be done during the daytime are allowed to be " +
    "performed L'chatchila (optimally). Halachic sunrise is defined as the moment when the top edge of the sun appears on the " +
    "horizon while rising. Whereas, the gentiles define sunrise as the moment when the sun is halfway through the horizon. " +
    "This halachic sunrise is called mishor (sea level) sunrise and it is what many jews rely on when praying for Netz.\n\n" +
    "However, it should be noted that the Shulchan Aruch writes in Orach Chayim 89:1, \"The mitzvah of shacharit starts at " +
    "Netz, like it says in the pasuk/verse, 'יראוך עם שמש'\". Based on this, the poskim write that a person should wait until " +
    "the sun is VISIBLE to say shacharit. In Israel, the Ohr HaChaim calendar uses a table of sunrise times from the " +
    "luach/calendar 'לוח ביכורי יוסף' (Luach Bechoray Yosef) each year. These times were made by Chaim Keller, creator of the " +
    "ChaiTables website. Ideally, you should download these VISIBLE sunrise times from his website with the capability of " +
    "this app to use for the year. However, if you did not download the times, you will see 'Mishor' or 'Sea Level' sunrise instead.");

    $("#dialog").dialog({
        modal: true,
        title: "Sunrise - הנץ - HaNetz",
        width: 300,
        height: 600,
        buttons: {
            "Close": function () {
                $(this).dialog('close');
            }
        }
    });
}

function LatestShmaMGADialog() {
    $("#dialogMessage").html("This is the latest time a person can fulfill his obligation to say Shma everyday according to the Magen Avraham.\n\n" +
    "The Magen Avraham/Terumat HeDeshen calculate this time as 3 zmaniyot/seasonal hours after Alot HaShachar (Dawn). " +
    "They calculate a zmaniyot/seasonal hour by taking the time between Alot HaShachar (Dawn) and Tzeit Hachocavim (Nightfall) " +
    "of Rabbeinu Tam and divide it into 12 equal parts.");

    $("#dialog").dialog({
        modal: true,
        title: "Shema MGA - שמע מג'א",
        width: 300,
        height: 600,
        buttons: {
            "Close": function () {
                $(this).dialog('close');
            }
        }
    });
}

function LatestShmaGRADialog() {
    $("#dialogMessage").html("This is the latest time a person can fulfill his obligation to say Shma everyday according to the GR\"A " +
    "(HaGaon Rabbeinu Eliyahu)" +
    "\n\n" +
    "The GR\"A calculates this time as 3 zmaniyot/seasonal hours after sunrise (elevation included). " +
    "The GR\"A calculates a zmaniyot/seasonal hour by taking the time between sunrise and sunset (elevation included) and " +
    "divides it into 12 equal parts.");

    $("#dialog").dialog({
        modal: true,
        title: "Shema GRA - שמע גר'א",
        width: 300,
        height: 600,
        buttons: {
            "Close": function () {
                $(this).dialog('close');
            }
        }
    });
}

function LatestBerachotShmaGRADialog() {
    $("#dialogMessage").html("This is the latest time a person can say the Brachot Shma according to the GR\"A. However, a person can still say " +
    "Pisukei D'Zimra until Chatzot.\n\n" +
    "The GR\"A calculates this time as 4 zmaniyot/seasonal hours after sunrise (elevation included). " +
    "The GR\"A calculates a zmaniyot/seasonal hour by taking the time between sunrise and sunset (elevation included) and " +
    "divides it into 12 equal parts.");

    $("#dialog").dialog({
        modal: true,
        title: "Brachot Shma - ברכות שמע",
        width: 300,
        height: 600,
        buttons: {
            "Close": function () {
                $(this).dialog('close');
            }
        }
    });
}

function ChatzotDialog() {
    $("#dialogMessage").html("This is the middle of the halachic day, when the sun is exactly in the middle of the sky relative to the length of the" +
    " day. It should be noted, that the sun can only be directly above every person, such that they don't even have shadows, " +
    "in the Tropic of Cancer and the Tropic of Capricorn. Everywhere else, the sun will be at an angle even in the middle of " +
    "the day.\n\n" +
    "After this time, you can no longer say the Amidah prayer of Shacharit, and you should preferably say Musaf before this " +
    "time.\n\n" +
    "This time is calculated as 6 zmaniyot/seasonal hours after sunrise. " +
    "The GR\"A calculates a zmaniyot/seasonal hour by taking the time between sunrise and sunset (elevation included) and " +
    "divides it into 12 equal parts.\n\n");
    
    $("#dialog").dialog({
        modal: true,
        title: "Chatzot - חצות",
        width: 300,
        height: 600,
        buttons: {
            "Close": function () {
                $(this).dialog('close');
            }
        }
    });
}

function MinchaGedolaDialog() {
    $("#dialogMessage").html("Mincha Gedolah, literally \"Greater Mincha\", is the earliest time a person can say Mincha. " +
    "It is also the preferred time a person should say Mincha according to some poskim.\n\n" +
    "It is called Mincha Gedolah because there is a lot of time left until sunset.\n\n" +
    "A person should ideally start saying Korbanot AFTER this time.\n\n" +
    "This time is calculated as 30 regular minutes after Chatzot (Mid-day). However, if the zmaniyot/seasonal minutes are longer," +
    " we use those minutes instead to be stringent. " +
    "The GR\"A calculates a zmaniyot/seasonal hour by taking the time between sunrise and sunset (elevation included) and " +
    "divides it into 12 equal parts. Then we divide one of those 12 parts into 60 to get a zmaniyot/seasonal minute.");

    $("#dialog").dialog({
        modal: true,
        title: "Earliest Mincha - מנחה גדולה - Mincha Gedola",
        width: 300,
        height: 600,
        buttons: {
            "Close": function () {
                $(this).dialog('close');
            }
        }
    });
}

function MinchaKetanaDialog() {
    $("#dialogMessage").html("Mincha Ketana, literally \"Lesser Mincha\", is the most preferred time a person can say Mincha according to some poskim.\n\n" +
    "It is called Mincha Ketana because there is less time left until sunset.\n\n" +
    "This time is calculated as 9 and a half zmaniyot/seasonal hours after sunrise. " +
    "The GR\"A calculates a zmaniyot/seasonal hour by taking the time between sunrise and sunset (elevation included) and " +
    "divides it into 12 equal parts. Then we divide one of those 12 parts into 60 to get a zmaniyot/seasonal minute.");

    $("#dialog").dialog({
        modal: true,
        title: "Mincha Ketana - מנחה קטנה",
        width: 300,
        height: 600,
        buttons: {
            "Close": function () {
                $(this).dialog('close');
            }
        }
    });
}

function PlagDialog() {
    $("#dialogMessage").html("Plag HaMincha, literally \"Half of Mincha\", is the midpoint between Mincha Ketana and sunset. Since Mincha Ketana is " +
    "2 and a half hours before sunset, Plag is half of that at an hour and 15 minutes before sunset.\n" +
    "You can start saying arvit by this time according to Rabbi Yehuda in (ברכות כ'ו ע'א).\n\n" +
    "A person should not accept shabbat before this time as well.\n\n" +
    "This time is usually calculated as 10 and 3/4th zmaniyot/seasonal hours after sunrise, however, yalkut yosef says to " +
    "calculate it as 1 hour and 15 zmaniyot/seasonal minutes before tzeit. " +
    "The GR\"A calculates a zmaniyot/seasonal hour by taking the time between sunrise and sunset (elevation included) and " +
    "divides it into 12 equal parts. Then we divide one of those 12 parts into 60 to get a zmaniyot/seasonal minute.");

    $("#dialog").dialog({
        modal: true,
        title: "Plag Hamincha - פלג המנחה",
        width: 300,
        height: 600,
        buttons: {
            "Close": function () {
                $(this).dialog('close');
            }
        }
    });
}

function CandleLightingDialog() {
    $("#dialogMessage").html("This is the ideal time for a person to light the candles before shabbat/chag starts.\n" +
    "When there is candle lighting on a day that is Yom tov/Shabbat before another day that is Yom tov, " +
    "the candles are lit after Tzeit/Nightfall. However, if the next day is Shabbat, the candles are lit at their usual time.\n\n" +
    "This time is calculated as " +
    zmanimCalendar.getCandleLightingOffset() + " " +
    "regular minutes before sunset (elevation included).\n\n");

    $("#dialog").dialog({
        modal: true,
        title: "Candle Lighting - הדלקת נרות",
        width: 300,
        height: 600,
        buttons: {
            "Close": function () {
                $(this).dialog('close');
            }
        }
    });
}

function SunsetDialog() {
    $("#dialogMessage").html("This is the time of the day that the day starts to transition into the next day according to halacha.\n\n" +
    "Halachic sunset is defined as the moment when the top edge of the sun disappears on the " +
    "horizon while setting (elevation included). Whereas, the gentiles define sunset as the moment when the sun is halfway " +
    "through the horizon.\n\n" +
    "Immediately after the sun sets, Bein Hashmashot/twilight starts according to the Geonim, however, according to Rabbeinu Tam " +
    "the sun continues to set for another 58.5 minutes and only after that Bein Hashmashot starts for another 13.5 minutes.\n\n" +
    "It should be noted that many poskim, like the Mishna Berura, say that a person should ideally say mincha BEFORE sunset " +
    "and not before Tzeit/Nightfall.\n\n" +
    "Most mitzvot that are to be done during the day should ideally be done before this time.");

    $("#dialog").dialog({
        modal: true,
        title: "Sunset - שקיעה",
        width: 300,
        height: 600,
        buttons: {
            "Close": function () {
                $(this).dialog('close');
            }
        }
    });
}

function TzeitDialog() {
    $("#dialogMessage").html("Tzeit/Nightfall is the time when the next halachic day starts after Bein Hashmashot/twilight finishes.\n\n" +
    "This is the latest time a person can say Mincha according Rav Ovadiah Yosef Z\"TL. A person should start mincha at " +
    "least 2 minutes before this time.\n\n" +
    "This time is calculated as 13 and a half zmaniyot/seasonal minutes after sunset (elevation included). " +
    "The GR\"A calculates a zmaniyot/seasonal hour by taking the time between sunrise and sunset (elevation included) and " +
    "divides it into 12 equal parts. Then we divide one of those 12 parts into 60 to get a zmaniyot/seasonal minute.");

    $("#dialog").dialog({
        modal: true,
        title: "Nightfall - צאת הכוכבים - Tzeit Hacochavim",
        width: 300,
        height: 600,
        buttons: {
            "Close": function () {
                $(this).dialog('close');
            }
        }
    });
}

function TzaitTaanitDialog() {
    $("#dialogMessage").html("This is the time that the fast/taanit ends.\n\n" +
    "This time is calculated as 20 regular minutes after sunset (elevation included).");

    $("#dialog").dialog({
        modal: true,
        title: "Fast Ends - צאת תענית - Tzeit Taanit",
        width: 300,
        height: 600,
        buttons: {
            "Close": function () {
                $(this).dialog('close');
            }
        }
    });
}

function TzaitTaanitLChumraDialog() {
    $("#dialogMessage").html("This is the more stringent time that the fast/taanit ends. This time is according to the opinion of Chacham Ben Zion Abba Shaul\n\n" +
    "This time is calculated as 30 regular minutes after sunset (elevation included).");

    $("#dialog").dialog({
        modal: true,
        title: "Fast Ends (Stringent) - צאת תענית לחומרה - Tzeit Taanit L'Chumra",
        width: 300,
        height: 600,
        buttons: {
            "Close": function () {
                $(this).dialog('close');
            }
        }
    });
}

function TzaitShabbatDialog() {
    $("#dialogMessage").html("This is the time that Shabbat/Chag ends.\n\n" +
    "Note that there are many customs on when shabbat ends, by default, I set it to 40 regular minutes after sunset (elevation " +
    "included), however, you can change the time in the settings.\n\n" +
    "This time is calculated as " +
    zmanimCalendar.getAteretTorahSunsetOffset() + " " +
    "regular minutes after sunset (elevation included).");

    $("#dialog").dialog({
        modal: true,
        title: "Shabbat/Chag Ends - צאת שבת/חג - Tzeit Shabbat/Chag",
        width: 300,
        height: 600,
        buttons: {
            "Close": function () {
                $(this).dialog('close');
            }
        }
    });
}

function RabbeinuTamDialog() {
    $("#dialogMessage").html("This time is Tzeit/Nightfall according to Rabbeinu Tam.\n\n" +
    "Tzeit/Nightfall is the time when the next halachic day starts after Bein Hashmashot/twilight finishes.\n\n" +
    "This time is calculated as 72 zmaniyot/seasonal minutes after sunset (elevation included). " +
    "According to Rabbeinu Tam, these 72 minutes are made up of 2 parts. The first part is 58 and a half minutes until the " +
    "second sunset (see Pesachim 94a and Tosafot there). After the second sunset, there are an additional 13.5 minutes until " +
    "Tzeit/Nightfall.\n\n" +
    "The GR\"A calculates a zmaniyot/seasonal hour by taking the time between sunrise and sunset (elevation included) and " +
    "divides it into 12 equal parts. Then we divide one of those 12 parts into 60 to get a zmaniyot/seasonal minute in order " +
    "to calculate 72 minutes. Another way of calculating this time is by calculating how many minutes are between sunrise and " +
    "sunset. Take that number and divide it by 10, and then add the result to sunset. The app uses the first method.");

    $("#dialog").dialog({
        modal: true,
        title: "Rabbeinu Tam - רבינו תם",
        width: 300,
        height: 600,
        buttons: {
            "Close": function () {
                $(this).dialog('close');
            }
        }
    });
}

function ChatzotLaylaDialog() {
    $("#dialogMessage").html("This is the middle of the halachic night, when the sun is exactly in the middle of the sky beneath us.\n\n" +
    "This time is calculated as 6 zmaniyot/seasonal hours after sunset. " +
    "The GR\"A calculates a zmaniyot/seasonal hour by taking the time between sunrise and sunset (elevation included) and " +
    "divides it into 12 equal parts.\n\n");

    $("#dialog").dialog({
        modal: true,
        title: "Midnight - חצות לילה - Chatzot Layla",
        width: 300,
        height: 600,
        buttons: {
            "Close": function () {
                $(this).dialog('close');
            }
        }
    });
}