goog.provide('cljc.java_time.day_of_week');
goog.scope(function(){
  cljc.java_time.day_of_week.goog$module$goog$object = goog.module.get('goog.object');
});
cljc.java_time.day_of_week.saturday = cljc.java_time.day_of_week.goog$module$goog$object.get(java.time.DayOfWeek,"SATURDAY");
cljc.java_time.day_of_week.thursday = cljc.java_time.day_of_week.goog$module$goog$object.get(java.time.DayOfWeek,"THURSDAY");
cljc.java_time.day_of_week.friday = cljc.java_time.day_of_week.goog$module$goog$object.get(java.time.DayOfWeek,"FRIDAY");
cljc.java_time.day_of_week.wednesday = cljc.java_time.day_of_week.goog$module$goog$object.get(java.time.DayOfWeek,"WEDNESDAY");
cljc.java_time.day_of_week.sunday = cljc.java_time.day_of_week.goog$module$goog$object.get(java.time.DayOfWeek,"SUNDAY");
cljc.java_time.day_of_week.monday = cljc.java_time.day_of_week.goog$module$goog$object.get(java.time.DayOfWeek,"MONDAY");
cljc.java_time.day_of_week.tuesday = cljc.java_time.day_of_week.goog$module$goog$object.get(java.time.DayOfWeek,"TUESDAY");
cljc.java_time.day_of_week.range = (function cljc$java_time$day_of_week$range(this14538,java_time_temporal_TemporalField14539){
return this14538.range(java_time_temporal_TemporalField14539);
});
cljc.java_time.day_of_week.values = (function cljc$java_time$day_of_week$values(){
return cljs.core.js_invoke(java.time.DayOfWeek,"values");
});
cljc.java_time.day_of_week.value_of = (function cljc$java_time$day_of_week$value_of(var_args){
var G__116399 = arguments.length;
switch (G__116399) {
case 1:
return cljc.java_time.day_of_week.value_of.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return cljc.java_time.day_of_week.value_of.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(cljc.java_time.day_of_week.value_of.cljs$core$IFn$_invoke$arity$1 = (function (java_lang_String14540){
return cljs.core.js_invoke.cljs$core$IFn$_invoke$arity$variadic(java.time.DayOfWeek,"valueOf",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([java_lang_String14540], 0));
}));

(cljc.java_time.day_of_week.value_of.cljs$core$IFn$_invoke$arity$2 = (function (java_lang_Class14541,java_lang_String14542){
return cljs.core.js_invoke.cljs$core$IFn$_invoke$arity$variadic(java.time.DayOfWeek,"valueOf",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([java_lang_Class14541,java_lang_String14542], 0));
}));

(cljc.java_time.day_of_week.value_of.cljs$lang$maxFixedArity = 2);

cljc.java_time.day_of_week.of = (function cljc$java_time$day_of_week$of(int14543){
return cljs.core.js_invoke.cljs$core$IFn$_invoke$arity$variadic(java.time.DayOfWeek,"of",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([int14543], 0));
});
cljc.java_time.day_of_week.ordinal = (function cljc$java_time$day_of_week$ordinal(this14544){
return this14544.ordinal();
});
cljc.java_time.day_of_week.plus = (function cljc$java_time$day_of_week$plus(this14545,long14546){
return this14545.plus(long14546);
});
cljc.java_time.day_of_week.query = (function cljc$java_time$day_of_week$query(this14547,java_time_temporal_TemporalQuery14548){
return this14547.query(java_time_temporal_TemporalQuery14548);
});
cljc.java_time.day_of_week.to_string = (function cljc$java_time$day_of_week$to_string(this14549){
return this14549.toString();
});
cljc.java_time.day_of_week.minus = (function cljc$java_time$day_of_week$minus(this14550,long14551){
return this14550.minus(long14551);
});
cljc.java_time.day_of_week.get_display_name = (function cljc$java_time$day_of_week$get_display_name(this14552,java_time_format_TextStyle14553,java_util_Locale14554){
return this14552.displayName(java_time_format_TextStyle14553,java_util_Locale14554);
});
cljc.java_time.day_of_week.get_value = (function cljc$java_time$day_of_week$get_value(this14555){
return this14555.value();
});
cljc.java_time.day_of_week.name = (function cljc$java_time$day_of_week$name(this14556){
return this14556.name();
});
cljc.java_time.day_of_week.get_long = (function cljc$java_time$day_of_week$get_long(this14557,java_time_temporal_TemporalField14558){
return this14557.getLong(java_time_temporal_TemporalField14558);
});
cljc.java_time.day_of_week.get_declaring_class = (function cljc$java_time$day_of_week$get_declaring_class(this14559){
return this14559.declaringClass();
});
cljc.java_time.day_of_week.from = (function cljc$java_time$day_of_week$from(java_time_temporal_TemporalAccessor14560){
return cljs.core.js_invoke.cljs$core$IFn$_invoke$arity$variadic(java.time.DayOfWeek,"from",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([java_time_temporal_TemporalAccessor14560], 0));
});
cljc.java_time.day_of_week.is_supported = (function cljc$java_time$day_of_week$is_supported(this14561,java_time_temporal_TemporalField14562){
return this14561.isSupported(java_time_temporal_TemporalField14562);
});
cljc.java_time.day_of_week.hash_code = (function cljc$java_time$day_of_week$hash_code(this14563){
return this14563.hashCode();
});
cljc.java_time.day_of_week.adjust_into = (function cljc$java_time$day_of_week$adjust_into(this14564,java_time_temporal_Temporal14565){
return this14564.adjustInto(java_time_temporal_Temporal14565);
});
cljc.java_time.day_of_week.compare_to = (function cljc$java_time$day_of_week$compare_to(this14566,java_lang_Enum14567){
return this14566.compareTo(java_lang_Enum14567);
});
cljc.java_time.day_of_week.get = (function cljc$java_time$day_of_week$get(this14568,java_time_temporal_TemporalField14569){
return this14568.get(java_time_temporal_TemporalField14569);
});
cljc.java_time.day_of_week.equals = (function cljc$java_time$day_of_week$equals(this14570,java_lang_Object14571){
return this14570.equals(java_lang_Object14571);
});

//# sourceMappingURL=cljc.java_time.day_of_week.js.map
