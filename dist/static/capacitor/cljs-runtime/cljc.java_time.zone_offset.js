goog.provide('cljc.java_time.zone_offset');
goog.scope(function(){
  cljc.java_time.zone_offset.goog$module$goog$object = goog.module.get('goog.object');
});
cljc.java_time.zone_offset.max = cljc.java_time.zone_offset.goog$module$goog$object.get(java.time.ZoneOffset,"MAX");
cljc.java_time.zone_offset.min = cljc.java_time.zone_offset.goog$module$goog$object.get(java.time.ZoneOffset,"MIN");
cljc.java_time.zone_offset.utc = cljc.java_time.zone_offset.goog$module$goog$object.get(java.time.ZoneOffset,"UTC");
cljc.java_time.zone_offset.get_available_zone_ids = (function cljc$java_time$zone_offset$get_available_zone_ids(){
return cljs.core.js_invoke(java.time.ZoneOffset,"getAvailableZoneIds");
});
cljc.java_time.zone_offset.range = (function cljc$java_time$zone_offset$range(this15444,java_time_temporal_TemporalField15445){
return this15444.range(java_time_temporal_TemporalField15445);
});
cljc.java_time.zone_offset.of_total_seconds = (function cljc$java_time$zone_offset$of_total_seconds(int15446){
return cljs.core.js_invoke.cljs$core$IFn$_invoke$arity$variadic(java.time.ZoneOffset,"ofTotalSeconds",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([int15446], 0));
});
cljc.java_time.zone_offset.of = (function cljc$java_time$zone_offset$of(var_args){
var G__115353 = arguments.length;
switch (G__115353) {
case 1:
return cljc.java_time.zone_offset.of.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return cljc.java_time.zone_offset.of.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(cljc.java_time.zone_offset.of.cljs$core$IFn$_invoke$arity$1 = (function (G__15448){
return cljs.core.js_invoke.cljs$core$IFn$_invoke$arity$variadic(java.time.ZoneOffset,"of",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([G__15448], 0));
}));

(cljc.java_time.zone_offset.of.cljs$core$IFn$_invoke$arity$2 = (function (java_lang_String15449,java_util_Map15450){
return cljs.core.js_invoke.cljs$core$IFn$_invoke$arity$variadic(java.time.ZoneOffset,"of",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([java_lang_String15449,java_util_Map15450], 0));
}));

(cljc.java_time.zone_offset.of.cljs$lang$maxFixedArity = 2);

cljc.java_time.zone_offset.of_offset = (function cljc$java_time$zone_offset$of_offset(java_lang_String15451,java_time_ZoneOffset15452){
return cljs.core.js_invoke.cljs$core$IFn$_invoke$arity$variadic(java.time.ZoneOffset,"ofOffset",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([java_lang_String15451,java_time_ZoneOffset15452], 0));
});
cljc.java_time.zone_offset.query = (function cljc$java_time$zone_offset$query(this15453,java_time_temporal_TemporalQuery15454){
return this15453.query(java_time_temporal_TemporalQuery15454);
});
cljc.java_time.zone_offset.to_string = (function cljc$java_time$zone_offset$to_string(this15455){
return this15455.toString();
});
cljc.java_time.zone_offset.get_display_name = (function cljc$java_time$zone_offset$get_display_name(this15456,java_time_format_TextStyle15457,java_util_Locale15458){
return this15456.displayName(java_time_format_TextStyle15457,java_util_Locale15458);
});
cljc.java_time.zone_offset.get_long = (function cljc$java_time$zone_offset$get_long(this15459,java_time_temporal_TemporalField15460){
return this15459.getLong(java_time_temporal_TemporalField15460);
});
cljc.java_time.zone_offset.get_rules = (function cljc$java_time$zone_offset$get_rules(this15461){
return this15461.rules();
});
cljc.java_time.zone_offset.of_hours = (function cljc$java_time$zone_offset$of_hours(int15462){
return cljs.core.js_invoke.cljs$core$IFn$_invoke$arity$variadic(java.time.ZoneOffset,"ofHours",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([int15462], 0));
});
cljc.java_time.zone_offset.get_id = (function cljc$java_time$zone_offset$get_id(this15463){
return this15463.id();
});
cljc.java_time.zone_offset.normalized = (function cljc$java_time$zone_offset$normalized(this15464){
return this15464.normalized();
});
cljc.java_time.zone_offset.system_default = (function cljc$java_time$zone_offset$system_default(){
return cljs.core.js_invoke(java.time.ZoneOffset,"systemDefault");
});
cljc.java_time.zone_offset.from = (function cljc$java_time$zone_offset$from(G__15466){
return cljs.core.js_invoke.cljs$core$IFn$_invoke$arity$variadic(java.time.ZoneOffset,"from",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([G__15466], 0));
});
cljc.java_time.zone_offset.of_hours_minutes_seconds = (function cljc$java_time$zone_offset$of_hours_minutes_seconds(int15467,int15468,int15469){
return cljs.core.js_invoke.cljs$core$IFn$_invoke$arity$variadic(java.time.ZoneOffset,"ofHoursMinutesSeconds",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([int15467,int15468,int15469], 0));
});
cljc.java_time.zone_offset.is_supported = (function cljc$java_time$zone_offset$is_supported(this15470,java_time_temporal_TemporalField15471){
return this15470.isSupported(java_time_temporal_TemporalField15471);
});
cljc.java_time.zone_offset.hash_code = (function cljc$java_time$zone_offset$hash_code(this15472){
return this15472.hashCode();
});
cljc.java_time.zone_offset.get_total_seconds = (function cljc$java_time$zone_offset$get_total_seconds(this15473){
return this15473.totalSeconds();
});
cljc.java_time.zone_offset.adjust_into = (function cljc$java_time$zone_offset$adjust_into(this15474,java_time_temporal_Temporal15475){
return this15474.adjustInto(java_time_temporal_Temporal15475);
});
cljc.java_time.zone_offset.of_hours_minutes = (function cljc$java_time$zone_offset$of_hours_minutes(int15476,int15477){
return cljs.core.js_invoke.cljs$core$IFn$_invoke$arity$variadic(java.time.ZoneOffset,"ofHoursMinutes",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([int15476,int15477], 0));
});
cljc.java_time.zone_offset.compare_to = (function cljc$java_time$zone_offset$compare_to(this15478,java_time_ZoneOffset15479){
return this15478.compareTo(java_time_ZoneOffset15479);
});
cljc.java_time.zone_offset.get = (function cljc$java_time$zone_offset$get(this15480,java_time_temporal_TemporalField15481){
return this15480.get(java_time_temporal_TemporalField15481);
});
cljc.java_time.zone_offset.equals = (function cljc$java_time$zone_offset$equals(this15482,java_lang_Object15483){
return this15482.equals(java_lang_Object15483);
});

//# sourceMappingURL=cljc.java_time.zone_offset.js.map
