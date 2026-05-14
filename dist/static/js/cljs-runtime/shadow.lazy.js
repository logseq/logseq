goog.provide('shadow.lazy');
goog.scope(function(){
  shadow.lazy.goog$module$goog$object = goog.module.get('goog.object');
  shadow.lazy.goog$module$shadow$loader = goog.module.get('shadow.loader');
});

/**
 * @interface
 */
shadow.lazy.ILoadable = function(){};

var shadow$lazy$ILoadable$ready_QMARK_$dyn_101093 = (function (x){
var x__5350__auto__ = (((x == null))?null:x);
var m__5351__auto__ = (shadow.lazy.ready_QMARK_[goog.typeOf(x__5350__auto__)]);
if((!((m__5351__auto__ == null)))){
return (m__5351__auto__.cljs$core$IFn$_invoke$arity$1 ? m__5351__auto__.cljs$core$IFn$_invoke$arity$1(x) : m__5351__auto__.call(null,x));
} else {
var m__5349__auto__ = (shadow.lazy.ready_QMARK_["_"]);
if((!((m__5349__auto__ == null)))){
return (m__5349__auto__.cljs$core$IFn$_invoke$arity$1 ? m__5349__auto__.cljs$core$IFn$_invoke$arity$1(x) : m__5349__auto__.call(null,x));
} else {
throw cljs.core.missing_protocol("ILoadable.ready?",x);
}
}
});
shadow.lazy.ready_QMARK_ = (function shadow$lazy$ready_QMARK_(x){
if((((!((x == null)))) && ((!((x.shadow$lazy$ILoadable$ready_QMARK_$arity$1 == null)))))){
return x.shadow$lazy$ILoadable$ready_QMARK_$arity$1(x);
} else {
return shadow$lazy$ILoadable$ready_QMARK_$dyn_101093(x);
}
});


/**
* @constructor
 * @implements {shadow.lazy.ILoadable}
 * @implements {cljs.core.IDeref}
*/
shadow.lazy.Loadable = (function (modules,deref_fn){
this.modules = modules;
this.deref_fn = deref_fn;
this.cljs$lang$protocol_mask$partition0$ = 32768;
this.cljs$lang$protocol_mask$partition1$ = 0;
});
(shadow.lazy.Loadable.prototype.shadow$lazy$ILoadable$ = cljs.core.PROTOCOL_SENTINEL);

(shadow.lazy.Loadable.prototype.shadow$lazy$ILoadable$ready_QMARK_$arity$1 = (function (this$){
var self__ = this;
var this$__$1 = this;
return cljs.core.every_QMARK_(shadow.lazy.goog$module$shadow$loader.loaded_QMARK_,self__.modules);
}));

(shadow.lazy.Loadable.prototype.cljs$core$IDeref$_deref$arity$1 = (function (this$){
var self__ = this;
var this$__$1 = this;
if(cljs.core.truth_(this$__$1.shadow$lazy$ILoadable$ready_QMARK_$arity$1(null))){
} else {
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2("loadable not ready yet",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"modules","modules",-248193976),self__.modules], null));
}

return (self__.deref_fn.cljs$core$IFn$_invoke$arity$0 ? self__.deref_fn.cljs$core$IFn$_invoke$arity$0() : self__.deref_fn.call(null));
}));

(shadow.lazy.Loadable.getBasis = (function (){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"modules","modules",1392337551,null),new cljs.core.Symbol(null,"deref-fn","deref-fn",-1070945319,null)], null);
}));

(shadow.lazy.Loadable.cljs$lang$type = true);

(shadow.lazy.Loadable.cljs$lang$ctorStr = "shadow.lazy/Loadable");

(shadow.lazy.Loadable.cljs$lang$ctorPrWriter = (function (this__5287__auto__,writer__5288__auto__,opt__5289__auto__){
return cljs.core._write(writer__5288__auto__,"shadow.lazy/Loadable");
}));

/**
 * Positional factory function for shadow.lazy/Loadable.
 */
shadow.lazy.__GT_Loadable = (function shadow$lazy$__GT_Loadable(modules,deref_fn){
return (new shadow.lazy.Loadable(modules,deref_fn));
});

