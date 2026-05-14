goog.provide('logseq.db.sqlite.gc');
/**
 * Given a map of parent address to children addresses and a root address,
 * returns a set of all used addresses including the root and its descendants.
 */
logseq.db.sqlite.gc.walk_addresses = (function logseq$db$sqlite$gc$walk_addresses(root,addr__GT_children){
cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"debug","debug",-1608172596),new cljs.core.Keyword(null,"walk-addresses","walk-addresses",1041805225),new cljs.core.Keyword(null,"root","root",-448657453),root], 0));

var start__5606__auto__ = cljs.core.system_time();
var ret__5607__auto__ = (function (){var collect_addresses = (function logseq$db$sqlite$gc$walk_addresses_$_collect_addresses(addr){
var children = (addr__GT_children.cljs$core$IFn$_invoke$arity$1 ? addr__GT_children.cljs$core$IFn$_invoke$arity$1(addr) : addr__GT_children.call(null,addr));
return cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentHashSet.createAsIfByAssoc([addr]),cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic(logseq$db$sqlite$gc$walk_addresses_$_collect_addresses,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([children], 0)));
});
return collect_addresses(root);
})();
cljs.core.prn.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([["Elapsed time: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1((cljs.core.system_time() - start__5606__auto__).toFixed((6)))," msecs"].join('')], 0));

return ret__5607__auto__;
});
if((typeof logseq !== 'undefined') && (typeof logseq.db !== 'undefined') && (typeof logseq.db.sqlite !== 'undefined') && (typeof logseq.db.sqlite.gc !== 'undefined') && (typeof logseq.db.sqlite.gc.get_non_refed_addrs_sql !== 'undefined')){
} else {
logseq.db.sqlite.gc.get_non_refed_addrs_sql = "WITH all_referenced AS (\n     SELECT CAST(value AS INTEGER) AS addr\n     FROM kvs, json_each(kvs.addresses)\n  )\n  SELECT kvs.addr\n  FROM kvs\n  WHERE kvs.addr NOT IN (SELECT addr FROM all_referenced)";
}
logseq.db.sqlite.gc.get_unused_addresses = (function logseq$db$sqlite$gc$get_unused_addresses(db){
var schema = (function (){var G__135330 = db.exec(({"sql": "select content from kvs where addr = 0", "rowMode": "array"}));
var G__135330__$1 = (((G__135330 == null))?null:cljs_bean.core.__GT_clj(G__135330));
var G__135330__$2 = (((G__135330__$1 == null))?null:cljs.core.ffirst(G__135330__$1));
if((G__135330__$2 == null)){
return null;
} else {
return logseq.db.sqlite.util.transit_read(G__135330__$2);
}
})();
var internal_addrs = cljs.core.set(new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, [(0),(1),new cljs.core.Keyword(null,"eavt","eavt",-666437073).cljs$core$IFn$_invoke$arity$1(schema),new cljs.core.Keyword(null,"avet","avet",1383857032).cljs$core$IFn$_invoke$arity$1(schema),new cljs.core.Keyword(null,"aevt","aevt",-585148059).cljs$core$IFn$_invoke$arity$1(schema)], null));
var non_refed_addrs = cljs.core.set(cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.first,db.exec(({"sql": logseq.db.sqlite.gc.get_non_refed_addrs_sql, "rowMode": "array"}))));
return clojure.set.difference.cljs$core$IFn$_invoke$arity$2(non_refed_addrs,internal_addrs);
});
/**
 * WASM version to GC kvs table to remove unused addresses
 */
logseq.db.sqlite.gc.gc_kvs_table_BANG_ = (function logseq$db$sqlite$gc$gc_kvs_table_BANG_(db,p__135350){
var map__135351 = p__135350;
var map__135351__$1 = cljs.core.__destructure_map(map__135351);
var opts = map__135351__$1;
var full_gc_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__135351__$1,new cljs.core.Keyword(null,"full-gc?","full-gc?",150271731));
if(cljs.core.truth_(db)){
var unused_addresses = logseq.db.sqlite.gc.get_unused_addresses(db);
if(cljs.core.seq(unused_addresses)){
cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"debug","debug",-1608172596),new cljs.core.Keyword(null,"db-gc","db-gc",-2138829902),new cljs.core.Keyword(null,"unused-addresses","unused-addresses",589212218),unused_addresses], 0));

