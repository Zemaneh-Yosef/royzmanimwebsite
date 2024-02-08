Welcome to the זמני יוסף website, where we calculate Halachic timing according to HaRav Ovadia Yosef ZT"L for each user according to their location. In addition, we also provide explanations for the opinions so users can understand, as well as info-graphics for those wanting to share on social media.

### Basic Knowledge

1. Other calendar applications attempt to be accomodative of our Sepharadi target audience by including a singular shita catered to them titled "Rabbi Ovadia Yosef". However, when learning the written material, it is hard to derive what he actually held in terms of the time reports themselves (except for rare cases, like how he holds that Rabbeinu Tam is 72 seasonal minutes across the board, without a regard to 72 fixed minutes being shorter at times).
  Physical calendars experience the same issue, with there being different calculations according to the different understanding. Our calendar decided to include options for the interpretations that the following two Rabanim give:
  - **Rabbi Shlomo Benizri:** Rosh Yeshiva of "Ohr Hachaim" who worked verbally with Maran zt"l himself to know what he held beyond what was written down. Serves as the primary calendar posek for Israel.
  - **Rabbi Leeor Dahan:** Author of the "Amudeh Hora'ah" calendars, relies upon what was written in the books themselves as well as sides with the son's of Maran zt"l to accurately portray the Derech of his father, even if that leads them to disagree with each other. Serves as the primary calendar posek for the USA.
2. The Rabbi's provide their calendars as printable documents, generated on-request per location. Since our times are made to match the results rather than the calculation methods, we sometimes offset our calculation to accomodate, leaving room for precise numbers that only make its ways in the books through a rounded form. However, said offsetting was only done after consulting the Rabbi & stress testing the offset to not go above 3 seconds on any affected time in any location (despite having a generous 20 second time window of inaccuracy).
  - The design philosophy only affects the nightfall-times in the עמודי הוראה calendar and any time that relies on it; the other times as well as Ohr Hachaim calendar is completely fine
  - Due to the very nature of being town-based rather than tailed to the users precise location, the calendars are restricted to Sea-Level sunrise for netz. However, since our app does not have this "global dependency", we have an option to fetch the times from "ChaiTables", a website which calculates these times based on a pre-generated 3D map.
  - As for other times which could be "off", sea-level sunrise (הנץ) and sunset (שקיעה) will never be different when the other calendar pulls that data from the NOAA, which is scientifically proven to be [more accurate](https://github.com/KosherJava/zmanim/commit/b69dc31cf041279523fc9a4a6ac06912736487bb) than what some calendars used in the past.
  - Seconds will **never** be accurate, and should **never** be relied upon. Although they are only three seconds different from the main calendar for the times listed above, the Rabbis in their initial calendars also weren't careful to make seconds accurate. Our concern was mainly the minutes, which we ended up reflecting.
3. Our codebases are fully Open-Source on GitHub, where anyone can give feedback and contribute. However, the codebase is open source for the purpose of being able to verify and validify calculations. To explain why, we need to understand the rule of המוציא את חבירו על הראיה (letting the norm remain established until there is a disproof against it):
  - With all other calendars having been established for ages, it is difficult to ensure our target audience could use our tool. As such, to persuade others away from concluding with a Psak that could make one liable, being able to prove our end result is crucial.
  - For those that aren't migrating from other calendar Psaks, the ability to ensure that no one can use the rule above against us is also important. Thereby, we're using the rule as a preventative measure on our end rather than going on the offensive.

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
