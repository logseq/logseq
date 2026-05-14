goog.provide('logseq.shui.hooks');
logseq.shui.hooks.memo_deps = (function logseq$shui$hooks$memo_deps(equal_fn,deps){
var equal_fn__$1 = (function (){var or__5002__auto__ = equal_fn;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core._EQ_;
}
})();
var deps_ref = rum.core.use_ref(deps);
if(cljs.core.truth_((function (){var G__74085 = deps_ref.current;
var G__74086 = deps;
return (equal_fn__$1.cljs$core$IFn$_invoke$arity$2 ? equal_fn__$1.cljs$core$IFn$_invoke$arity$2(G__74085,G__74086) : equal_fn__$1.call(null,G__74085,G__74086));
})())){
} else {
(deps_ref.current = deps);
}

return deps_ref.current;
});
logseq.shui.hooks.use_memo = (function logseq$shui$hooks$use_memo(var_args){
var args__5732__auto__ = [];
var len__5726__auto___74202 = arguments.length;
var i__5727__auto___74203 = (0);
while(true){
if((i__5727__auto___74203 < len__5726__auto___74202)){
args__5732__auto__.push((arguments[i__5727__auto___74203]));

var G__74204 = (i__5727__auto___74203 + (1));
i__5727__auto___74203 = G__74204;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((2) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((2)),(0),null)):null);
return logseq.shui.hooks.use_memo.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),(arguments[(1)]),argseq__5733__auto__);
});

(logseq.shui.hooks.use_memo.cljs$core$IFn$_invoke$arity$variadic = (function (f,deps,p__74094){
var map__74095 = p__74094;
var map__74095__$1 = cljs.core.__destructure_map(map__74095);
var equal_fn = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__74095__$1,new cljs.core.Keyword(null,"equal-fn","equal-fn",542091554));
return rum.core.use_memo.cljs$core$IFn$_invoke$arity$2(f,((cljs.core.empty_QMARK_(deps))?deps:[logseq.shui.hooks.memo_deps(equal_fn,deps)]));
}));

(logseq.shui.hooks.use_memo.cljs$lang$maxFixedArity = (2));

/** @this {Function} */
(logseq.shui.hooks.use_memo.cljs$lang$applyTo = (function (seq74088){
var G__74089 = cljs.core.first(seq74088);
var seq74088__$1 = cljs.core.next(seq74088);
var G__74090 = cljs.core.first(seq74088__$1);
var seq74088__$2 = cljs.core.next(seq74088__$1);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__74089,G__74090,seq74088__$2);
}));

/**
 * setup-fn will be invoked every render of component when no deps arg provided
 */
logseq.shui.hooks.use_effect_BANG_ = (function logseq$shui$hooks$use_effect_BANG_(var_args){
var G__74108 = arguments.length;
switch (G__74108) {
case 1:
return logseq.shui.hooks.use_effect_BANG_.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
default:
var args_arr__5751__auto__ = [];
var len__5726__auto___74212 = arguments.length;
var i__5727__auto___74213 = (0);
while(true){
if((i__5727__auto___74213 < len__5726__auto___74212)){
args_arr__5751__auto__.push((arguments[i__5727__auto___74213]));

var G__74214 = (i__5727__auto___74213 + (1));
i__5727__auto___74213 = G__74214;
continue;
} else {
}
break;
}

var argseq__5752__auto__ = ((((2) < args_arr__5751__auto__.length))?(new cljs.core.IndexedSeq(args_arr__5751__auto__.slice((2)),(0),null)):null);
return logseq.shui.hooks.use_effect_BANG_.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),(arguments[(1)]),argseq__5752__auto__);

}
});

(logseq.shui.hooks.use_effect_BANG_.cljs$core$IFn$_invoke$arity$1 = (function (setup_fn){
return rum.core.use_effect_BANG_.cljs$core$IFn$_invoke$arity$1(setup_fn);
}));

