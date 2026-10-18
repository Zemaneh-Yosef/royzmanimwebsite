import { handleLanguage, settings, saveSetting } from "./handler.js";
import { isInIsrael } from "../misc/israel.js";
import { Input, Ripple, initMDB } from "../../libraries/mdbootstrap/mdb.js"
import { getPref, savePref, clampMinutes, permissionState, requestPermission, showNotification, PREFS_KEY, PREFS_EVENT } from "../features/zmanNotifications.js";

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

        if (document.getElementById('elevationToggle')) {
            const useElevation = settings.calendarToggle.useElevation(isInIsrael(settings.location.lat(), settings.location.long()));
            document.getElementById('elevationOn').checked = useElevation;
            document.getElementById('elevationOff').checked = !useElevation;

            document.getElementById('elevationToggle').addEventListener('click', () => {
                saveSetting("useElevation", document.getElementById("elevationOn").checked ? "true" : "false");
                if (window.zmanimListUpdater2) {
                    window.zmanimListUpdater2.resetCalendar();
                }
            })
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

        setupNotificationSettings();
    }
})

/** The settings modal's Notifications tab: per-zeman on/off and minutes before (features/zmanNotifications.js) */
function setupNotificationSettings() {
    const root = document.getElementById('zmanNotificationSettings');
    if (!root)
        return;

    const status = root.querySelector('[data-notif-status]');
    const allowButton = root.querySelector('[data-notif-allow]');
    const testButton = root.querySelector('[data-notif-test]');
    const rows = [...root.querySelectorAll('[data-notif-key]')];

    const showState = () => {
        const state = permissionState();
        status.querySelectorAll('[data-notif-state]').forEach(elem =>
            elem.classList.toggle('d-none', elem.getAttribute('data-notif-state') !== state));
        status.classList.remove('alert-info', 'alert-success', 'alert-warning', 'alert-secondary');
        status.classList.add({ granted: 'alert-success', denied: 'alert-warning', unsupported: 'alert-secondary' }[state] || 'alert-info');
        allowButton.classList.toggle('d-none', state !== 'default');
        testButton.classList.toggle('d-none', state !== 'granted');
    };

    const fillRows = () => {
        for (const row of rows) {
            const pref = getPref(row.getAttribute('data-notif-key'));
            const enabled = row.querySelector('[data-notif-enabled]');
            const minutes = row.querySelector('[data-notif-minutes]');
            enabled.checked = pref.enabled;
            if (document.activeElement !== minutes)
                minutes.value = pref.minutes.toString();
            minutes.disabled = !pref.enabled;
        }
    };

    const askPermission = async () => {
        await requestPermission();
        showState();
        // the scheduler only runs with permission: have it pick up the choices now
        window.dispatchEvent(new CustomEvent(PREFS_EVENT));
    };

    for (const row of rows) {
        const key = row.getAttribute('data-notif-key');
        const enabled = row.querySelector('[data-notif-enabled]');
        const minutes = row.querySelector('[data-notif-minutes]');

        enabled.addEventListener('change', () => {
            savePref(key, { enabled: enabled.checked });
            minutes.disabled = !enabled.checked;
            // turning the first one on is the moment to ask (it's a click, which browsers require)
            if (enabled.checked && permissionState() === 'default')
                askPermission();
        });

        minutes.addEventListener('change', () => {
            const value = clampMinutes(minutes.value);
            minutes.value = value.toString();
            savePref(key, { minutes: value });
        });
    }

    allowButton.addEventListener('click', askPermission);
    testButton.addEventListener('click', () => {
        const language = settings.language();
        showNotification(
            language == 'he' ? 'זמני יוסף' : 'Zemaneh Yosef',
            {
                body: language == 'he' ? 'כך ייראו התראות הזמנים.' : 'This is how Zeman notifications will look.',
                tag: 'zman-test'
            }
        );
    });

    // another tab changed them
    window.addEventListener('storage', (event) => { if (event.key === PREFS_KEY) fillRows(); });
    // permission can be changed in the browser's site settings while the page is open
    document.getElementById('settingsModal').addEventListener('show.bs.modal', () => { showState(); fillRows(); });

    showState();
    fillRows();
}