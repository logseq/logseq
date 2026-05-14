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
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___48218__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(cljs.core.deref(frontend.worker.db_worker._STAR_sqlite).installOpfsSAHPoolVfs(({"name": frontend.worker.util.get_pool_name(graph), "initialCapacity": (20)}))),(function (pool){
return promesa.protocols._mcat(promesa.protocols._promise(cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(frontend.worker.db_worker._STAR_opfs_pools,cljs.core.assoc,graph,pool)),(function (___48186__auto__){
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
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___48218__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(location.href),(function (href){
return promesa.protocols._mcat(promesa.protocols._promise(clojure.string.includes_QMARK_(href,"electron=true")),(function (electron_QMARK_){
return promesa.protocols._mcat(promesa.protocols._promise(clojure.string.includes_QMARK_(href,"publishing=true")),(function (publishing_QMARK_){
return promesa.protocols._mcat(promesa.protocols._promise(cljs.core.reset_BANG_(frontend.worker.db_worker._STAR_publishing_QMARK_,publishing_QMARK_)),(function (_){
return promesa.protocols._mcat(promesa.protocols._promise([cljs.core.str.cljs$core$IFn$_invoke$arity$1(self.location.protocol),"//",cljs.core.str.cljs$core$IFn$_invoke$arity$1(self.location.host)].join('')),(function (base_url){
return promesa.protocols._mcat(promesa.protocols._promise((cljs.core.truth_(electron_QMARK_)?(new URL("sqlite3.wasm",location.href)):[cljs.core.str.cljs$core$IFn$_invoke$arity$1(base_url),clojure.string.replace(self.location.pathname,"db-worker.js","")].join(''))),(function (sqlite_wasm_url){
return promesa.protocols._mcat(promesa.protocols._promise(module$node_modules$$logseq$sqlite_wasm$index_mjs.default(cljs.core.clj__GT_js(new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"url","url",276297046),sqlite_wasm_url,new cljs.core.Keyword(null,"print","print",1299562414),console.log,new cljs.core.Keyword(null,"printErr","printErr",-1323332006),console.error], null)))),(function (sqlite){
return promesa.protocols._mcat(promesa.protocols._promise(cljs.core.reset_BANG_(frontend.worker.db_worker._STAR_sqlite,sqlite)),(function (___48186__auto__){
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
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___48218__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.worker.db_worker._LT_get_opfs_pool(repo)),(function (pool){
return promesa.protocols._promise((cljs.core.truth_(pool)?pool.exportFile(frontend.worker.db_worker.repo_path):null));
}));
}));
});
frontend.worker.db_worker._LT_import_db = (function frontend$worker$db_worker$_LT_import_db(pool,data){
return pool.importDb(frontend.worker.db_worker.repo_path,data);
});
frontend.worker.db_worker.get_all_datoms_from_sqlite_db = (function frontend$worker$db_worker$get_all_datoms_from_sqlite_db(db){
var G__140129 = db.exec(({"sql": "select * from kvs", "rowMode": "array"}));
var G__140129__$1 = (((G__140129 == null))?null:cljs_bean.core.__GT_clj(G__140129));
var G__140129__$2 = (((G__140129__$1 == null))?null:cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (p__140130){
var vec__140131 = p__140130;
var _addr = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__140131,(0),null);
var content = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__140131,(1),null);
var _addresses = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__140131,(2),null);
var content_SINGLEQUOTE_ = logseq.db.sqlite.util.transit_read(content);
var datoms = ((cljs.core.map_QMARK_(content_SINGLEQUOTE_))?new cljs.core.Keyword(null,"keys","keys",1068423698).cljs$core$IFn$_invoke$arity$1(content_SINGLEQUOTE_):null);
return datoms;
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([G__140129__$1], 0)));
var G__140129__$3 = (((G__140129__$2 == null))?null:cljs.core.distinct.cljs$core$IFn$_invoke$arity$1(G__140129__$2));
if((G__140129__$3 == null)){
return null;
} else {
return cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p__140134){
var vec__140135 = p__140134;
var e = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__140135,(0),null);
var a = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__140135,(1),null);
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__140135,(2),null);
var t = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__140135,(3),null);
return (datascript.core.datom.cljs$core$IFn$_invoke$arity$4 ? datascript.core.datom.cljs$core$IFn$_invoke$arity$4(e,a,v,t) : datascript.core.datom.call(null,e,a,v,t));
}),G__140129__$3);
}
});
/**
 * Persistent-sorted-set has been broken, used addresses can't be found
 */
frontend.worker.db_worker.rebuild_db_from_datoms_BANG_ = (function frontend$worker$db_worker$rebuild_db_from_datoms_BANG_(datascript_conn,sqlite_db){
var datoms = frontend.worker.db_worker.get_all_datoms_from_sqlite_db(sqlite_db);
var db = datascript.core.init_db.cljs$core$IFn$_invoke$arity$3(cljs.core.PersistentVector.EMPTY,logseq.db.frontend.schema.schema,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"storage","storage",1867247511),datascript.storage.storage(cljs.core.deref(datascript_conn))], null));
var db__$1 = (function (){var G__140138 = db;
var G__140139 = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (d){
return new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","add","db/add",235286841),new cljs.core.Keyword(null,"e","e",1381269198).cljs$core$IFn$_invoke$arity$1(d),new cljs.core.Keyword(null,"a","a",-2123407586).cljs$core$IFn$_invoke$arity$1(d),new cljs.core.Keyword(null,"v","v",21465059).cljs$core$IFn$_invoke$arity$1(d),new cljs.core.Keyword(null,"t","t",-1397832519).cljs$core$IFn$_invoke$arity$1(d)], null);
}),datoms);
return (datascript.core.db_with.cljs$core$IFn$_invoke$arity$2 ? datascript.core.db_with.cljs$core$IFn$_invoke$arity$2(G__140138,G__140139) : datascript.core.db_with.call(null,G__140138,G__140139));
})();
cljs.core.prn.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"debug","debug",-1608172596),new cljs.core.Keyword(null,"rebuild-db-from-datoms","rebuild-db-from-datoms",1305615192),new cljs.core.Keyword(null,"datoms-count","datoms-count",-228436691),cljs.core.count(datoms)], 0));

var G__140140_140359 = new cljs.core.Keyword(null,"notification","notification",-222338233);
var G__140141_140360 = new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["The SQLite db will be exported to avoid any data-loss.",new cljs.core.Keyword(null,"warning","warning",-1685650671),false], null);
(frontend.worker.util.post_message.cljs$core$IFn$_invoke$arity$2 ? frontend.worker.util.post_message.cljs$core$IFn$_invoke$arity$2(G__140140_140359,G__140141_140360) : frontend.worker.util.post_message.call(null,G__140140_140359,G__140141_140360));

var G__140142_140361 = new cljs.core.Keyword(null,"export-current-db","export-current-db",-728527384);
var G__140143_140362 = cljs.core.PersistentVector.EMPTY;
(frontend.worker.util.post_message.cljs$core$IFn$_invoke$arity$2 ? frontend.worker.util.post_message.cljs$core$IFn$_invoke$arity$2(G__140142_140361,G__140143_140362) : frontend.worker.util.post_message.call(null,G__140142_140361,G__140143_140362));

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

var G__140144 = new cljs.core.Keyword(null,"notification","notification",-222338233);
var G__140145 = new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["The graph has been successfully rebuilt.",new cljs.core.Keyword(null,"success","success",1890645906),false], null);
return (frontend.worker.util.post_message.cljs$core$IFn$_invoke$arity$2 ? frontend.worker.util.post_message.cljs$core$IFn$_invoke$arity$2(G__140144,G__140145) : frontend.worker.util.post_message.call(null,G__140144,G__140145));
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
var seq__140146 = cljs.core.seq(data);
var chunk__140147 = null;
var count__140148 = (0);
var i__140149 = (0);
while(true){
if((i__140149 < count__140148)){
var item = chunk__140147.cljs$core$IIndexed$_nth$arity$2(null,i__140149);
tx.exec(({"sql": "INSERT INTO kvs (addr, content, addresses) values ($addr, $content, $addresses) on conflict(addr) do update set content = $content, addresses = $addresses", "bind": item}));


var G__140363 = seq__140146;
var G__140364 = chunk__140147;
var G__140365 = count__140148;
var G__140366 = (i__140149 + (1));
seq__140146 = G__140363;
chunk__140147 = G__140364;
count__140148 = G__140365;
i__140149 = G__140366;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__140146);
if(temp__5804__auto__){
var seq__140146__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__140146__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__140146__$1);
var G__140367 = cljs.core.chunk_rest(seq__140146__$1);
var G__140368 = c__5525__auto__;
var G__140369 = cljs.core.count(c__5525__auto__);
var G__140370 = (0);
seq__140146 = G__140367;
chunk__140147 = G__140368;
count__140148 = G__140369;
i__140149 = G__140370;
continue;
} else {
var item = cljs.core.first(seq__140146__$1);
tx.exec(({"sql": "INSERT INTO kvs (addr, content, addresses) values ($addr, $content, $addresses) on conflict(addr) do update set content = $content, addresses = $addresses", "bind": item}));


var G__140371 = cljs.core.next(seq__140146__$1);
var G__140372 = null;
var G__140373 = (0);
var G__140374 = (0);
seq__140146 = G__140371;
chunk__140147 = G__140372;
count__140148 = G__140373;
i__140149 = G__140374;
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
var vec__140150 = cljs_bean.core.__GT_clj(result);
var content = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__140150,(0),null);
var addresses = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__140150,(1),null);
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
frontend.worker.db_worker.t_frontend$worker$db_worker140153 = (function (db,meta140154){
this.db = db;
this.meta140154 = meta140154;
this.cljs$lang$protocol_mask$partition0$ = 393216;
this.cljs$lang$protocol_mask$partition1$ = 0;
});
(frontend.worker.db_worker.t_frontend$worker$db_worker140153.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = (function (_140155,meta140154__$1){
var self__ = this;
var _140155__$1 = this;
return (new frontend.worker.db_worker.t_frontend$worker$db_worker140153(self__.db,meta140154__$1));
}));

