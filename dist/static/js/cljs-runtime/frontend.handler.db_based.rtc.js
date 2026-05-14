goog.provide('frontend.handler.db_based.rtc');
frontend.handler.db_based.rtc._LT_rtc_create_graph_BANG_ = (function frontend$handler$db_based$rtc$_LT_rtc_create_graph_BANG_(repo){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41621__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((new Promise(frontend.handler.user.task__ensure_id_AMPERSAND_access_token))),(function (___41611__auto__){
return promesa.protocols._promise((function (){var token = frontend.state.get_auth_id_token();
var repo_name = logseq.db.common.sqlite.sanitize_db_name(repo);
return frontend.state._LT_invoke_db_worker.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword("thread-api","rtc-async-upload-graph","thread-api/rtc-async-upload-graph",-100015545),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([repo,token,repo_name], 0));
})());
}));
}));
});
frontend.handler.db_based.rtc._LT_rtc_delete_graph_BANG_ = (function frontend$handler$db_based$rtc$_LT_rtc_delete_graph_BANG_(graph_uuid,schema_version){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41621__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((new Promise(frontend.handler.user.task__ensure_id_AMPERSAND_access_token))),(function (___41611__auto__){
return promesa.protocols._promise((function (){var token = frontend.state.get_auth_id_token();
return frontend.state._LT_invoke_db_worker.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword("thread-api","rtc-delete-graph","thread-api/rtc-delete-graph",-699151858),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([token,graph_uuid,schema_version], 0));
})());
}));
}));
});
frontend.handler.db_based.rtc._LT_rtc_download_graph_BANG_ = (function frontend$handler$db_based$rtc$_LT_rtc_download_graph_BANG_(graph_name,graph_uuid,graph_schema_version,timeout_ms){
if((!((graph_schema_version == null)))){
} else {
throw (new Error("Assert failed: (some? graph-schema-version)"));
}

frontend.state.set_state_BANG_(new cljs.core.Keyword("rtc","downloading-graph-uuid","rtc/downloading-graph-uuid",460109193),graph_uuid);

return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((new Promise(frontend.handler.user.task__ensure_id_AMPERSAND_access_token))),(function (_){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.state.get_auth_id_token()),(function (token){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.state._LT_invoke_db_worker.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword("thread-api","rtc-request-download-graph","thread-api/rtc-request-download-graph",1844528552),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([token,graph_uuid,graph_schema_version], 0))),(function (download_info_uuid){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.state._LT_invoke_db_worker.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword("thread-api","rtc-wait-download-graph-info-ready","thread-api/rtc-wait-download-graph-info-ready",1767428638),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([token,download_info_uuid,graph_uuid,graph_schema_version,timeout_ms], 0))),(function (p__109929){
var map__109930 = p__109929;
var map__109930__$1 = cljs.core.__destructure_map(map__109930);
var result = map__109930__$1;
var _download_info_uuid = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__109930__$1,new cljs.core.Keyword(null,"_download-info-uuid","_download-info-uuid",-493542016));
var download_info_s3_url = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__109930__$1,new cljs.core.Keyword(null,"download-info-s3-url","download-info-s3-url",937853327));
var _download_info_tx_instant = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__109930__$1,new cljs.core.Keyword(null,"_download-info-tx-instant","_download-info-tx-instant",-115220489));
var _download_info_t = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__109930__$1,new cljs.core.Keyword(null,"_download-info-t","_download-info-t",-1601616779));
var _download_info_created_at = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__109930__$1,new cljs.core.Keyword(null,"_download-info-created-at","_download-info-created-at",-306158633));
return promesa.protocols._promise(promesa.core.finally$.cljs$core$IFn$_invoke$arity$2(((cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(result,new cljs.core.Keyword(null,"timeout","timeout",-318625318)))?(function (){
if((!((download_info_s3_url == null)))){
} else {
throw (new Error(["Assert failed: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(result),"\n","(some? download-info-s3-url)"].join('')));
}

return frontend.state._LT_invoke_db_worker.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword("thread-api","rtc-download-graph-from-s3","thread-api/rtc-download-graph-from-s3",-50303377),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([graph_uuid,graph_name,download_info_s3_url], 0));
})()
:null),(function (){
return frontend.state.set_state_BANG_(new cljs.core.Keyword("rtc","downloading-graph-uuid","rtc/downloading-graph-uuid",460109193),null);
})));
}));
}));
}));
}));
}));
});
frontend.handler.db_based.rtc._LT_rtc_stop_BANG_ = (function frontend$handler$db_based$rtc$_LT_rtc_stop_BANG_(){
return frontend.state._LT_invoke_db_worker(new cljs.core.Keyword("thread-api","rtc-stop","thread-api/rtc-stop",-126094172));
});
frontend.handler.db_based.rtc._LT_rtc_branch_graph_BANG_ = (function frontend$handler$db_based$rtc$_LT_rtc_branch_graph_BANG_(repo){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((new Promise(frontend.handler.user.task__ensure_id_AMPERSAND_access_token))),(function (_){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.state.get_auth_id_token()),(function (token){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.state._LT_invoke_db_worker.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword("thread-api","rtc-async-branch-graph","thread-api/rtc-async-branch-graph",-476255141),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([repo,token], 0))),(function (start_ex){
return promesa.protocols._promise((function (){var temp__5804__auto__ = new cljs.core.Keyword(null,"ex-data","ex-data",-309040259).cljs$core$IFn$_invoke$arity$1(start_ex);
if(cljs.core.truth_(temp__5804__auto__)){
var ex_data_STAR_ = temp__5804__auto__;
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"ex-message","ex-message",1526142375).cljs$core$IFn$_invoke$arity$1(start_ex),ex_data_STAR_);
} else {
return null;
}
})());
}));
}));
}));
}));
});
frontend.handler.db_based.rtc.notification_download_higher_schema_graph_BANG_ = (function frontend$handler$db_based$rtc$notification_download_higher_schema_graph_BANG_(graph_name,graph_uuid,schema_version){
var graph_name_STAR_ = [cljs.core.str.cljs$core$IFn$_invoke$arity$1(graph_name),"-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(schema_version)].join('');
return frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$3(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),"There's a higher schema-version graph on the server.",(function (){var G__109961 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (e){
frontend.util.stop(e);

return frontend.handler.db_based.rtc._LT_rtc_download_graph_BANG_(graph_name_STAR_,graph_uuid,schema_version,(60000));
})], null);
var G__109962 = "Download";
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2(G__109961,G__109962) : logseq.shui.ui.button.call(null,G__109961,G__109962));
})()], null),new cljs.core.Keyword(null,"warning","warning",-1685650671),false);
});
frontend.handler.db_based.rtc.notification_upload_higher_schema_graph_BANG_ = (function frontend$handler$db_based$rtc$notification_upload_higher_schema_graph_BANG_(repo){
return frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$3(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),"The local graph has a higher schema version than the graph on the server.",(function (){var G__109963 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (e){
frontend.util.stop(e);

return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41621__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.db_based.rtc._LT_rtc_branch_graph_BANG_(repo)),(function (___41611__auto__){
return promesa.protocols._promise(frontend.handler.db_based.rtc_flows.trigger_rtc_start(repo));
}));
}));
})], null);
var G__109964 = "Upload to server";
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2(G__109963,G__109964) : logseq.shui.ui.button.call(null,G__109963,G__109964));
})()], null),new cljs.core.Keyword(null,"warning","warning",-1685650671),false);
});
frontend.handler.db_based.rtc._LT_rtc_start_BANG_ = (function frontend$handler$db_based$rtc$_LT_rtc_start_BANG_(var_args){
var args__5732__auto__ = [];
var len__5726__auto___110014 = arguments.length;
var i__5727__auto___110015 = (0);
while(true){
if((i__5727__auto___110015 < len__5726__auto___110014)){
args__5732__auto__.push((arguments[i__5727__auto___110015]));

var G__110016 = (i__5727__auto___110015 + (1));
i__5727__auto___110015 = G__110016;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return frontend.handler.db_based.rtc._LT_rtc_start_BANG_.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(frontend.handler.db_based.rtc._LT_rtc_start_BANG_.cljs$core$IFn$_invoke$arity$variadic = (function (repo,p__109974){
var map__109975 = p__109974;
var map__109975__$1 = cljs.core.__destructure_map(map__109975);
var stop_before_start_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__109975__$1,new cljs.core.Keyword(null,"stop-before-start?","stop-before-start?",1190543403),true);
var temp__5804__auto__ = logseq.db.get_graph_rtc_uuid((frontend.db.get_db.cljs$core$IFn$_invoke$arity$1 ? frontend.db.get_db.cljs$core$IFn$_invoke$arity$1(repo) : frontend.db.get_db.call(null,repo)));
if(cljs.core.truth_(temp__5804__auto__)){
var graph_uuid = temp__5804__auto__;
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41621__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((new Promise(frontend.handler.user.task__ensure_id_AMPERSAND_access_token))),(function (___41611__auto__){
return promesa.protocols._promise(promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.state._LT_invoke_db_worker.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword("thread-api","rtc-start","thread-api/rtc-start",-890838787),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([stop_before_start_QMARK_], 0))),(function (start_ex){
return promesa.protocols._mcat(promesa.protocols._promise(new cljs.core.Keyword(null,"ex-data","ex-data",-309040259).cljs$core$IFn$_invoke$arity$1(start_ex)),(function (ex_data_STAR_){
return promesa.protocols._mcat(promesa.protocols._promise((function (){var G__109977 = new cljs.core.Keyword(null,"type","type",1174270348).cljs$core$IFn$_invoke$arity$1(ex_data_STAR_);
var G__109977__$1 = (((G__109977 instanceof cljs.core.Keyword))?G__109977.fqn:null);
switch (G__109977__$1) {
case "rtc.exception/not-rtc-graph":
case "rtc.exception/not-found-db-conn":
return frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"ex-message","ex-message",1526142375).cljs$core$IFn$_invoke$arity$1(start_ex),new cljs.core.Keyword(null,"error","error",-978969032));

break;
case "rtc.exception/major-schema-version-mismatched":
var G__109979 = new cljs.core.Keyword(null,"sub-type","sub-type",-997954412).cljs$core$IFn$_invoke$arity$1(ex_data_STAR_);
var G__109979__$1 = (((G__109979 instanceof cljs.core.Keyword))?G__109979.fqn:null);
switch (G__109979__$1) {
case "download":
return frontend.handler.db_based.rtc.notification_download_higher_schema_graph_BANG_(repo,graph_uuid,new cljs.core.Keyword(null,"remote","remote",-1593576576).cljs$core$IFn$_invoke$arity$1(ex_data_STAR_));

break;
case "create-branch":
return frontend.handler.db_based.rtc.notification_upload_higher_schema_graph_BANG_(repo);

break;
default:
lambdaisland.glogi.log.cljs$core$IFn$_invoke$arity$4("frontend.handler.db-based.rtc",new cljs.core.Keyword(null,"info","info",-317069002),cljs.core.identity(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"start-ex","start-ex",1481932358),start_ex,new cljs.core.Keyword(null,"line","line",212345235),113], null)),null);

return frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.Keyword(null,"ex-message","ex-message",1526142375).cljs$core$IFn$_invoke$arity$1(start_ex)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),(function (){var sb__5647__auto__ = (new goog.string.StringBuffer());
var _STAR_print_newline_STAR__orig_val__109981_110019 = cljs.core._STAR_print_newline_STAR_;
var _STAR_print_fn_STAR__orig_val__109982_110020 = cljs.core._STAR_print_fn_STAR_;
var _STAR_print_newline_STAR__temp_val__109983_110021 = true;
var _STAR_print_fn_STAR__temp_val__109984_110022 = (function (x__5648__auto__){
return sb__5647__auto__.append(x__5648__auto__);
});
(cljs.core._STAR_print_newline_STAR_ = _STAR_print_newline_STAR__temp_val__109983_110021);

(cljs.core._STAR_print_fn_STAR_ = _STAR_print_fn_STAR__temp_val__109984_110022);

try{cljs.pprint.pprint.cljs$core$IFn$_invoke$arity$1(cljs.core.select_keys(ex_data_STAR_,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"app","app",-560961707),new cljs.core.Keyword(null,"local","local",-1497766724),new cljs.core.Keyword(null,"remote","remote",-1593576576)], null)));
}finally {(cljs.core._STAR_print_fn_STAR_ = _STAR_print_fn_STAR__orig_val__109982_110020);

(cljs.core._STAR_print_newline_STAR_ = _STAR_print_newline_STAR__orig_val__109981_110019);
}
return cljs.core.str.cljs$core$IFn$_invoke$arity$1(sb__5647__auto__);
})()], null)], null),new cljs.core.Keyword(null,"error","error",-978969032));

}

break;
case "rtc.exception/lock-failed":
return setTimeout((function (){
return frontend.handler.db_based.rtc._LT_rtc_start_BANG_(repo);
}),(1000));

break;
default:
return null;

}
})()),(function (_){
return promesa.protocols._promise(null);
}));
}));
}));
})));
}));
}));
} else {
return null;
}
}));

