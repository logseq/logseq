goog.provide('instaparse.util');
instaparse.util.throw_runtime_exception = (function instaparse$util$throw_runtime_exception(var_args){
var args__5732__auto__ = [];
var len__5726__auto___134747 = arguments.length;
var i__5727__auto___134748 = (0);
while(true){
if((i__5727__auto___134748 < len__5726__auto___134747)){
args__5732__auto__.push((arguments[i__5727__auto___134748]));

var G__134749 = (i__5727__auto___134748 + (1));
i__5727__auto___134748 = G__134749;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((0) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((0)),(0),null)):null);
return instaparse.util.throw_runtime_exception.cljs$core$IFn$_invoke$arity$variadic(argseq__5733__auto__);
});

(instaparse.util.throw_runtime_exception.cljs$core$IFn$_invoke$arity$variadic = (function (message){
var text = cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core.str,message);
throw text;
}));

(instaparse.util.throw_runtime_exception.cljs$lang$maxFixedArity = (0));

/** @this {Function} */
(instaparse.util.throw_runtime_exception.cljs$lang$applyTo = (function (seq134743){
var self__5712__auto__ = this;
return self__5712__auto__.cljs$core$IFn$_invoke$arity$variadic(cljs.core.seq(seq134743));
}));

instaparse.util.throw_illegal_argument_exception = (function instaparse$util$throw_illegal_argument_exception(var_args){
var args__5732__auto__ = [];
var len__5726__auto___134753 = arguments.length;
var i__5727__auto___134754 = (0);
while(true){
if((i__5727__auto___134754 < len__5726__auto___134753)){
args__5732__auto__.push((arguments[i__5727__auto___134754]));

var G__134755 = (i__5727__auto___134754 + (1));
i__5727__auto___134754 = G__134755;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((0) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((0)),(0),null)):null);
return instaparse.util.throw_illegal_argument_exception.cljs$core$IFn$_invoke$arity$variadic(argseq__5733__auto__);
});

(instaparse.util.throw_illegal_argument_exception.cljs$core$IFn$_invoke$arity$variadic = (function (message){
var text = cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core.str,message);
throw text;
}));

(instaparse.util.throw_illegal_argument_exception.cljs$lang$maxFixedArity = (0));

/** @this {Function} */
(instaparse.util.throw_illegal_argument_exception.cljs$lang$applyTo = (function (seq134744){
var self__5712__auto__ = this;
return self__5712__auto__.cljs$core$IFn$_invoke$arity$variadic(cljs.core.seq(seq134744));
}));

instaparse.util.regexp_flags = (function instaparse$util$regexp_flags(re){
var G__134745 = "";
var G__134745__$1 = (cljs.core.truth_(re.ignoreCase)?[G__134745,"i"].join(''):G__134745);
var G__134745__$2 = (cljs.core.truth_(re.multiline)?[G__134745__$1,"m"].join(''):G__134745__$1);
if(cljs.core.truth_(re.unicode)){
return [G__134745__$2,"u"].join('');
} else {
return G__134745__$2;
}
});

//# sourceMappingURL=instaparse.util.js.map
