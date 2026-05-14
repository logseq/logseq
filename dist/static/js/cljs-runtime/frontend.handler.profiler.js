goog.provide('frontend.handler.profiler');
goog.scope(function(){
  frontend.handler.profiler.goog$module$goog$object = goog.module.get('goog.object');
});
frontend.handler.profiler._STAR_fn_symbol__GT_key__GT_call_count = cljs.core.volatile_BANG_(cljs.core.PersistentArrayMap.EMPTY);
frontend.handler.profiler._STAR_fn_symbol__GT_key__GT_time_sum = cljs.core.volatile_BANG_(cljs.core.PersistentArrayMap.EMPTY);
frontend.handler.profiler._STAR_fn_symbol__GT_origin_fn = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
frontend.handler.profiler.arity_pattern = /cljs\$core\$IFn\$_invoke\$arity\$([0-9]+)/;
frontend.handler.profiler.get_profile_fn = (function frontend$handler$profiler$get_profile_fn(fn_sym,original_fn,custom_key_fn){
var arity_ns = cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (p1__183199_SHARP_){
var G__183202 = cljs.core.re_find(frontend.handler.profiler.arity_pattern,p1__183199_SHARP_);
var G__183202__$1 = (((G__183202 == null))?null:cljs.core.second(G__183202));
if((G__183202__$1 == null)){
return null;
} else {
return cljs.core.parse_long(G__183202__$1);
}
}),frontend.handler.profiler.goog$module$goog$object.getKeys(original_fn));
var f = (function() { 
var frontend$handler$profiler$get_profile_fn_$_profile_fn_inner__delegate = function (args){
var start = cljs.core.system_time();
var r = cljs.core.apply.cljs$core$IFn$_invoke$arity$2(original_fn,args);
var elapsed_time = (cljs.core.system_time() - start);
var k = (cljs.core.truth_(custom_key_fn)?(custom_key_fn.cljs$core$IFn$_invoke$arity$2 ? custom_key_fn.cljs$core$IFn$_invoke$arity$2(args,r) : custom_key_fn.call(null,args,r)):null);
frontend.handler.profiler._STAR_fn_symbol__GT_key__GT_call_count.cljs$core$IVolatile$_vreset_BANG_$arity$2(null,cljs.core.update_in.cljs$core$IFn$_invoke$arity$3(frontend.handler.profiler._STAR_fn_symbol__GT_key__GT_call_count.cljs$core$IDeref$_deref$arity$1(null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [fn_sym,new cljs.core.Keyword(null,"total","total",1916810418)], null),cljs.core.inc));

frontend.handler.profiler._STAR_fn_symbol__GT_key__GT_time_sum.cljs$core$IVolatile$_vreset_BANG_$arity$2(null,cljs.core.update_in.cljs$core$IFn$_invoke$arity$3(frontend.handler.profiler._STAR_fn_symbol__GT_key__GT_time_sum.cljs$core$IDeref$_deref$arity$1(null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [fn_sym,new cljs.core.Keyword(null,"total","total",1916810418)], null),(function (p1__183200_SHARP_){
return (p1__183200_SHARP_ + elapsed_time);
})));

if(cljs.core.truth_(k)){
frontend.handler.profiler._STAR_fn_symbol__GT_key__GT_call_count.cljs$core$IVolatile$_vreset_BANG_$arity$2(null,cljs.core.update_in.cljs$core$IFn$_invoke$arity$3(frontend.handler.profiler._STAR_fn_symbol__GT_key__GT_call_count.cljs$core$IDeref$_deref$arity$1(null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [fn_sym,k], null),cljs.core.inc));

frontend.handler.profiler._STAR_fn_symbol__GT_key__GT_time_sum.cljs$core$IVolatile$_vreset_BANG_$arity$2(null,cljs.core.update_in.cljs$core$IFn$_invoke$arity$3(frontend.handler.profiler._STAR_fn_symbol__GT_key__GT_time_sum.cljs$core$IDeref$_deref$arity$1(null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [fn_sym,k], null),(function (p1__183201_SHARP_){
return (p1__183201_SHARP_ + elapsed_time);
})));
} else {
}

return r;
};
var frontend$handler$profiler$get_profile_fn_$_profile_fn_inner = function (var_args){
var args = null;
if (arguments.length > 0) {
var G__183223__i = 0, G__183223__a = new Array(arguments.length -  0);
while (G__183223__i < G__183223__a.length) {G__183223__a[G__183223__i] = arguments[G__183223__i + 0]; ++G__183223__i;}
  args = new cljs.core.IndexedSeq(G__183223__a,0,null);
} 
return frontend$handler$profiler$get_profile_fn_$_profile_fn_inner__delegate.call(this,args);};
frontend$handler$profiler$get_profile_fn_$_profile_fn_inner.cljs$lang$maxFixedArity = 0;
frontend$handler$profiler$get_profile_fn_$_profile_fn_inner.cljs$lang$applyTo = (function (arglist__183224){
var args = cljs.core.seq(arglist__183224);
return frontend$handler$profiler$get_profile_fn_$_profile_fn_inner__delegate(args);
});
frontend$handler$profiler$get_profile_fn_$_profile_fn_inner.cljs$core$IFn$_invoke$arity$variadic = frontend$handler$profiler$get_profile_fn_$_profile_fn_inner__delegate;
return frontend$handler$profiler$get_profile_fn_$_profile_fn_inner;
})()
;
var arity_n_fns = new cljs.core.PersistentVector(null, 20, 5, cljs.core.PersistentVector.EMPTY_NODE, [(function (){
return cljs.core.apply.cljs$core$IFn$_invoke$arity$2(f,cljs.core.PersistentVector.EMPTY);
}),(function (x0){
return cljs.core.apply.cljs$core$IFn$_invoke$arity$2(f,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [x0], null));
}),(function (x0,x1){
return cljs.core.apply.cljs$core$IFn$_invoke$arity$2(f,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [x0,x1], null));
}),(function (x0,x1,x2){
return cljs.core.apply.cljs$core$IFn$_invoke$arity$2(f,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [x0,x1,x2], null));
}),(function (x0,x1,x2,x3){
return cljs.core.apply.cljs$core$IFn$_invoke$arity$2(f,new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [x0,x1,x2,x3], null));
}),(function (x0,x1,x2,x3,x4){
return cljs.core.apply.cljs$core$IFn$_invoke$arity$2(f,new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, [x0,x1,x2,x3,x4], null));
}),(function (x0,x1,x2,x3,x4,x5){
return cljs.core.apply.cljs$core$IFn$_invoke$arity$2(f,new cljs.core.PersistentVector(null, 6, 5, cljs.core.PersistentVector.EMPTY_NODE, [x0,x1,x2,x3,x4,x5], null));
}),(function (x0,x1,x2,x3,x4,x5,x6){
return cljs.core.apply.cljs$core$IFn$_invoke$arity$2(f,new cljs.core.PersistentVector(null, 7, 5, cljs.core.PersistentVector.EMPTY_NODE, [x0,x1,x2,x3,x4,x5,x6], null));
}),(function (x0,x1,x2,x3,x4,x5,x6,x7){
return cljs.core.apply.cljs$core$IFn$_invoke$arity$2(f,new cljs.core.PersistentVector(null, 8, 5, cljs.core.PersistentVector.EMPTY_NODE, [x0,x1,x2,x3,x4,x5,x6,x7], null));
}),(function (x0,x1,x2,x3,x4,x5,x6,x7,x8){
return cljs.core.apply.cljs$core$IFn$_invoke$arity$2(f,new cljs.core.PersistentVector(null, 9, 5, cljs.core.PersistentVector.EMPTY_NODE, [x0,x1,x2,x3,x4,x5,x6,x7,x8], null));
}),(function (x0,x1,x2,x3,x4,x5,x6,x7,x8,x9){
return cljs.core.apply.cljs$core$IFn$_invoke$arity$2(f,new cljs.core.PersistentVector(null, 10, 5, cljs.core.PersistentVector.EMPTY_NODE, [x0,x1,x2,x3,x4,x5,x6,x7,x8,x9], null));
}),(function (x0,x1,x2,x3,x4,x5,x6,x7,x8,x9,x10){
return cljs.core.apply.cljs$core$IFn$_invoke$arity$2(f,new cljs.core.PersistentVector(null, 11, 5, cljs.core.PersistentVector.EMPTY_NODE, [x0,x1,x2,x3,x4,x5,x6,x7,x8,x9,x10], null));
}),(function (x0,x1,x2,x3,x4,x5,x6,x7,x8,x9,x10,x11){
return cljs.core.apply.cljs$core$IFn$_invoke$arity$2(f,new cljs.core.PersistentVector(null, 12, 5, cljs.core.PersistentVector.EMPTY_NODE, [x0,x1,x2,x3,x4,x5,x6,x7,x8,x9,x10,x11], null));
}),(function (x0,x1,x2,x3,x4,x5,x6,x7,x8,x9,x10,x11,x12){
return cljs.core.apply.cljs$core$IFn$_invoke$arity$2(f,new cljs.core.PersistentVector(null, 13, 5, cljs.core.PersistentVector.EMPTY_NODE, [x0,x1,x2,x3,x4,x5,x6,x7,x8,x9,x10,x11,x12], null));
}),(function (x0,x1,x2,x3,x4,x5,x6,x7,x8,x9,x10,x11,x12,x13){
return cljs.core.apply.cljs$core$IFn$_invoke$arity$2(f,new cljs.core.PersistentVector(null, 14, 5, cljs.core.PersistentVector.EMPTY_NODE, [x0,x1,x2,x3,x4,x5,x6,x7,x8,x9,x10,x11,x12,x13], null));
}),(function (x0,x1,x2,x3,x4,x5,x6,x7,x8,x9,x10,x11,x12,x13,x14){
return cljs.core.apply.cljs$core$IFn$_invoke$arity$2(f,new cljs.core.PersistentVector(null, 15, 5, cljs.core.PersistentVector.EMPTY_NODE, [x0,x1,x2,x3,x4,x5,x6,x7,x8,x9,x10,x11,x12,x13,x14], null));
}),(function (x0,x1,x2,x3,x4,x5,x6,x7,x8,x9,x10,x11,x12,x13,x14,x15){
return cljs.core.apply.cljs$core$IFn$_invoke$arity$2(f,new cljs.core.PersistentVector(null, 16, 5, cljs.core.PersistentVector.EMPTY_NODE, [x0,x1,x2,x3,x4,x5,x6,x7,x8,x9,x10,x11,x12,x13,x14,x15], null));
}),(function (x0,x1,x2,x3,x4,x5,x6,x7,x8,x9,x10,x11,x12,x13,x14,x15,x16){
return cljs.core.apply.cljs$core$IFn$_invoke$arity$2(f,new cljs.core.PersistentVector(null, 17, 5, cljs.core.PersistentVector.EMPTY_NODE, [x0,x1,x2,x3,x4,x5,x6,x7,x8,x9,x10,x11,x12,x13,x14,x15,x16], null));
}),(function (x0,x1,x2,x3,x4,x5,x6,x7,x8,x9,x10,x11,x12,x13,x14,x15,x16,x17){
return cljs.core.apply.cljs$core$IFn$_invoke$arity$2(f,new cljs.core.PersistentVector(null, 18, 5, cljs.core.PersistentVector.EMPTY_NODE, [x0,x1,x2,x3,x4,x5,x6,x7,x8,x9,x10,x11,x12,x13,x14,x15,x16,x17], null));
}),(function (x0,x1,x2,x3,x4,x5,x6,x7,x8,x9,x10,x11,x12,x13,x14,x15,x16,x17,x18){
return cljs.core.apply.cljs$core$IFn$_invoke$arity$2(f,new cljs.core.PersistentVector(null, 19, 5, cljs.core.PersistentVector.EMPTY_NODE, [x0,x1,x2,x3,x4,x5,x6,x7,x8,x9,x10,x11,x12,x13,x14,x15,x16,x17,x18], null));
})], null);
var seq__183203_183225 = cljs.core.seq(arity_ns);
var chunk__183204_183226 = null;
var count__183205_183227 = (0);
var i__183206_183228 = (0);
while(true){
if((i__183206_183228 < count__183205_183227)){
var n_183229 = chunk__183204_183226.cljs$core$IIndexed$_nth$arity$2(null,i__183206_183228);
frontend.handler.profiler.goog$module$goog$object.set(f,["cljs$core$IFn$_invoke$arity$",cljs.core.str.cljs$core$IFn$_invoke$arity$1(n_183229)].join(''),cljs.core.nth.cljs$core$IFn$_invoke$arity$2(arity_n_fns,n_183229));


var G__183230 = seq__183203_183225;
var G__183231 = chunk__183204_183226;
var G__183232 = count__183205_183227;
var G__183233 = (i__183206_183228 + (1));
seq__183203_183225 = G__183230;
chunk__183204_183226 = G__183231;
count__183205_183227 = G__183232;
i__183206_183228 = G__183233;
continue;
} else {
var temp__5804__auto___183234 = cljs.core.seq(seq__183203_183225);
if(temp__5804__auto___183234){
var seq__183203_183235__$1 = temp__5804__auto___183234;
if(cljs.core.chunked_seq_QMARK_(seq__183203_183235__$1)){
var c__5525__auto___183236 = cljs.core.chunk_first(seq__183203_183235__$1);
var G__183237 = cljs.core.chunk_rest(seq__183203_183235__$1);
var G__183238 = c__5525__auto___183236;
var G__183239 = cljs.core.count(c__5525__auto___183236);
var G__183240 = (0);
seq__183203_183225 = G__183237;
chunk__183204_183226 = G__183238;
count__183205_183227 = G__183239;
i__183206_183228 = G__183240;
continue;
} else {
var n_183241 = cljs.core.first(seq__183203_183235__$1);
frontend.handler.profiler.goog$module$goog$object.set(f,["cljs$core$IFn$_invoke$arity$",cljs.core.str.cljs$core$IFn$_invoke$arity$1(n_183241)].join(''),cljs.core.nth.cljs$core$IFn$_invoke$arity$2(arity_n_fns,n_183241));


var G__183242 = cljs.core.next(seq__183203_183235__$1);
var G__183243 = null;
var G__183244 = (0);
var G__183245 = (0);
seq__183203_183225 = G__183242;
chunk__183204_183226 = G__183243;
count__183205_183227 = G__183244;
i__183206_183228 = G__183245;
continue;
}
} else {
}
}
break;
}

