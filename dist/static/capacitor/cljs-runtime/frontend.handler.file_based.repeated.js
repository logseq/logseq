goog.provide('frontend.handler.file_based.repeated');
frontend.handler.file_based.repeated.custom_formatter = cljs_time.format.formatter.cljs$core$IFn$_invoke$arity$1("yyyy-MM-dd EEE");
frontend.handler.file_based.repeated.repeated_QMARK_ = (function frontend$handler$file_based$repeated$repeated_QMARK_(timestamp){
return (!((new cljs.core.Keyword(null,"repetition","repetition",1938392115).cljs$core$IFn$_invoke$arity$1(timestamp) == null)));
});
frontend.handler.file_based.repeated.get_duration_f_and_text = (function frontend$handler$file_based$repeated$get_duration_f_and_text(duration){
var G__64181 = duration;
switch (G__64181) {
case "Hour":
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs_time.core.hours,"h"], null);

break;
case "Day":
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs_time.core.days,"d"], null);

break;
case "Week":
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs_time.core.weeks,"w"], null);

break;
case "Month":
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs_time.core.months,"m"], null);

break;
case "Year":
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs_time.core.years,"y"], null);

break;
default:
return null;

}
});
frontend.handler.file_based.repeated.get_repeater_symbol = (function frontend$handler$file_based$repeated$get_repeater_symbol(kind){
var G__64182 = kind;
switch (G__64182) {
case "Plus":
return "+";

break;
case "Dotted":
return ".+";

break;
default:
return "++";

}
});
frontend.handler.file_based.repeated.timestamp__GT_text = (function frontend$handler$file_based$repeated$timestamp__GT_text(var_args){
var G__64184 = arguments.length;
switch (G__64184) {
case 1:
return frontend.handler.file_based.repeated.timestamp__GT_text.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return frontend.handler.file_based.repeated.timestamp__GT_text.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.handler.file_based.repeated.timestamp__GT_text.cljs$core$IFn$_invoke$arity$1 = (function (timestamp){
return frontend.handler.file_based.repeated.timestamp__GT_text.cljs$core$IFn$_invoke$arity$2(timestamp,null);
}));

(frontend.handler.file_based.repeated.timestamp__GT_text.cljs$core$IFn$_invoke$arity$2 = (function (p__64187,start_time){
var map__64188 = p__64187;
var map__64188__$1 = cljs.core.__destructure_map(map__64188);
var date = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__64188__$1,new cljs.core.Keyword(null,"date","date",-1463434462));
var repetition = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__64188__$1,new cljs.core.Keyword(null,"repetition","repetition",1938392115));
var time = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__64188__$1,new cljs.core.Keyword(null,"time","time",1385887882));
var map__64190 = date;
var map__64190__$1 = cljs.core.__destructure_map(map__64190);
var year = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__64190__$1,new cljs.core.Keyword(null,"year","year",335913393));
var month = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__64190__$1,new cljs.core.Keyword(null,"month","month",-1960248533));
var day = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__64190__$1,new cljs.core.Keyword(null,"day","day",-274800446));
var map__64191 = time;
var map__64191__$1 = cljs.core.__destructure_map(map__64191);
var hour = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__64191__$1,new cljs.core.Keyword(null,"hour","hour",-555989214),(0));
var min = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__64191__$1,new cljs.core.Keyword(null,"min","min",444991522),(0));
var vec__64192 = (cljs.core.truth_(start_time)?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs_time.core.hour(start_time),cljs_time.core.minute(start_time)], null):new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [hour,min], null));
var hour__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__64192,(0),null);
var min__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__64192,(1),null);
var vec__64195 = repetition;
var vec__64198 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__64195,(0),null);
var kind = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__64198,(0),null);
var vec__64201 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__64195,(1),null);
var duration = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__64201,(0),null);
var num = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__64195,(2),null);
var start_time__$1 = (function (){var or__5002__auto__ = start_time;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs_time.core.local_date_time.cljs$core$IFn$_invoke$arity$5(year,month,day,hour__$1,min__$1);
}
})();
var vec__64204 = frontend.handler.file_based.repeated.get_duration_f_and_text(duration);
var _duration_f = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__64204,(0),null);
var d = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__64204,(1),null);
var kind__$1 = frontend.handler.file_based.repeated.get_repeater_symbol(kind);
var repeater = (cljs.core.truth_((function (){var and__5000__auto__ = kind__$1;
if(cljs.core.truth_(and__5000__auto__)){
var and__5000__auto____$1 = num;
if(cljs.core.truth_(and__5000__auto____$1)){
return d;
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})())?[cljs.core.str.cljs$core$IFn$_invoke$arity$1(kind__$1),cljs.core.str.cljs$core$IFn$_invoke$arity$1(num),cljs.core.str.cljs$core$IFn$_invoke$arity$1(d)].join(''):null);
var time_repeater = (cljs.core.truth_(time)?[frontend.util.zero_pad(hour__$1),":",frontend.util.zero_pad(min__$1),((clojure.string.blank_QMARK_(repeater))?"":[" ",repeater].join(''))].join(''):repeater);
var G__64208 = "%s%s";
var G__64209 = cljs_time.format.unparse(frontend.handler.file_based.repeated.custom_formatter,start_time__$1);
var G__64210 = ((clojure.string.blank_QMARK_(time_repeater))?"":[" ",time_repeater].join(''));
return (frontend.util.format.cljs$core$IFn$_invoke$arity$3 ? frontend.util.format.cljs$core$IFn$_invoke$arity$3(G__64208,G__64209,G__64210) : frontend.util.format.call(null,G__64208,G__64209,G__64210));
}));

