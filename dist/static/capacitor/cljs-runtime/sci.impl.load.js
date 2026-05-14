goog.provide('sci.impl.load');
sci.impl.load.handle_refer_all = (function sci$impl$load$handle_refer_all(the_current_ns,the_loaded_ns,include_sym_QMARK_,rename_sym,only){
var referred = new cljs.core.Keyword(null,"refers","refers",158076809).cljs$core$IFn$_invoke$arity$1(the_current_ns);
var only__$1 = (cljs.core.truth_(only)?cljs.core.set(only):null);
var referred__$1 = cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (ns,p__79135){
var vec__79140 = p__79135;
var k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__79140,(0),null);
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__79140,(1),null);
if(cljs.core.truth_((function (){var and__5000__auto__ = (k instanceof cljs.core.Symbol);
if(and__5000__auto__){
var and__5000__auto____$1 = (include_sym_QMARK_.cljs$core$IFn$_invoke$arity$1 ? include_sym_QMARK_.cljs$core$IFn$_invoke$arity$1(k) : include_sym_QMARK_.call(null,k));
if(cljs.core.truth_(and__5000__auto____$1)){
return ((cljs.core.not(only__$1)) || (cljs.core.contains_QMARK_(only__$1,k)));
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})())){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(ns,(rename_sym.cljs$core$IFn$_invoke$arity$1 ? rename_sym.cljs$core$IFn$_invoke$arity$1(k) : rename_sym.call(null,k)),v);
} else {
return ns;
}
}),referred,the_loaded_ns);
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(the_current_ns,new cljs.core.Keyword(null,"refers","refers",158076809),referred__$1);
});
sci.impl.load.handle_require_libspec_env = (function sci$impl$load$handle_require_libspec_env(_ctx,env,current_ns,the_loaded_ns,lib_name,p__79154){
var map__79155 = p__79154;
var map__79155__$1 = cljs.core.__destructure_map(map__79155);
var _parsed_libspec = map__79155__$1;
var as = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__79155__$1,new cljs.core.Keyword(null,"as","as",1148689641));
var refer = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__79155__$1,new cljs.core.Keyword(null,"refer","refer",-964295553));
var rename = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__79155__$1,new cljs.core.Keyword(null,"rename","rename",1508157613));
var exclude = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__79155__$1,new cljs.core.Keyword(null,"exclude","exclude",-1230250334));
var only = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__79155__$1,new cljs.core.Keyword(null,"only","only",1907811652));
var use = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__79155__$1,new cljs.core.Keyword(null,"use","use",-1846382424));
var the_current_ns = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(env,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"namespaces","namespaces",-1444157469),current_ns], null));
var the_current_ns__$1 = (cljs.core.truth_(as)?cljs.core.assoc_in(the_current_ns,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"aliases","aliases",1346874714),as], null),lib_name):the_current_ns);
var rename_sym = (cljs.core.truth_(rename)?(function (sym){
var or__5002__auto__ = (rename.cljs$core$IFn$_invoke$arity$1 ? rename.cljs$core$IFn$_invoke$arity$1(sym) : rename.call(null,sym));
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return sym;
}
}):cljs.core.identity);
var include_sym_QMARK_ = (cljs.core.truth_(exclude)?(function (){var excludes = cljs.core.set(exclude);
return (function (sym){
return (!(cljs.core.contains_QMARK_(excludes,sym)));
});
})():cljs.core.constantly(true));
var the_current_ns__$2 = (cljs.core.truth_(refer)?(cljs.core.truth_((function (){var or__5002__auto__ = cljs.core.keyword_identical_QMARK_(new cljs.core.Keyword(null,"all","all",892129742),refer);
if(or__5002__auto__){
return or__5002__auto__;
} else {
return use;
}
})())?sci.impl.load.handle_refer_all(the_current_ns__$1,the_loaded_ns,include_sym_QMARK_,rename_sym,null):((cljs.core.sequential_QMARK_(refer))?(function (){var referred = new cljs.core.Keyword(null,"refers","refers",158076809).cljs$core$IFn$_invoke$arity$1(the_current_ns__$1);
var referred__$1 = cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (ns,sym){
if(cljs.core.truth_(include_sym_QMARK_(sym))){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(ns,(rename_sym.cljs$core$IFn$_invoke$arity$1 ? rename_sym.cljs$core$IFn$_invoke$arity$1(sym) : rename_sym.call(null,sym)),(function (){var temp__5802__auto__ = cljs.core.find(the_loaded_ns,sym);
if(cljs.core.truth_(temp__5802__auto__)){
var vec__79184 = temp__5802__auto__;
var _k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__79184,(0),null);
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__79184,(1),null);
return v;
} else {
throw (new Error([cljs.core.str.cljs$core$IFn$_invoke$arity$1(sym)," does not exist"].join('')));
}
})());
} else {
return ns;
}
}),referred,refer);
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(the_current_ns__$1,new cljs.core.Keyword(null,"refers","refers",158076809),referred__$1);
})():(function(){throw (new Error(":refer value must be a sequential collection of symbols"))})()
)):(cljs.core.truth_(use)?sci.impl.load.handle_refer_all(the_current_ns__$1,the_loaded_ns,include_sym_QMARK_,rename_sym,only):the_current_ns__$1
));
var env__$1 = cljs.core.assoc_in(env,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"namespaces","namespaces",-1444157469),current_ns], null),the_current_ns__$2);
var temp__5804__auto___79383 = (function (){var G__79194 = the_loaded_ns;
var G__79194__$1 = (((G__79194 == null))?null:new cljs.core.Keyword(null,"obj","obj",981763962).cljs$core$IFn$_invoke$arity$1(G__79194));
var G__79194__$2 = (((G__79194__$1 == null))?null:cljs.core.meta(G__79194__$1));
if((G__79194__$2 == null)){
return null;
} else {
return new cljs.core.Keyword("sci.impl","required-fn","sci.impl/required-fn",2082701278).cljs$core$IFn$_invoke$arity$1(G__79194__$2);
}
})();
if(cljs.core.truth_(temp__5804__auto___79383)){
var on_loaded_79388 = temp__5804__auto___79383;
var G__79195_79389 = cljs.core.PersistentArrayMap.EMPTY;
(on_loaded_79388.cljs$core$IFn$_invoke$arity$1 ? on_loaded_79388.cljs$core$IFn$_invoke$arity$1(G__79195_79389) : on_loaded_79388.call(null,G__79195_79389));
} else {
}

