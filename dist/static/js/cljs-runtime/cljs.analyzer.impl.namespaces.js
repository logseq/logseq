goog.provide('cljs.analyzer.impl.namespaces');
/**
 * Given a libspec return a map of :as-alias alias, if was present. Return the
 * libspec with :as-alias elided. If the libspec was *only* :as-alias do not
 * return it.
 */
cljs.analyzer.impl.namespaces.check_and_remove_as_alias = (function cljs$analyzer$impl$namespaces$check_and_remove_as_alias(libspec){
if((((libspec instanceof cljs.core.Symbol)) || ((libspec instanceof cljs.core.Keyword)))){
return new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"libspec","libspec",1228503756),libspec], null);
} else {
var vec__40545 = libspec;
var seq__40546 = cljs.core.seq(vec__40545);
var first__40547 = cljs.core.first(seq__40546);
var seq__40546__$1 = cljs.core.next(seq__40546);
var lib = first__40547;
var spec = seq__40546__$1;
var libspec__$1 = vec__40545;
var vec__40549 = cljs.core.split_with(cljs.core.complement(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"as-alias","as-alias",82482467),null], null), null)),spec);
var pre_spec = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__40549,(0),null);
var vec__40552 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__40549,(1),null);
var seq__40553 = cljs.core.seq(vec__40552);
var first__40554 = cljs.core.first(seq__40553);
var seq__40553__$1 = cljs.core.next(seq__40553);
var _ = first__40554;
var first__40554__$1 = cljs.core.first(seq__40553__$1);
var seq__40553__$2 = cljs.core.next(seq__40553__$1);
var alias = first__40554__$1;
var post_spec = seq__40553__$2;
var post = vec__40552;
if(cljs.core.seq(post)){
var libspec_SINGLEQUOTE_ = cljs.core.into.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [lib], null),cljs.core.concat.cljs$core$IFn$_invoke$arity$2(pre_spec,post_spec));
if((alias instanceof cljs.core.Symbol)){
} else {
throw (new Error(["Assert failed: ",[":as-alias must be followed by a symbol, got: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(alias)].join(''),"\n","(symbol? alias)"].join('')));
}

var G__40566 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"as-alias","as-alias",82482467),cljs.core.PersistentArrayMap.createAsIfByAssoc([alias,lib])], null);
if((cljs.core.count(libspec_SINGLEQUOTE_) > (1))){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__40566,new cljs.core.Keyword(null,"libspec","libspec",1228503756),libspec_SINGLEQUOTE_);
} else {
return G__40566;
}
} else {
return new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"libspec","libspec",1228503756),libspec__$1], null);
}
}
});
cljs.analyzer.impl.namespaces.check_as_alias_duplicates = (function cljs$analyzer$impl$namespaces$check_as_alias_duplicates(as_aliases,new_as_aliases){
var seq__40584 = cljs.core.seq(new_as_aliases);
var chunk__40585 = null;
var count__40586 = (0);
var i__40587 = (0);
while(true){
if((i__40587 < count__40586)){
var vec__40620 = chunk__40585.cljs$core$IIndexed$_nth$arity$2(null,i__40587);
var alias = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__40620,(0),null);
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__40620,(1),null);
if((!(cljs.core.contains_QMARK_(as_aliases,alias)))){
} else {
throw (new Error(["Assert failed: ",["Duplicate :as-alias ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(alias),", already in use for lib ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.get.cljs$core$IFn$_invoke$arity$2(as_aliases,alias))].join(''),"\n","(not (contains? as-aliases alias))"].join('')));
}


var G__40676 = seq__40584;
var G__40677 = chunk__40585;
var G__40678 = count__40586;
var G__40679 = (i__40587 + (1));
seq__40584 = G__40676;
chunk__40585 = G__40677;
count__40586 = G__40678;
i__40587 = G__40679;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__40584);
if(temp__5804__auto__){
var seq__40584__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__40584__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__40584__$1);
var G__40683 = cljs.core.chunk_rest(seq__40584__$1);
var G__40684 = c__5525__auto__;
var G__40685 = cljs.core.count(c__5525__auto__);
var G__40686 = (0);
seq__40584 = G__40683;
chunk__40585 = G__40684;
count__40586 = G__40685;
i__40587 = G__40686;
continue;
} else {
var vec__40634 = cljs.core.first(seq__40584__$1);
var alias = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__40634,(0),null);
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__40634,(1),null);
if((!(cljs.core.contains_QMARK_(as_aliases,alias)))){
} else {
throw (new Error(["Assert failed: ",["Duplicate :as-alias ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(alias),", already in use for lib ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.get.cljs$core$IFn$_invoke$arity$2(as_aliases,alias))].join(''),"\n","(not (contains? as-aliases alias))"].join('')));
}


var G__40687 = cljs.core.next(seq__40584__$1);
var G__40688 = null;
var G__40689 = (0);
var G__40690 = (0);
seq__40584 = G__40687;
chunk__40585 = G__40688;
count__40586 = G__40689;
i__40587 = G__40690;
continue;
}
} else {
return null;
}
}
break;
}
});
/**
 * Given libspecs, elide all :as-alias. Return a map of :libspecs (filtered)
 * and :as-aliases.
 */