(frontend.worker.db_worker.t_frontend$worker$db_worker140153.prototype.cljs$core$IMeta$_meta$arity$1 = (function (_140155){
var self__ = this;
var _140155__$1 = this;
return self__.meta140154;
}));

(frontend.worker.db_worker.t_frontend$worker$db_worker140153.prototype.datascript$storage$IStorage$ = cljs.core.PROTOCOL_SENTINEL);

(frontend.worker.db_worker.t_frontend$worker$db_worker140153.prototype.datascript$storage$IStorage$_store$arity$3 = (function (_,addr_PLUS_data_seq,_delete_addrs){
var self__ = this;
var ___$1 = this;
var data = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p__140156){
var vec__140157 = p__140156;
var addr = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__140157,(0),null);
var data = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__140157,(1),null);
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

(frontend.worker.db_worker.t_frontend$worker$db_worker140153.prototype.datascript$storage$IStorage$_restore$arity$2 = (function (_,addr){
var self__ = this;
var ___$1 = this;
return frontend.worker.db_worker.restore_data_from_addr(self__.db,addr);
}));

(frontend.worker.db_worker.t_frontend$worker$db_worker140153.getBasis = (function (){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.with_meta(new cljs.core.Symbol(null,"db","db",-1661185010,null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),new cljs.core.Symbol(null,"Object","Object",61210754,null)], null)),new cljs.core.Symbol(null,"meta140154","meta140154",675340732,null)], null);
}));

(frontend.worker.db_worker.t_frontend$worker$db_worker140153.cljs$lang$type = true);

(frontend.worker.db_worker.t_frontend$worker$db_worker140153.cljs$lang$ctorStr = "frontend.worker.db-worker/t_frontend$worker$db_worker140153");

(frontend.worker.db_worker.t_frontend$worker$db_worker140153.cljs$lang$ctorPrWriter = (function (this__5287__auto__,writer__5288__auto__,opt__5289__auto__){
return cljs.core._write(writer__5288__auto__,"frontend.worker.db-worker/t_frontend$worker$db_worker140153");
}));

/**
 * Positional factory function for frontend.worker.db-worker/t_frontend$worker$db_worker140153.
 */
frontend.worker.db_worker.__GT_t_frontend$worker$db_worker140153 = (function frontend$worker$db_worker$__GT_t_frontend$worker$db_worker140153(db,meta140154){
return (new frontend.worker.db_worker.t_frontend$worker$db_worker140153(db,meta140154));
});


/**
 * Update sqlite-cli/new-sqlite-storage when making changes
 */
frontend.worker.db_worker.new_sqlite_storage = (function frontend$worker$db_worker$new_sqlite_storage(db){
return (new frontend.worker.db_worker.t_frontend$worker$db_worker140153(db,cljs.core.PersistentArrayMap.EMPTY));
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

var temp__5804__auto___140375 = frontend.worker.state.get_opfs_pool(repo);
if(cljs.core.truth_(temp__5804__auto___140375)){
var pool_140376 = temp__5804__auto___140375;
pool_140376.releaseAccessHandles();
} else {
}

return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$3(frontend.worker.db_worker._STAR_opfs_pools,cljs.core.dissoc,repo);
});
frontend.worker.db_worker.close_other_dbs_BANG_ = (function frontend$worker$db_worker$close_other_dbs_BANG_(repo){
var seq__140160 = cljs.core.seq(cljs.core.deref(frontend.worker.db_worker._STAR_sqlite_conns));
var chunk__140161 = null;
var count__140162 = (0);
var i__140163 = (0);
while(true){
if((i__140163 < count__140162)){
var vec__140172 = chunk__140161.cljs$core$IIndexed$_nth$arity$2(null,i__140163);
var r = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__140172,(0),null);
var map__140175 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__140172,(1),null);
var map__140175__$1 = cljs.core.__destructure_map(map__140175);
var db = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__140175__$1,new cljs.core.Keyword(null,"db","db",993250759));
var search = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__140175__$1,new cljs.core.Keyword(null,"search","search",1564939822));
var client_ops = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__140175__$1,new cljs.core.Keyword(null,"client-ops","client-ops",-1058023795));
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(repo,r)){
} else {
frontend.worker.db_worker.close_db_aux_BANG_(r,db,search,client_ops);
}


var G__140377 = seq__140160;
var G__140378 = chunk__140161;
var G__140379 = count__140162;
var G__140380 = (i__140163 + (1));
seq__140160 = G__140377;
chunk__140161 = G__140378;
count__140162 = G__140379;
i__140163 = G__140380;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__140160);
if(temp__5804__auto__){
var seq__140160__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__140160__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__140160__$1);
var G__140381 = cljs.core.chunk_rest(seq__140160__$1);
var G__140382 = c__5525__auto__;
var G__140383 = cljs.core.count(c__5525__auto__);
var G__140384 = (0);
seq__140160 = G__140381;
chunk__140161 = G__140382;
count__140162 = G__140383;
i__140163 = G__140384;
continue;
} else {
var vec__140176 = cljs.core.first(seq__140160__$1);
var r = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__140176,(0),null);
var map__140179 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__140176,(1),null);
var map__140179__$1 = cljs.core.__destructure_map(map__140179);
var db = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__140179__$1,new cljs.core.Keyword(null,"db","db",993250759));
var search = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__140179__$1,new cljs.core.Keyword(null,"search","search",1564939822));
var client_ops = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__140179__$1,new cljs.core.Keyword(null,"client-ops","client-ops",-1058023795));
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(repo,r)){
} else {
frontend.worker.db_worker.close_db_aux_BANG_(r,db,search,client_ops);
}


var G__140385 = cljs.core.next(seq__140160__$1);
var G__140386 = null;
var G__140387 = (0);
var G__140388 = (0);
seq__140160 = G__140385;
chunk__140161 = G__140386;
count__140162 = G__140387;
i__140163 = G__140388;
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
var map__140180 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(frontend.worker.db_worker._STAR_sqlite_conns),repo);
var map__140180__$1 = cljs.core.__destructure_map(map__140180);
var db = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__140180__$1,new cljs.core.Keyword(null,"db","db",993250759));
var search = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__140180__$1,new cljs.core.Keyword(null,"search","search",1564939822));
var client_ops = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__140180__$1,new cljs.core.Keyword(null,"client-ops","client-ops",-1058023795));
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
var G__140181_140389 = conn;
var G__140182_140390 = new_db_SINGLEQUOTE_;
var G__140183_140391 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"reset-conn!","reset-conn!",-325354379),true], null);
(datascript.core.reset_conn_BANG_.cljs$core$IFn$_invoke$arity$3 ? datascript.core.reset_conn_BANG_.cljs$core$IFn$_invoke$arity$3(G__140181_140389,G__140182_140390,G__140183_140391) : datascript.core.reset_conn_BANG_.call(null,G__140181_140389,G__140182_140390,G__140183_140391));