return env__$1;
});
sci.impl.load.add_loaded_lib = (function sci$impl$load$add_loaded_lib(env,lib){
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(env,cljs.core.update,new cljs.core.Keyword(null,"loaded-libs","loaded-libs",-1156389652),(function (loaded_libs){
if((loaded_libs == null)){
return cljs.core.PersistentHashSet.createAsIfByAssoc([lib]);
} else {
return cljs.core.conj.cljs$core$IFn$_invoke$arity$2(loaded_libs,lib);
}
}));

return null;
});
sci.impl.load.handle_require_libspec = (function sci$impl$load$handle_require_libspec(ctx,lib,opts){
var env_STAR_ = new cljs.core.Keyword(null,"env","env",-1815813235).cljs$core$IFn$_invoke$arity$1(ctx);
var env = cljs.core.deref(env_STAR_);
var cnn = sci.impl.vars.current_ns_name();
var temp__5802__auto__ = new cljs.core.Keyword(null,"as-alias","as-alias",82482467).cljs$core$IFn$_invoke$arity$1(opts);
if(cljs.core.truth_(temp__5802__auto__)){
var as_alias = temp__5802__auto__;
return cljs.core.reset_BANG_(env_STAR_,sci.impl.load.handle_require_libspec_env(ctx,env,cnn,null,lib,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"as","as",1148689641),as_alias], null)));
} else {
var map__79210 = opts;
var map__79210__$1 = cljs.core.__destructure_map(map__79210);
var reload = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__79210__$1,new cljs.core.Keyword(null,"reload","reload",863702807));
var reload_all = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__79210__$1,new cljs.core.Keyword(null,"reload-all","reload-all",761570200));
var namespaces = cljs.core.get.cljs$core$IFn$_invoke$arity$2(env,new cljs.core.Keyword(null,"namespaces","namespaces",-1444157469));
var reload_STAR_ = (function (){var or__5002__auto__ = reload;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = reload_all;
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
return new cljs.core.Keyword(null,"reload-all","reload-all",761570200).cljs$core$IFn$_invoke$arity$1(ctx);
}
}
})();
var temp__5802__auto___79392__$1 = (cljs.core.truth_(reload_STAR_)?null:cljs.core.get.cljs$core$IFn$_invoke$arity$2(namespaces,lib));
if(cljs.core.truth_(temp__5802__auto___79392__$1)){
var the_loaded_ns_79393 = temp__5802__auto___79392__$1;
var loading_79394 = new cljs.core.Keyword(null,"loading","loading",-737050189).cljs$core$IFn$_invoke$arity$1(ctx);
if(cljs.core.truth_((function (){var and__5000__auto__ = loading_79394;
if(cljs.core.truth_(and__5000__auto__)){
return (((!(cljs.core.contains_QMARK_(new cljs.core.Keyword(null,"loaded-libs","loaded-libs",-1156389652).cljs$core$IFn$_invoke$arity$1(env),lib)))) && (cljs.core.nat_int_QMARK_(loading_79394.indexOf(lib))));
} else {
return and__5000__auto__;
}
})())){
sci.impl.utils.throw_error_with_location.cljs$core$IFn$_invoke$arity$2((function (){var lib_emphasized = ["[ ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(lib)," ]"].join('');
var loading__$1 = cljs.core.conj.cljs$core$IFn$_invoke$arity$2(loading_79394,lib);
var loading__$2 = cljs.core.replace.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.createAsIfByAssoc([lib,lib_emphasized]),loading__$1);
return ["Cyclic load dependency: ",clojure.string.join.cljs$core$IFn$_invoke$arity$2("->",loading__$2)].join('');
})(),lib);
} else {
cljs.core.reset_BANG_(env_STAR_,sci.impl.load.handle_require_libspec_env(ctx,env,cnn,the_loaded_ns_79393,lib,opts));
}
} else {
var temp__5802__auto___79396__$2 = new cljs.core.Keyword(null,"load-fn","load-fn",-2121144334).cljs$core$IFn$_invoke$arity$1(env);
if(cljs.core.truth_(temp__5802__auto___79396__$2)){
var load_fn_79397 = temp__5802__auto___79396__$2;
var temp__5802__auto___79398__$3 = (function (){var G__79227 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"namespace","namespace",-377510372),lib,new cljs.core.Keyword(null,"reload","reload",863702807),(function (){var or__5002__auto__ = reload;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return reload_all;
}
})()], null);
return (load_fn_79397.cljs$core$IFn$_invoke$arity$1 ? load_fn_79397.cljs$core$IFn$_invoke$arity$1(G__79227) : load_fn_79397.call(null,G__79227));
})();
if(cljs.core.truth_(temp__5802__auto___79398__$3)){
var map__79229_79400 = temp__5802__auto___79398__$3;
var map__79229_79401__$1 = cljs.core.__destructure_map(map__79229_79400);
var file_79402 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__79229_79401__$1,new cljs.core.Keyword(null,"file","file",-1269645878));
var source_79403 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__79229_79401__$1,new cljs.core.Keyword(null,"source","source",-433931539));
var ctx_79404__$1 = cljs.core.update.cljs$core$IFn$_invoke$arity$3(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(ctx,new cljs.core.Keyword(null,"bindings","bindings",1271397192),cljs.core.PersistentArrayMap.EMPTY),new cljs.core.Keyword(null,"reload-all","reload-all",761570200),reload_all),new cljs.core.Keyword(null,"loading","loading",-737050189),(function (loading){
if((loading == null)){
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [lib], null);
} else {
return cljs.core.conj.cljs$core$IFn$_invoke$arity$2(loading,lib);
}
}));
try{sci.impl.vars.push_thread_bindings(cljs.core.PersistentArrayMap.createAsIfByAssoc([sci.impl.vars.current_ns,cljs.core.deref(sci.impl.vars.current_ns),sci.impl.vars.current_file,file_79402]));

try{var fexpr__79237_79405 = cljs.core.deref(sci.impl.utils.eval_string_STAR_);
(fexpr__79237_79405.cljs$core$IFn$_invoke$arity$2 ? fexpr__79237_79405.cljs$core$IFn$_invoke$arity$2(ctx_79404__$1,source_79403) : fexpr__79237_79405.call(null,ctx_79404__$1,source_79403));
}finally {sci.impl.vars.pop_thread_bindings();
}}catch (e79234){if((e79234 instanceof Error)){
var e_79406 = e79234;
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$variadic(env_STAR_,cljs.core.update,new cljs.core.Keyword(null,"namespaces","namespaces",-1444157469),cljs.core.dissoc,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([lib], 0));

throw e_79406;
} else {
throw e79234;

}
}
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$2(env_STAR_,(function (env__$1){
var namespaces__$1 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(env__$1,new cljs.core.Keyword(null,"namespaces","namespaces",-1444157469));
var the_loaded_ns = cljs.core.get.cljs$core$IFn$_invoke$arity$2(namespaces__$1,lib);
return sci.impl.load.handle_require_libspec_env(ctx,env__$1,cnn,the_loaded_ns,lib,opts);
}));
} else {
var or__5002__auto___79411 = (cljs.core.truth_(reload_STAR_)?(function (){var temp__5804__auto__ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(namespaces,lib);
if(cljs.core.truth_(temp__5804__auto__)){
var the_loaded_ns = temp__5804__auto__;
return cljs.core.reset_BANG_(env_STAR_,sci.impl.load.handle_require_libspec_env(ctx,env,cnn,the_loaded_ns,lib,opts));
} else {
return null;
}
})():null);
if(cljs.core.truth_(or__5002__auto___79411)){
} else {
throw (new Error(["Could not find namespace: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(lib),"."].join('')));
}
}
} else {
throw (new Error(["Could not find namespace ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(lib),"."].join('')));
}
}

sci.impl.load.add_loaded_lib(env_STAR_,lib);

return null;
}
});
sci.impl.load.load_lib = (function sci$impl$load$load_lib(var_args){
var args__5732__auto__ = [];
var len__5726__auto___79412 = arguments.length;
var i__5727__auto___79413 = (0);
while(true){
if((i__5727__auto___79413 < len__5726__auto___79412)){
args__5732__auto__.push((arguments[i__5727__auto___79413]));

var G__79414 = (i__5727__auto___79413 + (1));
i__5727__auto___79413 = G__79414;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((3) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((3)),(0),null)):null);
return sci.impl.load.load_lib.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),(arguments[(1)]),(arguments[(2)]),argseq__5733__auto__);
});

