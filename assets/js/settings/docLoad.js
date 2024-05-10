import { handleLanguage, settings } from "./handler.js";
import { Input, Ripple, initMDB } from "../../libraries/mdbootstrap/mdb.esm.js"

document.addEventListener("DOMContentLoaded", () => {
    handleLanguage();
    initMDB({Input, Ripple});

    const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]')
    const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new window.bootstrap.Tooltip(tooltipTriggerEl))

    if (document.getElementById('settingsModal')) {
        if (settings.calendarToggle.hourCalculators() == "seasonal") {
            document.getElementById("ohrHachaim").checked = true;
            document.getElementById("amudehHoraah").checked = false;
        } else {
            document.getElementById("ohrHachaim").checked = false;
            document.getElementById("amudehHoraah").checked = true;
        }

        if (settings.timeFormat() == "h12") {
            document.getElementById("12h").checked = true;
            document.getElementById("24h").checked = false;
        } else {
            document.getElementById("12h").checked = false;
            document.getElementById("24h").checked = true;
        }

        if (settings.language() == "hb") {
            document.getElementById('hebrew').checked = true;
            document.getElementById('enet').checked = false;
            document.getElementById('enli').checked = false;
        } else if (settings.language() == "en-et") {
            document.getElementById('hebrew').checked = false;
            document.getElementById('enet').checked = true;
            document.getElementById('enli').checked = false;
        } else {
            document.getElementById('hebrew').checked = false;
            document.getElementById('enet').checked = false;
            document.getElementById('enli').checked = true;
        }

        if (document.getElementById('showSeconds') && document.getElementById('onHoverSeconds')) {
            if (settings.seconds()) {
                document.getElementById('showSeconds').checked = true;
                document.getElementById('onHoverSeconds').checked = false;
            } else {
                document.getElementById('showSeconds').checked = false;
                document.getElementById('onHoverSeconds').checked = true;
            }
        }

        document.getElementById('languageSelector').addEventListener('click', () => {
            handleLanguage(document.getElementById('hebrew').checked ? 'hb' : (document.getElementById('enet').checked ? 'en-et' : 'en'), true);
        })

        document.getElementById('calendarPsakSetter').addEventListener('click', () => {
            if (document.getElementById("amudehHoraah").checked) {
                localStorage.setItem("hourCalculators", "degrees");
                localStorage.setItem("rtKulah", "true");
                localStorage.setItem("tzeitTaanitHumra", "false");
                localStorage.setItem("tekufa", "hatzoth");
            } else {
                localStorage.setItem("hourCalculators", "seasonal");
                localStorage.setItem("rtKulah", "false");
                localStorage.setItem("tzeitTaanitHumra", "true");
                localStorage.setItem("tekufa", "arbitrary");
            }

            if (window.zmanimListUpdater2)
                window.zmanimListUpdater2.resetCalendar()
        })

        document.getElementById('timeFormatter').addEventListener('click', () => {
            localStorage.setItem("timeFormat", document.getElementById("24h").checked ? "h24" : "h12");
            if (window.zmanimListUpdater2) {
                window.zmanimListUpdater2.resetCalendar();
            }
        })

        if (document.getElementById('secondsShow'))
            document.getElementById('secondsShow').addEventListener('click', () => {
                console.log('seconds show')
                localStorage.setItem("seconds", document.getElementById("showSeconds").checked ? "true" : "false");
                if (window.zmanimListUpdater2) {
                    window.zmanimListUpdater2.resetCalendar();
                }
            })
    }
})