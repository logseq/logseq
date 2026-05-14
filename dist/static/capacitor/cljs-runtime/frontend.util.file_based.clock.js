goog.provide('frontend.util.file_based.clock');
frontend.util.file_based.clock.minutes__GT_hours_COLON_minutes = (function frontend$util$file_based$clock$minutes__GT_hours_COLON_minutes(minutes){
var hours = cljs.core.quot(minutes,(60));
var minutes__$1 = cljs.core.mod(minutes,(60));
return (frontend.util.format.cljs$core$IFn$_invoke$arity$3 ? frontend.util.format.cljs$core$IFn$_invoke$arity$3("%02d:%02d",hours,minutes__$1) : frontend.util.format.call(null,"%02d:%02d",hours,minutes__$1));
});
frontend.util.file_based.clock.seconds__GT_hours_COLON_minutes_COLON_seconds = (function frontend$util$file_based$clock$seconds__GT_hours_COLON_minutes_COLON_seconds(seconds){
var hours = cljs.core.quot(seconds,(3600));
var minutes = cljs.core.quot((seconds - (hours * (3600))),(60));
var seconds__$1 = cljs.core.mod(seconds,(60));
return (frontend.util.format.cljs$core$IFn$_invoke$arity$4 ? frontend.util.format.cljs$core$IFn$_invoke$arity$4("%02d:%02d:%02d",hours,minutes,seconds__$1) : frontend.util.format.call(null,"%02d:%02d:%02d",hours,minutes,seconds__$1));
});
/**
 * A function that returns the values for easier testing.
 * Always in the order [days, hours, minutes, seconds]
 */
