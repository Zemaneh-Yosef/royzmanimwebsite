function handleThemeChange(e) {
    // Check if the media query is true
    if (e.matches) {
        document.documentElement.setAttribute('data-bs-theme', 'dark')
    } else {
        document.documentElement.setAttribute('data-bs-theme', 'light')
    }
}

const landscapeMQ = window.matchMedia("(prefers-color-scheme: dark)");
landscapeMQ.addEventListener("change", handleThemeChange);
handleThemeChange(landscapeMQ)

const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);

/** @param {string} param */
const settingsURLOverride = (param) => urlParams.get(param) || localStorage.getItem(param);

const settings = Object.freeze({
    /** @returns {'hb'|'en'|'en-et'} */
	language: () => {
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

            const bsCSSLink = document.getElementById("bs");
            if (bsCSSLink.getAttribute("href") !== "/assets/libraries/bootstrap/css/bootstrap.rtl.min.css")
                bsCSSLink.setAttribute("href", "/assets/libraries/bootstrap/css/bootstrap.rtl.min.css")

            document.body.dir = "rtl";
            break;
        } case 'en-et': {
            document.body.classList.remove("lang-hb", "lang-en");
            document.body.classList.add("lang-en-et");

            const bsCSSLink = document.getElementById("bs");
            if (bsCSSLink.getAttribute("href") !== "/assets/libraries/bootstrap/css/bootstrap.min.css")
                bsCSSLink.setAttribute("href", "/assets/libraries/bootstrap/css/bootstrap.min.css")

            document.body.dir = "ltr"
            break;
        } case 'en': {
            document.body.classList.remove("lang-hb", "lang-en-et");
            document.body.classList.add("lang-en");

            const bsCSSLink = document.getElementById("bs");
            if (bsCSSLink.getAttribute("href") !== "/assets/libraries/bootstrap/css/bootstrap.min.css")
                bsCSSLink.setAttribute("href", "/assets/libraries/bootstrap/css/bootstrap.min.css")

            document.body.dir = "ltr"
            break;
        }
    }
}

handleLanguage();