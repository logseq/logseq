goog.provide('frontend.date');
goog.scope(function(){
  frontend.date.goog$module$goog$object = goog.module.get('goog.object');
});
var module$node_modules$chrono_node$dist$index=shadow.js.require("module$node_modules$chrono_node$dist$index", {});
frontend.date.nld_parse = (function frontend$date$nld_parse(s){
if(typeof s === 'string'){
var fexpr__100067 = frontend.date.goog$module$goog$object.get(module$node_modules$chrono_node$dist$index,"parseDate");
return (fexpr__100067.cljs$core$IFn$_invoke$arity$1 ? fexpr__100067.cljs$core$IFn$_invoke$arity$1(s) : fexpr__100067.call(null,s));
} else {
return null;
}
});
frontend.date.custom_formatter = cljs_time.format.formatter.cljs$core$IFn$_invoke$arity$1("yyyy-MM-dd'T'HH:mm:ssZZ");
frontend.date.journal_title_formatters = (function frontend$date$journal_title_formatters(){
return logseq.common.date.journal_title_formatters(frontend.state.get_date_formatter());
});
frontend.date.get_date_time_string = (function frontend$date$get_date_time_string(var_args){
var G__100075 = arguments.length;
switch (G__100075) {
case 0:
return frontend.date.get_date_time_string.cljs$core$IFn$_invoke$arity$0();

break;
case 1:
return frontend.date.get_date_time_string.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.date.get_date_time_string.cljs$core$IFn$_invoke$arity$0 = (function (){
return frontend.date.get_date_time_string.cljs$core$IFn$_invoke$arity$1(cljs_time.core.now());
}));

(frontend.date.get_date_time_string.cljs$core$IFn$_invoke$arity$1 = (function (date_time){
return cljs_time.format.unparse(frontend.date.custom_formatter,date_time);
}));

(frontend.date.get_date_time_string.cljs$lang$maxFixedArity = 1);

/**
 * Accepts a :date-time-no-ms string representation, or a cljs-time date object
 */
frontend.date.get_locale_string = (function frontend$date$get_locale_string(input){
try{return cljs_time.format.unparse(cljs_time.format.formatter.cljs$core$IFn$_invoke$arity$1("MMM do, yyyy"),cljs_time.core.to_default_time_zone((function (){var G__100089 = input;
if(typeof input === 'string'){
return cljs_time.format.parse.cljs$core$IFn$_invoke$arity$2((cljs_time.format.formatters.cljs$core$IFn$_invoke$arity$1 ? cljs_time.format.formatters.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"date-time-no-ms","date-time-no-ms",1655953671)) : cljs_time.format.formatters.call(null,new cljs.core.Keyword(null,"date-time-no-ms","date-time-no-ms",1655953671))),G__100089);
} else {
return G__100089;
}
})()));
}catch (e100083){var _e = e100083;
return null;
}});
frontend.date.custom_formatter_2 = cljs_time.format.formatter.cljs$core$IFn$_invoke$arity$1("yyyy-MM-dd-HH-mm-ss");
frontend.date.get_date_time_string_2 = (function frontend$date$get_date_time_string_2(){
return cljs_time.format.unparse(frontend.date.custom_formatter_2,cljs_time.local.local_now());
});
frontend.date.custom_formatter_3 = cljs_time.format.formatter.cljs$core$IFn$_invoke$arity$1("yyyy-MM-dd E HH:mm");
frontend.date.get_date_time_string_3 = (function frontend$date$get_date_time_string_3(){
return cljs_time.format.unparse(frontend.date.custom_formatter_3,cljs_time.local.local_now());
});
frontend.date.custom_formatter_4 = cljs_time.format.formatter.cljs$core$IFn$_invoke$arity$1("yyyy-MM-dd E HH:mm:ss");
frontend.date.get_date_time_string_4 = (function frontend$date$get_date_time_string_4(){
return cljs_time.format.unparse(frontend.date.custom_formatter_4,cljs_time.local.local_now());
});
frontend.date.journal_name = (function frontend$date$journal_name(var_args){
var G__100101 = arguments.length;
switch (G__100101) {
case 0:
return frontend.date.journal_name.cljs$core$IFn$_invoke$arity$0();

break;
case 1:
return frontend.date.journal_name.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.date.journal_name.cljs$core$IFn$_invoke$arity$0 = (function (){
return frontend.date.journal_name.cljs$core$IFn$_invoke$arity$1(cljs_time.local.local_now());
}));

(frontend.date.journal_name.cljs$core$IFn$_invoke$arity$1 = (function (date){
var formatter = frontend.state.get_date_formatter();
try{return logseq.common.util.date_time.format(date,formatter);
}catch (e100104){var e = e100104;
lambdaisland.glogi.log.cljs$core$IFn$_invoke$arity$4("frontend.date",new cljs.core.Keyword(null,"error","error",-978969032),cljs.core.identity(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"parse-journal-date","parse-journal-date",-1090640805),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"message","message",-406056002),"Failed to parse date to journal name.",new cljs.core.Keyword(null,"date","date",-1463434462),date,new cljs.core.Keyword(null,"format","format",-1306924766),formatter], null),new cljs.core.Keyword(null,"line","line",212345235),63], null)),null);

