goog.provide('sci.impl.analyzer');
goog.scope(function(){
  sci.impl.analyzer.goog$module$goog$object = goog.module.get('goog.object');
});
sci.impl.analyzer.recur_target = (function sci$impl$analyzer$recur_target(ctx){
return new cljs.core.Keyword(null,"recur-target","recur-target",-1909494536).cljs$core$IFn$_invoke$arity$1(ctx);
});
sci.impl.analyzer.with_recur_target = (function sci$impl$analyzer$with_recur_target(ctx,v){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(ctx,new cljs.core.Keyword(null,"recur-target","recur-target",-1909494536),v);
});
sci.impl.analyzer.without_recur_target = (function sci$impl$analyzer$without_recur_target(ctx){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(ctx,new cljs.core.Keyword(null,"recur-target","recur-target",-1909494536),false);
});
sci.impl.analyzer.recur_target_QMARK_ = (function sci$impl$analyzer$recur_target_QMARK_(ctx){
return new cljs.core.Keyword(null,"recur-target","recur-target",-1909494536).cljs$core$IFn$_invoke$arity$1(ctx);
});
sci.impl.analyzer.special_syms = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 13, [new cljs.core.Symbol(null,"try","try",-1273693247,null),"null",new cljs.core.Symbol(null,"finally","finally",-1065347064,null),"null",new cljs.core.Symbol(null,"do","do",1686842252,null),"null",new cljs.core.Symbol(null,"if","if",1181717262,null),"null",new cljs.core.Symbol(null,"new","new",-444906321,null),"null",new cljs.core.Symbol(null,"recur","recur",1202958259,null),"null",new cljs.core.Symbol(null,"set!","set!",250714521,null),"null",new cljs.core.Symbol(null,".",".",1975675962,null),"null",new cljs.core.Symbol(null,"var","var",870848730,null),"null",new cljs.core.Symbol(null,"quote","quote",1377916282,null),"null",new cljs.core.Symbol(null,"catch","catch",-1616370245,null),"null",new cljs.core.Symbol(null,"throw","throw",595905694,null),"null",new cljs.core.Symbol(null,"def","def",597100991,null),"null"], null), null);
sci.impl.analyzer.throw_error_with_location = (function sci$impl$analyzer$throw_error_with_location(msg,node){
return sci.impl.utils.throw_error_with_location.cljs$core$IFn$_invoke$arity$3(msg,node,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"phase","phase",575722892),"analysis"], null));
});




sci.impl.analyzer.macroexpand_1 = (function sci$impl$analyzer$macroexpand_1(ctx,expr){
var ctx__$1 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(ctx,new cljs.core.Keyword("sci.impl","macroexpanding","sci.impl/macroexpanding",2113471825),true);
var original_expr = expr;
if(cljs.core.seq_QMARK_(expr)){
var op = cljs.core.first(expr);
if((op instanceof cljs.core.Symbol)){
if(cljs.core.truth_(cljs.core.get.cljs$core$IFn$_invoke$arity$2(sci.impl.analyzer.special_syms,op))){
return expr;
} else {
if(cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Symbol(null,"for","for",316745208,null),null], null), null),op)){
return (sci.impl.analyzer.analyze.cljs$core$IFn$_invoke$arity$2 ? sci.impl.analyzer.analyze.cljs$core$IFn$_invoke$arity$2(ctx__$1,expr) : sci.impl.analyzer.analyze.call(null,ctx__$1,expr));
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Symbol("clojure.core","defrecord","clojure.core/defrecord",581689476,null),op)){
return expr;
} else {
var f = (function (){try{return sci.impl.resolve.resolve_symbol.cljs$core$IFn$_invoke$arity$3(ctx__$1,op,true);
}catch (e90824){var _ = e90824;
return new cljs.core.Keyword("sci.impl.analyzer","unresolved","sci.impl.analyzer/unresolved",308754858);
}})();
if(cljs.core.keyword_identical_QMARK_(new cljs.core.Keyword("sci.impl.analyzer","unresolved","sci.impl.analyzer/unresolved",308754858),f)){
return expr;
} else {
var macro_var_QMARK_ = (function (){var and__5000__auto__ = sci.impl.vars.var_QMARK_(f);
if(and__5000__auto__){
return sci.impl.vars.isMacro(f);
} else {
return and__5000__auto__;
}
})();
var needs_ctx_QMARK_ = cljs.core.keyword_identical_QMARK_(sci.impl.utils.needs_ctx,(function (){var G__90825 = f;
var G__90825__$1 = (((G__90825 == null))?null:cljs.core.meta(G__90825));
if((G__90825__$1 == null)){
return null;
} else {
return new cljs.core.Keyword("sci.impl","op","sci.impl/op",950953978).cljs$core$IFn$_invoke$arity$1(G__90825__$1);
}
})());
var f__$1 = (cljs.core.truth_(macro_var_QMARK_)?cljs.core.deref(f):f);
if(cljs.core.truth_((function (){var or__5002__auto__ = macro_var_QMARK_;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return sci.impl.utils.macro_QMARK_(f__$1);
}
})())){
if(needs_ctx_QMARK_){
return cljs.core.apply.cljs$core$IFn$_invoke$arity$5(f__$1,original_expr,new cljs.core.Keyword(null,"bindings","bindings",1271397192).cljs$core$IFn$_invoke$arity$1(ctx__$1),ctx__$1,cljs.core.rest(expr));
} else {
return cljs.core.apply.cljs$core$IFn$_invoke$arity$4(f__$1,original_expr,new cljs.core.Keyword(null,"bindings","bindings",1271397192).cljs$core$IFn$_invoke$arity$1(ctx__$1),cljs.core.rest(expr));
}
} else {
return expr;
}
}

}
}
}
} else {
return expr;
}
} else {
return expr;
}
});
sci.impl.analyzer.macroexpand = (function sci$impl$analyzer$macroexpand(ctx,form){
var ex = sci.impl.analyzer.macroexpand_1(ctx,form);
if((ex === form)){
return form;
} else {
return (sci.impl.analyzer.macroexpand.cljs$core$IFn$_invoke$arity$2 ? sci.impl.analyzer.macroexpand.cljs$core$IFn$_invoke$arity$2(ctx,ex) : sci.impl.analyzer.macroexpand.call(null,ctx,ex));
}
});
cljs.core.vreset_BANG_(sci.impl.utils.macroexpand_STAR_,sci.impl.analyzer.macroexpand);
cljs.core.vreset_BANG_(sci.impl.utils.macroexpand_1_STAR_,sci.impl.analyzer.macroexpand_1);
sci.impl.analyzer.analyze_children_tail = (function sci$impl$analyzer$analyze_children_tail(ctx,children){
var rt = sci.impl.analyzer.recur_target(ctx);
var non_tail_ctx = sci.impl.analyzer.without_recur_target(ctx);
var analyzed_children_non_tail = cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (p1__90833_SHARP_){
return (sci.impl.analyzer.analyze.cljs$core$IFn$_invoke$arity$2 ? sci.impl.analyzer.analyze.cljs$core$IFn$_invoke$arity$2(non_tail_ctx,p1__90833_SHARP_) : sci.impl.analyzer.analyze.call(null,non_tail_ctx,p1__90833_SHARP_));
}),cljs.core.butlast(children));
var ret_child = (function (){var G__90834 = sci.impl.analyzer.with_recur_target(ctx,rt);
var G__90835 = cljs.core.last(children);
return (sci.impl.analyzer.analyze.cljs$core$IFn$_invoke$arity$2 ? sci.impl.analyzer.analyze.cljs$core$IFn$_invoke$arity$2(G__90834,G__90835) : sci.impl.analyzer.analyze.call(null,G__90834,G__90835));
})();
return cljs.core.conj.cljs$core$IFn$_invoke$arity$2(analyzed_children_non_tail,ret_child);
});
sci.impl.analyzer.return_do = (function sci$impl$analyzer$return_do(ctx,expr,children){
var analyzed_children = (new cljs.core.Delay((function (){
return sci.impl.analyzer.analyze_children_tail(ctx,children);
}),null));
var G__90843 = cljs.core.count(children);
switch (G__90843) {
case (0):
return null;

break;
case (1):
return cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(0));

break;
case (2):
var arg0 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(0));
var arg1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(1));
return sci.impl.types.__GT_NodeR((function (this$,ctx__$1,bindings){
sci.impl.types.eval(arg0,ctx__$1,bindings);

return sci.impl.types.eval(arg1,ctx__$1,bindings);
}),null);

break;
case (3):
var arg0 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(0));
var arg1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(1));
var arg2 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(2));
return sci.impl.types.__GT_NodeR((function (this$,ctx__$1,bindings){
sci.impl.types.eval(arg0,ctx__$1,bindings);

sci.impl.types.eval(arg1,ctx__$1,bindings);

return sci.impl.types.eval(arg2,ctx__$1,bindings);
}),null);

break;
default:
var analyzed_children__$1 = cljs.core.deref(analyzed_children);
return sci.impl.types.__GT_NodeR((function (this$,ctx__$1,bindings){
return sci.impl.evaluator.eval_do(ctx__$1,bindings,analyzed_children__$1);
}),null);

}
});
sci.impl.analyzer.return_or = (function sci$impl$analyzer$return_or(ctx,expr,children){
var analyzed_children = (new cljs.core.Delay((function (){
return sci.impl.analyzer.analyze_children_tail(ctx,children);
}),null));
var G__90854 = cljs.core.count(children);
switch (G__90854) {
case (0):
return null;

break;
case (1):
var G__90855 = ctx;
var G__90856 = cljs.core.first(children);
return (sci.impl.analyzer.analyze.cljs$core$IFn$_invoke$arity$2 ? sci.impl.analyzer.analyze.cljs$core$IFn$_invoke$arity$2(G__90855,G__90856) : sci.impl.analyzer.analyze.call(null,G__90855,G__90856));

break;
case (2):
var arg0 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(0));
var arg1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(1));
return sci.impl.types.__GT_NodeR((function (this$,ctx__$1,bindings){
var or__5002__auto__ = sci.impl.types.eval(arg0,ctx__$1,bindings);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return sci.impl.types.eval(arg1,ctx__$1,bindings);
}
}),null);

break;
case (3):
var arg0 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(0));
var arg1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(1));
var arg2 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(2));
return sci.impl.types.__GT_NodeR((function (this$,ctx__$1,bindings){
var or__5002__auto__ = sci.impl.types.eval(arg0,ctx__$1,bindings);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = sci.impl.types.eval(arg1,ctx__$1,bindings);
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
return sci.impl.types.eval(arg2,ctx__$1,bindings);
}
}
}),null);

break;
case (4):
var arg0 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(0));
var arg1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(1));
var arg2 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(2));
var arg3 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(3));
return sci.impl.types.__GT_NodeR((function (this$,ctx__$1,bindings){
var or__5002__auto__ = sci.impl.types.eval(arg0,ctx__$1,bindings);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = sci.impl.types.eval(arg1,ctx__$1,bindings);
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
var or__5002__auto____$2 = sci.impl.types.eval(arg2,ctx__$1,bindings);
if(cljs.core.truth_(or__5002__auto____$2)){
return or__5002__auto____$2;
} else {
return sci.impl.types.eval(arg3,ctx__$1,bindings);
}
}
}
}),null);

break;
case (5):
var arg0 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(0));
var arg1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(1));
var arg2 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(2));
var arg3 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(3));
var arg4 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(4));
return sci.impl.types.__GT_NodeR((function (this$,ctx__$1,bindings){
var or__5002__auto__ = sci.impl.types.eval(arg0,ctx__$1,bindings);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = sci.impl.types.eval(arg1,ctx__$1,bindings);
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
var or__5002__auto____$2 = sci.impl.types.eval(arg2,ctx__$1,bindings);
if(cljs.core.truth_(or__5002__auto____$2)){
return or__5002__auto____$2;
} else {
var or__5002__auto____$3 = sci.impl.types.eval(arg3,ctx__$1,bindings);
if(cljs.core.truth_(or__5002__auto____$3)){
return or__5002__auto____$3;
} else {
return sci.impl.types.eval(arg4,ctx__$1,bindings);
}
}
}
}
}),null);

break;
case (6):
var arg0 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(0));
var arg1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(1));
var arg2 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(2));
var arg3 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(3));
var arg4 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(4));
var arg5 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(5));
return sci.impl.types.__GT_NodeR((function (this$,ctx__$1,bindings){
var or__5002__auto__ = sci.impl.types.eval(arg0,ctx__$1,bindings);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = sci.impl.types.eval(arg1,ctx__$1,bindings);
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
var or__5002__auto____$2 = sci.impl.types.eval(arg2,ctx__$1,bindings);
if(cljs.core.truth_(or__5002__auto____$2)){
return or__5002__auto____$2;
} else {
var or__5002__auto____$3 = sci.impl.types.eval(arg3,ctx__$1,bindings);
if(cljs.core.truth_(or__5002__auto____$3)){
return or__5002__auto____$3;
} else {
var or__5002__auto____$4 = sci.impl.types.eval(arg4,ctx__$1,bindings);
if(cljs.core.truth_(or__5002__auto____$4)){
return or__5002__auto____$4;
} else {
return sci.impl.types.eval(arg5,ctx__$1,bindings);
}
}
}
}
}
}),null);

break;
case (7):
var arg0 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(0));
var arg1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(1));
var arg2 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(2));
var arg3 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(3));
var arg4 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(4));
var arg5 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(5));
var arg6 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(6));
return sci.impl.types.__GT_NodeR((function (this$,ctx__$1,bindings){
var or__5002__auto__ = sci.impl.types.eval(arg0,ctx__$1,bindings);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = sci.impl.types.eval(arg1,ctx__$1,bindings);
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
var or__5002__auto____$2 = sci.impl.types.eval(arg2,ctx__$1,bindings);
if(cljs.core.truth_(or__5002__auto____$2)){
return or__5002__auto____$2;
} else {
var or__5002__auto____$3 = sci.impl.types.eval(arg3,ctx__$1,bindings);
if(cljs.core.truth_(or__5002__auto____$3)){
return or__5002__auto____$3;
} else {
var or__5002__auto____$4 = sci.impl.types.eval(arg4,ctx__$1,bindings);
if(cljs.core.truth_(or__5002__auto____$4)){
return or__5002__auto____$4;
} else {
var or__5002__auto____$5 = sci.impl.types.eval(arg5,ctx__$1,bindings);
if(cljs.core.truth_(or__5002__auto____$5)){
return or__5002__auto____$5;
} else {
return sci.impl.types.eval(arg6,ctx__$1,bindings);
}
}
}
}
}
}
}),null);

break;
case (8):
var arg0 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(0));
var arg1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(1));
var arg2 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(2));
var arg3 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(3));
var arg4 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(4));
var arg5 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(5));
var arg6 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(6));
var arg7 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(7));
return sci.impl.types.__GT_NodeR((function (this$,ctx__$1,bindings){
var or__5002__auto__ = sci.impl.types.eval(arg0,ctx__$1,bindings);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = sci.impl.types.eval(arg1,ctx__$1,bindings);
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
var or__5002__auto____$2 = sci.impl.types.eval(arg2,ctx__$1,bindings);
if(cljs.core.truth_(or__5002__auto____$2)){
return or__5002__auto____$2;
} else {
var or__5002__auto____$3 = sci.impl.types.eval(arg3,ctx__$1,bindings);
if(cljs.core.truth_(or__5002__auto____$3)){
return or__5002__auto____$3;
} else {
var or__5002__auto____$4 = sci.impl.types.eval(arg4,ctx__$1,bindings);
if(cljs.core.truth_(or__5002__auto____$4)){
return or__5002__auto____$4;
} else {
var or__5002__auto____$5 = sci.impl.types.eval(arg5,ctx__$1,bindings);
if(cljs.core.truth_(or__5002__auto____$5)){
return or__5002__auto____$5;
} else {
var or__5002__auto____$6 = sci.impl.types.eval(arg6,ctx__$1,bindings);
if(cljs.core.truth_(or__5002__auto____$6)){
return or__5002__auto____$6;
} else {
return sci.impl.types.eval(arg7,ctx__$1,bindings);
}
}
}
}
}
}
}
}),null);

break;
case (9):
var arg0 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(0));
var arg1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(1));
var arg2 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(2));
var arg3 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(3));
var arg4 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(4));
var arg5 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(5));
var arg6 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(6));
var arg7 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(7));
var arg8 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(8));
return sci.impl.types.__GT_NodeR((function (this$,ctx__$1,bindings){
var or__5002__auto__ = sci.impl.types.eval(arg0,ctx__$1,bindings);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = sci.impl.types.eval(arg1,ctx__$1,bindings);
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
var or__5002__auto____$2 = sci.impl.types.eval(arg2,ctx__$1,bindings);
if(cljs.core.truth_(or__5002__auto____$2)){
return or__5002__auto____$2;
} else {
var or__5002__auto____$3 = sci.impl.types.eval(arg3,ctx__$1,bindings);
if(cljs.core.truth_(or__5002__auto____$3)){
return or__5002__auto____$3;
} else {
var or__5002__auto____$4 = sci.impl.types.eval(arg4,ctx__$1,bindings);
if(cljs.core.truth_(or__5002__auto____$4)){
return or__5002__auto____$4;
} else {
var or__5002__auto____$5 = sci.impl.types.eval(arg5,ctx__$1,bindings);
if(cljs.core.truth_(or__5002__auto____$5)){
return or__5002__auto____$5;
} else {
var or__5002__auto____$6 = sci.impl.types.eval(arg6,ctx__$1,bindings);
if(cljs.core.truth_(or__5002__auto____$6)){
return or__5002__auto____$6;
} else {
var or__5002__auto____$7 = sci.impl.types.eval(arg7,ctx__$1,bindings);
if(cljs.core.truth_(or__5002__auto____$7)){
return or__5002__auto____$7;
} else {
return sci.impl.types.eval(arg8,ctx__$1,bindings);
}
}
}
}
}
}
}
}
}),null);

break;
case (10):
var arg0 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(0));
var arg1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(1));
var arg2 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(2));
var arg3 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(3));
var arg4 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(4));
var arg5 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(5));
var arg6 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(6));
var arg7 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(7));
var arg8 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(8));
var arg9 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(9));
return sci.impl.types.__GT_NodeR((function (this$,ctx__$1,bindings){
var or__5002__auto__ = sci.impl.types.eval(arg0,ctx__$1,bindings);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = sci.impl.types.eval(arg1,ctx__$1,bindings);
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
var or__5002__auto____$2 = sci.impl.types.eval(arg2,ctx__$1,bindings);
if(cljs.core.truth_(or__5002__auto____$2)){
return or__5002__auto____$2;
} else {
var or__5002__auto____$3 = sci.impl.types.eval(arg3,ctx__$1,bindings);
if(cljs.core.truth_(or__5002__auto____$3)){
return or__5002__auto____$3;
} else {
var or__5002__auto____$4 = sci.impl.types.eval(arg4,ctx__$1,bindings);
if(cljs.core.truth_(or__5002__auto____$4)){
return or__5002__auto____$4;
} else {
var or__5002__auto____$5 = sci.impl.types.eval(arg5,ctx__$1,bindings);
if(cljs.core.truth_(or__5002__auto____$5)){
return or__5002__auto____$5;
} else {
var or__5002__auto____$6 = sci.impl.types.eval(arg6,ctx__$1,bindings);
if(cljs.core.truth_(or__5002__auto____$6)){
return or__5002__auto____$6;
} else {
var or__5002__auto____$7 = sci.impl.types.eval(arg7,ctx__$1,bindings);
if(cljs.core.truth_(or__5002__auto____$7)){
return or__5002__auto____$7;
} else {
var or__5002__auto____$8 = sci.impl.types.eval(arg8,ctx__$1,bindings);
if(cljs.core.truth_(or__5002__auto____$8)){
return or__5002__auto____$8;
} else {
return sci.impl.types.eval(arg9,ctx__$1,bindings);
}
}
}
}
}
}
}
}
}
}),null);

break;
case (11):
var arg0 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(0));
var arg1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(1));
var arg2 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(2));
var arg3 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(3));
var arg4 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(4));
var arg5 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(5));
var arg6 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(6));
var arg7 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(7));
var arg8 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(8));
var arg9 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(9));
var arg10 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(10));
return sci.impl.types.__GT_NodeR((function (this$,ctx__$1,bindings){
var or__5002__auto__ = sci.impl.types.eval(arg0,ctx__$1,bindings);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = sci.impl.types.eval(arg1,ctx__$1,bindings);
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
var or__5002__auto____$2 = sci.impl.types.eval(arg2,ctx__$1,bindings);
if(cljs.core.truth_(or__5002__auto____$2)){
return or__5002__auto____$2;
} else {
var or__5002__auto____$3 = sci.impl.types.eval(arg3,ctx__$1,bindings);
if(cljs.core.truth_(or__5002__auto____$3)){
return or__5002__auto____$3;
} else {
var or__5002__auto____$4 = sci.impl.types.eval(arg4,ctx__$1,bindings);
if(cljs.core.truth_(or__5002__auto____$4)){
return or__5002__auto____$4;
} else {
var or__5002__auto____$5 = sci.impl.types.eval(arg5,ctx__$1,bindings);
if(cljs.core.truth_(or__5002__auto____$5)){
return or__5002__auto____$5;
} else {
var or__5002__auto____$6 = sci.impl.types.eval(arg6,ctx__$1,bindings);
if(cljs.core.truth_(or__5002__auto____$6)){
return or__5002__auto____$6;
} else {
var or__5002__auto____$7 = sci.impl.types.eval(arg7,ctx__$1,bindings);
if(cljs.core.truth_(or__5002__auto____$7)){
return or__5002__auto____$7;
} else {
var or__5002__auto____$8 = sci.impl.types.eval(arg8,ctx__$1,bindings);
if(cljs.core.truth_(or__5002__auto____$8)){
return or__5002__auto____$8;
} else {
var or__5002__auto____$9 = sci.impl.types.eval(arg9,ctx__$1,bindings);
if(cljs.core.truth_(or__5002__auto____$9)){
return or__5002__auto____$9;
} else {
return sci.impl.types.eval(arg10,ctx__$1,bindings);
}
}
}
}
}
}
}
}
}
}
}),null);

break;
case (12):
var arg0 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(0));
var arg1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(1));
var arg2 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(2));
var arg3 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(3));
var arg4 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(4));
var arg5 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(5));
var arg6 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(6));
var arg7 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(7));
var arg8 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(8));
var arg9 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(9));
var arg10 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(10));
var arg11 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(11));
return sci.impl.types.__GT_NodeR((function (this$,ctx__$1,bindings){
var or__5002__auto__ = sci.impl.types.eval(arg0,ctx__$1,bindings);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = sci.impl.types.eval(arg1,ctx__$1,bindings);
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
var or__5002__auto____$2 = sci.impl.types.eval(arg2,ctx__$1,bindings);
if(cljs.core.truth_(or__5002__auto____$2)){
return or__5002__auto____$2;
} else {
var or__5002__auto____$3 = sci.impl.types.eval(arg3,ctx__$1,bindings);
if(cljs.core.truth_(or__5002__auto____$3)){
return or__5002__auto____$3;
} else {
var or__5002__auto____$4 = sci.impl.types.eval(arg4,ctx__$1,bindings);
if(cljs.core.truth_(or__5002__auto____$4)){
return or__5002__auto____$4;
} else {
var or__5002__auto____$5 = sci.impl.types.eval(arg5,ctx__$1,bindings);
if(cljs.core.truth_(or__5002__auto____$5)){
return or__5002__auto____$5;
} else {
var or__5002__auto____$6 = sci.impl.types.eval(arg6,ctx__$1,bindings);
if(cljs.core.truth_(or__5002__auto____$6)){
return or__5002__auto____$6;
} else {
var or__5002__auto____$7 = sci.impl.types.eval(arg7,ctx__$1,bindings);
if(cljs.core.truth_(or__5002__auto____$7)){
return or__5002__auto____$7;
} else {
var or__5002__auto____$8 = sci.impl.types.eval(arg8,ctx__$1,bindings);
if(cljs.core.truth_(or__5002__auto____$8)){
return or__5002__auto____$8;
} else {
var or__5002__auto____$9 = sci.impl.types.eval(arg9,ctx__$1,bindings);
if(cljs.core.truth_(or__5002__auto____$9)){
return or__5002__auto____$9;
} else {
var or__5002__auto____$10 = sci.impl.types.eval(arg10,ctx__$1,bindings);
if(cljs.core.truth_(or__5002__auto____$10)){
return or__5002__auto____$10;
} else {
return sci.impl.types.eval(arg11,ctx__$1,bindings);
}
}
}
}
}
}
}
}
}
}
}
}),null);

break;
case (13):
var arg0 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(0));
var arg1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(1));
var arg2 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(2));
var arg3 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(3));
var arg4 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(4));
var arg5 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(5));
var arg6 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(6));
var arg7 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(7));
var arg8 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(8));
var arg9 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(9));
var arg10 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(10));
var arg11 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(11));
var arg12 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(12));
return sci.impl.types.__GT_NodeR((function (this$,ctx__$1,bindings){
var or__5002__auto__ = sci.impl.types.eval(arg0,ctx__$1,bindings);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = sci.impl.types.eval(arg1,ctx__$1,bindings);
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
var or__5002__auto____$2 = sci.impl.types.eval(arg2,ctx__$1,bindings);
if(cljs.core.truth_(or__5002__auto____$2)){
return or__5002__auto____$2;
} else {
var or__5002__auto____$3 = sci.impl.types.eval(arg3,ctx__$1,bindings);
if(cljs.core.truth_(or__5002__auto____$3)){
return or__5002__auto____$3;
} else {
var or__5002__auto____$4 = sci.impl.types.eval(arg4,ctx__$1,bindings);
if(cljs.core.truth_(or__5002__auto____$4)){
return or__5002__auto____$4;
} else {
var or__5002__auto____$5 = sci.impl.types.eval(arg5,ctx__$1,bindings);
if(cljs.core.truth_(or__5002__auto____$5)){
return or__5002__auto____$5;
} else {
var or__5002__auto____$6 = sci.impl.types.eval(arg6,ctx__$1,bindings);
if(cljs.core.truth_(or__5002__auto____$6)){
return or__5002__auto____$6;
} else {
var or__5002__auto____$7 = sci.impl.types.eval(arg7,ctx__$1,bindings);
if(cljs.core.truth_(or__5002__auto____$7)){
return or__5002__auto____$7;
} else {
var or__5002__auto____$8 = sci.impl.types.eval(arg8,ctx__$1,bindings);
if(cljs.core.truth_(or__5002__auto____$8)){
return or__5002__auto____$8;
} else {
var or__5002__auto____$9 = sci.impl.types.eval(arg9,ctx__$1,bindings);
if(cljs.core.truth_(or__5002__auto____$9)){
return or__5002__auto____$9;
} else {
var or__5002__auto____$10 = sci.impl.types.eval(arg10,ctx__$1,bindings);
if(cljs.core.truth_(or__5002__auto____$10)){
return or__5002__auto____$10;
} else {
var or__5002__auto____$11 = sci.impl.types.eval(arg11,ctx__$1,bindings);
if(cljs.core.truth_(or__5002__auto____$11)){
return or__5002__auto____$11;
} else {
return sci.impl.types.eval(arg12,ctx__$1,bindings);
}
}
}
}
}
}
}
}
}
}
}
}
}),null);

break;
case (14):
var arg0 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(0));
var arg1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(1));
var arg2 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(2));
var arg3 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(3));
var arg4 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(4));
var arg5 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(5));
var arg6 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(6));
var arg7 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(7));
var arg8 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(8));
var arg9 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(9));
var arg10 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(10));
var arg11 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(11));
var arg12 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(12));
var arg13 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(13));
return sci.impl.types.__GT_NodeR((function (this$,ctx__$1,bindings){
var or__5002__auto__ = sci.impl.types.eval(arg0,ctx__$1,bindings);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = sci.impl.types.eval(arg1,ctx__$1,bindings);
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
var or__5002__auto____$2 = sci.impl.types.eval(arg2,ctx__$1,bindings);
if(cljs.core.truth_(or__5002__auto____$2)){
return or__5002__auto____$2;
} else {
var or__5002__auto____$3 = sci.impl.types.eval(arg3,ctx__$1,bindings);
if(cljs.core.truth_(or__5002__auto____$3)){
return or__5002__auto____$3;
} else {
var or__5002__auto____$4 = sci.impl.types.eval(arg4,ctx__$1,bindings);
if(cljs.core.truth_(or__5002__auto____$4)){
return or__5002__auto____$4;
} else {
var or__5002__auto____$5 = sci.impl.types.eval(arg5,ctx__$1,bindings);
if(cljs.core.truth_(or__5002__auto____$5)){
return or__5002__auto____$5;
} else {
var or__5002__auto____$6 = sci.impl.types.eval(arg6,ctx__$1,bindings);
if(cljs.core.truth_(or__5002__auto____$6)){
return or__5002__auto____$6;
} else {
var or__5002__auto____$7 = sci.impl.types.eval(arg7,ctx__$1,bindings);
if(cljs.core.truth_(or__5002__auto____$7)){
return or__5002__auto____$7;
} else {
var or__5002__auto____$8 = sci.impl.types.eval(arg8,ctx__$1,bindings);
if(cljs.core.truth_(or__5002__auto____$8)){
return or__5002__auto____$8;
} else {
var or__5002__auto____$9 = sci.impl.types.eval(arg9,ctx__$1,bindings);
if(cljs.core.truth_(or__5002__auto____$9)){
return or__5002__auto____$9;
} else {
var or__5002__auto____$10 = sci.impl.types.eval(arg10,ctx__$1,bindings);
if(cljs.core.truth_(or__5002__auto____$10)){
return or__5002__auto____$10;
} else {
var or__5002__auto____$11 = sci.impl.types.eval(arg11,ctx__$1,bindings);
if(cljs.core.truth_(or__5002__auto____$11)){
return or__5002__auto____$11;
} else {
var or__5002__auto____$12 = sci.impl.types.eval(arg12,ctx__$1,bindings);
if(cljs.core.truth_(or__5002__auto____$12)){
return or__5002__auto____$12;
} else {
return sci.impl.types.eval(arg13,ctx__$1,bindings);
}
}
}
}
}
}
}
}
}
}
}
}
}
}),null);

break;
case (15):
var arg0 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(0));
var arg1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(1));
var arg2 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(2));
var arg3 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(3));
var arg4 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(4));
var arg5 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(5));
var arg6 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(6));
var arg7 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(7));
var arg8 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(8));
var arg9 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(9));
var arg10 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(10));
var arg11 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(11));
var arg12 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(12));
var arg13 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(13));
var arg14 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(14));
return sci.impl.types.__GT_NodeR((function (this$,ctx__$1,bindings){
var or__5002__auto__ = sci.impl.types.eval(arg0,ctx__$1,bindings);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = sci.impl.types.eval(arg1,ctx__$1,bindings);
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
var or__5002__auto____$2 = sci.impl.types.eval(arg2,ctx__$1,bindings);
if(cljs.core.truth_(or__5002__auto____$2)){
return or__5002__auto____$2;
} else {
var or__5002__auto____$3 = sci.impl.types.eval(arg3,ctx__$1,bindings);
if(cljs.core.truth_(or__5002__auto____$3)){
return or__5002__auto____$3;
} else {
var or__5002__auto____$4 = sci.impl.types.eval(arg4,ctx__$1,bindings);
if(cljs.core.truth_(or__5002__auto____$4)){
return or__5002__auto____$4;
} else {
var or__5002__auto____$5 = sci.impl.types.eval(arg5,ctx__$1,bindings);
if(cljs.core.truth_(or__5002__auto____$5)){
return or__5002__auto____$5;
} else {
var or__5002__auto____$6 = sci.impl.types.eval(arg6,ctx__$1,bindings);
if(cljs.core.truth_(or__5002__auto____$6)){
return or__5002__auto____$6;
} else {
var or__5002__auto____$7 = sci.impl.types.eval(arg7,ctx__$1,bindings);
if(cljs.core.truth_(or__5002__auto____$7)){
return or__5002__auto____$7;
} else {
var or__5002__auto____$8 = sci.impl.types.eval(arg8,ctx__$1,bindings);
if(cljs.core.truth_(or__5002__auto____$8)){
return or__5002__auto____$8;
} else {
var or__5002__auto____$9 = sci.impl.types.eval(arg9,ctx__$1,bindings);
if(cljs.core.truth_(or__5002__auto____$9)){
return or__5002__auto____$9;
} else {
var or__5002__auto____$10 = sci.impl.types.eval(arg10,ctx__$1,bindings);
if(cljs.core.truth_(or__5002__auto____$10)){
return or__5002__auto____$10;
} else {
var or__5002__auto____$11 = sci.impl.types.eval(arg11,ctx__$1,bindings);
if(cljs.core.truth_(or__5002__auto____$11)){
return or__5002__auto____$11;
} else {
var or__5002__auto____$12 = sci.impl.types.eval(arg12,ctx__$1,bindings);
if(cljs.core.truth_(or__5002__auto____$12)){
return or__5002__auto____$12;
} else {
var or__5002__auto____$13 = sci.impl.types.eval(arg13,ctx__$1,bindings);
if(cljs.core.truth_(or__5002__auto____$13)){
return or__5002__auto____$13;
} else {
return sci.impl.types.eval(arg14,ctx__$1,bindings);
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}),null);

break;
case (16):
var arg0 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(0));
var arg1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(1));
var arg2 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(2));
var arg3 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(3));
var arg4 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(4));
var arg5 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(5));
var arg6 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(6));
var arg7 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(7));
var arg8 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(8));
var arg9 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(9));
var arg10 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(10));
var arg11 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(11));
var arg12 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(12));
var arg13 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(13));
var arg14 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(14));
var arg15 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(15));
return sci.impl.types.__GT_NodeR((function (this$,ctx__$1,bindings){
var or__5002__auto__ = sci.impl.types.eval(arg0,ctx__$1,bindings);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = sci.impl.types.eval(arg1,ctx__$1,bindings);
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
var or__5002__auto____$2 = sci.impl.types.eval(arg2,ctx__$1,bindings);
if(cljs.core.truth_(or__5002__auto____$2)){
return or__5002__auto____$2;
} else {
var or__5002__auto____$3 = sci.impl.types.eval(arg3,ctx__$1,bindings);
if(cljs.core.truth_(or__5002__auto____$3)){
return or__5002__auto____$3;
} else {
var or__5002__auto____$4 = sci.impl.types.eval(arg4,ctx__$1,bindings);
if(cljs.core.truth_(or__5002__auto____$4)){
return or__5002__auto____$4;
} else {
var or__5002__auto____$5 = sci.impl.types.eval(arg5,ctx__$1,bindings);
if(cljs.core.truth_(or__5002__auto____$5)){
return or__5002__auto____$5;
} else {
var or__5002__auto____$6 = sci.impl.types.eval(arg6,ctx__$1,bindings);
if(cljs.core.truth_(or__5002__auto____$6)){
return or__5002__auto____$6;
} else {
var or__5002__auto____$7 = sci.impl.types.eval(arg7,ctx__$1,bindings);
if(cljs.core.truth_(or__5002__auto____$7)){
return or__5002__auto____$7;
} else {
var or__5002__auto____$8 = sci.impl.types.eval(arg8,ctx__$1,bindings);
if(cljs.core.truth_(or__5002__auto____$8)){
return or__5002__auto____$8;
} else {
var or__5002__auto____$9 = sci.impl.types.eval(arg9,ctx__$1,bindings);
if(cljs.core.truth_(or__5002__auto____$9)){
return or__5002__auto____$9;
} else {
var or__5002__auto____$10 = sci.impl.types.eval(arg10,ctx__$1,bindings);
if(cljs.core.truth_(or__5002__auto____$10)){
return or__5002__auto____$10;
} else {
var or__5002__auto____$11 = sci.impl.types.eval(arg11,ctx__$1,bindings);
if(cljs.core.truth_(or__5002__auto____$11)){
return or__5002__auto____$11;
} else {
var or__5002__auto____$12 = sci.impl.types.eval(arg12,ctx__$1,bindings);
if(cljs.core.truth_(or__5002__auto____$12)){
return or__5002__auto____$12;
} else {
var or__5002__auto____$13 = sci.impl.types.eval(arg13,ctx__$1,bindings);
if(cljs.core.truth_(or__5002__auto____$13)){
return or__5002__auto____$13;
} else {
var or__5002__auto____$14 = sci.impl.types.eval(arg14,ctx__$1,bindings);
if(cljs.core.truth_(or__5002__auto____$14)){
return or__5002__auto____$14;
} else {
return sci.impl.types.eval(arg15,ctx__$1,bindings);
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}),null);

break;
case (17):
var arg0 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(0));
var arg1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(1));
var arg2 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(2));
var arg3 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(3));
var arg4 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(4));
var arg5 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(5));
var arg6 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(6));
var arg7 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(7));
var arg8 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(8));
var arg9 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(9));
var arg10 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(10));
var arg11 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(11));
var arg12 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(12));
var arg13 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(13));
var arg14 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(14));
var arg15 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(15));
var arg16 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(16));
return sci.impl.types.__GT_NodeR((function (this$,ctx__$1,bindings){
var or__5002__auto__ = sci.impl.types.eval(arg0,ctx__$1,bindings);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = sci.impl.types.eval(arg1,ctx__$1,bindings);
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
var or__5002__auto____$2 = sci.impl.types.eval(arg2,ctx__$1,bindings);
if(cljs.core.truth_(or__5002__auto____$2)){
return or__5002__auto____$2;
} else {
var or__5002__auto____$3 = sci.impl.types.eval(arg3,ctx__$1,bindings);
if(cljs.core.truth_(or__5002__auto____$3)){
return or__5002__auto____$3;
} else {
var or__5002__auto____$4 = sci.impl.types.eval(arg4,ctx__$1,bindings);
if(cljs.core.truth_(or__5002__auto____$4)){
return or__5002__auto____$4;
} else {
var or__5002__auto____$5 = sci.impl.types.eval(arg5,ctx__$1,bindings);
if(cljs.core.truth_(or__5002__auto____$5)){
return or__5002__auto____$5;
} else {
var or__5002__auto____$6 = sci.impl.types.eval(arg6,ctx__$1,bindings);
if(cljs.core.truth_(or__5002__auto____$6)){
return or__5002__auto____$6;
} else {
var or__5002__auto____$7 = sci.impl.types.eval(arg7,ctx__$1,bindings);
if(cljs.core.truth_(or__5002__auto____$7)){
return or__5002__auto____$7;
} else {
var or__5002__auto____$8 = sci.impl.types.eval(arg8,ctx__$1,bindings);
if(cljs.core.truth_(or__5002__auto____$8)){
return or__5002__auto____$8;
} else {
var or__5002__auto____$9 = sci.impl.types.eval(arg9,ctx__$1,bindings);
if(cljs.core.truth_(or__5002__auto____$9)){
return or__5002__auto____$9;
} else {
var or__5002__auto____$10 = sci.impl.types.eval(arg10,ctx__$1,bindings);
if(cljs.core.truth_(or__5002__auto____$10)){
return or__5002__auto____$10;
} else {
var or__5002__auto____$11 = sci.impl.types.eval(arg11,ctx__$1,bindings);
if(cljs.core.truth_(or__5002__auto____$11)){
return or__5002__auto____$11;
} else {
var or__5002__auto____$12 = sci.impl.types.eval(arg12,ctx__$1,bindings);
if(cljs.core.truth_(or__5002__auto____$12)){
return or__5002__auto____$12;
} else {
var or__5002__auto____$13 = sci.impl.types.eval(arg13,ctx__$1,bindings);
if(cljs.core.truth_(or__5002__auto____$13)){
return or__5002__auto____$13;
} else {
var or__5002__auto____$14 = sci.impl.types.eval(arg14,ctx__$1,bindings);
if(cljs.core.truth_(or__5002__auto____$14)){
return or__5002__auto____$14;
} else {
var or__5002__auto____$15 = sci.impl.types.eval(arg15,ctx__$1,bindings);
if(cljs.core.truth_(or__5002__auto____$15)){
return or__5002__auto____$15;
} else {
return sci.impl.types.eval(arg16,ctx__$1,bindings);
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}),null);

break;
case (18):
var arg0 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(0));
var arg1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(1));
var arg2 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(2));
var arg3 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(3));
var arg4 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(4));
var arg5 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(5));
var arg6 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(6));
var arg7 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(7));
var arg8 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(8));
var arg9 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(9));
var arg10 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(10));
var arg11 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(11));
var arg12 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(12));
var arg13 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(13));
var arg14 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(14));
var arg15 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(15));
var arg16 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(16));
var arg17 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(17));
return sci.impl.types.__GT_NodeR((function (this$,ctx__$1,bindings){
var or__5002__auto__ = sci.impl.types.eval(arg0,ctx__$1,bindings);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = sci.impl.types.eval(arg1,ctx__$1,bindings);
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
var or__5002__auto____$2 = sci.impl.types.eval(arg2,ctx__$1,bindings);
if(cljs.core.truth_(or__5002__auto____$2)){
return or__5002__auto____$2;
} else {
var or__5002__auto____$3 = sci.impl.types.eval(arg3,ctx__$1,bindings);
if(cljs.core.truth_(or__5002__auto____$3)){
return or__5002__auto____$3;
} else {
var or__5002__auto____$4 = sci.impl.types.eval(arg4,ctx__$1,bindings);
if(cljs.core.truth_(or__5002__auto____$4)){
return or__5002__auto____$4;
} else {
var or__5002__auto____$5 = sci.impl.types.eval(arg5,ctx__$1,bindings);
if(cljs.core.truth_(or__5002__auto____$5)){
return or__5002__auto____$5;
} else {
var or__5002__auto____$6 = sci.impl.types.eval(arg6,ctx__$1,bindings);
if(cljs.core.truth_(or__5002__auto____$6)){
return or__5002__auto____$6;
} else {
var or__5002__auto____$7 = sci.impl.types.eval(arg7,ctx__$1,bindings);
if(cljs.core.truth_(or__5002__auto____$7)){
return or__5002__auto____$7;
} else {
var or__5002__auto____$8 = sci.impl.types.eval(arg8,ctx__$1,bindings);
if(cljs.core.truth_(or__5002__auto____$8)){
return or__5002__auto____$8;
} else {
var or__5002__auto____$9 = sci.impl.types.eval(arg9,ctx__$1,bindings);
if(cljs.core.truth_(or__5002__auto____$9)){
return or__5002__auto____$9;
} else {
var or__5002__auto____$10 = sci.impl.types.eval(arg10,ctx__$1,bindings);
if(cljs.core.truth_(or__5002__auto____$10)){
return or__5002__auto____$10;
} else {
var or__5002__auto____$11 = sci.impl.types.eval(arg11,ctx__$1,bindings);
if(cljs.core.truth_(or__5002__auto____$11)){
return or__5002__auto____$11;
} else {
var or__5002__auto____$12 = sci.impl.types.eval(arg12,ctx__$1,bindings);
if(cljs.core.truth_(or__5002__auto____$12)){
return or__5002__auto____$12;
} else {
var or__5002__auto____$13 = sci.impl.types.eval(arg13,ctx__$1,bindings);
if(cljs.core.truth_(or__5002__auto____$13)){
return or__5002__auto____$13;
} else {
var or__5002__auto____$14 = sci.impl.types.eval(arg14,ctx__$1,bindings);
if(cljs.core.truth_(or__5002__auto____$14)){
return or__5002__auto____$14;
} else {
var or__5002__auto____$15 = sci.impl.types.eval(arg15,ctx__$1,bindings);
if(cljs.core.truth_(or__5002__auto____$15)){
return or__5002__auto____$15;
} else {
var or__5002__auto____$16 = sci.impl.types.eval(arg16,ctx__$1,bindings);
if(cljs.core.truth_(or__5002__auto____$16)){
return or__5002__auto____$16;
} else {
return sci.impl.types.eval(arg17,ctx__$1,bindings);
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}),null);

break;
case (19):
var arg0 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(0));
var arg1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(1));
var arg2 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(2));
var arg3 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(3));
var arg4 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(4));
var arg5 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(5));
var arg6 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(6));
var arg7 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(7));
var arg8 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(8));
var arg9 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(9));
var arg10 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(10));
var arg11 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(11));
var arg12 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(12));
var arg13 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(13));
var arg14 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(14));
var arg15 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(15));
var arg16 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(16));
var arg17 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(17));
var arg18 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(18));
return sci.impl.types.__GT_NodeR((function (this$,ctx__$1,bindings){
var or__5002__auto__ = sci.impl.types.eval(arg0,ctx__$1,bindings);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = sci.impl.types.eval(arg1,ctx__$1,bindings);
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
var or__5002__auto____$2 = sci.impl.types.eval(arg2,ctx__$1,bindings);
if(cljs.core.truth_(or__5002__auto____$2)){
return or__5002__auto____$2;
} else {
var or__5002__auto____$3 = sci.impl.types.eval(arg3,ctx__$1,bindings);
if(cljs.core.truth_(or__5002__auto____$3)){
return or__5002__auto____$3;
} else {
var or__5002__auto____$4 = sci.impl.types.eval(arg4,ctx__$1,bindings);
if(cljs.core.truth_(or__5002__auto____$4)){
return or__5002__auto____$4;
} else {
var or__5002__auto____$5 = sci.impl.types.eval(arg5,ctx__$1,bindings);
if(cljs.core.truth_(or__5002__auto____$5)){
return or__5002__auto____$5;
} else {
var or__5002__auto____$6 = sci.impl.types.eval(arg6,ctx__$1,bindings);
if(cljs.core.truth_(or__5002__auto____$6)){
return or__5002__auto____$6;
} else {
var or__5002__auto____$7 = sci.impl.types.eval(arg7,ctx__$1,bindings);
if(cljs.core.truth_(or__5002__auto____$7)){
return or__5002__auto____$7;
} else {
var or__5002__auto____$8 = sci.impl.types.eval(arg8,ctx__$1,bindings);
if(cljs.core.truth_(or__5002__auto____$8)){
return or__5002__auto____$8;
} else {
var or__5002__auto____$9 = sci.impl.types.eval(arg9,ctx__$1,bindings);
if(cljs.core.truth_(or__5002__auto____$9)){
return or__5002__auto____$9;
} else {
var or__5002__auto____$10 = sci.impl.types.eval(arg10,ctx__$1,bindings);
if(cljs.core.truth_(or__5002__auto____$10)){
return or__5002__auto____$10;
} else {
var or__5002__auto____$11 = sci.impl.types.eval(arg11,ctx__$1,bindings);
if(cljs.core.truth_(or__5002__auto____$11)){
return or__5002__auto____$11;
} else {
var or__5002__auto____$12 = sci.impl.types.eval(arg12,ctx__$1,bindings);
if(cljs.core.truth_(or__5002__auto____$12)){
return or__5002__auto____$12;
} else {
var or__5002__auto____$13 = sci.impl.types.eval(arg13,ctx__$1,bindings);
if(cljs.core.truth_(or__5002__auto____$13)){
return or__5002__auto____$13;
} else {
var or__5002__auto____$14 = sci.impl.types.eval(arg14,ctx__$1,bindings);
if(cljs.core.truth_(or__5002__auto____$14)){
return or__5002__auto____$14;
} else {
var or__5002__auto____$15 = sci.impl.types.eval(arg15,ctx__$1,bindings);
if(cljs.core.truth_(or__5002__auto____$15)){
return or__5002__auto____$15;
} else {
var or__5002__auto____$16 = sci.impl.types.eval(arg16,ctx__$1,bindings);
if(cljs.core.truth_(or__5002__auto____$16)){
return or__5002__auto____$16;
} else {
var or__5002__auto____$17 = sci.impl.types.eval(arg17,ctx__$1,bindings);
if(cljs.core.truth_(or__5002__auto____$17)){
return or__5002__auto____$17;
} else {
return sci.impl.types.eval(arg18,ctx__$1,bindings);
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}),null);

break;
default:
var analyzed_children__$1 = cljs.core.deref(analyzed_children);
return sci.impl.types.__GT_NodeR((function (this$,ctx__$1,bindings){
return sci.impl.evaluator.eval_or(analyzed_children__$1,ctx__$1,bindings);
}),null);

}
});
sci.impl.analyzer.return_and = (function sci$impl$analyzer$return_and(ctx,expr,children){
var analyzed_children = (new cljs.core.Delay((function (){
return sci.impl.analyzer.analyze_children_tail(ctx,children);
}),null));
var G__91002 = cljs.core.count(children);
switch (G__91002) {
case (0):
return null;

break;
case (1):
var G__91004 = ctx;
var G__91005 = cljs.core.first(children);
return (sci.impl.analyzer.analyze.cljs$core$IFn$_invoke$arity$2 ? sci.impl.analyzer.analyze.cljs$core$IFn$_invoke$arity$2(G__91004,G__91005) : sci.impl.analyzer.analyze.call(null,G__91004,G__91005));

break;
case (2):
var arg0 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(0));
var arg1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(1));
return sci.impl.types.__GT_NodeR((function (this$,ctx__$1,bindings){
var and__5000__auto__ = sci.impl.types.eval(arg0,ctx__$1,bindings);
if(cljs.core.truth_(and__5000__auto__)){
return sci.impl.types.eval(arg1,ctx__$1,bindings);
} else {
return and__5000__auto__;
}
}),null);

break;
case (3):
var arg0 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(0));
var arg1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(1));
var arg2 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(2));
return sci.impl.types.__GT_NodeR((function (this$,ctx__$1,bindings){
var and__5000__auto__ = sci.impl.types.eval(arg0,ctx__$1,bindings);
if(cljs.core.truth_(and__5000__auto__)){
var and__5000__auto____$1 = sci.impl.types.eval(arg1,ctx__$1,bindings);
if(cljs.core.truth_(and__5000__auto____$1)){
return sci.impl.types.eval(arg2,ctx__$1,bindings);
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
}),null);

break;
case (4):
var arg0 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(0));
var arg1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(1));
var arg2 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(2));
var arg3 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(3));
return sci.impl.types.__GT_NodeR((function (this$,ctx__$1,bindings){
var and__5000__auto__ = sci.impl.types.eval(arg0,ctx__$1,bindings);
if(cljs.core.truth_(and__5000__auto__)){
var and__5000__auto____$1 = sci.impl.types.eval(arg1,ctx__$1,bindings);
if(cljs.core.truth_(and__5000__auto____$1)){
var and__5000__auto____$2 = sci.impl.types.eval(arg2,ctx__$1,bindings);
if(cljs.core.truth_(and__5000__auto____$2)){
return sci.impl.types.eval(arg3,ctx__$1,bindings);
} else {
return and__5000__auto____$2;
}
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
}),null);

break;
case (5):
var arg0 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(0));
var arg1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(1));
var arg2 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(2));
var arg3 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(3));
var arg4 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(4));
return sci.impl.types.__GT_NodeR((function (this$,ctx__$1,bindings){
var and__5000__auto__ = sci.impl.types.eval(arg0,ctx__$1,bindings);
if(cljs.core.truth_(and__5000__auto__)){
var and__5000__auto____$1 = sci.impl.types.eval(arg1,ctx__$1,bindings);
if(cljs.core.truth_(and__5000__auto____$1)){
var and__5000__auto____$2 = sci.impl.types.eval(arg2,ctx__$1,bindings);
if(cljs.core.truth_(and__5000__auto____$2)){
var and__5000__auto____$3 = sci.impl.types.eval(arg3,ctx__$1,bindings);
if(cljs.core.truth_(and__5000__auto____$3)){
return sci.impl.types.eval(arg4,ctx__$1,bindings);
} else {
return and__5000__auto____$3;
}
} else {
return and__5000__auto____$2;
}
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
}),null);

break;
case (6):
var arg0 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(0));
var arg1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(1));
var arg2 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(2));
var arg3 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(3));
var arg4 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(4));
var arg5 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(5));
return sci.impl.types.__GT_NodeR((function (this$,ctx__$1,bindings){
var and__5000__auto__ = sci.impl.types.eval(arg0,ctx__$1,bindings);
if(cljs.core.truth_(and__5000__auto__)){
var and__5000__auto____$1 = sci.impl.types.eval(arg1,ctx__$1,bindings);
if(cljs.core.truth_(and__5000__auto____$1)){
var and__5000__auto____$2 = sci.impl.types.eval(arg2,ctx__$1,bindings);
if(cljs.core.truth_(and__5000__auto____$2)){
var and__5000__auto____$3 = sci.impl.types.eval(arg3,ctx__$1,bindings);
if(cljs.core.truth_(and__5000__auto____$3)){
var and__5000__auto____$4 = sci.impl.types.eval(arg4,ctx__$1,bindings);
if(cljs.core.truth_(and__5000__auto____$4)){
return sci.impl.types.eval(arg5,ctx__$1,bindings);
} else {
return and__5000__auto____$4;
}
} else {
return and__5000__auto____$3;
}
} else {
return and__5000__auto____$2;
}
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
}),null);

break;
case (7):
var arg0 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(0));
var arg1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(1));
var arg2 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(2));
var arg3 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(3));
var arg4 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(4));
var arg5 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(5));
var arg6 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(6));
return sci.impl.types.__GT_NodeR((function (this$,ctx__$1,bindings){
var and__5000__auto__ = sci.impl.types.eval(arg0,ctx__$1,bindings);
if(cljs.core.truth_(and__5000__auto__)){
var and__5000__auto____$1 = sci.impl.types.eval(arg1,ctx__$1,bindings);
if(cljs.core.truth_(and__5000__auto____$1)){
var and__5000__auto____$2 = sci.impl.types.eval(arg2,ctx__$1,bindings);
if(cljs.core.truth_(and__5000__auto____$2)){
var and__5000__auto____$3 = sci.impl.types.eval(arg3,ctx__$1,bindings);
if(cljs.core.truth_(and__5000__auto____$3)){
var and__5000__auto____$4 = sci.impl.types.eval(arg4,ctx__$1,bindings);
if(cljs.core.truth_(and__5000__auto____$4)){
var and__5000__auto____$5 = sci.impl.types.eval(arg5,ctx__$1,bindings);
if(cljs.core.truth_(and__5000__auto____$5)){
return sci.impl.types.eval(arg6,ctx__$1,bindings);
} else {
return and__5000__auto____$5;
}
} else {
return and__5000__auto____$4;
}
} else {
return and__5000__auto____$3;
}
} else {
return and__5000__auto____$2;
}
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
}),null);

break;
case (8):
var arg0 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(0));
var arg1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(1));
var arg2 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(2));
var arg3 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(3));
var arg4 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(4));
var arg5 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(5));
var arg6 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(6));
var arg7 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(7));
return sci.impl.types.__GT_NodeR((function (this$,ctx__$1,bindings){
var and__5000__auto__ = sci.impl.types.eval(arg0,ctx__$1,bindings);
if(cljs.core.truth_(and__5000__auto__)){
var and__5000__auto____$1 = sci.impl.types.eval(arg1,ctx__$1,bindings);
if(cljs.core.truth_(and__5000__auto____$1)){
var and__5000__auto____$2 = sci.impl.types.eval(arg2,ctx__$1,bindings);
if(cljs.core.truth_(and__5000__auto____$2)){
var and__5000__auto____$3 = sci.impl.types.eval(arg3,ctx__$1,bindings);
if(cljs.core.truth_(and__5000__auto____$3)){
var and__5000__auto____$4 = sci.impl.types.eval(arg4,ctx__$1,bindings);
if(cljs.core.truth_(and__5000__auto____$4)){
var and__5000__auto____$5 = sci.impl.types.eval(arg5,ctx__$1,bindings);
if(cljs.core.truth_(and__5000__auto____$5)){
var and__5000__auto____$6 = sci.impl.types.eval(arg6,ctx__$1,bindings);
if(cljs.core.truth_(and__5000__auto____$6)){
return sci.impl.types.eval(arg7,ctx__$1,bindings);
} else {
return and__5000__auto____$6;
}
} else {
return and__5000__auto____$5;
}
} else {
return and__5000__auto____$4;
}
} else {
return and__5000__auto____$3;
}
} else {
return and__5000__auto____$2;
}
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
}),null);

break;
case (9):
var arg0 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(0));
var arg1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(1));
var arg2 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(2));
var arg3 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(3));
var arg4 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(4));
var arg5 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(5));
var arg6 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(6));
var arg7 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(7));
var arg8 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(8));
return sci.impl.types.__GT_NodeR((function (this$,ctx__$1,bindings){
var and__5000__auto__ = sci.impl.types.eval(arg0,ctx__$1,bindings);
if(cljs.core.truth_(and__5000__auto__)){
var and__5000__auto____$1 = sci.impl.types.eval(arg1,ctx__$1,bindings);
if(cljs.core.truth_(and__5000__auto____$1)){
var and__5000__auto____$2 = sci.impl.types.eval(arg2,ctx__$1,bindings);
if(cljs.core.truth_(and__5000__auto____$2)){
var and__5000__auto____$3 = sci.impl.types.eval(arg3,ctx__$1,bindings);
if(cljs.core.truth_(and__5000__auto____$3)){
var and__5000__auto____$4 = sci.impl.types.eval(arg4,ctx__$1,bindings);
if(cljs.core.truth_(and__5000__auto____$4)){
var and__5000__auto____$5 = sci.impl.types.eval(arg5,ctx__$1,bindings);
if(cljs.core.truth_(and__5000__auto____$5)){
var and__5000__auto____$6 = sci.impl.types.eval(arg6,ctx__$1,bindings);
if(cljs.core.truth_(and__5000__auto____$6)){
var and__5000__auto____$7 = sci.impl.types.eval(arg7,ctx__$1,bindings);
if(cljs.core.truth_(and__5000__auto____$7)){
return sci.impl.types.eval(arg8,ctx__$1,bindings);
} else {
return and__5000__auto____$7;
}
} else {
return and__5000__auto____$6;
}
} else {
return and__5000__auto____$5;
}
} else {
return and__5000__auto____$4;
}
} else {
return and__5000__auto____$3;
}
} else {
return and__5000__auto____$2;
}
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
}),null);

break;
case (10):
var arg0 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(0));
var arg1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(1));
var arg2 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(2));
var arg3 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(3));
var arg4 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(4));
var arg5 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(5));
var arg6 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(6));
var arg7 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(7));
var arg8 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(8));
var arg9 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(9));
return sci.impl.types.__GT_NodeR((function (this$,ctx__$1,bindings){
var and__5000__auto__ = sci.impl.types.eval(arg0,ctx__$1,bindings);
if(cljs.core.truth_(and__5000__auto__)){
var and__5000__auto____$1 = sci.impl.types.eval(arg1,ctx__$1,bindings);
if(cljs.core.truth_(and__5000__auto____$1)){
var and__5000__auto____$2 = sci.impl.types.eval(arg2,ctx__$1,bindings);
if(cljs.core.truth_(and__5000__auto____$2)){
var and__5000__auto____$3 = sci.impl.types.eval(arg3,ctx__$1,bindings);
if(cljs.core.truth_(and__5000__auto____$3)){
var and__5000__auto____$4 = sci.impl.types.eval(arg4,ctx__$1,bindings);
if(cljs.core.truth_(and__5000__auto____$4)){
var and__5000__auto____$5 = sci.impl.types.eval(arg5,ctx__$1,bindings);
if(cljs.core.truth_(and__5000__auto____$5)){
var and__5000__auto____$6 = sci.impl.types.eval(arg6,ctx__$1,bindings);
if(cljs.core.truth_(and__5000__auto____$6)){
var and__5000__auto____$7 = sci.impl.types.eval(arg7,ctx__$1,bindings);
if(cljs.core.truth_(and__5000__auto____$7)){
var and__5000__auto____$8 = sci.impl.types.eval(arg8,ctx__$1,bindings);
if(cljs.core.truth_(and__5000__auto____$8)){
return sci.impl.types.eval(arg9,ctx__$1,bindings);
} else {
return and__5000__auto____$8;
}
} else {
return and__5000__auto____$7;
}
} else {
return and__5000__auto____$6;
}
} else {
return and__5000__auto____$5;
}
} else {
return and__5000__auto____$4;
}
} else {
return and__5000__auto____$3;
}
} else {
return and__5000__auto____$2;
}
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
}),null);

break;
case (11):
var arg0 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(0));
var arg1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(1));
var arg2 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(2));
var arg3 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(3));
var arg4 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(4));
var arg5 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(5));
var arg6 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(6));
var arg7 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(7));
var arg8 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(8));
var arg9 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(9));
var arg10 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(10));
return sci.impl.types.__GT_NodeR((function (this$,ctx__$1,bindings){
var and__5000__auto__ = sci.impl.types.eval(arg0,ctx__$1,bindings);
if(cljs.core.truth_(and__5000__auto__)){
var and__5000__auto____$1 = sci.impl.types.eval(arg1,ctx__$1,bindings);
if(cljs.core.truth_(and__5000__auto____$1)){
var and__5000__auto____$2 = sci.impl.types.eval(arg2,ctx__$1,bindings);
if(cljs.core.truth_(and__5000__auto____$2)){
var and__5000__auto____$3 = sci.impl.types.eval(arg3,ctx__$1,bindings);
if(cljs.core.truth_(and__5000__auto____$3)){
var and__5000__auto____$4 = sci.impl.types.eval(arg4,ctx__$1,bindings);
if(cljs.core.truth_(and__5000__auto____$4)){
var and__5000__auto____$5 = sci.impl.types.eval(arg5,ctx__$1,bindings);
if(cljs.core.truth_(and__5000__auto____$5)){
var and__5000__auto____$6 = sci.impl.types.eval(arg6,ctx__$1,bindings);
if(cljs.core.truth_(and__5000__auto____$6)){
var and__5000__auto____$7 = sci.impl.types.eval(arg7,ctx__$1,bindings);
if(cljs.core.truth_(and__5000__auto____$7)){
var and__5000__auto____$8 = sci.impl.types.eval(arg8,ctx__$1,bindings);
if(cljs.core.truth_(and__5000__auto____$8)){
var and__5000__auto____$9 = sci.impl.types.eval(arg9,ctx__$1,bindings);
if(cljs.core.truth_(and__5000__auto____$9)){
return sci.impl.types.eval(arg10,ctx__$1,bindings);
} else {
return and__5000__auto____$9;
}
} else {
return and__5000__auto____$8;
}
} else {
return and__5000__auto____$7;
}
} else {
return and__5000__auto____$6;
}
} else {
return and__5000__auto____$5;
}
} else {
return and__5000__auto____$4;
}
} else {
return and__5000__auto____$3;
}
} else {
return and__5000__auto____$2;
}
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
}),null);

break;
case (12):
var arg0 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(0));
var arg1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(1));
var arg2 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(2));
var arg3 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(3));
var arg4 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(4));
var arg5 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(5));
var arg6 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(6));
var arg7 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(7));
var arg8 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(8));
var arg9 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(9));
var arg10 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(10));
var arg11 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(11));
return sci.impl.types.__GT_NodeR((function (this$,ctx__$1,bindings){
var and__5000__auto__ = sci.impl.types.eval(arg0,ctx__$1,bindings);
if(cljs.core.truth_(and__5000__auto__)){
var and__5000__auto____$1 = sci.impl.types.eval(arg1,ctx__$1,bindings);
if(cljs.core.truth_(and__5000__auto____$1)){
var and__5000__auto____$2 = sci.impl.types.eval(arg2,ctx__$1,bindings);
if(cljs.core.truth_(and__5000__auto____$2)){
var and__5000__auto____$3 = sci.impl.types.eval(arg3,ctx__$1,bindings);
if(cljs.core.truth_(and__5000__auto____$3)){
var and__5000__auto____$4 = sci.impl.types.eval(arg4,ctx__$1,bindings);
if(cljs.core.truth_(and__5000__auto____$4)){
var and__5000__auto____$5 = sci.impl.types.eval(arg5,ctx__$1,bindings);
if(cljs.core.truth_(and__5000__auto____$5)){
var and__5000__auto____$6 = sci.impl.types.eval(arg6,ctx__$1,bindings);
if(cljs.core.truth_(and__5000__auto____$6)){
var and__5000__auto____$7 = sci.impl.types.eval(arg7,ctx__$1,bindings);
if(cljs.core.truth_(and__5000__auto____$7)){
var and__5000__auto____$8 = sci.impl.types.eval(arg8,ctx__$1,bindings);
if(cljs.core.truth_(and__5000__auto____$8)){
var and__5000__auto____$9 = sci.impl.types.eval(arg9,ctx__$1,bindings);
if(cljs.core.truth_(and__5000__auto____$9)){
var and__5000__auto____$10 = sci.impl.types.eval(arg10,ctx__$1,bindings);
if(cljs.core.truth_(and__5000__auto____$10)){
return sci.impl.types.eval(arg11,ctx__$1,bindings);
} else {
return and__5000__auto____$10;
}
} else {
return and__5000__auto____$9;
}
} else {
return and__5000__auto____$8;
}
} else {
return and__5000__auto____$7;
}
} else {
return and__5000__auto____$6;
}
} else {
return and__5000__auto____$5;
}
} else {
return and__5000__auto____$4;
}
} else {
return and__5000__auto____$3;
}
} else {
return and__5000__auto____$2;
}
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
}),null);

break;
case (13):
var arg0 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(0));
var arg1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(1));
var arg2 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(2));
var arg3 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(3));
var arg4 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(4));
var arg5 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(5));
var arg6 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(6));
var arg7 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(7));
var arg8 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(8));
var arg9 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(9));
var arg10 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(10));
var arg11 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(11));
var arg12 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(12));
return sci.impl.types.__GT_NodeR((function (this$,ctx__$1,bindings){
var and__5000__auto__ = sci.impl.types.eval(arg0,ctx__$1,bindings);
if(cljs.core.truth_(and__5000__auto__)){
var and__5000__auto____$1 = sci.impl.types.eval(arg1,ctx__$1,bindings);
if(cljs.core.truth_(and__5000__auto____$1)){
var and__5000__auto____$2 = sci.impl.types.eval(arg2,ctx__$1,bindings);
if(cljs.core.truth_(and__5000__auto____$2)){
var and__5000__auto____$3 = sci.impl.types.eval(arg3,ctx__$1,bindings);
if(cljs.core.truth_(and__5000__auto____$3)){
var and__5000__auto____$4 = sci.impl.types.eval(arg4,ctx__$1,bindings);
if(cljs.core.truth_(and__5000__auto____$4)){
var and__5000__auto____$5 = sci.impl.types.eval(arg5,ctx__$1,bindings);
if(cljs.core.truth_(and__5000__auto____$5)){
var and__5000__auto____$6 = sci.impl.types.eval(arg6,ctx__$1,bindings);
if(cljs.core.truth_(and__5000__auto____$6)){
var and__5000__auto____$7 = sci.impl.types.eval(arg7,ctx__$1,bindings);
if(cljs.core.truth_(and__5000__auto____$7)){
var and__5000__auto____$8 = sci.impl.types.eval(arg8,ctx__$1,bindings);
if(cljs.core.truth_(and__5000__auto____$8)){
var and__5000__auto____$9 = sci.impl.types.eval(arg9,ctx__$1,bindings);
if(cljs.core.truth_(and__5000__auto____$9)){
var and__5000__auto____$10 = sci.impl.types.eval(arg10,ctx__$1,bindings);
if(cljs.core.truth_(and__5000__auto____$10)){
var and__5000__auto____$11 = sci.impl.types.eval(arg11,ctx__$1,bindings);
if(cljs.core.truth_(and__5000__auto____$11)){
return sci.impl.types.eval(arg12,ctx__$1,bindings);
} else {
return and__5000__auto____$11;
}
} else {
return and__5000__auto____$10;
}
} else {
return and__5000__auto____$9;
}
} else {
return and__5000__auto____$8;
}
} else {
return and__5000__auto____$7;
}
} else {
return and__5000__auto____$6;
}
} else {
return and__5000__auto____$5;
}
} else {
return and__5000__auto____$4;
}
} else {
return and__5000__auto____$3;
}
} else {
return and__5000__auto____$2;
}
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
}),null);

break;
case (14):
var arg0 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(0));
var arg1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(1));
var arg2 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(2));
var arg3 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(3));
var arg4 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(4));
var arg5 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(5));
var arg6 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(6));
var arg7 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(7));
var arg8 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(8));
var arg9 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(9));
var arg10 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(10));
var arg11 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(11));
var arg12 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(12));
var arg13 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(13));
return sci.impl.types.__GT_NodeR((function (this$,ctx__$1,bindings){
var and__5000__auto__ = sci.impl.types.eval(arg0,ctx__$1,bindings);
if(cljs.core.truth_(and__5000__auto__)){
var and__5000__auto____$1 = sci.impl.types.eval(arg1,ctx__$1,bindings);
if(cljs.core.truth_(and__5000__auto____$1)){
var and__5000__auto____$2 = sci.impl.types.eval(arg2,ctx__$1,bindings);
if(cljs.core.truth_(and__5000__auto____$2)){
var and__5000__auto____$3 = sci.impl.types.eval(arg3,ctx__$1,bindings);
if(cljs.core.truth_(and__5000__auto____$3)){
var and__5000__auto____$4 = sci.impl.types.eval(arg4,ctx__$1,bindings);
if(cljs.core.truth_(and__5000__auto____$4)){
var and__5000__auto____$5 = sci.impl.types.eval(arg5,ctx__$1,bindings);
if(cljs.core.truth_(and__5000__auto____$5)){
var and__5000__auto____$6 = sci.impl.types.eval(arg6,ctx__$1,bindings);
if(cljs.core.truth_(and__5000__auto____$6)){
var and__5000__auto____$7 = sci.impl.types.eval(arg7,ctx__$1,bindings);
if(cljs.core.truth_(and__5000__auto____$7)){
var and__5000__auto____$8 = sci.impl.types.eval(arg8,ctx__$1,bindings);
if(cljs.core.truth_(and__5000__auto____$8)){
var and__5000__auto____$9 = sci.impl.types.eval(arg9,ctx__$1,bindings);
if(cljs.core.truth_(and__5000__auto____$9)){
var and__5000__auto____$10 = sci.impl.types.eval(arg10,ctx__$1,bindings);
if(cljs.core.truth_(and__5000__auto____$10)){
var and__5000__auto____$11 = sci.impl.types.eval(arg11,ctx__$1,bindings);
if(cljs.core.truth_(and__5000__auto____$11)){
var and__5000__auto____$12 = sci.impl.types.eval(arg12,ctx__$1,bindings);
if(cljs.core.truth_(and__5000__auto____$12)){
return sci.impl.types.eval(arg13,ctx__$1,bindings);
} else {
return and__5000__auto____$12;
}
} else {
return and__5000__auto____$11;
}
} else {
return and__5000__auto____$10;
}
} else {
return and__5000__auto____$9;
}
} else {
return and__5000__auto____$8;
}
} else {
return and__5000__auto____$7;
}
} else {
return and__5000__auto____$6;
}
} else {
return and__5000__auto____$5;
}
} else {
return and__5000__auto____$4;
}
} else {
return and__5000__auto____$3;
}
} else {
return and__5000__auto____$2;
}
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
}),null);

break;
case (15):
var arg0 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(0));
var arg1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(1));
var arg2 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(2));
var arg3 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(3));
var arg4 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(4));
var arg5 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(5));
var arg6 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(6));
var arg7 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(7));
var arg8 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(8));
var arg9 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(9));
var arg10 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(10));
var arg11 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(11));
var arg12 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(12));
var arg13 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(13));
var arg14 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(14));
return sci.impl.types.__GT_NodeR((function (this$,ctx__$1,bindings){
var and__5000__auto__ = sci.impl.types.eval(arg0,ctx__$1,bindings);
if(cljs.core.truth_(and__5000__auto__)){
var and__5000__auto____$1 = sci.impl.types.eval(arg1,ctx__$1,bindings);
if(cljs.core.truth_(and__5000__auto____$1)){
var and__5000__auto____$2 = sci.impl.types.eval(arg2,ctx__$1,bindings);
if(cljs.core.truth_(and__5000__auto____$2)){
var and__5000__auto____$3 = sci.impl.types.eval(arg3,ctx__$1,bindings);
if(cljs.core.truth_(and__5000__auto____$3)){
var and__5000__auto____$4 = sci.impl.types.eval(arg4,ctx__$1,bindings);
if(cljs.core.truth_(and__5000__auto____$4)){
var and__5000__auto____$5 = sci.impl.types.eval(arg5,ctx__$1,bindings);
if(cljs.core.truth_(and__5000__auto____$5)){
var and__5000__auto____$6 = sci.impl.types.eval(arg6,ctx__$1,bindings);
if(cljs.core.truth_(and__5000__auto____$6)){
var and__5000__auto____$7 = sci.impl.types.eval(arg7,ctx__$1,bindings);
if(cljs.core.truth_(and__5000__auto____$7)){
var and__5000__auto____$8 = sci.impl.types.eval(arg8,ctx__$1,bindings);
if(cljs.core.truth_(and__5000__auto____$8)){
var and__5000__auto____$9 = sci.impl.types.eval(arg9,ctx__$1,bindings);
if(cljs.core.truth_(and__5000__auto____$9)){
var and__5000__auto____$10 = sci.impl.types.eval(arg10,ctx__$1,bindings);
if(cljs.core.truth_(and__5000__auto____$10)){
var and__5000__auto____$11 = sci.impl.types.eval(arg11,ctx__$1,bindings);
if(cljs.core.truth_(and__5000__auto____$11)){
var and__5000__auto____$12 = sci.impl.types.eval(arg12,ctx__$1,bindings);
if(cljs.core.truth_(and__5000__auto____$12)){
var and__5000__auto____$13 = sci.impl.types.eval(arg13,ctx__$1,bindings);
if(cljs.core.truth_(and__5000__auto____$13)){
return sci.impl.types.eval(arg14,ctx__$1,bindings);
} else {
return and__5000__auto____$13;
}
} else {
return and__5000__auto____$12;
}
} else {
return and__5000__auto____$11;
}
} else {
return and__5000__auto____$10;
}
} else {
return and__5000__auto____$9;
}
} else {
return and__5000__auto____$8;
}
} else {
return and__5000__auto____$7;
}
} else {
return and__5000__auto____$6;
}
} else {
return and__5000__auto____$5;
}
} else {
return and__5000__auto____$4;
}
} else {
return and__5000__auto____$3;
}
} else {
return and__5000__auto____$2;
}
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
}),null);

break;
case (16):
var arg0 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(0));
var arg1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(1));
var arg2 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(2));
var arg3 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(3));
var arg4 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(4));
var arg5 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(5));
var arg6 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(6));
var arg7 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(7));
var arg8 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(8));
var arg9 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(9));
var arg10 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(10));
var arg11 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(11));
var arg12 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(12));
var arg13 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(13));
var arg14 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(14));
var arg15 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(15));
return sci.impl.types.__GT_NodeR((function (this$,ctx__$1,bindings){
var and__5000__auto__ = sci.impl.types.eval(arg0,ctx__$1,bindings);
if(cljs.core.truth_(and__5000__auto__)){
var and__5000__auto____$1 = sci.impl.types.eval(arg1,ctx__$1,bindings);
if(cljs.core.truth_(and__5000__auto____$1)){
var and__5000__auto____$2 = sci.impl.types.eval(arg2,ctx__$1,bindings);
if(cljs.core.truth_(and__5000__auto____$2)){
var and__5000__auto____$3 = sci.impl.types.eval(arg3,ctx__$1,bindings);
if(cljs.core.truth_(and__5000__auto____$3)){
var and__5000__auto____$4 = sci.impl.types.eval(arg4,ctx__$1,bindings);
if(cljs.core.truth_(and__5000__auto____$4)){
var and__5000__auto____$5 = sci.impl.types.eval(arg5,ctx__$1,bindings);
if(cljs.core.truth_(and__5000__auto____$5)){
var and__5000__auto____$6 = sci.impl.types.eval(arg6,ctx__$1,bindings);
if(cljs.core.truth_(and__5000__auto____$6)){
var and__5000__auto____$7 = sci.impl.types.eval(arg7,ctx__$1,bindings);
if(cljs.core.truth_(and__5000__auto____$7)){
var and__5000__auto____$8 = sci.impl.types.eval(arg8,ctx__$1,bindings);
if(cljs.core.truth_(and__5000__auto____$8)){
var and__5000__auto____$9 = sci.impl.types.eval(arg9,ctx__$1,bindings);
if(cljs.core.truth_(and__5000__auto____$9)){
var and__5000__auto____$10 = sci.impl.types.eval(arg10,ctx__$1,bindings);
if(cljs.core.truth_(and__5000__auto____$10)){
var and__5000__auto____$11 = sci.impl.types.eval(arg11,ctx__$1,bindings);
if(cljs.core.truth_(and__5000__auto____$11)){
var and__5000__auto____$12 = sci.impl.types.eval(arg12,ctx__$1,bindings);
if(cljs.core.truth_(and__5000__auto____$12)){
var and__5000__auto____$13 = sci.impl.types.eval(arg13,ctx__$1,bindings);
if(cljs.core.truth_(and__5000__auto____$13)){
var and__5000__auto____$14 = sci.impl.types.eval(arg14,ctx__$1,bindings);
if(cljs.core.truth_(and__5000__auto____$14)){
return sci.impl.types.eval(arg15,ctx__$1,bindings);
} else {
return and__5000__auto____$14;
}
} else {
return and__5000__auto____$13;
}
} else {
return and__5000__auto____$12;
}
} else {
return and__5000__auto____$11;
}
} else {
return and__5000__auto____$10;
}
} else {
return and__5000__auto____$9;
}
} else {
return and__5000__auto____$8;
}
} else {
return and__5000__auto____$7;
}
} else {
return and__5000__auto____$6;
}
} else {
return and__5000__auto____$5;
}
} else {
return and__5000__auto____$4;
}
} else {
return and__5000__auto____$3;
}
} else {
return and__5000__auto____$2;
}
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
}),null);

break;
case (17):
var arg0 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(0));
var arg1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(1));
var arg2 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(2));
var arg3 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(3));
var arg4 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(4));
var arg5 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(5));
var arg6 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(6));
var arg7 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(7));
var arg8 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(8));
var arg9 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(9));
var arg10 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(10));
var arg11 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(11));
var arg12 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(12));
var arg13 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(13));
var arg14 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(14));
var arg15 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(15));
var arg16 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(16));
return sci.impl.types.__GT_NodeR((function (this$,ctx__$1,bindings){
var and__5000__auto__ = sci.impl.types.eval(arg0,ctx__$1,bindings);
if(cljs.core.truth_(and__5000__auto__)){
var and__5000__auto____$1 = sci.impl.types.eval(arg1,ctx__$1,bindings);
if(cljs.core.truth_(and__5000__auto____$1)){
var and__5000__auto____$2 = sci.impl.types.eval(arg2,ctx__$1,bindings);
if(cljs.core.truth_(and__5000__auto____$2)){
var and__5000__auto____$3 = sci.impl.types.eval(arg3,ctx__$1,bindings);
if(cljs.core.truth_(and__5000__auto____$3)){
var and__5000__auto____$4 = sci.impl.types.eval(arg4,ctx__$1,bindings);
if(cljs.core.truth_(and__5000__auto____$4)){
var and__5000__auto____$5 = sci.impl.types.eval(arg5,ctx__$1,bindings);
if(cljs.core.truth_(and__5000__auto____$5)){
var and__5000__auto____$6 = sci.impl.types.eval(arg6,ctx__$1,bindings);
if(cljs.core.truth_(and__5000__auto____$6)){
var and__5000__auto____$7 = sci.impl.types.eval(arg7,ctx__$1,bindings);
if(cljs.core.truth_(and__5000__auto____$7)){
var and__5000__auto____$8 = sci.impl.types.eval(arg8,ctx__$1,bindings);
if(cljs.core.truth_(and__5000__auto____$8)){
var and__5000__auto____$9 = sci.impl.types.eval(arg9,ctx__$1,bindings);
if(cljs.core.truth_(and__5000__auto____$9)){
var and__5000__auto____$10 = sci.impl.types.eval(arg10,ctx__$1,bindings);
if(cljs.core.truth_(and__5000__auto____$10)){
var and__5000__auto____$11 = sci.impl.types.eval(arg11,ctx__$1,bindings);
if(cljs.core.truth_(and__5000__auto____$11)){
var and__5000__auto____$12 = sci.impl.types.eval(arg12,ctx__$1,bindings);
if(cljs.core.truth_(and__5000__auto____$12)){
var and__5000__auto____$13 = sci.impl.types.eval(arg13,ctx__$1,bindings);
if(cljs.core.truth_(and__5000__auto____$13)){
var and__5000__auto____$14 = sci.impl.types.eval(arg14,ctx__$1,bindings);
if(cljs.core.truth_(and__5000__auto____$14)){
var and__5000__auto____$15 = sci.impl.types.eval(arg15,ctx__$1,bindings);
if(cljs.core.truth_(and__5000__auto____$15)){
return sci.impl.types.eval(arg16,ctx__$1,bindings);
} else {
return and__5000__auto____$15;
}
} else {
return and__5000__auto____$14;
}
} else {
return and__5000__auto____$13;
}
} else {
return and__5000__auto____$12;
}
} else {
return and__5000__auto____$11;
}
} else {
return and__5000__auto____$10;
}
} else {
return and__5000__auto____$9;
}
} else {
return and__5000__auto____$8;
}
} else {
return and__5000__auto____$7;
}
} else {
return and__5000__auto____$6;
}
} else {
return and__5000__auto____$5;
}
} else {
return and__5000__auto____$4;
}
} else {
return and__5000__auto____$3;
}
} else {
return and__5000__auto____$2;
}
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
}),null);

break;
case (18):
var arg0 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(0));
var arg1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(1));
var arg2 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(2));
var arg3 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(3));
var arg4 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(4));
var arg5 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(5));
var arg6 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(6));
var arg7 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(7));
var arg8 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(8));
var arg9 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(9));
var arg10 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(10));
var arg11 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(11));
var arg12 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(12));
var arg13 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(13));
var arg14 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(14));
var arg15 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(15));
var arg16 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(16));
var arg17 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(17));
return sci.impl.types.__GT_NodeR((function (this$,ctx__$1,bindings){
var and__5000__auto__ = sci.impl.types.eval(arg0,ctx__$1,bindings);
if(cljs.core.truth_(and__5000__auto__)){
var and__5000__auto____$1 = sci.impl.types.eval(arg1,ctx__$1,bindings);
if(cljs.core.truth_(and__5000__auto____$1)){
var and__5000__auto____$2 = sci.impl.types.eval(arg2,ctx__$1,bindings);
if(cljs.core.truth_(and__5000__auto____$2)){
var and__5000__auto____$3 = sci.impl.types.eval(arg3,ctx__$1,bindings);
if(cljs.core.truth_(and__5000__auto____$3)){
var and__5000__auto____$4 = sci.impl.types.eval(arg4,ctx__$1,bindings);
if(cljs.core.truth_(and__5000__auto____$4)){
var and__5000__auto____$5 = sci.impl.types.eval(arg5,ctx__$1,bindings);
if(cljs.core.truth_(and__5000__auto____$5)){
var and__5000__auto____$6 = sci.impl.types.eval(arg6,ctx__$1,bindings);
if(cljs.core.truth_(and__5000__auto____$6)){
var and__5000__auto____$7 = sci.impl.types.eval(arg7,ctx__$1,bindings);
if(cljs.core.truth_(and__5000__auto____$7)){
var and__5000__auto____$8 = sci.impl.types.eval(arg8,ctx__$1,bindings);
if(cljs.core.truth_(and__5000__auto____$8)){
var and__5000__auto____$9 = sci.impl.types.eval(arg9,ctx__$1,bindings);
if(cljs.core.truth_(and__5000__auto____$9)){
var and__5000__auto____$10 = sci.impl.types.eval(arg10,ctx__$1,bindings);
if(cljs.core.truth_(and__5000__auto____$10)){
var and__5000__auto____$11 = sci.impl.types.eval(arg11,ctx__$1,bindings);
if(cljs.core.truth_(and__5000__auto____$11)){
var and__5000__auto____$12 = sci.impl.types.eval(arg12,ctx__$1,bindings);
if(cljs.core.truth_(and__5000__auto____$12)){
var and__5000__auto____$13 = sci.impl.types.eval(arg13,ctx__$1,bindings);
if(cljs.core.truth_(and__5000__auto____$13)){
var and__5000__auto____$14 = sci.impl.types.eval(arg14,ctx__$1,bindings);
if(cljs.core.truth_(and__5000__auto____$14)){
var and__5000__auto____$15 = sci.impl.types.eval(arg15,ctx__$1,bindings);
if(cljs.core.truth_(and__5000__auto____$15)){
var and__5000__auto____$16 = sci.impl.types.eval(arg16,ctx__$1,bindings);
if(cljs.core.truth_(and__5000__auto____$16)){
return sci.impl.types.eval(arg17,ctx__$1,bindings);
} else {
return and__5000__auto____$16;
}
} else {
return and__5000__auto____$15;
}
} else {
return and__5000__auto____$14;
}
} else {
return and__5000__auto____$13;
}
} else {
return and__5000__auto____$12;
}
} else {
return and__5000__auto____$11;
}
} else {
return and__5000__auto____$10;
}
} else {
return and__5000__auto____$9;
}
} else {
return and__5000__auto____$8;
}
} else {
return and__5000__auto____$7;
}
} else {
return and__5000__auto____$6;
}
} else {
return and__5000__auto____$5;
}
} else {
return and__5000__auto____$4;
}
} else {
return and__5000__auto____$3;
}
} else {
return and__5000__auto____$2;
}
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
}),null);

break;
case (19):
var arg0 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(0));
var arg1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(1));
var arg2 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(2));
var arg3 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(3));
var arg4 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(4));
var arg5 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(5));
var arg6 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(6));
var arg7 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(7));
var arg8 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(8));
var arg9 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(9));
var arg10 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(10));
var arg11 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(11));
var arg12 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(12));
var arg13 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(13));
var arg14 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(14));
var arg15 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(15));
var arg16 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(16));
var arg17 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(17));
var arg18 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(analyzed_children),(18));
return sci.impl.types.__GT_NodeR((function (this$,ctx__$1,bindings){
var and__5000__auto__ = sci.impl.types.eval(arg0,ctx__$1,bindings);
if(cljs.core.truth_(and__5000__auto__)){
var and__5000__auto____$1 = sci.impl.types.eval(arg1,ctx__$1,bindings);
if(cljs.core.truth_(and__5000__auto____$1)){
var and__5000__auto____$2 = sci.impl.types.eval(arg2,ctx__$1,bindings);
if(cljs.core.truth_(and__5000__auto____$2)){
var and__5000__auto____$3 = sci.impl.types.eval(arg3,ctx__$1,bindings);
if(cljs.core.truth_(and__5000__auto____$3)){
var and__5000__auto____$4 = sci.impl.types.eval(arg4,ctx__$1,bindings);
if(cljs.core.truth_(and__5000__auto____$4)){
var and__5000__auto____$5 = sci.impl.types.eval(arg5,ctx__$1,bindings);
if(cljs.core.truth_(and__5000__auto____$5)){
var and__5000__auto____$6 = sci.impl.types.eval(arg6,ctx__$1,bindings);
if(cljs.core.truth_(and__5000__auto____$6)){
var and__5000__auto____$7 = sci.impl.types.eval(arg7,ctx__$1,bindings);
if(cljs.core.truth_(and__5000__auto____$7)){
var and__5000__auto____$8 = sci.impl.types.eval(arg8,ctx__$1,bindings);
if(cljs.core.truth_(and__5000__auto____$8)){
var and__5000__auto____$9 = sci.impl.types.eval(arg9,ctx__$1,bindings);
if(cljs.core.truth_(and__5000__auto____$9)){
var and__5000__auto____$10 = sci.impl.types.eval(arg10,ctx__$1,bindings);
if(cljs.core.truth_(and__5000__auto____$10)){
var and__5000__auto____$11 = sci.impl.types.eval(arg11,ctx__$1,bindings);
if(cljs.core.truth_(and__5000__auto____$11)){
var and__5000__auto____$12 = sci.impl.types.eval(arg12,ctx__$1,bindings);
if(cljs.core.truth_(and__5000__auto____$12)){
var and__5000__auto____$13 = sci.impl.types.eval(arg13,ctx__$1,bindings);
if(cljs.core.truth_(and__5000__auto____$13)){
var and__5000__auto____$14 = sci.impl.types.eval(arg14,ctx__$1,bindings);
if(cljs.core.truth_(and__5000__auto____$14)){
var and__5000__auto____$15 = sci.impl.types.eval(arg15,ctx__$1,bindings);
if(cljs.core.truth_(and__5000__auto____$15)){
var and__5000__auto____$16 = sci.impl.types.eval(arg16,ctx__$1,bindings);
if(cljs.core.truth_(and__5000__auto____$16)){
var and__5000__auto____$17 = sci.impl.types.eval(arg17,ctx__$1,bindings);
if(cljs.core.truth_(and__5000__auto____$17)){
return sci.impl.types.eval(arg18,ctx__$1,bindings);
} else {
return and__5000__auto____$17;
}
} else {
return and__5000__auto____$16;
}
} else {
return and__5000__auto____$15;
}
} else {
return and__5000__auto____$14;
}
} else {
return and__5000__auto____$13;
}
} else {
return and__5000__auto____$12;
}
} else {
return and__5000__auto____$11;
}
} else {
return and__5000__auto____$10;
}
} else {
return and__5000__auto____$9;
}
} else {
return and__5000__auto____$8;
}
} else {
return and__5000__auto____$7;
}
} else {
return and__5000__auto____$6;
}
} else {
return and__5000__auto____$5;
}
} else {
return and__5000__auto____$4;
}
} else {
return and__5000__auto____$3;
}
} else {
return and__5000__auto____$2;
}
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
}),null);

break;
default:
var analyzed_children__$1 = cljs.core.deref(analyzed_children);
return sci.impl.types.__GT_NodeR((function (this$,ctx__$1,bindings){
return sci.impl.evaluator.eval_and(ctx__$1,bindings,analyzed_children__$1);
}),null);

}
});
sci.impl.analyzer.return_recur = (function sci$impl$analyzer$return_recur(ctx,expr,analyzed_children){
if(cljs.core.truth_(sci.impl.analyzer.recur_target_QMARK_(ctx))){
} else {
sci.impl.analyzer.throw_error_with_location("Can only recur from tail position",expr);
}

var params = new cljs.core.Keyword(null,"params","params",710516235).cljs$core$IFn$_invoke$arity$1(ctx);
var G__91152 = cljs.core.count(analyzed_children);
switch (G__91152) {
case (0):
return sci.impl.types.__GT_NodeR((function (this$,ctx__$1,bindings){
return new cljs.core.Keyword("sci.impl.analyzer","recur","sci.impl.analyzer/recur",2033369355);
}),null);

break;
case (1):
var arg0 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(0));
var param0 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(0));
return sci.impl.types.__GT_NodeR((function (this$,ctx__$1,bindings){
var eval_0 = sci.impl.types.eval(arg0,ctx__$1,bindings);
(bindings[(0)] = eval_0);

return new cljs.core.Keyword("sci.impl.analyzer","recur","sci.impl.analyzer/recur",2033369355);
}),null);

break;
case (2):
var arg0 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(0));
var param0 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(0));
var arg1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(1));
var param1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(1));
return sci.impl.types.__GT_NodeR((function (this$,ctx__$1,bindings){
var eval_0 = sci.impl.types.eval(arg0,ctx__$1,bindings);
var eval_1 = sci.impl.types.eval(arg1,ctx__$1,bindings);
(bindings[(0)] = eval_0);

(bindings[(1)] = eval_1);

return new cljs.core.Keyword("sci.impl.analyzer","recur","sci.impl.analyzer/recur",2033369355);
}),null);

break;
case (3):
var arg0 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(0));
var param0 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(0));
var arg1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(1));
var param1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(1));
var arg2 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(2));
var param2 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(2));
return sci.impl.types.__GT_NodeR((function (this$,ctx__$1,bindings){
var eval_0 = sci.impl.types.eval(arg0,ctx__$1,bindings);
var eval_1 = sci.impl.types.eval(arg1,ctx__$1,bindings);
var eval_2 = sci.impl.types.eval(arg2,ctx__$1,bindings);
(bindings[(0)] = eval_0);

(bindings[(1)] = eval_1);

(bindings[(2)] = eval_2);

return new cljs.core.Keyword("sci.impl.analyzer","recur","sci.impl.analyzer/recur",2033369355);
}),null);

break;
case (4):
var arg0 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(0));
var param0 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(0));
var arg1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(1));
var param1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(1));
var arg2 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(2));
var param2 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(2));
var arg3 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(3));
var param3 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(3));
return sci.impl.types.__GT_NodeR((function (this$,ctx__$1,bindings){
var eval_0 = sci.impl.types.eval(arg0,ctx__$1,bindings);
var eval_1 = sci.impl.types.eval(arg1,ctx__$1,bindings);
var eval_2 = sci.impl.types.eval(arg2,ctx__$1,bindings);
var eval_3 = sci.impl.types.eval(arg3,ctx__$1,bindings);
(bindings[(0)] = eval_0);

(bindings[(1)] = eval_1);

(bindings[(2)] = eval_2);

(bindings[(3)] = eval_3);

return new cljs.core.Keyword("sci.impl.analyzer","recur","sci.impl.analyzer/recur",2033369355);
}),null);

break;
case (5):
var arg0 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(0));
var param0 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(0));
var arg1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(1));
var param1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(1));
var arg2 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(2));
var param2 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(2));
var arg3 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(3));
var param3 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(3));
var arg4 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(4));
var param4 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(4));
return sci.impl.types.__GT_NodeR((function (this$,ctx__$1,bindings){
var eval_0 = sci.impl.types.eval(arg0,ctx__$1,bindings);
var eval_1 = sci.impl.types.eval(arg1,ctx__$1,bindings);
var eval_2 = sci.impl.types.eval(arg2,ctx__$1,bindings);
var eval_3 = sci.impl.types.eval(arg3,ctx__$1,bindings);
var eval_4 = sci.impl.types.eval(arg4,ctx__$1,bindings);
(bindings[(0)] = eval_0);

(bindings[(1)] = eval_1);

(bindings[(2)] = eval_2);

(bindings[(3)] = eval_3);

(bindings[(4)] = eval_4);

return new cljs.core.Keyword("sci.impl.analyzer","recur","sci.impl.analyzer/recur",2033369355);
}),null);

break;
case (6):
var arg0 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(0));
var param0 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(0));
var arg1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(1));
var param1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(1));
var arg2 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(2));
var param2 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(2));
var arg3 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(3));
var param3 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(3));
var arg4 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(4));
var param4 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(4));
var arg5 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(5));
var param5 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(5));
return sci.impl.types.__GT_NodeR((function (this$,ctx__$1,bindings){
var eval_0 = sci.impl.types.eval(arg0,ctx__$1,bindings);
var eval_1 = sci.impl.types.eval(arg1,ctx__$1,bindings);
var eval_2 = sci.impl.types.eval(arg2,ctx__$1,bindings);
var eval_3 = sci.impl.types.eval(arg3,ctx__$1,bindings);
var eval_4 = sci.impl.types.eval(arg4,ctx__$1,bindings);
var eval_5 = sci.impl.types.eval(arg5,ctx__$1,bindings);
(bindings[(0)] = eval_0);

(bindings[(1)] = eval_1);

(bindings[(2)] = eval_2);

(bindings[(3)] = eval_3);

(bindings[(4)] = eval_4);

(bindings[(5)] = eval_5);

return new cljs.core.Keyword("sci.impl.analyzer","recur","sci.impl.analyzer/recur",2033369355);
}),null);

break;
case (7):
var arg0 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(0));
var param0 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(0));
var arg1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(1));
var param1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(1));
var arg2 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(2));
var param2 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(2));
var arg3 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(3));
var param3 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(3));
var arg4 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(4));
var param4 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(4));
var arg5 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(5));
var param5 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(5));
var arg6 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(6));
var param6 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(6));
return sci.impl.types.__GT_NodeR((function (this$,ctx__$1,bindings){
var eval_0 = sci.impl.types.eval(arg0,ctx__$1,bindings);
var eval_1 = sci.impl.types.eval(arg1,ctx__$1,bindings);
var eval_2 = sci.impl.types.eval(arg2,ctx__$1,bindings);
var eval_3 = sci.impl.types.eval(arg3,ctx__$1,bindings);
var eval_4 = sci.impl.types.eval(arg4,ctx__$1,bindings);
var eval_5 = sci.impl.types.eval(arg5,ctx__$1,bindings);
var eval_6 = sci.impl.types.eval(arg6,ctx__$1,bindings);
(bindings[(0)] = eval_0);

(bindings[(1)] = eval_1);

(bindings[(2)] = eval_2);

(bindings[(3)] = eval_3);

(bindings[(4)] = eval_4);

(bindings[(5)] = eval_5);

(bindings[(6)] = eval_6);

return new cljs.core.Keyword("sci.impl.analyzer","recur","sci.impl.analyzer/recur",2033369355);
}),null);

break;
case (8):
var arg0 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(0));
var param0 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(0));
var arg1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(1));
var param1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(1));
var arg2 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(2));
var param2 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(2));
var arg3 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(3));
var param3 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(3));
var arg4 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(4));
var param4 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(4));
var arg5 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(5));
var param5 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(5));
var arg6 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(6));
var param6 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(6));
var arg7 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(7));
var param7 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(7));
return sci.impl.types.__GT_NodeR((function (this$,ctx__$1,bindings){
var eval_0 = sci.impl.types.eval(arg0,ctx__$1,bindings);
var eval_1 = sci.impl.types.eval(arg1,ctx__$1,bindings);
var eval_2 = sci.impl.types.eval(arg2,ctx__$1,bindings);
var eval_3 = sci.impl.types.eval(arg3,ctx__$1,bindings);
var eval_4 = sci.impl.types.eval(arg4,ctx__$1,bindings);
var eval_5 = sci.impl.types.eval(arg5,ctx__$1,bindings);
var eval_6 = sci.impl.types.eval(arg6,ctx__$1,bindings);
var eval_7 = sci.impl.types.eval(arg7,ctx__$1,bindings);
(bindings[(0)] = eval_0);

(bindings[(1)] = eval_1);

(bindings[(2)] = eval_2);

(bindings[(3)] = eval_3);

(bindings[(4)] = eval_4);

(bindings[(5)] = eval_5);

(bindings[(6)] = eval_6);

(bindings[(7)] = eval_7);

return new cljs.core.Keyword("sci.impl.analyzer","recur","sci.impl.analyzer/recur",2033369355);
}),null);

break;
case (9):
var arg0 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(0));
var param0 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(0));
var arg1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(1));
var param1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(1));
var arg2 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(2));
var param2 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(2));
var arg3 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(3));
var param3 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(3));
var arg4 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(4));
var param4 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(4));
var arg5 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(5));
var param5 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(5));
var arg6 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(6));
var param6 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(6));
var arg7 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(7));
var param7 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(7));
var arg8 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(8));
var param8 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(8));
return sci.impl.types.__GT_NodeR((function (this$,ctx__$1,bindings){
var eval_0 = sci.impl.types.eval(arg0,ctx__$1,bindings);
var eval_1 = sci.impl.types.eval(arg1,ctx__$1,bindings);
var eval_2 = sci.impl.types.eval(arg2,ctx__$1,bindings);
var eval_3 = sci.impl.types.eval(arg3,ctx__$1,bindings);
var eval_4 = sci.impl.types.eval(arg4,ctx__$1,bindings);
var eval_5 = sci.impl.types.eval(arg5,ctx__$1,bindings);
var eval_6 = sci.impl.types.eval(arg6,ctx__$1,bindings);
var eval_7 = sci.impl.types.eval(arg7,ctx__$1,bindings);
var eval_8 = sci.impl.types.eval(arg8,ctx__$1,bindings);
(bindings[(0)] = eval_0);

(bindings[(1)] = eval_1);

(bindings[(2)] = eval_2);

(bindings[(3)] = eval_3);

(bindings[(4)] = eval_4);

(bindings[(5)] = eval_5);

(bindings[(6)] = eval_6);

(bindings[(7)] = eval_7);

(bindings[(8)] = eval_8);

return new cljs.core.Keyword("sci.impl.analyzer","recur","sci.impl.analyzer/recur",2033369355);
}),null);

break;
case (10):
var arg0 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(0));
var param0 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(0));
var arg1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(1));
var param1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(1));
var arg2 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(2));
var param2 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(2));
var arg3 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(3));
var param3 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(3));
var arg4 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(4));
var param4 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(4));
var arg5 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(5));
var param5 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(5));
var arg6 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(6));
var param6 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(6));
var arg7 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(7));
var param7 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(7));
var arg8 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(8));
var param8 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(8));
var arg9 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(9));
var param9 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(9));
return sci.impl.types.__GT_NodeR((function (this$,ctx__$1,bindings){
var eval_0 = sci.impl.types.eval(arg0,ctx__$1,bindings);
var eval_1 = sci.impl.types.eval(arg1,ctx__$1,bindings);
var eval_2 = sci.impl.types.eval(arg2,ctx__$1,bindings);
var eval_3 = sci.impl.types.eval(arg3,ctx__$1,bindings);
var eval_4 = sci.impl.types.eval(arg4,ctx__$1,bindings);
var eval_5 = sci.impl.types.eval(arg5,ctx__$1,bindings);
var eval_6 = sci.impl.types.eval(arg6,ctx__$1,bindings);
var eval_7 = sci.impl.types.eval(arg7,ctx__$1,bindings);
var eval_8 = sci.impl.types.eval(arg8,ctx__$1,bindings);
var eval_9 = sci.impl.types.eval(arg9,ctx__$1,bindings);
(bindings[(0)] = eval_0);

(bindings[(1)] = eval_1);

(bindings[(2)] = eval_2);

(bindings[(3)] = eval_3);

(bindings[(4)] = eval_4);

(bindings[(5)] = eval_5);

(bindings[(6)] = eval_6);

(bindings[(7)] = eval_7);

(bindings[(8)] = eval_8);

(bindings[(9)] = eval_9);

return new cljs.core.Keyword("sci.impl.analyzer","recur","sci.impl.analyzer/recur",2033369355);
}),null);

break;
case (11):
var arg0 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(0));
var param0 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(0));
var arg1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(1));
var param1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(1));
var arg2 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(2));
var param2 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(2));
var arg3 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(3));
var param3 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(3));
var arg4 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(4));
var param4 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(4));
var arg5 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(5));
var param5 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(5));
var arg6 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(6));
var param6 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(6));
var arg7 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(7));
var param7 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(7));
var arg8 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(8));
var param8 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(8));
var arg9 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(9));
var param9 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(9));
var arg10 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(10));
var param10 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(10));
return sci.impl.types.__GT_NodeR((function (this$,ctx__$1,bindings){
var eval_0 = sci.impl.types.eval(arg0,ctx__$1,bindings);
var eval_1 = sci.impl.types.eval(arg1,ctx__$1,bindings);
var eval_2 = sci.impl.types.eval(arg2,ctx__$1,bindings);
var eval_3 = sci.impl.types.eval(arg3,ctx__$1,bindings);
var eval_4 = sci.impl.types.eval(arg4,ctx__$1,bindings);
var eval_5 = sci.impl.types.eval(arg5,ctx__$1,bindings);
var eval_6 = sci.impl.types.eval(arg6,ctx__$1,bindings);
var eval_7 = sci.impl.types.eval(arg7,ctx__$1,bindings);
var eval_8 = sci.impl.types.eval(arg8,ctx__$1,bindings);
var eval_9 = sci.impl.types.eval(arg9,ctx__$1,bindings);
var eval_10 = sci.impl.types.eval(arg10,ctx__$1,bindings);
(bindings[(0)] = eval_0);

(bindings[(1)] = eval_1);

(bindings[(2)] = eval_2);

(bindings[(3)] = eval_3);

(bindings[(4)] = eval_4);

(bindings[(5)] = eval_5);

(bindings[(6)] = eval_6);

(bindings[(7)] = eval_7);

(bindings[(8)] = eval_8);

(bindings[(9)] = eval_9);

(bindings[(10)] = eval_10);

return new cljs.core.Keyword("sci.impl.analyzer","recur","sci.impl.analyzer/recur",2033369355);
}),null);

break;
case (12):
var arg0 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(0));
var param0 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(0));
var arg1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(1));
var param1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(1));
var arg2 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(2));
var param2 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(2));
var arg3 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(3));
var param3 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(3));
var arg4 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(4));
var param4 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(4));
var arg5 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(5));
var param5 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(5));
var arg6 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(6));
var param6 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(6));
var arg7 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(7));
var param7 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(7));
var arg8 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(8));
var param8 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(8));
var arg9 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(9));
var param9 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(9));
var arg10 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(10));
var param10 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(10));
var arg11 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(11));
var param11 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(11));
return sci.impl.types.__GT_NodeR((function (this$,ctx__$1,bindings){
var eval_0 = sci.impl.types.eval(arg0,ctx__$1,bindings);
var eval_1 = sci.impl.types.eval(arg1,ctx__$1,bindings);
var eval_2 = sci.impl.types.eval(arg2,ctx__$1,bindings);
var eval_3 = sci.impl.types.eval(arg3,ctx__$1,bindings);
var eval_4 = sci.impl.types.eval(arg4,ctx__$1,bindings);
var eval_5 = sci.impl.types.eval(arg5,ctx__$1,bindings);
var eval_6 = sci.impl.types.eval(arg6,ctx__$1,bindings);
var eval_7 = sci.impl.types.eval(arg7,ctx__$1,bindings);
var eval_8 = sci.impl.types.eval(arg8,ctx__$1,bindings);
var eval_9 = sci.impl.types.eval(arg9,ctx__$1,bindings);
var eval_10 = sci.impl.types.eval(arg10,ctx__$1,bindings);
var eval_11 = sci.impl.types.eval(arg11,ctx__$1,bindings);
(bindings[(0)] = eval_0);

(bindings[(1)] = eval_1);

(bindings[(2)] = eval_2);

(bindings[(3)] = eval_3);

(bindings[(4)] = eval_4);

(bindings[(5)] = eval_5);

(bindings[(6)] = eval_6);

(bindings[(7)] = eval_7);

(bindings[(8)] = eval_8);

(bindings[(9)] = eval_9);

(bindings[(10)] = eval_10);

(bindings[(11)] = eval_11);

return new cljs.core.Keyword("sci.impl.analyzer","recur","sci.impl.analyzer/recur",2033369355);
}),null);

break;
case (13):
var arg0 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(0));
var param0 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(0));
var arg1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(1));
var param1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(1));
var arg2 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(2));
var param2 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(2));
var arg3 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(3));
var param3 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(3));
var arg4 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(4));
var param4 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(4));
var arg5 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(5));
var param5 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(5));
var arg6 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(6));
var param6 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(6));
var arg7 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(7));
var param7 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(7));
var arg8 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(8));
var param8 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(8));
var arg9 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(9));
var param9 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(9));
var arg10 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(10));
var param10 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(10));
var arg11 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(11));
var param11 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(11));
var arg12 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(12));
var param12 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(12));
return sci.impl.types.__GT_NodeR((function (this$,ctx__$1,bindings){
var eval_0 = sci.impl.types.eval(arg0,ctx__$1,bindings);
var eval_1 = sci.impl.types.eval(arg1,ctx__$1,bindings);
var eval_2 = sci.impl.types.eval(arg2,ctx__$1,bindings);
var eval_3 = sci.impl.types.eval(arg3,ctx__$1,bindings);
var eval_4 = sci.impl.types.eval(arg4,ctx__$1,bindings);
var eval_5 = sci.impl.types.eval(arg5,ctx__$1,bindings);
var eval_6 = sci.impl.types.eval(arg6,ctx__$1,bindings);
var eval_7 = sci.impl.types.eval(arg7,ctx__$1,bindings);
var eval_8 = sci.impl.types.eval(arg8,ctx__$1,bindings);
var eval_9 = sci.impl.types.eval(arg9,ctx__$1,bindings);
var eval_10 = sci.impl.types.eval(arg10,ctx__$1,bindings);
var eval_11 = sci.impl.types.eval(arg11,ctx__$1,bindings);
var eval_12 = sci.impl.types.eval(arg12,ctx__$1,bindings);
(bindings[(0)] = eval_0);

(bindings[(1)] = eval_1);

(bindings[(2)] = eval_2);

(bindings[(3)] = eval_3);

(bindings[(4)] = eval_4);

(bindings[(5)] = eval_5);

(bindings[(6)] = eval_6);

(bindings[(7)] = eval_7);

(bindings[(8)] = eval_8);

(bindings[(9)] = eval_9);

(bindings[(10)] = eval_10);

(bindings[(11)] = eval_11);

(bindings[(12)] = eval_12);

return new cljs.core.Keyword("sci.impl.analyzer","recur","sci.impl.analyzer/recur",2033369355);
}),null);

break;
case (14):
var arg0 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(0));
var param0 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(0));
var arg1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(1));
var param1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(1));
var arg2 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(2));
var param2 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(2));
var arg3 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(3));
var param3 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(3));
var arg4 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(4));
var param4 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(4));
var arg5 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(5));
var param5 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(5));
var arg6 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(6));
var param6 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(6));
var arg7 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(7));
var param7 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(7));
var arg8 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(8));
var param8 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(8));
var arg9 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(9));
var param9 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(9));
var arg10 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(10));
var param10 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(10));
var arg11 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(11));
var param11 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(11));
var arg12 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(12));
var param12 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(12));
var arg13 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(13));
var param13 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(13));
return sci.impl.types.__GT_NodeR((function (this$,ctx__$1,bindings){
var eval_0 = sci.impl.types.eval(arg0,ctx__$1,bindings);
var eval_1 = sci.impl.types.eval(arg1,ctx__$1,bindings);
var eval_2 = sci.impl.types.eval(arg2,ctx__$1,bindings);
var eval_3 = sci.impl.types.eval(arg3,ctx__$1,bindings);
var eval_4 = sci.impl.types.eval(arg4,ctx__$1,bindings);
var eval_5 = sci.impl.types.eval(arg5,ctx__$1,bindings);
var eval_6 = sci.impl.types.eval(arg6,ctx__$1,bindings);
var eval_7 = sci.impl.types.eval(arg7,ctx__$1,bindings);
var eval_8 = sci.impl.types.eval(arg8,ctx__$1,bindings);
var eval_9 = sci.impl.types.eval(arg9,ctx__$1,bindings);
var eval_10 = sci.impl.types.eval(arg10,ctx__$1,bindings);
var eval_11 = sci.impl.types.eval(arg11,ctx__$1,bindings);
var eval_12 = sci.impl.types.eval(arg12,ctx__$1,bindings);
var eval_13 = sci.impl.types.eval(arg13,ctx__$1,bindings);
(bindings[(0)] = eval_0);

(bindings[(1)] = eval_1);

(bindings[(2)] = eval_2);

(bindings[(3)] = eval_3);

(bindings[(4)] = eval_4);

(bindings[(5)] = eval_5);

(bindings[(6)] = eval_6);

(bindings[(7)] = eval_7);

(bindings[(8)] = eval_8);

(bindings[(9)] = eval_9);

(bindings[(10)] = eval_10);

(bindings[(11)] = eval_11);

(bindings[(12)] = eval_12);

(bindings[(13)] = eval_13);

return new cljs.core.Keyword("sci.impl.analyzer","recur","sci.impl.analyzer/recur",2033369355);
}),null);

break;
case (15):
var arg0 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(0));
var param0 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(0));
var arg1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(1));
var param1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(1));
var arg2 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(2));
var param2 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(2));
var arg3 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(3));
var param3 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(3));
var arg4 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(4));
var param4 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(4));
var arg5 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(5));
var param5 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(5));
var arg6 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(6));
var param6 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(6));
var arg7 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(7));
var param7 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(7));
var arg8 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(8));
var param8 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(8));
var arg9 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(9));
var param9 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(9));
var arg10 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(10));
var param10 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(10));
var arg11 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(11));
var param11 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(11));
var arg12 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(12));
var param12 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(12));
var arg13 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(13));
var param13 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(13));
var arg14 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(14));
var param14 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(14));
return sci.impl.types.__GT_NodeR((function (this$,ctx__$1,bindings){
var eval_0 = sci.impl.types.eval(arg0,ctx__$1,bindings);
var eval_1 = sci.impl.types.eval(arg1,ctx__$1,bindings);
var eval_2 = sci.impl.types.eval(arg2,ctx__$1,bindings);
var eval_3 = sci.impl.types.eval(arg3,ctx__$1,bindings);
var eval_4 = sci.impl.types.eval(arg4,ctx__$1,bindings);
var eval_5 = sci.impl.types.eval(arg5,ctx__$1,bindings);
var eval_6 = sci.impl.types.eval(arg6,ctx__$1,bindings);
var eval_7 = sci.impl.types.eval(arg7,ctx__$1,bindings);
var eval_8 = sci.impl.types.eval(arg8,ctx__$1,bindings);
var eval_9 = sci.impl.types.eval(arg9,ctx__$1,bindings);
var eval_10 = sci.impl.types.eval(arg10,ctx__$1,bindings);
var eval_11 = sci.impl.types.eval(arg11,ctx__$1,bindings);
var eval_12 = sci.impl.types.eval(arg12,ctx__$1,bindings);
var eval_13 = sci.impl.types.eval(arg13,ctx__$1,bindings);
var eval_14 = sci.impl.types.eval(arg14,ctx__$1,bindings);
(bindings[(0)] = eval_0);

(bindings[(1)] = eval_1);

(bindings[(2)] = eval_2);

(bindings[(3)] = eval_3);

(bindings[(4)] = eval_4);

(bindings[(5)] = eval_5);

(bindings[(6)] = eval_6);

(bindings[(7)] = eval_7);

(bindings[(8)] = eval_8);

(bindings[(9)] = eval_9);

(bindings[(10)] = eval_10);

(bindings[(11)] = eval_11);

(bindings[(12)] = eval_12);

(bindings[(13)] = eval_13);

(bindings[(14)] = eval_14);

return new cljs.core.Keyword("sci.impl.analyzer","recur","sci.impl.analyzer/recur",2033369355);
}),null);

break;
case (16):
var arg0 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(0));
var param0 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(0));
var arg1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(1));
var param1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(1));
var arg2 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(2));
var param2 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(2));
var arg3 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(3));
var param3 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(3));
var arg4 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(4));
var param4 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(4));
var arg5 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(5));
var param5 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(5));
var arg6 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(6));
var param6 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(6));
var arg7 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(7));
var param7 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(7));
var arg8 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(8));
var param8 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(8));
var arg9 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(9));
var param9 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(9));
var arg10 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(10));
var param10 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(10));
var arg11 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(11));
var param11 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(11));
var arg12 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(12));
var param12 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(12));
var arg13 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(13));
var param13 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(13));
var arg14 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(14));
var param14 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(14));
var arg15 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(15));
var param15 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(15));
return sci.impl.types.__GT_NodeR((function (this$,ctx__$1,bindings){
var eval_0 = sci.impl.types.eval(arg0,ctx__$1,bindings);
var eval_1 = sci.impl.types.eval(arg1,ctx__$1,bindings);
var eval_2 = sci.impl.types.eval(arg2,ctx__$1,bindings);
var eval_3 = sci.impl.types.eval(arg3,ctx__$1,bindings);
var eval_4 = sci.impl.types.eval(arg4,ctx__$1,bindings);
var eval_5 = sci.impl.types.eval(arg5,ctx__$1,bindings);
var eval_6 = sci.impl.types.eval(arg6,ctx__$1,bindings);
var eval_7 = sci.impl.types.eval(arg7,ctx__$1,bindings);
var eval_8 = sci.impl.types.eval(arg8,ctx__$1,bindings);
var eval_9 = sci.impl.types.eval(arg9,ctx__$1,bindings);
var eval_10 = sci.impl.types.eval(arg10,ctx__$1,bindings);
var eval_11 = sci.impl.types.eval(arg11,ctx__$1,bindings);
var eval_12 = sci.impl.types.eval(arg12,ctx__$1,bindings);
var eval_13 = sci.impl.types.eval(arg13,ctx__$1,bindings);
var eval_14 = sci.impl.types.eval(arg14,ctx__$1,bindings);
var eval_15 = sci.impl.types.eval(arg15,ctx__$1,bindings);
(bindings[(0)] = eval_0);

(bindings[(1)] = eval_1);

(bindings[(2)] = eval_2);

(bindings[(3)] = eval_3);

(bindings[(4)] = eval_4);

(bindings[(5)] = eval_5);

(bindings[(6)] = eval_6);

(bindings[(7)] = eval_7);

(bindings[(8)] = eval_8);

(bindings[(9)] = eval_9);

(bindings[(10)] = eval_10);

(bindings[(11)] = eval_11);

(bindings[(12)] = eval_12);

(bindings[(13)] = eval_13);

(bindings[(14)] = eval_14);

(bindings[(15)] = eval_15);

return new cljs.core.Keyword("sci.impl.analyzer","recur","sci.impl.analyzer/recur",2033369355);
}),null);

break;
case (17):
var arg0 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(0));
var param0 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(0));
var arg1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(1));
var param1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(1));
var arg2 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(2));
var param2 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(2));
var arg3 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(3));
var param3 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(3));
var arg4 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(4));
var param4 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(4));
var arg5 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(5));
var param5 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(5));
var arg6 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(6));
var param6 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(6));
var arg7 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(7));
var param7 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(7));
var arg8 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(8));
var param8 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(8));
var arg9 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(9));
var param9 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(9));
var arg10 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(10));
var param10 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(10));
var arg11 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(11));
var param11 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(11));
var arg12 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(12));
var param12 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(12));
var arg13 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(13));
var param13 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(13));
var arg14 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(14));
var param14 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(14));
var arg15 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(15));
var param15 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(15));
var arg16 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(16));
var param16 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(16));
return sci.impl.types.__GT_NodeR((function (this$,ctx__$1,bindings){
var eval_0 = sci.impl.types.eval(arg0,ctx__$1,bindings);
var eval_1 = sci.impl.types.eval(arg1,ctx__$1,bindings);
var eval_2 = sci.impl.types.eval(arg2,ctx__$1,bindings);
var eval_3 = sci.impl.types.eval(arg3,ctx__$1,bindings);
var eval_4 = sci.impl.types.eval(arg4,ctx__$1,bindings);
var eval_5 = sci.impl.types.eval(arg5,ctx__$1,bindings);
var eval_6 = sci.impl.types.eval(arg6,ctx__$1,bindings);
var eval_7 = sci.impl.types.eval(arg7,ctx__$1,bindings);
var eval_8 = sci.impl.types.eval(arg8,ctx__$1,bindings);
var eval_9 = sci.impl.types.eval(arg9,ctx__$1,bindings);
var eval_10 = sci.impl.types.eval(arg10,ctx__$1,bindings);
var eval_11 = sci.impl.types.eval(arg11,ctx__$1,bindings);
var eval_12 = sci.impl.types.eval(arg12,ctx__$1,bindings);
var eval_13 = sci.impl.types.eval(arg13,ctx__$1,bindings);
var eval_14 = sci.impl.types.eval(arg14,ctx__$1,bindings);
var eval_15 = sci.impl.types.eval(arg15,ctx__$1,bindings);
var eval_16 = sci.impl.types.eval(arg16,ctx__$1,bindings);
(bindings[(0)] = eval_0);

(bindings[(1)] = eval_1);

(bindings[(2)] = eval_2);

(bindings[(3)] = eval_3);

(bindings[(4)] = eval_4);

(bindings[(5)] = eval_5);

(bindings[(6)] = eval_6);

(bindings[(7)] = eval_7);

(bindings[(8)] = eval_8);

(bindings[(9)] = eval_9);

(bindings[(10)] = eval_10);

(bindings[(11)] = eval_11);

(bindings[(12)] = eval_12);

(bindings[(13)] = eval_13);

(bindings[(14)] = eval_14);

(bindings[(15)] = eval_15);

(bindings[(16)] = eval_16);

return new cljs.core.Keyword("sci.impl.analyzer","recur","sci.impl.analyzer/recur",2033369355);
}),null);

break;
case (18):
var arg0 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(0));
var param0 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(0));
var arg1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(1));
var param1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(1));
var arg2 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(2));
var param2 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(2));
var arg3 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(3));
var param3 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(3));
var arg4 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(4));
var param4 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(4));
var arg5 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(5));
var param5 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(5));
var arg6 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(6));
var param6 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(6));
var arg7 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(7));
var param7 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(7));
var arg8 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(8));
var param8 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(8));
var arg9 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(9));
var param9 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(9));
var arg10 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(10));
var param10 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(10));
var arg11 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(11));
var param11 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(11));
var arg12 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(12));
var param12 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(12));
var arg13 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(13));
var param13 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(13));
var arg14 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(14));
var param14 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(14));
var arg15 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(15));
var param15 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(15));
var arg16 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(16));
var param16 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(16));
var arg17 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(17));
var param17 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(17));
return sci.impl.types.__GT_NodeR((function (this$,ctx__$1,bindings){
var eval_0 = sci.impl.types.eval(arg0,ctx__$1,bindings);
var eval_1 = sci.impl.types.eval(arg1,ctx__$1,bindings);
var eval_2 = sci.impl.types.eval(arg2,ctx__$1,bindings);
var eval_3 = sci.impl.types.eval(arg3,ctx__$1,bindings);
var eval_4 = sci.impl.types.eval(arg4,ctx__$1,bindings);
var eval_5 = sci.impl.types.eval(arg5,ctx__$1,bindings);
var eval_6 = sci.impl.types.eval(arg6,ctx__$1,bindings);
var eval_7 = sci.impl.types.eval(arg7,ctx__$1,bindings);
var eval_8 = sci.impl.types.eval(arg8,ctx__$1,bindings);
var eval_9 = sci.impl.types.eval(arg9,ctx__$1,bindings);
var eval_10 = sci.impl.types.eval(arg10,ctx__$1,bindings);
var eval_11 = sci.impl.types.eval(arg11,ctx__$1,bindings);
var eval_12 = sci.impl.types.eval(arg12,ctx__$1,bindings);
var eval_13 = sci.impl.types.eval(arg13,ctx__$1,bindings);
var eval_14 = sci.impl.types.eval(arg14,ctx__$1,bindings);
var eval_15 = sci.impl.types.eval(arg15,ctx__$1,bindings);
var eval_16 = sci.impl.types.eval(arg16,ctx__$1,bindings);
var eval_17 = sci.impl.types.eval(arg17,ctx__$1,bindings);
(bindings[(0)] = eval_0);

(bindings[(1)] = eval_1);

(bindings[(2)] = eval_2);

(bindings[(3)] = eval_3);

(bindings[(4)] = eval_4);

(bindings[(5)] = eval_5);

(bindings[(6)] = eval_6);

(bindings[(7)] = eval_7);

(bindings[(8)] = eval_8);

(bindings[(9)] = eval_9);

(bindings[(10)] = eval_10);

(bindings[(11)] = eval_11);

(bindings[(12)] = eval_12);

(bindings[(13)] = eval_13);

(bindings[(14)] = eval_14);

(bindings[(15)] = eval_15);

(bindings[(16)] = eval_16);

(bindings[(17)] = eval_17);

return new cljs.core.Keyword("sci.impl.analyzer","recur","sci.impl.analyzer/recur",2033369355);
}),null);

break;
case (19):
var arg0 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(0));
var param0 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(0));
var arg1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(1));
var param1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(1));
var arg2 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(2));
var param2 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(2));
var arg3 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(3));
var param3 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(3));
var arg4 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(4));
var param4 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(4));
var arg5 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(5));
var param5 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(5));
var arg6 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(6));
var param6 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(6));
var arg7 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(7));
var param7 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(7));
var arg8 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(8));
var param8 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(8));
var arg9 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(9));
var param9 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(9));
var arg10 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(10));
var param10 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(10));
var arg11 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(11));
var param11 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(11));
var arg12 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(12));
var param12 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(12));
var arg13 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(13));
var param13 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(13));
var arg14 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(14));
var param14 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(14));
var arg15 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(15));
var param15 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(15));
var arg16 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(16));
var param16 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(16));
var arg17 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(17));
var param17 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(17));
var arg18 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(18));
var param18 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(params,(18));
return sci.impl.types.__GT_NodeR((function (this$,ctx__$1,bindings){
var eval_0 = sci.impl.types.eval(arg0,ctx__$1,bindings);
var eval_1 = sci.impl.types.eval(arg1,ctx__$1,bindings);
var eval_2 = sci.impl.types.eval(arg2,ctx__$1,bindings);
var eval_3 = sci.impl.types.eval(arg3,ctx__$1,bindings);
var eval_4 = sci.impl.types.eval(arg4,ctx__$1,bindings);
var eval_5 = sci.impl.types.eval(arg5,ctx__$1,bindings);
var eval_6 = sci.impl.types.eval(arg6,ctx__$1,bindings);
var eval_7 = sci.impl.types.eval(arg7,ctx__$1,bindings);
var eval_8 = sci.impl.types.eval(arg8,ctx__$1,bindings);
var eval_9 = sci.impl.types.eval(arg9,ctx__$1,bindings);
var eval_10 = sci.impl.types.eval(arg10,ctx__$1,bindings);
var eval_11 = sci.impl.types.eval(arg11,ctx__$1,bindings);
var eval_12 = sci.impl.types.eval(arg12,ctx__$1,bindings);
var eval_13 = sci.impl.types.eval(arg13,ctx__$1,bindings);
var eval_14 = sci.impl.types.eval(arg14,ctx__$1,bindings);
var eval_15 = sci.impl.types.eval(arg15,ctx__$1,bindings);
var eval_16 = sci.impl.types.eval(arg16,ctx__$1,bindings);
var eval_17 = sci.impl.types.eval(arg17,ctx__$1,bindings);
var eval_18 = sci.impl.types.eval(arg18,ctx__$1,bindings);
(bindings[(0)] = eval_0);

(bindings[(1)] = eval_1);

(bindings[(2)] = eval_2);

(bindings[(3)] = eval_3);

(bindings[(4)] = eval_4);

(bindings[(5)] = eval_5);

(bindings[(6)] = eval_6);

(bindings[(7)] = eval_7);

(bindings[(8)] = eval_8);

(bindings[(9)] = eval_9);

(bindings[(10)] = eval_10);

(bindings[(11)] = eval_11);

(bindings[(12)] = eval_12);

(bindings[(13)] = eval_13);

(bindings[(14)] = eval_14);

(bindings[(15)] = eval_15);

(bindings[(16)] = eval_16);

(bindings[(17)] = eval_17);

(bindings[(18)] = eval_18);

return new cljs.core.Keyword("sci.impl.analyzer","recur","sci.impl.analyzer/recur",2033369355);
}),null);

break;
default:
throw (new Error(["No matching clause: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(G__91152)].join('')));

}
});
sci.impl.analyzer.analyze_children = (function sci$impl$analyzer$analyze_children(ctx,children){
return cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (p1__91204_SHARP_){
return (sci.impl.analyzer.analyze.cljs$core$IFn$_invoke$arity$2 ? sci.impl.analyzer.analyze.cljs$core$IFn$_invoke$arity$2(ctx,p1__91204_SHARP_) : sci.impl.analyzer.analyze.call(null,ctx,p1__91204_SHARP_));
}),children);
});

/**
* @constructor
 * @implements {cljs.core.IRecord}
 * @implements {cljs.core.IKVReduce}
 * @implements {cljs.core.IEquiv}
 * @implements {cljs.core.IHash}
 * @implements {cljs.core.ICollection}
 * @implements {cljs.core.ICounted}
 * @implements {cljs.core.ISeqable}
 * @implements {cljs.core.IMeta}
 * @implements {cljs.core.ICloneable}
 * @implements {cljs.core.IPrintWithWriter}
 * @implements {cljs.core.IIterable}
 * @implements {cljs.core.IWithMeta}
 * @implements {cljs.core.IAssociative}
 * @implements {cljs.core.IMap}
 * @implements {cljs.core.ILookup}
*/
sci.impl.analyzer.FnBody = (function (params,body,fixed_arity,var_arg_name,self_ref_idx,iden__GT_invoke_idx,__meta,__extmap,__hash){
this.params = params;
this.body = body;
this.fixed_arity = fixed_arity;
this.var_arg_name = var_arg_name;
this.self_ref_idx = self_ref_idx;
this.iden__GT_invoke_idx = iden__GT_invoke_idx;
this.__meta = __meta;
this.__extmap = __extmap;
this.__hash = __hash;
this.cljs$lang$protocol_mask$partition0$ = 2230716170;
this.cljs$lang$protocol_mask$partition1$ = 139264;
});
(sci.impl.analyzer.FnBody.prototype.cljs$core$ILookup$_lookup$arity$2 = (function (this__5300__auto__,k__5301__auto__){
var self__ = this;
var this__5300__auto____$1 = this;
return this__5300__auto____$1.cljs$core$ILookup$_lookup$arity$3(null,k__5301__auto__,null);
}));

(sci.impl.analyzer.FnBody.prototype.cljs$core$ILookup$_lookup$arity$3 = (function (this__5302__auto__,k91208,else__5303__auto__){
var self__ = this;
var this__5302__auto____$1 = this;
var G__91216 = k91208;
var G__91216__$1 = (((G__91216 instanceof cljs.core.Keyword))?G__91216.fqn:null);
switch (G__91216__$1) {
case "params":
return self__.params;

break;
case "body":
return self__.body;

break;
case "fixed-arity":
return self__.fixed_arity;

break;
case "var-arg-name":
return self__.var_arg_name;

break;
case "self-ref-idx":
return self__.self_ref_idx;

break;
case "iden->invoke-idx":
return self__.iden__GT_invoke_idx;

break;
default:
return cljs.core.get.cljs$core$IFn$_invoke$arity$3(self__.__extmap,k91208,else__5303__auto__);

}
}));

(sci.impl.analyzer.FnBody.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = (function (this__5320__auto__,f__5321__auto__,init__5322__auto__){
var self__ = this;
var this__5320__auto____$1 = this;
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (ret__5323__auto__,p__91219){
var vec__91220 = p__91219;
var k__5324__auto__ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__91220,(0),null);
var v__5325__auto__ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__91220,(1),null);
return (f__5321__auto__.cljs$core$IFn$_invoke$arity$3 ? f__5321__auto__.cljs$core$IFn$_invoke$arity$3(ret__5323__auto__,k__5324__auto__,v__5325__auto__) : f__5321__auto__.call(null,ret__5323__auto__,k__5324__auto__,v__5325__auto__));
}),init__5322__auto__,this__5320__auto____$1);
}));

(sci.impl.analyzer.FnBody.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = (function (this__5315__auto__,writer__5316__auto__,opts__5317__auto__){
var self__ = this;
var this__5315__auto____$1 = this;
var pr_pair__5318__auto__ = (function (keyval__5319__auto__){
return cljs.core.pr_sequential_writer(writer__5316__auto__,cljs.core.pr_writer,""," ","",opts__5317__auto__,keyval__5319__auto__);
});
return cljs.core.pr_sequential_writer(writer__5316__auto__,pr_pair__5318__auto__,"#sci.impl.analyzer.FnBody{",", ","}",opts__5317__auto__,cljs.core.concat.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 6, 5, cljs.core.PersistentVector.EMPTY_NODE, [(new cljs.core.PersistentVector(null,2,(5),cljs.core.PersistentVector.EMPTY_NODE,[new cljs.core.Keyword(null,"params","params",710516235),self__.params],null)),(new cljs.core.PersistentVector(null,2,(5),cljs.core.PersistentVector.EMPTY_NODE,[new cljs.core.Keyword(null,"body","body",-2049205669),self__.body],null)),(new cljs.core.PersistentVector(null,2,(5),cljs.core.PersistentVector.EMPTY_NODE,[new cljs.core.Keyword(null,"fixed-arity","fixed-arity",1586445869),self__.fixed_arity],null)),(new cljs.core.PersistentVector(null,2,(5),cljs.core.PersistentVector.EMPTY_NODE,[new cljs.core.Keyword(null,"var-arg-name","var-arg-name",-1100024887),self__.var_arg_name],null)),(new cljs.core.PersistentVector(null,2,(5),cljs.core.PersistentVector.EMPTY_NODE,[new cljs.core.Keyword(null,"self-ref-idx","self-ref-idx",-1384537812),self__.self_ref_idx],null)),(new cljs.core.PersistentVector(null,2,(5),cljs.core.PersistentVector.EMPTY_NODE,[new cljs.core.Keyword(null,"iden->invoke-idx","iden->invoke-idx",-1797627026),self__.iden__GT_invoke_idx],null))], null),self__.__extmap));
}));

(sci.impl.analyzer.FnBody.prototype.cljs$core$IIterable$_iterator$arity$1 = (function (G__91207){
var self__ = this;
var G__91207__$1 = this;
return (new cljs.core.RecordIter((0),G__91207__$1,6,new cljs.core.PersistentVector(null, 6, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"params","params",710516235),new cljs.core.Keyword(null,"body","body",-2049205669),new cljs.core.Keyword(null,"fixed-arity","fixed-arity",1586445869),new cljs.core.Keyword(null,"var-arg-name","var-arg-name",-1100024887),new cljs.core.Keyword(null,"self-ref-idx","self-ref-idx",-1384537812),new cljs.core.Keyword(null,"iden->invoke-idx","iden->invoke-idx",-1797627026)], null),(cljs.core.truth_(self__.__extmap)?cljs.core._iterator(self__.__extmap):cljs.core.nil_iter())));
}));

(sci.impl.analyzer.FnBody.prototype.cljs$core$IMeta$_meta$arity$1 = (function (this__5298__auto__){
var self__ = this;
var this__5298__auto____$1 = this;
return self__.__meta;
}));

(sci.impl.analyzer.FnBody.prototype.cljs$core$ICloneable$_clone$arity$1 = (function (this__5295__auto__){
var self__ = this;
var this__5295__auto____$1 = this;
return (new sci.impl.analyzer.FnBody(self__.params,self__.body,self__.fixed_arity,self__.var_arg_name,self__.self_ref_idx,self__.iden__GT_invoke_idx,self__.__meta,self__.__extmap,self__.__hash));
}));

(sci.impl.analyzer.FnBody.prototype.cljs$core$ICounted$_count$arity$1 = (function (this__5304__auto__){
var self__ = this;
var this__5304__auto____$1 = this;
return (6 + cljs.core.count(self__.__extmap));
}));

(sci.impl.analyzer.FnBody.prototype.cljs$core$IHash$_hash$arity$1 = (function (this__5296__auto__){
var self__ = this;
var this__5296__auto____$1 = this;
var h__5111__auto__ = self__.__hash;
if((!((h__5111__auto__ == null)))){
return h__5111__auto__;
} else {
var h__5111__auto____$1 = (function (coll__5297__auto__){
return (1733662014 ^ cljs.core.hash_unordered_coll(coll__5297__auto__));
})(this__5296__auto____$1);
(self__.__hash = h__5111__auto____$1);

return h__5111__auto____$1;
}
}));

(sci.impl.analyzer.FnBody.prototype.cljs$core$IEquiv$_equiv$arity$2 = (function (this91209,other91210){
var self__ = this;
var this91209__$1 = this;
return (((!((other91210 == null)))) && ((((this91209__$1.constructor === other91210.constructor)) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(this91209__$1.params,other91210.params)) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(this91209__$1.body,other91210.body)) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(this91209__$1.fixed_arity,other91210.fixed_arity)) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(this91209__$1.var_arg_name,other91210.var_arg_name)) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(this91209__$1.self_ref_idx,other91210.self_ref_idx)) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(this91209__$1.iden__GT_invoke_idx,other91210.iden__GT_invoke_idx)) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(this91209__$1.__extmap,other91210.__extmap)))))))))))))))));
}));

(sci.impl.analyzer.FnBody.prototype.cljs$core$IMap$_dissoc$arity$2 = (function (this__5310__auto__,k__5311__auto__){
var self__ = this;
var this__5310__auto____$1 = this;
if(cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 6, [new cljs.core.Keyword(null,"var-arg-name","var-arg-name",-1100024887),null,new cljs.core.Keyword(null,"params","params",710516235),null,new cljs.core.Keyword(null,"self-ref-idx","self-ref-idx",-1384537812),null,new cljs.core.Keyword(null,"fixed-arity","fixed-arity",1586445869),null,new cljs.core.Keyword(null,"iden->invoke-idx","iden->invoke-idx",-1797627026),null,new cljs.core.Keyword(null,"body","body",-2049205669),null], null), null),k__5311__auto__)){
return cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(cljs.core._with_meta(cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,this__5310__auto____$1),self__.__meta),k__5311__auto__);
} else {
return (new sci.impl.analyzer.FnBody(self__.params,self__.body,self__.fixed_arity,self__.var_arg_name,self__.self_ref_idx,self__.iden__GT_invoke_idx,self__.__meta,cljs.core.not_empty(cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(self__.__extmap,k__5311__auto__)),null));
}
}));

(sci.impl.analyzer.FnBody.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = (function (this__5307__auto__,k91208){
var self__ = this;
var this__5307__auto____$1 = this;
var G__91250 = k91208;
var G__91250__$1 = (((G__91250 instanceof cljs.core.Keyword))?G__91250.fqn:null);
switch (G__91250__$1) {
case "params":
case "body":
case "fixed-arity":
case "var-arg-name":
case "self-ref-idx":
case "iden->invoke-idx":
return true;

break;
default:
return cljs.core.contains_QMARK_(self__.__extmap,k91208);

}
}));

(sci.impl.analyzer.FnBody.prototype.cljs$core$IAssociative$_assoc$arity$3 = (function (this__5308__auto__,k__5309__auto__,G__91207){
var self__ = this;
var this__5308__auto____$1 = this;
var pred__91252 = cljs.core.keyword_identical_QMARK_;
var expr__91253 = k__5309__auto__;
if(cljs.core.truth_((pred__91252.cljs$core$IFn$_invoke$arity$2 ? pred__91252.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"params","params",710516235),expr__91253) : pred__91252.call(null,new cljs.core.Keyword(null,"params","params",710516235),expr__91253)))){
return (new sci.impl.analyzer.FnBody(G__91207,self__.body,self__.fixed_arity,self__.var_arg_name,self__.self_ref_idx,self__.iden__GT_invoke_idx,self__.__meta,self__.__extmap,null));
} else {
if(cljs.core.truth_((pred__91252.cljs$core$IFn$_invoke$arity$2 ? pred__91252.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"body","body",-2049205669),expr__91253) : pred__91252.call(null,new cljs.core.Keyword(null,"body","body",-2049205669),expr__91253)))){
return (new sci.impl.analyzer.FnBody(self__.params,G__91207,self__.fixed_arity,self__.var_arg_name,self__.self_ref_idx,self__.iden__GT_invoke_idx,self__.__meta,self__.__extmap,null));
} else {
if(cljs.core.truth_((pred__91252.cljs$core$IFn$_invoke$arity$2 ? pred__91252.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"fixed-arity","fixed-arity",1586445869),expr__91253) : pred__91252.call(null,new cljs.core.Keyword(null,"fixed-arity","fixed-arity",1586445869),expr__91253)))){
return (new sci.impl.analyzer.FnBody(self__.params,self__.body,G__91207,self__.var_arg_name,self__.self_ref_idx,self__.iden__GT_invoke_idx,self__.__meta,self__.__extmap,null));
} else {
if(cljs.core.truth_((pred__91252.cljs$core$IFn$_invoke$arity$2 ? pred__91252.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"var-arg-name","var-arg-name",-1100024887),expr__91253) : pred__91252.call(null,new cljs.core.Keyword(null,"var-arg-name","var-arg-name",-1100024887),expr__91253)))){
return (new sci.impl.analyzer.FnBody(self__.params,self__.body,self__.fixed_arity,G__91207,self__.self_ref_idx,self__.iden__GT_invoke_idx,self__.__meta,self__.__extmap,null));
} else {
if(cljs.core.truth_((pred__91252.cljs$core$IFn$_invoke$arity$2 ? pred__91252.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"self-ref-idx","self-ref-idx",-1384537812),expr__91253) : pred__91252.call(null,new cljs.core.Keyword(null,"self-ref-idx","self-ref-idx",-1384537812),expr__91253)))){
return (new sci.impl.analyzer.FnBody(self__.params,self__.body,self__.fixed_arity,self__.var_arg_name,G__91207,self__.iden__GT_invoke_idx,self__.__meta,self__.__extmap,null));
} else {
if(cljs.core.truth_((pred__91252.cljs$core$IFn$_invoke$arity$2 ? pred__91252.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"iden->invoke-idx","iden->invoke-idx",-1797627026),expr__91253) : pred__91252.call(null,new cljs.core.Keyword(null,"iden->invoke-idx","iden->invoke-idx",-1797627026),expr__91253)))){
return (new sci.impl.analyzer.FnBody(self__.params,self__.body,self__.fixed_arity,self__.var_arg_name,self__.self_ref_idx,G__91207,self__.__meta,self__.__extmap,null));
} else {
return (new sci.impl.analyzer.FnBody(self__.params,self__.body,self__.fixed_arity,self__.var_arg_name,self__.self_ref_idx,self__.iden__GT_invoke_idx,self__.__meta,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(self__.__extmap,k__5309__auto__,G__91207),null));
}
}
}
}
}
}
}));

(sci.impl.analyzer.FnBody.prototype.cljs$core$ISeqable$_seq$arity$1 = (function (this__5313__auto__){
var self__ = this;
var this__5313__auto____$1 = this;
return cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 6, 5, cljs.core.PersistentVector.EMPTY_NODE, [(new cljs.core.MapEntry(new cljs.core.Keyword(null,"params","params",710516235),self__.params,null)),(new cljs.core.MapEntry(new cljs.core.Keyword(null,"body","body",-2049205669),self__.body,null)),(new cljs.core.MapEntry(new cljs.core.Keyword(null,"fixed-arity","fixed-arity",1586445869),self__.fixed_arity,null)),(new cljs.core.MapEntry(new cljs.core.Keyword(null,"var-arg-name","var-arg-name",-1100024887),self__.var_arg_name,null)),(new cljs.core.MapEntry(new cljs.core.Keyword(null,"self-ref-idx","self-ref-idx",-1384537812),self__.self_ref_idx,null)),(new cljs.core.MapEntry(new cljs.core.Keyword(null,"iden->invoke-idx","iden->invoke-idx",-1797627026),self__.iden__GT_invoke_idx,null))], null),self__.__extmap));
}));

(sci.impl.analyzer.FnBody.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = (function (this__5299__auto__,G__91207){
var self__ = this;
var this__5299__auto____$1 = this;
return (new sci.impl.analyzer.FnBody(self__.params,self__.body,self__.fixed_arity,self__.var_arg_name,self__.self_ref_idx,self__.iden__GT_invoke_idx,G__91207,self__.__extmap,self__.__hash));
}));

(sci.impl.analyzer.FnBody.prototype.cljs$core$ICollection$_conj$arity$2 = (function (this__5305__auto__,entry__5306__auto__){
var self__ = this;
var this__5305__auto____$1 = this;
if(cljs.core.vector_QMARK_(entry__5306__auto__)){
return this__5305__auto____$1.cljs$core$IAssociative$_assoc$arity$3(null,cljs.core._nth(entry__5306__auto__,(0)),cljs.core._nth(entry__5306__auto__,(1)));
} else {
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3(cljs.core._conj,this__5305__auto____$1,entry__5306__auto__);
}
}));

(sci.impl.analyzer.FnBody.getBasis = (function (){
return new cljs.core.PersistentVector(null, 6, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"params","params",-1943919534,null),new cljs.core.Symbol(null,"body","body",-408674142,null),new cljs.core.Symbol(null,"fixed-arity","fixed-arity",-1067989900,null),new cljs.core.Symbol(null,"var-arg-name","var-arg-name",540506640,null),new cljs.core.Symbol(null,"self-ref-idx","self-ref-idx",255993715,null),new cljs.core.Symbol(null,"iden->invoke-idx","iden->invoke-idx",-157095499,null)], null);
}));

(sci.impl.analyzer.FnBody.cljs$lang$type = true);

(sci.impl.analyzer.FnBody.cljs$lang$ctorPrSeq = (function (this__5346__auto__){
return (new cljs.core.List(null,"sci.impl.analyzer/FnBody",null,(1),null));
}));

(sci.impl.analyzer.FnBody.cljs$lang$ctorPrWriter = (function (this__5346__auto__,writer__5347__auto__){
return cljs.core._write(writer__5347__auto__,"sci.impl.analyzer/FnBody");
}));

/**
 * Positional factory function for sci.impl.analyzer/FnBody.
 */
sci.impl.analyzer.__GT_FnBody = (function sci$impl$analyzer$__GT_FnBody(params,body,fixed_arity,var_arg_name,self_ref_idx,iden__GT_invoke_idx){
return (new sci.impl.analyzer.FnBody(params,body,fixed_arity,var_arg_name,self_ref_idx,iden__GT_invoke_idx,null,null,null));
});

/**
 * Factory function for sci.impl.analyzer/FnBody, taking a map of keywords to field values.
 */
sci.impl.analyzer.map__GT_FnBody = (function sci$impl$analyzer$map__GT_FnBody(G__91211){
var extmap__5342__auto__ = (function (){var G__91265 = cljs.core.dissoc.cljs$core$IFn$_invoke$arity$variadic(G__91211,new cljs.core.Keyword(null,"params","params",710516235),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"body","body",-2049205669),new cljs.core.Keyword(null,"fixed-arity","fixed-arity",1586445869),new cljs.core.Keyword(null,"var-arg-name","var-arg-name",-1100024887),new cljs.core.Keyword(null,"self-ref-idx","self-ref-idx",-1384537812),new cljs.core.Keyword(null,"iden->invoke-idx","iden->invoke-idx",-1797627026)], 0));
if(cljs.core.record_QMARK_(G__91211)){
return cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,G__91265);
} else {
return G__91265;
}
})();
return (new sci.impl.analyzer.FnBody(new cljs.core.Keyword(null,"params","params",710516235).cljs$core$IFn$_invoke$arity$1(G__91211),new cljs.core.Keyword(null,"body","body",-2049205669).cljs$core$IFn$_invoke$arity$1(G__91211),new cljs.core.Keyword(null,"fixed-arity","fixed-arity",1586445869).cljs$core$IFn$_invoke$arity$1(G__91211),new cljs.core.Keyword(null,"var-arg-name","var-arg-name",-1100024887).cljs$core$IFn$_invoke$arity$1(G__91211),new cljs.core.Keyword(null,"self-ref-idx","self-ref-idx",-1384537812).cljs$core$IFn$_invoke$arity$1(G__91211),new cljs.core.Keyword(null,"iden->invoke-idx","iden->invoke-idx",-1797627026).cljs$core$IFn$_invoke$arity$1(G__91211),null,cljs.core.not_empty(extmap__5342__auto__),null));
});

sci.impl.analyzer.expand_fn_args_PLUS_body = (function sci$impl$analyzer$expand_fn_args_PLUS_body(p__91271,p__91272,macro_QMARK_,fn_name,fn_id){
var map__91273 = p__91271;
var map__91273__$1 = cljs.core.__destructure_map(map__91273);
var ctx = map__91273__$1;
var fn_expr = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__91273__$1,new cljs.core.Keyword(null,"fn-expr","fn-expr",-933027985));
var vec__91274 = p__91272;
var seq__91275 = cljs.core.seq(vec__91274);
var first__91276 = cljs.core.first(seq__91275);
var seq__91275__$1 = cljs.core.next(seq__91275);
var binding_vector = first__91276;
var body_exprs = seq__91275__$1;
if(cljs.core.truth_(binding_vector)){
} else {
sci.impl.analyzer.throw_error_with_location("Parameter declaration missing.",fn_expr);
}

if(cljs.core.vector_QMARK_(binding_vector)){
} else {
sci.impl.analyzer.throw_error_with_location("Parameter declaration should be a vector",fn_expr);
}

var binding_vector__$1 = (cljs.core.truth_(macro_QMARK_)?cljs.core.into.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"&form","&form",1482799337,null),new cljs.core.Symbol(null,"&env","&env",-919163083,null)], null),binding_vector):binding_vector);
var next_body = cljs.core.next(body_exprs);
var conds = ((next_body)?(function (){var e = cljs.core.first(body_exprs);
if(cljs.core.map_QMARK_(e)){
return e;
} else {
return null;
}
})():null);
var body_exprs__$1 = (cljs.core.truth_(conds)?next_body:body_exprs);
var conds__$1 = (function (){var or__5002__auto__ = conds;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.meta(binding_vector__$1);
}
})();
var pre = new cljs.core.Keyword(null,"pre","pre",2118456869).cljs$core$IFn$_invoke$arity$1(conds__$1);
var post = new cljs.core.Keyword(null,"post","post",269697687).cljs$core$IFn$_invoke$arity$1(conds__$1);
var body_exprs__$2 = (cljs.core.truth_(post)?cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$1((new cljs.core.List(null,cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic((new cljs.core.List(null,new cljs.core.Symbol("cljs.core","let","cljs.core/let",-308701135,null),null,(1),null)),(new cljs.core.List(null,cljs.core.vec(cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$2((new cljs.core.List(null,new cljs.core.Symbol(null,"%","%",-950237169,null),null,(1),null)),(new cljs.core.List(null,((((1) < cljs.core.count(body_exprs__$1)))?cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$2((new cljs.core.List(null,new cljs.core.Symbol(null,"do","do",1686842252,null),null,(1),null)),body_exprs__$1))):cljs.core.first(body_exprs__$1)),null,(1),null)))))),null,(1),null)),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (c){
return cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$2((new cljs.core.List(null,new cljs.core.Symbol("cljs.core","assert","cljs.core/assert",1075777968,null),null,(1),null)),(new cljs.core.List(null,c,null,(1),null)))));
}),post),(new cljs.core.List(null,new cljs.core.Symbol(null,"%","%",-950237169,null),null,(1),null))], 0)))),null,(1),null))))):body_exprs__$1);
var body_exprs__$3 = (cljs.core.truth_(pre)?cljs.core.concat.cljs$core$IFn$_invoke$arity$2(cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (c){
return cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$2((new cljs.core.List(null,new cljs.core.Symbol("cljs.core","assert","cljs.core/assert",1075777968,null),null,(1),null)),(new cljs.core.List(null,c,null,(1),null)))));
}),pre),body_exprs__$2):body_exprs__$2);
var map__91277 = sci.impl.utils.maybe_destructured(binding_vector__$1,body_exprs__$3);
var map__91277__$1 = cljs.core.__destructure_map(map__91277);
var params = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__91277__$1,new cljs.core.Keyword(null,"params","params",710516235));
var body = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__91277__$1,new cljs.core.Keyword(null,"body","body",-2049205669));
var vec__91278 = cljs.core.split_with((function (p1__91268_SHARP_){
return cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Symbol(null,"&","&",-2144855648,null),p1__91268_SHARP_);
}),params);
var fixed_args = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__91278,(0),null);
var vec__91281 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__91278,(1),null);
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__91281,(0),null);
var var_arg_name = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__91281,(1),null);
var fixed_args__$1 = cljs.core.vec(fixed_args);
var fixed_arity = cljs.core.count(fixed_args__$1);
var param_names = (function (){var G__91287 = fixed_args__$1;
if(cljs.core.truth_(var_arg_name)){
return cljs.core.conj.cljs$core$IFn$_invoke$arity$2(G__91287,var_arg_name);
} else {
return G__91287;
}
})();
var ctx__$1 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(ctx,new cljs.core.Keyword(null,"params","params",710516235),param_names);
var param_count = cljs.core.count(param_names);
var param_idens = cljs.core.repeatedly.cljs$core$IFn$_invoke$arity$2(param_count,cljs.core.gensym);
var param_bindings = cljs.core.zipmap(param_names,param_idens);
var iden__GT_invoke_idx = cljs.core.zipmap(param_idens,cljs.core.range.cljs$core$IFn$_invoke$arity$0());
var bindings = new cljs.core.Keyword(null,"bindings","bindings",1271397192).cljs$core$IFn$_invoke$arity$1(ctx__$1);
var ctx__$2 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(ctx__$1,new cljs.core.Keyword(null,"bindings","bindings",1271397192),cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([bindings,param_bindings], 0)));
var ctx__$3 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(ctx__$2,new cljs.core.Keyword(null,"iden->invoke-idx","iden->invoke-idx",-1797627026),iden__GT_invoke_idx);
var ctx__$4 = cljs.core.update.cljs$core$IFn$_invoke$arity$4(ctx__$3,new cljs.core.Keyword(null,"parents","parents",-2027538891),cljs.core.conj,fixed_arity);
var ___$1 = cljs.core._vreset_BANG_(new cljs.core.Keyword(null,"closure-bindings","closure-bindings",112932037).cljs$core$IFn$_invoke$arity$1(ctx__$4),cljs.core.assoc_in(cljs.core._deref(new cljs.core.Keyword(null,"closure-bindings","closure-bindings",112932037).cljs$core$IFn$_invoke$arity$1(ctx__$4)),cljs.core.conj.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"parents","parents",-2027538891).cljs$core$IFn$_invoke$arity$1(ctx__$4),new cljs.core.Keyword(null,"syms","syms",-1575891762)),cljs.core.zipmap(param_idens,cljs.core.range.cljs$core$IFn$_invoke$arity$0())));
var self_ref_idx = (cljs.core.truth_(fn_name)?(function (){var G__91290 = ctx__$4;
var G__91291 = new cljs.core.Keyword(null,"closure-bindings","closure-bindings",112932037).cljs$core$IFn$_invoke$arity$1(ctx__$4);
var G__91292 = fn_id;
return (sci.impl.analyzer.update_parents.cljs$core$IFn$_invoke$arity$3 ? sci.impl.analyzer.update_parents.cljs$core$IFn$_invoke$arity$3(G__91290,G__91291,G__91292) : sci.impl.analyzer.update_parents.call(null,G__91290,G__91291,G__91292));
})():null);
var body__$1 = sci.impl.analyzer.return_do(sci.impl.analyzer.with_recur_target(ctx__$4,true),fn_expr,body);
var iden__GT_invoke_idx__$1 = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(new cljs.core.Keyword(null,"closure-bindings","closure-bindings",112932037).cljs$core$IFn$_invoke$arity$1(ctx__$4)),cljs.core.conj.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"parents","parents",-2027538891).cljs$core$IFn$_invoke$arity$1(ctx__$4),new cljs.core.Keyword(null,"syms","syms",-1575891762)));
var G__91293 = sci.impl.analyzer.__GT_FnBody(params,body__$1,fixed_arity,var_arg_name,self_ref_idx,iden__GT_invoke_idx__$1);
if(cljs.core.truth_(var_arg_name)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__91293,new cljs.core.Keyword(null,"vararg-idx","vararg-idx",-590991228),cljs.core.get.cljs$core$IFn$_invoke$arity$2(iden__GT_invoke_idx__$1,cljs.core.last(param_idens)));
} else {
return G__91293;
}
});
sci.impl.analyzer.analyzed_fn_meta = (function sci$impl$analyzer$analyzed_fn_meta(ctx,m){
var meta_needs_eval_QMARK_ = (cljs.core.count(m) > (2));
var m__$1 = ((meta_needs_eval_QMARK_)?cljs.core.vary_meta.cljs$core$IFn$_invoke$arity$4((function (){var G__91296 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(ctx,new cljs.core.Keyword(null,"meta","meta",1499536964),true);
var G__91297 = m;
return (sci.impl.analyzer.analyze.cljs$core$IFn$_invoke$arity$2 ? sci.impl.analyzer.analyze.cljs$core$IFn$_invoke$arity$2(G__91296,G__91297) : sci.impl.analyzer.analyze.call(null,G__91296,G__91297));
})(),cljs.core.assoc,new cljs.core.Keyword("sci.impl","op","sci.impl/op",950953978),new cljs.core.Keyword(null,"eval","eval",-1103567905)):m);
return m__$1;
});
sci.impl.analyzer.analyze_fn_STAR_ = (function sci$impl$analyzer$analyze_fn_STAR_(ctx,p__91299,macro_QMARK_){
var vec__91300 = p__91299;
var seq__91301 = cljs.core.seq(vec__91300);
var first__91302 = cljs.core.first(seq__91301);
var seq__91301__$1 = cljs.core.next(seq__91301);
var _fn = first__91302;
var first__91302__$1 = cljs.core.first(seq__91301__$1);
var seq__91301__$2 = cljs.core.next(seq__91301__$1);
var name_QMARK_ = first__91302__$1;
var body = seq__91301__$2;
var fn_expr = vec__91300;
var ctx__$1 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(ctx,new cljs.core.Keyword(null,"fn-expr","fn-expr",-933027985),fn_expr);
var fn_name = (((name_QMARK_ instanceof cljs.core.Symbol))?name_QMARK_:null);
var body__$1 = (cljs.core.truth_(fn_name)?body:cljs.core.cons(name_QMARK_,body));
var bodies = ((cljs.core.seq_QMARK_(cljs.core.first(body__$1)))?body__$1:new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [body__$1], null));
var fn_id = cljs.core.gensym.cljs$core$IFn$_invoke$arity$0();
var parents = cljs.core.fnil.cljs$core$IFn$_invoke$arity$2(cljs.core.conj,cljs.core.PersistentVector.EMPTY)(new cljs.core.Keyword(null,"parents","parents",-2027538891).cljs$core$IFn$_invoke$arity$1(ctx__$1),fn_id);
var ctx__$2 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(ctx__$1,new cljs.core.Keyword(null,"parents","parents",-2027538891),parents);
var ctx__$3 = (cljs.core.truth_(fn_name)?cljs.core.assoc_in(ctx__$2,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"bindings","bindings",1271397192),fn_name], null),fn_id):ctx__$2);
var bindings = new cljs.core.Keyword(null,"bindings","bindings",1271397192).cljs$core$IFn$_invoke$arity$1(ctx__$3);
var bound_idens = cljs.core.set(cljs.core.vals(bindings));
var ctx__$4 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(ctx__$3,new cljs.core.Keyword(null,"outer-idens","outer-idens",1197381241),bound_idens);
var closure_bindings = new cljs.core.Keyword(null,"closure-bindings","closure-bindings",112932037).cljs$core$IFn$_invoke$arity$1(ctx__$4);
var analyzed_bodies = cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (p__91304,body__$2){
var map__91305 = p__91304;
var map__91305__$1 = cljs.core.__destructure_map(map__91305);
var acc = map__91305__$1;
var max_fixed = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__91305__$1,new cljs.core.Keyword(null,"max-fixed","max-fixed",166770124));
var min_varargs = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__91305__$1,new cljs.core.Keyword(null,"min-varargs","min-varargs",1999010596));
var orig_body = body__$2;
var arglist = cljs.core.first(body__$2);
var body__$3 = sci.impl.analyzer.expand_fn_args_PLUS_body(ctx__$4,body__$2,macro_QMARK_,fn_name,fn_id);
var var_arg_name = new cljs.core.Keyword(null,"var-arg-name","var-arg-name",-1100024887).cljs$core$IFn$_invoke$arity$1(body__$3);
var fixed_arity = new cljs.core.Keyword(null,"fixed-arity","fixed-arity",1586445869).cljs$core$IFn$_invoke$arity$1(body__$3);
var new_min_varargs = (cljs.core.truth_(var_arg_name)?fixed_arity:null);
if(cljs.core.truth_((function (){var and__5000__auto__ = var_arg_name;
if(cljs.core.truth_(and__5000__auto__)){
return min_varargs;
} else {
return and__5000__auto__;
}
})())){
sci.impl.analyzer.throw_error_with_location("Can't have more than 1 variadic overload",fn_expr);
} else {
}

if(cljs.core.truth_((function (){var and__5000__auto__ = cljs.core.not(var_arg_name);
if(and__5000__auto__){
var and__5000__auto____$1 = min_varargs;
if(cljs.core.truth_(and__5000__auto____$1)){
return (fixed_arity > min_varargs);
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})())){
sci.impl.analyzer.throw_error_with_location("Can't have fixed arity function with more params than variadic function",fn_expr);
} else {
}

return cljs.core.update.cljs$core$IFn$_invoke$arity$4(cljs.core.update.cljs$core$IFn$_invoke$arity$4(cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(acc,new cljs.core.Keyword(null,"min-varargs","min-varargs",1999010596),new_min_varargs,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"max-fixed","max-fixed",166770124),(function (){var x__5087__auto__ = fixed_arity;
var y__5088__auto__ = max_fixed;
return ((x__5087__auto__ > y__5088__auto__) ? x__5087__auto__ : y__5088__auto__);
})()], 0)),new cljs.core.Keyword(null,"bodies","bodies",-1295887172),cljs.core.conj,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(body__$3,new cljs.core.Keyword(null,"orig","orig",-1678309870),orig_body)),new cljs.core.Keyword(null,"arglists","arglists",1661989754),cljs.core.conj,arglist);
}),new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"bodies","bodies",-1295887172),cljs.core.PersistentVector.EMPTY,new cljs.core.Keyword(null,"arglists","arglists",1661989754),cljs.core.PersistentVector.EMPTY,new cljs.core.Keyword(null,"min-var-args","min-var-args",-1883389660),null,new cljs.core.Keyword(null,"max-fixed","max-fixed",166770124),(-1)], null),bodies);
var cb_idens_by_arity = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(closure_bindings),parents);
var cb_idens = cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core.merge,cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"syms","syms",-1575891762),cljs.core.vals(cb_idens_by_arity)));
var self_ref_QMARK_ = (cljs.core.truth_(fn_name)?cljs.core.contains_QMARK_(cb_idens,fn_id):null);
var closed_over_idens = cljs.core.filter.cljs$core$IFn$_invoke$arity$2(bound_idens,cljs.core.keys(cb_idens));
var iden__GT_invoke_idx = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(closure_bindings),cljs.core.conj.cljs$core$IFn$_invoke$arity$2(cljs.core.pop(parents),new cljs.core.Keyword(null,"syms","syms",-1575891762)));
var closed_over_iden__GT_binding_idx = (cljs.core.truth_(iden__GT_invoke_idx)?cljs.core.zipmap(closed_over_idens,cljs.core.mapv.cljs$core$IFn$_invoke$arity$2(iden__GT_invoke_idx,closed_over_idens)):null);
var closed_over_cnt = cljs.core.count(closed_over_idens);
var iden__GT_enclosed_idx = cljs.core.zipmap(closed_over_idens,cljs.core.range.cljs$core$IFn$_invoke$arity$1(closed_over_cnt));
var iden__GT_enclosed_idx__$1 = (cljs.core.truth_(fn_name)?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(iden__GT_enclosed_idx,fn_id,closed_over_cnt):iden__GT_enclosed_idx);
var enclosed_array_fn = (((function (){var or__5002__auto__ = self_ref_QMARK_;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.seq(closed_over_iden__GT_binding_idx);
}
})())?(function (){var enclosed_array_cnt = (function (){var G__91306 = closed_over_cnt;
if(cljs.core.truth_(fn_name)){
return (G__91306 + (1));
} else {
return G__91306;
}
})();
var binding__GT_enclosed = cljs.core.into_array.cljs$core$IFn$_invoke$arity$1(cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (iden){
var temp__5804__auto__ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(iden__GT_invoke_idx,iden);
if(cljs.core.truth_(temp__5804__auto__)){
var binding_idx = temp__5804__auto__;
var enclosed_idx = cljs.core.get.cljs$core$IFn$_invoke$arity$2(iden__GT_enclosed_idx__$1,iden);
var G__91307 = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1((2));
(G__91307[(0)] = binding_idx);

(G__91307[(1)] = enclosed_idx);

return G__91307;
} else {
return null;
}
}),closed_over_idens));
return (function (bindings__$1){
var a__5590__auto__ = binding__GT_enclosed;
var l__5591__auto__ = a__5590__auto__.length;
var idx = (0);
var ret = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1(enclosed_array_cnt);
while(true){
if((idx < l__5591__auto__)){
var G__92705 = (idx + (1));
var G__92706 = (function (){var idxs = (binding__GT_enclosed[idx]);
var binding_idx = (idxs[(0)]);
var binding_val = (bindings__$1[binding_idx]);
var enclosed_idx = (idxs[(1)]);
(ret[enclosed_idx] = binding_val);

return ret;
})();
idx = G__92705;
ret = G__92706;
continue;
} else {
return ret;
}
break;
}
});
})():cljs.core.constantly(null));
var bodies__$1 = new cljs.core.Keyword(null,"bodies","bodies",-1295887172).cljs$core$IFn$_invoke$arity$1(analyzed_bodies);
var bodies__$2 = cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (body__$2){
var iden__GT_invocation_idx = new cljs.core.Keyword(null,"iden->invoke-idx","iden->invoke-idx",-1797627026).cljs$core$IFn$_invoke$arity$1(body__$2);
var invocation_self_idx = new cljs.core.Keyword(null,"self-ref-idx","self-ref-idx",-1384537812).cljs$core$IFn$_invoke$arity$1(body__$2);
var enclosed__GT_invocation = cljs.core.into_array.cljs$core$IFn$_invoke$arity$1(cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (iden){
var temp__5804__auto__ = (iden__GT_invocation_idx.cljs$core$IFn$_invoke$arity$1 ? iden__GT_invocation_idx.cljs$core$IFn$_invoke$arity$1(iden) : iden__GT_invocation_idx.call(null,iden));
if(cljs.core.truth_(temp__5804__auto__)){
var invocation_idx = temp__5804__auto__;
var G__91308 = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1((2));
(G__91308[(0)] = (iden__GT_enclosed_idx__$1.cljs$core$IFn$_invoke$arity$1 ? iden__GT_enclosed_idx__$1.cljs$core$IFn$_invoke$arity$1(iden) : iden__GT_enclosed_idx__$1.call(null,iden)));

(G__91308[(1)] = invocation_idx);

return G__91308;
} else {
return null;
}
}),closed_over_idens));
var invoc_size = cljs.core.count(iden__GT_invocation_idx);
var copy_enclosed__GT_invocation = (((enclosed__GT_invocation.length > (0)))?(function (enclosed_array,invoc_array){
var a__5590__auto__ = enclosed__GT_invocation;
var l__5591__auto__ = a__5590__auto__.length;
var idx = (0);
var ret = invoc_array;
while(true){
if((idx < l__5591__auto__)){
var G__92707 = (idx + (1));
var G__92708 = (function (){var idxs = (enclosed__GT_invocation[idx]);
var enclosed_idx = (idxs[(0)]);
var enclosed_val = (enclosed_array[enclosed_idx]);
var invoc_idx = (idxs[(1)]);
(ret[invoc_idx] = enclosed_val);

return ret;
})();
idx = G__92707;
ret = G__92708;
continue;
} else {
return ret;
}
break;
}
}):null);
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(body__$2,new cljs.core.Keyword(null,"invoc-size","invoc-size",2053298058),invoc_size,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"invocation-self-idx","invocation-self-idx",-1258983407),invocation_self_idx,new cljs.core.Keyword(null,"copy-enclosed->invocation","copy-enclosed->invocation",-1322388729),copy_enclosed__GT_invocation], 0));
}),bodies__$1);
var arglists = new cljs.core.Keyword(null,"arglists","arglists",1661989754).cljs$core$IFn$_invoke$arity$1(analyzed_bodies);
var fn_meta = cljs.core.dissoc.cljs$core$IFn$_invoke$arity$variadic(cljs.core.meta(fn_expr),new cljs.core.Keyword(null,"line","line",212345235),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"column","column",2078222095)], 0));
var ana_fn_meta = ((cljs.core.seq(fn_meta))?(sci.impl.analyzer.analyze.cljs$core$IFn$_invoke$arity$2 ? sci.impl.analyzer.analyze.cljs$core$IFn$_invoke$arity$2(ctx__$4,fn_meta) : sci.impl.analyzer.analyze.call(null,ctx__$4,fn_meta)):null);
var struct = new cljs.core.PersistentArrayMap(null, 7, [new cljs.core.Keyword("sci.impl","fn-bodies","sci.impl/fn-bodies",134751661),bodies__$2,new cljs.core.Keyword("sci.impl","fn-name","sci.impl/fn-name",-1172300569),fn_name,new cljs.core.Keyword("sci.impl","self-ref?","sci.impl/self-ref?",-276538273),self_ref_QMARK_,new cljs.core.Keyword("sci.impl","arglists","sci.impl/arglists",-802264395),arglists,new cljs.core.Keyword("sci.impl","fn","sci.impl/fn",1695180073),true,new cljs.core.Keyword("sci.impl","fn-meta","sci.impl/fn-meta",1093684639),ana_fn_meta,new cljs.core.Keyword("sci.impl","bindings-fn","sci.impl/bindings-fn",-992456394),enclosed_array_fn], null);
return struct;
});
sci.impl.analyzer.fn_ctx_fn = (function sci$impl$analyzer$fn_ctx_fn(_ctx,struct,fn_meta){
var fn_name = new cljs.core.Keyword("sci.impl","fn-name","sci.impl/fn-name",-1172300569).cljs$core$IFn$_invoke$arity$1(struct);
var fn_bodies = new cljs.core.Keyword("sci.impl","fn-bodies","sci.impl/fn-bodies",134751661).cljs$core$IFn$_invoke$arity$1(struct);
var macro_QMARK_ = new cljs.core.Keyword("sci","macro","sci/macro",-868536151).cljs$core$IFn$_invoke$arity$1(struct);
var single_arity = ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2((1),cljs.core.count(fn_bodies)))?cljs.core.first(fn_bodies):null);
var bindings_fn = new cljs.core.Keyword("sci.impl","bindings-fn","sci.impl/bindings-fn",-992456394).cljs$core$IFn$_invoke$arity$1(struct);
var self_ref_QMARK_ = new cljs.core.Keyword("sci.impl","self-ref?","sci.impl/self-ref?",-276538273).cljs$core$IFn$_invoke$arity$1(struct);
if(cljs.core.truth_(fn_meta)){
return sci.impl.types.__GT_NodeR((function (this$,ctx,bindings){
var fn_meta__$1 = sci.impl.types.eval(fn_meta,ctx,bindings);
var f = sci.impl.fns.eval_fn(ctx,bindings,fn_name,fn_bodies,macro_QMARK_,single_arity,self_ref_QMARK_,bindings_fn);
return cljs.core.vary_meta.cljs$core$IFn$_invoke$arity$3(f,cljs.core.merge,fn_meta__$1);
}),null);
} else {
return sci.impl.types.__GT_NodeR((function (this$,ctx,bindings){
return sci.impl.fns.eval_fn(ctx,bindings,fn_name,fn_bodies,macro_QMARK_,single_arity,self_ref_QMARK_,bindings_fn);
}),null);
}
});
sci.impl.analyzer.analyze_fn = (function sci$impl$analyzer$analyze_fn(ctx,fn_expr,macro_QMARK_){
var struct = sci.impl.analyzer.analyze_fn_STAR_(ctx,fn_expr,macro_QMARK_);
var fn_meta = new cljs.core.Keyword("sci.impl","fn-meta","sci.impl/fn-meta",1093684639).cljs$core$IFn$_invoke$arity$1(struct);
return sci.impl.analyzer.fn_ctx_fn(ctx,struct,fn_meta);
});
/**
 * :syms = closed over values
 */
sci.impl.analyzer.update_parents = (function sci$impl$analyzer$update_parents(ctx,closure_bindings,ob){
var parents = new cljs.core.Keyword(null,"parents","parents",-2027538891).cljs$core$IFn$_invoke$arity$1(ctx);
var new_cb = cljs.core._vreset_BANG_(closure_bindings,(function (cb){
return cljs.core.update_in.cljs$core$IFn$_invoke$arity$3(cb,cljs.core.conj.cljs$core$IFn$_invoke$arity$2(parents,new cljs.core.Keyword(null,"syms","syms",-1575891762)),(function (iden__GT_invoke_idx){
if(cljs.core.contains_QMARK_(iden__GT_invoke_idx,ob)){
return iden__GT_invoke_idx;
} else {
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(iden__GT_invoke_idx,ob,(cljs.core.count(iden__GT_invoke_idx)));
}
}));
})(cljs.core._deref(closure_bindings)));
var closure_idx = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(new_cb,cljs.core.conj.cljs$core$IFn$_invoke$arity$variadic(parents,new cljs.core.Keyword(null,"syms","syms",-1575891762),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([ob], 0)));
return closure_idx;
});
sci.impl.analyzer.analyze_let_STAR_ = (function sci$impl$analyzer$analyze_let_STAR_(ctx,expr,destructured_let_bindings,exprs){
var rt = sci.impl.analyzer.recur_target(ctx);
var ctx__$1 = sci.impl.analyzer.without_recur_target(ctx);
var vec__91313 = cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (p__91317,p__91318){
var vec__91320 = p__91317;
var ctx__$2 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__91320,(0),null);
var new_let_bindings = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__91320,(1),null);
var idens = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__91320,(2),null);
var vec__91323 = p__91318;
var binding_name = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__91323,(0),null);
var binding_value = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__91323,(1),null);
var m = cljs.core.meta(binding_value);
var t = (cljs.core.truth_(m)?new cljs.core.Keyword(null,"tag","tag",-1290361223).cljs$core$IFn$_invoke$arity$1(m):null);
var binding_name__$1 = (cljs.core.truth_(t)?cljs.core.vary_meta.cljs$core$IFn$_invoke$arity$4(binding_name,cljs.core.assoc,new cljs.core.Keyword(null,"tag","tag",-1290361223),t):binding_name);
var v = (sci.impl.analyzer.analyze.cljs$core$IFn$_invoke$arity$2 ? sci.impl.analyzer.analyze.cljs$core$IFn$_invoke$arity$2(ctx__$2,binding_value) : sci.impl.analyzer.analyze.call(null,ctx__$2,binding_value));
var new_iden = cljs.core.gensym.cljs$core$IFn$_invoke$arity$0();
var cb = new cljs.core.Keyword(null,"closure-bindings","closure-bindings",112932037).cljs$core$IFn$_invoke$arity$1(ctx__$2);
var idx = sci.impl.analyzer.update_parents(ctx__$2,cb,new_iden);
var iden__GT_invoke_idx = new cljs.core.Keyword(null,"iden->invoke-idx","iden->invoke-idx",-1797627026).cljs$core$IFn$_invoke$arity$1(ctx__$2);
var iden__GT_invoke_idx__$1 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(iden__GT_invoke_idx,new_iden,idx);
var ctx__$3 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(ctx__$2,new cljs.core.Keyword(null,"iden->invoke-idx","iden->invoke-idx",-1797627026),iden__GT_invoke_idx__$1);
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.update.cljs$core$IFn$_invoke$arity$5(ctx__$3,new cljs.core.Keyword(null,"bindings","bindings",1271397192),cljs.core.assoc,binding_name__$1,new_iden),cljs.core.conj.cljs$core$IFn$_invoke$arity$variadic(new_let_bindings,binding_name__$1,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([v], 0)),cljs.core.conj.cljs$core$IFn$_invoke$arity$2(idens,new_iden)], null);
}),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [ctx__$1,cljs.core.PersistentVector.EMPTY,cljs.core.PersistentVector.EMPTY], null),cljs.core.partition.cljs$core$IFn$_invoke$arity$2((2),destructured_let_bindings));
var ctx__$2 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__91313,(0),null);
var new_let_bindings = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__91313,(1),null);
var idens = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__91313,(2),null);
var body = sci.impl.analyzer.return_do(sci.impl.analyzer.with_recur_target(ctx__$2,rt),expr,exprs);
var iden__GT_invoke_idx = new cljs.core.Keyword(null,"iden->invoke-idx","iden->invoke-idx",-1797627026).cljs$core$IFn$_invoke$arity$1(ctx__$2);
var idxs = cljs.core.mapv.cljs$core$IFn$_invoke$arity$2(iden__GT_invoke_idx,idens);
return sci.impl.types.__GT_NodeR((function (this$,ctx__$3,bindings){
return sci.impl.evaluator.eval_let(ctx__$3,bindings,new_let_bindings,body,idxs);
}),null);
});
/**
 * The let macro from clojure.core
 */
sci.impl.analyzer.analyze_let = (function sci$impl$analyzer$analyze_let(ctx,p__91330){
var vec__91331 = p__91330;
var seq__91332 = cljs.core.seq(vec__91331);
var first__91333 = cljs.core.first(seq__91332);
var seq__91332__$1 = cljs.core.next(seq__91332);
var _let = first__91333;
var first__91333__$1 = cljs.core.first(seq__91332__$1);
var seq__91332__$2 = cljs.core.next(seq__91332__$1);
var let_bindings = first__91333__$1;
var exprs = seq__91332__$2;
var expr = vec__91331;
var let_bindings__$1 = sci.impl.destructure.destructure(let_bindings);
return sci.impl.analyzer.analyze_let_STAR_(ctx,expr,let_bindings__$1,exprs);
});
sci.impl.analyzer.init_var_BANG_ = (function sci$impl$analyzer$init_var_BANG_(ctx,name,expr){
var cnn_92710 = sci.impl.vars.current_ns_name();
var env_92711 = new cljs.core.Keyword(null,"env","env",-1815813235).cljs$core$IFn$_invoke$arity$1(ctx);
var the_current_ns_92712 = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(env_92711),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"namespaces","namespaces",-1444157469),cnn_92710], null));
var refers_92713 = new cljs.core.Keyword(null,"refers","refers",158076809).cljs$core$IFn$_invoke$arity$1(the_current_ns_92712);
var the_current_ns_92714__$1 = (function (){var temp__5802__auto__ = (function (){var and__5000__auto__ = refers_92713;
if(cljs.core.truth_(and__5000__auto__)){
return refers_92713.get(name);
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5802__auto__)){
var x = temp__5802__auto__;
return sci.impl.analyzer.throw_error_with_location([cljs.core.str.cljs$core$IFn$_invoke$arity$1(name)," already refers to ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(x)," in namespace ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(cnn_92710)].join(''),expr);
} else {
if(cljs.core.not(cljs.core.get.cljs$core$IFn$_invoke$arity$2(the_current_ns_92712,name))){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(the_current_ns_92712,name,(function (){var G__91335 = sci.impl.vars.__GT_SciVar(null,cljs.core.symbol.cljs$core$IFn$_invoke$arity$2(cljs.core.str.cljs$core$IFn$_invoke$arity$1(cnn_92710),cljs.core.str.cljs$core$IFn$_invoke$arity$1(name)),cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(cljs.core.meta(name),new cljs.core.Keyword(null,"name","name",1843675177),name,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"ns","ns",441598760),cljs.core.deref(sci.impl.vars.current_ns),new cljs.core.Keyword(null,"file","file",-1269645878),cljs.core.deref(sci.impl.vars.current_file)], 0)),false);
G__91335.sci$impl$vars$IVar$unbind$arity$1(null);

return G__91335;
})());
} else {
return the_current_ns_92712;
}
}
})();
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$2(env_92711,(function (env__$1){
return cljs.core.update.cljs$core$IFn$_invoke$arity$5(env__$1,new cljs.core.Keyword(null,"namespaces","namespaces",-1444157469),cljs.core.assoc,cnn_92710,the_current_ns_92714__$1);
}));

return null;
});
sci.impl.analyzer.analyze_def = (function sci$impl$analyzer$analyze_def(ctx,expr){
var ctx__$1 = sci.impl.analyzer.without_recur_target(ctx);
var vec__91336 = expr;
var _def = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__91336,(0),null);
var var_name = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__91336,(1),null);
var _QMARK_docstring = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__91336,(2),null);
var _QMARK_init = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__91336,(3),null);
sci.impl.analyzer.init_var_BANG_(ctx__$1,var_name,expr);

if(cljs.core.simple_symbol_QMARK_(var_name)){
} else {
sci.impl.analyzer.throw_error_with_location("Var name should be simple symbol.",expr);
}

var arg_count = cljs.core.count(expr);
var docstring = ((((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2((4),arg_count)) && (typeof _QMARK_docstring === 'string')))?_QMARK_docstring:null);
var expected_arg_count = (cljs.core.truth_(docstring)?(4):(3));
if((arg_count <= expected_arg_count)){
} else {
throw (new Error("Too many arguments to def"));
}

var init = (cljs.core.truth_(docstring)?_QMARK_init:_QMARK_docstring);
var init__$1 = ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2((2),arg_count))?sci.impl.utils.var_unbound:(sci.impl.analyzer.analyze.cljs$core$IFn$_invoke$arity$2 ? sci.impl.analyzer.analyze.cljs$core$IFn$_invoke$arity$2(ctx__$1,init) : sci.impl.analyzer.analyze.call(null,ctx__$1,init)));
var m = cljs.core.meta(var_name);
var m_needs_eval_QMARK_ = m;
var m__$1 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(m,new cljs.core.Keyword(null,"ns","ns",441598760),cljs.core.deref(sci.impl.vars.current_ns));
var m__$2 = (cljs.core.truth_(docstring)?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(m__$1,new cljs.core.Keyword(null,"doc","doc",1913296891),docstring):m__$1);
var m__$3 = (cljs.core.truth_(m_needs_eval_QMARK_)?(sci.impl.analyzer.analyze.cljs$core$IFn$_invoke$arity$2 ? sci.impl.analyzer.analyze.cljs$core$IFn$_invoke$arity$2(ctx__$1,m__$2) : sci.impl.analyzer.analyze.call(null,ctx__$1,m__$2)):sci.impl.types.__GT_constant(m__$2));
return sci.impl.types.__GT_NodeR((function (this$,ctx__$2,bindings){
return sci.impl.evaluator.eval_def(ctx__$2,bindings,var_name,init__$1,m__$3);
}),null);
});
sci.impl.analyzer.analyze_defn = (function sci$impl$analyzer$analyze_defn(ctx,p__91344){
var vec__91345 = p__91344;
var seq__91346 = cljs.core.seq(vec__91345);
var first__91347 = cljs.core.first(seq__91346);
var seq__91346__$1 = cljs.core.next(seq__91346);
var op = first__91347;
var first__91347__$1 = cljs.core.first(seq__91346__$1);
var seq__91346__$2 = cljs.core.next(seq__91346__$1);
var fn_name = first__91347__$1;
var body = seq__91346__$2;
var expr = vec__91345;
if(cljs.core.simple_symbol_QMARK_(fn_name)){
} else {
sci.impl.analyzer.throw_error_with_location("Var name should be simple symbol.",expr);
}

sci.impl.analyzer.init_var_BANG_(ctx,fn_name,expr);

var macro_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("defmacro",cljs.core.name(op));
var vec__91349 = cljs.core.split_with(cljs.core.comp.cljs$core$IFn$_invoke$arity$2(cljs.core.not,cljs.core.sequential_QMARK_),body);
var pre_body = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__91349,(0),null);
var body__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__91349,(1),null);
var _ = ((cljs.core.empty_QMARK_(body__$1))?sci.impl.analyzer.throw_error_with_location("Parameter declaration missing.",expr):null);
var docstring = (function (){var temp__5804__auto__ = cljs.core.first(pre_body);
if(cljs.core.truth_(temp__5804__auto__)){
var ds = temp__5804__auto__;
if(typeof ds === 'string'){
return ds;
} else {
return null;
}
} else {
return null;
}
})();
var meta_map = (function (){var temp__5804__auto__ = cljs.core.last(pre_body);
if(cljs.core.truth_(temp__5804__auto__)){
var m = temp__5804__auto__;
if(cljs.core.map_QMARK_(m)){
return m;
} else {
return null;
}
} else {
return null;
}
})();
var vec__91352 = ((cljs.core.seq_QMARK_(cljs.core.first(body__$1)))?(function (){var lb = cljs.core.last(body__$1);
if(cljs.core.map_QMARK_(lb)){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [lb,cljs.core.butlast(body__$1)], null);
} else {
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [null,body__$1], null);
}
})():new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [null,body__$1], null));
var meta_map2 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__91352,(0),null);
var body__$2 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__91352,(1),null);
var meta_map__$1 = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.meta(fn_name),cljs.core.meta(expr),meta_map], 0));
var meta_map__$2 = (cljs.core.truth_(meta_map2)?cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([meta_map__$1,meta_map2], 0)):meta_map__$1);
var fn_body = cljs.core.with_meta(cljs.core.cons(new cljs.core.Symbol(null,"fn","fn",465265323,null),body__$2),cljs.core.meta(expr));
var f = sci.impl.analyzer.analyze_fn_STAR_(ctx,fn_body,macro_QMARK_);
var arglists = (new cljs.core.List(null,new cljs.core.Symbol(null,"quote","quote",1377916282,null),(new cljs.core.List(null,cljs.core.seq(new cljs.core.Keyword("sci.impl","arglists","sci.impl/arglists",-802264395).cljs$core$IFn$_invoke$arity$1(f)),null,(1),null)),(2),null));
var meta_map__$3 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(meta_map__$2,new cljs.core.Keyword(null,"ns","ns",441598760),cljs.core.deref(sci.impl.vars.current_ns),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"arglists","arglists",1661989754),arglists], 0));
var meta_map__$4 = (function (){var G__91356 = meta_map__$3;
var G__91356__$1 = (cljs.core.truth_(docstring)?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__91356,new cljs.core.Keyword(null,"doc","doc",1913296891),docstring):G__91356);
if(macro_QMARK_){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__91356__$1,new cljs.core.Keyword(null,"macro","macro",-867863404),true);
} else {
return G__91356__$1;
}
})();
var f__$1 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(f,new cljs.core.Keyword("sci","macro","sci/macro",-868536151),macro_QMARK_,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("sci.impl","fn-name","sci.impl/fn-name",-1172300569),fn_name,new cljs.core.Keyword("sci.impl","defn","sci.impl/defn",1087257818),true], 0));
var fn_meta = new cljs.core.Keyword("sci.impl","fn-meta","sci.impl/fn-meta",1093684639).cljs$core$IFn$_invoke$arity$1(f__$1);
var ctxfn = sci.impl.analyzer.fn_ctx_fn(ctx,f__$1,fn_meta);
var f__$2 = ctxfn;
var meta_map__$5 = (sci.impl.analyzer.analyze.cljs$core$IFn$_invoke$arity$2 ? sci.impl.analyzer.analyze.cljs$core$IFn$_invoke$arity$2(ctx,meta_map__$4) : sci.impl.analyzer.analyze.call(null,ctx,meta_map__$4));
return sci.impl.types.__GT_NodeR((function (this$,ctx__$1,bindings){
return sci.impl.evaluator.eval_def(ctx__$1,bindings,fn_name,f__$2,meta_map__$5);
}),null);
});
sci.impl.analyzer.analyze_loop = (function sci$impl$analyzer$analyze_loop(ctx,expr){
var bv = cljs.core.second(expr);
var arg_names = cljs.core.take_nth.cljs$core$IFn$_invoke$arity$2((2),bv);
var init_vals = cljs.core.take_nth.cljs$core$IFn$_invoke$arity$2((2),cljs.core.rest(bv));
var vec__91357 = ((cljs.core.every_QMARK_(cljs.core.symbol_QMARK_,arg_names))?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [bv,arg_names], null):(function (){var syms = cljs.core.repeatedly.cljs$core$IFn$_invoke$arity$2(cljs.core.count(arg_names),cljs.core.gensym);
var bv1 = cljs.core.map.cljs$core$IFn$_invoke$arity$3(cljs.core.vector,syms,init_vals);
var bv2 = cljs.core.map.cljs$core$IFn$_invoke$arity$3(cljs.core.vector,arg_names,syms);
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.into.cljs$core$IFn$_invoke$arity$3(cljs.core.PersistentVector.EMPTY,cljs.core.cat,cljs.core.interleave.cljs$core$IFn$_invoke$arity$2(bv1,bv2)),syms], null);
})());
var bv__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__91357,(0),null);
var syms = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__91357,(1),null);
var body = cljs.core.nnext(expr);
var expansion = (new cljs.core.List(null,new cljs.core.Symbol(null,"let","let",358118826,null),(new cljs.core.List(null,bv__$1,(new cljs.core.List(null,cljs.core.list_STAR_.cljs$core$IFn$_invoke$arity$2(cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic((new cljs.core.List(null,new cljs.core.Symbol("cljs.core","fn","cljs.core/fn",-1065745098,null),null,(1),null)),(new cljs.core.List(null,cljs.core.vec(arg_names),null,(1),null)),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([body], 0)))),syms),null,(1),null)),(2),null)),(3),null));
return (sci.impl.analyzer.analyze.cljs$core$IFn$_invoke$arity$2 ? sci.impl.analyzer.analyze.cljs$core$IFn$_invoke$arity$2(ctx,expansion) : sci.impl.analyzer.analyze.call(null,ctx,expansion));
});
sci.impl.analyzer.analyze_lazy_seq = (function sci$impl$analyzer$analyze_lazy_seq(ctx,expr){
var body = cljs.core.rest(expr);
var ctx__$1 = sci.impl.analyzer.with_recur_target(ctx,true);
var ana = sci.impl.analyzer.return_do(ctx__$1,expr,body);
return sci.impl.types.__GT_NodeR((function (this$,ctx__$2,bindings){
return (new cljs.core.LazySeq(null,(function (){
return sci.impl.types.eval(ana,ctx__$2,bindings);
}),null,null));
}),null);
});
sci.impl.analyzer.return_if = (function sci$impl$analyzer$return_if(ctx,expr){
var exprs = cljs.core.rest(expr);
var children = sci.impl.analyzer.analyze_children(ctx,exprs);
var stack = cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(cljs.core.meta(expr),new cljs.core.Keyword(null,"ns","ns",441598760),cljs.core.deref(sci.impl.vars.current_ns),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"file","file",-1269645878),cljs.core.deref(sci.impl.vars.current_file),new cljs.core.Keyword(null,"special","special",-1125941630),true], 0));
var G__91363 = cljs.core.count(children);
switch (G__91363) {
case (0):
case (1):
return sci.impl.analyzer.throw_error_with_location("Too few arguments to if",expr);

break;
case (2):
var condition = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(children,(0));
var then = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(children,(1));
if(cljs.core.not(condition)){
return null;
} else {
if(sci.impl.utils.constant_QMARK_(condition)){
return then;
} else {
return sci.impl.types.__GT_NodeR((function (this$,ctx__$1,bindings){
if(cljs.core.truth_(sci.impl.types.eval(condition,ctx__$1,bindings))){
return sci.impl.types.eval(then,ctx__$1,bindings);
} else {
return null;
}
}),stack);

}
}

break;
case (3):
var condition = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(children,(0));
var then = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(children,(1));
var else$ = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(children,(2));
if(cljs.core.not(condition)){
return else$;
} else {
if(sci.impl.utils.constant_QMARK_(condition)){
return then;
} else {
return sci.impl.types.__GT_NodeR((function (this$,ctx__$1,bindings){
if(cljs.core.truth_(sci.impl.types.eval(condition,ctx__$1,bindings))){
return sci.impl.types.eval(then,ctx__$1,bindings);
} else {
return sci.impl.types.eval(else$,ctx__$1,bindings);
}
}),stack);

}
}

break;
default:
return sci.impl.analyzer.throw_error_with_location("Too many arguments to if",expr);

}
});
sci.impl.analyzer.analyze_case = (function sci$impl$analyzer$analyze_case(ctx,expr){
var ctx_wo_rt = sci.impl.analyzer.without_recur_target(ctx);
var case_val = (function (){var G__91370 = ctx_wo_rt;
var G__91371 = cljs.core.second(expr);
return (sci.impl.analyzer.analyze.cljs$core$IFn$_invoke$arity$2 ? sci.impl.analyzer.analyze.cljs$core$IFn$_invoke$arity$2(G__91370,G__91371) : sci.impl.analyzer.analyze.call(null,G__91370,G__91371));
})();
var clauses = cljs.core.nnext(expr);
var match_clauses = cljs.core.take_nth.cljs$core$IFn$_invoke$arity$2((2),clauses);
var result_clauses = sci.impl.analyzer.analyze_children(ctx,cljs.core.take_nth.cljs$core$IFn$_invoke$arity$2((2),cljs.core.rest(clauses)));
var vec__91367 = ((cljs.core.odd_QMARK_(cljs.core.count(clauses)))?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [true,(function (){var G__91372 = ctx;
var G__91373 = cljs.core.last(clauses);
return (sci.impl.analyzer.analyze.cljs$core$IFn$_invoke$arity$2 ? sci.impl.analyzer.analyze.cljs$core$IFn$_invoke$arity$2(G__91372,G__91373) : sci.impl.analyzer.analyze.call(null,G__91372,G__91373));
})()], null):null);
var default_QMARK_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__91367,(0),null);
var case_default = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__91367,(1),null);
var cases = cljs.core.interleave.cljs$core$IFn$_invoke$arity$2(match_clauses,result_clauses);
var assoc_new = (function (m,k,v){
if((!(cljs.core.contains_QMARK_(m,k)))){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(m,k,v);
} else {
return sci.impl.analyzer.throw_error_with_location(["Duplicate case test constant ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(k)].join(''),expr);
}
});
var case_map = (function (){var cases__$1 = cljs.core.seq(cases);
var ret_map = cljs.core.PersistentArrayMap.EMPTY;
while(true){
if(cases__$1){
var vec__91377 = cases__$1;
var seq__91378 = cljs.core.seq(vec__91377);
var first__91379 = cljs.core.first(seq__91378);
var seq__91378__$1 = cljs.core.next(seq__91378);
var k = first__91379;
var first__91379__$1 = cljs.core.first(seq__91378__$1);
var seq__91378__$2 = cljs.core.next(seq__91378__$1);
var v = first__91379__$1;
var cases__$2 = seq__91378__$2;
if(cljs.core.seq_QMARK_(k)){
var G__92727 = cases__$2;
var G__92728 = cljs.core.reduce.cljs$core$IFn$_invoke$arity$3(((function (cases__$1,ret_map,vec__91377,seq__91378,first__91379,seq__91378__$1,k,first__91379__$1,seq__91378__$2,v,cases__$2,ctx_wo_rt,case_val,clauses,match_clauses,result_clauses,vec__91367,default_QMARK_,case_default,cases,assoc_new){
return (function (acc,k__$1){
return assoc_new(acc,k__$1,v);
});})(cases__$1,ret_map,vec__91377,seq__91378,first__91379,seq__91378__$1,k,first__91379__$1,seq__91378__$2,v,cases__$2,ctx_wo_rt,case_val,clauses,match_clauses,result_clauses,vec__91367,default_QMARK_,case_default,cases,assoc_new))
,ret_map,k);
cases__$1 = G__92727;
ret_map = G__92728;
continue;
} else {
var G__92729 = cases__$2;
var G__92730 = assoc_new(ret_map,k,v);
cases__$1 = G__92729;
ret_map = G__92730;
continue;
}
} else {
return ret_map;
}
break;
}
})();
var f = (cljs.core.truth_(default_QMARK_)?sci.impl.types.__GT_NodeR((function (this$,ctx__$1,bindings){
return sci.impl.evaluator.eval_case.cljs$core$IFn$_invoke$arity$5(ctx__$1,bindings,case_map,case_val,case_default);
}),null):sci.impl.types.__GT_NodeR((function (this$,ctx__$1,bindings){
return sci.impl.evaluator.eval_case.cljs$core$IFn$_invoke$arity$4(ctx__$1,bindings,case_map,case_val);
}),null));
return f;
});
sci.impl.analyzer.analyze_try = (function sci$impl$analyzer$analyze_try(ctx,expr){
var ctx__$1 = sci.impl.analyzer.without_recur_target(ctx);
var body = cljs.core.next(expr);
var vec__91380 = (function (){var exprs = body;
var body_exprs = cljs.core.PersistentVector.EMPTY;
var catch_exprs = cljs.core.PersistentVector.EMPTY;
var finally_expr = null;
while(true){
if(exprs){
var expr__$1 = cljs.core.first(exprs);
var exprs__$1 = cljs.core.next(exprs);
if(((cljs.core.seq_QMARK_(expr__$1)) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Symbol(null,"catch","catch",-1616370245,null),cljs.core.first(expr__$1))))){
var G__92735 = exprs__$1;
var G__92736 = body_exprs;
var G__92737 = cljs.core.conj.cljs$core$IFn$_invoke$arity$2(catch_exprs,expr__$1);
var G__92738 = finally_expr;
exprs = G__92735;
body_exprs = G__92736;
catch_exprs = G__92737;
finally_expr = G__92738;
continue;
} else {
if(((cljs.core.not(exprs__$1)) && (((cljs.core.seq_QMARK_(expr__$1)) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Symbol(null,"finally","finally",-1065347064,null),cljs.core.first(expr__$1))))))){
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [body_exprs,catch_exprs,expr__$1], null);
} else {
var G__92739 = exprs__$1;
var G__92740 = cljs.core.conj.cljs$core$IFn$_invoke$arity$2(body_exprs,expr__$1);
var G__92741 = catch_exprs;
var G__92742 = finally_expr;
exprs = G__92739;
body_exprs = G__92740;
catch_exprs = G__92741;
finally_expr = G__92742;
continue;

}
}
} else {
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [body_exprs,catch_exprs,finally_expr], null);
}
break;
}
})();
var body_exprs = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__91380,(0),null);
var catches = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__91380,(1),null);
var finally$ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__91380,(2),null);
var body__$1 = (function (){var G__91383 = ctx__$1;
var G__91384 = cljs.core.cons(new cljs.core.Symbol(null,"do","do",1686842252,null),body_exprs);
return (sci.impl.analyzer.analyze.cljs$core$IFn$_invoke$arity$2 ? sci.impl.analyzer.analyze.cljs$core$IFn$_invoke$arity$2(G__91383,G__91384) : sci.impl.analyzer.analyze.call(null,G__91383,G__91384));
})();
var catches__$1 = cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (c){
var vec__91385 = c;
var seq__91386 = cljs.core.seq(vec__91385);
var first__91387 = cljs.core.first(seq__91386);
var seq__91386__$1 = cljs.core.next(seq__91386);
var _ = first__91387;
var first__91387__$1 = cljs.core.first(seq__91386__$1);
var seq__91386__$2 = cljs.core.next(seq__91386__$1);
var ex = first__91387__$1;
var first__91387__$2 = cljs.core.first(seq__91386__$2);
var seq__91386__$3 = cljs.core.next(seq__91386__$2);
var binding = first__91387__$2;
var body__$2 = seq__91386__$3;
var temp__5802__auto__ = (function (){var G__91388 = ex;
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Symbol("js","Error","js/Error",-1692659266,null),G__91388)){
return Error;
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Symbol("js","Object","js/Object",61215323,null),G__91388)){
return Object;
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"default","default",-1987822328),G__91388)){
return new cljs.core.Keyword(null,"default","default",-1987822328);
} else {
return (sci.impl.analyzer.analyze.cljs$core$IFn$_invoke$arity$2 ? sci.impl.analyzer.analyze.cljs$core$IFn$_invoke$arity$2(ctx__$1,ex) : sci.impl.analyzer.analyze.call(null,ctx__$1,ex));

}
}
}
})();
if(cljs.core.truth_(temp__5802__auto__)){
var clazz = temp__5802__auto__;
var ex_iden = cljs.core.gensym.cljs$core$IFn$_invoke$arity$0();
var closure_bindings = new cljs.core.Keyword(null,"closure-bindings","closure-bindings",112932037).cljs$core$IFn$_invoke$arity$1(ctx__$1);
var ex_idx = sci.impl.analyzer.update_parents(ctx__$1,closure_bindings,ex_iden);
var ctx__$2 = cljs.core.assoc_in(cljs.core.assoc_in(ctx__$1,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"bindings","bindings",1271397192),binding], null),ex_iden),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"iden->invoke-idx","iden->invoke-idx",-1797627026),ex_iden], null),ex_idx);
var analyzed_body = (function (){var G__91389 = ctx__$2;
var G__91390 = cljs.core.cons(new cljs.core.Symbol(null,"do","do",1686842252,null),body__$2);
return (sci.impl.analyzer.analyze.cljs$core$IFn$_invoke$arity$2 ? sci.impl.analyzer.analyze.cljs$core$IFn$_invoke$arity$2(G__91389,G__91390) : sci.impl.analyzer.analyze.call(null,G__91389,G__91390));
})();
return new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"class","class",-2030961996),clazz,new cljs.core.Keyword(null,"ex-idx","ex-idx",795118805),ex_idx,new cljs.core.Keyword(null,"body","body",-2049205669),analyzed_body], null);
} else {
return sci.impl.analyzer.throw_error_with_location(["Unable to resolve classname: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(ex)].join(''),ex);
}
}),catches);
var finally$__$1 = (cljs.core.truth_(finally$)?(function (){var G__91391 = ctx__$1;
var G__91392 = cljs.core.cons(new cljs.core.Symbol(null,"do","do",1686842252,null),cljs.core.rest(finally$));
return (sci.impl.analyzer.analyze.cljs$core$IFn$_invoke$arity$2 ? sci.impl.analyzer.analyze.cljs$core$IFn$_invoke$arity$2(G__91391,G__91392) : sci.impl.analyzer.analyze.call(null,G__91391,G__91392));
})():null);
return sci.impl.types.__GT_NodeR((function (this$,ctx__$2,bindings){
return sci.impl.evaluator.eval_try(ctx__$2,bindings,body__$1,catches__$1,finally$__$1);
}),null);
});
sci.impl.analyzer.analyze_throw = (function sci$impl$analyzer$analyze_throw(ctx,p__91393){
var vec__91394 = p__91393;
var _throw = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__91394,(0),null);
var ex = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__91394,(1),null);
var expr = vec__91394;
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2((2),cljs.core.count(expr))){
} else {
sci.impl.analyzer.throw_error_with_location("Too many arguments to throw",expr);
}

var ctx__$1 = sci.impl.analyzer.without_recur_target(ctx);
var ana = (sci.impl.analyzer.analyze.cljs$core$IFn$_invoke$arity$2 ? sci.impl.analyzer.analyze.cljs$core$IFn$_invoke$arity$2(ctx__$1,ex) : sci.impl.analyzer.analyze.call(null,ctx__$1,ex));
var stack = cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(cljs.core.meta(expr),new cljs.core.Keyword(null,"ns","ns",441598760),cljs.core.deref(sci.impl.vars.current_ns),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"file","file",-1269645878),cljs.core.deref(sci.impl.vars.current_file),new cljs.core.Keyword(null,"special","special",-1125941630),true], 0));
return sci.impl.types.__GT_NodeR((function (this$,ctx__$2,bindings){
return sci.impl.utils.rethrow_with_location_of_node.cljs$core$IFn$_invoke$arity$4(ctx__$2,bindings,sci.impl.types.eval(ana,ctx__$2,bindings),this$);
}),stack);
});
sci.impl.analyzer.analyze_dot = (function sci$impl$analyzer$analyze_dot(ctx,p__91397){
var vec__91398 = p__91397;
var seq__91399 = cljs.core.seq(vec__91398);
var first__91400 = cljs.core.first(seq__91399);
var seq__91399__$1 = cljs.core.next(seq__91399);
var _dot = first__91400;
var first__91400__$1 = cljs.core.first(seq__91399__$1);
var seq__91399__$2 = cljs.core.next(seq__91399__$1);
var instance_expr = first__91400__$1;
var first__91400__$2 = cljs.core.first(seq__91399__$2);
var seq__91399__$3 = cljs.core.next(seq__91399__$2);
var method_expr = first__91400__$2;
var args = seq__91399__$3;
var expr = vec__91398;
var ctx__$1 = sci.impl.analyzer.without_recur_target(ctx);
var vec__91401 = ((cljs.core.seq_QMARK_(method_expr))?method_expr:cljs.core.cons(method_expr,args));
var seq__91402 = cljs.core.seq(vec__91401);
var first__91403 = cljs.core.first(seq__91402);
var seq__91402__$1 = cljs.core.next(seq__91402);
var method_expr__$1 = first__91403;
var args__$1 = seq__91402__$1;
var instance_expr__$1 = (sci.impl.analyzer.analyze.cljs$core$IFn$_invoke$arity$2 ? sci.impl.analyzer.analyze.cljs$core$IFn$_invoke$arity$2(ctx__$1,instance_expr) : sci.impl.analyzer.analyze.call(null,ctx__$1,instance_expr));
var method_name = cljs.core.name(method_expr__$1);
var args__$2 = ((args__$1)?sci.impl.analyzer.analyze_children(ctx__$1,args__$1):null);
var res = (function (){var field_access = clojure.string.starts_with_QMARK_(method_name,"-");
var meth_name = ((field_access)?cljs.core.subs.cljs$core$IFn$_invoke$arity$2(method_name,(1)):method_name);
var stack = cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(cljs.core.meta(expr),new cljs.core.Keyword(null,"ns","ns",441598760),cljs.core.deref(sci.impl.vars.current_ns),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"file","file",-1269645878),cljs.core.deref(sci.impl.vars.current_file)], 0));
var allowed_QMARK_ = (method_expr__$1 === sci.impl.utils.allowed_append);
return cljs.core.with_meta(sci.impl.types.__GT_NodeR((function (this$,ctx__$2,bindings){
return sci.impl.evaluator.eval_instance_method_invocation(ctx__$2,bindings,instance_expr__$1,meth_name,field_access,args__$2,allowed_QMARK_);
}),stack),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("sci.impl.analyzer","instance-expr","sci.impl.analyzer/instance-expr",629338719),instance_expr__$1,new cljs.core.Keyword("sci.impl.analyzer","method-name","sci.impl.analyzer/method-name",-842600667),method_name], null));
})();
return res;
});
/**
 * Expands (. x method)
 */
sci.impl.analyzer.expand_dot_STAR__STAR_ = (function sci$impl$analyzer$expand_dot_STAR__STAR_(ctx,expr){
if((cljs.core.count(expr) < (3))){
throw (new Error("Malformed member expression, expecting (.member target ...)"));
} else {
}

return sci.impl.analyzer.analyze_dot(ctx,expr);
});
/**
 * Expands (.foo x)
 */
sci.impl.analyzer.expand_dot_STAR_ = (function sci$impl$analyzer$expand_dot_STAR_(ctx,p__91404){
var vec__91405 = p__91404;
var seq__91406 = cljs.core.seq(vec__91405);
var first__91407 = cljs.core.first(seq__91406);
var seq__91406__$1 = cljs.core.next(seq__91406);
var method_name = first__91407;
var first__91407__$1 = cljs.core.first(seq__91406__$1);
var seq__91406__$2 = cljs.core.next(seq__91406__$1);
var obj = first__91407__$1;
var args = seq__91406__$2;
var expr = vec__91405;
if((cljs.core.count(expr) < (2))){
throw (new Error("Malformed member expression, expecting (.member target ...)"));
} else {
}

return sci.impl.analyzer.analyze_dot(ctx,(new cljs.core.List(null,new cljs.core.Symbol(null,".",".",1975675962,null),(new cljs.core.List(null,obj,(new cljs.core.List(null,cljs.core.cons(cljs.core.symbol.cljs$core$IFn$_invoke$arity$1(cljs.core.subs.cljs$core$IFn$_invoke$arity$2(cljs.core.name(method_name),(1))),args),null,(1),null)),(2),null)),(3),null)));
});
sci.impl.analyzer.analyze_new = (function sci$impl$analyzer$analyze_new(ctx,p__91415){
var vec__91416 = p__91415;
var seq__91417 = cljs.core.seq(vec__91416);
var first__91418 = cljs.core.first(seq__91417);
var seq__91417__$1 = cljs.core.next(seq__91417);
var _new = first__91418;
var first__91418__$1 = cljs.core.first(seq__91417__$1);
var seq__91417__$2 = cljs.core.next(seq__91417__$1);
var class_sym = first__91418__$1;
var args = seq__91417__$2;
var expr = vec__91416;
var ctx__$1 = sci.impl.analyzer.without_recur_target(ctx);
if((class_sym instanceof cljs.core.Symbol)){
var temp__5802__auto__ = (function (){var or__5002__auto__ = (function (){var temp__5804__auto__ = (function (){var temp__5804__auto__ = sci.impl.interop.resolve_class_opts(ctx__$1,class_sym);
if(cljs.core.truth_(temp__5804__auto__)){
var opts = temp__5804__auto__;
var or__5002__auto__ = new cljs.core.Keyword(null,"constructor","constructor",-1953928811).cljs$core$IFn$_invoke$arity$1(opts);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword(null,"class","class",-2030961996).cljs$core$IFn$_invoke$arity$1(opts);
}
} else {
return null;
}
})();
if(cljs.core.truth_(temp__5804__auto__)){
var clazz = temp__5804__auto__;
return clazz;
} else {
return null;
}
})();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return sci.impl.resolve.resolve_symbol.cljs$core$IFn$_invoke$arity$3(ctx__$1,class_sym,false);
}
})();
if(cljs.core.truth_(temp__5802__auto__)){
var class$ = temp__5802__auto__;
var args__$1 = sci.impl.analyzer.analyze_children(ctx__$1,args);
var var_QMARK_ = sci.impl.vars.var_QMARK_(class$);
var maybe_var = ((var_QMARK_)?class$:null);
var maybe_record = ((var_QMARK_)?cljs.core.deref(maybe_var):(((class$ instanceof cljs.core.Symbol))?class$:null));
var maybe_record_constructor = (cljs.core.truth_(maybe_record)?new cljs.core.Keyword("sci.impl.record","constructor","sci.impl.record/constructor",-2025684209).cljs$core$IFn$_invoke$arity$1(cljs.core.meta(maybe_record)):null);
if(cljs.core.truth_(maybe_record_constructor)){
var G__91421 = ctx__$1;
var G__91422 = expr;
var G__91423 = maybe_record_constructor;
var G__91424 = args__$1;
var G__91425 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(cljs.core.meta(expr),new cljs.core.Keyword(null,"ns","ns",441598760),cljs.core.deref(sci.impl.vars.current_ns),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"file","file",-1269645878),cljs.core.deref(sci.impl.vars.current_file)], 0));
var G__91426 = null;
return (sci.impl.analyzer.return_call.cljs$core$IFn$_invoke$arity$6 ? sci.impl.analyzer.return_call.cljs$core$IFn$_invoke$arity$6(G__91421,G__91422,G__91423,G__91424,G__91425,G__91426) : sci.impl.analyzer.return_call.call(null,G__91421,G__91422,G__91423,G__91424,G__91425,G__91426));
} else {
if(var_QMARK_){
return sci.impl.types.__GT_NodeR((function (this$,ctx__$2,bindings){
return sci.impl.interop.invoke_constructor(cljs.core.deref(maybe_var),cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (p1__91409_SHARP_){
return sci.impl.types.eval(p1__91409_SHARP_,ctx__$2,bindings);
}),args__$1));
}),null);
} else {
if((class$ instanceof sci.impl.types.NodeR)){
return sci.impl.types.__GT_NodeR((function (this$,ctx__$2,bindings){
return sci.impl.interop.invoke_constructor(sci.impl.types.eval(class$,ctx__$2,bindings),cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (p1__91410_SHARP_){
return sci.impl.types.eval(p1__91410_SHARP_,ctx__$2,bindings);
}),args__$1));
}),null);
} else {
return sci.impl.types.__GT_NodeR((function (this$,ctx__$2,bindings){
return sci.impl.interop.invoke_constructor(class$,cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (p1__91411_SHARP_){
return sci.impl.types.eval(p1__91411_SHARP_,ctx__$2,bindings);
}),args__$1));
}),null);

}
}
}
} else {
var temp__5802__auto____$1 = sci.impl.records.resolve_record_class(ctx__$1,class_sym);
if(cljs.core.truth_(temp__5802__auto____$1)){
var record = temp__5802__auto____$1;
var args__$1 = sci.impl.analyzer.analyze_children(ctx__$1,args);
var G__91431 = ctx__$1;
var G__91432 = expr;
var G__91433 = new cljs.core.Keyword("sci.impl.record","constructor","sci.impl.record/constructor",-2025684209).cljs$core$IFn$_invoke$arity$1(cljs.core.meta(record));
var G__91434 = args__$1;
var G__91435 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(cljs.core.meta(expr),new cljs.core.Keyword(null,"ns","ns",441598760),cljs.core.deref(sci.impl.vars.current_ns),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"file","file",-1269645878),cljs.core.deref(sci.impl.vars.current_file)], 0));
var G__91436 = null;
return (sci.impl.analyzer.return_call.cljs$core$IFn$_invoke$arity$6 ? sci.impl.analyzer.return_call.cljs$core$IFn$_invoke$arity$6(G__91431,G__91432,G__91433,G__91434,G__91435,G__91436) : sci.impl.analyzer.return_call.call(null,G__91431,G__91432,G__91433,G__91434,G__91435,G__91436));
} else {
return sci.impl.analyzer.throw_error_with_location(["Unable to resolve classname: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(class_sym)].join(''),class_sym);
}
}
} else {
var class$ = (sci.impl.analyzer.analyze.cljs$core$IFn$_invoke$arity$2 ? sci.impl.analyzer.analyze.cljs$core$IFn$_invoke$arity$2(ctx__$1,class_sym) : sci.impl.analyzer.analyze.call(null,ctx__$1,class_sym));
var args__$1 = sci.impl.analyzer.analyze_children(ctx__$1,args);
return sci.impl.types.__GT_NodeR((function (this$,ctx__$2,bindings){
return sci.impl.interop.invoke_constructor(sci.impl.types.eval(class$,ctx__$2,bindings),cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (p1__91413_SHARP_){
return sci.impl.types.eval(p1__91413_SHARP_,ctx__$2,bindings);
}),args__$1));
}),null);
}
});
sci.impl.analyzer.expand_constructor = (function sci$impl$analyzer$expand_constructor(ctx,p__91437){
var vec__91438 = p__91437;
var seq__91439 = cljs.core.seq(vec__91438);
var first__91440 = cljs.core.first(seq__91439);
var seq__91439__$1 = cljs.core.next(seq__91439);
var constructor_sym = first__91440;
var args = seq__91439__$1;
var constructor_name = cljs.core.name(constructor_sym);
var class_sym = cljs.core.with_meta(cljs.core.symbol.cljs$core$IFn$_invoke$arity$1(cljs.core.subs.cljs$core$IFn$_invoke$arity$3(constructor_name,(0),(((constructor_name).length) - (1)))),cljs.core.meta(constructor_sym));
return sci.impl.analyzer.analyze_new(ctx,cljs.core.with_meta(cljs.core.list_STAR_.cljs$core$IFn$_invoke$arity$3(new cljs.core.Symbol(null,"new","new",-444906321,null),class_sym,args),cljs.core.meta(constructor_sym)));
});
sci.impl.analyzer.return_ns_op = (function sci$impl$analyzer$return_ns_op(_ctx,f,expr,analyzed_args){
var stack = cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(cljs.core.meta(expr),new cljs.core.Keyword(null,"file","file",-1269645878),cljs.core.deref(sci.impl.vars.current_file),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"ns","ns",441598760),cljs.core.deref(sci.impl.vars.current_ns)], 0));
return sci.impl.types.__GT_NodeR((function (this$,ctx,bindings){
try{return cljs.core.apply.cljs$core$IFn$_invoke$arity$3(f,ctx,analyzed_args);
}catch (e91443){if((e91443 instanceof Error)){
var e = e91443;
return sci.impl.utils.rethrow_with_location_of_node.cljs$core$IFn$_invoke$arity$4(ctx,bindings,e,this$);
} else {
throw e91443;

}
}}),stack);
});
sci.impl.analyzer.analyze_ns_form = (function sci$impl$analyzer$analyze_ns_form(ctx,p__91446){
var vec__91447 = p__91446;
var seq__91448 = cljs.core.seq(vec__91447);
var first__91449 = cljs.core.first(seq__91448);
var seq__91448__$1 = cljs.core.next(seq__91448);
var _ns = first__91449;
var first__91449__$1 = cljs.core.first(seq__91448__$1);
var seq__91448__$2 = cljs.core.next(seq__91448__$1);
var ns_name = first__91449__$1;
var exprs = seq__91448__$2;
var expr = vec__91447;
if((ns_name instanceof cljs.core.Symbol)){
} else {
throw (new Error(["Namespace name must be symbol, got: ",cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([ns_name], 0))].join('')));
}

var vec__91450 = (function (){var fexpr = cljs.core.first(exprs);
if(typeof fexpr === 'string'){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [fexpr,cljs.core.next(exprs)], null);
} else {
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [null,exprs], null);
}
})();
var docstring = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__91450,(0),null);
var exprs__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__91450,(1),null);
var vec__91453 = (function (){var m = cljs.core.first(exprs__$1);
if(cljs.core.map_QMARK_(m)){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [m,cljs.core.next(exprs__$1)], null);
} else {
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [null,exprs__$1], null);
}
})();
var attr_map = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__91453,(0),null);
var exprs__$2 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__91453,(1),null);
var attr_map__$1 = (cljs.core.truth_(docstring)?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(attr_map,new cljs.core.Keyword(null,"doc","doc",1913296891),docstring):attr_map);
sci.impl.utils.set_namespace_BANG_(ctx,ns_name,attr_map__$1);

var exprs__$3 = exprs__$2;
var ret = cljs.core.PersistentVector.EMPTY;
while(true){
if(cljs.core.truth_(exprs__$3)){
var vec__91462 = cljs.core.first(exprs__$3);
var seq__91463 = cljs.core.seq(vec__91462);
var first__91464 = cljs.core.first(seq__91463);
var seq__91463__$1 = cljs.core.next(seq__91463);
var k = first__91464;
var args = seq__91463__$1;
var expr__$1 = vec__91462;
var G__91465 = k;
var G__91465__$1 = (((G__91465 instanceof cljs.core.Keyword))?G__91465.fqn:null);
switch (G__91465__$1) {
case "require":
case "use":
case "import":
case "refer-clojure":
var G__92773 = cljs.core.next(exprs__$3);
var G__92774 = cljs.core.conj.cljs$core$IFn$_invoke$arity$2(ret,sci.impl.analyzer.return_ns_op(ctx,(function (){var G__91466 = k;
var G__91466__$1 = (((G__91466 instanceof cljs.core.Keyword))?G__91466.fqn:null);
switch (G__91466__$1) {
case "require":
return sci.impl.load.eval_require;

break;
case "use":
return sci.impl.load.eval_use;

break;
case "import":
return sci.impl.evaluator.eval_import;

break;
case "refer-clojure":
return ((function (exprs__$3,ret,G__91466,G__91466__$1,G__91465,G__91465__$1,vec__91462,seq__91463,first__91464,seq__91463__$1,k,args,expr__$1,vec__91450,docstring,exprs__$1,vec__91453,attr_map,exprs__$2,attr_map__$1,vec__91447,seq__91448,first__91449,seq__91448__$1,_ns,first__91449__$1,seq__91448__$2,ns_name,exprs,expr){
return (function() { 
var G__92778__delegate = function (ctx__$1,args__$1){
return cljs.core.apply.cljs$core$IFn$_invoke$arity$4(sci.impl.load.eval_refer,ctx__$1,new cljs.core.Symbol(null,"clojure.core","clojure.core",-189332625,null),args__$1);
};
var G__92778 = function (ctx__$1,var_args){
var args__$1 = null;
if (arguments.length > 1) {
var G__92779__i = 0, G__92779__a = new Array(arguments.length -  1);
while (G__92779__i < G__92779__a.length) {G__92779__a[G__92779__i] = arguments[G__92779__i + 1]; ++G__92779__i;}
  args__$1 = new cljs.core.IndexedSeq(G__92779__a,0,null);
} 
return G__92778__delegate.call(this,ctx__$1,args__$1);};
G__92778.cljs$lang$maxFixedArity = 1;
G__92778.cljs$lang$applyTo = (function (arglist__92780){
var ctx__$1 = cljs.core.first(arglist__92780);
var args__$1 = cljs.core.rest(arglist__92780);
return G__92778__delegate(ctx__$1,args__$1);
});
G__92778.cljs$core$IFn$_invoke$arity$variadic = G__92778__delegate;
return G__92778;
})()
;
;})(exprs__$3,ret,G__91466,G__91466__$1,G__91465,G__91465__$1,vec__91462,seq__91463,first__91464,seq__91463__$1,k,args,expr__$1,vec__91450,docstring,exprs__$1,vec__91453,attr_map,exprs__$2,attr_map__$1,vec__91447,seq__91448,first__91449,seq__91448__$1,_ns,first__91449__$1,seq__91448__$2,ns_name,exprs,expr))

break;
default:
throw (new Error(["No matching clause: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(G__91466__$1)].join('')));

}
})(),expr__$1,args));
exprs__$3 = G__92773;
ret = G__92774;
continue;

break;
case "gen-class":
var G__92781 = cljs.core.next(exprs__$3);
var G__92782 = ret;
exprs__$3 = G__92781;
ret = G__92782;
continue;

break;
default:
throw (new Error(["No matching clause: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(G__91465__$1)].join('')));

}
} else {
return sci.impl.analyzer.return_do(ctx,expr,cljs.core.conj.cljs$core$IFn$_invoke$arity$2(ret,sci.impl.types.__GT_NodeR(((function (exprs__$3,ret,vec__91450,docstring,exprs__$1,vec__91453,attr_map,exprs__$2,attr_map__$1,vec__91447,seq__91448,first__91449,seq__91448__$1,_ns,first__91449__$1,seq__91448__$2,ns_name,exprs,expr){
return (function (this$,ctx__$1,bindings){
sci.impl.load.add_loaded_lib(new cljs.core.Keyword(null,"env","env",-1815813235).cljs$core$IFn$_invoke$arity$1(ctx__$1),ns_name);

return null;
});})(exprs__$3,ret,vec__91450,docstring,exprs__$1,vec__91453,attr_map,exprs__$2,attr_map__$1,vec__91447,seq__91448,first__91449,seq__91448__$1,_ns,first__91449__$1,seq__91448__$2,ns_name,exprs,expr))
,null)));
}
break;
}
});
sci.impl.analyzer.analyze_var = (function sci$impl$analyzer$analyze_var(ctx,p__91467){
var vec__91468 = p__91467;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__91468,(0),null);
var var_name = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__91468,(1),null);
return sci.impl.resolve.resolve_symbol.cljs$core$IFn$_invoke$arity$2(ctx,var_name);
});
sci.impl.analyzer.analyze_set_BANG_ = (function sci$impl$analyzer$analyze_set_BANG_(ctx,p__91471){
var vec__91472 = p__91471;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__91472,(0),null);
var obj = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__91472,(1),null);
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__91472,(2),null);
var expr = vec__91472;
if((obj instanceof cljs.core.Symbol)){
var obj__$1 = sci.impl.resolve.resolve_symbol.cljs$core$IFn$_invoke$arity$2(ctx,obj);
var ___$1 = ((sci.impl.vars.var_QMARK_(obj__$1))?null:sci.impl.analyzer.throw_error_with_location("Invalid assignment target",expr));
var v__$1 = (sci.impl.analyzer.analyze.cljs$core$IFn$_invoke$arity$2 ? sci.impl.analyzer.analyze.cljs$core$IFn$_invoke$arity$2(ctx,v) : sci.impl.analyzer.analyze.call(null,ctx,v));
return sci.impl.types.__GT_NodeR((function (this$,ctx__$1,bindings){
var v__$2 = sci.impl.types.eval(v__$1,ctx__$1,bindings);
return sci.impl.types.setVal(obj__$1,v__$2);
}),null);
} else {
if(cljs.core.seq_QMARK_(obj)){
var obj__$1 = (sci.impl.analyzer.analyze.cljs$core$IFn$_invoke$arity$2 ? sci.impl.analyzer.analyze.cljs$core$IFn$_invoke$arity$2(ctx,obj) : sci.impl.analyzer.analyze.call(null,ctx,obj));
var v__$1 = (sci.impl.analyzer.analyze.cljs$core$IFn$_invoke$arity$2 ? sci.impl.analyzer.analyze.cljs$core$IFn$_invoke$arity$2(ctx,v) : sci.impl.analyzer.analyze.call(null,ctx,v));
var info = cljs.core.meta(obj__$1);
var k = cljs.core.subs.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("sci.impl.analyzer","method-name","sci.impl.analyzer/method-name",-842600667).cljs$core$IFn$_invoke$arity$1(info),(1));
var obj__$2 = new cljs.core.Keyword("sci.impl.analyzer","instance-expr","sci.impl.analyzer/instance-expr",629338719).cljs$core$IFn$_invoke$arity$1(info);
return sci.impl.types.__GT_NodeR((function (this$,ctx__$1,bindings){
var obj__$3 = sci.impl.types.eval(obj__$2,ctx__$1,bindings);
var v__$2 = sci.impl.types.eval(v__$1,ctx__$1,bindings);
return sci.impl.analyzer.goog$module$goog$object.set(obj__$3,k,v__$2);
}),null);
} else {
return sci.impl.analyzer.throw_error_with_location("Invalid assignment target",expr);

}
}
});
sci.impl.analyzer.return_binding_call = (function sci$impl$analyzer$return_binding_call(_ctx,expr,idx,f,analyzed_children,stack){
var G__91476 = cljs.core.count(analyzed_children);
switch (G__91476) {
case (0):
return sci.impl.types.__GT_NodeR((function (this$,ctx,bindings){
try{var fexpr__91478 = (bindings[idx]);
return (fexpr__91478.cljs$core$IFn$_invoke$arity$0 ? fexpr__91478.cljs$core$IFn$_invoke$arity$0() : fexpr__91478.call(null));
}catch (e91477){if((e91477 instanceof Error)){
var e__90522__auto__ = e91477;
return sci.impl.utils.rethrow_with_location_of_node.cljs$core$IFn$_invoke$arity$4(ctx,bindings,e__90522__auto__,this$);
} else {
throw e91477;

}
}}),stack);

break;
case (1):
var arg0 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(0));
return sci.impl.types.__GT_NodeR((function (this$,ctx,bindings){
try{var G__91481 = sci.impl.types.eval(arg0,ctx,bindings);
var fexpr__91480 = (bindings[idx]);
return (fexpr__91480.cljs$core$IFn$_invoke$arity$1 ? fexpr__91480.cljs$core$IFn$_invoke$arity$1(G__91481) : fexpr__91480.call(null,G__91481));
}catch (e91479){if((e91479 instanceof Error)){
var e__90522__auto__ = e91479;
return sci.impl.utils.rethrow_with_location_of_node.cljs$core$IFn$_invoke$arity$4(ctx,bindings,e__90522__auto__,this$);
} else {
throw e91479;

}
}}),stack);

break;
case (2):
var arg0 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(0));
var arg1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(1));
return sci.impl.types.__GT_NodeR((function (this$,ctx,bindings){
try{var G__91484 = sci.impl.types.eval(arg0,ctx,bindings);
var G__91485 = sci.impl.types.eval(arg1,ctx,bindings);
var fexpr__91483 = (bindings[idx]);
return (fexpr__91483.cljs$core$IFn$_invoke$arity$2 ? fexpr__91483.cljs$core$IFn$_invoke$arity$2(G__91484,G__91485) : fexpr__91483.call(null,G__91484,G__91485));
}catch (e91482){if((e91482 instanceof Error)){
var e__90522__auto__ = e91482;
return sci.impl.utils.rethrow_with_location_of_node.cljs$core$IFn$_invoke$arity$4(ctx,bindings,e__90522__auto__,this$);
} else {
throw e91482;

}
}}),stack);

break;
case (3):
var arg0 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(0));
var arg1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(1));
var arg2 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(2));
return sci.impl.types.__GT_NodeR((function (this$,ctx,bindings){
try{var G__91488 = sci.impl.types.eval(arg0,ctx,bindings);
var G__91489 = sci.impl.types.eval(arg1,ctx,bindings);
var G__91490 = sci.impl.types.eval(arg2,ctx,bindings);
var fexpr__91487 = (bindings[idx]);
return (fexpr__91487.cljs$core$IFn$_invoke$arity$3 ? fexpr__91487.cljs$core$IFn$_invoke$arity$3(G__91488,G__91489,G__91490) : fexpr__91487.call(null,G__91488,G__91489,G__91490));
}catch (e91486){if((e91486 instanceof Error)){
var e__90522__auto__ = e91486;
return sci.impl.utils.rethrow_with_location_of_node.cljs$core$IFn$_invoke$arity$4(ctx,bindings,e__90522__auto__,this$);
} else {
throw e91486;

}
}}),stack);

break;
case (4):
var arg0 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(0));
var arg1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(1));
var arg2 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(2));
var arg3 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(3));
return sci.impl.types.__GT_NodeR((function (this$,ctx,bindings){
try{var G__91493 = sci.impl.types.eval(arg0,ctx,bindings);
var G__91494 = sci.impl.types.eval(arg1,ctx,bindings);
var G__91495 = sci.impl.types.eval(arg2,ctx,bindings);
var G__91496 = sci.impl.types.eval(arg3,ctx,bindings);
var fexpr__91492 = (bindings[idx]);
return (fexpr__91492.cljs$core$IFn$_invoke$arity$4 ? fexpr__91492.cljs$core$IFn$_invoke$arity$4(G__91493,G__91494,G__91495,G__91496) : fexpr__91492.call(null,G__91493,G__91494,G__91495,G__91496));
}catch (e91491){if((e91491 instanceof Error)){
var e__90522__auto__ = e91491;
return sci.impl.utils.rethrow_with_location_of_node.cljs$core$IFn$_invoke$arity$4(ctx,bindings,e__90522__auto__,this$);
} else {
throw e91491;

}
}}),stack);

break;
case (5):
var arg0 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(0));
var arg1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(1));
var arg2 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(2));
var arg3 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(3));
var arg4 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(4));
return sci.impl.types.__GT_NodeR((function (this$,ctx,bindings){
try{var G__91499 = sci.impl.types.eval(arg0,ctx,bindings);
var G__91500 = sci.impl.types.eval(arg1,ctx,bindings);
var G__91501 = sci.impl.types.eval(arg2,ctx,bindings);
var G__91502 = sci.impl.types.eval(arg3,ctx,bindings);
var G__91503 = sci.impl.types.eval(arg4,ctx,bindings);
var fexpr__91498 = (bindings[idx]);
return (fexpr__91498.cljs$core$IFn$_invoke$arity$5 ? fexpr__91498.cljs$core$IFn$_invoke$arity$5(G__91499,G__91500,G__91501,G__91502,G__91503) : fexpr__91498.call(null,G__91499,G__91500,G__91501,G__91502,G__91503));
}catch (e91497){if((e91497 instanceof Error)){
var e__90522__auto__ = e91497;
return sci.impl.utils.rethrow_with_location_of_node.cljs$core$IFn$_invoke$arity$4(ctx,bindings,e__90522__auto__,this$);
} else {
throw e91497;

}
}}),stack);

break;
case (6):
var arg0 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(0));
var arg1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(1));
var arg2 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(2));
var arg3 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(3));
var arg4 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(4));
var arg5 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(5));
return sci.impl.types.__GT_NodeR((function (this$,ctx,bindings){
try{var G__91506 = sci.impl.types.eval(arg0,ctx,bindings);
var G__91507 = sci.impl.types.eval(arg1,ctx,bindings);
var G__91508 = sci.impl.types.eval(arg2,ctx,bindings);
var G__91509 = sci.impl.types.eval(arg3,ctx,bindings);
var G__91510 = sci.impl.types.eval(arg4,ctx,bindings);
var G__91511 = sci.impl.types.eval(arg5,ctx,bindings);
var fexpr__91505 = (bindings[idx]);
return (fexpr__91505.cljs$core$IFn$_invoke$arity$6 ? fexpr__91505.cljs$core$IFn$_invoke$arity$6(G__91506,G__91507,G__91508,G__91509,G__91510,G__91511) : fexpr__91505.call(null,G__91506,G__91507,G__91508,G__91509,G__91510,G__91511));
}catch (e91504){if((e91504 instanceof Error)){
var e__90522__auto__ = e91504;
return sci.impl.utils.rethrow_with_location_of_node.cljs$core$IFn$_invoke$arity$4(ctx,bindings,e__90522__auto__,this$);
} else {
throw e91504;

}
}}),stack);

break;
case (7):
var arg0 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(0));
var arg1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(1));
var arg2 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(2));
var arg3 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(3));
var arg4 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(4));
var arg5 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(5));
var arg6 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(6));
return sci.impl.types.__GT_NodeR((function (this$,ctx,bindings){
try{var G__91514 = sci.impl.types.eval(arg0,ctx,bindings);
var G__91515 = sci.impl.types.eval(arg1,ctx,bindings);
var G__91516 = sci.impl.types.eval(arg2,ctx,bindings);
var G__91517 = sci.impl.types.eval(arg3,ctx,bindings);
var G__91518 = sci.impl.types.eval(arg4,ctx,bindings);
var G__91519 = sci.impl.types.eval(arg5,ctx,bindings);
var G__91520 = sci.impl.types.eval(arg6,ctx,bindings);
var fexpr__91513 = (bindings[idx]);
return (fexpr__91513.cljs$core$IFn$_invoke$arity$7 ? fexpr__91513.cljs$core$IFn$_invoke$arity$7(G__91514,G__91515,G__91516,G__91517,G__91518,G__91519,G__91520) : fexpr__91513.call(null,G__91514,G__91515,G__91516,G__91517,G__91518,G__91519,G__91520));
}catch (e91512){if((e91512 instanceof Error)){
var e__90522__auto__ = e91512;
return sci.impl.utils.rethrow_with_location_of_node.cljs$core$IFn$_invoke$arity$4(ctx,bindings,e__90522__auto__,this$);
} else {
throw e91512;

}
}}),stack);

break;
case (8):
var arg0 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(0));
var arg1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(1));
var arg2 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(2));
var arg3 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(3));
var arg4 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(4));
var arg5 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(5));
var arg6 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(6));
var arg7 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(7));
return sci.impl.types.__GT_NodeR((function (this$,ctx,bindings){
try{var G__91523 = sci.impl.types.eval(arg0,ctx,bindings);
var G__91524 = sci.impl.types.eval(arg1,ctx,bindings);
var G__91525 = sci.impl.types.eval(arg2,ctx,bindings);
var G__91526 = sci.impl.types.eval(arg3,ctx,bindings);
var G__91527 = sci.impl.types.eval(arg4,ctx,bindings);
var G__91528 = sci.impl.types.eval(arg5,ctx,bindings);
var G__91529 = sci.impl.types.eval(arg6,ctx,bindings);
var G__91530 = sci.impl.types.eval(arg7,ctx,bindings);
var fexpr__91522 = (bindings[idx]);
return (fexpr__91522.cljs$core$IFn$_invoke$arity$8 ? fexpr__91522.cljs$core$IFn$_invoke$arity$8(G__91523,G__91524,G__91525,G__91526,G__91527,G__91528,G__91529,G__91530) : fexpr__91522.call(null,G__91523,G__91524,G__91525,G__91526,G__91527,G__91528,G__91529,G__91530));
}catch (e91521){if((e91521 instanceof Error)){
var e__90522__auto__ = e91521;
return sci.impl.utils.rethrow_with_location_of_node.cljs$core$IFn$_invoke$arity$4(ctx,bindings,e__90522__auto__,this$);
} else {
throw e91521;

}
}}),stack);

break;
case (9):
var arg0 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(0));
var arg1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(1));
var arg2 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(2));
var arg3 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(3));
var arg4 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(4));
var arg5 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(5));
var arg6 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(6));
var arg7 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(7));
var arg8 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(8));
return sci.impl.types.__GT_NodeR((function (this$,ctx,bindings){
try{var G__91533 = sci.impl.types.eval(arg0,ctx,bindings);
var G__91534 = sci.impl.types.eval(arg1,ctx,bindings);
var G__91535 = sci.impl.types.eval(arg2,ctx,bindings);
var G__91536 = sci.impl.types.eval(arg3,ctx,bindings);
var G__91537 = sci.impl.types.eval(arg4,ctx,bindings);
var G__91538 = sci.impl.types.eval(arg5,ctx,bindings);
var G__91539 = sci.impl.types.eval(arg6,ctx,bindings);
var G__91540 = sci.impl.types.eval(arg7,ctx,bindings);
var G__91541 = sci.impl.types.eval(arg8,ctx,bindings);
var fexpr__91532 = (bindings[idx]);
return (fexpr__91532.cljs$core$IFn$_invoke$arity$9 ? fexpr__91532.cljs$core$IFn$_invoke$arity$9(G__91533,G__91534,G__91535,G__91536,G__91537,G__91538,G__91539,G__91540,G__91541) : fexpr__91532.call(null,G__91533,G__91534,G__91535,G__91536,G__91537,G__91538,G__91539,G__91540,G__91541));
}catch (e91531){if((e91531 instanceof Error)){
var e__90522__auto__ = e91531;
return sci.impl.utils.rethrow_with_location_of_node.cljs$core$IFn$_invoke$arity$4(ctx,bindings,e__90522__auto__,this$);
} else {
throw e91531;

}
}}),stack);

break;
case (10):
var arg0 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(0));
var arg1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(1));
var arg2 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(2));
var arg3 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(3));
var arg4 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(4));
var arg5 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(5));
var arg6 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(6));
var arg7 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(7));
var arg8 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(8));
var arg9 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(9));
return sci.impl.types.__GT_NodeR((function (this$,ctx,bindings){
try{var G__91544 = sci.impl.types.eval(arg0,ctx,bindings);
var G__91545 = sci.impl.types.eval(arg1,ctx,bindings);
var G__91546 = sci.impl.types.eval(arg2,ctx,bindings);
var G__91547 = sci.impl.types.eval(arg3,ctx,bindings);
var G__91548 = sci.impl.types.eval(arg4,ctx,bindings);
var G__91549 = sci.impl.types.eval(arg5,ctx,bindings);
var G__91550 = sci.impl.types.eval(arg6,ctx,bindings);
var G__91551 = sci.impl.types.eval(arg7,ctx,bindings);
var G__91552 = sci.impl.types.eval(arg8,ctx,bindings);
var G__91553 = sci.impl.types.eval(arg9,ctx,bindings);
var fexpr__91543 = (bindings[idx]);
return (fexpr__91543.cljs$core$IFn$_invoke$arity$10 ? fexpr__91543.cljs$core$IFn$_invoke$arity$10(G__91544,G__91545,G__91546,G__91547,G__91548,G__91549,G__91550,G__91551,G__91552,G__91553) : fexpr__91543.call(null,G__91544,G__91545,G__91546,G__91547,G__91548,G__91549,G__91550,G__91551,G__91552,G__91553));
}catch (e91542){if((e91542 instanceof Error)){
var e__90522__auto__ = e91542;
return sci.impl.utils.rethrow_with_location_of_node.cljs$core$IFn$_invoke$arity$4(ctx,bindings,e__90522__auto__,this$);
} else {
throw e91542;

}
}}),stack);

break;
case (11):
var arg0 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(0));
var arg1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(1));
var arg2 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(2));
var arg3 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(3));
var arg4 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(4));
var arg5 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(5));
var arg6 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(6));
var arg7 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(7));
var arg8 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(8));
var arg9 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(9));
var arg10 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(10));
return sci.impl.types.__GT_NodeR((function (this$,ctx,bindings){
try{var G__91556 = sci.impl.types.eval(arg0,ctx,bindings);
var G__91557 = sci.impl.types.eval(arg1,ctx,bindings);
var G__91558 = sci.impl.types.eval(arg2,ctx,bindings);
var G__91559 = sci.impl.types.eval(arg3,ctx,bindings);
var G__91560 = sci.impl.types.eval(arg4,ctx,bindings);
var G__91561 = sci.impl.types.eval(arg5,ctx,bindings);
var G__91562 = sci.impl.types.eval(arg6,ctx,bindings);
var G__91563 = sci.impl.types.eval(arg7,ctx,bindings);
var G__91564 = sci.impl.types.eval(arg8,ctx,bindings);
var G__91565 = sci.impl.types.eval(arg9,ctx,bindings);
var G__91566 = sci.impl.types.eval(arg10,ctx,bindings);
var fexpr__91555 = (bindings[idx]);
return (fexpr__91555.cljs$core$IFn$_invoke$arity$11 ? fexpr__91555.cljs$core$IFn$_invoke$arity$11(G__91556,G__91557,G__91558,G__91559,G__91560,G__91561,G__91562,G__91563,G__91564,G__91565,G__91566) : fexpr__91555.call(null,G__91556,G__91557,G__91558,G__91559,G__91560,G__91561,G__91562,G__91563,G__91564,G__91565,G__91566));
}catch (e91554){if((e91554 instanceof Error)){
var e__90522__auto__ = e91554;
return sci.impl.utils.rethrow_with_location_of_node.cljs$core$IFn$_invoke$arity$4(ctx,bindings,e__90522__auto__,this$);
} else {
throw e91554;

}
}}),stack);

break;
case (12):
var arg0 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(0));
var arg1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(1));
var arg2 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(2));
var arg3 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(3));
var arg4 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(4));
var arg5 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(5));
var arg6 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(6));
var arg7 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(7));
var arg8 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(8));
var arg9 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(9));
var arg10 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(10));
var arg11 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(11));
return sci.impl.types.__GT_NodeR((function (this$,ctx,bindings){
try{var G__91572 = sci.impl.types.eval(arg0,ctx,bindings);
var G__91573 = sci.impl.types.eval(arg1,ctx,bindings);
var G__91574 = sci.impl.types.eval(arg2,ctx,bindings);
var G__91575 = sci.impl.types.eval(arg3,ctx,bindings);
var G__91576 = sci.impl.types.eval(arg4,ctx,bindings);
var G__91577 = sci.impl.types.eval(arg5,ctx,bindings);
var G__91578 = sci.impl.types.eval(arg6,ctx,bindings);
var G__91579 = sci.impl.types.eval(arg7,ctx,bindings);
var G__91580 = sci.impl.types.eval(arg8,ctx,bindings);
var G__91581 = sci.impl.types.eval(arg9,ctx,bindings);
var G__91582 = sci.impl.types.eval(arg10,ctx,bindings);
var G__91583 = sci.impl.types.eval(arg11,ctx,bindings);
var fexpr__91571 = (bindings[idx]);
return (fexpr__91571.cljs$core$IFn$_invoke$arity$12 ? fexpr__91571.cljs$core$IFn$_invoke$arity$12(G__91572,G__91573,G__91574,G__91575,G__91576,G__91577,G__91578,G__91579,G__91580,G__91581,G__91582,G__91583) : fexpr__91571.call(null,G__91572,G__91573,G__91574,G__91575,G__91576,G__91577,G__91578,G__91579,G__91580,G__91581,G__91582,G__91583));
}catch (e91567){if((e91567 instanceof Error)){
var e__90522__auto__ = e91567;
return sci.impl.utils.rethrow_with_location_of_node.cljs$core$IFn$_invoke$arity$4(ctx,bindings,e__90522__auto__,this$);
} else {
throw e91567;

}
}}),stack);

break;
case (13):
var arg0 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(0));
var arg1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(1));
var arg2 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(2));
var arg3 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(3));
var arg4 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(4));
var arg5 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(5));
var arg6 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(6));
var arg7 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(7));
var arg8 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(8));
var arg9 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(9));
var arg10 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(10));
var arg11 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(11));
var arg12 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(12));
return sci.impl.types.__GT_NodeR((function (this$,ctx,bindings){
try{var G__91587 = sci.impl.types.eval(arg0,ctx,bindings);
var G__91588 = sci.impl.types.eval(arg1,ctx,bindings);
var G__91589 = sci.impl.types.eval(arg2,ctx,bindings);
var G__91590 = sci.impl.types.eval(arg3,ctx,bindings);
var G__91591 = sci.impl.types.eval(arg4,ctx,bindings);
var G__91592 = sci.impl.types.eval(arg5,ctx,bindings);
var G__91593 = sci.impl.types.eval(arg6,ctx,bindings);
var G__91594 = sci.impl.types.eval(arg7,ctx,bindings);
var G__91595 = sci.impl.types.eval(arg8,ctx,bindings);
var G__91596 = sci.impl.types.eval(arg9,ctx,bindings);
var G__91597 = sci.impl.types.eval(arg10,ctx,bindings);
var G__91598 = sci.impl.types.eval(arg11,ctx,bindings);
var G__91599 = sci.impl.types.eval(arg12,ctx,bindings);
var fexpr__91586 = (bindings[idx]);
return (fexpr__91586.cljs$core$IFn$_invoke$arity$13 ? fexpr__91586.cljs$core$IFn$_invoke$arity$13(G__91587,G__91588,G__91589,G__91590,G__91591,G__91592,G__91593,G__91594,G__91595,G__91596,G__91597,G__91598,G__91599) : fexpr__91586.call(null,G__91587,G__91588,G__91589,G__91590,G__91591,G__91592,G__91593,G__91594,G__91595,G__91596,G__91597,G__91598,G__91599));
}catch (e91584){if((e91584 instanceof Error)){
var e__90522__auto__ = e91584;
return sci.impl.utils.rethrow_with_location_of_node.cljs$core$IFn$_invoke$arity$4(ctx,bindings,e__90522__auto__,this$);
} else {
throw e91584;

}
}}),stack);

break;
case (14):
var arg0 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(0));
var arg1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(1));
var arg2 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(2));
var arg3 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(3));
var arg4 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(4));
var arg5 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(5));
var arg6 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(6));
var arg7 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(7));
var arg8 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(8));
var arg9 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(9));
var arg10 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(10));
var arg11 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(11));
var arg12 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(12));
var arg13 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(13));
return sci.impl.types.__GT_NodeR((function (this$,ctx,bindings){
try{var G__91606 = sci.impl.types.eval(arg0,ctx,bindings);
var G__91607 = sci.impl.types.eval(arg1,ctx,bindings);
var G__91608 = sci.impl.types.eval(arg2,ctx,bindings);
var G__91609 = sci.impl.types.eval(arg3,ctx,bindings);
var G__91610 = sci.impl.types.eval(arg4,ctx,bindings);
var G__91611 = sci.impl.types.eval(arg5,ctx,bindings);
var G__91612 = sci.impl.types.eval(arg6,ctx,bindings);
var G__91613 = sci.impl.types.eval(arg7,ctx,bindings);
var G__91614 = sci.impl.types.eval(arg8,ctx,bindings);
var G__91615 = sci.impl.types.eval(arg9,ctx,bindings);
var G__91616 = sci.impl.types.eval(arg10,ctx,bindings);
var G__91617 = sci.impl.types.eval(arg11,ctx,bindings);
var G__91618 = sci.impl.types.eval(arg12,ctx,bindings);
var G__91619 = sci.impl.types.eval(arg13,ctx,bindings);
var fexpr__91605 = (bindings[idx]);
return (fexpr__91605.cljs$core$IFn$_invoke$arity$14 ? fexpr__91605.cljs$core$IFn$_invoke$arity$14(G__91606,G__91607,G__91608,G__91609,G__91610,G__91611,G__91612,G__91613,G__91614,G__91615,G__91616,G__91617,G__91618,G__91619) : fexpr__91605.call(null,G__91606,G__91607,G__91608,G__91609,G__91610,G__91611,G__91612,G__91613,G__91614,G__91615,G__91616,G__91617,G__91618,G__91619));
}catch (e91604){if((e91604 instanceof Error)){
var e__90522__auto__ = e91604;
return sci.impl.utils.rethrow_with_location_of_node.cljs$core$IFn$_invoke$arity$4(ctx,bindings,e__90522__auto__,this$);
} else {
throw e91604;

}
}}),stack);

break;
case (15):
var arg0 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(0));
var arg1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(1));
var arg2 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(2));
var arg3 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(3));
var arg4 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(4));
var arg5 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(5));
var arg6 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(6));
var arg7 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(7));
var arg8 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(8));
var arg9 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(9));
var arg10 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(10));
var arg11 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(11));
var arg12 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(12));
var arg13 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(13));
var arg14 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(14));
return sci.impl.types.__GT_NodeR((function (this$,ctx,bindings){
try{var G__91624 = sci.impl.types.eval(arg0,ctx,bindings);
var G__91625 = sci.impl.types.eval(arg1,ctx,bindings);
var G__91626 = sci.impl.types.eval(arg2,ctx,bindings);
var G__91627 = sci.impl.types.eval(arg3,ctx,bindings);
var G__91628 = sci.impl.types.eval(arg4,ctx,bindings);
var G__91629 = sci.impl.types.eval(arg5,ctx,bindings);
var G__91630 = sci.impl.types.eval(arg6,ctx,bindings);
var G__91631 = sci.impl.types.eval(arg7,ctx,bindings);
var G__91632 = sci.impl.types.eval(arg8,ctx,bindings);
var G__91633 = sci.impl.types.eval(arg9,ctx,bindings);
var G__91634 = sci.impl.types.eval(arg10,ctx,bindings);
var G__91635 = sci.impl.types.eval(arg11,ctx,bindings);
var G__91636 = sci.impl.types.eval(arg12,ctx,bindings);
var G__91637 = sci.impl.types.eval(arg13,ctx,bindings);
var G__91638 = sci.impl.types.eval(arg14,ctx,bindings);
var fexpr__91623 = (bindings[idx]);
return (fexpr__91623.cljs$core$IFn$_invoke$arity$15 ? fexpr__91623.cljs$core$IFn$_invoke$arity$15(G__91624,G__91625,G__91626,G__91627,G__91628,G__91629,G__91630,G__91631,G__91632,G__91633,G__91634,G__91635,G__91636,G__91637,G__91638) : fexpr__91623.call(null,G__91624,G__91625,G__91626,G__91627,G__91628,G__91629,G__91630,G__91631,G__91632,G__91633,G__91634,G__91635,G__91636,G__91637,G__91638));
}catch (e91620){if((e91620 instanceof Error)){
var e__90522__auto__ = e91620;
return sci.impl.utils.rethrow_with_location_of_node.cljs$core$IFn$_invoke$arity$4(ctx,bindings,e__90522__auto__,this$);
} else {
throw e91620;

}
}}),stack);

break;
case (16):
var arg0 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(0));
var arg1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(1));
var arg2 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(2));
var arg3 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(3));
var arg4 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(4));
var arg5 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(5));
var arg6 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(6));
var arg7 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(7));
var arg8 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(8));
var arg9 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(9));
var arg10 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(10));
var arg11 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(11));
var arg12 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(12));
var arg13 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(13));
var arg14 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(14));
var arg15 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(15));
return sci.impl.types.__GT_NodeR((function (this$,ctx,bindings){
try{var G__91644 = sci.impl.types.eval(arg0,ctx,bindings);
var G__91645 = sci.impl.types.eval(arg1,ctx,bindings);
var G__91646 = sci.impl.types.eval(arg2,ctx,bindings);
var G__91647 = sci.impl.types.eval(arg3,ctx,bindings);
var G__91648 = sci.impl.types.eval(arg4,ctx,bindings);
var G__91649 = sci.impl.types.eval(arg5,ctx,bindings);
var G__91650 = sci.impl.types.eval(arg6,ctx,bindings);
var G__91651 = sci.impl.types.eval(arg7,ctx,bindings);
var G__91652 = sci.impl.types.eval(arg8,ctx,bindings);
var G__91653 = sci.impl.types.eval(arg9,ctx,bindings);
var G__91654 = sci.impl.types.eval(arg10,ctx,bindings);
var G__91655 = sci.impl.types.eval(arg11,ctx,bindings);
var G__91656 = sci.impl.types.eval(arg12,ctx,bindings);
var G__91657 = sci.impl.types.eval(arg13,ctx,bindings);
var G__91658 = sci.impl.types.eval(arg14,ctx,bindings);
var G__91659 = sci.impl.types.eval(arg15,ctx,bindings);
var fexpr__91643 = (bindings[idx]);
return (fexpr__91643.cljs$core$IFn$_invoke$arity$16 ? fexpr__91643.cljs$core$IFn$_invoke$arity$16(G__91644,G__91645,G__91646,G__91647,G__91648,G__91649,G__91650,G__91651,G__91652,G__91653,G__91654,G__91655,G__91656,G__91657,G__91658,G__91659) : fexpr__91643.call(null,G__91644,G__91645,G__91646,G__91647,G__91648,G__91649,G__91650,G__91651,G__91652,G__91653,G__91654,G__91655,G__91656,G__91657,G__91658,G__91659));
}catch (e91640){if((e91640 instanceof Error)){
var e__90522__auto__ = e91640;
return sci.impl.utils.rethrow_with_location_of_node.cljs$core$IFn$_invoke$arity$4(ctx,bindings,e__90522__auto__,this$);
} else {
throw e91640;

}
}}),stack);

break;
case (17):
var arg0 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(0));
var arg1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(1));
var arg2 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(2));
var arg3 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(3));
var arg4 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(4));
var arg5 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(5));
var arg6 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(6));
var arg7 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(7));
var arg8 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(8));
var arg9 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(9));
var arg10 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(10));
var arg11 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(11));
var arg12 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(12));
var arg13 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(13));
var arg14 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(14));
var arg15 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(15));
var arg16 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(16));
return sci.impl.types.__GT_NodeR((function (this$,ctx,bindings){
try{var G__91664 = sci.impl.types.eval(arg0,ctx,bindings);
var G__91665 = sci.impl.types.eval(arg1,ctx,bindings);
var G__91666 = sci.impl.types.eval(arg2,ctx,bindings);
var G__91667 = sci.impl.types.eval(arg3,ctx,bindings);
var G__91668 = sci.impl.types.eval(arg4,ctx,bindings);
var G__91669 = sci.impl.types.eval(arg5,ctx,bindings);
var G__91670 = sci.impl.types.eval(arg6,ctx,bindings);
var G__91671 = sci.impl.types.eval(arg7,ctx,bindings);
var G__91672 = sci.impl.types.eval(arg8,ctx,bindings);
var G__91673 = sci.impl.types.eval(arg9,ctx,bindings);
var G__91674 = sci.impl.types.eval(arg10,ctx,bindings);
var G__91675 = sci.impl.types.eval(arg11,ctx,bindings);
var G__91676 = sci.impl.types.eval(arg12,ctx,bindings);
var G__91677 = sci.impl.types.eval(arg13,ctx,bindings);
var G__91678 = sci.impl.types.eval(arg14,ctx,bindings);
var G__91679 = sci.impl.types.eval(arg15,ctx,bindings);
var G__91680 = sci.impl.types.eval(arg16,ctx,bindings);
var fexpr__91663 = (bindings[idx]);
return (fexpr__91663.cljs$core$IFn$_invoke$arity$17 ? fexpr__91663.cljs$core$IFn$_invoke$arity$17(G__91664,G__91665,G__91666,G__91667,G__91668,G__91669,G__91670,G__91671,G__91672,G__91673,G__91674,G__91675,G__91676,G__91677,G__91678,G__91679,G__91680) : fexpr__91663.call(null,G__91664,G__91665,G__91666,G__91667,G__91668,G__91669,G__91670,G__91671,G__91672,G__91673,G__91674,G__91675,G__91676,G__91677,G__91678,G__91679,G__91680));
}catch (e91662){if((e91662 instanceof Error)){
var e__90522__auto__ = e91662;
return sci.impl.utils.rethrow_with_location_of_node.cljs$core$IFn$_invoke$arity$4(ctx,bindings,e__90522__auto__,this$);
} else {
throw e91662;

}
}}),stack);

break;
case (18):
var arg0 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(0));
var arg1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(1));
var arg2 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(2));
var arg3 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(3));
var arg4 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(4));
var arg5 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(5));
var arg6 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(6));
var arg7 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(7));
var arg8 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(8));
var arg9 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(9));
var arg10 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(10));
var arg11 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(11));
var arg12 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(12));
var arg13 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(13));
var arg14 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(14));
var arg15 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(15));
var arg16 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(16));
var arg17 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(17));
return sci.impl.types.__GT_NodeR((function (this$,ctx,bindings){
try{var G__91696 = sci.impl.types.eval(arg0,ctx,bindings);
var G__91697 = sci.impl.types.eval(arg1,ctx,bindings);
var G__91698 = sci.impl.types.eval(arg2,ctx,bindings);
var G__91699 = sci.impl.types.eval(arg3,ctx,bindings);
var G__91700 = sci.impl.types.eval(arg4,ctx,bindings);
var G__91701 = sci.impl.types.eval(arg5,ctx,bindings);
var G__91702 = sci.impl.types.eval(arg6,ctx,bindings);
var G__91703 = sci.impl.types.eval(arg7,ctx,bindings);
var G__91704 = sci.impl.types.eval(arg8,ctx,bindings);
var G__91705 = sci.impl.types.eval(arg9,ctx,bindings);
var G__91706 = sci.impl.types.eval(arg10,ctx,bindings);
var G__91707 = sci.impl.types.eval(arg11,ctx,bindings);
var G__91708 = sci.impl.types.eval(arg12,ctx,bindings);
var G__91709 = sci.impl.types.eval(arg13,ctx,bindings);
var G__91710 = sci.impl.types.eval(arg14,ctx,bindings);
var G__91711 = sci.impl.types.eval(arg15,ctx,bindings);
var G__91712 = sci.impl.types.eval(arg16,ctx,bindings);
var G__91713 = sci.impl.types.eval(arg17,ctx,bindings);
var fexpr__91695 = (bindings[idx]);
return (fexpr__91695.cljs$core$IFn$_invoke$arity$18 ? fexpr__91695.cljs$core$IFn$_invoke$arity$18(G__91696,G__91697,G__91698,G__91699,G__91700,G__91701,G__91702,G__91703,G__91704,G__91705,G__91706,G__91707,G__91708,G__91709,G__91710,G__91711,G__91712,G__91713) : fexpr__91695.call(null,G__91696,G__91697,G__91698,G__91699,G__91700,G__91701,G__91702,G__91703,G__91704,G__91705,G__91706,G__91707,G__91708,G__91709,G__91710,G__91711,G__91712,G__91713));
}catch (e91691){if((e91691 instanceof Error)){
var e__90522__auto__ = e91691;
return sci.impl.utils.rethrow_with_location_of_node.cljs$core$IFn$_invoke$arity$4(ctx,bindings,e__90522__auto__,this$);
} else {
throw e91691;

}
}}),stack);

break;
case (19):
var arg0 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(0));
var arg1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(1));
var arg2 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(2));
var arg3 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(3));
var arg4 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(4));
var arg5 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(5));
var arg6 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(6));
var arg7 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(7));
var arg8 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(8));
var arg9 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(9));
var arg10 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(10));
var arg11 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(11));
var arg12 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(12));
var arg13 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(13));
var arg14 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(14));
var arg15 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(15));
var arg16 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(16));
var arg17 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(17));
var arg18 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(18));
return sci.impl.types.__GT_NodeR((function (this$,ctx,bindings){
try{var G__91743 = sci.impl.types.eval(arg0,ctx,bindings);
var G__91744 = sci.impl.types.eval(arg1,ctx,bindings);
var G__91745 = sci.impl.types.eval(arg2,ctx,bindings);
var G__91746 = sci.impl.types.eval(arg3,ctx,bindings);
var G__91747 = sci.impl.types.eval(arg4,ctx,bindings);
var G__91748 = sci.impl.types.eval(arg5,ctx,bindings);
var G__91749 = sci.impl.types.eval(arg6,ctx,bindings);
var G__91750 = sci.impl.types.eval(arg7,ctx,bindings);
var G__91751 = sci.impl.types.eval(arg8,ctx,bindings);
var G__91752 = sci.impl.types.eval(arg9,ctx,bindings);
var G__91753 = sci.impl.types.eval(arg10,ctx,bindings);
var G__91754 = sci.impl.types.eval(arg11,ctx,bindings);
var G__91755 = sci.impl.types.eval(arg12,ctx,bindings);
var G__91756 = sci.impl.types.eval(arg13,ctx,bindings);
var G__91757 = sci.impl.types.eval(arg14,ctx,bindings);
var G__91758 = sci.impl.types.eval(arg15,ctx,bindings);
var G__91759 = sci.impl.types.eval(arg16,ctx,bindings);
var G__91760 = sci.impl.types.eval(arg17,ctx,bindings);
var G__91761 = sci.impl.types.eval(arg18,ctx,bindings);
var fexpr__91742 = (bindings[idx]);
return (fexpr__91742.cljs$core$IFn$_invoke$arity$19 ? fexpr__91742.cljs$core$IFn$_invoke$arity$19(G__91743,G__91744,G__91745,G__91746,G__91747,G__91748,G__91749,G__91750,G__91751,G__91752,G__91753,G__91754,G__91755,G__91756,G__91757,G__91758,G__91759,G__91760,G__91761) : fexpr__91742.call(null,G__91743,G__91744,G__91745,G__91746,G__91747,G__91748,G__91749,G__91750,G__91751,G__91752,G__91753,G__91754,G__91755,G__91756,G__91757,G__91758,G__91759,G__91760,G__91761));
}catch (e91737){if((e91737 instanceof Error)){
var e__90522__auto__ = e91737;
return sci.impl.utils.rethrow_with_location_of_node.cljs$core$IFn$_invoke$arity$4(ctx,bindings,e__90522__auto__,this$);
} else {
throw e91737;

}
}}),stack);

break;
default:
return (function (ctx,bindings){
return sci.impl.evaluator.fn_call(ctx,bindings,(bindings[idx]),analyzed_children);
});

}
});
sci.impl.analyzer.return_needs_ctx_call = (function sci$impl$analyzer$return_needs_ctx_call(_ctx,expr,f,analyzed_children){
var stack = cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(cljs.core.meta(expr),new cljs.core.Keyword(null,"file","file",-1269645878),cljs.core.deref(sci.impl.vars.current_file),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"ns","ns",441598760),cljs.core.deref(sci.impl.vars.current_ns)], 0));
var G__91772 = cljs.core.count(analyzed_children);
switch (G__91772) {
case (0):
return sci.impl.types.__GT_NodeR((function (this$,ctx,bindings){
return (f.cljs$core$IFn$_invoke$arity$1 ? f.cljs$core$IFn$_invoke$arity$1(ctx) : f.call(null,ctx));
}),stack);

break;
case (1):
var arg0 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(0));
return sci.impl.types.__GT_NodeR((function (this$,ctx,bindings){
var G__91775 = ctx;
var G__91776 = sci.impl.types.eval(arg0,ctx,bindings);
return (f.cljs$core$IFn$_invoke$arity$2 ? f.cljs$core$IFn$_invoke$arity$2(G__91775,G__91776) : f.call(null,G__91775,G__91776));
}),stack);

break;
case (2):
var arg0 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(0));
var arg1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(1));
return sci.impl.types.__GT_NodeR((function (this$,ctx,bindings){
var G__91778 = ctx;
var G__91780 = sci.impl.types.eval(arg0,ctx,bindings);
var G__91781 = sci.impl.types.eval(arg1,ctx,bindings);
return (f.cljs$core$IFn$_invoke$arity$3 ? f.cljs$core$IFn$_invoke$arity$3(G__91778,G__91780,G__91781) : f.call(null,G__91778,G__91780,G__91781));
}),stack);

break;
case (3):
var arg0 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(0));
var arg1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(1));
var arg2 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(2));
return sci.impl.types.__GT_NodeR((function (this$,ctx,bindings){
var G__91782 = ctx;
var G__91783 = sci.impl.types.eval(arg0,ctx,bindings);
var G__91784 = sci.impl.types.eval(arg1,ctx,bindings);
var G__91785 = sci.impl.types.eval(arg2,ctx,bindings);
return (f.cljs$core$IFn$_invoke$arity$4 ? f.cljs$core$IFn$_invoke$arity$4(G__91782,G__91783,G__91784,G__91785) : f.call(null,G__91782,G__91783,G__91784,G__91785));
}),stack);

break;
case (4):
var arg0 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(0));
var arg1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(1));
var arg2 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(2));
var arg3 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(3));
return sci.impl.types.__GT_NodeR((function (this$,ctx,bindings){
var G__91787 = ctx;
var G__91788 = sci.impl.types.eval(arg0,ctx,bindings);
var G__91789 = sci.impl.types.eval(arg1,ctx,bindings);
var G__91790 = sci.impl.types.eval(arg2,ctx,bindings);
var G__91791 = sci.impl.types.eval(arg3,ctx,bindings);
return (f.cljs$core$IFn$_invoke$arity$5 ? f.cljs$core$IFn$_invoke$arity$5(G__91787,G__91788,G__91789,G__91790,G__91791) : f.call(null,G__91787,G__91788,G__91789,G__91790,G__91791));
}),stack);

break;
case (5):
var arg0 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(0));
var arg1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(1));
var arg2 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(2));
var arg3 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(3));
var arg4 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(4));
return sci.impl.types.__GT_NodeR((function (this$,ctx,bindings){
var G__91799 = ctx;
var G__91800 = sci.impl.types.eval(arg0,ctx,bindings);
var G__91801 = sci.impl.types.eval(arg1,ctx,bindings);
var G__91802 = sci.impl.types.eval(arg2,ctx,bindings);
var G__91803 = sci.impl.types.eval(arg3,ctx,bindings);
var G__91804 = sci.impl.types.eval(arg4,ctx,bindings);
return (f.cljs$core$IFn$_invoke$arity$6 ? f.cljs$core$IFn$_invoke$arity$6(G__91799,G__91800,G__91801,G__91802,G__91803,G__91804) : f.call(null,G__91799,G__91800,G__91801,G__91802,G__91803,G__91804));
}),stack);

break;
case (6):
var arg0 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(0));
var arg1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(1));
var arg2 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(2));
var arg3 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(3));
var arg4 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(4));
var arg5 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(5));
return sci.impl.types.__GT_NodeR((function (this$,ctx,bindings){
var G__91810 = ctx;
var G__91811 = sci.impl.types.eval(arg0,ctx,bindings);
var G__91812 = sci.impl.types.eval(arg1,ctx,bindings);
var G__91813 = sci.impl.types.eval(arg2,ctx,bindings);
var G__91814 = sci.impl.types.eval(arg3,ctx,bindings);
var G__91815 = sci.impl.types.eval(arg4,ctx,bindings);
var G__91816 = sci.impl.types.eval(arg5,ctx,bindings);
return (f.cljs$core$IFn$_invoke$arity$7 ? f.cljs$core$IFn$_invoke$arity$7(G__91810,G__91811,G__91812,G__91813,G__91814,G__91815,G__91816) : f.call(null,G__91810,G__91811,G__91812,G__91813,G__91814,G__91815,G__91816));
}),stack);

break;
case (7):
var arg0 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(0));
var arg1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(1));
var arg2 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(2));
var arg3 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(3));
var arg4 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(4));
var arg5 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(5));
var arg6 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(6));
return sci.impl.types.__GT_NodeR((function (this$,ctx,bindings){
var G__91819 = ctx;
var G__91820 = sci.impl.types.eval(arg0,ctx,bindings);
var G__91821 = sci.impl.types.eval(arg1,ctx,bindings);
var G__91822 = sci.impl.types.eval(arg2,ctx,bindings);
var G__91823 = sci.impl.types.eval(arg3,ctx,bindings);
var G__91824 = sci.impl.types.eval(arg4,ctx,bindings);
var G__91825 = sci.impl.types.eval(arg5,ctx,bindings);
var G__91826 = sci.impl.types.eval(arg6,ctx,bindings);
return (f.cljs$core$IFn$_invoke$arity$8 ? f.cljs$core$IFn$_invoke$arity$8(G__91819,G__91820,G__91821,G__91822,G__91823,G__91824,G__91825,G__91826) : f.call(null,G__91819,G__91820,G__91821,G__91822,G__91823,G__91824,G__91825,G__91826));
}),stack);

break;
case (8):
var arg0 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(0));
var arg1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(1));
var arg2 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(2));
var arg3 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(3));
var arg4 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(4));
var arg5 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(5));
var arg6 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(6));
var arg7 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(7));
return sci.impl.types.__GT_NodeR((function (this$,ctx,bindings){
var G__91830 = ctx;
var G__91831 = sci.impl.types.eval(arg0,ctx,bindings);
var G__91832 = sci.impl.types.eval(arg1,ctx,bindings);
var G__91833 = sci.impl.types.eval(arg2,ctx,bindings);
var G__91834 = sci.impl.types.eval(arg3,ctx,bindings);
var G__91835 = sci.impl.types.eval(arg4,ctx,bindings);
var G__91836 = sci.impl.types.eval(arg5,ctx,bindings);
var G__91837 = sci.impl.types.eval(arg6,ctx,bindings);
var G__91838 = sci.impl.types.eval(arg7,ctx,bindings);
return (f.cljs$core$IFn$_invoke$arity$9 ? f.cljs$core$IFn$_invoke$arity$9(G__91830,G__91831,G__91832,G__91833,G__91834,G__91835,G__91836,G__91837,G__91838) : f.call(null,G__91830,G__91831,G__91832,G__91833,G__91834,G__91835,G__91836,G__91837,G__91838));
}),stack);

break;
case (9):
var arg0 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(0));
var arg1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(1));
var arg2 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(2));
var arg3 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(3));
var arg4 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(4));
var arg5 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(5));
var arg6 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(6));
var arg7 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(7));
var arg8 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(8));
return sci.impl.types.__GT_NodeR((function (this$,ctx,bindings){
var G__91842 = ctx;
var G__91843 = sci.impl.types.eval(arg0,ctx,bindings);
var G__91844 = sci.impl.types.eval(arg1,ctx,bindings);
var G__91845 = sci.impl.types.eval(arg2,ctx,bindings);
var G__91846 = sci.impl.types.eval(arg3,ctx,bindings);
var G__91847 = sci.impl.types.eval(arg4,ctx,bindings);
var G__91848 = sci.impl.types.eval(arg5,ctx,bindings);
var G__91849 = sci.impl.types.eval(arg6,ctx,bindings);
var G__91850 = sci.impl.types.eval(arg7,ctx,bindings);
var G__91851 = sci.impl.types.eval(arg8,ctx,bindings);
return (f.cljs$core$IFn$_invoke$arity$10 ? f.cljs$core$IFn$_invoke$arity$10(G__91842,G__91843,G__91844,G__91845,G__91846,G__91847,G__91848,G__91849,G__91850,G__91851) : f.call(null,G__91842,G__91843,G__91844,G__91845,G__91846,G__91847,G__91848,G__91849,G__91850,G__91851));
}),stack);

break;
case (10):
var arg0 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(0));
var arg1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(1));
var arg2 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(2));
var arg3 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(3));
var arg4 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(4));
var arg5 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(5));
var arg6 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(6));
var arg7 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(7));
var arg8 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(8));
var arg9 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(9));
return sci.impl.types.__GT_NodeR((function (this$,ctx,bindings){
var G__91856 = ctx;
var G__91857 = sci.impl.types.eval(arg0,ctx,bindings);
var G__91858 = sci.impl.types.eval(arg1,ctx,bindings);
var G__91859 = sci.impl.types.eval(arg2,ctx,bindings);
var G__91860 = sci.impl.types.eval(arg3,ctx,bindings);
var G__91861 = sci.impl.types.eval(arg4,ctx,bindings);
var G__91862 = sci.impl.types.eval(arg5,ctx,bindings);
var G__91863 = sci.impl.types.eval(arg6,ctx,bindings);
var G__91864 = sci.impl.types.eval(arg7,ctx,bindings);
var G__91865 = sci.impl.types.eval(arg8,ctx,bindings);
var G__91866 = sci.impl.types.eval(arg9,ctx,bindings);
return (f.cljs$core$IFn$_invoke$arity$11 ? f.cljs$core$IFn$_invoke$arity$11(G__91856,G__91857,G__91858,G__91859,G__91860,G__91861,G__91862,G__91863,G__91864,G__91865,G__91866) : f.call(null,G__91856,G__91857,G__91858,G__91859,G__91860,G__91861,G__91862,G__91863,G__91864,G__91865,G__91866));
}),stack);

break;
case (11):
var arg0 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(0));
var arg1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(1));
var arg2 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(2));
var arg3 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(3));
var arg4 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(4));
var arg5 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(5));
var arg6 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(6));
var arg7 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(7));
var arg8 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(8));
var arg9 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(9));
var arg10 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(10));
return sci.impl.types.__GT_NodeR((function (this$,ctx,bindings){
var G__91869 = ctx;
var G__91870 = sci.impl.types.eval(arg0,ctx,bindings);
var G__91871 = sci.impl.types.eval(arg1,ctx,bindings);
var G__91872 = sci.impl.types.eval(arg2,ctx,bindings);
var G__91873 = sci.impl.types.eval(arg3,ctx,bindings);
var G__91874 = sci.impl.types.eval(arg4,ctx,bindings);
var G__91875 = sci.impl.types.eval(arg5,ctx,bindings);
var G__91876 = sci.impl.types.eval(arg6,ctx,bindings);
var G__91877 = sci.impl.types.eval(arg7,ctx,bindings);
var G__91878 = sci.impl.types.eval(arg8,ctx,bindings);
var G__91879 = sci.impl.types.eval(arg9,ctx,bindings);
var G__91880 = sci.impl.types.eval(arg10,ctx,bindings);
return (f.cljs$core$IFn$_invoke$arity$12 ? f.cljs$core$IFn$_invoke$arity$12(G__91869,G__91870,G__91871,G__91872,G__91873,G__91874,G__91875,G__91876,G__91877,G__91878,G__91879,G__91880) : f.call(null,G__91869,G__91870,G__91871,G__91872,G__91873,G__91874,G__91875,G__91876,G__91877,G__91878,G__91879,G__91880));
}),stack);

break;
case (12):
var arg0 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(0));
var arg1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(1));
var arg2 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(2));
var arg3 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(3));
var arg4 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(4));
var arg5 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(5));
var arg6 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(6));
var arg7 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(7));
var arg8 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(8));
var arg9 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(9));
var arg10 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(10));
var arg11 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(11));
return sci.impl.types.__GT_NodeR((function (this$,ctx,bindings){
var G__91883 = ctx;
var G__91884 = sci.impl.types.eval(arg0,ctx,bindings);
var G__91885 = sci.impl.types.eval(arg1,ctx,bindings);
var G__91886 = sci.impl.types.eval(arg2,ctx,bindings);
var G__91887 = sci.impl.types.eval(arg3,ctx,bindings);
var G__91888 = sci.impl.types.eval(arg4,ctx,bindings);
var G__91889 = sci.impl.types.eval(arg5,ctx,bindings);
var G__91890 = sci.impl.types.eval(arg6,ctx,bindings);
var G__91891 = sci.impl.types.eval(arg7,ctx,bindings);
var G__91892 = sci.impl.types.eval(arg8,ctx,bindings);
var G__91893 = sci.impl.types.eval(arg9,ctx,bindings);
var G__91894 = sci.impl.types.eval(arg10,ctx,bindings);
var G__91895 = sci.impl.types.eval(arg11,ctx,bindings);
return (f.cljs$core$IFn$_invoke$arity$13 ? f.cljs$core$IFn$_invoke$arity$13(G__91883,G__91884,G__91885,G__91886,G__91887,G__91888,G__91889,G__91890,G__91891,G__91892,G__91893,G__91894,G__91895) : f.call(null,G__91883,G__91884,G__91885,G__91886,G__91887,G__91888,G__91889,G__91890,G__91891,G__91892,G__91893,G__91894,G__91895));
}),stack);

break;
case (13):
var arg0 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(0));
var arg1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(1));
var arg2 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(2));
var arg3 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(3));
var arg4 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(4));
var arg5 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(5));
var arg6 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(6));
var arg7 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(7));
var arg8 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(8));
var arg9 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(9));
var arg10 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(10));
var arg11 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(11));
var arg12 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(12));
return sci.impl.types.__GT_NodeR((function (this$,ctx,bindings){
var G__91900 = ctx;
var G__91901 = sci.impl.types.eval(arg0,ctx,bindings);
var G__91902 = sci.impl.types.eval(arg1,ctx,bindings);
var G__91903 = sci.impl.types.eval(arg2,ctx,bindings);
var G__91904 = sci.impl.types.eval(arg3,ctx,bindings);
var G__91905 = sci.impl.types.eval(arg4,ctx,bindings);
var G__91906 = sci.impl.types.eval(arg5,ctx,bindings);
var G__91907 = sci.impl.types.eval(arg6,ctx,bindings);
var G__91908 = sci.impl.types.eval(arg7,ctx,bindings);
var G__91909 = sci.impl.types.eval(arg8,ctx,bindings);
var G__91910 = sci.impl.types.eval(arg9,ctx,bindings);
var G__91911 = sci.impl.types.eval(arg10,ctx,bindings);
var G__91912 = sci.impl.types.eval(arg11,ctx,bindings);
var G__91913 = sci.impl.types.eval(arg12,ctx,bindings);
return (f.cljs$core$IFn$_invoke$arity$14 ? f.cljs$core$IFn$_invoke$arity$14(G__91900,G__91901,G__91902,G__91903,G__91904,G__91905,G__91906,G__91907,G__91908,G__91909,G__91910,G__91911,G__91912,G__91913) : f.call(null,G__91900,G__91901,G__91902,G__91903,G__91904,G__91905,G__91906,G__91907,G__91908,G__91909,G__91910,G__91911,G__91912,G__91913));
}),stack);

break;
case (14):
var arg0 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(0));
var arg1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(1));
var arg2 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(2));
var arg3 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(3));
var arg4 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(4));
var arg5 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(5));
var arg6 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(6));
var arg7 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(7));
var arg8 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(8));
var arg9 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(9));
var arg10 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(10));
var arg11 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(11));
var arg12 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(12));
var arg13 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(13));
return sci.impl.types.__GT_NodeR((function (this$,ctx,bindings){
var G__91919 = ctx;
var G__91920 = sci.impl.types.eval(arg0,ctx,bindings);
var G__91921 = sci.impl.types.eval(arg1,ctx,bindings);
var G__91922 = sci.impl.types.eval(arg2,ctx,bindings);
var G__91923 = sci.impl.types.eval(arg3,ctx,bindings);
var G__91924 = sci.impl.types.eval(arg4,ctx,bindings);
var G__91925 = sci.impl.types.eval(arg5,ctx,bindings);
var G__91926 = sci.impl.types.eval(arg6,ctx,bindings);
var G__91927 = sci.impl.types.eval(arg7,ctx,bindings);
var G__91928 = sci.impl.types.eval(arg8,ctx,bindings);
var G__91929 = sci.impl.types.eval(arg9,ctx,bindings);
var G__91930 = sci.impl.types.eval(arg10,ctx,bindings);
var G__91931 = sci.impl.types.eval(arg11,ctx,bindings);
var G__91932 = sci.impl.types.eval(arg12,ctx,bindings);
var G__91933 = sci.impl.types.eval(arg13,ctx,bindings);
return (f.cljs$core$IFn$_invoke$arity$15 ? f.cljs$core$IFn$_invoke$arity$15(G__91919,G__91920,G__91921,G__91922,G__91923,G__91924,G__91925,G__91926,G__91927,G__91928,G__91929,G__91930,G__91931,G__91932,G__91933) : f.call(null,G__91919,G__91920,G__91921,G__91922,G__91923,G__91924,G__91925,G__91926,G__91927,G__91928,G__91929,G__91930,G__91931,G__91932,G__91933));
}),stack);

break;
case (15):
var arg0 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(0));
var arg1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(1));
var arg2 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(2));
var arg3 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(3));
var arg4 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(4));
var arg5 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(5));
var arg6 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(6));
var arg7 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(7));
var arg8 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(8));
var arg9 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(9));
var arg10 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(10));
var arg11 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(11));
var arg12 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(12));
var arg13 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(13));
var arg14 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(14));
return sci.impl.types.__GT_NodeR((function (this$,ctx,bindings){
var G__91934 = ctx;
var G__91935 = sci.impl.types.eval(arg0,ctx,bindings);
var G__91936 = sci.impl.types.eval(arg1,ctx,bindings);
var G__91937 = sci.impl.types.eval(arg2,ctx,bindings);
var G__91938 = sci.impl.types.eval(arg3,ctx,bindings);
var G__91939 = sci.impl.types.eval(arg4,ctx,bindings);
var G__91940 = sci.impl.types.eval(arg5,ctx,bindings);
var G__91941 = sci.impl.types.eval(arg6,ctx,bindings);
var G__91942 = sci.impl.types.eval(arg7,ctx,bindings);
var G__91943 = sci.impl.types.eval(arg8,ctx,bindings);
var G__91944 = sci.impl.types.eval(arg9,ctx,bindings);
var G__91945 = sci.impl.types.eval(arg10,ctx,bindings);
var G__91946 = sci.impl.types.eval(arg11,ctx,bindings);
var G__91947 = sci.impl.types.eval(arg12,ctx,bindings);
var G__91948 = sci.impl.types.eval(arg13,ctx,bindings);
var G__91949 = sci.impl.types.eval(arg14,ctx,bindings);
return (f.cljs$core$IFn$_invoke$arity$16 ? f.cljs$core$IFn$_invoke$arity$16(G__91934,G__91935,G__91936,G__91937,G__91938,G__91939,G__91940,G__91941,G__91942,G__91943,G__91944,G__91945,G__91946,G__91947,G__91948,G__91949) : f.call(null,G__91934,G__91935,G__91936,G__91937,G__91938,G__91939,G__91940,G__91941,G__91942,G__91943,G__91944,G__91945,G__91946,G__91947,G__91948,G__91949));
}),stack);

break;
case (16):
var arg0 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(0));
var arg1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(1));
var arg2 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(2));
var arg3 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(3));
var arg4 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(4));
var arg5 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(5));
var arg6 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(6));
var arg7 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(7));
var arg8 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(8));
var arg9 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(9));
var arg10 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(10));
var arg11 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(11));
var arg12 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(12));
var arg13 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(13));
var arg14 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(14));
var arg15 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(15));
return sci.impl.types.__GT_NodeR((function (this$,ctx,bindings){
var G__91950 = ctx;
var G__91951 = sci.impl.types.eval(arg0,ctx,bindings);
var G__91952 = sci.impl.types.eval(arg1,ctx,bindings);
var G__91953 = sci.impl.types.eval(arg2,ctx,bindings);
var G__91954 = sci.impl.types.eval(arg3,ctx,bindings);
var G__91955 = sci.impl.types.eval(arg4,ctx,bindings);
var G__91956 = sci.impl.types.eval(arg5,ctx,bindings);
var G__91957 = sci.impl.types.eval(arg6,ctx,bindings);
var G__91958 = sci.impl.types.eval(arg7,ctx,bindings);
var G__91959 = sci.impl.types.eval(arg8,ctx,bindings);
var G__91960 = sci.impl.types.eval(arg9,ctx,bindings);
var G__91961 = sci.impl.types.eval(arg10,ctx,bindings);
var G__91962 = sci.impl.types.eval(arg11,ctx,bindings);
var G__91963 = sci.impl.types.eval(arg12,ctx,bindings);
var G__91964 = sci.impl.types.eval(arg13,ctx,bindings);
var G__91965 = sci.impl.types.eval(arg14,ctx,bindings);
var G__91966 = sci.impl.types.eval(arg15,ctx,bindings);
return (f.cljs$core$IFn$_invoke$arity$17 ? f.cljs$core$IFn$_invoke$arity$17(G__91950,G__91951,G__91952,G__91953,G__91954,G__91955,G__91956,G__91957,G__91958,G__91959,G__91960,G__91961,G__91962,G__91963,G__91964,G__91965,G__91966) : f.call(null,G__91950,G__91951,G__91952,G__91953,G__91954,G__91955,G__91956,G__91957,G__91958,G__91959,G__91960,G__91961,G__91962,G__91963,G__91964,G__91965,G__91966));
}),stack);

break;
case (17):
var arg0 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(0));
var arg1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(1));
var arg2 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(2));
var arg3 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(3));
var arg4 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(4));
var arg5 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(5));
var arg6 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(6));
var arg7 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(7));
var arg8 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(8));
var arg9 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(9));
var arg10 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(10));
var arg11 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(11));
var arg12 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(12));
var arg13 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(13));
var arg14 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(14));
var arg15 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(15));
var arg16 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(16));
return sci.impl.types.__GT_NodeR((function (this$,ctx,bindings){
var G__91971 = ctx;
var G__91972 = sci.impl.types.eval(arg0,ctx,bindings);
var G__91973 = sci.impl.types.eval(arg1,ctx,bindings);
var G__91974 = sci.impl.types.eval(arg2,ctx,bindings);
var G__91975 = sci.impl.types.eval(arg3,ctx,bindings);
var G__91976 = sci.impl.types.eval(arg4,ctx,bindings);
var G__91977 = sci.impl.types.eval(arg5,ctx,bindings);
var G__91978 = sci.impl.types.eval(arg6,ctx,bindings);
var G__91979 = sci.impl.types.eval(arg7,ctx,bindings);
var G__91980 = sci.impl.types.eval(arg8,ctx,bindings);
var G__91981 = sci.impl.types.eval(arg9,ctx,bindings);
var G__91982 = sci.impl.types.eval(arg10,ctx,bindings);
var G__91983 = sci.impl.types.eval(arg11,ctx,bindings);
var G__91984 = sci.impl.types.eval(arg12,ctx,bindings);
var G__91985 = sci.impl.types.eval(arg13,ctx,bindings);
var G__91986 = sci.impl.types.eval(arg14,ctx,bindings);
var G__91987 = sci.impl.types.eval(arg15,ctx,bindings);
var G__91988 = sci.impl.types.eval(arg16,ctx,bindings);
return (f.cljs$core$IFn$_invoke$arity$18 ? f.cljs$core$IFn$_invoke$arity$18(G__91971,G__91972,G__91973,G__91974,G__91975,G__91976,G__91977,G__91978,G__91979,G__91980,G__91981,G__91982,G__91983,G__91984,G__91985,G__91986,G__91987,G__91988) : f.call(null,G__91971,G__91972,G__91973,G__91974,G__91975,G__91976,G__91977,G__91978,G__91979,G__91980,G__91981,G__91982,G__91983,G__91984,G__91985,G__91986,G__91987,G__91988));
}),stack);

break;
case (18):
var arg0 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(0));
var arg1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(1));
var arg2 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(2));
var arg3 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(3));
var arg4 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(4));
var arg5 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(5));
var arg6 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(6));
var arg7 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(7));
var arg8 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(8));
var arg9 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(9));
var arg10 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(10));
var arg11 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(11));
var arg12 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(12));
var arg13 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(13));
var arg14 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(14));
var arg15 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(15));
var arg16 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(16));
var arg17 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(17));
return sci.impl.types.__GT_NodeR((function (this$,ctx,bindings){
var G__92023 = ctx;
var G__92024 = sci.impl.types.eval(arg0,ctx,bindings);
var G__92025 = sci.impl.types.eval(arg1,ctx,bindings);
var G__92026 = sci.impl.types.eval(arg2,ctx,bindings);
var G__92027 = sci.impl.types.eval(arg3,ctx,bindings);
var G__92028 = sci.impl.types.eval(arg4,ctx,bindings);
var G__92029 = sci.impl.types.eval(arg5,ctx,bindings);
var G__92030 = sci.impl.types.eval(arg6,ctx,bindings);
var G__92031 = sci.impl.types.eval(arg7,ctx,bindings);
var G__92032 = sci.impl.types.eval(arg8,ctx,bindings);
var G__92033 = sci.impl.types.eval(arg9,ctx,bindings);
var G__92034 = sci.impl.types.eval(arg10,ctx,bindings);
var G__92035 = sci.impl.types.eval(arg11,ctx,bindings);
var G__92036 = sci.impl.types.eval(arg12,ctx,bindings);
var G__92037 = sci.impl.types.eval(arg13,ctx,bindings);
var G__92038 = sci.impl.types.eval(arg14,ctx,bindings);
var G__92039 = sci.impl.types.eval(arg15,ctx,bindings);
var G__92040 = sci.impl.types.eval(arg16,ctx,bindings);
var G__92041 = sci.impl.types.eval(arg17,ctx,bindings);
return (f.cljs$core$IFn$_invoke$arity$19 ? f.cljs$core$IFn$_invoke$arity$19(G__92023,G__92024,G__92025,G__92026,G__92027,G__92028,G__92029,G__92030,G__92031,G__92032,G__92033,G__92034,G__92035,G__92036,G__92037,G__92038,G__92039,G__92040,G__92041) : f.call(null,G__92023,G__92024,G__92025,G__92026,G__92027,G__92028,G__92029,G__92030,G__92031,G__92032,G__92033,G__92034,G__92035,G__92036,G__92037,G__92038,G__92039,G__92040,G__92041));
}),stack);

break;
case (19):
var arg0 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(0));
var arg1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(1));
var arg2 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(2));
var arg3 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(3));
var arg4 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(4));
var arg5 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(5));
var arg6 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(6));
var arg7 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(7));
var arg8 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(8));
var arg9 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(9));
var arg10 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(10));
var arg11 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(11));
var arg12 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(12));
var arg13 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(13));
var arg14 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(14));
var arg15 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(15));
var arg16 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(16));
var arg17 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(17));
var arg18 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(18));
return sci.impl.types.__GT_NodeR((function (this$,ctx,bindings){
var G__92042 = ctx;
var G__92043 = sci.impl.types.eval(arg0,ctx,bindings);
var G__92044 = sci.impl.types.eval(arg1,ctx,bindings);
var G__92045 = sci.impl.types.eval(arg2,ctx,bindings);
var G__92046 = sci.impl.types.eval(arg3,ctx,bindings);
var G__92047 = sci.impl.types.eval(arg4,ctx,bindings);
var G__92048 = sci.impl.types.eval(arg5,ctx,bindings);
var G__92049 = sci.impl.types.eval(arg6,ctx,bindings);
var G__92050 = sci.impl.types.eval(arg7,ctx,bindings);
var G__92051 = sci.impl.types.eval(arg8,ctx,bindings);
var G__92052 = sci.impl.types.eval(arg9,ctx,bindings);
var G__92053 = sci.impl.types.eval(arg10,ctx,bindings);
var G__92054 = sci.impl.types.eval(arg11,ctx,bindings);
var G__92055 = sci.impl.types.eval(arg12,ctx,bindings);
var G__92056 = sci.impl.types.eval(arg13,ctx,bindings);
var G__92057 = sci.impl.types.eval(arg14,ctx,bindings);
var G__92058 = sci.impl.types.eval(arg15,ctx,bindings);
var G__92059 = sci.impl.types.eval(arg16,ctx,bindings);
var G__92060 = sci.impl.types.eval(arg17,ctx,bindings);
var G__92061 = sci.impl.types.eval(arg18,ctx,bindings);
return (f.cljs$core$IFn$_invoke$arity$20 ? f.cljs$core$IFn$_invoke$arity$20(G__92042,G__92043,G__92044,G__92045,G__92046,G__92047,G__92048,G__92049,G__92050,G__92051,G__92052,G__92053,G__92054,G__92055,G__92056,G__92057,G__92058,G__92059,G__92060,G__92061) : f.call(null,G__92042,G__92043,G__92044,G__92045,G__92046,G__92047,G__92048,G__92049,G__92050,G__92051,G__92052,G__92053,G__92054,G__92055,G__92056,G__92057,G__92058,G__92059,G__92060,G__92061));
}),stack);

break;
default:
return sci.impl.types.__GT_NodeR((function (this$,ctx,bindings){
return sci.impl.evaluator.fn_call(ctx,bindings,f,cljs.core.cons(ctx,analyzed_children));
}),stack);

}
});
sci.impl.analyzer.return_call = (function sci$impl$analyzer$return_call(_ctx,expr,f,analyzed_children,stack,wrap){
var G__92063 = cljs.core.count(analyzed_children);
switch (G__92063) {
case (0):
if(cljs.core.truth_(wrap)){
return sci.impl.types.__GT_NodeR((function (this$,ctx,bindings){
try{var fexpr__92065 = (wrap.cljs$core$IFn$_invoke$arity$2 ? wrap.cljs$core$IFn$_invoke$arity$2(bindings,f) : wrap.call(null,bindings,f));
return (fexpr__92065.cljs$core$IFn$_invoke$arity$0 ? fexpr__92065.cljs$core$IFn$_invoke$arity$0() : fexpr__92065.call(null));
}catch (e92064){if((e92064 instanceof Error)){
var e__90645__auto__ = e92064;
return sci.impl.utils.rethrow_with_location_of_node.cljs$core$IFn$_invoke$arity$4(ctx,bindings,e__90645__auto__,this$);
} else {
throw e92064;

}
}}),stack);
} else {
return sci.impl.types.__GT_NodeR((function (this$,ctx,bindings){
try{return (f.cljs$core$IFn$_invoke$arity$0 ? f.cljs$core$IFn$_invoke$arity$0() : f.call(null));
}catch (e92066){if((e92066 instanceof Error)){
var e__90645__auto__ = e92066;
return sci.impl.utils.rethrow_with_location_of_node.cljs$core$IFn$_invoke$arity$4(ctx,bindings,e__90645__auto__,this$);
} else {
throw e92066;

}
}}),stack);
}

break;
case (1):
var arg0 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(0));
if(cljs.core.truth_(wrap)){
return sci.impl.types.__GT_NodeR((function (this$,ctx,bindings){
try{var G__92069 = sci.impl.types.eval(arg0,ctx,bindings);
var fexpr__92068 = (wrap.cljs$core$IFn$_invoke$arity$2 ? wrap.cljs$core$IFn$_invoke$arity$2(bindings,f) : wrap.call(null,bindings,f));
return (fexpr__92068.cljs$core$IFn$_invoke$arity$1 ? fexpr__92068.cljs$core$IFn$_invoke$arity$1(G__92069) : fexpr__92068.call(null,G__92069));
}catch (e92067){if((e92067 instanceof Error)){
var e__90645__auto__ = e92067;
return sci.impl.utils.rethrow_with_location_of_node.cljs$core$IFn$_invoke$arity$4(ctx,bindings,e__90645__auto__,this$);
} else {
throw e92067;

}
}}),stack);
} else {
return sci.impl.types.__GT_NodeR((function (this$,ctx,bindings){
try{var G__92071 = sci.impl.types.eval(arg0,ctx,bindings);
return (f.cljs$core$IFn$_invoke$arity$1 ? f.cljs$core$IFn$_invoke$arity$1(G__92071) : f.call(null,G__92071));
}catch (e92070){if((e92070 instanceof Error)){
var e__90645__auto__ = e92070;
return sci.impl.utils.rethrow_with_location_of_node.cljs$core$IFn$_invoke$arity$4(ctx,bindings,e__90645__auto__,this$);
} else {
throw e92070;

}
}}),stack);
}

break;
case (2):
var arg0 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(0));
var arg1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(1));
if(cljs.core.truth_(wrap)){
return sci.impl.types.__GT_NodeR((function (this$,ctx,bindings){
try{var G__92074 = sci.impl.types.eval(arg0,ctx,bindings);
var G__92075 = sci.impl.types.eval(arg1,ctx,bindings);
var fexpr__92073 = (wrap.cljs$core$IFn$_invoke$arity$2 ? wrap.cljs$core$IFn$_invoke$arity$2(bindings,f) : wrap.call(null,bindings,f));
return (fexpr__92073.cljs$core$IFn$_invoke$arity$2 ? fexpr__92073.cljs$core$IFn$_invoke$arity$2(G__92074,G__92075) : fexpr__92073.call(null,G__92074,G__92075));
}catch (e92072){if((e92072 instanceof Error)){
var e__90645__auto__ = e92072;
return sci.impl.utils.rethrow_with_location_of_node.cljs$core$IFn$_invoke$arity$4(ctx,bindings,e__90645__auto__,this$);
} else {
throw e92072;

}
}}),stack);
} else {
return sci.impl.types.__GT_NodeR((function (this$,ctx,bindings){
try{var G__92077 = sci.impl.types.eval(arg0,ctx,bindings);
var G__92078 = sci.impl.types.eval(arg1,ctx,bindings);
return (f.cljs$core$IFn$_invoke$arity$2 ? f.cljs$core$IFn$_invoke$arity$2(G__92077,G__92078) : f.call(null,G__92077,G__92078));
}catch (e92076){if((e92076 instanceof Error)){
var e__90645__auto__ = e92076;
return sci.impl.utils.rethrow_with_location_of_node.cljs$core$IFn$_invoke$arity$4(ctx,bindings,e__90645__auto__,this$);
} else {
throw e92076;

}
}}),stack);
}

break;
case (3):
var arg0 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(0));
var arg1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(1));
var arg2 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(2));
if(cljs.core.truth_(wrap)){
return sci.impl.types.__GT_NodeR((function (this$,ctx,bindings){
try{var G__92081 = sci.impl.types.eval(arg0,ctx,bindings);
var G__92082 = sci.impl.types.eval(arg1,ctx,bindings);
var G__92083 = sci.impl.types.eval(arg2,ctx,bindings);
var fexpr__92080 = (wrap.cljs$core$IFn$_invoke$arity$2 ? wrap.cljs$core$IFn$_invoke$arity$2(bindings,f) : wrap.call(null,bindings,f));
return (fexpr__92080.cljs$core$IFn$_invoke$arity$3 ? fexpr__92080.cljs$core$IFn$_invoke$arity$3(G__92081,G__92082,G__92083) : fexpr__92080.call(null,G__92081,G__92082,G__92083));
}catch (e92079){if((e92079 instanceof Error)){
var e__90645__auto__ = e92079;
return sci.impl.utils.rethrow_with_location_of_node.cljs$core$IFn$_invoke$arity$4(ctx,bindings,e__90645__auto__,this$);
} else {
throw e92079;

}
}}),stack);
} else {
return sci.impl.types.__GT_NodeR((function (this$,ctx,bindings){
try{var G__92085 = sci.impl.types.eval(arg0,ctx,bindings);
var G__92086 = sci.impl.types.eval(arg1,ctx,bindings);
var G__92087 = sci.impl.types.eval(arg2,ctx,bindings);
return (f.cljs$core$IFn$_invoke$arity$3 ? f.cljs$core$IFn$_invoke$arity$3(G__92085,G__92086,G__92087) : f.call(null,G__92085,G__92086,G__92087));
}catch (e92084){if((e92084 instanceof Error)){
var e__90645__auto__ = e92084;
return sci.impl.utils.rethrow_with_location_of_node.cljs$core$IFn$_invoke$arity$4(ctx,bindings,e__90645__auto__,this$);
} else {
throw e92084;

}
}}),stack);
}

break;
case (4):
var arg0 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(0));
var arg1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(1));
var arg2 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(2));
var arg3 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(3));
if(cljs.core.truth_(wrap)){
return sci.impl.types.__GT_NodeR((function (this$,ctx,bindings){
try{var G__92090 = sci.impl.types.eval(arg0,ctx,bindings);
var G__92091 = sci.impl.types.eval(arg1,ctx,bindings);
var G__92092 = sci.impl.types.eval(arg2,ctx,bindings);
var G__92093 = sci.impl.types.eval(arg3,ctx,bindings);
var fexpr__92089 = (wrap.cljs$core$IFn$_invoke$arity$2 ? wrap.cljs$core$IFn$_invoke$arity$2(bindings,f) : wrap.call(null,bindings,f));
return (fexpr__92089.cljs$core$IFn$_invoke$arity$4 ? fexpr__92089.cljs$core$IFn$_invoke$arity$4(G__92090,G__92091,G__92092,G__92093) : fexpr__92089.call(null,G__92090,G__92091,G__92092,G__92093));
}catch (e92088){if((e92088 instanceof Error)){
var e__90645__auto__ = e92088;
return sci.impl.utils.rethrow_with_location_of_node.cljs$core$IFn$_invoke$arity$4(ctx,bindings,e__90645__auto__,this$);
} else {
throw e92088;

}
}}),stack);
} else {
return sci.impl.types.__GT_NodeR((function (this$,ctx,bindings){
try{var G__92095 = sci.impl.types.eval(arg0,ctx,bindings);
var G__92096 = sci.impl.types.eval(arg1,ctx,bindings);
var G__92097 = sci.impl.types.eval(arg2,ctx,bindings);
var G__92098 = sci.impl.types.eval(arg3,ctx,bindings);
return (f.cljs$core$IFn$_invoke$arity$4 ? f.cljs$core$IFn$_invoke$arity$4(G__92095,G__92096,G__92097,G__92098) : f.call(null,G__92095,G__92096,G__92097,G__92098));
}catch (e92094){if((e92094 instanceof Error)){
var e__90645__auto__ = e92094;
return sci.impl.utils.rethrow_with_location_of_node.cljs$core$IFn$_invoke$arity$4(ctx,bindings,e__90645__auto__,this$);
} else {
throw e92094;

}
}}),stack);
}

break;
case (5):
var arg0 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(0));
var arg1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(1));
var arg2 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(2));
var arg3 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(3));
var arg4 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(4));
if(cljs.core.truth_(wrap)){
return sci.impl.types.__GT_NodeR((function (this$,ctx,bindings){
try{var G__92101 = sci.impl.types.eval(arg0,ctx,bindings);
var G__92102 = sci.impl.types.eval(arg1,ctx,bindings);
var G__92103 = sci.impl.types.eval(arg2,ctx,bindings);
var G__92104 = sci.impl.types.eval(arg3,ctx,bindings);
var G__92105 = sci.impl.types.eval(arg4,ctx,bindings);
var fexpr__92100 = (wrap.cljs$core$IFn$_invoke$arity$2 ? wrap.cljs$core$IFn$_invoke$arity$2(bindings,f) : wrap.call(null,bindings,f));
return (fexpr__92100.cljs$core$IFn$_invoke$arity$5 ? fexpr__92100.cljs$core$IFn$_invoke$arity$5(G__92101,G__92102,G__92103,G__92104,G__92105) : fexpr__92100.call(null,G__92101,G__92102,G__92103,G__92104,G__92105));
}catch (e92099){if((e92099 instanceof Error)){
var e__90645__auto__ = e92099;
return sci.impl.utils.rethrow_with_location_of_node.cljs$core$IFn$_invoke$arity$4(ctx,bindings,e__90645__auto__,this$);
} else {
throw e92099;

}
}}),stack);
} else {
return sci.impl.types.__GT_NodeR((function (this$,ctx,bindings){
try{var G__92107 = sci.impl.types.eval(arg0,ctx,bindings);
var G__92108 = sci.impl.types.eval(arg1,ctx,bindings);
var G__92109 = sci.impl.types.eval(arg2,ctx,bindings);
var G__92110 = sci.impl.types.eval(arg3,ctx,bindings);
var G__92111 = sci.impl.types.eval(arg4,ctx,bindings);
return (f.cljs$core$IFn$_invoke$arity$5 ? f.cljs$core$IFn$_invoke$arity$5(G__92107,G__92108,G__92109,G__92110,G__92111) : f.call(null,G__92107,G__92108,G__92109,G__92110,G__92111));
}catch (e92106){if((e92106 instanceof Error)){
var e__90645__auto__ = e92106;
return sci.impl.utils.rethrow_with_location_of_node.cljs$core$IFn$_invoke$arity$4(ctx,bindings,e__90645__auto__,this$);
} else {
throw e92106;

}
}}),stack);
}

break;
case (6):
var arg0 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(0));
var arg1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(1));
var arg2 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(2));
var arg3 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(3));
var arg4 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(4));
var arg5 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(5));
if(cljs.core.truth_(wrap)){
return sci.impl.types.__GT_NodeR((function (this$,ctx,bindings){
try{var G__92114 = sci.impl.types.eval(arg0,ctx,bindings);
var G__92115 = sci.impl.types.eval(arg1,ctx,bindings);
var G__92116 = sci.impl.types.eval(arg2,ctx,bindings);
var G__92117 = sci.impl.types.eval(arg3,ctx,bindings);
var G__92118 = sci.impl.types.eval(arg4,ctx,bindings);
var G__92119 = sci.impl.types.eval(arg5,ctx,bindings);
var fexpr__92113 = (wrap.cljs$core$IFn$_invoke$arity$2 ? wrap.cljs$core$IFn$_invoke$arity$2(bindings,f) : wrap.call(null,bindings,f));
return (fexpr__92113.cljs$core$IFn$_invoke$arity$6 ? fexpr__92113.cljs$core$IFn$_invoke$arity$6(G__92114,G__92115,G__92116,G__92117,G__92118,G__92119) : fexpr__92113.call(null,G__92114,G__92115,G__92116,G__92117,G__92118,G__92119));
}catch (e92112){if((e92112 instanceof Error)){
var e__90645__auto__ = e92112;
return sci.impl.utils.rethrow_with_location_of_node.cljs$core$IFn$_invoke$arity$4(ctx,bindings,e__90645__auto__,this$);
} else {
throw e92112;

}
}}),stack);
} else {
return sci.impl.types.__GT_NodeR((function (this$,ctx,bindings){
try{var G__92121 = sci.impl.types.eval(arg0,ctx,bindings);
var G__92122 = sci.impl.types.eval(arg1,ctx,bindings);
var G__92123 = sci.impl.types.eval(arg2,ctx,bindings);
var G__92124 = sci.impl.types.eval(arg3,ctx,bindings);
var G__92125 = sci.impl.types.eval(arg4,ctx,bindings);
var G__92126 = sci.impl.types.eval(arg5,ctx,bindings);
return (f.cljs$core$IFn$_invoke$arity$6 ? f.cljs$core$IFn$_invoke$arity$6(G__92121,G__92122,G__92123,G__92124,G__92125,G__92126) : f.call(null,G__92121,G__92122,G__92123,G__92124,G__92125,G__92126));
}catch (e92120){if((e92120 instanceof Error)){
var e__90645__auto__ = e92120;
return sci.impl.utils.rethrow_with_location_of_node.cljs$core$IFn$_invoke$arity$4(ctx,bindings,e__90645__auto__,this$);
} else {
throw e92120;

}
}}),stack);
}

break;
case (7):
var arg0 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(0));
var arg1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(1));
var arg2 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(2));
var arg3 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(3));
var arg4 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(4));
var arg5 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(5));
var arg6 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(6));
if(cljs.core.truth_(wrap)){
return sci.impl.types.__GT_NodeR((function (this$,ctx,bindings){
try{var G__92129 = sci.impl.types.eval(arg0,ctx,bindings);
var G__92130 = sci.impl.types.eval(arg1,ctx,bindings);
var G__92131 = sci.impl.types.eval(arg2,ctx,bindings);
var G__92132 = sci.impl.types.eval(arg3,ctx,bindings);
var G__92133 = sci.impl.types.eval(arg4,ctx,bindings);
var G__92134 = sci.impl.types.eval(arg5,ctx,bindings);
var G__92135 = sci.impl.types.eval(arg6,ctx,bindings);
var fexpr__92128 = (wrap.cljs$core$IFn$_invoke$arity$2 ? wrap.cljs$core$IFn$_invoke$arity$2(bindings,f) : wrap.call(null,bindings,f));
return (fexpr__92128.cljs$core$IFn$_invoke$arity$7 ? fexpr__92128.cljs$core$IFn$_invoke$arity$7(G__92129,G__92130,G__92131,G__92132,G__92133,G__92134,G__92135) : fexpr__92128.call(null,G__92129,G__92130,G__92131,G__92132,G__92133,G__92134,G__92135));
}catch (e92127){if((e92127 instanceof Error)){
var e__90645__auto__ = e92127;
return sci.impl.utils.rethrow_with_location_of_node.cljs$core$IFn$_invoke$arity$4(ctx,bindings,e__90645__auto__,this$);
} else {
throw e92127;

}
}}),stack);
} else {
return sci.impl.types.__GT_NodeR((function (this$,ctx,bindings){
try{var G__92137 = sci.impl.types.eval(arg0,ctx,bindings);
var G__92138 = sci.impl.types.eval(arg1,ctx,bindings);
var G__92139 = sci.impl.types.eval(arg2,ctx,bindings);
var G__92140 = sci.impl.types.eval(arg3,ctx,bindings);
var G__92141 = sci.impl.types.eval(arg4,ctx,bindings);
var G__92142 = sci.impl.types.eval(arg5,ctx,bindings);
var G__92143 = sci.impl.types.eval(arg6,ctx,bindings);
return (f.cljs$core$IFn$_invoke$arity$7 ? f.cljs$core$IFn$_invoke$arity$7(G__92137,G__92138,G__92139,G__92140,G__92141,G__92142,G__92143) : f.call(null,G__92137,G__92138,G__92139,G__92140,G__92141,G__92142,G__92143));
}catch (e92136){if((e92136 instanceof Error)){
var e__90645__auto__ = e92136;
return sci.impl.utils.rethrow_with_location_of_node.cljs$core$IFn$_invoke$arity$4(ctx,bindings,e__90645__auto__,this$);
} else {
throw e92136;

}
}}),stack);
}

break;
case (8):
var arg0 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(0));
var arg1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(1));
var arg2 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(2));
var arg3 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(3));
var arg4 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(4));
var arg5 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(5));
var arg6 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(6));
var arg7 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(7));
if(cljs.core.truth_(wrap)){
return sci.impl.types.__GT_NodeR((function (this$,ctx,bindings){
try{var G__92146 = sci.impl.types.eval(arg0,ctx,bindings);
var G__92147 = sci.impl.types.eval(arg1,ctx,bindings);
var G__92148 = sci.impl.types.eval(arg2,ctx,bindings);
var G__92149 = sci.impl.types.eval(arg3,ctx,bindings);
var G__92150 = sci.impl.types.eval(arg4,ctx,bindings);
var G__92151 = sci.impl.types.eval(arg5,ctx,bindings);
var G__92152 = sci.impl.types.eval(arg6,ctx,bindings);
var G__92153 = sci.impl.types.eval(arg7,ctx,bindings);
var fexpr__92145 = (wrap.cljs$core$IFn$_invoke$arity$2 ? wrap.cljs$core$IFn$_invoke$arity$2(bindings,f) : wrap.call(null,bindings,f));
return (fexpr__92145.cljs$core$IFn$_invoke$arity$8 ? fexpr__92145.cljs$core$IFn$_invoke$arity$8(G__92146,G__92147,G__92148,G__92149,G__92150,G__92151,G__92152,G__92153) : fexpr__92145.call(null,G__92146,G__92147,G__92148,G__92149,G__92150,G__92151,G__92152,G__92153));
}catch (e92144){if((e92144 instanceof Error)){
var e__90645__auto__ = e92144;
return sci.impl.utils.rethrow_with_location_of_node.cljs$core$IFn$_invoke$arity$4(ctx,bindings,e__90645__auto__,this$);
} else {
throw e92144;

}
}}),stack);
} else {
return sci.impl.types.__GT_NodeR((function (this$,ctx,bindings){
try{var G__92155 = sci.impl.types.eval(arg0,ctx,bindings);
var G__92156 = sci.impl.types.eval(arg1,ctx,bindings);
var G__92157 = sci.impl.types.eval(arg2,ctx,bindings);
var G__92158 = sci.impl.types.eval(arg3,ctx,bindings);
var G__92159 = sci.impl.types.eval(arg4,ctx,bindings);
var G__92160 = sci.impl.types.eval(arg5,ctx,bindings);
var G__92161 = sci.impl.types.eval(arg6,ctx,bindings);
var G__92162 = sci.impl.types.eval(arg7,ctx,bindings);
return (f.cljs$core$IFn$_invoke$arity$8 ? f.cljs$core$IFn$_invoke$arity$8(G__92155,G__92156,G__92157,G__92158,G__92159,G__92160,G__92161,G__92162) : f.call(null,G__92155,G__92156,G__92157,G__92158,G__92159,G__92160,G__92161,G__92162));
}catch (e92154){if((e92154 instanceof Error)){
var e__90645__auto__ = e92154;
return sci.impl.utils.rethrow_with_location_of_node.cljs$core$IFn$_invoke$arity$4(ctx,bindings,e__90645__auto__,this$);
} else {
throw e92154;

}
}}),stack);
}

break;
case (9):
var arg0 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(0));
var arg1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(1));
var arg2 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(2));
var arg3 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(3));
var arg4 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(4));
var arg5 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(5));
var arg6 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(6));
var arg7 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(7));
var arg8 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(8));
if(cljs.core.truth_(wrap)){
return sci.impl.types.__GT_NodeR((function (this$,ctx,bindings){
try{var G__92165 = sci.impl.types.eval(arg0,ctx,bindings);
var G__92166 = sci.impl.types.eval(arg1,ctx,bindings);
var G__92167 = sci.impl.types.eval(arg2,ctx,bindings);
var G__92168 = sci.impl.types.eval(arg3,ctx,bindings);
var G__92169 = sci.impl.types.eval(arg4,ctx,bindings);
var G__92170 = sci.impl.types.eval(arg5,ctx,bindings);
var G__92171 = sci.impl.types.eval(arg6,ctx,bindings);
var G__92172 = sci.impl.types.eval(arg7,ctx,bindings);
var G__92173 = sci.impl.types.eval(arg8,ctx,bindings);
var fexpr__92164 = (wrap.cljs$core$IFn$_invoke$arity$2 ? wrap.cljs$core$IFn$_invoke$arity$2(bindings,f) : wrap.call(null,bindings,f));
return (fexpr__92164.cljs$core$IFn$_invoke$arity$9 ? fexpr__92164.cljs$core$IFn$_invoke$arity$9(G__92165,G__92166,G__92167,G__92168,G__92169,G__92170,G__92171,G__92172,G__92173) : fexpr__92164.call(null,G__92165,G__92166,G__92167,G__92168,G__92169,G__92170,G__92171,G__92172,G__92173));
}catch (e92163){if((e92163 instanceof Error)){
var e__90645__auto__ = e92163;
return sci.impl.utils.rethrow_with_location_of_node.cljs$core$IFn$_invoke$arity$4(ctx,bindings,e__90645__auto__,this$);
} else {
throw e92163;

}
}}),stack);
} else {
return sci.impl.types.__GT_NodeR((function (this$,ctx,bindings){
try{var G__92175 = sci.impl.types.eval(arg0,ctx,bindings);
var G__92176 = sci.impl.types.eval(arg1,ctx,bindings);
var G__92177 = sci.impl.types.eval(arg2,ctx,bindings);
var G__92178 = sci.impl.types.eval(arg3,ctx,bindings);
var G__92179 = sci.impl.types.eval(arg4,ctx,bindings);
var G__92180 = sci.impl.types.eval(arg5,ctx,bindings);
var G__92181 = sci.impl.types.eval(arg6,ctx,bindings);
var G__92182 = sci.impl.types.eval(arg7,ctx,bindings);
var G__92183 = sci.impl.types.eval(arg8,ctx,bindings);
return (f.cljs$core$IFn$_invoke$arity$9 ? f.cljs$core$IFn$_invoke$arity$9(G__92175,G__92176,G__92177,G__92178,G__92179,G__92180,G__92181,G__92182,G__92183) : f.call(null,G__92175,G__92176,G__92177,G__92178,G__92179,G__92180,G__92181,G__92182,G__92183));
}catch (e92174){if((e92174 instanceof Error)){
var e__90645__auto__ = e92174;
return sci.impl.utils.rethrow_with_location_of_node.cljs$core$IFn$_invoke$arity$4(ctx,bindings,e__90645__auto__,this$);
} else {
throw e92174;

}
}}),stack);
}

break;
case (10):
var arg0 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(0));
var arg1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(1));
var arg2 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(2));
var arg3 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(3));
var arg4 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(4));
var arg5 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(5));
var arg6 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(6));
var arg7 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(7));
var arg8 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(8));
var arg9 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(9));
if(cljs.core.truth_(wrap)){
return sci.impl.types.__GT_NodeR((function (this$,ctx,bindings){
try{var G__92186 = sci.impl.types.eval(arg0,ctx,bindings);
var G__92187 = sci.impl.types.eval(arg1,ctx,bindings);
var G__92188 = sci.impl.types.eval(arg2,ctx,bindings);
var G__92189 = sci.impl.types.eval(arg3,ctx,bindings);
var G__92190 = sci.impl.types.eval(arg4,ctx,bindings);
var G__92191 = sci.impl.types.eval(arg5,ctx,bindings);
var G__92192 = sci.impl.types.eval(arg6,ctx,bindings);
var G__92193 = sci.impl.types.eval(arg7,ctx,bindings);
var G__92194 = sci.impl.types.eval(arg8,ctx,bindings);
var G__92195 = sci.impl.types.eval(arg9,ctx,bindings);
var fexpr__92185 = (wrap.cljs$core$IFn$_invoke$arity$2 ? wrap.cljs$core$IFn$_invoke$arity$2(bindings,f) : wrap.call(null,bindings,f));
return (fexpr__92185.cljs$core$IFn$_invoke$arity$10 ? fexpr__92185.cljs$core$IFn$_invoke$arity$10(G__92186,G__92187,G__92188,G__92189,G__92190,G__92191,G__92192,G__92193,G__92194,G__92195) : fexpr__92185.call(null,G__92186,G__92187,G__92188,G__92189,G__92190,G__92191,G__92192,G__92193,G__92194,G__92195));
}catch (e92184){if((e92184 instanceof Error)){
var e__90645__auto__ = e92184;
return sci.impl.utils.rethrow_with_location_of_node.cljs$core$IFn$_invoke$arity$4(ctx,bindings,e__90645__auto__,this$);
} else {
throw e92184;

}
}}),stack);
} else {
return sci.impl.types.__GT_NodeR((function (this$,ctx,bindings){
try{var G__92197 = sci.impl.types.eval(arg0,ctx,bindings);
var G__92198 = sci.impl.types.eval(arg1,ctx,bindings);
var G__92199 = sci.impl.types.eval(arg2,ctx,bindings);
var G__92200 = sci.impl.types.eval(arg3,ctx,bindings);
var G__92201 = sci.impl.types.eval(arg4,ctx,bindings);
var G__92202 = sci.impl.types.eval(arg5,ctx,bindings);
var G__92203 = sci.impl.types.eval(arg6,ctx,bindings);
var G__92204 = sci.impl.types.eval(arg7,ctx,bindings);
var G__92205 = sci.impl.types.eval(arg8,ctx,bindings);
var G__92206 = sci.impl.types.eval(arg9,ctx,bindings);
return (f.cljs$core$IFn$_invoke$arity$10 ? f.cljs$core$IFn$_invoke$arity$10(G__92197,G__92198,G__92199,G__92200,G__92201,G__92202,G__92203,G__92204,G__92205,G__92206) : f.call(null,G__92197,G__92198,G__92199,G__92200,G__92201,G__92202,G__92203,G__92204,G__92205,G__92206));
}catch (e92196){if((e92196 instanceof Error)){
var e__90645__auto__ = e92196;
return sci.impl.utils.rethrow_with_location_of_node.cljs$core$IFn$_invoke$arity$4(ctx,bindings,e__90645__auto__,this$);
} else {
throw e92196;

}
}}),stack);
}

break;
case (11):
var arg0 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(0));
var arg1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(1));
var arg2 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(2));
var arg3 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(3));
var arg4 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(4));
var arg5 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(5));
var arg6 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(6));
var arg7 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(7));
var arg8 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(8));
var arg9 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(9));
var arg10 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(10));
if(cljs.core.truth_(wrap)){
return sci.impl.types.__GT_NodeR((function (this$,ctx,bindings){
try{var G__92209 = sci.impl.types.eval(arg0,ctx,bindings);
var G__92210 = sci.impl.types.eval(arg1,ctx,bindings);
var G__92211 = sci.impl.types.eval(arg2,ctx,bindings);
var G__92212 = sci.impl.types.eval(arg3,ctx,bindings);
var G__92213 = sci.impl.types.eval(arg4,ctx,bindings);
var G__92214 = sci.impl.types.eval(arg5,ctx,bindings);
var G__92215 = sci.impl.types.eval(arg6,ctx,bindings);
var G__92216 = sci.impl.types.eval(arg7,ctx,bindings);
var G__92217 = sci.impl.types.eval(arg8,ctx,bindings);
var G__92218 = sci.impl.types.eval(arg9,ctx,bindings);
var G__92219 = sci.impl.types.eval(arg10,ctx,bindings);
var fexpr__92208 = (wrap.cljs$core$IFn$_invoke$arity$2 ? wrap.cljs$core$IFn$_invoke$arity$2(bindings,f) : wrap.call(null,bindings,f));
return (fexpr__92208.cljs$core$IFn$_invoke$arity$11 ? fexpr__92208.cljs$core$IFn$_invoke$arity$11(G__92209,G__92210,G__92211,G__92212,G__92213,G__92214,G__92215,G__92216,G__92217,G__92218,G__92219) : fexpr__92208.call(null,G__92209,G__92210,G__92211,G__92212,G__92213,G__92214,G__92215,G__92216,G__92217,G__92218,G__92219));
}catch (e92207){if((e92207 instanceof Error)){
var e__90645__auto__ = e92207;
return sci.impl.utils.rethrow_with_location_of_node.cljs$core$IFn$_invoke$arity$4(ctx,bindings,e__90645__auto__,this$);
} else {
throw e92207;

}
}}),stack);
} else {
return sci.impl.types.__GT_NodeR((function (this$,ctx,bindings){
try{var G__92221 = sci.impl.types.eval(arg0,ctx,bindings);
var G__92222 = sci.impl.types.eval(arg1,ctx,bindings);
var G__92223 = sci.impl.types.eval(arg2,ctx,bindings);
var G__92224 = sci.impl.types.eval(arg3,ctx,bindings);
var G__92225 = sci.impl.types.eval(arg4,ctx,bindings);
var G__92226 = sci.impl.types.eval(arg5,ctx,bindings);
var G__92227 = sci.impl.types.eval(arg6,ctx,bindings);
var G__92228 = sci.impl.types.eval(arg7,ctx,bindings);
var G__92229 = sci.impl.types.eval(arg8,ctx,bindings);
var G__92230 = sci.impl.types.eval(arg9,ctx,bindings);
var G__92231 = sci.impl.types.eval(arg10,ctx,bindings);
return (f.cljs$core$IFn$_invoke$arity$11 ? f.cljs$core$IFn$_invoke$arity$11(G__92221,G__92222,G__92223,G__92224,G__92225,G__92226,G__92227,G__92228,G__92229,G__92230,G__92231) : f.call(null,G__92221,G__92222,G__92223,G__92224,G__92225,G__92226,G__92227,G__92228,G__92229,G__92230,G__92231));
}catch (e92220){if((e92220 instanceof Error)){
var e__90645__auto__ = e92220;
return sci.impl.utils.rethrow_with_location_of_node.cljs$core$IFn$_invoke$arity$4(ctx,bindings,e__90645__auto__,this$);
} else {
throw e92220;

}
}}),stack);
}

break;
case (12):
var arg0 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(0));
var arg1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(1));
var arg2 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(2));
var arg3 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(3));
var arg4 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(4));
var arg5 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(5));
var arg6 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(6));
var arg7 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(7));
var arg8 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(8));
var arg9 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(9));
var arg10 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(10));
var arg11 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(11));
if(cljs.core.truth_(wrap)){
return sci.impl.types.__GT_NodeR((function (this$,ctx,bindings){
try{var G__92238 = sci.impl.types.eval(arg0,ctx,bindings);
var G__92239 = sci.impl.types.eval(arg1,ctx,bindings);
var G__92240 = sci.impl.types.eval(arg2,ctx,bindings);
var G__92241 = sci.impl.types.eval(arg3,ctx,bindings);
var G__92242 = sci.impl.types.eval(arg4,ctx,bindings);
var G__92243 = sci.impl.types.eval(arg5,ctx,bindings);
var G__92244 = sci.impl.types.eval(arg6,ctx,bindings);
var G__92245 = sci.impl.types.eval(arg7,ctx,bindings);
var G__92246 = sci.impl.types.eval(arg8,ctx,bindings);
var G__92247 = sci.impl.types.eval(arg9,ctx,bindings);
var G__92248 = sci.impl.types.eval(arg10,ctx,bindings);
var G__92249 = sci.impl.types.eval(arg11,ctx,bindings);
var fexpr__92237 = (wrap.cljs$core$IFn$_invoke$arity$2 ? wrap.cljs$core$IFn$_invoke$arity$2(bindings,f) : wrap.call(null,bindings,f));
return (fexpr__92237.cljs$core$IFn$_invoke$arity$12 ? fexpr__92237.cljs$core$IFn$_invoke$arity$12(G__92238,G__92239,G__92240,G__92241,G__92242,G__92243,G__92244,G__92245,G__92246,G__92247,G__92248,G__92249) : fexpr__92237.call(null,G__92238,G__92239,G__92240,G__92241,G__92242,G__92243,G__92244,G__92245,G__92246,G__92247,G__92248,G__92249));
}catch (e92236){if((e92236 instanceof Error)){
var e__90645__auto__ = e92236;
return sci.impl.utils.rethrow_with_location_of_node.cljs$core$IFn$_invoke$arity$4(ctx,bindings,e__90645__auto__,this$);
} else {
throw e92236;

}
}}),stack);
} else {
return sci.impl.types.__GT_NodeR((function (this$,ctx,bindings){
try{var G__92258 = sci.impl.types.eval(arg0,ctx,bindings);
var G__92259 = sci.impl.types.eval(arg1,ctx,bindings);
var G__92260 = sci.impl.types.eval(arg2,ctx,bindings);
var G__92261 = sci.impl.types.eval(arg3,ctx,bindings);
var G__92262 = sci.impl.types.eval(arg4,ctx,bindings);
var G__92263 = sci.impl.types.eval(arg5,ctx,bindings);
var G__92264 = sci.impl.types.eval(arg6,ctx,bindings);
var G__92265 = sci.impl.types.eval(arg7,ctx,bindings);
var G__92266 = sci.impl.types.eval(arg8,ctx,bindings);
var G__92267 = sci.impl.types.eval(arg9,ctx,bindings);
var G__92268 = sci.impl.types.eval(arg10,ctx,bindings);
var G__92269 = sci.impl.types.eval(arg11,ctx,bindings);
return (f.cljs$core$IFn$_invoke$arity$12 ? f.cljs$core$IFn$_invoke$arity$12(G__92258,G__92259,G__92260,G__92261,G__92262,G__92263,G__92264,G__92265,G__92266,G__92267,G__92268,G__92269) : f.call(null,G__92258,G__92259,G__92260,G__92261,G__92262,G__92263,G__92264,G__92265,G__92266,G__92267,G__92268,G__92269));
}catch (e92253){if((e92253 instanceof Error)){
var e__90645__auto__ = e92253;
return sci.impl.utils.rethrow_with_location_of_node.cljs$core$IFn$_invoke$arity$4(ctx,bindings,e__90645__auto__,this$);
} else {
throw e92253;

}
}}),stack);
}

break;
case (13):
var arg0 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(0));
var arg1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(1));
var arg2 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(2));
var arg3 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(3));
var arg4 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(4));
var arg5 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(5));
var arg6 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(6));
var arg7 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(7));
var arg8 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(8));
var arg9 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(9));
var arg10 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(10));
var arg11 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(11));
var arg12 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(12));
if(cljs.core.truth_(wrap)){
return sci.impl.types.__GT_NodeR((function (this$,ctx,bindings){
try{var G__92274 = sci.impl.types.eval(arg0,ctx,bindings);
var G__92275 = sci.impl.types.eval(arg1,ctx,bindings);
var G__92276 = sci.impl.types.eval(arg2,ctx,bindings);
var G__92277 = sci.impl.types.eval(arg3,ctx,bindings);
var G__92278 = sci.impl.types.eval(arg4,ctx,bindings);
var G__92279 = sci.impl.types.eval(arg5,ctx,bindings);
var G__92280 = sci.impl.types.eval(arg6,ctx,bindings);
var G__92281 = sci.impl.types.eval(arg7,ctx,bindings);
var G__92282 = sci.impl.types.eval(arg8,ctx,bindings);
var G__92283 = sci.impl.types.eval(arg9,ctx,bindings);
var G__92284 = sci.impl.types.eval(arg10,ctx,bindings);
var G__92285 = sci.impl.types.eval(arg11,ctx,bindings);
var G__92286 = sci.impl.types.eval(arg12,ctx,bindings);
var fexpr__92273 = (wrap.cljs$core$IFn$_invoke$arity$2 ? wrap.cljs$core$IFn$_invoke$arity$2(bindings,f) : wrap.call(null,bindings,f));
return (fexpr__92273.cljs$core$IFn$_invoke$arity$13 ? fexpr__92273.cljs$core$IFn$_invoke$arity$13(G__92274,G__92275,G__92276,G__92277,G__92278,G__92279,G__92280,G__92281,G__92282,G__92283,G__92284,G__92285,G__92286) : fexpr__92273.call(null,G__92274,G__92275,G__92276,G__92277,G__92278,G__92279,G__92280,G__92281,G__92282,G__92283,G__92284,G__92285,G__92286));
}catch (e92272){if((e92272 instanceof Error)){
var e__90645__auto__ = e92272;
return sci.impl.utils.rethrow_with_location_of_node.cljs$core$IFn$_invoke$arity$4(ctx,bindings,e__90645__auto__,this$);
} else {
throw e92272;

}
}}),stack);
} else {
return sci.impl.types.__GT_NodeR((function (this$,ctx,bindings){
try{var G__92290 = sci.impl.types.eval(arg0,ctx,bindings);
var G__92291 = sci.impl.types.eval(arg1,ctx,bindings);
var G__92292 = sci.impl.types.eval(arg2,ctx,bindings);
var G__92293 = sci.impl.types.eval(arg3,ctx,bindings);
var G__92294 = sci.impl.types.eval(arg4,ctx,bindings);
var G__92295 = sci.impl.types.eval(arg5,ctx,bindings);
var G__92296 = sci.impl.types.eval(arg6,ctx,bindings);
var G__92297 = sci.impl.types.eval(arg7,ctx,bindings);
var G__92298 = sci.impl.types.eval(arg8,ctx,bindings);
var G__92299 = sci.impl.types.eval(arg9,ctx,bindings);
var G__92300 = sci.impl.types.eval(arg10,ctx,bindings);
var G__92301 = sci.impl.types.eval(arg11,ctx,bindings);
var G__92302 = sci.impl.types.eval(arg12,ctx,bindings);
return (f.cljs$core$IFn$_invoke$arity$13 ? f.cljs$core$IFn$_invoke$arity$13(G__92290,G__92291,G__92292,G__92293,G__92294,G__92295,G__92296,G__92297,G__92298,G__92299,G__92300,G__92301,G__92302) : f.call(null,G__92290,G__92291,G__92292,G__92293,G__92294,G__92295,G__92296,G__92297,G__92298,G__92299,G__92300,G__92301,G__92302));
}catch (e92289){if((e92289 instanceof Error)){
var e__90645__auto__ = e92289;
return sci.impl.utils.rethrow_with_location_of_node.cljs$core$IFn$_invoke$arity$4(ctx,bindings,e__90645__auto__,this$);
} else {
throw e92289;

}
}}),stack);
}

break;
case (14):
var arg0 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(0));
var arg1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(1));
var arg2 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(2));
var arg3 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(3));
var arg4 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(4));
var arg5 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(5));
var arg6 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(6));
var arg7 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(7));
var arg8 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(8));
var arg9 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(9));
var arg10 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(10));
var arg11 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(11));
var arg12 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(12));
var arg13 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(13));
if(cljs.core.truth_(wrap)){
return sci.impl.types.__GT_NodeR((function (this$,ctx,bindings){
try{var G__92306 = sci.impl.types.eval(arg0,ctx,bindings);
var G__92307 = sci.impl.types.eval(arg1,ctx,bindings);
var G__92308 = sci.impl.types.eval(arg2,ctx,bindings);
var G__92309 = sci.impl.types.eval(arg3,ctx,bindings);
var G__92310 = sci.impl.types.eval(arg4,ctx,bindings);
var G__92311 = sci.impl.types.eval(arg5,ctx,bindings);
var G__92312 = sci.impl.types.eval(arg6,ctx,bindings);
var G__92313 = sci.impl.types.eval(arg7,ctx,bindings);
var G__92314 = sci.impl.types.eval(arg8,ctx,bindings);
var G__92315 = sci.impl.types.eval(arg9,ctx,bindings);
var G__92316 = sci.impl.types.eval(arg10,ctx,bindings);
var G__92317 = sci.impl.types.eval(arg11,ctx,bindings);
var G__92318 = sci.impl.types.eval(arg12,ctx,bindings);
var G__92319 = sci.impl.types.eval(arg13,ctx,bindings);
var fexpr__92305 = (wrap.cljs$core$IFn$_invoke$arity$2 ? wrap.cljs$core$IFn$_invoke$arity$2(bindings,f) : wrap.call(null,bindings,f));
return (fexpr__92305.cljs$core$IFn$_invoke$arity$14 ? fexpr__92305.cljs$core$IFn$_invoke$arity$14(G__92306,G__92307,G__92308,G__92309,G__92310,G__92311,G__92312,G__92313,G__92314,G__92315,G__92316,G__92317,G__92318,G__92319) : fexpr__92305.call(null,G__92306,G__92307,G__92308,G__92309,G__92310,G__92311,G__92312,G__92313,G__92314,G__92315,G__92316,G__92317,G__92318,G__92319));
}catch (e92304){if((e92304 instanceof Error)){
var e__90645__auto__ = e92304;
return sci.impl.utils.rethrow_with_location_of_node.cljs$core$IFn$_invoke$arity$4(ctx,bindings,e__90645__auto__,this$);
} else {
throw e92304;

}
}}),stack);
} else {
return sci.impl.types.__GT_NodeR((function (this$,ctx,bindings){
try{var G__92325 = sci.impl.types.eval(arg0,ctx,bindings);
var G__92326 = sci.impl.types.eval(arg1,ctx,bindings);
var G__92327 = sci.impl.types.eval(arg2,ctx,bindings);
var G__92328 = sci.impl.types.eval(arg3,ctx,bindings);
var G__92329 = sci.impl.types.eval(arg4,ctx,bindings);
var G__92330 = sci.impl.types.eval(arg5,ctx,bindings);
var G__92331 = sci.impl.types.eval(arg6,ctx,bindings);
var G__92332 = sci.impl.types.eval(arg7,ctx,bindings);
var G__92333 = sci.impl.types.eval(arg8,ctx,bindings);
var G__92334 = sci.impl.types.eval(arg9,ctx,bindings);
var G__92335 = sci.impl.types.eval(arg10,ctx,bindings);
var G__92336 = sci.impl.types.eval(arg11,ctx,bindings);
var G__92337 = sci.impl.types.eval(arg12,ctx,bindings);
var G__92338 = sci.impl.types.eval(arg13,ctx,bindings);
return (f.cljs$core$IFn$_invoke$arity$14 ? f.cljs$core$IFn$_invoke$arity$14(G__92325,G__92326,G__92327,G__92328,G__92329,G__92330,G__92331,G__92332,G__92333,G__92334,G__92335,G__92336,G__92337,G__92338) : f.call(null,G__92325,G__92326,G__92327,G__92328,G__92329,G__92330,G__92331,G__92332,G__92333,G__92334,G__92335,G__92336,G__92337,G__92338));
}catch (e92322){if((e92322 instanceof Error)){
var e__90645__auto__ = e92322;
return sci.impl.utils.rethrow_with_location_of_node.cljs$core$IFn$_invoke$arity$4(ctx,bindings,e__90645__auto__,this$);
} else {
throw e92322;

}
}}),stack);
}

break;
case (15):
var arg0 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(0));
var arg1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(1));
var arg2 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(2));
var arg3 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(3));
var arg4 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(4));
var arg5 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(5));
var arg6 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(6));
var arg7 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(7));
var arg8 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(8));
var arg9 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(9));
var arg10 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(10));
var arg11 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(11));
var arg12 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(12));
var arg13 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(13));
var arg14 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(14));
if(cljs.core.truth_(wrap)){
return sci.impl.types.__GT_NodeR((function (this$,ctx,bindings){
try{var G__92344 = sci.impl.types.eval(arg0,ctx,bindings);
var G__92345 = sci.impl.types.eval(arg1,ctx,bindings);
var G__92346 = sci.impl.types.eval(arg2,ctx,bindings);
var G__92347 = sci.impl.types.eval(arg3,ctx,bindings);
var G__92348 = sci.impl.types.eval(arg4,ctx,bindings);
var G__92349 = sci.impl.types.eval(arg5,ctx,bindings);
var G__92350 = sci.impl.types.eval(arg6,ctx,bindings);
var G__92351 = sci.impl.types.eval(arg7,ctx,bindings);
var G__92352 = sci.impl.types.eval(arg8,ctx,bindings);
var G__92353 = sci.impl.types.eval(arg9,ctx,bindings);
var G__92354 = sci.impl.types.eval(arg10,ctx,bindings);
var G__92355 = sci.impl.types.eval(arg11,ctx,bindings);
var G__92356 = sci.impl.types.eval(arg12,ctx,bindings);
var G__92357 = sci.impl.types.eval(arg13,ctx,bindings);
var G__92358 = sci.impl.types.eval(arg14,ctx,bindings);
var fexpr__92343 = (wrap.cljs$core$IFn$_invoke$arity$2 ? wrap.cljs$core$IFn$_invoke$arity$2(bindings,f) : wrap.call(null,bindings,f));
return (fexpr__92343.cljs$core$IFn$_invoke$arity$15 ? fexpr__92343.cljs$core$IFn$_invoke$arity$15(G__92344,G__92345,G__92346,G__92347,G__92348,G__92349,G__92350,G__92351,G__92352,G__92353,G__92354,G__92355,G__92356,G__92357,G__92358) : fexpr__92343.call(null,G__92344,G__92345,G__92346,G__92347,G__92348,G__92349,G__92350,G__92351,G__92352,G__92353,G__92354,G__92355,G__92356,G__92357,G__92358));
}catch (e92342){if((e92342 instanceof Error)){
var e__90645__auto__ = e92342;
return sci.impl.utils.rethrow_with_location_of_node.cljs$core$IFn$_invoke$arity$4(ctx,bindings,e__90645__auto__,this$);
} else {
throw e92342;

}
}}),stack);
} else {
return sci.impl.types.__GT_NodeR((function (this$,ctx,bindings){
try{var G__92363 = sci.impl.types.eval(arg0,ctx,bindings);
var G__92364 = sci.impl.types.eval(arg1,ctx,bindings);
var G__92365 = sci.impl.types.eval(arg2,ctx,bindings);
var G__92366 = sci.impl.types.eval(arg3,ctx,bindings);
var G__92367 = sci.impl.types.eval(arg4,ctx,bindings);
var G__92368 = sci.impl.types.eval(arg5,ctx,bindings);
var G__92369 = sci.impl.types.eval(arg6,ctx,bindings);
var G__92370 = sci.impl.types.eval(arg7,ctx,bindings);
var G__92371 = sci.impl.types.eval(arg8,ctx,bindings);
var G__92372 = sci.impl.types.eval(arg9,ctx,bindings);
var G__92373 = sci.impl.types.eval(arg10,ctx,bindings);
var G__92374 = sci.impl.types.eval(arg11,ctx,bindings);
var G__92375 = sci.impl.types.eval(arg12,ctx,bindings);
var G__92376 = sci.impl.types.eval(arg13,ctx,bindings);
var G__92377 = sci.impl.types.eval(arg14,ctx,bindings);
return (f.cljs$core$IFn$_invoke$arity$15 ? f.cljs$core$IFn$_invoke$arity$15(G__92363,G__92364,G__92365,G__92366,G__92367,G__92368,G__92369,G__92370,G__92371,G__92372,G__92373,G__92374,G__92375,G__92376,G__92377) : f.call(null,G__92363,G__92364,G__92365,G__92366,G__92367,G__92368,G__92369,G__92370,G__92371,G__92372,G__92373,G__92374,G__92375,G__92376,G__92377));
}catch (e92361){if((e92361 instanceof Error)){
var e__90645__auto__ = e92361;
return sci.impl.utils.rethrow_with_location_of_node.cljs$core$IFn$_invoke$arity$4(ctx,bindings,e__90645__auto__,this$);
} else {
throw e92361;

}
}}),stack);
}

break;
case (16):
var arg0 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(0));
var arg1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(1));
var arg2 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(2));
var arg3 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(3));
var arg4 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(4));
var arg5 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(5));
var arg6 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(6));
var arg7 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(7));
var arg8 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(8));
var arg9 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(9));
var arg10 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(10));
var arg11 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(11));
var arg12 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(12));
var arg13 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(13));
var arg14 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(14));
var arg15 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(15));
if(cljs.core.truth_(wrap)){
return sci.impl.types.__GT_NodeR((function (this$,ctx,bindings){
try{var G__92382 = sci.impl.types.eval(arg0,ctx,bindings);
var G__92383 = sci.impl.types.eval(arg1,ctx,bindings);
var G__92384 = sci.impl.types.eval(arg2,ctx,bindings);
var G__92385 = sci.impl.types.eval(arg3,ctx,bindings);
var G__92386 = sci.impl.types.eval(arg4,ctx,bindings);
var G__92387 = sci.impl.types.eval(arg5,ctx,bindings);
var G__92388 = sci.impl.types.eval(arg6,ctx,bindings);
var G__92389 = sci.impl.types.eval(arg7,ctx,bindings);
var G__92390 = sci.impl.types.eval(arg8,ctx,bindings);
var G__92391 = sci.impl.types.eval(arg9,ctx,bindings);
var G__92392 = sci.impl.types.eval(arg10,ctx,bindings);
var G__92393 = sci.impl.types.eval(arg11,ctx,bindings);
var G__92394 = sci.impl.types.eval(arg12,ctx,bindings);
var G__92395 = sci.impl.types.eval(arg13,ctx,bindings);
var G__92396 = sci.impl.types.eval(arg14,ctx,bindings);
var G__92397 = sci.impl.types.eval(arg15,ctx,bindings);
var fexpr__92381 = (wrap.cljs$core$IFn$_invoke$arity$2 ? wrap.cljs$core$IFn$_invoke$arity$2(bindings,f) : wrap.call(null,bindings,f));
return (fexpr__92381.cljs$core$IFn$_invoke$arity$16 ? fexpr__92381.cljs$core$IFn$_invoke$arity$16(G__92382,G__92383,G__92384,G__92385,G__92386,G__92387,G__92388,G__92389,G__92390,G__92391,G__92392,G__92393,G__92394,G__92395,G__92396,G__92397) : fexpr__92381.call(null,G__92382,G__92383,G__92384,G__92385,G__92386,G__92387,G__92388,G__92389,G__92390,G__92391,G__92392,G__92393,G__92394,G__92395,G__92396,G__92397));
}catch (e92380){if((e92380 instanceof Error)){
var e__90645__auto__ = e92380;
return sci.impl.utils.rethrow_with_location_of_node.cljs$core$IFn$_invoke$arity$4(ctx,bindings,e__90645__auto__,this$);
} else {
throw e92380;

}
}}),stack);
} else {
return sci.impl.types.__GT_NodeR((function (this$,ctx,bindings){
try{var G__92400 = sci.impl.types.eval(arg0,ctx,bindings);
var G__92401 = sci.impl.types.eval(arg1,ctx,bindings);
var G__92402 = sci.impl.types.eval(arg2,ctx,bindings);
var G__92403 = sci.impl.types.eval(arg3,ctx,bindings);
var G__92404 = sci.impl.types.eval(arg4,ctx,bindings);
var G__92405 = sci.impl.types.eval(arg5,ctx,bindings);
var G__92406 = sci.impl.types.eval(arg6,ctx,bindings);
var G__92407 = sci.impl.types.eval(arg7,ctx,bindings);
var G__92408 = sci.impl.types.eval(arg8,ctx,bindings);
var G__92409 = sci.impl.types.eval(arg9,ctx,bindings);
var G__92410 = sci.impl.types.eval(arg10,ctx,bindings);
var G__92411 = sci.impl.types.eval(arg11,ctx,bindings);
var G__92412 = sci.impl.types.eval(arg12,ctx,bindings);
var G__92413 = sci.impl.types.eval(arg13,ctx,bindings);
var G__92414 = sci.impl.types.eval(arg14,ctx,bindings);
var G__92415 = sci.impl.types.eval(arg15,ctx,bindings);
return (f.cljs$core$IFn$_invoke$arity$16 ? f.cljs$core$IFn$_invoke$arity$16(G__92400,G__92401,G__92402,G__92403,G__92404,G__92405,G__92406,G__92407,G__92408,G__92409,G__92410,G__92411,G__92412,G__92413,G__92414,G__92415) : f.call(null,G__92400,G__92401,G__92402,G__92403,G__92404,G__92405,G__92406,G__92407,G__92408,G__92409,G__92410,G__92411,G__92412,G__92413,G__92414,G__92415));
}catch (e92399){if((e92399 instanceof Error)){
var e__90645__auto__ = e92399;
return sci.impl.utils.rethrow_with_location_of_node.cljs$core$IFn$_invoke$arity$4(ctx,bindings,e__90645__auto__,this$);
} else {
throw e92399;

}
}}),stack);
}

break;
case (17):
var arg0 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(0));
var arg1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(1));
var arg2 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(2));
var arg3 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(3));
var arg4 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(4));
var arg5 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(5));
var arg6 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(6));
var arg7 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(7));
var arg8 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(8));
var arg9 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(9));
var arg10 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(10));
var arg11 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(11));
var arg12 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(12));
var arg13 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(13));
var arg14 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(14));
var arg15 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(15));
var arg16 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(16));
if(cljs.core.truth_(wrap)){
return sci.impl.types.__GT_NodeR((function (this$,ctx,bindings){
try{var G__92423 = sci.impl.types.eval(arg0,ctx,bindings);
var G__92424 = sci.impl.types.eval(arg1,ctx,bindings);
var G__92425 = sci.impl.types.eval(arg2,ctx,bindings);
var G__92426 = sci.impl.types.eval(arg3,ctx,bindings);
var G__92427 = sci.impl.types.eval(arg4,ctx,bindings);
var G__92428 = sci.impl.types.eval(arg5,ctx,bindings);
var G__92429 = sci.impl.types.eval(arg6,ctx,bindings);
var G__92430 = sci.impl.types.eval(arg7,ctx,bindings);
var G__92431 = sci.impl.types.eval(arg8,ctx,bindings);
var G__92432 = sci.impl.types.eval(arg9,ctx,bindings);
var G__92433 = sci.impl.types.eval(arg10,ctx,bindings);
var G__92434 = sci.impl.types.eval(arg11,ctx,bindings);
var G__92435 = sci.impl.types.eval(arg12,ctx,bindings);
var G__92436 = sci.impl.types.eval(arg13,ctx,bindings);
var G__92437 = sci.impl.types.eval(arg14,ctx,bindings);
var G__92438 = sci.impl.types.eval(arg15,ctx,bindings);
var G__92439 = sci.impl.types.eval(arg16,ctx,bindings);
var fexpr__92422 = (wrap.cljs$core$IFn$_invoke$arity$2 ? wrap.cljs$core$IFn$_invoke$arity$2(bindings,f) : wrap.call(null,bindings,f));
return (fexpr__92422.cljs$core$IFn$_invoke$arity$17 ? fexpr__92422.cljs$core$IFn$_invoke$arity$17(G__92423,G__92424,G__92425,G__92426,G__92427,G__92428,G__92429,G__92430,G__92431,G__92432,G__92433,G__92434,G__92435,G__92436,G__92437,G__92438,G__92439) : fexpr__92422.call(null,G__92423,G__92424,G__92425,G__92426,G__92427,G__92428,G__92429,G__92430,G__92431,G__92432,G__92433,G__92434,G__92435,G__92436,G__92437,G__92438,G__92439));
}catch (e92421){if((e92421 instanceof Error)){
var e__90645__auto__ = e92421;
return sci.impl.utils.rethrow_with_location_of_node.cljs$core$IFn$_invoke$arity$4(ctx,bindings,e__90645__auto__,this$);
} else {
throw e92421;

}
}}),stack);
} else {
return sci.impl.types.__GT_NodeR((function (this$,ctx,bindings){
try{var G__92441 = sci.impl.types.eval(arg0,ctx,bindings);
var G__92442 = sci.impl.types.eval(arg1,ctx,bindings);
var G__92443 = sci.impl.types.eval(arg2,ctx,bindings);
var G__92444 = sci.impl.types.eval(arg3,ctx,bindings);
var G__92445 = sci.impl.types.eval(arg4,ctx,bindings);
var G__92446 = sci.impl.types.eval(arg5,ctx,bindings);
var G__92447 = sci.impl.types.eval(arg6,ctx,bindings);
var G__92448 = sci.impl.types.eval(arg7,ctx,bindings);
var G__92449 = sci.impl.types.eval(arg8,ctx,bindings);
var G__92450 = sci.impl.types.eval(arg9,ctx,bindings);
var G__92451 = sci.impl.types.eval(arg10,ctx,bindings);
var G__92452 = sci.impl.types.eval(arg11,ctx,bindings);
var G__92453 = sci.impl.types.eval(arg12,ctx,bindings);
var G__92454 = sci.impl.types.eval(arg13,ctx,bindings);
var G__92455 = sci.impl.types.eval(arg14,ctx,bindings);
var G__92456 = sci.impl.types.eval(arg15,ctx,bindings);
var G__92457 = sci.impl.types.eval(arg16,ctx,bindings);
return (f.cljs$core$IFn$_invoke$arity$17 ? f.cljs$core$IFn$_invoke$arity$17(G__92441,G__92442,G__92443,G__92444,G__92445,G__92446,G__92447,G__92448,G__92449,G__92450,G__92451,G__92452,G__92453,G__92454,G__92455,G__92456,G__92457) : f.call(null,G__92441,G__92442,G__92443,G__92444,G__92445,G__92446,G__92447,G__92448,G__92449,G__92450,G__92451,G__92452,G__92453,G__92454,G__92455,G__92456,G__92457));
}catch (e92440){if((e92440 instanceof Error)){
var e__90645__auto__ = e92440;
return sci.impl.utils.rethrow_with_location_of_node.cljs$core$IFn$_invoke$arity$4(ctx,bindings,e__90645__auto__,this$);
} else {
throw e92440;

}
}}),stack);
}

break;
case (18):
var arg0 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(0));
var arg1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(1));
var arg2 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(2));
var arg3 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(3));
var arg4 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(4));
var arg5 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(5));
var arg6 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(6));
var arg7 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(7));
var arg8 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(8));
var arg9 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(9));
var arg10 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(10));
var arg11 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(11));
var arg12 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(12));
var arg13 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(13));
var arg14 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(14));
var arg15 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(15));
var arg16 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(16));
var arg17 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(17));
if(cljs.core.truth_(wrap)){
return sci.impl.types.__GT_NodeR((function (this$,ctx,bindings){
try{var G__92460 = sci.impl.types.eval(arg0,ctx,bindings);
var G__92461 = sci.impl.types.eval(arg1,ctx,bindings);
var G__92462 = sci.impl.types.eval(arg2,ctx,bindings);
var G__92463 = sci.impl.types.eval(arg3,ctx,bindings);
var G__92464 = sci.impl.types.eval(arg4,ctx,bindings);
var G__92465 = sci.impl.types.eval(arg5,ctx,bindings);
var G__92466 = sci.impl.types.eval(arg6,ctx,bindings);
var G__92467 = sci.impl.types.eval(arg7,ctx,bindings);
var G__92468 = sci.impl.types.eval(arg8,ctx,bindings);
var G__92469 = sci.impl.types.eval(arg9,ctx,bindings);
var G__92470 = sci.impl.types.eval(arg10,ctx,bindings);
var G__92471 = sci.impl.types.eval(arg11,ctx,bindings);
var G__92472 = sci.impl.types.eval(arg12,ctx,bindings);
var G__92473 = sci.impl.types.eval(arg13,ctx,bindings);
var G__92474 = sci.impl.types.eval(arg14,ctx,bindings);
var G__92475 = sci.impl.types.eval(arg15,ctx,bindings);
var G__92476 = sci.impl.types.eval(arg16,ctx,bindings);
var G__92477 = sci.impl.types.eval(arg17,ctx,bindings);
var fexpr__92459 = (wrap.cljs$core$IFn$_invoke$arity$2 ? wrap.cljs$core$IFn$_invoke$arity$2(bindings,f) : wrap.call(null,bindings,f));
return (fexpr__92459.cljs$core$IFn$_invoke$arity$18 ? fexpr__92459.cljs$core$IFn$_invoke$arity$18(G__92460,G__92461,G__92462,G__92463,G__92464,G__92465,G__92466,G__92467,G__92468,G__92469,G__92470,G__92471,G__92472,G__92473,G__92474,G__92475,G__92476,G__92477) : fexpr__92459.call(null,G__92460,G__92461,G__92462,G__92463,G__92464,G__92465,G__92466,G__92467,G__92468,G__92469,G__92470,G__92471,G__92472,G__92473,G__92474,G__92475,G__92476,G__92477));
}catch (e92458){if((e92458 instanceof Error)){
var e__90645__auto__ = e92458;
return sci.impl.utils.rethrow_with_location_of_node.cljs$core$IFn$_invoke$arity$4(ctx,bindings,e__90645__auto__,this$);
} else {
throw e92458;

}
}}),stack);
} else {
return sci.impl.types.__GT_NodeR((function (this$,ctx,bindings){
try{var G__92480 = sci.impl.types.eval(arg0,ctx,bindings);
var G__92481 = sci.impl.types.eval(arg1,ctx,bindings);
var G__92483 = sci.impl.types.eval(arg2,ctx,bindings);
var G__92484 = sci.impl.types.eval(arg3,ctx,bindings);
var G__92486 = sci.impl.types.eval(arg4,ctx,bindings);
var G__92487 = sci.impl.types.eval(arg5,ctx,bindings);
var G__92488 = sci.impl.types.eval(arg6,ctx,bindings);
var G__92489 = sci.impl.types.eval(arg7,ctx,bindings);
var G__92490 = sci.impl.types.eval(arg8,ctx,bindings);
var G__92491 = sci.impl.types.eval(arg9,ctx,bindings);
var G__92492 = sci.impl.types.eval(arg10,ctx,bindings);
var G__92493 = sci.impl.types.eval(arg11,ctx,bindings);
var G__92494 = sci.impl.types.eval(arg12,ctx,bindings);
var G__92495 = sci.impl.types.eval(arg13,ctx,bindings);
var G__92496 = sci.impl.types.eval(arg14,ctx,bindings);
var G__92497 = sci.impl.types.eval(arg15,ctx,bindings);
var G__92498 = sci.impl.types.eval(arg16,ctx,bindings);
var G__92499 = sci.impl.types.eval(arg17,ctx,bindings);
return (f.cljs$core$IFn$_invoke$arity$18 ? f.cljs$core$IFn$_invoke$arity$18(G__92480,G__92481,G__92483,G__92484,G__92486,G__92487,G__92488,G__92489,G__92490,G__92491,G__92492,G__92493,G__92494,G__92495,G__92496,G__92497,G__92498,G__92499) : f.call(null,G__92480,G__92481,G__92483,G__92484,G__92486,G__92487,G__92488,G__92489,G__92490,G__92491,G__92492,G__92493,G__92494,G__92495,G__92496,G__92497,G__92498,G__92499));
}catch (e92478){if((e92478 instanceof Error)){
var e__90645__auto__ = e92478;
return sci.impl.utils.rethrow_with_location_of_node.cljs$core$IFn$_invoke$arity$4(ctx,bindings,e__90645__auto__,this$);
} else {
throw e92478;

}
}}),stack);
}

break;
case (19):
var arg0 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(0));
var arg1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(1));
var arg2 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(2));
var arg3 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(3));
var arg4 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(4));
var arg5 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(5));
var arg6 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(6));
var arg7 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(7));
var arg8 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(8));
var arg9 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(9));
var arg10 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(10));
var arg11 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(11));
var arg12 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(12));
var arg13 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(13));
var arg14 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(14));
var arg15 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(15));
var arg16 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(16));
var arg17 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(17));
var arg18 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(analyzed_children,(18));
if(cljs.core.truth_(wrap)){
return sci.impl.types.__GT_NodeR((function (this$,ctx,bindings){
try{var G__92504 = sci.impl.types.eval(arg0,ctx,bindings);
var G__92505 = sci.impl.types.eval(arg1,ctx,bindings);
var G__92506 = sci.impl.types.eval(arg2,ctx,bindings);
var G__92507 = sci.impl.types.eval(arg3,ctx,bindings);
var G__92508 = sci.impl.types.eval(arg4,ctx,bindings);
var G__92509 = sci.impl.types.eval(arg5,ctx,bindings);
var G__92510 = sci.impl.types.eval(arg6,ctx,bindings);
var G__92511 = sci.impl.types.eval(arg7,ctx,bindings);
var G__92512 = sci.impl.types.eval(arg8,ctx,bindings);
var G__92513 = sci.impl.types.eval(arg9,ctx,bindings);
var G__92514 = sci.impl.types.eval(arg10,ctx,bindings);
var G__92515 = sci.impl.types.eval(arg11,ctx,bindings);
var G__92516 = sci.impl.types.eval(arg12,ctx,bindings);
var G__92517 = sci.impl.types.eval(arg13,ctx,bindings);
var G__92518 = sci.impl.types.eval(arg14,ctx,bindings);
var G__92519 = sci.impl.types.eval(arg15,ctx,bindings);
var G__92520 = sci.impl.types.eval(arg16,ctx,bindings);
var G__92521 = sci.impl.types.eval(arg17,ctx,bindings);
var G__92522 = sci.impl.types.eval(arg18,ctx,bindings);
var fexpr__92503 = (wrap.cljs$core$IFn$_invoke$arity$2 ? wrap.cljs$core$IFn$_invoke$arity$2(bindings,f) : wrap.call(null,bindings,f));
return (fexpr__92503.cljs$core$IFn$_invoke$arity$19 ? fexpr__92503.cljs$core$IFn$_invoke$arity$19(G__92504,G__92505,G__92506,G__92507,G__92508,G__92509,G__92510,G__92511,G__92512,G__92513,G__92514,G__92515,G__92516,G__92517,G__92518,G__92519,G__92520,G__92521,G__92522) : fexpr__92503.call(null,G__92504,G__92505,G__92506,G__92507,G__92508,G__92509,G__92510,G__92511,G__92512,G__92513,G__92514,G__92515,G__92516,G__92517,G__92518,G__92519,G__92520,G__92521,G__92522));
}catch (e92502){if((e92502 instanceof Error)){
var e__90645__auto__ = e92502;
return sci.impl.utils.rethrow_with_location_of_node.cljs$core$IFn$_invoke$arity$4(ctx,bindings,e__90645__auto__,this$);
} else {
throw e92502;

}
}}),stack);
} else {
return sci.impl.types.__GT_NodeR((function (this$,ctx,bindings){
try{var G__92525 = sci.impl.types.eval(arg0,ctx,bindings);
var G__92526 = sci.impl.types.eval(arg1,ctx,bindings);
var G__92527 = sci.impl.types.eval(arg2,ctx,bindings);
var G__92528 = sci.impl.types.eval(arg3,ctx,bindings);
var G__92529 = sci.impl.types.eval(arg4,ctx,bindings);
var G__92530 = sci.impl.types.eval(arg5,ctx,bindings);
var G__92531 = sci.impl.types.eval(arg6,ctx,bindings);
var G__92532 = sci.impl.types.eval(arg7,ctx,bindings);
var G__92533 = sci.impl.types.eval(arg8,ctx,bindings);
var G__92534 = sci.impl.types.eval(arg9,ctx,bindings);
var G__92535 = sci.impl.types.eval(arg10,ctx,bindings);
var G__92536 = sci.impl.types.eval(arg11,ctx,bindings);
var G__92537 = sci.impl.types.eval(arg12,ctx,bindings);
var G__92538 = sci.impl.types.eval(arg13,ctx,bindings);
var G__92539 = sci.impl.types.eval(arg14,ctx,bindings);
var G__92540 = sci.impl.types.eval(arg15,ctx,bindings);
var G__92541 = sci.impl.types.eval(arg16,ctx,bindings);
var G__92542 = sci.impl.types.eval(arg17,ctx,bindings);
var G__92543 = sci.impl.types.eval(arg18,ctx,bindings);
return (f.cljs$core$IFn$_invoke$arity$19 ? f.cljs$core$IFn$_invoke$arity$19(G__92525,G__92526,G__92527,G__92528,G__92529,G__92530,G__92531,G__92532,G__92533,G__92534,G__92535,G__92536,G__92537,G__92538,G__92539,G__92540,G__92541,G__92542,G__92543) : f.call(null,G__92525,G__92526,G__92527,G__92528,G__92529,G__92530,G__92531,G__92532,G__92533,G__92534,G__92535,G__92536,G__92537,G__92538,G__92539,G__92540,G__92541,G__92542,G__92543));
}catch (e92524){if((e92524 instanceof Error)){
var e__90645__auto__ = e92524;
return sci.impl.utils.rethrow_with_location_of_node.cljs$core$IFn$_invoke$arity$4(ctx,bindings,e__90645__auto__,this$);
} else {
throw e92524;

}
}}),stack);
}

break;
default:
if(cljs.core.truth_(wrap)){
return sci.impl.types.__GT_NodeR((function (this$,ctx,bindings){
return sci.impl.evaluator.fn_call(ctx,bindings,(wrap.cljs$core$IFn$_invoke$arity$2 ? wrap.cljs$core$IFn$_invoke$arity$2(bindings,f) : wrap.call(null,bindings,f)),analyzed_children);
}),stack);
} else {
return sci.impl.types.__GT_NodeR((function (this$,ctx,bindings){
return sci.impl.evaluator.fn_call(ctx,bindings,f,analyzed_children);
}),stack);
}

}
});
sci.impl.analyzer.analyze_quote = (function sci$impl$analyzer$analyze_quote(_ctx,expr){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2((2),cljs.core.count(expr))){
} else {
sci.impl.analyzer.throw_error_with_location("Wrong number of args (0) passed to quote",expr);
}

var snd = cljs.core.second(expr);
return sci.impl.types.__GT_constant(snd);
});
sci.impl.analyzer.analyze_in_ns = (function sci$impl$analyzer$analyze_in_ns(ctx,expr){
var ns_expr = (function (){var G__92564 = ctx;
var G__92565 = cljs.core.second(expr);
return (sci.impl.analyzer.analyze.cljs$core$IFn$_invoke$arity$2 ? sci.impl.analyzer.analyze.cljs$core$IFn$_invoke$arity$2(G__92564,G__92565) : sci.impl.analyzer.analyze.call(null,G__92564,G__92565));
})();
return sci.impl.types.__GT_NodeR((function (this$,ctx__$1,bindings){
var ns_sym = sci.impl.types.eval(ns_expr,ctx__$1,bindings);
sci.impl.utils.set_namespace_BANG_(ctx__$1,ns_sym,null);

return null;
}),null);
});
sci.impl.analyzer.analyze_import = (function sci$impl$analyzer$analyze_import(_ctx,expr){
var args = cljs.core.rest(expr);
var stack = cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(cljs.core.meta(expr),new cljs.core.Keyword(null,"ns","ns",441598760),cljs.core.deref(sci.impl.vars.current_ns),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"file","file",-1269645878),cljs.core.deref(sci.impl.vars.current_file)], 0));
return sci.impl.types.__GT_NodeR((function (this$,ctx,bindings){
try{return cljs.core.apply.cljs$core$IFn$_invoke$arity$3(sci.impl.evaluator.eval_import,ctx,args);
}catch (e92572){if((e92572 instanceof Error)){
var e = e92572;
return sci.impl.utils.rethrow_with_location_of_node.cljs$core$IFn$_invoke$arity$4(ctx,bindings,e,this$);
} else {
throw e92572;

}
}}),stack);
});
sci.impl.analyzer.analyze_call = (function sci$impl$analyzer$analyze_call(ctx,expr,m,top_level_QMARK_){
var eval_file = new cljs.core.Keyword("clojure.core","eval-file","clojure.core/eval-file",801420726).cljs$core$IFn$_invoke$arity$1(m);
if(cljs.core.truth_(eval_file)){
sci.impl.vars.push_thread_bindings(cljs.core.PersistentArrayMap.createAsIfByAssoc([sci.impl.vars.current_file,eval_file]));
} else {
}

try{var f = cljs.core.first(expr);
if((f instanceof cljs.core.Symbol)){
var fsym = f;
var special_sym = cljs.core.get.cljs$core$IFn$_invoke$arity$2(sci.impl.analyzer.special_syms,f);
var _ = (cljs.core.truth_((function (){var and__5000__auto__ = special_sym;
if(cljs.core.truth_(and__5000__auto__)){
return new cljs.core.Keyword(null,"check-permissions","check-permissions",669054317).cljs$core$IFn$_invoke$arity$1(ctx);
} else {
return and__5000__auto__;
}
})())?sci.impl.resolve.check_permission_BANG_(ctx,f,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [special_sym,null], null)):null);
var f__$1 = (function (){var or__5002__auto__ = special_sym;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return sci.impl.resolve.resolve_symbol.cljs$core$IFn$_invoke$arity$3(ctx,f,true);
}
})();
var f_meta = cljs.core.meta(f__$1);
var eval_QMARK_ = (function (){var and__5000__auto__ = f_meta;
if(cljs.core.truth_(and__5000__auto__)){
return new cljs.core.Keyword("sci.impl","op","sci.impl/op",950953978).cljs$core$IFn$_invoke$arity$1(f_meta);
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_((function (){var and__5000__auto__ = f_meta;
if(cljs.core.truth_(and__5000__auto__)){
return new cljs.core.Keyword("sci.impl.analyzer","static-access","sci.impl.analyzer/static-access",-79014000).cljs$core$IFn$_invoke$arity$1(f_meta);
} else {
return and__5000__auto__;
}
})())){
var vec__92592 = f__$1;
var class$ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__92592,(0),null);
var method_name = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__92592,(1),null);
var method_name__$1 = cljs.core.str.cljs$core$IFn$_invoke$arity$1(method_name);
var len = method_name__$1.length;
var idx = clojure.string.last_index_of.cljs$core$IFn$_invoke$arity$2(method_name__$1,".");
var f__$2 = (cljs.core.truth_((function (){var and__5000__auto__ = idx;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2((len - (1)),idx);
} else {
return and__5000__auto__;
}
})())?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [sci.impl.analyzer.goog$module$goog$object.getValueByKeys(class$,cljs.core.into_array.cljs$core$IFn$_invoke$arity$1(cljs.core.subs.cljs$core$IFn$_invoke$arity$3(method_name__$1,(0),idx).split("."))),cljs.core.subs.cljs$core$IFn$_invoke$arity$2(method_name__$1,(idx + (1)))], null):f__$1);
var children = sci.impl.analyzer.analyze_children(ctx,cljs.core.rest(expr));
return sci.impl.types.__GT_NodeR((function (this$,ctx__$1,bindings){
return sci.impl.evaluator.eval_static_method_invocation(ctx__$1,bindings,cljs.core.cons(f__$2,children));
}),null);
} else {
if(cljs.core.truth_((function (){var and__5000__auto__ = cljs.core.not(eval_QMARK_);
if(and__5000__auto__){
var and__5000__auto____$1 = (f__$1 instanceof cljs.core.Symbol);
if(and__5000__auto____$1){
var or__5002__auto__ = special_sym;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.contains_QMARK_(sci.impl.utils.ana_macros,f__$1);
}
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})())){
var G__92602 = f__$1;
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Symbol(null,".",".",1975675962,null),G__92602)){
return sci.impl.analyzer.expand_dot_STAR__STAR_(ctx,expr);
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Symbol(null,"and","and",668631710,null),G__92602)){
return sci.impl.analyzer.return_and(ctx,expr,cljs.core.rest(expr));
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Symbol(null,"import","import",241030818,null),G__92602)){
return sci.impl.analyzer.analyze_import(ctx,expr);
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Symbol(null,"case","case",-1510733573,null),G__92602)){
return sci.impl.analyzer.analyze_case(ctx,expr);
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Symbol(null,"fn*","fn*",-752876845,null),G__92602)){
return sci.impl.analyzer.analyze_fn(ctx,expr,false);
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Symbol(null,"if","if",1181717262,null),G__92602)){
return sci.impl.analyzer.return_if(ctx,expr);
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Symbol(null,"defmacro","defmacro",2054157304,null),G__92602)){
var ret = sci.impl.analyzer.analyze_defn(ctx,expr);
return ret;
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Symbol(null,"defn","defn",-126010802,null),G__92602)){
var ret = sci.impl.analyzer.analyze_defn(ctx,expr);
return ret;
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Symbol(null,"do","do",1686842252,null),G__92602)){
return sci.impl.analyzer.return_do(ctx,expr,cljs.core.rest(expr));
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Symbol(null,"loop","loop",1244978678,null),G__92602)){
return sci.impl.analyzer.analyze_loop(ctx,expr);
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Symbol(null,"expand-constructor","expand-constructor",-343741576,null),G__92602)){
return sci.impl.analyzer.expand_constructor(ctx,expr);
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Symbol(null,"def","def",597100991,null),G__92602)){
return sci.impl.analyzer.analyze_def(ctx,expr);
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Symbol(null,"quote","quote",1377916282,null),G__92602)){
return sci.impl.analyzer.analyze_quote(ctx,expr);
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Symbol(null,"expand-dot*","expand-dot*",-1946890561,null),G__92602)){
return sci.impl.analyzer.expand_dot_STAR_(ctx,expr);
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Symbol(null,"ns","ns",2082130287,null),G__92602)){
return sci.impl.analyzer.analyze_ns_form(ctx,expr);
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Symbol(null,"let","let",358118826,null),G__92602)){
return sci.impl.analyzer.analyze_let(ctx,expr);
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Symbol(null,"fn","fn",465265323,null),G__92602)){
return sci.impl.analyzer.analyze_fn(ctx,expr,false);
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Symbol(null,"in-ns","in-ns",-2089468466,null),G__92602)){
return sci.impl.analyzer.analyze_in_ns(ctx,expr);
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Symbol(null,"set!","set!",250714521,null),G__92602)){
return sci.impl.analyzer.analyze_set_BANG_(ctx,expr);
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Symbol(null,"recur","recur",1202958259,null),G__92602)){
return sci.impl.analyzer.return_recur(ctx,expr,sci.impl.analyzer.analyze_children(sci.impl.analyzer.without_recur_target(ctx),cljs.core.rest(expr)));
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Symbol(null,"new","new",-444906321,null),G__92602)){
return sci.impl.analyzer.analyze_new(ctx,expr);
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Symbol(null,"var","var",870848730,null),G__92602)){
return sci.impl.analyzer.analyze_var(ctx,expr);
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Symbol(null,"lazy-seq","lazy-seq",489632906,null),G__92602)){
return sci.impl.analyzer.analyze_lazy_seq(ctx,expr);
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Symbol(null,"throw","throw",595905694,null),G__92602)){
return sci.impl.analyzer.analyze_throw(ctx,expr);
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Symbol(null,"try","try",-1273693247,null),G__92602)){
return sci.impl.analyzer.analyze_try(ctx,expr);
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Symbol(null,"or","or",1876275696,null),G__92602)){
return sci.impl.analyzer.return_or(ctx,expr,cljs.core.rest(expr));
} else {
throw (new Error(["No matching clause: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(G__92602)].join('')));

}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
} else {
try{if(cljs.core.truth_(sci.impl.utils.macro_QMARK_(f__$1))){
var needs_ctx_QMARK_ = (sci.impl.utils.needs_ctx === new cljs.core.Keyword("sci.impl","op","sci.impl/op",950953978).cljs$core$IFn$_invoke$arity$1(cljs.core.meta(f__$1)));
var f__$2 = ((sci.impl.vars.var_QMARK_(f__$1))?cljs.core.deref(f__$1):f__$1);
var v = ((needs_ctx_QMARK_)?cljs.core.apply.cljs$core$IFn$_invoke$arity$5(f__$2,expr,new cljs.core.Keyword(null,"bindings","bindings",1271397192).cljs$core$IFn$_invoke$arity$1(ctx),ctx,cljs.core.rest(expr)):cljs.core.apply.cljs$core$IFn$_invoke$arity$4(f__$2,expr,new cljs.core.Keyword(null,"bindings","bindings",1271397192).cljs$core$IFn$_invoke$arity$1(ctx),cljs.core.rest(expr)));
var expanded = (cljs.core.truth_(new cljs.core.Keyword("sci.impl","macroexpanding","sci.impl/macroexpanding",2113471825).cljs$core$IFn$_invoke$arity$1(ctx))?v:(cljs.core.truth_((function (){var and__5000__auto__ = top_level_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return ((cljs.core.seq_QMARK_(v)) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Symbol(null,"do","do",1686842252,null),cljs.core.first(v))));
} else {
return and__5000__auto__;
}
})())?sci.impl.types.__GT_EvalForm(v):(function (){var v__$1 = (cljs.core.truth_(m)?(((((!((v == null))))?(((((v.cljs$lang$protocol_mask$partition0$ & (262144))) || ((cljs.core.PROTOCOL_SENTINEL === v.cljs$core$IWithMeta$))))?true:false):false))?cljs.core.with_meta(v,cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([m,cljs.core.meta(v)], 0))):v):v);
return (sci.impl.analyzer.analyze.cljs$core$IFn$_invoke$arity$3 ? sci.impl.analyzer.analyze.cljs$core$IFn$_invoke$arity$3(ctx,v__$1,top_level_QMARK_) : sci.impl.analyzer.analyze.call(null,ctx,v__$1,top_level_QMARK_));
})()
));
return expanded;
} else {
var temp__5802__auto__ = new cljs.core.Keyword("sci.impl","inlined","sci.impl/inlined",-478453593).cljs$core$IFn$_invoke$arity$1(f_meta);
if(cljs.core.truth_(temp__5802__auto__)){
var f__$2 = temp__5802__auto__;
return sci.impl.analyzer.return_call(ctx,expr,f__$2,sci.impl.analyzer.analyze_children(ctx,cljs.core.rest(expr)),cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(m,new cljs.core.Keyword(null,"ns","ns",441598760),cljs.core.deref(sci.impl.vars.current_ns),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"file","file",-1269645878),cljs.core.deref(sci.impl.vars.current_file),new cljs.core.Keyword("sci.impl","f-meta","sci.impl/f-meta",-1735495322),f_meta], 0)),null);
} else {
var temp__5802__auto____$1 = new cljs.core.Keyword("sci.impl","op","sci.impl/op",950953978).cljs$core$IFn$_invoke$arity$1(cljs.core.meta(f__$1));
if(cljs.core.truth_(temp__5802__auto____$1)){
var op = temp__5802__auto____$1;
var G__92608 = op;
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Symbol(null,"needs-ctx","needs-ctx",1605017124,null),G__92608)){
if((sci.impl.utils.needs_ctx === op)){
return sci.impl.analyzer.return_needs_ctx_call(ctx,expr,f__$1,sci.impl.analyzer.analyze_children(ctx,cljs.core.rest(expr)));
} else {
var children = sci.impl.analyzer.analyze_children(ctx,cljs.core.rest(expr));
return sci.impl.analyzer.return_call(ctx,expr,f__$1,children,cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(m,new cljs.core.Keyword(null,"ns","ns",441598760),cljs.core.deref(sci.impl.vars.current_ns),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"file","file",-1269645878),cljs.core.deref(sci.impl.vars.current_file),new cljs.core.Keyword("sci.impl","f-meta","sci.impl/f-meta",-1735495322),f_meta], 0)),null);
}
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"resolve-sym","resolve-sym",-1193683260),G__92608)){
return sci.impl.analyzer.return_binding_call(ctx,expr,new cljs.core.Keyword("sci.impl","idx","sci.impl/idx",700902278).cljs$core$IFn$_invoke$arity$1(cljs.core.meta(f__$1)),f__$1,sci.impl.analyzer.analyze_children(ctx,cljs.core.rest(expr)),cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(m,new cljs.core.Keyword(null,"ns","ns",441598760),cljs.core.deref(sci.impl.vars.current_ns),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"file","file",-1269645878),cljs.core.deref(sci.impl.vars.current_file),new cljs.core.Keyword("sci.impl","f-meta","sci.impl/f-meta",-1735495322),f_meta], 0)));
} else {
var children = sci.impl.analyzer.analyze_children(ctx,cljs.core.rest(expr));
return sci.impl.analyzer.return_call(ctx,expr,f__$1,children,cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(m,new cljs.core.Keyword(null,"ns","ns",441598760),cljs.core.deref(sci.impl.vars.current_ns),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"file","file",-1269645878),cljs.core.deref(sci.impl.vars.current_file),new cljs.core.Keyword("sci.impl","f-meta","sci.impl/f-meta",-1735495322),f_meta], 0)),null);

}
}
} else {
var self_ref_QMARK_ = new cljs.core.Keyword(null,"self-ref?","self-ref?",412808630).cljs$core$IFn$_invoke$arity$1(ctx);
if(cljs.core.truth_((function (){var and__5000__auto__ = self_ref_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return (self_ref_QMARK_.cljs$core$IFn$_invoke$arity$1 ? self_ref_QMARK_.cljs$core$IFn$_invoke$arity$1(f__$1) : self_ref_QMARK_.call(null,f__$1));
} else {
return and__5000__auto__;
}
})())){
var children = sci.impl.analyzer.analyze_children(ctx,cljs.core.rest(expr));
return sci.impl.analyzer.return_call(ctx,expr,f__$1,children,cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(m,new cljs.core.Keyword(null,"ns","ns",441598760),cljs.core.deref(sci.impl.vars.current_ns),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"file","file",-1269645878),cljs.core.deref(sci.impl.vars.current_file),new cljs.core.Keyword("sci.impl","f-meta","sci.impl/f-meta",-1735495322),f_meta], 0)),(function (bindings,___$1){
return cljs.core.deref(bindings.get(fsym));
}));
} else {
var children = sci.impl.analyzer.analyze_children(ctx,cljs.core.rest(expr));
return sci.impl.analyzer.return_call(ctx,expr,f__$1,children,cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(m,new cljs.core.Keyword(null,"ns","ns",441598760),cljs.core.deref(sci.impl.vars.current_ns),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"file","file",-1269645878),cljs.core.deref(sci.impl.vars.current_file),new cljs.core.Keyword("sci.impl","f-meta","sci.impl/f-meta",-1735495322),f_meta], 0)),((sci.impl.vars.var_QMARK_(f__$1))?(function (___$1,v){
return cljs.core.deref(v);
}):null));
}
}
}
}
}catch (e92606){if((e92606 instanceof Error)){
var e = e92606;
return sci.impl.utils.rethrow_with_location_of_node.cljs$core$IFn$_invoke$arity$3(ctx,e,(function (){var stack = cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(m,new cljs.core.Keyword(null,"ns","ns",441598760),cljs.core.deref(sci.impl.vars.current_ns),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"file","file",-1269645878),cljs.core.deref(sci.impl.vars.current_file),new cljs.core.Keyword("sci.impl","f-meta","sci.impl/f-meta",-1735495322),f_meta], 0));
return sci.impl.types.__GT_NodeR((function (this$,ctx__$1,bindings){
return null;
}),stack);
})());
} else {
throw e92606;

}
}
}
}
} else {
if((f instanceof cljs.core.Keyword)){
var children = sci.impl.analyzer.analyze_children(ctx,cljs.core.rest(expr));
var ccount = cljs.core.count(children);
var G__92617 = ccount;
switch (G__92617) {
case (1):
var arg = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(children,(0));
return sci.impl.types.__GT_NodeR((function (this$,ctx__$1,bindings){
return f.cljs$core$IFn$_invoke$arity$1(sci.impl.types.eval(arg,ctx__$1,bindings));
}),null);

break;
case (2):
var arg0 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(children,(0));
var arg1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(children,(1));
return sci.impl.types.__GT_NodeR((function (this$,ctx__$1,bindings){
return f.cljs$core$IFn$_invoke$arity$2(sci.impl.types.eval(arg0,ctx__$1,bindings),sci.impl.types.eval(arg1,ctx__$1,bindings));
}),null);

break;
default:
return sci.impl.analyzer.throw_error_with_location(["Wrong number of args (",cljs.core.str.cljs$core$IFn$_invoke$arity$1(ccount),") passed to: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(f)].join(''),expr);

}
} else {
var f__$1 = (sci.impl.analyzer.analyze.cljs$core$IFn$_invoke$arity$2 ? sci.impl.analyzer.analyze.cljs$core$IFn$_invoke$arity$2(ctx,f) : sci.impl.analyzer.analyze.call(null,ctx,f));
var children = sci.impl.analyzer.analyze_children(ctx,cljs.core.rest(expr));
var stack = cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(m,new cljs.core.Keyword(null,"ns","ns",441598760),cljs.core.deref(sci.impl.vars.current_ns),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"file","file",-1269645878),cljs.core.deref(sci.impl.vars.current_file)], 0));
return sci.impl.types.__GT_NodeR((function (this$,ctx__$1,bindings){
var f__$2 = sci.impl.types.eval(f__$1,ctx__$1,bindings);
if(cljs.core.ifn_QMARK_(f__$2)){
return sci.impl.evaluator.fn_call(ctx__$1,bindings,f__$2,children);
} else {
throw (new Error(["Cannot call ",cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([f__$2], 0))," as a function."].join('')));
}
}),stack);

}
}
}finally {if(cljs.core.truth_(eval_file)){
sci.impl.vars.pop_thread_bindings();
} else {
}
}});
sci.impl.analyzer.map_fn = (function sci$impl$analyzer$map_fn(children_count){
if((children_count <= (16))){
return cljs.core.array_map;
} else {
return cljs.core.hash_map;
}
});
sci.impl.analyzer.return_map = (function sci$impl$analyzer$return_map(ctx,the_map,analyzed_children){
var mf = sci.impl.analyzer.map_fn(cljs.core.count(analyzed_children));
sci.impl.analyzer.return_call(ctx,the_map,mf,analyzed_children,null,null);

return sci.impl.analyzer.return_call(ctx,the_map,mf,analyzed_children,null,null);
});
sci.impl.analyzer.constant_node_QMARK_ = (function sci$impl$analyzer$constant_node_QMARK_(x){
return (!((x instanceof sci.impl.types.NodeR)));
});
sci.impl.analyzer.analyze_map = (function sci$impl$analyzer$analyze_map(ctx,expr,m){
var ctx__$1 = sci.impl.analyzer.without_recur_target(ctx);
var children = cljs.core.into.cljs$core$IFn$_invoke$arity$3(cljs.core.PersistentVector.EMPTY,cljs.core.cat,expr);
var analyzed_children = sci.impl.analyzer.analyze_children(ctx__$1,children);
var const_QMARK_ = cljs.core.every_QMARK_(sci.impl.analyzer.constant_node_QMARK_,analyzed_children);
var same_QMARK_ = ((const_QMARK_)?cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(children,analyzed_children):null);
var const_val = ((const_QMARK_)?(cljs.core.truth_(same_QMARK_)?expr:(function (){var mf = sci.impl.analyzer.map_fn(cljs.core.count(analyzed_children));
return cljs.core.apply.cljs$core$IFn$_invoke$arity$2(mf,analyzed_children);
})()):null);
var analyzed_map = ((const_QMARK_)?sci.impl.types.__GT_constant(const_val):sci.impl.analyzer.return_map(ctx__$1,expr,analyzed_children));
var analyzed_meta = (cljs.core.truth_(m)?(sci.impl.analyzer.analyze.cljs$core$IFn$_invoke$arity$2 ? sci.impl.analyzer.analyze.cljs$core$IFn$_invoke$arity$2(ctx__$1,m) : sci.impl.analyzer.analyze.call(null,ctx__$1,m)):null);
var ret = (cljs.core.truth_(analyzed_meta)?sci.impl.types.__GT_NodeR((function (this$,ctx__$2,bindings){
var coll = sci.impl.types.eval(analyzed_map,ctx__$2,bindings);
var md = sci.impl.types.eval(analyzed_meta,ctx__$2,bindings);
return cljs.core.with_meta(coll,md);
}),null):analyzed_map);
return ret;
});
/**
 * Returns analyzed vector or set
 */
sci.impl.analyzer.analyze_vec_or_set = (function sci$impl$analyzer$analyze_vec_or_set(ctx,f1,f2,expr,m){
var ctx__$1 = sci.impl.analyzer.without_recur_target(ctx);
var analyzed_meta = (cljs.core.truth_(m)?(sci.impl.analyzer.analyze.cljs$core$IFn$_invoke$arity$2 ? sci.impl.analyzer.analyze.cljs$core$IFn$_invoke$arity$2(ctx__$1,m) : sci.impl.analyzer.analyze.call(null,ctx__$1,m)):null);
var analyzed_children = sci.impl.analyzer.analyze_children(ctx__$1,expr);
var const_QMARK_ = cljs.core.every_QMARK_(sci.impl.analyzer.constant_node_QMARK_,analyzed_children);
var same_QMARK_ = ((const_QMARK_) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2((cljs.core.truth_(cljs.core.set(expr))?cljs.core.seq(expr):expr),analyzed_children)));
var const_val = ((const_QMARK_)?((same_QMARK_)?expr:(f1.cljs$core$IFn$_invoke$arity$1 ? f1.cljs$core$IFn$_invoke$arity$1(analyzed_children) : f1.call(null,analyzed_children))):null);
var analyzed_coll = ((const_QMARK_)?sci.impl.types.__GT_constant(const_val):sci.impl.analyzer.return_call(ctx__$1,expr,f2,analyzed_children,null,null));
var ret = (cljs.core.truth_(analyzed_meta)?sci.impl.types.__GT_NodeR((function (this$,ctx__$2,bindings){
var coll = sci.impl.types.eval(analyzed_coll,ctx__$2,bindings);
var md = sci.impl.types.eval(analyzed_meta,ctx__$2,bindings);
return cljs.core.with_meta(coll,md);
}),null):analyzed_coll);
return ret;
});
sci.impl.analyzer.analyze_js_obj = (function sci$impl$analyzer$analyze_js_obj(ctx,js_val){
var v = js_val.val;
if(cljs.core.map_QMARK_(v)){
var ks = cljs.core.keys(v);
var ks__$1 = cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.name,ks);
var vs = cljs.core.vals(v);
var vs__$1 = sci.impl.analyzer.analyze_children(ctx,vs);
return sci.impl.types.__GT_NodeR((function (this$,ctx__$1,bindings){
return cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core.js_obj,cljs.core.interleave.cljs$core$IFn$_invoke$arity$2(ks__$1,cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__92623_SHARP_){
return sci.impl.types.eval(p1__92623_SHARP_,ctx__$1,bindings);
}),vs__$1)));
}),null);
} else {
var vs = sci.impl.analyzer.analyze_children(ctx,v);
return sci.impl.types.__GT_NodeR((function (this$,ctx__$1,bindings){
var arr = [];
var seq__92624_92999 = cljs.core.seq(vs);
var chunk__92625_93000 = null;
var count__92626_93001 = (0);
var i__92627_93002 = (0);
while(true){
if((i__92627_93002 < count__92626_93001)){
var x_93003 = chunk__92625_93000.cljs$core$IIndexed$_nth$arity$2(null,i__92627_93002);
arr.push(sci.impl.types.eval(x_93003,ctx__$1,bindings));


var G__93004 = seq__92624_92999;
var G__93005 = chunk__92625_93000;
var G__93006 = count__92626_93001;
var G__93007 = (i__92627_93002 + (1));
seq__92624_92999 = G__93004;
chunk__92625_93000 = G__93005;
count__92626_93001 = G__93006;
i__92627_93002 = G__93007;
continue;
} else {
var temp__5804__auto___93008 = cljs.core.seq(seq__92624_92999);
if(temp__5804__auto___93008){
var seq__92624_93009__$1 = temp__5804__auto___93008;
if(cljs.core.chunked_seq_QMARK_(seq__92624_93009__$1)){
var c__5525__auto___93010 = cljs.core.chunk_first(seq__92624_93009__$1);
var G__93011 = cljs.core.chunk_rest(seq__92624_93009__$1);
var G__93012 = c__5525__auto___93010;
var G__93013 = cljs.core.count(c__5525__auto___93010);
var G__93014 = (0);
seq__92624_92999 = G__93011;
chunk__92625_93000 = G__93012;
count__92626_93001 = G__93013;
i__92627_93002 = G__93014;
continue;
} else {
var x_93015 = cljs.core.first(seq__92624_93009__$1);
arr.push(sci.impl.types.eval(x_93015,ctx__$1,bindings));


var G__93017 = cljs.core.next(seq__92624_93009__$1);
var G__93018 = null;
var G__93019 = (0);
var G__93020 = (0);
seq__92624_92999 = G__93017;
chunk__92625_93000 = G__93018;
count__92626_93001 = G__93019;
i__92627_93002 = G__93020;
continue;
}
} else {
}
}
break;
}

return arr;
}),null);
}
});
sci.impl.analyzer.analyze = (function sci$impl$analyzer$analyze(var_args){
var G__92629 = arguments.length;
switch (G__92629) {
case 2:
return sci.impl.analyzer.analyze.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return sci.impl.analyzer.analyze.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(sci.impl.analyzer.analyze.cljs$core$IFn$_invoke$arity$2 = (function (ctx,expr){
return sci.impl.analyzer.analyze.cljs$core$IFn$_invoke$arity$3(ctx,expr,false);
}));

(sci.impl.analyzer.analyze.cljs$core$IFn$_invoke$arity$3 = (function (ctx,expr,top_level_QMARK_){
var m = cljs.core.meta(expr);
if(sci.impl.utils.constant_QMARK_(expr)){
return sci.impl.types.__GT_constant(expr);
} else {
if((expr instanceof cljs.core.Symbol)){
var v = sci.impl.resolve.resolve_symbol.cljs$core$IFn$_invoke$arity$4(ctx,expr,false,new cljs.core.Keyword(null,"tag","tag",-1290361223).cljs$core$IFn$_invoke$arity$1(m));
var mv = cljs.core.meta(v);
if(sci.impl.utils.constant_QMARK_(v)){
return sci.impl.types.__GT_constant(v);
} else {
if((sci.impl.utils.needs_ctx === new cljs.core.Keyword("sci.impl","op","sci.impl/op",950953978).cljs$core$IFn$_invoke$arity$1(mv))){
return cljs.core.partial.cljs$core$IFn$_invoke$arity$2(v,ctx);
} else {
if(sci.impl.vars.var_QMARK_(v)){
if(cljs.core.truth_(new cljs.core.Keyword(null,"const","const",1709929842).cljs$core$IFn$_invoke$arity$1(mv))){
return cljs.core.deref(v);
} else {
if(cljs.core.truth_(sci.impl.vars.isMacro(v))){
throw (new Error(["Can't take value of a macro: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(v),""].join('')));
} else {
return sci.impl.types.__GT_NodeR((function (this$,ctx__$1,bindings){
return cljs.core._deref(v);
}),null);
}
}
} else {
return v;

}
}
}
} else {
if(cljs.core.record_QMARK_(expr)){
return expr;
} else {
if(cljs.core.map_QMARK_(expr)){
return sci.impl.analyzer.analyze_map(ctx,expr,m);
} else {
if((expr instanceof cljs.tagged_literals.JSValue)){
return sci.impl.analyzer.analyze_js_obj(ctx,expr);
} else {
if(cljs.core.vector_QMARK_(expr)){
return sci.impl.analyzer.analyze_vec_or_set(ctx,cljs.core.identity,cljs.core.vector,expr,m);
} else {
if(cljs.core.set_QMARK_(expr)){
return sci.impl.analyzer.analyze_vec_or_set(ctx,cljs.core.set,cljs.core.hash_set,expr,m);
} else {
if(cljs.core.seq_QMARK_(expr)){
if(cljs.core.seq(expr)){
return sci.impl.analyzer.analyze_call(ctx,expr,m,top_level_QMARK_);
} else {
return expr;
}
} else {
return expr;

}
}
}
}
}
}
}
}
}));

(sci.impl.analyzer.analyze.cljs$lang$maxFixedArity = 3);


//# sourceMappingURL=sci.impl.analyzer.js.map
