goog.provide('sci.impl.utils');
cljs.core.derive.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("sci.error","realized-beyond-max","sci.error/realized-beyond-max",-1094268187),new cljs.core.Keyword("sci","error","sci/error",-979082803));
cljs.core.derive.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("sci.error","parse","sci.error/parse",-264338844),new cljs.core.Keyword("sci","error","sci/error",-979082803));
sci.impl.utils.constant_QMARK_ = (function sci$impl$utils$constant_QMARK_(x){
return (((x == null)) || (((typeof x === 'number') || (((typeof x === 'string') || ((((x instanceof cljs.core.Keyword)) || (((cljs.core.boolean_QMARK_(x)) || ((x instanceof RegExp)))))))))));
});
sci.impl.utils.throw_error_with_location = (function sci$impl$utils$throw_error_with_location(var_args){
var G__85509 = arguments.length;
switch (G__85509) {
case 2:
return sci.impl.utils.throw_error_with_location.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return sci.impl.utils.throw_error_with_location.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(sci.impl.utils.throw_error_with_location.cljs$core$IFn$_invoke$arity$2 = (function (msg,iobj){
return sci.impl.utils.throw_error_with_location.cljs$core$IFn$_invoke$arity$3(msg,iobj,cljs.core.PersistentArrayMap.EMPTY);
}));

(sci.impl.utils.throw_error_with_location.cljs$core$IFn$_invoke$arity$3 = (function (msg,iobj,data){
var map__85512 = cljs.core.meta(iobj);
var map__85512__$1 = cljs.core.__destructure_map(map__85512);
var line = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__85512__$1,new cljs.core.Keyword(null,"line","line",212345235));
var column = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__85512__$1,new cljs.core.Keyword(null,"column","column",2078222095));
var file = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__85512__$1,new cljs.core.Keyword(null,"file","file",-1269645878),cljs.core.deref(sci.impl.vars.current_file));
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2(msg,cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"type","type",1174270348),new cljs.core.Keyword("sci","error","sci/error",-979082803),new cljs.core.Keyword(null,"line","line",212345235),line,new cljs.core.Keyword(null,"column","column",2078222095),column,new cljs.core.Keyword(null,"file","file",-1269645878),file], null),data], 0)));
}));

(sci.impl.utils.throw_error_with_location.cljs$lang$maxFixedArity = 3);

sci.impl.utils._STAR_in_try_STAR_ = false;
sci.impl.utils.macro_QMARK_ = (function sci$impl$utils$macro_QMARK_(f){
var temp__5808__auto__ = cljs.core.meta(f);
if((temp__5808__auto__ == null)){
return null;
} else {
var m = temp__5808__auto__;
var or__5002__auto__ = new cljs.core.Keyword("sci","macro","sci/macro",-868536151).cljs$core$IFn$_invoke$arity$1(m);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword(null,"macro","macro",-867863404).cljs$core$IFn$_invoke$arity$1(m);
}
}
});
sci.impl.utils.needs_ctx = cljs.core.symbol.cljs$core$IFn$_invoke$arity$1("needs-ctx");
/**
 * used for allowing interop in with-out-str
 */
