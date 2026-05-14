goog.provide('logseq.db.common.property_util');
/**
 * Gets file graph property id given the db graph ident
 */
logseq.db.common.property_util.get_file_pid = (function logseq$db$common$property_util$get_file_pid(db_ident){
var unique_file_ids = new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword("logseq.property","order-list-type","logseq.property/order-list-type",607817111),new cljs.core.Keyword(null,"logseq.order-list-type","logseq.order-list-type",-1819806366),new cljs.core.Keyword("logseq.property.tldraw","page","logseq.property.tldraw/page",-354621457),new cljs.core.Keyword(null,"logseq.tldraw.page","logseq.tldraw.page",-1937463021),new cljs.core.Keyword("logseq.property.tldraw","shape","logseq.property.tldraw/shape",-1313245420),new cljs.core.Keyword(null,"logseq.tldraw.shape","logseq.tldraw.shape",-771542905),new cljs.core.Keyword("logseq.property","publishing-public?","logseq.property/publishing-public?",-1094657939),new cljs.core.Keyword(null,"public","public",1566243851)], null);
var or__5002__auto__ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(unique_file_ids,db_ident);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(cljs.core.name(db_ident));
}
});
/**
 * Get a built-in property's id (keyword name for file graph and db-ident for db
 *   graph) given its db-ident. No need to use this fn in a db graph only context
 */
logseq.db.common.property_util.get_pid = (function logseq$db$common$property_util$get_pid(repo,db_ident){
if(cljs.core.truth_(logseq.db.sqlite.util.db_based_graph_QMARK_(repo))){
return db_ident;
} else {
return logseq.db.common.property_util.get_file_pid(db_ident);
}
});
/**
 * Get the property value by a built-in property's db-ident from coll. For file and db graphs
 */
logseq.db.common.property_util.lookup = (function logseq$db$common$property_util$lookup(repo,block,db_ident){
if(cljs.core.truth_(logseq.db.sqlite.util.db_based_graph_QMARK_(repo))){
var val = cljs.core.get.cljs$core$IFn$_invoke$arity$2(block,db_ident);
if(logseq.db.frontend.property.built_in_has_ref_value_QMARK_(db_ident)){
return logseq.db.frontend.property.property_value_content(val);
} else {
return val;
}
} else {
return cljs.core.get.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","properties","block/properties",708347145).cljs$core$IFn$_invoke$arity$1(block),logseq.db.common.property_util.get_pid(repo,db_ident));
}
});
/**
 * Get the value of built-in block's property by its db-ident
 */
logseq.db.common.property_util.get_block_property_value = (function logseq$db$common$property_util$get_block_property_value(repo,db,block,db_ident){
if(cljs.core.truth_(db)){
var block__$1 = (function (){var or__5002__auto__ = (function (){var G__63271 = db;
var G__63272 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__63271,G__63272) : datascript.core.entity.call(null,G__63271,G__63272));
})();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return block;
}
})();
return logseq.db.common.property_util.lookup(repo,block__$1,db_ident);
} else {
return null;
}
});
logseq.db.common.property_util.shape_block_QMARK_ = (function logseq$db$common$property_util$shape_block_QMARK_(repo,db,block){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"whiteboard-shape","whiteboard-shape",-1784390938),logseq.db.common.property_util.get_block_property_value(repo,db,block,new cljs.core.Keyword("logseq.property","ls-type","logseq.property/ls-type",326979345)));
});

//# sourceMappingURL=logseq.db.common.property_util.js.map
