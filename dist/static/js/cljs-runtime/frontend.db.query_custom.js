goog.provide('frontend.db.query_custom');
frontend.db.query_custom.replace_star_with_block_attrs_BANG_ = (function frontend$db$query_custom$replace_star_with_block_attrs_BANG_(l){
var block_attrs = cljs.core.butlast(frontend.db.file_based.model.file_graph_block_attrs);
return clojure.walk.postwalk((function (f){
if(((cljs.core.list_QMARK_(f)) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Symbol(null,"pull","pull",779986722,null),cljs.core.first(f))) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Symbol(null,"?b","?b",1575118075,null),cljs.core.second(f))) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"*","*",345799209,null)], null),cljs.core.nth.cljs$core$IFn$_invoke$arity$2(f,(2)))))))))){
return cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic((new cljs.core.List(null,new cljs.core.Symbol(null,"pull","pull",779986722,null),null,(1),null)),(new cljs.core.List(null,new cljs.core.Symbol(null,"?b","?b",1575118075,null),null,(1),null)),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([(new cljs.core.List(null,block_attrs,null,(1),null))], 0))));
} else {
return f;
}
}),l);
});
/**
 * Searches query's :where for rules and adds them to query if used
 */
frontend.db.query_custom.add_rules_to_query = (function frontend$db$query_custom$add_rules_to_query(p__112886,p__112887){
var map__112888 = p__112886;
var map__112888__$1 = cljs.core.__destructure_map(map__112888);
var query_m = map__112888__$1;
var query = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__112888__$1,new cljs.core.Keyword(null,"query","query",-1288509510));
var map__112889 = p__112887;
var map__112889__$1 = cljs.core.__destructure_map(map__112889);
var db_graph_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__112889__$1,new cljs.core.Keyword(null,"db-graph?","db-graph?",-533494876));
var map__112890 = frontend.util.datalog.query_vec__GT_map(query);
var map__112890__$1 = cljs.core.__destructure_map(map__112890);
var where = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__112890__$1,new cljs.core.Keyword(null,"where","where",-2044795965));
var in$ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__112890__$1,new cljs.core.Keyword(null,"in","in",-1531184865));
var query_dsl_rules = (cljs.core.truth_(db_graph_QMARK_)?logseq.db.frontend.rules.db_query_dsl_rules:logseq.db.file_based.rules.query_dsl_rules);
var rules_found = frontend.util.datalog.find_rules_in_where(where,cljs.core.set(cljs.core.keys(query_dsl_rules)));
if(cljs.core.seq(rules_found)){
if(((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Symbol(null,"%","%",-950237169,null),cljs.core.last(in$))) && (cljs.core.vector_QMARK_(cljs.core.last(new cljs.core.Keyword(null,"inputs","inputs",865803858).cljs$core$IFn$_invoke$arity$1(query_m)))))){
return cljs.core.update.cljs$core$IFn$_invoke$arity$3(query_m,new cljs.core.Keyword(null,"inputs","inputs",865803858),(function (inputs){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(cljs.core.vec(inputs),(cljs.core.count(inputs) - (1)),cljs.core.vec(cljs.core.distinct.cljs$core$IFn$_invoke$arity$1(cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.last(inputs),logseq.db.frontend.rules.extract_rules.cljs$core$IFn$_invoke$arity$variadic(query_dsl_rules,rules_found,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([(cljs.core.truth_(db_graph_QMARK_)?new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"deps","deps",1883360319),logseq.db.frontend.rules.rules_dependencies], null):null)], 0))))));
}));
} else {
return cljs.core.update.cljs$core$IFn$_invoke$arity$3(cljs.core.update.cljs$core$IFn$_invoke$arity$3(query_m,new cljs.core.Keyword(null,"query","query",-1288509510),(function (q){
if(cljs.core.contains_QMARK_(cljs.core.set(q),new cljs.core.Keyword(null,"in","in",-1531184865))){
if((!(cljs.core.contains_QMARK_(cljs.core.set(q),new cljs.core.Symbol(null,"%","%",-950237169,null))))){
return frontend.util.datalog.add_to_end_of_query_section(q,new cljs.core.Keyword(null,"in","in",-1531184865),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"%","%",-950237169,null)], null));
} else {
return q;
}
} else {
return cljs.core.into.cljs$core$IFn$_invoke$arity$2(q,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"in","in",-1531184865),new cljs.core.Symbol(null,"$","$",-1580747756,null),new cljs.core.Symbol(null,"%","%",-950237169,null)], null));
}
})),new cljs.core.Keyword(null,"rules","rules",1198912366),(function (rules){
return cljs.core.into.cljs$core$IFn$_invoke$arity$2((function (){var or__5002__auto__ = rules;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.PersistentVector.EMPTY;
}
})(),logseq.db.frontend.rules.extract_rules.cljs$core$IFn$_invoke$arity$variadic(query_dsl_rules,rules_found,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([(cljs.core.truth_(db_graph_QMARK_)?new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"deps","deps",1883360319),logseq.db.frontend.rules.rules_dependencies], null):null)], 0)));
}));
}
} else {
return query_m;
}
});
/**
 * Executes a datalog query through query-react, given either a regular datalog
 *   query or a simple query
 */
