goog.provide('logseq.graph_parser.exporter');
/**
 * Add updated-at or created-at timestamps if they doesn't exist
 */
logseq.graph_parser.exporter.add_missing_timestamps = (function logseq$graph_parser$exporter$add_missing_timestamps(block){
var updated_at = logseq.common.util.time_ms();
var block__$1 = (function (){var G__130486 = block;
var G__130486__$1 = (((new cljs.core.Keyword("block","updated-at","block/updated-at",-1516550551).cljs$core$IFn$_invoke$arity$1(block) == null))?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__130486,new cljs.core.Keyword("block","updated-at","block/updated-at",-1516550551),updated_at):G__130486);
if((new cljs.core.Keyword("block","created-at","block/created-at",1440015).cljs$core$IFn$_invoke$arity$1(block) == null)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__130486__$1,new cljs.core.Keyword("block","created-at","block/created-at",1440015),updated_at);
} else {
return G__130486__$1;
}
})();
return block__$1;
});
logseq.graph_parser.exporter.build_new_namespace_page = (function logseq$graph_parser$exporter$build_new_namespace_page(block){
var new_title = logseq.common.util.namespace.get_last_part(new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(block));
return cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([block,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("block","title","block/title",710445684),new_title,new cljs.core.Keyword("block","name","block/name",1619760316),logseq.common.util.page_name_sanity_lc(new_title)], null)], 0));
});
logseq.graph_parser.exporter.get_page_uuid = (function logseq$graph_parser$exporter$get_page_uuid(page_names_to_uuids,page_name,ex_data_SINGLEQUOTE_){
var or__5002__auto__ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(page_names_to_uuids),(function (){var G__130507 = ((clojure.string.includes_QMARK_(cljs.core.str.cljs$core$IFn$_invoke$arity$1(page_name),"#"))?clojure.string.lower_case(logseq.graph_parser.block.sanitize_hashtag_name(page_name)):page_name);
if((G__130507 == null)){
return null;
} else {
return clojure.string.trimr(G__130507);
}
})());
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2(["No uuid found for page name ",cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([page_name], 0))].join(''),cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([ex_data_SINGLEQUOTE_,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"page-name","page-name",974981762),page_name,new cljs.core.Keyword(null,"page-names","page-names",-802013696),cljs.core.sort.cljs$core$IFn$_invoke$arity$1(cljs.core.keys(cljs.core.deref(page_names_to_uuids)))], null)], 0)));
}
});
logseq.graph_parser.exporter.replace_namespace_with_parent = (function logseq$graph_parser$exporter$replace_namespace_with_parent(block,page_names_to_uuids){
if(cljs.core.truth_(new cljs.core.Keyword("block","namespace","block/namespace",-282500695).cljs$core$IFn$_invoke$arity$1(block))){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(block,new cljs.core.Keyword("block","namespace","block/namespace",-282500695)),new cljs.core.Keyword("logseq.property","parent","logseq.property/parent",177984509),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),logseq.graph_parser.exporter.get_page_uuid(page_names_to_uuids,cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(block,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","namespace","block/namespace",-282500695),new cljs.core.Keyword("block","name","block/name",1619760316)], null)),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"block","block",664686210),block,new cljs.core.Keyword("block","namespace","block/namespace",-282500695),new cljs.core.Keyword("block","namespace","block/namespace",-282500695).cljs$core$IFn$_invoke$arity$1(block)], null))], null));
} else {
return block;
}
});
logseq.graph_parser.exporter.build_class_ident_name = (function logseq$graph_parser$exporter$build_class_ident_name(class_name){
return clojure.string.replace(class_name,"/","___");
});
logseq.graph_parser.exporter.find_or_create_class = (function logseq$graph_parser$exporter$find_or_create_class(var_args){
var G__130535 = arguments.length;
switch (G__130535) {
case 3:
return logseq.graph_parser.exporter.find_or_create_class.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
case 4:
return logseq.graph_parser.exporter.find_or_create_class.cljs$core$IFn$_invoke$arity$4((arguments[(0)]),(arguments[(1)]),(arguments[(2)]),(arguments[(3)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(logseq.graph_parser.exporter.find_or_create_class.cljs$core$IFn$_invoke$arity$3 = (function (db,class_name,all_idents){
return logseq.graph_parser.exporter.find_or_create_class.cljs$core$IFn$_invoke$arity$4(db,class_name,all_idents,cljs.core.PersistentArrayMap.EMPTY);
}));

(logseq.graph_parser.exporter.find_or_create_class.cljs$core$IFn$_invoke$arity$4 = (function (db,class_name,all_idents,class_block){
var ident = cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(class_name);
var temp__5802__auto__ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(all_idents),ident);
if(cljs.core.truth_(temp__5802__auto__)){
var db_ident = temp__5802__auto__;
return new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("db","ident","db/ident",-737096),db_ident], null);
} else {
var m = (cljs.core.truth_(new cljs.core.Keyword("block","namespace","block/namespace",-282500695).cljs$core$IFn$_invoke$arity$1(class_block))?logseq.graph_parser.exporter.build_new_namespace_page(cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([logseq.db.frontend.class$.build_new_class(db,cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("block","title","block/title",710445684),logseq.graph_parser.exporter.build_class_ident_name(class_name)], null),cljs.core.select_keys(class_block,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","tags","block/tags",1814948340)], null))], 0))),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("block","title","block/title",710445684),class_name,new cljs.core.Keyword("block","name","block/name",1619760316),logseq.common.util.page_name_sanity_lc(class_name)], null)], 0))):logseq.db.frontend.class$.build_new_class(db,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("block","title","block/title",710445684),class_name,new cljs.core.Keyword("block","name","block/name",1619760316),logseq.common.util.page_name_sanity_lc(class_name)], null),new cljs.core.Keyword("block","tags","block/tags",1814948340),new cljs.core.Keyword("block","tags","block/tags",1814948340).cljs$core$IFn$_invoke$arity$1(class_block))));
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(all_idents,cljs.core.assoc,ident,new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(m));

return cljs.core.with_meta(m,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"new-class?","new-class?",1140916821),true], null));
}
}));

(logseq.graph_parser.exporter.find_or_create_class.cljs$lang$maxFixedArity = 4);

logseq.graph_parser.exporter.find_or_gen_class_uuid = (function logseq$graph_parser$exporter$find_or_gen_class_uuid(var_args){
var args__5732__auto__ = [];
var len__5726__auto___131999 = arguments.length;
var i__5727__auto___132000 = (0);
while(true){
if((i__5727__auto___132000 < len__5726__auto___131999)){
args__5732__auto__.push((arguments[i__5727__auto___132000]));

var G__132001 = (i__5727__auto___132000 + (1));
i__5727__auto___132000 = G__132001;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((3) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((3)),(0),null)):null);
return logseq.graph_parser.exporter.find_or_gen_class_uuid.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),(arguments[(1)]),(arguments[(2)]),argseq__5733__auto__);
});

(logseq.graph_parser.exporter.find_or_gen_class_uuid.cljs$core$IFn$_invoke$arity$variadic = (function (page_names_to_uuids,page_name,db_ident,p__130568){
var map__130569 = p__130568;
var map__130569__$1 = cljs.core.__destructure_map(map__130569);
var temp_new_class_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__130569__$1,new cljs.core.Keyword(null,"temp-new-class?","temp-new-class?",-1690331086));
var or__5002__auto__ = (cljs.core.truth_(temp_new_class_QMARK_)?(function (){var or__5002__auto__ = cljs.core.some((function (p1__130554_SHARP_){
if(clojure.string.ends_with_QMARK_(cljs.core.key(p1__130554_SHARP_),[logseq.common.util.namespace.parent_char,cljs.core.str.cljs$core$IFn$_invoke$arity$1(page_name)].join(''))){
return cljs.core.val(p1__130554_SHARP_);
} else {
return null;
}
}),cljs.core.deref(page_names_to_uuids));
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.get.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(page_names_to_uuids),page_name);
}
})():cljs.core.get.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(page_names_to_uuids),page_name));
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var new_uuid = logseq.common.uuid.gen_uuid.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"db-ident-block-uuid","db-ident-block-uuid",-2020167291),db_ident);
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(page_names_to_uuids,cljs.core.assoc,page_name,new_uuid);

return new_uuid;
}
}));

(logseq.graph_parser.exporter.find_or_gen_class_uuid.cljs$lang$maxFixedArity = (3));

/** @this {Function} */
(logseq.graph_parser.exporter.find_or_gen_class_uuid.cljs$lang$applyTo = (function (seq130559){
var G__130560 = cljs.core.first(seq130559);
var seq130559__$1 = cljs.core.next(seq130559);
var G__130561 = cljs.core.first(seq130559__$1);
var seq130559__$2 = cljs.core.next(seq130559__$1);
var G__130562 = cljs.core.first(seq130559__$2);
var seq130559__$3 = cljs.core.next(seq130559__$2);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__130560,G__130561,G__130562,seq130559__$3);
}));

logseq.graph_parser.exporter.convert_tag_QMARK_ = (function logseq$graph_parser$exporter$convert_tag_QMARK_(tag_name,p__130581){
var map__130582 = p__130581;
var map__130582__$1 = cljs.core.__destructure_map(map__130582);
var convert_all_tags_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__130582__$1,new cljs.core.Keyword(null,"convert-all-tags?","convert-all-tags?",-1869310481));
var tag_classes = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__130582__$1,new cljs.core.Keyword(null,"tag-classes","tag-classes",835362327));
var and__5000__auto__ = (function (){var or__5002__auto__ = convert_all_tags_QMARK_;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return ((cljs.core.contains_QMARK_(tag_classes,tag_name)) || (cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 1, ["card",null], null), null),tag_name)));
}
})();
if(cljs.core.truth_(and__5000__auto__)){
return (!(cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 1, ["tags",null], null), null),tag_name)));
} else {
return and__5000__auto__;
}
});
/**
 * Finds a class entity by unique name and parents and returns its :block/uuid if found.
 *   db is searched because there is no in-memory index only for created classes by unique name
 */
logseq.graph_parser.exporter.find_existing_class = (function logseq$graph_parser$exporter$find_existing_class(db,p__130601){
var map__130602 = p__130601;
var map__130602__$1 = cljs.core.__destructure_map(map__130602);
var full_name = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__130602__$1,new cljs.core.Keyword("block","name","block/name",1619760316));
var block_ns = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__130602__$1,new cljs.core.Keyword("block","namespace","block/namespace",-282500695));
if(cljs.core.truth_(block_ns)){
return cljs.core.some((function (p1__130595_SHARP_){
var parents = cljs.core.vec(cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (e){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("logseq.class","Root","logseq.class/Root",273783827),new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(e));
}),(logseq.db.get_page_parents.cljs$core$IFn$_invoke$arity$1 ? logseq.db.get_page_parents.cljs$core$IFn$_invoke$arity$1(p1__130595_SHARP_) : logseq.db.get_page_parents.call(null,p1__130595_SHARP_))));
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(full_name,clojure.string.join.cljs$core$IFn$_invoke$arity$2(logseq.common.util.namespace.namespace_char,cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","name","block/name",1619760316),cljs.core.conj.cljs$core$IFn$_invoke$arity$2(parents,p1__130595_SHARP_))))){
return new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(p1__130595_SHARP_);
} else {
return null;
}
}),cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__130594_SHARP_){
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db,p1__130594_SHARP_) : datascript.core.entity.call(null,db,p1__130594_SHARP_));
}),(function (){var G__130609 = new cljs.core.PersistentVector(null, 9, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"find","find",496279456),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?b","?b",1575118075,null),new cljs.core.Symbol(null,"...","...",-1926939749,null)], null),new cljs.core.Keyword(null,"in","in",-1531184865),new cljs.core.Symbol(null,"$","$",-1580747756,null),new cljs.core.Symbol(null,"?name","?name",2050703390,null),new cljs.core.Keyword(null,"where","where",-2044795965),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?b","?b",1575118075,null),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Symbol(null,"?uuid","?uuid",-396116544,null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?b","?b",1575118075,null),new cljs.core.Keyword("block","tags","block/tags",1814948340),new cljs.core.Keyword("logseq.class","Tag","logseq.class/Tag",-538902083)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?b","?b",1575118075,null),new cljs.core.Keyword("block","name","block/name",1619760316),new cljs.core.Symbol(null,"?name","?name",2050703390,null)], null)], null);
var G__130610 = db;
var G__130611 = logseq.common.util.namespace.get_last_part(full_name);
return (datascript.core.q.cljs$core$IFn$_invoke$arity$3 ? datascript.core.q.cljs$core$IFn$_invoke$arity$3(G__130609,G__130610,G__130611) : datascript.core.q.call(null,G__130609,G__130610,G__130611));
})()));
} else {
return cljs.core.first((function (){var G__130614 = new cljs.core.PersistentVector(null, 9, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"find","find",496279456),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?uuid","?uuid",-396116544,null),new cljs.core.Symbol(null,"...","...",-1926939749,null)], null),new cljs.core.Keyword(null,"in","in",-1531184865),new cljs.core.Symbol(null,"$","$",-1580747756,null),new cljs.core.Symbol(null,"?name","?name",2050703390,null),new cljs.core.Keyword(null,"where","where",-2044795965),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?b","?b",1575118075,null),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Symbol(null,"?uuid","?uuid",-396116544,null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?b","?b",1575118075,null),new cljs.core.Keyword("block","tags","block/tags",1814948340),new cljs.core.Keyword("logseq.class","Tag","logseq.class/Tag",-538902083)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?b","?b",1575118075,null),new cljs.core.Keyword("block","name","block/name",1619760316),new cljs.core.Symbol(null,"?name","?name",2050703390,null)], null)], null);
var G__130615 = db;
var G__130616 = full_name;
return (datascript.core.q.cljs$core$IFn$_invoke$arity$3 ? datascript.core.q.cljs$core$IFn$_invoke$arity$3(G__130614,G__130615,G__130616) : datascript.core.q.call(null,G__130614,G__130615,G__130616));
})());
}
});
/**
 * Converts a tag block with class or returns nil if this tag should be removed
 * because it has been moved
 */
logseq.graph_parser.exporter.convert_tag_to_class = (function logseq$graph_parser$exporter$convert_tag_to_class(db,tag_block,p__130627,user_options,all_idents){
var map__130628 = p__130627;
var map__130628__$1 = cljs.core.__destructure_map(map__130628);
var page_names_to_uuids = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__130628__$1,new cljs.core.Keyword(null,"page-names-to-uuids","page-names-to-uuids",-875423247));
var classes_tx = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__130628__$1,new cljs.core.Keyword(null,"classes-tx","classes-tx",664490242));
var temp__5802__auto__ = new cljs.core.Keyword("block.temp","new-class","block.temp/new-class",348616617).cljs$core$IFn$_invoke$arity$1(tag_block);
if(cljs.core.truth_(temp__5802__auto__)){
var new_class = temp__5802__auto__;
var class_m = logseq.graph_parser.exporter.find_or_create_class.cljs$core$IFn$_invoke$arity$3(db,new_class,all_idents);
var class_m_SINGLEQUOTE_ = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([class_m,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),logseq.graph_parser.exporter.find_or_gen_class_uuid.cljs$core$IFn$_invoke$arity$variadic(page_names_to_uuids,logseq.common.util.page_name_sanity_lc(new_class),new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(class_m),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"temp-new-class?","temp-new-class?",-1690331086),true], null)], 0))], null)], 0));
if(cljs.core.truth_(new cljs.core.Keyword(null,"new-class?","new-class?",1140916821).cljs$core$IFn$_invoke$arity$1(cljs.core.meta(class_m)))){
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$3(classes_tx,cljs.core.conj,class_m_SINGLEQUOTE_);
} else {
}

if(cljs.core.truth_(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(class_m_SINGLEQUOTE_))){
} else {
throw (new Error(["Assert failed: ","Class must have a :block/uuid","\n","(:block/uuid class-m')"].join('')));
}

return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(class_m_SINGLEQUOTE_)], null);
} else {
if(cljs.core.truth_(logseq.graph_parser.exporter.convert_tag_QMARK_(new cljs.core.Keyword("block","name","block/name",1619760316).cljs$core$IFn$_invoke$arity$1(tag_block),user_options))){
var existing_tag_uuid = logseq.graph_parser.exporter.find_existing_class(db,tag_block);
var internal_tag_conflict_QMARK_ = cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 5, ["asset",null,"tag",null,"property",null,"page",null,"journal",null], null), null),new cljs.core.Keyword("block","name","block/name",1619760316).cljs$core$IFn$_invoke$arity$1(tag_block));
if(cljs.core.truth_((function (){var and__5000__auto__ = existing_tag_uuid;
if(cljs.core.truth_(and__5000__auto__)){
return (!(internal_tag_conflict_QMARK_));
} else {
return and__5000__auto__;
}
})())){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),existing_tag_uuid], null);
} else {
var class_m = logseq.graph_parser.exporter.find_or_create_class.cljs$core$IFn$_invoke$arity$4(db,new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(tag_block),all_idents,tag_block);
var class_m_SINGLEQUOTE_ = logseq.graph_parser.exporter.replace_namespace_with_parent(cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.dissoc.cljs$core$IFn$_invoke$arity$variadic(cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([tag_block,class_m,((internal_tag_conflict_QMARK_)?new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),logseq.common.uuid.gen_uuid.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"db-ident-block-uuid","db-ident-block-uuid",-2020167291),new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(class_m))], null):(cljs.core.truth_(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(tag_block))?null:(function (){var id = logseq.graph_parser.exporter.find_or_gen_class_uuid(page_names_to_uuids,new cljs.core.Keyword("block","name","block/name",1619760316).cljs$core$IFn$_invoke$arity$1(tag_block),new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(class_m));
return new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),id], null);
})()))], 0)),new cljs.core.Keyword("block","created-at","block/created-at",1440015),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("block","updated-at","block/updated-at",-1516550551)], 0)),logseq.graph_parser.exporter.add_missing_timestamps(cljs.core.select_keys(tag_block,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","created-at","block/created-at",1440015),new cljs.core.Keyword("block","updated-at","block/updated-at",-1516550551)], null)))], 0)),page_names_to_uuids);
if(cljs.core.truth_(new cljs.core.Keyword(null,"new-class?","new-class?",1140916821).cljs$core$IFn$_invoke$arity$1(cljs.core.meta(class_m)))){
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$3(classes_tx,cljs.core.conj,class_m_SINGLEQUOTE_);
} else {
}

if(cljs.core.truth_(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(class_m_SINGLEQUOTE_))){
} else {
throw (new Error(["Assert failed: ","Class must have a :block/uuid","\n","(:block/uuid class-m')"].join('')));
}

return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(class_m_SINGLEQUOTE_)], null);

}
} else {
return null;
}
}
});
logseq.graph_parser.exporter.logseq_class_ident_QMARK_ = (function logseq$graph_parser$exporter$logseq_class_ident_QMARK_(k){
return ((cljs.core.qualified_keyword_QMARK_(k)) && (logseq.db.frontend.class$.logseq_class_QMARK_(k)));
});
/**
 * Handles converting tags to classes and any post processing of it e.g.
 *   cleaning :block/tags when a block is tagged with a namespace page
 */
logseq.graph_parser.exporter.convert_tags_to_classes = (function logseq$graph_parser$exporter$convert_tags_to_classes(tags,db,per_file_state,user_options,all_idents){
var tags_SINGLEQUOTE_ = cljs.core.vec(cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (p1__130642_SHARP_){
if(logseq.graph_parser.exporter.logseq_class_ident_QMARK_(p1__130642_SHARP_)){
return p1__130642_SHARP_;
} else {
return logseq.graph_parser.exporter.convert_tag_to_class(db,p1__130642_SHARP_,per_file_state,user_options,all_idents);
}
}),tags));
var temp__5802__auto__ = (function (){var and__5000__auto__ = cljs.core.some(new cljs.core.Keyword("block","namespace","block/namespace",-282500695),tags);
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.first(tags_SINGLEQUOTE_);
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5802__auto__)){
var child_tag = temp__5802__auto__;
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [child_tag], null);
} else {
return tags_SINGLEQUOTE_;
}
});
logseq.graph_parser.exporter.update_page_tags = (function logseq$graph_parser$exporter$update_page_tags(block,db,user_options,per_file_state,all_idents){
if(cljs.core.seq(new cljs.core.Keyword("block","tags","block/tags",1814948340).cljs$core$IFn$_invoke$arity$1(block))){
var page_tags = cljs.core.set(cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__130678_SHARP_){
return (new cljs.core.PersistentVector(null,2,(5),cljs.core.PersistentVector.EMPTY_NODE,[new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),logseq.graph_parser.exporter.get_page_uuid(new cljs.core.Keyword(null,"page-names-to-uuids","page-names-to-uuids",-875423247).cljs$core$IFn$_invoke$arity$1(per_file_state),new cljs.core.Keyword("block","name","block/name",1619760316).cljs$core$IFn$_invoke$arity$1(p1__130678_SHARP_),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"block","block",664686210),p1__130678_SHARP_], null))],null));
}),cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (p1__130677_SHARP_){
var or__5002__auto__ = new cljs.core.Keyword("block.temp","new-class","block.temp/new-class",348616617).cljs$core$IFn$_invoke$arity$1(p1__130677_SHARP_);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = logseq.graph_parser.exporter.convert_tag_QMARK_(new cljs.core.Keyword("block","name","block/name",1619760316).cljs$core$IFn$_invoke$arity$1(p1__130677_SHARP_),user_options);
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
return logseq.graph_parser.exporter.logseq_class_ident_QMARK_(p1__130677_SHARP_);
}
}
}),new cljs.core.Keyword("block","tags","block/tags",1814948340).cljs$core$IFn$_invoke$arity$1(block))));
var G__130707 = block;
var G__130707__$1 = cljs.core.update.cljs$core$IFn$_invoke$arity$variadic(G__130707,new cljs.core.Keyword("block","tags","block/tags",1814948340),logseq.graph_parser.exporter.convert_tags_to_classes,db,per_file_state,user_options,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([all_idents], 0))
;
var G__130707__$2 = cljs.core.update.cljs$core$IFn$_invoke$arity$3(G__130707__$1,new cljs.core.Keyword("block","tags","block/tags",1814948340),(function (tags){
var G__130717 = cljs.core.set(tags);
var G__130717__$1 = cljs.core.conj.cljs$core$IFn$_invoke$arity$2(G__130717,new cljs.core.Keyword("logseq.class","Page","logseq.class/Page",1484340329))
;
if(cljs.core.seq(clojure.set.intersection.cljs$core$IFn$_invoke$arity$2(cljs.core.disj.cljs$core$IFn$_invoke$arity$2(cljs.core.set(tags),new cljs.core.Keyword("logseq.class","Page","logseq.class/Page",1484340329)),logseq.db.frontend.class$.page_classes))){
return cljs.core.disj.cljs$core$IFn$_invoke$arity$2(G__130717__$1,new cljs.core.Keyword("logseq.class","Page","logseq.class/Page",1484340329));
} else {
return G__130717__$1;
}
}))
;
if(cljs.core.seq(page_tags)){
return cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([G__130707__$2,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("logseq.property","page-tags","logseq.property/page-tags",-2133531185),page_tags], null)], 0));
} else {
return G__130707__$2;
}
} else {
return block;
}
});
logseq.graph_parser.exporter.add_uuid_to_page_map = (function logseq$graph_parser$exporter$add_uuid_to_page_map(m,page_names_to_uuids){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(m,new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),logseq.graph_parser.exporter.get_page_uuid(page_names_to_uuids,new cljs.core.Keyword("block","name","block/name",1619760316).cljs$core$IFn$_invoke$arity$1(m),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"block","block",664686210),m], null)));
});
/**
 * Ignore case because tags in content can have any case and still have a valid ref
 */
logseq.graph_parser.exporter.content_without_tags_ignore_case = (function logseq$graph_parser$exporter$content_without_tags_ignore_case(content,tags){
return clojure.string.trim(cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (content__$1,tag){
return logseq.common.util.replace_ignore_case(logseq.common.util.replace_ignore_case(content__$1,["#",cljs.core.str.cljs$core$IFn$_invoke$arity$1(tag)].join(''),""),["#",logseq.common.util.page_ref.left_brackets,cljs.core.str.cljs$core$IFn$_invoke$arity$1(tag),logseq.common.util.page_ref.right_brackets].join(''),"");
}),content,cljs.core.sort.cljs$core$IFn$_invoke$arity$2(cljs.core._GT_,tags)));
});
logseq.graph_parser.exporter.update_block_tags = (function logseq$graph_parser$exporter$update_block_tags(block,db,p__130744,per_file_state,all_idents){
var map__130746 = p__130744;
var map__130746__$1 = cljs.core.__destructure_map(map__130746);
var user_options = map__130746__$1;
var remove_inline_tags_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__130746__$1,new cljs.core.Keyword(null,"remove-inline-tags?","remove-inline-tags?",-1198387053));
var block_SINGLEQUOTE_ = ((cljs.core.seq(new cljs.core.Keyword("block","tags","block/tags",1814948340).cljs$core$IFn$_invoke$arity$1(block)))?(function (){var original_tags = cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (p1__130735_SHARP_){
var or__5002__auto__ = new cljs.core.Keyword("block.temp","new-class","block.temp/new-class",348616617).cljs$core$IFn$_invoke$arity$1(p1__130735_SHARP_);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return logseq.graph_parser.exporter.logseq_class_ident_QMARK_(p1__130735_SHARP_);
}
}),new cljs.core.Keyword("block","tags","block/tags",1814948340).cljs$core$IFn$_invoke$arity$1(block));
var convert_tag_QMARK__SINGLEQUOTE_ = (function (p1__130736_SHARP_){
return logseq.graph_parser.exporter.convert_tag_QMARK_(new cljs.core.Keyword("block","name","block/name",1619760316).cljs$core$IFn$_invoke$arity$1(p1__130736_SHARP_),user_options);
});
var G__130749 = block;
var G__130749__$1 = (cljs.core.truth_(remove_inline_tags_QMARK_)?cljs.core.update.cljs$core$IFn$_invoke$arity$4(G__130749,new cljs.core.Keyword("block","title","block/title",710445684),logseq.graph_parser.exporter.content_without_tags_ignore_case,cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","title","block/title",710445684),cljs.core.filter.cljs$core$IFn$_invoke$arity$2(convert_tag_QMARK__SINGLEQUOTE_,original_tags))):G__130749);
var G__130749__$2 = cljs.core.update.cljs$core$IFn$_invoke$arity$4(G__130749__$1,new cljs.core.Keyword("block","title","block/title",710445684),logseq.db.frontend.content.replace_tags_with_id_refs,cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__130737_SHARP_){
return logseq.graph_parser.exporter.add_uuid_to_page_map(p1__130737_SHARP_,new cljs.core.Keyword(null,"page-names-to-uuids","page-names-to-uuids",-875423247).cljs$core$IFn$_invoke$arity$1(per_file_state));
}),cljs.core.remove.cljs$core$IFn$_invoke$arity$2(convert_tag_QMARK__SINGLEQUOTE_,original_tags)))
;
return cljs.core.update.cljs$core$IFn$_invoke$arity$variadic(G__130749__$2,new cljs.core.Keyword("block","tags","block/tags",1814948340),logseq.graph_parser.exporter.convert_tags_to_classes,db,per_file_state,user_options,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([all_idents], 0));

})():block);
return block_SINGLEQUOTE_;
});
/**
 * If a block has a marker, convert it to a task object
 */
