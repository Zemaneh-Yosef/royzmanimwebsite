Welcome to the זמני יוסף website, where we calculate Halachic times based on the teachings of HaRav Ovadia Yosef ZT"L and other Sepharadic leaders for each user according to their location. Beyond relying on what he's written throughout his Sefarim (quoted in the description of each time slot), our reported times can match either of the two following calendars:

- The **Ohr Hachaim** calendar was made by *Rabbi Shelomo Benizri*, Rosh Yeshiva of "Ohr Hachaim". This is the calendar Maran zt"l used in Israel, as well as what R Yitzhak Yosef says to use outside Eretz Yisrael.
- The **Amudeh Horaah** calendar was made by *Rabbi Leeor Dahan*, author of the Mishnah Berurah commentary of that same name. While matching the Ohr Hachaim calendar for any time within the day, the times outside of the day are reinterpreted to use degree's calculated on the equinox day to return a new amount of time to use seasonally. This is in accordance with what R David Yosef says to use outside Eretz Yisrael, as well as matches what is said in Eretz Yisrael.

Our per-location calculations are even more accurate than printed materials, due to taking your exact location into account rather than the town as a whole. We also include options to use a visible sunrise, which would match when you in your specific location would see the sun rather than be bound by the town.
- Some websites have an inaccurate sunrise/sunset website, due to using the USNO algorithm. We use the NOA algorithm, which has been scientifically proven to be [more accurate](https://github.com/KosherJava/zmanim/commit/b69dc31cf041279523fc9a4a6ac06912736487bb) than what some calendars used in the past.
- Seconds should **never** be relied upon, because we only calculate accuracy accounts for the minute. We include it as an option to show which direction we'd round towards.

With each calculation, we provide explanations and calculation data (as well as sources) in our descriptions. These are written for people of all levels of learning, allowing them to understand how our times are calculated without needing much background knowledge. They are perfect for non-mathematicians, Hebrew-illiterate individuals or people who don't want to check our code to verify it himself ([although one is more than welcome to do that](https://github.com/)).

### Website Credits

- **Elyahu Jacobi:** Lead Programmer, App Designer & Halachic Ohr Hachaim calendar implementation
- **Maor N:** Contracted work for the following: Website design, code clean up, type-safety and עמודי הוראה's implementation
- Rabbinical Credits listed below with their Haskamot

### External API Credits

- **ChaiTables Website:** Accurate Netz timings based on GeoLocation
- **GeoNames Website:** Location meta-data search API

### Perfered-Dependencies Credits

- **Eliyahu Hershfield:** Primary Developer of the KosherJava project
- **Aryeh Berman:** Initial Port of KosherJava to TypeScript
- **Bootstrap:** Web Framework to make initial components
  - **[mdbootstrap](https://mdbootstrap.com/):** Implementing Google's Design Language into Bootstrap
- Developers of [n2words](https://github.com/forzagreen/n2words)

##### Mandated-Dependencies Credits

- **[flexcal](https://github.com/dwachss/flexcal):** A jQuery(-UI) plugin to have a Hebrew-Date picker. To be replaced with a custom implementation built around KosherZmanim
- **[Material Design Web](https://m2.material.io/develop/web/getting-started):** Replace MDBootstrap's list selector, due to MDBootstrap's being paid.
<!-- - **[Decimal.js](https://mikemcl.github.io/decimal.js/):** Support for Arbitrary Decimal Precision in JavaScript. -->
- **[pdf.js](https://mozilla.github.io/pdf.js/):** Embedded PDF viewer, because native ones either force the person to download the PDF on page-load or have issues scrolling


### Special Thanks

##### Rabbi Leeor Dahan

As the creator of the עמודי הוראה calendar, it is reasonable he would want his calendar to be represented accurately. Beyond his extensive documentation found at the end of his commentary on the משנה ברורה's 3<sup>rd</sup> volume, he was also very explanative of his opinions, especially when they differed from the לוח אור החיים (which is what our initial version only supported). Together, we have made a product that he could advertise, and it is included in the back of the 4<sup>th</sup> volume of his commentary on the משנה ברורה.

<iframe src="/assets/libraries/pdfviewer/web/viewer.html?file=/assets/haskamah-he.pdf" allow="fullscreen" style="aspect-ratio: 16/9; width: 100%;" loading="lazy"></iframe>

##### Rabbi Meir Gavriel Elbaz

As a Talmid of Rabbi Ovadia Yosef in Yeshivath יחוה דעת, we felt we were getting the Halachot of Hacham Ovadia when we would ask him any halachic problem. With an expertee in עניני דיומא (as part of his work as the English Translator for <a href="https://halachayomit.co.il/en/default.aspx">Halacha Yomit</a>), every question would be answered with a level of expertees as if it were applicable on that very day. We are very priviledged to have him as our personal Posek, and may Hashem help him be the light onto the dear & pleasent nation.

<iframe src="/assets/libraries/pdfviewer/web/viewer.html?file=/assets/haskamah-en.pdf" allow="fullscreen" style="aspect-ratio: 16/9; width: 100%;" loading="lazy"></iframe>
