goog.provide('frontend.worker.handler.page.db_based.page');
frontend.worker.handler.page.db_based.page.build_page_tx = (function frontend$worker$handler$page$db_based$page$build_page_tx(db,properties,page,p__129771){
var map__129772 = p__129771;
var map__129772__$1 = cljs.core.__destructure_map(map__129772);
var whiteboard_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__129772__$1,new cljs.core.Keyword(null,"whiteboard?","whiteboard?",-1968190788));
var class_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__129772__$1,new cljs.core.Keyword(null,"class?","class?",385834571));
var tags = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__129772__$1,new cljs.core.Keyword(null,"tags","tags",1771418977));
if(cljs.core.truth_(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(page))){
var type_tag = (cljs.core.truth_(class_QMARK_)?new cljs.core.Keyword("logseq.class","Tag","logseq.class/Tag",-538902083):(cljs.core.truth_(whiteboard_QMARK_)?new cljs.core.Keyword("logseq.class","Whiteboard","logseq.class/Whiteboard",1013698452):new cljs.core.Keyword("logseq.class","Page","logseq.class/Page",1484340329)
));
var tags_SINGLEQUOTE_ = (cljs.core.truth_(new cljs.core.Keyword("block","journal-day","block/journal-day",-145748366).cljs$core$IFn$_invoke$arity$1(page))?tags:cljs.core.conj.cljs$core$IFn$_invoke$arity$2(tags,type_tag));
var page_SINGLEQUOTE_ = cljs.core.update.cljs$core$IFn$_invoke$arity$4(page,new cljs.core.Keyword("block","tags","block/tags",1814948340),cljs.core.fnil.cljs$core$IFn$_invoke$arity$2(cljs.core.into,cljs.core.PersistentVector.EMPTY),cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (tag){
var v = ((cljs.core.uuid_QMARK_(tag))?(function (){var G__129773 = db;
var G__129774 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),tag], null);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__129773,G__129774) : datascript.core.entity.call(null,G__129773,G__129774));
})():tag);
if(datascript.impl.entity.entity_QMARK_(v)){
return new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(v);
} else {
if(cljs.core.map_QMARK_(v)){
if(cljs.core.truth_((function (){var G__129775 = db;
var G__129776 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(v)], null);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__129775,G__129776) : datascript.core.entity.call(null,G__129775,G__129776));
})())){
return v;
} else {
return logseq.db.frontend.class$.build_new_class(db,v);
}
} else {
return v;

}
}
}),tags_SINGLEQUOTE_));
var property_vals_tx_m = logseq.db.frontend.property.build.build_property_values_tx_m(page_SINGLEQUOTE_,cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (p__129777){
var vec__129778 = p__129777;
var k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__129778,(0),null);
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__129778,(1),null);
if(logseq.db.frontend.property.built_in_has_ref_value_QMARK_(k)){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [k,v], null);
} else {
return null;
}
}),properties)));
var G__129782 = (cljs.core.truth_(class_QMARK_)?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([logseq.db.frontend.class$.build_new_class(db,page_SINGLEQUOTE_),cljs.core.select_keys(page_SINGLEQUOTE_,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","ident","db/ident",-737096)], null))], 0)),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","retract","db/retract",-1549825231),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(page)], null),new cljs.core.Keyword("block","tags","block/tags",1814948340),new cljs.core.Keyword("logseq.class","Page","logseq.class/Page",1484340329)], null)], null):new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [page_SINGLEQUOTE_], null));
var G__129782__$1 = ((cljs.core.seq(property_vals_tx_m))?cljs.core.into.cljs$core$IFn$_invoke$arity$2(G__129782,cljs.core.vals(property_vals_tx_m)):G__129782);
return cljs.core.conj.cljs$core$IFn$_invoke$arity$2(G__129782__$1,cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(page)], null),properties,logseq.db.frontend.property.build.build_properties_with_ref_values(property_vals_tx_m)], 0)));

} else {
return null;
}
});
frontend.worker.handler.page.db_based.page.sanitize_title = (function frontend$worker$handler$page$db_based$page$sanitize_title(title){
var title__$1 = clojure.string.replace((function (){var G__129783 = clojure.string.trim(title);
return (logseq.graph_parser.text.page_ref_un_brackets_BANG_.cljs$core$IFn$_invoke$arity$1 ? logseq.graph_parser.text.page_ref_un_brackets_BANG_.cljs$core$IFn$_invoke$arity$1(G__129783) : logseq.graph_parser.text.page_ref_un_brackets_BANG_.call(null,G__129783));
})(),/^#+/,"");
var title__$2 = logseq.common.util.remove_boundary_slashes(title__$1);
return title__$2;
});
frontend.worker.handler.page.db_based.page.get_page_by_parent_name = (function frontend$worker$handler$page$db_based$page$get_page_by_parent_name(db,parent_title,child_title){
var G__129784 = (function (){var G__129785 = new cljs.core.PersistentVector(null, 10, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"find","find",496279456),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?b","?b",1575118075,null),new cljs.core.Symbol(null,"...","...",-1926939749,null)], null),new cljs.core.Keyword(null,"in","in",-1531184865),new cljs.core.Symbol(null,"$","$",-1580747756,null),new cljs.core.Symbol(null,"?parent-name","?parent-name",2146483276,null),new cljs.core.Symbol(null,"?child-name","?child-name",-436072934,null),new cljs.core.Keyword(null,"where","where",-2044795965),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?b","?b",1575118075,null),new cljs.core.Keyword("logseq.property","parent","logseq.property/parent",177984509),new cljs.core.Symbol(null,"?p","?p",-10896580,null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?b","?b",1575118075,null),new cljs.core.Keyword("block","name","block/name",1619760316),new cljs.core.Symbol(null,"?child-name","?child-name",-436072934,null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?p","?p",-10896580,null),new cljs.core.Keyword("block","name","block/name",1619760316),new cljs.core.Symbol(null,"?parent-name","?parent-name",2146483276,null)], null)], null);
var G__129786 = db;
var G__129787 = logseq.common.util.page_name_sanity_lc(parent_title);
var G__129788 = logseq.common.util.page_name_sanity_lc(child_title);
return (datascript.core.q.cljs$core$IFn$_invoke$arity$4 ? datascript.core.q.cljs$core$IFn$_invoke$arity$4(G__129785,G__129786,G__129787,G__129788) : datascript.core.q.call(null,G__129785,G__129786,G__129787,G__129788));
})();
var G__129784__$1 = (((G__129784 == null))?null:cljs.core.first(G__129784));
if((G__129784__$1 == null)){
return null;
} else {
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db,G__129784__$1) : datascript.core.entity.call(null,db,G__129784__$1));
}
});
frontend.worker.handler.page.db_based.page.split_namespace_pages = (function frontend$worker$handler$page$db_based$page$split_namespace_pages(db,page,date_formatter){
var map__129795 = page;
var map__129795__$1 = cljs.core.__destructure_map(map__129795);
var block_uuid = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__129795__$1,new cljs.core.Keyword("block","uuid","block/uuid",-1991494552));
var title = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__129795__$1,new cljs.core.Keyword("block","title","block/title",710445684));
return cljs.core.remove.cljs$core$IFn$_invoke$arity$2(cljs.core.nil_QMARK_,(cljs.core.truth_((function (){var and__5000__auto__ = (function (){var or__5002__auto__ = logseq.db.frontend.entity_util.class_QMARK_(page);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return logseq.db.frontend.entity_util.page_QMARK_(page);
}
})();
if(cljs.core.truth_(and__5000__auto__)){
return logseq.common.util.namespace.namespace_page_QMARK_(title);
} else {
return and__5000__auto__;
}
})())?(function (){var class_QMARK_ = logseq.db.frontend.entity_util.class_QMARK_(page);
var parts = cljs.core.remove.cljs$core$IFn$_invoke$arity$2(clojure.string.blank_QMARK_,cljs.core.map.cljs$core$IFn$_invoke$arity$2(clojure.string.trim,clojure.string.split.cljs$core$IFn$_invoke$arity$2(title,logseq.common.util.namespace.parent_re)));
var pages = cljs.core.doall.cljs$core$IFn$_invoke$arity$1(cljs.core.map_indexed.cljs$core$IFn$_invoke$arity$2((function (idx,part){
var last_part_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(idx,(cljs.core.count(parts) - (1)));
var page__$1 = (((idx === (0)))?logseq.db.get_page(db,part):frontend.worker.handler.page.db_based.page.get_page_by_parent_name(db,cljs.core.nth.cljs$core$IFn$_invoke$arity$2(parts,(idx - (1))),part));
var result = (function (){var or__5002__auto__ = page__$1;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return logseq.graph_parser.block.page_name__GT_map.cljs$core$IFn$_invoke$arity$variadic(part,db,true,date_formatter,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"page-uuid","page-uuid",1152600915),((last_part_QMARK_)?block_uuid:null),new cljs.core.Keyword(null,"skip-existing-page-check?","skip-existing-page-check?",1358622588),true,new cljs.core.Keyword(null,"class?","class?",385834571),class_QMARK_], null)], 0));
}
})();
return result;
}),parts));
if(((cljs.core.not(class_QMARK_)) && ((!(cljs.core.every_QMARK_(logseq.db.internal_page_QMARK_,pages)))))){
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2("Cannot create this page unless all parents are pages",new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"type","type",1174270348),new cljs.core.Keyword(null,"notification","notification",-222338233),new cljs.core.Keyword(null,"payload","payload",-383036092),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"message","message",-406056002),"Cannot create this page unless all parents are pages",new cljs.core.Keyword(null,"type","type",1174270348),new cljs.core.Keyword(null,"warning","warning",-1685650671)], null)], null));
} else {
if(cljs.core.truth_((function (){var and__5000__auto__ = class_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return (!(cljs.core.every_QMARK_(logseq.db.class_QMARK_,pages)));
} else {
return and__5000__auto__;
}
})())){
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2("Cannot create this tag unless all parents are tags",new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"type","type",1174270348),new cljs.core.Keyword(null,"notification","notification",-222338233),new cljs.core.Keyword(null,"payload","payload",-383036092),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"message","message",-406056002),"Cannot create this tag unless all parents are tags",new cljs.core.Keyword(null,"type","type",1174270348),new cljs.core.Keyword(null,"warning","warning",-1685650671)], null)], null));
} else {
return cljs.core.map_indexed.cljs$core$IFn$_invoke$arity$2((function (idx,page__$1){
var parent_eid = (((idx > (0)))?(function (){var temp__5804__auto__ = new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(cljs.core.nth.cljs$core$IFn$_invoke$arity$2(pages,(idx - (1))));
if(cljs.core.truth_(temp__5804__auto__)){
var id = temp__5804__auto__;
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),id], null);
} else {
return null;
}
})():null);
if(cljs.core.truth_(class_QMARK_)){
if(cljs.core.truth_((function (){var and__5000__auto__ = datascript.impl.entity.entity_QMARK_(page__$1);
if(and__5000__auto__){
return (logseq.db.class_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.class_QMARK_.cljs$core$IFn$_invoke$arity$1(page__$1) : logseq.db.class_QMARK_.call(null,page__$1));
} else {
return and__5000__auto__;
}
})())){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(page__$1,new cljs.core.Keyword("logseq.property","parent","logseq.property/parent",177984509),parent_eid);
} else {
if(datascript.impl.entity.entity_QMARK_(page__$1)){
return null;
} else {
if((idx === (0))){
return logseq.db.frontend.class$.build_new_class(db,page__$1);
} else {
return logseq.db.frontend.class$.build_new_class(db,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(page__$1,new cljs.core.Keyword("logseq.property","parent","logseq.property/parent",177984509),parent_eid));

}
}
}
} else {
if(((datascript.impl.entity.entity_QMARK_(page__$1)) || ((idx === (0))))){
return page__$1;
} else {
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(page__$1,new cljs.core.Keyword("logseq.property","parent","logseq.property/parent",177984509),parent_eid);
}
}
}),pages);

}
}
})():new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [page], null)));
});
/**
 * Pure function without side effects
 */
