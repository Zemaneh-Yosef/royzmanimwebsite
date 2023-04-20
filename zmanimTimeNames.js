var isZmanimInHebrew = false;
var isZmanimInTranslatedEnglish = false;

function getAlotString() {
  if (isZmanimInHebrew) {
    return "עלות השחר";
  }
  if (isZmanimInTranslatedEnglish) {
    return "Dawn";
  }
  return "Alot Hashachar";
}

function getTalitTefilinString() {
  if (isZmanimInHebrew) {
    return "טלית ותפילין";
  }
  return "Earliest Talit and Tefilin";
}

function getMishorSunriseString() {
  if (isZmanimInHebrew) {
    return "הנץ (משור)";
  }
  if (isZmanimInTranslatedEnglish) {
    return "Sunrise (Sea Level)";
  }
  return "HaNetz (Mishor)";
}

function getLatestShmaMGAString() {
  if (isZmanimInHebrew) {
    return "סוף זמן שמע מג'א";
  }
  if (isZmanimInTranslatedEnglish) {
    return "Latest Shma MG'A";
  }
  return "Sof Zman Shma MG'A";
}

function getLatestShmaGRAString() {
  if (isZmanimInHebrew) {
    return "סוף זמן שמע גר'א";
  }
  if (isZmanimInTranslatedEnglish) {
    return "Latest Shma GR'A";
  }
  return "Sof Zman Shma GR'A";
}

function getSofZmanAchilatChametzString() {
  if (isZmanimInHebrew) {
    return "סוף זמן אכילת חמץ";
  }
  if (isZmanimInTranslatedEnglish) {
    return "Latest Time to Eat Chametz";
  }
  return "Sof Zman Achilat Chametz";
}

function getLatestBerachotShmaGRAString() {
  if (isZmanimInHebrew) {
    return "סוף זמן ברכות שמע";
  }
  if (isZmanimInTranslatedEnglish) {
    return "Latest Berachot Shma";
  }
  return "Sof Zman Berachot Shma";
}

function getSofZmanBiurChametzString() {
  if (isZmanimInHebrew) {
    return "סוף זמן ביעור חמץ";
  }
  if (isZmanimInTranslatedEnglish) {
    return "Latest Time to Burn Chametz";
  }
  return "Sof Zman Biur Chametz";
}

function getChatzotString() {
  if (isZmanimInHebrew) {
    return "חצות";
  }
  if (isZmanimInTranslatedEnglish) {
    return "Mid-day";
  }
  return "Chatzot";
}

function getMinchaGedolaString() {
  if (isZmanimInHebrew) {
    return "מנחה גדולה";
  }
  if (isZmanimInTranslatedEnglish) {
    return "Earliest Mincha";
  }
  return "Mincha Gedola";
}

function getMinchaKetanaString() {
  if (isZmanimInHebrew) {
    return "מנחה קטנה";
  }
  return "Mincha Ketana";
}

function getPlagString() {
  if (isZmanimInHebrew) {
    return "פלג המנחה";
  }
  return "Plag HaMincha";
}

function getCandleLightingString() {
  if (isZmanimInHebrew) {
    return "הדלקת נרות";
  }
  return "Candle Lighting";
}

function getSunsetString() {
  if (isZmanimInHebrew) {
    return "שקיעה";
  }
  if (isZmanimInTranslatedEnglish) {
    return "Sunset";
  }
  return "Shkia";
}

function getTzeitString() {
  if (isZmanimInHebrew) {
    return "צאת הכוכבים";
  }
  if (isZmanimInTranslatedEnglish) {
    return "Nightfall";
  }
  return "Tzait Hacochavim";
}

function getTzaitTaanitString() {
  if (isZmanimInHebrew) {
    return "צאת תענית";
  }
  if (isZmanimInTranslatedEnglish) {
    return "Fast Ends";
  }
  return "Tzait Taanit";
}

function getTzaitTaanitLChumraString() {
  if (isZmanimInHebrew) {
    return "צאת תענית לחומרה";
  }
  if (isZmanimInTranslatedEnglish) {
    return "Fast Ends (Stringent)";
  }
  return "Tzait Taanit L'Chumra";
}

function getTzaitShabbatChagString(jewishCalendar) {
  if (isZmanimInHebrew) {
    if (jewishCalendar.isYomTovAssurBemelacha() && jewishCalendar.getDayOfWeek() == 7) {
      return "צאת השבת וחג";
    } else if (jewishCalendar.getDayOfWeek() == 7) {
      return "צאת השבת";
    } else {
      return "צאת חג";
    }
  }
  if (isZmanimInTranslatedEnglish) {
    if (jewishCalendar.isYomTovAssurBemelacha() && jewishCalendar.getDayOfWeek() == 7) {
      return "Shabbat and Yom Tov Ends";
    } else if (jewishCalendar.getDayOfWeek() == 7) {
      return "Shabbat Ends";
    } else {
      return "Yom Tov Ends";
    }
  }
  if (jewishCalendar.isYomTovAssurBemelacha() && jewishCalendar.getDayOfWeek() == 7) {
    return "Tzait Shabbat and Yom Tov";
  } else if (jewishCalendar.getDayOfWeek() == 7) {
    return "Tzait Shabbat";
  }
  return "Tzait Yom Tov";
}

function getRabbeinuTamString() {
  if (isZmanimInHebrew) {
    return "רבינו תם";
  }
  return "Rabbeinu Tam";
}

function getChatzotLaylaString() {
  if (isZmanimInHebrew) {
    return "חצות לילה";
  }
  if (isZmanimInTranslatedEnglish) {
    return "Midnight";
  }
  return "Chatzot Layla";
}
