goog.provide('frontend.worker.handler.page.file_based.rename');
/**
 * Unsanitized names
 */
frontend.worker.handler.page.file_based.rename.replace_page_ref_aux = (function frontend$worker$handler$page$file_based$rename$replace_page_ref_aux(config,content,old_name,new_name){
var preferred_format = logseq.common.config.get_preferred_format(config);
var vec__186846 = cljs.core.map.cljs$core$IFn$_invoke$arity$2(clojure.string.trim,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [old_name,new_name], null));
var original_old_name = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__186846,(0),null);
var original_new_name = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__186846,(1),null);
var vec__186849 = cljs.core.map.cljs$core$IFn$_invoke$arity$2(logseq.common.util.page_ref.__GT_page_ref,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [old_name,new_name], null));
var old_ref = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__186849,(0),null);
var new_ref = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__186849,(1),null);
var vec__186852 = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__186845_SHARP_){
if(clojure.string.includes_QMARK_(p1__186845_SHARP_,"/")){
return clojure.string.replace(p1__186845_SHARP_,"/",".");
} else {
return p1__186845_SHARP_;
}
}),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [original_old_name,original_new_name], null));
var old_name__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__186852,(0),null);
var new_name__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__186852,(1),null);
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
return clojure.string.replace((cljs.core.truth_(old_org_ref)?(function (){var vec__186855 = old_org_ref;
var old_full_ref = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__186855,(0),null);
var old_label = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__186855,(1),null);
var new_label = ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(old_label,original_old_name))?original_new_name:old_label);
var new_full_ref = clojure.string.replace(clojure.string.replace(old_full_ref,old_name__$1,new_name__$1),["[",cljs.core.str.cljs$core$IFn$_invoke$arity$1(old_label),"]"].join(''),["[",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new_label),"]"].join(''));
return clojure.string.replace(content,old_full_ref,new_full_ref);
})():content),old_ref,new_ref);
});
frontend.worker.handler.page.file_based.rename.replace_tag_ref_BANG_ = (function frontend$worker$handler$page$file_based$rename$replace_tag_ref_BANG_(content,old_name,new_name){
var old_tag = logseq.common.util.format.cljs$core$IFn$_invoke$arity$variadic("#%s",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([old_name], 0));
var new_tag = (cljs.core.truth_(cljs.core.re_find(/[\s\t]+/,new_name))?logseq.common.util.format.cljs$core$IFn$_invoke$arity$variadic("#[[%s]]",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new_name], 0)):["#",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new_name)].join(''));
return clojure.string.replace(content,cljs.core.re_pattern(["(?i)(^|\\s)(",cljs.core.str.cljs$core$IFn$_invoke$arity$1(logseq.common.util.escape_regex_chars(old_tag)),")(?=[,\\.]*($|\\s))"].join('')),(function (p__186858){
var vec__186859 = p__186858;
var _match = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__186859,(0),null);
var lhs = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__186859,(1),null);
var _grp2 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__186859,(2),null);
var _grp3 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__186859,(3),null);
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
var blocks = new cljs.core.Keyword("block","_refs","block/_refs",830218531).cljs$core$IFn$_invoke$arity$1((function (){var G__186862 = db;
var G__186863 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(page);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__186862,G__186863) : datascript.core.entity.call(null,G__186862,G__186863));
})());
var tx = cljs.core.remove.cljs$core$IFn$_invoke$arity$2(cljs.core.nil_QMARK_,cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p__186864){
var map__186865 = p__186864;
var map__186865__$1 = cljs.core.__destructure_map(map__186865);
var block = map__186865__$1;
var uuid = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__186865__$1,new cljs.core.Keyword("block","uuid","block/uuid",-1991494552));
var title = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__186865__$1,new cljs.core.Keyword("block","title","block/title",710445684));
var properties = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__186865__$1,new cljs.core.Keyword("block","properties","block/properties",708347145));
var format = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__186865__$1,new cljs.core.Keyword("block","format","block/format",-1212045901));
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

