goog.provide('cljc.java_time.duration');
goog.scope(function(){
  cljc.java_time.duration.goog$module$goog$object = goog.module.get('goog.object');
});
cljc.java_time.duration.zero = cljc.java_time.duration.goog$module$goog$object.get(java.time.Duration,"ZERO");
cljc.java_time.duration.minus_minutes = (function cljc$java_time$duration$minus_minutes(this15016,long15017){
return this15016.minusMinutes(long15017);
});
cljc.java_time.duration.to_nanos = (function cljc$java_time$duration$to_nanos(this15018){
return this15018.toNanos();
});
cljc.java_time.duration.minus_millis = (function cljc$java_time$duration$minus_millis(this15019,long15020){
return this15019.minusMillis(long15020);
});
cljc.java_time.duration.minus_hours = (function cljc$java_time$duration$minus_hours(this15021,long15022){
return this15021.minusHours(long15022);
});
cljc.java_time.duration.of_days = (function cljc$java_time$duration$of_days(long15023){
return cljs.core.js_invoke.cljs$core$IFn$_invoke$arity$variadic(java.time.Duration,"ofDays",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([long15023], 0));
});
cljc.java_time.duration.is_negative = (function cljc$java_time$duration$is_negative(this15024){
return this15024.isNegative();
});
cljc.java_time.duration.of = (function cljc$java_time$duration$of(long15025,java_time_temporal_TemporalUnit15026){
return cljs.core.js_invoke.cljs$core$IFn$_invoke$arity$variadic(java.time.Duration,"of",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([long15025,java_time_temporal_TemporalUnit15026], 0));
});
cljc.java_time.duration.is_zero = (function cljc$java_time$duration$is_zero(this15027){
return this15027.isZero();
});
cljc.java_time.duration.multiplied_by = (function cljc$java_time$duration$multiplied_by(this15028,long15029){
return this15028.multipliedBy(long15029);
});
cljc.java_time.duration.with_nanos = (function cljc$java_time$duration$with_nanos(this15030,int15031){
return this15030.withNanos(int15031);
});
cljc.java_time.duration.get_units = (function cljc$java_time$duration$get_units(this15032){
return this15032.units();
});
cljc.java_time.duration.get_nano = (function cljc$java_time$duration$get_nano(this15033){
return this15033.nano();
});
cljc.java_time.duration.plus_millis = (function cljc$java_time$duration$plus_millis(this15034,long15035){
return this15034.plusMillis(long15035);
});
cljc.java_time.duration.to_minutes = (function cljc$java_time$duration$to_minutes(this15036){
return this15036.toMinutes();
});
cljc.java_time.duration.minus_seconds = (function cljc$java_time$duration$minus_seconds(this15037,long15038){
return this15037.minusSeconds(long15038);
});
cljc.java_time.duration.plus_nanos = (function cljc$java_time$duration$plus_nanos(this15039,long15040){
return this15039.plusNanos(long15040);
});
cljc.java_time.duration.plus = (function cljc$java_time$duration$plus(var_args){
var G__120965 = arguments.length;
switch (G__120965) {
case 2:
return cljc.java_time.duration.plus.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return cljc.java_time.duration.plus.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(cljc.java_time.duration.plus.cljs$core$IFn$_invoke$arity$2 = (function (this15041,java_time_Duration15042){
return this15041.plus(java_time_Duration15042);
}));

(cljc.java_time.duration.plus.cljs$core$IFn$_invoke$arity$3 = (function (this15043,long15044,java_time_temporal_TemporalUnit15045){
return this15043.plus(long15044,java_time_temporal_TemporalUnit15045);
}));

(cljc.java_time.duration.plus.cljs$lang$maxFixedArity = 3);

cljc.java_time.duration.divided_by = (function cljc$java_time$duration$divided_by(this15046,long15047){
return this15046.dividedBy(long15047);
});
cljc.java_time.duration.plus_minutes = (function cljc$java_time$duration$plus_minutes(this15048,long15049){
return this15048.plusMinutes(long15049);
});
cljc.java_time.duration.to_string = (function cljc$java_time$duration$to_string(this15050){
return this15050.toString();
});
cljc.java_time.duration.minus = (function cljc$java_time$duration$minus(var_args){
var G__120967 = arguments.length;
switch (G__120967) {
case 2:
return cljc.java_time.duration.minus.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return cljc.java_time.duration.minus.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(cljc.java_time.duration.minus.cljs$core$IFn$_invoke$arity$2 = (function (this15051,java_time_Duration15052){
return this15051.minus(java_time_Duration15052);
}));

(cljc.java_time.duration.minus.cljs$core$IFn$_invoke$arity$3 = (function (this15053,long15054,java_time_temporal_TemporalUnit15055){
return this15053.minus(long15054,java_time_temporal_TemporalUnit15055);
}));

(cljc.java_time.duration.minus.cljs$lang$maxFixedArity = 3);

cljc.java_time.duration.add_to = (function cljc$java_time$duration$add_to(this15056,java_time_temporal_Temporal15057){
return this15056.addTo(java_time_temporal_Temporal15057);
});
cljc.java_time.duration.plus_hours = (function cljc$java_time$duration$plus_hours(this15058,long15059){
return this15058.plusHours(long15059);
});
cljc.java_time.duration.plus_days = (function cljc$java_time$duration$plus_days(this15060,long15061){
return this15060.plusDays(long15061);
});
cljc.java_time.duration.of_hours = (function cljc$java_time$duration$of_hours(long15062){
return cljs.core.js_invoke.cljs$core$IFn$_invoke$arity$variadic(java.time.Duration,"ofHours",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([long15062], 0));
});
cljc.java_time.duration.to_millis = (function cljc$java_time$duration$to_millis(this15063){
return this15063.toMillis();
});
cljc.java_time.duration.to_hours = (function cljc$java_time$duration$to_hours(this15064){
return this15064.toHours();
});
cljc.java_time.duration.of_nanos = (function cljc$java_time$duration$of_nanos(long15065){
return cljs.core.js_invoke.cljs$core$IFn$_invoke$arity$variadic(java.time.Duration,"ofNanos",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([long15065], 0));
});
cljc.java_time.duration.of_millis = (function cljc$java_time$duration$of_millis(long15066){
return cljs.core.js_invoke.cljs$core$IFn$_invoke$arity$variadic(java.time.Duration,"ofMillis",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([long15066], 0));
});
cljc.java_time.duration.negated = (function cljc$java_time$duration$negated(this15067){
return this15067.negated();
});
cljc.java_time.duration.abs = (function cljc$java_time$duration$abs(this15068){
return this15068.abs();
});
cljc.java_time.duration.between = (function cljc$java_time$duration$between(java_time_temporal_Temporal15069,java_time_temporal_Temporal15070){
return cljs.core.js_invoke.cljs$core$IFn$_invoke$arity$variadic(java.time.Duration,"between",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([java_time_temporal_Temporal15069,java_time_temporal_Temporal15070], 0));
});
cljc.java_time.duration.get_seconds = (function cljc$java_time$duration$get_seconds(this15071){
return this15071.seconds();
});
cljc.java_time.duration.from = (function cljc$java_time$duration$from(java_time_temporal_TemporalAmount15072){
return cljs.core.js_invoke.cljs$core$IFn$_invoke$arity$variadic(java.time.Duration,"from",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([java_time_temporal_TemporalAmount15072], 0));
});
cljc.java_time.duration.minus_nanos = (function cljc$java_time$duration$minus_nanos(this15073,long15074){
return this15073.minusNanos(long15074);
});
cljc.java_time.duration.parse = (function cljc$java_time$duration$parse(java_lang_CharSequence15075){
return cljs.core.js_invoke.cljs$core$IFn$_invoke$arity$variadic(java.time.Duration,"parse",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([java_lang_CharSequence15075], 0));
});
cljc.java_time.duration.hash_code = (function cljc$java_time$duration$hash_code(this15076){
return this15076.hashCode();
});
cljc.java_time.duration.with_seconds = (function cljc$java_time$duration$with_seconds(this15077,long15078){
return this15077.withSeconds(long15078);
});
cljc.java_time.duration.of_minutes = (function cljc$java_time$duration$of_minutes(long15079){
return cljs.core.js_invoke.cljs$core$IFn$_invoke$arity$variadic(java.time.Duration,"ofMinutes",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([long15079], 0));
});
cljc.java_time.duration.subtract_from = (function cljc$java_time$duration$subtract_from(this15080,java_time_temporal_Temporal15081){
return this15080.subtractFrom(java_time_temporal_Temporal15081);
});
cljc.java_time.duration.compare_to = (function cljc$java_time$duration$compare_to(this15082,java_time_Duration15083){
return this15082.compareTo(java_time_Duration15083);
});
cljc.java_time.duration.plus_seconds = (function cljc$java_time$duration$plus_seconds(this15084,long15085){
return this15084.plusSeconds(long15085);
});
cljc.java_time.duration.get = (function cljc$java_time$duration$get(this15086,java_time_temporal_TemporalUnit15087){
return this15086.get(java_time_temporal_TemporalUnit15087);
});
cljc.java_time.duration.equals = (function cljc$java_time$duration$equals(this15088,java_lang_Object15089){
return this15088.equals(java_lang_Object15089);
});
cljc.java_time.duration.of_seconds = (function cljc$java_time$duration$of_seconds(var_args){
var G__120969 = arguments.length;
switch (G__120969) {
case 2:
return cljc.java_time.duration.of_seconds.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 1:
return cljc.java_time.duration.of_seconds.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(cljc.java_time.duration.of_seconds.cljs$core$IFn$_invoke$arity$2 = (function (long15090,long15091){
return cljs.core.js_invoke.cljs$core$IFn$_invoke$arity$variadic(java.time.Duration,"ofSeconds",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([long15090,long15091], 0));
}));

(cljc.java_time.duration.of_seconds.cljs$core$IFn$_invoke$arity$1 = (function (long15092){
return cljs.core.js_invoke.cljs$core$IFn$_invoke$arity$variadic(java.time.Duration,"ofSeconds",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([long15092], 0));
}));

(cljc.java_time.duration.of_seconds.cljs$lang$maxFixedArity = 2);

cljc.java_time.duration.minus_days = (function cljc$java_time$duration$minus_days(this15093,long15094){
return this15093.minusDays(long15094);
});
cljc.java_time.duration.to_days = (function cljc$java_time$duration$to_days(this15095){
return this15095.toDays();
});

//# sourceMappingURL=cljc.java_time.duration.js.map
