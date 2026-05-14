goog.provide('logseq.outliner.batch_tx');
if((typeof logseq !== 'undefined') && (typeof logseq.outliner !== 'undefined') && (typeof logseq.outliner.batch_tx !== 'undefined') && (typeof logseq.outliner.batch_tx.state !== 'undefined')){
} else {
logseq.outliner.batch_tx.state = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("batch","db-before","batch/db-before",-454926522),null,new cljs.core.Keyword("batch","opts","batch/opts",182656303),null], null));
}

logseq.outliner.batch_tx.set_batch_db_before_BANG_ = (function logseq$outliner$batch_tx$set_batch_db_before_BANG_(db){
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(logseq.outliner.batch_tx.state,cljs.core.assoc,new cljs.core.Keyword("batch","db-before","batch/db-before",-454926522),db);
});

logseq.outliner.batch_tx.get_batch_db_before = (function logseq$outliner$batch_tx$get_batch_db_before(){
return new cljs.core.Keyword("batch","db-before","batch/db-before",-454926522).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(logseq.outliner.batch_tx.state));
});

logseq.outliner.batch_tx.set_batch_opts = (function logseq$outliner$batch_tx$set_batch_opts(opts){
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(logseq.outliner.batch_tx.state,cljs.core.assoc,new cljs.core.Keyword("batch","opts","batch/opts",182656303),opts);
});

logseq.outliner.batch_tx.get_batch_opts = (function logseq$outliner$batch_tx$get_batch_opts(){
return new cljs.core.Keyword("batch","opts","batch/opts",182656303).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(logseq.outliner.batch_tx.state));
});

logseq.outliner.batch_tx.exit_batch_txs_mode_BANG_ = (function logseq$outliner$batch_tx$exit_batch_txs_mode_BANG_(){
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(logseq.outliner.batch_tx.state,cljs.core.assoc,new cljs.core.Keyword("batch","db-before","batch/db-before",-454926522),null);

return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(logseq.outliner.batch_tx.state,cljs.core.assoc,new cljs.core.Keyword("batch","opts","batch/opts",182656303),null);
});

//# sourceMappingURL=logseq.outliner.batch_tx.js.map
