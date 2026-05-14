goog.provide('frontend.extensions.sci');
goog.scope(function(){
  frontend.extensions.sci.goog$module$goog$object = goog.module.get('goog.object');
});
frontend.extensions.sci.sum = cljs.core.partial.cljs$core$IFn$_invoke$arity$2(cljs.core.apply,cljs.core._PLUS_);
frontend.extensions.sci.average = (function frontend$extensions$sci$average(coll){
return (cljs.core.reduce.cljs$core$IFn$_invoke$arity$2(cljs.core._PLUS_,coll) / cljs.core.count(coll));
});
/**
 * Given a fn name from logseq.api, invokes it with the given arguments
 */
frontend.extensions.sci.call_api = (function frontend$extensions$sci$call_api(var_args){
var args__5732__auto__ = [];
var len__5726__auto___103053 = arguments.length;
var i__5727__auto___103054 = (0);
while(true){
if((i__5727__auto___103054 < len__5726__auto___103053)){
args__5732__auto__.push((arguments[i__5727__auto___103054]));

var G__103058 = (i__5727__auto___103054 + (1));
i__5727__auto___103054 = G__103058;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return frontend.extensions.sci.call_api.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(frontend.extensions.sci.call_api.cljs$core$IFn$_invoke$arity$variadic = (function (fn_name,args){
if(cljs.core.truth_((window.logseq["api"][fn_name]))){
} else {
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2("Api function does not exist",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"fn","fn",-1175266204),fn_name], null));
}

return cljs.core.apply.cljs$core$IFn$_invoke$arity$4(cljs.core.js_invoke,(window.logseq["api"]),fn_name,args);
}));

(frontend.extensions.sci.call_api.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(frontend.extensions.sci.call_api.cljs$lang$applyTo = (function (seq103020){
var G__103021 = cljs.core.first(seq103020);
var seq103020__$1 = cljs.core.next(seq103020);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__103021,seq103020__$1);
}));

/**
 * Second arg is a map of options for sci/eval-string
 */
frontend.extensions.sci.eval_string = (function frontend$extensions$sci$eval_string(var_args){
var G__103038 = arguments.length;
switch (G__103038) {
case 1:
return frontend.extensions.sci.eval_string.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return frontend.extensions.sci.eval_string.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.extensions.sci.eval_string.cljs$core$IFn$_invoke$arity$1 = (function (s){
return frontend.extensions.sci.eval_string.cljs$core$IFn$_invoke$arity$2(s,cljs.core.PersistentArrayMap.EMPTY);
}));

(frontend.extensions.sci.eval_string.cljs$core$IFn$_invoke$arity$2 = (function (s,options){
try{return sci.core.eval_string.cljs$core$IFn$_invoke$arity$2(s,cljs.core.merge_with.cljs$core$IFn$_invoke$arity$variadic(cljs.core.merge,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"bindings","bindings",1271397192),new cljs.core.PersistentArrayMap(null, 7, [new cljs.core.Symbol(null,"sum","sum",1777518341,null),frontend.extensions.sci.sum,new cljs.core.Symbol(null,"average","average",1148175359,null),frontend.extensions.sci.average,new cljs.core.Symbol(null,"parseFloat","parseFloat",1048011182,null),parseFloat,new cljs.core.Symbol(null,"isNaN","isNaN",74904266,null),isNaN,new cljs.core.Symbol(null,"log","log",45015523,null),console.log,new cljs.core.Symbol(null,"pprint","pprint",-1434237374,null),frontend.util.pp_str,new cljs.core.Symbol(null,"call-api","call-api",1686671962,null),frontend.extensions.sci.call_api], null)], null),options], 0)));
}catch (e103039){var e = e103039;
cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["Query: sci eval failed:"], 0));

return console.error(e);
}}));

(frontend.extensions.sci.eval_string.cljs$lang$maxFixedArity = 2);

frontend.extensions.sci.call_fn = (function frontend$extensions$sci$call_fn(var_args){
var args__5732__auto__ = [];
var len__5726__auto___103062 = arguments.length;
var i__5727__auto___103063 = (0);
while(true){
if((i__5727__auto___103063 < len__5726__auto___103062)){
args__5732__auto__.push((arguments[i__5727__auto___103063]));

var G__103065 = (i__5727__auto___103063 + (1));
i__5727__auto___103063 = G__103065;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return frontend.extensions.sci.call_fn.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(frontend.extensions.sci.call_fn.cljs$core$IFn$_invoke$arity$variadic = (function (f,args){
return cljs.core.apply.cljs$core$IFn$_invoke$arity$2(f,args);
}));

(frontend.extensions.sci.call_fn.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(frontend.extensions.sci.call_fn.cljs$lang$applyTo = (function (seq103041){
var G__103042 = cljs.core.first(seq103041);
var seq103041__$1 = cljs.core.next(seq103041);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__103042,seq103041__$1);
}));

/**
 * Evaluate code with sci in a block context
 */
frontend.extensions.sci.eval_result = (function frontend$extensions$sci$eval_result(code,block){
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"code","code",1586293142),"Results:"], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.results.mt-1","div.results.mt-1",-1175435307),(function (){var result = frontend.extensions.sci.eval_string.cljs$core$IFn$_invoke$arity$2(code,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"bindings","bindings",1271397192),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Symbol(null,"block","block",-1989749559,null),block], null)], null));
if(cljs.core.truth_((function (){var and__5000__auto__ = cljs.core.vector_QMARK_(result);
if(and__5000__auto__){
return new cljs.core.Keyword(null,"hiccup","hiccup",1218876238).cljs$core$IFn$_invoke$arity$1(cljs.core.meta(result));
} else {
return and__5000__auto__;
}
})())){
return result;
} else {
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"pre.code","pre.code",2043838796),cljs.core.str.cljs$core$IFn$_invoke$arity$1(result)], null);
}
})()], null)], null);
});

//# sourceMappingURL=frontend.extensions.sci.js.map
