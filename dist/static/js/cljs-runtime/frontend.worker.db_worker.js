goog.provide('frontend.worker.db_worker');
goog.scope(function(){
  frontend.worker.db_worker.goog$module$goog$object = goog.module.get('goog.object');
});
var module$node_modules$$logseq$sqlite_wasm$index_mjs=shadow.js.require("module$node_modules$$logseq$sqlite_wasm$index_mjs", {});
var module$node_modules$comlink$dist$umd$comlink=shadow.js.require("module$node_modules$comlink$dist$umd$comlink", {});
if((typeof frontend !== 'undefined') && (typeof frontend.worker !== 'undefined') && (typeof frontend.worker.db_worker !== 'undefined') && (typeof frontend.worker.db_worker._STAR_sqlite !== 'undefined')){
} else {
frontend.worker.db_worker._STAR_sqlite = frontend.worker.state._STAR_sqlite;
}
if((typeof frontend !== 'undefined') && (typeof frontend.worker !== 'undefined') && (typeof frontend.worker.db_worker !== 'undefined') && (typeof frontend.worker.db_worker._STAR_sqlite_conns !== 'undefined')){
} else {
frontend.worker.db_worker._STAR_sqlite_conns = frontend.worker.state._STAR_sqlite_conns;
}
if((typeof frontend !== 'undefined') && (typeof frontend.worker !== 'undefined') && (typeof frontend.worker.db_worker !== 'undefined') && (typeof frontend.worker.db_worker._STAR_datascript_conns !== 'undefined')){
} else {
frontend.worker.db_worker._STAR_datascript_conns = frontend.worker.state._STAR_datascript_conns;
}
if((typeof frontend !== 'undefined') && (typeof frontend.worker !== 'undefined') && (typeof frontend.worker.db_worker !== 'undefined') && (typeof frontend.worker.db_worker._STAR_client_ops_conns !== 'undefined')){
} else {
frontend.worker.db_worker._STAR_client_ops_conns = frontend.worker.state._STAR_client_ops_conns;
}
if((typeof frontend !== 'undefined') && (typeof frontend.worker !== 'undefined') && (typeof frontend.worker.db_worker !== 'undefined') && (typeof frontend.worker.db_worker._STAR_opfs_pools !== 'undefined')){
} else {
frontend.worker.db_worker._STAR_opfs_pools = frontend.worker.state._STAR_opfs_pools;
}
if((typeof frontend !== 'undefined') && (typeof frontend.worker !== 'undefined') && (typeof frontend.worker.db_worker !== 'undefined') && (typeof frontend.worker.db_worker._STAR_publishing_QMARK_ !== 'undefined')){
} else {
frontend.worker.db_worker._STAR_publishing_QMARK_ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(false);
}
frontend.worker.db_worker.check_worker_scope_BANG_ = (function frontend$worker$db_worker$check_worker_scope_BANG_(){
if(cljs.core.truth_((function (){var or__5002__auto__ = frontend.worker.db_worker.goog$module$goog$object.get(self,"React");
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return frontend.worker.db_worker.goog$module$goog$object.get(self,"module$react");
}
})())){
throw (new Error("[db-worker] React is forbidden in worker scope!"));
} else {
return null;
}
});
frontend.worker.db_worker._LT_get_opfs_pool = (function frontend$worker$db_worker$_LT_get_opfs_pool(graph){
if(cljs.core.truth_(cljs.core.deref(frontend.worker.db_worker._STAR_publishing_QMARK_))){
return null;
} else {
var or__5002__auto__ = frontend.worker.state.get_opfs_pool(graph);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41626__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(cljs.core.deref(frontend.worker.db_worker._STAR_sqlite).installOpfsSAHPoolVfs(({"name": frontend.worker.util.get_pool_name(graph), "initialCapacity": (20)}))),(function (pool){
return promesa.protocols._mcat(promesa.protocols._promise(cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(frontend.worker.db_worker._STAR_opfs_pools,cljs.core.assoc,graph,pool)),(function (___41594__auto__){
return promesa.protocols._promise(pool);
}));
}));
}));
}
}
});
frontend.worker.db_worker.init_sqlite_module_BANG_ = (function frontend$worker$db_worker$init_sqlite_module_BANG_(){
if(cljs.core.truth_(cljs.core.deref(frontend.worker.db_worker._STAR_sqlite))){
return null;
} else {
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41626__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(location.href),(function (href){
return promesa.protocols._mcat(promesa.protocols._promise(clojure.string.includes_QMARK_(href,"electron=true")),(function (electron_QMARK_){
return promesa.protocols._mcat(promesa.protocols._promise(clojure.string.includes_QMARK_(href,"publishing=true")),(function (publishing_QMARK_){
return promesa.protocols._mcat(promesa.protocols._promise(cljs.core.reset_BANG_(frontend.worker.db_worker._STAR_publishing_QMARK_,publishing_QMARK_)),(function (_){
return promesa.protocols._mcat(promesa.protocols._promise([cljs.core.str.cljs$core$IFn$_invoke$arity$1(self.location.protocol),"//",cljs.core.str.cljs$core$IFn$_invoke$arity$1(self.location.host)].join('')),(function (base_url){
return promesa.protocols._mcat(promesa.protocols._promise((cljs.core.truth_(electron_QMARK_)?(new URL("sqlite3.wasm",location.href)):[cljs.core.str.cljs$core$IFn$_invoke$arity$1(base_url),clojure.string.replace(self.location.pathname,"db-worker.js","")].join(''))),(function (sqlite_wasm_url){
return promesa.protocols._mcat(promesa.protocols._promise(module$node_modules$$logseq$sqlite_wasm$index_mjs.default(cljs.core.clj__GT_js(new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"url","url",276297046),sqlite_wasm_url,new cljs.core.Keyword(null,"print","print",1299562414),console.log,new cljs.core.Keyword(null,"printErr","printErr",-1323332006),console.error], null)))),(function (sqlite){
return promesa.protocols._mcat(promesa.protocols._promise(cljs.core.reset_BANG_(frontend.worker.db_worker._STAR_sqlite,sqlite)),(function (___41594__auto__){
return promesa.protocols._promise(null);
}));
}));
}));
}));
}));
}));
}));
}));
}));
}
});
frontend.worker.db_worker.repo_path = "/db.sqlite";
frontend.worker.db_worker._LT_export_db_file = (function frontend$worker$db_worker$_LT_export_db_file(repo){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41626__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.worker.db_worker._LT_get_opfs_pool(repo)),(function (pool){
return promesa.protocols._promise((cljs.core.truth_(pool)?pool.exportFile(frontend.worker.db_worker.repo_path):null));
}));
}));
});
frontend.worker.db_worker._LT_import_db = (function frontend$worker$db_worker$_LT_import_db(pool,data){
return pool.importDb(frontend.worker.db_worker.repo_path,data);
});
frontend.worker.db_worker.get_all_datoms_from_sqlite_db = (function frontend$worker$db_worker$get_all_datoms_from_sqlite_db(db){
var G__187519 = db.exec(({"sql": "select * from kvs", "rowMode": "array"}));
var G__187519__$1 = (((G__187519 == null))?null:cljs_bean.core.__GT_clj(G__187519));
var G__187519__$2 = (((G__187519__$1 == null))?null:cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (p__187520){
var vec__187521 = p__187520;
var _addr = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__187521,(0),null);
var content = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__187521,(1),null);
var _addresses = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__187521,(2),null);
var content_SINGLEQUOTE_ = logseq.db.sqlite.util.transit_read(content);
var datoms = ((cljs.core.map_QMARK_(content_SINGLEQUOTE_))?new cljs.core.Keyword(null,"keys","keys",1068423698).cljs$core$IFn$_invoke$arity$1(content_SINGLEQUOTE_):null);
return datoms;
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([G__187519__$1], 0)));
var G__187519__$3 = (((G__187519__$2 == null))?null:cljs.core.distinct.cljs$core$IFn$_invoke$arity$1(G__187519__$2));
if((G__187519__$3 == null)){
return null;
} else {
return cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p__187524){
var vec__187525 = p__187524;
var e = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__187525,(0),null);
var a = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__187525,(1),null);
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__187525,(2),null);
var t = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__187525,(3),null);
return (datascript.core.datom.cljs$core$IFn$_invoke$arity$4 ? datascript.core.datom.cljs$core$IFn$_invoke$arity$4(e,a,v,t) : datascript.core.datom.call(null,e,a,v,t));
}),G__187519__$3);
}
});
/**
 * Persistent-sorted-set has been broken, used addresses can't be found
 */
frontend.worker.db_worker.rebuild_db_from_datoms_BANG_ = (function frontend$worker$db_worker$rebuild_db_from_datoms_BANG_(datascript_conn,sqlite_db){
var datoms = frontend.worker.db_worker.get_all_datoms_from_sqlite_db(sqlite_db);
var db = datascript.core.init_db.cljs$core$IFn$_invoke$arity$3(cljs.core.PersistentVector.EMPTY,logseq.db.frontend.schema.schema,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"storage","storage",1867247511),datascript.storage.storage(cljs.core.deref(datascript_conn))], null));
var db__$1 = (function (){var G__187528 = db;
var G__187529 = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (d){
return new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","add","db/add",235286841),new cljs.core.Keyword(null,"e","e",1381269198).cljs$core$IFn$_invoke$arity$1(d),new cljs.core.Keyword(null,"a","a",-2123407586).cljs$core$IFn$_invoke$arity$1(d),new cljs.core.Keyword(null,"v","v",21465059).cljs$core$IFn$_invoke$arity$1(d),new cljs.core.Keyword(null,"t","t",-1397832519).cljs$core$IFn$_invoke$arity$1(d)], null);
}),datoms);
return (datascript.core.db_with.cljs$core$IFn$_invoke$arity$2 ? datascript.core.db_with.cljs$core$IFn$_invoke$arity$2(G__187528,G__187529) : datascript.core.db_with.call(null,G__187528,G__187529));
})();
cljs.core.prn.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"debug","debug",-1608172596),new cljs.core.Keyword(null,"rebuild-db-from-datoms","rebuild-db-from-datoms",1305615192),new cljs.core.Keyword(null,"datoms-count","datoms-count",-228436691),cljs.core.count(datoms)], 0));

var G__187530_187745 = new cljs.core.Keyword(null,"notification","notification",-222338233);
var G__187531_187746 = new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["The SQLite db will be exported to avoid any data-loss.",new cljs.core.Keyword(null,"warning","warning",-1685650671),false], null);
(frontend.worker.util.post_message.cljs$core$IFn$_invoke$arity$2 ? frontend.worker.util.post_message.cljs$core$IFn$_invoke$arity$2(G__187530_187745,G__187531_187746) : frontend.worker.util.post_message.call(null,G__187530_187745,G__187531_187746));

var G__187532_187747 = new cljs.core.Keyword(null,"export-current-db","export-current-db",-728527384);
var G__187533_187748 = cljs.core.PersistentVector.EMPTY;
(frontend.worker.util.post_message.cljs$core$IFn$_invoke$arity$2 ? frontend.worker.util.post_message.cljs$core$IFn$_invoke$arity$2(G__187532_187747,G__187533_187748) : frontend.worker.util.post_message.call(null,G__187532_187747,G__187533_187748));

sqlite_db.exec(({"sql": "delete from kvs"}));

(datascript.core.reset_conn_BANG_.cljs$core$IFn$_invoke$arity$2 ? datascript.core.reset_conn_BANG_.cljs$core$IFn$_invoke$arity$2(datascript_conn,db__$1) : datascript.core.reset_conn_BANG_.call(null,datascript_conn,db__$1));

return frontend.worker.db.migrate.fix_db_BANG_(datascript_conn);
});
frontend.worker.db_worker.fix_broken_graph = (function frontend$worker$db_worker$fix_broken_graph(graph){
var conn = frontend.worker.state.get_datascript_conn(graph);
var sqlite_db = frontend.worker.state.get_sqlite_conn.cljs$core$IFn$_invoke$arity$1(graph);
if(cljs.core.truth_((function (){var and__5000__auto__ = conn;
if(cljs.core.truth_(and__5000__auto__)){
return sqlite_db;
} else {
return and__5000__auto__;
}
})())){
frontend.worker.db_worker.rebuild_db_from_datoms_BANG_(conn,sqlite_db);

var G__187534 = new cljs.core.Keyword(null,"notification","notification",-222338233);
var G__187535 = new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["The graph has been successfully rebuilt.",new cljs.core.Keyword(null,"success","success",1890645906),false], null);
return (frontend.worker.util.post_message.cljs$core$IFn$_invoke$arity$2 ? frontend.worker.util.post_message.cljs$core$IFn$_invoke$arity$2(G__187534,G__187535) : frontend.worker.util.post_message.call(null,G__187534,G__187535));
} else {
return null;
}
});
/**
 * Upsert addr+data-seq. Update sqlite-cli/upsert-addr-content! when making changes
 */
frontend.worker.db_worker.upsert_addr_content_BANG_ = (function frontend$worker$db_worker$upsert_addr_content_BANG_(db,data){
if((!((db == null)))){
} else {
throw (new Error(["Assert failed: ","sqlite db not exists","\n","(some? db)"].join('')));
}

return db.transaction((function (tx){
var seq__187536 = cljs.core.seq(data);
var chunk__187537 = null;
var count__187538 = (0);
var i__187539 = (0);
while(true){
if((i__187539 < count__187538)){
var item = chunk__187537.cljs$core$IIndexed$_nth$arity$2(null,i__187539);
tx.exec(({"sql": "INSERT INTO kvs (addr, content, addresses) values ($addr, $content, $addresses) on conflict(addr) do update set content = $content, addresses = $addresses", "bind": item}));


var G__187749 = seq__187536;
var G__187750 = chunk__187537;
var G__187751 = count__187538;
var G__187752 = (i__187539 + (1));
seq__187536 = G__187749;
chunk__187537 = G__187750;
count__187538 = G__187751;
i__187539 = G__187752;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__187536);
if(temp__5804__auto__){
var seq__187536__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__187536__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__187536__$1);
var G__187753 = cljs.core.chunk_rest(seq__187536__$1);
var G__187754 = c__5525__auto__;
var G__187755 = cljs.core.count(c__5525__auto__);
var G__187756 = (0);
seq__187536 = G__187753;
chunk__187537 = G__187754;
count__187538 = G__187755;
i__187539 = G__187756;
continue;
} else {
var item = cljs.core.first(seq__187536__$1);
tx.exec(({"sql": "INSERT INTO kvs (addr, content, addresses) values ($addr, $content, $addresses) on conflict(addr) do update set content = $content, addresses = $addresses", "bind": item}));


var G__187757 = cljs.core.next(seq__187536__$1);
var G__187758 = null;
var G__187759 = (0);
var G__187760 = (0);
seq__187536 = G__187757;
chunk__187537 = G__187758;
count__187538 = G__187759;
i__187539 = G__187760;
continue;
}
} else {
return null;
}
}
break;
}
}));
});
/**
 * Update sqlite-cli/restore-data-from-addr when making changes
 */