var namespace_block = (function (){var G__186866 = cljs.core.deref(conn);
var G__186867 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","name","block/name",1619760316),logseq.common.util.page_name_sanity_lc(namespace)], null);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__186866,G__186867) : datascript.core.entity.call(null,G__186866,G__186867));
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
frontend.worker.handler.page.file_based.rename.based_merge_pages_BANG_ = (function frontend$worker$handler$page$file_based$rename$based_merge_pages_BANG_(repo,conn,config,from_page_name,to_page_name,p__186868){
var map__186869 = p__186868;
var map__186869__$1 = cljs.core.__destructure_map(map__186869);
var old_name = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__186869__$1,new cljs.core.Keyword(null,"old-name","old-name",1289683869));
var new_name = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__186869__$1,new cljs.core.Keyword(null,"new-name","new-name",1288355058));
var db = cljs.core.deref(conn);
var to_page = (function (){var G__186870 = db;
var G__186871 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","name","block/name",1619760316),to_page_name], null);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__186870,G__186871) : datascript.core.entity.call(null,G__186870,G__186871));
})();
var to_id = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(to_page);
var from_page = (function (){var G__186872 = db;
var G__186873 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","name","block/name",1619760316),from_page_name], null);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__186872,G__186873) : datascript.core.entity.call(null,G__186872,G__186873));
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
var blocks = (function (){var G__186874 = db;
var G__186875 = new cljs.core.PersistentVector(null, 6, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","id","db/id",-1388397098),new cljs.core.Keyword("block","page","block/page",822314108),new cljs.core.Keyword("block","refs","block/refs",-1214495349),new cljs.core.Keyword("block","path-refs","block/path-refs",-2109181352),new cljs.core.Keyword("block","order","block/order",-1429282437),new cljs.core.Keyword("block","parent","block/parent",-918309064)], null);
var G__186876 = block_eids;
return (datascript.core.pull_many.cljs$core$IFn$_invoke$arity$3 ? datascript.core.pull_many.cljs$core$IFn$_invoke$arity$3(G__186874,G__186875,G__186876) : datascript.core.pull_many.call(null,G__186874,G__186875,G__186876));
})();
var blocks_tx_data = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (block){
var id = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block);
var G__186877 = new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword("db","id","db/id",-1388397098),id,new cljs.core.Keyword("block","page","block/page",822314108),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("db","id","db/id",-1388397098),to_id], null),new cljs.core.Keyword("block","refs","block/refs",-1214495349),frontend.worker.handler.page.file_based.rename.rename_update_block_refs_BANG_(new cljs.core.Keyword("block","refs","block/refs",-1214495349).cljs$core$IFn$_invoke$arity$1(block),from_id,to_id),new cljs.core.Keyword("block","order","block/order",-1429282437),logseq.db.common.order.gen_key.cljs$core$IFn$_invoke$arity$1(null)], null);
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","parent","block/parent",-918309064).cljs$core$IFn$_invoke$arity$1(block),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("db","id","db/id",-1388397098),from_id], null))){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__186877,new cljs.core.Keyword("block","parent","block/parent",-918309064),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("db","id","db/id",-1388397098),to_id], null));
} else {
return G__186877;
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
var page = (function (){var G__186878 = db;
var G__186879 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","name","block/name",1619760316),old_page_name], null);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__186878,G__186879) : datascript.core.entity.call(null,G__186878,G__186879));
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
var len__5726__auto___186934 = arguments.length;
var i__5727__auto___186935 = (0);
while(true){
if((i__5727__auto___186935 < len__5726__auto___186934)){
args__5732__auto__.push((arguments[i__5727__auto___186935]));

var G__186936 = (i__5727__auto___186935 + (1));
i__5727__auto___186935 = G__186936;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((5) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((5)),(0),null)):null);
return frontend.worker.handler.page.file_based.rename.rename_page_aux.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),(arguments[(1)]),(arguments[(2)]),(arguments[(3)]),(arguments[(4)]),argseq__5733__auto__);
});

