goog.provide('frontend.db.model');
frontend.db.model.hidden_page_QMARK_ = logseq.db.hidden_QMARK_;
/**
 * return the source page of an alias
 */
frontend.db.model.get_alias_source_page = (function frontend$db$model$get_alias_source_page(repo,alias_id){
var temp__5804__auto__ = frontend.db.conn.get_db.cljs$core$IFn$_invoke$arity$1(repo);
if(cljs.core.truth_(temp__5804__auto__)){
var db = temp__5804__auto__;
return logseq.db.get_alias_source_page(db,alias_id);
} else {
return null;
}
});
frontend.db.model.file_exists_QMARK_ = (function frontend$db$model$file_exists_QMARK_(repo,path){
if(cljs.core.truth_((function (){var and__5000__auto__ = repo;
if(cljs.core.truth_(and__5000__auto__)){
return path;
} else {
return and__5000__auto__;
}
})())){
var temp__5804__auto__ = frontend.db.conn.get_db.cljs$core$IFn$_invoke$arity$1(repo);
if(cljs.core.truth_(temp__5804__auto__)){
var db = temp__5804__auto__;
return frontend.db.utils.entity.cljs$core$IFn$_invoke$arity$2(db,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("file","path","file/path",-191335748),path], null));
} else {
return null;
}
} else {
return null;
}
});
frontend.db.model.get_files_full = (function frontend$db$model$get_files_full(repo){
var temp__5804__auto__ = frontend.db.conn.get_db.cljs$core$IFn$_invoke$arity$1(repo);
if(cljs.core.truth_(temp__5804__auto__)){
var db = temp__5804__auto__;
return cljs.core.flatten((function (){var G__60645 = new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"find","find",496279456),cljs.core.list(new cljs.core.Symbol(null,"pull","pull",779986722,null),new cljs.core.Symbol(null,"?file","?file",-1121006094,null),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"*","*",345799209,null)], null)),new cljs.core.Keyword(null,"where","where",-2044795965),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?file","?file",-1121006094,null),new cljs.core.Keyword("file","path","file/path",-191335748)], null)], null);
var G__60646 = db;
return (datascript.core.q.cljs$core$IFn$_invoke$arity$2 ? datascript.core.q.cljs$core$IFn$_invoke$arity$2(G__60645,G__60646) : datascript.core.q.call(null,G__60645,G__60646));
})());
} else {
return null;
}
});
frontend.db.model.get_file = (function frontend$db$model$get_file(var_args){
var G__60648 = arguments.length;
switch (G__60648) {
case 1:
return frontend.db.model.get_file.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return frontend.db.model.get_file.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.db.model.get_file.cljs$core$IFn$_invoke$arity$1 = (function (path){
return frontend.db.model.get_file.cljs$core$IFn$_invoke$arity$2(frontend.state.get_current_repo(),path);
}));

(frontend.db.model.get_file.cljs$core$IFn$_invoke$arity$2 = (function (repo,path){
if(cljs.core.truth_((function (){var and__5000__auto__ = repo;
if(cljs.core.truth_(and__5000__auto__)){
return path;
} else {
return and__5000__auto__;
}
})())){
var temp__5804__auto__ = frontend.db.conn.get_db.cljs$core$IFn$_invoke$arity$1(repo);
if(cljs.core.truth_(temp__5804__auto__)){
var db = temp__5804__auto__;
return new cljs.core.Keyword("file","content","file/content",12680964).cljs$core$IFn$_invoke$arity$1(frontend.db.utils.entity.cljs$core$IFn$_invoke$arity$2(db,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("file","path","file/path",-191335748),path], null)));
} else {
return null;
}
} else {
return null;
}
}));

(frontend.db.model.get_file.cljs$lang$maxFixedArity = 2);

frontend.db.model.get_custom_css = (function frontend$db$model$get_custom_css(){
var temp__5804__auto__ = frontend.state.get_current_repo();
if(cljs.core.truth_(temp__5804__auto__)){
var repo = temp__5804__auto__;
return frontend.db.model.get_file.cljs$core$IFn$_invoke$arity$2(repo,"logseq/custom.css");
} else {
return null;
}
});
frontend.db.model.get_block_by_uuid = (function frontend$db$model$get_block_by_uuid(id){
return frontend.db.utils.entity.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),((cljs.core.uuid_QMARK_(id))?id:cljs.core.uuid(id))], null));
});
/**
 * Return block or page entity, depends on the uuid
 */
frontend.db.model.query_block_by_uuid = (function frontend$db$model$query_block_by_uuid(id){
return frontend.db.utils.pull.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),((cljs.core.uuid_QMARK_(id))?id:cljs.core.uuid(id))], null));
});
/**
 * Converts a heading block's content to its route name. This works
 * independent of format as format specific heading characters are stripped
 */
