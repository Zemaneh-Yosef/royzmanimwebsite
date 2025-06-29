#### Sunrise / Sunset

**Sunrise** (*Ha'Netz*) is defined as the moment when the uppermost edge of the solar disc first becomes visible over the eastern horizon.<span data-footnote><span class="hebSrc">רב פעלים חלק ב' או"ח פרק ג'</span></span> **Sunset** (*Sheqi'ah*) corresponds to the complete disappearance of the solar sphere below the western horizon.<span data-footnote>הלכה ברורה (הקדמה לסימן רס"א הלכה כ"א); וכן בילקוט יוסף מהדורה החדשה, סימן פט, דף ת"ס</span>

The times presented are generated using the NOAA algorithm based on the precise **latitude, longitude, and elevation** provided (within Eretz Yisrael).<span data-footnote>Although halachic times are typically standardized across an entire city, definitional complexities arise when delineating municipal boundaries. Practically, this seldom poses a problem, as intra-city variation rarely exceeds a single minute. As such, we comfortably rely on the דברי יוסף (see 61a). Nonetheless, it remains preferable for calendar compilers to adopt the geographic center of the city as their reference point.</span><span data-footnote>Elevation increases day length by advancing sunrise and delaying sunset. Those wishing to exclude elevation (in accordance with the ruling of the Halacha Berura) should input an elevation of "0" when generating the calendar.</span>

The "Sunrise" column refers not to the computational sunrise time used in halachic calculations, but rather to an adjusted time intended for **prayer at sunrise** (*Shacharit*).<span data-footnote>ככתוב בתהלים ע"ב:ה' – “יִֽירָא֥וּךָ עִם־שָׁ֣מֶשׁ” (“They shall revere You with the sun”).</span> Ideally, this reflects *Visual Sunrise*, which accounts for **local horizon obstructions** (such as surrounding mountains or valleys).<span data-footnote>See תלמדי רבינו יונה on ברכות ד:, בדפי הרי"ף. This does not compromise precision, as Visual Sunrise tables (e.g., ChaiTables / לוח בכרי יוסף) also utilize the NOAA algorithm as a computational base. However, since some individuals time their *Amidah* precisely with sunrise, we have chosen to include seconds in this column. This does **not** constitute an endorsement of this practice; cf. אורחות מרן ח"א, ז':ה', where Maran zt"l did not adopt this approach. Still, see ילקוט יוסף (מהדורת תשפ"א, עמוד תם) for a delineation of requirements, including clock accuracy, for those who do attempt precise timing.</span> In the absence of a user-configured *Visual Sunrise Setup*, we provide an **elevation-neutral sunrise time** derived from the standard NOAA algorithm.<span data-footnote>For many locations in Israel, excluding elevation from the NOAA algorithm yields sunrise estimates closer to those of the Visual Sunrise calculation. In cases of uncertainty, it is halachically preferable to err later—ensuring the prayer is post-sunrise—rather than prematurely.</span>

#### Seasonal Hour (Sha'ah Zemanit)

All standard halachic times are expressed in units of a **seasonal hour**, whereby the length of one halachic hour is computed by dividing the daytime interval between sunrise and sunset into twelve equal parts.<span data-footnote>שו"ת הרמב"ם פאר הדור מ"ד. Note: Certain halachic considerations (e.g., *Mincha Gedolah*, conclusion of Shabbat/Yom Tov, *Shema*, and *Chametz*) invoke either fixed intervals or adjusted seasonal hour models extending from **dawn** until **Rabbeinu Tam's nightfall**. For further discussion, see הליכות עולם ח"א, פרשת וארא, הלכה ג.</span>

The **Sephardic tradition** extends the use of seasonal hours to times beyond the sunrise–sunset window,<span data-footnote>See הליכות עולם ח"א, עמ' קו; עמ' רמח–רנ; מנחת כהן ב':ד'; פרי חדש, קונטרס דבי שימשי ח'; בית דוד ק"ד</span> though the underlying sources generally presume astronomical conditions corresponding to the **equinox**. Consequently, we define the seasonal minute by:

1. Astronomically identifying the sun’s **angle below the horizon** at the designated halachic time (on the equinox in Israel).
2. Applying this degree measurement to the equinox day at the user's location.
3. Measuring the interval to the nearest local sunrise/sunset.
4. Using this result to define a context-specific seasonal hour.

This process aligns the seasonal duration with local astronomical conditions while preserving halachic fidelity.<span data-footnote>As per the sources above and Halacha Berura (intro to siman 261, halacha 13).</span>

###### Dawn

**Dawn** signifies the onset of the halachic day, marked by the first visible rays of sunlight illuminating the eastern sky.<span data-footnote>רא"ש, ברכות ד:א; רמב"ם פירוש המשניות ד:א; ש"ע א"ח פט:א</span> From this time forward, halachic obligations become operative,<span data-footnote>ראה שלחן ערוך (או"ח) במספר מקומות (נח, פט, תקפח, תרנב, תרפז); וכן ביו"ד, סימן רס"ב</span> although positive time-bound commandments (*mitzvot aseh shehazman gerama*) should ideally be delayed until **sunrise**. If one performed them prematurely—absent urgency—one is exempt post facto. In our system, dawn is calculated as **72 adjusted seasonal minutes** before sunrise.

###### MiSheyakir

**MiSheyakir** denotes the earliest time one can recognize a familiar individual at close range, and distinguish between **white** and **tekhelet** threads.<span data-footnote><span class="hebSrc">שתי הזמנים האלו אותו דבר: ראה בית יוסף סימן נ"ח ד"ה 'ומ"ש ומצוה'</span></span> Practically, this serves as the halachic threshold for donning a **tallit**, laying **tefillin**, and reciting **Keriat Shema**.<span data-footnote>שו"ע או"ח סימנים י"ח, ל' ו-נ"ח</span>

This calendar adopts the mainstream position which situates MiSheyakir at **one adjusted seasonal hour prior to sunrise**.<span data-footnote>הליכות עולם א', דף י"ט. For those following the stringent view of 66 minutes, divide the interval between עלות השחר and משיכיר in half.</span>

###### Latest Time for Keriat Shema

The deadline for fulfilling the **morning obligation of Keriat Shema**—comprising its three paragraphs—coincides with the conclusion of the **third halachic hour** of the day. This measurement is grounded in the interpretation of the phrase *"uvkumecha"* (“when you arise”) as referring to the habits of those who awaken at a more leisurely pace.<span data-footnote><span class="hebSrc">ר' יהושע משנה ברכות א':ב', שמואל ברכות י:</span></span>

One should ideally be stringent and adhere to the **earlier time**, derived from **extended seasonal hours**, stretching from **dawn** to **Rabbeinu Tam’s nightfall**.<span data-footnote><span class="hebSrc">חיד"א (שו"ת חיים שאל) ב', ל"ח:ע'; בא"ח, ויקהל ד'; רב פעלים ב':ב'; כף החיים נ"ח:ד'; תרומת הדשן א'</span><br>See also Maghen Avraham (OḤ 58:1), who reinterprets dissenting views in support of stringency for Keriat Shema.</span>

In pressing circumstances (*b'sha'at ha'dechak*), one may rely on the **later time**, calculated using standard **seasonal hours** measured from sunrise to sunset.<span data-footnote>הליכות עולם א', עמוד קו</span><span data-footnote><span class="hebSrc">רמב"ם (סדר אהבה), הלכות קריאת שמע א':ו"א; סידור רב סעדיה גאון, דף י"ב; ביאור הגר"א או"ח תנ"ט:ב'</span></span>

###### Keriat Shema Blessing Deadline

The **blessings** associated with *Keriat Shema* must be recited by the conclusion of the **fourth halachic hour**, representing one-third of the daytime period.<span data-footnote>רא"ש ברכות י', בשם רה"ג; סידור רס"ג, דף י"ג; שו"ע או"ח סימן נ"ח; פתח הדביר ח"ב, דף י"ח בשם ר' חיים ויטאל</span> Ideally, one should also conclude **Shacharit** by this time.<span data-footnote>שו"ע או"ח סימן פ"ט</span>

###### Ḥatzot – Halachic Midday & Midnight

**Halachic midday** (*ḥatzot hayom*) occurs when the sun reaches its highest point in the sky, casting no lateral shadow—marking the midpoint between **sunrise** and **sunset**.<span data-footnote>ברטנורא על משנה פסחים ה׳:א׳; השווה רש"י פסחים נ"ח ד"ה "בין הערבים"</span> **Halachic midnight** (*ḥatzot halaylah*) is similarly calculated by splitting the interval from **sunset** to the following **sunrise**. These two points are typically twelve fixed hours apart, though they may differ by a few seconds depending on seasonal variations.<span data-footnote><span class="hebSrc">חזון עובדיה, ימים נוראים, עמ' ג'</span></span>

In halachic practice, ḥatzot serves as a benchmark: one must complete **Shacharit** by halachic midday,<span data-footnote>שו"ע או"ח סימן פ"ט</span> and it is strongly recommended to fulfill the **evening recitation of Shema** and the **Seder night obligations** before midnight.<span data-footnote>משנה ברכות א':א'</span> In Kabbalistic tradition, midnight holds deeper spiritual resonance—as a moment of divine mercy (*midat ha-raḥamim*)—giving rise to practices such as **Tikkun Ḥatzot** and **Selichot** at this time.

###### Minḥa Times

The earliest permissible time to pray *Minḥa* (**Minḥa Gedolah**) is **half an hour after halachic midday**.<span data-footnote>שו"ע או"ח סימן רל"ג; הליכות עולם א', דף רנ"ב</span> This half-hour is measured stringently—as the **later** of two calculations: half an hour of fixed clock time or half an hour of seasonal time.<span data-footnote><span class="hebSrc">הלכה ברורה סימן רל"ג, הלכה ג'</span></span>

Nonetheless, it is **preferable** to wait until the **ninth and a half seasonal hour**—known as *Minḥa Ketanah*—before praying.<span data-footnote><span class="hebSrc">ילקוט יוסף, סימן רל"ג:א'</span></span> Both times are provided in the calendar to accommodate varying circumstances and levels of urgency.

###### Pelag HaMinḥa

The period between *Minḥa Ketanah* and the latest permissible time for *Minḥa* is halachically divided into two equal segments,<span data-footnote>ברכות כ"ז ע"ב – מנחה קטנה נמשכת שעתיים וחצי זמניות</span> each spanning **1¼ seasonal hours**. The **second half** of this period is termed *Pelag HaMinḥa*.

From this point onward, certain evening-related mitzvot may be observed—despite it still being daytime—such as **accepting Shabbat**,<span data-footnote><span class="hebSrc">רמ"א בשו"ע או"ח רס"א:ב', ע"פ שיטת הבית יוסף</span></span> **lighting Ḥanukah candles**,<span data-footnote>חזון עובדיה, חנוכה, עמ' פ"ט</span> and reciting **Ma'ariv** (*Arvit*) provided that *Minḥa* has already been completed.

Halachic authorities differ on the precise anchor point from which to calculate *Pelag*: While the standard Sephardic approach is to measure all seasonal hours as an offset from **sunset**,<span data-footnote>כף החיים רל"ג:ז'; מנחת כהן, מאמר ב', סוף פרק ט'; רמב"ם הלכות תפילה ג:ד</span> including *Pelag*, some—including **Rabbi Avraham Yosef** and **Rabbi Yitzḥak Yosef**—cite their father, **Rav Ovadia Yosef zt"l**, as recommending a calculation based on the **Geonic nightfall** as the endpoint of *Minḥa*.<span data-footnote>ילקוט יוסף מהדורה חדשה, סימן רע"א, דפים קלט & קמד–קמז; יביע אומר ח"ב, סימן כ"א:ט"ו</span><span data-footnote>Minutes are still measured by the sunrise–sunset interval; cf. אגור, סוף סימן של"ז</span> This view accommodates the ruling that *Minḥa* may be prayed until **Geonic nightfall** and thus shifts *Pelag* accordingly.

**Given this halachic duality**, where the choice of calculation may result in either a stringency (*chumra*) or a leniency (*kula*), our calendar includes both interpretations to assist users in observing their preferred or community-backed custom.