(frontend.worker.handler.page.file_based.rename.rename_page_aux.cljs$core$IFn$_invoke$arity$variadic = (function (repo,conn,config,old_name,new_name,p__186886){
var map__186887 = p__186886;
var map__186887__$1 = cljs.core.__destructure_map(map__186887);
var merge_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__186887__$1,new cljs.core.Keyword(null,"merge?","merge?",-2004416151));
var other_tx = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__186887__$1,new cljs.core.Keyword(null,"other-tx","other-tx",337309802));
var db = cljs.core.deref(conn);
var old_page_name = logseq.common.util.page_name_sanity_lc(old_name);
var new_page_name = logseq.common.util.page_name_sanity_lc(new_name);
var page = (function (){var G__186888 = cljs.core.deref(conn);
var G__186889 = new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"*","*",345799209,null)], null);
var G__186890 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","name","block/name",1619760316),old_page_name], null);
return (datascript.core.pull.cljs$core$IFn$_invoke$arity$3 ? datascript.core.pull.cljs$core$IFn$_invoke$arity$3(G__186888,G__186889,G__186890) : datascript.core.pull.call(null,G__186888,G__186889,G__186890));
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
var map__186891 = frontend.worker.handler.page.file_based.rename.update_file_tx(db,old_page_name,new_name);
var map__186891__$1 = cljs.core.__destructure_map(map__186891);
var old_path = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__186891__$1,new cljs.core.Keyword(null,"old-path","old-path",-2069757806));
var new_path = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__186891__$1,new cljs.core.Keyword(null,"new-path","new-path",1732999939));
var tx_data = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__186891__$1,new cljs.core.Keyword(null,"tx-data","tx-data",934159761));
var txs = cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic(page_txs,other_tx,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.remove.cljs$core$IFn$_invoke$arity$2(cljs.core.nil_QMARK_,cljs.core.concat.cljs$core$IFn$_invoke$arity$2(frontend.worker.handler.page.file_based.rename.replace_page_ref(db,config,page,new_name),tx_data))], 0));
logseq.db.transact_BANG_.cljs$core$IFn$_invoke$arity$3(conn,txs,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"rename-page","rename-page",-2094129371),new cljs.core.Keyword(null,"data","data",-232669377),(function (){var G__186892 = new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"page-id","page-id",-872941168),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(page),new cljs.core.Keyword(null,"old-name","old-name",1289683869),old_name,new cljs.core.Keyword(null,"new-name","new-name",1288355058),new_name], null);
if(cljs.core.truth_((function (){var and__5000__auto__ = old_path;
if(cljs.core.truth_(and__5000__auto__)){
return new_path;
} else {
return and__5000__auto__;
}
})())){
return cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([G__186892,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"old-path","old-path",-2069757806),old_path,new cljs.core.Keyword(null,"new-path","new-path",1732999939),new_path], null)], 0));
} else {
return G__186892;
}
})()], null));

return frontend.worker.handler.page.file_based.rename.rename_update_namespace_BANG_(repo,conn,config,page,old_title,new_name);
} else {
return null;
}
}));

(frontend.worker.handler.page.file_based.rename.rename_page_aux.cljs$lang$maxFixedArity = (5));

/** @this {Function} */
(frontend.worker.handler.page.file_based.rename.rename_page_aux.cljs$lang$applyTo = (function (seq186880){
var G__186881 = cljs.core.first(seq186880);
var seq186880__$1 = cljs.core.next(seq186880);
var G__186882 = cljs.core.first(seq186880__$1);
var seq186880__$2 = cljs.core.next(seq186880__$1);
var G__186883 = cljs.core.first(seq186880__$2);
var seq186880__$3 = cljs.core.next(seq186880__$2);
var G__186884 = cljs.core.first(seq186880__$3);
var seq186880__$4 = cljs.core.next(seq186880__$3);
var G__186885 = cljs.core.first(seq186880__$4);
var seq186880__$5 = cljs.core.next(seq186880__$4);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__186881,G__186882,G__186883,G__186884,G__186885,seq186880__$5);
}));

/**
 * Original names (unsanitized only)
 */
frontend.worker.handler.page.file_based.rename.rename_namespace_pages_BANG_ = (function frontend$worker$handler$page$file_based$rename$rename_namespace_pages_BANG_(repo,conn,config,old_name,new_name){
var pages = frontend.common.file_based.db.get_namespace_pages(cljs.core.deref(conn),old_name);
var page = (function (){var G__186893 = cljs.core.deref(conn);
var G__186894 = new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"*","*",345799209,null)], null);
var G__186895 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","name","block/name",1619760316),logseq.common.util.page_name_sanity_lc(old_name)], null);
return (datascript.core.pull.cljs$core$IFn$_invoke$arity$3 ? datascript.core.pull.cljs$core$IFn$_invoke$arity$3(G__186893,G__186894,G__186895) : datascript.core.pull.call(null,G__186893,G__186894,G__186895));
})();
var pages__$1 = cljs.core.cons(page,pages);
var seq__186896 = cljs.core.seq(pages__$1);
var chunk__186897 = null;
var count__186898 = (0);
var i__186899 = (0);
while(true){
if((i__186899 < count__186898)){
var map__186902 = chunk__186897.cljs$core$IIndexed$_nth$arity$2(null,i__186899);
var map__186902__$1 = cljs.core.__destructure_map(map__186902);
var name = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__186902__$1,new cljs.core.Keyword("block","name","block/name",1619760316));
var title = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__186902__$1,new cljs.core.Keyword("block","title","block/title",710445684));
var old_page_title_186937 = (function (){var or__5002__auto__ = title;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return name;
}
})();
var new_page_title_186938 = logseq.common.util.replace_first_ignore_case(old_page_title_186937,old_name,new_name);
if(cljs.core.truth_((function (){var and__5000__auto__ = old_page_title_186937;
if(cljs.core.truth_(and__5000__auto__)){
return new_page_title_186938;
} else {
return and__5000__auto__;
}
})())){
frontend.worker.handler.page.file_based.rename.rename_page_aux(repo,conn,config,old_page_title_186937,new_page_title_186938);

cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["Renamed ",old_page_title_186937," to ",new_page_title_186938], 0));
} else {
}