frontend.db.model.heading_content__GT_route_name = (function frontend$db$model$heading_content__GT_route_name(block_content){
var G__60649 = block_content;
var G__60649__$1 = (((G__60649 == null))?null:cljs.core.re_find(/^#{0,}\s*(.*)(?:\n|$)/,G__60649));
var G__60649__$2 = (((G__60649__$1 == null))?null:cljs.core.second(G__60649__$1));
if((G__60649__$2 == null)){
return null;
} else {
return clojure.string.lower_case(G__60649__$2);
}
});
/**
 * Returns first block for given page name and block's route name. Block's route
 *   name must match the content of a page's block header
 */
frontend.db.model.get_block_by_page_name_and_block_route_name = (function frontend$db$model$get_block_by_page_name_and_block_route_name(repo,page_uuid_str,route_name){
var db = frontend.db.conn.get_db.cljs$core$IFn$_invoke$arity$1(repo);
if(frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(repo)){
return cljs.core.ffirst((function (){var G__60650 = new cljs.core.PersistentVector(null, 14, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"find","find",496279456),cljs.core.list(new cljs.core.Symbol(null,"pull","pull",779986722,null),new cljs.core.Symbol(null,"?b","?b",1575118075,null),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552)], null)),new cljs.core.Keyword(null,"in","in",-1531184865),new cljs.core.Symbol(null,"$","$",-1580747756,null),new cljs.core.Symbol(null,"?page-uuid","?page-uuid",-1672168823,null),new cljs.core.Symbol(null,"?route-name","?route-name",1645323543,null),new cljs.core.Symbol(null,"?content-matches","?content-matches",-1315422313,null),new cljs.core.Symbol(null,"%","%",-950237169,null),new cljs.core.Keyword(null,"where","where",-2044795965),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?page","?page",-1343187612,null),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Symbol(null,"?page-uuid","?page-uuid",-1672168823,null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?b","?b",1575118075,null),new cljs.core.Keyword("block","page","block/page",822314108),new cljs.core.Symbol(null,"?page","?page",-1343187612,null)], null),cljs.core.list(new cljs.core.Symbol(null,"has-property","has-property",-130314949,null),new cljs.core.Symbol(null,"?b","?b",1575118075,null),new cljs.core.Keyword("logseq.property","heading","logseq.property/heading",1858749415)),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?b","?b",1575118075,null),new cljs.core.Keyword("block","title","block/title",710445684),new cljs.core.Symbol(null,"?content","?content",-956653715,null)], null),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.list(new cljs.core.Symbol(null,"?content-matches","?content-matches",-1315422313,null),new cljs.core.Symbol(null,"?content","?content",-956653715,null),new cljs.core.Symbol(null,"?route-name","?route-name",1645323543,null),new cljs.core.Symbol(null,"?b","?b",1575118075,null))], null)], null);
var G__60651 = db;
var G__60652 = cljs.core.uuid(page_uuid_str);
var G__60653 = route_name;
var G__60654 = (function frontend$db$model$get_block_by_page_name_and_block_route_name_$_content_matches_QMARK_(block_content,external_content,block_id){
var block = frontend.db.utils.entity.cljs$core$IFn$_invoke$arity$2(repo,block_id);
var ref_tags = cljs.core.distinct.cljs$core$IFn$_invoke$arity$1(cljs.core.concat.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","tags","block/tags",1814948340).cljs$core$IFn$_invoke$arity$1(block),new cljs.core.Keyword("block","refs","block/refs",-1214495349).cljs$core$IFn$_invoke$arity$1(block)));
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(frontend.db.model.heading_content__GT_route_name(logseq.db.frontend.content.content_id_ref__GT_page(logseq.db.frontend.content.id_ref__GT_title_ref(block_content,ref_tags),ref_tags)),clojure.string.lower_case(external_content));
});
var G__60655 = logseq.db.frontend.rules.extract_rules(logseq.db.frontend.rules.db_query_dsl_rules,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"has-property","has-property",-1770846476)], null));
return (datascript.core.q.cljs$core$IFn$_invoke$arity$6 ? datascript.core.q.cljs$core$IFn$_invoke$arity$6(G__60650,G__60651,G__60652,G__60653,G__60654,G__60655) : datascript.core.q.call(null,G__60650,G__60651,G__60652,G__60653,G__60654,G__60655));
})());
} else {
return cljs.core.ffirst((function (){var G__60656 = new cljs.core.PersistentVector(null, 14, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"find","find",496279456),cljs.core.list(new cljs.core.Symbol(null,"pull","pull",779986722,null),new cljs.core.Symbol(null,"?b","?b",1575118075,null),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552)], null)),new cljs.core.Keyword(null,"in","in",-1531184865),new cljs.core.Symbol(null,"$","$",-1580747756,null),new cljs.core.Symbol(null,"?page-uuid","?page-uuid",-1672168823,null),new cljs.core.Symbol(null,"?route-name","?route-name",1645323543,null),new cljs.core.Symbol(null,"?content-matches","?content-matches",-1315422313,null),new cljs.core.Keyword(null,"where","where",-2044795965),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?page","?page",-1343187612,null),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Symbol(null,"?page-uuid","?page-uuid",-1672168823,null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?b","?b",1575118075,null),new cljs.core.Keyword("block","page","block/page",822314108),new cljs.core.Symbol(null,"?page","?page",-1343187612,null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?b","?b",1575118075,null),new cljs.core.Keyword("block","properties","block/properties",708347145),new cljs.core.Symbol(null,"?prop","?prop",1880869414,null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.list(new cljs.core.Symbol(null,"get","get",-971253014,null),new cljs.core.Symbol(null,"?prop","?prop",1880869414,null),new cljs.core.Keyword(null,"heading","heading",-1312171873)),new cljs.core.Symbol(null,"_","_",-1201019570,null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?b","?b",1575118075,null),new cljs.core.Keyword("block","title","block/title",710445684),new cljs.core.Symbol(null,"?content","?content",-956653715,null)], null),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.list(new cljs.core.Symbol(null,"?content-matches","?content-matches",-1315422313,null),new cljs.core.Symbol(null,"?content","?content",-956653715,null),new cljs.core.Symbol(null,"?route-name","?route-name",1645323543,null))], null)], null);
var G__60657 = db;
var G__60658 = cljs.core.uuid(page_uuid_str);
var G__60659 = route_name;
var G__60660 = (function frontend$db$model$get_block_by_page_name_and_block_route_name_$_content_matches_QMARK_(block_content,external_content){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(frontend.db.model.heading_content__GT_route_name(block_content),clojure.string.lower_case(external_content));
});
return (datascript.core.q.cljs$core$IFn$_invoke$arity$5 ? datascript.core.q.cljs$core$IFn$_invoke$arity$5(G__60656,G__60657,G__60658,G__60659,G__60660) : datascript.core.q.call(null,G__60656,G__60657,G__60658,G__60659,G__60660));
})());
}
});
frontend.db.model.get_page_format = (function frontend$db$model$get_page_format(page_name){
var _PERCENT_ = ((frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(frontend.state.get_current_repo()))?new cljs.core.Keyword(null,"markdown","markdown",1227225089):cljs.core.keyword.cljs$core$IFn$_invoke$arity$1((function (){var or__5002__auto__ = (function (){var page = (function (){var G__60661 = page_name;
if((G__60661 == null)){
return null;
} else {
return logseq.db.get_page(frontend.db.conn.get_db.cljs$core$IFn$_invoke$arity$0(),G__60661);
}
})();
var or__5002__auto__ = cljs.core.get.cljs$core$IFn$_invoke$arity$3(page,new cljs.core.Keyword("block","format","block/format",-1212045901),new cljs.core.Keyword(null,"markdown","markdown",1227225089));
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var temp__5804__auto__ = new cljs.core.Keyword("block","file","block/file",183171933).cljs$core$IFn$_invoke$arity$1(page);
if(cljs.core.truth_(temp__5804__auto__)){
var file = temp__5804__auto__;
var temp__5804__auto____$1 = new cljs.core.Keyword("file","path","file/path",-191335748).cljs$core$IFn$_invoke$arity$1(frontend.db.utils.entity.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(file)));
if(cljs.core.truth_(temp__5804__auto____$1)){
var path = temp__5804__auto____$1;
return logseq.common.util.get_format(path);
} else {
return null;
}
} else {
return null;
}
}
})();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = frontend.state.get_preferred_format.cljs$core$IFn$_invoke$arity$0();
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
return new cljs.core.Keyword(null,"markdown","markdown",1227225089);
}
}
})()));
if((_PERCENT_ instanceof cljs.core.Keyword)){
} else {
throw (new Error("Assert failed: (keyword? %)"));
}

return _PERCENT_;
});
frontend.db.model.page_alias_set = (function frontend$db$model$page_alias_set(repo_url,page_id){
return logseq.db.page_alias_set(frontend.db.conn.get_db.cljs$core$IFn$_invoke$arity$1(repo_url),page_id);
});
frontend.db.model.get_page_alias_names = (function frontend$db$model$get_page_alias_names(repo,page_id){
var alias_ids = cljs.core.remove.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentHashSet.createAsIfByAssoc([page_id]),frontend.db.model.page_alias_set(repo,page_id));
if(cljs.core.seq(alias_ids)){
return cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (id){
return new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(frontend.db.utils.entity.cljs$core$IFn$_invoke$arity$1(id));
}),alias_ids);
} else {
return null;
}
});
frontend.db.model.with_pages = (function frontend$db$model$with_pages(blocks){
var pages_ids = cljs.core.remove.cljs$core$IFn$_invoke$arity$2(cljs.core.nil_QMARK_,cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.comp.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","id","db/id",-1388397098),new cljs.core.Keyword("block","page","block/page",822314108)),blocks));
var pages = ((cljs.core.seq(pages_ids))?frontend.db.utils.pull_many.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","id","db/id",-1388397098),new cljs.core.Keyword("block","name","block/name",1619760316),new cljs.core.Keyword("block","title","block/title",710445684),new cljs.core.Keyword("block","journal-day","block/journal-day",-145748366)], null),pages_ids):null);
var pages_map = cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (acc,p){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(acc,new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(p),p);
}),cljs.core.PersistentArrayMap.EMPTY,pages);
var blocks__$1 = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (block){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(block,new cljs.core.Keyword("block","page","block/page",822314108),cljs.core.get.cljs$core$IFn$_invoke$arity$2(pages_map,new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","page","block/page",822314108).cljs$core$IFn$_invoke$arity$1(block))));
}),blocks);
return blocks__$1;
});
frontend.db.model.sort_by_order = logseq.db.sort_by_order;
/**
 * Used together with rum/reactive db-mixins/query
 */
frontend.db.model.sub_block = (function frontend$db$model$sub_block(var_args){
var args__5732__auto__ = [];
var len__5726__auto___60757 = arguments.length;
var i__5727__auto___60758 = (0);
while(true){
if((i__5727__auto___60758 < len__5726__auto___60757)){
args__5732__auto__.push((arguments[i__5727__auto___60758]));

var G__60759 = (i__5727__auto___60758 + (1));
i__5727__auto___60758 = G__60759;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return frontend.db.model.sub_block.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(frontend.db.model.sub_block.cljs$core$IFn$_invoke$arity$variadic = (function (id,p__60664){
var map__60665 = p__60664;
var map__60665__$1 = cljs.core.__destructure_map(map__60665);
var ref_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__60665__$1,new cljs.core.Keyword(null,"ref?","ref?",1932693720),false);
var temp__5804__auto__ = frontend.state.get_current_repo();
if(cljs.core.truth_(temp__5804__auto__)){
var repo = temp__5804__auto__;
if(cljs.core.truth_(id)){
var ref = frontend.db.react.q(repo,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("frontend.worker.react","block","frontend.worker.react/block",2007555355),id], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"query-fn","query-fn",-646736760),(function (_){
return frontend.db.utils.entity.cljs$core$IFn$_invoke$arity$1(id);
})], null),null);
if(cljs.core.truth_(ref_QMARK_)){
return ref;
} else {
var e = frontend.util.react(ref);
var temp__5804__auto____$1 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(e);
if(cljs.core.truth_(temp__5804__auto____$1)){
var id__$1 = temp__5804__auto____$1;
return frontend.db.utils.entity.cljs$core$IFn$_invoke$arity$1(id__$1);
} else {
return null;
}
}
} else {
return null;
}
} else {
return null;
}
}));

(frontend.db.model.sub_block.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(frontend.db.model.sub_block.cljs$lang$applyTo = (function (seq60662){
var G__60663 = cljs.core.first(seq60662);
var seq60662__$1 = cljs.core.next(seq60662);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__60663,seq60662__$1);
}));