sci.impl.utils.allowed_append = cljs.core.symbol.cljs$core$IFn$_invoke$arity$1("append");
sci.impl.utils.rethrow_with_location_of_node = (function sci$impl$utils$rethrow_with_location_of_node(var_args){
var G__85524 = arguments.length;
switch (G__85524) {
case 3:
return sci.impl.utils.rethrow_with_location_of_node.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
case 4:
return sci.impl.utils.rethrow_with_location_of_node.cljs$core$IFn$_invoke$arity$4((arguments[(0)]),(arguments[(1)]),(arguments[(2)]),(arguments[(3)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(sci.impl.utils.rethrow_with_location_of_node.cljs$core$IFn$_invoke$arity$3 = (function (ctx,e,raw_node){
return sci.impl.utils.rethrow_with_location_of_node.cljs$core$IFn$_invoke$arity$4(ctx,new cljs.core.Keyword(null,"bindings","bindings",1271397192).cljs$core$IFn$_invoke$arity$1(ctx),e,raw_node);
}));

(sci.impl.utils.rethrow_with_location_of_node.cljs$core$IFn$_invoke$arity$4 = (function (ctx,_bindings,e,raw_node){
if(cljs.core.truth_(sci.impl.utils._STAR_in_try_STAR_)){
throw e;
} else {
var stack = sci.impl.types.stack(raw_node);
var env = new cljs.core.Keyword(null,"env","env",-1815813235).cljs$core$IFn$_invoke$arity$1(ctx);
var id = new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(ctx);
var d = cljs.core.ex_data(e);
var st = (function (){var or__5002__auto__ = (function (){var temp__5804__auto__ = new cljs.core.Keyword("sci.impl","callstack","sci.impl/callstack",-1621010557).cljs$core$IFn$_invoke$arity$1(d);
if(cljs.core.truth_(temp__5804__auto__)){
var st = temp__5804__auto__;
return st;
} else {
return null;
}
})();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.volatile_BANG_(cljs.core.List.EMPTY);
}
})();
if(cljs.core.truth_(stack)){
if(cljs.core.truth_(new cljs.core.Keyword(null,"special","special",-1125941630).cljs$core$IFn$_invoke$arity$1(stack))){
} else {
cljs.core._vreset_BANG_(st,cljs.core.conj.cljs$core$IFn$_invoke$arity$2(cljs.core._deref(st),stack));
}
} else {
}

var d__$1 = cljs.core.ex_data(e);
var wrapping_sci_error_QMARK_ = cljs.core.isa_QMARK_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"type","type",1174270348).cljs$core$IFn$_invoke$arity$1(d__$1),new cljs.core.Keyword("sci","error","sci/error",-979082803));
if(wrapping_sci_error_QMARK_){
throw e;
} else {
var ex_msg = e.message;
var map__85530 = (function (){var or__5002__auto__ = stack;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var G__85531 = env;
var G__85531__$1 = (((G__85531 == null))?null:cljs.core.deref(G__85531));
var G__85531__$2 = (((G__85531__$1 == null))?null:new cljs.core.Keyword("sci.impl","callstack","sci.impl/callstack",-1621010557).cljs$core$IFn$_invoke$arity$1(G__85531__$1));
var G__85531__$3 = (((G__85531__$2 == null))?null:cljs.core.get.cljs$core$IFn$_invoke$arity$2(G__85531__$2,id));
var G__85531__$4 = (((G__85531__$3 == null))?null:cljs.core.deref(G__85531__$3));
var G__85531__$5 = (((G__85531__$4 == null))?null:cljs.core.last(G__85531__$4));
if((G__85531__$5 == null)){
return null;
} else {
return cljs.core.meta(G__85531__$5);
}
}
})();
var map__85530__$1 = cljs.core.__destructure_map(map__85530);
var line = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__85530__$1,new cljs.core.Keyword(null,"line","line",212345235));
var column = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__85530__$1,new cljs.core.Keyword(null,"column","column",2078222095));
var file = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__85530__$1,new cljs.core.Keyword(null,"file","file",-1269645878));
if(cljs.core.truth_((function (){var and__5000__auto__ = line;
if(cljs.core.truth_(and__5000__auto__)){
return column;
} else {
return and__5000__auto__;
}
})())){
var ex_msg__$1 = ex_msg;
var new_exception = (function (){var new_d = new cljs.core.PersistentArrayMap(null, 6, [new cljs.core.Keyword(null,"type","type",1174270348),new cljs.core.Keyword("sci","error","sci/error",-979082803),new cljs.core.Keyword(null,"line","line",212345235),line,new cljs.core.Keyword(null,"column","column",2078222095),column,new cljs.core.Keyword(null,"message","message",-406056002),ex_msg__$1,new cljs.core.Keyword("sci.impl","callstack","sci.impl/callstack",-1621010557),st,new cljs.core.Keyword(null,"file","file",-1269645878),file], null);
return cljs.core.ex_info.cljs$core$IFn$_invoke$arity$3(ex_msg__$1,new_d,e);
})();
throw new_exception;
} else {
throw e;
}
}
}
}));