frontend.worker.db_worker.restore_data_from_addr = (function frontend$worker$db_worker$restore_data_from_addr(db,addr){
if((!((db == null)))){
} else {
throw (new Error(["Assert failed: ","sqlite db not exists","\n","(some? db)"].join('')));
}

var temp__5804__auto__ = cljs.core.first(db.exec(({"sql": "select content, addresses from kvs where addr = ?", "bind": [addr], "rowMode": "array"})));
if(cljs.core.truth_(temp__5804__auto__)){
var result = temp__5804__auto__;
var vec__187540 = cljs_bean.core.__GT_clj(result);
var content = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__187540,(0),null);
var addresses = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__187540,(1),null);
var addresses__$1 = (cljs.core.truth_(addresses)?JSON.parse(addresses):null);
var data = logseq.db.sqlite.util.transit_read(content);
if(cljs.core.truth_((function (){var and__5000__auto__ = addresses__$1;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.map_QMARK_(data);
} else {
return and__5000__auto__;
}
})())){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(data,new cljs.core.Keyword(null,"addresses","addresses",-559529694),addresses__$1);
} else {
return data;
}
} else {
return null;
}
});

/**
* @constructor
 * @implements {cljs.core.IMeta}
 * @implements {cljs.core.IWithMeta}
 * @implements {datascript.storage.IStorage}
*/
frontend.worker.db_worker.t_frontend$worker$db_worker187543 = (function (db,meta187544){
this.db = db;
this.meta187544 = meta187544;
this.cljs$lang$protocol_mask$partition0$ = 393216;
this.cljs$lang$protocol_mask$partition1$ = 0;
});
(frontend.worker.db_worker.t_frontend$worker$db_worker187543.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = (function (_187545,meta187544__$1){
var self__ = this;
var _187545__$1 = this;
return (new frontend.worker.db_worker.t_frontend$worker$db_worker187543(self__.db,meta187544__$1));
}));

(frontend.worker.db_worker.t_frontend$worker$db_worker187543.prototype.cljs$core$IMeta$_meta$arity$1 = (function (_187545){
var self__ = this;
var _187545__$1 = this;
return self__.meta187544;
}));

(frontend.worker.db_worker.t_frontend$worker$db_worker187543.prototype.datascript$storage$IStorage$ = cljs.core.PROTOCOL_SENTINEL);

(frontend.worker.db_worker.t_frontend$worker$db_worker187543.prototype.datascript$storage$IStorage$_store$arity$3 = (function (_,addr_PLUS_data_seq,_delete_addrs){
var self__ = this;
var ___$1 = this;
var data = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p__187546){
var vec__187547 = p__187546;
var addr = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__187547,(0),null);
var data = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__187547,(1),null);
var data_SINGLEQUOTE_ = ((cljs.core.map_QMARK_(data))?cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(data,new cljs.core.Keyword(null,"addresses","addresses",-559529694)):data);
var addresses = ((cljs.core.map_QMARK_(data))?(function (){var temp__5804__auto__ = new cljs.core.Keyword(null,"addresses","addresses",-559529694).cljs$core$IFn$_invoke$arity$1(data);
if(cljs.core.truth_(temp__5804__auto__)){
var addresses = temp__5804__auto__;
return JSON.stringify(cljs_bean.core.__GT_js(addresses));
} else {
return null;
}
})():null);
return ({"$addr": addr, "$content": logseq.db.sqlite.util.transit_write(data_SINGLEQUOTE_), "$addresses": addresses});
}),addr_PLUS_data_seq);
return frontend.worker.db_worker.upsert_addr_content_BANG_(self__.db,data);
}));

(frontend.worker.db_worker.t_frontend$worker$db_worker187543.prototype.datascript$storage$IStorage$_restore$arity$2 = (function (_,addr){
var self__ = this;
var ___$1 = this;
return frontend.worker.db_worker.restore_data_from_addr(self__.db,addr);
}));

(frontend.worker.db_worker.t_frontend$worker$db_worker187543.getBasis = (function (){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.with_meta(new cljs.core.Symbol(null,"db","db",-1661185010,null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),new cljs.core.Symbol(null,"Object","Object",61210754,null)], null)),new cljs.core.Symbol(null,"meta187544","meta187544",-1007807703,null)], null);
}));

(frontend.worker.db_worker.t_frontend$worker$db_worker187543.cljs$lang$type = true);

(frontend.worker.db_worker.t_frontend$worker$db_worker187543.cljs$lang$ctorStr = "frontend.worker.db-worker/t_frontend$worker$db_worker187543");

(frontend.worker.db_worker.t_frontend$worker$db_worker187543.cljs$lang$ctorPrWriter = (function (this__5287__auto__,writer__5288__auto__,opt__5289__auto__){
return cljs.core._write(writer__5288__auto__,"frontend.worker.db-worker/t_frontend$worker$db_worker187543");
}));

/**
 * Positional factory function for frontend.worker.db-worker/t_frontend$worker$db_worker187543.
 */
frontend.worker.db_worker.__GT_t_frontend$worker$db_worker187543 = (function frontend$worker$db_worker$__GT_t_frontend$worker$db_worker187543(db,meta187544){
return (new frontend.worker.db_worker.t_frontend$worker$db_worker187543(db,meta187544));
});


/**
 * Update sqlite-cli/new-sqlite-storage when making changes
 */
frontend.worker.db_worker.new_sqlite_storage = (function frontend$worker$db_worker$new_sqlite_storage(db){
return (new frontend.worker.db_worker.t_frontend$worker$db_worker187543(db,cljs.core.PersistentArrayMap.EMPTY));
});
frontend.worker.db_worker.close_db_aux_BANG_ = (function frontend$worker$db_worker$close_db_aux_BANG_(repo,db,search,client_ops){
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$3(frontend.worker.db_worker._STAR_sqlite_conns,cljs.core.dissoc,repo);

cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$3(frontend.worker.db_worker._STAR_datascript_conns,cljs.core.dissoc,repo);

cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$3(frontend.worker.db_worker._STAR_client_ops_conns,cljs.core.dissoc,repo);

if(cljs.core.truth_(db)){
db.close();
} else {
}

if(cljs.core.truth_(search)){
search.close();
} else {
}

if(cljs.core.truth_(client_ops)){
client_ops.close();
} else {
}

var temp__5804__auto___187761 = frontend.worker.state.get_opfs_pool(repo);
if(cljs.core.truth_(temp__5804__auto___187761)){
var pool_187762 = temp__5804__auto___187761;
pool_187762.releaseAccessHandles();
} else {
}

return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$3(frontend.worker.db_worker._STAR_opfs_pools,cljs.core.dissoc,repo);
});
frontend.worker.db_worker.close_other_dbs_BANG_ = (function frontend$worker$db_worker$close_other_dbs_BANG_(repo){
var seq__187550 = cljs.core.seq(cljs.core.deref(frontend.worker.db_worker._STAR_sqlite_conns));
var chunk__187551 = null;
var count__187552 = (0);
var i__187553 = (0);
while(true){
if((i__187553 < count__187552)){
var vec__187562 = chunk__187551.cljs$core$IIndexed$_nth$arity$2(null,i__187553);
var r = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__187562,(0),null);
var map__187565 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__187562,(1),null);
var map__187565__$1 = cljs.core.__destructure_map(map__187565);
var db = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__187565__$1,new cljs.core.Keyword(null,"db","db",993250759));
var search = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__187565__$1,new cljs.core.Keyword(null,"search","search",1564939822));
var client_ops = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__187565__$1,new cljs.core.Keyword(null,"client-ops","client-ops",-1058023795));
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(repo,r)){
} else {
frontend.worker.db_worker.close_db_aux_BANG_(r,db,search,client_ops);
}


var G__187763 = seq__187550;
var G__187764 = chunk__187551;
var G__187765 = count__187552;
var G__187766 = (i__187553 + (1));
seq__187550 = G__187763;
chunk__187551 = G__187764;
count__187552 = G__187765;
i__187553 = G__187766;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__187550);
if(temp__5804__auto__){
var seq__187550__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__187550__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__187550__$1);
var G__187767 = cljs.core.chunk_rest(seq__187550__$1);
var G__187768 = c__5525__auto__;
var G__187769 = cljs.core.count(c__5525__auto__);
var G__187770 = (0);
seq__187550 = G__187767;
chunk__187551 = G__187768;
count__187552 = G__187769;
i__187553 = G__187770;
continue;
} else {
var vec__187566 = cljs.core.first(seq__187550__$1);
var r = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__187566,(0),null);
var map__187569 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__187566,(1),null);
var map__187569__$1 = cljs.core.__destructure_map(map__187569);
var db = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__187569__$1,new cljs.core.Keyword(null,"db","db",993250759));
var search = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__187569__$1,new cljs.core.Keyword(null,"search","search",1564939822));
var client_ops = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__187569__$1,new cljs.core.Keyword(null,"client-ops","client-ops",-1058023795));
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(repo,r)){
} else {
frontend.worker.db_worker.close_db_aux_BANG_(r,db,search,client_ops);
}


var G__187771 = cljs.core.next(seq__187550__$1);
var G__187772 = null;
var G__187773 = (0);
var G__187774 = (0);
seq__187550 = G__187771;
chunk__187551 = G__187772;
count__187552 = G__187773;
i__187553 = G__187774;
continue;
}
} else {
return null;
}
}
break;
}
});
frontend.worker.db_worker.close_db_BANG_ = (function frontend$worker$db_worker$close_db_BANG_(repo){
var map__187570 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(frontend.worker.db_worker._STAR_sqlite_conns),repo);
var map__187570__$1 = cljs.core.__destructure_map(map__187570);
var db = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__187570__$1,new cljs.core.Keyword(null,"db","db",993250759));
var search = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__187570__$1,new cljs.core.Keyword(null,"search","search",1564939822));
var client_ops = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__187570__$1,new cljs.core.Keyword(null,"client-ops","client-ops",-1058023795));
return frontend.worker.db_worker.close_db_aux_BANG_(repo,db,search,client_ops);
});
frontend.worker.db_worker.reset_db_BANG_ = (function frontend$worker$db_worker$reset_db_BANG_(repo,db_transit_str){
var temp__5804__auto__ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(frontend.worker.db_worker._STAR_datascript_conns),repo);
if(cljs.core.truth_(temp__5804__auto__)){
var conn = temp__5804__auto__;
var new_db = logseq.db.read_transit_str(db_transit_str);
var new_db_SINGLEQUOTE_ = cljs.core.update.cljs$core$IFn$_invoke$arity$3(new_db,new cljs.core.Keyword(null,"eavt","eavt",-666437073),(function (s){
(s.storage = new cljs.core.Keyword(null,"eavt","eavt",-666437073).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(conn)).storage);

return s;
}));
var G__187571_187775 = conn;
var G__187572_187776 = new_db_SINGLEQUOTE_;
var G__187573_187777 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"reset-conn!","reset-conn!",-325354379),true], null);
(datascript.core.reset_conn_BANG_.cljs$core$IFn$_invoke$arity$3 ? datascript.core.reset_conn_BANG_.cljs$core$IFn$_invoke$arity$3(G__187571_187775,G__187572_187776,G__187573_187777) : datascript.core.reset_conn_BANG_.call(null,G__187571_187775,G__187572_187776,G__187573_187777));

var G__187574 = conn;
var G__187575 = new cljs.core.Keyword(null,"schema","schema",-1582001791).cljs$core$IFn$_invoke$arity$1(new_db);
return (datascript.core.reset_schema_BANG_.cljs$core$IFn$_invoke$arity$2 ? datascript.core.reset_schema_BANG_.cljs$core$IFn$_invoke$arity$2(G__187574,G__187575) : datascript.core.reset_schema_BANG_.call(null,G__187574,G__187575));
} else {
return null;
}
});
frontend.worker.db_worker.get_dbs = (function frontend$worker$db_worker$get_dbs(repo){
if(cljs.core.truth_(cljs.core.deref(frontend.worker.db_worker._STAR_publishing_QMARK_))){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41626__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(cljs.core.deref(frontend.worker.db_worker._STAR_sqlite).oo1.DB),(function (DB){
return promesa.protocols._mcat(promesa.protocols._promise((new DB("/db.sqlite","c"))),(function (db){
return promesa.protocols._mcat(promesa.protocols._promise((new DB("/search-db.sqlite","c"))),(function (search_db){
return promesa.protocols._promise(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [db,search_db], null));
}));
}));
}));
}));
} else {
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41626__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.worker.db_worker._LT_get_opfs_pool(repo)),(function (pool){
return promesa.protocols._mcat(promesa.protocols._promise(pool.getCapacity()),(function (capacity){
return promesa.protocols._mcat(promesa.protocols._promise((((capacity === (0)))?pool.acquireAccessHandles():null)),(function (_){
return promesa.protocols._mcat(promesa.protocols._promise((new pool.OpfsSAHPoolDb(frontend.worker.db_worker.repo_path))),(function (db){
return promesa.protocols._mcat(promesa.protocols._promise((new pool.OpfsSAHPoolDb(["search",frontend.worker.db_worker.repo_path].join('')))),(function (search_db){
return promesa.protocols._mcat(promesa.protocols._promise((new pool.OpfsSAHPoolDb(["client-ops-",frontend.worker.db_worker.repo_path].join('')))),(function (client_ops_db){
return promesa.protocols._promise(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [db,search_db,client_ops_db], null));
}));
}));
}));
}));
}));
}));
}));
}
});
frontend.worker.db_worker.enable_sqlite_wal_mode_BANG_ = (function frontend$worker$db_worker$enable_sqlite_wal_mode_BANG_(db){
db.exec("PRAGMA locking_mode=exclusive");

return db.exec("PRAGMA journal_mode=WAL");
});
/**
 * Gc main db weekly and rtc ops db each time when opening it
 */
