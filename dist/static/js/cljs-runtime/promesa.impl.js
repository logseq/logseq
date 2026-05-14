goog.provide('promesa.impl');
/**
 * Return true if `v` is a promise instance.
 */
promesa.impl.promise_QMARK_ = (function promesa$impl$promise_QMARK_(v){
if((!((v == null)))){
if(((false) || ((cljs.core.PROTOCOL_SENTINEL === v.promesa$protocols$IPromise$)))){
return true;
} else {
if((!v.cljs$lang$protocol_mask$partition$)){
return cljs.core.native_satisfies_QMARK_(promesa.protocols.IPromise,v);
} else {
return false;
}
}
} else {
return cljs.core.native_satisfies_QMARK_(promesa.protocols.IPromise,v);
}
});
/**
 * Return true if `v` is a deferred instance.
 */
promesa.impl.deferred_QMARK_ = (function promesa$impl$deferred_QMARK_(v){
if((!((v == null)))){
if(((false) || ((cljs.core.PROTOCOL_SENTINEL === v.promesa$protocols$ICompletable$)))){
return true;
} else {
if((!v.cljs$lang$protocol_mask$partition$)){
return cljs.core.native_satisfies_QMARK_(promesa.protocols.ICompletable,v);
} else {
return false;
}
}
} else {
return cljs.core.native_satisfies_QMARK_(promesa.protocols.ICompletable,v);
}
});
promesa.impl.resolved = (function promesa$impl$resolved(v){
return promesa.impl.promise.resolved(v);
});
promesa.impl.rejected = (function promesa$impl$rejected(v){
return promesa.impl.promise.rejected(v);
});
/**
 * Coerce a thenable to built-in promise impl type.
 */
promesa.impl.coerce = (function promesa$impl$coerce(v){
return promesa.impl.promise.coerce(v);
});
promesa.impl.all = (function promesa$impl$all(promises){
return promesa.protocols._fmap(promesa.impl.promise.all(cljs.core.into_array.cljs$core$IFn$_invoke$arity$1(promises)),cljs.core.vec);
});
promesa.impl.race = (function promesa$impl$race(promises){
return promesa.impl.promise.race(cljs.core.into_array.cljs$core$IFn$_invoke$arity$1(cljs.core.map.cljs$core$IFn$_invoke$arity$2(promesa.protocols._promise,promises)));
});
promesa.impl.deferred = (function promesa$impl$deferred(){
return promesa.impl.promise.deferred();
});
promesa.impl.extend_promise_BANG_ = (function promesa$impl$extend_promise_BANG_(t){
(t.prototype.promesa$protocols$IPromiseFactory$ = cljs.core.PROTOCOL_SENTINEL);

return (t.prototype.promesa$protocols$IPromiseFactory$_promise$arity$1 = (function (p){
var p__$1 = this;
return promesa.impl.promise.coerce(p__$1);
}));
});
promesa.impl.extend_promise_BANG_(Promise);
promesa.impl.extend_promise_BANG_(promesa.impl.promise.PromiseImpl);
(promesa.impl.promise.PromiseImpl.prototype.promesa$protocols$IPromiseFactory$ = cljs.core.PROTOCOL_SENTINEL);

(promesa.impl.promise.PromiseImpl.prototype.promesa$protocols$IPromiseFactory$_promise$arity$1 = (function (p){
var p__$1 = this;
return p__$1;
}));

(promesa.impl.promise.PromiseImpl.prototype.promesa$protocols$IPromise$ = cljs.core.PROTOCOL_SENTINEL);

(promesa.impl.promise.PromiseImpl.prototype.promesa$protocols$IPromise$_fmap$arity$2 = (function (it,f){
var it__$1 = this;
return it__$1.fmap((function (p1__59402_SHARP_){
return (f.cljs$core$IFn$_invoke$arity$1 ? f.cljs$core$IFn$_invoke$arity$1(p1__59402_SHARP_) : f.call(null,p1__59402_SHARP_));
}));
}));

(promesa.impl.promise.PromiseImpl.prototype.promesa$protocols$IPromise$_fmap$arity$3 = (function (it,f,e){
var it__$1 = this;
return it__$1.fmap((function (p1__59403_SHARP_){
return (f.cljs$core$IFn$_invoke$arity$1 ? f.cljs$core$IFn$_invoke$arity$1(p1__59403_SHARP_) : f.call(null,p1__59403_SHARP_));
}));
}));

(promesa.impl.promise.PromiseImpl.prototype.promesa$protocols$IPromise$_mcat$arity$2 = (function (it,f){
var it__$1 = this;
return it__$1.fbind((function (p1__59404_SHARP_){
return (f.cljs$core$IFn$_invoke$arity$1 ? f.cljs$core$IFn$_invoke$arity$1(p1__59404_SHARP_) : f.call(null,p1__59404_SHARP_));
}));
}));

