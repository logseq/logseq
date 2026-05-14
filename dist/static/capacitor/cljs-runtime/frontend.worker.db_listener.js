goog.provide('frontend.worker.db_listener');
if((typeof frontend !== 'undefined') && (typeof frontend.worker !== 'undefined') && (typeof frontend.worker.db_listener !== 'undefined') && (typeof frontend.worker.db_listener.listen_db_changes !== 'undefined')){
} else {
frontend.worker.db_listener.listen_db_changes = (function (){var method_table__5599__auto__ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
var prefer_table__5600__auto__ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
var method_cache__5601__auto__ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
var cached_hierarchy__5602__auto__ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
var hierarchy__5603__auto__ = cljs.core.get.cljs$core$IFn$_invoke$arity$3(cljs.core.PersistentArrayMap.EMPTY,new cljs.core.Keyword(null,"hierarchy","hierarchy",-1053470341),(function (){var fexpr__133468 = cljs.core.get_global_hierarchy;
return (fexpr__133468.cljs$core$IFn$_invoke$arity$0 ? fexpr__133468.cljs$core$IFn$_invoke$arity$0() : fexpr__133468.call(null));
})());
return (new cljs.core.MultiFn(cljs.core.symbol.cljs$core$IFn$_invoke$arity$2("frontend.worker.db-listener","listen-db-changes"),(function() { 
var G__133628__delegate = function (listen_key,_){
return listen_key;
};
var G__133628 = function (listen_key,var_args){
var _ = null;
if (arguments.length > 1) {
var G__133629__i = 0, G__133629__a = new Array(arguments.length -  1);
while (G__133629__i < G__133629__a.length) {G__133629__a[G__133629__i] = arguments[G__133629__i + 1]; ++G__133629__i;}
  _ = new cljs.core.IndexedSeq(G__133629__a,0,null);
} 
return G__133628__delegate.call(this,listen_key,_);};
G__133628.cljs$lang$maxFixedArity = 1;
G__133628.cljs$lang$applyTo = (function (arglist__133631){
var listen_key = cljs.core.first(arglist__133631);
var _ = cljs.core.rest(arglist__133631);
return G__133628__delegate(listen_key,_);
});
G__133628.cljs$core$IFn$_invoke$arity$variadic = G__133628__delegate;
return G__133628;
})()
,new cljs.core.Keyword(null,"default","default",-1987822328),hierarchy__5603__auto__,method_table__5599__auto__,prefer_table__5600__auto__,method_cache__5601__auto__,cached_hierarchy__5602__auto__));
})();
}
/**
 * Return tx-report
 */
frontend.worker.db_listener.sync_db_to_main_thread = (function frontend$worker$db_listener$sync_db_to_main_thread(repo,conn,p__133486){
var map__133487 = p__133486;
var map__133487__$1 = cljs.core.__destructure_map(map__133487);
var tx_report = map__133487__$1;
var tx_meta = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__133487__$1,new cljs.core.Keyword(null,"tx-meta","tx-meta",1159283194));
if(cljs.core.truth_(repo)){
frontend.worker.state.set_db_latest_tx_time_BANG_(repo);
} else {
}

var map__133489 = tx_meta;
var map__133489__$1 = cljs.core.__destructure_map(map__133489);
var from_disk_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__133489__$1,new cljs.core.Keyword(null,"from-disk?","from-disk?",-1991074161));
var result = frontend.worker.pipeline.invoke_hooks(repo,conn,tx_report,frontend.worker.state.get_context());
var tx_report_SINGLEQUOTE_ = new cljs.core.Keyword(null,"tx-report","tx-report",1910895391).cljs$core$IFn$_invoke$arity$1(result);
if(cljs.core.truth_((function (){var and__5000__auto__ = result;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.not(new cljs.core.Keyword(null,"rtc-download-graph?","rtc-download-graph?",-1013530237).cljs$core$IFn$_invoke$arity$1(tx_meta));
} else {
return and__5000__auto__;
}
})())){
var data_133639 = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"request-id","request-id",-985684093),new cljs.core.Keyword(null,"request-id","request-id",-985684093).cljs$core$IFn$_invoke$arity$1(tx_meta),new cljs.core.Keyword(null,"repo","repo",-1999060679),repo,new cljs.core.Keyword(null,"tx-data","tx-data",934159761),new cljs.core.Keyword(null,"tx-data","tx-data",934159761).cljs$core$IFn$_invoke$arity$1(tx_report_SINGLEQUOTE_),new cljs.core.Keyword(null,"tx-meta","tx-meta",1159283194),tx_meta], null),cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(result,new cljs.core.Keyword(null,"tx-report","tx-report",1910895391))], 0));
frontend.worker.shared_service.broadcast_to_clients_BANG_(new cljs.core.Keyword(null,"sync-db-changes","sync-db-changes",-1236993461),data_133639);