logseq.graph_parser.exporter.update_block_marker = (function logseq$graph_parser$exporter$update_block_marker(block,p__130758){
var map__130759 = p__130758;
var map__130759__$1 = cljs.core.__destructure_map(map__130759);
var log_fn = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__130759__$1,new cljs.core.Keyword(null,"log-fn","log-fn",-2003241282));
var temp__5802__auto__ = new cljs.core.Keyword("block","marker","block/marker",1231576318).cljs$core$IFn$_invoke$arity$1(block);
if(cljs.core.truth_(temp__5802__auto__)){
var marker = temp__5802__auto__;
var old_to_new = cljs.core.PersistentHashMap.fromArrays(["CANCELED","TODO","NOW","LATER","DONE","DOING","IN-PROGRESS","WAITING","CANCELLED","WAIT"],[new cljs.core.Keyword("logseq.property","status.canceled","logseq.property/status.canceled",752643262),new cljs.core.Keyword("logseq.property","status.todo","logseq.property/status.todo",-1615585377),new cljs.core.Keyword("logseq.property","status.doing","logseq.property/status.doing",1840122908),new cljs.core.Keyword("logseq.property","status.todo","logseq.property/status.todo",-1615585377),new cljs.core.Keyword("logseq.property","status.done","logseq.property/status.done",-1827582082),new cljs.core.Keyword("logseq.property","status.doing","logseq.property/status.doing",1840122908),new cljs.core.Keyword("logseq.property","status.doing","logseq.property/status.doing",1840122908),new cljs.core.Keyword("logseq.property","status.backlog","logseq.property/status.backlog",-72333491),new cljs.core.Keyword("logseq.property","status.canceled","logseq.property/status.canceled",752643262),new cljs.core.Keyword("logseq.property","status.backlog","logseq.property/status.backlog",-72333491)]);
var status_ident = (function (){var or__5002__auto__ = (old_to_new.cljs$core$IFn$_invoke$arity$1 ? old_to_new.cljs$core$IFn$_invoke$arity$1(marker) : old_to_new.call(null,marker));
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var G__130760_132056 = new cljs.core.Keyword(null,"invalid-todo","invalid-todo",1926538319);
var G__130761_132057 = [cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([marker], 0))," is not a valid marker so setting it to TODO"].join('');
(log_fn.cljs$core$IFn$_invoke$arity$2 ? log_fn.cljs$core$IFn$_invoke$arity$2(G__130760_132056,G__130761_132057) : log_fn.call(null,G__130760_132056,G__130761_132057));

return new cljs.core.Keyword("logseq.property","status.todo","logseq.property/status.todo",-1615585377);
}
})();
return cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(cljs.core.update.cljs$core$IFn$_invoke$arity$4(cljs.core.update.cljs$core$IFn$_invoke$arity$5(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(block,new cljs.core.Keyword("logseq.property","status","logseq.property/status",-907216853),status_ident),new cljs.core.Keyword("block","title","block/title",710445684),clojure.string.replace_first,cljs.core.re_pattern([cljs.core.str.cljs$core$IFn$_invoke$arity$1(marker),"\\s*"].join('')),""),new cljs.core.Keyword("block","tags","block/tags",1814948340),cljs.core.fnil.cljs$core$IFn$_invoke$arity$2(cljs.core.conj,cljs.core.PersistentVector.EMPTY),new cljs.core.Keyword("logseq.class","Task","logseq.class/Task",-1282181457)),new cljs.core.Keyword("block","marker","block/marker",1231576318));
} else {
return block;
}
});
logseq.graph_parser.exporter.update_block_priority = (function logseq$graph_parser$exporter$update_block_priority(block,p__130767){
var map__130768 = p__130767;
var map__130768__$1 = cljs.core.__destructure_map(map__130768);
var log_fn = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__130768__$1,new cljs.core.Keyword(null,"log-fn","log-fn",-2003241282));
var temp__5802__auto__ = new cljs.core.Keyword("block","priority","block/priority",1491369544).cljs$core$IFn$_invoke$arity$1(block);
if(cljs.core.truth_(temp__5802__auto__)){
var priority = temp__5802__auto__;
var old_to_new = new cljs.core.PersistentArrayMap(null, 3, ["A",new cljs.core.Keyword("logseq.property","priority.high","logseq.property/priority.high",567227668),"B",new cljs.core.Keyword("logseq.property","priority.medium","logseq.property/priority.medium",-1829322278),"C",new cljs.core.Keyword("logseq.property","priority.low","logseq.property/priority.low",2107453748)], null);
var priority_value = (function (){var or__5002__auto__ = (old_to_new.cljs$core$IFn$_invoke$arity$1 ? old_to_new.cljs$core$IFn$_invoke$arity$1(priority) : old_to_new.call(null,priority));
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var G__130778_132068 = new cljs.core.Keyword(null,"invalid-priority","invalid-priority",2067271516);
var G__130779_132069 = [cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([priority], 0))," is not a valid priority so setting it to low"].join('');
(log_fn.cljs$core$IFn$_invoke$arity$2 ? log_fn.cljs$core$IFn$_invoke$arity$2(G__130778_132068,G__130779_132069) : log_fn.call(null,G__130778_132068,G__130779_132069));

return new cljs.core.Keyword("logseq.property","priority.low","logseq.property/priority.low",2107453748);
}
})();
return cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(cljs.core.update.cljs$core$IFn$_invoke$arity$5(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(block,new cljs.core.Keyword("logseq.property","priority","logseq.property/priority",239228411),priority_value),new cljs.core.Keyword("block","title","block/title",710445684),clojure.string.replace_first,cljs.core.re_pattern(["\\[#",cljs.core.str.cljs$core$IFn$_invoke$arity$1(priority),"\\]","\\s*"].join('')),""),new cljs.core.Keyword("block","priority","block/priority",1491369544));
} else {
return block;
}
});
/**
 * :block/title doesn't contain DEADLINE.* text so unable to detect timestamp
 *   or repeater usage and notify user that they aren't supported
 */
logseq.graph_parser.exporter.update_block_deadline = (function logseq$graph_parser$exporter$update_block_deadline(block,page_names_to_uuids,p__130780){
var map__130782 = p__130780;
var map__130782__$1 = cljs.core.__destructure_map(map__130782);
var user_config = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__130782__$1,new cljs.core.Keyword(null,"user-config","user-config",-1138679827));
var temp__5802__auto__ = (function (){var or__5002__auto__ = new cljs.core.Keyword("block","deadline","block/deadline",660945231).cljs$core$IFn$_invoke$arity$1(block);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword("block","scheduled","block/scheduled",584810412).cljs$core$IFn$_invoke$arity$1(block);
}
})();
if(cljs.core.truth_(temp__5802__auto__)){
var date_int = temp__5802__auto__;
var title = logseq.common.util.date_time.int__GT_journal_title(date_int,logseq.common.config.get_date_formatter(user_config));
var existing_journal_page = (function (){var G__130787 = title;
var G__130787__$1 = (((G__130787 == null))?null:logseq.common.util.page_name_sanity_lc(G__130787));
var G__130787__$2 = (((G__130787__$1 == null))?null:cljs.core.get.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(page_names_to_uuids),G__130787__$1));
if((G__130787__$2 == null)){
return null;
} else {
return cljs.core.PersistentHashMap.fromArrays([new cljs.core.Keyword("block","uuid","block/uuid",-1991494552)],[G__130787__$2]);
}
})();
var deadline_page = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3((function (){var or__5002__auto__ = existing_journal_page;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var page_m = logseq.db.sqlite.util.build_new_page(title);
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(page_m,new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),logseq.common.uuid.gen_uuid.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"journal-page-uuid","journal-page-uuid",1859101489),date_int),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("block","journal-day","block/journal-day",-145748366),date_int], 0));
}
})(),new cljs.core.Keyword("block","tags","block/tags",1814948340),new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("logseq.class","Journal","logseq.class/Journal",1979741081),null], null), null));
var time_long = cljs_time.coerce.to_long(logseq.common.util.date_time.int__GT_local_date(date_int));
var datetime_property = (cljs.core.truth_(new cljs.core.Keyword("block","deadline","block/deadline",660945231).cljs$core$IFn$_invoke$arity$1(block))?new cljs.core.Keyword("logseq.property","deadline","logseq.property/deadline",1685901604):new cljs.core.Keyword("logseq.property","scheduled","logseq.property/scheduled",1644520943));
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"block","block",664686210),cljs.core.dissoc.cljs$core$IFn$_invoke$arity$variadic(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(block,datetime_property,time_long),new cljs.core.Keyword("block","deadline","block/deadline",660945231),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("block","scheduled","block/scheduled",584810412),new cljs.core.Keyword("block","repeated?","block/repeated?",-1344319799)], 0)),new cljs.core.Keyword(null,"properties-tx","properties-tx",-1476843279),(cljs.core.truth_(existing_journal_page)?null:new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [deadline_page], null))], null);
} else {
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"block","block",664686210),block,new cljs.core.Keyword(null,"properties-tx","properties-tx",-1476843279),cljs.core.PersistentVector.EMPTY], null);
}
});
/**
 * Detects if a property value has text with refs e.g. `#Logseq is #awesome`
 *   instead of `#Logseq #awesome`. If so the property type is :default instead of :page
 */
logseq.graph_parser.exporter.text_with_refs_QMARK_ = (function logseq$graph_parser$exporter$text_with_refs_QMARK_(prop_vals,val_text){
var replace_regex = cljs.core.re_pattern(["([#[])","(",clojure.string.join.cljs$core$IFn$_invoke$arity$2("|",cljs.core.map.cljs$core$IFn$_invoke$arity$2(logseq.common.util.escape_regex_chars,cljs.core.sort.cljs$core$IFn$_invoke$arity$2(cljs.core._GT_,prop_vals))),")"].join(''));
var remaining_text = clojure.string.replace(val_text,replace_regex,"$1");
var non_ref_char = cljs.core.some((function (p1__130792_SHARP_){
if(cljs.core.truth_((function (){var or__5002__auto__ = clojure.string.blank_QMARK_(p1__130792_SHARP_);
if(or__5002__auto__){
return or__5002__auto__;
} else {
var fexpr__130808 = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 4, ["]",null,",",null,"[",null,"#",null], null), null);
return (fexpr__130808.cljs$core$IFn$_invoke$arity$1 ? fexpr__130808.cljs$core$IFn$_invoke$arity$1(p1__130792_SHARP_) : fexpr__130808.call(null,p1__130792_SHARP_));
}
})())){
return false;
} else {
return p1__130792_SHARP_;
}
}),remaining_text);
return (!((non_ref_char == null)));
});
logseq.graph_parser.exporter.create_property_ident = (function logseq$graph_parser$exporter$create_property_ident(db,all_idents,property_name){
var db_ident = logseq.db.frontend.db_ident.ensure_unique_db_ident(db,logseq.db.frontend.property.create_user_property_ident_from_name.cljs$core$IFn$_invoke$arity$1(cljs.core.name(property_name)));
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(all_idents,cljs.core.assoc,property_name,db_ident);
});
logseq.graph_parser.exporter.get_ident = (function logseq$graph_parser$exporter$get_ident(all_idents,kw){
if(((cljs.core.qualified_keyword_QMARK_(kw)) && (logseq.db.frontend.property.logseq_property_QMARK_(kw)))){
return kw;
} else {
var or__5002__auto__ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(all_idents,kw);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2(["No ident found for ",cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([kw], 0))].join(''),cljs.core.PersistentArrayMap.EMPTY);
}
}
});
logseq.graph_parser.exporter.get_property_schema = (function logseq$graph_parser$exporter$get_property_schema(property_schemas,kw){
var or__5002__auto__ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(property_schemas,kw);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2(["No property schema found for ",cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([kw], 0))].join(''),cljs.core.PersistentArrayMap.EMPTY);
}
});
/**
 * Infers a property's schema from the given _user_ property value and adds new ones to
 *   the property-schemas atom. If a property's :logseq.property/type changes, returns a map of
 *   the schema attribute changed and how it changed e.g. `{:type {:from :default :to :url}}`
 */
logseq.graph_parser.exporter.infer_property_schema_and_get_property_change = (function logseq$graph_parser$exporter$infer_property_schema_and_get_property_change(db,prop_val,prop,prop_val_text,refs,p__130856,macros){
var map__130857 = p__130856;
var map__130857__$1 = cljs.core.__destructure_map(map__130857);
var property_schemas = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__130857__$1,new cljs.core.Keyword(null,"property-schemas","property-schemas",-1631291569));
var all_idents = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__130857__$1,new cljs.core.Keyword(null,"all-idents","all-idents",-980997938));
if(((cljs.core.coll_QMARK_(prop_val)) && ((!(cljs.core.every_QMARK_(cljs.core.string_QMARK_,prop_val)))))){
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2(["Import cannot infer schema of unknown property value ",cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([prop_val], 0))].join(''),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"value","value",305978217),prop_val,new cljs.core.Keyword(null,"property","property",-1114278232),prop], null));
} else {
}

var prop_type = ((((cljs.core.coll_QMARK_(prop_val)) && (((cljs.core.seq(prop_val)) && (clojure.set.subset_QMARK_(prop_val,cljs.core.set(cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (p1__130851_SHARP_){
if(cljs.core.truth_((logseq.db.journal_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.journal_QMARK_.cljs$core$IFn$_invoke$arity$1(p1__130851_SHARP_) : logseq.db.journal_QMARK_.call(null,p1__130851_SHARP_)))){
return new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(p1__130851_SHARP_);
} else {
return null;
}
}),refs))))))))?new cljs.core.Keyword(null,"date","date",-1463434462):((((cljs.core.coll_QMARK_(prop_val)) && (((cljs.core.seq(prop_val)) && (logseq.graph_parser.exporter.text_with_refs_QMARK_(prop_val,prop_val_text))))))?new cljs.core.Keyword(null,"default","default",-1987822328):((cljs.core.coll_QMARK_(prop_val))?new cljs.core.Keyword(null,"node","node",581201198):logseq.db.frontend.property.type.infer_property_type_from_value(logseq.common.util.macro.expand_value_if_macro(prop_val,macros))
)));
var prev_type = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(property_schemas),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [prop,new cljs.core.Keyword("logseq.property","type","logseq.property/type",83842404)], null));
if(cljs.core.truth_(cljs.core.get.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(property_schemas),prop))){
} else {
logseq.graph_parser.exporter.create_property_ident(db,all_idents,prop);

var schema_132160 = (function (){var G__130865 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("logseq.property","type","logseq.property/type",83842404),prop_type], null);
if(cljs.core.truth_((function (){var fexpr__130866 = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"date","date",-1463434462),null,new cljs.core.Keyword(null,"node","node",581201198),null], null), null);
return (fexpr__130866.cljs$core$IFn$_invoke$arity$1 ? fexpr__130866.cljs$core$IFn$_invoke$arity$1(prop_type) : fexpr__130866.call(null,prop_type));
})())){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__130865,new cljs.core.Keyword("db","cardinality","db/cardinality",-104975659),new cljs.core.Keyword(null,"many","many",1092119164));
} else {
return G__130865;
}
})();
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(property_schemas,cljs.core.assoc,prop,schema_132160);
}

if(cljs.core.truth_((function (){var and__5000__auto__ = prev_type;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(prev_type,prop_type);
} else {
return and__5000__auto__;
}
})())){
return new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"type","type",1174270348),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"from","from",1815293044),prev_type,new cljs.core.Keyword(null,"to","to",192099007),prop_type], null)], null);
} else {
return null;
}
});
/**
 * Map of built-in property file ids to their db graph idents
 */
logseq.graph_parser.exporter.built_in_property_file_to_db_idents = cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (k){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [logseq.db.common.property_util.get_file_pid(k),k], null);
}),cljs.core.keys(logseq.db.frontend.property.built_in_properties)));
/**
 * All built-in property file ids as a set of keywords
 */
logseq.graph_parser.exporter.all_built_in_property_file_ids = clojure.set.union.cljs$core$IFn$_invoke$arity$2(cljs.core.set(cljs.core.keys(logseq.graph_parser.exporter.built_in_property_file_to_db_idents)),new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 8, [new cljs.core.Keyword(null,"query-sort-by","query-sort-by",488160033),null,new cljs.core.Keyword(null,"query-table","query-table",2095143554),null,new cljs.core.Keyword(null,"filters","filters",974726919),null,new cljs.core.Keyword(null,"hl-stamp","hl-stamp",-695479513),null,new cljs.core.Keyword(null,"file","file",-1269645878),null,new cljs.core.Keyword(null,"file-path","file-path",-2005501162),null,new cljs.core.Keyword(null,"query-sort-desc","query-sort-desc",123730008),null,new cljs.core.Keyword(null,"query-properties","query-properties",-953532199),null], null), null));
/**
 * All built-in properties and classes as a set of keywords
 */
logseq.graph_parser.exporter.all_built_in_names = clojure.set.union.cljs$core$IFn$_invoke$arity$2(logseq.graph_parser.exporter.all_built_in_property_file_ids,cljs.core.set(cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__130874_SHARP_){
return cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(clojure.string.lower_case(new cljs.core.Keyword(null,"title","title",636505583).cljs$core$IFn$_invoke$arity$1(p1__130874_SHARP_)));
}),cljs.core.vals(logseq.db.frontend.class$.built_in_classes))));
/**
 * File-graph built-in property names that are supported. Expressed as set of keywords
 */
logseq.graph_parser.exporter.file_built_in_property_names = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 23, [new cljs.core.Keyword(null,"tags","tags",1771418977),null,new cljs.core.Keyword(null,"query-sort-by","query-sort-by",488160033),null,new cljs.core.Keyword(null,"logseq.order-list-type","logseq.order-list-type",-1819806366),null,new cljs.core.Keyword(null,"query-table","query-table",2095143554),null,new cljs.core.Keyword(null,"hl-type","hl-type",992471876),null,new cljs.core.Keyword(null,"hl-value","hl-value",-755264538),null,new cljs.core.Keyword(null,"logseq.tldraw.shape","logseq.tldraw.shape",-771542905),null,new cljs.core.Keyword(null,"filters","filters",974726919),null,new cljs.core.Keyword(null,"hl-stamp","hl-stamp",-695479513),null,new cljs.core.Keyword(null,"hl-page","hl-page",949012424),null,new cljs.core.Keyword(null,"ls-type","ls-type",1383834313),null,new cljs.core.Keyword(null,"file","file",-1269645878),null,new cljs.core.Keyword(null,"background-color","background-color",570434026),null,new cljs.core.Keyword(null,"public","public",1566243851),null,new cljs.core.Keyword(null,"icon","icon",1679606541),null,new cljs.core.Keyword(null,"exclude-from-graph-view","exclude-from-graph-view",-1509369969),null,new cljs.core.Keyword(null,"alias","alias",-2039751630),null,new cljs.core.Keyword(null,"logseq.tldraw.page","logseq.tldraw.page",-1937463021),null,new cljs.core.Keyword(null,"file-path","file-path",-2005501162),null,new cljs.core.Keyword(null,"query-sort-desc","query-sort-desc",123730008),null,new cljs.core.Keyword(null,"query-properties","query-properties",-953532199),null,new cljs.core.Keyword(null,"hl-color","hl-color",1100781725),null,new cljs.core.Keyword(null,"heading","heading",-1312171873),null], null), null);
if(clojure.set.subset_QMARK_(logseq.graph_parser.exporter.file_built_in_property_names,logseq.graph_parser.exporter.all_built_in_property_file_ids)){
} else {
throw (new Error(["Assert failed: ","All file-built-in properties are used in db graph","\n","(set/subset? file-built-in-property-names all-built-in-property-file-ids)"].join('')));
}
/**
 * Special keywords in previous query table
 */
logseq.graph_parser.exporter.query_table_special_keys = new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"page","page",849072397),new cljs.core.Keyword("block","title","block/title",710445684),new cljs.core.Keyword(null,"block","block",664686210),new cljs.core.Keyword("block","title","block/title",710445684),new cljs.core.Keyword(null,"created-at","created-at",-89248644),new cljs.core.Keyword("block","created-at","block/created-at",1440015),new cljs.core.Keyword(null,"updated-at","updated-at",-1592622336),new cljs.core.Keyword("block","updated-at","block/updated-at",-1516550551)], null);
logseq.graph_parser.exporter.translate_query_properties = (function logseq$graph_parser$exporter$translate_query_properties(prop_value,all_idents,options){
var property_classes = cljs.core.set(cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.keyword,new cljs.core.Keyword(null,"property-classes","property-classes",1129964490).cljs$core$IFn$_invoke$arity$1(options)));
try{return cljs.core.vec(cljs.core.distinct.cljs$core$IFn$_invoke$arity$1(cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (p1__130876_SHARP_){
if(cljs.core.truth_(cljs.core.get.cljs$core$IFn$_invoke$arity$2(logseq.graph_parser.exporter.query_table_special_keys,p1__130876_SHARP_))){
return cljs.core.get.cljs$core$IFn$_invoke$arity$2(logseq.graph_parser.exporter.query_table_special_keys,p1__130876_SHARP_);
} else {
if(cljs.core.truth_((property_classes.cljs$core$IFn$_invoke$arity$1 ? property_classes.cljs$core$IFn$_invoke$arity$1(p1__130876_SHARP_) : property_classes.call(null,p1__130876_SHARP_)))){
return new cljs.core.Keyword("block","tags","block/tags",1814948340);
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"tags","tags",1771418977),p1__130876_SHARP_)){
return new cljs.core.Keyword("block","tags","block/tags",1814948340);
} else {
return logseq.graph_parser.exporter.get_ident(cljs.core.deref(all_idents),p1__130876_SHARP_);

}
}
}
}),clojure.edn.read_string.cljs$core$IFn$_invoke$arity$1(prop_value))));
}catch (e130878){var e = e130878;
console.error("Translating query properties failed with:",e);

return cljs.core.PersistentVector.EMPTY;
}});
logseq.graph_parser.exporter.translate_linked_ref_filters = (function logseq$graph_parser$exporter$translate_linked_ref_filters(prop_value,page_names_to_uuids){
try{var filters = clojure.edn.read_string.cljs$core$IFn$_invoke$arity$1(prop_value);
var filter_by = cljs.core.group_by(cljs.core.val,filters);
var includes = cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (p1__130882_SHARP_){
return (new cljs.core.PersistentVector(null,2,(5),cljs.core.PersistentVector.EMPTY_NODE,[new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),p1__130882_SHARP_],null));
}),cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (p1__130881_SHARP_){
var or__5002__auto__ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(page_names_to_uuids),p1__130881_SHARP_);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return console.error(["No uuid found for linked reference filter page ",cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([p1__130881_SHARP_], 0))].join(''));
}
}),cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.first,(filter_by.cljs$core$IFn$_invoke$arity$1 ? filter_by.cljs$core$IFn$_invoke$arity$1(true) : filter_by.call(null,true)))));
var excludes = cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (p1__130886_SHARP_){
return (new cljs.core.PersistentVector(null,2,(5),cljs.core.PersistentVector.EMPTY_NODE,[new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),p1__130886_SHARP_],null));
}),cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (p1__130884_SHARP_){
var or__5002__auto__ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(page_names_to_uuids),p1__130884_SHARP_);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return console.error(["No uuid found for linked reference filter page ",cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([p1__130884_SHARP_], 0))].join(''));
}
}),cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.first,(filter_by.cljs$core$IFn$_invoke$arity$1 ? filter_by.cljs$core$IFn$_invoke$arity$1(false) : filter_by.call(null,false)))));
var G__130888 = cljs.core.PersistentVector.EMPTY;
var G__130888__$1 = ((cljs.core.seq(includes))?cljs.core.conj.cljs$core$IFn$_invoke$arity$2(G__130888,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("logseq.property.linked-references","includes","logseq.property.linked-references/includes",1680577703),includes], null)):G__130888);
if(cljs.core.seq(excludes)){
return cljs.core.conj.cljs$core$IFn$_invoke$arity$2(G__130888__$1,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("logseq.property.linked-references","excludes","logseq.property.linked-references/excludes",242675889),excludes], null));
} else {
return G__130888__$1;
}
}catch (e130887){var e = e130887;
return console.error("Translating linked reference filters failed with: ",e);
}});
logseq.graph_parser.exporter.update_built_in_property_values = (function logseq$graph_parser$exporter$update_built_in_property_values(props,page_names_to_uuids,p__130893,p__130894,options){
var map__130895 = p__130893;
var map__130895__$1 = cljs.core.__destructure_map(map__130895);
var ignored_properties = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__130895__$1,new cljs.core.Keyword(null,"ignored-properties","ignored-properties",-2000184055));
var all_idents = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__130895__$1,new cljs.core.Keyword(null,"all-idents","all-idents",-980997938));
var map__130896 = p__130894;
var map__130896__$1 = cljs.core.__destructure_map(map__130896);
var title = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__130896__$1,new cljs.core.Keyword("block","title","block/title",710445684));
var name = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__130896__$1,new cljs.core.Keyword("block","name","block/name",1619760316));
var m = cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (p__130909){
var vec__130914 = p__130909;
var prop = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__130914,(0),null);
var prop_value = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__130914,(1),null);
if(cljs.core.truth_((function (){var fexpr__130917 = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"hl-stamp","hl-stamp",-695479513),null,new cljs.core.Keyword(null,"file","file",-1269645878),null,new cljs.core.Keyword(null,"icon","icon",1679606541),null,new cljs.core.Keyword(null,"file-path","file-path",-2005501162),null], null), null);
return (fexpr__130917.cljs$core$IFn$_invoke$arity$1 ? fexpr__130917.cljs$core$IFn$_invoke$arity$1(prop) : fexpr__130917.call(null,prop));
})())){
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$3(ignored_properties,cljs.core.conj,new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"property","property",-1114278232),prop,new cljs.core.Keyword(null,"value","value",305978217),prop_value,new cljs.core.Keyword(null,"location","location",1815599388),(cljs.core.truth_(name)?new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"page","page",849072397),name], null):new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"block","block",664686210),title], null))], null));

