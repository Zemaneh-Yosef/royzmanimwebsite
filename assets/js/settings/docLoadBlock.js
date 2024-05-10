// @ts-check

/**
 * @param {MediaQueryListEvent | MediaQueryList} e
 */
function handleThemeChange(e) {
    document.documentElement.setAttribute('data-bs-theme', (e.matches ? 'dark' : 'light'))
}

var landscapeMQ = window.matchMedia("(prefers-color-scheme: dark)");
landscapeMQ.addEventListener("change", handleThemeChange);
handleThemeChange(landscapeMQ)

if (typeof BigInt !== "function" || !("Intl" in window) || typeof Intl.supportedValuesOf !== "function" || !Intl.supportedValuesOf('calendar').includes('hebrew')) {
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
        /** @returns {'hb'|'en'|'en-et'} */
        language: function () {
            if (['hb', 'en-et', 'en'].includes(settingsURLOverride("zmanimLanguage")))
                // @ts-ignore
                return settingsURLOverride("zmanimLanguage")

            if (window.navigator && window.navigator.languages) {
                const languagePartOfOptions = window.navigator.languages.find(language => language.includes('hb') || language.includes('en'))
                if (languagePartOfOptions) {
                    return languagePartOfOptions.includes('en') ? 'en' : 'hb'
                }
            }

            return 'hb';
        }
    })

    function handleLanguage(zmanimLanguage = settings.language()) {
        switch (zmanimLanguage) {
            case 'hb':
            default: {
                document.body.classList.remove("lang-en", "lang-en-et");
                document.body.classList.add("lang-hb");

                var bsCSSLink = document.getElementById("bs");
                if (bsCSSLink && bsCSSLink.getAttribute("href") !== "/assets/libraries/bootstrap/css/bootstrap.rtl.min.css")
                    bsCSSLink.setAttribute("href", "/assets/libraries/bootstrap/css/bootstrap.rtl.min.css")

                var mdbCSSLink = document.getElementById("mdb");
                if (mdbCSSLink && mdbCSSLink.getAttribute("href") !== "/assets/libraries/mdbootstrap/out-rtl.css")
                    mdbCSSLink.setAttribute("href", "/assets/libraries/mdbootstrap/out-rtl.css")

                var bsrCSSLink = document.getElementById("bsr");
                if (bsrCSSLink && bsrCSSLink.getAttribute("href") !== "/assets/libraries/bootstrap/css/bootstrap-reboot-rtl.min.css")
                    bsrCSSLink.setAttribute("href", "/assets/libraries/bootstrap/css/bootstrap-reboot-rtl.min.css")

                document.body.dir = "rtl";
                break;
            } case 'en-et': {
                document.body.classList.remove("lang-hb", "lang-en");
                document.body.classList.add("lang-en-et");

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
                document.body.classList.remove("lang-hb", "lang-en-et");
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