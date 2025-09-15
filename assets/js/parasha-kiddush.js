// @ts-check
import WebsiteLimudCalendar from './WebsiteLimudCalendar.js';

// @ts-ignore
const jCal = new WebsiteLimudCalendar(document.getElementById('inputYear').value, 7, 1);
const containerElem = document.getElementById('kiddushRows');

function generateRows() {
    // @ts-ignore
    const yearType = jCal.getParshaYearType();
    for (let parsha of WebsiteLimudCalendar.parshalist[yearType]) {
        if (parsha == WebsiteLimudCalendar.parshalist[yearType][0]) {
            continue;
        }

        while (jCal.getParshah() != parsha) {
            jCal.setDate(jCal.getDate().add({ days: 1}));
        }

        containerElem.insertAdjacentHTML('beforeend', jCal.formatFancyDate());
        containerElem.appendChild(document.createTextNode(' - '));
        containerElem.appendChild(document.createTextNode(WebsiteLimudCalendar.hebrewParshaMap[parsha]));
        containerElem.appendChild(document.createTextNode(' - '));
        const inputField = document.createElement('input');
        inputField.type = 'text';
        inputField.name = `kiddush_${parsha}`;
        inputField.size = 40;
        inputField.value = localStorage.getItem(`kiddush_${parsha}`) || '';
        inputField.onkeydown = (e) => {
            if (e.key == 'Enter') {
                localStorage.setItem(inputField.name, inputField.value);
                e.preventDefault();
                inputField.blur();
            }
        }
        containerElem.appendChild(inputField);
        containerElem.appendChild(document.createElement('br'));
    }
}

generateRows();
document.getElementById('inputYear').oninput = (e) => {
    // @ts-ignore
    const year = parseInt(e.target.value);
    if (!isNaN(year) && year > 5000 && year < 6000) {
        jCal.setJewishDate(year, 7, 1);
        containerElem.innerHTML = '';
        generateRows();
    }
}