frontend.db.model.sort_by_order_recursive = (function frontend$db$model$sort_by_order_recursive(form){
return clojure.walk.postwalk((function (f){
if(cljs.core.truth_((function (){var and__5000__auto__ = cljs.core.map_QMARK_(f);
if(and__5000__auto__){
return new cljs.core.Keyword("block","_parent","block/_parent",-639389670).cljs$core$IFn$_invoke$arity$1(f);
} else {
return and__5000__auto__;
}
})())){
var children = new cljs.core.Keyword("block","_parent","block/_parent",-639389670).cljs$core$IFn$_invoke$arity$1(f);
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(f,new cljs.core.Keyword("block","_parent","block/_parent",-639389670)),new cljs.core.Keyword("block","children","block/children",-1040716209),(frontend.db.model.sort_by_order.cljs$core$IFn$_invoke$arity$1 ? frontend.db.model.sort_by_order.cljs$core$IFn$_invoke$arity$1(children) : frontend.db.model.sort_by_order.call(null,children)));
} else {
return f;
}
}),form);
});
frontend.db.model.has_children_QMARK_ = (function frontend$db$model$has_children_QMARK_(var_args){
var G__60667 = arguments.length;
switch (G__60667) {
case 1:
return frontend.db.model.has_children_QMARK_.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return frontend.db.model.has_children_QMARK_.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.db.model.has_children_QMARK_.cljs$core$IFn$_invoke$arity$1 = (function (block_id){
return frontend.db.model.has_children_QMARK_.cljs$core$IFn$_invoke$arity$2(frontend.db.conn.get_db.cljs$core$IFn$_invoke$arity$0(),block_id);
}));

(frontend.db.model.has_children_QMARK_.cljs$core$IFn$_invoke$arity$2 = (function (db,block_id){
return logseq.db.has_children_QMARK_(db,block_id);
}));

(frontend.db.model.has_children_QMARK_.cljs$lang$maxFixedArity = 2);

frontend.db.model.top_block_QMARK_ = (function frontend$db$model$top_block_QMARK_(block){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","parent","block/parent",-918309064).cljs$core$IFn$_invoke$arity$1(block)),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","page","block/page",822314108).cljs$core$IFn$_invoke$arity$1(block)));
});
frontend.db.model.get_block_parent = (function frontend$db$model$get_block_parent(var_args){
var G__60669 = arguments.length;
switch (G__60669) {
case 1:
return frontend.db.model.get_block_parent.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return frontend.db.model.get_block_parent.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.db.model.get_block_parent.cljs$core$IFn$_invoke$arity$1 = (function (block_id){
return frontend.db.model.get_block_parent.cljs$core$IFn$_invoke$arity$2(frontend.state.get_current_repo(),block_id);
}));

(frontend.db.model.get_block_parent.cljs$core$IFn$_invoke$arity$2 = (function (repo,block_id){
var temp__5804__auto__ = frontend.db.conn.get_db.cljs$core$IFn$_invoke$arity$1(repo);
if(cljs.core.truth_(temp__5804__auto__)){
var db = temp__5804__auto__;
var temp__5804__auto____$1 = frontend.db.utils.entity.cljs$core$IFn$_invoke$arity$2(db,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_id], null));
if(cljs.core.truth_(temp__5804__auto____$1)){
var block = temp__5804__auto____$1;
return new cljs.core.Keyword("block","parent","block/parent",-918309064).cljs$core$IFn$_invoke$arity$1(block);
} else {
return null;
}
} else {
return null;
}
}));

(frontend.db.model.get_block_parent.cljs$lang$maxFixedArity = 2);

frontend.db.model.get_block_parents = (function frontend$db$model$get_block_parents(repo,block_id,opts){
var temp__5804__auto__ = frontend.db.conn.get_db.cljs$core$IFn$_invoke$arity$1(repo);
if(cljs.core.truth_(temp__5804__auto__)){
var db = temp__5804__auto__;
return logseq.db.get_block_parents.cljs$core$IFn$_invoke$arity$variadic(db,block_id,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([opts], 0));
} else {
return null;
}
});
frontend.db.model.get_block_parents_v2 = (function frontend$db$model$get_block_parents_v2(repo,block_id){
var G__60670 = frontend.db.conn.get_db.cljs$core$IFn$_invoke$arity$1(repo);
var G__60671 = new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","id","db/id",-1388397098),new cljs.core.Keyword("block","collapsed?","block/collapsed?",2140210991),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("block","parent","block/parent",-918309064),new cljs.core.Symbol(null,"...","...",-1926939749,null)], null)], null);
var G__60672 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_id], null);
return (datascript.core.pull.cljs$core$IFn$_invoke$arity$3 ? datascript.core.pull.cljs$core$IFn$_invoke$arity$3(G__60670,G__60671,G__60672) : datascript.core.pull.call(null,G__60670,G__60671,G__60672));
});
frontend.db.model.get_block_last_direct_child_id = logseq.db.get_block_last_direct_child_id;
frontend.db.model.get_block_deep_last_open_child_id = (function frontend$db$model$get_block_deep_last_open_child_id(db,db_id){
if(cljs.core.truth_(db)){
var node = frontend.db.utils.entity.cljs$core$IFn$_invoke$arity$2(db,db_id);
while(true){
var temp__5802__auto__ = (function (){var G__60676 = db;
var G__60677 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(node);
var G__60678 = true;
return (frontend.db.model.get_block_last_direct_child_id.cljs$core$IFn$_invoke$arity$3 ? frontend.db.model.get_block_last_direct_child_id.cljs$core$IFn$_invoke$arity$3(G__60676,G__60677,G__60678) : frontend.db.model.get_block_last_direct_child_id.call(null,G__60676,G__60677,G__60678));
})();
if(cljs.core.truth_(temp__5802__auto__)){
var last_child_id = temp__5802__auto__;
var e = frontend.db.utils.entity.cljs$core$IFn$_invoke$arity$2(db,last_child_id);
if(cljs.core.truth_((function (){var or__5002__auto__ = new cljs.core.Keyword("block","collapsed?","block/collapsed?",2140210991).cljs$core$IFn$_invoke$arity$1(e);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.empty_QMARK_(new cljs.core.Keyword("block","_parent","block/_parent",-639389670).cljs$core$IFn$_invoke$arity$1(e));
}
})())){
return last_child_id;
} else {
var G__60762 = e;
node = G__60762;
continue;
}
} else {
return null;
}
break;
}
} else {
return null;
}
});
frontend.db.model.page_QMARK_ = logseq.db.page_QMARK_;
/**
 * Get next block, either its right sibling, or loop to find its next block.
 */
frontend.db.model.get_next = (function frontend$db$model$get_next(var_args){
var args__5732__auto__ = [];
var len__5726__auto___60763 = arguments.length;
var i__5727__auto___60764 = (0);
while(true){
if((i__5727__auto___60764 < len__5726__auto___60763)){
args__5732__auto__.push((arguments[i__5727__auto___60764]));

var G__60765 = (i__5727__auto___60764 + (1));
i__5727__auto___60764 = G__60765;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((2) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((2)),(0),null)):null);
return frontend.db.model.get_next.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),(arguments[(1)]),argseq__5733__auto__);
});

(frontend.db.model.get_next.cljs$core$IFn$_invoke$arity$variadic = (function (db,db_id,p__60682){
var map__60683 = p__60682;
var map__60683__$1 = cljs.core.__destructure_map(map__60683);
var opts = map__60683__$1;
var skip_collapsed_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__60683__$1,new cljs.core.Keyword(null,"skip-collapsed?","skip-collapsed?",1902712845),true);
var init_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__60683__$1,new cljs.core.Keyword(null,"init?","init?",438181499),true);
var temp__5804__auto__ = frontend.db.utils.entity.cljs$core$IFn$_invoke$arity$2(db,db_id);
if(cljs.core.truth_(temp__5804__auto__)){
var entity = temp__5804__auto__;
var or__5002__auto__ = (cljs.core.truth_((function (){var and__5000__auto__ = new cljs.core.Keyword("block","collapsed?","block/collapsed?",2140210991).cljs$core$IFn$_invoke$arity$1(entity);
if(cljs.core.truth_(and__5000__auto__)){
var and__5000__auto____$1 = skip_collapsed_QMARK_;
if(cljs.core.truth_(and__5000__auto____$1)){
return init_QMARK_;
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})())?null:logseq.db.get_right_sibling((datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db,db_id) : datascript.core.entity.call(null,db,db_id))));
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var parent_id = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","parent","block/parent",-918309064).cljs$core$IFn$_invoke$arity$1(frontend.db.utils.entity.cljs$core$IFn$_invoke$arity$2(db,db_id)));
return frontend.db.model.get_next.cljs$core$IFn$_invoke$arity$variadic(db,parent_id,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(opts,new cljs.core.Keyword(null,"init?","init?",438181499),false)], 0));
}
} else {
return null;
}
}));

