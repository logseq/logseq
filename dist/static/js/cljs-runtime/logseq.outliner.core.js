goog.provide('logseq.outliner.core');
logseq.outliner.core.block_map = malli.util.optional_keys.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentVector(null, 6, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"map","map",1371690461),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","id","db/id",-1388397098),new cljs.core.Keyword(null,"int","int",-1741416922)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"or","or",235744169),new cljs.core.Keyword(null,"uuid","uuid",-2145095719),new cljs.core.Keyword(null,"int","int",-1741416922)], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","order","block/order",-1429282437),new cljs.core.Keyword(null,"string","string",-1989541586)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","parent","block/parent",-918309064),new cljs.core.Keyword(null,"map","map",1371690461)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","page","block/page",822314108),new cljs.core.Keyword(null,"map","map",1371690461)], null)], null));
logseq.outliner.core.block_map_or_entity = new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"or","or",235744169),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"fn","fn",-1175266204),datascript.impl.entity.entity_QMARK_], null),logseq.outliner.core.block_map], null);
logseq.outliner.core.block_with_timestamps = (function logseq$outliner$core$block_with_timestamps(block){
var updated_at = logseq.common.util.time_ms();
var block__$1 = (function (){var G__144597 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(block,new cljs.core.Keyword("block","updated-at","block/updated-at",-1516550551),updated_at);
if((new cljs.core.Keyword("block","created-at","block/created-at",1440015).cljs$core$IFn$_invoke$arity$1(block) == null)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__144597,new cljs.core.Keyword("block","created-at","block/created-at",1440015),updated_at);
} else {
return G__144597;
}
})();
return block__$1;
});
logseq.outliner.core.block_with_updated_at = (function logseq$outliner$core$block_with_updated_at(block){
var updated_at = logseq.common.util.time_ms();
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(block,new cljs.core.Keyword("block","updated-at","block/updated-at",-1516550551),updated_at);
});
logseq.outliner.core.filter_top_level_blocks = (function logseq$outliner$core$filter_top_level_blocks(db,blocks){
var parent_ids = clojure.set.intersection.cljs$core$IFn$_invoke$arity$2(cljs.core.set(cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.comp.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","id","db/id",-1388397098),new cljs.core.Keyword("block","parent","block/parent",-918309064)),blocks)),cljs.core.set(cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","id","db/id",-1388397098),blocks)));
return cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (block){
if(datascript.impl.entity.entity_QMARK_(block)){
return block;
} else {
var G__144609 = db;
var G__144610 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__144609,G__144610) : datascript.core.entity.call(null,G__144609,G__144610));
}
}),cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (e){
return cljs.core.contains_QMARK_(parent_ids,new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","parent","block/parent",-918309064).cljs$core$IFn$_invoke$arity$1(e)));
}),blocks));
});
logseq.outliner.core.remove_orphaned_page_refs_BANG_ = (function logseq$outliner$core$remove_orphaned_page_refs_BANG_(db,p__144616,txs_state,old_refs,new_refs,p__144617){
var map__144622 = p__144616;
var map__144622__$1 = cljs.core.__destructure_map(map__144622);
var db_id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__144622__$1,new cljs.core.Keyword("db","id","db/id",-1388397098));
var map__144623 = p__144617;
var map__144623__$1 = cljs.core.__destructure_map(map__144623);
var db_graph_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__144623__$1,new cljs.core.Keyword(null,"db-graph?","db-graph?",-533494876));
if(cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(old_refs,new_refs)){
var new_refs__$1 = cljs.core.set(cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (ref){
var or__5002__auto__ = new cljs.core.Keyword("block","name","block/name",1619760316).cljs$core$IFn$_invoke$arity$1(ref);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var and__5000__auto__ = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(ref);
if(cljs.core.truth_(and__5000__auto__)){
return new cljs.core.Keyword("block","name","block/name",1619760316).cljs$core$IFn$_invoke$arity$1((function (){var G__144633 = db;
var G__144634 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(ref);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__144633,G__144634) : datascript.core.entity.call(null,G__144633,G__144634));
})());
} else {
return and__5000__auto__;
}
}
}),new_refs));
var old_pages = cljs.core.remove.cljs$core$IFn$_invoke$arity$2(cljs.core.nil_QMARK_,cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","name","block/name",1619760316),cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (e){
return cljs.core.contains_QMARK_(new_refs__$1,new cljs.core.Keyword("block","name","block/name",1619760316).cljs$core$IFn$_invoke$arity$1(e));
}),(function (){var G__144638 = db;
var G__144639 = new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"*","*",345799209,null)], null);
var G__144640 = cljs.core.keep.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","id","db/id",-1388397098),old_refs);
return (datascript.core.pull_many.cljs$core$IFn$_invoke$arity$3 ? datascript.core.pull_many.cljs$core$IFn$_invoke$arity$3(G__144638,G__144639,G__144640) : datascript.core.pull_many.call(null,G__144638,G__144639,G__144640));
})())));
var orphaned_pages = ((cljs.core.seq(old_pages))?logseq.db.get_orphaned_pages(db,new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"pages","pages",-285406513),old_pages,new cljs.core.Keyword(null,"built-in-pages-names","built-in-pages-names",-104089994),(cljs.core.truth_(db_graph_QMARK_)?logseq.db.sqlite.create_graph.built_in_pages_names:logseq.graph_parser.db.built_in_pages_names),new cljs.core.Keyword(null,"empty-ref-f","empty-ref-f",666507359),(function (page){
var refs = new cljs.core.Keyword("block","_refs","block/_refs",830218531).cljs$core$IFn$_invoke$arity$1(page);
return (((((cljs.core.count(refs) === (0))) || (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentHashSet.createAsIfByAssoc([db_id]),cljs.core.set(cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","id","db/id",-1388397098),refs)))))) && (((cljs.core.not((logseq.db.class_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.class_QMARK_.cljs$core$IFn$_invoke$arity$1(page) : logseq.db.class_QMARK_.call(null,page)))) && (cljs.core.not((logseq.db.property_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.property_QMARK_.cljs$core$IFn$_invoke$arity$1(page) : logseq.db.property_QMARK_.call(null,page)))))));
})], null)):null);
if(cljs.core.seq(orphaned_pages)){
var tx = cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (page){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","retractEntity","db/retractEntity",-1452737935),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(page)], null);
}),orphaned_pages);
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$2(txs_state,(function (state){
return cljs.core.vec(cljs.core.concat.cljs$core$IFn$_invoke$arity$2(state,tx));
}));
} else {
return null;
}
} else {
return null;
}
});
logseq.outliner.core.update_page_when_save_block = (function logseq$outliner$core$update_page_when_save_block(txs_state,block_entity,m){
var temp__5804__auto__ = new cljs.core.Keyword("block","page","block/page",822314108).cljs$core$IFn$_invoke$arity$1(block_entity);
if(cljs.core.truth_(temp__5804__auto__)){
var e = temp__5804__auto__;
var m_SINGLEQUOTE_ = (function (){var G__144667 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("db","id","db/id",-1388397098),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(e),new cljs.core.Keyword("block","updated-at","block/updated-at",-1516550551),logseq.common.util.time_ms()], null);
if(cljs.core.not(new cljs.core.Keyword("block","created-at","block/created-at",1440015).cljs$core$IFn$_invoke$arity$1(e))){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__144667,new cljs.core.Keyword("block","created-at","block/created-at",1440015),logseq.common.util.time_ms());
} else {
return G__144667;
}
})();
var txs = (cljs.core.truth_((function (){var or__5002__auto__ = new cljs.core.Keyword("block","pre-block?","block/pre-block?",-1671958521).cljs$core$IFn$_invoke$arity$1(block_entity);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword("block","pre-block?","block/pre-block?",-1671958521).cljs$core$IFn$_invoke$arity$1(m);
}
})())?(function (){var properties = new cljs.core.Keyword("block","properties","block/properties",708347145).cljs$core$IFn$_invoke$arity$1(m);
var alias = cljs.core.set(new cljs.core.Keyword(null,"alias","alias",-2039751630).cljs$core$IFn$_invoke$arity$1(properties));
var tags = cljs.core.set(new cljs.core.Keyword(null,"tags","tags",1771418977).cljs$core$IFn$_invoke$arity$1(properties));
var alias__$1 = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p){
return new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("block","name","block/name",1619760316),logseq.common.util.page_name_sanity_lc(p)], null);
}),alias);
var tags__$1 = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p){
return new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("block","name","block/name",1619760316),logseq.common.util.page_name_sanity_lc(p)], null);
}),tags);
var deleteable_page_attributes = new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword("block","alias","block/alias",-2112644699),alias__$1,new cljs.core.Keyword("block","tags","block/tags",1814948340),tags__$1,new cljs.core.Keyword("block","properties","block/properties",708347145),properties,new cljs.core.Keyword("block","properties-text-values","block/properties-text-values",1271244708),new cljs.core.Keyword("block","properties-text-values","block/properties-text-values",1271244708).cljs$core$IFn$_invoke$arity$1(m)], null);
var page_retractions = cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (p1__144664_SHARP_){
return (new cljs.core.PersistentVector(null,3,(5),cljs.core.PersistentVector.EMPTY_NODE,[new cljs.core.Keyword("db","retract","db/retract",-1549825231),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(e),p1__144664_SHARP_],null));
}),cljs.core.keys(deleteable_page_attributes));
return cljs.core.conj.cljs$core$IFn$_invoke$arity$2(page_retractions,cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([m_SINGLEQUOTE_,deleteable_page_attributes], 0)));
})():new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [m_SINGLEQUOTE_], null));
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$3(txs_state,cljs.core.into,txs);
} else {
return null;
}
});
logseq.outliner.core.remove_orphaned_refs_when_save = (function logseq$outliner$core$remove_orphaned_refs_when_save(db,txs_state,block_entity,m,p__144687){
var map__144688 = p__144687;
var map__144688__$1 = cljs.core.__destructure_map(map__144688);
var opts = map__144688__$1;
var db_graph_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__144688__$1,new cljs.core.Keyword(null,"db-graph?","db-graph?",-533494876));
var remove_self_page = (function (p1__144681_SHARP_){
return cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (b){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(b),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","page","block/page",822314108).cljs$core$IFn$_invoke$arity$1(block_entity)));
}),p1__144681_SHARP_);
});
var old_refs = (cljs.core.truth_(db_graph_QMARK_)?(function (){var content_refs = cljs.core.set(logseq.outliner.pipeline.block_content_refs(db,block_entity));
return cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (p1__144682_SHARP_){
return cljs.core.contains_QMARK_(content_refs,new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(p1__144682_SHARP_));
}),new cljs.core.Keyword("block","refs","block/refs",-1214495349).cljs$core$IFn$_invoke$arity$1(block_entity));
})():remove_self_page(new cljs.core.Keyword("block","refs","block/refs",-1214495349).cljs$core$IFn$_invoke$arity$1(block_entity)));
var new_refs = remove_self_page(new cljs.core.Keyword("block","refs","block/refs",-1214495349).cljs$core$IFn$_invoke$arity$1(m));
return logseq.outliner.core.remove_orphaned_page_refs_BANG_(db,block_entity,txs_state,old_refs,new_refs,opts);
});
logseq.outliner.core.get_last_child_or_self = (function logseq$outliner$core$get_last_child_or_self(db,block){
var last_child = (function (){var G__144692 = logseq.db.get_block_last_direct_child_id.cljs$core$IFn$_invoke$arity$3(db,new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block),true);
if((G__144692 == null)){
return null;
} else {
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db,G__144692) : datascript.core.entity.call(null,db,G__144692));
}
})();
var target = (function (){var or__5002__auto__ = last_child;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return block;
}
})();
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [target,(!((last_child == null)))], null);
});
logseq.outliner.core.file_rebuild_block_refs = (function logseq$outliner$core$file_rebuild_block_refs(repo,db,date_formatter,p__144696){
var map__144697 = p__144696;
var map__144697__$1 = cljs.core.__destructure_map(map__144697);
var block = map__144697__$1;
var properties = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__144697__$1,new cljs.core.Keyword("block","properties","block/properties",708347145));
var property_key_refs = cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (property_id){
return new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(logseq.db.get_page(db,cljs.core.name(property_id)));
}),cljs.core.keys(properties));
var property_value_refs = cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (v){
if(((cljs.core.coll_QMARK_(v)) && (cljs.core.uuid_QMARK_(cljs.core.first(v))))){
return v;
} else {
if(cljs.core.uuid_QMARK_(v)){
var temp__5804__auto__ = (function (){var G__144699 = db;
var G__144700 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),v], null);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__144699,G__144700) : datascript.core.entity.call(null,G__144699,G__144700));
})();
if(cljs.core.truth_(temp__5804__auto__)){
var _entity = temp__5804__auto__;
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [v], null);
} else {
return null;
}
} else {
if(((cljs.core.coll_QMARK_(v)) && (typeof cljs.core.first(v) === 'string'))){
return cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (p1__144695_SHARP_){
return logseq.graph_parser.block.extract_refs_from_text(repo,db,p1__144695_SHARP_,date_formatter);
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([v], 0));
} else {
if(typeof v === 'string'){
return logseq.graph_parser.block.extract_refs_from_text(repo,db,v,date_formatter);
} else {
return null;

}
}
}
}
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.vals(properties)], 0));
var property_refs = cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (b){
return ((function (){var G__144703 = db;
var G__144704 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(b)], null);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__144703,G__144704) : datascript.core.entity.call(null,G__144703,G__144704));
})() == null);
}),cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (id_or_map){
if(cljs.core.uuid_QMARK_(id_or_map)){
return new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),id_or_map], null);
} else {
return id_or_map;
}
}),cljs.core.concat.cljs$core$IFn$_invoke$arity$2(property_key_refs,property_value_refs)));
var content_refs = (function (){var temp__5804__auto__ = new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(block);
if(cljs.core.truth_(temp__5804__auto__)){
var content = temp__5804__auto__;
var format = (function (){var or__5002__auto__ = new cljs.core.Keyword("block","format","block/format",-1212045901).cljs$core$IFn$_invoke$arity$1(block);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword(null,"markdown","markdown",1227225089);
}
})();
var content_SINGLEQUOTE_ = [cljs.core.str.cljs$core$IFn$_invoke$arity$1(logseq.common.config.get_block_pattern(format))," ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(content)].join('');
return logseq.graph_parser.block.extract_refs_from_text(repo,db,content_SINGLEQUOTE_,date_formatter);
} else {
return null;
}
})();
return cljs.core.concat.cljs$core$IFn$_invoke$arity$2(property_refs,content_refs);
});
logseq.outliner.core.rebuild_block_refs = (function logseq$outliner$core$rebuild_block_refs(repo,db,date_formatter,block){
if(cljs.core.truth_(logseq.db.sqlite.util.db_based_graph_QMARK_(repo))){
return logseq.outliner.pipeline.db_rebuild_block_refs(db,block);
} else {
return logseq.outliner.core.file_rebuild_block_refs(repo,db,date_formatter,block);
}
});
/**
 * Fix or remove tags related when entered via `Escape`
 */