(promesa.impl.promise.PromiseImpl.prototype.promesa$protocols$IPromise$_mcat$arity$3 = (function (it,f,executor){
var it__$1 = this;
return it__$1.fbind((function (p1__59405_SHARP_){
return (f.cljs$core$IFn$_invoke$arity$1 ? f.cljs$core$IFn$_invoke$arity$1(p1__59405_SHARP_) : f.call(null,p1__59405_SHARP_));
}));
}));

(promesa.impl.promise.PromiseImpl.prototype.promesa$protocols$IPromise$_hmap$arity$2 = (function (it,f){
var it__$1 = this;
return it__$1.fmap((function (p1__59406_SHARP_){
return (f.cljs$core$IFn$_invoke$arity$2 ? f.cljs$core$IFn$_invoke$arity$2(p1__59406_SHARP_,null) : f.call(null,p1__59406_SHARP_,null));
}),(function (p1__59408_SHARP_){
return (f.cljs$core$IFn$_invoke$arity$2 ? f.cljs$core$IFn$_invoke$arity$2(null,p1__59408_SHARP_) : f.call(null,null,p1__59408_SHARP_));
}));
}));

(promesa.impl.promise.PromiseImpl.prototype.promesa$protocols$IPromise$_hmap$arity$3 = (function (it,f,e){
var it__$1 = this;
return it__$1.fmap((function (p1__59409_SHARP_){
return (f.cljs$core$IFn$_invoke$arity$2 ? f.cljs$core$IFn$_invoke$arity$2(p1__59409_SHARP_,null) : f.call(null,p1__59409_SHARP_,null));
}),(function (p1__59410_SHARP_){
return (f.cljs$core$IFn$_invoke$arity$2 ? f.cljs$core$IFn$_invoke$arity$2(null,p1__59410_SHARP_) : f.call(null,null,p1__59410_SHARP_));
}));
}));

(promesa.impl.promise.PromiseImpl.prototype.promesa$protocols$IPromise$_merr$arity$2 = (function (it,f){
var it__$1 = this;
return it__$1.fbind(promesa.protocols._promise,(function (p1__59411_SHARP_){
return (f.cljs$core$IFn$_invoke$arity$1 ? f.cljs$core$IFn$_invoke$arity$1(p1__59411_SHARP_) : f.call(null,p1__59411_SHARP_));
}));
}));

(promesa.impl.promise.PromiseImpl.prototype.promesa$protocols$IPromise$_merr$arity$3 = (function (it,f,e){
var it__$1 = this;
return it__$1.fbind(promesa.protocols._promise,(function (p1__59412_SHARP_){
return (f.cljs$core$IFn$_invoke$arity$1 ? f.cljs$core$IFn$_invoke$arity$1(p1__59412_SHARP_) : f.call(null,p1__59412_SHARP_));
}));
}));

(promesa.impl.promise.PromiseImpl.prototype.promesa$protocols$IPromise$_fnly$arity$2 = (function (it,f){
var it__$1 = this;
it__$1.handle(f);

return it__$1;
}));

(promesa.impl.promise.PromiseImpl.prototype.promesa$protocols$IPromise$_fnly$arity$3 = (function (it,f,executor){
var it__$1 = this;
it__$1.handle(f);

return it__$1;
}));

(promesa.impl.promise.PromiseImpl.prototype.promesa$protocols$IPromise$_then$arity$2 = (function (it,f){
var it__$1 = this;
return it__$1.then((function (p1__59413_SHARP_){
return (f.cljs$core$IFn$_invoke$arity$1 ? f.cljs$core$IFn$_invoke$arity$1(p1__59413_SHARP_) : f.call(null,p1__59413_SHARP_));
}));
}));

(promesa.impl.promise.PromiseImpl.prototype.promesa$protocols$IPromise$_then$arity$3 = (function (it,f,executor){
var it__$1 = this;
return it__$1.then((function (p1__59414_SHARP_){
return (f.cljs$core$IFn$_invoke$arity$1 ? f.cljs$core$IFn$_invoke$arity$1(p1__59414_SHARP_) : f.call(null,p1__59414_SHARP_));
}));
}));

(promesa.impl.promise.PromiseImpl.prototype.promesa$protocols$ICompletable$ = cljs.core.PROTOCOL_SENTINEL);

(promesa.impl.promise.PromiseImpl.prototype.promesa$protocols$ICompletable$_resolve_BANG_$arity$2 = (function (it,v){
var it__$1 = this;
return it__$1.resolve(v);
}));

(promesa.impl.promise.PromiseImpl.prototype.promesa$protocols$ICompletable$_reject_BANG_$arity$2 = (function (it,v){
var it__$1 = this;
return it__$1.reject(v);
}));