(logseq.shui.hooks.use_effect_BANG_.cljs$core$IFn$_invoke$arity$variadic = (function (setup_fn,deps,p__74118){
var map__74119 = p__74118;
var map__74119__$1 = cljs.core.__destructure_map(map__74119);
var equal_fn = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__74119__$1,new cljs.core.Keyword(null,"equal-fn","equal-fn",542091554));
if(cljs.core.fn_QMARK_(setup_fn)){
} else {
throw (new Error(["Assert failed: ","use-effect! setup-fn should be a function","\n","(fn? setup-fn)"].join('')));
}

return rum.core.use_effect_BANG_.cljs$core$IFn$_invoke$arity$2((function() { 
var G__74215__delegate = function (deps__$1){
var result = cljs.core.apply.cljs$core$IFn$_invoke$arity$2(setup_fn,deps__$1);
if(cljs.core.fn_QMARK_(result)){
return result;
} else {
return null;
}
};
var G__74215 = function (var_args){
var deps__$1 = null;
if (arguments.length > 0) {
var G__74216__i = 0, G__74216__a = new Array(arguments.length -  0);
while (G__74216__i < G__74216__a.length) {G__74216__a[G__74216__i] = arguments[G__74216__i + 0]; ++G__74216__i;}
  deps__$1 = new cljs.core.IndexedSeq(G__74216__a,0,null);
} 
return G__74215__delegate.call(this,deps__$1);};
G__74215.cljs$lang$maxFixedArity = 0;
G__74215.cljs$lang$applyTo = (function (arglist__74217){
var deps__$1 = cljs.core.seq(arglist__74217);
return G__74215__delegate(deps__$1);
});
G__74215.cljs$core$IFn$_invoke$arity$variadic = G__74215__delegate;
return G__74215;
})()
,((cljs.core.empty_QMARK_(deps))?deps:[logseq.shui.hooks.memo_deps(equal_fn,deps)]));
}));

/** @this {Function} */
(logseq.shui.hooks.use_effect_BANG_.cljs$lang$applyTo = (function (seq74105){
var G__74106 = cljs.core.first(seq74105);
var seq74105__$1 = cljs.core.next(seq74105);
var G__74107 = cljs.core.first(seq74105__$1);
var seq74105__$2 = cljs.core.next(seq74105__$1);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__74106,G__74107,seq74105__$2);
}));

(logseq.shui.hooks.use_effect_BANG_.cljs$lang$maxFixedArity = (2));

logseq.shui.hooks.use_layout_effect_BANG_ = (function logseq$shui$hooks$use_layout_effect_BANG_(var_args){
var G__74131 = arguments.length;
switch (G__74131) {
case 1:
return logseq.shui.hooks.use_layout_effect_BANG_.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
default:
var args_arr__5751__auto__ = [];
var len__5726__auto___74221 = arguments.length;
var i__5727__auto___74222 = (0);
while(true){
if((i__5727__auto___74222 < len__5726__auto___74221)){
args_arr__5751__auto__.push((arguments[i__5727__auto___74222]));

var G__74223 = (i__5727__auto___74222 + (1));
i__5727__auto___74222 = G__74223;
continue;
} else {
}
break;
}

var argseq__5752__auto__ = ((((2) < args_arr__5751__auto__.length))?(new cljs.core.IndexedSeq(args_arr__5751__auto__.slice((2)),(0),null)):null);
return logseq.shui.hooks.use_layout_effect_BANG_.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),(arguments[(1)]),argseq__5752__auto__);

}
});

(logseq.shui.hooks.use_layout_effect_BANG_.cljs$core$IFn$_invoke$arity$1 = (function (setup_fn){
return rum.core.use_layout_effect_BANG_.cljs$core$IFn$_invoke$arity$1(setup_fn);
}));

