goog.provide('frontend.components.file_based.hierarchy');
/**
 * Get all parent pages along the namespace hierarchy path.
 * If there're aliases, only use the first namespaced alias.
 */
frontend.components.file_based.hierarchy.get_relation = (function frontend$components$file_based$hierarchy$get_relation(page){
var temp__5804__auto__ = (function (){var or__5002__auto__ = logseq.graph_parser.text.get_nested_page_name(page);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return page;
}
})();
if(cljs.core.truth_(temp__5804__auto__)){
var page__$1 = temp__5804__auto__;
var repo = frontend.state.get_current_repo();
var page_entity = (frontend.db.get_page.cljs$core$IFn$_invoke$arity$1 ? frontend.db.get_page.cljs$core$IFn$_invoke$arity$1(page__$1) : frontend.db.get_page.call(null,page__$1));
var aliases = (function (){var temp__5804__auto____$1 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(page_entity);
if(cljs.core.truth_(temp__5804__auto____$1)){
var page_id = temp__5804__auto____$1;
return (frontend.db.get_page_alias_names.cljs$core$IFn$_invoke$arity$2 ? frontend.db.get_page_alias_names.cljs$core$IFn$_invoke$arity$2(repo,page_id) : frontend.db.get_page_alias_names.call(null,repo,page_id));
} else {
return null;
}
})();
var all_page_names = cljs.core.conj.cljs$core$IFn$_invoke$arity$2(aliases,page__$1);
var temp__5804__auto____$1 = (function (){var or__5002__auto__ = cljs.core.first(cljs.core.filter.cljs$core$IFn$_invoke$arity$2(logseq.graph_parser.text.namespace_page_QMARK_,all_page_names));
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
if(cljs.core.truth_(new cljs.core.Keyword("block","_namespace","block/_namespace",1151541806).cljs$core$IFn$_invoke$arity$1((function (){var G__133273 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","name","block/name",1619760316),(frontend.util.page_name_sanity_lc.cljs$core$IFn$_invoke$arity$1 ? frontend.util.page_name_sanity_lc.cljs$core$IFn$_invoke$arity$1(page__$1) : frontend.util.page_name_sanity_lc.call(null,page__$1))], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__133273) : frontend.db.entity.call(null,G__133273));
})()))){
return page__$1;
} else {
return null;
}
}
})();
if(cljs.core.truth_(temp__5804__auto____$1)){
var page__$2 = temp__5804__auto____$1;
var namespace_pages = frontend.db.file_based.model.get_namespace_pages(repo,page__$2);
var parent_routes = frontend.db.file_based.model.get_page_namespace_routes(repo,page__$2);
var pages = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__133267_SHARP_){
return clojure.string.split.cljs$core$IFn$_invoke$arity$2(p1__133267_SHARP_,"/");
}),cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (page__$3){
var or__5002__auto__ = new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(page__$3);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword("block","name","block/name",1619760316).cljs$core$IFn$_invoke$arity$1(page__$3);
}
}),cljs.core.sort_by.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","name","block/name",1619760316),cljs.core.distinct.cljs$core$IFn$_invoke$arity$1(cljs.core.concat.cljs$core$IFn$_invoke$arity$2(namespace_pages,parent_routes)))));
var page_namespace = frontend.db.file_based.model.get_page_namespace(repo,page__$2);
var page_namespace__$1 = (frontend.util.get_page_title.cljs$core$IFn$_invoke$arity$1 ? frontend.util.get_page_title.cljs$core$IFn$_invoke$arity$1(page_namespace) : frontend.util.get_page_title.call(null,page_namespace));
if(cljs.core.seq(pages)){
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"namespaces","namespaces",-1444157469),pages,new cljs.core.Keyword(null,"namespace-pages","namespace-pages",-1311364145),namespace_pages], null);
} else {
if(cljs.core.truth_(page_namespace__$1)){
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"namespaces","namespaces",-1444157469),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [clojure.string.split.cljs$core$IFn$_invoke$arity$2(page_namespace__$1,"/")], null),new cljs.core.Keyword(null,"namespace-pages","namespace-pages",-1311364145),namespace_pages], null);
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
});
frontend.components.file_based.hierarchy.structures = rum.core.lazy_build(rum.core.build_defc,(function (page){
var map__133366 = frontend.components.file_based.hierarchy.get_relation(page);
var map__133366__$1 = cljs.core.__destructure_map(map__133366);
var namespaces = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__133366__$1,new cljs.core.Keyword(null,"namespaces","namespaces",-1444157469));
if(cljs.core.seq(namespaces)){
return daiquiri.core.create_element("div",{'className':"page-hierarchy"},[frontend.ui.foldable(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"h2.font-bold.opacity-30","h2.font-bold.opacity-30",-1124529960),"Hierarchy"], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"ul.namespaces","ul.namespaces",-1394729042),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"margin","margin",-995903681),"12px 24px"], null)], null),(function (){var iter__5480__auto__ = (function frontend$components$file_based$hierarchy$iter__133425(s__133426){
return (new cljs.core.LazySeq(null,(function (){
var s__133426__$1 = s__133426;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__133426__$1);
if(temp__5804__auto__){
var s__133426__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__133426__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__133426__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__133428 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__133427 = (0);
while(true){
if((i__133427 < size__5479__auto__)){
var namespace = cljs.core._nth(c__5478__auto__,i__133427);
cljs.core.chunk_append(b__133428,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"li.my-2","li.my-2",-2007406172),cljs.core.interpose.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.mx-2.opacity-30","span.mx-2.opacity-30",541053943),"/"], null),(function (){var iter__5480__auto__ = ((function (i__133427,namespace,c__5478__auto__,size__5479__auto__,b__133428,s__133426__$2,temp__5804__auto__,map__133366,map__133366__$1,namespaces){
return (function frontend$components$file_based$hierarchy$iter__133425_$_iter__133435(s__133436){
return (new cljs.core.LazySeq(null,((function (i__133427,namespace,c__5478__auto__,size__5479__auto__,b__133428,s__133426__$2,temp__5804__auto__,map__133366,map__133366__$1,namespaces){
return (function (){
var s__133436__$1 = s__133436;
while(true){
var temp__5804__auto____$1 = cljs.core.seq(s__133436__$1);
if(temp__5804__auto____$1){
var s__133436__$2 = temp__5804__auto____$1;
if(cljs.core.chunked_seq_QMARK_(s__133436__$2)){
var c__5478__auto____$1 = cljs.core.chunk_first(s__133436__$2);
var size__5479__auto____$1 = cljs.core.count(c__5478__auto____$1);
var b__133438 = cljs.core.chunk_buffer(size__5479__auto____$1);
if((function (){var i__133437 = (0);
while(true){
if((i__133437 < size__5479__auto____$1)){
var vec__133442 = cljs.core._nth(c__5478__auto____$1,i__133437);
var idx = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__133442,(0),null);
var page__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__133442,(1),null);
cljs.core.chunk_append(b__133438,(cljs.core.truth_((function (){var and__5000__auto__ = typeof page__$1 === 'string';
if(and__5000__auto__){
return page__$1;
} else {
return and__5000__auto__;
}
})())?(function (){var full_page = (function (){var G__133449 = cljs.core.take.cljs$core$IFn$_invoke$arity$2((idx + (1)),namespace);
return (frontend.util.string_join_path.cljs$core$IFn$_invoke$arity$1 ? frontend.util.string_join_path.cljs$core$IFn$_invoke$arity$1(G__133449) : frontend.util.string_join_path.call(null,G__133449));
})();
return frontend.components.block.page_reference(cljs.core.PersistentArrayMap.EMPTY,full_page,page__$1);
})():null));

var G__133514 = (i__133437 + (1));
i__133437 = G__133514;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__133438),frontend$components$file_based$hierarchy$iter__133425_$_iter__133435(cljs.core.chunk_rest(s__133436__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__133438),null);
}
} else {
var vec__133454 = cljs.core.first(s__133436__$2);
var idx = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__133454,(0),null);
var page__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__133454,(1),null);
return cljs.core.cons((cljs.core.truth_((function (){var and__5000__auto__ = typeof page__$1 === 'string';
if(and__5000__auto__){
return page__$1;
} else {
return and__5000__auto__;
}
})())?(function (){var full_page = (function (){var G__133458 = cljs.core.take.cljs$core$IFn$_invoke$arity$2((idx + (1)),namespace);
return (frontend.util.string_join_path.cljs$core$IFn$_invoke$arity$1 ? frontend.util.string_join_path.cljs$core$IFn$_invoke$arity$1(G__133458) : frontend.util.string_join_path.call(null,G__133458));
})();
return frontend.components.block.page_reference(cljs.core.PersistentArrayMap.EMPTY,full_page,page__$1);
})():null),frontend$components$file_based$hierarchy$iter__133425_$_iter__133435(cljs.core.rest(s__133436__$2)));
}
} else {
return null;
}
break;
}
});})(i__133427,namespace,c__5478__auto__,size__5479__auto__,b__133428,s__133426__$2,temp__5804__auto__,map__133366,map__133366__$1,namespaces))
,null,null));
});})(i__133427,namespace,c__5478__auto__,size__5479__auto__,b__133428,s__133426__$2,temp__5804__auto__,map__133366,map__133366__$1,namespaces))
;
return iter__5480__auto__(medley.core.indexed.cljs$core$IFn$_invoke$arity$1(namespace));
})())], null));

