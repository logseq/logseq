goog.provide('cljs_time.internal.core');
cljs_time.internal.core.months = new cljs.core.PersistentVector(null, 12, 5, cljs.core.PersistentVector.EMPTY_NODE, ["January","February","March","April","May","June","July","August","September","October","November","December"], null);
cljs_time.internal.core.days = new cljs.core.PersistentVector(null, 7, 5, cljs.core.PersistentVector.EMPTY_NODE, ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"], null);
cljs_time.internal.core.abbreviate = (function cljs_time$internal$core$abbreviate(n,s){
return cljs.core.subs.cljs$core$IFn$_invoke$arity$3(s,(0),n);
});
cljs_time.internal.core._EQ_ = (function cljs_time$internal$core$_EQ_(var_args){
var args__5732__auto__ = [];
var len__5726__auto___56437 = arguments.length;
var i__5727__auto___56438 = (0);
while(true){
if((i__5727__auto___56438 < len__5726__auto___56437)){
args__5732__auto__.push((arguments[i__5727__auto___56438]));

var G__56439 = (i__5727__auto___56438 + (1));
i__5727__auto___56438 = G__56439;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((0) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((0)),(0),null)):null);
return cljs_time.internal.core._EQ_.cljs$core$IFn$_invoke$arity$variadic(argseq__5733__auto__);
});

(cljs_time.internal.core._EQ_.cljs$core$IFn$_invoke$arity$variadic = (function (args){
if(cljs.core.every_QMARK_((function (p1__56277_SHARP_){
return (p1__56277_SHARP_ instanceof goog.date.Date);
}),args)){
return cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core._EQ_,cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__56278_SHARP_){
return p1__56278_SHARP_.getTime();
}),args));
} else {
return cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core._EQ_,args);

}
}));

(cljs_time.internal.core._EQ_.cljs$lang$maxFixedArity = (0));

/** @this {Function} */
(cljs_time.internal.core._EQ_.cljs$lang$applyTo = (function (seq56279){
var self__5712__auto__ = this;
return self__5712__auto__.cljs$core$IFn$_invoke$arity$variadic(cljs.core.seq(seq56279));
}));

