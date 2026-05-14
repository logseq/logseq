goog.provide('logseq.db.common.initial_data');
logseq.db.common.initial_data.get_pages_by_name = (function logseq$db$common$initial_data$get_pages_by_name(db,page_name){
return datascript.core.datoms.cljs$core$IFn$_invoke$arity$4(db,new cljs.core.Keyword(null,"avet","avet",1383857032),new cljs.core.Keyword("block","name","block/name",1619760316),logseq.common.util.page_name_sanity_lc(page_name));
});
/**
 * Return the oldest page's db id for :block/name
 */
logseq.db.common.initial_data.get_first_page_by_name = (function logseq$db$common$initial_data$get_first_page_by_name(db,page_name){
if(cljs.core.truth_((function (){var and__5000__auto__ = db;
if(cljs.core.truth_(and__5000__auto__)){
return typeof page_name === 'string';
} else {
return and__5000__auto__;
}
})())){
return cljs.core.first(cljs.core.sort.cljs$core$IFn$_invoke$arity$1(cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"e","e",1381269198),logseq.db.common.initial_data.get_pages_by_name(db,page_name))));
} else {
return null;
}
});
/**
 * Return the oldest page's db id for :block/title
 */
logseq.db.common.initial_data.get_first_page_by_title = (function logseq$db$common$initial_data$get_first_page_by_title(db,page_name){
if(typeof page_name === 'string'){
} else {
throw (new Error("Assert failed: (string? page-name)"));
}

return cljs.core.first(cljs.core.sort.cljs$core$IFn$_invoke$arity$1(cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"e","e",1381269198),cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (d){
var e = (function (){var G__59743 = db;
var G__59744 = new cljs.core.Keyword(null,"e","e",1381269198).cljs$core$IFn$_invoke$arity$1(d);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__59743,G__59744) : datascript.core.entity.call(null,G__59743,G__59744));
})();
return logseq.db.common.entity_util.page_QMARK_(e);
}),datascript.core.datoms.cljs$core$IFn$_invoke$arity$4(db,new cljs.core.Keyword(null,"avet","avet",1383857032),new cljs.core.Keyword("block","title","block/title",710445684),page_name)))));
});
logseq.db.common.initial_data.get_block_alias = (function logseq$db$common$initial_data$get_block_alias(db,eid){
return cljs.core.distinct.cljs$core$IFn$_invoke$arity$1((function (){var G__59747 = new cljs.core.PersistentVector(null, 8, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"find","find",496279456),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?e","?e",-1194391683,null),new cljs.core.Symbol(null,"...","...",-1926939749,null)], null),new cljs.core.Keyword(null,"in","in",-1531184865),new cljs.core.Symbol(null,"$","$",-1580747756,null),new cljs.core.Symbol(null,"?eid","?eid",1087837141,null),new cljs.core.Symbol(null,"%","%",-950237169,null),new cljs.core.Keyword(null,"where","where",-2044795965),cljs.core.list(new cljs.core.Symbol(null,"alias","alias",-399220103,null),new cljs.core.Symbol(null,"?eid","?eid",1087837141,null),new cljs.core.Symbol(null,"?e","?e",-1194391683,null))], null);
var G__59748 = db;
var G__59749 = eid;
var G__59750 = new cljs.core.Keyword(null,"alias","alias",-2039751630).cljs$core$IFn$_invoke$arity$1(logseq.db.frontend.rules.rules);
return (datascript.core.q.cljs$core$IFn$_invoke$arity$4 ? datascript.core.q.cljs$core$IFn$_invoke$arity$4(G__59747,G__59748,G__59749,G__59750) : datascript.core.q.call(null,G__59747,G__59748,G__59749,G__59750));
})());
});
logseq.db.common.initial_data.get_all_files = (function logseq$db$common$initial_data$get_all_files(db){
return cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (e){
return datascript.core.datoms.cljs$core$IFn$_invoke$arity$3(db,new cljs.core.Keyword(null,"eavt","eavt",-666437073),new cljs.core.Keyword(null,"e","e",1381269198).cljs$core$IFn$_invoke$arity$1(e));
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([datascript.core.datoms.cljs$core$IFn$_invoke$arity$3(db,new cljs.core.Keyword(null,"avet","avet",1383857032),new cljs.core.Keyword("file","path","file/path",-191335748))], 0));
});
logseq.db.common.initial_data.with_block_refs = (function logseq$db$common$initial_data$with_block_refs(db,block){
return cljs.core.update.cljs$core$IFn$_invoke$arity$3(block,new cljs.core.Keyword("block","refs","block/refs",-1214495349),(function (refs){
return cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (ref){
var G__59754 = db;
var G__59755 = new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"*","*",345799209,null)], null);
var G__59756 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(ref);
return (datascript.core.pull.cljs$core$IFn$_invoke$arity$3 ? datascript.core.pull.cljs$core$IFn$_invoke$arity$3(G__59754,G__59755,G__59756) : datascript.core.pull.call(null,G__59754,G__59755,G__59756));
}),refs);
}));
});
logseq.db.common.initial_data.with_parent = (function logseq$db$common$initial_data$with_parent(db,block){
if(cljs.core.truth_(new cljs.core.Keyword("block","page","block/page",822314108).cljs$core$IFn$_invoke$arity$1(block))){
var parent = (function (){var temp__5804__auto__ = (function (){var G__59757 = db;
var G__59758 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","parent","block/parent",-918309064).cljs$core$IFn$_invoke$arity$1(block));
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__59757,G__59758) : datascript.core.entity.call(null,G__59757,G__59758));
})();
if(cljs.core.truth_(temp__5804__auto__)){
var e = temp__5804__auto__;
return cljs.core.select_keys(e,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","id","db/id",-1388397098),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552)], null));
} else {
return null;
}
})();
return logseq.db.common.initial_data.with_block_refs(db,logseq.common.util.remove_nils_non_nested(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(block,new cljs.core.Keyword("block","parent","block/parent",-918309064),parent)));
} else {
return block;

}
});
logseq.db.common.initial_data.mark_block_fully_loaded = (function logseq$db$common$initial_data$mark_block_fully_loaded(b){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(b,new cljs.core.Keyword("block.temp","fully-loaded?","block.temp/fully-loaded?",-116637365),true);
});
/**
 * Returns children UUIDs
 */