shadow.lazy.loadable = (function shadow$lazy$loadable(thing){
return null;
});
shadow.lazy.load = (function shadow$lazy$load(var_args){
var G__101012 = arguments.length;
switch (G__101012) {
case 1:
return shadow.lazy.load.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return shadow.lazy.load.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return shadow.lazy.load.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(shadow.lazy.load.cljs$core$IFn$_invoke$arity$1 = (function (the_loadable){
if((the_loadable instanceof shadow.lazy.Loadable)){
} else {
throw (new Error("Assert failed: (instance? Loadable the-loadable)"));
}

var all_mods = the_loadable.modules;
var loading_map = shadow.lazy.goog$module$shadow$loader.load_multiple(cljs.core.into_array.cljs$core$IFn$_invoke$arity$2(cljs.core.map.cljs$core$IFn$_invoke$arity$1(cljs.core.name),all_mods));
var combined = (new goog.async.Deferred());
var callback_fn = the_loadable.deref_fn;
var err_fn = (function (err){
return combined.errback(err);
});
var success_fn = (function (){
if(cljs.core.truth_(the_loadable.shadow$lazy$ILoadable$ready_QMARK_$arity$1(null))){
return combined.callback((callback_fn.cljs$core$IFn$_invoke$arity$0 ? callback_fn.cljs$core$IFn$_invoke$arity$0() : callback_fn.call(null)));
} else {
return null;
}
});
var seq__101018_101125 = cljs.core.seq(all_mods);
var chunk__101019_101126 = null;
var count__101020_101127 = (0);
var i__101021_101128 = (0);
while(true){
if((i__101021_101128 < count__101020_101127)){
var mod_101130 = chunk__101019_101126.cljs$core$IIndexed$_nth$arity$2(null,i__101021_101128);
var mod_deferred_101131 = shadow.lazy.goog$module$goog$object.get(loading_map,cljs.core.name(mod_101130));
mod_deferred_101131.addCallbacks(success_fn,err_fn);


var G__101134 = seq__101018_101125;
var G__101135 = chunk__101019_101126;
var G__101136 = count__101020_101127;
var G__101137 = (i__101021_101128 + (1));
seq__101018_101125 = G__101134;
chunk__101019_101126 = G__101135;
count__101020_101127 = G__101136;
i__101021_101128 = G__101137;
continue;
} else {
var temp__5804__auto___101138 = cljs.core.seq(seq__101018_101125);
if(temp__5804__auto___101138){
var seq__101018_101139__$1 = temp__5804__auto___101138;
if(cljs.core.chunked_seq_QMARK_(seq__101018_101139__$1)){
var c__5525__auto___101140 = cljs.core.chunk_first(seq__101018_101139__$1);
var G__101141 = cljs.core.chunk_rest(seq__101018_101139__$1);
var G__101142 = c__5525__auto___101140;
var G__101143 = cljs.core.count(c__5525__auto___101140);
var G__101144 = (0);
seq__101018_101125 = G__101141;
chunk__101019_101126 = G__101142;
count__101020_101127 = G__101143;
i__101021_101128 = G__101144;
continue;
} else {
var mod_101145 = cljs.core.first(seq__101018_101139__$1);
var mod_deferred_101146 = shadow.lazy.goog$module$goog$object.get(loading_map,cljs.core.name(mod_101145));
mod_deferred_101146.addCallbacks(success_fn,err_fn);


var G__101147 = cljs.core.next(seq__101018_101139__$1);
var G__101148 = null;
var G__101149 = (0);
var G__101150 = (0);
seq__101018_101125 = G__101147;
chunk__101019_101126 = G__101148;
count__101020_101127 = G__101149;
i__101021_101128 = G__101150;
continue;
}
} else {
}
}
break;
}

return combined;
}));

(shadow.lazy.load.cljs$core$IFn$_invoke$arity$2 = (function (the_loadable,call_fn){
return shadow.lazy.load.cljs$core$IFn$_invoke$arity$1(the_loadable).then(call_fn);
}));

(shadow.lazy.load.cljs$core$IFn$_invoke$arity$3 = (function (the_loadable,call_fn,err_fn){
return shadow.lazy.load.cljs$core$IFn$_invoke$arity$1(the_loadable).then(call_fn,err_fn);
}));

(shadow.lazy.load.cljs$lang$maxFixedArity = 3);


//# sourceMappingURL=shadow.lazy.js.map
