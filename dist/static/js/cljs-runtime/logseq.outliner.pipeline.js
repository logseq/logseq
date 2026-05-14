goog.provide('logseq.outliner.pipeline');
logseq.outliner.pipeline.filter_deleted_blocks = (function logseq$outliner$pipeline$filter_deleted_blocks(datoms){
return cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (d){
if(((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Keyword(null,"a","a",-2123407586).cljs$core$IFn$_invoke$arity$1(d))) && (new cljs.core.Keyword(null,"added","added",2057651688).cljs$core$IFn$_invoke$arity$1(d) === false))){
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("db","id","db/id",-1388397098),new cljs.core.Keyword(null,"e","e",1381269198).cljs$core$IFn$_invoke$arity$1(d),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Keyword(null,"v","v",21465059).cljs$core$IFn$_invoke$arity$1(d)], null);
} else {
return null;
}
}),datoms);
});
logseq.outliner.pipeline.calculate_children_refs = (function logseq$outliner$pipeline$calculate_children_refs(db_after,children,new_refs){
var children_maps = cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (id){
var temp__5804__auto__ = (function (){var G__154830 = db_after;
var G__154831 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),id], null);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__154830,G__154831) : datascript.core.entity.call(null,G__154830,G__154831));
})();
if(cljs.core.truth_(temp__5804__auto__)){
var entity = temp__5804__auto__;
var from_property = new cljs.core.Keyword("logseq.property","created-from-property","logseq.property/created-from-property",-861892267).cljs$core$IFn$_invoke$arity$1(entity);
var default_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"default","default",-1987822328),new cljs.core.Keyword("logseq.property","type","logseq.property/type",83842404).cljs$core$IFn$_invoke$arity$1(from_property));
var page_QMARK_ = (logseq.db.page_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.page_QMARK_.cljs$core$IFn$_invoke$arity$1(entity) : logseq.db.page_QMARK_.call(null,entity));
if(cljs.core.truth_((function (){var or__5002__auto__ = page_QMARK_;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var and__5000__auto__ = from_property;
if(cljs.core.truth_(and__5000__auto__)){
return (!(default_QMARK_));
} else {
return and__5000__auto__;
}
}
})())){
return null;
} else {
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(entity),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"parent-id","parent-id",-1400729131),cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(entity,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","parent","block/parent",-918309064),new cljs.core.Keyword("db","id","db/id",-1388397098)], null)),new cljs.core.Keyword(null,"block-ref-ids","block-ref-ids",-280941211),cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","id","db/id",-1388397098),new cljs.core.Keyword("block","refs","block/refs",-1214495349).cljs$core$IFn$_invoke$arity$1(entity))], null)], null);
}
} else {
return null;
}
}),children));
var children_refs = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p__154845){
var vec__154849 = p__154845;
var id = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__154849,(0),null);
var map__154852 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__154849,(1),null);
var map__154852__$1 = cljs.core.__destructure_map(map__154852);
var child_map = map__154852__$1;
var block_ref_ids = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__154852__$1,new cljs.core.Keyword(null,"block-ref-ids","block-ref-ids",-280941211));
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("db","id","db/id",-1388397098),id,new cljs.core.Keyword("block","path-refs","block/path-refs",-2109181352),clojure.set.union.cljs$core$IFn$_invoke$arity$variadic(new_refs,block_ref_ids,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([(function (){var parent_refs = cljs.core.PersistentHashSet.EMPTY;
var parent_id = new cljs.core.Keyword(null,"parent-id","parent-id",-1400729131).cljs$core$IFn$_invoke$arity$1(child_map);
while(true){
var temp__5802__auto__ = (children_maps.cljs$core$IFn$_invoke$arity$1 ? children_maps.cljs$core$IFn$_invoke$arity$1(parent_id) : children_maps.call(null,parent_id));
if(cljs.core.truth_(temp__5802__auto__)){
var parent = temp__5802__auto__;
var G__155101 = cljs.core.into.cljs$core$IFn$_invoke$arity$2(parent_refs,new cljs.core.Keyword(null,"block-ref-ids","block-ref-ids",-280941211).cljs$core$IFn$_invoke$arity$1(parent));
var G__155102 = new cljs.core.Keyword(null,"parent-id","parent-id",-1400729131).cljs$core$IFn$_invoke$arity$1(parent);
parent_refs = G__155101;
parent_id = G__155102;
continue;
} else {
return parent_refs;
}
break;
}
})()], 0))], null);
}),children_maps);
return children_refs;
});
logseq.outliner.pipeline.compute_block_path_refs = (function logseq$outliner$pipeline$compute_block_path_refs(p__154877,blocks_STAR_){
var map__154878 = p__154877;
var map__154878__$1 = cljs.core.__destructure_map(map__154878);
var db_before = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__154878__$1,new cljs.core.Keyword(null,"db-before","db-before",-553691536));
var db_after = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__154878__$1,new cljs.core.Keyword(null,"db-after","db-after",-571884666));
var _STAR_computed_ids = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentHashSet.EMPTY);
var blocks = cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (block){
var from_property = new cljs.core.Keyword("logseq.property","created-from-property","logseq.property/created-from-property",-861892267).cljs$core$IFn$_invoke$arity$1(block);
var default_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"default","default",-1987822328),new cljs.core.Keyword("logseq.property","type","logseq.property/type",83842404).cljs$core$IFn$_invoke$arity$1(from_property));
var and__5000__auto__ = from_property;
if(cljs.core.truth_(and__5000__auto__)){
return (!(default_QMARK_));
} else {
return and__5000__auto__;
}
}),blocks_STAR_);
return cljs.core.distinct.cljs$core$IFn$_invoke$arity$1(cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (block){
if(cljs.core.truth_((function (){var G__154887 = new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block);
var fexpr__154886 = cljs.core.deref(_STAR_computed_ids);
return (fexpr__154886.cljs$core$IFn$_invoke$arity$1 ? fexpr__154886.cljs$core$IFn$_invoke$arity$1(G__154887) : fexpr__154886.call(null,G__154887));
})())){
return null;
} else {
var page_QMARK_ = (logseq.db.page_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.page_QMARK_.cljs$core$IFn$_invoke$arity$1(block) : logseq.db.page_QMARK_.call(null,block));
var from_property = new cljs.core.Keyword("logseq.property","created-from-property","logseq.property/created-from-property",-861892267).cljs$core$IFn$_invoke$arity$1(block);
var parents_SINGLEQUOTE_ = (cljs.core.truth_(page_QMARK_)?null:logseq.db.get_block_parents.cljs$core$IFn$_invoke$arity$variadic(db_after,new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.PersistentArrayMap.EMPTY], 0)));
var parents_refs = cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","id","db/id",-1388397098),(function (){var G__154898 = cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword("block","path-refs","block/path-refs",-2109181352),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([parents_SINGLEQUOTE_], 0));
if(cljs.core.truth_(from_property)){
return cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (parent){
var and__5000__auto__ = (logseq.db.property_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.property_QMARK_.cljs$core$IFn$_invoke$arity$1(parent) : logseq.db.property_QMARK_.call(null,parent));
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(parent),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(from_property));
} else {
return and__5000__auto__;
}
}),G__154898);
} else {
return G__154898;
}
})());
var old_refs = (cljs.core.truth_(db_before)?cljs.core.set(cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","id","db/id",-1388397098),new cljs.core.Keyword("block","path-refs","block/path-refs",-2109181352).cljs$core$IFn$_invoke$arity$1((function (){var G__154902 = db_before;
var G__154903 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__154902,G__154903) : datascript.core.entity.call(null,G__154902,G__154903));
})()))):cljs.core.PersistentHashSet.EMPTY);
var new_refs = cljs.core.set(cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic((function (){var G__154905 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","page","block/page",822314108).cljs$core$IFn$_invoke$arity$1(block));
if((G__154905 == null)){
return null;
} else {
return (new cljs.core.PersistentVector(null,1,(5),cljs.core.PersistentVector.EMPTY_NODE,[G__154905],null));
}
})(),cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","id","db/id",-1388397098),new cljs.core.Keyword("block","refs","block/refs",-1214495349).cljs$core$IFn$_invoke$arity$1(block)),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([parents_refs], 0)));
var refs_changed_QMARK_ = cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(old_refs,new_refs);
var children = ((refs_changed_QMARK_)?(cljs.core.truth_(page_QMARK_)?null:(function (){var G__154917 = db_after;
var G__154918 = new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block);
return (logseq.db.get_block_children_ids.cljs$core$IFn$_invoke$arity$2 ? logseq.db.get_block_children_ids.cljs$core$IFn$_invoke$arity$2(G__154917,G__154918) : logseq.db.get_block_children_ids.call(null,G__154917,G__154918));
})()):null);
var children_refs = (cljs.core.truth_(children)?logseq.outliner.pipeline.calculate_children_refs(db_after,children,new_refs):null);
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$3(_STAR_computed_ids,clojure.set.union,cljs.core.set(cljs.core.cons(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block),children)));

