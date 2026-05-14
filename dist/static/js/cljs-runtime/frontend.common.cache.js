goog.provide('frontend.common.cache');
/**
 * Return a cached version of `f`.
 *   cache-key&f-args-fn: return [<cache-key> <args-list-to-f>]
 */
frontend.common.cache.cache_fn = (function frontend$common$cache$cache_fn(_STAR_cache,cache_key_AMPERSAND_f_args_fn,f){
return (function() { 
var G__69636__delegate = function (args){
var vec__69631 = cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cache_key_AMPERSAND_f_args_fn,args);
var cache_k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__69631,(0),null);
var f_args = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__69631,(1),null);
var through_value_fn = (function (){
return cljs.core.apply.cljs$core$IFn$_invoke$arity$2(f,f_args);
});
var cache = cljs.core.vreset_BANG_(_STAR_cache,cljs.cache.through.cljs$core$IFn$_invoke$arity$3(through_value_fn,cljs.core.deref(_STAR_cache),cache_k));
return cljs.cache.lookup(cache,cache_k);
};
var G__69636 = function (var_args){
var args = null;
if (arguments.length > 0) {
var G__69637__i = 0, G__69637__a = new Array(arguments.length -  0);
while (G__69637__i < G__69637__a.length) {G__69637__a[G__69637__i] = arguments[G__69637__i + 0]; ++G__69637__i;}
  args = new cljs.core.IndexedSeq(G__69637__a,0,null);
} 
return G__69636__delegate.call(this,args);};
G__69636.cljs$lang$maxFixedArity = 0;
G__69636.cljs$lang$applyTo = (function (arglist__69638){
var args = cljs.core.seq(arglist__69638);
return G__69636__delegate(args);
});
G__69636.cljs$core$IFn$_invoke$arity$variadic = G__69636__delegate;
return G__69636;
})()
;
});

//# sourceMappingURL=frontend.common.cache.js.map
