goog.provide('cljs.analyzer.passes.and_or');
cljs.analyzer.passes.and_or.simple_ops = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 9, [new cljs.core.Keyword(null,"js","js",1768080579),null,new cljs.core.Keyword(null,"host-field","host-field",-72662140),null,new cljs.core.Keyword(null,"const","const",1709929842),null,new cljs.core.Keyword(null,"var","var",-769682797),null,new cljs.core.Keyword(null,"quote","quote",-262615245),null,new cljs.core.Keyword(null,"invoke","invoke",1145927159),null,new cljs.core.Keyword(null,"js-var","js-var",-1177899142),null,new cljs.core.Keyword(null,"host-call","host-call",1059629755),null,new cljs.core.Keyword(null,"local","local",-1497766724),null], null), null);
cljs.analyzer.passes.and_or.__GT_expr_env = (function cljs$analyzer$passes$and_or$__GT_expr_env(ast){
return cljs.core.assoc_in(ast,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"env","env",-1815813235),new cljs.core.Keyword(null,"context","context",-830191113)], null),new cljs.core.Keyword(null,"expr","expr",745722291));
});
cljs.analyzer.passes.and_or.simple_op_QMARK_ = (function cljs$analyzer$passes$and_or$simple_op_QMARK_(ast){
return cljs.core.contains_QMARK_(cljs.analyzer.passes.and_or.simple_ops,new cljs.core.Keyword(null,"op","op",-1882987955).cljs$core$IFn$_invoke$arity$1(ast));
});
cljs.analyzer.passes.and_or.simple_test_expr_QMARK_ = (function cljs$analyzer$passes$and_or$simple_test_expr_QMARK_(p__56737){
var map__56738 = p__56737;
var map__56738__$1 = cljs.core.__destructure_map(map__56738);
var ast = map__56738__$1;
var op = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__56738__$1,new cljs.core.Keyword(null,"op","op",-1882987955));
return cljs.core.boolean$((function (){var and__5000__auto__ = cljs.analyzer.passes.and_or.simple_op_QMARK_(ast);
if(and__5000__auto__){
var G__56740 = (function (){var or__5002__auto__ = new cljs.core.Keyword(null,"tag","tag",-1290361223).cljs$core$IFn$_invoke$arity$1(ast);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
if(cljs.core.truth_((function (){var fexpr__56741 = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"var","var",-769682797),null,new cljs.core.Keyword(null,"local","local",-1497766724),null], null), null);
return (fexpr__56741.cljs$core$IFn$_invoke$arity$1 ? fexpr__56741.cljs$core$IFn$_invoke$arity$1(op) : fexpr__56741.call(null,op));
})())){
return new cljs.core.Keyword(null,"tag","tag",-1290361223).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"info","info",-317069002).cljs$core$IFn$_invoke$arity$1(ast));
} else {
return null;
}
}
})();
var fexpr__56739 = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Symbol(null,"seq","seq",-177272256,null),"null",new cljs.core.Symbol(null,"boolean","boolean",-278886877,null),"null"], null), null);
return (fexpr__56739.cljs$core$IFn$_invoke$arity$1 ? fexpr__56739.cljs$core$IFn$_invoke$arity$1(G__56740) : fexpr__56739.call(null,G__56740));
} else {
return and__5000__auto__;
}
})());
});
cljs.analyzer.passes.and_or.single_binding_let_QMARK_ = (function cljs$analyzer$passes$and_or$single_binding_let_QMARK_(ast){
return ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"let","let",-1282412701),new cljs.core.Keyword(null,"op","op",-1882987955).cljs$core$IFn$_invoke$arity$1(ast))) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2((1),cljs.core.count(new cljs.core.Keyword(null,"bindings","bindings",1271397192).cljs$core$IFn$_invoke$arity$1(ast)))));
});
cljs.analyzer.passes.and_or.no_statements_QMARK_ = (function cljs$analyzer$passes$and_or$no_statements_QMARK_(let_ast){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentVector.EMPTY,new cljs.core.Keyword(null,"statements","statements",600349855).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"body","body",-2049205669).cljs$core$IFn$_invoke$arity$1(let_ast)));
});
cljs.analyzer.passes.and_or.returns_if_QMARK_ = (function cljs$analyzer$passes$and_or$returns_if_QMARK_(let_ast){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"if","if",-458814265),new cljs.core.Keyword(null,"op","op",-1882987955).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"ret","ret",-468222814).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"body","body",-2049205669).cljs$core$IFn$_invoke$arity$1(let_ast))));
});
cljs.analyzer.passes.and_or.simple_test_binding_let_QMARK_ = (function cljs$analyzer$passes$and_or$simple_test_binding_let_QMARK_(ast){
return ((cljs.analyzer.passes.and_or.single_binding_let_QMARK_(ast)) && (((cljs.analyzer.passes.and_or.no_statements_QMARK_(ast)) && (((cljs.analyzer.passes.and_or.simple_test_expr_QMARK_(new cljs.core.Keyword(null,"init","init",-1875481434).cljs$core$IFn$_invoke$arity$1(cljs.core.first(new cljs.core.Keyword(null,"bindings","bindings",1271397192).cljs$core$IFn$_invoke$arity$1(ast))))) && (cljs.analyzer.passes.and_or.returns_if_QMARK_(ast)))))));
});
cljs.analyzer.passes.and_or.test_EQ_then_QMARK_ = (function cljs$analyzer$passes$and_or$test_EQ_then_QMARK_(if_ast){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"test","test",577538877).cljs$core$IFn$_invoke$arity$1(if_ast),new cljs.core.Keyword(null,"env","env",-1815813235)),cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"then","then",460598070).cljs$core$IFn$_invoke$arity$1(if_ast),new cljs.core.Keyword(null,"env","env",-1815813235)));
});
cljs.analyzer.passes.and_or.test_EQ_else_QMARK_ = (function cljs$analyzer$passes$and_or$test_EQ_else_QMARK_(if_ast){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"test","test",577538877).cljs$core$IFn$_invoke$arity$1(if_ast),new cljs.core.Keyword(null,"env","env",-1815813235)),cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"else","else",-1508377146).cljs$core$IFn$_invoke$arity$1(if_ast),new cljs.core.Keyword(null,"env","env",-1815813235)));
});
cljs.analyzer.passes.and_or.simple_and_QMARK_ = (function cljs$analyzer$passes$and_or$simple_and_QMARK_(ast){
return ((cljs.analyzer.passes.and_or.simple_test_binding_let_QMARK_(ast)) && (cljs.analyzer.passes.and_or.test_EQ_else_QMARK_(new cljs.core.Keyword(null,"ret","ret",-468222814).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"body","body",-2049205669).cljs$core$IFn$_invoke$arity$1(ast)))));
});
cljs.analyzer.passes.and_or.simple_or_QMARK_ = (function cljs$analyzer$passes$and_or$simple_or_QMARK_(ast){
return ((cljs.analyzer.passes.and_or.simple_test_binding_let_QMARK_(ast)) && (cljs.analyzer.passes.and_or.test_EQ_then_QMARK_(new cljs.core.Keyword(null,"ret","ret",-468222814).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"body","body",-2049205669).cljs$core$IFn$_invoke$arity$1(ast)))));
});
cljs.analyzer.passes.and_or.optimizable_and_QMARK_ = (function cljs$analyzer$passes$and_or$optimizable_and_QMARK_(ast){
return ((cljs.analyzer.passes.and_or.simple_and_QMARK_(ast)) && (cljs.analyzer.passes.and_or.simple_test_expr_QMARK_(new cljs.core.Keyword(null,"then","then",460598070).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"ret","ret",-468222814).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"body","body",-2049205669).cljs$core$IFn$_invoke$arity$1(ast))))));
});
cljs.analyzer.passes.and_or.optimizable_or_QMARK_ = (function cljs$analyzer$passes$and_or$optimizable_or_QMARK_(ast){
return ((cljs.analyzer.passes.and_or.simple_or_QMARK_(ast)) && (cljs.analyzer.passes.and_or.simple_test_expr_QMARK_(new cljs.core.Keyword(null,"else","else",-1508377146).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"ret","ret",-468222814).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"body","body",-2049205669).cljs$core$IFn$_invoke$arity$1(ast))))));
});
cljs.analyzer.passes.and_or.remove_loop_let = (function cljs$analyzer$passes$and_or$remove_loop_let(fn_ast,local){
return cljs.core.update.cljs$core$IFn$_invoke$arity$3(fn_ast,new cljs.core.Keyword(null,"loop-lets","loop-lets",2036794185),(function (loop_lets){
return cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (m){
return cljs.core.update.cljs$core$IFn$_invoke$arity$3(m,new cljs.core.Keyword(null,"params","params",710516235),(function (xs){
return cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (p1__56772_SHARP_){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(local,new cljs.core.Keyword(null,"name","name",1843675177).cljs$core$IFn$_invoke$arity$1(p1__56772_SHARP_));
}),xs);
}));
}),loop_lets);
}));
});
cljs.analyzer.passes.and_or.remove_local_pass = (function cljs$analyzer$passes$and_or$remove_local_pass(local){
return (function (env,ast,opts){
var G__56780 = cljs.core.update_in.cljs$core$IFn$_invoke$arity$4(ast,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"env","env",-1815813235),new cljs.core.Keyword(null,"locals","locals",535295783)], null),cljs.core.dissoc,local);
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"fn","fn",-1175266204),new cljs.core.Keyword(null,"op","op",-1882987955).cljs$core$IFn$_invoke$arity$1(ast))){
return cljs.analyzer.passes.and_or.remove_loop_let(G__56780,local);
} else {
return G__56780;
}
});
});
cljs.analyzer.passes.and_or.optimize_and = (function cljs$analyzer$passes$and_or$optimize_and(ast){
var map__56782 = cljs.core.first(new cljs.core.Keyword(null,"bindings","bindings",1271397192).cljs$core$IFn$_invoke$arity$1(ast));
var map__56782__$1 = cljs.core.__destructure_map(map__56782);
var init = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__56782__$1,new cljs.core.Keyword(null,"init","init",-1875481434));
var name = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__56782__$1,new cljs.core.Keyword(null,"name","name",1843675177));
return new cljs.core.PersistentArrayMap(null, 7, [new cljs.core.Keyword(null,"op","op",-1882987955),new cljs.core.Keyword(null,"js","js",1768080579),new cljs.core.Keyword(null,"env","env",-1815813235),new cljs.core.Keyword(null,"env","env",-1815813235).cljs$core$IFn$_invoke$arity$1(ast),new cljs.core.Keyword(null,"segs","segs",-1940299576),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["((",") && (","))"], null),new cljs.core.Keyword(null,"args","args",1315556576),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [init,cljs.analyzer.passes.walk.cljs$core$IFn$_invoke$arity$2(cljs.analyzer.passes.and_or.__GT_expr_env(new cljs.core.Keyword(null,"then","then",460598070).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"ret","ret",-468222814).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"body","body",-2049205669).cljs$core$IFn$_invoke$arity$1(ast)))),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.analyzer.passes.and_or.remove_local_pass(name)], null))], null),new cljs.core.Keyword(null,"form","form",-1624062471),new cljs.core.Keyword(null,"form","form",-1624062471).cljs$core$IFn$_invoke$arity$1(ast),new cljs.core.Keyword(null,"children","children",-940561982),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"args","args",1315556576)], null),new cljs.core.Keyword(null,"tag","tag",-1290361223),new cljs.core.Symbol(null,"boolean","boolean",-278886877,null)], null);
});
cljs.analyzer.passes.and_or.optimize_or = (function cljs$analyzer$passes$and_or$optimize_or(ast){
var map__56788 = cljs.core.first(new cljs.core.Keyword(null,"bindings","bindings",1271397192).cljs$core$IFn$_invoke$arity$1(ast));
var map__56788__$1 = cljs.core.__destructure_map(map__56788);
var init = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__56788__$1,new cljs.core.Keyword(null,"init","init",-1875481434));
var name = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__56788__$1,new cljs.core.Keyword(null,"name","name",1843675177));
return new cljs.core.PersistentArrayMap(null, 7, [new cljs.core.Keyword(null,"op","op",-1882987955),new cljs.core.Keyword(null,"js","js",1768080579),new cljs.core.Keyword(null,"env","env",-1815813235),new cljs.core.Keyword(null,"env","env",-1815813235).cljs$core$IFn$_invoke$arity$1(ast),new cljs.core.Keyword(null,"segs","segs",-1940299576),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["((",") || (","))"], null),new cljs.core.Keyword(null,"args","args",1315556576),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [init,cljs.analyzer.passes.walk.cljs$core$IFn$_invoke$arity$2(cljs.analyzer.passes.and_or.__GT_expr_env(new cljs.core.Keyword(null,"else","else",-1508377146).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"ret","ret",-468222814).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"body","body",-2049205669).cljs$core$IFn$_invoke$arity$1(ast)))),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.analyzer.passes.and_or.remove_local_pass(name)], null))], null),new cljs.core.Keyword(null,"form","form",-1624062471),new cljs.core.Keyword(null,"form","form",-1624062471).cljs$core$IFn$_invoke$arity$1(ast),new cljs.core.Keyword(null,"children","children",-940561982),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"args","args",1315556576)], null),new cljs.core.Keyword(null,"tag","tag",-1290361223),new cljs.core.Symbol(null,"boolean","boolean",-278886877,null)], null);
});
cljs.analyzer.passes.and_or.optimize = (function cljs$analyzer$passes$and_or$optimize(env,ast,_){
if(cljs.analyzer.passes.and_or.optimizable_and_QMARK_(ast)){
return cljs.analyzer.passes.and_or.optimize_and(ast);
} else {
if(cljs.analyzer.passes.and_or.optimizable_or_QMARK_(ast)){
return cljs.analyzer.passes.and_or.optimize_or(ast);
} else {
return ast;

}
}
});

//# sourceMappingURL=cljs.analyzer.passes.and_or.js.map
