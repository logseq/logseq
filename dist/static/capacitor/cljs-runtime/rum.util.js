goog.provide('rum.util');
rum.util.collect = (function rum$util$collect(key,mixins){
return cljs.core.into.cljs$core$IFn$_invoke$arity$3(cljs.core.PersistentVector.EMPTY,cljs.core.keep.cljs$core$IFn$_invoke$arity$1((function (m){
return cljs.core.get.cljs$core$IFn$_invoke$arity$2(m,key);
})),mixins);
});
rum.util.collect_STAR_ = (function rum$util$collect_STAR_(keys,mixins){
return cljs.core.into.cljs$core$IFn$_invoke$arity$3(cljs.core.PersistentVector.EMPTY,cljs.core.mapcat.cljs$core$IFn$_invoke$arity$1((function (m){
return cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (k){
return cljs.core.get.cljs$core$IFn$_invoke$arity$2(m,k);
}),keys);
})),mixins);
});
rum.util.call_all = (function rum$util$call_all(var_args){
var args__5732__auto__ = [];
var len__5726__auto___69488 = arguments.length;
var i__5727__auto___69489 = (0);
while(true){
if((i__5727__auto___69489 < len__5726__auto___69488)){
args__5732__auto__.push((arguments[i__5727__auto___69489]));

var G__69490 = (i__5727__auto___69489 + (1));
i__5727__auto___69489 = G__69490;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((2) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((2)),(0),null)):null);
return rum.util.call_all.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),(arguments[(1)]),argseq__5733__auto__);
});

(rum.util.call_all.cljs$core$IFn$_invoke$arity$variadic = (function (state,fns,args){
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (state__$1,fn){
return cljs.core.apply.cljs$core$IFn$_invoke$arity$3(fn,state__$1,args);
}),state,fns);
}));

(rum.util.call_all.cljs$lang$maxFixedArity = (2));

/** @this {Function} */
(rum.util.call_all.cljs$lang$applyTo = (function (seq69459){
var G__69460 = cljs.core.first(seq69459);
var seq69459__$1 = cljs.core.next(seq69459);
var G__69461 = cljs.core.first(seq69459__$1);
var seq69459__$2 = cljs.core.next(seq69459__$1);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__69460,G__69461,seq69459__$2);
}));


//# sourceMappingURL=rum.util.js.map
