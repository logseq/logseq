goog.provide('cljc.java_time.local_time');
goog.scope(function(){
  cljc.java_time.local_time.goog$module$goog$object = goog.module.get('goog.object');
});
cljc.java_time.local_time.max = cljc.java_time.local_time.goog$module$goog$object.get(java.time.LocalTime,"MAX");
cljc.java_time.local_time.noon = cljc.java_time.local_time.goog$module$goog$object.get(java.time.LocalTime,"NOON");
cljc.java_time.local_time.midnight = cljc.java_time.local_time.goog$module$goog$object.get(java.time.LocalTime,"MIDNIGHT");
cljc.java_time.local_time.min = cljc.java_time.local_time.goog$module$goog$object.get(java.time.LocalTime,"MIN");
cljc.java_time.local_time.minus_minutes = (function cljc$java_time$local_time$minus_minutes(this14667,long14668){
return this14667.minusMinutes(long14668);
});
cljc.java_time.local_time.truncated_to = (function cljc$java_time$local_time$truncated_to(this14669,java_time_temporal_TemporalUnit14670){
return this14669.truncatedTo(java_time_temporal_TemporalUnit14670);
});
cljc.java_time.local_time.range = (function cljc$java_time$local_time$range(this14671,java_time_temporal_TemporalField14672){
return this14671.range(java_time_temporal_TemporalField14672);
});
cljc.java_time.local_time.get_hour = (function cljc$java_time$local_time$get_hour(this14673){
return this14673.hour();
});
cljc.java_time.local_time.at_offset = (function cljc$java_time$local_time$at_offset(this14674,java_time_ZoneOffset14675){
return this14674.atOffset(java_time_ZoneOffset14675);
});
cljc.java_time.local_time.minus_hours = (function cljc$java_time$local_time$minus_hours(this14676,long14677){
return this14676.minusHours(long14677);
});
cljc.java_time.local_time.of = (function cljc$java_time$local_time$of(var_args){
var G__120788 = arguments.length;
switch (G__120788) {
case 3:
return cljc.java_time.local_time.of.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
case 2:
return cljc.java_time.local_time.of.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 4:
return cljc.java_time.local_time.of.cljs$core$IFn$_invoke$arity$4((arguments[(0)]),(arguments[(1)]),(arguments[(2)]),(arguments[(3)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(cljc.java_time.local_time.of.cljs$core$IFn$_invoke$arity$3 = (function (int14678,int14679,int14680){
return cljs.core.js_invoke.cljs$core$IFn$_invoke$arity$variadic(java.time.LocalTime,"of",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([int14678,int14679,int14680], 0));
}));

(cljc.java_time.local_time.of.cljs$core$IFn$_invoke$arity$2 = (function (int14681,int14682){
return cljs.core.js_invoke.cljs$core$IFn$_invoke$arity$variadic(java.time.LocalTime,"of",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([int14681,int14682], 0));
}));

(cljc.java_time.local_time.of.cljs$core$IFn$_invoke$arity$4 = (function (int14683,int14684,int14685,int14686){
return cljs.core.js_invoke.cljs$core$IFn$_invoke$arity$variadic(java.time.LocalTime,"of",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([int14683,int14684,int14685,int14686], 0));
}));

(cljc.java_time.local_time.of.cljs$lang$maxFixedArity = 4);

cljc.java_time.local_time.get_nano = (function cljc$java_time$local_time$get_nano(this14687){
return this14687.nano();
});
cljc.java_time.local_time.minus_seconds = (function cljc$java_time$local_time$minus_seconds(this14688,long14689){
return this14688.minusSeconds(long14689);
});
cljc.java_time.local_time.get_second = (function cljc$java_time$local_time$get_second(this14690){
return this14690.second();
});
cljc.java_time.local_time.plus_nanos = (function cljc$java_time$local_time$plus_nanos(this14691,long14692){
return this14691.plusNanos(long14692);
});
cljc.java_time.local_time.plus = (function cljc$java_time$local_time$plus(var_args){
var G__120790 = arguments.length;
switch (G__120790) {
case 2:
return cljc.java_time.local_time.plus.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return cljc.java_time.local_time.plus.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(cljc.java_time.local_time.plus.cljs$core$IFn$_invoke$arity$2 = (function (this14693,java_time_temporal_TemporalAmount14694){
return this14693.plus(java_time_temporal_TemporalAmount14694);
}));

(cljc.java_time.local_time.plus.cljs$core$IFn$_invoke$arity$3 = (function (this14695,long14696,java_time_temporal_TemporalUnit14697){
return this14695.plus(long14696,java_time_temporal_TemporalUnit14697);
}));

(cljc.java_time.local_time.plus.cljs$lang$maxFixedArity = 3);

cljc.java_time.local_time.with_hour = (function cljc$java_time$local_time$with_hour(this14698,int14699){
return this14698.withHour(int14699);
});
cljc.java_time.local_time.with_minute = (function cljc$java_time$local_time$with_minute(this14700,int14701){
return this14700.withMinute(int14701);
});
cljc.java_time.local_time.plus_minutes = (function cljc$java_time$local_time$plus_minutes(this14702,long14703){
return this14702.plusMinutes(long14703);
});
cljc.java_time.local_time.query = (function cljc$java_time$local_time$query(this14704,java_time_temporal_TemporalQuery14705){
return this14704.query(java_time_temporal_TemporalQuery14705);
});
cljc.java_time.local_time.at_date = (function cljc$java_time$local_time$at_date(this14706,java_time_LocalDate14707){
return this14706.atDate(java_time_LocalDate14707);
});
cljc.java_time.local_time.to_string = (function cljc$java_time$local_time$to_string(this14708){
return this14708.toString();
});
cljc.java_time.local_time.is_before = (function cljc$java_time$local_time$is_before(this14709,java_time_LocalTime14710){
return this14709.isBefore(java_time_LocalTime14710);
});
cljc.java_time.local_time.minus = (function cljc$java_time$local_time$minus(var_args){
var G__120798 = arguments.length;
switch (G__120798) {
case 3:
return cljc.java_time.local_time.minus.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
case 2:
return cljc.java_time.local_time.minus.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(cljc.java_time.local_time.minus.cljs$core$IFn$_invoke$arity$3 = (function (this14711,long14712,java_time_temporal_TemporalUnit14713){
return this14711.minus(long14712,java_time_temporal_TemporalUnit14713);
}));

(cljc.java_time.local_time.minus.cljs$core$IFn$_invoke$arity$2 = (function (this14714,java_time_temporal_TemporalAmount14715){
return this14714.minus(java_time_temporal_TemporalAmount14715);
}));

(cljc.java_time.local_time.minus.cljs$lang$maxFixedArity = 3);

cljc.java_time.local_time.plus_hours = (function cljc$java_time$local_time$plus_hours(this14716,long14717){
return this14716.plusHours(long14717);
});
cljc.java_time.local_time.to_second_of_day = (function cljc$java_time$local_time$to_second_of_day(this14718){
return this14718.toSecondOfDay();
});
cljc.java_time.local_time.get_long = (function cljc$java_time$local_time$get_long(this14719,java_time_temporal_TemporalField14720){
return this14719.getLong(java_time_temporal_TemporalField14720);
});
cljc.java_time.local_time.with_nano = (function cljc$java_time$local_time$with_nano(this14721,int14722){
return this14721.withNano(int14722);
});
cljc.java_time.local_time.until = (function cljc$java_time$local_time$until(this14723,java_time_temporal_Temporal14724,java_time_temporal_TemporalUnit14725){
return this14723.until(java_time_temporal_Temporal14724,java_time_temporal_TemporalUnit14725);
});
cljc.java_time.local_time.of_nano_of_day = (function cljc$java_time$local_time$of_nano_of_day(long14726){
return cljs.core.js_invoke.cljs$core$IFn$_invoke$arity$variadic(java.time.LocalTime,"ofNanoOfDay",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([long14726], 0));
});
cljc.java_time.local_time.from = (function cljc$java_time$local_time$from(java_time_temporal_TemporalAccessor14727){
return cljs.core.js_invoke.cljs$core$IFn$_invoke$arity$variadic(java.time.LocalTime,"from",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([java_time_temporal_TemporalAccessor14727], 0));
});
cljc.java_time.local_time.is_after = (function cljc$java_time$local_time$is_after(this14728,java_time_LocalTime14729){
return this14728.isAfter(java_time_LocalTime14729);
});
cljc.java_time.local_time.minus_nanos = (function cljc$java_time$local_time$minus_nanos(this14730,long14731){
return this14730.minusNanos(long14731);
});
cljc.java_time.local_time.is_supported = (function cljc$java_time$local_time$is_supported(this14732,G__14733){
return this14732.isSupported(G__14733);
});
cljc.java_time.local_time.parse = (function cljc$java_time$local_time$parse(var_args){
var G__120806 = arguments.length;
switch (G__120806) {
case 1:
return cljc.java_time.local_time.parse.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return cljc.java_time.local_time.parse.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(cljc.java_time.local_time.parse.cljs$core$IFn$_invoke$arity$1 = (function (java_lang_CharSequence14734){
return cljs.core.js_invoke.cljs$core$IFn$_invoke$arity$variadic(java.time.LocalTime,"parse",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([java_lang_CharSequence14734], 0));
}));

(cljc.java_time.local_time.parse.cljs$core$IFn$_invoke$arity$2 = (function (java_lang_CharSequence14735,java_time_format_DateTimeFormatter14736){
return cljs.core.js_invoke.cljs$core$IFn$_invoke$arity$variadic(java.time.LocalTime,"parse",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([java_lang_CharSequence14735,java_time_format_DateTimeFormatter14736], 0));
}));

(cljc.java_time.local_time.parse.cljs$lang$maxFixedArity = 2);

cljc.java_time.local_time.with_second = (function cljc$java_time$local_time$with_second(this14737,int14738){
return this14737.withSecond(int14738);
});
cljc.java_time.local_time.get_minute = (function cljc$java_time$local_time$get_minute(this14739){
return this14739.minute();
});
cljc.java_time.local_time.hash_code = (function cljc$java_time$local_time$hash_code(this14740){
return this14740.hashCode();
});
cljc.java_time.local_time.adjust_into = (function cljc$java_time$local_time$adjust_into(this14741,java_time_temporal_Temporal14742){
return this14741.adjustInto(java_time_temporal_Temporal14742);
});
cljc.java_time.local_time.with$ = (function cljc$java_time$local_time$with(var_args){
var G__120810 = arguments.length;
switch (G__120810) {
case 3:
return cljc.java_time.local_time.with$.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
case 2:
return cljc.java_time.local_time.with$.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(cljc.java_time.local_time.with$.cljs$core$IFn$_invoke$arity$3 = (function (this14743,java_time_temporal_TemporalField14744,long14745){
return this14743.with(java_time_temporal_TemporalField14744,long14745);
}));

(cljc.java_time.local_time.with$.cljs$core$IFn$_invoke$arity$2 = (function (this14746,java_time_temporal_TemporalAdjuster14747){
return this14746.with(java_time_temporal_TemporalAdjuster14747);
}));

(cljc.java_time.local_time.with$.cljs$lang$maxFixedArity = 3);

cljc.java_time.local_time.now = (function cljc$java_time$local_time$now(var_args){
var G__120814 = arguments.length;
switch (G__120814) {
case 0:
return cljc.java_time.local_time.now.cljs$core$IFn$_invoke$arity$0();

break;
case 1:
return cljc.java_time.local_time.now.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(cljc.java_time.local_time.now.cljs$core$IFn$_invoke$arity$0 = (function (){
return cljs.core.js_invoke(java.time.LocalTime,"now");
}));

(cljc.java_time.local_time.now.cljs$core$IFn$_invoke$arity$1 = (function (G__14749){
return cljs.core.js_invoke.cljs$core$IFn$_invoke$arity$variadic(java.time.LocalTime,"now",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([G__14749], 0));
}));

(cljc.java_time.local_time.now.cljs$lang$maxFixedArity = 1);

cljc.java_time.local_time.compare_to = (function cljc$java_time$local_time$compare_to(this14750,java_time_LocalTime14751){
return this14750.compareTo(java_time_LocalTime14751);
});
cljc.java_time.local_time.to_nano_of_day = (function cljc$java_time$local_time$to_nano_of_day(this14752){
return this14752.toNanoOfDay();
});
cljc.java_time.local_time.plus_seconds = (function cljc$java_time$local_time$plus_seconds(this14753,long14754){
return this14753.plusSeconds(long14754);
});
cljc.java_time.local_time.get = (function cljc$java_time$local_time$get(this14755,java_time_temporal_TemporalField14756){
return this14755.get(java_time_temporal_TemporalField14756);
});
cljc.java_time.local_time.of_second_of_day = (function cljc$java_time$local_time$of_second_of_day(long14757){
return cljs.core.js_invoke.cljs$core$IFn$_invoke$arity$variadic(java.time.LocalTime,"ofSecondOfDay",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([long14757], 0));
});
cljc.java_time.local_time.equals = (function cljc$java_time$local_time$equals(this14758,java_lang_Object14759){
return this14758.equals(java_lang_Object14759);
});
cljc.java_time.local_time.format = (function cljc$java_time$local_time$format(this14760,java_time_format_DateTimeFormatter14761){
return this14760.format(java_time_format_DateTimeFormatter14761);
});

//# sourceMappingURL=cljc.java_time.local_time.js.map
