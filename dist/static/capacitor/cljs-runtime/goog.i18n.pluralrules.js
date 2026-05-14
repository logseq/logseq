goog.provide("goog.i18n.pluralRules");
goog.require("goog.i18n.LocaleFeature");
goog.i18n.pluralRules.Keyword = {ZERO:"zero", ONE:"one", TWO:"two", FEW:"few", MANY:"many", OTHER:"other"};
goog.i18n.pluralRules.select;
goog.i18n.pluralRules.defaultSelect_ = function(n, precision) {
  return goog.i18n.pluralRules.Keyword.OTHER;
};
goog.i18n.pluralRules.decimals_ = function(n) {
  const str = n + "";
  const result = str.indexOf(".");
  return result === -1 ? 0 : str.length - result - 1;
};
goog.i18n.pluralRules.get_vf_ = function(n, precision) {
  const DEFAULT_DIGITS = 3;
  let v;
  if (undefined === precision) {
    v = Math.min(goog.i18n.pluralRules.decimals_(n), DEFAULT_DIGITS);
  } else {
    v = precision;
  }
  const base = Math.pow(10, v);
  const f = (n * base | 0) % base;
  return {v:v, f:f};
};
goog.i18n.pluralRules.get_wt_ = function(v, f) {
  if (f === 0) {
    return {w:0, t:0};
  }
  while (f % 10 === 0) {
    f /= 10;
    v--;
  }
  return {w:v, t:f};
};
goog.i18n.pluralRules.get_e_ = function(n) {
  return 0;
};
goog.i18n.pluralRules.filSelect_ = function(n, precision) {
  const i = n | 0;
  const vf = goog.i18n.pluralRules.get_vf_(n, precision);
  if (vf.v == 0 && (i == 1 || i == 2 || i == 3) || vf.v == 0 && i % 10 != 4 && i % 10 != 6 && i % 10 != 9 || vf.v != 0 && vf.f % 10 != 4 && vf.f % 10 != 6 && vf.f % 10 != 9) {
    return goog.i18n.pluralRules.Keyword.ONE;
  }
  return goog.i18n.pluralRules.Keyword.OTHER;
};
goog.i18n.pluralRules.heSelect_ = function(n, precision) {
  const i = n | 0;
  const vf = goog.i18n.pluralRules.get_vf_(n, precision);
  if (i == 1 && vf.v == 0 || i == 0 && vf.v != 0) {
    return goog.i18n.pluralRules.Keyword.ONE;
  }
  if (i == 2 && vf.v == 0) {
    return goog.i18n.pluralRules.Keyword.TWO;
  }
  return goog.i18n.pluralRules.Keyword.OTHER;
};
goog.i18n.pluralRules.brSelect_ = function(n, precision) {
  if (n % 10 == 1 && n % 100 != 11 && n % 100 != 71 && n % 100 != 91) {
    return goog.i18n.pluralRules.Keyword.ONE;
  }
  if (n % 10 == 2 && n % 100 != 12 && n % 100 != 72 && n % 100 != 92) {
    return goog.i18n.pluralRules.Keyword.TWO;
  }
  if ((n % 10 >= 3 && n % 10 <= 4 || n % 10 == 9) && (n % 100 < 10 || n % 100 > 19) && (n % 100 < 70 || n % 100 > 79) && (n % 100 < 90 || n % 100 > 99)) {
    return goog.i18n.pluralRules.Keyword.FEW;
  }
  if (n != 0 && n % 1000000 == 0) {
    return goog.i18n.pluralRules.Keyword.MANY;
  }
  return goog.i18n.pluralRules.Keyword.OTHER;
};
goog.i18n.pluralRules.srSelect_ = function(n, precision) {
  const i = n | 0;
  const vf = goog.i18n.pluralRules.get_vf_(n, precision);
  if (vf.v == 0 && i % 10 == 1 && i % 100 != 11 || vf.f % 10 == 1 && vf.f % 100 != 11) {
    return goog.i18n.pluralRules.Keyword.ONE;
  }
  if (vf.v == 0 && i % 10 >= 2 && i % 10 <= 4 && (i % 100 < 12 || i % 100 > 14) || vf.f % 10 >= 2 && vf.f % 10 <= 4 && (vf.f % 100 < 12 || vf.f % 100 > 14)) {
    return goog.i18n.pluralRules.Keyword.FEW;
  }
  return goog.i18n.pluralRules.Keyword.OTHER;
};
goog.i18n.pluralRules.roSelect_ = function(n, precision) {
  const i = n | 0;
  const vf = goog.i18n.pluralRules.get_vf_(n, precision);
  if (i == 1 && vf.v == 0) {
    return goog.i18n.pluralRules.Keyword.ONE;
  }
  if (vf.v != 0 || n == 0 || n != 1 && n % 100 >= 1 && n % 100 <= 19) {
    return goog.i18n.pluralRules.Keyword.FEW;
  }
  return goog.i18n.pluralRules.Keyword.OTHER;
};
goog.i18n.pluralRules.hiSelect_ = function(n, precision) {
  const i = n | 0;
  if (i == 0 || n == 1) {
    return goog.i18n.pluralRules.Keyword.ONE;
  }
  return goog.i18n.pluralRules.Keyword.OTHER;
};
goog.i18n.pluralRules.esSelect_ = function(n, precision) {
  const i = n | 0;
  const e = goog.i18n.pluralRules.get_e_(n);
  const vf = goog.i18n.pluralRules.get_vf_(n, precision);
  if (n == 1) {
    return goog.i18n.pluralRules.Keyword.ONE;
  }
  if (e == 0 && i != 0 && i % 1000000 == 0 && vf.v == 0 || (e < 0 || e > 5)) {
    return goog.i18n.pluralRules.Keyword.MANY;
  }
  return goog.i18n.pluralRules.Keyword.OTHER;
};
goog.i18n.pluralRules.hySelect_ = function(n, precision) {
  const i = n | 0;
  if (i == 0 || i == 1) {
    return goog.i18n.pluralRules.Keyword.ONE;
  }
  return goog.i18n.pluralRules.Keyword.OTHER;
};
goog.i18n.pluralRules.ptSelect_ = function(n, precision) {
  const i = n | 0;
  const e = goog.i18n.pluralRules.get_e_(n);
  const vf = goog.i18n.pluralRules.get_vf_(n, precision);
  if (i >= 0 && i <= 1) {
    return goog.i18n.pluralRules.Keyword.ONE;
  }
  if (e == 0 && i != 0 && i % 1000000 == 0 && vf.v == 0 || (e < 0 || e > 5)) {
    return goog.i18n.pluralRules.Keyword.MANY;
  }
  return goog.i18n.pluralRules.Keyword.OTHER;
};
goog.i18n.pluralRules.isSelect_ = function(n, precision) {
  const i = n | 0;
  const vf = goog.i18n.pluralRules.get_vf_(n, precision);
  const wt = goog.i18n.pluralRules.get_wt_(vf.v, vf.f);
  if (wt.t == 0 && i % 10 == 1 && i % 100 != 11 || wt.t % 10 == 1 && wt.t % 100 != 11) {
    return goog.i18n.pluralRules.Keyword.ONE;
  }
  return goog.i18n.pluralRules.Keyword.OTHER;
};
goog.i18n.pluralRules.csSelect_ = function(n, precision) {
  const i = n | 0;
  const vf = goog.i18n.pluralRules.get_vf_(n, precision);
  if (i == 1 && vf.v == 0) {
    return goog.i18n.pluralRules.Keyword.ONE;
  }
  if (i >= 2 && i <= 4 && vf.v == 0) {
    return goog.i18n.pluralRules.Keyword.FEW;
  }
  if (vf.v != 0) {
    return goog.i18n.pluralRules.Keyword.MANY;
  }
  return goog.i18n.pluralRules.Keyword.OTHER;
};
goog.i18n.pluralRules.plSelect_ = function(n, precision) {
  const i = n | 0;
  const vf = goog.i18n.pluralRules.get_vf_(n, precision);
  if (i == 1 && vf.v == 0) {
    return goog.i18n.pluralRules.Keyword.ONE;
  }
  if (vf.v == 0 && i % 10 >= 2 && i % 10 <= 4 && (i % 100 < 12 || i % 100 > 14)) {
    return goog.i18n.pluralRules.Keyword.FEW;
  }
  if (vf.v == 0 && i != 1 && i % 10 >= 0 && i % 10 <= 1 || vf.v == 0 && i % 10 >= 5 && i % 10 <= 9 || vf.v == 0 && i % 100 >= 12 && i % 100 <= 14) {
    return goog.i18n.pluralRules.Keyword.MANY;
  }
  return goog.i18n.pluralRules.Keyword.OTHER;
};
goog.i18n.pluralRules.caSelect_ = function(n, precision) {
  const i = n | 0;
  const e = goog.i18n.pluralRules.get_e_(n);
  const vf = goog.i18n.pluralRules.get_vf_(n, precision);
  if (i == 1 && vf.v == 0) {
    return goog.i18n.pluralRules.Keyword.ONE;
  }
  if (e == 0 && i != 0 && i % 1000000 == 0 && vf.v == 0 || (e < 0 || e > 5)) {
    return goog.i18n.pluralRules.Keyword.MANY;
  }
  return goog.i18n.pluralRules.Keyword.OTHER;
};
goog.i18n.pluralRules.lvSelect_ = function(n, precision) {
  const vf = goog.i18n.pluralRules.get_vf_(n, precision);
  if (n % 10 == 0 || n % 100 >= 11 && n % 100 <= 19 || vf.v == 2 && vf.f % 100 >= 11 && vf.f % 100 <= 19) {
    return goog.i18n.pluralRules.Keyword.ZERO;
  }
  if (n % 10 == 1 && n % 100 != 11 || vf.v == 2 && vf.f % 10 == 1 && vf.f % 100 != 11 || vf.v != 2 && vf.f % 10 == 1) {
    return goog.i18n.pluralRules.Keyword.ONE;
  }
  return goog.i18n.pluralRules.Keyword.OTHER;
};
goog.i18n.pluralRules.siSelect_ = function(n, precision) {
  const i = n | 0;
  const vf = goog.i18n.pluralRules.get_vf_(n, precision);
  if (n == 0 || n == 1 || i == 0 && vf.f == 1) {
    return goog.i18n.pluralRules.Keyword.ONE;
  }
  return goog.i18n.pluralRules.Keyword.OTHER;
};
goog.i18n.pluralRules.cySelect_ = function(n, precision) {
  if (n == 0) {
    return goog.i18n.pluralRules.Keyword.ZERO;
  }
  if (n == 1) {
    return goog.i18n.pluralRules.Keyword.ONE;
  }
  if (n == 2) {
    return goog.i18n.pluralRules.Keyword.TWO;
  }
  if (n == 3) {
    return goog.i18n.pluralRules.Keyword.FEW;
  }
  if (n == 6) {
    return goog.i18n.pluralRules.Keyword.MANY;
  }
  return goog.i18n.pluralRules.Keyword.OTHER;
};
goog.i18n.pluralRules.daSelect_ = function(n, precision) {
  const i = n | 0;
  const vf = goog.i18n.pluralRules.get_vf_(n, precision);
  const wt = goog.i18n.pluralRules.get_wt_(vf.v, vf.f);
  if (n == 1 || wt.t != 0 && (i == 0 || i == 1)) {
    return goog.i18n.pluralRules.Keyword.ONE;
  }
  return goog.i18n.pluralRules.Keyword.OTHER;
};
goog.i18n.pluralRules.ruSelect_ = function(n, precision) {
  const i = n | 0;
  const vf = goog.i18n.pluralRules.get_vf_(n, precision);
  if (vf.v == 0 && i % 10 == 1 && i % 100 != 11) {
    return goog.i18n.pluralRules.Keyword.ONE;
  }
  if (vf.v == 0 && i % 10 >= 2 && i % 10 <= 4 && (i % 100 < 12 || i % 100 > 14)) {
    return goog.i18n.pluralRules.Keyword.FEW;
  }
  if (vf.v == 0 && i % 10 == 0 || vf.v == 0 && i % 10 >= 5 && i % 10 <= 9 || vf.v == 0 && i % 100 >= 11 && i % 100 <= 14) {
    return goog.i18n.pluralRules.Keyword.MANY;
  }
  return goog.i18n.pluralRules.Keyword.OTHER;
};
goog.i18n.pluralRules.beSelect_ = function(n, precision) {
  if (n % 10 == 1 && n % 100 != 11) {
    return goog.i18n.pluralRules.Keyword.ONE;
  }
  if (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14)) {
    return goog.i18n.pluralRules.Keyword.FEW;
  }
  if (n % 10 == 0 || n % 10 >= 5 && n % 10 <= 9 || n % 100 >= 11 && n % 100 <= 14) {
    return goog.i18n.pluralRules.Keyword.MANY;
  }
  return goog.i18n.pluralRules.Keyword.OTHER;
};
goog.i18n.pluralRules.frSelect_ = function(n, precision) {
  const i = n | 0;
  const e = goog.i18n.pluralRules.get_e_(n);
  const vf = goog.i18n.pluralRules.get_vf_(n, precision);
  if (i == 0 || i == 1) {
    return goog.i18n.pluralRules.Keyword.ONE;
  }
  if (e == 0 && i != 0 && i % 1000000 == 0 && vf.v == 0 || (e < 0 || e > 5)) {
    return goog.i18n.pluralRules.Keyword.MANY;
  }
  return goog.i18n.pluralRules.Keyword.OTHER;
};
goog.i18n.pluralRules.gaSelect_ = function(n, precision) {
  if (n == 1) {
    return goog.i18n.pluralRules.Keyword.ONE;
  }
  if (n == 2) {
    return goog.i18n.pluralRules.Keyword.TWO;
  }
  if (n >= 3 && n <= 6) {
    return goog.i18n.pluralRules.Keyword.FEW;
  }
  if (n >= 7 && n <= 10) {
    return goog.i18n.pluralRules.Keyword.MANY;
  }
  return goog.i18n.pluralRules.Keyword.OTHER;
};
goog.i18n.pluralRules.afSelect_ = function(n, precision) {
  if (n == 1) {
    return goog.i18n.pluralRules.Keyword.ONE;
  }
  return goog.i18n.pluralRules.Keyword.OTHER;
};
goog.i18n.pluralRules.mkSelect_ = function(n, precision) {
  const i = n | 0;
  const vf = goog.i18n.pluralRules.get_vf_(n, precision);
  if (vf.v == 0 && i % 10 == 1 && i % 100 != 11 || vf.f % 10 == 1 && vf.f % 100 != 11) {
    return goog.i18n.pluralRules.Keyword.ONE;
  }
  return goog.i18n.pluralRules.Keyword.OTHER;
};
goog.i18n.pluralRules.arSelect_ = function(n, precision) {
  if (n == 0) {
    return goog.i18n.pluralRules.Keyword.ZERO;
  }
  if (n == 1) {
    return goog.i18n.pluralRules.Keyword.ONE;
  }
  if (n == 2) {
    return goog.i18n.pluralRules.Keyword.TWO;
  }
  if (n % 100 >= 3 && n % 100 <= 10) {
    return goog.i18n.pluralRules.Keyword.FEW;
  }
  if (n % 100 >= 11 && n % 100 <= 99) {
    return goog.i18n.pluralRules.Keyword.MANY;
  }
  return goog.i18n.pluralRules.Keyword.OTHER;
};
goog.i18n.pluralRules.slSelect_ = function(n, precision) {
  const i = n | 0;
  const vf = goog.i18n.pluralRules.get_vf_(n, precision);
  if (vf.v == 0 && i % 100 == 1) {
    return goog.i18n.pluralRules.Keyword.ONE;
  }
  if (vf.v == 0 && i % 100 == 2) {
    return goog.i18n.pluralRules.Keyword.TWO;
  }
  if (vf.v == 0 && i % 100 >= 3 && i % 100 <= 4 || vf.v != 0) {
    return goog.i18n.pluralRules.Keyword.FEW;
  }
  return goog.i18n.pluralRules.Keyword.OTHER;
};
goog.i18n.pluralRules.ltSelect_ = function(n, precision) {
  const vf = goog.i18n.pluralRules.get_vf_(n, precision);
  if (n % 10 == 1 && (n % 100 < 11 || n % 100 > 19)) {
    return goog.i18n.pluralRules.Keyword.ONE;
  }
  if (n % 10 >= 2 && n % 10 <= 9 && (n % 100 < 11 || n % 100 > 19)) {
    return goog.i18n.pluralRules.Keyword.FEW;
  }
  if (vf.f != 0) {
    return goog.i18n.pluralRules.Keyword.MANY;
  }
  return goog.i18n.pluralRules.Keyword.OTHER;
};
goog.i18n.pluralRules.mtSelect_ = function(n, precision) {
  if (n == 1) {
    return goog.i18n.pluralRules.Keyword.ONE;
  }
  if (n == 2) {
    return goog.i18n.pluralRules.Keyword.TWO;
  }
  if (n == 0 || n % 100 >= 3 && n % 100 <= 10) {
    return goog.i18n.pluralRules.Keyword.FEW;
  }
  if (n % 100 >= 11 && n % 100 <= 19) {
    return goog.i18n.pluralRules.Keyword.MANY;
  }
  return goog.i18n.pluralRules.Keyword.OTHER;
};
goog.i18n.pluralRules.enSelect_ = function(n, precision) {
  const i = n | 0;
  const vf = goog.i18n.pluralRules.get_vf_(n, precision);
  if (i == 1 && vf.v == 0) {
    return goog.i18n.pluralRules.Keyword.ONE;
  }
  return goog.i18n.pluralRules.Keyword.OTHER;
};
goog.i18n.pluralRules.lnSelect_ = function(n, precision) {
  if (n >= 0 && n <= 1) {
    return goog.i18n.pluralRules.Keyword.ONE;
  }
  return goog.i18n.pluralRules.Keyword.OTHER;
};
goog.i18n.pluralRules.mapToNativeSelect_ = function() {
  const pluralLookup = {"zero":goog.i18n.pluralRules.Keyword.ZERO, "one":goog.i18n.pluralRules.Keyword.ONE, "two":goog.i18n.pluralRules.Keyword.TWO, "few":goog.i18n.pluralRules.Keyword.FEW, "many":goog.i18n.pluralRules.Keyword.MANY, "other":goog.i18n.pluralRules.Keyword.OTHER};
  let pluralRulesObj = null;
  let pluralPrecisionCache = null;
  const selectFn = function(itemCount, precision) {
    const key = precision === undefined ? -1 : precision;
    if (pluralPrecisionCache === null) {
      pluralPrecisionCache = new Map();
    }
    pluralRulesObj = pluralPrecisionCache.get(key);
    if (!pluralRulesObj) {
      let locale = "";
      if (goog.LOCALE) {
        locale = goog.LOCALE.replace("_", "-");
      }
      if (key === -1) {
        pluralRulesObj = new Intl.PluralRules(locale);
      } else {
        pluralRulesObj = new Intl.PluralRules(locale, {minimumFractionDigits:precision});
      }
      pluralPrecisionCache.set(key, pluralRulesObj);
    }
    const resultString = pluralRulesObj.select(itemCount);
    return pluralLookup[resultString];
  };
  return selectFn;
};
goog.i18n.pluralRules.select = goog.i18n.pluralRules.enSelect_;
if (goog.i18n.LocaleFeature.USE_ECMASCRIPT_I18N_PLURALRULES) {
  goog.i18n.pluralRules.select = goog.i18n.pluralRules.mapToNativeSelect_();
} else {
  if (goog.LOCALE === "af") {
    goog.i18n.pluralRules.select = goog.i18n.pluralRules.afSelect_;
  }
  if (goog.LOCALE === "am") {
    goog.i18n.pluralRules.select = goog.i18n.pluralRules.hiSelect_;
  }
  if (goog.LOCALE === "ar") {
    goog.i18n.pluralRules.select = goog.i18n.pluralRules.arSelect_;
  }
  if (goog.LOCALE === "ar_DZ" || goog.LOCALE === "ar-DZ") {
    goog.i18n.pluralRules.select = goog.i18n.pluralRules.arSelect_;
  }
  if (goog.LOCALE === "ar_EG" || goog.LOCALE === "ar-EG") {
    goog.i18n.pluralRules.select = goog.i18n.pluralRules.arSelect_;
  }
  if (goog.LOCALE === "az") {
    goog.i18n.pluralRules.select = goog.i18n.pluralRules.afSelect_;
  }
  if (goog.LOCALE === "be") {
    goog.i18n.pluralRules.select = goog.i18n.pluralRules.beSelect_;
  }
  if (goog.LOCALE === "bg") {
    goog.i18n.pluralRules.select = goog.i18n.pluralRules.afSelect_;
  }
  if (goog.LOCALE === "bn") {
    goog.i18n.pluralRules.select = goog.i18n.pluralRules.hiSelect_;
  }
  if (goog.LOCALE === "br") {
    goog.i18n.pluralRules.select = goog.i18n.pluralRules.brSelect_;
  }
  if (goog.LOCALE === "bs") {
    goog.i18n.pluralRules.select = goog.i18n.pluralRules.srSelect_;
  }
  if (goog.LOCALE === "ca") {
    goog.i18n.pluralRules.select = goog.i18n.pluralRules.caSelect_;
  }
  if (goog.LOCALE === "chr") {
    goog.i18n.pluralRules.select = goog.i18n.pluralRules.afSelect_;
  }
  if (goog.LOCALE === "cs") {
    goog.i18n.pluralRules.select = goog.i18n.pluralRules.csSelect_;
  }
  if (goog.LOCALE === "cy") {
    goog.i18n.pluralRules.select = goog.i18n.pluralRules.cySelect_;
  }
  if (goog.LOCALE === "da") {
    goog.i18n.pluralRules.select = goog.i18n.pluralRules.daSelect_;
  }
  if (goog.LOCALE === "de") {
    goog.i18n.pluralRules.select = goog.i18n.pluralRules.enSelect_;
  }
  if (goog.LOCALE === "de_AT" || goog.LOCALE === "de-AT") {
    goog.i18n.pluralRules.select = goog.i18n.pluralRules.enSelect_;
  }
  if (goog.LOCALE === "de_CH" || goog.LOCALE === "de-CH") {
    goog.i18n.pluralRules.select = goog.i18n.pluralRules.enSelect_;
  }
  if (goog.LOCALE === "el") {
    goog.i18n.pluralRules.select = goog.i18n.pluralRules.afSelect_;
  }
  if (goog.LOCALE === "en") {
    goog.i18n.pluralRules.select = goog.i18n.pluralRules.enSelect_;
  }
  if (goog.LOCALE === "en_AU" || goog.LOCALE === "en-AU") {
    goog.i18n.pluralRules.select = goog.i18n.pluralRules.enSelect_;
  }
  if (goog.LOCALE === "en_CA" || goog.LOCALE === "en-CA") {
    goog.i18n.pluralRules.select = goog.i18n.pluralRules.enSelect_;
  }
  if (goog.LOCALE === "en_GB" || goog.LOCALE === "en-GB") {
    goog.i18n.pluralRules.select = goog.i18n.pluralRules.enSelect_;
  }
  if (goog.LOCALE === "en_IE" || goog.LOCALE === "en-IE") {
    goog.i18n.pluralRules.select = goog.i18n.pluralRules.enSelect_;
  }
  if (goog.LOCALE === "en_IN" || goog.LOCALE === "en-IN") {
    goog.i18n.pluralRules.select = goog.i18n.pluralRules.enSelect_;
  }
  if (goog.LOCALE === "en_SG" || goog.LOCALE === "en-SG") {
    goog.i18n.pluralRules.select = goog.i18n.pluralRules.enSelect_;
  }
  if (goog.LOCALE === "en_US" || goog.LOCALE === "en-US") {
    goog.i18n.pluralRules.select = goog.i18n.pluralRules.enSelect_;
  }
  if (goog.LOCALE === "en_ZA" || goog.LOCALE === "en-ZA") {
    goog.i18n.pluralRules.select = goog.i18n.pluralRules.enSelect_;
  }
  if (goog.LOCALE === "es") {
    goog.i18n.pluralRules.select = goog.i18n.pluralRules.esSelect_;
  }
  if (goog.LOCALE === "es_419" || goog.LOCALE === "es-419") {
    goog.i18n.pluralRules.select = goog.i18n.pluralRules.esSelect_;
  }
  if (goog.LOCALE === "es_ES" || goog.LOCALE === "es-ES") {
    goog.i18n.pluralRules.select = goog.i18n.pluralRules.esSelect_;
  }
  if (goog.LOCALE === "es_MX" || goog.LOCALE === "es-MX") {
    goog.i18n.pluralRules.select = goog.i18n.pluralRules.esSelect_;
  }
  if (goog.LOCALE === "es_US" || goog.LOCALE === "es-US") {
    goog.i18n.pluralRules.select = goog.i18n.pluralRules.esSelect_;
  }
  if (goog.LOCALE === "et") {
    goog.i18n.pluralRules.select = goog.i18n.pluralRules.enSelect_;
  }
  if (goog.LOCALE === "eu") {
    goog.i18n.pluralRules.select = goog.i18n.pluralRules.afSelect_;
  }
  if (goog.LOCALE === "fa") {
    goog.i18n.pluralRules.select = goog.i18n.pluralRules.hiSelect_;
  }
  if (goog.LOCALE === "fi") {
    goog.i18n.pluralRules.select = goog.i18n.pluralRules.enSelect_;
  }
  if (goog.LOCALE === "fil") {
    goog.i18n.pluralRules.select = goog.i18n.pluralRules.filSelect_;
  }
  if (goog.LOCALE === "fr") {
    goog.i18n.pluralRules.select = goog.i18n.pluralRules.frSelect_;
  }
  if (goog.LOCALE === "fr_CA" || goog.LOCALE === "fr-CA") {
    goog.i18n.pluralRules.select = goog.i18n.pluralRules.frSelect_;
  }
  if (goog.LOCALE === "ga") {
    goog.i18n.pluralRules.select = goog.i18n.pluralRules.gaSelect_;
  }
  if (goog.LOCALE === "gl") {
    goog.i18n.pluralRules.select = goog.i18n.pluralRules.enSelect_;
  }
  if (goog.LOCALE === "gsw") {
    goog.i18n.pluralRules.select = goog.i18n.pluralRules.afSelect_;
  }
  if (goog.LOCALE === "gu") {
    goog.i18n.pluralRules.select = goog.i18n.pluralRules.hiSelect_;
  }
  if (goog.LOCALE === "haw") {
    goog.i18n.pluralRules.select = goog.i18n.pluralRules.afSelect_;
  }
  if (goog.LOCALE === "he") {
    goog.i18n.pluralRules.select = goog.i18n.pluralRules.heSelect_;
  }
  if (goog.LOCALE === "hi") {
    goog.i18n.pluralRules.select = goog.i18n.pluralRules.hiSelect_;
  }
  if (goog.LOCALE === "hr") {
    goog.i18n.pluralRules.select = goog.i18n.pluralRules.srSelect_;
  }
  if (goog.LOCALE === "hu") {
    goog.i18n.pluralRules.select = goog.i18n.pluralRules.afSelect_;
  }
  if (goog.LOCALE === "hy") {
    goog.i18n.pluralRules.select = goog.i18n.pluralRules.hySelect_;
  }
  if (goog.LOCALE === "id") {
    goog.i18n.pluralRules.select = goog.i18n.pluralRules.defaultSelect_;
  }
  if (goog.LOCALE === "in") {
    goog.i18n.pluralRules.select = goog.i18n.pluralRules.defaultSelect_;
  }
  if (goog.LOCALE === "is") {
    goog.i18n.pluralRules.select = goog.i18n.pluralRules.isSelect_;
  }
  if (goog.LOCALE === "it") {
    goog.i18n.pluralRules.select = goog.i18n.pluralRules.caSelect_;
  }
  if (goog.LOCALE === "iw") {
    goog.i18n.pluralRules.select = goog.i18n.pluralRules.heSelect_;
  }
  if (goog.LOCALE === "ja") {
    goog.i18n.pluralRules.select = goog.i18n.pluralRules.defaultSelect_;
  }
  if (goog.LOCALE === "ka") {
    goog.i18n.pluralRules.select = goog.i18n.pluralRules.afSelect_;
  }
  if (goog.LOCALE === "kk") {
    goog.i18n.pluralRules.select = goog.i18n.pluralRules.afSelect_;
  }
  if (goog.LOCALE === "km") {
    goog.i18n.pluralRules.select = goog.i18n.pluralRules.defaultSelect_;
  }
  if (goog.LOCALE === "kn") {
    goog.i18n.pluralRules.select = goog.i18n.pluralRules.hiSelect_;
  }
  if (goog.LOCALE === "ko") {
    goog.i18n.pluralRules.select = goog.i18n.pluralRules.defaultSelect_;
  }
  if (goog.LOCALE === "ky") {
    goog.i18n.pluralRules.select = goog.i18n.pluralRules.afSelect_;
  }
  if (goog.LOCALE === "ln") {
    goog.i18n.pluralRules.select = goog.i18n.pluralRules.lnSelect_;
  }
  if (goog.LOCALE === "lo") {
    goog.i18n.pluralRules.select = goog.i18n.pluralRules.defaultSelect_;
  }
  if (goog.LOCALE === "lt") {
    goog.i18n.pluralRules.select = goog.i18n.pluralRules.ltSelect_;
  }
  if (goog.LOCALE === "lv") {
    goog.i18n.pluralRules.select = goog.i18n.pluralRules.lvSelect_;
  }
  if (goog.LOCALE === "mk") {
    goog.i18n.pluralRules.select = goog.i18n.pluralRules.mkSelect_;
  }
  if (goog.LOCALE === "ml") {
    goog.i18n.pluralRules.select = goog.i18n.pluralRules.afSelect_;
  }
  if (goog.LOCALE === "mn") {
    goog.i18n.pluralRules.select = goog.i18n.pluralRules.afSelect_;
  }
  if (goog.LOCALE === "mo") {
    goog.i18n.pluralRules.select = goog.i18n.pluralRules.roSelect_;
  }
  if (goog.LOCALE === "mr") {
    goog.i18n.pluralRules.select = goog.i18n.pluralRules.afSelect_;
  }
  if (goog.LOCALE === "ms") {
    goog.i18n.pluralRules.select = goog.i18n.pluralRules.defaultSelect_;
  }
  if (goog.LOCALE === "mt") {
    goog.i18n.pluralRules.select = goog.i18n.pluralRules.mtSelect_;
  }
  if (goog.LOCALE === "my") {
    goog.i18n.pluralRules.select = goog.i18n.pluralRules.defaultSelect_;
  }
  if (goog.LOCALE === "nb") {
    goog.i18n.pluralRules.select = goog.i18n.pluralRules.afSelect_;
  }
  if (goog.LOCALE === "ne") {
    goog.i18n.pluralRules.select = goog.i18n.pluralRules.afSelect_;
  }
  if (goog.LOCALE === "nl") {
    goog.i18n.pluralRules.select = goog.i18n.pluralRules.enSelect_;
  }
  if (goog.LOCALE === "no") {
    goog.i18n.pluralRules.select = goog.i18n.pluralRules.afSelect_;
  }
  if (goog.LOCALE === "no_NO" || goog.LOCALE === "no-NO") {
    goog.i18n.pluralRules.select = goog.i18n.pluralRules.afSelect_;
  }
  if (goog.LOCALE === "or") {
    goog.i18n.pluralRules.select = goog.i18n.pluralRules.afSelect_;
  }
  if (goog.LOCALE === "pa") {
    goog.i18n.pluralRules.select = goog.i18n.pluralRules.lnSelect_;
  }
  if (goog.LOCALE === "pl") {
    goog.i18n.pluralRules.select = goog.i18n.pluralRules.plSelect_;
  }
  if (goog.LOCALE === "pt") {
    goog.i18n.pluralRules.select = goog.i18n.pluralRules.ptSelect_;
  }
  if (goog.LOCALE === "pt_BR" || goog.LOCALE === "pt-BR") {
    goog.i18n.pluralRules.select = goog.i18n.pluralRules.ptSelect_;
  }
  if (goog.LOCALE === "pt_PT" || goog.LOCALE === "pt-PT") {
    goog.i18n.pluralRules.select = goog.i18n.pluralRules.caSelect_;
  }
  if (goog.LOCALE === "ro") {
    goog.i18n.pluralRules.select = goog.i18n.pluralRules.roSelect_;
  }
  if (goog.LOCALE === "ru") {
    goog.i18n.pluralRules.select = goog.i18n.pluralRules.ruSelect_;
  }
  if (goog.LOCALE === "sh") {
    goog.i18n.pluralRules.select = goog.i18n.pluralRules.srSelect_;
  }
  if (goog.LOCALE === "si") {
    goog.i18n.pluralRules.select = goog.i18n.pluralRules.siSelect_;
  }
  if (goog.LOCALE === "sk") {
    goog.i18n.pluralRules.select = goog.i18n.pluralRules.csSelect_;
  }
  if (goog.LOCALE === "sl") {
    goog.i18n.pluralRules.select = goog.i18n.pluralRules.slSelect_;
  }
  if (goog.LOCALE === "sq") {
    goog.i18n.pluralRules.select = goog.i18n.pluralRules.afSelect_;
  }
  if (goog.LOCALE === "sr") {
    goog.i18n.pluralRules.select = goog.i18n.pluralRules.srSelect_;
  }
  if (goog.LOCALE === "sr_Latn" || goog.LOCALE === "sr-Latn") {
    goog.i18n.pluralRules.select = goog.i18n.pluralRules.srSelect_;
  }
  if (goog.LOCALE === "sv") {
    goog.i18n.pluralRules.select = goog.i18n.pluralRules.enSelect_;
  }
  if (goog.LOCALE === "sw") {
    goog.i18n.pluralRules.select = goog.i18n.pluralRules.enSelect_;
  }
  if (goog.LOCALE === "ta") {
    goog.i18n.pluralRules.select = goog.i18n.pluralRules.afSelect_;
  }
  if (goog.LOCALE === "te") {
    goog.i18n.pluralRules.select = goog.i18n.pluralRules.afSelect_;
  }
  if (goog.LOCALE === "th") {
    goog.i18n.pluralRules.select = goog.i18n.pluralRules.defaultSelect_;
  }
  if (goog.LOCALE === "tl") {
    goog.i18n.pluralRules.select = goog.i18n.pluralRules.filSelect_;
  }
  if (goog.LOCALE === "tr") {
    goog.i18n.pluralRules.select = goog.i18n.pluralRules.afSelect_;
  }
  if (goog.LOCALE === "uk") {
    goog.i18n.pluralRules.select = goog.i18n.pluralRules.ruSelect_;
  }
  if (goog.LOCALE === "ur") {
    goog.i18n.pluralRules.select = goog.i18n.pluralRules.enSelect_;
  }
  if (goog.LOCALE === "uz") {
    goog.i18n.pluralRules.select = goog.i18n.pluralRules.afSelect_;
  }
  if (goog.LOCALE === "vi") {
    goog.i18n.pluralRules.select = goog.i18n.pluralRules.defaultSelect_;
  }
  if (goog.LOCALE === "zh") {
    goog.i18n.pluralRules.select = goog.i18n.pluralRules.defaultSelect_;
  }
  if (goog.LOCALE === "zh_CN" || goog.LOCALE === "zh-CN") {
    goog.i18n.pluralRules.select = goog.i18n.pluralRules.defaultSelect_;
  }
  if (goog.LOCALE === "zh_HK" || goog.LOCALE === "zh-HK") {
    goog.i18n.pluralRules.select = goog.i18n.pluralRules.defaultSelect_;
  }
  if (goog.LOCALE === "zh_TW" || goog.LOCALE === "zh-TW") {
    goog.i18n.pluralRules.select = goog.i18n.pluralRules.defaultSelect_;
  }
  if (goog.LOCALE === "zu") {
    goog.i18n.pluralRules.select = goog.i18n.pluralRules.hiSelect_;
  }
}

//# sourceMappingURL=goog.i18n.pluralrules.js.map
