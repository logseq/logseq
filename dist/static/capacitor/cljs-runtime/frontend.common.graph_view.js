goog.provide('frontend.common.graph_view');
frontend.common.graph_view.build_links = (function frontend$common$graph_view$build_links(links){
return cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (p__62385){
var vec__62386 = p__62385;
var from = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__62386,(0),null);
var to = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__62386,(1),null);
if(cljs.core.truth_((function (){var and__5000__auto__ = from;
if(cljs.core.truth_(and__5000__auto__)){
return to;
} else {
return and__5000__auto__;
}
})())){
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"source","source",-433931539),cljs.core.str.cljs$core$IFn$_invoke$arity$1(from),new cljs.core.Keyword(null,"target","target",253001721),cljs.core.str.cljs$core$IFn$_invoke$arity$1(to)], null);
} else {
return null;
}
}),links);
});
frontend.common.graph_view.build_nodes = (function frontend$common$graph_view$build_nodes(dark_QMARK_,current_page,page_links,tags,nodes,namespaces){
var page_parents = cljs.core.set(cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.last,namespaces));
var current_page__$1 = (function (){var or__5002__auto__ = current_page;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return "";
}
})();
var pages = logseq.common.util.distinct_by(new cljs.core.Keyword("db","id","db/id",-1388397098),nodes);
return cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (p){
var page_title = new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(p);
var current_page_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(page_title,current_page__$1);
var color = (function (){var G__62403 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [dark_QMARK_,current_page_QMARK_], null);
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [false,false], null),G__62403)){
return "#999";
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [false,true], null),G__62403)){
return "#045591";
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [true,false], null),G__62403)){
return "#93a1a1";
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [true,true], null),G__62403)){
return "#ffffff";
} else {
throw (new Error(["No matching clause: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(G__62403)].join('')));

}
}
}
}
})();
var color__$1 = ((cljs.core.contains_QMARK_(tags,new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(p)))?(cljs.core.truth_(dark_QMARK_)?"orange":"green"):color);
var n = cljs.core.get.cljs$core$IFn$_invoke$arity$3(page_links,page_title,(1));
var size = (((8) * (function (){var x__5087__auto__ = 1.0;
var y__5088__auto__ = Math.cbrt(n);
return ((x__5087__auto__ > y__5088__auto__) ? x__5087__auto__ : y__5088__auto__);
})()) | (0));
var G__62404 = new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"id","id",-1388402092),cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(p)),new cljs.core.Keyword(null,"label","label",1718410804),page_title,new cljs.core.Keyword(null,"size","size",1098693007),size,new cljs.core.Keyword(null,"color","color",1011675173),color__$1,new cljs.core.Keyword("block","created-at","block/created-at",1440015),new cljs.core.Keyword("block","created-at","block/created-at",1440015).cljs$core$IFn$_invoke$arity$1(p)], null);
if(cljs.core.contains_QMARK_(page_parents,new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(p))){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__62404,new cljs.core.Keyword(null,"parent","parent",-878878779),true);
} else {
return G__62404;
}
}),cljs.core.remove.cljs$core$IFn$_invoke$arity$2(cljs.core.nil_QMARK_,cljs.core.remove.cljs$core$IFn$_invoke$arity$2(logseq.db.hidden_QMARK_,pages)));
});
frontend.common.graph_view.uuid_or_asset_QMARK_ = (function frontend$common$graph_view$uuid_or_asset_QMARK_(label){
return ((logseq.common.util.uuid_string_QMARK_(label)) || (((clojure.string.starts_with_QMARK_(label,"../assets/")) || (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(label,"..")) || (((clojure.string.starts_with_QMARK_(label,"assets/")) || (((clojure.string.ends_with_QMARK_(label,".gif")) || (((clojure.string.ends_with_QMARK_(label,".jpg")) || (clojure.string.ends_with_QMARK_(label,".png")))))))))))));
});
frontend.common.graph_view.remove_uuids_and_files_BANG_ = (function frontend$common$graph_view$remove_uuids_and_files_BANG_(nodes){
return cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (node){
return frontend.common.graph_view.uuid_or_asset_QMARK_(new cljs.core.Keyword(null,"label","label",1718410804).cljs$core$IFn$_invoke$arity$1(node));
}),nodes);
});
frontend.common.graph_view.normalize_page_name = (function frontend$common$graph_view$normalize_page_name(p__62413){
var map__62414 = p__62413;
var map__62414__$1 = cljs.core.__destructure_map(map__62414);
var nodes = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__62414__$1,new cljs.core.Keyword(null,"nodes","nodes",-2099585805));
var links = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__62414__$1,new cljs.core.Keyword(null,"links","links",-654507394));
var nodes_SINGLEQUOTE_ = cljs.core.remove.cljs$core$IFn$_invoke$arity$2(cljs.core.nil_QMARK_,logseq.common.util.distinct_by((function (node){
return new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(node);
}),frontend.common.graph_view.remove_uuids_and_files_BANG_(nodes)));
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"nodes","nodes",-2099585805),nodes_SINGLEQUOTE_,new cljs.core.Keyword(null,"links","links",-654507394),links], null);
});
frontend.common.graph_view.build_global_graph = (function frontend$common$graph_view$build_global_graph(db,p__62423){
var map__62425 = p__62423;
var map__62425__$1 = cljs.core.__destructure_map(map__62425);
var theme = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__62425__$1,new cljs.core.Keyword(null,"theme","theme",-1247880880));
var journal_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__62425__$1,new cljs.core.Keyword(null,"journal?","journal?",-897756522));
var orphan_pages_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__62425__$1,new cljs.core.Keyword(null,"orphan-pages?","orphan-pages?",-824819206));
var builtin_pages_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__62425__$1,new cljs.core.Keyword(null,"builtin-pages?","builtin-pages?",1299611390));
var excluded_pages_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__62425__$1,new cljs.core.Keyword(null,"excluded-pages?","excluded-pages?",1527958391));
var created_at_filter = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__62425__$1,new cljs.core.Keyword(null,"created-at-filter","created-at-filter",708262492));
var dark_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("dark",theme);
var relation = logseq.db.get_pages_relation(db,journal_QMARK_);
var tagged_pages = logseq.db.get_all_tagged_pages(db);
var namespaces = logseq.graph_parser.db.get_all_namespace_relation(db);
var tags = cljs.core.set(cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.second,tagged_pages));
var full_pages = logseq.db.get_all_pages(db);
var db_based_QMARK_ = logseq.db.common.entity_plus.db_based_graph_QMARK_(db);
var created_ats = cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","created-at","block/created-at",1440015),full_pages);
var full_pages_SINGLEQUOTE_ = (function (){var G__62430 = full_pages;
var G__62430__$1 = (cljs.core.truth_(created_at_filter)?cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (p1__62417_SHARP_){
return (new cljs.core.Keyword("block","created-at","block/created-at",1440015).cljs$core$IFn$_invoke$arity$1(p1__62417_SHARP_) <= (cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core.min,created_ats) + created_at_filter));
}),G__62430):G__62430);
var G__62430__$2 = ((cljs.core.not(journal_QMARK_))?cljs.core.remove.cljs$core$IFn$_invoke$arity$2(logseq.db.journal_QMARK_,G__62430__$1):G__62430__$1);
if(cljs.core.not(excluded_pages_QMARK_)){
return cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (p){
return (cljs.core.truth_(db_based_QMARK_)?cljs.core.get.cljs$core$IFn$_invoke$arity$2(p,new cljs.core.Keyword("logseq.property","exclude-from-graph-view","logseq.property/exclude-from-graph-view",-452433065)):cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(p,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","properties","block/properties",708347145),new cljs.core.Keyword(null,"exclude-from-graph-view","exclude-from-graph-view",-1509369969)], null))) === true;
}),G__62430__$2);
} else {
return G__62430__$2;
}
})();
var links = cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic(relation,tagged_pages,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([namespaces], 0));
var linked = cljs.core.set(cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic(cljs.core.identity,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([links], 0)));
var build_in_pages = cljs.core.set(cljs.core.map.cljs$core$IFn$_invoke$arity$2(clojure.string.lower_case,(cljs.core.truth_(db_based_QMARK_)?logseq.db.sqlite.create_graph.built_in_pages_names:logseq.graph_parser.db.built_in_pages_names)));
var nodes = (function (){var G__62431 = full_pages_SINGLEQUOTE_;
var G__62431__$1 = ((cljs.core.not(builtin_pages_QMARK_))?cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (p1__62418_SHARP_){
return cljs.core.contains_QMARK_(build_in_pages,new cljs.core.Keyword("block","name","block/name",1619760316).cljs$core$IFn$_invoke$arity$1(p1__62418_SHARP_));
}),G__62431):G__62431);
if(cljs.core.not(orphan_pages_QMARK_)){
return cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (p1__62419_SHARP_){
return cljs.core.contains_QMARK_(linked,new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(p1__62419_SHARP_));
}),G__62431__$1);
} else {
return G__62431__$1;
}
})();
var links__$1 = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p__62441){
var vec__62445 = p__62441;
var x = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__62445,(0),null);
var y = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__62445,(1),null);
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.str.cljs$core$IFn$_invoke$arity$1(x),cljs.core.str.cljs$core$IFn$_invoke$arity$1(y)], null);
}),links);
var page_links = cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (m,p__62448){
var vec__62449 = p__62448;
var k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__62449,(0),null);
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__62449,(1),null);
return cljs.core.update.cljs$core$IFn$_invoke$arity$3(cljs.core.update.cljs$core$IFn$_invoke$arity$3(m,k,cljs.core.inc),v,cljs.core.inc);
}),cljs.core.PersistentArrayMap.EMPTY,links__$1);
var links__$2 = frontend.common.graph_view.build_links(links__$1);
var nodes__$1 = frontend.common.graph_view.build_nodes(dark_QMARK_,null,page_links,tags,nodes,namespaces);
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(frontend.common.graph_view.normalize_page_name(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"nodes","nodes",-2099585805),nodes__$1,new cljs.core.Keyword(null,"links","links",-654507394),links__$2], null)),new cljs.core.Keyword(null,"all-pages","all-pages",1017563062),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"created-at-min","created-at-min",355144021),cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core.min,created_ats),new cljs.core.Keyword(null,"created-at-max","created-at-max",259911175),cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core.max,created_ats)], null));
});
frontend.common.graph_view.get_pages_that_mentioned_page = (function frontend$common$graph_view$get_pages_that_mentioned_page(db,page_id,include_journals_QMARK_){
var pages = logseq.db.page_alias_set(db,page_id);
var mentioned_pages = logseq.common.util.distinct_by(new cljs.core.Keyword("db","id","db/id",-1388397098),cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (id){
var page = (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db,id) : datascript.core.entity.call(null,db,id));
return cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (ref){
if(cljs.core.truth_((logseq.db.page_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.page_QMARK_.cljs$core$IFn$_invoke$arity$1(ref) : logseq.db.page_QMARK_.call(null,ref)))){
return page;
} else {
return new cljs.core.Keyword("block","page","block/page",822314108).cljs$core$IFn$_invoke$arity$1(ref);
}
}),new cljs.core.Keyword("block","_refs","block/_refs",830218531).cljs$core$IFn$_invoke$arity$1(page));
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([pages], 0)));
return cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (page){
if(cljs.core.truth_((function (){var and__5000__auto__ = cljs.core.not(include_journals_QMARK_);
if(and__5000__auto__){
return (logseq.db.journal_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.journal_QMARK_.cljs$core$IFn$_invoke$arity$1(page) : logseq.db.journal_QMARK_.call(null,page));
} else {
return and__5000__auto__;
}
})())){
return null;
} else {
return new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(page);
}
}),mentioned_pages);
});
frontend.common.graph_view.get_page_referenced_pages = (function frontend$common$graph_view$get_page_referenced_pages(db,page_id){
var pages = logseq.db.page_alias_set(db,page_id);
var ref_pages = (function (){var G__62459 = new cljs.core.PersistentVector(null, 9, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"find","find",496279456),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?ref-page","?ref-page",-893277661,null),new cljs.core.Symbol(null,"...","...",-1926939749,null)], null),new cljs.core.Keyword(null,"in","in",-1531184865),new cljs.core.Symbol(null,"$","$",-1580747756,null),new cljs.core.Symbol(null,"?pages","?pages",1767840716,null),new cljs.core.Keyword(null,"where","where",-2044795965),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.list(new cljs.core.Symbol(null,"untuple","untuple",-606149900,null),new cljs.core.Symbol(null,"?pages","?pages",1767840716,null)),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?page","?page",-1343187612,null),new cljs.core.Symbol(null,"...","...",-1926939749,null)], null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?block","?block",1541466123,null),new cljs.core.Keyword("block","page","block/page",822314108),new cljs.core.Symbol(null,"?page","?page",-1343187612,null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?block","?block",1541466123,null),new cljs.core.Keyword("block","refs","block/refs",-1214495349),new cljs.core.Symbol(null,"?ref-page","?ref-page",-893277661,null)], null)], null);
var G__62460 = db;
var G__62461 = pages;
return (datascript.core.q.cljs$core$IFn$_invoke$arity$3 ? datascript.core.q.cljs$core$IFn$_invoke$arity$3(G__62459,G__62460,G__62461) : datascript.core.q.call(null,G__62459,G__62460,G__62461));
})();
return ref_pages;
});
frontend.common.graph_view.build_page_graph_other_page_links = (function frontend$common$graph_view$build_page_graph_other_page_links(db,other_pages_STAR_,show_journal){
var other_pages = cljs.core.set(cljs.core.remove.cljs$core$IFn$_invoke$arity$2(cljs.core.nil_QMARK_,other_pages_STAR_));
return cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (page_id){
var ref_pages = clojure.set.intersection.cljs$core$IFn$_invoke$arity$2(cljs.core.set(frontend.common.graph_view.get_page_referenced_pages(db,page_id)),other_pages);
var mentioned_pages = clojure.set.intersection.cljs$core$IFn$_invoke$arity$2(cljs.core.set(frontend.common.graph_view.get_pages_that_mentioned_page(db,page_id,show_journal)),other_pages);
return cljs.core.concat.cljs$core$IFn$_invoke$arity$2(cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [page_id,p], null);
}),ref_pages),cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [p,page_id], null);
}),mentioned_pages));
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([other_pages], 0));
});
frontend.common.graph_view.build_page_graph = (function frontend$common$graph_view$build_page_graph(db,page_uuid,theme,show_journal){
var dark_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("dark",theme);
var page_entity = (function (){var G__62484 = db;
var G__62485 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),page_uuid], null);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__62484,G__62485) : datascript.core.entity.call(null,G__62484,G__62485));
})();
var db_based_QMARK_ = logseq.db.common.entity_plus.db_based_graph_QMARK_(db);
var page_id = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(page_entity);
var tags = (cljs.core.truth_(db_based_QMARK_)?cljs.core.set(cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","id","db/id",-1388397098),new cljs.core.Keyword("block","tags","block/tags",1814948340).cljs$core$IFn$_invoke$arity$1(page_entity))):null);
var tags__$1 = cljs.core.set(cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (p1__62482_SHARP_){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(page_id,p1__62482_SHARP_);
}),tags));
var ref_pages = frontend.common.graph_view.get_page_referenced_pages(db,page_id);
var mentioned_pages = frontend.common.graph_view.get_pages_that_mentioned_page(db,page_id,show_journal);
var namespaces = logseq.graph_parser.db.get_all_namespace_relation(db);
var links = cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic(namespaces,cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (ref_page){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [page_id,ref_page], null);
}),ref_pages),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (page){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [page_id,page], null);
}),mentioned_pages),cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (tag){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [page_id,tag], null);
}),tags__$1)], 0));
var other_pages_links = frontend.common.graph_view.build_page_graph_other_page_links(db,cljs.core.concat.cljs$core$IFn$_invoke$arity$2(ref_pages,mentioned_pages),show_journal);
var links__$1 = frontend.common.graph_view.build_links(cljs.core.distinct.cljs$core$IFn$_invoke$arity$1(cljs.core.remove.cljs$core$IFn$_invoke$arity$2(cljs.core.nil_QMARK_,cljs.core.concat.cljs$core$IFn$_invoke$arity$2(links,other_pages_links))));
var nodes = logseq.common.util.distinct_by(new cljs.core.Keyword("db","id","db/id",-1388397098),cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__62483_SHARP_){
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db,p1__62483_SHARP_) : datascript.core.entity.call(null,db,p1__62483_SHARP_));
}),cljs.core.remove.cljs$core$IFn$_invoke$arity$2(cljs.core.nil_QMARK_,cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [page_id], null),ref_pages,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([mentioned_pages,tags__$1], 0)))));
var nodes__$1 = frontend.common.graph_view.build_nodes(dark_QMARK_,new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(page_entity),links__$1,tags__$1,nodes,namespaces);
return frontend.common.graph_view.normalize_page_name(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"nodes","nodes",-2099585805),nodes__$1,new cljs.core.Keyword(null,"links","links",-654507394),links__$1], null));
});
/**
 * Builds a citation/reference graph for a given block uuid.
 */
