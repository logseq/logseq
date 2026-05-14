goog.provide('sci.impl.opts');
sci.impl.opts.init_env_BANG_ = (function sci$impl$opts$init_env_BANG_(env,bindings,aliases,namespaces,imports,load_fn){
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$2(env,(function (env__$1){
var env_nss = new cljs.core.Keyword(null,"namespaces","namespaces",-1444157469).cljs$core$IFn$_invoke$arity$1(env__$1);
var namespaces__$1 = cljs.core.merge_with.cljs$core$IFn$_invoke$arity$variadic(cljs.core.merge,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([(function (){var or__5002__auto__ = env_nss;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return sci.impl.namespaces.namespaces;
}
})(),(cljs.core.truth_(env_nss)?null:new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Symbol(null,"user","user",-1122004413,null),cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(bindings,new cljs.core.Keyword(null,"obj","obj",981763962),sci.impl.vars.user_ns)], null)),namespaces], 0));
var aliases__$1 = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([sci.impl.namespaces.aliases,aliases,cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(env__$1,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"namespaces","namespaces",-1444157469),new cljs.core.Symbol(null,"user","user",-1122004413,null),new cljs.core.Keyword(null,"aliases","aliases",1346874714)], null))], 0));
var namespaces__$2 = cljs.core.update.cljs$core$IFn$_invoke$arity$5(cljs.core.update.cljs$core$IFn$_invoke$arity$5(namespaces__$1,new cljs.core.Symbol(null,"user","user",-1122004413,null),cljs.core.assoc,new cljs.core.Keyword(null,"aliases","aliases",1346874714),aliases__$1),new cljs.core.Symbol(null,"clojure.core","clojure.core",-189332625,null),cljs.core.assoc,new cljs.core.Symbol(null,"global-hierarchy","global-hierarchy",-2014004345,null),sci.impl.vars.__GT_SciVar(cljs.core.make_hierarchy(),new cljs.core.Symbol(null,"global-hierarchy","global-hierarchy",-2014004345,null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"ns","ns",441598760),sci.impl.vars.clojure_core_ns], null),false));
var imports__$1 = (function (){var temp__5802__auto__ = new cljs.core.Keyword(null,"imports","imports",-1249933394).cljs$core$IFn$_invoke$arity$1(env__$1);
if(cljs.core.truth_(temp__5802__auto__)){
var env_imports = temp__5802__auto__;
return cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([env_imports,imports], 0));
} else {
return imports;
}
})();
if(cljs.core.not(env__$1)){
return new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"namespaces","namespaces",-1444157469),namespaces__$2,new cljs.core.Keyword(null,"imports","imports",-1249933394),imports__$1,new cljs.core.Keyword(null,"load-fn","load-fn",-2121144334),load_fn], null);
} else {
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(env__$1,new cljs.core.Keyword(null,"namespaces","namespaces",-1444157469),namespaces__$2,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"imports","imports",-1249933394),imports__$1,new cljs.core.Keyword(null,"load-fn","load-fn",-2121144334),load_fn], 0));
}
}));
});
sci.impl.opts.process_permissions = (function sci$impl$opts$process_permissions(var_args){
var args__5732__auto__ = [];
var len__5726__auto___96812 = arguments.length;
var i__5727__auto___96813 = (0);
while(true){
if((i__5727__auto___96813 < len__5726__auto___96812)){
args__5732__auto__.push((arguments[i__5727__auto___96813]));

var G__96814 = (i__5727__auto___96813 + (1));
i__5727__auto___96813 = G__96814;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return sci.impl.opts.process_permissions.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(sci.impl.opts.process_permissions.cljs$core$IFn$_invoke$arity$variadic = (function (prev_perms,permissions){
return cljs.core.not_empty(cljs.core.into.cljs$core$IFn$_invoke$arity$3(prev_perms,cljs.core.comp.cljs$core$IFn$_invoke$arity$2(cljs.core.cat,cljs.core.map.cljs$core$IFn$_invoke$arity$1(sci.impl.utils.strip_core_ns)),permissions));
}));

(sci.impl.opts.process_permissions.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(sci.impl.opts.process_permissions.cljs$lang$applyTo = (function (seq96760){
var G__96761 = cljs.core.first(seq96760);
var seq96760__$1 = cljs.core.next(seq96760);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__96761,seq96760__$1);
}));

sci.impl.opts.default_classes = new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Symbol(null,"Error","Error",-1692662047,null),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"class","class",-2030961996),Error,new cljs.core.Keyword(null,"constructor","constructor",-1953928811),(function() {
var G__96815 = null;
var G__96815__1 = (function (msg){
return (new Error(msg));
});
var G__96815__2 = (function (msg,filename){
return (new Error(msg,filename));
});
var G__96815__3 = (function (msg,filename,line){
return (new Error(msg,filename,line));
});
G__96815 = function(msg,filename,line){
switch(arguments.length){
case 1:
return G__96815__1.call(this,msg);
case 2:
return G__96815__2.call(this,msg,filename);
case 3:
return G__96815__3.call(this,msg,filename,line);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
G__96815.cljs$core$IFn$_invoke$arity$1 = G__96815__1;
G__96815.cljs$core$IFn$_invoke$arity$2 = G__96815__2;
G__96815.cljs$core$IFn$_invoke$arity$3 = G__96815__3;
return G__96815;
})()
], null),new cljs.core.Symbol(null,"cljs.core.Delay","cljs.core.Delay",-1917476777,null),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"class","class",-2030961996),cljs.core.Delay,new cljs.core.Keyword(null,"constructor","constructor",-1953928811),(function (p1__96778_SHARP_){
return (new cljs.core.Delay(p1__96778_SHARP_,null));
})], null),new cljs.core.Symbol(null,"goog.string.StringBuffer","goog.string.StringBuffer",-1220229842,null),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"class","class",-2030961996),goog.string.StringBuffer,new cljs.core.Keyword(null,"constructor","constructor",-1953928811),(function (p1__96779_SHARP_){
return (new goog.string.StringBuffer(p1__96779_SHARP_));
})], null)], null);
sci.impl.opts.default_imports = cljs.core.PersistentArrayMap.EMPTY;
sci.impl.opts.normalize_classes = (function sci$impl$opts$normalize_classes(classes){
var class__GT_opts = cljs.core.transient$(cljs.core.select_keys(classes,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"allow","allow",-1857325745)], null)));
var kvs = classes;
while(true){
var temp__5802__auto__ = cljs.core.first(kvs);
if(cljs.core.truth_(temp__5802__auto__)){
var vec__96786 = temp__5802__auto__;
var sym = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__96786,(0),null);
var class_opts = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__96786,(1),null);
var G__96821 = cljs.core.assoc_BANG_.cljs$core$IFn$_invoke$arity$3(class__GT_opts,sym,((cljs.core.map_QMARK_(class_opts))?class_opts:new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),class_opts], null)));
var G__96822 = cljs.core.rest(kvs);
class__GT_opts = G__96821;
kvs = G__96822;
continue;
} else {
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"public-class","public-class",1127293019),new cljs.core.Keyword(null,"public-class","public-class",1127293019).cljs$core$IFn$_invoke$arity$1(classes),new cljs.core.Keyword(null,"class->opts","class->opts",2061906477),cljs.core.persistent_BANG_(class__GT_opts)], null);
}
break;
}
});
sci.impl.opts.default_reify_fn = (function sci$impl$opts$default_reify_fn(_,___$1,___$2){
return null;
});
sci.impl.opts.__GT_ctx = (function sci$impl$opts$__GT_ctx(bindings,env,features,readers,check_permissions_QMARK_){
return new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"bindings","bindings",1271397192),bindings,new cljs.core.Keyword(null,"env","env",-1815813235),env,new cljs.core.Keyword(null,"features","features",-1146962336),features,new cljs.core.Keyword(null,"readers","readers",-2118263030),readers,new cljs.core.Keyword(null,"check-permissions","check-permissions",669054317),check_permissions_QMARK_], null);
});
/**
 * Initializes options
 */