return cljs.core.concat.cljs$core$IFn$_invoke$arity$2((cljs.core.truth_((function (){var and__5000__auto__ = cljs.core.seq(new_refs);
if(and__5000__auto__){
var and__5000__auto____$1 = refs_changed_QMARK_;
if(and__5000__auto____$1){
var G__154926 = db_after;
var G__154927 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__154926,G__154927) : datascript.core.entity.call(null,G__154926,G__154927));
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})())?new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("db","id","db/id",-1388397098),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block),new cljs.core.Keyword("block","path-refs","block/path-refs",-2109181352),new_refs], null)], null):null),children_refs);
}
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([blocks], 0)));
});
/**
 * Main fn for computing path-refs
 */
logseq.outliner.pipeline.compute_block_path_refs_tx = (function logseq$outliner$pipeline$compute_block_path_refs_tx(tx_report,blocks){
var refs_tx = logseq.outliner.pipeline.compute_block_path_refs(tx_report,blocks);
var truncate_refs_tx = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (m){
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","retract","db/retract",-1549825231),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(m),new cljs.core.Keyword("block","path-refs","block/path-refs",-2109181352)], null);
}),refs_tx);
return cljs.core.concat.cljs$core$IFn$_invoke$arity$2(truncate_refs_tx,refs_tx);
});
/**
 * ref: entity, map, int, eid
 */
