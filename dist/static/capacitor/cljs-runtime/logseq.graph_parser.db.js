goog.provide('logseq.graph_parser.db');
if((typeof logseq !== 'undefined') && (typeof logseq.graph_parser !== 'undefined') && (typeof logseq.graph_parser.db !== 'undefined') && (typeof logseq.graph_parser.db.built_in_markers !== 'undefined')){
} else {
logseq.graph_parser.db.built_in_markers = new cljs.core.PersistentVector(null, 10, 5, cljs.core.PersistentVector.EMPTY_NODE, ["NOW","LATER","DOING","DONE","CANCELED","CANCELLED","IN-PROGRESS","TODO","WAIT","WAITING"], null);
}
if((typeof logseq !== 'undefined') && (typeof logseq.graph_parser !== 'undefined') && (typeof logseq.graph_parser.db !== 'undefined') && (typeof logseq.graph_parser.db.built_in_priorities !== 'undefined')){
} else {
logseq.graph_parser.db.built_in_priorities = new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["A","B","C"], null);
}
if((typeof logseq !== 'undefined') && (typeof logseq.graph_parser !== 'undefined') && (typeof logseq.graph_parser.db !== 'undefined') && (typeof logseq.graph_parser.db.built_in_pages_names !== 'undefined')){
} else {
logseq.graph_parser.db.built_in_pages_names = clojure.set.union.cljs$core$IFn$_invoke$arity$variadic(cljs.core.set(logseq.graph_parser.db.built_in_markers),cljs.core.set(logseq.graph_parser.db.built_in_priorities),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 3, ["Contents",null,"Favorites",null,"card",null], null), null)], 0));
}
logseq.graph_parser.db.page_title__GT_block = (function logseq$graph_parser$db$page_title__GT_block(title){
return new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword("block","name","block/name",1619760316),clojure.string.lower_case(title),new cljs.core.Keyword("block","title","block/title",710445684),title,new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),logseq.common.uuid.gen_uuid.cljs$core$IFn$_invoke$arity$0(),new cljs.core.Keyword("block","type","block/type",1537584409),"page"], null);
});
logseq.graph_parser.db.built_in_pages = cljs.core.mapv.cljs$core$IFn$_invoke$arity$2(logseq.graph_parser.db.page_title__GT_block,logseq.graph_parser.db.built_in_pages_names);
logseq.graph_parser.db.build_pages_tx = (function logseq$graph_parser$db$build_pages_tx(pages){
var time_SINGLEQUOTE_ = logseq.common.util.time_ms();
return cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (m){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(m,new cljs.core.Keyword("block","created-at","block/created-at",1440015),time_SINGLEQUOTE_),new cljs.core.Keyword("block","updated-at","block/updated-at",-1516550551),time_SINGLEQUOTE_);
}),pages);
});
/**
 * Creates default pages if one of the default pages does not exist. This
 * fn is idempotent
 */
logseq.graph_parser.db.create_default_pages_BANG_ = (function logseq$graph_parser$db$create_default_pages_BANG_(db_conn){
if(cljs.core.truth_(logseq.db.get_page(cljs.core.deref(db_conn),"card"))){
return null;
} else {
var built_in_pages_SINGLEQUOTE_ = logseq.graph_parser.db.build_pages_tx(logseq.graph_parser.db.built_in_pages);
return logseq.db.transact_BANG_.cljs$core$IFn$_invoke$arity$2(db_conn,built_in_pages_SINGLEQUOTE_);
}
});
/**
 * Create datascript conn with schema and default data
 */
logseq.graph_parser.db.start_conn = (function logseq$graph_parser$db$start_conn(){
var db_conn = (datascript.core.create_conn.cljs$core$IFn$_invoke$arity$1 ? datascript.core.create_conn.cljs$core$IFn$_invoke$arity$1(logseq.db.file_based.schema.schema) : datascript.core.create_conn.call(null,logseq.db.file_based.schema.schema));
logseq.graph_parser.db.create_default_pages_BANG_(db_conn);

return db_conn;
});
logseq.graph_parser.db.get_page_file = (function logseq$graph_parser$db$get_page_file(db,page_name){
var G__62210 = logseq.db.get_page(db,page_name);
if((G__62210 == null)){
return null;
} else {
return new cljs.core.Keyword("block","file","block/file",183171933).cljs$core$IFn$_invoke$arity$1(G__62210);
}
});
logseq.graph_parser.db.get_all_namespace_relation = (function logseq$graph_parser$db$get_all_namespace_relation(db){
var G__62212 = new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"find","find",496279456),new cljs.core.Symbol(null,"?page","?page",-1343187612,null),new cljs.core.Symbol(null,"?parent","?parent",-1403127243,null),new cljs.core.Keyword(null,"where","where",-2044795965),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?page","?page",-1343187612,null),new cljs.core.Keyword("block","namespace","block/namespace",-282500695),new cljs.core.Symbol(null,"?parent","?parent",-1403127243,null)], null)], null);
var G__62213 = db;
return (datascript.core.q.cljs$core$IFn$_invoke$arity$2 ? datascript.core.q.cljs$core$IFn$_invoke$arity$2(G__62212,G__62213) : datascript.core.q.call(null,G__62212,G__62213));
});

//# sourceMappingURL=logseq.graph_parser.db.js.map