frontend.util.file_based.clock.s__GT_dhms_util = (function frontend$util$file_based$clock$s__GT_dhms_util(seconds){
var days = cljs.core.quot(cljs.core.quot(seconds,(3600)),(24));
var n = cljs.core.mod(seconds,((24) * (3600)));
var hours = cljs.core.quot(n,(3600));
var n__$1 = cljs.core.mod(n,(3600));
var minutes = cljs.core.quot(n__$1,(60));
var secs = cljs.core.mod(n__$1,(60));
return new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [days,hours,minutes,secs], null);
});
frontend.util.file_based.clock.seconds__GT_days_COLON_hours_COLON_minutes_COLON_seconds = (function frontend$util$file_based$clock$seconds__GT_days_COLON_hours_COLON_minutes_COLON_seconds(seconds){
var vec__64321 = frontend.util.file_based.clock.s__GT_dhms_util(seconds);
var days = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__64321,(0),null);
var hours = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__64321,(1),null);
var minutes = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__64321,(2),null);
var seconds__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__64321,(3),null);
if((days > (0))){
var G__64324 = "%s%s";
var G__64325 = (((days === (0)))?"":[cljs.core.str.cljs$core$IFn$_invoke$arity$1(days),"d"].join(''));
var G__64326 = (((hours === (0)))?"":[cljs.core.str.cljs$core$IFn$_invoke$arity$1(hours),"h"].join(''));
return (frontend.util.format.cljs$core$IFn$_invoke$arity$3 ? frontend.util.format.cljs$core$IFn$_invoke$arity$3(G__64324,G__64325,G__64326) : frontend.util.format.call(null,G__64324,G__64325,G__64326));
} else {
if((minutes > (0))){
var G__64327 = "%s%s";
var G__64328 = (((hours === (0)))?"":[cljs.core.str.cljs$core$IFn$_invoke$arity$1(hours),"h"].join(''));
var G__64329 = (((minutes === (0)))?"":[cljs.core.str.cljs$core$IFn$_invoke$arity$1(minutes),"m"].join(''));
return (frontend.util.format.cljs$core$IFn$_invoke$arity$3 ? frontend.util.format.cljs$core$IFn$_invoke$arity$3(G__64327,G__64328,G__64329) : frontend.util.format.call(null,G__64327,G__64328,G__64329));
} else {
if((seconds__$1 > (0))){
return [cljs.core.str.cljs$core$IFn$_invoke$arity$1(seconds__$1),"s"].join('');
} else {
return "";
}

}
}
});
frontend.util.file_based.clock.support_seconds_QMARK_ = cljs.core.get_in.cljs$core$IFn$_invoke$arity$3(frontend.state.get_config.cljs$core$IFn$_invoke$arity$0(),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("logbook","settings","logbook/settings",824968896),new cljs.core.Keyword(null,"with-second-support?","with-second-support?",1045118886)], null),true);
frontend.util.file_based.clock.now = (function frontend$util$file_based$clock$now(){
if(cljs.core.truth_(frontend.util.file_based.clock.support_seconds_QMARK_)){
return frontend.date.get_date_time_string_4();
} else {
return frontend.date.get_date_time_string_3();
}
});
frontend.util.file_based.clock.clock_interval = (function frontend$util$file_based$clock$clock_interval(stime,etime){
var vec__64345 = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__64333_SHARP_){
return cljs_time.format.parse.cljs$core$IFn$_invoke$arity$2((cljs.core.truth_(frontend.util.file_based.clock.support_seconds_QMARK_)?frontend.date.custom_formatter_4:frontend.date.custom_formatter_3),p1__64333_SHARP_);
}),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [stime,etime], null));
var stime__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__64345,(0),null);
var etime__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__64345,(1),null);
var interval = cljs_time.core.interval(stime__$1,etime__$1);
var minutes = cljs_time.core.in_minutes(interval);
var seconds = cljs_time.core.in_seconds(interval);
if(cljs.core.truth_(frontend.util.file_based.clock.support_seconds_QMARK_)){
return frontend.util.file_based.clock.seconds__GT_hours_COLON_minutes_COLON_seconds(seconds);
} else {
return frontend.util.file_based.clock.minutes__GT_hours_COLON_minutes(minutes);
}
});
frontend.util.file_based.clock.clock_in = (function frontend$util$file_based$clock$clock_in(format,content){
return frontend.util.file_based.drawer.insert_drawer(format,content,"logbook",(function (){var G__64348 = "CLOCK: [%s]";
var G__64349 = frontend.util.file_based.clock.now();
return (frontend.util.format.cljs$core$IFn$_invoke$arity$2 ? frontend.util.format.cljs$core$IFn$_invoke$arity$2(G__64348,G__64349) : frontend.util.format.call(null,G__64348,G__64349));
})());
});
frontend.util.file_based.clock.clock_out = (function frontend$util$file_based$clock$clock_out(format,content){
try{var or__5002__auto__ = (function (){var temp__5804__auto__ = cljs.core.last(cljs.core.last(frontend.util.file_based.drawer.get_drawer_ast(format,content,"logbook")));
if(cljs.core.truth_(temp__5804__auto__)){
var clock_in_log = temp__5804__auto__;
var clock_in_log__$1 = clojure.string.trim(clock_in_log);
if(clojure.string.starts_with_QMARK_(clock_in_log__$1,"CLOCK:")){
var clock_start = cljs.core.subs.cljs$core$IFn$_invoke$arity$3(clock_in_log__$1,(8),(((clock_in_log__$1).length) - (1)));
var clock_end = frontend.util.file_based.clock.now();
var clock_span = frontend.util.file_based.clock.clock_interval(clock_start,clock_end);
var clock_out_log = (frontend.util.format.cljs$core$IFn$_invoke$arity$4 ? frontend.util.format.cljs$core$IFn$_invoke$arity$4("CLOCK: [%s]--[%s] =>  %s",clock_start,clock_end,clock_span) : frontend.util.format.call(null,"CLOCK: [%s]--[%s] =>  %s",clock_start,clock_end,clock_span));
return clojure.string.replace(content,[clock_in_log__$1,"\n"].join(''),[cljs.core.str.cljs$core$IFn$_invoke$arity$1(clock_out_log),"\n"].join(''));
} else {
return null;
}
} else {
return null;
}
})();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return content;
}
}catch (e64353){var _e = e64353;
return content;
}});
frontend.util.file_based.clock.clock_summary = (function frontend$util$file_based$clock$clock_summary(body,string_QMARK__SINGLEQUOTE_){
var temp__5804__auto__ = frontend.util.file_based.drawer.get_logbook(body);
if(cljs.core.truth_(temp__5804__auto__)){
var logbook = temp__5804__auto__;
var temp__5804__auto____$1 = cljs.core.last(logbook);
if(cljs.core.truth_(temp__5804__auto____$1)){
var logbook_lines = temp__5804__auto____$1;
var temp__5804__auto____$2 = cljs.core.seq(cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (p1__64361_SHARP_){
return clojure.string.starts_with_QMARK_(p1__64361_SHARP_,"CLOCK:");
}),logbook_lines));
if(temp__5804__auto____$2){
var clock_lines = temp__5804__auto____$2;
var vec__64366 = cljs.core.apply.cljs$core$IFn$_invoke$arity$3(cljs.core.map,cljs.core._PLUS_,cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__64363_SHARP_){
return cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.int$,p1__64363_SHARP_);
}),cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__64362_SHARP_){
return clojure.string.split.cljs$core$IFn$_invoke$arity$2(clojure.string.trim(cljs.core.last(clojure.string.split.cljs$core$IFn$_invoke$arity$2(p1__64362_SHARP_,"=>"))),":");
}),clock_lines)));
var hours = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__64366,(0),null);
var minutes = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__64366,(1),null);
var seconds = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__64366,(2),null);
var duration = cljs_time.core.period.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword(null,"hours","hours",58380855),hours,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"minutes","minutes",1319166394),minutes,new cljs.core.Keyword(null,"seconds","seconds",-445266194),seconds], 0));
var duration_in_minutes = cljs_time.core.in_minutes(duration);
var zero_minutes_QMARK_ = (duration_in_minutes === (0));
if(cljs.core.truth_(string_QMARK__SINGLEQUOTE_)){
if(zero_minutes_QMARK_){
return [cljs.core.str.cljs$core$IFn$_invoke$arity$1(seconds),"s"].join('');
} else {
return clojure.string.replace(clojure.string.replace(clojure.string.replace(cljs_time.format.unparse_duration(duration),/\s+days?\s+/,"d"),/\s+hours?\s+/,"h"),/\s+minutes?$/,"m");
}
} else {
if(zero_minutes_QMARK_){
return seconds;
} else {
return ((60) * duration_in_minutes);
}
}
} else {
return null;
}
} else {
return null;
}
} else {
return null;
}
});

//# sourceMappingURL=frontend.util.file_based.clock.js.map
