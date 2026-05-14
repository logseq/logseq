goog.provide('frontend.handler.whiteboard');
goog.scope(function(){
  frontend.handler.whiteboard.goog$module$goog$object = goog.module.get('goog.object');
});
frontend.handler.whiteboard.js__GT_clj_keywordize = (function frontend$handler$whiteboard$js__GT_clj_keywordize(obj){
return cljs.core.js__GT_clj.cljs$core$IFn$_invoke$arity$variadic(obj,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"keywordize-keys","keywordize-keys",1310784252),true], 0));
});
frontend.handler.whiteboard.shape__GT_block = (function frontend$handler$whiteboard$shape__GT_block(shape,page_id){
var repo = frontend.state.get_current_repo();
return logseq.graph_parser.whiteboard.shape__GT_block(repo,shape,page_id);
});
frontend.handler.whiteboard.build_shapes = (function frontend$handler$whiteboard$build_shapes(blocks){
var blocks__$1 = (frontend.db.sort_by_order.cljs$core$IFn$_invoke$arity$1 ? frontend.db.sort_by_order.cljs$core$IFn$_invoke$arity$1(blocks) : frontend.db.sort_by_order.call(null,blocks));
return cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (shape){
var temp__5802__auto__ = new cljs.core.Keyword(null,"pageId","pageId",276948616).cljs$core$IFn$_invoke$arity$1(shape);
if(cljs.core.truth_(temp__5802__auto__)){
var page_id = temp__5802__auto__;
var page = (frontend.db.get_page.cljs$core$IFn$_invoke$arity$1 ? frontend.db.get_page.cljs$core$IFn$_invoke$arity$1(page_id) : frontend.db.get_page.call(null,page_id));
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(shape,new cljs.core.Keyword(null,"pageName","pageName",1762981213),new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(page));
} else {
return shape;
}
}),cljs.core.map.cljs$core$IFn$_invoke$arity$2(frontend.handler.property.util.block__GT_shape,cljs.core.filter.cljs$core$IFn$_invoke$arity$2(frontend.handler.property.util.shape_block_QMARK_,(frontend.db.sort_by_order.cljs$core$IFn$_invoke$arity$2 ? frontend.db.sort_by_order.cljs$core$IFn$_invoke$arity$2(blocks__$1,blocks__$1) : frontend.db.sort_by_order.call(null,blocks__$1,blocks__$1)))));
});
frontend.handler.whiteboard.whiteboard_clj__GT_tldr = (function frontend$handler$whiteboard$whiteboard_clj__GT_tldr(page_block,blocks){
var id = cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(page_block));
var shapes = cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (p1__66615_SHARP_){
return (new cljs.core.Keyword(null,"type","type",1174270348).cljs$core$IFn$_invoke$arity$1(p1__66615_SHARP_) == null);
}),frontend.handler.whiteboard.build_shapes(blocks));
var tldr_page = frontend.handler.property.util.page_block__GT_tldr_page(page_block);
var assets = new cljs.core.Keyword(null,"assets","assets",210278279).cljs$core$IFn$_invoke$arity$1(tldr_page);
var tldr_page__$1 = cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(tldr_page,new cljs.core.Keyword(null,"assets","assets",210278279));
return cljs.core.clj__GT_js(new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"currentPageId","currentPageId",1489236563),id,new cljs.core.Keyword(null,"assets","assets",210278279),(function (){var or__5002__auto__ = assets;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return [];
}
})(),new cljs.core.Keyword(null,"selectedIds","selectedIds",1314450094),[],new cljs.core.Keyword(null,"pages","pages",-285406513),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([tldr_page__$1,new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"id","id",-1388402092),id,new cljs.core.Keyword(null,"name","name",1843675177),new cljs.core.Keyword("block","name","block/name",1619760316).cljs$core$IFn$_invoke$arity$1(page_block),new cljs.core.Keyword(null,"shapes","shapes",1897594879),shapes], null)], 0))], null)], null));
});
frontend.handler.whiteboard.db_build_page_block = (function frontend$handler$whiteboard$db_build_page_block(page_entity,page_name,tldraw_page,assets){
var get_k = (function (p1__66617_SHARP_){
return frontend.handler.whiteboard.goog$module$goog$object.get(tldraw_page,p1__66617_SHARP_);
});
var tldraw_page__$1 = new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"id","id",-1388402092),get_k("id"),new cljs.core.Keyword(null,"name","name",1843675177),get_k("name"),new cljs.core.Keyword(null,"bindings","bindings",1271397192),frontend.handler.whiteboard.js__GT_clj_keywordize(get_k("bindings")),new cljs.core.Keyword(null,"nonce","nonce",564330331),get_k("nonce"),new cljs.core.Keyword(null,"assets","assets",210278279),frontend.handler.whiteboard.js__GT_clj_keywordize(assets)], null);
return cljs.core.PersistentHashMap.fromArrays([new cljs.core.Keyword("block","updated-at","block/updated-at",-1516550551),new cljs.core.Keyword("block","created-at","block/created-at",1440015),new cljs.core.Keyword("logseq.property.tldraw","page","logseq.property.tldraw/page",-354621457),new cljs.core.Keyword("logseq.property","ls-type","logseq.property/ls-type",326979345),new cljs.core.Keyword("block","format","block/format",-1212045901),new cljs.core.Keyword("block","tags","block/tags",1814948340),new cljs.core.Keyword("block","title","block/title",710445684),new cljs.core.Keyword("db","id","db/id",-1388397098),new cljs.core.Keyword("block","name","block/name",1619760316)],[(frontend.util.time_ms.cljs$core$IFn$_invoke$arity$0 ? frontend.util.time_ms.cljs$core$IFn$_invoke$arity$0() : frontend.util.time_ms.call(null)),(function (){var or__5002__auto__ = new cljs.core.Keyword("block","created-at","block/created-at",1440015).cljs$core$IFn$_invoke$arity$1(page_entity);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return (frontend.util.time_ms.cljs$core$IFn$_invoke$arity$0 ? frontend.util.time_ms.cljs$core$IFn$_invoke$arity$0() : frontend.util.time_ms.call(null));
}
})(),tldraw_page__$1,new cljs.core.Keyword(null,"whiteboard-page","whiteboard-page",-432281646),new cljs.core.Keyword(null,"markdown","markdown",1227225089),new cljs.core.Keyword("logseq.class","Whiteboard","logseq.class/Whiteboard",1013698452),page_name,new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(page_entity),(frontend.util.page_name_sanity_lc.cljs$core$IFn$_invoke$arity$1 ? frontend.util.page_name_sanity_lc.cljs$core$IFn$_invoke$arity$1(page_name) : frontend.util.page_name_sanity_lc.call(null,page_name))]);
});
frontend.handler.whiteboard.file_build_page_block = (function frontend$handler$whiteboard$file_build_page_block(page_entity,page_name,tldraw_page,assets){
var get_k = (function (p1__66619_SHARP_){
return frontend.handler.whiteboard.goog$module$goog$object.get(tldraw_page,p1__66619_SHARP_);
});
return new cljs.core.PersistentArrayMap(null, 6, [new cljs.core.Keyword("block","title","block/title",710445684),page_name,new cljs.core.Keyword("block","name","block/name",1619760316),(frontend.util.page_name_sanity_lc.cljs$core$IFn$_invoke$arity$1 ? frontend.util.page_name_sanity_lc.cljs$core$IFn$_invoke$arity$1(page_name) : frontend.util.page_name_sanity_lc.call(null,page_name)),new cljs.core.Keyword("block","type","block/type",1537584409),"whiteboard",new cljs.core.Keyword("block","properties","block/properties",708347145),cljs.core.PersistentArrayMap.createAsIfByAssoc([frontend.handler.property.util.get_pid(new cljs.core.Keyword("logseq.property","ls-type","logseq.property/ls-type",326979345)),new cljs.core.Keyword(null,"whiteboard-page","whiteboard-page",-432281646),frontend.handler.property.util.get_pid(new cljs.core.Keyword("logseq.property.tldraw","page","logseq.property.tldraw/page",-354621457)),new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"id","id",-1388402092),get_k("id"),new cljs.core.Keyword(null,"name","name",1843675177),get_k("name"),new cljs.core.Keyword(null,"bindings","bindings",1271397192),frontend.handler.whiteboard.js__GT_clj_keywordize(get_k("bindings")),new cljs.core.Keyword(null,"nonce","nonce",564330331),get_k("nonce"),new cljs.core.Keyword(null,"assets","assets",210278279),frontend.handler.whiteboard.js__GT_clj_keywordize(assets)], null)]),new cljs.core.Keyword("block","updated-at","block/updated-at",-1516550551),(frontend.util.time_ms.cljs$core$IFn$_invoke$arity$0 ? frontend.util.time_ms.cljs$core$IFn$_invoke$arity$0() : frontend.util.time_ms.call(null)),new cljs.core.Keyword("block","created-at","block/created-at",1440015),(function (){var or__5002__auto__ = new cljs.core.Keyword("block","created-at","block/created-at",1440015).cljs$core$IFn$_invoke$arity$1(page_entity);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return (frontend.util.time_ms.cljs$core$IFn$_invoke$arity$0 ? frontend.util.time_ms.cljs$core$IFn$_invoke$arity$0() : frontend.util.time_ms.call(null));
}
})()], null);
});
frontend.handler.whiteboard.build_page_block = (function frontend$handler$whiteboard$build_page_block(page_entity,page_name,tldraw_page,assets){
var f = ((frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(frontend.state.get_current_repo()))?frontend.handler.whiteboard.db_build_page_block:frontend.handler.whiteboard.file_build_page_block);
return (f.cljs$core$IFn$_invoke$arity$4 ? f.cljs$core$IFn$_invoke$arity$4(page_entity,page_name,tldraw_page,assets) : f.call(null,page_entity,page_name,tldraw_page,assets));
});
frontend.handler.whiteboard.compute_tx = (function frontend$handler$whiteboard$compute_tx(app,tl_page,new_id_nonces,db_id_nonces,page_uuid,replace_QMARK_){
var page_entity = (frontend.db.get_page.cljs$core$IFn$_invoke$arity$1 ? frontend.db.get_page.cljs$core$IFn$_invoke$arity$1(page_uuid) : frontend.db.get_page.call(null,page_uuid));
var assets = frontend.handler.whiteboard.js__GT_clj_keywordize(app.getCleanUpAssets());
var upsert_shapes = cljs.core.set(cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p__66624){
var map__66625 = p__66624;
var map__66625__$1 = cljs.core.__destructure_map(map__66625);
var id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__66625__$1,new cljs.core.Keyword(null,"id","id",-1388402092));
return frontend.handler.whiteboard.js__GT_clj_keywordize(tl_page.getShapeById(id).serialized);
}),clojure.set.difference.cljs$core$IFn$_invoke$arity$2(new_id_nonces,db_id_nonces)));
var old_ids = cljs.core.set(cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"id","id",-1388402092),db_id_nonces));
var new_ids = cljs.core.set(cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"id","id",-1388402092),new_id_nonces));
var created_ids = cljs.core.set(cljs.core.remove.cljs$core$IFn$_invoke$arity$2(clojure.string.blank_QMARK_,clojure.set.difference.cljs$core$IFn$_invoke$arity$2(new_ids,old_ids)));
var new_orders = ((cljs.core.seq(created_ids))?(function (){var max_key_SINGLEQUOTE_ = cljs.core.last(cljs.core.sort.cljs$core$IFn$_invoke$arity$1(cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","order","block/order",-1429282437),new cljs.core.Keyword("block","_page","block/_page",1150043350).cljs$core$IFn$_invoke$arity$1(page_entity))));
return logseq.db.common.order.gen_n_keys(cljs.core.count(created_ids),max_key_SINGLEQUOTE_,null);
})():null);
var new_id__GT_order = ((cljs.core.seq(created_ids))?cljs.core.zipmap(created_ids,new_orders):null);
var created_shapes = cljs.core.set(cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (p1__66622_SHARP_){
var G__66629 = new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(p1__66622_SHARP_);
return (created_ids.cljs$core$IFn$_invoke$arity$1 ? created_ids.cljs$core$IFn$_invoke$arity$1(G__66629) : created_ids.call(null,G__66629));
}),upsert_shapes));
var deleted_ids = cljs.core.remove.cljs$core$IFn$_invoke$arity$2(clojure.string.blank_QMARK_,clojure.set.difference.cljs$core$IFn$_invoke$arity$2(old_ids,new_ids));
var repo = frontend.state.get_current_repo();
var deleted_shapes = ((cljs.core.seq(deleted_ids))?cljs.core.remove.cljs$core$IFn$_invoke$arity$2(cljs.core.nil_QMARK_,cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (b){
return frontend.handler.property.util.get_block_property_value(b,new cljs.core.Keyword("logseq.property.tldraw","shape","logseq.property.tldraw/shape",-1313245420));
}),(function (){var G__66632 = repo;
var G__66633 = new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"*","*",345799209,null)], null);
var G__66634 = cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (id){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),cljs.core.uuid(id)], null);
}),deleted_ids);
return (frontend.db.pull_many.cljs$core$IFn$_invoke$arity$3 ? frontend.db.pull_many.cljs$core$IFn$_invoke$arity$3(G__66632,G__66633,G__66634) : frontend.db.pull_many.call(null,G__66632,G__66633,G__66634));
})())):null);
var deleted_shapes_tx = cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (id){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","retractEntity","db/retractEntity",-1452737935),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),cljs.core.uuid(id)], null)], null);
}),deleted_ids);
var upserted_blocks = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (block){
var temp__5802__auto__ = (cljs.core.truth_(new_id__GT_order)?cljs.core.get.cljs$core$IFn$_invoke$arity$2(new_id__GT_order,cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block))):null);
if(cljs.core.truth_(temp__5802__auto__)){
var new_order = temp__5802__auto__;
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(block,new cljs.core.Keyword("block","order","block/order",-1429282437),new_order);
} else {
return block;
}
}),cljs.core.map.cljs$core$IFn$_invoke$arity$2(logseq.db.sqlite.util.block_with_timestamps,cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__66623_SHARP_){
return frontend.handler.whiteboard.shape__GT_block(p1__66623_SHARP_,new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(page_entity));
}),upsert_shapes)));
var page_name = (function (){var or__5002__auto__ = new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(page_entity);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.str.cljs$core$IFn$_invoke$arity$1(page_uuid);
}
})();
var page_block = frontend.handler.whiteboard.build_page_block(page_entity,page_name,tl_page,assets);
if(((cljs.core.seq(upserted_blocks)) || (((cljs.core.seq(deleted_shapes_tx)) || (cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","properties","block/properties",708347145).cljs$core$IFn$_invoke$arity$1(page_block),new cljs.core.Keyword("block","properties","block/properties",708347145).cljs$core$IFn$_invoke$arity$1(page_entity))))))){
return new cljs.core.PersistentArrayMap(null, 6, [new cljs.core.Keyword(null,"page-block","page-block",504302814),page_block,new cljs.core.Keyword(null,"upserted-blocks","upserted-blocks",-1257152432),upserted_blocks,new cljs.core.Keyword(null,"delete-blocks","delete-blocks",-1868631596),deleted_shapes_tx,new cljs.core.Keyword(null,"deleted-shapes","deleted-shapes",-866326203),deleted_shapes,new cljs.core.Keyword(null,"new-shapes","new-shapes",1387380119),created_shapes,new cljs.core.Keyword(null,"metadata","metadata",1799301597),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("whiteboard","transact?","whiteboard/transact?",-1793205629),true,new cljs.core.Keyword(null,"pipeline-replace?","pipeline-replace?",-758892518),replace_QMARK_], null)], null);
} else {
return null;
}
});
if((typeof frontend !== 'undefined') && (typeof frontend.handler !== 'undefined') && (typeof frontend.handler.whiteboard !== 'undefined') && (typeof frontend.handler.whiteboard._STAR_last_shapes_nonce !== 'undefined')){
} else {
frontend.handler.whiteboard._STAR_last_shapes_nonce = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
}
frontend.handler.whiteboard.get_shape_block_id = (function frontend$handler$whiteboard$get_shape_block_id(shape){
return cljs.core.uuid(shape.id);
});
frontend.handler.whiteboard.handle_order_update_BANG_ = (function frontend$handler$whiteboard$handle_order_update_BANG_(page,info){
var op = new cljs.core.Keyword(null,"op","op",-1882987955).cljs$core$IFn$_invoke$arity$1(info);
var moved_shapes = new cljs.core.Keyword(null,"shapes","shapes",1897594879).cljs$core$IFn$_invoke$arity$1(info);
var shape_ids = cljs.core.mapv.cljs$core$IFn$_invoke$arity$2(frontend.handler.whiteboard.get_shape_block_id,moved_shapes);
var G__66652 = op;
switch (G__66652) {
case "sendToBack":
var next_order = (function (){var temp__5804__auto__ = frontend.handler.whiteboard.get_shape_block_id(new cljs.core.Keyword(null,"next","next",-117701485).cljs$core$IFn$_invoke$arity$1(info));
if(cljs.core.truth_(temp__5804__auto__)){
var id = temp__5804__auto__;
return new cljs.core.Keyword("block","order","block/order",-1429282437).cljs$core$IFn$_invoke$arity$1((function (){var G__66654 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),id], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__66654) : frontend.db.entity.call(null,G__66654));
})());
} else {
return null;
}
})();
var new_orders = logseq.db.common.order.gen_n_keys(cljs.core.count(shape_ids),null,next_order);
var tx_data = cljs.core.conj.cljs$core$IFn$_invoke$arity$2(cljs.core.map_indexed.cljs$core$IFn$_invoke$arity$2((function (idx,id){
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),id,new cljs.core.Keyword("block","order","block/order",-1429282437),cljs.core.nth.cljs$core$IFn$_invoke$arity$2(new_orders,idx)], null);
}),shape_ids),logseq.outliner.core.block_with_updated_at(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("db","id","db/id",-1388397098),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(page)], null)));
return tx_data;

