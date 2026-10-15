import { handleLanguage, settings } from "./handler.js";
import { Input, Ripple, initMDB } from "../../libraries/mdbootstrap/mdb.js"

document.addEventListener("DOMContentLoaded", () => {
    handleLanguage();
    initMDB({Input, Ripple});
    document.querySelectorAll('[data-mdb-ripple-init]').forEach((el) => {
        const ripple = new Ripple(el);
        ripple.init();
    })

    const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]')
    const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new window.bootstrap.Tooltip(tooltipTriggerEl))

    if (document.getElementById('settingsModal')) {
        if (settings.timeFormat() == "h12") {
            document.getElementById("12h").checked = true;
            document.getElementById("24h").checked = false;
        } else {
            document.getElementById("12h").checked = false;
            document.getElementById("24h").checked = true;
        }

        if (settings.language() == "he") {
            document.getElementById('hebrew').checked = true;
            document.getElementById('enet').checked = false;
            document.getElementById('enli').checked = false;
        } else if (settings.language() == "he-Latn") {
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
            handleLanguage(document.getElementById('hebrew').checked ? 'he' : (document.getElementById('enet').checked ? 'he-Latn' : 'en'), true);
            if (window.zmanimListUpdater2) {
                window.zmanimListUpdater2.resetCalendar();
            }
        })

        document.getElementById('timeFormatter').addEventListener('click', () => {
            localStorage.setItem("timeFormat", document.getElementById("24h").checked ? "h23" : "h12");
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