import * as _Luxon from '../luxon';
import { JsonOutput } from './util/ZmanimFormatter';
export declare function getZmanimJson(options: Options): JsonOutput;
export interface Options {
    /**
     * @default Current date and time
     */
    date?: Date | string | number | _Luxon.DateTime;
    /**
     * IANA timezone ID
     */
    timeZoneId: string;
    locationName?: string;
    latitude: number;
    longitude: number;
    /**
     * @default 0
     */
    elevation?: number;
    /**
     * Whether to use `ComplexZmanimCalendar` instead of `ZmanimCalendar`
     * @default false
     */
    complexZmanim?: boolean;
}
export * from './util/Time.js';
export * from './util/GeoLocation.js';
export * from './util/GeoLocationUtils.js';
export * from './util/Zman.js';
export * from './polyfills/Utils';
export * from './util/NOAACalculator';
export * from './util/SunTimesCalculator';
export * from './AstronomicalCalendar';
export * from './ZmanimCalendar';
export * from './ComplexZmanimCalendar';
export * from './hebrewcalendar/JewishDate.js';
export * from './hebrewcalendar/JewishCalendar.js';
export * from './hebrewcalendar/Daf.js';
export * from './hebrewcalendar/YomiCalculator.js';
export * from './hebrewcalendar/YerushalmiYomiCalculator.js';
export * from './hebrewcalendar/HebrewDateFormatter.js';
export * from './util/ZmanimFormatter';
export declare const Luxon: typeof _Luxon;