if(cljs.core.truth_(from_disk_QMARK_)){
} else {
promesa.protocols._mcat(promesa.protocols._promise(null),(function (___48196__auto__){
return promesa.protocols._promise((function (){var map__133490 = frontend.worker.search.sync_search_indice(repo,tx_report_SINGLEQUOTE_);
var map__133490__$1 = cljs.core.__destructure_map(map__133490);
var blocks_to_remove_set = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__133490__$1,new cljs.core.Keyword(null,"blocks-to-remove-set","blocks-to-remove-set",266406009));
var blocks_to_add = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__133490__$1,new cljs.core.Keyword(null,"blocks-to-add","blocks-to-add",-814061792));
if(cljs.core.seq(blocks_to_remove_set)){
var fexpr__133493_133642 = (function (){var fexpr__133494 = cljs.core.deref(frontend.common.thread_api._STAR_thread_apis);
return (fexpr__133494.cljs$core$IFn$_invoke$arity$1 ? fexpr__133494.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("thread-api","search-delete-blocks","thread-api/search-delete-blocks",2049847839)) : fexpr__133494.call(null,new cljs.core.Keyword("thread-api","search-delete-blocks","thread-api/search-delete-blocks",2049847839)));
})();
(fexpr__133493_133642.cljs$core$IFn$_invoke$arity$2 ? fexpr__133493_133642.cljs$core$IFn$_invoke$arity$2(repo,blocks_to_remove_set) : fexpr__133493_133642.call(null,repo,blocks_to_remove_set));
} else {
}

if(cljs.core.seq(blocks_to_add)){
var fexpr__133496 = (function (){var fexpr__133497 = cljs.core.deref(frontend.common.thread_api._STAR_thread_apis);
return (fexpr__133497.cljs$core$IFn$_invoke$arity$1 ? fexpr__133497.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("thread-api","search-upsert-blocks","thread-api/search-upsert-blocks",802527035)) : fexpr__133497.call(null,new cljs.core.Keyword("thread-api","search-upsert-blocks","thread-api/search-upsert-blocks",802527035)));
})();
return (fexpr__133496.cljs$core$IFn$_invoke$arity$2 ? fexpr__133496.cljs$core$IFn$_invoke$arity$2(repo,blocks_to_add) : fexpr__133496.call(null,repo,blocks_to_add));
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
var len__5726__auto___133648 = arguments.length;
var i__5727__auto___133649 = (0);
while(true){
if((i__5727__auto___133649 < len__5726__auto___133648)){
args__5732__auto__.push((arguments[i__5727__auto___133649]));

var G__133650 = (i__5727__auto___133649 + (1));
i__5727__auto___133649 = G__133650;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((2) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((2)),(0),null)):null);
return frontend.worker.db_listener.listen_db_changes_BANG_.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),(arguments[(1)]),argseq__5733__auto__);
});