(frontend.db.model.get_next.cljs$lang$maxFixedArity = (2));

/** @this {Function} */
(frontend.db.model.get_next.cljs$lang$applyTo = (function (seq60679){
var G__60680 = cljs.core.first(seq60679);
var seq60679__$1 = cljs.core.next(seq60679);
var G__60681 = cljs.core.first(seq60679__$1);
var seq60679__$2 = cljs.core.next(seq60679__$1);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__60680,G__60681,seq60679__$2);
}));

/**
 * Get prev block, either its left sibling if the sibling is collapsed or no children,
 *   or get sibling's last deep displayable child (collaspsed parent or non-collapsed child).
 */
frontend.db.model.get_prev = (function frontend$db$model$get_prev(db,db_id){
var temp__5804__auto__ = frontend.db.utils.entity.cljs$core$IFn$_invoke$arity$2(db,db_id);
if(cljs.core.truth_(temp__5804__auto__)){
var entity = temp__5804__auto__;
var or__5002__auto__ = (function (){var temp__5804__auto____$1 = logseq.db.get_left_sibling(entity);
if(cljs.core.truth_(temp__5804__auto____$1)){
var prev_sibling = temp__5804__auto____$1;
if(cljs.core.truth_((function (){var or__5002__auto__ = new cljs.core.Keyword("block","collapsed?","block/collapsed?",2140210991).cljs$core$IFn$_invoke$arity$1(prev_sibling);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.empty_QMARK_(new cljs.core.Keyword("block","_parent","block/_parent",-639389670).cljs$core$IFn$_invoke$arity$1(prev_sibling));
}
})())){
return prev_sibling;
} else {
var G__60684 = frontend.db.model.get_block_deep_last_open_child_id(db,new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(prev_sibling));
if((G__60684 == null)){
return null;
} else {
return frontend.db.utils.entity.cljs$core$IFn$_invoke$arity$2(db,G__60684);
}
}
} else {
return null;
}
})();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var parent = new cljs.core.Keyword("block","parent","block/parent",-918309064).cljs$core$IFn$_invoke$arity$1(entity);
if(cljs.core.truth_((frontend.db.model.page_QMARK_.cljs$core$IFn$_invoke$arity$1 ? frontend.db.model.page_QMARK_.cljs$core$IFn$_invoke$arity$1(parent) : frontend.db.model.page_QMARK_.call(null,parent)))){
return null;
} else {
return parent;
}
}
} else {
return null;
}
});
frontend.db.model.get_page_blocks_no_cache = (function frontend$db$model$get_page_blocks_no_cache(var_args){
var G__60686 = arguments.length;
switch (G__60686) {
case 1:
return frontend.db.model.get_page_blocks_no_cache.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return frontend.db.model.get_page_blocks_no_cache.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return frontend.db.model.get_page_blocks_no_cache.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.db.model.get_page_blocks_no_cache.cljs$core$IFn$_invoke$arity$1 = (function (page_id){
return frontend.db.model.get_page_blocks_no_cache.cljs$core$IFn$_invoke$arity$3(frontend.state.get_current_repo(),page_id,null);
}));

(frontend.db.model.get_page_blocks_no_cache.cljs$core$IFn$_invoke$arity$2 = (function (repo,page_id){
return frontend.db.model.get_page_blocks_no_cache.cljs$core$IFn$_invoke$arity$3(repo,page_id,null);
}));

(frontend.db.model.get_page_blocks_no_cache.cljs$core$IFn$_invoke$arity$3 = (function (repo,page_id,opts){
var temp__5804__auto__ = frontend.db.conn.get_db.cljs$core$IFn$_invoke$arity$1(repo);
if(cljs.core.truth_(temp__5804__auto__)){
var db = temp__5804__auto__;
return logseq.db.get_page_blocks.cljs$core$IFn$_invoke$arity$variadic(db,page_id,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([opts], 0));
} else {
return null;
}
}));

(frontend.db.model.get_page_blocks_no_cache.cljs$lang$maxFixedArity = 3);

frontend.db.model.get_page_blocks_count = (function frontend$db$model$get_page_blocks_count(repo,page_id){
var temp__5804__auto__ = frontend.db.conn.get_db.cljs$core$IFn$_invoke$arity$1(repo);
if(cljs.core.truth_(temp__5804__auto__)){
var db = temp__5804__auto__;
return logseq.db.get_page_blocks_count(db,page_id);
} else {
return null;
}
});
/**
 * Whether a page exists.
 */
frontend.db.model.page_exists_QMARK_ = (function frontend$db$model$page_exists_QMARK_(page_name,tags){
var repo = frontend.state.get_current_repo();
var temp__5804__auto__ = frontend.db.conn.get_db.cljs$core$IFn$_invoke$arity$1(repo);
if(cljs.core.truth_(temp__5804__auto__)){
var db = temp__5804__auto__;
return logseq.db.page_exists_QMARK_(db,page_name,tags);
} else {
return null;
}
});
/**
 * Whether a page is empty. Does it has a non-page block?
 *   `page-id` could be either a string or a db/id.
 */
frontend.db.model.page_empty_QMARK_ = (function frontend$db$model$page_empty_QMARK_(repo,page_id){
var temp__5804__auto__ = frontend.db.conn.get_db.cljs$core$IFn$_invoke$arity$1(repo);
if(cljs.core.truth_(temp__5804__auto__)){
var db = temp__5804__auto__;
return logseq.db.page_empty_QMARK_(db,page_id);
} else {
return null;
}
});
frontend.db.model.parents_collapsed_QMARK_ = (function frontend$db$model$parents_collapsed_QMARK_(repo,block_uuid){
var temp__5804__auto__ = new cljs.core.Keyword("block","parent","block/parent",-918309064).cljs$core$IFn$_invoke$arity$1(frontend.db.model.get_block_parents_v2(repo,block_uuid));
if(cljs.core.truth_(temp__5804__auto__)){
var block = temp__5804__auto__;
return cljs.core.some(frontend.util.collapsed_QMARK_,cljs.core.tree_seq(cljs.core.map_QMARK_,(function (x){
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","parent","block/parent",-918309064).cljs$core$IFn$_invoke$arity$1(x)], null);
}),block));
} else {
return null;
}
});
frontend.db.model.get_block_page = (function frontend$db$model$get_block_page(repo,block_uuid){
if(cljs.core.uuid_QMARK_(block_uuid)){
} else {
throw (new Error(["Assert failed: ",["get-block-page requires block-uuid to be of type uuid but got ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(block_uuid)].join(''),"\n","(uuid? block-uuid)"].join('')));
}

var temp__5804__auto__ = frontend.db.utils.entity.cljs$core$IFn$_invoke$arity$2(repo,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_uuid], null));
if(cljs.core.truth_(temp__5804__auto__)){
var block = temp__5804__auto__;
return frontend.db.utils.entity.cljs$core$IFn$_invoke$arity$2(repo,new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","page","block/page",822314108).cljs$core$IFn$_invoke$arity$1(block)));
} else {
return null;
}
});
/**
 * Doesn't include nested children.
 */
frontend.db.model.get_block_immediate_children = (function frontend$db$model$get_block_immediate_children(repo,block_uuid){
var temp__5804__auto__ = frontend.db.conn.get_db.cljs$core$IFn$_invoke$arity$1(repo);
if(cljs.core.truth_(temp__5804__auto__)){
var db = temp__5804__auto__;
return logseq.db.get_children.cljs$core$IFn$_invoke$arity$2(db,block_uuid);
} else {
return null;
}
});
/**
 * Including nested children.
 */
frontend.db.model.get_block_children = (function frontend$db$model$get_block_children(repo,block_uuid){
var temp__5804__auto__ = frontend.db.conn.get_db.cljs$core$IFn$_invoke$arity$1(repo);
if(cljs.core.truth_(temp__5804__auto__)){
var db = temp__5804__auto__;
var ids = (logseq.db.get_block_children_ids.cljs$core$IFn$_invoke$arity$2 ? logseq.db.get_block_children_ids.cljs$core$IFn$_invoke$arity$2(db,block_uuid) : logseq.db.get_block_children_ids.call(null,db,block_uuid));
if(cljs.core.seq(ids)){
var ids_SINGLEQUOTE_ = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (id){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),id], null);
}),ids);
return frontend.db.utils.pull_many.cljs$core$IFn$_invoke$arity$3(repo,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"*","*",345799209,null)], null),ids_SINGLEQUOTE_);
} else {
return null;
}
} else {
return null;
}
});
frontend.db.model.get_block_and_children = (function frontend$db$model$get_block_and_children(var_args){
var args__5732__auto__ = [];
var len__5726__auto___60767 = arguments.length;
var i__5727__auto___60768 = (0);
while(true){
if((i__5727__auto___60768 < len__5726__auto___60767)){
args__5732__auto__.push((arguments[i__5727__auto___60768]));

var G__60769 = (i__5727__auto___60768 + (1));
i__5727__auto___60768 = G__60769;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((2) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((2)),(0),null)):null);
return frontend.db.model.get_block_and_children.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),(arguments[(1)]),argseq__5733__auto__);
});

