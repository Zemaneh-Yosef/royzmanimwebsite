import * as KosherZmanim from 'assets/js/libraries/kosherzmanim/kosher-zmanim'
declare const GeoLocation = KosherZmanim.GeoLocation;
declare HebrewDateFormatter = KosherZmanim.HebrewDateFormatter;
declare JewishCalendar = KosherZmanim.JewishCalendar;
declare ZmanimFormatter = KosherZmanim.ZmanimFormatter;
declare ComplexZmanimCalendar = KosherZmanim.ComplexZmanimCalendar
//import type ComplexZmanimCalendar from 'assets/js/libraries/kosherzmanim/ComplexZmanimCalendar.d.ts'

declare global {
    interface window {
        KosherZmanim: KosherZmanim
    }
}

export {};