(sci.impl.load.load_lib.cljs$core$IFn$_invoke$arity$variadic = (function (ctx,prefix,lib,options){
if(cljs.core.truth_((function (){var and__5000__auto__ = prefix;
if(cljs.core.truth_(and__5000__auto__)){
return (cljs.core.name(lib).indexOf(".") > (0));
} else {
return and__5000__auto__;
}
})())){
sci.impl.utils.throw_error_with_location.cljs$core$IFn$_invoke$arity$2(["Found lib name '",cljs.core.name(lib),"' containing period with prefix '",cljs.core.str.cljs$core$IFn$_invoke$arity$1(prefix),"'.  lib names inside prefix lists must not contain periods"].join(''),lib);
} else {
}

var lib__$1 = (cljs.core.truth_(prefix)?cljs.core.symbol.cljs$core$IFn$_invoke$arity$1([cljs.core.str.cljs$core$IFn$_invoke$arity$1(prefix),".",cljs.core.str.cljs$core$IFn$_invoke$arity$1(lib)].join('')):lib);
var opts = cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core.hash_map,options);
return sci.impl.load.handle_require_libspec(ctx,lib__$1,opts);
}));

(sci.impl.load.load_lib.cljs$lang$maxFixedArity = (3));

/** @this {Function} */
(sci.impl.load.load_lib.cljs$lang$applyTo = (function (seq79243){
var G__79244 = cljs.core.first(seq79243);
var seq79243__$1 = cljs.core.next(seq79243);
var G__79245 = cljs.core.first(seq79243__$1);
var seq79243__$2 = cljs.core.next(seq79243__$1);
var G__79246 = cljs.core.first(seq79243__$2);
var seq79243__$3 = cljs.core.next(seq79243__$2);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__79244,G__79245,G__79246,seq79243__$3);
}));