var G__186939 = seq__186896;
var G__186940 = chunk__186897;
var G__186941 = count__186898;
var G__186942 = (i__186899 + (1));
seq__186896 = G__186939;
chunk__186897 = G__186940;
count__186898 = G__186941;
i__186899 = G__186942;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__186896);
if(temp__5804__auto__){
var seq__186896__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__186896__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__186896__$1);
var G__186943 = cljs.core.chunk_rest(seq__186896__$1);
var G__186944 = c__5525__auto__;
var G__186945 = cljs.core.count(c__5525__auto__);
var G__186946 = (0);
seq__186896 = G__186943;
chunk__186897 = G__186944;
count__186898 = G__186945;
i__186899 = G__186946;
continue;
} else {
var map__186903 = cljs.core.first(seq__186896__$1);
var map__186903__$1 = cljs.core.__destructure_map(map__186903);
var name = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__186903__$1,new cljs.core.Keyword("block","name","block/name",1619760316));
var title = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__186903__$1,new cljs.core.Keyword("block","title","block/title",710445684));
var old_page_title_186947 = (function (){var or__5002__auto__ = title;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return name;
}
})();
var new_page_title_186948 = logseq.common.util.replace_first_ignore_case(old_page_title_186947,old_name,new_name);
if(cljs.core.truth_((function (){var and__5000__auto__ = old_page_title_186947;
if(cljs.core.truth_(and__5000__auto__)){
return new_page_title_186948;
} else {
return and__5000__auto__;
}
})())){
frontend.worker.handler.page.file_based.rename.rename_page_aux(repo,conn,config,old_page_title_186947,new_page_title_186948);

cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["Renamed ",old_page_title_186947," to ",new_page_title_186948], 0));
} else {
}


var G__186949 = cljs.core.next(seq__186896__$1);
var G__186950 = null;
var G__186951 = (0);
var G__186952 = (0);
seq__186896 = G__186949;
chunk__186897 = G__186950;
count__186898 = G__186951;
i__186899 = G__186952;
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
var seq__186904_186953 = cljs.core.seq(nested_pages);
var chunk__186905_186954 = null;
var count__186906_186955 = (0);
var i__186907_186956 = (0);
while(true){
if((i__186907_186956 < count__186906_186955)){
var map__186910_186957 = chunk__186905_186954.cljs$core$IIndexed$_nth$arity$2(null,i__186907_186956);
var map__186910_186958__$1 = cljs.core.__destructure_map(map__186910_186957);
var name_186959 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__186910_186958__$1,new cljs.core.Keyword("block","name","block/name",1619760316));
var title_186960 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__186910_186958__$1,new cljs.core.Keyword("block","title","block/title",710445684));
var old_page_title_186961 = (function (){var or__5002__auto__ = title_186960;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return name_186959;
}
})();
var new_page_title_186962 = clojure.string.replace(old_page_title_186961,logseq.common.util.page_ref.__GT_page_ref(old_ns_name),logseq.common.util.page_ref.__GT_page_ref(new_ns_name));
if(cljs.core.truth_((function (){var and__5000__auto__ = old_page_title_186961;
if(cljs.core.truth_(and__5000__auto__)){
return new_page_title_186962;
} else {
return and__5000__auto__;
}
})())){
frontend.worker.handler.page.file_based.rename.rename_page_aux(repo,conn,config,old_page_title_186961,new_page_title_186962);

cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["Renamed ",old_page_title_186961," to ",new_page_title_186962], 0));
} else {
}