(frontend.worker.db_listener.listen_db_changes_BANG_.cljs$core$IFn$_invoke$arity$variadic = (function (repo,conn,p__133523){
var map__133524 = p__133523;
var map__133524__$1 = cljs.core.__destructure_map(map__133524);
var handler_keys = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__133524__$1,new cljs.core.Keyword(null,"handler-keys","handler-keys",-255054774));
var handlers = ((cljs.core.seq(handler_keys))?cljs.core.select_keys(cljs.core.methods$(frontend.worker.db_listener.listen_db_changes),handler_keys):cljs.core.methods$(frontend.worker.db_listener.listen_db_changes));
var sync_db_to_main_thread_QMARK_ = (((handler_keys == null)) || (cljs.core.contains_QMARK_(cljs.core.set(handler_keys),new cljs.core.Keyword(null,"sync-db-to-main-thread","sync-db-to-main-thread",-634277349))));
(datascript.core.unlisten_BANG_.cljs$core$IFn$_invoke$arity$2 ? datascript.core.unlisten_BANG_.cljs$core$IFn$_invoke$arity$2(conn,new cljs.core.Keyword("frontend.worker.db-listener","listen-db-changes!","frontend.worker.db-listener/listen-db-changes!",113189667)) : datascript.core.unlisten_BANG_.call(null,conn,new cljs.core.Keyword("frontend.worker.db-listener","listen-db-changes!","frontend.worker.db-listener/listen-db-changes!",113189667)));

cljs.core.prn.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"listen-db-changes!","listen-db-changes!",500408110),cljs.core.keys(handlers),new cljs.core.Keyword(null,"repo","repo",-1999060679),repo], 0));

var _STAR_batch_all_txs = cljs.core.volatile_BANG_(cljs.core.PersistentVector.EMPTY);
var get_batch_txs = (function (){
return logseq.common.util.distinct_by_last_wins((function (p__133532){
var vec__133533 = p__133532;
var e = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__133533,(0),null);
var a = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__133533,(1),null);
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__133533,(2),null);
var _tx = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__133533,(3),null);
var added = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__133533,(4),null);
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
var G__133546 = conn;
var G__133547 = new cljs.core.Keyword("frontend.worker.db-listener","listen-db-changes!","frontend.worker.db-listener/listen-db-changes!",113189667);
var G__133548 = (function frontend$worker$db_listener$listen_db_changes_BANG__inner(p__133557){
var map__133558 = p__133557;
var map__133558__$1 = cljs.core.__destructure_map(map__133558);
var tx_report = map__133558__$1;
var tx_data = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__133558__$1,new cljs.core.Keyword(null,"tx-data","tx-data",934159761));
var _db_before = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__133558__$1,new cljs.core.Keyword(null,"_db-before","_db-before",1857235147));
var _db_after = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__133558__$1,new cljs.core.Keyword(null,"_db-after","_db-after",-1808574796));
var tx_meta = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__133558__$1,new cljs.core.Keyword(null,"tx-meta","tx-meta",1159283194));
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
var seq__133564 = cljs.core.seq(handlers);
var chunk__133565 = null;
var count__133566 = (0);
var i__133567 = (0);
while(true){
if((i__133567 < count__133566)){
var vec__133580 = chunk__133565.cljs$core$IIndexed$_nth$arity$2(null,i__133567);
var k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__133580,(0),null);
var handler_fn = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__133580,(1),null);
(handler_fn.cljs$core$IFn$_invoke$arity$3 ? handler_fn.cljs$core$IFn$_invoke$arity$3(k,opt,tx_report_SINGLEQUOTE_) : handler_fn.call(null,k,opt,tx_report_SINGLEQUOTE_));