(frontend.db.model.get_block_and_children.cljs$core$IFn$_invoke$arity$variadic = (function (repo,block_uuid,p__60690){
var map__60691 = p__60690;
var map__60691__$1 = cljs.core.__destructure_map(map__60691);
var opts = map__60691__$1;
var db = frontend.db.conn.get_db.cljs$core$IFn$_invoke$arity$1(repo);
return logseq.db.get_block_and_children.cljs$core$IFn$_invoke$arity$variadic(db,block_uuid,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([opts], 0));
}));

(frontend.db.model.get_block_and_children.cljs$lang$maxFixedArity = (2));

/** @this {Function} */
(frontend.db.model.get_block_and_children.cljs$lang$applyTo = (function (seq60687){
var G__60688 = cljs.core.first(seq60687);
var seq60687__$1 = cljs.core.next(seq60687);
var G__60689 = cljs.core.first(seq60687__$1);
var seq60687__$2 = cljs.core.next(seq60687__$1);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__60688,G__60689,seq60687__$2);
}));

frontend.db.model.get_page = (function frontend$db$model$get_page(page_id_name_or_uuid){
if(cljs.core.truth_(page_id_name_or_uuid)){
return logseq.db.get_page(frontend.db.conn.get_db.cljs$core$IFn$_invoke$arity$0(),page_id_name_or_uuid);
} else {
return null;
}
});
frontend.db.model.get_case_page = (function frontend$db$model$get_case_page(page_name_or_uuid){
if(cljs.core.truth_(page_name_or_uuid)){
return logseq.db.get_case_page(frontend.db.conn.get_db.cljs$core$IFn$_invoke$arity$0(),page_name_or_uuid);
} else {
return null;
}
});
frontend.db.model.get_journal_page = (function frontend$db$model$get_journal_page(page_title){
var temp__5804__auto__ = frontend.date.journal_title__GT_int(page_title);
if(cljs.core.truth_(temp__5804__auto__)){
var journal_day = temp__5804__auto__;
var temp__5804__auto____$1 = frontend.db.conn.get_db.cljs$core$IFn$_invoke$arity$0();
if(cljs.core.truth_(temp__5804__auto____$1)){
var db = temp__5804__auto____$1;
return cljs.core.first((function (){var G__60692 = new cljs.core.PersistentVector(null, 7, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"find","find",496279456),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?page","?page",-1343187612,null),new cljs.core.Symbol(null,"...","...",-1926939749,null)], null),new cljs.core.Keyword(null,"in","in",-1531184865),new cljs.core.Symbol(null,"$","$",-1580747756,null),new cljs.core.Symbol(null,"?day","?day",686036275,null),new cljs.core.Keyword(null,"where","where",-2044795965),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?page","?page",-1343187612,null),new cljs.core.Keyword("block","journal-day","block/journal-day",-145748366),new cljs.core.Symbol(null,"?day","?day",686036275,null)], null)], null);
var G__60693 = db;
var G__60694 = journal_day;
return (datascript.core.q.cljs$core$IFn$_invoke$arity$3 ? datascript.core.q.cljs$core$IFn$_invoke$arity$3(G__60692,G__60693,G__60694) : datascript.core.q.call(null,G__60692,G__60693,G__60694));
})());
} else {
return null;
}
} else {
return null;
}
});
/**
 * Given any readable page-name, return the exact page-name in db. If page
 * doesn't exists yet, will return the passed `page-name`. Accepts both
 * sanitized or unsanitized names.
 * alias?: if true, alias is allowed to be returned; otherwise, it would be deref.
 */
frontend.db.model.get_redirect_page_name = (function frontend$db$model$get_redirect_page_name(var_args){
var G__60696 = arguments.length;
switch (G__60696) {
case 1:
return frontend.db.model.get_redirect_page_name.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return frontend.db.model.get_redirect_page_name.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.db.model.get_redirect_page_name.cljs$core$IFn$_invoke$arity$1 = (function (page_name){
return frontend.db.model.get_redirect_page_name.cljs$core$IFn$_invoke$arity$2(page_name,false);
}));

(frontend.db.model.get_redirect_page_name.cljs$core$IFn$_invoke$arity$2 = (function (page_name,alias_QMARK_){
if(cljs.core.truth_(page_name)){
var page_entity = logseq.db.get_page(frontend.db.conn.get_db.cljs$core$IFn$_invoke$arity$0(),page_name);
if(cljs.core.truth_(alias_QMARK_)){
var or__5002__auto__ = new cljs.core.Keyword("block","name","block/name",1619760316).cljs$core$IFn$_invoke$arity$1(page_entity);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return page_name;
}
} else {
if((page_entity == null)){
var temp__5802__auto__ = frontend.date.journal_title__GT_custom_format(page_name);
if(cljs.core.truth_(temp__5802__auto__)){
var journal_name = temp__5802__auto__;
return (frontend.util.page_name_sanity_lc.cljs$core$IFn$_invoke$arity$1 ? frontend.util.page_name_sanity_lc.cljs$core$IFn$_invoke$arity$1(journal_name) : frontend.util.page_name_sanity_lc.call(null,journal_name));
} else {
return page_name;
}
} else {
var source_page = frontend.db.model.get_alias_source_page(frontend.state.get_current_repo(),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(page_entity));
var or__5002__auto__ = new cljs.core.Keyword("block","name","block/name",1619760316).cljs$core$IFn$_invoke$arity$1(source_page);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = new cljs.core.Keyword("block","name","block/name",1619760316).cljs$core$IFn$_invoke$arity$1(page_entity);
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
return page_name;
}
}

}
}
} else {
return null;
}
}));

(frontend.db.model.get_redirect_page_name.cljs$lang$maxFixedArity = 2);

