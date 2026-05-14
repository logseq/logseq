goog.provide('frontend.worker.handler.page.file_based.rename');
/**
 * Unsanitized names
 */
frontend.worker.handler.page.file_based.rename.replace_page_ref_aux = (function frontend$worker$handler$page$file_based$rename$replace_page_ref_aux(config,content,old_name,new_name){
var preferred_format = logseq.common.config.get_preferred_format(config);
var vec__131501 = cljs.core.map.cljs$core$IFn$_invoke$arity$2(clojure.string.trim,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [old_name,new_name], null));
var original_old_name = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__131501,(0),null);
var original_new_name = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__131501,(1),null);
var vec__131504 = cljs.core.map.cljs$core$IFn$_invoke$arity$2(logseq.common.util.page_ref.__GT_page_ref,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [old_name,new_name], null));
var old_ref = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__131504,(0),null);
var new_ref = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__131504,(1),null);
var vec__131507 = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__131495_SHARP_){
if(clojure.string.includes_QMARK_(p1__131495_SHARP_,"/")){
return clojure.string.replace(p1__131495_SHARP_,"/",".");
} else {
return p1__131495_SHARP_;
}
}),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [original_old_name,original_new_name], null));
var old_name__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__131507,(0),null);
var new_name__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__131507,(1),null);
var old_org_ref = (function (){var and__5000__auto__ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"org","org",1495985),preferred_format);
if(and__5000__auto__){
var and__5000__auto____$1 = new cljs.core.Keyword("org-mode","insert-file-link?","org-mode/insert-file-link?",-1472433842).cljs$core$IFn$_invoke$arity$1(config);
if(cljs.core.truth_(and__5000__auto____$1)){
return cljs.core.re_find(cljs.core.re_pattern(logseq.common.util.format.cljs$core$IFn$_invoke$arity$variadic("\\[\\[file:\\.*/.*%s\\.org\\]\\[(.*?)\\]\\]",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([old_name__$1], 0))),content);
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})();
return clojure.string.replace((cljs.core.truth_(old_org_ref)?(function (){var vec__131518 = old_org_ref;
var old_full_ref = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__131518,(0),null);
var old_label = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__131518,(1),null);
var new_label = ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(old_label,original_old_name))?original_new_name:old_label);
var new_full_ref = clojure.string.replace(clojure.string.replace(old_full_ref,old_name__$1,new_name__$1),["[",cljs.core.str.cljs$core$IFn$_invoke$arity$1(old_label),"]"].join(''),["[",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new_label),"]"].join(''));
return clojure.string.replace(content,old_full_ref,new_full_ref);
})():content),old_ref,new_ref);
});
frontend.worker.handler.page.file_based.rename.replace_tag_ref_BANG_ = (function frontend$worker$handler$page$file_based$rename$replace_tag_ref_BANG_(content,old_name,new_name){
var old_tag = logseq.common.util.format.cljs$core$IFn$_invoke$arity$variadic("#%s",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([old_name], 0));
var new_tag = (cljs.core.truth_(cljs.core.re_find(/[\s\t]+/,new_name))?logseq.common.util.format.cljs$core$IFn$_invoke$arity$variadic("#[[%s]]",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new_name], 0)):["#",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new_name)].join(''));
return clojure.string.replace(content,cljs.core.re_pattern(["(?i)(^|\\s)(",cljs.core.str.cljs$core$IFn$_invoke$arity$1(logseq.common.util.escape_regex_chars(old_tag)),")(?=[,\\.]*($|\\s))"].join('')),(function (p__131535){
var vec__131536 = p__131535;
var _match = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__131536,(0),null);
var lhs = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__131536,(1),null);
var _grp2 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__131536,(2),null);
var _grp3 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__131536,(3),null);
return [cljs.core.str.cljs$core$IFn$_invoke$arity$1(lhs),cljs.core.str.cljs$core$IFn$_invoke$arity$1(new_tag)].join('');
}));
});
frontend.worker.handler.page.file_based.rename.replace_property_ref_BANG_ = (function frontend$worker$handler$page$file_based$rename$replace_property_ref_BANG_(content,old_name,new_name,format){
var new_name__$1 = cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(clojure.string.replace(clojure.string.lower_case(new_name),/\s+/,"-"));
var org_format_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"org","org",1495985),format);
var old_property = ((org_format_QMARK_)?logseq.graph_parser.property.colons_org(old_name):[cljs.core.str.cljs$core$IFn$_invoke$arity$1(old_name),logseq.graph_parser.property.colons].join(''));
var new_property = ((org_format_QMARK_)?logseq.graph_parser.property.colons_org(cljs.core.name(new_name__$1)):[cljs.core.name(new_name__$1),logseq.graph_parser.property.colons].join(''));
return logseq.common.util.replace_ignore_case(content,old_property,new_property);
});
/**
 * Unsanitized names
 */
frontend.worker.handler.page.file_based.rename.replace_old_page_BANG_ = (function frontend$worker$handler$page$file_based$rename$replace_old_page_BANG_(config,content,old_name,new_name,format){
if(((typeof content === 'string') && (((typeof old_name === 'string') && (typeof new_name === 'string'))))){
return frontend.worker.handler.page.file_based.rename.replace_property_ref_BANG_(frontend.worker.handler.page.file_based.rename.replace_tag_ref_BANG_(frontend.worker.handler.page.file_based.rename.replace_page_ref_aux(config,content,old_name,new_name),old_name,new_name),old_name,new_name,format);
} else {
return null;
}
});
/**
 * Unsanitized names
 */
