goog.provide('logseq.graph_parser.whiteboard');
logseq.graph_parser.whiteboard.block__GT_shape = (function logseq$graph_parser$whiteboard$block__GT_shape(block){
return cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(block,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","properties","block/properties",708347145),new cljs.core.Keyword(null,"logseq.tldraw.shape","logseq.tldraw.shape",-771542905)], null));
});
logseq.graph_parser.whiteboard.shape_block_QMARK_ = (function logseq$graph_parser$whiteboard$shape_block_QMARK_(block){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"whiteboard-shape","whiteboard-shape",-1784390938),cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(block,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","properties","block/properties",708347145),new cljs.core.Keyword(null,"ls-type","ls-type",1383834313)], null)));
});
logseq.graph_parser.whiteboard.shape_block_needs_migrate_QMARK_ = (function logseq$graph_parser$whiteboard$shape_block_needs_migrate_QMARK_(block){
var properties = new cljs.core.Keyword("block","properties","block/properties",708347145).cljs$core$IFn$_invoke$arity$1(block);
return ((cljs.core.seq(properties)) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"whiteboard-shape","whiteboard-shape",-1784390938),new cljs.core.Keyword(null,"ls-type","ls-type",1383834313).cljs$core$IFn$_invoke$arity$1(properties))) && (cljs.core.not(cljs.core.seq(cljs.core.get.cljs$core$IFn$_invoke$arity$2(properties,new cljs.core.Keyword(null,"logseq.tldraw.shape","logseq.tldraw.shape",-771542905))))))));
});
logseq.graph_parser.whiteboard.page_block_needs_migrate_QMARK_ = (function logseq$graph_parser$whiteboard$page_block_needs_migrate_QMARK_(block){
var properties = new cljs.core.Keyword("block","properties","block/properties",708347145).cljs$core$IFn$_invoke$arity$1(block);
return ((cljs.core.seq(properties)) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"whiteboard-page","whiteboard-page",-432281646),new cljs.core.Keyword(null,"ls-type","ls-type",1383834313).cljs$core$IFn$_invoke$arity$1(properties))) && (cljs.core.not(cljs.core.seq(cljs.core.get.cljs$core$IFn$_invoke$arity$2(properties,new cljs.core.Keyword(null,"logseq.tldraw.page","logseq.tldraw.page",-1937463021))))))));
});
logseq.graph_parser.whiteboard.migrate_shape_block = (function logseq$graph_parser$whiteboard$migrate_shape_block(block){
if(logseq.graph_parser.whiteboard.shape_block_needs_migrate_QMARK_(block)){
var properties = new cljs.core.Keyword("block","properties","block/properties",708347145).cljs$core$IFn$_invoke$arity$1(block);
var properties__$1 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(properties,new cljs.core.Keyword(null,"logseq.tldraw.shape","logseq.tldraw.shape",-771542905),properties);
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(block,new cljs.core.Keyword("block","properties","block/properties",708347145),properties__$1);
} else {
return block;
}
});
logseq.graph_parser.whiteboard.migrate_page_block = (function logseq$graph_parser$whiteboard$migrate_page_block(block){
if(logseq.graph_parser.whiteboard.page_block_needs_migrate_QMARK_(block)){
var properties = new cljs.core.Keyword("block","properties","block/properties",708347145).cljs$core$IFn$_invoke$arity$1(block);
var properties__$1 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(properties,new cljs.core.Keyword(null,"logseq.tldraw.page","logseq.tldraw.page",-1937463021),properties);
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(block,new cljs.core.Keyword("block","properties","block/properties",708347145),properties__$1);
} else {
return block;
}
});
logseq.graph_parser.whiteboard.get_shape_refs = (function logseq$graph_parser$whiteboard$get_shape_refs(shape){
var portal_refs = ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("logseq-portal",new cljs.core.Keyword(null,"type","type",1174270348).cljs$core$IFn$_invoke$arity$1(shape)))?new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),cljs.core.uuid(new cljs.core.Keyword(null,"pageId","pageId",276948616).cljs$core$IFn$_invoke$arity$1(shape))], null)], null):null);
var shape_link_refs = cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (ref){
if(cljs.core.truth_(cljs.core.parse_uuid(ref))){
return new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),cljs.core.parse_uuid(ref)], null);
} else {
return null;
}
}),cljs.core.filter.cljs$core$IFn$_invoke$arity$2(cljs.core.complement(cljs.core.empty_QMARK_),new cljs.core.Keyword(null,"refs","refs",-1560051448).cljs$core$IFn$_invoke$arity$1(shape)));
return cljs.core.concat.cljs$core$IFn$_invoke$arity$2(portal_refs,shape_link_refs);
});
logseq.graph_parser.whiteboard.with_whiteboard_block_refs = (function logseq$graph_parser$whiteboard$with_whiteboard_block_refs(shape,page_id){
var refs = (function (){var or__5002__auto__ = logseq.graph_parser.whiteboard.get_shape_refs(shape);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.PersistentVector.EMPTY;
}
})();
return cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("block","refs","block/refs",-1214495349),((cljs.core.seq(refs))?refs:cljs.core.PersistentVector.EMPTY),new cljs.core.Keyword("block","path-refs","block/path-refs",-2109181352),((cljs.core.seq(refs))?cljs.core.conj.cljs$core$IFn$_invoke$arity$2(refs,page_id):cljs.core.PersistentVector.EMPTY)], null)], 0));
});
/**
 * Main purpose of this function is to populate contents when shapes are used as references in outliner.
 */