frontend.db.model.get_latest_journals = (function frontend$db$model$get_latest_journals(var_args){
var G__60698 = arguments.length;
switch (G__60698) {
case 1:
return frontend.db.model.get_latest_journals.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return frontend.db.model.get_latest_journals.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.db.model.get_latest_journals.cljs$core$IFn$_invoke$arity$1 = (function (n){
return frontend.db.model.get_latest_journals.cljs$core$IFn$_invoke$arity$2(frontend.state.get_current_repo(),n);
}));

(frontend.db.model.get_latest_journals.cljs$core$IFn$_invoke$arity$2 = (function (repo_url,n){
var temp__5804__auto__ = frontend.db.conn.get_db.cljs$core$IFn$_invoke$arity$1(repo_url);
if(cljs.core.truth_(temp__5804__auto__)){
var db = temp__5804__auto__;
return cljs.core.take.cljs$core$IFn$_invoke$arity$2(n,(logseq.db.get_latest_journals.cljs$core$IFn$_invoke$arity$1 ? logseq.db.get_latest_journals.cljs$core$IFn$_invoke$arity$1(db) : logseq.db.get_latest_journals.call(null,db)));
} else {
return null;
}
}));

(frontend.db.model.get_latest_journals.cljs$lang$maxFixedArity = 2);

frontend.db.model.get_pages_that_mentioned_page = (function frontend$db$model$get_pages_that_mentioned_page(repo,page_id,include_journals_QMARK_){
var temp__5804__auto__ = frontend.db.conn.get_db.cljs$core$IFn$_invoke$arity$1(repo);
if(cljs.core.truth_(temp__5804__auto__)){
var db = temp__5804__auto__;
return frontend.common.graph_view.get_pages_that_mentioned_page(db,page_id,include_journals_QMARK_);
} else {
return null;
}
});
frontend.db.model.get_page_referenced_blocks_full = (function frontend$db$model$get_page_referenced_blocks_full(var_args){
var G__60700 = arguments.length;
switch (G__60700) {
case 1:
return frontend.db.model.get_page_referenced_blocks_full.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return frontend.db.model.get_page_referenced_blocks_full.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.db.model.get_page_referenced_blocks_full.cljs$core$IFn$_invoke$arity$1 = (function (page_id){
return frontend.db.model.get_page_referenced_blocks_full.cljs$core$IFn$_invoke$arity$2(frontend.state.get_current_repo(),page_id);
}));

(frontend.db.model.get_page_referenced_blocks_full.cljs$core$IFn$_invoke$arity$2 = (function (repo,page_id){
if(cljs.core.truth_((function (){var and__5000__auto__ = repo;
if(cljs.core.truth_(and__5000__auto__)){
return page_id;
} else {
return and__5000__auto__;
}
})())){
var temp__5804__auto__ = frontend.db.conn.get_db.cljs$core$IFn$_invoke$arity$1(repo);
if(cljs.core.truth_(temp__5804__auto__)){
var db = temp__5804__auto__;
var pages = frontend.db.model.page_alias_set(repo,page_id);
var aliases = clojure.set.difference.cljs$core$IFn$_invoke$arity$2(pages,cljs.core.PersistentHashSet.createAsIfByAssoc([page_id]));
return cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p__60701){
var vec__60702 = p__60701;
var k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__60702,(0),null);
var blocks = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__60702,(1),null);
var k__$1 = ((cljs.core.contains_QMARK_(aliases,new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(k)))?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(k,new cljs.core.Keyword("block","alias?","block/alias?",-551896044),true):k);
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [k__$1,blocks], null);
}),frontend.db.utils.group_by_page(cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (block){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(page_id,new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","page","block/page",822314108).cljs$core$IFn$_invoke$arity$1(block)));
}),(function (){var G__60705 = new cljs.core.PersistentVector(null, 8, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"find","find",496279456),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.list(new cljs.core.Symbol(null,"pull","pull",779986722,null),new cljs.core.Symbol(null,"?block","?block",1541466123,null),new cljs.core.Symbol(null,"?block-attrs","?block-attrs",1362551561,null)),new cljs.core.Symbol(null,"...","...",-1926939749,null)], null),new cljs.core.Keyword(null,"in","in",-1531184865),new cljs.core.Symbol(null,"$","$",-1580747756,null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?ref-page","?ref-page",-893277661,null),new cljs.core.Symbol(null,"...","...",-1926939749,null)], null),new cljs.core.Symbol(null,"?block-attrs","?block-attrs",1362551561,null),new cljs.core.Keyword(null,"where","where",-2044795965),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?block","?block",1541466123,null),new cljs.core.Keyword("block","path-refs","block/path-refs",-2109181352),new cljs.core.Symbol(null,"?ref-page","?ref-page",-893277661,null)], null)], null);
var G__60706 = db;
var G__60707 = pages;
var G__60708 = cljs.core.butlast(frontend.db.file_based.model.file_graph_block_attrs);
return (datascript.core.q.cljs$core$IFn$_invoke$arity$4 ? datascript.core.q.cljs$core$IFn$_invoke$arity$4(G__60705,G__60706,G__60707,G__60708) : datascript.core.q.call(null,G__60705,G__60706,G__60707,G__60708));
})())));
} else {
return null;
}
} else {
return null;
}
}));

(frontend.db.model.get_page_referenced_blocks_full.cljs$lang$maxFixedArity = 2);

frontend.db.model.get_referenced_blocks = (function frontend$db$model$get_referenced_blocks(var_args){
var G__60712 = arguments.length;
switch (G__60712) {
case 1:
return frontend.db.model.get_referenced_blocks.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return frontend.db.model.get_referenced_blocks.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.db.model.get_referenced_blocks.cljs$core$IFn$_invoke$arity$1 = (function (eid){
return frontend.db.model.get_referenced_blocks.cljs$core$IFn$_invoke$arity$2(frontend.state.get_current_repo(),eid);
}));

(frontend.db.model.get_referenced_blocks.cljs$core$IFn$_invoke$arity$2 = (function (repo,eid){
if(cljs.core.truth_(repo)){
if(cljs.core.truth_(frontend.db.conn.get_db.cljs$core$IFn$_invoke$arity$1(repo))){
var entity = frontend.db.utils.entity.cljs$core$IFn$_invoke$arity$1(eid);
var ids = frontend.db.model.page_alias_set(repo,eid);
var entities = cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (id){
return new cljs.core.Keyword("block","_refs","block/_refs",830218531).cljs$core$IFn$_invoke$arity$1(frontend.db.utils.entity.cljs$core$IFn$_invoke$arity$1(id));
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([ids], 0));
var G__60715 = new cljs.core.Keyword("db","id","db/id",-1388397098);
var G__60716 = cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (block){
var or__5002__auto__ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block),eid);
if(or__5002__auto__){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(eid,new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","page","block/page",822314108).cljs$core$IFn$_invoke$arity$1(block)));
if(or__5002__auto____$1){
return or__5002__auto____$1;
} else {
var or__5002__auto____$2 = (function (){var G__60717 = new cljs.core.Keyword("block","page","block/page",822314108).cljs$core$IFn$_invoke$arity$1(block);
return (logseq.db.hidden_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.hidden_QMARK_.cljs$core$IFn$_invoke$arity$1(G__60717) : logseq.db.hidden_QMARK_.call(null,G__60717));
})();
if(cljs.core.truth_(or__5002__auto____$2)){
return or__5002__auto____$2;
} else {
return ((cljs.core.contains_QMARK_(cljs.core.set(cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","id","db/id",-1388397098),new cljs.core.Keyword("block","tags","block/tags",1814948340).cljs$core$IFn$_invoke$arity$1(block))),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(entity))) || ((!((cljs.core.get.cljs$core$IFn$_invoke$arity$2(block,new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(entity)) == null)))));
}
}
}
}),entities);
return (frontend.util.distinct_by.cljs$core$IFn$_invoke$arity$2 ? frontend.util.distinct_by.cljs$core$IFn$_invoke$arity$2(G__60715,G__60716) : frontend.util.distinct_by.call(null,G__60715,G__60716));
} else {
return null;
}
} else {
return null;
}
}));

(frontend.db.model.get_referenced_blocks.cljs$lang$maxFixedArity = 2);

frontend.db.model.get_block_referenced_blocks = (function frontend$db$model$get_block_referenced_blocks(block_id){
var temp__5804__auto__ = frontend.state.get_current_repo();
if(cljs.core.truth_(temp__5804__auto__)){
var repo = temp__5804__auto__;
if(cljs.core.truth_(frontend.db.conn.get_db.cljs$core$IFn$_invoke$arity$1(repo))){
return frontend.db.utils.group_by_page(frontend.db.model.sort_by_order_recursive(frontend.db.model.get_referenced_blocks.cljs$core$IFn$_invoke$arity$2(repo,block_id)));
} else {
return null;
}
} else {
return null;
}
});
/**
 * sanitized page-name only
 */
frontend.db.model.journal_page_QMARK_ = (function frontend$db$model$journal_page_QMARK_(page_name){
var G__60721 = logseq.db.get_page(frontend.db.conn.get_db.cljs$core$IFn$_invoke$arity$0(),page_name);
return (logseq.db.journal_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.journal_QMARK_.cljs$core$IFn$_invoke$arity$1(G__60721) : logseq.db.journal_QMARK_.call(null,G__60721));
});
/**
 * Get all uuids of blocks with any back link exists.
 */
frontend.db.model.get_all_referenced_blocks_uuid = (function frontend$db$model$get_all_referenced_blocks_uuid(){
var temp__5804__auto__ = frontend.db.conn.get_db.cljs$core$IFn$_invoke$arity$0();
if(cljs.core.truth_(temp__5804__auto__)){
var db = temp__5804__auto__;
var G__60723 = new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"find","find",496279456),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?refed-uuid","?refed-uuid",417914050,null),new cljs.core.Symbol(null,"...","...",-1926939749,null)], null),new cljs.core.Keyword(null,"where","where",-2044795965),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?refed-b","?refed-b",-875900233,null),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Symbol(null,"?refed-uuid","?refed-uuid",417914050,null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?referee-b","?referee-b",1661362384,null),new cljs.core.Keyword("block","refs","block/refs",-1214495349),new cljs.core.Symbol(null,"?refed-b","?refed-b",-875900233,null)], null)], null);
var G__60724 = db;
return (datascript.core.q.cljs$core$IFn$_invoke$arity$2 ? datascript.core.q.cljs$core$IFn$_invoke$arity$2(G__60723,G__60724) : datascript.core.q.call(null,G__60723,G__60724));
} else {
return null;
}
});
frontend.db.model.delete_files = (function frontend$db$model$delete_files(files){
return cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (path){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db.fn","retractEntity","db.fn/retractEntity",-1423535441),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("file","path","file/path",-191335748),path], null)], null);
}),files);
});
/**
 * Given a page entity, page object or page name, check if it is a whiteboard page
 */