break;
case "bringToFront":
var before_order = (function (){var temp__5804__auto__ = frontend.handler.whiteboard.get_shape_block_id(new cljs.core.Keyword(null,"before","before",-1633692388).cljs$core$IFn$_invoke$arity$1(info));
if(cljs.core.truth_(temp__5804__auto__)){
var id = temp__5804__auto__;
return new cljs.core.Keyword("block","order","block/order",-1429282437).cljs$core$IFn$_invoke$arity$1((function (){var G__66655 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),id], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__66655) : frontend.db.entity.call(null,G__66655));
})());
} else {
return null;
}
})();
var new_orders = logseq.db.common.order.gen_n_keys(cljs.core.count(shape_ids),before_order,null);
var tx_data = cljs.core.conj.cljs$core$IFn$_invoke$arity$2(cljs.core.remove.cljs$core$IFn$_invoke$arity$2(cljs.core.nil_QMARK_,cljs.core.map_indexed.cljs$core$IFn$_invoke$arity$2((function (idx,id){
if(cljs.core.truth_((function (){var G__66656 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),id], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__66656) : frontend.db.entity.call(null,G__66656));
})())){
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),id,new cljs.core.Keyword("block","order","block/order",-1429282437),cljs.core.nth.cljs$core$IFn$_invoke$arity$2(new_orders,idx)], null);
} else {
return null;
}
}),shape_ids)),logseq.outliner.core.block_with_updated_at(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("db","id","db/id",-1388397098),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(page)], null)));
return tx_data;

