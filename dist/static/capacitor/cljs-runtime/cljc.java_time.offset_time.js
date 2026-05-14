goog.provide('cljc.java_time.offset_time');
goog.scope(function(){
  cljc.java_time.offset_time.goog$module$goog$object = goog.module.get('goog.object');
});
cljc.java_time.offset_time.min = cljc.java_time.offset_time.goog$module$goog$object.get(java.time.OffsetTime,"MIN");
cljc.java_time.offset_time.max = cljc.java_time.offset_time.goog$module$goog$object.get(java.time.OffsetTime,"MAX");
cljc.java_time.offset_time.minus_minutes = (function cljc$java_time$offset_time$minus_minutes(this13957,long13958){
return this13957.minusMinutes(long13958);
});
cljc.java_time.offset_time.truncated_to = (function cljc$java_time$offset_time$truncated_to(this13959,java_time_temporal_TemporalUnit13960){
return this13959.truncatedTo(java_time_temporal_TemporalUnit13960);
});
cljc.java_time.offset_time.range = (function cljc$java_time$offset_time$range(this13961,java_time_temporal_TemporalField13962){
return this13961.range(java_time_temporal_TemporalField13962);
});
cljc.java_time.offset_time.get_hour = (function cljc$java_time$offset_time$get_hour(this13963){
return this13963.hour();
});
cljc.java_time.offset_time.minus_hours = (function cljc$java_time$offset_time$minus_hours(this13964,long13965){
return this13964.minusHours(long13965);
});
cljc.java_time.offset_time.of = (function cljc$java_time$offset_time$of(var_args){
var G__115845 = arguments.length;
switch (G__115845) {
case 2:
return cljc.java_time.offset_time.of.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 5:
return cljc.java_time.offset_time.of.cljs$core$IFn$_invoke$arity$5((arguments[(0)]),(arguments[(1)]),(arguments[(2)]),(arguments[(3)]),(arguments[(4)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(cljc.java_time.offset_time.of.cljs$core$IFn$_invoke$arity$2 = (function (java_time_LocalTime13966,java_time_ZoneOffset13967){
return cljs.core.js_invoke.cljs$core$IFn$_invoke$arity$variadic(java.time.OffsetTime,"of",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([java_time_LocalTime13966,java_time_ZoneOffset13967], 0));
}));

(cljc.java_time.offset_time.of.cljs$core$IFn$_invoke$arity$5 = (function (int13968,int13969,int13970,int13971,java_time_ZoneOffset13972){
return cljs.core.js_invoke.cljs$core$IFn$_invoke$arity$variadic(java.time.OffsetTime,"of",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([int13968,int13969,int13970,int13971,java_time_ZoneOffset13972], 0));
}));

(cljc.java_time.offset_time.of.cljs$lang$maxFixedArity = 5);

cljc.java_time.offset_time.is_equal = (function cljc$java_time$offset_time$is_equal(this13973,java_time_OffsetTime13974){
return this13973.isEqual(java_time_OffsetTime13974);
});
cljc.java_time.offset_time.get_nano = (function cljc$java_time$offset_time$get_nano(this13975){
return this13975.nano();
});
cljc.java_time.offset_time.minus_seconds = (function cljc$java_time$offset_time$minus_seconds(this13976,long13977){
return this13976.minusSeconds(long13977);
});
cljc.java_time.offset_time.get_second = (function cljc$java_time$offset_time$get_second(this13978){
return this13978.second();
});
cljc.java_time.offset_time.plus_nanos = (function cljc$java_time$offset_time$plus_nanos(this13979,long13980){
return this13979.plusNanos(long13980);
});
cljc.java_time.offset_time.plus = (function cljc$java_time$offset_time$plus(var_args){
var G__115887 = arguments.length;
switch (G__115887) {
case 3:
return cljc.java_time.offset_time.plus.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
case 2:
return cljc.java_time.offset_time.plus.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(cljc.java_time.offset_time.plus.cljs$core$IFn$_invoke$arity$3 = (function (this13981,long13982,java_time_temporal_TemporalUnit13983){
return this13981.plus(long13982,java_time_temporal_TemporalUnit13983);
}));

(cljc.java_time.offset_time.plus.cljs$core$IFn$_invoke$arity$2 = (function (this13984,java_time_temporal_TemporalAmount13985){
return this13984.plus(java_time_temporal_TemporalAmount13985);
}));

(cljc.java_time.offset_time.plus.cljs$lang$maxFixedArity = 3);

cljc.java_time.offset_time.with_hour = (function cljc$java_time$offset_time$with_hour(this13986,int13987){
return this13986.withHour(int13987);
});
cljc.java_time.offset_time.with_minute = (function cljc$java_time$offset_time$with_minute(this13988,int13989){
return this13988.withMinute(int13989);
});
cljc.java_time.offset_time.plus_minutes = (function cljc$java_time$offset_time$plus_minutes(this13990,long13991){
return this13990.plusMinutes(long13991);
});
cljc.java_time.offset_time.query = (function cljc$java_time$offset_time$query(this13992,java_time_temporal_TemporalQuery13993){
return this13992.query(java_time_temporal_TemporalQuery13993);
});
cljc.java_time.offset_time.at_date = (function cljc$java_time$offset_time$at_date(this13994,java_time_LocalDate13995){
return this13994.atDate(java_time_LocalDate13995);
});
cljc.java_time.offset_time.with_offset_same_instant = (function cljc$java_time$offset_time$with_offset_same_instant(this13996,java_time_ZoneOffset13997){
return this13996.withOffsetSameInstant(java_time_ZoneOffset13997);
});
cljc.java_time.offset_time.to_string = (function cljc$java_time$offset_time$to_string(this13998){
return this13998.toString();
});
cljc.java_time.offset_time.is_before = (function cljc$java_time$offset_time$is_before(this13999,java_time_OffsetTime14000){
return this13999.isBefore(java_time_OffsetTime14000);
});
cljc.java_time.offset_time.minus = (function cljc$java_time$offset_time$minus(var_args){
var G__115934 = arguments.length;
switch (G__115934) {
case 3:
return cljc.java_time.offset_time.minus.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
case 2:
return cljc.java_time.offset_time.minus.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(cljc.java_time.offset_time.minus.cljs$core$IFn$_invoke$arity$3 = (function (this14001,long14002,java_time_temporal_TemporalUnit14003){
return this14001.minus(long14002,java_time_temporal_TemporalUnit14003);
}));

(cljc.java_time.offset_time.minus.cljs$core$IFn$_invoke$arity$2 = (function (this14004,java_time_temporal_TemporalAmount14005){
return this14004.minus(java_time_temporal_TemporalAmount14005);
}));

(cljc.java_time.offset_time.minus.cljs$lang$maxFixedArity = 3);

cljc.java_time.offset_time.plus_hours = (function cljc$java_time$offset_time$plus_hours(this14006,long14007){
return this14006.plusHours(long14007);
});
cljc.java_time.offset_time.to_local_time = (function cljc$java_time$offset_time$to_local_time(this14008){
return this14008.toLocalTime();
});
cljc.java_time.offset_time.get_long = (function cljc$java_time$offset_time$get_long(this14009,java_time_temporal_TemporalField14010){
return this14009.getLong(java_time_temporal_TemporalField14010);
});
cljc.java_time.offset_time.get_offset = (function cljc$java_time$offset_time$get_offset(this14011){
return this14011.offset();
});
cljc.java_time.offset_time.with_nano = (function cljc$java_time$offset_time$with_nano(this14012,int14013){
return this14012.withNano(int14013);
});
cljc.java_time.offset_time.until = (function cljc$java_time$offset_time$until(this14014,java_time_temporal_Temporal14015,java_time_temporal_TemporalUnit14016){
return this14014.until(java_time_temporal_Temporal14015,java_time_temporal_TemporalUnit14016);
});
cljc.java_time.offset_time.with_offset_same_local = (function cljc$java_time$offset_time$with_offset_same_local(this14017,java_time_ZoneOffset14018){
return this14017.withOffsetSameLocal(java_time_ZoneOffset14018);
});
cljc.java_time.offset_time.from = (function cljc$java_time$offset_time$from(java_time_temporal_TemporalAccessor14019){
return cljs.core.js_invoke.cljs$core$IFn$_invoke$arity$variadic(java.time.OffsetTime,"from",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([java_time_temporal_TemporalAccessor14019], 0));
});
cljc.java_time.offset_time.is_after = (function cljc$java_time$offset_time$is_after(this14020,java_time_OffsetTime14021){
return this14020.isAfter(java_time_OffsetTime14021);
});
cljc.java_time.offset_time.minus_nanos = (function cljc$java_time$offset_time$minus_nanos(this14022,long14023){
return this14022.minusNanos(long14023);
});
cljc.java_time.offset_time.is_supported = (function cljc$java_time$offset_time$is_supported(this14024,G__14025){
return this14024.isSupported(G__14025);
});
cljc.java_time.offset_time.parse = (function cljc$java_time$offset_time$parse(var_args){
var G__115982 = arguments.length;
switch (G__115982) {
case 1:
return cljc.java_time.offset_time.parse.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return cljc.java_time.offset_time.parse.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(cljc.java_time.offset_time.parse.cljs$core$IFn$_invoke$arity$1 = (function (java_lang_CharSequence14026){
return cljs.core.js_invoke.cljs$core$IFn$_invoke$arity$variadic(java.time.OffsetTime,"parse",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([java_lang_CharSequence14026], 0));
}));

(cljc.java_time.offset_time.parse.cljs$core$IFn$_invoke$arity$2 = (function (java_lang_CharSequence14027,java_time_format_DateTimeFormatter14028){
return cljs.core.js_invoke.cljs$core$IFn$_invoke$arity$variadic(java.time.OffsetTime,"parse",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([java_lang_CharSequence14027,java_time_format_DateTimeFormatter14028], 0));
}));

(cljc.java_time.offset_time.parse.cljs$lang$maxFixedArity = 2);

cljc.java_time.offset_time.with_second = (function cljc$java_time$offset_time$with_second(this14029,int14030){
return this14029.withSecond(int14030);
});
cljc.java_time.offset_time.get_minute = (function cljc$java_time$offset_time$get_minute(this14031){
return this14031.minute();
});
cljc.java_time.offset_time.hash_code = (function cljc$java_time$offset_time$hash_code(this14032){
return this14032.hashCode();
});
cljc.java_time.offset_time.adjust_into = (function cljc$java_time$offset_time$adjust_into(this14033,java_time_temporal_Temporal14034){
return this14033.adjustInto(java_time_temporal_Temporal14034);
});
cljc.java_time.offset_time.with$ = (function cljc$java_time$offset_time$with(var_args){
var G__116027 = arguments.length;
switch (G__116027) {
case 2:
return cljc.java_time.offset_time.with$.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return cljc.java_time.offset_time.with$.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(cljc.java_time.offset_time.with$.cljs$core$IFn$_invoke$arity$2 = (function (this14035,java_time_temporal_TemporalAdjuster14036){
return this14035.with(java_time_temporal_TemporalAdjuster14036);
}));

(cljc.java_time.offset_time.with$.cljs$core$IFn$_invoke$arity$3 = (function (this14037,java_time_temporal_TemporalField14038,long14039){
return this14037.with(java_time_temporal_TemporalField14038,long14039);
}));

(cljc.java_time.offset_time.with$.cljs$lang$maxFixedArity = 3);

cljc.java_time.offset_time.now = (function cljc$java_time$offset_time$now(var_args){
var G__116048 = arguments.length;
switch (G__116048) {
case 0:
return cljc.java_time.offset_time.now.cljs$core$IFn$_invoke$arity$0();

break;
case 1:
return cljc.java_time.offset_time.now.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(cljc.java_time.offset_time.now.cljs$core$IFn$_invoke$arity$0 = (function (){
return cljs.core.js_invoke(java.time.OffsetTime,"now");
}));

(cljc.java_time.offset_time.now.cljs$core$IFn$_invoke$arity$1 = (function (G__14041){
return cljs.core.js_invoke.cljs$core$IFn$_invoke$arity$variadic(java.time.OffsetTime,"now",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([G__14041], 0));
}));

(cljc.java_time.offset_time.now.cljs$lang$maxFixedArity = 1);

cljc.java_time.offset_time.compare_to = (function cljc$java_time$offset_time$compare_to(this14042,java_time_OffsetTime14043){
return this14042.compareTo(java_time_OffsetTime14043);
});
cljc.java_time.offset_time.of_instant = (function cljc$java_time$offset_time$of_instant(java_time_Instant14044,java_time_ZoneId14045){
return cljs.core.js_invoke.cljs$core$IFn$_invoke$arity$variadic(java.time.OffsetTime,"ofInstant",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([java_time_Instant14044,java_time_ZoneId14045], 0));
});
cljc.java_time.offset_time.plus_seconds = (function cljc$java_time$offset_time$plus_seconds(this14046,long14047){
return this14046.plusSeconds(long14047);
});
cljc.java_time.offset_time.get = (function cljc$java_time$offset_time$get(this14048,java_time_temporal_TemporalField14049){
return this14048.get(java_time_temporal_TemporalField14049);
});
cljc.java_time.offset_time.equals = (function cljc$java_time$offset_time$equals(this14050,java_lang_Object14051){
return this14050.equals(java_lang_Object14051);
});
cljc.java_time.offset_time.format = (function cljc$java_time$offset_time$format(this14052,java_time_format_DateTimeFormatter14053){
return this14052.format(java_time_format_DateTimeFormatter14053);
});

//# sourceMappingURL=cljc.java_time.offset_time.js.map
