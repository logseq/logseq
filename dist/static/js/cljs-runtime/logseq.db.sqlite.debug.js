goog.provide('logseq.db.sqlite.debug');
/**
 * WASM version to find missing addresses from the kvs table
 */
logseq.db.sqlite.debug.find_missing_addresses = (function logseq$db$sqlite$debug$find_missing_addresses(db){
var schema = (function (){var G__187296 = db.exec(({"sql": "select content from kvs where addr = 0", "rowMode": "array"}));
var G__187296__$1 = (((G__187296 == null))?null:cljs_bean.core.__GT_clj(G__187296));
var G__187296__$2 = (((G__187296__$1 == null))?null:cljs.core.ffirst(G__187296__$1));
if((G__187296__$2 == null)){
return null;
} else {
return logseq.db.sqlite.util.transit_read(G__187296__$2);
}
})();
var result = cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (p__187302){
var vec__187303 = p__187302;
var addr = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__187303,(0),null);
var addresses = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__187303,(1),null);
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [addr,cljs_bean.core.__GT_clj(JSON.parse(addresses))], null);
}),cljs_bean.core.__GT_clj(db.exec(({"sql": "select addr, addresses from kvs", "rowMode": "array"}))));
var used_addresses = cljs.core.set(cljs.core.concat.cljs$core$IFn$_invoke$arity$2(cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic(cljs.core.second,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([result], 0)),new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, [(0),(1),new cljs.core.Keyword(null,"eavt","eavt",-666437073).cljs$core$IFn$_invoke$arity$1(schema),new cljs.core.Keyword(null,"avet","avet",1383857032).cljs$core$IFn$_invoke$arity$1(schema),new cljs.core.Keyword(null,"aevt","aevt",-585148059).cljs$core$IFn$_invoke$arity$1(schema)], null)));
return clojure.set.difference.cljs$core$IFn$_invoke$arity$2(used_addresses,cljs.core.set(cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.first,result)));
});
/**
 * Node version to find missing addresses from the kvs table
 */
logseq.db.sqlite.debug.find_missing_addresses_node_version = (function logseq$db$sqlite$debug$find_missing_addresses_node_version(db){
var schema = (function (){var stmt = db.prepare("select content from kvs where addr = ?");
var content = stmt.get((0)).content;
return logseq.db.sqlite.util.transit_read(content);
})();
var stmt = db.prepare("select addr, addresses from kvs");
var result = cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (p__187351){
var map__187352 = p__187351;
var map__187352__$1 = cljs.core.__destructure_map(map__187352);
var addr = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__187352__$1,new cljs.core.Keyword(null,"addr","addr",-1597650737));
var addresses = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__187352__$1,new cljs.core.Keyword(null,"addresses","addresses",-559529694));
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [addr,cljs_bean.core.__GT_clj(JSON.parse(addresses))], null);
}),cljs_bean.core.__GT_clj(stmt.all()));
var used_addresses = cljs.core.set(cljs.core.concat.cljs$core$IFn$_invoke$arity$2(cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic(cljs.core.second,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([result], 0)),new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, [(0),(1),new cljs.core.Keyword(null,"eavt","eavt",-666437073).cljs$core$IFn$_invoke$arity$1(schema),new cljs.core.Keyword(null,"avet","avet",1383857032).cljs$core$IFn$_invoke$arity$1(schema),new cljs.core.Keyword(null,"aevt","aevt",-585148059).cljs$core$IFn$_invoke$arity$1(schema)], null)));
return clojure.set.difference.cljs$core$IFn$_invoke$arity$2(used_addresses,cljs.core.set(cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.first,result)));
});

//# sourceMappingURL=logseq.db.sqlite.debug.js.map