break;
default:
throw (new Error(["No matching clause: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(G__66652)].join('')));

}
});
frontend.handler.whiteboard._LT_transact_tldr_delta_BANG_ = (function frontend$handler$whiteboard$_LT_transact_tldr_delta_BANG_(page_uuid,app,info_STAR_){
var info = cljs_bean.core.__GT_clj(info_STAR_);
var replace_QMARK_ = new cljs.core.Keyword(null,"replace","replace",-786587770).cljs$core$IFn$_invoke$arity$1(info);
var tl_page = cljs.core.second(cljs.core.first(app.pages));
var page_block = frontend.db.model.get_page(page_uuid);
var order_tx_data = ((cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, ["sendToBack",null,"bringToFront",null], null), null),new cljs.core.Keyword(null,"op","op",-1882987955).cljs$core$IFn$_invoke$arity$1(info)))?frontend.handler.whiteboard.handle_order_update_BANG_(page_block,info):null);
var shapes = tl_page.shapes;
var new_id_nonces = cljs.core.set(cljs.core.map_indexed.cljs$core$IFn$_invoke$arity$2((function (_idx,shape){
var id = shape.id;
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"id","id",-1388402092),id,new cljs.core.Keyword(null,"nonce","nonce",564330331),(function (){var or__5002__auto__ = shape.nonce;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return Date.now();
}
})()], null);
}),shapes));
var repo = frontend.state.get_current_repo();
var db_id_nonces = (function (){var or__5002__auto__ = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(frontend.handler.whiteboard._STAR_last_shapes_nonce),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [repo,page_uuid], null));
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.set(cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__66657_SHARP_){
return cljs.core.update.cljs$core$IFn$_invoke$arity$3(p1__66657_SHARP_,new cljs.core.Keyword(null,"id","id",-1388402092),cljs.core.str);
}),frontend.db.model.get_whiteboard_id_nonces(repo,new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(page_block))));
}
})();
var map__66661 = frontend.handler.whiteboard.compute_tx(app,tl_page,new_id_nonces,db_id_nonces,page_uuid,replace_QMARK_);
var map__66661__$1 = cljs.core.__destructure_map(map__66661);
var result = map__66661__$1;
var page_block__$1 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__66661__$1,new cljs.core.Keyword(null,"page-block","page-block",504302814));
var new_shapes = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__66661__$1,new cljs.core.Keyword(null,"new-shapes","new-shapes",1387380119));
var deleted_shapes = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__66661__$1,new cljs.core.Keyword(null,"deleted-shapes","deleted-shapes",-866326203));
var upserted_blocks = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__66661__$1,new cljs.core.Keyword(null,"upserted-blocks","upserted-blocks",-1257152432));
var delete_blocks = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__66661__$1,new cljs.core.Keyword(null,"delete-blocks","delete-blocks",-1868631596));
var metadata = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__66661__$1,new cljs.core.Keyword(null,"metadata","metadata",1799301597));
if(((cljs.core.seq(result)) || (cljs.core.seq(order_tx_data)))){
var tx_data = cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic(delete_blocks,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [page_block__$1], null),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([upserted_blocks,order_tx_data], 0));
var metadata_SINGLEQUOTE_ = (cljs.core.truth_(cljs.core.some((function (p1__66658_SHARP_){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("group",new cljs.core.Keyword(null,"type","type",1174270348).cljs$core$IFn$_invoke$arity$1(p1__66658_SHARP_));
}),new_shapes))?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(metadata,new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"group","group",582596132)):(cljs.core.truth_((function (){var and__5000__auto__ = cljs.core.not_empty(deleted_shapes);
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.every_QMARK_((function (p1__66659_SHARP_){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("group",new cljs.core.Keyword(null,"type","type",1174270348).cljs$core$IFn$_invoke$arity$1(p1__66659_SHARP_));
}),deleted_shapes);
} else {
return and__5000__auto__;
}
})())?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(metadata,new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"un-group","un-group",1594045164)):(cljs.core.truth_(cljs.core.some((function (p1__66660_SHARP_){
return ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("line",new cljs.core.Keyword(null,"type","type",1174270348).cljs$core$IFn$_invoke$arity$1(p1__66660_SHARP_))) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("arrow ",new cljs.core.Keyword(null,"end","end",-268185958).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"decorations","decorations",-1882398759).cljs$core$IFn$_invoke$arity$1(p1__66660_SHARP_)))));
}),new_shapes))?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(metadata,new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"new-arrow","new-arrow",2027535819)):cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(metadata,new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"save-whiteboard","save-whiteboard",-1902656569))
)));
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(frontend.handler.whiteboard._STAR_last_shapes_nonce,cljs.core.assoc_in,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [repo,page_uuid], null),new_id_nonces);