frontend.worker.handler.page.db_based.page.create = (function frontend$worker$handler$page$db_based$page$create(db,title_STAR_,p__129801){
var map__129802 = p__129801;
var map__129802__$1 = cljs.core.__destructure_map(map__129802);
var options = map__129802__$1;
var tags = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__129802__$1,new cljs.core.Keyword(null,"tags","tags",1771418977));
var properties = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__129802__$1,new cljs.core.Keyword(null,"properties","properties",685819552),null);
var uuid = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__129802__$1,new cljs.core.Keyword(null,"uuid","uuid",-2145095719),null);
var persist_op_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__129802__$1,new cljs.core.Keyword(null,"persist-op?","persist-op?",-531287534),true);
var whiteboard_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__129802__$1,new cljs.core.Keyword(null,"whiteboard?","whiteboard?",-1968190788));
var class_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__129802__$1,new cljs.core.Keyword(null,"class?","class?",385834571));
var today_journal_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__129802__$1,new cljs.core.Keyword(null,"today-journal?","today-journal?",-388258460));
var split_namespace_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__129802__$1,new cljs.core.Keyword(null,"split-namespace?","split-namespace?",-1035468161));
var date_formatter = new cljs.core.Keyword("logseq.property.journal","title-format","logseq.property.journal/title-format",-1536497954).cljs$core$IFn$_invoke$arity$1(logseq.db.common.entity_plus.entity_memoized(db,new cljs.core.Keyword("logseq.class","Journal","logseq.class/Journal",1979741081)));
var title = frontend.worker.handler.page.db_based.page.sanitize_title(title_STAR_);
var types = (cljs.core.truth_(class_QMARK_)?new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("logseq.class","Tag","logseq.class/Tag",-538902083),null], null), null):(cljs.core.truth_(whiteboard_QMARK_)?new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("logseq.class","Whiteboard","logseq.class/Whiteboard",1013698452),null], null), null):(cljs.core.truth_(today_journal_QMARK_)?new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("logseq.class","Journal","logseq.class/Journal",1979741081),null], null), null):((cljs.core.seq(tags))?cljs.core.set(cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","ident","db/ident",-737096),tags)):new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("logseq.class","Page","logseq.class/Page",1484340329),null], null), null)
))));
var existing_page_id = cljs.core.first(logseq.db.page_exists_QMARK_(db,title,types));
if(cljs.core.truth_(existing_page_id)){
var existing_page = (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db,existing_page_id) : datascript.core.entity.call(null,db,existing_page_id));
var tx_meta = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"persist-op?","persist-op?",-531287534),persist_op_QMARK_,new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"save-block","save-block",591532560)], null);
if(cljs.core.truth_((function (){var and__5000__auto__ = class_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
var and__5000__auto____$1 = cljs.core.not((logseq.db.class_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.class_QMARK_.cljs$core$IFn$_invoke$arity$1(existing_page) : logseq.db.class_QMARK_.call(null,existing_page)));
if(and__5000__auto____$1){
var or__5002__auto__ = (logseq.db.property_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.property_QMARK_.cljs$core$IFn$_invoke$arity$1(existing_page) : logseq.db.property_QMARK_.call(null,existing_page));
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return (logseq.db.internal_page_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.internal_page_QMARK_.cljs$core$IFn$_invoke$arity$1(existing_page) : logseq.db.internal_page_QMARK_.call(null,existing_page));
}
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})())){
var tx_data = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([logseq.db.frontend.class$.build_new_class(db,cljs.core.select_keys(existing_page,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","title","block/title",710445684),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Keyword("block","created-at","block/created-at",1440015)], null))),cljs.core.select_keys(existing_page,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","ident","db/ident",-737096)], null))], 0)),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","retract","db/retract",-1549825231),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(existing_page)], null),new cljs.core.Keyword("block","tags","block/tags",1814948340),new cljs.core.Keyword("logseq.class","Page","logseq.class/Page",1484340329)], null)], null);
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"tx-meta","tx-meta",1159283194),tx_meta,new cljs.core.Keyword(null,"tx-data","tx-data",934159761),tx_data], null);
} else {
return null;
}
} else {
var page = logseq.graph_parser.block.page_name__GT_map.cljs$core$IFn$_invoke$arity$variadic(title,db,true,date_formatter,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"class?","class?",385834571),class_QMARK_,new cljs.core.Keyword(null,"page-uuid","page-uuid",1152600915),((cljs.core.uuid_QMARK_(uuid))?uuid:null),new cljs.core.Keyword(null,"skip-existing-page-check?","skip-existing-page-check?",1358622588),true], null)], 0));
var vec__129803 = (cljs.core.truth_((function (){var and__5000__auto__ = (logseq.graph_parser.text.namespace_page_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.graph_parser.text.namespace_page_QMARK_.cljs$core$IFn$_invoke$arity$1(title) : logseq.graph_parser.text.namespace_page_QMARK_.call(null,title));
if(cljs.core.truth_(and__5000__auto__)){
return split_namespace_QMARK_;
} else {
return and__5000__auto__;
}
})())?(function (){var pages = frontend.worker.handler.page.db_based.page.split_namespace_pages(db,page,date_formatter);
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.last(pages),cljs.core.butlast(pages)], null);
})():new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [page,null], null));
var page__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__129803,(0),null);
var parents = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__129803,(1),null);
if(cljs.core.truth_((function (){var and__5000__auto__ = page__$1;
if(cljs.core.truth_(and__5000__auto__)){
return (((new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(page__$1) == null)) || ((!(logseq.db.frontend.malli_schema.internal_ident_QMARK_(new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(page__$1))))));
} else {
return and__5000__auto__;
}
})())){
if(((cljs.core.contains_QMARK_(types,new cljs.core.Keyword("logseq.class","Journal","logseq.class/Journal",1979741081))) || (cljs.core.contains_QMARK_(cljs.core.set(new cljs.core.Keyword("block","tags","block/tags",1814948340).cljs$core$IFn$_invoke$arity$1(page__$1)),new cljs.core.Keyword("logseq.class","Journal","logseq.class/Journal",1979741081))))){
} else {
logseq.outliner.validate.validate_page_title_characters(cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(page__$1)),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"node","node",581201198),page__$1], null));

