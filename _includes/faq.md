### Other calendars include a "Sepharadi Psak"; Why make a new calendar?

Labeling opinions as "Sepharadi" or "Not Sepharadi" is not representative of the fact that there may be one Posek in particular that one would hold of. As an example, ישיבת כסא רחמים and ישיבת אור החיים are both "Sepharadi", yet they have different methods of calculation.

Most "Sepharadim" would narrow their posek down to the lineage of Rabbi Ovadiah Yosef, as brought down throughout his and his sons' extensive library of writings. Although other calendar applications do include a singular "Rabbi Ovadiah Yosef" option, they are typically based on the limited comments he made in writing, like how Rabbeinu Tam's Nightfall is calculated at 72 seasonal minutes after sunset. Even after further research and realizing that there is already a calculation that was directed by Rabbi Ovadia himself for an Eretz Yisrael calendar, he himself wasn't the only posek on this matter; his sons were also involved, even arguing with him on some instances. As such, users should be able to select different opinions based on the various interpretations of his ways.

Although advanced users are able to change calculation settings through manual "Local Storage" overrides, our User Interface offers preconfigured options that match two physical calendars already there:

- **Ohr Hachaim:** Calendar led by Rabbi Shlomo Benizri, who worked together with Maran zt"l to represent him accurately. The primary identifier is the use of seasonal minutes rather than degrees. This option is selected by default for users in Eretz Yisrael, but it could also be used for outside Eretz-Yisrael.
- **Amudeh Hora'ah:** Calendar led by Rabbi Leeor Dahan, who focuses on written material. The primary identifier is the use of degrees to adjust for being north/south of Eretz Yisrael rather than only using sunrise/sunset times. Since this is made to accomodate for higher/lesser latitudes than Eretz Yisrael, the land itself would not need said accomodations, so one should resort back to the Ohr Hachaim calendar there.

### Is our calendar accurate when comparing itself to their base calendars?

Our calendars either match or are within 3 seconds of eachother, which is already restrictive when Rabbi Dahan allowed us to be 15 seconds off. There are some details worth pointing out:

- Seconds were never visible in the default calendar because they aren't reliable. We match their seconds so that the minutes themselves can match, but not for the sake of displaying the seconds.
- When using ChaiTables' Netz timings, a more location-precise calculation is shown instead of the generic "town calendar" display.
- KosherJava's function for determining [mid-day](https://github.com/KosherJava/zmanim/blob/master/src/main/java/com/kosherjava/zmanim/AstronomicalCalendar.java#L510) & 

What really encompases above is the question of "What to do when the norm isn't defined". As such, for us
Our accuracy is measured in terms of whether it matches the physical calendars themselves, whether to the exact second or within a 3 second time-window (which is already a self-imposed restriction when Rabbi Dahan allowed us to be within 15 seconds of his calendar). Thereby, any flaws that are present in their calendar carries over to ours. Since this includes their calculation of seconds, though, they are not to be relied on; they are disabled by default and need to but could still be viewed on the However, we have worked extensively to replicate the opinions held, Unfortunately, this includes seconds, thereby 

### Why isn't this more popular?