logseq.outliner.core.fix_tag_ids = (function logseq$outliner$core$fix_tag_ids(m,db,p__144715){
var map__144722 = p__144715;
var map__144722__$1 = cljs.core.__destructure_map(map__144722);
var db_graph_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__144722__$1,new cljs.core.Keyword(null,"db-graph?","db-graph?",-533494876));
var refs = cljs.core.set(cljs.core.keep.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","name","block/name",1619760316),cljs.core.seq(new cljs.core.Keyword("block","refs","block/refs",-1214495349).cljs$core$IFn$_invoke$arity$1(m))));
var tags = cljs.core.seq(new cljs.core.Keyword("block","tags","block/tags",1814948340).cljs$core$IFn$_invoke$arity$1(m));
if(((cljs.core.seq(refs)) && (tags))){
return cljs.core.update.cljs$core$IFn$_invoke$arity$3(m,new cljs.core.Keyword("block","tags","block/tags",1814948340),(function (tags__$1){
var tags__$2 = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (tag){
var or__5002__auto__ = (function (){var and__5000__auto__ = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(tag);
if(cljs.core.truth_(and__5000__auto__)){
var e = (function (){var G__144726 = db;
var G__144727 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(tag);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__144726,G__144727) : datascript.core.entity.call(null,G__144726,G__144727));
})();
return cljs.core.select_keys(e,new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","id","db/id",-1388397098),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Keyword("block","title","block/title",710445684),new cljs.core.Keyword("block","name","block/name",1619760316)], null));
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return tag;
}
}),tags__$1);
var G__144728 = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (tag){
if(cljs.core.contains_QMARK_(refs,new cljs.core.Keyword("block","name","block/name",1619760316).cljs$core$IFn$_invoke$arity$1(tag))){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(tag,new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(cljs.core.first(cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (r){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","name","block/name",1619760316).cljs$core$IFn$_invoke$arity$1(tag),new cljs.core.Keyword("block","name","block/name",1619760316).cljs$core$IFn$_invoke$arity$1(r));
}),new cljs.core.Keyword("block","refs","block/refs",-1214495349).cljs$core$IFn$_invoke$arity$1(m)))));
} else {
return tag;
}
}),tags__$2);
if(cljs.core.truth_(db_graph_QMARK_)){
return (function (tags_SINGLEQUOTE_){
var ref_titles = cljs.core.set(cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","title","block/title",710445684),new cljs.core.Keyword("block","refs","block/refs",-1214495349).cljs$core$IFn$_invoke$arity$1(m)));
var lc_ref_titles = cljs.core.set(cljs.core.map.cljs$core$IFn$_invoke$arity$2(clojure.string.lower_case,ref_titles));
return cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (tag){
var temp__5804__auto__ = new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(tag);
if(cljs.core.truth_(temp__5804__auto__)){
var title = temp__5804__auto__;
return (((!(cljs.core.contains_QMARK_(ref_titles,title)))) && (cljs.core.contains_QMARK_(lc_ref_titles,clojure.string.lower_case(title))));
} else {
return null;
}
}),tags_SINGLEQUOTE_);
})(G__144728);
} else {
return G__144728;
}
}));
} else {
return m;
}
});
logseq.outliner.core.remove_tags_when_title_changed = (function logseq$outliner$core$remove_tags_when_title_changed(block,new_content){
if(cljs.core.truth_((function (){var and__5000__auto__ = new cljs.core.Keyword("block","raw-title","block/raw-title",1833669090).cljs$core$IFn$_invoke$arity$1(block);
if(cljs.core.truth_(and__5000__auto__)){
return new_content;
} else {
return and__5000__auto__;
}
})())){
return cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (tag){
return new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","retract","db/retract",-1549825231),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block),new cljs.core.Keyword("block","tags","block/tags",1814948340),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(tag)], null);
}),cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (tag){
var and__5000__auto__ = (function (){var G__144749 = new cljs.core.Keyword("block","raw-title","block/raw-title",1833669090).cljs$core$IFn$_invoke$arity$1(block);
var G__144750 = tag;
return (logseq.db.inline_tag_QMARK_.cljs$core$IFn$_invoke$arity$2 ? logseq.db.inline_tag_QMARK_.cljs$core$IFn$_invoke$arity$2(G__144749,G__144750) : logseq.db.inline_tag_QMARK_.call(null,G__144749,G__144750));
})();
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.not((logseq.db.inline_tag_QMARK_.cljs$core$IFn$_invoke$arity$2 ? logseq.db.inline_tag_QMARK_.cljs$core$IFn$_invoke$arity$2(new_content,tag) : logseq.db.inline_tag_QMARK_.call(null,new_content,tag)));
} else {
return and__5000__auto__;
}
}),new cljs.core.Keyword("block","tags","block/tags",1814948340).cljs$core$IFn$_invoke$arity$1(block)));
} else {
return null;
}
});
(datascript.impl.entity.Entity.prototype.logseq$outliner$tree$INode$ = cljs.core.PROTOCOL_SENTINEL);

(datascript.impl.entity.Entity.prototype.logseq$outliner$tree$INode$_save$arity$6 = (function (this$,_STAR_txs_state,db,repo,_date_formatter,p__144760){
var map__144761 = p__144760;
var map__144761__$1 = cljs.core.__destructure_map(map__144761);
var retract_attributes_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__144761__$1,new cljs.core.Keyword(null,"retract-attributes?","retract-attributes?",188593703),true);
var retract_attributes = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__144761__$1,new cljs.core.Keyword(null,"retract-attributes","retract-attributes",-1598740703));
var outliner_op = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__144761__$1,new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450));
var this$__$1 = this;
if(logseq.outliner.datascript.outliner_txs_state_QMARK_(_STAR_txs_state)){
} else {
throw (new Error(["Assert failed: ","db should be satisfied outliner-tx-state?","\n","(ds/outliner-txs-state? *txs-state)"].join('')));
}

var data = this$__$1;
var db_based_QMARK_ = logseq.db.sqlite.util.db_based_graph_QMARK_(repo);
var data_SINGLEQUOTE_ = (function (){var G__144764 = ((datascript.impl.entity.entity_QMARK_(data))?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(data.kv,new cljs.core.Keyword("db","id","db/id",-1388397098),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(data)):data);
if(cljs.core.truth_(db_based_QMARK_)){
return cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(G__144764,new cljs.core.Keyword("block","properties","block/properties",708347145));
} else {
return G__144764;
}
})();
var collapse_or_expand_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(outliner_op,new cljs.core.Keyword(null,"collapse-expand-blocks","collapse-expand-blocks",-868833367));
var m_STAR_ = (function (){var G__144766 = logseq.outliner.core.fix_tag_ids(logseq.common.util.remove_nils(cljs.core.dissoc.cljs$core$IFn$_invoke$arity$variadic(data_SINGLEQUOTE_,new cljs.core.Keyword("block","children","block/children",-1040716209),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("block","meta","block/meta",1064819153),new cljs.core.Keyword("block","unordered","block/unordered",-772044101),new cljs.core.Keyword("block.temp","ast-title","block.temp/ast-title",-940352067),new cljs.core.Keyword("block.temp","ast-body","block.temp/ast-body",-464258035),new cljs.core.Keyword("block","level","block/level",1182509971),new cljs.core.Keyword("block.temp","fully-loaded?","block.temp/fully-loaded?",-116637365),new cljs.core.Keyword("block.temp","has-children?","block.temp/has-children?",935519725)], 0))),db,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"db-graph?","db-graph?",-533494876),db_based_QMARK_], null));
if((!(collapse_or_expand_QMARK_))){
return logseq.outliner.core.block_with_updated_at(G__144766);
} else {
return G__144766;
}
})();
var db_id = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(this$__$1);
var block_uuid = new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(this$__$1);
var eid = (function (){var or__5002__auto__ = db_id;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
if(cljs.core.truth_(block_uuid)){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_uuid], null);
} else {
return null;
}
}
})();
var block_entity = (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db,eid) : datascript.core.entity.call(null,db,eid));
var page_QMARK_ = (logseq.db.page_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.page_QMARK_.cljs$core$IFn$_invoke$arity$1(block_entity) : logseq.db.page_QMARK_.call(null,block_entity));
var m_STAR___$1 = (cljs.core.truth_((function (){var and__5000__auto__ = db_based_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
var and__5000__auto____$1 = new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(m_STAR_);
if(cljs.core.truth_(and__5000__auto____$1)){
return cljs.core.not(new cljs.core.Keyword("logseq.property.node","display-type","logseq.property.node/display-type",442446189).cljs$core$IFn$_invoke$arity$1(block_entity));
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})())?cljs.core.update.cljs$core$IFn$_invoke$arity$3(m_STAR_,new cljs.core.Keyword("block","title","block/title",710445684),logseq.common.util.clear_markdown_heading):m_STAR_);
var block_title = new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(m_STAR___$1);
var page_title_changed_QMARK_ = (function (){var and__5000__auto__ = page_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
var and__5000__auto____$1 = block_title;
if(cljs.core.truth_(and__5000__auto____$1)){
return cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(block_title,new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(block_entity));
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})();
var _ = (cljs.core.truth_((function (){var and__5000__auto__ = db_based_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
var and__5000__auto____$1 = page_QMARK_;
if(cljs.core.truth_(and__5000__auto____$1)){
return block_title;
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})())?logseq.outliner.validate.validate_page_title_characters(block_title,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"node","node",581201198),m_STAR___$1], null)):null);
var m_STAR___$2 = (cljs.core.truth_((function (){var and__5000__auto__ = db_based_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return page_title_changed_QMARK_;
} else {
return and__5000__auto__;
}
})())?(function (){var ___$1 = logseq.outliner.validate.validate_page_title(new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(m_STAR___$1),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"node","node",581201198),m_STAR___$1], null));
var page_name = logseq.common.util.page_name_sanity_lc(new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(m_STAR___$1));
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(m_STAR___$1,new cljs.core.Keyword("block","name","block/name",1619760316),page_name);
})():m_STAR___$1);
var ___$1 = (cljs.core.truth_((function (){var and__5000__auto__ = db_based_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
var and__5000__auto____$1 = (function (){var or__5002__auto__ = (logseq.db.page_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.page_QMARK_.cljs$core$IFn$_invoke$arity$1(block_entity) : logseq.db.page_QMARK_.call(null,block_entity));
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return (logseq.db.object_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.object_QMARK_.cljs$core$IFn$_invoke$arity$1(block_entity) : logseq.db.object_QMARK_.call(null,block_entity));
}
})();
if(cljs.core.truth_(and__5000__auto____$1)){
var and__5000__auto____$2 = new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(m_STAR___$2);
if(cljs.core.truth_(and__5000__auto____$2)){
return cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(m_STAR___$2),new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(block_entity));
} else {
return and__5000__auto____$2;
}
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})())?logseq.outliner.validate.validate_block_title(db,new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(m_STAR___$2),block_entity):null);
var m = (function (){var G__144785 = m_STAR___$2;
if(cljs.core.truth_(db_based_QMARK_)){
return cljs.core.dissoc.cljs$core$IFn$_invoke$arity$variadic(G__144785,new cljs.core.Keyword("block","format","block/format",-1212045901),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("block","pre-block?","block/pre-block?",-1671958521),new cljs.core.Keyword("block","priority","block/priority",1491369544),new cljs.core.Keyword("block","marker","block/marker",1231576318),new cljs.core.Keyword("block","properties-order","block/properties-order",-968493873)], 0));
} else {
return G__144785;
}
})();
var e_145369 = (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db,db_id) : datascript.core.entity.call(null,db,db_id));
if(cljs.core.truth_((function (){var and__5000__auto__ = e_145369;
if(cljs.core.truth_(and__5000__auto__)){
return block_uuid;
} else {
return and__5000__auto__;
}
})())){
var uuid_not_changed_QMARK__145370 = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(block_uuid,new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(e_145369));
if(uuid_not_changed_QMARK__145370){
} else {
console.error("Block UUID shouldn't be changed once created");
}

if(uuid_not_changed_QMARK__145370){
} else {
throw (new Error(["Assert failed: ","Block UUID changed","\n","uuid-not-changed?"].join('')));
}
} else {
}

if(cljs.core.truth_(eid)){
if(cljs.core.truth_((function (){var or__5002__auto__ = (function (){var and__5000__auto__ = retract_attributes_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(m);
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.seq(retract_attributes);
}
})())){
var retract_attributes_145371__$1 = cljs.core.concat.cljs$core$IFn$_invoke$arity$2((cljs.core.truth_(db_based_QMARK_)?logseq.db.frontend.schema.retract_attributes:logseq.db.file_based.schema.retract_attributes),retract_attributes);
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$2(_STAR_txs_state,(function (txs){
return cljs.core.vec(cljs.core.concat.cljs$core$IFn$_invoke$arity$2(txs,cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (attribute){
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","retract","db/retract",-1549825231),eid,attribute], null);
}),retract_attributes_145371__$1)));
}));
} else {
}

if(collapse_or_expand_QMARK_){
} else {
logseq.outliner.core.update_page_when_save_block(_STAR_txs_state,block_entity,m);
}

if(cljs.core.truth_((function (){var and__5000__auto__ = new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(m);
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(m),new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(block_entity));
} else {
return and__5000__auto__;
}
})())){
logseq.outliner.core.remove_orphaned_refs_when_save(db,_STAR_txs_state,block_entity,m,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"db-graph?","db-graph?",-533494876),db_based_QMARK_], null));
} else {
}
} else {
}

var other_tx_145375 = new cljs.core.Keyword("db","other-tx","db/other-tx",337296620).cljs$core$IFn$_invoke$arity$1(m);
if(cljs.core.seq(other_tx_145375)){
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$2(_STAR_txs_state,(function (txs){
return cljs.core.vec(cljs.core.concat.cljs$core$IFn$_invoke$arity$2(txs,other_tx_145375));
}));
} else {
}

cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$3(_STAR_txs_state,cljs.core.conj,cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(m,new cljs.core.Keyword("db","other-tx","db/other-tx",337296620)));

if(cljs.core.truth_((function (){var and__5000__auto__ = db_based_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
var and__5000__auto____$1 = new cljs.core.Keyword("block","tags","block/tags",1814948340).cljs$core$IFn$_invoke$arity$1(block_entity);
if(cljs.core.truth_(and__5000__auto____$1)){
return block_entity;
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})())){
var tx_data_145377 = logseq.outliner.core.remove_tags_when_title_changed(block_entity,new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(m));
if(cljs.core.seq(tx_data_145377)){
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$2(_STAR_txs_state,(function (txs){
return cljs.core.concat.cljs$core$IFn$_invoke$arity$2(txs,tx_data_145377);
}));
} else {
}
} else {
}

return this$__$1;
}));