cljs.analyzer.impl.namespaces.elide_aliases_from_libspecs = (function cljs$analyzer$impl$namespaces$elide_aliases_from_libspecs(var_args){
var G__40647 = arguments.length;
switch (G__40647) {
case 1:
return cljs.analyzer.impl.namespaces.elide_aliases_from_libspecs.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return cljs.analyzer.impl.namespaces.elide_aliases_from_libspecs.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(cljs.analyzer.impl.namespaces.elide_aliases_from_libspecs.cljs$core$IFn$_invoke$arity$1 = (function (libspecs){
return cljs.analyzer.impl.namespaces.elide_aliases_from_libspecs.cljs$core$IFn$_invoke$arity$2(libspecs,cljs.core.PersistentArrayMap.EMPTY);
}));

(cljs.analyzer.impl.namespaces.elide_aliases_from_libspecs.cljs$core$IFn$_invoke$arity$2 = (function (libspecs,as_aliases){
var ret = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"as-aliases","as-aliases",1485064798),as_aliases,new cljs.core.Keyword(null,"libspecs","libspecs",59807195),cljs.core.PersistentVector.EMPTY], null);
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (ret__$1,libspec){
var map__40649 = cljs.analyzer.impl.namespaces.check_and_remove_as_alias(libspec);
var map__40649__$1 = cljs.core.__destructure_map(map__40649);
var as_alias = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__40649__$1,new cljs.core.Keyword(null,"as-alias","as-alias",82482467));
var libspec__$1 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__40649__$1,new cljs.core.Keyword(null,"libspec","libspec",1228503756));
cljs.analyzer.impl.namespaces.check_as_alias_duplicates(new cljs.core.Keyword(null,"as-aliases","as-aliases",1485064798).cljs$core$IFn$_invoke$arity$1(ret__$1),as_alias);

var G__40652 = ret__$1;
var G__40652__$1 = (cljs.core.truth_(libspec__$1)?cljs.core.update.cljs$core$IFn$_invoke$arity$4(G__40652,new cljs.core.Keyword(null,"libspecs","libspecs",59807195),cljs.core.conj,libspec__$1):G__40652);
if(cljs.core.truth_(as_alias)){
return cljs.core.update.cljs$core$IFn$_invoke$arity$4(G__40652__$1,new cljs.core.Keyword(null,"as-aliases","as-aliases",1485064798),cljs.core.merge,as_alias);
} else {
return G__40652__$1;
}
}),ret,libspecs);
}));

(cljs.analyzer.impl.namespaces.elide_aliases_from_libspecs.cljs$lang$maxFixedArity = 2);

cljs.analyzer.impl.namespaces.elide_aliases_from_ns_specs = (function cljs$analyzer$impl$namespaces$elide_aliases_from_ns_specs(ns_specs){

var ret = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"as-aliases","as-aliases",1485064798),cljs.core.PersistentArrayMap.EMPTY,new cljs.core.Keyword(null,"libspecs","libspecs",59807195),cljs.core.PersistentVector.EMPTY], null);
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (p__40653,p__40654){
var map__40656 = p__40653;
var map__40656__$1 = cljs.core.__destructure_map(map__40656);
var ret__$1 = map__40656__$1;
var as_aliases = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__40656__$1,new cljs.core.Keyword(null,"as-aliases","as-aliases",1485064798));
var vec__40657 = p__40654;
var seq__40658 = cljs.core.seq(vec__40657);
var first__40659 = cljs.core.first(seq__40658);
var seq__40658__$1 = cljs.core.next(seq__40658);
var spec_key = first__40659;
var libspecs = seq__40658__$1;
if((!(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"refer-clojure","refer-clojure",813784440),spec_key)))){
var map__40661 = cljs.analyzer.impl.namespaces.elide_aliases_from_libspecs.cljs$core$IFn$_invoke$arity$2(libspecs,as_aliases);
var map__40661__$1 = cljs.core.__destructure_map(map__40661);
var as_aliases__$1 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__40661__$1,new cljs.core.Keyword(null,"as-aliases","as-aliases",1485064798));
var libspecs__$1 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__40661__$1,new cljs.core.Keyword(null,"libspecs","libspecs",59807195));
var G__40662 = ret__$1;
var G__40662__$1 = (((!(cljs.core.empty_QMARK_(as_aliases__$1))))?cljs.core.update.cljs$core$IFn$_invoke$arity$4(G__40662,new cljs.core.Keyword(null,"as-aliases","as-aliases",1485064798),cljs.core.merge,as_aliases__$1):G__40662);
if((!(cljs.core.empty_QMARK_(libspecs__$1)))){
return cljs.core.update.cljs$core$IFn$_invoke$arity$4(G__40662__$1,new cljs.core.Keyword(null,"libspecs","libspecs",59807195),cljs.core.conj,cljs.core.list_STAR_.cljs$core$IFn$_invoke$arity$2(spec_key,libspecs__$1));
} else {
return G__40662__$1;
}
} else {
return cljs.core.update.cljs$core$IFn$_invoke$arity$4(ret__$1,new cljs.core.Keyword(null,"libspecs","libspecs",59807195),cljs.core.conj,cljs.core.list_STAR_.cljs$core$IFn$_invoke$arity$2(spec_key,libspecs));
}
}),ret,ns_specs);
});

//# sourceMappingURL=cljs.analyzer.impl.namespaces.js.map
