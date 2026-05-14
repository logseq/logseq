goog.provide('rewrite_clj.interop');
/**
 * Interop version of string format
 *   Note that there a big differences between Java's format and Google Closure's format - we don't address them.
 *   %d and %s are known to work in both.
 */
rewrite_clj.interop.simple_format = (function rewrite_clj$interop$simple_format(var_args){
var args__5732__auto__ = [];
var len__5726__auto___63943 = arguments.length;
var i__5727__auto___63944 = (0);
while(true){
if((i__5727__auto___63944 < len__5726__auto___63943)){
args__5732__auto__.push((arguments[i__5727__auto___63944]));

var G__63945 = (i__5727__auto___63944 + (1));
i__5727__auto___63944 = G__63945;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return rewrite_clj.interop.simple_format.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(rewrite_clj.interop.simple_format.cljs$core$IFn$_invoke$arity$variadic = (function (template,args){
return cljs.core.apply.cljs$core$IFn$_invoke$arity$3(goog.string.format,template,args);
}));

(rewrite_clj.interop.simple_format.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(rewrite_clj.interop.simple_format.cljs$lang$applyTo = (function (seq63928){
var G__63929 = cljs.core.first(seq63928);
var seq63928__$1 = cljs.core.next(seq63928);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__63929,seq63928__$1);
}));

rewrite_clj.interop.str__GT_int = (function rewrite_clj$interop$str__GT_int(s){
return parseInt(s);
});
rewrite_clj.interop.int__GT_str = (function rewrite_clj$interop$int__GT_str(n,base){
return n.toString(base);
});
rewrite_clj.interop.min_int = (function rewrite_clj$interop$min_int(){
return Number.MIN_SAFE_INTEGER;
});
rewrite_clj.interop.max_int = (function rewrite_clj$interop$max_int(){
return Number.MAX_SAFE_INTEGER;
});
rewrite_clj.interop.clojure_whitespace_QMARK_ = (function rewrite_clj$interop$clojure_whitespace_QMARK_(c){
var and__5000__auto__ = c;
if(cljs.core.truth_(and__5000__auto__)){
return ((-1) < ["\r","\n","\t"," ",","].indexOf(c));
} else {
return and__5000__auto__;
}
});
rewrite_clj.interop.meta_available_QMARK_ = (function rewrite_clj$interop$meta_available_QMARK_(data){
if((!((data == null)))){
if((((data.cljs$lang$protocol_mask$partition0$ & (262144))) || ((cljs.core.PROTOCOL_SENTINEL === data.cljs$core$IWithMeta$)))){
return true;
} else {
return false;
}
} else {
return false;
}
});
/**
 * Checks whether a given character is numeric
 * 
 *   Cribbed from clojure/cljs.tools.reader.impl.util.
 */
rewrite_clj.interop.numeric_QMARK_ = (function rewrite_clj$interop$numeric_QMARK_(ch){
if(cljs.core.truth_(ch)){
return goog.string.isNumeric(ch);
} else {
return null;
}
});

//# sourceMappingURL=rewrite_clj.interop.js.map
