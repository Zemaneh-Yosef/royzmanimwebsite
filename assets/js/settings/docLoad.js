import { handleLanguage } from "./handler.js";

document.addEventListener("DOMContentLoaded", () => {
    handleLanguage();

    const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]')
    const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new window.bootstrap.Tooltip(tooltipTriggerEl))

    if (localStorage.getItem("calendarSource") == "ohrHachaim") {
        document.getElementById("ohrHachaim").checked = true;
        document.getElementById("amudehHoraah").checked = false;
    }

    if (localStorage.getItem("timeFormat") == "h12") {
        document.getElementById("12h").checked = true;
        document.getElementById("24h").checked = false;
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

        if (window.zmanimListUpdater2) {
            window.zmanimListUpdater2.resetCalendar()
            window.zmanimListUpdater2.updateZmanimList()
        }
    })

    document.getElementById('timeFormatter').addEventListener('click', () => {
        localStorage.setItem("timeFormat", document.getElementById("24h").checked ? "h24" : "h12");
        if (window.zmanimListUpdater2) {
            window.zmanimListUpdater2.resetCalendar();
        }
    })
})