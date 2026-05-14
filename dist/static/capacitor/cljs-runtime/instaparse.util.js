goog.provide('instaparse.util');
instaparse.util.throw_runtime_exception = (function instaparse$util$throw_runtime_exception(var_args){
var args__5732__auto__ = [];
var len__5726__auto___128895 = arguments.length;
var i__5727__auto___128896 = (0);
while(true){
if((i__5727__auto___128896 < len__5726__auto___128895)){
args__5732__auto__.push((arguments[i__5727__auto___128896]));

var G__128897 = (i__5727__auto___128896 + (1));
i__5727__auto___128896 = G__128897;
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
(instaparse.util.throw_runtime_exception.cljs$lang$applyTo = (function (seq128892){
var self__5712__auto__ = this;
return self__5712__auto__.cljs$core$IFn$_invoke$arity$variadic(cljs.core.seq(seq128892));
}));

instaparse.util.throw_illegal_argument_exception = (function instaparse$util$throw_illegal_argument_exception(var_args){
var args__5732__auto__ = [];
var len__5726__auto___128898 = arguments.length;
var i__5727__auto___128899 = (0);
while(true){
if((i__5727__auto___128899 < len__5726__auto___128898)){
args__5732__auto__.push((arguments[i__5727__auto___128899]));

var G__128900 = (i__5727__auto___128899 + (1));
i__5727__auto___128899 = G__128900;
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
(instaparse.util.throw_illegal_argument_exception.cljs$lang$applyTo = (function (seq128893){
var self__5712__auto__ = this;
return self__5712__auto__.cljs$core$IFn$_invoke$arity$variadic(cljs.core.seq(seq128893));
}));

instaparse.util.regexp_flags = (function instaparse$util$regexp_flags(re){
var G__128894 = "";
var G__128894__$1 = (cljs.core.truth_(re.ignoreCase)?[G__128894,"i"].join(''):G__128894);
var G__128894__$2 = (cljs.core.truth_(re.multiline)?[G__128894__$1,"m"].join(''):G__128894__$1);
if(cljs.core.truth_(re.unicode)){
return [G__128894__$2,"u"].join('');
} else {
return G__128894__$2;
}
});

//# sourceMappingURL=instaparse.util.js.map
