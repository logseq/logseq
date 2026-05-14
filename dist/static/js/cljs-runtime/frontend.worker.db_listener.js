goog.provide('frontend.worker.db_listener');
if((typeof frontend !== 'undefined') && (typeof frontend.worker !== 'undefined') && (typeof frontend.worker.db_listener !== 'undefined') && (typeof frontend.worker.db_listener.listen_db_changes !== 'undefined')){
} else {
frontend.worker.db_listener.listen_db_changes = (function (){var method_table__5599__auto__ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
var prefer_table__5600__auto__ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
var method_cache__5601__auto__ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
var cached_hierarchy__5602__auto__ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
var hierarchy__5603__auto__ = cljs.core.get.cljs$core$IFn$_invoke$arity$3(cljs.core.PersistentArrayMap.EMPTY,new cljs.core.Keyword(null,"hierarchy","hierarchy",-1053470341),(function (){var fexpr__102016 = cljs.core.get_global_hierarchy;
return (fexpr__102016.cljs$core$IFn$_invoke$arity$0 ? fexpr__102016.cljs$core$IFn$_invoke$arity$0() : fexpr__102016.call(null));
})());
return (new cljs.core.MultiFn(cljs.core.symbol.cljs$core$IFn$_invoke$arity$2("frontend.worker.db-listener","listen-db-changes"),(function() { 
var G__102202__delegate = function (listen_key,_){
return listen_key;
};
var G__102202 = function (listen_key,var_args){
var _ = null;
if (arguments.length > 1) {
var G__102203__i = 0, G__102203__a = new Array(arguments.length -  1);
while (G__102203__i < G__102203__a.length) {G__102203__a[G__102203__i] = arguments[G__102203__i + 1]; ++G__102203__i;}
  _ = new cljs.core.IndexedSeq(G__102203__a,0,null);
} 
return G__102202__delegate.call(this,listen_key,_);};
G__102202.cljs$lang$maxFixedArity = 1;
G__102202.cljs$lang$applyTo = (function (arglist__102204){
var listen_key = cljs.core.first(arglist__102204);
var _ = cljs.core.rest(arglist__102204);
return G__102202__delegate(listen_key,_);
});
G__102202.cljs$core$IFn$_invoke$arity$variadic = G__102202__delegate;
return G__102202;
})()
,new cljs.core.Keyword(null,"default","default",-1987822328),hierarchy__5603__auto__,method_table__5599__auto__,prefer_table__5600__auto__,method_cache__5601__auto__,cached_hierarchy__5602__auto__));
})();
}
/**
 * Return tx-report
 */
frontend.worker.db_listener.sync_db_to_main_thread = (function frontend$worker$db_listener$sync_db_to_main_thread(repo,conn,p__102025){
var map__102027 = p__102025;
var map__102027__$1 = cljs.core.__destructure_map(map__102027);
var tx_report = map__102027__$1;
var tx_meta = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__102027__$1,new cljs.core.Keyword(null,"tx-meta","tx-meta",1159283194));
if(cljs.core.truth_(repo)){
frontend.worker.state.set_db_latest_tx_time_BANG_(repo);
} else {
}

var map__102028 = tx_meta;
var map__102028__$1 = cljs.core.__destructure_map(map__102028);
var from_disk_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__102028__$1,new cljs.core.Keyword(null,"from-disk?","from-disk?",-1991074161));
var result = frontend.worker.pipeline.invoke_hooks(repo,conn,tx_report,frontend.worker.state.get_context());
var tx_report_SINGLEQUOTE_ = new cljs.core.Keyword(null,"tx-report","tx-report",1910895391).cljs$core$IFn$_invoke$arity$1(result);
if(cljs.core.truth_((function (){var and__5000__auto__ = result;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.not(new cljs.core.Keyword(null,"rtc-download-graph?","rtc-download-graph?",-1013530237).cljs$core$IFn$_invoke$arity$1(tx_meta));
} else {
return and__5000__auto__;
}
})())){
var data_102208 = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"request-id","request-id",-985684093),new cljs.core.Keyword(null,"request-id","request-id",-985684093).cljs$core$IFn$_invoke$arity$1(tx_meta),new cljs.core.Keyword(null,"repo","repo",-1999060679),repo,new cljs.core.Keyword(null,"tx-data","tx-data",934159761),new cljs.core.Keyword(null,"tx-data","tx-data",934159761).cljs$core$IFn$_invoke$arity$1(tx_report_SINGLEQUOTE_),new cljs.core.Keyword(null,"tx-meta","tx-meta",1159283194),tx_meta], null),cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(result,new cljs.core.Keyword(null,"tx-report","tx-report",1910895391))], 0));
frontend.worker.shared_service.broadcast_to_clients_BANG_(new cljs.core.Keyword(null,"sync-db-changes","sync-db-changes",-1236993461),data_102208);