/**
 * Prepends a symbol or a seq to coll
 */
sci.impl.load.prependss = (function sci$impl$load$prependss(x,coll){
if((x instanceof cljs.core.Symbol)){
return cljs.core.cons(x,coll);
} else {
return cljs.core.concat.cljs$core$IFn$_invoke$arity$2(x,coll);
}
});
/**
 * Returns true if x is a libspec
 */
sci.impl.load.libspec_QMARK_ = (function sci$impl$load$libspec_QMARK_(x){
return (((x instanceof cljs.core.Symbol)) || (((cljs.core.vector_QMARK_(x)) && ((((cljs.core.second(x) == null)) || ((cljs.core.second(x) instanceof cljs.core.Keyword)))))));
});
/**
 * Loads libs, evaling libspecs, prefix lists, and flags for
 *   forwarding to load-lib
 */
sci.impl.load.load_libs = (function sci$impl$load$load_libs(ctx,kw,args){
var args_STAR_ = cljs.core.cons(kw,args);
var flags = cljs.core.filter.cljs$core$IFn$_invoke$arity$2(cljs.core.keyword_QMARK_,args_STAR_);
var opts = cljs.core.interleave.cljs$core$IFn$_invoke$arity$2(flags,cljs.core.repeat.cljs$core$IFn$_invoke$arity$1(true));
var args_STAR___$1 = cljs.core.filter.cljs$core$IFn$_invoke$arity$2(cljs.core.complement(cljs.core.keyword_QMARK_),args_STAR_);
var supported_79425 = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 7, [new cljs.core.Keyword(null,"use","use",-1846382424),null,new cljs.core.Keyword(null,"as","as",1148689641),null,new cljs.core.Keyword(null,"require","require",-468001333),null,new cljs.core.Keyword(null,"verbose","verbose",1694226060),null,new cljs.core.Keyword(null,"reload","reload",863702807),null,new cljs.core.Keyword(null,"reload-all","reload-all",761570200),null,new cljs.core.Keyword(null,"refer","refer",-964295553),null], null), null);
var unsupported_79426 = cljs.core.seq(cljs.core.remove.cljs$core$IFn$_invoke$arity$2(supported_79425,flags));
if(unsupported_79426){
sci.impl.utils.throw_error_with_location.cljs$core$IFn$_invoke$arity$2(cljs.core.apply.cljs$core$IFn$_invoke$arity$3(cljs.core.str,"Unsupported option(s) supplied: ",cljs.core.interpose.cljs$core$IFn$_invoke$arity$2(",",unsupported_79426)),args);
} else {
}

if(cljs.core.seq(args_STAR___$1)){
} else {
sci.impl.utils.throw_error_with_location.cljs$core$IFn$_invoke$arity$2("Nothing specified to load",args);
}

