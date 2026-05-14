goog.provide('frontend.handler.repo');
frontend.handler.repo.remove_repo_BANG_ = (function frontend$handler$repo$remove_repo_BANG_(var_args){
var args__5732__auto__ = [];
var len__5726__auto___105448 = arguments.length;
var i__5727__auto___105449 = (0);
while(true){
if((i__5727__auto___105449 < len__5726__auto___105448)){
args__5732__auto__.push((arguments[i__5727__auto___105449]));

var G__105450 = (i__5727__auto___105449 + (1));
i__5727__auto___105449 = G__105450;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return frontend.handler.repo.remove_repo_BANG_.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(frontend.handler.repo.remove_repo_BANG_.cljs$core$IFn$_invoke$arity$variadic = (function (p__105246,p__105247){
var map__105248 = p__105246;
var map__105248__$1 = cljs.core.__destructure_map(map__105248);
var repo = map__105248__$1;
var url = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__105248__$1,new cljs.core.Keyword(null,"url","url",276297046));
var map__105249 = p__105247;
var map__105249__$1 = cljs.core.__destructure_map(map__105249);
var switch_graph_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__105249__$1,new cljs.core.Keyword(null,"switch-graph?","switch-graph?",1080858350),true);
var current_repo = frontend.state.get_current_repo();
var db_based_QMARK_ = frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(url);
if(((frontend.config.local_file_based_graph_QMARK_(url)) || (db_based_QMARK_))){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41621__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.idb.clear_local_db_BANG_(url)),(function (___41611__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((frontend.db.remove_conn_BANG_.cljs$core$IFn$_invoke$arity$1 ? frontend.db.remove_conn_BANG_.cljs$core$IFn$_invoke$arity$1(url) : frontend.db.remove_conn_BANG_.call(null,url))),(function (___41611__auto____$1){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.db.persist.delete_graph_BANG_(url)),(function (___41611__auto____$2){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.search.remove_db_BANG_(url)),(function (___41611__auto____$3){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.state.delete_repo_BANG_(repo)),(function (___41611__auto____$4){
return promesa.protocols._promise((cljs.core.truth_(switch_graph_QMARK_)?((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(current_repo,url))?(function (){
frontend.state.set_current_repo_BANG_(null);

var temp__5804__auto__ = new cljs.core.Keyword(null,"url","url",276297046).cljs$core$IFn$_invoke$arity$1(cljs.core.first(frontend.state.get_repos()));
if(cljs.core.truth_(temp__5804__auto__)){
var graph = temp__5804__auto__;
frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$2(["Removed graph ",cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([frontend.util.text.get_graph_name_from_path(url)], 0)),". Redirecting to graph ",cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([frontend.util.text.get_graph_name_from_path(graph)], 0))].join(''),new cljs.core.Keyword(null,"success","success",1890645906));

return frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("graph","switch","graph/switch",178853840),graph,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"persist?","persist?",-1772568760),false], null)], null));
} else {
return null;
}
})()
:frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$2(["Removed graph ",cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([frontend.util.text.get_graph_name_from_path(url)], 0))].join(''),new cljs.core.Keyword(null,"success","success",1890645906))):null));
}));
}));
}));
}));
}));
}));
} else {
return null;
}
}));

(frontend.handler.repo.remove_repo_BANG_.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(frontend.handler.repo.remove_repo_BANG_.cljs$lang$applyTo = (function (seq105244){
var G__105245 = cljs.core.first(seq105244);
var seq105244__$1 = cljs.core.next(seq105244);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__105245,seq105244__$1);
}));

