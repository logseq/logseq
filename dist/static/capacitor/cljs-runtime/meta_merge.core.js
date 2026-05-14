goog.provide('meta_merge.core');
/**
 * Returns the metadata of an object, or nil if the object cannot hold
 *   metadata.
 */
meta_merge.core.meta_STAR_ = (function meta_merge$core$meta_STAR_(obj){
if((((!((obj == null))))?(((((obj.cljs$lang$protocol_mask$partition0$ & (131072))) || ((cljs.core.PROTOCOL_SENTINEL === obj.cljs$core$IMeta$))))?true:(((!obj.cljs$lang$protocol_mask$partition0$))?cljs.core.native_satisfies_QMARK_(cljs.core.IMeta,obj):false)):cljs.core.native_satisfies_QMARK_(cljs.core.IMeta,obj))){
return cljs.core.meta(obj);
} else {
return null;
}
});
/**
 * Returns an object of the same type and value as obj, with map m as its
 *   metadata if the object can hold metadata.
 */
meta_merge.core.with_meta_STAR_ = (function meta_merge$core$with_meta_STAR_(obj,m){
if((((!((obj == null))))?(((((obj.cljs$lang$protocol_mask$partition0$ & (262144))) || ((cljs.core.PROTOCOL_SENTINEL === obj.cljs$core$IWithMeta$))))?true:(((!obj.cljs$lang$protocol_mask$partition0$))?cljs.core.native_satisfies_QMARK_(cljs.core.IWithMeta,obj):false)):cljs.core.native_satisfies_QMARK_(cljs.core.IWithMeta,obj))){
return cljs.core.with_meta(obj,m);
} else {
return obj;
}
});
/**
 * Returns true if the object is marked as displaceable
 */
meta_merge.core.displace_QMARK_ = (function meta_merge$core$displace_QMARK_(obj){
return new cljs.core.Keyword(null,"displace","displace",-1153355602).cljs$core$IFn$_invoke$arity$1(meta_merge.core.meta_STAR_(obj));
});
/**
 * Returns true if the object is marked as replaceable
 */
meta_merge.core.replace_QMARK_ = (function meta_merge$core$replace_QMARK_(obj){
return new cljs.core.Keyword(null,"replace","replace",-786587770).cljs$core$IFn$_invoke$arity$1(meta_merge.core.meta_STAR_(obj));
});
/**
 * Returns true if the object is marked as top-displaceable
 */
meta_merge.core.top_displace_QMARK_ = (function meta_merge$core$top_displace_QMARK_(obj){
return new cljs.core.Keyword(null,"top-displace","top-displace",-2094589019).cljs$core$IFn$_invoke$arity$1(meta_merge.core.meta_STAR_(obj));
});
/**
 * Returns true if either left has a higher priority than right or vice versa.
 */
meta_merge.core.different_priority_QMARK_ = (function meta_merge$core$different_priority_QMARK_(left,right){
return cljs.core.boolean$((function (){var or__5002__auto__ = cljs.core.some(cljs.core.some_fn.cljs$core$IFn$_invoke$arity$3(cljs.core.nil_QMARK_,meta_merge.core.displace_QMARK_,meta_merge.core.replace_QMARK_),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [left,right], null));
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return meta_merge.core.top_displace_QMARK_(left);
}
})());
});
meta_merge.core.remove_top_displace = (function meta_merge$core$remove_top_displace(obj){
if(cljs.core.not(meta_merge.core.top_displace_QMARK_(obj))){
return obj;
} else {
return cljs.core.vary_meta.cljs$core$IFn$_invoke$arity$3(obj,cljs.core.dissoc,new cljs.core.Keyword(null,"top-displace","top-displace",-2094589019));
}
});
/**
 * Picks the highest prioritized element of left and right and merge their
 *   metadata.
 */
