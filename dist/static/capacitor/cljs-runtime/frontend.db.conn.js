goog.provide('frontend.db.conn');
if((typeof frontend !== 'undefined') && (typeof frontend.db !== 'undefined') && (typeof frontend.db.conn !== 'undefined') && (typeof frontend.db.conn.conns !== 'undefined')){
} else {
frontend.db.conn.conns = frontend.db.conn_state.conns;
}
frontend.db.conn.get_repo_path = frontend.db.conn_state.get_repo_path;
frontend.db.conn.get_db = (function frontend$db$conn$get_db(var_args){
var G__60218 = arguments.length;
switch (G__60218) {
case 0:
return frontend.db.conn.get_db.cljs$core$IFn$_invoke$arity$0();

break;
case 1:
return frontend.db.conn.get_db.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return frontend.db.conn.get_db.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.db.conn.get_db.cljs$core$IFn$_invoke$arity$0 = (function (){
return frontend.db.conn.get_db.cljs$core$IFn$_invoke$arity$2(frontend.state.get_current_repo(),true);
}));

(frontend.db.conn.get_db.cljs$core$IFn$_invoke$arity$1 = (function (repo_or_deref_QMARK_){
if(cljs.core.boolean_QMARK_(repo_or_deref_QMARK_)){
return frontend.db.conn.get_db.cljs$core$IFn$_invoke$arity$2(frontend.state.get_current_repo(),repo_or_deref_QMARK_);
} else {
return frontend.db.conn.get_db.cljs$core$IFn$_invoke$arity$2(repo_or_deref_QMARK_,true);
}
}));

(frontend.db.conn.get_db.cljs$core$IFn$_invoke$arity$2 = (function (repo,deref_QMARK_){
var temp__5804__auto__ = (function (){var or__5002__auto__ = repo;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return frontend.state.get_current_repo();
}
})();
if(cljs.core.truth_(temp__5804__auto__)){
var repo__$1 = temp__5804__auto__;
var temp__5804__auto____$1 = frontend.db.conn_state.get_conn(repo__$1);
if(cljs.core.truth_(temp__5804__auto____$1)){
var conn = temp__5804__auto____$1;
if(cljs.core.truth_(deref_QMARK_)){
return cljs.core.deref(conn);
} else {
return conn;
}
} else {
return null;
}
} else {
return null;
}
}));

(frontend.db.conn.get_db.cljs$lang$maxFixedArity = 2);

frontend.db.conn.get_repo_name = (function frontend$db$conn$get_repo_name(repo_url){
if(cljs.core.truth_(frontend.mobile.util.native_platform_QMARK_())){
return frontend.util.text.get_graph_name_from_path(repo_url);
} else {
if(frontend.config.local_file_based_graph_QMARK_(repo_url)){
return frontend.config.get_local_dir(repo_url);
} else {
return frontend.db.conn_state.get_repo_path(repo_url);

}
}
});
/**
 * repo-name: from get-repo-name. Dir/Name => Name
 */
frontend.db.conn.get_short_repo_name = (function frontend$db$conn$get_short_repo_name(repo_name){
var repo_name_SINGLEQUOTE_ = (cljs.core.truth_(frontend.util.electron_QMARK_())?(logseq.graph_parser.text.get_file_basename.cljs$core$IFn$_invoke$arity$1 ? logseq.graph_parser.text.get_file_basename.cljs$core$IFn$_invoke$arity$1(repo_name) : logseq.graph_parser.text.get_file_basename.call(null,repo_name)):(cljs.core.truth_(frontend.mobile.util.native_platform_QMARK_())?logseq.common.util.safe_decode_uri_component((logseq.graph_parser.text.get_file_basename.cljs$core$IFn$_invoke$arity$1 ? logseq.graph_parser.text.get_file_basename.cljs$core$IFn$_invoke$arity$1(repo_name) : logseq.graph_parser.text.get_file_basename.call(null,repo_name))):repo_name
));
if(frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(repo_name_SINGLEQUOTE_)){
return clojure.string.replace_first(repo_name_SINGLEQUOTE_,frontend.config.db_version_prefix,"");
} else {
return repo_name_SINGLEQUOTE_;
}
});
frontend.db.conn.remove_conn_BANG_ = (function frontend$db$conn$remove_conn_BANG_(repo){
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$3(frontend.db.conn.conns,cljs.core.dissoc,frontend.db.conn_state.get_repo_path(repo));
});
if(frontend.util.node_test_QMARK_){
frontend.db.conn.transact_BANG_ = (function frontend$db$conn$transact_BANG_(var_args){
var G__60239 = arguments.length;
switch (G__60239) {
case 2:
return frontend.db.conn.transact_BANG_.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return frontend.db.conn.transact_BANG_.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.db.conn.transact_BANG_.cljs$core$IFn$_invoke$arity$2 = (function (repo,tx_data){
return frontend.db.conn.transact_BANG_.cljs$core$IFn$_invoke$arity$3(repo,tx_data,null);
}));

(frontend.db.conn.transact_BANG_.cljs$core$IFn$_invoke$arity$3 = (function (repo,tx_data,tx_meta){
return logseq.db.transact_BANG_.cljs$core$IFn$_invoke$arity$3(frontend.db.conn.get_db.cljs$core$IFn$_invoke$arity$2(repo,false),tx_data,tx_meta);
}));

(frontend.db.conn.transact_BANG_.cljs$lang$maxFixedArity = 3);

} else {
frontend.db.conn.transact_BANG_ = (function frontend$db$conn$transact_BANG_(var_args){
var G__60246 = arguments.length;
switch (G__60246) {
case 2:
return frontend.db.conn.transact_BANG_.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return frontend.db.conn.transact_BANG_.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.db.conn.transact_BANG_.cljs$core$IFn$_invoke$arity$2 = (function (repo,tx_data){
return frontend.db.conn.transact_BANG_.cljs$core$IFn$_invoke$arity$3(repo,tx_data,null);
}));

(frontend.db.conn.transact_BANG_.cljs$core$IFn$_invoke$arity$3 = (function (repo,tx_data,tx_meta){
return logseq.db.transact_BANG_.cljs$core$IFn$_invoke$arity$3(repo,tx_data,tx_meta);
}));

(frontend.db.conn.transact_BANG_.cljs$lang$maxFixedArity = 3);

}
frontend.db.conn.start_BANG_ = (function frontend$db$conn$start_BANG_(var_args){
var G__60255 = arguments.length;
switch (G__60255) {
case 1:
return frontend.db.conn.start_BANG_.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return frontend.db.conn.start_BANG_.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.db.conn.start_BANG_.cljs$core$IFn$_invoke$arity$1 = (function (repo){
return frontend.db.conn.start_BANG_.cljs$core$IFn$_invoke$arity$2(repo,cljs.core.PersistentArrayMap.EMPTY);
}));

(frontend.db.conn.start_BANG_.cljs$core$IFn$_invoke$arity$2 = (function (repo,p__60256){
var map__60257 = p__60256;
var map__60257__$1 = cljs.core.__destructure_map(map__60257);
var listen_handler = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__60257__$1,new cljs.core.Keyword(null,"listen-handler","listen-handler",-1690024921));
var db_name = frontend.db.conn_state.get_repo_path(repo);
var db_conn = ((frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(repo))?(datascript.core.create_conn.cljs$core$IFn$_invoke$arity$1 ? datascript.core.create_conn.cljs$core$IFn$_invoke$arity$1(logseq.db.frontend.schema.schema) : datascript.core.create_conn.call(null,logseq.db.frontend.schema.schema)):logseq.graph_parser.db.start_conn());
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(frontend.db.conn.conns,cljs.core.assoc,db_name,db_conn);

if(cljs.core.truth_(listen_handler)){
return (listen_handler.cljs$core$IFn$_invoke$arity$1 ? listen_handler.cljs$core$IFn$_invoke$arity$1(db_conn) : listen_handler.call(null,db_conn));
} else {
return null;
}
}));

(frontend.db.conn.start_BANG_.cljs$lang$maxFixedArity = 2);

frontend.db.conn.destroy_all_BANG_ = (function frontend$db$conn$destroy_all_BANG_(){
return cljs.core.reset_BANG_(frontend.db.conn.conns,cljs.core.PersistentArrayMap.EMPTY);
});

//# sourceMappingURL=frontend.db.conn.js.map
