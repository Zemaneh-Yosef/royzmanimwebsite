// @ts-check
import ChaiTables from "../features/chaiTables.js";
import { Temporal } from "../../libraries/kosherZmanim/kosher-zmanim.js";
import { geoLocation, jCal } from "./base.js";

/**
 * @param {string} selectedCountry
 * @param {string} indexOfMetroArea
 */
export async function validNetzAssert(selectedCountry, indexOfMetroArea) {
    if (typeof localStorage !== "undefined") {
        let validListOfNetzTimes = false;
        if (localStorage.getItem('ctNetz') && isValidJSON(localStorage.getItem('ctNetz'))) {
            const ctNetz = JSON.parse(localStorage.getItem('ctNetz'));
            if ('url' in ctNetz) {
                const ctNetzLink = new URL(ctNetz.url);

                if (ctNetzLink.searchParams.get('cgi_eroslatitude') == geoLocation.getLatitude().toFixed(6)
                && ctNetzLink.searchParams.get('cgi_eroslongitude') == (-geoLocation.getLongitude()).toFixed(6))
                    if (Temporal.Instant.compare(
                        Temporal.Now.instant(),
                        Temporal.Instant.fromEpochMilliseconds(ctNetz.times[ctNetz.times.length - 1] * 1000)
                    ) < 0)
                        validListOfNetzTimes = true;
            }
        }

        if (!validListOfNetzTimes) {
            localStorage.removeItem('ctNetz');
            await scrapeChaiTables(selectedCountry, indexOfMetroArea);
        }
    }
}

/**
 * @param {string} selectedCountry
 * @param {string} indexOfMetroArea
 */
export async function scrapeChaiTables(selectedCountry, indexOfMetroArea) {
    const chaiTableExtracter = new ChaiTables({ geoLocation, jCal });
    chaiTableExtracter.setOtherData(selectedCountry, indexOfMetroArea);

    const chaiTableData = await chaiTableExtracter.formatInterfacer();
    localStorage.setItem("ctNetz", JSON.stringify(chaiTableData));

    return true;
}

/** @param {string} str */
function isValidJSON(str) {
    try {
        JSON.parse(str);
        return true;
    } catch (e) {
        return false;
    }
}