goog.provide('cljc.java_time.zoned_date_time');
goog.scope(function(){
  cljc.java_time.zoned_date_time.goog$module$goog$object = goog.module.get('goog.object');
});
cljc.java_time.zoned_date_time.minus_minutes = (function cljc$java_time$zoned_date_time$minus_minutes(this13712,long13713){
return this13712.minusMinutes(long13713);
});
cljc.java_time.zoned_date_time.truncated_to = (function cljc$java_time$zoned_date_time$truncated_to(this13714,java_time_temporal_TemporalUnit13715){
return this13714.truncatedTo(java_time_temporal_TemporalUnit13715);
});
cljc.java_time.zoned_date_time.minus_weeks = (function cljc$java_time$zoned_date_time$minus_weeks(this13716,long13717){
return this13716.minusWeeks(long13717);
});
cljc.java_time.zoned_date_time.to_instant = (function cljc$java_time$zoned_date_time$to_instant(this13718){
return this13718.toInstant();
});
cljc.java_time.zoned_date_time.plus_weeks = (function cljc$java_time$zoned_date_time$plus_weeks(this13719,long13720){
return this13719.plusWeeks(long13720);
});
cljc.java_time.zoned_date_time.range = (function cljc$java_time$zoned_date_time$range(this13721,java_time_temporal_TemporalField13722){
return this13721.range(java_time_temporal_TemporalField13722);
});
cljc.java_time.zoned_date_time.with_earlier_offset_at_overlap = (function cljc$java_time$zoned_date_time$with_earlier_offset_at_overlap(this13723){
return this13723.withEarlierOffsetAtOverlap();
});
cljc.java_time.zoned_date_time.get_hour = (function cljc$java_time$zoned_date_time$get_hour(this13724){
return this13724.hour();
});
cljc.java_time.zoned_date_time.minus_hours = (function cljc$java_time$zoned_date_time$minus_hours(this13725,long13726){
return this13725.minusHours(long13726);
});
cljc.java_time.zoned_date_time.of = (function cljc$java_time$zoned_date_time$of(var_args){
var G__115544 = arguments.length;
switch (G__115544) {
case 8:
return cljc.java_time.zoned_date_time.of.cljs$core$IFn$_invoke$arity$8((arguments[(0)]),(arguments[(1)]),(arguments[(2)]),(arguments[(3)]),(arguments[(4)]),(arguments[(5)]),(arguments[(6)]),(arguments[(7)]));

break;
case 3:
return cljc.java_time.zoned_date_time.of.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
case 2:
return cljc.java_time.zoned_date_time.of.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(cljc.java_time.zoned_date_time.of.cljs$core$IFn$_invoke$arity$8 = (function (int13727,int13728,int13729,int13730,int13731,int13732,int13733,java_time_ZoneId13734){
return cljs.core.js_invoke.cljs$core$IFn$_invoke$arity$variadic(java.time.ZonedDateTime,"of",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([int13727,int13728,int13729,int13730,int13731,int13732,int13733,java_time_ZoneId13734], 0));
}));

(cljc.java_time.zoned_date_time.of.cljs$core$IFn$_invoke$arity$3 = (function (java_time_LocalDate13735,java_time_LocalTime13736,java_time_ZoneId13737){
return cljs.core.js_invoke.cljs$core$IFn$_invoke$arity$variadic(java.time.ZonedDateTime,"of",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([java_time_LocalDate13735,java_time_LocalTime13736,java_time_ZoneId13737], 0));
}));

(cljc.java_time.zoned_date_time.of.cljs$core$IFn$_invoke$arity$2 = (function (java_time_LocalDateTime13738,java_time_ZoneId13739){
return cljs.core.js_invoke.cljs$core$IFn$_invoke$arity$variadic(java.time.ZonedDateTime,"of",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([java_time_LocalDateTime13738,java_time_ZoneId13739], 0));
}));

(cljc.java_time.zoned_date_time.of.cljs$lang$maxFixedArity = 8);

cljc.java_time.zoned_date_time.with_month = (function cljc$java_time$zoned_date_time$with_month(this13740,int13741){
return this13740.withMonth(int13741);
});
cljc.java_time.zoned_date_time.is_equal = (function cljc$java_time$zoned_date_time$is_equal(this13742,java_time_chrono_ChronoZonedDateTime13743){
return this13742.isEqual(java_time_chrono_ChronoZonedDateTime13743);
});
cljc.java_time.zoned_date_time.get_nano = (function cljc$java_time$zoned_date_time$get_nano(this13744){
return this13744.nano();
});
cljc.java_time.zoned_date_time.of_local = (function cljc$java_time$zoned_date_time$of_local(java_time_LocalDateTime13745,java_time_ZoneId13746,java_time_ZoneOffset13747){
return cljs.core.js_invoke.cljs$core$IFn$_invoke$arity$variadic(java.time.ZonedDateTime,"ofLocal",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([java_time_LocalDateTime13745,java_time_ZoneId13746,java_time_ZoneOffset13747], 0));
});
cljc.java_time.zoned_date_time.get_year = (function cljc$java_time$zoned_date_time$get_year(this13748){
return this13748.year();
});
cljc.java_time.zoned_date_time.minus_seconds = (function cljc$java_time$zoned_date_time$minus_seconds(this13749,long13750){
return this13749.minusSeconds(long13750);
});
cljc.java_time.zoned_date_time.get_second = (function cljc$java_time$zoned_date_time$get_second(this13751){
return this13751.second();
});
cljc.java_time.zoned_date_time.plus_nanos = (function cljc$java_time$zoned_date_time$plus_nanos(this13752,long13753){
return this13752.plusNanos(long13753);
});
cljc.java_time.zoned_date_time.get_day_of_year = (function cljc$java_time$zoned_date_time$get_day_of_year(this13754){
return this13754.dayOfYear();
});
cljc.java_time.zoned_date_time.plus = (function cljc$java_time$zoned_date_time$plus(var_args){
var G__115546 = arguments.length;
switch (G__115546) {
case 2:
return cljc.java_time.zoned_date_time.plus.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return cljc.java_time.zoned_date_time.plus.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(cljc.java_time.zoned_date_time.plus.cljs$core$IFn$_invoke$arity$2 = (function (this13755,java_time_temporal_TemporalAmount13756){
return this13755.plus(java_time_temporal_TemporalAmount13756);
}));

(cljc.java_time.zoned_date_time.plus.cljs$core$IFn$_invoke$arity$3 = (function (this13757,long13758,java_time_temporal_TemporalUnit13759){
return this13757.plus(long13758,java_time_temporal_TemporalUnit13759);
}));

(cljc.java_time.zoned_date_time.plus.cljs$lang$maxFixedArity = 3);

cljc.java_time.zoned_date_time.with_hour = (function cljc$java_time$zoned_date_time$with_hour(this13760,int13761){
return this13760.withHour(int13761);
});
cljc.java_time.zoned_date_time.with_minute = (function cljc$java_time$zoned_date_time$with_minute(this13762,int13763){
return this13762.withMinute(int13763);
});
cljc.java_time.zoned_date_time.plus_minutes = (function cljc$java_time$zoned_date_time$plus_minutes(this13764,long13765){
return this13764.plusMinutes(long13765);
});
cljc.java_time.zoned_date_time.query = (function cljc$java_time$zoned_date_time$query(this13766,java_time_temporal_TemporalQuery13767){
return this13766.query(java_time_temporal_TemporalQuery13767);
});
cljc.java_time.zoned_date_time.get_day_of_week = (function cljc$java_time$zoned_date_time$get_day_of_week(this13768){
return this13768.dayOfWeek();
});
cljc.java_time.zoned_date_time.to_string = (function cljc$java_time$zoned_date_time$to_string(this13769){
return this13769.toString();
});
cljc.java_time.zoned_date_time.plus_months = (function cljc$java_time$zoned_date_time$plus_months(this13770,long13771){
return this13770.plusMonths(long13771);
});
cljc.java_time.zoned_date_time.is_before = (function cljc$java_time$zoned_date_time$is_before(this13772,java_time_chrono_ChronoZonedDateTime13773){
return this13772.isBefore(java_time_chrono_ChronoZonedDateTime13773);
});
cljc.java_time.zoned_date_time.minus_months = (function cljc$java_time$zoned_date_time$minus_months(this13774,long13775){
return this13774.minusMonths(long13775);
});
cljc.java_time.zoned_date_time.minus = (function cljc$java_time$zoned_date_time$minus(var_args){
var G__115550 = arguments.length;
switch (G__115550) {
case 3:
return cljc.java_time.zoned_date_time.minus.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
case 2:
return cljc.java_time.zoned_date_time.minus.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(cljc.java_time.zoned_date_time.minus.cljs$core$IFn$_invoke$arity$3 = (function (this13776,long13777,java_time_temporal_TemporalUnit13778){
return this13776.minus(long13777,java_time_temporal_TemporalUnit13778);
}));

(cljc.java_time.zoned_date_time.minus.cljs$core$IFn$_invoke$arity$2 = (function (this13779,java_time_temporal_TemporalAmount13780){
return this13779.minus(java_time_temporal_TemporalAmount13780);
}));

(cljc.java_time.zoned_date_time.minus.cljs$lang$maxFixedArity = 3);

cljc.java_time.zoned_date_time.with_fixed_offset_zone = (function cljc$java_time$zoned_date_time$with_fixed_offset_zone(this13781){
return this13781.withFixedOffsetZone();
});
cljc.java_time.zoned_date_time.plus_hours = (function cljc$java_time$zoned_date_time$plus_hours(this13782,long13783){
return this13782.plusHours(long13783);
});
cljc.java_time.zoned_date_time.with_zone_same_local = (function cljc$java_time$zoned_date_time$with_zone_same_local(this13784,java_time_ZoneId13785){
return this13784.withZoneSameLocal(java_time_ZoneId13785);
});
cljc.java_time.zoned_date_time.with_zone_same_instant = (function cljc$java_time$zoned_date_time$with_zone_same_instant(this13786,java_time_ZoneId13787){
return this13786.withZoneSameInstant(java_time_ZoneId13787);
});
cljc.java_time.zoned_date_time.plus_days = (function cljc$java_time$zoned_date_time$plus_days(this13788,long13789){
return this13788.plusDays(long13789);
});
cljc.java_time.zoned_date_time.to_local_time = (function cljc$java_time$zoned_date_time$to_local_time(this13790){
return this13790.toLocalTime();
});
cljc.java_time.zoned_date_time.get_long = (function cljc$java_time$zoned_date_time$get_long(this13791,java_time_temporal_TemporalField13792){
return this13791.getLong(java_time_temporal_TemporalField13792);
});
cljc.java_time.zoned_date_time.get_offset = (function cljc$java_time$zoned_date_time$get_offset(this13793){
return this13793.offset();
});
cljc.java_time.zoned_date_time.with_year = (function cljc$java_time$zoned_date_time$with_year(this13794,int13795){
return this13794.withYear(int13795);
});
cljc.java_time.zoned_date_time.with_nano = (function cljc$java_time$zoned_date_time$with_nano(this13796,int13797){
return this13796.withNano(int13797);
});
cljc.java_time.zoned_date_time.to_epoch_second = (function cljc$java_time$zoned_date_time$to_epoch_second(this13798){
return this13798.toEpochSecond();
});
cljc.java_time.zoned_date_time.to_offset_date_time = (function cljc$java_time$zoned_date_time$to_offset_date_time(this13799){
return this13799.toOffsetDateTime();
});
cljc.java_time.zoned_date_time.with_later_offset_at_overlap = (function cljc$java_time$zoned_date_time$with_later_offset_at_overlap(this13800){
return this13800.withLaterOffsetAtOverlap();
});
cljc.java_time.zoned_date_time.until = (function cljc$java_time$zoned_date_time$until(this13801,java_time_temporal_Temporal13802,java_time_temporal_TemporalUnit13803){
return this13801.until(java_time_temporal_Temporal13802,java_time_temporal_TemporalUnit13803);
});
cljc.java_time.zoned_date_time.get_zone = (function cljc$java_time$zoned_date_time$get_zone(this13804){
return this13804.zone();
});
cljc.java_time.zoned_date_time.with_day_of_month = (function cljc$java_time$zoned_date_time$with_day_of_month(this13805,int13806){
return this13805.withDayOfMonth(int13806);
});
cljc.java_time.zoned_date_time.get_day_of_month = (function cljc$java_time$zoned_date_time$get_day_of_month(this13807){
return this13807.dayOfMonth();
});
cljc.java_time.zoned_date_time.from = (function cljc$java_time$zoned_date_time$from(java_time_temporal_TemporalAccessor13808){
return cljs.core.js_invoke.cljs$core$IFn$_invoke$arity$variadic(java.time.ZonedDateTime,"from",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([java_time_temporal_TemporalAccessor13808], 0));
});
cljc.java_time.zoned_date_time.is_after = (function cljc$java_time$zoned_date_time$is_after(this13809,java_time_chrono_ChronoZonedDateTime13810){
return this13809.isAfter(java_time_chrono_ChronoZonedDateTime13810);
});
cljc.java_time.zoned_date_time.minus_nanos = (function cljc$java_time$zoned_date_time$minus_nanos(this13811,long13812){
return this13811.minusNanos(long13812);
});
cljc.java_time.zoned_date_time.is_supported = (function cljc$java_time$zoned_date_time$is_supported(this13813,G__13814){
return this13813.isSupported(G__13814);
});
cljc.java_time.zoned_date_time.minus_years = (function cljc$java_time$zoned_date_time$minus_years(this13815,long13816){
return this13815.minusYears(long13816);
});
cljc.java_time.zoned_date_time.get_chronology = (function cljc$java_time$zoned_date_time$get_chronology(this13817){
return this13817.chronology();
});
cljc.java_time.zoned_date_time.parse = (function cljc$java_time$zoned_date_time$parse(var_args){
var G__115608 = arguments.length;
switch (G__115608) {
case 1:
return cljc.java_time.zoned_date_time.parse.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return cljc.java_time.zoned_date_time.parse.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(cljc.java_time.zoned_date_time.parse.cljs$core$IFn$_invoke$arity$1 = (function (java_lang_CharSequence13818){
return cljs.core.js_invoke.cljs$core$IFn$_invoke$arity$variadic(java.time.ZonedDateTime,"parse",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([java_lang_CharSequence13818], 0));
}));

(cljc.java_time.zoned_date_time.parse.cljs$core$IFn$_invoke$arity$2 = (function (java_lang_CharSequence13819,java_time_format_DateTimeFormatter13820){
return cljs.core.js_invoke.cljs$core$IFn$_invoke$arity$variadic(java.time.ZonedDateTime,"parse",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([java_lang_CharSequence13819,java_time_format_DateTimeFormatter13820], 0));
}));

(cljc.java_time.zoned_date_time.parse.cljs$lang$maxFixedArity = 2);

cljc.java_time.zoned_date_time.with_second = (function cljc$java_time$zoned_date_time$with_second(this13821,int13822){
return this13821.withSecond(int13822);
});
cljc.java_time.zoned_date_time.to_local_date = (function cljc$java_time$zoned_date_time$to_local_date(this13823){
return this13823.toLocalDate();
});
cljc.java_time.zoned_date_time.get_minute = (function cljc$java_time$zoned_date_time$get_minute(this13824){
return this13824.minute();
});
cljc.java_time.zoned_date_time.hash_code = (function cljc$java_time$zoned_date_time$hash_code(this13825){
return this13825.hashCode();
});
cljc.java_time.zoned_date_time.with$ = (function cljc$java_time$zoned_date_time$with(var_args){
var G__115658 = arguments.length;
switch (G__115658) {
case 3:
return cljc.java_time.zoned_date_time.with$.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
case 2:
return cljc.java_time.zoned_date_time.with$.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(cljc.java_time.zoned_date_time.with$.cljs$core$IFn$_invoke$arity$3 = (function (this13826,java_time_temporal_TemporalField13827,long13828){
return this13826.with(java_time_temporal_TemporalField13827,long13828);
}));

(cljc.java_time.zoned_date_time.with$.cljs$core$IFn$_invoke$arity$2 = (function (this13829,java_time_temporal_TemporalAdjuster13830){
return this13829.with(java_time_temporal_TemporalAdjuster13830);
}));

(cljc.java_time.zoned_date_time.with$.cljs$lang$maxFixedArity = 3);

cljc.java_time.zoned_date_time.now = (function cljc$java_time$zoned_date_time$now(var_args){
var G__115665 = arguments.length;
switch (G__115665) {
case 0:
return cljc.java_time.zoned_date_time.now.cljs$core$IFn$_invoke$arity$0();

break;
case 1:
return cljc.java_time.zoned_date_time.now.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(cljc.java_time.zoned_date_time.now.cljs$core$IFn$_invoke$arity$0 = (function (){
return cljs.core.js_invoke(java.time.ZonedDateTime,"now");
}));

(cljc.java_time.zoned_date_time.now.cljs$core$IFn$_invoke$arity$1 = (function (G__13832){
return cljs.core.js_invoke.cljs$core$IFn$_invoke$arity$variadic(java.time.ZonedDateTime,"now",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([G__13832], 0));
}));

(cljc.java_time.zoned_date_time.now.cljs$lang$maxFixedArity = 1);

cljc.java_time.zoned_date_time.to_local_date_time = (function cljc$java_time$zoned_date_time$to_local_date_time(this13833){
return this13833.toLocalDateTime();
});
cljc.java_time.zoned_date_time.get_month_value = (function cljc$java_time$zoned_date_time$get_month_value(this13834){
return this13834.monthValue();
});
cljc.java_time.zoned_date_time.with_day_of_year = (function cljc$java_time$zoned_date_time$with_day_of_year(this13835,int13836){
return this13835.withDayOfYear(int13836);
});
cljc.java_time.zoned_date_time.compare_to = (function cljc$java_time$zoned_date_time$compare_to(this13837,java_time_chrono_ChronoZonedDateTime13838){
return this13837.compareTo(java_time_chrono_ChronoZonedDateTime13838);
});
cljc.java_time.zoned_date_time.of_strict = (function cljc$java_time$zoned_date_time$of_strict(java_time_LocalDateTime13839,java_time_ZoneOffset13840,java_time_ZoneId13841){
return cljs.core.js_invoke.cljs$core$IFn$_invoke$arity$variadic(java.time.ZonedDateTime,"ofStrict",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([java_time_LocalDateTime13839,java_time_ZoneOffset13840,java_time_ZoneId13841], 0));
});
cljc.java_time.zoned_date_time.get_month = (function cljc$java_time$zoned_date_time$get_month(this13842){
return this13842.month();
});
cljc.java_time.zoned_date_time.of_instant = (function cljc$java_time$zoned_date_time$of_instant(var_args){
var G__115705 = arguments.length;
switch (G__115705) {
case 2:
return cljc.java_time.zoned_date_time.of_instant.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return cljc.java_time.zoned_date_time.of_instant.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(cljc.java_time.zoned_date_time.of_instant.cljs$core$IFn$_invoke$arity$2 = (function (java_time_Instant13843,java_time_ZoneId13844){
return cljs.core.js_invoke.cljs$core$IFn$_invoke$arity$variadic(java.time.ZonedDateTime,"ofInstant",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([java_time_Instant13843,java_time_ZoneId13844], 0));
}));

(cljc.java_time.zoned_date_time.of_instant.cljs$core$IFn$_invoke$arity$3 = (function (java_time_LocalDateTime13845,java_time_ZoneOffset13846,java_time_ZoneId13847){
return cljs.core.js_invoke.cljs$core$IFn$_invoke$arity$variadic(java.time.ZonedDateTime,"ofInstant",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([java_time_LocalDateTime13845,java_time_ZoneOffset13846,java_time_ZoneId13847], 0));
}));

(cljc.java_time.zoned_date_time.of_instant.cljs$lang$maxFixedArity = 3);

cljc.java_time.zoned_date_time.plus_seconds = (function cljc$java_time$zoned_date_time$plus_seconds(this13848,long13849){
return this13848.plusSeconds(long13849);
});
cljc.java_time.zoned_date_time.get = (function cljc$java_time$zoned_date_time$get(this13850,java_time_temporal_TemporalField13851){
return this13850.get(java_time_temporal_TemporalField13851);
});
cljc.java_time.zoned_date_time.equals = (function cljc$java_time$zoned_date_time$equals(this13852,java_lang_Object13853){
return this13852.equals(java_lang_Object13853);
});
cljc.java_time.zoned_date_time.format = (function cljc$java_time$zoned_date_time$format(this13854,java_time_format_DateTimeFormatter13855){
return this13854.format(java_time_format_DateTimeFormatter13855);
});
cljc.java_time.zoned_date_time.plus_years = (function cljc$java_time$zoned_date_time$plus_years(this13856,long13857){
return this13856.plusYears(long13857);
});
cljc.java_time.zoned_date_time.minus_days = (function cljc$java_time$zoned_date_time$minus_days(this13858,long13859){
return this13858.minusDays(long13859);
});

//# sourceMappingURL=cljc.java_time.zoned_date_time.js.map