(logseq.shui.hooks.use_layout_effect_BANG_.cljs$core$IFn$_invoke$arity$variadic = (function (setup_fn,deps,p__74139){
var map__74140 = p__74139;
var map__74140__$1 = cljs.core.__destructure_map(map__74140);
var equal_fn = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__74140__$1,new cljs.core.Keyword(null,"equal-fn","equal-fn",542091554));
if(cljs.core.fn_QMARK_(setup_fn)){
} else {
throw (new Error(["Assert failed: ","use-layout-effect! setup-fn should be a function","\n","(fn? setup-fn)"].join('')));
}

return rum.core.use_layout_effect_BANG_.cljs$core$IFn$_invoke$arity$2((function() { 
var G__74227__delegate = function (deps__$1){
var result = cljs.core.apply.cljs$core$IFn$_invoke$arity$2(setup_fn,deps__$1);
if(cljs.core.fn_QMARK_(result)){
return result;
} else {
return null;
}
};
var G__74227 = function (var_args){
var deps__$1 = null;
if (arguments.length > 0) {
var G__74228__i = 0, G__74228__a = new Array(arguments.length -  0);
while (G__74228__i < G__74228__a.length) {G__74228__a[G__74228__i] = arguments[G__74228__i + 0]; ++G__74228__i;}
  deps__$1 = new cljs.core.IndexedSeq(G__74228__a,0,null);
} 
return G__74227__delegate.call(this,deps__$1);};
G__74227.cljs$lang$maxFixedArity = 0;
G__74227.cljs$lang$applyTo = (function (arglist__74229){
var deps__$1 = cljs.core.seq(arglist__74229);
return G__74227__delegate(deps__$1);
});
G__74227.cljs$core$IFn$_invoke$arity$variadic = G__74227__delegate;
return G__74227;
})()
,((cljs.core.empty_QMARK_(deps))?deps:[logseq.shui.hooks.memo_deps(equal_fn,deps)]));
}));

/** @this {Function} */
(logseq.shui.hooks.use_layout_effect_BANG_.cljs$lang$applyTo = (function (seq74128){
var G__74129 = cljs.core.first(seq74128);
var seq74128__$1 = cljs.core.next(seq74128);
var G__74130 = cljs.core.first(seq74128__$1);
var seq74128__$2 = cljs.core.next(seq74128__$1);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__74129,G__74130,seq74128__$2);
}));

(logseq.shui.hooks.use_layout_effect_BANG_.cljs$lang$maxFixedArity = (2));

logseq.shui.hooks.use_callback = (function logseq$shui$hooks$use_callback(var_args){
var args__5732__auto__ = [];
var len__5726__auto___74231 = arguments.length;
var i__5727__auto___74232 = (0);
while(true){
if((i__5727__auto___74232 < len__5726__auto___74231)){
args__5732__auto__.push((arguments[i__5727__auto___74232]));

var G__74233 = (i__5727__auto___74232 + (1));
i__5727__auto___74232 = G__74233;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((2) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((2)),(0),null)):null);
return logseq.shui.hooks.use_callback.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),(arguments[(1)]),argseq__5733__auto__);
});

(logseq.shui.hooks.use_callback.cljs$core$IFn$_invoke$arity$variadic = (function (callback,deps,p__74154){
var map__74155 = p__74154;
var map__74155__$1 = cljs.core.__destructure_map(map__74155);
var equal_fn = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__74155__$1,new cljs.core.Keyword(null,"equal-fn","equal-fn",542091554));
return rum.core.use_callback.cljs$core$IFn$_invoke$arity$2(callback,((cljs.core.empty_QMARK_(deps))?deps:[logseq.shui.hooks.memo_deps(equal_fn,deps)]));
}));

(logseq.shui.hooks.use_callback.cljs$lang$maxFixedArity = (2));

/** @this {Function} */
(logseq.shui.hooks.use_callback.cljs$lang$applyTo = (function (seq74149){
var G__74150 = cljs.core.first(seq74149);
var seq74149__$1 = cljs.core.next(seq74149);
var G__74151 = cljs.core.first(seq74149__$1);
var seq74149__$2 = cljs.core.next(seq74149__$1);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__74150,G__74151,seq74149__$2);
}));

logseq.shui.hooks.use_ref = rum.core.use_ref;
logseq.shui.hooks.create_ref = rum.core.create_ref;
logseq.shui.hooks.deref = rum.core.deref;
logseq.shui.hooks.set_ref_BANG_ = rum.core.set_ref_BANG_;
logseq.shui.hooks.use_state = rum.core.use_state;
/**
 * Return the debounced value
 */