if(cljs.core.truth_(from_disk_QMARK_)){
} else {
promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41604__auto__){
return promesa.protocols._promise((function (){var map__102035 = frontend.worker.search.sync_search_indice(repo,tx_report_SINGLEQUOTE_);
var map__102035__$1 = cljs.core.__destructure_map(map__102035);
var blocks_to_remove_set = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__102035__$1,new cljs.core.Keyword(null,"blocks-to-remove-set","blocks-to-remove-set",266406009));
var blocks_to_add = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__102035__$1,new cljs.core.Keyword(null,"blocks-to-add","blocks-to-add",-814061792));
if(cljs.core.seq(blocks_to_remove_set)){
var fexpr__102038_102215 = (function (){var fexpr__102039 = cljs.core.deref(frontend.common.thread_api._STAR_thread_apis);
return (fexpr__102039.cljs$core$IFn$_invoke$arity$1 ? fexpr__102039.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("thread-api","search-delete-blocks","thread-api/search-delete-blocks",2049847839)) : fexpr__102039.call(null,new cljs.core.Keyword("thread-api","search-delete-blocks","thread-api/search-delete-blocks",2049847839)));
})();
(fexpr__102038_102215.cljs$core$IFn$_invoke$arity$2 ? fexpr__102038_102215.cljs$core$IFn$_invoke$arity$2(repo,blocks_to_remove_set) : fexpr__102038_102215.call(null,repo,blocks_to_remove_set));
} else {
}

if(cljs.core.seq(blocks_to_add)){
var fexpr__102042 = (function (){var fexpr__102043 = cljs.core.deref(frontend.common.thread_api._STAR_thread_apis);
return (fexpr__102043.cljs$core$IFn$_invoke$arity$1 ? fexpr__102043.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("thread-api","search-upsert-blocks","thread-api/search-upsert-blocks",802527035)) : fexpr__102043.call(null,new cljs.core.Keyword("thread-api","search-upsert-blocks","thread-api/search-upsert-blocks",802527035)));
})();
return (fexpr__102042.cljs$core$IFn$_invoke$arity$2 ? fexpr__102042.cljs$core$IFn$_invoke$arity$2(repo,blocks_to_add) : fexpr__102042.call(null,repo,blocks_to_add));
} else {
return null;
}
})());
}));
}
} else {
}

return tx_report_SINGLEQUOTE_;
});
frontend.worker.db_listener.listen_db_changes_BANG_ = (function frontend$worker$db_listener$listen_db_changes_BANG_(var_args){
var args__5732__auto__ = [];
var len__5726__auto___102218 = arguments.length;
var i__5727__auto___102219 = (0);
while(true){
if((i__5727__auto___102219 < len__5726__auto___102218)){
args__5732__auto__.push((arguments[i__5727__auto___102219]));

var G__102221 = (i__5727__auto___102219 + (1));
i__5727__auto___102219 = G__102221;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((2) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((2)),(0),null)):null);
return frontend.worker.db_listener.listen_db_changes_BANG_.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),(arguments[(1)]),argseq__5733__auto__);
});