logseq.db.common.initial_data.get_block_children_ids = (function logseq$db$common$initial_data$get_block_children_ids(db,block_uuid){
var temp__5804__auto__ = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1((function (){var G__59765 = db;
var G__59766 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_uuid], null);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__59765,G__59766) : datascript.core.entity.call(null,G__59765,G__59766));
})());
if(cljs.core.truth_(temp__5804__auto__)){
var eid = temp__5804__auto__;
var seen = cljs.core.volatile_BANG_(cljs.core.PersistentVector.EMPTY);
var steps_59866 = (100);
var eids_to_expand_59867 = new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [eid], null);
while(true){
if(cljs.core.seq(eids_to_expand_59867)){
var eids_to_expand_STAR__59868 = cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic(((function (steps_59866,eids_to_expand_59867,seen,eid,temp__5804__auto__){
return (function (eid__$1){
return cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.first,datascript.core.datoms.cljs$core$IFn$_invoke$arity$4(db,new cljs.core.Keyword(null,"avet","avet",1383857032),new cljs.core.Keyword("block","parent","block/parent",-918309064),eid__$1));
});})(steps_59866,eids_to_expand_59867,seen,eid,temp__5804__auto__))
,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([eids_to_expand_59867], 0));
var uuids_to_add_59869 = cljs.core.remove.cljs$core$IFn$_invoke$arity$2(cljs.core.nil_QMARK_,cljs.core.map.cljs$core$IFn$_invoke$arity$2(((function (steps_59866,eids_to_expand_59867,eids_to_expand_STAR__59868,seen,eid,temp__5804__auto__){
return (function (p1__59763_SHARP_){
return new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1((datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db,p1__59763_SHARP_) : datascript.core.entity.call(null,db,p1__59763_SHARP_)));
});})(steps_59866,eids_to_expand_59867,eids_to_expand_STAR__59868,seen,eid,temp__5804__auto__))
,eids_to_expand_STAR__59868));
if((((steps_59866 === (0))) && (cljs.core.seq(clojure.set.intersection.cljs$core$IFn$_invoke$arity$2(cljs.core.set(cljs.core.deref(seen)),cljs.core.set(uuids_to_add_59869)))))){
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2("bad outliner data, need to re-index to fix",new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"seen","seen",-518999789),cljs.core.deref(seen),new cljs.core.Keyword(null,"eids-to-expand","eids-to-expand",-1188782731),eids_to_expand_59867], null));
} else {
}

