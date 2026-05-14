goog.provide('cljc.java_time.period');
goog.scope(function(){
  cljc.java_time.period.goog$module$goog$object = goog.module.get('goog.object');
});
cljc.java_time.period.zero = cljc.java_time.period.goog$module$goog$object.get(java.time.Period,"ZERO");
cljc.java_time.period.get_months = (function cljc$java_time$period$get_months(this12987){
return this12987.months();
});
cljc.java_time.period.of_weeks = (function cljc$java_time$period$of_weeks(int12988){
return cljs.core.js_invoke.cljs$core$IFn$_invoke$arity$variadic(java.time.Period,"ofWeeks",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([int12988], 0));
});
cljc.java_time.period.of_days = (function cljc$java_time$period$of_days(int12989){
return cljs.core.js_invoke.cljs$core$IFn$_invoke$arity$variadic(java.time.Period,"ofDays",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([int12989], 0));
});
cljc.java_time.period.is_negative = (function cljc$java_time$period$is_negative(this12990){
return this12990.isNegative();
});
cljc.java_time.period.of = (function cljc$java_time$period$of(int12991,int12992,int12993){
return cljs.core.js_invoke.cljs$core$IFn$_invoke$arity$variadic(java.time.Period,"of",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([int12991,int12992,int12993], 0));
});
cljc.java_time.period.is_zero = (function cljc$java_time$period$is_zero(this12994){
return this12994.isZero();
});
cljc.java_time.period.multiplied_by = (function cljc$java_time$period$multiplied_by(this12995,int12996){
return this12995.multipliedBy(int12996);
});
cljc.java_time.period.get_units = (function cljc$java_time$period$get_units(this12997){
return this12997.units();
});
cljc.java_time.period.with_days = (function cljc$java_time$period$with_days(this12998,int12999){
return this12998.withDays(int12999);
});
cljc.java_time.period.plus = (function cljc$java_time$period$plus(this13000,java_time_temporal_TemporalAmount13001){
return this13000.plus(java_time_temporal_TemporalAmount13001);
});
cljc.java_time.period.of_months = (function cljc$java_time$period$of_months(int13002){
return cljs.core.js_invoke.cljs$core$IFn$_invoke$arity$variadic(java.time.Period,"ofMonths",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([int13002], 0));
});
cljc.java_time.period.to_string = (function cljc$java_time$period$to_string(this13003){
return this13003.toString();
});
cljc.java_time.period.plus_months = (function cljc$java_time$period$plus_months(this13004,long13005){
return this13004.plusMonths(long13005);
});
cljc.java_time.period.minus_months = (function cljc$java_time$period$minus_months(this13006,long13007){
return this13006.minusMonths(long13007);
});
cljc.java_time.period.minus = (function cljc$java_time$period$minus(this13008,java_time_temporal_TemporalAmount13009){
return this13008.minus(java_time_temporal_TemporalAmount13009);
});
cljc.java_time.period.add_to = (function cljc$java_time$period$add_to(this13010,java_time_temporal_Temporal13011){
return this13010.addTo(java_time_temporal_Temporal13011);
});
cljc.java_time.period.to_total_months = (function cljc$java_time$period$to_total_months(this13012){
return this13012.toTotalMonths();
});
cljc.java_time.period.plus_days = (function cljc$java_time$period$plus_days(this13013,long13014){
return this13013.plusDays(long13014);
});
cljc.java_time.period.of_years = (function cljc$java_time$period$of_years(int13015){
return cljs.core.js_invoke.cljs$core$IFn$_invoke$arity$variadic(java.time.Period,"ofYears",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([int13015], 0));
});
cljc.java_time.period.get_days = (function cljc$java_time$period$get_days(this13016){
return this13016.days();
});
cljc.java_time.period.negated = (function cljc$java_time$period$negated(this13017){
return this13017.negated();
});
cljc.java_time.period.get_years = (function cljc$java_time$period$get_years(this13018){
return this13018.years();
});
cljc.java_time.period.with_years = (function cljc$java_time$period$with_years(this13019,int13020){
return this13019.withYears(int13020);
});
cljc.java_time.period.normalized = (function cljc$java_time$period$normalized(this13021){
return this13021.normalized();
});
cljc.java_time.period.with_months = (function cljc$java_time$period$with_months(this13022,int13023){
return this13022.withMonths(int13023);
});
cljc.java_time.period.between = (function cljc$java_time$period$between(java_time_LocalDate13024,java_time_LocalDate13025){
return cljs.core.js_invoke.cljs$core$IFn$_invoke$arity$variadic(java.time.Period,"between",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([java_time_LocalDate13024,java_time_LocalDate13025], 0));
});
cljc.java_time.period.from = (function cljc$java_time$period$from(java_time_temporal_TemporalAmount13026){
return cljs.core.js_invoke.cljs$core$IFn$_invoke$arity$variadic(java.time.Period,"from",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([java_time_temporal_TemporalAmount13026], 0));
});
cljc.java_time.period.minus_years = (function cljc$java_time$period$minus_years(this13027,long13028){
return this13027.minusYears(long13028);
});
cljc.java_time.period.get_chronology = (function cljc$java_time$period$get_chronology(this13029){
return this13029.chronology();
});
cljc.java_time.period.parse = (function cljc$java_time$period$parse(java_lang_CharSequence13030){
return cljs.core.js_invoke.cljs$core$IFn$_invoke$arity$variadic(java.time.Period,"parse",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([java_lang_CharSequence13030], 0));
});
cljc.java_time.period.hash_code = (function cljc$java_time$period$hash_code(this13031){
return this13031.hashCode();
});
cljc.java_time.period.subtract_from = (function cljc$java_time$period$subtract_from(this13032,java_time_temporal_Temporal13033){
return this13032.subtractFrom(java_time_temporal_Temporal13033);
});
cljc.java_time.period.get = (function cljc$java_time$period$get(this13034,java_time_temporal_TemporalUnit13035){
return this13034.get(java_time_temporal_TemporalUnit13035);
});
cljc.java_time.period.equals = (function cljc$java_time$period$equals(this13036,java_lang_Object13037){
return this13036.equals(java_lang_Object13037);
});
cljc.java_time.period.plus_years = (function cljc$java_time$period$plus_years(this13038,long13039){
return this13038.plusYears(long13039);
});
cljc.java_time.period.minus_days = (function cljc$java_time$period$minus_days(this13040,long13041){
return this13040.minusDays(long13041);
});

//# sourceMappingURL=cljc.java_time.period.js.map
