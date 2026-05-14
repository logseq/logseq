goog.provide('frontend.db');
frontend.db.get_repo_path = frontend.db.conn.get_repo_path;

frontend.db.get_repo_name = frontend.db.conn.get_repo_name;

frontend.db.get_short_repo_name = frontend.db.conn.get_short_repo_name;

frontend.db.get_db = frontend.db.conn.get_db;

frontend.db.remove_conn_BANG_ = frontend.db.conn.remove_conn_BANG_;

frontend.db.entity = frontend.db.utils.entity;

frontend.db.pull = frontend.db.utils.pull;

frontend.db.pull_many = frontend.db.utils.pull_many;

frontend.db.delete_files = frontend.db.model.delete_files;

frontend.db.get_block_and_children = frontend.db.model.get_block_and_children;

frontend.db.get_block_by_uuid = frontend.db.model.get_block_by_uuid;

frontend.db.get_block_children = frontend.db.model.get_block_children;

frontend.db.sort_by_order = frontend.db.model.sort_by_order;

frontend.db.get_block_parent = frontend.db.model.get_block_parent;

frontend.db.get_block_parents = frontend.db.model.get_block_parents;

frontend.db.parents_collapsed_QMARK_ = frontend.db.model.parents_collapsed_QMARK_;

frontend.db.get_block_immediate_children = frontend.db.model.get_block_immediate_children;

frontend.db.get_block_page = frontend.db.model.get_block_page;

frontend.db.get_file = frontend.db.model.get_file;

frontend.db.file_exists_QMARK_ = frontend.db.model.file_exists_QMARK_;

frontend.db.get_files_full = frontend.db.model.get_files_full;

frontend.db.get_latest_journals = frontend.db.model.get_latest_journals;

frontend.db.get_page = frontend.db.model.get_page;

frontend.db.get_case_page = frontend.db.model.get_case_page;

frontend.db.get_page_alias_names = frontend.db.model.get_page_alias_names;

frontend.db.get_page_format = frontend.db.model.get_page_format;

frontend.db.journal_page_QMARK_ = frontend.db.model.journal_page_QMARK_;

frontend.db.page_QMARK_ = frontend.db.model.page_QMARK_;

frontend.db.sub_block = frontend.db.model.sub_block;

frontend.db.page_empty_QMARK_ = frontend.db.model.page_empty_QMARK_;

frontend.db.page_exists_QMARK_ = frontend.db.model.page_exists_QMARK_;

frontend.db.get_alias_source_page = frontend.db.model.get_alias_source_page;

frontend.db.has_children_QMARK_ = frontend.db.model.has_children_QMARK_;