frontend.handler.repo.start_repo_db_if_not_exists_BANG_ = (function frontend$handler$repo$start_repo_db_if_not_exists_BANG_(var_args){
var args__5732__auto__ = [];
var len__5726__auto___105454 = arguments.length;
var i__5727__auto___105455 = (0);
while(true){
if((i__5727__auto___105455 < len__5726__auto___105454)){
args__5732__auto__.push((arguments[i__5727__auto___105455]));

var G__105456 = (i__5727__auto___105455 + (1));
i__5727__auto___105455 = G__105456;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return frontend.handler.repo.start_repo_db_if_not_exists_BANG_.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(frontend.handler.repo.start_repo_db_if_not_exists_BANG_.cljs$core$IFn$_invoke$arity$variadic = (function (repo,p__105266){
var map__105267 = p__105266;
var map__105267__$1 = cljs.core.__destructure_map(map__105267);
var opts = map__105267__$1;
frontend.state.set_current_repo_BANG_(repo);

return frontend.db.start_db_conn_BANG_.cljs$core$IFn$_invoke$arity$2(repo,cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(opts,new cljs.core.Keyword(null,"db-graph?","db-graph?",-533494876),frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(repo),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"listen-handler","listen-handler",-1690024921),(function (conn){
return frontend.undo_redo.listen_db_changes_BANG_(repo,conn);
})], 0)));
}));

(frontend.handler.repo.start_repo_db_if_not_exists_BANG_.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(frontend.handler.repo.start_repo_db_if_not_exists_BANG_.cljs$lang$applyTo = (function (seq105264){
var G__105265 = cljs.core.first(seq105264);
var seq105264__$1 = cljs.core.next(seq105264);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__105265,seq105264__$1);
}));

/**
 * Restore the db of a graph from the persisted data, and setup. Create a new
 *   conn, or replace the conn in state with a new one.
 */
frontend.handler.repo.restore_and_setup_repo_BANG_ = (function frontend$handler$repo$restore_and_setup_repo_BANG_(var_args){
var args__5732__auto__ = [];
var len__5726__auto___105457 = arguments.length;
var i__5727__auto___105458 = (0);
while(true){
if((i__5727__auto___105458 < len__5726__auto___105457)){
args__5732__auto__.push((arguments[i__5727__auto___105458]));

var G__105459 = (i__5727__auto___105458 + (1));
i__5727__auto___105458 = G__105459;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return frontend.handler.repo.restore_and_setup_repo_BANG_.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(frontend.handler.repo.restore_and_setup_repo_BANG_.cljs$core$IFn$_invoke$arity$variadic = (function (repo,p__105270){
var map__105271 = p__105270;
var map__105271__$1 = cljs.core.__destructure_map(map__105271);
var opts = map__105271__$1;
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41621__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.state.set_db_restoring_BANG_(true)),(function (___41611__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.db.restore.restore_graph_BANG_.cljs$core$IFn$_invoke$arity$variadic(repo,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([opts], 0))),(function (___41611__auto____$1){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.repo_config.restore_repo_config_BANG_.cljs$core$IFn$_invoke$arity$1(repo)),(function (___41611__auto____$2){
return promesa.protocols._mcat(promesa.protocols._promise((cljs.core.truth_(frontend.config.global_config_enabled_QMARK_())?frontend.handler.global_config.restore_global_config_BANG_():null)),(function (___41611__auto____$3){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.ui.add_style_if_exists_BANG_()),(function (___41611__auto____$4){
return promesa.protocols._promise(((frontend.config.publishing_QMARK_)?null:frontend.state.set_db_restoring_BANG_(false)));
}));
}));
}));
}));
}));
}));
}));

(frontend.handler.repo.restore_and_setup_repo_BANG_.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(frontend.handler.repo.restore_and_setup_repo_BANG_.cljs$lang$applyTo = (function (seq105268){
var G__105269 = cljs.core.first(seq105268);
var seq105268__$1 = cljs.core.next(seq105268);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__105269,seq105268__$1);
}));

