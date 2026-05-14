goog.provide("goog.i18n.DateTimeFormat");
goog.provide("goog.i18n.DateTimeFormat.Format");
goog.require("goog.asserts");
goog.require("goog.date");
goog.require("goog.date.UtcDateTime");
goog.require("goog.i18n.DateTimeSymbols");
goog.require("goog.i18n.DayPeriods");
goog.require("goog.i18n.LocaleFeature");
goog.require("goog.i18n.NativeLocaleDigits");
goog.require("goog.i18n.TimeZone");
goog.require("goog.string");
goog.requireType("goog.i18n.DateTimeSymbolsType");
goog.scope(function() {
  const DayPeriods = goog.module.get("goog.i18n.DayPeriods");
  const LocaleFeature = goog.module.get("goog.i18n.LocaleFeature");
  const NativeLocaleDigits = goog.module.get("goog.i18n.NativeLocaleDigits");
  goog.i18n.DateTimeFormat = function(pattern, opt_dateTimeSymbols) {
    goog.asserts.assert(pattern !== undefined, "Pattern must be defined");
    goog.asserts.assert(opt_dateTimeSymbols !== undefined || goog.i18n.DateTimeSymbols !== undefined, "goog.i18n.DateTimeSymbols or explicit symbols must be defined");
    this.intlFormatter_ = null;
    this.originalPattern_ = pattern;
    this.patternParts_ = [];
    if (LocaleFeature.USE_ECMASCRIPT_I18N_DATETIMEF && typeof pattern == "number") {
      this.applyStandardEnumNative_(pattern, false, null);
    } else {
      this.dateTimeSymbols_ = opt_dateTimeSymbols || goog.i18n.DateTimeSymbols;
      if (typeof pattern == "number") {
        this.applyStandardPattern_(pattern);
      } else {
        this.applyPattern_(pattern);
      }
    }
  };
  goog.i18n.DateTimeFormat.Format = {FULL_DATE:0, LONG_DATE:1, MEDIUM_DATE:2, SHORT_DATE:3, FULL_TIME:4, LONG_TIME:5, MEDIUM_TIME:6, SHORT_TIME:7, FULL_DATETIME:8, LONG_DATETIME:9, MEDIUM_DATETIME:10, SHORT_DATETIME:11, WEEKDAY_MONTH_DAY_FULL:12};
  goog.i18n.DateTimeFormat.TOKENS_ = [/^'(?:[^']|'')*('|$)/, /^(?:G+|y+|Y+|M+|k+|S+|E+|a+|b+|B+|h+|K+|H+|c+|L+|Q+|d+|m+|s+|v+|V+|w+|z+|Z+)/, /^[^'GyYMkSEabBhKHcLQdmsvVwzZ]+/];
  goog.i18n.DateTimeFormat.PartTypes_ = {QUOTED_STRING:0, FIELD:1, LITERAL:2};
  goog.i18n.DateTimeFormat.getHours_ = function(date) {
    return date.getHours ? date.getHours() : 0;
  };
  goog.i18n.DateTimeFormat.getMinutes_ = function(date) {
    return date.getMinutes ? date.getMinutes() : 0;
  };
  goog.i18n.DateTimeFormat.prototype.applyPattern_ = function(pattern) {
    if (goog.i18n.DateTimeFormat.removeRlmInPatterns_) {
      pattern = pattern.replace(/\u200f/g, "");
    }
    while (pattern) {
      const previousPattern = pattern;
      for (let i = 0; i < goog.i18n.DateTimeFormat.TOKENS_.length; ++i) {
        const m = pattern.match(goog.i18n.DateTimeFormat.TOKENS_[i]);
        if (m) {
          let part = m[0];
          pattern = pattern.substring(part.length);
          if (i == goog.i18n.DateTimeFormat.PartTypes_.QUOTED_STRING) {
            if (part == "''") {
              part = "'";
            } else {
              part = part.substring(1, m[1] == "'" ? part.length - 1 : part.length);
              part = part.replace(/''/g, "'");
            }
          }
          this.patternParts_.push({text:part, type:i});
          break;
        }
      }
      if (previousPattern === pattern) {
        throw new Error("Malformed pattern part: " + pattern);
      }
    }
  };
  goog.i18n.DateTimeFormat.prototype.format = function(date, opt_timeZone) {
    if (!date) {
      throw new Error("The date to format must be non-null.");
    }
    if (this.intlFormatter_ && LocaleFeature.USE_ECMASCRIPT_I18N_DATETIMEF) {
      let changedUtcSettings = false;
      const isDateUtc = date instanceof goog.date.UtcDateTime;
      const options = this.intlFormatter_.resolvedOptions();
      if (isDateUtc) {
        changedUtcSettings = options.timeZone !== "UTC";
      } else {
        changedUtcSettings = options.timeZone === "UTC";
      }
      if (goog.i18n.DateTimeFormat.resetEnforceAsciiDigits_ || changedUtcSettings || opt_timeZone) {
        this.applyStandardEnumNative_(this.originalPattern_, isDateUtc, opt_timeZone);
        goog.i18n.DateTimeFormat.resetEnforceAsciiDigits_ = false;
      }
      const realdate = date ? new Date(date.valueOf()) : undefined;
      return this.intlFormatter_.format(realdate);
    } else {
      let diff = opt_timeZone ? (date.getTimezoneOffset() - opt_timeZone.getOffset(date)) * 60000 : 0;
      let dateForDate = diff ? new Date(date.getTime() + diff) : date;
      let dateForTime = dateForDate;
      if (opt_timeZone && dateForDate.getTimezoneOffset() != date.getTimezoneOffset()) {
        const dstDiff = (dateForDate.getTimezoneOffset() - date.getTimezoneOffset()) * 60000;
        dateForDate = new Date(dateForDate.getTime() + dstDiff);
        diff += diff > 0 ? -goog.date.MS_PER_DAY : goog.date.MS_PER_DAY;
        dateForTime = new Date(date.getTime() + diff);
      }
      const out = [];
      for (let i = 0; i < this.patternParts_.length; ++i) {
        const text = this.patternParts_[i].text;
        if (goog.i18n.DateTimeFormat.PartTypes_.FIELD == this.patternParts_[i].type) {
          out.push(this.formatField_(text, date, dateForDate, dateForTime, opt_timeZone));
        } else {
          out.push(text);
        }
      }
      return out.join("");
    }
  };
  goog.i18n.DateTimeFormat.IntlOptions;
  goog.i18n.DateTimeFormat.prototype.applyStandardEnumNative_ = function(formatType, isUtc, opt_timeZone) {
    const options = {calendar:"gregory"};
    if (isUtc) {
      options.timeZone = "UTC";
    } else if (opt_timeZone) {
      options.timeZone = opt_timeZone.getTimeZoneId();
    }
    switch(formatType) {
      case goog.i18n.DateTimeFormat.Format.FULL_DATE:
        options.dateStyle = "full";
        break;
      case goog.i18n.DateTimeFormat.Format.LONG_DATE:
        options.dateStyle = "long";
        break;
      case goog.i18n.DateTimeFormat.Format.MEDIUM_DATE:
        options.dateStyle = "medium";
        break;
      case goog.i18n.DateTimeFormat.Format.SHORT_DATE:
      default:
        options.dateStyle = "short";
        break;
      case goog.i18n.DateTimeFormat.Format.FULL_TIME:
        options.timeStyle = "full";
        break;
      case goog.i18n.DateTimeFormat.Format.LONG_TIME:
        options.timeStyle = "long";
        break;
      case goog.i18n.DateTimeFormat.Format.MEDIUM_TIME:
        options.timeStyle = "medium";
        break;
      case goog.i18n.DateTimeFormat.Format.SHORT_TIME:
        options.timeStyle = "short";
        break;
      case goog.i18n.DateTimeFormat.Format.FULL_DATETIME:
        options.dateStyle = "full";
        options.timeStyle = "full";
        break;
      case goog.i18n.DateTimeFormat.Format.LONG_DATETIME:
        options.dateStyle = "long";
        options.timeStyle = "long";
        break;
      case goog.i18n.DateTimeFormat.Format.MEDIUM_DATETIME:
        options.dateStyle = "medium";
        options.timeStyle = "medium";
        break;
      case goog.i18n.DateTimeFormat.Format.SHORT_DATETIME:
        options.dateStyle = "short";
        options.timeStyle = "short";
        break;
      case goog.i18n.DateTimeFormat.Format.WEEKDAY_MONTH_DAY_FULL:
        options.weekday = "long";
        options.month = "long";
        options.day = "numeric";
        break;
    }
    let fixedLocale = goog.LOCALE.replace(/_/g, "-");
    if (!goog.LOCALE) {
      fixedLocale = "en";
    }
    if (goog.i18n.DateTimeFormat.enforceAsciiDigits_) {
      options.numberingSystem = "latn";
    } else {
      if (fixedLocale in NativeLocaleDigits.FormatWithLocaleDigits) {
        options.numberingSystem = NativeLocaleDigits.FormatWithLocaleDigits[fixedLocale];
      }
    }
    try {
      this.intlFormatter_ = new goog.global.Intl.DateTimeFormat(fixedLocale, options);
    } catch (e) {
      goog.asserts.assert(e != null);
    }
  };
  goog.i18n.DateTimeFormat.prototype.applyStandardPattern_ = function(formatType) {
    let pattern;
    if (formatType < 4) {
      pattern = this.dateTimeSymbols_.DATEFORMATS[formatType];
    } else if (formatType < 8) {
      pattern = this.dateTimeSymbols_.TIMEFORMATS[formatType - 4];
    } else if (formatType < 12) {
      pattern = this.dateTimeSymbols_.DATETIMEFORMATS[formatType - 8];
      pattern = pattern.replace("{1}", this.dateTimeSymbols_.DATEFORMATS[formatType - 8]);
      pattern = pattern.replace("{0}", this.dateTimeSymbols_.TIMEFORMATS[formatType - 8]);
    } else if (formatType === goog.i18n.DateTimeFormat.Format.WEEKDAY_MONTH_DAY_FULL) {
      pattern = this.removeYearFormatFromPattern_(this.dateTimeSymbols_.DATEFORMATS[0]);
    } else {
      this.applyStandardPattern_(goog.i18n.DateTimeFormat.Format.MEDIUM_DATETIME);
      return;
    }
    this.applyPattern_(pattern);
  };
  goog.i18n.DateTimeFormat.prototype.localizeNumbers_ = function(input) {
    return goog.i18n.DateTimeFormat.localizeNumbers(input, this.dateTimeSymbols_);
  };
  goog.i18n.DateTimeFormat.enforceAsciiDigits_ = false;
  goog.i18n.DateTimeFormat.resetEnforceAsciiDigits_ = false;
  goog.i18n.DateTimeFormat.removeRlmInPatterns_ = false;
  goog.i18n.DateTimeFormat.setEnforceAsciiDigits = function(enforceAsciiDigits) {
    if (goog.i18n.DateTimeFormat.enforceAsciiDigits_ !== enforceAsciiDigits) {
      goog.i18n.DateTimeFormat.enforceAsciiDigits_ = enforceAsciiDigits;
      goog.i18n.DateTimeFormat.resetEnforceAsciiDigits_ = true;
    }
    goog.i18n.DateTimeFormat.removeRlmInPatterns_ = enforceAsciiDigits;
  };
  goog.i18n.DateTimeFormat.isEnforceAsciiDigits = function() {
    return goog.i18n.DateTimeFormat.enforceAsciiDigits_;
  };
  goog.i18n.DateTimeFormat.localizeNumbers = function(input, opt_dateTimeSymbols) {
    input = String(input);
    const dateTimeSymbols = opt_dateTimeSymbols || goog.i18n.DateTimeSymbols;
    if (dateTimeSymbols.ZERODIGIT === undefined || goog.i18n.DateTimeFormat.enforceAsciiDigits_) {
      return input;
    }
    const parts = [];
    for (let i = 0; i < input.length; i++) {
      const c = input.charCodeAt(i);
      parts.push(48 <= c && c <= 57 ? String.fromCharCode(dateTimeSymbols.ZERODIGIT + c - 48) : input.charAt(i));
    }
    return parts.join("");
  };
  goog.i18n.DateTimeFormat.prototype.formatEra_ = function(count, date) {
    const value = date.getFullYear() > 0 ? 1 : 0;
    return count >= 4 ? this.dateTimeSymbols_.ERANAMES[value] : this.dateTimeSymbols_.ERAS[value];
  };
  goog.i18n.DateTimeFormat.prototype.formatYear_ = function(count, date) {
    let value = date.getFullYear();
    if (value < 0) {
      value = -value;
    }
    if (count == 2) {
      value = value % 100;
    }
    return this.localizeNumbers_(goog.string.padNumber(value, count));
  };
  goog.i18n.DateTimeFormat.prototype.formatYearOfWeek_ = function(count, date) {
    let value = goog.date.getYearOfWeek(date.getFullYear(), date.getMonth(), date.getDate(), this.dateTimeSymbols_.FIRSTWEEKCUTOFFDAY, this.dateTimeSymbols_.FIRSTDAYOFWEEK);
    if (value < 0) {
      value = -value;
    }
    if (count == 2) {
      value = value % 100;
    }
    return this.localizeNumbers_(goog.string.padNumber(value, count));
  };
  goog.i18n.DateTimeFormat.prototype.formatMonth_ = function(count, date) {
    const value = date.getMonth();
    switch(count) {
      case 5:
        return this.dateTimeSymbols_.NARROWMONTHS[value];
      case 4:
        return this.dateTimeSymbols_.MONTHS[value];
      case 3:
        return this.dateTimeSymbols_.SHORTMONTHS[value];
      default:
        return this.localizeNumbers_(goog.string.padNumber(value + 1, count));
    }
  };
  goog.i18n.DateTimeFormat.validateDateHasTime_ = function(date) {
    let maybeHasTime = date;
    if (maybeHasTime.getHours && maybeHasTime.getSeconds && maybeHasTime.getMinutes) {
      return;
    }
    throw new Error("The date to format has no time (probably a goog.date.Date). " + "Use Date or goog.date.DateTime, or use a pattern without time fields.");
  };
  goog.i18n.DateTimeFormat.prototype.format24Hours_ = function(count, date) {
    goog.i18n.DateTimeFormat.validateDateHasTime_(date);
    const hours = goog.i18n.DateTimeFormat.getHours_(date) || 24;
    return this.localizeNumbers_(goog.string.padNumber(hours, count));
  };
  goog.i18n.DateTimeFormat.prototype.formatFractionalSeconds_ = function(count, date) {
    const value = date.getMilliseconds() / 1000;
    return this.localizeNumbers_(value.toFixed(Math.min(3, count)).slice(2) + (count > 3 ? goog.string.padNumber(0, count - 3) : ""));
  };
  goog.i18n.DateTimeFormat.prototype.formatDayOfWeek_ = function(count, date) {
    const value = date.getDay();
    return count >= 4 ? this.dateTimeSymbols_.WEEKDAYS[value] : this.dateTimeSymbols_.SHORTWEEKDAYS[value];
  };
  goog.i18n.DateTimeFormat.prototype.formatAmPm_ = function(count, date) {
    goog.i18n.DateTimeFormat.validateDateHasTime_(date);
    const hours = goog.i18n.DateTimeFormat.getHours_(date);
    return this.dateTimeSymbols_.AMPMS[hours >= 12 && hours < 24 ? 1 : 0];
  };
  goog.i18n.DateTimeFormat.prototype.formatAmPmNoonMidnight_ = function(count, date) {
    goog.i18n.DateTimeFormat.validateDateHasTime_(date);
    const hours = goog.i18n.DateTimeFormat.getHours_(date);
    const minutes = goog.i18n.DateTimeFormat.getMinutes_(date);
    const dayPeriods = goog.i18n.DayPeriods.getDayPeriods();
    if (dayPeriods && minutes === 0) {
      if (dayPeriods.midnight && hours == 0) {
        return dayPeriods.midnight.formatNames[0];
      } else if (dayPeriods.noon && hours === 12) {
        return dayPeriods.noon.formatNames[0];
      }
    }
    return this.dateTimeSymbols_.AMPMS[hours >= 12 && hours < 24 ? 1 : 0];
  };
  goog.i18n.DateTimeFormat.prototype.formatFlexibleDayPeriods_ = function(count, date) {
    goog.i18n.DateTimeFormat.validateDateHasTime_(date);
    const hours = goog.i18n.DateTimeFormat.getHours_(date);
    const minutes = goog.i18n.DateTimeFormat.getMinutes_(date);
    const fmtTime = hours.toString(10).padStart(2, "0") + ":" + minutes.toString().padStart(2, "0");
    let period;
    const dayPeriods = goog.i18n.DayPeriods.getDayPeriods();
    if (dayPeriods) {
      const keys = Object.keys(dayPeriods);
      for (let index = 0; index < keys.length; index++) {
        let testPeriod = dayPeriods[keys[index]];
        if (fmtTime === testPeriod.at) {
          period = keys[index];
          break;
        }
        if (testPeriod.before > testPeriod.from) {
          if (fmtTime >= testPeriod.from && fmtTime < testPeriod.before) {
            period = keys[index];
          }
        } else {
          if (fmtTime >= testPeriod.from && fmtTime < "24:00" || fmtTime >= "00:00" && fmtTime < testPeriod.before) {
            period = keys[index];
            break;
          }
        }
      }
      if (period) {
        return dayPeriods[period].formatNames[0];
      }
    }
    return this.dateTimeSymbols_.AMPMS[hours >= 12 && hours < 24 ? 1 : 0];
  };
  goog.i18n.DateTimeFormat.prototype.format1To12Hours_ = function(count, date) {
    goog.i18n.DateTimeFormat.validateDateHasTime_(date);
    const hours = goog.i18n.DateTimeFormat.getHours_(date) % 12 || 12;
    return this.localizeNumbers_(goog.string.padNumber(hours, count));
  };
  goog.i18n.DateTimeFormat.prototype.format0To11Hours_ = function(count, date) {
    goog.i18n.DateTimeFormat.validateDateHasTime_(date);
    const hours = goog.i18n.DateTimeFormat.getHours_(date) % 12;
    return this.localizeNumbers_(goog.string.padNumber(hours, count));
  };
  goog.i18n.DateTimeFormat.prototype.format0To23Hours_ = function(count, date) {
    goog.i18n.DateTimeFormat.validateDateHasTime_(date);
    const hours = goog.i18n.DateTimeFormat.getHours_(date);
    return this.localizeNumbers_(goog.string.padNumber(hours, count));
  };
  goog.i18n.DateTimeFormat.prototype.formatStandaloneDay_ = function(count, date) {
    const value = date.getDay();
    switch(count) {
      case 5:
        return this.dateTimeSymbols_.STANDALONENARROWWEEKDAYS[value];
      case 4:
        return this.dateTimeSymbols_.STANDALONEWEEKDAYS[value];
      case 3:
        return this.dateTimeSymbols_.STANDALONESHORTWEEKDAYS[value];
      default:
        return this.localizeNumbers_(goog.string.padNumber(value, 1));
    }
  };
  goog.i18n.DateTimeFormat.prototype.formatStandaloneMonth_ = function(count, date) {
    const value = date.getMonth();
    switch(count) {
      case 5:
        return this.dateTimeSymbols_.STANDALONENARROWMONTHS[value];
      case 4:
        return this.dateTimeSymbols_.STANDALONEMONTHS[value];
      case 3:
        return this.dateTimeSymbols_.STANDALONESHORTMONTHS[value];
      default:
        return this.localizeNumbers_(goog.string.padNumber(value + 1, count));
    }
  };
  goog.i18n.DateTimeFormat.prototype.formatQuarter_ = function(count, date) {
    const value = Math.floor(date.getMonth() / 3);
    return count < 4 ? this.dateTimeSymbols_.SHORTQUARTERS[value] : this.dateTimeSymbols_.QUARTERS[value];
  };
  goog.i18n.DateTimeFormat.prototype.formatDate_ = function(count, date) {
    return this.localizeNumbers_(goog.string.padNumber(date.getDate(), count));
  };
  goog.i18n.DateTimeFormat.prototype.formatMinutes_ = function(count, date) {
    goog.i18n.DateTimeFormat.validateDateHasTime_(date);
    return this.localizeNumbers_(goog.string.padNumber(goog.i18n.DateTimeFormat.getMinutes_(date), count));
  };
  goog.i18n.DateTimeFormat.prototype.formatSeconds_ = function(count, date) {
    goog.i18n.DateTimeFormat.validateDateHasTime_(date);
    return this.localizeNumbers_(goog.string.padNumber(date.getSeconds(), count));
  };
  goog.i18n.DateTimeFormat.prototype.formatWeekOfYear_ = function(count, date) {
    const weekNum = goog.date.getWeekNumber(date.getFullYear(), date.getMonth(), date.getDate(), this.dateTimeSymbols_.FIRSTWEEKCUTOFFDAY, this.dateTimeSymbols_.FIRSTDAYOFWEEK);
    return this.localizeNumbers_(goog.string.padNumber(weekNum, count));
  };
  goog.i18n.DateTimeFormat.prototype.formatTimeZoneRFC_ = function(count, date, opt_timeZone) {
    opt_timeZone = opt_timeZone || goog.i18n.TimeZone.createTimeZone(date.getTimezoneOffset());
    return count < 4 ? opt_timeZone.getRFCTimeZoneString(date) : this.localizeNumbers_(opt_timeZone.getGMTString(date));
  };
  goog.i18n.DateTimeFormat.prototype.formatTimeZone_ = function(count, date, opt_timeZone) {
    opt_timeZone = opt_timeZone || goog.i18n.TimeZone.createTimeZone(date.getTimezoneOffset());
    return count < 4 ? opt_timeZone.getShortName(date) : opt_timeZone.getLongName(date);
  };
  goog.i18n.DateTimeFormat.prototype.formatTimeZoneId_ = function(date, opt_timeZone) {
    opt_timeZone = opt_timeZone || goog.i18n.TimeZone.createTimeZone(date.getTimezoneOffset());
    return opt_timeZone.getTimeZoneId();
  };
  goog.i18n.DateTimeFormat.prototype.formatTimeZoneLocationId_ = function(count, date, opt_timeZone) {
    opt_timeZone = opt_timeZone || goog.i18n.TimeZone.createTimeZone(date.getTimezoneOffset());
    return count <= 2 ? opt_timeZone.getTimeZoneId() : opt_timeZone.getGenericLocation(date);
  };
  goog.i18n.DateTimeFormat.prototype.formatField_ = function(patternStr, date, dateForDate, dateForTime, opt_timeZone) {
    const count = patternStr.length;
    const dayPeriods = goog.i18n.DayPeriods.getDayPeriods();
    switch(patternStr.charAt(0)) {
      case "G":
        return this.formatEra_(count, dateForDate);
      case "y":
        return this.formatYear_(count, dateForDate);
      case "Y":
        return this.formatYearOfWeek_(count, dateForDate);
      case "M":
        return this.formatMonth_(count, dateForDate);
      case "k":
        return this.format24Hours_(count, dateForTime);
      case "S":
        return this.formatFractionalSeconds_(count, dateForTime);
      case "E":
        return this.formatDayOfWeek_(count, dateForDate);
      case "a":
        return this.formatAmPm_(count, dateForTime);
      case "b":
        if (dayPeriods) {
          return this.formatAmPmNoonMidnight_(count, dateForTime);
        } else {
          return this.formatAmPm_(count, dateForTime);
        }
      case "B":
        if (dayPeriods) {
          return this.formatFlexibleDayPeriods_(count, dateForTime);
        } else {
          return this.formatAmPm_(count, dateForTime);
        }
      case "h":
        return this.format1To12Hours_(count, dateForTime);
      case "K":
        return this.format0To11Hours_(count, dateForTime);
      case "H":
        return this.format0To23Hours_(count, dateForTime);
      case "c":
        return this.formatStandaloneDay_(count, dateForDate);
      case "L":
        return this.formatStandaloneMonth_(count, dateForDate);
      case "Q":
        return this.formatQuarter_(count, dateForDate);
      case "d":
        return this.formatDate_(count, dateForDate);
      case "m":
        return this.formatMinutes_(count, dateForTime);
      case "s":
        return this.formatSeconds_(count, dateForTime);
      case "v":
        return this.formatTimeZoneId_(date, opt_timeZone);
      case "V":
        return this.formatTimeZoneLocationId_(count, date, opt_timeZone);
      case "w":
        return this.formatWeekOfYear_(count, dateForTime);
      case "z":
        return this.formatTimeZone_(count, date, opt_timeZone);
      case "Z":
        return this.formatTimeZoneRFC_(count, date, opt_timeZone);
      default:
        return "";
    }
  };
  goog.i18n.DateTimeFormat.prototype.removeYearFormatFromPattern_ = function(patternStr) {
    const yearPattern = /[^EMd]*yy*[^EMd]*/;
    return patternStr.replace(yearPattern, "");
  };
});

//# sourceMappingURL=goog.i18n.datetimeformat.js.map