if(cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"new-arrow","new-arrow",2027535819),null], null), null),new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450).cljs$core$IFn$_invoke$arity$1(metadata_SINGLEQUOTE_))){
return frontend.state.set_state_BANG_(new cljs.core.Keyword("whiteboard","pending-tx-data","whiteboard/pending-tx-data",66525729),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"tx-data","tx-data",934159761),tx_data,new cljs.core.Keyword(null,"metadata","metadata",1799301597),metadata_SINGLEQUOTE_], null));
} else {
var pending_tx_data = new cljs.core.Keyword("whiteboard","pending-tx-data","whiteboard/pending-tx-data",66525729).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state));
var tx_data_SINGLEQUOTE_ = cljs.core.concat.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"tx-data","tx-data",934159761).cljs$core$IFn$_invoke$arity$1(pending_tx_data),tx_data);
var metadata_SINGLEQUOTE__SINGLEQUOTE_ = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([metadata_SINGLEQUOTE_,new cljs.core.Keyword(null,"metadata","metadata",1799301597).cljs$core$IFn$_invoke$arity$1(pending_tx_data)], 0));
frontend.state.set_state_BANG_(new cljs.core.Keyword("whiteboard","pending-tx-data","whiteboard/pending-tx-data",66525729),cljs.core.PersistentArrayMap.EMPTY);