(datascript.impl.entity.Entity.prototype.logseq$outliner$tree$INode$_del$arity$3 = (function (this$,_STAR_txs_state,db){
var this$__$1 = this;
if(logseq.outliner.datascript.outliner_txs_state_QMARK_(_STAR_txs_state)){
} else {
throw (new Error(["Assert failed: ","db should be satisfied outliner-tx-state?","\n","(ds/outliner-txs-state? *txs-state)"].join('')));
}

var block_id = new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(this$__$1);
var ids = cljs.core.remove.cljs$core$IFn$_invoke$arity$2(cljs.core.nil_QMARK_,(function (){var children = (logseq.db.get_block_children.cljs$core$IFn$_invoke$arity$2 ? logseq.db.get_block_children.cljs$core$IFn$_invoke$arity$2(db,block_id) : logseq.db.get_block_children.call(null,db,block_id));
var children_ids = cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),children);
return cljs.core.conj.cljs$core$IFn$_invoke$arity$2(children_ids,block_id);
})());
var txs = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (id){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db.fn","retractEntity","db.fn/retractEntity",-1423535441),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),id], null)], null);
}),ids);
var page_tx = (function (){var block = (function (){var G__144799 = db;
var G__144800 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_id], null);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__144799,G__144800) : datascript.core.entity.call(null,G__144799,G__144800));
})();
if(cljs.core.truth_(new cljs.core.Keyword("block","pre-block?","block/pre-block?",-1671958521).cljs$core$IFn$_invoke$arity$1(block))){
var id = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","page","block/page",822314108).cljs$core$IFn$_invoke$arity$1(block));
return new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","retract","db/retract",-1549825231),id,new cljs.core.Keyword("block","properties","block/properties",708347145)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","retract","db/retract",-1549825231),id,new cljs.core.Keyword("block","properties-order","block/properties-order",-968493873)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","retract","db/retract",-1549825231),id,new cljs.core.Keyword("block","properties-text-values","block/properties-text-values",1271244708)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","retract","db/retract",-1549825231),id,new cljs.core.Keyword("block","alias","block/alias",-2112644699)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","retract","db/retract",-1549825231),id,new cljs.core.Keyword("block","tags","block/tags",1814948340)], null)], null);
} else {
return null;
}
})();
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(_STAR_txs_state,cljs.core.concat,txs,page_tx);

return block_id;
}));
logseq.outliner.core.assoc_level_aux = (function logseq$outliner$core$assoc_level_aux(tree_vec,children_key,init_level){
return cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (block){
var children = cljs.core.get.cljs$core$IFn$_invoke$arity$2(block,children_key);
var children_SINGLEQUOTE_ = (function (){var G__144804 = children;
var G__144805 = children_key;
var G__144806 = (init_level + (1));
return (logseq.outliner.core.assoc_level_aux.cljs$core$IFn$_invoke$arity$3 ? logseq.outliner.core.assoc_level_aux.cljs$core$IFn$_invoke$arity$3(G__144804,G__144805,G__144806) : logseq.outliner.core.assoc_level_aux.call(null,G__144804,G__144805,G__144806));
})();
var G__144807 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(block,new cljs.core.Keyword("block","level","block/level",1182509971),init_level);
if(cljs.core.seq(children_SINGLEQUOTE_)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__144807,children_key,children_SINGLEQUOTE_);
} else {
return G__144807;
}
}),tree_vec);
});
logseq.outliner.core.assoc_level = (function logseq$outliner$core$assoc_level(children_key,tree_vec){
return logseq.outliner.core.assoc_level_aux(tree_vec,children_key,(1));
});
logseq.outliner.core.assign_temp_id = (function logseq$outliner$core$assign_temp_id(blocks,replace_empty_target_QMARK_,target_block){
return cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core.concat,cljs.core.map_indexed.cljs$core$IFn$_invoke$arity$2((function (idx,block){
var replacing_block_QMARK_ = (function (){var and__5000__auto__ = replace_empty_target_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return (idx === (0));
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(replacing_block_QMARK_)){
var db_id = (function (){var or__5002__auto__ = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return ((- idx) - (1));
}
})();
if(cljs.core.seq(new cljs.core.Keyword("block","_parent","block/_parent",-639389670).cljs$core$IFn$_invoke$arity$1(target_block))){
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(block,new cljs.core.Keyword("db","id","db/id",-1388397098),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(target_block),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(target_block)], 0))], null);
} else {
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","retractEntity","db/retractEntity",-1452737935),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(target_block)], null),cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(block,new cljs.core.Keyword("db","id","db/id",-1388397098),db_id)], null);
}
} else {
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(block,new cljs.core.Keyword("db","id","db/id",-1388397098),((- idx) - (1)))], null);
}
}),blocks));
});
logseq.outliner.core.get_id = (function logseq$outliner$core$get_id(x){
if(cljs.core.map_QMARK_(x)){
return new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(x);
} else {
if(cljs.core.vector_QMARK_(x)){
return cljs.core.second(x);
} else {
return x;

}
}
});
logseq.outliner.core.compute_block_parent = (function logseq$outliner$core$compute_block_parent(block,parent,target_block,top_level_QMARK_,sibling_QMARK_,get_new_id,outliner_op,replace_empty_target_QMARK_,idx){
if(cljs.core.truth_((function (){var and__5000__auto__ = cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"insert-blocks","insert-blocks",-1269782013),null,new cljs.core.Keyword(null,"paste","paste",1975741548),null], null), null),outliner_op);
if(and__5000__auto__){
var and__5000__auto____$1 = replace_empty_target_QMARK_;
if(cljs.core.truth_(and__5000__auto____$1)){
return ((clojure.string.blank_QMARK_(new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(target_block))) && ((idx === (0))));
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})())){
return logseq.outliner.core.get_id(new cljs.core.Keyword("block","parent","block/parent",-918309064).cljs$core$IFn$_invoke$arity$1(target_block));
} else {
if(cljs.core.truth_(top_level_QMARK_)){
if(cljs.core.truth_(sibling_QMARK_)){
return new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","parent","block/parent",-918309064).cljs$core$IFn$_invoke$arity$1(target_block));
} else {
return new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(target_block);
}
} else {
return (get_new_id.cljs$core$IFn$_invoke$arity$2 ? get_new_id.cljs$core$IFn$_invoke$arity$2(block,parent) : get_new_id.call(null,block,parent));

}
}
});
/**
 * Converts a `tree-vec` to blocks with `:block/level`.
 *   A `tree-vec` example:
 *   [{:id 1, :children [{:id 2,
 *                     :children [{:id 3}]}]}
 * {:id 4, :children [{:id 5}
 *                    {:id 6}]}]
 */
logseq.outliner.core.tree_vec_flatten = (function logseq$outliner$core$tree_vec_flatten(var_args){
var G__144838 = arguments.length;
switch (G__144838) {
case 1:
return logseq.outliner.core.tree_vec_flatten.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return logseq.outliner.core.tree_vec_flatten.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(logseq.outliner.core.tree_vec_flatten.cljs$core$IFn$_invoke$arity$1 = (function (tree_vec){
return logseq.outliner.core.tree_vec_flatten.cljs$core$IFn$_invoke$arity$2(tree_vec,new cljs.core.Keyword(null,"children","children",-940561982));
}));

(logseq.outliner.core.tree_vec_flatten.cljs$core$IFn$_invoke$arity$2 = (function (tree_vec,children_key){
return cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__144832_SHARP_){
return cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(p1__144832_SHARP_,new cljs.core.Keyword("block","children","block/children",-1040716209));
}),cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (p1__144831_SHARP_){
return cljs.core.tree_seq(cljs.core.map_QMARK_,children_key,p1__144831_SHARP_);
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([logseq.outliner.core.assoc_level(children_key,tree_vec)], 0)));
}));

(logseq.outliner.core.tree_vec_flatten.cljs$lang$maxFixedArity = 2);

/**
 * Save the `block`.
 */
logseq.outliner.core.save_block = (function logseq$outliner$core$save_block(repo,db,date_formatter,block,opts){
if(cljs.core.map_QMARK_(block)){
} else {
throw (new Error("Assert failed: (map? block)"));
}

var _STAR_txs_state = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentVector.EMPTY);
var block_SINGLEQUOTE_ = ((datascript.impl.entity.entity_QMARK_(block))?block:(function (){
if(cljs.core.truth_((function (){var or__5002__auto__ = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block);
}
})())){
} else {
throw (new Error(["Assert failed: ","save-block db/id not exists","\n","(or (:db/id block) (:block/uuid block))"].join('')));
}

var temp__5804__auto__ = (function (){var or__5002__auto__ = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var temp__5804__auto__ = new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block);
if(cljs.core.truth_(temp__5804__auto__)){
var id = temp__5804__auto__;
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),id], null);
} else {
return null;
}
}
})();
if(cljs.core.truth_(temp__5804__auto__)){
var eid = temp__5804__auto__;
var ent = (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db,eid) : datascript.core.entity.call(null,db,eid));
if((!((ent == null)))){
} else {
throw (new Error(["Assert failed: ","save-block entity not exists","\n","(some? ent)"].join('')));
}

return cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([ent,block], 0));
} else {
return null;
}
})()
);
logseq.outliner.tree._save(block_SINGLEQUOTE_,_STAR_txs_state,db,repo,date_formatter,opts);

return new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tx-data","tx-data",934159761),cljs.core.deref(_STAR_txs_state)], null);
});
/**
 * Get `node`'s right siblings.
 */