db.transaction((function (tx){
var seq__135358 = cljs.core.seq(unused_addresses);
var chunk__135359 = null;
var count__135360 = (0);
var i__135361 = (0);
while(true){
if((i__135361 < count__135360)){
var addr = chunk__135359.cljs$core$IIndexed$_nth$arity$2(null,i__135361);
tx.exec(({"sql": "Delete from kvs where addr = ?", "bind": [addr]}));


var G__135526 = seq__135358;
var G__135527 = chunk__135359;
var G__135528 = count__135360;
var G__135529 = (i__135361 + (1));
seq__135358 = G__135526;
chunk__135359 = G__135527;
count__135360 = G__135528;
i__135361 = G__135529;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__135358);
if(temp__5804__auto__){
var seq__135358__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__135358__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__135358__$1);
var G__135531 = cljs.core.chunk_rest(seq__135358__$1);
var G__135532 = c__5525__auto__;
var G__135533 = cljs.core.count(c__5525__auto__);
var G__135534 = (0);
seq__135358 = G__135531;
chunk__135359 = G__135532;
count__135360 = G__135533;
i__135361 = G__135534;
continue;
} else {
var addr = cljs.core.first(seq__135358__$1);
tx.exec(({"sql": "Delete from kvs where addr = ?", "bind": [addr]}));


var G__135536 = cljs.core.next(seq__135358__$1);
var G__135537 = null;
var G__135538 = (0);
var G__135539 = (0);
seq__135358 = G__135536;
chunk__135359 = G__135537;
count__135360 = G__135538;
i__135361 = G__135539;
continue;
}
} else {
return null;
}
}
break;
}
}));

if(cljs.core.truth_(full_gc_QMARK_)){
return (logseq.db.sqlite.gc.gc_kvs_table_BANG_.cljs$core$IFn$_invoke$arity$2 ? logseq.db.sqlite.gc.gc_kvs_table_BANG_.cljs$core$IFn$_invoke$arity$2(db,opts) : logseq.db.sqlite.gc.gc_kvs_table_BANG_.call(null,db,opts));
} else {
return null;
}
} else {
return cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"debug","debug",-1608172596),new cljs.core.Keyword(null,"db-gc","db-gc",-2138829902),"There's no garbage data that's need to be collected."], 0));
}
} else {
return null;
}
});
logseq.db.sqlite.gc.get_unused_addresses_node_version = (function logseq$db$sqlite$gc$get_unused_addresses_node_version(db){
var schema = (function (){var stmt = db.prepare("select content from kvs where addr = ?");
var content = stmt.get((0)).content;
return logseq.db.sqlite.util.transit_read(content);
})();
var internal_addrs = cljs.core.set(new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, [(0),(1),new cljs.core.Keyword(null,"eavt","eavt",-666437073).cljs$core$IFn$_invoke$arity$1(schema),new cljs.core.Keyword(null,"avet","avet",1383857032).cljs$core$IFn$_invoke$arity$1(schema),new cljs.core.Keyword(null,"aevt","aevt",-585148059).cljs$core$IFn$_invoke$arity$1(schema)], null));
var non_refed_addrs = (function (){var stmt = db.prepare(logseq.db.sqlite.gc.get_non_refed_addrs_sql);
return cljs.core.set(cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"addr","addr",-1597650737),cljs_bean.core.__GT_clj(stmt.all())));
})();
return clojure.set.difference.cljs$core$IFn$_invoke$arity$2(non_refed_addrs,internal_addrs);
});
logseq.db.sqlite.gc.get_unused_addresses_node_walk_version = (function logseq$db$sqlite$gc$get_unused_addresses_node_walk_version(db){
var schema = (function (){var stmt = db.prepare("select content from kvs where addr = ?");
var content = stmt.get((0)).content;
return logseq.db.sqlite.util.transit_read(content);
})();
var set_addresses = cljs.core.PersistentHashSet.createAsIfByAssoc([new cljs.core.Keyword(null,"aevt","aevt",-585148059).cljs$core$IFn$_invoke$arity$1(schema),new cljs.core.Keyword(null,"avet","avet",1383857032).cljs$core$IFn$_invoke$arity$1(schema),new cljs.core.Keyword(null,"eavt","eavt",-666437073).cljs$core$IFn$_invoke$arity$1(schema)]);
var internal_addresses = cljs.core.conj.cljs$core$IFn$_invoke$arity$variadic(set_addresses,(0),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([(1)], 0));
var parent__GT_children = (function (){var stmt = db.prepare("select addr, addresses from kvs");
return cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p__135463){
var map__135467 = p__135463;
var map__135467__$1 = cljs.core.__destructure_map(map__135467);
var addr = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__135467__$1,new cljs.core.Keyword(null,"addr","addr",-1597650737));
var addresses = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__135467__$1,new cljs.core.Keyword(null,"addresses","addresses",-559529694));
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [addr,cljs_bean.core.__GT_clj(JSON.parse(addresses))], null);
}),cljs_bean.core.__GT_clj(stmt.all())));
})();
var used_addresses = clojure.set.union.cljs$core$IFn$_invoke$arity$2(internal_addresses,cljs.core.set(cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (set_root_addr){
return logseq.db.sqlite.gc.walk_addresses(set_root_addr,parent__GT_children);
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([set_addresses], 0))));
return clojure.set.difference.cljs$core$IFn$_invoke$arity$2(cljs.core.set(cljs.core.keys(parent__GT_children)),used_addresses);
});
/**
 * Node version to GC kvs table to remove unused addresses
 *   `walk?` - `true`: walk all used addresses, `false`: gc recursively
 */
