goog.provide('frontend.components.query.result');
frontend.components.query.result.run_custom_query = (function frontend$components$query$result$run_custom_query(config,query,_STAR_result,_STAR_query_error){
var repo = frontend.state.get_current_repo();
var current_block_uuid = (function (){var or__5002__auto__ = new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"block","block",664686210).cljs$core$IFn$_invoke$arity$1(config));
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(config);
}
})();
var _ = cljs.core.reset_BANG_(_STAR_query_error,null);
try{if(cljs.core.truth_(new cljs.core.Keyword(null,"dsl-query?","dsl-query?",-1061528662).cljs$core$IFn$_invoke$arity$1(config))){
var q = new cljs.core.Keyword(null,"query","query",-1288509510).cljs$core$IFn$_invoke$arity$1(query);
var form = logseq.common.util.safe_read_string.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"log-error?","log-error?",969837063),false], null),q);
if((((form instanceof cljs.core.Symbol)) && (cljs.core.not(cljs.core.re_matches(frontend.template.template_re,clojure.string.trim(q)))))){
return null;
} else {
if(cljs.core.truth_(cljs.core.re_matches(/^\".*\"$/,q))){
promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.search.block_search(repo,clojure.string.trim(form),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"limit","limit",-1355822363),(30)], null))),(function (blocks){
return promesa.protocols._promise(((cljs.core.seq(blocks))?(function (){var result = cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (b){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(b),current_block_uuid)){
return null;
} else {
var entity = (function (){var or__5002__auto__ = (function (){var G__113104 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(b)], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__113104) : frontend.db.entity.call(null,G__113104));
})();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return b;
}
})();
if(cljs.core.truth_((logseq.db.hidden_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.hidden_QMARK_.cljs$core$IFn$_invoke$arity$1(entity) : logseq.db.hidden_QMARK_.call(null,entity)))){
return null;
} else {
return entity;
}
}
}),blocks);
return cljs.core.reset_BANG_(_STAR_result,result);
})():null));
}));
}));

return rum.core.react(_STAR_result);
} else {
var result = frontend.db.query_dsl.query.cljs$core$IFn$_invoke$arity$3(frontend.state.get_current_repo(),q,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"cards?","cards?",1232384109),new cljs.core.Keyword(null,"cards?","cards?",1232384109).cljs$core$IFn$_invoke$arity$1(config)], null));
if(frontend.util.atom_QMARK_(result)){
return rum.core.react(result);
} else {
return null;
}

}
}
} else {
return frontend.util.react(frontend.db.query_custom.custom_query.cljs$core$IFn$_invoke$arity$2(query,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"current-block-uuid","current-block-uuid",-559721957),current_block_uuid,new cljs.core.Keyword(null,"built-in-query?","built-in-query?",-1060650385),new cljs.core.Keyword(null,"built-in-query?","built-in-query?",-1060650385).cljs$core$IFn$_invoke$arity$1(config)], null)));

}
}catch (e113046){var e = e113046;
return cljs.core.reset_BANG_(_STAR_query_error,e);
}});
frontend.components.query.result.get_group_by_page = (function frontend$components$query$result$get_group_by_page(p__113143,p__113144){
var map__113145 = p__113143;
var map__113145__$1 = cljs.core.__destructure_map(map__113145);
var query_m = map__113145__$1;
var result_transform = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__113145__$1,new cljs.core.Keyword(null,"result-transform","result-transform",1904908186));
var query = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__113145__$1,new cljs.core.Keyword(null,"query","query",-1288509510));
var map__113146 = p__113144;
var map__113146__$1 = cljs.core.__destructure_map(map__113146);
var table_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__113146__$1,new cljs.core.Keyword(null,"table?","table?",-1064705406));
var db_graph_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__113146__$1,new cljs.core.Keyword(null,"db-graph?","db-graph?",-533494876));
if(cljs.core.truth_((function (){var or__5002__auto__ = table_QMARK_;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return db_graph_QMARK_;
}
})())){
return false;
} else {
return cljs.core.get.cljs$core$IFn$_invoke$arity$3(query_m,new cljs.core.Keyword(null,"group-by-page?","group-by-page?",1520059448),((cljs.core.not(result_transform)) && ((!(((typeof query === 'string') && (clojure.string.includes_QMARK_(query,"(by-page false)"))))))));
}
});
/**
 * Transforms a query result if query conditions and config indicate a transformation
 */
frontend.components.query.result.transform_query_result = (function frontend$components$query$result$transform_query_result(p__113157,query_m,query_result){
var map__113158 = p__113157;
var map__113158__$1 = cljs.core.__destructure_map(map__113158);
var config = map__113158__$1;
var current_block_uuid = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__113158__$1,new cljs.core.Keyword(null,"current-block-uuid","current-block-uuid",-559721957));
var remove_blocks = (cljs.core.truth_(current_block_uuid)?new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [current_block_uuid], null):null);
var transformed_query_result = (cljs.core.truth_(query_result)?(function (){var result = frontend.db.query_react.custom_query_result_transform(query_result,remove_blocks,query_m);
if(cljs.core.truth_((function (){var and__5000__auto__ = query_result;
if(cljs.core.truth_(and__5000__auto__)){
var and__5000__auto____$1 = cljs.core.coll_QMARK_(result);
if(and__5000__auto____$1){
return new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(cljs.core.first(result));
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})())){
var G__113160 = result;
if(cljs.core.truth_((function (){var and__5000__auto__ = cljs.core.not(new cljs.core.Keyword(null,"db-graph?","db-graph?",-533494876).cljs$core$IFn$_invoke$arity$1(config));
if(and__5000__auto__){
return cljs.core.get.cljs$core$IFn$_invoke$arity$3(query_m,new cljs.core.Keyword(null,"remove-block-children?","remove-block-children?",-228491460),true);
} else {
return and__5000__auto__;
}
})())){
return (frontend.modules.outliner.tree.filter_top_level_blocks.cljs$core$IFn$_invoke$arity$1 ? frontend.modules.outliner.tree.filter_top_level_blocks.cljs$core$IFn$_invoke$arity$1(G__113160) : frontend.modules.outliner.tree.filter_top_level_blocks.call(null,G__113160));
} else {
return G__113160;
}
} else {
return result;
}
})():null);
var group_by_page_QMARK_ = frontend.components.query.result.get_group_by_page(query_m,config);
var result = (cljs.core.truth_((function (){var and__5000__auto__ = group_by_page_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(cljs.core.first(transformed_query_result));
} else {
return and__5000__auto__;
}
})())?(function (){var result = frontend.db.utils.group_by_page(transformed_query_result);
if(cljs.core.map_QMARK_(result)){
return cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(result,null);
} else {
return result;
}
})():transformed_query_result);
var temp__5804__auto___113174 = new cljs.core.Keyword(null,"query-result","query-result",-833644142).cljs$core$IFn$_invoke$arity$1(config);
if(cljs.core.truth_(temp__5804__auto___113174)){
var query_result_113175__$1 = temp__5804__auto___113174;
cljs.core.reset_BANG_(query_result_113175__$1,result);
} else {
}

return result;
});

//# sourceMappingURL=frontend.components.query.result.js.map