(frontend.handler.file_based.repeated.timestamp__GT_text.cljs$lang$maxFixedArity = 2);

frontend.handler.file_based.repeated.repeat_until_future_timestamp = (function frontend$handler$file_based$repeated$repeat_until_future_timestamp(datetime,now,delta,keep_week_QMARK_){
var datetime__$1 = cljs_time.core.plus.cljs$core$IFn$_invoke$arity$2(datetime,delta);
var result = (function (){var result = datetime__$1;
while(true){
if(cljs.core.truth_(cljs_time.core.after_QMARK_(result,now))){
return result;
} else {
var G__64373 = cljs_time.core.plus.cljs$core$IFn$_invoke$arity$2(result,delta);
result = G__64373;
continue;
}
break;
}
})();
var w1 = cljs_time.core.day_of_week(datetime__$1);
var w2 = cljs_time.core.day_of_week(result);
if(cljs.core.truth_((function (){var and__5000__auto__ = keep_week_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(w1,w2);
} else {
return and__5000__auto__;
}
})())){
if((w2 > w1)){
return cljs_time.core.plus.cljs$core$IFn$_invoke$arity$2(result,cljs_time.core.days.cljs$core$IFn$_invoke$arity$1(((7) - (w2 - w1))));
} else {
return cljs_time.core.plus.cljs$core$IFn$_invoke$arity$2(result,cljs_time.core.days.cljs$core$IFn$_invoke$arity$1((w1 - w2)));
}
} else {
return result;
}
});
frontend.handler.file_based.repeated.next_timestamp_text = (function frontend$handler$file_based$repeated$next_timestamp_text(p__64232){
var map__64237 = p__64232;
var map__64237__$1 = cljs.core.__destructure_map(map__64237);
var timestamp = map__64237__$1;
var date = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__64237__$1,new cljs.core.Keyword(null,"date","date",-1463434462));
var repetition = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__64237__$1,new cljs.core.Keyword(null,"repetition","repetition",1938392115));
var time = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__64237__$1,new cljs.core.Keyword(null,"time","time",1385887882));
var map__64248 = date;
var map__64248__$1 = cljs.core.__destructure_map(map__64248);
var year = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__64248__$1,new cljs.core.Keyword(null,"year","year",335913393));
var month = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__64248__$1,new cljs.core.Keyword(null,"month","month",-1960248533));
var day = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__64248__$1,new cljs.core.Keyword(null,"day","day",-274800446));
var map__64249 = time;
var map__64249__$1 = cljs.core.__destructure_map(map__64249);
var hour = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__64249__$1,new cljs.core.Keyword(null,"hour","hour",-555989214),(0));
var min = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__64249__$1,new cljs.core.Keyword(null,"min","min",444991522),(0));
var vec__64250 = repetition;
var vec__64253 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__64250,(0),null);
var kind = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__64253,(0),null);
var vec__64256 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__64250,(1),null);
var duration = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__64256,(0),null);
var num = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__64250,(2),null);
var week_QMARK_ = ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(duration,"Week")) || (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(duration,"w")));
var vec__64259 = frontend.handler.file_based.repeated.get_duration_f_and_text(duration);
var duration_f = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__64259,(0),null);
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__64259,(1),null);
var delta = (duration_f.cljs$core$IFn$_invoke$arity$1 ? duration_f.cljs$core$IFn$_invoke$arity$1(num) : duration_f.call(null,num));
var start_time = cljs_time.core.local_date_time.cljs$core$IFn$_invoke$arity$5(year,month,day,hour,min);
var now = cljs_time.local.local_now();
var start_time_SINGLEQUOTE_ = (function (){var G__64272 = kind;
switch (G__64272) {
case "Dotted":
return frontend.handler.file_based.repeated.repeat_until_future_timestamp(start_time,now,delta,week_QMARK_);

break;
case "DoublePlus":
if(cljs.core.truth_(cljs_time.core.after_QMARK_(start_time,now))){
return start_time;
} else {
return cljs_time.core.plus.cljs$core$IFn$_invoke$arity$2(start_time,delta);
}

break;
default:
return cljs_time.core.plus.cljs$core$IFn$_invoke$arity$2(start_time,delta);

}
})();
return frontend.handler.file_based.repeated.timestamp__GT_text.cljs$core$IFn$_invoke$arity$2(timestamp,start_time_SINGLEQUOTE_);
});
frontend.handler.file_based.repeated.timestamp_map__GT_text = (function frontend$handler$file_based$repeated$timestamp_map__GT_text(p__64301){
var map__64303 = p__64301;
var map__64303__$1 = cljs.core.__destructure_map(map__64303);
var date = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__64303__$1,new cljs.core.Keyword(null,"date","date",-1463434462));
var time = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__64303__$1,new cljs.core.Keyword(null,"time","time",1385887882));
var repeater = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__64303__$1,new cljs.core.Keyword(null,"repeater","repeater",-1071171146));
var map__64304 = repeater;
var map__64304__$1 = cljs.core.__destructure_map(map__64304);
var kind = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__64304__$1,new cljs.core.Keyword(null,"kind","kind",-717265803));
var duration = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__64304__$1,new cljs.core.Keyword(null,"duration","duration",1444101068));
var num = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__64304__$1,new cljs.core.Keyword(null,"num","num",1985240673));
var repeater__$1 = (cljs.core.truth_((function (){var and__5000__auto__ = kind;
if(cljs.core.truth_(and__5000__auto__)){
var and__5000__auto____$1 = num;
if(cljs.core.truth_(and__5000__auto____$1)){
return duration;
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})())?[cljs.core.str.cljs$core$IFn$_invoke$arity$1(kind),cljs.core.str.cljs$core$IFn$_invoke$arity$1(num),cljs.core.str.cljs$core$IFn$_invoke$arity$1(duration)].join(''):null);
var time_repeater = (((!(clojure.string.blank_QMARK_(time))))?[cljs.core.str.cljs$core$IFn$_invoke$arity$1(time),((clojure.string.blank_QMARK_(repeater__$1))?"":[" ",repeater__$1].join(''))].join(''):repeater__$1);
var G__64313 = "<%s%s>";
var G__64314 = cljs_time.format.unparse(frontend.handler.file_based.repeated.custom_formatter,date);
var G__64315 = ((clojure.string.blank_QMARK_(time_repeater))?"":[" ",time_repeater].join(''));
return (frontend.util.format.cljs$core$IFn$_invoke$arity$3 ? frontend.util.format.cljs$core$IFn$_invoke$arity$3(G__64313,G__64314,G__64315) : frontend.util.format.call(null,G__64313,G__64314,G__64315));
});
frontend.handler.file_based.repeated.timestamp__GT_map = (function frontend$handler$file_based$repeated$timestamp__GT_map(p__64330){
var map__64331 = p__64330;
var map__64331__$1 = cljs.core.__destructure_map(map__64331);
var date = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__64331__$1,new cljs.core.Keyword(null,"date","date",-1463434462));
var repetition = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__64331__$1,new cljs.core.Keyword(null,"repetition","repetition",1938392115));
var time = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__64331__$1,new cljs.core.Keyword(null,"time","time",1385887882));
var map__64334 = date;
var map__64334__$1 = cljs.core.__destructure_map(map__64334);
var year = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__64334__$1,new cljs.core.Keyword(null,"year","year",335913393));
var month = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__64334__$1,new cljs.core.Keyword(null,"month","month",-1960248533));
var day = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__64334__$1,new cljs.core.Keyword(null,"day","day",-274800446));
var map__64335 = time;
var map__64335__$1 = cljs.core.__destructure_map(map__64335);
var hour = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__64335__$1,new cljs.core.Keyword(null,"hour","hour",-555989214));
var min = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__64335__$1,new cljs.core.Keyword(null,"min","min",444991522));
var vec__64336 = repetition;
var vec__64339 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__64336,(0),null);
var kind = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__64339,(0),null);
var vec__64342 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__64336,(1),null);
var duration = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__64342,(0),null);
var num = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__64336,(2),null);
return new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"date","date",-1463434462),cljs_time.core.local_date(year,month,day),new cljs.core.Keyword(null,"time","time",1385887882),(cljs.core.truth_((function (){var and__5000__auto__ = hour;
if(cljs.core.truth_(and__5000__auto__)){
return min;
} else {
return and__5000__auto__;
}
})())?[frontend.util.zero_pad(hour),":",frontend.util.zero_pad(min)].join(''):null),new cljs.core.Keyword(null,"repeater","repeater",-1071171146),(cljs.core.truth_((function (){var and__5000__auto__ = kind;
if(cljs.core.truth_(and__5000__auto__)){
var and__5000__auto____$1 = duration;
if(cljs.core.truth_(and__5000__auto____$1)){
return num;
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})())?new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"kind","kind",-717265803),frontend.handler.file_based.repeated.get_repeater_symbol(kind),new cljs.core.Keyword(null,"duration","duration",1444101068),cljs.core.last(frontend.handler.file_based.repeated.get_duration_f_and_text(duration)),new cljs.core.Keyword(null,"num","num",1985240673),num], null):null)], null);
});

//# sourceMappingURL=frontend.handler.file_based.repeated.js.map