(sci.impl.utils.rethrow_with_location_of_node.cljs$lang$maxFixedArity = 4);

sci.impl.utils.iobj_QMARK_ = (function sci$impl$utils$iobj_QMARK_(obj){
var and__5000__auto__ = (((!((obj == null))))?(((((obj.cljs$lang$protocol_mask$partition0$ & (262144))) || ((cljs.core.PROTOCOL_SENTINEL === obj.cljs$core$IWithMeta$))))?true:false):false);
if(and__5000__auto__){
return cljs.core.meta(obj);
} else {
return and__5000__auto__;
}
});
/**
 * Only adds metadata to obj if d is not nil and if obj already has meta
 */
sci.impl.utils.vary_meta_STAR_ = (function sci$impl$utils$vary_meta_STAR_(var_args){
var args__5732__auto__ = [];
var len__5726__auto___85568 = arguments.length;
var i__5727__auto___85569 = (0);
while(true){
if((i__5727__auto___85569 < len__5726__auto___85568)){
args__5732__auto__.push((arguments[i__5727__auto___85569]));

var G__85570 = (i__5727__auto___85569 + (1));
i__5727__auto___85569 = G__85570;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((2) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((2)),(0),null)):null);
return sci.impl.utils.vary_meta_STAR_.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),(arguments[(1)]),argseq__5733__auto__);
});

(sci.impl.utils.vary_meta_STAR_.cljs$core$IFn$_invoke$arity$variadic = (function (obj,f,args){
if(cljs.core.truth_(sci.impl.utils.iobj_QMARK_(obj))){
return cljs.core.apply.cljs$core$IFn$_invoke$arity$4(cljs.core.vary_meta,obj,f,args);
} else {
return obj;
}
}));

(sci.impl.utils.vary_meta_STAR_.cljs$lang$maxFixedArity = (2));

/** @this {Function} */
(sci.impl.utils.vary_meta_STAR_.cljs$lang$applyTo = (function (seq85533){
var G__85534 = cljs.core.first(seq85533);
var seq85533__$1 = cljs.core.next(seq85533);
var G__85535 = cljs.core.first(seq85533__$1);
var seq85533__$2 = cljs.core.next(seq85533__$1);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__85534,G__85535,seq85533__$2);
}));

