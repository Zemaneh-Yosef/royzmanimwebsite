import { handleLanguage, settings, saveSetting } from "./handler.js";
import { isInIsrael } from "../misc/israel.js";
import { Input, Ripple, initMDB } from "../../libraries/mdbootstrap/mdb.js"
import { scheduleSync } from "../features/pushNotifications.js";
import "../features/placesList.js";

const SIDEBAR_WIDE_KEY = "sidebarWide";

document.addEventListener("DOMContentLoaded", () => {
    handleLanguage();
    initMDB({Input, Ripple});
    document.querySelectorAll('[data-mdb-ripple-init]').forEach((el) => {
        const ripple = new Ripple(el);
        ripple.init();
    })

    const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]')
    const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new window.bootstrap.Tooltip(tooltipTriggerEl))

    // the sidebar, slim (icons with tooltips) or wide (the logo on one line, the saved places, labels by the icons);
    // docLoadBlock.js puts the class on before the page shows, so it doesn't jump
    const sidebar = document.getElementById('sidebar');
    const sidebarToggle = document.querySelector('[data-sidebar-toggle]');
    if (sidebar && sidebarToggle) {
        const sidebarTooltips = tooltipList.filter(tooltip => sidebar.contains(tooltip._element));
        const showSidebar = (wide) => {
            document.documentElement.classList.toggle('sidebar-wide', wide);
            sidebarToggle.setAttribute('aria-label', wide ? 'Narrower sidebar' : 'Wider sidebar');
            sidebarTooltips.forEach(tooltip => { tooltip.hide(); wide ? tooltip.disable() : tooltip.enable(); });
        };
        showSidebar(document.documentElement.classList.contains('sidebar-wide'));
        sidebarToggle.addEventListener('click', () => {
            const wide = !document.documentElement.classList.contains('sidebar-wide');
            try { localStorage.setItem(SIDEBAR_WIDE_KEY, String(wide)); } catch (e) { /* blocked: this page only */ }
            showSidebar(wide);
        });
    }

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

        if (document.getElementById('elevationToggle')) {
            const useElevation = settings.calendarToggle.useElevation(isInIsrael(settings.location.lat(), settings.location.long()));
            document.getElementById('elevationOn').checked = useElevation;
            document.getElementById('elevationOff').checked = !useElevation;

            document.getElementById('elevationToggle').addEventListener('click', () => {
                saveSetting("useElevation", document.getElementById("elevationOn").checked ? "true" : "false");
                scheduleSync();
                if (window.zmanimListUpdater2) {
                    window.zmanimListUpdater2.resetCalendar();
                }
            })
        }

        document.getElementById('languageSelector').addEventListener('click', () => {
            handleLanguage(document.getElementById('hebrew').checked ? 'he' : (document.getElementById('enet').checked ? 'he-Latn' : 'en'), true);
            scheduleSync();
            if (window.zmanimListUpdater2) {
                window.zmanimListUpdater2.resetCalendar();
            }
        })

        document.getElementById('timeFormatter').addEventListener('click', () => {
            localStorage.setItem("timeFormat", document.getElementById("24h").checked ? "h23" : "h12");
            scheduleSync();
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
