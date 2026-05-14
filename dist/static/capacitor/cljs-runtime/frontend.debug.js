goog.provide('frontend.debug');
frontend.debug.pprint = (function frontend$debug$pprint(var_args){
var args__5732__auto__ = [];
var len__5726__auto___68169 = arguments.length;
var i__5727__auto___68170 = (0);
while(true){
if((i__5727__auto___68170 < len__5726__auto___68169)){
args__5732__auto__.push((arguments[i__5727__auto___68170]));

var G__68171 = (i__5727__auto___68170 + (1));
i__5727__auto___68170 = G__68171;
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
var seq__68137 = cljs.core.seq(xs);
var chunk__68139 = null;
var count__68140 = (0);
var i__68141 = (0);
while(true){
if((i__68141 < count__68140)){
var x = chunk__68139.cljs$core$IIndexed$_nth$arity$2(null,i__68141);
cljs.pprint.pprint.cljs$core$IFn$_invoke$arity$1(x);


var G__68172 = seq__68137;
var G__68173 = chunk__68139;
var G__68174 = count__68140;
var G__68175 = (i__68141 + (1));
seq__68137 = G__68172;
chunk__68139 = G__68173;
count__68140 = G__68174;
i__68141 = G__68175;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__68137);
if(temp__5804__auto__){
var seq__68137__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__68137__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__68137__$1);
var G__68176 = cljs.core.chunk_rest(seq__68137__$1);
var G__68177 = c__5525__auto__;
var G__68178 = cljs.core.count(c__5525__auto__);
var G__68179 = (0);
seq__68137 = G__68176;
chunk__68139 = G__68177;
count__68140 = G__68178;
i__68141 = G__68179;
continue;
} else {
var x = cljs.core.first(seq__68137__$1);
cljs.pprint.pprint.cljs$core$IFn$_invoke$arity$1(x);


var G__68180 = cljs.core.next(seq__68137__$1);
var G__68181 = null;
var G__68182 = (0);
var G__68183 = (0);
seq__68137 = G__68180;
chunk__68139 = G__68181;
count__68140 = G__68182;
i__68141 = G__68183;
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
(frontend.debug.pprint.cljs$lang$applyTo = (function (seq68114){
var self__5712__auto__ = this;
return self__5712__auto__.cljs$core$IFn$_invoke$arity$variadic(cljs.core.seq(seq68114));
}));


//# sourceMappingURL=frontend.debug.js.map
