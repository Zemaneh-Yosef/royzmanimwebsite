// @ts-check

import { ZemanFunctions } from "../ROYZmanim.js";
export default class rYisraelizmanim extends ZemanFunctions {
    getCandleLighting() {
        return this.getShkiya().subtract({ minutes: 20 })
    }

    getTzetMelakha() {
        return this.getShkiya().add({ minutes: 40 })
    }

    getTzetRT() {
        return this.getShkiya().add({ minutes: 72 });
    }
}