frontend.worker.db_worker.gc_sqlite_dbs_BANG_ = (function frontend$worker$db_worker$gc_sqlite_dbs_BANG_(sqlite_db,client_ops_db,datascript_conn,p__187576){
var map__187577 = p__187576;
var map__187577__$1 = cljs.core.__destructure_map(map__187577);
var full_gc_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__187577__$1,new cljs.core.Keyword(null,"full-gc?","full-gc?",150271731));
var last_gc_at = new cljs.core.Keyword("kv","value","kv/value",305981670).cljs$core$IFn$_invoke$arity$1((function (){var G__187578 = cljs.core.deref(datascript_conn);
var G__187579 = new cljs.core.Keyword("logseq.kv","graph-last-gc-at","logseq.kv/graph-last-gc-at",13146990);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__187578,G__187579) : datascript.core.entity.call(null,G__187578,G__187579));
})());
if(cljs.core.truth_((function (){var or__5002__auto__ = full_gc_QMARK_;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return (((last_gc_at == null)) || ((((!(typeof last_gc_at === 'number'))) || (((logseq.common.util.time_ms() - last_gc_at) > ((((3) * (24)) * (3600)) * (1000)))))));
}
})())){
cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"debug","debug",-1608172596),"gc current graph"], 0));

var seq__187580_187778 = cljs.core.seq(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [sqlite_db,client_ops_db], null));
var chunk__187581_187779 = null;
var count__187582_187780 = (0);
var i__187583_187781 = (0);
while(true){
if((i__187583_187781 < count__187582_187780)){
var db_187782 = chunk__187581_187779.cljs$core$IIndexed$_nth$arity$2(null,i__187583_187781);
logseq.db.sqlite.gc.gc_kvs_table_BANG_(db_187782,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"full-gc?","full-gc?",150271731),full_gc_QMARK_], null));


var G__187783 = seq__187580_187778;
var G__187784 = chunk__187581_187779;
var G__187785 = count__187582_187780;
var G__187786 = (i__187583_187781 + (1));
seq__187580_187778 = G__187783;
chunk__187581_187779 = G__187784;
count__187582_187780 = G__187785;
i__187583_187781 = G__187786;
continue;
} else {
var temp__5804__auto___187787 = cljs.core.seq(seq__187580_187778);
if(temp__5804__auto___187787){
var seq__187580_187788__$1 = temp__5804__auto___187787;
if(cljs.core.chunked_seq_QMARK_(seq__187580_187788__$1)){
var c__5525__auto___187789 = cljs.core.chunk_first(seq__187580_187788__$1);
var G__187790 = cljs.core.chunk_rest(seq__187580_187788__$1);
var G__187791 = c__5525__auto___187789;
var G__187792 = cljs.core.count(c__5525__auto___187789);
var G__187793 = (0);
seq__187580_187778 = G__187790;
chunk__187581_187779 = G__187791;
count__187582_187780 = G__187792;
i__187583_187781 = G__187793;
continue;
} else {
var db_187794 = cljs.core.first(seq__187580_187788__$1);
logseq.db.sqlite.gc.gc_kvs_table_BANG_(db_187794,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"full-gc?","full-gc?",150271731),full_gc_QMARK_], null));


var G__187795 = cljs.core.next(seq__187580_187788__$1);
var G__187796 = null;
var G__187797 = (0);
var G__187798 = (0);
seq__187580_187778 = G__187795;
chunk__187581_187779 = G__187796;
count__187582_187780 = G__187797;
i__187583_187781 = G__187798;
continue;
}
} else {
}
}
break;
}

var G__187584 = datascript_conn;
var G__187585 = new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("db","ident","db/ident",-737096),new cljs.core.Keyword("logseq.kv","graph-last-gc-at","logseq.kv/graph-last-gc-at",13146990),new cljs.core.Keyword("kv","value","kv/value",305981670),logseq.common.util.time_ms()], null)], null);
return (datascript.core.transact_BANG_.cljs$core$IFn$_invoke$arity$2 ? datascript.core.transact_BANG_.cljs$core$IFn$_invoke$arity$2(G__187584,G__187585) : datascript.core.transact_BANG_.call(null,G__187584,G__187585));
} else {
return null;
}
});
frontend.worker.db_worker.create_or_open_db_BANG_ = (function frontend$worker$db_worker$create_or_open_db_BANG_(repo,p__187586){
var map__187587 = p__187586;
var map__187587__$1 = cljs.core.__destructure_map(map__187587);
var opts = map__187587__$1;
var config = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__187587__$1,new cljs.core.Keyword(null,"config","config",994861415));
var import_type = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__187587__$1,new cljs.core.Keyword(null,"import-type","import-type",-499283032));
var datoms = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__187587__$1,new cljs.core.Keyword(null,"datoms","datoms",-290874434));
if(cljs.core.truth_(frontend.worker.state.get_sqlite_conn.cljs$core$IFn$_invoke$arity$1(repo))){
return null;
} else {
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41626__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.worker.db_worker.get_dbs(repo)),(function (p__187588){
var vec__187589 = p__187588;
var db = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__187589,(0),null);
var search_db = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__187589,(1),null);
var client_ops_db = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__187589,(2),null);
var dbs = vec__187589;
return promesa.protocols._mcat(promesa.protocols._promise(frontend.worker.db_worker.new_sqlite_storage(db)),(function (storage){
return promesa.protocols._mcat(promesa.protocols._promise((cljs.core.truth_(cljs.core.deref(frontend.worker.db_worker._STAR_publishing_QMARK_))?null:frontend.worker.db_worker.new_sqlite_storage(client_ops_db))),(function (client_ops_storage){
return promesa.protocols._mcat(promesa.protocols._promise(logseq.db.sqlite.util.db_based_graph_QMARK_(repo)),(function (db_based_QMARK_){
return promesa.protocols._mcat(promesa.protocols._promise(cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(frontend.worker.db_worker._STAR_sqlite_conns,cljs.core.assoc,repo,new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"db","db",993250759),db,new cljs.core.Keyword(null,"search","search",1564939822),search_db,new cljs.core.Keyword(null,"client-ops","client-ops",-1058023795),client_ops_db], null))),(function (___41594__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((function (){var seq__187592 = cljs.core.seq(dbs);
var chunk__187593 = null;
var count__187594 = (0);
var i__187595 = (0);
while(true){
if((i__187595 < count__187594)){
var db_SINGLEQUOTE_ = chunk__187593.cljs$core$IIndexed$_nth$arity$2(null,i__187595);
frontend.worker.db_worker.enable_sqlite_wal_mode_BANG_(db_SINGLEQUOTE_);


var G__187799 = seq__187592;
var G__187800 = chunk__187593;
var G__187801 = count__187594;
var G__187802 = (i__187595 + (1));
seq__187592 = G__187799;
chunk__187593 = G__187800;
count__187594 = G__187801;
i__187595 = G__187802;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__187592);
if(temp__5804__auto__){
var seq__187592__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__187592__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__187592__$1);
var G__187803 = cljs.core.chunk_rest(seq__187592__$1);
var G__187804 = c__5525__auto__;
var G__187805 = cljs.core.count(c__5525__auto__);
var G__187806 = (0);
seq__187592 = G__187803;
chunk__187593 = G__187804;
count__187594 = G__187805;
i__187595 = G__187806;
continue;
} else {
var db_SINGLEQUOTE_ = cljs.core.first(seq__187592__$1);
frontend.worker.db_worker.enable_sqlite_wal_mode_BANG_(db_SINGLEQUOTE_);


var G__187807 = cljs.core.next(seq__187592__$1);
var G__187808 = null;
var G__187809 = (0);
var G__187810 = (0);
seq__187592 = G__187807;
chunk__187593 = G__187808;
count__187594 = G__187809;
i__187595 = G__187810;
continue;
}
} else {
return null;
}
}
break;
}
})()),(function (___41594__auto____$1){
return promesa.protocols._mcat(promesa.protocols._promise(logseq.db.common.sqlite.create_kvs_table_BANG_(db)),(function (___41594__auto____$2){
return promesa.protocols._mcat(promesa.protocols._promise((cljs.core.truth_(cljs.core.deref(frontend.worker.db_worker._STAR_publishing_QMARK_))?null:logseq.db.common.sqlite.create_kvs_table_BANG_(client_ops_db))),(function (___41594__auto____$3){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.worker.db.migrate.migrate_sqlite_db(db)),(function (___41594__auto____$4){
return promesa.protocols._mcat(promesa.protocols._promise((cljs.core.truth_(cljs.core.deref(frontend.worker.db_worker._STAR_publishing_QMARK_))?null:frontend.worker.db.migrate.migrate_sqlite_db(client_ops_db))),(function (___41594__auto____$5){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.worker.search.create_tables_and_triggers_BANG_(search_db)),(function (___41594__auto____$6){
return promesa.protocols._promise((function (){var schema = logseq.db.get_schema(repo);
var conn = logseq.db.common.sqlite.get_storage_conn(storage,schema);
var _ = frontend.worker.db.fix.check_and_fix_schema_BANG_(repo,conn);
var ___$1 = (cljs.core.truth_(datoms)?(function (){var data = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (datom){
return new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","add","db/add",235286841),new cljs.core.Keyword(null,"e","e",1381269198).cljs$core$IFn$_invoke$arity$1(datom),new cljs.core.Keyword(null,"a","a",-2123407586).cljs$core$IFn$_invoke$arity$1(datom),new cljs.core.Keyword(null,"v","v",21465059).cljs$core$IFn$_invoke$arity$1(datom)], null);
}),datoms);
var G__187596 = conn;
var G__187597 = data;
var G__187598 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"initial-db?","initial-db?",-930665302),true], null);
return (datascript.core.transact_BANG_.cljs$core$IFn$_invoke$arity$3 ? datascript.core.transact_BANG_.cljs$core$IFn$_invoke$arity$3(G__187596,G__187597,G__187598) : datascript.core.transact_BANG_.call(null,G__187596,G__187597,G__187598));
})():null);
var client_ops_conn = (cljs.core.truth_(cljs.core.deref(frontend.worker.db_worker._STAR_publishing_QMARK_))?null:logseq.db.common.sqlite.get_storage_conn(client_ops_storage,frontend.worker.rtc.client_op.schema_in_db));
var initial_data_exists_QMARK_ = (((datoms == null))?(function (){var and__5000__auto__ = (function (){var G__187599 = cljs.core.deref(conn);
var G__187600 = new cljs.core.Keyword("logseq.class","Root","logseq.class/Root",273783827);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__187599,G__187600) : datascript.core.entity.call(null,G__187599,G__187600));
})();
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("db",new cljs.core.Keyword("kv","value","kv/value",305981670).cljs$core$IFn$_invoke$arity$1((function (){var G__187601 = cljs.core.deref(conn);
var G__187602 = new cljs.core.Keyword("logseq.kv","db-type","logseq.kv/db-type",1106888767);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__187601,G__187602) : datascript.core.entity.call(null,G__187601,G__187602));
})()));
} else {
return and__5000__auto__;
}
})():null);
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(frontend.worker.db_worker._STAR_datascript_conns,cljs.core.assoc,repo,conn);

cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(frontend.worker.db_worker._STAR_client_ops_conns,cljs.core.assoc,repo,client_ops_conn);

if(((cljs.core.not(cljs.core.deref(frontend.worker.db_worker._STAR_publishing_QMARK_))) && (cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(frontend.worker.rtc.client_op.schema_in_db,(function (){var G__187603 = cljs.core.deref(client_ops_conn);
return (datascript.core.schema.cljs$core$IFn$_invoke$arity$1 ? datascript.core.schema.cljs$core$IFn$_invoke$arity$1(G__187603) : datascript.core.schema.call(null,G__187603));
})())))){
(datascript.core.reset_schema_BANG_.cljs$core$IFn$_invoke$arity$2 ? datascript.core.reset_schema_BANG_.cljs$core$IFn$_invoke$arity$2(client_ops_conn,frontend.worker.rtc.client_op.schema_in_db) : datascript.core.reset_schema_BANG_.call(null,client_ops_conn,frontend.worker.rtc.client_op.schema_in_db));
} else {
}

if(cljs.core.truth_((function (){var and__5000__auto__ = db_based_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return ((cljs.core.not(initial_data_exists_QMARK_)) && (cljs.core.not(datoms)));
} else {
return and__5000__auto__;
}
})())){
var config_187811__$1 = (function (){var or__5002__auto__ = config;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return "";
}
})();
var initial_data_187812 = logseq.db.sqlite.create_graph.build_db_initial_data.cljs$core$IFn$_invoke$arity$variadic(config_187811__$1,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.select_keys(opts,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"import-type","import-type",-499283032),new cljs.core.Keyword(null,"graph-git-sha","graph-git-sha",-266655130)], null))], 0));
var G__187604_187813 = conn;
var G__187605_187814 = initial_data_187812;
var G__187606_187815 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"initial-db?","initial-db?",-930665302),true], null);
(datascript.core.transact_BANG_.cljs$core$IFn$_invoke$arity$3 ? datascript.core.transact_BANG_.cljs$core$IFn$_invoke$arity$3(G__187604_187813,G__187605_187814,G__187606_187815) : datascript.core.transact_BANG_.call(null,G__187604_187813,G__187605_187814,G__187606_187815));
} else {
}

frontend.worker.db_worker.gc_sqlite_dbs_BANG_(db,client_ops_db,conn,cljs.core.PersistentArrayMap.EMPTY);

if(cljs.core.truth_(import_type)){
} else {
var temp__5804__auto___187816 = cljs.core.seq(logseq.db.sqlite.debug.find_missing_addresses(db));
if(temp__5804__auto___187816){
var missing_addresses_187817 = temp__5804__auto___187816;
var version_in_db_187818 = (cljs.core.truth_(conn)?logseq.db.frontend.schema.parse_schema_version((function (){var or__5002__auto__ = new cljs.core.Keyword("kv","value","kv/value",305981670).cljs$core$IFn$_invoke$arity$1((function (){var G__187607 = cljs.core.deref(conn);
var G__187608 = new cljs.core.Keyword("logseq.kv","schema-version","logseq.kv/schema-version",-1467606676);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__187607,G__187608) : datascript.core.entity.call(null,G__187607,G__187608));
})());
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return (0);
}
})()):null);
var compare_result_187819 = (cljs.core.truth_(version_in_db_187818)?logseq.db.frontend.schema.compare_schema_version(version_in_db_187818,"64.8"):null);
if(cljs.core.truth_((function (){var and__5000__auto__ = compare_result_187819;
if(cljs.core.truth_(and__5000__auto__)){
return (!((compare_result_187819 < (0))));
} else {
return and__5000__auto__;
}
})())){
var G__187609_187820 = new cljs.core.Keyword(null,"capture-error","capture-error",583122432);
var G__187610_187821 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"error","error",-978969032),"db-missing-addresses-v2",new cljs.core.Keyword(null,"payload","payload",-383036092),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"missing-addresses","missing-addresses",945342471),cljs.core.str.cljs$core$IFn$_invoke$arity$1(missing_addresses_187817),new cljs.core.Keyword(null,"db-schema-version","db-schema-version",-1168427088),cljs.core.str.cljs$core$IFn$_invoke$arity$1(version_in_db_187818)], null)], null);
(frontend.worker.util.post_message.cljs$core$IFn$_invoke$arity$2 ? frontend.worker.util.post_message.cljs$core$IFn$_invoke$arity$2(G__187609_187820,G__187610_187821) : frontend.worker.util.post_message.call(null,G__187609_187820,G__187610_187821));
} else {
}