logseq.outliner.pipeline.ref__GT_eid = (function logseq$outliner$pipeline$ref__GT_eid(ref){
if(cljs.core.truth_(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(ref))){
return new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(ref);
} else {
if(cljs.core.truth_(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(ref))){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(ref)], null);
} else {
if(((cljs.core.vector_QMARK_(ref)) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.count(ref),(2))) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),cljs.core.first(ref))))))){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),cljs.core.second(ref)], null);
} else {
if(cljs.core.int_QMARK_(ref)){
return ref;
} else {
throw (new Error(["invalid ref ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(ref)].join('')));

}
}
}
}
});
/**
 * Return ref block ids for given block
 */
logseq.outliner.pipeline.block_content_refs = (function logseq$outliner$pipeline$block_content_refs(db,block){
var content = (function (){var or__5002__auto__ = new cljs.core.Keyword("block","raw-title","block/raw-title",1833669090).cljs$core$IFn$_invoke$arity$1(block);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(block);
}
})();
if(typeof content === 'string'){
return cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (id){
var temp__5804__auto__ = (function (){var G__154969 = db;
var G__154970 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),id], null);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__154969,G__154970) : datascript.core.entity.call(null,G__154969,G__154970));
})();
if(cljs.core.truth_(temp__5804__auto__)){
var e = temp__5804__auto__;
return new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(e);
} else {
return null;
}
}),logseq.db.frontend.content.get_matched_ids(content));
} else {
return null;
}
});
logseq.outliner.pipeline.get_journal_day_from_long = (function logseq$outliner$pipeline$get_journal_day_from_long(db,v){
if(cljs.core.truth_(v)){
var day = logseq.common.util.date_time.ms__GT_journal_day(v);
return new cljs.core.Keyword(null,"e","e",1381269198).cljs$core$IFn$_invoke$arity$1(cljs.core.first(datascript.core.datoms.cljs$core$IFn$_invoke$arity$4(db,new cljs.core.Keyword(null,"avet","avet",1383857032),new cljs.core.Keyword("block","journal-day","block/journal-day",-145748366),day)));
} else {
return null;
}
});
/**
 * Rebuild block refs for DB graphs
 */
