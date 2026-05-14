goog.provide('frontend.worker.export$');
frontend.worker.export$.safe_keywordize = (function frontend$worker$export$safe_keywordize(block){
return cljs.core.update.cljs$core$IFn$_invoke$arity$3(block,new cljs.core.Keyword("block","properties","block/properties",708347145),(function (properties){
if(cljs.core.seq(properties)){
return cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (p__130948){
var vec__130951 = p__130948;
var k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__130951,(0),null);
var _v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__130951,(1),null);
return logseq.graph_parser.property.valid_property_name_QMARK_(cljs.core.str.cljs$core$IFn$_invoke$arity$1(k));
}),properties));
} else {
return null;
}
}));
});
/**
 * Get all pages and their children blocks.
 */
frontend.worker.export$.get_all_pages = (function frontend$worker$export$get_all_pages(repo,db){
return cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p__130958){
var vec__130960 = p__130958;
var page = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__130960,(0),null);
var whiteboard_QMARK_ = (logseq.db.whiteboard_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.whiteboard_QMARK_.cljs$core$IFn$_invoke$arity$1(page) : logseq.db.whiteboard_QMARK_.call(null,page));
var blocks = logseq.db.get_page_blocks(db,new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(page));
var blocks_SINGLEQUOTE_ = (cljs.core.truth_(whiteboard_QMARK_)?blocks:cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (b){
var b_SINGLEQUOTE_ = ((cljs.core.seq(new cljs.core.Keyword("block","properties","block/properties",708347145).cljs$core$IFn$_invoke$arity$1(b)))?cljs.core.update.cljs$core$IFn$_invoke$arity$3(b,new cljs.core.Keyword("block","title","block/title",710445684),(function (content){
return logseq.graph_parser.property.remove_properties(cljs.core.get.cljs$core$IFn$_invoke$arity$3(b,new cljs.core.Keyword("block","format","block/format",-1212045901),new cljs.core.Keyword(null,"markdown","markdown",1227225089)),content);
})):b);
return frontend.worker.export$.safe_keywordize(b_SINGLEQUOTE_);
}),blocks));
var children = (cljs.core.truth_(whiteboard_QMARK_)?blocks_SINGLEQUOTE_:logseq.outliner.tree.blocks__GT_vec_tree(repo,db,blocks_SINGLEQUOTE_,new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(page)));
var page_SINGLEQUOTE_ = frontend.worker.export$.safe_keywordize(page);
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(page_SINGLEQUOTE_,new cljs.core.Keyword("block","children","block/children",-1040716209),children);
}),(function (){var G__130988 = new cljs.core.PersistentVector(null, 7, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"find","find",496279456),cljs.core.list(new cljs.core.Symbol(null,"pull","pull",779986722,null),new cljs.core.Symbol(null,"?b","?b",1575118075,null),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"*","*",345799209,null)], null)),new cljs.core.Keyword(null,"in","in",-1531184865),new cljs.core.Symbol(null,"$","$",-1580747756,null),new cljs.core.Keyword(null,"where","where",-2044795965),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?b","?b",1575118075,null),new cljs.core.Keyword("block","title","block/title",710445684)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?b","?b",1575118075,null),new cljs.core.Keyword("block","name","block/name",1619760316)], null)], null);
var G__130989 = db;
return (datascript.core.q.cljs$core$IFn$_invoke$arity$2 ? datascript.core.q.cljs$core$IFn$_invoke$arity$2(G__130988,G__130989) : datascript.core.q.call(null,G__130988,G__130989));
})());
});
frontend.worker.export$.get_all_page__GT_content = (function frontend$worker$export$get_all_page__GT_content(repo,db,options){
var filter_fn = (cljs.core.truth_((logseq.db.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(db) : logseq.db.db_based_graph_QMARK_.call(null,db)))?(function (ent){
return ((cljs.core.not(new cljs.core.Keyword("logseq.property","built-in?","logseq.property/built-in?",-1125958160).cljs$core$IFn$_invoke$arity$1(ent))) || (cljs.core.contains_QMARK_(logseq.db.sqlite.create_graph.built_in_pages_names,new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(ent))));
}):cljs.core.constantly(true));
return cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (e){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(e),frontend.common.file.core.block__GT_content(repo,db,new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(e),cljs.core.PersistentArrayMap.EMPTY,options)], null);
}),cljs.core.filter.cljs$core$IFn$_invoke$arity$2(filter_fn,cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__130993_SHARP_){
var G__131001 = db;
var G__131002 = new cljs.core.Keyword(null,"e","e",1381269198).cljs$core$IFn$_invoke$arity$1(p1__130993_SHARP_);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__131001,G__131002) : datascript.core.entity.call(null,G__131001,G__131002));
}),datascript.core.datoms.cljs$core$IFn$_invoke$arity$3(db,new cljs.core.Keyword(null,"avet","avet",1383857032),new cljs.core.Keyword("block","name","block/name",1619760316)))));
});
frontend.worker.export$.get_debug_datoms = (function frontend$worker$export$get_debug_datoms(conn,db){
var G__131005 = db.exec(({"sql": "select content from kvs", "rowMode": "array"}));
var G__131005__$1 = (((G__131005 == null))?null:cljs_bean.core.__GT_clj(G__131005));
var G__131005__$2 = (((G__131005__$1 == null))?null:cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (result){
var result__$1 = logseq.db.sqlite.util.transit_read(cljs.core.first(result));
if(cljs.core.map_QMARK_(result__$1)){
return new cljs.core.Keyword(null,"keys","keys",1068423698).cljs$core$IFn$_invoke$arity$1(result__$1);
} else {
return null;
}
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([G__131005__$1], 0)));
if((G__131005__$2 == null)){
return null;
} else {
return cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p__131012){
var vec__131013 = p__131012;
var e = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__131013,(0),null);
var a = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__131013,(1),null);
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__131013,(2),null);
var t = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__131013,(3),null);
if((function (){var and__5000__auto__ = cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("block","title","block/title",710445684),null,new cljs.core.Keyword("block","name","block/name",1619760316),null], null), null),a);
if(and__5000__auto__){
var entity = (function (){var G__131018 = cljs.core.deref(conn);
var G__131019 = e;
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__131018,G__131019) : datascript.core.entity.call(null,G__131018,G__131019));
})();
return ((cljs.core.not(new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(entity))) && (((cljs.core.not((logseq.db.journal_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.journal_QMARK_.cljs$core$IFn$_invoke$arity$1(entity) : logseq.db.journal_QMARK_.call(null,entity)))) && (((cljs.core.not(new cljs.core.Keyword("logseq.property","built-in?","logseq.property/built-in?",-1125958160).cljs$core$IFn$_invoke$arity$1(entity))) && ((!(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("logseq.property","query","logseq.property/query",-97414126),new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("logseq.property","created-from-property","logseq.property/created-from-property",-861892267).cljs$core$IFn$_invoke$arity$1(entity)))))))))));
} else {
return and__5000__auto__;
}
})()){
var G__131025 = e;
var G__131026 = a;
var G__131027 = ["debug ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(e)].join('');
var G__131028 = t;
return (datascript.core.datom.cljs$core$IFn$_invoke$arity$4 ? datascript.core.datom.cljs$core$IFn$_invoke$arity$4(G__131025,G__131026,G__131027,G__131028) : datascript.core.datom.call(null,G__131025,G__131026,G__131027,G__131028));
} else {
return (datascript.core.datom.cljs$core$IFn$_invoke$arity$4 ? datascript.core.datom.cljs$core$IFn$_invoke$arity$4(e,a,v,t) : datascript.core.datom.call(null,e,a,v,t));
}
}),G__131005__$2);
}
});

//# sourceMappingURL=frontend.worker.export.js.map
