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
var vec__51841 = libspec;
var seq__51842 = cljs.core.seq(vec__51841);
var first__51843 = cljs.core.first(seq__51842);
var seq__51842__$1 = cljs.core.next(seq__51842);
var lib = first__51843;
var spec = seq__51842__$1;
var libspec__$1 = vec__51841;
var vec__51844 = cljs.core.split_with(cljs.core.complement(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"as-alias","as-alias",82482467),null], null), null)),spec);
var pre_spec = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__51844,(0),null);
var vec__51847 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__51844,(1),null);
var seq__51848 = cljs.core.seq(vec__51847);
var first__51849 = cljs.core.first(seq__51848);
var seq__51848__$1 = cljs.core.next(seq__51848);
var _ = first__51849;
var first__51849__$1 = cljs.core.first(seq__51848__$1);
var seq__51848__$2 = cljs.core.next(seq__51848__$1);
var alias = first__51849__$1;
var post_spec = seq__51848__$2;
var post = vec__51847;
if(cljs.core.seq(post)){
var libspec_SINGLEQUOTE_ = cljs.core.into.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [lib], null),cljs.core.concat.cljs$core$IFn$_invoke$arity$2(pre_spec,post_spec));
if((alias instanceof cljs.core.Symbol)){
} else {
throw (new Error(["Assert failed: ",[":as-alias must be followed by a symbol, got: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(alias)].join(''),"\n","(symbol? alias)"].join('')));
}

var G__51854 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"as-alias","as-alias",82482467),cljs.core.PersistentArrayMap.createAsIfByAssoc([alias,lib])], null);
if((cljs.core.count(libspec_SINGLEQUOTE_) > (1))){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__51854,new cljs.core.Keyword(null,"libspec","libspec",1228503756),libspec_SINGLEQUOTE_);
} else {
return G__51854;
}
} else {
return new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"libspec","libspec",1228503756),libspec__$1], null);
}
}
});
cljs.analyzer.impl.namespaces.check_as_alias_duplicates = (function cljs$analyzer$impl$namespaces$check_as_alias_duplicates(as_aliases,new_as_aliases){
var seq__51864 = cljs.core.seq(new_as_aliases);
var chunk__51865 = null;
var count__51866 = (0);
var i__51867 = (0);
while(true){
if((i__51867 < count__51866)){
var vec__51881 = chunk__51865.cljs$core$IIndexed$_nth$arity$2(null,i__51867);
var alias = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__51881,(0),null);
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__51881,(1),null);
if((!(cljs.core.contains_QMARK_(as_aliases,alias)))){
} else {
throw (new Error(["Assert failed: ",["Duplicate :as-alias ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(alias),", already in use for lib ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.get.cljs$core$IFn$_invoke$arity$2(as_aliases,alias))].join(''),"\n","(not (contains? as-aliases alias))"].join('')));
}


var G__51970 = seq__51864;
var G__51971 = chunk__51865;
var G__51972 = count__51866;
var G__51973 = (i__51867 + (1));
seq__51864 = G__51970;
chunk__51865 = G__51971;
count__51866 = G__51972;
i__51867 = G__51973;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__51864);
if(temp__5804__auto__){
var seq__51864__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__51864__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__51864__$1);
var G__51974 = cljs.core.chunk_rest(seq__51864__$1);
var G__51975 = c__5525__auto__;
var G__51976 = cljs.core.count(c__5525__auto__);
var G__51977 = (0);
seq__51864 = G__51974;
chunk__51865 = G__51975;
count__51866 = G__51976;
i__51867 = G__51977;
continue;
} else {
var vec__51885 = cljs.core.first(seq__51864__$1);
var alias = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__51885,(0),null);
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__51885,(1),null);
if((!(cljs.core.contains_QMARK_(as_aliases,alias)))){
} else {
throw (new Error(["Assert failed: ",["Duplicate :as-alias ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(alias),", already in use for lib ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.get.cljs$core$IFn$_invoke$arity$2(as_aliases,alias))].join(''),"\n","(not (contains? as-aliases alias))"].join('')));
}