var seq__79267 = cljs.core.seq(args_STAR___$1);
var chunk__79268 = null;
var count__79269 = (0);
var i__79270 = (0);
while(true){
if((i__79270 < count__79269)){
var arg = chunk__79268.cljs$core$IIndexed$_nth$arity$2(null,i__79270);
if(sci.impl.load.libspec_QMARK_(arg)){
cljs.core.apply.cljs$core$IFn$_invoke$arity$4(sci.impl.load.load_lib,ctx,null,sci.impl.load.prependss(arg,opts));
} else {
var vec__79310_79430 = arg;
var seq__79311_79431 = cljs.core.seq(vec__79310_79430);
var first__79312_79432 = cljs.core.first(seq__79311_79431);
var seq__79311_79433__$1 = cljs.core.next(seq__79311_79431);
var prefix_79434 = first__79312_79432;
var args_STAR__79435__$2 = seq__79311_79433__$1;
if((prefix_79434 == null)){
sci.impl.utils.throw_error_with_location.cljs$core$IFn$_invoke$arity$2("prefix cannot be nil",args);
} else {
}

var seq__79313_79436 = cljs.core.seq(args_STAR__79435__$2);
var chunk__79314_79437 = null;
var count__79315_79438 = (0);
var i__79316_79439 = (0);
while(true){
if((i__79316_79439 < count__79315_79438)){
var arg_79440__$1 = chunk__79314_79437.cljs$core$IIndexed$_nth$arity$2(null,i__79316_79439);
cljs.core.apply.cljs$core$IFn$_invoke$arity$4(sci.impl.load.load_lib,ctx,prefix_79434,sci.impl.load.prependss(arg_79440__$1,opts));


var G__79441 = seq__79313_79436;
var G__79442 = chunk__79314_79437;
var G__79443 = count__79315_79438;
var G__79444 = (i__79316_79439 + (1));
seq__79313_79436 = G__79441;
chunk__79314_79437 = G__79442;
count__79315_79438 = G__79443;
i__79316_79439 = G__79444;
continue;
} else {
var temp__5804__auto___79445 = cljs.core.seq(seq__79313_79436);
if(temp__5804__auto___79445){
var seq__79313_79446__$1 = temp__5804__auto___79445;
if(cljs.core.chunked_seq_QMARK_(seq__79313_79446__$1)){
var c__5525__auto___79447 = cljs.core.chunk_first(seq__79313_79446__$1);
var G__79448 = cljs.core.chunk_rest(seq__79313_79446__$1);
var G__79449 = c__5525__auto___79447;
var G__79450 = cljs.core.count(c__5525__auto___79447);
var G__79451 = (0);
seq__79313_79436 = G__79448;
chunk__79314_79437 = G__79449;
count__79315_79438 = G__79450;
i__79316_79439 = G__79451;
continue;
} else {
var arg_79452__$1 = cljs.core.first(seq__79313_79446__$1);
cljs.core.apply.cljs$core$IFn$_invoke$arity$4(sci.impl.load.load_lib,ctx,prefix_79434,sci.impl.load.prependss(arg_79452__$1,opts));


var G__79453 = cljs.core.next(seq__79313_79446__$1);
var G__79454 = null;
var G__79455 = (0);
var G__79456 = (0);
seq__79313_79436 = G__79453;
chunk__79314_79437 = G__79454;
count__79315_79438 = G__79455;
i__79316_79439 = G__79456;
continue;
}
} else {
}
}
break;
}
}


var G__79457 = seq__79267;
var G__79458 = chunk__79268;
var G__79459 = count__79269;
var G__79460 = (i__79270 + (1));
seq__79267 = G__79457;
chunk__79268 = G__79458;
count__79269 = G__79459;
i__79270 = G__79460;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__79267);
if(temp__5804__auto__){
var seq__79267__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__79267__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__79267__$1);
var G__79463 = cljs.core.chunk_rest(seq__79267__$1);
var G__79464 = c__5525__auto__;
var G__79465 = cljs.core.count(c__5525__auto__);
var G__79466 = (0);
seq__79267 = G__79463;
chunk__79268 = G__79464;
count__79269 = G__79465;
i__79270 = G__79466;
continue;
} else {
var arg = cljs.core.first(seq__79267__$1);
if(sci.impl.load.libspec_QMARK_(arg)){
cljs.core.apply.cljs$core$IFn$_invoke$arity$4(sci.impl.load.load_lib,ctx,null,sci.impl.load.prependss(arg,opts));
} else {
var vec__79326_79467 = arg;
var seq__79327_79468 = cljs.core.seq(vec__79326_79467);
var first__79328_79469 = cljs.core.first(seq__79327_79468);
var seq__79327_79470__$1 = cljs.core.next(seq__79327_79468);
var prefix_79471 = first__79328_79469;
var args_STAR__79472__$2 = seq__79327_79470__$1;
if((prefix_79471 == null)){
sci.impl.utils.throw_error_with_location.cljs$core$IFn$_invoke$arity$2("prefix cannot be nil",args);
} else {
}

var seq__79334_79473 = cljs.core.seq(args_STAR__79472__$2);
var chunk__79335_79474 = null;
var count__79336_79475 = (0);
var i__79337_79476 = (0);
while(true){
if((i__79337_79476 < count__79336_79475)){
var arg_79477__$1 = chunk__79335_79474.cljs$core$IIndexed$_nth$arity$2(null,i__79337_79476);
cljs.core.apply.cljs$core$IFn$_invoke$arity$4(sci.impl.load.load_lib,ctx,prefix_79471,sci.impl.load.prependss(arg_79477__$1,opts));


var G__79479 = seq__79334_79473;
var G__79480 = chunk__79335_79474;
var G__79481 = count__79336_79475;
var G__79482 = (i__79337_79476 + (1));
seq__79334_79473 = G__79479;
chunk__79335_79474 = G__79480;
count__79336_79475 = G__79481;
i__79337_79476 = G__79482;
continue;
} else {
var temp__5804__auto___79483__$1 = cljs.core.seq(seq__79334_79473);
if(temp__5804__auto___79483__$1){
var seq__79334_79484__$1 = temp__5804__auto___79483__$1;
if(cljs.core.chunked_seq_QMARK_(seq__79334_79484__$1)){
var c__5525__auto___79485 = cljs.core.chunk_first(seq__79334_79484__$1);
var G__79486 = cljs.core.chunk_rest(seq__79334_79484__$1);
var G__79487 = c__5525__auto___79485;
var G__79488 = cljs.core.count(c__5525__auto___79485);
var G__79489 = (0);
seq__79334_79473 = G__79486;
chunk__79335_79474 = G__79487;
count__79336_79475 = G__79488;
i__79337_79476 = G__79489;
continue;
} else {
var arg_79490__$1 = cljs.core.first(seq__79334_79484__$1);
cljs.core.apply.cljs$core$IFn$_invoke$arity$4(sci.impl.load.load_lib,ctx,prefix_79471,sci.impl.load.prependss(arg_79490__$1,opts));


var G__79491 = cljs.core.next(seq__79334_79484__$1);
var G__79492 = null;
var G__79493 = (0);
var G__79494 = (0);
seq__79334_79473 = G__79491;
chunk__79335_79474 = G__79492;
count__79336_79475 = G__79493;
i__79337_79476 = G__79494;
continue;
}
} else {
}
}
break;
}
}


var G__79495 = cljs.core.next(seq__79267__$1);
var G__79496 = null;
var G__79497 = (0);
var G__79498 = (0);
seq__79267 = G__79495;
chunk__79268 = G__79496;
count__79269 = G__79497;
i__79270 = G__79498;
continue;
}
} else {
return null;
}
}
break;
}
});
sci.impl.load.eval_require = (function sci$impl$load$eval_require(var_args){
var args__5732__auto__ = [];
var len__5726__auto___79499 = arguments.length;
var i__5727__auto___79500 = (0);
while(true){
if((i__5727__auto___79500 < len__5726__auto___79499)){
args__5732__auto__.push((arguments[i__5727__auto___79500]));

var G__79501 = (i__5727__auto___79500 + (1));
i__5727__auto___79500 = G__79501;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return sci.impl.load.eval_require.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(sci.impl.load.eval_require.cljs$core$IFn$_invoke$arity$variadic = (function (ctx,args){
return sci.impl.load.load_libs(ctx,new cljs.core.Keyword(null,"require","require",-468001333),args);
}));

(sci.impl.load.eval_require.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(sci.impl.load.eval_require.cljs$lang$applyTo = (function (seq79338){
var G__79339 = cljs.core.first(seq79338);
var seq79338__$1 = cljs.core.next(seq79338);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__79339,seq79338__$1);
}));

cljs.core.vreset_BANG_(sci.impl.utils.eval_require_state,sci.impl.load.eval_require);
sci.impl.load.eval_use = (function sci$impl$load$eval_use(var_args){
var args__5732__auto__ = [];
var len__5726__auto___79516 = arguments.length;
var i__5727__auto___79518 = (0);
while(true){
if((i__5727__auto___79518 < len__5726__auto___79516)){
args__5732__auto__.push((arguments[i__5727__auto___79518]));

var G__79519 = (i__5727__auto___79518 + (1));
i__5727__auto___79518 = G__79519;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return sci.impl.load.eval_use.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(sci.impl.load.eval_use.cljs$core$IFn$_invoke$arity$variadic = (function (ctx,args){
return sci.impl.load.load_libs(ctx,new cljs.core.Keyword(null,"use","use",-1846382424),args);
}));

(sci.impl.load.eval_use.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(sci.impl.load.eval_use.cljs$lang$applyTo = (function (seq79340){
var G__79341 = cljs.core.first(seq79340);
var seq79340__$1 = cljs.core.next(seq79340);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__79341,seq79340__$1);
}));

cljs.core.vreset_BANG_(sci.impl.utils.eval_use_state,sci.impl.load.eval_use);
sci.impl.load.eval_refer_clojure = (function sci$impl$load$eval_refer_clojure(ctx,exprs){
var ns_sym = new cljs.core.Symbol(null,"clojure.core","clojure.core",-189332625,null);
var exprs__$1 = exprs;
while(true){
if(cljs.core.truth_(exprs__$1)){
var vec__79344 = exprs__$1;
var k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__79344,(0),null);
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__79344,(1),null);
var G__79347_79520 = k;
var G__79347_79521__$1 = (((G__79347_79520 instanceof cljs.core.Keyword))?G__79347_79520.fqn:null);
switch (G__79347_79521__$1) {
case "exclude":
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"env","env",-1815813235).cljs$core$IFn$_invoke$arity$1(ctx),((function (exprs__$1,G__79347_79520,G__79347_79521__$1,vec__79344,k,v,ns_sym){
return (function (env){
var cnn = sci.impl.vars.current_ns_name();
return cljs.core.update_in.cljs$core$IFn$_invoke$arity$4(env,new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"namespaces","namespaces",-1444157469),cnn,new cljs.core.Keyword(null,"refer","refer",-964295553),ns_sym,new cljs.core.Keyword(null,"exclude","exclude",-1230250334)], null),cljs.core.fnil.cljs$core$IFn$_invoke$arity$2(cljs.core.into,cljs.core.PersistentHashSet.EMPTY),v);
});})(exprs__$1,G__79347_79520,G__79347_79521__$1,vec__79344,k,v,ns_sym))
);

break;
case "only":
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"env","env",-1815813235).cljs$core$IFn$_invoke$arity$1(ctx),((function (exprs__$1,G__79347_79520,G__79347_79521__$1,vec__79344,k,v,ns_sym){
return (function (env){
var cnn = sci.impl.vars.current_ns_name();
var other_ns = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(env,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"namespaces","namespaces",-1444157469),ns_sym], null));
var other_vars = cljs.core.select_keys(other_ns,v);
return cljs.core.update_in.cljs$core$IFn$_invoke$arity$4(env,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"namespaces","namespaces",-1444157469),cnn], null),cljs.core.merge,other_vars);
});})(exprs__$1,G__79347_79520,G__79347_79521__$1,vec__79344,k,v,ns_sym))
);