return frontend.db.transact_BANG_.cljs$core$IFn$_invoke$arity$3(repo,tx_data_SINGLEQUOTE_,metadata_SINGLEQUOTE__SINGLEQUOTE_);
}
} else {
return null;
}
});
frontend.handler.whiteboard.get_default_new_whiteboard_tx = (function frontend$handler$whiteboard$get_default_new_whiteboard_tx(page_name,id){
var db_based_QMARK_ = frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(frontend.state.get_current_repo());
var tldraw_page = new cljs.core.PersistentArrayMap(null, 6, [new cljs.core.Keyword(null,"id","id",-1388402092),cljs.core.str.cljs$core$IFn$_invoke$arity$1(id),new cljs.core.Keyword(null,"name","name",1843675177),page_name,new cljs.core.Keyword(null,"ls-type","ls-type",1383834313),new cljs.core.Keyword(null,"whiteboard-page","whiteboard-page",-432281646),new cljs.core.Keyword(null,"bindings","bindings",1271397192),cljs.core.PersistentArrayMap.EMPTY,new cljs.core.Keyword(null,"nonce","nonce",564330331),(1),new cljs.core.Keyword(null,"assets","assets",210278279),cljs.core.PersistentVector.EMPTY], null);
var properties = cljs.core.PersistentArrayMap.createAsIfByAssoc([frontend.handler.property.util.get_pid(new cljs.core.Keyword("logseq.property","ls-type","logseq.property/ls-type",326979345)),new cljs.core.Keyword(null,"whiteboard-page","whiteboard-page",-432281646),frontend.handler.property.util.get_pid(new cljs.core.Keyword("logseq.property.tldraw","page","logseq.property.tldraw/page",-354621457)),tldraw_page]);
var m = new cljs.core.PersistentArrayMap(null, 7, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),id,new cljs.core.Keyword("block","name","block/name",1619760316),(frontend.util.page_name_sanity_lc.cljs$core$IFn$_invoke$arity$1 ? frontend.util.page_name_sanity_lc.cljs$core$IFn$_invoke$arity$1(page_name) : frontend.util.page_name_sanity_lc.call(null,page_name)),new cljs.core.Keyword("block","title","block/title",710445684),page_name,new cljs.core.Keyword("block","type","block/type",1537584409),"whiteboard",new cljs.core.Keyword("block","format","block/format",-1212045901),new cljs.core.Keyword(null,"markdown","markdown",1227225089),new cljs.core.Keyword("block","updated-at","block/updated-at",-1516550551),(frontend.util.time_ms.cljs$core$IFn$_invoke$arity$0 ? frontend.util.time_ms.cljs$core$IFn$_invoke$arity$0() : frontend.util.time_ms.call(null)),new cljs.core.Keyword("block","created-at","block/created-at",1440015),(frontend.util.time_ms.cljs$core$IFn$_invoke$arity$0 ? frontend.util.time_ms.cljs$core$IFn$_invoke$arity$0() : frontend.util.time_ms.call(null))], null);
var m_SINGLEQUOTE_ = ((db_based_QMARK_)?cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([m,properties], 0)):cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(m,new cljs.core.Keyword("block","properties","block/properties",708347145),properties));
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [m_SINGLEQUOTE_], null);
});
frontend.handler.whiteboard._LT_create_new_whiteboard_page_BANG_ = (function frontend$handler$whiteboard$_LT_create_new_whiteboard_page_BANG_(var_args){
var G__66663 = arguments.length;
switch (G__66663) {
case 0:
return frontend.handler.whiteboard._LT_create_new_whiteboard_page_BANG_.cljs$core$IFn$_invoke$arity$0();

break;
case 1:
return frontend.handler.whiteboard._LT_create_new_whiteboard_page_BANG_.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.handler.whiteboard._LT_create_new_whiteboard_page_BANG_.cljs$core$IFn$_invoke$arity$0 = (function (){
return frontend.handler.whiteboard._LT_create_new_whiteboard_page_BANG_.cljs$core$IFn$_invoke$arity$1(null);
}));

(frontend.handler.whiteboard._LT_create_new_whiteboard_page_BANG_.cljs$core$IFn$_invoke$arity$1 = (function (name){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((function (){var or__5002__auto__ = (function (){var and__5000__auto__ = name;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.parse_uuid(name);
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return (datascript.core.squuid.cljs$core$IFn$_invoke$arity$0 ? datascript.core.squuid.cljs$core$IFn$_invoke$arity$0() : datascript.core.squuid.call(null));
}
})()),(function (uuid){
return promesa.protocols._mcat(promesa.protocols._promise((function (){var or__5002__auto__ = name;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.str.cljs$core$IFn$_invoke$arity$1(uuid);
}
})()),(function (name__$1){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.db.transact_BANG_.cljs$core$IFn$_invoke$arity$3(frontend.state.get_current_repo(),frontend.handler.whiteboard.get_default_new_whiteboard_tx(name__$1,uuid),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"create-page","create-page",-1352656443)], null))),(function (_){
return promesa.protocols._promise(uuid);
}));
}));
}));
}));
}));

