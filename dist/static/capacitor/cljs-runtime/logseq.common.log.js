goog.provide('logseq.common.log');
logseq.common.log.error = (function logseq$common$log$error(var_args){
var args__5732__auto__ = [];
var len__5726__auto___48348 = arguments.length;
var i__5727__auto___48349 = (0);
while(true){
if((i__5727__auto___48349 < len__5726__auto___48348)){
args__5732__auto__.push((arguments[i__5727__auto___48349]));

var G__48352 = (i__5727__auto___48349 + (1));
i__5727__auto___48349 = G__48352;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((0) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((0)),(0),null)):null);
return logseq.common.log.error.cljs$core$IFn$_invoke$arity$variadic(argseq__5733__auto__);
});

(logseq.common.log.error.cljs$core$IFn$_invoke$arity$variadic = (function (msgs){
return cljs.core.apply.cljs$core$IFn$_invoke$arity$2(console.error,cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.clj__GT_js,msgs));
}));

(logseq.common.log.error.cljs$lang$maxFixedArity = (0));

/** @this {Function} */
(logseq.common.log.error.cljs$lang$applyTo = (function (seq48343){
var self__5712__auto__ = this;
return self__5712__auto__.cljs$core$IFn$_invoke$arity$variadic(cljs.core.seq(seq48343));
}));


//# sourceMappingURL=logseq.common.log.js.map