logseq.graph_parser.whiteboard.with_whiteboard_content = (function logseq$graph_parser$whiteboard$with_whiteboard_content(shape){
return new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("block","title","block/title",710445684),(function (){var G__67669 = new cljs.core.Keyword(null,"type","type",1174270348).cljs$core$IFn$_invoke$arity$1(shape);
switch (G__67669) {
case "text":
return new cljs.core.Keyword(null,"text","text",-1790561697).cljs$core$IFn$_invoke$arity$1(shape);

break;
case "logseq-portal":
return "";

break;
case "line":
return ["whiteboard arrow",(function (){var temp__5804__auto__ = new cljs.core.Keyword(null,"label","label",1718410804).cljs$core$IFn$_invoke$arity$1(shape);
if(cljs.core.truth_(temp__5804__auto__)){
var label = temp__5804__auto__;
return [": ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(label)].join('');
} else {
return null;
}
})()].join('');

break;
default:
return ["whiteboard ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"type","type",1174270348).cljs$core$IFn$_invoke$arity$1(shape))].join('');

}
})()], null);
});
/**
 * Builds additional block attributes for a whiteboard block. Expects :block/properties
 * to be in file graph format
 */
logseq.graph_parser.whiteboard.with_whiteboard_block_props = (function logseq$graph_parser$whiteboard$with_whiteboard_block_props(block,page_id){
var shape_QMARK_ = logseq.graph_parser.whiteboard.shape_block_QMARK_(block);
var shape = logseq.graph_parser.whiteboard.block__GT_shape(block);
return cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([((shape_QMARK_)?cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),cljs.core.uuid(new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(shape))], null),logseq.graph_parser.whiteboard.with_whiteboard_block_refs(shape,page_id),logseq.graph_parser.whiteboard.with_whiteboard_content(shape)], 0)):null),(((new cljs.core.Keyword("block","parent","block/parent",-918309064).cljs$core$IFn$_invoke$arity$1(block) == null))?new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("block","parent","block/parent",-918309064),page_id], null):null),(((new cljs.core.Keyword("block","format","block/format",-1212045901).cljs$core$IFn$_invoke$arity$1(block) == null))?new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("block","format","block/format",-1212045901),new cljs.core.Keyword(null,"markdown","markdown",1227225089)], null):null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("block","page","block/page",822314108),page_id], null)], 0));
});
logseq.graph_parser.whiteboard.shape__GT_block = (function logseq$graph_parser$whiteboard$shape__GT_block(repo,shape,page_id){
var block_uuid = ((cljs.core.uuid_QMARK_(new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(shape)))?new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(shape):cljs.core.uuid(new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(shape)));
var properties = cljs.core.PersistentArrayMap.createAsIfByAssoc([logseq.db.common.property_util.get_pid(repo,new cljs.core.Keyword("logseq.property","ls-type","logseq.property/ls-type",326979345)),new cljs.core.Keyword(null,"whiteboard-shape","whiteboard-shape",-1784390938),logseq.db.common.property_util.get_pid(repo,new cljs.core.Keyword("logseq.property.tldraw","shape","logseq.property.tldraw/shape",-1313245420)),shape]);
var block = new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_uuid,new cljs.core.Keyword("block","title","block/title",710445684),"",new cljs.core.Keyword("block","page","block/page",822314108),page_id,new cljs.core.Keyword("block","parent","block/parent",-918309064),page_id], null);
var block_SINGLEQUOTE_ = (cljs.core.truth_(logseq.db.sqlite.util.db_based_graph_QMARK_(repo))?cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([block,properties], 0)):cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(block,new cljs.core.Keyword("block","properties","block/properties",708347145),properties));
var additional_props = logseq.graph_parser.whiteboard.with_whiteboard_block_props(block_SINGLEQUOTE_,page_id);
return cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([block_SINGLEQUOTE_,additional_props], 0));
});

//# sourceMappingURL=logseq.graph_parser.whiteboard.js.map
