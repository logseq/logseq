goog.provide('logseq.common.util.date_time');
logseq.common.util.date_time.safe_journal_title_formatters = (function logseq$common$util$date_time$safe_journal_title_formatters(date_formatter){
return cljs.core.distinct.cljs$core$IFn$_invoke$arity$1(cljs.core.remove.cljs$core$IFn$_invoke$arity$2(clojure.string.blank_QMARK_,new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [date_formatter,"MMM do, yyyy","yyyy-MM-dd","yyyy_MM_dd"], null)));
});
logseq.common.util.date_time.journal_title__GT_ = (function logseq$common$util$date_time$journal_title__GT_(journal_title,then_fn,formatters){
if(clojure.string.blank_QMARK_(journal_title)){
return null;
} else {
var temp__5804__auto__ = cljs.core.first(cljs.core.filter.cljs$core$IFn$_invoke$arity$2(cljs.core.some_QMARK_,cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (formatter){
try{return cljs_time.format.parse.cljs$core$IFn$_invoke$arity$2(cljs_time.format.formatter.cljs$core$IFn$_invoke$arity$1(formatter),logseq.common.util.capitalize_all(journal_title));
}catch (e58390){var _e = e58390;
return null;
}}),formatters)));
if(cljs.core.truth_(temp__5804__auto__)){
var time_SINGLEQUOTE_ = temp__5804__auto__;
return (then_fn.cljs$core$IFn$_invoke$arity$1 ? then_fn.cljs$core$IFn$_invoke$arity$1(time_SINGLEQUOTE_) : then_fn.call(null,time_SINGLEQUOTE_));
} else {
return null;
}
}
});
logseq.common.util.date_time.journal_title__GT_int = (function logseq$common$util$date_time$journal_title__GT_int(journal_title,formatters){
if(cljs.core.truth_(journal_title)){
var journal_title__$1 = logseq.common.util.capitalize_all(journal_title);
return logseq.common.util.date_time.journal_title__GT_(journal_title__$1,(function (p1__58396_SHARP_){
return cljs.core.parse_long(cljs_time.format.unparse(cljs_time.format.formatter.cljs$core$IFn$_invoke$arity$1("yyyyMMdd"),p1__58396_SHARP_));
}),formatters);
} else {
return null;
}
});
logseq.common.util.date_time.format = (function logseq$common$util$date_time$format(date,date_formatter){
if(cljs.core.truth_(date_formatter)){
return cljs_time.format.unparse(cljs_time.format.formatter.cljs$core$IFn$_invoke$arity$1(date_formatter),date);
} else {
return null;
}
});
logseq.common.util.date_time.int__GT_local_date = (function logseq$common$util$date_time$int__GT_local_date(day){
var s = cljs.core.str.cljs$core$IFn$_invoke$arity$1(day);
var year = parseInt(cljs.core.subs.cljs$core$IFn$_invoke$arity$3(s,(0),(4)));
var month = (parseInt(cljs.core.subs.cljs$core$IFn$_invoke$arity$3(s,(4),(6))) - (1));
var day__$1 = parseInt(cljs.core.subs.cljs$core$IFn$_invoke$arity$2(s,(6)));
return (new Date(year,month,day__$1));
});
logseq.common.util.date_time.int__GT_journal_title = (function logseq$common$util$date_time$int__GT_journal_title(day,date_formatter){
if(cljs.core.truth_(day)){
return logseq.common.util.date_time.format(cljs_time.format.parse.cljs$core$IFn$_invoke$arity$2(cljs_time.format.formatter.cljs$core$IFn$_invoke$arity$1("yyyyMMdd"),cljs.core.str.cljs$core$IFn$_invoke$arity$1(day)),date_formatter);
} else {
return null;
}
});
logseq.common.util.date_time.get_weekday = (function logseq$common$util$date_time$get_weekday(date){
return date.toLocaleString("en-us",cljs.core.clj__GT_js(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"weekday","weekday",-1413046442),"long"], null)));
});
logseq.common.util.date_time.get_date = (function logseq$common$util$date_time$get_date(var_args){
var G__58402 = arguments.length;
switch (G__58402) {
case 0:
return logseq.common.util.date_time.get_date.cljs$core$IFn$_invoke$arity$0();

break;
case 1:
return logseq.common.util.date_time.get_date.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(logseq.common.util.date_time.get_date.cljs$core$IFn$_invoke$arity$0 = (function (){
return logseq.common.util.date_time.get_date.cljs$core$IFn$_invoke$arity$1((new Date()));
}));

(logseq.common.util.date_time.get_date.cljs$core$IFn$_invoke$arity$1 = (function (date){
return new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"year","year",335913393),date.getFullYear(),new cljs.core.Keyword(null,"month","month",-1960248533),(date.getMonth() + (1)),new cljs.core.Keyword(null,"day","day",-274800446),date.getDate(),new cljs.core.Keyword(null,"weekday","weekday",-1413046442),logseq.common.util.date_time.get_weekday(date)], null);
}));

(logseq.common.util.date_time.get_date.cljs$lang$maxFixedArity = 1);

