goog.provide('cljc.java_time.local_date_time');
goog.scope(function(){
  cljc.java_time.local_date_time.goog$module$goog$object = goog.module.get('goog.object');
});
cljc.java_time.local_date_time.max = cljc.java_time.local_date_time.goog$module$goog$object.get(java.time.LocalDateTime,"MAX");
cljc.java_time.local_date_time.min = cljc.java_time.local_date_time.goog$module$goog$object.get(java.time.LocalDateTime,"MIN");
cljc.java_time.local_date_time.minus_minutes = (function cljc$java_time$local_date_time$minus_minutes(this13415,long13416){
return this13415.minusMinutes(long13416);
});
cljc.java_time.local_date_time.truncated_to = (function cljc$java_time$local_date_time$truncated_to(this13417,java_time_temporal_TemporalUnit13418){
return this13417.truncatedTo(java_time_temporal_TemporalUnit13418);
});
cljc.java_time.local_date_time.minus_weeks = (function cljc$java_time$local_date_time$minus_weeks(this13419,long13420){
return this13419.minusWeeks(long13420);
});
cljc.java_time.local_date_time.to_instant = (function cljc$java_time$local_date_time$to_instant(this13421,java_time_ZoneOffset13422){
return this13421.toInstant(java_time_ZoneOffset13422);
});
cljc.java_time.local_date_time.plus_weeks = (function cljc$java_time$local_date_time$plus_weeks(this13423,long13424){
return this13423.plusWeeks(long13424);
});
cljc.java_time.local_date_time.range = (function cljc$java_time$local_date_time$range(this13425,java_time_temporal_TemporalField13426){
return this13425.range(java_time_temporal_TemporalField13426);
});
cljc.java_time.local_date_time.of_epoch_second = (function cljc$java_time$local_date_time$of_epoch_second(long13427,int13428,java_time_ZoneOffset13429){
return cljs.core.js_invoke.cljs$core$IFn$_invoke$arity$variadic(java.time.LocalDateTime,"ofEpochSecond",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([long13427,int13428,java_time_ZoneOffset13429], 0));
});
cljc.java_time.local_date_time.get_hour = (function cljc$java_time$local_date_time$get_hour(this13430){
return this13430.hour();
});
cljc.java_time.local_date_time.at_offset = (function cljc$java_time$local_date_time$at_offset(this13431,java_time_ZoneOffset13432){
return this13431.atOffset(java_time_ZoneOffset13432);
});
cljc.java_time.local_date_time.minus_hours = (function cljc$java_time$local_date_time$minus_hours(this13433,long13434){
return this13433.minusHours(long13434);
});
cljc.java_time.local_date_time.of = (function cljc$java_time$local_date_time$of(var_args){
var G__120784 = arguments.length;
switch (G__120784) {
case 6:
return cljc.java_time.local_date_time.of.cljs$core$IFn$_invoke$arity$6((arguments[(0)]),(arguments[(1)]),(arguments[(2)]),(arguments[(3)]),(arguments[(4)]),(arguments[(5)]));

break;
case 7:
return cljc.java_time.local_date_time.of.cljs$core$IFn$_invoke$arity$7((arguments[(0)]),(arguments[(1)]),(arguments[(2)]),(arguments[(3)]),(arguments[(4)]),(arguments[(5)]),(arguments[(6)]));

break;
case 5:
return cljc.java_time.local_date_time.of.cljs$core$IFn$_invoke$arity$5((arguments[(0)]),(arguments[(1)]),(arguments[(2)]),(arguments[(3)]),(arguments[(4)]));

break;
case 2:
return cljc.java_time.local_date_time.of.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(cljc.java_time.local_date_time.of.cljs$core$IFn$_invoke$arity$6 = (function (G__13436,G__13437,G__13438,G__13439,G__13440,G__13441){
return cljs.core.js_invoke.cljs$core$IFn$_invoke$arity$variadic(java.time.LocalDateTime,"of",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([G__13436,G__13437,G__13438,G__13439,G__13440,G__13441], 0));
}));

(cljc.java_time.local_date_time.of.cljs$core$IFn$_invoke$arity$7 = (function (G__13443,G__13444,G__13445,G__13446,G__13447,G__13448,G__13449){
return cljs.core.js_invoke.cljs$core$IFn$_invoke$arity$variadic(java.time.LocalDateTime,"of",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([G__13443,G__13444,G__13445,G__13446,G__13447,G__13448,G__13449], 0));
}));

(cljc.java_time.local_date_time.of.cljs$core$IFn$_invoke$arity$5 = (function (G__13451,G__13452,G__13453,G__13454,G__13455){
return cljs.core.js_invoke.cljs$core$IFn$_invoke$arity$variadic(java.time.LocalDateTime,"of",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([G__13451,G__13452,G__13453,G__13454,G__13455], 0));
}));

(cljc.java_time.local_date_time.of.cljs$core$IFn$_invoke$arity$2 = (function (java_time_LocalDate13456,java_time_LocalTime13457){
return cljs.core.js_invoke.cljs$core$IFn$_invoke$arity$variadic(java.time.LocalDateTime,"of",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([java_time_LocalDate13456,java_time_LocalTime13457], 0));
}));

(cljc.java_time.local_date_time.of.cljs$lang$maxFixedArity = 7);

cljc.java_time.local_date_time.with_month = (function cljc$java_time$local_date_time$with_month(this13458,int13459){
return this13458.withMonth(int13459);
});
cljc.java_time.local_date_time.is_equal = (function cljc$java_time$local_date_time$is_equal(this13460,java_time_chrono_ChronoLocalDateTime13461){
return this13460.isEqual(java_time_chrono_ChronoLocalDateTime13461);
});
cljc.java_time.local_date_time.get_nano = (function cljc$java_time$local_date_time$get_nano(this13462){
return this13462.nano();
});
cljc.java_time.local_date_time.get_year = (function cljc$java_time$local_date_time$get_year(this13463){
return this13463.year();
});
cljc.java_time.local_date_time.minus_seconds = (function cljc$java_time$local_date_time$minus_seconds(this13464,long13465){
return this13464.minusSeconds(long13465);
});
cljc.java_time.local_date_time.get_second = (function cljc$java_time$local_date_time$get_second(this13466){
return this13466.second();
});
cljc.java_time.local_date_time.plus_nanos = (function cljc$java_time$local_date_time$plus_nanos(this13467,long13468){
return this13467.plusNanos(long13468);
});
cljc.java_time.local_date_time.get_day_of_year = (function cljc$java_time$local_date_time$get_day_of_year(this13469){
return this13469.dayOfYear();
});
cljc.java_time.local_date_time.plus = (function cljc$java_time$local_date_time$plus(var_args){
var G__120792 = arguments.length;
switch (G__120792) {
case 2:
return cljc.java_time.local_date_time.plus.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return cljc.java_time.local_date_time.plus.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(cljc.java_time.local_date_time.plus.cljs$core$IFn$_invoke$arity$2 = (function (this13470,java_time_temporal_TemporalAmount13471){
return this13470.plus(java_time_temporal_TemporalAmount13471);
}));

(cljc.java_time.local_date_time.plus.cljs$core$IFn$_invoke$arity$3 = (function (this13472,long13473,java_time_temporal_TemporalUnit13474){
return this13472.plus(long13473,java_time_temporal_TemporalUnit13474);
}));

(cljc.java_time.local_date_time.plus.cljs$lang$maxFixedArity = 3);

cljc.java_time.local_date_time.with_hour = (function cljc$java_time$local_date_time$with_hour(this13475,int13476){
return this13475.withHour(int13476);
});
cljc.java_time.local_date_time.with_minute = (function cljc$java_time$local_date_time$with_minute(this13477,int13478){
return this13477.withMinute(int13478);
});
cljc.java_time.local_date_time.plus_minutes = (function cljc$java_time$local_date_time$plus_minutes(this13479,long13480){
return this13479.plusMinutes(long13480);
});
cljc.java_time.local_date_time.query = (function cljc$java_time$local_date_time$query(this13481,java_time_temporal_TemporalQuery13482){
return this13481.query(java_time_temporal_TemporalQuery13482);
});
cljc.java_time.local_date_time.get_day_of_week = (function cljc$java_time$local_date_time$get_day_of_week(this13483){
return this13483.dayOfWeek();
});
cljc.java_time.local_date_time.to_string = (function cljc$java_time$local_date_time$to_string(this13484){
return this13484.toString();
});
cljc.java_time.local_date_time.plus_months = (function cljc$java_time$local_date_time$plus_months(this13485,long13486){
return this13485.plusMonths(long13486);
});
cljc.java_time.local_date_time.is_before = (function cljc$java_time$local_date_time$is_before(this13487,java_time_chrono_ChronoLocalDateTime13488){
return this13487.isBefore(java_time_chrono_ChronoLocalDateTime13488);
});
cljc.java_time.local_date_time.minus_months = (function cljc$java_time$local_date_time$minus_months(this13489,long13490){
return this13489.minusMonths(long13490);
});
cljc.java_time.local_date_time.minus = (function cljc$java_time$local_date_time$minus(var_args){
var G__120800 = arguments.length;
switch (G__120800) {
case 3:
return cljc.java_time.local_date_time.minus.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
case 2:
return cljc.java_time.local_date_time.minus.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(cljc.java_time.local_date_time.minus.cljs$core$IFn$_invoke$arity$3 = (function (this13491,long13492,java_time_temporal_TemporalUnit13493){
return this13491.minus(long13492,java_time_temporal_TemporalUnit13493);
}));

(cljc.java_time.local_date_time.minus.cljs$core$IFn$_invoke$arity$2 = (function (this13494,java_time_temporal_TemporalAmount13495){
return this13494.minus(java_time_temporal_TemporalAmount13495);
}));

(cljc.java_time.local_date_time.minus.cljs$lang$maxFixedArity = 3);

cljc.java_time.local_date_time.at_zone = (function cljc$java_time$local_date_time$at_zone(this13496,java_time_ZoneId13497){
return this13496.atZone(java_time_ZoneId13497);
});
cljc.java_time.local_date_time.plus_hours = (function cljc$java_time$local_date_time$plus_hours(this13498,long13499){
return this13498.plusHours(long13499);
});
cljc.java_time.local_date_time.plus_days = (function cljc$java_time$local_date_time$plus_days(this13500,long13501){
return this13500.plusDays(long13501);
});
cljc.java_time.local_date_time.to_local_time = (function cljc$java_time$local_date_time$to_local_time(this13502){
return this13502.toLocalTime();
});
cljc.java_time.local_date_time.get_long = (function cljc$java_time$local_date_time$get_long(this13503,java_time_temporal_TemporalField13504){
return this13503.getLong(java_time_temporal_TemporalField13504);
});
cljc.java_time.local_date_time.with_year = (function cljc$java_time$local_date_time$with_year(this13505,int13506){
return this13505.withYear(int13506);
});
cljc.java_time.local_date_time.with_nano = (function cljc$java_time$local_date_time$with_nano(this13507,int13508){
return this13507.withNano(int13508);
});
cljc.java_time.local_date_time.to_epoch_second = (function cljc$java_time$local_date_time$to_epoch_second(this13509,java_time_ZoneOffset13510){
return this13509.toEpochSecond(java_time_ZoneOffset13510);
});
cljc.java_time.local_date_time.until = (function cljc$java_time$local_date_time$until(this13511,java_time_temporal_Temporal13512,java_time_temporal_TemporalUnit13513){
return this13511.until(java_time_temporal_Temporal13512,java_time_temporal_TemporalUnit13513);
});
cljc.java_time.local_date_time.with_day_of_month = (function cljc$java_time$local_date_time$with_day_of_month(this13514,int13515){
return this13514.withDayOfMonth(int13515);
});
cljc.java_time.local_date_time.get_day_of_month = (function cljc$java_time$local_date_time$get_day_of_month(this13516){
return this13516.dayOfMonth();
});
cljc.java_time.local_date_time.from = (function cljc$java_time$local_date_time$from(java_time_temporal_TemporalAccessor13517){
return cljs.core.js_invoke.cljs$core$IFn$_invoke$arity$variadic(java.time.LocalDateTime,"from",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([java_time_temporal_TemporalAccessor13517], 0));
});
cljc.java_time.local_date_time.is_after = (function cljc$java_time$local_date_time$is_after(this13518,java_time_chrono_ChronoLocalDateTime13519){
return this13518.isAfter(java_time_chrono_ChronoLocalDateTime13519);
});
cljc.java_time.local_date_time.minus_nanos = (function cljc$java_time$local_date_time$minus_nanos(this13520,long13521){
return this13520.minusNanos(long13521);
});
cljc.java_time.local_date_time.is_supported = (function cljc$java_time$local_date_time$is_supported(this13522,G__13523){
return this13522.isSupported(G__13523);
});
cljc.java_time.local_date_time.minus_years = (function cljc$java_time$local_date_time$minus_years(this13524,long13525){
return this13524.minusYears(long13525);
});
cljc.java_time.local_date_time.get_chronology = (function cljc$java_time$local_date_time$get_chronology(this13526){
return this13526.chronology();
});
cljc.java_time.local_date_time.parse = (function cljc$java_time$local_date_time$parse(var_args){
var G__120812 = arguments.length;
switch (G__120812) {
case 2:
return cljc.java_time.local_date_time.parse.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 1:
return cljc.java_time.local_date_time.parse.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(cljc.java_time.local_date_time.parse.cljs$core$IFn$_invoke$arity$2 = (function (java_lang_CharSequence13527,java_time_format_DateTimeFormatter13528){
return cljs.core.js_invoke.cljs$core$IFn$_invoke$arity$variadic(java.time.LocalDateTime,"parse",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([java_lang_CharSequence13527,java_time_format_DateTimeFormatter13528], 0));
}));

(cljc.java_time.local_date_time.parse.cljs$core$IFn$_invoke$arity$1 = (function (java_lang_CharSequence13529){
return cljs.core.js_invoke.cljs$core$IFn$_invoke$arity$variadic(java.time.LocalDateTime,"parse",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([java_lang_CharSequence13529], 0));
}));

(cljc.java_time.local_date_time.parse.cljs$lang$maxFixedArity = 2);

cljc.java_time.local_date_time.with_second = (function cljc$java_time$local_date_time$with_second(this13530,int13531){
return this13530.withSecond(int13531);
});
cljc.java_time.local_date_time.to_local_date = (function cljc$java_time$local_date_time$to_local_date(this13532){
return this13532.toLocalDate();
});
cljc.java_time.local_date_time.get_minute = (function cljc$java_time$local_date_time$get_minute(this13533){
return this13533.minute();
});
cljc.java_time.local_date_time.hash_code = (function cljc$java_time$local_date_time$hash_code(this13534){
return this13534.hashCode();
});
cljc.java_time.local_date_time.adjust_into = (function cljc$java_time$local_date_time$adjust_into(this13535,java_time_temporal_Temporal13536){
return this13535.adjustInto(java_time_temporal_Temporal13536);
});
cljc.java_time.local_date_time.with$ = (function cljc$java_time$local_date_time$with(var_args){
var G__120818 = arguments.length;
switch (G__120818) {
case 3:
return cljc.java_time.local_date_time.with$.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
case 2:
return cljc.java_time.local_date_time.with$.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(cljc.java_time.local_date_time.with$.cljs$core$IFn$_invoke$arity$3 = (function (this13537,java_time_temporal_TemporalField13538,long13539){
return this13537.with(java_time_temporal_TemporalField13538,long13539);
}));

(cljc.java_time.local_date_time.with$.cljs$core$IFn$_invoke$arity$2 = (function (this13540,java_time_temporal_TemporalAdjuster13541){
return this13540.with(java_time_temporal_TemporalAdjuster13541);
}));

(cljc.java_time.local_date_time.with$.cljs$lang$maxFixedArity = 3);

cljc.java_time.local_date_time.now = (function cljc$java_time$local_date_time$now(var_args){
var G__120821 = arguments.length;
switch (G__120821) {
case 0:
return cljc.java_time.local_date_time.now.cljs$core$IFn$_invoke$arity$0();

break;
case 1:
return cljc.java_time.local_date_time.now.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(cljc.java_time.local_date_time.now.cljs$core$IFn$_invoke$arity$0 = (function (){
return cljs.core.js_invoke(java.time.LocalDateTime,"now");
}));

(cljc.java_time.local_date_time.now.cljs$core$IFn$_invoke$arity$1 = (function (G__13543){
return cljs.core.js_invoke.cljs$core$IFn$_invoke$arity$variadic(java.time.LocalDateTime,"now",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([G__13543], 0));
}));

(cljc.java_time.local_date_time.now.cljs$lang$maxFixedArity = 1);

cljc.java_time.local_date_time.get_month_value = (function cljc$java_time$local_date_time$get_month_value(this13544){
return this13544.monthValue();
});
cljc.java_time.local_date_time.with_day_of_year = (function cljc$java_time$local_date_time$with_day_of_year(this13545,int13546){
return this13545.withDayOfYear(int13546);
});
cljc.java_time.local_date_time.compare_to = (function cljc$java_time$local_date_time$compare_to(this13547,java_time_chrono_ChronoLocalDateTime13548){
return this13547.compareTo(java_time_chrono_ChronoLocalDateTime13548);
});
cljc.java_time.local_date_time.get_month = (function cljc$java_time$local_date_time$get_month(this13549){
return this13549.month();
});
cljc.java_time.local_date_time.of_instant = (function cljc$java_time$local_date_time$of_instant(java_time_Instant13550,java_time_ZoneId13551){
return cljs.core.js_invoke.cljs$core$IFn$_invoke$arity$variadic(java.time.LocalDateTime,"ofInstant",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([java_time_Instant13550,java_time_ZoneId13551], 0));
});
cljc.java_time.local_date_time.plus_seconds = (function cljc$java_time$local_date_time$plus_seconds(this13552,long13553){
return this13552.plusSeconds(long13553);
});
cljc.java_time.local_date_time.get = (function cljc$java_time$local_date_time$get(this13554,java_time_temporal_TemporalField13555){
return this13554.get(java_time_temporal_TemporalField13555);
});
cljc.java_time.local_date_time.equals = (function cljc$java_time$local_date_time$equals(this13556,java_lang_Object13557){
return this13556.equals(java_lang_Object13557);
});
cljc.java_time.local_date_time.format = (function cljc$java_time$local_date_time$format(this13558,java_time_format_DateTimeFormatter13559){
return this13558.format(java_time_format_DateTimeFormatter13559);
});
cljc.java_time.local_date_time.plus_years = (function cljc$java_time$local_date_time$plus_years(this13560,long13561){
return this13560.plusYears(long13561);
});
cljc.java_time.local_date_time.minus_days = (function cljc$java_time$local_date_time$minus_days(this13562,long13563){
return this13562.minusDays(long13563);
});

//# sourceMappingURL=cljc.java_time.local_date_time.js.map
