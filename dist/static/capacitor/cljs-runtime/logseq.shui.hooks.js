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
if(cljs.core.truth_((function (){var G__73277 = deps_ref.current;
var G__73278 = deps;
return (equal_fn__$1.cljs$core$IFn$_invoke$arity$2 ? equal_fn__$1.cljs$core$IFn$_invoke$arity$2(G__73277,G__73278) : equal_fn__$1.call(null,G__73277,G__73278));
})())){
} else {
(deps_ref.current = deps);
}

return deps_ref.current;
});
logseq.shui.hooks.use_memo = (function logseq$shui$hooks$use_memo(var_args){
var args__5732__auto__ = [];
var len__5726__auto___73399 = arguments.length;
var i__5727__auto___73400 = (0);
while(true){
if((i__5727__auto___73400 < len__5726__auto___73399)){
args__5732__auto__.push((arguments[i__5727__auto___73400]));

var G__73401 = (i__5727__auto___73400 + (1));
i__5727__auto___73400 = G__73401;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((2) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((2)),(0),null)):null);
return logseq.shui.hooks.use_memo.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),(arguments[(1)]),argseq__5733__auto__);
});

(logseq.shui.hooks.use_memo.cljs$core$IFn$_invoke$arity$variadic = (function (f,deps,p__73282){
var map__73283 = p__73282;
var map__73283__$1 = cljs.core.__destructure_map(map__73283);
var equal_fn = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__73283__$1,new cljs.core.Keyword(null,"equal-fn","equal-fn",542091554));
return rum.core.use_memo.cljs$core$IFn$_invoke$arity$2(f,((cljs.core.empty_QMARK_(deps))?deps:[logseq.shui.hooks.memo_deps(equal_fn,deps)]));
}));

(logseq.shui.hooks.use_memo.cljs$lang$maxFixedArity = (2));

/** @this {Function} */
(logseq.shui.hooks.use_memo.cljs$lang$applyTo = (function (seq73279){
var G__73280 = cljs.core.first(seq73279);
var seq73279__$1 = cljs.core.next(seq73279);
var G__73281 = cljs.core.first(seq73279__$1);
var seq73279__$2 = cljs.core.next(seq73279__$1);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__73280,G__73281,seq73279__$2);
}));

/**
 * setup-fn will be invoked every render of component when no deps arg provided
 */