frontend.handler.repo.rebuild_index_BANG_ = (function frontend$handler$repo$rebuild_index_BANG_(url){
if(frontend.state.unlinked_dir_QMARK_(frontend.config.get_repo_dir(url))){
return null;
} else {
if(cljs.core.truth_(url)){
frontend.search.reset_indice_BANG_(url);

(frontend.db.remove_conn_BANG_.cljs$core$IFn$_invoke$arity$1 ? frontend.db.remove_conn_BANG_.cljs$core$IFn$_invoke$arity$1(url) : frontend.db.remove_conn_BANG_.call(null,url));

frontend.db.react.clear_query_state_BANG_();

return promesa.core.catch$.cljs$core$IFn$_invoke$arity$2(promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41621__auto__){
return promesa.protocols._promise(frontend.db.persist.delete_graph_BANG_(url));
})),(function (error){
return cljs.core.prn.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["Delete repo failed, error: ",error], 0));
}));
} else {
return null;
}
}
});
frontend.handler.repo.re_index_BANG_ = (function frontend$handler$repo$re_index_BANG_(nfs_rebuild_index_BANG_,ok_handler){
var temp__5804__auto__ = frontend.state.get_current_repo();
if(cljs.core.truth_(temp__5804__auto__)){
var repo = temp__5804__auto__;
frontend.state.reset_parsing_state_BANG_();

var dir = frontend.config.get_repo_dir(repo);
if(frontend.state.unlinked_dir_QMARK_(dir)){
return null;
} else {
frontend.handler.route.redirect_to_home_BANG_.cljs$core$IFn$_invoke$arity$0();

var local_QMARK_ = frontend.config.local_file_based_graph_QMARK_(repo);
if(local_QMARK_){
(nfs_rebuild_index_BANG_.cljs$core$IFn$_invoke$arity$2 ? nfs_rebuild_index_BANG_.cljs$core$IFn$_invoke$arity$2(repo,ok_handler) : nfs_rebuild_index_BANG_.call(null,repo,ok_handler));
} else {
frontend.handler.repo.rebuild_index_BANG_(repo);
}

return setTimeout(frontend.handler.route.redirect_to_home_BANG_.cljs$core$IFn$_invoke$arity$0(),(500));
}
} else {
return null;
}
});
frontend.handler.repo.get_repos = (function frontend$handler$repo$get_repos(){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.db.persist.get_all_graphs()),(function (nfs_dbs){
return promesa.protocols._mcat(promesa.protocols._promise(cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (db){
var graph_name = new cljs.core.Keyword(null,"name","name",1843675177).cljs$core$IFn$_invoke$arity$1(db);
return new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"url","url",276297046),graph_name,new cljs.core.Keyword(null,"metadata","metadata",1799301597),new cljs.core.Keyword(null,"metadata","metadata",1799301597).cljs$core$IFn$_invoke$arity$1(db),new cljs.core.Keyword(null,"root","root",-448657453),frontend.config.get_local_dir(graph_name),new cljs.core.Keyword(null,"nfs?","nfs?",-544337673),true], null);
}),nfs_dbs)),(function (nfs_dbs__$1){
return promesa.protocols._mcat(promesa.protocols._promise((function (){var and__5000__auto__ = cljs.core.seq(nfs_dbs__$1);
if(and__5000__auto__){
if(cljs.core.truth_(frontend.util.electron_QMARK_())){
return electron.ipc.ipc.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"inflateGraphsInfo","inflateGraphsInfo",429320753),nfs_dbs__$1], 0));
} else {
if(cljs.core.truth_(frontend.mobile.util.native_platform_QMARK_())){
return frontend.util.fs.inflate_graphs_info(nfs_dbs__$1);
} else {
return nfs_dbs__$1;

}
}
} else {
return and__5000__auto__;
}
})()),(function (nfs_dbs__$2){
return promesa.protocols._promise(cljs.core.seq(cljs_bean.core.__GT_clj(nfs_dbs__$2)));
}));
}));
}));
}));
});
frontend.handler.repo.combine_local__AMPERSAND__remote_graphs = (function frontend$handler$repo$combine_local__AMPERSAND__remote_graphs(local_repos,remote_repos){
var temp__5804__auto__ = cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$2(cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p__105299){
var map__105301 = p__105299;
var map__105301__$1 = cljs.core.__destructure_map(map__105301);
var repo = map__105301__$1;
var sync_meta = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__105301__$1,new cljs.core.Keyword(null,"sync-meta","sync-meta",-164400022));
var metadata = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__105301__$1,new cljs.core.Keyword(null,"metadata","metadata",1799301597));
var graph_id = (function (){var G__105304 = (function (){var or__5002__auto__ = new cljs.core.Keyword("kv","value","kv/value",305981670).cljs$core$IFn$_invoke$arity$1(metadata);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.second(sync_meta);
}
})();
if((G__105304 == null)){
return null;
} else {
return cljs.core.str.cljs$core$IFn$_invoke$arity$1(G__105304);
}
})();
if(cljs.core.truth_(graph_id)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(repo,new cljs.core.Keyword(null,"GraphUUID","GraphUUID",-237263531),graph_id);
} else {
return repo;
}
}),local_repos),(function (){var G__105316 = remote_repos;
if((G__105316 == null)){
return null;
} else {
return cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__105285_SHARP_){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(p1__105285_SHARP_,new cljs.core.Keyword(null,"remote?","remote?",-517415110),true);
}),G__105316);
}
})()));
if(temp__5804__auto__){
var repos_SINGLEQUOTE_ = temp__5804__auto__;
var repos_SINGLEQUOTE___$1 = cljs.core.group_by(new cljs.core.Keyword(null,"GraphUUID","GraphUUID",-237263531),repos_SINGLEQUOTE_);
var repos_SINGLEQUOTE__SINGLEQUOTE_ = cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (p__105325){
var vec__105328 = p__105325;
var k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__105328,(0),null);
var vs = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__105328,(1),null);
if((!((k == null)))){
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.first(vs),cljs.core.second(vs)], 0))], null);
} else {
return vs;
}
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([repos_SINGLEQUOTE___$1], 0));
return cljs.core.sort_by.cljs$core$IFn$_invoke$arity$2((function (repo){
var graph_name = (function (){var or__5002__auto__ = new cljs.core.Keyword(null,"GraphName","GraphName",-960661337).cljs$core$IFn$_invoke$arity$1(repo);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.last(clojure.string.split.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"root","root",-448657453).cljs$core$IFn$_invoke$arity$1(repo),/\//));
}
})();
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"remote?","remote?",-517415110).cljs$core$IFn$_invoke$arity$1(repo),clojure.string.lower_case(graph_name)], null);
}),repos_SINGLEQUOTE__SINGLEQUOTE_);
} else {
return null;
}
});
frontend.handler.repo.get_detail_graph_info = (function frontend$handler$repo$get_detail_graph_info(url){
var temp__5804__auto__ = cljs.core.seq((function (){var and__5000__auto__ = url;
if(cljs.core.truth_(and__5000__auto__)){
return frontend.handler.repo.combine_local__AMPERSAND__remote_graphs(frontend.state.get_repos(),frontend.state.get_remote_file_graphs());
} else {
return and__5000__auto__;
}
})());
if(temp__5804__auto__){
var graphs = temp__5804__auto__;
return cljs.core.first(cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (p1__105349_SHARP_){
var temp__5804__auto____$1 = new cljs.core.Keyword(null,"url","url",276297046).cljs$core$IFn$_invoke$arity$1(p1__105349_SHARP_);
if(cljs.core.truth_(temp__5804__auto____$1)){
var url_SINGLEQUOTE_ = temp__5804__auto____$1;
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(url,url_SINGLEQUOTE_);
} else {
return null;
}
}),graphs));
} else {
return null;
}
});
frontend.handler.repo.refresh_repos_BANG_ = (function frontend$handler$repo$refresh_repos_BANG_(){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.repo.get_repos()),(function (repos){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.repo.combine_local__AMPERSAND__remote_graphs(repos,cljs.core.concat.cljs$core$IFn$_invoke$arity$2(frontend.state.get_rtc_graphs(),frontend.state.get_remote_file_graphs()))),(function (repos_SINGLEQUOTE_){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.state.set_repos_BANG_(repos_SINGLEQUOTE_)),(function (___41611__auto__){
return promesa.protocols._promise(repos_SINGLEQUOTE_);
}));
}));
}));
}));
});
frontend.handler.repo.graph_ready_BANG_ = (function frontend$handler$repo$graph_ready_BANG_(graph){
if(cljs.core.truth_(frontend.util.electron_QMARK_())){
return electron.ipc.ipc.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["graphReady",graph], 0));
} else {
return null;
}
});
/**
 * Checks to see if given db graph name already exists
 */
