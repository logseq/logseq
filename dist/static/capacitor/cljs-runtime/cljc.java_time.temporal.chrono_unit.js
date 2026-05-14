goog.provide('cljc.java_time.temporal.chrono_unit');
goog.scope(function(){
  cljc.java_time.temporal.chrono_unit.goog$module$goog$object = goog.module.get('goog.object');
});
cljc.java_time.temporal.chrono_unit.millis = cljc.java_time.temporal.chrono_unit.goog$module$goog$object.get(java.time.temporal.ChronoUnit,"MILLIS");
cljc.java_time.temporal.chrono_unit.minutes = cljc.java_time.temporal.chrono_unit.goog$module$goog$object.get(java.time.temporal.ChronoUnit,"MINUTES");
cljc.java_time.temporal.chrono_unit.micros = cljc.java_time.temporal.chrono_unit.goog$module$goog$object.get(java.time.temporal.ChronoUnit,"MICROS");
cljc.java_time.temporal.chrono_unit.half_days = cljc.java_time.temporal.chrono_unit.goog$module$goog$object.get(java.time.temporal.ChronoUnit,"HALF_DAYS");
cljc.java_time.temporal.chrono_unit.millennia = cljc.java_time.temporal.chrono_unit.goog$module$goog$object.get(java.time.temporal.ChronoUnit,"MILLENNIA");
cljc.java_time.temporal.chrono_unit.years = cljc.java_time.temporal.chrono_unit.goog$module$goog$object.get(java.time.temporal.ChronoUnit,"YEARS");
cljc.java_time.temporal.chrono_unit.decades = cljc.java_time.temporal.chrono_unit.goog$module$goog$object.get(java.time.temporal.ChronoUnit,"DECADES");
cljc.java_time.temporal.chrono_unit.days = cljc.java_time.temporal.chrono_unit.goog$module$goog$object.get(java.time.temporal.ChronoUnit,"DAYS");
cljc.java_time.temporal.chrono_unit.centuries = cljc.java_time.temporal.chrono_unit.goog$module$goog$object.get(java.time.temporal.ChronoUnit,"CENTURIES");
cljc.java_time.temporal.chrono_unit.weeks = cljc.java_time.temporal.chrono_unit.goog$module$goog$object.get(java.time.temporal.ChronoUnit,"WEEKS");
cljc.java_time.temporal.chrono_unit.hours = cljc.java_time.temporal.chrono_unit.goog$module$goog$object.get(java.time.temporal.ChronoUnit,"HOURS");
cljc.java_time.temporal.chrono_unit.eras = cljc.java_time.temporal.chrono_unit.goog$module$goog$object.get(java.time.temporal.ChronoUnit,"ERAS");
cljc.java_time.temporal.chrono_unit.seconds = cljc.java_time.temporal.chrono_unit.goog$module$goog$object.get(java.time.temporal.ChronoUnit,"SECONDS");
cljc.java_time.temporal.chrono_unit.months = cljc.java_time.temporal.chrono_unit.goog$module$goog$object.get(java.time.temporal.ChronoUnit,"MONTHS");
cljc.java_time.temporal.chrono_unit.nanos = cljc.java_time.temporal.chrono_unit.goog$module$goog$object.get(java.time.temporal.ChronoUnit,"NANOS");
cljc.java_time.temporal.chrono_unit.forever = cljc.java_time.temporal.chrono_unit.goog$module$goog$object.get(java.time.temporal.ChronoUnit,"FOREVER");
cljc.java_time.temporal.chrono_unit.values = (function cljc$java_time$temporal$chrono_unit$values(){
return cljs.core.js_invoke(java.time.temporal.ChronoUnit,"values");
});
cljc.java_time.temporal.chrono_unit.value_of = (function cljc$java_time$temporal$chrono_unit$value_of(var_args){
var G__118005 = arguments.length;
switch (G__118005) {
case 1:
return cljc.java_time.temporal.chrono_unit.value_of.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return cljc.java_time.temporal.chrono_unit.value_of.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(cljc.java_time.temporal.chrono_unit.value_of.cljs$core$IFn$_invoke$arity$1 = (function (java_lang_String15596){
return cljs.core.js_invoke.cljs$core$IFn$_invoke$arity$variadic(java.time.temporal.ChronoUnit,"valueOf",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([java_lang_String15596], 0));
}));

(cljc.java_time.temporal.chrono_unit.value_of.cljs$core$IFn$_invoke$arity$2 = (function (java_lang_Class15597,java_lang_String15598){
return cljs.core.js_invoke.cljs$core$IFn$_invoke$arity$variadic(java.time.temporal.ChronoUnit,"valueOf",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([java_lang_Class15597,java_lang_String15598], 0));
}));

(cljc.java_time.temporal.chrono_unit.value_of.cljs$lang$maxFixedArity = 2);

cljc.java_time.temporal.chrono_unit.ordinal = (function cljc$java_time$temporal$chrono_unit$ordinal(this15599){
return this15599.ordinal();
});
cljc.java_time.temporal.chrono_unit.is_duration_estimated = (function cljc$java_time$temporal$chrono_unit$is_duration_estimated(this15600){
return this15600.isDurationEstimated();
});
cljc.java_time.temporal.chrono_unit.to_string = (function cljc$java_time$temporal$chrono_unit$to_string(this15601){
return this15601.toString();
});
cljc.java_time.temporal.chrono_unit.is_date_based = (function cljc$java_time$temporal$chrono_unit$is_date_based(this15602){
return this15602.isDateBased();
});
cljc.java_time.temporal.chrono_unit.add_to = (function cljc$java_time$temporal$chrono_unit$add_to(this15603,java_time_temporal_Temporal15604,long15605){
return this15603.addTo(java_time_temporal_Temporal15604,long15605);
});
cljc.java_time.temporal.chrono_unit.name = (function cljc$java_time$temporal$chrono_unit$name(this15606){
return this15606.name();
});
cljc.java_time.temporal.chrono_unit.is_supported_by = (function cljc$java_time$temporal$chrono_unit$is_supported_by(this15607,java_time_temporal_Temporal15608){
return this15607.isSupportedBy(java_time_temporal_Temporal15608);
});
cljc.java_time.temporal.chrono_unit.get_declaring_class = (function cljc$java_time$temporal$chrono_unit$get_declaring_class(this15609){
return this15609.declaringClass();
});
cljc.java_time.temporal.chrono_unit.between = (function cljc$java_time$temporal$chrono_unit$between(this15610,java_time_temporal_Temporal15611,java_time_temporal_Temporal15612){
return this15610.between(java_time_temporal_Temporal15611,java_time_temporal_Temporal15612);
});
cljc.java_time.temporal.chrono_unit.hash_code = (function cljc$java_time$temporal$chrono_unit$hash_code(this15613){
return this15613.hashCode();
});
cljc.java_time.temporal.chrono_unit.compare_to = (function cljc$java_time$temporal$chrono_unit$compare_to(this15614,java_lang_Enum15615){
return this15614.compareTo(java_lang_Enum15615);
});
cljc.java_time.temporal.chrono_unit.get_duration = (function cljc$java_time$temporal$chrono_unit$get_duration(this15616){
return this15616.duration();
});
cljc.java_time.temporal.chrono_unit.equals = (function cljc$java_time$temporal$chrono_unit$equals(this15617,java_lang_Object15618){
return this15617.equals(java_lang_Object15618);
});
cljc.java_time.temporal.chrono_unit.is_time_based = (function cljc$java_time$temporal$chrono_unit$is_time_based(this15619){
return this15619.isTimeBased();
});

//# sourceMappingURL=cljc.java_time.temporal.chrono_unit.js.map
