goog.provide('frontend.background_tasks');
frontend.common.missionary.run_background_task(new cljs.core.Keyword("logseq.db.common.entity-plus","reset-immutable-entities-cache!","logseq.db.common.entity-plus/reset-immutable-entities-cache!",876655830),missionary.core.reduce.cljs$core$IFn$_invoke$arity$2((function (_,repo){
if((!((repo == null)))){
return logseq.db.common.entity_plus.reset_immutable_entities_cache_BANG_();
} else {
return null;
}
}),frontend.flows.current_repo_flow));
frontend.common.missionary.run_background_task(new cljs.core.Keyword("frontend.background-tasks","sync-to-worker-network-online-status","frontend.background-tasks/sync-to-worker-network-online-status",2102264102),missionary.core.reduce.cljs$core$IFn$_invoke$arity$2((function (_,p__90892){
var vec__90893 = p__90892;
var online_QMARK_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__90893,(0),null);
var db_worker_ready_QMARK_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__90893,(1),null);
if(cljs.core.truth_(db_worker_ready_QMARK_)){
return frontend.state._LT_invoke_db_worker.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword("thread-api","update-thread-atom","thread-api/update-thread-atom",-496405616),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("thread-atom","online-event","thread-atom/online-event",-68671588),online_QMARK_], 0));
} else {
return null;
}
}),missionary.core.latest.cljs$core$IFn$_invoke$arity$variadic(cljs.core.vector,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([frontend.flows.network_online_event_flow,frontend.state.db_worker_ready_flow], 0))));

//# sourceMappingURL=frontend.background_tasks.js.map
