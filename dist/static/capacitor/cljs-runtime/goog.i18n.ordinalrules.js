goog.provide("goog.i18n.ordinalRules");
goog.require("goog.i18n.LocaleFeature");
goog.i18n.ordinalRules.Keyword = {ZERO:"zero", ONE:"one", TWO:"two", FEW:"few", MANY:"many", OTHER:"other"};
goog.i18n.ordinalRules.select;
goog.i18n.ordinalRules.defaultSelect_ = function(n, precision) {
  return goog.i18n.ordinalRules.Keyword.OTHER;
};
goog.i18n.ordinalRules.cySelect_ = function(n, precision) {
  if (n == 0 || n == 7 || n == 8 || n == 9) {
    return goog.i18n.ordinalRules.Keyword.ZERO;
  }
  if (n == 1) {
    return goog.i18n.ordinalRules.Keyword.ONE;
  }
  if (n == 2) {
    return goog.i18n.ordinalRules.Keyword.TWO;
  }
  if (n == 3 || n == 4) {
    return goog.i18n.ordinalRules.Keyword.FEW;
  }
  if (n == 5 || n == 6) {
    return goog.i18n.ordinalRules.Keyword.MANY;
  }
  return goog.i18n.ordinalRules.Keyword.OTHER;
};
goog.i18n.ordinalRules.enSelect_ = function(n, precision) {
  if (n % 10 == 1 && n % 100 != 11) {
    return goog.i18n.ordinalRules.Keyword.ONE;
  }
  if (n % 10 == 2 && n % 100 != 12) {
    return goog.i18n.ordinalRules.Keyword.TWO;
  }
  if (n % 10 == 3 && n % 100 != 13) {
    return goog.i18n.ordinalRules.Keyword.FEW;
  }
  return goog.i18n.ordinalRules.Keyword.OTHER;
};
goog.i18n.ordinalRules.ukSelect_ = function(n, precision) {
  if (n % 10 == 3 && n % 100 != 13) {
    return goog.i18n.ordinalRules.Keyword.FEW;
  }
  return goog.i18n.ordinalRules.Keyword.OTHER;
};
goog.i18n.ordinalRules.itSelect_ = function(n, precision) {
  if (n == 11 || n == 8 || n == 80 || n == 800) {
    return goog.i18n.ordinalRules.Keyword.MANY;
  }
  return goog.i18n.ordinalRules.Keyword.OTHER;
};
goog.i18n.ordinalRules.neSelect_ = function(n, precision) {
  if (n >= 1 && n <= 4) {
    return goog.i18n.ordinalRules.Keyword.ONE;
  }
  return goog.i18n.ordinalRules.Keyword.OTHER;
};
goog.i18n.ordinalRules.orSelect_ = function(n, precision) {
  if (n == 1 || n == 5 || n >= 7 && n <= 9) {
    return goog.i18n.ordinalRules.Keyword.ONE;
  }
  if (n == 2 || n == 3) {
    return goog.i18n.ordinalRules.Keyword.TWO;
  }
  if (n == 4) {
    return goog.i18n.ordinalRules.Keyword.FEW;
  }
  if (n == 6) {
    return goog.i18n.ordinalRules.Keyword.MANY;
  }
  return goog.i18n.ordinalRules.Keyword.OTHER;
};
goog.i18n.ordinalRules.beSelect_ = function(n, precision) {
  if ((n % 10 == 2 || n % 10 == 3) && n % 100 != 12 && n % 100 != 13) {
    return goog.i18n.ordinalRules.Keyword.FEW;
  }
  return goog.i18n.ordinalRules.Keyword.OTHER;
};
goog.i18n.ordinalRules.azSelect_ = function(n, precision) {
  const i = n | 0;
  if (i % 10 == 1 || i % 10 == 2 || i % 10 == 5 || i % 10 == 7 || i % 10 == 8 || (i % 100 == 20 || i % 100 == 50 || i % 100 == 70 || i % 100 == 80)) {
    return goog.i18n.ordinalRules.Keyword.ONE;
  }
  if (i % 10 == 3 || i % 10 == 4 || (i % 1000 == 100 || i % 1000 == 200 || i % 1000 == 300 || i % 1000 == 400 || i % 1000 == 500 || i % 1000 == 600 || i % 1000 == 700 || i % 1000 == 800 || i % 1000 == 900)) {
    return goog.i18n.ordinalRules.Keyword.FEW;
  }
  if (i == 0 || i % 10 == 6 || (i % 100 == 40 || i % 100 == 60 || i % 100 == 90)) {
    return goog.i18n.ordinalRules.Keyword.MANY;
  }
  return goog.i18n.ordinalRules.Keyword.OTHER;
};
goog.i18n.ordinalRules.kaSelect_ = function(n, precision) {
  const i = n | 0;
  if (i == 1) {
    return goog.i18n.ordinalRules.Keyword.ONE;
  }
  if (i == 0 || (i % 100 >= 2 && i % 100 <= 20 || i % 100 == 40 || i % 100 == 60 || i % 100 == 80)) {
    return goog.i18n.ordinalRules.Keyword.MANY;
  }
  return goog.i18n.ordinalRules.Keyword.OTHER;
};
goog.i18n.ordinalRules.mrSelect_ = function(n, precision) {
  if (n == 1) {
    return goog.i18n.ordinalRules.Keyword.ONE;
  }
  if (n == 2 || n == 3) {
    return goog.i18n.ordinalRules.Keyword.TWO;
  }
  if (n == 4) {
    return goog.i18n.ordinalRules.Keyword.FEW;
  }
  return goog.i18n.ordinalRules.Keyword.OTHER;
};
goog.i18n.ordinalRules.svSelect_ = function(n, precision) {
  if ((n % 10 == 1 || n % 10 == 2) && n % 100 != 11 && n % 100 != 12) {
    return goog.i18n.ordinalRules.Keyword.ONE;
  }
  return goog.i18n.ordinalRules.Keyword.OTHER;
};
goog.i18n.ordinalRules.kkSelect_ = function(n, precision) {
  if (n % 10 == 6 || n % 10 == 9 || n % 10 == 0 && n != 0) {
    return goog.i18n.ordinalRules.Keyword.MANY;
  }
  return goog.i18n.ordinalRules.Keyword.OTHER;
};
goog.i18n.ordinalRules.mkSelect_ = function(n, precision) {
  const i = n | 0;
  if (i % 10 == 1 && i % 100 != 11) {
    return goog.i18n.ordinalRules.Keyword.ONE;
  }
  if (i % 10 == 2 && i % 100 != 12) {
    return goog.i18n.ordinalRules.Keyword.TWO;
  }
  if ((i % 10 == 7 || i % 10 == 8) && i % 100 != 17 && i % 100 != 18) {
    return goog.i18n.ordinalRules.Keyword.MANY;
  }
  return goog.i18n.ordinalRules.Keyword.OTHER;
};
goog.i18n.ordinalRules.huSelect_ = function(n, precision) {
  if (n == 1 || n == 5) {
    return goog.i18n.ordinalRules.Keyword.ONE;
  }
  return goog.i18n.ordinalRules.Keyword.OTHER;
};
goog.i18n.ordinalRules.frSelect_ = function(n, precision) {
  if (n == 1) {
    return goog.i18n.ordinalRules.Keyword.ONE;
  }
  return goog.i18n.ordinalRules.Keyword.OTHER;
};
goog.i18n.ordinalRules.sqSelect_ = function(n, precision) {
  if (n == 1) {
    return goog.i18n.ordinalRules.Keyword.ONE;
  }
  if (n % 10 == 4 && n % 100 != 14) {
    return goog.i18n.ordinalRules.Keyword.MANY;
  }
  return goog.i18n.ordinalRules.Keyword.OTHER;
};
goog.i18n.ordinalRules.caSelect_ = function(n, precision) {
  if (n == 1 || n == 3) {
    return goog.i18n.ordinalRules.Keyword.ONE;
  }
  if (n == 2) {
    return goog.i18n.ordinalRules.Keyword.TWO;
  }
  if (n == 4) {
    return goog.i18n.ordinalRules.Keyword.FEW;
  }
  return goog.i18n.ordinalRules.Keyword.OTHER;
};
goog.i18n.ordinalRules.guSelect_ = function(n, precision) {
  if (n == 1) {
    return goog.i18n.ordinalRules.Keyword.ONE;
  }
  if (n == 2 || n == 3) {
    return goog.i18n.ordinalRules.Keyword.TWO;
  }
  if (n == 4) {
    return goog.i18n.ordinalRules.Keyword.FEW;
  }
  if (n == 6) {
    return goog.i18n.ordinalRules.Keyword.MANY;
  }
  return goog.i18n.ordinalRules.Keyword.OTHER;
};
goog.i18n.ordinalRules.bnSelect_ = function(n, precision) {
  if (n == 1 || n == 5 || n == 7 || n == 8 || n == 9 || n == 10) {
    return goog.i18n.ordinalRules.Keyword.ONE;
  }
  if (n == 2 || n == 3) {
    return goog.i18n.ordinalRules.Keyword.TWO;
  }
  if (n == 4) {
    return goog.i18n.ordinalRules.Keyword.FEW;
  }
  if (n == 6) {
    return goog.i18n.ordinalRules.Keyword.MANY;
  }
  return goog.i18n.ordinalRules.Keyword.OTHER;
};
goog.i18n.ordinalRules.mapToNativeSelect_ = function() {
  const pluralLookup = {"zero":goog.i18n.ordinalRules.Keyword.ZERO, "one":goog.i18n.ordinalRules.Keyword.ONE, "two":goog.i18n.ordinalRules.Keyword.TWO, "few":goog.i18n.ordinalRules.Keyword.FEW, "many":goog.i18n.ordinalRules.Keyword.MANY, "other":goog.i18n.ordinalRules.Keyword.OTHER};
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
        pluralRulesObj = new Intl.PluralRules(locale, {type:"ordinal"});
      } else {
        pluralRulesObj = new Intl.PluralRules(locale, {type:"ordinal", minimumFractionDigits:precision});
      }
      pluralPrecisionCache.set(key, pluralRulesObj);
    }
    const resultString = pluralRulesObj.select(itemCount);
    return pluralLookup[resultString];
  };
  return selectFn;
};
goog.i18n.ordinalRules.select = goog.i18n.ordinalRules.enSelect_;
if (goog.i18n.LocaleFeature.USE_ECMASCRIPT_I18N_PLURALRULES) {
  goog.i18n.ordinalRules.select = goog.i18n.ordinalRules.mapToNativeSelect_();
} else {
  if (goog.LOCALE === "af") {
    goog.i18n.ordinalRules.select = goog.i18n.ordinalRules.defaultSelect_;
  }
  if (goog.LOCALE === "am") {
    goog.i18n.ordinalRules.select = goog.i18n.ordinalRules.defaultSelect_;
  }
  if (goog.LOCALE === "ar") {
    goog.i18n.ordinalRules.select = goog.i18n.ordinalRules.defaultSelect_;
  }
  if (goog.LOCALE === "ar_DZ" || goog.LOCALE === "ar-DZ") {
    goog.i18n.ordinalRules.select = goog.i18n.ordinalRules.defaultSelect_;
  }
  if (goog.LOCALE === "ar_EG" || goog.LOCALE === "ar-EG") {
    goog.i18n.ordinalRules.select = goog.i18n.ordinalRules.defaultSelect_;
  }
  if (goog.LOCALE === "az") {
    goog.i18n.ordinalRules.select = goog.i18n.ordinalRules.azSelect_;
  }
  if (goog.LOCALE === "be") {
    goog.i18n.ordinalRules.select = goog.i18n.ordinalRules.beSelect_;
  }
  if (goog.LOCALE === "bg") {
    goog.i18n.ordinalRules.select = goog.i18n.ordinalRules.defaultSelect_;
  }
  if (goog.LOCALE === "bn") {
    goog.i18n.ordinalRules.select = goog.i18n.ordinalRules.bnSelect_;
  }
  if (goog.LOCALE === "br") {
    goog.i18n.ordinalRules.select = goog.i18n.ordinalRules.defaultSelect_;
  }
  if (goog.LOCALE === "bs") {
    goog.i18n.ordinalRules.select = goog.i18n.ordinalRules.defaultSelect_;
  }
  if (goog.LOCALE === "ca") {
    goog.i18n.ordinalRules.select = goog.i18n.ordinalRules.caSelect_;
  }
  if (goog.LOCALE === "chr") {
    goog.i18n.ordinalRules.select = goog.i18n.ordinalRules.defaultSelect_;
  }
  if (goog.LOCALE === "cs") {
    goog.i18n.ordinalRules.select = goog.i18n.ordinalRules.defaultSelect_;
  }
  if (goog.LOCALE === "cy") {
    goog.i18n.ordinalRules.select = goog.i18n.ordinalRules.cySelect_;
  }
  if (goog.LOCALE === "da") {
    goog.i18n.ordinalRules.select = goog.i18n.ordinalRules.defaultSelect_;
  }
  if (goog.LOCALE === "de") {
    goog.i18n.ordinalRules.select = goog.i18n.ordinalRules.defaultSelect_;
  }
  if (goog.LOCALE === "de_AT" || goog.LOCALE === "de-AT") {
    goog.i18n.ordinalRules.select = goog.i18n.ordinalRules.defaultSelect_;
  }
  if (goog.LOCALE === "de_CH" || goog.LOCALE === "de-CH") {
    goog.i18n.ordinalRules.select = goog.i18n.ordinalRules.defaultSelect_;
  }
  if (goog.LOCALE === "el") {
    goog.i18n.ordinalRules.select = goog.i18n.ordinalRules.defaultSelect_;
  }
  if (goog.LOCALE === "en") {
    goog.i18n.ordinalRules.select = goog.i18n.ordinalRules.enSelect_;
  }
  if (goog.LOCALE === "en_AU" || goog.LOCALE === "en-AU") {
    goog.i18n.ordinalRules.select = goog.i18n.ordinalRules.enSelect_;
  }
  if (goog.LOCALE === "en_CA" || goog.LOCALE === "en-CA") {
    goog.i18n.ordinalRules.select = goog.i18n.ordinalRules.enSelect_;
  }
  if (goog.LOCALE === "en_GB" || goog.LOCALE === "en-GB") {
    goog.i18n.ordinalRules.select = goog.i18n.ordinalRules.enSelect_;
  }
  if (goog.LOCALE === "en_IE" || goog.LOCALE === "en-IE") {
    goog.i18n.ordinalRules.select = goog.i18n.ordinalRules.enSelect_;
  }
  if (goog.LOCALE === "en_IN" || goog.LOCALE === "en-IN") {
    goog.i18n.ordinalRules.select = goog.i18n.ordinalRules.enSelect_;
  }
  if (goog.LOCALE === "en_SG" || goog.LOCALE === "en-SG") {
    goog.i18n.ordinalRules.select = goog.i18n.ordinalRules.enSelect_;
  }
  if (goog.LOCALE === "en_US" || goog.LOCALE === "en-US") {
    goog.i18n.ordinalRules.select = goog.i18n.ordinalRules.enSelect_;
  }
  if (goog.LOCALE === "en_ZA" || goog.LOCALE === "en-ZA") {
    goog.i18n.ordinalRules.select = goog.i18n.ordinalRules.enSelect_;
  }
  if (goog.LOCALE === "es") {
    goog.i18n.ordinalRules.select = goog.i18n.ordinalRules.defaultSelect_;
  }
  if (goog.LOCALE === "es_419" || goog.LOCALE === "es-419") {
    goog.i18n.ordinalRules.select = goog.i18n.ordinalRules.defaultSelect_;
  }
  if (goog.LOCALE === "es_ES" || goog.LOCALE === "es-ES") {
    goog.i18n.ordinalRules.select = goog.i18n.ordinalRules.defaultSelect_;
  }
  if (goog.LOCALE === "es_MX" || goog.LOCALE === "es-MX") {
    goog.i18n.ordinalRules.select = goog.i18n.ordinalRules.defaultSelect_;
  }
  if (goog.LOCALE === "es_US" || goog.LOCALE === "es-US") {
    goog.i18n.ordinalRules.select = goog.i18n.ordinalRules.defaultSelect_;
  }
  if (goog.LOCALE === "et") {
    goog.i18n.ordinalRules.select = goog.i18n.ordinalRules.defaultSelect_;
  }
  if (goog.LOCALE === "eu") {
    goog.i18n.ordinalRules.select = goog.i18n.ordinalRules.defaultSelect_;
  }
  if (goog.LOCALE === "fa") {
    goog.i18n.ordinalRules.select = goog.i18n.ordinalRules.defaultSelect_;
  }
  if (goog.LOCALE === "fi") {
    goog.i18n.ordinalRules.select = goog.i18n.ordinalRules.defaultSelect_;
  }
  if (goog.LOCALE === "fil") {
    goog.i18n.ordinalRules.select = goog.i18n.ordinalRules.frSelect_;
  }
  if (goog.LOCALE === "fr") {
    goog.i18n.ordinalRules.select = goog.i18n.ordinalRules.frSelect_;
  }
  if (goog.LOCALE === "fr_CA" || goog.LOCALE === "fr-CA") {
    goog.i18n.ordinalRules.select = goog.i18n.ordinalRules.frSelect_;
  }
  if (goog.LOCALE === "ga") {
    goog.i18n.ordinalRules.select = goog.i18n.ordinalRules.frSelect_;
  }
  if (goog.LOCALE === "gl") {
    goog.i18n.ordinalRules.select = goog.i18n.ordinalRules.defaultSelect_;
  }
  if (goog.LOCALE === "gsw") {
    goog.i18n.ordinalRules.select = goog.i18n.ordinalRules.defaultSelect_;
  }
  if (goog.LOCALE === "gu") {
    goog.i18n.ordinalRules.select = goog.i18n.ordinalRules.guSelect_;
  }
  if (goog.LOCALE === "haw") {
    goog.i18n.ordinalRules.select = goog.i18n.ordinalRules.defaultSelect_;
  }
  if (goog.LOCALE === "he") {
    goog.i18n.ordinalRules.select = goog.i18n.ordinalRules.defaultSelect_;
  }
  if (goog.LOCALE === "hi") {
    goog.i18n.ordinalRules.select = goog.i18n.ordinalRules.guSelect_;
  }
  if (goog.LOCALE === "hr") {
    goog.i18n.ordinalRules.select = goog.i18n.ordinalRules.defaultSelect_;
  }
  if (goog.LOCALE === "hu") {
    goog.i18n.ordinalRules.select = goog.i18n.ordinalRules.huSelect_;
  }
  if (goog.LOCALE === "hy") {
    goog.i18n.ordinalRules.select = goog.i18n.ordinalRules.frSelect_;
  }
  if (goog.LOCALE === "id") {
    goog.i18n.ordinalRules.select = goog.i18n.ordinalRules.defaultSelect_;
  }
  if (goog.LOCALE === "in") {
    goog.i18n.ordinalRules.select = goog.i18n.ordinalRules.defaultSelect_;
  }
  if (goog.LOCALE === "is") {
    goog.i18n.ordinalRules.select = goog.i18n.ordinalRules.defaultSelect_;
  }
  if (goog.LOCALE === "it") {
    goog.i18n.ordinalRules.select = goog.i18n.ordinalRules.itSelect_;
  }
  if (goog.LOCALE === "iw") {
    goog.i18n.ordinalRules.select = goog.i18n.ordinalRules.defaultSelect_;
  }
  if (goog.LOCALE === "ja") {
    goog.i18n.ordinalRules.select = goog.i18n.ordinalRules.defaultSelect_;
  }
  if (goog.LOCALE === "ka") {
    goog.i18n.ordinalRules.select = goog.i18n.ordinalRules.kaSelect_;
  }
  if (goog.LOCALE === "kk") {
    goog.i18n.ordinalRules.select = goog.i18n.ordinalRules.kkSelect_;
  }
  if (goog.LOCALE === "km") {
    goog.i18n.ordinalRules.select = goog.i18n.ordinalRules.defaultSelect_;
  }
  if (goog.LOCALE === "kn") {
    goog.i18n.ordinalRules.select = goog.i18n.ordinalRules.defaultSelect_;
  }
  if (goog.LOCALE === "ko") {
    goog.i18n.ordinalRules.select = goog.i18n.ordinalRules.defaultSelect_;
  }
  if (goog.LOCALE === "ky") {
    goog.i18n.ordinalRules.select = goog.i18n.ordinalRules.defaultSelect_;
  }
  if (goog.LOCALE === "ln") {
    goog.i18n.ordinalRules.select = goog.i18n.ordinalRules.defaultSelect_;
  }
  if (goog.LOCALE === "lo") {
    goog.i18n.ordinalRules.select = goog.i18n.ordinalRules.frSelect_;
  }
  if (goog.LOCALE === "lt") {
    goog.i18n.ordinalRules.select = goog.i18n.ordinalRules.defaultSelect_;
  }
  if (goog.LOCALE === "lv") {
    goog.i18n.ordinalRules.select = goog.i18n.ordinalRules.defaultSelect_;
  }
  if (goog.LOCALE === "mk") {
    goog.i18n.ordinalRules.select = goog.i18n.ordinalRules.mkSelect_;
  }
  if (goog.LOCALE === "ml") {
    goog.i18n.ordinalRules.select = goog.i18n.ordinalRules.defaultSelect_;
  }
  if (goog.LOCALE === "mn") {
    goog.i18n.ordinalRules.select = goog.i18n.ordinalRules.defaultSelect_;
  }
  if (goog.LOCALE === "mo") {
    goog.i18n.ordinalRules.select = goog.i18n.ordinalRules.frSelect_;
  }
  if (goog.LOCALE === "mr") {
    goog.i18n.ordinalRules.select = goog.i18n.ordinalRules.mrSelect_;
  }
  if (goog.LOCALE === "ms") {
    goog.i18n.ordinalRules.select = goog.i18n.ordinalRules.frSelect_;
  }
  if (goog.LOCALE === "mt") {
    goog.i18n.ordinalRules.select = goog.i18n.ordinalRules.defaultSelect_;
  }
  if (goog.LOCALE === "my") {
    goog.i18n.ordinalRules.select = goog.i18n.ordinalRules.defaultSelect_;
  }
  if (goog.LOCALE === "nb") {
    goog.i18n.ordinalRules.select = goog.i18n.ordinalRules.defaultSelect_;
  }
  if (goog.LOCALE === "ne") {
    goog.i18n.ordinalRules.select = goog.i18n.ordinalRules.neSelect_;
  }
  if (goog.LOCALE === "nl") {
    goog.i18n.ordinalRules.select = goog.i18n.ordinalRules.defaultSelect_;
  }
  if (goog.LOCALE === "no") {
    goog.i18n.ordinalRules.select = goog.i18n.ordinalRules.defaultSelect_;
  }
  if (goog.LOCALE === "no_NO" || goog.LOCALE === "no-NO") {
    goog.i18n.ordinalRules.select = goog.i18n.ordinalRules.defaultSelect_;
  }
  if (goog.LOCALE === "or") {
    goog.i18n.ordinalRules.select = goog.i18n.ordinalRules.orSelect_;
  }
  if (goog.LOCALE === "pa") {
    goog.i18n.ordinalRules.select = goog.i18n.ordinalRules.defaultSelect_;
  }
  if (goog.LOCALE === "pl") {
    goog.i18n.ordinalRules.select = goog.i18n.ordinalRules.defaultSelect_;
  }
  if (goog.LOCALE === "pt") {
    goog.i18n.ordinalRules.select = goog.i18n.ordinalRules.defaultSelect_;
  }
  if (goog.LOCALE === "pt_BR" || goog.LOCALE === "pt-BR") {
    goog.i18n.ordinalRules.select = goog.i18n.ordinalRules.defaultSelect_;
  }
  if (goog.LOCALE === "pt_PT" || goog.LOCALE === "pt-PT") {
    goog.i18n.ordinalRules.select = goog.i18n.ordinalRules.defaultSelect_;
  }
  if (goog.LOCALE === "ro") {
    goog.i18n.ordinalRules.select = goog.i18n.ordinalRules.frSelect_;
  }
  if (goog.LOCALE === "ru") {
    goog.i18n.ordinalRules.select = goog.i18n.ordinalRules.defaultSelect_;
  }
  if (goog.LOCALE === "sh") {
    goog.i18n.ordinalRules.select = goog.i18n.ordinalRules.defaultSelect_;
  }
  if (goog.LOCALE === "si") {
    goog.i18n.ordinalRules.select = goog.i18n.ordinalRules.defaultSelect_;
  }
  if (goog.LOCALE === "sk") {
    goog.i18n.ordinalRules.select = goog.i18n.ordinalRules.defaultSelect_;
  }
  if (goog.LOCALE === "sl") {
    goog.i18n.ordinalRules.select = goog.i18n.ordinalRules.defaultSelect_;
  }
  if (goog.LOCALE === "sq") {
    goog.i18n.ordinalRules.select = goog.i18n.ordinalRules.sqSelect_;
  }
  if (goog.LOCALE === "sr") {
    goog.i18n.ordinalRules.select = goog.i18n.ordinalRules.defaultSelect_;
  }
  if (goog.LOCALE === "sr_Latn" || goog.LOCALE === "sr-Latn") {
    goog.i18n.ordinalRules.select = goog.i18n.ordinalRules.defaultSelect_;
  }
  if (goog.LOCALE === "sv") {
    goog.i18n.ordinalRules.select = goog.i18n.ordinalRules.svSelect_;
  }
  if (goog.LOCALE === "sw") {
    goog.i18n.ordinalRules.select = goog.i18n.ordinalRules.defaultSelect_;
  }
  if (goog.LOCALE === "ta") {
    goog.i18n.ordinalRules.select = goog.i18n.ordinalRules.defaultSelect_;
  }
  if (goog.LOCALE === "te") {
    goog.i18n.ordinalRules.select = goog.i18n.ordinalRules.defaultSelect_;
  }
  if (goog.LOCALE === "th") {
    goog.i18n.ordinalRules.select = goog.i18n.ordinalRules.defaultSelect_;
  }
  if (goog.LOCALE === "tl") {
    goog.i18n.ordinalRules.select = goog.i18n.ordinalRules.frSelect_;
  }
  if (goog.LOCALE === "tr") {
    goog.i18n.ordinalRules.select = goog.i18n.ordinalRules.defaultSelect_;
  }
  if (goog.LOCALE === "uk") {
    goog.i18n.ordinalRules.select = goog.i18n.ordinalRules.ukSelect_;
  }
  if (goog.LOCALE === "ur") {
    goog.i18n.ordinalRules.select = goog.i18n.ordinalRules.defaultSelect_;
  }
  if (goog.LOCALE === "uz") {
    goog.i18n.ordinalRules.select = goog.i18n.ordinalRules.defaultSelect_;
  }
  if (goog.LOCALE === "vi") {
    goog.i18n.ordinalRules.select = goog.i18n.ordinalRules.frSelect_;
  }
  if (goog.LOCALE === "zh") {
    goog.i18n.ordinalRules.select = goog.i18n.ordinalRules.defaultSelect_;
  }
  if (goog.LOCALE === "zh_CN" || goog.LOCALE === "zh-CN") {
    goog.i18n.ordinalRules.select = goog.i18n.ordinalRules.defaultSelect_;
  }
  if (goog.LOCALE === "zh_HK" || goog.LOCALE === "zh-HK") {
    goog.i18n.ordinalRules.select = goog.i18n.ordinalRules.defaultSelect_;
  }
  if (goog.LOCALE === "zh_TW" || goog.LOCALE === "zh-TW") {
    goog.i18n.ordinalRules.select = goog.i18n.ordinalRules.defaultSelect_;
  }
  if (goog.LOCALE === "zu") {
    goog.i18n.ordinalRules.select = goog.i18n.ordinalRules.defaultSelect_;
  }
}

//# sourceMappingURL=goog.i18n.ordinalrules.js.map
