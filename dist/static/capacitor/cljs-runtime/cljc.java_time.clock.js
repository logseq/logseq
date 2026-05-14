goog.provide('cljc.java_time.clock');
goog.scope(function(){
  cljc.java_time.clock.goog$module$goog$object = goog.module.get('goog.object');
});
cljc.java_time.clock.tick = (function cljc$java_time$clock$tick(java_time_Clock15387,java_time_Duration15388){
return cljs.core.js_invoke.cljs$core$IFn$_invoke$arity$variadic(java.time.Clock,"tick",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([java_time_Clock15387,java_time_Duration15388], 0));
});
cljc.java_time.clock.offset = (function cljc$java_time$clock$offset(java_time_Clock15389,java_time_Duration15390){
return cljs.core.js_invoke.cljs$core$IFn$_invoke$arity$variadic(java.time.Clock,"offset",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([java_time_Clock15389,java_time_Duration15390], 0));
});
cljc.java_time.clock.system_utc = (function cljc$java_time$clock$system_utc(){
return cljs.core.js_invoke(java.time.Clock,"systemUTC");
});
cljc.java_time.clock.system_default_zone = (function cljc$java_time$clock$system_default_zone(){
return cljs.core.js_invoke(java.time.Clock,"systemDefaultZone");
});
cljc.java_time.clock.fixed = (function cljc$java_time$clock$fixed(java_time_Instant15391,java_time_ZoneId15392){
return cljs.core.js_invoke.cljs$core$IFn$_invoke$arity$variadic(java.time.Clock,"fixed",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([java_time_Instant15391,java_time_ZoneId15392], 0));
});
cljc.java_time.clock.tick_minutes = (function cljc$java_time$clock$tick_minutes(java_time_ZoneId15393){
return cljs.core.js_invoke.cljs$core$IFn$_invoke$arity$variadic(java.time.Clock,"tickMinutes",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([java_time_ZoneId15393], 0));
});
cljc.java_time.clock.tick_seconds = (function cljc$java_time$clock$tick_seconds(java_time_ZoneId15394){
return cljs.core.js_invoke.cljs$core$IFn$_invoke$arity$variadic(java.time.Clock,"tickSeconds",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([java_time_ZoneId15394], 0));
});
cljc.java_time.clock.millis = (function cljc$java_time$clock$millis(this15395){
return this15395.millis();
});
cljc.java_time.clock.with_zone = (function cljc$java_time$clock$with_zone(this15396,java_time_ZoneId15397){
return this15396.withZone(java_time_ZoneId15397);
});
cljc.java_time.clock.get_zone = (function cljc$java_time$clock$get_zone(this15398){
return this15398.zone();
});
cljc.java_time.clock.hash_code = (function cljc$java_time$clock$hash_code(this15399){
return this15399.hashCode();
});
cljc.java_time.clock.system = (function cljc$java_time$clock$system(java_time_ZoneId15400){
return cljs.core.js_invoke.cljs$core$IFn$_invoke$arity$variadic(java.time.Clock,"system",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([java_time_ZoneId15400], 0));
});
cljc.java_time.clock.instant = (function cljc$java_time$clock$instant(this15401){
return this15401.instant();
});
cljc.java_time.clock.equals = (function cljc$java_time$clock$equals(this15402,java_lang_Object15403){
return this15402.equals(java_lang_Object15403);
});

//# sourceMappingURL=cljc.java_time.clock.js.map
