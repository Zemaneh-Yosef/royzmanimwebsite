### זמני יוסף Project

The clickable links by a Rabbi's name will take you to their Haskama.

- **Elyahu Jacobi:** Project Founder, Programmer for the Mobile Applications
- **Maor Na'im:** Project Leader, Programmer for the website (as well as its exporting functions), Graphic Designer (for flyers & TVs) & textual write-ups

---

- **[Rabbi Meir Gavriel Elbaz:](/assets/haskamah-en.pdf)** Rabbinic Marketer, supervisor
- **[Rabbi Leeor Betzalel Dahan:](/assets/haskamah-he.pdf)** Halachic Approach, supervisor
- **Adriel Kohananoo:** Graphic Designer, whether as a consultant or utilizing his designs
- **Rabbi Yoav Arjhang:** Community Marketer

Outside of our team above, we've received the official endorsement of [HaRav Yitzḥak Yosef](/assets/haskamah-rishon-letzion.pdf)

### External Services Credits

- **ChaiTables Website:** Accurate Netz timings based on GeoLocation
- **GeoNames Website:** Location meta-data search API

#### Maps & Imagery

- **© OpenStreetMap contributors:** Map data in the location modal and the 3D horizon view
- **Stadia Maps, Stamen Terrain:** Terrain map in the printouts. © Stadia Maps © Stamen Design © OpenMapTiles © OpenStreetMap contributors
- **Sentinel-2 cloudless 2016** by [EOX IT Services GmbH](https://s2maps.eu) (contains modified Copernicus Sentinel data 2016): Satellite imagery in the 3D horizon view
- **Terrain Tiles on AWS:** Elevation tiles for the 3D horizon view (Mapzen, from NASA SRTM and USGS data)
- **Twemoji** (CC BY 4.0): Country flags on the flyers, via [country-flag-emoji-polyfill](https://www.npmjs.com/package/country-flag-emoji-polyfill)

#### Weather & Atmosphere

- **[Open-Meteo](https://open-meteo.com):** Forecast, archive, marine and air-quality data (CC BY 4.0)
- **[CAMS](https://atmosphere.copernicus.eu), Copernicus Atmosphere Monitoring Service:** Aerosol (haze) data, via Open-Meteo
- **NOAA / NCEP:** GFS and GEFS forecasts, and the GEFS aerosol forecast from NOAA AOML
- **NCEP/NCAR Reanalysis 1,** provided by the NOAA PSL, Boulder, Colorado, from [psl.noaa.gov](https://psl.noaa.gov)
- **[National Weather Service](https://www.weather.gov)** and **NOAA NCEI:** US forecast grids and climate normals
- **[AERONET](https://aeronet.gsfc.nasa.gov)** (NASA GSFC) and its station principal investigators: Aerosol observations

#### Elevation & Terrain

- **NASA SRTM** and **USGS 3DEP**
- **[Natural Resources Canada](https://natural-resources.canada.ca):** MRDEM and HRDEM (Open Government Licence – Canada)
- **FABDEM V1-2,** Hawker et al. 2022, University of Bristol (CC BY-NC-SA 4.0; contains modified Copernicus Service information; non-commercial use only)
- **IGN RGE ALTI** (Licence Ouverte / Etalab 2.0)

#### Light Pollution & Sky

- **Falchi, F. et al. (2016),** *The New World Atlas of Artificial Night Sky Brightness* (CC BY-NC 4.0; non-commercial use only), via [astertaylor/halakhic_calc](https://github.com/astertaylor/halakhic_calc)
- **[Globe at Night](https://globeatnight.org),** NSF NOIRLab (CC BY 4.0)
- **Kyba, C. C. M. et al. (2023),** *Science* 379, 265, on the growth of skyglow
- **Bará, S. et al. (2022),** arXiv:2202.07526, on average sky against zenith
- **Israel Nature and Parks Authority:** Ramon Crater readings

#### Places & Boundaries

- **[Nominatim](https://nominatim.openstreetmap.org)** and Geofabrik's OpenStreetMap extract (ODbL)
- **Neighbourhood and area boundaries:** NYC Department of City Planning; Los Angeles Times "Mapping L.A."; US Census Bureau TIGER/Line; Israel Central Bureau of Statistics; Israel Ministry of Interior (OpenStreetMap, ODbL); Statistics Canada (Open Government Licence – Canada); [geoBoundaries](https://www.geoboundaries.org) (CC BY 4.0)
- **Open-data cities:** Toronto, Ottawa, Hamilton, Calgary, Edmonton, Winnipeg, Halifax and Montréal (CC BY 4.0); Chicago, Houston, Dallas, Phoenix, San Diego, Austin, Seattle and Baltimore

### Library Credits

- **[n2words](https://github.com/forzagreen/n2words):** Used to generate Berakha-accurate Hebrew Sefira text
- **KosherJava (Eliyahu Hershfeld):** Framework to calculate Zemanim, written in Java
  - **KosherZmanim (Aryeh Berman):** Initial port to TS. The code has been greatly modified since, but we still have Hakarat Hatov
- **Bootstrap:** Web Framework to make initial components
  - **[mdbootstrap](https://mdbootstrap.com/):** Implementing Google's Design Language into Bootstrap
- **[Bootstrap Icons](https://icons.getbootstrap.com/)** (MIT): Icons on the site
- **[Leaflet](https://leafletjs.com/):** Map library used in the location modal
- **[CesiumJS](https://cesium.com/platform/cesiumjs/)** (Apache 2.0): The globe and terrain of the 3D horizon view
- **[OpenLayers](https://openlayers.org/):** Map library used to draw the printout maps
- **[gsap.js](https://gsap.com/):** Tweening library for animations in Zemanim countdowns
- **[Astronomy Engine](https://github.com/cosinekitty/astronomy)** by Don Cross (MIT): Moonrise and moonset calculations
- **[temporal-polyfill](https://github.com/fullcalendar/temporal-polyfill)** by Adam Shaw (MIT): Temporal API for browsers that don't have it yet
- **[ini.js](https://www.npmjs.com/package/ini):** Used by the Zemanim Board TVs in בתי כנסיות.
- **[ics.js](https://www.npmjs.com/package/ics):** Used to create .ics files through the Export functionality on the website
- **[Sheet.js](https://www.npmjs.com/package/xlsx):** Used to create spreadsheets containing all the Zemanim
- **[JSZip](https://stuk.github.io/jszip/):** Used to bundle files for the exports
- **[fitty](https://github.com/rikschennink/fitty):** Fits text to its box

---

These libraries are not ideal, and we plan to replace them (either natively or through a rewrite) when possible. Nevertheless, here's our appreciation for them at the current moment

- **[flexcal](https://github.com/dwachss/flexcal):** A jQuery(-UI) plugin to have a Hebrew-Date picker. To be replaced with a custom implementation built around KosherZmanim
- **[Material Design Web](https://m3.material.io/develop/web):** Replace MDBootstrap's list selector, due to MDBootstrap's being paid.
- **[pdf.js](https://mozilla.github.io/pdf.js/):** Embedded PDF viewer, because native ones either force the person to download the PDF on page-load or have issues scrolling
- **[linkedom](https://www.npmjs.com/package/linkedom):** Used to make DOM code for Web Workers, used for the print-out calendar generator
- **[paged.js](https://pagedjs.org/):** Used as a polyfill for the W3C Print Specifications. Other editors conflict with our static site mentality

##### Other Credits

- **Robert van Gent**, Utrecht University - Tekufot calculation, from [his Hebrew calendar page](https://webspace.science.uu.nl/~gent0113/hebrew/hebrewyear_year.htm)
- **Aharon N. Varady** and **Andrew Meit** - [Menorah Lamnatzeach](https://opensiddur.org/?p=3393) (under the Creative Commons Attribution-ShareAlike (CC BY-SA) 4.0 International copyleft license)
- **Rabbi Gavriel Shimunov** and **Rabbi Yehoshua Kaykov** - Makam research & guidance