(frontend.worker.db_listener.listen_db_changes_BANG_.cljs$core$IFn$_invoke$arity$variadic = (function (repo,conn,p__102064){
var map__102065 = p__102064;
var map__102065__$1 = cljs.core.__destructure_map(map__102065);
var handler_keys = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__102065__$1,new cljs.core.Keyword(null,"handler-keys","handler-keys",-255054774));
var handlers = ((cljs.core.seq(handler_keys))?cljs.core.select_keys(cljs.core.methods$(frontend.worker.db_listener.listen_db_changes),handler_keys):cljs.core.methods$(frontend.worker.db_listener.listen_db_changes));
var sync_db_to_main_thread_QMARK_ = (((handler_keys == null)) || (cljs.core.contains_QMARK_(cljs.core.set(handler_keys),new cljs.core.Keyword(null,"sync-db-to-main-thread","sync-db-to-main-thread",-634277349))));
(datascript.core.unlisten_BANG_.cljs$core$IFn$_invoke$arity$2 ? datascript.core.unlisten_BANG_.cljs$core$IFn$_invoke$arity$2(conn,new cljs.core.Keyword("frontend.worker.db-listener","listen-db-changes!","frontend.worker.db-listener/listen-db-changes!",113189667)) : datascript.core.unlisten_BANG_.call(null,conn,new cljs.core.Keyword("frontend.worker.db-listener","listen-db-changes!","frontend.worker.db-listener/listen-db-changes!",113189667)));

cljs.core.prn.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"listen-db-changes!","listen-db-changes!",500408110),cljs.core.keys(handlers),new cljs.core.Keyword(null,"repo","repo",-1999060679),repo], 0));