(promesa.impl.promise.PromiseImpl.prototype.promesa$protocols$ICancellable$ = cljs.core.PROTOCOL_SENTINEL);

(promesa.impl.promise.PromiseImpl.prototype.promesa$protocols$ICancellable$_cancel_BANG_$arity$1 = (function (it){
var it__$1 = this;
return it__$1.cancel();
}));

(promesa.impl.promise.PromiseImpl.prototype.promesa$protocols$ICancellable$_cancelled_QMARK_$arity$1 = (function (it){
var it__$1 = this;
return it__$1.isCancelled();
}));

(promesa.impl.promise.PromiseImpl.prototype.cljs$core$IDeref$ = cljs.core.PROTOCOL_SENTINEL);

(promesa.impl.promise.PromiseImpl.prototype.cljs$core$IDeref$_deref$arity$1 = (function (it){
var it__$1 = this;
var value = (it__$1["value"]);
if(cljs.core.truth_(it__$1.isRejected())){
throw value;
} else {
return value;
}
}));

(promesa.impl.promise.PromiseImpl.prototype.promesa$protocols$IState$ = cljs.core.PROTOCOL_SENTINEL);

(promesa.impl.promise.PromiseImpl.prototype.promesa$protocols$IState$_extract$arity$1 = (function (it){
var it__$1 = this;
return (it__$1["value"]);
}));

(promesa.impl.promise.PromiseImpl.prototype.promesa$protocols$IState$_extract$arity$2 = (function (it,default$){
var it__$1 = this;
if(cljs.core.truth_(it__$1.isPending())){
return default$;
} else {
return (it__$1["value"]);
}
}));

(promesa.impl.promise.PromiseImpl.prototype.promesa$protocols$IState$_resolved_QMARK_$arity$1 = (function (it){
var it__$1 = this;
return it__$1.isResolved();
}));

(promesa.impl.promise.PromiseImpl.prototype.promesa$protocols$IState$_rejected_QMARK_$arity$1 = (function (it){
var it__$1 = this;
return it__$1.isRejected();
}));

(promesa.impl.promise.PromiseImpl.prototype.promesa$protocols$IState$_pending_QMARK_$arity$1 = (function (it){
var it__$1 = this;
return it__$1.isPending();
}));
promesa.impl.unwrap = (function promesa$impl$unwrap(var_args){
var G__59448 = arguments.length;
switch (G__59448) {
case 1:
return promesa.impl.unwrap.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return promesa.impl.unwrap.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(promesa.impl.unwrap.cljs$core$IFn$_invoke$arity$1 = (function (v){
if(promesa.impl.promise_QMARK_(v)){
return promesa.protocols._mcat(v,promesa.impl.unwrap);
} else {
return promesa.protocols._promise(v);
}
}));

(promesa.impl.unwrap.cljs$core$IFn$_invoke$arity$2 = (function (v,executor){
if(promesa.impl.promise_QMARK_(v)){
return promesa.protocols._mcat(v,promesa.impl.unwrap,executor);
} else {
return promesa.protocols._promise(v);
}
}));

(promesa.impl.unwrap.cljs$lang$maxFixedArity = 2);

(Error.prototype.promesa$protocols$IPromiseFactory$ = cljs.core.PROTOCOL_SENTINEL);

(Error.prototype.promesa$protocols$IPromiseFactory$_promise$arity$1 = (function (e){
var e__$1 = this;
return promesa.impl.rejected(e__$1);
}));

(promesa.protocols.IPromiseFactory["_"] = true);

(promesa.protocols._promise["_"] = (function (v){
return promesa.impl.resolved(v);
}));
promesa.impl.promise__GT_str = (function promesa$impl$promise__GT_str(p){
return "#<js/Promise[~]>";
});
(Promise.prototype.cljs$core$IPrintWithWriter$ = cljs.core.PROTOCOL_SENTINEL);

(Promise.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = (function (p,writer,opts){
var p__$1 = this;
return cljs.core._write(writer,"#<js/Promise[~]>");
}));
(promesa.impl.promise.PromiseImpl.prototype.cljs$core$IPrintWithWriter$ = cljs.core.PROTOCOL_SENTINEL);

(promesa.impl.promise.PromiseImpl.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = (function (p,writer,opts){
var p__$1 = this;
return cljs.core._write(writer,["#<Promise[",(cljs.core.truth_(promesa.protocols._pending_QMARK_(p__$1))?"pending":(cljs.core.truth_(promesa.protocols._cancelled_QMARK_(p__$1))?"cancelled":(cljs.core.truth_(promesa.protocols._rejected_QMARK_(p__$1))?"rejected":"resolved"
))),":",cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.hash(p__$1)),"]>"].join(''));
}));

//# sourceMappingURL=promesa.impl.js.map
