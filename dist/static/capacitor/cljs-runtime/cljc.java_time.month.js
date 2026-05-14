goog.provide('cljc.java_time.month');
goog.scope(function(){
  cljc.java_time.month.goog$module$goog$object = goog.module.get('goog.object');
});
cljc.java_time.month.may = cljc.java_time.month.goog$module$goog$object.get(java.time.Month,"MAY");
cljc.java_time.month.december = cljc.java_time.month.goog$module$goog$object.get(java.time.Month,"DECEMBER");
cljc.java_time.month.june = cljc.java_time.month.goog$module$goog$object.get(java.time.Month,"JUNE");
cljc.java_time.month.september = cljc.java_time.month.goog$module$goog$object.get(java.time.Month,"SEPTEMBER");
cljc.java_time.month.february = cljc.java_time.month.goog$module$goog$object.get(java.time.Month,"FEBRUARY");
cljc.java_time.month.january = cljc.java_time.month.goog$module$goog$object.get(java.time.Month,"JANUARY");
cljc.java_time.month.november = cljc.java_time.month.goog$module$goog$object.get(java.time.Month,"NOVEMBER");
cljc.java_time.month.august = cljc.java_time.month.goog$module$goog$object.get(java.time.Month,"AUGUST");
cljc.java_time.month.july = cljc.java_time.month.goog$module$goog$object.get(java.time.Month,"JULY");
cljc.java_time.month.march = cljc.java_time.month.goog$module$goog$object.get(java.time.Month,"MARCH");
cljc.java_time.month.october = cljc.java_time.month.goog$module$goog$object.get(java.time.Month,"OCTOBER");
cljc.java_time.month.april = cljc.java_time.month.goog$module$goog$object.get(java.time.Month,"APRIL");
cljc.java_time.month.range = (function cljc$java_time$month$range(this14803,java_time_temporal_TemporalField14804){
return this14803.range(java_time_temporal_TemporalField14804);
});
cljc.java_time.month.values = (function cljc$java_time$month$values(){
return cljs.core.js_invoke(java.time.Month,"values");
});
cljc.java_time.month.value_of = (function cljc$java_time$month$value_of(var_args){
var G__115941 = arguments.length;
switch (G__115941) {
case 1:
return cljc.java_time.month.value_of.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return cljc.java_time.month.value_of.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(cljc.java_time.month.value_of.cljs$core$IFn$_invoke$arity$1 = (function (java_lang_String14805){
return cljs.core.js_invoke.cljs$core$IFn$_invoke$arity$variadic(java.time.Month,"valueOf",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([java_lang_String14805], 0));
}));

(cljc.java_time.month.value_of.cljs$core$IFn$_invoke$arity$2 = (function (java_lang_Class14806,java_lang_String14807){
return cljs.core.js_invoke.cljs$core$IFn$_invoke$arity$variadic(java.time.Month,"valueOf",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([java_lang_Class14806,java_lang_String14807], 0));
}));

(cljc.java_time.month.value_of.cljs$lang$maxFixedArity = 2);

cljc.java_time.month.of = (function cljc$java_time$month$of(int14808){
return cljs.core.js_invoke.cljs$core$IFn$_invoke$arity$variadic(java.time.Month,"of",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([int14808], 0));
});
cljc.java_time.month.ordinal = (function cljc$java_time$month$ordinal(this14809){
return this14809.ordinal();
});
cljc.java_time.month.first_month_of_quarter = (function cljc$java_time$month$first_month_of_quarter(this14810){
return this14810.firstMonthOfQuarter();
});
cljc.java_time.month.min_length = (function cljc$java_time$month$min_length(this14811){
return this14811.minLength();
});
cljc.java_time.month.plus = (function cljc$java_time$month$plus(this14812,long14813){
return this14812.plus(long14813);
});
cljc.java_time.month.query = (function cljc$java_time$month$query(this14814,java_time_temporal_TemporalQuery14815){
return this14814.query(java_time_temporal_TemporalQuery14815);
});
cljc.java_time.month.to_string = (function cljc$java_time$month$to_string(this14816){
return this14816.toString();
});
cljc.java_time.month.first_day_of_year = (function cljc$java_time$month$first_day_of_year(this14817,boolean14818){
return this14817.firstDayOfYear(boolean14818);
});
cljc.java_time.month.minus = (function cljc$java_time$month$minus(this14819,long14820){
return this14819.minus(long14820);
});
cljc.java_time.month.get_display_name = (function cljc$java_time$month$get_display_name(this14821,java_time_format_TextStyle14822,java_util_Locale14823){
return this14821.displayName(java_time_format_TextStyle14822,java_util_Locale14823);
});
cljc.java_time.month.get_value = (function cljc$java_time$month$get_value(this14824){
return this14824.value();
});
cljc.java_time.month.max_length = (function cljc$java_time$month$max_length(this14825){
return this14825.maxLength();
});
cljc.java_time.month.name = (function cljc$java_time$month$name(this14826){
return this14826.name();
});
cljc.java_time.month.get_long = (function cljc$java_time$month$get_long(this14827,java_time_temporal_TemporalField14828){
return this14827.getLong(java_time_temporal_TemporalField14828);
});
cljc.java_time.month.length = (function cljc$java_time$month$length(this14829,boolean14830){
return this14829.length(boolean14830);
});
cljc.java_time.month.get_declaring_class = (function cljc$java_time$month$get_declaring_class(this14831){
return this14831.declaringClass();
});
cljc.java_time.month.from = (function cljc$java_time$month$from(java_time_temporal_TemporalAccessor14832){
return cljs.core.js_invoke.cljs$core$IFn$_invoke$arity$variadic(java.time.Month,"from",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([java_time_temporal_TemporalAccessor14832], 0));
});
cljc.java_time.month.is_supported = (function cljc$java_time$month$is_supported(this14833,java_time_temporal_TemporalField14834){
return this14833.isSupported(java_time_temporal_TemporalField14834);
});
cljc.java_time.month.hash_code = (function cljc$java_time$month$hash_code(this14835){
return this14835.hashCode();
});
cljc.java_time.month.adjust_into = (function cljc$java_time$month$adjust_into(this14836,java_time_temporal_Temporal14837){
return this14836.adjustInto(java_time_temporal_Temporal14837);
});
cljc.java_time.month.compare_to = (function cljc$java_time$month$compare_to(this14838,java_lang_Enum14839){
return this14838.compareTo(java_lang_Enum14839);
});
cljc.java_time.month.get = (function cljc$java_time$month$get(this14840,java_time_temporal_TemporalField14841){
return this14840.get(java_time_temporal_TemporalField14841);
});
cljc.java_time.month.equals = (function cljc$java_time$month$equals(this14842,java_lang_Object14843){
return this14842.equals(java_lang_Object14843);
});

//# sourceMappingURL=cljc.java_time.month.js.map
