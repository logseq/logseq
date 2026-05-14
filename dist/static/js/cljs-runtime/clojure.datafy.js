goog.provide('clojure.datafy');
/**
 * Attempts to return x as data.
 *   datafy will return the value of clojure.protocols/datafy. If
 *   the value has been transformed and the result supports
 *   metadata, :clojure.datafy/obj will be set on the metadata to the
 *   original value of x.
 */
clojure.datafy.datafy = (function clojure$datafy$datafy(x){
var v = clojure.core.protocols.datafy(x);
if((v === x)){
return v;
} else {
if((((!((v == null))))?(((((v.cljs$lang$protocol_mask$partition0$ & (262144))) || ((cljs.core.PROTOCOL_SENTINEL === v.cljs$core$IWithMeta$))))?true:false):false)){
return cljs.core.vary_meta.cljs$core$IFn$_invoke$arity$4(v,cljs.core.assoc,new cljs.core.Keyword("clojure.datafy","obj","clojure.datafy/obj",-330079421),x);
} else {
return v;
}
}
});
/**
 * Returns (possibly transformed) v in the context of coll and k (a
 *   key/index or nil). Callers should attempt to provide the key/index
 *   context k for Indexed/Associative/ILookup colls if possible, but not
 *   to fabricate one e.g. for sequences (pass nil). nav will return the
 *   value of clojure.core.protocols/nav.
 */
clojure.datafy.nav = (function clojure$datafy$nav(coll,k,v){
return clojure.core.protocols.nav(coll,k,v);
});
clojure.datafy.datify_ref = (function clojure$datafy$datify_ref(r){
return cljs.core.with_meta(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.deref(r)], null),cljs.core.meta(r));
});
(Error.prototype.clojure$core$protocols$Datafiable$ = cljs.core.PROTOCOL_SENTINEL);

(Error.prototype.clojure$core$protocols$Datafiable$datafy$arity$1 = (function (x){
var x__$1 = this;
return cljs.core.Throwable__GT_map(x__$1);
}));

(cljs.core.ExceptionInfo.prototype.clojure$core$protocols$Datafiable$ = cljs.core.PROTOCOL_SENTINEL);

(cljs.core.ExceptionInfo.prototype.clojure$core$protocols$Datafiable$datafy$arity$1 = (function (x){
var x__$1 = this;
return cljs.core.Throwable__GT_map(x__$1);
}));

(cljs.core.Var.prototype.clojure$core$protocols$Datafiable$ = cljs.core.PROTOCOL_SENTINEL);

(cljs.core.Var.prototype.clojure$core$protocols$Datafiable$datafy$arity$1 = (function (r){
var r__$1 = this;
return clojure.datafy.datify_ref(r__$1);
}));

(cljs.core.Reduced.prototype.clojure$core$protocols$Datafiable$ = cljs.core.PROTOCOL_SENTINEL);

(cljs.core.Reduced.prototype.clojure$core$protocols$Datafiable$datafy$arity$1 = (function (r){
var r__$1 = this;
return clojure.datafy.datify_ref(r__$1);
}));

(cljs.core.Atom.prototype.clojure$core$protocols$Datafiable$ = cljs.core.PROTOCOL_SENTINEL);

(cljs.core.Atom.prototype.clojure$core$protocols$Datafiable$datafy$arity$1 = (function (r){
var r__$1 = this;
return clojure.datafy.datify_ref(r__$1);
}));

(cljs.core.Volatile.prototype.clojure$core$protocols$Datafiable$ = cljs.core.PROTOCOL_SENTINEL);

(cljs.core.Volatile.prototype.clojure$core$protocols$Datafiable$datafy$arity$1 = (function (r){
var r__$1 = this;
return clojure.datafy.datify_ref(r__$1);
}));

(cljs.core.Delay.prototype.clojure$core$protocols$Datafiable$ = cljs.core.PROTOCOL_SENTINEL);

(cljs.core.Delay.prototype.clojure$core$protocols$Datafiable$datafy$arity$1 = (function (r){
var r__$1 = this;
return clojure.datafy.datify_ref(r__$1);
}));

//# sourceMappingURL=clojure.datafy.js.map
