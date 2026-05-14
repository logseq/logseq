goog.provide('cljs_time.coerce');

/**
 * @interface
 */
cljs_time.coerce.ICoerce = function(){};

var cljs_time$coerce$ICoerce$to_date_time$dyn_58838 = (function (obj){
var x__5350__auto__ = (((obj == null))?null:obj);
var m__5351__auto__ = (cljs_time.coerce.to_date_time[goog.typeOf(x__5350__auto__)]);
if((!((m__5351__auto__ == null)))){
return (m__5351__auto__.cljs$core$IFn$_invoke$arity$1 ? m__5351__auto__.cljs$core$IFn$_invoke$arity$1(obj) : m__5351__auto__.call(null,obj));
} else {
var m__5349__auto__ = (cljs_time.coerce.to_date_time["_"]);
if((!((m__5349__auto__ == null)))){
return (m__5349__auto__.cljs$core$IFn$_invoke$arity$1 ? m__5349__auto__.cljs$core$IFn$_invoke$arity$1(obj) : m__5349__auto__.call(null,obj));
} else {
throw cljs.core.missing_protocol("ICoerce.to-date-time",obj);
}
}
});
/**
 * Convert `obj` to a goog.date.DateTime instance.
 */
cljs_time.coerce.to_date_time = (function cljs_time$coerce$to_date_time(obj){
if((((!((obj == null)))) && ((!((obj.cljs_time$coerce$ICoerce$to_date_time$arity$1 == null)))))){
return obj.cljs_time$coerce$ICoerce$to_date_time$arity$1(obj);
} else {
return cljs_time$coerce$ICoerce$to_date_time$dyn_58838(obj);
}
});

/**
 * Returns a DateTime instance in the UTC time zone corresponding to the given
 *   number of milliseconds after the Unix epoch.
 */
cljs_time.coerce.from_long = (function cljs_time$coerce$from_long(millis){
var G__58778 = millis;
if((G__58778 == null)){
return null;
} else {
return (goog.date.UtcDateTime.fromTimestamp.cljs$core$IFn$_invoke$arity$1 ? goog.date.UtcDateTime.fromTimestamp.cljs$core$IFn$_invoke$arity$1(G__58778) : goog.date.UtcDateTime.fromTimestamp.call(null,G__58778));
}
});
/**
 * Returns DateTime instance from string using formatters in cljs-time.format,
 *   returning first which parses
 */