frontend.worker.handler.page.file_based.rename.walk_replace_old_page_BANG_ = (function frontend$worker$handler$page$file_based$rename$walk_replace_old_page_BANG_(config,form,old_name,new_name,format){
return clojure.walk.postwalk((function (f){
if(((cljs.core.vector_QMARK_(f)) && (((cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, ["Label",null,"Search",null], null), null),cljs.core.first(f))) && (clojure.string.starts_with_QMARK_(cljs.core.second(f),[cljs.core.str.cljs$core$IFn$_invoke$arity$1(old_name),"/"].join(''))))))){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.first(f),clojure.string.replace_first(cljs.core.second(f),[cljs.core.str.cljs$core$IFn$_invoke$arity$1(old_name),"/"].join(''),[cljs.core.str.cljs$core$IFn$_invoke$arity$1(new_name),"/"].join(''))], null);
} else {
if(typeof f === 'string'){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(f,old_name)){
return new_name;
} else {
return frontend.worker.handler.page.file_based.rename.replace_old_page_BANG_(config,f,old_name,new_name,format);
}
} else {
if(cljs.core.truth_((function (){var and__5000__auto__ = cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(f);
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.name(f),old_name);
} else {
return and__5000__auto__;
}
})())){
return cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(clojure.string.replace(clojure.string.lower_case(new_name),/\s+/,"-"));
} else {
return f;

}
}
}
}),form);
});
frontend.worker.handler.page.file_based.rename.rename_update_block_refs_BANG_ = (function frontend$worker$handler$page$file_based$rename$rename_update_block_refs_BANG_(refs,from_id,to_id){
if(cljs.core.truth_(to_id)){
return cljs.core.vec(cljs.core.distinct.cljs$core$IFn$_invoke$arity$1(cljs.core.cons(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("db","id","db/id",-1388397098),to_id], null),cljs.core.remove.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentHashSet.createAsIfByAssoc([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("db","id","db/id",-1388397098),from_id], null)]),refs))));
} else {
return refs;
}
});
/**
 * Unsanitized only
 */
frontend.worker.handler.page.file_based.rename.replace_page_ref = (function frontend$worker$handler$page$file_based$rename$replace_page_ref(db,config,page,new_name){
var to_page = logseq.db.get_page(db,new_name);
var old_title = new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(page);
var blocks = new cljs.core.Keyword("block","_refs","block/_refs",830218531).cljs$core$IFn$_invoke$arity$1((function (){var G__131588 = db;
var G__131589 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(page);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__131588,G__131589) : datascript.core.entity.call(null,G__131588,G__131589));
})());
var tx = cljs.core.remove.cljs$core$IFn$_invoke$arity$2(cljs.core.nil_QMARK_,cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p__131591){
var map__131592 = p__131591;
var map__131592__$1 = cljs.core.__destructure_map(map__131592);
var block = map__131592__$1;
var uuid = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__131592__$1,new cljs.core.Keyword("block","uuid","block/uuid",-1991494552));
var title = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__131592__$1,new cljs.core.Keyword("block","title","block/title",710445684));
var properties = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__131592__$1,new cljs.core.Keyword("block","properties","block/properties",708347145));
var format = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__131592__$1,new cljs.core.Keyword("block","format","block/format",-1212045901));
var content = (function (){var content_SINGLEQUOTE_ = frontend.worker.handler.page.file_based.rename.replace_old_page_BANG_(config,title,old_title,new_name,format);
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(content_SINGLEQUOTE_,title)){
return null;
} else {
return content_SINGLEQUOTE_;
}
})();
var properties__$1 = (function (){var properties_SINGLEQUOTE_ = frontend.worker.handler.page.file_based.rename.walk_replace_old_page_BANG_(config,properties,old_title,new_name,format);
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(properties_SINGLEQUOTE_,properties)){
return null;
} else {
return properties_SINGLEQUOTE_;
}
})();
if(cljs.core.truth_((function (){var or__5002__auto__ = content;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return properties__$1;
}
})())){
return logseq.common.util.remove_nils_non_nested(new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),uuid,new cljs.core.Keyword("block","title","block/title",710445684),content,new cljs.core.Keyword("block","properties","block/properties",708347145),properties__$1,new cljs.core.Keyword("block","properties-order","block/properties-order",-968493873),((cljs.core.seq(properties__$1))?cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.first,properties__$1):null),new cljs.core.Keyword("block","refs","block/refs",-1214495349),cljs.core.set(cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","id","db/id",-1388397098),frontend.worker.handler.page.file_based.rename.rename_update_block_refs_BANG_(new cljs.core.Keyword("block","refs","block/refs",-1214495349).cljs$core$IFn$_invoke$arity$1(block),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(page),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(to_page))))], null));
} else {
return null;
}
}),blocks));
return tx;
});
/**
 * update :block/namespace of the renamed block
 */