logseq.outliner.pipeline.db_rebuild_block_refs = (function logseq$outliner$pipeline$db_rebuild_block_refs(db,block){
var private_built_in_props = cljs.core.set(cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (p__155011){
var vec__155012 = p__155011;
var k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__155012,(0),null);
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__155012,(1),null);
if(cljs.core.truth_(cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(v,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"schema","schema",-1582001791),new cljs.core.Keyword(null,"public?","public?",786025269)], null)))){
return null;
} else {
return k;
}
}),logseq.db.frontend.property.built_in_properties));
var properties = cljs.core.dissoc.cljs$core$IFn$_invoke$arity$variadic(cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,logseq.db.common.entity_plus.lookup_kv_then_entity.cljs$core$IFn$_invoke$arity$2((function (){var G__155016 = db;
var G__155017 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__155016,G__155017) : datascript.core.entity.call(null,G__155016,G__155017));
})(),new cljs.core.Keyword("block","properties","block/properties",708347145))),new cljs.core.Keyword("block","parent","block/parent",-918309064),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("block","page","block/page",822314108),new cljs.core.Keyword("logseq.property","created-by-ref","logseq.property/created-by-ref",854433908),new cljs.core.Keyword("logseq.property.history","block","logseq.property.history/block",114255416),new cljs.core.Keyword("logseq.property.history","property","logseq.property.history/property",1600409082),new cljs.core.Keyword("logseq.property.history","ref-value","logseq.property.history/ref-value",-513136037)], 0));
var property_key_refs = cljs.core.remove.cljs$core$IFn$_invoke$arity$2(private_built_in_props,cljs.core.keys(properties));
var page_or_object_QMARK_ = (function (block__$1){
var and__5000__auto__ = datascript.impl.entity.entity_QMARK_(block__$1);
if(and__5000__auto__){
var and__5000__auto____$1 = (function (){var or__5002__auto__ = (logseq.db.page_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.page_QMARK_.cljs$core$IFn$_invoke$arity$1(block__$1) : logseq.db.page_QMARK_.call(null,block__$1));
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return (logseq.db.object_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.object_QMARK_.cljs$core$IFn$_invoke$arity$1(block__$1) : logseq.db.object_QMARK_.call(null,block__$1));
}
})();
if(cljs.core.truth_(and__5000__auto____$1)){
return cljs.core.not(new cljs.core.Keyword("logseq.property","created-from-property","logseq.property/created-from-property",-861892267).cljs$core$IFn$_invoke$arity$1(block__$1));
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
});
var property_value_refs = cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (p__155024){
var vec__155027 = p__155024;
var property = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__155027,(0),null);
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__155027,(1),null);
if(cljs.core.truth_(page_or_object_QMARK_(v))){
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(v)], null);
} else {
if(((cljs.core.coll_QMARK_(v)) && (cljs.core.every_QMARK_(page_or_object_QMARK_,v)))){
return cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","id","db/id",-1388397098),v);
} else {
var datetime_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"datetime","datetime",494675702),new cljs.core.Keyword("logseq.property","type","logseq.property/type",83842404).cljs$core$IFn$_invoke$arity$1((datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db,property) : datascript.core.entity.call(null,db,property))));
if(((datetime_QMARK_) && (cljs.core.coll_QMARK_(v)))){
return cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (p1__154996_SHARP_){
return logseq.outliner.pipeline.get_journal_day_from_long(db,p1__154996_SHARP_);
}),v);
} else {
if(datetime_QMARK_){
var temp__5804__auto__ = logseq.outliner.pipeline.get_journal_day_from_long(db,v);
if(cljs.core.truth_(temp__5804__auto__)){
var journal_day = temp__5804__auto__;
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [journal_day], null);
} else {
return null;
}
} else {
return null;

}
}

}
}
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([properties], 0));
var property_refs = cljs.core.concat.cljs$core$IFn$_invoke$arity$2(property_key_refs,property_value_refs);
var content_refs = logseq.outliner.pipeline.block_content_refs(db,block);
return cljs.core.remove.cljs$core$IFn$_invoke$arity$2(cljs.core.nil_QMARK_,cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (p1__155000_SHARP_){
return cljs.core.contains_QMARK_(cljs.core.set(cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","id","db/id",-1388397098),new cljs.core.Keyword("block","alias","block/alias",-2112644699).cljs$core$IFn$_invoke$arity$1(block))),p1__155000_SHARP_);
}),cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (p1__154999_SHARP_){
return ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block),p1__154999_SHARP_)) || (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1((datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db,p1__154999_SHARP_) : datascript.core.entity.call(null,db,p1__154999_SHARP_))))));
}),cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic(cljs.core.map.cljs$core$IFn$_invoke$arity$2(logseq.outliner.pipeline.ref__GT_eid,new cljs.core.Keyword("block","tags","block/tags",1814948340).cljs$core$IFn$_invoke$arity$1(block)),(function (){var temp__5804__auto__ = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","link","block/link",-1872399993).cljs$core$IFn$_invoke$arity$1(block));
if(cljs.core.truth_(temp__5804__auto__)){
var id = temp__5804__auto__;
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [id], null);
} else {
return null;
}
})(),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([property_refs,content_refs], 0)))));
});
logseq.outliner.pipeline.rebuild_block_refs_tx = (function logseq$outliner$pipeline$rebuild_block_refs_tx(p__155064,blocks){
var map__155065 = p__155064;
var map__155065__$1 = cljs.core.__destructure_map(map__155065);
var db_after = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__155065__$1,new cljs.core.Keyword(null,"db-after","db-after",-571884666));
return cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (block){
if(cljs.core.truth_((function (){var G__155068 = db_after;
var G__155069 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__155068,G__155069) : datascript.core.entity.call(null,G__155068,G__155069));
})())){
var refs = logseq.outliner.pipeline.db_rebuild_block_refs(db_after,block);
if(cljs.core.seq(refs)){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","retract","db/retract",-1549825231),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block),new cljs.core.Keyword("block","refs","block/refs",-1214495349)], null),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("db","id","db/id",-1388397098),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block),new cljs.core.Keyword("block","refs","block/refs",-1214495349),refs], null)], null);
} else {
return null;
}
} else {
return null;
}
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([blocks], 0));
});
/**
 * Transacts :block/refs and :block/path-refs for a new or imported DB graph
 */