throw e;
}}));

(frontend.date.journal_name.cljs$lang$maxFixedArity = 1);

frontend.date.journal_name_s = (function frontend$date$journal_name_s(s){
try{return frontend.date.journal_name.cljs$core$IFn$_invoke$arity$1(cljs_time.format.parse.cljs$core$IFn$_invoke$arity$2(cljs_time.format.formatter.cljs$core$IFn$_invoke$arity$1("yyyy-MM-dd"),s));
}catch (e100109){var _e = e100109;
lambdaisland.glogi.log.cljs$core$IFn$_invoke$arity$4("frontend.date",new cljs.core.Keyword(null,"error","error",-978969032),cljs.core.identity(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"parse-journal-date","parse-journal-date",-1090640805),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"message","message",-406056002),"Unable to parse date to journal name, skipping.",new cljs.core.Keyword(null,"date-str","date-str",1641747607),s], null),new cljs.core.Keyword(null,"line","line",212345235),72], null)),null);

return null;
}});
frontend.date.start_of_day = (function frontend$date$start_of_day(date){
return cljs_time.core.date_time.cljs$core$IFn$_invoke$arity$3(cljs_time.core.year(date),cljs_time.core.month(date),cljs_time.core.day(date));
});
frontend.date.today = (function frontend$date$today(){
return frontend.date.journal_name.cljs$core$IFn$_invoke$arity$0();
});
frontend.date.tomorrow = (function frontend$date$tomorrow(){
return frontend.date.journal_name.cljs$core$IFn$_invoke$arity$1(cljs_time.core.plus.cljs$core$IFn$_invoke$arity$2(frontend.date.start_of_day(cljs_time.local.local_now()),cljs_time.core.days.cljs$core$IFn$_invoke$arity$1((1))));
});
frontend.date.yesterday = (function frontend$date$yesterday(){
return frontend.date.journal_name.cljs$core$IFn$_invoke$arity$1(cljs_time.core.minus.cljs$core$IFn$_invoke$arity$2(frontend.date.start_of_day(cljs_time.local.local_now()),cljs_time.core.days.cljs$core$IFn$_invoke$arity$1((1))));
});
frontend.date.get_local_date = (function frontend$date$get_local_date(){
var date = (new Date());
var year = date.getFullYear();
var month = (date.getMonth() + (1));
var day = date.getDate();
var hour = date.getHours();
var minute = date.getMinutes();
return new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"year","year",335913393),year,new cljs.core.Keyword(null,"month","month",-1960248533),month,new cljs.core.Keyword(null,"day","day",-274800446),day,new cljs.core.Keyword(null,"hour","hour",-555989214),hour,new cljs.core.Keyword(null,"minute","minute",-642875969),minute], null);
});
frontend.date.get_current_time = (function frontend$date$get_current_time(){
var d = (new Date());
return d.toLocaleTimeString(frontend.date.goog$module$goog$object.get(window.navigator,"language"),cljs_bean.core.__GT_js(new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"hour","hour",-555989214),"2-digit",new cljs.core.Keyword(null,"minute","minute",-642875969),"2-digit",new cljs.core.Keyword(null,"hourCycle","hourCycle",-1723448226),"h23"], null)));
});
frontend.date.normalize_date = (function frontend$date$normalize_date(s){
return logseq.common.date.normalize_date(s,frontend.state.get_date_formatter());
});
frontend.date.normalize_journal_title = (function frontend$date$normalize_journal_title(title){
return logseq.common.date.normalize_journal_title(title,frontend.state.get_date_formatter());
});
frontend.date.valid_journal_title_QMARK_ = (function frontend$date$valid_journal_title_QMARK_(title){
return logseq.common.date.valid_journal_title_QMARK_(title,frontend.state.get_date_formatter());
});
frontend.date.journal_title__GT_ = (function frontend$date$journal_title__GT_(var_args){
var G__100140 = arguments.length;
switch (G__100140) {
case 2:
return frontend.date.journal_title__GT_.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return frontend.date.journal_title__GT_.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.date.journal_title__GT_.cljs$core$IFn$_invoke$arity$2 = (function (journal_title,then_fn){
return frontend.date.journal_title__GT_.cljs$core$IFn$_invoke$arity$3(journal_title,then_fn,logseq.common.util.date_time.safe_journal_title_formatters(frontend.state.get_date_formatter()));
}));

(frontend.date.journal_title__GT_.cljs$core$IFn$_invoke$arity$3 = (function (journal_title,then_fn,formatters){
return logseq.common.util.date_time.journal_title__GT_(journal_title,then_fn,formatters);
}));

(frontend.date.journal_title__GT_.cljs$lang$maxFixedArity = 3);

frontend.date.journal_title__GT_int = (function frontend$date$journal_title__GT_int(journal_title){
return logseq.common.util.date_time.journal_title__GT_int(journal_title,logseq.common.util.date_time.safe_journal_title_formatters(frontend.state.get_date_formatter()));
});
frontend.date.journal_day__GT_utc_ms = logseq.common.util.date_time.journal_day__GT_ms;
frontend.date.journal_title__GT_long = (function frontend$date$journal_title__GT_long(journal_title){
return frontend.date.journal_title__GT_.cljs$core$IFn$_invoke$arity$2(journal_title,(function (p1__100143_SHARP_){
return cljs_time.coerce.to_long(p1__100143_SHARP_);
}));
});
frontend.date.default_journal_filename_formatter = logseq.common.date.default_journal_filename_formatter;
/**
 * Journal title to filename format
 */
frontend.date.journal_title__GT_default = (function frontend$date$journal_title__GT_default(journal_title){
var formatter = (function (){var temp__5802__auto__ = frontend.state.get_journal_file_name_format();
if(cljs.core.truth_(temp__5802__auto__)){
var format = temp__5802__auto__;
return cljs_time.format.formatter.cljs$core$IFn$_invoke$arity$1(format);
} else {
return cljs_time.format.formatter.cljs$core$IFn$_invoke$arity$1(frontend.date.default_journal_filename_formatter);
}
})();
return frontend.date.journal_title__GT_.cljs$core$IFn$_invoke$arity$2(journal_title,(function (p1__100144_SHARP_){
return cljs_time.format.unparse(formatter,p1__100144_SHARP_);
}));
});
frontend.date.journal_title__GT_custom_format = (function frontend$date$journal_title__GT_custom_format(journal_title){
return frontend.date.journal_title__GT_.cljs$core$IFn$_invoke$arity$2(journal_title,(function (p1__100146_SHARP_){
return logseq.common.util.date_time.format(p1__100146_SHARP_,frontend.state.get_date_formatter());
}));
});
frontend.date.int__GT_local_time_2 = (function frontend$date$int__GT_local_time_2(n){
return cljs_time.format.unparse(cljs_time.format.formatter.cljs$core$IFn$_invoke$arity$1("yyyy-MM-dd HH:mm"),cljs_time.core.to_default_time_zone(cljs_time.coerce.from_long(n)));
});
frontend.date.iso_parser = cljs_time.format.formatter.cljs$core$IFn$_invoke$arity$1("yyyy-MM-dd'T'HH:mm:ss.SSSS'Z'");
frontend.date.parse_iso = (function frontend$date$parse_iso(string){
return cljs_time.format.parse.cljs$core$IFn$_invoke$arity$2(frontend.date.iso_parser,string);
});
frontend.date.js_date__GT_journal_title = (function frontend$date$js_date__GT_journal_title(date){
return frontend.date.journal_name.cljs$core$IFn$_invoke$arity$1(cljs_time.core.to_default_time_zone(date));
});
frontend.date.js_date__GT_goog_date = (function frontend$date$js_date__GT_goog_date(d){
if(cljs.core.truth_((function (){var G__100151 = d;
if((G__100151 == null)){
return null;
} else {
return (G__100151 instanceof Date);
}
})())){
return (new goog.date.Date(d.getFullYear(),d.getMonth(),d.getDate()));
} else {
return d;

}
});
frontend.date.nlp_pages = cljs.core.PersistentVector.fromArray(["Today","Tomorrow","Yesterday","Next week","This week","Last week","Next month","This month","Last month","Next year","This year","Last year","Last Monday","Last Tuesday","Last Wednesday","Last Thursday","Last Friday","Last Saturday","Last Sunday","This Monday","This Tuesday","This Wednesday","This Thursday","This Friday","This Saturday","This Sunday","Next Monday","Next Tuesday","Next Wednesday","Next Thursday","Next Friday","Next Saturday","Next Sunday"], true);

//# sourceMappingURL=frontend.date.js.map