frontend.db.model.whiteboard_page_QMARK_ = (function frontend$db$model$whiteboard_page_QMARK_(page){
var page__$1 = ((typeof page === 'string')?frontend.db.model.get_page(page):page);
return (logseq.db.whiteboard_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.whiteboard_QMARK_.cljs$core$IFn$_invoke$arity$1(page__$1) : logseq.db.whiteboard_QMARK_.call(null,page__$1));
});
frontend.db.model.untitled_page_QMARK_ = (function frontend$db$model$untitled_page_QMARK_(page_name){
if(cljs.core.truth_((function (){var G__60728 = page_name;
if((G__60728 == null)){
return null;
} else {
return logseq.db.get_page(frontend.db.conn.get_db.cljs$core$IFn$_invoke$arity$0(),G__60728);
}
})())){
return (!((cljs.core.parse_uuid(page_name) == null)));
} else {
return null;
}
});
frontend.db.model.get_all_whiteboards = (function frontend$db$model$get_all_whiteboards(repo){
if(cljs.core.truth_(frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$0())){
var G__60729 = new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"find","find",496279456),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.list(new cljs.core.Symbol(null,"pull","pull",779986722,null),new cljs.core.Symbol(null,"?page","?page",-1343187612,null),new cljs.core.PersistentVector(null, 6, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","id","db/id",-1388397098),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Keyword("block","name","block/name",1619760316),new cljs.core.Keyword("block","title","block/title",710445684),new cljs.core.Keyword("block","created-at","block/created-at",1440015),new cljs.core.Keyword("block","updated-at","block/updated-at",-1516550551)], null)),new cljs.core.Symbol(null,"...","...",-1926939749,null)], null),new cljs.core.Keyword(null,"where","where",-2044795965),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?page","?page",-1343187612,null),new cljs.core.Keyword("block","name","block/name",1619760316)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?page","?page",-1343187612,null),new cljs.core.Keyword("block","tags","block/tags",1814948340),new cljs.core.Keyword("logseq.class","Whiteboard","logseq.class/Whiteboard",1013698452)], null)], null);
var G__60730 = frontend.db.conn.get_db.cljs$core$IFn$_invoke$arity$1(repo);
return (datascript.core.q.cljs$core$IFn$_invoke$arity$2 ? datascript.core.q.cljs$core$IFn$_invoke$arity$2(G__60729,G__60730) : datascript.core.q.call(null,G__60729,G__60730));
} else {
var G__60731 = new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"find","find",496279456),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.list(new cljs.core.Symbol(null,"pull","pull",779986722,null),new cljs.core.Symbol(null,"?page","?page",-1343187612,null),new cljs.core.PersistentVector(null, 6, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","id","db/id",-1388397098),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Keyword("block","name","block/name",1619760316),new cljs.core.Keyword("block","title","block/title",710445684),new cljs.core.Keyword("block","created-at","block/created-at",1440015),new cljs.core.Keyword("block","updated-at","block/updated-at",-1516550551)], null)),new cljs.core.Symbol(null,"...","...",-1926939749,null)], null),new cljs.core.Keyword(null,"where","where",-2044795965),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?page","?page",-1343187612,null),new cljs.core.Keyword("block","name","block/name",1619760316)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?page","?page",-1343187612,null),new cljs.core.Keyword("block","type","block/type",1537584409),"whiteboard"], null)], null);
var G__60732 = frontend.db.conn.get_db.cljs$core$IFn$_invoke$arity$1(repo);
return (datascript.core.q.cljs$core$IFn$_invoke$arity$2 ? datascript.core.q.cljs$core$IFn$_invoke$arity$2(G__60731,G__60732) : datascript.core.q.call(null,G__60731,G__60732));
}
});
frontend.db.model.get_whiteboard_id_nonces = (function frontend$db$model$get_whiteboard_id_nonces(repo,page_id){
var db_based_QMARK_ = frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(repo);
var key = ((db_based_QMARK_)?new cljs.core.Keyword("logseq.property.tldraw","shape","logseq.property.tldraw/shape",-1313245420):new cljs.core.Keyword(null,"logseq.tldraw.shape","logseq.tldraw.shape",-771542905));
var page = frontend.db.utils.entity.cljs$core$IFn$_invoke$arity$1(page_id);
return cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (p__60733){
var map__60734 = p__60733;
var map__60734__$1 = cljs.core.__destructure_map(map__60734);
var b = map__60734__$1;
var uuid = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__60734__$1,new cljs.core.Keyword("block","uuid","block/uuid",-1991494552));
var temp__5804__auto__ = ((db_based_QMARK_)?cljs.core.get.cljs$core$IFn$_invoke$arity$2(b,key):cljs.core.get.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","properties","block/properties",708347145).cljs$core$IFn$_invoke$arity$1(b),key));
if(cljs.core.truth_(temp__5804__auto__)){
var shape = temp__5804__auto__;
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"id","id",-1388402092),cljs.core.str.cljs$core$IFn$_invoke$arity$1(uuid),new cljs.core.Keyword(null,"nonce","nonce",564330331),new cljs.core.Keyword(null,"nonce","nonce",564330331).cljs$core$IFn$_invoke$arity$1(shape)], null);
} else {
return null;
}
}),new cljs.core.Keyword("block","_page","block/_page",1150043350).cljs$core$IFn$_invoke$arity$1(page));
});
frontend.db.model.get_all_classes = (function frontend$db$model$get_all_classes(var_args){
var args__5732__auto__ = [];
var len__5726__auto___60774 = arguments.length;
var i__5727__auto___60775 = (0);
while(true){
if((i__5727__auto___60775 < len__5726__auto___60774)){
args__5732__auto__.push((arguments[i__5727__auto___60775]));

var G__60776 = (i__5727__auto___60775 + (1));
i__5727__auto___60775 = G__60776;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return frontend.db.model.get_all_classes.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(frontend.db.model.get_all_classes.cljs$core$IFn$_invoke$arity$variadic = (function (repo,p__60744){
var map__60745 = p__60744;
var map__60745__$1 = cljs.core.__destructure_map(map__60745);
var except_root_class_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__60745__$1,new cljs.core.Keyword(null,"except-root-class?","except-root-class?",-345353595),false);
var except_private_tags_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__60745__$1,new cljs.core.Keyword(null,"except-private-tags?","except-private-tags?",1020635160),true);
var db = frontend.db.conn.get_db.cljs$core$IFn$_invoke$arity$1(repo);
var classes = cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (d){
var and__5000__auto__ = except_private_tags_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.contains_QMARK_(logseq.db.private_tags,new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(d));
} else {
return and__5000__auto__;
}
}),cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (d){
return frontend.db.utils.entity.cljs$core$IFn$_invoke$arity$2(db,new cljs.core.Keyword(null,"e","e",1381269198).cljs$core$IFn$_invoke$arity$1(d));
}),datascript.core.datoms.cljs$core$IFn$_invoke$arity$4(db,new cljs.core.Keyword(null,"avet","avet",1383857032),new cljs.core.Keyword("block","tags","block/tags",1814948340),new cljs.core.Keyword("logseq.class","Tag","logseq.class/Tag",-538902083))));
if(cljs.core.truth_(except_root_class_QMARK_)){
return cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (e){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("logseq.class","Root","logseq.class/Root",273783827),new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(e))){
return null;
} else {
return e;
}
}),classes);
} else {
return classes;
}
}));

(frontend.db.model.get_all_classes.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(frontend.db.model.get_all_classes.cljs$lang$applyTo = (function (seq60739){
var G__60740 = cljs.core.first(seq60739);
var seq60739__$1 = cljs.core.next(seq60739);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__60740,seq60739__$1);
}));