var G__186963 = seq__186904_186953;
var G__186964 = chunk__186905_186954;
var G__186965 = count__186906_186955;
var G__186966 = (i__186907_186956 + (1));
seq__186904_186953 = G__186963;
chunk__186905_186954 = G__186964;
count__186906_186955 = G__186965;
i__186907_186956 = G__186966;
continue;
} else {
var temp__5804__auto___186967 = cljs.core.seq(seq__186904_186953);
if(temp__5804__auto___186967){
var seq__186904_186968__$1 = temp__5804__auto___186967;
if(cljs.core.chunked_seq_QMARK_(seq__186904_186968__$1)){
var c__5525__auto___186969 = cljs.core.chunk_first(seq__186904_186968__$1);
var G__186970 = cljs.core.chunk_rest(seq__186904_186968__$1);
var G__186971 = c__5525__auto___186969;
var G__186972 = cljs.core.count(c__5525__auto___186969);
var G__186973 = (0);
seq__186904_186953 = G__186970;
chunk__186905_186954 = G__186971;
count__186906_186955 = G__186972;
i__186907_186956 = G__186973;
continue;
} else {
var map__186911_186974 = cljs.core.first(seq__186904_186968__$1);
var map__186911_186975__$1 = cljs.core.__destructure_map(map__186911_186974);
var name_186976 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__186911_186975__$1,new cljs.core.Keyword("block","name","block/name",1619760316));
var title_186977 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__186911_186975__$1,new cljs.core.Keyword("block","title","block/title",710445684));
var old_page_title_186978 = (function (){var or__5002__auto__ = title_186977;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return name_186976;
}
})();
var new_page_title_186979 = clojure.string.replace(old_page_title_186978,logseq.common.util.page_ref.__GT_page_ref(old_ns_name),logseq.common.util.page_ref.__GT_page_ref(new_ns_name));
if(cljs.core.truth_((function (){var and__5000__auto__ = old_page_title_186978;
if(cljs.core.truth_(and__5000__auto__)){
return new_page_title_186979;
} else {
return and__5000__auto__;
}
})())){
frontend.worker.handler.page.file_based.rename.rename_page_aux(repo,conn,config,old_page_title_186978,new_page_title_186979);

cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["Renamed ",old_page_title_186978," to ",new_page_title_186979], 0));
} else {
}


var G__186980 = cljs.core.next(seq__186904_186968__$1);
var G__186981 = null;
var G__186982 = (0);
var G__186983 = (0);
seq__186904_186953 = G__186980;
chunk__186905_186954 = G__186981;
count__186906_186955 = G__186982;
i__186907_186956 = G__186983;
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
var seq__186912 = cljs.core.seq(nested_pages_ns);
var chunk__186913 = null;
var count__186914 = (0);
var i__186915 = (0);
while(true){
if((i__186915 < count__186914)){
var map__186918 = chunk__186913.cljs$core$IIndexed$_nth$arity$2(null,i__186915);
var map__186918__$1 = cljs.core.__destructure_map(map__186918);
var name = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__186918__$1,new cljs.core.Keyword("block","name","block/name",1619760316));
var title = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__186918__$1,new cljs.core.Keyword("block","title","block/title",710445684));
var old_page_title_186984 = (function (){var or__5002__auto__ = title;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return name;
}
})();
var new_page_title_186985 = clojure.string.replace(old_page_title_186984,logseq.common.util.format.cljs$core$IFn$_invoke$arity$variadic(ns_prefix_format_str,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([old_ns_name], 0)),logseq.common.util.format.cljs$core$IFn$_invoke$arity$variadic(ns_prefix_format_str,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new_ns_name], 0)));
if(cljs.core.truth_((function (){var and__5000__auto__ = old_page_title_186984;
if(cljs.core.truth_(and__5000__auto__)){
return new_page_title_186985;
} else {
return and__5000__auto__;
}
})())){
frontend.worker.handler.page.file_based.rename.rename_page_aux(repo,conn,config,old_page_title_186984,new_page_title_186985);

cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["Renamed ",old_page_title_186984," to ",new_page_title_186985], 0));
} else {
}