return null;
} else {
var G__130918 = prop;
var G__130918__$1 = (((G__130918 instanceof cljs.core.Keyword))?G__130918.fqn:null);
switch (G__130918__$1) {
case "query-properties":
var temp__5804__auto__ = cljs.core.not_empty(logseq.graph_parser.exporter.translate_query_properties(prop_value,all_idents,options));
if(cljs.core.truth_(temp__5804__auto__)){
var cols = temp__5804__auto__;
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("logseq.property.table","ordered-columns","logseq.property.table/ordered-columns",1485587100),cols], null)], null);
} else {
return null;
}

break;
case "query-table":
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("logseq.property.view","type","logseq.property.view/type",218237607),(cljs.core.truth_(prop_value)?new cljs.core.Keyword("logseq.property.view","type.table","logseq.property.view/type.table",194254240):new cljs.core.Keyword("logseq.property.view","type.list","logseq.property.view/type.list",-1164828502))], null)], null);

break;
case "query-sort-by":
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("logseq.property.table","sorting","logseq.property.table/sorting",208102594),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"id","id",-1388402092),(function (){var or__5002__auto__ = (function (){var G__130923 = cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(prop_value);
return (logseq.graph_parser.exporter.query_table_special_keys.cljs$core$IFn$_invoke$arity$1 ? logseq.graph_parser.exporter.query_table_special_keys.cljs$core$IFn$_invoke$arity$1(G__130923) : logseq.graph_parser.exporter.query_table_special_keys.call(null,G__130923));
})();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return logseq.graph_parser.exporter.get_ident(cljs.core.deref(all_idents),cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(prop_value));
}
})(),new cljs.core.Keyword(null,"asc?","asc?",891093427),true], null)], null)], null)], null);

break;
case "query-sort-desc":
return null;

break;
case "filters":
return logseq.graph_parser.exporter.translate_linked_ref_filters(prop_value,page_names_to_uuids);

break;
case "ls-type":
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("logseq.property","ls-type","logseq.property/ls-type",326979345),cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(prop_value)], null)], null);

break;
default:
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [(logseq.graph_parser.exporter.built_in_property_file_to_db_idents.cljs$core$IFn$_invoke$arity$1 ? logseq.graph_parser.exporter.built_in_property_file_to_db_idents.cljs$core$IFn$_invoke$arity$1(prop) : logseq.graph_parser.exporter.built_in_property_file_to_db_idents.call(null,prop)),prop_value], null)], null);

}
}
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([props], 0)));
var G__130928 = m;
if(cljs.core.truth_((function (){var and__5000__auto__ = cljs.core.contains_QMARK_(props,new cljs.core.Keyword(null,"query-sort-desc","query-sort-desc",123730008));
if(and__5000__auto__){
return new cljs.core.Keyword(null,"query-sort-by","query-sort-by",488160033).cljs$core$IFn$_invoke$arity$1(props);
} else {
return and__5000__auto__;
}
})())){
return cljs.core.update.cljs$core$IFn$_invoke$arity$3(G__130928,new cljs.core.Keyword("logseq.property.table","sorting","logseq.property.table/sorting",208102594),(function (v){
return cljs.core.assoc_in(v,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [(0),new cljs.core.Keyword(null,"asc?","asc?",891093427)], null),cljs.core.not(new cljs.core.Keyword(null,"query-sort-desc","query-sort-desc",123730008).cljs$core$IFn$_invoke$arity$1(props)));
}));
} else {
return G__130928;
}
});
/**
 * Converts :node or :date names to entity values
 */
logseq.graph_parser.exporter.update_page_or_date_values = (function logseq$graph_parser$exporter$update_page_or_date_values(page_names_to_uuids,property_values){
return cljs.core.set(cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__130939_SHARP_){
return (new cljs.core.PersistentVector(null,2,(5),cljs.core.PersistentVector.EMPTY_NODE,[new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),logseq.graph_parser.exporter.get_page_uuid(page_names_to_uuids,logseq.common.util.page_name_sanity_lc(p1__130939_SHARP_),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"original-name","original-name",-1427702839),p1__130939_SHARP_], null))],null));
}),property_values));
});
/**
 * Handles a property's schema changing across blocks. Handling usually means
 *   converting a property value to a new changed value or nil if the property is
 *   to be ignored. Sometimes handling a property change results in changing a
 *   property's previous usages instead of its current value e.g. when changing to
 *   a :default type. This is done by adding an entry to upstream-properties and
 *   building the additional tx to ensure this happens
 */
logseq.graph_parser.exporter.handle_changed_property = (function logseq$graph_parser$exporter$handle_changed_property(val,prop,page_names_to_uuids,properties_text_values,p__130949,p__130950){
var map__130954 = p__130949;
var map__130954__$1 = cljs.core.__destructure_map(map__130954);
var ignored_properties = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__130954__$1,new cljs.core.Keyword(null,"ignored-properties","ignored-properties",-2000184055));
var property_schemas = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__130954__$1,new cljs.core.Keyword(null,"property-schemas","property-schemas",-1631291569));
var map__130955 = p__130950;
var map__130955__$1 = cljs.core.__destructure_map(map__130955);
var property_changes = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__130955__$1,new cljs.core.Keyword(null,"property-changes","property-changes",-938944732));
var log_fn = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__130955__$1,new cljs.core.Keyword(null,"log-fn","log-fn",-2003241282));
var upstream_properties = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__130955__$1,new cljs.core.Keyword(null,"upstream-properties","upstream-properties",1757374284));
var type_change = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(property_changes,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [prop,new cljs.core.Keyword(null,"type","type",1174270348)], null));
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"default","default",-1987822328),new cljs.core.Keyword(null,"from","from",1815293044).cljs$core$IFn$_invoke$arity$1(type_change))){
var or__5002__auto__ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(properties_text_values,prop);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.str.cljs$core$IFn$_invoke$arity$1(val);
}
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"from","from",1815293044),new cljs.core.Keyword(null,"node","node",581201198),new cljs.core.Keyword(null,"to","to",192099007),new cljs.core.Keyword(null,"date","date",-1463434462)], null),type_change)){
return logseq.graph_parser.exporter.update_page_or_date_values(page_names_to_uuids,val);
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"from","from",1815293044),new cljs.core.Keyword(null,"date","date",-1463434462),new cljs.core.Keyword(null,"to","to",192099007),new cljs.core.Keyword(null,"node","node",581201198)], null),type_change)){
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(property_schemas,cljs.core.assoc_in,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [prop,new cljs.core.Keyword("logseq.property","type","logseq.property/type",83842404)], null),new cljs.core.Keyword(null,"node","node",581201198));

return logseq.graph_parser.exporter.update_page_or_date_values(page_names_to_uuids,val);
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"default","default",-1987822328),new cljs.core.Keyword(null,"to","to",192099007).cljs$core$IFn$_invoke$arity$1(type_change))){
if(cljs.core.truth_(cljs.core.get.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(upstream_properties),prop))){
var G__130956_132237 = new cljs.core.Keyword(null,"prop-to-change-ignored","prop-to-change-ignored",89276774);
var G__130957_132238 = new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"property","property",-1114278232),prop,new cljs.core.Keyword(null,"val","val",128701612),val,new cljs.core.Keyword(null,"change","change",-1163046502),type_change], null);
(log_fn.cljs$core$IFn$_invoke$arity$2 ? log_fn.cljs$core$IFn$_invoke$arity$2(G__130956_132237,G__130957_132238) : log_fn.call(null,G__130956_132237,G__130957_132238));

cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$3(ignored_properties,cljs.core.conj,new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"property","property",-1114278232),prop,new cljs.core.Keyword(null,"value","value",305978217),val,new cljs.core.Keyword(null,"schema","schema",-1582001791),cljs.core.get.cljs$core$IFn$_invoke$arity$2(property_changes,prop)], null));

return null;
} else {
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(upstream_properties,cljs.core.assoc,prop,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"schema","schema",-1582001791),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("logseq.property","type","logseq.property/type",83842404),new cljs.core.Keyword(null,"default","default",-1987822328)], null),new cljs.core.Keyword(null,"from-type","from-type",-2097724678),new cljs.core.Keyword(null,"from","from",1815293044).cljs$core$IFn$_invoke$arity$1(type_change)], null));

cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(property_schemas,cljs.core.assoc,prop,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("logseq.property","type","logseq.property/type",83842404),new cljs.core.Keyword(null,"default","default",-1987822328)], null));

return cljs.core.get.cljs$core$IFn$_invoke$arity$2(properties_text_values,prop);
}
} else {
var G__130974_132239 = new cljs.core.Keyword(null,"prop-change-ignored","prop-change-ignored",1905674983);
var G__130975_132240 = new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"property","property",-1114278232),prop,new cljs.core.Keyword(null,"val","val",128701612),val,new cljs.core.Keyword(null,"change","change",-1163046502),type_change], null);
(log_fn.cljs$core$IFn$_invoke$arity$2 ? log_fn.cljs$core$IFn$_invoke$arity$2(G__130974_132239,G__130975_132240) : log_fn.call(null,G__130974_132239,G__130975_132240));

cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$3(ignored_properties,cljs.core.conj,new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"property","property",-1114278232),prop,new cljs.core.Keyword(null,"value","value",305978217),val,new cljs.core.Keyword(null,"schema","schema",-1582001791),cljs.core.get.cljs$core$IFn$_invoke$arity$2(property_changes,prop)], null));

return null;

}
}
}
}
});
logseq.graph_parser.exporter.update_user_property_values = (function logseq$graph_parser$exporter$update_user_property_values(props,page_names_to_uuids,properties_text_values,p__130990,p__130991){
var map__130994 = p__130990;
var map__130994__$1 = cljs.core.__destructure_map(map__130994);
var import_state = map__130994__$1;
var property_schemas = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__130994__$1,new cljs.core.Keyword(null,"property-schemas","property-schemas",-1631291569));
var map__130995 = p__130991;
var map__130995__$1 = cljs.core.__destructure_map(map__130995);
var options = map__130995__$1;
var property_changes = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__130995__$1,new cljs.core.Keyword(null,"property-changes","property-changes",-938944732));
return cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (p__130996){
var vec__130998 = p__130996;
var prop = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__130998,(0),null);
var val = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__130998,(1),null);
if(cljs.core.truth_(cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(property_changes,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [prop,new cljs.core.Keyword(null,"type","type",1174270348)], null)))){
var temp__5804__auto__ = logseq.graph_parser.exporter.handle_changed_property(val,prop,page_names_to_uuids,properties_text_values,import_state,options);
if(cljs.core.truth_(temp__5804__auto__)){
var val_SINGLEQUOTE_ = temp__5804__auto__;
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [prop,val_SINGLEQUOTE_], null);
} else {
return null;
}
} else {
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [prop,((cljs.core.set_QMARK_(val))?((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"default","default",-1987822328),new cljs.core.Keyword("logseq.property","type","logseq.property/type",83842404).cljs$core$IFn$_invoke$arity$1(cljs.core.get.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(property_schemas),prop))))?cljs.core.get.cljs$core$IFn$_invoke$arity$2(properties_text_values,prop):logseq.graph_parser.exporter.update_page_or_date_values(page_names_to_uuids,val)):val)], null);
}
}),props));
});
/**
 * Given a new block and its properties, creates a map of properties which have values of property value tx.
 * Similar to sqlite.build/->property-value-tx-m
 */
logseq.graph_parser.exporter.__GT_property_value_tx_m = (function logseq$graph_parser$exporter$__GT_property_value_tx_m(new_block,properties,get_schema_fn,all_idents){
return logseq.db.frontend.property.build.build_property_values_tx_m(new_block,cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (p__131006){
var vec__131007 = p__131006;
var k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__131007,(0),null);
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__131007,(1),null);
var temp__5802__auto__ = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(logseq.db.frontend.property.built_in_properties,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [k,new cljs.core.Keyword(null,"schema","schema",-1582001791),new cljs.core.Keyword(null,"type","type",1174270348)], null));
if(cljs.core.truth_(temp__5802__auto__)){
var built_in_type = temp__5802__auto__;
if(cljs.core.truth_((function (){var and__5000__auto__ = (logseq.db.frontend.property.type.value_ref_property_types.cljs$core$IFn$_invoke$arity$1 ? logseq.db.frontend.property.type.value_ref_property_types.cljs$core$IFn$_invoke$arity$1(built_in_type) : logseq.db.frontend.property.type.value_ref_property_types.call(null,built_in_type));
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.not(cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(logseq.db.frontend.property.built_in_properties,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [k,new cljs.core.Keyword(null,"closed-values","closed-values",364658811)], null)));
} else {
return and__5000__auto__;
}
})())){
var property_map = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("db","ident","db/ident",-737096),k,new cljs.core.Keyword("logseq.property","type","logseq.property/type",83842404),built_in_type], null);
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [property_map,v], null);
} else {
return null;
}
} else {
if(cljs.core.truth_((function (){var G__131010 = new cljs.core.Keyword("logseq.property","type","logseq.property/type",83842404).cljs$core$IFn$_invoke$arity$1((get_schema_fn.cljs$core$IFn$_invoke$arity$1 ? get_schema_fn.cljs$core$IFn$_invoke$arity$1(k) : get_schema_fn.call(null,k)));
return (logseq.db.frontend.property.type.value_ref_property_types.cljs$core$IFn$_invoke$arity$1 ? logseq.db.frontend.property.type.value_ref_property_types.cljs$core$IFn$_invoke$arity$1(G__131010) : logseq.db.frontend.property.type.value_ref_property_types.call(null,G__131010));
})())){
var property_map = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("db","ident","db/ident",-737096),logseq.graph_parser.exporter.get_ident(all_idents,k),new cljs.core.Keyword(null,"original-property-id","original-property-id",-123524497),k], null),(get_schema_fn.cljs$core$IFn$_invoke$arity$1 ? get_schema_fn.cljs$core$IFn$_invoke$arity$1(k) : get_schema_fn.call(null,k))], 0));
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [property_map,v], null);
} else {
return null;
}
}
}),properties));
});
/**
 * For given block properties, builds property values tx and returns a map with
 *   updated properties in :block-properties and any property values tx in :pvalues-tx
 */
logseq.graph_parser.exporter.build_properties_and_values = (function logseq$graph_parser$exporter$build_properties_and_values(props,_db,page_names_to_uuids,p__131023,p__131024){
var map__131029 = p__131023;
var map__131029__$1 = cljs.core.__destructure_map(map__131029);
var block = map__131029__$1;
var properties_text_values = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__131029__$1,new cljs.core.Keyword("block","properties-text-values","block/properties-text-values",1271244708));
var map__131030 = p__131024;
var map__131030__$1 = cljs.core.__destructure_map(map__131030);
var options = map__131030__$1;
var import_state = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__131030__$1,new cljs.core.Keyword(null,"import-state","import-state",1493794865));
var user_options = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__131030__$1,new cljs.core.Keyword(null,"user-options","user-options",-84696866));
var map__131034 = import_state;
var map__131034__$1 = cljs.core.__destructure_map(map__131034);
var all_idents = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__131034__$1,new cljs.core.Keyword(null,"all-idents","all-idents",-980997938));
var property_schemas = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__131034__$1,new cljs.core.Keyword(null,"property-schemas","property-schemas",-1631291569));
var get_ident_SINGLEQUOTE_ = (function (p1__131017_SHARP_){
return logseq.graph_parser.exporter.get_ident(cljs.core.deref(all_idents),p1__131017_SHARP_);
});
var user_properties = cljs.core.apply.cljs$core$IFn$_invoke$arity$3(cljs.core.dissoc,props,logseq.graph_parser.exporter.file_built_in_property_names);
if(cljs.core.seq(user_properties)){
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(new cljs.core.Keyword(null,"block-properties-text-values","block-properties-text-values",-525710723).cljs$core$IFn$_invoke$arity$1(import_state),cljs.core.assoc,(cljs.core.truth_(new cljs.core.Keyword("block","name","block/name",1619760316).cljs$core$IFn$_invoke$arity$1(block))?logseq.graph_parser.exporter.get_page_uuid(page_names_to_uuids,cljs.core.some_fn.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("logseq.graph-parser.exporter","original-name","logseq.graph-parser.exporter/original-name",-559626865),new cljs.core.Keyword("block","name","block/name",1619760316))(block),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"block","block",664686210),block], null)):new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block)),properties_text_values);
} else {
}

if(cljs.core.contains_QMARK_(props,new cljs.core.Keyword(null,"template","template",-702405684))){
return cljs.core.PersistentArrayMap.EMPTY;
} else {
var props_SINGLEQUOTE_ = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([logseq.graph_parser.exporter.update_built_in_property_values(cljs.core.select_keys(props,logseq.graph_parser.exporter.file_built_in_property_names),page_names_to_uuids,cljs.core.select_keys(import_state,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"ignored-properties","ignored-properties",-2000184055),new cljs.core.Keyword(null,"all-idents","all-idents",-980997938)], null)),cljs.core.select_keys(block,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","name","block/name",1619760316),new cljs.core.Keyword("block","title","block/title",710445684)], null)),cljs.core.select_keys(user_options,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"property-classes","property-classes",1129964490)], null))),logseq.graph_parser.exporter.update_user_property_values(user_properties,page_names_to_uuids,properties_text_values,import_state,options)], 0));
var pvalue_tx_m = logseq.graph_parser.exporter.__GT_property_value_tx_m(block,props_SINGLEQUOTE_,(function (p1__131020_SHARP_){
return logseq.graph_parser.exporter.get_property_schema(cljs.core.deref(property_schemas),p1__131020_SHARP_);
}),cljs.core.deref(all_idents));
var block_properties = cljs.core.update_keys(cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([props_SINGLEQUOTE_,logseq.db.frontend.property.build.build_properties_with_ref_values(pvalue_tx_m)], 0)),get_ident_SINGLEQUOTE_);
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"block-properties","block-properties",306554248),block_properties,new cljs.core.Keyword(null,"pvalues-tx","pvalues-tx",-418668372),cljs.core.into.cljs$core$IFn$_invoke$arity$1(cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (p1__131021_SHARP_){
if(cljs.core.set_QMARK_(p1__131021_SHARP_)){
return p1__131021_SHARP_;
} else {
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [p1__131021_SHARP_], null);
}
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.vals(pvalue_tx_m)], 0)))], null);
}
});
/**
 * Ignore built-in properties that are already imported or not supported in db graphs
 */
logseq.graph_parser.exporter.ignored_built_in_properties = new cljs.core.PersistentVector(null, 31, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"tags","tags",1771418977),new cljs.core.Keyword(null,"alias","alias",-2039751630),new cljs.core.Keyword(null,"collapsed","collapsed",-628494523),new cljs.core.Keyword(null,"id","id",-1388402092),new cljs.core.Keyword(null,"now","now",-1650525531),new cljs.core.Keyword(null,"later","later",961723974),new cljs.core.Keyword(null,"doing","doing",-3342172),new cljs.core.Keyword(null,"done","done",-889844188),new cljs.core.Keyword(null,"canceled","canceled",452728464),new cljs.core.Keyword(null,"cancelled","cancelled",488726224),new cljs.core.Keyword(null,"in-progress","in-progress",2126442630),new cljs.core.Keyword(null,"todo","todo",-1046442570),new cljs.core.Keyword(null,"wait","wait",-260664777),new cljs.core.Keyword(null,"waiting","waiting",895906735),new cljs.core.Keyword(null,"background-image","background-image",-1142314704),new cljs.core.Keyword(null,"macros","macros",811339431),new cljs.core.Keyword("logseq.query","nlp-date","logseq.query/nlp-date",-145078221),new cljs.core.Keyword(null,"card-last-interval","card-last-interval",-1889773077),new cljs.core.Keyword(null,"card-repeats","card-repeats",1071489736),new cljs.core.Keyword(null,"card-last-reviewed","card-last-reviewed",-965683716),new cljs.core.Keyword(null,"card-next-schedule","card-next-schedule",2132454825),new cljs.core.Keyword(null,"card-ease-factor","card-ease-factor",-2122824488),new cljs.core.Keyword(null,"card-last-score","card-last-score",2121541607),new cljs.core.Keyword(null,"logseq.color","logseq.color",-42542213),new cljs.core.Keyword(null,"logseq.table.borders","logseq.table.borders",-1178350466),new cljs.core.Keyword(null,"logseq.table.stripes","logseq.table.stripes",1430094207),new cljs.core.Keyword(null,"logseq.table.max-width","logseq.table.max-width",-767146077),new cljs.core.Keyword(null,"logseq.table.version","logseq.table.version",63322881),new cljs.core.Keyword(null,"logseq.table.compact","logseq.table.compact",615654834),new cljs.core.Keyword(null,"logseq.table.headers","logseq.table.headers",-900536583),new cljs.core.Keyword(null,"logseq.table.hover","logseq.table.hover",-1465923417)], null);
/**
 * Updates page and block properties before their property types are inferred
 */
logseq.graph_parser.exporter.pre_update_properties = (function logseq$graph_parser$exporter$pre_update_properties(properties,class_related_properties){
var dissoced_props = cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic(logseq.graph_parser.exporter.ignored_built_in_properties,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"title","title",636505583),new cljs.core.Keyword(null,"created-at","created-at",-89248644),new cljs.core.Keyword(null,"updated-at","updated-at",-1592622336)], null),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([class_related_properties], 0));
return cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (p__131038){
var vec__131039 = p__131038;
var prop = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__131039,(0),null);
var val = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__131039,(1),null);
if((!(cljs.core.contains_QMARK_(logseq.graph_parser.exporter.file_built_in_property_names,prop)))){
if(typeof val === 'string'){
if(clojure.string.blank_QMARK_(val)){
return null;
} else {
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [prop,(function (){var or__5002__auto__ = cljs.core.parse_double(val);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return val;
}
})()], null);
}
} else {
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [prop,val], null);
}
} else {
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [prop,val], null);
}
}),cljs.core.apply.cljs$core$IFn$_invoke$arity$3(cljs.core.dissoc,properties,dissoced_props)));
});
/**
 * Returns a map of :block with updated block and :properties-tx with any properties tx.
 * Handles modifying block properties, updating classes from property-classes
 *   and removing any deprecated property related attributes. Before updating most
 *   block properties, their property schemas are inferred as that can affect how
 *   a property is updated. Only infers property schemas on user properties as
 *   built-in ones must not change
 */
