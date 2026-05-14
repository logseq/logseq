goog.provide('cljs.core.async.interop');
/**
 * EXPERIMENTAL: Puts the promise resolution into a promise-chan and returns it.
 * The value of a rejected promise will be wrapped in a instance of
 * ExceptionInfo, acessible via ex-cause.
 */
cljs.core.async.interop.p__GT_c = (function cljs$core$async$interop$p__GT_c(p){
var c = cljs.core.async.promise_chan.cljs$core$IFn$_invoke$arity$0();
p.then((function (res){
if((res == null)){
return cljs.core.async.close_BANG_(c);
} else {
return cljs.core.async.put_BANG_.cljs$core$IFn$_invoke$arity$2(c,res);
}
}),(function (err){
return cljs.core.async.put_BANG_.cljs$core$IFn$_invoke$arity$2(c,cljs.core.ex_info.cljs$core$IFn$_invoke$arity$3("Promise error",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"error","error",-978969032),new cljs.core.Keyword(null,"promise-error","promise-error",-90673560)], null),err));
}));

return c;
});

//# sourceMappingURL=cljs.core.async.interop.js.map