frontend.db.model.ui_non_suitable_property_QMARK_ = (function frontend$db$model$ui_non_suitable_property_QMARK_(block,m,p__60746){
var map__60747 = p__60746;
var map__60747__$1 = cljs.core.__destructure_map(map__60747);
var class_schema_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__60747__$1,new cljs.core.Keyword(null,"class-schema?","class-schema?",508813900));
if(cljs.core.truth_(block)){
var block_page_QMARK_ = (logseq.db.page_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.page_QMARK_.cljs$core$IFn$_invoke$arity$1(block) : logseq.db.page_QMARK_.call(null,block));
var block_types = (function (){var types = (logseq.db.get_entity_types.cljs$core$IFn$_invoke$arity$1 ? logseq.db.get_entity_types.cljs$core$IFn$_invoke$arity$1(block) : logseq.db.get_entity_types.call(null,block));
var G__60748 = types;
var G__60748__$1 = (cljs.core.truth_((function (){var and__5000__auto__ = block_page_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return (!(cljs.core.contains_QMARK_(types,new cljs.core.Keyword(null,"page","page",849072397))));
} else {
return and__5000__auto__;
}
})())?cljs.core.conj.cljs$core$IFn$_invoke$arity$2(G__60748,new cljs.core.Keyword(null,"page","page",849072397)):G__60748);
if(cljs.core.empty_QMARK_(types)){
return cljs.core.conj.cljs$core$IFn$_invoke$arity$2(G__60748__$1,new cljs.core.Keyword(null,"block","block",664686210));
} else {
return G__60748__$1;
}
})();
var view_context = cljs.core.get.cljs$core$IFn$_invoke$arity$3(m,new cljs.core.Keyword("logseq.property","view-context","logseq.property/view-context",-1547395828),new cljs.core.Keyword(null,"all","all",892129742));
var or__5002__auto__ = cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("logseq.property","query","logseq.property/query",-97414126),null], null), null),new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(m));
if(or__5002__auto__){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = ((cljs.core.not(block_page_QMARK_)) && (cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("block","alias","block/alias",-2112644699),null], null), null),new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(m))));
if(or__5002__auto____$1){
return or__5002__auto____$1;
} else {
var or__5002__auto____$2 = ((cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(view_context,new cljs.core.Keyword(null,"all","all",892129742))) && ((!(cljs.core.contains_QMARK_(block_types,view_context)))));
if(or__5002__auto____$2){
return or__5002__auto____$2;
} else {
var or__5002__auto____$3 = (function (){var and__5000__auto__ = (logseq.db.built_in_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.built_in_QMARK_.cljs$core$IFn$_invoke$arity$1(block) : logseq.db.built_in_QMARK_.call(null,block));
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("logseq.property","parent","logseq.property/parent",177984509),null], null), null),new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(m));
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(or__5002__auto____$3)){
return or__5002__auto____$3;
} else {
var and__5000__auto__ = class_schema_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
var and__5000__auto____$1 = (logseq.db.public_built_in_property_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.public_built_in_property_QMARK_.cljs$core$IFn$_invoke$arity$1(m) : logseq.db.public_built_in_property_QMARK_.call(null,m));
if(cljs.core.truth_(and__5000__auto____$1)){
return new cljs.core.Keyword("logseq.property","view-context","logseq.property/view-context",-1547395828).cljs$core$IFn$_invoke$arity$1(m);
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
}
}
}
}
} else {
return null;
}
});
/**
 * Return seq of all property names except for private built-in properties.
 */
frontend.db.model.get_all_properties = (function frontend$db$model$get_all_properties(var_args){
var args__5732__auto__ = [];
var len__5726__auto___60777 = arguments.length;
var i__5727__auto___60778 = (0);
while(true){
if((i__5727__auto___60778 < len__5726__auto___60777)){
args__5732__auto__.push((arguments[i__5727__auto___60778]));

var G__60779 = (i__5727__auto___60778 + (1));
i__5727__auto___60778 = G__60779;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return frontend.db.model.get_all_properties.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(frontend.db.model.get_all_properties.cljs$core$IFn$_invoke$arity$variadic = (function (graph,p__60752){
var map__60753 = p__60752;
var map__60753__$1 = cljs.core.__destructure_map(map__60753);
var remove_built_in_property_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__60753__$1,new cljs.core.Keyword(null,"remove-built-in-property?","remove-built-in-property?",454663723),true);
var remove_non_queryable_built_in_property_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__60753__$1,new cljs.core.Keyword(null,"remove-non-queryable-built-in-property?","remove-non-queryable-built-in-property?",1219338536),false);
var remove_ui_non_suitable_properties_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__60753__$1,new cljs.core.Keyword(null,"remove-ui-non-suitable-properties?","remove-ui-non-suitable-properties?",603866281),false);
var class_schema_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__60753__$1,new cljs.core.Keyword(null,"class-schema?","class-schema?",508813900));
var block = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__60753__$1,new cljs.core.Keyword(null,"block","block",664686210));
var db = frontend.db.conn.get_db.cljs$core$IFn$_invoke$arity$1(graph);
var result = cljs.core.sort_by.cljs$core$IFn$_invoke$arity$2(cljs.core.juxt.cljs$core$IFn$_invoke$arity$2(logseq.db.built_in_QMARK_,new cljs.core.Keyword("block","title","block/title",710445684)),(logseq.db.get_all_properties.cljs$core$IFn$_invoke$arity$1 ? logseq.db.get_all_properties.cljs$core$IFn$_invoke$arity$1(db) : logseq.db.get_all_properties.call(null,db)));
var G__60754 = result;
var G__60754__$1 = (cljs.core.truth_(remove_built_in_property_QMARK_)?cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (p){
var ident = new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(p);
var and__5000__auto__ = (logseq.db.built_in_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.built_in_QMARK_.cljs$core$IFn$_invoke$arity$1(p) : logseq.db.built_in_QMARK_.call(null,p));
if(cljs.core.truth_(and__5000__auto__)){
return ((cljs.core.not((logseq.db.public_built_in_property_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.public_built_in_property_QMARK_.cljs$core$IFn$_invoke$arity$1(p) : logseq.db.public_built_in_property_QMARK_.call(null,p)))) && (cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(ident,new cljs.core.Keyword("logseq.property","icon","logseq.property/icon",589123285))));
} else {
return and__5000__auto__;
}
}),G__60754):G__60754);
var G__60754__$2 = (cljs.core.truth_(remove_non_queryable_built_in_property_QMARK_)?cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (p){
var ident = new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(p);
var and__5000__auto__ = (logseq.db.built_in_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.built_in_QMARK_.cljs$core$IFn$_invoke$arity$1(p) : logseq.db.built_in_QMARK_.call(null,p));
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.not(new cljs.core.Keyword(null,"queryable?","queryable?",200024326).cljs$core$IFn$_invoke$arity$1((logseq.db.frontend.property.built_in_properties.cljs$core$IFn$_invoke$arity$1 ? logseq.db.frontend.property.built_in_properties.cljs$core$IFn$_invoke$arity$1(ident) : logseq.db.frontend.property.built_in_properties.call(null,ident))));
} else {
return and__5000__auto__;
}
}),G__60754__$1):G__60754__$1);
if(cljs.core.truth_(remove_ui_non_suitable_properties_QMARK_)){
return cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (p){
return frontend.db.model.ui_non_suitable_property_QMARK_(block,p,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class-schema?","class-schema?",508813900),class_schema_QMARK_], null));
}),G__60754__$2);
} else {
return G__60754__$2;
}
}));

(frontend.db.model.get_all_properties.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(frontend.db.model.get_all_properties.cljs$lang$applyTo = (function (seq60750){
var G__60751 = cljs.core.first(seq60750);
var seq60750__$1 = cljs.core.next(seq60750);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__60751,seq60750__$1);
}));

/**
 * Gets all classes that are used in a read only context e.g. querying or used
 *   for property value selection. This should _not_ be used in a write context e.g.
 *   adding a tag to a node or creating a new node with a tag
 */
frontend.db.model.get_all_readable_classes = (function frontend$db$model$get_all_readable_classes(repo,opts){
return frontend.db.model.get_all_classes.cljs$core$IFn$_invoke$arity$variadic(repo,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([opts,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"except-private-tags?","except-private-tags?",1020635160),false], null)], 0))], 0));
});
frontend.db.model.get_structured_children = (function frontend$db$model$get_structured_children(repo,eid){
return logseq.db.frontend.class$.get_structured_children(frontend.db.conn.get_db.cljs$core$IFn$_invoke$arity$1(repo),eid);
});
frontend.db.model.get_class_objects = (function frontend$db$model$get_class_objects(repo,class_id){
var temp__5804__auto__ = frontend.db.utils.entity.cljs$core$IFn$_invoke$arity$2(repo,class_id);
if(cljs.core.truth_(temp__5804__auto__)){
var class$ = temp__5804__auto__;
return cljs.core.remove.cljs$core$IFn$_invoke$arity$2(logseq.db.hidden_QMARK_,(cljs.core.truth_(cljs.core.first(new cljs.core.Keyword("logseq.property","_parent","logseq.property/_parent",444328035).cljs$core$IFn$_invoke$arity$1(class$)))?(function (){var all_classes = cljs.core.conj.cljs$core$IFn$_invoke$arity$2(cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__60755_SHARP_){
return frontend.db.utils.entity.cljs$core$IFn$_invoke$arity$2(repo,p1__60755_SHARP_);
}),frontend.db.model.get_structured_children(repo,class_id)),class$);
return cljs.core.distinct.cljs$core$IFn$_invoke$arity$1(cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword("block","_tags","block/_tags",492463304),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([all_classes], 0)));
})():new cljs.core.Keyword("block","_tags","block/_tags",492463304).cljs$core$IFn$_invoke$arity$1(class$)));
} else {
return null;
}
});

//# sourceMappingURL=frontend.db.model.js.map