(frontend.handler.whiteboard._LT_create_new_whiteboard_page_BANG_.cljs$lang$maxFixedArity = 1);

frontend.handler.whiteboard._LT_create_new_whiteboard_and_redirect_BANG_ = (function frontend$handler$whiteboard$_LT_create_new_whiteboard_and_redirect_BANG_(var_args){
var G__66672 = arguments.length;
switch (G__66672) {
case 0:
return frontend.handler.whiteboard._LT_create_new_whiteboard_and_redirect_BANG_.cljs$core$IFn$_invoke$arity$0();

break;
case 1:
return frontend.handler.whiteboard._LT_create_new_whiteboard_and_redirect_BANG_.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.handler.whiteboard._LT_create_new_whiteboard_and_redirect_BANG_.cljs$core$IFn$_invoke$arity$0 = (function (){
return frontend.handler.whiteboard._LT_create_new_whiteboard_and_redirect_BANG_.cljs$core$IFn$_invoke$arity$1(cljs.core.str.cljs$core$IFn$_invoke$arity$1((datascript.core.squuid.cljs$core$IFn$_invoke$arity$0 ? datascript.core.squuid.cljs$core$IFn$_invoke$arity$0() : datascript.core.squuid.call(null))));
}));

(frontend.handler.whiteboard._LT_create_new_whiteboard_and_redirect_BANG_.cljs$core$IFn$_invoke$arity$1 = (function (name){
if(((frontend.config.publishing_QMARK_) || (frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(frontend.state.get_current_repo())))){
return null;
} else {
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.whiteboard._LT_create_new_whiteboard_page_BANG_.cljs$core$IFn$_invoke$arity$1(name)),(function (id){
return promesa.protocols._promise(frontend.handler.route.redirect_to_page_BANG_.cljs$core$IFn$_invoke$arity$2(id,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"new-whiteboard?","new-whiteboard?",-360865129),true], null)));
}));
}));
}
}));

(frontend.handler.whiteboard._LT_create_new_whiteboard_and_redirect_BANG_.cljs$lang$maxFixedArity = 1);

frontend.handler.whiteboard.__GT_logseq_portal_shape = (function frontend$handler$whiteboard$__GT_logseq_portal_shape(block_id,point){
return new cljs.core.PersistentArrayMap(null, 7, [new cljs.core.Keyword(null,"blockType","blockType",85218785),(cljs.core.truth_(cljs.core.parse_uuid(cljs.core.str.cljs$core$IFn$_invoke$arity$1(block_id)))?"B":"P"),new cljs.core.Keyword(null,"id","id",-1388402092),cljs.core.str.cljs$core$IFn$_invoke$arity$1((datascript.core.squuid.cljs$core$IFn$_invoke$arity$0 ? datascript.core.squuid.cljs$core$IFn$_invoke$arity$0() : datascript.core.squuid.call(null))),new cljs.core.Keyword(null,"compact","compact",-348732150),false,new cljs.core.Keyword(null,"pageId","pageId",276948616),cljs.core.str.cljs$core$IFn$_invoke$arity$1(block_id),new cljs.core.Keyword(null,"point","point",1813198264),point,new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [(400),(0)], null),new cljs.core.Keyword(null,"type","type",1174270348),"logseq-portal"], null);
});
/**
 * Given the block uuid, add a new shape to the referenced block.
 * By default it will be placed next to the given shape id
 */
frontend.handler.whiteboard.add_new_block_portal_shape_BANG_ = (function frontend$handler$whiteboard$add_new_block_portal_shape_BANG_(var_args){
var args__5732__auto__ = [];
var len__5726__auto___66726 = arguments.length;
var i__5727__auto___66727 = (0);
while(true){
if((i__5727__auto___66727 < len__5726__auto___66726)){
args__5732__auto__.push((arguments[i__5727__auto___66727]));

var G__66728 = (i__5727__auto___66727 + (1));
i__5727__auto___66727 = G__66728;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((2) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((2)),(0),null)):null);
return frontend.handler.whiteboard.add_new_block_portal_shape_BANG_.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),(arguments[(1)]),argseq__5733__auto__);
});

(frontend.handler.whiteboard.add_new_block_portal_shape_BANG_.cljs$core$IFn$_invoke$arity$variadic = (function (block_uuid,source_shape,p__66691){
var map__66692 = p__66691;
var map__66692__$1 = cljs.core.__destructure_map(map__66692);
var link_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__66692__$1,new cljs.core.Keyword(null,"link?","link?",-1241171248));
var bottom_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__66692__$1,new cljs.core.Keyword(null,"bottom?","bottom?",-1926481628));
var temp__5804__auto__ = frontend.state.active_tldraw_app();
if(cljs.core.truth_(temp__5804__auto__)){
var app = temp__5804__auto__;
var api = app.api;
var point = (function (bounds){
if(cljs.core.truth_(bottom_QMARK_)){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [bounds.minX,((64) + bounds.maxY)], null);
} else {
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [((64) + bounds.maxX),bounds.minY], null);
}
})(app.getShapeById(source_shape).bounds);
var shape = frontend.handler.whiteboard.__GT_logseq_portal_shape(block_uuid,point);
if(cljs.core.uuid_QMARK_(block_uuid)){
frontend.handler.editor.set_blocks_id_BANG_(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [block_uuid], null));
} else {
}

