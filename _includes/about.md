<section style="text-align: center;">
    <a href="https://play.google.com/store/apps/details?id=com.EJ.ROvadiahYosefCalendar"><img src="/assets/images/google-play-store-8-1-73-apk.png" style="width: 25%;"></a>
    <a href="https://apps.apple.com/app/rabbi-ovadiah-yosef-calendar/id6448838987"><img src="/assets/images/app-store.png" style="width: 25%;"></a>
</section>

The "ROYZmanim" website was made to calculate timing information according to the Sepharadic opinion of Rabbi Ovadiah Yosef ZT"L and those of whom he quoted, much like the App Store and Play Store variants this was based on. In addition, it teaches how one can reach said calculations themselves, through detailed explanations for those that cannot read source code.

### Basic Knowledge

1. Other calendar applications attempt to be accomodative of our Sepharadi target audience by including a singular shita catered to them titled "Rabbi Ovadia Yosef". However, when learning the written material, it is hard to derive what he actually held in terms of the time reports themselves (except for rare cases, like how he holds that Rabbeinu Tam is 72 seasonal minutes across the board, without a regard to 72 fixed minutes being shorter at times).
  Physical calendars experience the same issue, with there being different calculations according to the different understanding. Our calendar decided to include options for the interpretations that the following two Rabanim give:
  - **Rabbi Shlomo Benizri:** Rosh Yeshiva of "Ohr Hachaim" who worked verbally with Maran zt"l himself to know what he held beyond what was written down. Serves as the primary calendar posek for Israel.
  - **Rabbi Leeor Dahan:** Author of the "Amudeh Hora'ah" calendars, relies upon what was written in the books themselves as well as sides with the son's of Maran zt"l to accurately portray the Derech of his father, even if that leads them to disagree with eachother. Serves as the primary calendar posek for the USA.
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

### Development Credits

- **Aryeh Berman:** Primary Developer of the KosherZmanim TypeScript library port
- **Eliyahu Hershfield:** Primary Developer of the KosherJava project, which KosherZmanim was based on
- Developers of [luxon](https://moment.github.io/luxon/#/), [Decimal.js](https://mikemcl.github.io/decimal.js/), [mdbootstrap](https://mdbootstrap.com/) (which uses [Bootstrap 5](https://getbootstrap.com/)) & [n2words](https://github.com/forzagreen/n2words)
- Shout out to the to-be-replaced-in-the-future [flexcal](https://github.com/dwachss/flexcal), with all of its jQuery and jQuery-UI dependencies

### Special Thanks

##### Rabbi Leeor Dahan

As the creator of the עמודי הוראה calendar, it is reasonable he would want his calendar to be represented accurately. Beyond his extensive documentation found at the end of his commentary on the משנה ברורה's 3<sup>rd</sup> volume, he was also very explanative of his opinions, especially when they differed from the לוח אור החיים (which is what our initial version only supported). Together, we have made a product that he could advertise, and it is included in the back of the 4<sup>th</sup> volume of his commentary on the משנה ברורה.

<iframe src="/assets/הסכמה.pdf" allowfullscreen style="aspect-ratio: 16/9; width: 100%;"></iframe>

##### Rabbi Meir Gavriel Elbaz

As a Talmid of Rabbi Ovadia Yosef in Yeshivath יחוה דעת, we felt we were getting the Halachot of Hacham Ovadia when we would ask him any halachic problem. With an expertee in עניני דיומא (as part of his work as the English Translator for <a href="https://halachayomit.co.il/en/default.aspx">Halacha Yomit</a>), every question would be answered with a level of expertees as if it were applicable on that very day. We are very priviledged to have him as our personal Posek, and may Hashem help him be the light onto the dear & pleasent nation.

<iframe src="/assets/Haskamah.pdf" allowfullscreen style="aspect-ratio: 16/9; width: 100%;"></iframe>