sci.impl.utils.strip_core_ns = (function sci$impl$utils$strip_core_ns(sym){
var G__85542 = cljs.core.namespace(sym);
switch (G__85542) {
case "clojure.core":
case "cljs.core":
return cljs.core.symbol.cljs$core$IFn$_invoke$arity$1(cljs.core.name(sym));

break;
default:
return sym;

}
});
sci.impl.utils.allowed_loop = cljs.core.symbol.cljs$core$IFn$_invoke$arity$1("loop");
sci.impl.utils.allowed_recur = cljs.core.symbol.cljs$core$IFn$_invoke$arity$1("recur");
sci.impl.utils.var_unbound = (new Object());
sci.impl.utils.walk_STAR_ = (function sci$impl$utils$walk_STAR_(inner,form){
if(cljs.core.truth_(new cljs.core.Keyword("sci.impl","op","sci.impl/op",950953978).cljs$core$IFn$_invoke$arity$1(cljs.core.meta(form)))){
return form;
} else {
if(cljs.core.list_QMARK_(form)){
return cljs.core.with_meta(cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core.list,cljs.core.map.cljs$core$IFn$_invoke$arity$2(inner,form)),cljs.core.meta(form));
} else {
if(cljs.core.map_entry_QMARK_(form)){
return (new cljs.core.MapEntry((function (){var G__85549 = cljs.core.key(form);
return (inner.cljs$core$IFn$_invoke$arity$1 ? inner.cljs$core$IFn$_invoke$arity$1(G__85549) : inner.call(null,G__85549));
})(),(function (){var G__85550 = cljs.core.val(form);
return (inner.cljs$core$IFn$_invoke$arity$1 ? inner.cljs$core$IFn$_invoke$arity$1(G__85550) : inner.call(null,G__85550));
})(),null));
} else {
if(cljs.core.seq_QMARK_(form)){
return cljs.core.with_meta(cljs.core.doall.cljs$core$IFn$_invoke$arity$1(cljs.core.map.cljs$core$IFn$_invoke$arity$2(inner,form)),cljs.core.meta(form));
} else {
if(cljs.core.record_QMARK_(form)){
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (r,x){
return cljs.core.conj.cljs$core$IFn$_invoke$arity$2(r,(inner.cljs$core$IFn$_invoke$arity$1 ? inner.cljs$core$IFn$_invoke$arity$1(x) : inner.call(null,x)));
}),form,form);
} else {
if(cljs.core.coll_QMARK_(form)){
return cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.empty(form),cljs.core.map.cljs$core$IFn$_invoke$arity$2(inner,form));
} else {
return form;

}
}
}
}
}
}
});
/**
 * Prewalk with metadata preservation. Does not prewalk :sci.impl/op nodes.
 */
sci.impl.utils.prewalk = (function sci$impl$utils$prewalk(f,form){
return sci.impl.utils.walk_STAR_(cljs.core.partial.cljs$core$IFn$_invoke$arity$2(sci.impl.utils.prewalk,f),(f.cljs$core$IFn$_invoke$arity$1 ? f.cljs$core$IFn$_invoke$arity$1(form) : f.call(null,form)));
});
/**
 * Fetches namespaces from env if it exists. Else, if `create?`,
 *   produces one regardless of the existince of the namespace in env and
 *   adds it to env before returning it.
 */
sci.impl.utils.namespace_object = (function sci$impl$utils$namespace_object(env,ns_sym,create_QMARK_,attr_map){
var env_STAR_ = cljs.core.deref(env);
var ns_map = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(env_STAR_,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"namespaces","namespaces",-1444157469),ns_sym], null));
var or__5002__auto__ = new cljs.core.Keyword(null,"obj","obj",981763962).cljs$core$IFn$_invoke$arity$1(ns_map);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
if(cljs.core.truth_((function (){var or__5002__auto____$1 = ns_map;
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
return create_QMARK_;
}
})())){
var ns_obj = sci.impl.vars.__GT_SciNamespace(ns_sym,attr_map);
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(env,cljs.core.assoc_in,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"namespaces","namespaces",-1444157469),ns_sym,new cljs.core.Keyword(null,"obj","obj",981763962)], null),ns_obj);

