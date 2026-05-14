goog.provide('logseq.db.common.sqlite');
var module$node_modules$path$path=shadow.js.require("module$node_modules$path$path", {});
/**
 * Creates a sqlite table for use with datascript.storage if one doesn't exist
 */
logseq.db.common.sqlite.create_kvs_table_BANG_ = (function logseq$db$common$sqlite$create_kvs_table_BANG_(sqlite_db){
return sqlite_db.exec("create table if not exists kvs (addr INTEGER primary key, content TEXT, addresses JSON)");
});
/**
 * Given a datascript storage, returns a datascript connection for it
 */
logseq.db.common.sqlite.get_storage_conn = (function logseq$db$common$sqlite$get_storage_conn(storage,schema){
var or__5002__auto__ = (datascript.core.restore_conn.cljs$core$IFn$_invoke$arity$1 ? datascript.core.restore_conn.cljs$core$IFn$_invoke$arity$1(storage) : datascript.core.restore_conn.call(null,storage));
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var G__67538 = schema;
var G__67539 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"storage","storage",1867247511),storage], null);
return (datascript.core.create_conn.cljs$core$IFn$_invoke$arity$2 ? datascript.core.create_conn.cljs$core$IFn$_invoke$arity$2(G__67538,G__67539) : datascript.core.create_conn.call(null,G__67538,G__67539));
}
});
if((typeof logseq !== 'undefined') && (typeof logseq.db !== 'undefined') && (typeof logseq.db.common !== 'undefined') && (typeof logseq.db.common.sqlite !== 'undefined') && (typeof logseq.db.common.sqlite.file_version_prefix !== 'undefined')){
} else {
logseq.db.common.sqlite.file_version_prefix = "logseq_local_";
}
logseq.db.common.sqlite.local_file_based_graph_QMARK_ = (function logseq$db$common$sqlite$local_file_based_graph_QMARK_(s){
return ((typeof s === 'string') && (clojure.string.starts_with_QMARK_(s,logseq.db.common.sqlite.file_version_prefix)));
});
logseq.db.common.sqlite.sanitize_db_name = (function logseq$db$common$sqlite$sanitize_db_name(db_name){
if(clojure.string.starts_with_QMARK_(db_name,logseq.db.common.sqlite.file_version_prefix)){
return clojure.string.replace(clojure.string.replace(db_name,":","+3A+"),"/","++");
} else {
return clojure.string.replace(clojure.string.replace(clojure.string.replace(clojure.string.replace(db_name,logseq.db.sqlite.util.db_version_prefix,""),"/","_"),"\\","_"),":","_");
}
});
logseq.db.common.sqlite.get_db_full_path = (function logseq$db$common$sqlite$get_db_full_path(graphs_dir,db_name){
var db_name_SINGLEQUOTE_ = logseq.db.common.sqlite.sanitize_db_name(db_name);
var graph_dir = module$node_modules$path$path.join(graphs_dir,db_name_SINGLEQUOTE_);
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [db_name_SINGLEQUOTE_,module$node_modules$path$path.join(graph_dir,"db.sqlite")], null);
});

//# sourceMappingURL=logseq.db.common.sqlite.js.map
