goog.provide('cljs_time.local');
/**
 * Map of local formatters for parsing and printing.
 */
cljs_time.local._STAR_local_formatters_STAR_ = cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p__77688){
var vec__77689 = p__77688;
var k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__77689,(0),null);
var f = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__77689,(1),null);
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [k,((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"type","type",1174270348).cljs$core$IFn$_invoke$arity$1(cljs.core.meta(f)),new cljs.core.Keyword("fmt","formatter","fmt/formatter",-483947944)))?cljs.core.update_in.cljs$core$IFn$_invoke$arity$3(f,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"parser","parser",-1543495310)], null),(function (p1__77687_SHARP_){
return cljs_time.core.to_default_time_zone(p1__77687_SHARP_);
})):f)], null);
}),cljs_time.format.formatters));
/**
 * Returns a DateTime for the current instant in the default time zone.
 */
cljs_time.local.local_now = (function cljs_time$local$local_now(){
return cljs_time.core.time_now();
});

/**
 * @interface
 */
cljs_time.local.ILocalCoerce = function(){};

var cljs_time$local$ILocalCoerce$to_local_date_time$dyn_77706 = (function (obj){
var x__5350__auto__ = (((obj == null))?null:obj);
var m__5351__auto__ = (cljs_time.local.to_local_date_time[goog.typeOf(x__5350__auto__)]);
if((!((m__5351__auto__ == null)))){
return (m__5351__auto__.cljs$core$IFn$_invoke$arity$1 ? m__5351__auto__.cljs$core$IFn$_invoke$arity$1(obj) : m__5351__auto__.call(null,obj));
} else {
var m__5349__auto__ = (cljs_time.local.to_local_date_time["_"]);
if((!((m__5349__auto__ == null)))){
return (m__5349__auto__.cljs$core$IFn$_invoke$arity$1 ? m__5349__auto__.cljs$core$IFn$_invoke$arity$1(obj) : m__5349__auto__.call(null,obj));
} else {
throw cljs.core.missing_protocol("ILocalCoerce.to-local-date-time",obj);
}
}
});
/**
 * convert `obj` to a local goog.date
 *                           DateTime instance retaining time fields.
 */
cljs_time.local.to_local_date_time = (function cljs_time$local$to_local_date_time(obj){
if((((!((obj == null)))) && ((!((obj.cljs_time$local$ILocalCoerce$to_local_date_time$arity$1 == null)))))){
return obj.cljs_time$local$ILocalCoerce$to_local_date_time$arity$1(obj);
} else {
return cljs_time$local$ILocalCoerce$to_local_date_time$dyn_77706(obj);
}
});

/**
 * Coerce to date-time in the default time zone retaining time fields.
 */
cljs_time.local.as_local_date_time_from_time_zone = (function cljs_time$local$as_local_date_time_from_time_zone(obj){
return cljs_time.coerce.to_local_date_time(cljs_time.coerce.to_date_time(obj));
});
/**
 * Coerce to date-time in the default time zone.
 */
cljs_time.local.as_local_date_time_to_time_zone = (function cljs_time$local$as_local_date_time_to_time_zone(obj){
return cljs_time.core.to_default_time_zone(cljs_time.coerce.to_date_time(obj));
});
/**
 * Return local DateTime instance from string using
 *   formatters in *local-formatters*, returning first
 *   which parses.
 */
cljs_time.local.from_local_string = (function cljs_time$local$from_local_string(s){
return cljs.core.first((function (){var iter__5480__auto__ = (function cljs_time$local$from_local_string_$_iter__77695(s__77696){
return (new cljs.core.LazySeq(null,(function (){
var s__77696__$1 = s__77696;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__77696__$1);
if(temp__5804__auto__){
var s__77696__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__77696__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__77696__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__77698 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__77697 = (0);
while(true){
if((i__77697 < size__5479__auto__)){
var f = cljs.core._nth(c__5478__auto__,i__77697);
var d = (function (){try{return cljs_time.format.parse.cljs$core$IFn$_invoke$arity$2(f,s);
}catch (e77700){if((e77700 instanceof Error)){
var _ = e77700;
return null;
} else {
throw e77700;

}
}})();
if(cljs.core.truth_(d)){
cljs.core.chunk_append(b__77698,d);

var G__77709 = (i__77697 + (1));
i__77697 = G__77709;
continue;
} else {
var G__77710 = (i__77697 + (1));
i__77697 = G__77710;
continue;
}
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__77698),cljs_time$local$from_local_string_$_iter__77695(cljs.core.chunk_rest(s__77696__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__77698),null);
}
} else {
var f = cljs.core.first(s__77696__$2);
var d = (function (){try{return cljs_time.format.parse.cljs$core$IFn$_invoke$arity$2(f,s);
}catch (e77702){if((e77702 instanceof Error)){
var _ = e77702;
return null;
} else {
throw e77702;

}
}})();
if(cljs.core.truth_(d)){
return cljs.core.cons(d,cljs_time$local$from_local_string_$_iter__77695(cljs.core.rest(s__77696__$2)));
} else {
var G__77711 = cljs.core.rest(s__77696__$2);
s__77696__$1 = G__77711;
continue;
}
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(cljs.core.vals(cljs_time.local._STAR_local_formatters_STAR_));
})());
});
(cljs_time.local.ILocalCoerce["null"] = true);

(cljs_time.local.to_local_date_time["null"] = (function (_){
return null;
}));

(Date.prototype.cljs_time$local$ILocalCoerce$ = cljs.core.PROTOCOL_SENTINEL);

(Date.prototype.cljs_time$local$ILocalCoerce$to_local_date_time$arity$1 = (function (date){
var date__$1 = this;
return cljs_time.local.as_local_date_time_from_time_zone(cljs_time.coerce.to_date_time(date__$1));
}));

(goog.date.DateTime.prototype.cljs_time$local$ILocalCoerce$ = cljs.core.PROTOCOL_SENTINEL);

(goog.date.DateTime.prototype.cljs_time$local$ILocalCoerce$to_local_date_time$arity$1 = (function (date_time){
var date_time__$1 = this;
return cljs_time.local.as_local_date_time_from_time_zone(date_time__$1);
}));

(cljs_time.local.ILocalCoerce["number"] = true);

(cljs_time.local.to_local_date_time["number"] = (function (long$){
return cljs_time.local.as_local_date_time_from_time_zone(long$);
}));

(cljs_time.local.ILocalCoerce["string"] = true);

(cljs_time.local.to_local_date_time["string"] = (function (string){
return cljs_time.local.from_local_string(string);
}));
/**
 * Format obj as local time using the local formatter corresponding
 *   to format-key.
 */
cljs_time.local.format_local_time = (function cljs_time$local$format_local_time(obj,format_key){
var temp__5804__auto__ = cljs_time.local.to_local_date_time(obj);
if(cljs.core.truth_(temp__5804__auto__)){
var dt = temp__5804__auto__;
var temp__5804__auto____$1 = (format_key.cljs$core$IFn$_invoke$arity$1 ? format_key.cljs$core$IFn$_invoke$arity$1(cljs_time.local._STAR_local_formatters_STAR_) : format_key.call(null,cljs_time.local._STAR_local_formatters_STAR_));
if(cljs.core.truth_(temp__5804__auto____$1)){
var fmt = temp__5804__auto____$1;
return cljs_time.format.unparse(fmt,dt);
} else {
return null;
}
} else {
return null;
}
});

//# sourceMappingURL=cljs_time.local.js.map