logseq.graph_parser.exporter.handle_page_and_block_properties = (function logseq$graph_parser$exporter$handle_page_and_block_properties(p__131049,db,page_names_to_uuids,refs,p__131050){
var map__131051 = p__131049;
var map__131051__$1 = cljs.core.__destructure_map(map__131051);
var block = map__131051__$1;
var properties = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__131051__$1,new cljs.core.Keyword("block","properties","block/properties",708347145));
var map__131053 = p__131050;
var map__131053__$1 = cljs.core.__destructure_map(map__131053);
var options = map__131053__$1;
var map__131057 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__131053__$1,new cljs.core.Keyword(null,"user-options","user-options",-84696866));
var map__131057__$1 = cljs.core.__destructure_map(map__131057);
var property_classes = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__131057__$1,new cljs.core.Keyword(null,"property-classes","property-classes",1129964490));
var property_parent_classes = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__131057__$1,new cljs.core.Keyword(null,"property-parent-classes","property-parent-classes",1972741305));
var import_state = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__131053__$1,new cljs.core.Keyword(null,"import-state","import-state",1493794865));
var macros = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__131053__$1,new cljs.core.Keyword(null,"macros","macros",811339431));
return cljs.core.update.cljs$core$IFn$_invoke$arity$variadic(((cljs.core.seq(properties))?(function (){var classes_from_properties = cljs.core.distinct.cljs$core$IFn$_invoke$arity$1(cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (p__131073){
var vec__131074 = p__131073;
var _k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__131074,(0),null);
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__131074,(1),null);
if(cljs.core.coll_QMARK_(v)){
return v;
} else {
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [v], null);
}
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.select_keys(properties,property_classes)], 0)));
var properties_SINGLEQUOTE_ = logseq.graph_parser.exporter.pre_update_properties(properties,cljs.core.into.cljs$core$IFn$_invoke$arity$2(property_classes,property_parent_classes));
var properties_to_infer = (cljs.core.truth_(new cljs.core.Keyword(null,"template","template",-702405684).cljs$core$IFn$_invoke$arity$1(properties_SINGLEQUOTE_))?cljs.core.PersistentArrayMap.EMPTY:cljs.core.apply.cljs$core$IFn$_invoke$arity$3(cljs.core.dissoc,properties_SINGLEQUOTE_,logseq.graph_parser.exporter.file_built_in_property_names));
var property_changes = cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (p__131094){
var vec__131100 = p__131094;
var prop = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__131100,(0),null);
var val = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__131100,(1),null);
var temp__5804__auto__ = logseq.graph_parser.exporter.infer_property_schema_and_get_property_change(db,val,prop,cljs.core.get.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","properties-text-values","block/properties-text-values",1271244708).cljs$core$IFn$_invoke$arity$1(block),prop),refs,import_state,macros);
if(cljs.core.truth_(temp__5804__auto__)){
var property_change = temp__5804__auto__;
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [prop,property_change], null);
} else {
return null;
}
}),properties_to_infer));
var options_SINGLEQUOTE_ = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(options,new cljs.core.Keyword(null,"property-changes","property-changes",-938944732),property_changes);
var map__131066 = logseq.graph_parser.exporter.build_properties_and_values(properties_SINGLEQUOTE_,db,page_names_to_uuids,cljs.core.select_keys(block,new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","properties-text-values","block/properties-text-values",1271244708),new cljs.core.Keyword("block","name","block/name",1619760316),new cljs.core.Keyword("block","title","block/title",710445684),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Keyword("logseq.graph-parser.exporter","original-name","logseq.graph-parser.exporter/original-name",-559626865)], null)),options_SINGLEQUOTE_);
var map__131066__$1 = cljs.core.__destructure_map(map__131066);
var block_properties = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__131066__$1,new cljs.core.Keyword(null,"block-properties","block-properties",306554248));
var pvalues_tx = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__131066__$1,new cljs.core.Keyword(null,"pvalues-tx","pvalues-tx",-418668372));
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"block","block",664686210),(function (){var G__131109 = block;
var G__131109__$1 = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([G__131109,block_properties], 0))
;
if(cljs.core.seq(classes_from_properties)){
return cljs.core.update.cljs$core$IFn$_invoke$arity$3(G__131109__$1,new cljs.core.Keyword("block","tags","block/tags",1814948340),(function (tags){
var tags_SINGLEQUOTE_ = ((cljs.core.sequential_QMARK_(tags))?tags:cljs.core.set(tags));
return cljs.core.into.cljs$core$IFn$_invoke$arity$2(tags_SINGLEQUOTE_,cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__131043_SHARP_){
return cljs.core.PersistentHashMap.fromArrays([new cljs.core.Keyword("block.temp","new-class","block.temp/new-class",348616617)],[p1__131043_SHARP_]);
}),classes_from_properties));
}));
} else {
return G__131109__$1;
}
})(),new cljs.core.Keyword(null,"properties-tx","properties-tx",-1476843279),pvalues_tx], null);
})():new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"block","block",664686210),block,new cljs.core.Keyword(null,"properties-tx","properties-tx",-1476843279),cljs.core.PersistentVector.EMPTY], null)),new cljs.core.Keyword(null,"block","block",664686210),cljs.core.dissoc,new cljs.core.Keyword("block","properties","block/properties",708347145),new cljs.core.Keyword("block","properties-text-values","block/properties-text-values",1271244708),new cljs.core.Keyword("block","properties-order","block/properties-order",-968493873),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("block","invalid-properties","block/invalid-properties",1509592872)], 0));
});
/**
 * Adds page properties including special handling for :logseq.property/parent
 */
logseq.graph_parser.exporter.handle_page_properties = (function logseq$graph_parser$exporter$handle_page_properties(p__131116,db,p__131117,refs,p__131118){
var map__131119 = p__131116;
var map__131119__$1 = cljs.core.__destructure_map(map__131119);
var block_STAR_ = map__131119__$1;
var properties = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__131119__$1,new cljs.core.Keyword("block","properties","block/properties",708347145));
var map__131120 = p__131117;
var map__131120__$1 = cljs.core.__destructure_map(map__131120);
var page_names_to_uuids = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__131120__$1,new cljs.core.Keyword(null,"page-names-to-uuids","page-names-to-uuids",-875423247));
var classes_tx = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__131120__$1,new cljs.core.Keyword(null,"classes-tx","classes-tx",664490242));
var map__131121 = p__131118;
var map__131121__$1 = cljs.core.__destructure_map(map__131121);
var options = map__131121__$1;
var user_options = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__131121__$1,new cljs.core.Keyword(null,"user-options","user-options",-84696866));
var log_fn = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__131121__$1,new cljs.core.Keyword(null,"log-fn","log-fn",-2003241282));
var import_state = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__131121__$1,new cljs.core.Keyword(null,"import-state","import-state",1493794865));
var map__131124 = logseq.graph_parser.exporter.handle_page_and_block_properties(block_STAR_,db,page_names_to_uuids,refs,options);
var map__131124__$1 = cljs.core.__destructure_map(map__131124);
var block = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__131124__$1,new cljs.core.Keyword(null,"block","block",664686210));
var properties_tx = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__131124__$1,new cljs.core.Keyword(null,"properties-tx","properties-tx",-1476843279));
var block_SINGLEQUOTE_ = (function (){var temp__5802__auto__ = cljs.core.seq(cljs.core.distinct.cljs$core$IFn$_invoke$arity$1(cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (p__131125){
var vec__131127 = p__131125;
var _k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__131127,(0),null);
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__131127,(1),null);
if(cljs.core.coll_QMARK_(v)){
return v;
} else {
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [v], null);
}
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.select_keys(properties,new cljs.core.Keyword(null,"property-parent-classes","property-parent-classes",1972741305).cljs$core$IFn$_invoke$arity$1(user_options))], 0))));
if(temp__5802__auto__){
var parent_classes_from_properties = temp__5802__auto__;
var _ = cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$3(new cljs.core.Keyword(null,"classes-from-property-parents","classes-from-property-parents",371081959).cljs$core$IFn$_invoke$arity$1(import_state),cljs.core.conj,new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(block_STAR_));
var class_m = logseq.graph_parser.exporter.find_or_create_class.cljs$core$IFn$_invoke$arity$4(db,cljs.core.some_fn.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("logseq.graph-parser.exporter","original-title","logseq.graph-parser.exporter/original-title",881456337),new cljs.core.Keyword("block","title","block/title",710445684))(block),new cljs.core.Keyword(null,"all-idents","all-idents",-980997938).cljs$core$IFn$_invoke$arity$1(import_state),block);
var class_m_SINGLEQUOTE_ = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([block,class_m], 0)),new cljs.core.Keyword("logseq.property","parent","logseq.property/parent",177984509),(function (){var new_class = cljs.core.first(parent_classes_from_properties);
var class_m__$1 = logseq.graph_parser.exporter.find_or_create_class.cljs$core$IFn$_invoke$arity$3(db,new_class,new cljs.core.Keyword(null,"all-idents","all-idents",-980997938).cljs$core$IFn$_invoke$arity$1(import_state));
var class_m_SINGLEQUOTE_ = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([class_m__$1,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),logseq.graph_parser.exporter.find_or_gen_class_uuid(page_names_to_uuids,logseq.common.util.page_name_sanity_lc(new_class),new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(class_m__$1))], null)], 0));
if((cljs.core.count(parent_classes_from_properties) > (1))){
(log_fn.cljs$core$IFn$_invoke$arity$4 ? log_fn.cljs$core$IFn$_invoke$arity$4(new cljs.core.Keyword(null,"skipped-parent-classes","skipped-parent-classes",276764793),"Only one parent class is allowed so skipped ones after the first one",new cljs.core.Keyword(null,"classes","classes",2037804510),parent_classes_from_properties) : log_fn.call(null,new cljs.core.Keyword(null,"skipped-parent-classes","skipped-parent-classes",276764793),"Only one parent class is allowed so skipped ones after the first one",new cljs.core.Keyword(null,"classes","classes",2037804510),parent_classes_from_properties));
} else {
}

if(cljs.core.truth_(new cljs.core.Keyword(null,"new-class?","new-class?",1140916821).cljs$core$IFn$_invoke$arity$1(cljs.core.meta(class_m__$1)))){
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$3(classes_tx,cljs.core.conj,class_m_SINGLEQUOTE_);
} else {
}

return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(class_m_SINGLEQUOTE_)], null);
})());
return class_m_SINGLEQUOTE_;
} else {
return block;
}
})();
var block_SINGLEQUOTE__SINGLEQUOTE_ = logseq.graph_parser.exporter.replace_namespace_with_parent(block_SINGLEQUOTE_,page_names_to_uuids);
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"block","block",664686210),block_SINGLEQUOTE__SINGLEQUOTE_,new cljs.core.Keyword(null,"properties-tx","properties-tx",-1476843279),properties_tx], null);
});
/**
 * Remove list of keys from a given map string while preserving whitespace
 */
logseq.graph_parser.exporter.pretty_print_dissoc = (function logseq$graph_parser$exporter$pretty_print_dissoc(s,dissoc_keys){
return cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.reduce.cljs$core$IFn$_invoke$arity$3(borkdude.rewrite_edn.dissoc,borkdude.rewrite_edn.parse_string(s),dissoc_keys));
});
logseq.graph_parser.exporter.migrate_advanced_query_string = (function logseq$graph_parser$exporter$migrate_advanced_query_string(query_str){
try{return logseq.graph_parser.exporter.pretty_print_dissoc(query_str,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"title","title",636505583),new cljs.core.Keyword(null,"group-by-page?","group-by-page?",1520059448),new cljs.core.Keyword(null,"collapsed?","collapsed?",-1661420674)], null));
}catch (e131138){var _e = e131138;
console.error("Failed to parse advanced query string. Falling back to full query string: ",cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([query_str], 0)));

var temp__5802__auto__ = cljs.core.not_empty(logseq.common.util.safe_read_map_string.cljs$core$IFn$_invoke$arity$1(query_str));
if(cljs.core.truth_(temp__5802__auto__)){
var query_map = temp__5802__auto__;
return cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.dissoc.cljs$core$IFn$_invoke$arity$variadic(query_map,new cljs.core.Keyword(null,"title","title",636505583),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"group-by-page?","group-by-page?",1520059448),new cljs.core.Keyword(null,"collapsed?","collapsed?",-1661420674)], 0))], 0));
} else {
return query_str;
}
}});
/**
 * Does everything page properties does and updates a couple of block specific attributes
 */
logseq.graph_parser.exporter.handle_block_properties = (function logseq$graph_parser$exporter$handle_block_properties(p__131146,db,page_names_to_uuids,refs,p__131147){
var map__131152 = p__131146;
var map__131152__$1 = cljs.core.__destructure_map(map__131152);
var block_STAR_ = map__131152__$1;
var title = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__131152__$1,new cljs.core.Keyword("block","title","block/title",710445684));
var map__131153 = p__131147;
var map__131153__$1 = cljs.core.__destructure_map(map__131153);
var options = map__131153__$1;
var map__131154 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__131153__$1,new cljs.core.Keyword(null,"user-options","user-options",-84696866));
var map__131154__$1 = cljs.core.__destructure_map(map__131154);
var property_classes = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__131154__$1,new cljs.core.Keyword(null,"property-classes","property-classes",1129964490));
var map__131156 = logseq.graph_parser.exporter.handle_page_and_block_properties(block_STAR_,db,page_names_to_uuids,refs,options);
var map__131156__$1 = cljs.core.__destructure_map(map__131156);
var block = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__131156__$1,new cljs.core.Keyword(null,"block","block",664686210));
var properties_tx = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__131156__$1,new cljs.core.Keyword(null,"properties-tx","properties-tx",-1476843279));
var advanced_query = (function (){var G__131163 = cljs.core.second(cljs.core.re_find(/#\+BEGIN_QUERY(.*)#\+END_QUERY/s,title));
if((G__131163 == null)){
return null;
} else {
return clojure.string.trim(G__131163);
}
})();
var additional_props = (function (){var G__131164 = cljs.core.PersistentArrayMap.EMPTY;
var G__131164__$1 = ((logseq.common.util.macro.query_macro_QMARK_(title))?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__131164,new cljs.core.Keyword("logseq.property","query","logseq.property/query",-97414126),(function (){var or__5002__auto__ = (function (){var G__131169 = cljs.core.second(cljs.core.re_find(/\{\{query(.*)\}\}/,title));
if((G__131169 == null)){
return null;
} else {
return clojure.string.trim(G__131169);
}
})();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return title;
}
})()):G__131164);
if(cljs.core.seq(advanced_query)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__131164__$1,new cljs.core.Keyword("logseq.property","query","logseq.property/query",-97414126),logseq.graph_parser.exporter.migrate_advanced_query_string(advanced_query));
} else {
return G__131164__$1;
}
})();
var map__131157 = ((cljs.core.seq(additional_props))?logseq.graph_parser.exporter.build_properties_and_values(additional_props,db,page_names_to_uuids,cljs.core.select_keys(block,new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","properties-text-values","block/properties-text-values",1271244708),new cljs.core.Keyword("block","name","block/name",1619760316),new cljs.core.Keyword("block","title","block/title",710445684),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552)], null)),options):null);
var map__131157__$1 = cljs.core.__destructure_map(map__131157);
var block_properties = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__131157__$1,new cljs.core.Keyword(null,"block-properties","block-properties",306554248));
var pvalues_tx = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__131157__$1,new cljs.core.Keyword(null,"pvalues-tx","pvalues-tx",-418668372));
var pvalues_tx_SINGLEQUOTE_ = (cljs.core.truth_((function (){var and__5000__auto__ = pvalues_tx;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.seq(advanced_query);
} else {
return and__5000__auto__;
}
})())?cljs.core.concat.cljs$core$IFn$_invoke$arity$2(pvalues_tx,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),cljs.core.second(new cljs.core.Keyword("logseq.property","query","logseq.property/query",-97414126).cljs$core$IFn$_invoke$arity$1(block_properties)),new cljs.core.Keyword("logseq.property.code","lang","logseq.property.code/lang",-857897165),"clojure",new cljs.core.Keyword("logseq.property.node","display-type","logseq.property.node/display-type",442446189),new cljs.core.Keyword(null,"code","code",1586293142)], null)], null)):pvalues_tx);
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"block","block",664686210),(function (){var G__131173 = block;
var G__131173__$1 = ((cljs.core.seq(block_properties))?cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([G__131173,block_properties], 0)):G__131173);
var G__131173__$2 = ((logseq.common.util.macro.query_macro_QMARK_(title))?(function (b){
return cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.update.cljs$core$IFn$_invoke$arity$4(b,new cljs.core.Keyword("block","tags","block/tags",1814948340),cljs.core.fnil.cljs$core$IFn$_invoke$arity$2(cljs.core.conj,cljs.core.PersistentVector.EMPTY),new cljs.core.Keyword("logseq.class","Query","logseq.class/Query",-232480166)),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("block","title","block/title",710445684),clojure.string.trim(clojure.string.replace_first(title,/\{\{query(.*)\}\}/,""))], null)], 0));
})(G__131173__$1):G__131173__$1);
var G__131173__$3 = ((cljs.core.seq(advanced_query))?(function (b){
var query_map = logseq.common.util.safe_read_map_string.cljs$core$IFn$_invoke$arity$1(advanced_query);
var G__131176 = cljs.core.update.cljs$core$IFn$_invoke$arity$4(b,new cljs.core.Keyword("block","tags","block/tags",1814948340),cljs.core.fnil.cljs$core$IFn$_invoke$arity$2(cljs.core.conj,cljs.core.PersistentVector.EMPTY),new cljs.core.Keyword("logseq.class","Query","logseq.class/Query",-232480166));
var G__131176__$1 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__131176,new cljs.core.Keyword("block","title","block/title",710445684),(function (){var or__5002__auto__ = (function (){var temp__5804__auto__ = new cljs.core.Keyword(null,"title","title",636505583).cljs$core$IFn$_invoke$arity$1(query_map);
if(cljs.core.truth_(temp__5804__auto__)){
var title_SINGLEQUOTE_ = temp__5804__auto__;
if(typeof title_SINGLEQUOTE_ === 'string'){
return title_SINGLEQUOTE_;
} else {
return cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([title_SINGLEQUOTE_], 0));
}
} else {
return null;
}
})();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return clojure.string.trim(clojure.string.replace_first(title,/#\+BEGIN_QUERY(.*)#\+END_QUERY/s,""));
}
})())
;
if(cljs.core.truth_(new cljs.core.Keyword(null,"collapsed?","collapsed?",-1661420674).cljs$core$IFn$_invoke$arity$1(query_map))){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__131176__$1,new cljs.core.Keyword("block","collapsed?","block/collapsed?",2140210991),true);
} else {
return G__131176__$1;
}
})(G__131173__$2):G__131173__$2);
if(((cljs.core.seq(property_classes)) && (cljs.core.seq(new cljs.core.Keyword("block","refs","block/refs",-1214495349).cljs$core$IFn$_invoke$arity$1(block_STAR_))))){
return cljs.core.update.cljs$core$IFn$_invoke$arity$3(G__131173__$3,new cljs.core.Keyword("block","refs","block/refs",-1214495349),(function (refs__$1){
return cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (p1__131141_SHARP_){
var G__131187 = cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","name","block/name",1619760316).cljs$core$IFn$_invoke$arity$1(p1__131141_SHARP_));
return (property_classes.cljs$core$IFn$_invoke$arity$1 ? property_classes.cljs$core$IFn$_invoke$arity$1(G__131187) : property_classes.call(null,G__131187));
}),refs__$1);
}));
} else {
return G__131173__$3;
}
})(),new cljs.core.Keyword(null,"properties-tx","properties-tx",-1476843279),cljs.core.concat.cljs$core$IFn$_invoke$arity$2(properties_tx,(cljs.core.truth_(pvalues_tx_SINGLEQUOTE_)?pvalues_tx_SINGLEQUOTE_:null))], null);
});
/**
 * Updates the attributes of a block ref as this is where a new page is defined. Also
 * updates block content effected by refs
 */
logseq.graph_parser.exporter.update_block_refs = (function logseq$graph_parser$exporter$update_block_refs(block,page_names_to_uuids,p__131196){
var map__131197 = p__131196;
var map__131197__$1 = cljs.core.__destructure_map(map__131197);
var whiteboard_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__131197__$1,new cljs.core.Keyword(null,"whiteboard?","whiteboard?",-1968190788));
var ref_to_ignore_QMARK_ = (cljs.core.truth_(whiteboard_QMARK_)?(function (p1__131188_SHARP_){
var and__5000__auto__ = cljs.core.map_QMARK_(p1__131188_SHARP_);
if(and__5000__auto__){
return new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(p1__131188_SHARP_);
} else {
return and__5000__auto__;
}
}):(function (p1__131189_SHARP_){
return ((cljs.core.vector_QMARK_(p1__131189_SHARP_)) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),cljs.core.first(p1__131189_SHARP_))));
}));
if(cljs.core.seq(new cljs.core.Keyword("block","refs","block/refs",-1214495349).cljs$core$IFn$_invoke$arity$1(block))){
var G__131203 = block;
var G__131203__$1 = cljs.core.update.cljs$core$IFn$_invoke$arity$3(G__131203,new cljs.core.Keyword("block","refs","block/refs",-1214495349),(function (refs){
return cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (ref){
if(cljs.core.map_QMARK_(ref)){
var temp__5802__auto__ = (function (){var G__131204 = new cljs.core.Keyword("block","name","block/name",1619760316).cljs$core$IFn$_invoke$arity$1(ref);
if((G__131204 == null)){
return null;
} else {
return cljs.core.get.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(page_names_to_uuids),G__131204);
}
})();
if(cljs.core.truth_(temp__5802__auto__)){
var existing_uuid = temp__5802__auto__;
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),existing_uuid], null);
} else {
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(ref)], null);
}
} else {
return ref;
}
}),refs);
}))
;
if(cljs.core.truth_(new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(block))){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__131203__$1,new cljs.core.Keyword("block","title","block/title",710445684),(function (){var refs = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__131191_SHARP_){
return logseq.graph_parser.exporter.add_uuid_to_page_map(p1__131191_SHARP_,page_names_to_uuids);
}),cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (p1__131190_SHARP_){
var or__5002__auto__ = ref_to_ignore_QMARK_(p1__131190_SHARP_);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return (((p1__131190_SHARP_ instanceof cljs.core.Keyword)) && (logseq.db.frontend.malli_schema.internal_ident_QMARK_(p1__131190_SHARP_)));
}
}),new cljs.core.Keyword("block","refs","block/refs",-1214495349).cljs$core$IFn$_invoke$arity$1(block)));
return logseq.db.frontend.content.title_ref__GT_id_ref.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(block),refs,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"replace-tag?","replace-tag?",-1653793949),false], null)], 0));
})());
} else {
return G__131203__$1;
}
} else {
return block;
}
});
/**
 * Point pre-block children to parents since pre blocks don't exist in db graphs
 */
logseq.graph_parser.exporter.fix_pre_block_references = (function logseq$graph_parser$exporter$fix_pre_block_references(p__131213,pre_blocks,page_names_to_uuids){
var map__131214 = p__131213;
var map__131214__$1 = cljs.core.__destructure_map(map__131214);
var block = map__131214__$1;
var parent = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__131214__$1,new cljs.core.Keyword("block","parent","block/parent",-918309064));
var G__131216 = block;
if(((cljs.core.vector_QMARK_(parent)) && (cljs.core.contains_QMARK_(pre_blocks,cljs.core.second(parent))))){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__131216,new cljs.core.Keyword("block","parent","block/parent",-918309064),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),logseq.graph_parser.exporter.get_page_uuid(page_names_to_uuids,cljs.core.second(new cljs.core.Keyword("block","page","block/page",822314108).cljs$core$IFn$_invoke$arity$1(block)),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"block","block",664686210),block,new cljs.core.Keyword("block","page","block/page",822314108),new cljs.core.Keyword("block","page","block/page",822314108).cljs$core$IFn$_invoke$arity$1(block)], null))], null));
} else {
return G__131216;
}
});
/**
 * Some graph-parser attributes return :block/name as a lookup ref. This fixes
 *   those to use uuids since block/name is not unique for db graphs
 */
