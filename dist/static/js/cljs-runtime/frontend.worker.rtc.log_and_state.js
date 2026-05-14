goog.provide('frontend.worker.rtc.log_and_state');
frontend.worker.rtc.log_and_state._STAR_rtc_log = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(null);
/**
 * used by rtc-e2e-test
 */
frontend.worker.rtc.log_and_state.rtc_log_flow = missionary.core.watch(frontend.worker.rtc.log_and_state._STAR_rtc_log);
frontend.worker.rtc.log_and_state.rtc_log_type_schema = cljs.core.vec(cljs.core.concat.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"enum","enum",1679018432)], null),cljs.core.take_nth.cljs$core$IFn$_invoke$arity$2((2),(new cljs.core.PersistentVector(null,24,(5),cljs.core.PersistentVector.EMPTY_NODE,[new cljs.core.Keyword("rtc.log","upload","rtc.log/upload",-1832742059),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"doc","doc",1913296891),"rtc log type for upload-graph."], null),new cljs.core.Keyword("rtc.log","download","rtc.log/download",-2144210573),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"doc","doc",1913296891),"rtc log type for upload-graph."], null),new cljs.core.Keyword("rtc.log","cancelled","rtc.log/cancelled",-1356944103),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"doc","doc",1913296891),"rtc has been cancelled"], null),new cljs.core.Keyword("rtc.log","apply-remote-update","rtc.log/apply-remote-update",-1307545458),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"doc","doc",1913296891),"apply remote updates to local graph"], null),new cljs.core.Keyword("rtc.log","push-local-update","rtc.log/push-local-update",-860881879),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"doc","doc",1913296891),"push local updates to remote graph"], null),new cljs.core.Keyword("rtc.log","higher-remote-schema-version-exists","rtc.log/higher-remote-schema-version-exists",1466780034),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"doc","doc",1913296891),"remote-graph with larger schema-version exists"], null),new cljs.core.Keyword("rtc.log","branch-graph","rtc.log/branch-graph",763502753),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"doc","doc",1913296891),"rtc log type for creating a new graph branch"], null),new cljs.core.Keyword("rtc.asset.log","cancelled","rtc.asset.log/cancelled",-1880021289),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"doc","doc",1913296891),"rtc asset sync has been cancelled"], null),new cljs.core.Keyword("rtc.asset.log","upload-assets","rtc.asset.log/upload-assets",1562167732),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"doc","doc",1913296891),"upload local assets to remote"], null),new cljs.core.Keyword("rtc.asset.log","download-assets","rtc.asset.log/download-assets",-1980226986),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"doc","doc",1913296891),"download assets from remote"], null),new cljs.core.Keyword("rtc.asset.log","remove-assets","rtc.asset.log/remove-assets",1813160439),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"doc","doc",1913296891),"remove remote assets"], null),new cljs.core.Keyword("rtc.asset.log","initial-download-missing-assets","rtc.asset.log/initial-download-missing-assets",506527421),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"doc","doc",1913296891),"download assets if not exists in rtc-asset-sync initial phase"], null)],null)))));
frontend.worker.rtc.log_and_state.rtc_log_type_validator = malli.core.validator.cljs$core$IFn$_invoke$arity$1(frontend.worker.rtc.log_and_state.rtc_log_type_schema);
frontend.worker.rtc.log_and_state.rtc_log = (function frontend$worker$rtc$log_and_state$rtc_log(type,m){
if(cljs.core.map_QMARK_(m)){
} else {
throw (new Error("Assert failed: (map? m)"));
}

if(cljs.core.truth_((frontend.worker.rtc.log_and_state.rtc_log_type_validator.cljs$core$IFn$_invoke$arity$1 ? frontend.worker.rtc.log_and_state.rtc_log_type_validator.cljs$core$IFn$_invoke$arity$1(type) : frontend.worker.rtc.log_and_state.rtc_log_type_validator.call(null,type)))){
} else {
throw (new Error("Assert failed: (rtc-log-type-validator type)"));
}

cljs.core.reset_BANG_(frontend.worker.rtc.log_and_state._STAR_rtc_log,cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(m,new cljs.core.Keyword(null,"type","type",1174270348),type,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"created-at","created-at",-89248644),(new Date())], 0)));