var G__187611_187822 = new cljs.core.Keyword(null,"notification","notification",-222338233);
var G__187612_187823 = new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["It seems that the DB has been broken. Please run the command `Fix current broken graph`.",new cljs.core.Keyword(null,"error","error",-978969032),false], null);
(frontend.worker.util.post_message.cljs$core$IFn$_invoke$arity$2 ? frontend.worker.util.post_message.cljs$core$IFn$_invoke$arity$2(G__187611_187822,G__187612_187823) : frontend.worker.util.post_message.call(null,G__187611_187822,G__187612_187823));

throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2("DB missing addresses",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"missing-addresses","missing-addresses",945342471),missing_addresses_187817], null));
} else {
}
}

frontend.worker.db.migrate.migrate(conn,search_db);

return frontend.worker.db_listener.listen_db_changes_BANG_(repo,cljs.core.get.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(frontend.worker.db_worker._STAR_datascript_conns),repo));
})());
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
}
});
frontend.worker.db_worker.iter__GT_vec = (function frontend$worker$db_worker$iter__GT_vec(iter_SINGLEQUOTE_){
if(cljs.core.truth_(iter_SINGLEQUOTE_)){
return promesa.core.create.cljs$core$IFn$_invoke$arity$1((function (resolve_fn_187617,reject_fn_187616){
var loop_fn_187613 = (function frontend$worker$db_worker$iter__GT_vec_$_loop_fn_187613(acc){
return promesa.core.fnly.cljs$core$IFn$_invoke$arity$2((function (res_187614,err_187615){
if((!((err_187615 == null)))){
return (reject_fn_187616.cljs$core$IFn$_invoke$arity$1 ? reject_fn_187616.cljs$core$IFn$_invoke$arity$1(err_187615) : reject_fn_187616.call(null,err_187615));
} else {
if(promesa.core.recur_QMARK_(res_187614)){
promesa.exec.run_BANG_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"vthread","vthread",441141075),promesa.exec.wrap_bindings((function (){
return cljs.core.apply.cljs$core$IFn$_invoke$arity$2(frontend$worker$db_worker$iter__GT_vec_$_loop_fn_187613,new cljs.core.Keyword(null,"bindings","bindings",1271397192).cljs$core$IFn$_invoke$arity$1(res_187614));
})));

return null;
} else {
return (resolve_fn_187617.cljs$core$IFn$_invoke$arity$1 ? resolve_fn_187617.cljs$core$IFn$_invoke$arity$1(res_187614) : resolve_fn_187617.call(null,res_187614));
}
}
}),promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41626__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(acc),(function (acc__$1){
return promesa.protocols._promise(promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41626__auto____$1){
return promesa.protocols._mcat(promesa.protocols._promise(iter_SINGLEQUOTE_.next()),(function (elem){
return promesa.protocols._promise((cljs.core.truth_(elem.done)?acc__$1:promesa.core.__GT_Recur(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.conj.cljs$core$IFn$_invoke$arity$2(acc__$1,elem.value)], null))));
}));
})));
}));
})));
});
return promesa.exec.run_BANG_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"vthread","vthread",441141075),promesa.exec.wrap_bindings((function (){
return loop_fn_187613(cljs.core.PersistentVector.EMPTY);
})));
}));
} else {
return null;
}
});
frontend.worker.db_worker._LT_list_all_dbs = (function frontend$worker$db_worker$_LT_list_all_dbs(){
var dir_QMARK_ = (function (p1__187619_SHARP_){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(p1__187619_SHARP_.kind,"directory");
});
var db_dir_prefix = ".logseq-pool-";
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41626__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(navigator.storage.getDirectory()),(function (root){
return promesa.protocols._mcat(promesa.protocols._promise(((dir_QMARK_(root))?root.values():null)),(function (values_iter){
return promesa.protocols._mcat(promesa.protocols._promise((cljs.core.truth_(values_iter)?frontend.worker.db_worker.iter__GT_vec(values_iter):null)),(function (values){
return promesa.protocols._mcat(promesa.protocols._promise(cljs.core.filter.cljs$core$IFn$_invoke$arity$2(dir_QMARK_,values)),(function (current_dir_dirs){
return promesa.protocols._mcat(promesa.protocols._promise(cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (file){
return clojure.string.starts_with_QMARK_(file.name,db_dir_prefix);
}),current_dir_dirs)),(function (db_dirs){
return promesa.protocols._mcat(promesa.protocols._promise(cljs.core.prn.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"debug","debug",-1608172596),new cljs.core.Keyword(null,"db-dirs","db-dirs",2052953020),cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__187620_SHARP_){
return p1__187620_SHARP_.name;
}),db_dirs),new cljs.core.Keyword(null,"all-dirs","all-dirs",2002652916),cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__187621_SHARP_){
return p1__187621_SHARP_.name;
}),current_dir_dirs)], 0))),(function (___41594__auto__){
return promesa.protocols._promise(promesa.core.all(cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (dir){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41626__auto____$1){
return promesa.protocols._mcat(promesa.protocols._promise(clojure.string.replace(clojure.string.replace(clojure.string.replace_first(dir.name,".logseq-pool-",""),"+3A+",":"),"++","/")),(function (graph_name){
return promesa.protocols._mcat(promesa.protocols._promise([logseq.db.sqlite.util.db_version_prefix,cljs.core.str.cljs$core$IFn$_invoke$arity$1(graph_name)].join('')),(function (repo){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.worker.db_metadata._LT_get(repo)),(function (metadata){
return promesa.protocols._promise(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"name","name",1843675177),graph_name,new cljs.core.Keyword(null,"metadata","metadata",1799301597),clojure.edn.read_string.cljs$core$IFn$_invoke$arity$1(metadata)], null));
}));
}));
}));
}));
}),db_dirs)));
}));
}));
}));
}));
}));
}));
}));
});
frontend.common.thread_api._STAR_thread_apis.cljs$core$IVolatile$_vreset_BANG_$arity$2(null,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(frontend.common.thread_api._STAR_thread_apis.cljs$core$IDeref$_deref$arity$1(null),new cljs.core.Keyword("thread-api","list-db","thread-api/list-db",-1703253943),(function frontend$worker$db_worker$thread_api__list_db(){
return frontend.worker.db_worker._LT_list_all_dbs();
})));
frontend.worker.db_worker._LT_db_exists_QMARK_ = (function frontend$worker$db_worker$_LT_db_exists_QMARK_(graph){
return promesa.core.catch$.cljs$core$IFn$_invoke$arity$2(promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41626__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(navigator.storage.getDirectory()),(function (root){
return promesa.protocols._mcat(promesa.protocols._promise(root.getDirectoryHandle([".",frontend.worker.util.get_pool_name(graph)].join(''))),(function (_dir_handle){
return promesa.protocols._promise(true);
}));
}));
})),(function (_e){
return false;
}));
});
frontend.worker.db_worker.remove_vfs_BANG_ = (function frontend$worker$db_worker$remove_vfs_BANG_(pool){
if(cljs.core.truth_(pool)){
return pool.removeVfs();
} else {
return null;
}
});
frontend.worker.db_worker.get_search_db = (function frontend$worker$db_worker$get_search_db(repo){
return frontend.worker.state.get_sqlite_conn.cljs$core$IFn$_invoke$arity$2(repo,new cljs.core.Keyword(null,"search","search",1564939822));
});
frontend.common.thread_api._STAR_thread_apis.cljs$core$IVolatile$_vreset_BANG_$arity$2(null,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(frontend.common.thread_api._STAR_thread_apis.cljs$core$IDeref$_deref$arity$1(null),new cljs.core.Keyword("thread-api","init","thread-api/init",-589216819),(function frontend$worker$db_worker$thread_api__init(rtc_ws_url){
cljs.core.reset_BANG_(frontend.worker.state._STAR_rtc_ws_url,rtc_ws_url);

return frontend.worker.db_worker.init_sqlite_module_BANG_();
})));
if((typeof frontend !== 'undefined') && (typeof frontend.worker !== 'undefined') && (typeof frontend.worker.db_worker !== 'undefined') && (typeof frontend.worker.db_worker._STAR_service !== 'undefined')){
} else {
frontend.worker.db_worker._STAR_service = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentVector.EMPTY);
}
if((typeof frontend !== 'undefined') && (typeof frontend.worker !== 'undefined') && (typeof frontend.worker.db_worker !== 'undefined') && (typeof frontend.worker.db_worker.fns !== 'undefined')){
} else {
frontend.worker.db_worker.fns = new cljs.core.PersistentArrayMap(null, 1, ["remoteInvoke",frontend.common.thread_api.remote_function], null);
}
frontend.worker.db_worker.start_db_BANG_ = (function frontend$worker$db_worker$start_db_BANG_(repo,p__187622){
var map__187623 = p__187622;
var map__187623__$1 = cljs.core.__destructure_map(map__187623);
var opts = map__187623__$1;
var close_other_db_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__187623__$1,new cljs.core.Keyword(null,"close-other-db?","close-other-db?",-1978674579),true);
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41604__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((cljs.core.truth_(close_other_db_QMARK_)?frontend.worker.db_worker.close_other_dbs_BANG_(repo):null)),(function (___41594__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((cljs.core.truth_(cljs.core.deref(frontend.worker.shared_service._STAR_master_client_QMARK_))?frontend.worker.db_worker.create_or_open_db_BANG_(repo,cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(opts,new cljs.core.Keyword(null,"close-other-db?","close-other-db?",-1978674579))):null)),(function (___41594__auto____$1){
return promesa.protocols._promise(null);
}));
}));
}));
});
frontend.common.thread_api._STAR_thread_apis.cljs$core$IVolatile$_vreset_BANG_$arity$2(null,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(frontend.common.thread_api._STAR_thread_apis.cljs$core$IDeref$_deref$arity$1(null),new cljs.core.Keyword("thread-api","create-or-open-db","thread-api/create-or-open-db",1100871183),(function frontend$worker$db_worker$thread_api__create_or_open_db(repo,opts){
return frontend.worker.db_worker.start_db_BANG_(repo,opts);
})));
frontend.common.thread_api._STAR_thread_apis.cljs$core$IVolatile$_vreset_BANG_$arity$2(null,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(frontend.common.thread_api._STAR_thread_apis.cljs$core$IDeref$_deref$arity$1(null),new cljs.core.Keyword("thread-api","q","thread-api/q",-245089616),(function frontend$worker$db_worker$thread_api__q(repo,inputs){
var temp__5804__auto__ = frontend.worker.state.get_datascript_conn(repo);
if(cljs.core.truth_(temp__5804__auto__)){
var conn = temp__5804__auto__;
return cljs.core.apply.cljs$core$IFn$_invoke$arity$4(datascript.core.q,cljs.core.first(inputs),cljs.core.deref(conn),cljs.core.rest(inputs));
} else {
return null;
}
})));
frontend.common.thread_api._STAR_thread_apis.cljs$core$IVolatile$_vreset_BANG_$arity$2(null,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(frontend.common.thread_api._STAR_thread_apis.cljs$core$IDeref$_deref$arity$1(null),new cljs.core.Keyword("thread-api","pull","thread-api/pull",861948100),(function frontend$worker$db_worker$thread_api__pull(repo,selector,id){
var temp__5804__auto__ = frontend.worker.state.get_datascript_conn(repo);
if(cljs.core.truth_(temp__5804__auto__)){
var conn = temp__5804__auto__;
var eid = ((((cljs.core.vector_QMARK_(id)) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","name","block/name",1619760316),cljs.core.first(id)))))?new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(logseq.db.get_page(cljs.core.deref(conn),cljs.core.second(id))):id);
var G__187624 = eid;
var G__187624__$1 = (((G__187624 == null))?null:(function (){var G__187625 = cljs.core.deref(conn);
var G__187626 = selector;
var G__187627 = G__187624;
return (datascript.core.pull.cljs$core$IFn$_invoke$arity$3 ? datascript.core.pull.cljs$core$IFn$_invoke$arity$3(G__187625,G__187626,G__187627) : datascript.core.pull.call(null,G__187625,G__187626,G__187627));
})());
if((G__187624__$1 == null)){
return null;
} else {
return logseq.db.common.initial_data.with_parent(cljs.core.deref(conn),G__187624__$1);
}
} else {
return null;
}
})));
frontend.worker.db_worker._STAR_get_blocks_cache = cljs.core.volatile_BANG_(cljs.cache.lru_cache_factory.cljs$core$IFn$_invoke$arity$variadic(cljs.core.PersistentArrayMap.EMPTY,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"threshold","threshold",204221583),(1000)], 0)));
frontend.worker.db_worker.get_blocks_with_cache = frontend.common.cache.cache_fn(frontend.worker.db_worker._STAR_get_blocks_cache,(function (repo,requests){
var db = (function (){var G__187628 = frontend.worker.state.get_datascript_conn(repo);
if((G__187628 == null)){
return null;
} else {
return cljs.core.deref(G__187628);
}
})();
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [repo,new cljs.core.Keyword(null,"max-tx","max-tx",1119558339).cljs$core$IFn$_invoke$arity$1(db),requests], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [db,requests], null)], null);
}),(function (db,requests){
if(cljs.core.truth_(db)){
return cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (p__187629){
var map__187630 = p__187629;
var map__187630__$1 = cljs.core.__destructure_map(map__187630);
var id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__187630__$1,new cljs.core.Keyword(null,"id","id",-1388402092));
var opts = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__187630__$1,new cljs.core.Keyword(null,"opts","opts",155075701));
var id_SINGLEQUOTE_ = ((((typeof id === 'string') && (logseq.common.util.uuid_string_QMARK_(id))))?cljs.core.uuid(id):id);
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(logseq.db.common.initial_data.get_block_and_children(db,id_SINGLEQUOTE_,opts),new cljs.core.Keyword(null,"id","id",-1388402092),id);
}),requests);
} else {
return null;
}
}));
frontend.common.thread_api._STAR_thread_apis.cljs$core$IVolatile$_vreset_BANG_$arity$2(null,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(frontend.common.thread_api._STAR_thread_apis.cljs$core$IDeref$_deref$arity$1(null),new cljs.core.Keyword("thread-api","get-blocks","thread-api/get-blocks",-999880266),(function frontend$worker$db_worker$thread_api__get_blocks(repo,requests){
return frontend.worker.db_worker.get_blocks_with_cache(repo,requests);
})));
frontend.common.thread_api._STAR_thread_apis.cljs$core$IVolatile$_vreset_BANG_$arity$2(null,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(frontend.common.thread_api._STAR_thread_apis.cljs$core$IDeref$_deref$arity$1(null),new cljs.core.Keyword("thread-api","get-block-refs","thread-api/get-block-refs",-862947599),(function frontend$worker$db_worker$thread_api__get_block_refs(repo,id){
var temp__5804__auto__ = frontend.worker.state.get_datascript_conn(repo);
if(cljs.core.truth_(temp__5804__auto__)){
var conn = temp__5804__auto__;
return logseq.db.get_block_refs(cljs.core.deref(conn),id);
} else {
return null;
}
})));
frontend.common.thread_api._STAR_thread_apis.cljs$core$IVolatile$_vreset_BANG_$arity$2(null,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(frontend.common.thread_api._STAR_thread_apis.cljs$core$IDeref$_deref$arity$1(null),new cljs.core.Keyword("thread-api","get-block-refs-count","thread-api/get-block-refs-count",1389941875),(function frontend$worker$db_worker$thread_api__get_block_refs_count(repo,id){
var temp__5804__auto__ = frontend.worker.state.get_datascript_conn(repo);
if(cljs.core.truth_(temp__5804__auto__)){
var conn = temp__5804__auto__;
var G__187631 = cljs.core.deref(conn);
var G__187632 = id;
return (logseq.db.get_block_refs_count.cljs$core$IFn$_invoke$arity$2 ? logseq.db.get_block_refs_count.cljs$core$IFn$_invoke$arity$2(G__187631,G__187632) : logseq.db.get_block_refs_count.call(null,G__187631,G__187632));
} else {
return null;
}
})));
frontend.common.thread_api._STAR_thread_apis.cljs$core$IVolatile$_vreset_BANG_$arity$2(null,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(frontend.common.thread_api._STAR_thread_apis.cljs$core$IDeref$_deref$arity$1(null),new cljs.core.Keyword("thread-api","block-refs-check","thread-api/block-refs-check",-41022236),(function frontend$worker$db_worker$thread_api__block_refs_check(repo,id,p__187633){
var map__187634 = p__187633;
var map__187634__$1 = cljs.core.__destructure_map(map__187634);
var unlinked_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__187634__$1,new cljs.core.Keyword(null,"unlinked?","unlinked?",440907520));
var temp__5804__auto__ = frontend.worker.state.get_datascript_conn(repo);
if(cljs.core.truth_(temp__5804__auto__)){
var conn = temp__5804__auto__;
var db = cljs.core.deref(conn);
var block = (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db,id) : datascript.core.entity.call(null,db,id));
var db_based_QMARK_ = logseq.db.common.entity_plus.db_based_graph_QMARK_(db);
if(cljs.core.truth_(unlinked_QMARK_)){
var title = clojure.string.lower_case(new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(block));
if(clojure.string.blank_QMARK_(title)){
return null;
} else {
var datoms = datascript.core.datoms.cljs$core$IFn$_invoke$arity$3(db,new cljs.core.Keyword(null,"avet","avet",1383857032),new cljs.core.Keyword("block","title","block/title",710445684));
if(cljs.core.truth_(db_based_QMARK_)){
return cljs.core.some((function (d){
return ((cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(id,new cljs.core.Keyword(null,"e","e",1381269198).cljs$core$IFn$_invoke$arity$1(d))) && (clojure.string.includes_QMARK_(clojure.string.lower_case(new cljs.core.Keyword(null,"v","v",21465059).cljs$core$IFn$_invoke$arity$1(d)),title)));
}),datoms);
} else {
return cljs.core.some((function (d){
var and__5000__auto__ = cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(id,new cljs.core.Keyword(null,"e","e",1381269198).cljs$core$IFn$_invoke$arity$1(d));
if(and__5000__auto__){
var and__5000__auto____$1 = clojure.string.includes_QMARK_(clojure.string.lower_case(new cljs.core.Keyword(null,"v","v",21465059).cljs$core$IFn$_invoke$arity$1(d)),title);
if(and__5000__auto____$1){
var refs = cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","id","db/id",-1388397098),new cljs.core.Keyword("block","refs","block/refs",-1214495349).cljs$core$IFn$_invoke$arity$1((function (){var G__187635 = db;
var G__187636 = new cljs.core.Keyword(null,"e","e",1381269198).cljs$core$IFn$_invoke$arity$1(d);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__187635,G__187636) : datascript.core.entity.call(null,G__187635,G__187636));
})()));
return cljs.core.contains_QMARK_(cljs.core.set(refs),new cljs.core.Keyword(null,"e","e",1381269198).cljs$core$IFn$_invoke$arity$1(d));
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
}),datoms);
}
}
} else {
return ((function (){var G__187637 = db;
var G__187638 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block);
return (logseq.db.get_block_refs_count.cljs$core$IFn$_invoke$arity$2 ? logseq.db.get_block_refs_count.cljs$core$IFn$_invoke$arity$2(G__187637,G__187638) : logseq.db.get_block_refs_count.call(null,G__187637,G__187638));
})() > (0));
}
} else {
return null;
}
})));
frontend.common.thread_api._STAR_thread_apis.cljs$core$IVolatile$_vreset_BANG_$arity$2(null,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(frontend.common.thread_api._STAR_thread_apis.cljs$core$IDeref$_deref$arity$1(null),new cljs.core.Keyword("thread-api","get-block-parents","thread-api/get-block-parents",-1793488563),(function frontend$worker$db_worker$thread_api__get_block_parents(repo,id,depth){
var temp__5804__auto__ = frontend.worker.state.get_datascript_conn(repo);
if(cljs.core.truth_(temp__5804__auto__)){
var conn = temp__5804__auto__;
var block_id = new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1((function (){var G__187639 = cljs.core.deref(conn);
var G__187640 = id;
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__187639,G__187640) : datascript.core.entity.call(null,G__187639,G__187640));
})());
return cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (b){
var G__187641 = cljs.core.deref(conn);
var G__187642 = new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"*","*",345799209,null)], null);
var G__187643 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(b);
return (datascript.core.pull.cljs$core$IFn$_invoke$arity$3 ? datascript.core.pull.cljs$core$IFn$_invoke$arity$3(G__187641,G__187642,G__187643) : datascript.core.pull.call(null,G__187641,G__187642,G__187643));
}),logseq.db.get_block_parents.cljs$core$IFn$_invoke$arity$variadic(cljs.core.deref(conn),block_id,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"depth","depth",1768663640),(function (){var or__5002__auto__ = depth;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return (3);
}
})()], null)], 0)));
} else {
return null;
}
})));
frontend.common.thread_api._STAR_thread_apis.cljs$core$IVolatile$_vreset_BANG_$arity$2(null,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(frontend.common.thread_api._STAR_thread_apis.cljs$core$IDeref$_deref$arity$1(null),new cljs.core.Keyword("thread-api","set-context","thread-api/set-context",241806017),(function frontend$worker$db_worker$thread_api__set_context(context){
if(cljs.core.truth_(context)){
frontend.worker.state.update_context_BANG_(context);
} else {
}

return null;
})));
frontend.common.thread_api._STAR_thread_apis.cljs$core$IVolatile$_vreset_BANG_$arity$2(null,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(frontend.common.thread_api._STAR_thread_apis.cljs$core$IDeref$_deref$arity$1(null),new cljs.core.Keyword("thread-api","transact","thread-api/transact",917721609),(function frontend$worker$db_worker$thread_api__transact(repo,tx_data,tx_meta,context){
if(cljs.core.truth_(repo)){
frontend.worker.state.set_db_latest_tx_time_BANG_(repo);
} else {
}

var temp__5804__auto__ = frontend.worker.state.get_datascript_conn(repo);
if(cljs.core.truth_(temp__5804__auto__)){
var conn = temp__5804__auto__;
try{var tx_data_SINGLEQUOTE_ = ((cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"insert-blocks","insert-blocks",-1269782013),null], null), null),new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450).cljs$core$IFn$_invoke$arity$1(tx_meta)))?cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (m){
if(((cljs.core.map_QMARK_(m)) && ((new cljs.core.Keyword("block","order","block/order",-1429282437).cljs$core$IFn$_invoke$arity$1(m) == null)))){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(m,new cljs.core.Keyword("block","order","block/order",-1429282437),logseq.db.common.order.gen_key.cljs$core$IFn$_invoke$arity$1(null));
} else {
return m;
}
}),tx_data):tx_data);
var _ = (cljs.core.truth_(context)?frontend.worker.state.set_context_BANG_(context):null);
var tx_meta_SINGLEQUOTE_ = (function (){var G__187645 = tx_meta;
var G__187645__$1 = ((((cljs.core.not(new cljs.core.Keyword("whiteboard","transact?","whiteboard/transact?",-1793205629).cljs$core$IFn$_invoke$arity$1(tx_meta))) && (cljs.core.not(new cljs.core.Keyword(null,"rtc-download-graph?","rtc-download-graph?",-1013530237).cljs$core$IFn$_invoke$arity$1(tx_meta)))))?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__187645,new cljs.core.Keyword(null,"skip-store?","skip-store?",-484019625),true):G__187645);
return cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(G__187645__$1,new cljs.core.Keyword(null,"insert-blocks?","insert-blocks?",-393496700));

})();
if(cljs.core.truth_((function (){var and__5000__auto__ = new cljs.core.Keyword(null,"create-today-journal?","create-today-journal?",136893930).cljs$core$IFn$_invoke$arity$1(tx_meta);
if(cljs.core.truth_(and__5000__auto__)){
var and__5000__auto____$1 = new cljs.core.Keyword(null,"today-journal-name","today-journal-name",1965349294).cljs$core$IFn$_invoke$arity$1(tx_meta);
if(cljs.core.truth_(and__5000__auto____$1)){
var and__5000__auto____$2 = cljs.core.seq(tx_data_SINGLEQUOTE_);
if(and__5000__auto____$2){
return logseq.db.get_page(cljs.core.deref(conn),new cljs.core.Keyword(null,"today-journal-name","today-journal-name",1965349294).cljs$core$IFn$_invoke$arity$1(tx_meta));
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
} else {
if(cljs.core.truth_(goog.DEBUG)){
var k__43674__auto___187824 = "Worker db transact";
console.time(k__43674__auto___187824);

var res__43675__auto___187825 = logseq.db.transact_BANG_.cljs$core$IFn$_invoke$arity$3(conn,tx_data_SINGLEQUOTE_,tx_meta_SINGLEQUOTE_);
console.timeEnd(k__43674__auto___187824);

} else {
logseq.db.transact_BANG_.cljs$core$IFn$_invoke$arity$3(conn,tx_data_SINGLEQUOTE_,tx_meta_SINGLEQUOTE_);
}
}

return null;
}catch (e187644){var e = e187644;
cljs.core.prn.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"debug","debug",-1608172596),new cljs.core.Keyword(null,"error","error",-978969032)], 0));

console.error(e);

return cljs.core.prn.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"debug","debug",-1608172596),new cljs.core.Keyword(null,"tx-data","tx-data",934159761),cljs.core.deref(conn),tx_data], 0));
}} else {
return null;
}
})));
frontend.common.thread_api._STAR_thread_apis.cljs$core$IVolatile$_vreset_BANG_$arity$2(null,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(frontend.common.thread_api._STAR_thread_apis.cljs$core$IDeref$_deref$arity$1(null),new cljs.core.Keyword("thread-api","get-initial-data","thread-api/get-initial-data",-1216390318),(function frontend$worker$db_worker$thread_api__get_initial_data(repo){
var temp__5804__auto__ = frontend.worker.state.get_datascript_conn(repo);
if(cljs.core.truth_(temp__5804__auto__)){
var conn = temp__5804__auto__;
return logseq.db.common.initial_data.get_initial_data(cljs.core.deref(conn));
} else {
return null;
}
})));
frontend.common.thread_api._STAR_thread_apis.cljs$core$IVolatile$_vreset_BANG_$arity$2(null,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(frontend.common.thread_api._STAR_thread_apis.cljs$core$IDeref$_deref$arity$1(null),new cljs.core.Keyword("thread-api","reset-db","thread-api/reset-db",-1716200425),(function frontend$worker$db_worker$thread_api__reset_db(repo,db_transit){
frontend.worker.db_worker.reset_db_BANG_(repo,db_transit);

return null;
})));
frontend.common.thread_api._STAR_thread_apis.cljs$core$IVolatile$_vreset_BANG_$arity$2(null,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(frontend.common.thread_api._STAR_thread_apis.cljs$core$IDeref$_deref$arity$1(null),new cljs.core.Keyword("thread-api","unsafe-unlink-db","thread-api/unsafe-unlink-db",1765912451),(function frontend$worker$db_worker$thread_api__unsafe_unlink_db(repo){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41626__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.worker.db_worker._LT_get_opfs_pool(repo)),(function (pool){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.worker.db_worker.close_db_BANG_(repo)),(function (_){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.worker.db_worker.remove_vfs_BANG_(pool)),(function (_result){
return promesa.protocols._promise(null);
}));
}));
}));
}));
})));
frontend.common.thread_api._STAR_thread_apis.cljs$core$IVolatile$_vreset_BANG_$arity$2(null,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(frontend.common.thread_api._STAR_thread_apis.cljs$core$IDeref$_deref$arity$1(null),new cljs.core.Keyword("thread-api","release-access-handles","thread-api/release-access-handles",892503250),(function frontend$worker$db_worker$thread_api__release_access_handles(repo){
var temp__5804__auto__ = frontend.worker.state.get_opfs_pool(repo);
if(cljs.core.truth_(temp__5804__auto__)){
var pool = temp__5804__auto__;
pool.releaseAccessHandles();

return null;
} else {
return null;
}
})));
frontend.common.thread_api._STAR_thread_apis.cljs$core$IVolatile$_vreset_BANG_$arity$2(null,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(frontend.common.thread_api._STAR_thread_apis.cljs$core$IDeref$_deref$arity$1(null),new cljs.core.Keyword("thread-api","db-exists","thread-api/db-exists",-788109529),(function frontend$worker$db_worker$thread_api__db_exists(repo){
return frontend.worker.db_worker._LT_db_exists_QMARK_(repo);
})));
frontend.common.thread_api._STAR_thread_apis.cljs$core$IVolatile$_vreset_BANG_$arity$2(null,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(frontend.common.thread_api._STAR_thread_apis.cljs$core$IDeref$_deref$arity$1(null),new cljs.core.Keyword("thread-api","export-db","thread-api/export-db",1376034690),(function frontend$worker$db_worker$thread_api__export_db(repo){
var temp__5804__auto___187826 = frontend.worker.state.get_sqlite_conn.cljs$core$IFn$_invoke$arity$2(repo,new cljs.core.Keyword(null,"db","db",993250759));
if(cljs.core.truth_(temp__5804__auto___187826)){
var db_187827 = temp__5804__auto___187826;
db_187827.exec("PRAGMA wal_checkpoint(2)");
} else {
}

return frontend.worker.db_worker._LT_export_db_file(repo);
})));
frontend.common.thread_api._STAR_thread_apis.cljs$core$IVolatile$_vreset_BANG_$arity$2(null,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(frontend.common.thread_api._STAR_thread_apis.cljs$core$IDeref$_deref$arity$1(null),new cljs.core.Keyword("thread-api","import-db","thread-api/import-db",-966513630),(function frontend$worker$db_worker$thread_api__import_db(repo,data){
if(clojure.string.blank_QMARK_(repo)){
return null;
} else {
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41626__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.worker.db_worker._LT_get_opfs_pool(repo)),(function (pool){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.worker.db_worker._LT_import_db(pool,data)),(function (___41594__auto__){
return promesa.protocols._promise(null);
}));
}));
}));
}
})));
frontend.common.thread_api._STAR_thread_apis.cljs$core$IVolatile$_vreset_BANG_$arity$2(null,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(frontend.common.thread_api._STAR_thread_apis.cljs$core$IDeref$_deref$arity$1(null),new cljs.core.Keyword("thread-api","search-blocks","thread-api/search-blocks",1217984294),(function frontend$worker$db_worker$thread_api__search_blocks(repo,q,option){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41626__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.worker.db_worker.get_search_db(repo)),(function (search_db){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.worker.state.get_datascript_conn(repo)),(function (conn){
return promesa.protocols._promise(frontend.worker.search.search_blocks(repo,conn,search_db,q,option));
}));
}));
}));
})));
frontend.common.thread_api._STAR_thread_apis.cljs$core$IVolatile$_vreset_BANG_$arity$2(null,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(frontend.common.thread_api._STAR_thread_apis.cljs$core$IDeref$_deref$arity$1(null),new cljs.core.Keyword("thread-api","search-upsert-blocks","thread-api/search-upsert-blocks",802527035),(function frontend$worker$db_worker$thread_api__search_upsert_blocks(repo,blocks){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41626__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.worker.db_worker.get_search_db(repo)),(function (db){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.worker.search.upsert_blocks_BANG_(db,cljs_bean.core.__GT_js(blocks))),(function (___41594__auto__){
return promesa.protocols._promise(null);
}));
}));
}));
})));
frontend.common.thread_api._STAR_thread_apis.cljs$core$IVolatile$_vreset_BANG_$arity$2(null,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(frontend.common.thread_api._STAR_thread_apis.cljs$core$IDeref$_deref$arity$1(null),new cljs.core.Keyword("thread-api","search-delete-blocks","thread-api/search-delete-blocks",2049847839),(function frontend$worker$db_worker$thread_api__search_delete_blocks(repo,ids){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41626__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.worker.db_worker.get_search_db(repo)),(function (db){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.worker.search.delete_blocks_BANG_(db,ids)),(function (___41594__auto__){
return promesa.protocols._promise(null);
}));
}));
}));
})));
frontend.common.thread_api._STAR_thread_apis.cljs$core$IVolatile$_vreset_BANG_$arity$2(null,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(frontend.common.thread_api._STAR_thread_apis.cljs$core$IDeref$_deref$arity$1(null),new cljs.core.Keyword("thread-api","search-truncate-tables","thread-api/search-truncate-tables",-2046581559),(function frontend$worker$db_worker$thread_api__search_truncate_tables(repo){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41626__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.worker.db_worker.get_search_db(repo)),(function (db){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.worker.search.truncate_table_BANG_(db)),(function (___41594__auto__){
return promesa.protocols._promise(null);
}));
}));
}));
})));
frontend.common.thread_api._STAR_thread_apis.cljs$core$IVolatile$_vreset_BANG_$arity$2(null,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(frontend.common.thread_api._STAR_thread_apis.cljs$core$IDeref$_deref$arity$1(null),new cljs.core.Keyword("thread-api","search-build-blocks-indice","thread-api/search-build-blocks-indice",1530364112),(function frontend$worker$db_worker$thread_api__search_build_blocks_indice(repo){
var temp__5804__auto__ = frontend.worker.state.get_datascript_conn(repo);
if(cljs.core.truth_(temp__5804__auto__)){
var conn = temp__5804__auto__;
return frontend.worker.search.build_blocks_indice(repo,cljs.core.deref(conn));
} else {
return null;
}
})));
frontend.common.thread_api._STAR_thread_apis.cljs$core$IVolatile$_vreset_BANG_$arity$2(null,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(frontend.common.thread_api._STAR_thread_apis.cljs$core$IDeref$_deref$arity$1(null),new cljs.core.Keyword("thread-api","search-build-pages-indice","thread-api/search-build-pages-indice",-658848803),(function frontend$worker$db_worker$thread_api__search_build_pages_indice(_repo){
return null;
})));
frontend.common.thread_api._STAR_thread_apis.cljs$core$IVolatile$_vreset_BANG_$arity$2(null,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(frontend.common.thread_api._STAR_thread_apis.cljs$core$IDeref$_deref$arity$1(null),new cljs.core.Keyword("thread-api","apply-outliner-ops","thread-api/apply-outliner-ops",654139693),(function frontend$worker$db_worker$thread_api__apply_outliner_ops(repo,ops,opts){
var temp__5804__auto__ = frontend.worker.state.get_datascript_conn(repo);
if(cljs.core.truth_(temp__5804__auto__)){
var conn = temp__5804__auto__;
try{if(cljs.core.truth_(goog.DEBUG)){
var k__43674__auto__ = "apply outliner ops";
console.time(k__43674__auto__);

var res__43675__auto__ = logseq.outliner.op.apply_ops_BANG_(repo,conn,ops,frontend.worker.state.get_date_formatter(repo),opts);
console.timeEnd(k__43674__auto__);

return res__43675__auto__;
} else {
return logseq.outliner.op.apply_ops_BANG_(repo,conn,ops,frontend.worker.state.get_date_formatter(repo),opts);
}
}catch (e187646){var e = e187646;
var data = cljs.core.ex_data(e);
var map__187647 = ((cljs.core.map_QMARK_(data))?data:null);
var map__187647__$1 = cljs.core.__destructure_map(map__187647);
var type = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__187647__$1,new cljs.core.Keyword(null,"type","type",1174270348));
var payload = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__187647__$1,new cljs.core.Keyword(null,"payload","payload",-383036092));
var G__187648 = type;
var G__187648__$1 = (((G__187648 instanceof cljs.core.Keyword))?G__187648.fqn:null);
switch (G__187648__$1) {
case "notification":
return frontend.worker.shared_service.broadcast_to_clients_BANG_(new cljs.core.Keyword(null,"notification","notification",-222338233),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"message","message",-406056002).cljs$core$IFn$_invoke$arity$1(payload),new cljs.core.Keyword(null,"type","type",1174270348).cljs$core$IFn$_invoke$arity$1(payload)], null));

break;
default:
throw e;

}
}} else {
return null;
}
})));
frontend.common.thread_api._STAR_thread_apis.cljs$core$IVolatile$_vreset_BANG_$arity$2(null,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(frontend.common.thread_api._STAR_thread_apis.cljs$core$IDeref$_deref$arity$1(null),new cljs.core.Keyword("thread-api","file-writes-finished?","thread-api/file-writes-finished?",-655932106),(function frontend$worker$db_worker$thread_api__file_writes_finished_QMARK_(repo){
var conn = frontend.worker.state.get_datascript_conn(repo);
var writes = cljs.core.deref(frontend.worker.file._STAR_writes);
if(cljs.core.truth_(conn)){
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$2(frontend.worker.file._STAR_writes,(function (writes__$1){
return cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (p__187649){
var vec__187650 = p__187649;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__187650,(0),null);
var pid = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__187650,(1),null);
var G__187653 = cljs.core.deref(conn);
var G__187654 = pid;
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__187653,G__187654) : datascript.core.entity.call(null,G__187653,G__187654));
}),writes__$1));
}));
} else {
}

