goog.provide('frontend.components.query.view');
frontend.components.query.view.columns = (function frontend$components$query$view$columns(config,result){
return (function (cs){
return frontend.components.views.build_columns.cljs$core$IFn$_invoke$arity$variadic(config,cs,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"add-tags-column?","add-tags-column?",708044916),false], null)], 0));
})(logseq.db.sort_by_order(cljs.core.map.cljs$core$IFn$_invoke$arity$2(frontend.db.entity,cljs.core.distinct.cljs$core$IFn$_invoke$arity$1(cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword("block.temp","property-keys","block.temp/property-keys",2093695024),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([result], 0))))));
});
frontend.components.query.view.result__GT_entities = (function frontend$components$query$view$result__GT_entities(result){
return cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (b){
var or__5002__auto__ = (function (){var G__122323 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(b);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__122323) : frontend.db.entity.call(null,G__122323));
})();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return b;
}
}),result);
});
frontend.components.query.view.init_result = (function frontend$components$query$view$init_result(result,view_entity){
var result_SINGLEQUOTE_ = ((cljs.core.map_QMARK_(result))?cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic(cljs.core.second,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([result], 0)):result);
return cljs.core.remove.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("logseq.property","view-for","logseq.property/view-for",-36274319),cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (b){
return cljs.core.contains_QMARK_(cljs.core.PersistentHashSet.createAsIfByAssoc([new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(view_entity),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("logseq.property","query","logseq.property/query",-97414126).cljs$core$IFn$_invoke$arity$1(view_entity))]),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(b));
}),frontend.components.query.view.result__GT_entities(result_SINGLEQUOTE_)));
});
frontend.components.query.view.query_result = rum.core.lazy_build(rum.core.build_defc,(function (config,view_entity,result_STAR_){
var vec__122364 = rum.core.use_state(frontend.components.query.view.init_result(result_STAR_,view_entity));
var data = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__122364,(0),null);
var set_data_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__122364,(1),null);
var ids = cljs.core.mapv.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","id","db/id",-1388397098),data);
var columns_SINGLEQUOTE_ = frontend.components.query.view.columns(config,data);
logseq.shui.hooks.use_effect_BANG_((function (){
var G__122371 = frontend.components.query.view.init_result(result_STAR_,view_entity);
return (set_data_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_data_BANG_.cljs$core$IFn$_invoke$arity$1(G__122371) : set_data_BANG_.call(null,G__122371));
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [result_STAR_], null));

return daiquiri.core.create_element("div",{'className':"query-result w-full"},[frontend.components.views.view(new cljs.core.PersistentArrayMap(null, 8, [new cljs.core.Keyword(null,"config","config",994861415),cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"custom-query?","custom-query?",-999245951),true], null),new cljs.core.Keyword(null,"sidebar?","sidebar?",-534999672),new cljs.core.Keyword(null,"sidebar?","sidebar?",-534999672).cljs$core$IFn$_invoke$arity$1(config)),new cljs.core.Keyword(null,"title-key","title-key",830482796),new cljs.core.Keyword("views.table","live-query-title","views.table/live-query-title",-464329399),new cljs.core.Keyword(null,"view-entity","view-entity",-1084117808),view_entity,new cljs.core.Keyword(null,"view-feature-type","view-feature-type",-945869610),new cljs.core.Keyword(null,"query-result","query-result",-833644142),new cljs.core.Keyword(null,"data","data",-232669377),ids,new cljs.core.Keyword(null,"set-data!","set-data!",150955183),set_data_BANG_,new cljs.core.Keyword(null,"query-entity-ids","query-entity-ids",2135324416),ids,new cljs.core.Keyword(null,"columns","columns",1998437288),columns_SINGLEQUOTE_], null))]);
}),null,"frontend.components.query.view/query-result");

//# sourceMappingURL=frontend.components.query.view.js.map