frontend.worker.handler.page.file_based.rename.rename_update_namespace_BANG_ = (function frontend$worker$handler$page$file_based$rename$rename_update_namespace_BANG_(repo,conn,config,page,old_title,new_name){
var old_namespace_QMARK_ = (logseq.graph_parser.text.namespace_page_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.graph_parser.text.namespace_page_QMARK_.cljs$core$IFn$_invoke$arity$1(old_title) : logseq.graph_parser.text.namespace_page_QMARK_.call(null,old_title));
var new_namespace_QMARK_ = (logseq.graph_parser.text.namespace_page_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.graph_parser.text.namespace_page_QMARK_.cljs$core$IFn$_invoke$arity$1(new_name) : logseq.graph_parser.text.namespace_page_QMARK_.call(null,new_name));
if(cljs.core.truth_(new_namespace_QMARK_)){
var namespace = cljs.core.first(logseq.common.util.split_last("/",new_name));
if(cljs.core.truth_(namespace)){
frontend.worker.handler.page.create_BANG_(repo,conn,config,namespace);

var namespace_block = (function (){var G__131610 = cljs.core.deref(conn);
var G__131611 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","name","block/name",1619760316),logseq.common.util.page_name_sanity_lc(namespace)], null);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__131610,G__131611) : datascript.core.entity.call(null,G__131610,G__131611));
})();
var page_txs = new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("db","id","db/id",-1388397098),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(page),new cljs.core.Keyword("block","namespace","block/namespace",-282500695),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(namespace_block)], null)], null);
return logseq.db.transact_BANG_.cljs$core$IFn$_invoke$arity$3(conn,page_txs,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"persist-op?","persist-op?",-531287534),true], null));
} else {
return null;
}
} else {
if(cljs.core.truth_(old_namespace_QMARK_)){
return logseq.db.transact_BANG_.cljs$core$IFn$_invoke$arity$3(conn,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","retract","db/retract",-1549825231),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(page),new cljs.core.Keyword("block","namespace","block/namespace",-282500695)], null)], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"persist-op?","persist-op?",-531287534),true], null));
} else {
return null;

}
}
});
frontend.worker.handler.page.file_based.rename.based_merge_pages_BANG_ = (function frontend$worker$handler$page$file_based$rename$based_merge_pages_BANG_(repo,conn,config,from_page_name,to_page_name,p__131627){
var map__131630 = p__131627;
var map__131630__$1 = cljs.core.__destructure_map(map__131630);
var old_name = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__131630__$1,new cljs.core.Keyword(null,"old-name","old-name",1289683869));
var new_name = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__131630__$1,new cljs.core.Keyword(null,"new-name","new-name",1288355058));
var db = cljs.core.deref(conn);
var to_page = (function (){var G__131633 = db;
var G__131634 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","name","block/name",1619760316),to_page_name], null);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__131633,G__131634) : datascript.core.entity.call(null,G__131633,G__131634));
})();
var to_id = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(to_page);
var from_page = (function (){var G__131635 = db;
var G__131636 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","name","block/name",1619760316),from_page_name], null);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__131635,G__131636) : datascript.core.entity.call(null,G__131635,G__131636));
})();
var from_id = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(from_page);
if(cljs.core.truth_((function (){var and__5000__auto__ = from_page;
if(cljs.core.truth_(and__5000__auto__)){
var and__5000__auto____$1 = to_page;
if(cljs.core.truth_(and__5000__auto____$1)){
return cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(from_page_name,to_page_name);
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})())){
var datoms = datascript.core.datoms.cljs$core$IFn$_invoke$arity$4(cljs.core.deref(conn),new cljs.core.Keyword(null,"avet","avet",1383857032),new cljs.core.Keyword("block","page","block/page",822314108),from_id);
var block_eids = cljs.core.mapv.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"e","e",1381269198),datoms);
var blocks = (function (){var G__131637 = db;
var G__131638 = new cljs.core.PersistentVector(null, 6, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","id","db/id",-1388397098),new cljs.core.Keyword("block","page","block/page",822314108),new cljs.core.Keyword("block","refs","block/refs",-1214495349),new cljs.core.Keyword("block","path-refs","block/path-refs",-2109181352),new cljs.core.Keyword("block","order","block/order",-1429282437),new cljs.core.Keyword("block","parent","block/parent",-918309064)], null);
var G__131639 = block_eids;
return (datascript.core.pull_many.cljs$core$IFn$_invoke$arity$3 ? datascript.core.pull_many.cljs$core$IFn$_invoke$arity$3(G__131637,G__131638,G__131639) : datascript.core.pull_many.call(null,G__131637,G__131638,G__131639));
})();
var blocks_tx_data = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (block){
var id = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block);
var G__131649 = new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword("db","id","db/id",-1388397098),id,new cljs.core.Keyword("block","page","block/page",822314108),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("db","id","db/id",-1388397098),to_id], null),new cljs.core.Keyword("block","refs","block/refs",-1214495349),frontend.worker.handler.page.file_based.rename.rename_update_block_refs_BANG_(new cljs.core.Keyword("block","refs","block/refs",-1214495349).cljs$core$IFn$_invoke$arity$1(block),from_id,to_id),new cljs.core.Keyword("block","order","block/order",-1429282437),logseq.db.common.order.gen_key.cljs$core$IFn$_invoke$arity$1(null)], null);
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","parent","block/parent",-918309064).cljs$core$IFn$_invoke$arity$1(block),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("db","id","db/id",-1388397098),from_id], null))){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__131649,new cljs.core.Keyword("block","parent","block/parent",-918309064),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("db","id","db/id",-1388397098),to_id], null));
} else {
return G__131649;
}
}),blocks);
var replace_ref_tx_data = frontend.worker.handler.page.file_based.rename.replace_page_ref(db,config,from_page,to_page_name);
var tx_data = cljs.core.concat.cljs$core$IFn$_invoke$arity$2(blocks_tx_data,replace_ref_tx_data);
(frontend.worker.handler.page.file_based.rename.rename_page_aux.cljs$core$IFn$_invoke$arity$9 ? frontend.worker.handler.page.file_based.rename.rename_page_aux.cljs$core$IFn$_invoke$arity$9(repo,conn,config,old_name,new_name,new cljs.core.Keyword(null,"merge?","merge?",-2004416151),true,new cljs.core.Keyword(null,"other-tx","other-tx",337309802),tx_data) : frontend.worker.handler.page.file_based.rename.rename_page_aux.call(null,repo,conn,config,old_name,new_name,new cljs.core.Keyword(null,"merge?","merge?",-2004416151),true,new cljs.core.Keyword(null,"other-tx","other-tx",337309802),tx_data));