cljs_time.internal.core.leap_year_QMARK_ = (function cljs_time$internal$core$leap_year_QMARK_(y){
if((cljs.core.mod(y,(400)) === (0))){
return true;
} else {
if((cljs.core.mod(y,(100)) === (0))){
return false;
} else {
if((cljs.core.mod(y,(4)) === (0))){
return true;
} else {
return false;

}
}
}
});
cljs_time.internal.core.days_in_month = new cljs.core.PersistentVector(null, 12, 5, cljs.core.PersistentVector.EMPTY_NODE, [(31),(28),(31),(30),(31),(30),(31),(31),(30),(31),(30),(31)], null);
cljs_time.internal.core.corrected_dim = (function cljs_time$internal$core$corrected_dim(month){
var G__56297 = (cljs.core.truth_(cljs_time.internal.core._EQ_.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([month,(1)], 0)))?(11):(month - (1)));
return (cljs_time.internal.core.days_in_month.cljs$core$IFn$_invoke$arity$1 ? cljs_time.internal.core.days_in_month.cljs$core$IFn$_invoke$arity$1(G__56297) : cljs_time.internal.core.days_in_month.call(null,G__56297));
});
cljs_time.internal.core.year_corrected_dim = (function cljs_time$internal$core$year_corrected_dim(year,month){
var G__56301 = cljs_time.internal.core.corrected_dim(month);
if(cljs.core.truth_((function (){var and__5000__auto__ = cljs_time.internal.core.leap_year_QMARK_(year);
if(and__5000__auto__){
return cljs_time.internal.core._EQ_.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([month,(2)], 0));
} else {
return and__5000__auto__;
}
})())){
return (G__56301 + (1));
} else {
return G__56301;
}
});
cljs_time.internal.core.valid_date_QMARK_ = (function cljs_time$internal$core$valid_date_QMARK_(p__56322){
var map__56323 = p__56322;
var map__56323__$1 = cljs.core.__destructure_map(map__56323);
var d = map__56323__$1;
var minutes = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__56323__$1,new cljs.core.Keyword(null,"minutes","minutes",1319166394));
var millis = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__56323__$1,new cljs.core.Keyword(null,"millis","millis",-1338288387));
var day_of_week = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__56323__$1,new cljs.core.Keyword(null,"day-of-week","day-of-week",1639326729));
var months = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__56323__$1,new cljs.core.Keyword(null,"months","months",-45571637));
var days = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__56323__$1,new cljs.core.Keyword(null,"days","days",-1394072564));
var weekyear = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__56323__$1,new cljs.core.Keyword(null,"weekyear","weekyear",-74064500));
var seconds = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__56323__$1,new cljs.core.Keyword(null,"seconds","seconds",-445266194));
var weekyear_week = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__56323__$1,new cljs.core.Keyword(null,"weekyear-week","weekyear-week",795291571));
var hours = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__56323__$1,new cljs.core.Keyword(null,"hours","hours",58380855));
var years = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__56323__$1,new cljs.core.Keyword(null,"years","years",-1298579689));
var months_QMARK_ = (cljs.core.truth_(months)?((((1) <= months)) && ((months <= (12)))):null);
var dim = (cljs.core.truth_(years)?(function (){var and__5000__auto__ = months;
if(cljs.core.truth_(and__5000__auto__)){
var and__5000__auto____$1 = months_QMARK_;
if(cljs.core.truth_(and__5000__auto____$1)){
return cljs_time.internal.core.year_corrected_dim(years,months);
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})():(function (){var and__5000__auto__ = months;
if(cljs.core.truth_(and__5000__auto__)){
var and__5000__auto____$1 = months_QMARK_;
if(cljs.core.truth_(and__5000__auto____$1)){
return cljs_time.internal.core.corrected_dim(months);
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})());
var days_QMARK_ = (cljs.core.truth_(days)?(cljs.core.truth_(dim)?((((1) <= days)) && ((days <= dim))):((((1) <= days)) && ((days <= (31))))):null);
var hours_QMARK_ = (cljs.core.truth_(hours)?((((0) <= hours)) && ((hours <= (23)))):null);
var minutes_QMARK_ = (cljs.core.truth_(minutes)?((((0) <= minutes)) && ((minutes <= (59)))):null);
var seconds_QMARK_ = (cljs.core.truth_(seconds)?((((0) <= seconds)) && ((seconds <= (60)))):null);
var millis_QMARK_ = (cljs.core.truth_(millis)?((((0) <= millis)) && ((millis <= (999)))):null);
var weekyear_week_QMARK_ = (cljs.core.truth_(weekyear_week)?((((1) <= weekyear_week)) && ((weekyear_week <= (53)))):null);
var day_of_week_QMARK_ = (cljs.core.truth_(day_of_week)?((((1) <= day_of_week)) && ((day_of_week <= (7)))):null);
if(cljs.core.every_QMARK_(cljs.core.true_QMARK_,cljs.core.remove.cljs$core$IFn$_invoke$arity$2(cljs.core.nil_QMARK_,new cljs.core.PersistentVector(null, 8, 5, cljs.core.PersistentVector.EMPTY_NODE, [months_QMARK_,days_QMARK_,hours_QMARK_,minutes_QMARK_,seconds_QMARK_,millis_QMARK_,weekyear_week_QMARK_,day_of_week_QMARK_], null)))){
if(cljs.core.not((function (){var and__5000__auto__ = (function (){var or__5002__auto__ = years;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = months;
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
return days;
}
}
})();
if(cljs.core.truth_(and__5000__auto__)){
var or__5002__auto__ = weekyear;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return weekyear_week;
}
} else {
return and__5000__auto__;
}
})())){
return d;
} else {
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2("Mixing year, month, day and week-year week-number fields",new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"type","type",1174270348),new cljs.core.Keyword(null,"invalid-date","invalid-date",2030506573),new cljs.core.Keyword(null,"date","date",-1463434462),d,new cljs.core.Keyword(null,"errors","errors",-908790718),cljs.core.PersistentArrayMap.EMPTY], null));
}
} else {
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2("Date is not valid",new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"type","type",1174270348),new cljs.core.Keyword(null,"invalid-date","invalid-date",2030506573),new cljs.core.Keyword(null,"date","date",-1463434462),d,new cljs.core.Keyword(null,"errors","errors",-908790718),(function (){var G__56346 = cljs.core.PersistentArrayMap.EMPTY;
var G__56346__$1 = ((months_QMARK_ === false)?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__56346,new cljs.core.Keyword(null,"months","months",-45571637),months):G__56346);
var G__56346__$2 = ((days_QMARK_ === false)?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__56346__$1,new cljs.core.Keyword(null,"days","days",-1394072564),days):G__56346__$1);
var G__56346__$3 = ((hours_QMARK_ === false)?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__56346__$2,new cljs.core.Keyword(null,"hours","hours",58380855),hours):G__56346__$2);
var G__56346__$4 = ((minutes_QMARK_ === false)?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__56346__$3,new cljs.core.Keyword(null,"minutes","minutes",1319166394),minutes):G__56346__$3);
var G__56346__$5 = ((seconds_QMARK_ === false)?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__56346__$4,new cljs.core.Keyword(null,"seconds","seconds",-445266194),seconds):G__56346__$4);
var G__56346__$6 = ((millis_QMARK_ === false)?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__56346__$5,new cljs.core.Keyword(null,"millis","millis",-1338288387),millis):G__56346__$5);
var G__56346__$7 = ((weekyear_week_QMARK_ === false)?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__56346__$6,new cljs.core.Keyword(null,"weekyear-week","weekyear-week",795291571),weekyear_week):G__56346__$6);
if(day_of_week_QMARK_ === false){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__56346__$7,new cljs.core.Keyword(null,"day-of-week","day-of-week",1639326729),day_of_week);
} else {
return G__56346__$7;
}
})()], null));
}
});
cljs_time.internal.core.index_of = (function cljs_time$internal$core$index_of(coll,x){
return cljs.core.first(cljs.core.keep_indexed.cljs$core$IFn$_invoke$arity$2((function (p1__56353_SHARP_,p2__56352_SHARP_){
if(cljs.core.truth_(cljs_time.internal.core._EQ_.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([p2__56352_SHARP_,x], 0)))){
return p1__56353_SHARP_;
} else {
return null;
}
}),coll));
});
/**
 * Formats a string using goog.string.format.
 */