logseq.shui.hooks.use_effect_BANG_ = (function logseq$shui$hooks$use_effect_BANG_(var_args){
var G__73300 = arguments.length;
switch (G__73300) {
case 1:
return logseq.shui.hooks.use_effect_BANG_.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
default:
var args_arr__5751__auto__ = [];
var len__5726__auto___73404 = arguments.length;
var i__5727__auto___73405 = (0);
while(true){
if((i__5727__auto___73405 < len__5726__auto___73404)){
args_arr__5751__auto__.push((arguments[i__5727__auto___73405]));

var G__73406 = (i__5727__auto___73405 + (1));
i__5727__auto___73405 = G__73406;
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

(logseq.shui.hooks.use_effect_BANG_.cljs$core$IFn$_invoke$arity$variadic = (function (setup_fn,deps,p__73312){
var map__73315 = p__73312;
var map__73315__$1 = cljs.core.__destructure_map(map__73315);
var equal_fn = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__73315__$1,new cljs.core.Keyword(null,"equal-fn","equal-fn",542091554));
if(cljs.core.fn_QMARK_(setup_fn)){
} else {
throw (new Error(["Assert failed: ","use-effect! setup-fn should be a function","\n","(fn? setup-fn)"].join('')));
}

return rum.core.use_effect_BANG_.cljs$core$IFn$_invoke$arity$2((function() { 
var G__73407__delegate = function (deps__$1){
var result = cljs.core.apply.cljs$core$IFn$_invoke$arity$2(setup_fn,deps__$1);
if(cljs.core.fn_QMARK_(result)){
return result;
} else {
return null;
}
};
var G__73407 = function (var_args){
var deps__$1 = null;
if (arguments.length > 0) {
var G__73408__i = 0, G__73408__a = new Array(arguments.length -  0);
while (G__73408__i < G__73408__a.length) {G__73408__a[G__73408__i] = arguments[G__73408__i + 0]; ++G__73408__i;}
  deps__$1 = new cljs.core.IndexedSeq(G__73408__a,0,null);
} 
return G__73407__delegate.call(this,deps__$1);};
G__73407.cljs$lang$maxFixedArity = 0;
G__73407.cljs$lang$applyTo = (function (arglist__73409){
var deps__$1 = cljs.core.seq(arglist__73409);
return G__73407__delegate(deps__$1);
});
G__73407.cljs$core$IFn$_invoke$arity$variadic = G__73407__delegate;
return G__73407;
})()
,((cljs.core.empty_QMARK_(deps))?deps:[logseq.shui.hooks.memo_deps(equal_fn,deps)]));
}));

/** @this {Function} */
(logseq.shui.hooks.use_effect_BANG_.cljs$lang$applyTo = (function (seq73297){
var G__73298 = cljs.core.first(seq73297);
var seq73297__$1 = cljs.core.next(seq73297);
var G__73299 = cljs.core.first(seq73297__$1);
var seq73297__$2 = cljs.core.next(seq73297__$1);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__73298,G__73299,seq73297__$2);
}));

(logseq.shui.hooks.use_effect_BANG_.cljs$lang$maxFixedArity = (2));

logseq.shui.hooks.use_layout_effect_BANG_ = (function logseq$shui$hooks$use_layout_effect_BANG_(var_args){
var G__73326 = arguments.length;
switch (G__73326) {
case 1:
return logseq.shui.hooks.use_layout_effect_BANG_.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
default:
var args_arr__5751__auto__ = [];
var len__5726__auto___73411 = arguments.length;
var i__5727__auto___73412 = (0);
while(true){
if((i__5727__auto___73412 < len__5726__auto___73411)){
args_arr__5751__auto__.push((arguments[i__5727__auto___73412]));

var G__73413 = (i__5727__auto___73412 + (1));
i__5727__auto___73412 = G__73413;
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

(logseq.shui.hooks.use_layout_effect_BANG_.cljs$core$IFn$_invoke$arity$variadic = (function (setup_fn,deps,p__73331){
var map__73332 = p__73331;
var map__73332__$1 = cljs.core.__destructure_map(map__73332);
var equal_fn = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__73332__$1,new cljs.core.Keyword(null,"equal-fn","equal-fn",542091554));
if(cljs.core.fn_QMARK_(setup_fn)){
} else {
throw (new Error(["Assert failed: ","use-layout-effect! setup-fn should be a function","\n","(fn? setup-fn)"].join('')));
}

return rum.core.use_layout_effect_BANG_.cljs$core$IFn$_invoke$arity$2((function() { 
var G__73414__delegate = function (deps__$1){
var result = cljs.core.apply.cljs$core$IFn$_invoke$arity$2(setup_fn,deps__$1);
if(cljs.core.fn_QMARK_(result)){
return result;
} else {
return null;
}
};
var G__73414 = function (var_args){
var deps__$1 = null;
if (arguments.length > 0) {
var G__73415__i = 0, G__73415__a = new Array(arguments.length -  0);
while (G__73415__i < G__73415__a.length) {G__73415__a[G__73415__i] = arguments[G__73415__i + 0]; ++G__73415__i;}
  deps__$1 = new cljs.core.IndexedSeq(G__73415__a,0,null);
} 
return G__73414__delegate.call(this,deps__$1);};
G__73414.cljs$lang$maxFixedArity = 0;
G__73414.cljs$lang$applyTo = (function (arglist__73416){
var deps__$1 = cljs.core.seq(arglist__73416);
return G__73414__delegate(deps__$1);
});
G__73414.cljs$core$IFn$_invoke$arity$variadic = G__73414__delegate;
return G__73414;
})()
,((cljs.core.empty_QMARK_(deps))?deps:[logseq.shui.hooks.memo_deps(equal_fn,deps)]));
}));

/** @this {Function} */
(logseq.shui.hooks.use_layout_effect_BANG_.cljs$lang$applyTo = (function (seq73323){
var G__73324 = cljs.core.first(seq73323);
var seq73323__$1 = cljs.core.next(seq73323);
var G__73325 = cljs.core.first(seq73323__$1);
var seq73323__$2 = cljs.core.next(seq73323__$1);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__73324,G__73325,seq73323__$2);
}));

(logseq.shui.hooks.use_layout_effect_BANG_.cljs$lang$maxFixedArity = (2));

logseq.shui.hooks.use_callback = (function logseq$shui$hooks$use_callback(var_args){
var args__5732__auto__ = [];
var len__5726__auto___73419 = arguments.length;
var i__5727__auto___73420 = (0);
while(true){
if((i__5727__auto___73420 < len__5726__auto___73419)){
args__5732__auto__.push((arguments[i__5727__auto___73420]));

var G__73421 = (i__5727__auto___73420 + (1));
i__5727__auto___73420 = G__73421;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((2) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((2)),(0),null)):null);
return logseq.shui.hooks.use_callback.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),(arguments[(1)]),argseq__5733__auto__);
});

(logseq.shui.hooks.use_callback.cljs$core$IFn$_invoke$arity$variadic = (function (callback,deps,p__73342){
var map__73343 = p__73342;
var map__73343__$1 = cljs.core.__destructure_map(map__73343);
var equal_fn = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__73343__$1,new cljs.core.Keyword(null,"equal-fn","equal-fn",542091554));
return rum.core.use_callback.cljs$core$IFn$_invoke$arity$2(callback,((cljs.core.empty_QMARK_(deps))?deps:[logseq.shui.hooks.memo_deps(equal_fn,deps)]));
}));

(logseq.shui.hooks.use_callback.cljs$lang$maxFixedArity = (2));

/** @this {Function} */
(logseq.shui.hooks.use_callback.cljs$lang$applyTo = (function (seq73339){
var G__73340 = cljs.core.first(seq73339);
var seq73339__$1 = cljs.core.next(seq73339);
var G__73341 = cljs.core.first(seq73339__$1);
var seq73339__$2 = cljs.core.next(seq73339__$1);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__73340,G__73341,seq73339__$2);
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
var vec__73350 = (logseq.shui.hooks.use_state.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.hooks.use_state.cljs$core$IFn$_invoke$arity$1(value) : logseq.shui.hooks.use_state.call(null,value));
var debounced_value = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__73350,(0),null);
var set_value_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__73350,(1),null);
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
var G__73354 = arguments.length;
switch (G__73354) {
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
var vec__73362 = (logseq.shui.hooks.use_state.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.hooks.use_state.cljs$core$IFn$_invoke$arity$1(init_value) : logseq.shui.hooks.use_state.call(null,init_value));
var value = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__73362,(0),null);
var set_value_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__73362,(1),null);
logseq.shui.hooks.use_effect_BANG_((function (){
return frontend.common.missionary.run_task_STAR_(missionary.core.reduce.cljs$core$IFn$_invoke$arity$2(cljs.core.constantly(null),cljs.core.partial.cljs$core$IFn$_invoke$arity$2((function (){var cr73369_block_0 = (function logseq$shui$hooks$cr73369_block_0(cr73369_state){
try{var cr73369_place_0 = (1);
var cr73369_place_1 = flow;
(cr73369_state[(0)] = cr73369_block_1);

return missionary.core.fork(cr73369_place_0,cr73369_place_1);
}catch (e73389){var cr73369_exception = e73389;
(cr73369_state[(0)] = null);

throw cr73369_exception;
}});
var cr73369_block_1 = (function logseq$shui$hooks$cr73369_block_1(cr73369_state){
try{var cr73369_place_2 = missionary.core.unpark();
var cr73369_place_3 = set_value_BANG_;
var cr73369_place_4 = cr73369_place_2;
var cr73369_place_5 = (function (){var G__73392 = cr73369_place_4;
var fexpr__73391 = cr73369_place_3;
return (fexpr__73391.cljs$core$IFn$_invoke$arity$1 ? fexpr__73391.cljs$core$IFn$_invoke$arity$1(G__73392) : fexpr__73391.call(null,G__73392));
})();
(cr73369_state[(0)] = null);

return cr73369_place_5;
}catch (e73390){var cr73369_exception = e73390;
(cr73369_state[(0)] = null);

throw cr73369_exception;
}});
return cloroutine.impl.coroutine((function (){var G__73393 = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1((1));
(G__73393[(0)] = cr73369_block_0);

return G__73393;
})());
})(),missionary.core.ap_run)));
}),deps);

return value;
}));

(logseq.shui.hooks.use_flow_state.cljs$lang$maxFixedArity = 3);


//# sourceMappingURL=logseq.shui.hooks.js.map