logseq.graph_parser.exporter.fix_block_name_lookup_ref = (function logseq$graph_parser$exporter$fix_block_name_lookup_ref(block,page_names_to_uuids){
var G__131224 = block;
var G__131224__$1 = ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","name","block/name",1619760316),cljs.core.first(new cljs.core.Keyword("block","page","block/page",822314108).cljs$core$IFn$_invoke$arity$1(block))))?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__131224,new cljs.core.Keyword("block","page","block/page",822314108),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),logseq.graph_parser.exporter.get_page_uuid(page_names_to_uuids,cljs.core.second(new cljs.core.Keyword("block","page","block/page",822314108).cljs$core$IFn$_invoke$arity$1(block)),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"block","block",664686210),block,new cljs.core.Keyword("block","page","block/page",822314108),new cljs.core.Keyword("block","page","block/page",822314108).cljs$core$IFn$_invoke$arity$1(block)], null))], null)):G__131224);
if(cljs.core.truth_(new cljs.core.Keyword("block","name","block/name",1619760316).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","parent","block/parent",-918309064).cljs$core$IFn$_invoke$arity$1(block)))){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__131224__$1,new cljs.core.Keyword("block","parent","block/parent",-918309064),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),logseq.graph_parser.exporter.get_page_uuid(page_names_to_uuids,new cljs.core.Keyword("block","name","block/name",1619760316).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","parent","block/parent",-918309064).cljs$core$IFn$_invoke$arity$1(block)),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"block","block",664686210),block,new cljs.core.Keyword("block","parent","block/parent",-918309064),new cljs.core.Keyword("block","parent","block/parent",-918309064).cljs$core$IFn$_invoke$arity$1(block)], null))], null));
} else {
return G__131224__$1;
}
});
logseq.graph_parser.exporter.build_block_tx = (function logseq$graph_parser$exporter$build_block_tx(db,block_STAR_,pre_blocks,p__131229,p__131230){
var map__131232 = p__131229;
var map__131232__$1 = cljs.core.__destructure_map(map__131232);
var per_file_state = map__131232__$1;
var page_names_to_uuids = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__131232__$1,new cljs.core.Keyword(null,"page-names-to-uuids","page-names-to-uuids",-875423247));
var map__131233 = p__131230;
var map__131233__$1 = cljs.core.__destructure_map(map__131233);
var options = map__131233__$1;
var import_state = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__131233__$1,new cljs.core.Keyword(null,"import-state","import-state",1493794865));
var journal_created_ats = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__131233__$1,new cljs.core.Keyword(null,"journal-created-ats","journal-created-ats",339724852));
var map__131238 = logseq.graph_parser.exporter.handle_block_properties(block_STAR_,db,page_names_to_uuids,new cljs.core.Keyword("block","refs","block/refs",-1214495349).cljs$core$IFn$_invoke$arity$1(block_STAR_),options);
var map__131238__$1 = cljs.core.__destructure_map(map__131238);
var block = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__131238__$1,new cljs.core.Keyword(null,"block","block",664686210));
var properties_tx = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__131238__$1,new cljs.core.Keyword(null,"properties-tx","properties-tx",-1476843279));
var map__131239 = logseq.graph_parser.exporter.update_block_deadline(block,page_names_to_uuids,options);
var map__131239__$1 = cljs.core.__destructure_map(map__131239);
var block_after_built_in_props = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__131239__$1,new cljs.core.Keyword(null,"block","block",664686210));
var deadline_properties_tx = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__131239__$1,new cljs.core.Keyword(null,"properties-tx","properties-tx",-1476843279));
var journal_page_created_at = (function (){var G__131240 = new cljs.core.Keyword("block","page","block/page",822314108).cljs$core$IFn$_invoke$arity$1(block_STAR_);
var G__131240__$1 = (((G__131240 == null))?null:cljs.core.second(G__131240));
if((G__131240__$1 == null)){
return null;
} else {
return (journal_created_ats.cljs$core$IFn$_invoke$arity$1 ? journal_created_ats.cljs$core$IFn$_invoke$arity$1(G__131240__$1) : journal_created_ats.call(null,G__131240__$1));
}
})();
var prepared_block = (function (){var G__131245 = block_after_built_in_props;
if(cljs.core.truth_(journal_page_created_at)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__131245,new cljs.core.Keyword("block","created-at","block/created-at",1440015),journal_page_created_at);
} else {
return G__131245;
}
})();
var block_SINGLEQUOTE_ = cljs.core.dissoc.cljs$core$IFn$_invoke$arity$variadic(logseq.graph_parser.exporter.add_missing_timestamps(logseq.graph_parser.exporter.update_block_priority(logseq.graph_parser.exporter.update_block_marker(logseq.graph_parser.exporter.update_block_tags(logseq.graph_parser.exporter.update_block_refs(logseq.graph_parser.exporter.fix_block_name_lookup_ref(logseq.graph_parser.exporter.fix_pre_block_references(prepared_block,pre_blocks,page_names_to_uuids),page_names_to_uuids),page_names_to_uuids,options),db,new cljs.core.Keyword(null,"user-options","user-options",-84696866).cljs$core$IFn$_invoke$arity$1(options),per_file_state,new cljs.core.Keyword(null,"all-idents","all-idents",-980997938).cljs$core$IFn$_invoke$arity$1(import_state)),options),options)),new cljs.core.Keyword("block","left","block/left",-443712566),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("block","format","block/format",-1212045901)], 0));
return cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic(properties_tx,deadline_properties_tx,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [block_SINGLEQUOTE_], null)], 0));
});
logseq.graph_parser.exporter.update_page_alias = (function logseq$graph_parser$exporter$update_page_alias(m,page_names_to_uuids){
return cljs.core.update.cljs$core$IFn$_invoke$arity$3(m,new cljs.core.Keyword("block","alias","block/alias",-2112644699),(function (aliases){
return cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__131247_SHARP_){
return (new cljs.core.PersistentVector(null,2,(5),cljs.core.PersistentVector.EMPTY_NODE,[new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),logseq.graph_parser.exporter.get_page_uuid(page_names_to_uuids,new cljs.core.Keyword("block","name","block/name",1619760316).cljs$core$IFn$_invoke$arity$1(p1__131247_SHARP_),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"block","block",664686210),p1__131247_SHARP_], null))],null));
}),aliases);
}));
});
logseq.graph_parser.exporter.build_new_page_or_class = (function logseq$graph_parser$exporter$build_new_page_or_class(m,db,per_file_state,all_idents,p__131255){
var map__131256 = p__131255;
var map__131256__$1 = cljs.core.__destructure_map(map__131256);
var user_options = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__131256__$1,new cljs.core.Keyword(null,"user-options","user-options",-84696866));
var journal_created_ats = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__131256__$1,new cljs.core.Keyword(null,"journal-created-ats","journal-created-ats",339724852));
return logseq.graph_parser.exporter.update_page_tags(cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(logseq.graph_parser.exporter.add_missing_timestamps((function (){var G__131257 = m;
var G__131257__$1 = ((cljs.core.not(new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(m)))?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__131257,new cljs.core.Keyword("block","title","block/title",710445684),new cljs.core.Keyword("block","name","block/name",1619760316).cljs$core$IFn$_invoke$arity$1(m)):G__131257);
var G__131257__$2 = ((cljs.core.seq(new cljs.core.Keyword("block","alias","block/alias",-2112644699).cljs$core$IFn$_invoke$arity$1(m)))?logseq.graph_parser.exporter.update_page_alias(G__131257__$1,new cljs.core.Keyword(null,"page-names-to-uuids","page-names-to-uuids",-875423247).cljs$core$IFn$_invoke$arity$1(per_file_state)):G__131257__$1);
if(cljs.core.truth_((function (){var G__131258 = new cljs.core.Keyword("block","name","block/name",1619760316).cljs$core$IFn$_invoke$arity$1(m);
return (journal_created_ats.cljs$core$IFn$_invoke$arity$1 ? journal_created_ats.cljs$core$IFn$_invoke$arity$1(G__131258) : journal_created_ats.call(null,G__131258));
})())){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__131257__$2,new cljs.core.Keyword("block","created-at","block/created-at",1440015),(function (){var G__131259 = new cljs.core.Keyword("block","name","block/name",1619760316).cljs$core$IFn$_invoke$arity$1(m);
return (journal_created_ats.cljs$core$IFn$_invoke$arity$1 ? journal_created_ats.cljs$core$IFn$_invoke$arity$1(G__131259) : journal_created_ats.call(null,G__131259));
})());
} else {
return G__131257__$2;
}
})()),new cljs.core.Keyword("block","whiteboard?","block/whiteboard?",-2012737713)),db,user_options,per_file_state,all_idents);
});
/**
 * Like ldb/get-page-parents but using all-existing-page-uuids
 */
logseq.graph_parser.exporter.get_page_parents = (function logseq$graph_parser$exporter$get_page_parents(node,all_existing_page_uuids){
var get_parent = (function logseq$graph_parser$exporter$get_page_parents_$_get_parent(n){
if(cljs.core.truth_(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("logseq.property","parent","logseq.property/parent",177984509).cljs$core$IFn$_invoke$arity$1(n)))){
var or__5002__auto__ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(all_existing_page_uuids,new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("logseq.property","parent","logseq.property/parent",177984509).cljs$core$IFn$_invoke$arity$1(n)));
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2(["No parent page found for ",cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("logseq.property","parent","logseq.property/parent",177984509).cljs$core$IFn$_invoke$arity$1(n))], 0))].join(''),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"node","node",581201198),n], null));
}
} else {
return null;
}
});
var temp__5804__auto__ = get_parent(node);
if(cljs.core.truth_(temp__5804__auto__)){
var parent = temp__5804__auto__;
var current_parent = parent;
var parents_SINGLEQUOTE_ = cljs.core.PersistentVector.EMPTY;
while(true){
if(cljs.core.truth_((function (){var and__5000__auto__ = current_parent;
if(cljs.core.truth_(and__5000__auto__)){
return (!(cljs.core.contains_QMARK_(parents_SINGLEQUOTE_,current_parent)));
} else {
return and__5000__auto__;
}
})())){
var G__132298 = get_parent(current_parent);
var G__132299 = cljs.core.conj.cljs$core$IFn$_invoke$arity$2(parents_SINGLEQUOTE_,current_parent);
current_parent = G__132298;
parents_SINGLEQUOTE_ = G__132299;
continue;
} else {
return cljs.core.vec(cljs.core.reverse(parents_SINGLEQUOTE_));
}
break;
}
} else {
return null;
}
});
/**
 * Returns a map of unique page names mapped to their uuids. The page names
 * are in a format that is compatible with extract/extract e.g. namespace pages have
 * their full hierarchy in the name
 */
logseq.graph_parser.exporter.get_all_existing_page_uuids = (function logseq$graph_parser$exporter$get_all_existing_page_uuids(classes_from_property_parents,all_existing_page_uuids){
return cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p__131280){
var vec__131281 = p__131280;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__131281,(0),null);
var p = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__131281,(1),null);
return (new cljs.core.PersistentVector(null,2,(5),cljs.core.PersistentVector.EMPTY_NODE,[(function (){var temp__5802__auto__ = (function (){var and__5000__auto__ = ((cljs.core.contains_QMARK_(new cljs.core.Keyword("block","tags","block/tags",1814948340).cljs$core$IFn$_invoke$arity$1(p),new cljs.core.Keyword("logseq.class","Tag","logseq.class/Tag",-538902083))) || (cljs.core.contains_QMARK_(new cljs.core.Keyword("block","tags","block/tags",1814948340).cljs$core$IFn$_invoke$arity$1(p),new cljs.core.Keyword("logseq.class","Page","logseq.class/Page",1484340329))));
if(and__5000__auto__){
var and__5000__auto____$1 = (!(cljs.core.contains_QMARK_(classes_from_property_parents,new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(p))));
if(and__5000__auto____$1){
return logseq.graph_parser.exporter.get_page_parents(p,all_existing_page_uuids);
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5802__auto__)){
var parents = temp__5802__auto__;
return clojure.string.join.cljs$core$IFn$_invoke$arity$2(logseq.common.util.namespace.namespace_char,cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","name","block/name",1619760316),cljs.core.conj.cljs$core$IFn$_invoke$arity$2(cljs.core.vec(parents),p)));
} else {
return new cljs.core.Keyword("block","name","block/name",1619760316).cljs$core$IFn$_invoke$arity$1(p);
}
})(),(function (){var or__5002__auto__ = new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(p);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2(["No uuid for existing page ",cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("block","name","block/name",1619760316).cljs$core$IFn$_invoke$arity$1(p)], 0))].join(''),cljs.core.select_keys(p,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","name","block/name",1619760316),new cljs.core.Keyword("block","tags","block/tags",1814948340)], null)));
}
})()],null));
}),all_existing_page_uuids));
});
logseq.graph_parser.exporter.build_existing_page = (function logseq$graph_parser$exporter$build_existing_page(m,db,page_uuid,p__131293,p__131294){
var map__131296 = p__131293;
var map__131296__$1 = cljs.core.__destructure_map(map__131296);
var per_file_state = map__131296__$1;
var page_names_to_uuids = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__131296__$1,new cljs.core.Keyword(null,"page-names-to-uuids","page-names-to-uuids",-875423247));
var map__131297 = p__131294;
var map__131297__$1 = cljs.core.__destructure_map(map__131297);
var options = map__131297__$1;
var notify_user = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__131297__$1,new cljs.core.Keyword(null,"notify-user","notify-user",-268964208));
var import_state = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__131297__$1,new cljs.core.Keyword(null,"import-state","import-state",1493794865));
var disallowed_attributes = new cljs.core.PersistentVector(null, 7, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","name","block/name",1619760316),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Keyword("block","format","block/format",-1212045901),new cljs.core.Keyword("block","title","block/title",710445684),new cljs.core.Keyword("block","journal-day","block/journal-day",-145748366),new cljs.core.Keyword("block","created-at","block/created-at",1440015),new cljs.core.Keyword("block","updated-at","block/updated-at",-1516550551)], null);
var allowed_attributes = cljs.core.into.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","tags","block/tags",1814948340),new cljs.core.Keyword("block","alias","block/alias",-2112644699),new cljs.core.Keyword("logseq.property","parent","logseq.property/parent",177984509),new cljs.core.Keyword("db","ident","db/ident",-737096)], null),cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (p1__131287_SHARP_){
if(logseq.db.frontend.malli_schema.user_property_QMARK_(cljs.core.key(p1__131287_SHARP_))){
return cljs.core.key(p1__131287_SHARP_);
} else {
return null;
}
}),m));
var block_changes = cljs.core.select_keys(m,allowed_attributes);
var temp__5804__auto___132303 = cljs.core.not_empty(cljs.core.apply.cljs$core$IFn$_invoke$arity$3(cljs.core.dissoc,m,cljs.core.into.cljs$core$IFn$_invoke$arity$2(disallowed_attributes,allowed_attributes)));
if(cljs.core.truth_(temp__5804__auto___132303)){
var ignored_attrs_132304 = temp__5804__auto___132303;
var G__131304_132305 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"msg","msg",-1386103444),["Import ignored the following attributes on page ",cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(m)], 0)),": ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(ignored_attrs_132304)].join('')], null);
(notify_user.cljs$core$IFn$_invoke$arity$1 ? notify_user.cljs$core$IFn$_invoke$arity$1(G__131304_132305) : notify_user.call(null,G__131304_132305));
} else {
}

if(cljs.core.seq(block_changes)){
var G__131305 = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([block_changes,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),page_uuid], null)], 0));
var G__131305__$1 = ((cljs.core.seq(new cljs.core.Keyword("block","alias","block/alias",-2112644699).cljs$core$IFn$_invoke$arity$1(m)))?logseq.graph_parser.exporter.update_page_alias(G__131305,page_names_to_uuids):G__131305);
if(cljs.core.truth_(new cljs.core.Keyword("block","tags","block/tags",1814948340).cljs$core$IFn$_invoke$arity$1(m))){
return logseq.graph_parser.exporter.update_page_tags(G__131305__$1,db,new cljs.core.Keyword(null,"user-options","user-options",-84696866).cljs$core$IFn$_invoke$arity$1(options),per_file_state,new cljs.core.Keyword(null,"all-idents","all-idents",-980997938).cljs$core$IFn$_invoke$arity$1(import_state));
} else {
return G__131305__$1;
}
} else {
return null;
}
});
/**
 * Modifies page tx from graph-parser for use with DB graphs. Currently modifies
 *   namespaces and blocks with built-in page names
 */
logseq.graph_parser.exporter.modify_page_tx = (function logseq$graph_parser$exporter$modify_page_tx(page,all_existing_page_uuids){
var page_SINGLEQUOTE_ = ((cljs.core.contains_QMARK_(all_existing_page_uuids,new cljs.core.Keyword("block","name","block/name",1619760316).cljs$core$IFn$_invoke$arity$1(page)))?(function (){var G__131320 = page;
if(cljs.core.truth_(new cljs.core.Keyword("block","namespace","block/namespace",-282500695).cljs$core$IFn$_invoke$arity$1(page))){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__131320,new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),(function (){var or__5002__auto__ = (function (){var G__131322 = new cljs.core.Keyword("block","name","block/name",1619760316).cljs$core$IFn$_invoke$arity$1(page);
return (all_existing_page_uuids.cljs$core$IFn$_invoke$arity$1 ? all_existing_page_uuids.cljs$core$IFn$_invoke$arity$1(G__131322) : all_existing_page_uuids.call(null,G__131322));
})();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2(["No uuid found for existing namespace page ",cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("block","name","block/name",1619760316).cljs$core$IFn$_invoke$arity$1(page)], 0))].join(''),cljs.core.select_keys(page,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","name","block/name",1619760316),new cljs.core.Keyword("block","namespace","block/namespace",-282500695)], null)));
}
})());
} else {
return G__131320;
}
})():(function (){var G__131325 = page;
var G__131325__$1 = ((cljs.core.contains_QMARK_(logseq.graph_parser.exporter.all_built_in_names,cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","name","block/name",1619760316).cljs$core$IFn$_invoke$arity$1(page))))?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__131325,new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),(datascript.core.squuid.cljs$core$IFn$_invoke$arity$0 ? datascript.core.squuid.cljs$core$IFn$_invoke$arity$0() : datascript.core.squuid.call(null))):G__131325);
if(((cljs.core.contains_QMARK_(logseq.graph_parser.exporter.all_built_in_names,cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","name","block/name",1619760316).cljs$core$IFn$_invoke$arity$1(page)))) && (cljs.core.not(new cljs.core.Keyword("block","tags","block/tags",1814948340).cljs$core$IFn$_invoke$arity$1(page))))){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__131325__$1,new cljs.core.Keyword("block","tags","block/tags",1814948340),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("logseq.class","Page","logseq.class/Page",1484340329)], null));
} else {
return G__131325__$1;
}
})());
var G__131329 = page_SINGLEQUOTE_;
var G__131329__$1 = cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(G__131329,new cljs.core.Keyword("block","format","block/format",-1212045901))
;
if(cljs.core.truth_(new cljs.core.Keyword("block","namespace","block/namespace",-282500695).cljs$core$IFn$_invoke$arity$1(page))){
return (function (block_SINGLEQUOTE_){
return cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([logseq.graph_parser.exporter.build_new_namespace_page(block_SINGLEQUOTE_),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("logseq.graph-parser.exporter","original-name","logseq.graph-parser.exporter/original-name",-559626865),new cljs.core.Keyword("block","name","block/name",1619760316).cljs$core$IFn$_invoke$arity$1(block_SINGLEQUOTE_),new cljs.core.Keyword("logseq.graph-parser.exporter","original-title","logseq.graph-parser.exporter/original-title",881456337),new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(block_SINGLEQUOTE_)], null)], 0));
})(G__131329__$1);
} else {
return G__131329__$1;
}
});
/**
 * Given all the pages and blocks parsed from a file, return a map containing
 *   all non-whiteboard pages to be transacted, pages' properties and additional
 *   data for subsequent steps
 */
logseq.graph_parser.exporter.build_pages_tx = (function logseq$graph_parser$exporter$build_pages_tx(conn,pages,blocks,p__131340){
var map__131342 = p__131340;
var map__131342__$1 = cljs.core.__destructure_map(map__131342);
var options = map__131342__$1;
var import_state = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__131342__$1,new cljs.core.Keyword(null,"import-state","import-state",1493794865));
var user_options = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__131342__$1,new cljs.core.Keyword(null,"user-options","user-options",-84696866));
var all_pages_STAR_ = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__131333_SHARP_){
return cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(p1__131333_SHARP_,new cljs.core.Keyword("block","file","block/file",183171933));
}),cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (p1__131332_SHARP_){
return ((cljs.core.contains_QMARK_(cljs.core.into.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"property-classes","property-classes",1129964490).cljs$core$IFn$_invoke$arity$1(user_options),new cljs.core.Keyword(null,"property-parent-classes","property-parent-classes",1972741305).cljs$core$IFn$_invoke$arity$1(user_options)),cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","name","block/name",1619760316).cljs$core$IFn$_invoke$arity$1(p1__131332_SHARP_)))) && (cljs.core.not(new cljs.core.Keyword("block","file","block/file",183171933).cljs$core$IFn$_invoke$arity$1(p1__131332_SHARP_))));
}),logseq.graph_parser.extract.with_ref_pages(pages,blocks)));
var all_existing_page_uuids = logseq.graph_parser.exporter.get_all_existing_page_uuids(cljs.core.deref(new cljs.core.Keyword(null,"classes-from-property-parents","classes-from-property-parents",371081959).cljs$core$IFn$_invoke$arity$1(import_state)),cljs.core.deref(new cljs.core.Keyword(null,"all-existing-page-uuids","all-existing-page-uuids",2010169990).cljs$core$IFn$_invoke$arity$1(import_state)));
var all_pages = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__131334_SHARP_){
return logseq.graph_parser.exporter.modify_page_tx(p1__131334_SHARP_,all_existing_page_uuids);
}),all_pages_STAR_);
var all_new_page_uuids = cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.juxt.cljs$core$IFn$_invoke$arity$2(cljs.core.some_fn.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("logseq.graph-parser.exporter","original-name","logseq.graph-parser.exporter/original-name",-559626865),new cljs.core.Keyword("block","name","block/name",1619760316)),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552)),cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (p1__131335_SHARP_){
var G__131351 = (function (){var or__5002__auto__ = new cljs.core.Keyword("logseq.graph-parser.exporter","original-name","logseq.graph-parser.exporter/original-name",-559626865).cljs$core$IFn$_invoke$arity$1(p1__131335_SHARP_);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword("block","name","block/name",1619760316).cljs$core$IFn$_invoke$arity$1(p1__131335_SHARP_);
}
})();
return (all_existing_page_uuids.cljs$core$IFn$_invoke$arity$1 ? all_existing_page_uuids.cljs$core$IFn$_invoke$arity$1(G__131351) : all_existing_page_uuids.call(null,G__131351));
}),all_pages)));
var page_names_to_uuids = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([all_existing_page_uuids,all_new_page_uuids], 0)));
var per_file_state = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"page-names-to-uuids","page-names-to-uuids",-875423247),page_names_to_uuids,new cljs.core.Keyword(null,"classes-tx","classes-tx",664490242),new cljs.core.Keyword(null,"classes-tx","classes-tx",664490242).cljs$core$IFn$_invoke$arity$1(options)], null);
var all_pages_m = cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (p1__131336_SHARP_){
return logseq.graph_parser.exporter.handle_page_properties(p1__131336_SHARP_,cljs.core.deref(conn),per_file_state,all_pages,options);
}),all_pages);
var pages_tx = cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (p__131356){
var map__131357 = p__131356;
var map__131357__$1 = cljs.core.__destructure_map(map__131357);
var m = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__131357__$1,new cljs.core.Keyword(null,"block","block",664686210));
var _properties_tx = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__131357__$1,new cljs.core.Keyword(null,"properties-tx","properties-tx",-1476843279));
var page = (function (){var temp__5802__auto__ = (cljs.core.truth_(new cljs.core.Keyword("logseq.graph-parser.exporter","original-name","logseq.graph-parser.exporter/original-name",-559626865).cljs$core$IFn$_invoke$arity$1(m))?(function (){var G__131360 = new cljs.core.Keyword("logseq.graph-parser.exporter","original-name","logseq.graph-parser.exporter/original-name",-559626865).cljs$core$IFn$_invoke$arity$1(m);
return (all_existing_page_uuids.cljs$core$IFn$_invoke$arity$1 ? all_existing_page_uuids.cljs$core$IFn$_invoke$arity$1(G__131360) : all_existing_page_uuids.call(null,G__131360));
})():(function (){var G__131361 = new cljs.core.Keyword("block","name","block/name",1619760316).cljs$core$IFn$_invoke$arity$1(m);
return (all_existing_page_uuids.cljs$core$IFn$_invoke$arity$1 ? all_existing_page_uuids.cljs$core$IFn$_invoke$arity$1(G__131361) : all_existing_page_uuids.call(null,G__131361));
})());
if(cljs.core.truth_(temp__5802__auto__)){
var page_uuid = temp__5802__auto__;
return logseq.graph_parser.exporter.build_existing_page(cljs.core.dissoc.cljs$core$IFn$_invoke$arity$variadic(m,new cljs.core.Keyword("logseq.graph-parser.exporter","original-name","logseq.graph-parser.exporter/original-name",-559626865),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("logseq.graph-parser.exporter","original-title","logseq.graph-parser.exporter/original-title",881456337)], 0)),cljs.core.deref(conn),page_uuid,per_file_state,options);
} else {
if(cljs.core.truth_((function (){var or__5002__auto__ = (logseq.db.class_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.class_QMARK_.cljs$core$IFn$_invoke$arity$1(m) : logseq.db.class_QMARK_.call(null,m));
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.not((function (){var G__131363 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(new cljs.core.Keyword(null,"all-idents","all-idents",-980997938).cljs$core$IFn$_invoke$arity$1(import_state)),(function (){var G__131365 = (function (){var or__5002__auto____$1 = new cljs.core.Keyword("logseq.graph-parser.exporter","original-title","logseq.graph-parser.exporter/original-title",881456337).cljs$core$IFn$_invoke$arity$1(m);
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
return new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(m);
}
})();
var G__131365__$1 = (((G__131365 == null))?null:logseq.graph_parser.exporter.build_class_ident_name(G__131365));
if((G__131365__$1 == null)){
return null;
} else {
return cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(G__131365__$1);
}
})());
if((G__131363 == null)){
return null;
} else {
return logseq.db.frontend.malli_schema.class_QMARK_(G__131363);
}
})());
}
})())){
return logseq.graph_parser.exporter.build_new_page_or_class(cljs.core.dissoc.cljs$core$IFn$_invoke$arity$variadic(m,new cljs.core.Keyword("logseq.graph-parser.exporter","original-name","logseq.graph-parser.exporter/original-name",-559626865),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("logseq.graph-parser.exporter","original-title","logseq.graph-parser.exporter/original-title",881456337)], 0)),cljs.core.deref(conn),per_file_state,new cljs.core.Keyword(null,"all-idents","all-idents",-980997938).cljs$core$IFn$_invoke$arity$1(import_state),options);
} else {
return null;
}
}
})();
return page;
}),all_pages_m);
return new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"pages-tx","pages-tx",1327748306),pages_tx,new cljs.core.Keyword(null,"page-properties-tx","page-properties-tx",914545875),cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword(null,"properties-tx","properties-tx",-1476843279),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([all_pages_m], 0)),new cljs.core.Keyword(null,"existing-pages","existing-pages",-2146396109),cljs.core.select_keys(all_existing_page_uuids,cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","name","block/name",1619760316),all_pages_STAR_)),new cljs.core.Keyword(null,"per-file-state","per-file-state",113566168),per_file_state], null);
});
/**
 * Builds upstream-properties-tx for properties that change to :default type
 */
logseq.graph_parser.exporter.build_upstream_properties_tx_for_default = (function logseq$graph_parser$exporter$build_upstream_properties_tx_for_default(db,prop,property_ident,from_prop_type,block_properties_text_values){
var get_pvalue_content = (function logseq$graph_parser$exporter$build_upstream_properties_tx_for_default_$_get_pvalue_content(block_uuid,prop_SINGLEQUOTE_){
var or__5002__auto__ = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(block_properties_text_values,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [block_uuid,prop_SINGLEQUOTE_], null));
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2(["No :block/text-properties-values found when changing property values: ",cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([block_uuid], 0))].join(''),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"property","property",-1114278232),prop_SINGLEQUOTE_,new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_uuid], null));
}
});
var existing_blocks = cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.first,(function (){var G__131375 = new cljs.core.PersistentVector(null, 8, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"find","find",496279456),cljs.core.list(new cljs.core.Symbol(null,"pull","pull",779986722,null),new cljs.core.Symbol(null,"?b","?b",1575118075,null),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"*","*",345799209,null)], null)),new cljs.core.Keyword(null,"in","in",-1531184865),new cljs.core.Symbol(null,"$","$",-1580747756,null),new cljs.core.Symbol(null,"?p","?p",-10896580,null),new cljs.core.Symbol(null,"%","%",-950237169,null),new cljs.core.Keyword(null,"where","where",-2044795965),cljs.core.list(new cljs.core.Symbol(null,"has-property","has-property",-130314949,null),new cljs.core.Symbol(null,"?b","?b",1575118075,null),new cljs.core.Symbol(null,"?p","?p",-10896580,null))], null);
var G__131376 = db;
var G__131377 = property_ident;
var G__131378 = logseq.db.frontend.rules.extract_rules.cljs$core$IFn$_invoke$arity$1(logseq.db.frontend.rules.db_query_dsl_rules);
return (datascript.core.q.cljs$core$IFn$_invoke$arity$4 ? datascript.core.q.cljs$core$IFn$_invoke$arity$4(G__131375,G__131376,G__131377,G__131378) : datascript.core.q.call(null,G__131375,G__131376,G__131377,G__131378));
})());
var existing_blocks_tx = cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (m){
var prop_value = cljs.core.get.cljs$core$IFn$_invoke$arity$2(m,property_ident);
var retract_tx = (cljs.core.truth_((function (){var fexpr__131379 = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"date","date",-1463434462),null,new cljs.core.Keyword(null,"node","node",581201198),null], null), null);
return (fexpr__131379.cljs$core$IFn$_invoke$arity$1 ? fexpr__131379.cljs$core$IFn$_invoke$arity$1(from_prop_type) : fexpr__131379.call(null,from_prop_type));
})())?new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","retract","db/retract",-1549825231),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(m),property_ident], null)], null):cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (p1__131371_SHARP_){
return (new cljs.core.PersistentVector(null,2,(5),cljs.core.PersistentVector.EMPTY_NODE,[new cljs.core.Keyword("db","retractEntity","db/retractEntity",-1452737935),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(p1__131371_SHARP_)],null));
}),((cljs.core.sequential_QMARK_(prop_value))?prop_value:new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [prop_value], null))));
var prop_value_content = get_pvalue_content(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(m),prop);
var new_value = logseq.db.frontend.property.build.build_property_value_block(m,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("db","ident","db/ident",-737096),property_ident], null),prop_value_content);
return cljs.core.into.cljs$core$IFn$_invoke$arity$2(retract_tx,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new_value,cljs.core.PersistentArrayMap.createAsIfByAssoc([new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(m),property_ident,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(new_value)], null)])], null));
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([existing_blocks], 0));
return existing_blocks_tx;
});
/**
 * Builds tx for upstream properties that have changed and any instances of its
 *   use in db or in given blocks-tx. Upstream properties can be properties that
 *   already exist in the DB from another file or from earlier uses of a property
 *   in the same file
 */