return frontend.worker.handler.page.delete_BANG_.cljs$core$IFn$_invoke$arity$variadic(repo,conn,new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(from_page),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"rename?","rename?",-1728043099),true], null)], 0));
} else {
return null;
}
});
/**
 * Construct the full path given old full path and the file sanitized body.
 * Ext. included in the `old-path`.
 */
frontend.worker.handler.page.file_based.rename.compute_new_file_path = (function frontend$worker$handler$page$file_based$rename$compute_new_file_path(old_path,new_file_name_body){
var result = clojure.string.split.cljs$core$IFn$_invoke$arity$2(old_path,"/");
var ext = cljs.core.last(clojure.string.split.cljs$core$IFn$_invoke$arity$2(cljs.core.last(result),"."));
var new_file = [cljs.core.str.cljs$core$IFn$_invoke$arity$1(new_file_name_body),".",cljs.core.str.cljs$core$IFn$_invoke$arity$1(ext)].join('');
var parts = cljs.core.concat.cljs$core$IFn$_invoke$arity$2(cljs.core.butlast(result),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new_file], null));
return logseq.common.util.string_join_path(parts);
});
frontend.worker.handler.page.file_based.rename.update_file_tx = (function frontend$worker$handler$page$file_based$rename$update_file_tx(db,old_page_name,new_page_name){
var page = (function (){var G__131665 = db;
var G__131666 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","name","block/name",1619760316),old_page_name], null);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__131665,G__131666) : datascript.core.entity.call(null,G__131665,G__131666));
})();
var file = new cljs.core.Keyword("block","file","block/file",183171933).cljs$core$IFn$_invoke$arity$1(page);
if(cljs.core.truth_((function (){var and__5000__auto__ = file;
if(cljs.core.truth_(and__5000__auto__)){
return (!(logseq.db.file_based.entity_util.journal_QMARK_(page)));
} else {
return and__5000__auto__;
}
})())){
var old_path = new cljs.core.Keyword("file","path","file/path",-191335748).cljs$core$IFn$_invoke$arity$1(file);
var new_file_name = frontend.common.file.util.file_name_sanity(new_page_name);
var new_path = frontend.worker.handler.page.file_based.rename.compute_new_file_path(old_path,new_file_name);
return new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"old-path","old-path",-2069757806),old_path,new cljs.core.Keyword(null,"new-path","new-path",1732999939),new_path,new cljs.core.Keyword(null,"tx-data","tx-data",934159761),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("db","id","db/id",-1388397098),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(file),new cljs.core.Keyword("file","path","file/path",-191335748),new_path], null)], null)], null);
} else {
return null;
}
});
/**
 * Only accepts unsanitized page names
 */
frontend.worker.handler.page.file_based.rename.rename_page_aux = (function frontend$worker$handler$page$file_based$rename$rename_page_aux(var_args){
var args__5732__auto__ = [];
var len__5726__auto___132038 = arguments.length;
var i__5727__auto___132039 = (0);
while(true){
if((i__5727__auto___132039 < len__5726__auto___132038)){
args__5732__auto__.push((arguments[i__5727__auto___132039]));

var G__132041 = (i__5727__auto___132039 + (1));
i__5727__auto___132039 = G__132041;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((5) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((5)),(0),null)):null);
return frontend.worker.handler.page.file_based.rename.rename_page_aux.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),(arguments[(1)]),(arguments[(2)]),(arguments[(3)]),(arguments[(4)]),argseq__5733__auto__);
});