var G__133673 = seq__133564;
var G__133674 = chunk__133565;
var G__133675 = count__133566;
var G__133676 = (i__133567 + (1));
seq__133564 = G__133673;
chunk__133565 = G__133674;
count__133566 = G__133675;
i__133567 = G__133676;
continue;
} else {
var temp__5804__auto____$1 = cljs.core.seq(seq__133564);
if(temp__5804__auto____$1){
var seq__133564__$1 = temp__5804__auto____$1;
if(cljs.core.chunked_seq_QMARK_(seq__133564__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__133564__$1);
var G__133677 = cljs.core.chunk_rest(seq__133564__$1);
var G__133678 = c__5525__auto__;
var G__133679 = cljs.core.count(c__5525__auto__);
var G__133680 = (0);
seq__133564 = G__133677;
chunk__133565 = G__133678;
count__133566 = G__133679;
i__133567 = G__133680;
continue;
} else {
var vec__133585 = cljs.core.first(seq__133564__$1);
var k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__133585,(0),null);
var handler_fn = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__133585,(1),null);
(handler_fn.cljs$core$IFn$_invoke$arity$3 ? handler_fn.cljs$core$IFn$_invoke$arity$3(k,opt,tx_report_SINGLEQUOTE_) : handler_fn.call(null,k,opt,tx_report_SINGLEQUOTE_));


var G__133681 = cljs.core.next(seq__133564__$1);
var G__133682 = null;
var G__133683 = (0);
var G__133684 = (0);
seq__133564 = G__133681;
chunk__133565 = G__133682;
count__133566 = G__133683;
i__133567 = G__133684;
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
var seq__133598 = cljs.core.seq(handlers);
var chunk__133599 = null;
var count__133601 = (0);
var i__133602 = (0);
while(true){
if((i__133602 < count__133601)){
var vec__133616 = chunk__133599.cljs$core$IIndexed$_nth$arity$2(null,i__133602);
var k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__133616,(0),null);
var handler_fn = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__133616,(1),null);
(handler_fn.cljs$core$IFn$_invoke$arity$3 ? handler_fn.cljs$core$IFn$_invoke$arity$3(k,opt,tx_report_SINGLEQUOTE_) : handler_fn.call(null,k,opt,tx_report_SINGLEQUOTE_));


var G__133685 = seq__133598;
var G__133686 = chunk__133599;
var G__133687 = count__133601;
var G__133688 = (i__133602 + (1));
seq__133598 = G__133685;
chunk__133599 = G__133686;
count__133601 = G__133687;
i__133602 = G__133688;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__133598);
if(temp__5804__auto__){
var seq__133598__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__133598__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__133598__$1);
var G__133689 = cljs.core.chunk_rest(seq__133598__$1);
var G__133690 = c__5525__auto__;
var G__133691 = cljs.core.count(c__5525__auto__);
var G__133692 = (0);
seq__133598 = G__133689;
chunk__133599 = G__133690;
count__133601 = G__133691;
i__133602 = G__133692;
continue;
} else {
var vec__133621 = cljs.core.first(seq__133598__$1);
var k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__133621,(0),null);
var handler_fn = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__133621,(1),null);
(handler_fn.cljs$core$IFn$_invoke$arity$3 ? handler_fn.cljs$core$IFn$_invoke$arity$3(k,opt,tx_report_SINGLEQUOTE_) : handler_fn.call(null,k,opt,tx_report_SINGLEQUOTE_));


var G__133693 = cljs.core.next(seq__133598__$1);
var G__133694 = null;
var G__133695 = (0);
var G__133696 = (0);
seq__133598 = G__133693;
chunk__133599 = G__133694;
count__133601 = G__133695;
i__133602 = G__133696;
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
return (datascript.core.listen_BANG_.cljs$core$IFn$_invoke$arity$3 ? datascript.core.listen_BANG_.cljs$core$IFn$_invoke$arity$3(G__133546,G__133547,G__133548) : datascript.core.listen_BANG_.call(null,G__133546,G__133547,G__133548));
}));

(frontend.worker.db_listener.listen_db_changes_BANG_.cljs$lang$maxFixedArity = (2));

/** @this {Function} */
(frontend.worker.db_listener.listen_db_changes_BANG_.cljs$lang$applyTo = (function (seq133511){
var G__133512 = cljs.core.first(seq133511);
var seq133511__$1 = cljs.core.next(seq133511);
var G__133513 = cljs.core.first(seq133511__$1);
var seq133511__$2 = cljs.core.next(seq133511__$1);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__133512,G__133513,seq133511__$2);
}));


//# sourceMappingURL=frontend.worker.db_listener.js.map