logseq.outliner.core.get_right_siblings = (function logseq$outliner$core$get_right_siblings(node){
var temp__5804__auto__ = new cljs.core.Keyword("block","parent","block/parent",-918309064).cljs$core$IFn$_invoke$arity$1(node);
if(cljs.core.truth_(temp__5804__auto__)){
var parent = temp__5804__auto__;
var children = logseq.db.sort_by_order(new cljs.core.Keyword("block","_parent","block/_parent",-639389670).cljs$core$IFn$_invoke$arity$1(parent));
return cljs.core.rest(cljs.core.last(cljs.core.split_with((function (p1__144859_SHARP_){
return cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(node),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(p1__144859_SHARP_));
}),children)));
} else {
return null;
}
});
logseq.outliner.core.blocks_with_ordered_list_props = (function logseq$outliner$core$blocks_with_ordered_list_props(repo,blocks,target_block,sibling_QMARK_){
var target_block__$1 = (cljs.core.truth_(sibling_QMARK_)?target_block:(cljs.core.truth_(target_block)?logseq.db.get_down(target_block):null));
var list_type_fn = (function (block){
if(cljs.core.truth_(logseq.db.sqlite.util.db_based_graph_QMARK_(repo))){
return new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("logseq.property","order-list-type","logseq.property/order-list-type",607817111).cljs$core$IFn$_invoke$arity$1(block));
} else {
return cljs.core.get.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","properties","block/properties",708347145).cljs$core$IFn$_invoke$arity$1(block),new cljs.core.Keyword(null,"logseq.order-list-type","logseq.order-list-type",-1819806366));
}
});
var db_based_QMARK_ = logseq.db.sqlite.util.db_based_graph_QMARK_(repo);
var temp__5802__auto__ = (function (){var and__5000__auto__ = target_block__$1;
if(cljs.core.truth_(and__5000__auto__)){
return list_type_fn(target_block__$1);
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5802__auto__)){
var list_type = temp__5802__auto__;
return cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (p__144879){
var map__144880 = p__144879;
var map__144880__$1 = cljs.core.__destructure_map(map__144880);
var block = map__144880__$1;
var title = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__144880__$1,new cljs.core.Keyword("block","title","block/title",710445684));
var format = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__144880__$1,new cljs.core.Keyword("block","format","block/format",-1212045901));
var list_QMARK__SINGLEQUOTE_ = (((!((new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block) == null)))) && ((list_type_fn(block) == null)));
var G__144882 = block;
var G__144882__$1 = ((list_QMARK__SINGLEQUOTE_)?(function (b){
if(cljs.core.truth_(db_based_QMARK_)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(b,new cljs.core.Keyword("logseq.property","order-list-type","logseq.property/order-list-type",607817111),list_type);
} else {
return cljs.core.update.cljs$core$IFn$_invoke$arity$5(b,new cljs.core.Keyword("block","properties","block/properties",708347145),cljs.core.assoc,new cljs.core.Keyword(null,"logseq.order-list-type","logseq.order-list-type",-1819806366),list_type);
}
})(G__144882):G__144882);
if(cljs.core.not(db_based_QMARK_)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__144882__$1,new cljs.core.Keyword("block","title","block/title",710445684),logseq.graph_parser.property.insert_property.cljs$core$IFn$_invoke$arity$5(repo,format,title,new cljs.core.Keyword(null,"logseq.order-list-type","logseq.order-list-type",-1819806366),list_type));
} else {
return G__144882__$1;
}
}),blocks);
} else {
return blocks;
}
});
logseq.outliner.core.get_block_orders = (function logseq$outliner$core$get_block_orders(blocks,target_block,sibling_QMARK_,keep_block_order_QMARK_){
if(cljs.core.truth_((function (){var and__5000__auto__ = keep_block_order_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.every_QMARK_(new cljs.core.Keyword("block","order","block/order",-1429282437),blocks);
} else {
return and__5000__auto__;
}
})())){
return cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","order","block/order",-1429282437),blocks);
} else {
var target_order = new cljs.core.Keyword("block","order","block/order",-1429282437).cljs$core$IFn$_invoke$arity$1(target_block);
var next_sibling_order = new cljs.core.Keyword("block","order","block/order",-1429282437).cljs$core$IFn$_invoke$arity$1(logseq.db.get_right_sibling(target_block));
var first_child = logseq.db.get_down(target_block);
var first_child_order = new cljs.core.Keyword("block","order","block/order",-1429282437).cljs$core$IFn$_invoke$arity$1(first_child);
var start_order = (cljs.core.truth_(sibling_QMARK_)?target_order:null);
var end_order = (cljs.core.truth_(sibling_QMARK_)?next_sibling_order:first_child_order);
var orders = logseq.db.common.order.gen_n_keys(cljs.core.count(blocks),start_order,end_order);
return orders;
}
});
logseq.outliner.core.update_property_ref_when_paste = (function logseq$outliner$core$update_property_ref_when_paste(block,uuids){
var id_lookup = (function (v){
return ((cljs.core.vector_QMARK_(v)) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),cljs.core.first(v))));
});
var resolve_id = (function (v){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),cljs.core.get.cljs$core$IFn$_invoke$arity$3(uuids,cljs.core.last(v),cljs.core.last(v))], null);
});
return cljs.core.reduce_kv((function (r,k,v){
var v_SINGLEQUOTE_ = ((id_lookup(v))?resolve_id(v):((((cljs.core.coll_QMARK_(v)) && (cljs.core.every_QMARK_(id_lookup,v))))?cljs.core.map.cljs$core$IFn$_invoke$arity$2(resolve_id,v):v
));
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(r,k,v_SINGLEQUOTE_);
}),cljs.core.PersistentArrayMap.EMPTY,block);
});
logseq.outliner.core.build_insert_blocks_tx = (function logseq$outliner$core$build_insert_blocks_tx(db,target_block,blocks,uuids,get_new_id,p__144912){
var map__144913 = p__144912;
var map__144913__$1 = cljs.core.__destructure_map(map__144913);
var sibling_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__144913__$1,new cljs.core.Keyword(null,"sibling?","sibling?",-1086129060));
var outliner_op = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__144913__$1,new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450));
var replace_empty_target_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__144913__$1,new cljs.core.Keyword(null,"replace-empty-target?","replace-empty-target?",-923732440));
var insert_template_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__144913__$1,new cljs.core.Keyword(null,"insert-template?","insert-template?",-583901597));
var keep_block_order_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__144913__$1,new cljs.core.Keyword(null,"keep-block-order?","keep-block-order?",1077761724));
var block_ids = cljs.core.set(cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),blocks));
var target_page = (function (){var or__5002__auto__ = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","page","block/page",822314108).cljs$core$IFn$_invoke$arity$1(target_block));
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(target_block);
}
})();
var orders = logseq.outliner.core.get_block_orders(blocks,target_block,sibling_QMARK_,keep_block_order_QMARK_);
return cljs.core.map_indexed.cljs$core$IFn$_invoke$arity$2((function (idx,p__144917){
var map__144920 = p__144917;
var map__144920__$1 = cljs.core.__destructure_map(map__144920);
var block = map__144920__$1;
var parent = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__144920__$1,new cljs.core.Keyword("block","parent","block/parent",-918309064));
var temp__5804__auto__ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(uuids,new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block));
if(cljs.core.truth_(temp__5804__auto__)){
var uuid_SINGLEQUOTE_ = temp__5804__auto__;
var top_level_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","level","block/level",1182509971).cljs$core$IFn$_invoke$arity$1(block),(1));
var parent__$1 = logseq.outliner.core.compute_block_parent(block,parent,target_block,top_level_QMARK_,sibling_QMARK_,get_new_id,outliner_op,replace_empty_target_QMARK_,idx);
var order = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(orders,idx);
var _ = (cljs.core.truth_((function (){var and__5000__auto__ = parent__$1;
if(cljs.core.truth_(and__5000__auto__)){
return order;
} else {
return and__5000__auto__;
}
})())?null:(function(){throw (new Error(["Assert failed: ",["Parent or order is nil: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"parent","parent",-878878779),parent__$1,new cljs.core.Keyword(null,"order","order",-1254677256),order], null))].join(''),"\n","(and parent order)"].join('')))})());
var template_ref_block_ids = (cljs.core.truth_(insert_template_QMARK_)?(function (){var temp__5804__auto____$1 = (function (){var G__144928 = db;
var G__144929 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__144928,G__144929) : datascript.core.entity.call(null,G__144928,G__144929));
})();
if(cljs.core.truth_(temp__5804__auto____$1)){
var block__$1 = temp__5804__auto____$1;
var ref_ids = cljs.core.set(cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Keyword("block","refs","block/refs",-1214495349).cljs$core$IFn$_invoke$arity$1(block__$1)));
return cljs.core.remove.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentHashSet.createAsIfByAssoc([new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block__$1)]),clojure.set.intersection.cljs$core$IFn$_invoke$arity$2(block_ids,ref_ids));
} else {
return null;
}
})():null);
var m = new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword("db","id","db/id",-1388397098),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),uuid_SINGLEQUOTE_,new cljs.core.Keyword("block","page","block/page",822314108),target_page,new cljs.core.Keyword("block","parent","block/parent",-918309064),parent__$1,new cljs.core.Keyword("block","order","block/order",-1429282437),order], null);
var result = cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(cljs.core.update.cljs$core$IFn$_invoke$arity$3(((datascript.impl.entity.entity_QMARK_(block))?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(m,new cljs.core.Keyword("block","level","block/level",1182509971),new cljs.core.Keyword("block","level","block/level",1182509971).cljs$core$IFn$_invoke$arity$1(block)):cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([block,m], 0))),new cljs.core.Keyword("block","title","block/title",710445684),(function (value){
if(cljs.core.seq(template_ref_block_ids)){
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (value__$1,id){
return clojure.string.replace(value__$1,logseq.common.util.page_ref.__GT_page_ref(id),logseq.common.util.page_ref.__GT_page_ref((uuids.cljs$core$IFn$_invoke$arity$1 ? uuids.cljs$core$IFn$_invoke$arity$1(id) : uuids.call(null,id))));
}),value,template_ref_block_ids);
} else {
return value;
}
})),new cljs.core.Keyword("db","id","db/id",-1388397098));
return logseq.outliner.core.update_property_ref_when_paste(result,uuids);
} else {
return null;
}
}),blocks);
});
logseq.outliner.core.insert_blocks_aux = (function logseq$outliner$core$insert_blocks_aux(db,blocks,target_block,p__144940){
var map__144941 = p__144940;
var map__144941__$1 = cljs.core.__destructure_map(map__144941);
var opts = map__144941__$1;
var replace_empty_target_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__144941__$1,new cljs.core.Keyword(null,"replace-empty-target?","replace-empty-target?",-923732440));
var keep_uuid_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__144941__$1,new cljs.core.Keyword(null,"keep-uuid?","keep-uuid?",528472028));
var block_uuids = cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),blocks);
var uuids = cljs.core.zipmap(block_uuids,(cljs.core.truth_(keep_uuid_QMARK_)?block_uuids:cljs.core.repeatedly.cljs$core$IFn$_invoke$arity$1(logseq.common.uuid.gen_uuid)));
var uuids__$1 = (cljs.core.truth_((function (){var and__5000__auto__ = cljs.core.not(keep_uuid_QMARK_);
if(and__5000__auto__){
return replace_empty_target_QMARK_;
} else {
return and__5000__auto__;
}
})())?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(uuids,new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(cljs.core.first(blocks)),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(target_block)):uuids);
var id__GT_new_uuid = cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (block){
var temp__5804__auto__ = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block);
if(cljs.core.truth_(temp__5804__auto__)){
var id = temp__5804__auto__;
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [id,cljs.core.get.cljs$core$IFn$_invoke$arity$2(uuids__$1,new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block))], null);
} else {
return null;
}
}),blocks));
var get_new_id = (function (block,lookup){
if(((cljs.core.map_QMARK_(lookup)) || (((cljs.core.vector_QMARK_(lookup)) || (datascript.impl.entity.entity_QMARK_(lookup)))))){
var temp__5804__auto__ = ((((cljs.core.vector_QMARK_(lookup)) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.first(lookup),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552)))))?cljs.core.get.cljs$core$IFn$_invoke$arity$2(uuids__$1,cljs.core.last(lookup)):cljs.core.get.cljs$core$IFn$_invoke$arity$2(id__GT_new_uuid,new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(lookup)));
if(cljs.core.truth_(temp__5804__auto__)){
var uuid_SINGLEQUOTE_ = temp__5804__auto__;
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),uuid_SINGLEQUOTE_], null);
} else {
return null;
}
} else {
if(cljs.core.integer_QMARK_(lookup)){
return lookup;
} else {
throw (new Error(["[insert-blocks] illegal lookup: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(lookup),", block: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(block)].join('')));

}
}
});
var blocks_tx = logseq.outliner.core.build_insert_blocks_tx(db,target_block,blocks,uuids__$1,get_new_id,opts);
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"blocks-tx","blocks-tx",-1349877329),blocks_tx,new cljs.core.Keyword(null,"id->new-uuid","id->new-uuid",310950620),id__GT_new_uuid], null);
});
logseq.outliner.core.get_target_block = (function logseq$outliner$core$get_target_block(db,blocks,target_block,p__144951){
var map__144952 = p__144951;
var map__144952__$1 = cljs.core.__destructure_map(map__144952);
var outliner_op = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__144952__$1,new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450));
var indent_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__144952__$1,new cljs.core.Keyword(null,"indent?","indent?",1381429379));
var sibling_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__144952__$1,new cljs.core.Keyword(null,"sibling?","sibling?",-1086129060));
var up_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__144952__$1,new cljs.core.Keyword(null,"up?","up?",77854972));
var temp__5804__auto__ = (cljs.core.truth_(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(target_block))?(function (){var G__144953 = db;
var G__144954 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(target_block);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__144953,G__144954) : datascript.core.entity.call(null,G__144953,G__144954));
})():(cljs.core.truth_(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(target_block))?(function (){var G__144955 = db;
var G__144956 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(target_block)], null);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__144955,G__144956) : datascript.core.entity.call(null,G__144955,G__144956));
})():null));
if(cljs.core.truth_(temp__5804__auto__)){
var block = temp__5804__auto__;
var linked = new cljs.core.Keyword("block","link","block/link",-1872399993).cljs$core$IFn$_invoke$arity$1(block);
var up_down_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(outliner_op,new cljs.core.Keyword(null,"move-blocks-up-down","move-blocks-up-down",1370411060));
var vec__144961 = ((up_down_QMARK_)?(cljs.core.truth_(sibling_QMARK_)?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [block,sibling_QMARK_], null):(function (){var target = (function (){var or__5002__auto__ = linked;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return block;
}
})();
if(cljs.core.truth_((function (){var and__5000__auto__ = up_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return ((cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","parent","block/parent",-918309064).cljs$core$IFn$_invoke$arity$1(cljs.core.first(blocks))),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(target))) && (cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","parent","block/parent",-918309064).cljs$core$IFn$_invoke$arity$1((function (){var G__144967 = db;
var G__144968 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","parent","block/parent",-918309064).cljs$core$IFn$_invoke$arity$1(cljs.core.first(blocks)));
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__144967,G__144968) : datascript.core.entity.call(null,G__144967,G__144968));
})())),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(target))));
} else {
return and__5000__auto__;
}
})())){
return logseq.outliner.core.get_last_child_or_self(db,target);
} else {
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [target,false], null);
}
})()):((((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(outliner_op,new cljs.core.Keyword(null,"indent-outdent-blocks","indent-outdent-blocks",-104352713))) && (cljs.core.not(indent_QMARK_))))?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [block,sibling_QMARK_], null):((cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"insert-blocks","insert-blocks",-1269782013),null,new cljs.core.Keyword(null,"move-blocks","move-blocks",-955702999),null], null), null),outliner_op))?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [block,sibling_QMARK_], null):(cljs.core.truth_(linked)?logseq.outliner.core.get_last_child_or_self(db,linked):new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [block,sibling_QMARK_], null)
))));
var block__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__144961,(0),null);
var sibling_QMARK___$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__144961,(1),null);
var sibling_QMARK___$2 = (cljs.core.truth_((logseq.db.page_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.page_QMARK_.cljs$core$IFn$_invoke$arity$1(block__$1) : logseq.db.page_QMARK_.call(null,block__$1)))?false:sibling_QMARK___$1);
var block__$2 = ((datascript.impl.entity.entity_QMARK_(block__$1))?block__$1:(function (){var G__144971 = db;
var G__144972 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block__$1);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__144971,G__144972) : datascript.core.entity.call(null,G__144971,G__144972));
})());
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [block__$2,sibling_QMARK___$2], null);
} else {
return null;
}
});
/**
 * Calculate `:block/level` for all the `blocks`. Blocks should be sorted already.
 */
logseq.outliner.core.blocks_with_level = (function logseq$outliner$core$blocks_with_level(blocks){
if(cljs.core.seq(blocks)){
} else {
throw (new Error("Assert failed: (seq blocks)"));
}

var blocks__$1 = ((cljs.core.sequential_QMARK_(blocks))?blocks:new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [blocks], null));
var root = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(cljs.core.first(blocks__$1),new cljs.core.Keyword("block","level","block/level",1182509971),(1));
var m = new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [root], null);
var blocks__$2 = cljs.core.rest(blocks__$1);
while(true){
if(cljs.core.empty_QMARK_(blocks__$2)){
return m;
} else {
var block = cljs.core.first(blocks__$2);
var parent = new cljs.core.Keyword("block","parent","block/parent",-918309064).cljs$core$IFn$_invoke$arity$1(block);
var parent_level = (cljs.core.truth_(parent)?new cljs.core.Keyword("block","level","block/level",1182509971).cljs$core$IFn$_invoke$arity$1(cljs.core.first(cljs.core.filter.cljs$core$IFn$_invoke$arity$2(((function (m,blocks__$2,block,parent,blocks__$1,root){
return (function (x){
return ((((cljs.core.map_QMARK_(parent)) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(x),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(parent))))) || (((cljs.core.vector_QMARK_(parent)) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(x),cljs.core.second(parent))))));
});})(m,blocks__$2,block,parent,blocks__$1,root))
,m))):null);
var level = (cljs.core.truth_(parent_level)?(parent_level + (1)):(1));
var block__$1 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(block,new cljs.core.Keyword("block","level","block/level",1182509971),level);
var m_SINGLEQUOTE_ = cljs.core.vec(cljs.core.conj.cljs$core$IFn$_invoke$arity$2(m,block__$1));
var G__145479 = m_SINGLEQUOTE_;
var G__145480 = cljs.core.rest(blocks__$2);
m = G__145479;
blocks__$2 = G__145480;
continue;
}
break;
}
});
/**
 * Insert blocks as children (or siblings) of target-node.
 *   Args:
 *  `db`: db
 *  `blocks`: blocks should be sorted already.
 *  `target-block`: where `blocks` will be inserted.
 *  Options:
 *    `sibling?`: as siblings (true) or children (false).
 *    `keep-uuid?`: whether to replace `:block/uuid` from the parameter `blocks`.
 *                  For example, if `blocks` are from internal copy, the uuids
 *                  need to be changed, but there's no need for internal cut or drag & drop.
 *    `keep-block-order?`: whether to replace `:block/order` from the parameter `blocks`.
 *    `outliner-op`: what's the current outliner operation.
 *    `replace-empty-target?`: If the `target-block` is an empty block, whether
 *                             to replace it, it defaults to be `false`.
 *    `update-timestamps?`: whether to update `blocks` timestamps.
 *  ``
 */
logseq.outliner.core.insert_blocks = (function logseq$outliner$core$insert_blocks(repo,db,blocks,target_block,p__145001){
var map__145002 = p__145001;
var map__145002__$1 = cljs.core.__destructure_map(map__145002);
var opts = map__145002__$1;
var _sibling_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__145002__$1,new cljs.core.Keyword(null,"_sibling?","_sibling?",1875730144));
var keep_uuid_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__145002__$1,new cljs.core.Keyword(null,"keep-uuid?","keep-uuid?",528472028));
var keep_block_order_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__145002__$1,new cljs.core.Keyword(null,"keep-block-order?","keep-block-order?",1077761724));
var outliner_op = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__145002__$1,new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450));
var replace_empty_target_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__145002__$1,new cljs.core.Keyword(null,"replace-empty-target?","replace-empty-target?",-923732440));
var update_timestamps_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__145002__$1,new cljs.core.Keyword(null,"update-timestamps?","update-timestamps?",-2028869223),true);
var insert_template_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__145002__$1,new cljs.core.Keyword(null,"insert-template?","insert-template?",-583901597));
if(cljs.core.seq(blocks)){
} else {
throw (new Error("Assert failed: (seq blocks)"));
}

if(cljs.core.truth_(malli.core.validate.cljs$core$IFn$_invoke$arity$2(logseq.outliner.core.block_map_or_entity,target_block))){
} else {
throw (new Error("Assert failed: (m/validate block-map-or-entity target-block)"));
}

