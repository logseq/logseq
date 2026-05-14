goog.provide('cljc.java_time.year_month');
goog.scope(function(){
  cljc.java_time.year_month.goog$module$goog$object = goog.module.get('goog.object');
});
cljc.java_time.year_month.length_of_year = (function cljc$java_time$year_month$length_of_year(this15296){
return this15296.lengthOfYear();
});
cljc.java_time.year_month.range = (function cljc$java_time$year_month$range(this15297,java_time_temporal_TemporalField15298){
return this15297.range(java_time_temporal_TemporalField15298);
});
cljc.java_time.year_month.is_valid_day = (function cljc$java_time$year_month$is_valid_day(this15299,int15300){
return this15299.isValidDay(int15300);
});
cljc.java_time.year_month.of = (function cljc$java_time$year_month$of(G__15302,G__15303){
return cljs.core.js_invoke.cljs$core$IFn$_invoke$arity$variadic(java.time.YearMonth,"of",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([G__15302,G__15303], 0));
});
cljc.java_time.year_month.with_month = (function cljc$java_time$year_month$with_month(this15304,int15305){
return this15304.withMonth(int15305);
});
cljc.java_time.year_month.at_day = (function cljc$java_time$year_month$at_day(this15306,int15307){
return this15306.atDay(int15307);
});
cljc.java_time.year_month.get_year = (function cljc$java_time$year_month$get_year(this15308){
return this15308.year();
});
cljc.java_time.year_month.plus = (function cljc$java_time$year_month$plus(var_args){
var G__115940 = arguments.length;
switch (G__115940) {
case 3:
return cljc.java_time.year_month.plus.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
case 2:
return cljc.java_time.year_month.plus.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(cljc.java_time.year_month.plus.cljs$core$IFn$_invoke$arity$3 = (function (this15309,long15310,java_time_temporal_TemporalUnit15311){
return this15309.plus(long15310,java_time_temporal_TemporalUnit15311);
}));

(cljc.java_time.year_month.plus.cljs$core$IFn$_invoke$arity$2 = (function (this15312,java_time_temporal_TemporalAmount15313){
return this15312.plus(java_time_temporal_TemporalAmount15313);
}));

(cljc.java_time.year_month.plus.cljs$lang$maxFixedArity = 3);

cljc.java_time.year_month.is_leap_year = (function cljc$java_time$year_month$is_leap_year(this15314){
return this15314.isLeapYear();
});
cljc.java_time.year_month.query = (function cljc$java_time$year_month$query(this15315,java_time_temporal_TemporalQuery15316){
return this15315.query(java_time_temporal_TemporalQuery15316);
});
cljc.java_time.year_month.to_string = (function cljc$java_time$year_month$to_string(this15317){
return this15317.toString();
});
cljc.java_time.year_month.plus_months = (function cljc$java_time$year_month$plus_months(this15318,long15319){
return this15318.plusMonths(long15319);
});
cljc.java_time.year_month.is_before = (function cljc$java_time$year_month$is_before(this15320,java_time_YearMonth15321){
return this15320.isBefore(java_time_YearMonth15321);
});
cljc.java_time.year_month.minus_months = (function cljc$java_time$year_month$minus_months(this15322,long15323){
return this15322.minusMonths(long15323);
});
cljc.java_time.year_month.minus = (function cljc$java_time$year_month$minus(var_args){
var G__115959 = arguments.length;
switch (G__115959) {
case 2:
return cljc.java_time.year_month.minus.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return cljc.java_time.year_month.minus.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(cljc.java_time.year_month.minus.cljs$core$IFn$_invoke$arity$2 = (function (this15324,java_time_temporal_TemporalAmount15325){
return this15324.minus(java_time_temporal_TemporalAmount15325);
}));

(cljc.java_time.year_month.minus.cljs$core$IFn$_invoke$arity$3 = (function (this15326,long15327,java_time_temporal_TemporalUnit15328){
return this15326.minus(long15327,java_time_temporal_TemporalUnit15328);
}));

(cljc.java_time.year_month.minus.cljs$lang$maxFixedArity = 3);

cljc.java_time.year_month.get_long = (function cljc$java_time$year_month$get_long(this15329,java_time_temporal_TemporalField15330){
return this15329.getLong(java_time_temporal_TemporalField15330);
});
cljc.java_time.year_month.with_year = (function cljc$java_time$year_month$with_year(this15331,int15332){
return this15331.withYear(int15332);
});
cljc.java_time.year_month.at_end_of_month = (function cljc$java_time$year_month$at_end_of_month(this15333){
return this15333.atEndOfMonth();
});
cljc.java_time.year_month.length_of_month = (function cljc$java_time$year_month$length_of_month(this15334){
return this15334.lengthOfMonth();
});
cljc.java_time.year_month.until = (function cljc$java_time$year_month$until(this15335,java_time_temporal_Temporal15336,java_time_temporal_TemporalUnit15337){
return this15335.until(java_time_temporal_Temporal15336,java_time_temporal_TemporalUnit15337);
});
cljc.java_time.year_month.from = (function cljc$java_time$year_month$from(java_time_temporal_TemporalAccessor15338){
return cljs.core.js_invoke.cljs$core$IFn$_invoke$arity$variadic(java.time.YearMonth,"from",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([java_time_temporal_TemporalAccessor15338], 0));
});
cljc.java_time.year_month.is_after = (function cljc$java_time$year_month$is_after(this15339,java_time_YearMonth15340){
return this15339.isAfter(java_time_YearMonth15340);
});
cljc.java_time.year_month.is_supported = (function cljc$java_time$year_month$is_supported(this15341,G__15342){
return this15341.isSupported(G__15342);
});
cljc.java_time.year_month.minus_years = (function cljc$java_time$year_month$minus_years(this15343,long15344){
return this15343.minusYears(long15344);
});
cljc.java_time.year_month.parse = (function cljc$java_time$year_month$parse(var_args){
var G__116020 = arguments.length;
switch (G__116020) {
case 2:
return cljc.java_time.year_month.parse.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 1:
return cljc.java_time.year_month.parse.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(cljc.java_time.year_month.parse.cljs$core$IFn$_invoke$arity$2 = (function (java_lang_CharSequence15345,java_time_format_DateTimeFormatter15346){
return cljs.core.js_invoke.cljs$core$IFn$_invoke$arity$variadic(java.time.YearMonth,"parse",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([java_lang_CharSequence15345,java_time_format_DateTimeFormatter15346], 0));
}));

(cljc.java_time.year_month.parse.cljs$core$IFn$_invoke$arity$1 = (function (java_lang_CharSequence15347){
return cljs.core.js_invoke.cljs$core$IFn$_invoke$arity$variadic(java.time.YearMonth,"parse",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([java_lang_CharSequence15347], 0));
}));

(cljc.java_time.year_month.parse.cljs$lang$maxFixedArity = 2);

cljc.java_time.year_month.hash_code = (function cljc$java_time$year_month$hash_code(this15348){
return this15348.hashCode();
});
cljc.java_time.year_month.adjust_into = (function cljc$java_time$year_month$adjust_into(this15349,java_time_temporal_Temporal15350){
return this15349.adjustInto(java_time_temporal_Temporal15350);
});
cljc.java_time.year_month.with$ = (function cljc$java_time$year_month$with(var_args){
var G__116047 = arguments.length;
switch (G__116047) {
case 3:
return cljc.java_time.year_month.with$.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
case 2:
return cljc.java_time.year_month.with$.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(cljc.java_time.year_month.with$.cljs$core$IFn$_invoke$arity$3 = (function (this15351,java_time_temporal_TemporalField15352,long15353){
return this15351.with(java_time_temporal_TemporalField15352,long15353);
}));

(cljc.java_time.year_month.with$.cljs$core$IFn$_invoke$arity$2 = (function (this15354,java_time_temporal_TemporalAdjuster15355){
return this15354.with(java_time_temporal_TemporalAdjuster15355);
}));

(cljc.java_time.year_month.with$.cljs$lang$maxFixedArity = 3);

cljc.java_time.year_month.now = (function cljc$java_time$year_month$now(var_args){
var G__116061 = arguments.length;
switch (G__116061) {
case 0:
return cljc.java_time.year_month.now.cljs$core$IFn$_invoke$arity$0();

break;
case 1:
return cljc.java_time.year_month.now.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(cljc.java_time.year_month.now.cljs$core$IFn$_invoke$arity$0 = (function (){
return cljs.core.js_invoke(java.time.YearMonth,"now");
}));

(cljc.java_time.year_month.now.cljs$core$IFn$_invoke$arity$1 = (function (G__15357){
return cljs.core.js_invoke.cljs$core$IFn$_invoke$arity$variadic(java.time.YearMonth,"now",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([G__15357], 0));
}));

(cljc.java_time.year_month.now.cljs$lang$maxFixedArity = 1);

cljc.java_time.year_month.get_month_value = (function cljc$java_time$year_month$get_month_value(this15358){
return this15358.monthValue();
});
cljc.java_time.year_month.compare_to = (function cljc$java_time$year_month$compare_to(this15359,java_time_YearMonth15360){
return this15359.compareTo(java_time_YearMonth15360);
});
cljc.java_time.year_month.get_month = (function cljc$java_time$year_month$get_month(this15361){
return this15361.month();
});
cljc.java_time.year_month.get = (function cljc$java_time$year_month$get(this15362,java_time_temporal_TemporalField15363){
return this15362.get(java_time_temporal_TemporalField15363);
});
cljc.java_time.year_month.equals = (function cljc$java_time$year_month$equals(this15364,java_lang_Object15365){
return this15364.equals(java_lang_Object15365);
});
cljc.java_time.year_month.format = (function cljc$java_time$year_month$format(this15366,java_time_format_DateTimeFormatter15367){
return this15366.format(java_time_format_DateTimeFormatter15367);
});
cljc.java_time.year_month.plus_years = (function cljc$java_time$year_month$plus_years(this15368,long15369){
return this15368.plusYears(long15369);
});

//# sourceMappingURL=cljc.java_time.year_month.js.map