frontend.common.graph_view.build_block_graph = (function frontend$common$graph_view$build_block_graph(db,block_uuid,theme){
var temp__5804__auto__ = (function (){var and__5000__auto__ = cljs.core.uuid_QMARK_(block_uuid);
if(and__5000__auto__){
var G__62498 = db;
var G__62499 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_uuid], null);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__62498,G__62499) : datascript.core.entity.call(null,G__62498,G__62499));
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5804__auto__)){
var block = temp__5804__auto__;
var dark_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("dark",theme);
var ref_blocks = logseq.common.util.distinct_by(new cljs.core.Keyword("db","id","db/id",-1388397098),cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (node){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(node));
}),cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (b){
if(cljs.core.truth_((logseq.db.page_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.page_QMARK_.cljs$core$IFn$_invoke$arity$1(b) : logseq.db.page_QMARK_.call(null,b)))){
return b;
} else {
return new cljs.core.Keyword("block","page","block/page",822314108).cljs$core$IFn$_invoke$arity$1(b);
}
}),cljs.core.concat.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","_refs","block/_refs",830218531).cljs$core$IFn$_invoke$arity$1(block),new cljs.core.Keyword("block","refs","block/refs",-1214495349).cljs$core$IFn$_invoke$arity$1(block)))));
var namespaces = logseq.graph_parser.db.get_all_namespace_relation(db);
var links = frontend.common.graph_view.build_links(cljs.core.distinct.cljs$core$IFn$_invoke$arity$1(cljs.core.remove.cljs$core$IFn$_invoke$arity$2(cljs.core.nil_QMARK_,cljs.core.concat.cljs$core$IFn$_invoke$arity$2(namespaces,cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(p)], null);
}),ref_blocks)))));
var nodes = cljs.core.distinct.cljs$core$IFn$_invoke$arity$1(cljs.core.cons(block,ref_blocks));
var nodes__$1 = frontend.common.graph_view.build_nodes(dark_QMARK_,block,links,cljs.core.PersistentHashSet.EMPTY,nodes,namespaces);
return frontend.common.graph_view.normalize_page_name(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"nodes","nodes",-2099585805),nodes__$1,new cljs.core.Keyword(null,"links","links",-654507394),links], null));
} else {
return null;
}
});
frontend.common.graph_view.build_graph = (function frontend$common$graph_view$build_graph(db,opts){
var G__62504 = new cljs.core.Keyword(null,"type","type",1174270348).cljs$core$IFn$_invoke$arity$1(opts);
var G__62504__$1 = (((G__62504 instanceof cljs.core.Keyword))?G__62504.fqn:null);
switch (G__62504__$1) {
case "global":
return frontend.common.graph_view.build_global_graph(db,opts);

break;
case "block":
return frontend.common.graph_view.build_block_graph(db,new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(opts),new cljs.core.Keyword(null,"theme","theme",-1247880880).cljs$core$IFn$_invoke$arity$1(opts));

break;
case "page":
return frontend.common.graph_view.build_page_graph(db,new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(opts),new cljs.core.Keyword(null,"theme","theme",-1247880880).cljs$core$IFn$_invoke$arity$1(opts),new cljs.core.Keyword(null,"show-journal?","show-journal?",-2077862361).cljs$core$IFn$_invoke$arity$1(opts));

break;
default:
throw (new Error(["No matching clause: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(G__62504__$1)].join('')));

}
});

//# sourceMappingURL=frontend.common.graph_view.js.map
