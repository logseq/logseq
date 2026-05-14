goog.provide('edamame.impl.ns_parser');
/**
 * Returns true if x is a libspec
 */
edamame.impl.ns_parser.libspec_QMARK_ = (function edamame$impl$ns_parser$libspec_QMARK_(x){
return (((x instanceof cljs.core.Symbol)) || (((cljs.core.vector_QMARK_(x)) && ((((cljs.core.second(x) == null)) || ((cljs.core.second(x) instanceof cljs.core.Keyword)))))));
});
/**
 * Prepends a symbol or a seq to coll
 */
edamame.impl.ns_parser.prependss = (function edamame$impl$ns_parser$prependss(x,coll){
if((x instanceof cljs.core.Symbol)){
return cljs.core.cons(x,coll);
} else {
return cljs.core.concat.cljs$core$IFn$_invoke$arity$2(x,coll);
}
});
edamame.impl.ns_parser.load_lib = (function edamame$impl$ns_parser$load_lib(var_args){
var args__5732__auto__ = [];
var len__5726__auto___72442 = arguments.length;
var i__5727__auto___72443 = (0);
while(true){
if((i__5727__auto___72443 < len__5726__auto___72442)){
args__5732__auto__.push((arguments[i__5727__auto___72443]));

var G__72444 = (i__5727__auto___72443 + (1));
i__5727__auto___72443 = G__72444;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((2) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((2)),(0),null)):null);
return edamame.impl.ns_parser.load_lib.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),(arguments[(1)]),argseq__5733__auto__);
});

(edamame.impl.ns_parser.load_lib.cljs$core$IFn$_invoke$arity$variadic = (function (prefix,lib,options){
var lib__$1 = (cljs.core.truth_(prefix)?cljs.core.symbol.cljs$core$IFn$_invoke$arity$1([cljs.core.str.cljs$core$IFn$_invoke$arity$1(prefix),".",cljs.core.str.cljs$core$IFn$_invoke$arity$1(lib)].join('')):lib);
var opts = cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core.hash_map,options);
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(opts,new cljs.core.Keyword(null,"lib","lib",191808726),lib__$1);
}));

(edamame.impl.ns_parser.load_lib.cljs$lang$maxFixedArity = (2));

/** @this {Function} */
(edamame.impl.ns_parser.load_lib.cljs$lang$applyTo = (function (seq72404){
var G__72405 = cljs.core.first(seq72404);
var seq72404__$1 = cljs.core.next(seq72404);
var G__72406 = cljs.core.first(seq72404__$1);
var seq72404__$2 = cljs.core.next(seq72404__$1);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__72405,G__72406,seq72404__$2);
}));

edamame.impl.ns_parser.load_libs = (function edamame$impl$ns_parser$load_libs(kw,args){
var args_STAR_ = cljs.core.cons(kw,args);
var flags = cljs.core.filter.cljs$core$IFn$_invoke$arity$2(cljs.core.keyword_QMARK_,args_STAR_);
var opts = cljs.core.interleave.cljs$core$IFn$_invoke$arity$2(flags,cljs.core.repeat.cljs$core$IFn$_invoke$arity$1(true));
var args_STAR___$1 = cljs.core.filter.cljs$core$IFn$_invoke$arity$2(cljs.core.complement(cljs.core.keyword_QMARK_),args_STAR_);
return cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (arg){
if(edamame.impl.ns_parser.libspec_QMARK_(arg)){
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.apply.cljs$core$IFn$_invoke$arity$3(edamame.impl.ns_parser.load_lib,null,edamame.impl.ns_parser.prependss(arg,opts))], null);
} else {
var vec__72426 = arg;
var seq__72427 = cljs.core.seq(vec__72426);
var first__72428 = cljs.core.first(seq__72427);
var seq__72427__$1 = cljs.core.next(seq__72427);
var prefix = first__72428;
var args_STAR___$2 = seq__72427__$1;
if((prefix == null)){
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2("prefix cannot be nil",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"args","args",1315556576),args], null));
} else {
}

return cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (arg__$1){
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.apply.cljs$core$IFn$_invoke$arity$3(edamame.impl.ns_parser.load_lib,prefix,edamame.impl.ns_parser.prependss(arg__$1,opts))], null);
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([args_STAR___$2], 0));
}
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([args_STAR___$1], 0));
});
edamame.impl.ns_parser._ns = (function edamame$impl$ns_parser$_ns(p__72434){
var vec__72435 = p__72434;
var seq__72436 = cljs.core.seq(vec__72435);
var first__72437 = cljs.core.first(seq__72436);
var seq__72436__$1 = cljs.core.next(seq__72436);
var _ns = first__72437;
var first__72437__$1 = cljs.core.first(seq__72436__$1);
var seq__72436__$2 = cljs.core.next(seq__72436__$1);
var name = first__72437__$1;
var references = seq__72436__$2;
var docstring = ((typeof cljs.core.first(references) === 'string')?cljs.core.first(references):null);
var references__$1 = (cljs.core.truth_(docstring)?cljs.core.next(references):references);
var name__$1 = (cljs.core.truth_(docstring)?cljs.core.vary_meta.cljs$core$IFn$_invoke$arity$4(name,cljs.core.assoc,new cljs.core.Keyword(null,"doc","doc",1913296891),docstring):name);
var metadata = ((cljs.core.map_QMARK_(cljs.core.first(references__$1)))?cljs.core.first(references__$1):null);
var references__$2 = (cljs.core.truth_(metadata)?cljs.core.next(references__$1):references__$1);
var references__$3 = cljs.core.filter.cljs$core$IFn$_invoke$arity$2(cljs.core.seq_QMARK_,references__$2);
var references__$4 = cljs.core.group_by(cljs.core.first,references__$3);
var requires = cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (p1__72429_SHARP_){
return edamame.impl.ns_parser.load_libs(new cljs.core.Keyword(null,"require","require",-468001333),cljs.core.rest(p1__72429_SHARP_));
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"require","require",-468001333).cljs$core$IFn$_invoke$arity$1(references__$4)], 0));
return new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"current","current",-1088038603),name__$1,new cljs.core.Keyword(null,"meta","meta",1499536964),metadata,new cljs.core.Keyword(null,"requires","requires",-1201390927),requires,new cljs.core.Keyword(null,"aliases","aliases",1346874714),cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (acc,require){
var temp__5802__auto__ = (function (){var or__5002__auto__ = new cljs.core.Keyword(null,"as","as",1148689641).cljs$core$IFn$_invoke$arity$1(require);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword(null,"as-alias","as-alias",82482467).cljs$core$IFn$_invoke$arity$1(require);
}
})();
if(cljs.core.truth_(temp__5802__auto__)){
var alias = temp__5802__auto__;
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(acc,alias,new cljs.core.Keyword(null,"lib","lib",191808726).cljs$core$IFn$_invoke$arity$1(require));
} else {
return acc;
}
}),cljs.core.PersistentArrayMap.EMPTY,requires)], null);
});
edamame.impl.ns_parser.parse_ns_form = (function edamame$impl$ns_parser$parse_ns_form(ns_form){
return edamame.impl.ns_parser._ns(ns_form);
});

//# sourceMappingURL=edamame.impl.ns_parser.js.map
