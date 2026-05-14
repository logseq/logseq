goog.provide('sci.impl.load');
sci.impl.load.handle_refer_all = (function sci$impl$load$handle_refer_all(the_current_ns,the_loaded_ns,include_sym_QMARK_,rename_sym,only){
var referred = new cljs.core.Keyword(null,"refers","refers",158076809).cljs$core$IFn$_invoke$arity$1(the_current_ns);
var only__$1 = (cljs.core.truth_(only)?cljs.core.set(only):null);
var referred__$1 = cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (ns,p__85589){
var vec__85590 = p__85589;
var k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__85590,(0),null);
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__85590,(1),null);
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
sci.impl.load.handle_require_libspec_env = (function sci$impl$load$handle_require_libspec_env(_ctx,env,current_ns,the_loaded_ns,lib_name,p__85598){
var map__85599 = p__85598;
var map__85599__$1 = cljs.core.__destructure_map(map__85599);
var _parsed_libspec = map__85599__$1;
var as = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__85599__$1,new cljs.core.Keyword(null,"as","as",1148689641));
var refer = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__85599__$1,new cljs.core.Keyword(null,"refer","refer",-964295553));
var rename = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__85599__$1,new cljs.core.Keyword(null,"rename","rename",1508157613));
var exclude = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__85599__$1,new cljs.core.Keyword(null,"exclude","exclude",-1230250334));
var only = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__85599__$1,new cljs.core.Keyword(null,"only","only",1907811652));
var use = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__85599__$1,new cljs.core.Keyword(null,"use","use",-1846382424));
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
var vec__85600 = temp__5802__auto__;
var _k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__85600,(0),null);
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__85600,(1),null);
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
var temp__5804__auto___85767 = (function (){var G__85603 = the_loaded_ns;
var G__85603__$1 = (((G__85603 == null))?null:new cljs.core.Keyword(null,"obj","obj",981763962).cljs$core$IFn$_invoke$arity$1(G__85603));
var G__85603__$2 = (((G__85603__$1 == null))?null:cljs.core.meta(G__85603__$1));
if((G__85603__$2 == null)){
return null;
} else {
return new cljs.core.Keyword("sci.impl","required-fn","sci.impl/required-fn",2082701278).cljs$core$IFn$_invoke$arity$1(G__85603__$2);
}
})();
if(cljs.core.truth_(temp__5804__auto___85767)){
var on_loaded_85770 = temp__5804__auto___85767;
var G__85604_85771 = cljs.core.PersistentArrayMap.EMPTY;
(on_loaded_85770.cljs$core$IFn$_invoke$arity$1 ? on_loaded_85770.cljs$core$IFn$_invoke$arity$1(G__85604_85771) : on_loaded_85770.call(null,G__85604_85771));
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
var map__85608 = opts;
var map__85608__$1 = cljs.core.__destructure_map(map__85608);
var reload = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__85608__$1,new cljs.core.Keyword(null,"reload","reload",863702807));
var reload_all = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__85608__$1,new cljs.core.Keyword(null,"reload-all","reload-all",761570200));
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
var temp__5802__auto___85788__$1 = (cljs.core.truth_(reload_STAR_)?null:cljs.core.get.cljs$core$IFn$_invoke$arity$2(namespaces,lib));
if(cljs.core.truth_(temp__5802__auto___85788__$1)){
var the_loaded_ns_85790 = temp__5802__auto___85788__$1;
var loading_85791 = new cljs.core.Keyword(null,"loading","loading",-737050189).cljs$core$IFn$_invoke$arity$1(ctx);
if(cljs.core.truth_((function (){var and__5000__auto__ = loading_85791;
if(cljs.core.truth_(and__5000__auto__)){
return (((!(cljs.core.contains_QMARK_(new cljs.core.Keyword(null,"loaded-libs","loaded-libs",-1156389652).cljs$core$IFn$_invoke$arity$1(env),lib)))) && (cljs.core.nat_int_QMARK_(loading_85791.indexOf(lib))));
} else {
return and__5000__auto__;
}
})())){
sci.impl.utils.throw_error_with_location.cljs$core$IFn$_invoke$arity$2((function (){var lib_emphasized = ["[ ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(lib)," ]"].join('');
var loading__$1 = cljs.core.conj.cljs$core$IFn$_invoke$arity$2(loading_85791,lib);
var loading__$2 = cljs.core.replace.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.createAsIfByAssoc([lib,lib_emphasized]),loading__$1);
return ["Cyclic load dependency: ",clojure.string.join.cljs$core$IFn$_invoke$arity$2("->",loading__$2)].join('');
})(),lib);
} else {
cljs.core.reset_BANG_(env_STAR_,sci.impl.load.handle_require_libspec_env(ctx,env,cnn,the_loaded_ns_85790,lib,opts));
}
} else {
var temp__5802__auto___85793__$2 = new cljs.core.Keyword(null,"load-fn","load-fn",-2121144334).cljs$core$IFn$_invoke$arity$1(env);
if(cljs.core.truth_(temp__5802__auto___85793__$2)){
var load_fn_85794 = temp__5802__auto___85793__$2;
var temp__5802__auto___85795__$3 = (function (){var G__85617 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"namespace","namespace",-377510372),lib,new cljs.core.Keyword(null,"reload","reload",863702807),(function (){var or__5002__auto__ = reload;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return reload_all;
}
})()], null);
return (load_fn_85794.cljs$core$IFn$_invoke$arity$1 ? load_fn_85794.cljs$core$IFn$_invoke$arity$1(G__85617) : load_fn_85794.call(null,G__85617));
})();
if(cljs.core.truth_(temp__5802__auto___85795__$3)){
var map__85618_85797 = temp__5802__auto___85795__$3;
var map__85618_85798__$1 = cljs.core.__destructure_map(map__85618_85797);
var file_85799 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__85618_85798__$1,new cljs.core.Keyword(null,"file","file",-1269645878));
var source_85800 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__85618_85798__$1,new cljs.core.Keyword(null,"source","source",-433931539));
var ctx_85801__$1 = cljs.core.update.cljs$core$IFn$_invoke$arity$3(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(ctx,new cljs.core.Keyword(null,"bindings","bindings",1271397192),cljs.core.PersistentArrayMap.EMPTY),new cljs.core.Keyword(null,"reload-all","reload-all",761570200),reload_all),new cljs.core.Keyword(null,"loading","loading",-737050189),(function (loading){
if((loading == null)){
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [lib], null);
} else {
return cljs.core.conj.cljs$core$IFn$_invoke$arity$2(loading,lib);
}
}));
try{sci.impl.vars.push_thread_bindings(cljs.core.PersistentArrayMap.createAsIfByAssoc([sci.impl.vars.current_ns,cljs.core.deref(sci.impl.vars.current_ns),sci.impl.vars.current_file,file_85799]));

try{var fexpr__85632_85802 = cljs.core.deref(sci.impl.utils.eval_string_STAR_);
(fexpr__85632_85802.cljs$core$IFn$_invoke$arity$2 ? fexpr__85632_85802.cljs$core$IFn$_invoke$arity$2(ctx_85801__$1,source_85800) : fexpr__85632_85802.call(null,ctx_85801__$1,source_85800));
}finally {sci.impl.vars.pop_thread_bindings();
}}catch (e85624){if((e85624 instanceof Error)){
var e_85803 = e85624;
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$variadic(env_STAR_,cljs.core.update,new cljs.core.Keyword(null,"namespaces","namespaces",-1444157469),cljs.core.dissoc,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([lib], 0));

throw e_85803;
} else {
throw e85624;

}
}
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$2(env_STAR_,(function (env__$1){
var namespaces__$1 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(env__$1,new cljs.core.Keyword(null,"namespaces","namespaces",-1444157469));
var the_loaded_ns = cljs.core.get.cljs$core$IFn$_invoke$arity$2(namespaces__$1,lib);
return sci.impl.load.handle_require_libspec_env(ctx,env__$1,cnn,the_loaded_ns,lib,opts);
}));
} else {
var or__5002__auto___85804 = (cljs.core.truth_(reload_STAR_)?(function (){var temp__5804__auto__ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(namespaces,lib);
if(cljs.core.truth_(temp__5804__auto__)){
var the_loaded_ns = temp__5804__auto__;
return cljs.core.reset_BANG_(env_STAR_,sci.impl.load.handle_require_libspec_env(ctx,env,cnn,the_loaded_ns,lib,opts));
} else {
return null;
}
})():null);
if(cljs.core.truth_(or__5002__auto___85804)){
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
var len__5726__auto___85805 = arguments.length;
var i__5727__auto___85806 = (0);
while(true){
if((i__5727__auto___85806 < len__5726__auto___85805)){
args__5732__auto__.push((arguments[i__5727__auto___85806]));

var G__85807 = (i__5727__auto___85806 + (1));
i__5727__auto___85806 = G__85807;
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
(sci.impl.load.load_lib.cljs$lang$applyTo = (function (seq85653){
var G__85654 = cljs.core.first(seq85653);
var seq85653__$1 = cljs.core.next(seq85653);
var G__85655 = cljs.core.first(seq85653__$1);
var seq85653__$2 = cljs.core.next(seq85653__$1);
var G__85656 = cljs.core.first(seq85653__$2);
var seq85653__$3 = cljs.core.next(seq85653__$2);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__85654,G__85655,G__85656,seq85653__$3);
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
var supported_85810 = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 7, [new cljs.core.Keyword(null,"use","use",-1846382424),null,new cljs.core.Keyword(null,"as","as",1148689641),null,new cljs.core.Keyword(null,"require","require",-468001333),null,new cljs.core.Keyword(null,"verbose","verbose",1694226060),null,new cljs.core.Keyword(null,"reload","reload",863702807),null,new cljs.core.Keyword(null,"reload-all","reload-all",761570200),null,new cljs.core.Keyword(null,"refer","refer",-964295553),null], null), null);
var unsupported_85811 = cljs.core.seq(cljs.core.remove.cljs$core$IFn$_invoke$arity$2(supported_85810,flags));
if(unsupported_85811){
sci.impl.utils.throw_error_with_location.cljs$core$IFn$_invoke$arity$2(cljs.core.apply.cljs$core$IFn$_invoke$arity$3(cljs.core.str,"Unsupported option(s) supplied: ",cljs.core.interpose.cljs$core$IFn$_invoke$arity$2(",",unsupported_85811)),args);
} else {
}

if(cljs.core.seq(args_STAR___$1)){
} else {
sci.impl.utils.throw_error_with_location.cljs$core$IFn$_invoke$arity$2("Nothing specified to load",args);
}

var seq__85663 = cljs.core.seq(args_STAR___$1);
var chunk__85664 = null;
var count__85665 = (0);
var i__85666 = (0);
while(true){
if((i__85666 < count__85665)){
var arg = chunk__85664.cljs$core$IIndexed$_nth$arity$2(null,i__85666);
if(sci.impl.load.libspec_QMARK_(arg)){
cljs.core.apply.cljs$core$IFn$_invoke$arity$4(sci.impl.load.load_lib,ctx,null,sci.impl.load.prependss(arg,opts));
} else {
var vec__85708_85816 = arg;
var seq__85709_85817 = cljs.core.seq(vec__85708_85816);
var first__85710_85818 = cljs.core.first(seq__85709_85817);
var seq__85709_85819__$1 = cljs.core.next(seq__85709_85817);
var prefix_85820 = first__85710_85818;
var args_STAR__85821__$2 = seq__85709_85819__$1;
if((prefix_85820 == null)){
sci.impl.utils.throw_error_with_location.cljs$core$IFn$_invoke$arity$2("prefix cannot be nil",args);
} else {
}

var seq__85711_85823 = cljs.core.seq(args_STAR__85821__$2);
var chunk__85712_85824 = null;
var count__85713_85825 = (0);
var i__85714_85826 = (0);
while(true){
if((i__85714_85826 < count__85713_85825)){
var arg_85827__$1 = chunk__85712_85824.cljs$core$IIndexed$_nth$arity$2(null,i__85714_85826);
cljs.core.apply.cljs$core$IFn$_invoke$arity$4(sci.impl.load.load_lib,ctx,prefix_85820,sci.impl.load.prependss(arg_85827__$1,opts));


var G__85828 = seq__85711_85823;
var G__85829 = chunk__85712_85824;
var G__85830 = count__85713_85825;
var G__85831 = (i__85714_85826 + (1));
seq__85711_85823 = G__85828;
chunk__85712_85824 = G__85829;
count__85713_85825 = G__85830;
i__85714_85826 = G__85831;
continue;
} else {
var temp__5804__auto___85833 = cljs.core.seq(seq__85711_85823);
if(temp__5804__auto___85833){
var seq__85711_85834__$1 = temp__5804__auto___85833;
if(cljs.core.chunked_seq_QMARK_(seq__85711_85834__$1)){
var c__5525__auto___85836 = cljs.core.chunk_first(seq__85711_85834__$1);
var G__85837 = cljs.core.chunk_rest(seq__85711_85834__$1);
var G__85838 = c__5525__auto___85836;
var G__85839 = cljs.core.count(c__5525__auto___85836);
var G__85840 = (0);
seq__85711_85823 = G__85837;
chunk__85712_85824 = G__85838;
count__85713_85825 = G__85839;
i__85714_85826 = G__85840;
continue;
} else {
var arg_85841__$1 = cljs.core.first(seq__85711_85834__$1);
cljs.core.apply.cljs$core$IFn$_invoke$arity$4(sci.impl.load.load_lib,ctx,prefix_85820,sci.impl.load.prependss(arg_85841__$1,opts));


var G__85842 = cljs.core.next(seq__85711_85834__$1);
var G__85843 = null;
var G__85844 = (0);
var G__85845 = (0);
seq__85711_85823 = G__85842;
chunk__85712_85824 = G__85843;
count__85713_85825 = G__85844;
i__85714_85826 = G__85845;
continue;
}
} else {
}
}
break;
}
}


var G__85846 = seq__85663;
var G__85847 = chunk__85664;
var G__85849 = count__85665;
var G__85850 = (i__85666 + (1));
seq__85663 = G__85846;
chunk__85664 = G__85847;
count__85665 = G__85849;
i__85666 = G__85850;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__85663);
if(temp__5804__auto__){
var seq__85663__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__85663__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__85663__$1);
var G__85851 = cljs.core.chunk_rest(seq__85663__$1);
var G__85852 = c__5525__auto__;
var G__85853 = cljs.core.count(c__5525__auto__);
var G__85854 = (0);
seq__85663 = G__85851;
chunk__85664 = G__85852;
count__85665 = G__85853;
i__85666 = G__85854;
continue;
} else {
var arg = cljs.core.first(seq__85663__$1);
if(sci.impl.load.libspec_QMARK_(arg)){
cljs.core.apply.cljs$core$IFn$_invoke$arity$4(sci.impl.load.load_lib,ctx,null,sci.impl.load.prependss(arg,opts));
} else {
var vec__85719_85856 = arg;
var seq__85720_85857 = cljs.core.seq(vec__85719_85856);
var first__85721_85858 = cljs.core.first(seq__85720_85857);
var seq__85720_85859__$1 = cljs.core.next(seq__85720_85857);
var prefix_85860 = first__85721_85858;
var args_STAR__85861__$2 = seq__85720_85859__$1;
if((prefix_85860 == null)){
sci.impl.utils.throw_error_with_location.cljs$core$IFn$_invoke$arity$2("prefix cannot be nil",args);
} else {
}

var seq__85722_85862 = cljs.core.seq(args_STAR__85861__$2);
var chunk__85723_85863 = null;
var count__85724_85864 = (0);
var i__85725_85865 = (0);
while(true){
if((i__85725_85865 < count__85724_85864)){
var arg_85866__$1 = chunk__85723_85863.cljs$core$IIndexed$_nth$arity$2(null,i__85725_85865);
cljs.core.apply.cljs$core$IFn$_invoke$arity$4(sci.impl.load.load_lib,ctx,prefix_85860,sci.impl.load.prependss(arg_85866__$1,opts));


var G__85879 = seq__85722_85862;
var G__85880 = chunk__85723_85863;
var G__85881 = count__85724_85864;
var G__85882 = (i__85725_85865 + (1));
seq__85722_85862 = G__85879;
chunk__85723_85863 = G__85880;
count__85724_85864 = G__85881;
i__85725_85865 = G__85882;
continue;
} else {
var temp__5804__auto___85883__$1 = cljs.core.seq(seq__85722_85862);
if(temp__5804__auto___85883__$1){
var seq__85722_85884__$1 = temp__5804__auto___85883__$1;
if(cljs.core.chunked_seq_QMARK_(seq__85722_85884__$1)){
var c__5525__auto___85885 = cljs.core.chunk_first(seq__85722_85884__$1);
var G__85886 = cljs.core.chunk_rest(seq__85722_85884__$1);
var G__85887 = c__5525__auto___85885;
var G__85888 = cljs.core.count(c__5525__auto___85885);
var G__85889 = (0);
seq__85722_85862 = G__85886;
chunk__85723_85863 = G__85887;
count__85724_85864 = G__85888;
i__85725_85865 = G__85889;
continue;
} else {
var arg_85890__$1 = cljs.core.first(seq__85722_85884__$1);
cljs.core.apply.cljs$core$IFn$_invoke$arity$4(sci.impl.load.load_lib,ctx,prefix_85860,sci.impl.load.prependss(arg_85890__$1,opts));


var G__85891 = cljs.core.next(seq__85722_85884__$1);
var G__85892 = null;
var G__85893 = (0);
var G__85894 = (0);
seq__85722_85862 = G__85891;
chunk__85723_85863 = G__85892;
count__85724_85864 = G__85893;
i__85725_85865 = G__85894;
continue;
}
} else {
}
}
break;
}
}


var G__85895 = cljs.core.next(seq__85663__$1);
var G__85896 = null;
var G__85897 = (0);
var G__85898 = (0);
seq__85663 = G__85895;
chunk__85664 = G__85896;
count__85665 = G__85897;
i__85666 = G__85898;
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
var len__5726__auto___85899 = arguments.length;
var i__5727__auto___85900 = (0);
while(true){
if((i__5727__auto___85900 < len__5726__auto___85899)){
args__5732__auto__.push((arguments[i__5727__auto___85900]));

var G__85901 = (i__5727__auto___85900 + (1));
i__5727__auto___85900 = G__85901;
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
(sci.impl.load.eval_require.cljs$lang$applyTo = (function (seq85729){
var G__85730 = cljs.core.first(seq85729);
var seq85729__$1 = cljs.core.next(seq85729);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__85730,seq85729__$1);
}));

cljs.core.vreset_BANG_(sci.impl.utils.eval_require_state,sci.impl.load.eval_require);
sci.impl.load.eval_use = (function sci$impl$load$eval_use(var_args){
var args__5732__auto__ = [];
var len__5726__auto___85902 = arguments.length;
var i__5727__auto___85903 = (0);
while(true){
if((i__5727__auto___85903 < len__5726__auto___85902)){
args__5732__auto__.push((arguments[i__5727__auto___85903]));

var G__85904 = (i__5727__auto___85903 + (1));
i__5727__auto___85903 = G__85904;
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
(sci.impl.load.eval_use.cljs$lang$applyTo = (function (seq85732){
var G__85733 = cljs.core.first(seq85732);
var seq85732__$1 = cljs.core.next(seq85732);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__85733,seq85732__$1);
}));

cljs.core.vreset_BANG_(sci.impl.utils.eval_use_state,sci.impl.load.eval_use);
sci.impl.load.eval_refer_clojure = (function sci$impl$load$eval_refer_clojure(ctx,exprs){
var ns_sym = new cljs.core.Symbol(null,"clojure.core","clojure.core",-189332625,null);
var exprs__$1 = exprs;
while(true){
if(cljs.core.truth_(exprs__$1)){
var vec__85737 = exprs__$1;
var k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__85737,(0),null);
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__85737,(1),null);
var G__85740_85907 = k;
var G__85740_85908__$1 = (((G__85740_85907 instanceof cljs.core.Keyword))?G__85740_85907.fqn:null);
switch (G__85740_85908__$1) {
case "exclude":
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"env","env",-1815813235).cljs$core$IFn$_invoke$arity$1(ctx),((function (exprs__$1,G__85740_85907,G__85740_85908__$1,vec__85737,k,v,ns_sym){
return (function (env){
var cnn = sci.impl.vars.current_ns_name();
return cljs.core.update_in.cljs$core$IFn$_invoke$arity$4(env,new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"namespaces","namespaces",-1444157469),cnn,new cljs.core.Keyword(null,"refer","refer",-964295553),ns_sym,new cljs.core.Keyword(null,"exclude","exclude",-1230250334)], null),cljs.core.fnil.cljs$core$IFn$_invoke$arity$2(cljs.core.into,cljs.core.PersistentHashSet.EMPTY),v);
});})(exprs__$1,G__85740_85907,G__85740_85908__$1,vec__85737,k,v,ns_sym))
);

break;
case "only":
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"env","env",-1815813235).cljs$core$IFn$_invoke$arity$1(ctx),((function (exprs__$1,G__85740_85907,G__85740_85908__$1,vec__85737,k,v,ns_sym){
return (function (env){
var cnn = sci.impl.vars.current_ns_name();
var other_ns = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(env,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"namespaces","namespaces",-1444157469),ns_sym], null));
var other_vars = cljs.core.select_keys(other_ns,v);
return cljs.core.update_in.cljs$core$IFn$_invoke$arity$4(env,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"namespaces","namespaces",-1444157469),cnn], null),cljs.core.merge,other_vars);
});})(exprs__$1,G__85740_85907,G__85740_85908__$1,vec__85737,k,v,ns_sym))
);

