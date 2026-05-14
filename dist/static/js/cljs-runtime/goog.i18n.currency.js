goog.provide("goog.i18n.currency");
goog.i18n.currency.PRECISION_MASK_ = 7;
goog.i18n.currency.POSITION_FLAG_ = 16;
goog.i18n.currency.SPACE_FLAG_ = 32;
goog.i18n.currency.tier2Enabled_ = false;
goog.i18n.currency.isAvailable = function(currencyCode) {
  return currencyCode in goog.i18n.currency.CurrencyInfo;
};
goog.i18n.currency.addTier2Support = function() {
  if (!goog.i18n.currency.tier2Enabled_) {
    for (const key in goog.i18n.currency.CurrencyInfoTier2) {
      goog.i18n.currency.CurrencyInfo[key] = goog.i18n.currency.CurrencyInfoTier2[key];
    }
    goog.i18n.currency.tier2Enabled_ = true;
  }
};
goog.i18n.currency.getGlobalCurrencyPattern = function(currencyCode) {
  const info = goog.i18n.currency.CurrencyInfo[currencyCode];
  const patternNum = info[0];
  if (currencyCode == info[1]) {
    return goog.i18n.currency.getCurrencyPattern_(patternNum, info[1]);
  }
  return currencyCode + " " + goog.i18n.currency.getCurrencyPattern_(patternNum, info[1]);
};
goog.i18n.currency.getGlobalCurrencySign = function(currencyCode) {
  const info = goog.i18n.currency.CurrencyInfo[currencyCode];
  return currencyCode == info[1] ? currencyCode : currencyCode + " " + info[1];
};
goog.i18n.currency.getGlobalCurrencySignWithFallback = function(currencyCode) {
  const info = goog.i18n.currency.CurrencyInfo[currencyCode];
  if (!info) {
    return currencyCode;
  }
  return currencyCode == info[1] ? currencyCode : currencyCode + " " + info[1];
};
goog.i18n.currency.getLocalCurrencyPattern = function(currencyCode) {
  const info = goog.i18n.currency.CurrencyInfo[currencyCode];
  return goog.i18n.currency.getCurrencyPattern_(info[0], info[1]);
};
goog.i18n.currency.getLocalCurrencySign = function(currencyCode) {
  return goog.i18n.currency.CurrencyInfo[currencyCode][1];
};
goog.i18n.currency.getLocalCurrencySignWithFallback = function(currencyCode) {
  if (currencyCode in goog.i18n.currency.CurrencyInfo) {
    return goog.i18n.currency.CurrencyInfo[currencyCode][1];
  } else {
    return currencyCode;
  }
};
goog.i18n.currency.getPortableCurrencyPattern = function(currencyCode) {
  const info = goog.i18n.currency.CurrencyInfo[currencyCode];
  return goog.i18n.currency.getCurrencyPattern_(info[0], info[2]);
};
goog.i18n.currency.getPortableCurrencySign = function(currencyCode) {
  return goog.i18n.currency.CurrencyInfo[currencyCode][2];
};
goog.i18n.currency.isValid = function(currencyCode) {
  if (!currencyCode || currencyCode.length !== 3) {
    return false;
  }
  for (let i = 0; i < 3; i++) {
    const c = currencyCode[i];
    if (c < "A" || c > "Z" && c < "a" || c > "z") {
      return false;
    }
  }
  return true;
};
goog.i18n.currency.getPortableCurrencySignWithFallback = function(currencyCode) {
  if (currencyCode in goog.i18n.currency.CurrencyInfo) {
    return goog.i18n.currency.CurrencyInfo[currencyCode][2];
  } else {
    return currencyCode;
  }
};
goog.i18n.currency.isPrefixSignPosition = function(currencyCode) {
  return (goog.i18n.currency.CurrencyInfo[currencyCode][0] & goog.i18n.currency.POSITION_FLAG_) == 0;
};
goog.i18n.currency.getCurrencyPattern_ = function(patternNum, sign) {
  const strParts = ["#,##0"];
  const precision = patternNum & goog.i18n.currency.PRECISION_MASK_;
  if (precision > 0) {
    strParts.push(".");
    for (let i = 0; i < precision; i++) {
      strParts.push("0");
    }
  }
  if ((patternNum & goog.i18n.currency.POSITION_FLAG_) == 0) {
    strParts.unshift(patternNum & goog.i18n.currency.SPACE_FLAG_ ? "' " : "'");
    strParts.unshift(sign);
    strParts.unshift("'");
  } else {
    strParts.push(patternNum & goog.i18n.currency.SPACE_FLAG_ ? " '" : "'", sign, "'");
  }
  return strParts.join("");
};
goog.i18n.currency.adjustPrecision = function(pattern, currencyCode) {
  const strParts = ["0"];
  const info = goog.i18n.currency.CurrencyInfo[currencyCode];
  if (!info) {
    return pattern;
  }
  const precision = info[0] & goog.i18n.currency.PRECISION_MASK_;
  if (precision > 0) {
    strParts.push(".");
    for (let i = 0; i < precision; i++) {
      strParts.push("0");
    }
  }
  return pattern.replace(/0.00/g, strParts.join(""));
};
goog.i18n.currency.CurrencyInfo = {"AED":[2, "dh", "د.إ."], "ALL":[0, "Lek", "Lek"], "AUD":[2, "$", "AU$"], "BDT":[2, "৳", "Tk"], "BGN":[2, "lev", "lev"], "BRL":[2, "R$", "R$"], "CAD":[2, "$", "C$"], "CDF":[2, "FrCD", "CDF"], "CHF":[2, "CHF", "CHF"], "CLP":[0, "$", "CL$"], "CNY":[2, "¥", "RMB¥"], "COP":[32, "$", "COL$"], "CRC":[0, "₡", "CR₡"], "CZK":[50, "Kč", "Kč"], "DKK":[50, "kr.", "kr."], "DOP":[2, "RD$", "RD$"], "EGP":[2, "£", "LE"], "ETB":[2, "Birr", "Birr"], "EUR":[2, "€", "€"], "GBP":[2, 
"£", "GB£"], "HKD":[2, "$", "HK$"], "HRK":[2, "kn", "kn"], "HUF":[34, "Ft", "Ft"], "IDR":[0, "Rp", "Rp"], "ILS":[34, "₪", "IL₪"], "INR":[2, "₹", "Rs"], "IRR":[0, "Rial", "IRR"], "ISK":[0, "kr", "kr"], "JMD":[2, "$", "JA$"], "JPY":[0, "¥", "JP¥"], "KRW":[0, "₩", "KR₩"], "LKR":[2, "Rs", "SLRs"], "LTL":[2, "Lt", "Lt"], "MNT":[0, "₮", "MN₮"], "MVR":[2, "Rf", "MVR"], "MXN":[2, "$", "Mex$"], "MYR":[2, "RM", "RM"], "NOK":[50, "kr", "NOkr"], "PAB":[2, "B/.", "B/."], "PEN":[2, "S/.", "S/."], "PHP":[2, "₱", 
"PHP"], "PKR":[0, "Rs", "PKRs."], "PLN":[50, "zł", "zł"], "RON":[2, "RON", "RON"], "RSD":[0, "din", "RSD"], "RUB":[50, "₽", "RUB"], "SAR":[2, "SAR", "SAR"], "SEK":[50, "kr", "kr"], "SGD":[2, "$", "S$"], "THB":[2, "฿", "THB"], "TRY":[2, "₺", "TRY"], "TWD":[2, "$", "NT$"], "TZS":[0, "TSh", "TSh"], "UAH":[2, "грн.", "UAH"], "USD":[2, "$", "US$"], "UYU":[2, "$", "$U"], "VND":[48, "₫", "VN₫"], "YER":[0, "Rial", "Rial"], "ZAR":[2, "R", "ZAR"]};
goog.i18n.currency.CurrencyInfoTier2 = {"AFN":[48, "Af.", "AFN"], "AMD":[32, "Dram", "dram"], "ANG":[2, "NAf.", "ANG"], "AOA":[2, "Kz", "Kz"], "ARS":[34, "$", "AR$"], "AWG":[2, "Afl.", "Afl."], "AZN":[34, "₼", "AZN"], "BAM":[2, "KM", "KM"], "BBD":[2, "$", "Bds$"], "BHD":[3, "din", "din"], "BIF":[0, "FBu", "FBu"], "BMD":[2, "$", "BD$"], "BND":[2, "$", "B$"], "BOB":[2, "Bs", "Bs"], "BSD":[2, "$", "BS$"], "BTN":[2, "Nu.", "Nu."], "BWP":[2, "P", "pula"], "BYN":[50, "р.", "BYN"], "BYR":[48, "р.", "BYR"], 
"BZD":[2, "$", "BZ$"], "CLF":[4, "UF", "CLF"], "CNH":[2, "¥", "RMB¥"], "CUC":[1, "$", "CUC$"], "CUP":[2, "$", "CU$"], "CVE":[2, "CVE", "Esc"], "DJF":[0, "Fdj", "Fdj"], "DZD":[2, "din", "din"], "ERN":[2, "Nfk", "Nfk"], "FJD":[2, "$", "FJ$"], "FKP":[2, "£", "FK£"], "GEL":[2, "GEL", "GEL"], "GHS":[2, "GHS", "GHS"], "GIP":[2, "£", "GI£"], "GMD":[2, "GMD", "GMD"], "GNF":[0, "FG", "FG"], "GTQ":[2, "Q", "GTQ"], "GYD":[0, "$", "GY$"], "HNL":[2, "L", "HNL"], "HTG":[2, "HTG", "HTG"], "IQD":[0, "din", "IQD"], 
"JOD":[3, "din", "JOD"], "KES":[2, "Ksh", "Ksh"], "KGS":[2, "KGS", "KGS"], "KHR":[2, "Riel", "KHR"], "KMF":[0, "CF", "KMF"], "KPW":[0, "₩KP", "KPW"], "KWD":[3, "din", "KWD"], "KYD":[2, "$", "KY$"], "KZT":[2, "₸", "KZT"], "LAK":[0, "₭", "₭"], "LBP":[0, "L£", "LBP"], "LRD":[2, "$", "L$"], "LSL":[2, "LSL", "LSL"], "LYD":[3, "din", "LD"], "MAD":[2, "dh", "MAD"], "MDL":[2, "MDL", "MDL"], "MGA":[0, "Ar", "MGA"], "MKD":[2, "din", "MKD"], "MMK":[0, "K", "MMK"], "MOP":[2, "MOP", "MOP$"], "MRO":[0, "MRO", 
"MRO"], "MUR":[0, "MURs", "MURs"], "MWK":[2, "MWK", "MWK"], "MZN":[2, "MTn", "MTn"], "NAD":[2, "$", "N$"], "NGN":[2, "₦", "NG₦"], "NIO":[2, "C$", "C$"], "NPR":[2, "Rs", "NPRs"], "NZD":[2, "$", "NZ$"], "OMR":[3, "Rial", "OMR"], "PGK":[2, "PGK", "PGK"], "PYG":[16, "Gs.", "PYG"], "QAR":[2, "Rial", "QR"], "RWF":[0, "RF", "RF"], "SBD":[2, "$", "SI$"], "SCR":[2, "SCR", "SCR"], "SDG":[2, "SDG", "SDG"], "SHP":[2, "£", "SH£"], "SLL":[0, "SLL", "SLL"], "SOS":[0, "SOS", "SOS"], "SRD":[2, "$", "SR$"], "SSP":[2, 
"£", "SSP"], "STD":[0, "Db", "Db"], "SYP":[0, "£", "SY£"], "SZL":[2, "SZL", "SZL"], "TJS":[2, "Som", "TJS"], "TMT":[50, "m", "TMT"], "TND":[3, "din", "DT"], "TOP":[2, "T$", "T$"], "TTD":[2, "$", "TT$"], "UGX":[0, "UGX", "UGX"], "UZS":[0, "soʼm", "UZS"], "VEF":[2, "Bs", "Bs"], "VES":[2, "Bs", "Bs"], "VUV":[0, "VUV", "VUV"], "WST":[2, "WST", "WST"], "XAF":[0, "FCFA", "FCFA"], "XCD":[2, "$", "EC$"], "XOF":[0, "CFA", "CFA"], "XPF":[48, "FCFP", "FCFP"], "ZMW":[0, "ZMW", "ZMW"], "ZWD":[0, "$", "Z$"]};

//# sourceMappingURL=goog.i18n.currency.js.map