meta_merge.core.pick_prioritized = (function meta_merge$core$pick_prioritized(left,right){
if((left == null)){
return right;
} else {
if((right == null)){
return meta_merge.core.remove_top_displace(left);
} else {
if(cljs.core.truth_(meta_merge.core.top_displace_QMARK_(left))){
return right;
} else {
if(cljs.core.truth_((function (){var and__5000__auto__ = meta_merge.core.displace_QMARK_(left);
if(cljs.core.truth_(and__5000__auto__)){
return meta_merge.core.displace_QMARK_(right);
} else {
return and__5000__auto__;
}
})())){
return meta_merge.core.with_meta_STAR_(right,cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([meta_merge.core.meta_STAR_(left),meta_merge.core.meta_STAR_(right)], 0)));
} else {
if(cljs.core.truth_((function (){var and__5000__auto__ = meta_merge.core.replace_QMARK_(left);
if(cljs.core.truth_(and__5000__auto__)){
return meta_merge.core.replace_QMARK_(right);
} else {
return and__5000__auto__;
}
})())){
return meta_merge.core.with_meta_STAR_(right,cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([meta_merge.core.meta_STAR_(left),meta_merge.core.meta_STAR_(right)], 0)));
} else {
if(cljs.core.truth_((function (){var or__5002__auto__ = meta_merge.core.displace_QMARK_(left);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return meta_merge.core.replace_QMARK_(right);
}
})())){
return meta_merge.core.with_meta_STAR_(right,cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(meta_merge.core.meta_STAR_(left),new cljs.core.Keyword(null,"displace","displace",-1153355602)),cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(meta_merge.core.meta_STAR_(right),new cljs.core.Keyword(null,"replace","replace",-786587770))], 0)));
} else {
if(cljs.core.truth_((function (){var or__5002__auto__ = meta_merge.core.replace_QMARK_(left);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return meta_merge.core.displace_QMARK_(right);
}
})())){
return meta_merge.core.with_meta_STAR_(left,cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(meta_merge.core.meta_STAR_(right),new cljs.core.Keyword(null,"displace","displace",-1153355602)),cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(meta_merge.core.meta_STAR_(left),new cljs.core.Keyword(null,"replace","replace",-786587770))], 0)));
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
/**
 * Recursively merge values based on the information in their metadata.
 */
meta_merge.core.meta_merge = (function meta_merge$core$meta_merge(var_args){
var G__93576 = arguments.length;
switch (G__93576) {
case 0:
return meta_merge.core.meta_merge.cljs$core$IFn$_invoke$arity$0();

break;
case 1:
return meta_merge.core.meta_merge.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return meta_merge.core.meta_merge.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
var args_arr__5751__auto__ = [];
var len__5726__auto___93580 = arguments.length;
var i__5727__auto___93581 = (0);
while(true){
if((i__5727__auto___93581 < len__5726__auto___93580)){
args_arr__5751__auto__.push((arguments[i__5727__auto___93581]));

var G__93582 = (i__5727__auto___93581 + (1));
i__5727__auto___93581 = G__93582;
continue;
} else {
}
break;
}

var argseq__5752__auto__ = ((((2) < args_arr__5751__auto__.length))?(new cljs.core.IndexedSeq(args_arr__5751__auto__.slice((2)),(0),null)):null);
return meta_merge.core.meta_merge.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),(arguments[(1)]),argseq__5752__auto__);

}
});

(meta_merge.core.meta_merge.cljs$core$IFn$_invoke$arity$0 = (function (){
return cljs.core.PersistentArrayMap.EMPTY;
}));

(meta_merge.core.meta_merge.cljs$core$IFn$_invoke$arity$1 = (function (left){
return left;
}));

(meta_merge.core.meta_merge.cljs$core$IFn$_invoke$arity$2 = (function (left,right){
if(meta_merge.core.different_priority_QMARK_(left,right)){
return meta_merge.core.pick_prioritized(left,right);
} else {
if(((cljs.core.map_QMARK_(left)) && (cljs.core.map_QMARK_(right)))){
return cljs.core.merge_with.cljs$core$IFn$_invoke$arity$variadic(meta_merge.core.meta_merge,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([left,right], 0));
} else {
if(((cljs.core.set_QMARK_(left)) && (cljs.core.set_QMARK_(right)))){
return clojure.set.union.cljs$core$IFn$_invoke$arity$2(right,left);
} else {
if(((cljs.core.coll_QMARK_(left)) && (cljs.core.coll_QMARK_(right)))){
if(cljs.core.truth_((function (){var or__5002__auto__ = new cljs.core.Keyword(null,"prepend","prepend",342616040).cljs$core$IFn$_invoke$arity$1(cljs.core.meta(left));
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword(null,"prepend","prepend",342616040).cljs$core$IFn$_invoke$arity$1(cljs.core.meta(right));
}
})())){
return cljs.core.with_meta(cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.empty(left),cljs.core.concat.cljs$core$IFn$_invoke$arity$2(right,left)),cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.meta(left),cljs.core.select_keys(cljs.core.meta(right),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"displace","displace",-1153355602)], null))], 0)));
} else {
return cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.empty(left),cljs.core.concat.cljs$core$IFn$_invoke$arity$2(left,right));
}
} else {
return right;

}
}
}
}
}));

(meta_merge.core.meta_merge.cljs$core$IFn$_invoke$arity$variadic = (function (left,right,more){
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3(meta_merge.core.meta_merge,left,cljs.core.cons(right,more));
}));

/** @this {Function} */
(meta_merge.core.meta_merge.cljs$lang$applyTo = (function (seq93573){
var G__93574 = cljs.core.first(seq93573);
var seq93573__$1 = cljs.core.next(seq93573);
var G__93575 = cljs.core.first(seq93573__$1);
var seq93573__$2 = cljs.core.next(seq93573__$1);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__93574,G__93575,seq93573__$2);
}));

(meta_merge.core.meta_merge.cljs$lang$maxFixedArity = (2));


//# sourceMappingURL=meta_merge.core.js.map
