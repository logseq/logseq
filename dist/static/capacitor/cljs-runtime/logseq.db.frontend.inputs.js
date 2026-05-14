goog.provide('logseq.db.frontend.inputs');
/**
 * Returns the milliseconds representation of the provided time, in the local timezone.
 * For example, if you run this function at 10pm EDT in the EDT timezone on May 31st,
 * it will return 1622433600000, which is equivalent to Mon May 31 2021 00 :00:00.
 */
logseq.db.frontend.inputs.date_at_local_ms = (function logseq$db$frontend$inputs$date_at_local_ms(var_args){
var G__97268 = arguments.length;
switch (G__97268) {
case 4:
return logseq.db.frontend.inputs.date_at_local_ms.cljs$core$IFn$_invoke$arity$4((arguments[(0)]),(arguments[(1)]),(arguments[(2)]),(arguments[(3)]));

break;
case 5:
return logseq.db.frontend.inputs.date_at_local_ms.cljs$core$IFn$_invoke$arity$5((arguments[(0)]),(arguments[(1)]),(arguments[(2)]),(arguments[(3)]),(arguments[(4)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(logseq.db.frontend.inputs.date_at_local_ms.cljs$core$IFn$_invoke$arity$4 = (function (hours,mins,secs,millisecs){
return logseq.db.frontend.inputs.date_at_local_ms.cljs$core$IFn$_invoke$arity$5(Date.now(),hours,mins,secs,millisecs);
}));

(logseq.db.frontend.inputs.date_at_local_ms.cljs$core$IFn$_invoke$arity$5 = (function (date,hours,mins,secs,millisecs){
return (new Date(date)).setHours(hours,mins,secs,millisecs);
}));

(logseq.db.frontend.inputs.date_at_local_ms.cljs$lang$maxFixedArity = 5);

logseq.db.frontend.inputs.old__GT_new_relative_date_format = (function logseq$db$frontend$inputs$old__GT_new_relative_date_format(input){
var count_SINGLEQUOTE_ = cljs.core.re_find(/^\d+/,cljs.core.name(input));
var plus_minus = (cljs.core.truth_(cljs.core.re_find(/after/,cljs.core.name(input)))?"+":"-");
var ms_QMARK_ = clojure.string.ends_with_QMARK_(cljs.core.name(input),"-ms");
return cljs.core.keyword.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"today","today",945271563),[plus_minus,cljs.core.str.cljs$core$IFn$_invoke$arity$1(count_SINGLEQUOTE_),"d",((ms_QMARK_)?"-ms":"")].join(''));
});
logseq.db.frontend.inputs.get_relative_date = (function logseq$db$frontend$inputs$get_relative_date(input){
var G__97269 = (function (){var or__5002__auto__ = cljs.core.namespace(input);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return "today";
}
})();
switch (G__97269) {
case "today":
return cljs_time.core.today();

break;
default:
throw (new Error(["No matching clause: ",G__97269].join('')));

}
});
logseq.db.frontend.inputs.get_offset_date = (function logseq$db$frontend$inputs$get_offset_date(relative_date,direction,amount,unit){
var offset_fn = (function (){var G__97270 = direction;
switch (G__97270) {
case "+":
return cljs_time.core.plus;

break;
case "-":
return cljs_time.core.minus;

break;
default:
throw (new Error(["No matching clause: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(G__97270)].join('')));

}
})();
var offset_amount = cljs.core.parse_long(amount);
var offset_unit_fn = (function (){var G__97271 = unit;
switch (G__97271) {
case "d":
return cljs_time.core.days;

break;
case "w":
return cljs_time.core.weeks;

break;
case "m":
return cljs_time.core.months;

break;
case "y":
return cljs_time.core.years;

break;
default:
throw (new Error(["No matching clause: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(G__97271)].join('')));

}
})();
var G__97272 = (function (){var G__97273 = relative_date;
var G__97274 = (offset_unit_fn.cljs$core$IFn$_invoke$arity$1 ? offset_unit_fn.cljs$core$IFn$_invoke$arity$1(offset_amount) : offset_unit_fn.call(null,offset_amount));
return (offset_fn.cljs$core$IFn$_invoke$arity$2 ? offset_fn.cljs$core$IFn$_invoke$arity$2(G__97273,G__97274) : offset_fn.call(null,G__97273,G__97274));
})();
return (offset_fn.cljs$core$IFn$_invoke$arity$1 ? offset_fn.cljs$core$IFn$_invoke$arity$1(G__97272) : offset_fn.call(null,G__97272));
});
/**
 * There are currently several time suffixes being used in inputs:
 *   - ms: milliseconds, will return a time relative to the direction the date is being adjusted
 *   - start: will return the time at the start of the day [00:00:00.000]
 *   - end: will return the time at the end of the day [23:59:59.999]
 *   - HHMM: will return the specified time at the turn of the minute [HH:MM:00.000]
 *   - HHMMSS: will return the specified time at the turm of the second [HH:MM:SS.000]
 *   - HHMMSSmmm: will return the specified time at the turn of the millisecond [HH:MM:SS.mmm]
 * 
 *   The latter three will be capped to the maximum allowed for each unit so they will always be valid times
 */
logseq.db.frontend.inputs.get_ts_units = (function logseq$db$frontend$inputs$get_ts_units(offset_direction,offset_time){
var G__97275 = offset_time;
switch (G__97275) {
case "ms":
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(offset_direction,"+")){
return new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [(23),(59),(59),(999)], null);
} else {
return new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [(0),(0),(0),(0)], null);
}

break;
case "start":
return new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [(0),(0),(0),(0)], null);

break;
case "end":
return new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [(23),(59),(59),(999)], null);

break;
default:
var vec__97276 = [cljs.core.str.cljs$core$IFn$_invoke$arity$1(offset_time),"000000000"].join('');
var h1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__97276,(0),null);
var h2 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__97276,(1),null);
var m1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__97276,(2),null);
var m2 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__97276,(3),null);
var s1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__97276,(4),null);
var s2 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__97276,(5),null);
var ms1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__97276,(6),null);
var ms2 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__97276,(7),null);
var ms3 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__97276,(8),null);
return new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [(function (){var x__5090__auto__ = (23);
var y__5091__auto__ = cljs.core.parse_long([cljs.core.str.cljs$core$IFn$_invoke$arity$1(h1),cljs.core.str.cljs$core$IFn$_invoke$arity$1(h2)].join(''));
return ((x__5090__auto__ < y__5091__auto__) ? x__5090__auto__ : y__5091__auto__);
})(),(function (){var x__5090__auto__ = (59);
var y__5091__auto__ = cljs.core.parse_long([cljs.core.str.cljs$core$IFn$_invoke$arity$1(m1),cljs.core.str.cljs$core$IFn$_invoke$arity$1(m2)].join(''));
return ((x__5090__auto__ < y__5091__auto__) ? x__5090__auto__ : y__5091__auto__);
})(),(function (){var x__5090__auto__ = (59);
var y__5091__auto__ = cljs.core.parse_long([cljs.core.str.cljs$core$IFn$_invoke$arity$1(s1),cljs.core.str.cljs$core$IFn$_invoke$arity$1(s2)].join(''));
return ((x__5090__auto__ < y__5091__auto__) ? x__5090__auto__ : y__5091__auto__);
})(),(function (){var x__5090__auto__ = (999);
var y__5091__auto__ = cljs.core.parse_long([cljs.core.str.cljs$core$IFn$_invoke$arity$1(ms1),cljs.core.str.cljs$core$IFn$_invoke$arity$1(ms2),cljs.core.str.cljs$core$IFn$_invoke$arity$1(ms3)].join(''));
return ((x__5090__auto__ < y__5091__auto__) ? x__5090__auto__ : y__5091__auto__);
})()], null);

}
});
logseq.db.frontend.inputs.keyword_input_dispatch = (function logseq$db$frontend$inputs$keyword_input_dispatch(input){
if(cljs.core.truth_((function (){var fexpr__97279 = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 8, [new cljs.core.Keyword(null,"parent-block","parent-block",-1919487774),null,new cljs.core.Keyword(null,"current-block","current-block",1027687970),null,new cljs.core.Keyword(null,"today","today",945271563),null,new cljs.core.Keyword(null,"tomorrow","tomorrow",-1509090259),null,new cljs.core.Keyword(null,"query-page","query-page",1890357937),null,new cljs.core.Keyword(null,"yesterday","yesterday",288588595),null,new cljs.core.Keyword(null,"right-now-ms","right-now-ms",870086395),null,new cljs.core.Keyword(null,"current-page","current-page",-101294180),null], null), null);
return (fexpr__97279.cljs$core$IFn$_invoke$arity$1 ? fexpr__97279.cljs$core$IFn$_invoke$arity$1(input) : fexpr__97279.call(null,input));
})())){
return input;
} else {
if(cljs.core.truth_(cljs.core.re_find(/^[+-]\d+[dwmy]?$/,cljs.core.name(input)))){
return new cljs.core.Keyword(null,"relative-date","relative-date",1684694144);
} else {
if(cljs.core.truth_(cljs.core.re_find(/^[+-]\d+[dwmy]-(ms|start|end|\d{2}|\d{4}|\d{6}|\d{9})?$/,cljs.core.name(input)))){
return new cljs.core.Keyword(null,"relative-date-time","relative-date-time",510847038);
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"start-of-today-ms","start-of-today-ms",-794505898),input)){
return new cljs.core.Keyword(null,"today-time","today-time",-70316549);
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"end-of-today-ms","end-of-today-ms",-45150561),input)){
return new cljs.core.Keyword(null,"today-time","today-time",-70316549);
} else {
if(cljs.core.truth_(cljs.core.re_find(/^today-(start|end|\d{2}|\d{4}|\d{6}|\d{9})$/,cljs.core.name(input)))){
return new cljs.core.Keyword(null,"today-time","today-time",-70316549);
} else {
if(cljs.core.truth_(cljs.core.re_find(/^\d+d(-before|-after|-before-ms|-after-ms)?$/,cljs.core.name(input)))){
return new cljs.core.Keyword(null,"DEPRECATED-relative-date","DEPRECATED-relative-date",654143435);
} else {
return null;
}
}
}
}
}
}
}
});
if((typeof logseq !== 'undefined') && (typeof logseq.db !== 'undefined') && (typeof logseq.db.frontend !== 'undefined') && (typeof logseq.db.frontend.inputs !== 'undefined') && (typeof logseq.db.frontend.inputs.resolve_keyword_input !== 'undefined')){
} else {
logseq.db.frontend.inputs.resolve_keyword_input = (function (){var method_table__5599__auto__ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
var prefer_table__5600__auto__ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
var method_cache__5601__auto__ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
var cached_hierarchy__5602__auto__ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
var hierarchy__5603__auto__ = cljs.core.get.cljs$core$IFn$_invoke$arity$3(cljs.core.PersistentArrayMap.EMPTY,new cljs.core.Keyword(null,"hierarchy","hierarchy",-1053470341),(function (){var fexpr__97280 = cljs.core.get_global_hierarchy;
return (fexpr__97280.cljs$core$IFn$_invoke$arity$0 ? fexpr__97280.cljs$core$IFn$_invoke$arity$0() : fexpr__97280.call(null));
})());
return (new cljs.core.MultiFn(cljs.core.symbol.cljs$core$IFn$_invoke$arity$2("logseq.db.frontend.inputs","resolve-keyword-input"),(function (_db,input,_opts){
return logseq.db.frontend.inputs.keyword_input_dispatch(input);
}),new cljs.core.Keyword(null,"default","default",-1987822328),hierarchy__5603__auto__,method_table__5599__auto__,prefer_table__5600__auto__,method_cache__5601__auto__,cached_hierarchy__5602__auto__));
})();
}
logseq.db.frontend.inputs.resolve_keyword_input.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"current-page","current-page",-101294180),(function (_,___$1,p__97281){
var map__97282 = p__97281;
var map__97282__$1 = cljs.core.__destructure_map(map__97282);
var current_page_fn = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__97282__$1,new cljs.core.Keyword(null,"current-page-fn","current-page-fn",1987406514));
if(cljs.core.truth_(current_page_fn)){
var G__97283 = (current_page_fn.cljs$core$IFn$_invoke$arity$0 ? current_page_fn.cljs$core$IFn$_invoke$arity$0() : current_page_fn.call(null));
if((G__97283 == null)){
return null;
} else {
return clojure.string.lower_case(G__97283);
}
} else {
return null;
}
}));
logseq.db.frontend.inputs.resolve_keyword_input.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"query-page","query-page",1890357937),(function (db,_,p__97284){
var map__97285 = p__97284;
var map__97285__$1 = cljs.core.__destructure_map(map__97285);
var current_block_uuid = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__97285__$1,new cljs.core.Keyword(null,"current-block-uuid","current-block-uuid",-559721957));
var temp__5804__auto__ = (function (){var and__5000__auto__ = current_block_uuid;
if(cljs.core.truth_(and__5000__auto__)){
var G__97286 = db;
var G__97287 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),current_block_uuid], null);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__97286,G__97287) : datascript.core.entity.call(null,G__97286,G__97287));
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5804__auto__)){
var current_block = temp__5804__auto__;
return cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(current_block,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","page","block/page",822314108),new cljs.core.Keyword("block","name","block/name",1619760316)], null));
} else {
return null;
}
}));
logseq.db.frontend.inputs.resolve_keyword_input.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"current-block","current-block",1027687970),(function (db,_,p__97288){
var map__97289 = p__97288;
var map__97289__$1 = cljs.core.__destructure_map(map__97289);
var current_block_uuid = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__97289__$1,new cljs.core.Keyword(null,"current-block-uuid","current-block-uuid",-559721957));
if(cljs.core.truth_(current_block_uuid)){
return new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1((function (){var G__97290 = db;
var G__97291 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),current_block_uuid], null);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__97290,G__97291) : datascript.core.entity.call(null,G__97290,G__97291));
})());
} else {
return null;
}
}));
logseq.db.frontend.inputs.resolve_keyword_input.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"parent-block","parent-block",-1919487774),(function (db,_,p__97292){
var map__97293 = p__97292;
var map__97293__$1 = cljs.core.__destructure_map(map__97293);
var current_block_uuid = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__97293__$1,new cljs.core.Keyword(null,"current-block-uuid","current-block-uuid",-559721957));
if(cljs.core.truth_(current_block_uuid)){
return new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","parent","block/parent",-918309064).cljs$core$IFn$_invoke$arity$1((function (){var G__97294 = db;
var G__97295 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),current_block_uuid], null);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__97294,G__97295) : datascript.core.entity.call(null,G__97294,G__97295));
})()));
} else {
return null;
}
}));
logseq.db.frontend.inputs.resolve_keyword_input.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"today","today",945271563),(function (_,___$1,___$2){
return logseq.common.util.date_time.date__GT_int(cljs_time.core.today());
}));
logseq.db.frontend.inputs.resolve_keyword_input.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"yesterday","yesterday",288588595),(function (_,___$1,___$2){
return logseq.common.util.date_time.date__GT_int(cljs_time.core.minus.cljs$core$IFn$_invoke$arity$2(cljs_time.core.today(),cljs_time.core.days.cljs$core$IFn$_invoke$arity$1((1))));
}));
logseq.db.frontend.inputs.resolve_keyword_input.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"tomorrow","tomorrow",-1509090259),(function (_,___$1,___$2){
return logseq.common.util.date_time.date__GT_int(cljs_time.core.plus.cljs$core$IFn$_invoke$arity$2(cljs_time.core.today(),cljs_time.core.days.cljs$core$IFn$_invoke$arity$1((1))));
}));
logseq.db.frontend.inputs.resolve_keyword_input.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"right-now-ms","right-now-ms",870086395),(function (_,___$1,___$2){
return logseq.common.util.time_ms();
}));
logseq.db.frontend.inputs.resolve_keyword_input.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"today-time","today-time",-70316549),(function (_db,input,_opts){
var vec__97296 = (function (){var G__97299 = input;
var G__97299__$1 = (((G__97299 instanceof cljs.core.Keyword))?G__97299.fqn:null);
switch (G__97299__$1) {
case "start-of-today-ms":
return new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [(0),(0),(0),(0)], null);

break;
case "end-of-today-ms":
return new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [(23),(59),(59),(999)], null);

break;
default:
return logseq.db.frontend.inputs.get_ts_units(null,cljs.core.subs.cljs$core$IFn$_invoke$arity$2(cljs.core.name(input),(6)));

}
})();
var hh = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__97296,(0),null);
var mm = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__97296,(1),null);
var ss = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__97296,(2),null);
var ms = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__97296,(3),null);
return logseq.db.frontend.inputs.date_at_local_ms.cljs$core$IFn$_invoke$arity$5(cljs_time.core.today(),hh,mm,ss,ms);
}));
logseq.db.frontend.inputs.resolve_keyword_input.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"relative-date","relative-date",1684694144),(function (_,input,___$1){
var relative_to = logseq.db.frontend.inputs.get_relative_date(input);
var vec__97300 = cljs.core.re_find(/^([+-])(\d+)([dwmy])$/,cljs.core.name(input));
var ___$2 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__97300,(0),null);
var offset_direction = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__97300,(1),null);
var offset = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__97300,(2),null);
var offset_unit = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__97300,(3),null);
var offset_date = logseq.db.frontend.inputs.get_offset_date(relative_to,offset_direction,offset,offset_unit);
return logseq.common.util.date_time.date__GT_int(offset_date);
}));
logseq.db.frontend.inputs.resolve_keyword_input.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"relative-date-time","relative-date-time",510847038),(function (_,input,___$1){
var relative_to = logseq.db.frontend.inputs.get_relative_date(input);
var vec__97303 = cljs.core.re_find(/^([+-])(\d+)([dwmy])-(ms|start|end|\d{2,9})$/,cljs.core.name(input));
var ___$2 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__97303,(0),null);
var offset_direction = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__97303,(1),null);
var offset = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__97303,(2),null);
var offset_unit = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__97303,(3),null);
var ts = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__97303,(4),null);
var offset_date = logseq.db.frontend.inputs.get_offset_date(relative_to,offset_direction,offset,offset_unit);
var vec__97306 = logseq.db.frontend.inputs.get_ts_units(offset_direction,ts);
var hh = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__97306,(0),null);
var mm = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__97306,(1),null);
var ss = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__97306,(2),null);
var ms = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__97306,(3),null);
return logseq.db.frontend.inputs.date_at_local_ms.cljs$core$IFn$_invoke$arity$5(offset_date,hh,mm,ss,ms);
}));
logseq.db.frontend.inputs.resolve_keyword_input.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"DEPRECATED-relative-date","DEPRECATED-relative-date",654143435),(function (db,input,opts){
return logseq.db.frontend.inputs.resolve_keyword_input.cljs$core$IFn$_invoke$arity$3(db,logseq.db.frontend.inputs.old__GT_new_relative_date_format(input),opts);
}));
logseq.db.frontend.inputs.resolve_keyword_input.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"default","default",-1987822328),(function (_,___$1,___$2){
return null;
}));
/**
 * Main fn for resolving advanced query :inputs
 */
logseq.db.frontend.inputs.resolve_input = (function logseq$db$frontend$inputs$resolve_input(db,input,p__97309){
var map__97310 = p__97309;
var map__97310__$1 = cljs.core.__destructure_map(map__97310);
var current_block_uuid = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__97310__$1,new cljs.core.Keyword(null,"current-block-uuid","current-block-uuid",-559721957));
var current_page_fn = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__97310__$1,new cljs.core.Keyword(null,"current-page-fn","current-page-fn",1987406514),cljs.core.constantly(null));
if((input instanceof cljs.core.Keyword)){
var or__5002__auto__ = logseq.db.frontend.inputs.resolve_keyword_input.cljs$core$IFn$_invoke$arity$3(db,input,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"current-block-uuid","current-block-uuid",-559721957),current_block_uuid,new cljs.core.Keyword(null,"current-page-fn","current-page-fn",1987406514),current_page_fn], null));
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return input;
}
} else {
if(((typeof input === 'string') && (logseq.common.util.page_ref.page_ref_QMARK_(input)))){
return clojure.string.lower_case(logseq.common.util.page_ref.get_page_name(input));
} else {
return input;

}
}
});

//# sourceMappingURL=logseq.db.frontend.inputs.js.map
