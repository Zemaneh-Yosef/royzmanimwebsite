import * as _Luxon from '../luxon/index';
import { GeoLocation } from './util/GeoLocation';
import { ZmanimCalendar } from './ZmanimCalendar';
import { ComplexZmanimCalendar } from './ComplexZmanimCalendar';
import { ZmanimFormatter } from './util/ZmanimFormatter';
export function getZmanimJson(options) {
    const geoLocation = new GeoLocation(options.locationName || null, options.latitude, options.longitude, options.elevation || 0, options.timeZoneId);
    const zmanimCalendar = options.complexZmanim
        ? new ComplexZmanimCalendar(geoLocation)
        : new ZmanimCalendar(geoLocation);
    zmanimCalendar.setDate(options.date || _Luxon.DateTime.local());
    return ZmanimFormatter.toJSON(zmanimCalendar);
}
export * from './util/Time';
export * from './util/GeoLocation';
export * from './util/GeoLocationUtils';
export * from './util/Zman';
export * from './polyfills/Utils';
export * from './util/NOAACalculator';
export * from './util/SunTimesCalculator';
export * from './AstronomicalCalendar';
export * from './ZmanimCalendar';
export * from './ComplexZmanimCalendar';
export * from './hebrewcalendar/JewishDate';
export * from './hebrewcalendar/JewishCalendar';
export * from './hebrewcalendar/Daf';
export * from './hebrewcalendar/YomiCalculator';
export * from './hebrewcalendar/YerushalmiYomiCalculator';
export * from './hebrewcalendar/HebrewDateFormatter';
export * from './util/ZmanimFormatter';
export const Luxon = _Luxon;
//# sourceMappingURL=kosher-zmanim.js.map