break;
case "rename":
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"env","env",-1815813235).cljs$core$IFn$_invoke$arity$1(ctx),((function (exprs__$1,G__79347_79520,G__79347_79521__$1,vec__79344,k,v,ns_sym){
return (function (env){
var cnn = sci.impl.vars.current_ns_name();
var namespaces = new cljs.core.Keyword(null,"namespaces","namespaces",-1444157469).cljs$core$IFn$_invoke$arity$1(env);
var the_current_ns = cljs.core.get.cljs$core$IFn$_invoke$arity$2(namespaces,cnn);
var other_ns = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(env,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"namespaces","namespaces",-1444157469),ns_sym], null));
var the_current_ns__$1 = cljs.core.reduce.cljs$core$IFn$_invoke$arity$3(((function (exprs__$1,cnn,namespaces,the_current_ns,other_ns,G__79347_79520,G__79347_79521__$1,vec__79344,k,v,ns_sym){
return (function (acc,p__79354){
var vec__79355 = p__79354;
var original_name = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__79355,(0),null);
var new_name = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__79355,(1),null);
return cljs.core.update_in.cljs$core$IFn$_invoke$arity$4(cljs.core.assoc_in(acc,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"refers","refers",158076809),new_name], null),cljs.core.get.cljs$core$IFn$_invoke$arity$2(other_ns,original_name)),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"refer","refer",-964295553),ns_sym,new cljs.core.Keyword(null,"exclude","exclude",-1230250334)], null),cljs.core.fnil.cljs$core$IFn$_invoke$arity$2(cljs.core.conj,cljs.core.PersistentHashSet.EMPTY),original_name);
});})(exprs__$1,cnn,namespaces,the_current_ns,other_ns,G__79347_79520,G__79347_79521__$1,vec__79344,k,v,ns_sym))
,the_current_ns,v);
return cljs.core.assoc_in(env,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"namespaces","namespaces",-1444157469),cnn], null),the_current_ns__$1);
});})(exprs__$1,G__79347_79520,G__79347_79521__$1,vec__79344,k,v,ns_sym))
);