(frontend.worker.handler.page.file_based.rename.rename_page_aux.cljs$core$IFn$_invoke$arity$variadic = (function (repo,conn,config,old_name,new_name,p__131689){
var map__131690 = p__131689;
var map__131690__$1 = cljs.core.__destructure_map(map__131690);
var merge_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__131690__$1,new cljs.core.Keyword(null,"merge?","merge?",-2004416151));
var other_tx = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__131690__$1,new cljs.core.Keyword(null,"other-tx","other-tx",337309802));
var db = cljs.core.deref(conn);
var old_page_name = logseq.common.util.page_name_sanity_lc(old_name);
var new_page_name = logseq.common.util.page_name_sanity_lc(new_name);
var page = (function (){var G__131695 = cljs.core.deref(conn);
var G__131696 = new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"*","*",345799209,null)], null);
var G__131697 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","name","block/name",1619760316),old_page_name], null);
return (datascript.core.pull.cljs$core$IFn$_invoke$arity$3 ? datascript.core.pull.cljs$core$IFn$_invoke$arity$3(G__131695,G__131696,G__131697) : datascript.core.pull.call(null,G__131695,G__131696,G__131697));
})();
if(cljs.core.truth_((function (){var and__5000__auto__ = repo;
if(cljs.core.truth_(and__5000__auto__)){
return page;
} else {
return and__5000__auto__;
}
})())){
var old_title = new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(page);
var page_txs = (cljs.core.truth_(merge_QMARK_)?null:new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword("db","id","db/id",-1388397098),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(page),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(page),new cljs.core.Keyword("block","name","block/name",1619760316),new_page_name,new cljs.core.Keyword("block","title","block/title",710445684),new_name], null)], null));
var map__131702 = frontend.worker.handler.page.file_based.rename.update_file_tx(db,old_page_name,new_name);
var map__131702__$1 = cljs.core.__destructure_map(map__131702);
var old_path = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__131702__$1,new cljs.core.Keyword(null,"old-path","old-path",-2069757806));
var new_path = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__131702__$1,new cljs.core.Keyword(null,"new-path","new-path",1732999939));
var tx_data = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__131702__$1,new cljs.core.Keyword(null,"tx-data","tx-data",934159761));
var txs = cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic(page_txs,other_tx,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.remove.cljs$core$IFn$_invoke$arity$2(cljs.core.nil_QMARK_,cljs.core.concat.cljs$core$IFn$_invoke$arity$2(frontend.worker.handler.page.file_based.rename.replace_page_ref(db,config,page,new_name),tx_data))], 0));
logseq.db.transact_BANG_.cljs$core$IFn$_invoke$arity$3(conn,txs,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"rename-page","rename-page",-2094129371),new cljs.core.Keyword(null,"data","data",-232669377),(function (){var G__131707 = new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"page-id","page-id",-872941168),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(page),new cljs.core.Keyword(null,"old-name","old-name",1289683869),old_name,new cljs.core.Keyword(null,"new-name","new-name",1288355058),new_name], null);
if(cljs.core.truth_((function (){var and__5000__auto__ = old_path;
if(cljs.core.truth_(and__5000__auto__)){
return new_path;
} else {
return and__5000__auto__;
}
})())){
return cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([G__131707,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"old-path","old-path",-2069757806),old_path,new cljs.core.Keyword(null,"new-path","new-path",1732999939),new_path], null)], 0));
} else {
return G__131707;
}
})()], null));

return frontend.worker.handler.page.file_based.rename.rename_update_namespace_BANG_(repo,conn,config,page,old_title,new_name);
} else {
return null;
}
}));

(frontend.worker.handler.page.file_based.rename.rename_page_aux.cljs$lang$maxFixedArity = (5));

/** @this {Function} */
(frontend.worker.handler.page.file_based.rename.rename_page_aux.cljs$lang$applyTo = (function (seq131677){
var G__131678 = cljs.core.first(seq131677);
var seq131677__$1 = cljs.core.next(seq131677);
var G__131679 = cljs.core.first(seq131677__$1);
var seq131677__$2 = cljs.core.next(seq131677__$1);
var G__131680 = cljs.core.first(seq131677__$2);
var seq131677__$3 = cljs.core.next(seq131677__$2);
var G__131681 = cljs.core.first(seq131677__$3);
var seq131677__$4 = cljs.core.next(seq131677__$3);
var G__131682 = cljs.core.first(seq131677__$4);
var seq131677__$5 = cljs.core.next(seq131677__$4);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__131678,G__131679,G__131680,G__131681,G__131682,seq131677__$5);
}));

/**
 * Original names (unsanitized only)
 */
frontend.worker.handler.page.file_based.rename.rename_namespace_pages_BANG_ = (function frontend$worker$handler$page$file_based$rename$rename_namespace_pages_BANG_(repo,conn,config,old_name,new_name){
var pages = frontend.common.file_based.db.get_namespace_pages(cljs.core.deref(conn),old_name);
var page = (function (){var G__131729 = cljs.core.deref(conn);
var G__131730 = new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"*","*",345799209,null)], null);
var G__131731 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","name","block/name",1619760316),logseq.common.util.page_name_sanity_lc(old_name)], null);
return (datascript.core.pull.cljs$core$IFn$_invoke$arity$3 ? datascript.core.pull.cljs$core$IFn$_invoke$arity$3(G__131729,G__131730,G__131731) : datascript.core.pull.call(null,G__131729,G__131730,G__131731));
})();
var pages__$1 = cljs.core.cons(page,pages);
var seq__131735 = cljs.core.seq(pages__$1);
var chunk__131737 = null;
var count__131738 = (0);
var i__131739 = (0);
while(true){
if((i__131739 < count__131738)){
var map__131777 = chunk__131737.cljs$core$IIndexed$_nth$arity$2(null,i__131739);
var map__131777__$1 = cljs.core.__destructure_map(map__131777);
var name = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__131777__$1,new cljs.core.Keyword("block","name","block/name",1619760316));
var title = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__131777__$1,new cljs.core.Keyword("block","title","block/title",710445684));
var old_page_title_132070 = (function (){var or__5002__auto__ = title;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return name;
}
})();
var new_page_title_132071 = logseq.common.util.replace_first_ignore_case(old_page_title_132070,old_name,new_name);
if(cljs.core.truth_((function (){var and__5000__auto__ = old_page_title_132070;
if(cljs.core.truth_(and__5000__auto__)){
return new_page_title_132071;
} else {
return and__5000__auto__;
}
})())){
frontend.worker.handler.page.file_based.rename.rename_page_aux(repo,conn,config,old_page_title_132070,new_page_title_132071);

cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["Renamed ",old_page_title_132070," to ",new_page_title_132071], 0));
} else {
}