seen.cljs$core$IVolatile$_vreset_BANG_$arity$2(null,cljs.core.partial.cljs$core$IFn$_invoke$arity$2(cljs.core.apply,cljs.core.conj)(seen.cljs$core$IDeref$_deref$arity$1(null),uuids_to_add_59869));

var G__59872 = (((steps_59866 === (0)))?(100):(steps_59866 - (1)));
var G__59873 = eids_to_expand_STAR__59868;
steps_59866 = G__59872;
eids_to_expand_59867 = G__59873;
continue;
} else {
}
break;
}

return cljs.core.deref(seen);
} else {
return null;
}
});
/**
 * Including nested children.
 */
logseq.db.common.initial_data.get_block_children = (function logseq$db$common$initial_data$get_block_children(db,block_uuid){
var ids = logseq.db.common.initial_data.get_block_children_ids(db,block_uuid);
if(cljs.core.seq(ids)){
var ids_SINGLEQUOTE_ = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (id){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),id], null);
}),ids);
var G__59774 = db;
var G__59775 = new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"*","*",345799209,null)], null);
var G__59776 = ids_SINGLEQUOTE_;
return (datascript.core.pull_many.cljs$core$IFn$_invoke$arity$3 ? datascript.core.pull_many.cljs$core$IFn$_invoke$arity$3(G__59774,G__59775,G__59776) : datascript.core.pull_many.call(null,G__59774,G__59775,G__59776));
} else {
return null;
}
});
logseq.db.common.initial_data.with_raw_title = (function logseq$db$common$initial_data$with_raw_title(m,entity){
var temp__5802__auto__ = new cljs.core.Keyword("block","raw-title","block/raw-title",1833669090).cljs$core$IFn$_invoke$arity$1(entity);
if(cljs.core.truth_(temp__5802__auto__)){
var raw_title = temp__5802__auto__;
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(m,new cljs.core.Keyword("block","title","block/title",710445684),raw_title);
} else {
return m;
}
});
logseq.db.common.initial_data.entity__GT_map = (function logseq$db$common$initial_data$entity__GT_map(entity){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(logseq.db.common.initial_data.with_raw_title(cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,entity),entity),new cljs.core.Keyword("db","id","db/id",-1388397098),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(entity));
});
/**
 * Whether ref-block (for block with the `id`) should be hidden.
 */
