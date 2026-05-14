goog.provide('sci.impl.interop');
goog.scope(function(){
  sci.impl.interop.goog$module$goog$object = goog.module.get('goog.object');
});
sci.impl.interop.invoke_instance_field = (function sci$impl$interop$invoke_instance_field(obj,_target_class,field_name){
return (obj[field_name]);
});
sci.impl.interop.invoke_instance_method = (function sci$impl$interop$invoke_instance_method(obj,_target_class,method_name,args){
var temp__5802__auto__ = (obj[method_name]);
if(cljs.core.truth_(temp__5802__auto__)){
var method = temp__5802__auto__;
return Reflect.apply(method,obj,cljs.core.into_array.cljs$core$IFn$_invoke$arity$1(args));
} else {
throw (new Error(["Could not find instance method: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(method_name)].join('')));
}
});
sci.impl.interop.get_static_field = (function sci$impl$interop$get_static_field(p__85403){
var vec__85406 = p__85403;
var class$ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__85406,(0),null);
var field_name_sym = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__85406,(1),null);
if(clojure.string.includes_QMARK_(cljs.core.str.cljs$core$IFn$_invoke$arity$1(field_name_sym),".")){
return cljs.core.apply.cljs$core$IFn$_invoke$arity$3(sci.impl.interop.goog$module$goog$object.getValueByKeys,class$,clojure.string.split.cljs$core$IFn$_invoke$arity$2(cljs.core.str.cljs$core$IFn$_invoke$arity$1(field_name_sym),/\./));
} else {
return sci.impl.interop.goog$module$goog$object.get(class$,field_name_sym);
}
});
sci.impl.interop.invoke_js_constructor = (function sci$impl$interop$invoke_js_constructor(constructor$,args){
return Reflect.construct(constructor$,cljs.core.into_array.cljs$core$IFn$_invoke$arity$1(args));
});
sci.impl.interop.invoke_constructor = (function sci$impl$interop$invoke_constructor(constructor$,args){
return sci.impl.interop.invoke_js_constructor(constructor$,args);
});
sci.impl.interop.invoke_static_method = (function sci$impl$interop$invoke_static_method(p__85410,args){
var vec__85411 = p__85410;
var class$ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__85411,(0),null);
var method_name = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__85411,(1),null);
var temp__5802__auto__ = sci.impl.interop.goog$module$goog$object.get(class$,method_name);
if(cljs.core.truth_(temp__5802__auto__)){
var method = temp__5802__auto__;
return Reflect.apply(method,class$,cljs.core.into_array.cljs$core$IFn$_invoke$arity$1(args));
} else {
var method_name__$1 = cljs.core.str.cljs$core$IFn$_invoke$arity$1(method_name);
var field = sci.impl.interop.get_static_field(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [class$,method_name__$1], null));
if(cljs.core.not(field)){
throw (new Error(["Could not find static method ",method_name__$1].join('')));
} else {
if(clojure.string.ends_with_QMARK_(method_name__$1,".")){
return sci.impl.interop.invoke_js_constructor(field,args);
} else {
return cljs.core.apply.cljs$core$IFn$_invoke$arity$2(field,args);

}
}
}
});
sci.impl.interop.fully_qualify_class = (function sci$impl$interop$fully_qualify_class(p__85414,sym){
var map__85415 = p__85414;
var map__85415__$1 = cljs.core.__destructure_map(map__85415);
var env = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__85415__$1,new cljs.core.Keyword(null,"env","env",-1815813235));
var class__GT_opts = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__85415__$1,new cljs.core.Keyword(null,"class->opts","class->opts",2061906477));
var or__5002__auto__ = (function (){var temp__5802__auto__ = cljs.core.namespace(sym);
if(cljs.core.truth_(temp__5802__auto__)){
var ns_STAR_ = temp__5802__auto__;
if(("js" === ns_STAR_)){
if(cljs.core.contains_QMARK_(class__GT_opts,cljs.core.symbol.cljs$core$IFn$_invoke$arity$1(cljs.core.name(sym)))){
return sym;
} else {
return null;
}
} else {
return null;
}
} else {
if(cljs.core.contains_QMARK_(class__GT_opts,sym)){
return sym;
} else {
return null;
}
}
})();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var env__$1 = cljs.core.deref(env);
var or__5002__auto____$1 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"imports","imports",-1249933394).cljs$core$IFn$_invoke$arity$1(env__$1),sym);
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
var cnn = sci.impl.vars.current_ns_name();
return cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(env__$1,new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"namespaces","namespaces",-1444157469),cnn,new cljs.core.Keyword(null,"imports","imports",-1249933394),sym], null));
}
}
});
sci.impl.interop.resolve_class_opts = (function sci$impl$interop$resolve_class_opts(p__85416,sym){
var map__85417 = p__85416;
var map__85417__$1 = cljs.core.__destructure_map(map__85417);
var env = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__85417__$1,new cljs.core.Keyword(null,"env","env",-1815813235));
var class__GT_opts = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__85417__$1,new cljs.core.Keyword(null,"class->opts","class->opts",2061906477));
var class_opts = (function (){var or__5002__auto__ = (function (){var temp__5802__auto__ = cljs.core.namespace(sym);
if(cljs.core.truth_(temp__5802__auto__)){
var ns_STAR_ = temp__5802__auto__;
if(("js" === ns_STAR_)){
return cljs.core.get.cljs$core$IFn$_invoke$arity$2(class__GT_opts,cljs.core.symbol.cljs$core$IFn$_invoke$arity$1(cljs.core.name(sym)));
} else {
return null;
}
} else {
return cljs.core.get.cljs$core$IFn$_invoke$arity$2(class__GT_opts,sym);
}
})();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var env__$1 = cljs.core.deref(env);
var cnn = sci.impl.vars.current_ns_name();
var imports = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(env__$1,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"namespaces","namespaces",-1444157469),cnn,new cljs.core.Keyword(null,"imports","imports",-1249933394)], null));
var temp__5802__auto__ = cljs.core.find(imports,sym);
if(cljs.core.truth_(temp__5802__auto__)){
var vec__85418 = temp__5802__auto__;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__85418,(0),null);
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__85418,(1),null);
return cljs.core.get.cljs$core$IFn$_invoke$arity$2(class__GT_opts,v);
} else {
var temp__5804__auto__ = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(env__$1,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"imports","imports",-1249933394),sym], null));
if(cljs.core.truth_(temp__5804__auto__)){
var v = temp__5804__auto__;
return cljs.core.get.cljs$core$IFn$_invoke$arity$2(class__GT_opts,v);
} else {
return null;
}
}
}
})();
return class_opts;
});
sci.impl.interop.resolve_class = (function sci$impl$interop$resolve_class(ctx,sym){
return new cljs.core.Keyword(null,"class","class",-2030961996).cljs$core$IFn$_invoke$arity$1(sci.impl.interop.resolve_class_opts(ctx,sym));
});

//# sourceMappingURL=sci.impl.interop.js.map
