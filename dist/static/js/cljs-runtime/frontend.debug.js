goog.provide('frontend.debug');
frontend.debug.pprint = (function frontend$debug$pprint(var_args){
var args__5732__auto__ = [];
var len__5726__auto___106337 = arguments.length;
var i__5727__auto___106338 = (0);
while(true){
if((i__5727__auto___106338 < len__5726__auto___106337)){
args__5732__auto__.push((arguments[i__5727__auto___106338]));

var G__106339 = (i__5727__auto___106338 + (1));
i__5727__auto___106338 = G__106339;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((0) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((0)),(0),null)):null);
return frontend.debug.pprint.cljs$core$IFn$_invoke$arity$variadic(argseq__5733__auto__);
});

(frontend.debug.pprint.cljs$core$IFn$_invoke$arity$variadic = (function (xs){
if(cljs.core.truth_(frontend.state.developer_mode_QMARK_())){
var seq__106327 = cljs.core.seq(xs);
var chunk__106328 = null;
var count__106329 = (0);
var i__106330 = (0);
while(true){
if((i__106330 < count__106329)){
var x = chunk__106328.cljs$core$IIndexed$_nth$arity$2(null,i__106330);
cljs.pprint.pprint.cljs$core$IFn$_invoke$arity$1(x);


var G__106340 = seq__106327;
var G__106341 = chunk__106328;
var G__106342 = count__106329;
var G__106343 = (i__106330 + (1));
seq__106327 = G__106340;
chunk__106328 = G__106341;
count__106329 = G__106342;
i__106330 = G__106343;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__106327);
if(temp__5804__auto__){
var seq__106327__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__106327__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__106327__$1);
var G__106344 = cljs.core.chunk_rest(seq__106327__$1);
var G__106345 = c__5525__auto__;
var G__106346 = cljs.core.count(c__5525__auto__);
var G__106347 = (0);
seq__106327 = G__106344;
chunk__106328 = G__106345;
count__106329 = G__106346;
i__106330 = G__106347;
continue;
} else {
var x = cljs.core.first(seq__106327__$1);
cljs.pprint.pprint.cljs$core$IFn$_invoke$arity$1(x);


var G__106348 = cljs.core.next(seq__106327__$1);
var G__106349 = null;
var G__106350 = (0);
var G__106351 = (0);
seq__106327 = G__106348;
chunk__106328 = G__106349;
count__106329 = G__106350;
i__106330 = G__106351;
continue;
}
} else {
return null;
}
}
break;
}
} else {
return null;
}
}));

(frontend.debug.pprint.cljs$lang$maxFixedArity = (0));

/** @this {Function} */
(frontend.debug.pprint.cljs$lang$applyTo = (function (seq106320){
var self__5712__auto__ = this;
return self__5712__auto__.cljs$core$IFn$_invoke$arity$variadic(cljs.core.seq(seq106320));
}));


//# sourceMappingURL=frontend.debug.js.map
