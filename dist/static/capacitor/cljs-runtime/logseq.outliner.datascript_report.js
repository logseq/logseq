goog.provide('logseq.outliner.datascript_report');
logseq.outliner.datascript_report.keys_of_deleted_entity = (1);
/**
 * Get the entity from db after if possible; otherwise get entity from db before
 * Useful for fetching deleted elements
 */
logseq.outliner.datascript_report.get_entity_from_db_after_or_before = (function logseq$outliner$datascript_report$get_entity_from_db_after_or_before(db_before,db_after,db_id){
var r = (function (){var G__63263 = db_after;
var G__63264 = new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"*","*",345799209,null)], null);
var G__63265 = db_id;
return (datascript.core.pull.cljs$core$IFn$_invoke$arity$3 ? datascript.core.pull.cljs$core$IFn$_invoke$arity$3(G__63263,G__63264,G__63265) : datascript.core.pull.call(null,G__63263,G__63264,G__63265));
})();
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(logseq.outliner.datascript_report.keys_of_deleted_entity,cljs.core.count(r))){
var G__63268 = db_before;
var G__63269 = new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"*","*",345799209,null)], null);
var G__63270 = db_id;
return (datascript.core.pull.cljs$core$IFn$_invoke$arity$3 ? datascript.core.pull.cljs$core$IFn$_invoke$arity$3(G__63268,G__63269,G__63270) : datascript.core.pull.call(null,G__63268,G__63269,G__63270));
} else {
return r;
}
});
/**
 * Calculate updated blocks and pages based on the db-before and db-after from tx-report
 */
logseq.outliner.datascript_report.get_blocks_and_pages = (function logseq$outliner$datascript_report$get_blocks_and_pages(p__63283){
var map__63284 = p__63283;
var map__63284__$1 = cljs.core.__destructure_map(map__63284);
var db_before = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__63284__$1,new cljs.core.Keyword(null,"db-before","db-before",-553691536));
var db_after = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__63284__$1,new cljs.core.Keyword(null,"db-after","db-after",-571884666));
var tx_data = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__63284__$1,new cljs.core.Keyword(null,"tx-data","tx-data",934159761));
var tx_meta = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__63284__$1,new cljs.core.Keyword(null,"tx-meta","tx-meta",1159283194));
var updated_db_ids = cljs.core.set(cljs.core.mapv.cljs$core$IFn$_invoke$arity$2(cljs.core.first,tx_data));
var result = cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (acc,x){
var block_entity = logseq.outliner.datascript_report.get_entity_from_db_after_or_before(db_before,db_after,x);
var page_entity = (function (){var temp__5804__auto__ = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","page","block/page",822314108).cljs$core$IFn$_invoke$arity$1(block_entity));
if(cljs.core.truth_(temp__5804__auto__)){
var page_id = temp__5804__auto__;
return logseq.outliner.datascript_report.get_entity_from_db_after_or_before(db_before,db_after,page_id);
} else {
return null;
}
})();
var G__63294 = acc;
var G__63294__$1 = (((!((block_entity == null))))?cljs.core.update.cljs$core$IFn$_invoke$arity$4(G__63294,new cljs.core.Keyword(null,"blocks","blocks",-610462153),cljs.core.conj,block_entity):G__63294);
if((!((page_entity == null)))){
return cljs.core.update.cljs$core$IFn$_invoke$arity$4(G__63294__$1,new cljs.core.Keyword(null,"pages","pages",-285406513),cljs.core.conj,page_entity);
} else {
return G__63294__$1;
}
}),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"blocks","blocks",-610462153),cljs.core.PersistentHashSet.EMPTY,new cljs.core.Keyword(null,"pages","pages",-285406513),cljs.core.PersistentHashSet.EMPTY], null),updated_db_ids);
var tx_meta_pages = cljs.core.set(cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__63279_SHARP_){
return logseq.outliner.datascript_report.get_entity_from_db_after_or_before(db_before,db_after,p1__63279_SHARP_);
}),cljs.core.remove.cljs$core$IFn$_invoke$arity$2(cljs.core.nil_QMARK_,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"from-page","from-page",75165656).cljs$core$IFn$_invoke$arity$1(tx_meta),new cljs.core.Keyword(null,"target-page","target-page",-920102649).cljs$core$IFn$_invoke$arity$1(tx_meta)], null))));
if(cljs.core.seq(tx_meta_pages)){
return cljs.core.update.cljs$core$IFn$_invoke$arity$4(result,new cljs.core.Keyword(null,"pages","pages",-285406513),clojure.set.union,tx_meta_pages);
} else {
return result;
}
});

//# sourceMappingURL=logseq.outliner.datascript_report.js.map