return null;
});
frontend.worker.rtc.log_and_state.graph_uuid__GT_t_schema = new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"map-of","map-of",1189682355),new cljs.core.Keyword(null,"uuid","uuid",-2145095719),new cljs.core.Keyword(null,"int","int",-1741416922)], null);
frontend.worker.rtc.log_and_state.graph_uuid__GT_t_validator = (function (){var validator = malli.core.validator.cljs$core$IFn$_invoke$arity$1(frontend.worker.rtc.log_and_state.graph_uuid__GT_t_schema);
return (function (v){
if(cljs.core.truth_((validator.cljs$core$IFn$_invoke$arity$1 ? validator.cljs$core$IFn$_invoke$arity$1(v) : validator.call(null,v)))){
return true;
} else {
lambdaisland.glogi.log.cljs$core$IFn$_invoke$arity$4("frontend.worker.rtc.log-and-state",new cljs.core.Keyword(null,"error","error",-978969032),cljs.core.identity(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"debug-graph-uuid->t-validator","debug-graph-uuid->t-validator",824218789),v,new cljs.core.Keyword(null,"line","line",212345235),54], null)),null);

return false;
}
});
})();
frontend.worker.rtc.log_and_state._STAR_graph_uuid__GT_local_t = cljs.core.atom.cljs$core$IFn$_invoke$arity$variadic(cljs.core.PersistentArrayMap.EMPTY,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"validator","validator",-1966190681),frontend.worker.rtc.log_and_state.graph_uuid__GT_t_validator], 0));
frontend.worker.rtc.log_and_state._STAR_graph_uuid__GT_remote_t = cljs.core.atom.cljs$core$IFn$_invoke$arity$variadic(cljs.core.PersistentArrayMap.EMPTY,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"validator","validator",-1966190681),frontend.worker.rtc.log_and_state.graph_uuid__GT_t_validator], 0));
frontend.worker.rtc.log_and_state.ensure_uuid = (function frontend$worker$rtc$log_and_state$ensure_uuid(v){
if(cljs.core.uuid_QMARK_(v)){
return v;
} else {
if(typeof v === 'string'){
return cljs.core.uuid(v);
} else {
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2("illegal value",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"data","data",-232669377),v], null));

}
}
});
frontend.worker.rtc.log_and_state.create_local_t_flow = (function frontend$worker$rtc$log_and_state$create_local_t_flow(graph_uuid){
return frontend.common.missionary.continue_flow.cljs$core$IFn$_invoke$arity$1(missionary.core.eduction.cljs$core$IFn$_invoke$arity$2(cljs.core.keep.cljs$core$IFn$_invoke$arity$1((function (m){
return cljs.core.get.cljs$core$IFn$_invoke$arity$2(m,frontend.worker.rtc.log_and_state.ensure_uuid(graph_uuid));
})),missionary.core.watch(frontend.worker.rtc.log_and_state._STAR_graph_uuid__GT_local_t)));
});
frontend.worker.rtc.log_and_state.create_remote_t_flow = (function frontend$worker$rtc$log_and_state$create_remote_t_flow(graph_uuid){
return frontend.common.missionary.continue_flow.cljs$core$IFn$_invoke$arity$1(missionary.core.eduction.cljs$core$IFn$_invoke$arity$2(cljs.core.keep.cljs$core$IFn$_invoke$arity$1((function (m){
return cljs.core.get.cljs$core$IFn$_invoke$arity$2(m,frontend.worker.rtc.log_and_state.ensure_uuid(graph_uuid));
})),missionary.core.watch(frontend.worker.rtc.log_and_state._STAR_graph_uuid__GT_remote_t)));
});
/**
 * ensure local-t <= remote-t
 */
