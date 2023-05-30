(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.n2words = factory());
})(this, (function () { 'use strict';

  /**
   * Creates new language class that processes decimals separately.
   * Requires implementing `toCardinal`.
   */
  class AbstractLanguage {
    #negativeWord;
    #separatorWord;
    #zero;
    #spaceSeparator;
    #wholeNumber;

    /**
     * @param {object} options Options for class.
     * @param {string} [options.negativeWord = ''] Word that precedes a negative number (if any).
     * @param {string} options.separatorWord Word that separates cardinal numbers (i.e. "and").
     * @param {string} options.zero Word for 0 (i.e. "zero").
     * @param {string} [options.spaceSeparator = ' '] Character that separates words.
     */
    constructor(options) {
      // Merge supplied options with defaults
      options = Object.assign({
        negativeWord: '',
        separatorWord: undefined,
        zeroWord: undefined,
        spaceSeparator: ' '
      }, options);

      // Make options available to class
      this.#negativeWord = options.negativeWord;
      this.#separatorWord = options.separatorWord;
      this.#zero = options.zero;
      this.#spaceSeparator = options.spaceSeparator;
    }

    /**
     * @returns {string} Word that precedes a negative number (if any).
     */
    get negativeWord() {
      return this.#negativeWord;
    }

    /**
     * @returns {string} Word that separates cardinal numbers (i.e. "and").
     */
    get separatorWord() {
      return this.#separatorWord;
    }

    /**
     * @returns {string} Word for 0 (i.e. "zero").
     */
    get zero() {
      return this.#zero;
    }

    /**
     * @returns {string} Character that separates words.
     */
    get spaceSeparator() {
      return this.#spaceSeparator;
    }

    /**
     * @returns {number} Input value without decimal.
     */
    get wholeNumber() {
      return this.#wholeNumber;
    }

    /**
     * Convert decimal number to a string array of cardinal numbers.
     * @param {number} decimal Decimal number to convert.
     * @returns {string} Value in written format.
     */
    decimalToCardinal(decimal) {
      const words = [];

      // Split decimal portion into an array of characters in reverse
      const chars = decimal.split('').reverse();

      // Loop through array (from the end) adding words to output array
      while (chars.pop() == '0') {
        words.push(this.zero);
      }

      // Add decimal number to word array
      return words.concat(this.toCardinal(BigInt(decimal)));
    }

    /**
     * Converts a number to written form.
     * @param {number|string} value Number to be convert.
     * @throws {Error} Value must be a valid number.
     * @returns {string} Value in written format.
     */
    floatToCardinal(value) {
      // Validate user input value
      if (typeof value == 'number') {
        if (Number.isNaN(value)) {
          throw new Error('NaN is not an accepted number.');
        }
        value = value.toString();
      } else if (typeof value == 'string') {
        value = value.trim();
        if (value.length == 0 || Number.isNaN(Number(value))) {
          throw new Error('"' + value + '" is not a valid number.');
        }
      } else if (typeof value != 'bigint') {
        throw new TypeError('Invalid variable type: ' + typeof value);
      }

      let words = [];
      let wholeNumber;
      let decimalNumber;

      // If negative number add negative word
      if (value < 0) {
        words.push(this.negativeWord);
      }

      // Split value decimal (if any) (excluding BigInt)
      if (typeof value == 'bigint') {
        wholeNumber = value;
      } else {
        const splitValue = value.split('.');
        wholeNumber = BigInt(splitValue[0]);
        decimalNumber = splitValue[1];
      }

      // Convert whole number to positive (if negative)
      if (wholeNumber < 0) {
        wholeNumber = -wholeNumber;
      }

      // NOTE: Only needed for CZ
      this.#wholeNumber = wholeNumber;

      // Add whole number in written form
      words = words.concat(this.toCardinal(wholeNumber));

      // Add decimal number in written form (if any)
      if (decimalNumber) {
        words.push(this.separatorWord);

        words = words.concat(this.decimalToCardinal(decimalNumber));
      }

      // Join words with spaces
      return words.join(this.spaceSeparator);
    }
  }

  class N2WordsRU extends AbstractLanguage {
    feminine = false;

    ones = {
      1: 'один',
      2: 'два',
      3: 'три',
      4: 'четыре',
      5: 'пять',
      6: 'шесть',
      7: 'семь',
      8: 'восемь',
      9: 'девять'
    };

    onesFeminine = {
      1: 'одна',
      2: 'две',
      3: 'три',
      4: 'четыре',
      5: 'пять',
      6: 'шесть',
      7: 'семь',
      8: 'восемь',
      9: 'девять'
    };

    tens = {
      0: 'десять',
      1: 'одиннадцать',
      2: 'двенадцать',
      3: 'тринадцать',
      4: 'четырнадцать',
      5: 'пятнадцать',
      6: 'шестнадцать',
      7: 'семнадцать',
      8: 'восемнадцать',
      9: 'девятнадцать'
    };

    twenties = {
      2: 'двадцать',
      3: 'тридцать',
      4: 'сорок',
      5: 'пятьдесят',
      6: 'шестьдесят',
      7: 'семьдесят',
      8: 'восемьдесят',
      9: 'девяносто'
    };

    hundreds = {
      1: 'сто',
      2: 'двести',
      3: 'триста',
      4: 'четыреста',
      5: 'пятьсот',
      6: 'шестьсот',
      7: 'семьсот',
      8: 'восемьсот',
      9: 'девятьсот'
    };

    thousands = {
      1: ['тысяча', 'тысячи', 'тысяч'], // 10^ 3
      2: ['миллион', 'миллиона', 'миллионов'], // 10^ 6
      3: ['миллиард', 'миллиарда', 'миллиардов'], // 10^ 9
      4: ['триллион', 'триллиона', 'триллионов'], // 10^ 12
      5: ['квадриллион', 'квадриллиона', 'квадриллионов'], // 10^ 15
      6: ['квинтиллион', 'квинтиллиона', 'квинтиллионов'], // 10^ 18
      7: ['секстиллион', 'секстиллиона', 'секстиллионов'], // 10^ 21
      8: ['септиллион', 'септиллиона', 'септиллионов'], // 10^ 24
      9: ['октиллион', 'октиллиона', 'октиллионов'], // 10^ 27
      10: ['нониллион', 'нониллиона', 'нониллионов'], // 10^ 30
    };

    constructor(options = {}) {
      super(Object.assign({
        negativeWord: 'минус',
        separatorWord: 'запятая',
        zero: 'ноль'
      }, options));
    }

    toCardinal(number) {
      if (number == 0) {
        return this.zero;
      }

      const words = [];

      const chunks = this.splitByX(number.toString(), 3);

      let i = chunks.length;

      for (let j = 0; j < chunks.length; j++) {
        const x = chunks[j];
        let ones = [];
        i = i - 1;

        if (x == 0) {
          continue;
        }

        const [n1, n2, n3] = this.getDigits(x);

        if (n3 > 0) {
          words.push(this.hundreds[n3]);
        }

        if (n2 > 1) {
          words.push(this.twenties[n2]);
        }

        if (n2 == 1) {
          words.push(this.tens[n1]);
        } else if (n1 > 0) {
          ones = (i == 1 || this.feminine && i == 0) ? this.onesFeminine : this.ones;
          words.push(ones[n1]);
        }

        if (i > 0) {
          words.push(this.pluralize(x, this.thousands[i]));
        }
      }

      return words.join(' ');
    }

    splitByX(n, x, formatInt = true) {
      const results = [];
      const l = n.length;
      let result;

      if (l > x) {
        const start = l % x;

        if (start > 0) {
          result = n.slice(0, start);

          if (formatInt) {
            results.push(BigInt(result));
          } else {
            results.push(result);
          }
        }

        for (let i = start; i < l; i += x) {
          result = n.slice(i, i + x);

          if (formatInt) {
            results.push(BigInt(result));
          } else {
            results.push(result);
          }
        }
      } else {
        if (formatInt) {
          results.push(BigInt(n));
        } else {
          results.push(n);
        }
      }

      return results;
    }

    getDigits(value) {
      const a = Array.from(value.toString().padStart(3, '0').slice(-3)).reverse();
      return a.map(e => BigInt(e));
    }

    pluralize(n, forms) {
      let form = 2;
      if ((n % 100n < 10n) || (n % 100n > 20n)) {
        if (n % 10n == 1n) {
          form = 0;
        } else if ((n % 10n < 5n) && (n % 10n > 1n)) {
          form = 1;
        }
      }
      return forms[form];
    }
  }

  class N2WordsHE extends N2WordsRU {
    and = 'ו';

    ones = { 1: 'אחד', 2: 'שנים', 3: 'שלושה', 4: 'ארבעה', 5: 'חמישה', 6: 'שישה', 7: 'שבעה', 8: 'שמונה', 9: 'תשעה' };
      tens = {
        0: 'עשרה', 1: 'אחד עשר', 2: 'שנים עשר', 3: 'שלושה עשר', 4: 'ארבע עשר',
        5: 'חמישה עשר', 6: 'ששה עשר', 7: 'שבעה עשרה', 8: 'שמונה עשר', 9: 'תשעה עשר'
      };

    twenties = {
      2: 'עשרים',
      3: 'שלשים',
      4: 'ארבעים',
      5: 'חמישים',
      6: 'ששים',
      7: 'שבעים',
      8: 'שמונים',
      9: 'תשעים'
    };

    hundreds = {
      1: 'מאה',
      2: 'מאתיים',
      3: 'מאות'
    };

    thousands = {
      1: 'אלף',
      2: 'אלפיים',
      3: 'שלשת אלפים',
      4: 'ארבעת אלפים',
      5: 'חמשת אלפים',
      6: 'ששת אלפים',
      7: 'שבעת אלפים',
      8: 'שמונת אלפים',
      9: 'תשעת אלפים'
    };

    constructor() {
      /**
       * @todo Confirm `negativeWord`
       * @todo Set `separatorWord`
       */
      super({
        negativeWord: 'מינוס',
        //separatorWord: ,
        zero: 'אפס'
      });
    }

    toCardinal(number) {
      if (number == 0) {
        return this.zero;
      }
      const words = [];
      const chunks = this.splitByX(number.toString(), 3);
      let i = chunks.length;
      for (let j = 0; j < chunks.length; j++) {
        const x = chunks[j];
        i = i - 1;
        if (x == 0) {
          continue;
        }
        const [n1, n2, n3] = this.getDigits(x);
        if (i > 0) {
          words.push(this.thousands[n1]);
          continue;
        }
        if (n3 > 0) {
          if (n3 <= 2) {
            words.push(this.hundreds[n3]);
          } else {
            words.push(this.ones[n3] + ' ' + this.hundreds[3]);
          }
        }
        if (n2 == 1) {
          words.push(this.tens[n1]);
        } else if (n1 > 0 && !(i > 0 && x == 1)) {
          words.push(this.ones[n1]);
        }
        if (n2 > 1) {
          words.push(this.twenties[n2]);
        }
        if (i > 0) {
          words.push(this.thousands[i]);
        }
      }
      if (words.length > 1) {
        words[words.length - 1] = this.and + words[words.length - 1];
      }
      return words.join(' ');
    }
  }

  /**
   * Converts a value to cardinal (written) form.
   * @param {number|string} value Number to be convert.
   * @throws {Error} Value cannot be invalid.
   * @returns {string} Value in cardinal (written) format.
   */
  function HE(value) {
    return new N2WordsHE().floatToCardinal(value);
  }

  return HE;

}));