var G__140184 = conn;
var G__140185 = new cljs.core.Keyword(null,"schema","schema",-1582001791).cljs$core$IFn$_invoke$arity$1(new_db);
return (datascript.core.reset_schema_BANG_.cljs$core$IFn$_invoke$arity$2 ? datascript.core.reset_schema_BANG_.cljs$core$IFn$_invoke$arity$2(G__140184,G__140185) : datascript.core.reset_schema_BANG_.call(null,G__140184,G__140185));
} else {
return null;
}
});
frontend.worker.db_worker.get_dbs = (function frontend$worker$db_worker$get_dbs(repo){
if(cljs.core.truth_(cljs.core.deref(frontend.worker.db_worker._STAR_publishing_QMARK_))){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___48218__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(cljs.core.deref(frontend.worker.db_worker._STAR_sqlite).oo1.DB),(function (DB){
return promesa.protocols._mcat(promesa.protocols._promise((new DB("/db.sqlite","c"))),(function (db){
return promesa.protocols._mcat(promesa.protocols._promise((new DB("/search-db.sqlite","c"))),(function (search_db){
return promesa.protocols._promise(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [db,search_db], null));
}));
}));
}));
}));
} else {
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___48218__auto__){
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
frontend.worker.db_worker.gc_sqlite_dbs_BANG_ = (function frontend$worker$db_worker$gc_sqlite_dbs_BANG_(sqlite_db,client_ops_db,datascript_conn,p__140186){
var map__140187 = p__140186;
var map__140187__$1 = cljs.core.__destructure_map(map__140187);
var full_gc_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__140187__$1,new cljs.core.Keyword(null,"full-gc?","full-gc?",150271731));
var last_gc_at = new cljs.core.Keyword("kv","value","kv/value",305981670).cljs$core$IFn$_invoke$arity$1((function (){var G__140188 = cljs.core.deref(datascript_conn);
var G__140189 = new cljs.core.Keyword("logseq.kv","graph-last-gc-at","logseq.kv/graph-last-gc-at",13146990);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__140188,G__140189) : datascript.core.entity.call(null,G__140188,G__140189));
})());
if(cljs.core.truth_((function (){var or__5002__auto__ = full_gc_QMARK_;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return (((last_gc_at == null)) || ((((!(typeof last_gc_at === 'number'))) || (((logseq.common.util.time_ms() - last_gc_at) > ((((3) * (24)) * (3600)) * (1000)))))));
}
})())){
cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"debug","debug",-1608172596),"gc current graph"], 0));

var seq__140190_140392 = cljs.core.seq(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [sqlite_db,client_ops_db], null));
var chunk__140191_140393 = null;
var count__140192_140394 = (0);
var i__140193_140395 = (0);
while(true){
if((i__140193_140395 < count__140192_140394)){
var db_140396 = chunk__140191_140393.cljs$core$IIndexed$_nth$arity$2(null,i__140193_140395);
logseq.db.sqlite.gc.gc_kvs_table_BANG_(db_140396,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"full-gc?","full-gc?",150271731),full_gc_QMARK_], null));


var G__140397 = seq__140190_140392;
var G__140398 = chunk__140191_140393;
var G__140399 = count__140192_140394;
var G__140400 = (i__140193_140395 + (1));
seq__140190_140392 = G__140397;
chunk__140191_140393 = G__140398;
count__140192_140394 = G__140399;
i__140193_140395 = G__140400;
continue;
} else {
var temp__5804__auto___140401 = cljs.core.seq(seq__140190_140392);
if(temp__5804__auto___140401){
var seq__140190_140402__$1 = temp__5804__auto___140401;
if(cljs.core.chunked_seq_QMARK_(seq__140190_140402__$1)){
var c__5525__auto___140403 = cljs.core.chunk_first(seq__140190_140402__$1);
var G__140404 = cljs.core.chunk_rest(seq__140190_140402__$1);
var G__140405 = c__5525__auto___140403;
var G__140406 = cljs.core.count(c__5525__auto___140403);
var G__140407 = (0);
seq__140190_140392 = G__140404;
chunk__140191_140393 = G__140405;
count__140192_140394 = G__140406;
i__140193_140395 = G__140407;
continue;
} else {
var db_140408 = cljs.core.first(seq__140190_140402__$1);
logseq.db.sqlite.gc.gc_kvs_table_BANG_(db_140408,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"full-gc?","full-gc?",150271731),full_gc_QMARK_], null));


var G__140409 = cljs.core.next(seq__140190_140402__$1);
var G__140410 = null;
var G__140411 = (0);
var G__140412 = (0);
seq__140190_140392 = G__140409;
chunk__140191_140393 = G__140410;
count__140192_140394 = G__140411;
i__140193_140395 = G__140412;
continue;
}
} else {
}
}
break;
}