frontend.db.query_custom.custom_query = (function frontend$db$query_custom$custom_query(var_args){
var G__112900 = arguments.length;
switch (G__112900) {
case 1:
return frontend.db.query_custom.custom_query.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return frontend.db.query_custom.custom_query.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return frontend.db.query_custom.custom_query.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.db.query_custom.custom_query.cljs$core$IFn$_invoke$arity$1 = (function (query){
return frontend.db.query_custom.custom_query.cljs$core$IFn$_invoke$arity$2(query,cljs.core.PersistentArrayMap.EMPTY);
}));

(frontend.db.query_custom.custom_query.cljs$core$IFn$_invoke$arity$2 = (function (query,query_opts){
return frontend.db.query_custom.custom_query.cljs$core$IFn$_invoke$arity$3(frontend.state.get_current_repo(),query,query_opts);
}));

(frontend.db.query_custom.custom_query.cljs$core$IFn$_invoke$arity$3 = (function (repo,query,query_opts){
var db_graph_QMARK_ = frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(repo);
var query_SINGLEQUOTE_ = ((db_graph_QMARK_)?query:frontend.db.query_custom.replace_star_with_block_attrs_BANG_(query));
var query_opts__$1 = (cljs.core.truth_(new cljs.core.Keyword(null,"query-string","query-string",-1018845061).cljs$core$IFn$_invoke$arity$1(query_opts))?query_opts:cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(query_opts,new cljs.core.Keyword(null,"query-string","query-string",-1018845061),cljs.core.str.cljs$core$IFn$_invoke$arity$1(query)));
if(((cljs.core.list_QMARK_(new cljs.core.Keyword(null,"query","query",-1288509510).cljs$core$IFn$_invoke$arity$1(query_SINGLEQUOTE_))) || (cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"find","find",496279456),cljs.core.first(new cljs.core.Keyword(null,"query","query",-1288509510).cljs$core$IFn$_invoke$arity$1(query_SINGLEQUOTE_)))))){
return frontend.db.query_dsl.custom_query(repo,query_SINGLEQUOTE_,query_opts__$1);
} else {
return frontend.db.query_react.react_query(repo,frontend.db.query_custom.add_rules_to_query(query_SINGLEQUOTE_,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"db-graph?","db-graph?",-533494876),db_graph_QMARK_], null)),query_opts__$1);
}
}));

(frontend.db.query_custom.custom_query.cljs$lang$maxFixedArity = 3);


//# sourceMappingURL=frontend.db.query_custom.js.map
