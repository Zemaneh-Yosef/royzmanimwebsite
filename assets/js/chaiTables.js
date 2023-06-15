//@ts-check

import * as KosherZmanim from "./libraries/dev/bundle.js"
export { ChaiTables }

class ChaiTables {
    /**
	 * @param {KosherZmanim.GeoLocation} geoLocation
	 */
    constructor(geoLocation) {
        this.geoData = geoLocation;
    }

    /**
     * @param {String} selectedCountry
     * @param {Number} indexOfMetroArea
     */
    setOtherData(selectedCountry, indexOfMetroArea) {
        this.selectedCountry = selectedCountry;
        this.indexOfMetroArea = indexOfMetroArea;
    }

    /**
     * STEP 3
     * Returns the full chaitables url after everything has been setup. See {@link #selectCountry(ChaiTablesCountries)} and {@link #selectMetropolitanArea(String)}
     * @return the full link directly to the chai tables for the chosen neighborhood
     *
     * @param {Number} searchradius The search radius in kilometers.
     * @param {0|1|2|3|4|5} type the type of table you want.
     *             0 is visible sunrise,
     *             1 is visible sunset,
     *             2 is mishor sunrise,
     *             3 is astronomical sunrise,
     *             4 is mishor sunset,
     *             5 is astronomical sunset.
     * @param {KosherZmanim.JewishCalendar} jewishCalendar the desired hebrew year for the chaitable link
     * @param {Number} userId the user id for the chaitables link
     * @param {Boolean} switchLongitude
     */
    getChaiTablesLink(searchradius, type, jewishCalendar, userId, switchLongitude) {
        if (type < 0 || type > 5) {
            throw new Error("type of tables must be between 0 and 5");
        }

        const isIsraelCities = this.selectedCountry == "Eretz_Yisroel";

        const urlParams = {
            'TableType': (isIsraelCities ? "BY" : "Chai"),
            'country': this.selectedCountry,
            'USAcities1': (isIsraelCities ? 1 : this.indexOfMetroArea),
            USAcities2: 0,
            searchradius: (isIsraelCities ? "" : this.selectedCountry == "Israel" ? 2 : searchradius),
            Placename: "?",
            "eroslatitude": (isIsraelCities ? 0.0 : this.geoData.getLatitude()),
            "eroslongitude": (isIsraelCities ? 0.0 : switchLongitude ? -this.geoData.getLongitude() : this.geoData.getLongitude()),
            eroshgt: 0.0,
            geotz: jewishCalendar.getDate().setZone(this.geoData.getTimeZone()).offset / 60,
            exactcoord: "OFF",
            MetroArea: (isIsraelCities ? this.indexOfMetroArea : "jerusalem"),
            types: type,
            RoundSecond: -1,
            AddCushion: 0,
            "24hr": "",
            typezman: -1,
            yrheb: jewishCalendar.getJewishYear(),
            optionheb: 1,
            UserNumber: userId,
            Language: "English",
            AllowShaving: "OFF"
        };

        const url = new URL("http://www.chaitables.com/cgi-bin/ChaiTables.cgi/")
        for (let [key, value] of Object.entries(urlParams)) {
            if (typeof value !== "string")
                value = value.toString()

            url.searchParams.set("cgi_" + key, value)
        }

        return url;
    }

    
}