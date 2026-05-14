goog.provide('frontend.worker.rtc.asset_db_listener');
frontend.worker.rtc.asset_db_listener.max_t = (function frontend$worker$rtc$asset_db_listener$max_t(entity_datoms){
return cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core.max,cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p__133731){
var vec__133732 = p__133731;
var _e = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__133732,(0),null);
var _a = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__133732,(1),null);
var _v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__133732,(2),null);
var t = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__133732,(3),null);
return t;
}),entity_datoms));
});
frontend.worker.rtc.asset_db_listener.asset_related_attrs_changed_QMARK_ = (function frontend$worker$rtc$asset_db_listener$asset_related_attrs_changed_QMARK_(entity_datoms){
return cljs.core.some((function (p__133736){
var vec__133737 = p__133736;
var _e = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__133737,(0),null);
var a = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__133737,(1),null);
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("logseq.property.asset","checksum","logseq.property.asset/checksum",-1011416979),a);
}),entity_datoms);
});
frontend.worker.rtc.asset_db_listener.entity_datoms_EQ__GT_ops = (function frontend$worker$rtc$asset_db_listener$entity_datoms_EQ__GT_ops(db_before,db_after,entity_datoms){
var temp__5804__auto__ = cljs.core.ffirst(entity_datoms);
if(cljs.core.truth_(temp__5804__auto__)){
var e = temp__5804__auto__;
var ent_after = (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db_after,e) : datascript.core.entity.call(null,db_after,e));
var ent_before = (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db_before,e) : datascript.core.entity.call(null,db_before,e));
if(cljs.core.truth_((function (){var and__5000__auto__ = (function (){var G__133741 = ent_after;
if((G__133741 == null)){
return null;
} else {
return (logseq.db.asset_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.asset_QMARK_.cljs$core$IFn$_invoke$arity$1(G__133741) : logseq.db.asset_QMARK_.call(null,G__133741));
}
})();
if(cljs.core.truth_(and__5000__auto__)){
return frontend.worker.rtc.asset_db_listener.asset_related_attrs_changed_QMARK_(entity_datoms);
} else {
return and__5000__auto__;
}
})())){
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"update-asset","update-asset",501550582),frontend.worker.rtc.asset_db_listener.max_t(entity_datoms),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"block-uuid","block-uuid",-1558039638),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(ent_after)], null)], null)], null);
} else {
if(cljs.core.truth_((function (){var and__5000__auto__ = (function (){var G__133742 = ent_before;
if((G__133742 == null)){
return null;
} else {
return (logseq.db.asset_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.asset_QMARK_.cljs$core$IFn$_invoke$arity$1(G__133742) : logseq.db.asset_QMARK_.call(null,G__133742));
}
})();
if(cljs.core.truth_(and__5000__auto__)){
return (ent_after == null);
} else {
return and__5000__auto__;
}
})())){
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"remove-asset","remove-asset",-1739744854),frontend.worker.rtc.asset_db_listener.max_t(entity_datoms),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"block-uuid","block-uuid",-1558039638),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(ent_before)], null)], null)], null);
} else {
return null;
}
}
} else {
return null;
}
});
frontend.worker.rtc.asset_db_listener.generate_asset_ops = (function frontend$worker$rtc$asset_db_listener$generate_asset_ops(repo,db_before,db_after,same_entity_datoms_coll){
var temp__5804__auto__ = cljs.core.not_empty(cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic(cljs.core.partial.cljs$core$IFn$_invoke$arity$3(frontend.worker.rtc.asset_db_listener.entity_datoms_EQ__GT_ops,db_before,db_after),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([same_entity_datoms_coll], 0)));
if(cljs.core.truth_(temp__5804__auto__)){
var ops = temp__5804__auto__;
return frontend.worker.rtc.client_op.add_asset_ops(repo,ops);
} else {
return null;
}
});
frontend.worker.db_listener.listen_db_changes.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"gen-asset-change-events","gen-asset-change-events",-1427237929),(function (_,p__133755,p__133756){
var map__133757 = p__133755;
var map__133757__$1 = cljs.core.__destructure_map(map__133757);
var repo = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__133757__$1,new cljs.core.Keyword(null,"repo","repo",-1999060679));
var same_entity_datoms_coll = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__133757__$1,new cljs.core.Keyword(null,"same-entity-datoms-coll","same-entity-datoms-coll",336475623));
var map__133758 = p__133756;
var map__133758__$1 = cljs.core.__destructure_map(map__133758);
var _tx_data = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__133758__$1,new cljs.core.Keyword(null,"_tx-data","_tx-data",-169400406));
var tx_meta = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__133758__$1,new cljs.core.Keyword(null,"tx-meta","tx-meta",1159283194));
var db_before = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__133758__$1,new cljs.core.Keyword(null,"db-before","db-before",-553691536));
var db_after = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__133758__$1,new cljs.core.Keyword(null,"db-after","db-after",-571884666));
if(cljs.core.truth_((function (){var and__5000__auto__ = frontend.worker.rtc.client_op.rtc_db_graph_QMARK_(repo);
if(cljs.core.truth_(and__5000__auto__)){
return new cljs.core.Keyword(null,"persist-op?","persist-op?",-531287534).cljs$core$IFn$_invoke$arity$2(tx_meta,true);
} else {
return and__5000__auto__;
}
})())){
return frontend.worker.rtc.asset_db_listener.generate_asset_ops(repo,db_before,db_after,same_entity_datoms_coll);
} else {
return null;
}
}));

//# sourceMappingURL=frontend.worker.rtc.asset_db_listener.js.map