if(cljs.core.empty_QMARK_(writes)){
return true;
} else {
cljs.core.prn.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["Unfinished file writes:",cljs.core.deref(frontend.worker.file._STAR_writes)], 0));

return false;
}
})));
frontend.common.thread_api._STAR_thread_apis.cljs$core$IVolatile$_vreset_BANG_$arity$2(null,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(frontend.common.thread_api._STAR_thread_apis.cljs$core$IDeref$_deref$arity$1(null),new cljs.core.Keyword("thread-api","page-file-saved","thread-api/page-file-saved",-441358548),(function frontend$worker$db_worker$thread_api__page_file_saved(request_id,_page_id){
frontend.worker.file.dissoc_request_BANG_(request_id);

return null;
})));
frontend.common.thread_api._STAR_thread_apis.cljs$core$IVolatile$_vreset_BANG_$arity$2(null,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(frontend.common.thread_api._STAR_thread_apis.cljs$core$IDeref$_deref$arity$1(null),new cljs.core.Keyword("thread-api","sync-app-state","thread-api/sync-app-state",1507174044),(function frontend$worker$db_worker$thread_api__sync_app_state(new_state){
frontend.worker.state.set_new_state_BANG_(new_state);

return null;
})));
frontend.common.thread_api._STAR_thread_apis.cljs$core$IVolatile$_vreset_BANG_$arity$2(null,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(frontend.common.thread_api._STAR_thread_apis.cljs$core$IDeref$_deref$arity$1(null),new cljs.core.Keyword("thread-api","export-get-debug-datoms","thread-api/export-get-debug-datoms",-876994180),(function frontend$worker$db_worker$thread_api__export_get_debug_datoms(repo){
var temp__5804__auto__ = frontend.worker.state.get_sqlite_conn.cljs$core$IFn$_invoke$arity$1(repo);
if(cljs.core.truth_(temp__5804__auto__)){
var db = temp__5804__auto__;
var conn = frontend.worker.state.get_datascript_conn(repo);
return frontend.worker.export$.get_debug_datoms(conn,db);
} else {
return null;
}
})));
frontend.common.thread_api._STAR_thread_apis.cljs$core$IVolatile$_vreset_BANG_$arity$2(null,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(frontend.common.thread_api._STAR_thread_apis.cljs$core$IDeref$_deref$arity$1(null),new cljs.core.Keyword("thread-api","export-get-all-pages","thread-api/export-get-all-pages",-1366990196),(function frontend$worker$db_worker$thread_api__export_get_all_pages(repo){
var temp__5804__auto__ = frontend.worker.state.get_datascript_conn(repo);
if(cljs.core.truth_(temp__5804__auto__)){
var conn = temp__5804__auto__;
return frontend.worker.export$.get_all_pages(repo,cljs.core.deref(conn));
} else {
return null;
}
})));
frontend.common.thread_api._STAR_thread_apis.cljs$core$IVolatile$_vreset_BANG_$arity$2(null,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(frontend.common.thread_api._STAR_thread_apis.cljs$core$IDeref$_deref$arity$1(null),new cljs.core.Keyword("thread-api","export-get-all-page->content","thread-api/export-get-all-page->content",1294444679),(function frontend$worker$db_worker$thread_api__export_get_all_page__GT_content(repo,options){
var temp__5804__auto__ = frontend.worker.state.get_datascript_conn(repo);
if(cljs.core.truth_(temp__5804__auto__)){
var conn = temp__5804__auto__;
return frontend.worker.export$.get_all_page__GT_content(repo,cljs.core.deref(conn),options);
} else {
return null;
}
})));
frontend.common.thread_api._STAR_thread_apis.cljs$core$IVolatile$_vreset_BANG_$arity$2(null,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(frontend.common.thread_api._STAR_thread_apis.cljs$core$IDeref$_deref$arity$1(null),new cljs.core.Keyword("thread-api","validate-db","thread-api/validate-db",2061031012),(function frontend$worker$db_worker$thread_api__validate_db(repo){
var temp__5804__auto__ = frontend.worker.state.get_datascript_conn(repo);
if(cljs.core.truth_(temp__5804__auto__)){
var conn = temp__5804__auto__;
var result = frontend.worker.db.validate.validate_db(cljs.core.deref(conn));
frontend.worker.db.migrate.fix_db_BANG_.cljs$core$IFn$_invoke$arity$variadic(conn,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"invalid-entity-ids","invalid-entity-ids",432707245),new cljs.core.Keyword(null,"invalid-entity-ids","invalid-entity-ids",432707245).cljs$core$IFn$_invoke$arity$1(result)], null)], 0));