break;
default:
throw (new Error(["No matching clause: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(G__79347_79521__$1)].join('')));

}

var G__79530 = cljs.core.nnext(exprs__$1);
exprs__$1 = G__79530;
continue;
} else {
return null;
}
break;
}
});
sci.impl.load.eval_refer_STAR_ = (function sci$impl$load$eval_refer_STAR_(env,ns_sym,filters){

var cnn = sci.impl.vars.current_ns_name();
var namespaces = new cljs.core.Keyword(null,"namespaces","namespaces",-1444157469).cljs$core$IFn$_invoke$arity$1(env);
var ns = (function (){var or__5002__auto__ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(namespaces,ns_sym);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
throw (new Error(["No namespace: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(ns_sym)].join('')));
}
})();
var fs = cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core.hash_map,filters);
var public_keys = cljs.core.filter.cljs$core$IFn$_invoke$arity$2(cljs.core.symbol_QMARK_,cljs.core.keys(ns));
var rename = (function (){var or__5002__auto__ = new cljs.core.Keyword(null,"rename","rename",1508157613).cljs$core$IFn$_invoke$arity$1(fs);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.PersistentArrayMap.EMPTY;
}
})();
var exclude = cljs.core.set(new cljs.core.Keyword(null,"exclude","exclude",-1230250334).cljs$core$IFn$_invoke$arity$1(fs));
var to_do = ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"all","all",892129742),new cljs.core.Keyword(null,"refer","refer",-964295553).cljs$core$IFn$_invoke$arity$1(fs)))?public_keys:(function (){var or__5002__auto__ = new cljs.core.Keyword(null,"refer","refer",-964295553).cljs$core$IFn$_invoke$arity$1(fs);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = new cljs.core.Keyword(null,"only","only",1907811652).cljs$core$IFn$_invoke$arity$1(fs);
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
return public_keys;
}
}
})());
var _ = (cljs.core.truth_((function (){var and__5000__auto__ = to_do;
if(cljs.core.truth_(and__5000__auto__)){
return (!(cljs.core.sequential_QMARK_(to_do)));
} else {
return and__5000__auto__;
}
})())?(function(){throw (new Error(":only/:refer value must be a sequential collection of symbols"))})():null);
var the_current_ns = cljs.core.get.cljs$core$IFn$_invoke$arity$2(namespaces,cnn);
var referred = new cljs.core.Keyword(null,"refers","refers",158076809).cljs$core$IFn$_invoke$arity$1(the_current_ns);
var referred__$1 = cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (referred__$1,sym){
if(cljs.core.not((exclude.cljs$core$IFn$_invoke$arity$1 ? exclude.cljs$core$IFn$_invoke$arity$1(sym) : exclude.call(null,sym)))){
var v = cljs.core.get.cljs$core$IFn$_invoke$arity$2(ns,sym);
if(cljs.core.truth_(v)){
} else {
throw (new Error([cljs.core.str.cljs$core$IFn$_invoke$arity$1(sym)," does not exist"].join('')
));
}

return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(referred__$1,(function (){var or__5002__auto__ = (rename.cljs$core$IFn$_invoke$arity$1 ? rename.cljs$core$IFn$_invoke$arity$1(sym) : rename.call(null,sym));
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return sym;
}
})(),v);
} else {
return referred__$1;
}
}),referred,to_do);
var the_current_ns__$1 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(the_current_ns,new cljs.core.Keyword(null,"refers","refers",158076809),referred__$1);
var namespaces__$1 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(namespaces,cnn,the_current_ns__$1);
var env__$1 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(env,new cljs.core.Keyword(null,"namespaces","namespaces",-1444157469),namespaces__$1);
return env__$1;
});
/**
 * The function equivalent of :refer is handled differently than what we
 *   did before (this is more like what Clojure itself does.) For
 *   referring clojure.core we still use the old code.
 */