frontend.db.whiteboard_page_QMARK_ = frontend.db.model.whiteboard_page_QMARK_;
frontend.db.start_db_conn_BANG_ = (function frontend$db$start_db_conn_BANG_(var_args){
var G__100757 = arguments.length;
switch (G__100757) {
case 1:
return frontend.db.start_db_conn_BANG_.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return frontend.db.start_db_conn_BANG_.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.db.start_db_conn_BANG_.cljs$core$IFn$_invoke$arity$1 = (function (repo){
return frontend.db.start_db_conn_BANG_.cljs$core$IFn$_invoke$arity$2(repo,cljs.core.PersistentArrayMap.EMPTY);
}));

(frontend.db.start_db_conn_BANG_.cljs$core$IFn$_invoke$arity$2 = (function (repo,option){
return frontend.db.conn.start_BANG_.cljs$core$IFn$_invoke$arity$2(repo,option);
}));

(frontend.db.start_db_conn_BANG_.cljs$lang$maxFixedArity = 2);

frontend.db.new_block_id = logseq.db.new_block_id;
frontend.db.transact_BANG_ = (function frontend$db$transact_BANG_(var_args){
var G__100762 = arguments.length;
switch (G__100762) {
case 1:
return frontend.db.transact_BANG_.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return frontend.db.transact_BANG_.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return frontend.db.transact_BANG_.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.db.transact_BANG_.cljs$core$IFn$_invoke$arity$1 = (function (tx_data){
return frontend.db.transact_BANG_.cljs$core$IFn$_invoke$arity$3(frontend.state.get_current_repo(),tx_data,null);
}));

(frontend.db.transact_BANG_.cljs$core$IFn$_invoke$arity$2 = (function (repo,tx_data){
return frontend.db.transact_BANG_.cljs$core$IFn$_invoke$arity$3(repo,tx_data,null);
}));

(frontend.db.transact_BANG_.cljs$core$IFn$_invoke$arity$3 = (function (repo,tx_data,tx_meta){
if(frontend.config.publishing_QMARK_){
if(cljs.core.truth_((function (){var or__5002__auto__ = (function (){var G__100765 = new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450).cljs$core$IFn$_invoke$arity$1(tx_meta);
var fexpr__100764 = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"collapse-expand-blocks","collapse-expand-blocks",-868833367),null,new cljs.core.Keyword(null,"save-block","save-block",591532560),null], null), null);
return (fexpr__100764.cljs$core$IFn$_invoke$arity$1 ? fexpr__100764.cljs$core$IFn$_invoke$arity$1(G__100765) : fexpr__100764.call(null,G__100765));
})();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword(null,"init-db?","init-db?",-679746091).cljs$core$IFn$_invoke$arity$1(tx_meta);
}
})())){
return frontend.db.conn.transact_BANG_.cljs$core$IFn$_invoke$arity$3(repo,tx_data,tx_meta);
} else {
return null;
}
} else {
var test_QMARK___49426__auto__ = frontend.util.node_test_QMARK_;
var ops__49427__auto__ = frontend.modules.outliner.op._STAR_outliner_ops_STAR_;
var editor_info__49428__auto__ = frontend.state.get_editor_info();
cljs.core.reset_BANG_(frontend.state._STAR_editor_info,editor_info__49428__auto__);

if(cljs.core.truth_(ops__49427__auto__)){
return frontend.modules.outliner.op.transact_BANG_(tx_data,tx_meta);
} else {
var _STAR_outliner_ops_STAR__orig_val__100766 = frontend.modules.outliner.op._STAR_outliner_ops_STAR_;
var _STAR_outliner_ops_STAR__temp_val__100767 = cljs.core.transient$(cljs.core.PersistentVector.EMPTY);
(frontend.modules.outliner.op._STAR_outliner_ops_STAR_ = _STAR_outliner_ops_STAR__temp_val__100767);

try{frontend.modules.outliner.op.transact_BANG_(tx_data,tx_meta);

var r__49429__auto__ = cljs.core.persistent_BANG_(frontend.modules.outliner.op._STAR_outliner_ops_STAR_);
if(test_QMARK___49426__auto__){
if(cljs.core.seq(r__49429__auto__)){
return logseq.outliner.op.apply_ops_BANG_(frontend.state.get_current_repo(),frontend.db.conn.get_db.cljs$core$IFn$_invoke$arity$1(false),r__49429__auto__,frontend.state.get_date_formatter(),tx_meta);
} else {
return null;
}
} else {
if(cljs.core.seq(r__49429__auto__)){
var request_id__49430__auto__ = (frontend.state.get_worker_next_request_id.cljs$core$IFn$_invoke$arity$0 ? frontend.state.get_worker_next_request_id.cljs$core$IFn$_invoke$arity$0() : frontend.state.get_worker_next_request_id.call(null));
var request__49431__auto__ = (function (){
return frontend.state._LT_invoke_db_worker.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword("thread-api","apply-outliner-ops","thread-api/apply-outliner-ops",654139693),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([frontend.state.get_current_repo(),r__49429__auto__,cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(tx_meta,new cljs.core.Keyword(null,"request-id","request-id",-985684093),request_id__49430__auto__,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"client-id","client-id",-464622140),new cljs.core.Keyword(null,"client-id","client-id",-464622140).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state))], 0))], 0));
});
var response__49432__auto__ = (frontend.state.add_worker_request_BANG_.cljs$core$IFn$_invoke$arity$2 ? frontend.state.add_worker_request_BANG_.cljs$core$IFn$_invoke$arity$2(request_id__49430__auto__,request__49431__auto__) : frontend.state.add_worker_request_BANG_.call(null,request_id__49430__auto__,request__49431__auto__));
return response__49432__auto__;
} else {
return null;
}
}
}finally {(frontend.modules.outliner.op._STAR_outliner_ops_STAR_ = _STAR_outliner_ops_STAR__orig_val__100766);
}}
}
}));

(frontend.db.transact_BANG_.cljs$lang$maxFixedArity = 3);

/**
 * Refresh file timestamps to DB
 */
frontend.db.set_file_last_modified_at_BANG_ = (function frontend$db$set_file_last_modified_at_BANG_(repo,path,last_modified_at){
if(cljs.core.truth_((function (){var and__5000__auto__ = repo;
if(cljs.core.truth_(and__5000__auto__)){
var and__5000__auto____$1 = (!(frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(repo)));
if(and__5000__auto____$1){
var and__5000__auto____$2 = path;
if(cljs.core.truth_(and__5000__auto____$2)){
return last_modified_at;
} else {
return and__5000__auto____$2;
}
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})())){
return frontend.db.transact_BANG_.cljs$core$IFn$_invoke$arity$3(repo,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("file","path","file/path",-191335748),path,new cljs.core.Keyword("file","last-modified-at","file/last-modified-at",473527310),last_modified_at], null)], null),cljs.core.PersistentArrayMap.EMPTY);
} else {
return null;
}
});
frontend.db.set_file_content_BANG_ = (function frontend$db$set_file_content_BANG_(var_args){
var G__100772 = arguments.length;
switch (G__100772) {
case 3:
return frontend.db.set_file_content_BANG_.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
case 4:
return frontend.db.set_file_content_BANG_.cljs$core$IFn$_invoke$arity$4((arguments[(0)]),(arguments[(1)]),(arguments[(2)]),(arguments[(3)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.db.set_file_content_BANG_.cljs$core$IFn$_invoke$arity$3 = (function (repo,path,content){
return frontend.db.set_file_content_BANG_.cljs$core$IFn$_invoke$arity$4(repo,path,content,cljs.core.PersistentArrayMap.EMPTY);
}));

(frontend.db.set_file_content_BANG_.cljs$core$IFn$_invoke$arity$4 = (function (repo,path,content,opts){
if(cljs.core.truth_((function (){var and__5000__auto__ = repo;
if(cljs.core.truth_(and__5000__auto__)){
return path;
} else {
return and__5000__auto__;
}
})())){
var tx_data = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("file","path","file/path",-191335748),path,new cljs.core.Keyword("file","content","file/content",12680964),content], null);
return frontend.db.transact_BANG_.cljs$core$IFn$_invoke$arity$3(repo,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [tx_data], null),opts);
} else {
return null;
}
}));

(frontend.db.set_file_content_BANG_.cljs$lang$maxFixedArity = 4);


//# sourceMappingURL=frontend.db.js.map
