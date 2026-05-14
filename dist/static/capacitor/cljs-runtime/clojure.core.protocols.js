goog.provide('clojure.core.protocols');

/**
 * @interface
 */
clojure.core.protocols.Datafiable = function(){};

var clojure$core$protocols$Datafiable$datafy$dyn_38145 = (function (o){
var x__5350__auto__ = (((o == null))?null:o);
var m__5351__auto__ = (clojure.core.protocols.datafy[goog.typeOf(x__5350__auto__)]);
if((!((m__5351__auto__ == null)))){
return (m__5351__auto__.cljs$core$IFn$_invoke$arity$1 ? m__5351__auto__.cljs$core$IFn$_invoke$arity$1(o) : m__5351__auto__.call(null,o));
} else {
var m__5349__auto__ = (clojure.core.protocols.datafy["_"]);
if((!((m__5349__auto__ == null)))){
return (m__5349__auto__.cljs$core$IFn$_invoke$arity$1 ? m__5349__auto__.cljs$core$IFn$_invoke$arity$1(o) : m__5349__auto__.call(null,o));
} else {
throw cljs.core.missing_protocol("Datafiable.datafy",o);
}
}
});
/**
 * return a representation of o as data (default identity)
 */
clojure.core.protocols.datafy = (function clojure$core$protocols$datafy(o){
var temp__5802__auto__ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(cljs.core.meta(o),cljs.core.with_meta(new cljs.core.Symbol("clojure.core.protocols","datafy","clojure.core.protocols/datafy",707534751,null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("cljs.analyzer","no-resolve","cljs.analyzer/no-resolve",-1872351017),true], null)));
if(temp__5802__auto__){
var meta_impl__5352__auto__ = temp__5802__auto__;
return (meta_impl__5352__auto__.cljs$core$IFn$_invoke$arity$1 ? meta_impl__5352__auto__.cljs$core$IFn$_invoke$arity$1(o) : meta_impl__5352__auto__.call(null,o));
} else {
if((((!((o == null)))) && ((!((o.clojure$core$protocols$Datafiable$datafy$arity$1 == null)))))){
return o.clojure$core$protocols$Datafiable$datafy$arity$1(o);
} else {
return clojure$core$protocols$Datafiable$datafy$dyn_38145(o);
}
}
});

(clojure.core.protocols.Datafiable["null"] = true);

(clojure.core.protocols.datafy["null"] = (function (_){
return null;
}));

(clojure.core.protocols.Datafiable["_"] = true);

(clojure.core.protocols.datafy["_"] = (function (o){
return o;
}));

/**
 * @interface
 */
clojure.core.protocols.Navigable = function(){};

var clojure$core$protocols$Navigable$nav$dyn_38149 = (function (coll,k,v){
var x__5350__auto__ = (((coll == null))?null:coll);
var m__5351__auto__ = (clojure.core.protocols.nav[goog.typeOf(x__5350__auto__)]);
if((!((m__5351__auto__ == null)))){
return (m__5351__auto__.cljs$core$IFn$_invoke$arity$3 ? m__5351__auto__.cljs$core$IFn$_invoke$arity$3(coll,k,v) : m__5351__auto__.call(null,coll,k,v));
} else {
var m__5349__auto__ = (clojure.core.protocols.nav["_"]);
if((!((m__5349__auto__ == null)))){
return (m__5349__auto__.cljs$core$IFn$_invoke$arity$3 ? m__5349__auto__.cljs$core$IFn$_invoke$arity$3(coll,k,v) : m__5349__auto__.call(null,coll,k,v));
} else {
throw cljs.core.missing_protocol("Navigable.nav",coll);
}
}
});
/**
 * return (possibly transformed) v in the context of coll and k (a key/index or nil),
 * defaults to returning v.
 */
clojure.core.protocols.nav = (function clojure$core$protocols$nav(coll,k,v){
var temp__5802__auto__ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(cljs.core.meta(coll),cljs.core.with_meta(new cljs.core.Symbol("clojure.core.protocols","nav","clojure.core.protocols/nav",298936762,null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("cljs.analyzer","no-resolve","cljs.analyzer/no-resolve",-1872351017),true], null)));
if(temp__5802__auto__){
var meta_impl__5352__auto__ = temp__5802__auto__;
return (meta_impl__5352__auto__.cljs$core$IFn$_invoke$arity$3 ? meta_impl__5352__auto__.cljs$core$IFn$_invoke$arity$3(coll,k,v) : meta_impl__5352__auto__.call(null,coll,k,v));
} else {
if((((!((coll == null)))) && ((!((coll.clojure$core$protocols$Navigable$nav$arity$3 == null)))))){
return coll.clojure$core$protocols$Navigable$nav$arity$3(coll,k,v);
} else {
return clojure$core$protocols$Navigable$nav$dyn_38149(coll,k,v);
}
}
});

(clojure.core.protocols.Navigable["_"] = true);

(clojure.core.protocols.nav["_"] = (function (_,___$1,x){
return x;
}));

//# sourceMappingURL=clojure.core.protocols.js.map
