goog.provide('cljc.java_time.local_date');
goog.scope(function(){
  cljc.java_time.local_date.goog$module$goog$object = goog.module.get('goog.object');
});
cljc.java_time.local_date.max = cljc.java_time.local_date.goog$module$goog$object.get(java.time.LocalDate,"MAX");
cljc.java_time.local_date.min = cljc.java_time.local_date.goog$module$goog$object.get(java.time.LocalDate,"MIN");
cljc.java_time.local_date.minus_weeks = (function cljc$java_time$local_date$minus_weeks(this13154,long13155){
return this13154.minusWeeks(long13155);
});
cljc.java_time.local_date.plus_weeks = (function cljc$java_time$local_date$plus_weeks(this13156,long13157){
return this13156.plusWeeks(long13157);
});
cljc.java_time.local_date.length_of_year = (function cljc$java_time$local_date$length_of_year(this13158){
return this13158.lengthOfYear();
});
cljc.java_time.local_date.range = (function cljc$java_time$local_date$range(this13159,java_time_temporal_TemporalField13160){
return this13159.range(java_time_temporal_TemporalField13160);
});
cljc.java_time.local_date.get_era = (function cljc$java_time$local_date$get_era(this13161){
return this13161.era();
});
cljc.java_time.local_date.of = (function cljc$java_time$local_date$of(G__13163,G__13164,G__13165){
return cljs.core.js_invoke.cljs$core$IFn$_invoke$arity$variadic(java.time.LocalDate,"of",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([G__13163,G__13164,G__13165], 0));
});
cljc.java_time.local_date.with_month = (function cljc$java_time$local_date$with_month(this13166,int13167){
return this13166.withMonth(int13167);
});
cljc.java_time.local_date.is_equal = (function cljc$java_time$local_date$is_equal(this13168,java_time_chrono_ChronoLocalDate13169){
return this13168.isEqual(java_time_chrono_ChronoLocalDate13169);
});
cljc.java_time.local_date.get_year = (function cljc$java_time$local_date$get_year(this13170){
return this13170.year();
});
cljc.java_time.local_date.to_epoch_day = (function cljc$java_time$local_date$to_epoch_day(this13171){
return this13171.toEpochDay();
});
cljc.java_time.local_date.get_day_of_year = (function cljc$java_time$local_date$get_day_of_year(this13172){
return this13172.dayOfYear();
});
cljc.java_time.local_date.plus = (function cljc$java_time$local_date$plus(var_args){
var G__120780 = arguments.length;
switch (G__120780) {
case 3:
return cljc.java_time.local_date.plus.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
case 2:
return cljc.java_time.local_date.plus.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(cljc.java_time.local_date.plus.cljs$core$IFn$_invoke$arity$3 = (function (this13173,long13174,java_time_temporal_TemporalUnit13175){
return this13173.plus(long13174,java_time_temporal_TemporalUnit13175);
}));

(cljc.java_time.local_date.plus.cljs$core$IFn$_invoke$arity$2 = (function (this13176,java_time_temporal_TemporalAmount13177){
return this13176.plus(java_time_temporal_TemporalAmount13177);
}));

(cljc.java_time.local_date.plus.cljs$lang$maxFixedArity = 3);

cljc.java_time.local_date.is_leap_year = (function cljc$java_time$local_date$is_leap_year(this13178){
return this13178.isLeapYear();
});
cljc.java_time.local_date.query = (function cljc$java_time$local_date$query(this13179,java_time_temporal_TemporalQuery13180){
return this13179.query(java_time_temporal_TemporalQuery13180);
});
cljc.java_time.local_date.get_day_of_week = (function cljc$java_time$local_date$get_day_of_week(this13181){
return this13181.dayOfWeek();
});
cljc.java_time.local_date.to_string = (function cljc$java_time$local_date$to_string(this13182){
return this13182.toString();
});
cljc.java_time.local_date.plus_months = (function cljc$java_time$local_date$plus_months(this13183,long13184){
return this13183.plusMonths(long13184);
});
cljc.java_time.local_date.is_before = (function cljc$java_time$local_date$is_before(this13185,java_time_chrono_ChronoLocalDate13186){
return this13185.isBefore(java_time_chrono_ChronoLocalDate13186);
});
cljc.java_time.local_date.minus_months = (function cljc$java_time$local_date$minus_months(this13187,long13188){
return this13187.minusMonths(long13188);
});
cljc.java_time.local_date.minus = (function cljc$java_time$local_date$minus(var_args){
var G__120782 = arguments.length;
switch (G__120782) {
case 3:
return cljc.java_time.local_date.minus.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
case 2:
return cljc.java_time.local_date.minus.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(cljc.java_time.local_date.minus.cljs$core$IFn$_invoke$arity$3 = (function (this13189,long13190,java_time_temporal_TemporalUnit13191){
return this13189.minus(long13190,java_time_temporal_TemporalUnit13191);
}));

(cljc.java_time.local_date.minus.cljs$core$IFn$_invoke$arity$2 = (function (this13192,java_time_temporal_TemporalAmount13193){
return this13192.minus(java_time_temporal_TemporalAmount13193);
}));

(cljc.java_time.local_date.minus.cljs$lang$maxFixedArity = 3);

cljc.java_time.local_date.plus_days = (function cljc$java_time$local_date$plus_days(this13194,long13195){
return this13194.plusDays(long13195);
});
cljc.java_time.local_date.get_long = (function cljc$java_time$local_date$get_long(this13196,java_time_temporal_TemporalField13197){
return this13196.getLong(java_time_temporal_TemporalField13197);
});
cljc.java_time.local_date.with_year = (function cljc$java_time$local_date$with_year(this13198,int13199){
return this13198.withYear(int13199);
});
cljc.java_time.local_date.length_of_month = (function cljc$java_time$local_date$length_of_month(this13200){
return this13200.lengthOfMonth();
});
cljc.java_time.local_date.until = (function cljc$java_time$local_date$until(var_args){
var G__120786 = arguments.length;
switch (G__120786) {
case 2:
return cljc.java_time.local_date.until.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return cljc.java_time.local_date.until.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(cljc.java_time.local_date.until.cljs$core$IFn$_invoke$arity$2 = (function (this13201,java_time_chrono_ChronoLocalDate13202){
return this13201.until(java_time_chrono_ChronoLocalDate13202);
}));

(cljc.java_time.local_date.until.cljs$core$IFn$_invoke$arity$3 = (function (this13203,java_time_temporal_Temporal13204,java_time_temporal_TemporalUnit13205){
return this13203.until(java_time_temporal_Temporal13204,java_time_temporal_TemporalUnit13205);
}));

(cljc.java_time.local_date.until.cljs$lang$maxFixedArity = 3);

cljc.java_time.local_date.of_epoch_day = (function cljc$java_time$local_date$of_epoch_day(long13206){
return cljs.core.js_invoke.cljs$core$IFn$_invoke$arity$variadic(java.time.LocalDate,"ofEpochDay",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([long13206], 0));
});
cljc.java_time.local_date.with_day_of_month = (function cljc$java_time$local_date$with_day_of_month(this13207,int13208){
return this13207.withDayOfMonth(int13208);
});
cljc.java_time.local_date.get_day_of_month = (function cljc$java_time$local_date$get_day_of_month(this13209){
return this13209.dayOfMonth();
});
cljc.java_time.local_date.from = (function cljc$java_time$local_date$from(java_time_temporal_TemporalAccessor13210){
return cljs.core.js_invoke.cljs$core$IFn$_invoke$arity$variadic(java.time.LocalDate,"from",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([java_time_temporal_TemporalAccessor13210], 0));
});
cljc.java_time.local_date.is_after = (function cljc$java_time$local_date$is_after(this13211,java_time_chrono_ChronoLocalDate13212){
return this13211.isAfter(java_time_chrono_ChronoLocalDate13212);
});
cljc.java_time.local_date.is_supported = (function cljc$java_time$local_date$is_supported(this13213,G__13214){
return this13213.isSupported(G__13214);
});
cljc.java_time.local_date.minus_years = (function cljc$java_time$local_date$minus_years(this13215,long13216){
return this13215.minusYears(long13216);
});
cljc.java_time.local_date.get_chronology = (function cljc$java_time$local_date$get_chronology(this13217){
return this13217.chronology();
});
cljc.java_time.local_date.parse = (function cljc$java_time$local_date$parse(var_args){
var G__120794 = arguments.length;
switch (G__120794) {
case 2:
return cljc.java_time.local_date.parse.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 1:
return cljc.java_time.local_date.parse.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(cljc.java_time.local_date.parse.cljs$core$IFn$_invoke$arity$2 = (function (java_lang_CharSequence13218,java_time_format_DateTimeFormatter13219){
return cljs.core.js_invoke.cljs$core$IFn$_invoke$arity$variadic(java.time.LocalDate,"parse",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([java_lang_CharSequence13218,java_time_format_DateTimeFormatter13219], 0));
}));

(cljc.java_time.local_date.parse.cljs$core$IFn$_invoke$arity$1 = (function (java_lang_CharSequence13220){
return cljs.core.js_invoke.cljs$core$IFn$_invoke$arity$variadic(java.time.LocalDate,"parse",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([java_lang_CharSequence13220], 0));
}));

(cljc.java_time.local_date.parse.cljs$lang$maxFixedArity = 2);

cljc.java_time.local_date.hash_code = (function cljc$java_time$local_date$hash_code(this13221){
return this13221.hashCode();
});
cljc.java_time.local_date.adjust_into = (function cljc$java_time$local_date$adjust_into(this13222,java_time_temporal_Temporal13223){
return this13222.adjustInto(java_time_temporal_Temporal13223);
});
cljc.java_time.local_date.with$ = (function cljc$java_time$local_date$with(var_args){
var G__120796 = arguments.length;
switch (G__120796) {
case 3:
return cljc.java_time.local_date.with$.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
case 2:
return cljc.java_time.local_date.with$.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(cljc.java_time.local_date.with$.cljs$core$IFn$_invoke$arity$3 = (function (this13224,java_time_temporal_TemporalField13225,long13226){
return this13224.with(java_time_temporal_TemporalField13225,long13226);
}));

(cljc.java_time.local_date.with$.cljs$core$IFn$_invoke$arity$2 = (function (this13227,java_time_temporal_TemporalAdjuster13228){
return this13227.with(java_time_temporal_TemporalAdjuster13228);
}));

(cljc.java_time.local_date.with$.cljs$lang$maxFixedArity = 3);

cljc.java_time.local_date.now = (function cljc$java_time$local_date$now(var_args){
var G__120802 = arguments.length;
switch (G__120802) {
case 0:
return cljc.java_time.local_date.now.cljs$core$IFn$_invoke$arity$0();

break;
case 1:
return cljc.java_time.local_date.now.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(cljc.java_time.local_date.now.cljs$core$IFn$_invoke$arity$0 = (function (){
return cljs.core.js_invoke(java.time.LocalDate,"now");
}));

(cljc.java_time.local_date.now.cljs$core$IFn$_invoke$arity$1 = (function (G__13230){
return cljs.core.js_invoke.cljs$core$IFn$_invoke$arity$variadic(java.time.LocalDate,"now",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([G__13230], 0));
}));

(cljc.java_time.local_date.now.cljs$lang$maxFixedArity = 1);

cljc.java_time.local_date.at_start_of_day = (function cljc$java_time$local_date$at_start_of_day(var_args){
var G__120804 = arguments.length;
switch (G__120804) {
case 2:
return cljc.java_time.local_date.at_start_of_day.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 1:
return cljc.java_time.local_date.at_start_of_day.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(cljc.java_time.local_date.at_start_of_day.cljs$core$IFn$_invoke$arity$2 = (function (this13231,java_time_ZoneId13232){
return this13231.atStartOfDay(java_time_ZoneId13232);
}));

(cljc.java_time.local_date.at_start_of_day.cljs$core$IFn$_invoke$arity$1 = (function (this13233){
return this13233.atStartOfDay();
}));

(cljc.java_time.local_date.at_start_of_day.cljs$lang$maxFixedArity = 2);

cljc.java_time.local_date.get_month_value = (function cljc$java_time$local_date$get_month_value(this13234){
return this13234.monthValue();
});
cljc.java_time.local_date.with_day_of_year = (function cljc$java_time$local_date$with_day_of_year(this13235,int13236){
return this13235.withDayOfYear(int13236);
});
cljc.java_time.local_date.compare_to = (function cljc$java_time$local_date$compare_to(this13237,java_time_chrono_ChronoLocalDate13238){
return this13237.compareTo(java_time_chrono_ChronoLocalDate13238);
});
cljc.java_time.local_date.get_month = (function cljc$java_time$local_date$get_month(this13239){
return this13239.month();
});
cljc.java_time.local_date.of_year_day = (function cljc$java_time$local_date$of_year_day(int13240,int13241){
return cljs.core.js_invoke.cljs$core$IFn$_invoke$arity$variadic(java.time.LocalDate,"ofYearDay",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([int13240,int13241], 0));
});
cljc.java_time.local_date.get = (function cljc$java_time$local_date$get(this13242,java_time_temporal_TemporalField13243){
return this13242.get(java_time_temporal_TemporalField13243);
});
cljc.java_time.local_date.equals = (function cljc$java_time$local_date$equals(this13244,java_lang_Object13245){
return this13244.equals(java_lang_Object13245);
});
cljc.java_time.local_date.at_time = (function cljc$java_time$local_date$at_time(var_args){
var G__120808 = arguments.length;
switch (G__120808) {
case 2:
return cljc.java_time.local_date.at_time.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 4:
return cljc.java_time.local_date.at_time.cljs$core$IFn$_invoke$arity$4((arguments[(0)]),(arguments[(1)]),(arguments[(2)]),(arguments[(3)]));

break;
case 5:
return cljc.java_time.local_date.at_time.cljs$core$IFn$_invoke$arity$5((arguments[(0)]),(arguments[(1)]),(arguments[(2)]),(arguments[(3)]),(arguments[(4)]));

break;
case 3:
return cljc.java_time.local_date.at_time.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(cljc.java_time.local_date.at_time.cljs$core$IFn$_invoke$arity$2 = (function (this13246,G__13247){
return this13246.atTime(G__13247);
}));

(cljc.java_time.local_date.at_time.cljs$core$IFn$_invoke$arity$4 = (function (this13248,int13249,int13250,int13251){
return this13248.atTime(int13249,int13250,int13251);
}));

(cljc.java_time.local_date.at_time.cljs$core$IFn$_invoke$arity$5 = (function (this13252,int13253,int13254,int13255,int13256){
return this13252.atTime(int13253,int13254,int13255,int13256);
}));

(cljc.java_time.local_date.at_time.cljs$core$IFn$_invoke$arity$3 = (function (this13257,int13258,int13259){
return this13257.atTime(int13258,int13259);
}));

(cljc.java_time.local_date.at_time.cljs$lang$maxFixedArity = 5);

cljc.java_time.local_date.format = (function cljc$java_time$local_date$format(this13260,java_time_format_DateTimeFormatter13261){
return this13260.format(java_time_format_DateTimeFormatter13261);
});
cljc.java_time.local_date.plus_years = (function cljc$java_time$local_date$plus_years(this13262,long13263){
return this13262.plusYears(long13263);
});
cljc.java_time.local_date.minus_days = (function cljc$java_time$local_date$minus_days(this13264,long13265){
return this13264.minusDays(long13265);
});

//# sourceMappingURL=cljc.java_time.local_date.js.map
