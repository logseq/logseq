goog.provide('promesa.util');
/**
 * Create a handler, mainly for combine two separate functions
 *   into a single callbale.
 */
promesa.util.handler = (function promesa$util$handler(fv,fc){
return (function (v,c){
if(cljs.core.truth_(c)){
return (fc.cljs$core$IFn$_invoke$arity$1 ? fc.cljs$core$IFn$_invoke$arity$1(c) : fc.call(null,c));
} else {
return (fv.cljs$core$IFn$_invoke$arity$1 ? fv.cljs$core$IFn$_invoke$arity$1(v) : fv.call(null,v));
}
});
});
promesa.util.has_method_QMARK_ = (function promesa$util$has_method_QMARK_(klass,name){
var methods$ = cljs.core.into.cljs$core$IFn$_invoke$arity$3(cljs.core.PersistentHashSet.EMPTY,cljs.core.map.cljs$core$IFn$_invoke$arity$1((function (method){
return method.getName();
})),klass.getDeclaredMethods());
return cljs.core.contains_QMARK_(methods$,name);
});
promesa.util.maybe_deref = (function promesa$util$maybe_deref(o){
if(cljs.core.delay_QMARK_(o)){
return cljs.core.deref(o);
} else {
return o;
}
});

/**
* @constructor
 * @implements {promesa.protocols.ILock}
 * @implements {cljs.core.IMeta}
 * @implements {cljs.core.IWithMeta}
*/
promesa.util.t_promesa$util59087 = (function (meta59088){
this.meta59088 = meta59088;
this.cljs$lang$protocol_mask$partition0$ = 393216;
this.cljs$lang$protocol_mask$partition1$ = 0;
});
(promesa.util.t_promesa$util59087.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = (function (_59089,meta59088__$1){
var self__ = this;
var _59089__$1 = this;
return (new promesa.util.t_promesa$util59087(meta59088__$1));
}));

(promesa.util.t_promesa$util59087.prototype.cljs$core$IMeta$_meta$arity$1 = (function (_59089){
var self__ = this;
var _59089__$1 = this;
return self__.meta59088;
}));

(promesa.util.t_promesa$util59087.prototype.promesa$protocols$ILock$ = cljs.core.PROTOCOL_SENTINEL);

(promesa.util.t_promesa$util59087.prototype.promesa$protocols$ILock$_lock_BANG_$arity$1 = (function (_){
var self__ = this;
var ___$1 = this;
return null;
}));

(promesa.util.t_promesa$util59087.prototype.promesa$protocols$ILock$_unlock_BANG_$arity$1 = (function (_){
var self__ = this;
var ___$1 = this;
return null;
}));

(promesa.util.t_promesa$util59087.getBasis = (function (){
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"meta59088","meta59088",-1984653186,null)], null);
}));

(promesa.util.t_promesa$util59087.cljs$lang$type = true);

(promesa.util.t_promesa$util59087.cljs$lang$ctorStr = "promesa.util/t_promesa$util59087");

(promesa.util.t_promesa$util59087.cljs$lang$ctorPrWriter = (function (this__5287__auto__,writer__5288__auto__,opt__5289__auto__){
return cljs.core._write(writer__5288__auto__,"promesa.util/t_promesa$util59087");
}));

/**
 * Positional factory function for promesa.util/t_promesa$util59087.
 */
promesa.util.__GT_t_promesa$util59087 = (function promesa$util$__GT_t_promesa$util59087(meta59088){
return (new promesa.util.t_promesa$util59087(meta59088));
});


promesa.util.mutex = (function promesa$util$mutex(){
return (new promesa.util.t_promesa$util59087(cljs.core.PersistentArrayMap.EMPTY));
});
promesa.util.try_STAR_ = (function promesa$util$try_STAR_(f,on_error){
try{return (f.cljs$core$IFn$_invoke$arity$0 ? f.cljs$core$IFn$_invoke$arity$0() : f.call(null));
}catch (e59110){var e = e59110;
return (on_error.cljs$core$IFn$_invoke$arity$1 ? on_error.cljs$core$IFn$_invoke$arity$1(e) : on_error.call(null,e));
}});

//# sourceMappingURL=promesa.util.js.map