logseq.graph_parser.exporter.build_upstream_properties_tx = (function logseq$graph_parser$exporter$build_upstream_properties_tx(db,upstream_properties,import_state,log_fn){
if(cljs.core.seq(upstream_properties)){
var block_properties_text_values = cljs.core.deref(new cljs.core.Keyword(null,"block-properties-text-values","block-properties-text-values",-525710723).cljs$core$IFn$_invoke$arity$1(import_state));
var all_idents = cljs.core.deref(new cljs.core.Keyword(null,"all-idents","all-idents",-980997938).cljs$core$IFn$_invoke$arity$1(import_state));
var _ = (log_fn.cljs$core$IFn$_invoke$arity$2 ? log_fn.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"props-upstream-to-change","props-upstream-to-change",313097928),upstream_properties) : log_fn.call(null,new cljs.core.Keyword(null,"props-upstream-to-change","props-upstream-to-change",313097928),upstream_properties));
var txs = cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (p__131393){
var vec__131395 = p__131393;
var prop = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__131395,(0),null);
var map__131398 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__131395,(1),null);
var map__131398__$1 = cljs.core.__destructure_map(map__131398);
var schema = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__131398__$1,new cljs.core.Keyword(null,"schema","schema",-1582001791));
var from_type = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__131398__$1,new cljs.core.Keyword(null,"from-type","from-type",-2097724678));
var prop_ident = logseq.graph_parser.exporter.get_ident(all_idents,prop);
var upstream_tx = ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"default","default",-1987822328),new cljs.core.Keyword("logseq.property","type","logseq.property/type",83842404).cljs$core$IFn$_invoke$arity$1(schema)))?logseq.graph_parser.exporter.build_upstream_properties_tx_for_default(db,prop,prop_ident,from_type,block_properties_text_values):null);
var property_pages_tx = new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("db","ident","db/ident",-737096),prop_ident], null),schema], 0))], null);
return cljs.core.concat.cljs$core$IFn$_invoke$arity$2(property_pages_tx,upstream_tx);
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([upstream_properties], 0));
return txs;
} else {
return cljs.core.PersistentVector.EMPTY;
}
});
/**
 * New import state that is used for import of one graph. State is atom per
 * key to make code more readable and encourage local mutations
 */
logseq.graph_parser.exporter.new_import_state = (function logseq$graph_parser$exporter$new_import_state(){
return new cljs.core.PersistentArrayMap(null, 7, [new cljs.core.Keyword(null,"ignored-properties","ignored-properties",-2000184055),cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentVector.EMPTY),new cljs.core.Keyword(null,"ignored-files","ignored-files",-257976),cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentVector.EMPTY),new cljs.core.Keyword(null,"property-schemas","property-schemas",-1631291569),cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY),new cljs.core.Keyword(null,"all-existing-page-uuids","all-existing-page-uuids",2010169990),cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY),new cljs.core.Keyword(null,"all-idents","all-idents",-980997938),cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY),new cljs.core.Keyword(null,"classes-from-property-parents","classes-from-property-parents",371081959),cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentHashSet.EMPTY),new cljs.core.Keyword(null,"block-properties-text-values","block-properties-text-values",-525710723),cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY)], null);
});
logseq.graph_parser.exporter.build_tx_options = (function logseq$graph_parser$exporter$build_tx_options(p__131409){
var map__131411 = p__131409;
var map__131411__$1 = cljs.core.__destructure_map(map__131411);
var options = map__131411__$1;
var user_options = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__131411__$1,new cljs.core.Keyword(null,"user-options","user-options",-84696866));
return cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.dissoc.cljs$core$IFn$_invoke$arity$variadic(options,new cljs.core.Keyword(null,"extract-options","extract-options",-572164844),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"user-options","user-options",-84696866)], 0)),new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"import-state","import-state",1493794865),(function (){var or__5002__auto__ = new cljs.core.Keyword(null,"import-state","import-state",1493794865).cljs$core$IFn$_invoke$arity$1(options);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return logseq.graph_parser.exporter.new_import_state();
}
})(),new cljs.core.Keyword(null,"upstream-properties","upstream-properties",1757374284),cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY),new cljs.core.Keyword(null,"classes-tx","classes-tx",664490242),cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentVector.EMPTY),new cljs.core.Keyword(null,"user-options","user-options",-84696866),cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([user_options,new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"tag-classes","tag-classes",835362327),cljs.core.set(cljs.core.map.cljs$core$IFn$_invoke$arity$2(clojure.string.lower_case,new cljs.core.Keyword(null,"tag-classes","tag-classes",835362327).cljs$core$IFn$_invoke$arity$1(user_options))),new cljs.core.Keyword(null,"property-classes","property-classes",1129964490),clojure.set.difference.cljs$core$IFn$_invoke$arity$2(cljs.core.set(cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.comp.cljs$core$IFn$_invoke$arity$2(cljs.core.keyword,clojure.string.lower_case),new cljs.core.Keyword(null,"property-classes","property-classes",1129964490).cljs$core$IFn$_invoke$arity$1(user_options))),logseq.graph_parser.exporter.file_built_in_property_names),new cljs.core.Keyword(null,"property-parent-classes","property-parent-classes",1972741305),clojure.set.difference.cljs$core$IFn$_invoke$arity$2(cljs.core.set(cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.comp.cljs$core$IFn$_invoke$arity$2(cljs.core.keyword,clojure.string.lower_case),new cljs.core.Keyword(null,"property-parent-classes","property-parent-classes",1972741305).cljs$core$IFn$_invoke$arity$1(user_options))),logseq.graph_parser.exporter.file_built_in_property_names)], null)], 0))], null)], 0));
});
/**
 * Separates new pages from new properties tx in preparation for properties to
 *   be transacted separately. Also builds property pages tx and converts existing
 *   pages that are now properties
 */
logseq.graph_parser.exporter.split_pages_and_properties_tx = (function logseq$graph_parser$exporter$split_pages_and_properties_tx(pages_tx,old_properties,existing_pages,import_state){
var new_properties = clojure.set.difference.cljs$core$IFn$_invoke$arity$2(cljs.core.set(cljs.core.keys(cljs.core.deref(new cljs.core.Keyword(null,"property-schemas","property-schemas",-1631291569).cljs$core$IFn$_invoke$arity$1(import_state)))),cljs.core.set(old_properties));
var vec__131418 = cljs.core.juxt.cljs$core$IFn$_invoke$arity$2(cljs.core.filter,cljs.core.remove)((function (p1__131412_SHARP_){
return cljs.core.contains_QMARK_(new_properties,cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","name","block/name",1619760316).cljs$core$IFn$_invoke$arity$1(p1__131412_SHARP_)));
}),pages_tx);
var properties_tx = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__131418,(0),null);
var pages_tx_SINGLEQUOTE_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__131418,(1),null);
var property_pages_tx = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p__131426){
var map__131427 = p__131426;
var map__131427__$1 = cljs.core.__destructure_map(map__131427);
var block_uuid = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__131427__$1,new cljs.core.Keyword("block","uuid","block/uuid",-1991494552));
var title = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__131427__$1,new cljs.core.Keyword("block","title","block/title",710445684));
var property_name = cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(clojure.string.lower_case(title));
var db_ident = logseq.graph_parser.exporter.get_ident(cljs.core.deref(new cljs.core.Keyword(null,"all-idents","all-idents",-980997938).cljs$core$IFn$_invoke$arity$1(import_state)),property_name);
return logseq.db.sqlite.util.build_new_property.cljs$core$IFn$_invoke$arity$3(db_ident,logseq.graph_parser.exporter.get_property_schema(cljs.core.deref(new cljs.core.Keyword(null,"property-schemas","property-schemas",-1631291569).cljs$core$IFn$_invoke$arity$1(import_state)),property_name),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"title","title",636505583),title,new cljs.core.Keyword(null,"block-uuid","block-uuid",-1558039638),block_uuid], null));
}),properties_tx);
var converted_property_pages_tx = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (kw_name){
var existing_page_uuid = cljs.core.get.cljs$core$IFn$_invoke$arity$2(existing_pages,cljs.core.name(kw_name));
var db_ident = logseq.graph_parser.exporter.get_ident(cljs.core.deref(new cljs.core.Keyword(null,"all-idents","all-idents",-980997938).cljs$core$IFn$_invoke$arity$1(import_state)),kw_name);
var new_prop = logseq.db.sqlite.util.build_new_property.cljs$core$IFn$_invoke$arity$3(db_ident,logseq.graph_parser.exporter.get_property_schema(cljs.core.deref(new cljs.core.Keyword(null,"property-schemas","property-schemas",-1631291569).cljs$core$IFn$_invoke$arity$1(import_state)),kw_name),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"title","title",636505583),cljs.core.name(kw_name)], null));
if(cljs.core.truth_(existing_page_uuid)){
} else {
throw (new Error("Assert failed: existing-page-uuid"));
}

return cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.select_keys(new_prop,new cljs.core.PersistentVector(null, 6, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","tags","block/tags",1814948340),new cljs.core.Keyword("db","ident","db/ident",-737096),new cljs.core.Keyword("logseq.property","type","logseq.property/type",83842404),new cljs.core.Keyword("db","index","db/index",-1531680669),new cljs.core.Keyword("db","cardinality","db/cardinality",-104975659),new cljs.core.Keyword("db","valueType","db/valueType",1827971944)], null)),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),existing_page_uuid], null)], 0));
}),clojure.set.intersection.cljs$core$IFn$_invoke$arity$2(new_properties,cljs.core.set(cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.keyword,cljs.core.keys(existing_pages)))));
var retract_page_tag_from_properties_tx = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__131414_SHARP_){
return (new cljs.core.PersistentVector(null,4,(5),cljs.core.PersistentVector.EMPTY_NODE,[new cljs.core.Keyword("db","retract","db/retract",-1549825231),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(p1__131414_SHARP_)], null),new cljs.core.Keyword("block","tags","block/tags",1814948340),new cljs.core.Keyword("logseq.class","Page","logseq.class/Page",1484340329)],null));
}),cljs.core.concat.cljs$core$IFn$_invoke$arity$2(property_pages_tx,converted_property_pages_tx));
var property_page_properties_tx = cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (b){
var temp__5804__auto__ = cljs.core.not_empty(logseq.db.frontend.property.properties(b));
if(cljs.core.truth_(temp__5804__auto__)){
var page_properties = temp__5804__auto__;
return cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([page_properties,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(b),new cljs.core.Keyword("block","tags","block/tags",1814948340),cljs.core.conj.cljs$core$IFn$_invoke$arity$2(cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (p1__131415_SHARP_){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("logseq.class","Page","logseq.class/Page",1484340329),p1__131415_SHARP_);
}),new cljs.core.Keyword("block","tags","block/tags",1814948340).cljs$core$IFn$_invoke$arity$1(page_properties)),new cljs.core.Keyword("logseq.class","Property","logseq.class/Property",1038767048))], null)], 0));
} else {
return null;
}
}),properties_tx);
return new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"pages-tx","pages-tx",1327748306),pages_tx_SINGLEQUOTE_,new cljs.core.Keyword(null,"property-pages-tx","property-pages-tx",859116570),cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic(property_pages_tx,converted_property_pages_tx,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([retract_page_tag_from_properties_tx], 0)),new cljs.core.Keyword(null,"property-page-properties-tx","property-page-properties-tx",-1086975165),property_page_properties_tx], null);
});
logseq.graph_parser.exporter.update_whiteboard_blocks = (function logseq$graph_parser$exporter$update_whiteboard_blocks(blocks,format){
return cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (b){
if(cljs.core.seq(new cljs.core.Keyword("block","properties","block/properties",708347145).cljs$core$IFn$_invoke$arity$1(b))){
return cljs.core.update.cljs$core$IFn$_invoke$arity$3(cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(b,new cljs.core.Keyword("block","content","block/content",-161885195)),new cljs.core.Keyword("block","title","block/title",710445684),(function (p1__131433_SHARP_){
return logseq.graph_parser.property.remove_properties(format,p1__131433_SHARP_);
}));
} else {
var G__131435 = cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(b,new cljs.core.Keyword("block","content","block/content",-161885195));
if(cljs.core.truth_(new cljs.core.Keyword("block","content","block/content",-161885195).cljs$core$IFn$_invoke$arity$1(b))){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__131435,new cljs.core.Keyword("block","title","block/title",710445684),new cljs.core.Keyword("block","content","block/content",-161885195).cljs$core$IFn$_invoke$arity$1(b));
} else {
return G__131435;
}
}
}),blocks);
});
/**
 * A tag or ref can have different :block/uuid's across extracted blocks. This makes
 * sense for most in-app uses but not for importing where we want consistent identity.
 * This fn fixes that issue. This fn also ensures that tags and pages have the same uuid
 */
logseq.graph_parser.exporter.fix_extracted_block_tags_and_refs = (function logseq$graph_parser$exporter$fix_extracted_block_tags_and_refs(blocks){
var name_uuids = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
var fix_block_uuids = (function logseq$graph_parser$exporter$fix_extracted_block_tags_and_refs_$_fix_block_uuids(tags_or_refs,p__131440){
var map__131441 = p__131440;
var map__131441__$1 = cljs.core.__destructure_map(map__131441);
var ref_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__131441__$1,new cljs.core.Keyword(null,"ref?","ref?",1932693720));
var properties = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__131441__$1,new cljs.core.Keyword(null,"properties","properties",685819552));
return cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (b){
if(cljs.core.truth_((function (){var and__5000__auto__ = ref_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.get.cljs$core$IFn$_invoke$arity$2(properties,cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","name","block/name",1619760316).cljs$core$IFn$_invoke$arity$1(b)));
} else {
return and__5000__auto__;
}
})())){
return b;
} else {
var temp__5802__auto__ = (function (){var G__131446 = new cljs.core.Keyword("block","name","block/name",1619760316).cljs$core$IFn$_invoke$arity$1(b);
if((G__131446 == null)){
return null;
} else {
return cljs.core.get.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(name_uuids),G__131446);
}
})();
if(cljs.core.truth_(temp__5802__auto__)){
var existing_uuid = temp__5802__auto__;
if(cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(existing_uuid,new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(b))){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(b,new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),existing_uuid);
} else {
return b;
}
} else {
if(cljs.core.vector_QMARK_(b)){
return b;
} else {
if(cljs.core.truth_((function (){var and__5000__auto__ = new cljs.core.Keyword("block","name","block/name",1619760316).cljs$core$IFn$_invoke$arity$1(b);
if(cljs.core.truth_(and__5000__auto__)){
return new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(b);
} else {
return and__5000__auto__;
}
})())){
} else {
throw (new Error(["Assert failed: ",["Extracted block tag/ref must have a name and uuid: ",cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([b], 0))].join(''),"\n","(and (:block/name b) (:block/uuid b))"].join('')));
}

cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(name_uuids,cljs.core.assoc,new cljs.core.Keyword("block","name","block/name",1619760316).cljs$core$IFn$_invoke$arity$1(b),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(b));

return b;
}
}
}
}),tags_or_refs);
});
return cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (b){
var G__131448 = b;
var G__131448__$1 = ((cljs.core.seq(new cljs.core.Keyword("block","tags","block/tags",1814948340).cljs$core$IFn$_invoke$arity$1(b)))?cljs.core.update.cljs$core$IFn$_invoke$arity$4(G__131448,new cljs.core.Keyword("block","tags","block/tags",1814948340),fix_block_uuids,cljs.core.PersistentArrayMap.EMPTY):G__131448);
if(cljs.core.seq(new cljs.core.Keyword("block","refs","block/refs",-1214495349).cljs$core$IFn$_invoke$arity$1(b))){
return cljs.core.update.cljs$core$IFn$_invoke$arity$4(G__131448__$1,new cljs.core.Keyword("block","refs","block/refs",-1214495349),fix_block_uuids,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"ref?","ref?",1932693720),true,new cljs.core.Keyword(null,"properties","properties",685819552),new cljs.core.Keyword("block","properties","block/properties",708347145).cljs$core$IFn$_invoke$arity$1(b)], null));
} else {
return G__131448__$1;
}
}),blocks);
});
/**
 * Main fn which calls graph-parser to convert markdown into data
 */
logseq.graph_parser.exporter.extract_pages_and_blocks = (function logseq$graph_parser$exporter$extract_pages_and_blocks(db,file,content,p__131455){
var map__131456 = p__131455;
var map__131456__$1 = cljs.core.__destructure_map(map__131456);
var extract_options = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__131456__$1,new cljs.core.Keyword(null,"extract-options","extract-options",-572164844));
var import_state = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__131456__$1,new cljs.core.Keyword(null,"import-state","import-state",1493794865));
var format = logseq.common.util.get_format(file);
var ignored_highlight_file_QMARK_ = clojure.string.starts_with_QMARK_(cljs.core.str.cljs$core$IFn$_invoke$arity$1(logseq.common.path.basename(file)),"hls__");
var extract_options_SINGLEQUOTE_ = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"block-pattern","block-pattern",297259959),logseq.common.config.get_block_pattern(format),new cljs.core.Keyword(null,"date-formatter","date-formatter",-223324709),"MMM do, yyyy",new cljs.core.Keyword(null,"uri-encoded?","uri-encoded?",663370134),false,new cljs.core.Keyword(null,"export-to-db-graph?","export-to-db-graph?",2008973423),true,new cljs.core.Keyword(null,"filename-format","filename-format",-1193264412),new cljs.core.Keyword(null,"legacy","legacy",1434943289)], null),extract_options,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"db","db",993250759),db], null)], 0));
if(((cljs.core.contains_QMARK_(logseq.common.config.mldoc_support_formats,format)) && ((!(ignored_highlight_file_QMARK_))))){
return cljs.core.update.cljs$core$IFn$_invoke$arity$3(cljs.core.update.cljs$core$IFn$_invoke$arity$3(logseq.graph_parser.extract.extract(file,content,extract_options_SINGLEQUOTE_),new cljs.core.Keyword(null,"pages","pages",-285406513),(function (pages){
return cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__131450_SHARP_){
return cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(p1__131450_SHARP_,new cljs.core.Keyword("block.temp","original-page-name","block.temp/original-page-name",1371358508));
}),pages);
})),new cljs.core.Keyword(null,"blocks","blocks",-610462153),logseq.graph_parser.exporter.fix_extracted_block_tags_and_refs);
} else {
if(cljs.core.truth_(logseq.common.config.whiteboard_QMARK_(file))){
return cljs.core.update.cljs$core$IFn$_invoke$arity$4(cljs.core.update.cljs$core$IFn$_invoke$arity$3(logseq.graph_parser.extract.extract_whiteboard_edn(file,content,extract_options_SINGLEQUOTE_),new cljs.core.Keyword(null,"pages","pages",-285406513),(function (pages){
return cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__131451_SHARP_){
return cljs.core.dissoc.cljs$core$IFn$_invoke$arity$variadic(cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(p1__131451_SHARP_,new cljs.core.Keyword("block","title","block/title",710445684),(function (){var or__5002__auto__ = new cljs.core.Keyword("block","original-name","block/original-name",-1620099234).cljs$core$IFn$_invoke$arity$1(p1__131451_SHARP_);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(p1__131451_SHARP_);
}
})(),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("block","tags","block/tags",1814948340),new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("logseq.class","Whiteboard","logseq.class/Whiteboard",1013698452),null], null), null)], 0)),new cljs.core.Keyword("block","type","block/type",1537584409),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("block","original-name","block/original-name",-1620099234)], 0));
}),pages);
})),new cljs.core.Keyword(null,"blocks","blocks",-610462153),logseq.graph_parser.exporter.update_whiteboard_blocks,format);
} else {
if(ignored_highlight_file_QMARK_){
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$3(new cljs.core.Keyword(null,"ignored-files","ignored-files",-257976).cljs$core$IFn$_invoke$arity$1(import_state),cljs.core.conj,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"path","path",-188191168),file,new cljs.core.Keyword(null,"reason","reason",-2070751759),new cljs.core.Keyword(null,"pdf-highlight","pdf-highlight",1968891704)], null));
} else {
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$3(new cljs.core.Keyword(null,"ignored-files","ignored-files",-257976).cljs$core$IFn$_invoke$arity$1(import_state),cljs.core.conj,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"path","path",-188191168),file,new cljs.core.Keyword(null,"reason","reason",-2070751759),new cljs.core.Keyword(null,"unsupported-file-format","unsupported-file-format",794096404)], null));
}

}
}
});
/**
 * Calculate created-at timestamps for journals
 */
logseq.graph_parser.exporter.build_journal_created_ats = (function logseq$graph_parser$exporter$build_journal_created_ats(pages){
return cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__131460_SHARP_){
var temp__5804__auto__ = new cljs.core.Keyword("block","journal-day","block/journal-day",-145748366).cljs$core$IFn$_invoke$arity$1(p1__131460_SHARP_);
if(cljs.core.truth_(temp__5804__auto__)){
var journal_day = temp__5804__auto__;
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","name","block/name",1619760316).cljs$core$IFn$_invoke$arity$1(p1__131460_SHARP_),logseq.common.util.date_time.journal_day__GT_ms(journal_day)], null);
} else {
return null;
}
}),pages));
});
/**
 * If a page/class tx is an existing property or a new or existing class, ensure that
 *   it only has one tag by removing :logseq.class/Page from its tx
 */
logseq.graph_parser.exporter.clean_extra_invalid_tags = (function logseq$graph_parser$exporter$clean_extra_invalid_tags(db,pages_tx_SINGLEQUOTE_,classes_tx,existing_pages){
var existing_classes = cljs.core.set(cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__131474_SHARP_){
var G__131484 = db;
var G__131485 = new cljs.core.Keyword(null,"e","e",1381269198).cljs$core$IFn$_invoke$arity$1(p1__131474_SHARP_);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__131484,G__131485) : datascript.core.entity.call(null,G__131484,G__131485));
}),datascript.core.datoms.cljs$core$IFn$_invoke$arity$4(db,new cljs.core.Keyword(null,"avet","avet",1383857032),new cljs.core.Keyword("block","tags","block/tags",1814948340),new cljs.core.Keyword("logseq.class","Tag","logseq.class/Tag",-538902083)))));
var classes = clojure.set.union.cljs$core$IFn$_invoke$arity$2(existing_classes,cljs.core.set(cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),classes_tx)));
var existing_properties = cljs.core.set(cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__131475_SHARP_){
var G__131490 = db;
var G__131491 = new cljs.core.Keyword(null,"e","e",1381269198).cljs$core$IFn$_invoke$arity$1(p1__131475_SHARP_);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__131490,G__131491) : datascript.core.entity.call(null,G__131490,G__131491));
}),datascript.core.datoms.cljs$core$IFn$_invoke$arity$4(db,new cljs.core.Keyword(null,"avet","avet",1383857032),new cljs.core.Keyword("block","tags","block/tags",1814948340),new cljs.core.Keyword("logseq.class","Property","logseq.class/Property",1038767048)))));
var existing_pages_SINGLEQUOTE_ = clojure.set.map_invert(existing_pages);
var retract_page_tag_from_existing_pages = cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (p1__131481_SHARP_){
return (new cljs.core.PersistentVector(null,4,(5),cljs.core.PersistentVector.EMPTY_NODE,[new cljs.core.Keyword("db","retract","db/retract",-1549825231),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(p1__131481_SHARP_)], null),new cljs.core.Keyword("block","tags","block/tags",1814948340),new cljs.core.Keyword("logseq.class","Page","logseq.class/Page",1484340329)],null));
}),cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (p1__131480_SHARP_){
var and__5000__auto__ = new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(p1__131480_SHARP_);
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.get.cljs$core$IFn$_invoke$arity$2(existing_pages_SINGLEQUOTE_,new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(p1__131480_SHARP_));
} else {
return and__5000__auto__;
}
}),pages_tx_SINGLEQUOTE_));
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"pages-tx","pages-tx",1327748306),cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (page){
if(((cljs.core.contains_QMARK_(classes,new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(page))) || (cljs.core.contains_QMARK_(existing_properties,new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(page))))){
return cljs.core.update.cljs$core$IFn$_invoke$arity$3(page,new cljs.core.Keyword("block","tags","block/tags",1814948340),(function (tags){
return cljs.core.vec(cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (p1__131482_SHARP_){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(p1__131482_SHARP_,new cljs.core.Keyword("logseq.class","Page","logseq.class/Page",1484340329));
}),tags));
}));
} else {
return page;
}
}),pages_tx_SINGLEQUOTE_),new cljs.core.Keyword(null,"retract-page-tags-tx","retract-page-tags-tx",-932957972),cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (p1__131483_SHARP_){
return (new cljs.core.PersistentVector(null,4,(5),cljs.core.PersistentVector.EMPTY_NODE,[new cljs.core.Keyword("db","retract","db/retract",-1549825231),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(p1__131483_SHARP_)], null),new cljs.core.Keyword("block","tags","block/tags",1814948340),new cljs.core.Keyword("logseq.class","Page","logseq.class/Page",1484340329)],null));
}),classes_tx),retract_page_tag_from_existing_pages)], null);
});
/**
 * Save importer state from given txs
 */
