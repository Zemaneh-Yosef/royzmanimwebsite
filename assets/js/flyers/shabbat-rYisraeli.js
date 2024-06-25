import { AmudehHoraahZmanim } from "../ROYZmanim.js";
export default class rYisraelizmanim extends AmudehHoraahZmanim {
    getCandleLighting() {
        return this.getShkiya().subtract({ minutes: 20 })
    }

    getTzaitShabbath() {
        return this.getShkiya().add({ minutes: 40 })
    }

    getTzaitRT() {
        return this.getShkiya().add({ minutes: 72 });
    }
}