goog.provide('frontend.worker.rtc.gen_client_op');
frontend.worker.rtc.gen_client_op.latest_add_QMARK___GT_v__GT_t = (function frontend$worker$rtc$gen_client_op$latest_add_QMARK___GT_v__GT_t(add_QMARK___GT_v__GT_t){
var latest_add = cljs.core.first(cljs.core.sort_by.cljs$core$IFn$_invoke$arity$3(cljs.core.second,cljs.core._GT_,cljs.core.seq((add_QMARK___GT_v__GT_t.cljs$core$IFn$_invoke$arity$1 ? add_QMARK___GT_v__GT_t.cljs$core$IFn$_invoke$arity$1(true) : add_QMARK___GT_v__GT_t.call(null,true)))));
var latest_retract = cljs.core.first(cljs.core.sort_by.cljs$core$IFn$_invoke$arity$3(cljs.core.second,cljs.core._GT_,cljs.core.seq((add_QMARK___GT_v__GT_t.cljs$core$IFn$_invoke$arity$1 ? add_QMARK___GT_v__GT_t.cljs$core$IFn$_invoke$arity$1(false) : add_QMARK___GT_v__GT_t.call(null,false)))));
if((latest_add == null)){
return new cljs.core.PersistentArrayMap(null, 1, [false,cljs.core.conj.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,latest_retract)], null);
} else {
if((latest_retract == null)){
return new cljs.core.PersistentArrayMap(null, 1, [true,cljs.core.conj.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,latest_add)], null);
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.second(latest_add),cljs.core.second(latest_retract))){
return new cljs.core.PersistentArrayMap(null, 2, [true,cljs.core.conj.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,latest_add),false,cljs.core.conj.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,latest_retract)], null);
} else {
if((cljs.core.second(latest_add) > cljs.core.second(latest_retract))){
return new cljs.core.PersistentArrayMap(null, 1, [true,cljs.core.conj.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,latest_add)], null);
} else {
return new cljs.core.PersistentArrayMap(null, 1, [false,cljs.core.conj.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,latest_retract)], null);

}
}
}
}
});
frontend.worker.rtc.gen_client_op.watched_attrs = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 12, [new cljs.core.Keyword("logseq.property","value","logseq.property/value",1396524865),null,new cljs.core.Keyword("db","index","db/index",-1531680669),null,new cljs.core.Keyword("block","alias","block/alias",-2112644699),null,new cljs.core.Keyword("block","link","block/link",-1872399993),null,new cljs.core.Keyword("db","valueType","db/valueType",1827971944),null,new cljs.core.Keyword("block","updated-at","block/updated-at",-1516550551),null,new cljs.core.Keyword("block","created-at","block/created-at",1440015),null,new cljs.core.Keyword("block","journal-day","block/journal-day",-145748366),null,new cljs.core.Keyword("block","tags","block/tags",1814948340),null,new cljs.core.Keyword("block","title","block/title",710445684),null,new cljs.core.Keyword("db","cardinality","db/cardinality",-104975659),null,new cljs.core.Keyword("logseq.property","classes","logseq.property/classes",913750486),null], null), null);
frontend.worker.rtc.gen_client_op.watched_attr_ns = cljs.core.conj.cljs$core$IFn$_invoke$arity$2(logseq.db.frontend.property.logseq_property_namespaces,"logseq.class");
frontend.worker.rtc.gen_client_op.watched_attr_QMARK_ = (function frontend$worker$rtc$gen_client_op$watched_attr_QMARK_(attr){
var or__5002__auto__ = cljs.core.contains_QMARK_(frontend.worker.rtc.gen_client_op.watched_attrs,attr);
if(or__5002__auto__){
return or__5002__auto__;
} else {
var ns = cljs.core.namespace(attr);
return ((cljs.core.contains_QMARK_(frontend.worker.rtc.gen_client_op.watched_attr_ns,ns)) || (((clojure.string.ends_with_QMARK_(ns,".property")) || (clojure.string.ends_with_QMARK_(ns,".class")))));
}
});
frontend.worker.rtc.gen_client_op.ref_attr_QMARK_ = (function frontend$worker$rtc$gen_client_op$ref_attr_QMARK_(db,attr){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db.type","ref","db.type/ref",-1728373079),cljs.core.get_in.cljs$core$IFn$_invoke$arity$2((datascript.core.schema.cljs$core$IFn$_invoke$arity$1 ? datascript.core.schema.cljs$core$IFn$_invoke$arity$1(db) : datascript.core.schema.call(null,db)),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [attr,new cljs.core.Keyword("db","valueType","db/valueType",1827971944)], null)));
});
frontend.worker.rtc.gen_client_op.update_op_av_coll = (function frontend$worker$rtc$gen_client_op$update_op_av_coll(db_before,db_after,a__GT_add_QMARK___GT_v__GT_t){
return cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (p__101667){
var vec__101668 = p__101667;
var a = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__101668,(0),null);
var add_QMARK___GT_v__GT_t = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__101668,(1),null);
return cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (p__101671){
var vec__101676 = p__101671;
var add_QMARK_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__101676,(0),null);
var v__GT_t = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__101676,(1),null);
return cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (p__101681){
var vec__101682 = p__101681;
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__101682,(0),null);
var t = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__101682,(1),null);
var ref_QMARK_ = frontend.worker.rtc.gen_client_op.ref_attr_QMARK_(db_after,a);
var G__101687 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [add_QMARK_,ref_QMARK_], null);
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [true,true], null),G__101687)){
var temp__5804__auto__ = new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1((datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db_after,v) : datascript.core.entity.call(null,db_after,v)));
if(cljs.core.truth_(temp__5804__auto__)){
var v_uuid = temp__5804__auto__;
return new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [a,v_uuid,t,add_QMARK_], null);
} else {
return null;
}
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [false,true], null),G__101687)){
var temp__5804__auto__ = new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1((function (){var or__5002__auto__ = (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db_after,v) : datascript.core.entity.call(null,db_after,v));
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db_before,v) : datascript.core.entity.call(null,db_before,v));
}
})());
if(cljs.core.truth_(temp__5804__auto__)){
var v_uuid = temp__5804__auto__;
return new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [a,v_uuid,t,add_QMARK_], null);
} else {
return null;
}
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [true,false], null),G__101687)){
return new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [a,logseq.db.write_transit_str(v),t,add_QMARK_], null);
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [false,false], null),G__101687)){
return new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [a,logseq.db.write_transit_str(v),t,add_QMARK_], null);
} else {
throw (new Error(["No matching clause: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(G__101687)].join('')));

}
}
}
}
}),v__GT_t);
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([add_QMARK___GT_v__GT_t], 0));
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([a__GT_add_QMARK___GT_v__GT_t], 0));
});
frontend.worker.rtc.gen_client_op.redundant_update_op_av_coll_QMARK_ = (function frontend$worker$rtc$gen_client_op$redundant_update_op_av_coll_QMARK_(av_coll){
return cljs.core.every_QMARK_((function (av){
return cljs.core.keyword_identical_QMARK_(new cljs.core.Keyword("block","updated-at","block/updated-at",-1516550551),cljs.core.first(av));
}),av_coll);
});
frontend.worker.rtc.gen_client_op.max_t = (function frontend$worker$rtc$gen_client_op$max_t(a__GT_add_QMARK___GT_v__GT_t){
return cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core.max,cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic(cljs.core.vals,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic(cljs.core.vals,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.vals(a__GT_add_QMARK___GT_v__GT_t)], 0))], 0)));
});
frontend.worker.rtc.gen_client_op.get_first_vt = (function frontend$worker$rtc$gen_client_op$get_first_vt(add_QMARK___GT_v__GT_t,k){
var G__101701 = add_QMARK___GT_v__GT_t;
var G__101701__$1 = (((G__101701 == null))?null:cljs.core.get.cljs$core$IFn$_invoke$arity$2(G__101701,k));
if((G__101701__$1 == null)){
return null;
} else {
return cljs.core.first(G__101701__$1);
}
});
frontend.worker.rtc.gen_client_op.entity_datoms_EQ__GT_ops = (function frontend$worker$rtc$gen_client_op$entity_datoms_EQ__GT_ops(db_before,db_after,e__GT_a__GT_add_QMARK___GT_v__GT_t,ignore_attr_set,entity_datoms){
var e = cljs.core.ffirst(entity_datoms);
var entity = (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db_after,e) : datascript.core.entity.call(null,db_after,e));
var map__101705 = entity;
var map__101705__$1 = cljs.core.__destructure_map(map__101705);
var block_uuid = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__101705__$1,new cljs.core.Keyword("block","uuid","block/uuid",-1991494552));
var a__GT_add_QMARK___GT_v__GT_t = (e__GT_a__GT_add_QMARK___GT_v__GT_t.cljs$core$IFn$_invoke$arity$1 ? e__GT_a__GT_add_QMARK___GT_v__GT_t.cljs$core$IFn$_invoke$arity$1(e) : e__GT_a__GT_add_QMARK___GT_v__GT_t.call(null,e));
var map__101706 = a__GT_add_QMARK___GT_v__GT_t;
var map__101706__$1 = cljs.core.__destructure_map(map__101706);
var add_QMARK___GT_block_name__GT_t = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__101706__$1,new cljs.core.Keyword("block","name","block/name",1619760316));
var add_QMARK___GT_block_title__GT_t = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__101706__$1,new cljs.core.Keyword("block","title","block/title",710445684));
var add_QMARK___GT_block_uuid__GT_t = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__101706__$1,new cljs.core.Keyword("block","uuid","block/uuid",-1991494552));
var add_QMARK___GT_block_parent__GT_t = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__101706__$1,new cljs.core.Keyword("block","parent","block/parent",-918309064));
var add_QMARK___GT_block_order__GT_t = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__101706__$1,new cljs.core.Keyword("block","order","block/order",-1429282437));
var vec__101707 = (function (){var G__101725 = add_QMARK___GT_block_uuid__GT_t;
var G__101725__$1 = (((G__101725 == null))?null:cljs.core.get.cljs$core$IFn$_invoke$arity$2(G__101725,false));
if((G__101725__$1 == null)){
return null;
} else {
return cljs.core.first(G__101725__$1);
}
})();
var retract_block_uuid = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__101707,(0),null);
var t1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__101707,(1),null);
var vec__101710 = (function (){var G__101729 = add_QMARK___GT_block_name__GT_t;
var G__101729__$1 = (((G__101729 == null))?null:cljs.core.get.cljs$core$IFn$_invoke$arity$2(G__101729,false));
if((G__101729__$1 == null)){
return null;
} else {
return cljs.core.first(G__101729__$1);
}
})();
var retract_block_name = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__101710,(0),null);
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__101710,(1),null);
var vec__101713 = (function (){var G__101732 = add_QMARK___GT_block_name__GT_t;
var G__101732__$1 = (((G__101732 == null))?null:frontend.worker.rtc.gen_client_op.latest_add_QMARK___GT_v__GT_t(G__101732));
if((G__101732__$1 == null)){
return null;
} else {
return frontend.worker.rtc.gen_client_op.get_first_vt(G__101732__$1,true);
}
})();
var add_block_name = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__101713,(0),null);
var t2 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__101713,(1),null);
var vec__101716 = (function (){var G__101733 = add_QMARK___GT_block_title__GT_t;
var G__101733__$1 = (((G__101733 == null))?null:frontend.worker.rtc.gen_client_op.latest_add_QMARK___GT_v__GT_t(G__101733));
if((G__101733__$1 == null)){
return null;
} else {
return frontend.worker.rtc.gen_client_op.get_first_vt(G__101733__$1,true);
}
})();
var add_block_title = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__101716,(0),null);
var t3 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__101716,(1),null);
var vec__101719 = (function (){var G__101736 = add_QMARK___GT_block_parent__GT_t;
var G__101736__$1 = (((G__101736 == null))?null:frontend.worker.rtc.gen_client_op.latest_add_QMARK___GT_v__GT_t(G__101736));
if((G__101736__$1 == null)){
return null;
} else {
return frontend.worker.rtc.gen_client_op.get_first_vt(G__101736__$1,true);
}
})();
var add_block_parent = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__101719,(0),null);
var t4 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__101719,(1),null);
var vec__101722 = (function (){var G__101740 = add_QMARK___GT_block_order__GT_t;
var G__101740__$1 = (((G__101740 == null))?null:frontend.worker.rtc.gen_client_op.latest_add_QMARK___GT_v__GT_t(G__101740));
if((G__101740__$1 == null)){
return null;
} else {
return frontend.worker.rtc.gen_client_op.get_first_vt(G__101740__$1,true);
}
})();
var add_block_order = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__101722,(0),null);
var t5 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__101722,(1),null);
var a__GT_add_QMARK___GT_v__GT_t_STAR_ = cljs.core.into.cljs$core$IFn$_invoke$arity$3(cljs.core.PersistentArrayMap.EMPTY,cljs.core.filter.cljs$core$IFn$_invoke$arity$1((function (p__101748){
var vec__101749 = p__101748;
var a = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__101749,(0),null);
var ___$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__101749,(1),null);
return ((frontend.worker.rtc.gen_client_op.watched_attr_QMARK_(a)) && ((!(cljs.core.contains_QMARK_(ignore_attr_set,a)))));
})),a__GT_add_QMARK___GT_v__GT_t);
if(cljs.core.truth_((function (){var and__5000__auto__ = retract_block_uuid;
if(cljs.core.truth_(and__5000__auto__)){
return retract_block_name;
} else {
return and__5000__auto__;
}
})())){
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"remove-page","remove-page",-1679345876),t1,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"block-uuid","block-uuid",-1558039638),retract_block_uuid], null)], null)], null);
} else {
if(cljs.core.truth_(retract_block_uuid)){
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"remove","remove",-131428414),t1,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"block-uuid","block-uuid",-1558039638),retract_block_uuid], null)], null)], null);
} else {
var ops = (function (){var G__101752 = cljs.core.PersistentVector.EMPTY;
var G__101752__$1 = (cljs.core.truth_((function (){var or__5002__auto__ = add_block_parent;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return add_block_order;
}
})())?cljs.core.conj.cljs$core$IFn$_invoke$arity$2(G__101752,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"move","move",-2110884309),(function (){var or__5002__auto__ = t4;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return t5;
}
})(),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"block-uuid","block-uuid",-1558039638),block_uuid], null)], null)):G__101752);
if(cljs.core.truth_((function (){var or__5002__auto__ = add_block_name;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var and__5000__auto__ = (logseq.db.page_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.page_QMARK_.cljs$core$IFn$_invoke$arity$1(entity) : logseq.db.page_QMARK_.call(null,entity));
if(cljs.core.truth_(and__5000__auto__)){
return add_block_title;
} else {
return and__5000__auto__;
}
}
})())){
return cljs.core.conj.cljs$core$IFn$_invoke$arity$2(G__101752__$1,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"update-page","update-page",-503479891),(function (){var or__5002__auto__ = t2;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return t3;
}
})(),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"block-uuid","block-uuid",-1558039638),block_uuid], null)], null));
} else {
return G__101752__$1;
}
})();
var update_op = (function (){var temp__5804__auto__ = cljs.core.not_empty(frontend.worker.rtc.gen_client_op.update_op_av_coll(db_before,db_after,a__GT_add_QMARK___GT_v__GT_t_STAR_));
if(cljs.core.truth_(temp__5804__auto__)){
var av_coll = temp__5804__auto__;
if(frontend.worker.rtc.gen_client_op.redundant_update_op_av_coll_QMARK_(av_coll)){
return null;
} else {
var t = frontend.worker.rtc.gen_client_op.max_t(a__GT_add_QMARK___GT_v__GT_t_STAR_);
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"update","update",1045576396),t,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"block-uuid","block-uuid",-1558039638),block_uuid,new cljs.core.Keyword(null,"av-coll","av-coll",1589194401),av_coll], null)], null);
}
} else {
return null;
}
})();
var G__101762 = ops;
if(cljs.core.truth_(update_op)){
return cljs.core.conj.cljs$core$IFn$_invoke$arity$2(G__101762,update_op);
} else {
return G__101762;
}

}
}
});
frontend.worker.rtc.gen_client_op.entity_datoms_EQ__GT_a__GT_add_QMARK___GT_v__GT_t = (function frontend$worker$rtc$gen_client_op$entity_datoms_EQ__GT_a__GT_add_QMARK___GT_v__GT_t(entity_datoms){
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (m,datom){
var vec__101764 = datom;
var _e = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__101764,(0),null);
var a = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__101764,(1),null);
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__101764,(2),null);
var t = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__101764,(3),null);
var add_QMARK_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__101764,(4),null);
return cljs.core.assoc_in(m,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [a,add_QMARK_,v], null),t);
}),cljs.core.PersistentArrayMap.EMPTY,entity_datoms);
});
frontend.worker.rtc.gen_client_op.generate_rtc_ops = (function frontend$worker$rtc$gen_client_op$generate_rtc_ops(db_before,db_after,same_entity_datoms_coll,e__GT_a__GT_v__GT_add_QMARK___GT_t){
return cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic(cljs.core.partial.cljs$core$IFn$_invoke$arity$variadic(frontend.worker.rtc.gen_client_op.entity_datoms_EQ__GT_ops,db_before,db_after,e__GT_a__GT_v__GT_add_QMARK___GT_t,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([frontend.worker.rtc.const$.ignore_attrs_when_syncing], 0)),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([same_entity_datoms_coll], 0));
});
frontend.worker.rtc.gen_client_op.generate_rtc_ops_from_entities = (function frontend$worker$rtc$gen_client_op$generate_rtc_ops_from_entities(ents){
var db = datascript.core.entity_db(cljs.core.first(ents));
var id__GT_same_entity_datoms = cljs.core.into.cljs$core$IFn$_invoke$arity$3(cljs.core.PersistentArrayMap.EMPTY,cljs.core.map.cljs$core$IFn$_invoke$arity$1((function (ent){
var e = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(ent);
var datoms = datascript.core.datoms.cljs$core$IFn$_invoke$arity$3(db,new cljs.core.Keyword(null,"eavt","eavt",-666437073),e);
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [e,datoms], null);
})),ents);
var e__GT_a__GT_v__GT_add_QMARK___GT_t = cljs.core.update_vals(id__GT_same_entity_datoms,frontend.worker.rtc.gen_client_op.entity_datoms_EQ__GT_a__GT_add_QMARK___GT_v__GT_t);
return frontend.worker.rtc.gen_client_op.generate_rtc_ops(db,db,cljs.core.vals(id__GT_same_entity_datoms),e__GT_a__GT_v__GT_add_QMARK___GT_t);
});
frontend.worker.rtc.gen_client_op.generate_rtc_ops_from_property_entities = (function frontend$worker$rtc$gen_client_op$generate_rtc_ops_from_property_entities(property_ents){
if(cljs.core.seq(property_ents)){
if(cljs.core.every_QMARK_(logseq.db.property_QMARK_,property_ents)){
} else {
throw (new Error("Assert failed: (every? ldb/property? property-ents)"));
}

return frontend.worker.rtc.gen_client_op.generate_rtc_ops_from_entities(property_ents);
} else {
return null;
}
});
frontend.worker.rtc.gen_client_op.generate_rtc_ops_from_class_entities = (function frontend$worker$rtc$gen_client_op$generate_rtc_ops_from_class_entities(class_ents){
if(cljs.core.seq(class_ents)){
if(cljs.core.every_QMARK_(logseq.db.class_QMARK_,class_ents)){
} else {
throw (new Error("Assert failed: (every? ldb/class? class-ents)"));
}

return frontend.worker.rtc.gen_client_op.generate_rtc_ops_from_entities(class_ents);
} else {
return null;
}
});

//# sourceMappingURL=frontend.worker.rtc.gen_client_op.js.map