var blocks__$1 = cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (b){
var temp__5802__auto__ = (function (){var or__5002__auto__ = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(b);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var temp__5804__auto__ = new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(b);
if(cljs.core.truth_(temp__5804__auto__)){
var id = temp__5804__auto__;
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),id], null);
} else {
return null;
}
}
})();
if(cljs.core.truth_(temp__5802__auto__)){
var eid = temp__5802__auto__;
return cljs.core.dissoc.cljs$core$IFn$_invoke$arity$variadic((function (){var temp__5802__auto____$1 = ((datascript.impl.entity.entity_QMARK_(b))?b:(datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db,eid) : datascript.core.entity.call(null,db,eid)));
if(cljs.core.truth_(temp__5802__auto____$1)){
var e = temp__5802__auto____$1;
return cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,e),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("db","id","db/id",-1388397098),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(e),new cljs.core.Keyword("block","title","block/title",710445684),(function (){var or__5002__auto__ = new cljs.core.Keyword("block","raw-title","block/raw-title",1833669090).cljs$core$IFn$_invoke$arity$1(e);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(e);
}
})()], null),b], 0));
} else {
return b;
}
})(),new cljs.core.Keyword("block","tx-id","block/tx-id",547556161),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("block","refs","block/refs",-1214495349),new cljs.core.Keyword("block","path-refs","block/path-refs",-2109181352)], 0));
} else {
return b;
}
}),blocks);
var vec__145009 = logseq.outliner.core.get_target_block(db,blocks__$1,target_block,opts);
var target_block__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__145009,(0),null);
var sibling_QMARK_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__145009,(1),null);
var _ = (((!((target_block__$1 == null))))?null:(function(){throw (new Error(["Assert failed: ",["Invalid target: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(target_block__$1)].join(''),"\n","(some? target-block)"].join('')))})());
var sibling_QMARK___$1 = (cljs.core.truth_((logseq.db.page_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.page_QMARK_.cljs$core$IFn$_invoke$arity$1(target_block__$1) : logseq.db.page_QMARK_.call(null,target_block__$1)))?false:sibling_QMARK_);
var replace_empty_target_QMARK___$1 = (cljs.core.truth_((function (){var and__5000__auto__ = (!((replace_empty_target_QMARK_ == null)));
if(and__5000__auto__){
var and__5000__auto____$1 = new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(target_block__$1);
if(cljs.core.truth_(and__5000__auto____$1)){
return clojure.string.blank_QMARK_(new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(target_block__$1));
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})())?replace_empty_target_QMARK_:(function (){var and__5000__auto__ = sibling_QMARK___$1;
if(cljs.core.truth_(and__5000__auto__)){
var and__5000__auto____$1 = new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(target_block__$1);
if(cljs.core.truth_(and__5000__auto____$1)){
return ((clojure.string.blank_QMARK_(new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(target_block__$1))) && ((cljs.core.count(blocks__$1) > (1))));
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})());
var db_based_QMARK_ = logseq.db.sqlite.util.db_based_graph_QMARK_(repo);
if(cljs.core.seq(blocks__$1)){
var blocks_SINGLEQUOTE_ = (function (){var blocks_SINGLEQUOTE_ = logseq.outliner.core.blocks_with_level(blocks__$1);
var G__145016 = logseq.outliner.core.blocks_with_ordered_list_props(repo,blocks_SINGLEQUOTE_,target_block__$1,sibling_QMARK___$1);
var G__145016__$1 = (cljs.core.truth_(update_timestamps_QMARK_)?cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (p1__144991_SHARP_){
return cljs.core.dissoc.cljs$core$IFn$_invoke$arity$variadic(p1__144991_SHARP_,new cljs.core.Keyword("block","created-at","block/created-at",1440015),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("block","updated-at","block/updated-at",-1516550551)], 0));
}),G__145016):G__145016);
var G__145016__$2 = cljs.core.mapv.cljs$core$IFn$_invoke$arity$2(logseq.outliner.core.block_with_timestamps,G__145016__$1)
;
if(cljs.core.truth_(db_based_QMARK_)){
return cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (p1__144992_SHARP_){
return cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(p1__144992_SHARP_,new cljs.core.Keyword("block","properties","block/properties",708347145));
}),G__145016__$2);
} else {
return G__145016__$2;
}
})();
var insert_opts = new cljs.core.PersistentArrayMap(null, 6, [new cljs.core.Keyword(null,"sibling?","sibling?",-1086129060),sibling_QMARK___$1,new cljs.core.Keyword(null,"replace-empty-target?","replace-empty-target?",-923732440),replace_empty_target_QMARK___$1,new cljs.core.Keyword(null,"keep-uuid?","keep-uuid?",528472028),keep_uuid_QMARK_,new cljs.core.Keyword(null,"keep-block-order?","keep-block-order?",1077761724),keep_block_order_QMARK_,new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),outliner_op,new cljs.core.Keyword(null,"insert-template?","insert-template?",-583901597),insert_template_QMARK_], null);
var map__145015 = logseq.outliner.core.insert_blocks_aux(db,blocks_SINGLEQUOTE_,target_block__$1,insert_opts);
var map__145015__$1 = cljs.core.__destructure_map(map__145015);
var id__GT_new_uuid = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__145015__$1,new cljs.core.Keyword(null,"id->new-uuid","id->new-uuid",310950620));
var blocks_tx = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__145015__$1,new cljs.core.Keyword(null,"blocks-tx","blocks-tx",-1349877329));
if(cljs.core.truth_(cljs.core.some((function (b){
return (((new cljs.core.Keyword("block","parent","block/parent",-918309064).cljs$core$IFn$_invoke$arity$1(b) == null)) || ((new cljs.core.Keyword("block","order","block/order",-1429282437).cljs$core$IFn$_invoke$arity$1(b) == null)));
}),blocks_tx))){
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2("Invalid outliner data",new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"opts","opts",155075701),insert_opts,new cljs.core.Keyword(null,"tx","tx",466630418),cljs.core.vec(blocks_tx),new cljs.core.Keyword(null,"blocks","blocks",-610462153),cljs.core.vec(blocks__$1),new cljs.core.Keyword(null,"target-block","target-block",348392017),target_block__$1], null));
} else {
var uuids_tx = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (uuid_SINGLEQUOTE_){
return new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),uuid_SINGLEQUOTE_], null);
}),cljs.core.remove.cljs$core$IFn$_invoke$arity$2(cljs.core.nil_QMARK_,cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),blocks_tx)));
var tx = logseq.outliner.core.assign_temp_id(blocks_tx,replace_empty_target_QMARK___$1,target_block__$1);
var from_property = new cljs.core.Keyword("logseq.property","created-from-property","logseq.property/created-from-property",-861892267).cljs$core$IFn$_invoke$arity$1(target_block__$1);
var many_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db.cardinality","many","db.cardinality/many",772806234),new cljs.core.Keyword("db","cardinality","db/cardinality",-104975659).cljs$core$IFn$_invoke$arity$1(from_property));
var property_values_tx = (cljs.core.truth_((function (){var and__5000__auto__ = sibling_QMARK___$1;
if(cljs.core.truth_(and__5000__auto__)){
var and__5000__auto____$1 = from_property;
if(cljs.core.truth_(and__5000__auto____$1)){
return many_QMARK_;
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})())?(function (){var top_level_blocks = cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (p1__144996_SHARP_){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2((1),new cljs.core.Keyword("block","level","block/level",1182509971).cljs$core$IFn$_invoke$arity$1(p1__144996_SHARP_));
}),blocks_SINGLEQUOTE_);
return cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (block){
var temp__5804__auto__ = (function (){var or__5002__auto__ = (function (){var G__145028 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block);
return (id__GT_new_uuid.cljs$core$IFn$_invoke$arity$1 ? id__GT_new_uuid.cljs$core$IFn$_invoke$arity$1(G__145028) : id__GT_new_uuid.call(null,G__145028));
})();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block);
}
})();
if(cljs.core.truth_(temp__5804__auto__)){
var new_id = temp__5804__auto__;
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new_id,new cljs.core.Keyword("logseq.property","created-from-property","logseq.property/created-from-property",-861892267),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(from_property)], null),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","add","db/add",235286841),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","parent","block/parent",-918309064).cljs$core$IFn$_invoke$arity$1(target_block__$1)),new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1((function (){var G__145030 = db;
var G__145031 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(from_property);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__145030,G__145031) : datascript.core.entity.call(null,G__145030,G__145031));
})()),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new_id], null)], null)], null);
} else {
return null;
}
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([top_level_blocks], 0));
})():null);
var full_tx = logseq.common.util.concat_without_nil.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([(cljs.core.truth_((function (){var and__5000__auto__ = keep_uuid_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return replace_empty_target_QMARK___$1;
} else {
return and__5000__auto__;
}
})())?cljs.core.rest(uuids_tx):uuids_tx),tx,property_values_tx], 0));
var full_tx_SINGLEQUOTE_ = clojure.walk.prewalk((function (f){
if(datascript.impl.entity.entity_QMARK_(f)){
var temp__5802__auto__ = (function (){var G__145034 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(f);
return (id__GT_new_uuid.cljs$core$IFn$_invoke$arity$1 ? id__GT_new_uuid.cljs$core$IFn$_invoke$arity$1(G__145034) : id__GT_new_uuid.call(null,G__145034));
})();
if(cljs.core.truth_(temp__5802__auto__)){
var id = temp__5802__auto__;
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),id], null);
} else {
return new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(f);
}
} else {
return f;
}
}),full_tx);
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"tx-data","tx-data",934159761),full_tx_SINGLEQUOTE_,new cljs.core.Keyword(null,"blocks","blocks",-610462153),tx], null);
}
} else {
return null;
}
});
logseq.outliner.core.sort_non_consecutive_blocks = (function logseq$outliner$core$sort_non_consecutive_blocks(db,blocks){
var page_blocks = cljs.core.group_by(new cljs.core.Keyword("block","page","block/page",822314108),blocks);
return cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (p__145036){
var vec__145038 = p__145036;
var _page = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__145038,(0),null);
var blocks__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__145038,(1),null);
return logseq.db.sort_page_random_blocks(db,blocks__$1);
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([page_blocks], 0));
});
logseq.outliner.core.delete_block = (function logseq$outliner$core$delete_block(db,txs_state,node){
logseq.outliner.tree._del(node,txs_state,db);

return cljs.core.deref(txs_state);
});
logseq.outliner.core.get_top_level_blocks = (function logseq$outliner$core$get_top_level_blocks(top_level_blocks,non_consecutive_QMARK_){
var reversed_QMARK_ = (function (){var and__5000__auto__ = cljs.core.not(non_consecutive_QMARK_);
if(and__5000__auto__){
var and__5000__auto____$1 = new cljs.core.Keyword("block","order","block/order",-1429282437).cljs$core$IFn$_invoke$arity$1(cljs.core.first(top_level_blocks));
if(cljs.core.truth_(and__5000__auto____$1)){
var and__5000__auto____$2 = new cljs.core.Keyword("block","order","block/order",-1429282437).cljs$core$IFn$_invoke$arity$1(cljs.core.second(top_level_blocks));
if(cljs.core.truth_(and__5000__auto____$2)){
return (cljs.core.compare(new cljs.core.Keyword("block","order","block/order",-1429282437).cljs$core$IFn$_invoke$arity$1(cljs.core.first(top_level_blocks)),new cljs.core.Keyword("block","order","block/order",-1429282437).cljs$core$IFn$_invoke$arity$1(cljs.core.second(top_level_blocks))) > (0));
} else {
return and__5000__auto____$2;
}
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(reversed_QMARK_)){
return cljs.core.reverse(top_level_blocks);
} else {
return top_level_blocks;
}
});
/**
 * Delete blocks from the tree.
 */
logseq.outliner.core.delete_blocks = (function logseq$outliner$core$delete_blocks(db,blocks){
var top_level_blocks = logseq.outliner.core.filter_top_level_blocks(db,blocks);
var non_consecutive_QMARK_ = (((cljs.core.count(top_level_blocks) > (1))) && (cljs.core.seq(logseq.db.get_non_consecutive_blocks(db,top_level_blocks))));
var top_level_blocks_STAR_ = cljs.core.remove.cljs$core$IFn$_invoke$arity$2(logseq.db.page_QMARK_,logseq.outliner.core.get_top_level_blocks(top_level_blocks,non_consecutive_QMARK_));
var top_level_blocks__$1 = cljs.core.remove.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("logseq.property","built-in?","logseq.property/built-in?",-1125958160),top_level_blocks_STAR_);
var txs_state = logseq.outliner.datascript.new_outliner_txs_state();
var block_ids = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (b){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(b)], null);
}),top_level_blocks__$1);
var start_block = cljs.core.first(top_level_blocks__$1);
var end_block = cljs.core.last(top_level_blocks__$1);
var delete_one_block_QMARK_ = ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2((1),cljs.core.count(top_level_blocks__$1))) || (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(start_block,end_block)));
if(cljs.core.seq(cljs.core.filter.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("logseq.property","built-in?","logseq.property/built-in?",-1125958160),top_level_blocks_STAR_))){
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2("Built-in nodes can't be deleted",new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"type","type",1174270348),new cljs.core.Keyword(null,"notification","notification",-222338233),new cljs.core.Keyword(null,"payload","payload",-383036092),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"message","message",-406056002),"Built-in nodes can't be deleted",new cljs.core.Keyword(null,"type","type",1174270348),new cljs.core.Keyword(null,"error","error",-978969032)], null)], null));
} else {
}