logseq.outliner.pipeline.transact_new_db_graph_refs = (function logseq$outliner$pipeline$transact_new_db_graph_refs(conn,tx_report){
var map__155076 = logseq.outliner.datascript_report.get_blocks_and_pages(tx_report);
var map__155076__$1 = cljs.core.__destructure_map(map__155076);
var blocks = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__155076__$1,new cljs.core.Keyword(null,"blocks","blocks",-610462153));
var refs_tx_report = (function (){var temp__5804__auto__ = (function (){var and__5000__auto__ = cljs.core.seq(blocks);
if(and__5000__auto__){
return logseq.outliner.pipeline.rebuild_block_refs_tx(tx_report,blocks);
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5804__auto__)){
var refs_tx = temp__5804__auto__;
return logseq.db.transact_BANG_.cljs$core$IFn$_invoke$arity$3(conn,refs_tx,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"pipeline-replace?","pipeline-replace?",-758892518),true,new cljs.core.Keyword("logseq.outliner.pipeline","original-tx-meta","logseq.outliner.pipeline/original-tx-meta",-982955986),new cljs.core.Keyword(null,"tx-meta","tx-meta",1159283194).cljs$core$IFn$_invoke$arity$1(tx_report)], null));
} else {
return null;
}
})();
var blocks_SINGLEQUOTE_ = (cljs.core.truth_(refs_tx_report)?cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (b){
var G__155082 = new cljs.core.Keyword(null,"db-after","db-after",-571884666).cljs$core$IFn$_invoke$arity$1(refs_tx_report);
var G__155083 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(b);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__155082,G__155083) : datascript.core.entity.call(null,G__155082,G__155083));
}),blocks):blocks);
var block_path_refs_tx = cljs.core.distinct.cljs$core$IFn$_invoke$arity$1(logseq.outliner.pipeline.compute_block_path_refs_tx(tx_report,blocks_SINGLEQUOTE_));
var path_refs_tx_report = ((cljs.core.seq(block_path_refs_tx))?logseq.db.transact_BANG_.cljs$core$IFn$_invoke$arity$3(conn,block_path_refs_tx,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"pipeline-replace?","pipeline-replace?",-758892518),true], null)):null);
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"refs-tx-report","refs-tx-report",-1862519970),refs_tx_report,new cljs.core.Keyword(null,"path-refs-tx-export","path-refs-tx-export",1672355024),path_refs_tx_report], null);
});

//# sourceMappingURL=logseq.outliner.pipeline.js.map
