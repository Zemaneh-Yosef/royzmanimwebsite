<section style="text-align: center;">
    <a href="https://play.google.com/store/apps/details?id=com.EJ.ROvadiahYosefCalendar"><img src="/assets/images/google-play-store-8-1-73-apk.png" style="width: 25%;"></a>
    <a href="https://apps.apple.com/app/rabbi-ovadiah-yosef-calendar/id6448838987"><img src="/assets/images/app-store.png" style="width: 25%;"></a>
</section>

The "ROYZmanim" website was made to calculate timing information according to the Sepharadic opinion of Rabbi Ovadiah Yosef ZT"L and those of whom he quoted, much like the App Store and Play Store variants this was based on. In addition, it teaches how one can reach said calculations themselves, through detailed explanations for those that cannot read source code.

### Basic Knowledge

1. Any other zmanim application that offers a singular "Rabbi Ovadia Yosef shita" option is misrepresenting the various studies that has gone into researching what he would have held, with the vast interpretations. Currently, we accommodate Rabbi Shlomo Benizri & Rabbi Leeor Dahan, both of whom are calendar-poseks in their respective location and whomst also interpret Maran zt"l's words differently.
2. With these opinions comes the fact that their calculations are hidden from the end user, only receiving a PDF print out instead. Since our end goal is an attempt to replicate the end results rather than the calculations themselves, this leads to situations where the calculations themselves need to turn "inaccurate" for the purpose of providing an offset (such as internally using "16.01" instead of the typical 16.1 degrees for Aloth Hashachar in עמודי הוראה mode).
3. When there is a line that we could cross between making something permitted and forbidden, we as the product offerers need to prove that our method is accurate. As such, we have fully open-sourced each codebase we worked on, as well as restricted ourselves to things that are calculatable (with the exclusion of ChaiTables Netz calculation, as that's where the Ohr Hachaim gets their Netz data from). The only thing we do **not** intend to prove its accuracy are seconds, because they should **not** be relied upon.
4. The calculation methods between sunrise and sunset are the same across both Sepharadi & Ashkenazi calendars, because every updated calendar pulls the data from the NOAA. As such, what makes the differences are the way the hours are divided as well as עלות & צאת.

### Development Credits

- **Elyahu Jacobi:** Lead Programmer, App Designer
- **Maor N:** Contracted work for the following: Website design, code clean up, type-safety and advocate for עמודי הוראה's implementation
- **Aryeh Berman:** Developer of the KosherZmanim TypeScript library port
- **Eliyahu Hershfield:** Developer of the KosherJava project

### Special Thanks

##### Rabbi Leeor Dahan

As the creator of the עמודי הוראה calendar, it is reasonable he would want his calendar to be represented accurately. Beyond his extensive documentation found at the end of his commentary on the משנה ברורה's 3<sup>rd</sup> volume, he was also very explanative of his opinions, especially when they differed from the לוח אור החיים (which is what our initial version only supported). Together, we have made a product that he could advertise, and it is included in the back of the 4<sup>th</sup> volume of his commentary on the משנה ברורה.

<iframe src="/assets/הסכמה.pdf" allowfullscreen style="aspect-ratio: 16/9; width: 100%;"></iframe>

##### Rabbi Meir Gavriel Elbaz

As a Talmid of Rabbi Ovadia Yosef in Yeshivath יחוה דעת, we felt we were getting the Halachot of Hacham Ovadia when we would ask him any halachic problem. With an expertee in עניני דיומא (as part of his work as the English Translator for <a href="https://halachayomit.co.il/en/default.aspx">Halacha Yomit</a>), every question would be answered with a level of expertees as if it were applicable on that very day. We are very priviledged to have him as our personal Posek, and may Hashem help him be the light onto the dear & pleasent nation.

<iframe src="/assets/Haskamah.pdf" allowfullscreen style="aspect-ratio: 16/9; width: 100%;"></iframe>