return f;
});
frontend.handler.profiler.replace_fn_helper_BANG_ = (function frontend$handler$profiler$replace_fn_helper_BANG_(ns,munged_name,fn_sym,original_fn_obj,custom_key_fn){
var ns_obj = cljs.core.find_ns_obj(ns);
var profile_fn = frontend.handler.profiler.get_profile_fn(fn_sym,original_fn_obj,custom_key_fn);
return frontend.handler.profiler.goog$module$goog$object.set(ns_obj,munged_name,profile_fn);
});
/**
 * (custom-key-fn args-seq result) return non-nil key
 */
frontend.handler.profiler.register_fn_BANG_ = (function frontend$handler$profiler$register_fn_BANG_(var_args){
var args__5732__auto__ = [];
var len__5726__auto___183246 = arguments.length;
var i__5727__auto___183247 = (0);
while(true){
if((i__5727__auto___183247 < len__5726__auto___183246)){
args__5732__auto__.push((arguments[i__5727__auto___183247]));

var G__183248 = (i__5727__auto___183247 + (1));
i__5727__auto___183247 = G__183248;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return frontend.handler.profiler.register_fn_BANG_.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(frontend.handler.profiler.register_fn_BANG_.cljs$core$IFn$_invoke$arity$variadic = (function (fn_sym,p__183209){
var map__183210 = p__183209;
var map__183210__$1 = cljs.core.__destructure_map(map__183210);
var _opts = map__183210__$1;
var custom_key_fn = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__183210__$1,new cljs.core.Keyword(null,"custom-key-fn","custom-key-fn",490609526));
if(cljs.core.qualified_symbol_QMARK_(fn_sym)){
} else {
throw (new Error("Assert failed: (qualified-symbol? fn-sym)"));
}

var ns = cljs.core.namespace(fn_sym);
var s = cljs.core.munge(cljs.core.name(fn_sym));
var temp__5802__auto__ = cljs.core.find_ns_obj([ns,".",cljs.core.str.cljs$core$IFn$_invoke$arity$1(s)].join(''));
if(cljs.core.truth_(temp__5802__auto__)){
var original_fn = temp__5802__auto__;
frontend.handler.profiler.replace_fn_helper_BANG_(ns,s,fn_sym,original_fn,custom_key_fn);

return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(frontend.handler.profiler._STAR_fn_symbol__GT_origin_fn,cljs.core.assoc,fn_sym,original_fn);
} else {
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2(["fn-sym not found: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(fn_sym)].join(''),cljs.core.PersistentArrayMap.EMPTY);
}
}));

(frontend.handler.profiler.register_fn_BANG_.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(frontend.handler.profiler.register_fn_BANG_.cljs$lang$applyTo = (function (seq183207){
var G__183208 = cljs.core.first(seq183207);
var seq183207__$1 = cljs.core.next(seq183207);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__183208,seq183207__$1);
}));

frontend.handler.profiler.unregister_fn_BANG_ = (function frontend$handler$profiler$unregister_fn_BANG_(fn_sym){
var ns = cljs.core.namespace(fn_sym);
var s = cljs.core.munge(cljs.core.name(fn_sym));
frontend.handler.profiler._STAR_fn_symbol__GT_key__GT_call_count.cljs$core$IVolatile$_vreset_BANG_$arity$2(null,cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(frontend.handler.profiler._STAR_fn_symbol__GT_key__GT_call_count.cljs$core$IDeref$_deref$arity$1(null),fn_sym));

frontend.handler.profiler._STAR_fn_symbol__GT_key__GT_time_sum.cljs$core$IVolatile$_vreset_BANG_$arity$2(null,cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(frontend.handler.profiler._STAR_fn_symbol__GT_key__GT_time_sum.cljs$core$IDeref$_deref$arity$1(null),fn_sym));

var temp__5804__auto__ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(frontend.handler.profiler._STAR_fn_symbol__GT_origin_fn),fn_sym);
if(cljs.core.truth_(temp__5804__auto__)){
var origin_fn = temp__5804__auto__;
var G__183211_183249 = cljs.core.find_ns_obj(ns);
if((G__183211_183249 == null)){
} else {
frontend.handler.profiler.goog$module$goog$object.set(G__183211_183249,s,origin_fn);
}

return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$3(frontend.handler.profiler._STAR_fn_symbol__GT_origin_fn,cljs.core.dissoc,fn_sym);
} else {
return null;
}
});
frontend.handler.profiler.reset_report_BANG_ = (function frontend$handler$profiler$reset_report_BANG_(){
cljs.core.vreset_BANG_(frontend.handler.profiler._STAR_fn_symbol__GT_key__GT_call_count,cljs.core.PersistentArrayMap.EMPTY);

return cljs.core.vreset_BANG_(frontend.handler.profiler._STAR_fn_symbol__GT_key__GT_time_sum,cljs.core.PersistentArrayMap.EMPTY);
});
frontend.handler.profiler.profile_report = (function frontend$handler$profiler$profile_report(){
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"call-count","call-count",-671299810),cljs.core.deref(frontend.handler.profiler._STAR_fn_symbol__GT_key__GT_call_count),new cljs.core.Keyword(null,"time-sum","time-sum",592043870),cljs.core.deref(frontend.handler.profiler._STAR_fn_symbol__GT_key__GT_time_sum)], null);
});
frontend.handler.profiler._STAR_ref_hash__GT_coll_size = cljs.core.volatile_BANG_(cljs.core.PersistentArrayMap.EMPTY);
frontend.handler.profiler._STAR_ref_hash__GT_watches_count = cljs.core.volatile_BANG_(cljs.core.PersistentArrayMap.EMPTY);
frontend.handler.profiler._STAR_ref_hash__GT_ref = cljs.core.volatile_BANG_(cljs.core.PersistentArrayMap.EMPTY);
/**
 * Add monitor on Atom/Volatile.
 *   Show atoms/volatiles contains huge collections.
 *   Show atoms have a huge number of watchers
 */
frontend.handler.profiler.mem_leak_detect = (function frontend$handler$profiler$mem_leak_detect(var_args){
var args__5732__auto__ = [];
var len__5726__auto___183250 = arguments.length;
var i__5727__auto___183251 = (0);
while(true){
if((i__5727__auto___183251 < len__5726__auto___183250)){
args__5732__auto__.push((arguments[i__5727__auto___183251]));

var G__183252 = (i__5727__auto___183251 + (1));
i__5727__auto___183251 = G__183252;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((0) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((0)),(0),null)):null);
return frontend.handler.profiler.mem_leak_detect.cljs$core$IFn$_invoke$arity$variadic(argseq__5733__auto__);
});

(frontend.handler.profiler.mem_leak_detect.cljs$core$IFn$_invoke$arity$variadic = (function (p__183213){
var map__183214 = p__183213;
var map__183214__$1 = cljs.core.__destructure_map(map__183214);
var data_count_threshold = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__183214__$1,new cljs.core.Keyword(null,"data-count-threshold","data-count-threshold",1042033322),(5000));
var watches_count_threshold = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__183214__$1,new cljs.core.Keyword(null,"watches-count-threshold","watches-count-threshold",54975064),(1000));
frontend.handler.profiler.register_fn_BANG_.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Symbol("cljs.core","reset!","cljs.core/reset!",657404621,null),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"custom-key-fn","custom-key-fn",490609526),(function (p__183215,newval){
var vec__183216 = p__183215;
var ref = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__183216,(0),null);
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__183216,(1),null);
var coll_size = (function (){var and__5000__auto__ = cljs.core.coll_QMARK_(newval);
if(and__5000__auto__){
return cljs.core.count(newval);
} else {
return and__5000__auto__;
}
})();
var _STAR_ref_hash = (new cljs.core.Delay((function (){
return cljs.core.hash(ref);
}),null));
if((coll_size > data_count_threshold)){
frontend.handler.profiler._STAR_ref_hash__GT_coll_size.cljs$core$IVolatile$_vreset_BANG_$arity$2(null,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(frontend.handler.profiler._STAR_ref_hash__GT_coll_size.cljs$core$IDeref$_deref$arity$1(null),cljs.core.deref(_STAR_ref_hash),coll_size));

frontend.handler.profiler._STAR_ref_hash__GT_ref.cljs$core$IVolatile$_vreset_BANG_$arity$2(null,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(frontend.handler.profiler._STAR_ref_hash__GT_ref.cljs$core$IDeref$_deref$arity$1(null),cljs.core.deref(_STAR_ref_hash),ref));
} else {
}

var watches_count = cljs.core.count(ref.watches);
if((watches_count > watches_count_threshold)){
frontend.handler.profiler._STAR_ref_hash__GT_watches_count.cljs$core$IVolatile$_vreset_BANG_$arity$2(null,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(frontend.handler.profiler._STAR_ref_hash__GT_watches_count.cljs$core$IDeref$_deref$arity$1(null),cljs.core.deref(_STAR_ref_hash),watches_count));

return frontend.handler.profiler._STAR_ref_hash__GT_ref.cljs$core$IVolatile$_vreset_BANG_$arity$2(null,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(frontend.handler.profiler._STAR_ref_hash__GT_ref.cljs$core$IDeref$_deref$arity$1(null),cljs.core.deref(_STAR_ref_hash),ref));
} else {
return null;
}
})], 0));

