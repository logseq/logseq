goog.loadModule(function(exports) {
  "use strict";
  goog.module("goog.i18n.DayPeriods");
  goog.module.declareLegacyNamespace();
  let DayPeriodInfo;
  exports.DayPeriodInfo;
  let DayPeriods;
  exports.DayPeriods = DayPeriods;
  exports.DayPeriods_zh_Hant = {midnight:{at:"00:00", formatNames:["午夜"], periodName:"midnight"}, night1:{from:"00:00", before:"05:00", formatNames:["凌晨"], periodName:"night1"}, morning1:{from:"05:00", before:"08:00", formatNames:["清晨"], periodName:"morning1"}, morning2:{from:"08:00", before:"12:00", formatNames:["上午"], periodName:"morning2"}, afternoon1:{from:"12:00", before:"13:00", formatNames:["中午"], periodName:"afternoon1"}, afternoon2:{from:"13:00", before:"19:00", formatNames:["下午"], periodName:"afternoon2"}, 
  evening1:{from:"19:00", before:"24:00", formatNames:["晚上"], periodName:"evening1"},};
  let defaultDayPeriods;
  exports.getDayPeriods = function() {
    return defaultDayPeriods;
  };
  exports.setDayPeriods = function(newDayPeriods) {
    defaultDayPeriods = newDayPeriods;
  };
  switch(goog.LOCALE) {
    case "zh-Hant":
    case "zh_Hant":
    case "zh-Hant-TW":
    case "zh_Hant_TW":
    case "zh-TW":
    case "zh_TW":
      defaultDayPeriods = exports.DayPeriods_zh_Hant;
      break;
    default:
      defaultDayPeriods = null;
      break;
  }
  return exports;
});

//# sourceMappingURL=goog.i18n.dayperiodsymbols.js.map