frontend.handler.repo.graph_already_exists_QMARK_ = (function frontend$handler$repo$graph_already_exists_QMARK_(graph_name){
var full_graph_name = clojure.string.lower_case([frontend.config.db_version_prefix,cljs.core.str.cljs$core$IFn$_invoke$arity$1(graph_name)].join(''));
return cljs.core.some((function (p1__105366_SHARP_){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2((function (){var G__105367 = new cljs.core.Keyword(null,"url","url",276297046).cljs$core$IFn$_invoke$arity$1(p1__105366_SHARP_);
if((G__105367 == null)){
return null;
} else {
return clojure.string.lower_case(G__105367);
}
})(),full_graph_name);
}),frontend.state.get_repos());
});
frontend.handler.repo.create_db = (function frontend$handler$repo$create_db(full_graph_name,p__105373){
var map__105374 = p__105373;
var map__105374__$1 = cljs.core.__destructure_map(map__105374);
var file_graph_import_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__105374__$1,new cljs.core.Keyword(null,"file-graph-import?","file-graph-import?",-2126895083));
return promesa.core.catch$.cljs$core$IFn$_invoke$arity$2(promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(logseq.common.config.create_config_for_db_graph(frontend.config.config_default_content)),(function (config){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.persist_db._LT_new(full_graph_name,(function (){var G__105384 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"config","config",994861415),config,new cljs.core.Keyword(null,"graph-git-sha","graph-git-sha",-266655130),frontend.config.revision], null);
if(cljs.core.truth_(file_graph_import_QMARK_)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__105384,new cljs.core.Keyword(null,"import-type","import-type",-499283032),new cljs.core.Keyword(null,"file-graph","file-graph",-246966187));
} else {
return G__105384;
}
})())),(function (_){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.repo.start_repo_db_if_not_exists_BANG_(full_graph_name)),(function (___$1){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.state.add_repo_BANG_(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"url","url",276297046),full_graph_name,new cljs.core.Keyword(null,"root","root",-448657453),frontend.config.get_local_dir(full_graph_name)], null))),(function (___$2){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.repo.restore_and_setup_repo_BANG_(full_graph_name)),(function (___$3){
return promesa.protocols._mcat(promesa.protocols._promise((cljs.core.truth_(file_graph_import_QMARK_)?null:frontend.handler.route.redirect_to_home_BANG_.cljs$core$IFn$_invoke$arity$0())),(function (___$4){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.repo_config.set_repo_config_state_BANG_(full_graph_name,frontend.config.config_default_content)),(function (___$5){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("init","commands","init/commands",315507426)], null))),(function (___$6){
return promesa.protocols._mcat(promesa.protocols._promise((cljs.core.truth_(file_graph_import_QMARK_)?null:frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("page","create","page/create",-1304816391),frontend.date.today(),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"redirect?","redirect?",-1229259098),false], null)], null)))),(function (___$7){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("shortcut","refresh","shortcut/refresh",-1755508577)], null))),(function (___41611__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.route.redirect_to_home_BANG_.cljs$core$IFn$_invoke$arity$0()),(function (___41611__auto____$1){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.ui.re_render_root_BANG_.cljs$core$IFn$_invoke$arity$0()),(function (___41611__auto____$2){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.graph.settle_metadata_to_local_BANG_(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"created-at","created-at",-89248644),Date.now()], null))),(function (___41611__auto____$3){
return promesa.protocols._mcat(promesa.protocols._promise(cljs.core.prn.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["New db created: ",full_graph_name], 0))),(function (___41611__auto____$4){
return promesa.protocols._promise(full_graph_name);
}));
}));
}));
}));
}));
}));
}));
}));
}));
}));
}));
}));
}));
}));
})),(function (error){
frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$2("Create graph failed.",new cljs.core.Keyword(null,"error","error",-978969032));

return console.error(error);
}));
});
/**
 * Handler for creating a new database graph
 */