var G__140194 = datascript_conn;
var G__140195 = new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("db","ident","db/ident",-737096),new cljs.core.Keyword("logseq.kv","graph-last-gc-at","logseq.kv/graph-last-gc-at",13146990),new cljs.core.Keyword("kv","value","kv/value",305981670),logseq.common.util.time_ms()], null)], null);
return (datascript.core.transact_BANG_.cljs$core$IFn$_invoke$arity$2 ? datascript.core.transact_BANG_.cljs$core$IFn$_invoke$arity$2(G__140194,G__140195) : datascript.core.transact_BANG_.call(null,G__140194,G__140195));
} else {
return null;
}
});
frontend.worker.db_worker.create_or_open_db_BANG_ = (function frontend$worker$db_worker$create_or_open_db_BANG_(repo,p__140196){
var map__140197 = p__140196;
var map__140197__$1 = cljs.core.__destructure_map(map__140197);
var opts = map__140197__$1;
var config = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__140197__$1,new cljs.core.Keyword(null,"config","config",994861415));
var import_type = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__140197__$1,new cljs.core.Keyword(null,"import-type","import-type",-499283032));
var datoms = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__140197__$1,new cljs.core.Keyword(null,"datoms","datoms",-290874434));
if(cljs.core.truth_(frontend.worker.state.get_sqlite_conn.cljs$core$IFn$_invoke$arity$1(repo))){
return null;
} else {
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___48218__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.worker.db_worker.get_dbs(repo)),(function (p__140198){
var vec__140199 = p__140198;
var db = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__140199,(0),null);
var search_db = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__140199,(1),null);
var client_ops_db = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__140199,(2),null);
var dbs = vec__140199;
return promesa.protocols._mcat(promesa.protocols._promise(frontend.worker.db_worker.new_sqlite_storage(db)),(function (storage){
return promesa.protocols._mcat(promesa.protocols._promise((cljs.core.truth_(cljs.core.deref(frontend.worker.db_worker._STAR_publishing_QMARK_))?null:frontend.worker.db_worker.new_sqlite_storage(client_ops_db))),(function (client_ops_storage){
return promesa.protocols._mcat(promesa.protocols._promise(logseq.db.sqlite.util.db_based_graph_QMARK_(repo)),(function (db_based_QMARK_){
return promesa.protocols._mcat(promesa.protocols._promise(cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(frontend.worker.db_worker._STAR_sqlite_conns,cljs.core.assoc,repo,new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"db","db",993250759),db,new cljs.core.Keyword(null,"search","search",1564939822),search_db,new cljs.core.Keyword(null,"client-ops","client-ops",-1058023795),client_ops_db], null))),(function (___48186__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((function (){var seq__140202 = cljs.core.seq(dbs);
var chunk__140203 = null;
var count__140204 = (0);
var i__140205 = (0);
while(true){
if((i__140205 < count__140204)){
var db_SINGLEQUOTE_ = chunk__140203.cljs$core$IIndexed$_nth$arity$2(null,i__140205);
frontend.worker.db_worker.enable_sqlite_wal_mode_BANG_(db_SINGLEQUOTE_);


var G__140413 = seq__140202;
var G__140414 = chunk__140203;
var G__140415 = count__140204;
var G__140416 = (i__140205 + (1));
seq__140202 = G__140413;
chunk__140203 = G__140414;
count__140204 = G__140415;
i__140205 = G__140416;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__140202);
if(temp__5804__auto__){
var seq__140202__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__140202__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__140202__$1);
var G__140417 = cljs.core.chunk_rest(seq__140202__$1);
var G__140418 = c__5525__auto__;
var G__140419 = cljs.core.count(c__5525__auto__);
var G__140420 = (0);
seq__140202 = G__140417;
chunk__140203 = G__140418;
count__140204 = G__140419;
i__140205 = G__140420;
continue;
} else {
var db_SINGLEQUOTE_ = cljs.core.first(seq__140202__$1);
frontend.worker.db_worker.enable_sqlite_wal_mode_BANG_(db_SINGLEQUOTE_);


var G__140421 = cljs.core.next(seq__140202__$1);
var G__140422 = null;
var G__140423 = (0);
var G__140424 = (0);
seq__140202 = G__140421;
chunk__140203 = G__140422;
count__140204 = G__140423;
i__140205 = G__140424;
continue;
}
} else {
return null;
}
}
break;
}
})()),(function (___48186__auto____$1){
return promesa.protocols._mcat(promesa.protocols._promise(logseq.db.common.sqlite.create_kvs_table_BANG_(db)),(function (___48186__auto____$2){
return promesa.protocols._mcat(promesa.protocols._promise((cljs.core.truth_(cljs.core.deref(frontend.worker.db_worker._STAR_publishing_QMARK_))?null:logseq.db.common.sqlite.create_kvs_table_BANG_(client_ops_db))),(function (___48186__auto____$3){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.worker.db.migrate.migrate_sqlite_db(db)),(function (___48186__auto____$4){
return promesa.protocols._mcat(promesa.protocols._promise((cljs.core.truth_(cljs.core.deref(frontend.worker.db_worker._STAR_publishing_QMARK_))?null:frontend.worker.db.migrate.migrate_sqlite_db(client_ops_db))),(function (___48186__auto____$5){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.worker.search.create_tables_and_triggers_BANG_(search_db)),(function (___48186__auto____$6){
return promesa.protocols._promise((function (){var schema = logseq.db.get_schema(repo);
var conn = logseq.db.common.sqlite.get_storage_conn(storage,schema);
var _ = frontend.worker.db.fix.check_and_fix_schema_BANG_(repo,conn);
var ___$1 = (cljs.core.truth_(datoms)?(function (){var data = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (datom){
return new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","add","db/add",235286841),new cljs.core.Keyword(null,"e","e",1381269198).cljs$core$IFn$_invoke$arity$1(datom),new cljs.core.Keyword(null,"a","a",-2123407586).cljs$core$IFn$_invoke$arity$1(datom),new cljs.core.Keyword(null,"v","v",21465059).cljs$core$IFn$_invoke$arity$1(datom)], null);
}),datoms);
var G__140207 = conn;
var G__140208 = data;
var G__140209 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"initial-db?","initial-db?",-930665302),true], null);
return (datascript.core.transact_BANG_.cljs$core$IFn$_invoke$arity$3 ? datascript.core.transact_BANG_.cljs$core$IFn$_invoke$arity$3(G__140207,G__140208,G__140209) : datascript.core.transact_BANG_.call(null,G__140207,G__140208,G__140209));
})():null);
var client_ops_conn = (cljs.core.truth_(cljs.core.deref(frontend.worker.db_worker._STAR_publishing_QMARK_))?null:logseq.db.common.sqlite.get_storage_conn(client_ops_storage,frontend.worker.rtc.client_op.schema_in_db));
var initial_data_exists_QMARK_ = (((datoms == null))?(function (){var and__5000__auto__ = (function (){var G__140210 = cljs.core.deref(conn);
var G__140211 = new cljs.core.Keyword("logseq.class","Root","logseq.class/Root",273783827);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__140210,G__140211) : datascript.core.entity.call(null,G__140210,G__140211));
})();
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("db",new cljs.core.Keyword("kv","value","kv/value",305981670).cljs$core$IFn$_invoke$arity$1((function (){var G__140212 = cljs.core.deref(conn);
var G__140213 = new cljs.core.Keyword("logseq.kv","db-type","logseq.kv/db-type",1106888767);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__140212,G__140213) : datascript.core.entity.call(null,G__140212,G__140213));
})()));
} else {
return and__5000__auto__;
}
})():null);
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(frontend.worker.db_worker._STAR_datascript_conns,cljs.core.assoc,repo,conn);

cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(frontend.worker.db_worker._STAR_client_ops_conns,cljs.core.assoc,repo,client_ops_conn);

if(((cljs.core.not(cljs.core.deref(frontend.worker.db_worker._STAR_publishing_QMARK_))) && (cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(frontend.worker.rtc.client_op.schema_in_db,(function (){var G__140214 = cljs.core.deref(client_ops_conn);
return (datascript.core.schema.cljs$core$IFn$_invoke$arity$1 ? datascript.core.schema.cljs$core$IFn$_invoke$arity$1(G__140214) : datascript.core.schema.call(null,G__140214));
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
var config_140425__$1 = (function (){var or__5002__auto__ = config;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return "";
}
})();
var initial_data_140426 = logseq.db.sqlite.create_graph.build_db_initial_data.cljs$core$IFn$_invoke$arity$variadic(config_140425__$1,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.select_keys(opts,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"import-type","import-type",-499283032),new cljs.core.Keyword(null,"graph-git-sha","graph-git-sha",-266655130)], null))], 0));
var G__140215_140427 = conn;
var G__140216_140428 = initial_data_140426;
var G__140217_140429 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"initial-db?","initial-db?",-930665302),true], null);
(datascript.core.transact_BANG_.cljs$core$IFn$_invoke$arity$3 ? datascript.core.transact_BANG_.cljs$core$IFn$_invoke$arity$3(G__140215_140427,G__140216_140428,G__140217_140429) : datascript.core.transact_BANG_.call(null,G__140215_140427,G__140216_140428,G__140217_140429));
} else {
}

frontend.worker.db_worker.gc_sqlite_dbs_BANG_(db,client_ops_db,conn,cljs.core.PersistentArrayMap.EMPTY);

if(cljs.core.truth_(import_type)){
} else {
var temp__5804__auto___140430 = cljs.core.seq(logseq.db.sqlite.debug.find_missing_addresses(db));
if(temp__5804__auto___140430){
var missing_addresses_140431 = temp__5804__auto___140430;
var version_in_db_140432 = (cljs.core.truth_(conn)?logseq.db.frontend.schema.parse_schema_version((function (){var or__5002__auto__ = new cljs.core.Keyword("kv","value","kv/value",305981670).cljs$core$IFn$_invoke$arity$1((function (){var G__140218 = cljs.core.deref(conn);
var G__140219 = new cljs.core.Keyword("logseq.kv","schema-version","logseq.kv/schema-version",-1467606676);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__140218,G__140219) : datascript.core.entity.call(null,G__140218,G__140219));
})());
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return (0);
}
})()):null);
var compare_result_140433 = (cljs.core.truth_(version_in_db_140432)?logseq.db.frontend.schema.compare_schema_version(version_in_db_140432,"64.8"):null);
if(cljs.core.truth_((function (){var and__5000__auto__ = compare_result_140433;
if(cljs.core.truth_(and__5000__auto__)){
return (!((compare_result_140433 < (0))));
} else {
return and__5000__auto__;
}
})())){
var G__140220_140434 = new cljs.core.Keyword(null,"capture-error","capture-error",583122432);
var G__140221_140435 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"error","error",-978969032),"db-missing-addresses-v2",new cljs.core.Keyword(null,"payload","payload",-383036092),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"missing-addresses","missing-addresses",945342471),cljs.core.str.cljs$core$IFn$_invoke$arity$1(missing_addresses_140431),new cljs.core.Keyword(null,"db-schema-version","db-schema-version",-1168427088),cljs.core.str.cljs$core$IFn$_invoke$arity$1(version_in_db_140432)], null)], null);
(frontend.worker.util.post_message.cljs$core$IFn$_invoke$arity$2 ? frontend.worker.util.post_message.cljs$core$IFn$_invoke$arity$2(G__140220_140434,G__140221_140435) : frontend.worker.util.post_message.call(null,G__140220_140434,G__140221_140435));
} else {
}

var G__140222_140436 = new cljs.core.Keyword(null,"notification","notification",-222338233);
var G__140223_140437 = new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["It seems that the DB has been broken. Please run the command `Fix current broken graph`.",new cljs.core.Keyword(null,"error","error",-978969032),false], null);
(frontend.worker.util.post_message.cljs$core$IFn$_invoke$arity$2 ? frontend.worker.util.post_message.cljs$core$IFn$_invoke$arity$2(G__140222_140436,G__140223_140437) : frontend.worker.util.post_message.call(null,G__140222_140436,G__140223_140437));

throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2("DB missing addresses",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"missing-addresses","missing-addresses",945342471),missing_addresses_140431], null));
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
return promesa.core.create.cljs$core$IFn$_invoke$arity$1((function (resolve_fn_140228,reject_fn_140227){
var loop_fn_140224 = (function frontend$worker$db_worker$iter__GT_vec_$_loop_fn_140224(acc){
return promesa.core.fnly.cljs$core$IFn$_invoke$arity$2((function (res_140225,err_140226){
if((!((err_140226 == null)))){
return (reject_fn_140227.cljs$core$IFn$_invoke$arity$1 ? reject_fn_140227.cljs$core$IFn$_invoke$arity$1(err_140226) : reject_fn_140227.call(null,err_140226));
} else {
if(promesa.core.recur_QMARK_(res_140225)){
promesa.exec.run_BANG_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"vthread","vthread",441141075),promesa.exec.wrap_bindings((function (){
return cljs.core.apply.cljs$core$IFn$_invoke$arity$2(frontend$worker$db_worker$iter__GT_vec_$_loop_fn_140224,new cljs.core.Keyword(null,"bindings","bindings",1271397192).cljs$core$IFn$_invoke$arity$1(res_140225));
})));

return null;
} else {
return (resolve_fn_140228.cljs$core$IFn$_invoke$arity$1 ? resolve_fn_140228.cljs$core$IFn$_invoke$arity$1(res_140225) : resolve_fn_140228.call(null,res_140225));
}
}
}),promesa.protocols._mcat(promesa.protocols._promise(null),(function (___48218__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(acc),(function (acc__$1){
return promesa.protocols._promise(promesa.protocols._mcat(promesa.protocols._promise(null),(function (___48218__auto____$1){
return promesa.protocols._mcat(promesa.protocols._promise(iter_SINGLEQUOTE_.next()),(function (elem){
return promesa.protocols._promise((cljs.core.truth_(elem.done)?acc__$1:promesa.core.__GT_Recur(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.conj.cljs$core$IFn$_invoke$arity$2(acc__$1,elem.value)], null))));
}));
})));
}));
})));
});
return promesa.exec.run_BANG_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"vthread","vthread",441141075),promesa.exec.wrap_bindings((function (){
return loop_fn_140224(cljs.core.PersistentVector.EMPTY);
})));
}));
} else {
return null;
}
});
frontend.worker.db_worker._LT_list_all_dbs = (function frontend$worker$db_worker$_LT_list_all_dbs(){
var dir_QMARK_ = (function (p1__140230_SHARP_){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(p1__140230_SHARP_.kind,"directory");
});
var db_dir_prefix = ".logseq-pool-";
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___48218__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(navigator.storage.getDirectory()),(function (root){
return promesa.protocols._mcat(promesa.protocols._promise(((dir_QMARK_(root))?root.values():null)),(function (values_iter){
return promesa.protocols._mcat(promesa.protocols._promise((cljs.core.truth_(values_iter)?frontend.worker.db_worker.iter__GT_vec(values_iter):null)),(function (values){
return promesa.protocols._mcat(promesa.protocols._promise(cljs.core.filter.cljs$core$IFn$_invoke$arity$2(dir_QMARK_,values)),(function (current_dir_dirs){
return promesa.protocols._mcat(promesa.protocols._promise(cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (file){
return clojure.string.starts_with_QMARK_(file.name,db_dir_prefix);
}),current_dir_dirs)),(function (db_dirs){
return promesa.protocols._mcat(promesa.protocols._promise(cljs.core.prn.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"debug","debug",-1608172596),new cljs.core.Keyword(null,"db-dirs","db-dirs",2052953020),cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__140231_SHARP_){
return p1__140231_SHARP_.name;
}),db_dirs),new cljs.core.Keyword(null,"all-dirs","all-dirs",2002652916),cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__140232_SHARP_){
return p1__140232_SHARP_.name;
}),current_dir_dirs)], 0))),(function (___48186__auto__){
return promesa.protocols._promise(promesa.core.all(cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (dir){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___48218__auto____$1){
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
return promesa.core.catch$.cljs$core$IFn$_invoke$arity$2(promesa.protocols._mcat(promesa.protocols._promise(null),(function (___48218__auto__){
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
frontend.worker.db_worker.start_db_BANG_ = (function frontend$worker$db_worker$start_db_BANG_(repo,p__140236){
var map__140237 = p__140236;
var map__140237__$1 = cljs.core.__destructure_map(map__140237);
var opts = map__140237__$1;
var close_other_db_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__140237__$1,new cljs.core.Keyword(null,"close-other-db?","close-other-db?",-1978674579),true);
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___48196__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((cljs.core.truth_(close_other_db_QMARK_)?frontend.worker.db_worker.close_other_dbs_BANG_(repo):null)),(function (___48186__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((cljs.core.truth_(cljs.core.deref(frontend.worker.shared_service._STAR_master_client_QMARK_))?frontend.worker.db_worker.create_or_open_db_BANG_(repo,cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(opts,new cljs.core.Keyword(null,"close-other-db?","close-other-db?",-1978674579))):null)),(function (___48186__auto____$1){
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
var G__140238 = eid;
var G__140238__$1 = (((G__140238 == null))?null:(function (){var G__140239 = cljs.core.deref(conn);
var G__140240 = selector;
var G__140241 = G__140238;
return (datascript.core.pull.cljs$core$IFn$_invoke$arity$3 ? datascript.core.pull.cljs$core$IFn$_invoke$arity$3(G__140239,G__140240,G__140241) : datascript.core.pull.call(null,G__140239,G__140240,G__140241));
})());
if((G__140238__$1 == null)){
return null;
} else {
return logseq.db.common.initial_data.with_parent(cljs.core.deref(conn),G__140238__$1);
}
} else {
return null;
}
})));
frontend.worker.db_worker._STAR_get_blocks_cache = cljs.core.volatile_BANG_(cljs.cache.lru_cache_factory.cljs$core$IFn$_invoke$arity$variadic(cljs.core.PersistentArrayMap.EMPTY,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"threshold","threshold",204221583),(1000)], 0)));
frontend.worker.db_worker.get_blocks_with_cache = frontend.common.cache.cache_fn(frontend.worker.db_worker._STAR_get_blocks_cache,(function (repo,requests){
var db = (function (){var G__140242 = frontend.worker.state.get_datascript_conn(repo);
if((G__140242 == null)){
return null;
} else {
return cljs.core.deref(G__140242);
}
})();
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [repo,new cljs.core.Keyword(null,"max-tx","max-tx",1119558339).cljs$core$IFn$_invoke$arity$1(db),requests], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [db,requests], null)], null);
}),(function (db,requests){
if(cljs.core.truth_(db)){
return cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (p__140243){
var map__140244 = p__140243;
var map__140244__$1 = cljs.core.__destructure_map(map__140244);
var id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__140244__$1,new cljs.core.Keyword(null,"id","id",-1388402092));
var opts = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__140244__$1,new cljs.core.Keyword(null,"opts","opts",155075701));
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
var G__140245 = cljs.core.deref(conn);
var G__140246 = id;
return (logseq.db.get_block_refs_count.cljs$core$IFn$_invoke$arity$2 ? logseq.db.get_block_refs_count.cljs$core$IFn$_invoke$arity$2(G__140245,G__140246) : logseq.db.get_block_refs_count.call(null,G__140245,G__140246));
} else {
return null;
}
})));
frontend.common.thread_api._STAR_thread_apis.cljs$core$IVolatile$_vreset_BANG_$arity$2(null,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(frontend.common.thread_api._STAR_thread_apis.cljs$core$IDeref$_deref$arity$1(null),new cljs.core.Keyword("thread-api","block-refs-check","thread-api/block-refs-check",-41022236),(function frontend$worker$db_worker$thread_api__block_refs_check(repo,id,p__140247){
var map__140248 = p__140247;
var map__140248__$1 = cljs.core.__destructure_map(map__140248);
var unlinked_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__140248__$1,new cljs.core.Keyword(null,"unlinked?","unlinked?",440907520));
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
var refs = cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","id","db/id",-1388397098),new cljs.core.Keyword("block","refs","block/refs",-1214495349).cljs$core$IFn$_invoke$arity$1((function (){var G__140249 = db;
var G__140250 = new cljs.core.Keyword(null,"e","e",1381269198).cljs$core$IFn$_invoke$arity$1(d);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__140249,G__140250) : datascript.core.entity.call(null,G__140249,G__140250));
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
return ((function (){var G__140251 = db;
var G__140252 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block);
return (logseq.db.get_block_refs_count.cljs$core$IFn$_invoke$arity$2 ? logseq.db.get_block_refs_count.cljs$core$IFn$_invoke$arity$2(G__140251,G__140252) : logseq.db.get_block_refs_count.call(null,G__140251,G__140252));
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
var block_id = new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1((function (){var G__140253 = cljs.core.deref(conn);
var G__140254 = id;
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__140253,G__140254) : datascript.core.entity.call(null,G__140253,G__140254));
})());
return cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (b){
var G__140255 = cljs.core.deref(conn);
var G__140256 = new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"*","*",345799209,null)], null);
var G__140257 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(b);
return (datascript.core.pull.cljs$core$IFn$_invoke$arity$3 ? datascript.core.pull.cljs$core$IFn$_invoke$arity$3(G__140255,G__140256,G__140257) : datascript.core.pull.call(null,G__140255,G__140256,G__140257));
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
var tx_meta_SINGLEQUOTE_ = (function (){var G__140259 = tx_meta;
var G__140259__$1 = ((((cljs.core.not(new cljs.core.Keyword("whiteboard","transact?","whiteboard/transact?",-1793205629).cljs$core$IFn$_invoke$arity$1(tx_meta))) && (cljs.core.not(new cljs.core.Keyword(null,"rtc-download-graph?","rtc-download-graph?",-1013530237).cljs$core$IFn$_invoke$arity$1(tx_meta)))))?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__140259,new cljs.core.Keyword(null,"skip-store?","skip-store?",-484019625),true):G__140259);
return cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(G__140259__$1,new cljs.core.Keyword(null,"insert-blocks?","insert-blocks?",-393496700));

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
var k__67652__auto___140438 = "Worker db transact";
console.time(k__67652__auto___140438);

var res__67653__auto___140439 = logseq.db.transact_BANG_.cljs$core$IFn$_invoke$arity$3(conn,tx_data_SINGLEQUOTE_,tx_meta_SINGLEQUOTE_);
console.timeEnd(k__67652__auto___140438);

} else {
logseq.db.transact_BANG_.cljs$core$IFn$_invoke$arity$3(conn,tx_data_SINGLEQUOTE_,tx_meta_SINGLEQUOTE_);
}
}

return null;
}catch (e140258){var e = e140258;
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
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___48218__auto__){
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
var temp__5804__auto___140440 = frontend.worker.state.get_sqlite_conn.cljs$core$IFn$_invoke$arity$2(repo,new cljs.core.Keyword(null,"db","db",993250759));
if(cljs.core.truth_(temp__5804__auto___140440)){
var db_140441 = temp__5804__auto___140440;
db_140441.exec("PRAGMA wal_checkpoint(2)");
} else {
}

return frontend.worker.db_worker._LT_export_db_file(repo);
})));
frontend.common.thread_api._STAR_thread_apis.cljs$core$IVolatile$_vreset_BANG_$arity$2(null,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(frontend.common.thread_api._STAR_thread_apis.cljs$core$IDeref$_deref$arity$1(null),new cljs.core.Keyword("thread-api","import-db","thread-api/import-db",-966513630),(function frontend$worker$db_worker$thread_api__import_db(repo,data){
if(clojure.string.blank_QMARK_(repo)){
return null;
} else {
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___48218__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.worker.db_worker._LT_get_opfs_pool(repo)),(function (pool){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.worker.db_worker._LT_import_db(pool,data)),(function (___48186__auto__){
return promesa.protocols._promise(null);
}));
}));
}));
}
})));
frontend.common.thread_api._STAR_thread_apis.cljs$core$IVolatile$_vreset_BANG_$arity$2(null,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(frontend.common.thread_api._STAR_thread_apis.cljs$core$IDeref$_deref$arity$1(null),new cljs.core.Keyword("thread-api","search-blocks","thread-api/search-blocks",1217984294),(function frontend$worker$db_worker$thread_api__search_blocks(repo,q,option){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___48218__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.worker.db_worker.get_search_db(repo)),(function (search_db){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.worker.state.get_datascript_conn(repo)),(function (conn){
return promesa.protocols._promise(frontend.worker.search.search_blocks(repo,conn,search_db,q,option));
}));
}));
}));
})));
frontend.common.thread_api._STAR_thread_apis.cljs$core$IVolatile$_vreset_BANG_$arity$2(null,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(frontend.common.thread_api._STAR_thread_apis.cljs$core$IDeref$_deref$arity$1(null),new cljs.core.Keyword("thread-api","search-upsert-blocks","thread-api/search-upsert-blocks",802527035),(function frontend$worker$db_worker$thread_api__search_upsert_blocks(repo,blocks){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___48218__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.worker.db_worker.get_search_db(repo)),(function (db){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.worker.search.upsert_blocks_BANG_(db,cljs_bean.core.__GT_js(blocks))),(function (___48186__auto__){
return promesa.protocols._promise(null);
}));
}));
}));
})));
frontend.common.thread_api._STAR_thread_apis.cljs$core$IVolatile$_vreset_BANG_$arity$2(null,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(frontend.common.thread_api._STAR_thread_apis.cljs$core$IDeref$_deref$arity$1(null),new cljs.core.Keyword("thread-api","search-delete-blocks","thread-api/search-delete-blocks",2049847839),(function frontend$worker$db_worker$thread_api__search_delete_blocks(repo,ids){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___48218__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.worker.db_worker.get_search_db(repo)),(function (db){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.worker.search.delete_blocks_BANG_(db,ids)),(function (___48186__auto__){
return promesa.protocols._promise(null);
}));
}));
}));
})));
frontend.common.thread_api._STAR_thread_apis.cljs$core$IVolatile$_vreset_BANG_$arity$2(null,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(frontend.common.thread_api._STAR_thread_apis.cljs$core$IDeref$_deref$arity$1(null),new cljs.core.Keyword("thread-api","search-truncate-tables","thread-api/search-truncate-tables",-2046581559),(function frontend$worker$db_worker$thread_api__search_truncate_tables(repo){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___48218__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.worker.db_worker.get_search_db(repo)),(function (db){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.worker.search.truncate_table_BANG_(db)),(function (___48186__auto__){
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
var k__67652__auto__ = "apply outliner ops";
console.time(k__67652__auto__);

var res__67653__auto__ = logseq.outliner.op.apply_ops_BANG_(repo,conn,ops,frontend.worker.state.get_date_formatter(repo),opts);
console.timeEnd(k__67652__auto__);

return res__67653__auto__;
} else {
return logseq.outliner.op.apply_ops_BANG_(repo,conn,ops,frontend.worker.state.get_date_formatter(repo),opts);
}
}catch (e140260){var e = e140260;
var data = cljs.core.ex_data(e);
var map__140261 = ((cljs.core.map_QMARK_(data))?data:null);
var map__140261__$1 = cljs.core.__destructure_map(map__140261);
var type = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__140261__$1,new cljs.core.Keyword(null,"type","type",1174270348));
var payload = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__140261__$1,new cljs.core.Keyword(null,"payload","payload",-383036092));
var G__140262 = type;
var G__140262__$1 = (((G__140262 instanceof cljs.core.Keyword))?G__140262.fqn:null);
switch (G__140262__$1) {
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
return cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (p__140263){
var vec__140264 = p__140263;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__140264,(0),null);
var pid = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__140264,(1),null);
var G__140267 = cljs.core.deref(conn);
var G__140268 = pid;
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__140267,G__140268) : datascript.core.entity.call(null,G__140267,G__140268));
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
}catch (e140269){var e = e140269;
console.error("export-edn error: ",e);

var G__140270_140443 = new cljs.core.Keyword(null,"notification","notification",-222338233);
var G__140271_140444 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["An unexpected error occurred during export. See the javascript console for details.",new cljs.core.Keyword(null,"error","error",-978969032)], null);
(frontend.worker.util.post_message.cljs$core$IFn$_invoke$arity$2 ? frontend.worker.util.post_message.cljs$core$IFn$_invoke$arity$2(G__140270_140443,G__140271_140444) : frontend.worker.util.post_message.call(null,G__140270_140443,G__140271_140444));