api.createShapes(cljs.core.clj__GT_js(shape));

if(cljs.core.truth_(link_QMARK_)){
return api.createNewLineBinding(source_shape,new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(shape));
} else {
return null;
}
} else {
return null;
}
}));

(frontend.handler.whiteboard.add_new_block_portal_shape_BANG_.cljs$lang$maxFixedArity = (2));

/** @this {Function} */
(frontend.handler.whiteboard.add_new_block_portal_shape_BANG_.cljs$lang$applyTo = (function (seq66688){
var G__66689 = cljs.core.first(seq66688);
var seq66688__$1 = cljs.core.next(seq66688);
var G__66690 = cljs.core.first(seq66688__$1);
var seq66688__$2 = cljs.core.next(seq66688__$1);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__66689,G__66690,seq66688__$2);
}));

frontend.handler.whiteboard.get_page_tldr = (function frontend$handler$whiteboard$get_page_tldr(page_uuid){
var page = frontend.db.model.get_page(page_uuid);
var react_page = (function (){var G__66693 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(page);
return (frontend.db.sub_block.cljs$core$IFn$_invoke$arity$1 ? frontend.db.sub_block.cljs$core$IFn$_invoke$arity$1(G__66693) : frontend.db.sub_block.call(null,G__66693));
})();
var blocks = new cljs.core.Keyword("block","_page","block/_page",1150043350).cljs$core$IFn$_invoke$arity$1(react_page);
return frontend.handler.whiteboard.whiteboard_clj__GT_tldr(react_page,blocks);
});
frontend.handler.whiteboard._LT_add_new_block_BANG_ = (function frontend$handler$whiteboard$_LT_add_new_block_BANG_(page_uuid,content){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.state.get_current_repo()),(function (repo){
return promesa.protocols._mcat(promesa.protocols._promise((frontend.db.new_block_id.cljs$core$IFn$_invoke$arity$0 ? frontend.db.new_block_id.cljs$core$IFn$_invoke$arity$0() : frontend.db.new_block_id.call(null))),(function (new_block_id){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.db.model.get_page(page_uuid)),(function (page_entity){
return promesa.protocols._mcat(promesa.protocols._promise((function (){var G__66694 = new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new_block_id,new cljs.core.Keyword("block","title","block/title",710445684),(function (){var or__5002__auto__ = content;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return "";
}
})(),new cljs.core.Keyword("block","format","block/format",-1212045901),new cljs.core.Keyword(null,"markdown","markdown",1227225089),new cljs.core.Keyword("block","page","block/page",822314108),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(page_entity),new cljs.core.Keyword("block","parent","block/parent",-918309064),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(page_entity)], null);
return (logseq.db.sqlite.util.block_with_timestamps.cljs$core$IFn$_invoke$arity$1 ? logseq.db.sqlite.util.block_with_timestamps.cljs$core$IFn$_invoke$arity$1(G__66694) : logseq.db.sqlite.util.block_with_timestamps.call(null,G__66694));
})()),(function (tx){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.db.transact_BANG_.cljs$core$IFn$_invoke$arity$3(repo,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [tx], null),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"insert-blocks","insert-blocks",-1269782013),new cljs.core.Keyword("whiteboard","transact?","whiteboard/transact?",-1793205629),true], null))),(function (_){
return promesa.protocols._promise(new_block_id);
}));
}));
}));
}));
}));
}));
});
frontend.handler.whiteboard.inside_portal_QMARK_ = (function frontend$handler$whiteboard$inside_portal_QMARK_(target){
return (!((dommy.core.closest.cljs$core$IFn$_invoke$arity$2(target,".tl-logseq-cp-container") == null)));
});
frontend.handler.whiteboard.closest_shape = (function frontend$handler$whiteboard$closest_shape(target){
var temp__5804__auto__ = dommy.core.closest.cljs$core$IFn$_invoke$arity$2(target,"[data-shape-id]");
if(cljs.core.truth_(temp__5804__auto__)){
var shape_el = temp__5804__auto__;
return shape_el.getAttribute("data-shape-id");
} else {
return null;
}
});
frontend.handler.whiteboard.get_onboard_whiteboard_edn = (function frontend$handler$whiteboard$get_onboard_whiteboard_edn(){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(fetch("./whiteboard/onboarding.edn")),(function (res){
return promesa.protocols._mcat(promesa.protocols._promise(res.text()),(function (text){
return promesa.protocols._mcat(promesa.protocols._promise(logseq.common.util.safe_read_map_string.cljs$core$IFn$_invoke$arity$1(text)),(function (edn){
return promesa.protocols._promise(edn);
}));
}));
}));
}));
});
/**
 * Given a tldr, clone the whiteboard page into current active whiteboard
 */
frontend.handler.whiteboard.clone_whiteboard_from_edn = (function frontend$handler$whiteboard$clone_whiteboard_from_edn(var_args){
var G__66697 = arguments.length;
switch (G__66697) {
case 1:
return frontend.handler.whiteboard.clone_whiteboard_from_edn.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return frontend.handler.whiteboard.clone_whiteboard_from_edn.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.handler.whiteboard.clone_whiteboard_from_edn.cljs$core$IFn$_invoke$arity$1 = (function (edn){
var temp__5804__auto__ = frontend.state.active_tldraw_app();
if(cljs.core.truth_(temp__5804__auto__)){
var app = temp__5804__auto__;
return frontend.handler.whiteboard.clone_whiteboard_from_edn.cljs$core$IFn$_invoke$arity$2(edn,app.api);
} else {
return null;
}
}));

(frontend.handler.whiteboard.clone_whiteboard_from_edn.cljs$core$IFn$_invoke$arity$2 = (function (p__66698,api){
var map__66699 = p__66698;
var map__66699__$1 = cljs.core.__destructure_map(map__66699);
var pages = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__66699__$1,new cljs.core.Keyword(null,"pages","pages",-285406513));
var blocks = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__66699__$1,new cljs.core.Keyword(null,"blocks","blocks",-610462153));
var page_block = cljs.core.first(pages);
var shapes = frontend.handler.whiteboard.build_shapes(blocks);
var tldr_page = frontend.handler.property.util.page_block__GT_tldr_page(page_block);
var assets = new cljs.core.Keyword(null,"assets","assets",210278279).cljs$core$IFn$_invoke$arity$1(tldr_page);
var bindings = new cljs.core.Keyword(null,"bindings","bindings",1271397192).cljs$core$IFn$_invoke$arity$1(tldr_page);
return api.cloneShapesIntoCurrentPage(cljs.core.clj__GT_js(new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"shapes","shapes",1897594879),shapes,new cljs.core.Keyword(null,"assets","assets",210278279),assets,new cljs.core.Keyword(null,"bindings","bindings",1271397192),bindings], null)));
}));