var _STAR_batch_all_txs = cljs.core.volatile_BANG_(cljs.core.PersistentVector.EMPTY);
var get_batch_txs = (function (){
return logseq.common.util.distinct_by_last_wins((function (p__102083){
var vec__102084 = p__102083;
var e = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__102084,(0),null);
var a = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__102084,(1),null);
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__102084,(2),null);
var _tx = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__102084,(3),null);
var added = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__102084,(4),null);
return new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [e,a,v,added], null);
}),cljs.core.sort_by.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"tx","tx",466630418),cljs.core.deref(_STAR_batch_all_txs)));
});
var additional_args = (function (tx_data){
var datom_vec_coll = cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.vec,tx_data);
var id__GT_same_entity_datoms = cljs.core.group_by(cljs.core.first,datom_vec_coll);
var id_order = cljs.core.distinct.cljs$core$IFn$_invoke$arity$1(cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.first,datom_vec_coll));
var same_entity_datoms_coll = cljs.core.map.cljs$core$IFn$_invoke$arity$2(id__GT_same_entity_datoms,id_order);
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"same-entity-datoms-coll","same-entity-datoms-coll",336475623),same_entity_datoms_coll], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"id->same-entity-datoms","id->same-entity-datoms",713275082),id__GT_same_entity_datoms], null)], null);
});
var G__102088 = conn;
var G__102089 = new cljs.core.Keyword("frontend.worker.db-listener","listen-db-changes!","frontend.worker.db-listener/listen-db-changes!",113189667);
var G__102090 = (function frontend$worker$db_listener$listen_db_changes_BANG__inner(p__102094){
var map__102095 = p__102094;
var map__102095__$1 = cljs.core.__destructure_map(map__102095);
var tx_report = map__102095__$1;
var tx_data = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__102095__$1,new cljs.core.Keyword(null,"tx-data","tx-data",934159761));
var _db_before = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__102095__$1,new cljs.core.Keyword(null,"_db-before","_db-before",1857235147));
var _db_after = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__102095__$1,new cljs.core.Keyword(null,"_db-after","_db-after",-1808574796));
var tx_meta = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__102095__$1,new cljs.core.Keyword(null,"tx-meta","tx-meta",1159283194));
var tx_meta__$1 = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([logseq.outliner.batch_tx.get_batch_opts(),tx_meta], 0));
var pipeline_replace_QMARK_ = new cljs.core.Keyword(null,"pipeline-replace?","pipeline-replace?",-758892518).cljs$core$IFn$_invoke$arity$1(tx_meta__$1);
var in_batch_tx_mode_QMARK_ = new cljs.core.Keyword("batch-tx","batch-tx-mode?","batch-tx/batch-tx-mode?",1787753099).cljs$core$IFn$_invoke$arity$1(tx_meta__$1);
if(cljs.core.truth_(pipeline_replace_QMARK_)){
return null;
} else {
if(cljs.core.truth_(in_batch_tx_mode_QMARK_)){
logseq.outliner.batch_tx.set_batch_opts(cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(tx_meta__$1,new cljs.core.Keyword(null,"pipeline-replace?","pipeline-replace?",-758892518)));
} else {
}

if(cljs.core.truth_((function (){var and__5000__auto__ = in_batch_tx_mode_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.not(new cljs.core.Keyword("batch-tx","exit?","batch-tx/exit?",-2021083148).cljs$core$IFn$_invoke$arity$1(tx_meta__$1));
} else {
return and__5000__auto__;
}
})())){
return _STAR_batch_all_txs.cljs$core$IVolatile$_vreset_BANG_$arity$2(null,cljs.core.into.cljs$core$IFn$_invoke$arity$2(_STAR_batch_all_txs.cljs$core$IDeref$_deref$arity$1(null),tx_data));
} else {
if(cljs.core.truth_(in_batch_tx_mode_QMARK_)){
var temp__5804__auto__ = cljs.core.not_empty(get_batch_txs());
if(cljs.core.truth_(temp__5804__auto__)){
var tx_data__$1 = temp__5804__auto__;
cljs.core.vreset_BANG_(_STAR_batch_all_txs,cljs.core.PersistentVector.EMPTY);

var db_before = logseq.outliner.batch_tx.get_batch_db_before();
var tx_meta__$2 = cljs.core.dissoc.cljs$core$IFn$_invoke$arity$variadic(tx_meta__$1,new cljs.core.Keyword("batch-tx","batch-tx-mode?","batch-tx/batch-tx-mode?",1787753099),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("batch-tx","exit?","batch-tx/exit?",-2021083148)], 0));
var tx_report__$1 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(tx_report,new cljs.core.Keyword(null,"tx-data","tx-data",934159761),tx_data__$1,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"db-before","db-before",-553691536),db_before,new cljs.core.Keyword(null,"tx-meta","tx-meta",1159283194),tx_meta__$2], 0));
var tx_report_SINGLEQUOTE_ = ((sync_db_to_main_thread_QMARK_)?frontend.worker.db_listener.sync_db_to_main_thread(repo,conn,tx_report__$1):tx_report__$1);
var opt = cljs.core.into.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"repo","repo",-1999060679),repo], null),additional_args(new cljs.core.Keyword(null,"tx-data","tx-data",934159761).cljs$core$IFn$_invoke$arity$1(tx_report_SINGLEQUOTE_)));
var seq__102106 = cljs.core.seq(handlers);
var chunk__102107 = null;
var count__102108 = (0);
var i__102109 = (0);
while(true){
if((i__102109 < count__102108)){
var vec__102129 = chunk__102107.cljs$core$IIndexed$_nth$arity$2(null,i__102109);
var k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__102129,(0),null);
var handler_fn = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__102129,(1),null);
(handler_fn.cljs$core$IFn$_invoke$arity$3 ? handler_fn.cljs$core$IFn$_invoke$arity$3(k,opt,tx_report_SINGLEQUOTE_) : handler_fn.call(null,k,opt,tx_report_SINGLEQUOTE_));


