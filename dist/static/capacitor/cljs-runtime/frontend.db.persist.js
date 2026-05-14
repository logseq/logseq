goog.provide('frontend.db.persist');
frontend.db.persist.get_all_graphs = (function frontend$db$persist$get_all_graphs(){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.idb.get_nfs_dbs()),(function (idb_repos){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.persist_db._LT_list_db()),(function (repos){
return promesa.protocols._mcat(promesa.protocols._promise(cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p__65505){
var map__65506 = p__65505;
var map__65506__$1 = cljs.core.__destructure_map(map__65506);
var repo = map__65506__$1;
var name = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__65506__$1,new cljs.core.Keyword(null,"name","name",1843675177));
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(repo,new cljs.core.Keyword(null,"name","name",1843675177),((frontend.config.local_file_based_graph_QMARK_(name))?name:[frontend.config.db_version_prefix,cljs.core.str.cljs$core$IFn$_invoke$arity$1(name)].join('')));
}),repos)),(function (repos_SINGLEQUOTE_){
return promesa.protocols._mcat(promesa.protocols._promise((cljs.core.truth_(frontend.util.electron_QMARK_())?electron.ipc.ipc.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["getGraphs"], 0)):null)),(function (electron_disk_graphs){
return promesa.protocols._promise(cljs.core.distinct.cljs$core$IFn$_invoke$arity$1(cljs.core.concat.cljs$core$IFn$_invoke$arity$2(repos_SINGLEQUOTE_,cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (repo_name){
return new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"name","name",1843675177),repo_name], null);
}),cljs.core.concat.cljs$core$IFn$_invoke$arity$2(idb_repos,(function (){var G__65507 = electron_disk_graphs;
if((G__65507 == null)){
return null;
} else {
return cljs_bean.core.__GT_clj(G__65507);
}
})())))));
}));
}));
}));
}));
}));
});
frontend.db.persist.delete_graph_BANG_ = (function frontend$db$persist$delete_graph_BANG_(graph){
var key = (frontend.db.conn.get_repo_path.cljs$core$IFn$_invoke$arity$1 ? frontend.db.conn.get_repo_path.cljs$core$IFn$_invoke$arity$1(graph) : frontend.db.conn.get_repo_path.call(null,graph));
var db_based_QMARK_ = frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(graph);
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.persist_db._LT_unsafe_delete(graph)),(function (_){
return promesa.protocols._promise((cljs.core.truth_(frontend.util.electron_QMARK_())?electron.ipc.ipc.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["deleteGraph",graph,key,db_based_QMARK_], 0)):frontend.idb.remove_item_BANG_(key)));
}));
}));
});

//# sourceMappingURL=frontend.db.persist.js.map