sci.impl.opts.init = (function sci$impl$opts$init(p__96799){
var map__96801 = p__96799;
var map__96801__$1 = cljs.core.__destructure_map(map__96801);
var features = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__96801__$1,new cljs.core.Keyword(null,"features","features",-1146962336));
var namespaces = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__96801__$1,new cljs.core.Keyword(null,"namespaces","namespaces",-1444157469));
var bindings = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__96801__$1,new cljs.core.Keyword(null,"bindings","bindings",1271397192));
var readers = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__96801__$1,new cljs.core.Keyword(null,"readers","readers",-2118263030));
var reify_fn = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__96801__$1,new cljs.core.Keyword(null,"reify-fn","reify-fn",-1360983316));
var env = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__96801__$1,new cljs.core.Keyword(null,"env","env",-1815813235));
var imports = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__96801__$1,new cljs.core.Keyword(null,"imports","imports",-1249933394));
var allow = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__96801__$1,new cljs.core.Keyword(null,"allow","allow",-1857325745));
var load_fn = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__96801__$1,new cljs.core.Keyword(null,"load-fn","load-fn",-2121144334));
var aliases = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__96801__$1,new cljs.core.Keyword(null,"aliases","aliases",1346874714));
var deny = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__96801__$1,new cljs.core.Keyword(null,"deny","deny",1589338523));
var proxy_fn = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__96801__$1,new cljs.core.Keyword(null,"proxy-fn","proxy-fn",1116677438));
var classes = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__96801__$1,new cljs.core.Keyword(null,"classes","classes",2037804510));
var env__$1 = (function (){var or__5002__auto__ = env;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
}
})();
var imports__$1 = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([sci.impl.opts.default_imports,imports], 0));
var bindings__$1 = bindings;
var _ = sci.impl.opts.init_env_BANG_(env__$1,bindings__$1,aliases,namespaces,imports__$1,load_fn);
var raw_classes = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([sci.impl.opts.default_classes,classes], 0));
var classes__$1 = sci.impl.opts.normalize_classes(raw_classes);
var ctx = cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(sci.impl.opts.__GT_ctx(cljs.core.PersistentArrayMap.EMPTY,env__$1,features,readers,(function (){var or__5002__auto__ = allow;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return deny;
}
})()),new cljs.core.Keyword(null,"allow","allow",-1857325745),(cljs.core.truth_(allow)?sci.impl.opts.process_permissions.cljs$core$IFn$_invoke$arity$variadic(cljs.core.PersistentHashSet.EMPTY,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([allow], 0)):null),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"deny","deny",1589338523),(cljs.core.truth_(deny)?sci.impl.opts.process_permissions.cljs$core$IFn$_invoke$arity$variadic(cljs.core.PersistentHashSet.EMPTY,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([deny], 0)):null),new cljs.core.Keyword(null,"reify-fn","reify-fn",-1360983316),(function (){var or__5002__auto__ = reify_fn;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return sci.impl.opts.default_reify_fn;
}
})(),new cljs.core.Keyword(null,"proxy-fn","proxy-fn",1116677438),proxy_fn,new cljs.core.Keyword(null,"public-class","public-class",1127293019),new cljs.core.Keyword(null,"public-class","public-class",1127293019).cljs$core$IFn$_invoke$arity$1(classes__$1),new cljs.core.Keyword(null,"raw-classes","raw-classes",1669916511),raw_classes,new cljs.core.Keyword(null,"class->opts","class->opts",2061906477),new cljs.core.Keyword(null,"class->opts","class->opts",2061906477).cljs$core$IFn$_invoke$arity$1(classes__$1)], 0));
return ctx;
});
sci.impl.opts.merge_opts = (function sci$impl$opts$merge_opts(ctx,opts){
var map__96806 = opts;
var map__96806__$1 = cljs.core.__destructure_map(map__96806);
var features = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__96806__$1,new cljs.core.Keyword(null,"features","features",-1146962336));
var namespaces = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__96806__$1,new cljs.core.Keyword(null,"namespaces","namespaces",-1444157469));
var bindings = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__96806__$1,new cljs.core.Keyword(null,"bindings","bindings",1271397192));
var readers = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__96806__$1,new cljs.core.Keyword(null,"readers","readers",-2118263030));
var reify_fn = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__96806__$1,new cljs.core.Keyword(null,"reify-fn","reify-fn",-1360983316));
var imports = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__96806__$1,new cljs.core.Keyword(null,"imports","imports",-1249933394));
var allow = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__96806__$1,new cljs.core.Keyword(null,"allow","allow",-1857325745));
var load_fn = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__96806__$1,new cljs.core.Keyword(null,"load-fn","load-fn",-2121144334));
var aliases = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__96806__$1,new cljs.core.Keyword(null,"aliases","aliases",1346874714));
var deny = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__96806__$1,new cljs.core.Keyword(null,"deny","deny",1589338523));
var classes = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__96806__$1,new cljs.core.Keyword(null,"classes","classes",2037804510));
var env = new cljs.core.Keyword(null,"env","env",-1815813235).cljs$core$IFn$_invoke$arity$1(ctx);
var _ = sci.impl.opts.init_env_BANG_(env,bindings,aliases,namespaces,imports,load_fn);
var raw_classes = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"raw-classes","raw-classes",1669916511).cljs$core$IFn$_invoke$arity$1(ctx),classes], 0));
var classes__$1 = sci.impl.opts.normalize_classes(raw_classes);
var ctx__$1 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(sci.impl.opts.__GT_ctx(cljs.core.PersistentArrayMap.EMPTY,env,features,readers,(function (){var or__5002__auto__ = new cljs.core.Keyword(null,"check-permissions","check-permissions",669054317).cljs$core$IFn$_invoke$arity$1(ctx);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = allow;
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
return deny;
}
}
})()),new cljs.core.Keyword(null,"allow","allow",-1857325745),(cljs.core.truth_(allow)?sci.impl.opts.process_permissions.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword(null,"allow","allow",-1857325745).cljs$core$IFn$_invoke$arity$1(ctx),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([allow], 0)):null),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"deny","deny",1589338523),(cljs.core.truth_(deny)?sci.impl.opts.process_permissions.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword(null,"deny","deny",1589338523).cljs$core$IFn$_invoke$arity$1(ctx),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([deny], 0)):null),new cljs.core.Keyword(null,"reify-fn","reify-fn",-1360983316),reify_fn,new cljs.core.Keyword(null,"public-class","public-class",1127293019),new cljs.core.Keyword(null,"public-class","public-class",1127293019).cljs$core$IFn$_invoke$arity$1(classes__$1),new cljs.core.Keyword(null,"raw-classes","raw-classes",1669916511),raw_classes,new cljs.core.Keyword(null,"class->opts","class->opts",2061906477),new cljs.core.Keyword(null,"class->opts","class->opts",2061906477).cljs$core$IFn$_invoke$arity$1(classes__$1),new cljs.core.Keyword(null,"main-thread-id","main-thread-id",1264618959),new cljs.core.Keyword(null,"main-thread-id","main-thread-id",1264618959).cljs$core$IFn$_invoke$arity$1(ctx)], 0));
return ctx__$1;
});

//# sourceMappingURL=sci.impl.opts.js.map