var G__133519 = (i__133427 + (1));
i__133427 = G__133519;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__133428),frontend$components$file_based$hierarchy$iter__133425(cljs.core.chunk_rest(s__133426__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__133428),null);
}
} else {
var namespace = cljs.core.first(s__133426__$2);
return cljs.core.cons(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"li.my-2","li.my-2",-2007406172),cljs.core.interpose.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.mx-2.opacity-30","span.mx-2.opacity-30",541053943),"/"], null),(function (){var iter__5480__auto__ = ((function (namespace,s__133426__$2,temp__5804__auto__,map__133366,map__133366__$1,namespaces){
return (function frontend$components$file_based$hierarchy$iter__133425_$_iter__133464(s__133465){
return (new cljs.core.LazySeq(null,(function (){
var s__133465__$1 = s__133465;
while(true){
var temp__5804__auto____$1 = cljs.core.seq(s__133465__$1);
if(temp__5804__auto____$1){
var s__133465__$2 = temp__5804__auto____$1;
if(cljs.core.chunked_seq_QMARK_(s__133465__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__133465__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__133467 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__133466 = (0);
while(true){
if((i__133466 < size__5479__auto__)){
var vec__133470 = cljs.core._nth(c__5478__auto__,i__133466);
var idx = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__133470,(0),null);
var page__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__133470,(1),null);
cljs.core.chunk_append(b__133467,(cljs.core.truth_((function (){var and__5000__auto__ = typeof page__$1 === 'string';
if(and__5000__auto__){
return page__$1;
} else {
return and__5000__auto__;
}
})())?(function (){var full_page = (function (){var G__133474 = cljs.core.take.cljs$core$IFn$_invoke$arity$2((idx + (1)),namespace);
return (frontend.util.string_join_path.cljs$core$IFn$_invoke$arity$1 ? frontend.util.string_join_path.cljs$core$IFn$_invoke$arity$1(G__133474) : frontend.util.string_join_path.call(null,G__133474));
})();
return frontend.components.block.page_reference(cljs.core.PersistentArrayMap.EMPTY,full_page,page__$1);
})():null));

var G__133522 = (i__133466 + (1));
i__133466 = G__133522;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__133467),frontend$components$file_based$hierarchy$iter__133425_$_iter__133464(cljs.core.chunk_rest(s__133465__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__133467),null);
}
} else {
var vec__133475 = cljs.core.first(s__133465__$2);
var idx = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__133475,(0),null);
var page__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__133475,(1),null);
return cljs.core.cons((cljs.core.truth_((function (){var and__5000__auto__ = typeof page__$1 === 'string';
if(and__5000__auto__){
return page__$1;
} else {
return and__5000__auto__;
}
})())?(function (){var full_page = (function (){var G__133481 = cljs.core.take.cljs$core$IFn$_invoke$arity$2((idx + (1)),namespace);
return (frontend.util.string_join_path.cljs$core$IFn$_invoke$arity$1 ? frontend.util.string_join_path.cljs$core$IFn$_invoke$arity$1(G__133481) : frontend.util.string_join_path.call(null,G__133481));
})();
return frontend.components.block.page_reference(cljs.core.PersistentArrayMap.EMPTY,full_page,page__$1);
})():null),frontend$components$file_based$hierarchy$iter__133425_$_iter__133464(cljs.core.rest(s__133465__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});})(namespace,s__133426__$2,temp__5804__auto__,map__133366,map__133366__$1,namespaces))
;
return iter__5480__auto__(medley.core.indexed.cljs$core$IFn$_invoke$arity$1(namespace));
})())], null),frontend$components$file_based$hierarchy$iter__133425(cljs.core.rest(s__133426__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(namespaces);
})()], null),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"default-collapsed?","default-collapsed?",-1350393823),false,new cljs.core.Keyword(null,"title-trigger?","title-trigger?",-613599873),true], null))]);
} else {
return null;
}
}),null,"frontend.components.file-based.hierarchy/structures");

//# sourceMappingURL=frontend.components.file_based.hierarchy.js.map