cljs_time.internal.core.format = (function cljs_time$internal$core$format(var_args){
var args__5732__auto__ = [];
var len__5726__auto___56465 = arguments.length;
var i__5727__auto___56466 = (0);
while(true){
if((i__5727__auto___56466 < len__5726__auto___56465)){
args__5732__auto__.push((arguments[i__5727__auto___56466]));

var G__56467 = (i__5727__auto___56466 + (1));
i__5727__auto___56466 = G__56467;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return cljs_time.internal.core.format.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(cljs_time.internal.core.format.cljs$core$IFn$_invoke$arity$variadic = (function (fmt,args){
var args__$1 = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (x){
if((((x instanceof cljs.core.Keyword)) || ((x instanceof cljs.core.Symbol)))){
return cljs.core.str.cljs$core$IFn$_invoke$arity$1(x);
} else {
return x;
}
}),args);
return cljs.core.apply.cljs$core$IFn$_invoke$arity$3(goog.string.format,fmt,args__$1);
}));

(cljs_time.internal.core.format.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(cljs_time.internal.core.format.cljs$lang$applyTo = (function (seq56361){
var G__56362 = cljs.core.first(seq56361);
var seq56361__$1 = cljs.core.next(seq56361);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__56362,seq56361__$1);
}));

/**
 * Remove the need to pull in gstring/format code in advanced compilation
 */
cljs_time.internal.core.zero_pad = (function cljs_time$internal$core$zero_pad(var_args){
var G__56396 = arguments.length;
switch (G__56396) {
case 1:
return cljs_time.internal.core.zero_pad.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return cljs_time.internal.core.zero_pad.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(cljs_time.internal.core.zero_pad.cljs$core$IFn$_invoke$arity$1 = (function (n){
if(((((0) <= n)) && ((n <= (9))))){
return ["0",cljs.core.str.cljs$core$IFn$_invoke$arity$1(n)].join('');
} else {
return cljs.core.str.cljs$core$IFn$_invoke$arity$1(n);
}
}));

(cljs_time.internal.core.zero_pad.cljs$core$IFn$_invoke$arity$2 = (function (n,zeros){
if((zeros < (1))){
return cljs.core.str.cljs$core$IFn$_invoke$arity$1(n);
} else {
return [clojure.string.join.cljs$core$IFn$_invoke$arity$1(cljs.core.take.cljs$core$IFn$_invoke$arity$2((zeros - ((cljs.core.str.cljs$core$IFn$_invoke$arity$1(n)).length)),cljs.core.repeat.cljs$core$IFn$_invoke$arity$1("0"))),cljs.core.str.cljs$core$IFn$_invoke$arity$1(n)].join('');
}
}));

(cljs_time.internal.core.zero_pad.cljs$lang$maxFixedArity = 2);

cljs_time.internal.core.multiplied_by = (function cljs_time$internal$core$multiplied_by(period,scalar){
var scale_fn = (function cljs_time$internal$core$multiplied_by_$_scale_fn(field){
if(cljs.core.truth_(field)){
return (field * scalar);
} else {
return null;
}
});
return cljs.core.update_in.cljs$core$IFn$_invoke$arity$3(cljs.core.update_in.cljs$core$IFn$_invoke$arity$3(cljs.core.update_in.cljs$core$IFn$_invoke$arity$3(cljs.core.update_in.cljs$core$IFn$_invoke$arity$3(cljs.core.update_in.cljs$core$IFn$_invoke$arity$3(cljs.core.update_in.cljs$core$IFn$_invoke$arity$3(cljs.core.update_in.cljs$core$IFn$_invoke$arity$3(cljs.core.update_in.cljs$core$IFn$_invoke$arity$3(period,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"millis","millis",-1338288387)], null),scale_fn),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"seconds","seconds",-445266194)], null),scale_fn),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"minutes","minutes",1319166394)], null),scale_fn),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"hours","hours",58380855)], null),scale_fn),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"days","days",-1394072564)], null),scale_fn),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"weeks","weeks",1844596125)], null),scale_fn),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"months","months",-45571637)], null),scale_fn),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"years","years",-1298579689)], null),scale_fn);
});
/**
 * Counterpart ot goog.date/getWeekNumber. 
 *   month 0 is jan per goog.date
 */
cljs_time.internal.core.get_week_year = (function cljs_time$internal$core$get_week_year(year,month,date){
var january = cljs_time.internal.core._EQ_.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([month,(0)], 0));
var december = cljs_time.internal.core._EQ_.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([month,(11)], 0));
var week_number = goog.date.getWeekNumber(year,month,date);
if(cljs.core.truth_((function (){var and__5000__auto__ = january;
if(cljs.core.truth_(and__5000__auto__)){
return (week_number >= (52));
} else {
return and__5000__auto__;
}
})())){
return (year - (1));
} else {
if(cljs.core.truth_((function (){var and__5000__auto__ = december;
if(cljs.core.truth_(and__5000__auto__)){
return cljs_time.internal.core._EQ_.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([week_number,(1)], 0));
} else {
return and__5000__auto__;
}
})())){
return (year + (1));
} else {
return year;

}
}
});

//# sourceMappingURL=cljs_time.internal.core.js.map