return result;
} else {
return null;
}
})));
frontend.common.thread_api._STAR_thread_apis.cljs$core$IVolatile$_vreset_BANG_$arity$2(null,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(frontend.common.thread_api._STAR_thread_apis.cljs$core$IDeref$_deref$arity$1(null),new cljs.core.Keyword("thread-api","export-edn","thread-api/export-edn",507686782),(function frontend$worker$db_worker$thread_api__export_edn(repo,options){
var conn = frontend.worker.state.get_datascript_conn(repo);
try{return logseq.db.sqlite.export$.build_export(cljs.core.deref(conn),options);
}catch (e187655){var e = e187655;
console.error("export-edn error: ",e);

var G__187656_187829 = new cljs.core.Keyword(null,"notification","notification",-222338233);
var G__187657_187830 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["An unexpected error occurred during export. See the javascript console for details.",new cljs.core.Keyword(null,"error","error",-978969032)], null);
(frontend.worker.util.post_message.cljs$core$IFn$_invoke$arity$2 ? frontend.worker.util.post_message.cljs$core$IFn$_invoke$arity$2(G__187656_187829,G__187657_187830) : frontend.worker.util.post_message.call(null,G__187656_187829,G__187657_187830));

return new cljs.core.Keyword(null,"export-edn-error","export-edn-error",867881458);
}})));
frontend.common.thread_api._STAR_thread_apis.cljs$core$IVolatile$_vreset_BANG_$arity$2(null,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(frontend.common.thread_api._STAR_thread_apis.cljs$core$IDeref$_deref$arity$1(null),new cljs.core.Keyword("thread-api","get-view-data","thread-api/get-view-data",1976013429),(function frontend$worker$db_worker$thread_api__get_view_data(repo,view_id,option){
var db = cljs.core.deref(frontend.worker.state.get_datascript_conn(repo));
return logseq.db.common.view.get_view_data(db,view_id,option);
})));
frontend.common.thread_api._STAR_thread_apis.cljs$core$IVolatile$_vreset_BANG_$arity$2(null,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(frontend.common.thread_api._STAR_thread_apis.cljs$core$IDeref$_deref$arity$1(null),new cljs.core.Keyword("thread-api","get-property-values","thread-api/get-property-values",60992180),(function frontend$worker$db_worker$thread_api__get_property_values(repo,p__187658){
var map__187659 = p__187658;
var map__187659__$1 = cljs.core.__destructure_map(map__187659);
var option = map__187659__$1;
var property_ident = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__187659__$1,new cljs.core.Keyword(null,"property-ident","property-ident",697145839));
var conn = frontend.worker.state.get_datascript_conn(repo);
return logseq.db.common.view.get_property_values(cljs.core.deref(conn),property_ident,option);
})));
frontend.common.thread_api._STAR_thread_apis.cljs$core$IVolatile$_vreset_BANG_$arity$2(null,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(frontend.common.thread_api._STAR_thread_apis.cljs$core$IDeref$_deref$arity$1(null),new cljs.core.Keyword("thread-api","build-graph","thread-api/build-graph",729373393),(function frontend$worker$db_worker$thread_api__build_graph(repo,option){
var conn = frontend.worker.state.get_datascript_conn(repo);
return frontend.common.graph_view.build_graph(cljs.core.deref(conn),option);
})));
frontend.worker.db_worker._STAR_get_all_page_titles_cache = cljs.core.volatile_BANG_(cljs.cache.lru_cache_factory(cljs.core.PersistentArrayMap.EMPTY));
frontend.worker.db_worker.get_all_page_titles = (function frontend$worker$db_worker$get_all_page_titles(db){
var pages = logseq.db.get_all_pages(db);
return cljs.core.sort.cljs$core$IFn$_invoke$arity$1(cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","title","block/title",710445684),pages));
});
frontend.worker.db_worker.get_all_page_titles_with_cache = frontend.common.cache.cache_fn(frontend.worker.db_worker._STAR_get_all_page_titles_cache,(function (repo){
var db = cljs.core.deref(frontend.worker.state.get_datascript_conn(repo));
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [repo,new cljs.core.Keyword(null,"max-tx","max-tx",1119558339).cljs$core$IFn$_invoke$arity$1(db)], null),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [db], null)], null);
}),frontend.worker.db_worker.get_all_page_titles);
frontend.common.thread_api._STAR_thread_apis.cljs$core$IVolatile$_vreset_BANG_$arity$2(null,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(frontend.common.thread_api._STAR_thread_apis.cljs$core$IDeref$_deref$arity$1(null),new cljs.core.Keyword("thread-api","get-all-page-titles","thread-api/get-all-page-titles",1191294363),(function frontend$worker$db_worker$thread_api__get_all_page_titles(repo){
return frontend.worker.db_worker.get_all_page_titles_with_cache(repo);
})));
frontend.common.thread_api._STAR_thread_apis.cljs$core$IVolatile$_vreset_BANG_$arity$2(null,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(frontend.common.thread_api._STAR_thread_apis.cljs$core$IDeref$_deref$arity$1(null),new cljs.core.Keyword("thread-api","fix-broken-graph","thread-api/fix-broken-graph",-993702673),(function frontend$worker$db_worker$thread_api__fix_broken_graph(graph){
return frontend.worker.db_worker.fix_broken_graph(graph);
})));
frontend.common.thread_api._STAR_thread_apis.cljs$core$IVolatile$_vreset_BANG_$arity$2(null,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(frontend.common.thread_api._STAR_thread_apis.cljs$core$IDeref$_deref$arity$1(null),new cljs.core.Keyword("thread-api","reset-file","thread-api/reset-file",1693971804),(function frontend$worker$db_worker$thread_api__reset_file(repo,file_path,content,opts){
var temp__5804__auto__ = frontend.worker.state.get_datascript_conn(repo);
if(cljs.core.truth_(temp__5804__auto__)){
var conn = temp__5804__auto__;
return frontend.worker.file.reset.reset_file_BANG_.cljs$core$IFn$_invoke$arity$5(repo,conn,file_path,content,opts);
} else {
return null;
}
})));
frontend.common.thread_api._STAR_thread_apis.cljs$core$IVolatile$_vreset_BANG_$arity$2(null,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(frontend.common.thread_api._STAR_thread_apis.cljs$core$IDeref$_deref$arity$1(null),new cljs.core.Keyword("thread-api","gc-graph","thread-api/gc-graph",1137283006),(function frontend$worker$db_worker$thread_api__gc_graph(repo){
var map__187660 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(frontend.worker.db_worker._STAR_sqlite_conns),repo);
var map__187660__$1 = cljs.core.__destructure_map(map__187660);
var db = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__187660__$1,new cljs.core.Keyword(null,"db","db",993250759));
var client_ops = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__187660__$1,new cljs.core.Keyword(null,"client-ops","client-ops",-1058023795));
var conn = cljs.core.get.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(frontend.worker.db_worker._STAR_datascript_conns),repo);
if(cljs.core.truth_((function (){var and__5000__auto__ = db;
if(cljs.core.truth_(and__5000__auto__)){
return conn;
} else {
return and__5000__auto__;
}
})())){
frontend.worker.db_worker.gc_sqlite_dbs_BANG_(db,client_ops,conn,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"full-gc?","full-gc?",150271731),true], null));

