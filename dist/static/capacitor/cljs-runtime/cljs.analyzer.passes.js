goog.provide('cljs.analyzer.passes');
cljs.analyzer.passes.apply_passes = (function cljs$analyzer$passes$apply_passes(var_args){
var G__56448 = arguments.length;
switch (G__56448) {
case 2:
return cljs.analyzer.passes.apply_passes.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return cljs.analyzer.passes.apply_passes.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(cljs.analyzer.passes.apply_passes.cljs$core$IFn$_invoke$arity$2 = (function (ast,passes){
return cljs.analyzer.passes.apply_passes.cljs$core$IFn$_invoke$arity$3(ast,passes,null);
}));

(cljs.analyzer.passes.apply_passes.cljs$core$IFn$_invoke$arity$3 = (function (ast,passes,opts){
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (ast__$1,pass){
var G__56474 = new cljs.core.Keyword(null,"env","env",-1815813235).cljs$core$IFn$_invoke$arity$1(ast__$1);
var G__56475 = ast__$1;
var G__56476 = opts;
return (pass.cljs$core$IFn$_invoke$arity$3 ? pass.cljs$core$IFn$_invoke$arity$3(G__56474,G__56475,G__56476) : pass.call(null,G__56474,G__56475,G__56476));
}),ast,passes);
}));

(cljs.analyzer.passes.apply_passes.cljs$lang$maxFixedArity = 3);

cljs.analyzer.passes.walk = (function cljs$analyzer$passes$walk(var_args){
var G__56489 = arguments.length;
switch (G__56489) {
case 2:
return cljs.analyzer.passes.walk.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return cljs.analyzer.passes.walk.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(cljs.analyzer.passes.walk.cljs$core$IFn$_invoke$arity$2 = (function (ast,passes){
return cljs.analyzer.passes.walk.cljs$core$IFn$_invoke$arity$3(ast,passes,null);
}));

(cljs.analyzer.passes.walk.cljs$core$IFn$_invoke$arity$3 = (function (ast,passes,opts){
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (ast__$1,child_k){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(ast__$1,child_k,(function (){var child = cljs.core.get.cljs$core$IFn$_invoke$arity$2(ast__$1,child_k);
if(cljs.core.vector_QMARK_(child)){
return cljs.core.into.cljs$core$IFn$_invoke$arity$3(cljs.core.PersistentVector.EMPTY,cljs.core.map.cljs$core$IFn$_invoke$arity$1((function (p1__56479_SHARP_){
return cljs.analyzer.passes.walk.cljs$core$IFn$_invoke$arity$3(p1__56479_SHARP_,passes,opts);
})),child);
} else {
return cljs.analyzer.passes.walk.cljs$core$IFn$_invoke$arity$3(child,passes,opts);
}
})());
}),(function (){var G__56503 = ast;
if((G__56503 == null)){
return null;
} else {
return cljs.analyzer.passes.apply_passes.cljs$core$IFn$_invoke$arity$3(G__56503,passes,opts);
}
})(),new cljs.core.Keyword(null,"children","children",-940561982).cljs$core$IFn$_invoke$arity$1(ast));
}));

(cljs.analyzer.passes.walk.cljs$lang$maxFixedArity = 3);


//# sourceMappingURL=cljs.analyzer.passes.js.map