var G__132072 = seq__131735;
var G__132073 = chunk__131737;
var G__132074 = count__131738;
var G__132075 = (i__131739 + (1));
seq__131735 = G__132072;
chunk__131737 = G__132073;
count__131738 = G__132074;
i__131739 = G__132075;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__131735);
if(temp__5804__auto__){
var seq__131735__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__131735__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__131735__$1);
var G__132076 = cljs.core.chunk_rest(seq__131735__$1);
var G__132077 = c__5525__auto__;
var G__132078 = cljs.core.count(c__5525__auto__);
var G__132079 = (0);
seq__131735 = G__132076;
chunk__131737 = G__132077;
count__131738 = G__132078;
i__131739 = G__132079;
continue;
} else {
var map__131791 = cljs.core.first(seq__131735__$1);
var map__131791__$1 = cljs.core.__destructure_map(map__131791);
var name = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__131791__$1,new cljs.core.Keyword("block","name","block/name",1619760316));
var title = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__131791__$1,new cljs.core.Keyword("block","title","block/title",710445684));
var old_page_title_132081 = (function (){var or__5002__auto__ = title;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return name;
}
})();
var new_page_title_132082 = logseq.common.util.replace_first_ignore_case(old_page_title_132081,old_name,new_name);
if(cljs.core.truth_((function (){var and__5000__auto__ = old_page_title_132081;
if(cljs.core.truth_(and__5000__auto__)){
return new_page_title_132082;
} else {
return and__5000__auto__;
}
})())){
frontend.worker.handler.page.file_based.rename.rename_page_aux(repo,conn,config,old_page_title_132081,new_page_title_132082);

cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["Renamed ",old_page_title_132081," to ",new_page_title_132082], 0));
} else {
}


var G__132087 = cljs.core.next(seq__131735__$1);
var G__132088 = null;
var G__132089 = (0);
var G__132090 = (0);
seq__131735 = G__132087;
chunk__131737 = G__132088;
count__131738 = G__132089;
i__131739 = G__132090;
continue;
}
} else {
return null;
}
}
break;
}
});
/**
 * Unsanitized names only
 */
frontend.worker.handler.page.file_based.rename.rename_nested_pages = (function frontend$worker$handler$page$file_based$rename$rename_nested_pages(repo,conn,config,old_ns_name,new_ns_name){
var nested_page_str = logseq.common.util.page_ref.__GT_page_ref(logseq.common.util.page_name_sanity_lc(old_ns_name));
var ns_prefix_format_str = [logseq.common.util.page_ref.left_brackets,"%s/"].join('');
var ns_prefix = logseq.common.util.format.cljs$core$IFn$_invoke$arity$variadic(ns_prefix_format_str,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([logseq.common.util.page_name_sanity_lc(old_ns_name)], 0));
var nested_pages = frontend.common.file_based.db.get_pages_by_name_partition(cljs.core.deref(conn),nested_page_str);
var nested_pages_ns = frontend.common.file_based.db.get_pages_by_name_partition(cljs.core.deref(conn),ns_prefix);
if(cljs.core.truth_(nested_pages)){
var seq__131815_132095 = cljs.core.seq(nested_pages);
var chunk__131816_132096 = null;
var count__131817_132097 = (0);
var i__131818_132098 = (0);
while(true){
if((i__131818_132098 < count__131817_132097)){
var map__131846_132101 = chunk__131816_132096.cljs$core$IIndexed$_nth$arity$2(null,i__131818_132098);
var map__131846_132102__$1 = cljs.core.__destructure_map(map__131846_132101);
var name_132103 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__131846_132102__$1,new cljs.core.Keyword("block","name","block/name",1619760316));
var title_132104 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__131846_132102__$1,new cljs.core.Keyword("block","title","block/title",710445684));
var old_page_title_132109 = (function (){var or__5002__auto__ = title_132104;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return name_132103;
}
})();
var new_page_title_132110 = clojure.string.replace(old_page_title_132109,logseq.common.util.page_ref.__GT_page_ref(old_ns_name),logseq.common.util.page_ref.__GT_page_ref(new_ns_name));
if(cljs.core.truth_((function (){var and__5000__auto__ = old_page_title_132109;
if(cljs.core.truth_(and__5000__auto__)){
return new_page_title_132110;
} else {
return and__5000__auto__;
}
})())){
frontend.worker.handler.page.file_based.rename.rename_page_aux(repo,conn,config,old_page_title_132109,new_page_title_132110);

cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["Renamed ",old_page_title_132109," to ",new_page_title_132110], 0));
} else {
}


var G__132112 = seq__131815_132095;
var G__132113 = chunk__131816_132096;
var G__132114 = count__131817_132097;
var G__132115 = (i__131818_132098 + (1));
seq__131815_132095 = G__132112;
chunk__131816_132096 = G__132113;
count__131817_132097 = G__132114;
i__131818_132098 = G__132115;
continue;
} else {
var temp__5804__auto___132116 = cljs.core.seq(seq__131815_132095);
if(temp__5804__auto___132116){
var seq__131815_132117__$1 = temp__5804__auto___132116;
if(cljs.core.chunked_seq_QMARK_(seq__131815_132117__$1)){
var c__5525__auto___132118 = cljs.core.chunk_first(seq__131815_132117__$1);
var G__132120 = cljs.core.chunk_rest(seq__131815_132117__$1);
var G__132121 = c__5525__auto___132118;
var G__132122 = cljs.core.count(c__5525__auto___132118);
var G__132123 = (0);
seq__131815_132095 = G__132120;
chunk__131816_132096 = G__132121;
count__131817_132097 = G__132122;
i__131818_132098 = G__132123;
continue;
} else {
var map__131853_132128 = cljs.core.first(seq__131815_132117__$1);
var map__131853_132129__$1 = cljs.core.__destructure_map(map__131853_132128);
var name_132130 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__131853_132129__$1,new cljs.core.Keyword("block","name","block/name",1619760316));
var title_132131 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__131853_132129__$1,new cljs.core.Keyword("block","title","block/title",710445684));
var old_page_title_132135 = (function (){var or__5002__auto__ = title_132131;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return name_132130;
}
})();
var new_page_title_132136 = clojure.string.replace(old_page_title_132135,logseq.common.util.page_ref.__GT_page_ref(old_ns_name),logseq.common.util.page_ref.__GT_page_ref(new_ns_name));
if(cljs.core.truth_((function (){var and__5000__auto__ = old_page_title_132135;
if(cljs.core.truth_(and__5000__auto__)){
return new_page_title_132136;
} else {
return and__5000__auto__;
}
})())){
frontend.worker.handler.page.file_based.rename.rename_page_aux(repo,conn,config,old_page_title_132135,new_page_title_132136);

cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["Renamed ",old_page_title_132135," to ",new_page_title_132136], 0));
} else {
}


