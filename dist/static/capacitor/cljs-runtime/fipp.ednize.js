goog.provide('fipp.ednize');

/**
 * Perform a shallow conversion to an Edn data structure.
 * @interface
 */
fipp.ednize.IEdn = function(){};

var fipp$ednize$IEdn$_edn$dyn_70970 = (function (x){
var x__5350__auto__ = (((x == null))?null:x);
var m__5351__auto__ = (fipp.ednize._edn[goog.typeOf(x__5350__auto__)]);
if((!((m__5351__auto__ == null)))){
return (m__5351__auto__.cljs$core$IFn$_invoke$arity$1 ? m__5351__auto__.cljs$core$IFn$_invoke$arity$1(x) : m__5351__auto__.call(null,x));
} else {
var m__5349__auto__ = (fipp.ednize._edn["_"]);
if((!((m__5349__auto__ == null)))){
return (m__5349__auto__.cljs$core$IFn$_invoke$arity$1 ? m__5349__auto__.cljs$core$IFn$_invoke$arity$1(x) : m__5349__auto__.call(null,x));
} else {
throw cljs.core.missing_protocol("IEdn.-edn",x);
}
}
});
fipp.ednize._edn = (function fipp$ednize$_edn(x){
if((((!((x == null)))) && ((!((x.fipp$ednize$IEdn$_edn$arity$1 == null)))))){
return x.fipp$ednize$IEdn$_edn$arity$1(x);
} else {
return fipp$ednize$IEdn$_edn$dyn_70970(x);
}
});


/**
 * Mark object as preferring its custom IEdn behavior.
 * @interface
 */
fipp.ednize.IOverride = function(){};