if(cljs.core.seq(top_level_blocks__$1)){
var from_property_145529 = new cljs.core.Keyword("logseq.property","created-from-property","logseq.property/created-from-property",-861892267).cljs$core$IFn$_invoke$arity$1(start_block);
var default_value_property_QMARK__145530 = (function (){var and__5000__auto__ = new cljs.core.Keyword("logseq.property","default-value","logseq.property/default-value",-892079662).cljs$core$IFn$_invoke$arity$1(from_property_145529);
if(cljs.core.truth_(and__5000__auto__)){
return ((cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(start_block),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("logseq.property","default-value","logseq.property/default-value",-892079662).cljs$core$IFn$_invoke$arity$1(from_property_145529)))) && (cljs.core.not(new cljs.core.Keyword("block","closed-value-property","block/closed-value-property",1157792813).cljs$core$IFn$_invoke$arity$1(start_block))));
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_((function (){var and__5000__auto__ = delete_one_block_QMARK_;
if(and__5000__auto__){
return default_value_property_QMARK__145530;
} else {
return and__5000__auto__;
}
})())){
var datoms_145532 = datascript.core.datoms.cljs$core$IFn$_invoke$arity$4(db,new cljs.core.Keyword(null,"avet","avet",1383857032),new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(from_property_145529),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(start_block));
var tx_data_145533 = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (d){
return cljs.core.PersistentArrayMap.createAsIfByAssoc([new cljs.core.Keyword("db","id","db/id",-1388397098),new cljs.core.Keyword(null,"e","e",1381269198).cljs$core$IFn$_invoke$arity$1(d),new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(from_property_145529),new cljs.core.Keyword("logseq.property","empty-placeholder","logseq.property/empty-placeholder",-1595021837)]);
}),datoms_145532);
if(cljs.core.seq(tx_data_145533)){
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$3(txs_state,cljs.core.concat,tx_data_145533);
} else {
}
} else {
if(delete_one_block_QMARK_){
logseq.outliner.core.delete_block(db,txs_state,start_block);
} else {
var seq__145061_145534 = cljs.core.seq(block_ids);
var chunk__145062_145535 = null;
var count__145063_145536 = (0);
var i__145064_145537 = (0);
while(true){
if((i__145064_145537 < count__145063_145536)){
var id_145538 = chunk__145062_145535.cljs$core$IIndexed$_nth$arity$2(null,i__145064_145537);
var node_145539 = (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db,id_145538) : datascript.core.entity.call(null,db,id_145538));
logseq.outliner.tree._del(node_145539,txs_state,db);


var G__145540 = seq__145061_145534;
var G__145541 = chunk__145062_145535;
var G__145542 = count__145063_145536;
var G__145543 = (i__145064_145537 + (1));
seq__145061_145534 = G__145540;
chunk__145062_145535 = G__145541;
count__145063_145536 = G__145542;
i__145064_145537 = G__145543;
continue;
} else {
var temp__5804__auto___145544 = cljs.core.seq(seq__145061_145534);
if(temp__5804__auto___145544){
var seq__145061_145546__$1 = temp__5804__auto___145544;
if(cljs.core.chunked_seq_QMARK_(seq__145061_145546__$1)){
var c__5525__auto___145547 = cljs.core.chunk_first(seq__145061_145546__$1);
var G__145548 = cljs.core.chunk_rest(seq__145061_145546__$1);
var G__145549 = c__5525__auto___145547;
var G__145550 = cljs.core.count(c__5525__auto___145547);
var G__145551 = (0);
seq__145061_145534 = G__145548;
chunk__145062_145535 = G__145549;
count__145063_145536 = G__145550;
i__145064_145537 = G__145551;
continue;
} else {
var id_145553 = cljs.core.first(seq__145061_145546__$1);
var node_145554 = (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db,id_145553) : datascript.core.entity.call(null,db,id_145553));
logseq.outliner.tree._del(node_145554,txs_state,db);


var G__145556 = cljs.core.next(seq__145061_145546__$1);
var G__145557 = null;
var G__145558 = (0);
var G__145559 = (0);
seq__145061_145534 = G__145556;
chunk__145062_145535 = G__145557;
count__145063_145536 = G__145558;
i__145064_145537 = G__145559;
continue;
}
} else {
}
}
break;
}

}
}
} else {
}

return new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tx-data","tx-data",934159761),cljs.core.deref(txs_state)], null);
});
logseq.outliner.core.move_to_original_position_QMARK_ = (function logseq$outliner$core$move_to_original_position_QMARK_(blocks,target_block,sibling_QMARK_,non_consecutive_blocks_QMARK_){
var block = cljs.core.first(blocks);
var db = target_block.db;
var and__5000__auto__ = cljs.core.not(non_consecutive_blocks_QMARK_);
if(and__5000__auto__){
if(cljs.core.truth_(sibling_QMARK_)){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(logseq.db.get_left_sibling(block)),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(target_block));
} else {
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(logseq.db.get_first_child(db,new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(target_block))),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block));
}
} else {
return and__5000__auto__;
}
});
logseq.outliner.core.move_block = (function logseq$outliner$core$move_block(db,block,target_block,sibling_QMARK_){
var target_block__$1 = (function (){var G__145077 = db;
var G__145078 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(target_block);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__145077,G__145078) : datascript.core.entity.call(null,G__145077,G__145078));
})();
var block__$1 = (function (){var G__145079 = db;
var G__145080 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__145079,G__145080) : datascript.core.entity.call(null,G__145079,G__145080));
})();
var first_block_page = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","page","block/page",822314108).cljs$core$IFn$_invoke$arity$1(block__$1));
var target_page = (function (){var or__5002__auto__ = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","page","block/page",822314108).cljs$core$IFn$_invoke$arity$1(target_block__$1));
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(target_block__$1);
}
})();
var not_same_page_QMARK_ = cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(first_block_page,target_page);
var block_order = (cljs.core.truth_(sibling_QMARK_)?logseq.db.common.order.gen_key(new cljs.core.Keyword("block","order","block/order",-1429282437).cljs$core$IFn$_invoke$arity$1(target_block__$1),new cljs.core.Keyword("block","order","block/order",-1429282437).cljs$core$IFn$_invoke$arity$1(logseq.db.get_right_sibling(target_block__$1))):logseq.db.common.order.gen_key(null,new cljs.core.Keyword("block","order","block/order",-1429282437).cljs$core$IFn$_invoke$arity$1(logseq.db.get_down(target_block__$1))));
var tx_data = new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [(function (){var G__145083 = new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword("db","id","db/id",-1388397098),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block__$1),new cljs.core.Keyword("block","parent","block/parent",-918309064),(cljs.core.truth_(sibling_QMARK_)?new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","parent","block/parent",-918309064).cljs$core$IFn$_invoke$arity$1(target_block__$1)):new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(target_block__$1)),new cljs.core.Keyword("block","order","block/order",-1429282437),block_order], null);
if(not_same_page_QMARK_){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__145083,new cljs.core.Keyword("block","page","block/page",822314108),target_page);
} else {
return G__145083;
}
})()], null);
var children_page_tx = ((not_same_page_QMARK_)?(function (){var children_ids = (function (){var G__145085 = db;
var G__145086 = new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block__$1);
return (logseq.db.get_block_children_ids.cljs$core$IFn$_invoke$arity$2 ? logseq.db.get_block_children_ids.cljs$core$IFn$_invoke$arity$2(G__145085,G__145086) : logseq.db.get_block_children_ids.call(null,G__145085,G__145086));
})();
return cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (id){
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),id,new cljs.core.Keyword("block","page","block/page",822314108),target_page], null);
}),children_ids);
})():null);
var target_from_property = new cljs.core.Keyword("logseq.property","created-from-property","logseq.property/created-from-property",-861892267).cljs$core$IFn$_invoke$arity$1(target_block__$1);
var block_from_property = new cljs.core.Keyword("logseq.property","created-from-property","logseq.property/created-from-property",-861892267).cljs$core$IFn$_invoke$arity$1(block__$1);
var property_tx = (function (){var retract_property_tx = (cljs.core.truth_(block_from_property)?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","retract","db/retract",-1549825231),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","parent","block/parent",-918309064).cljs$core$IFn$_invoke$arity$1(block__$1)),new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(block_from_property),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block__$1)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","retract","db/retract",-1549825231),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block__$1),new cljs.core.Keyword("logseq.property","created-from-property","logseq.property/created-from-property",-861892267)], null)], null):null);
var add_property_tx = (cljs.core.truth_((function (){var and__5000__auto__ = sibling_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
var and__5000__auto____$1 = target_from_property;
if(cljs.core.truth_(and__5000__auto____$1)){
return cljs.core.not(block_from_property);
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})())?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","add","db/add",235286841),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block__$1),new cljs.core.Keyword("logseq.property","created-from-property","logseq.property/created-from-property",-861892267),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(target_from_property)], null),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","add","db/add",235286841),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","parent","block/parent",-918309064).cljs$core$IFn$_invoke$arity$1(target_block__$1)),new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(target_from_property),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block__$1)], null)], null):null);
return cljs.core.concat.cljs$core$IFn$_invoke$arity$2(retract_property_tx,add_property_tx);
})();
return logseq.common.util.concat_without_nil.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([tx_data,children_page_tx,property_tx], 0));
});
/**
 * Move `blocks` to `target-block` as siblings or children.
 */
logseq.outliner.core.move_blocks = (function logseq$outliner$core$move_blocks(_repo,conn,blocks,target_block,p__145090){
var map__145091 = p__145090;
var map__145091__$1 = cljs.core.__destructure_map(map__145091);
var opts = map__145091__$1;
var _sibling_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__145091__$1,new cljs.core.Keyword(null,"_sibling?","_sibling?",1875730144));
var _up_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__145091__$1,new cljs.core.Keyword(null,"_up?","_up?",356267002));
var outliner_op = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__145091__$1,new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450));
var _indent_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__145091__$1,new cljs.core.Keyword(null,"_indent?","_indent?",-1442751225));
if(cljs.core.seq(blocks)){
} else {
throw (new Error("Assert failed: (seq blocks)"));
}

if(cljs.core.truth_(malli.core.validate.cljs$core$IFn$_invoke$arity$2(logseq.outliner.core.block_map_or_entity,target_block))){
} else {
throw (new Error("Assert failed: (m/validate block-map-or-entity target-block)"));
}

var db = cljs.core.deref(conn);
var top_level_blocks = logseq.outliner.core.filter_top_level_blocks(db,blocks);
var vec__145094 = logseq.outliner.core.get_target_block(db,top_level_blocks,target_block,opts);
var target_block__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__145094,(0),null);
var sibling_QMARK_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__145094,(1),null);
var non_consecutive_QMARK_ = (((cljs.core.count(top_level_blocks) > (1))) && (cljs.core.seq(logseq.db.get_non_consecutive_blocks(db,top_level_blocks))));
var top_level_blocks__$1 = logseq.outliner.core.get_top_level_blocks(top_level_blocks,non_consecutive_QMARK_);
var blocks__$1 = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (block){
if(datascript.impl.entity.entity_QMARK_(block)){
return block;
} else {
var G__145101 = db;
var G__145102 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__145101,G__145102) : datascript.core.entity.call(null,G__145101,G__145102));
}
}),((non_consecutive_QMARK_)?logseq.outliner.core.sort_non_consecutive_blocks(db,top_level_blocks__$1):top_level_blocks__$1));
var original_position_QMARK_ = logseq.outliner.core.move_to_original_position_QMARK_(blocks__$1,target_block__$1,sibling_QMARK_,non_consecutive_QMARK_);
if((((!(cljs.core.contains_QMARK_(cljs.core.set(cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","id","db/id",-1388397098),blocks__$1)),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(target_block__$1))))) && ((!(original_position_QMARK_))))){
var parents_SINGLEQUOTE_ = cljs.core.set(cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","id","db/id",-1388397098),logseq.db.get_block_parents.cljs$core$IFn$_invoke$arity$variadic(db,new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(target_block__$1),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.PersistentArrayMap.EMPTY], 0))));
var move_parents_to_child_QMARK_ = cljs.core.some(parents_SINGLEQUOTE_,cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","id","db/id",-1388397098),blocks__$1));
if(cljs.core.truth_(move_parents_to_child_QMARK_)){
return null;
} else {
if((!((logseq.outliner.batch_tx.get_batch_db_before() == null)))){
var seq__145103_145575 = cljs.core.seq(cljs.core.map.cljs$core$IFn$_invoke$arity$3(cljs.core.vector,cljs.core.range.cljs$core$IFn$_invoke$arity$1(cljs.core.count(blocks__$1)),blocks__$1));
var chunk__145104_145576 = null;
var count__145105_145577 = (0);
var i__145106_145578 = (0);
while(true){
if((i__145106_145578 < count__145105_145577)){
var vec__145128_145579 = chunk__145104_145576.cljs$core$IIndexed$_nth$arity$2(null,i__145106_145578);
var idx_145580 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__145128_145579,(0),null);
var block_145581 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__145128_145579,(1),null);
var first_block_QMARK__145582 = (idx_145580 === (0));
var sibling_QMARK__145583__$1 = ((first_block_QMARK__145582)?sibling_QMARK_:true);
var target_block_145584__$2 = ((first_block_QMARK__145582)?target_block__$1:(function (){var G__145131 = cljs.core.deref(conn);
var G__145132 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(cljs.core.nth.cljs$core$IFn$_invoke$arity$2(blocks__$1,(idx_145580 - (1))));
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__145131,G__145132) : datascript.core.entity.call(null,G__145131,G__145132));
})());
var block_145585__$1 = (function (){var G__145133 = cljs.core.deref(conn);
var G__145134 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block_145581);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__145133,G__145134) : datascript.core.entity.call(null,G__145133,G__145134));
})();
if(logseq.outliner.core.move_to_original_position_QMARK_(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [block_145585__$1], null),target_block_145584__$2,sibling_QMARK__145583__$1,false)){
} else {
var tx_data_145586 = logseq.outliner.core.move_block(cljs.core.deref(conn),block_145585__$1,target_block_145584__$2,sibling_QMARK__145583__$1);
logseq.db.transact_BANG_.cljs$core$IFn$_invoke$arity$3(conn,tx_data_145586,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"sibling?","sibling?",-1086129060),sibling_QMARK__145583__$1,new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),(function (){var or__5002__auto__ = outliner_op;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword(null,"move-blocks","move-blocks",-955702999);
}
})()], null));
}


var G__145618 = seq__145103_145575;
var G__145619 = chunk__145104_145576;
var G__145620 = count__145105_145577;
var G__145621 = (i__145106_145578 + (1));
seq__145103_145575 = G__145618;
chunk__145104_145576 = G__145619;
count__145105_145577 = G__145620;
i__145106_145578 = G__145621;
continue;
} else {
var temp__5804__auto___145622 = cljs.core.seq(seq__145103_145575);
if(temp__5804__auto___145622){
var seq__145103_145623__$1 = temp__5804__auto___145622;
if(cljs.core.chunked_seq_QMARK_(seq__145103_145623__$1)){
var c__5525__auto___145624 = cljs.core.chunk_first(seq__145103_145623__$1);
var G__145625 = cljs.core.chunk_rest(seq__145103_145623__$1);
var G__145626 = c__5525__auto___145624;
var G__145627 = cljs.core.count(c__5525__auto___145624);
var G__145628 = (0);
seq__145103_145575 = G__145625;
chunk__145104_145576 = G__145626;
count__145105_145577 = G__145627;
i__145106_145578 = G__145628;
continue;
} else {
var vec__145141_145629 = cljs.core.first(seq__145103_145623__$1);
var idx_145630 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__145141_145629,(0),null);
var block_145631 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__145141_145629,(1),null);
var first_block_QMARK__145636 = (idx_145630 === (0));
var sibling_QMARK__145637__$1 = ((first_block_QMARK__145636)?sibling_QMARK_:true);
var target_block_145638__$2 = ((first_block_QMARK__145636)?target_block__$1:(function (){var G__145145 = cljs.core.deref(conn);
var G__145146 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(cljs.core.nth.cljs$core$IFn$_invoke$arity$2(blocks__$1,(idx_145630 - (1))));
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__145145,G__145146) : datascript.core.entity.call(null,G__145145,G__145146));
})());
var block_145639__$1 = (function (){var G__145147 = cljs.core.deref(conn);
var G__145148 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block_145631);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__145147,G__145148) : datascript.core.entity.call(null,G__145147,G__145148));
})();
if(logseq.outliner.core.move_to_original_position_QMARK_(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [block_145639__$1], null),target_block_145638__$2,sibling_QMARK__145637__$1,false)){
} else {
var tx_data_145652 = logseq.outliner.core.move_block(cljs.core.deref(conn),block_145639__$1,target_block_145638__$2,sibling_QMARK__145637__$1);
logseq.db.transact_BANG_.cljs$core$IFn$_invoke$arity$3(conn,tx_data_145652,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"sibling?","sibling?",-1086129060),sibling_QMARK__145637__$1,new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),(function (){var or__5002__auto__ = outliner_op;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword(null,"move-blocks","move-blocks",-955702999);
}
})()], null));
}