logseq.db.common.initial_data.hidden_ref_QMARK_ = (function logseq$db$common$initial_data$hidden_ref_QMARK_(db,ref_block,id){
var db_based_QMARK_ = logseq.db.common.entity_plus.db_based_graph_QMARK_(db);
if(cljs.core.truth_(db_based_QMARK_)){
var entity = (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db,id) : datascript.core.entity.call(null,db,id));
return ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(ref_block),id)) || (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(id,new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","page","block/page",822314108).cljs$core$IFn$_invoke$arity$1(ref_block)))) || (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(id,new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("logseq.property","view-for","logseq.property/view-for",-36274319).cljs$core$IFn$_invoke$arity$1(ref_block)))) || (((logseq.db.frontend.entity_util.hidden_QMARK_(new cljs.core.Keyword("block","page","block/page",822314108).cljs$core$IFn$_invoke$arity$1(ref_block))) || (((logseq.db.frontend.entity_util.hidden_QMARK_(ref_block)) || (((cljs.core.contains_QMARK_(cljs.core.set(cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","id","db/id",-1388397098),new cljs.core.Keyword("block","tags","block/tags",1814948340).cljs$core$IFn$_invoke$arity$1(ref_block))),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(entity))) || ((!((cljs.core.get.cljs$core$IFn$_invoke$arity$2(ref_block,new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(entity)) == null)))))))))))))));
} else {
return ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(ref_block),id)) || (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(id,new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","page","block/page",822314108).cljs$core$IFn$_invoke$arity$1(ref_block)))));
}
});
logseq.db.common.initial_data.get_block_refs_count = (function logseq$db$common$initial_data$get_block_refs_count(db,id){
var or__5002__auto__ = (function (){var with_alias = cljs.core.distinct.cljs$core$IFn$_invoke$arity$1(cljs.core.cons(id,logseq.db.common.initial_data.get_block_alias(db,id)));
var G__59784 = with_alias;
var G__59784__$1 = (((G__59784 == null))?null:cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__59781_SHARP_){
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db,p1__59781_SHARP_) : datascript.core.entity.call(null,db,p1__59781_SHARP_));
}),G__59784));
var G__59784__$2 = (((G__59784__$1 == null))?null:cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword("block","_refs","block/_refs",830218531),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([G__59784__$1], 0)));
var G__59784__$3 = (((G__59784__$2 == null))?null:cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (ref_block){
return logseq.db.common.initial_data.hidden_ref_QMARK_(db,ref_block,id);
}),G__59784__$2));
if((G__59784__$3 == null)){
return null;
} else {
return cljs.core.count(G__59784__$3);
}
})();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return (0);
}
});
logseq.db.common.initial_data.get_block_and_children = (function logseq$db$common$initial_data$get_block_and_children(db,id,p__59789){
var map__59790 = p__59789;
var map__59790__$1 = cljs.core.__destructure_map(map__59790);
var children_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__59790__$1,new cljs.core.Keyword(null,"children?","children?",-1199594108));
var children_only_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__59790__$1,new cljs.core.Keyword(null,"children-only?","children-only?",-1225782855));
var nested_children_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__59790__$1,new cljs.core.Keyword(null,"nested-children?","nested-children?",1651323711));
var properties = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__59790__$1,new cljs.core.Keyword(null,"properties","properties",685819552));
var children_props = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__59790__$1,new cljs.core.Keyword(null,"children-props","children-props",919638355));
var block = (function (){var G__59795 = db;
var G__59796 = ((cljs.core.uuid_QMARK_(id))?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),id], null):id);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__59795,G__59796) : datascript.core.entity.call(null,G__59795,G__59796));
})();
var block_refs_count_QMARK_ = cljs.core.some(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("block.temp","refs-count","block.temp/refs-count",-598132499),null], null), null),properties);
var whiteboard_QMARK_ = logseq.db.common.entity_util.whiteboard_QMARK_(block);
if(cljs.core.truth_(block)){
var children = (cljs.core.truth_((function (){var or__5002__auto__ = children_QMARK_;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return children_only_QMARK_;
}
})())?(function (){var page_QMARK_ = logseq.db.common.entity_util.page_QMARK_(block);
var children = cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (e){
var or__5002__auto__ = new cljs.core.Keyword("logseq.property","created-from-property","logseq.property/created-from-property",-861892267).cljs$core$IFn$_invoke$arity$1(e);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword("block","closed-value-property","block/closed-value-property",1157792813).cljs$core$IFn$_invoke$arity$1(e);
}
}),(cljs.core.truth_((function (){var and__5000__auto__ = nested_children_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.not(page_QMARK_);
} else {
return and__5000__auto__;
}
})())?logseq.db.common.initial_data.get_block_children(db,new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block)):(cljs.core.truth_(nested_children_QMARK_)?new cljs.core.Keyword("block","_page","block/_page",1150043350).cljs$core$IFn$_invoke$arity$1(block):(function (){var short_page_QMARK_ = (cljs.core.truth_(page_QMARK_)?(cljs.core.count(new cljs.core.Keyword("block","_page","block/_page",1150043350).cljs$core$IFn$_invoke$arity$1(block)) <= (100)):null);
if(cljs.core.truth_(short_page_QMARK_)){
return new cljs.core.Keyword("block","_page","block/_page",1150043350).cljs$core$IFn$_invoke$arity$1(block);
} else {
return new cljs.core.Keyword("block","_parent","block/_parent",-639389670).cljs$core$IFn$_invoke$arity$1(block);
}
})()
)));
var children_props__$1 = (cljs.core.truth_(whiteboard_QMARK_)?new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"*","*",345799209,null)], null):(function (){var or__5002__auto__ = children_props;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.PersistentVector(null, 8, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","id","db/id",-1388397098),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Keyword("block","parent","block/parent",-918309064),new cljs.core.Keyword("block","order","block/order",-1429282437),new cljs.core.Keyword("block","collapsed?","block/collapsed?",2140210991),new cljs.core.Keyword("block","title","block/title",710445684),new cljs.core.Keyword("logseq.property","status","logseq.property/status",-907216853),new cljs.core.Keyword("logseq.property.node","display-type","logseq.property.node/display-type",442446189)], null);
}
})());
return cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (block__$1){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(children_props__$1,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"*","*",345799209,null)], null))){
return logseq.db.common.initial_data.entity__GT_map(block__$1);
} else {
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(logseq.db.common.initial_data.with_raw_title(cljs.core.select_keys(block__$1,children_props__$1),block__$1),new cljs.core.Keyword("block.temp","has-children?","block.temp/has-children?",935519725),(!((new cljs.core.Keyword("block","_parent","block/_parent",-639389670).cljs$core$IFn$_invoke$arity$1(block__$1) == null))));
}
}),children);
})():null);
if(cljs.core.truth_(children_only_QMARK_)){
return new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"children","children",-940561982),children], null);
} else {
var block_SINGLEQUOTE_ = ((cljs.core.seq(properties))?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(logseq.db.common.initial_data.with_raw_title(cljs.core.select_keys(block,properties),block),new cljs.core.Keyword("db","id","db/id",-1388397098),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block)):logseq.db.common.initial_data.entity__GT_map(block));
var block_SINGLEQUOTE___$1 = (function (){var G__59803 = logseq.db.common.initial_data.mark_block_fully_loaded(block_SINGLEQUOTE_);
var G__59803__$1 = cljs.core.update_vals(G__59803,(function (v){
if(datascript.impl.entity.entity_QMARK_(v)){
return logseq.db.common.initial_data.entity__GT_map(v);
} else {
if(((cljs.core.coll_QMARK_(v)) && (cljs.core.every_QMARK_(datascript.impl.entity.entity_QMARK_,v)))){
return cljs.core.map.cljs$core$IFn$_invoke$arity$2(logseq.db.common.initial_data.entity__GT_map,v);
} else {
return v;

}
}
}))
;
if(cljs.core.truth_(block_refs_count_QMARK_)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__59803__$1,new cljs.core.Keyword("block.temp","refs-count","block.temp/refs-count",-598132499),logseq.db.common.initial_data.get_block_refs_count(db,new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block)));
} else {
return G__59803__$1;
}
})();
var G__59806 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"block","block",664686210),block_SINGLEQUOTE___$1], null);
if(cljs.core.truth_(children_QMARK_)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__59806,new cljs.core.Keyword(null,"children","children",-940561982),children);
} else {
return G__59806;
}
}
} else {
return null;
}
});
logseq.db.common.initial_data.get_latest_journals = (function logseq$db$common$initial_data$get_latest_journals(db){
var today = logseq.common.util.date_time.date__GT_int((new Date()));
return cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (d){
var and__5000__auto__ = (new cljs.core.Keyword(null,"v","v",21465059).cljs$core$IFn$_invoke$arity$1(d) <= today);
if(and__5000__auto__){
var e = (function (){var G__59812 = db;
var G__59813 = new cljs.core.Keyword(null,"e","e",1381269198).cljs$core$IFn$_invoke$arity$1(d);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__59812,G__59813) : datascript.core.entity.call(null,G__59812,G__59813));
})();
if(cljs.core.truth_((function (){var and__5000__auto____$1 = logseq.db.common.entity_util.journal_QMARK_(e);
if(cljs.core.truth_(and__5000__auto____$1)){
return new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(e);
} else {
return and__5000__auto____$1;
}
})())){
return e;
} else {
return null;
}
} else {
return and__5000__auto__;
}
}),cljs.core.rseq(cljs.core.vec(datascript.core.datoms.cljs$core$IFn$_invoke$arity$3(db,new cljs.core.Keyword(null,"avet","avet",1383857032),new cljs.core.Keyword("block","journal-day","block/journal-day",-145748366)))));
});
logseq.db.common.initial_data.get_structured_datoms = (function logseq$db$common$initial_data$get_structured_datoms(db){
var class_property_id = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1((datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db,new cljs.core.Keyword("logseq.class","Property","logseq.class/Property",1038767048)) : datascript.core.entity.call(null,db,new cljs.core.Keyword("logseq.class","Property","logseq.class/Property",1038767048))));
return cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (d){
var block_datoms = datascript.core.datoms.cljs$core$IFn$_invoke$arity$3(db,new cljs.core.Keyword(null,"eavt","eavt",-666437073),new cljs.core.Keyword(null,"e","e",1381269198).cljs$core$IFn$_invoke$arity$1(d));
var properties_of_property_datoms = ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"v","v",21465059).cljs$core$IFn$_invoke$arity$1(d),class_property_id))?cljs.core.concat.cljs$core$IFn$_invoke$arity$2((function (){var temp__5804__auto__ = new cljs.core.Keyword("logseq.property","description","logseq.property/description",-336236200).cljs$core$IFn$_invoke$arity$1((function (){var G__59819 = db;
var G__59820 = new cljs.core.Keyword(null,"e","e",1381269198).cljs$core$IFn$_invoke$arity$1(d);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__59819,G__59820) : datascript.core.entity.call(null,G__59819,G__59820));
})());
if(cljs.core.truth_(temp__5804__auto__)){
var desc = temp__5804__auto__;
return datascript.core.datoms.cljs$core$IFn$_invoke$arity$3(db,new cljs.core.Keyword(null,"eavt","eavt",-666437073),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(desc));
} else {
return null;
}
})(),(function (){var temp__5804__auto__ = new cljs.core.Keyword("logseq.property","default-value","logseq.property/default-value",-892079662).cljs$core$IFn$_invoke$arity$1((function (){var G__59824 = db;
var G__59825 = new cljs.core.Keyword(null,"e","e",1381269198).cljs$core$IFn$_invoke$arity$1(d);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__59824,G__59825) : datascript.core.entity.call(null,G__59824,G__59825));
})());
if(cljs.core.truth_(temp__5804__auto__)){
var desc = temp__5804__auto__;
return datascript.core.datoms.cljs$core$IFn$_invoke$arity$3(db,new cljs.core.Keyword(null,"eavt","eavt",-666437073),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(desc));
} else {
return null;
}
})()):null);
if(cljs.core.seq(properties_of_property_datoms)){
return cljs.core.concat.cljs$core$IFn$_invoke$arity$2(block_datoms,properties_of_property_datoms);
} else {
return block_datoms;
}
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic(datascript.core.datoms.cljs$core$IFn$_invoke$arity$4(db,new cljs.core.Keyword(null,"avet","avet",1383857032),new cljs.core.Keyword("block","tags","block/tags",1814948340),new cljs.core.Keyword("logseq.class","Tag","logseq.class/Tag",-538902083)),datascript.core.datoms.cljs$core$IFn$_invoke$arity$4(db,new cljs.core.Keyword(null,"avet","avet",1383857032),new cljs.core.Keyword("block","tags","block/tags",1814948340),new cljs.core.Keyword("logseq.class","Property","logseq.class/Property",1038767048)),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([datascript.core.datoms.cljs$core$IFn$_invoke$arity$3(db,new cljs.core.Keyword(null,"avet","avet",1383857032),new cljs.core.Keyword("block","closed-value-property","block/closed-value-property",1157792813))], 0))], 0));
});
/**
 * Favorites page and its blocks
 */