sci.impl.load.eval_refer = (function sci$impl$load$eval_refer(var_args){
var args__5732__auto__ = [];
var len__5726__auto___79543 = arguments.length;
var i__5727__auto___79544 = (0);
while(true){
if((i__5727__auto___79544 < len__5726__auto___79543)){
args__5732__auto__.push((arguments[i__5727__auto___79544]));

var G__79545 = (i__5727__auto___79544 + (1));
i__5727__auto___79544 = G__79545;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((2) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((2)),(0),null)):null);
return sci.impl.load.eval_refer.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),(arguments[(1)]),argseq__5733__auto__);
});

(sci.impl.load.eval_refer.cljs$core$IFn$_invoke$arity$variadic = (function (ctx,ns_sym,filters){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Symbol(null,"clojure.core","clojure.core",-189332625,null),ns_sym)){
sci.impl.load.eval_refer_clojure(ctx,filters);
} else {
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(new cljs.core.Keyword(null,"env","env",-1815813235).cljs$core$IFn$_invoke$arity$1(ctx),sci.impl.load.eval_refer_STAR_,ns_sym,filters);
}

return null;
}));

(sci.impl.load.eval_refer.cljs$lang$maxFixedArity = (2));

/** @this {Function} */
(sci.impl.load.eval_refer.cljs$lang$applyTo = (function (seq79366){
var G__79367 = cljs.core.first(seq79366);
var seq79366__$1 = cljs.core.next(seq79366);
var G__79368 = cljs.core.first(seq79366__$1);
var seq79366__$2 = cljs.core.next(seq79366__$1);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__79367,G__79368,seq79366__$2);
}));

cljs.core.vreset_BANG_(sci.impl.utils.eval_refer_state,sci.impl.load.eval_refer);

//# sourceMappingURL=sci.impl.load.js.map