var G__145668 = cljs.core.next(seq__145103_145623__$1);
var G__145669 = null;
var G__145670 = (0);
var G__145671 = (0);
seq__145103_145575 = G__145668;
chunk__145104_145576 = G__145669;
count__145105_145577 = G__145670;
i__145106_145578 = G__145671;
continue;
}
} else {
}
}
break;
}
} else {
try{var tx_meta__41780__auto___145676 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(cljs.core.dissoc.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"move-blocks","move-blocks",-955702999)], null),new cljs.core.Keyword(null,"additional-tx","additional-tx",-343057604),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"transact-opts","transact-opts",187283396)], 0)),new cljs.core.Keyword("batch-tx","batch-tx-mode?","batch-tx/batch-tx-mode?",1787753099),true);
logseq.outliner.batch_tx.set_batch_opts(tx_meta__41780__auto___145676);

logseq.outliner.batch_tx.set_batch_db_before_BANG_(cljs.core.deref(conn));

var seq__145155_145678 = cljs.core.seq(cljs.core.map.cljs$core$IFn$_invoke$arity$3(cljs.core.vector,cljs.core.range.cljs$core$IFn$_invoke$arity$1(cljs.core.count(blocks__$1)),blocks__$1));
var chunk__145156_145679 = null;
var count__145157_145680 = (0);
var i__145158_145681 = (0);
while(true){
if((i__145158_145681 < count__145157_145680)){
var vec__145182_145689 = chunk__145156_145679.cljs$core$IIndexed$_nth$arity$2(null,i__145158_145681);
var idx_145690 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__145182_145689,(0),null);
var block_145691 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__145182_145689,(1),null);
var first_block_QMARK__145698 = (idx_145690 === (0));
var sibling_QMARK__145699__$1 = ((first_block_QMARK__145698)?sibling_QMARK_:true);
var target_block_145700__$2 = ((first_block_QMARK__145698)?target_block__$1:(function (){var G__145186 = cljs.core.deref(conn);
var G__145187 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(cljs.core.nth.cljs$core$IFn$_invoke$arity$2(blocks__$1,(idx_145690 - (1))));
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__145186,G__145187) : datascript.core.entity.call(null,G__145186,G__145187));
})());
var block_145701__$1 = (function (){var G__145189 = cljs.core.deref(conn);
var G__145190 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block_145691);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__145189,G__145190) : datascript.core.entity.call(null,G__145189,G__145190));
})();
if(logseq.outliner.core.move_to_original_position_QMARK_(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [block_145701__$1], null),target_block_145700__$2,sibling_QMARK__145699__$1,false)){
} else {
var tx_data_145712 = logseq.outliner.core.move_block(cljs.core.deref(conn),block_145701__$1,target_block_145700__$2,sibling_QMARK__145699__$1);
logseq.db.transact_BANG_.cljs$core$IFn$_invoke$arity$3(conn,tx_data_145712,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"sibling?","sibling?",-1086129060),sibling_QMARK__145699__$1,new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),(function (){var or__5002__auto__ = outliner_op;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword(null,"move-blocks","move-blocks",-955702999);
}
})()], null));
}


var G__145713 = seq__145155_145678;
var G__145714 = chunk__145156_145679;
var G__145715 = count__145157_145680;
var G__145716 = (i__145158_145681 + (1));
seq__145155_145678 = G__145713;
chunk__145156_145679 = G__145714;
count__145157_145680 = G__145715;
i__145158_145681 = G__145716;
continue;
} else {
var temp__5804__auto___145718 = cljs.core.seq(seq__145155_145678);
if(temp__5804__auto___145718){
var seq__145155_145720__$1 = temp__5804__auto___145718;
if(cljs.core.chunked_seq_QMARK_(seq__145155_145720__$1)){
var c__5525__auto___145721 = cljs.core.chunk_first(seq__145155_145720__$1);
var G__145722 = cljs.core.chunk_rest(seq__145155_145720__$1);
var G__145723 = c__5525__auto___145721;
var G__145724 = cljs.core.count(c__5525__auto___145721);
var G__145725 = (0);
seq__145155_145678 = G__145722;
chunk__145156_145679 = G__145723;
count__145157_145680 = G__145724;
i__145158_145681 = G__145725;
continue;
} else {
var vec__145191_145726 = cljs.core.first(seq__145155_145720__$1);
var idx_145727 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__145191_145726,(0),null);
var block_145728 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__145191_145726,(1),null);
var first_block_QMARK__145729 = (idx_145727 === (0));
var sibling_QMARK__145730__$1 = ((first_block_QMARK__145729)?sibling_QMARK_:true);
var target_block_145731__$2 = ((first_block_QMARK__145729)?target_block__$1:(function (){var G__145195 = cljs.core.deref(conn);
var G__145196 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(cljs.core.nth.cljs$core$IFn$_invoke$arity$2(blocks__$1,(idx_145727 - (1))));
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__145195,G__145196) : datascript.core.entity.call(null,G__145195,G__145196));
})());
var block_145733__$1 = (function (){var G__145197 = cljs.core.deref(conn);
var G__145198 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block_145728);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__145197,G__145198) : datascript.core.entity.call(null,G__145197,G__145198));
})();
if(logseq.outliner.core.move_to_original_position_QMARK_(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [block_145733__$1], null),target_block_145731__$2,sibling_QMARK__145730__$1,false)){
} else {
var tx_data_145734 = logseq.outliner.core.move_block(cljs.core.deref(conn),block_145733__$1,target_block_145731__$2,sibling_QMARK__145730__$1);
logseq.db.transact_BANG_.cljs$core$IFn$_invoke$arity$3(conn,tx_data_145734,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"sibling?","sibling?",-1086129060),sibling_QMARK__145730__$1,new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),(function (){var or__5002__auto__ = outliner_op;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword(null,"move-blocks","move-blocks",-955702999);
}
})()], null));
}


var G__145735 = cljs.core.next(seq__145155_145720__$1);
var G__145736 = null;
var G__145737 = (0);
var G__145738 = (0);
seq__145155_145678 = G__145735;
chunk__145156_145679 = G__145736;
count__145157_145680 = G__145737;
i__145158_145681 = G__145738;
continue;
}
} else {
}
}
break;
}

if(cljs.core.seq(null)){
logseq.db.transact_BANG_.cljs$core$IFn$_invoke$arity$3(conn,null,cljs.core.PersistentArrayMap.EMPTY);
} else {
}

var G__145199_145739 = conn;
var G__145200_145740 = cljs.core.PersistentVector.EMPTY;
var G__145201_145741 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("batch-tx","exit?","batch-tx/exit?",-2021083148),true], null);
(datascript.core.transact_BANG_.cljs$core$IFn$_invoke$arity$3 ? datascript.core.transact_BANG_.cljs$core$IFn$_invoke$arity$3(G__145199_145739,G__145200_145740,G__145201_145741) : datascript.core.transact_BANG_.call(null,G__145199_145739,G__145200_145740,G__145201_145741));

logseq.outliner.batch_tx.exit_batch_txs_mode_BANG_();
}catch (e145153){var e__41781__auto___145742 = e145153;
logseq.outliner.batch_tx.exit_batch_txs_mode_BANG_();

throw e__41781__auto___145742;
}}

return null;
}
} else {
return null;
}
});
/**
 * Move blocks up/down.
 */
logseq.outliner.core.move_blocks_up_down = (function logseq$outliner$core$move_blocks_up_down(repo,conn,blocks,up_QMARK_){
if(cljs.core.seq(blocks)){
} else {
throw (new Error("Assert failed: (seq blocks)"));
}

if(cljs.core.boolean_QMARK_(up_QMARK_)){
} else {
throw (new Error("Assert failed: (boolean? up?)"));
}

var db = cljs.core.deref(conn);
var top_level_blocks = logseq.outliner.core.filter_top_level_blocks(db,blocks);
var opts = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"move-blocks-up-down","move-blocks-up-down",1370411060)], null);
if(cljs.core.truth_(up_QMARK_)){
var first_block = (function (){var G__145207 = db;
var G__145208 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(cljs.core.first(top_level_blocks));
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__145207,G__145208) : datascript.core.entity.call(null,G__145207,G__145208));
})();
var first_block_parent = new cljs.core.Keyword("block","parent","block/parent",-918309064).cljs$core$IFn$_invoke$arity$1(first_block);
var first_block_left_sibling = logseq.db.get_left_sibling(first_block);
var left_or_parent = (function (){var or__5002__auto__ = first_block_left_sibling;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return first_block_parent;
}
})();
var left_left = (function (){var or__5002__auto__ = logseq.db.get_left_sibling(left_or_parent);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return first_block_parent;
}
})();
var sibling_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","parent","block/parent",-918309064).cljs$core$IFn$_invoke$arity$1(left_left)),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(first_block_parent));
if(cljs.core.truth_((function (){var and__5000__auto__ = left_left;
if(cljs.core.truth_(and__5000__auto__)){
return ((cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","page","block/page",822314108).cljs$core$IFn$_invoke$arity$1(first_block_parent)),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(left_left))) && (cljs.core.not((function (){var and__5000__auto____$2 = new cljs.core.Keyword("logseq.property","created-from-property","logseq.property/created-from-property",-861892267).cljs$core$IFn$_invoke$arity$1(first_block);
if(cljs.core.truth_(and__5000__auto____$2)){
return (first_block_left_sibling == null);
} else {
return and__5000__auto____$2;
}
})())));
} else {
return and__5000__auto__;
}
})())){
return logseq.outliner.core.move_blocks(repo,conn,top_level_blocks,left_left,cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([opts,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"sibling?","sibling?",-1086129060),sibling_QMARK_,new cljs.core.Keyword(null,"up?","up?",77854972),up_QMARK_], null)], 0)));
} else {
return null;
}
} else {
var last_top_block = cljs.core.last(top_level_blocks);
var last_top_block_right = logseq.db.get_right_sibling(last_top_block);
var right = (function (){var or__5002__auto__ = last_top_block_right;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var parent = new cljs.core.Keyword("block","parent","block/parent",-918309064).cljs$core$IFn$_invoke$arity$1(last_top_block);
var parent__$1 = (cljs.core.truth_(new cljs.core.Keyword("block","page","block/page",822314108).cljs$core$IFn$_invoke$arity$1((function (){var G__145214 = db;
var G__145215 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(parent);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__145214,G__145215) : datascript.core.entity.call(null,G__145214,G__145215));
})()))?parent:null);
return logseq.db.get_right_sibling(parent__$1);
}
})();
var sibling_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","parent","block/parent",-918309064).cljs$core$IFn$_invoke$arity$1(last_top_block)),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","parent","block/parent",-918309064).cljs$core$IFn$_invoke$arity$1(right)));
if(cljs.core.truth_((function (){var and__5000__auto__ = right;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.not((function (){var and__5000__auto____$1 = new cljs.core.Keyword("logseq.property","created-from-property","logseq.property/created-from-property",-861892267).cljs$core$IFn$_invoke$arity$1(last_top_block);
if(cljs.core.truth_(and__5000__auto____$1)){
return (last_top_block_right == null);
} else {
return and__5000__auto____$1;
}
})());
} else {
return and__5000__auto__;
}
})())){
return logseq.outliner.core.move_blocks(repo,conn,blocks,right,cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([opts,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"sibling?","sibling?",-1086129060),sibling_QMARK_,new cljs.core.Keyword(null,"up?","up?",77854972),up_QMARK_], null)], 0)));
} else {
return null;
}
}
});
/**
 * Indent or outdent `blocks`.
 */
logseq.outliner.core.indent_outdent_blocks = (function logseq$outliner$core$indent_outdent_blocks(var_args){
var args__5732__auto__ = [];
var len__5726__auto___145751 = arguments.length;
var i__5727__auto___145752 = (0);
while(true){
if((i__5727__auto___145752 < len__5726__auto___145751)){
args__5732__auto__.push((arguments[i__5727__auto___145752]));

var G__145753 = (i__5727__auto___145752 + (1));
i__5727__auto___145752 = G__145753;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((4) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((4)),(0),null)):null);
return logseq.outliner.core.indent_outdent_blocks.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),(arguments[(1)]),(arguments[(2)]),(arguments[(3)]),argseq__5733__auto__);
});

