goog.provide("goog.i18n.NumberFormat");
goog.provide("goog.i18n.NumberFormat.CurrencyStyle");
goog.provide("goog.i18n.NumberFormat.Format");
goog.require("goog.asserts");
goog.require("goog.i18n.CompactNumberFormatSymbols");
goog.require("goog.i18n.LocaleFeature");
goog.require("goog.i18n.NativeLocaleDigits");
goog.require("goog.i18n.NumberFormatSymbols");
goog.require("goog.i18n.NumberFormatSymbolsType");
goog.require("goog.i18n.NumberFormatSymbols_u_nu_latn");
goog.require("goog.i18n.currency");
goog.require("goog.math");
goog.require("goog.string");
goog.scope(function() {
  const LocaleFeature = goog.module.get("goog.i18n.LocaleFeature");
  const NativeLocaleDigits = goog.module.get("goog.i18n.NativeLocaleDigits");
  goog.i18n.NumberFormat = function(pattern, opt_currency, opt_currencyStyle, opt_symbols) {
    if (opt_currency && !goog.i18n.currency.isValid(opt_currency)) {
      throw new TypeError("Currency must be valid ISO code");
    }
    this.intlFormatter_ = null;
    this.resetSignificantDigits_ = false;
    this.resetFractionDigits_ = false;
    this.resetShowTrailingZeros_ = false;
    this.intlCurrencyCode_ = opt_currency ? opt_currency.toUpperCase() : null;
    this.currencyStyle_ = opt_currencyStyle || goog.i18n.NumberFormat.CurrencyStyle.LOCAL;
    this.overrideNumberFormatSymbols_ = opt_symbols || null;
    this.maximumIntegerDigits_ = 40;
    this.minimumIntegerDigits_ = 1;
    this.significantDigits_ = 0;
    this.maximumFractionDigits_ = 3;
    this.minimumFractionDigits_ = 0;
    this.minExponentDigits_ = 0;
    this.useSignForPositiveExponent_ = false;
    this.showTrailingZeros_ = false;
    this.positivePrefix_ = "";
    this.positiveSuffix_ = "";
    this.negativePrefix_ = this.getNumberFormatSymbols_().MINUS_SIGN;
    this.negativeSuffix_ = "";
    this.multiplier_ = 1;
    this.negativePercentSignExpected_ = false;
    this.groupingArray_ = [];
    this.decimalSeparatorAlwaysShown_ = false;
    this.useExponentialNotation_ = false;
    this.compactStyle_ = goog.i18n.NumberFormat.CompactStyle.NONE;
    this.baseFormattingNumber_ = null;
    this.inputPattern_ = typeof pattern === "number" ? pattern : -1;
    this.pattern_ = typeof pattern === "string" ? pattern : "";
    if (goog.i18n.NumberFormat.USE_ECMASCRIPT_I18N_NUMFORMAT && typeof pattern === "number" && pattern != goog.i18n.NumberFormat.Format.COMPACT_SHORT && pattern != goog.i18n.NumberFormat.Format.COMPACT_LONG) {
      this.SetUpIntlFormatter_(this.inputPattern_);
    } else {
      this.setFormatterToPolyfill_(pattern);
    }
  };
  goog.i18n.NumberFormat.USE_ECMASCRIPT_I18N_NUMFORMAT = goog.FEATURESET_YEAR >= 2020;
  goog.i18n.NumberFormat.Format = {DECIMAL:1, SCIENTIFIC:2, PERCENT:3, CURRENCY:4, COMPACT_SHORT:5, COMPACT_LONG:6};
  goog.i18n.NumberFormat.CurrencyStyle = {LOCAL:0, PORTABLE:1, GLOBAL:2};
  goog.i18n.NumberFormat.CompactStyle = {NONE:0, SHORT:1, LONG:2};
  goog.i18n.NumberFormat.resetEnforceAsciiDigits_ = false;
  goog.i18n.NumberFormat.enforceAsciiDigits_ = false;
  goog.i18n.NumberFormat.setEnforceAsciiDigits = function(doEnforce) {
    goog.i18n.NumberFormat.resetEnforceAsciiDigits_ = doEnforce != goog.i18n.NumberFormat.enforceAsciiDigits_;
    goog.i18n.NumberFormat.enforceAsciiDigits_ = doEnforce;
  };
  goog.i18n.NumberFormat.isEnforceAsciiDigits = function() {
    return goog.i18n.NumberFormat.enforceAsciiDigits_;
  };
  goog.i18n.NumberFormat.prototype.getNumberFormatSymbols_ = function() {
    return this.overrideNumberFormatSymbols_ || (goog.i18n.NumberFormat.enforceAsciiDigits_ ? goog.i18n.NumberFormatSymbols_u_nu_latn : goog.i18n.NumberFormatSymbols);
  };
  goog.i18n.NumberFormat.prototype.getCurrencyCode_ = function() {
    return this.intlCurrencyCode_ || this.getNumberFormatSymbols_().DEF_CURRENCY_CODE;
  };
  goog.i18n.NumberFormat.prototype.setMinimumFractionDigits = function(min) {
    if (this.significantDigits_ > 0 && min > 0) {
      throw new Error("Can't combine significant digits and minimum fraction digits");
    }
    this.resetFractionDigits_ = this.resetFractionDigits_ || min != this.minimumFractionDigits_;
    this.minimumFractionDigits_ = min;
    return this;
  };
  goog.i18n.NumberFormat.prototype.getMinimumFractionDigits = function() {
    return this.minimumFractionDigits_;
  };
  goog.i18n.NumberFormat.prototype.setMaximumFractionDigits = function(max) {
    if (max > 308) {
      throw new Error("Unsupported maximum fraction digits: " + max);
    }
    this.resetFractionDigits_ = this.resetFractionDigits_ || max != this.maximumFractionDigits_;
    this.maximumFractionDigits_ = max;
    return this;
  };
  goog.i18n.NumberFormat.prototype.getMaximumFractionDigits = function() {
    return this.maximumFractionDigits_;
  };
  goog.i18n.NumberFormat.prototype.setSignificantDigits = function(number) {
    if (this.minimumFractionDigits_ > 0 && number >= 0) {
      throw new Error("Can't combine significant digits and minimum fraction digits");
    }
    this.resetSignificantDigits_ = number !== this.significantDigits_;
    this.significantDigits_ = number;
    return this;
  };
  goog.i18n.NumberFormat.prototype.getSignificantDigits = function() {
    return this.significantDigits_;
  };
  goog.i18n.NumberFormat.prototype.setShowTrailingZeros = function(showTrailingZeros) {
    this.showTrailingZeros_ = showTrailingZeros != this.resetShowTrailingZeros_;
    return this;
  };
  goog.i18n.NumberFormat.prototype.setBaseFormatting = function(baseFormattingNumber) {
    goog.asserts.assert(baseFormattingNumber === null || isFinite(baseFormattingNumber));
    this.baseFormattingNumber_ = baseFormattingNumber;
    return this;
  };
  goog.i18n.NumberFormat.prototype.getBaseFormatting = function() {
    return this.baseFormattingNumber_;
  };
  goog.i18n.NumberFormat.prototype.setFormatterToPolyfill_ = function(pattern) {
    this.intlFormatter_ = null;
    if (typeof pattern === "number") {
      this.applyStandardPattern_(pattern);
    } else {
      this.applyPattern_(pattern);
    }
  };
  goog.i18n.NumberFormat.prototype.applyPattern_ = function(pattern) {
    this.pattern_ = pattern.replace(/ /g, " ");
    const pos = [0];
    this.positivePrefix_ = this.parseAffix_(pattern, pos);
    const trunkStart = pos[0];
    this.parseTrunk_(pattern, pos);
    const trunkLen = pos[0] - trunkStart;
    this.positiveSuffix_ = this.parseAffix_(pattern, pos);
    if (pos[0] < pattern.length && pattern.charAt(pos[0]) == goog.i18n.NumberFormat.PATTERN_SEPARATOR_) {
      pos[0]++;
      if (this.multiplier_ != 1) {
        this.negativePercentSignExpected_ = true;
      }
      this.negativePrefix_ = this.parseAffix_(pattern, pos);
      pos[0] += trunkLen;
      this.negativeSuffix_ = this.parseAffix_(pattern, pos);
    } else {
      this.negativePrefix_ += this.positivePrefix_;
      this.negativeSuffix_ += this.positiveSuffix_;
    }
  };
  goog.i18n.NumberFormat.prototype.applyStandardPattern_ = function(patternType) {
    switch(patternType) {
      case goog.i18n.NumberFormat.Format.DECIMAL:
        this.applyPattern_(this.getNumberFormatSymbols_().DECIMAL_PATTERN);
        break;
      case goog.i18n.NumberFormat.Format.SCIENTIFIC:
        this.applyPattern_(this.getNumberFormatSymbols_().SCIENTIFIC_PATTERN);
        break;
      case goog.i18n.NumberFormat.Format.PERCENT:
        this.applyPattern_(this.getNumberFormatSymbols_().PERCENT_PATTERN);
        break;
      case goog.i18n.NumberFormat.Format.CURRENCY:
        this.applyPattern_(goog.i18n.currency.adjustPrecision(this.getNumberFormatSymbols_().CURRENCY_PATTERN, this.getCurrencyCode_()));
        break;
      case goog.i18n.NumberFormat.Format.COMPACT_SHORT:
        this.applyCompactStyle_(goog.i18n.NumberFormat.CompactStyle.SHORT);
        break;
      case goog.i18n.NumberFormat.Format.COMPACT_LONG:
        this.applyCompactStyle_(goog.i18n.NumberFormat.CompactStyle.LONG);
        break;
      default:
        throw new Error("Unsupported pattern type.");
    }
  };
  goog.i18n.NumberFormat.prototype.applyCompactStyle_ = function(style) {
    this.compactStyle_ = style;
    this.applyPattern_(this.getNumberFormatSymbols_().DECIMAL_PATTERN);
    this.setMinimumFractionDigits(0);
    this.setMaximumFractionDigits(2);
    this.setSignificantDigits(2);
  };
  goog.i18n.NumberFormat.prototype.parse = function(text, opt_pos) {
    let pos = opt_pos || [0];
    if (this.compactStyle_ !== goog.i18n.NumberFormat.CompactStyle.NONE) {
      throw new Error("Parsing of compact numbers is unimplemented");
    }
    let ret = NaN;
    text = text.replace(/ |\u202f/g, " ");
    let gotPositive = text.indexOf(this.positivePrefix_, pos[0]) == pos[0];
    let gotNegative = text.indexOf(this.negativePrefix_, pos[0]) == pos[0];
    if (gotPositive && gotNegative) {
      if (this.positivePrefix_.length > this.negativePrefix_.length) {
        gotNegative = false;
      } else if (this.positivePrefix_.length < this.negativePrefix_.length) {
        gotPositive = false;
      }
    }
    if (gotPositive) {
      pos[0] += this.positivePrefix_.length;
    } else if (gotNegative) {
      pos[0] += this.negativePrefix_.length;
    }
    if (text.indexOf(this.getNumberFormatSymbols_().INFINITY, pos[0]) == pos[0]) {
      pos[0] += this.getNumberFormatSymbols_().INFINITY.length;
      ret = Infinity;
    } else {
      ret = this.parseNumber_(text, pos);
    }
    if (gotPositive) {
      if (!(text.indexOf(this.positiveSuffix_, pos[0]) == pos[0])) {
        return NaN;
      }
      pos[0] += this.positiveSuffix_.length;
    } else if (gotNegative) {
      if (!(text.indexOf(this.negativeSuffix_, pos[0]) == pos[0])) {
        return NaN;
      }
      pos[0] += this.negativeSuffix_.length;
    }
    return gotNegative ? -ret : ret;
  };
  goog.i18n.NumberFormat.prototype.parseNumber_ = function(text, pos) {
    let sawDecimal = false;
    let sawExponent = false;
    let sawDigit = false;
    let exponentPos = -1;
    let scale = 1;
    const decimal = this.getNumberFormatSymbols_().DECIMAL_SEP;
    let grouping = this.getNumberFormatSymbols_().GROUP_SEP;
    const exponentChar = this.getNumberFormatSymbols_().EXP_SYMBOL;
    if (this.compactStyle_ != goog.i18n.NumberFormat.CompactStyle.NONE) {
      throw new Error("Parsing of compact style numbers is not implemented");
    }
    grouping = grouping.replace(/\u202f/g, " ");
    let normalizedText = "";
    for (; pos[0] < text.length; pos[0]++) {
      const ch = text.charAt(pos[0]);
      const digit = this.getDigit_(ch);
      if (digit >= 0 && digit <= 9) {
        normalizedText += digit;
        sawDigit = true;
      } else if (ch == decimal.charAt(0)) {
        if (sawDecimal || sawExponent) {
          break;
        }
        normalizedText += ".";
        sawDecimal = true;
      } else if (ch == grouping.charAt(0) && (" " != grouping.charAt(0) || pos[0] + 1 < text.length && this.getDigit_(text.charAt(pos[0] + 1)) >= 0)) {
        if (sawDecimal || sawExponent) {
          break;
        }
        continue;
      } else if (ch == exponentChar.charAt(0)) {
        if (sawExponent) {
          break;
        }
        normalizedText += "E";
        sawExponent = true;
        exponentPos = pos[0];
      } else if (ch == "+" || ch == "-") {
        if (sawDigit && exponentPos != pos[0] - 1) {
          break;
        }
        normalizedText += ch;
      } else if (this.multiplier_ == 1 && ch == this.getNumberFormatSymbols_().PERCENT.charAt(0)) {
        if (scale != 1) {
          break;
        }
        scale = 100;
        if (sawDigit) {
          pos[0]++;
          break;
        }
      } else if (this.multiplier_ == 1 && ch == this.getNumberFormatSymbols_().PERMILL.charAt(0)) {
        if (scale != 1) {
          break;
        }
        scale = 1000;
        if (sawDigit) {
          pos[0]++;
          break;
        }
      } else {
        break;
      }
    }
    if (this.multiplier_ != 1) {
      scale = this.multiplier_;
    }
    return parseFloat(normalizedText) / scale;
  };
  goog.i18n.NumberFormat.prototype.SetUpIntlFormatter_ = function(inputPattern) {
    const options = {notation:"standard", minimumIntegerDigits:Math.min(21, Math.max(1, this.minimumIntegerDigits_))};
    if (this.useSignForPositiveExponent_) {
      options.signDisplay = "always";
    }
    if (goog.i18n.NumberFormat.enforceAsciiDigits_) {
      options.numberingSystem = "latn";
    }
    if (this.resetSignificantDigits_) {
      options.minimumSignificantDigits = 1;
      options.maximumSignificantDigits = Math.max(1, Math.min(21, this.significantDigits_));
    } else if (this.resetFractionDigits_) {
      options.minimumFractionDigits = Math.max(0, this.minimumFractionDigits_);
      options.maximumFractionDigits = Math.min(20, Math.max(0, this.maximumFractionDigits_));
    }
    switch(inputPattern) {
      case goog.i18n.NumberFormat.Format.DECIMAL:
        options.style = "decimal";
        break;
      case goog.i18n.NumberFormat.Format.SCIENTIFIC:
        options.notation = "scientific";
        options.maximumFractionDigits = Math.min(20, Math.max(0, this.minExponentDigits_));
        break;
      case goog.i18n.NumberFormat.Format.PERCENT:
        options.style = "percent";
        break;
      case goog.i18n.NumberFormat.Format.CURRENCY:
        options.style = "currency";
        const currencyCode = this.getCurrencyCode_();
        options.currency = currencyCode;
        const precision = goog.i18n.currency.isAvailable(currencyCode) ? goog.i18n.currency.CurrencyInfo[currencyCode][0] % 16 : 2;
        if (this.resetFractionDigits_) {
          options.minimumFractionDigits = Math.max(this.minimumFractionDigits_, 0);
          options.maximumFractionDigits = Math.min(this.maximumFractionDigits_, 20);
        } else {
          options.minimumFractionDigits = Math.max(0, precision);
          options.maximumFractionDigits = Math.min(options.minimumFractionDigits, 20);
        }
        switch(this.currencyStyle_) {
          default:
          case goog.i18n.NumberFormat.CurrencyStyle.PORTABLE:
            options.currencyDisplay = "symbol";
            break;
          case goog.i18n.NumberFormat.CurrencyStyle.GLOBAL:
            options.currencyDisplay = "code";
            break;
          case goog.i18n.NumberFormat.CurrencyStyle.LOCAL:
            options.currencyDisplay = "symbol";
        }break;
      case goog.i18n.NumberFormat.Format.COMPACT_SHORT:
        this.compactStyle_ = goog.i18n.NumberFormat.CompactStyle.SHORT;
        options.notation = "compact";
        options.compactDisplay = "short";
        break;
      case goog.i18n.NumberFormat.Format.COMPACT_LONG:
        this.compactStyle_ = goog.i18n.NumberFormat.CompactStyle.LONG;
        options.notation = "compact";
        options.compactDisplay = "long";
        break;
      default:
        throw new Error("Unsupported ECMAScript NumberFormat custom pattern \x3d " + this.pattern_);
    }
    try {
      let locale;
      if (goog.LOCALE) {
        locale = goog.LOCALE.replace("_", "-");
      }
      if (locale && !goog.i18n.NumberFormat.enforceAsciiDigits_ && locale in NativeLocaleDigits.FormatWithLocaleDigits) {
        options.numberingSystem = NativeLocaleDigits.FormatWithLocaleDigits[locale];
      }
      this.intlFormatter_ = new Intl.NumberFormat(locale, options);
    } catch (error) {
      this.intlFormatter_ = null;
      throw new Error("ECMAScript NumberFormat error: " + error);
    }
    this.resetShowTrailingZeros_ = this.resetSignificantDigits_ = this.resetFractionDigits_ = false;
    goog.i18n.NumberFormat.resetEnforceAsciiDigits_ = false;
  };
  goog.i18n.NumberFormat.prototype.NativeOptionsChanged_ = function() {
    return this.resetSignificantDigits_ || this.resetFractionDigits_ || this.resetShowTrailingZeros_ || goog.i18n.NumberFormat.resetEnforceAsciiDigits_;
  };
  goog.i18n.NumberFormat.prototype.format = function(number) {
    if (this.minimumFractionDigits_ > this.maximumFractionDigits_) {
      throw new Error("Min value must be less than max value");
    }
    if (goog.i18n.NumberFormat.USE_ECMASCRIPT_I18N_NUMFORMAT && this.intlFormatter_) {
      return this.formatUsingNativeMode_(number);
    }
    if (isNaN(number)) {
      return this.getNumberFormatSymbols_().NAN;
    }
    const parts = [];
    const baseFormattingNumber = this.baseFormattingNumber_ === null ? number : this.baseFormattingNumber_;
    const unit = this.getUnitAfterRounding_(baseFormattingNumber, number);
    number = goog.i18n.NumberFormat.decimalShift_(number, -unit.divisorBase);
    const isNegative = number < 0.0 || number == 0.0 && 1 / number < 0.0;
    if (isNegative) {
      if (unit.negative_prefix) {
        parts.push(unit.negative_prefix);
      } else {
        parts.push(unit.prefix);
        parts.push(this.negativePrefix_);
      }
    } else {
      parts.push(unit.prefix);
      parts.push(this.positivePrefix_);
    }
    if (!isFinite(number)) {
      parts.push(this.getNumberFormatSymbols_().INFINITY);
    } else {
      number *= isNegative ? -1 : 1;
      number *= this.multiplier_;
      this.useExponentialNotation_ ? this.subformatExponential_(number, parts) : this.subformatFixed_(number, this.minimumIntegerDigits_, parts);
    }
    if (isNegative) {
      if (unit.negative_suffix) {
        parts.push(unit.negative_suffix);
      } else {
        if (isFinite(number)) {
          parts.push(unit.suffix);
        }
        parts.push(this.negativeSuffix_);
      }
    } else {
      if (isFinite(number)) {
        parts.push(unit.suffix);
      }
      parts.push(this.positiveSuffix_);
    }
    return parts.join("");
  };
  goog.i18n.NumberFormat.prototype.formatUsingNativeMode_ = function(number) {
    if (this.intlFormatter_.format == null || this.NativeOptionsChanged_()) {
      this.SetUpIntlFormatter_(this.inputPattern_);
    }
    if (Math.abs(number) < 1 && this.significantDigits_ > this.maximumFractionDigits_) {
      const multipler = Math.pow(10, this.maximumFractionDigits_);
      const newNum = Math.abs(number) * multipler;
      const rounded = Math.round(newNum) * Math.sign(number);
      number = rounded / multipler;
    }
    const options = this.intlFormatter_.resolvedOptions();
    if (options.style === "percent" && this.overrideNumberFormatSymbols_ && this.overrideNumberFormatSymbols_["PERCENT"]) {
      const resultParts = this.intlFormatter_.formatToParts(number);
      const percentReplacement = this.overrideNumberFormatSymbols_["PERCENT"];
      const parts = resultParts.map(element => element.type === "percentSign" ? percentReplacement : element.value);
      return parts.join("");
    }
    if (this.showTrailingZeros_) {
      const resultParts = this.intlFormatter_.formatToParts(number);
      let intSize = 0;
      resultParts.forEach(element => element.type === "integer" && element.value !== "0" ? intSize += element.value.length : 0);
      let fracSize = 0;
      for (let i = 0; i < resultParts.length; i++) {
        if (resultParts[i].type === "fraction") {
          fracSize += resultParts[i].value.length;
        }
      }
      if (intSize + fracSize < this.significantDigits_) {
        delete options["minimumSignificantDigits"];
        delete options["maximumSignificantDigits"];
        options.minimumFractionDigits = this.significantDigits_ - intSize;
        this.resetFractionDigits_ = true;
        try {
          const newIntlFormatter = new Intl.NumberFormat(options.locale, options);
          return newIntlFormatter.format(number);
        } catch {
          return this.intlFormatter_.format(number);
        }
      }
    }
    if (this.baseFormattingNumber_) {
      const scaledResult = this.intlFormatter_.formatToParts(this.baseFormattingNumber_);
      delete options["compactDisplay"];
      options.notation = "standard";
      if (number != 0) {
        const scaledForFraction = this.baseFormattingNumber_ / number;
        let fractionDigits = 0;
        if (Math.abs(scaledForFraction) > 1.0) {
          fractionDigits = this.intLog10_(this.baseFormattingNumber_ / number);
          if (Math.round(scaledForFraction) != scaledForFraction) {
            fractionDigits += 1;
          }
        }
        if (!Number.isNaN(fractionDigits) && !options.minimumFractionDigits) {
          options.minimumFractionDigits = fractionDigits;
          options.maximumFractionDigits = !options.maximumFractionDigits ? fractionDigits : Math.max(options.maximumFractionDigits, fractionDigits);
        } else {
          options.maximumFractionDigits = options.minimumFractionDigits;
        }
        delete options["minimumSignificantDigits"];
        delete options["maximumSignificantDigits"];
      }
      const baseFormattingNumber = this.baseFormattingNumber_ === null ? number : this.baseFormattingNumber_;
      const unit = this.getUnitAfterRounding_(baseFormattingNumber, number);
      const reducedNumber = goog.i18n.NumberFormat.decimalShift_(number, -unit.divisorBase);
      let reducedFormatter;
      try {
        reducedFormatter = new Intl.NumberFormat(options.locale, options);
      } catch {
        return this.intlFormatter_.format(number);
      }
      const reducedResult = reducedFormatter.formatToParts(reducedNumber);
      const baseFormattedParts = reducedResult.map(element => element.type === "integer" || element.type === "group" || element.type === "decimal" || element.type === "fraction" ? element.value : "");
      const compactAdditions = scaledResult.filter(entry => entry.type === "compact" || entry.type === "literal").map(entry => entry.value);
      return baseFormattedParts.concat(compactAdditions).join("");
    }
    return this.intlFormatter_.format(number);
  };
  goog.i18n.NumberFormat.prototype.roundNumber_ = function(number) {
    const shift = goog.i18n.NumberFormat.decimalShift_;
    let shiftedNumber = shift(number, this.maximumFractionDigits_);
    if (this.significantDigits_ > 0) {
      shiftedNumber = this.roundToSignificantDigits_(shiftedNumber, this.significantDigits_, this.maximumFractionDigits_);
    }
    shiftedNumber = Math.round(shiftedNumber);
    let intValue, fracValue;
    if (isFinite(shiftedNumber)) {
      intValue = Math.floor(shift(shiftedNumber, -this.maximumFractionDigits_));
      fracValue = Math.floor(shiftedNumber - shift(intValue, this.maximumFractionDigits_));
    } else {
      intValue = number;
      fracValue = 0;
    }
    return {intValue:intValue, fracValue:fracValue};
  };
  goog.i18n.NumberFormat.prototype.formatNumberGroupingRepeatingDigitsParts_ = function(parts, zeroCode, intPart, groupingArray, repeatedDigitLen) {
    let nonRepeatedGroupCompleteCount = 0;
    let currentGroupSizeIndex = 0;
    let currentGroupSize = 0;
    const grouping = this.getNumberFormatSymbols_().GROUP_SEP;
    const digitLen = intPart.length;
    for (let i = 0; i < digitLen; i++) {
      parts.push(String.fromCharCode(zeroCode + Number(intPart.charAt(i)) * 1));
      if (digitLen - i > 1) {
        currentGroupSize = groupingArray[currentGroupSizeIndex];
        if (i < repeatedDigitLen) {
          let repeatedDigitIndex = repeatedDigitLen - i;
          if (currentGroupSize === 1 || currentGroupSize > 0 && repeatedDigitIndex % currentGroupSize === 1) {
            parts.push(grouping);
          }
        } else if (currentGroupSizeIndex < groupingArray.length) {
          if (i === repeatedDigitLen) {
            currentGroupSizeIndex += 1;
          } else if (currentGroupSize === i - repeatedDigitLen - nonRepeatedGroupCompleteCount + 1) {
            parts.push(grouping);
            nonRepeatedGroupCompleteCount += currentGroupSize;
            currentGroupSizeIndex += 1;
          }
        }
      }
    }
    return parts;
  };
  goog.i18n.NumberFormat.prototype.formatNumberGroupingNonRepeatingDigitsParts_ = function(parts, zeroCode, intPart, groupingArray) {
    const grouping = this.getNumberFormatSymbols_().GROUP_SEP;
    let currentGroupSizeIndex;
    let currentGroupSize = 0;
    let digitLenLeft = intPart.length;
    const rightToLeftParts = [];
    for (currentGroupSizeIndex = groupingArray.length - 1; currentGroupSizeIndex >= 0 && digitLenLeft > 0; currentGroupSizeIndex--) {
      currentGroupSize = groupingArray[currentGroupSizeIndex];
      for (let rightDigitIndex = 0; rightDigitIndex < currentGroupSize && digitLenLeft - rightDigitIndex - 1 >= 0; rightDigitIndex++) {
        rightToLeftParts.push(String.fromCharCode(zeroCode + Number(intPart.charAt(digitLenLeft - rightDigitIndex - 1)) * 1));
      }
      digitLenLeft -= currentGroupSize;
      if (digitLenLeft > 0) {
        rightToLeftParts.push(grouping);
      }
    }
    parts.push.apply(parts, rightToLeftParts.reverse());
    return parts;
  };
  goog.i18n.NumberFormat.prototype.subformatFixed_ = function(number, minIntDigits, parts) {
    if (this.minimumFractionDigits_ > this.maximumFractionDigits_) {
      throw new Error("Min value must be less than max value");
    }
    if (!parts) {
      parts = [];
    }
    const rounded = this.roundNumber_(number);
    const intValue = rounded.intValue;
    const fracValue = rounded.fracValue;
    const numIntDigits = intValue == 0 ? 0 : this.intLog10_(intValue) + 1;
    const fractionPresent = this.minimumFractionDigits_ > 0 || fracValue > 0 || this.showTrailingZeros_ && numIntDigits < this.significantDigits_;
    let minimumFractionDigits = this.minimumFractionDigits_;
    if (fractionPresent) {
      if (this.showTrailingZeros_ && this.significantDigits_ > 0) {
        minimumFractionDigits = this.significantDigits_ - numIntDigits;
      } else {
        minimumFractionDigits = this.minimumFractionDigits_;
      }
    }
    let intPart = "";
    let translatableInt = intValue;
    while (translatableInt > 1E20) {
      intPart = "0" + intPart;
      translatableInt = Math.round(goog.i18n.NumberFormat.decimalShift_(translatableInt, -1));
    }
    intPart = translatableInt + intPart;
    const decimal = this.getNumberFormatSymbols_().DECIMAL_SEP;
    const zeroCode = this.getNumberFormatSymbols_().ZERO_DIGIT.charCodeAt(0);
    const digitLen = intPart.length;
    let nonRepeatedGroupCount = 0;
    if (intValue > 0 || minIntDigits > 0) {
      for (let i = digitLen; i < minIntDigits; i++) {
        parts.push(String.fromCharCode(zeroCode));
      }
      if (this.groupingArray_.length >= 2) {
        for (let j = 1; j < this.groupingArray_.length; j++) {
          nonRepeatedGroupCount += this.groupingArray_[j];
        }
      }
      const repeatedDigitLen = digitLen - nonRepeatedGroupCount;
      if (repeatedDigitLen > 0) {
        parts = this.formatNumberGroupingRepeatingDigitsParts_(parts, zeroCode, intPart, this.groupingArray_, repeatedDigitLen);
      } else {
        parts = this.formatNumberGroupingNonRepeatingDigitsParts_(parts, zeroCode, intPart, this.groupingArray_);
      }
    } else if (!fractionPresent) {
      parts.push(String.fromCharCode(zeroCode));
    }
    if (this.decimalSeparatorAlwaysShown_ || fractionPresent) {
      parts.push(decimal);
    }
    let fracPart = String(fracValue);
    const fracPartSplit = fracPart.split("e+");
    if (fracPartSplit.length == 2) {
      const floatFrac = parseFloat(fracPartSplit[0]);
      fracPart = String(this.roundToSignificantDigits_(floatFrac, this.significantDigits_, 1));
      fracPart = fracPart.replace(".", "");
      const exp = parseInt(fracPartSplit[1], 10);
      fracPart += goog.string.repeat("0", exp - fracPart.length + 1);
    }
    if (this.maximumFractionDigits_ + 1 > fracPart.length) {
      const zeroesToAdd = this.maximumFractionDigits_ - fracPart.length;
      fracPart = "1" + goog.string.repeat("0", zeroesToAdd) + fracPart;
    }
    let fracLen = fracPart.length;
    while (fracPart.charAt(fracLen - 1) == "0" && fracLen > minimumFractionDigits + 1) {
      fracLen--;
    }
    for (let i = 1; i < fracLen; i++) {
      parts.push(String.fromCharCode(zeroCode + Number(fracPart.charAt(i)) * 1));
    }
  };
  goog.i18n.NumberFormat.prototype.addExponentPart_ = function(exponent, parts) {
    parts.push(this.getNumberFormatSymbols_().EXP_SYMBOL);
    if (exponent < 0) {
      exponent = -exponent;
      parts.push(this.getNumberFormatSymbols_().MINUS_SIGN);
    } else if (this.useSignForPositiveExponent_) {
      parts.push(this.getNumberFormatSymbols_().PLUS_SIGN);
    }
    const exponentDigits = "" + exponent;
    const zeroChar = this.getNumberFormatSymbols_().ZERO_DIGIT;
    for (let i = exponentDigits.length; i < this.minExponentDigits_; i++) {
      parts.push(zeroChar);
    }
    parts.push(exponentDigits);
  };
  goog.i18n.NumberFormat.prototype.getMantissa_ = function(value, exponent) {
    return goog.i18n.NumberFormat.decimalShift_(value, -exponent);
  };
  goog.i18n.NumberFormat.prototype.subformatExponential_ = function(number, parts) {
    if (number == 0.0) {
      this.subformatFixed_(number, this.minimumIntegerDigits_, parts);
      this.addExponentPart_(0, parts);
      return;
    }
    let exponent = goog.math.safeFloor(Math.log(number) / Math.log(10));
    number = this.getMantissa_(number, exponent);
    let minIntDigits = this.minimumIntegerDigits_;
    if (this.maximumIntegerDigits_ > 1 && this.maximumIntegerDigits_ > this.minimumIntegerDigits_) {
      let remainder = exponent % this.maximumIntegerDigits_;
      if (remainder < 0) {
        remainder = this.maximumIntegerDigits_ + remainder;
      }
      number = goog.i18n.NumberFormat.decimalShift_(number, remainder);
      exponent -= remainder;
      minIntDigits = 1;
    } else {
      if (this.minimumIntegerDigits_ < 1) {
        exponent++;
        number = goog.i18n.NumberFormat.decimalShift_(number, -1);
      } else {
        exponent -= this.minimumIntegerDigits_ - 1;
        number = goog.i18n.NumberFormat.decimalShift_(number, this.minimumIntegerDigits_ - 1);
      }
    }
    this.subformatFixed_(number, minIntDigits, parts);
    this.addExponentPart_(exponent, parts);
  };
  goog.i18n.NumberFormat.prototype.getDigit_ = function(ch) {
    const code = ch.charCodeAt(0);
    if (48 <= code && code < 58) {
      return code - 48;
    } else {
      const zeroCode = this.getNumberFormatSymbols_().ZERO_DIGIT.charCodeAt(0);
      return zeroCode <= code && code < zeroCode + 10 ? code - zeroCode : -1;
    }
  };
  goog.i18n.NumberFormat.PATTERN_ZERO_DIGIT_ = "0";
  goog.i18n.NumberFormat.PATTERN_GROUPING_SEPARATOR_ = ",";
  goog.i18n.NumberFormat.PATTERN_DECIMAL_SEPARATOR_ = ".";
  goog.i18n.NumberFormat.PATTERN_PER_MILLE_ = "‰";
  goog.i18n.NumberFormat.PATTERN_PERCENT_ = "%";
  goog.i18n.NumberFormat.PATTERN_DIGIT_ = "#";
  goog.i18n.NumberFormat.PATTERN_SEPARATOR_ = ";";
  goog.i18n.NumberFormat.PATTERN_EXPONENT_ = "E";
  goog.i18n.NumberFormat.PATTERN_PLUS_ = "+";
  goog.i18n.NumberFormat.PATTERN_CURRENCY_SIGN_ = "¤";
  goog.i18n.NumberFormat.QUOTE_ = "'";
  goog.i18n.NumberFormat.prototype.parseAffix_ = function(pattern, pos) {
    let affix = "";
    let inQuote = false;
    const len = pattern.length;
    for (; pos[0] < len; pos[0]++) {
      const ch = pattern.charAt(pos[0]);
      if (ch == goog.i18n.NumberFormat.QUOTE_) {
        if (pos[0] + 1 < len && pattern.charAt(pos[0] + 1) == goog.i18n.NumberFormat.QUOTE_) {
          pos[0]++;
          affix += "'";
        } else {
          inQuote = !inQuote;
        }
        continue;
      }
      if (inQuote) {
        affix += ch;
      } else {
        switch(ch) {
          case goog.i18n.NumberFormat.PATTERN_DIGIT_:
          case goog.i18n.NumberFormat.PATTERN_ZERO_DIGIT_:
          case goog.i18n.NumberFormat.PATTERN_GROUPING_SEPARATOR_:
          case goog.i18n.NumberFormat.PATTERN_DECIMAL_SEPARATOR_:
          case goog.i18n.NumberFormat.PATTERN_SEPARATOR_:
            return affix;
          case goog.i18n.NumberFormat.PATTERN_CURRENCY_SIGN_:
            if (pos[0] + 1 < len && pattern.charAt(pos[0] + 1) == goog.i18n.NumberFormat.PATTERN_CURRENCY_SIGN_) {
              pos[0]++;
              affix += this.getCurrencyCode_();
            } else {
              switch(this.currencyStyle_) {
                case goog.i18n.NumberFormat.CurrencyStyle.LOCAL:
                  affix += goog.i18n.currency.getLocalCurrencySignWithFallback(this.getCurrencyCode_());
                  break;
                case goog.i18n.NumberFormat.CurrencyStyle.GLOBAL:
                  affix += goog.i18n.currency.getGlobalCurrencySignWithFallback(this.getCurrencyCode_());
                  break;
                case goog.i18n.NumberFormat.CurrencyStyle.PORTABLE:
                  affix += goog.i18n.currency.getPortableCurrencySignWithFallback(this.getCurrencyCode_());
                  break;
                default:
                  break;
              }
            }
            break;
          case goog.i18n.NumberFormat.PATTERN_PERCENT_:
            if (!this.negativePercentSignExpected_ && this.multiplier_ != 1) {
              throw new Error("Too many percent/permill");
            } else if (this.negativePercentSignExpected_ && this.multiplier_ != 100) {
              throw new Error("Inconsistent use of percent/permill characters");
            }
            this.multiplier_ = 100;
            this.negativePercentSignExpected_ = false;
            affix += this.getNumberFormatSymbols_().PERCENT;
            break;
          case goog.i18n.NumberFormat.PATTERN_PER_MILLE_:
            if (!this.negativePercentSignExpected_ && this.multiplier_ != 1) {
              throw new Error("Too many percent/permill");
            } else if (this.negativePercentSignExpected_ && this.multiplier_ != 1000) {
              throw new Error("Inconsistent use of percent/permill characters");
            }
            this.multiplier_ = 1000;
            this.negativePercentSignExpected_ = false;
            affix += this.getNumberFormatSymbols_().PERMILL;
            break;
          default:
            affix += ch;
        }
      }
    }
    return affix;
  };
  goog.i18n.NumberFormat.prototype.parseTrunk_ = function(pattern, pos) {
    let decimalPos = -1;
    let digitLeftCount = 0;
    let zeroDigitCount = 0;
    let digitRightCount = 0;
    let groupingCount = -1;
    const len = pattern.length;
    for (let loop = true; pos[0] < len && loop; pos[0]++) {
      const ch = pattern.charAt(pos[0]);
      switch(ch) {
        case goog.i18n.NumberFormat.PATTERN_DIGIT_:
          if (zeroDigitCount > 0) {
            digitRightCount++;
          } else {
            digitLeftCount++;
          }
          if (groupingCount >= 0 && decimalPos < 0) {
            groupingCount++;
          }
          break;
        case goog.i18n.NumberFormat.PATTERN_ZERO_DIGIT_:
          if (digitRightCount > 0) {
            throw new Error('Unexpected "0" in pattern "' + pattern + '"');
          }
          zeroDigitCount++;
          if (groupingCount >= 0 && decimalPos < 0) {
            groupingCount++;
          }
          break;
        case goog.i18n.NumberFormat.PATTERN_GROUPING_SEPARATOR_:
          if (groupingCount > 0) {
            this.groupingArray_.push(groupingCount);
          }
          groupingCount = 0;
          break;
        case goog.i18n.NumberFormat.PATTERN_DECIMAL_SEPARATOR_:
          if (decimalPos >= 0) {
            throw new Error('Multiple decimal separators in pattern "' + pattern + '"');
          }
          decimalPos = digitLeftCount + zeroDigitCount + digitRightCount;
          break;
        case goog.i18n.NumberFormat.PATTERN_EXPONENT_:
          if (this.useExponentialNotation_) {
            throw new Error('Multiple exponential symbols in pattern "' + pattern + '"');
          }
          this.useExponentialNotation_ = true;
          this.minExponentDigits_ = 0;
          if (pos[0] + 1 < len && pattern.charAt(pos[0] + 1) == goog.i18n.NumberFormat.PATTERN_PLUS_) {
            pos[0]++;
            this.useSignForPositiveExponent_ = true;
          }
          while (pos[0] + 1 < len && pattern.charAt(pos[0] + 1) == goog.i18n.NumberFormat.PATTERN_ZERO_DIGIT_) {
            pos[0]++;
            this.minExponentDigits_++;
          }
          if (digitLeftCount + zeroDigitCount < 1 || this.minExponentDigits_ < 1) {
            throw new Error('Malformed exponential pattern "' + pattern + '"');
          }
          loop = false;
          break;
        default:
          pos[0]--;
          loop = false;
          break;
      }
    }
    if (zeroDigitCount == 0 && digitLeftCount > 0 && decimalPos >= 0) {
      let n = decimalPos;
      if (n == 0) {
        n++;
      }
      digitRightCount = digitLeftCount - n;
      digitLeftCount = n - 1;
      zeroDigitCount = 1;
    }
    if (decimalPos < 0 && digitRightCount > 0 || decimalPos >= 0 && (decimalPos < digitLeftCount || decimalPos > digitLeftCount + zeroDigitCount) || groupingCount == 0) {
      throw new Error('Malformed pattern "' + pattern + '"');
    }
    const totalDigits = digitLeftCount + zeroDigitCount + digitRightCount;
    this.maximumFractionDigits_ = decimalPos >= 0 ? totalDigits - decimalPos : 0;
    if (decimalPos >= 0) {
      this.minimumFractionDigits_ = digitLeftCount + zeroDigitCount - decimalPos;
      if (this.minimumFractionDigits_ < 0) {
        this.minimumFractionDigits_ = 0;
      }
    }
    const effectiveDecimalPos = decimalPos >= 0 ? decimalPos : totalDigits;
    this.minimumIntegerDigits_ = effectiveDecimalPos - digitLeftCount;
    if (this.useExponentialNotation_) {
      this.maximumIntegerDigits_ = digitLeftCount + this.minimumIntegerDigits_;
      if (this.maximumFractionDigits_ == 0 && this.minimumIntegerDigits_ == 0) {
        this.minimumIntegerDigits_ = 1;
      }
    }
    this.groupingArray_.push(Math.max(0, groupingCount));
    this.decimalSeparatorAlwaysShown_ = decimalPos == 0 || decimalPos == totalDigits;
  };
  goog.i18n.NumberFormat.CompactNumberUnit;
  goog.i18n.NumberFormat.IntlOptions;
  goog.i18n.NumberFormat.FormattedPart;
  goog.i18n.NumberFormat.NULL_UNIT_ = {divisorBase:0, negative_prefix:"", negative_suffix:"", prefix:"", suffix:""};
  goog.i18n.NumberFormat.prototype.getUnitFor_ = function(base, plurality) {
    let table = this.compactStyle_ == goog.i18n.NumberFormat.CompactStyle.SHORT ? goog.i18n.CompactNumberFormatSymbols.COMPACT_DECIMAL_SHORT_PATTERN : goog.i18n.CompactNumberFormatSymbols.COMPACT_DECIMAL_LONG_PATTERN;
    if (table == null) {
      table = goog.i18n.CompactNumberFormatSymbols.COMPACT_DECIMAL_SHORT_PATTERN;
    }
    if (base < 3) {
      return goog.i18n.NumberFormat.NULL_UNIT_;
    } else {
      const shift = goog.i18n.NumberFormat.decimalShift_;
      base = Math.min(14, base);
      let patterns = table[shift(1, base)];
      let previousNonNullBase = base - 1;
      while (!patterns && previousNonNullBase >= 3) {
        patterns = table[shift(1, previousNonNullBase)];
        previousNonNullBase--;
      }
      if (!patterns) {
        return goog.i18n.NumberFormat.NULL_UNIT_;
      }
      let pattern = patterns[plurality];
      let neg_prefix = "";
      let neg_suffix = "";
      let index_of_neg_part = pattern.indexOf(";");
      let neg_pattern = null;
      if (index_of_neg_part >= 0) {
        pattern = pattern.substring(0, index_of_neg_part);
        neg_pattern = pattern.substring(index_of_neg_part + 1);
        if (neg_pattern) {
          const neg_parts = /([^0]*)(0+)(.*)/.exec(neg_pattern);
          neg_prefix = neg_parts[1];
          neg_suffix = neg_parts[3];
        }
      }
      if (!pattern || pattern == "0") {
        return goog.i18n.NumberFormat.NULL_UNIT_;
      }
      const parts = /([^0]*)(0+)(.*)/.exec(pattern);
      if (!parts) {
        return goog.i18n.NumberFormat.NULL_UNIT_;
      }
      return {divisorBase:previousNonNullBase + 1 - (parts[2].length - 1), negative_prefix:neg_prefix, negative_suffix:neg_suffix, prefix:parts[1], suffix:parts[3]};
    }
  };
  goog.i18n.NumberFormat.prototype.getUnitAfterRounding_ = function(formattingNumber, pluralityNumber) {
    if (this.compactStyle_ == goog.i18n.NumberFormat.CompactStyle.NONE) {
      return goog.i18n.NumberFormat.NULL_UNIT_;
    }
    formattingNumber = Math.abs(formattingNumber);
    pluralityNumber = Math.abs(pluralityNumber);
    const initialPlurality = this.pluralForm_(formattingNumber);
    const base = formattingNumber <= 1 ? 0 : this.intLog10_(formattingNumber);
    const initialDivisor = this.getUnitFor_(base, initialPlurality).divisorBase;
    const pluralityAttempt = goog.i18n.NumberFormat.decimalShift_(pluralityNumber, -initialDivisor);
    const pluralityRounded = this.roundNumber_(pluralityAttempt);
    const formattingAttempt = goog.i18n.NumberFormat.decimalShift_(formattingNumber, -initialDivisor);
    const formattingRounded = this.roundNumber_(formattingAttempt);
    const finalPlurality = this.pluralForm_(pluralityRounded.intValue + pluralityRounded.fracValue);
    return this.getUnitFor_(initialDivisor + this.intLog10_(formattingRounded.intValue), finalPlurality);
  };
  goog.i18n.NumberFormat.prototype.intLog10_ = function(number) {
    if (!isFinite(number)) {
      return number > 0 ? number : 0;
    }
    let i = 0;
    while ((number /= 10) >= 1) {
      i++;
    }
    return i;
  };
  goog.i18n.NumberFormat.decimalShift_ = function(number, digitCount) {
    goog.asserts.assert(digitCount % 1 == 0, 'Cannot shift by fractional digits "%s".', digitCount);
    if (!number || !isFinite(number) || digitCount == 0) {
      return number;
    }
    const numParts = String(number).split("e");
    const magnitude = parseInt(numParts[1] || 0, 10) + digitCount;
    return parseFloat(numParts[0] + "e" + magnitude);
  };
  goog.i18n.NumberFormat.decimalRound_ = function(number, decimalCount) {
    goog.asserts.assert(decimalCount % 1 == 0, 'Cannot round to fractional digits "%s".', decimalCount);
    if (!number || !isFinite(number)) {
      return number;
    }
    const shift = goog.i18n.NumberFormat.decimalShift_;
    return shift(Math.round(shift(number, decimalCount)), -decimalCount);
  };
  goog.i18n.NumberFormat.prototype.roundToSignificantDigits_ = function(number, significantDigits, scale) {
    if (!number) {
      return number;
    }
    const digits = this.intLog10_(number);
    const magnitude = significantDigits - digits - 1;
    if (magnitude < -scale) {
      return goog.i18n.NumberFormat.decimalRound_(number, -scale);
    } else {
      return goog.i18n.NumberFormat.decimalRound_(number, magnitude);
    }
  };
  goog.i18n.NumberFormat.prototype.pluralForm_ = function(quantity) {
    return "other";
  };
  goog.i18n.NumberFormat.prototype.isCurrencyCodeBeforeValue = function() {
    if (goog.i18n.NumberFormat.USE_ECMASCRIPT_I18N_NUMFORMAT && this.intlFormatter_) {
      const resultParts = this.intlFormatter_.formatToParts(1000);
      let partIndex = 0;
      while (partIndex < resultParts.length) {
        const partType = resultParts[partIndex]["type"];
        if (partType == "currency") {
          return true;
        }
        if (partType == "integer" || partType == "decimal") {
          return false;
        }
        partIndex++;
      }
      return false;
    }
    const posCurrSymbol = this.pattern_.indexOf("¤");
    const posPound = this.pattern_.indexOf("#");
    const posZero = this.pattern_.indexOf("0");
    let posCurrValue = Number.MAX_VALUE;
    if (posPound >= 0 && posPound < posCurrValue) {
      posCurrValue = posPound;
    }
    if (posZero >= 0 && posZero < posCurrValue) {
      posCurrValue = posZero;
    }
    return posCurrSymbol < posCurrValue;
  };
});

//# sourceMappingURL=goog.i18n.numberformat.js.map