logseq.shui.hooks.use_debounced_value = (function logseq$shui$hooks$use_debounced_value(value,msec){
var vec__74156 = (logseq.shui.hooks.use_state.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.hooks.use_state.cljs$core$IFn$_invoke$arity$1(value) : logseq.shui.hooks.use_state.call(null,value));
var debounced_value = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__74156,(0),null);
var set_value_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__74156,(1),null);
var cb = logseq.shui.hooks.use_callback(goog.functions.debounce(set_value_BANG_,msec),cljs.core.PersistentVector.EMPTY);
logseq.shui.hooks.use_effect_BANG_((function (){
return (cb.cljs$core$IFn$_invoke$arity$1 ? cb.cljs$core$IFn$_invoke$arity$1(value) : cb.call(null,value));
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [value], null));

return debounced_value;
});
/**
 * Return values from `flow`, default init-value is nil
 */
logseq.shui.hooks.use_flow_state = (function logseq$shui$hooks$use_flow_state(var_args){
var G__74162 = arguments.length;
switch (G__74162) {
case 1:
return logseq.shui.hooks.use_flow_state.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return logseq.shui.hooks.use_flow_state.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return logseq.shui.hooks.use_flow_state.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(logseq.shui.hooks.use_flow_state.cljs$core$IFn$_invoke$arity$1 = (function (flow){
return logseq.shui.hooks.use_flow_state.cljs$core$IFn$_invoke$arity$3(null,flow,cljs.core.PersistentVector.EMPTY);
}));

(logseq.shui.hooks.use_flow_state.cljs$core$IFn$_invoke$arity$2 = (function (init_value,flow){
return logseq.shui.hooks.use_flow_state.cljs$core$IFn$_invoke$arity$3(init_value,flow,cljs.core.PersistentVector.EMPTY);
}));

(logseq.shui.hooks.use_flow_state.cljs$core$IFn$_invoke$arity$3 = (function (init_value,flow,deps){
var vec__74166 = (logseq.shui.hooks.use_state.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.hooks.use_state.cljs$core$IFn$_invoke$arity$1(init_value) : logseq.shui.hooks.use_state.call(null,init_value));
var value = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__74166,(0),null);
var set_value_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__74166,(1),null);
logseq.shui.hooks.use_effect_BANG_((function (){
return frontend.common.missionary.run_task_STAR_(missionary.core.reduce.cljs$core$IFn$_invoke$arity$2(cljs.core.constantly(null),cljs.core.partial.cljs$core$IFn$_invoke$arity$2((function (){var cr74171_block_0 = (function logseq$shui$hooks$cr74171_block_0(cr74171_state){
try{var cr74171_place_0 = (1);
var cr74171_place_1 = flow;
(cr74171_state[(0)] = cr74171_block_1);

return missionary.core.fork(cr74171_place_0,cr74171_place_1);
}catch (e74190){var cr74171_exception = e74190;
(cr74171_state[(0)] = null);

throw cr74171_exception;
}});
var cr74171_block_1 = (function logseq$shui$hooks$cr74171_block_1(cr74171_state){
try{var cr74171_place_2 = missionary.core.unpark();
var cr74171_place_3 = set_value_BANG_;
var cr74171_place_4 = cr74171_place_2;
var cr74171_place_5 = (function (){var G__74195 = cr74171_place_4;
var fexpr__74194 = cr74171_place_3;
return (fexpr__74194.cljs$core$IFn$_invoke$arity$1 ? fexpr__74194.cljs$core$IFn$_invoke$arity$1(G__74195) : fexpr__74194.call(null,G__74195));
})();
(cr74171_state[(0)] = null);

return cr74171_place_5;
}catch (e74193){var cr74171_exception = e74193;
(cr74171_state[(0)] = null);

throw cr74171_exception;
}});
return cloroutine.impl.coroutine((function (){var G__74196 = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1((1));
(G__74196[(0)] = cr74171_block_0);

return G__74196;
})());
})(),missionary.core.ap_run)));
}),deps);

return value;
}));

(logseq.shui.hooks.use_flow_state.cljs$lang$maxFixedArity = 3);


//# sourceMappingURL=logseq.shui.hooks.js.map