var seq__129806_129831 = cljs.core.seq(parents);
var chunk__129807_129832 = null;
var count__129808_129833 = (0);
var i__129809_129834 = (0);
while(true){
if((i__129809_129834 < count__129808_129833)){
var parent_129835 = chunk__129807_129832.cljs$core$IIndexed$_nth$arity$2(null,i__129809_129834);
logseq.outliner.validate.validate_page_title_characters(cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(parent_129835)),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"node","node",581201198),parent_129835], null));


var G__129836 = seq__129806_129831;
var G__129837 = chunk__129807_129832;
var G__129838 = count__129808_129833;
var G__129839 = (i__129809_129834 + (1));
seq__129806_129831 = G__129836;
chunk__129807_129832 = G__129837;
count__129808_129833 = G__129838;
i__129809_129834 = G__129839;
continue;
} else {
var temp__5804__auto___129840 = cljs.core.seq(seq__129806_129831);
if(temp__5804__auto___129840){
var seq__129806_129841__$1 = temp__5804__auto___129840;
if(cljs.core.chunked_seq_QMARK_(seq__129806_129841__$1)){
var c__5525__auto___129842 = cljs.core.chunk_first(seq__129806_129841__$1);
var G__129843 = cljs.core.chunk_rest(seq__129806_129841__$1);
var G__129844 = c__5525__auto___129842;
var G__129845 = cljs.core.count(c__5525__auto___129842);
var G__129846 = (0);
seq__129806_129831 = G__129843;
chunk__129807_129832 = G__129844;
count__129808_129833 = G__129845;
i__129809_129834 = G__129846;
continue;
} else {
var parent_129847 = cljs.core.first(seq__129806_129841__$1);
logseq.outliner.validate.validate_page_title_characters(cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(parent_129847)),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"node","node",581201198),parent_129847], null));