logseq.graph_parser.exporter.save_from_tx = (function logseq$graph_parser$exporter$save_from_tx(txs,p__131497){
var map__131498 = p__131497;
var map__131498__$1 = cljs.core.__destructure_map(map__131498);
var import_state = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__131498__$1,new cljs.core.Keyword(null,"import-state","import-state",1493794865));
var temp__5804__auto__ = cljs.core.seq(cljs.core.filter.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","name","block/name",1619760316),txs));
if(temp__5804__auto__){
var nodes = temp__5804__auto__;
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$3(new cljs.core.Keyword(null,"all-existing-page-uuids","all-existing-page-uuids",2010169990).cljs$core$IFn$_invoke$arity$1(import_state),cljs.core.merge,cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.juxt.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),cljs.core.identity),nodes)));
} else {
return null;
}
});
/**
 * Parse file and save parsed data to the given db graph. Options available:
 * 
 * * :extract-options - Options map to pass to extract/extract
 * * :user-options - User provided options maps that alter how a file is converted to db graph. Current options
 * are: :tag-classes (set), :property-classes (set), :property-parent-classes (set), :convert-all-tags? (boolean)
 * and :remove-inline-tags? (boolean)
 * * :import-state - useful import state to maintain across files e.g. property schemas or ignored properties
 * * :macros - map of macros for use with macro expansion
 * * :notify-user - Displays warnings to user without failing the import. Fn receives a map with :msg
 * * :log-fn - Logs messages for development. Defaults to prn
 */
logseq.graph_parser.exporter.add_file_to_db_graph = (function logseq$graph_parser$exporter$add_file_to_db_graph(conn,file,content,p__131526){
var map__131527 = p__131526;
var map__131527__$1 = cljs.core.__destructure_map(map__131527);
var _STAR_options = map__131527__$1;
var notify_user = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__131527__$1,new cljs.core.Keyword(null,"notify-user","notify-user",-268964208),(function (p1__131512_SHARP_){
return cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["[WARNING]",new cljs.core.Keyword(null,"msg","msg",-1386103444).cljs$core$IFn$_invoke$arity$1(p1__131512_SHARP_)], 0));
}));
var log_fn = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__131527__$1,new cljs.core.Keyword(null,"log-fn","log-fn",-2003241282),cljs.core.prn);
var options = cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(_STAR_options,new cljs.core.Keyword(null,"notify-user","notify-user",-268964208),notify_user,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"log-fn","log-fn",-2003241282),log_fn], 0));
var map__131530 = logseq.graph_parser.exporter.extract_pages_and_blocks(cljs.core.deref(conn),file,content,options);
var map__131530__$1 = cljs.core.__destructure_map(map__131530);
var pages = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__131530__$1,new cljs.core.Keyword(null,"pages","pages",-285406513));
var blocks = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__131530__$1,new cljs.core.Keyword(null,"blocks","blocks",-610462153));
var tx_options = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([logseq.graph_parser.exporter.build_tx_options(options),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"journal-created-ats","journal-created-ats",339724852),logseq.graph_parser.exporter.build_journal_created_ats(pages)], null)], 0));
var old_properties = cljs.core.keys(cljs.core.deref(cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(options,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"import-state","import-state",1493794865),new cljs.core.Keyword(null,"property-schemas","property-schemas",-1631291569)], null))));
var map__131531 = logseq.graph_parser.exporter.build_pages_tx(conn,pages,blocks,tx_options);
var map__131531__$1 = cljs.core.__destructure_map(map__131531);
var pages_tx = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__131531__$1,new cljs.core.Keyword(null,"pages-tx","pages-tx",1327748306));
var page_properties_tx = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__131531__$1,new cljs.core.Keyword(null,"page-properties-tx","page-properties-tx",914545875));
var per_file_state = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__131531__$1,new cljs.core.Keyword(null,"per-file-state","per-file-state",113566168));
var existing_pages = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__131531__$1,new cljs.core.Keyword(null,"existing-pages","existing-pages",-2146396109));
var whiteboard_pages = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (page_block){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(page_block,new cljs.core.Keyword("logseq.property","ls-type","logseq.property/ls-type",326979345),new cljs.core.Keyword(null,"whiteboard-page","whiteboard-page",-432281646));
}),cljs.core.filter.cljs$core$IFn$_invoke$arity$2(logseq.db.whiteboard_QMARK_,pages_tx));
var pre_blocks = cljs.core.set(cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (p1__131513_SHARP_){
if(cljs.core.truth_(new cljs.core.Keyword("block","pre-block?","block/pre-block?",-1671958521).cljs$core$IFn$_invoke$arity$1(p1__131513_SHARP_))){
return new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(p1__131513_SHARP_);
} else {
return null;
}
}),blocks));
var blocks_tx = cljs.core.vec(cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (p1__131514_SHARP_){
return logseq.graph_parser.exporter.build_block_tx(cljs.core.deref(conn),p1__131514_SHARP_,pre_blocks,per_file_state,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(tx_options,new cljs.core.Keyword(null,"whiteboard?","whiteboard?",-1968190788),(!((cljs.core.seq(whiteboard_pages) == null)))));
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.remove.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","pre-block?","block/pre-block?",-1671958521),blocks)], 0)));
var map__131532 = logseq.graph_parser.exporter.split_pages_and_properties_tx(pages_tx,old_properties,existing_pages,new cljs.core.Keyword(null,"import-state","import-state",1493794865).cljs$core$IFn$_invoke$arity$1(options));
var map__131532__$1 = cljs.core.__destructure_map(map__131532);
var pages_tx_SINGLEQUOTE_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__131532__$1,new cljs.core.Keyword(null,"pages-tx","pages-tx",1327748306));
var property_pages_tx = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__131532__$1,new cljs.core.Keyword(null,"property-pages-tx","property-pages-tx",859116570));
var property_page_properties_tx = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__131532__$1,new cljs.core.Keyword(null,"property-page-properties-tx","property-page-properties-tx",-1086975165));
var main_props_tx_report = (function (){var G__131548 = conn;
var G__131549 = property_pages_tx;
var G__131550 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("logseq.graph-parser.exporter","new-graph?","logseq.graph-parser.exporter/new-graph?",-2038807565),true,new cljs.core.Keyword("logseq.graph-parser.exporter","path","logseq.graph-parser.exporter/path",-1467341446),file], null);
return (datascript.core.transact_BANG_.cljs$core$IFn$_invoke$arity$3 ? datascript.core.transact_BANG_.cljs$core$IFn$_invoke$arity$3(G__131548,G__131549,G__131550) : datascript.core.transact_BANG_.call(null,G__131548,G__131549,G__131550));
})();
var _ = logseq.graph_parser.exporter.save_from_tx(property_pages_tx,options);
var classes_tx = cljs.core.deref(new cljs.core.Keyword(null,"classes-tx","classes-tx",664490242).cljs$core$IFn$_invoke$arity$1(tx_options));
var map__131533 = logseq.graph_parser.exporter.clean_extra_invalid_tags(cljs.core.deref(conn),pages_tx_SINGLEQUOTE_,classes_tx,existing_pages);
var map__131533__$1 = cljs.core.__destructure_map(map__131533);
var pages_tx_SINGLEQUOTE__SINGLEQUOTE_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__131533__$1,new cljs.core.Keyword(null,"pages-tx","pages-tx",1327748306));
var retract_page_tags_tx = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__131533__$1,new cljs.core.Keyword(null,"retract-page-tags-tx","retract-page-tags-tx",-932957972));
var classes_tx_SINGLEQUOTE_ = cljs.core.concat.cljs$core$IFn$_invoke$arity$2(classes_tx,retract_page_tags_tx);
var pages_index = cljs.core.distinct.cljs$core$IFn$_invoke$arity$1(cljs.core.concat.cljs$core$IFn$_invoke$arity$2(cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__131516_SHARP_){
return cljs.core.select_keys(p1__131516_SHARP_,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552)], null));
}),classes_tx),cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__131515_SHARP_){
return cljs.core.select_keys(p1__131515_SHARP_,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552)], null));
}),pages_tx_SINGLEQUOTE__SINGLEQUOTE_)));
var block_ids = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (block){
return new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block)], null);
}),blocks_tx);
var block_refs_ids = cljs.core.seq(cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (ref){
return new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),cljs.core.second(ref)], null);
}),cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (ref){
return ((cljs.core.vector_QMARK_(ref)) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),cljs.core.first(ref))));
}),cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword("block","refs","block/refs",-1214495349),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([blocks_tx], 0)))));
var blocks_index = clojure.set.union.cljs$core$IFn$_invoke$arity$2(cljs.core.set(block_ids),cljs.core.set(block_refs_ids));
var tx = cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic(whiteboard_pages,pages_index,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([page_properties_tx,property_page_properties_tx,pages_tx_SINGLEQUOTE__SINGLEQUOTE_,classes_tx_SINGLEQUOTE_,blocks_index,blocks_tx], 0));
var tx_SINGLEQUOTE_ = logseq.common.util.fast_remove_nils(tx);
var main_tx_report = (function (){var G__131560 = conn;
var G__131561 = tx_SINGLEQUOTE_;
var G__131562 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("logseq.graph-parser.exporter","new-graph?","logseq.graph-parser.exporter/new-graph?",-2038807565),true,new cljs.core.Keyword("logseq.graph-parser.exporter","path","logseq.graph-parser.exporter/path",-1467341446),file], null);
return (datascript.core.transact_BANG_.cljs$core$IFn$_invoke$arity$3 ? datascript.core.transact_BANG_.cljs$core$IFn$_invoke$arity$3(G__131560,G__131561,G__131562) : datascript.core.transact_BANG_.call(null,G__131560,G__131561,G__131562));
})();
var ___$1 = logseq.graph_parser.exporter.save_from_tx(tx_SINGLEQUOTE_,options);
var upstream_properties_tx = logseq.graph_parser.exporter.build_upstream_properties_tx(cljs.core.deref(conn),cljs.core.deref(new cljs.core.Keyword(null,"upstream-properties","upstream-properties",1757374284).cljs$core$IFn$_invoke$arity$1(tx_options)),new cljs.core.Keyword(null,"import-state","import-state",1493794865).cljs$core$IFn$_invoke$arity$1(options),log_fn);
var upstream_tx_report = ((cljs.core.seq(upstream_properties_tx))?(function (){var G__131564 = conn;
var G__131565 = upstream_properties_tx;
var G__131566 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("logseq.graph-parser.exporter","new-graph?","logseq.graph-parser.exporter/new-graph?",-2038807565),true,new cljs.core.Keyword("logseq.graph-parser.exporter","path","logseq.graph-parser.exporter/path",-1467341446),file], null);
return (datascript.core.transact_BANG_.cljs$core$IFn$_invoke$arity$3 ? datascript.core.transact_BANG_.cljs$core$IFn$_invoke$arity$3(G__131564,G__131565,G__131566) : datascript.core.transact_BANG_.call(null,G__131564,G__131565,G__131566));
})():null);
var ___$2 = logseq.graph_parser.exporter.save_from_tx(upstream_properties_tx,options);
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [main_props_tx_report,main_tx_report,upstream_tx_report], null);
});
logseq.graph_parser.exporter.export_doc_file = (function logseq$graph_parser$exporter$export_doc_file(p__131569,conn,_LT_read_file,p__131570){
var map__131571 = p__131569;
var map__131571__$1 = cljs.core.__destructure_map(map__131571);
var file = map__131571__$1;
var path = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__131571__$1,new cljs.core.Keyword(null,"path","path",-188191168));
var idx = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__131571__$1,new cljs.core.Keyword(null,"idx","idx",1053688473));
var map__131572 = p__131570;
var map__131572__$1 = cljs.core.__destructure_map(map__131572);
var options = map__131572__$1;
var notify_user = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__131572__$1,new cljs.core.Keyword(null,"notify-user","notify-user",-268964208));
var set_ui_state = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__131572__$1,new cljs.core.Keyword(null,"set-ui-state","set-ui-state",1991288653),cljs.core.constantly(null));
var export_file = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__131572__$1,new cljs.core.Keyword(null,"export-file","export-file",-1808912864),(function logseq$graph_parser$exporter$export_doc_file_$_export_file(conn__$1,m,opts){
return logseq.graph_parser.exporter.add_file_to_db_graph(conn__$1,new cljs.core.Keyword("file","path","file/path",-191335748).cljs$core$IFn$_invoke$arity$1(m),new cljs.core.Keyword("file","content","file/content",12680964).cljs$core$IFn$_invoke$arity$1(m),opts);
}));
return promesa.core.catch$.cljs$core$IFn$_invoke$arity$2(promesa.protocols._mcat(promesa.protocols._promise(null),(function (___48218__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((function (){var G__131579 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("graph","importing-state","graph/importing-state",34918559),new cljs.core.Keyword(null,"current-idx","current-idx",1734114444)], null);
var G__131580 = (idx + (1));
return (set_ui_state.cljs$core$IFn$_invoke$arity$2 ? set_ui_state.cljs$core$IFn$_invoke$arity$2(G__131579,G__131580) : set_ui_state.call(null,G__131579,G__131580));
})()),(function (_){
return promesa.protocols._mcat(promesa.protocols._promise((function (){var G__131582 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("graph","importing-state","graph/importing-state",34918559),new cljs.core.Keyword(null,"current-page","current-page",-101294180)], null);
var G__131583 = path;
return (set_ui_state.cljs$core$IFn$_invoke$arity$2 ? set_ui_state.cljs$core$IFn$_invoke$arity$2(G__131582,G__131583) : set_ui_state.call(null,G__131582,G__131583));
})()),(function (___$1){
return promesa.protocols._mcat(promesa.protocols._promise((_LT_read_file.cljs$core$IFn$_invoke$arity$1 ? _LT_read_file.cljs$core$IFn$_invoke$arity$1(file) : _LT_read_file.call(null,file))),(function (content){
return promesa.protocols._mcat(promesa.protocols._promise(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("file","path","file/path",-191335748),path,new cljs.core.Keyword("file","content","file/content",12680964),content], null)),(function (m){
return promesa.protocols._mcat(promesa.protocols._promise((function (){var G__131584 = conn;
var G__131585 = m;
var G__131586 = cljs.core.dissoc.cljs$core$IFn$_invoke$arity$variadic(options,new cljs.core.Keyword(null,"set-ui-state","set-ui-state",1991288653),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"export-file","export-file",-1808912864)], 0));
return (export_file.cljs$core$IFn$_invoke$arity$3 ? export_file.cljs$core$IFn$_invoke$arity$3(G__131584,G__131585,G__131586) : export_file.call(null,G__131584,G__131585,G__131586));
})()),(function (___48186__auto__){
return promesa.protocols._promise(m);
}));
}));
}));
}));
}));
})),(function (error){
var G__131590 = new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"msg","msg",-1386103444),["Import failed on ",cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([path], 0))," with error:\n",cljs.core.str.cljs$core$IFn$_invoke$arity$1(error.message)].join(''),new cljs.core.Keyword(null,"level","level",1290497552),new cljs.core.Keyword(null,"error","error",-978969032),new cljs.core.Keyword(null,"ex-data","ex-data",-309040259),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"path","path",-188191168),path,new cljs.core.Keyword(null,"error","error",-978969032),error], null)], null);
return (notify_user.cljs$core$IFn$_invoke$arity$1 ? notify_user.cljs$core$IFn$_invoke$arity$1(G__131590) : notify_user.call(null,G__131590));
}));
});
/**
 * Exports all user created files i.e. under journals/ and pages/.
 * Recommended to use build-doc-options and pass that as options
 */
logseq.graph_parser.exporter.export_doc_files = (function logseq$graph_parser$exporter$export_doc_files(conn,_STAR_doc_files,_LT_read_file,p__131606){
var map__131607 = p__131606;
var map__131607__$1 = cljs.core.__destructure_map(map__131607);
var options = map__131607__$1;
var notify_user = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__131607__$1,new cljs.core.Keyword(null,"notify-user","notify-user",-268964208),cljs.core.prn);
var set_ui_state = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__131607__$1,new cljs.core.Keyword(null,"set-ui-state","set-ui-state",1991288653),cljs.core.constantly(null));
var G__131608_132375 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("graph","importing-state","graph/importing-state",34918559),new cljs.core.Keyword(null,"total","total",1916810418)], null);
var G__131609_132376 = cljs.core.count(_STAR_doc_files);
(set_ui_state.cljs$core$IFn$_invoke$arity$2 ? set_ui_state.cljs$core$IFn$_invoke$arity$2(G__131608_132375,G__131609_132376) : set_ui_state.call(null,G__131608_132375,G__131609_132376));

var doc_files = cljs.core.mapv.cljs$core$IFn$_invoke$arity$3((function (p1__131602_SHARP_,p2__131603_SHARP_){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(p1__131602_SHARP_,new cljs.core.Keyword(null,"idx","idx",1053688473),p2__131603_SHARP_);
}),cljs.core.sort_by.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"path","path",-188191168),_STAR_doc_files),cljs.core.range.cljs$core$IFn$_invoke$arity$2((0),cljs.core.count(_STAR_doc_files)));
return promesa.core.catch$.cljs$core$IFn$_invoke$arity$2(promesa.core.create.cljs$core$IFn$_invoke$arity$1((function (resolve_fn_131616,reject_fn_131615){
var loop_fn_131612 = (function logseq$graph_parser$exporter$export_doc_files_$_loop_fn_131612(_file_map,i){
return promesa.core.fnly.cljs$core$IFn$_invoke$arity$2((function (res_131613,err_131614){
if((!((err_131614 == null)))){
return (reject_fn_131615.cljs$core$IFn$_invoke$arity$1 ? reject_fn_131615.cljs$core$IFn$_invoke$arity$1(err_131614) : reject_fn_131615.call(null,err_131614));
} else {
if(promesa.core.recur_QMARK_(res_131613)){
promesa.exec.run_BANG_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"vthread","vthread",441141075),promesa.exec.wrap_bindings((function (){
return cljs.core.apply.cljs$core$IFn$_invoke$arity$2(logseq$graph_parser$exporter$export_doc_files_$_loop_fn_131612,new cljs.core.Keyword(null,"bindings","bindings",1271397192).cljs$core$IFn$_invoke$arity$1(res_131613));
})));

return null;
} else {
return (resolve_fn_131616.cljs$core$IFn$_invoke$arity$1 ? resolve_fn_131616.cljs$core$IFn$_invoke$arity$1(res_131613) : resolve_fn_131616.call(null,res_131613));
}
}
}),promesa.protocols._mcat(promesa.protocols._promise(null),(function (___48218__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(_file_map),(function (_file_map__$1){
return promesa.protocols._mcat(promesa.protocols._promise(i),(function (i__$1){
return promesa.protocols._promise((((i__$1 >= (cljs.core.count(doc_files) - (1))))?null:promesa.core.__GT_Recur(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [logseq.graph_parser.exporter.export_doc_file(cljs.core.get.cljs$core$IFn$_invoke$arity$2(doc_files,(i__$1 + (1))),conn,_LT_read_file,options),(i__$1 + (1))], null))));
}));
}));
})));
});
return promesa.exec.run_BANG_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"vthread","vthread",441141075),promesa.exec.wrap_bindings((function (){
return loop_fn_131612(logseq.graph_parser.exporter.export_doc_file(cljs.core.get.cljs$core$IFn$_invoke$arity$2(doc_files,(0)),conn,_LT_read_file,options),(0));
})));
})),(function (e){
var G__131632 = new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"msg","msg",-1386103444),["Import has unexpected error:\n",cljs.core.str.cljs$core$IFn$_invoke$arity$1(e.message)].join(''),new cljs.core.Keyword(null,"level","level",1290497552),new cljs.core.Keyword(null,"error","error",-978969032),new cljs.core.Keyword(null,"ex-data","ex-data",-309040259),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"error","error",-978969032),e], null)], null);
return (notify_user.cljs$core$IFn$_invoke$arity$1 ? notify_user.cljs$core$IFn$_invoke$arity$1(G__131632) : notify_user.call(null,G__131632));
}));
});
logseq.graph_parser.exporter.default_save_file = (function logseq$graph_parser$exporter$default_save_file(conn,path,content){
return logseq.db.transact_BANG_.cljs$core$IFn$_invoke$arity$2(conn,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword("file","path","file/path",-191335748),path,new cljs.core.Keyword("file","content","file/content",12680964),content,new cljs.core.Keyword("file","last-modified-at","file/last-modified-at",473527310),(new Date())], null)], null));
});
/**
 * Exports files under logseq/
 */
logseq.graph_parser.exporter.export_logseq_files = (function logseq$graph_parser$exporter$export_logseq_files(repo_or_conn,logseq_files,_LT_read_file,p__131652){
var map__131653 = p__131652;
var map__131653__$1 = cljs.core.__destructure_map(map__131653);
var _LT_save_file = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__131653__$1,new cljs.core.Keyword(null,"<save-file","<save-file",1293534470),logseq.graph_parser.exporter.default_save_file);
var notify_user = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__131653__$1,new cljs.core.Keyword(null,"notify-user","notify-user",-268964208));
var custom_css = cljs.core.first(cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (p1__131640_SHARP_){
return clojure.string.ends_with_QMARK_(new cljs.core.Keyword(null,"path","path",-188191168).cljs$core$IFn$_invoke$arity$1(p1__131640_SHARP_),"logseq/custom.css");
}),logseq_files));
var custom_js = cljs.core.first(cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (p1__131641_SHARP_){
return clojure.string.ends_with_QMARK_(new cljs.core.Keyword(null,"path","path",-188191168).cljs$core$IFn$_invoke$arity$1(p1__131641_SHARP_),"logseq/custom.js");
}),logseq_files));
return promesa.core.catch$.cljs$core$IFn$_invoke$arity$2(promesa.protocols._mcat(promesa.protocols._promise(null),(function (___48196__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((cljs.core.truth_(custom_css)?promesa.core.then.cljs$core$IFn$_invoke$arity$2((_LT_read_file.cljs$core$IFn$_invoke$arity$1 ? _LT_read_file.cljs$core$IFn$_invoke$arity$1(custom_css) : _LT_read_file.call(null,custom_css)),(function (p1__131642_SHARP_){
return (_LT_save_file.cljs$core$IFn$_invoke$arity$3 ? _LT_save_file.cljs$core$IFn$_invoke$arity$3(repo_or_conn,"logseq/custom.css",p1__131642_SHARP_) : _LT_save_file.call(null,repo_or_conn,"logseq/custom.css",p1__131642_SHARP_));
})):null)),(function (___48186__auto__){
return promesa.protocols._promise((cljs.core.truth_(custom_js)?promesa.core.then.cljs$core$IFn$_invoke$arity$2((_LT_read_file.cljs$core$IFn$_invoke$arity$1 ? _LT_read_file.cljs$core$IFn$_invoke$arity$1(custom_js) : _LT_read_file.call(null,custom_js)),(function (p1__131646_SHARP_){
return (_LT_save_file.cljs$core$IFn$_invoke$arity$3 ? _LT_save_file.cljs$core$IFn$_invoke$arity$3(repo_or_conn,"logseq/custom.js",p1__131646_SHARP_) : _LT_save_file.call(null,repo_or_conn,"logseq/custom.js",p1__131646_SHARP_));
})):null));
}));
})),(function (error){
var G__131657 = new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"msg","msg",-1386103444),["Import unexpectedly failed while reading logseq files:\n",cljs.core.str.cljs$core$IFn$_invoke$arity$1(error.message)].join(''),new cljs.core.Keyword(null,"level","level",1290497552),new cljs.core.Keyword(null,"error","error",-978969032),new cljs.core.Keyword(null,"ex-data","ex-data",-309040259),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"error","error",-978969032),error], null)], null);
return (notify_user.cljs$core$IFn$_invoke$arity$1 ? notify_user.cljs$core$IFn$_invoke$arity$1(G__131657) : notify_user.call(null,G__131657));
}));
});
/**
 * Exports logseq/config.edn by saving to database and setting any properties related to config
 */