return null;
} else {
return null;
}
})));
frontend.worker.db_worker.rename_page_BANG_ = (function frontend$worker$db_worker$rename_page_BANG_(repo,conn,page_uuid,new_name){
var config = frontend.worker.state.get_config(repo);
var f = (cljs.core.truth_(logseq.db.sqlite.util.db_based_graph_QMARK_(repo))?(function(){throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2("Rename page is a file graph only operation",cljs.core.PersistentArrayMap.EMPTY)})():frontend.worker.handler.page.file_based.rename.rename_BANG_);
return (f.cljs$core$IFn$_invoke$arity$5 ? f.cljs$core$IFn$_invoke$arity$5(repo,conn,config,page_uuid,new_name) : f.call(null,repo,conn,config,page_uuid,new_name));
});
frontend.worker.db_worker.delete_page_BANG_ = (function frontend$worker$db_worker$delete_page_BANG_(repo,conn,page_uuid){
var error_handler = (function (p__187662){
var map__187663 = p__187662;
var map__187663__$1 = cljs.core.__destructure_map(map__187663);
var msg = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__187663__$1,new cljs.core.Keyword(null,"msg","msg",-1386103444));
var G__187664 = new cljs.core.Keyword(null,"notification","notification",-222338233);
var G__187665 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"p","p",151049309),msg], null)], null),new cljs.core.Keyword(null,"error","error",-978969032)], null);
return (frontend.worker.util.post_message.cljs$core$IFn$_invoke$arity$2 ? frontend.worker.util.post_message.cljs$core$IFn$_invoke$arity$2(G__187664,G__187665) : frontend.worker.util.post_message.call(null,G__187664,G__187665));
});
return frontend.worker.handler.page.delete_BANG_.cljs$core$IFn$_invoke$arity$variadic(repo,conn,page_uuid,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"error-handler","error-handler",-484945776),error_handler], null)], 0));
});
frontend.worker.db_worker.create_page_BANG_ = (function frontend$worker$db_worker$create_page_BANG_(repo,conn,title,options){
var config = frontend.worker.state.get_config(repo);
return frontend.worker.handler.page.create_BANG_.cljs$core$IFn$_invoke$arity$variadic(repo,conn,config,title,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([options], 0));
});
frontend.worker.db_worker.outliner_register_op_handlers_BANG_ = (function frontend$worker$db_worker$outliner_register_op_handlers_BANG_(){
return logseq.outliner.op.register_op_handlers_BANG_(new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"create-page","create-page",-1352656443),(function (repo,conn,p__187666){
var vec__187667 = p__187666;
var title = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__187667,(0),null);
var options = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__187667,(1),null);
return frontend.worker.db_worker.create_page_BANG_(repo,conn,title,options);
}),new cljs.core.Keyword(null,"rename-page","rename-page",-2094129371),(function (repo,conn,p__187670){
var vec__187671 = p__187670;
var page_uuid = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__187671,(0),null);
var new_name = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__187671,(1),null);
return frontend.worker.db_worker.rename_page_BANG_(repo,conn,page_uuid,new_name);
}),new cljs.core.Keyword(null,"delete-page","delete-page",-1371381770),(function (repo,conn,p__187674){
var vec__187675 = p__187674;
var page_uuid = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__187675,(0),null);
return frontend.worker.db_worker.delete_page_BANG_(repo,conn,page_uuid);
})], null));
});
frontend.worker.db_worker._LT_ratelimit_file_writes_BANG_ = (function frontend$worker$db_worker$_LT_ratelimit_file_writes_BANG_(){
return frontend.worker.file._LT_ratelimit_file_writes_BANG_((function (col){
if(cljs.core.seq(col)){
var repo = cljs.core.ffirst(col);
var conn = frontend.worker.state.get_datascript_conn(repo);
if(cljs.core.truth_(conn)){
if(cljs.core.truth_((function (){var G__187678 = cljs.core.deref(conn);
return (logseq.db.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(G__187678) : logseq.db.db_based_graph_QMARK_.call(null,G__187678));
})())){
return null;
} else {
return frontend.worker.file.write_files_BANG_(conn,col,frontend.worker.state.get_context());
}
} else {
return console.error(["DB is not found for ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(repo)].join(''));
}
} else {
return null;
}
}));
});
frontend.worker.db_worker.on_become_master = (function frontend$worker$db_worker$on_become_master(repo,start_opts){
return (new Promise(cljs.core.partial.cljs$core$IFn$_invoke$arity$2((function (){var cr187679_block_2 = (function frontend$worker$db_worker$on_become_master_$_cr187679_block_2(cr187679_state){
try{var cr187679_place_9 = frontend.common.missionary._LT__BANG_;
var cr187679_place_10 = frontend.worker.db_worker.start_db_BANG_;
var cr187679_place_11 = repo;
var cr187679_place_12 = start_opts;
var cr187679_place_13 = (function (){var G__187706 = cr187679_place_11;
var G__187707 = cr187679_place_12;
var fexpr__187705 = cr187679_place_10;
return (fexpr__187705.cljs$core$IFn$_invoke$arity$2 ? fexpr__187705.cljs$core$IFn$_invoke$arity$2(G__187706,G__187707) : fexpr__187705.call(null,G__187706,G__187707));
})();
var cr187679_place_14 = (function (){var G__187709 = cr187679_place_13;
var fexpr__187708 = cr187679_place_9;
return (fexpr__187708.cljs$core$IFn$_invoke$arity$1 ? fexpr__187708.cljs$core$IFn$_invoke$arity$1(G__187709) : fexpr__187708.call(null,G__187709));
})();
(cr187679_state[(0)] = cr187679_block_3);

return missionary.core.park(cr187679_place_14);
}catch (e187704){var cr187679_exception = e187704;
(cr187679_state[(0)] = null);

(cr187679_state[(1)] = null);

throw cr187679_exception;
}});
var cr187679_block_1 = (function frontend$worker$db_worker$on_become_master_$_cr187679_block_1(cr187679_state){
try{var cr187679_place_4 = missionary.core.unpark();
var cr187679_place_5 = new cljs.core.Keyword(null,"import-type","import-type",-499283032);
var cr187679_place_6 = start_opts;
var cr187679_place_7 = cr187679_place_5.cljs$core$IFn$_invoke$arity$1(cr187679_place_6);
var cr187679_place_8 = null;
if(cljs.core.truth_(cr187679_place_7)){
(cr187679_state[(0)] = cr187679_block_7);

(cr187679_state[(1)] = cr187679_place_8);

return cr187679_state;
} else {
(cr187679_state[(0)] = cr187679_block_2);

(cr187679_state[(1)] = cr187679_place_8);

return cr187679_state;
}
}catch (e187710){var cr187679_exception = e187710;
(cr187679_state[(0)] = null);

throw cr187679_exception;
}});
var cr187679_block_4 = (function frontend$worker$db_worker$on_become_master_$_cr187679_block_4(cr187679_state){
try{var cr187679_place_24 = "Assert failed: (some? (worker-state/get-datascript-conn repo))";
var cr187679_place_25 = (new Error(cr187679_place_24));
var cr187679_place_26 = (function(){throw cr187679_place_25})();
(cr187679_state[(0)] = null);

return null;
}catch (e187711){var cr187679_exception = e187711;
(cr187679_state[(0)] = null);

throw cr187679_exception;
}});
var cr187679_block_3 = (function frontend$worker$db_worker$on_become_master_$_cr187679_block_3(cr187679_state){
try{var cr187679_place_15 = missionary.core.unpark();
var cr187679_place_16 = cljs.core.not;
var cr187679_place_17 = frontend.worker.state.get_datascript_conn;
var cr187679_place_18 = repo;
var cr187679_place_19 = (function (){var G__187714 = cr187679_place_18;
var fexpr__187713 = cr187679_place_17;
return (fexpr__187713.cljs$core$IFn$_invoke$arity$1 ? fexpr__187713.cljs$core$IFn$_invoke$arity$1(G__187714) : fexpr__187713.call(null,G__187714));
})();
var cr187679_place_20 = null;
var cr187679_place_21 = (cr187679_place_19 == cr187679_place_20);
var cr187679_place_22 = (function (){var G__187716 = cr187679_place_21;
var fexpr__187715 = cr187679_place_16;
return (fexpr__187715.cljs$core$IFn$_invoke$arity$1 ? fexpr__187715.cljs$core$IFn$_invoke$arity$1(G__187716) : fexpr__187715.call(null,G__187716));
})();
var cr187679_place_23 = null;
if(cljs.core.truth_(cr187679_place_22)){
(cr187679_state[(0)] = cr187679_block_5);

(cr187679_state[(2)] = cr187679_place_23);

return cr187679_state;
} else {
(cr187679_state[(0)] = cr187679_block_4);

(cr187679_state[(1)] = null);

return cr187679_state;
}
}catch (e187712){var cr187679_exception = e187712;
(cr187679_state[(0)] = null);

(cr187679_state[(1)] = null);

throw cr187679_exception;
}});
var cr187679_block_6 = (function frontend$worker$db_worker$on_become_master_$_cr187679_block_6(cr187679_state){
try{var cr187679_place_23 = (cr187679_state[(2)]);
(cr187679_state[(0)] = cr187679_block_8);

(cr187679_state[(2)] = null);

(cr187679_state[(1)] = cr187679_place_23);

return cr187679_state;
}catch (e187717){var cr187679_exception = e187717;
(cr187679_state[(0)] = null);

(cr187679_state[(2)] = null);

(cr187679_state[(1)] = null);

throw cr187679_exception;
}});
var cr187679_block_8 = (function frontend$worker$db_worker$on_become_master_$_cr187679_block_8(cr187679_state){
try{var cr187679_place_8 = (cr187679_state[(1)]);
var cr187679_place_29 = frontend.worker.rtc.core.new_task__rtc_start;
var cr187679_place_30 = true;
var cr187679_place_31 = (function (){var G__187720 = cr187679_place_30;
var fexpr__187719 = cr187679_place_29;
return (fexpr__187719.cljs$core$IFn$_invoke$arity$1 ? fexpr__187719.cljs$core$IFn$_invoke$arity$1(G__187720) : fexpr__187719.call(null,G__187720));
})();
(cr187679_state[(0)] = cr187679_block_9);

(cr187679_state[(1)] = null);

return missionary.core.park(cr187679_place_31);
}catch (e187718){var cr187679_exception = e187718;
(cr187679_state[(0)] = null);

(cr187679_state[(1)] = null);

throw cr187679_exception;
}});
var cr187679_block_7 = (function frontend$worker$db_worker$on_become_master_$_cr187679_block_7(cr187679_state){
try{var cr187679_place_28 = null;
(cr187679_state[(0)] = cr187679_block_8);

(cr187679_state[(1)] = cr187679_place_28);

return cr187679_state;
}catch (e187721){var cr187679_exception = e187721;
(cr187679_state[(0)] = null);

(cr187679_state[(1)] = null);

throw cr187679_exception;
}});
var cr187679_block_0 = (function frontend$worker$db_worker$on_become_master_$_cr187679_block_0(cr187679_state){
try{var cr187679_place_0 = frontend.common.missionary._LT__BANG_;
var cr187679_place_1 = frontend.worker.db_worker.init_sqlite_module_BANG_;
var cr187679_place_2 = (function (){var fexpr__187723 = cr187679_place_1;
return (fexpr__187723.cljs$core$IFn$_invoke$arity$0 ? fexpr__187723.cljs$core$IFn$_invoke$arity$0() : fexpr__187723.call(null));
})();
var cr187679_place_3 = (function (){var G__187725 = cr187679_place_2;
var fexpr__187724 = cr187679_place_0;
return (fexpr__187724.cljs$core$IFn$_invoke$arity$1 ? fexpr__187724.cljs$core$IFn$_invoke$arity$1(G__187725) : fexpr__187724.call(null,G__187725));
})();
(cr187679_state[(0)] = cr187679_block_1);

return missionary.core.park(cr187679_place_3);
}catch (e187722){var cr187679_exception = e187722;
(cr187679_state[(0)] = null);

throw cr187679_exception;
}});
var cr187679_block_5 = (function frontend$worker$db_worker$on_become_master_$_cr187679_block_5(cr187679_state){
try{var cr187679_place_27 = null;
(cr187679_state[(0)] = cr187679_block_6);

(cr187679_state[(2)] = cr187679_place_27);

return cr187679_state;
}catch (e187726){var cr187679_exception = e187726;
(cr187679_state[(0)] = null);

(cr187679_state[(2)] = null);

(cr187679_state[(1)] = null);

throw cr187679_exception;
}});
var cr187679_block_9 = (function frontend$worker$db_worker$on_become_master_$_cr187679_block_9(cr187679_state){
try{var cr187679_place_32 = missionary.core.unpark();
(cr187679_state[(0)] = null);

return cr187679_place_32;
}catch (e187727){var cr187679_exception = e187727;
(cr187679_state[(0)] = null);

throw cr187679_exception;
}});
return cloroutine.impl.coroutine((function (){var G__187728 = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1((3));
(G__187728[(0)] = cr187679_block_0);

return G__187728;
})());
})(),missionary.core.sp_run)));
});
frontend.worker.db_worker.broadcast_data_types = cljs.core.set(cljs.core.map.cljs$core$IFn$_invoke$arity$2(logseq.common.util.keyword__GT_string,new cljs.core.PersistentVector(null, 6, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"sync-db-changes","sync-db-changes",-1236993461),new cljs.core.Keyword(null,"notification","notification",-222338233),new cljs.core.Keyword(null,"log","log",-1595516004),new cljs.core.Keyword(null,"add-repo","add-repo",1885345931),new cljs.core.Keyword(null,"rtc-log","rtc-log",1926627661),new cljs.core.Keyword(null,"rtc-sync-state","rtc-sync-state",-661353236)], null)));
frontend.worker.db_worker._LT_init_service_BANG_ = (function frontend$worker$db_worker$_LT_init_service_BANG_(graph,start_opts){
var vec__187729 = cljs.core.deref(frontend.worker.db_worker._STAR_service);
var prev_graph = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__187729,(0),null);
var service = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__187729,(1),null);
var G__187732_187831 = prev_graph;
if((G__187732_187831 == null)){
} else {
frontend.worker.db_worker.close_db_BANG_(G__187732_187831);
}