return frontend.handler.profiler.register_fn_BANG_.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Symbol("cljs.core","vreset!","cljs.core/vreset!",-1308835928,null),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"custom-key-fn","custom-key-fn",490609526),(function (p__183219,newval){
var vec__183220 = p__183219;
var ref = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__183220,(0),null);
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__183220,(1),null);
var coll_size = (function (){var and__5000__auto__ = cljs.core.coll_QMARK_(newval);
if(and__5000__auto__){
return cljs.core.count(newval);
} else {
return and__5000__auto__;
}
})();
var _STAR_ref_hash = (new cljs.core.Delay((function (){
return cljs.core.hash(ref);
}),null));
if((coll_size > data_count_threshold)){
frontend.handler.profiler._STAR_ref_hash__GT_coll_size.cljs$core$IVolatile$_vreset_BANG_$arity$2(null,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(frontend.handler.profiler._STAR_ref_hash__GT_coll_size.cljs$core$IDeref$_deref$arity$1(null),cljs.core.deref(_STAR_ref_hash),coll_size));

return frontend.handler.profiler._STAR_ref_hash__GT_ref.cljs$core$IVolatile$_vreset_BANG_$arity$2(null,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(frontend.handler.profiler._STAR_ref_hash__GT_ref.cljs$core$IDeref$_deref$arity$1(null),cljs.core.deref(_STAR_ref_hash),ref));
} else {
return null;
}
})], 0));
}));

(frontend.handler.profiler.mem_leak_detect.cljs$lang$maxFixedArity = (0));

/** @this {Function} */
(frontend.handler.profiler.mem_leak_detect.cljs$lang$applyTo = (function (seq183212){
var self__5712__auto__ = this;
return self__5712__auto__.cljs$core$IFn$_invoke$arity$variadic(cljs.core.seq(seq183212));
}));

frontend.handler.profiler.mem_leak_report = (function frontend$handler$profiler$mem_leak_report(){
return new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"ref-hash->coll-size","ref-hash->coll-size",710913013),cljs.core.deref(frontend.handler.profiler._STAR_ref_hash__GT_coll_size),new cljs.core.Keyword(null,"ref-hash->watches-count","ref-hash->watches-count",2011867615),cljs.core.deref(frontend.handler.profiler._STAR_ref_hash__GT_watches_count),new cljs.core.Keyword(null,"ref-hash->ref","ref-hash->ref",92453043),cljs.core.deref(frontend.handler.profiler._STAR_ref_hash__GT_ref)], null);
});

//# sourceMappingURL=frontend.handler.profiler.js.map