var G__132138 = cljs.core.next(seq__131815_132117__$1);
var G__132139 = null;
var G__132140 = (0);
var G__132141 = (0);
seq__131815_132095 = G__132138;
chunk__131816_132096 = G__132139;
count__131817_132097 = G__132140;
i__131818_132098 = G__132141;
continue;
}
} else {
}
}
break;
}
} else {
}

if(cljs.core.truth_(nested_pages_ns)){
var seq__131858 = cljs.core.seq(nested_pages_ns);
var chunk__131859 = null;
var count__131860 = (0);
var i__131861 = (0);
while(true){
if((i__131861 < count__131860)){
var map__131888 = chunk__131859.cljs$core$IIndexed$_nth$arity$2(null,i__131861);
var map__131888__$1 = cljs.core.__destructure_map(map__131888);
var name = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__131888__$1,new cljs.core.Keyword("block","name","block/name",1619760316));
var title = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__131888__$1,new cljs.core.Keyword("block","title","block/title",710445684));
var old_page_title_132144 = (function (){var or__5002__auto__ = title;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return name;
}
})();
var new_page_title_132145 = clojure.string.replace(old_page_title_132144,logseq.common.util.format.cljs$core$IFn$_invoke$arity$variadic(ns_prefix_format_str,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([old_ns_name], 0)),logseq.common.util.format.cljs$core$IFn$_invoke$arity$variadic(ns_prefix_format_str,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new_ns_name], 0)));
if(cljs.core.truth_((function (){var and__5000__auto__ = old_page_title_132144;
if(cljs.core.truth_(and__5000__auto__)){
return new_page_title_132145;
} else {
return and__5000__auto__;
}
})())){
frontend.worker.handler.page.file_based.rename.rename_page_aux(repo,conn,config,old_page_title_132144,new_page_title_132145);

cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["Renamed ",old_page_title_132144," to ",new_page_title_132145], 0));
} else {
}


var G__132149 = seq__131858;
var G__132150 = chunk__131859;
var G__132151 = count__131860;
var G__132152 = (i__131861 + (1));
seq__131858 = G__132149;
chunk__131859 = G__132150;
count__131860 = G__132151;
i__131861 = G__132152;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__131858);
if(temp__5804__auto__){
var seq__131858__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__131858__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__131858__$1);
var G__132156 = cljs.core.chunk_rest(seq__131858__$1);
var G__132157 = c__5525__auto__;
var G__132158 = cljs.core.count(c__5525__auto__);
var G__132159 = (0);
seq__131858 = G__132156;
chunk__131859 = G__132157;
count__131860 = G__132158;
i__131861 = G__132159;
continue;
} else {
var map__131901 = cljs.core.first(seq__131858__$1);
var map__131901__$1 = cljs.core.__destructure_map(map__131901);
var name = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__131901__$1,new cljs.core.Keyword("block","name","block/name",1619760316));
var title = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__131901__$1,new cljs.core.Keyword("block","title","block/title",710445684));
var old_page_title_132163 = (function (){var or__5002__auto__ = title;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return name;
}
})();
var new_page_title_132164 = clojure.string.replace(old_page_title_132163,logseq.common.util.format.cljs$core$IFn$_invoke$arity$variadic(ns_prefix_format_str,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([old_ns_name], 0)),logseq.common.util.format.cljs$core$IFn$_invoke$arity$variadic(ns_prefix_format_str,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new_ns_name], 0)));
if(cljs.core.truth_((function (){var and__5000__auto__ = old_page_title_132163;
if(cljs.core.truth_(and__5000__auto__)){
return new_page_title_132164;
} else {
return and__5000__auto__;
}
})())){
frontend.worker.handler.page.file_based.rename.rename_page_aux(repo,conn,config,old_page_title_132163,new_page_title_132164);

cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["Renamed ",old_page_title_132163," to ",new_page_title_132164], 0));
} else {
}


var G__132167 = cljs.core.next(seq__131858__$1);
var G__132168 = null;
var G__132169 = (0);
var G__132170 = (0);
seq__131858 = G__132167;
chunk__131859 = G__132168;
count__131860 = G__132169;
i__131861 = G__132170;
continue;
}
} else {
return null;
}
}
break;
}
} else {
return null;
}
});
frontend.worker.handler.page.file_based.rename.rename_BANG_ = (function frontend$worker$handler$page$file_based$rename$rename_BANG_(var_args){
var args__5732__auto__ = [];
var len__5726__auto___132171 = arguments.length;
var i__5727__auto___132172 = (0);
while(true){
if((i__5727__auto___132172 < len__5726__auto___132171)){
args__5732__auto__.push((arguments[i__5727__auto___132172]));

var G__132173 = (i__5727__auto___132172 + (1));
i__5727__auto___132172 = G__132173;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((5) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((5)),(0),null)):null);
return frontend.worker.handler.page.file_based.rename.rename_BANG_.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),(arguments[(1)]),(arguments[(2)]),(arguments[(3)]),(arguments[(4)]),argseq__5733__auto__);
});