(frontend.handler.db_based.rtc._LT_rtc_start_BANG_.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(frontend.handler.db_based.rtc._LT_rtc_start_BANG_.cljs$lang$applyTo = (function (seq109968){
var G__109969 = cljs.core.first(seq109968);
var seq109968__$1 = cljs.core.next(seq109968);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__109969,seq109968__$1);
}));

frontend.handler.db_based.rtc._LT_get_remote_graphs = (function frontend$handler$db_based$rtc$_LT_get_remote_graphs(){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((new Promise(frontend.handler.user.task__ensure_id_AMPERSAND_access_token))),(function (_){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.state.get_auth_id_token()),(function (token){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.state._LT_invoke_db_worker.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword("thread-api","rtc-get-graphs","thread-api/rtc-get-graphs",-1020791869),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([token], 0))),(function (graphs){
return promesa.protocols._mcat(promesa.protocols._promise(cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (graph){
return cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([(function (){var url = [frontend.config.db_version_prefix,cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"graph-name","graph-name",416773857).cljs$core$IFn$_invoke$arity$1(graph))].join('');
return new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"url","url",276297046),url,new cljs.core.Keyword(null,"GraphName","GraphName",-960661337),new cljs.core.Keyword(null,"graph-name","graph-name",416773857).cljs$core$IFn$_invoke$arity$1(graph),new cljs.core.Keyword(null,"GraphSchemaVersion","GraphSchemaVersion",1094848752),new cljs.core.Keyword(null,"graph-schema-version","graph-schema-version",-650273540).cljs$core$IFn$_invoke$arity$1(graph),new cljs.core.Keyword(null,"GraphUUID","GraphUUID",-237263531),new cljs.core.Keyword(null,"graph-uuid","graph-uuid",1180757522).cljs$core$IFn$_invoke$arity$1(graph),new cljs.core.Keyword(null,"rtc-graph?","rtc-graph?",-203036448),true], null);
})(),cljs.core.dissoc.cljs$core$IFn$_invoke$arity$variadic(graph,new cljs.core.Keyword(null,"graph-uuid","graph-uuid",1180757522),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"graph-name","graph-name",416773857)], 0))], 0));
}),cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (graph){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"graph-status","graph-status",-2094719057).cljs$core$IFn$_invoke$arity$1(graph),"deleting");
}),graphs))),(function (result){
return promesa.protocols._promise(frontend.state.set_state_BANG_(new cljs.core.Keyword("rtc","graphs","rtc/graphs",-1584628267),result));
}));
}));
}));
}));
}));
});
frontend.handler.db_based.rtc._LT_rtc_get_users_info = (function frontend$handler$db_based$rtc$_LT_rtc_get_users_info(){
var temp__5804__auto__ = logseq.db.get_graph_rtc_uuid((frontend.db.get_db.cljs$core$IFn$_invoke$arity$0 ? frontend.db.get_db.cljs$core$IFn$_invoke$arity$0() : frontend.db.get_db.call(null)));
if(cljs.core.truth_(temp__5804__auto__)){
var graph_uuid = temp__5804__auto__;
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.state.get_auth_id_token()),(function (token){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.state.get_current_repo()),(function (repo){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.state._LT_invoke_db_worker.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword("thread-api","rtc-get-users-info","thread-api/rtc-get-users-info",1968240513),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([token,graph_uuid], 0))),(function (result){
return promesa.protocols._promise(frontend.state.set_state_BANG_(new cljs.core.Keyword("rtc","users-info","rtc/users-info",8288930),cljs.core.PersistentArrayMap.createAsIfByAssoc([repo,result])));
}));
}));
}));
}));
} else {
return null;
}
});
frontend.handler.db_based.rtc._LT_rtc_invite_email = (function frontend$handler$db_based$rtc$_LT_rtc_invite_email(graph_uuid,email){
var token = frontend.state.get_auth_id_token();
return promesa.core.catch$.cljs$core$IFn$_invoke$arity$2(promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41621__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.state._LT_invoke_db_worker.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword("thread-api","rtc-grant-graph-access","thread-api/rtc-grant-graph-access",1735035900),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([token,cljs.core.str.cljs$core$IFn$_invoke$arity$1(graph_uuid),cljs.core.PersistentVector.EMPTY,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [email], null)], 0))),(function (___41611__auto__){
return promesa.protocols._promise(frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$2("Invitation sent!",new cljs.core.Keyword(null,"success","success",1890645906)));
}));
})),(function (e){
frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$2("Something wrong, please try again.",new cljs.core.Keyword(null,"error","error",-978969032));

return console.error(e);
}));
});

//# sourceMappingURL=frontend.handler.db_based.rtc.js.map