(frontend.handler.whiteboard.clone_whiteboard_from_edn.cljs$lang$maxFixedArity = 2);

/**
 * When there is no whiteboard, or there is only one whiteboard that has the given page name, we should populate the onboarding shapes
 */
frontend.handler.whiteboard.should_populate_onboarding_whiteboard_QMARK_ = (function frontend$handler$whiteboard$should_populate_onboarding_whiteboard_QMARK_(page_uuid){
var whiteboards = frontend.db.model.get_all_whiteboards(frontend.state.get_current_repo());
return ((((cljs.core.empty_QMARK_(whiteboards)) || (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2((1),cljs.core.count(whiteboards))) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.str.cljs$core$IFn$_invoke$arity$1(page_uuid),cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(cljs.core.first(whiteboards))))))))) && (cljs.core.not(frontend.state.get_onboarding_whiteboard_QMARK_())));
});
frontend.handler.whiteboard.update_shapes_BANG_ = (function frontend$handler$whiteboard$update_shapes_BANG_(shapes){
var temp__5804__auto__ = frontend.state.active_tldraw_app();
if(cljs.core.truth_(temp__5804__auto__)){
var app = temp__5804__auto__;
var api = app.api;
return cljs.core.apply.cljs$core$IFn$_invoke$arity$2(api.updateShapes,cljs_bean.core.__GT_js(shapes));
} else {
return null;
}
});
frontend.handler.whiteboard.update_shapes_index_BANG_ = (function frontend$handler$whiteboard$update_shapes_index_BANG_(page_uuid){
var temp__5804__auto__ = frontend.state.active_tldraw_app();
if(cljs.core.truth_(temp__5804__auto__)){
var app = temp__5804__auto__;
var tl_page = cljs.core.second(cljs.core.first(app.pages));
if(cljs.core.truth_(tl_page)){
var temp__5804__auto____$1 = (frontend.db.get_page.cljs$core$IFn$_invoke$arity$1 ? frontend.db.get_page.cljs$core$IFn$_invoke$arity$1(page_uuid) : frontend.db.get_page.call(null,page_uuid));
if(cljs.core.truth_(temp__5804__auto____$1)){
var page = temp__5804__auto____$1;
var shapes_index = cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.comp.cljs$core$IFn$_invoke$arity$2(cljs.core.str,new cljs.core.Keyword("block","uuid","block/uuid",-1991494552)),(function (){var G__66702 = new cljs.core.Keyword("block","_page","block/_page",1150043350).cljs$core$IFn$_invoke$arity$1(page);
return (frontend.db.sort_by_order.cljs$core$IFn$_invoke$arity$1 ? frontend.db.sort_by_order.cljs$core$IFn$_invoke$arity$1(G__66702) : frontend.db.sort_by_order.call(null,G__66702));
})());
if(cljs.core.seq(shapes_index)){
return tl_page.updateShapesIndex(cljs_bean.core.__GT_js(shapes_index));
} else {
return null;
}
} else {
return null;
}
} else {
return null;
}
} else {
return null;
}
});
frontend.handler.whiteboard.populate_onboarding_whiteboard = (function frontend$handler$whiteboard$populate_onboarding_whiteboard(api){
if((!((api == null)))){
return promesa.core.catch$.cljs$core$IFn$_invoke$arity$2(promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.whiteboard.get_onboard_whiteboard_edn()),(function (edn){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.whiteboard.clone_whiteboard_from_edn.cljs$core$IFn$_invoke$arity$2(edn,api)),(function (___40947__auto__){
return promesa.protocols._promise(frontend.state.set_onboarding_whiteboard_BANG_(true));
}));
}));
})),(function (e){
return console.warn("Failed to populate onboarding whiteboard",e);
}));
} else {
return null;
}
});
frontend.handler.whiteboard.cleanup_BANG_ = (function frontend$handler$whiteboard$cleanup_BANG_(tl_page){
var shapes = tl_page.shapes;
return tl_page.cleanup(cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__66703_SHARP_){
return p1__66703_SHARP_.id;
}),shapes));
});
frontend.handler.whiteboard.onboarding_show = (function frontend$handler$whiteboard$onboarding_show(){
if(cljs.core.not((function (){var or__5002__auto__ = frontend.state.sub(new cljs.core.Keyword("whiteboard","onboarding-tour?","whiteboard/onboarding-tour?",2082551629));
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = frontend.config.demo_graph_QMARK_.cljs$core$IFn$_invoke$arity$0();
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
return frontend.util.mobile_QMARK_();
}
}
})())){
frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("whiteboard","onboarding","whiteboard/onboarding",-1343828989)], null));

frontend.state.set_state_BANG_(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("whiteboard","onboarding-tour?","whiteboard/onboarding-tour?",2082551629)], null),true);

return frontend.storage.set(new cljs.core.Keyword(null,"whiteboard-onboarding-tour?","whiteboard-onboarding-tour?",1650413719),true);
} else {
return null;
}
});

//# sourceMappingURL=frontend.handler.whiteboard.js.map