if(cljs.core.truth_(graph)){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(graph,prev_graph)){
return service;
} else {
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41626__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.worker.shared_service._LT_create_service(graph,cljs_bean.core.__GT_js(frontend.worker.db_worker.fns),(function (){
return frontend.worker.db_worker.on_become_master(graph,start_opts);
}),frontend.worker.db_worker.broadcast_data_types,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"import?","import?",-40157302),new cljs.core.Keyword(null,"import-type?","import-type?",-1669494311).cljs$core$IFn$_invoke$arity$1(start_opts)], null))),(function (service__$1){
return promesa.protocols._mcat(promesa.protocols._promise(((promesa.core.promise_QMARK_(cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(service__$1,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"status","status",-1997798413),new cljs.core.Keyword(null,"ready","ready",1086465795)], null))))?null:(function(){throw (new Error("Assert failed: (p/promise? (get-in service [:status :ready]))"))})())),(function (___41594__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(cljs.core.reset_BANG_(frontend.worker.db_worker._STAR_service,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [graph,service__$1], null))),(function (___41594__auto____$1){
return promesa.protocols._promise(service__$1);
}));
}));
}));
}));
}
} else {
return null;
}
});
/**
 * web worker entry
 */
frontend.worker.db_worker.init = (function frontend$worker$db_worker$init(){
var proxy_object = cljs_bean.core.__GT_js(cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p__187733){
var vec__187734 = p__187733;
var k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__187734,(0),null);
var f = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__187734,(1),null);
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [k,(function() { 
var G__187832__delegate = function (args){
var vec__187737 = cljs.core.deref(frontend.worker.db_worker._STAR_service);
var _graph = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__187737,(0),null);
var service = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__187737,(1),null);
var method_k = cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(cljs.core.first(args));
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("thread-api","create-or-open-db","thread-api/create-or-open-db",1100871183),method_k)){
var vec__187740 = logseq.db.read_transit_str(cljs.core.last(args));
var graph = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__187740,(0),null);
var opts = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__187740,(1),null);
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41626__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.worker.db_worker._LT_init_service_BANG_(graph,opts)),(function (service__$1){
return promesa.protocols._mcat(promesa.protocols._promise(cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(service__$1,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"status","status",-1997798413),new cljs.core.Keyword(null,"ready","ready",1086465795)], null))),(function (___41594__auto__){
return promesa.protocols._promise(cljs.core.js_invoke.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword(null,"proxy","proxy",-117453614).cljs$core$IFn$_invoke$arity$1(service__$1),k,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([args], 0)));
}));
}));
}));
} else {
if(((cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("thread-api","sync-app-state","thread-api/sync-app-state",1507174044),null], null), null),method_k)) || ((service == null)))){
return cljs.core.apply.cljs$core$IFn$_invoke$arity$2(f,args);
} else {
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41626__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(service,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"status","status",-1997798413),new cljs.core.Keyword(null,"ready","ready",1086465795)], null))),(function (_ready_value){
return promesa.protocols._promise(cljs.core.js_invoke.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword(null,"proxy","proxy",-117453614).cljs$core$IFn$_invoke$arity$1(service),k,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([args], 0)));
}));
}));

}
}
};
var G__187832 = function (var_args){
var args = null;
if (arguments.length > 0) {
var G__187833__i = 0, G__187833__a = new Array(arguments.length -  0);
while (G__187833__i < G__187833__a.length) {G__187833__a[G__187833__i] = arguments[G__187833__i + 0]; ++G__187833__i;}
  args = new cljs.core.IndexedSeq(G__187833__a,0,null);
} 
return G__187832__delegate.call(this,args);};
G__187832.cljs$lang$maxFixedArity = 0;
G__187832.cljs$lang$applyTo = (function (arglist__187834){
var args = cljs.core.seq(arglist__187834);
return G__187832__delegate(args);
});
G__187832.cljs$core$IFn$_invoke$arity$variadic = G__187832__delegate;
return G__187832;
})()
], null);
}),frontend.worker.db_worker.fns)));
lambdaisland.glogi.console.install_BANG_();

frontend.worker.db_worker.check_worker_scope_BANG_();

frontend.worker.db_worker.outliner_register_op_handlers_BANG_();

frontend.worker.db_worker._LT_ratelimit_file_writes_BANG_();

setInterval((function (){
return self.postMessage("keepAliveResponse");
}),((1000) * (25)));

module$node_modules$comlink$dist$umd$comlink.expose(proxy_object);

var wrapped_main_thread_STAR_ = module$node_modules$comlink$dist$umd$comlink.wrap(self);
var wrapped_main_thread = (function() { 
var G__187835__delegate = function (qkw,direct_pass_args_QMARK_,args){
return promesa.core.chain.cljs$core$IFn$_invoke$arity$2(wrapped_main_thread_STAR_.remoteInvoke([cljs.core.namespace(qkw),"/",cljs.core.name(qkw)].join(''),direct_pass_args_QMARK_,(cljs.core.truth_(direct_pass_args_QMARK_)?cljs.core.into_array.cljs$core$IFn$_invoke$arity$1(args):logseq.db.write_transit_str(args))),logseq.db.read_transit_str);
};
var G__187835 = function (qkw,direct_pass_args_QMARK_,var_args){
var args = null;
if (arguments.length > 2) {
var G__187836__i = 0, G__187836__a = new Array(arguments.length -  2);
while (G__187836__i < G__187836__a.length) {G__187836__a[G__187836__i] = arguments[G__187836__i + 2]; ++G__187836__i;}
  args = new cljs.core.IndexedSeq(G__187836__a,0,null);
} 
return G__187835__delegate.call(this,qkw,direct_pass_args_QMARK_,args);};
G__187835.cljs$lang$maxFixedArity = 2;
G__187835.cljs$lang$applyTo = (function (arglist__187837){
var qkw = cljs.core.first(arglist__187837);
arglist__187837 = cljs.core.next(arglist__187837);
var direct_pass_args_QMARK_ = cljs.core.first(arglist__187837);
var args = cljs.core.rest(arglist__187837);
return G__187835__delegate(qkw,direct_pass_args_QMARK_,args);
});
G__187835.cljs$core$IFn$_invoke$arity$variadic = G__187835__delegate;
return G__187835;
})()
;
return cljs.core.reset_BANG_(frontend.worker.state._STAR_main_thread,wrapped_main_thread);
});

//# sourceMappingURL=frontend.worker.db_worker.js.map
