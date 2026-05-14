goog.provide('cljs.analyzer');
cljs.analyzer._STAR_cljs_ns_STAR_ = new cljs.core.Symbol(null,"cljs.user","cljs.user",877795071,null);
cljs.analyzer._STAR_cljs_file_STAR_ = null;
cljs.analyzer._STAR_checked_arrays_STAR_ = false;
cljs.analyzer._STAR_check_alias_dupes_STAR_ = true;
cljs.analyzer._STAR_cljs_static_fns_STAR_ = false;
cljs.analyzer._STAR_fn_invoke_direct_STAR_ = false;
cljs.analyzer._STAR_cljs_macros_path_STAR_ = "/cljs/core";
cljs.analyzer._STAR_cljs_macros_is_classpath_STAR_ = true;
cljs.analyzer._STAR_cljs_dep_set_STAR_ = cljs.core.with_meta(cljs.core.PersistentHashSet.EMPTY,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"dep-path","dep-path",723826558),cljs.core.PersistentVector.EMPTY], null));
cljs.analyzer._STAR_analyze_deps_STAR_ = true;
cljs.analyzer._STAR_load_tests_STAR_ = true;
cljs.analyzer._STAR_load_macros_STAR_ = true;
cljs.analyzer._STAR_reload_macros_STAR_ = false;
cljs.analyzer._STAR_macro_infer_STAR_ = true;
cljs.analyzer._STAR_passes_STAR_ = null;
cljs.analyzer._STAR_file_defs_STAR_ = null;
cljs.analyzer._STAR_private_var_access_nowarn_STAR_ = false;
/**
 * The namespace of the constants table as a symbol.
 */
cljs.analyzer.constants_ns_sym = new cljs.core.Symbol(null,"cljs.core.constants","cljs.core.constants",2057417066,null);
cljs.analyzer._STAR_verbose_STAR_ = false;
cljs.analyzer._cljs_macros_loaded = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(false);
cljs.analyzer._STAR_cljs_warnings_STAR_ = cljs.core.PersistentHashMap.fromArrays([new cljs.core.Keyword(null,"invoke-ctor","invoke-ctor",-756052704),new cljs.core.Keyword(null,"extending-base-js-type","extending-base-js-type",432787264),new cljs.core.Keyword(null,"unsupported-preprocess-value","unsupported-preprocess-value",1635147105),new cljs.core.Keyword(null,"redef","redef",1032704258),new cljs.core.Keyword(null,"js-shadowed-by-local","js-shadowed-by-local",198048291),new cljs.core.Keyword(null,"unsupported-js-module-type","unsupported-js-module-type",1806206180),new cljs.core.Keyword(null,"invalid-protocol-symbol","invalid-protocol-symbol",86246948),new cljs.core.Keyword(null,"private-var-access","private-var-access",967536101),new cljs.core.Keyword(null,"protocol-duped-method","protocol-duped-method",15128166),new cljs.core.Keyword(null,"munged-namespace","munged-namespace",-101986199),new cljs.core.Keyword(null,"single-segment-namespace","single-segment-namespace",-491924469),new cljs.core.Keyword(null,"fn-arity","fn-arity",-403576501),new cljs.core.Keyword(null,"infer-warning","infer-warning",-1600671410),new cljs.core.Keyword(null,"variadic-max-arity","variadic-max-arity",-14288402),new cljs.core.Keyword(null,"protocol-with-variadic-method","protocol-with-variadic-method",-693368178),new cljs.core.Keyword(null,"fn-deprecated","fn-deprecated",626877647),new cljs.core.Keyword(null,"undeclared-var","undeclared-var",-1624364944),new cljs.core.Keyword(null,"declared-arglists-mismatch","declared-arglists-mismatch",-496878383),new cljs.core.Keyword(null,"preamble-missing","preamble-missing",220974801),new cljs.core.Keyword(null,"undeclared-protocol-symbol","undeclared-protocol-symbol",462882867),new cljs.core.Keyword(null,"protocol-with-overwriting-method","protocol-with-overwriting-method",319993011),new cljs.core.Keyword(null,"dynamic","dynamic",704819571),new cljs.core.Keyword(null,"invalid-array-access","invalid-array-access",-1747132236),new cljs.core.Keyword(null,"unprovided","unprovided",-652330764),new cljs.core.Keyword(null,"ns-var-clash","ns-var-clash",-280494668),new cljs.core.Keyword(null,"undeclared-ns","undeclared-ns",-1589012812),new cljs.core.Keyword(null,"non-dynamic-earmuffed-var","non-dynamic-earmuffed-var",-202005643),new cljs.core.Keyword(null,"undeclared-ns-form","undeclared-ns-form",-248024137),new cljs.core.Keyword(null,"invalid-arithmetic","invalid-arithmetic",1917075065),new cljs.core.Keyword(null,"protocol-deprecated","protocol-deprecated",103233497),new cljs.core.Keyword(null,"fn-var","fn-var",1086204730),new cljs.core.Keyword(null,"protocol-impl-recur-with-target","protocol-impl-recur-with-target",-1648321574),new cljs.core.Keyword(null,"overload-arity","overload-arity",823206044),new cljs.core.Keyword(null,"protocol-multiple-impls","protocol-multiple-impls",794179260),new cljs.core.Keyword(null,"redef-in-file","redef-in-file",-476530788),new cljs.core.Keyword(null,"protocol-invalid-method","protocol-invalid-method",522647516),new cljs.core.Keyword(null,"extend-type-invalid-method-shape","extend-type-invalid-method-shape",1424103549),new cljs.core.Keyword(null,"multiple-variadic-overloads","multiple-variadic-overloads",1110059837),new cljs.core.Keyword(null,"protocol-impl-with-variadic-method","protocol-impl-with-variadic-method",-319321217)],[true,true,true,true,true,true,true,true,true,true,true,true,false,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true]);
cljs.analyzer.unchecked_arrays_QMARK_ = (function cljs$analyzer$unchecked_arrays_QMARK_(){
return cljs.core._STAR_unchecked_arrays_STAR_;
});
cljs.analyzer.compiler_options = (function cljs$analyzer$compiler_options(){
return cljs.core.get.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(cljs.env._STAR_compiler_STAR_),new cljs.core.Keyword(null,"options","options",99638489));
});
cljs.analyzer.get_externs = (function cljs$analyzer$get_externs(){
return new cljs.core.Keyword("cljs.analyzer","externs","cljs.analyzer/externs",893359239).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(cljs.env._STAR_compiler_STAR_));
});
/**
 * Returns false-y, :warn, or :error based on configuration and the
 * current value of *unchecked-arrays*.
 */
cljs.analyzer.checked_arrays = (function cljs$analyzer$checked_arrays(){
if(((cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"advanced","advanced",-451287892),new cljs.core.Keyword(null,"optimizations","optimizations",-2047476854).cljs$core$IFn$_invoke$arity$1(cljs.analyzer.compiler_options()))) && ((!(cljs.core._STAR_unchecked_arrays_STAR_))))){
return cljs.analyzer._STAR_checked_arrays_STAR_;
} else {
return null;
}
});
cljs.analyzer.js_reserved = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 63, ["typeof",null,"float",null,"implements",null,"else",null,"boolean",null,"abstract",null,"int",null,"static",null,"package",null,"this",null,"await",null,"yield",null,"interface",null,"void",null,"delete",null,"class",null,"export",null,"var",null,"try",null,"long",null,"null",null,"return",null,"methods",null,"native",null,"private",null,"new",null,"for",null,"catch",null,"extends",null,"short",null,"protected",null,"throws",null,"synchronized",null,"transient",null,"super",null,"if",null,"let",null,"import",null,"char",null,"switch",null,"const",null,"case",null,"break",null,"volatile",null,"function",null,"continue",null,"final",null,"do",null,"double",null,"while",null,"public",null,"arguments",null,"debugger",null,"with",null,"instanceof",null,"default",null,"throw",null,"goto",null,"finally",null,"byte",null,"constructor",null,"in",null,"enum",null], null), null);
cljs.analyzer.es5_allowed = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 1, ["default",null], null), null);
cljs.analyzer.SENTINEL = ({});
cljs.analyzer.gets = (function cljs$analyzer$gets(var_args){
var G__43531 = arguments.length;
switch (G__43531) {
case 3:
return cljs.analyzer.gets.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
case 4:
return cljs.analyzer.gets.cljs$core$IFn$_invoke$arity$4((arguments[(0)]),(arguments[(1)]),(arguments[(2)]),(arguments[(3)]));

break;
case 5:
return cljs.analyzer.gets.cljs$core$IFn$_invoke$arity$5((arguments[(0)]),(arguments[(1)]),(arguments[(2)]),(arguments[(3)]),(arguments[(4)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(cljs.analyzer.gets.cljs$core$IFn$_invoke$arity$3 = (function (m,k0,k1){
var m__$1 = cljs.core.get.cljs$core$IFn$_invoke$arity$3(m,k0,cljs.analyzer.SENTINEL);
if((m__$1 === cljs.analyzer.SENTINEL)){
return null;
} else {
return cljs.core.get.cljs$core$IFn$_invoke$arity$2(m__$1,k1);
}
}));

(cljs.analyzer.gets.cljs$core$IFn$_invoke$arity$4 = (function (m,k0,k1,k2){
var m__$1 = cljs.core.get.cljs$core$IFn$_invoke$arity$3(m,k0,cljs.analyzer.SENTINEL);
if((m__$1 === cljs.analyzer.SENTINEL)){
return null;
} else {
var m__$2 = cljs.core.get.cljs$core$IFn$_invoke$arity$3(m__$1,k1,cljs.analyzer.SENTINEL);
if((m__$2 === cljs.analyzer.SENTINEL)){
return null;
} else {
return cljs.core.get.cljs$core$IFn$_invoke$arity$2(m__$2,k2);
}
}
}));

(cljs.analyzer.gets.cljs$core$IFn$_invoke$arity$5 = (function (m,k0,k1,k2,k3){
var m__$1 = cljs.core.get.cljs$core$IFn$_invoke$arity$3(m,k0,cljs.analyzer.SENTINEL);
if((m__$1 === cljs.analyzer.SENTINEL)){
return null;
} else {
var m__$2 = cljs.core.get.cljs$core$IFn$_invoke$arity$3(m__$1,k1,cljs.analyzer.SENTINEL);
if((m__$2 === cljs.analyzer.SENTINEL)){
return null;
} else {
var m__$3 = cljs.core.get.cljs$core$IFn$_invoke$arity$3(m__$2,k2,cljs.analyzer.SENTINEL);
if((m__$3 === cljs.analyzer.SENTINEL)){
return null;
} else {
return cljs.core.get.cljs$core$IFn$_invoke$arity$2(m__$3,k3);
}
}
}
}));

(cljs.analyzer.gets.cljs$lang$maxFixedArity = 5);

cljs.analyzer.munge_path = (function cljs$analyzer$munge_path(ss){
return cljs.core.munge(cljs.core.str.cljs$core$IFn$_invoke$arity$1(ss));
});
/**
 * Given a namespace as a symbol return the relative path. May optionally
 *   provide the file extension, defaults to :cljs.
 */
cljs.analyzer.ns__GT_relpath = (function cljs$analyzer$ns__GT_relpath(var_args){
var G__43552 = arguments.length;
switch (G__43552) {
case 1:
return cljs.analyzer.ns__GT_relpath.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return cljs.analyzer.ns__GT_relpath.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(cljs.analyzer.ns__GT_relpath.cljs$core$IFn$_invoke$arity$1 = (function (ns){
return cljs.analyzer.ns__GT_relpath.cljs$core$IFn$_invoke$arity$2(ns,new cljs.core.Keyword(null,"cljs","cljs",1492417629));
}));

(cljs.analyzer.ns__GT_relpath.cljs$core$IFn$_invoke$arity$2 = (function (ns,ext){
return [clojure.string.replace(cljs.analyzer.munge_path(ns),".","/"),".",cljs.core.name(ext)].join('');
}));

(cljs.analyzer.ns__GT_relpath.cljs$lang$maxFixedArity = 2);

cljs.analyzer.topo_sort = (function cljs$analyzer$topo_sort(var_args){
var G__43563 = arguments.length;
switch (G__43563) {
case 2:
return cljs.analyzer.topo_sort.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 4:
return cljs.analyzer.topo_sort.cljs$core$IFn$_invoke$arity$4((arguments[(0)]),(arguments[(1)]),(arguments[(2)]),(arguments[(3)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(cljs.analyzer.topo_sort.cljs$core$IFn$_invoke$arity$2 = (function (x,get_deps){
return cljs.analyzer.topo_sort.cljs$core$IFn$_invoke$arity$4(x,(0),cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.sorted_map()),cljs.core.memoize(get_deps));
}));

(cljs.analyzer.topo_sort.cljs$core$IFn$_invoke$arity$4 = (function (x,depth,state,memo_get_deps){
var deps = (memo_get_deps.cljs$core$IFn$_invoke$arity$1 ? memo_get_deps.cljs$core$IFn$_invoke$arity$1(x) : memo_get_deps.call(null,x));
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$variadic(state,cljs.core.update_in,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [depth], null),cljs.core.fnil.cljs$core$IFn$_invoke$arity$2(cljs.core.into,cljs.core.PersistentHashSet.EMPTY),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([deps], 0));

var seq__43575_47940 = cljs.core.seq(deps);
var chunk__43576_47941 = null;
var count__43577_47942 = (0);
var i__43578_47943 = (0);
while(true){
if((i__43578_47943 < count__43577_47942)){
var dep_47945 = chunk__43576_47941.cljs$core$IIndexed$_nth$arity$2(null,i__43578_47943);
cljs.analyzer.topo_sort.cljs$core$IFn$_invoke$arity$4(dep_47945,(depth + (1)),state,memo_get_deps);


var G__47946 = seq__43575_47940;
var G__47947 = chunk__43576_47941;
var G__47948 = count__43577_47942;
var G__47949 = (i__43578_47943 + (1));
seq__43575_47940 = G__47946;
chunk__43576_47941 = G__47947;
count__43577_47942 = G__47948;
i__43578_47943 = G__47949;
continue;
} else {
var temp__5804__auto___47950 = cljs.core.seq(seq__43575_47940);
if(temp__5804__auto___47950){
var seq__43575_47952__$1 = temp__5804__auto___47950;
if(cljs.core.chunked_seq_QMARK_(seq__43575_47952__$1)){
var c__5525__auto___47953 = cljs.core.chunk_first(seq__43575_47952__$1);
var G__47954 = cljs.core.chunk_rest(seq__43575_47952__$1);
var G__47955 = c__5525__auto___47953;
var G__47956 = cljs.core.count(c__5525__auto___47953);
var G__47957 = (0);
seq__43575_47940 = G__47954;
chunk__43576_47941 = G__47955;
count__43577_47942 = G__47956;
i__43578_47943 = G__47957;
continue;
} else {
var dep_47958 = cljs.core.first(seq__43575_47952__$1);
cljs.analyzer.topo_sort.cljs$core$IFn$_invoke$arity$4(dep_47958,(depth + (1)),state,memo_get_deps);


var G__47959 = cljs.core.next(seq__43575_47952__$1);
var G__47960 = null;
var G__47961 = (0);
var G__47962 = (0);
seq__43575_47940 = G__47959;
chunk__43576_47941 = G__47960;
count__43577_47942 = G__47961;
i__43578_47943 = G__47962;
continue;
}
} else {
}
}
break;
}

var seq__43590_47963 = cljs.core.seq(cljs.core.subseq.cljs$core$IFn$_invoke$arity$3(cljs.core.deref(state),cljs.core._LT_,depth));
var chunk__43591_47964 = null;
var count__43592_47965 = (0);
var i__43593_47966 = (0);
while(true){
if((i__43593_47966 < count__43592_47965)){
var vec__43626_47967 = chunk__43591_47964.cljs$core$IIndexed$_nth$arity$2(null,i__43593_47966);
var _LT_depth_47968 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__43626_47967,(0),null);
var __47969 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__43626_47967,(1),null);
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$variadic(state,cljs.core.update_in,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [_LT_depth_47968], null),clojure.set.difference,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([deps], 0));


var G__47970 = seq__43590_47963;
var G__47971 = chunk__43591_47964;
var G__47972 = count__43592_47965;
var G__47973 = (i__43593_47966 + (1));
seq__43590_47963 = G__47970;
chunk__43591_47964 = G__47971;
count__43592_47965 = G__47972;
i__43593_47966 = G__47973;
continue;
} else {
var temp__5804__auto___47974 = cljs.core.seq(seq__43590_47963);
if(temp__5804__auto___47974){
var seq__43590_47975__$1 = temp__5804__auto___47974;
if(cljs.core.chunked_seq_QMARK_(seq__43590_47975__$1)){
var c__5525__auto___47976 = cljs.core.chunk_first(seq__43590_47975__$1);
var G__47977 = cljs.core.chunk_rest(seq__43590_47975__$1);
var G__47978 = c__5525__auto___47976;
var G__47979 = cljs.core.count(c__5525__auto___47976);
var G__47980 = (0);
seq__43590_47963 = G__47977;
chunk__43591_47964 = G__47978;
count__43592_47965 = G__47979;
i__43593_47966 = G__47980;
continue;
} else {
var vec__43632_47981 = cljs.core.first(seq__43590_47975__$1);
var _LT_depth_47982 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__43632_47981,(0),null);
var __47983 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__43632_47981,(1),null);
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$variadic(state,cljs.core.update_in,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [_LT_depth_47982], null),clojure.set.difference,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([deps], 0));


var G__47984 = cljs.core.next(seq__43590_47975__$1);
var G__47985 = null;
var G__47986 = (0);
var G__47987 = (0);
seq__43590_47963 = G__47984;
chunk__43591_47964 = G__47985;
count__43592_47965 = G__47986;
i__43593_47966 = G__47987;
continue;
}
} else {
}
}
break;
}

if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(depth,(0))){
return cljs.core.distinct.cljs$core$IFn$_invoke$arity$1(cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core.concat,cljs.core.vals(cljs.core.deref(state))));
} else {
return null;
}
}));

(cljs.analyzer.topo_sort.cljs$lang$maxFixedArity = 4);


cljs.analyzer.ast_QMARK_ = (function cljs$analyzer$ast_QMARK_(x){
return ((cljs.core.map_QMARK_(x)) && (cljs.core.contains_QMARK_(x,new cljs.core.Keyword(null,"op","op",-1882987955))));
});
if((typeof cljs !== 'undefined') && (typeof cljs.analyzer !== 'undefined') && (typeof cljs.analyzer.error_message !== 'undefined')){
} else {
cljs.analyzer.error_message = (function (){var method_table__5599__auto__ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
var prefer_table__5600__auto__ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
var method_cache__5601__auto__ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
var cached_hierarchy__5602__auto__ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
var hierarchy__5603__auto__ = cljs.core.get.cljs$core$IFn$_invoke$arity$3(cljs.core.PersistentArrayMap.EMPTY,new cljs.core.Keyword(null,"hierarchy","hierarchy",-1053470341),(function (){var fexpr__43655 = cljs.core.get_global_hierarchy;
return (fexpr__43655.cljs$core$IFn$_invoke$arity$0 ? fexpr__43655.cljs$core$IFn$_invoke$arity$0() : fexpr__43655.call(null));
})());
return (new cljs.core.MultiFn(cljs.core.symbol.cljs$core$IFn$_invoke$arity$2("cljs.analyzer","error-message"),(function() { 
var G__47989__delegate = function (warning_type,_){
return warning_type;
};
var G__47989 = function (warning_type,var_args){
var _ = null;
if (arguments.length > 1) {
var G__47990__i = 0, G__47990__a = new Array(arguments.length -  1);
while (G__47990__i < G__47990__a.length) {G__47990__a[G__47990__i] = arguments[G__47990__i + 1]; ++G__47990__i;}
  _ = new cljs.core.IndexedSeq(G__47990__a,0,null);
} 
return G__47989__delegate.call(this,warning_type,_);};
G__47989.cljs$lang$maxFixedArity = 1;
G__47989.cljs$lang$applyTo = (function (arglist__47991){
var warning_type = cljs.core.first(arglist__47991);
var _ = cljs.core.rest(arglist__47991);
return G__47989__delegate(warning_type,_);
});
G__47989.cljs$core$IFn$_invoke$arity$variadic = G__47989__delegate;
return G__47989;
})()
,new cljs.core.Keyword(null,"default","default",-1987822328),hierarchy__5603__auto__,method_table__5599__auto__,prefer_table__5600__auto__,method_cache__5601__auto__,cached_hierarchy__5602__auto__));
})();
}
cljs.analyzer.error_message.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"preamble-missing","preamble-missing",220974801),(function (warning_type,info){
return ["Preamble resource file not found: ",clojure.string.join.cljs$core$IFn$_invoke$arity$2(" ",new cljs.core.Keyword(null,"missing","missing",362507769).cljs$core$IFn$_invoke$arity$1(info))].join('');
}));
cljs.analyzer.error_message.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"unprovided","unprovided",-652330764),(function (warning_type,info){
return ["Required namespace not provided for ",clojure.string.join.cljs$core$IFn$_invoke$arity$2(" ",new cljs.core.Keyword(null,"unprovided","unprovided",-652330764).cljs$core$IFn$_invoke$arity$1(info))].join('');
}));
cljs.analyzer.error_message.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"undeclared-var","undeclared-var",-1624364944),(function (warning_type,info){
return [(cljs.core.truth_(new cljs.core.Keyword(null,"macro-present?","macro-present?",-1397713205).cljs$core$IFn$_invoke$arity$1(info))?"Can't take value of macro ":"Use of undeclared Var "),cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"prefix","prefix",-265908465).cljs$core$IFn$_invoke$arity$1(info)),"/",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"suffix","suffix",367373057).cljs$core$IFn$_invoke$arity$1(info))].join('');
}));
cljs.analyzer.error_message.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"private-var-access","private-var-access",967536101),(function (warning_type,info){
return ["var: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"sym","sym",-1444860305).cljs$core$IFn$_invoke$arity$1(info))," is not public"].join('');
}));
cljs.analyzer.error_message.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"undeclared-ns","undeclared-ns",-1589012812),(function (warning_type,p__43686){
var map__43687 = p__43686;
var map__43687__$1 = cljs.core.__destructure_map(map__43687);
var info = map__43687__$1;
var ns_sym = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__43687__$1,new cljs.core.Keyword(null,"ns-sym","ns-sym",-1696101605));
var js_provide = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__43687__$1,new cljs.core.Keyword(null,"js-provide","js-provide",1052912493));
return ["No such namespace: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(ns_sym),", could not locate ",cljs.analyzer.ns__GT_relpath.cljs$core$IFn$_invoke$arity$2(ns_sym,new cljs.core.Keyword(null,"cljs","cljs",1492417629)),", ",cljs.analyzer.ns__GT_relpath.cljs$core$IFn$_invoke$arity$2(ns_sym,new cljs.core.Keyword(null,"cljc","cljc",-1728400583)),", or JavaScript source providing \"",cljs.core.str.cljs$core$IFn$_invoke$arity$1(js_provide),"\"",((clojure.string.includes_QMARK_(cljs.analyzer.ns__GT_relpath.cljs$core$IFn$_invoke$arity$1(ns_sym),"_"))?" (Please check that namespaces with dashes use underscores in the ClojureScript file name)":null)].join('');
}));
cljs.analyzer.error_message.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"undeclared-macros-ns","undeclared-macros-ns",-438029430),(function (warning_type,p__43711){
var map__43712 = p__43711;
var map__43712__$1 = cljs.core.__destructure_map(map__43712);
var info = map__43712__$1;
var ns_sym = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__43712__$1,new cljs.core.Keyword(null,"ns-sym","ns-sym",-1696101605));
var js_provide = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__43712__$1,new cljs.core.Keyword(null,"js-provide","js-provide",1052912493));
return ["No such macros namespace: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(ns_sym),", could not locate ",cljs.analyzer.ns__GT_relpath.cljs$core$IFn$_invoke$arity$2(ns_sym,new cljs.core.Keyword(null,"clj","clj",-660495428))," or ",cljs.analyzer.ns__GT_relpath.cljs$core$IFn$_invoke$arity$2(ns_sym,new cljs.core.Keyword(null,"cljc","cljc",-1728400583))].join('');
}));
cljs.analyzer.error_message.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"dynamic","dynamic",704819571),(function (warning_type,info){
return [cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"name","name",1843675177).cljs$core$IFn$_invoke$arity$1(info))," not declared ^:dynamic"].join('');
}));
cljs.analyzer.error_message.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"redef","redef",1032704258),(function (warning_type,info){
return [cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"sym","sym",-1444860305).cljs$core$IFn$_invoke$arity$1(info))," already refers to: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.symbol.cljs$core$IFn$_invoke$arity$2(cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"ns","ns",441598760).cljs$core$IFn$_invoke$arity$1(info)),cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"sym","sym",-1444860305).cljs$core$IFn$_invoke$arity$1(info))))," being replaced by: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.symbol.cljs$core$IFn$_invoke$arity$2(cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"ns-name","ns-name",-2077346323).cljs$core$IFn$_invoke$arity$1(info)),cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"sym","sym",-1444860305).cljs$core$IFn$_invoke$arity$1(info))))].join('');
}));
cljs.analyzer.error_message.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"redef-in-file","redef-in-file",-476530788),(function (warning_type,info){
return [cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"sym","sym",-1444860305).cljs$core$IFn$_invoke$arity$1(info))," at line ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"line","line",212345235).cljs$core$IFn$_invoke$arity$1(info))," is being replaced"].join('');
}));
cljs.analyzer.error_message.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"fn-var","fn-var",1086204730),(function (warning_type,info){
return [cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.symbol.cljs$core$IFn$_invoke$arity$2(cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"ns-name","ns-name",-2077346323).cljs$core$IFn$_invoke$arity$1(info)),cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"sym","sym",-1444860305).cljs$core$IFn$_invoke$arity$1(info))))," no longer fn, references are stale"].join('');
}));
cljs.analyzer.error_message.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"fn-arity","fn-arity",-403576501),(function (warning_type,info){
return ["Wrong number of args (",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"argc","argc",-1452839519).cljs$core$IFn$_invoke$arity$1(info)),") passed to ",cljs.core.str.cljs$core$IFn$_invoke$arity$1((function (){var or__5002__auto__ = new cljs.core.Keyword(null,"ctor","ctor",1750864802).cljs$core$IFn$_invoke$arity$1(info);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword(null,"name","name",1843675177).cljs$core$IFn$_invoke$arity$1(info);
}
})())].join('');
}));
cljs.analyzer.error_message.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"fn-deprecated","fn-deprecated",626877647),(function (warning_type,info){
return [cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"name","name",1843675177).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"info","info",-317069002).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"fexpr","fexpr",-122857150).cljs$core$IFn$_invoke$arity$1(info))))," is deprecated"].join('');
}));
cljs.analyzer.error_message.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"declared-arglists-mismatch","declared-arglists-mismatch",-496878383),(function (warning_type,info){
return [cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.symbol.cljs$core$IFn$_invoke$arity$2(cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"ns-name","ns-name",-2077346323).cljs$core$IFn$_invoke$arity$1(info)),cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"sym","sym",-1444860305).cljs$core$IFn$_invoke$arity$1(info))))," declared arglists ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"declared","declared",92336021).cljs$core$IFn$_invoke$arity$1(info))," mismatch defined arglists ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"defined","defined",-1805032318).cljs$core$IFn$_invoke$arity$1(info))].join('');
}));
cljs.analyzer.error_message.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"undeclared-ns-form","undeclared-ns-form",-248024137),(function (warning_type,info){
return ["Invalid :refer, ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"type","type",1174270348).cljs$core$IFn$_invoke$arity$1(info))," ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"lib","lib",191808726).cljs$core$IFn$_invoke$arity$1(info)),"/",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"sym","sym",-1444860305).cljs$core$IFn$_invoke$arity$1(info))," does not exist"].join('');
}));
cljs.analyzer.error_message.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"protocol-deprecated","protocol-deprecated",103233497),(function (warning_type,info){
return ["Protocol ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"protocol","protocol",652470118).cljs$core$IFn$_invoke$arity$1(info))," is deprecated"].join('');
}));
cljs.analyzer.error_message.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"undeclared-protocol-symbol","undeclared-protocol-symbol",462882867),(function (warning_type,info){
return ["Can't resolve protocol symbol ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"protocol","protocol",652470118).cljs$core$IFn$_invoke$arity$1(info))].join('');
}));
cljs.analyzer.error_message.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"invalid-protocol-symbol","invalid-protocol-symbol",86246948),(function (warning_type,info){
return ["Symbol ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"protocol","protocol",652470118).cljs$core$IFn$_invoke$arity$1(info))," is not a protocol"].join('');
}));
cljs.analyzer.error_message.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"protocol-invalid-method","protocol-invalid-method",522647516),(function (warning_type,info){
if(cljs.core.truth_(new cljs.core.Keyword(null,"no-such-method","no-such-method",1087422840).cljs$core$IFn$_invoke$arity$1(info))){
return ["Bad method signature in protocol implementation, ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"protocol","protocol",652470118).cljs$core$IFn$_invoke$arity$1(info))," does not declare method called ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"fname","fname",1500291491).cljs$core$IFn$_invoke$arity$1(info))].join('');
} else {
return ["Bad method signature in protocol implementation, ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"protocol","protocol",652470118).cljs$core$IFn$_invoke$arity$1(info))," ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"fname","fname",1500291491).cljs$core$IFn$_invoke$arity$1(info))," does not declare arity ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"invalid-arity","invalid-arity",1335461949).cljs$core$IFn$_invoke$arity$1(info))].join('');
}
}));
cljs.analyzer.error_message.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"protocol-duped-method","protocol-duped-method",15128166),(function (warning_type,info){
return ["Duplicated methods in protocol implementation ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"protocol","protocol",652470118).cljs$core$IFn$_invoke$arity$1(info))," ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"fname","fname",1500291491).cljs$core$IFn$_invoke$arity$1(info))].join('');
}));
cljs.analyzer.error_message.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"protocol-multiple-impls","protocol-multiple-impls",794179260),(function (warning_type,info){
return ["Protocol ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"protocol","protocol",652470118).cljs$core$IFn$_invoke$arity$1(info))," implemented multiple times"].join('');
}));
cljs.analyzer.error_message.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"protocol-with-variadic-method","protocol-with-variadic-method",-693368178),(function (warning_type,info){
return ["Protocol ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"protocol","protocol",652470118).cljs$core$IFn$_invoke$arity$1(info))," declares method ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"name","name",1843675177).cljs$core$IFn$_invoke$arity$1(info))," with variadic signature (&)"].join('');
}));
cljs.analyzer.error_message.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"protocol-with-overwriting-method","protocol-with-overwriting-method",319993011),(function (warning_type,info){
var overwritten_protocol = new cljs.core.Keyword(null,"protocol","protocol",652470118).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"existing","existing",-340796094).cljs$core$IFn$_invoke$arity$1(info));
return ["Protocol ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"protocol","protocol",652470118).cljs$core$IFn$_invoke$arity$1(info))," is overwriting ",(cljs.core.truth_(overwritten_protocol)?"method":"function")," ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"name","name",1843675177).cljs$core$IFn$_invoke$arity$1(info)),(cljs.core.truth_(overwritten_protocol)?[" of protocol ",cljs.core.name(overwritten_protocol)].join(''):null)].join('');
}));
cljs.analyzer.error_message.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"protocol-impl-with-variadic-method","protocol-impl-with-variadic-method",-319321217),(function (warning_type,info){
return ["Protocol ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"protocol","protocol",652470118).cljs$core$IFn$_invoke$arity$1(info))," implements method ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"name","name",1843675177).cljs$core$IFn$_invoke$arity$1(info))," with variadic signature (&)"].join('');
}));
cljs.analyzer.error_message.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"protocol-impl-recur-with-target","protocol-impl-recur-with-target",-1648321574),(function (warning_type,info){
return ["Ignoring target object \"",cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"form","form",-1624062471).cljs$core$IFn$_invoke$arity$1(info)], 0)),"\" passed in recur to protocol method head"].join('');
}));
cljs.analyzer.error_message.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"multiple-variadic-overloads","multiple-variadic-overloads",1110059837),(function (warning_type,info){
return [cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"name","name",1843675177).cljs$core$IFn$_invoke$arity$1(info)),": Can't have more than 1 variadic overload"].join('');
}));
cljs.analyzer.error_message.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"variadic-max-arity","variadic-max-arity",-14288402),(function (warning_type,info){
return [cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"name","name",1843675177).cljs$core$IFn$_invoke$arity$1(info)),": Can't have fixed arity function with more params than variadic function"].join('');
}));
cljs.analyzer.error_message.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"overload-arity","overload-arity",823206044),(function (warning_type,info){
return [cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"name","name",1843675177).cljs$core$IFn$_invoke$arity$1(info)),": Can't have 2 overloads with same arity"].join('');
}));
cljs.analyzer.error_message.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"extending-base-js-type","extending-base-js-type",432787264),(function (warning_type,info){
return ["Extending an existing JavaScript type - use a different symbol name ","instead of ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"current-symbol","current-symbol",-932381075).cljs$core$IFn$_invoke$arity$1(info))," e.g ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"suggested-symbol","suggested-symbol",-1329631875).cljs$core$IFn$_invoke$arity$1(info))].join('');
}));
cljs.analyzer.error_message.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"invalid-arithmetic","invalid-arithmetic",1917075065),(function (warning_type,info){
return [cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"js-op","js-op",-1046277897).cljs$core$IFn$_invoke$arity$1(info)),", all arguments must be numbers, got ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"types","types",590030639).cljs$core$IFn$_invoke$arity$1(info))," instead"].join('');
}));
cljs.analyzer.error_message.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"invalid-array-access","invalid-array-access",-1747132236),(function (warning_type,p__43778){
var map__43781 = p__43778;
var map__43781__$1 = cljs.core.__destructure_map(map__43781);
var name = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__43781__$1,new cljs.core.Keyword(null,"name","name",1843675177));
var types = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__43781__$1,new cljs.core.Keyword(null,"types","types",590030639));
var G__43782 = name;
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Symbol("cljs.core","checked-aget","cljs.core/checked-aget",24024561,null),G__43782)){
return ["cljs.core/aget, arguments must be an array followed by numeric indices, got ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(types)," instead",((((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Symbol(null,"object","object",-1179821820,null),cljs.core.first(types))) || (cljs.core.every_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Symbol(null,"string","string",-349010059,null),null], null), null),cljs.core.rest(types)))))?[" (consider ",((((2) === cljs.core.count(types)))?"goog.object/get":"goog.object/getValueByKeys")," for object access)"].join(''):null)].join('');
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Symbol("cljs.core","checked-aget'","cljs.core/checked-aget'",1960922245,null),G__43782)){
return ["cljs.core/aget, arguments must be an array followed by numeric indices, got ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(types)," instead",((((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Symbol(null,"object","object",-1179821820,null),cljs.core.first(types))) || (cljs.core.every_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Symbol(null,"string","string",-349010059,null),null], null), null),cljs.core.rest(types)))))?[" (consider ",((((2) === cljs.core.count(types)))?"goog.object/get":"goog.object/getValueByKeys")," for object access)"].join(''):null)].join('');
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Symbol("cljs.core","checked-aset","cljs.core/checked-aset",-2080232353,null),G__43782)){
return ["cljs.core/aset, arguments must be an array, followed by numeric indices, followed by a value, got ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(types)," instead",((((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Symbol(null,"object","object",-1179821820,null),cljs.core.first(types))) || (cljs.core.every_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Symbol(null,"string","string",-349010059,null),null], null), null),cljs.core.butlast(cljs.core.rest(types))))))?" (consider goog.object/set for object access)":null)].join('');
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Symbol("cljs.core","checked-aset'","cljs.core/checked-aset'",163859714,null),G__43782)){
return ["cljs.core/aset, arguments must be an array, followed by numeric indices, followed by a value, got ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(types)," instead",((((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Symbol(null,"object","object",-1179821820,null),cljs.core.first(types))) || (cljs.core.every_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Symbol(null,"string","string",-349010059,null),null], null), null),cljs.core.butlast(cljs.core.rest(types))))))?" (consider goog.object/set for object access)":null)].join('');
} else {
throw (new Error(["No matching clause: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(G__43782)].join('')));

}
}
}
}
}));
cljs.analyzer.error_message.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"invoke-ctor","invoke-ctor",-756052704),(function (warning_type,info){
return ["Cannot invoke type constructor ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"name","name",1843675177).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"info","info",-317069002).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"fexpr","fexpr",-122857150).cljs$core$IFn$_invoke$arity$1(info))))," as function "].join('');
}));
cljs.analyzer.error_message.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"single-segment-namespace","single-segment-namespace",-491924469),(function (warning_type,info){
return [cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"name","name",1843675177).cljs$core$IFn$_invoke$arity$1(info))," is a single segment namespace"].join('');
}));
cljs.analyzer.error_message.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"munged-namespace","munged-namespace",-101986199),(function (warning_type,p__43818){
var map__43819 = p__43818;
var map__43819__$1 = cljs.core.__destructure_map(map__43819);
var info = map__43819__$1;
var name = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__43819__$1,new cljs.core.Keyword(null,"name","name",1843675177));
var munged = cljs.core.munge(clojure.string.join.cljs$core$IFn$_invoke$arity$2(".",cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__43816_SHARP_){
if(cljs.core.truth_((cljs.analyzer.js_reserved.cljs$core$IFn$_invoke$arity$1 ? cljs.analyzer.js_reserved.cljs$core$IFn$_invoke$arity$1(p1__43816_SHARP_) : cljs.analyzer.js_reserved.call(null,p1__43816_SHARP_)))){
return [cljs.core.str.cljs$core$IFn$_invoke$arity$1(p1__43816_SHARP_),"$"].join('');
} else {
return p1__43816_SHARP_;
}
}),clojure.string.split.cljs$core$IFn$_invoke$arity$2(cljs.core.name(name),/\./))));
return ["Namespace ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(name)," contains a reserved JavaScript keyword,"," the corresponding Google Closure namespace will be munged to ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(munged)].join('');
}));
cljs.analyzer.error_message.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"ns-var-clash","ns-var-clash",-280494668),(function (warning_type,p__43823){
var map__43827 = p__43823;
var map__43827__$1 = cljs.core.__destructure_map(map__43827);
var info = map__43827__$1;
var ns = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__43827__$1,new cljs.core.Keyword(null,"ns","ns",441598760));
var var$ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__43827__$1,new cljs.core.Keyword(null,"var","var",-769682797));
return ["Namespace ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(ns)," clashes with var ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(var$)].join('');
}));
cljs.analyzer.error_message.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"non-dynamic-earmuffed-var","non-dynamic-earmuffed-var",-202005643),(function (warning_type,p__43831){
var map__43833 = p__43831;
var map__43833__$1 = cljs.core.__destructure_map(map__43833);
var info = map__43833__$1;
var var$ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__43833__$1,new cljs.core.Keyword(null,"var","var",-769682797));
return [cljs.core.str.cljs$core$IFn$_invoke$arity$1(var$)," not declared dynamic and thus is not dynamically rebindable, but its name ","suggests otherwise. Please either indicate ^:dynamic ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(var$)," or change the name"].join('');
}));
cljs.analyzer.error_message.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"extend-type-invalid-method-shape","extend-type-invalid-method-shape",1424103549),(function (warning_type,p__43834){
var map__43835 = p__43834;
var map__43835__$1 = cljs.core.__destructure_map(map__43835);
var info = map__43835__$1;
var protocol = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__43835__$1,new cljs.core.Keyword(null,"protocol","protocol",652470118));
var method = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__43835__$1,new cljs.core.Keyword(null,"method","method",55703592));
return ["Bad extend-type method shape for protocol ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(protocol)," method ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(method),", method arities must be grouped together"].join('');
}));
cljs.analyzer.error_message.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"unsupported-js-module-type","unsupported-js-module-type",1806206180),(function (warning_type,p__43840){
var map__43841 = p__43840;
var map__43841__$1 = cljs.core.__destructure_map(map__43841);
var info = map__43841__$1;
var module_type = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__43841__$1,new cljs.core.Keyword(null,"module-type","module-type",1392760304));
var file = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__43841__$1,new cljs.core.Keyword(null,"file","file",-1269645878));
return ["Unsupported JavaScript module type ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(module_type)," for foreign library ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(file),"."].join('');
}));
cljs.analyzer.error_message.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"unsupported-preprocess-value","unsupported-preprocess-value",1635147105),(function (warning_type,p__43842){
var map__43843 = p__43842;
var map__43843__$1 = cljs.core.__destructure_map(map__43843);
var preprocess = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__43843__$1,new cljs.core.Keyword(null,"preprocess","preprocess",1208285012));
var file = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__43843__$1,new cljs.core.Keyword(null,"file","file",-1269645878));
return ["Unsupported preprocess value ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(preprocess)," for foreign library ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(file),"."].join('');
}));
cljs.analyzer.error_message.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"js-shadowed-by-local","js-shadowed-by-local",198048291),(function (warning_type,p__43856){
var map__43857 = p__43856;
var map__43857__$1 = cljs.core.__destructure_map(map__43857);
var name = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__43857__$1,new cljs.core.Keyword(null,"name","name",1843675177));
return [cljs.core.str.cljs$core$IFn$_invoke$arity$1(name)," is shadowed by a local"].join('');
}));
cljs.analyzer.error_message.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"infer-warning","infer-warning",-1600671410),(function (warning_type,p__43858){
var map__43859 = p__43858;
var map__43859__$1 = cljs.core.__destructure_map(map__43859);
var warn_type = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__43859__$1,new cljs.core.Keyword(null,"warn-type","warn-type",-790105219));
var form = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__43859__$1,new cljs.core.Keyword(null,"form","form",-1624062471));
var type = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__43859__$1,new cljs.core.Keyword(null,"type","type",1174270348));
var property = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__43859__$1,new cljs.core.Keyword(null,"property","property",-1114278232));
var G__43864 = warn_type;
var G__43864__$1 = (((G__43864 instanceof cljs.core.Keyword))?G__43864.fqn:null);
switch (G__43864__$1) {
case "target":
return ["Cannot infer target type in expression ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(form),""].join('');

break;
case "property":
return ["Cannot resolve property ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(property)," for inferred type ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(type)," in expression ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(form)].join('');

break;
case "object":
return ["Adding extern to Object for property ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(property)," due to ","ambiguous expression ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(form)].join('');

break;
default:
throw (new Error(["No matching clause: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(G__43864__$1)].join('')));

}
}));
cljs.analyzer.default_warning_handler = (function cljs$analyzer$default_warning_handler(warning_type,env,extra){
if(cljs.core.truth_((warning_type.cljs$core$IFn$_invoke$arity$1 ? warning_type.cljs$core$IFn$_invoke$arity$1(cljs.analyzer._STAR_cljs_warnings_STAR_) : warning_type.call(null,cljs.analyzer._STAR_cljs_warnings_STAR_)))){
var temp__5804__auto__ = cljs.analyzer.error_message.cljs$core$IFn$_invoke$arity$2(warning_type,extra);
if(cljs.core.truth_(temp__5804__auto__)){
var s = temp__5804__auto__;
var _STAR_print_fn_STAR__orig_val__43875 = cljs.core._STAR_print_fn_STAR_;
var _STAR_print_fn_STAR__temp_val__43876 = cljs.core._STAR_print_err_fn_STAR_;
(cljs.core._STAR_print_fn_STAR_ = _STAR_print_fn_STAR__temp_val__43876);

try{return cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([(function (){var G__43877 = env;
var G__43878 = ["WARNING: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(s)].join('');
return (cljs.analyzer.message.cljs$core$IFn$_invoke$arity$2 ? cljs.analyzer.message.cljs$core$IFn$_invoke$arity$2(G__43877,G__43878) : cljs.analyzer.message.call(null,G__43877,G__43878));
})()], 0));
}finally {(cljs.core._STAR_print_fn_STAR_ = _STAR_print_fn_STAR__orig_val__43875);
}} else {
return null;
}
} else {
return null;
}
});
cljs.analyzer._STAR_cljs_warning_handlers_STAR_ = new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.analyzer.default_warning_handler], null);
cljs.analyzer.repeat_char = (function cljs$analyzer$repeat_char(c,n){
var ret = c;
var n__$1 = n;
while(true){
if((n__$1 > (0))){
var G__48013 = [cljs.core.str.cljs$core$IFn$_invoke$arity$1(ret),cljs.core.str.cljs$core$IFn$_invoke$arity$1(c)].join('');
var G__48014 = (n__$1 - (1));
ret = G__48013;
n__$1 = G__48014;
continue;
} else {
return ret;
}
break;
}
});
cljs.analyzer.hex_format = (function cljs$analyzer$hex_format(s,pad){
var hex = s.charCodeAt((0)).toString((16));
var len = hex.length;
var hex__$1 = (((len < pad))?[cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.analyzer.repeat_char("0",(pad - len))),cljs.core.str.cljs$core$IFn$_invoke$arity$1(hex)].join(''):hex);
return ["_u",cljs.core.str.cljs$core$IFn$_invoke$arity$1(hex__$1),"_"].join('');
});
cljs.analyzer.gen_constant_id = (function cljs$analyzer$gen_constant_id(value){
var prefix = (((value instanceof cljs.core.Keyword))?"cst$kw$":(((value instanceof cljs.core.Symbol))?"cst$sym$":(function(){throw (new Error(["constant type ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.type(value))," not supported"].join('')))})()
));
var name = (((value instanceof cljs.core.Keyword))?cljs.core.subs.cljs$core$IFn$_invoke$arity$2(cljs.core.str.cljs$core$IFn$_invoke$arity$1(value),(1)):cljs.core.str.cljs$core$IFn$_invoke$arity$1(value));
var name__$1 = ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(".",name))?"_DOT_":clojure.string.replace(clojure.string.replace(cljs.core.munge(clojure.string.replace(clojure.string.replace(clojure.string.replace(name,"_","__"),"$","$$"),"-","_DASH_")),".","$"),/[^a-z0-9$_]/i,(function (p1__43888_SHARP_){
return cljs.analyzer.hex_format(p1__43888_SHARP_,(4));
})));
return cljs.core.symbol.cljs$core$IFn$_invoke$arity$1([prefix,name__$1].join(''));
});
cljs.analyzer.register_constant_BANG_ = (function cljs$analyzer$register_constant_BANG_(var_args){
var G__43900 = arguments.length;
switch (G__43900) {
case 1:
return cljs.analyzer.register_constant_BANG_.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return cljs.analyzer.register_constant_BANG_.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(cljs.analyzer.register_constant_BANG_.cljs$core$IFn$_invoke$arity$1 = (function (val){
return cljs.analyzer.register_constant_BANG_.cljs$core$IFn$_invoke$arity$2(null,val);
}));

(cljs.analyzer.register_constant_BANG_.cljs$core$IFn$_invoke$arity$2 = (function (env,val){
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$2(cljs.env._STAR_compiler_STAR_,(function (cenv){
var G__43901 = cljs.core.update_in.cljs$core$IFn$_invoke$arity$3(cenv,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("cljs.analyzer","constant-table","cljs.analyzer/constant-table",-114131889)], null),(function (table){
if(cljs.core.truth_(cljs.core.get.cljs$core$IFn$_invoke$arity$2(table,val))){
return table;
} else {
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(table,val,cljs.analyzer.gen_constant_id(val));
}
}));
if(cljs.core.truth_(env)){
return cljs.core.update_in.cljs$core$IFn$_invoke$arity$3(G__43901,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("cljs.analyzer","namespaces","cljs.analyzer/namespaces",-260788927),new cljs.core.Keyword(null,"name","name",1843675177).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"ns","ns",441598760).cljs$core$IFn$_invoke$arity$1(env)),new cljs.core.Keyword("cljs.analyzer","constants","cljs.analyzer/constants",1697083770)], null),(function (p__43904){
var map__43905 = p__43904;
var map__43905__$1 = cljs.core.__destructure_map(map__43905);
var constants = map__43905__$1;
var seen = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__43905__$1,new cljs.core.Keyword(null,"seen","seen",-518999789),cljs.core.PersistentHashSet.EMPTY);
var order = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__43905__$1,new cljs.core.Keyword(null,"order","order",-1254677256),cljs.core.PersistentVector.EMPTY);
var G__43907 = constants;
if((!(cljs.core.contains_QMARK_(seen,val)))){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(G__43907,new cljs.core.Keyword(null,"seen","seen",-518999789),cljs.core.conj.cljs$core$IFn$_invoke$arity$2(seen,val),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"order","order",-1254677256),cljs.core.conj.cljs$core$IFn$_invoke$arity$2(order,val)], 0));
} else {
return G__43907;
}
}));
} else {
return G__43901;
}
}));
}));

(cljs.analyzer.register_constant_BANG_.cljs$lang$maxFixedArity = 2);

cljs.analyzer.default_namespaces = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Symbol(null,"cljs.core","cljs.core",770546058,null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"name","name",1843675177),new cljs.core.Symbol(null,"cljs.core","cljs.core",770546058,null)], null),new cljs.core.Symbol(null,"cljs.user","cljs.user",877795071,null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"name","name",1843675177),new cljs.core.Symbol(null,"cljs.user","cljs.user",877795071,null)], null)], null);

/**
* @constructor
 * @implements {cljs.core.IMeta}
 * @implements {cljs.core.IDeref}
 * @implements {cljs.core.IWithMeta}
*/
cljs.analyzer.t_cljs$analyzer43911 = (function (meta43912){
this.meta43912 = meta43912;
this.cljs$lang$protocol_mask$partition0$ = 425984;
this.cljs$lang$protocol_mask$partition1$ = 0;
});
(cljs.analyzer.t_cljs$analyzer43911.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = (function (_43913,meta43912__$1){
var self__ = this;
var _43913__$1 = this;
return (new cljs.analyzer.t_cljs$analyzer43911(meta43912__$1));
}));

(cljs.analyzer.t_cljs$analyzer43911.prototype.cljs$core$IMeta$_meta$arity$1 = (function (_43913){
var self__ = this;
var _43913__$1 = this;
return self__.meta43912;
}));

(cljs.analyzer.t_cljs$analyzer43911.prototype.cljs$core$IDeref$_deref$arity$1 = (function (_){
var self__ = this;
var ___$1 = this;
if((!((cljs.env._STAR_compiler_STAR_ == null)))){
return new cljs.core.Keyword("cljs.analyzer","namespaces","cljs.analyzer/namespaces",-260788927).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(cljs.env._STAR_compiler_STAR_));
} else {
return cljs.analyzer.default_namespaces;
}
}));

(cljs.analyzer.t_cljs$analyzer43911.getBasis = (function (){
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"meta43912","meta43912",-2065168807,null)], null);
}));

(cljs.analyzer.t_cljs$analyzer43911.cljs$lang$type = true);

(cljs.analyzer.t_cljs$analyzer43911.cljs$lang$ctorStr = "cljs.analyzer/t_cljs$analyzer43911");

(cljs.analyzer.t_cljs$analyzer43911.cljs$lang$ctorPrWriter = (function (this__5287__auto__,writer__5288__auto__,opt__5289__auto__){
return cljs.core._write(writer__5288__auto__,"cljs.analyzer/t_cljs$analyzer43911");
}));

/**
 * Positional factory function for cljs.analyzer/t_cljs$analyzer43911.
 */
cljs.analyzer.__GT_t_cljs$analyzer43911 = (function cljs$analyzer$__GT_t_cljs$analyzer43911(meta43912){
return (new cljs.analyzer.t_cljs$analyzer43911(meta43912));
});


cljs.analyzer.namespaces = (new cljs.analyzer.t_cljs$analyzer43911(cljs.core.PersistentArrayMap.EMPTY));
cljs.analyzer.get_namespace = (function cljs$analyzer$get_namespace(var_args){
var G__43932 = arguments.length;
switch (G__43932) {
case 1:
return cljs.analyzer.get_namespace.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return cljs.analyzer.get_namespace.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(cljs.analyzer.get_namespace.cljs$core$IFn$_invoke$arity$1 = (function (key){
return cljs.analyzer.get_namespace.cljs$core$IFn$_invoke$arity$2(cljs.env._STAR_compiler_STAR_,key);
}));

(cljs.analyzer.get_namespace.cljs$core$IFn$_invoke$arity$2 = (function (cenv,key){
var temp__5806__auto__ = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(cenv),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("cljs.analyzer","namespaces","cljs.analyzer/namespaces",-260788927),key], null));
if((temp__5806__auto__ == null)){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Symbol(null,"cljs.user","cljs.user",877795071,null),key)){
return new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"name","name",1843675177),new cljs.core.Symbol(null,"cljs.user","cljs.user",877795071,null)], null);
} else {
return null;
}
} else {
var ns = temp__5806__auto__;
return ns;
}
}));

(cljs.analyzer.get_namespace.cljs$lang$maxFixedArity = 2);

cljs.analyzer.get_line = (function cljs$analyzer$get_line(x,env){
var or__5002__auto__ = new cljs.core.Keyword(null,"line","line",212345235).cljs$core$IFn$_invoke$arity$1(cljs.core.meta(x));
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword(null,"line","line",212345235).cljs$core$IFn$_invoke$arity$1(env);
}
});
cljs.analyzer.get_col = (function cljs$analyzer$get_col(x,env){
var or__5002__auto__ = new cljs.core.Keyword(null,"column","column",2078222095).cljs$core$IFn$_invoke$arity$1(cljs.core.meta(x));
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword(null,"column","column",2078222095).cljs$core$IFn$_invoke$arity$1(env);
}
});
/**
 * Given a Clojure namespace intern all macros into the ambient ClojureScript
 * analysis environment.
 */
cljs.analyzer.intern_macros = (function cljs$analyzer$intern_macros(var_args){
var G__43961 = arguments.length;
switch (G__43961) {
case 1:
return cljs.analyzer.intern_macros.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return cljs.analyzer.intern_macros.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(cljs.analyzer.intern_macros.cljs$core$IFn$_invoke$arity$1 = (function (ns){
return cljs.analyzer.intern_macros.cljs$core$IFn$_invoke$arity$2(ns,false);
}));

(cljs.analyzer.intern_macros.cljs$core$IFn$_invoke$arity$2 = (function (ns,reload){
if(cljs.core.truth_((function (){var or__5002__auto__ = (cljs.analyzer.gets.cljs$core$IFn$_invoke$arity$4(cljs.core.deref(cljs.env._STAR_compiler_STAR_),new cljs.core.Keyword("cljs.analyzer","namespaces","cljs.analyzer/namespaces",-260788927),ns,new cljs.core.Keyword(null,"macros","macros",811339431)) == null);
if(or__5002__auto__){
return or__5002__auto__;
} else {
return reload;
}
})())){
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(cljs.env._STAR_compiler_STAR_,cljs.core.assoc_in,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("cljs.analyzer","namespaces","cljs.analyzer/namespaces",-260788927),ns,new cljs.core.Keyword(null,"macros","macros",811339431)], null),cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p__43962){
var vec__43963 = p__43962;
var k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__43963,(0),null);
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__43963,(1),null);
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [k,(function (){var vm = cljs.core.meta(v);
var ns__$1 = new cljs.core.Keyword(null,"ns","ns",441598760).cljs$core$IFn$_invoke$arity$1(vm).getName();
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(vm,new cljs.core.Keyword(null,"ns","ns",441598760),ns__$1,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"name","name",1843675177),cljs.core.symbol.cljs$core$IFn$_invoke$arity$2(cljs.core.str.cljs$core$IFn$_invoke$arity$1(ns__$1),cljs.core.str.cljs$core$IFn$_invoke$arity$1(k)),new cljs.core.Keyword(null,"macro","macro",-867863404),true], 0));
})()], null);
}),cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (p__43967){
var vec__43968 = p__43967;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__43968,(0),null);
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__43968,(1),null);
return v.isMacro();
}),cljs.core.ns_interns_STAR_(ns)))));
} else {
return null;
}
}));

(cljs.analyzer.intern_macros.cljs$lang$maxFixedArity = 2);

/**
 * Construct an empty analysis environment. Required to analyze forms.
 */
cljs.analyzer.empty_env = (function cljs$analyzer$empty_env(){
var val__9381__auto__ = cljs.env._STAR_compiler_STAR_;
if((val__9381__auto__ == null)){
(cljs.env._STAR_compiler_STAR_ = cljs.env.default_compiler_env.cljs$core$IFn$_invoke$arity$0());
} else {
}

try{return new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"ns","ns",441598760),cljs.analyzer.get_namespace.cljs$core$IFn$_invoke$arity$1(cljs.analyzer._STAR_cljs_ns_STAR_),new cljs.core.Keyword(null,"context","context",-830191113),new cljs.core.Keyword(null,"statement","statement",-32780863),new cljs.core.Keyword(null,"locals","locals",535295783),cljs.core.PersistentArrayMap.EMPTY,new cljs.core.Keyword(null,"fn-scope","fn-scope",-865664859),cljs.core.PersistentVector.EMPTY,new cljs.core.Keyword(null,"js-globals","js-globals",1670394727),cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__43988_SHARP_){
return (new cljs.core.PersistentVector(null,2,(5),cljs.core.PersistentVector.EMPTY_NODE,[p1__43988_SHARP_,new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"op","op",-1882987955),new cljs.core.Keyword(null,"js-var","js-var",-1177899142),new cljs.core.Keyword(null,"name","name",1843675177),p1__43988_SHARP_,new cljs.core.Keyword(null,"ns","ns",441598760),new cljs.core.Symbol(null,"js","js",-886355190,null)], null)],null));
}),cljs.core.list(new cljs.core.Symbol(null,"alert","alert",1068580947,null),new cljs.core.Symbol(null,"window","window",-1929916235,null),new cljs.core.Symbol(null,"document","document",311342840,null),new cljs.core.Symbol(null,"console","console",-1426363712,null),new cljs.core.Symbol(null,"escape","escape",648929575,null),new cljs.core.Symbol(null,"unescape","unescape",-2037730561,null),new cljs.core.Symbol(null,"screen","screen",-664376021,null),new cljs.core.Symbol(null,"location","location",-838836381,null),new cljs.core.Symbol(null,"navigator","navigator",-604431588,null),new cljs.core.Symbol(null,"history","history",1393136307,null),new cljs.core.Symbol(null,"location","location",-838836381,null),new cljs.core.Symbol(null,"global","global",1734126574,null),new cljs.core.Symbol(null,"process","process",-1011242831,null),new cljs.core.Symbol(null,"require","require",1172530194,null),new cljs.core.Symbol(null,"module","module",-1229817578,null),new cljs.core.Symbol(null,"exports","exports",895523255,null))))], null);
}finally {if((val__9381__auto__ == null)){
(cljs.env._STAR_compiler_STAR_ = null);
} else {
}
}});
cljs.analyzer.source_info__GT_error_data = (function cljs$analyzer$source_info__GT_error_data(p__43998){
var map__43999 = p__43998;
var map__43999__$1 = cljs.core.__destructure_map(map__43999);
var file = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__43999__$1,new cljs.core.Keyword(null,"file","file",-1269645878));
var line = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__43999__$1,new cljs.core.Keyword(null,"line","line",212345235));
var column = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__43999__$1,new cljs.core.Keyword(null,"column","column",2078222095));
return new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword("clojure.error","source","clojure.error/source",-2011936397),file,new cljs.core.Keyword("clojure.error","line","clojure.error/line",-1816287471),line,new cljs.core.Keyword("clojure.error","column","clojure.error/column",304721553),column], null);
});
cljs.analyzer.source_info = (function cljs$analyzer$source_info(var_args){
var G__44003 = arguments.length;
switch (G__44003) {
case 1:
return cljs.analyzer.source_info.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return cljs.analyzer.source_info.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(cljs.analyzer.source_info.cljs$core$IFn$_invoke$arity$1 = (function (env){
if(cljs.core.truth_(new cljs.core.Keyword(null,"line","line",212345235).cljs$core$IFn$_invoke$arity$1(env))){
return cljs.analyzer.source_info.cljs$core$IFn$_invoke$arity$2(null,env);
} else {
return null;
}
}));

(cljs.analyzer.source_info.cljs$core$IFn$_invoke$arity$2 = (function (name,env){
var G__44005 = new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"file","file",-1269645878),((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"name","name",1843675177).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"ns","ns",441598760).cljs$core$IFn$_invoke$arity$1(env)),new cljs.core.Symbol(null,"cljs.core","cljs.core",770546058,null)))?"cljs/core.cljs":cljs.analyzer._STAR_cljs_file_STAR_),new cljs.core.Keyword(null,"line","line",212345235),cljs.analyzer.get_line(name,env),new cljs.core.Keyword(null,"column","column",2078222095),cljs.analyzer.get_col(name,env)], null);
if(cljs.core.truth_(new cljs.core.Keyword(null,"root-source-info","root-source-info",-1436144912).cljs$core$IFn$_invoke$arity$1(env))){
return cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([G__44005,cljs.core.select_keys(env,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"root-source-info","root-source-info",-1436144912)], null))], 0));
} else {
return G__44005;
}
}));

(cljs.analyzer.source_info.cljs$lang$maxFixedArity = 2);

cljs.analyzer.message = (function cljs$analyzer$message(env,s){
return [cljs.core.str.cljs$core$IFn$_invoke$arity$1(s),(cljs.core.truth_(new cljs.core.Keyword(null,"line","line",212345235).cljs$core$IFn$_invoke$arity$1(env))?[" at line ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"line","line",212345235).cljs$core$IFn$_invoke$arity$1(env))," ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.analyzer._STAR_cljs_file_STAR_)].join(''):(cljs.core.truth_(cljs.analyzer._STAR_cljs_file_STAR_)?[" in file ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.analyzer._STAR_cljs_file_STAR_)].join(''):null))].join('');
});
cljs.analyzer.warning = (function cljs$analyzer$warning(warning_type,env,extra){
var seq__44022 = cljs.core.seq(cljs.analyzer._STAR_cljs_warning_handlers_STAR_);
var chunk__44023 = null;
var count__44024 = (0);
var i__44025 = (0);
while(true){
if((i__44025 < count__44024)){
var handler = chunk__44023.cljs$core$IIndexed$_nth$arity$2(null,i__44025);
(handler.cljs$core$IFn$_invoke$arity$3 ? handler.cljs$core$IFn$_invoke$arity$3(warning_type,env,extra) : handler.call(null,warning_type,env,extra));


var G__48069 = seq__44022;
var G__48070 = chunk__44023;
var G__48071 = count__44024;
var G__48072 = (i__44025 + (1));
seq__44022 = G__48069;
chunk__44023 = G__48070;
count__44024 = G__48071;
i__44025 = G__48072;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__44022);
if(temp__5804__auto__){
var seq__44022__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__44022__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__44022__$1);
var G__48074 = cljs.core.chunk_rest(seq__44022__$1);
var G__48075 = c__5525__auto__;
var G__48076 = cljs.core.count(c__5525__auto__);
var G__48077 = (0);
seq__44022 = G__48074;
chunk__44023 = G__48075;
count__44024 = G__48076;
i__44025 = G__48077;
continue;
} else {
var handler = cljs.core.first(seq__44022__$1);
(handler.cljs$core$IFn$_invoke$arity$3 ? handler.cljs$core$IFn$_invoke$arity$3(warning_type,env,extra) : handler.call(null,warning_type,env,extra));


var G__48079 = cljs.core.next(seq__44022__$1);
var G__48080 = null;
var G__48081 = (0);
var G__48082 = (0);
seq__44022 = G__48079;
chunk__44023 = G__48080;
count__44024 = G__48081;
i__44025 = G__48082;
continue;
}
} else {
return null;
}
}
break;
}
});
cljs.analyzer.accumulating_warning_handler = (function cljs$analyzer$accumulating_warning_handler(warn_acc){
return (function (warning_type,env,extra){
if(cljs.core.truth_((warning_type.cljs$core$IFn$_invoke$arity$1 ? warning_type.cljs$core$IFn$_invoke$arity$1(cljs.analyzer._STAR_cljs_warnings_STAR_) : warning_type.call(null,cljs.analyzer._STAR_cljs_warnings_STAR_)))){
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$3(warn_acc,cljs.core.conj,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [warning_type,env,extra], null));
} else {
return null;
}
});
});
cljs.analyzer.replay_accumulated_warnings = (function cljs$analyzer$replay_accumulated_warnings(warn_acc){
return cljs.core.run_BANG_((function (p1__44036_SHARP_){
return cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.analyzer.warning,p1__44036_SHARP_);
}),cljs.core.deref(warn_acc));
});
cljs.analyzer.error_data = (function cljs$analyzer$error_data(var_args){
var G__44040 = arguments.length;
switch (G__44040) {
case 2:
return cljs.analyzer.error_data.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return cljs.analyzer.error_data.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(cljs.analyzer.error_data.cljs$core$IFn$_invoke$arity$2 = (function (env,phase){
return cljs.analyzer.error_data.cljs$core$IFn$_invoke$arity$3(env,phase,null);
}));

(cljs.analyzer.error_data.cljs$core$IFn$_invoke$arity$3 = (function (env,phase,symbol){
return cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.analyzer.source_info__GT_error_data(cljs.analyzer.source_info.cljs$core$IFn$_invoke$arity$1(env)),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("clojure.error","phase","clojure.error/phase",275140358),phase], null),(cljs.core.truth_(symbol)?new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("clojure.error","symbol","clojure.error/symbol",1544821994),symbol], null):null)], 0));
}));

(cljs.analyzer.error_data.cljs$lang$maxFixedArity = 3);

cljs.analyzer.compile_syntax_error = (function cljs$analyzer$compile_syntax_error(env,msg,symbol){
return cljs.core.ex_info.cljs$core$IFn$_invoke$arity$3(null,cljs.analyzer.error_data.cljs$core$IFn$_invoke$arity$3(env,new cljs.core.Keyword(null,"compile-syntax-check","compile-syntax-check",-1865080468),symbol),(new Error(msg)));
});
cljs.analyzer.error = (function cljs$analyzer$error(var_args){
var G__44046 = arguments.length;
switch (G__44046) {
case 2:
return cljs.analyzer.error.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return cljs.analyzer.error.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(cljs.analyzer.error.cljs$core$IFn$_invoke$arity$2 = (function (env,msg){
return cljs.analyzer.error.cljs$core$IFn$_invoke$arity$3(env,msg,null);
}));

(cljs.analyzer.error.cljs$core$IFn$_invoke$arity$3 = (function (env,msg,cause){
return cljs.core.ex_info.cljs$core$IFn$_invoke$arity$3(cljs.analyzer.message(env,msg),cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(cljs.analyzer.source_info.cljs$core$IFn$_invoke$arity$1(env),new cljs.core.Keyword(null,"tag","tag",-1290361223),new cljs.core.Keyword("cljs","analysis-error","cljs/analysis-error",-420526349)),cause);
}));

(cljs.analyzer.error.cljs$lang$maxFixedArity = 3);

cljs.analyzer.analysis_error_QMARK_ = (function cljs$analyzer$analysis_error_QMARK_(ex){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("cljs","analysis-error","cljs/analysis-error",-420526349),new cljs.core.Keyword(null,"tag","tag",-1290361223).cljs$core$IFn$_invoke$arity$1(cljs.core.ex_data(ex)));
});
cljs.analyzer.has_error_data_QMARK_ = (function cljs$analyzer$has_error_data_QMARK_(ex){
return cljs.core.contains_QMARK_(cljs.core.ex_data(ex),new cljs.core.Keyword("clojure.error","phase","clojure.error/phase",275140358));
});
cljs.analyzer.implicit_nses = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 6, [new cljs.core.Symbol(null,"String","String",-2070057435,null),"null",new cljs.core.Symbol(null,"goog.string","goog.string",-2055533048,null),"null",new cljs.core.Symbol(null,"goog","goog",-70603925,null),"null",new cljs.core.Symbol(null,"goog.object","goog.object",678593132,null),"null",new cljs.core.Symbol(null,"Math","Math",2033287572,null),"null",new cljs.core.Symbol(null,"goog.array","goog.array",-671977860,null),"null"], null), null);
cljs.analyzer.implicit_import_QMARK_ = (function cljs$analyzer$implicit_import_QMARK_(env,prefix,suffix){
return cljs.core.contains_QMARK_(cljs.analyzer.implicit_nses,prefix);
});
cljs.analyzer.confirm_var_exist_warning = (function cljs$analyzer$confirm_var_exist_warning(env,prefix,suffix){
return (function (env__$1,prefix__$1,suffix__$1){
return cljs.analyzer.warning(new cljs.core.Keyword(null,"undeclared-var","undeclared-var",-1624364944),env__$1,new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"prefix","prefix",-265908465),prefix__$1,new cljs.core.Keyword(null,"suffix","suffix",367373057),suffix__$1,new cljs.core.Keyword(null,"macro-present?","macro-present?",-1397713205),(!(((function (){var G__44083 = cljs.core.symbol.cljs$core$IFn$_invoke$arity$2(cljs.core.str.cljs$core$IFn$_invoke$arity$1(prefix__$1),cljs.core.str.cljs$core$IFn$_invoke$arity$1(suffix__$1));
var G__44084 = env__$1;
return (cljs.analyzer.get_expander.cljs$core$IFn$_invoke$arity$2 ? cljs.analyzer.get_expander.cljs$core$IFn$_invoke$arity$2(G__44083,G__44084) : cljs.analyzer.get_expander.call(null,G__44083,G__44084));
})() == null)))], null));
});
});
/**
 * If a library name has the form foo$bar, return a vector of the library and
 * the sublibrary property.
 */
cljs.analyzer.lib_AMPERSAND_sublib = (function cljs$analyzer$lib_AMPERSAND_sublib(lib){
var temp__5802__auto__ = cljs.core.re_matches(/(.*)\$(.*)/,cljs.core.str.cljs$core$IFn$_invoke$arity$1(lib));
if(cljs.core.truth_(temp__5802__auto__)){
var xs = temp__5802__auto__;
return cljs.core.drop.cljs$core$IFn$_invoke$arity$2((1),xs);
} else {
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [lib,null], null);
}
});
/**
 * Check if a JavaScript namespace has been loaded. JavaScript vars are
 *   not currently checked.
 */
cljs.analyzer.loaded_js_ns_QMARK_ = (function cljs$analyzer$loaded_js_ns_QMARK_(env,prefix){
if(cljs.core.truth_(cljs.analyzer.gets.cljs$core$IFn$_invoke$arity$3(cljs.core.deref(cljs.env._STAR_compiler_STAR_),new cljs.core.Keyword("cljs.analyzer","namespaces","cljs.analyzer/namespaces",-260788927),prefix))){
return null;
} else {
var ns = new cljs.core.Keyword(null,"ns","ns",441598760).cljs$core$IFn$_invoke$arity$1(env);
return (((!((cljs.core.get.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"requires","requires",-1201390927).cljs$core$IFn$_invoke$arity$1(ns),prefix) == null)))) || ((!((cljs.core.get.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"imports","imports",-1249933394).cljs$core$IFn$_invoke$arity$1(ns),prefix) == null)))));
}
});
cljs.analyzer.internal_js_module_exists_QMARK_ = (function cljs$analyzer$internal_js_module_exists_QMARK_(js_module_index,module){
return cljs.core.contains_QMARK_(cljs.core.into.cljs$core$IFn$_invoke$arity$3(cljs.core.PersistentHashSet.EMPTY,cljs.core.mapcat.cljs$core$IFn$_invoke$arity$1((function (p__44091){
var vec__44092 = p__44091;
var k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__44092,(0),null);
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__44092,(1),null);
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [k,new cljs.core.Keyword(null,"name","name",1843675177).cljs$core$IFn$_invoke$arity$1(v)], null);
})),js_module_index),cljs.core.str.cljs$core$IFn$_invoke$arity$1(module));
});
cljs.analyzer.js_module_exists_QMARK__STAR_ = cljs.core.memoize(cljs.analyzer.internal_js_module_exists_QMARK_);
cljs.analyzer.js_module_exists_QMARK_ = (function cljs$analyzer$js_module_exists_QMARK_(module){
return cljs.analyzer.js_module_exists_QMARK__STAR_(cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(cljs.env._STAR_compiler_STAR_),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"js-module-index","js-module-index",2072061931)], null)),module);
});
cljs.analyzer.node_module_dep_QMARK_ = (function cljs$analyzer$node_module_dep_QMARK_(module){
try{return ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core._STAR_target_STAR_,"nodejs")) && (cljs.core.boolean$((function (){var or__5002__auto__ = require.resolve(cljs.core.str.cljs$core$IFn$_invoke$arity$1(module));
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return require.resolve(cljs.core.first(cljs.analyzer.lib_AMPERSAND_sublib(module)));
}
})())));
}catch (e44097){var _ = e44097;
return false;
}});
cljs.analyzer.dep_has_global_exports_QMARK_ = (function cljs$analyzer$dep_has_global_exports_QMARK_(module){
var vec__44100 = cljs.analyzer.lib_AMPERSAND_sublib(module);
var module__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__44100,(0),null);
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__44100,(1),null);
var global_exports = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(cljs.env._STAR_compiler_STAR_),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"js-dependency-index","js-dependency-index",-1887042131),cljs.core.str.cljs$core$IFn$_invoke$arity$1(module__$1),new cljs.core.Keyword(null,"global-exports","global-exports",-1644865592)], null));
return ((cljs.core.contains_QMARK_(global_exports,cljs.core.symbol.cljs$core$IFn$_invoke$arity$1(module__$1))) || (cljs.core.contains_QMARK_(global_exports,cljs.core.name(module__$1))));
});
cljs.analyzer.goog_module_dep_QMARK_ = (function cljs$analyzer$goog_module_dep_QMARK_(module){
var vec__44114 = cljs.analyzer.lib_AMPERSAND_sublib(module);
var module__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__44114,(0),null);
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__44114,(1),null);
var module_str = cljs.core.str.cljs$core$IFn$_invoke$arity$1(module__$1);
var options = cljs.analyzer.compiler_options();
if(cljs.core.truth_((function (){var and__5000__auto__ = new cljs.core.Keyword(null,"global-goog-object&array","global-goog-object&array",907046210).cljs$core$IFn$_invoke$arity$1(options);
if(cljs.core.truth_(and__5000__auto__)){
var fexpr__44118 = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, ["goog.array",null,"goog.object",null], null), null);
return (fexpr__44118.cljs$core$IFn$_invoke$arity$1 ? fexpr__44118.cljs$core$IFn$_invoke$arity$1(module_str) : fexpr__44118.call(null,module_str));
} else {
return and__5000__auto__;
}
})())){
return false;
} else {
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"goog","goog",-1711135452),cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(cljs.env._STAR_compiler_STAR_),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"js-dependency-index","js-dependency-index",-1887042131),module_str,new cljs.core.Keyword(null,"module","module",1424618191)], null)));
}
});
cljs.analyzer.confirm_var_exists = (function cljs$analyzer$confirm_var_exists(var_args){
var G__44134 = arguments.length;
switch (G__44134) {
case 3:
return cljs.analyzer.confirm_var_exists.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
case 4:
return cljs.analyzer.confirm_var_exists.cljs$core$IFn$_invoke$arity$4((arguments[(0)]),(arguments[(1)]),(arguments[(2)]),(arguments[(3)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(cljs.analyzer.confirm_var_exists.cljs$core$IFn$_invoke$arity$3 = (function (env,prefix,suffix){
var warn = cljs.analyzer.confirm_var_exist_warning(env,prefix,suffix);
return cljs.analyzer.confirm_var_exists.cljs$core$IFn$_invoke$arity$4(env,prefix,suffix,warn);
}));

(cljs.analyzer.confirm_var_exists.cljs$core$IFn$_invoke$arity$4 = (function (env,prefix,suffix,missing_fn){
var sufstr = cljs.core.str.cljs$core$IFn$_invoke$arity$1(suffix);
var suffix_str = (((((!((".." === sufstr)))) && (/\./.test(sufstr))))?cljs.core.first(clojure.string.split.cljs$core$IFn$_invoke$arity$2(sufstr,/\./)):suffix);
var suffix__$1 = cljs.core.symbol.cljs$core$IFn$_invoke$arity$1(suffix_str);
if((((!(cljs.analyzer.implicit_import_QMARK_(env,prefix,suffix__$1)))) && ((((!(cljs.analyzer.loaded_js_ns_QMARK_(env,prefix)))) && ((((!(((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Symbol(null,"cljs.core","cljs.core",770546058,null),prefix)) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Symbol(null,"unquote","unquote",-1004694737,null),suffix__$1)))))) && ((((cljs.analyzer.gets.cljs$core$IFn$_invoke$arity$5(cljs.core.deref(cljs.env._STAR_compiler_STAR_),new cljs.core.Keyword("cljs.analyzer","namespaces","cljs.analyzer/namespaces",-260788927),prefix,new cljs.core.Keyword(null,"defs","defs",1398449717),suffix__$1) == null)) && (cljs.core.not(cljs.analyzer.js_module_exists_QMARK_(prefix))))))))))){
return (missing_fn.cljs$core$IFn$_invoke$arity$3 ? missing_fn.cljs$core$IFn$_invoke$arity$3(env,prefix,suffix__$1) : missing_fn.call(null,env,prefix,suffix__$1));
} else {
return null;
}
}));

(cljs.analyzer.confirm_var_exists.cljs$lang$maxFixedArity = 4);

cljs.analyzer.confirm_var_exists_throw = (function cljs$analyzer$confirm_var_exists_throw(){
return (function (env,prefix,suffix){
return cljs.analyzer.confirm_var_exists.cljs$core$IFn$_invoke$arity$4(env,prefix,suffix,(function (env__$1,prefix__$1,suffix__$1){
throw cljs.analyzer.error.cljs$core$IFn$_invoke$arity$2(env__$1,["Unable to resolve var: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(suffix__$1)," in this context"].join(''));
}));
});
});
cljs.analyzer.resolve_ns_alias = (function cljs$analyzer$resolve_ns_alias(var_args){
var G__44145 = arguments.length;
switch (G__44145) {
case 2:
return cljs.analyzer.resolve_ns_alias.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return cljs.analyzer.resolve_ns_alias.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(cljs.analyzer.resolve_ns_alias.cljs$core$IFn$_invoke$arity$2 = (function (env,name){
return cljs.analyzer.resolve_ns_alias.cljs$core$IFn$_invoke$arity$3(env,name,cljs.core.symbol.cljs$core$IFn$_invoke$arity$1(name));
}));

(cljs.analyzer.resolve_ns_alias.cljs$core$IFn$_invoke$arity$3 = (function (env,name,not_found){
var sym = cljs.core.symbol.cljs$core$IFn$_invoke$arity$1(name);
var map__44147 = new cljs.core.Keyword(null,"ns","ns",441598760).cljs$core$IFn$_invoke$arity$1(env);
var map__44147__$1 = cljs.core.__destructure_map(map__44147);
var requires = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__44147__$1,new cljs.core.Keyword(null,"requires","requires",-1201390927));
var as_aliases = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__44147__$1,new cljs.core.Keyword(null,"as-aliases","as-aliases",1485064798));
var or__5002__auto__ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(requires,sym);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(as_aliases,sym);
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
return not_found;
}
}
}));

(cljs.analyzer.resolve_ns_alias.cljs$lang$maxFixedArity = 3);

cljs.analyzer.resolve_macro_ns_alias = (function cljs$analyzer$resolve_macro_ns_alias(var_args){
var G__44152 = arguments.length;
switch (G__44152) {
case 2:
return cljs.analyzer.resolve_macro_ns_alias.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return cljs.analyzer.resolve_macro_ns_alias.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(cljs.analyzer.resolve_macro_ns_alias.cljs$core$IFn$_invoke$arity$2 = (function (env,name){
return cljs.analyzer.resolve_macro_ns_alias.cljs$core$IFn$_invoke$arity$3(env,name,cljs.core.symbol.cljs$core$IFn$_invoke$arity$1(name));
}));

(cljs.analyzer.resolve_macro_ns_alias.cljs$core$IFn$_invoke$arity$3 = (function (env,name,not_found){
var sym = cljs.core.symbol.cljs$core$IFn$_invoke$arity$1(name);
return cljs.core.get.cljs$core$IFn$_invoke$arity$3(new cljs.core.Keyword(null,"require-macros","require-macros",707947416).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"ns","ns",441598760).cljs$core$IFn$_invoke$arity$1(env)),sym,not_found);
}));

(cljs.analyzer.resolve_macro_ns_alias.cljs$lang$maxFixedArity = 3);

/**
 * Given env, an analysis environment, and ns-sym, a symbol identifying a
 * namespace, confirm that the namespace exists. Warn if not found.
 */
cljs.analyzer.confirm_ns = (function cljs$analyzer$confirm_ns(env,ns_sym){
if(((cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Symbol(null,"cljs.core","cljs.core",770546058,null),ns_sym)) && ((((cljs.core.get.cljs$core$IFn$_invoke$arity$2(cljs.analyzer.implicit_nses,ns_sym) == null)) && ((((cljs.core.get.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"requires","requires",-1201390927).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"ns","ns",441598760).cljs$core$IFn$_invoke$arity$1(env)),ns_sym) == null)) && ((((cljs.analyzer.gets.cljs$core$IFn$_invoke$arity$3(cljs.core.deref(cljs.env._STAR_compiler_STAR_),new cljs.core.Keyword("cljs.analyzer","namespaces","cljs.analyzer/namespaces",-260788927),ns_sym) == null)) && (cljs.core.not(cljs.analyzer.js_module_exists_QMARK_(ns_sym))))))))))){
return cljs.analyzer.warning(new cljs.core.Keyword(null,"undeclared-ns","undeclared-ns",-1589012812),env,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"ns-sym","ns-sym",-1696101605),ns_sym,new cljs.core.Keyword(null,"js-provide","js-provide",1052912493),ns_sym], null));
} else {
return null;
}
});
/**
 * Is sym visible from core in the current compilation namespace?
 */
cljs.analyzer.core_name_QMARK_ = (function cljs$analyzer$core_name_QMARK_(env,sym){
var and__5000__auto__ = (function (){var or__5002__auto__ = (!((cljs.analyzer.gets.cljs$core$IFn$_invoke$arity$5(cljs.core.deref(cljs.env._STAR_compiler_STAR_),new cljs.core.Keyword("cljs.analyzer","namespaces","cljs.analyzer/namespaces",-260788927),new cljs.core.Symbol(null,"cljs.core","cljs.core",770546058,null),new cljs.core.Keyword(null,"defs","defs",1398449717),sym) == null)));
if(or__5002__auto__){
return or__5002__auto__;
} else {
var temp__5806__auto__ = (cljs.analyzer.get_expander.cljs$core$IFn$_invoke$arity$2 ? cljs.analyzer.get_expander.cljs$core$IFn$_invoke$arity$2(sym,env) : cljs.analyzer.get_expander.call(null,sym,env));
if((temp__5806__auto__ == null)){
return false;
} else {
var mac = temp__5806__auto__;
var ns = new cljs.core.Keyword(null,"ns","ns",441598760).cljs$core$IFn$_invoke$arity$1(cljs.core.meta(mac));
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(ns.getName(),new cljs.core.Symbol(null,"cljs.core$macros","cljs.core$macros",-2057787548,null));
}
}
})();
if(and__5000__auto__){
return (!(cljs.core.contains_QMARK_(new cljs.core.Keyword(null,"excludes","excludes",-1791725945).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"ns","ns",441598760).cljs$core$IFn$_invoke$arity$1(env)),sym)));
} else {
return and__5000__auto__;
}
});
/**
 * Is sym public?
 */
cljs.analyzer.public_name_QMARK_ = (function cljs$analyzer$public_name_QMARK_(ns,sym){
var var_ast = (function (){var or__5002__auto__ = cljs.analyzer.gets.cljs$core$IFn$_invoke$arity$5(cljs.core.deref(cljs.env._STAR_compiler_STAR_),new cljs.core.Keyword("cljs.analyzer","namespaces","cljs.analyzer/namespaces",-260788927),ns,new cljs.core.Keyword(null,"defs","defs",1398449717),sym);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.analyzer.gets.cljs$core$IFn$_invoke$arity$5(cljs.core.deref(cljs.env._STAR_compiler_STAR_),new cljs.core.Keyword("cljs.analyzer","namespaces","cljs.analyzer/namespaces",-260788927),cljs.core.symbol.cljs$core$IFn$_invoke$arity$1([cljs.core.name(ns),"$macros"].join('')),new cljs.core.Keyword(null,"defs","defs",1398449717),sym);
}
})();
return (((!((var_ast == null)))) && (cljs.core.not((function (){var or__5002__auto__ = new cljs.core.Keyword(null,"private","private",-558947994).cljs$core$IFn$_invoke$arity$1(var_ast);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword(null,"anonymous","anonymous",447897231).cljs$core$IFn$_invoke$arity$1(var_ast);
}
})())));
});
cljs.analyzer.js_tag_QMARK_ = (function cljs$analyzer$js_tag_QMARK_(x){
return (((x instanceof cljs.core.Symbol)) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Symbol(null,"js","js",-886355190,null),x)) || (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("js",cljs.core.namespace(x))))));
});
cljs.analyzer.normalize_js_tag = (function cljs$analyzer$normalize_js_tag(x){
if((!(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Symbol(null,"js","js",-886355190,null),x)))){
return cljs.core.with_meta(new cljs.core.Symbol(null,"js","js",-886355190,null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"prefix","prefix",-265908465),cljs.core.conj.cljs$core$IFn$_invoke$arity$2(cljs.core.vec(cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.symbol,clojure.string.split.cljs$core$IFn$_invoke$arity$2(cljs.core.name(x),/\./))),new cljs.core.Symbol(null,"prototype","prototype",519166522,null))], null));
} else {
return x;
}
});
/**
 * Ensures that a type tag is a set.
 */
cljs.analyzer.__GT_type_set = (function cljs$analyzer$__GT_type_set(t){
if(cljs.analyzer.impl.cljs_set_QMARK_(t)){
return t;
} else {
return cljs.core.PersistentHashSet.createAsIfByAssoc([t]);
}
});
cljs.analyzer.canonicalize_type = (function cljs$analyzer$canonicalize_type(t){

if((t instanceof cljs.core.Symbol)){
return t;
} else {
if(cljs.core.empty_QMARK_(t)){
return null;
} else {
if(((1) === cljs.core.count(t))){
return cljs.core.first(t);
} else {
if(cljs.core.contains_QMARK_(t,new cljs.core.Symbol(null,"any","any",-948528346,null))){
return new cljs.core.Symbol(null,"any","any",-948528346,null);
} else {
if(cljs.core.contains_QMARK_(t,new cljs.core.Symbol(null,"seq","seq",-177272256,null))){
var res = cljs.core.disj.cljs$core$IFn$_invoke$arity$2(t,new cljs.core.Symbol(null,"clj-nil","clj-nil",1321798654,null));
if(((1) === cljs.core.count(res))){
return new cljs.core.Symbol(null,"seq","seq",-177272256,null);
} else {
return res;
}
} else {
return t;

}
}
}
}
}
});
/**
 * Produces a union of types.
 */
cljs.analyzer.add_types = (function cljs$analyzer$add_types(var_args){
var G__44196 = arguments.length;
switch (G__44196) {
case 0:
return cljs.analyzer.add_types.cljs$core$IFn$_invoke$arity$0();

break;
case 1:
return cljs.analyzer.add_types.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return cljs.analyzer.add_types.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
var args_arr__5751__auto__ = [];
var len__5726__auto___48191 = arguments.length;
var i__5727__auto___48192 = (0);
while(true){
if((i__5727__auto___48192 < len__5726__auto___48191)){
args_arr__5751__auto__.push((arguments[i__5727__auto___48192]));

var G__48193 = (i__5727__auto___48192 + (1));
i__5727__auto___48192 = G__48193;
continue;
} else {
}
break;
}

var argseq__5752__auto__ = ((((2) < args_arr__5751__auto__.length))?(new cljs.core.IndexedSeq(args_arr__5751__auto__.slice((2)),(0),null)):null);
return cljs.analyzer.add_types.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),(arguments[(1)]),argseq__5752__auto__);

}
});

(cljs.analyzer.add_types.cljs$core$IFn$_invoke$arity$0 = (function (){
return new cljs.core.Symbol(null,"any","any",-948528346,null);
}));

(cljs.analyzer.add_types.cljs$core$IFn$_invoke$arity$1 = (function (t1){
return t1;
}));

(cljs.analyzer.add_types.cljs$core$IFn$_invoke$arity$2 = (function (t1,t2){
if((((t1 == null)) || ((t2 == null)))){
return new cljs.core.Symbol(null,"any","any",-948528346,null);
} else {
return cljs.analyzer.canonicalize_type(clojure.set.union.cljs$core$IFn$_invoke$arity$2(cljs.analyzer.__GT_type_set(t1),cljs.analyzer.__GT_type_set(t2)));
}
}));

(cljs.analyzer.add_types.cljs$core$IFn$_invoke$arity$variadic = (function (t1,t2,ts){
return cljs.core.apply.cljs$core$IFn$_invoke$arity$3(cljs.analyzer.add_types,cljs.analyzer.add_types.cljs$core$IFn$_invoke$arity$2(t1,t2),ts);
}));

/** @this {Function} */
(cljs.analyzer.add_types.cljs$lang$applyTo = (function (seq44190){
var G__44191 = cljs.core.first(seq44190);
var seq44190__$1 = cljs.core.next(seq44190);
var G__44192 = cljs.core.first(seq44190__$1);
var seq44190__$2 = cljs.core.next(seq44190__$1);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__44191,G__44192,seq44190__$2);
}));

(cljs.analyzer.add_types.cljs$lang$maxFixedArity = (2));

cljs.analyzer.alias__GT_type = new cljs.core.PersistentArrayMap(null, 7, [new cljs.core.Symbol(null,"object","object",-1179821820,null),new cljs.core.Symbol(null,"Object","Object",61210754,null),new cljs.core.Symbol(null,"string","string",-349010059,null),new cljs.core.Symbol(null,"String","String",-2070057435,null),new cljs.core.Symbol(null,"number","number",-1084057331,null),new cljs.core.Symbol(null,"Number","Number",-508146185,null),new cljs.core.Symbol(null,"array","array",-440182315,null),new cljs.core.Symbol(null,"Array","Array",-423496279,null),new cljs.core.Symbol(null,"function","function",-486723946,null),new cljs.core.Symbol(null,"Function","Function",-749895448,null),new cljs.core.Symbol(null,"boolean","boolean",-278886877,null),new cljs.core.Symbol(null,"Boolean","Boolean",1661141587,null),new cljs.core.Symbol(null,"symbol","symbol",601958831,null),new cljs.core.Symbol(null,"Symbol","Symbol",716452869,null)], null);
cljs.analyzer.has_extern_QMARK__STAR_ = (function cljs$analyzer$has_extern_QMARK__STAR_(var_args){
var G__44238 = arguments.length;
switch (G__44238) {
case 2:
return cljs.analyzer.has_extern_QMARK__STAR_.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return cljs.analyzer.has_extern_QMARK__STAR_.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(cljs.analyzer.has_extern_QMARK__STAR_.cljs$core$IFn$_invoke$arity$2 = (function (pre,externs){
var pre__$1 = (function (){var temp__5806__auto__ = cljs.core.find(cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(externs,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"Window","Window",-138860255,null),new cljs.core.Symbol(null,"prototype","prototype",519166522,null)], null)),cljs.core.first(pre));
if((temp__5806__auto__ == null)){
return pre;
} else {
var me__$1 = temp__5806__auto__;
var temp__5806__auto____$1 = new cljs.core.Keyword(null,"tag","tag",-1290361223).cljs$core$IFn$_invoke$arity$1(cljs.core.meta(cljs.core.first(me__$1)));
if((temp__5806__auto____$1 == null)){
return pre;
} else {
var tag = temp__5806__auto____$1;
return cljs.core.into.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [tag,new cljs.core.Symbol(null,"prototype","prototype",519166522,null)], null),cljs.core.next(pre));
}
}
})();
return cljs.analyzer.has_extern_QMARK__STAR_.cljs$core$IFn$_invoke$arity$3(pre__$1,externs,externs);
}));

(cljs.analyzer.has_extern_QMARK__STAR_.cljs$core$IFn$_invoke$arity$3 = (function (pre,externs,top){
while(true){
if(cljs.core.empty_QMARK_(pre)){
return true;
} else {
var x = cljs.core.first(pre);
var me__$1 = cljs.core.find(externs,x);
if(cljs.core.not(me__$1)){
return false;
} else {
var vec__44261 = me__$1;
var x_SINGLEQUOTE_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__44261,(0),null);
var externs_SINGLEQUOTE_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__44261,(1),null);
var xmeta = cljs.core.meta(x_SINGLEQUOTE_);
if(cljs.core.truth_((function (){var and__5000__auto__ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Symbol(null,"Function","Function",-749895448,null),new cljs.core.Keyword(null,"tag","tag",-1290361223).cljs$core$IFn$_invoke$arity$1(xmeta));
if(and__5000__auto__){
return new cljs.core.Keyword(null,"ctor","ctor",1750864802).cljs$core$IFn$_invoke$arity$1(xmeta);
} else {
return and__5000__auto__;
}
})())){
var or__5002__auto__ = cljs.analyzer.has_extern_QMARK__STAR_.cljs$core$IFn$_invoke$arity$3(cljs.core.into.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"prototype","prototype",519166522,null)], null),cljs.core.next(pre)),externs_SINGLEQUOTE_,top);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = cljs.analyzer.has_extern_QMARK__STAR_.cljs$core$IFn$_invoke$arity$3(cljs.core.next(pre),externs_SINGLEQUOTE_,top);
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
var temp__5804__auto__ = new cljs.core.Keyword(null,"super","super",840752938).cljs$core$IFn$_invoke$arity$1(xmeta);
if(cljs.core.truth_(temp__5804__auto__)){
var super$ = temp__5804__auto__;
return cljs.analyzer.has_extern_QMARK__STAR_.cljs$core$IFn$_invoke$arity$3(cljs.core.into.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [super$], null),cljs.core.next(pre)),externs,top);
} else {
return null;
}
}
}
} else {
var G__48216 = cljs.core.next(pre);
var G__48217 = externs_SINGLEQUOTE_;
var G__48218 = top;
pre = G__48216;
externs = G__48217;
top = G__48218;
continue;
}

}

}
break;
}
}));

(cljs.analyzer.has_extern_QMARK__STAR_.cljs$lang$maxFixedArity = 3);

cljs.analyzer.has_extern_QMARK_ = (function cljs$analyzer$has_extern_QMARK_(var_args){
var G__44289 = arguments.length;
switch (G__44289) {
case 1:
return cljs.analyzer.has_extern_QMARK_.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return cljs.analyzer.has_extern_QMARK_.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(cljs.analyzer.has_extern_QMARK_.cljs$core$IFn$_invoke$arity$1 = (function (pre){
return cljs.analyzer.has_extern_QMARK_.cljs$core$IFn$_invoke$arity$2(pre,cljs.analyzer.get_externs());
}));

(cljs.analyzer.has_extern_QMARK_.cljs$core$IFn$_invoke$arity$2 = (function (pre,externs){
var or__5002__auto__ = cljs.analyzer.has_extern_QMARK__STAR_.cljs$core$IFn$_invoke$arity$2(pre,externs);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2((1),cljs.core.count(pre)))?(function (){var x = cljs.core.first(pre);
var or__5002__auto____$1 = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(externs,cljs.core.conj.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"Window","Window",-138860255,null),new cljs.core.Symbol(null,"prototype","prototype",519166522,null)], null),x));
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
return cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(externs,cljs.core.conj.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"Number","Number",-508146185,null)], null),x));
}
})():null);
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
return clojure.string.starts_with_QMARK_(cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.last(pre)),"cljs$");
}
}
}));

(cljs.analyzer.has_extern_QMARK_.cljs$lang$maxFixedArity = 2);

cljs.analyzer.js_tag = (function cljs$analyzer$js_tag(var_args){
var G__44375 = arguments.length;
switch (G__44375) {
case 1:
return cljs.analyzer.js_tag.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return cljs.analyzer.js_tag.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return cljs.analyzer.js_tag.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
case 4:
return cljs.analyzer.js_tag.cljs$core$IFn$_invoke$arity$4((arguments[(0)]),(arguments[(1)]),(arguments[(2)]),(arguments[(3)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(cljs.analyzer.js_tag.cljs$core$IFn$_invoke$arity$1 = (function (pre){
return cljs.analyzer.js_tag.cljs$core$IFn$_invoke$arity$2(pre,new cljs.core.Keyword(null,"tag","tag",-1290361223));
}));

(cljs.analyzer.js_tag.cljs$core$IFn$_invoke$arity$2 = (function (pre,tag_type){
return cljs.analyzer.js_tag.cljs$core$IFn$_invoke$arity$3(pre,tag_type,cljs.analyzer.get_externs());
}));

(cljs.analyzer.js_tag.cljs$core$IFn$_invoke$arity$3 = (function (pre,tag_type,externs){
return cljs.analyzer.js_tag.cljs$core$IFn$_invoke$arity$4(pre,tag_type,externs,externs);
}));

(cljs.analyzer.js_tag.cljs$core$IFn$_invoke$arity$4 = (function (pre,tag_type,externs,top){
var temp__5804__auto__ = cljs.core.find(externs,cljs.core.first(pre));
if(cljs.core.truth_(temp__5804__auto__)){
var vec__44424 = temp__5804__auto__;
var p = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__44424,(0),null);
var externs_SINGLEQUOTE_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__44424,(1),null);
var me__$1 = vec__44424;
var tag = (function (){var G__44427 = cljs.core.meta(p);
return (tag_type.cljs$core$IFn$_invoke$arity$1 ? tag_type.cljs$core$IFn$_invoke$arity$1(G__44427) : tag_type.call(null,G__44427));
})();
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.count(pre),(1))){
if(cljs.core.truth_(tag)){
return cljs.core.symbol.cljs$core$IFn$_invoke$arity$2("js",cljs.core.str.cljs$core$IFn$_invoke$arity$1((cljs.analyzer.alias__GT_type.cljs$core$IFn$_invoke$arity$2 ? cljs.analyzer.alias__GT_type.cljs$core$IFn$_invoke$arity$2(tag,tag) : cljs.analyzer.alias__GT_type.call(null,tag,tag))));
} else {
return null;
}
} else {
var or__5002__auto__ = cljs.analyzer.js_tag.cljs$core$IFn$_invoke$arity$4(cljs.core.next(pre),tag_type,externs_SINGLEQUOTE_,top);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.analyzer.js_tag.cljs$core$IFn$_invoke$arity$4(cljs.core.into.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"prototype","prototype",519166522,null)], null),cljs.core.next(pre)),tag_type,cljs.core.get.cljs$core$IFn$_invoke$arity$2(top,tag),top);
}
}
} else {
return null;
}
}));

(cljs.analyzer.js_tag.cljs$lang$maxFixedArity = 4);

cljs.analyzer.dotted_symbol_QMARK_ = (function cljs$analyzer$dotted_symbol_QMARK_(sym){
var s = cljs.core.str.cljs$core$IFn$_invoke$arity$1(sym);
return ((goog.string.contains(s,".")) && ((!(goog.string.contains(s,"..")))));
});
cljs.analyzer.munge_node_lib = (function cljs$analyzer$munge_node_lib(name){
return ["node$module$",cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.munge(clojure.string.replace(cljs.core.str.cljs$core$IFn$_invoke$arity$1(name),/[.\\/]/,"$$")))].join('');
});
cljs.analyzer.munge_goog_module_lib = (function cljs$analyzer$munge_goog_module_lib(var_args){
var G__44430 = arguments.length;
switch (G__44430) {
case 1:
return cljs.analyzer.munge_goog_module_lib.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return cljs.analyzer.munge_goog_module_lib.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(cljs.analyzer.munge_goog_module_lib.cljs$core$IFn$_invoke$arity$1 = (function (name){
return ["goog$module$",cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.munge(clojure.string.replace(cljs.core.str.cljs$core$IFn$_invoke$arity$1(name),/[.\\/]/,"$$")))].join('');
}));

(cljs.analyzer.munge_goog_module_lib.cljs$core$IFn$_invoke$arity$2 = (function (ns,name){
return [cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.munge(ns)),".",cljs.analyzer.munge_goog_module_lib.cljs$core$IFn$_invoke$arity$1(name)].join('');
}));

(cljs.analyzer.munge_goog_module_lib.cljs$lang$maxFixedArity = 2);

cljs.analyzer.munge_global_export = (function cljs$analyzer$munge_global_export(name){
return ["global$module$",cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.munge(clojure.string.replace(cljs.core.str.cljs$core$IFn$_invoke$arity$1(name),/[.\\/]/,"$$")))].join('');
});
/**
 * Takes a namespace and an unqualified symbol and potentially returns a new
 *   symbol to be used in lieu of the original.
 */
cljs.analyzer.resolve_alias = (function cljs$analyzer$resolve_alias(ns,sym){
if(cljs.core.truth_((function (){var and__5000__auto__ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Symbol(null,"cljs.core","cljs.core",770546058,null),ns);
if(and__5000__auto__){
var and__5000__auto____$1 = (function (){var fexpr__44451 = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Symbol(null,"aget","aget",1491056546,null),"null",new cljs.core.Symbol(null,"aset","aset",900773178,null),"null"], null), null);
return (fexpr__44451.cljs$core$IFn$_invoke$arity$1 ? fexpr__44451.cljs$core$IFn$_invoke$arity$1(sym) : fexpr__44451.call(null,sym));
})();
if(cljs.core.truth_(and__5000__auto____$1)){
return cljs.analyzer.checked_arrays();
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})())){
return cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"warn","warn",-436710552),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Symbol(null,"aget","aget",1491056546,null),new cljs.core.Symbol(null,"checked-aget","checked-aget",950823006,null),new cljs.core.Symbol(null,"aset","aset",900773178,null),new cljs.core.Symbol(null,"checked-aset","checked-aset",1556136760,null)], null),new cljs.core.Keyword(null,"error","error",-978969032),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Symbol(null,"aget","aget",1491056546,null),new cljs.core.Symbol(null,"checked-aget'","checked-aget'",212330530,null),new cljs.core.Symbol(null,"aset","aset",900773178,null),new cljs.core.Symbol(null,"checked-aset'","checked-aset'",-510930777,null)], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.analyzer.checked_arrays(),sym], null));
} else {
return sym;
}
});
cljs.analyzer.ns__GT_module_type = (function cljs$analyzer$ns__GT_module_type(ns){
if(cljs.analyzer.goog_module_dep_QMARK_(ns)){
return new cljs.core.Keyword(null,"goog-module","goog-module",-767061656);
} else {
if(cljs.core.truth_(cljs.analyzer.js_module_exists_QMARK_(ns))){
return new cljs.core.Keyword(null,"js","js",1768080579);
} else {
if(cljs.analyzer.node_module_dep_QMARK_(ns)){
return new cljs.core.Keyword(null,"node","node",581201198);
} else {
if(cljs.analyzer.dep_has_global_exports_QMARK_(ns)){
return new cljs.core.Keyword(null,"global","global",93595047);
} else {
return null;
}
}
}
}
});
if((typeof cljs !== 'undefined') && (typeof cljs.analyzer !== 'undefined') && (typeof cljs.analyzer.resolve_STAR_ !== 'undefined')){
} else {
cljs.analyzer.resolve_STAR_ = (function (){var method_table__5599__auto__ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
var prefer_table__5600__auto__ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
var method_cache__5601__auto__ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
var cached_hierarchy__5602__auto__ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
var hierarchy__5603__auto__ = cljs.core.get.cljs$core$IFn$_invoke$arity$3(cljs.core.PersistentArrayMap.EMPTY,new cljs.core.Keyword(null,"hierarchy","hierarchy",-1053470341),(function (){var fexpr__44503 = cljs.core.get_global_hierarchy;
return (fexpr__44503.cljs$core$IFn$_invoke$arity$0 ? fexpr__44503.cljs$core$IFn$_invoke$arity$0() : fexpr__44503.call(null));
})());
return (new cljs.core.MultiFn(cljs.core.symbol.cljs$core$IFn$_invoke$arity$2("cljs.analyzer","resolve*"),(function (env,sym,full_ns,current_ns){
return cljs.analyzer.ns__GT_module_type(full_ns);
}),new cljs.core.Keyword(null,"default","default",-1987822328),hierarchy__5603__auto__,method_table__5599__auto__,prefer_table__5600__auto__,method_cache__5601__auto__,cached_hierarchy__5602__auto__));
})();
}
cljs.analyzer.resolve_STAR_.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"js","js",1768080579),(function (env,sym,full_ns,current_ns){
return new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"name","name",1843675177),cljs.core.symbol.cljs$core$IFn$_invoke$arity$2(cljs.core.str.cljs$core$IFn$_invoke$arity$1(full_ns),cljs.core.name(sym)),new cljs.core.Keyword(null,"op","op",-1882987955),new cljs.core.Keyword(null,"js-var","js-var",-1177899142),new cljs.core.Keyword(null,"ns","ns",441598760),full_ns], null);
}));
cljs.analyzer.extern_pre = (function cljs$analyzer$extern_pre(sym,current_ns){
var pre = cljs.core.into.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"Object","Object",61210754,null)], null),cljs.core.vec(cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.symbol,clojure.string.split.cljs$core$IFn$_invoke$arity$2(cljs.core.name(sym),/\./))));
if(cljs.core.truth_(cljs.analyzer.has_extern_QMARK_.cljs$core$IFn$_invoke$arity$1(pre))){
} else {
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$variadic(cljs.env._STAR_compiler_STAR_,cljs.core.update_in,cljs.core.into.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("cljs.analyzer","namespaces","cljs.analyzer/namespaces",-260788927),current_ns,new cljs.core.Keyword(null,"externs","externs",221720677)], null),pre),cljs.core.merge,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.PersistentArrayMap.EMPTY], 0));
}

return pre;
});
cljs.analyzer.node_like_QMARK_ = (function cljs$analyzer$node_like_QMARK_(var_args){
var G__44573 = arguments.length;
switch (G__44573) {
case 0:
return cljs.analyzer.node_like_QMARK_.cljs$core$IFn$_invoke$arity$0();

break;
case 1:
return cljs.analyzer.node_like_QMARK_.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(cljs.analyzer.node_like_QMARK_.cljs$core$IFn$_invoke$arity$0 = (function (){
return cljs.analyzer.node_like_QMARK_.cljs$core$IFn$_invoke$arity$1(cljs.analyzer.compiler_options());
}));

(cljs.analyzer.node_like_QMARK_.cljs$core$IFn$_invoke$arity$1 = (function (opts){
return ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"nodejs","nodejs",321212524),new cljs.core.Keyword(null,"target","target",253001721).cljs$core$IFn$_invoke$arity$1(opts))) && (new cljs.core.Keyword(null,"nodejs-rt","nodejs-rt",-512437071).cljs$core$IFn$_invoke$arity$1(opts) === false));
}));

(cljs.analyzer.node_like_QMARK_.cljs$lang$maxFixedArity = 1);

cljs.analyzer.resolve_STAR_.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"node","node",581201198),(function (env,sym,full_ns,current_ns){
if(cljs.core.truth_(cljs.analyzer.node_like_QMARK_.cljs$core$IFn$_invoke$arity$0())){
var pre = cljs.analyzer.extern_pre(sym,current_ns);
return new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"ns","ns",441598760),current_ns,new cljs.core.Keyword(null,"name","name",1843675177),cljs.core.symbol.cljs$core$IFn$_invoke$arity$2(cljs.core.str.cljs$core$IFn$_invoke$arity$1(current_ns),[cljs.analyzer.munge_node_lib(full_ns),".",cljs.core.name(sym)].join('')),new cljs.core.Keyword(null,"op","op",-1882987955),new cljs.core.Keyword(null,"js-var","js-var",-1177899142),new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.with_meta(new cljs.core.Symbol(null,"js","js",-886355190,null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"prefix","prefix",-265908465),pre], null)),new cljs.core.Keyword(null,"foreign","foreign",990521149),true], null);
} else {
return new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"ns","ns",441598760),current_ns,new cljs.core.Keyword(null,"name","name",1843675177),cljs.core.symbol.cljs$core$IFn$_invoke$arity$2(cljs.core.str.cljs$core$IFn$_invoke$arity$1(current_ns),[cljs.analyzer.munge_node_lib(full_ns),".",cljs.core.name(sym)].join('')),new cljs.core.Keyword(null,"op","op",-1882987955),new cljs.core.Keyword(null,"js-var","js-var",-1177899142),new cljs.core.Keyword(null,"foreign","foreign",990521149),true], null);
}
}));
cljs.analyzer.resolve_STAR_.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"goog-module","goog-module",-767061656),(function (env,sym,full_ns,current_ns){
return new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"name","name",1843675177),cljs.core.symbol.cljs$core$IFn$_invoke$arity$2(cljs.core.str.cljs$core$IFn$_invoke$arity$1(current_ns),[cljs.analyzer.munge_goog_module_lib.cljs$core$IFn$_invoke$arity$1(full_ns),".",cljs.core.name(sym)].join('')),new cljs.core.Keyword(null,"ns","ns",441598760),current_ns,new cljs.core.Keyword(null,"op","op",-1882987955),new cljs.core.Keyword(null,"var","var",-769682797)], null);
}));
cljs.analyzer.resolve_STAR_.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"global","global",93595047),(function (env,sym,full_ns,current_ns){
var pre = cljs.analyzer.extern_pre(sym,current_ns);
return new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"ns","ns",441598760),current_ns,new cljs.core.Keyword(null,"name","name",1843675177),cljs.core.symbol.cljs$core$IFn$_invoke$arity$2(cljs.core.str.cljs$core$IFn$_invoke$arity$1(current_ns),[cljs.analyzer.munge_global_export(full_ns),".",cljs.core.name(sym)].join('')),new cljs.core.Keyword(null,"op","op",-1882987955),new cljs.core.Keyword(null,"js-var","js-var",-1177899142),new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.with_meta(new cljs.core.Symbol(null,"js","js",-886355190,null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"prefix","prefix",-265908465),pre], null)),new cljs.core.Keyword(null,"foreign","foreign",990521149),true], null);
}));
/**
 * Specially-treated symbols for which we don't trigger :private-var-access warnings.
 */
cljs.analyzer.private_var_access_exceptions = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Symbol("cljs.core","checked-aset'","cljs.core/checked-aset'",163859714,null),"null",new cljs.core.Symbol("cljs.core","checked-aget'","cljs.core/checked-aget'",1960922245,null),"null",new cljs.core.Symbol("cljs.core","checked-aget","cljs.core/checked-aget",24024561,null),"null",new cljs.core.Symbol("cljs.core","checked-aset","cljs.core/checked-aset",-2080232353,null),"null"], null), null);
cljs.analyzer.resolve_STAR_.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"default","default",-1987822328),(function (env,sym,full_ns,current_ns){
var sym_ast = cljs.analyzer.gets.cljs$core$IFn$_invoke$arity$5(cljs.core.deref(cljs.env._STAR_compiler_STAR_),new cljs.core.Keyword("cljs.analyzer","namespaces","cljs.analyzer/namespaces",-260788927),full_ns,new cljs.core.Keyword(null,"defs","defs",1398449717),cljs.core.symbol.cljs$core$IFn$_invoke$arity$1(cljs.core.name(sym)));
var sym_name = cljs.core.symbol.cljs$core$IFn$_invoke$arity$2(cljs.core.str.cljs$core$IFn$_invoke$arity$1(full_ns),cljs.core.name(sym));
if(cljs.core.truth_((function (){var and__5000__auto__ = cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(current_ns,full_ns);
if(and__5000__auto__){
var and__5000__auto____$1 = new cljs.core.Keyword(null,"private","private",-558947994).cljs$core$IFn$_invoke$arity$1(sym_ast);
if(cljs.core.truth_(and__5000__auto____$1)){
return ((cljs.core.not(cljs.analyzer._STAR_private_var_access_nowarn_STAR_)) && ((!(cljs.core.contains_QMARK_(cljs.analyzer.private_var_access_exceptions,sym_name)))));
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})())){
cljs.analyzer.warning(new cljs.core.Keyword(null,"private-var-access","private-var-access",967536101),env,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"sym","sym",-1444860305),sym_name], null));
} else {
}

return cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([sym_ast,new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"name","name",1843675177),sym_name,new cljs.core.Keyword(null,"op","op",-1882987955),new cljs.core.Keyword(null,"var","var",-769682797),new cljs.core.Keyword(null,"ns","ns",441598760),full_ns], null)], 0));
}));
cljs.analyzer.required_QMARK_ = (function cljs$analyzer$required_QMARK_(ns,env){
return ((cljs.core.contains_QMARK_(cljs.core.set(cljs.core.vals(cljs.analyzer.gets.cljs$core$IFn$_invoke$arity$3(env,new cljs.core.Keyword(null,"ns","ns",441598760),new cljs.core.Keyword(null,"requires","requires",-1201390927)))),ns)) || (cljs.core.contains_QMARK_(cljs.core.set(cljs.core.vals(cljs.analyzer.gets.cljs$core$IFn$_invoke$arity$3(env,new cljs.core.Keyword(null,"ns","ns",441598760),new cljs.core.Keyword(null,"uses","uses",232664692)))),ns)));
});
/**
 * Returns true if ns is a required namespace and a JavaScript module that
 * might be invokeable as a function.
 */
cljs.analyzer.invokeable_ns_QMARK_ = (function cljs$analyzer$invokeable_ns_QMARK_(ns,env){
var ns__$1 = cljs.analyzer.resolve_ns_alias.cljs$core$IFn$_invoke$arity$2(env,ns);
var and__5000__auto__ = cljs.analyzer.required_QMARK_(ns__$1,env);
if(and__5000__auto__){
var or__5002__auto__ = cljs.analyzer.js_module_exists_QMARK_(ns__$1);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return ((cljs.analyzer.node_module_dep_QMARK_(ns__$1)) || (cljs.analyzer.dep_has_global_exports_QMARK_(ns__$1)));
}
} else {
return and__5000__auto__;
}
});
cljs.analyzer.resolve_invokeable_ns = (function cljs$analyzer$resolve_invokeable_ns(ns,current_ns,env){
var ns__$1 = cljs.analyzer.resolve_ns_alias.cljs$core$IFn$_invoke$arity$2(env,ns);
var module_type = cljs.analyzer.ns__GT_module_type(ns__$1);
var G__44610 = module_type;
var G__44610__$1 = (((G__44610 instanceof cljs.core.Keyword))?G__44610.fqn:null);
switch (G__44610__$1) {
case "js":
return new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"name","name",1843675177),cljs.core.symbol.cljs$core$IFn$_invoke$arity$1((function (){var or__5002__auto__ = cljs.analyzer.gets.cljs$core$IFn$_invoke$arity$4(cljs.core.deref(cljs.env._STAR_compiler_STAR_),new cljs.core.Keyword(null,"js-module-index","js-module-index",2072061931),ns__$1,new cljs.core.Keyword(null,"name","name",1843675177));
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.analyzer.resolve_ns_alias.cljs$core$IFn$_invoke$arity$2(env,ns__$1);
}
})()),new cljs.core.Keyword(null,"op","op",-1882987955),new cljs.core.Keyword(null,"js-var","js-var",-1177899142),new cljs.core.Keyword(null,"ns","ns",441598760),new cljs.core.Symbol(null,"js","js",-886355190,null)], null);

break;
case "node":
return new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"name","name",1843675177),cljs.core.symbol.cljs$core$IFn$_invoke$arity$2(cljs.core.str.cljs$core$IFn$_invoke$arity$1(current_ns),cljs.analyzer.munge_node_lib(cljs.analyzer.resolve_ns_alias.cljs$core$IFn$_invoke$arity$2(env,ns__$1))),new cljs.core.Keyword(null,"op","op",-1882987955),new cljs.core.Keyword(null,"js-var","js-var",-1177899142),new cljs.core.Keyword(null,"ns","ns",441598760),current_ns,new cljs.core.Keyword(null,"tag","tag",-1290361223),new cljs.core.Symbol(null,"js","js",-886355190,null)], null);

break;
case "global":
return new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"name","name",1843675177),cljs.core.symbol.cljs$core$IFn$_invoke$arity$2(cljs.core.str.cljs$core$IFn$_invoke$arity$1(current_ns),cljs.analyzer.munge_global_export(cljs.analyzer.resolve_ns_alias.cljs$core$IFn$_invoke$arity$2(env,ns__$1))),new cljs.core.Keyword(null,"op","op",-1882987955),new cljs.core.Keyword(null,"js-var","js-var",-1177899142),new cljs.core.Keyword(null,"ns","ns",441598760),current_ns,new cljs.core.Keyword(null,"tag","tag",-1290361223),new cljs.core.Symbol(null,"js","js",-886355190,null)], null);

break;
default:
throw (new Error(["No matching clause: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(G__44610__$1)].join('')));

}
});
/**
 * goog.modules are deterministically assigned to a property of the namespace,
 * we cannot expect the reference will be globally available, so we resolve to
 * namespace local reference.
 */
cljs.analyzer.resolve_import = (function cljs$analyzer$resolve_import(env,import$){
if(cljs.analyzer.goog_module_dep_QMARK_(import$)){
return cljs.core.symbol.cljs$core$IFn$_invoke$arity$1(cljs.analyzer.munge_goog_module_lib.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"name","name",1843675177).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"ns","ns",441598760).cljs$core$IFn$_invoke$arity$1(env)),import$));
} else {
return import$;
}
});
cljs.analyzer.handle_symbol_local = (function cljs$analyzer$handle_symbol_local(sym,lb){
if((lb instanceof cljs.core.Symbol)){
return new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"name","name",1843675177),sym], null);
} else {
return lb;
}
});
/**
 * Resolve a var. Accepts a side-effecting confirm fn for producing
 * warnings about unresolved vars.
 */
cljs.analyzer.resolve_var = (function cljs$analyzer$resolve_var(var_args){
var G__44637 = arguments.length;
switch (G__44637) {
case 2:
return cljs.analyzer.resolve_var.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return cljs.analyzer.resolve_var.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
case 4:
return cljs.analyzer.resolve_var.cljs$core$IFn$_invoke$arity$4((arguments[(0)]),(arguments[(1)]),(arguments[(2)]),(arguments[(3)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(cljs.analyzer.resolve_var.cljs$core$IFn$_invoke$arity$2 = (function (env,sym){
return cljs.analyzer.resolve_var.cljs$core$IFn$_invoke$arity$3(env,sym,null);
}));

(cljs.analyzer.resolve_var.cljs$core$IFn$_invoke$arity$3 = (function (env,sym,confirm){
return cljs.analyzer.resolve_var.cljs$core$IFn$_invoke$arity$4(env,sym,confirm,true);
}));

(cljs.analyzer.resolve_var.cljs$core$IFn$_invoke$arity$4 = (function (env,sym,confirm,default_QMARK_){
while(true){
var locals = new cljs.core.Keyword(null,"locals","locals",535295783).cljs$core$IFn$_invoke$arity$1(env);
if(("js" === cljs.core.namespace(sym))){
var symn = cljs.core.symbol.cljs$core$IFn$_invoke$arity$1(cljs.core.name(sym));
var shadowed_by_local = cljs.analyzer.handle_symbol_local(symn,cljs.core.get.cljs$core$IFn$_invoke$arity$2(locals,symn));
if((!((shadowed_by_local == null)))){
cljs.analyzer.warning(new cljs.core.Keyword(null,"js-shadowed-by-local","js-shadowed-by-local",198048291),env,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"name","name",1843675177),sym], null));

return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(shadowed_by_local,new cljs.core.Keyword(null,"op","op",-1882987955),new cljs.core.Keyword(null,"local","local",-1497766724));
} else {
var pre = cljs.core.vec(cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.symbol,clojure.string.split.cljs$core$IFn$_invoke$arity$2(cljs.core.name(sym),/\./)));
if(((cljs.core.not(cljs.analyzer.has_extern_QMARK_.cljs$core$IFn$_invoke$arity$1(pre))) && (cljs.core.not(new cljs.core.Keyword("cljs.analyzer","no-resolve","cljs.analyzer/no-resolve",-1872351017).cljs$core$IFn$_invoke$arity$1(cljs.core.meta(sym)))))){
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$variadic(cljs.env._STAR_compiler_STAR_,cljs.core.update_in,cljs.core.into.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("cljs.analyzer","namespaces","cljs.analyzer/namespaces",-260788927),new cljs.core.Keyword(null,"name","name",1843675177).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"ns","ns",441598760).cljs$core$IFn$_invoke$arity$1(env)),new cljs.core.Keyword(null,"externs","externs",221720677)], null),pre),cljs.core.merge,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.PersistentArrayMap.EMPTY], 0));
} else {
}

return cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"name","name",1843675177),sym,new cljs.core.Keyword(null,"op","op",-1882987955),new cljs.core.Keyword(null,"js-var","js-var",-1177899142),new cljs.core.Keyword(null,"ns","ns",441598760),new cljs.core.Symbol(null,"js","js",-886355190,null),new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.with_meta((function (){var or__5002__auto__ = cljs.analyzer.js_tag.cljs$core$IFn$_invoke$arity$1(pre);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = new cljs.core.Keyword(null,"tag","tag",-1290361223).cljs$core$IFn$_invoke$arity$1(cljs.core.meta(sym));
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
return new cljs.core.Symbol(null,"js","js",-886355190,null);
}
}
})(),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"prefix","prefix",-265908465),pre], null))], null),(function (){var temp__5804__auto__ = cljs.analyzer.js_tag.cljs$core$IFn$_invoke$arity$2(pre,new cljs.core.Keyword(null,"ret-tag","ret-tag",1705919990));
if(cljs.core.truth_(temp__5804__auto__)){
var ret_tag = temp__5804__auto__;
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"js-fn-var","js-fn-var",-565665358),true,new cljs.core.Keyword(null,"ret-tag","ret-tag",1705919990),ret_tag], null);
} else {
return null;
}
})()], 0));

}
} else {
var s = cljs.core.str.cljs$core$IFn$_invoke$arity$1(sym);
var lb = cljs.analyzer.handle_symbol_local(sym,cljs.core.get.cljs$core$IFn$_invoke$arity$2(locals,sym));
var current_ns = new cljs.core.Keyword(null,"name","name",1843675177).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"ns","ns",441598760).cljs$core$IFn$_invoke$arity$1(env));
if((!((lb == null)))){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(lb,new cljs.core.Keyword(null,"op","op",-1882987955),new cljs.core.Keyword(null,"local","local",-1497766724));
} else {
if((!((cljs.core.namespace(sym) == null)))){
var ns = cljs.core.namespace(sym);
var ns__$1 = ((("clojure.core" === ns))?"cljs.core":ns);
var full_ns = cljs.analyzer.resolve_ns_alias.cljs$core$IFn$_invoke$arity$3(env,ns__$1,(function (){var or__5002__auto__ = (function (){var and__5000__auto__ = cljs.analyzer.js_module_exists_QMARK_(ns__$1);
if(cljs.core.truth_(and__5000__auto__)){
return cljs.analyzer.gets.cljs$core$IFn$_invoke$arity$4(cljs.core.deref(cljs.env._STAR_compiler_STAR_),new cljs.core.Keyword(null,"js-module-index","js-module-index",2072061931),ns__$1,new cljs.core.Keyword(null,"name","name",1843675177));
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.symbol.cljs$core$IFn$_invoke$arity$1(ns__$1);
}
})());
if((!((confirm == null)))){
if(cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(current_ns,full_ns)){
cljs.analyzer.confirm_ns(env,full_ns);
} else {
}

var G__44649_48350 = env;
var G__44650_48351 = full_ns;
var G__44651_48352 = cljs.core.symbol.cljs$core$IFn$_invoke$arity$1(cljs.core.name(sym));
(confirm.cljs$core$IFn$_invoke$arity$3 ? confirm.cljs$core$IFn$_invoke$arity$3(G__44649_48350,G__44650_48351,G__44651_48352) : confirm.call(null,G__44649_48350,G__44650_48351,G__44651_48352));
} else {
}

return cljs.analyzer.resolve_STAR_.cljs$core$IFn$_invoke$arity$4(env,sym,full_ns,current_ns);
} else {
if(cljs.analyzer.dotted_symbol_QMARK_(sym)){
var idx = s.indexOf(".");
var prefix = cljs.core.symbol.cljs$core$IFn$_invoke$arity$1(cljs.core.subs.cljs$core$IFn$_invoke$arity$3(s,(0),idx));
var suffix = cljs.core.subs.cljs$core$IFn$_invoke$arity$2(s,(idx + (1)));
var temp__5802__auto__ = cljs.analyzer.resolve_var.cljs$core$IFn$_invoke$arity$4(env,prefix,null,false);
if(cljs.core.truth_(temp__5802__auto__)){
var resolved = temp__5802__auto__;
return cljs.core.update.cljs$core$IFn$_invoke$arity$3(resolved,new cljs.core.Keyword(null,"name","name",1843675177),((function (env,sym,confirm,default_QMARK_,resolved,temp__5802__auto__,idx,prefix,suffix,s,lb,current_ns,locals){
return (function (p1__44631_SHARP_){
return cljs.core.symbol.cljs$core$IFn$_invoke$arity$1([cljs.core.str.cljs$core$IFn$_invoke$arity$1(p1__44631_SHARP_),".",suffix].join(''));
});})(env,sym,confirm,default_QMARK_,resolved,temp__5802__auto__,idx,prefix,suffix,s,lb,current_ns,locals))
);
} else {
var s__$1 = cljs.core.str.cljs$core$IFn$_invoke$arity$1((function (){var G__44656 = s;
if(cljs.analyzer.goog_module_dep_QMARK_(sym)){
return cljs.analyzer.resolve_import(env,G__44656);
} else {
return G__44656;
}
})());
var idx__$1 = s__$1.lastIndexOf(".");
var pre = cljs.core.subs.cljs$core$IFn$_invoke$arity$3(s__$1,(0),idx__$1);
var suf = cljs.core.subs.cljs$core$IFn$_invoke$arity$2(s__$1,(idx__$1 + (1)));
return new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"op","op",-1882987955),new cljs.core.Keyword(null,"var","var",-769682797),new cljs.core.Keyword(null,"name","name",1843675177),cljs.core.symbol.cljs$core$IFn$_invoke$arity$2(pre,suf),new cljs.core.Keyword(null,"ns","ns",441598760),cljs.core.symbol.cljs$core$IFn$_invoke$arity$1(pre)], null);
}
} else {
if((!((cljs.analyzer.gets.cljs$core$IFn$_invoke$arity$5(cljs.core.deref(cljs.env._STAR_compiler_STAR_),new cljs.core.Keyword("cljs.analyzer","namespaces","cljs.analyzer/namespaces",-260788927),current_ns,new cljs.core.Keyword(null,"uses","uses",232664692),sym) == null)))){
var full_ns = cljs.analyzer.gets.cljs$core$IFn$_invoke$arity$5(cljs.core.deref(cljs.env._STAR_compiler_STAR_),new cljs.core.Keyword("cljs.analyzer","namespaces","cljs.analyzer/namespaces",-260788927),current_ns,new cljs.core.Keyword(null,"uses","uses",232664692),sym);
return cljs.analyzer.resolve_STAR_.cljs$core$IFn$_invoke$arity$4(env,sym,full_ns,current_ns);
} else {
if((!((cljs.analyzer.gets.cljs$core$IFn$_invoke$arity$5(cljs.core.deref(cljs.env._STAR_compiler_STAR_),new cljs.core.Keyword("cljs.analyzer","namespaces","cljs.analyzer/namespaces",-260788927),current_ns,new cljs.core.Keyword(null,"renames","renames",343278368),sym) == null)))){
var qualified_symbol = cljs.analyzer.gets.cljs$core$IFn$_invoke$arity$5(cljs.core.deref(cljs.env._STAR_compiler_STAR_),new cljs.core.Keyword("cljs.analyzer","namespaces","cljs.analyzer/namespaces",-260788927),current_ns,new cljs.core.Keyword(null,"renames","renames",343278368),sym);
var full_ns = cljs.core.symbol.cljs$core$IFn$_invoke$arity$1(cljs.core.namespace(qualified_symbol));
var sym__$1 = cljs.core.symbol.cljs$core$IFn$_invoke$arity$1(cljs.core.name(qualified_symbol));
return cljs.analyzer.resolve_STAR_.cljs$core$IFn$_invoke$arity$4(env,sym__$1,full_ns,current_ns);
} else {
if((!((cljs.analyzer.gets.cljs$core$IFn$_invoke$arity$5(cljs.core.deref(cljs.env._STAR_compiler_STAR_),new cljs.core.Keyword("cljs.analyzer","namespaces","cljs.analyzer/namespaces",-260788927),current_ns,new cljs.core.Keyword(null,"imports","imports",-1249933394),sym) == null)))){
var G__48359 = env;
var G__48360 = cljs.analyzer.gets.cljs$core$IFn$_invoke$arity$5(cljs.core.deref(cljs.env._STAR_compiler_STAR_),new cljs.core.Keyword("cljs.analyzer","namespaces","cljs.analyzer/namespaces",-260788927),current_ns,new cljs.core.Keyword(null,"imports","imports",-1249933394),sym);
var G__48361 = confirm;
var G__48362 = default_QMARK_;
env = G__48359;
sym = G__48360;
confirm = G__48361;
default_QMARK_ = G__48362;
continue;
} else {
if((!((cljs.analyzer.gets.cljs$core$IFn$_invoke$arity$5(cljs.core.deref(cljs.env._STAR_compiler_STAR_),new cljs.core.Keyword("cljs.analyzer","namespaces","cljs.analyzer/namespaces",-260788927),current_ns,new cljs.core.Keyword(null,"defs","defs",1398449717),sym) == null)))){
if((!((confirm == null)))){
(confirm.cljs$core$IFn$_invoke$arity$3 ? confirm.cljs$core$IFn$_invoke$arity$3(env,current_ns,sym) : confirm.call(null,env,current_ns,sym));
} else {
}

return cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.analyzer.gets.cljs$core$IFn$_invoke$arity$5(cljs.core.deref(cljs.env._STAR_compiler_STAR_),new cljs.core.Keyword("cljs.analyzer","namespaces","cljs.analyzer/namespaces",-260788927),current_ns,new cljs.core.Keyword(null,"defs","defs",1398449717),sym),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"name","name",1843675177),cljs.core.symbol.cljs$core$IFn$_invoke$arity$2(cljs.core.str.cljs$core$IFn$_invoke$arity$1(current_ns),cljs.core.str.cljs$core$IFn$_invoke$arity$1(sym)),new cljs.core.Keyword(null,"op","op",-1882987955),new cljs.core.Keyword(null,"var","var",-769682797),new cljs.core.Keyword(null,"ns","ns",441598760),current_ns], null)], 0));
} else {
if(cljs.analyzer.core_name_QMARK_(env,sym)){
var sym__$1 = cljs.analyzer.resolve_alias(new cljs.core.Symbol(null,"cljs.core","cljs.core",770546058,null),sym);
if((!((confirm == null)))){
var G__44665_48373 = env;
var G__44666_48374 = new cljs.core.Symbol(null,"cljs.core","cljs.core",770546058,null);
var G__44667_48375 = sym__$1;
(confirm.cljs$core$IFn$_invoke$arity$3 ? confirm.cljs$core$IFn$_invoke$arity$3(G__44665_48373,G__44666_48374,G__44667_48375) : confirm.call(null,G__44665_48373,G__44666_48374,G__44667_48375));
} else {
}

return cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.analyzer.gets.cljs$core$IFn$_invoke$arity$5(cljs.core.deref(cljs.env._STAR_compiler_STAR_),new cljs.core.Keyword("cljs.analyzer","namespaces","cljs.analyzer/namespaces",-260788927),new cljs.core.Symbol(null,"cljs.core","cljs.core",770546058,null),new cljs.core.Keyword(null,"defs","defs",1398449717),sym__$1),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"name","name",1843675177),cljs.core.symbol.cljs$core$IFn$_invoke$arity$2("cljs.core",cljs.core.str.cljs$core$IFn$_invoke$arity$1(sym__$1)),new cljs.core.Keyword(null,"op","op",-1882987955),new cljs.core.Keyword(null,"var","var",-769682797),new cljs.core.Keyword(null,"ns","ns",441598760),new cljs.core.Symbol(null,"cljs.core","cljs.core",770546058,null)], null)], 0));
} else {
if(cljs.core.truth_(cljs.analyzer.invokeable_ns_QMARK_(s,env))){
return cljs.analyzer.resolve_invokeable_ns(s,current_ns,env);
} else {
if(cljs.core.truth_(default_QMARK_)){
if((!((confirm == null)))){
(confirm.cljs$core$IFn$_invoke$arity$3 ? confirm.cljs$core$IFn$_invoke$arity$3(env,current_ns,sym) : confirm.call(null,env,current_ns,sym));
} else {
}

return cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.analyzer.gets.cljs$core$IFn$_invoke$arity$5(cljs.core.deref(cljs.env._STAR_compiler_STAR_),new cljs.core.Keyword("cljs.analyzer","namespaces","cljs.analyzer/namespaces",-260788927),current_ns,new cljs.core.Keyword(null,"defs","defs",1398449717),sym),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"name","name",1843675177),cljs.core.symbol.cljs$core$IFn$_invoke$arity$2(cljs.core.str.cljs$core$IFn$_invoke$arity$1(current_ns),cljs.core.str.cljs$core$IFn$_invoke$arity$1(sym)),new cljs.core.Keyword(null,"op","op",-1882987955),new cljs.core.Keyword(null,"var","var",-769682797),new cljs.core.Keyword(null,"ns","ns",441598760),current_ns], null)], 0));
} else {
return null;
}

}
}
}
}
}
}
}
}
}
}
break;
}
}));

(cljs.analyzer.resolve_var.cljs$lang$maxFixedArity = 4);

/**
 * Given env, an analysis environment, and sym, a symbol, resolve an existing var.
 * Emits a warning if no such var exists.
 */
cljs.analyzer.resolve_existing_var = (function cljs$analyzer$resolve_existing_var(env,sym){
if(cljs.core.not(new cljs.core.Keyword("cljs.analyzer","no-resolve","cljs.analyzer/no-resolve",-1872351017).cljs$core$IFn$_invoke$arity$1(cljs.core.meta(sym)))){
return cljs.analyzer.resolve_var.cljs$core$IFn$_invoke$arity$3(env,sym,cljs.analyzer.confirm_var_exists);
} else {
return cljs.analyzer.resolve_var.cljs$core$IFn$_invoke$arity$2(env,sym);
}
});
/**
 * Given env, an analysis environment env, and names, a list of symbols, confirm
 * that all correspond to declared dynamic vars.
 */
cljs.analyzer.confirm_bindings = (function cljs$analyzer$confirm_bindings(env,names){
var seq__44675 = cljs.core.seq(names);
var chunk__44676 = null;
var count__44677 = (0);
var i__44678 = (0);
while(true){
if((i__44678 < count__44677)){
var name = chunk__44676.cljs$core$IIndexed$_nth$arity$2(null,i__44678);
var env_48396__$1 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(env,new cljs.core.Keyword(null,"ns","ns",441598760),cljs.analyzer.get_namespace.cljs$core$IFn$_invoke$arity$1(cljs.analyzer._STAR_cljs_ns_STAR_));
var ev_48397 = cljs.analyzer.resolve_existing_var(env_48396__$1,name);
if(cljs.core.truth_((function (){var and__5000__auto__ = ev_48397;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.not(new cljs.core.Keyword(null,"dynamic","dynamic",704819571).cljs$core$IFn$_invoke$arity$1(ev_48397));
} else {
return and__5000__auto__;
}
})())){
cljs.analyzer.warning(new cljs.core.Keyword(null,"dynamic","dynamic",704819571),env_48396__$1,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"ev","ev",-406827324),ev_48397,new cljs.core.Keyword(null,"name","name",1843675177),new cljs.core.Keyword(null,"name","name",1843675177).cljs$core$IFn$_invoke$arity$1(ev_48397)], null));
} else {
}


var G__48398 = seq__44675;
var G__48399 = chunk__44676;
var G__48400 = count__44677;
var G__48401 = (i__44678 + (1));
seq__44675 = G__48398;
chunk__44676 = G__48399;
count__44677 = G__48400;
i__44678 = G__48401;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__44675);
if(temp__5804__auto__){
var seq__44675__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__44675__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__44675__$1);
var G__48402 = cljs.core.chunk_rest(seq__44675__$1);
var G__48403 = c__5525__auto__;
var G__48404 = cljs.core.count(c__5525__auto__);
var G__48405 = (0);
seq__44675 = G__48402;
chunk__44676 = G__48403;
count__44677 = G__48404;
i__44678 = G__48405;
continue;
} else {
var name = cljs.core.first(seq__44675__$1);
var env_48406__$1 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(env,new cljs.core.Keyword(null,"ns","ns",441598760),cljs.analyzer.get_namespace.cljs$core$IFn$_invoke$arity$1(cljs.analyzer._STAR_cljs_ns_STAR_));
var ev_48407 = cljs.analyzer.resolve_existing_var(env_48406__$1,name);
if(cljs.core.truth_((function (){var and__5000__auto__ = ev_48407;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.not(new cljs.core.Keyword(null,"dynamic","dynamic",704819571).cljs$core$IFn$_invoke$arity$1(ev_48407));
} else {
return and__5000__auto__;
}
})())){
cljs.analyzer.warning(new cljs.core.Keyword(null,"dynamic","dynamic",704819571),env_48406__$1,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"ev","ev",-406827324),ev_48407,new cljs.core.Keyword(null,"name","name",1843675177),new cljs.core.Keyword(null,"name","name",1843675177).cljs$core$IFn$_invoke$arity$1(ev_48407)], null));
} else {
}


var G__48410 = cljs.core.next(seq__44675__$1);
var G__48411 = null;
var G__48412 = (0);
var G__48413 = (0);
seq__44675 = G__48410;
chunk__44676 = G__48411;
count__44677 = G__48412;
i__44678 = G__48413;
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
 * Given env, an analysis environment, and sym, a symbol, resolve a macro.
 */
cljs.analyzer.resolve_macro_var = (function cljs$analyzer$resolve_macro_var(env,sym){
var ns = new cljs.core.Keyword(null,"name","name",1843675177).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"ns","ns",441598760).cljs$core$IFn$_invoke$arity$1(env));
var namespaces = cljs.core.get.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(cljs.env._STAR_compiler_STAR_),new cljs.core.Keyword("cljs.analyzer","namespaces","cljs.analyzer/namespaces",-260788927));
if((!((cljs.core.namespace(sym) == null)))){
var ns__$1 = cljs.core.namespace(sym);
var ns__$2 = ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("clojure.core",ns__$1))?"cljs.core":ns__$1);
var full_ns = cljs.analyzer.resolve_macro_ns_alias.cljs$core$IFn$_invoke$arity$2(env,ns__$2);
var full_ns__$1 = (((!(clojure.string.ends_with_QMARK_(cljs.core.str.cljs$core$IFn$_invoke$arity$1(full_ns),"$macros"))))?cljs.core.symbol.cljs$core$IFn$_invoke$arity$1([cljs.core.str.cljs$core$IFn$_invoke$arity$1(full_ns),"$macros"].join('')):full_ns);
return cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(namespaces,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [full_ns__$1,new cljs.core.Keyword(null,"defs","defs",1398449717),cljs.core.symbol.cljs$core$IFn$_invoke$arity$1(cljs.core.name(sym))], null));
} else {
if((!((cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(namespaces,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [ns,new cljs.core.Keyword(null,"use-macros","use-macros",-905638393),sym], null)) == null)))){
var full_ns = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(namespaces,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [ns,new cljs.core.Keyword(null,"use-macros","use-macros",-905638393),sym], null));
return cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(namespaces,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [full_ns,new cljs.core.Keyword(null,"macros","macros",811339431),sym], null));
} else {
if((!((cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(namespaces,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [ns,new cljs.core.Keyword(null,"rename-macros","rename-macros",1076432512),sym], null)) == null)))){
var qualified_symbol = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(namespaces,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [ns,new cljs.core.Keyword(null,"rename-macros","rename-macros",1076432512),sym], null));
var full_ns = cljs.core.symbol.cljs$core$IFn$_invoke$arity$1(cljs.core.namespace(qualified_symbol));
var sym__$1 = cljs.core.symbol.cljs$core$IFn$_invoke$arity$1(cljs.core.name(qualified_symbol));
return cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(namespaces,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [full_ns,new cljs.core.Keyword(null,"macros","macros",811339431),sym__$1], null));
} else {
var ns__$1 = (((!((cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(namespaces,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [ns,new cljs.core.Keyword(null,"macros","macros",811339431),sym], null)) == null))))?ns:((cljs.analyzer.core_name_QMARK_(env,sym))?cljs.analyzer.impl.CLJS_CORE_MACROS_SYM:null));
if((!((ns__$1 == null)))){
return cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(namespaces,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [ns__$1,new cljs.core.Keyword(null,"defs","defs",1398449717),sym], null));
} else {
return null;
}

}
}
}
});


cljs.analyzer.specials = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 22, [new cljs.core.Symbol(null,"&","&",-2144855648,null),"null",new cljs.core.Symbol(null,"case*","case*",-1938255072,null),"null",new cljs.core.Symbol(null,"defrecord*","defrecord*",-1936366207,null),"null",new cljs.core.Symbol(null,"try","try",-1273693247,null),"null",new cljs.core.Symbol(null,"ns*","ns*",1840949383,null),"null",new cljs.core.Symbol(null,"loop*","loop*",615029416,null),"null",new cljs.core.Symbol(null,"do","do",1686842252,null),"null",new cljs.core.Symbol(null,"letfn*","letfn*",-110097810,null),"null",new cljs.core.Symbol(null,"if","if",1181717262,null),"null",new cljs.core.Symbol(null,"new","new",-444906321,null),"null",new cljs.core.Symbol(null,"ns","ns",2082130287,null),"null",new cljs.core.Symbol(null,"deftype*","deftype*",962659890,null),"null",new cljs.core.Symbol(null,"let*","let*",1920721458,null),"null",new cljs.core.Symbol(null,"js*","js*",-1134233646,null),"null",new cljs.core.Symbol(null,"fn*","fn*",-752876845,null),"null",new cljs.core.Symbol(null,"recur","recur",1202958259,null),"null",new cljs.core.Symbol(null,"set!","set!",250714521,null),"null",new cljs.core.Symbol(null,".",".",1975675962,null),"null",new cljs.core.Symbol(null,"var","var",870848730,null),"null",new cljs.core.Symbol(null,"quote","quote",1377916282,null),"null",new cljs.core.Symbol(null,"throw","throw",595905694,null),"null",new cljs.core.Symbol(null,"def","def",597100991,null),"null"], null), null);
cljs.analyzer._STAR_recur_frames_STAR_ = null;
cljs.analyzer._STAR_loop_lets_STAR_ = cljs.core.List.EMPTY;
cljs.analyzer._STAR_allow_redef_STAR_ = false;
cljs.analyzer._STAR_allow_ns_STAR_ = true;
cljs.analyzer.analyze_keyword = (function cljs$analyzer$analyze_keyword(env,sym){
cljs.analyzer.register_constant_BANG_.cljs$core$IFn$_invoke$arity$2(env,sym);

return new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"op","op",-1882987955),new cljs.core.Keyword(null,"const","const",1709929842),new cljs.core.Keyword(null,"val","val",128701612),sym,new cljs.core.Keyword(null,"env","env",-1815813235),env,new cljs.core.Keyword(null,"form","form",-1624062471),sym,new cljs.core.Keyword(null,"tag","tag",-1290361223),new cljs.core.Symbol("cljs.core","Keyword","cljs.core/Keyword",-451434488,null)], null);
});
cljs.analyzer.get_tag = (function cljs$analyzer$get_tag(ast){
var temp__5806__auto__ = new cljs.core.Keyword(null,"tag","tag",-1290361223).cljs$core$IFn$_invoke$arity$1(cljs.core.meta(new cljs.core.Keyword(null,"form","form",-1624062471).cljs$core$IFn$_invoke$arity$1(ast)));
if((temp__5806__auto__ == null)){
var temp__5806__auto____$1 = new cljs.core.Keyword(null,"tag","tag",-1290361223).cljs$core$IFn$_invoke$arity$1(ast);
if((temp__5806__auto____$1 == null)){
return new cljs.core.Keyword(null,"tag","tag",-1290361223).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"info","info",-317069002).cljs$core$IFn$_invoke$arity$1(ast));
} else {
var tag = temp__5806__auto____$1;
return tag;
}
} else {
var tag = temp__5806__auto__;
return tag;
}
});
cljs.analyzer.find_matching_method = (function cljs$analyzer$find_matching_method(fn_ast,params){
var methods$ = (function (){var or__5002__auto__ = new cljs.core.Keyword(null,"methods","methods",453930866).cljs$core$IFn$_invoke$arity$1(fn_ast);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword(null,"methods","methods",453930866).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"info","info",-317069002).cljs$core$IFn$_invoke$arity$1(fn_ast));
}
})();
var c = cljs.core.count(params);
return cljs.core.some((function (m){
var and__5000__auto__ = (function (){var or__5002__auto__ = (new cljs.core.Keyword(null,"fixed-arity","fixed-arity",1586445869).cljs$core$IFn$_invoke$arity$1(m) === c);
if(or__5002__auto__){
return or__5002__auto__;
} else {
return new cljs.core.Keyword(null,"variadic?","variadic?",584179762).cljs$core$IFn$_invoke$arity$1(m);
}
})();
if(cljs.core.truth_(and__5000__auto__)){
return m;
} else {
return and__5000__auto__;
}
}),methods$);
});
cljs.analyzer.type_QMARK_ = (function cljs$analyzer$type_QMARK_(env,t){
if((((!((t == null)))) && ((t instanceof cljs.core.Symbol)))){
var var$ = (function (){var _STAR_private_var_access_nowarn_STAR__orig_val__44758 = cljs.analyzer._STAR_private_var_access_nowarn_STAR_;
var _STAR_private_var_access_nowarn_STAR__temp_val__44759 = true;
(cljs.analyzer._STAR_private_var_access_nowarn_STAR_ = _STAR_private_var_access_nowarn_STAR__temp_val__44759);

try{return cljs.analyzer.resolve_var.cljs$core$IFn$_invoke$arity$2(env,t);
}finally {(cljs.analyzer._STAR_private_var_access_nowarn_STAR_ = _STAR_private_var_access_nowarn_STAR__orig_val__44758);
}})();
var temp__5806__auto__ = new cljs.core.Keyword(null,"type","type",1174270348).cljs$core$IFn$_invoke$arity$1(var$);
if((temp__5806__auto__ == null)){
var temp__5806__auto____$1 = new cljs.core.Keyword(null,"type","type",1174270348).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"info","info",-317069002).cljs$core$IFn$_invoke$arity$1(var$));
if((temp__5806__auto____$1 == null)){
var temp__5806__auto____$2 = new cljs.core.Keyword(null,"protocol-symbol","protocol-symbol",1279552198).cljs$core$IFn$_invoke$arity$1(var$);
if((temp__5806__auto____$2 == null)){
return cljs.core.get.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Symbol("cljs.core","PersistentHashMap","cljs.core/PersistentHashMap",-454120575,null),"null",new cljs.core.Symbol("cljs.core","List","cljs.core/List",1708954352,null),"null"], null), null),t);
} else {
var proto = temp__5806__auto____$2;
return proto;
}
} else {
var type = temp__5806__auto____$1;
return type;
}
} else {
var type = temp__5806__auto__;
return type;
}
} else {
return null;
}
});
cljs.analyzer.unwrap_quote = (function cljs$analyzer$unwrap_quote(p__44777){
var map__44783 = p__44777;
var map__44783__$1 = cljs.core.__destructure_map(map__44783);
var ast = map__44783__$1;
var op = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__44783__$1,new cljs.core.Keyword(null,"op","op",-1882987955));
if(cljs.core.keyword_identical_QMARK_(op,new cljs.core.Keyword(null,"quote","quote",-262615245))){
return new cljs.core.Keyword(null,"expr","expr",745722291).cljs$core$IFn$_invoke$arity$1(ast);
} else {
return ast;
}
});
cljs.analyzer.infer_if = (function cljs$analyzer$infer_if(env,ast){
var map__44790 = cljs.analyzer.unwrap_quote(new cljs.core.Keyword(null,"test","test",577538877).cljs$core$IFn$_invoke$arity$1(ast));
var map__44790__$1 = cljs.core.__destructure_map(map__44790);
var op = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__44790__$1,new cljs.core.Keyword(null,"op","op",-1882987955));
var form = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__44790__$1,new cljs.core.Keyword(null,"form","form",-1624062471));
var then_tag = (function (){var G__44804 = env;
var G__44805 = new cljs.core.Keyword(null,"then","then",460598070).cljs$core$IFn$_invoke$arity$1(ast);
return (cljs.analyzer.infer_tag.cljs$core$IFn$_invoke$arity$2 ? cljs.analyzer.infer_tag.cljs$core$IFn$_invoke$arity$2(G__44804,G__44805) : cljs.analyzer.infer_tag.call(null,G__44804,G__44805));
})();
if(((cljs.core.keyword_identical_QMARK_(op,new cljs.core.Keyword(null,"const","const",1709929842))) && ((((!((form == null)))) && ((!(form === false))))))){
return then_tag;
} else {
var else_tag = (function (){var G__44807 = env;
var G__44808 = new cljs.core.Keyword(null,"else","else",-1508377146).cljs$core$IFn$_invoke$arity$1(ast);
return (cljs.analyzer.infer_tag.cljs$core$IFn$_invoke$arity$2 ? cljs.analyzer.infer_tag.cljs$core$IFn$_invoke$arity$2(G__44807,G__44808) : cljs.analyzer.infer_tag.call(null,G__44807,G__44808));
})();
if(((cljs.core.symbol_identical_QMARK_(then_tag,else_tag)) || (cljs.core.symbol_identical_QMARK_(else_tag,cljs.analyzer.impl.IGNORE_SYM)))){
return then_tag;
} else {
if(cljs.core.symbol_identical_QMARK_(then_tag,cljs.analyzer.impl.IGNORE_SYM)){
return else_tag;
} else {
if((((((!((cljs.core.get.cljs$core$IFn$_invoke$arity$2(cljs.analyzer.impl.NOT_NATIVE,then_tag) == null)))) || (cljs.analyzer.type_QMARK_(env,then_tag)))) && ((((!((cljs.core.get.cljs$core$IFn$_invoke$arity$2(cljs.analyzer.impl.NOT_NATIVE,else_tag) == null)))) || (cljs.analyzer.type_QMARK_(env,else_tag)))))){
return new cljs.core.Symbol(null,"clj","clj",980036099,null);
} else {
if((((!((cljs.core.get.cljs$core$IFn$_invoke$arity$2(cljs.analyzer.impl.BOOLEAN_OR_SEQ,then_tag) == null)))) && ((!((cljs.core.get.cljs$core$IFn$_invoke$arity$2(cljs.analyzer.impl.BOOLEAN_OR_SEQ,else_tag) == null)))))){
return new cljs.core.Symbol(null,"seq","seq",-177272256,null);
} else {
var then_tag__$1 = ((cljs.analyzer.impl.cljs_set_QMARK_(then_tag))?then_tag:cljs.core.PersistentHashSet.createAsIfByAssoc([then_tag]));
var else_tag__$1 = ((cljs.analyzer.impl.cljs_set_QMARK_(else_tag))?else_tag:cljs.core.PersistentHashSet.createAsIfByAssoc([else_tag]));
return cljs.core.into.cljs$core$IFn$_invoke$arity$2(then_tag__$1,else_tag__$1);
}

}
}
}
}
});
cljs.analyzer.js_var_QMARK_ = (function cljs$analyzer$js_var_QMARK_(ast){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"js-var","js-var",-1177899142),new cljs.core.Keyword(null,"op","op",-1882987955).cljs$core$IFn$_invoke$arity$1(ast));
});
cljs.analyzer.js_var_fn_QMARK_ = (function cljs$analyzer$js_var_fn_QMARK_(fn_ast){
return cljs.analyzer.js_var_QMARK_(new cljs.core.Keyword(null,"info","info",-317069002).cljs$core$IFn$_invoke$arity$1(fn_ast));
});
cljs.analyzer.fn_ast__GT_tag = (function cljs$analyzer$fn_ast__GT_tag(p__44823){
var map__44827 = p__44823;
var map__44827__$1 = cljs.core.__destructure_map(map__44827);
var fn_ast = map__44827__$1;
var info = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__44827__$1,new cljs.core.Keyword(null,"info","info",-317069002));
if(cljs.core.truth_(new cljs.core.Keyword(null,"fn-var","fn-var",1086204730).cljs$core$IFn$_invoke$arity$1(info))){
return new cljs.core.Keyword(null,"ret-tag","ret-tag",1705919990).cljs$core$IFn$_invoke$arity$1(info);
} else {
if(cljs.core.truth_(new cljs.core.Keyword(null,"js-fn-var","js-fn-var",-565665358).cljs$core$IFn$_invoke$arity$1(info))){
return new cljs.core.Keyword(null,"ret-tag","ret-tag",1705919990).cljs$core$IFn$_invoke$arity$1(info);
} else {
if(cljs.analyzer.js_var_fn_QMARK_(fn_ast)){
return new cljs.core.Symbol(null,"js","js",-886355190,null);
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Symbol(null,"js","js",-886355190,null),new cljs.core.Keyword(null,"ns","ns",441598760).cljs$core$IFn$_invoke$arity$1(info))){
return new cljs.core.Symbol(null,"js","js",-886355190,null);
} else {
return null;
}

}
}
}
});
cljs.analyzer.infer_invoke = (function cljs$analyzer$infer_invoke(env,p__44832){
var map__44834 = p__44832;
var map__44834__$1 = cljs.core.__destructure_map(map__44834);
var ast = map__44834__$1;
var fn_ast = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__44834__$1,new cljs.core.Keyword(null,"fn","fn",-1175266204));
var args = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__44834__$1,new cljs.core.Keyword(null,"args","args",1315556576));
var me__$1 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(cljs.analyzer.find_matching_method(fn_ast,args),new cljs.core.Keyword(null,"op","op",-1882987955),new cljs.core.Keyword(null,"fn-method","fn-method",236100839));
var temp__5806__auto__ = (cljs.analyzer.infer_tag.cljs$core$IFn$_invoke$arity$2 ? cljs.analyzer.infer_tag.cljs$core$IFn$_invoke$arity$2(env,me__$1) : cljs.analyzer.infer_tag.call(null,env,me__$1));
if((temp__5806__auto__ == null)){
var temp__5806__auto____$1 = cljs.analyzer.fn_ast__GT_tag(fn_ast);
if((temp__5806__auto____$1 == null)){
return cljs.analyzer.impl.ANY_SYM;
} else {
var ret_tag = temp__5806__auto____$1;
return ret_tag;
}
} else {
var ret_tag = temp__5806__auto__;
return ret_tag;
}
});
/**
 * Given env, an analysis environment, and e, an AST node, return the inferred
 * type of the node
 */
cljs.analyzer.infer_tag = (function cljs$analyzer$infer_tag(env,ast){
var temp__5806__auto__ = cljs.analyzer.get_tag(ast);
if((temp__5806__auto__ == null)){
var G__44848 = new cljs.core.Keyword(null,"op","op",-1882987955).cljs$core$IFn$_invoke$arity$1(ast);
var G__44848__$1 = (((G__44848 instanceof cljs.core.Keyword))?G__44848.fqn:null);
switch (G__44848__$1) {
case "recur":
return cljs.analyzer.impl.IGNORE_SYM;

break;
case "throw":
return cljs.analyzer.impl.IGNORE_SYM;

break;
case "let":
var G__44853 = env;
var G__44854 = new cljs.core.Keyword(null,"body","body",-2049205669).cljs$core$IFn$_invoke$arity$1(ast);
return (cljs.analyzer.infer_tag.cljs$core$IFn$_invoke$arity$2 ? cljs.analyzer.infer_tag.cljs$core$IFn$_invoke$arity$2(G__44853,G__44854) : cljs.analyzer.infer_tag.call(null,G__44853,G__44854));

break;
case "loop":
var G__44855 = env;
var G__44856 = new cljs.core.Keyword(null,"body","body",-2049205669).cljs$core$IFn$_invoke$arity$1(ast);
return (cljs.analyzer.infer_tag.cljs$core$IFn$_invoke$arity$2 ? cljs.analyzer.infer_tag.cljs$core$IFn$_invoke$arity$2(G__44855,G__44856) : cljs.analyzer.infer_tag.call(null,G__44855,G__44856));

break;
case "do":
var G__44857 = env;
var G__44858 = new cljs.core.Keyword(null,"ret","ret",-468222814).cljs$core$IFn$_invoke$arity$1(ast);
return (cljs.analyzer.infer_tag.cljs$core$IFn$_invoke$arity$2 ? cljs.analyzer.infer_tag.cljs$core$IFn$_invoke$arity$2(G__44857,G__44858) : cljs.analyzer.infer_tag.call(null,G__44857,G__44858));

break;
case "fn-method":
var G__44859 = env;
var G__44860 = new cljs.core.Keyword(null,"body","body",-2049205669).cljs$core$IFn$_invoke$arity$1(ast);
return (cljs.analyzer.infer_tag.cljs$core$IFn$_invoke$arity$2 ? cljs.analyzer.infer_tag.cljs$core$IFn$_invoke$arity$2(G__44859,G__44860) : cljs.analyzer.infer_tag.call(null,G__44859,G__44860));

break;
case "def":
var G__44866 = env;
var G__44867 = new cljs.core.Keyword(null,"init","init",-1875481434).cljs$core$IFn$_invoke$arity$1(ast);
return (cljs.analyzer.infer_tag.cljs$core$IFn$_invoke$arity$2 ? cljs.analyzer.infer_tag.cljs$core$IFn$_invoke$arity$2(G__44866,G__44867) : cljs.analyzer.infer_tag.call(null,G__44866,G__44867));

break;
case "invoke":
return cljs.analyzer.infer_invoke(env,ast);

break;
case "if":
return cljs.analyzer.infer_if(env,ast);

break;
case "const":
var G__44869 = new cljs.core.Keyword(null,"form","form",-1624062471).cljs$core$IFn$_invoke$arity$1(ast);
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(true,G__44869)){
return cljs.analyzer.impl.BOOLEAN_SYM;
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(false,G__44869)){
return cljs.analyzer.impl.BOOLEAN_SYM;
} else {
return cljs.analyzer.impl.ANY_SYM;

}
}

break;
case "quote":
var G__44883 = env;
var G__44884 = new cljs.core.Keyword(null,"expr","expr",745722291).cljs$core$IFn$_invoke$arity$1(ast);
return (cljs.analyzer.infer_tag.cljs$core$IFn$_invoke$arity$2 ? cljs.analyzer.infer_tag.cljs$core$IFn$_invoke$arity$2(G__44883,G__44884) : cljs.analyzer.infer_tag.call(null,G__44883,G__44884));

break;
case "var":
case "local":
case "js-var":
case "binding":
var temp__5806__auto____$1 = new cljs.core.Keyword(null,"init","init",-1875481434).cljs$core$IFn$_invoke$arity$1(ast);
if((temp__5806__auto____$1 == null)){
var G__44885 = env;
var G__44886 = new cljs.core.Keyword(null,"info","info",-317069002).cljs$core$IFn$_invoke$arity$1(ast);
return (cljs.analyzer.infer_tag.cljs$core$IFn$_invoke$arity$2 ? cljs.analyzer.infer_tag.cljs$core$IFn$_invoke$arity$2(G__44885,G__44886) : cljs.analyzer.infer_tag.call(null,G__44885,G__44886));
} else {
var init = temp__5806__auto____$1;
return (cljs.analyzer.infer_tag.cljs$core$IFn$_invoke$arity$2 ? cljs.analyzer.infer_tag.cljs$core$IFn$_invoke$arity$2(env,init) : cljs.analyzer.infer_tag.call(null,env,init));
}

break;
case "host-field":
case "host-call":
return cljs.analyzer.impl.ANY_SYM;

break;
case "js":
return cljs.analyzer.impl.ANY_SYM;

break;
default:
return null;

}
} else {
var tag = temp__5806__auto__;
return tag;
}
});
if((typeof cljs !== 'undefined') && (typeof cljs.analyzer !== 'undefined') && (typeof cljs.analyzer.parse !== 'undefined')){
} else {
cljs.analyzer.parse = (function (){var method_table__5599__auto__ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
var prefer_table__5600__auto__ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
var method_cache__5601__auto__ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
var cached_hierarchy__5602__auto__ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
var hierarchy__5603__auto__ = cljs.core.get.cljs$core$IFn$_invoke$arity$3(cljs.core.PersistentArrayMap.EMPTY,new cljs.core.Keyword(null,"hierarchy","hierarchy",-1053470341),(function (){var fexpr__44894 = cljs.core.get_global_hierarchy;
return (fexpr__44894.cljs$core$IFn$_invoke$arity$0 ? fexpr__44894.cljs$core$IFn$_invoke$arity$0() : fexpr__44894.call(null));
})());
return (new cljs.core.MultiFn(cljs.core.symbol.cljs$core$IFn$_invoke$arity$2("cljs.analyzer","parse"),(function() { 
var G__48478__delegate = function (op,rest){
return op;
};
var G__48478 = function (op,var_args){
var rest = null;
if (arguments.length > 1) {
var G__48479__i = 0, G__48479__a = new Array(arguments.length -  1);
while (G__48479__i < G__48479__a.length) {G__48479__a[G__48479__i] = arguments[G__48479__i + 1]; ++G__48479__i;}
  rest = new cljs.core.IndexedSeq(G__48479__a,0,null);
} 
return G__48478__delegate.call(this,op,rest);};
G__48478.cljs$lang$maxFixedArity = 1;
G__48478.cljs$lang$applyTo = (function (arglist__48480){
var op = cljs.core.first(arglist__48480);
var rest = cljs.core.rest(arglist__48480);
return G__48478__delegate(op,rest);
});
G__48478.cljs$core$IFn$_invoke$arity$variadic = G__48478__delegate;
return G__48478;
})()
,new cljs.core.Keyword(null,"default","default",-1987822328),hierarchy__5603__auto__,method_table__5599__auto__,prefer_table__5600__auto__,method_cache__5601__auto__,cached_hierarchy__5602__auto__));
})();
}
cljs.analyzer.var_meta = (function cljs$analyzer$var_meta(var_args){
var G__44904 = arguments.length;
switch (G__44904) {
case 1:
return cljs.analyzer.var_meta.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return cljs.analyzer.var_meta.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(cljs.analyzer.var_meta.cljs$core$IFn$_invoke$arity$1 = (function (var$){
return cljs.analyzer.var_meta.cljs$core$IFn$_invoke$arity$2(var$,null);
}));

(cljs.analyzer.var_meta.cljs$core$IFn$_invoke$arity$2 = (function (var$,expr_env){
var sym = new cljs.core.Keyword(null,"name","name",1843675177).cljs$core$IFn$_invoke$arity$1(var$);
var ks = new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"ns","ns",441598760),new cljs.core.Keyword(null,"doc","doc",1913296891),new cljs.core.Keyword(null,"file","file",-1269645878),new cljs.core.Keyword(null,"line","line",212345235),new cljs.core.Keyword(null,"column","column",2078222095)], null);
var m = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([(function (){var user_meta = new cljs.core.Keyword(null,"meta","meta",1499536964).cljs$core$IFn$_invoke$arity$1(var$);
var uks = cljs.core.keys(user_meta);
return cljs.core.zipmap(uks,cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__44897_SHARP_){
return (new cljs.core.List(null,new cljs.core.Symbol(null,"quote","quote",1377916282,null),(new cljs.core.List(null,cljs.core.get.cljs$core$IFn$_invoke$arity$2(user_meta,p1__44897_SHARP_),null,(1),null)),(2),null));
}),uks));
})(),cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(cljs.core.zipmap(ks,cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__44898_SHARP_){
return (new cljs.core.List(null,new cljs.core.Symbol(null,"quote","quote",1377916282,null),(new cljs.core.List(null,cljs.core.get.cljs$core$IFn$_invoke$arity$2(var$,p1__44898_SHARP_),null,(1),null)),(2),null));
}),ks)),new cljs.core.Keyword(null,"name","name",1843675177),cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$2((new cljs.core.List(null,new cljs.core.Symbol(null,"quote","quote",1377916282,null),null,(1),null)),(new cljs.core.List(null,cljs.core.symbol.cljs$core$IFn$_invoke$arity$1(cljs.core.name(new cljs.core.Keyword(null,"name","name",1843675177).cljs$core$IFn$_invoke$arity$1(var$))),null,(1),null))))),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"test","test",577538877),cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic((new cljs.core.List(null,new cljs.core.Symbol("cljs.core","when","cljs.core/when",120293186,null),null,(1),null)),(new cljs.core.List(null,sym,null,(1),null)),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([(new cljs.core.List(null,cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$2((new cljs.core.List(null,new cljs.core.Symbol(null,".-cljs$lang$test",".-cljs$lang$test",718963148,null),null,(1),null)),(new cljs.core.List(null,sym,null,(1),null))))),null,(1),null))], 0)))),new cljs.core.Keyword(null,"arglists","arglists",1661989754),(function (){var arglists = new cljs.core.Keyword(null,"arglists","arglists",1661989754).cljs$core$IFn$_invoke$arity$1(var$);
var arglists_SINGLEQUOTE_ = ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Symbol(null,"quote","quote",1377916282,null),cljs.core.first(arglists)))?cljs.core.second(arglists):arglists);
return (new cljs.core.List(null,new cljs.core.Symbol(null,"quote","quote",1377916282,null),(new cljs.core.List(null,cljs.core.doall.cljs$core$IFn$_invoke$arity$1(cljs.core.map.cljs$core$IFn$_invoke$arity$3(cljs.core.with_meta,arglists_SINGLEQUOTE_,new cljs.core.Keyword(null,"arglists-meta","arglists-meta",1944829838).cljs$core$IFn$_invoke$arity$1(var$))),null,(1),null)),(2),null));
})()], 0))], 0));
if(cljs.core.truth_(expr_env)){
return (cljs.analyzer.analyze.cljs$core$IFn$_invoke$arity$2 ? cljs.analyzer.analyze.cljs$core$IFn$_invoke$arity$2(expr_env,m) : cljs.analyzer.analyze.call(null,expr_env,m));
} else {
return m;
}
}));

(cljs.analyzer.var_meta.cljs$lang$maxFixedArity = 2);

cljs.analyzer.var_ast = (function cljs$analyzer$var_ast(env,sym){
var _STAR_private_var_access_nowarn_STAR__orig_val__44909 = cljs.analyzer._STAR_private_var_access_nowarn_STAR_;
var _STAR_private_var_access_nowarn_STAR__temp_val__44910 = true;
(cljs.analyzer._STAR_private_var_access_nowarn_STAR_ = _STAR_private_var_access_nowarn_STAR__temp_val__44910);

try{var env__$1 = cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(env,new cljs.core.Keyword(null,"locals","locals",535295783));
var var$ = cljs.analyzer.resolve_var.cljs$core$IFn$_invoke$arity$3(env__$1,sym,cljs.analyzer.confirm_var_exists_throw());
var expr_env = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(env__$1,new cljs.core.Keyword(null,"context","context",-830191113),new cljs.core.Keyword(null,"expr","expr",745722291));
var temp__5808__auto__ = new cljs.core.Keyword(null,"ns","ns",441598760).cljs$core$IFn$_invoke$arity$1(var$);
if((temp__5808__auto__ == null)){
return null;
} else {
var var_ns = temp__5808__auto__;
return new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"var","var",-769682797),(cljs.analyzer.analyze.cljs$core$IFn$_invoke$arity$2 ? cljs.analyzer.analyze.cljs$core$IFn$_invoke$arity$2(expr_env,sym) : cljs.analyzer.analyze.call(null,expr_env,sym)),new cljs.core.Keyword(null,"sym","sym",-1444860305),(function (){var G__44914 = expr_env;
var G__44915 = cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$2((new cljs.core.List(null,new cljs.core.Symbol(null,"quote","quote",1377916282,null),null,(1),null)),(new cljs.core.List(null,cljs.core.symbol.cljs$core$IFn$_invoke$arity$2(cljs.core.name(var_ns),cljs.core.name(new cljs.core.Keyword(null,"name","name",1843675177).cljs$core$IFn$_invoke$arity$1(var$))),null,(1),null)))));
return (cljs.analyzer.analyze.cljs$core$IFn$_invoke$arity$2 ? cljs.analyzer.analyze.cljs$core$IFn$_invoke$arity$2(G__44914,G__44915) : cljs.analyzer.analyze.call(null,G__44914,G__44915));
})(),new cljs.core.Keyword(null,"meta","meta",1499536964),cljs.analyzer.var_meta.cljs$core$IFn$_invoke$arity$2(var$,expr_env)], null);
}
}finally {(cljs.analyzer._STAR_private_var_access_nowarn_STAR_ = _STAR_private_var_access_nowarn_STAR__orig_val__44909);
}});
cljs.analyzer.parse.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Symbol(null,"var","var",870848730,null),(function (op,env,p__44930,_,___$1){
var vec__44931 = p__44930;
var ___$2 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__44931,(0),null);
var sym = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__44931,(1),null);
var form = vec__44931;
if(cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2((2),cljs.core.count(form))){
throw cljs.analyzer.error.cljs$core$IFn$_invoke$arity$2(env,"Wrong number of args to var");
} else {
}

if((sym instanceof cljs.core.Symbol)){
} else {
throw cljs.analyzer.error.cljs$core$IFn$_invoke$arity$2(env,"Argument to var must be symbol");
}

return cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"env","env",-1815813235),env,new cljs.core.Keyword(null,"op","op",-1882987955),new cljs.core.Keyword(null,"the-var","the-var",1428415613),new cljs.core.Keyword(null,"children","children",-940561982),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"var","var",-769682797),new cljs.core.Keyword(null,"sym","sym",-1444860305),new cljs.core.Keyword(null,"meta","meta",1499536964)], null),new cljs.core.Keyword(null,"form","form",-1624062471),form], null),cljs.analyzer.var_ast(env,sym)], 0));
}));
cljs.analyzer.predicate__GT_tag = cljs.core.PersistentHashMap.fromArrays([new cljs.core.Symbol("cljs.core","array?","cljs.core/array?",-1655912448,null),new cljs.core.Symbol("cljs.core","boolean?","cljs.core/boolean?",1400713761,null),new cljs.core.Symbol("cljs.core","char?","cljs.core/char?",416405281,null),new cljs.core.Symbol("cljs.core","sequential?","cljs.core/sequential?",1777854658,null),new cljs.core.Symbol("cljs.core","keyword?","cljs.core/keyword?",713156450,null),new cljs.core.Symbol("cljs.core","simple-symbol?","cljs.core/simple-symbol?",-1951205629,null),new cljs.core.Symbol("cljs.core","qualified-symbol?","cljs.core/qualified-symbol?",1570873476,null),new cljs.core.Symbol("cljs.core","var?","cljs.core/var?",1711182854,null),new cljs.core.Symbol("cljs.core","map-entry?","cljs.core/map-entry?",465406728,null),new cljs.core.Symbol("cljs.core","double?","cljs.core/double?",1757455529,null),new cljs.core.Symbol("cljs.core","string?","cljs.core/string?",-2072921719,null),new cljs.core.Symbol("cljs.core","qualified-ident?","cljs.core/qualified-ident?",-1863492566,null),new cljs.core.Symbol("cljs.core","qualified-keyword?","cljs.core/qualified-keyword?",-308091478,null),new cljs.core.Symbol("cljs.core","inst?","cljs.core/inst?",1216133710,null),new cljs.core.Symbol("cljs.core","float?","cljs.core/float?",-941017745,null),new cljs.core.Symbol("cljs.core","true?","cljs.core/true?",-77973136,null),new cljs.core.Symbol("cljs.core","number?","cljs.core/number?",-811857295,null),new cljs.core.Symbol("cljs.core","volatile?","cljs.core/volatile?",-1122186415,null),new cljs.core.Symbol("cljs.core","integer?","cljs.core/integer?",1710697810,null),new cljs.core.Symbol("cljs.core","infinite?","cljs.core/infinite?",-1069503726,null),new cljs.core.Symbol("cljs.core","undefined?","cljs.core/undefined?",-1206515693,null),new cljs.core.Symbol("cljs.core","uuid?","cljs.core/uuid?",-15131116,null),new cljs.core.Symbol("cljs.core","record?","cljs.core/record?",1307655860,null),new cljs.core.Symbol("cljs.core","reduced?","cljs.core/reduced?",-1192491371,null),new cljs.core.Symbol("cljs.core","tagged-literal?","cljs.core/tagged-literal?",-1159666987,null),new cljs.core.Symbol("cljs.core","nil?","cljs.core/nil?",945071861,null),new cljs.core.Symbol("cljs.core","zero?","cljs.core/zero?",-341242858,null),new cljs.core.Symbol("cljs.core","false?","cljs.core/false?",-1660815306,null),new cljs.core.Symbol("cljs.core","list?","cljs.core/list?",-684796618,null),new cljs.core.Symbol("cljs.core","simple-ident?","cljs.core/simple-ident?",1674885558,null),new cljs.core.Symbol("cljs.core","simple-keyword?","cljs.core/simple-keyword?",39474330,null),new cljs.core.Symbol("cljs.core","seqable?","cljs.core/seqable?",-745394886,null),new cljs.core.Symbol("cljs.core","symbol?","cljs.core/symbol?",1422196122,null),new cljs.core.Symbol("cljs.core","seq?","cljs.core/seq?",-1302056292,null),new cljs.core.Symbol("cljs.core","delay?","cljs.core/delay?",2099859324,null),new cljs.core.Symbol("cljs.core","regexp?","cljs.core/regexp?",-348418979,null),new cljs.core.Symbol("cljs.core","ident?","cljs.core/ident?",1567441535,null),new cljs.core.Symbol("cljs.core","chunked-seq?","cljs.core/chunked-seq?",-712922369,null)],[new cljs.core.Symbol(null,"array","array",-440182315,null),new cljs.core.Symbol(null,"boolean","boolean",-278886877,null),new cljs.core.Symbol(null,"string","string",-349010059,null),new cljs.core.Symbol("cljs.core","ISequential","cljs.core/ISequential",-950981796,null),new cljs.core.Symbol("cljs.core","Keyword","cljs.core/Keyword",-451434488,null),new cljs.core.Symbol("cljs.core","Symbol","cljs.core/Symbol",292989338,null),new cljs.core.Symbol("cljs.core","Symbol","cljs.core/Symbol",292989338,null),new cljs.core.Symbol("cljs.core","Var","cljs.core/Var",2071014443,null),new cljs.core.Symbol("cljs.core","IMapEntry","cljs.core/IMapEntry",535941300,null),new cljs.core.Symbol(null,"number","number",-1084057331,null),new cljs.core.Symbol(null,"string","string",-349010059,null),new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Symbol("cljs.core","Keyword","cljs.core/Keyword",-451434488,null),"null",new cljs.core.Symbol("cljs.core","Symbol","cljs.core/Symbol",292989338,null),"null"], null), null),new cljs.core.Symbol("cljs.core","Keyword","cljs.core/Keyword",-451434488,null),new cljs.core.Symbol("cljs.core","Inst","cljs.core/Inst",959205835,null),new cljs.core.Symbol(null,"number","number",-1084057331,null),new cljs.core.Symbol(null,"boolean","boolean",-278886877,null),new cljs.core.Symbol(null,"number","number",-1084057331,null),new cljs.core.Symbol("cljs.core","Volatile","cljs.core/Volatile",-1098692185,null),new cljs.core.Symbol(null,"number","number",-1084057331,null),new cljs.core.Symbol(null,"number","number",-1084057331,null),new cljs.core.Symbol(null,"clj-nil","clj-nil",1321798654,null),new cljs.core.Symbol("cljs.core","IUUID","cljs.core/IUUID",-1606521379,null),new cljs.core.Symbol("cljs.core","IRecord","cljs.core/IRecord",635852000,null),new cljs.core.Symbol("cljs.core","Reduced","cljs.core/Reduced",971663396,null),new cljs.core.Symbol("cljs.core","ITaggedLiteral","cljs.core/ITaggedLiteral",-1236965094,null),new cljs.core.Symbol(null,"clj-nil","clj-nil",1321798654,null),new cljs.core.Symbol(null,"number","number",-1084057331,null),new cljs.core.Symbol(null,"boolean","boolean",-278886877,null),new cljs.core.Symbol("cljs.core","IList","cljs.core/IList",1015168964,null),new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Symbol("cljs.core","Keyword","cljs.core/Keyword",-451434488,null),"null",new cljs.core.Symbol("cljs.core","Symbol","cljs.core/Symbol",292989338,null),"null"], null), null),new cljs.core.Symbol("cljs.core","Keyword","cljs.core/Keyword",-451434488,null),new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Symbol("cljs.core","ISeqable","cljs.core/ISeqable",137437203,null),"null",new cljs.core.Symbol(null,"array","array",-440182315,null),"null",new cljs.core.Symbol(null,"string","string",-349010059,null),"null"], null), null),new cljs.core.Symbol("cljs.core","Symbol","cljs.core/Symbol",292989338,null),new cljs.core.Symbol(null,"seq","seq",-177272256,null),new cljs.core.Symbol("cljs.core","Delay","cljs.core/Delay",-21574999,null),new cljs.core.Symbol("js","RegExp","js/RegExp",1778210562,null),new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Symbol("cljs.core","Keyword","cljs.core/Keyword",-451434488,null),"null",new cljs.core.Symbol("cljs.core","Symbol","cljs.core/Symbol",292989338,null),"null"], null), null),new cljs.core.Symbol("cljs.core","IChunkedSeq","cljs.core/IChunkedSeq",-892943716,null)]);
/**
 * Look for a predicate-induced tag when the test expression is a simple
 * application of a predicate to a local, as in (string? x).
 */
cljs.analyzer.simple_predicate_induced_tag = (function cljs$analyzer$simple_predicate_induced_tag(env,test){
if(((cljs.core.list_QMARK_(test)) && (((((2) === cljs.core.count(test))) && (cljs.core.every_QMARK_(cljs.core.symbol_QMARK_,test)))))){
var analyzed_fn = (function (){var _STAR_cljs_warnings_STAR__orig_val__44949 = cljs.analyzer._STAR_cljs_warnings_STAR_;
var _STAR_cljs_warnings_STAR__temp_val__44950 = cljs.core.zipmap(cljs.core.keys(cljs.analyzer._STAR_cljs_warnings_STAR_),cljs.core.repeat.cljs$core$IFn$_invoke$arity$1(false));
(cljs.analyzer._STAR_cljs_warnings_STAR_ = _STAR_cljs_warnings_STAR__temp_val__44950);

try{var G__44952 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(env,new cljs.core.Keyword(null,"context","context",-830191113),new cljs.core.Keyword(null,"expr","expr",745722291));
var G__44953 = cljs.core.first(test);
return (cljs.analyzer.analyze.cljs$core$IFn$_invoke$arity$2 ? cljs.analyzer.analyze.cljs$core$IFn$_invoke$arity$2(G__44952,G__44953) : cljs.analyzer.analyze.call(null,G__44952,G__44953));
}finally {(cljs.analyzer._STAR_cljs_warnings_STAR_ = _STAR_cljs_warnings_STAR__orig_val__44949);
}})();
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"var","var",-769682797),new cljs.core.Keyword(null,"op","op",-1882987955).cljs$core$IFn$_invoke$arity$1(analyzed_fn))){
var temp__5804__auto__ = (function (){var G__44955 = new cljs.core.Keyword(null,"name","name",1843675177).cljs$core$IFn$_invoke$arity$1(analyzed_fn);
return (cljs.analyzer.predicate__GT_tag.cljs$core$IFn$_invoke$arity$1 ? cljs.analyzer.predicate__GT_tag.cljs$core$IFn$_invoke$arity$1(G__44955) : cljs.analyzer.predicate__GT_tag.call(null,G__44955));
})();
if(cljs.core.truth_(temp__5804__auto__)){
var tag = temp__5804__auto__;
var sym = cljs.core.last(test);
if(cljs.core.truth_((function (){var and__5000__auto__ = (cljs.core.namespace(sym) == null);
if(and__5000__auto__){
return cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(env,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"locals","locals",535295783),sym], null));
} else {
return and__5000__auto__;
}
})())){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [sym,tag], null);
} else {
return null;
}
} else {
return null;
}
} else {
return null;
}
} else {
return null;
}
});
/**
 * Look for a type-check-induced tag when the test expression is the use of
 *   instance? on a local, as in (instance? UUID x) or implements? on a local, as
 *   in (implements? ICounted x).
 */
cljs.analyzer.type_check_induced_tag = (function cljs$analyzer$type_check_induced_tag(env,test){
if(((cljs.core.list_QMARK_(test)) && (((((3) === cljs.core.count(test))) && (((cljs.core.every_QMARK_(cljs.core.symbol_QMARK_,test)) && ((!(cljs.core.contains_QMARK_(cljs.analyzer.specials,cljs.core.first(test))))))))))){
var analyzed_fn = (function (){var _STAR_cljs_warnings_STAR__orig_val__44965 = cljs.analyzer._STAR_cljs_warnings_STAR_;
var _STAR_cljs_warnings_STAR__temp_val__44966 = cljs.core.zipmap(cljs.core.keys(cljs.analyzer._STAR_cljs_warnings_STAR_),cljs.core.repeat.cljs$core$IFn$_invoke$arity$1(false));
(cljs.analyzer._STAR_cljs_warnings_STAR_ = _STAR_cljs_warnings_STAR__temp_val__44966);

try{var G__44967 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(env,new cljs.core.Keyword(null,"context","context",-830191113),new cljs.core.Keyword(null,"expr","expr",745722291));
var G__44968 = cljs.core.first(test);
return (cljs.analyzer.analyze.cljs$core$IFn$_invoke$arity$2 ? cljs.analyzer.analyze.cljs$core$IFn$_invoke$arity$2(G__44967,G__44968) : cljs.analyzer.analyze.call(null,G__44967,G__44968));
}finally {(cljs.analyzer._STAR_cljs_warnings_STAR_ = _STAR_cljs_warnings_STAR__orig_val__44965);
}})();
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"var","var",-769682797),new cljs.core.Keyword(null,"op","op",-1882987955).cljs$core$IFn$_invoke$arity$1(analyzed_fn))){
if(cljs.core.truth_((function (){var G__44971 = new cljs.core.Keyword(null,"name","name",1843675177).cljs$core$IFn$_invoke$arity$1(analyzed_fn);
var fexpr__44970 = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Symbol("cljs.core","implements?","cljs.core/implements?",-251485149,null),"null",new cljs.core.Symbol("cljs.core","instance?","cljs.core/instance?",2044751870,null),"null"], null), null);
return (fexpr__44970.cljs$core$IFn$_invoke$arity$1 ? fexpr__44970.cljs$core$IFn$_invoke$arity$1(G__44971) : fexpr__44970.call(null,G__44971));
})())){
var analyzed_type = (function (){var _STAR_cljs_warnings_STAR__orig_val__44975 = cljs.analyzer._STAR_cljs_warnings_STAR_;
var _STAR_cljs_warnings_STAR__temp_val__44976 = cljs.core.zipmap(cljs.core.keys(cljs.analyzer._STAR_cljs_warnings_STAR_),cljs.core.repeat.cljs$core$IFn$_invoke$arity$1(false));
(cljs.analyzer._STAR_cljs_warnings_STAR_ = _STAR_cljs_warnings_STAR__temp_val__44976);

try{var G__44977 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(env,new cljs.core.Keyword(null,"context","context",-830191113),new cljs.core.Keyword(null,"expr","expr",745722291));
var G__44978 = cljs.core.second(test);
return (cljs.analyzer.analyze.cljs$core$IFn$_invoke$arity$2 ? cljs.analyzer.analyze.cljs$core$IFn$_invoke$arity$2(G__44977,G__44978) : cljs.analyzer.analyze.call(null,G__44977,G__44978));
}finally {(cljs.analyzer._STAR_cljs_warnings_STAR_ = _STAR_cljs_warnings_STAR__orig_val__44975);
}})();
var tag = new cljs.core.Keyword(null,"name","name",1843675177).cljs$core$IFn$_invoke$arity$1(analyzed_type);
var sym = cljs.core.last(test);
if(cljs.core.truth_((function (){var and__5000__auto__ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"var","var",-769682797),new cljs.core.Keyword(null,"op","op",-1882987955).cljs$core$IFn$_invoke$arity$1(analyzed_type));
if(and__5000__auto__){
var and__5000__auto____$1 = (cljs.core.namespace(sym) == null);
if(and__5000__auto____$1){
return cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(env,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"locals","locals",535295783),sym], null));
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})())){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [sym,tag], null);
} else {
return null;
}
} else {
return null;
}
} else {
return null;
}
} else {
return null;
}
});
/**
 * Refine a tag to exclude clj-nil if the test is a local.
 */
cljs.analyzer.truth_induced_tag = (function cljs$analyzer$truth_induced_tag(env,test){
if(cljs.core.truth_((function (){var and__5000__auto__ = (test instanceof cljs.core.Symbol);
if(and__5000__auto__){
var and__5000__auto____$1 = (cljs.core.namespace(test) == null);
if(and__5000__auto____$1){
return cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(env,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"locals","locals",535295783),test], null));
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})())){
var analyzed_symbol = (function (){var _STAR_cljs_warnings_STAR__orig_val__44986 = cljs.analyzer._STAR_cljs_warnings_STAR_;
var _STAR_cljs_warnings_STAR__temp_val__44987 = cljs.core.zipmap(cljs.core.keys(cljs.analyzer._STAR_cljs_warnings_STAR_),cljs.core.repeat.cljs$core$IFn$_invoke$arity$1(false));
(cljs.analyzer._STAR_cljs_warnings_STAR_ = _STAR_cljs_warnings_STAR__temp_val__44987);

try{var G__44988 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(env,new cljs.core.Keyword(null,"context","context",-830191113),new cljs.core.Keyword(null,"expr","expr",745722291));
var G__44989 = test;
return (cljs.analyzer.analyze.cljs$core$IFn$_invoke$arity$2 ? cljs.analyzer.analyze.cljs$core$IFn$_invoke$arity$2(G__44988,G__44989) : cljs.analyzer.analyze.call(null,G__44988,G__44989));
}finally {(cljs.analyzer._STAR_cljs_warnings_STAR_ = _STAR_cljs_warnings_STAR__orig_val__44986);
}})();
var temp__5804__auto__ = new cljs.core.Keyword(null,"tag","tag",-1290361223).cljs$core$IFn$_invoke$arity$1(analyzed_symbol);
if(cljs.core.truth_(temp__5804__auto__)){
var tag = temp__5804__auto__;
if(((cljs.core.set_QMARK_(tag)) && (cljs.core.contains_QMARK_(tag,new cljs.core.Symbol(null,"clj-nil","clj-nil",1321798654,null))))){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [test,cljs.analyzer.canonicalize_type(cljs.core.disj.cljs$core$IFn$_invoke$arity$2(tag,new cljs.core.Symbol(null,"clj-nil","clj-nil",1321798654,null)))], null);
} else {
return null;
}
} else {
return null;
}
} else {
return null;
}
});
/**
 * Looks at the test and sets any tags which are induced by virtue
 *   of the test being truthy. For example in (if (string? x) x :bar)
 *   the local x in the then branch must be of string type.
 */
cljs.analyzer.set_test_induced_tags = (function cljs$analyzer$set_test_induced_tags(env,test){
var vec__44999 = (function (){var or__5002__auto__ = cljs.analyzer.simple_predicate_induced_tag(env,test);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = cljs.analyzer.type_check_induced_tag(env,test);
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
return cljs.analyzer.truth_induced_tag(env,test);
}
}
})();
var local = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__44999,(0),null);
var tag = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__44999,(1),null);
var G__45003 = env;
if(cljs.core.truth_(local)){
return cljs.core.assoc_in(G__45003,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"locals","locals",535295783),local,new cljs.core.Keyword(null,"tag","tag",-1290361223)], null),tag);
} else {
return G__45003;
}
});
cljs.analyzer.parse.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Symbol(null,"if","if",1181717262,null),(function (op,env,p__45008,name,_){
var vec__45009 = p__45008;
var ___$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__45009,(0),null);
var test = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__45009,(1),null);
var then = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__45009,(2),null);
var else$ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__45009,(3),null);
var form = vec__45009;
if((cljs.core.count(form) < (3))){
throw cljs.analyzer.compile_syntax_error(env,"Too few arguments to if",new cljs.core.Symbol(null,"if","if",1181717262,null));
} else {
}

if((cljs.core.count(form) > (4))){
throw cljs.analyzer.compile_syntax_error(env,"Too many arguments to if",new cljs.core.Symbol(null,"if","if",1181717262,null));
} else {
}

var test_expr = (function (){var _STAR_recur_frames_STAR__orig_val__45014 = cljs.analyzer._STAR_recur_frames_STAR_;
var _STAR_recur_frames_STAR__temp_val__45015 = cljs.core.cons(null,cljs.analyzer._STAR_recur_frames_STAR_);
(cljs.analyzer._STAR_recur_frames_STAR_ = _STAR_recur_frames_STAR__temp_val__45015);

try{var G__45017 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(env,new cljs.core.Keyword(null,"context","context",-830191113),new cljs.core.Keyword(null,"expr","expr",745722291));
var G__45018 = test;
return (cljs.analyzer.analyze.cljs$core$IFn$_invoke$arity$2 ? cljs.analyzer.analyze.cljs$core$IFn$_invoke$arity$2(G__45017,G__45018) : cljs.analyzer.analyze.call(null,G__45017,G__45018));
}finally {(cljs.analyzer._STAR_recur_frames_STAR_ = _STAR_recur_frames_STAR__orig_val__45014);
}})();
var then_expr = (function (){var _STAR_allow_redef_STAR__orig_val__45019 = cljs.analyzer._STAR_allow_redef_STAR_;
var _STAR_allow_redef_STAR__temp_val__45020 = true;
(cljs.analyzer._STAR_allow_redef_STAR_ = _STAR_allow_redef_STAR__temp_val__45020);

try{var G__45023 = cljs.analyzer.set_test_induced_tags(env,test);
var G__45024 = then;
return (cljs.analyzer.analyze.cljs$core$IFn$_invoke$arity$2 ? cljs.analyzer.analyze.cljs$core$IFn$_invoke$arity$2(G__45023,G__45024) : cljs.analyzer.analyze.call(null,G__45023,G__45024));
}finally {(cljs.analyzer._STAR_allow_redef_STAR_ = _STAR_allow_redef_STAR__orig_val__45019);
}})();
var else_expr = (function (){var _STAR_allow_redef_STAR__orig_val__45026 = cljs.analyzer._STAR_allow_redef_STAR_;
var _STAR_allow_redef_STAR__temp_val__45027 = true;
(cljs.analyzer._STAR_allow_redef_STAR_ = _STAR_allow_redef_STAR__temp_val__45027);

try{return (cljs.analyzer.analyze.cljs$core$IFn$_invoke$arity$2 ? cljs.analyzer.analyze.cljs$core$IFn$_invoke$arity$2(env,else$) : cljs.analyzer.analyze.call(null,env,else$));
}finally {(cljs.analyzer._STAR_allow_redef_STAR_ = _STAR_allow_redef_STAR__orig_val__45026);
}})();
return new cljs.core.PersistentArrayMap(null, 8, [new cljs.core.Keyword(null,"env","env",-1815813235),env,new cljs.core.Keyword(null,"op","op",-1882987955),new cljs.core.Keyword(null,"if","if",-458814265),new cljs.core.Keyword(null,"form","form",-1624062471),form,new cljs.core.Keyword(null,"test","test",577538877),test_expr,new cljs.core.Keyword(null,"then","then",460598070),then_expr,new cljs.core.Keyword(null,"else","else",-1508377146),else_expr,new cljs.core.Keyword(null,"unchecked","unchecked",924418378),cljs.core._STAR_unchecked_if_STAR_,new cljs.core.Keyword(null,"children","children",-940561982),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"test","test",577538877),new cljs.core.Keyword(null,"then","then",460598070),new cljs.core.Keyword(null,"else","else",-1508377146)], null)], null);
}));
cljs.analyzer.parse.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Symbol(null,"case*","case*",-1938255072,null),(function (op,env,p__45032,name,_){
var vec__45035 = p__45032;
var ___$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__45035,(0),null);
var sym = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__45035,(1),null);
var tests = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__45035,(2),null);
var thens = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__45035,(3),null);
var default$ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__45035,(4),null);
var form = vec__45035;
if((sym instanceof cljs.core.Symbol)){
} else {
throw (new Error(["Assert failed: ","case* must switch on symbol","\n","(symbol? sym)"].join('')));
}

if(cljs.core.every_QMARK_(cljs.core.vector_QMARK_,tests)){
} else {
throw (new Error(["Assert failed: ","case* tests must be grouped in vectors","\n","(every? vector? tests)"].join('')));
}

var expr_env = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(env,new cljs.core.Keyword(null,"context","context",-830191113),new cljs.core.Keyword(null,"expr","expr",745722291));
var v = (function (){var _STAR_recur_frames_STAR__orig_val__45042 = cljs.analyzer._STAR_recur_frames_STAR_;
var _STAR_recur_frames_STAR__temp_val__45043 = cljs.core.cons(null,cljs.analyzer._STAR_recur_frames_STAR_);
(cljs.analyzer._STAR_recur_frames_STAR_ = _STAR_recur_frames_STAR__temp_val__45043);

try{return (cljs.analyzer.analyze.cljs$core$IFn$_invoke$arity$2 ? cljs.analyzer.analyze.cljs$core$IFn$_invoke$arity$2(expr_env,sym) : cljs.analyzer.analyze.call(null,expr_env,sym));
}finally {(cljs.analyzer._STAR_recur_frames_STAR_ = _STAR_recur_frames_STAR__orig_val__45042);
}})();
var tests__$1 = cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (p1__45029_SHARP_){
return cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (t){
return (cljs.analyzer.analyze.cljs$core$IFn$_invoke$arity$2 ? cljs.analyzer.analyze.cljs$core$IFn$_invoke$arity$2(expr_env,t) : cljs.analyzer.analyze.call(null,expr_env,t));
}),p1__45029_SHARP_);
}),tests);
var thens__$1 = cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (p1__45030_SHARP_){
return (cljs.analyzer.analyze.cljs$core$IFn$_invoke$arity$2 ? cljs.analyzer.analyze.cljs$core$IFn$_invoke$arity$2(env,p1__45030_SHARP_) : cljs.analyzer.analyze.call(null,env,p1__45030_SHARP_));
}),thens);
var nodes = cljs.core.mapv.cljs$core$IFn$_invoke$arity$3((function (tests__$2,then){
return new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"op","op",-1882987955),new cljs.core.Keyword(null,"case-node","case-node",1016946320),new cljs.core.Keyword(null,"env","env",-1815813235),env,new cljs.core.Keyword(null,"tests","tests",-1041085625),cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (test){
return new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"op","op",-1882987955),new cljs.core.Keyword(null,"case-test","case-test",-213512472),new cljs.core.Keyword(null,"form","form",-1624062471),new cljs.core.Keyword(null,"form","form",-1624062471).cljs$core$IFn$_invoke$arity$1(test),new cljs.core.Keyword(null,"env","env",-1815813235),expr_env,new cljs.core.Keyword(null,"test","test",577538877),test,new cljs.core.Keyword(null,"children","children",-940561982),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"test","test",577538877)], null)], null);
}),tests__$2),new cljs.core.Keyword(null,"then","then",460598070),new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"op","op",-1882987955),new cljs.core.Keyword(null,"case-then","case-then",2107591745),new cljs.core.Keyword(null,"form","form",-1624062471),new cljs.core.Keyword(null,"form","form",-1624062471).cljs$core$IFn$_invoke$arity$1(then),new cljs.core.Keyword(null,"env","env",-1815813235),env,new cljs.core.Keyword(null,"then","then",460598070),then,new cljs.core.Keyword(null,"children","children",-940561982),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"then","then",460598070)], null)], null),new cljs.core.Keyword(null,"children","children",-940561982),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"tests","tests",-1041085625),new cljs.core.Keyword(null,"then","then",460598070)], null)], null);
}),tests__$1,thens__$1);
var default$__$1 = (cljs.analyzer.analyze.cljs$core$IFn$_invoke$arity$2 ? cljs.analyzer.analyze.cljs$core$IFn$_invoke$arity$2(env,default$) : cljs.analyzer.analyze.call(null,env,default$));
if(cljs.core.every_QMARK_((function (t){
var or__5002__auto__ = new cljs.core.Keyword(null,"const","const",1709929842).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"info","info",-317069002).cljs$core$IFn$_invoke$arity$1(t));
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var and__5000__auto__ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"const","const",1709929842),new cljs.core.Keyword(null,"op","op",-1882987955).cljs$core$IFn$_invoke$arity$1(t));
if(and__5000__auto__){
return cljs.core.some_fn.cljs$core$IFn$_invoke$arity$3(cljs.core.number_QMARK_,cljs.core.string_QMARK_,cljs.core.char_QMARK_)(new cljs.core.Keyword(null,"form","form",-1624062471).cljs$core$IFn$_invoke$arity$1(t));
} else {
return and__5000__auto__;
}
}
}),cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core.concat,tests__$1))){
} else {
throw (new Error(["Assert failed: ","case* tests must be numbers, strings, or constants","\n","(every? (fn [t] (or (-> t :info :const) (and (= :const (:op t)) ((some-fn number? string? char?) (:form t))))) (apply concat tests))"].join('')));
}

return new cljs.core.PersistentArrayMap(null, 7, [new cljs.core.Keyword(null,"env","env",-1815813235),env,new cljs.core.Keyword(null,"op","op",-1882987955),new cljs.core.Keyword(null,"case","case",1143702196),new cljs.core.Keyword(null,"form","form",-1624062471),form,new cljs.core.Keyword(null,"test","test",577538877),v,new cljs.core.Keyword(null,"nodes","nodes",-2099585805),nodes,new cljs.core.Keyword(null,"default","default",-1987822328),default$__$1,new cljs.core.Keyword(null,"children","children",-940561982),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"test","test",577538877),new cljs.core.Keyword(null,"nodes","nodes",-2099585805),new cljs.core.Keyword(null,"default","default",-1987822328)], null)], null);
}));
cljs.analyzer.parse.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Symbol(null,"throw","throw",595905694,null),(function (op,env,p__45058,name,_){
var vec__45059 = p__45058;
var ___$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__45059,(0),null);
var throw_form = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__45059,(1),null);
var form = vec__45059;
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2((1),cljs.core.count(form))){
throw cljs.analyzer.error.cljs$core$IFn$_invoke$arity$2(env,"Too few arguments to throw, throw expects a single Error instance");
} else {
if(((2) < cljs.core.count(form))){
throw cljs.analyzer.error.cljs$core$IFn$_invoke$arity$2(env,"Too many arguments to throw, throw expects a single Error instance");
} else {
}
}

var throw_expr = (function (){var _STAR_recur_frames_STAR__orig_val__45064 = cljs.analyzer._STAR_recur_frames_STAR_;
var _STAR_recur_frames_STAR__temp_val__45065 = cljs.core.cons(null,cljs.analyzer._STAR_recur_frames_STAR_);
(cljs.analyzer._STAR_recur_frames_STAR_ = _STAR_recur_frames_STAR__temp_val__45065);

try{var G__45071 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(env,new cljs.core.Keyword(null,"context","context",-830191113),new cljs.core.Keyword(null,"expr","expr",745722291));
var G__45072 = throw_form;
return (cljs.analyzer.analyze.cljs$core$IFn$_invoke$arity$2 ? cljs.analyzer.analyze.cljs$core$IFn$_invoke$arity$2(G__45071,G__45072) : cljs.analyzer.analyze.call(null,G__45071,G__45072));
}finally {(cljs.analyzer._STAR_recur_frames_STAR_ = _STAR_recur_frames_STAR__orig_val__45064);
}})();
return new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"env","env",-1815813235),env,new cljs.core.Keyword(null,"op","op",-1882987955),new cljs.core.Keyword(null,"throw","throw",-1044625833),new cljs.core.Keyword(null,"form","form",-1624062471),form,new cljs.core.Keyword(null,"exception","exception",-335277064),throw_expr,new cljs.core.Keyword(null,"children","children",-940561982),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"exception","exception",-335277064)], null)], null);
}));
cljs.analyzer.parse.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Symbol(null,"try","try",-1273693247,null),(function (op,env,p__45086,name,_){
var vec__45087 = p__45086;
var seq__45088 = cljs.core.seq(vec__45087);
var first__45089 = cljs.core.first(seq__45088);
var seq__45088__$1 = cljs.core.next(seq__45088);
var ___$1 = first__45089;
var body = seq__45088__$1;
var form = vec__45087;
var catchenv = cljs.core.update_in.cljs$core$IFn$_invoke$arity$3(env,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"context","context",-830191113)], null),(function (p1__45074_SHARP_){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"expr","expr",745722291),p1__45074_SHARP_)){
return new cljs.core.Keyword(null,"return","return",-1891502105);
} else {
return p1__45074_SHARP_;
}
}));
var catch_QMARK_ = cljs.core.every_pred.cljs$core$IFn$_invoke$arity$2(cljs.core.seq_QMARK_,(function (p1__45076_SHARP_){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.first(p1__45076_SHARP_),new cljs.core.Symbol(null,"catch","catch",-1616370245,null));
}));
var default_QMARK_ = cljs.core.every_pred.cljs$core$IFn$_invoke$arity$2(catch_QMARK_,(function (p1__45077_SHARP_){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.second(p1__45077_SHARP_),new cljs.core.Keyword(null,"default","default",-1987822328));
}));
var finally_QMARK_ = cljs.core.every_pred.cljs$core$IFn$_invoke$arity$2(cljs.core.seq_QMARK_,(function (p1__45078_SHARP_){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.first(p1__45078_SHARP_),new cljs.core.Symbol(null,"finally","finally",-1065347064,null));
}));
var map__45090 = (function (){var parser = new cljs.core.PersistentArrayMap(null, 6, [new cljs.core.Keyword(null,"state","state",-1988618099),new cljs.core.Keyword(null,"start","start",-355208981),new cljs.core.Keyword(null,"forms","forms",2045992350),body,new cljs.core.Keyword(null,"body","body",-2049205669),cljs.core.PersistentVector.EMPTY,new cljs.core.Keyword(null,"cblocks","cblocks",-1769978138),cljs.core.PersistentVector.EMPTY,new cljs.core.Keyword(null,"dblock","dblock",-1325623381),null,new cljs.core.Keyword(null,"fblock","fblock",-1236607426),null], null);
while(true){
if(cljs.core.seq_QMARK_(new cljs.core.Keyword(null,"forms","forms",2045992350).cljs$core$IFn$_invoke$arity$1(parser))){
var vec__45101 = new cljs.core.Keyword(null,"forms","forms",2045992350).cljs$core$IFn$_invoke$arity$1(parser);
var seq__45102 = cljs.core.seq(vec__45101);
var first__45103 = cljs.core.first(seq__45102);
var seq__45102__$1 = cljs.core.next(seq__45102);
var form__$1 = first__45103;
var forms_STAR_ = seq__45102__$1;
var parser_STAR_ = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(parser,new cljs.core.Keyword(null,"forms","forms",2045992350),forms_STAR_);
var G__45107 = new cljs.core.Keyword(null,"state","state",-1988618099).cljs$core$IFn$_invoke$arity$1(parser);
var G__45107__$1 = (((G__45107 instanceof cljs.core.Keyword))?G__45107.fqn:null);
switch (G__45107__$1) {
case "start":
if(cljs.core.truth_(catch_QMARK_(form__$1))){
var G__48590 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(parser,new cljs.core.Keyword(null,"state","state",-1988618099),new cljs.core.Keyword(null,"catches","catches",-1478797617));
parser = G__48590;
continue;
} else {
if(cljs.core.truth_(finally_QMARK_(form__$1))){
var G__48593 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(parser,new cljs.core.Keyword(null,"state","state",-1988618099),new cljs.core.Keyword(null,"finally","finally",1589088705));
parser = G__48593;
continue;
} else {
var G__48594 = cljs.core.update_in.cljs$core$IFn$_invoke$arity$4(parser_STAR_,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"body","body",-2049205669)], null),cljs.core.conj,form__$1);
parser = G__48594;
continue;

}
}

break;
case "catches":
if(cljs.core.truth_(default_QMARK_(form__$1))){
var G__48595 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(parser_STAR_,new cljs.core.Keyword(null,"dblock","dblock",-1325623381),form__$1,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"state","state",-1988618099),new cljs.core.Keyword(null,"finally","finally",1589088705)], 0));
parser = G__48595;
continue;
} else {
if(cljs.core.truth_(catch_QMARK_(form__$1))){
var G__48597 = cljs.core.update_in.cljs$core$IFn$_invoke$arity$4(parser_STAR_,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"cblocks","cblocks",-1769978138)], null),cljs.core.conj,form__$1);
parser = G__48597;
continue;
} else {
if(cljs.core.truth_(finally_QMARK_(form__$1))){
var G__48601 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(parser,new cljs.core.Keyword(null,"state","state",-1988618099),new cljs.core.Keyword(null,"finally","finally",1589088705));
parser = G__48601;
continue;
} else {
throw cljs.analyzer.error.cljs$core$IFn$_invoke$arity$2(env,"Invalid try form");

}
}
}

break;
case "finally":
var G__48604 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(parser_STAR_,new cljs.core.Keyword(null,"fblock","fblock",-1236607426),form__$1,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"state","state",-1988618099),new cljs.core.Keyword(null,"done","done",-889844188)], 0));
parser = G__48604;
continue;

break;
case "done":
throw cljs.analyzer.error.cljs$core$IFn$_invoke$arity$2(env,"Unexpected form after finally");

break;
default:
throw (new Error(["No matching clause: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(G__45107__$1)].join('')));

}
} else {
return parser;
}
break;
}
})();
var map__45090__$1 = cljs.core.__destructure_map(map__45090);
var body__$1 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__45090__$1,new cljs.core.Keyword(null,"body","body",-2049205669));
var cblocks = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__45090__$1,new cljs.core.Keyword(null,"cblocks","cblocks",-1769978138));
var dblock = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__45090__$1,new cljs.core.Keyword(null,"dblock","dblock",-1325623381));
var fblock = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__45090__$1,new cljs.core.Keyword(null,"fblock","fblock",-1236607426));
var finally$ = ((cljs.core.seq(fblock))?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3((function (){var _STAR_recur_frames_STAR__orig_val__45110 = cljs.analyzer._STAR_recur_frames_STAR_;
var _STAR_recur_frames_STAR__temp_val__45111 = cljs.core.cons(null,cljs.analyzer._STAR_recur_frames_STAR_);
(cljs.analyzer._STAR_recur_frames_STAR_ = _STAR_recur_frames_STAR__temp_val__45111);

try{var G__45112 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(env,new cljs.core.Keyword(null,"context","context",-830191113),new cljs.core.Keyword(null,"statement","statement",-32780863));
var G__45113 = cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$2((new cljs.core.List(null,new cljs.core.Symbol(null,"do","do",1686842252,null),null,(1),null)),cljs.core.rest(fblock))));
return (cljs.analyzer.analyze.cljs$core$IFn$_invoke$arity$2 ? cljs.analyzer.analyze.cljs$core$IFn$_invoke$arity$2(G__45112,G__45113) : cljs.analyzer.analyze.call(null,G__45112,G__45113));
}finally {(cljs.analyzer._STAR_recur_frames_STAR_ = _STAR_recur_frames_STAR__orig_val__45110);
}})(),new cljs.core.Keyword(null,"body?","body?",-1333761917),true):null);
var e = (cljs.core.truth_((function (){var or__5002__auto__ = cljs.core.seq(cblocks);
if(or__5002__auto__){
return or__5002__auto__;
} else {
return dblock;
}
})())?cljs.core.gensym.cljs$core$IFn$_invoke$arity$1("e"):null);
var default$ = (function (){var temp__5802__auto__ = dblock;
if(cljs.core.truth_(temp__5802__auto__)){
var vec__45122 = temp__5802__auto__;
var seq__45123 = cljs.core.seq(vec__45122);
var first__45124 = cljs.core.first(seq__45123);
var seq__45123__$1 = cljs.core.next(seq__45123);
var ___$2 = first__45124;
var first__45124__$1 = cljs.core.first(seq__45123__$1);
var seq__45123__$2 = cljs.core.next(seq__45123__$1);
var ___$3 = first__45124__$1;
var first__45124__$2 = cljs.core.first(seq__45123__$2);
var seq__45123__$3 = cljs.core.next(seq__45123__$2);
var name__$1 = first__45124__$2;
var cb = seq__45123__$3;
return cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic((new cljs.core.List(null,new cljs.core.Symbol("cljs.core","let","cljs.core/let",-308701135,null),null,(1),null)),(new cljs.core.List(null,cljs.core.vec(cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$2((new cljs.core.List(null,name__$1,null,(1),null)),(new cljs.core.List(null,e,null,(1),null)))))),null,(1),null)),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cb], 0))));
} else {
return cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$2((new cljs.core.List(null,new cljs.core.Symbol(null,"throw","throw",595905694,null),null,(1),null)),(new cljs.core.List(null,e,null,(1),null)))));
}
})();
var cblock = ((cljs.core.seq(cblocks))?cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic((new cljs.core.List(null,new cljs.core.Symbol("cljs.core","cond","cljs.core/cond",2005388338,null),null,(1),null)),cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (p__45127){
var vec__45128 = p__45127;
var seq__45129 = cljs.core.seq(vec__45128);
var first__45130 = cljs.core.first(seq__45129);
var seq__45129__$1 = cljs.core.next(seq__45129);
var ___$2 = first__45130;
var first__45130__$1 = cljs.core.first(seq__45129__$1);
var seq__45129__$2 = cljs.core.next(seq__45129__$1);
var type = first__45130__$1;
var first__45130__$2 = cljs.core.first(seq__45129__$2);
var seq__45129__$3 = cljs.core.next(seq__45129__$2);
var name__$1 = first__45130__$2;
var cb = seq__45129__$3;
if(cljs.core.truth_(name__$1)){
if(cljs.core.not(cljs.core.namespace(name__$1))){
} else {
throw (new Error(["Assert failed: ","Can't qualify symbol in catch","\n","(not (namespace name))"].join('')));
}
} else {
}

return cljs.core.vec(cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$2((new cljs.core.List(null,cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic((new cljs.core.List(null,new cljs.core.Symbol("cljs.core","instance?","cljs.core/instance?",2044751870,null),null,(1),null)),(new cljs.core.List(null,type,null,(1),null)),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([(new cljs.core.List(null,e,null,(1),null))], 0)))),null,(1),null)),(new cljs.core.List(null,cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic((new cljs.core.List(null,new cljs.core.Symbol("cljs.core","let","cljs.core/let",-308701135,null),null,(1),null)),(new cljs.core.List(null,cljs.core.vec(cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$2((new cljs.core.List(null,name__$1,null,(1),null)),(new cljs.core.List(null,e,null,(1),null)))))),null,(1),null)),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cb], 0)))),null,(1),null))))));
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cblocks], 0)),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([(new cljs.core.List(null,new cljs.core.Keyword(null,"else","else",-1508377146),null,(1),null)),(new cljs.core.List(null,default$,null,(1),null))], 0)))):default$);
var locals = new cljs.core.Keyword(null,"locals","locals",535295783).cljs$core$IFn$_invoke$arity$1(catchenv);
var locals__$1 = (cljs.core.truth_(e)?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(locals,e,new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"name","name",1843675177),e,new cljs.core.Keyword(null,"line","line",212345235),cljs.analyzer.get_line(e,env),new cljs.core.Keyword(null,"column","column",2078222095),cljs.analyzer.get_col(e,env)], null)):locals);
var catch$ = (cljs.core.truth_(cblock)?(function (){var _STAR_recur_frames_STAR__orig_val__45136 = cljs.analyzer._STAR_recur_frames_STAR_;
var _STAR_recur_frames_STAR__temp_val__45137 = cljs.core.cons(null,cljs.analyzer._STAR_recur_frames_STAR_);
(cljs.analyzer._STAR_recur_frames_STAR_ = _STAR_recur_frames_STAR__temp_val__45137);

try{var G__45143 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(catchenv,new cljs.core.Keyword(null,"locals","locals",535295783),locals__$1);
var G__45144 = cblock;
return (cljs.analyzer.analyze.cljs$core$IFn$_invoke$arity$2 ? cljs.analyzer.analyze.cljs$core$IFn$_invoke$arity$2(G__45143,G__45144) : cljs.analyzer.analyze.call(null,G__45143,G__45144));
}finally {(cljs.analyzer._STAR_recur_frames_STAR_ = _STAR_recur_frames_STAR__orig_val__45136);
}})():null);
var try$ = (function (){var _STAR_recur_frames_STAR__orig_val__45152 = cljs.analyzer._STAR_recur_frames_STAR_;
var _STAR_recur_frames_STAR__temp_val__45153 = cljs.core.cons(null,cljs.analyzer._STAR_recur_frames_STAR_);
(cljs.analyzer._STAR_recur_frames_STAR_ = _STAR_recur_frames_STAR__temp_val__45153);

try{var G__45154 = (cljs.core.truth_((function (){var or__5002__auto__ = e;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return finally$;
}
})())?catchenv:env);
var G__45155 = cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$2((new cljs.core.List(null,new cljs.core.Symbol(null,"do","do",1686842252,null),null,(1),null)),body__$1)));
return (cljs.analyzer.analyze.cljs$core$IFn$_invoke$arity$2 ? cljs.analyzer.analyze.cljs$core$IFn$_invoke$arity$2(G__45154,G__45155) : cljs.analyzer.analyze.call(null,G__45154,G__45155));
}finally {(cljs.analyzer._STAR_recur_frames_STAR_ = _STAR_recur_frames_STAR__orig_val__45152);
}})();
return new cljs.core.PersistentArrayMap(null, 8, [new cljs.core.Keyword(null,"env","env",-1815813235),env,new cljs.core.Keyword(null,"op","op",-1882987955),new cljs.core.Keyword(null,"try","try",1380742522),new cljs.core.Keyword(null,"form","form",-1624062471),form,new cljs.core.Keyword(null,"body","body",-2049205669),cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(try$,new cljs.core.Keyword(null,"body?","body?",-1333761917),true),new cljs.core.Keyword(null,"finally","finally",1589088705),finally$,new cljs.core.Keyword(null,"name","name",1843675177),e,new cljs.core.Keyword(null,"catch","catch",1038065524),catch$,new cljs.core.Keyword(null,"children","children",-940561982),cljs.core.vec(cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"body","body",-2049205669)], null),(cljs.core.truth_(catch$)?new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"catch","catch",1038065524)], null):null),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([(cljs.core.truth_(finally$)?new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"finally","finally",1589088705)], null):null)], 0)))], null);
}));
cljs.analyzer.valid_proto = (function cljs$analyzer$valid_proto(x){
if((x instanceof cljs.core.Symbol)){
return x;
} else {
return null;
}
});
cljs.analyzer.elide_env = (function cljs$analyzer$elide_env(env,ast,opts){
return cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(ast,new cljs.core.Keyword(null,"env","env",-1815813235));
});
cljs.analyzer.replace_env_pass = (function cljs$analyzer$replace_env_pass(new_env){
return (function (env,ast,opts){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(ast,new cljs.core.Keyword(null,"env","env",-1815813235),new_env);
});
});
cljs.analyzer.ast_children = (function cljs$analyzer$ast_children(ast){
return cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (c){
var g = cljs.core.get.cljs$core$IFn$_invoke$arity$2(ast,c);
if(cljs.core.vector_QMARK_(g)){
return g;
} else {
if(cljs.core.truth_(g)){
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [g], null);
} else {
return null;
}
}
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"children","children",-940561982).cljs$core$IFn$_invoke$arity$1(ast)], 0));
});
cljs.analyzer.constant_value_QMARK_ = (function cljs$analyzer$constant_value_QMARK_(p__45174){
var map__45177 = p__45174;
var map__45177__$1 = cljs.core.__destructure_map(map__45177);
var ast = map__45177__$1;
var op = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__45177__$1,new cljs.core.Keyword(null,"op","op",-1882987955));
var or__5002__auto__ = (function (){var fexpr__45180 = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"const","const",1709929842),null,new cljs.core.Keyword(null,"quote","quote",-262615245),null], null), null);
return (fexpr__45180.cljs$core$IFn$_invoke$arity$1 ? fexpr__45180.cljs$core$IFn$_invoke$arity$1(op) : fexpr__45180.call(null,op));
})();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var and__5000__auto__ = (function (){var fexpr__45181 = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"vector","vector",1902966158),null,new cljs.core.Keyword(null,"set","set",304602554),null,new cljs.core.Keyword(null,"map","map",1371690461),null], null), null);
return (fexpr__45181.cljs$core$IFn$_invoke$arity$1 ? fexpr__45181.cljs$core$IFn$_invoke$arity$1(op) : fexpr__45181.call(null,op));
})();
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.every_QMARK_(cljs.analyzer.constant_value_QMARK_,cljs.analyzer.ast_children(ast));
} else {
return and__5000__auto__;
}
}
});
cljs.analyzer.const_expr__GT_constant_value = (function cljs$analyzer$const_expr__GT_constant_value(p__45190){
var map__45191 = p__45190;
var map__45191__$1 = cljs.core.__destructure_map(map__45191);
var e = map__45191__$1;
var op = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__45191__$1,new cljs.core.Keyword(null,"op","op",-1882987955));
var G__45192 = op;
var G__45192__$1 = (((G__45192 instanceof cljs.core.Keyword))?G__45192.fqn:null);
switch (G__45192__$1) {
case "quote":
var G__45195 = new cljs.core.Keyword(null,"expr","expr",745722291).cljs$core$IFn$_invoke$arity$1(e);
return (cljs.analyzer.const_expr__GT_constant_value.cljs$core$IFn$_invoke$arity$1 ? cljs.analyzer.const_expr__GT_constant_value.cljs$core$IFn$_invoke$arity$1(G__45195) : cljs.analyzer.const_expr__GT_constant_value.call(null,G__45195));

break;
case "const":
return new cljs.core.Keyword(null,"val","val",128701612).cljs$core$IFn$_invoke$arity$1(e);

break;
case "map":
return cljs.core.zipmap(cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.analyzer.const_expr__GT_constant_value,new cljs.core.Keyword(null,"keys","keys",1068423698).cljs$core$IFn$_invoke$arity$1(e)),cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.analyzer.const_expr__GT_constant_value,new cljs.core.Keyword(null,"vals","vals",768058733).cljs$core$IFn$_invoke$arity$1(e)));

break;
case "set":
return cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentHashSet.EMPTY,cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.analyzer.const_expr__GT_constant_value,new cljs.core.Keyword(null,"items","items",1031954938).cljs$core$IFn$_invoke$arity$1(e)));

break;
case "vector":
return cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentVector.EMPTY,cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.analyzer.const_expr__GT_constant_value,new cljs.core.Keyword(null,"items","items",1031954938).cljs$core$IFn$_invoke$arity$1(e)));

break;
default:
throw (new Error(["No matching clause: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(G__45192__$1)].join('')));

}
});
cljs.analyzer.earmuffed_QMARK_ = (function cljs$analyzer$earmuffed_QMARK_(sym){
var s = cljs.core.name(sym);
return (((((s).length) > (2))) && (((clojure.string.starts_with_QMARK_(s,"*")) && (clojure.string.ends_with_QMARK_(s,"*")))));
});
cljs.analyzer.core_ns_QMARK_ = (function cljs$analyzer$core_ns_QMARK_(ns_sym){
var s = cljs.core.name(ns_sym);
return ((cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Symbol(null,"cljs.user","cljs.user",877795071,null),ns_sym)) && (((clojure.string.starts_with_QMARK_(s,"cljs.")) || (clojure.string.starts_with_QMARK_(s,"clojure.")))));
});
cljs.analyzer.parse.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Symbol(null,"def","def",597100991,null),(function (op,env,form,_,___$1){
if((cljs.core.count(form) > (4))){
throw cljs.analyzer.error.cljs$core$IFn$_invoke$arity$2(env,"Too many arguments to def");
} else {
}

var pfn = (function() {
var G__48629 = null;
var G__48629__2 = (function (___$2,sym){
return new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"sym","sym",-1444860305),sym], null);
});
var G__48629__3 = (function (___$2,sym,init){
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"sym","sym",-1444860305),sym,new cljs.core.Keyword(null,"init","init",-1875481434),init], null);
});
var G__48629__4 = (function (___$2,sym,doc,init){
return new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"sym","sym",-1444860305),sym,new cljs.core.Keyword(null,"doc","doc",1913296891),doc,new cljs.core.Keyword(null,"init","init",-1875481434),init], null);
});
G__48629 = function(___$2,sym,doc,init){
switch(arguments.length){
case 2:
return G__48629__2.call(this,___$2,sym);
case 3:
return G__48629__3.call(this,___$2,sym,doc);
case 4:
return G__48629__4.call(this,___$2,sym,doc,init);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
G__48629.cljs$core$IFn$_invoke$arity$2 = G__48629__2;
G__48629.cljs$core$IFn$_invoke$arity$3 = G__48629__3;
G__48629.cljs$core$IFn$_invoke$arity$4 = G__48629__4;
return G__48629;
})()
;
var args = cljs.core.apply.cljs$core$IFn$_invoke$arity$2(pfn,form);
var sym = new cljs.core.Keyword(null,"sym","sym",-1444860305).cljs$core$IFn$_invoke$arity$1(args);
var const_QMARK_ = new cljs.core.Keyword(null,"const","const",1709929842).cljs$core$IFn$_invoke$arity$1(cljs.core.meta(sym));
var sym_meta = cljs.core.meta(sym);
var tag = new cljs.core.Keyword(null,"tag","tag",-1290361223).cljs$core$IFn$_invoke$arity$1(cljs.core.meta(sym));
var protocol = cljs.analyzer.valid_proto(new cljs.core.Keyword(null,"protocol","protocol",652470118).cljs$core$IFn$_invoke$arity$1(cljs.core.meta(sym)));
var dynamic = new cljs.core.Keyword(null,"dynamic","dynamic",704819571).cljs$core$IFn$_invoke$arity$1(cljs.core.meta(sym));
var ns_name = new cljs.core.Keyword(null,"name","name",1843675177).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"ns","ns",441598760).cljs$core$IFn$_invoke$arity$1(env));
var locals = new cljs.core.Keyword(null,"locals","locals",535295783).cljs$core$IFn$_invoke$arity$1(env);
var clash_ns = cljs.core.symbol.cljs$core$IFn$_invoke$arity$1([cljs.core.str.cljs$core$IFn$_invoke$arity$1(ns_name),".",cljs.core.str.cljs$core$IFn$_invoke$arity$1(sym)].join(''));
var sym_ns = cljs.core.namespace(sym);
var sym__$1 = (cljs.core.truth_((function (){var and__5000__auto__ = sym_ns;
if(cljs.core.truth_(and__5000__auto__)){
return (!(cljs.core.symbol_identical_QMARK_(cljs.core.symbol.cljs$core$IFn$_invoke$arity$1(sym_ns),ns_name)));
} else {
return and__5000__auto__;
}
})())?(function(){throw cljs.analyzer.error.cljs$core$IFn$_invoke$arity$2(env,["Can't def ns-qualified name in namespace ",sym_ns].join(''))})():(((!((sym_ns == null))))?cljs.core.symbol.cljs$core$IFn$_invoke$arity$1(cljs.core.name(sym)):sym
));
if((!((cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(cljs.env._STAR_compiler_STAR_),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("cljs.analyzer","namespaces","cljs.analyzer/namespaces",-260788927),clash_ns], null)) == null)))){
cljs.analyzer.warning(new cljs.core.Keyword(null,"ns-var-clash","ns-var-clash",-280494668),env,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"ns","ns",441598760),cljs.core.symbol.cljs$core$IFn$_invoke$arity$1([cljs.core.str.cljs$core$IFn$_invoke$arity$1(ns_name),".",cljs.core.str.cljs$core$IFn$_invoke$arity$1(sym__$1)].join('')),new cljs.core.Keyword(null,"var","var",-769682797),cljs.core.symbol.cljs$core$IFn$_invoke$arity$2(cljs.core.str.cljs$core$IFn$_invoke$arity$1(ns_name),cljs.core.str.cljs$core$IFn$_invoke$arity$1(sym__$1))], null));
} else {
}

if((!((new cljs.core.Keyword(null,"const","const",1709929842).cljs$core$IFn$_invoke$arity$1(cljs.analyzer.resolve_var.cljs$core$IFn$_invoke$arity$2(cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(env,new cljs.core.Keyword(null,"locals","locals",535295783)),sym__$1)) == null)))){
throw cljs.analyzer.error.cljs$core$IFn$_invoke$arity$2(env,"Can't redefine a constant");
} else {
}

var temp__5808__auto___48656 = new cljs.core.Keyword(null,"doc","doc",1913296891).cljs$core$IFn$_invoke$arity$1(args);
if((temp__5808__auto___48656 == null)){
} else {
var doc_48657 = temp__5808__auto___48656;
if(typeof doc_48657 === 'string'){
} else {
throw cljs.analyzer.error.cljs$core$IFn$_invoke$arity$2(env,"Too many arguments to def");
}
}

if(((cljs.core.not(dynamic)) && (((cljs.analyzer.earmuffed_QMARK_(sym__$1)) && ((!(cljs.analyzer.core_ns_QMARK_(ns_name)))))))){
cljs.analyzer.warning(new cljs.core.Keyword(null,"non-dynamic-earmuffed-var","non-dynamic-earmuffed-var",-202005643),env,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"var","var",-769682797),cljs.core.str.cljs$core$IFn$_invoke$arity$1(sym__$1)], null));
} else {
}

var temp__5808__auto___48658 = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(cljs.env._STAR_compiler_STAR_),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("cljs.analyzer","namespaces","cljs.analyzer/namespaces",-260788927),ns_name,new cljs.core.Keyword(null,"defs","defs",1398449717),sym__$1], null));
if((temp__5808__auto___48658 == null)){
} else {
var v_48659 = temp__5808__auto___48658;
if(cljs.core.truth_((function (){var and__5000__auto__ = cljs.core.not(cljs.analyzer._STAR_allow_redef_STAR_);
if(and__5000__auto__){
var and__5000__auto____$1 = cljs.core.not(new cljs.core.Keyword(null,"declared","declared",92336021).cljs$core$IFn$_invoke$arity$1(v_48659));
if(and__5000__auto____$1){
var and__5000__auto____$2 = cljs.core.not(new cljs.core.Keyword(null,"declared","declared",92336021).cljs$core$IFn$_invoke$arity$1(sym_meta));
if(and__5000__auto____$2){
var and__5000__auto____$3 = cljs.analyzer._STAR_file_defs_STAR_;
if(cljs.core.truth_(and__5000__auto____$3)){
return cljs.core.get.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(cljs.analyzer._STAR_file_defs_STAR_),sym__$1);
} else {
return and__5000__auto____$3;
}
} else {
return and__5000__auto____$2;
}
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})())){
cljs.analyzer.warning(new cljs.core.Keyword(null,"redef-in-file","redef-in-file",-476530788),env,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"sym","sym",-1444860305),sym__$1,new cljs.core.Keyword(null,"line","line",212345235),new cljs.core.Keyword(null,"line","line",212345235).cljs$core$IFn$_invoke$arity$1(v_48659)], null));
} else {
}

if(cljs.core.truth_((function (){var and__5000__auto__ = new cljs.core.Keyword(null,"declared","declared",92336021).cljs$core$IFn$_invoke$arity$1(v_48659);
if(cljs.core.truth_(and__5000__auto__)){
var and__5000__auto____$1 = new cljs.core.Keyword(null,"arglists","arglists",1661989754).cljs$core$IFn$_invoke$arity$1(v_48659);
if(cljs.core.truth_(and__5000__auto____$1)){
return cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"arglists","arglists",1661989754).cljs$core$IFn$_invoke$arity$1(v_48659),new cljs.core.Keyword(null,"arglists","arglists",1661989754).cljs$core$IFn$_invoke$arity$1(sym_meta));
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})())){
cljs.analyzer.warning(new cljs.core.Keyword(null,"declared-arglists-mismatch","declared-arglists-mismatch",-496878383),env,new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"ns-name","ns-name",-2077346323),ns_name,new cljs.core.Keyword(null,"sym","sym",-1444860305),sym__$1,new cljs.core.Keyword(null,"declared","declared",92336021),cljs.core.second(new cljs.core.Keyword(null,"arglists","arglists",1661989754).cljs$core$IFn$_invoke$arity$1(v_48659)),new cljs.core.Keyword(null,"defined","defined",-1805032318),cljs.core.second(new cljs.core.Keyword(null,"arglists","arglists",1661989754).cljs$core$IFn$_invoke$arity$1(sym_meta))], null));
} else {
}
}

var env__$1 = ((((((cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(ns_name,new cljs.core.Symbol(null,"cljs.core","cljs.core",770546058,null))) && (cljs.analyzer.core_name_QMARK_(env,sym__$1)))) || ((!((cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(cljs.env._STAR_compiler_STAR_),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("cljs.analyzer","namespaces","cljs.analyzer/namespaces",-260788927),ns_name,new cljs.core.Keyword(null,"uses","uses",232664692),sym__$1], null)) == null))))))?(function (){var ev = cljs.analyzer.resolve_existing_var(cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(env,new cljs.core.Keyword(null,"locals","locals",535295783)),cljs.core.with_meta(sym__$1,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("cljs.analyzer","no-resolve","cljs.analyzer/no-resolve",-1872351017),true], null)));
var conj_to_set = cljs.core.fnil.cljs$core$IFn$_invoke$arity$2(cljs.core.conj,cljs.core.PersistentHashSet.EMPTY);
if(cljs.analyzer.public_name_QMARK_(new cljs.core.Keyword(null,"ns","ns",441598760).cljs$core$IFn$_invoke$arity$1(ev),sym__$1)){
cljs.analyzer.warning(new cljs.core.Keyword(null,"redef","redef",1032704258),env,new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"sym","sym",-1444860305),sym__$1,new cljs.core.Keyword(null,"ns","ns",441598760),new cljs.core.Keyword(null,"ns","ns",441598760).cljs$core$IFn$_invoke$arity$1(ev),new cljs.core.Keyword(null,"ns-name","ns-name",-2077346323),ns_name], null));
} else {
}

cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$variadic(cljs.env._STAR_compiler_STAR_,cljs.core.update_in,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("cljs.analyzer","namespaces","cljs.analyzer/namespaces",-260788927),ns_name,new cljs.core.Keyword(null,"excludes","excludes",-1791725945)], null),conj_to_set,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([sym__$1], 0));

return cljs.core.update_in.cljs$core$IFn$_invoke$arity$4(env,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"ns","ns",441598760),new cljs.core.Keyword(null,"excludes","excludes",-1791725945)], null),conj_to_set,sym__$1);
})():env);
var var_name = new cljs.core.Keyword(null,"name","name",1843675177).cljs$core$IFn$_invoke$arity$1(cljs.analyzer.resolve_var.cljs$core$IFn$_invoke$arity$2(cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(env__$1,new cljs.core.Keyword(null,"locals","locals",535295783)),sym__$1));
var init_expr = ((cljs.core.contains_QMARK_(args,new cljs.core.Keyword(null,"init","init",-1875481434)))?(function (){
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(cljs.env._STAR_compiler_STAR_,cljs.core.assoc_in,new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("cljs.analyzer","namespaces","cljs.analyzer/namespaces",-260788927),ns_name,new cljs.core.Keyword(null,"defs","defs",1398449717),sym__$1], null),cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"name","name",1843675177),var_name], null),sym_meta,((dynamic === true)?new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"dynamic","dynamic",704819571),true], null):null),cljs.analyzer.source_info.cljs$core$IFn$_invoke$arity$2(var_name,env__$1)], 0)));

var _STAR_recur_frames_STAR__orig_val__45254 = cljs.analyzer._STAR_recur_frames_STAR_;
var _STAR_recur_frames_STAR__temp_val__45255 = cljs.core.cons(null,cljs.analyzer._STAR_recur_frames_STAR_);
(cljs.analyzer._STAR_recur_frames_STAR_ = _STAR_recur_frames_STAR__temp_val__45255);

try{var _STAR_allow_ns_STAR__orig_val__45263 = cljs.analyzer._STAR_allow_ns_STAR_;
var _STAR_allow_ns_STAR__temp_val__45264 = false;
(cljs.analyzer._STAR_allow_ns_STAR_ = _STAR_allow_ns_STAR__temp_val__45264);

try{var G__45267 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(env__$1,new cljs.core.Keyword(null,"context","context",-830191113),new cljs.core.Keyword(null,"expr","expr",745722291));
var G__45268 = new cljs.core.Keyword(null,"init","init",-1875481434).cljs$core$IFn$_invoke$arity$1(args);
var G__45269 = sym__$1;
return (cljs.analyzer.analyze.cljs$core$IFn$_invoke$arity$3 ? cljs.analyzer.analyze.cljs$core$IFn$_invoke$arity$3(G__45267,G__45268,G__45269) : cljs.analyzer.analyze.call(null,G__45267,G__45268,G__45269));
}finally {(cljs.analyzer._STAR_allow_ns_STAR_ = _STAR_allow_ns_STAR__orig_val__45263);
}}finally {(cljs.analyzer._STAR_recur_frames_STAR_ = _STAR_recur_frames_STAR__orig_val__45254);
}})()
:null);
var fn_var_QMARK_ = (((!((init_expr == null)))) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"op","op",-1882987955).cljs$core$IFn$_invoke$arity$1(init_expr),new cljs.core.Keyword(null,"fn","fn",-1175266204))));
var tag__$1 = ((fn_var_QMARK_)?(function (){var or__5002__auto__ = new cljs.core.Keyword(null,"ret-tag","ret-tag",1705919990).cljs$core$IFn$_invoke$arity$1(init_expr);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = tag;
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
return new cljs.core.Keyword(null,"inferred-ret-tag","inferred-ret-tag",798934347).cljs$core$IFn$_invoke$arity$1(init_expr);
}
}
})():(cljs.core.truth_(tag)?tag:(cljs.core.truth_(dynamic)?cljs.analyzer.impl.ANY_SYM:new cljs.core.Keyword(null,"tag","tag",-1290361223).cljs$core$IFn$_invoke$arity$1(init_expr)
)));
var export_as = (function (){var temp__5804__auto__ = new cljs.core.Keyword(null,"export","export",214356590).cljs$core$IFn$_invoke$arity$1(cljs.core.meta(sym__$1));
if(cljs.core.truth_(temp__5804__auto__)){
var export_val = temp__5804__auto__;
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(true,export_val)){
return var_name;
} else {
return export_val;
}
} else {
return null;
}
})();
var doc = (function (){var or__5002__auto__ = new cljs.core.Keyword(null,"doc","doc",1913296891).cljs$core$IFn$_invoke$arity$1(args);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword(null,"doc","doc",1913296891).cljs$core$IFn$_invoke$arity$1(cljs.core.meta(sym__$1));
}
})();
var temp__5808__auto___48779 = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(cljs.env._STAR_compiler_STAR_),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("cljs.analyzer","namespaces","cljs.analyzer/namespaces",-260788927),ns_name,new cljs.core.Keyword(null,"defs","defs",1398449717),sym__$1], null));
if((temp__5808__auto___48779 == null)){
} else {
var v_48782 = temp__5808__auto___48779;
if(((cljs.core.not(new cljs.core.Keyword(null,"declared","declared",92336021).cljs$core$IFn$_invoke$arity$1(cljs.core.meta(sym__$1)))) && (((new cljs.core.Keyword(null,"fn-var","fn-var",1086204730).cljs$core$IFn$_invoke$arity$1(v_48782) === true) && ((!(fn_var_QMARK_))))))){
cljs.analyzer.warning(new cljs.core.Keyword(null,"fn-var","fn-var",1086204730),env__$1,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"ns-name","ns-name",-2077346323),ns_name,new cljs.core.Keyword(null,"sym","sym",-1444860305),sym__$1], null));
} else {
}
}

if((((cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(cljs.env._STAR_compiler_STAR_),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("cljs.analyzer","namespaces","cljs.analyzer/namespaces",-260788927),ns_name,new cljs.core.Keyword(null,"defs","defs",1398449717),sym__$1], null)) == null)) || (cljs.core.not(new cljs.core.Keyword(null,"declared","declared",92336021).cljs$core$IFn$_invoke$arity$1(sym_meta))))){
if(cljs.core.truth_(cljs.analyzer._STAR_file_defs_STAR_)){
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$3(cljs.analyzer._STAR_file_defs_STAR_,cljs.core.conj,sym__$1);
} else {
}

cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(cljs.env._STAR_compiler_STAR_,cljs.core.assoc_in,new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("cljs.analyzer","namespaces","cljs.analyzer/namespaces",-260788927),ns_name,new cljs.core.Keyword(null,"defs","defs",1398449717),sym__$1], null),cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"name","name",1843675177),var_name], null),(function (){var G__45282 = sym_meta;
if(cljs.core.truth_(new cljs.core.Keyword(null,"test","test",577538877).cljs$core$IFn$_invoke$arity$1(sym_meta))){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__45282,new cljs.core.Keyword(null,"test","test",577538877),true);
} else {
return G__45282;
}
})(),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"meta","meta",1499536964),cljs.core.update_in.cljs$core$IFn$_invoke$arity$3(cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(sym_meta,new cljs.core.Keyword(null,"test","test",577538877)),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"file","file",-1269645878)], null),(function (f){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"name","name",1843675177).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"ns","ns",441598760).cljs$core$IFn$_invoke$arity$1(env__$1)),new cljs.core.Symbol(null,"cljs.core","cljs.core",770546058,null))){
return "cljs/core.cljs";
} else {
return f;
}
}))], null),(cljs.core.truth_(doc)?new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"doc","doc",1913296891),doc], null):null),(cljs.core.truth_(const_QMARK_)?(function (){var const_expr = (function (){var _STAR_passes_STAR__orig_val__45283 = cljs.analyzer._STAR_passes_STAR_;
var _STAR_passes_STAR__temp_val__45284 = cljs.core.conj.cljs$core$IFn$_invoke$arity$2(cljs.analyzer._STAR_passes_STAR_,cljs.analyzer.replace_env_pass(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"context","context",-830191113),new cljs.core.Keyword(null,"expr","expr",745722291)], null)));
(cljs.analyzer._STAR_passes_STAR_ = _STAR_passes_STAR__temp_val__45284);

try{var G__45285 = env__$1;
var G__45286 = new cljs.core.Keyword(null,"init","init",-1875481434).cljs$core$IFn$_invoke$arity$1(args);
return (cljs.analyzer.analyze.cljs$core$IFn$_invoke$arity$2 ? cljs.analyzer.analyze.cljs$core$IFn$_invoke$arity$2(G__45285,G__45286) : cljs.analyzer.analyze.call(null,G__45285,G__45286));
}finally {(cljs.analyzer._STAR_passes_STAR_ = _STAR_passes_STAR__orig_val__45283);
}})();
if(cljs.core.truth_(cljs.analyzer.constant_value_QMARK_(const_expr))){
return new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"const-expr","const-expr",-1379382292),const_expr], null);
} else {
return null;
}
})():null),((dynamic === true)?new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"dynamic","dynamic",704819571),true], null):null),cljs.analyzer.source_info.cljs$core$IFn$_invoke$arity$2(var_name,env__$1),(cljs.core.truth_(protocol)?new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"protocol","protocol",652470118),protocol], null):null),(function (){var temp__5804__auto__ = new cljs.core.Keyword(null,"protocol-symbol","protocol-symbol",1279552198).cljs$core$IFn$_invoke$arity$1(cljs.core.meta(sym__$1));
if(cljs.core.truth_(temp__5804__auto__)){
var protocol_symbol = temp__5804__auto__;
return new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"protocol-symbol","protocol-symbol",1279552198),protocol_symbol,new cljs.core.Keyword(null,"info","info",-317069002),new cljs.core.Keyword(null,"protocol-info","protocol-info",1471745843).cljs$core$IFn$_invoke$arity$1(cljs.core.meta(protocol_symbol)),new cljs.core.Keyword(null,"impls","impls",-1314014853),cljs.core.PersistentHashSet.EMPTY], null);
} else {
return null;
}
})(),((fn_var_QMARK_)?(function (){var params = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__45219_SHARP_){
return cljs.core.vec(cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"name","name",1843675177),new cljs.core.Keyword(null,"params","params",710516235).cljs$core$IFn$_invoke$arity$1(p1__45219_SHARP_)));
}),new cljs.core.Keyword(null,"methods","methods",453930866).cljs$core$IFn$_invoke$arity$1(init_expr));
return cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"fn-var","fn-var",1086204730),cljs.core.not(new cljs.core.Keyword(null,"macro","macro",-867863404).cljs$core$IFn$_invoke$arity$1(sym_meta)),new cljs.core.Keyword(null,"protocol-impl","protocol-impl",2101328365),new cljs.core.Keyword(null,"protocol-impl","protocol-impl",2101328365).cljs$core$IFn$_invoke$arity$1(init_expr),new cljs.core.Keyword(null,"protocol-inline","protocol-inline",1550487556),new cljs.core.Keyword(null,"protocol-inline","protocol-inline",1550487556).cljs$core$IFn$_invoke$arity$1(init_expr)], null),(function (){var temp__5806__auto__ = new cljs.core.Keyword(null,"top-fn","top-fn",-2056129173).cljs$core$IFn$_invoke$arity$1(sym_meta);
if((temp__5806__auto__ == null)){
return new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"variadic?","variadic?",584179762),new cljs.core.Keyword(null,"variadic?","variadic?",584179762).cljs$core$IFn$_invoke$arity$1(init_expr),new cljs.core.Keyword(null,"max-fixed-arity","max-fixed-arity",-690205543),new cljs.core.Keyword(null,"max-fixed-arity","max-fixed-arity",-690205543).cljs$core$IFn$_invoke$arity$1(init_expr),new cljs.core.Keyword(null,"method-params","method-params",-980792179),params,new cljs.core.Keyword(null,"arglists","arglists",1661989754),new cljs.core.Keyword(null,"arglists","arglists",1661989754).cljs$core$IFn$_invoke$arity$1(sym_meta),new cljs.core.Keyword(null,"arglists-meta","arglists-meta",1944829838),cljs.core.doall.cljs$core$IFn$_invoke$arity$1(cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.meta,new cljs.core.Keyword(null,"arglists","arglists",1661989754).cljs$core$IFn$_invoke$arity$1(sym_meta)))], null);
} else {
var top_fn_meta = temp__5806__auto__;
return top_fn_meta;
}
})()], 0));
})():null),(cljs.core.truth_((function (){var and__5000__auto__ = new cljs.core.Keyword(null,"declared","declared",92336021).cljs$core$IFn$_invoke$arity$1(sym_meta);
if(cljs.core.truth_(and__5000__auto__)){
return new cljs.core.Keyword(null,"arglists","arglists",1661989754).cljs$core$IFn$_invoke$arity$1(sym_meta);
} else {
return and__5000__auto__;
}
})())?new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"declared","declared",92336021),true,new cljs.core.Keyword(null,"fn-var","fn-var",1086204730),true,new cljs.core.Keyword(null,"method-params","method-params",-980792179),cljs.core.second(new cljs.core.Keyword(null,"arglists","arglists",1661989754).cljs$core$IFn$_invoke$arity$1(sym_meta))], null):null),((((fn_var_QMARK_) && ((!((tag__$1 == null))))))?new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"ret-tag","ret-tag",1705919990),tag__$1], null):(cljs.core.truth_(tag__$1)?new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),tag__$1], null):null))], 0)));
} else {
}

return cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 8, [new cljs.core.Keyword(null,"env","env",-1815813235),env__$1,new cljs.core.Keyword(null,"op","op",-1882987955),new cljs.core.Keyword(null,"def","def",-1043430536),new cljs.core.Keyword(null,"form","form",-1624062471),form,new cljs.core.Keyword(null,"ns","ns",441598760),ns_name,new cljs.core.Keyword(null,"name","name",1843675177),var_name,new cljs.core.Keyword(null,"var","var",-769682797),cljs.core.assoc.cljs$core$IFn$_invoke$arity$3((function (){var G__45302 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(env__$1,new cljs.core.Keyword(null,"locals","locals",535295783)),new cljs.core.Keyword(null,"context","context",-830191113),new cljs.core.Keyword(null,"expr","expr",745722291)),new cljs.core.Keyword(null,"def-var","def-var",-698214377),true);
var G__45303 = sym__$1;
return (cljs.analyzer.analyze.cljs$core$IFn$_invoke$arity$2 ? cljs.analyzer.analyze.cljs$core$IFn$_invoke$arity$2(G__45302,G__45303) : cljs.analyzer.analyze.call(null,G__45302,G__45303));
})(),new cljs.core.Keyword(null,"op","op",-1882987955),new cljs.core.Keyword(null,"var","var",-769682797)),new cljs.core.Keyword(null,"doc","doc",1913296891),doc,new cljs.core.Keyword(null,"jsdoc","jsdoc",1745183516),new cljs.core.Keyword(null,"jsdoc","jsdoc",1745183516).cljs$core$IFn$_invoke$arity$1(sym_meta)], null),(function (){var temp__5804__auto__ = new cljs.core.Keyword(null,"goog-define","goog-define",-1048305441).cljs$core$IFn$_invoke$arity$1(sym_meta);
if(cljs.core.truth_(temp__5804__auto__)){
var goog_type = temp__5804__auto__;
return new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"goog-define","goog-define",-1048305441),goog_type], null);
} else {
return null;
}
})(),((new cljs.core.Keyword(null,"def-emits-var","def-emits-var",-1551927320).cljs$core$IFn$_invoke$arity$1(env__$1) === true)?new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"var-ast","var-ast",1200379319),cljs.analyzer.var_ast(env__$1,sym__$1)], null):null),(function (){var temp__5808__auto__ = new cljs.core.Keyword(null,"test","test",577538877).cljs$core$IFn$_invoke$arity$1(sym_meta);
if((temp__5808__auto__ == null)){
return null;
} else {
var test = temp__5808__auto__;
return new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"test","test",577538877),(function (){var G__45304 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(env__$1,new cljs.core.Keyword(null,"context","context",-830191113),new cljs.core.Keyword(null,"expr","expr",745722291));
var G__45305 = test;
return (cljs.analyzer.analyze.cljs$core$IFn$_invoke$arity$2 ? cljs.analyzer.analyze.cljs$core$IFn$_invoke$arity$2(G__45304,G__45305) : cljs.analyzer.analyze.call(null,G__45304,G__45305));
})()], null);
}
})(),(((!((tag__$1 == null))))?((fn_var_QMARK_)?new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"ret-tag","ret-tag",1705919990),tag__$1], null):new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),tag__$1], null)):null),((dynamic === true)?new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"dynamic","dynamic",704819571),true], null):null),(((!((export_as == null))))?new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"export","export",214356590),export_as], null):null),(((!((init_expr == null))))?new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"init","init",-1875481434),init_expr,new cljs.core.Keyword(null,"children","children",-940561982),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"var","var",-769682797),new cljs.core.Keyword(null,"init","init",-1875481434)], null)], null):new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"children","children",-940561982),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"var","var",-769682797)], null)], null))], 0));
}));
cljs.analyzer.analyze_fn_method_param = (function cljs$analyzer$analyze_fn_method_param(env){
return (function (p__45312,p__45313){
var vec__45319 = p__45312;
var locals = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__45319,(0),null);
var params = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__45319,(1),null);
var vec__45322 = p__45313;
var arg_id = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__45322,(0),null);
var name = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__45322,(1),null);
if(cljs.core.truth_(cljs.core.namespace(name))){
throw cljs.analyzer.error.cljs$core$IFn$_invoke$arity$2(env,["Can't use qualified name as parameter: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(name)].join(''));
} else {
}

var line = cljs.analyzer.get_line(name,env);
var column = cljs.analyzer.get_col(name,env);
var nmeta = cljs.core.meta(name);
var tag = new cljs.core.Keyword(null,"tag","tag",-1290361223).cljs$core$IFn$_invoke$arity$1(nmeta);
var shadow__$1 = (((!((locals == null))))?cljs.analyzer.handle_symbol_local(name,(locals.cljs$core$IFn$_invoke$arity$1 ? locals.cljs$core$IFn$_invoke$arity$1(name) : locals.call(null,name))):null);
var env__$1 = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.select_keys(env,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"context","context",-830191113)], null)),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"line","line",212345235),line,new cljs.core.Keyword(null,"column","column",2078222095),column], null)], 0));
var param = cljs.core.PersistentHashMap.fromArrays([new cljs.core.Keyword(null,"name","name",1843675177),new cljs.core.Keyword(null,"binding-form?","binding-form?",1728940169),new cljs.core.Keyword(null,"op","op",-1882987955),new cljs.core.Keyword(null,"env","env",-1815813235),new cljs.core.Keyword(null,"column","column",2078222095),new cljs.core.Keyword(null,"line","line",212345235),new cljs.core.Keyword(null,"arg-id","arg-id",-767177868),new cljs.core.Keyword(null,"info","info",-317069002),new cljs.core.Keyword(null,"tag","tag",-1290361223),new cljs.core.Keyword(null,"shadow","shadow",873231803),new cljs.core.Keyword(null,"local","local",-1497766724)],[name,true,new cljs.core.Keyword(null,"binding","binding",539932593),env__$1,column,line,arg_id,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"name","name",1843675177),name,new cljs.core.Keyword(null,"shadow","shadow",873231803),shadow__$1], null),tag,shadow__$1,new cljs.core.Keyword(null,"arg","arg",-1747261837)]);
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(locals,name,param),cljs.core.conj.cljs$core$IFn$_invoke$arity$2(params,param)], null);
});
});
cljs.analyzer.analyze_fn_method_body = (function cljs$analyzer$analyze_fn_method_body(env,form,recur_frames){
var _STAR_recur_frames_STAR__orig_val__45328 = cljs.analyzer._STAR_recur_frames_STAR_;
var _STAR_recur_frames_STAR__temp_val__45329 = recur_frames;
(cljs.analyzer._STAR_recur_frames_STAR_ = _STAR_recur_frames_STAR__temp_val__45329);

try{return (cljs.analyzer.analyze.cljs$core$IFn$_invoke$arity$2 ? cljs.analyzer.analyze.cljs$core$IFn$_invoke$arity$2(env,form) : cljs.analyzer.analyze.call(null,env,form));
}finally {(cljs.analyzer._STAR_recur_frames_STAR_ = _STAR_recur_frames_STAR__orig_val__45328);
}});
cljs.analyzer.analyze_fn_method = (function cljs$analyzer$analyze_fn_method(env,locals,form,type,analyze_body_QMARK_){
var param_names = cljs.core.first(form);
var variadic = cljs.core.boolean$(cljs.core.some(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Symbol(null,"&","&",-2144855648,null),"null"], null), null),param_names));
var param_names__$1 = cljs.core.vec(cljs.core.remove.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Symbol(null,"&","&",-2144855648,null),"null"], null), null),param_names));
var body = cljs.core.next(form);
var step = cljs.analyzer.analyze_fn_method_param(env);
var step_init = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [locals,cljs.core.PersistentVector.EMPTY], null);
var vec__45331 = cljs.core.reduce.cljs$core$IFn$_invoke$arity$3(step,step_init,cljs.core.map_indexed.cljs$core$IFn$_invoke$arity$2(cljs.core.vector,param_names__$1));
var locals__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__45331,(0),null);
var params = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__45331,(1),null);
var params_SINGLEQUOTE_ = ((variadic === true)?cljs.core.butlast(params):params);
var fixed_arity = cljs.core.count(params_SINGLEQUOTE_);
var recur_frame = new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"protocol-impl","protocol-impl",2101328365),new cljs.core.Keyword(null,"protocol-impl","protocol-impl",2101328365).cljs$core$IFn$_invoke$arity$1(env),new cljs.core.Keyword(null,"params","params",710516235),params,new cljs.core.Keyword(null,"flag","flag",1088647881),cljs.core.atom.cljs$core$IFn$_invoke$arity$1(null),new cljs.core.Keyword(null,"tags","tags",1771418977),cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentVector.EMPTY)], null);
var recur_frames = cljs.core.cons(recur_frame,cljs.analyzer._STAR_recur_frames_STAR_);
var body_env = cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(env,new cljs.core.Keyword(null,"context","context",-830191113),new cljs.core.Keyword(null,"return","return",-1891502105),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"locals","locals",535295783),locals__$1], 0));
var body_form = cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$2((new cljs.core.List(null,new cljs.core.Symbol(null,"do","do",1686842252,null),null,(1),null)),body)));
var expr = (cljs.core.truth_(analyze_body_QMARK_)?cljs.analyzer.analyze_fn_method_body(body_env,body_form,recur_frames):null);
var recurs = cljs.core.deref(new cljs.core.Keyword(null,"flag","flag",1088647881).cljs$core$IFn$_invoke$arity$1(recur_frame));
return cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 8, [new cljs.core.Keyword(null,"env","env",-1815813235),env,new cljs.core.Keyword(null,"op","op",-1882987955),new cljs.core.Keyword(null,"fn-method","fn-method",236100839),new cljs.core.Keyword(null,"variadic?","variadic?",584179762),variadic,new cljs.core.Keyword(null,"params","params",710516235),params,new cljs.core.Keyword(null,"fixed-arity","fixed-arity",1586445869),fixed_arity,new cljs.core.Keyword(null,"type","type",1174270348),type,new cljs.core.Keyword(null,"form","form",-1624062471),form,new cljs.core.Keyword(null,"recurs","recurs",-1959309309),recurs], null),(((!((expr == null))))?new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"body","body",-2049205669),cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(expr,new cljs.core.Keyword(null,"body?","body?",-1333761917),true),new cljs.core.Keyword(null,"children","children",-940561982),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"params","params",710516235),new cljs.core.Keyword(null,"body","body",-2049205669)], null)], null):new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"children","children",-940561982),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"params","params",710516235)], null)], null))], 0));
});
cljs.analyzer.fn_name_var = (function cljs$analyzer$fn_name_var(env,locals,name){
if((!((name == null)))){
var ns = new cljs.core.Keyword(null,"name","name",1843675177).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"ns","ns",441598760).cljs$core$IFn$_invoke$arity$1(env));
var shadow__$1 = (function (){var or__5002__auto__ = cljs.analyzer.handle_symbol_local(name,cljs.core.get.cljs$core$IFn$_invoke$arity$2(locals,name));
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(env,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"js-globals","js-globals",1670394727),name], null));
}
})();
var fn_scope = new cljs.core.Keyword(null,"fn-scope","fn-scope",-865664859).cljs$core$IFn$_invoke$arity$1(env);
var name_var = new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"name","name",1843675177),name,new cljs.core.Keyword(null,"op","op",-1882987955),new cljs.core.Keyword(null,"binding","binding",539932593),new cljs.core.Keyword(null,"local","local",-1497766724),new cljs.core.Keyword(null,"fn","fn",-1175266204),new cljs.core.Keyword(null,"info","info",-317069002),new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"fn-self-name","fn-self-name",1461143531),true,new cljs.core.Keyword(null,"fn-scope","fn-scope",-865664859),fn_scope,new cljs.core.Keyword(null,"ns","ns",441598760),ns,new cljs.core.Keyword(null,"shadow","shadow",873231803),shadow__$1], null)], null);
var tag = new cljs.core.Keyword(null,"tag","tag",-1290361223).cljs$core$IFn$_invoke$arity$1(cljs.core.meta(name));
var ret_tag = (((!((tag == null))))?new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"ret-tag","ret-tag",1705919990),tag], null):null);
return cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([name_var,ret_tag], 0));
} else {
return null;
}
});
cljs.analyzer.analyze_fn_methods_pass2_STAR_ = (function cljs$analyzer$analyze_fn_methods_pass2_STAR_(menv,locals,type,meths){
return cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (p1__45346_SHARP_){
return cljs.analyzer.analyze_fn_method(menv,locals,p1__45346_SHARP_,type,true);
}),meths);
});
cljs.analyzer.analyze_fn_methods_pass2 = (function cljs$analyzer$analyze_fn_methods_pass2(menv,locals,type,meths){
return cljs.analyzer.analyze_fn_methods_pass2_STAR_(menv,locals,type,meths);
});
cljs.analyzer.parse.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Symbol(null,"fn*","fn*",-752876845,null),(function (op,env,p__45360,name,_){
var vec__45361 = p__45360;
var seq__45362 = cljs.core.seq(vec__45361);
var first__45363 = cljs.core.first(seq__45362);
var seq__45362__$1 = cljs.core.next(seq__45362);
var ___$1 = first__45363;
var args = seq__45362__$1;
var form = vec__45361;
var named_fn_QMARK_ = (cljs.core.first(args) instanceof cljs.core.Symbol);
var vec__45364 = ((named_fn_QMARK_)?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.first(args),cljs.core.next(args)], null):new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [name,cljs.core.seq(args)], null));
var name__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__45364,(0),null);
var meths = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__45364,(1),null);
var meths__$1 = ((cljs.core.vector_QMARK_(cljs.core.first(meths)))?(new cljs.core.List(null,meths,null,(1),null)):meths);
var locals = new cljs.core.Keyword(null,"locals","locals",535295783).cljs$core$IFn$_invoke$arity$1(env);
var name_var = cljs.analyzer.fn_name_var(env,locals,name__$1);
var env__$1 = (((!((name__$1 == null))))?cljs.core.update_in.cljs$core$IFn$_invoke$arity$4(env,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"fn-scope","fn-scope",-865664859)], null),cljs.core.conj,name_var):env);
var locals__$1 = (((((!((locals == null)))) && (named_fn_QMARK_)))?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(locals,name__$1,name_var):locals);
var form_meta = cljs.core.meta(form);
var type = new cljs.core.Keyword("cljs.analyzer","type","cljs.analyzer/type",478749742).cljs$core$IFn$_invoke$arity$1(form_meta);
var proto_impl = new cljs.core.Keyword("cljs.analyzer","protocol-impl","cljs.analyzer/protocol-impl",-1523935409).cljs$core$IFn$_invoke$arity$1(form_meta);
var proto_inline = new cljs.core.Keyword("cljs.analyzer","protocol-inline","cljs.analyzer/protocol-inline",-1611519026).cljs$core$IFn$_invoke$arity$1(form_meta);
var menv = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2((function (){var G__45367 = env__$1;
if((cljs.core.count(meths__$1) > (1))){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__45367,new cljs.core.Keyword(null,"context","context",-830191113),new cljs.core.Keyword(null,"expr","expr",745722291));
} else {
return G__45367;
}
})(),new cljs.core.Keyword(null,"in-loop","in-loop",-187298246)),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"protocol-impl","protocol-impl",2101328365),proto_impl,new cljs.core.Keyword(null,"protocol-inline","protocol-inline",1550487556),proto_inline], null)], 0));
var methods$ = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__45353_SHARP_){
var _STAR_allow_ns_STAR__orig_val__45368 = cljs.analyzer._STAR_allow_ns_STAR_;
var _STAR_allow_ns_STAR__temp_val__45369 = false;
(cljs.analyzer._STAR_allow_ns_STAR_ = _STAR_allow_ns_STAR__temp_val__45369);

try{return cljs.analyzer.analyze_fn_method(menv,locals__$1,p1__45353_SHARP_,type,(name__$1 == null));
}finally {(cljs.analyzer._STAR_allow_ns_STAR_ = _STAR_allow_ns_STAR__orig_val__45368);
}}),meths__$1);
var mfa = cljs.core.transduce.cljs$core$IFn$_invoke$arity$4(cljs.core.map.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"fixed-arity","fixed-arity",1586445869)),cljs.core.max,(0),methods$);
var variadic = cljs.core.boolean$(cljs.core.some(new cljs.core.Keyword(null,"variadic?","variadic?",584179762),methods$));
var locals__$2 = ((named_fn_QMARK_)?cljs.core.update_in.cljs$core$IFn$_invoke$arity$variadic(locals__$1,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [name__$1], null),cljs.core.assoc,new cljs.core.Keyword(null,"fn-var","fn-var",1086204730),true,new cljs.core.Keyword(null,"variadic?","variadic?",584179762),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([variadic,new cljs.core.Keyword(null,"max-fixed-arity","max-fixed-arity",-690205543),mfa,new cljs.core.Keyword(null,"method-params","method-params",-980792179),cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"params","params",710516235),methods$)], 0)):locals__$1);
var methods$__$1 = (((!((name__$1 == null))))?(function (){var _STAR_allow_ns_STAR__orig_val__45370 = cljs.analyzer._STAR_allow_ns_STAR_;
var _STAR_allow_ns_STAR__temp_val__45371 = false;
(cljs.analyzer._STAR_allow_ns_STAR_ = _STAR_allow_ns_STAR__temp_val__45371);

try{return cljs.analyzer.analyze_fn_methods_pass2(menv,locals__$2,type,meths__$1);
}finally {(cljs.analyzer._STAR_allow_ns_STAR_ = _STAR_allow_ns_STAR__orig_val__45370);
}})():cljs.core.vec(methods$));
var form__$1 = cljs.core.vary_meta.cljs$core$IFn$_invoke$arity$5(form,cljs.core.dissoc,new cljs.core.Keyword("cljs.analyzer","protocol-impl","cljs.analyzer/protocol-impl",-1523935409),new cljs.core.Keyword("cljs.analyzer","protocol-inline","cljs.analyzer/protocol-inline",-1611519026),new cljs.core.Keyword("cljs.analyzer","type","cljs.analyzer/type",478749742));
var js_doc = ((variadic === true)?"@param {...*} var_args":null);
var children = (((!((name_var == null))))?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"local","local",-1497766724),new cljs.core.Keyword(null,"methods","methods",453930866)], null):new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"methods","methods",453930866)], null));
var inferred_ret_tag = (function (){var inferred_tags = cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.partial.cljs$core$IFn$_invoke$arity$2(cljs.analyzer.infer_tag,env__$1),cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"body","body",-2049205669),methods$__$1));
if(cljs.core.truth_(cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core._EQ_,inferred_tags))){
return cljs.core.first(inferred_tags);
} else {
return null;
}
})();
var ast = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.PersistentHashMap.fromArrays([new cljs.core.Keyword(null,"children","children",-940561982),new cljs.core.Keyword(null,"protocol-inline","protocol-inline",1550487556),new cljs.core.Keyword(null,"name","name",1843675177),new cljs.core.Keyword(null,"loop-lets","loop-lets",2036794185),new cljs.core.Keyword(null,"inferred-ret-tag","inferred-ret-tag",798934347),new cljs.core.Keyword(null,"protocol-impl","protocol-impl",2101328365),new cljs.core.Keyword(null,"op","op",-1882987955),new cljs.core.Keyword(null,"env","env",-1815813235),new cljs.core.Keyword(null,"variadic?","variadic?",584179762),new cljs.core.Keyword(null,"methods","methods",453930866),new cljs.core.Keyword(null,"recur-frames","recur-frames",-307205196),new cljs.core.Keyword(null,"max-fixed-arity","max-fixed-arity",-690205543),new cljs.core.Keyword(null,"form","form",-1624062471),new cljs.core.Keyword(null,"tag","tag",-1290361223),new cljs.core.Keyword(null,"in-loop","in-loop",-187298246),new cljs.core.Keyword(null,"jsdoc","jsdoc",1745183516)],[children,proto_inline,name_var,cljs.analyzer._STAR_loop_lets_STAR_,inferred_ret_tag,proto_impl,new cljs.core.Keyword(null,"fn","fn",-1175266204),env__$1,variadic,methods$__$1,cljs.analyzer._STAR_recur_frames_STAR_,mfa,form__$1,new cljs.core.Symbol(null,"function","function",-486723946,null),new cljs.core.Keyword(null,"in-loop","in-loop",-187298246).cljs$core$IFn$_invoke$arity$1(env__$1),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [js_doc], null)]),(((!((name_var == null))))?new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"local","local",-1497766724),name_var], null):null)], 0));
var variadic_methods_48855 = cljs.core.into.cljs$core$IFn$_invoke$arity$3(cljs.core.PersistentVector.EMPTY,cljs.core.comp.cljs$core$IFn$_invoke$arity$2(cljs.core.filter.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"variadic?","variadic?",584179762)),cljs.core.take.cljs$core$IFn$_invoke$arity$1((1))),methods$__$1);
var variadic_params_48856 = (((cljs.core.count(variadic_methods_48855) > (0)))?cljs.core.count(new cljs.core.Keyword(null,"params","params",710516235).cljs$core$IFn$_invoke$arity$1(cljs.core.nth.cljs$core$IFn$_invoke$arity$2(variadic_methods_48855,(0)))):(0));
var param_counts_48857 = cljs.core.into.cljs$core$IFn$_invoke$arity$3(cljs.core.PersistentVector.EMPTY,cljs.core.map.cljs$core$IFn$_invoke$arity$1(cljs.core.comp.cljs$core$IFn$_invoke$arity$2(cljs.core.count,new cljs.core.Keyword(null,"params","params",710516235))),methods$__$1);
if(((1) < cljs.core.count(variadic_methods_48855))){
cljs.analyzer.warning(new cljs.core.Keyword(null,"multiple-variadic-overloads","multiple-variadic-overloads",1110059837),env__$1,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"name","name",1843675177),name_var], null));
} else {
}

if((!((((variadic_params_48856 === (0))) || ((variadic_params_48856 === ((1) + mfa))))))){
cljs.analyzer.warning(new cljs.core.Keyword(null,"variadic-max-arity","variadic-max-arity",-14288402),env__$1,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"name","name",1843675177),name_var], null));
} else {
}

if(cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.distinct.cljs$core$IFn$_invoke$arity$1(param_counts_48857),param_counts_48857)){
cljs.analyzer.warning(new cljs.core.Keyword(null,"overload-arity","overload-arity",823206044),env__$1,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"name","name",1843675177),name_var], null));
} else {
}

return (cljs.analyzer.analyze_wrap_meta.cljs$core$IFn$_invoke$arity$1 ? cljs.analyzer.analyze_wrap_meta.cljs$core$IFn$_invoke$arity$1(ast) : cljs.analyzer.analyze_wrap_meta.call(null,ast));
}));
cljs.analyzer.parse.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Symbol(null,"letfn*","letfn*",-110097810,null),(function (op,env,p__45372,name,_){
var vec__45373 = p__45372;
var seq__45374 = cljs.core.seq(vec__45373);
var first__45375 = cljs.core.first(seq__45374);
var seq__45374__$1 = cljs.core.next(seq__45374);
var ___$1 = first__45375;
var first__45375__$1 = cljs.core.first(seq__45374__$1);
var seq__45374__$2 = cljs.core.next(seq__45374__$1);
var bindings = first__45375__$1;
var exprs = seq__45374__$2;
var form = vec__45373;
if(((cljs.core.vector_QMARK_(bindings)) && (cljs.core.even_QMARK_(cljs.core.count(bindings))))){
} else {
throw cljs.analyzer.error.cljs$core$IFn$_invoke$arity$2(env,"bindings must be vector of even number of elements");
}

var n__GT_fexpr = cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.juxt.cljs$core$IFn$_invoke$arity$2(cljs.core.first,cljs.core.second),cljs.core.partition.cljs$core$IFn$_invoke$arity$2((2),bindings)));
var names = cljs.core.keys(n__GT_fexpr);
var context = new cljs.core.Keyword(null,"context","context",-830191113).cljs$core$IFn$_invoke$arity$1(env);
var vec__45376 = cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (p__45383,n){
var vec__45384 = p__45383;
var map__45387 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__45384,(0),null);
var map__45387__$1 = cljs.core.__destructure_map(map__45387);
var env__$1 = map__45387__$1;
var locals = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__45387__$1,new cljs.core.Keyword(null,"locals","locals",535295783));
var bes = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__45384,(1),null);
var ret_tag = new cljs.core.Keyword(null,"tag","tag",-1290361223).cljs$core$IFn$_invoke$arity$1(cljs.core.meta(n));
var fexpr = (function (){var _STAR_cljs_warnings_STAR__orig_val__45388 = cljs.analyzer._STAR_cljs_warnings_STAR_;
var _STAR_cljs_warnings_STAR__temp_val__45389 = cljs.core.zipmap(cljs.core.keys(cljs.analyzer._STAR_cljs_warnings_STAR_),cljs.core.repeat.cljs$core$IFn$_invoke$arity$1(false));
(cljs.analyzer._STAR_cljs_warnings_STAR_ = _STAR_cljs_warnings_STAR__temp_val__45389);

try{var G__45390 = env__$1;
var G__45391 = (n__GT_fexpr.cljs$core$IFn$_invoke$arity$1 ? n__GT_fexpr.cljs$core$IFn$_invoke$arity$1(n) : n__GT_fexpr.call(null,n));
return (cljs.analyzer.analyze.cljs$core$IFn$_invoke$arity$2 ? cljs.analyzer.analyze.cljs$core$IFn$_invoke$arity$2(G__45390,G__45391) : cljs.analyzer.analyze.call(null,G__45390,G__45391));
}finally {(cljs.analyzer._STAR_cljs_warnings_STAR_ = _STAR_cljs_warnings_STAR__orig_val__45388);
}})();
var be = (function (){var G__45392 = cljs.core.PersistentHashMap.fromArrays([new cljs.core.Keyword(null,"name","name",1843675177),new cljs.core.Keyword(null,"method-params","method-params",-980792179),new cljs.core.Keyword(null,"op","op",-1882987955),new cljs.core.Keyword(null,"column","column",2078222095),new cljs.core.Keyword(null,"variadic?","variadic?",584179762),new cljs.core.Keyword(null,"line","line",212345235),new cljs.core.Keyword(null,"max-fixed-arity","max-fixed-arity",-690205543),new cljs.core.Keyword(null,"fn-var","fn-var",1086204730),new cljs.core.Keyword(null,"shadow","shadow",873231803),new cljs.core.Keyword(null,"local","local",-1497766724)],[n,cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"params","params",710516235),new cljs.core.Keyword(null,"methods","methods",453930866).cljs$core$IFn$_invoke$arity$1(fexpr)),new cljs.core.Keyword(null,"binding","binding",539932593),cljs.analyzer.get_col(n,env__$1),new cljs.core.Keyword(null,"variadic?","variadic?",584179762).cljs$core$IFn$_invoke$arity$1(fexpr),cljs.analyzer.get_line(n,env__$1),new cljs.core.Keyword(null,"max-fixed-arity","max-fixed-arity",-690205543).cljs$core$IFn$_invoke$arity$1(fexpr),true,cljs.analyzer.handle_symbol_local(n,(locals.cljs$core$IFn$_invoke$arity$1 ? locals.cljs$core$IFn$_invoke$arity$1(n) : locals.call(null,n))),new cljs.core.Keyword(null,"letfn","letfn",-2121022354)]);
if(cljs.core.truth_(ret_tag)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__45392,new cljs.core.Keyword(null,"ret-tag","ret-tag",1705919990),ret_tag);
} else {
return G__45392;
}
})();
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.assoc_in(env__$1,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"locals","locals",535295783),n], null),be),cljs.core.conj.cljs$core$IFn$_invoke$arity$2(bes,be)], null);
}),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [env,cljs.core.PersistentVector.EMPTY], null),names);
var meth_env = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__45376,(0),null);
var bes = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__45376,(1),null);
var meth_env__$1 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(meth_env,new cljs.core.Keyword(null,"context","context",-830191113),new cljs.core.Keyword(null,"expr","expr",745722291));
var vec__45379 = cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (p__45393,p__45394){
var vec__45395 = p__45393;
var meth_env__$2 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__45395,(0),null);
var bes__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__45395,(1),null);
var map__45398 = p__45394;
var map__45398__$1 = cljs.core.__destructure_map(map__45398);
var be = map__45398__$1;
var name__$1 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__45398__$1,new cljs.core.Keyword(null,"name","name",1843675177));
var shadow__$1 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__45398__$1,new cljs.core.Keyword(null,"shadow","shadow",873231803));
var env__$1 = cljs.core.assoc_in(meth_env__$2,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"locals","locals",535295783),name__$1], null),shadow__$1);
var fexpr = (function (){var G__45399 = env__$1;
var G__45400 = (n__GT_fexpr.cljs$core$IFn$_invoke$arity$1 ? n__GT_fexpr.cljs$core$IFn$_invoke$arity$1(name__$1) : n__GT_fexpr.call(null,name__$1));
return (cljs.analyzer.analyze.cljs$core$IFn$_invoke$arity$2 ? cljs.analyzer.analyze.cljs$core$IFn$_invoke$arity$2(G__45399,G__45400) : cljs.analyzer.analyze.call(null,G__45399,G__45400));
})();
var be_SINGLEQUOTE_ = cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(be,new cljs.core.Keyword(null,"init","init",-1875481434),fexpr,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"variadic?","variadic?",584179762),new cljs.core.Keyword(null,"variadic?","variadic?",584179762).cljs$core$IFn$_invoke$arity$1(fexpr),new cljs.core.Keyword(null,"max-fixed-arity","max-fixed-arity",-690205543),new cljs.core.Keyword(null,"max-fixed-arity","max-fixed-arity",-690205543).cljs$core$IFn$_invoke$arity$1(fexpr),new cljs.core.Keyword(null,"method-params","method-params",-980792179),cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"params","params",710516235),new cljs.core.Keyword(null,"methods","methods",453930866).cljs$core$IFn$_invoke$arity$1(fexpr)),new cljs.core.Keyword(null,"children","children",-940561982),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"init","init",-1875481434)], null)], 0));
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.assoc_in(env__$1,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"locals","locals",535295783),name__$1], null),be_SINGLEQUOTE_),cljs.core.conj.cljs$core$IFn$_invoke$arity$2(bes__$1,be_SINGLEQUOTE_)], null);
}),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [meth_env__$1,cljs.core.PersistentVector.EMPTY], null),bes);
var meth_env__$2 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__45379,(0),null);
var bes__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__45379,(1),null);
var expr = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3((function (){var G__45401 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(meth_env__$2,new cljs.core.Keyword(null,"context","context",-830191113),((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"expr","expr",745722291),context))?new cljs.core.Keyword(null,"return","return",-1891502105):context));
var G__45402 = cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$2((new cljs.core.List(null,new cljs.core.Symbol(null,"do","do",1686842252,null),null,(1),null)),exprs)));
return (cljs.analyzer.analyze.cljs$core$IFn$_invoke$arity$2 ? cljs.analyzer.analyze.cljs$core$IFn$_invoke$arity$2(G__45401,G__45402) : cljs.analyzer.analyze.call(null,G__45401,G__45402));
})(),new cljs.core.Keyword(null,"body?","body?",-1333761917),true);
return new cljs.core.PersistentArrayMap(null, 6, [new cljs.core.Keyword(null,"env","env",-1815813235),env,new cljs.core.Keyword(null,"op","op",-1882987955),new cljs.core.Keyword(null,"letfn","letfn",-2121022354),new cljs.core.Keyword(null,"bindings","bindings",1271397192),bes__$1,new cljs.core.Keyword(null,"body","body",-2049205669),expr,new cljs.core.Keyword(null,"form","form",-1624062471),form,new cljs.core.Keyword(null,"children","children",-940561982),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"bindings","bindings",1271397192),new cljs.core.Keyword(null,"body","body",-2049205669)], null)], null);
}));
cljs.analyzer.analyze_do_statements_STAR_ = (function cljs$analyzer$analyze_do_statements_STAR_(env,exprs){
return cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (p1__45403_SHARP_){
var G__45404 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(env,new cljs.core.Keyword(null,"context","context",-830191113),new cljs.core.Keyword(null,"statement","statement",-32780863));
var G__45405 = p1__45403_SHARP_;
return (cljs.analyzer.analyze.cljs$core$IFn$_invoke$arity$2 ? cljs.analyzer.analyze.cljs$core$IFn$_invoke$arity$2(G__45404,G__45405) : cljs.analyzer.analyze.call(null,G__45404,G__45405));
}),cljs.core.butlast(exprs));
});
cljs.analyzer.analyze_do_statements = (function cljs$analyzer$analyze_do_statements(env,exprs){
var _STAR_recur_frames_STAR__orig_val__45406 = cljs.analyzer._STAR_recur_frames_STAR_;
var _STAR_recur_frames_STAR__temp_val__45407 = cljs.core.cons(null,cljs.analyzer._STAR_recur_frames_STAR_);
(cljs.analyzer._STAR_recur_frames_STAR_ = _STAR_recur_frames_STAR__temp_val__45407);

try{return cljs.analyzer.analyze_do_statements_STAR_(env,exprs);
}finally {(cljs.analyzer._STAR_recur_frames_STAR_ = _STAR_recur_frames_STAR__orig_val__45406);
}});
cljs.analyzer.parse.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Symbol(null,"do","do",1686842252,null),(function (op,env,p__45408,_,___$1){
var vec__45409 = p__45408;
var seq__45410 = cljs.core.seq(vec__45409);
var first__45411 = cljs.core.first(seq__45410);
var seq__45410__$1 = cljs.core.next(seq__45410);
var ___$2 = first__45411;
var exprs = seq__45410__$1;
var form = vec__45409;
var statements = cljs.analyzer.analyze_do_statements(env,exprs);
if((cljs.core.count(exprs) <= (1))){
var ret = (function (){var G__45412 = env;
var G__45413 = cljs.core.first(exprs);
return (cljs.analyzer.analyze.cljs$core$IFn$_invoke$arity$2 ? cljs.analyzer.analyze.cljs$core$IFn$_invoke$arity$2(G__45412,G__45413) : cljs.analyzer.analyze.call(null,G__45412,G__45413));
})();
var children = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"statements","statements",600349855),new cljs.core.Keyword(null,"ret","ret",-468222814)], null);
return new cljs.core.PersistentArrayMap(null, 6, [new cljs.core.Keyword(null,"op","op",-1882987955),new cljs.core.Keyword(null,"do","do",46310725),new cljs.core.Keyword(null,"env","env",-1815813235),env,new cljs.core.Keyword(null,"form","form",-1624062471),form,new cljs.core.Keyword(null,"statements","statements",600349855),statements,new cljs.core.Keyword(null,"ret","ret",-468222814),ret,new cljs.core.Keyword(null,"children","children",-940561982),children], null);
} else {
var ret_env = ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"statement","statement",-32780863),new cljs.core.Keyword(null,"context","context",-830191113).cljs$core$IFn$_invoke$arity$1(env)))?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(env,new cljs.core.Keyword(null,"context","context",-830191113),new cljs.core.Keyword(null,"statement","statement",-32780863)):cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(env,new cljs.core.Keyword(null,"context","context",-830191113),new cljs.core.Keyword(null,"return","return",-1891502105)));
var ret = (function (){var G__45414 = ret_env;
var G__45415 = cljs.core.last(exprs);
return (cljs.analyzer.analyze.cljs$core$IFn$_invoke$arity$2 ? cljs.analyzer.analyze.cljs$core$IFn$_invoke$arity$2(G__45414,G__45415) : cljs.analyzer.analyze.call(null,G__45414,G__45415));
})();
var children = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"statements","statements",600349855),new cljs.core.Keyword(null,"ret","ret",-468222814)], null);
return new cljs.core.PersistentArrayMap(null, 6, [new cljs.core.Keyword(null,"op","op",-1882987955),new cljs.core.Keyword(null,"do","do",46310725),new cljs.core.Keyword(null,"env","env",-1815813235),env,new cljs.core.Keyword(null,"form","form",-1624062471),form,new cljs.core.Keyword(null,"statements","statements",600349855),statements,new cljs.core.Keyword(null,"ret","ret",-468222814),ret,new cljs.core.Keyword(null,"children","children",-940561982),children], null);
}
}));
cljs.analyzer.analyze_let_binding_init = (function cljs$analyzer$analyze_let_binding_init(env,init,loop_lets){
var _STAR_loop_lets_STAR__orig_val__45416 = cljs.analyzer._STAR_loop_lets_STAR_;
var _STAR_loop_lets_STAR__temp_val__45417 = loop_lets;
(cljs.analyzer._STAR_loop_lets_STAR_ = _STAR_loop_lets_STAR__temp_val__45417);

try{return (cljs.analyzer.analyze.cljs$core$IFn$_invoke$arity$2 ? cljs.analyzer.analyze.cljs$core$IFn$_invoke$arity$2(env,init) : cljs.analyzer.analyze.call(null,env,init));
}finally {(cljs.analyzer._STAR_loop_lets_STAR_ = _STAR_loop_lets_STAR__orig_val__45416);
}});
cljs.analyzer.get_let_tag = (function cljs$analyzer$get_let_tag(name,init_expr){
var temp__5806__auto__ = new cljs.core.Keyword(null,"tag","tag",-1290361223).cljs$core$IFn$_invoke$arity$1(cljs.core.meta(name));
if((temp__5806__auto__ == null)){
var temp__5806__auto____$1 = new cljs.core.Keyword(null,"tag","tag",-1290361223).cljs$core$IFn$_invoke$arity$1(init_expr);
if((temp__5806__auto____$1 == null)){
return new cljs.core.Keyword(null,"tag","tag",-1290361223).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"info","info",-317069002).cljs$core$IFn$_invoke$arity$1(init_expr));
} else {
var tag = temp__5806__auto____$1;
return tag;
}
} else {
var tag = temp__5806__auto__;
return tag;
}
});
cljs.analyzer.analyze_let_bindings_STAR_ = (function cljs$analyzer$analyze_let_bindings_STAR_(encl_env,bindings,op){
var bes = cljs.core.PersistentVector.EMPTY;
var env = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(encl_env,new cljs.core.Keyword(null,"context","context",-830191113),new cljs.core.Keyword(null,"expr","expr",745722291));
var bindings__$1 = cljs.core.seq(cljs.core.partition.cljs$core$IFn$_invoke$arity$2((2),bindings));
while(true){
var temp__5806__auto__ = cljs.core.first(bindings__$1);
if((temp__5806__auto__ == null)){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [bes,env], null);
} else {
var vec__45424 = temp__5806__auto__;
var name = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__45424,(0),null);
var init = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__45424,(1),null);
if((((!((cljs.core.namespace(name) == null)))) || (goog.string.contains(cljs.core.str.cljs$core$IFn$_invoke$arity$1(name),".")))){
throw cljs.analyzer.error.cljs$core$IFn$_invoke$arity$2(encl_env,["Invalid local name: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(name)].join(''));
} else {
}

var init_expr = cljs.analyzer.analyze_let_binding_init(env,init,cljs.core.cons(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"params","params",710516235),bes], null),cljs.analyzer._STAR_loop_lets_STAR_));
var line = cljs.analyzer.get_line(name,env);
var col = cljs.analyzer.get_col(name,env);
var shadow__$1 = (function (){var or__5002__auto__ = cljs.analyzer.handle_symbol_local(name,cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(env,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"locals","locals",535295783),name], null)));
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(env,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"js-globals","js-globals",1670394727),name], null));
}
})();
var be = cljs.core.PersistentHashMap.fromArrays([new cljs.core.Keyword(null,"children","children",-940561982),new cljs.core.Keyword(null,"init","init",-1875481434),new cljs.core.Keyword(null,"name","name",1843675177),new cljs.core.Keyword(null,"binding-form?","binding-form?",1728940169),new cljs.core.Keyword(null,"op","op",-1882987955),new cljs.core.Keyword(null,"env","env",-1815813235),new cljs.core.Keyword(null,"column","column",2078222095),new cljs.core.Keyword(null,"line","line",212345235),new cljs.core.Keyword(null,"info","info",-317069002),new cljs.core.Keyword(null,"tag","tag",-1290361223),new cljs.core.Keyword(null,"shadow","shadow",873231803),new cljs.core.Keyword(null,"local","local",-1497766724)],[new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"init","init",-1875481434)], null),init_expr,name,true,new cljs.core.Keyword(null,"binding","binding",539932593),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"line","line",212345235),line,new cljs.core.Keyword(null,"column","column",2078222095),col], null),col,line,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"name","name",1843675177),name,new cljs.core.Keyword(null,"shadow","shadow",873231803),shadow__$1], null),cljs.analyzer.get_let_tag(name,init_expr),shadow__$1,op]);
var be__$1 = ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"fn","fn",-1175266204),new cljs.core.Keyword(null,"op","op",-1882987955).cljs$core$IFn$_invoke$arity$1(init_expr)))?cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([be,new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"fn-var","fn-var",1086204730),true,new cljs.core.Keyword(null,"methods","methods",453930866),cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentVector.EMPTY,cljs.core.map.cljs$core$IFn$_invoke$arity$2(((function (bes,env,bindings__$1,init_expr,line,col,shadow__$1,be,vec__45424,name,init,temp__5806__auto__){
return (function (p1__45418_SHARP_){
return cljs.core.select_keys(p1__45418_SHARP_,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"tag","tag",-1290361223),new cljs.core.Keyword(null,"fixed-arity","fixed-arity",1586445869),new cljs.core.Keyword(null,"variadic?","variadic?",584179762)], null));
});})(bes,env,bindings__$1,init_expr,line,col,shadow__$1,be,vec__45424,name,init,temp__5806__auto__))
,new cljs.core.Keyword(null,"methods","methods",453930866).cljs$core$IFn$_invoke$arity$1(init_expr))),new cljs.core.Keyword(null,"variadic?","variadic?",584179762),new cljs.core.Keyword(null,"variadic?","variadic?",584179762).cljs$core$IFn$_invoke$arity$1(init_expr),new cljs.core.Keyword(null,"max-fixed-arity","max-fixed-arity",-690205543),new cljs.core.Keyword(null,"max-fixed-arity","max-fixed-arity",-690205543).cljs$core$IFn$_invoke$arity$1(init_expr),new cljs.core.Keyword(null,"method-params","method-params",-980792179),cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"params","params",710516235),new cljs.core.Keyword(null,"methods","methods",453930866).cljs$core$IFn$_invoke$arity$1(init_expr))], null)], 0)):be);
var G__48896 = cljs.core.conj.cljs$core$IFn$_invoke$arity$2(bes,be__$1);
var G__48897 = cljs.core.assoc_in(env,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"locals","locals",535295783),name], null),be__$1);
var G__48898 = cljs.core.next(bindings__$1);
bes = G__48896;
env = G__48897;
bindings__$1 = G__48898;
continue;
}
break;
}
});
cljs.analyzer.analyze_let_bindings = (function cljs$analyzer$analyze_let_bindings(encl_env,bindings,op){
var _STAR_recur_frames_STAR__orig_val__45432 = cljs.analyzer._STAR_recur_frames_STAR_;
var _STAR_recur_frames_STAR__temp_val__45433 = cljs.core.cons(null,cljs.analyzer._STAR_recur_frames_STAR_);
(cljs.analyzer._STAR_recur_frames_STAR_ = _STAR_recur_frames_STAR__temp_val__45433);

try{return cljs.analyzer.analyze_let_bindings_STAR_(encl_env,bindings,op);
}finally {(cljs.analyzer._STAR_recur_frames_STAR_ = _STAR_recur_frames_STAR__orig_val__45432);
}});
cljs.analyzer.analyze_let_body_STAR_ = (function cljs$analyzer$analyze_let_body_STAR_(env,context,exprs){
var G__45434 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(env,new cljs.core.Keyword(null,"context","context",-830191113),((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"expr","expr",745722291),context))?new cljs.core.Keyword(null,"return","return",-1891502105):context));
var G__45435 = cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$2((new cljs.core.List(null,new cljs.core.Symbol(null,"do","do",1686842252,null),null,(1),null)),exprs)));
return (cljs.analyzer.analyze.cljs$core$IFn$_invoke$arity$2 ? cljs.analyzer.analyze.cljs$core$IFn$_invoke$arity$2(G__45434,G__45435) : cljs.analyzer.analyze.call(null,G__45434,G__45435));
});
cljs.analyzer.analyze_let_body = (function cljs$analyzer$analyze_let_body(env,context,exprs,recur_frames,loop_lets){
var _STAR_recur_frames_STAR__orig_val__45436 = cljs.analyzer._STAR_recur_frames_STAR_;
var _STAR_loop_lets_STAR__orig_val__45437 = cljs.analyzer._STAR_loop_lets_STAR_;
var _STAR_recur_frames_STAR__temp_val__45438 = recur_frames;
var _STAR_loop_lets_STAR__temp_val__45439 = loop_lets;
(cljs.analyzer._STAR_recur_frames_STAR_ = _STAR_recur_frames_STAR__temp_val__45438);

(cljs.analyzer._STAR_loop_lets_STAR_ = _STAR_loop_lets_STAR__temp_val__45439);

try{return cljs.analyzer.analyze_let_body_STAR_(env,context,exprs);
}finally {(cljs.analyzer._STAR_loop_lets_STAR_ = _STAR_loop_lets_STAR__orig_val__45437);

(cljs.analyzer._STAR_recur_frames_STAR_ = _STAR_recur_frames_STAR__orig_val__45436);
}});
cljs.analyzer.analyze_let = (function cljs$analyzer$analyze_let(encl_env,p__45440,is_loop,widened_tags){
while(true){
var vec__45441 = p__45440;
var seq__45442 = cljs.core.seq(vec__45441);
var first__45443 = cljs.core.first(seq__45442);
var seq__45442__$1 = cljs.core.next(seq__45442);
var _ = first__45443;
var first__45443__$1 = cljs.core.first(seq__45442__$1);
var seq__45442__$2 = cljs.core.next(seq__45442__$1);
var bindings = first__45443__$1;
var exprs = seq__45442__$2;
var form = vec__45441;
if(((cljs.core.vector_QMARK_(bindings)) && (cljs.core.even_QMARK_(cljs.core.count(bindings))))){
} else {
throw cljs.analyzer.error.cljs$core$IFn$_invoke$arity$2(encl_env,"bindings must be vector of even number of elements");
}

var context = new cljs.core.Keyword(null,"context","context",-830191113).cljs$core$IFn$_invoke$arity$1(encl_env);
var op = ((is_loop === true)?new cljs.core.Keyword(null,"loop","loop",-395552849):new cljs.core.Keyword(null,"let","let",-1282412701));
var bindings__$1 = (cljs.core.truth_(widened_tags)?cljs.core.vec(cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic(((function (encl_env,p__45440,is_loop,widened_tags,context,op,vec__45441,seq__45442,first__45443,seq__45442__$1,_,first__45443__$1,seq__45442__$2,bindings,exprs,form){
return (function (p__45452,widened_tag){
var vec__45453 = p__45452;
var name = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__45453,(0),null);
var init = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__45453,(1),null);
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.vary_meta.cljs$core$IFn$_invoke$arity$4(name,cljs.core.assoc,new cljs.core.Keyword(null,"tag","tag",-1290361223),widened_tag),init], null);
});})(encl_env,p__45440,is_loop,widened_tags,context,op,vec__45441,seq__45442,first__45443,seq__45442__$1,_,first__45443__$1,seq__45442__$2,bindings,exprs,form))
,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.partition.cljs$core$IFn$_invoke$arity$2((2),bindings),widened_tags], 0))):bindings);
var vec__45444 = cljs.analyzer.analyze_let_bindings((function (){var G__45456 = encl_env;
if(is_loop === true){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__45456,new cljs.core.Keyword(null,"in-loop","in-loop",-187298246),true);
} else {
return G__45456;
}
})(),bindings__$1,op);
var bes = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__45444,(0),null);
var env = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__45444,(1),null);
var recur_frame = ((is_loop === true)?new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"params","params",710516235),bes,new cljs.core.Keyword(null,"flag","flag",1088647881),cljs.core.atom.cljs$core$IFn$_invoke$arity$1(null),new cljs.core.Keyword(null,"tags","tags",1771418977),cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.mapv.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"tag","tag",-1290361223),bes))], null):null);
var recur_frames = (cljs.core.truth_(recur_frame)?cljs.core.cons(recur_frame,cljs.analyzer._STAR_recur_frames_STAR_):cljs.analyzer._STAR_recur_frames_STAR_);
var loop_lets = ((is_loop === true)?cljs.analyzer._STAR_loop_lets_STAR_:(((!((cljs.analyzer._STAR_loop_lets_STAR_ == null))))?cljs.core.cons(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"params","params",710516235),bes], null),cljs.analyzer._STAR_loop_lets_STAR_):null));
var warn_acc = (cljs.core.truth_((function (){var and__5000__auto__ = is_loop;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.not(widened_tags);
} else {
return and__5000__auto__;
}
})())?cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentVector.EMPTY):null);
var expr = (cljs.core.truth_(warn_acc)?(function (){var _STAR_cljs_warning_handlers_STAR__orig_val__45459 = cljs.analyzer._STAR_cljs_warning_handlers_STAR_;
var _STAR_cljs_warning_handlers_STAR__temp_val__45460 = new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.analyzer.accumulating_warning_handler(warn_acc)], null);
(cljs.analyzer._STAR_cljs_warning_handlers_STAR_ = _STAR_cljs_warning_handlers_STAR__temp_val__45460);

try{return cljs.analyzer.analyze_let_body(env,context,exprs,recur_frames,loop_lets);
}finally {(cljs.analyzer._STAR_cljs_warning_handlers_STAR_ = _STAR_cljs_warning_handlers_STAR__orig_val__45459);
}})():cljs.analyzer.analyze_let_body(env,context,exprs,recur_frames,loop_lets));
var children = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"bindings","bindings",1271397192),new cljs.core.Keyword(null,"body","body",-2049205669)], null);
var nil__GT_any = cljs.core.fnil.cljs$core$IFn$_invoke$arity$2(cljs.core.identity,new cljs.core.Symbol(null,"any","any",-948528346,null));
if(cljs.core.truth_((function (){var and__5000__auto__ = is_loop;
if(cljs.core.truth_(and__5000__auto__)){
return ((cljs.core.not(widened_tags)) && (cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.mapv.cljs$core$IFn$_invoke$arity$2(nil__GT_any,cljs.core.deref(new cljs.core.Keyword(null,"tags","tags",1771418977).cljs$core$IFn$_invoke$arity$1(recur_frame))),cljs.core.mapv.cljs$core$IFn$_invoke$arity$2(cljs.core.comp.cljs$core$IFn$_invoke$arity$2(nil__GT_any,new cljs.core.Keyword(null,"tag","tag",-1290361223)),bes))));
} else {
return and__5000__auto__;
}
})())){
var G__48907 = encl_env;
var G__48908 = form;
var G__48909 = is_loop;
var G__48910 = cljs.core.deref(new cljs.core.Keyword(null,"tags","tags",1771418977).cljs$core$IFn$_invoke$arity$1(recur_frame));
encl_env = G__48907;
p__45440 = G__48908;
is_loop = G__48909;
widened_tags = G__48910;
continue;
} else {
if(cljs.core.truth_(warn_acc)){
cljs.analyzer.replay_accumulated_warnings(warn_acc);
} else {
}

return new cljs.core.PersistentArrayMap(null, 6, [new cljs.core.Keyword(null,"op","op",-1882987955),op,new cljs.core.Keyword(null,"env","env",-1815813235),encl_env,new cljs.core.Keyword(null,"bindings","bindings",1271397192),bes,new cljs.core.Keyword(null,"body","body",-2049205669),cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(expr,new cljs.core.Keyword(null,"body?","body?",-1333761917),true),new cljs.core.Keyword(null,"form","form",-1624062471),form,new cljs.core.Keyword(null,"children","children",-940561982),children], null);
}
break;
}
});
cljs.analyzer.parse.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Symbol(null,"let*","let*",1920721458,null),(function (op,encl_env,form,_,___$1){
return cljs.analyzer.analyze_let(encl_env,form,false,null);
}));
cljs.analyzer.parse.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Symbol(null,"loop*","loop*",615029416,null),(function (op,encl_env,form,_,___$1){
return cljs.analyzer.analyze_let(encl_env,form,true,null);
}));
cljs.analyzer.parse.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Symbol(null,"recur","recur",1202958259,null),(function (op,env,p__45476,_,___$1){
var vec__45478 = p__45476;
var seq__45479 = cljs.core.seq(vec__45478);
var first__45480 = cljs.core.first(seq__45479);
var seq__45479__$1 = cljs.core.next(seq__45479);
var ___$2 = first__45480;
var exprs = seq__45479__$1;
var form = vec__45478;
var context = new cljs.core.Keyword(null,"context","context",-830191113).cljs$core$IFn$_invoke$arity$1(env);
var frame = cljs.core.first(cljs.analyzer._STAR_recur_frames_STAR_);
var add_implicit_target_object_QMARK_ = (function (){var and__5000__auto__ = new cljs.core.Keyword(null,"protocol-impl","protocol-impl",2101328365).cljs$core$IFn$_invoke$arity$1(frame);
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.count(exprs),(cljs.core.count(new cljs.core.Keyword(null,"params","params",710516235).cljs$core$IFn$_invoke$arity$1(frame)) - (1)));
} else {
return and__5000__auto__;
}
})();
var exprs__$1 = (function (){var G__45481 = exprs;
if(cljs.core.truth_(add_implicit_target_object_QMARK_)){
return cljs.core.cons(null,G__45481);
} else {
return G__45481;
}
})();
var exprs__$2 = (function (){var _STAR_recur_frames_STAR__orig_val__45482 = cljs.analyzer._STAR_recur_frames_STAR_;
var _STAR_recur_frames_STAR__temp_val__45483 = cljs.core.cons(null,cljs.analyzer._STAR_recur_frames_STAR_);
(cljs.analyzer._STAR_recur_frames_STAR_ = _STAR_recur_frames_STAR__temp_val__45483);

try{return cljs.core.vec(cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__45475_SHARP_){
var G__45484 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(env,new cljs.core.Keyword(null,"context","context",-830191113),new cljs.core.Keyword(null,"expr","expr",745722291));
var G__45485 = p1__45475_SHARP_;
return (cljs.analyzer.analyze.cljs$core$IFn$_invoke$arity$2 ? cljs.analyzer.analyze.cljs$core$IFn$_invoke$arity$2(G__45484,G__45485) : cljs.analyzer.analyze.call(null,G__45484,G__45485));
}),exprs__$1));
}finally {(cljs.analyzer._STAR_recur_frames_STAR_ = _STAR_recur_frames_STAR__orig_val__45482);
}})();
if(cljs.core.truth_(frame)){
} else {
throw cljs.analyzer.error.cljs$core$IFn$_invoke$arity$2(env,"Can't recur here");
}

if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.count(exprs__$2),cljs.core.count(new cljs.core.Keyword(null,"params","params",710516235).cljs$core$IFn$_invoke$arity$1(frame)))){
} else {
throw cljs.analyzer.error.cljs$core$IFn$_invoke$arity$2(env,["recur argument count mismatch, expected: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.count(new cljs.core.Keyword(null,"params","params",710516235).cljs$core$IFn$_invoke$arity$1(frame)))," args, got: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.count(exprs__$2))].join(''));
}

if(cljs.core.truth_((function (){var and__5000__auto__ = new cljs.core.Keyword(null,"protocol-impl","protocol-impl",2101328365).cljs$core$IFn$_invoke$arity$1(frame);
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.not(add_implicit_target_object_QMARK_);
} else {
return and__5000__auto__;
}
})())){
cljs.analyzer.warning(new cljs.core.Keyword(null,"protocol-impl-recur-with-target","protocol-impl-recur-with-target",-1648321574),env,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"form","form",-1624062471),new cljs.core.Keyword(null,"form","form",-1624062471).cljs$core$IFn$_invoke$arity$1(cljs.core.first(exprs__$2))], null));
} else {
}

cljs.core.reset_BANG_(new cljs.core.Keyword(null,"flag","flag",1088647881).cljs$core$IFn$_invoke$arity$1(frame),true);

cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"tags","tags",1771418977).cljs$core$IFn$_invoke$arity$1(frame),(function (tags){
return cljs.core.mapv.cljs$core$IFn$_invoke$arity$3((function (tag,expr){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"loop","loop",-395552849),new cljs.core.Keyword(null,"local","local",-1497766724).cljs$core$IFn$_invoke$arity$1(expr))){
return new cljs.core.Symbol(null,"any","any",-948528346,null);
} else {
return cljs.analyzer.add_types.cljs$core$IFn$_invoke$arity$2(tag,new cljs.core.Keyword(null,"tag","tag",-1290361223).cljs$core$IFn$_invoke$arity$1(expr));
}
}),tags,exprs__$2);
}));

return cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"env","env",-1815813235),env,new cljs.core.Keyword(null,"op","op",-1882987955),new cljs.core.Keyword(null,"recur","recur",-437573268),new cljs.core.Keyword(null,"form","form",-1624062471),form], null),new cljs.core.Keyword(null,"frame","frame",-1711082588),frame,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"exprs","exprs",1795829094),exprs__$2,new cljs.core.Keyword(null,"children","children",-940561982),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"exprs","exprs",1795829094)], null)], 0));
}));
cljs.analyzer.analyze_const = (function cljs$analyzer$analyze_const(env,form){
var map__45502 = (function (){var G__45503 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(env,new cljs.core.Keyword(null,"quoted?","quoted?",1464649621),true);
var G__45504 = form;
return (cljs.analyzer.analyze.cljs$core$IFn$_invoke$arity$2 ? cljs.analyzer.analyze.cljs$core$IFn$_invoke$arity$2(G__45503,G__45504) : cljs.analyzer.analyze.call(null,G__45503,G__45504));
})();
var map__45502__$1 = cljs.core.__destructure_map(map__45502);
var tag = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__45502__$1,new cljs.core.Keyword(null,"tag","tag",-1290361223));
return new cljs.core.PersistentArrayMap(null, 6, [new cljs.core.Keyword(null,"op","op",-1882987955),new cljs.core.Keyword(null,"const","const",1709929842),new cljs.core.Keyword(null,"env","env",-1815813235),env,new cljs.core.Keyword(null,"literal?","literal?",352485871),true,new cljs.core.Keyword(null,"val","val",128701612),form,new cljs.core.Keyword(null,"tag","tag",-1290361223),tag,new cljs.core.Keyword(null,"form","form",-1624062471),form], null);
});
cljs.analyzer.parse.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Symbol(null,"quote","quote",1377916282,null),(function (_,env,p__45509,___$1,___$2){
var vec__45510 = p__45509;
var ___$3 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__45510,(0),null);
var x = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__45510,(1),null);
var form = vec__45510;
if(cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2((2),cljs.core.count(form))){
throw cljs.analyzer.error.cljs$core$IFn$_invoke$arity$2(env,"Wrong number of args to quote");
} else {
}

var expr = cljs.analyzer.analyze_const(env,x);
return new cljs.core.PersistentArrayMap(null, 6, [new cljs.core.Keyword(null,"op","op",-1882987955),new cljs.core.Keyword(null,"quote","quote",-262615245),new cljs.core.Keyword(null,"expr","expr",745722291),expr,new cljs.core.Keyword(null,"env","env",-1815813235),env,new cljs.core.Keyword(null,"form","form",-1624062471),form,new cljs.core.Keyword(null,"tag","tag",-1290361223),new cljs.core.Keyword(null,"tag","tag",-1290361223).cljs$core$IFn$_invoke$arity$1(expr),new cljs.core.Keyword(null,"children","children",-940561982),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"expr","expr",745722291)], null)], null);
}));
cljs.analyzer.js_prim_ctor__GT_tag = new cljs.core.PersistentArrayMap(null, 6, [new cljs.core.Symbol("js","Object","js/Object",61215323,null),new cljs.core.Symbol(null,"object","object",-1179821820,null),new cljs.core.Symbol("js","String","js/String",-2070054036,null),new cljs.core.Symbol(null,"string","string",-349010059,null),new cljs.core.Symbol("js","Array","js/Array",-423508366,null),new cljs.core.Symbol(null,"array","array",-440182315,null),new cljs.core.Symbol("js","Number","js/Number",-508133572,null),new cljs.core.Symbol(null,"number","number",-1084057331,null),new cljs.core.Symbol("js","Function","js/Function",-749892063,null),new cljs.core.Symbol(null,"function","function",-486723946,null),new cljs.core.Symbol("js","Boolean","js/Boolean",1661145260,null),new cljs.core.Symbol(null,"boolean","boolean",-278886877,null)], null);
/**
 * Test whether a tag is a constructor for a JS primitive
 */
cljs.analyzer.prim_ctor_QMARK_ = (function cljs$analyzer$prim_ctor_QMARK_(t){
return cljs.core.contains_QMARK_(cljs.analyzer.js_prim_ctor__GT_tag,t);
});
cljs.analyzer.parse.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Symbol(null,"new","new",-444906321,null),(function (_,env,p__45526,___$1,___$2){
var vec__45528 = p__45526;
var seq__45529 = cljs.core.seq(vec__45528);
var first__45530 = cljs.core.first(seq__45529);
var seq__45529__$1 = cljs.core.next(seq__45529);
var ___$3 = first__45530;
var first__45530__$1 = cljs.core.first(seq__45529__$1);
var seq__45529__$2 = cljs.core.next(seq__45529__$1);
var ctor = first__45530__$1;
var args = seq__45529__$2;
var form = vec__45528;
var _STAR_recur_frames_STAR__orig_val__45539 = cljs.analyzer._STAR_recur_frames_STAR_;
var _STAR_recur_frames_STAR__temp_val__45540 = cljs.core.cons(null,cljs.analyzer._STAR_recur_frames_STAR_);
(cljs.analyzer._STAR_recur_frames_STAR_ = _STAR_recur_frames_STAR__temp_val__45540);

try{var enve = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(env,new cljs.core.Keyword(null,"context","context",-830191113),new cljs.core.Keyword(null,"expr","expr",745722291));
var ctorexpr = (cljs.analyzer.analyze.cljs$core$IFn$_invoke$arity$2 ? cljs.analyzer.analyze.cljs$core$IFn$_invoke$arity$2(enve,ctor) : cljs.analyzer.analyze.call(null,enve,ctor));
var ctor_var = (cljs.core.truth_((function (){var G__45548 = new cljs.core.Keyword(null,"op","op",-1882987955).cljs$core$IFn$_invoke$arity$1(ctorexpr);
var fexpr__45547 = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"var","var",-769682797),null,new cljs.core.Keyword(null,"js-var","js-var",-1177899142),null,new cljs.core.Keyword(null,"local","local",-1497766724),null], null), null);
return (fexpr__45547.cljs$core$IFn$_invoke$arity$1 ? fexpr__45547.cljs$core$IFn$_invoke$arity$1(G__45548) : fexpr__45547.call(null,G__45548));
})())?cljs.analyzer.resolve_existing_var(env,ctor):null);
var record_args = (cljs.core.truth_((function (){var and__5000__auto__ = new cljs.core.Keyword(null,"record","record",-779106859).cljs$core$IFn$_invoke$arity$1(ctor_var);
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.not(new cljs.core.Keyword(null,"internal-ctor","internal-ctor",937392560).cljs$core$IFn$_invoke$arity$1(cljs.core.meta(ctor)));
} else {
return and__5000__auto__;
}
})())?cljs.core.repeat.cljs$core$IFn$_invoke$arity$2((3),(cljs.analyzer.analyze.cljs$core$IFn$_invoke$arity$2 ? cljs.analyzer.analyze.cljs$core$IFn$_invoke$arity$2(enve,null) : cljs.analyzer.analyze.call(null,enve,null))):null);
var argexprs = cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.vec(cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__45518_SHARP_){
return (cljs.analyzer.analyze.cljs$core$IFn$_invoke$arity$2 ? cljs.analyzer.analyze.cljs$core$IFn$_invoke$arity$2(enve,p1__45518_SHARP_) : cljs.analyzer.analyze.call(null,enve,p1__45518_SHARP_));
}),args)),record_args);
var known_num_fields = new cljs.core.Keyword(null,"num-fields","num-fields",1529154024).cljs$core$IFn$_invoke$arity$1(ctor_var);
var argc = cljs.core.count(args);
if(((cljs.core.not(new cljs.core.Keyword(null,"internal-ctor","internal-ctor",937392560).cljs$core$IFn$_invoke$arity$1(cljs.core.meta(ctor)))) && ((((!((known_num_fields == null)))) && (cljs.core.not((function (){var or__5002__auto__ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(known_num_fields,argc);
if(or__5002__auto__){
return or__5002__auto__;
} else {
var and__5000__auto____$2 = new cljs.core.Keyword(null,"record","record",-779106859).cljs$core$IFn$_invoke$arity$1(ctor_var);
if(cljs.core.truth_(and__5000__auto____$2)){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(((2) + known_num_fields),argc);
} else {
return and__5000__auto____$2;
}
}
})())))))){
cljs.analyzer.warning(new cljs.core.Keyword(null,"fn-arity","fn-arity",-403576501),env,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"argc","argc",-1452839519),argc,new cljs.core.Keyword(null,"ctor","ctor",1750864802),ctor], null));
} else {
}

return new cljs.core.PersistentArrayMap(null, 7, [new cljs.core.Keyword(null,"env","env",-1815813235),env,new cljs.core.Keyword(null,"op","op",-1882987955),new cljs.core.Keyword(null,"new","new",-2085437848),new cljs.core.Keyword(null,"form","form",-1624062471),form,new cljs.core.Keyword(null,"class","class",-2030961996),ctorexpr,new cljs.core.Keyword(null,"args","args",1315556576),argexprs,new cljs.core.Keyword(null,"children","children",-940561982),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.Keyword(null,"args","args",1315556576)], null),new cljs.core.Keyword(null,"tag","tag",-1290361223),(function (){var tag = new cljs.core.Keyword(null,"tag","tag",-1290361223).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"info","info",-317069002).cljs$core$IFn$_invoke$arity$1(ctorexpr));
if(((cljs.analyzer.js_tag_QMARK_(tag)) && ((!(cljs.analyzer.prim_ctor_QMARK_(tag)))))){
return new cljs.core.Symbol(null,"js","js",-886355190,null);
} else {
var name = new cljs.core.Keyword(null,"name","name",1843675177).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"info","info",-317069002).cljs$core$IFn$_invoke$arity$1(ctorexpr));
var or__5002__auto__ = (cljs.analyzer.js_prim_ctor__GT_tag.cljs$core$IFn$_invoke$arity$1 ? cljs.analyzer.js_prim_ctor__GT_tag.cljs$core$IFn$_invoke$arity$1(name) : cljs.analyzer.js_prim_ctor__GT_tag.call(null,name));
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return name;
}
}
})()], null);
}finally {(cljs.analyzer._STAR_recur_frames_STAR_ = _STAR_recur_frames_STAR__orig_val__45539);
}}));
cljs.analyzer.parse.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Symbol(null,"set!","set!",250714521,null),(function (_,env,p__45598,___$1,___$2){
var vec__45599 = p__45598;
var ___$3 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__45599,(0),null);
var target = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__45599,(1),null);
var val = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__45599,(2),null);
var alt = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__45599,(3),null);
var form = vec__45599;
var vec__45603 = ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2((4),cljs.core.count(form)))?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic((new cljs.core.List(null,new cljs.core.Symbol(null,".",".",1975675962,null),null,(1),null)),(new cljs.core.List(null,target,null,(1),null)),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([(new cljs.core.List(null,val,null,(1),null))], 0)))),alt], null):new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [target,val], null));
var target__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__45603,(0),null);
var val__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__45603,(1),null);
var _STAR_recur_frames_STAR__orig_val__45608 = cljs.analyzer._STAR_recur_frames_STAR_;
var _STAR_recur_frames_STAR__temp_val__45609 = cljs.core.cons(null,cljs.analyzer._STAR_recur_frames_STAR_);
(cljs.analyzer._STAR_recur_frames_STAR_ = _STAR_recur_frames_STAR__temp_val__45609);

try{var _STAR_private_var_access_nowarn_STAR__orig_val__45611 = cljs.analyzer._STAR_private_var_access_nowarn_STAR_;
var _STAR_private_var_access_nowarn_STAR__temp_val__45612 = true;
(cljs.analyzer._STAR_private_var_access_nowarn_STAR_ = _STAR_private_var_access_nowarn_STAR__temp_val__45612);

try{var enve = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(env,new cljs.core.Keyword(null,"context","context",-830191113),new cljs.core.Keyword(null,"expr","expr",745722291));
var texpr = (((target__$1 instanceof cljs.core.Symbol))?(function (){
if(((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(target__$1,new cljs.core.Symbol(null,"*unchecked-if*","*unchecked-if*",1542408350,null))) && (((val__$1 === true) || (val__$1 === false))))){
} else {
if(((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(target__$1,new cljs.core.Symbol(null,"*unchecked-arrays*","*unchecked-arrays*",-381849911,null))) && (((val__$1 === true) || (val__$1 === false))))){
} else {
if(((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(target__$1,new cljs.core.Symbol(null,"*warn-on-infer*","*warn-on-infer*",1890277318,null))) && (((val__$1 === true) || (val__$1 === false))))){
(cljs.analyzer._STAR_cljs_warnings_STAR_ = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(cljs.analyzer._STAR_cljs_warnings_STAR_,new cljs.core.Keyword(null,"infer-warning","infer-warning",-1600671410),val__$1));
} else {
}
}
}

if((!((new cljs.core.Keyword(null,"const","const",1709929842).cljs$core$IFn$_invoke$arity$1(cljs.analyzer.resolve_var.cljs$core$IFn$_invoke$arity$2(cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(env,new cljs.core.Keyword(null,"locals","locals",535295783)),target__$1)) == null)))){
throw cljs.analyzer.error.cljs$core$IFn$_invoke$arity$2(env,"Can't set! a constant");
} else {
}

var local_48941 = cljs.analyzer.handle_symbol_local(target__$1,(function (){var G__45618 = new cljs.core.Keyword(null,"locals","locals",535295783).cljs$core$IFn$_invoke$arity$1(env);
return (target__$1.cljs$core$IFn$_invoke$arity$1 ? target__$1.cljs$core$IFn$_invoke$arity$1(G__45618) : target__$1.call(null,G__45618));
})());
if(cljs.core.truth_((function (){var or__5002__auto__ = (local_48941 == null);
if(or__5002__auto__){
return or__5002__auto__;
} else {
var and__5000__auto__ = new cljs.core.Keyword(null,"field","field",-1302436500).cljs$core$IFn$_invoke$arity$1(local_48941);
if(cljs.core.truth_(and__5000__auto__)){
var or__5002__auto____$1 = new cljs.core.Keyword(null,"mutable","mutable",875778266).cljs$core$IFn$_invoke$arity$1(local_48941);
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
var or__5002__auto____$2 = new cljs.core.Keyword(null,"unsynchronized-mutable","unsynchronized-mutable",-164143950).cljs$core$IFn$_invoke$arity$1(local_48941);
if(cljs.core.truth_(or__5002__auto____$2)){
return or__5002__auto____$2;
} else {
return new cljs.core.Keyword(null,"volatile-mutable","volatile-mutable",1731728411).cljs$core$IFn$_invoke$arity$1(local_48941);
}
}
} else {
return and__5000__auto__;
}
}
})())){
} else {
throw cljs.analyzer.error.cljs$core$IFn$_invoke$arity$2(env,"Can't set! local var or non-mutable field");
}

return (cljs.analyzer.analyze_symbol.cljs$core$IFn$_invoke$arity$2 ? cljs.analyzer.analyze_symbol.cljs$core$IFn$_invoke$arity$2(enve,target__$1) : cljs.analyzer.analyze_symbol.call(null,enve,target__$1));
})()
:((cljs.core.seq_QMARK_(target__$1))?(function (){var texpr = (cljs.core.truth_(new cljs.core.Keyword(null,"extend-type","extend-type",-517175606).cljs$core$IFn$_invoke$arity$1(cljs.core.meta(target__$1)))?(function (){var _STAR_cljs_warnings_STAR__orig_val__45642 = cljs.analyzer._STAR_cljs_warnings_STAR_;
var _STAR_cljs_warnings_STAR__temp_val__45643 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(cljs.analyzer._STAR_cljs_warnings_STAR_,new cljs.core.Keyword(null,"infer-warning","infer-warning",-1600671410),false);
(cljs.analyzer._STAR_cljs_warnings_STAR_ = _STAR_cljs_warnings_STAR__temp_val__45643);

try{return (cljs.analyzer.analyze_seq.cljs$core$IFn$_invoke$arity$3 ? cljs.analyzer.analyze_seq.cljs$core$IFn$_invoke$arity$3(enve,target__$1,null) : cljs.analyzer.analyze_seq.call(null,enve,target__$1,null));
}finally {(cljs.analyzer._STAR_cljs_warnings_STAR_ = _STAR_cljs_warnings_STAR__orig_val__45642);
}})():(cljs.analyzer.analyze_seq.cljs$core$IFn$_invoke$arity$3 ? cljs.analyzer.analyze_seq.cljs$core$IFn$_invoke$arity$3(enve,target__$1,null) : cljs.analyzer.analyze_seq.call(null,enve,target__$1,null)));
if(cljs.core.truth_(new cljs.core.Keyword(null,"field","field",-1302436500).cljs$core$IFn$_invoke$arity$1(texpr))){
return texpr;
} else {
return null;
}
})():null)
);
var vexpr = (cljs.analyzer.analyze.cljs$core$IFn$_invoke$arity$2 ? cljs.analyzer.analyze.cljs$core$IFn$_invoke$arity$2(enve,val__$1) : cljs.analyzer.analyze.call(null,enve,val__$1));
if(cljs.core.seq_QMARK_(target__$1)){
var sym_48946 = (function (){var G__45653 = target__$1;
if((G__45653 == null)){
return null;
} else {
return cljs.core.second(G__45653);
}
})();
var meta_48947 = cljs.core.meta(sym_48946);
var temp__5804__auto___48948 = (function (){var and__5000__auto__ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"fn","fn",-1175266204),new cljs.core.Keyword(null,"op","op",-1882987955).cljs$core$IFn$_invoke$arity$1(vexpr));
if(and__5000__auto__){
return new cljs.core.Keyword(null,"top-fn","top-fn",-2056129173).cljs$core$IFn$_invoke$arity$1(meta_48947);
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5804__auto___48948)){
var info_48951 = temp__5804__auto___48948;
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$variadic(cljs.env._STAR_compiler_STAR_,cljs.core.update_in,new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("cljs.analyzer","namespaces","cljs.analyzer/namespaces",-260788927),new cljs.core.Keyword(null,"name","name",1843675177).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"ns","ns",441598760).cljs$core$IFn$_invoke$arity$1(env)),new cljs.core.Keyword(null,"defs","defs",1398449717),sym_48946,new cljs.core.Keyword(null,"methods","methods",453930866)], null),cljs.core.fnil.cljs$core$IFn$_invoke$arity$2(cljs.core.conj,cljs.core.PersistentVector.EMPTY),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.select_keys(info_48951,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"fixed-arity","fixed-arity",1586445869),new cljs.core.Keyword(null,"variadic?","variadic?",584179762)], null)),cljs.core.select_keys(cljs.core.first(new cljs.core.Keyword(null,"methods","methods",453930866).cljs$core$IFn$_invoke$arity$1(vexpr)),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"tag","tag",-1290361223)], null))], 0))], 0));
} else {
}
} else {
}

if(cljs.core.truth_(texpr)){
} else {
throw cljs.analyzer.error.cljs$core$IFn$_invoke$arity$2(env,"set! target must be a field or a symbol naming a var");
}

if(((cljs.core.not(new cljs.core.Keyword(null,"def-emits-var","def-emits-var",-1551927320).cljs$core$IFn$_invoke$arity$1(env))) && ((!(((function (){var fexpr__45673 = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Symbol(null,"*warn-on-infer*","*warn-on-infer*",1890277318,null),"null",new cljs.core.Symbol(null,"*unchecked-arrays*","*unchecked-arrays*",-381849911,null),"null",new cljs.core.Symbol(null,"*unchecked-if*","*unchecked-if*",1542408350,null),"null"], null), null);
return (fexpr__45673.cljs$core$IFn$_invoke$arity$1 ? fexpr__45673.cljs$core$IFn$_invoke$arity$1(target__$1) : fexpr__45673.call(null,target__$1));
})() == null)))))){
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"env","env",-1815813235),env,new cljs.core.Keyword(null,"op","op",-1882987955),new cljs.core.Keyword(null,"no-op","no-op",-93046065)], null);
} else {
return new cljs.core.PersistentArrayMap(null, 6, [new cljs.core.Keyword(null,"env","env",-1815813235),env,new cljs.core.Keyword(null,"op","op",-1882987955),new cljs.core.Keyword(null,"set!","set!",-1389817006),new cljs.core.Keyword(null,"form","form",-1624062471),form,new cljs.core.Keyword(null,"target","target",253001721),texpr,new cljs.core.Keyword(null,"val","val",128701612),vexpr,new cljs.core.Keyword(null,"children","children",-940561982),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"target","target",253001721),new cljs.core.Keyword(null,"val","val",128701612)], null)], null);

}
}finally {(cljs.analyzer._STAR_private_var_access_nowarn_STAR_ = _STAR_private_var_access_nowarn_STAR__orig_val__45611);
}}finally {(cljs.analyzer._STAR_recur_frames_STAR_ = _STAR_recur_frames_STAR__orig_val__45608);
}}));
cljs.analyzer.foreign_dep_QMARK_ = (function cljs$analyzer$foreign_dep_QMARK_(dep){
var js_index = new cljs.core.Keyword(null,"js-dependency-index","js-dependency-index",-1887042131).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(cljs.env._STAR_compiler_STAR_));
var temp__5806__auto__ = cljs.core.find(js_index,cljs.core.name(cljs.core.first(cljs.analyzer.lib_AMPERSAND_sublib(dep))));
if((temp__5806__auto__ == null)){
return false;
} else {
var vec__45683 = temp__5806__auto__;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__45683,(0),null);
var map__45686 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__45683,(1),null);
var map__45686__$1 = cljs.core.__destructure_map(map__45686);
var foreign = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__45686__$1,new cljs.core.Keyword(null,"foreign","foreign",990521149));
return foreign;
}
});
/**
 * Given a lib, a namespace, deps, its dependencies, env, an analysis environment
 * and opts, compiler options - analyze all of the dependencies. Required to
 * correctly analyze usage of other namespaces.
 */
cljs.analyzer.analyze_deps = (function cljs$analyzer$analyze_deps(var_args){
var G__45696 = arguments.length;
switch (G__45696) {
case 3:
return cljs.analyzer.analyze_deps.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
case 4:
return cljs.analyzer.analyze_deps.cljs$core$IFn$_invoke$arity$4((arguments[(0)]),(arguments[(1)]),(arguments[(2)]),(arguments[(3)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(cljs.analyzer.analyze_deps.cljs$core$IFn$_invoke$arity$3 = (function (lib,deps,env){
return cljs.analyzer.analyze_deps.cljs$core$IFn$_invoke$arity$4(lib,deps,env,(cljs.core.truth_(cljs.env._STAR_compiler_STAR_)?new cljs.core.Keyword(null,"options","options",99638489).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(cljs.env._STAR_compiler_STAR_)):null));
}));

(cljs.analyzer.analyze_deps.cljs$core$IFn$_invoke$arity$4 = (function (lib,deps,env,opts){
var compiler = cljs.core.deref(cljs.env._STAR_compiler_STAR_);
var _STAR_cljs_dep_set_STAR__orig_val__45700 = cljs.analyzer._STAR_cljs_dep_set_STAR_;
var _STAR_cljs_dep_set_STAR__temp_val__45701 = cljs.core.vary_meta.cljs$core$IFn$_invoke$arity$5(cljs.core.conj.cljs$core$IFn$_invoke$arity$2(cljs.analyzer._STAR_cljs_dep_set_STAR_,lib),cljs.core.update_in,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"dep-path","dep-path",723826558)], null),cljs.core.conj,lib);
(cljs.analyzer._STAR_cljs_dep_set_STAR_ = _STAR_cljs_dep_set_STAR__temp_val__45701);

try{if(cljs.core.every_QMARK_((function (p1__45690_SHARP_){
return (!(cljs.core.contains_QMARK_(cljs.analyzer._STAR_cljs_dep_set_STAR_,p1__45690_SHARP_)));
}),deps)){
} else {
throw (new Error(["Assert failed: ",["Circular dependency detected, ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core.str,cljs.core.interpose.cljs$core$IFn$_invoke$arity$2(" -> ",cljs.core.conj.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"dep-path","dep-path",723826558).cljs$core$IFn$_invoke$arity$1(cljs.core.meta(cljs.analyzer._STAR_cljs_dep_set_STAR_)),cljs.core.some(cljs.analyzer._STAR_cljs_dep_set_STAR_,deps)))))].join(''),"\n","(every? (fn* [p1__45690#] (not (contains? *cljs-dep-set* p1__45690#))) deps)"].join('')));
}

var seq__45708 = cljs.core.seq(deps);
var chunk__45709 = null;
var count__45710 = (0);
var i__45711 = (0);
while(true){
if((i__45711 < count__45710)){
var dep = chunk__45709.cljs$core$IIndexed$_nth$arity$2(null,i__45711);
if(cljs.core.truth_((function (){var or__5002__auto__ = (!((cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(compiler,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("cljs.analyzer","namespaces","cljs.analyzer/namespaces",-260788927),dep,new cljs.core.Keyword(null,"defs","defs",1398449717)], null)) == null)));
if(or__5002__auto__){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = cljs.analyzer.node_module_dep_QMARK_(dep);
if(or__5002__auto____$1){
return or__5002__auto____$1;
} else {
return cljs.analyzer.js_module_exists_QMARK_(cljs.core.name(dep));
}
}
})())){
} else {
var idx_48970 = new cljs.core.Keyword(null,"js-dependency-index","js-dependency-index",-1887042131).cljs$core$IFn$_invoke$arity$1(compiler);
var dep_48971__$1 = cljs.core.first(cljs.analyzer.lib_AMPERSAND_sublib(dep));
if(cljs.core.contains_QMARK_(idx_48970,cljs.core.name(dep_48971__$1))){
var dep_name_48972 = cljs.core.name(dep_48971__$1);
if(clojure.string.starts_with_QMARK_(dep_name_48972,"goog.")){
} else {
}
} else {
throw cljs.analyzer.error.cljs$core$IFn$_invoke$arity$2(env,cljs.analyzer.error_message.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"undeclared-ns","undeclared-ns",-1589012812),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"ns-sym","ns-sym",-1696101605),dep_48971__$1,new cljs.core.Keyword(null,"js-provide","js-provide",1052912493),cljs.core.name(dep_48971__$1)], null)));
}
}


var G__48973 = seq__45708;
var G__48974 = chunk__45709;
var G__48975 = count__45710;
var G__48976 = (i__45711 + (1));
seq__45708 = G__48973;
chunk__45709 = G__48974;
count__45710 = G__48975;
i__45711 = G__48976;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__45708);
if(temp__5804__auto__){
var seq__45708__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__45708__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__45708__$1);
var G__48977 = cljs.core.chunk_rest(seq__45708__$1);
var G__48978 = c__5525__auto__;
var G__48979 = cljs.core.count(c__5525__auto__);
var G__48980 = (0);
seq__45708 = G__48977;
chunk__45709 = G__48978;
count__45710 = G__48979;
i__45711 = G__48980;
continue;
} else {
var dep = cljs.core.first(seq__45708__$1);
if(cljs.core.truth_((function (){var or__5002__auto__ = (!((cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(compiler,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("cljs.analyzer","namespaces","cljs.analyzer/namespaces",-260788927),dep,new cljs.core.Keyword(null,"defs","defs",1398449717)], null)) == null)));
if(or__5002__auto__){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = cljs.analyzer.node_module_dep_QMARK_(dep);
if(or__5002__auto____$1){
return or__5002__auto____$1;
} else {
return cljs.analyzer.js_module_exists_QMARK_(cljs.core.name(dep));
}
}
})())){
} else {
var idx_48981 = new cljs.core.Keyword(null,"js-dependency-index","js-dependency-index",-1887042131).cljs$core$IFn$_invoke$arity$1(compiler);
var dep_48982__$1 = cljs.core.first(cljs.analyzer.lib_AMPERSAND_sublib(dep));
if(cljs.core.contains_QMARK_(idx_48981,cljs.core.name(dep_48982__$1))){
var dep_name_48983 = cljs.core.name(dep_48982__$1);
if(clojure.string.starts_with_QMARK_(dep_name_48983,"goog.")){
} else {
}
} else {
throw cljs.analyzer.error.cljs$core$IFn$_invoke$arity$2(env,cljs.analyzer.error_message.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"undeclared-ns","undeclared-ns",-1589012812),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"ns-sym","ns-sym",-1696101605),dep_48982__$1,new cljs.core.Keyword(null,"js-provide","js-provide",1052912493),cljs.core.name(dep_48982__$1)], null)));
}
}


var G__48985 = cljs.core.next(seq__45708__$1);
var G__48986 = null;
var G__48987 = (0);
var G__48988 = (0);
seq__45708 = G__48985;
chunk__45709 = G__48986;
count__45710 = G__48987;
i__45711 = G__48988;
continue;
}
} else {
return null;
}
}
break;
}
}finally {(cljs.analyzer._STAR_cljs_dep_set_STAR_ = _STAR_cljs_dep_set_STAR__orig_val__45700);
}}));

(cljs.analyzer.analyze_deps.cljs$lang$maxFixedArity = 4);

cljs.analyzer.missing_use_QMARK_ = (function cljs$analyzer$missing_use_QMARK_(lib,sym,cenv){
var js_lib = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(cenv,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"js-dependency-index","js-dependency-index",-1887042131),cljs.core.name(lib)], null));
return ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.get_in.cljs$core$IFn$_invoke$arity$3(cenv,new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("cljs.analyzer","namespaces","cljs.analyzer/namespaces",-260788927),lib,new cljs.core.Keyword(null,"defs","defs",1398449717),sym], null),new cljs.core.Keyword("cljs.analyzer","not-found","cljs.analyzer/not-found",427220150)),new cljs.core.Keyword("cljs.analyzer","not-found","cljs.analyzer/not-found",427220150))) && ((((!(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.get.cljs$core$IFn$_invoke$arity$2(js_lib,new cljs.core.Keyword(null,"group","group",582596132)),new cljs.core.Keyword(null,"goog","goog",-1711135452))))) && (((cljs.core.not(cljs.core.get.cljs$core$IFn$_invoke$arity$2(js_lib,new cljs.core.Keyword(null,"closure-lib","closure-lib",2105917916)))) && ((((!(cljs.analyzer.node_module_dep_QMARK_(lib)))) && ((!(cljs.analyzer.dep_has_global_exports_QMARK_(lib)))))))))));
});
cljs.analyzer.missing_rename_QMARK_ = (function cljs$analyzer$missing_rename_QMARK_(sym,cenv){
var lib = cljs.core.symbol.cljs$core$IFn$_invoke$arity$1(cljs.core.namespace(sym));
var sym__$1 = cljs.core.symbol.cljs$core$IFn$_invoke$arity$1(cljs.core.name(sym));
return cljs.analyzer.missing_use_QMARK_(lib,sym__$1,cenv);
});
cljs.analyzer.missing_use_macro_QMARK_ = (function cljs$analyzer$missing_use_macro_QMARK_(lib,sym){
if((lib instanceof cljs.core.Symbol)){
var the_ns = cljs.core.find_macros_ns(lib);
return (((the_ns == null)) || ((the_ns.findInternedVar(sym) == null)));
} else {
return null;
}
});
cljs.analyzer.missing_rename_macro_QMARK_ = (function cljs$analyzer$missing_rename_macro_QMARK_(sym){
var lib = cljs.core.symbol.cljs$core$IFn$_invoke$arity$1(cljs.core.namespace(sym));
var sym__$1 = cljs.core.symbol.cljs$core$IFn$_invoke$arity$1(cljs.core.name(sym));
var the_ns = cljs.core.find_macros_ns(lib);
return (((the_ns == null)) || ((the_ns.findInternedVar(sym__$1) == null)));
});
cljs.analyzer.missing_uses = (function cljs$analyzer$missing_uses(uses,env){
var cenv = cljs.core.deref(cljs.env._STAR_compiler_STAR_);
return cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (p__45770){
var vec__45771 = p__45770;
var sym = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__45771,(0),null);
var lib = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__45771,(1),null);
return cljs.analyzer.missing_use_QMARK_(lib,sym,cenv);
}),uses));
});
cljs.analyzer.missing_renames = (function cljs$analyzer$missing_renames(renames,env){
var cenv = cljs.core.deref(cljs.env._STAR_compiler_STAR_);
return cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (p__45777){
var vec__45778 = p__45777;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__45778,(0),null);
var qualified_sym = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__45778,(1),null);
return cljs.analyzer.missing_rename_QMARK_(qualified_sym,cenv);
}),renames));
});
cljs.analyzer.missing_use_macros = (function cljs$analyzer$missing_use_macros(use_macros,env){
var cenv = cljs.core.deref(cljs.env._STAR_compiler_STAR_);
return cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (p__45784){
var vec__45785 = p__45784;
var sym = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__45785,(0),null);
var lib = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__45785,(1),null);
return cljs.analyzer.missing_use_macro_QMARK_(lib,sym);
}),use_macros));
});
cljs.analyzer.inferred_use_macros = (function cljs$analyzer$inferred_use_macros(use_macros,env){
var cenv = cljs.core.deref(cljs.env._STAR_compiler_STAR_);
return cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (p__45794){
var vec__45795 = p__45794;
var sym = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__45795,(0),null);
var lib = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__45795,(1),null);
return cljs.core.not(cljs.analyzer.missing_use_macro_QMARK_(lib,sym));
}),use_macros));
});
cljs.analyzer.inferred_rename_macros = (function cljs$analyzer$inferred_rename_macros(rename_macros,env){
return cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (p__45801){
var vec__45802 = p__45801;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__45802,(0),null);
var qualified_sym = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__45802,(1),null);
return (!(cljs.analyzer.missing_rename_macro_QMARK_(qualified_sym)));
}),rename_macros));
});
cljs.analyzer.check_uses = (function cljs$analyzer$check_uses(uses,env){
var cenv = cljs.core.deref(cljs.env._STAR_compiler_STAR_);
var seq__45810 = cljs.core.seq(uses);
var chunk__45811 = null;
var count__45812 = (0);
var i__45813 = (0);
while(true){
if((i__45813 < count__45812)){
var vec__45821 = chunk__45811.cljs$core$IIndexed$_nth$arity$2(null,i__45813);
var sym = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__45821,(0),null);
var lib = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__45821,(1),null);
if(cljs.analyzer.missing_use_QMARK_(lib,sym,cenv)){
throw cljs.analyzer.error.cljs$core$IFn$_invoke$arity$2(env,cljs.analyzer.error_message.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"undeclared-ns-form","undeclared-ns-form",-248024137),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"type","type",1174270348),"var",new cljs.core.Keyword(null,"lib","lib",191808726),lib,new cljs.core.Keyword(null,"sym","sym",-1444860305),sym], null)));
} else {
}


var G__49013 = seq__45810;
var G__49014 = chunk__45811;
var G__49015 = count__45812;
var G__49016 = (i__45813 + (1));
seq__45810 = G__49013;
chunk__45811 = G__49014;
count__45812 = G__49015;
i__45813 = G__49016;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__45810);
if(temp__5804__auto__){
var seq__45810__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__45810__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__45810__$1);
var G__49018 = cljs.core.chunk_rest(seq__45810__$1);
var G__49019 = c__5525__auto__;
var G__49020 = cljs.core.count(c__5525__auto__);
var G__49021 = (0);
seq__45810 = G__49018;
chunk__45811 = G__49019;
count__45812 = G__49020;
i__45813 = G__49021;
continue;
} else {
var vec__45826 = cljs.core.first(seq__45810__$1);
var sym = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__45826,(0),null);
var lib = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__45826,(1),null);
if(cljs.analyzer.missing_use_QMARK_(lib,sym,cenv)){
throw cljs.analyzer.error.cljs$core$IFn$_invoke$arity$2(env,cljs.analyzer.error_message.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"undeclared-ns-form","undeclared-ns-form",-248024137),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"type","type",1174270348),"var",new cljs.core.Keyword(null,"lib","lib",191808726),lib,new cljs.core.Keyword(null,"sym","sym",-1444860305),sym], null)));
} else {
}


var G__49022 = cljs.core.next(seq__45810__$1);
var G__49023 = null;
var G__49024 = (0);
var G__49025 = (0);
seq__45810 = G__49022;
chunk__45811 = G__49023;
count__45812 = G__49024;
i__45813 = G__49025;
continue;
}
} else {
return null;
}
}
break;
}
});
cljs.analyzer.check_use_macros = (function cljs$analyzer$check_use_macros(var_args){
var G__45832 = arguments.length;
switch (G__45832) {
case 2:
return cljs.analyzer.check_use_macros.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return cljs.analyzer.check_use_macros.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(cljs.analyzer.check_use_macros.cljs$core$IFn$_invoke$arity$2 = (function (use_macros,env){
return cljs.analyzer.check_use_macros.cljs$core$IFn$_invoke$arity$3(use_macros,null,env);
}));

(cljs.analyzer.check_use_macros.cljs$core$IFn$_invoke$arity$3 = (function (use_macros,missing_uses,env){
var cenv = cljs.core.deref(cljs.env._STAR_compiler_STAR_);
var seq__45835_49027 = cljs.core.seq(use_macros);
var chunk__45836_49028 = null;
var count__45837_49029 = (0);
var i__45838_49030 = (0);
while(true){
if((i__45838_49030 < count__45837_49029)){
var vec__45849_49031 = chunk__45836_49028.cljs$core$IIndexed$_nth$arity$2(null,i__45838_49030);
var sym_49032 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__45849_49031,(0),null);
var lib_49033 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__45849_49031,(1),null);
if(cljs.core.truth_(cljs.analyzer.missing_use_macro_QMARK_(lib_49033,sym_49032))){
throw cljs.analyzer.error.cljs$core$IFn$_invoke$arity$2(env,cljs.analyzer.error_message.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"undeclared-ns-form","undeclared-ns-form",-248024137),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"type","type",1174270348),"macro",new cljs.core.Keyword(null,"lib","lib",191808726),lib_49033,new cljs.core.Keyword(null,"sym","sym",-1444860305),sym_49032], null)));
} else {
}


var G__49034 = seq__45835_49027;
var G__49035 = chunk__45836_49028;
var G__49036 = count__45837_49029;
var G__49037 = (i__45838_49030 + (1));
seq__45835_49027 = G__49034;
chunk__45836_49028 = G__49035;
count__45837_49029 = G__49036;
i__45838_49030 = G__49037;
continue;
} else {
var temp__5804__auto___49038 = cljs.core.seq(seq__45835_49027);
if(temp__5804__auto___49038){
var seq__45835_49039__$1 = temp__5804__auto___49038;
if(cljs.core.chunked_seq_QMARK_(seq__45835_49039__$1)){
var c__5525__auto___49040 = cljs.core.chunk_first(seq__45835_49039__$1);
var G__49041 = cljs.core.chunk_rest(seq__45835_49039__$1);
var G__49042 = c__5525__auto___49040;
var G__49043 = cljs.core.count(c__5525__auto___49040);
var G__49044 = (0);
seq__45835_49027 = G__49041;
chunk__45836_49028 = G__49042;
count__45837_49029 = G__49043;
i__45838_49030 = G__49044;
continue;
} else {
var vec__45852_49045 = cljs.core.first(seq__45835_49039__$1);
var sym_49046 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__45852_49045,(0),null);
var lib_49047 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__45852_49045,(1),null);
if(cljs.core.truth_(cljs.analyzer.missing_use_macro_QMARK_(lib_49047,sym_49046))){
throw cljs.analyzer.error.cljs$core$IFn$_invoke$arity$2(env,cljs.analyzer.error_message.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"undeclared-ns-form","undeclared-ns-form",-248024137),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"type","type",1174270348),"macro",new cljs.core.Keyword(null,"lib","lib",191808726),lib_49047,new cljs.core.Keyword(null,"sym","sym",-1444860305),sym_49046], null)));
} else {
}


var G__49048 = cljs.core.next(seq__45835_49039__$1);
var G__49049 = null;
var G__49050 = (0);
var G__49051 = (0);
seq__45835_49027 = G__49048;
chunk__45836_49028 = G__49049;
count__45837_49029 = G__49050;
i__45838_49030 = G__49051;
continue;
}
} else {
}
}
break;
}

cljs.analyzer.check_uses(cljs.analyzer.missing_use_macros(missing_uses,env),env);

return cljs.analyzer.inferred_use_macros(missing_uses,env);
}));

(cljs.analyzer.check_use_macros.cljs$lang$maxFixedArity = 3);

cljs.analyzer.check_use_macros_inferring_missing = (function cljs$analyzer$check_use_macros_inferring_missing(p__45859,env){
var map__45861 = p__45859;
var map__45861__$1 = cljs.core.__destructure_map(map__45861);
var ast = map__45861__$1;
var name = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__45861__$1,new cljs.core.Keyword(null,"name","name",1843675177));
var uses = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__45861__$1,new cljs.core.Keyword(null,"uses","uses",232664692));
var use_macros = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__45861__$1,new cljs.core.Keyword(null,"use-macros","use-macros",-905638393));
var missing_uses = (cljs.core.truth_((function (){var and__5000__auto__ = cljs.analyzer._STAR_analyze_deps_STAR_;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.seq(uses);
} else {
return and__5000__auto__;
}
})())?cljs.analyzer.missing_uses(uses,env):null);
var maybe_macros = cljs.core.apply.cljs$core$IFn$_invoke$arity$3(cljs.core.dissoc,uses,cljs.core.keys(missing_uses));
var remove_missing_uses = (function (p1__45855_SHARP_){
return cljs.core.apply.cljs$core$IFn$_invoke$arity$3(cljs.core.dissoc,p1__45855_SHARP_,cljs.core.keys(missing_uses));
});
var ast_SINGLEQUOTE_ = cljs.core.update_in.cljs$core$IFn$_invoke$arity$3(cljs.core.update_in.cljs$core$IFn$_invoke$arity$3(ast,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"use-macros","use-macros",-905638393)], null),(function (p1__45856_SHARP_){
return cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([p1__45856_SHARP_,cljs.analyzer.check_use_macros.cljs$core$IFn$_invoke$arity$3(use_macros,missing_uses,env)], 0)),cljs.analyzer.inferred_use_macros(maybe_macros,env)], 0));
})),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"uses","uses",232664692)], null),remove_missing_uses);
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$2(cljs.env._STAR_compiler_STAR_,(function (p1__45857_SHARP_){
return cljs.core.update_in.cljs$core$IFn$_invoke$arity$3(cljs.core.update_in.cljs$core$IFn$_invoke$arity$4(p1__45857_SHARP_,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("cljs.analyzer","namespaces","cljs.analyzer/namespaces",-260788927),name,new cljs.core.Keyword(null,"use-macros","use-macros",-905638393)], null),cljs.core.merge,new cljs.core.Keyword(null,"use-macros","use-macros",-905638393).cljs$core$IFn$_invoke$arity$1(ast_SINGLEQUOTE_)),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("cljs.analyzer","namespaces","cljs.analyzer/namespaces",-260788927),name,new cljs.core.Keyword(null,"uses","uses",232664692)], null),remove_missing_uses);
}));

return ast_SINGLEQUOTE_;
});
cljs.analyzer.check_rename_macros_inferring_missing = (function cljs$analyzer$check_rename_macros_inferring_missing(p__45890,env){
var map__45895 = p__45890;
var map__45895__$1 = cljs.core.__destructure_map(map__45895);
var ast = map__45895__$1;
var name = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__45895__$1,new cljs.core.Keyword(null,"name","name",1843675177));
var renames = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__45895__$1,new cljs.core.Keyword(null,"renames","renames",343278368));
var missing_renames = (cljs.core.truth_((function (){var and__5000__auto__ = cljs.analyzer._STAR_analyze_deps_STAR_;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.seq(renames);
} else {
return and__5000__auto__;
}
})())?cljs.analyzer.missing_renames(renames,env):null);
var maybe_macros = cljs.core.apply.cljs$core$IFn$_invoke$arity$3(cljs.core.dissoc,renames,cljs.core.keys(missing_renames));
var missing_rename_macros = cljs.analyzer.inferred_rename_macros(missing_renames,env);
var remove_missing_renames = (function (p1__45881_SHARP_){
return cljs.core.apply.cljs$core$IFn$_invoke$arity$3(cljs.core.dissoc,p1__45881_SHARP_,cljs.core.keys(missing_renames));
});
var ast_SINGLEQUOTE_ = cljs.core.update_in.cljs$core$IFn$_invoke$arity$3(cljs.core.update_in.cljs$core$IFn$_invoke$arity$3(ast,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"rename-macros","rename-macros",1076432512)], null),(function (p1__45882_SHARP_){
return cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([p1__45882_SHARP_,missing_rename_macros], 0)),cljs.analyzer.inferred_rename_macros(maybe_macros,env)], 0));
})),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"renames","renames",343278368)], null),remove_missing_renames);
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$2(cljs.env._STAR_compiler_STAR_,(function (p1__45883_SHARP_){
return cljs.core.update_in.cljs$core$IFn$_invoke$arity$3(cljs.core.update_in.cljs$core$IFn$_invoke$arity$4(p1__45883_SHARP_,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("cljs.analyzer","namespaces","cljs.analyzer/namespaces",-260788927),name,new cljs.core.Keyword(null,"rename-macros","rename-macros",1076432512)], null),cljs.core.merge,new cljs.core.Keyword(null,"rename-macros","rename-macros",1076432512).cljs$core$IFn$_invoke$arity$1(ast_SINGLEQUOTE_)),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("cljs.analyzer","namespaces","cljs.analyzer/namespaces",-260788927),name,new cljs.core.Keyword(null,"renames","renames",343278368)], null),remove_missing_renames);
}));

return ast_SINGLEQUOTE_;
});
cljs.analyzer.parse_ns_error_msg = (function cljs$analyzer$parse_ns_error_msg(spec,msg){
return [cljs.core.str.cljs$core$IFn$_invoke$arity$1(msg),"; offending spec: ",cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([spec], 0))].join('');
});
cljs.analyzer.basic_validate_ns_spec = (function cljs$analyzer$basic_validate_ns_spec(env,macros_QMARK_,spec){
if((((spec instanceof cljs.core.Symbol)) || (((typeof spec === 'string') || (cljs.core.sequential_QMARK_(spec)))))){
} else {
throw cljs.analyzer.error.cljs$core$IFn$_invoke$arity$2(env,cljs.analyzer.parse_ns_error_msg(spec,"Only [lib.ns & options] and lib.ns specs supported in :require / :require-macros"));
}

if(cljs.core.sequential_QMARK_(spec)){
if((((cljs.core.first(spec) instanceof cljs.core.Symbol)) || (typeof cljs.core.first(spec) === 'string'))){
} else {
throw cljs.analyzer.error.cljs$core$IFn$_invoke$arity$2(env,cljs.analyzer.parse_ns_error_msg(spec,"Library name must be specified as a symbol in :require / :require-macros"));
}

if(cljs.core.odd_QMARK_(cljs.core.count(spec))){
} else {
throw cljs.analyzer.error.cljs$core$IFn$_invoke$arity$2(env,cljs.analyzer.parse_ns_error_msg(spec,"Only :as alias, :refer (names) and :rename {from to} options supported in :require"));
}

if(cljs.core.every_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"as","as",1148689641),null,new cljs.core.Keyword(null,"rename","rename",1508157613),null,new cljs.core.Keyword(null,"refer","refer",-964295553),null], null), null),cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.first,cljs.core.partition.cljs$core$IFn$_invoke$arity$2((2),cljs.core.next(spec))))){
} else {
throw cljs.analyzer.error.cljs$core$IFn$_invoke$arity$2(env,cljs.analyzer.parse_ns_error_msg(spec,"Only :as, :refer and :rename options supported in :require / :require-macros"));
}

if((function (){var fs = cljs.core.frequencies(cljs.core.next(spec));
return ((((fs.cljs$core$IFn$_invoke$arity$2 ? fs.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"as","as",1148689641),(0)) : fs.call(null,new cljs.core.Keyword(null,"as","as",1148689641),(0))) <= (1))) && (((fs.cljs$core$IFn$_invoke$arity$2 ? fs.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"refer","refer",-964295553),(0)) : fs.call(null,new cljs.core.Keyword(null,"refer","refer",-964295553),(0))) <= (1))));
})()){
return null;
} else {
throw cljs.analyzer.error.cljs$core$IFn$_invoke$arity$2(env,cljs.analyzer.parse_ns_error_msg(spec,"Each of :as and :refer options may only be specified once in :require / :require-macros"));
}
} else {
return null;
}
});
cljs.analyzer.parse_ns_excludes = (function cljs$analyzer$parse_ns_excludes(env,args){
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (s,p__45952){
var vec__45953 = p__45952;
var seq__45954 = cljs.core.seq(vec__45953);
var first__45955 = cljs.core.first(seq__45954);
var seq__45954__$1 = cljs.core.next(seq__45954);
var k = first__45955;
var filters = seq__45954__$1;
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(k,new cljs.core.Keyword(null,"refer-clojure","refer-clojure",813784440))){
if(cljs.core.seq(new cljs.core.Keyword(null,"excludes","excludes",-1791725945).cljs$core$IFn$_invoke$arity$1(s))){
throw cljs.analyzer.error.cljs$core$IFn$_invoke$arity$2(env,"Only one :refer-clojure form is allowed per namespace definition");
} else {
}

var valid_kws = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"exclude","exclude",-1230250334),null,new cljs.core.Keyword(null,"rename","rename",1508157613),null], null), null);
var xs = (function (){var fs = cljs.core.seq(filters);
var ret = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"excludes","excludes",-1791725945),cljs.core.PersistentHashSet.EMPTY,new cljs.core.Keyword(null,"renames","renames",343278368),cljs.core.PersistentArrayMap.EMPTY], null);
var err = (!(cljs.core.even_QMARK_(cljs.core.count(filters))));
while(true){
if(err === true){
throw cljs.analyzer.error.cljs$core$IFn$_invoke$arity$2(env,"Only [:refer-clojure :exclude (names)] and optionally `:rename {from to}` specs supported");
} else {
if((!((fs == null)))){
var kw = cljs.core.first(fs);
if(cljs.core.truth_((valid_kws.cljs$core$IFn$_invoke$arity$1 ? valid_kws.cljs$core$IFn$_invoke$arity$1(kw) : valid_kws.call(null,kw)))){
var refs = cljs.core.second(fs);
if((!(((((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(kw,new cljs.core.Keyword(null,"exclude","exclude",-1230250334))) && (((cljs.core.sequential_QMARK_(refs)) && (cljs.core.every_QMARK_(cljs.core.symbol_QMARK_,refs)))))) || (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(kw,new cljs.core.Keyword(null,"rename","rename",1508157613))) && (((cljs.core.map_QMARK_(refs)) && (cljs.core.every_QMARK_(((function (fs,ret,err,refs,kw,valid_kws,vec__45953,seq__45954,first__45955,seq__45954__$1,k,filters){
return (function (p1__45945_SHARP_){
return cljs.core.every_QMARK_(cljs.core.symbol_QMARK_,p1__45945_SHARP_);
});})(fs,ret,err,refs,kw,valid_kws,vec__45953,seq__45954,first__45955,seq__45954__$1,k,filters))
,refs)))))))))){
var G__49070 = fs;
var G__49071 = ret;
var G__49072 = true;
fs = G__49070;
ret = G__49071;
err = G__49072;
continue;
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(kw,new cljs.core.Keyword(null,"exclude","exclude",-1230250334))){
var G__49073 = cljs.core.nnext(fs);
var G__49074 = cljs.core.update_in.cljs$core$IFn$_invoke$arity$4(ret,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"excludes","excludes",-1791725945)], null),cljs.core.into,refs);
var G__49075 = false;
fs = G__49073;
ret = G__49074;
err = G__49075;
continue;
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(kw,new cljs.core.Keyword(null,"rename","rename",1508157613))){
var G__49076 = cljs.core.nnext(fs);
var G__49077 = cljs.core.update_in.cljs$core$IFn$_invoke$arity$4(ret,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"renames","renames",343278368)], null),cljs.core.merge,refs);
var G__49078 = false;
fs = G__49076;
ret = G__49077;
err = G__49078;
continue;
} else {
return null;
}
}
}
} else {
var G__49079 = fs;
var G__49080 = ret;
var G__49081 = true;
fs = G__49079;
ret = G__49080;
err = G__49081;
continue;
}
} else {
return ret;

}
}
break;
}
})();
return cljs.core.merge_with.cljs$core$IFn$_invoke$arity$variadic(cljs.core.into,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([s,xs], 0));
} else {
return s;
}
}),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"excludes","excludes",-1791725945),cljs.core.PersistentHashSet.EMPTY,new cljs.core.Keyword(null,"renames","renames",343278368),cljs.core.PersistentArrayMap.EMPTY], null),args);
});
cljs.analyzer.use__GT_require = (function cljs$analyzer$use__GT_require(env,p__45985){
var vec__45987 = p__45985;
var seq__45988 = cljs.core.seq(vec__45987);
var first__45989 = cljs.core.first(seq__45988);
var seq__45988__$1 = cljs.core.next(seq__45988);
var lib = first__45989;
var filters = seq__45988__$1;
var spec = vec__45987;
if((((lib instanceof cljs.core.Symbol)) && (cljs.core.odd_QMARK_(cljs.core.count(spec))))){
} else {
throw cljs.analyzer.error.cljs$core$IFn$_invoke$arity$2(env,cljs.analyzer.parse_ns_error_msg(spec,"Only [lib.ns :only (names)] and optionally `:rename {from to}` specs supported in :use / :use-macros"));
}

var fs = cljs.core.seq(filters);
var ret = new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [lib], null);
var err = false;
while(true){
if(err === true){
throw cljs.analyzer.error.cljs$core$IFn$_invoke$arity$2(env,cljs.analyzer.parse_ns_error_msg(spec,"Only [lib.ns :only (names)] and optionally `:rename {from to}` specs supported in :use / :use-macros"));
} else {
if((!((fs == null)))){
var kw = cljs.core.first(fs);
var only_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(kw,new cljs.core.Keyword(null,"only","only",1907811652));
if(((only_QMARK_) || (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(kw,new cljs.core.Keyword(null,"rename","rename",1508157613))))){
if((!((cljs.core.some(cljs.core.PersistentHashSet.createAsIfByAssoc([((only_QMARK_)?new cljs.core.Keyword(null,"refer","refer",-964295553):kw)]),ret) == null)))){
throw cljs.analyzer.error.cljs$core$IFn$_invoke$arity$2(env,cljs.analyzer.parse_ns_error_msg(spec,"Each of :only and :rename options may only be specified once in :use / :use-macros"));
} else {
var refs = cljs.core.second(fs);
if((!(((((only_QMARK_) && (((cljs.core.sequential_QMARK_(refs)) && (cljs.core.every_QMARK_(cljs.core.symbol_QMARK_,refs)))))) || (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(kw,new cljs.core.Keyword(null,"rename","rename",1508157613))) && (((cljs.core.map_QMARK_(refs)) && (cljs.core.every_QMARK_(((function (fs,ret,err,refs,kw,only_QMARK_,vec__45987,seq__45988,first__45989,seq__45988__$1,lib,filters,spec){
return (function (p1__45981_SHARP_){
return cljs.core.every_QMARK_(cljs.core.symbol_QMARK_,p1__45981_SHARP_);
});})(fs,ret,err,refs,kw,only_QMARK_,vec__45987,seq__45988,first__45989,seq__45988__$1,lib,filters,spec))
,refs)))))))))){
var G__49085 = fs;
var G__49086 = ret;
var G__49087 = true;
fs = G__49085;
ret = G__49086;
err = G__49087;
continue;
} else {
var G__49088 = cljs.core.nnext(fs);
var G__49089 = cljs.core.into.cljs$core$IFn$_invoke$arity$2(ret,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [((only_QMARK_)?new cljs.core.Keyword(null,"refer","refer",-964295553):kw),refs], null));
var G__49090 = false;
fs = G__49088;
ret = G__49089;
err = G__49090;
continue;
}
}
} else {
var G__49092 = fs;
var G__49093 = ret;
var G__49094 = true;
fs = G__49092;
ret = G__49093;
err = G__49094;
continue;
}
} else {
if((!((cljs.core.some(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"refer","refer",-964295553),null], null), null),ret) == null)))){
return ret;
} else {
var G__49098 = fs;
var G__49099 = ret;
var G__49100 = true;
fs = G__49098;
ret = G__49099;
err = G__49100;
continue;
}

}
}
break;
}
});
cljs.analyzer.parse_require_spec = (function cljs$analyzer$parse_require_spec(env,macros_QMARK_,deps,aliases,spec){
while(true){
if((((spec instanceof cljs.core.Symbol)) || (typeof spec === 'string'))){
var G__49101 = env;
var G__49102 = macros_QMARK_;
var G__49103 = deps;
var G__49104 = aliases;
var G__49105 = new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [spec], null);
env = G__49101;
macros_QMARK_ = G__49102;
deps = G__49103;
aliases = G__49104;
spec = G__49105;
continue;
} else {
cljs.analyzer.basic_validate_ns_spec(env,macros_QMARK_,spec);

var vec__46003 = spec;
var seq__46004 = cljs.core.seq(vec__46003);
var first__46005 = cljs.core.first(seq__46004);
var seq__46004__$1 = cljs.core.next(seq__46004);
var lib = first__46005;
var opts = seq__46004__$1;
var vec__46006 = (function (){var temp__5806__auto__ = cljs.analyzer.gets.cljs$core$IFn$_invoke$arity$4(cljs.core.deref(cljs.env._STAR_compiler_STAR_),new cljs.core.Keyword(null,"js-module-index","js-module-index",2072061931),cljs.core.str.cljs$core$IFn$_invoke$arity$1(lib),new cljs.core.Keyword(null,"name","name",1843675177));
if((temp__5806__auto__ == null)){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [lib,null], null);
} else {
var js_module_name = temp__5806__auto__;
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.symbol.cljs$core$IFn$_invoke$arity$1(js_module_name),lib], null);
}
})();
var lib__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__46006,(0),null);
var js_module_provides = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__46006,(1),null);
var map__46009 = cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core.hash_map,opts);
var map__46009__$1 = cljs.core.__destructure_map(map__46009);
var alias = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__46009__$1,new cljs.core.Keyword(null,"as","as",1148689641),((typeof lib__$1 === 'string')?cljs.core.symbol.cljs$core$IFn$_invoke$arity$1(cljs.core.munge(lib__$1)):lib__$1));
var referred = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__46009__$1,new cljs.core.Keyword(null,"refer","refer",-964295553));
var renamed = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__46009__$1,new cljs.core.Keyword(null,"rename","rename",1508157613));
var referred_without_renamed = cljs.core.seq(cljs.core.remove.cljs$core$IFn$_invoke$arity$2(cljs.core.set(cljs.core.keys(renamed)),referred));
var vec__46010 = (cljs.core.truth_(macros_QMARK_)?new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"require-macros","require-macros",707947416),new cljs.core.Keyword(null,"use-macros","use-macros",-905638393),new cljs.core.Keyword(null,"rename-macros","rename-macros",1076432512)], null):new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"require","require",-468001333),new cljs.core.Keyword(null,"use","use",-1846382424),new cljs.core.Keyword(null,"rename","rename",1508157613)], null));
var rk = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__46010,(0),null);
var uk = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__46010,(1),null);
var renk = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__46010,(2),null);
if((((alias instanceof cljs.core.Symbol)) || ((alias == null)))){
} else {
throw cljs.analyzer.error.cljs$core$IFn$_invoke$arity$2(env,cljs.analyzer.parse_ns_error_msg(spec,":as must be followed by a symbol in :require / :require-macros"));
}

if((!((alias == null)))){
var alias_type_49112 = (cljs.core.truth_(macros_QMARK_)?new cljs.core.Keyword(null,"macros","macros",811339431):new cljs.core.Keyword(null,"fns","fns",1185138786));
var lib_SINGLEQUOTE__49113 = (function (){var fexpr__46023 = alias_type_49112.cljs$core$IFn$_invoke$arity$1(cljs.core.deref(aliases));
return (fexpr__46023.cljs$core$IFn$_invoke$arity$1 ? fexpr__46023.cljs$core$IFn$_invoke$arity$1(alias) : fexpr__46023.call(null,alias));
})();
if((((!((lib_SINGLEQUOTE__49113 == null)))) && (cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(lib__$1,lib_SINGLEQUOTE__49113)))){
throw cljs.analyzer.error.cljs$core$IFn$_invoke$arity$2(env,cljs.analyzer.parse_ns_error_msg(spec,":as alias must be unique"));
} else {
}

cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$variadic(aliases,cljs.core.update_in,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [alias_type_49112], null),cljs.core.conj,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [alias,lib__$1], null),(cljs.core.truth_(js_module_provides)?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [js_module_provides,lib__$1], null):null)], 0));
} else {
}

if(((((cljs.core.sequential_QMARK_(referred)) && (cljs.core.every_QMARK_(cljs.core.symbol_QMARK_,referred)))) || ((referred == null)))){
} else {
throw cljs.analyzer.error.cljs$core$IFn$_invoke$arity$2(env,cljs.analyzer.parse_ns_error_msg(spec,":refer must be followed by a sequence of symbols in :require / :require-macros"));
}

if(cljs.core.truth_(macros_QMARK_)){
} else {
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$3(deps,cljs.core.conj,lib__$1);
}

return cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([(((!((alias == null))))?cljs.core.PersistentArrayMap.createAsIfByAssoc([rk,cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.PersistentArrayMap.createAsIfByAssoc([alias,lib__$1]),cljs.core.PersistentArrayMap.createAsIfByAssoc([lib__$1,lib__$1]),(cljs.core.truth_(js_module_provides)?cljs.core.PersistentArrayMap.createAsIfByAssoc([js_module_provides,lib__$1]):null)], 0))]):null),(((!((referred_without_renamed == null))))?cljs.core.PersistentArrayMap.createAsIfByAssoc([uk,cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core.hash_map,cljs.core.interleave.cljs$core$IFn$_invoke$arity$2(referred_without_renamed,cljs.core.repeat.cljs$core$IFn$_invoke$arity$1(lib__$1)))]):null),(((!((renamed == null))))?cljs.core.PersistentArrayMap.createAsIfByAssoc([renk,cljs.core.reduce.cljs$core$IFn$_invoke$arity$3(((function (env,macros_QMARK_,deps,aliases,spec,vec__46003,seq__46004,first__46005,seq__46004__$1,lib,opts,vec__46006,lib__$1,js_module_provides,map__46009,map__46009__$1,alias,referred,renamed,referred_without_renamed,vec__46010,rk,uk,renk){
return (function (m,p__46032){
var vec__46033 = p__46032;
var original = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__46033,(0),null);
var renamed__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__46033,(1),null);
if(cljs.core.truth_(cljs.core.some(cljs.core.PersistentHashSet.createAsIfByAssoc([original]),referred))){
} else {
throw cljs.analyzer.error.cljs$core$IFn$_invoke$arity$2(env,["Renamed symbol ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(original)," not referred"].join(''));
}

return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(m,renamed__$1,cljs.core.symbol.cljs$core$IFn$_invoke$arity$2(cljs.core.str.cljs$core$IFn$_invoke$arity$1(lib__$1),cljs.core.str.cljs$core$IFn$_invoke$arity$1(original)));
});})(env,macros_QMARK_,deps,aliases,spec,vec__46003,seq__46004,first__46005,seq__46004__$1,lib,opts,vec__46006,lib__$1,js_module_provides,map__46009,map__46009__$1,alias,referred,renamed,referred_without_renamed,vec__46010,rk,uk,renk))
,cljs.core.PersistentArrayMap.EMPTY,renamed)]):null)], 0));
}
break;
}
});
cljs.analyzer.parse_import_spec = (function cljs$analyzer$parse_import_spec(env,deps,spec){
if(((((cljs.core.sequential_QMARK_(spec)) && (cljs.core.every_QMARK_(cljs.core.symbol_QMARK_,spec)))) || ((((spec instanceof cljs.core.Symbol)) && ((cljs.core.namespace(spec) == null)))))){
} else {
throw cljs.analyzer.error.cljs$core$IFn$_invoke$arity$2(env,cljs.analyzer.parse_ns_error_msg(spec,"Only lib.ns.Ctor or [lib.ns Ctor*] spec supported in :import"));
}

var import_map = ((cljs.core.sequential_QMARK_(spec))?cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__46038_SHARP_){
return (new cljs.core.PersistentVector(null,2,(5),cljs.core.PersistentVector.EMPTY_NODE,[p1__46038_SHARP_,cljs.core.symbol.cljs$core$IFn$_invoke$arity$1([cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.first(spec)),".",cljs.core.str.cljs$core$IFn$_invoke$arity$1(p1__46038_SHARP_)].join(''))],null));
}),cljs.core.rest(spec))):(((!(((-1) === cljs.core.str.cljs$core$IFn$_invoke$arity$1(spec).indexOf(".")))))?cljs.core.PersistentArrayMap.createAsIfByAssoc([cljs.core.symbol.cljs$core$IFn$_invoke$arity$1(cljs.core.last(clojure.string.split.cljs$core$IFn$_invoke$arity$2(cljs.core.str.cljs$core$IFn$_invoke$arity$1(spec),/\./))),spec]):cljs.core.PersistentArrayMap.EMPTY
));
var seq__46057_49120 = cljs.core.seq(import_map);
var chunk__46058_49121 = null;
var count__46060_49122 = (0);
var i__46061_49123 = (0);
while(true){
if((i__46061_49123 < count__46060_49122)){
var vec__46101_49125 = chunk__46058_49121.cljs$core$IIndexed$_nth$arity$2(null,i__46061_49123);
var __49126 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__46101_49125,(0),null);
var spec_49127__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__46101_49125,(1),null);
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$3(deps,cljs.core.conj,spec_49127__$1);


var G__49128 = seq__46057_49120;
var G__49129 = chunk__46058_49121;
var G__49130 = count__46060_49122;
var G__49131 = (i__46061_49123 + (1));
seq__46057_49120 = G__49128;
chunk__46058_49121 = G__49129;
count__46060_49122 = G__49130;
i__46061_49123 = G__49131;
continue;
} else {
var temp__5804__auto___49132 = cljs.core.seq(seq__46057_49120);
if(temp__5804__auto___49132){
var seq__46057_49133__$1 = temp__5804__auto___49132;
if(cljs.core.chunked_seq_QMARK_(seq__46057_49133__$1)){
var c__5525__auto___49134 = cljs.core.chunk_first(seq__46057_49133__$1);
var G__49135 = cljs.core.chunk_rest(seq__46057_49133__$1);
var G__49136 = c__5525__auto___49134;
var G__49137 = cljs.core.count(c__5525__auto___49134);
var G__49138 = (0);
seq__46057_49120 = G__49135;
chunk__46058_49121 = G__49136;
count__46060_49122 = G__49137;
i__46061_49123 = G__49138;
continue;
} else {
var vec__46111_49139 = cljs.core.first(seq__46057_49133__$1);
var __49140 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__46111_49139,(0),null);
var spec_49141__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__46111_49139,(1),null);
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$3(deps,cljs.core.conj,spec_49141__$1);


var G__49142 = cljs.core.next(seq__46057_49133__$1);
var G__49143 = null;
var G__49144 = (0);
var G__49145 = (0);
seq__46057_49120 = G__49142;
chunk__46058_49121 = G__49143;
count__46060_49122 = G__49144;
i__46061_49123 = G__49145;
continue;
}
} else {
}
}
break;
}

return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"import","import",-1399500709),import_map,new cljs.core.Keyword(null,"require","require",-468001333),import_map], null);
});
/**
 * Given a spec form check whether the spec namespace requires a macro file
 * of the same name. If so return true.
 */
cljs.analyzer.macro_autoload_ns_QMARK_ = (function cljs$analyzer$macro_autoload_ns_QMARK_(form){
if(cljs.core.truth_(cljs.analyzer._STAR_macro_infer_STAR_)){
var ns = ((cljs.core.sequential_QMARK_(form))?cljs.core.first(form):form);
var map__46114 = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(cljs.env._STAR_compiler_STAR_),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("cljs.analyzer","namespaces","cljs.analyzer/namespaces",-260788927),ns], null));
var map__46114__$1 = cljs.core.__destructure_map(map__46114);
var use_macros = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__46114__$1,new cljs.core.Keyword(null,"use-macros","use-macros",-905638393));
var require_macros = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__46114__$1,new cljs.core.Keyword(null,"require-macros","require-macros",707947416));
var or__5002__auto__ = cljs.core.some(cljs.core.PersistentHashSet.createAsIfByAssoc([ns]),cljs.core.vals(use_macros));
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.some(cljs.core.PersistentHashSet.createAsIfByAssoc([ns]),cljs.core.vals(require_macros));
}
} else {
return null;
}
});
/**
 * Given a symbol that starts with clojure as the first segment return the
 * same symbol with the first segment replaced with cljs
 */
cljs.analyzer.clj_ns__GT_cljs_ns = (function cljs$analyzer$clj_ns__GT_cljs_ns(sym){
var segs = clojure.string.split.cljs$core$IFn$_invoke$arity$2(cljs.core.name(sym),/\./);
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("clojure",cljs.core.first(segs))){
return cljs.core.symbol.cljs$core$IFn$_invoke$arity$1(clojure.string.join.cljs$core$IFn$_invoke$arity$2(".",cljs.core.cons("cljs",cljs.core.next(segs))));
} else {
return sym;
}
});
cljs.analyzer.canonicalize_specs = (function cljs$analyzer$canonicalize_specs(specs){
var canonicalize = (function cljs$analyzer$canonicalize_specs_$_canonicalize(quoted_spec_or_kw){
if((quoted_spec_or_kw instanceof cljs.core.Keyword)){
return quoted_spec_or_kw;
} else {
var spec = cljs.core.second(quoted_spec_or_kw);
if(((cljs.core.vector_QMARK_(spec)) || (cljs.core.map_QMARK_(spec)))){
return spec;
} else {
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [spec], null);
}
}
});
return cljs.core.map.cljs$core$IFn$_invoke$arity$2(canonicalize,specs);
});
cljs.analyzer.canonicalize_import_specs = (function cljs$analyzer$canonicalize_import_specs(specs){
var canonicalize = (function cljs$analyzer$canonicalize_import_specs_$_canonicalize(quoted_spec_or_kw){
if((quoted_spec_or_kw instanceof cljs.core.Keyword)){
return quoted_spec_or_kw;
} else {
return cljs.core.second(quoted_spec_or_kw);
}
});
return cljs.core.map.cljs$core$IFn$_invoke$arity$2(canonicalize,specs);
});
/**
 * Given an original set of ns specs desugar :include-macros and :refer-macros
 * usage into only primitive spec forms - :use, :require, :use-macros,
 * :require-macros. If a library includes a macro file of with the same name
 * as the namespace will also be desugared.
 */
cljs.analyzer.desugar_ns_specs = (function cljs$analyzer$desugar_ns_specs(args){
var map__46211 = cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p__46212){
var vec__46214 = p__46212;
var seq__46215 = cljs.core.seq(vec__46214);
var first__46216 = cljs.core.first(seq__46215);
var seq__46215__$1 = cljs.core.next(seq__46215);
var k = first__46216;
var specs = seq__46215__$1;
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [k,cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentVector.EMPTY,specs)], null);
}),args));
var map__46211__$1 = cljs.core.__destructure_map(map__46211);
var indexed = map__46211__$1;
var require__$1 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__46211__$1,new cljs.core.Keyword(null,"require","require",-468001333));
var sugar_keys = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"include-macros","include-macros",1228110289),null,new cljs.core.Keyword(null,"refer-macros","refer-macros",-1906841953),null], null), null);
var remove_from_spec = (function (pred,spec){
while(true){
if(cljs.core.not((function (){var and__5000__auto__ = cljs.core.sequential_QMARK_(spec);
if(and__5000__auto__){
return cljs.core.some(pred,spec);
} else {
return and__5000__auto__;
}
})())){
return spec;
} else {
var vec__46242 = cljs.core.split_with(cljs.core.complement(pred),spec);
var l = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__46242,(0),null);
var r = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__46242,(1),null);
var G__49160 = pred;
var G__49161 = cljs.core.concat.cljs$core$IFn$_invoke$arity$2(l,cljs.core.drop.cljs$core$IFn$_invoke$arity$2((2),r));
pred = G__49160;
spec = G__49161;
continue;
}
break;
}
});
var replace_refer_macros = (function (spec){
if((!(cljs.core.sequential_QMARK_(spec)))){
return spec;
} else {
return cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (x){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(x,new cljs.core.Keyword(null,"refer-macros","refer-macros",-1906841953))){
return new cljs.core.Keyword(null,"refer","refer",-964295553);
} else {
return x;
}
}),spec);
}
});
var reload_spec_QMARK_ = (function (p1__46187_SHARP_){
var fexpr__46248 = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"reload","reload",863702807),null,new cljs.core.Keyword(null,"reload-all","reload-all",761570200),null], null), null);
return (fexpr__46248.cljs$core$IFn$_invoke$arity$1 ? fexpr__46248.cljs$core$IFn$_invoke$arity$1(p1__46187_SHARP_) : fexpr__46248.call(null,p1__46187_SHARP_));
});
var to_macro_specs = (function (specs){
return cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (x){
if(cljs.core.not(reload_spec_QMARK_(x))){
return replace_refer_macros(remove_from_spec(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"rename","rename",1508157613),null], null), null),remove_from_spec(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"refer","refer",-964295553),null], null), null),remove_from_spec(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"include-macros","include-macros",1228110289),null], null), null),x))));
} else {
return x;
}
}),cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (x){
var or__5002__auto__ = (function (){var and__5000__auto__ = cljs.core.sequential_QMARK_(x);
if(and__5000__auto__){
return cljs.core.some(sugar_keys,x);
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = reload_spec_QMARK_(x);
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
return cljs.analyzer.macro_autoload_ns_QMARK_(x);
}
}
}),specs));
});
var remove_sugar = cljs.core.partial.cljs$core$IFn$_invoke$arity$2(remove_from_spec,sugar_keys);
var temp__5806__auto__ = cljs.core.seq(to_macro_specs(require__$1));
if((temp__5806__auto__ == null)){
return args;
} else {
var require_specs = temp__5806__auto__;
return cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (x){
if(cljs.core.not(reload_spec_QMARK_(x))){
var vec__46277 = x;
var k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__46277,(0),null);
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__46277,(1),null);
return cljs.core.cons(k,cljs.core.map.cljs$core$IFn$_invoke$arity$2(remove_sugar,v));
} else {
return x;
}
}),cljs.core.update_in.cljs$core$IFn$_invoke$arity$4(indexed,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"require-macros","require-macros",707947416)], null),cljs.core.fnil.cljs$core$IFn$_invoke$arity$2(cljs.core.into,cljs.core.PersistentVector.EMPTY),require_specs));
}
});
cljs.analyzer.find_def_clash = (function cljs$analyzer$find_def_clash(env,ns,segments){
var to_check = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (xs){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.symbol.cljs$core$IFn$_invoke$arity$1(clojure.string.join.cljs$core$IFn$_invoke$arity$2(".",cljs.core.butlast(xs))),cljs.core.symbol.cljs$core$IFn$_invoke$arity$1(cljs.core.last(xs))], null);
}),cljs.core.drop.cljs$core$IFn$_invoke$arity$2((2),cljs.core.reductions.cljs$core$IFn$_invoke$arity$3(cljs.core.conj,cljs.core.PersistentVector.EMPTY,segments)));
var seq__46310 = cljs.core.seq(to_check);
var chunk__46311 = null;
var count__46312 = (0);
var i__46313 = (0);
while(true){
if((i__46313 < count__46312)){
var vec__46354 = chunk__46311.cljs$core$IIndexed$_nth$arity$2(null,i__46313);
var clash_ns = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__46354,(0),null);
var name = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__46354,(1),null);
if(cljs.core.truth_(cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(cljs.env._STAR_compiler_STAR_),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("cljs.analyzer","namespaces","cljs.analyzer/namespaces",-260788927),clash_ns,new cljs.core.Keyword(null,"defs","defs",1398449717),name], null)))){
cljs.analyzer.warning(new cljs.core.Keyword(null,"ns-var-clash","ns-var-clash",-280494668),env,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"ns","ns",441598760),ns,new cljs.core.Keyword(null,"var","var",-769682797),cljs.core.symbol.cljs$core$IFn$_invoke$arity$2(cljs.core.str.cljs$core$IFn$_invoke$arity$1(clash_ns),cljs.core.str.cljs$core$IFn$_invoke$arity$1(name))], null));
} else {
}


var G__49166 = seq__46310;
var G__49167 = chunk__46311;
var G__49168 = count__46312;
var G__49169 = (i__46313 + (1));
seq__46310 = G__49166;
chunk__46311 = G__49167;
count__46312 = G__49168;
i__46313 = G__49169;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__46310);
if(temp__5804__auto__){
var seq__46310__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__46310__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__46310__$1);
var G__49170 = cljs.core.chunk_rest(seq__46310__$1);
var G__49171 = c__5525__auto__;
var G__49172 = cljs.core.count(c__5525__auto__);
var G__49173 = (0);
seq__46310 = G__49170;
chunk__46311 = G__49171;
count__46312 = G__49172;
i__46313 = G__49173;
continue;
} else {
var vec__46390 = cljs.core.first(seq__46310__$1);
var clash_ns = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__46390,(0),null);
var name = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__46390,(1),null);
if(cljs.core.truth_(cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(cljs.env._STAR_compiler_STAR_),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("cljs.analyzer","namespaces","cljs.analyzer/namespaces",-260788927),clash_ns,new cljs.core.Keyword(null,"defs","defs",1398449717),name], null)))){
cljs.analyzer.warning(new cljs.core.Keyword(null,"ns-var-clash","ns-var-clash",-280494668),env,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"ns","ns",441598760),ns,new cljs.core.Keyword(null,"var","var",-769682797),cljs.core.symbol.cljs$core$IFn$_invoke$arity$2(cljs.core.str.cljs$core$IFn$_invoke$arity$1(clash_ns),cljs.core.str.cljs$core$IFn$_invoke$arity$1(name))], null));
} else {
}


var G__49174 = cljs.core.next(seq__46310__$1);
var G__49175 = null;
var G__49176 = (0);
var G__49177 = (0);
seq__46310 = G__49174;
chunk__46311 = G__49175;
count__46312 = G__49176;
i__46313 = G__49177;
continue;
}
} else {
return null;
}
}
break;
}
});
cljs.analyzer.macro_ns_name = (function cljs$analyzer$macro_ns_name(name){
var name_str = cljs.core.str.cljs$core$IFn$_invoke$arity$1(name);
if(cljs.core.not(goog.string.endsWith(name_str,"$macros"))){
return cljs.core.symbol.cljs$core$IFn$_invoke$arity$1([name_str,"$macros"].join(''));
} else {
return name;
}
});
cljs.analyzer.check_duplicate_aliases = (function cljs$analyzer$check_duplicate_aliases(env,old,new$){
var ns_name = new cljs.core.Keyword(null,"name","name",1843675177).cljs$core$IFn$_invoke$arity$1(old);
var seq__46418 = cljs.core.seq(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"requires","requires",-1201390927),new cljs.core.Keyword(null,"require-macros","require-macros",707947416)], null));
var chunk__46419 = null;
var count__46420 = (0);
var i__46421 = (0);
while(true){
if((i__46421 < count__46420)){
var k = chunk__46419.cljs$core$IIndexed$_nth$arity$2(null,i__46421);
var old_aliases_49178 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(old,k);
var new_aliases_49179 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(new$,k);
var temp__5808__auto___49182 = cljs.core.some(cljs.core.set(cljs.core.keys(new_aliases_49179)),cljs.core.keys(cljs.core.remove.cljs$core$IFn$_invoke$arity$2(((function (seq__46418,chunk__46419,count__46420,i__46421,old_aliases_49178,new_aliases_49179,k,ns_name){
return (function (p__46460){
var vec__46461 = p__46460;
var k__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__46461,(0),null);
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__46461,(1),null);
var entry = vec__46461;
return ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(k__$1,v)) || (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(entry,cljs.core.find(new_aliases_49179,k__$1))));
});})(seq__46418,chunk__46419,count__46420,i__46421,old_aliases_49178,new_aliases_49179,k,ns_name))
,old_aliases_49178)));
if((temp__5808__auto___49182 == null)){
} else {
var alias_49183 = temp__5808__auto___49182;
throw cljs.analyzer.error.cljs$core$IFn$_invoke$arity$2(env,["Alias ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(alias_49183)," already exists in namespace ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(ns_name),", aliasing ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.get.cljs$core$IFn$_invoke$arity$2(old_aliases_49178,alias_49183))].join(''));
}


var G__49184 = seq__46418;
var G__49185 = chunk__46419;
var G__49186 = count__46420;
var G__49187 = (i__46421 + (1));
seq__46418 = G__49184;
chunk__46419 = G__49185;
count__46420 = G__49186;
i__46421 = G__49187;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__46418);
if(temp__5804__auto__){
var seq__46418__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__46418__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__46418__$1);
var G__49189 = cljs.core.chunk_rest(seq__46418__$1);
var G__49190 = c__5525__auto__;
var G__49191 = cljs.core.count(c__5525__auto__);
var G__49192 = (0);
seq__46418 = G__49189;
chunk__46419 = G__49190;
count__46420 = G__49191;
i__46421 = G__49192;
continue;
} else {
var k = cljs.core.first(seq__46418__$1);
var old_aliases_49194 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(old,k);
var new_aliases_49195 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(new$,k);
var temp__5808__auto___49197 = cljs.core.some(cljs.core.set(cljs.core.keys(new_aliases_49195)),cljs.core.keys(cljs.core.remove.cljs$core$IFn$_invoke$arity$2(((function (seq__46418,chunk__46419,count__46420,i__46421,old_aliases_49194,new_aliases_49195,k,seq__46418__$1,temp__5804__auto__,ns_name){
return (function (p__46491){
var vec__46492 = p__46491;
var k__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__46492,(0),null);
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__46492,(1),null);
var entry = vec__46492;
return ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(k__$1,v)) || (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(entry,cljs.core.find(new_aliases_49195,k__$1))));
});})(seq__46418,chunk__46419,count__46420,i__46421,old_aliases_49194,new_aliases_49195,k,seq__46418__$1,temp__5804__auto__,ns_name))
,old_aliases_49194)));
if((temp__5808__auto___49197 == null)){
} else {
var alias_49198 = temp__5808__auto___49197;
throw cljs.analyzer.error.cljs$core$IFn$_invoke$arity$2(env,["Alias ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(alias_49198)," already exists in namespace ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(ns_name),", aliasing ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.get.cljs$core$IFn$_invoke$arity$2(old_aliases_49194,alias_49198))].join(''));
}


var G__49199 = cljs.core.next(seq__46418__$1);
var G__49200 = null;
var G__49201 = (0);
var G__49202 = (0);
seq__46418 = G__49199;
chunk__46419 = G__49200;
count__46420 = G__49201;
i__46421 = G__49202;
continue;
}
} else {
return null;
}
}
break;
}
});
cljs.analyzer.merge_ns_info = (function cljs$analyzer$merge_ns_info(old,new$,env){
if((cljs.core.count(old) > (0))){
var deep_merge_keys = new cljs.core.PersistentVector(null, 8, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"use-macros","use-macros",-905638393),new cljs.core.Keyword(null,"require-macros","require-macros",707947416),new cljs.core.Keyword(null,"rename-macros","rename-macros",1076432512),new cljs.core.Keyword(null,"uses","uses",232664692),new cljs.core.Keyword(null,"requires","requires",-1201390927),new cljs.core.Keyword(null,"renames","renames",343278368),new cljs.core.Keyword(null,"imports","imports",-1249933394),new cljs.core.Keyword(null,"as-aliases","as-aliases",1485064798)], null);
return cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([old,cljs.core.select_keys(new$,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"excludes","excludes",-1791725945)], null)),cljs.core.merge_with.cljs$core$IFn$_invoke$arity$variadic(cljs.core.merge,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.select_keys(old,deep_merge_keys),cljs.core.select_keys(new$,deep_merge_keys)], 0))], 0));
} else {
return new$;
}
});
cljs.analyzer.parse.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Symbol(null,"ns","ns",2082130287,null),(function (_,env,p__46574,___$1,opts){
var vec__46576 = p__46574;
var seq__46577 = cljs.core.seq(vec__46576);
var first__46578 = cljs.core.first(seq__46577);
var seq__46577__$1 = cljs.core.next(seq__46577);
var ___$2 = first__46578;
var first__46578__$1 = cljs.core.first(seq__46577__$1);
var seq__46577__$2 = cljs.core.next(seq__46577__$1);
var name = first__46578__$1;
var args = seq__46577__$2;
var form = vec__46576;
if(cljs.core.truth_(cljs.analyzer._STAR_allow_ns_STAR_)){
} else {
throw cljs.analyzer.error.cljs$core$IFn$_invoke$arity$2(env,"Namespace declarations must appear at the top-level.");
}

if((name instanceof cljs.core.Symbol)){
} else {
throw cljs.analyzer.error.cljs$core$IFn$_invoke$arity$2(env,"Namespaces must be named by a symbol.");
}

var name__$1 = (function (){var G__46589 = name;
if(cljs.core.truth_(new cljs.core.Keyword(null,"macros-ns","macros-ns",1626844933).cljs$core$IFn$_invoke$arity$1(opts))){
return cljs.analyzer.macro_ns_name(G__46589);
} else {
return G__46589;
}
})();
var segments_49208 = clojure.string.split.cljs$core$IFn$_invoke$arity$2(cljs.core.name(name__$1),/\./);
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2((1),cljs.core.count(segments_49208))){
cljs.analyzer.warning(new cljs.core.Keyword(null,"single-segment-namespace","single-segment-namespace",-491924469),env,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"name","name",1843675177),name__$1], null));
} else {
}

var segment_49210 = cljs.core.some(cljs.analyzer.js_reserved,segments_49208);
if((!((segment_49210 == null)))){
cljs.analyzer.warning(new cljs.core.Keyword(null,"munged-namespace","munged-namespace",-101986199),env,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"name","name",1843675177),name__$1], null));
} else {
}

cljs.analyzer.find_def_clash(env,name__$1,segments_49208);

var docstring = ((typeof cljs.core.first(args) === 'string')?cljs.core.first(args):null);
var mdocstr = new cljs.core.Keyword(null,"doc","doc",1913296891).cljs$core$IFn$_invoke$arity$1(cljs.core.meta(name__$1));
var args__$1 = (((!((docstring == null))))?cljs.core.next(args):args);
var metadata = ((cljs.core.map_QMARK_(cljs.core.first(args__$1)))?cljs.core.first(args__$1):null);
var args__$2 = cljs.analyzer.desugar_ns_specs((((!((metadata == null))))?cljs.core.next(args__$1):args__$1));
var map__46609 = cljs.analyzer.impl.namespaces.elide_aliases_from_ns_specs(args__$2);
var map__46609__$1 = cljs.core.__destructure_map(map__46609);
var args__$3 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__46609__$1,new cljs.core.Keyword(null,"libspecs","libspecs",59807195));
var as_aliases = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__46609__$1,new cljs.core.Keyword(null,"as-aliases","as-aliases",1485064798));
var name__$2 = cljs.core.vary_meta.cljs$core$IFn$_invoke$arity$3(name__$1,cljs.core.merge,metadata);
var map__46610 = cljs.analyzer.parse_ns_excludes(env,args__$3);
var map__46610__$1 = cljs.core.__destructure_map(map__46610);
var excludes = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__46610__$1,new cljs.core.Keyword(null,"excludes","excludes",-1791725945));
var core_renames = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__46610__$1,new cljs.core.Keyword(null,"renames","renames",343278368));
var core_renames__$1 = cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (m,p__46630){
var vec__46642 = p__46630;
var original = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__46642,(0),null);
var renamed = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__46642,(1),null);
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(m,renamed,cljs.core.symbol.cljs$core$IFn$_invoke$arity$2("cljs.core",cljs.core.str.cljs$core$IFn$_invoke$arity$1(original)));
}),cljs.core.PersistentArrayMap.EMPTY,core_renames);
var deps = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentVector.EMPTY);
var aliases = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"fns","fns",1185138786),as_aliases,new cljs.core.Keyword(null,"macros","macros",811339431),as_aliases], null));
var spec_parsers = new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"require","require",-468001333),cljs.core.partial.cljs$core$IFn$_invoke$arity$variadic(cljs.analyzer.parse_require_spec,env,false,deps,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([aliases], 0)),new cljs.core.Keyword(null,"require-macros","require-macros",707947416),cljs.core.partial.cljs$core$IFn$_invoke$arity$variadic(cljs.analyzer.parse_require_spec,env,true,deps,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([aliases], 0)),new cljs.core.Keyword(null,"use","use",-1846382424),cljs.core.comp.cljs$core$IFn$_invoke$arity$2(cljs.core.partial.cljs$core$IFn$_invoke$arity$variadic(cljs.analyzer.parse_require_spec,env,false,deps,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([aliases], 0)),cljs.core.partial.cljs$core$IFn$_invoke$arity$2(cljs.analyzer.use__GT_require,env)),new cljs.core.Keyword(null,"use-macros","use-macros",-905638393),cljs.core.comp.cljs$core$IFn$_invoke$arity$2(cljs.core.partial.cljs$core$IFn$_invoke$arity$variadic(cljs.analyzer.parse_require_spec,env,true,deps,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([aliases], 0)),cljs.core.partial.cljs$core$IFn$_invoke$arity$2(cljs.analyzer.use__GT_require,env)),new cljs.core.Keyword(null,"import","import",-1399500709),cljs.core.partial.cljs$core$IFn$_invoke$arity$3(cljs.analyzer.parse_import_spec,env,deps)], null);
var valid_forms = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"use-macros","use-macros",-905638393),null,new cljs.core.Keyword(null,"use","use",-1846382424),null,new cljs.core.Keyword(null,"require","require",-468001333),null,new cljs.core.Keyword(null,"require-macros","require-macros",707947416),null,new cljs.core.Keyword(null,"import","import",-1399500709),null], null), null));
var reload = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"use","use",-1846382424),null,new cljs.core.Keyword(null,"require","require",-468001333),null,new cljs.core.Keyword(null,"use-macros","use-macros",-905638393),null,new cljs.core.Keyword(null,"require-macros","require-macros",707947416),null], null));
var reloads = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
var map__46611 = cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (m,p__46660){
var vec__46676 = p__46660;
var seq__46677 = cljs.core.seq(vec__46676);
var first__46678 = cljs.core.first(seq__46677);
var seq__46677__$1 = cljs.core.next(seq__46677);
var k = first__46678;
var libs = seq__46677__$1;
var libspec = vec__46676;
if(cljs.core.truth_((function (){var fexpr__46679 = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"use-macros","use-macros",-905638393),null,new cljs.core.Keyword(null,"use","use",-1846382424),null,new cljs.core.Keyword(null,"require","require",-468001333),null,new cljs.core.Keyword(null,"require-macros","require-macros",707947416),null,new cljs.core.Keyword(null,"import","import",-1399500709),null], null), null);
return (fexpr__46679.cljs$core$IFn$_invoke$arity$1 ? fexpr__46679.cljs$core$IFn$_invoke$arity$1(k) : fexpr__46679.call(null,k));
})())){
} else {
throw cljs.analyzer.error.cljs$core$IFn$_invoke$arity$2(env,["Only :refer-clojure, :require, :require-macros, :use, :use-macros, and :import libspecs supported. Got ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(libspec)," instead."].join(''));
}

if(cljs.core.truth_((function (){var fexpr__46680 = cljs.core.deref(valid_forms);
return (fexpr__46680.cljs$core$IFn$_invoke$arity$1 ? fexpr__46680.cljs$core$IFn$_invoke$arity$1(k) : fexpr__46680.call(null,k));
})())){
} else {
throw cljs.analyzer.error.cljs$core$IFn$_invoke$arity$2(env,["Only one ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(k)," form is allowed per namespace definition"].join(''));
}

cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$3(valid_forms,cljs.core.disj,k);

if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"import","import",-1399500709),k)){
} else {
if((!((cljs.core.some(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"reload","reload",863702807),null], null), null),libs) == null)))){
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(reload,cljs.core.assoc,k,new cljs.core.Keyword(null,"reload","reload",863702807));
} else {
}

if((!((cljs.core.some(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"reload-all","reload-all",761570200),null], null), null),libs) == null)))){
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(reload,cljs.core.assoc,k,new cljs.core.Keyword(null,"reload-all","reload-all",761570200));
} else {
}
}

var temp__5804__auto___49226 = cljs.core.seq(cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (p1__46551_SHARP_){
return new cljs.core.Keyword(null,"reload","reload",863702807).cljs$core$IFn$_invoke$arity$1(cljs.core.meta(p1__46551_SHARP_));
}),libs));
if(temp__5804__auto___49226){
var xs_49227 = temp__5804__auto___49226;
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(reloads,cljs.core.assoc,k,cljs.core.zipmap(cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.first,xs_49227),cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__46552_SHARP_){
return new cljs.core.Keyword(null,"reload","reload",863702807).cljs$core$IFn$_invoke$arity$1(cljs.core.meta(p1__46552_SHARP_));
}),xs_49227)));
} else {
}

return cljs.core.apply.cljs$core$IFn$_invoke$arity$4(cljs.core.merge_with,cljs.core.merge,m,cljs.core.map.cljs$core$IFn$_invoke$arity$2((spec_parsers.cljs$core$IFn$_invoke$arity$1 ? spec_parsers.cljs$core$IFn$_invoke$arity$1(k) : spec_parsers.call(null,k)),cljs.core.remove.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"reload","reload",863702807),null,new cljs.core.Keyword(null,"reload-all","reload-all",761570200),null], null), null),libs)));
}),cljs.core.PersistentArrayMap.EMPTY,cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (p__46713){
var vec__46714 = p__46713;
var r = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__46714,(0),null);
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(r,new cljs.core.Keyword(null,"refer-clojure","refer-clojure",813784440));
}),args__$3));
var map__46611__$1 = cljs.core.__destructure_map(map__46611);
var params = map__46611__$1;
var uses = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__46611__$1,new cljs.core.Keyword(null,"use","use",-1846382424));
var requires = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__46611__$1,new cljs.core.Keyword(null,"require","require",-468001333));
var renames = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__46611__$1,new cljs.core.Keyword(null,"rename","rename",1508157613));
var use_macros = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__46611__$1,new cljs.core.Keyword(null,"use-macros","use-macros",-905638393));
var require_macros = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__46611__$1,new cljs.core.Keyword(null,"require-macros","require-macros",707947416));
var rename_macros = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__46611__$1,new cljs.core.Keyword(null,"rename-macros","rename-macros",1076432512));
var imports = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__46611__$1,new cljs.core.Keyword(null,"import","import",-1399500709));
var vec__46612 = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (spec_map){
if(cljs.core.truth_(new cljs.core.Keyword(null,"macros-ns","macros-ns",1626844933).cljs$core$IFn$_invoke$arity$1(opts))){
var ns = cljs.core.symbol.cljs$core$IFn$_invoke$arity$1(cljs.core.subs.cljs$core$IFn$_invoke$arity$3(cljs.core.str.cljs$core$IFn$_invoke$arity$1(name__$2),(0),(((cljs.core.str.cljs$core$IFn$_invoke$arity$1(name__$2)).length) - (7))));
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (m,p__46720){
var vec__46722 = p__46720;
var k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__46722,(0),null);
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__46722,(1),null);
var G__46739 = m;
if((!(cljs.core.symbol_identical_QMARK_(v,ns)))){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__46739,k,v);
} else {
return G__46739;
}
}),cljs.core.PersistentArrayMap.EMPTY,spec_map);
} else {
return spec_map;
}
}),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [require_macros,use_macros], null));
var require_macros__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__46612,(0),null);
var use_macros__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__46612,(1),null);
(cljs.analyzer._STAR_cljs_ns_STAR_ = name__$2);

var ns_info = cljs.core.PersistentHashMap.fromArrays([new cljs.core.Keyword(null,"rename-macros","rename-macros",1076432512),new cljs.core.Keyword(null,"renames","renames",343278368),new cljs.core.Keyword(null,"use-macros","use-macros",-905638393),new cljs.core.Keyword(null,"excludes","excludes",-1791725945),new cljs.core.Keyword(null,"name","name",1843675177),new cljs.core.Keyword(null,"imports","imports",-1249933394),new cljs.core.Keyword(null,"requires","requires",-1201390927),new cljs.core.Keyword(null,"uses","uses",232664692),new cljs.core.Keyword(null,"require-macros","require-macros",707947416),new cljs.core.Keyword(null,"doc","doc",1913296891),new cljs.core.Keyword(null,"as-aliases","as-aliases",1485064798)],[rename_macros,cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([renames,core_renames__$1], 0)),use_macros__$1,excludes,name__$2,imports,requires,uses,require_macros__$1,(function (){var or__5002__auto__ = docstring;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return mdocstr;
}
})(),as_aliases]);
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$variadic(cljs.env._STAR_compiler_STAR_,cljs.core.update_in,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("cljs.analyzer","namespaces","cljs.analyzer/namespaces",-260788927),name__$2], null),cljs.core.merge,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([ns_info], 0));

return cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 6, [new cljs.core.Keyword(null,"op","op",-1882987955),new cljs.core.Keyword(null,"ns","ns",441598760),new cljs.core.Keyword(null,"env","env",-1815813235),env,new cljs.core.Keyword(null,"form","form",-1624062471),form,new cljs.core.Keyword(null,"deps","deps",1883360319),cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentVector.EMPTY,cljs.core.distinct.cljs$core$IFn$_invoke$arity$1(cljs.core.deref(deps))),new cljs.core.Keyword(null,"reload","reload",863702807),cljs.core.deref(reload),new cljs.core.Keyword(null,"reloads","reloads",610698522),cljs.core.deref(reloads)], null),(function (){var G__46760 = ns_info;
var G__46760__$1 = (cljs.core.truth_((function (){var fexpr__46761 = cljs.core.deref(reload);
return (fexpr__46761.cljs$core$IFn$_invoke$arity$1 ? fexpr__46761.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"use","use",-1846382424)) : fexpr__46761.call(null,new cljs.core.Keyword(null,"use","use",-1846382424)));
})())?cljs.core.update_in.cljs$core$IFn$_invoke$arity$3(G__46760,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"uses","uses",232664692)], null),(function (m){
return cljs.core.with_meta(m,cljs.core.PersistentArrayMap.createAsIfByAssoc([(function (){var fexpr__46762 = cljs.core.deref(reload);
return (fexpr__46762.cljs$core$IFn$_invoke$arity$1 ? fexpr__46762.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"use","use",-1846382424)) : fexpr__46762.call(null,new cljs.core.Keyword(null,"use","use",-1846382424)));
})(),true]));
})):G__46760);
if(cljs.core.truth_((function (){var fexpr__46763 = cljs.core.deref(reload);
return (fexpr__46763.cljs$core$IFn$_invoke$arity$1 ? fexpr__46763.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"require","require",-468001333)) : fexpr__46763.call(null,new cljs.core.Keyword(null,"require","require",-468001333)));
})())){
return cljs.core.update_in.cljs$core$IFn$_invoke$arity$3(G__46760__$1,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"requires","requires",-1201390927)], null),(function (m){
return cljs.core.with_meta(m,cljs.core.PersistentArrayMap.createAsIfByAssoc([(function (){var fexpr__46783 = cljs.core.deref(reload);
return (fexpr__46783.cljs$core$IFn$_invoke$arity$1 ? fexpr__46783.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"require","require",-468001333)) : fexpr__46783.call(null,new cljs.core.Keyword(null,"require","require",-468001333)));
})(),true]));
}));
} else {
return G__46760__$1;
}
})()], 0));
}));
cljs.analyzer.parse.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Symbol(null,"ns*","ns*",1840949383,null),(function (_,env,p__46806,___$1,opts){
var vec__46822 = p__46806;
var ___$2 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__46822,(0),null);
var quoted_specs = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__46822,(1),null);
var form = vec__46822;
var temp__5804__auto___49236 = cljs.core.first(cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (p1__46799_SHARP_){
return ((cljs.core.seq_QMARK_(p1__46799_SHARP_)) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Symbol(null,"quote","quote",1377916282,null),cljs.core.first(p1__46799_SHARP_))));
}),cljs.core.remove.cljs$core$IFn$_invoke$arity$2(cljs.core.keyword_QMARK_,quoted_specs)));
if(cljs.core.truth_(temp__5804__auto___49236)){
var not_quoted_49237 = temp__5804__auto___49236;
throw cljs.analyzer.error.cljs$core$IFn$_invoke$arity$2(env,["Arguments to ",cljs.core.name(cljs.core.first(quoted_specs))," must be quoted. Offending spec: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(not_quoted_49237)].join(''));
} else {
}

if(cljs.core.truth_(cljs.analyzer._STAR_allow_ns_STAR_)){
} else {
throw cljs.analyzer.error.cljs$core$IFn$_invoke$arity$2(env,["Calls to `",cljs.core.name(cljs.core.first(quoted_specs)),"` must appear at the top-level."].join(''));
}

var specs = ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"import","import",-1399500709),cljs.core.first(quoted_specs)))?cljs.analyzer.canonicalize_import_specs(quoted_specs):cljs.analyzer.canonicalize_specs(quoted_specs));
var name = new cljs.core.Keyword(null,"name","name",1843675177).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"ns","ns",441598760).cljs$core$IFn$_invoke$arity$1(env));
var args = cljs.analyzer.desugar_ns_specs((new cljs.core.List(null,specs,null,(1),null)));
var map__46830 = cljs.analyzer.impl.namespaces.elide_aliases_from_ns_specs(args);
var map__46830__$1 = cljs.core.__destructure_map(map__46830);
var args__$1 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__46830__$1,new cljs.core.Keyword(null,"libspecs","libspecs",59807195));
var as_aliases = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__46830__$1,new cljs.core.Keyword(null,"as-aliases","as-aliases",1485064798));
var map__46831 = cljs.analyzer.parse_ns_excludes(env,args__$1);
var map__46831__$1 = cljs.core.__destructure_map(map__46831);
var excludes = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__46831__$1,new cljs.core.Keyword(null,"excludes","excludes",-1791725945));
var core_renames = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__46831__$1,new cljs.core.Keyword(null,"renames","renames",343278368));
var core_renames__$1 = cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (m,p__46835){
var vec__46836 = p__46835;
var original = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__46836,(0),null);
var renamed = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__46836,(1),null);
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(m,renamed,cljs.core.symbol.cljs$core$IFn$_invoke$arity$2("cljs.core",cljs.core.str.cljs$core$IFn$_invoke$arity$1(original)));
}),cljs.core.PersistentArrayMap.EMPTY,core_renames);
var deps = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentVector.EMPTY);
var aliases = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"fns","fns",1185138786),as_aliases,new cljs.core.Keyword(null,"macros","macros",811339431),as_aliases], null));
var spec_parsers = new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"require","require",-468001333),cljs.core.partial.cljs$core$IFn$_invoke$arity$variadic(cljs.analyzer.parse_require_spec,env,false,deps,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([aliases], 0)),new cljs.core.Keyword(null,"require-macros","require-macros",707947416),cljs.core.partial.cljs$core$IFn$_invoke$arity$variadic(cljs.analyzer.parse_require_spec,env,true,deps,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([aliases], 0)),new cljs.core.Keyword(null,"use","use",-1846382424),cljs.core.comp.cljs$core$IFn$_invoke$arity$2(cljs.core.partial.cljs$core$IFn$_invoke$arity$variadic(cljs.analyzer.parse_require_spec,env,false,deps,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([aliases], 0)),cljs.core.partial.cljs$core$IFn$_invoke$arity$2(cljs.analyzer.use__GT_require,env)),new cljs.core.Keyword(null,"use-macros","use-macros",-905638393),cljs.core.comp.cljs$core$IFn$_invoke$arity$2(cljs.core.partial.cljs$core$IFn$_invoke$arity$variadic(cljs.analyzer.parse_require_spec,env,true,deps,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([aliases], 0)),cljs.core.partial.cljs$core$IFn$_invoke$arity$2(cljs.analyzer.use__GT_require,env)),new cljs.core.Keyword(null,"import","import",-1399500709),cljs.core.partial.cljs$core$IFn$_invoke$arity$3(cljs.analyzer.parse_import_spec,env,deps)], null);
var reload = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"use","use",-1846382424),null,new cljs.core.Keyword(null,"require","require",-468001333),null,new cljs.core.Keyword(null,"use-macros","use-macros",-905638393),null,new cljs.core.Keyword(null,"require-macros","require-macros",707947416),null], null));
var reloads = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
var map__46832 = cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (m,p__46847){
var vec__46848 = p__46847;
var seq__46849 = cljs.core.seq(vec__46848);
var first__46850 = cljs.core.first(seq__46849);
var seq__46849__$1 = cljs.core.next(seq__46849);
var k = first__46850;
var libs = seq__46849__$1;
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"import","import",-1399500709),k)){
} else {
if((!((cljs.core.some(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"reload","reload",863702807),null], null), null),libs) == null)))){
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(reload,cljs.core.assoc,k,new cljs.core.Keyword(null,"reload","reload",863702807));
} else {
}

if((!((cljs.core.some(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"reload-all","reload-all",761570200),null], null), null),libs) == null)))){
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(reload,cljs.core.assoc,k,new cljs.core.Keyword(null,"reload-all","reload-all",761570200));
} else {
}
}

var temp__5808__auto___49251 = cljs.core.seq(cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (p1__46803_SHARP_){
return new cljs.core.Keyword(null,"reload","reload",863702807).cljs$core$IFn$_invoke$arity$1(cljs.core.meta(p1__46803_SHARP_));
}),libs));
if((temp__5808__auto___49251 == null)){
} else {
var xs_49252 = temp__5808__auto___49251;
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(reloads,cljs.core.assoc,k,cljs.core.zipmap(cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.first,xs_49252),cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__46804_SHARP_){
return new cljs.core.Keyword(null,"reload","reload",863702807).cljs$core$IFn$_invoke$arity$1(cljs.core.meta(p1__46804_SHARP_));
}),xs_49252)));
}

return cljs.core.apply.cljs$core$IFn$_invoke$arity$4(cljs.core.merge_with,cljs.core.merge,m,cljs.core.map.cljs$core$IFn$_invoke$arity$2((spec_parsers.cljs$core$IFn$_invoke$arity$1 ? spec_parsers.cljs$core$IFn$_invoke$arity$1(k) : spec_parsers.call(null,k)),cljs.core.remove.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"reload","reload",863702807),null,new cljs.core.Keyword(null,"reload-all","reload-all",761570200),null], null), null),libs)));
}),cljs.core.PersistentArrayMap.EMPTY,cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (p__46861){
var vec__46863 = p__46861;
var r = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__46863,(0),null);
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(r,new cljs.core.Keyword(null,"refer-clojure","refer-clojure",813784440));
}),args__$1));
var map__46832__$1 = cljs.core.__destructure_map(map__46832);
var params = map__46832__$1;
var uses = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__46832__$1,new cljs.core.Keyword(null,"use","use",-1846382424));
var requires = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__46832__$1,new cljs.core.Keyword(null,"require","require",-468001333));
var renames = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__46832__$1,new cljs.core.Keyword(null,"rename","rename",1508157613));
var use_macros = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__46832__$1,new cljs.core.Keyword(null,"use-macros","use-macros",-905638393));
var require_macros = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__46832__$1,new cljs.core.Keyword(null,"require-macros","require-macros",707947416));
var rename_macros = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__46832__$1,new cljs.core.Keyword(null,"rename-macros","rename-macros",1076432512));
var imports = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__46832__$1,new cljs.core.Keyword(null,"import","import",-1399500709));
(cljs.analyzer._STAR_cljs_ns_STAR_ = name);

var require_info = cljs.core.PersistentHashMap.fromArrays([new cljs.core.Keyword(null,"rename-macros","rename-macros",1076432512),new cljs.core.Keyword(null,"renames","renames",343278368),new cljs.core.Keyword(null,"use-macros","use-macros",-905638393),new cljs.core.Keyword(null,"excludes","excludes",-1791725945),new cljs.core.Keyword(null,"name","name",1843675177),new cljs.core.Keyword(null,"imports","imports",-1249933394),new cljs.core.Keyword(null,"requires","requires",-1201390927),new cljs.core.Keyword(null,"uses","uses",232664692),new cljs.core.Keyword(null,"require-macros","require-macros",707947416),new cljs.core.Keyword(null,"as-aliases","as-aliases",1485064798)],[rename_macros,cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([renames,core_renames__$1], 0)),use_macros,excludes,name,imports,requires,uses,require_macros,as_aliases]);
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$variadic(cljs.env._STAR_compiler_STAR_,cljs.core.update_in,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("cljs.analyzer","namespaces","cljs.analyzer/namespaces",-260788927),name], null),cljs.analyzer.merge_ns_info,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([require_info,env], 0));

return cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 6, [new cljs.core.Keyword(null,"op","op",-1882987955),new cljs.core.Keyword(null,"ns*","ns*",200417856),new cljs.core.Keyword(null,"env","env",-1815813235),env,new cljs.core.Keyword(null,"form","form",-1624062471),form,new cljs.core.Keyword(null,"deps","deps",1883360319),cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentVector.EMPTY,cljs.core.distinct.cljs$core$IFn$_invoke$arity$1(cljs.core.deref(deps))),new cljs.core.Keyword(null,"reload","reload",863702807),cljs.core.deref(reload),new cljs.core.Keyword(null,"reloads","reloads",610698522),cljs.core.deref(reloads)], null),(function (){var G__46871 = require_info;
var G__46871__$1 = (cljs.core.truth_((function (){var fexpr__46872 = cljs.core.deref(reload);
return (fexpr__46872.cljs$core$IFn$_invoke$arity$1 ? fexpr__46872.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"use","use",-1846382424)) : fexpr__46872.call(null,new cljs.core.Keyword(null,"use","use",-1846382424)));
})())?cljs.core.update_in.cljs$core$IFn$_invoke$arity$3(G__46871,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"uses","uses",232664692)], null),(function (m){
return cljs.core.with_meta(m,cljs.core.PersistentArrayMap.createAsIfByAssoc([(function (){var fexpr__46874 = cljs.core.deref(reload);
return (fexpr__46874.cljs$core$IFn$_invoke$arity$1 ? fexpr__46874.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"use","use",-1846382424)) : fexpr__46874.call(null,new cljs.core.Keyword(null,"use","use",-1846382424)));
})(),true]));
})):G__46871);
if(cljs.core.truth_((function (){var fexpr__46877 = cljs.core.deref(reload);
return (fexpr__46877.cljs$core$IFn$_invoke$arity$1 ? fexpr__46877.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"require","require",-468001333)) : fexpr__46877.call(null,new cljs.core.Keyword(null,"require","require",-468001333)));
})())){
return cljs.core.update_in.cljs$core$IFn$_invoke$arity$3(G__46871__$1,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"requires","requires",-1201390927)], null),(function (m){
return cljs.core.with_meta(m,cljs.core.PersistentArrayMap.createAsIfByAssoc([(function (){var fexpr__46883 = cljs.core.deref(reload);
return (fexpr__46883.cljs$core$IFn$_invoke$arity$1 ? fexpr__46883.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"require","require",-468001333)) : fexpr__46883.call(null,new cljs.core.Keyword(null,"require","require",-468001333)));
})(),true]));
}));
} else {
return G__46871__$1;
}
})()], 0));
}));
cljs.analyzer.parse_type = (function cljs$analyzer$parse_type(op,env,p__46899){
var vec__46904 = p__46899;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__46904,(0),null);
var tsym = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__46904,(1),null);
var fields = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__46904,(2),null);
var pmasks = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__46904,(3),null);
var body = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__46904,(4),null);
var form = vec__46904;
var t = new cljs.core.Keyword(null,"name","name",1843675177).cljs$core$IFn$_invoke$arity$1(cljs.analyzer.resolve_var.cljs$core$IFn$_invoke$arity$2(cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(env,new cljs.core.Keyword(null,"locals","locals",535295783)),tsym));
var locals = cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (m,fld){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(m,fld,cljs.core.PersistentHashMap.fromArrays([new cljs.core.Keyword(null,"name","name",1843675177),new cljs.core.Keyword(null,"field","field",-1302436500),new cljs.core.Keyword(null,"column","column",2078222095),new cljs.core.Keyword(null,"unsynchronized-mutable","unsynchronized-mutable",-164143950),new cljs.core.Keyword(null,"line","line",212345235),new cljs.core.Keyword(null,"tag","tag",-1290361223),new cljs.core.Keyword(null,"mutable","mutable",875778266),new cljs.core.Keyword(null,"volatile-mutable","volatile-mutable",1731728411),new cljs.core.Keyword(null,"shadow","shadow",873231803),new cljs.core.Keyword(null,"local","local",-1497766724)],[fld,true,cljs.analyzer.get_col(fld,env),new cljs.core.Keyword(null,"unsynchronized-mutable","unsynchronized-mutable",-164143950).cljs$core$IFn$_invoke$arity$1(cljs.core.meta(fld)),cljs.analyzer.get_line(fld,env),new cljs.core.Keyword(null,"tag","tag",-1290361223).cljs$core$IFn$_invoke$arity$1(cljs.core.meta(fld)),new cljs.core.Keyword(null,"mutable","mutable",875778266).cljs$core$IFn$_invoke$arity$1(cljs.core.meta(fld)),new cljs.core.Keyword(null,"volatile-mutable","volatile-mutable",1731728411).cljs$core$IFn$_invoke$arity$1(cljs.core.meta(fld)),(m.cljs$core$IFn$_invoke$arity$1 ? m.cljs$core$IFn$_invoke$arity$1(fld) : m.call(null,fld)),new cljs.core.Keyword(null,"field","field",-1302436500)]));
}),cljs.core.PersistentArrayMap.EMPTY,((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"defrecord","defrecord",-1367493418),op))?cljs.core.concat.cljs$core$IFn$_invoke$arity$2(fields,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"__meta","__meta",-946752628,null),new cljs.core.Symbol(null,"__extmap","__extmap",-1435580931,null),cljs.core.with_meta(new cljs.core.Symbol(null,"__hash","__hash",-1328796629,null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"mutable","mutable",875778266),true], null))], null)):fields));
var protocols = new cljs.core.Keyword(null,"protocols","protocols",-5615896).cljs$core$IFn$_invoke$arity$1(cljs.core.meta(tsym));
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(cljs.env._STAR_compiler_STAR_,cljs.core.update_in,new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("cljs.analyzer","namespaces","cljs.analyzer/namespaces",-260788927),new cljs.core.Keyword(null,"name","name",1843675177).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"ns","ns",441598760).cljs$core$IFn$_invoke$arity$1(env)),new cljs.core.Keyword(null,"defs","defs",1398449717),tsym], null),(function (m){
var m__$1 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic((function (){var or__5002__auto__ = m;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.PersistentArrayMap.EMPTY;
}
})(),new cljs.core.Keyword(null,"name","name",1843675177),t,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"tag","tag",-1290361223),new cljs.core.Symbol(null,"function","function",-486723946,null),new cljs.core.Keyword(null,"type","type",1174270348),true,new cljs.core.Keyword(null,"num-fields","num-fields",1529154024),cljs.core.count(fields),new cljs.core.Keyword(null,"record","record",-779106859),cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"defrecord","defrecord",-1367493418),op)], 0));
return cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([m__$1,cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(cljs.core.meta(tsym),new cljs.core.Keyword(null,"protocols","protocols",-5615896)),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"protocols","protocols",-5615896),protocols], null),cljs.analyzer.source_info.cljs$core$IFn$_invoke$arity$2(tsym,env)], 0));
}));

return cljs.core.PersistentHashMap.fromArrays([new cljs.core.Keyword(null,"children","children",-940561982),new cljs.core.Keyword(null,"pmasks","pmasks",-871416698),new cljs.core.Keyword(null,"protocols","protocols",-5615896),new cljs.core.Keyword(null,"fields","fields",-1932066230),new cljs.core.Keyword(null,"op","op",-1882987955),new cljs.core.Keyword(null,"env","env",-1815813235),new cljs.core.Keyword(null,"t","t",-1397832519),new cljs.core.Keyword(null,"form","form",-1624062471),new cljs.core.Keyword(null,"tag","tag",-1290361223),new cljs.core.Keyword(null,"body","body",-2049205669)],[new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"body","body",-2049205669)], null),pmasks,cljs.core.disj.cljs$core$IFn$_invoke$arity$2(protocols,new cljs.core.Symbol("cljs.core","Object","cljs.core/Object",-345545431,null)),fields,op,env,t,form,new cljs.core.Symbol(null,"function","function",-486723946,null),(function (){var G__46921 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(env,new cljs.core.Keyword(null,"locals","locals",535295783),locals);
var G__46922 = body;
return (cljs.analyzer.analyze.cljs$core$IFn$_invoke$arity$2 ? cljs.analyzer.analyze.cljs$core$IFn$_invoke$arity$2(G__46921,G__46922) : cljs.analyzer.analyze.call(null,G__46921,G__46922));
})()]);
});
cljs.analyzer.parse.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Symbol(null,"deftype*","deftype*",962659890,null),(function (_,env,form,___$1,___$2){
return cljs.analyzer.parse_type(new cljs.core.Keyword(null,"deftype","deftype",340294561),env,form);
}));
cljs.analyzer.parse.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Symbol(null,"defrecord*","defrecord*",-1936366207,null),(function (_,env,form,___$1,___$2){
return cljs.analyzer.parse_type(new cljs.core.Keyword(null,"defrecord","defrecord",-1367493418),env,form);
}));
cljs.analyzer.property_symbol_QMARK_ = (function cljs$analyzer$property_symbol_QMARK_(p1__46927_SHARP_){
return cljs.core.boolean$((function (){var and__5000__auto__ = (p1__46927_SHARP_ instanceof cljs.core.Symbol);
if(and__5000__auto__){
return cljs.core.re_matches(/^-.*/,cljs.core.name(p1__46927_SHARP_));
} else {
return and__5000__auto__;
}
})());
});
cljs.analyzer.classify_dot_form = (function cljs$analyzer$classify_dot_form(p__46934){
var vec__46936 = p__46934;
var target = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__46936,(0),null);
var member = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__46936,(1),null);
var args = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__46936,(2),null);
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [(((target == null))?new cljs.core.Keyword("cljs.analyzer","error","cljs.analyzer/error",-65289642):new cljs.core.Keyword("cljs.analyzer","expr","cljs.analyzer/expr",1708655889)
),((cljs.analyzer.property_symbol_QMARK_(member))?new cljs.core.Keyword("cljs.analyzer","property","cljs.analyzer/property",1113330886):(((member instanceof cljs.core.Symbol))?new cljs.core.Keyword("cljs.analyzer","symbol","cljs.analyzer/symbol",933248902):((cljs.core.seq_QMARK_(member))?new cljs.core.Keyword("cljs.analyzer","list","cljs.analyzer/list",-539585923):new cljs.core.Keyword("cljs.analyzer","error","cljs.analyzer/error",-65289642)
))),(((args == null))?cljs.core.List.EMPTY:new cljs.core.Keyword("cljs.analyzer","expr","cljs.analyzer/expr",1708655889)
)], null);
});
if((typeof cljs !== 'undefined') && (typeof cljs.analyzer !== 'undefined') && (typeof cljs.analyzer.build_dot_form !== 'undefined')){
} else {
cljs.analyzer.build_dot_form = (function (){var method_table__5599__auto__ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
var prefer_table__5600__auto__ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
var method_cache__5601__auto__ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
var cached_hierarchy__5602__auto__ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
var hierarchy__5603__auto__ = cljs.core.get.cljs$core$IFn$_invoke$arity$3(cljs.core.PersistentArrayMap.EMPTY,new cljs.core.Keyword(null,"hierarchy","hierarchy",-1053470341),(function (){var fexpr__46947 = cljs.core.get_global_hierarchy;
return (fexpr__46947.cljs$core$IFn$_invoke$arity$0 ? fexpr__46947.cljs$core$IFn$_invoke$arity$0() : fexpr__46947.call(null));
})());
return (new cljs.core.MultiFn(cljs.core.symbol.cljs$core$IFn$_invoke$arity$2("cljs.analyzer","build-dot-form"),(function (p1__46943_SHARP_){
return cljs.analyzer.classify_dot_form(p1__46943_SHARP_);
}),new cljs.core.Keyword(null,"default","default",-1987822328),hierarchy__5603__auto__,method_table__5599__auto__,prefer_table__5600__auto__,method_cache__5601__auto__,cached_hierarchy__5602__auto__));
})();
}
cljs.analyzer.build_dot_form.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("cljs.analyzer","expr","cljs.analyzer/expr",1708655889),new cljs.core.Keyword("cljs.analyzer","property","cljs.analyzer/property",1113330886),cljs.core.List.EMPTY], null),(function (p__46965){
var vec__46968 = p__46965;
var target = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__46968,(0),null);
var prop = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__46968,(1),null);
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__46968,(2),null);
return new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"dot-action","dot-action",-1460119601),new cljs.core.Keyword("cljs.analyzer","access","cljs.analyzer/access",-1639036494),new cljs.core.Keyword(null,"target","target",253001721),target,new cljs.core.Keyword(null,"field","field",-1302436500),cljs.core.with_meta(cljs.core.symbol.cljs$core$IFn$_invoke$arity$1(cljs.core.name(prop).substring((1))),cljs.core.meta(prop))], null);
}));
cljs.analyzer.build_dot_form.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("cljs.analyzer","expr","cljs.analyzer/expr",1708655889),new cljs.core.Keyword("cljs.analyzer","property","cljs.analyzer/property",1113330886),new cljs.core.Keyword("cljs.analyzer","list","cljs.analyzer/list",-539585923)], null),(function (p__46989){
var vec__46993 = p__46989;
var target = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__46993,(0),null);
var prop = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__46993,(1),null);
var args = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__46993,(2),null);
throw (new Error(["Cannot provide arguments ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(args)," on property access ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(prop)].join('')));
}));
/**
 * Builds the intermediate method call map used to reason about the parsed form during
 *   compilation.
 */
cljs.analyzer.build_method_call = (function cljs$analyzer$build_method_call(target,meth,args){
if((meth instanceof cljs.core.Symbol)){
return new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"dot-action","dot-action",-1460119601),new cljs.core.Keyword("cljs.analyzer","call","cljs.analyzer/call",964149800),new cljs.core.Keyword(null,"target","target",253001721),target,new cljs.core.Keyword(null,"method","method",55703592),meth,new cljs.core.Keyword(null,"args","args",1315556576),args], null);
} else {
return new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"dot-action","dot-action",-1460119601),new cljs.core.Keyword("cljs.analyzer","call","cljs.analyzer/call",964149800),new cljs.core.Keyword(null,"target","target",253001721),target,new cljs.core.Keyword(null,"method","method",55703592),cljs.core.first(meth),new cljs.core.Keyword(null,"args","args",1315556576),args], null);
}
});
cljs.analyzer.build_dot_form.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("cljs.analyzer","expr","cljs.analyzer/expr",1708655889),new cljs.core.Keyword("cljs.analyzer","symbol","cljs.analyzer/symbol",933248902),new cljs.core.Keyword("cljs.analyzer","expr","cljs.analyzer/expr",1708655889)], null),(function (p__46999){
var vec__47001 = p__46999;
var target = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__47001,(0),null);
var meth = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__47001,(1),null);
var args = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__47001,(2),null);
return cljs.analyzer.build_method_call(target,meth,args);
}));
cljs.analyzer.build_dot_form.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("cljs.analyzer","expr","cljs.analyzer/expr",1708655889),new cljs.core.Keyword("cljs.analyzer","symbol","cljs.analyzer/symbol",933248902),cljs.core.List.EMPTY], null),(function (p__47005){
var vec__47007 = p__47005;
var target = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__47007,(0),null);
var meth = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__47007,(1),null);
var args = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__47007,(2),null);
return cljs.analyzer.build_method_call(target,meth,args);
}));
cljs.analyzer.build_dot_form.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("cljs.analyzer","expr","cljs.analyzer/expr",1708655889),new cljs.core.Keyword("cljs.analyzer","list","cljs.analyzer/list",-539585923),cljs.core.List.EMPTY], null),(function (p__47011){
var vec__47012 = p__47011;
var target = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__47012,(0),null);
var meth_expr = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__47012,(1),null);
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__47012,(2),null);
return cljs.analyzer.build_method_call(target,cljs.core.first(meth_expr),cljs.core.rest(meth_expr));
}));
cljs.analyzer.build_dot_form.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"default","default",-1987822328),(function (dot_form){
throw (new Error(["Unknown dot form of ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.list_STAR_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Symbol(null,".",".",1975675962,null),dot_form))," with classification ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.analyzer.classify_dot_form(dot_form))].join('')));
}));
cljs.analyzer.analyze_dot = (function cljs$analyzer$analyze_dot(env,target,field,member_PLUS_,form){
var v = new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [target,field,member_PLUS_], null);
var map__47033 = cljs.analyzer.build_dot_form.cljs$core$IFn$_invoke$arity$1(v);
var map__47033__$1 = cljs.core.__destructure_map(map__47033);
var dot_action = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__47033__$1,new cljs.core.Keyword(null,"dot-action","dot-action",-1460119601));
var target__$1 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__47033__$1,new cljs.core.Keyword(null,"target","target",253001721));
var method = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__47033__$1,new cljs.core.Keyword(null,"method","method",55703592));
var field__$1 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__47033__$1,new cljs.core.Keyword(null,"field","field",-1302436500));
var args = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__47033__$1,new cljs.core.Keyword(null,"args","args",1315556576));
var enve = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(env,new cljs.core.Keyword(null,"context","context",-830191113),new cljs.core.Keyword(null,"expr","expr",745722291));
var targetexpr = (cljs.analyzer.analyze.cljs$core$IFn$_invoke$arity$2 ? cljs.analyzer.analyze.cljs$core$IFn$_invoke$arity$2(enve,target__$1) : cljs.analyzer.analyze.call(null,enve,target__$1));
var form_meta = cljs.core.meta(form);
var target_tag = new cljs.core.Keyword(null,"tag","tag",-1290361223).cljs$core$IFn$_invoke$arity$1(targetexpr);
var prop = (function (){var or__5002__auto__ = field__$1;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return method;
}
})();
var tag = (function (){var or__5002__auto__ = new cljs.core.Keyword(null,"tag","tag",-1290361223).cljs$core$IFn$_invoke$arity$1(form_meta);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = (function (){var and__5000__auto__ = cljs.analyzer.js_tag_QMARK_(target_tag);
if(and__5000__auto__){
return cljs.core.vary_meta.cljs$core$IFn$_invoke$arity$5(cljs.analyzer.normalize_js_tag(target_tag),cljs.core.update_in,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"prefix","prefix",-265908465)], null),cljs.core.fnil.cljs$core$IFn$_invoke$arity$2(cljs.core.conj,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"Object","Object",61210754,null)], null)),prop);
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
return null;
}
}
})();
if(((cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Symbol(null,"constructor","constructor",-313397284,null),prop)) && ((((!(clojure.string.starts_with_QMARK_(cljs.core.str.cljs$core$IFn$_invoke$arity$1(prop),"cljs$")))) && (cljs.core.not(new cljs.core.Keyword(null,"protocol-prop","protocol-prop",-58388138).cljs$core$IFn$_invoke$arity$1(cljs.core.meta(prop)))))))){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Symbol(null,"Object","Object",61210754,null),cljs.core.first(new cljs.core.Keyword(null,"prefix","prefix",-265908465).cljs$core$IFn$_invoke$arity$1(cljs.core.meta(tag))))){
cljs.analyzer.warning(new cljs.core.Keyword(null,"infer-warning","infer-warning",-1600671410),env,new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"warn-type","warn-type",-790105219),new cljs.core.Keyword(null,"object","object",1474613949),new cljs.core.Keyword(null,"form","form",-1624062471),form,new cljs.core.Keyword(null,"property","property",-1114278232),prop], null));
} else {
}

if(cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Symbol(null,"js","js",-886355190,null),target_tag)){
if(cljs.core.truth_((function (){var or__5002__auto__ = (target_tag == null);
if(or__5002__auto__){
return or__5002__auto__;
} else {
var fexpr__47067 = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Symbol(null,"any","any",-948528346,null),"null"], null), null);
return (fexpr__47067.cljs$core$IFn$_invoke$arity$1 ? fexpr__47067.cljs$core$IFn$_invoke$arity$1(target_tag) : fexpr__47067.call(null,target_tag));
}
})())){
cljs.analyzer.warning(new cljs.core.Keyword(null,"infer-warning","infer-warning",-1600671410),env,new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"warn-type","warn-type",-790105219),new cljs.core.Keyword(null,"target","target",253001721),new cljs.core.Keyword(null,"form","form",-1624062471),form,new cljs.core.Keyword(null,"property","property",-1114278232),prop], null));
} else {
}

var vec__47076_49282 = cljs.core.juxt.cljs$core$IFn$_invoke$arity$2(cljs.core.butlast,cljs.core.identity)(new cljs.core.Keyword(null,"prefix","prefix",-265908465).cljs$core$IFn$_invoke$arity$1(cljs.core.meta(tag)));
var pre_SINGLEQUOTE__49283 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__47076_49282,(0),null);
var pre_49284 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__47076_49282,(1),null);
if(cljs.core.truth_((function (){var and__5000__auto__ = cljs.analyzer.has_extern_QMARK_.cljs$core$IFn$_invoke$arity$1(pre_SINGLEQUOTE__49283);
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.not(cljs.analyzer.has_extern_QMARK_.cljs$core$IFn$_invoke$arity$1(pre_49284));
} else {
return and__5000__auto__;
}
})())){
cljs.analyzer.warning(new cljs.core.Keyword(null,"infer-warning","infer-warning",-1600671410),env,new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"warn-type","warn-type",-790105219),new cljs.core.Keyword(null,"property","property",-1114278232),new cljs.core.Keyword(null,"form","form",-1624062471),form,new cljs.core.Keyword(null,"type","type",1174270348),cljs.core.symbol.cljs$core$IFn$_invoke$arity$2("js",clojure.string.join.cljs$core$IFn$_invoke$arity$2(".",(function (){var G__47090 = pre_SINGLEQUOTE__49283;
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Symbol(null,"prototype","prototype",519166522,null),cljs.core.last(pre_SINGLEQUOTE__49283))){
return cljs.core.butlast(G__47090);
} else {
return G__47090;
}
})())),new cljs.core.Keyword(null,"property","property",-1114278232),prop], null));
} else {
}
} else {
}
} else {
}

if(cljs.analyzer.js_tag_QMARK_(tag)){
var pre_49285 = new cljs.core.Keyword(null,"prefix","prefix",-265908465).cljs$core$IFn$_invoke$arity$1(cljs.core.meta(tag));
if(cljs.core.truth_(cljs.analyzer.has_extern_QMARK_.cljs$core$IFn$_invoke$arity$1(pre_49285))){
} else {
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$variadic(cljs.env._STAR_compiler_STAR_,cljs.core.update_in,cljs.core.into.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("cljs.analyzer","namespaces","cljs.analyzer/namespaces",-260788927),new cljs.core.Keyword(null,"name","name",1843675177).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"ns","ns",441598760).cljs$core$IFn$_invoke$arity$1(env)),new cljs.core.Keyword(null,"externs","externs",221720677)], null),pre_49285),cljs.core.merge,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.PersistentArrayMap.EMPTY], 0));
}
} else {
}

var G__47103 = dot_action;
var G__47103__$1 = (((G__47103 instanceof cljs.core.Keyword))?G__47103.fqn:null);
switch (G__47103__$1) {
case "cljs.analyzer/access":
var children = new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"target","target",253001721)], null);
return new cljs.core.PersistentArrayMap(null, 7, [new cljs.core.Keyword(null,"op","op",-1882987955),new cljs.core.Keyword(null,"host-field","host-field",-72662140),new cljs.core.Keyword(null,"env","env",-1815813235),env,new cljs.core.Keyword(null,"form","form",-1624062471),form,new cljs.core.Keyword(null,"target","target",253001721),targetexpr,new cljs.core.Keyword(null,"field","field",-1302436500),field__$1,new cljs.core.Keyword(null,"children","children",-940561982),children,new cljs.core.Keyword(null,"tag","tag",-1290361223),((cljs.analyzer.js_tag_QMARK_(tag))?(function (){var or__5002__auto__ = cljs.analyzer.js_tag.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"prefix","prefix",-265908465).cljs$core$IFn$_invoke$arity$1(cljs.core.meta(tag)),new cljs.core.Keyword(null,"tag","tag",-1290361223));
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return tag;
}
})():tag)], null);

break;
case "cljs.analyzer/call":
var argexprs = cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (p1__47030_SHARP_){
return (cljs.analyzer.analyze.cljs$core$IFn$_invoke$arity$2 ? cljs.analyzer.analyze.cljs$core$IFn$_invoke$arity$2(enve,p1__47030_SHARP_) : cljs.analyzer.analyze.call(null,enve,p1__47030_SHARP_));
}),args);
var children = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"target","target",253001721),new cljs.core.Keyword(null,"args","args",1315556576)], null);
return new cljs.core.PersistentArrayMap(null, 8, [new cljs.core.Keyword(null,"op","op",-1882987955),new cljs.core.Keyword(null,"host-call","host-call",1059629755),new cljs.core.Keyword(null,"env","env",-1815813235),env,new cljs.core.Keyword(null,"form","form",-1624062471),form,new cljs.core.Keyword(null,"target","target",253001721),targetexpr,new cljs.core.Keyword(null,"method","method",55703592),method,new cljs.core.Keyword(null,"args","args",1315556576),argexprs,new cljs.core.Keyword(null,"children","children",-940561982),children,new cljs.core.Keyword(null,"tag","tag",-1290361223),((cljs.analyzer.js_tag_QMARK_(tag))?(function (){var or__5002__auto__ = cljs.analyzer.js_tag.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"prefix","prefix",-265908465).cljs$core$IFn$_invoke$arity$1(cljs.core.meta(tag)),new cljs.core.Keyword(null,"ret-tag","ret-tag",1705919990));
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Symbol(null,"js","js",-886355190,null);
}
})():tag)], null);

break;
default:
throw (new Error(["No matching clause: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(G__47103__$1)].join('')));

}
});
cljs.analyzer.parse.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Symbol(null,".",".",1975675962,null),(function (_,env,p__47129,___$1,___$2){
var vec__47130 = p__47129;
var seq__47131 = cljs.core.seq(vec__47130);
var first__47132 = cljs.core.first(seq__47131);
var seq__47131__$1 = cljs.core.next(seq__47131);
var ___$3 = first__47132;
var first__47132__$1 = cljs.core.first(seq__47131__$1);
var seq__47131__$2 = cljs.core.next(seq__47131__$1);
var target = first__47132__$1;
var vec__47133 = seq__47131__$2;
var seq__47134 = cljs.core.seq(vec__47133);
var first__47135 = cljs.core.first(seq__47134);
var seq__47134__$1 = cljs.core.next(seq__47134);
var field = first__47135;
var member_PLUS_ = seq__47134__$1;
var form = vec__47130;
var _STAR_recur_frames_STAR__orig_val__47140 = cljs.analyzer._STAR_recur_frames_STAR_;
var _STAR_recur_frames_STAR__temp_val__47141 = cljs.core.cons(null,cljs.analyzer._STAR_recur_frames_STAR_);
(cljs.analyzer._STAR_recur_frames_STAR_ = _STAR_recur_frames_STAR__temp_val__47141);

try{return cljs.analyzer.analyze_dot(env,target,field,member_PLUS_,form);
}finally {(cljs.analyzer._STAR_recur_frames_STAR_ = _STAR_recur_frames_STAR__orig_val__47140);
}}));
cljs.analyzer.get_js_tag = (function cljs$analyzer$get_js_tag(form){
var form_meta = cljs.core.meta(form);
var temp__5806__auto__ = new cljs.core.Keyword(null,"tag","tag",-1290361223).cljs$core$IFn$_invoke$arity$1(form_meta);
if((temp__5806__auto__ == null)){
if(new cljs.core.Keyword(null,"numeric","numeric",-1495594714).cljs$core$IFn$_invoke$arity$1(form_meta) === true){
return new cljs.core.Symbol(null,"number","number",-1084057331,null);
} else {
return null;
}
} else {
var tag = temp__5806__auto__;
return tag;
}
});
cljs.analyzer.js_star_interp = (function cljs$analyzer$js_star_interp(env,s){
var idx = s.indexOf("~{");
if(((-1) === idx)){
return (new cljs.core.List(null,s,null,(1),null));
} else {
var end = s.indexOf("}",idx);
var inner = new cljs.core.Keyword(null,"name","name",1843675177).cljs$core$IFn$_invoke$arity$1(cljs.analyzer.resolve_existing_var(env,cljs.core.symbol.cljs$core$IFn$_invoke$arity$1(cljs.core.subs.cljs$core$IFn$_invoke$arity$3(s,((2) + idx),end))));
return (new cljs.core.LazySeq(null,(function (){
return cljs.core.cons(cljs.core.subs.cljs$core$IFn$_invoke$arity$3(s,(0),idx),cljs.core.cons(inner,(function (){var G__47180 = env;
var G__47181 = cljs.core.subs.cljs$core$IFn$_invoke$arity$2(s,(end + (1)));
return (cljs.analyzer.js_star_interp.cljs$core$IFn$_invoke$arity$2 ? cljs.analyzer.js_star_interp.cljs$core$IFn$_invoke$arity$2(G__47180,G__47181) : cljs.analyzer.js_star_interp.call(null,G__47180,G__47181));
})()));
}),null,null));
}
});
cljs.analyzer.js_star_seg = (function cljs$analyzer$js_star_seg(s){
var idx = s.indexOf("~{");
if(((-1) === idx)){
return (new cljs.core.List(null,s,null,(1),null));
} else {
var end = s.indexOf("}",idx);
return (new cljs.core.LazySeq(null,(function (){
return cljs.core.cons(cljs.core.subs.cljs$core$IFn$_invoke$arity$3(s,(0),idx),(function (){var G__47195 = cljs.core.subs.cljs$core$IFn$_invoke$arity$2(s,(end + (1)));
return (cljs.analyzer.js_star_seg.cljs$core$IFn$_invoke$arity$1 ? cljs.analyzer.js_star_seg.cljs$core$IFn$_invoke$arity$1(G__47195) : cljs.analyzer.js_star_seg.call(null,G__47195));
})());
}),null,null));
}
});
cljs.analyzer.NUMERIC_SET = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Symbol(null,"any","any",-948528346,null),"null",new cljs.core.Symbol(null,"long","long",1469079434,null),"null",new cljs.core.Symbol(null,"double","double",-1769548886,null),"null",new cljs.core.Symbol(null,"number","number",-1084057331,null),"null"], null), null);
cljs.analyzer.numeric_type_QMARK_ = (function cljs$analyzer$numeric_type_QMARK_(t){
if((t == null)){
return true;
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Symbol(null,"clj-nil","clj-nil",1321798654,null),t)){
return true;
} else {
if(cljs.analyzer.js_tag_QMARK_(t)){
return true;
} else {
if((((t instanceof cljs.core.Symbol)) && ((!((cljs.core.get.cljs$core$IFn$_invoke$arity$2(cljs.analyzer.NUMERIC_SET,t) == null)))))){
return true;
} else {
if(cljs.analyzer.impl.cljs_set_QMARK_(t)){
return ((cljs.core.contains_QMARK_(t,new cljs.core.Symbol(null,"number","number",-1084057331,null))) || (((cljs.core.contains_QMARK_(t,new cljs.core.Symbol(null,"long","long",1469079434,null))) || (((cljs.core.contains_QMARK_(t,new cljs.core.Symbol(null,"double","double",-1769548886,null))) || (((cljs.core.contains_QMARK_(t,new cljs.core.Symbol(null,"any","any",-948528346,null))) || (cljs.core.contains_QMARK_(t,new cljs.core.Symbol(null,"js","js",-886355190,null))))))))));
} else {
return null;
}
}

}
}
}
});
cljs.analyzer.array_types = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 10, [new cljs.core.Symbol(null,"boolean","boolean",-278886877,null),"null",new cljs.core.Symbol(null,"floats","floats",513591110,null),"null",new cljs.core.Symbol(null,"longs","longs",-1017696020,null),"null",new cljs.core.Symbol(null,"objects","objects",-554722035,null),"null",new cljs.core.Symbol(null,"array","array",-440182315,null),"null",new cljs.core.Symbol(null,"doubles","doubles",-1517872169,null),"null",new cljs.core.Symbol(null,"chars","chars",545901210,null),"null",new cljs.core.Symbol(null,"ints","ints",-1761239845,null),"null",new cljs.core.Symbol(null,"shorts","shorts",107738238,null),"null",new cljs.core.Symbol(null,"bytes","bytes",-1478569089,null),"null"], null), null);
cljs.analyzer.array_type_QMARK_ = (function cljs$analyzer$array_type_QMARK_(t){
if((t == null)){
return true;
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Symbol(null,"clj-nil","clj-nil",1321798654,null),t)){
return true;
} else {
if(cljs.analyzer.js_tag_QMARK_(t)){
return true;
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Symbol(null,"any","any",-948528346,null),t)){
return true;
} else {
if(cljs.core.contains_QMARK_(cljs.analyzer.array_types,t)){
return true;
} else {
return cljs.core.boolean$(((cljs.analyzer.impl.cljs_set_QMARK_(t))?(function (){var or__5002__auto__ = cljs.core.contains_QMARK_(t,new cljs.core.Symbol(null,"any","any",-948528346,null));
if(or__5002__auto__){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = cljs.core.contains_QMARK_(t,new cljs.core.Symbol(null,"js","js",-886355190,null));
if(or__5002__auto____$1){
return or__5002__auto____$1;
} else {
return cljs.core.some(cljs.analyzer.array_types,t);
}
}
})():null));

}
}
}
}
}
});
cljs.analyzer.analyze_js_star_args = (function cljs$analyzer$analyze_js_star_args(js_op,env,args){
return cljs.core.first(cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (p__47204,arg){
var vec__47206 = p__47204;
var argexprs = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__47206,(0),null);
var env__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__47206,(1),null);
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.conj.cljs$core$IFn$_invoke$arity$2(argexprs,(cljs.analyzer.analyze.cljs$core$IFn$_invoke$arity$2 ? cljs.analyzer.analyze.cljs$core$IFn$_invoke$arity$2(env__$1,arg) : cljs.analyzer.analyze.call(null,env__$1,arg))),((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(js_op,new cljs.core.Symbol("cljs.core","and","cljs.core/and",-6692549,null)))?cljs.analyzer.set_test_induced_tags(env__$1,arg):env__$1)], null);
}),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.PersistentVector.EMPTY,env], null),args));
});
cljs.analyzer.analyze_js_star_STAR_ = (function cljs$analyzer$analyze_js_star_STAR_(env,jsform,args,form){
var enve = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(env,new cljs.core.Keyword(null,"context","context",-830191113),new cljs.core.Keyword(null,"expr","expr",745722291));
var form_meta = cljs.core.meta(form);
var segs = cljs.analyzer.js_star_seg(jsform);
var tag = cljs.analyzer.get_js_tag(form);
var js_op = new cljs.core.Keyword(null,"js-op","js-op",-1046277897).cljs$core$IFn$_invoke$arity$1(form_meta);
var argexprs = cljs.analyzer.analyze_js_star_args(js_op,enve,args);
var numeric = new cljs.core.Keyword(null,"numeric","numeric",-1495594714).cljs$core$IFn$_invoke$arity$1(form_meta);
var validate = (function (warning_type,valid_types_QMARK_){
var types = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__47210_SHARP_){
return cljs.analyzer.infer_tag(env,p1__47210_SHARP_);
}),argexprs);
if(cljs.core.truth_((valid_types_QMARK_.cljs$core$IFn$_invoke$arity$1 ? valid_types_QMARK_.cljs$core$IFn$_invoke$arity$1(types) : valid_types_QMARK_.call(null,types)))){
return null;
} else {
return cljs.analyzer.warning(warning_type,env,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"js-op","js-op",-1046277897),js_op,new cljs.core.Keyword(null,"types","types",590030639),cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentVector.EMPTY,types)], null));
}
});
var op_match_QMARK_ = (function (sym){
return cljs.core.symbol_identical_QMARK_(sym,new cljs.core.Keyword(null,"js-op","js-op",-1046277897).cljs$core$IFn$_invoke$arity$1(form_meta));
});
if(numeric === true){
validate(new cljs.core.Keyword(null,"invalid-arithmetic","invalid-arithmetic",1917075065),(function (p1__47211_SHARP_){
return cljs.core.every_QMARK_(cljs.analyzer.numeric_type_QMARK_,p1__47211_SHARP_);
}));
} else {
}

return cljs.core.PersistentHashMap.fromArrays([new cljs.core.Keyword(null,"args","args",1315556576),new cljs.core.Keyword(null,"children","children",-940561982),new cljs.core.Keyword(null,"numeric","numeric",-1495594714),new cljs.core.Keyword(null,"segs","segs",-1940299576),new cljs.core.Keyword(null,"op","op",-1882987955),new cljs.core.Keyword(null,"env","env",-1815813235),new cljs.core.Keyword(null,"js-op","js-op",-1046277897),new cljs.core.Keyword(null,"form","form",-1624062471),new cljs.core.Keyword(null,"tag","tag",-1290361223)],[argexprs,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"args","args",1315556576)], null),numeric,segs,new cljs.core.Keyword(null,"js","js",1768080579),env,js_op,form,tag]);
});
cljs.analyzer.analyze_js_star = (function cljs$analyzer$analyze_js_star(env,jsform,args,form){
var _STAR_recur_frames_STAR__orig_val__47212 = cljs.analyzer._STAR_recur_frames_STAR_;
var _STAR_recur_frames_STAR__temp_val__47213 = cljs.core.cons(null,cljs.analyzer._STAR_recur_frames_STAR_);
(cljs.analyzer._STAR_recur_frames_STAR_ = _STAR_recur_frames_STAR__temp_val__47213);

try{return cljs.analyzer.analyze_js_star_STAR_(env,jsform,args,form);
}finally {(cljs.analyzer._STAR_recur_frames_STAR_ = _STAR_recur_frames_STAR__orig_val__47212);
}});
cljs.analyzer.parse.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Symbol(null,"js*","js*",-1134233646,null),(function (op,env,p__47214,_,___$1){
var vec__47215 = p__47214;
var seq__47216 = cljs.core.seq(vec__47215);
var first__47217 = cljs.core.first(seq__47216);
var seq__47216__$1 = cljs.core.next(seq__47216);
var ___$2 = first__47217;
var first__47217__$1 = cljs.core.first(seq__47216__$1);
var seq__47216__$2 = cljs.core.next(seq__47216__$1);
var jsform = first__47217__$1;
var args = seq__47216__$2;
var form = vec__47215;
if(typeof jsform === 'string'){
} else {
throw cljs.analyzer.error.cljs$core$IFn$_invoke$arity$2(env,"Invalid js* form");
}

if((!((args == null)))){
return cljs.analyzer.analyze_js_star(env,jsform,args,form);
} else {
var code = cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core.str,cljs.analyzer.js_star_interp(env,jsform));
var tag = cljs.analyzer.get_js_tag(form);
var form_meta = cljs.core.meta(form);
var js_op = new cljs.core.Keyword(null,"js-op","js-op",-1046277897).cljs$core$IFn$_invoke$arity$1(form_meta);
var numeric = new cljs.core.Keyword(null,"numeric","numeric",-1495594714).cljs$core$IFn$_invoke$arity$1(form_meta);
return new cljs.core.PersistentArrayMap(null, 7, [new cljs.core.Keyword(null,"op","op",-1882987955),new cljs.core.Keyword(null,"js","js",1768080579),new cljs.core.Keyword(null,"env","env",-1815813235),env,new cljs.core.Keyword(null,"form","form",-1624062471),form,new cljs.core.Keyword(null,"code","code",1586293142),code,new cljs.core.Keyword(null,"tag","tag",-1290361223),tag,new cljs.core.Keyword(null,"js-op","js-op",-1046277897),js_op,new cljs.core.Keyword(null,"numeric","numeric",-1495594714),numeric], null);
}
}));
cljs.analyzer.unsorted_map_QMARK_ = (function cljs$analyzer$unsorted_map_QMARK_(x){
return ((cljs.core.map_QMARK_(x)) && ((!(cljs.core.sorted_QMARK_(x)))));
});
/**
 * Mark a form as being analyzed. Assumes x satisfies IMeta. Useful to suppress
 *   warnings that will have been caught by a first compiler pass.
 */
cljs.analyzer.analyzed = (function cljs$analyzer$analyzed(x){
if(cljs.analyzer.unsorted_map_QMARK_(x)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(x,new cljs.core.Keyword("cljs.analyzer","analyzed","cljs.analyzer/analyzed",-735094162),true);
} else {
return cljs.core.vary_meta.cljs$core$IFn$_invoke$arity$4(x,cljs.core.assoc,new cljs.core.Keyword("cljs.analyzer","analyzed","cljs.analyzer/analyzed",-735094162),true);

}
});
/**
 * Returns boolean if the form has already been marked as analyzed.
 */
cljs.analyzer.analyzed_QMARK_ = (function cljs$analyzer$analyzed_QMARK_(x){
return cljs.core.boolean$(((cljs.analyzer.unsorted_map_QMARK_(x))?new cljs.core.Keyword("cljs.analyzer","analyzed","cljs.analyzer/analyzed",-735094162).cljs$core$IFn$_invoke$arity$1(x):new cljs.core.Keyword("cljs.analyzer","analyzed","cljs.analyzer/analyzed",-735094162).cljs$core$IFn$_invoke$arity$1(cljs.core.meta(x))
));
});
cljs.analyzer.all_values_QMARK_ = (function cljs$analyzer$all_values_QMARK_(exprs){
return cljs.core.every_QMARK_((function (p1__47218_SHARP_){
return (((p1__47218_SHARP_ == null)) || ((((p1__47218_SHARP_ instanceof cljs.core.Symbol)) || (((typeof p1__47218_SHARP_ === 'string') || (((typeof p1__47218_SHARP_ === 'number') || (((p1__47218_SHARP_ === true) || (p1__47218_SHARP_ === false))))))))));
}),exprs);
});
cljs.analyzer.valid_arity_QMARK_ = (function cljs$analyzer$valid_arity_QMARK_(argc,method_params){
return (((method_params == null)) || (cljs.core.boolean$(cljs.core.some(cljs.core.PersistentHashSet.createAsIfByAssoc([argc]),cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.count,method_params)))));
});
cljs.analyzer.record_tag_QMARK_ = (function cljs$analyzer$record_tag_QMARK_(tag){
return cljs.core.boolean$((function (){var and__5000__auto__ = (tag instanceof cljs.core.Symbol);
if(and__5000__auto__){
var and__5000__auto____$1 = (!((cljs.core.namespace(tag) == null)));
if(and__5000__auto____$1){
return cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(cljs.env._STAR_compiler_STAR_),new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("cljs.analyzer","namespaces","cljs.analyzer/namespaces",-260788927),cljs.core.symbol.cljs$core$IFn$_invoke$arity$1(cljs.core.namespace(tag)),new cljs.core.Keyword(null,"defs","defs",1398449717),cljs.core.symbol.cljs$core$IFn$_invoke$arity$1(cljs.core.name(tag)),new cljs.core.Keyword(null,"record","record",-779106859)], null));
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})());
});
cljs.analyzer.record_basis = (function cljs$analyzer$record_basis(tag){
var positional_factory = cljs.core.symbol.cljs$core$IFn$_invoke$arity$1(["->",cljs.core.name(tag)].join(''));
var fields = cljs.core.first(cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(cljs.env._STAR_compiler_STAR_),new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("cljs.analyzer","namespaces","cljs.analyzer/namespaces",-260788927),cljs.core.symbol.cljs$core$IFn$_invoke$arity$1(cljs.core.namespace(tag)),new cljs.core.Keyword(null,"defs","defs",1398449717),positional_factory,new cljs.core.Keyword(null,"method-params","method-params",-980792179)], null)));
return cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentHashSet.EMPTY,fields);
});
cljs.analyzer.record_with_field_QMARK_ = (function cljs$analyzer$record_with_field_QMARK_(tag,field){
return ((cljs.analyzer.record_tag_QMARK_(tag)) && (cljs.core.contains_QMARK_(cljs.analyzer.record_basis(tag),field)));
});
cljs.analyzer.invalid_arity_QMARK_ = (function cljs$analyzer$invalid_arity_QMARK_(argc,method_params,variadic,max_fixed_arity){
var and__5000__auto__ = (!(cljs.analyzer.valid_arity_QMARK_(argc,method_params)));
if(and__5000__auto__){
var or__5002__auto__ = cljs.core.not(variadic);
if(or__5002__auto__){
return or__5002__auto__;
} else {
var and__5000__auto____$1 = variadic;
if(cljs.core.truth_(and__5000__auto____$1)){
return (argc < max_fixed_arity);
} else {
return and__5000__auto____$1;
}
}
} else {
return and__5000__auto__;
}
});
cljs.analyzer.parse_invoke_STAR_ = (function cljs$analyzer$parse_invoke_STAR_(env,p__47225){
var vec__47226 = p__47225;
var seq__47227 = cljs.core.seq(vec__47226);
var first__47228 = cljs.core.first(seq__47227);
var seq__47227__$1 = cljs.core.next(seq__47227);
var f = first__47228;
var args = seq__47227__$1;
var form = vec__47226;
var enve = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(env,new cljs.core.Keyword(null,"context","context",-830191113),new cljs.core.Keyword(null,"expr","expr",745722291));
var fexpr = (cljs.analyzer.analyze.cljs$core$IFn$_invoke$arity$2 ? cljs.analyzer.analyze.cljs$core$IFn$_invoke$arity$2(enve,f) : cljs.analyzer.analyze.call(null,enve,f));
var argc = cljs.core.count(args);
var fn_var_QMARK_ = (function (){var or__5002__auto__ = new cljs.core.Keyword(null,"fn-var","fn-var",1086204730).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"info","info",-317069002).cljs$core$IFn$_invoke$arity$1(fexpr));
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword(null,"js-fn-var","js-fn-var",-565665358).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"info","info",-317069002).cljs$core$IFn$_invoke$arity$1(fexpr));
}
})();
var kw_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Symbol("cljs.core","Keyword","cljs.core/Keyword",-451434488,null),new cljs.core.Keyword(null,"tag","tag",-1290361223).cljs$core$IFn$_invoke$arity$1(fexpr));
var cur_ns = new cljs.core.Keyword(null,"name","name",1843675177).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"ns","ns",441598760).cljs$core$IFn$_invoke$arity$1(env));
var HO_invoke_QMARK_ = ((cljs.core.boolean$(cljs.analyzer._STAR_cljs_static_fns_STAR_)) && (((cljs.core.not(fn_var_QMARK_)) && ((((!(cljs.analyzer.js_tag_QMARK_(f)))) && ((((!(kw_QMARK_))) && ((!(cljs.analyzer.analyzed_QMARK_(f)))))))))));
var bind_f_expr_QMARK_ = ((HO_invoke_QMARK_) && ((!((f instanceof cljs.core.Symbol)))));
var bind_args_QMARK_ = ((HO_invoke_QMARK_) && ((!(cljs.analyzer.all_values_QMARK_(args)))));
if(fn_var_QMARK_){
var map__47230_49328 = new cljs.core.Keyword(null,"info","info",-317069002).cljs$core$IFn$_invoke$arity$1(fexpr);
var map__47230_49329__$1 = cljs.core.__destructure_map(map__47230_49328);
var variadic_49330 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__47230_49329__$1,new cljs.core.Keyword(null,"variadic?","variadic?",584179762));
var max_fixed_arity_49331 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__47230_49329__$1,new cljs.core.Keyword(null,"max-fixed-arity","max-fixed-arity",-690205543));
var method_params_49332 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__47230_49329__$1,new cljs.core.Keyword(null,"method-params","method-params",-980792179));
var name_49333 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__47230_49329__$1,new cljs.core.Keyword(null,"name","name",1843675177));
var ns_49334 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__47230_49329__$1,new cljs.core.Keyword(null,"ns","ns",441598760));
var macro_49335 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__47230_49329__$1,new cljs.core.Keyword(null,"macro","macro",-867863404));
if(cljs.core.truth_((function (){var and__5000__auto__ = cljs.core.not((function (){var and__5000__auto__ = goog.string.endsWith(cljs.core.str.cljs$core$IFn$_invoke$arity$1(cur_ns),"$macros");
if(cljs.core.truth_(and__5000__auto__)){
return ((cljs.core.symbol_identical_QMARK_(cur_ns,ns_49334)) && (macro_49335 === true));
} else {
return and__5000__auto__;
}
})());
if(and__5000__auto__){
return cljs.analyzer.invalid_arity_QMARK_(argc,method_params_49332,variadic_49330,max_fixed_arity_49331);
} else {
return and__5000__auto__;
}
})())){
cljs.analyzer.warning(new cljs.core.Keyword(null,"fn-arity","fn-arity",-403576501),env,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"name","name",1843675177),name_49333,new cljs.core.Keyword(null,"argc","argc",-1452839519),argc], null));
} else {
}
} else {
}

if(((kw_QMARK_) && ((!(((((1) === argc)) || (((2) === argc)))))))){
cljs.analyzer.warning(new cljs.core.Keyword(null,"fn-arity","fn-arity",-403576501),env,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"name","name",1843675177),cljs.core.first(form),new cljs.core.Keyword(null,"argc","argc",-1452839519),argc], null));
} else {
}

var deprecated_QMARK__49336 = new cljs.core.Keyword(null,"deprecated","deprecated",1498275348).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"info","info",-317069002).cljs$core$IFn$_invoke$arity$1(fexpr));
var no_warn_QMARK__49337 = new cljs.core.Keyword(null,"deprecation-nowarn","deprecation-nowarn",-1762828044).cljs$core$IFn$_invoke$arity$1(cljs.core.meta(form));
if(((cljs.core.boolean$(deprecated_QMARK__49336)) && ((!(cljs.core.boolean$(no_warn_QMARK__49337)))))){
cljs.analyzer.warning(new cljs.core.Keyword(null,"fn-deprecated","fn-deprecated",626877647),env,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"fexpr","fexpr",-122857150),fexpr], null));
} else {
}

if((!((new cljs.core.Keyword(null,"type","type",1174270348).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"info","info",-317069002).cljs$core$IFn$_invoke$arity$1(fexpr)) == null)))){
cljs.analyzer.warning(new cljs.core.Keyword(null,"invoke-ctor","invoke-ctor",-756052704),env,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"fexpr","fexpr",-122857150),fexpr], null));
} else {
}

if(((bind_args_QMARK_) || (bind_f_expr_QMARK_))){
var arg_syms = ((bind_args_QMARK_)?cljs.core.take.cljs$core$IFn$_invoke$arity$2(argc,cljs.core.repeatedly.cljs$core$IFn$_invoke$arity$1(cljs.core.gensym)):null);
var f_sym = ((bind_f_expr_QMARK_)?cljs.core.gensym.cljs$core$IFn$_invoke$arity$1("fexpr__"):null);
var bindings = (function (){var G__47262 = cljs.core.PersistentVector.EMPTY;
var G__47262__$1 = ((bind_args_QMARK_)?cljs.core.into.cljs$core$IFn$_invoke$arity$2(G__47262,cljs.core.interleave.cljs$core$IFn$_invoke$arity$2(arg_syms,args)):G__47262);
if(bind_f_expr_QMARK_){
return cljs.core.conj.cljs$core$IFn$_invoke$arity$variadic(G__47262__$1,f_sym,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.analyzer.analyzed(f)], 0));
} else {
return G__47262__$1;
}
})();
var tag = new cljs.core.Keyword(null,"tag","tag",-1290361223).cljs$core$IFn$_invoke$arity$1(cljs.core.meta(form));
var G__47267 = env;
var G__47268 = cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic((new cljs.core.List(null,new cljs.core.Symbol("cljs.core","let","cljs.core/let",-308701135,null),null,(1),null)),(new cljs.core.List(null,cljs.core.vec(cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$1(bindings)))),null,(1),null)),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([(new cljs.core.List(null,cljs.core.with_meta(cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$2((new cljs.core.List(null,cljs.analyzer.analyzed(((bind_f_expr_QMARK_)?f_sym:f)),null,(1),null)),((bind_args_QMARK_)?arg_syms:args)))),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),tag], null)),null,(1),null))], 0))));
return (cljs.analyzer.analyze.cljs$core$IFn$_invoke$arity$2 ? cljs.analyzer.analyze.cljs$core$IFn$_invoke$arity$2(G__47267,G__47268) : cljs.analyzer.analyze.call(null,G__47267,G__47268));
} else {
var ana_expr = (function (p1__47222_SHARP_){
return (cljs.analyzer.analyze.cljs$core$IFn$_invoke$arity$2 ? cljs.analyzer.analyze.cljs$core$IFn$_invoke$arity$2(enve,p1__47222_SHARP_) : cljs.analyzer.analyze.call(null,enve,p1__47222_SHARP_));
});
var argexprs = cljs.core.mapv.cljs$core$IFn$_invoke$arity$2(ana_expr,args);
if((((((f instanceof cljs.core.Keyword)) && ((cljs.core.namespace(f) == null)))) && (((((1) === cljs.core.count(args))) && (cljs.analyzer.record_with_field_QMARK_(new cljs.core.Keyword(null,"tag","tag",-1290361223).cljs$core$IFn$_invoke$arity$1(cljs.core.first(argexprs)),cljs.core.symbol.cljs$core$IFn$_invoke$arity$1(cljs.core.name(f)))))))){
var field_access_form = cljs.core.list_STAR_.cljs$core$IFn$_invoke$arity$2(cljs.core.symbol.cljs$core$IFn$_invoke$arity$1([".-",cljs.core.name(f)].join('')),args);
var _STAR_cljs_warnings_STAR__orig_val__47308 = cljs.analyzer._STAR_cljs_warnings_STAR_;
var _STAR_cljs_warnings_STAR__temp_val__47309 = cljs.core.zipmap(cljs.core.keys(cljs.analyzer._STAR_cljs_warnings_STAR_),cljs.core.repeat.cljs$core$IFn$_invoke$arity$1(false));
(cljs.analyzer._STAR_cljs_warnings_STAR_ = _STAR_cljs_warnings_STAR__temp_val__47309);

try{return (cljs.analyzer.analyze.cljs$core$IFn$_invoke$arity$2 ? cljs.analyzer.analyze.cljs$core$IFn$_invoke$arity$2(env,field_access_form) : cljs.analyzer.analyze.call(null,env,field_access_form));
}finally {(cljs.analyzer._STAR_cljs_warnings_STAR_ = _STAR_cljs_warnings_STAR__orig_val__47308);
}} else {
return new cljs.core.PersistentArrayMap(null, 6, [new cljs.core.Keyword(null,"env","env",-1815813235),env,new cljs.core.Keyword(null,"op","op",-1882987955),new cljs.core.Keyword(null,"invoke","invoke",1145927159),new cljs.core.Keyword(null,"form","form",-1624062471),form,new cljs.core.Keyword(null,"fn","fn",-1175266204),fexpr,new cljs.core.Keyword(null,"args","args",1315556576),argexprs,new cljs.core.Keyword(null,"children","children",-940561982),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"fn","fn",-1175266204),new cljs.core.Keyword(null,"args","args",1315556576)], null)], null);
}
}
});
cljs.analyzer.parse_invoke = (function cljs$analyzer$parse_invoke(env,form){
var _STAR_recur_frames_STAR__orig_val__47313 = cljs.analyzer._STAR_recur_frames_STAR_;
var _STAR_recur_frames_STAR__temp_val__47314 = cljs.core.cons(null,cljs.analyzer._STAR_recur_frames_STAR_);
(cljs.analyzer._STAR_recur_frames_STAR_ = _STAR_recur_frames_STAR__temp_val__47314);

try{return cljs.analyzer.parse_invoke_STAR_(env,form);
}finally {(cljs.analyzer._STAR_recur_frames_STAR_ = _STAR_recur_frames_STAR__orig_val__47313);
}});
cljs.analyzer.desugar_dotted_expr = (function cljs$analyzer$desugar_dotted_expr(p__47320){
var map__47321 = p__47320;
var map__47321__$1 = cljs.core.__destructure_map(map__47321);
var expr = map__47321__$1;
var op = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__47321__$1,new cljs.core.Keyword(null,"op","op",-1882987955));
var G__47322 = op;
var G__47322__$1 = (((G__47322 instanceof cljs.core.Keyword))?G__47322.fqn:null);
switch (G__47322__$1) {
case "var":
case "local":
if(cljs.analyzer.dotted_symbol_QMARK_(cljs.core.symbol.cljs$core$IFn$_invoke$arity$1(cljs.core.name(new cljs.core.Keyword(null,"name","name",1843675177).cljs$core$IFn$_invoke$arity$1(expr))))){
var s = cljs.core.name(new cljs.core.Keyword(null,"name","name",1843675177).cljs$core$IFn$_invoke$arity$1(expr));
var idx = s.lastIndexOf(".");
var _ = ((cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2((idx + (1)),((s).length)))?null:(function(){throw (new Error("Assert failed: (not= (inc idx) (count s))"))})());
var prefix = cljs.core.with_meta(cljs.core.symbol.cljs$core$IFn$_invoke$arity$2(cljs.core.namespace(new cljs.core.Keyword(null,"name","name",1843675177).cljs$core$IFn$_invoke$arity$1(expr)),cljs.core.subs.cljs$core$IFn$_invoke$arity$3(s,(0),idx)),cljs.core.meta(new cljs.core.Keyword(null,"form","form",-1624062471).cljs$core$IFn$_invoke$arity$1(expr)));
var field = cljs.core.symbol.cljs$core$IFn$_invoke$arity$1(cljs.core.subs.cljs$core$IFn$_invoke$arity$2(s,(idx + (1))));
if(cljs.core.not(new cljs.core.Keyword(null,"const-expr","const-expr",-1379382292).cljs$core$IFn$_invoke$arity$1(expr))){
} else {
throw (new Error("Assert failed: (not (:const-expr expr))"));
}

return new cljs.core.PersistentArrayMap(null, 7, [new cljs.core.Keyword(null,"op","op",-1882987955),new cljs.core.Keyword(null,"host-field","host-field",-72662140),new cljs.core.Keyword(null,"env","env",-1815813235),new cljs.core.Keyword(null,"env","env",-1815813235).cljs$core$IFn$_invoke$arity$1(expr),new cljs.core.Keyword(null,"form","form",-1624062471),(new cljs.core.List(null,new cljs.core.Symbol(null,".",".",1975675962,null),(new cljs.core.List(null,prefix,(new cljs.core.List(null,field,null,(1),null)),(2),null)),(3),null)),new cljs.core.Keyword(null,"target","target",253001721),(function (){var G__47329 = cljs.core.assoc_in(cljs.core.assoc_in(cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(expr,new cljs.core.Keyword(null,"name","name",1843675177),prefix,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"form","form",-1624062471),prefix], 0)),new cljs.core.Keyword(null,"tag","tag",-1290361223)),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"info","info",-317069002),new cljs.core.Keyword(null,"name","name",1843675177)], null),prefix),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"env","env",-1815813235),new cljs.core.Keyword(null,"context","context",-830191113)], null),new cljs.core.Keyword(null,"expr","expr",745722291));
return (cljs.analyzer.desugar_dotted_expr.cljs$core$IFn$_invoke$arity$1 ? cljs.analyzer.desugar_dotted_expr.cljs$core$IFn$_invoke$arity$1(G__47329) : cljs.analyzer.desugar_dotted_expr.call(null,G__47329));
})(),new cljs.core.Keyword(null,"field","field",-1302436500),field,new cljs.core.Keyword(null,"tag","tag",-1290361223),new cljs.core.Keyword(null,"tag","tag",-1290361223).cljs$core$IFn$_invoke$arity$1(expr),new cljs.core.Keyword(null,"children","children",-940561982),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"target","target",253001721)], null)], null);
} else {
return expr;
}

break;
default:
return expr;

}
});
/**
 * Finds the var associated with sym
 */
cljs.analyzer.analyze_symbol = (function cljs$analyzer$analyze_symbol(env,sym){
if(new cljs.core.Keyword(null,"quoted?","quoted?",1464649621).cljs$core$IFn$_invoke$arity$1(env)){
cljs.analyzer.register_constant_BANG_.cljs$core$IFn$_invoke$arity$2(env,sym);

var G__47332 = new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"op","op",-1882987955),new cljs.core.Keyword(null,"const","const",1709929842),new cljs.core.Keyword(null,"val","val",128701612),sym,new cljs.core.Keyword(null,"env","env",-1815813235),env,new cljs.core.Keyword(null,"form","form",-1624062471),sym,new cljs.core.Keyword(null,"tag","tag",-1290361223),new cljs.core.Symbol("cljs.core","Symbol","cljs.core/Symbol",292989338,null)], null);
return (cljs.analyzer.analyze_wrap_meta.cljs$core$IFn$_invoke$arity$1 ? cljs.analyzer.analyze_wrap_meta.cljs$core$IFn$_invoke$arity$1(G__47332) : cljs.analyzer.analyze_wrap_meta.call(null,G__47332));
} else {
var map__47333 = cljs.core.meta(sym);
var map__47333__$1 = cljs.core.__destructure_map(map__47333);
var line = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__47333__$1,new cljs.core.Keyword(null,"line","line",212345235));
var column = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__47333__$1,new cljs.core.Keyword(null,"column","column",2078222095));
var env__$1 = (((!((line == null))))?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(env,new cljs.core.Keyword(null,"line","line",212345235),line):env);
var env__$2 = (((!((column == null))))?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(env__$1,new cljs.core.Keyword(null,"column","column",2078222095),column):env__$1);
var ret = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"env","env",-1815813235),env__$2,new cljs.core.Keyword(null,"form","form",-1624062471),sym], null);
var lcls = new cljs.core.Keyword(null,"locals","locals",535295783).cljs$core$IFn$_invoke$arity$1(env__$2);
var temp__5806__auto__ = cljs.analyzer.handle_symbol_local(sym,cljs.core.get.cljs$core$IFn$_invoke$arity$2(lcls,sym));
if((temp__5806__auto__ == null)){
var sym_meta = cljs.core.meta(sym);
var sym_ns = cljs.core.namespace(sym);
var cur_ns = cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"name","name",1843675177).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"ns","ns",441598760).cljs$core$IFn$_invoke$arity$1(env__$2)));
var sym__$1 = (cljs.core.truth_((function (){var and__5000__auto__ = sym_ns;
if(cljs.core.truth_(and__5000__auto__)){
var and__5000__auto____$1 = cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(sym_ns,"cljs.core");
if(and__5000__auto____$1){
var and__5000__auto____$2 = goog.string.endsWith(cur_ns,"$macros");
if(cljs.core.truth_(and__5000__auto____$2)){
return ((cljs.core.not(goog.string.endsWith(sym_ns,"$macros"))) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(sym_ns,cljs.core.subs.cljs$core$IFn$_invoke$arity$3(cur_ns,(0),(((cur_ns).length) - (7))))));
} else {
return and__5000__auto____$2;
}
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})())?cljs.core.symbol.cljs$core$IFn$_invoke$arity$2([sym_ns,"$macros"].join(''),cljs.core.name(sym)):sym);
var info = (((!(cljs.core.contains_QMARK_(sym_meta,new cljs.core.Keyword("cljs.analyzer","analyzed","cljs.analyzer/analyzed",-735094162)))))?cljs.analyzer.resolve_existing_var(env__$2,sym__$1):cljs.analyzer.resolve_var.cljs$core$IFn$_invoke$arity$2(env__$2,sym__$1));
if(cljs.core.truth_(new cljs.core.Keyword(null,"op","op",-1882987955).cljs$core$IFn$_invoke$arity$1(info))){
} else {
throw (new Error(["Assert failed: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"op","op",-1882987955).cljs$core$IFn$_invoke$arity$1(info)),"\n","(:op info)"].join('')));
}

return cljs.analyzer.desugar_dotted_expr((((!(new cljs.core.Keyword(null,"def-var","def-var",-698214377).cljs$core$IFn$_invoke$arity$1(env__$2) === true)))?cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(ret,new cljs.core.Keyword(null,"info","info",-317069002),info),cljs.core.select_keys(info,new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"op","op",-1882987955),new cljs.core.Keyword(null,"name","name",1843675177),new cljs.core.Keyword(null,"ns","ns",441598760),new cljs.core.Keyword(null,"tag","tag",-1290361223)], null)),(function (){var temp__5804__auto__ = new cljs.core.Keyword(null,"const-expr","const-expr",-1379382292).cljs$core$IFn$_invoke$arity$1(info);
if(cljs.core.truth_(temp__5804__auto__)){
var const_expr = temp__5804__auto__;
return new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"const-expr","const-expr",-1379382292),const_expr], null);
} else {
return null;
}
})()], 0)):(function (){var info__$1 = cljs.analyzer.resolve_var.cljs$core$IFn$_invoke$arity$2(env__$2,sym__$1);
return cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(ret,new cljs.core.Keyword(null,"op","op",-1882987955),new cljs.core.Keyword(null,"var","var",-769682797),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"info","info",-317069002),info__$1], 0)),cljs.core.select_keys(info__$1,new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"op","op",-1882987955),new cljs.core.Keyword(null,"name","name",1843675177),new cljs.core.Keyword(null,"ns","ns",441598760),new cljs.core.Keyword(null,"tag","tag",-1290361223)], null))], 0));
})()));
} else {
var lb = temp__5806__auto__;
return cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(ret,new cljs.core.Keyword(null,"op","op",-1882987955),new cljs.core.Keyword(null,"local","local",-1497766724),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"info","info",-317069002),lb], 0)),((cljs.core.map_QMARK_(lb))?cljs.core.select_keys(lb,new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"name","name",1843675177),new cljs.core.Keyword(null,"local","local",-1497766724),new cljs.core.Keyword(null,"arg-id","arg-id",-767177868),new cljs.core.Keyword(null,"variadic?","variadic?",584179762),new cljs.core.Keyword(null,"init","init",-1875481434)], null)):null)], 0));
}
}
});
cljs.analyzer.excluded_QMARK_ = (function cljs$analyzer$excluded_QMARK_(env,sym){
return (((!((cljs.analyzer.gets.cljs$core$IFn$_invoke$arity$4(env,new cljs.core.Keyword(null,"ns","ns",441598760),new cljs.core.Keyword(null,"excludes","excludes",-1791725945),sym) == null)))) || ((!((cljs.analyzer.gets.cljs$core$IFn$_invoke$arity$5(cljs.core.deref(cljs.env._STAR_compiler_STAR_),new cljs.core.Keyword("cljs.analyzer","namespaces","cljs.analyzer/namespaces",-260788927),cljs.analyzer.gets.cljs$core$IFn$_invoke$arity$3(env,new cljs.core.Keyword(null,"ns","ns",441598760),new cljs.core.Keyword(null,"name","name",1843675177)),new cljs.core.Keyword(null,"excludes","excludes",-1791725945),sym) == null)))));
});
cljs.analyzer.used_QMARK_ = (function cljs$analyzer$used_QMARK_(env,sym){
return (((!((cljs.analyzer.gets.cljs$core$IFn$_invoke$arity$4(env,new cljs.core.Keyword(null,"ns","ns",441598760),new cljs.core.Keyword(null,"use-macros","use-macros",-905638393),sym) == null)))) || ((!((cljs.analyzer.gets.cljs$core$IFn$_invoke$arity$5(cljs.core.deref(cljs.env._STAR_compiler_STAR_),new cljs.core.Keyword("cljs.analyzer","namespaces","cljs.analyzer/namespaces",-260788927),cljs.analyzer.gets.cljs$core$IFn$_invoke$arity$3(env,new cljs.core.Keyword(null,"ns","ns",441598760),new cljs.core.Keyword(null,"name","name",1843675177)),new cljs.core.Keyword(null,"use-macros","use-macros",-905638393),sym) == null)))));
});
cljs.analyzer.get_expander_ns = (function cljs$analyzer$get_expander_ns(env,nstr){
var res = (function (){var or__5002__auto__ = cljs.analyzer.resolve_macro_ns_alias.cljs$core$IFn$_invoke$arity$3(env,nstr,null);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.analyzer.resolve_ns_alias.cljs$core$IFn$_invoke$arity$3(env,nstr,null);
}
})();
var nstr__$1 = (((!((res == null))))?cljs.core.str.cljs$core$IFn$_invoke$arity$1(res):nstr);
if(("clojure.core" === nstr__$1)){
return cljs.core.find_macros_ns(cljs.analyzer.impl.CLJS_CORE_MACROS_SYM);
} else {
if(("clojure.repl" === nstr__$1)){
return cljs.core.find_macros_ns(new cljs.core.Symbol(null,"cljs.repl","cljs.repl",1767065658,null));
} else {
if(cljs.core.truth_(goog.string.contains(nstr__$1,"."))){
return cljs.core.find_macros_ns(cljs.core.symbol.cljs$core$IFn$_invoke$arity$1(nstr__$1));
} else {
var G__47356 = env;
var G__47356__$1 = (((G__47356 == null))?null:new cljs.core.Keyword(null,"ns","ns",441598760).cljs$core$IFn$_invoke$arity$1(G__47356));
var G__47356__$2 = (((G__47356__$1 == null))?null:new cljs.core.Keyword(null,"require-macros","require-macros",707947416).cljs$core$IFn$_invoke$arity$1(G__47356__$1));
var G__47356__$3 = (((G__47356__$2 == null))?null:cljs.core.get.cljs$core$IFn$_invoke$arity$2(G__47356__$2,cljs.core.symbol.cljs$core$IFn$_invoke$arity$1(nstr__$1)));
if((G__47356__$3 == null)){
return null;
} else {
return cljs.core.find_macros_ns(G__47356__$3);
}

}
}
}
});
cljs.analyzer.get_expander_STAR_ = (function cljs$analyzer$get_expander_STAR_(sym,env){
if((((!((cljs.analyzer.gets.cljs$core$IFn$_invoke$arity$3(env,new cljs.core.Keyword(null,"locals","locals",535295783),sym) == null)))) || (((cljs.analyzer.excluded_QMARK_(env,sym)) && ((!(cljs.analyzer.used_QMARK_(env,sym)))))))){
return null;
} else {
var nstr = cljs.core.namespace(sym);
if((!((nstr == null)))){
var ns = cljs.analyzer.get_expander_ns(env,nstr);
if((!((ns == null)))){
return ns.findInternedVar(cljs.core.symbol.cljs$core$IFn$_invoke$arity$1(cljs.core.name(sym)));
} else {
return null;
}
} else {
if((!((cljs.analyzer.gets.cljs$core$IFn$_invoke$arity$4(env,new cljs.core.Keyword(null,"ns","ns",441598760),new cljs.core.Keyword(null,"rename-macros","rename-macros",1076432512),sym) == null)))){
var qualified_symbol = cljs.analyzer.gets.cljs$core$IFn$_invoke$arity$4(env,new cljs.core.Keyword(null,"ns","ns",441598760),new cljs.core.Keyword(null,"rename-macros","rename-macros",1076432512),sym);
var nsym = cljs.core.symbol.cljs$core$IFn$_invoke$arity$1(cljs.core.namespace(qualified_symbol));
var sym__$1 = cljs.core.symbol.cljs$core$IFn$_invoke$arity$1(cljs.core.name(qualified_symbol));
return cljs.core.find_macros_ns(nsym).findInternedVar(sym__$1);
} else {
var nsym = cljs.analyzer.gets.cljs$core$IFn$_invoke$arity$4(env,new cljs.core.Keyword(null,"ns","ns",441598760),new cljs.core.Keyword(null,"use-macros","use-macros",-905638393),sym);
if((((!((nsym == null)))) && ((nsym instanceof cljs.core.Symbol)))){
return cljs.core.find_macros_ns(nsym).findInternedVar(sym);
} else {
return cljs.core.find_macros_ns(cljs.analyzer.impl.CLJS_CORE_MACROS_SYM).findInternedVar(sym);
}

}
}
}
});
/**
 * Given a sym, a symbol identifying a macro, and env, an analysis environment
 * return the corresponding Clojure macroexpander.
 */
cljs.analyzer.get_expander = (function cljs$analyzer$get_expander(sym,env){
var mvar = cljs.analyzer.get_expander_STAR_(sym,env);
if((((!((mvar == null)))) && (mvar.isMacro()))){
return mvar;
} else {
return null;
}
});
var cached_var_49366 = (new cljs.core.Delay((function (){
return cljs.core.get.cljs$core$IFn$_invoke$arity$2(cljs.core.ns_interns_STAR_(new cljs.core.Symbol(null,"cljs.spec.alpha","cljs.spec.alpha",505122844,null)),new cljs.core.Symbol(null,"macroexpand-check","macroexpand-check",699092091,null));
}),null));
cljs.analyzer.get_macroexpand_check_var = (function cljs$analyzer$get_macroexpand_check_var(){
if((!((cljs.core.find_ns_obj(new cljs.core.Symbol(null,"cljs.spec.alpha","cljs.spec.alpha",505122844,null)) == null)))){
return cljs.core.deref(cached_var_49366);
} else {
return null;
}
});
cljs.analyzer.var__GT_sym = (function cljs$analyzer$var__GT_sym(var$){
return var$.sym;
});
cljs.analyzer.do_macroexpand_check = (function cljs$analyzer$do_macroexpand_check(env,form,mac_var){
if(cljs.core.not(new cljs.core.Keyword(null,"spec-skip-macros","spec-skip-macros",-645015958).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"options","options",99638489).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(cljs.env._STAR_compiler_STAR_))))){
var mchk = cljs.analyzer.get_macroexpand_check_var();
if((!((mchk == null)))){
try{var G__47386 = mac_var;
var G__47387 = cljs.core.next(form);
return (mchk.cljs$core$IFn$_invoke$arity$2 ? mchk.cljs$core$IFn$_invoke$arity$2(G__47386,G__47387) : mchk.call(null,G__47386,G__47387));
}catch (e47384){var e = e47384;
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$3(null,cljs.analyzer.error_data.cljs$core$IFn$_invoke$arity$3(env,new cljs.core.Keyword(null,"macro-syntax-check","macro-syntax-check",2072602373),cljs.analyzer.var__GT_sym(mac_var)),e);
}} else {
return null;
}
} else {
return null;
}
});
cljs.analyzer.check_macro_arity = (function cljs$analyzer$check_macro_arity(mac_var,form){
var mac_sym = mac_var.sym;
var temp__5804__auto__ = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(cljs.env._STAR_compiler_STAR_),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("cljs.analyzer","namespaces","cljs.analyzer/namespaces",-260788927),cljs.core.symbol.cljs$core$IFn$_invoke$arity$1(cljs.core.namespace(mac_sym)),new cljs.core.Keyword(null,"defs","defs",1398449717),cljs.core.symbol.cljs$core$IFn$_invoke$arity$1(cljs.core.name(mac_sym))], null));
if(cljs.core.truth_(temp__5804__auto__)){
var map__47405 = temp__5804__auto__;
var map__47405__$1 = cljs.core.__destructure_map(map__47405);
var variadic_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__47405__$1,new cljs.core.Keyword(null,"variadic?","variadic?",584179762));
var max_fixed_arity = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__47405__$1,new cljs.core.Keyword(null,"max-fixed-arity","max-fixed-arity",-690205543));
var method_params = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__47405__$1,new cljs.core.Keyword(null,"method-params","method-params",-980792179));
var argc = cljs.core.count(cljs.core.rest(form));
var offset = ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Symbol(null,"&form","&form",1482799337,null),cljs.core.ffirst(method_params)))?(2):(0));
if(cljs.core.truth_(cljs.analyzer.invalid_arity_QMARK_(argc,cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__47396_SHARP_){
return cljs.core.nthrest(p1__47396_SHARP_,offset);
}),method_params),variadic_QMARK_,(cljs.core.truth_(max_fixed_arity)?(max_fixed_arity - offset):null)))){
throw (new Error(cljs.analyzer.error_message.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"fn-arity","fn-arity",-403576501),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"argc","argc",-1452839519),argc,new cljs.core.Keyword(null,"name","name",1843675177),mac_sym], null))));
} else {
return null;
}
} else {
return null;
}
});
cljs.analyzer.macroexpand_1_STAR_ = (function cljs$analyzer$macroexpand_1_STAR_(env,form){
if(cljs.core.seq_QMARK_(form)){
var op = cljs.core.first(form);
if(cljs.core.contains_QMARK_(cljs.analyzer.specials,op)){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Symbol(null,"ns","ns",2082130287,null),op)){
cljs.analyzer.do_macroexpand_check(env,form,cljs.analyzer.get_expander(new cljs.core.Symbol("cljs.core","ns-special-form","cljs.core/ns-special-form",1585185745,null),env));
} else {
}

return form;
} else {
var temp__5806__auto__ = (((op instanceof cljs.core.Symbol))?cljs.analyzer.get_expander(op,env):null);
if((temp__5806__auto__ == null)){
if((op instanceof cljs.core.Symbol)){
var opname = cljs.core.str.cljs$core$IFn$_invoke$arity$1(op);
if(("." === opname.charAt((0)))){
var vec__47416 = cljs.core.next(form);
var seq__47417 = cljs.core.seq(vec__47416);
var first__47418 = cljs.core.first(seq__47417);
var seq__47417__$1 = cljs.core.next(seq__47417);
var target = first__47418;
var args = seq__47417__$1;
return cljs.core.with_meta(cljs.core.list_STAR_.cljs$core$IFn$_invoke$arity$4(cljs.analyzer.impl.DOT_SYM,target,cljs.core.symbol.cljs$core$IFn$_invoke$arity$1(cljs.core.subs.cljs$core$IFn$_invoke$arity$2(opname,(1))),args),cljs.core.meta(form));
} else {
if(("." === opname.charAt((opname.length - (1))))){
return cljs.core.with_meta(cljs.core.list_STAR_.cljs$core$IFn$_invoke$arity$3(cljs.analyzer.impl.NEW_SYM,cljs.core.symbol.cljs$core$IFn$_invoke$arity$1(cljs.core.subs.cljs$core$IFn$_invoke$arity$3(opname,(0),(((opname).length) - (1)))),cljs.core.next(form)),cljs.core.meta(form));
} else {
return form;

}
}
} else {
return form;
}
} else {
var mac_var = temp__5806__auto__;
cljs.analyzer.do_macroexpand_check(env,form,mac_var);

var form_SINGLEQUOTE_ = (function (){try{cljs.analyzer.check_macro_arity(mac_var,form);

return cljs.core.apply.cljs$core$IFn$_invoke$arity$4(cljs.core.deref(mac_var),form,env,cljs.core.rest(form));
}catch (e47421){var e = e47421;
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$3(null,cljs.analyzer.error_data.cljs$core$IFn$_invoke$arity$3(env,new cljs.core.Keyword(null,"macroexpansion","macroexpansion",706274075),cljs.analyzer.var__GT_sym(mac_var)),e);
}})();
if(cljs.analyzer.impl.cljs_seq_QMARK_(form_SINGLEQUOTE_)){
var sym_SINGLEQUOTE_ = cljs.core.first(form_SINGLEQUOTE_);
var sym = cljs.core.first(form);
if(cljs.core.symbol_identical_QMARK_(sym_SINGLEQUOTE_,cljs.analyzer.impl.JS_STAR_SYM)){
var sym__$1 = (((!((cljs.core.namespace(sym) == null))))?sym:cljs.core.symbol.cljs$core$IFn$_invoke$arity$2("cljs.core",cljs.core.str.cljs$core$IFn$_invoke$arity$1(sym)));
var js_op = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"js-op","js-op",-1046277897),sym__$1], null);
var numeric = (function (){var mac_var_ns = cljs.core.symbol.cljs$core$IFn$_invoke$arity$1(cljs.core.namespace(mac_var.sym));
var mac_var_name = cljs.core.symbol.cljs$core$IFn$_invoke$arity$1(cljs.core.name(mac_var.sym));
return cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(cljs.env._STAR_compiler_STAR_),new cljs.core.PersistentVector(null, 6, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("cljs.analyzer","namespaces","cljs.analyzer/namespaces",-260788927),mac_var_ns,new cljs.core.Keyword(null,"defs","defs",1398449717),mac_var_name,new cljs.core.Keyword(null,"meta","meta",1499536964),new cljs.core.Keyword("cljs.analyzer","numeric","cljs.analyzer/numeric",1415704188)], null));
})();
var js_op__$1 = ((numeric === true)?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(js_op,new cljs.core.Keyword(null,"numeric","numeric",-1495594714),true):js_op);
return cljs.core.vary_meta.cljs$core$IFn$_invoke$arity$3(form_SINGLEQUOTE_,cljs.core.merge,js_op__$1);
} else {
return form_SINGLEQUOTE_;
}
} else {
return form_SINGLEQUOTE_;
}
}
}
} else {
return form;
}
});
/**
 * Given a env, an analysis environment, and form, a ClojureScript form,
 * macroexpand the form once.
 */
cljs.analyzer.macroexpand_1 = (function cljs$analyzer$macroexpand_1(env,form){
try{return cljs.analyzer.macroexpand_1_STAR_(env,form);
}catch (e47438){var err__8913__auto__ = e47438;
if(cljs.analyzer.has_error_data_QMARK_(err__8913__auto__)){
throw err__8913__auto__;
} else {
if(cljs.analyzer.analysis_error_QMARK_(err__8913__auto__)){
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$3(null,cljs.analyzer.error_data.cljs$core$IFn$_invoke$arity$2(env,new cljs.core.Keyword(null,"compilation","compilation",-1328774561)),err__8913__auto__);
} else {
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$3(null,cljs.analyzer.error_data.cljs$core$IFn$_invoke$arity$2(env,new cljs.core.Keyword(null,"compilation","compilation",-1328774561)),cljs.analyzer.error.cljs$core$IFn$_invoke$arity$3(env,err__8913__auto__.message,err__8913__auto__));

}
}
}});
cljs.analyzer.analyze_seq_STAR_ = (function cljs$analyzer$analyze_seq_STAR_(op,env,form,name,opts){
if(cljs.core.contains_QMARK_(cljs.analyzer.specials,op)){
return cljs.analyzer.parse.cljs$core$IFn$_invoke$arity$5(op,env,form,name,opts);
} else {
return cljs.analyzer.parse_invoke(env,form);
}
});
cljs.analyzer.analyze_seq_STAR__wrap = (function cljs$analyzer$analyze_seq_STAR__wrap(op,env,form,name,opts){
try{return cljs.analyzer.analyze_seq_STAR_(op,env,form,name,opts);
}catch (e47469){var err__8913__auto__ = e47469;
if(cljs.analyzer.has_error_data_QMARK_(err__8913__auto__)){
throw err__8913__auto__;
} else {
if(cljs.analyzer.analysis_error_QMARK_(err__8913__auto__)){
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$3(null,cljs.analyzer.error_data.cljs$core$IFn$_invoke$arity$2(env,new cljs.core.Keyword(null,"compilation","compilation",-1328774561)),err__8913__auto__);
} else {
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$3(null,cljs.analyzer.error_data.cljs$core$IFn$_invoke$arity$2(env,new cljs.core.Keyword(null,"compilation","compilation",-1328774561)),cljs.analyzer.error.cljs$core$IFn$_invoke$arity$3(env,err__8913__auto__.message,err__8913__auto__));

}
}
}});
cljs.analyzer.analyze_seq = (function cljs$analyzer$analyze_seq(var_args){
var G__47487 = arguments.length;
switch (G__47487) {
case 3:
return cljs.analyzer.analyze_seq.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
case 4:
return cljs.analyzer.analyze_seq.cljs$core$IFn$_invoke$arity$4((arguments[(0)]),(arguments[(1)]),(arguments[(2)]),(arguments[(3)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(cljs.analyzer.analyze_seq.cljs$core$IFn$_invoke$arity$3 = (function (env,form,name){
return cljs.analyzer.analyze_seq.cljs$core$IFn$_invoke$arity$4(env,form,name,(cljs.core.truth_(cljs.env._STAR_compiler_STAR_)?new cljs.core.Keyword(null,"options","options",99638489).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(cljs.env._STAR_compiler_STAR_)):null));
}));

(cljs.analyzer.analyze_seq.cljs$core$IFn$_invoke$arity$4 = (function (env,form,name,opts){
if(new cljs.core.Keyword(null,"quoted?","quoted?",1464649621).cljs$core$IFn$_invoke$arity$1(env)){
return (cljs.analyzer.analyze_list.cljs$core$IFn$_invoke$arity$2 ? cljs.analyzer.analyze_list.cljs$core$IFn$_invoke$arity$2(env,form) : cljs.analyzer.analyze_list.call(null,env,form));
} else {
var line = new cljs.core.Keyword(null,"line","line",212345235).cljs$core$IFn$_invoke$arity$1(cljs.core.meta(form));
var line__$1 = (((line == null))?new cljs.core.Keyword(null,"line","line",212345235).cljs$core$IFn$_invoke$arity$1(env):line);
var col = new cljs.core.Keyword(null,"column","column",2078222095).cljs$core$IFn$_invoke$arity$1(cljs.core.meta(form));
var col__$1 = (((col == null))?new cljs.core.Keyword(null,"column","column",2078222095).cljs$core$IFn$_invoke$arity$1(env):col);
var env__$1 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(env,new cljs.core.Keyword(null,"line","line",212345235),line__$1,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"column","column",2078222095),col__$1], 0));
var op = cljs.core.first(form);
if((op == null)){
throw cljs.analyzer.error.cljs$core$IFn$_invoke$arity$2(env__$1,"Can't call nil");
} else {
}

var mform = cljs.analyzer.macroexpand_1(env__$1,form);
if((form === mform)){
return cljs.analyzer.analyze_seq_STAR__wrap(op,env__$1,form,name,opts);
} else {
return (cljs.analyzer.analyze.cljs$core$IFn$_invoke$arity$4 ? cljs.analyzer.analyze.cljs$core$IFn$_invoke$arity$4(env__$1,mform,name,opts) : cljs.analyzer.analyze.call(null,env__$1,mform,name,opts));
}
}
}));

(cljs.analyzer.analyze_seq.cljs$lang$maxFixedArity = 4);

cljs.analyzer.analyze_map = (function cljs$analyzer$analyze_map(env,form){
var expr_env = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(env,new cljs.core.Keyword(null,"context","context",-830191113),new cljs.core.Keyword(null,"expr","expr",745722291));
var ks = (function (){var _STAR_recur_frames_STAR__orig_val__47516 = cljs.analyzer._STAR_recur_frames_STAR_;
var _STAR_recur_frames_STAR__temp_val__47517 = cljs.core.cons(null,cljs.analyzer._STAR_recur_frames_STAR_);
(cljs.analyzer._STAR_recur_frames_STAR_ = _STAR_recur_frames_STAR__temp_val__47517);

try{return cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (p1__47512_SHARP_){
return (cljs.analyzer.analyze.cljs$core$IFn$_invoke$arity$2 ? cljs.analyzer.analyze.cljs$core$IFn$_invoke$arity$2(expr_env,p1__47512_SHARP_) : cljs.analyzer.analyze.call(null,expr_env,p1__47512_SHARP_));
}),cljs.core.keys(form));
}finally {(cljs.analyzer._STAR_recur_frames_STAR_ = _STAR_recur_frames_STAR__orig_val__47516);
}})();
var vs = (function (){var _STAR_recur_frames_STAR__orig_val__47523 = cljs.analyzer._STAR_recur_frames_STAR_;
var _STAR_recur_frames_STAR__temp_val__47524 = cljs.core.cons(null,cljs.analyzer._STAR_recur_frames_STAR_);
(cljs.analyzer._STAR_recur_frames_STAR_ = _STAR_recur_frames_STAR__temp_val__47524);

try{return cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (p1__47513_SHARP_){
return (cljs.analyzer.analyze.cljs$core$IFn$_invoke$arity$2 ? cljs.analyzer.analyze.cljs$core$IFn$_invoke$arity$2(expr_env,p1__47513_SHARP_) : cljs.analyzer.analyze.call(null,expr_env,p1__47513_SHARP_));
}),cljs.core.vals(form));
}finally {(cljs.analyzer._STAR_recur_frames_STAR_ = _STAR_recur_frames_STAR__orig_val__47523);
}})();
var G__47525 = new cljs.core.PersistentArrayMap(null, 7, [new cljs.core.Keyword(null,"op","op",-1882987955),new cljs.core.Keyword(null,"map","map",1371690461),new cljs.core.Keyword(null,"env","env",-1815813235),env,new cljs.core.Keyword(null,"form","form",-1624062471),form,new cljs.core.Keyword(null,"keys","keys",1068423698),ks,new cljs.core.Keyword(null,"vals","vals",768058733),vs,new cljs.core.Keyword(null,"children","children",-940561982),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"keys","keys",1068423698),new cljs.core.Keyword(null,"vals","vals",768058733)], null),new cljs.core.Keyword(null,"tag","tag",-1290361223),new cljs.core.Symbol("cljs.core","IMap","cljs.core/IMap",1407777598,null)], null);
return (cljs.analyzer.analyze_wrap_meta.cljs$core$IFn$_invoke$arity$1 ? cljs.analyzer.analyze_wrap_meta.cljs$core$IFn$_invoke$arity$1(G__47525) : cljs.analyzer.analyze_wrap_meta.call(null,G__47525));
});
cljs.analyzer.analyze_list = (function cljs$analyzer$analyze_list(env,form){
var expr_env = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(env,new cljs.core.Keyword(null,"context","context",-830191113),new cljs.core.Keyword(null,"expr","expr",745722291));
var items = (function (){var _STAR_recur_frames_STAR__orig_val__47534 = cljs.analyzer._STAR_recur_frames_STAR_;
var _STAR_recur_frames_STAR__temp_val__47535 = cljs.core.cons(null,cljs.analyzer._STAR_recur_frames_STAR_);
(cljs.analyzer._STAR_recur_frames_STAR_ = _STAR_recur_frames_STAR__temp_val__47535);

try{return cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (p1__47531_SHARP_){
return (cljs.analyzer.analyze.cljs$core$IFn$_invoke$arity$2 ? cljs.analyzer.analyze.cljs$core$IFn$_invoke$arity$2(expr_env,p1__47531_SHARP_) : cljs.analyzer.analyze.call(null,expr_env,p1__47531_SHARP_));
}),form);
}finally {(cljs.analyzer._STAR_recur_frames_STAR_ = _STAR_recur_frames_STAR__orig_val__47534);
}})();
var G__47540 = new cljs.core.PersistentArrayMap(null, 6, [new cljs.core.Keyword(null,"op","op",-1882987955),new cljs.core.Keyword(null,"list","list",765357683),new cljs.core.Keyword(null,"env","env",-1815813235),env,new cljs.core.Keyword(null,"form","form",-1624062471),form,new cljs.core.Keyword(null,"items","items",1031954938),items,new cljs.core.Keyword(null,"children","children",-940561982),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"items","items",1031954938)], null),new cljs.core.Keyword(null,"tag","tag",-1290361223),new cljs.core.Symbol("cljs.core","IList","cljs.core/IList",1015168964,null)], null);
return (cljs.analyzer.analyze_wrap_meta.cljs$core$IFn$_invoke$arity$1 ? cljs.analyzer.analyze_wrap_meta.cljs$core$IFn$_invoke$arity$1(G__47540) : cljs.analyzer.analyze_wrap_meta.call(null,G__47540));
});
cljs.analyzer.analyze_vector = (function cljs$analyzer$analyze_vector(env,form){
var expr_env = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(env,new cljs.core.Keyword(null,"context","context",-830191113),new cljs.core.Keyword(null,"expr","expr",745722291));
var items = (function (){var _STAR_recur_frames_STAR__orig_val__47547 = cljs.analyzer._STAR_recur_frames_STAR_;
var _STAR_recur_frames_STAR__temp_val__47548 = cljs.core.cons(null,cljs.analyzer._STAR_recur_frames_STAR_);
(cljs.analyzer._STAR_recur_frames_STAR_ = _STAR_recur_frames_STAR__temp_val__47548);

try{return cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (p1__47542_SHARP_){
return (cljs.analyzer.analyze.cljs$core$IFn$_invoke$arity$2 ? cljs.analyzer.analyze.cljs$core$IFn$_invoke$arity$2(expr_env,p1__47542_SHARP_) : cljs.analyzer.analyze.call(null,expr_env,p1__47542_SHARP_));
}),form);
}finally {(cljs.analyzer._STAR_recur_frames_STAR_ = _STAR_recur_frames_STAR__orig_val__47547);
}})();
var G__47552 = new cljs.core.PersistentArrayMap(null, 6, [new cljs.core.Keyword(null,"op","op",-1882987955),new cljs.core.Keyword(null,"vector","vector",1902966158),new cljs.core.Keyword(null,"env","env",-1815813235),env,new cljs.core.Keyword(null,"form","form",-1624062471),form,new cljs.core.Keyword(null,"items","items",1031954938),items,new cljs.core.Keyword(null,"children","children",-940561982),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"items","items",1031954938)], null),new cljs.core.Keyword(null,"tag","tag",-1290361223),new cljs.core.Symbol("cljs.core","IVector","cljs.core/IVector",1711112835,null)], null);
return (cljs.analyzer.analyze_wrap_meta.cljs$core$IFn$_invoke$arity$1 ? cljs.analyzer.analyze_wrap_meta.cljs$core$IFn$_invoke$arity$1(G__47552) : cljs.analyzer.analyze_wrap_meta.call(null,G__47552));
});
cljs.analyzer.analyze_set = (function cljs$analyzer$analyze_set(env,form){
var expr_env = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(env,new cljs.core.Keyword(null,"context","context",-830191113),new cljs.core.Keyword(null,"expr","expr",745722291));
var items = (function (){var _STAR_recur_frames_STAR__orig_val__47560 = cljs.analyzer._STAR_recur_frames_STAR_;
var _STAR_recur_frames_STAR__temp_val__47561 = cljs.core.cons(null,cljs.analyzer._STAR_recur_frames_STAR_);
(cljs.analyzer._STAR_recur_frames_STAR_ = _STAR_recur_frames_STAR__temp_val__47561);

try{return cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (p1__47553_SHARP_){
return (cljs.analyzer.analyze.cljs$core$IFn$_invoke$arity$2 ? cljs.analyzer.analyze.cljs$core$IFn$_invoke$arity$2(expr_env,p1__47553_SHARP_) : cljs.analyzer.analyze.call(null,expr_env,p1__47553_SHARP_));
}),form);
}finally {(cljs.analyzer._STAR_recur_frames_STAR_ = _STAR_recur_frames_STAR__orig_val__47560);
}})();
var G__47563 = new cljs.core.PersistentArrayMap(null, 6, [new cljs.core.Keyword(null,"op","op",-1882987955),new cljs.core.Keyword(null,"set","set",304602554),new cljs.core.Keyword(null,"env","env",-1815813235),env,new cljs.core.Keyword(null,"form","form",-1624062471),form,new cljs.core.Keyword(null,"items","items",1031954938),items,new cljs.core.Keyword(null,"children","children",-940561982),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"items","items",1031954938)], null),new cljs.core.Keyword(null,"tag","tag",-1290361223),new cljs.core.Symbol("cljs.core","ISet","cljs.core/ISet",2003412810,null)], null);
return (cljs.analyzer.analyze_wrap_meta.cljs$core$IFn$_invoke$arity$1 ? cljs.analyzer.analyze_wrap_meta.cljs$core$IFn$_invoke$arity$1(G__47563) : cljs.analyzer.analyze_wrap_meta.call(null,G__47563));
});
cljs.analyzer.analyze_js_value = (function cljs$analyzer$analyze_js_value(env,form){
var val = form.val;
var expr_env = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(env,new cljs.core.Keyword(null,"context","context",-830191113),new cljs.core.Keyword(null,"expr","expr",745722291));
if(cljs.core.map_QMARK_(val)){
var keys = cljs.core.vec(cljs.core.keys(val));
var vals = (function (){var _STAR_recur_frames_STAR__orig_val__47575 = cljs.analyzer._STAR_recur_frames_STAR_;
var _STAR_recur_frames_STAR__temp_val__47576 = cljs.core.cons(null,cljs.analyzer._STAR_recur_frames_STAR_);
(cljs.analyzer._STAR_recur_frames_STAR_ = _STAR_recur_frames_STAR__temp_val__47576);

try{return cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (p1__47567_SHARP_){
return (cljs.analyzer.analyze.cljs$core$IFn$_invoke$arity$2 ? cljs.analyzer.analyze.cljs$core$IFn$_invoke$arity$2(expr_env,p1__47567_SHARP_) : cljs.analyzer.analyze.call(null,expr_env,p1__47567_SHARP_));
}),cljs.core.vals(val));
}finally {(cljs.analyzer._STAR_recur_frames_STAR_ = _STAR_recur_frames_STAR__orig_val__47575);
}})();
return new cljs.core.PersistentArrayMap(null, 7, [new cljs.core.Keyword(null,"op","op",-1882987955),new cljs.core.Keyword(null,"js-object","js-object",1830199158),new cljs.core.Keyword(null,"env","env",-1815813235),env,new cljs.core.Keyword(null,"form","form",-1624062471),form,new cljs.core.Keyword(null,"keys","keys",1068423698),keys,new cljs.core.Keyword(null,"vals","vals",768058733),vals,new cljs.core.Keyword(null,"children","children",-940561982),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"vals","vals",768058733)], null),new cljs.core.Keyword(null,"tag","tag",-1290361223),new cljs.core.Symbol(null,"object","object",-1179821820,null)], null);
} else {
var items = (function (){var _STAR_recur_frames_STAR__orig_val__47581 = cljs.analyzer._STAR_recur_frames_STAR_;
var _STAR_recur_frames_STAR__temp_val__47582 = cljs.core.cons(null,cljs.analyzer._STAR_recur_frames_STAR_);
(cljs.analyzer._STAR_recur_frames_STAR_ = _STAR_recur_frames_STAR__temp_val__47582);

try{return cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (p1__47568_SHARP_){
return (cljs.analyzer.analyze.cljs$core$IFn$_invoke$arity$2 ? cljs.analyzer.analyze.cljs$core$IFn$_invoke$arity$2(expr_env,p1__47568_SHARP_) : cljs.analyzer.analyze.call(null,expr_env,p1__47568_SHARP_));
}),val);
}finally {(cljs.analyzer._STAR_recur_frames_STAR_ = _STAR_recur_frames_STAR__orig_val__47581);
}})();
return new cljs.core.PersistentArrayMap(null, 6, [new cljs.core.Keyword(null,"op","op",-1882987955),new cljs.core.Keyword(null,"js-array","js-array",-1210185421),new cljs.core.Keyword(null,"env","env",-1815813235),env,new cljs.core.Keyword(null,"form","form",-1624062471),form,new cljs.core.Keyword(null,"items","items",1031954938),items,new cljs.core.Keyword(null,"children","children",-940561982),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"items","items",1031954938)], null),new cljs.core.Keyword(null,"tag","tag",-1290361223),new cljs.core.Symbol(null,"array","array",-440182315,null)], null);
}
});
cljs.analyzer.record_ns_PLUS_name = (function cljs$analyzer$record_ns_PLUS_name(x){
return cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.symbol,clojure.string.split.cljs$core$IFn$_invoke$arity$2(cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.type(x)], 0)),/\//));
});
cljs.analyzer.analyze_record = (function cljs$analyzer$analyze_record(env,x){
var _items_ = (function (){var _STAR_recur_frames_STAR__orig_val__47592 = cljs.analyzer._STAR_recur_frames_STAR_;
var _STAR_recur_frames_STAR__temp_val__47593 = cljs.core.cons(null,cljs.analyzer._STAR_recur_frames_STAR_);
(cljs.analyzer._STAR_recur_frames_STAR_ = _STAR_recur_frames_STAR__temp_val__47593);

try{var G__47595 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(env,new cljs.core.Keyword(null,"context","context",-830191113),new cljs.core.Keyword(null,"expr","expr",745722291));
var G__47596 = cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,x);
return (cljs.analyzer.analyze.cljs$core$IFn$_invoke$arity$2 ? cljs.analyzer.analyze.cljs$core$IFn$_invoke$arity$2(G__47595,G__47596) : cljs.analyzer.analyze.call(null,G__47595,G__47596));
}finally {(cljs.analyzer._STAR_recur_frames_STAR_ = _STAR_recur_frames_STAR__orig_val__47592);
}})();
var vec__47589 = cljs.analyzer.record_ns_PLUS_name(x);
var ns = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__47589,(0),null);
var name = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__47589,(1),null);
return new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"op","op",-1882987955),new cljs.core.Keyword(null,"const","const",1709929842),new cljs.core.Keyword(null,"val","val",128701612),x,new cljs.core.Keyword(null,"env","env",-1815813235),env,new cljs.core.Keyword(null,"form","form",-1624062471),x,new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.symbol.cljs$core$IFn$_invoke$arity$2(cljs.core.str.cljs$core$IFn$_invoke$arity$1(ns),cljs.core.str.cljs$core$IFn$_invoke$arity$1(name))], null);
});
cljs.analyzer.elide_reader_meta = (function cljs$analyzer$elide_reader_meta(m){
return cljs.core.dissoc.cljs$core$IFn$_invoke$arity$variadic(m,new cljs.core.Keyword(null,"file","file",-1269645878),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"line","line",212345235),new cljs.core.Keyword(null,"column","column",2078222095),new cljs.core.Keyword(null,"end-column","end-column",1425389514),new cljs.core.Keyword(null,"end-line","end-line",1837326455),new cljs.core.Keyword(null,"source","source",-433931539)], 0));
});
cljs.analyzer.elide_analyzer_meta = (function cljs$analyzer$elide_analyzer_meta(m){
return cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(m,new cljs.core.Keyword("cljs.analyzer","analyzed","cljs.analyzer/analyzed",-735094162));
});
cljs.analyzer.elide_irrelevant_meta = (function cljs$analyzer$elide_irrelevant_meta(m){
return cljs.analyzer.elide_analyzer_meta(cljs.analyzer.elide_reader_meta(m));
});
cljs.analyzer.analyze_wrap_meta = (function cljs$analyzer$analyze_wrap_meta(expr){
var form = new cljs.core.Keyword(null,"form","form",-1624062471).cljs$core$IFn$_invoke$arity$1(expr);
var m = cljs.analyzer.elide_irrelevant_meta(cljs.core.meta(form));
if((!((cljs.core.seq(m) == null)))){
var env = new cljs.core.Keyword(null,"env","env",-1815813235).cljs$core$IFn$_invoke$arity$1(expr);
var expr__$1 = cljs.core.assoc_in(expr,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"env","env",-1815813235),new cljs.core.Keyword(null,"context","context",-830191113)], null),new cljs.core.Keyword(null,"expr","expr",745722291));
var meta_expr = cljs.analyzer.analyze_map(new cljs.core.Keyword(null,"env","env",-1815813235).cljs$core$IFn$_invoke$arity$1(expr__$1),m);
return new cljs.core.PersistentArrayMap(null, 6, [new cljs.core.Keyword(null,"op","op",-1882987955),new cljs.core.Keyword(null,"with-meta","with-meta",-1566856820),new cljs.core.Keyword(null,"env","env",-1815813235),env,new cljs.core.Keyword(null,"form","form",-1624062471),form,new cljs.core.Keyword(null,"meta","meta",1499536964),meta_expr,new cljs.core.Keyword(null,"expr","expr",745722291),expr__$1,new cljs.core.Keyword(null,"children","children",-940561982),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"meta","meta",1499536964),new cljs.core.Keyword(null,"expr","expr",745722291)], null)], null);
} else {
return expr;
}
});
cljs.analyzer.infer_type = (function cljs$analyzer$infer_type(env,p__47607,_){
var map__47608 = p__47607;
var map__47608__$1 = cljs.core.__destructure_map(map__47608);
var ast = map__47608__$1;
var tag = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__47608__$1,new cljs.core.Keyword(null,"tag","tag",-1290361223));
if((((tag == null)) || (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Symbol(null,"function","function",-486723946,null),tag)))){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"fn","fn",-1175266204),new cljs.core.Keyword(null,"op","op",-1882987955).cljs$core$IFn$_invoke$arity$1(ast))){
return cljs.core.update.cljs$core$IFn$_invoke$arity$3(ast,new cljs.core.Keyword(null,"methods","methods",453930866),(function (ms){
return cljs.core.into.cljs$core$IFn$_invoke$arity$3(cljs.core.PersistentVector.EMPTY,cljs.core.map.cljs$core$IFn$_invoke$arity$1((function (p1__47606_SHARP_){
return (cljs.analyzer.infer_type.cljs$core$IFn$_invoke$arity$3 ? cljs.analyzer.infer_type.cljs$core$IFn$_invoke$arity$3(env,p1__47606_SHARP_,_) : cljs.analyzer.infer_type.call(null,env,p1__47606_SHARP_,_));
})),ms);
}));
} else {
var temp__5806__auto__ = cljs.analyzer.infer_tag(env,ast);
if((temp__5806__auto__ == null)){
return ast;
} else {
var tag__$1 = temp__5806__auto__;
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(ast,new cljs.core.Keyword(null,"tag","tag",-1290361223),tag__$1);
}
}
} else {
return ast;
}
});
cljs.analyzer.repl_self_require_QMARK_ = (function cljs$analyzer$repl_self_require_QMARK_(env,deps){
var and__5000__auto__ = new cljs.core.Keyword(null,"repl-env","repl-env",-1976503928).cljs$core$IFn$_invoke$arity$1(env);
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.some(cljs.core.PersistentHashSet.createAsIfByAssoc([cljs.analyzer._STAR_cljs_ns_STAR_]),deps);
} else {
return and__5000__auto__;
}
});
cljs.analyzer.invoke_arg_type_validators = (function (){var aget_validator = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"valid?","valid?",-212412379),(function (p1__47619_SHARP_){
return ((cljs.analyzer.array_type_QMARK_(cljs.core.first(p1__47619_SHARP_))) && (cljs.core.every_QMARK_(cljs.analyzer.numeric_type_QMARK_,cljs.core.rest(p1__47619_SHARP_))));
}),new cljs.core.Keyword(null,"warning-type","warning-type",1711103595),new cljs.core.Keyword(null,"invalid-array-access","invalid-array-access",-1747132236)], null);
var aset_validator = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"valid?","valid?",-212412379),(function (p1__47620_SHARP_){
return ((cljs.analyzer.array_type_QMARK_(cljs.core.first(p1__47620_SHARP_))) && (cljs.core.every_QMARK_(cljs.analyzer.numeric_type_QMARK_,cljs.core.butlast(cljs.core.rest(p1__47620_SHARP_)))));
}),new cljs.core.Keyword(null,"warning-type","warning-type",1711103595),new cljs.core.Keyword(null,"invalid-array-access","invalid-array-access",-1747132236)], null);
return new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Symbol("cljs.core","checked-aget","cljs.core/checked-aget",24024561,null),aget_validator,new cljs.core.Symbol("cljs.core","checked-aset","cljs.core/checked-aset",-2080232353,null),aset_validator,new cljs.core.Symbol("cljs.core","checked-aget'","cljs.core/checked-aget'",1960922245,null),aget_validator,new cljs.core.Symbol("cljs.core","checked-aset'","cljs.core/checked-aset'",163859714,null),aset_validator], null);
})();
cljs.analyzer.check_invoke_arg_types = (function cljs$analyzer$check_invoke_arg_types(env,p__47630,opts){
var map__47632 = p__47630;
var map__47632__$1 = cljs.core.__destructure_map(map__47632);
var ast = map__47632__$1;
var op = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__47632__$1,new cljs.core.Keyword(null,"op","op",-1882987955));
if((((!(cljs.analyzer.analyzed_QMARK_(ast)))) && (cljs.core.keyword_identical_QMARK_(new cljs.core.Keyword(null,"invoke","invoke",1145927159),op)))){
var temp__5808__auto___49431 = cljs.core.find(cljs.analyzer.invoke_arg_type_validators,new cljs.core.Keyword(null,"name","name",1843675177).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"info","info",-317069002).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"fn","fn",-1175266204).cljs$core$IFn$_invoke$arity$1(ast))));
if((temp__5808__auto___49431 == null)){
} else {
var vec__47635_49432 = temp__5808__auto___49431;
var name_49433 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__47635_49432,(0),null);
var map__47638_49434 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__47635_49432,(1),null);
var map__47638_49435__$1 = cljs.core.__destructure_map(map__47638_49434);
var valid_QMARK__49436 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__47638_49435__$1,new cljs.core.Keyword(null,"valid?","valid?",-212412379));
var warning_type_49437 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__47638_49435__$1,new cljs.core.Keyword(null,"warning-type","warning-type",1711103595));
var types_49438 = cljs.core.mapv.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"tag","tag",-1290361223),new cljs.core.Keyword(null,"args","args",1315556576).cljs$core$IFn$_invoke$arity$1(ast));
if(cljs.core.truth_((valid_QMARK__49436.cljs$core$IFn$_invoke$arity$1 ? valid_QMARK__49436.cljs$core$IFn$_invoke$arity$1(types_49438) : valid_QMARK__49436.call(null,types_49438)))){
} else {
cljs.analyzer.warning(warning_type_49437,env,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"name","name",1843675177),name_49433,new cljs.core.Keyword(null,"types","types",590030639),types_49438], null));
}
}
} else {
}

return cljs.analyzer.analyzed(ast);
});
cljs.analyzer.analyze_form = (function cljs$analyzer$analyze_form(env,form,name,opts){
if((form instanceof cljs.core.Symbol)){
return cljs.analyzer.analyze_symbol(env,form);
} else {
if(((cljs.analyzer.impl.cljs_seq_QMARK_(form)) && ((!((cljs.core.seq(form) == null)))))){
return cljs.analyzer.analyze_seq.cljs$core$IFn$_invoke$arity$4(env,form,name,opts);
} else {
if(cljs.core.record_QMARK_(form)){
return cljs.analyzer.analyze_record(env,form);
} else {
if(cljs.analyzer.impl.cljs_map_QMARK_(form)){
return cljs.analyzer.analyze_map(env,form);
} else {
if(cljs.analyzer.impl.cljs_vector_QMARK_(form)){
return cljs.analyzer.analyze_vector(env,form);
} else {
if(cljs.analyzer.impl.cljs_set_QMARK_(form)){
return cljs.analyzer.analyze_set(env,form);
} else {
if((form instanceof cljs.core.Keyword)){
return cljs.analyzer.analyze_keyword(env,form);
} else {
if((form instanceof cljs.tagged_literals.JSValue)){
return cljs.analyzer.analyze_js_value(env,form);
} else {
var tag = (((form == null))?cljs.analyzer.impl.CLJ_NIL_SYM:((typeof form === 'number')?cljs.analyzer.impl.NUMBER_SYM:((typeof form === 'string')?cljs.analyzer.impl.STRING_SYM:((form === true)?cljs.analyzer.impl.BOOLEAN_SYM:((form === false)?cljs.analyzer.impl.BOOLEAN_SYM:((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.List.EMPTY,form))?new cljs.core.Symbol("cljs.core","IList","cljs.core/IList",1015168964,null):null))))));
var G__47653 = new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"op","op",-1882987955),new cljs.core.Keyword(null,"const","const",1709929842),new cljs.core.Keyword(null,"val","val",128701612),form,new cljs.core.Keyword(null,"env","env",-1815813235),env,new cljs.core.Keyword(null,"form","form",-1624062471),form], null);
if(cljs.core.truth_(tag)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__47653,new cljs.core.Keyword(null,"tag","tag",-1290361223),tag);
} else {
return G__47653;
}

}
}
}
}
}
}
}
}
});
cljs.analyzer.default_passes = new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.analyzer.infer_type,cljs.analyzer.passes.and_or.optimize,cljs.analyzer.check_invoke_arg_types], null);
cljs.analyzer.analyze_STAR_ = (function cljs$analyzer$analyze_STAR_(env,form,name,opts){
var passes = cljs.analyzer._STAR_passes_STAR_;
var passes__$1 = (((passes == null))?cljs.analyzer.default_passes:passes);
var form__$1 = (((form instanceof cljs.core.LazySeq))?((cljs.core.seq(form))?form:cljs.core.List.EMPTY):form);
var ast = cljs.analyzer.analyze_form(env,form__$1,name,opts);
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (ast__$1,pass){
return (pass.cljs$core$IFn$_invoke$arity$3 ? pass.cljs$core$IFn$_invoke$arity$3(env,ast__$1,opts) : pass.call(null,env,ast__$1,opts));
}),ast,passes__$1);
});
/**
 * Given an environment, a map containing {:locals (mapping of names to bindings), :context
 *   (one of :statement, :expr, :return), :ns (a symbol naming the
 *   compilation ns)}, and form, returns an expression object (a map
 *   containing at least :form, :op and :env keys). If expr has any (immediately)
 *   nested exprs, must have a :children entry. This must be a vector of keywords naming
 *   the immediately nested fields mapped to an expr or vector of exprs. This will
 *   facilitate code walking without knowing the details of the op set.
 */
cljs.analyzer.analyze = (function cljs$analyzer$analyze(var_args){
var G__47661 = arguments.length;
switch (G__47661) {
case 2:
return cljs.analyzer.analyze.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return cljs.analyzer.analyze.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
case 4:
return cljs.analyzer.analyze.cljs$core$IFn$_invoke$arity$4((arguments[(0)]),(arguments[(1)]),(arguments[(2)]),(arguments[(3)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(cljs.analyzer.analyze.cljs$core$IFn$_invoke$arity$2 = (function (env,form){
return cljs.analyzer.analyze.cljs$core$IFn$_invoke$arity$3(env,form,null);
}));

(cljs.analyzer.analyze.cljs$core$IFn$_invoke$arity$3 = (function (env,form,name){
return cljs.analyzer.analyze.cljs$core$IFn$_invoke$arity$4(env,form,name,(cljs.core.truth_(cljs.env._STAR_compiler_STAR_)?new cljs.core.Keyword(null,"options","options",99638489).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(cljs.env._STAR_compiler_STAR_)):null));
}));

(cljs.analyzer.analyze.cljs$core$IFn$_invoke$arity$4 = (function (env,form,name,opts){
try{if(cljs.analyzer.analyzed_QMARK_(form)){
var _STAR_cljs_warnings_STAR__orig_val__47676 = cljs.analyzer._STAR_cljs_warnings_STAR_;
var _STAR_cljs_warnings_STAR__temp_val__47677 = cljs.core.zipmap(cljs.core.keys(cljs.analyzer._STAR_cljs_warnings_STAR_),cljs.core.repeat.cljs$core$IFn$_invoke$arity$1(false));
(cljs.analyzer._STAR_cljs_warnings_STAR_ = _STAR_cljs_warnings_STAR__temp_val__47677);

try{return cljs.analyzer.analyze_STAR_(env,form,name,opts);
}finally {(cljs.analyzer._STAR_cljs_warnings_STAR_ = _STAR_cljs_warnings_STAR__orig_val__47676);
}} else {
return cljs.analyzer.analyze_STAR_(env,form,name,opts);
}
}catch (e47670){var err__8913__auto__ = e47670;
if(cljs.analyzer.has_error_data_QMARK_(err__8913__auto__)){
throw err__8913__auto__;
} else {
if(cljs.analyzer.analysis_error_QMARK_(err__8913__auto__)){
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$3(null,cljs.analyzer.error_data.cljs$core$IFn$_invoke$arity$2(env,new cljs.core.Keyword(null,"compilation","compilation",-1328774561)),err__8913__auto__);
} else {
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$3(null,cljs.analyzer.error_data.cljs$core$IFn$_invoke$arity$2(env,new cljs.core.Keyword(null,"compilation","compilation",-1328774561)),cljs.analyzer.error.cljs$core$IFn$_invoke$arity$3(env,err__8913__auto__.message,err__8913__auto__));

}
}
}}));

(cljs.analyzer.analyze.cljs$lang$maxFixedArity = 4);

/**
 * Given a compiler state and a map from fully qualified symbols to constant
 *   EDN values, update the compiler state marking these vars as const to support
 *   direct substitution of these vars in source.
 */
cljs.analyzer.add_consts = (function cljs$analyzer$add_consts(compiler_state,constants_map){
return cljs.core.reduce_kv((function (compiler_state__$1,sym,value){
var ns = cljs.core.symbol.cljs$core$IFn$_invoke$arity$1(cljs.core.namespace(sym));
return cljs.core.update_in.cljs$core$IFn$_invoke$arity$4(compiler_state__$1,new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("cljs.analyzer","namespaces","cljs.analyzer/namespaces",-260788927),ns,new cljs.core.Keyword(null,"defs","defs",1398449717),cljs.core.symbol.cljs$core$IFn$_invoke$arity$1(cljs.core.name(sym))], null),cljs.core.merge,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"const-expr","const-expr",-1379382292),(function (){var _STAR_passes_STAR__orig_val__47683 = cljs.analyzer._STAR_passes_STAR_;
var _STAR_passes_STAR__temp_val__47684 = cljs.core.conj.cljs$core$IFn$_invoke$arity$2(cljs.analyzer._STAR_passes_STAR_,cljs.analyzer.replace_env_pass(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"context","context",-830191113),new cljs.core.Keyword(null,"expr","expr",745722291)], null)));
(cljs.analyzer._STAR_passes_STAR_ = _STAR_passes_STAR__temp_val__47684);

try{return cljs.analyzer.analyze.cljs$core$IFn$_invoke$arity$2(cljs.analyzer.empty_env(),value);
}finally {(cljs.analyzer._STAR_passes_STAR_ = _STAR_passes_STAR__orig_val__47683);
}})()], null));
}),compiler_state,constants_map);
});
cljs.analyzer.resolve_symbol = (function cljs$analyzer$resolve_symbol(sym){
if(((cljs.core.not(cljs.core.namespace(sym))) && (cljs.analyzer.dotted_symbol_QMARK_(sym)))){
return sym;
} else {
return new cljs.core.Keyword(null,"name","name",1843675177).cljs$core$IFn$_invoke$arity$1((function (){var _STAR_private_var_access_nowarn_STAR__orig_val__47691 = cljs.analyzer._STAR_private_var_access_nowarn_STAR_;
var _STAR_private_var_access_nowarn_STAR__temp_val__47693 = true;
(cljs.analyzer._STAR_private_var_access_nowarn_STAR_ = _STAR_private_var_access_nowarn_STAR__temp_val__47693);

try{return cljs.analyzer.resolve_var.cljs$core$IFn$_invoke$arity$2(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(cljs.core.deref(cljs.env._STAR_compiler_STAR_),new cljs.core.Keyword(null,"ns","ns",441598760),cljs.analyzer.get_namespace.cljs$core$IFn$_invoke$arity$1(cljs.analyzer._STAR_cljs_ns_STAR_)),sym);
}finally {(cljs.analyzer._STAR_private_var_access_nowarn_STAR_ = _STAR_private_var_access_nowarn_STAR__orig_val__47691);
}})());
}
});
/**
 * Get all alias maps for a namespace.
 */
cljs.analyzer.get_aliases = (function cljs$analyzer$get_aliases(ns){
return cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core.merge,cljs.core.juxt.cljs$core$IFn$_invoke$arity$3(new cljs.core.Keyword(null,"requires","requires",-1201390927),new cljs.core.Keyword(null,"require-macros","require-macros",707947416),new cljs.core.Keyword(null,"as-aliases","as-aliases",1485064798))(cljs.analyzer.get_namespace.cljs$core$IFn$_invoke$arity$1(ns)));
});
var registry_ref_49460 = (new cljs.core.Delay((function (){
return cljs.core.get.cljs$core$IFn$_invoke$arity$2(cljs.core.ns_interns_STAR_(new cljs.core.Symbol(null,"cljs.spec.alpha$macros","cljs.spec.alpha$macros",-896343615,null)),new cljs.core.Symbol(null,"registry-ref","registry-ref",1975823941,null));
}),null));
var speced_vars_49461 = (new cljs.core.Delay((function (){
return cljs.core.get.cljs$core$IFn$_invoke$arity$2(cljs.core.ns_interns_STAR_(new cljs.core.Symbol(null,"cljs.spec.alpha$macros","cljs.spec.alpha$macros",-896343615,null)),new cljs.core.Symbol(null,"-speced-vars","-speced-vars",1758723085,null));
}),null));
cljs.analyzer.get_spec_vars = (function cljs$analyzer$get_spec_vars(){
if((!((cljs.core.find_ns_obj(new cljs.core.Symbol(null,"cljs.spec.alpha$macros","cljs.spec.alpha$macros",-896343615,null)) == null)))){
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"registry-ref","registry-ref",335292414),cljs.core.deref(registry_ref_49460),new cljs.core.Keyword(null,"speced-vars","speced-vars",-1813125988),cljs.core.deref(speced_vars_49461)], null);
} else {
return null;
}
});
/**
 * Dumps registered speced vars for a given namespace into the compiler
 *   environment.
 */
cljs.analyzer.dump_specs = (function cljs$analyzer$dump_specs(ns){
var spec_vars = cljs.analyzer.get_spec_vars();
var ns_str = cljs.core.str.cljs$core$IFn$_invoke$arity$1(ns);
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$variadic(cljs.env._STAR_compiler_STAR_,cljs.core.update_in,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("cljs.analyzer","namespaces","cljs.analyzer/namespaces",-260788927),ns], null),cljs.core.merge,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([(function (){var temp__5804__auto__ = new cljs.core.Keyword(null,"registry-ref","registry-ref",335292414).cljs$core$IFn$_invoke$arity$1(spec_vars);
if(cljs.core.truth_(temp__5804__auto__)){
var registry_ref = temp__5804__auto__;
return new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("cljs.spec","registry-ref","cljs.spec/registry-ref",-71711915),cljs.core.into.cljs$core$IFn$_invoke$arity$3(cljs.core.PersistentVector.EMPTY,cljs.core.filter.cljs$core$IFn$_invoke$arity$1((function (p__47729){
var vec__47730 = p__47729;
var k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__47730,(0),null);
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__47730,(1),null);
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(ns_str,cljs.core.namespace(k));
})),cljs.core.deref(cljs.core.deref(registry_ref)))], null);
} else {
return null;
}
})(),(function (){var temp__5804__auto__ = new cljs.core.Keyword(null,"speced-vars","speced-vars",-1813125988).cljs$core$IFn$_invoke$arity$1(spec_vars);
if(cljs.core.truth_(temp__5804__auto__)){
var speced_vars = temp__5804__auto__;
return new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("cljs.spec","speced-vars","cljs.spec/speced-vars",1010010387),cljs.core.into.cljs$core$IFn$_invoke$arity$3(cljs.core.PersistentVector.EMPTY,cljs.core.filter.cljs$core$IFn$_invoke$arity$1((function (v){
return ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(ns_str,cljs.core.namespace(v))) || (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(ns,new cljs.core.Keyword(null,"fdef-ns","fdef-ns",-1602124254).cljs$core$IFn$_invoke$arity$1(cljs.core.meta(v)))));
})),cljs.core.deref(cljs.core.deref(speced_vars)))], null);
} else {
return null;
}
})()], 0));
});
/**
 * Registers speced vars found in a namespace analysis cache.
 */
cljs.analyzer.register_specs = (function cljs$analyzer$register_specs(cached_ns){
var map__47743 = cljs.analyzer.get_spec_vars();
var map__47743__$1 = cljs.core.__destructure_map(map__47743);
var registry_ref = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__47743__$1,new cljs.core.Keyword(null,"registry-ref","registry-ref",335292414));
var speced_vars = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__47743__$1,new cljs.core.Keyword(null,"speced-vars","speced-vars",-1813125988));
var temp__5804__auto___49467 = cljs.core.seq(new cljs.core.Keyword("cljs.spec","registry-ref","cljs.spec/registry-ref",-71711915).cljs$core$IFn$_invoke$arity$1(cached_ns));
if(temp__5804__auto___49467){
var registry_49468 = temp__5804__auto___49467;
if(cljs.core.truth_(registry_ref)){
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$3(cljs.core.deref(registry_ref),cljs.core.into,registry_49468);
} else {
}
} else {
}

var temp__5804__auto__ = cljs.core.seq(new cljs.core.Keyword("cljs.spec","speced-vars","cljs.spec/speced-vars",1010010387).cljs$core$IFn$_invoke$arity$1(cached_ns));
if(temp__5804__auto__){
var vars = temp__5804__auto__;
if(cljs.core.truth_(speced_vars)){
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$3(cljs.core.deref(speced_vars),cljs.core.into,vars);
} else {
return null;
}
} else {
return null;
}
});
cljs.analyzer.analyze_form_seq = (function cljs$analyzer$analyze_form_seq(var_args){
var G__47755 = arguments.length;
switch (G__47755) {
case 1:
return cljs.analyzer.analyze_form_seq.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return cljs.analyzer.analyze_form_seq.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return cljs.analyzer.analyze_form_seq.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(cljs.analyzer.analyze_form_seq.cljs$core$IFn$_invoke$arity$1 = (function (forms){
return cljs.analyzer.analyze_form_seq.cljs$core$IFn$_invoke$arity$2(forms,(cljs.core.truth_(cljs.env._STAR_compiler_STAR_)?new cljs.core.Keyword(null,"options","options",99638489).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(cljs.env._STAR_compiler_STAR_)):null));
}));

(cljs.analyzer.analyze_form_seq.cljs$core$IFn$_invoke$arity$2 = (function (forms,opts){
return cljs.analyzer.analyze_form_seq.cljs$core$IFn$_invoke$arity$3(forms,opts,false);
}));

(cljs.analyzer.analyze_form_seq.cljs$core$IFn$_invoke$arity$3 = (function (forms,opts,return_last_QMARK_){
var env = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(cljs.analyzer.empty_env(),new cljs.core.Keyword(null,"build-options","build-options",1183685779),opts);
var _STAR_file_defs_STAR__orig_val__47760 = cljs.analyzer._STAR_file_defs_STAR_;
var _STAR_cljs_ns_STAR__orig_val__47761 = cljs.analyzer._STAR_cljs_ns_STAR_;
var _STAR_cljs_file_STAR__orig_val__47762 = cljs.analyzer._STAR_cljs_file_STAR_;
var _STAR_alias_map_STAR__orig_val__47763 = cljs.tools.reader._STAR_alias_map_STAR_;
var _STAR_file_defs_STAR__temp_val__47764 = null;
var _STAR_cljs_ns_STAR__temp_val__47765 = new cljs.core.Symbol(null,"cljs.user","cljs.user",877795071,null);
var _STAR_cljs_file_STAR__temp_val__47766 = null;
var _STAR_alias_map_STAR__temp_val__47767 = (function (){var or__5002__auto__ = cljs.tools.reader._STAR_alias_map_STAR_;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.PersistentArrayMap.EMPTY;
}
})();
(cljs.analyzer._STAR_file_defs_STAR_ = _STAR_file_defs_STAR__temp_val__47764);

(cljs.analyzer._STAR_cljs_ns_STAR_ = _STAR_cljs_ns_STAR__temp_val__47765);

(cljs.analyzer._STAR_cljs_file_STAR_ = _STAR_cljs_file_STAR__temp_val__47766);

(cljs.tools.reader._STAR_alias_map_STAR_ = _STAR_alias_map_STAR__temp_val__47767);

try{var ns = null;
var forms__$1 = forms;
var last_ast = null;
while(true){
if((!((forms__$1 == null)))){
var form = cljs.core.first(forms__$1);
var env__$1 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(env,new cljs.core.Keyword(null,"ns","ns",441598760),cljs.analyzer.get_namespace.cljs$core$IFn$_invoke$arity$1(cljs.analyzer._STAR_cljs_ns_STAR_));
var ast = cljs.analyzer.analyze.cljs$core$IFn$_invoke$arity$4(env__$1,form,null,opts);
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"op","op",-1882987955).cljs$core$IFn$_invoke$arity$1(ast),new cljs.core.Keyword(null,"ns","ns",441598760))){
var G__49472 = new cljs.core.Keyword(null,"name","name",1843675177).cljs$core$IFn$_invoke$arity$1(ast);
var G__49473 = cljs.core.next(forms__$1);
var G__49474 = ast;
ns = G__49472;
forms__$1 = G__49473;
last_ast = G__49474;
continue;
} else {
var G__49475 = ns;
var G__49476 = cljs.core.next(forms__$1);
var G__49477 = ast;
ns = G__49475;
forms__$1 = G__49476;
last_ast = G__49477;
continue;
}
} else {
if(cljs.core.truth_(return_last_QMARK_)){
return last_ast;
} else {
return ns;
}
}
break;
}
}finally {(cljs.tools.reader._STAR_alias_map_STAR_ = _STAR_alias_map_STAR__orig_val__47763);

(cljs.analyzer._STAR_cljs_file_STAR_ = _STAR_cljs_file_STAR__orig_val__47762);

(cljs.analyzer._STAR_cljs_ns_STAR_ = _STAR_cljs_ns_STAR__orig_val__47761);

(cljs.analyzer._STAR_file_defs_STAR_ = _STAR_file_defs_STAR__orig_val__47760);
}}));

(cljs.analyzer.analyze_form_seq.cljs$lang$maxFixedArity = 3);

/**
 * Ensures that a non-nil defs map exists in the compiler state for a given
 *   ns. (A non-nil defs map signifies that the namespace has been analyzed.)
 */
cljs.analyzer.ensure_defs = (function cljs$analyzer$ensure_defs(ns){
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(cljs.env._STAR_compiler_STAR_,cljs.core.update_in,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("cljs.analyzer","namespaces","cljs.analyzer/namespaces",-260788927),ns,new cljs.core.Keyword(null,"defs","defs",1398449717)], null),(function (p1__47787_SHARP_){
var or__5002__auto__ = p1__47787_SHARP_;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.PersistentArrayMap.EMPTY;
}
}));
});

//# sourceMappingURL=cljs.analyzer.js.map