logseq.db.common.initial_data.get_favorites = (function logseq$db$common$initial_data$get_favorites(db){
var page_id = logseq.db.common.initial_data.get_first_page_by_name(db,logseq.common.config.favorites_page_name);
var block = (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db,page_id) : datascript.core.entity.call(null,db,page_id));
var children = new cljs.core.Keyword("block","_page","block/_page",1150043350).cljs$core$IFn$_invoke$arity$1(block);
if(cljs.core.truth_(block)){
return cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic(datascript.core.datoms.cljs$core$IFn$_invoke$arity$3(db,new cljs.core.Keyword(null,"eavt","eavt",-666437073),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block)),cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (l){
return datascript.core.datoms.cljs$core$IFn$_invoke$arity$3(db,new cljs.core.Keyword(null,"eavt","eavt",-666437073),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(l));
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.keep.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","link","block/link",-1872399993),children)], 0)),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (child){
return datascript.core.datoms.cljs$core$IFn$_invoke$arity$3(db,new cljs.core.Keyword(null,"eavt","eavt",-666437073),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(child));
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([children], 0))], 0));
} else {
return null;
}
});
logseq.db.common.initial_data.get_views_data = (function logseq$db$common$initial_data$get_views_data(db){
var page_id = logseq.db.common.initial_data.get_first_page_by_name(db,logseq.common.config.views_page_name);
var children = (cljs.core.truth_(page_id)?new cljs.core.Keyword("block","_parent","block/_parent",-639389670).cljs$core$IFn$_invoke$arity$1((datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db,page_id) : datascript.core.entity.call(null,db,page_id))):null);
if(cljs.core.seq(children)){
return cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (b){
return datascript.core.datoms.cljs$core$IFn$_invoke$arity$3(db,new cljs.core.Keyword(null,"eavt","eavt",-666437073),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(b));
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([children], 0)),datascript.core.datoms.cljs$core$IFn$_invoke$arity$3(db,new cljs.core.Keyword(null,"eavt","eavt",-666437073),page_id));
} else {
return null;
}
});
logseq.db.common.initial_data.get_recent_updated_pages = (function logseq$db$common$initial_data$get_recent_updated_pages(db){
if(cljs.core.truth_(db)){
var G__59834 = datascript.core.datoms.cljs$core$IFn$_invoke$arity$3(db,new cljs.core.Keyword(null,"avet","avet",1383857032),new cljs.core.Keyword("block","updated-at","block/updated-at",-1516550551));
var G__59834__$1 = (((G__59834 == null))?null:cljs.core.rseq(G__59834));
var G__59834__$2 = (((G__59834__$1 == null))?null:cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (datom){
var e = (function (){var G__59837 = db;
var G__59838 = new cljs.core.Keyword(null,"e","e",1381269198).cljs$core$IFn$_invoke$arity$1(datom);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__59837,G__59838) : datascript.core.entity.call(null,G__59837,G__59838));
})();
if(cljs.core.truth_((function (){var and__5000__auto__ = logseq.db.common.entity_util.page_QMARK_(e);
if(cljs.core.truth_(and__5000__auto__)){
return (!(logseq.db.frontend.entity_util.hidden_QMARK_(e)));
} else {
return and__5000__auto__;
}
})())){
return e;
} else {
return null;
}
}),G__59834__$1));
if((G__59834__$2 == null)){
return null;
} else {
return cljs.core.take.cljs$core$IFn$_invoke$arity$2((30),G__59834__$2);
}
} else {
return null;
}
});
/**
 * Returns current database schema and initial data.
 * NOTE: This fn is called by DB and file graphs
 */
