goog.provide('cljc.java_time.offset_date_time');
goog.scope(function(){
  cljc.java_time.offset_date_time.goog$module$goog$object = goog.module.get('goog.object');
});
cljc.java_time.offset_date_time.min = cljc.java_time.offset_date_time.goog$module$goog$object.get(java.time.OffsetDateTime,"MIN");
cljc.java_time.offset_date_time.max = cljc.java_time.offset_date_time.goog$module$goog$object.get(java.time.OffsetDateTime,"MAX");
cljc.java_time.offset_date_time.minus_minutes = (function cljc$java_time$offset_date_time$minus_minutes(this14331,long14332){
return this14331.minusMinutes(long14332);
});
cljc.java_time.offset_date_time.truncated_to = (function cljc$java_time$offset_date_time$truncated_to(this14333,java_time_temporal_TemporalUnit14334){
return this14333.truncatedTo(java_time_temporal_TemporalUnit14334);
});
cljc.java_time.offset_date_time.minus_weeks = (function cljc$java_time$offset_date_time$minus_weeks(this14335,long14336){
return this14335.minusWeeks(long14336);
});
cljc.java_time.offset_date_time.to_instant = (function cljc$java_time$offset_date_time$to_instant(this14337){
return this14337.toInstant();
});
cljc.java_time.offset_date_time.plus_weeks = (function cljc$java_time$offset_date_time$plus_weeks(this14338,long14339){
return this14338.plusWeeks(long14339);
});
cljc.java_time.offset_date_time.range = (function cljc$java_time$offset_date_time$range(this14340,java_time_temporal_TemporalField14341){
return this14340.range(java_time_temporal_TemporalField14341);
});
cljc.java_time.offset_date_time.get_hour = (function cljc$java_time$offset_date_time$get_hour(this14342){
return this14342.hour();
});
cljc.java_time.offset_date_time.at_zone_same_instant = (function cljc$java_time$offset_date_time$at_zone_same_instant(this14343,java_time_ZoneId14344){
return this14343.atZoneSameInstant(java_time_ZoneId14344);
});
cljc.java_time.offset_date_time.minus_hours = (function cljc$java_time$offset_date_time$minus_hours(this14345,long14346){
return this14345.minusHours(long14346);
});
cljc.java_time.offset_date_time.of = (function cljc$java_time$offset_date_time$of(var_args){
var G__115548 = arguments.length;
switch (G__115548) {
case 3:
return cljc.java_time.offset_date_time.of.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
case 2:
return cljc.java_time.offset_date_time.of.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 8:
return cljc.java_time.offset_date_time.of.cljs$core$IFn$_invoke$arity$8((arguments[(0)]),(arguments[(1)]),(arguments[(2)]),(arguments[(3)]),(arguments[(4)]),(arguments[(5)]),(arguments[(6)]),(arguments[(7)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(cljc.java_time.offset_date_time.of.cljs$core$IFn$_invoke$arity$3 = (function (java_time_LocalDate14347,java_time_LocalTime14348,java_time_ZoneOffset14349){
return cljs.core.js_invoke.cljs$core$IFn$_invoke$arity$variadic(java.time.OffsetDateTime,"of",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([java_time_LocalDate14347,java_time_LocalTime14348,java_time_ZoneOffset14349], 0));
}));

(cljc.java_time.offset_date_time.of.cljs$core$IFn$_invoke$arity$2 = (function (java_time_LocalDateTime14350,java_time_ZoneOffset14351){
return cljs.core.js_invoke.cljs$core$IFn$_invoke$arity$variadic(java.time.OffsetDateTime,"of",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([java_time_LocalDateTime14350,java_time_ZoneOffset14351], 0));
}));

(cljc.java_time.offset_date_time.of.cljs$core$IFn$_invoke$arity$8 = (function (int14352,int14353,int14354,int14355,int14356,int14357,int14358,java_time_ZoneOffset14359){
return cljs.core.js_invoke.cljs$core$IFn$_invoke$arity$variadic(java.time.OffsetDateTime,"of",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([int14352,int14353,int14354,int14355,int14356,int14357,int14358,java_time_ZoneOffset14359], 0));
}));

(cljc.java_time.offset_date_time.of.cljs$lang$maxFixedArity = 8);

cljc.java_time.offset_date_time.with_month = (function cljc$java_time$offset_date_time$with_month(this14360,int14361){
return this14360.withMonth(int14361);
});
cljc.java_time.offset_date_time.is_equal = (function cljc$java_time$offset_date_time$is_equal(this14362,java_time_OffsetDateTime14363){
return this14362.isEqual(java_time_OffsetDateTime14363);
});
cljc.java_time.offset_date_time.get_nano = (function cljc$java_time$offset_date_time$get_nano(this14364){
return this14364.nano();
});
cljc.java_time.offset_date_time.to_offset_time = (function cljc$java_time$offset_date_time$to_offset_time(this14365){
return this14365.toOffsetTime();
});
cljc.java_time.offset_date_time.at_zone_similar_local = (function cljc$java_time$offset_date_time$at_zone_similar_local(this14366,java_time_ZoneId14367){
return this14366.atZoneSimilarLocal(java_time_ZoneId14367);
});
cljc.java_time.offset_date_time.get_year = (function cljc$java_time$offset_date_time$get_year(this14368){
return this14368.year();
});
cljc.java_time.offset_date_time.minus_seconds = (function cljc$java_time$offset_date_time$minus_seconds(this14369,long14370){
return this14369.minusSeconds(long14370);
});
cljc.java_time.offset_date_time.get_second = (function cljc$java_time$offset_date_time$get_second(this14371){
return this14371.second();
});
cljc.java_time.offset_date_time.plus_nanos = (function cljc$java_time$offset_date_time$plus_nanos(this14372,long14373){
return this14372.plusNanos(long14373);
});
cljc.java_time.offset_date_time.get_day_of_year = (function cljc$java_time$offset_date_time$get_day_of_year(this14374){
return this14374.dayOfYear();
});
cljc.java_time.offset_date_time.plus = (function cljc$java_time$offset_date_time$plus(var_args){
var G__115552 = arguments.length;
switch (G__115552) {
case 2:
return cljc.java_time.offset_date_time.plus.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return cljc.java_time.offset_date_time.plus.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(cljc.java_time.offset_date_time.plus.cljs$core$IFn$_invoke$arity$2 = (function (this14375,java_time_temporal_TemporalAmount14376){
return this14375.plus(java_time_temporal_TemporalAmount14376);
}));

(cljc.java_time.offset_date_time.plus.cljs$core$IFn$_invoke$arity$3 = (function (this14377,long14378,java_time_temporal_TemporalUnit14379){
return this14377.plus(long14378,java_time_temporal_TemporalUnit14379);
}));

(cljc.java_time.offset_date_time.plus.cljs$lang$maxFixedArity = 3);

cljc.java_time.offset_date_time.time_line_order = (function cljc$java_time$offset_date_time$time_line_order(){
return cljs.core.js_invoke(java.time.OffsetDateTime,"timeLineOrder");
});
cljc.java_time.offset_date_time.with_hour = (function cljc$java_time$offset_date_time$with_hour(this14380,int14381){
return this14380.withHour(int14381);
});
cljc.java_time.offset_date_time.with_minute = (function cljc$java_time$offset_date_time$with_minute(this14382,int14383){
return this14382.withMinute(int14383);
});
cljc.java_time.offset_date_time.plus_minutes = (function cljc$java_time$offset_date_time$plus_minutes(this14384,long14385){
return this14384.plusMinutes(long14385);
});
cljc.java_time.offset_date_time.query = (function cljc$java_time$offset_date_time$query(this14386,java_time_temporal_TemporalQuery14387){
return this14386.query(java_time_temporal_TemporalQuery14387);
});
cljc.java_time.offset_date_time.with_offset_same_instant = (function cljc$java_time$offset_date_time$with_offset_same_instant(this14388,java_time_ZoneOffset14389){
return this14388.withOffsetSameInstant(java_time_ZoneOffset14389);
});
cljc.java_time.offset_date_time.get_day_of_week = (function cljc$java_time$offset_date_time$get_day_of_week(this14390){
return this14390.dayOfWeek();
});
cljc.java_time.offset_date_time.to_string = (function cljc$java_time$offset_date_time$to_string(this14391){
return this14391.toString();
});
cljc.java_time.offset_date_time.plus_months = (function cljc$java_time$offset_date_time$plus_months(this14392,long14393){
return this14392.plusMonths(long14393);
});
cljc.java_time.offset_date_time.is_before = (function cljc$java_time$offset_date_time$is_before(this14394,java_time_OffsetDateTime14395){
return this14394.isBefore(java_time_OffsetDateTime14395);
});
cljc.java_time.offset_date_time.minus_months = (function cljc$java_time$offset_date_time$minus_months(this14396,long14397){
return this14396.minusMonths(long14397);
});
cljc.java_time.offset_date_time.minus = (function cljc$java_time$offset_date_time$minus(var_args){
var G__115568 = arguments.length;
switch (G__115568) {
case 3:
return cljc.java_time.offset_date_time.minus.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
case 2:
return cljc.java_time.offset_date_time.minus.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(cljc.java_time.offset_date_time.minus.cljs$core$IFn$_invoke$arity$3 = (function (this14398,long14399,java_time_temporal_TemporalUnit14400){
return this14398.minus(long14399,java_time_temporal_TemporalUnit14400);
}));

(cljc.java_time.offset_date_time.minus.cljs$core$IFn$_invoke$arity$2 = (function (this14401,java_time_temporal_TemporalAmount14402){
return this14401.minus(java_time_temporal_TemporalAmount14402);
}));

(cljc.java_time.offset_date_time.minus.cljs$lang$maxFixedArity = 3);

cljc.java_time.offset_date_time.plus_hours = (function cljc$java_time$offset_date_time$plus_hours(this14403,long14404){
return this14403.plusHours(long14404);
});
cljc.java_time.offset_date_time.plus_days = (function cljc$java_time$offset_date_time$plus_days(this14405,long14406){
return this14405.plusDays(long14406);
});
cljc.java_time.offset_date_time.to_local_time = (function cljc$java_time$offset_date_time$to_local_time(this14407){
return this14407.toLocalTime();
});
cljc.java_time.offset_date_time.get_long = (function cljc$java_time$offset_date_time$get_long(this14408,java_time_temporal_TemporalField14409){
return this14408.getLong(java_time_temporal_TemporalField14409);
});
cljc.java_time.offset_date_time.get_offset = (function cljc$java_time$offset_date_time$get_offset(this14410){
return this14410.offset();
});
cljc.java_time.offset_date_time.to_zoned_date_time = (function cljc$java_time$offset_date_time$to_zoned_date_time(this14411){
return this14411.toZonedDateTime();
});
cljc.java_time.offset_date_time.with_year = (function cljc$java_time$offset_date_time$with_year(this14412,int14413){
return this14412.withYear(int14413);
});
cljc.java_time.offset_date_time.with_nano = (function cljc$java_time$offset_date_time$with_nano(this14414,int14415){
return this14414.withNano(int14415);
});
cljc.java_time.offset_date_time.to_epoch_second = (function cljc$java_time$offset_date_time$to_epoch_second(this14416){
return this14416.toEpochSecond();
});
cljc.java_time.offset_date_time.until = (function cljc$java_time$offset_date_time$until(this14417,java_time_temporal_Temporal14418,java_time_temporal_TemporalUnit14419){
return this14417.until(java_time_temporal_Temporal14418,java_time_temporal_TemporalUnit14419);
});
cljc.java_time.offset_date_time.with_offset_same_local = (function cljc$java_time$offset_date_time$with_offset_same_local(this14420,java_time_ZoneOffset14421){
return this14420.withOffsetSameLocal(java_time_ZoneOffset14421);
});
cljc.java_time.offset_date_time.with_day_of_month = (function cljc$java_time$offset_date_time$with_day_of_month(this14422,int14423){
return this14422.withDayOfMonth(int14423);
});
cljc.java_time.offset_date_time.get_day_of_month = (function cljc$java_time$offset_date_time$get_day_of_month(this14424){
return this14424.dayOfMonth();
});
cljc.java_time.offset_date_time.from = (function cljc$java_time$offset_date_time$from(java_time_temporal_TemporalAccessor14425){
return cljs.core.js_invoke.cljs$core$IFn$_invoke$arity$variadic(java.time.OffsetDateTime,"from",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([java_time_temporal_TemporalAccessor14425], 0));
});
cljc.java_time.offset_date_time.is_after = (function cljc$java_time$offset_date_time$is_after(this14426,java_time_OffsetDateTime14427){
return this14426.isAfter(java_time_OffsetDateTime14427);
});
cljc.java_time.offset_date_time.minus_nanos = (function cljc$java_time$offset_date_time$minus_nanos(this14428,long14429){
return this14428.minusNanos(long14429);
});
cljc.java_time.offset_date_time.is_supported = (function cljc$java_time$offset_date_time$is_supported(this14430,G__14431){
return this14430.isSupported(G__14431);
});
cljc.java_time.offset_date_time.minus_years = (function cljc$java_time$offset_date_time$minus_years(this14432,long14433){
return this14432.minusYears(long14433);
});
cljc.java_time.offset_date_time.parse = (function cljc$java_time$offset_date_time$parse(var_args){
var G__115698 = arguments.length;
switch (G__115698) {
case 2:
return cljc.java_time.offset_date_time.parse.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 1:
return cljc.java_time.offset_date_time.parse.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(cljc.java_time.offset_date_time.parse.cljs$core$IFn$_invoke$arity$2 = (function (java_lang_CharSequence14434,java_time_format_DateTimeFormatter14435){
return cljs.core.js_invoke.cljs$core$IFn$_invoke$arity$variadic(java.time.OffsetDateTime,"parse",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([java_lang_CharSequence14434,java_time_format_DateTimeFormatter14435], 0));
}));

(cljc.java_time.offset_date_time.parse.cljs$core$IFn$_invoke$arity$1 = (function (java_lang_CharSequence14436){
return cljs.core.js_invoke.cljs$core$IFn$_invoke$arity$variadic(java.time.OffsetDateTime,"parse",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([java_lang_CharSequence14436], 0));
}));

(cljc.java_time.offset_date_time.parse.cljs$lang$maxFixedArity = 2);

cljc.java_time.offset_date_time.with_second = (function cljc$java_time$offset_date_time$with_second(this14437,int14438){
return this14437.withSecond(int14438);
});
cljc.java_time.offset_date_time.to_local_date = (function cljc$java_time$offset_date_time$to_local_date(this14439){
return this14439.toLocalDate();
});
cljc.java_time.offset_date_time.get_minute = (function cljc$java_time$offset_date_time$get_minute(this14440){
return this14440.minute();
});
cljc.java_time.offset_date_time.hash_code = (function cljc$java_time$offset_date_time$hash_code(this14441){
return this14441.hashCode();
});
cljc.java_time.offset_date_time.adjust_into = (function cljc$java_time$offset_date_time$adjust_into(this14442,java_time_temporal_Temporal14443){
return this14442.adjustInto(java_time_temporal_Temporal14443);
});
cljc.java_time.offset_date_time.with$ = (function cljc$java_time$offset_date_time$with(var_args){
var G__115733 = arguments.length;
switch (G__115733) {
case 2:
return cljc.java_time.offset_date_time.with$.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return cljc.java_time.offset_date_time.with$.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(cljc.java_time.offset_date_time.with$.cljs$core$IFn$_invoke$arity$2 = (function (this14444,java_time_temporal_TemporalAdjuster14445){
return this14444.with(java_time_temporal_TemporalAdjuster14445);
}));

(cljc.java_time.offset_date_time.with$.cljs$core$IFn$_invoke$arity$3 = (function (this14446,java_time_temporal_TemporalField14447,long14448){
return this14446.with(java_time_temporal_TemporalField14447,long14448);
}));

(cljc.java_time.offset_date_time.with$.cljs$lang$maxFixedArity = 3);

cljc.java_time.offset_date_time.now = (function cljc$java_time$offset_date_time$now(var_args){
var G__115743 = arguments.length;
switch (G__115743) {
case 1:
return cljc.java_time.offset_date_time.now.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 0:
return cljc.java_time.offset_date_time.now.cljs$core$IFn$_invoke$arity$0();

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(cljc.java_time.offset_date_time.now.cljs$core$IFn$_invoke$arity$1 = (function (G__14450){
return cljs.core.js_invoke.cljs$core$IFn$_invoke$arity$variadic(java.time.OffsetDateTime,"now",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([G__14450], 0));
}));

(cljc.java_time.offset_date_time.now.cljs$core$IFn$_invoke$arity$0 = (function (){
return cljs.core.js_invoke(java.time.OffsetDateTime,"now");
}));

(cljc.java_time.offset_date_time.now.cljs$lang$maxFixedArity = 1);

cljc.java_time.offset_date_time.to_local_date_time = (function cljc$java_time$offset_date_time$to_local_date_time(this14451){
return this14451.toLocalDateTime();
});
cljc.java_time.offset_date_time.get_month_value = (function cljc$java_time$offset_date_time$get_month_value(this14452){
return this14452.monthValue();
});
cljc.java_time.offset_date_time.with_day_of_year = (function cljc$java_time$offset_date_time$with_day_of_year(this14453,int14454){
return this14453.withDayOfYear(int14454);
});
cljc.java_time.offset_date_time.compare_to = (function cljc$java_time$offset_date_time$compare_to(this14455,java_time_OffsetDateTime14456){
return this14455.compareTo(java_time_OffsetDateTime14456);
});
cljc.java_time.offset_date_time.get_month = (function cljc$java_time$offset_date_time$get_month(this14457){
return this14457.month();
});
cljc.java_time.offset_date_time.of_instant = (function cljc$java_time$offset_date_time$of_instant(java_time_Instant14458,java_time_ZoneId14459){
return cljs.core.js_invoke.cljs$core$IFn$_invoke$arity$variadic(java.time.OffsetDateTime,"ofInstant",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([java_time_Instant14458,java_time_ZoneId14459], 0));
});
cljc.java_time.offset_date_time.plus_seconds = (function cljc$java_time$offset_date_time$plus_seconds(this14460,long14461){
return this14460.plusSeconds(long14461);
});
cljc.java_time.offset_date_time.get = (function cljc$java_time$offset_date_time$get(this14462,java_time_temporal_TemporalField14463){
return this14462.get(java_time_temporal_TemporalField14463);
});
cljc.java_time.offset_date_time.equals = (function cljc$java_time$offset_date_time$equals(this14464,java_lang_Object14465){
return this14464.equals(java_lang_Object14465);
});
cljc.java_time.offset_date_time.format = (function cljc$java_time$offset_date_time$format(this14466,java_time_format_DateTimeFormatter14467){
return this14466.format(java_time_format_DateTimeFormatter14467);
});
cljc.java_time.offset_date_time.plus_years = (function cljc$java_time$offset_date_time$plus_years(this14468,long14469){
return this14468.plusYears(long14469);
});
cljc.java_time.offset_date_time.minus_days = (function cljc$java_time$offset_date_time$minus_days(this14470,long14471){
return this14470.minusDays(long14471);
});

//# sourceMappingURL=cljc.java_time.offset_date_time.js.map