cljs_time.coerce.from_string = (function cljs_time$coerce$from_string(s){
if(cljs.core.truth_(s)){
return cljs.core.first((function (){var iter__5480__auto__ = (function cljs_time$coerce$from_string_$_iter__58785(s__58786){
return (new cljs.core.LazySeq(null,(function (){
var s__58786__$1 = s__58786;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__58786__$1);
if(temp__5804__auto__){
var s__58786__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__58786__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__58786__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__58788 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__58787 = (0);
while(true){
if((i__58787 < size__5479__auto__)){
var f = cljs.core._nth(c__5478__auto__,i__58787);
var d = (function (){try{return cljs_time.format.parse.cljs$core$IFn$_invoke$arity$2(f,s);
}catch (e58794){if((e58794 instanceof Error)){
var _ = e58794;
return null;
} else {
throw e58794;

}
}})();
if(cljs.core.truth_(d)){
cljs.core.chunk_append(b__58788,d);

var G__58839 = (i__58787 + (1));
i__58787 = G__58839;
continue;
} else {
var G__58840 = (i__58787 + (1));
i__58787 = G__58840;
continue;
}
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__58788),cljs_time$coerce$from_string_$_iter__58785(cljs.core.chunk_rest(s__58786__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__58788),null);
}
} else {
var f = cljs.core.first(s__58786__$2);
var d = (function (){try{return cljs_time.format.parse.cljs$core$IFn$_invoke$arity$2(f,s);
}catch (e58796){if((e58796 instanceof Error)){
var _ = e58796;
return null;
} else {
throw e58796;

}
}})();
if(cljs.core.truth_(d)){
return cljs.core.cons(d,cljs_time$coerce$from_string_$_iter__58785(cljs.core.rest(s__58786__$2)));
} else {
var G__58843 = cljs.core.rest(s__58786__$2);
s__58786__$1 = G__58843;
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
return iter__5480__auto__(cljs.core.vals(cljs_time.format.formatters));
})());
} else {
return null;
}
});
/**
 * Returns a DateTime instance in the UTC time zone corresponding to the given
 *   js Date object.
 */
cljs_time.coerce.from_date = (function cljs_time$coerce$from_date(date){
var G__58814 = date;
var G__58814__$1 = (((G__58814 == null))?null:G__58814.getTime());
if((G__58814__$1 == null)){
return null;
} else {
return cljs_time.coerce.from_long(G__58814__$1);
}
});
/**
 * Convert `obj` to the number of milliseconds after the Unix epoch.
 */
cljs_time.coerce.to_long = (function cljs_time$coerce$to_long(obj){
var G__58822 = obj;
var G__58822__$1 = (((G__58822 == null))?null:cljs_time.coerce.to_date_time(G__58822));
if((G__58822__$1 == null)){
return null;
} else {
return G__58822__$1.getTime();
}
});
/**
 * Convert `obj` to Unix epoch.
 */
cljs_time.coerce.to_epoch = (function cljs_time$coerce$to_epoch(obj){
var millis = cljs_time.coerce.to_long(obj);
var and__5000__auto__ = millis;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.quot(millis,(1000));
} else {
return and__5000__auto__;
}
});
/**
 * Convert `obj` to a JavaScript Date instance.
 */
cljs_time.coerce.to_date = (function cljs_time$coerce$to_date(obj){
var G__58824 = obj;
var G__58824__$1 = (((G__58824 == null))?null:cljs_time.coerce.to_date_time(G__58824));
var G__58824__$2 = (((G__58824__$1 == null))?null:G__58824__$1.getTime());
if((G__58824__$2 == null)){
return null;
} else {
return (new Date(G__58824__$2));
}
});
/**
 * Returns a string representation of obj in UTC time-zone
 *   using "yyyy-MM-dd'T'HH:mm:ss.SSSZZ" date-time representation.
 */
cljs_time.coerce.to_string = (function cljs_time$coerce$to_string(obj){
var G__58830 = obj;
var G__58830__$1 = (((G__58830 == null))?null:cljs_time.coerce.to_date_time(G__58830));
if((G__58830__$1 == null)){
return null;
} else {
return cljs_time.format.unparse(new cljs.core.Keyword(null,"date-time","date-time",177938180).cljs$core$IFn$_invoke$arity$1(cljs_time.format.formatters),G__58830__$1);
}
});
/**
 * Convert `obj` to a goog.date.Date instance
 */
cljs_time.coerce.to_local_date = (function cljs_time$coerce$to_local_date(obj){
if(cljs.core.truth_(obj)){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(goog.date.Date,cljs.core.type(obj))){
return obj;
} else {
var temp__5802__auto__ = cljs_time.coerce.to_date_time(obj);
if(cljs.core.truth_(temp__5802__auto__)){
var dt = temp__5802__auto__;
return (new goog.date.Date(dt.getYear(),dt.getMonth(),dt.getDate()));
} else {
return null;
}
}
} else {
return null;
}
});
/**
 * Convert `obj` to a goog.date.DateTime instance
 */
cljs_time.coerce.to_local_date_time = (function cljs_time$coerce$to_local_date_time(obj){
if(cljs.core.truth_(obj)){
var temp__5802__auto__ = cljs_time.coerce.to_date_time(obj);
if(cljs.core.truth_(temp__5802__auto__)){
var dt = temp__5802__auto__;
var G__58832 = (new goog.date.DateTime(dt.getYear(),dt.getMonth(),dt.getDate()));
G__58832.setHours(dt.getHours());

G__58832.setMinutes(dt.getMinutes());

G__58832.setSeconds(dt.getSeconds());

G__58832.setMilliseconds(dt.getMilliseconds());

return G__58832;
} else {
return null;
}
} else {
return null;
}
});
(cljs_time.coerce.ICoerce["null"] = true);

(cljs_time.coerce.to_date_time["null"] = (function (_){
return null;
}));

(Date.prototype.cljs_time$coerce$ICoerce$ = cljs.core.PROTOCOL_SENTINEL);

(Date.prototype.cljs_time$coerce$ICoerce$to_date_time$arity$1 = (function (date){
var date__$1 = this;
return cljs_time.coerce.from_date(date__$1);
}));

(goog.date.Date.prototype.cljs_time$coerce$ICoerce$ = cljs.core.PROTOCOL_SENTINEL);

(goog.date.Date.prototype.cljs_time$coerce$ICoerce$to_date_time$arity$1 = (function (local_date){
var local_date__$1 = this;
if(cljs.core.truth_(local_date__$1)){
return cljs_time.core.to_utc_time_zone(local_date__$1);
} else {
return null;
}
}));

(goog.date.DateTime.prototype.cljs_time$coerce$ICoerce$ = cljs.core.PROTOCOL_SENTINEL);

(goog.date.DateTime.prototype.cljs_time$coerce$ICoerce$to_date_time$arity$1 = (function (local_date_time){
var local_date_time__$1 = this;
if(cljs.core.truth_(local_date_time__$1)){
return cljs_time.core.to_utc_time_zone(local_date_time__$1);
} else {
return null;
}
}));

(goog.date.UtcDateTime.prototype.cljs_time$coerce$ICoerce$ = cljs.core.PROTOCOL_SENTINEL);

(goog.date.UtcDateTime.prototype.cljs_time$coerce$ICoerce$to_date_time$arity$1 = (function (date_time){
var date_time__$1 = this;
return date_time__$1;
}));

(cljs_time.coerce.ICoerce["number"] = true);

(cljs_time.coerce.to_date_time["number"] = (function (long$){
return cljs_time.coerce.from_long(long$);
}));

(cljs_time.coerce.ICoerce["string"] = true);

(cljs_time.coerce.to_date_time["string"] = (function (string){
return cljs_time.coerce.from_string(string);
}));

//# sourceMappingURL=cljs_time.coerce.js.map
