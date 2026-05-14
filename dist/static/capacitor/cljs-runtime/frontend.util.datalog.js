goog.provide('frontend.util.datalog');
/**
 * Given where clauses and a set of valid rules, returns rules found in where
 *   clause as keywords. A more advanced version of this would use a datalog parser
 * and not require valid-rules
 */
frontend.util.datalog.find_rules_in_where = (function frontend$util$datalog$find_rules_in_where(where,valid_rules){
return cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.keyword,cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (p1__104204_SHARP_){
return (((p1__104204_SHARP_ instanceof cljs.core.Symbol)) && (cljs.core.contains_QMARK_(valid_rules,cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(p1__104204_SHARP_))));
}),cljs.core.distinct.cljs$core$IFn$_invoke$arity$1(cljs.core.flatten(where))));
});
/**
 * Converts query vec to query map. Modified version of
 *   datascript.parser/query->map which preserves insertion order in case map is
 *   converted back to vec
 */
frontend.util.datalog.query_vec__GT_map = (function frontend$util$datalog$query_vec__GT_map(query_vec){
var parsed = cljs.core.PersistentArrayMap.EMPTY;
var key = null;
var qs = query_vec;
while(true){
var temp__5802__auto__ = cljs.core.first(qs);
if(cljs.core.truth_(temp__5802__auto__)){
var q = temp__5802__auto__;
if((q instanceof cljs.core.Keyword)){
var G__104210 = parsed;
var G__104211 = q;
var G__104212 = cljs.core.next(qs);
parsed = G__104210;
key = G__104211;
qs = G__104212;
continue;
} else {
var G__104213 = cljs.core.update_in.cljs$core$IFn$_invoke$arity$4(parsed,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [key], null),cljs.core.fnil.cljs$core$IFn$_invoke$arity$2(cljs.core.conj,cljs.core.PersistentVector.EMPTY),q);
var G__104214 = key;
var G__104215 = cljs.core.next(qs);
parsed = G__104213;
key = G__104214;
qs = G__104215;
continue;
}
} else {
return parsed;
}
break;
}
});
/**
 * Adds vec of elements to end of a query section e.g. :find or :in
 */
frontend.util.datalog.add_to_end_of_query_section = (function frontend$util$datalog$add_to_end_of_query_section(query_vec,query_kw,elems){
var query_map = frontend.util.datalog.query_vec__GT_map(query_vec);
return cljs.core.vec(cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (acc,p__104206){
var vec__104207 = p__104206;
var k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__104207,(0),null);
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__104207,(1),null);
return cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic(acc,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [k], null),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([v,((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(k,query_kw))?elems:null)], 0));
}),cljs.core.List.EMPTY,query_map));
});

//# sourceMappingURL=frontend.util.datalog.js.map