return new cljs.core.Keyword(null,"export-edn-error","export-edn-error",867881458);
}})));
frontend.common.thread_api._STAR_thread_apis.cljs$core$IVolatile$_vreset_BANG_$arity$2(null,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(frontend.common.thread_api._STAR_thread_apis.cljs$core$IDeref$_deref$arity$1(null),new cljs.core.Keyword("thread-api","get-view-data","thread-api/get-view-data",1976013429),(function frontend$worker$db_worker$thread_api__get_view_data(repo,view_id,option){
var db = cljs.core.deref(frontend.worker.state.get_datascript_conn(repo));
return logseq.db.common.view.get_view_data(db,view_id,option);
})));
frontend.common.thread_api._STAR_thread_apis.cljs$core$IVolatile$_vreset_BANG_$arity$2(null,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(frontend.common.thread_api._STAR_thread_apis.cljs$core$IDeref$_deref$arity$1(null),new cljs.core.Keyword("thread-api","get-property-values","thread-api/get-property-values",60992180),(function frontend$worker$db_worker$thread_api__get_property_values(repo,p__140272){
var map__140273 = p__140272;
var map__140273__$1 = cljs.core.__destructure_map(map__140273);
var option = map__140273__$1;
var property_ident = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__140273__$1,new cljs.core.Keyword(null,"property-ident","property-ident",697145839));
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
var map__140274 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(frontend.worker.db_worker._STAR_sqlite_conns),repo);
var map__140274__$1 = cljs.core.__destructure_map(map__140274);
var db = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__140274__$1,new cljs.core.Keyword(null,"db","db",993250759));
var client_ops = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__140274__$1,new cljs.core.Keyword(null,"client-ops","client-ops",-1058023795));
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
var error_handler = (function (p__140276){
var map__140277 = p__140276;
var map__140277__$1 = cljs.core.__destructure_map(map__140277);
var msg = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__140277__$1,new cljs.core.Keyword(null,"msg","msg",-1386103444));
var G__140278 = new cljs.core.Keyword(null,"notification","notification",-222338233);
var G__140279 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"p","p",151049309),msg], null)], null),new cljs.core.Keyword(null,"error","error",-978969032)], null);
return (frontend.worker.util.post_message.cljs$core$IFn$_invoke$arity$2 ? frontend.worker.util.post_message.cljs$core$IFn$_invoke$arity$2(G__140278,G__140279) : frontend.worker.util.post_message.call(null,G__140278,G__140279));
});
return frontend.worker.handler.page.delete_BANG_.cljs$core$IFn$_invoke$arity$variadic(repo,conn,page_uuid,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"error-handler","error-handler",-484945776),error_handler], null)], 0));
});
frontend.worker.db_worker.create_page_BANG_ = (function frontend$worker$db_worker$create_page_BANG_(repo,conn,title,options){
var config = frontend.worker.state.get_config(repo);
return frontend.worker.handler.page.create_BANG_.cljs$core$IFn$_invoke$arity$variadic(repo,conn,config,title,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([options], 0));
});
frontend.worker.db_worker.outliner_register_op_handlers_BANG_ = (function frontend$worker$db_worker$outliner_register_op_handlers_BANG_(){
return logseq.outliner.op.register_op_handlers_BANG_(new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"create-page","create-page",-1352656443),(function (repo,conn,p__140280){
var vec__140281 = p__140280;
var title = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__140281,(0),null);
var options = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__140281,(1),null);
return frontend.worker.db_worker.create_page_BANG_(repo,conn,title,options);
}),new cljs.core.Keyword(null,"rename-page","rename-page",-2094129371),(function (repo,conn,p__140284){
var vec__140285 = p__140284;
var page_uuid = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__140285,(0),null);
var new_name = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__140285,(1),null);
return frontend.worker.db_worker.rename_page_BANG_(repo,conn,page_uuid,new_name);
}),new cljs.core.Keyword(null,"delete-page","delete-page",-1371381770),(function (repo,conn,p__140288){
var vec__140289 = p__140288;
var page_uuid = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__140289,(0),null);
return frontend.worker.db_worker.delete_page_BANG_(repo,conn,page_uuid);
})], null));
});
frontend.worker.db_worker._LT_ratelimit_file_writes_BANG_ = (function frontend$worker$db_worker$_LT_ratelimit_file_writes_BANG_(){
return frontend.worker.file._LT_ratelimit_file_writes_BANG_((function (col){
if(cljs.core.seq(col)){
var repo = cljs.core.ffirst(col);
var conn = frontend.worker.state.get_datascript_conn(repo);
if(cljs.core.truth_(conn)){
if(cljs.core.truth_((function (){var G__140292 = cljs.core.deref(conn);
return (logseq.db.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(G__140292) : logseq.db.db_based_graph_QMARK_.call(null,G__140292));
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
return (new Promise(cljs.core.partial.cljs$core$IFn$_invoke$arity$2((function (){var cr140293_block_2 = (function frontend$worker$db_worker$on_become_master_$_cr140293_block_2(cr140293_state){
try{var cr140293_place_9 = frontend.common.missionary._LT__BANG_;
var cr140293_place_10 = frontend.worker.db_worker.start_db_BANG_;
var cr140293_place_11 = repo;
var cr140293_place_12 = start_opts;
var cr140293_place_13 = (function (){var G__140320 = cr140293_place_11;
var G__140321 = cr140293_place_12;
var fexpr__140319 = cr140293_place_10;
return (fexpr__140319.cljs$core$IFn$_invoke$arity$2 ? fexpr__140319.cljs$core$IFn$_invoke$arity$2(G__140320,G__140321) : fexpr__140319.call(null,G__140320,G__140321));
})();
var cr140293_place_14 = (function (){var G__140323 = cr140293_place_13;
var fexpr__140322 = cr140293_place_9;
return (fexpr__140322.cljs$core$IFn$_invoke$arity$1 ? fexpr__140322.cljs$core$IFn$_invoke$arity$1(G__140323) : fexpr__140322.call(null,G__140323));
})();
(cr140293_state[(0)] = cr140293_block_3);

return missionary.core.park(cr140293_place_14);
}catch (e140318){var cr140293_exception = e140318;
(cr140293_state[(0)] = null);

(cr140293_state[(1)] = null);

throw cr140293_exception;
}});
var cr140293_block_7 = (function frontend$worker$db_worker$on_become_master_$_cr140293_block_7(cr140293_state){
try{var cr140293_place_28 = null;
(cr140293_state[(0)] = cr140293_block_8);

(cr140293_state[(1)] = cr140293_place_28);

return cr140293_state;
}catch (e140324){var cr140293_exception = e140324;
(cr140293_state[(0)] = null);

(cr140293_state[(1)] = null);

throw cr140293_exception;
}});
var cr140293_block_3 = (function frontend$worker$db_worker$on_become_master_$_cr140293_block_3(cr140293_state){
try{var cr140293_place_15 = missionary.core.unpark();
var cr140293_place_16 = cljs.core.not;
var cr140293_place_17 = frontend.worker.state.get_datascript_conn;
var cr140293_place_18 = repo;
var cr140293_place_19 = (function (){var G__140327 = cr140293_place_18;
var fexpr__140326 = cr140293_place_17;
return (fexpr__140326.cljs$core$IFn$_invoke$arity$1 ? fexpr__140326.cljs$core$IFn$_invoke$arity$1(G__140327) : fexpr__140326.call(null,G__140327));
})();
var cr140293_place_20 = null;
var cr140293_place_21 = (cr140293_place_19 == cr140293_place_20);
var cr140293_place_22 = (function (){var G__140329 = cr140293_place_21;
var fexpr__140328 = cr140293_place_16;
return (fexpr__140328.cljs$core$IFn$_invoke$arity$1 ? fexpr__140328.cljs$core$IFn$_invoke$arity$1(G__140329) : fexpr__140328.call(null,G__140329));
})();
var cr140293_place_23 = null;
if(cljs.core.truth_(cr140293_place_22)){
(cr140293_state[(0)] = cr140293_block_5);

(cr140293_state[(2)] = cr140293_place_23);

return cr140293_state;
} else {
(cr140293_state[(0)] = cr140293_block_4);

(cr140293_state[(1)] = null);

return cr140293_state;
}
}catch (e140325){var cr140293_exception = e140325;
(cr140293_state[(0)] = null);

(cr140293_state[(1)] = null);

throw cr140293_exception;
}});
var cr140293_block_9 = (function frontend$worker$db_worker$on_become_master_$_cr140293_block_9(cr140293_state){
try{var cr140293_place_32 = missionary.core.unpark();
(cr140293_state[(0)] = null);

return cr140293_place_32;
}catch (e140330){var cr140293_exception = e140330;
(cr140293_state[(0)] = null);

throw cr140293_exception;
}});
var cr140293_block_0 = (function frontend$worker$db_worker$on_become_master_$_cr140293_block_0(cr140293_state){
try{var cr140293_place_0 = frontend.common.missionary._LT__BANG_;
var cr140293_place_1 = frontend.worker.db_worker.init_sqlite_module_BANG_;
var cr140293_place_2 = (function (){var fexpr__140332 = cr140293_place_1;
return (fexpr__140332.cljs$core$IFn$_invoke$arity$0 ? fexpr__140332.cljs$core$IFn$_invoke$arity$0() : fexpr__140332.call(null));
})();
var cr140293_place_3 = (function (){var G__140334 = cr140293_place_2;
var fexpr__140333 = cr140293_place_0;
return (fexpr__140333.cljs$core$IFn$_invoke$arity$1 ? fexpr__140333.cljs$core$IFn$_invoke$arity$1(G__140334) : fexpr__140333.call(null,G__140334));
})();
(cr140293_state[(0)] = cr140293_block_1);

return missionary.core.park(cr140293_place_3);
}catch (e140331){var cr140293_exception = e140331;
(cr140293_state[(0)] = null);

throw cr140293_exception;
}});
var cr140293_block_1 = (function frontend$worker$db_worker$on_become_master_$_cr140293_block_1(cr140293_state){
try{var cr140293_place_4 = missionary.core.unpark();
var cr140293_place_5 = new cljs.core.Keyword(null,"import-type","import-type",-499283032);
var cr140293_place_6 = start_opts;
var cr140293_place_7 = cr140293_place_5.cljs$core$IFn$_invoke$arity$1(cr140293_place_6);
var cr140293_place_8 = null;
if(cljs.core.truth_(cr140293_place_7)){
(cr140293_state[(0)] = cr140293_block_7);

(cr140293_state[(1)] = cr140293_place_8);

return cr140293_state;
} else {
(cr140293_state[(0)] = cr140293_block_2);

(cr140293_state[(1)] = cr140293_place_8);

return cr140293_state;
}
}catch (e140335){var cr140293_exception = e140335;
(cr140293_state[(0)] = null);

throw cr140293_exception;
}});
var cr140293_block_8 = (function frontend$worker$db_worker$on_become_master_$_cr140293_block_8(cr140293_state){
try{var cr140293_place_8 = (cr140293_state[(1)]);
var cr140293_place_29 = frontend.worker.rtc.core.new_task__rtc_start;
var cr140293_place_30 = true;
var cr140293_place_31 = (function (){var G__140338 = cr140293_place_30;
var fexpr__140337 = cr140293_place_29;
return (fexpr__140337.cljs$core$IFn$_invoke$arity$1 ? fexpr__140337.cljs$core$IFn$_invoke$arity$1(G__140338) : fexpr__140337.call(null,G__140338));
})();
(cr140293_state[(0)] = cr140293_block_9);

(cr140293_state[(1)] = null);

return missionary.core.park(cr140293_place_31);
}catch (e140336){var cr140293_exception = e140336;
(cr140293_state[(0)] = null);

(cr140293_state[(1)] = null);

throw cr140293_exception;
}});
var cr140293_block_5 = (function frontend$worker$db_worker$on_become_master_$_cr140293_block_5(cr140293_state){
try{var cr140293_place_27 = null;
(cr140293_state[(0)] = cr140293_block_6);

(cr140293_state[(2)] = cr140293_place_27);

return cr140293_state;
}catch (e140339){var cr140293_exception = e140339;
(cr140293_state[(0)] = null);

(cr140293_state[(2)] = null);

(cr140293_state[(1)] = null);

throw cr140293_exception;
}});
var cr140293_block_4 = (function frontend$worker$db_worker$on_become_master_$_cr140293_block_4(cr140293_state){
try{var cr140293_place_24 = "Assert failed: (some? (worker-state/get-datascript-conn repo))";
var cr140293_place_25 = (new Error(cr140293_place_24));
var cr140293_place_26 = (function(){throw cr140293_place_25})();
(cr140293_state[(0)] = null);

return null;
}catch (e140340){var cr140293_exception = e140340;
(cr140293_state[(0)] = null);

throw cr140293_exception;
}});
var cr140293_block_6 = (function frontend$worker$db_worker$on_become_master_$_cr140293_block_6(cr140293_state){
try{var cr140293_place_23 = (cr140293_state[(2)]);
(cr140293_state[(0)] = cr140293_block_8);

(cr140293_state[(2)] = null);

(cr140293_state[(1)] = cr140293_place_23);

return cr140293_state;
}catch (e140341){var cr140293_exception = e140341;
(cr140293_state[(0)] = null);

(cr140293_state[(2)] = null);

(cr140293_state[(1)] = null);

throw cr140293_exception;
}});
return cloroutine.impl.coroutine((function (){var G__140342 = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1((3));
(G__140342[(0)] = cr140293_block_0);

return G__140342;
})());
})(),missionary.core.sp_run)));
});
frontend.worker.db_worker.broadcast_data_types = cljs.core.set(cljs.core.map.cljs$core$IFn$_invoke$arity$2(logseq.common.util.keyword__GT_string,new cljs.core.PersistentVector(null, 6, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"sync-db-changes","sync-db-changes",-1236993461),new cljs.core.Keyword(null,"notification","notification",-222338233),new cljs.core.Keyword(null,"log","log",-1595516004),new cljs.core.Keyword(null,"add-repo","add-repo",1885345931),new cljs.core.Keyword(null,"rtc-log","rtc-log",1926627661),new cljs.core.Keyword(null,"rtc-sync-state","rtc-sync-state",-661353236)], null)));
frontend.worker.db_worker._LT_init_service_BANG_ = (function frontend$worker$db_worker$_LT_init_service_BANG_(graph,start_opts){
var vec__140343 = cljs.core.deref(frontend.worker.db_worker._STAR_service);
var prev_graph = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__140343,(0),null);
var service = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__140343,(1),null);
var G__140346_140445 = prev_graph;
if((G__140346_140445 == null)){
} else {
frontend.worker.db_worker.close_db_BANG_(G__140346_140445);
}

if(cljs.core.truth_(graph)){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(graph,prev_graph)){
return service;
} else {
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___48218__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.worker.shared_service._LT_create_service(graph,cljs_bean.core.__GT_js(frontend.worker.db_worker.fns),(function (){
return frontend.worker.db_worker.on_become_master(graph,start_opts);
}),frontend.worker.db_worker.broadcast_data_types,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"import?","import?",-40157302),new cljs.core.Keyword(null,"import-type?","import-type?",-1669494311).cljs$core$IFn$_invoke$arity$1(start_opts)], null))),(function (service__$1){
return promesa.protocols._mcat(promesa.protocols._promise(((promesa.core.promise_QMARK_(cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(service__$1,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"status","status",-1997798413),new cljs.core.Keyword(null,"ready","ready",1086465795)], null))))?null:(function(){throw (new Error("Assert failed: (p/promise? (get-in service [:status :ready]))"))})())),(function (___48186__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(cljs.core.reset_BANG_(frontend.worker.db_worker._STAR_service,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [graph,service__$1], null))),(function (___48186__auto____$1){
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
var proxy_object = cljs_bean.core.__GT_js(cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p__140347){
var vec__140348 = p__140347;
var k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__140348,(0),null);
var f = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__140348,(1),null);
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [k,(function() { 
var G__140446__delegate = function (args){
var vec__140351 = cljs.core.deref(frontend.worker.db_worker._STAR_service);
var _graph = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__140351,(0),null);
var service = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__140351,(1),null);
var method_k = cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(cljs.core.first(args));
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("thread-api","create-or-open-db","thread-api/create-or-open-db",1100871183),method_k)){
var vec__140354 = logseq.db.read_transit_str(cljs.core.last(args));
var graph = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__140354,(0),null);
var opts = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__140354,(1),null);
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___48218__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.worker.db_worker._LT_init_service_BANG_(graph,opts)),(function (service__$1){
return promesa.protocols._mcat(promesa.protocols._promise(cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(service__$1,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"status","status",-1997798413),new cljs.core.Keyword(null,"ready","ready",1086465795)], null))),(function (___48186__auto__){
return promesa.protocols._promise(cljs.core.js_invoke.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword(null,"proxy","proxy",-117453614).cljs$core$IFn$_invoke$arity$1(service__$1),k,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([args], 0)));
}));
}));
}));
} else {
if(((cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("thread-api","sync-app-state","thread-api/sync-app-state",1507174044),null], null), null),method_k)) || ((service == null)))){
return cljs.core.apply.cljs$core$IFn$_invoke$arity$2(f,args);
} else {
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___48218__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(service,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"status","status",-1997798413),new cljs.core.Keyword(null,"ready","ready",1086465795)], null))),(function (_ready_value){
return promesa.protocols._promise(cljs.core.js_invoke.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword(null,"proxy","proxy",-117453614).cljs$core$IFn$_invoke$arity$1(service),k,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([args], 0)));
}));
}));

}
}
};
var G__140446 = function (var_args){
var args = null;
if (arguments.length > 0) {
var G__140447__i = 0, G__140447__a = new Array(arguments.length -  0);
while (G__140447__i < G__140447__a.length) {G__140447__a[G__140447__i] = arguments[G__140447__i + 0]; ++G__140447__i;}
  args = new cljs.core.IndexedSeq(G__140447__a,0,null);
} 
return G__140446__delegate.call(this,args);};
G__140446.cljs$lang$maxFixedArity = 0;
G__140446.cljs$lang$applyTo = (function (arglist__140448){
var args = cljs.core.seq(arglist__140448);
return G__140446__delegate(args);
});
G__140446.cljs$core$IFn$_invoke$arity$variadic = G__140446__delegate;
return G__140446;
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
var G__140449__delegate = function (qkw,direct_pass_args_QMARK_,args){
return promesa.core.chain.cljs$core$IFn$_invoke$arity$2(wrapped_main_thread_STAR_.remoteInvoke([cljs.core.namespace(qkw),"/",cljs.core.name(qkw)].join(''),direct_pass_args_QMARK_,(cljs.core.truth_(direct_pass_args_QMARK_)?cljs.core.into_array.cljs$core$IFn$_invoke$arity$1(args):logseq.db.write_transit_str(args))),logseq.db.read_transit_str);
};
var G__140449 = function (qkw,direct_pass_args_QMARK_,var_args){
var args = null;
if (arguments.length > 2) {
var G__140450__i = 0, G__140450__a = new Array(arguments.length -  2);
while (G__140450__i < G__140450__a.length) {G__140450__a[G__140450__i] = arguments[G__140450__i + 2]; ++G__140450__i;}
  args = new cljs.core.IndexedSeq(G__140450__a,0,null);
} 
return G__140449__delegate.call(this,qkw,direct_pass_args_QMARK_,args);};
G__140449.cljs$lang$maxFixedArity = 2;
G__140449.cljs$lang$applyTo = (function (arglist__140451){
var qkw = cljs.core.first(arglist__140451);
arglist__140451 = cljs.core.next(arglist__140451);
var direct_pass_args_QMARK_ = cljs.core.first(arglist__140451);
var args = cljs.core.rest(arglist__140451);
return G__140449__delegate(qkw,direct_pass_args_QMARK_,args);
});
G__140449.cljs$core$IFn$_invoke$arity$variadic = G__140449__delegate;
return G__140449;
})()
;
return cljs.core.reset_BANG_(frontend.worker.state._STAR_main_thread,wrapped_main_thread);
});

//# sourceMappingURL=frontend.worker.db_worker.js.map