return ns_obj;
} else {
return null;
}
}
});
sci.impl.utils.set_namespace_BANG_ = (function sci$impl$utils$set_namespace_BANG_(ctx,ns_sym,attr_map){
var env = new cljs.core.Keyword(null,"env","env",-1815813235).cljs$core$IFn$_invoke$arity$1(ctx);
var attr_map__$1 = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.meta(ns_sym),attr_map], 0));
var ns_obj = sci.impl.utils.namespace_object(env,ns_sym,true,attr_map__$1);
return sci.impl.vars.current_ns.sci$impl$types$IBox$setVal$arity$2(null,ns_obj);
});
sci.impl.utils.eval_form_state = cljs.core.volatile_BANG_(null);
sci.impl.utils.eval_require_state = cljs.core.volatile_BANG_(null);
sci.impl.utils.eval_use_state = cljs.core.volatile_BANG_(null);
sci.impl.utils.eval_resolve_state = cljs.core.volatile_BANG_(null);
sci.impl.utils.eval_refer_state = cljs.core.volatile_BANG_(null);
sci.impl.utils.macroexpand_STAR_ = cljs.core.volatile_BANG_(null);
sci.impl.utils.macroexpand_1_STAR_ = cljs.core.volatile_BANG_(null);
sci.impl.utils.eval_do_STAR_ = cljs.core.volatile_BANG_(null);
sci.impl.utils.eval_fn = cljs.core.volatile_BANG_(null);
sci.impl.utils.eval_string_STAR_ = cljs.core.volatile_BANG_(null);
sci.impl.utils.lookup = cljs.core.volatile_BANG_(null);
sci.impl.utils.eval = (function sci$impl$utils$eval(sci_ctx,form){
var fexpr__85551 = cljs.core.deref(sci.impl.utils.eval_form_state);
return (fexpr__85551.cljs$core$IFn$_invoke$arity$2 ? fexpr__85551.cljs$core$IFn$_invoke$arity$2(sci_ctx,form) : fexpr__85551.call(null,sci_ctx,form));
});
/**
 * Like partition-by but splits collection only when `pred` returns
 *   a truthy value. E.g. `(split-when odd? [1 2 3 4 5]) => ((1 2) (3 4) (5))`
 */