logseq.db.sqlite.gc.gc_kvs_table_node_version_BANG_ = (function logseq$db$sqlite$gc$gc_kvs_table_node_version_BANG_(db,walk_QMARK_){
var unused_addresses = (cljs.core.truth_(walk_QMARK_)?logseq.db.sqlite.gc.get_unused_addresses_node_walk_version(db):logseq.db.sqlite.gc.get_unused_addresses_node_version(db));
var addrs_count = (function (){var stmt = db.prepare("select count(*) as c from kvs");
return stmt.get().c;
})();
cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"debug","debug",-1608172596),"addrs total count: ",addrs_count], 0));

if(cljs.core.seq(unused_addresses)){
cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"debug","debug",-1608172596),new cljs.core.Keyword(null,"db-gc","db-gc",-2138829902),new cljs.core.Keyword(null,"unused-addresses-count","unused-addresses-count",-1746633383),cljs.core.count(unused_addresses)], 0));

var stmt = db.prepare("Delete from kvs where addr = ?");
var delete$ = db.transaction((function (addrs){
var seq__135493 = cljs.core.seq(addrs);
var chunk__135494 = null;
var count__135495 = (0);
var i__135496 = (0);
while(true){
if((i__135496 < count__135495)){
var addr = chunk__135494.cljs$core$IIndexed$_nth$arity$2(null,i__135496);
stmt.run(addr);


var G__135565 = seq__135493;
var G__135566 = chunk__135494;
var G__135567 = count__135495;
var G__135568 = (i__135496 + (1));
seq__135493 = G__135565;
chunk__135494 = G__135566;
count__135495 = G__135567;
i__135496 = G__135568;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__135493);
if(temp__5804__auto__){
var seq__135493__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__135493__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__135493__$1);
var G__135571 = cljs.core.chunk_rest(seq__135493__$1);
var G__135572 = c__5525__auto__;
var G__135573 = cljs.core.count(c__5525__auto__);
var G__135574 = (0);
seq__135493 = G__135571;
chunk__135494 = G__135572;
count__135495 = G__135573;
i__135496 = G__135574;
continue;
} else {
var addr = cljs.core.first(seq__135493__$1);
stmt.run(addr);


var G__135576 = cljs.core.next(seq__135493__$1);
var G__135577 = null;
var G__135578 = (0);
var G__135579 = (0);
seq__135493 = G__135576;
chunk__135494 = G__135577;
count__135495 = G__135578;
i__135496 = G__135579;
continue;
}
} else {
return null;
}
}
break;
}
}));
var G__135509_135582 = cljs_bean.core.__GT_js(unused_addresses);
(delete$.cljs$core$IFn$_invoke$arity$1 ? delete$.cljs$core$IFn$_invoke$arity$1(G__135509_135582) : delete$.call(null,G__135509_135582));

if(cljs.core.truth_(walk_QMARK_)){
return null;
} else {
return (logseq.db.sqlite.gc.gc_kvs_table_node_version_BANG_.cljs$core$IFn$_invoke$arity$2 ? logseq.db.sqlite.gc.gc_kvs_table_node_version_BANG_.cljs$core$IFn$_invoke$arity$2(db,false) : logseq.db.sqlite.gc.gc_kvs_table_node_version_BANG_.call(null,db,false));
}
} else {
return cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"debug","debug",-1608172596),new cljs.core.Keyword(null,"db-gc","db-gc",-2138829902),"There's no garbage data that's need to be collected."], 0));
}
});
logseq.db.sqlite.gc.ensure_no_garbage = (function logseq$db$sqlite$gc$ensure_no_garbage(db){
var unused_addresses = logseq.db.sqlite.gc.get_unused_addresses_node_version(db);
return cljs.core.empty_QMARK_(unused_addresses);
});

//# sourceMappingURL=logseq.db.sqlite.gc.js.map