var G__51978 = cljs.core.next(seq__51864__$1);
var G__51979 = null;
var G__51980 = (0);
var G__51981 = (0);
seq__51864 = G__51978;
chunk__51865 = G__51979;
count__51866 = G__51980;
i__51867 = G__51981;
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
var G__51895 = arguments.length;
switch (G__51895) {
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
var map__51905 = cljs.analyzer.impl.namespaces.check_and_remove_as_alias(libspec);
var map__51905__$1 = cljs.core.__destructure_map(map__51905);
var as_alias = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__51905__$1,new cljs.core.Keyword(null,"as-alias","as-alias",82482467));
var libspec__$1 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__51905__$1,new cljs.core.Keyword(null,"libspec","libspec",1228503756));
cljs.analyzer.impl.namespaces.check_as_alias_duplicates(new cljs.core.Keyword(null,"as-aliases","as-aliases",1485064798).cljs$core$IFn$_invoke$arity$1(ret__$1),as_alias);

var G__51915 = ret__$1;
var G__51915__$1 = (cljs.core.truth_(libspec__$1)?cljs.core.update.cljs$core$IFn$_invoke$arity$4(G__51915,new cljs.core.Keyword(null,"libspecs","libspecs",59807195),cljs.core.conj,libspec__$1):G__51915);
if(cljs.core.truth_(as_alias)){
return cljs.core.update.cljs$core$IFn$_invoke$arity$4(G__51915__$1,new cljs.core.Keyword(null,"as-aliases","as-aliases",1485064798),cljs.core.merge,as_alias);
} else {
return G__51915__$1;
}
}),ret,libspecs);
}));

(cljs.analyzer.impl.namespaces.elide_aliases_from_libspecs.cljs$lang$maxFixedArity = 2);

cljs.analyzer.impl.namespaces.elide_aliases_from_ns_specs = (function cljs$analyzer$impl$namespaces$elide_aliases_from_ns_specs(ns_specs){

var ret = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"as-aliases","as-aliases",1485064798),cljs.core.PersistentArrayMap.EMPTY,new cljs.core.Keyword(null,"libspecs","libspecs",59807195),cljs.core.PersistentVector.EMPTY], null);
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (p__51935,p__51936){
var map__51937 = p__51935;
var map__51937__$1 = cljs.core.__destructure_map(map__51937);
var ret__$1 = map__51937__$1;
var as_aliases = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__51937__$1,new cljs.core.Keyword(null,"as-aliases","as-aliases",1485064798));
var vec__51938 = p__51936;
var seq__51939 = cljs.core.seq(vec__51938);
var first__51940 = cljs.core.first(seq__51939);
var seq__51939__$1 = cljs.core.next(seq__51939);
var spec_key = first__51940;
var libspecs = seq__51939__$1;
if((!(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"refer-clojure","refer-clojure",813784440),spec_key)))){
var map__51946 = cljs.analyzer.impl.namespaces.elide_aliases_from_libspecs.cljs$core$IFn$_invoke$arity$2(libspecs,as_aliases);
var map__51946__$1 = cljs.core.__destructure_map(map__51946);
var as_aliases__$1 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__51946__$1,new cljs.core.Keyword(null,"as-aliases","as-aliases",1485064798));
var libspecs__$1 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__51946__$1,new cljs.core.Keyword(null,"libspecs","libspecs",59807195));
var G__51950 = ret__$1;
var G__51950__$1 = (((!(cljs.core.empty_QMARK_(as_aliases__$1))))?cljs.core.update.cljs$core$IFn$_invoke$arity$4(G__51950,new cljs.core.Keyword(null,"as-aliases","as-aliases",1485064798),cljs.core.merge,as_aliases__$1):G__51950);
if((!(cljs.core.empty_QMARK_(libspecs__$1)))){
return cljs.core.update.cljs$core$IFn$_invoke$arity$4(G__51950__$1,new cljs.core.Keyword(null,"libspecs","libspecs",59807195),cljs.core.conj,cljs.core.list_STAR_.cljs$core$IFn$_invoke$arity$2(spec_key,libspecs__$1));
} else {
return G__51950__$1;
}
} else {
return cljs.core.update.cljs$core$IFn$_invoke$arity$4(ret__$1,new cljs.core.Keyword(null,"libspecs","libspecs",59807195),cljs.core.conj,cljs.core.list_STAR_.cljs$core$IFn$_invoke$arity$2(spec_key,libspecs));
}
}),ret,ns_specs);
});

//# sourceMappingURL=cljs.analyzer.impl.namespaces.js.map