logseq.db.common.initial_data.get_initial_data = (function logseq$db$common$initial_data$get_initial_data(db){
var db_graph_QMARK_ = logseq.db.common.entity_plus.db_based_graph_QMARK_(db);
var _ = (cljs.core.truth_(db_graph_QMARK_)?cljs.core.reset_BANG_(logseq.db.common.order._STAR_max_key,logseq.db.common.order.get_max_order(db)):null);
var schema = new cljs.core.Keyword(null,"schema","schema",-1582001791).cljs$core$IFn$_invoke$arity$1(db);
var idents = cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (id){
var temp__5804__auto__ = (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db,id) : datascript.core.entity.call(null,db,id));
if(cljs.core.truth_(temp__5804__auto__)){
var e = temp__5804__auto__;
return datascript.core.datoms.cljs$core$IFn$_invoke$arity$3(db,new cljs.core.Keyword(null,"eavt","eavt",-666437073),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(e));
} else {
return null;
}
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentVector(null, 6, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("logseq.kv","db-type","logseq.kv/db-type",1106888767),new cljs.core.Keyword("logseq.kv","schema-version","logseq.kv/schema-version",-1467606676),new cljs.core.Keyword("logseq.kv","graph-uuid","logseq.kv/graph-uuid",339522676),new cljs.core.Keyword("logseq.kv","latest-code-lang","logseq.kv/latest-code-lang",-73570328),new cljs.core.Keyword("logseq.kv","graph-backup-folder","logseq.kv/graph-backup-folder",-1042314532),new cljs.core.Keyword("logseq.property","empty-placeholder","logseq.property/empty-placeholder",-1595021837)], null)], 0));
var favorites = (cljs.core.truth_(db_graph_QMARK_)?logseq.db.common.initial_data.get_favorites(db):null);
var views = (cljs.core.truth_(db_graph_QMARK_)?logseq.db.common.initial_data.get_views_data(db):null);
var all_files = logseq.db.common.initial_data.get_all_files(db);
var structured_datoms = (cljs.core.truth_(db_graph_QMARK_)?logseq.db.common.initial_data.get_structured_datoms(db):null);
var recent_updated_pages = (function (){var pages = logseq.db.common.initial_data.get_recent_updated_pages(db);
return cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (p){
return datascript.core.datoms.cljs$core$IFn$_invoke$arity$3(db,new cljs.core.Keyword(null,"eavt","eavt",-666437073),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(p));
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([pages], 0));
})();
var pages_datoms = (cljs.core.truth_(db_graph_QMARK_)?(function (){var contents_id = logseq.db.common.initial_data.get_first_page_by_title(db,"Contents");
var views_id = logseq.db.common.initial_data.get_first_page_by_title(db,logseq.common.config.views_page_name);
return cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (p1__59841_SHARP_){
return datascript.core.datoms.cljs$core$IFn$_invoke$arity$3(db,new cljs.core.Keyword(null,"eavt","eavt",-666437073),p1__59841_SHARP_);
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.remove.cljs$core$IFn$_invoke$arity$2(cljs.core.nil_QMARK_,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [contents_id,views_id], null))], 0));
})():cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (d){
return datascript.core.datoms.cljs$core$IFn$_invoke$arity$3(db,new cljs.core.Keyword(null,"eavt","eavt",-666437073),new cljs.core.Keyword(null,"e","e",1381269198).cljs$core$IFn$_invoke$arity$1(d));
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([datascript.core.datoms.cljs$core$IFn$_invoke$arity$3(db,new cljs.core.Keyword(null,"avet","avet",1383857032),new cljs.core.Keyword("block","name","block/name",1619760316))], 0)));
var data = cljs.core.distinct.cljs$core$IFn$_invoke$arity$1(cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic(idents,structured_datoms,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([favorites,recent_updated_pages,views,all_files,pages_datoms], 0)));
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"schema","schema",-1582001791),schema,new cljs.core.Keyword(null,"initial-data","initial-data",-1315709804),data], null);
});

//# sourceMappingURL=logseq.db.common.initial_data.js.map