sci.impl.utils.split_when = (function sci$impl$utils$split_when(pred,coll){
return (new cljs.core.LazySeq(null,(function (){
var temp__5804__auto__ = cljs.core.seq(coll);
if(temp__5804__auto__){
var s = temp__5804__auto__;
var fst = cljs.core.first(s);
var f = cljs.core.complement(pred);
var run = cljs.core.cons(fst,cljs.core.take_while.cljs$core$IFn$_invoke$arity$2((function (p1__85552_SHARP_){
return f(p1__85552_SHARP_);
}),cljs.core.next(s)));
return cljs.core.cons(run,(function (){var G__85553 = pred;
var G__85554 = (new cljs.core.LazySeq(null,(function (){
return cljs.core.drop.cljs$core$IFn$_invoke$arity$2(cljs.core.count(run),s);
}),null,null));
return (sci.impl.utils.split_when.cljs$core$IFn$_invoke$arity$2 ? sci.impl.utils.split_when.cljs$core$IFn$_invoke$arity$2(G__85553,G__85554) : sci.impl.utils.split_when.call(null,G__85553,G__85554));
})());
} else {
return null;
}
}),null,null));
});
sci.impl.utils.ana_macros = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 24, [new cljs.core.Symbol(null,"try","try",-1273693247,null),"null",new cljs.core.Symbol(null,"import","import",241030818,null),"null",new cljs.core.Symbol(null,"lazy-seq","lazy-seq",489632906,null),"null",new cljs.core.Symbol(null,"let","let",358118826,null),"null",new cljs.core.Symbol(null,"fn","fn",465265323,null),"null",new cljs.core.Symbol(null,"do","do",1686842252,null),"null",new cljs.core.Symbol(null,"in-ns","in-ns",-2089468466,null),"null",new cljs.core.Symbol(null,"defn","defn",-126010802,null),"null",new cljs.core.Symbol(null,"if","if",1181717262,null),"null",new cljs.core.Symbol(null,"new","new",-444906321,null),"null",new cljs.core.Symbol(null,"ns","ns",2082130287,null),"null",new cljs.core.Symbol(null,"or","or",1876275696,null),"null",new cljs.core.Symbol(null,"fn*","fn*",-752876845,null),"null",new cljs.core.Symbol(null,"loop","loop",1244978678,null),"null",new cljs.core.Symbol(null,"expand-constructor","expand-constructor",-343741576,null),"null",new cljs.core.Symbol(null,"defmacro","defmacro",2054157304,null),"null",new cljs.core.Symbol(null,"set!","set!",250714521,null),"null",new cljs.core.Symbol(null,".",".",1975675962,null),"null",new cljs.core.Symbol(null,"var","var",870848730,null),"null",new cljs.core.Symbol(null,"case","case",-1510733573,null),"null",new cljs.core.Symbol(null,"resolve","resolve",56086045,null),"null",new cljs.core.Symbol(null,"and","and",668631710,null),"null",new cljs.core.Symbol(null,"def","def",597100991,null),"null",new cljs.core.Symbol(null,"expand-dot*","expand-dot*",-1946890561,null),"null"], null), null);
sci.impl.utils.maybe_destructured = (function sci$impl$utils$maybe_destructured(params,body){
if(cljs.core.every_QMARK_(cljs.core.symbol_QMARK_,params)){
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"params","params",710516235),params,new cljs.core.Keyword(null,"body","body",-2049205669),body], null);
} else {
var params__$1 = params;
var new_params = cljs.core.with_meta(cljs.core.PersistentVector.EMPTY,cljs.core.meta(params__$1));
var lets = cljs.core.PersistentVector.EMPTY;
while(true){
if(cljs.core.truth_(params__$1)){
if((cljs.core.first(params__$1) instanceof cljs.core.Symbol)){
var G__85576 = cljs.core.next(params__$1);
var G__85577 = cljs.core.conj.cljs$core$IFn$_invoke$arity$2(new_params,cljs.core.first(params__$1));
var G__85578 = lets;
params__$1 = G__85576;
new_params = G__85577;
lets = G__85578;
continue;
} else {
var gparam = cljs.core.gensym.cljs$core$IFn$_invoke$arity$1("p__");
var G__85580 = cljs.core.next(params__$1);
var G__85581 = cljs.core.conj.cljs$core$IFn$_invoke$arity$2(new_params,gparam);
var G__85582 = cljs.core.conj.cljs$core$IFn$_invoke$arity$2(cljs.core.conj.cljs$core$IFn$_invoke$arity$2(lets,cljs.core.first(params__$1)),gparam);
params__$1 = G__85580;
new_params = G__85581;
lets = G__85582;
continue;
}
} else {
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"params","params",710516235),new_params,new cljs.core.Keyword(null,"body","body",-2049205669),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic((new cljs.core.List(null,new cljs.core.Symbol("cljs.core","let","cljs.core/let",-308701135,null),null,(1),null)),(new cljs.core.List(null,lets,null,(1),null)),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([body], 0))))], null)], null);
}
break;
}
}
});
sci.impl.utils.log = (function sci$impl$utils$log(var_args){
var args__5732__auto__ = [];
var len__5726__auto___85584 = arguments.length;
var i__5727__auto___85585 = (0);
while(true){
if((i__5727__auto___85585 < len__5726__auto___85584)){
args__5732__auto__.push((arguments[i__5727__auto___85585]));

var G__85586 = (i__5727__auto___85585 + (1));
i__5727__auto___85585 = G__85586;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((0) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((0)),(0),null)):null);
return sci.impl.utils.log.cljs$core$IFn$_invoke$arity$variadic(argseq__5733__auto__);
});

(sci.impl.utils.log.cljs$core$IFn$_invoke$arity$variadic = (function (xs){
return console.log(clojure.string.join.cljs$core$IFn$_invoke$arity$2(" ",xs));
}));

(sci.impl.utils.log.cljs$lang$maxFixedArity = (0));

/** @this {Function} */
(sci.impl.utils.log.cljs$lang$applyTo = (function (seq85557){
var self__5712__auto__ = this;
return self__5712__auto__.cljs$core$IFn$_invoke$arity$variadic(cljs.core.seq(seq85557));
}));


//# sourceMappingURL=sci.impl.utils.js.map