logseq.common.util.date_time.year_month_day_padded = (function logseq$common$util$date_time$year_month_day_padded(var_args){
var G__58413 = arguments.length;
switch (G__58413) {
case 0:
return logseq.common.util.date_time.year_month_day_padded.cljs$core$IFn$_invoke$arity$0();

break;
case 1:
return logseq.common.util.date_time.year_month_day_padded.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(logseq.common.util.date_time.year_month_day_padded.cljs$core$IFn$_invoke$arity$0 = (function (){
return logseq.common.util.date_time.year_month_day_padded.cljs$core$IFn$_invoke$arity$1(logseq.common.util.date_time.get_date.cljs$core$IFn$_invoke$arity$0());
}));

(logseq.common.util.date_time.year_month_day_padded.cljs$core$IFn$_invoke$arity$1 = (function (date){
var map__58417 = date;
var map__58417__$1 = cljs.core.__destructure_map(map__58417);
var year = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__58417__$1,new cljs.core.Keyword(null,"year","year",335913393));
var month = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__58417__$1,new cljs.core.Keyword(null,"month","month",-1960248533));
var day = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__58417__$1,new cljs.core.Keyword(null,"day","day",-274800446));
return new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"year","year",335913393),year,new cljs.core.Keyword(null,"month","month",-1960248533),logseq.common.util.zero_pad(month),new cljs.core.Keyword(null,"day","day",-274800446),logseq.common.util.zero_pad(day)], null);
}));

(logseq.common.util.date_time.year_month_day_padded.cljs$lang$maxFixedArity = 1);

logseq.common.util.date_time.ymd = (function logseq$common$util$date_time$ymd(var_args){
var G__58428 = arguments.length;
switch (G__58428) {
case 0:
return logseq.common.util.date_time.ymd.cljs$core$IFn$_invoke$arity$0();

break;
case 1:
return logseq.common.util.date_time.ymd.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return logseq.common.util.date_time.ymd.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(logseq.common.util.date_time.ymd.cljs$core$IFn$_invoke$arity$0 = (function (){
return logseq.common.util.date_time.ymd.cljs$core$IFn$_invoke$arity$1((new Date()));
}));

(logseq.common.util.date_time.ymd.cljs$core$IFn$_invoke$arity$1 = (function (date){
return logseq.common.util.date_time.ymd.cljs$core$IFn$_invoke$arity$2(date,"/");
}));

(logseq.common.util.date_time.ymd.cljs$core$IFn$_invoke$arity$2 = (function (date,sep){
var map__58435 = logseq.common.util.date_time.year_month_day_padded.cljs$core$IFn$_invoke$arity$1(logseq.common.util.date_time.get_date.cljs$core$IFn$_invoke$arity$1(date));
var map__58435__$1 = cljs.core.__destructure_map(map__58435);
var year = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__58435__$1,new cljs.core.Keyword(null,"year","year",335913393));
var month = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__58435__$1,new cljs.core.Keyword(null,"month","month",-1960248533));
var day = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__58435__$1,new cljs.core.Keyword(null,"day","day",-274800446));
return [cljs.core.str.cljs$core$IFn$_invoke$arity$1(year),cljs.core.str.cljs$core$IFn$_invoke$arity$1(sep),cljs.core.str.cljs$core$IFn$_invoke$arity$1(month),cljs.core.str.cljs$core$IFn$_invoke$arity$1(sep),cljs.core.str.cljs$core$IFn$_invoke$arity$1(day)].join('');
}));

(logseq.common.util.date_time.ymd.cljs$lang$maxFixedArity = 2);

/**
 * Given a date object, returns its journal page integer
 */
logseq.common.util.date_time.date__GT_int = (function logseq$common$util$date_time$date__GT_int(date){
return cljs.core.parse_long(clojure.string.replace(logseq.common.util.date_time.ymd.cljs$core$IFn$_invoke$arity$1(date),"/",""));
});
/**
 * Converts a journal's :block/journal-day integer into milliseconds
 */
logseq.common.util.date_time.journal_day__GT_ms = (function logseq$common$util$date_time$journal_day__GT_ms(day){
if(cljs.core.truth_(day)){
return cljs_time.coerce.to_long(cljs_time.format.parse.cljs$core$IFn$_invoke$arity$2(cljs_time.format.formatter.cljs$core$IFn$_invoke$arity$1("yyyyMMdd"),cljs.core.str.cljs$core$IFn$_invoke$arity$1(day)));
} else {
return null;
}
});
/**
 * Converts a milliseconds timestamp to the nearest :block/journal-day
 */
logseq.common.util.date_time.ms__GT_journal_day = (function logseq$common$util$date_time$ms__GT_journal_day(ms){
var G__58451 = ms;
var G__58451__$1 = (((G__58451 == null))?null:cljs_time.coerce.from_long(G__58451));
var G__58451__$2 = (((G__58451__$1 == null))?null:cljs_time.core.to_default_time_zone(G__58451__$1));
var G__58451__$3 = (((G__58451__$2 == null))?null:cljs_time.format.unparse(cljs_time.format.formatter.cljs$core$IFn$_invoke$arity$1("yyyyMMdd"),G__58451__$2));
if((G__58451__$3 == null)){
return null;
} else {
return cljs.core.parse_long(G__58451__$3);
}
});

//# sourceMappingURL=logseq.common.util.date_time.js.map
