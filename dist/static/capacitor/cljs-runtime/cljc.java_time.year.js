goog.provide('cljc.java_time.year');
goog.scope(function(){
  cljc.java_time.year.goog$module$goog$object = goog.module.get('goog.object');
});
cljc.java_time.year.min_value = cljc.java_time.year.goog$module$goog$object.get(java.time.Year,"MIN_VALUE");
cljc.java_time.year.max_value = cljc.java_time.year.goog$module$goog$object.get(java.time.Year,"MAX_VALUE");
cljc.java_time.year.range = (function cljc$java_time$year$range(this15159,java_time_temporal_TemporalField15160){
return this15159.range(java_time_temporal_TemporalField15160);
});
cljc.java_time.year.of = (function cljc$java_time$year$of(int15161){
return cljs.core.js_invoke.cljs$core$IFn$_invoke$arity$variadic(java.time.Year,"of",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([int15161], 0));
});
cljc.java_time.year.at_day = (function cljc$java_time$year$at_day(this15162,int15163){
return this15162.atDay(int15163);
});
cljc.java_time.year.plus = (function cljc$java_time$year$plus(var_args){
var G__116004 = arguments.length;
switch (G__116004) {
case 2:
return cljc.java_time.year.plus.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return cljc.java_time.year.plus.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(cljc.java_time.year.plus.cljs$core$IFn$_invoke$arity$2 = (function (this15164,java_time_temporal_TemporalAmount15165){
return this15164.plus(java_time_temporal_TemporalAmount15165);
}));

(cljc.java_time.year.plus.cljs$core$IFn$_invoke$arity$3 = (function (this15166,long15167,java_time_temporal_TemporalUnit15168){
return this15166.plus(long15167,java_time_temporal_TemporalUnit15168);
}));

(cljc.java_time.year.plus.cljs$lang$maxFixedArity = 3);

cljc.java_time.year.is_valid_month_day = (function cljc$java_time$year$is_valid_month_day(this15169,java_time_MonthDay15170){
return this15169.isValidMonthDay(java_time_MonthDay15170);
});
cljc.java_time.year.query = (function cljc$java_time$year$query(this15171,java_time_temporal_TemporalQuery15172){
return this15171.query(java_time_temporal_TemporalQuery15172);
});
cljc.java_time.year.is_leap = (function cljc$java_time$year$is_leap(long57050){
return java.time.Year.isLeap(long57050);
});
cljc.java_time.year.to_string = (function cljc$java_time$year$to_string(this15173){
return this15173.toString();
});
cljc.java_time.year.is_before = (function cljc$java_time$year$is_before(this15174,java_time_Year15175){
return this15174.isBefore(java_time_Year15175);
});
cljc.java_time.year.minus = (function cljc$java_time$year$minus(var_args){
var G__116023 = arguments.length;
switch (G__116023) {
case 2:
return cljc.java_time.year.minus.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return cljc.java_time.year.minus.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(cljc.java_time.year.minus.cljs$core$IFn$_invoke$arity$2 = (function (this15176,java_time_temporal_TemporalAmount15177){
return this15176.minus(java_time_temporal_TemporalAmount15177);
}));

(cljc.java_time.year.minus.cljs$core$IFn$_invoke$arity$3 = (function (this15178,long15179,java_time_temporal_TemporalUnit15180){
return this15178.minus(long15179,java_time_temporal_TemporalUnit15180);
}));

(cljc.java_time.year.minus.cljs$lang$maxFixedArity = 3);

cljc.java_time.year.at_month_day = (function cljc$java_time$year$at_month_day(this15181,java_time_MonthDay15182){
return this15181.atMonthDay(java_time_MonthDay15182);
});
cljc.java_time.year.get_value = (function cljc$java_time$year$get_value(this15183){
return this15183.value();
});
cljc.java_time.year.get_long = (function cljc$java_time$year$get_long(this15184,java_time_temporal_TemporalField15185){
return this15184.getLong(java_time_temporal_TemporalField15185);
});
cljc.java_time.year.at_month = (function cljc$java_time$year$at_month(this15186,G__15187){
return this15186.atMonth(G__15187);
});
cljc.java_time.year.until = (function cljc$java_time$year$until(this15188,java_time_temporal_Temporal15189,java_time_temporal_TemporalUnit15190){
return this15188.until(java_time_temporal_Temporal15189,java_time_temporal_TemporalUnit15190);
});
cljc.java_time.year.length = (function cljc$java_time$year$length(this15191){
return this15191.length();
});
cljc.java_time.year.from = (function cljc$java_time$year$from(java_time_temporal_TemporalAccessor15192){
return cljs.core.js_invoke.cljs$core$IFn$_invoke$arity$variadic(java.time.Year,"from",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([java_time_temporal_TemporalAccessor15192], 0));
});
cljc.java_time.year.is_after = (function cljc$java_time$year$is_after(this15193,java_time_Year15194){
return this15193.isAfter(java_time_Year15194);
});
cljc.java_time.year.is_supported = (function cljc$java_time$year$is_supported(this15195,G__15196){
return this15195.isSupported(G__15196);
});
cljc.java_time.year.minus_years = (function cljc$java_time$year$minus_years(this15197,long15198){
return this15197.minusYears(long15198);
});
cljc.java_time.year.parse = (function cljc$java_time$year$parse(var_args){
var G__116105 = arguments.length;
switch (G__116105) {
case 2:
return cljc.java_time.year.parse.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 1:
return cljc.java_time.year.parse.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(cljc.java_time.year.parse.cljs$core$IFn$_invoke$arity$2 = (function (java_lang_CharSequence15199,java_time_format_DateTimeFormatter15200){
return cljs.core.js_invoke.cljs$core$IFn$_invoke$arity$variadic(java.time.Year,"parse",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([java_lang_CharSequence15199,java_time_format_DateTimeFormatter15200], 0));
}));

(cljc.java_time.year.parse.cljs$core$IFn$_invoke$arity$1 = (function (java_lang_CharSequence15201){
return cljs.core.js_invoke.cljs$core$IFn$_invoke$arity$variadic(java.time.Year,"parse",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([java_lang_CharSequence15201], 0));
}));

(cljc.java_time.year.parse.cljs$lang$maxFixedArity = 2);

cljc.java_time.year.hash_code = (function cljc$java_time$year$hash_code(this15202){
return this15202.hashCode();
});
cljc.java_time.year.adjust_into = (function cljc$java_time$year$adjust_into(this15203,java_time_temporal_Temporal15204){
return this15203.adjustInto(java_time_temporal_Temporal15204);
});
cljc.java_time.year.with$ = (function cljc$java_time$year$with(var_args){
var G__116127 = arguments.length;
switch (G__116127) {
case 3:
return cljc.java_time.year.with$.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
case 2:
return cljc.java_time.year.with$.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(cljc.java_time.year.with$.cljs$core$IFn$_invoke$arity$3 = (function (this15205,java_time_temporal_TemporalField15206,long15207){
return this15205.with(java_time_temporal_TemporalField15206,long15207);
}));

(cljc.java_time.year.with$.cljs$core$IFn$_invoke$arity$2 = (function (this15208,java_time_temporal_TemporalAdjuster15209){
return this15208.with(java_time_temporal_TemporalAdjuster15209);
}));

(cljc.java_time.year.with$.cljs$lang$maxFixedArity = 3);

cljc.java_time.year.now = (function cljc$java_time$year$now(var_args){
var G__116139 = arguments.length;
switch (G__116139) {
case 0:
return cljc.java_time.year.now.cljs$core$IFn$_invoke$arity$0();

break;
case 1:
return cljc.java_time.year.now.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(cljc.java_time.year.now.cljs$core$IFn$_invoke$arity$0 = (function (){
return cljs.core.js_invoke(java.time.Year,"now");
}));

(cljc.java_time.year.now.cljs$core$IFn$_invoke$arity$1 = (function (G__15211){
return cljs.core.js_invoke.cljs$core$IFn$_invoke$arity$variadic(java.time.Year,"now",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([G__15211], 0));
}));

(cljc.java_time.year.now.cljs$lang$maxFixedArity = 1);

cljc.java_time.year.compare_to = (function cljc$java_time$year$compare_to(this15212,java_time_Year15213){
return this15212.compareTo(java_time_Year15213);
});
cljc.java_time.year.get = (function cljc$java_time$year$get(this15214,java_time_temporal_TemporalField15215){
return this15214.get(java_time_temporal_TemporalField15215);
});
cljc.java_time.year.equals = (function cljc$java_time$year$equals(this15216,java_lang_Object15217){
return this15216.equals(java_lang_Object15217);
});
cljc.java_time.year.format = (function cljc$java_time$year$format(this15218,java_time_format_DateTimeFormatter15219){
return this15218.format(java_time_format_DateTimeFormatter15219);
});
cljc.java_time.year.plus_years = (function cljc$java_time$year$plus_years(this15220,long15221){
return this15220.plusYears(long15221);
});

//# sourceMappingURL=cljc.java_time.year.js.map