break;
case "rename":
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"env","env",-1815813235).cljs$core$IFn$_invoke$arity$1(ctx),((function (exprs__$1,G__85740_85907,G__85740_85908__$1,vec__85737,k,v,ns_sym){
return (function (env){
var cnn = sci.impl.vars.current_ns_name();
var namespaces = new cljs.core.Keyword(null,"namespaces","namespaces",-1444157469).cljs$core$IFn$_invoke$arity$1(env);
var the_current_ns = cljs.core.get.cljs$core$IFn$_invoke$arity$2(namespaces,cnn);
var other_ns = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(env,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"namespaces","namespaces",-1444157469),ns_sym], null));
var the_current_ns__$1 = cljs.core.reduce.cljs$core$IFn$_invoke$arity$3(((function (exprs__$1,cnn,namespaces,the_current_ns,other_ns,G__85740_85907,G__85740_85908__$1,vec__85737,k,v,ns_sym){
return (function (acc,p__85741){
var vec__85743 = p__85741;
var original_name = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__85743,(0),null);
var new_name = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__85743,(1),null);
return cljs.core.update_in.cljs$core$IFn$_invoke$arity$4(cljs.core.assoc_in(acc,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"refers","refers",158076809),new_name], null),cljs.core.get.cljs$core$IFn$_invoke$arity$2(other_ns,original_name)),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"refer","refer",-964295553),ns_sym,new cljs.core.Keyword(null,"exclude","exclude",-1230250334)], null),cljs.core.fnil.cljs$core$IFn$_invoke$arity$2(cljs.core.conj,cljs.core.PersistentHashSet.EMPTY),original_name);
});})(exprs__$1,cnn,namespaces,the_current_ns,other_ns,G__85740_85907,G__85740_85908__$1,vec__85737,k,v,ns_sym))
,the_current_ns,v);
return cljs.core.assoc_in(env,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"namespaces","namespaces",-1444157469),cnn], null),the_current_ns__$1);
});})(exprs__$1,G__85740_85907,G__85740_85908__$1,vec__85737,k,v,ns_sym))
);

break;
default:
throw (new Error(["No matching clause: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(G__85740_85908__$1)].join('')));

}

var G__85929 = cljs.core.nnext(exprs__$1);
exprs__$1 = G__85929;
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
var len__5726__auto___85933 = arguments.length;
var i__5727__auto___85934 = (0);
while(true){
if((i__5727__auto___85934 < len__5726__auto___85933)){
args__5732__auto__.push((arguments[i__5727__auto___85934]));

var G__85935 = (i__5727__auto___85934 + (1));
i__5727__auto___85934 = G__85935;
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
(sci.impl.load.eval_refer.cljs$lang$applyTo = (function (seq85748){
var G__85749 = cljs.core.first(seq85748);
var seq85748__$1 = cljs.core.next(seq85748);
var G__85750 = cljs.core.first(seq85748__$1);
var seq85748__$2 = cljs.core.next(seq85748__$1);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__85749,G__85750,seq85748__$2);
}));

cljs.core.vreset_BANG_(sci.impl.utils.eval_refer_state,sci.impl.load.eval_refer);

//# sourceMappingURL=sci.impl.load.js.map