fipp.ednize.override_QMARK_ = (function fipp$ednize$override_QMARK_(x){
if((!((x == null)))){
if(((false) || ((cljs.core.PROTOCOL_SENTINEL === x.fipp$ednize$IEdn$)))){
return true;
} else {
if((!x.cljs$lang$protocol_mask$partition$)){
return cljs.core.native_satisfies_QMARK_(fipp.ednize.IEdn,x);
} else {
return false;
}
}
} else {
return cljs.core.native_satisfies_QMARK_(fipp.ednize.IEdn,x);
}
});
fipp.ednize.edn = (function fipp$ednize$edn(x){
if(fipp.ednize.override_QMARK_(x)){
return fipp.ednize._edn(x);
} else {
if(cljs.core.object_QMARK_(x)){
return cljs.core.tagged_literal(new cljs.core.Symbol(null,"js","js",-886355190,null),cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,(function (){var iter__5480__auto__ = (function fipp$ednize$edn_$_iter__70942(s__70943){
return (new cljs.core.LazySeq(null,(function (){
var s__70943__$1 = s__70943;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__70943__$1);
if(temp__5804__auto__){
var s__70943__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__70943__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__70943__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__70945 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__70944 = (0);
while(true){
if((i__70944 < size__5479__auto__)){
var k = cljs.core._nth(c__5478__auto__,i__70944);
cljs.core.chunk_append(b__70945,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(k),(x[k])], null));

var G__70974 = (i__70944 + (1));
i__70944 = G__70974;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__70945),fipp$ednize$edn_$_iter__70942(cljs.core.chunk_rest(s__70943__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__70945),null);
}
} else {
var k = cljs.core.first(s__70943__$2);
return cljs.core.cons(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(k),(x[k])], null),fipp$ednize$edn_$_iter__70942(cljs.core.rest(s__70943__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(cljs.core.js_keys(x));
})()));
} else {
if(cljs.core.array_QMARK_(x)){
return cljs.core.tagged_literal(new cljs.core.Symbol(null,"js","js",-886355190,null),cljs.core.vec(x));
} else {
if((((!((x == null))))?(((((x.cljs$lang$protocol_mask$partition0$ & (32768))) || ((cljs.core.PROTOCOL_SENTINEL === x.cljs$core$IDeref$))))?true:(((!x.cljs$lang$protocol_mask$partition0$))?cljs.core.native_satisfies_QMARK_(cljs.core.IDeref,x):false)):cljs.core.native_satisfies_QMARK_(cljs.core.IDeref,x))){
var pending_QMARK_ = (function (){var and__5000__auto__ = (((!((x == null))))?(((((x.cljs$lang$protocol_mask$partition1$ & (1))) || ((cljs.core.PROTOCOL_SENTINEL === x.cljs$core$IPending$))))?true:(((!x.cljs$lang$protocol_mask$partition1$))?cljs.core.native_satisfies_QMARK_(cljs.core.IPending,x):false)):cljs.core.native_satisfies_QMARK_(cljs.core.IPending,x));
if(and__5000__auto__){
return (!(cljs.core.realized_QMARK_(x)));
} else {
return and__5000__auto__;
}
})();
var val = ((pending_QMARK_)?null:cljs.core.deref(x));
var status = ((pending_QMARK_)?new cljs.core.Keyword(null,"pending","pending",-220036727):new cljs.core.Keyword(null,"ready","ready",1086465795));
return cljs.core.tagged_literal(new cljs.core.Symbol(null,"object","object",-1179821820,null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.symbol.cljs$core$IFn$_invoke$arity$1(cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.type(x)], 0))),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"status","status",-1997798413),status,new cljs.core.Keyword(null,"val","val",128701612),val], null)], null));
} else {
if((x instanceof Date)){
return cljs.core.tagged_literal(new cljs.core.Symbol(null,"inst","inst",-2008473268,null),(function (){var normalize = (function (n,len){
var ns = cljs.core.str.cljs$core$IFn$_invoke$arity$1(n);
while(true){
if((((ns).length) < len)){
var G__70982 = ["0",ns].join('');
ns = G__70982;
continue;
} else {
return ns;
}
break;
}
});
return [cljs.core.str.cljs$core$IFn$_invoke$arity$1(x.getUTCFullYear()),"-",normalize((x.getUTCMonth() + (1)),(2)),"-",normalize(x.getUTCDate(),(2)),"T",normalize(x.getUTCHours(),(2)),":",normalize(x.getUTCMinutes(),(2)),":",normalize(x.getUTCSeconds(),(2)),".",normalize(x.getUTCMilliseconds(),(3)),"-","00:00"].join('');
})());
} else {
if((((!((x == null))))?((((false) || ((cljs.core.PROTOCOL_SENTINEL === x.fipp$ednize$IEdn$))))?true:(((!x.cljs$lang$protocol_mask$partition$))?cljs.core.native_satisfies_QMARK_(fipp.ednize.IEdn,x):false)):cljs.core.native_satisfies_QMARK_(fipp.ednize.IEdn,x))){
return fipp.ednize._edn(x);
} else {
if(cljs.core.truth_(fipp.util.edn_QMARK_(x))){
return x;
} else {
return cljs.core.tagged_literal(new cljs.core.Symbol(null,"object","object",-1179821820,null),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.symbol.cljs$core$IFn$_invoke$arity$1(cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.type(x)], 0)))], null));

}
}
}
}
}
}
}
});
(cljs.core.UUID.prototype.fipp$ednize$IEdn$ = cljs.core.PROTOCOL_SENTINEL);

(cljs.core.UUID.prototype.fipp$ednize$IEdn$_edn$arity$1 = (function (x){
var x__$1 = this;
return cljs.core.tagged_literal(new cljs.core.Symbol(null,"uuid","uuid",-504564192,null),cljs.core.str.cljs$core$IFn$_invoke$arity$1(x__$1));
}));

(cljs.core.ExceptionInfo.prototype.fipp$ednize$IEdn$ = cljs.core.PROTOCOL_SENTINEL);

(cljs.core.ExceptionInfo.prototype.fipp$ednize$IEdn$_edn$arity$1 = (function (x){
var x__$1 = this;
return cljs.core.tagged_literal(new cljs.core.Symbol(null,"ExceptionInfo","ExceptionInfo",294935087,null),cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"message","message",-406056002),cljs.core.ex_message(x__$1),new cljs.core.Keyword(null,"data","data",-232669377),cljs.core.ex_data(x__$1)], null),(function (){var temp__5804__auto__ = cljs.core.ex_cause(x__$1);
if(cljs.core.truth_(temp__5804__auto__)){
var cause = temp__5804__auto__;
return new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"cause","cause",231901252),cause], null);
} else {
return null;
}
})()], 0)));
}));
fipp.ednize.record__GT_tagged = (function fipp$ednize$record__GT_tagged(x){
return cljs.core.tagged_literal(cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core.symbol,clojure.string.split.cljs$core$IFn$_invoke$arity$3(cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.type(x)], 0)),/\//,(2))),cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,x));
});

//# sourceMappingURL=fipp.ednize.js.map