frontend.handler.repo.new_db_BANG_ = (function frontend$handler$repo$new_db_BANG_(var_args){
var G__105414 = arguments.length;
switch (G__105414) {
case 1:
return frontend.handler.repo.new_db_BANG_.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return frontend.handler.repo.new_db_BANG_.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.handler.repo.new_db_BANG_.cljs$core$IFn$_invoke$arity$1 = (function (graph){
return frontend.handler.repo.new_db_BANG_.cljs$core$IFn$_invoke$arity$2(graph,cljs.core.PersistentArrayMap.EMPTY);
}));

(frontend.handler.repo.new_db_BANG_.cljs$core$IFn$_invoke$arity$2 = (function (graph,opts){
var full_graph_name = [frontend.config.db_version_prefix,cljs.core.str.cljs$core$IFn$_invoke$arity$1(graph)].join('');
if(cljs.core.truth_(frontend.handler.repo.graph_already_exists_QMARK_(graph))){
return frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("notification","show","notification/show",1864741804),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"content","content",15833224),["The graph '",cljs.core.str.cljs$core$IFn$_invoke$arity$1(graph),"' already exists. Please try again with another name."].join(''),new cljs.core.Keyword(null,"status","status",-1997798413),new cljs.core.Keyword(null,"error","error",-978969032)], null)], null));
} else {
return frontend.handler.repo.create_db(full_graph_name,opts);
}
}));

(frontend.handler.repo.new_db_BANG_.cljs$lang$maxFixedArity = 2);

frontend.handler.repo.fix_broken_graph_BANG_ = (function frontend$handler$repo$fix_broken_graph_BANG_(graph){
return frontend.state._LT_invoke_db_worker.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword("thread-api","fix-broken-graph","thread-api/fix-broken-graph",-993702673),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([graph], 0));
});
frontend.handler.repo.gc_graph_BANG_ = (function frontend$handler$repo$gc_graph_BANG_(graph){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41621__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.state._LT_invoke_db_worker.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword("thread-api","gc-graph","thread-api/gc-graph",1137283006),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([graph], 0))),(function (___41611__auto__){
return promesa.protocols._promise(frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("notification","show","notification/show",1864741804),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"content","content",15833224),"Graph gc successfully!",new cljs.core.Keyword(null,"status","status",-1997798413),new cljs.core.Keyword(null,"success","success",1890645906)], null)], null)));
}));
}));
});

//# sourceMappingURL=frontend.handler.repo.js.map