(frontend.worker.handler.page.file_based.rename.rename_BANG_.cljs$core$IFn$_invoke$arity$variadic = (function (repo,conn,config,page_uuid,new_name,p__131928){
var map__131929 = p__131928;
var map__131929__$1 = cljs.core.__destructure_map(map__131929);
var persist_op_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__131929__$1,new cljs.core.Keyword(null,"persist-op?","persist-op?",-531287534),true);
var db = cljs.core.deref(conn);
var page_e = (function (){var G__131932 = db;
var G__131933 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),page_uuid], null);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__131932,G__131933) : datascript.core.entity.call(null,G__131932,G__131933));
})();
var old_name = new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(page_e);
var new_name__$1 = clojure.string.trim(new_name);
var old_page_name = logseq.common.util.page_name_sanity_lc(old_name);
var new_page_name = logseq.common.util.page_name_sanity_lc(new_name__$1);
var new_page_e = (function (){var G__131939 = db;
var G__131940 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","name","block/name",1619760316),new_page_name], null);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__131939,G__131940) : datascript.core.entity.call(null,G__131939,G__131940));
})();
var name_changed_QMARK_ = cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(old_name,new_name__$1);
if(cljs.core.truth_((logseq.db.built_in_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.built_in_QMARK_.cljs$core$IFn$_invoke$arity$1(page_e) : logseq.db.built_in_QMARK_.call(null,page_e)))){
return new cljs.core.Keyword(null,"built-in-page","built-in-page",-1672974267);
} else {
if(clojure.string.blank_QMARK_(new_name__$1)){
return new cljs.core.Keyword(null,"invalid-empty-name","invalid-empty-name",-1837009122);
} else {
if(cljs.core.truth_((function (){var and__5000__auto__ = page_e;
if(cljs.core.truth_(and__5000__auto__)){
var and__5000__auto____$1 = new_page_e;
if(cljs.core.truth_(and__5000__auto____$1)){
return ((logseq.db.file_based.entity_util.whiteboard_QMARK_(page_e)) || (logseq.db.file_based.entity_util.whiteboard_QMARK_(new_page_e)));
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})())){
return new cljs.core.Keyword(null,"merge-whiteboard-pages","merge-whiteboard-pages",287177049);
} else {
if(cljs.core.truth_((function (){var and__5000__auto__ = old_name;
if(cljs.core.truth_(and__5000__auto__)){
var and__5000__auto____$1 = new_name__$1;
if(cljs.core.truth_(and__5000__auto____$1)){
return name_changed_QMARK_;
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})())){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(old_page_name,new_page_name)){
logseq.db.transact_BANG_.cljs$core$IFn$_invoke$arity$3(conn,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("db","id","db/id",-1388397098),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(page_e),new cljs.core.Keyword("block","title","block/title",710445684),new_name__$1], null)], null),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"page-id","page-id",-872941168),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(page_e),new cljs.core.Keyword(null,"persist-op?","persist-op?",-531287534),persist_op_QMARK_,new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"rename-page","rename-page",-2094129371)], null));
} else {
if(cljs.core.truth_((function (){var and__5000__auto__ = cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(old_page_name,new_page_name);
if(and__5000__auto__){
var G__131956 = cljs.core.deref(conn);
var G__131957 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","name","block/name",1619760316),new_page_name], null);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__131956,G__131957) : datascript.core.entity.call(null,G__131956,G__131957));
} else {
return and__5000__auto__;
}
})())){
frontend.worker.handler.page.file_based.rename.based_merge_pages_BANG_(repo,conn,config,old_page_name,new_page_name,new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"old-name","old-name",1289683869),old_name,new cljs.core.Keyword(null,"new-name","new-name",1288355058),new_name__$1,new cljs.core.Keyword(null,"persist-op?","persist-op?",-531287534),persist_op_QMARK_], null));
} else {
frontend.worker.handler.page.file_based.rename.rename_namespace_pages_BANG_(repo,conn,config,old_name,new_name__$1);

}
}

return frontend.worker.handler.page.file_based.rename.rename_nested_pages(repo,conn,config,old_name,new_name__$1);
} else {
return null;
}
}
}
}
}));

(frontend.worker.handler.page.file_based.rename.rename_BANG_.cljs$lang$maxFixedArity = (5));

/** @this {Function} */
(frontend.worker.handler.page.file_based.rename.rename_BANG_.cljs$lang$applyTo = (function (seq131916){
var G__131917 = cljs.core.first(seq131916);
var seq131916__$1 = cljs.core.next(seq131916);
var G__131918 = cljs.core.first(seq131916__$1);
var seq131916__$2 = cljs.core.next(seq131916__$1);
var G__131919 = cljs.core.first(seq131916__$2);
var seq131916__$3 = cljs.core.next(seq131916__$2);
var G__131920 = cljs.core.first(seq131916__$3);
var seq131916__$4 = cljs.core.next(seq131916__$3);
var G__131921 = cljs.core.first(seq131916__$4);
var seq131916__$5 = cljs.core.next(seq131916__$4);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__131917,G__131918,G__131919,G__131920,G__131921,seq131916__$5);
}));


//# sourceMappingURL=frontend.worker.handler.page.file_based.rename.js.map