var G__129848 = cljs.core.next(seq__129806_129841__$1);
var G__129849 = null;
var G__129850 = (0);
var G__129851 = (0);
seq__129806_129831 = G__129848;
chunk__129807_129832 = G__129849;
count__129808_129833 = G__129850;
i__129809_129834 = G__129851;
continue;
}
} else {
}
}
break;
}
}

var page_uuid = new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(page__$1);
var page_txs = frontend.worker.handler.page.db_based.page.build_page_tx(db,properties,page__$1,cljs.core.select_keys(options,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"whiteboard?","whiteboard?",-1968190788),new cljs.core.Keyword(null,"class?","class?",385834571),new cljs.core.Keyword(null,"tags","tags",1771418977)], null)));
var txs = cljs.core.concat.cljs$core$IFn$_invoke$arity$2(cljs.core.remove.cljs$core$IFn$_invoke$arity$2(datascript.impl.entity.entity_QMARK_,parents),page_txs);
var tx_meta = (function (){var G__129811 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"persist-op?","persist-op?",-531287534),persist_op_QMARK_,new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"create-page","create-page",-1352656443)], null);
if(cljs.core.truth_(today_journal_QMARK_)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(G__129811,new cljs.core.Keyword(null,"create-today-journal?","create-today-journal?",136893930),true,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"today-journal-name","today-journal-name",1965349294),title], 0));
} else {
return G__129811;
}
})();
return new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"tx-meta","tx-meta",1159283194),tx_meta,new cljs.core.Keyword(null,"tx-data","tx-data",934159761),txs,new cljs.core.Keyword(null,"title","title",636505583),title,new cljs.core.Keyword(null,"page-uuid","page-uuid",1152600915),page_uuid], null);
} else {
return null;
}
}
});
frontend.worker.handler.page.db_based.page.create_BANG_ = (function frontend$worker$handler$page$db_based$page$create_BANG_(conn,title,opts){
var map__129815 = frontend.worker.handler.page.db_based.page.create(cljs.core.deref(conn),title,opts);
var map__129815__$1 = cljs.core.__destructure_map(map__129815);
var tx_meta = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__129815__$1,new cljs.core.Keyword(null,"tx-meta","tx-meta",1159283194));
var tx_data = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__129815__$1,new cljs.core.Keyword(null,"tx-data","tx-data",934159761));
var title__$1 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__129815__$1,new cljs.core.Keyword(null,"title","title",636505583));
var page_uuid = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__129815__$1,new cljs.core.Keyword(null,"page-uuid","page-uuid",1152600915));
if(cljs.core.seq(tx_data)){
(datascript.core.transact_BANG_.cljs$core$IFn$_invoke$arity$3 ? datascript.core.transact_BANG_.cljs$core$IFn$_invoke$arity$3(conn,tx_data,tx_meta) : datascript.core.transact_BANG_.call(null,conn,tx_data,tx_meta));

return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [title__$1,page_uuid], null);
} else {
return null;
}
});

//# sourceMappingURL=frontend.worker.handler.page.db_based.page.js.map
