goog.provide('frontend.worker.rtc.db_listener');
frontend.worker.db_listener.listen_db_changes.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"gen-rtc-ops","gen-rtc-ops",-1979747969),(function (_,p__134922,p__134923){
var map__134925 = p__134922;
var map__134925__$1 = cljs.core.__destructure_map(map__134925);
var repo = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__134925__$1,new cljs.core.Keyword(null,"repo","repo",-1999060679));
var same_entity_datoms_coll = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__134925__$1,new cljs.core.Keyword(null,"same-entity-datoms-coll","same-entity-datoms-coll",336475623));
var id__GT_same_entity_datoms = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__134925__$1,new cljs.core.Keyword(null,"id->same-entity-datoms","id->same-entity-datoms",713275082));
var map__134926 = p__134923;
var map__134926__$1 = cljs.core.__destructure_map(map__134926);
var _tx_data = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__134926__$1,new cljs.core.Keyword(null,"_tx-data","_tx-data",-169400406));
var tx_meta = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__134926__$1,new cljs.core.Keyword(null,"tx-meta","tx-meta",1159283194));
var db_before = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__134926__$1,new cljs.core.Keyword(null,"db-before","db-before",-553691536));
var db_after = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__134926__$1,new cljs.core.Keyword(null,"db-after","db-after",-571884666));
if(cljs.core.truth_((function (){var and__5000__auto__ = frontend.worker.rtc.client_op.rtc_db_graph_QMARK_(repo);
if(cljs.core.truth_(and__5000__auto__)){
return new cljs.core.Keyword(null,"persist-op?","persist-op?",-531287534).cljs$core$IFn$_invoke$arity$2(tx_meta,true);
} else {
return and__5000__auto__;
}
})())){
var e__GT_a__GT_add_QMARK___GT_v__GT_t = cljs.core.update_vals(id__GT_same_entity_datoms,frontend.worker.rtc.gen_client_op.entity_datoms_EQ__GT_a__GT_add_QMARK___GT_v__GT_t);
var ops = frontend.worker.rtc.gen_client_op.generate_rtc_ops(db_before,db_after,same_entity_datoms_coll,e__GT_a__GT_add_QMARK___GT_v__GT_t);
if(cljs.core.seq(ops)){
return frontend.worker.rtc.client_op.add_ops_BANG_(repo,ops);
} else {
return null;
}
} else {
return null;
}
}));

//# sourceMappingURL=frontend.worker.rtc.db_listener.js.map
