import { handleLanguage } from "./handler.js";

document.addEventListener("DOMContentLoaded", () => {
    handleLanguage();

    if (localStorage.getItem("calendarSource") == "ohrHachaim") {
        document.getElementById("ohrHachaim").checked = true;
        document.getElementById("amudehHoraah").checked = false;
    }

    if (localStorage.getItem("timeFormat") == "12") {
        document.getElementById("12h").checked = true;
        document.getElementById("24h").checked = false;
    }

    document.getElementById('languageSelector').addEventListener('click', () => {
        handleLanguage(document.getElementById('hebrew').checked ? 'hb' : (document.getElementById('enet').checked ? 'en-et' : 'en'), true);
    })

    document.getElementById('calendarPsakSetter').addEventListener('click', () => {
        localStorage.setItem("calendarSource", document.getElementById("amudehHoraah").checked ? "amudehHoraah" : "ohrHachaim")
        if (window.zmanimListUpdater2) {
            window.zmanimListUpdater2.resetCalendar()
            window.zmanimListUpdater2.updateZmanimList()
        }
    })

    document.getElementById('timeFormatter').addEventListener('click', () => {
        localStorage.setItem("timeFormat", document.getElementById("24h").checked ? "24" : "12");
        if (window.zmanimListUpdater2)
            window.zmanimListUpdater2.updateZmanimList()
    })
})