### זמני יוסף Project

- **Elyahu Jacobi:** Lead Programmer, App Designer & Halachic Ohr Hachaim calendar implementation
- **Maor Na'im:** Website maintainer, initial עמודי הוראה implementation, made print-out calendar & TVs

The Rabbis who gave their Haskamot have also contributed to the app. Their credits are listed right next to their Haskamot on either the Haskamot modal or on the bottom of the landing.

### External API Credits

- **ChaiTables Website:** Accurate Netz timings based on GeoLocation
- **GeoNames Website:** Location meta-data search API
- **OpenStreetsMap:** Map used together with leftlet.js in the location modal

### Perfered-Dependencies Credits

- **[n2words](https://github.com/forzagreen/n2words):** Used to generate Berakha-accurate Hebrew Sefira text
- **KosherJava (Eliyahu Hershfeld):** Framework to calculate Zemanim, written in Java
  - **KosherZmanim (Aryeh Berman):** Initial port to TS. The code has been greatly modified since, but we still have Hakarat Hatov
- **Bootstrap:** Web Framework to make initial components
  - **[mdbootstrap](https://mdbootstrap.com/):** Implementing Google's Design Language into Bootstrap
- **[leftlet.js](https://leafletjs.com/):** Map library used in the location modal

##### Mandated-Dependencies Credits

- **[flexcal](https://github.com/dwachss/flexcal):** A jQuery(-UI) plugin to have a Hebrew-Date picker. To be replaced with a custom implementation built around KosherZmanim
- **[Material Design Web](https://m3.material.io/develop/web):** Replace MDBootstrap's list selector, due to MDBootstrap's being paid.
- **[pdf.js](https://mozilla.github.io/pdf.js/):** Embedded PDF viewer, because native ones either force the person to download the PDF on page-load or have issues scrolling

##### Flyer work

- **Adriel Kohananoo** - Flyer Designs
- **Joshua Nektalov**, **Haim Shaul Niyazov A"H** - Russian transliteration (Shabbat Flyer for Sefira)
- **Aharon N. Varady** and **Andrew Meit** - [Menorah Lamnatzeach](https://opensiddur.org/?p=3393) (under the Creative Commons Attribution-ShareAlike (CC BY-SA) 4.0 International copyleft license)