var G__102254 = seq__102106;
var G__102255 = chunk__102107;
var G__102256 = count__102108;
var G__102257 = (i__102109 + (1));
seq__102106 = G__102254;
chunk__102107 = G__102255;
count__102108 = G__102256;
i__102109 = G__102257;
continue;
} else {
var temp__5804__auto____$1 = cljs.core.seq(seq__102106);
if(temp__5804__auto____$1){
var seq__102106__$1 = temp__5804__auto____$1;
if(cljs.core.chunked_seq_QMARK_(seq__102106__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__102106__$1);
var G__102260 = cljs.core.chunk_rest(seq__102106__$1);
var G__102261 = c__5525__auto__;
var G__102262 = cljs.core.count(c__5525__auto__);
var G__102263 = (0);
seq__102106 = G__102260;
chunk__102107 = G__102261;
count__102108 = G__102262;
i__102109 = G__102263;
continue;
} else {
var vec__102139 = cljs.core.first(seq__102106__$1);
var k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__102139,(0),null);
var handler_fn = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__102139,(1),null);
(handler_fn.cljs$core$IFn$_invoke$arity$3 ? handler_fn.cljs$core$IFn$_invoke$arity$3(k,opt,tx_report_SINGLEQUOTE_) : handler_fn.call(null,k,opt,tx_report_SINGLEQUOTE_));


var G__102267 = cljs.core.next(seq__102106__$1);
var G__102268 = null;
var G__102269 = (0);
var G__102270 = (0);
seq__102106 = G__102267;
chunk__102107 = G__102268;
count__102108 = G__102269;
i__102109 = G__102270;
continue;
}
} else {
return null;
}
}
break;
}
} else {
return null;
}
} else {
if(cljs.core.seq(tx_data)){
var tx_report_SINGLEQUOTE_ = ((sync_db_to_main_thread_QMARK_)?frontend.worker.db_listener.sync_db_to_main_thread(repo,conn,tx_report):tx_report);
var opt = cljs.core.into.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"repo","repo",-1999060679),repo], null),additional_args(new cljs.core.Keyword(null,"tx-data","tx-data",934159761).cljs$core$IFn$_invoke$arity$1(tx_report_SINGLEQUOTE_)));
var seq__102147 = cljs.core.seq(handlers);
var chunk__102148 = null;
var count__102149 = (0);
var i__102150 = (0);
while(true){
if((i__102150 < count__102149)){
var vec__102184 = chunk__102148.cljs$core$IIndexed$_nth$arity$2(null,i__102150);
var k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__102184,(0),null);
var handler_fn = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__102184,(1),null);
(handler_fn.cljs$core$IFn$_invoke$arity$3 ? handler_fn.cljs$core$IFn$_invoke$arity$3(k,opt,tx_report_SINGLEQUOTE_) : handler_fn.call(null,k,opt,tx_report_SINGLEQUOTE_));


var G__102280 = seq__102147;
var G__102281 = chunk__102148;
var G__102282 = count__102149;
var G__102283 = (i__102150 + (1));
seq__102147 = G__102280;
chunk__102148 = G__102281;
count__102149 = G__102282;
i__102150 = G__102283;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__102147);
if(temp__5804__auto__){
var seq__102147__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__102147__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__102147__$1);
var G__102289 = cljs.core.chunk_rest(seq__102147__$1);
var G__102290 = c__5525__auto__;
var G__102291 = cljs.core.count(c__5525__auto__);
var G__102292 = (0);
seq__102147 = G__102289;
chunk__102148 = G__102290;
count__102149 = G__102291;
i__102150 = G__102292;
continue;
} else {
var vec__102190 = cljs.core.first(seq__102147__$1);
var k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__102190,(0),null);
var handler_fn = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__102190,(1),null);
(handler_fn.cljs$core$IFn$_invoke$arity$3 ? handler_fn.cljs$core$IFn$_invoke$arity$3(k,opt,tx_report_SINGLEQUOTE_) : handler_fn.call(null,k,opt,tx_report_SINGLEQUOTE_));


var G__102299 = cljs.core.next(seq__102147__$1);
var G__102300 = null;
var G__102301 = (0);
var G__102302 = (0);
seq__102147 = G__102299;
chunk__102148 = G__102300;
count__102149 = G__102301;
i__102150 = G__102302;
continue;
}
} else {
return null;
}
}
break;
}
} else {
return null;
}
}
}
}
});
return (datascript.core.listen_BANG_.cljs$core$IFn$_invoke$arity$3 ? datascript.core.listen_BANG_.cljs$core$IFn$_invoke$arity$3(G__102088,G__102089,G__102090) : datascript.core.listen_BANG_.call(null,G__102088,G__102089,G__102090));
}));

(frontend.worker.db_listener.listen_db_changes_BANG_.cljs$lang$maxFixedArity = (2));

/** @this {Function} */
(frontend.worker.db_listener.listen_db_changes_BANG_.cljs$lang$applyTo = (function (seq102055){
var G__102056 = cljs.core.first(seq102055);
var seq102055__$1 = cljs.core.next(seq102055);
var G__102057 = cljs.core.first(seq102055__$1);
var seq102055__$2 = cljs.core.next(seq102055__$1);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__102056,G__102057,seq102055__$2);
}));


//# sourceMappingURL=frontend.worker.db_listener.js.map