frontend.worker.rtc.log_and_state.create_local_AMPERSAND_remote_t_flow = (function frontend$worker$rtc$log_and_state$create_local_AMPERSAND_remote_t_flow(graph_uuid){
if((!((graph_uuid == null)))){
} else {
throw (new Error("Assert failed: (some? graph-uuid)"));
}

return missionary.core.eduction.cljs$core$IFn$_invoke$arity$2(cljs.core.filter.cljs$core$IFn$_invoke$arity$1((function (p__101656){
var vec__101657 = p__101656;
var local_t = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__101657,(0),null);
var remote_t = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__101657,(1),null);
return (remote_t >= local_t);
})),missionary.core.latest.cljs$core$IFn$_invoke$arity$variadic(cljs.core.vector,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([frontend.worker.rtc.log_and_state.create_local_t_flow(graph_uuid),frontend.worker.rtc.log_and_state.create_remote_t_flow(graph_uuid)], 0)));
});
frontend.worker.rtc.log_and_state.update_local_t = (function frontend$worker$rtc$log_and_state$update_local_t(graph_uuid,local_t){
var graph_uuid__$1 = frontend.worker.rtc.log_and_state.ensure_uuid(graph_uuid);
var current_remote_t = cljs.core.get.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(frontend.worker.rtc.log_and_state._STAR_graph_uuid__GT_remote_t),graph_uuid__$1);
var current_local_t = cljs.core.get.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(frontend.worker.rtc.log_and_state._STAR_graph_uuid__GT_local_t),graph_uuid__$1);
if(cljs.core.truth_((function (){var and__5000__auto__ = current_remote_t;
if(cljs.core.truth_(and__5000__auto__)){
return current_local_t;
} else {
return and__5000__auto__;
}
})())){
if((((local_t >= current_local_t)) && ((local_t <= current_remote_t)))){
} else {
throw (new Error(["Assert failed: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"local-t","local-t",-2128577077),local_t,new cljs.core.Keyword(null,"current-local-t","current-local-t",-205247153),current_local_t,new cljs.core.Keyword(null,"current-remote-t","current-remote-t",-1703049321),current_remote_t], null)),"\n","(and (>= local-t current-local-t) (<= local-t current-remote-t))"].join('')));
}
} else {
}

return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(frontend.worker.rtc.log_and_state._STAR_graph_uuid__GT_local_t,cljs.core.assoc,graph_uuid__$1,local_t);
});
frontend.worker.rtc.log_and_state.update_remote_t = (function frontend$worker$rtc$log_and_state$update_remote_t(graph_uuid,remote_t){
var graph_uuid__$1 = frontend.worker.rtc.log_and_state.ensure_uuid(graph_uuid);
var current_remote_t = cljs.core.get.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(frontend.worker.rtc.log_and_state._STAR_graph_uuid__GT_remote_t),graph_uuid__$1);
var current_local_t = cljs.core.get.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(frontend.worker.rtc.log_and_state._STAR_graph_uuid__GT_local_t),graph_uuid__$1);
if(cljs.core.truth_((function (){var and__5000__auto__ = current_remote_t;
if(cljs.core.truth_(and__5000__auto__)){
return current_local_t;
} else {
return and__5000__auto__;
}
})())){
if((((remote_t >= current_remote_t)) && ((remote_t >= current_local_t)))){
} else {
throw (new Error(["Assert failed: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"remote-t","remote-t",-1375604239),remote_t,new cljs.core.Keyword(null,"current-local-t","current-local-t",-205247153),current_local_t,new cljs.core.Keyword(null,"current-remote-t","current-remote-t",-1703049321),current_remote_t], null)),"\n","(and (>= remote-t current-remote-t) (>= remote-t current-local-t))"].join('')));
}
} else {
}

return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(frontend.worker.rtc.log_and_state._STAR_graph_uuid__GT_remote_t,cljs.core.assoc,graph_uuid__$1,remote_t);
});
frontend.worker.rtc.log_and_state.subscribe_logs = (function frontend$worker$rtc$log_and_state$subscribe_logs(){
cljs.core.remove_watch(frontend.worker.rtc.log_and_state._STAR_rtc_log,new cljs.core.Keyword(null,"subscribe-logs","subscribe-logs",33342488));

return cljs.core.add_watch(frontend.worker.rtc.log_and_state._STAR_rtc_log,new cljs.core.Keyword(null,"subscribe-logs","subscribe-logs",33342488),(function (_,___$1,___$2,n){
if(cljs.core.truth_(n)){
return frontend.worker.shared_service.broadcast_to_clients_BANG_(new cljs.core.Keyword(null,"rtc-log","rtc-log",1926627661),n);
} else {
return null;
}
}));
});
frontend.worker.rtc.log_and_state.subscribe_logs();

//# sourceMappingURL=frontend.worker.rtc.log_and_state.js.map