var G__186986 = seq__186912;
var G__186987 = chunk__186913;
var G__186988 = count__186914;
var G__186989 = (i__186915 + (1));
seq__186912 = G__186986;
chunk__186913 = G__186987;
count__186914 = G__186988;
i__186915 = G__186989;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__186912);
if(temp__5804__auto__){
var seq__186912__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__186912__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__186912__$1);
var G__186990 = cljs.core.chunk_rest(seq__186912__$1);
var G__186991 = c__5525__auto__;
var G__186992 = cljs.core.count(c__5525__auto__);
var G__186993 = (0);
seq__186912 = G__186990;
chunk__186913 = G__186991;
count__186914 = G__186992;
i__186915 = G__186993;
continue;
} else {
var map__186919 = cljs.core.first(seq__186912__$1);
var map__186919__$1 = cljs.core.__destructure_map(map__186919);
var name = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__186919__$1,new cljs.core.Keyword("block","name","block/name",1619760316));
var title = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__186919__$1,new cljs.core.Keyword("block","title","block/title",710445684));
var old_page_title_186994 = (function (){var or__5002__auto__ = title;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return name;
}
})();
var new_page_title_186995 = clojure.string.replace(old_page_title_186994,logseq.common.util.format.cljs$core$IFn$_invoke$arity$variadic(ns_prefix_format_str,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([old_ns_name], 0)),logseq.common.util.format.cljs$core$IFn$_invoke$arity$variadic(ns_prefix_format_str,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new_ns_name], 0)));
if(cljs.core.truth_((function (){var and__5000__auto__ = old_page_title_186994;
if(cljs.core.truth_(and__5000__auto__)){
return new_page_title_186995;
} else {
return and__5000__auto__;
}
})())){
frontend.worker.handler.page.file_based.rename.rename_page_aux(repo,conn,config,old_page_title_186994,new_page_title_186995);

cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["Renamed ",old_page_title_186994," to ",new_page_title_186995], 0));
} else {
}


var G__186996 = cljs.core.next(seq__186912__$1);
var G__186997 = null;
var G__186998 = (0);
var G__186999 = (0);
seq__186912 = G__186996;
chunk__186913 = G__186997;
count__186914 = G__186998;
i__186915 = G__186999;
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
var len__5726__auto___187000 = arguments.length;
var i__5727__auto___187001 = (0);
while(true){
if((i__5727__auto___187001 < len__5726__auto___187000)){
args__5732__auto__.push((arguments[i__5727__auto___187001]));

var G__187002 = (i__5727__auto___187001 + (1));
i__5727__auto___187001 = G__187002;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((5) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((5)),(0),null)):null);
return frontend.worker.handler.page.file_based.rename.rename_BANG_.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),(arguments[(1)]),(arguments[(2)]),(arguments[(3)]),(arguments[(4)]),argseq__5733__auto__);
});

(frontend.worker.handler.page.file_based.rename.rename_BANG_.cljs$core$IFn$_invoke$arity$variadic = (function (repo,conn,config,page_uuid,new_name,p__186926){
var map__186927 = p__186926;
var map__186927__$1 = cljs.core.__destructure_map(map__186927);
var persist_op_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__186927__$1,new cljs.core.Keyword(null,"persist-op?","persist-op?",-531287534),true);
var db = cljs.core.deref(conn);
var page_e = (function (){var G__186928 = db;
var G__186929 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),page_uuid], null);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__186928,G__186929) : datascript.core.entity.call(null,G__186928,G__186929));
})();
var old_name = new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(page_e);
var new_name__$1 = clojure.string.trim(new_name);
var old_page_name = logseq.common.util.page_name_sanity_lc(old_name);
var new_page_name = logseq.common.util.page_name_sanity_lc(new_name__$1);
var new_page_e = (function (){var G__186930 = db;
var G__186931 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","name","block/name",1619760316),new_page_name], null);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__186930,G__186931) : datascript.core.entity.call(null,G__186930,G__186931));
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
var G__186932 = cljs.core.deref(conn);
var G__186933 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","name","block/name",1619760316),new_page_name], null);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__186932,G__186933) : datascript.core.entity.call(null,G__186932,G__186933));
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
(frontend.worker.handler.page.file_based.rename.rename_BANG_.cljs$lang$applyTo = (function (seq186920){
var G__186921 = cljs.core.first(seq186920);
var seq186920__$1 = cljs.core.next(seq186920);
var G__186922 = cljs.core.first(seq186920__$1);
var seq186920__$2 = cljs.core.next(seq186920__$1);
var G__186923 = cljs.core.first(seq186920__$2);
var seq186920__$3 = cljs.core.next(seq186920__$2);
var G__186924 = cljs.core.first(seq186920__$3);
var seq186920__$4 = cljs.core.next(seq186920__$3);
var G__186925 = cljs.core.first(seq186920__$4);
var seq186920__$5 = cljs.core.next(seq186920__$4);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__186921,G__186922,G__186923,G__186924,G__186925,seq186920__$5);
}));


//# sourceMappingURL=frontend.worker.handler.page.file_based.rename.js.map