logseq.graph_parser.exporter.export_config_file = (function logseq$graph_parser$exporter$export_config_file(repo_or_conn,config_file,_LT_read_file,p__131663){
var map__131664 = p__131663;
var map__131664__$1 = cljs.core.__destructure_map(map__131664);
var _LT_save_file = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__131664__$1,new cljs.core.Keyword(null,"<save-file","<save-file",1293534470),logseq.graph_parser.exporter.default_save_file);
var notify_user = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__131664__$1,new cljs.core.Keyword(null,"notify-user","notify-user",-268964208));
var default_config = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__131664__$1,new cljs.core.Keyword(null,"default-config","default-config",-695396957),cljs.core.PersistentArrayMap.EMPTY);
return promesa.core.catch$.cljs$core$IFn$_invoke$arity$2(promesa.core.then.cljs$core$IFn$_invoke$arity$2((_LT_read_file.cljs$core$IFn$_invoke$arity$1 ? _LT_read_file.cljs$core$IFn$_invoke$arity$1(config_file) : _LT_read_file.call(null,config_file)),(function (p1__131658_SHARP_){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___48196__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((function (){var G__131669 = repo_or_conn;
var G__131670 = "logseq/config.edn";
var G__131671 = logseq.graph_parser.exporter.pretty_print_dissoc(p1__131658_SHARP_,cljs.core.keys(logseq.common.config.file_only_config));
return (_LT_save_file.cljs$core$IFn$_invoke$arity$3 ? _LT_save_file.cljs$core$IFn$_invoke$arity$3(G__131669,G__131670,G__131671) : _LT_save_file.call(null,G__131669,G__131670,G__131671));
})()),(function (___48186__auto__){
return promesa.protocols._promise((function (){var config = clojure.edn.read_string.cljs$core$IFn$_invoke$arity$1(p1__131658_SHARP_);
var temp__5804__auto___132400 = (function (){var or__5002__auto__ = new cljs.core.Keyword("journal","page-title-format","journal/page-title-format",2033061997).cljs$core$IFn$_invoke$arity$1(config);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword(null,"date-formatter","date-formatter",-223324709).cljs$core$IFn$_invoke$arity$1(config);
}
})();
if(cljs.core.truth_(temp__5804__auto___132400)){
var title_format_132403 = temp__5804__auto___132400;
logseq.db.transact_BANG_.cljs$core$IFn$_invoke$arity$2(repo_or_conn,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("db","ident","db/ident",-737096),new cljs.core.Keyword("logseq.class","Journal","logseq.class/Journal",1979741081),new cljs.core.Keyword("logseq.property.journal","title-format","logseq.property.journal/title-format",-1536497954),title_format_132403], null)], null));
} else {
}

return config;
})());
}));
}));
})),(function (err){
var G__131676_132411 = new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"msg","msg",-1386103444),"Import may have mistakes due to an invalid config.edn. Recommend re-importing with a valid config.edn",new cljs.core.Keyword(null,"level","level",1290497552),new cljs.core.Keyword(null,"error","error",-978969032),new cljs.core.Keyword(null,"ex-data","ex-data",-309040259),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"error","error",-978969032),err], null)], null);
(notify_user.cljs$core$IFn$_invoke$arity$1 ? notify_user.cljs$core$IFn$_invoke$arity$1(G__131676_132411) : notify_user.call(null,G__131676_132411));

return clojure.edn.read_string.cljs$core$IFn$_invoke$arity$1(default_config);
}));
});
logseq.graph_parser.exporter.export_class_properties = (function logseq$graph_parser$exporter$export_class_properties(conn,repo_or_conn){
var user_classes = cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (p1__131683_SHARP_){
var G__131688 = new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(p1__131683_SHARP_);
return (logseq.db.frontend.class$.built_in_classes.cljs$core$IFn$_invoke$arity$1 ? logseq.db.frontend.class$.built_in_classes.cljs$core$IFn$_invoke$arity$1(G__131688) : logseq.db.frontend.class$.built_in_classes.call(null,G__131688));
}),cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.first,(function (){var G__131693 = new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"find","find",496279456),cljs.core.list(new cljs.core.Symbol(null,"pull","pull",779986722,null),new cljs.core.Symbol(null,"?b","?b",1575118075,null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","id","db/id",-1388397098),new cljs.core.Keyword("db","ident","db/ident",-737096)], null)),new cljs.core.Keyword(null,"where","where",-2044795965),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?b","?b",1575118075,null),new cljs.core.Keyword("block","tags","block/tags",1814948340),new cljs.core.Keyword("logseq.class","Tag","logseq.class/Tag",-538902083)], null)], null);
var G__131694 = cljs.core.deref(conn);
return (datascript.core.q.cljs$core$IFn$_invoke$arity$2 ? datascript.core.q.cljs$core$IFn$_invoke$arity$2(G__131693,G__131694) : datascript.core.q.call(null,G__131693,G__131694));
})()));
var class_to_prop_uuids = cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (acc,p__131698){
var vec__131703 = p__131698;
var class_id = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__131703,(0),null);
var prop_ident = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__131703,(1),null);
return cljs.core.update.cljs$core$IFn$_invoke$arity$4(acc,class_id,cljs.core.fnil.cljs$core$IFn$_invoke$arity$2(cljs.core.conj,cljs.core.PersistentHashSet.EMPTY),prop_ident);
}),cljs.core.PersistentArrayMap.EMPTY,cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (p1__131684_SHARP_){
var G__131710 = (function (){var G__131711 = cljs.core.deref(conn);
var G__131712 = cljs.core.second(p1__131684_SHARP_);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__131711,G__131712) : datascript.core.entity.call(null,G__131711,G__131712));
})();
return (logseq.db.built_in_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.built_in_QMARK_.cljs$core$IFn$_invoke$arity$1(G__131710) : logseq.db.built_in_QMARK_.call(null,G__131710));
}),(function (){var G__131714 = new cljs.core.PersistentVector(null, 13, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"find","find",496279456),new cljs.core.Symbol(null,"?t","?t",1786819229,null),new cljs.core.Symbol(null,"?prop","?prop",1880869414,null),new cljs.core.Keyword(null,"in","in",-1531184865),new cljs.core.Symbol(null,"$","$",-1580747756,null),new cljs.core.Symbol(null,"?user-classes","?user-classes",-1375813354,null),new cljs.core.Keyword(null,"where","where",-2044795965),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?b","?b",1575118075,null),new cljs.core.Keyword("block","tags","block/tags",1814948340),new cljs.core.Symbol(null,"?t","?t",1786819229,null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?t","?t",1786819229,null),new cljs.core.Keyword("db","ident","db/ident",-737096),new cljs.core.Symbol(null,"?class","?class",919269736,null)], null),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.list(new cljs.core.Symbol(null,"contains?","contains?",-1676812576,null),new cljs.core.Symbol(null,"?user-classes","?user-classes",-1375813354,null),new cljs.core.Symbol(null,"?class","?class",919269736,null))], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?b","?b",1575118075,null),new cljs.core.Symbol(null,"?prop","?prop",1880869414,null),new cljs.core.Symbol(null,"_","_",-1201019570,null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?prop-e","?prop-e",-213176507,null),new cljs.core.Keyword("db","ident","db/ident",-737096),new cljs.core.Symbol(null,"?prop","?prop",1880869414,null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?prop-e","?prop-e",-213176507,null),new cljs.core.Keyword("block","tags","block/tags",1814948340),new cljs.core.Keyword("logseq.class","Property","logseq.class/Property",1038767048)], null)], null);
var G__131715 = cljs.core.deref(conn);
var G__131716 = cljs.core.set(cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","ident","db/ident",-737096),user_classes));
return (datascript.core.q.cljs$core$IFn$_invoke$arity$3 ? datascript.core.q.cljs$core$IFn$_invoke$arity$3(G__131714,G__131715,G__131716) : datascript.core.q.call(null,G__131714,G__131715,G__131716));
})()));
var tx = cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (p__131720){
var vec__131721 = p__131720;
var class_id = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__131721,(0),null);
var prop_ids = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__131721,(1),null);
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("db","id","db/id",-1388397098),class_id,new cljs.core.Keyword("logseq.property.class","properties","logseq.property.class/properties",-2123712050),cljs.core.vec(prop_ids)], null);
}),class_to_prop_uuids);
return logseq.db.transact_BANG_.cljs$core$IFn$_invoke$arity$2(repo_or_conn,tx);
});
/**
 * Exports files under assets/
 */
logseq.graph_parser.exporter.export_asset_files = (function logseq$graph_parser$exporter$export_asset_files(_STAR_asset_files,_LT_copy_asset_file,p__131733){
var map__131740 = p__131733;
var map__131740__$1 = cljs.core.__destructure_map(map__131740);
var notify_user = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__131740__$1,new cljs.core.Keyword(null,"notify-user","notify-user",-268964208));
var set_ui_state = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__131740__$1,new cljs.core.Keyword(null,"set-ui-state","set-ui-state",1991288653),cljs.core.constantly(null));
var asset_files = cljs.core.mapv.cljs$core$IFn$_invoke$arity$3((function (p1__131724_SHARP_,p2__131725_SHARP_){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(p1__131724_SHARP_,new cljs.core.Keyword(null,"idx","idx",1053688473),p2__131725_SHARP_);
}),cljs.core.sort_by.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"path","path",-188191168),_STAR_asset_files),cljs.core.range.cljs$core$IFn$_invoke$arity$2((0),cljs.core.count(_STAR_asset_files)));
var copy_asset = (function logseq$graph_parser$exporter$export_asset_files_$_copy_asset(p__131748){
var map__131749 = p__131748;
var map__131749__$1 = cljs.core.__destructure_map(map__131749);
var file = map__131749__$1;
var path = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__131749__$1,new cljs.core.Keyword(null,"path","path",-188191168));
return promesa.core.catch$.cljs$core$IFn$_invoke$arity$2((_LT_copy_asset_file.cljs$core$IFn$_invoke$arity$1 ? _LT_copy_asset_file.cljs$core$IFn$_invoke$arity$1(file) : _LT_copy_asset_file.call(null,file)),(function (error){
var G__131752 = new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"msg","msg",-1386103444),["Import failed on ",cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([path], 0))," with error:\n",cljs.core.str.cljs$core$IFn$_invoke$arity$1(error.message)].join(''),new cljs.core.Keyword(null,"level","level",1290497552),new cljs.core.Keyword(null,"error","error",-978969032),new cljs.core.Keyword(null,"ex-data","ex-data",-309040259),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"path","path",-188191168),path,new cljs.core.Keyword(null,"error","error",-978969032),error], null)], null);
return (notify_user.cljs$core$IFn$_invoke$arity$1 ? notify_user.cljs$core$IFn$_invoke$arity$1(G__131752) : notify_user.call(null,G__131752));
}));
});
if(cljs.core.seq(asset_files)){
var G__131759_132455 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("graph","importing-state","graph/importing-state",34918559),new cljs.core.Keyword(null,"current-page","current-page",-101294180)], null);
var G__131760_132456 = "Asset files";
(set_ui_state.cljs$core$IFn$_invoke$arity$2 ? set_ui_state.cljs$core$IFn$_invoke$arity$2(G__131759_132455,G__131760_132456) : set_ui_state.call(null,G__131759_132455,G__131760_132456));

return promesa.core.catch$.cljs$core$IFn$_invoke$arity$2(promesa.core.create.cljs$core$IFn$_invoke$arity$1((function (resolve_fn_131769,reject_fn_131768){
var loop_fn_131765 = (function logseq$graph_parser$exporter$export_asset_files_$_loop_fn_131765(_,i){
return promesa.core.fnly.cljs$core$IFn$_invoke$arity$2((function (res_131766,err_131767){
if((!((err_131767 == null)))){
return (reject_fn_131768.cljs$core$IFn$_invoke$arity$1 ? reject_fn_131768.cljs$core$IFn$_invoke$arity$1(err_131767) : reject_fn_131768.call(null,err_131767));
} else {
if(promesa.core.recur_QMARK_(res_131766)){
promesa.exec.run_BANG_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"vthread","vthread",441141075),promesa.exec.wrap_bindings((function (){
return cljs.core.apply.cljs$core$IFn$_invoke$arity$2(logseq$graph_parser$exporter$export_asset_files_$_loop_fn_131765,new cljs.core.Keyword(null,"bindings","bindings",1271397192).cljs$core$IFn$_invoke$arity$1(res_131766));
})));

return null;
} else {
return (resolve_fn_131769.cljs$core$IFn$_invoke$arity$1 ? resolve_fn_131769.cljs$core$IFn$_invoke$arity$1(res_131766) : resolve_fn_131769.call(null,res_131766));
}
}
}),promesa.protocols._mcat(promesa.protocols._promise(null),(function (___48218__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(_),(function (___$1){
return promesa.protocols._mcat(promesa.protocols._promise(i),(function (i__$1){
return promesa.protocols._promise((((i__$1 >= (cljs.core.count(asset_files) - (1))))?null:promesa.core.__GT_Recur(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [copy_asset(cljs.core.get.cljs$core$IFn$_invoke$arity$2(asset_files,(i__$1 + (1)))),(i__$1 + (1))], null))));
}));
}));
})));
});
return promesa.exec.run_BANG_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"vthread","vthread",441141075),promesa.exec.wrap_bindings((function (){
return loop_fn_131765(copy_asset(cljs.core.get.cljs$core$IFn$_invoke$arity$2(asset_files,(0))),(0));
})));
})),(function (e){
var G__131794 = new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"msg","msg",-1386103444),["Import has an unexpected error:\n",cljs.core.str.cljs$core$IFn$_invoke$arity$1(e.message)].join(''),new cljs.core.Keyword(null,"level","level",1290497552),new cljs.core.Keyword(null,"error","error",-978969032),new cljs.core.Keyword(null,"ex-data","ex-data",-309040259),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"error","error",-978969032),e], null)], null);
return (notify_user.cljs$core$IFn$_invoke$arity$1 ? notify_user.cljs$core$IFn$_invoke$arity$1(G__131794) : notify_user.call(null,G__131794));
}));
} else {
return null;
}
});
/**
 * Inserts favorited pages as uuids into a new favorite page
 */
logseq.graph_parser.exporter.insert_favorites = (function logseq$graph_parser$exporter$insert_favorites(repo_or_conn,favorited_ids,page_id){
var tx = cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (acc,favorite_id){
return cljs.core.conj.cljs$core$IFn$_invoke$arity$2(acc,(function (){var G__131804 = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([(logseq.db.build_favorite_tx.cljs$core$IFn$_invoke$arity$1 ? logseq.db.build_favorite_tx.cljs$core$IFn$_invoke$arity$1(favorite_id) : logseq.db.build_favorite_tx.call(null,favorite_id)),new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),(datascript.core.squuid.cljs$core$IFn$_invoke$arity$0 ? datascript.core.squuid.cljs$core$IFn$_invoke$arity$0() : datascript.core.squuid.call(null)),new cljs.core.Keyword("db","id","db/id",-1388397098),(function (){var or__5002__auto__ = (function (){var G__131807 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(cljs.core.last(acc));
if((G__131807 == null)){
return null;
} else {
return (G__131807 - (1));
}
})();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return (-1);
}
})(),new cljs.core.Keyword("block","order","block/order",-1429282437),logseq.db.common.order.gen_key.cljs$core$IFn$_invoke$arity$1(null),new cljs.core.Keyword("block","parent","block/parent",-918309064),page_id,new cljs.core.Keyword("block","page","block/page",822314108),page_id], null)], 0));
return (logseq.db.sqlite.util.block_with_timestamps.cljs$core$IFn$_invoke$arity$1 ? logseq.db.sqlite.util.block_with_timestamps.cljs$core$IFn$_invoke$arity$1(G__131804) : logseq.db.sqlite.util.block_with_timestamps.call(null,G__131804));
})());
}),cljs.core.PersistentVector.EMPTY,favorited_ids);
return logseq.db.transact_BANG_.cljs$core$IFn$_invoke$arity$2(repo_or_conn,tx);
});
logseq.graph_parser.exporter.export_favorites_from_config_edn = (function logseq$graph_parser$exporter$export_favorites_from_config_edn(conn,repo,config,p__131819){
var map__131820 = p__131819;
var map__131820__$1 = cljs.core.__destructure_map(map__131820);
var log_fn = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__131820__$1,new cljs.core.Keyword(null,"log-fn","log-fn",-2003241282),cljs.core.prn);
var temp__5804__auto__ = cljs.core.seq(new cljs.core.Keyword(null,"favorites","favorites",1740773480).cljs$core$IFn$_invoke$arity$1(config));
if(temp__5804__auto__){
var favorites = temp__5804__auto__;
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___48196__auto__){
return promesa.protocols._promise((function (){var temp__5802__auto__ = cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (page_name){
var G__131826 = logseq.db.get_page(cljs.core.deref(conn),page_name);
if((G__131826 == null)){
return null;
} else {
return new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(G__131826);
}
}),favorites);
if(cljs.core.truth_(temp__5802__auto__)){
var favorited_ids = temp__5802__auto__;
var page_entity = logseq.db.get_page(cljs.core.deref(conn),logseq.common.config.favorites_page_name);
return logseq.graph_parser.exporter.insert_favorites(repo,favorited_ids,new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(page_entity));
} else {
var G__131830 = new cljs.core.Keyword(null,"no-favorites-found","no-favorites-found",943306035);
var G__131831 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"favorites","favorites",1740773480),favorites], null);
return (log_fn.cljs$core$IFn$_invoke$arity$2 ? log_fn.cljs$core$IFn$_invoke$arity$2(G__131830,G__131831) : log_fn.call(null,G__131830,G__131831));
}
})());
}));
} else {
return null;
}
});
/**
 * Builds options for use with export-doc-files
 */
logseq.graph_parser.exporter.build_doc_options = (function logseq$graph_parser$exporter$build_doc_options(config,options){
return cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"extract-options","extract-options",-572164844),new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"date-formatter","date-formatter",-223324709),logseq.common.config.get_date_formatter(config),new cljs.core.Keyword(null,"user-config","user-config",-1138679827),cljs.core.dissoc.cljs$core$IFn$_invoke$arity$variadic(config,new cljs.core.Keyword("property-pages","excludelist","property-pages/excludelist",1710831097),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("property-pages","enabled?","property-pages/enabled?",-48336645)], 0)),new cljs.core.Keyword(null,"filename-format","filename-format",-1193264412),(function (){var or__5002__auto__ = new cljs.core.Keyword("file","name-format","file/name-format",1975432459).cljs$core$IFn$_invoke$arity$1(config);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword(null,"legacy","legacy",1434943289);
}
})(),new cljs.core.Keyword(null,"verbose","verbose",1694226060),new cljs.core.Keyword(null,"verbose","verbose",1694226060).cljs$core$IFn$_invoke$arity$1(options)], null),new cljs.core.Keyword(null,"user-config","user-config",-1138679827),config,new cljs.core.Keyword(null,"user-options","user-options",-84696866),cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"remove-inline-tags?","remove-inline-tags?",-1198387053),true,new cljs.core.Keyword(null,"convert-all-tags?","convert-all-tags?",-1869310481),true], null),new cljs.core.Keyword(null,"user-options","user-options",-84696866).cljs$core$IFn$_invoke$arity$1(options)], 0)),new cljs.core.Keyword(null,"import-state","import-state",1493794865),logseq.graph_parser.exporter.new_import_state(),new cljs.core.Keyword(null,"macros","macros",811339431),(function (){var or__5002__auto__ = new cljs.core.Keyword(null,"macros","macros",811339431).cljs$core$IFn$_invoke$arity$1(options);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword(null,"macros","macros",811339431).cljs$core$IFn$_invoke$arity$1(config);
}
})()], null),cljs.core.select_keys(options,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"set-ui-state","set-ui-state",1991288653),new cljs.core.Keyword(null,"export-file","export-file",-1808912864),new cljs.core.Keyword(null,"notify-user","notify-user",-268964208)], null))], 0));
});
/**
 * Main fn which exports a file graph given its files and imports them
 * into a DB graph. Files is expected to be a seq of maps with a :path key.
 * The user experiences this as an import so all user-facing messages are
 * described as import. options map contains the following keys:
 * * :set-ui-state - fn which updates ui to indicate progress of import
 * * :notify-user - fn which notifies user of important messages with a map
 *   containing keys :msg, :level and optionally :ex-data when there is an error
 * * :log-fn - fn which logs developer messages
 * * :rpath-key - keyword used to get relative path in file map. Default to :path
 * * :<read-file - fn which reads a file across multiple steps
 * * :default-config - default config if config is unable to be read
 * * :user-options - map of user specific options. See add-file-to-db-graph for more
 * * :<save-config-file - fn which saves a config file
 * * :<save-logseq-file - fn which saves a logseq file
 * * :<copy-asset - fn which copies asset file
 * 
 * Note: See export-doc-files for additional options that are only for it
 */
logseq.graph_parser.exporter.export_file_graph = (function logseq$graph_parser$exporter$export_file_graph(repo_or_conn,conn,config_file,_STAR_files,p__131854){
var map__131856 = p__131854;
var map__131856__$1 = cljs.core.__destructure_map(map__131856);
var options = map__131856__$1;
var _LT_read_file = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__131856__$1,new cljs.core.Keyword(null,"<read-file","<read-file",-785932647));
var _LT_copy_asset = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__131856__$1,new cljs.core.Keyword(null,"<copy-asset","<copy-asset",-1388487410));
var rpath_key = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__131856__$1,new cljs.core.Keyword(null,"rpath-key","rpath-key",1154764950),new cljs.core.Keyword(null,"path","path",-188191168));
var log_fn = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__131856__$1,new cljs.core.Keyword(null,"log-fn","log-fn",-2003241282),cljs.core.println);
cljs.core.reset_BANG_(logseq.graph_parser.block._STAR_export_to_db_graph_QMARK_,true);

return promesa.core.catch$.cljs$core$IFn$_invoke$arity$2(promesa.core.finally$.cljs$core$IFn$_invoke$arity$2(promesa.protocols._mcat(promesa.protocols._promise(null),(function (___48218__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(logseq.graph_parser.exporter.export_config_file(repo_or_conn,config_file,_LT_read_file,clojure.set.rename_keys(cljs.core.select_keys(options,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"notify-user","notify-user",-268964208),new cljs.core.Keyword(null,"default-config","default-config",-695396957),new cljs.core.Keyword(null,"<save-config-file","<save-config-file",1332025175)], null)),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"<save-config-file","<save-config-file",1332025175),new cljs.core.Keyword(null,"<save-file","<save-file",1293534470)], null)))),(function (config){
return promesa.protocols._promise((function (){var files = logseq.common.config.remove_hidden_files(_STAR_files,config,rpath_key);
var logseq_file_QMARK_ = (function (p1__131847_SHARP_){
return clojure.string.starts_with_QMARK_(cljs.core.get.cljs$core$IFn$_invoke$arity$2(p1__131847_SHARP_,rpath_key),"logseq/");
});
var doc_files = cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (p1__131849_SHARP_){
return cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 4, ["org",null,"md",null,"markdown",null,"edn",null], null), null),logseq.common.path.file_ext(new cljs.core.Keyword(null,"path","path",-188191168).cljs$core$IFn$_invoke$arity$1(p1__131849_SHARP_)));
}),cljs.core.remove.cljs$core$IFn$_invoke$arity$2(logseq_file_QMARK_,files));
var asset_files = cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (p1__131850_SHARP_){
return clojure.string.starts_with_QMARK_(cljs.core.get.cljs$core$IFn$_invoke$arity$2(p1__131850_SHARP_,rpath_key),"assets/");
}),files);
var doc_options = logseq.graph_parser.exporter.build_doc_options(config,options);
var G__131870_132479 = "Importing";
var G__131871_132480 = cljs.core.count(doc_files);
var G__131872_132481 = "files ...";
(log_fn.cljs$core$IFn$_invoke$arity$3 ? log_fn.cljs$core$IFn$_invoke$arity$3(G__131870_132479,G__131871_132480,G__131872_132481) : log_fn.call(null,G__131870_132479,G__131871_132480,G__131872_132481));

return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___48196__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(logseq.graph_parser.exporter.export_logseq_files(repo_or_conn,cljs.core.filter.cljs$core$IFn$_invoke$arity$2(logseq_file_QMARK_,files),_LT_read_file,clojure.set.rename_keys(cljs.core.select_keys(options,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"notify-user","notify-user",-268964208),new cljs.core.Keyword(null,"<save-logseq-file","<save-logseq-file",289148715)], null)),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"<save-logseq-file","<save-logseq-file",289148715),new cljs.core.Keyword(null,"<save-file","<save-file",1293534470)], null)))),(function (___48186__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(logseq.graph_parser.exporter.export_asset_files(asset_files,_LT_copy_asset,cljs.core.select_keys(options,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"notify-user","notify-user",-268964208),new cljs.core.Keyword(null,"set-ui-state","set-ui-state",1991288653)], null)))),(function (___48186__auto____$1){
return promesa.protocols._mcat(promesa.protocols._promise(logseq.graph_parser.exporter.export_doc_files(conn,doc_files,_LT_read_file,doc_options)),(function (___48186__auto____$2){
return promesa.protocols._mcat(promesa.protocols._promise(logseq.graph_parser.exporter.export_favorites_from_config_edn(conn,repo_or_conn,config,cljs.core.PersistentArrayMap.EMPTY)),(function (___48186__auto____$3){
return promesa.protocols._mcat(promesa.protocols._promise(logseq.graph_parser.exporter.export_class_properties(conn,repo_or_conn)),(function (___48186__auto____$4){
return promesa.protocols._promise(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"import-state","import-state",1493794865),new cljs.core.Keyword(null,"import-state","import-state",1493794865).cljs$core$IFn$_invoke$arity$1(doc_options),new cljs.core.Keyword(null,"files","files",-472457450),files], null));
}));
}));
}));
}));
}));
}));
})());
}));
})),(function (_){
return cljs.core.reset_BANG_(logseq.graph_parser.block._STAR_export_to_db_graph_QMARK_,false);
})),(function (e){
cljs.core.reset_BANG_(logseq.graph_parser.block._STAR_export_to_db_graph_QMARK_,false);

var G__131893 = new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"msg","msg",-1386103444),["Import has unexpected error:\n",cljs.core.str.cljs$core$IFn$_invoke$arity$1(e.message)].join(''),new cljs.core.Keyword(null,"level","level",1290497552),new cljs.core.Keyword(null,"error","error",-978969032),new cljs.core.Keyword(null,"ex-data","ex-data",-309040259),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"error","error",-978969032),e], null)], null);
var fexpr__131892 = new cljs.core.Keyword(null,"notify-user","notify-user",-268964208).cljs$core$IFn$_invoke$arity$1(options);
return (fexpr__131892.cljs$core$IFn$_invoke$arity$1 ? fexpr__131892.cljs$core$IFn$_invoke$arity$1(G__131893) : fexpr__131892.call(null,G__131893));
}));
});

//# sourceMappingURL=logseq.graph_parser.exporter.js.map