(logseq.outliner.core.indent_outdent_blocks.cljs$core$IFn$_invoke$arity$variadic = (function (repo,conn,blocks,indent_QMARK_,p__145226){
var map__145227 = p__145226;
var map__145227__$1 = cljs.core.__destructure_map(map__145227);
var parent_original = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__145227__$1,new cljs.core.Keyword(null,"parent-original","parent-original",1770143972));
var logical_outdenting_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__145227__$1,new cljs.core.Keyword(null,"logical-outdenting?","logical-outdenting?",538240839));
if(cljs.core.seq(blocks)){
} else {
throw (new Error("Assert failed: (seq blocks)"));
}

if(cljs.core.boolean_QMARK_(indent_QMARK_)){
} else {
throw (new Error("Assert failed: (boolean? indent?)"));
}

var db = cljs.core.deref(conn);
var top_level_blocks = logseq.outliner.core.filter_top_level_blocks(db,blocks);
var non_consecutive_QMARK_ = (((cljs.core.count(top_level_blocks) > (1))) && (cljs.core.seq(logseq.db.get_non_consecutive_blocks(cljs.core.deref(conn),top_level_blocks))));
var top_level_blocks__$1 = logseq.outliner.core.get_top_level_blocks(top_level_blocks,non_consecutive_QMARK_);
if(cljs.core.truth_((function (){var or__5002__auto__ = non_consecutive_QMARK_;
if(or__5002__auto__){
return or__5002__auto__;
} else {
var and__5000__auto__ = cljs.core.not(indent_QMARK_);
if(and__5000__auto__){
return cljs.core.some(new cljs.core.Keyword("logseq.property","created-from-property","logseq.property/created-from-property",-861892267),top_level_blocks__$1);
} else {
return and__5000__auto__;
}
}
})())){
return null;
} else {
var first_block = (function (){var G__145235 = db;
var G__145236 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(cljs.core.first(top_level_blocks__$1));
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__145235,G__145236) : datascript.core.entity.call(null,G__145235,G__145236));
})();
var left = logseq.db.get_left_sibling(first_block);
var parent = new cljs.core.Keyword("block","parent","block/parent",-918309064).cljs$core$IFn$_invoke$arity$1(first_block);
var concat_tx_fn = (function() { 
var G__145764__delegate = function (results){
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"tx-data","tx-data",934159761),cljs.core.apply.cljs$core$IFn$_invoke$arity$2(logseq.common.util.concat_without_nil,cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"tx-data","tx-data",934159761),results)),new cljs.core.Keyword(null,"tx-meta","tx-meta",1159283194),new cljs.core.Keyword(null,"tx-meta","tx-meta",1159283194).cljs$core$IFn$_invoke$arity$1(cljs.core.first(results))], null);
};
var G__145764 = function (var_args){
var results = null;
if (arguments.length > 0) {
var G__145769__i = 0, G__145769__a = new Array(arguments.length -  0);
while (G__145769__i < G__145769__a.length) {G__145769__a[G__145769__i] = arguments[G__145769__i + 0]; ++G__145769__i;}
  results = new cljs.core.IndexedSeq(G__145769__a,0,null);
} 
return G__145764__delegate.call(this,results);};
G__145764.cljs$lang$maxFixedArity = 0;
G__145764.cljs$lang$applyTo = (function (arglist__145774){
var results = cljs.core.seq(arglist__145774);
return G__145764__delegate(results);
});
G__145764.cljs$core$IFn$_invoke$arity$variadic = G__145764__delegate;
return G__145764;
})()
;
var opts = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"indent-outdent-blocks","indent-outdent-blocks",-104352713)], null);
if(cljs.core.truth_(indent_QMARK_)){
if(cljs.core.truth_(left)){
var last_direct_child_id = logseq.db.get_block_last_direct_child_id.cljs$core$IFn$_invoke$arity$2(db,new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(left));
var blocks_SINGLEQUOTE_ = cljs.core.drop_while.cljs$core$IFn$_invoke$arity$2((function (b){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","parent","block/parent",-918309064).cljs$core$IFn$_invoke$arity$1(b)),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(left));
}),top_level_blocks__$1);
if(cljs.core.seq(blocks_SINGLEQUOTE_)){
if(cljs.core.truth_(last_direct_child_id)){
var last_direct_child = (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db,last_direct_child_id) : datascript.core.entity.call(null,db,last_direct_child_id));
var result = logseq.outliner.core.move_blocks(repo,conn,blocks_SINGLEQUOTE_,last_direct_child,cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([opts,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"sibling?","sibling?",-1086129060),true,new cljs.core.Keyword(null,"indent?","indent?",1381429379),true], null)], 0)));
var collapsed_tx = (cljs.core.truth_(new cljs.core.Keyword("block","collapsed?","block/collapsed?",2140210991).cljs$core$IFn$_invoke$arity$1(left))?new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tx-data","tx-data",934159761),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("db","id","db/id",-1388397098),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(left),new cljs.core.Keyword("block","collapsed?","block/collapsed?",2140210991),false], null)], null)], null):null);
return concat_tx_fn(result,collapsed_tx);
} else {
return logseq.outliner.core.move_blocks(repo,conn,blocks_SINGLEQUOTE_,left,cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([opts,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"sibling?","sibling?",-1086129060),false,new cljs.core.Keyword(null,"indent?","indent?",1381429379),true], null)], 0)));
}
} else {
return null;
}
} else {
return null;
}
} else {
if(cljs.core.truth_(parent_original)){
var blocks_SINGLEQUOTE_ = cljs.core.take_while.cljs$core$IFn$_invoke$arity$2((function (b){
return cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","parent","block/parent",-918309064).cljs$core$IFn$_invoke$arity$1(b)),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","parent","block/parent",-918309064).cljs$core$IFn$_invoke$arity$1(parent)));
}),top_level_blocks__$1);
return logseq.outliner.core.move_blocks(repo,conn,blocks_SINGLEQUOTE_,parent_original,cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([opts,new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"indent-outdent-blocks","indent-outdent-blocks",-104352713),new cljs.core.Keyword(null,"sibling?","sibling?",-1086129060),true,new cljs.core.Keyword(null,"indent?","indent?",1381429379),false], null)], 0)));
} else {
if(cljs.core.truth_((function (){var and__5000__auto__ = parent;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.not((function (){var G__145237 = (function (){var G__145238 = db;
var G__145239 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(parent);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__145238,G__145239) : datascript.core.entity.call(null,G__145238,G__145239));
})();
return (logseq.db.page_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.page_QMARK_.cljs$core$IFn$_invoke$arity$1(G__145237) : logseq.db.page_QMARK_.call(null,G__145237));
})());
} else {
return and__5000__auto__;
}
})())){
var blocks_SINGLEQUOTE_ = cljs.core.take_while.cljs$core$IFn$_invoke$arity$2((function (b){
return cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","parent","block/parent",-918309064).cljs$core$IFn$_invoke$arity$1(b)),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","parent","block/parent",-918309064).cljs$core$IFn$_invoke$arity$1(parent)));
}),top_level_blocks__$1);
var result = logseq.outliner.core.move_blocks(repo,conn,blocks_SINGLEQUOTE_,parent,cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([opts,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"sibling?","sibling?",-1086129060),true], null)], 0)));
if(cljs.core.truth_(logical_outdenting_QMARK_)){
return result;
} else {
var last_top_block = (function (){var G__145242 = db;
var G__145243 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(cljs.core.last(blocks_SINGLEQUOTE_));
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__145242,G__145243) : datascript.core.entity.call(null,G__145242,G__145243));
})();
var right_siblings = logseq.outliner.core.get_right_siblings(last_top_block);
if(cljs.core.seq(right_siblings)){
var temp__5802__auto__ = logseq.db.get_block_last_direct_child_id.cljs$core$IFn$_invoke$arity$2(db,new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(last_top_block));
if(cljs.core.truth_(temp__5802__auto__)){
var last_direct_child_id = temp__5802__auto__;
return logseq.outliner.core.move_blocks(repo,conn,right_siblings,(datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db,last_direct_child_id) : datascript.core.entity.call(null,db,last_direct_child_id)),cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([opts,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"sibling?","sibling?",-1086129060),true], null)], 0)));
} else {
return logseq.outliner.core.move_blocks(repo,conn,right_siblings,last_top_block,cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([opts,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"sibling?","sibling?",-1086129060),false], null)], 0)));
}
} else {
return result;
}
}
} else {
return null;
}
}
}
}
}));

(logseq.outliner.core.indent_outdent_blocks.cljs$lang$maxFixedArity = (4));

/** @this {Function} */
(logseq.outliner.core.indent_outdent_blocks.cljs$lang$applyTo = (function (seq145218){
var G__145219 = cljs.core.first(seq145218);
var seq145218__$1 = cljs.core.next(seq145218);
var G__145220 = cljs.core.first(seq145218__$1);
var seq145218__$2 = cljs.core.next(seq145218__$1);
var G__145221 = cljs.core.first(seq145218__$2);
var seq145218__$3 = cljs.core.next(seq145218__$2);
var G__145222 = cljs.core.first(seq145218__$3);
var seq145218__$4 = cljs.core.next(seq145218__$3);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__145219,G__145220,G__145221,G__145222,seq145218__$4);
}));

logseq.outliner.core.op_transact_BANG_ = (function logseq$outliner$core$op_transact_BANG_(var_args){
var args__5732__auto__ = [];
var len__5726__auto___145788 = arguments.length;
var i__5727__auto___145789 = (0);
while(true){
if((i__5727__auto___145789 < len__5726__auto___145788)){
args__5732__auto__.push((arguments[i__5727__auto___145789]));

var G__145790 = (i__5727__auto___145789 + (1));
i__5727__auto___145789 = G__145790;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return logseq.outliner.core.op_transact_BANG_.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(logseq.outliner.core.op_transact_BANG_.cljs$core$IFn$_invoke$arity$variadic = (function (f,args){
if(cljs.core.fn_QMARK_(f)){
} else {
throw (new Error("Assert failed: (fn? f)"));
}

var result = cljs.core.apply.cljs$core$IFn$_invoke$arity$2(f,args);
if(cljs.core.truth_(result)){
var tx_meta_145791 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(new cljs.core.Keyword(null,"tx-meta","tx-meta",1159283194).cljs$core$IFn$_invoke$arity$1(result),new cljs.core.Keyword(null,"skip-store?","skip-store?",-484019625),true);
logseq.db.transact_BANG_.cljs$core$IFn$_invoke$arity$3(cljs.core.second(args),new cljs.core.Keyword(null,"tx-data","tx-data",934159761).cljs$core$IFn$_invoke$arity$1(result),tx_meta_145791);
} else {
}

return result;
}));

(logseq.outliner.core.op_transact_BANG_.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(logseq.outliner.core.op_transact_BANG_.cljs$lang$applyTo = (function (seq145248){
var G__145249 = cljs.core.first(seq145248);
var seq145248__$1 = cljs.core.next(seq145248);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__145249,seq145248__$1);
}));

var f_145792 = (function (repo,conn,date_formatter,block,opts){
return logseq.outliner.core.save_block(repo,cljs.core.deref(conn),date_formatter,block,opts);
});
logseq.outliner.core.save_block_BANG_ = (function logseq$outliner$core$save_block_BANG_(var_args){
var args__5732__auto__ = [];
var len__5726__auto___145793 = arguments.length;
var i__5727__auto___145794 = (0);
while(true){
if((i__5727__auto___145794 < len__5726__auto___145793)){
args__5732__auto__.push((arguments[i__5727__auto___145794]));

var G__145795 = (i__5727__auto___145794 + (1));
i__5727__auto___145794 = G__145795;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((4) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((4)),(0),null)):null);
return logseq.outliner.core.save_block_BANG_.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),(arguments[(1)]),(arguments[(2)]),(arguments[(3)]),argseq__5733__auto__);
});

(logseq.outliner.core.save_block_BANG_.cljs$core$IFn$_invoke$arity$variadic = (function (repo,conn,date_formatter,block,p__145260){
var map__145261 = p__145260;
var map__145261__$1 = cljs.core.__destructure_map(map__145261);
var opts = map__145261__$1;
return logseq.outliner.core.op_transact_BANG_.cljs$core$IFn$_invoke$arity$variadic(f_145792,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([repo,conn,date_formatter,block,opts], 0));
}));

(logseq.outliner.core.save_block_BANG_.cljs$lang$maxFixedArity = (4));

/** @this {Function} */
(logseq.outliner.core.save_block_BANG_.cljs$lang$applyTo = (function (seq145252){
var G__145253 = cljs.core.first(seq145252);
var seq145252__$1 = cljs.core.next(seq145252);
var G__145254 = cljs.core.first(seq145252__$1);
var seq145252__$2 = cljs.core.next(seq145252__$1);
var G__145255 = cljs.core.first(seq145252__$2);
var seq145252__$3 = cljs.core.next(seq145252__$2);
var G__145256 = cljs.core.first(seq145252__$3);
var seq145252__$4 = cljs.core.next(seq145252__$3);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__145253,G__145254,G__145255,G__145256,seq145252__$4);
}));

var f_145798 = (function (repo,conn,blocks,target_block,opts){
return logseq.outliner.core.insert_blocks(repo,cljs.core.deref(conn),blocks,target_block,opts);
});
logseq.outliner.core.insert_blocks_BANG_ = (function logseq$outliner$core$insert_blocks_BANG_(repo,conn,blocks,target_block,opts){
return logseq.outliner.core.op_transact_BANG_.cljs$core$IFn$_invoke$arity$variadic(f_145798,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([repo,conn,blocks,target_block,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(opts,new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"insert-blocks","insert-blocks",-1269782013))], 0));
});
var f_145799 = (function (_repo,conn,blocks,opts){
var map__145265 = logseq.outliner.core.delete_blocks(cljs.core.deref(conn),blocks);
var map__145265__$1 = cljs.core.__destructure_map(map__145265);
var tx_data = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__145265__$1,new cljs.core.Keyword(null,"tx-data","tx-data",934159761));
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"tx-data","tx-data",934159761),tx_data,new cljs.core.Keyword(null,"tx-meta","tx-meta",1159283194),cljs.core.select_keys(opts,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450)], null))], null);
});
logseq.outliner.core.delete_blocks_BANG_ = (function logseq$outliner$core$delete_blocks_BANG_(repo,conn,_date_formatter,blocks,opts){
return logseq.outliner.core.op_transact_BANG_.cljs$core$IFn$_invoke$arity$variadic(f_145799,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([repo,conn,blocks,opts], 0));
});
logseq.outliner.core.move_blocks_BANG_ = (function logseq$outliner$core$move_blocks_BANG_(repo,conn,blocks,target_block,sibling_QMARK_){
return logseq.outliner.core.op_transact_BANG_.cljs$core$IFn$_invoke$arity$variadic(logseq.outliner.core.move_blocks,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([repo,conn,blocks,target_block,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"sibling?","sibling?",-1086129060),sibling_QMARK_,new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"move-blocks","move-blocks",-955702999)], null)], 0));
});
logseq.outliner.core.move_blocks_up_down_BANG_ = (function logseq$outliner$core$move_blocks_up_down_BANG_(repo,conn,blocks,up_QMARK_){
return logseq.outliner.core.op_transact_BANG_.cljs$core$IFn$_invoke$arity$variadic(logseq.outliner.core.move_blocks_up_down,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([repo,conn,blocks,up_QMARK_], 0));
});
logseq.outliner.core.indent_outdent_blocks_BANG_ = (function logseq$outliner$core$indent_outdent_blocks_BANG_(var_args){
var args__5732__auto__ = [];
var len__5726__auto___145802 = arguments.length;
var i__5727__auto___145803 = (0);
while(true){
if((i__5727__auto___145803 < len__5726__auto___145802)){
args__5732__auto__.push((arguments[i__5727__auto___145803]));

var G__145804 = (i__5727__auto___145803 + (1));
i__5727__auto___145803 = G__145804;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((4) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((4)),(0),null)):null);
return logseq.outliner.core.indent_outdent_blocks_BANG_.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),(arguments[(1)]),(arguments[(2)]),(arguments[(3)]),argseq__5733__auto__);
});

(logseq.outliner.core.indent_outdent_blocks_BANG_.cljs$core$IFn$_invoke$arity$variadic = (function (repo,conn,blocks,indent_QMARK_,p__145282){
var map__145283 = p__145282;
var map__145283__$1 = cljs.core.__destructure_map(map__145283);
var opts = map__145283__$1;
return logseq.outliner.core.op_transact_BANG_.cljs$core$IFn$_invoke$arity$variadic(logseq.outliner.core.indent_outdent_blocks,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([repo,conn,blocks,indent_QMARK_,opts], 0));
}));

(logseq.outliner.core.indent_outdent_blocks_BANG_.cljs$lang$maxFixedArity = (4));

/** @this {Function} */
(logseq.outliner.core.indent_outdent_blocks_BANG_.cljs$lang$applyTo = (function (seq145273){
var G__145274 = cljs.core.first(seq145273);
var seq145273__$1 = cljs.core.next(seq145273);
var G__145275 = cljs.core.first(seq145273__$1);
var seq145273__$2 = cljs.core.next(seq145273__$1);
var G__145276 = cljs.core.first(seq145273__$2);
var seq145273__$3 = cljs.core.next(seq145273__$2);
var G__145277 = cljs.core.first(seq145273__$3);
var seq145273__$4 = cljs.core.next(seq145273__$3);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__145274,G__145275,G__145276,G__145277,seq145273__$4);
}));


//# sourceMappingURL=logseq.outliner.core.js.map
