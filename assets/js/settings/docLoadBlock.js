// @ts-check

// Things no polyfill can supply (see _includes/polyfills.html for the ones that can)
if (typeof BigInt !== "function" || !("noModule" in HTMLScriptElement.prototype) || !("Intl" in window) || typeof Intl.supportedValuesOf !== "function" || !Intl.supportedValuesOf('calendar').includes('hebrew')) {
    var modal = document.getElementById("unsupportedModal");
    if (modal) {
        modal.classList.add("show");
        modal.style.display = "block";

        document.body.classList.add("modal-open");
        document.body.style.overflow = "hidden";

        var backdrop = document.createElement("div");
        backdrop.classList.add("modal-backdrop", "fade", "show");
        document.body.appendChild(backdrop)
    }
} else {
    var queryString = window.location.search;
    var urlParams = new URLSearchParams(queryString);

    /** @param {string} param */
    var settingsURLOverride = (param) => urlParams.get(param) || localStorage.getItem(param);

    var settings = Object.freeze({
        /** @returns {'he'|'en'|'he-Latn'} */
        language: function () {
            // a classic script, so it can't import misc/language.js: the same old-value map as legacyLanguages there
            var savedLanguage = settingsURLOverride("zmanimLanguage");
            savedLanguage = { hb: 'he', 'en-et': 'he-Latn' }[savedLanguage] || savedLanguage;
            if (['he', 'he-Latn', 'en'].includes(savedLanguage))
                // @ts-ignore
                return savedLanguage

            if (window.navigator && window.navigator.languages) {
                const languagePartOfOptions = window.navigator.languages.find(language => /^(he|iw|en)(-|$)/i.test(language))
                if (languagePartOfOptions) {
                    return /^en/i.test(languagePartOfOptions) ? 'en' : 'he'
                }
            }

            return 'he';
        }
    })

    function handleLanguage(zmanimLanguage = settings.language()) {
        switch (zmanimLanguage) {
            case 'he':
            default: {
                document.body.classList.remove("lang-en", "lang-he-Latn");
                document.body.classList.add("lang-he");

                var bsCSSLink = document.getElementById("bs");
                if (bsCSSLink && bsCSSLink.getAttribute("href") !== "/assets/libraries/bootstrap/css/bootstrap.rtl.min.css")
                    bsCSSLink.setAttribute("href", "/assets/libraries/bootstrap/css/bootstrap.rtl.min.css")

                var mdbCSSLink = document.getElementById("mdb");
                if (mdbCSSLink && mdbCSSLink.getAttribute("href") !== "/assets/libraries/mdbootstrap/out-rtl.css")
                    mdbCSSLink.setAttribute("href", "/assets/libraries/mdbootstrap/out-rtl.css")

                var bsrCSSLink = document.getElementById("bsr");
                if (bsrCSSLink && bsrCSSLink.getAttribute("href") !== "/assets/libraries/bootstrap/css/bootstrap-reboot.rtl.min.css")
                    bsrCSSLink.setAttribute("href", "/assets/libraries/bootstrap/css/bootstrap-reboot.rtl.min.css")

                document.body.dir = "rtl";
                break;
            } case 'he-Latn': {
                document.body.classList.remove("lang-he", "lang-en");
                document.body.classList.add("lang-he-Latn");

                var bsCSSLink = document.getElementById("bs");
                if (bsCSSLink && bsCSSLink.getAttribute("href") !== "/assets/libraries/bootstrap/css/bootstrap.min.css")
                    bsCSSLink.setAttribute("href", "/assets/libraries/bootstrap/css/bootstrap.min.css")

                var mdbCSSLink = document.getElementById("mdb");
                if (mdbCSSLink && mdbCSSLink.getAttribute("href") !== "/assets/libraries/mdbootstrap/out.css")
                    mdbCSSLink.setAttribute("href", "/assets/libraries/mdbootstrap/out.css")

                var bsrCSSLink = document.getElementById("bsr");
                if (bsrCSSLink && bsrCSSLink.getAttribute("href") !== "/assets/libraries/bootstrap/css/bootstrap-reboot.min.css")
                    bsrCSSLink.setAttribute("href", "/assets/libraries/bootstrap/css/bootstrap-reboot.min.css")

                document.body.dir = "ltr"
                break;
            } case 'en': {
                document.body.classList.remove("lang-he", "lang-he-Latn");
                document.body.classList.add("lang-en");

                var bsCSSLink = document.getElementById("bs");
                if (bsCSSLink && bsCSSLink.getAttribute("href") !== "/assets/libraries/bootstrap/css/bootstrap.min.css")
                    bsCSSLink.setAttribute("href", "/assets/libraries/bootstrap/css/bootstrap.min.css")

                var mdbCSSLink = document.getElementById("mdb");
                if (mdbCSSLink && mdbCSSLink.getAttribute("href") !== "/assets/libraries/mdbootstrap/out.css")
                    mdbCSSLink.setAttribute("href", "/assets/libraries/mdbootstrap/out.css")

                var bsrCSSLink = document.getElementById("bsr");
                if (bsrCSSLink && bsrCSSLink.getAttribute("href") !== "/assets/libraries/bootstrap/css/bootstrap-reboot.min.css")
                    bsrCSSLink.setAttribute("href", "/assets/libraries/bootstrap/css/bootstrap-reboot.min.css")

                document.body.dir = "ltr"
                break;
            }
        }
    }

    handleLanguage();
}