goog.provide('frontend.components.cmdk.core');
goog.scope(function(){
  frontend.components.cmdk.core.goog$module$goog$object = goog.module.get('goog.object');
});
frontend.components.cmdk.core.translate = (function frontend$components$cmdk$core$translate(t,p__89893){
var map__89894 = p__89893;
var map__89894__$1 = cljs.core.__destructure_map(map__89894);
var id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__89894__$1,new cljs.core.Keyword(null,"id","id",-1388402092));
var desc = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__89894__$1,new cljs.core.Keyword(null,"desc","desc",2093485764));
if(cljs.core.truth_(id)){
var desc_i18n = (function (){var G__89896 = frontend.modules.shortcut.utils.decorate_namespace(id);
return (t.cljs$core$IFn$_invoke$arity$1 ? t.cljs$core$IFn$_invoke$arity$1(G__89896) : t.call(null,G__89896));
})();
if(clojure.string.starts_with_QMARK_(desc_i18n,"{Missing key")){
return desc;
} else {
return desc_i18n;
}
} else {
return null;
}
});
frontend.components.cmdk.core.get_group_limit = (function frontend$components$cmdk$core$get_group_limit(group){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(group,new cljs.core.Keyword(null,"nodes","nodes",-2099585805))){
return (10);
} else {
return (5);
}
});
frontend.components.cmdk.core.filters = (function frontend$components$cmdk$core$filters(){
var current_page = frontend.state.get_current_page();
return cljs.core.remove.cljs$core$IFn$_invoke$arity$2(cljs.core.nil_QMARK_,new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, [(cljs.core.truth_(current_page)?new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"filter","filter",-948537934),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"group","group",582596132),new cljs.core.Keyword(null,"current-page","current-page",-101294180)], null),new cljs.core.Keyword(null,"text","text",-1790561697),"Search only current page",new cljs.core.Keyword(null,"info","info",-317069002),"Add filter to search",new cljs.core.Keyword(null,"icon-theme","icon-theme",1771652151),new cljs.core.Keyword(null,"gray","gray",1013268388),new cljs.core.Keyword(null,"icon","icon",1679606541),"file"], null):null),new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"filter","filter",-948537934),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"group","group",582596132),new cljs.core.Keyword(null,"nodes","nodes",-2099585805)], null),new cljs.core.Keyword(null,"text","text",-1790561697),"Search only nodes",new cljs.core.Keyword(null,"info","info",-317069002),"Add filter to search",new cljs.core.Keyword(null,"icon-theme","icon-theme",1771652151),new cljs.core.Keyword(null,"gray","gray",1013268388),new cljs.core.Keyword(null,"icon","icon",1679606541),"letter-n"], null),new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"filter","filter",-948537934),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"group","group",582596132),new cljs.core.Keyword(null,"commands","commands",161008658)], null),new cljs.core.Keyword(null,"text","text",-1790561697),"Search only commands",new cljs.core.Keyword(null,"info","info",-317069002),"Add filter to search",new cljs.core.Keyword(null,"icon-theme","icon-theme",1771652151),new cljs.core.Keyword(null,"gray","gray",1013268388),new cljs.core.Keyword(null,"icon","icon",1679606541),"command"], null),new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"filter","filter",-948537934),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"group","group",582596132),new cljs.core.Keyword(null,"files","files",-472457450)], null),new cljs.core.Keyword(null,"text","text",-1790561697),"Search only files",new cljs.core.Keyword(null,"info","info",-317069002),"Add filter to search",new cljs.core.Keyword(null,"icon-theme","icon-theme",1771652151),new cljs.core.Keyword(null,"gray","gray",1013268388),new cljs.core.Keyword(null,"icon","icon",1679606541),"file"], null),new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"filter","filter",-948537934),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"group","group",582596132),new cljs.core.Keyword(null,"themes","themes",-702786642)], null),new cljs.core.Keyword(null,"text","text",-1790561697),"Search only themes",new cljs.core.Keyword(null,"info","info",-317069002),"Add filter to search",new cljs.core.Keyword(null,"icon-theme","icon-theme",1771652151),new cljs.core.Keyword(null,"gray","gray",1013268388),new cljs.core.Keyword(null,"icon","icon",1679606541),"palette"], null)], null));
});
frontend.components.cmdk.core.default_results = new cljs.core.PersistentArrayMap(null, 8, [new cljs.core.Keyword(null,"recently-updated-pages","recently-updated-pages",-1385487647),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"status","status",-1997798413),new cljs.core.Keyword(null,"success","success",1890645906),new cljs.core.Keyword(null,"show","show",-576705889),new cljs.core.Keyword(null,"less","less",-428869198),new cljs.core.Keyword(null,"items","items",1031954938),null], null),new cljs.core.Keyword(null,"commands","commands",161008658),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"status","status",-1997798413),new cljs.core.Keyword(null,"success","success",1890645906),new cljs.core.Keyword(null,"show","show",-576705889),new cljs.core.Keyword(null,"less","less",-428869198),new cljs.core.Keyword(null,"items","items",1031954938),null], null),new cljs.core.Keyword(null,"favorites","favorites",1740773480),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"status","status",-1997798413),new cljs.core.Keyword(null,"success","success",1890645906),new cljs.core.Keyword(null,"show","show",-576705889),new cljs.core.Keyword(null,"less","less",-428869198),new cljs.core.Keyword(null,"items","items",1031954938),null], null),new cljs.core.Keyword(null,"current-page","current-page",-101294180),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"status","status",-1997798413),new cljs.core.Keyword(null,"success","success",1890645906),new cljs.core.Keyword(null,"show","show",-576705889),new cljs.core.Keyword(null,"less","less",-428869198),new cljs.core.Keyword(null,"items","items",1031954938),null], null),new cljs.core.Keyword(null,"nodes","nodes",-2099585805),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"status","status",-1997798413),new cljs.core.Keyword(null,"success","success",1890645906),new cljs.core.Keyword(null,"show","show",-576705889),new cljs.core.Keyword(null,"less","less",-428869198),new cljs.core.Keyword(null,"items","items",1031954938),null], null),new cljs.core.Keyword(null,"files","files",-472457450),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"status","status",-1997798413),new cljs.core.Keyword(null,"success","success",1890645906),new cljs.core.Keyword(null,"show","show",-576705889),new cljs.core.Keyword(null,"less","less",-428869198),new cljs.core.Keyword(null,"items","items",1031954938),null], null),new cljs.core.Keyword(null,"themes","themes",-702786642),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"status","status",-1997798413),new cljs.core.Keyword(null,"success","success",1890645906),new cljs.core.Keyword(null,"show","show",-576705889),new cljs.core.Keyword(null,"less","less",-428869198),new cljs.core.Keyword(null,"items","items",1031954938),null], null),new cljs.core.Keyword(null,"filters","filters",974726919),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"status","status",-1997798413),new cljs.core.Keyword(null,"success","success",1890645906),new cljs.core.Keyword(null,"show","show",-576705889),new cljs.core.Keyword(null,"less","less",-428869198),new cljs.core.Keyword(null,"items","items",1031954938),null], null)], null);
frontend.components.cmdk.core.get_class_from_input = (function frontend$components$cmdk$core$get_class_from_input(input){
return clojure.string.replace(input,/^#+/,"");
});
frontend.components.cmdk.core.create_items = (function frontend$components$cmdk$core$create_items(q){
if((((!(clojure.string.blank_QMARK_(q)))) && (((cljs.core.not((function (){var fexpr__89903 = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 3, ["custom.js",null,"config.edn",null,"custom.css",null], null), null);
return (fexpr__89903.cljs$core$IFn$_invoke$arity$1 ? fexpr__89903.cljs$core$IFn$_invoke$arity$1(q) : fexpr__89903.call(null,q));
})())) && ((!(frontend.config.publishing_QMARK_))))))){
var class_QMARK_ = clojure.string.starts_with_QMARK_(q,"#");
return cljs.core.remove.cljs$core$IFn$_invoke$arity$2(cljs.core.nil_QMARK_,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"text","text",-1790561697),((class_QMARK_)?"Create tag":"Create page"),new cljs.core.Keyword(null,"icon","icon",1679606541),"new-page",new cljs.core.Keyword(null,"icon-theme","icon-theme",1771652151),new cljs.core.Keyword(null,"gray","gray",1013268388),new cljs.core.Keyword(null,"info","info",-317069002),((class_QMARK_)?["Create class called '",frontend.components.cmdk.core.get_class_from_input(q),"'"].join(''):["Create page called '",cljs.core.str.cljs$core$IFn$_invoke$arity$1(q),"'"].join('')),new cljs.core.Keyword(null,"source-create","source-create",-1664647972),new cljs.core.Keyword(null,"page","page",849072397)], null)], null));
} else {
return null;
}
});
frontend.components.cmdk.core.state__GT_results_ordered = (function frontend$components$cmdk$core$state__GT_results_ordered(state,search_mode){
var sidebar_QMARK_ = new cljs.core.Keyword(null,"sidebar?","sidebar?",-534999672).cljs$core$IFn$_invoke$arity$1(cljs.core.last(new cljs.core.Keyword("rum","args","rum/args",1315791754).cljs$core$IFn$_invoke$arity$1(state)));
var results = cljs.core.deref(new cljs.core.Keyword("frontend.components.cmdk.core","results","frontend.components.cmdk.core/results",-2086115969).cljs$core$IFn$_invoke$arity$1(state));
var input = cljs.core.deref(new cljs.core.Keyword("frontend.components.cmdk.core","input","frontend.components.cmdk.core/input",-1679319815).cljs$core$IFn$_invoke$arity$1(state));
var filter_SINGLEQUOTE_ = cljs.core.deref(new cljs.core.Keyword("frontend.components.cmdk.core","filter","frontend.components.cmdk.core/filter",279770674).cljs$core$IFn$_invoke$arity$1(state));
var filter_group = new cljs.core.Keyword(null,"group","group",582596132).cljs$core$IFn$_invoke$arity$1(filter_SINGLEQUOTE_);
var index = cljs.core.volatile_BANG_((-1));
var visible_items = (function (group){
var map__89905 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(results,group);
var map__89905__$1 = cljs.core.__destructure_map(map__89905);
var items = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__89905__$1,new cljs.core.Keyword(null,"items","items",1031954938));
var show = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__89905__$1,new cljs.core.Keyword(null,"show","show",-576705889));
if(cljs.core.truth_((function (){var or__5002__auto__ = sidebar_QMARK_;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(group,filter_group);
}
})())){
return items;
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"more","more",-2058821800),show)){
return items;
} else {
return cljs.core.take.cljs$core$IFn$_invoke$arity$2(frontend.components.cmdk.core.get_group_limit(group),items);

}
}
});
var node_exists_QMARK_ = (function (){var blocks_result = cljs.core.keep.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"source-block","source-block",-878290804),cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(results,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"nodes","nodes",-2099585805),new cljs.core.Keyword(null,"items","items",1031954938)], null)));
if(clojure.string.blank_QMARK_(input)){
return null;
} else {
var or__5002__auto__ = (function (){var page = (function (){var G__89906 = (logseq.graph_parser.text.get_namespace_last_part.cljs$core$IFn$_invoke$arity$1 ? logseq.graph_parser.text.get_namespace_last_part.cljs$core$IFn$_invoke$arity$1(input) : logseq.graph_parser.text.get_namespace_last_part.call(null,input));
var G__89906__$1 = (((G__89906 == null))?null:clojure.string.trim(G__89906));
if((G__89906__$1 == null)){
return null;
} else {
return (frontend.db.get_page.cljs$core$IFn$_invoke$arity$1 ? frontend.db.get_page.cljs$core$IFn$_invoke$arity$1(G__89906__$1) : frontend.db.get_page.call(null,G__89906__$1));
}
})();
var parent_title = new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("logseq.property","parent","logseq.property/parent",177984509).cljs$core$IFn$_invoke$arity$1(page));
var namespace_QMARK_ = clojure.string.includes_QMARK_(input,"/");
var and__5000__auto__ = page;
if(cljs.core.truth_(and__5000__auto__)){
var or__5002__auto__ = (!(namespace_QMARK_));
if(or__5002__auto__){
return or__5002__auto__;
} else {
var and__5000__auto____$1 = parent_title;
if(cljs.core.truth_(and__5000__auto____$1)){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2((frontend.util.page_name_sanity_lc.cljs$core$IFn$_invoke$arity$1 ? frontend.util.page_name_sanity_lc.cljs$core$IFn$_invoke$arity$1(parent_title) : frontend.util.page_name_sanity_lc.call(null,parent_title)),(function (){var G__89907 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.reverse(clojure.string.split.cljs$core$IFn$_invoke$arity$2(input,"/")),(1));
return (frontend.util.page_name_sanity_lc.cljs$core$IFn$_invoke$arity$1 ? frontend.util.page_name_sanity_lc.cljs$core$IFn$_invoke$arity$1(G__89907) : frontend.util.page_name_sanity_lc.call(null,G__89907));
})());
} else {
return and__5000__auto____$1;
}
}
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.some((function (block){
var and__5000__auto__ = new cljs.core.Keyword("block","tags","block/tags",1814948340).cljs$core$IFn$_invoke$arity$1(block);
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(input,(function (){var G__89908 = new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(block);
return (frontend.util.page_name_sanity_lc.cljs$core$IFn$_invoke$arity$1 ? frontend.util.page_name_sanity_lc.cljs$core$IFn$_invoke$arity$1(G__89908) : frontend.util.page_name_sanity_lc.call(null,G__89908));
})());
} else {
return and__5000__auto__;
}
}),blocks_result);
}
}
})();
var include_slash_QMARK_ = ((clojure.string.includes_QMARK_(input,"/")) || (clojure.string.starts_with_QMARK_(input,"/")));
var order_STAR_ = ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(search_mode,new cljs.core.Keyword(null,"graph","graph",1558099509)))?cljs.core.PersistentVector.EMPTY:((include_slash_QMARK_)?new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, [(cljs.core.truth_(node_exists_QMARK_)?null:new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["Create",new cljs.core.Keyword(null,"create","create",-1301499256),frontend.components.cmdk.core.create_items(input)], null)),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["Current page",new cljs.core.Keyword(null,"current-page","current-page",-101294180),visible_items(new cljs.core.Keyword(null,"current-page","current-page",-101294180))], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["Nodes",new cljs.core.Keyword(null,"nodes","nodes",-2099585805),visible_items(new cljs.core.Keyword(null,"nodes","nodes",-2099585805))], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["Files",new cljs.core.Keyword(null,"files","files",-472457450),visible_items(new cljs.core.Keyword(null,"files","files",-472457450))], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["Filters",new cljs.core.Keyword(null,"filters","filters",974726919),visible_items(new cljs.core.Keyword(null,"filters","filters",974726919))], null)], null):(cljs.core.truth_(filter_group)?new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(filter_group,new cljs.core.Keyword(null,"nodes","nodes",-2099585805)))?new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["Current page",new cljs.core.Keyword(null,"current-page","current-page",-101294180),visible_items(new cljs.core.Keyword(null,"current-page","current-page",-101294180))], null):null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(filter_group,new cljs.core.Keyword(null,"current-page","current-page",-101294180)))?"Current page":cljs.core.name(filter_group)),filter_group,visible_items(filter_group)], null),(cljs.core.truth_(node_exists_QMARK_)?null:new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["Create",new cljs.core.Keyword(null,"create","create",-1301499256),frontend.components.cmdk.core.create_items(input)], null))], null):cljs.core.remove.cljs$core$IFn$_invoke$arity$2(cljs.core.nil_QMARK_,new cljs.core.PersistentVector(null, 7, 5, cljs.core.PersistentVector.EMPTY_NODE, [(cljs.core.truth_(node_exists_QMARK_)?null:new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["Create",new cljs.core.Keyword(null,"create","create",-1301499256),frontend.components.cmdk.core.create_items(input)], null)),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["Current page",new cljs.core.Keyword(null,"current-page","current-page",-101294180),visible_items(new cljs.core.Keyword(null,"current-page","current-page",-101294180))], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["Nodes",new cljs.core.Keyword(null,"nodes","nodes",-2099585805),visible_items(new cljs.core.Keyword(null,"nodes","nodes",-2099585805))], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["Recently updated",new cljs.core.Keyword(null,"recently-updated-pages","recently-updated-pages",-1385487647),visible_items(new cljs.core.Keyword(null,"recently-updated-pages","recently-updated-pages",-1385487647))], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["Commands",new cljs.core.Keyword(null,"commands","commands",161008658),visible_items(new cljs.core.Keyword(null,"commands","commands",161008658))], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["Files",new cljs.core.Keyword(null,"files","files",-472457450),visible_items(new cljs.core.Keyword(null,"files","files",-472457450))], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["Filters",new cljs.core.Keyword(null,"filters","filters",974726919),visible_items(new cljs.core.Keyword(null,"filters","filters",974726919))], null)], null))
)));
var order = cljs.core.remove.cljs$core$IFn$_invoke$arity$2(cljs.core.nil_QMARK_,order_STAR_);
var iter__5480__auto__ = (function frontend$components$cmdk$core$state__GT_results_ordered_$_iter__89914(s__89915){
return (new cljs.core.LazySeq(null,(function (){
var s__89915__$1 = s__89915;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__89915__$1);
if(temp__5804__auto__){
var s__89915__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__89915__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__89915__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__89917 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__89916 = (0);
while(true){
if((i__89916 < size__5479__auto__)){
var vec__89920 = cljs.core._nth(c__5478__auto__,i__89916);
var group_name = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__89920,(0),null);
var group_key = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__89920,(1),null);
var group_items = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__89920,(2),null);
cljs.core.chunk_append(b__89917,new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [group_name,group_key,((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(group_key,new cljs.core.Keyword(null,"create","create",-1301499256)))?cljs.core.count(group_items):cljs.core.count(cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(results,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [group_key,new cljs.core.Keyword(null,"items","items",1031954938)], null)))),cljs.core.mapv.cljs$core$IFn$_invoke$arity$2(((function (i__89916,vec__89920,group_name,group_key,group_items,c__5478__auto__,size__5479__auto__,b__89917,s__89915__$2,temp__5804__auto__,sidebar_QMARK_,results,input,filter_SINGLEQUOTE_,filter_group,index,visible_items,node_exists_QMARK_,include_slash_QMARK_,order_STAR_,order){
return (function (p1__89904_SHARP_){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(p1__89904_SHARP_,new cljs.core.Keyword(null,"item-index","item-index",411110314),index.cljs$core$IVolatile$_vreset_BANG_$arity$2(null,(index.cljs$core$IDeref$_deref$arity$1(null) + (1))));
});})(i__89916,vec__89920,group_name,group_key,group_items,c__5478__auto__,size__5479__auto__,b__89917,s__89915__$2,temp__5804__auto__,sidebar_QMARK_,results,input,filter_SINGLEQUOTE_,filter_group,index,visible_items,node_exists_QMARK_,include_slash_QMARK_,order_STAR_,order))
,group_items)], null));

var G__90228 = (i__89916 + (1));
i__89916 = G__90228;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__89917),frontend$components$cmdk$core$state__GT_results_ordered_$_iter__89914(cljs.core.chunk_rest(s__89915__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__89917),null);
}
} else {
var vec__89925 = cljs.core.first(s__89915__$2);
var group_name = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__89925,(0),null);
var group_key = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__89925,(1),null);
var group_items = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__89925,(2),null);
return cljs.core.cons(new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [group_name,group_key,((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(group_key,new cljs.core.Keyword(null,"create","create",-1301499256)))?cljs.core.count(group_items):cljs.core.count(cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(results,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [group_key,new cljs.core.Keyword(null,"items","items",1031954938)], null)))),cljs.core.mapv.cljs$core$IFn$_invoke$arity$2(((function (vec__89925,group_name,group_key,group_items,s__89915__$2,temp__5804__auto__,sidebar_QMARK_,results,input,filter_SINGLEQUOTE_,filter_group,index,visible_items,node_exists_QMARK_,include_slash_QMARK_,order_STAR_,order){
return (function (p1__89904_SHARP_){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(p1__89904_SHARP_,new cljs.core.Keyword(null,"item-index","item-index",411110314),index.cljs$core$IVolatile$_vreset_BANG_$arity$2(null,(index.cljs$core$IDeref$_deref$arity$1(null) + (1))));
});})(vec__89925,group_name,group_key,group_items,s__89915__$2,temp__5804__auto__,sidebar_QMARK_,results,input,filter_SINGLEQUOTE_,filter_group,index,visible_items,node_exists_QMARK_,include_slash_QMARK_,order_STAR_,order))
,group_items)], null),frontend$components$cmdk$core$state__GT_results_ordered_$_iter__89914(cljs.core.rest(s__89915__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(order);
});
frontend.components.cmdk.core.state__GT_highlighted_item = (function frontend$components$cmdk$core$state__GT_highlighted_item(state){
var or__5002__auto__ = (function (){var G__89928 = state;
var G__89928__$1 = (((G__89928 == null))?null:new cljs.core.Keyword("frontend.components.cmdk.core","highlighted-item","frontend.components.cmdk.core/highlighted-item",-2037503100).cljs$core$IFn$_invoke$arity$1(G__89928));
if((G__89928__$1 == null)){
return null;
} else {
return cljs.core.deref(G__89928__$1);
}
})();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var G__89929 = frontend.components.cmdk.core.state__GT_results_ordered(state,new cljs.core.Keyword("search","mode","search/mode",1628111395).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state)));
var G__89929__$1 = (((G__89929 == null))?null:cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic(cljs.core.last,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([G__89929], 0)));
if((G__89929__$1 == null)){
return null;
} else {
return cljs.core.first(G__89929__$1);
}
}
});
frontend.components.cmdk.core.state__GT_action = (function frontend$components$cmdk$core$state__GT_action(state){
var highlighted_item = frontend.components.cmdk.core.state__GT_highlighted_item(state);
if(cljs.core.truth_(new cljs.core.Keyword(null,"source-page","source-page",1338615502).cljs$core$IFn$_invoke$arity$1(highlighted_item))){
return new cljs.core.Keyword(null,"open","open",-1763596448);
} else {
if(cljs.core.truth_(new cljs.core.Keyword(null,"source-block","source-block",-878290804).cljs$core$IFn$_invoke$arity$1(highlighted_item))){
return new cljs.core.Keyword(null,"open","open",-1763596448);
} else {
if(cljs.core.truth_(new cljs.core.Keyword(null,"file-path","file-path",-2005501162).cljs$core$IFn$_invoke$arity$1(highlighted_item))){
return new cljs.core.Keyword(null,"open","open",-1763596448);
} else {
if(cljs.core.truth_(new cljs.core.Keyword(null,"source-search","source-search",-401166475).cljs$core$IFn$_invoke$arity$1(highlighted_item))){
return new cljs.core.Keyword(null,"search","search",1564939822);
} else {
if(cljs.core.truth_(new cljs.core.Keyword(null,"source-command","source-command",969630731).cljs$core$IFn$_invoke$arity$1(highlighted_item))){
return new cljs.core.Keyword(null,"trigger","trigger",103466139);
} else {
if(cljs.core.truth_(new cljs.core.Keyword(null,"source-create","source-create",-1664647972).cljs$core$IFn$_invoke$arity$1(highlighted_item))){
return new cljs.core.Keyword(null,"create","create",-1301499256);
} else {
if(cljs.core.truth_(new cljs.core.Keyword(null,"filter","filter",-948537934).cljs$core$IFn$_invoke$arity$1(highlighted_item))){
return new cljs.core.Keyword(null,"filter","filter",-948537934);
} else {
if(cljs.core.truth_(new cljs.core.Keyword(null,"source-theme","source-theme",984403400).cljs$core$IFn$_invoke$arity$1(highlighted_item))){
return new cljs.core.Keyword(null,"theme","theme",-1247880880);
} else {
return null;

}
}
}
}
}
}
}
}
});
if((typeof frontend !== 'undefined') && (typeof frontend.components !== 'undefined') && (typeof frontend.components.cmdk !== 'undefined') && (typeof frontend.components.cmdk.core !== 'undefined') && (typeof frontend.components.cmdk.core.load_results !== 'undefined')){
} else {
frontend.components.cmdk.core.load_results = (function (){var method_table__5599__auto__ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
var prefer_table__5600__auto__ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
var method_cache__5601__auto__ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
var cached_hierarchy__5602__auto__ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
var hierarchy__5603__auto__ = cljs.core.get.cljs$core$IFn$_invoke$arity$3(cljs.core.PersistentArrayMap.EMPTY,new cljs.core.Keyword(null,"hierarchy","hierarchy",-1053470341),(function (){var fexpr__89930 = cljs.core.get_global_hierarchy;
return (fexpr__89930.cljs$core$IFn$_invoke$arity$0 ? fexpr__89930.cljs$core$IFn$_invoke$arity$0() : fexpr__89930.call(null));
})());
return (new cljs.core.MultiFn(cljs.core.symbol.cljs$core$IFn$_invoke$arity$2("frontend.components.cmdk.core","load-results"),(function (group,_state){
return group;
}),new cljs.core.Keyword(null,"default","default",-1987822328),hierarchy__5603__auto__,method_table__5599__auto__,prefer_table__5600__auto__,method_cache__5601__auto__,cached_hierarchy__5602__auto__));
})();
}
frontend.components.cmdk.core.get_page_icon = (function frontend$components$cmdk$core$get_page_icon(entity){
if(cljs.core.truth_((logseq.db.class_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.class_QMARK_.cljs$core$IFn$_invoke$arity$1(entity) : logseq.db.class_QMARK_.call(null,entity)))){
return "hash";
} else {
if(cljs.core.truth_((logseq.db.property_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.property_QMARK_.cljs$core$IFn$_invoke$arity$1(entity) : logseq.db.property_QMARK_.call(null,entity)))){
return "letter-p";
} else {
if(cljs.core.truth_((logseq.db.whiteboard_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.whiteboard_QMARK_.cljs$core$IFn$_invoke$arity$1(entity) : logseq.db.whiteboard_QMARK_.call(null,entity)))){
return "writing";
} else {
return "file";

}
}
}
});
frontend.components.cmdk.core.load_results.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"initial","initial",1854648214),(function (_,state){
var temp__5804__auto__ = (frontend.db.get_db.cljs$core$IFn$_invoke$arity$0 ? frontend.db.get_db.cljs$core$IFn$_invoke$arity$0() : frontend.db.get_db.call(null));
if(cljs.core.truth_(temp__5804__auto__)){
var db = temp__5804__auto__;
var _BANG_results = new cljs.core.Keyword("frontend.components.cmdk.core","results","frontend.components.cmdk.core/results",-2086115969).cljs$core$IFn$_invoke$arity$1(state);
var recent_pages = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (block){
var text = frontend.handler.block.block_unique_title(block);
var icon = frontend.components.cmdk.core.get_page_icon(block);
return new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"icon","icon",1679606541),icon,new cljs.core.Keyword(null,"icon-theme","icon-theme",1771652151),new cljs.core.Keyword(null,"gray","gray",1013268388),new cljs.core.Keyword(null,"text","text",-1790561697),text,new cljs.core.Keyword(null,"source-block","source-block",-878290804),block], null);
}),(logseq.db.get_recent_updated_pages.cljs$core$IFn$_invoke$arity$1 ? logseq.db.get_recent_updated_pages.cljs$core$IFn$_invoke$arity$1(db) : logseq.db.get_recent_updated_pages.call(null,db)));
return cljs.core.reset_BANG_(_BANG_results,cljs.core.assoc_in(frontend.components.cmdk.core.default_results,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"recently-updated-pages","recently-updated-pages",-1385487647),new cljs.core.Keyword(null,"items","items",1031954938)], null),recent_pages));
} else {
return null;
}
}));
frontend.components.cmdk.core.load_results.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"commands","commands",161008658),(function (group,state){
var _BANG_input = new cljs.core.Keyword("frontend.components.cmdk.core","input","frontend.components.cmdk.core/input",-1679319815).cljs$core$IFn$_invoke$arity$1(state);
var _BANG_results = new cljs.core.Keyword("frontend.components.cmdk.core","results","frontend.components.cmdk.core/results",-2086115969).cljs$core$IFn$_invoke$arity$1(state);
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(_BANG_results,cljs.core.assoc_in,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [group,new cljs.core.Keyword(null,"status","status",-1997798413)], null),new cljs.core.Keyword(null,"loading","loading",-737050189));

var commands = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__89931_SHARP_){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(p1__89931_SHARP_,new cljs.core.Keyword(null,"t","t",-1397832519),frontend.components.cmdk.core.translate(frontend.context.i18n.t,p1__89931_SHARP_));
}),frontend.handler.command_palette.top_commands((1000)));
var search_results = ((clojure.string.blank_QMARK_(cljs.core.deref(_BANG_input)))?commands:(function (){var G__89933 = commands;
var G__89934 = cljs.core.deref(_BANG_input);
var G__89935 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"extract-fn","extract-fn",-339752723),new cljs.core.Keyword(null,"t","t",-1397832519)], null);
return (frontend.search.fuzzy_search.cljs$core$IFn$_invoke$arity$3 ? frontend.search.fuzzy_search.cljs$core$IFn$_invoke$arity$3(G__89933,G__89934,G__89935) : frontend.search.fuzzy_search.call(null,G__89933,G__89934,G__89935));
})());
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$variadic(_BANG_results,cljs.core.update,group,cljs.core.merge,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.PersistentHashMap.fromArrays([new cljs.core.Keyword(null,"status","status",-1997798413),new cljs.core.Keyword(null,"items","items",1031954938)],[new cljs.core.Keyword(null,"success","success",1890645906),cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__89932_SHARP_){
return cljs.core.PersistentHashMap.fromArrays([new cljs.core.Keyword(null,"icon","icon",1679606541),new cljs.core.Keyword(null,"icon-theme","icon-theme",1771652151),new cljs.core.Keyword(null,"text","text",-1790561697),new cljs.core.Keyword(null,"shortcut","shortcut",-431647697),new cljs.core.Keyword(null,"source-command","source-command",969630731)],["command",new cljs.core.Keyword(null,"gray","gray",1013268388),frontend.components.cmdk.core.translate(frontend.context.i18n.t,p1__89932_SHARP_),new cljs.core.Keyword(null,"shortcut","shortcut",-431647697).cljs$core$IFn$_invoke$arity$1(p1__89932_SHARP_),p1__89932_SHARP_]);
}),search_results)])], 0));
}));
frontend.components.cmdk.core.load_results.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"recently-updated-pages","recently-updated-pages",-1385487647),(function (group,state){
var _BANG_input = new cljs.core.Keyword("frontend.components.cmdk.core","input","frontend.components.cmdk.core/input",-1679319815).cljs$core$IFn$_invoke$arity$1(state);
var _BANG_results = new cljs.core.Keyword("frontend.components.cmdk.core","results","frontend.components.cmdk.core/results",-2086115969).cljs$core$IFn$_invoke$arity$1(state);
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(_BANG_results,cljs.core.assoc_in,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [group,new cljs.core.Keyword(null,"status","status",-1997798413)], null),new cljs.core.Keyword(null,"loading","loading",-737050189));

var recent_pages = (function (){var G__89936 = (frontend.db.get_db.cljs$core$IFn$_invoke$arity$0 ? frontend.db.get_db.cljs$core$IFn$_invoke$arity$0() : frontend.db.get_db.call(null));
return (logseq.db.get_recent_updated_pages.cljs$core$IFn$_invoke$arity$1 ? logseq.db.get_recent_updated_pages.cljs$core$IFn$_invoke$arity$1(G__89936) : logseq.db.get_recent_updated_pages.call(null,G__89936));
})();
var search_results = ((clojure.string.blank_QMARK_(cljs.core.deref(_BANG_input)))?recent_pages:(function (){var G__89937 = recent_pages;
var G__89938 = cljs.core.deref(_BANG_input);
var G__89939 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"extract-fn","extract-fn",-339752723),new cljs.core.Keyword("block","title","block/title",710445684)], null);
return (frontend.search.fuzzy_search.cljs$core$IFn$_invoke$arity$3 ? frontend.search.fuzzy_search.cljs$core$IFn$_invoke$arity$3(G__89937,G__89938,G__89939) : frontend.search.fuzzy_search.call(null,G__89937,G__89938,G__89939));
})());
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$variadic(_BANG_results,cljs.core.update,group,cljs.core.merge,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.PersistentHashMap.fromArrays([new cljs.core.Keyword(null,"status","status",-1997798413),new cljs.core.Keyword(null,"items","items",1031954938)],[new cljs.core.Keyword(null,"success","success",1890645906),cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (block){
var text = frontend.handler.block.block_unique_title(block);
var icon = frontend.components.cmdk.core.get_page_icon(block);
return new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"icon","icon",1679606541),icon,new cljs.core.Keyword(null,"icon-theme","icon-theme",1771652151),new cljs.core.Keyword(null,"gray","gray",1013268388),new cljs.core.Keyword(null,"text","text",-1790561697),text,new cljs.core.Keyword(null,"source-block","source-block",-878290804),block], null);
}),search_results)])], 0));
}));
/**
 * Return hiccup of highlighted content FTS result
 */
frontend.components.cmdk.core.highlight_content_query = (function frontend$components$cmdk$core$highlight_content_query(content,q){
if(((clojure.string.blank_QMARK_(content)) || (clojure.string.blank_QMARK_(q)))){
return null;
} else {
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),(function (){var content__$1 = content;
var result = cljs.core.PersistentVector.EMPTY;
while(true){
var vec__89944 = frontend.util.text.cut_by(content__$1,"$pfts_2lqh>$","$<pfts_2lqh$");
var b_cut = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__89944,(0),null);
var hl_cut = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__89944,(1),null);
var e_cut = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__89944,(2),null);
var hiccups_add = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span","span",1394872991),b_cut], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"mark.p-0.rounded-none","mark.p-0.rounded-none",-1487431150),hl_cut], null)], null);
var hiccups_add__$1 = cljs.core.remove.cljs$core$IFn$_invoke$arity$2(cljs.core.nil_QMARK_,hiccups_add);
var new_result = cljs.core.concat.cljs$core$IFn$_invoke$arity$2(result,hiccups_add__$1);
if((!(clojure.string.blank_QMARK_(e_cut)))){
var G__90230 = e_cut;
var G__90231 = new_result;
content__$1 = G__90230;
result = G__90231;
continue;
} else {
return new_result;
}
break;
}
})()], null);
}
});
frontend.components.cmdk.core.page_item = (function frontend$components$cmdk$core$page_item(repo,page){
var entity = (function (){var G__89949 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(page)], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__89949) : frontend.db.entity.call(null,G__89949));
})();
var source_page = frontend.db.model.get_alias_source_page(repo,new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(entity));
var icon = frontend.components.cmdk.core.get_page_icon(entity);
var title = frontend.handler.block.block_unique_title(page);
var title_SINGLEQUOTE_ = (cljs.core.truth_(source_page)?[cljs.core.str.cljs$core$IFn$_invoke$arity$1(title)," -> alias: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(source_page))].join(''):title);
return cljs.core.PersistentHashMap.fromArrays([new cljs.core.Keyword(null,"icon","icon",1679606541),new cljs.core.Keyword(null,"icon-theme","icon-theme",1771652151),new cljs.core.Keyword(null,"text","text",-1790561697),new cljs.core.Keyword(null,"source-page","source-page",1338615502)],[icon,new cljs.core.Keyword(null,"gray","gray",1013268388),title_SINGLEQUOTE_,(function (){var or__5002__auto__ = source_page;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return page;
}
})()]);
});
frontend.components.cmdk.core.block_item = (function frontend$components$cmdk$core$block_item(repo,block,current_page,input){
var id = new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block);
var text = frontend.handler.block.block_unique_title(block);
return new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"text","text",-1790561697),frontend.components.cmdk.core.highlight_content_query(text,input),new cljs.core.Keyword(null,"header","header",119441134),(cljs.core.truth_((frontend.db.page_QMARK_.cljs$core$IFn$_invoke$arity$1 ? frontend.db.page_QMARK_.cljs$core$IFn$_invoke$arity$1(block) : frontend.db.page_QMARK_.call(null,block)))?null:frontend.components.block.breadcrumb(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"search?","search?",785472524),true], null),repo,id,cljs.core.PersistentArrayMap.EMPTY)),new cljs.core.Keyword(null,"current-page?","current-page?",-1491305079),(function (){var temp__5804__auto__ = new cljs.core.Keyword("block","page","block/page",822314108).cljs$core$IFn$_invoke$arity$1(block);
if(cljs.core.truth_(temp__5804__auto__)){
var page_id = temp__5804__auto__;
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(page_id,new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(current_page));
} else {
return null;
}
})(),new cljs.core.Keyword(null,"source-block","source-block",-878290804),block], null);
});
frontend.components.cmdk.core.load_results.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"nodes","nodes",-2099585805),(function (group,state){
var _BANG_input = new cljs.core.Keyword("frontend.components.cmdk.core","input","frontend.components.cmdk.core/input",-1679319815).cljs$core$IFn$_invoke$arity$1(state);
var _BANG_results = new cljs.core.Keyword("frontend.components.cmdk.core","results","frontend.components.cmdk.core/results",-2086115969).cljs$core$IFn$_invoke$arity$1(state);
var repo = frontend.state.get_current_repo();
var current_page = (function (){var temp__5804__auto__ = frontend.util.page.get_current_page_id();
if(cljs.core.truth_(temp__5804__auto__)){
var id = temp__5804__auto__;
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(id) : frontend.db.entity.call(null,id));
} else {
return null;
}
})();
var opts = new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"limit","limit",-1355822363),(100),new cljs.core.Keyword(null,"dev?","dev?",-613971064),frontend.config.dev_QMARK_,new cljs.core.Keyword(null,"built-in?","built-in?",2078421512),true], null);
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(_BANG_results,cljs.core.assoc_in,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [group,new cljs.core.Keyword(null,"status","status",-1997798413)], null),new cljs.core.Keyword(null,"loading","loading",-737050189));

cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(_BANG_results,cljs.core.assoc_in,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"current-page","current-page",-101294180),new cljs.core.Keyword(null,"status","status",-1997798413)], null),new cljs.core.Keyword(null,"loading","loading",-737050189));

return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.search.block_search(repo,cljs.core.deref(_BANG_input),opts)),(function (blocks){
return promesa.protocols._mcat(promesa.protocols._promise(cljs.core.remove.cljs$core$IFn$_invoke$arity$2(cljs.core.nil_QMARK_,blocks)),(function (blocks__$1){
return promesa.protocols._mcat(promesa.protocols._promise((function (){var G__89953 = blocks__$1;
var G__89954 = cljs.core.deref(_BANG_input);
var G__89955 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"limit","limit",-1355822363),(100),new cljs.core.Keyword(null,"extract-fn","extract-fn",-339752723),new cljs.core.Keyword("block","title","block/title",710445684)], null);
return (frontend.search.fuzzy_search.cljs$core$IFn$_invoke$arity$3 ? frontend.search.fuzzy_search.cljs$core$IFn$_invoke$arity$3(G__89953,G__89954,G__89955) : frontend.search.fuzzy_search.call(null,G__89953,G__89954,G__89955));
})()),(function (blocks__$2){
return promesa.protocols._mcat(promesa.protocols._promise(cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (block){
if(cljs.core.truth_(new cljs.core.Keyword(null,"page?","page?",644039860).cljs$core$IFn$_invoke$arity$1(block))){
return frontend.components.cmdk.core.page_item(repo,block);
} else {
return frontend.components.cmdk.core.block_item(repo,block,current_page,cljs.core.deref(_BANG_input));
}
}),blocks__$2)),(function (items){
return promesa.protocols._promise(((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(group,new cljs.core.Keyword(null,"current-page","current-page",-101294180)))?(function (){var items_on_current_page = cljs.core.filter.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"current-page?","current-page?",-1491305079),items);
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$variadic(_BANG_results,cljs.core.update,group,cljs.core.merge,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"status","status",-1997798413),new cljs.core.Keyword(null,"success","success",1890645906),new cljs.core.Keyword(null,"items","items",1031954938),items_on_current_page], null)], 0));
})():cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$variadic(_BANG_results,cljs.core.update,group,cljs.core.merge,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"status","status",-1997798413),new cljs.core.Keyword(null,"success","success",1890645906),new cljs.core.Keyword(null,"items","items",1031954938),items], null)], 0))));
}));
}));
}));
}));
}));
}));
frontend.components.cmdk.core.load_results.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"files","files",-472457450),(function (group,state){
var _BANG_input = new cljs.core.Keyword("frontend.components.cmdk.core","input","frontend.components.cmdk.core/input",-1679319815).cljs$core$IFn$_invoke$arity$1(state);
var _BANG_results = new cljs.core.Keyword("frontend.components.cmdk.core","results","frontend.components.cmdk.core/results",-2086115969).cljs$core$IFn$_invoke$arity$1(state);
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(_BANG_results,cljs.core.assoc_in,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [group,new cljs.core.Keyword(null,"status","status",-1997798413)], null),new cljs.core.Keyword(null,"loading","loading",-737050189));

return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.search.file_search.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(_BANG_input),(99))),(function (files_STAR_){
return promesa.protocols._mcat(promesa.protocols._promise(cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (f){
var and__5000__auto__ = f;
if(cljs.core.truth_(and__5000__auto__)){
return ((clojure.string.ends_with_QMARK_(f,".edn")) && (((clojure.string.starts_with_QMARK_(f,"whiteboards/")) || (((clojure.string.starts_with_QMARK_(f,"assets/")) || (((clojure.string.starts_with_QMARK_(f,"logseq/version-files")) || (cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 3, ["logseq/metadata.edn",null,"logseq/pages-metadata.edn",null,"logseq/graphs-txid.edn",null], null), null),f)))))))));
} else {
return and__5000__auto__;
}
}),files_STAR_)),(function (files){
return promesa.protocols._mcat(promesa.protocols._promise(cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (file){
return cljs.core.PersistentHashMap.fromArrays([new cljs.core.Keyword(null,"icon","icon",1679606541),new cljs.core.Keyword(null,"icon-theme","icon-theme",1771652151),new cljs.core.Keyword(null,"text","text",-1790561697),new cljs.core.Keyword(null,"file-path","file-path",-2005501162)],["file",new cljs.core.Keyword(null,"gray","gray",1013268388),file,file]);
}),files)),(function (items){
return promesa.protocols._promise(cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$variadic(_BANG_results,cljs.core.update,group,cljs.core.merge,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"status","status",-1997798413),new cljs.core.Keyword(null,"success","success",1890645906),new cljs.core.Keyword(null,"items","items",1031954938),items], null)], 0)));
}));
}));
}));
}));
}));
frontend.components.cmdk.core.load_results.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"themes","themes",-702786642),(function (group,_state){
var _BANG_input = new cljs.core.Keyword("frontend.components.cmdk.core","input","frontend.components.cmdk.core/input",-1679319815).cljs$core$IFn$_invoke$arity$1(_state);
var _BANG_results = new cljs.core.Keyword("frontend.components.cmdk.core","results","frontend.components.cmdk.core/results",-2086115969).cljs$core$IFn$_invoke$arity$1(_state);
var themes = frontend.state.sub(new cljs.core.Keyword("plugin","installed-themes","plugin/installed-themes",1969555197));
var themes__$1 = ((clojure.string.blank_QMARK_(cljs.core.deref(_BANG_input)))?themes:(function (){var G__89956 = themes;
var G__89957 = cljs.core.deref(_BANG_input);
var G__89958 = new cljs.core.Keyword(null,"limit","limit",-1355822363);
var G__89959 = (100);
var G__89960 = new cljs.core.Keyword(null,"extract-fn","extract-fn",-339752723);
var G__89961 = new cljs.core.Keyword(null,"name","name",1843675177);
return (frontend.search.fuzzy_search.cljs$core$IFn$_invoke$arity$6 ? frontend.search.fuzzy_search.cljs$core$IFn$_invoke$arity$6(G__89956,G__89957,G__89958,G__89959,G__89960,G__89961) : frontend.search.fuzzy_search.call(null,G__89956,G__89957,G__89958,G__89959,G__89960,G__89961));
})());
var themes__$2 = cljs.core.cons(new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"name","name",1843675177),"Logseq Default theme",new cljs.core.Keyword(null,"pid","pid",1018387698),"logseq-classic-theme",new cljs.core.Keyword(null,"mode","mode",654403691),frontend.state.sub(new cljs.core.Keyword("ui","theme","ui/theme",-1247877132)),new cljs.core.Keyword(null,"url","url",276297046),null], null),themes__$1);
var selected = frontend.state.sub(new cljs.core.Keyword("plugin","selected-theme","plugin/selected-theme",-172679220));
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(_BANG_results,cljs.core.assoc_in,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [group,new cljs.core.Keyword(null,"status","status",-1997798413)], null),new cljs.core.Keyword(null,"loading","loading",-737050189));

var items = (function (){var iter__5480__auto__ = (function frontend$components$cmdk$core$iter__89962(s__89963){
return (new cljs.core.LazySeq(null,(function (){
var s__89963__$1 = s__89963;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__89963__$1);
if(temp__5804__auto__){
var s__89963__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__89963__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__89963__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__89965 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__89964 = (0);
while(true){
if((i__89964 < size__5479__auto__)){
var t = cljs.core._nth(c__5478__auto__,i__89964);
var selected_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"url","url",276297046).cljs$core$IFn$_invoke$arity$1(t),selected);
cljs.core.chunk_append(b__89965,new cljs.core.PersistentArrayMap(null, 6, [new cljs.core.Keyword(null,"icon-theme","icon-theme",1771652151),new cljs.core.Keyword(null,"gray","gray",1013268388),new cljs.core.Keyword(null,"text","text",-1790561697),new cljs.core.Keyword(null,"name","name",1843675177).cljs$core$IFn$_invoke$arity$1(t),new cljs.core.Keyword(null,"info","info",-317069002),[cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"mode","mode",654403691).cljs$core$IFn$_invoke$arity$1(t))," #",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"pid","pid",1018387698).cljs$core$IFn$_invoke$arity$1(t))].join(''),new cljs.core.Keyword(null,"icon","icon",1679606541),((selected_QMARK_)?"checkbox":"palette"),new cljs.core.Keyword(null,"source-theme","source-theme",984403400),t,new cljs.core.Keyword(null,"selected","selected",574897764),selected_QMARK_], null));

var G__90250 = (i__89964 + (1));
i__89964 = G__90250;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__89965),frontend$components$cmdk$core$iter__89962(cljs.core.chunk_rest(s__89963__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__89965),null);
}
} else {
var t = cljs.core.first(s__89963__$2);
var selected_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"url","url",276297046).cljs$core$IFn$_invoke$arity$1(t),selected);
return cljs.core.cons(new cljs.core.PersistentArrayMap(null, 6, [new cljs.core.Keyword(null,"icon-theme","icon-theme",1771652151),new cljs.core.Keyword(null,"gray","gray",1013268388),new cljs.core.Keyword(null,"text","text",-1790561697),new cljs.core.Keyword(null,"name","name",1843675177).cljs$core$IFn$_invoke$arity$1(t),new cljs.core.Keyword(null,"info","info",-317069002),[cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"mode","mode",654403691).cljs$core$IFn$_invoke$arity$1(t))," #",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"pid","pid",1018387698).cljs$core$IFn$_invoke$arity$1(t))].join(''),new cljs.core.Keyword(null,"icon","icon",1679606541),((selected_QMARK_)?"checkbox":"palette"),new cljs.core.Keyword(null,"source-theme","source-theme",984403400),t,new cljs.core.Keyword(null,"selected","selected",574897764),selected_QMARK_], null),frontend$components$cmdk$core$iter__89962(cljs.core.rest(s__89963__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(themes__$2);
})();
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$variadic(_BANG_results,cljs.core.update,group,cljs.core.merge,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"status","status",-1997798413),new cljs.core.Keyword(null,"success","success",1890645906),new cljs.core.Keyword(null,"items","items",1031954938),items], null)], 0));
}));
frontend.components.cmdk.core.get_filter_q = (function frontend$components$cmdk$core$get_filter_q(input){
var or__5002__auto__ = ((clojure.string.starts_with_QMARK_(input,"/"))?cljs.core.subs.cljs$core$IFn$_invoke$arity$2(input,(1)):null);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.last(logseq.common.util.split_last("/",input));
}
});
frontend.components.cmdk.core.load_results.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"filters","filters",974726919),(function (group,state){
var _BANG_results = new cljs.core.Keyword("frontend.components.cmdk.core","results","frontend.components.cmdk.core/results",-2086115969).cljs$core$IFn$_invoke$arity$1(state);
var _BANG_input = new cljs.core.Keyword("frontend.components.cmdk.core","input","frontend.components.cmdk.core/input",-1679319815).cljs$core$IFn$_invoke$arity$1(state);
var input = cljs.core.deref(_BANG_input);
var q = (function (){var or__5002__auto__ = frontend.components.cmdk.core.get_filter_q(input);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return "";
}
})();
var matched_items = ((clojure.string.blank_QMARK_(q))?frontend.components.cmdk.core.filters():(function (){var G__89967 = frontend.components.cmdk.core.filters();
var G__89968 = q;
var G__89969 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"extract-fn","extract-fn",-339752723),new cljs.core.Keyword(null,"text","text",-1790561697)], null);
return (frontend.search.fuzzy_search.cljs$core$IFn$_invoke$arity$3 ? frontend.search.fuzzy_search.cljs$core$IFn$_invoke$arity$3(G__89967,G__89968,G__89969) : frontend.search.fuzzy_search.call(null,G__89967,G__89968,G__89969));
})());
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$variadic(_BANG_results,cljs.core.update,group,cljs.core.merge,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"status","status",-1997798413),new cljs.core.Keyword(null,"success","success",1890645906),new cljs.core.Keyword(null,"items","items",1031954938),matched_items], null)], 0));
}));
frontend.components.cmdk.core.load_results.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"current-page","current-page",-101294180),(function (group,state){
var temp__5802__auto__ = (function (){var temp__5804__auto__ = frontend.util.page.get_current_page_id();
if(cljs.core.truth_(temp__5804__auto__)){
var id = temp__5804__auto__;
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(id) : frontend.db.entity.call(null,id));
} else {
return null;
}
})();
if(cljs.core.truth_(temp__5802__auto__)){
var current_page = temp__5802__auto__;
var _BANG_results = new cljs.core.Keyword("frontend.components.cmdk.core","results","frontend.components.cmdk.core/results",-2086115969).cljs$core$IFn$_invoke$arity$1(state);
var _BANG_input = new cljs.core.Keyword("frontend.components.cmdk.core","input","frontend.components.cmdk.core/input",-1679319815).cljs$core$IFn$_invoke$arity$1(state);
var repo = frontend.state.get_current_repo();
var opts = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"limit","limit",-1355822363),(100),new cljs.core.Keyword(null,"page","page",849072397),cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(current_page))], null);
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(_BANG_results,cljs.core.assoc_in,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [group,new cljs.core.Keyword(null,"status","status",-1997798413)], null),new cljs.core.Keyword(null,"loading","loading",-737050189));

cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(_BANG_results,cljs.core.assoc_in,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"current-page","current-page",-101294180),new cljs.core.Keyword(null,"status","status",-1997798413)], null),new cljs.core.Keyword(null,"loading","loading",-737050189));

return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.search.block_search(repo,cljs.core.deref(_BANG_input),opts)),(function (blocks){
return promesa.protocols._mcat(promesa.protocols._promise(cljs.core.remove.cljs$core$IFn$_invoke$arity$2(cljs.core.nil_QMARK_,blocks)),(function (blocks__$1){
return promesa.protocols._mcat(promesa.protocols._promise(cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (block){
var id = ((cljs.core.uuid_QMARK_(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block)))?new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block):cljs.core.uuid(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block)));
return new cljs.core.PersistentArrayMap(null, 6, [new cljs.core.Keyword(null,"icon","icon",1679606541),"node",new cljs.core.Keyword(null,"icon-theme","icon-theme",1771652151),new cljs.core.Keyword(null,"gray","gray",1013268388),new cljs.core.Keyword(null,"text","text",-1790561697),frontend.components.cmdk.core.highlight_content_query(new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(block),cljs.core.deref(_BANG_input)),new cljs.core.Keyword(null,"header","header",119441134),frontend.components.block.breadcrumb(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"search?","search?",785472524),true], null),repo,id,cljs.core.PersistentArrayMap.EMPTY),new cljs.core.Keyword(null,"current-page?","current-page?",-1491305079),true,new cljs.core.Keyword(null,"source-block","source-block",-878290804),block], null);
}),blocks__$1)),(function (items){
return promesa.protocols._promise(cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$variadic(_BANG_results,cljs.core.update,new cljs.core.Keyword(null,"current-page","current-page",-101294180),cljs.core.merge,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"status","status",-1997798413),new cljs.core.Keyword(null,"success","success",1890645906),new cljs.core.Keyword(null,"items","items",1031954938),items], null)], 0)));
}));
}));
}));
}));
} else {
return cljs.core.reset_BANG_(new cljs.core.Keyword("frontend.components.cmdk.core","filter","frontend.components.cmdk.core/filter",279770674).cljs$core$IFn$_invoke$arity$1(state),null);
}
}));
frontend.components.cmdk.core.load_results.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"default","default",-1987822328),(function (_,state){
var filter_group = new cljs.core.Keyword(null,"group","group",582596132).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(new cljs.core.Keyword("frontend.components.cmdk.core","filter","frontend.components.cmdk.core/filter",279770674).cljs$core$IFn$_invoke$arity$1(state)));
if(((cljs.core.not((function (){var G__89971 = state;
var G__89971__$1 = (((G__89971 == null))?null:new cljs.core.Keyword("frontend.components.cmdk.core","input","frontend.components.cmdk.core/input",-1679319815).cljs$core$IFn$_invoke$arity$1(G__89971));
var G__89971__$2 = (((G__89971__$1 == null))?null:cljs.core.deref(G__89971__$1));
if((G__89971__$2 == null)){
return null;
} else {
return cljs.core.seq(G__89971__$2);
}
})())) && (cljs.core.not(filter_group)))){
frontend.components.cmdk.core.load_results.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"initial","initial",1854648214),state);

return frontend.components.cmdk.core.load_results.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"filters","filters",974726919),state);
} else {
if(cljs.core.truth_(filter_group)){
return frontend.components.cmdk.core.load_results.cljs$core$IFn$_invoke$arity$2(filter_group,state);
} else {
frontend.components.cmdk.core.load_results.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"commands","commands",161008658),state);

frontend.components.cmdk.core.load_results.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"nodes","nodes",-2099585805),state);

frontend.components.cmdk.core.load_results.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"filters","filters",974726919),state);

frontend.components.cmdk.core.load_results.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"files","files",-472457450),state);

return frontend.components.cmdk.core.load_results.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"recently-updated-pages","recently-updated-pages",-1385487647),state);
}
}
}));
frontend.components.cmdk.core.copy_block_ref = (function frontend$components$cmdk$core$copy_block_ref(state){
var temp__5804__auto__ = (function (){var G__89972 = state;
var G__89972__$1 = (((G__89972 == null))?null:frontend.components.cmdk.core.state__GT_highlighted_item(G__89972));
var G__89972__$2 = (((G__89972__$1 == null))?null:new cljs.core.Keyword(null,"source-block","source-block",-878290804).cljs$core$IFn$_invoke$arity$1(G__89972__$1));
if((G__89972__$2 == null)){
return null;
} else {
return new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(G__89972__$2);
}
})();
if(cljs.core.truth_(temp__5804__auto__)){
var block_uuid = temp__5804__auto__;
frontend.handler.editor.copy_block_ref_BANG_.cljs$core$IFn$_invoke$arity$2(block_uuid,logseq.common.util.block_ref.__GT_block_ref);

return (logseq.shui.ui.dialog_close_BANG_.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.dialog_close_BANG_.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"ls-dialog-cmdk","ls-dialog-cmdk",-1613937560)) : logseq.shui.ui.dialog_close_BANG_.call(null,new cljs.core.Keyword(null,"ls-dialog-cmdk","ls-dialog-cmdk",-1613937560)));
} else {
return null;
}
});
if((typeof frontend !== 'undefined') && (typeof frontend.components !== 'undefined') && (typeof frontend.components.cmdk !== 'undefined') && (typeof frontend.components.cmdk.core !== 'undefined') && (typeof frontend.components.cmdk.core.handle_action !== 'undefined')){
} else {
frontend.components.cmdk.core.handle_action = (function (){var method_table__5599__auto__ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
var prefer_table__5600__auto__ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
var method_cache__5601__auto__ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
var cached_hierarchy__5602__auto__ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
var hierarchy__5603__auto__ = cljs.core.get.cljs$core$IFn$_invoke$arity$3(cljs.core.PersistentArrayMap.EMPTY,new cljs.core.Keyword(null,"hierarchy","hierarchy",-1053470341),(function (){var fexpr__89973 = cljs.core.get_global_hierarchy;
return (fexpr__89973.cljs$core$IFn$_invoke$arity$0 ? fexpr__89973.cljs$core$IFn$_invoke$arity$0() : fexpr__89973.call(null));
})());
return (new cljs.core.MultiFn(cljs.core.symbol.cljs$core$IFn$_invoke$arity$2("frontend.components.cmdk.core","handle-action"),(function (action,_state,_event){
return action;
}),new cljs.core.Keyword(null,"default","default",-1987822328),hierarchy__5603__auto__,method_table__5599__auto__,prefer_table__5600__auto__,method_cache__5601__auto__,cached_hierarchy__5602__auto__));
})();
}
frontend.components.cmdk.core.get_highlighted_page_uuid_or_name = (function frontend$components$cmdk$core$get_highlighted_page_uuid_or_name(state){
var highlighted_item = (function (){var G__89974 = state;
if((G__89974 == null)){
return null;
} else {
return frontend.components.cmdk.core.state__GT_highlighted_item(G__89974);
}
})();
var or__5002__auto__ = new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"source-block","source-block",-878290804).cljs$core$IFn$_invoke$arity$1(highlighted_item));
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"source-page","source-page",1338615502).cljs$core$IFn$_invoke$arity$1(highlighted_item));
}
});
frontend.components.cmdk.core.handle_action.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"open-page","open-page",408877301),(function (_,state,_event){
var temp__5804__auto__ = frontend.components.cmdk.core.get_highlighted_page_uuid_or_name(state);
if(cljs.core.truth_(temp__5804__auto__)){
var page_name = temp__5804__auto__;
var page_uuid_90268 = cljs.core.get.cljs$core$IFn$_invoke$arity$3((frontend.db.get_page.cljs$core$IFn$_invoke$arity$1 ? frontend.db.get_page.cljs$core$IFn$_invoke$arity$1(page_name) : frontend.db.get_page.call(null,page_name)),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),((cljs.core.uuid_QMARK_(page_name))?page_name:null));
frontend.handler.route.redirect_to_page_BANG_.cljs$core$IFn$_invoke$arity$1(page_uuid_90268);

return (logseq.shui.ui.dialog_close_BANG_.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.dialog_close_BANG_.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"ls-dialog-cmdk","ls-dialog-cmdk",-1613937560)) : logseq.shui.ui.dialog_close_BANG_.call(null,new cljs.core.Keyword(null,"ls-dialog-cmdk","ls-dialog-cmdk",-1613937560)));
} else {
return null;
}
}));
frontend.components.cmdk.core.handle_action.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"open-block","open-block",1952534985),(function (_,state,_event){
var temp__5804__auto__ = (function (){var G__89975 = state;
var G__89975__$1 = (((G__89975 == null))?null:frontend.components.cmdk.core.state__GT_highlighted_item(G__89975));
var G__89975__$2 = (((G__89975__$1 == null))?null:new cljs.core.Keyword(null,"source-block","source-block",-878290804).cljs$core$IFn$_invoke$arity$1(G__89975__$1));
if((G__89975__$2 == null)){
return null;
} else {
return new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(G__89975__$2);
}
})();
if(cljs.core.truth_(temp__5804__auto__)){
var block_id = temp__5804__auto__;
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.state.get_current_repo()),(function (repo){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.db.async._LT_get_block.cljs$core$IFn$_invoke$arity$variadic(repo,block_id,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"children?","children?",-1199594108),false], 0))),(function (___$1){
return promesa.protocols._mcat(promesa.protocols._promise((function (){var G__89976 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_id], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__89976) : frontend.db.entity.call(null,G__89976));
})()),(function (block){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.db.async._LT_get_block_parents(frontend.state.get_current_repo(),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block),(1000))),(function (parents){
return promesa.protocols._mcat(promesa.protocols._promise(cljs.core.some((function (block_SINGLEQUOTE_){
var block__$1 = (function (){var G__89977 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block_SINGLEQUOTE_);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__89977) : frontend.db.entity.call(null,G__89977));
})();
if(cljs.core.truth_(new cljs.core.Keyword("logseq.property","created-from-property","logseq.property/created-from-property",-861892267).cljs$core$IFn$_invoke$arity$1(block__$1))){
return new cljs.core.Keyword("block","parent","block/parent",-918309064).cljs$core$IFn$_invoke$arity$1(block__$1);
} else {
return null;
}
}),parents)),(function (created_from_block){
return promesa.protocols._mcat(promesa.protocols._promise((cljs.core.truth_(created_from_block)?(function (){var block__$1 = (function (){var G__89978 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(created_from_block);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__89978) : frontend.db.entity.call(null,G__89978));
})();
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block__$1),block__$1], null);
})():new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [block_id,block], null))),(function (p__89979){
var vec__89980 = p__89979;
var block_id__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__89980,(0),null);
var block__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__89980,(1),null);
return promesa.protocols._promise((function (){var get_block_page = cljs.core.partial.cljs$core$IFn$_invoke$arity$2(frontend.db.model.get_block_page,repo);
if(cljs.core.truth_(block__$1)){
var temp__5804__auto____$1 = (function (){var G__89983 = block_id__$1;
if((G__89983 == null)){
return null;
} else {
return get_block_page(G__89983);
}
})();
if(cljs.core.truth_(temp__5804__auto____$1)){
var page = temp__5804__auto____$1;
if(cljs.core.truth_((frontend.db.whiteboard_page_QMARK_.cljs$core$IFn$_invoke$arity$1 ? frontend.db.whiteboard_page_QMARK_.cljs$core$IFn$_invoke$arity$1(page) : frontend.db.whiteboard_page_QMARK_.call(null,page)))){
frontend.handler.route.redirect_to_page_BANG_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(page),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"block-id","block-id",-70582834),block_id__$1], null));
} else {
if(cljs.core.truth_(frontend.db.model.parents_collapsed_QMARK_(frontend.state.get_current_repo(),block_id__$1))){
frontend.handler.route.redirect_to_page_BANG_.cljs$core$IFn$_invoke$arity$1(block_id__$1);
} else {
frontend.handler.route.redirect_to_page_BANG_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(page),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"anchor","anchor",1549638489),["ls-block-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(block_id__$1)].join('')], null));

}
}

return (logseq.shui.ui.dialog_close_BANG_.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.dialog_close_BANG_.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"ls-dialog-cmdk","ls-dialog-cmdk",-1613937560)) : logseq.shui.ui.dialog_close_BANG_.call(null,new cljs.core.Keyword(null,"ls-dialog-cmdk","ls-dialog-cmdk",-1613937560)));
} else {
return null;
}
} else {
return null;
}
})());
}));
}));
}));
}));
}));
}));
}));
} else {
return null;
}
}));
frontend.components.cmdk.core.handle_action.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"open-page-right","open-page-right",1037849418),(function (_,state,_event){
var temp__5804__auto__ = frontend.components.cmdk.core.get_highlighted_page_uuid_or_name(state);
if(cljs.core.truth_(temp__5804__auto__)){
var page_name = temp__5804__auto__;
var page_90274 = (frontend.db.get_page.cljs$core$IFn$_invoke$arity$1 ? frontend.db.get_page.cljs$core$IFn$_invoke$arity$1(page_name) : frontend.db.get_page.call(null,page_name));
if(cljs.core.truth_(page_90274)){
frontend.handler.editor.open_block_in_sidebar_BANG_(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(page_90274));
} else {
}

return (logseq.shui.ui.dialog_close_BANG_.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.dialog_close_BANG_.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"ls-dialog-cmdk","ls-dialog-cmdk",-1613937560)) : logseq.shui.ui.dialog_close_BANG_.call(null,new cljs.core.Keyword(null,"ls-dialog-cmdk","ls-dialog-cmdk",-1613937560)));
} else {
return null;
}
}));
frontend.components.cmdk.core.handle_action.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"open-block-right","open-block-right",-1593533049),(function (_,state,_event){
var temp__5804__auto__ = (function (){var G__89984 = state;
var G__89984__$1 = (((G__89984 == null))?null:frontend.components.cmdk.core.state__GT_highlighted_item(G__89984));
var G__89984__$2 = (((G__89984__$1 == null))?null:new cljs.core.Keyword(null,"source-block","source-block",-878290804).cljs$core$IFn$_invoke$arity$1(G__89984__$1));
if((G__89984__$2 == null)){
return null;
} else {
return new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(G__89984__$2);
}
})();
if(cljs.core.truth_(temp__5804__auto__)){
var block_uuid = temp__5804__auto__;
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.state.get_current_repo()),(function (repo){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.db.async._LT_get_block.cljs$core$IFn$_invoke$arity$variadic(repo,block_uuid,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"children?","children?",-1199594108),false], 0))),(function (___$1){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.editor.open_block_in_sidebar_BANG_(block_uuid)),(function (___40947__auto__){
return promesa.protocols._promise((logseq.shui.ui.dialog_close_BANG_.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.dialog_close_BANG_.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"ls-dialog-cmdk","ls-dialog-cmdk",-1613937560)) : logseq.shui.ui.dialog_close_BANG_.call(null,new cljs.core.Keyword(null,"ls-dialog-cmdk","ls-dialog-cmdk",-1613937560))));
}));
}));
}));
}));
} else {
return null;
}
}));
frontend.components.cmdk.core.open_file = (function frontend$components$cmdk$core$open_file(file_path){
if(((clojure.string.ends_with_QMARK_(file_path,".edn")) || (((clojure.string.ends_with_QMARK_(file_path,".js")) || (clojure.string.ends_with_QMARK_(file_path,".css")))))){
return frontend.handler.route.redirect_BANG_(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"to","to",192099007),new cljs.core.Keyword(null,"file","file",-1269645878),new cljs.core.Keyword(null,"path-params","path-params",-48130597),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"path","path",-188191168),file_path], null)], null));
} else {
if(cljs.core.truth_(frontend.util.electron_QMARK_())){
var file_fpath = logseq.common.path.path_join.cljs$core$IFn$_invoke$arity$variadic(frontend.config.get_repo_dir(frontend.state.get_current_repo()),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([file_path], 0));
return electron.ipc.ipc.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["openFileInFolder",file_fpath], 0));
} else {
return null;
}
}
});
frontend.components.cmdk.core.page_item_QMARK_ = (function frontend$components$cmdk$core$page_item_QMARK_(item){
var block_uuid = new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"source-block","source-block",-878290804).cljs$core$IFn$_invoke$arity$1(item));
var or__5002__auto__ = cljs.core.boolean$(new cljs.core.Keyword(null,"source-page","source-page",1338615502).cljs$core$IFn$_invoke$arity$1(item));
if(or__5002__auto__){
return or__5002__auto__;
} else {
var and__5000__auto__ = block_uuid;
if(cljs.core.truth_(and__5000__auto__)){
return new cljs.core.Keyword("block","name","block/name",1619760316).cljs$core$IFn$_invoke$arity$1((function (){var G__89985 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_uuid], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__89985) : frontend.db.entity.call(null,G__89985));
})());
} else {
return and__5000__auto__;
}
}
});
frontend.components.cmdk.core.handle_action.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"open","open",-1763596448),(function (_,state,event){
var temp__5804__auto__ = (function (){var G__89986 = state;
if((G__89986 == null)){
return null;
} else {
return frontend.components.cmdk.core.state__GT_highlighted_item(G__89986);
}
})();
if(cljs.core.truth_(temp__5804__auto__)){
var item = temp__5804__auto__;
var page_QMARK_ = frontend.components.cmdk.core.page_item_QMARK_(item);
var block_QMARK_ = cljs.core.boolean$(new cljs.core.Keyword(null,"source-block","source-block",-878290804).cljs$core$IFn$_invoke$arity$1(item));
var shift_QMARK_ = cljs.core.deref(new cljs.core.Keyword("frontend.components.cmdk.core","shift?","frontend.components.cmdk.core/shift?",1896723736).cljs$core$IFn$_invoke$arity$1(state));
var shift_or_sidebar_QMARK_ = (function (){var or__5002__auto__ = shift_QMARK_;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.boolean$(new cljs.core.Keyword(null,"open-sidebar?","open-sidebar?",1933561166).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"opts","opts",155075701).cljs$core$IFn$_invoke$arity$1(state)));
}
})();
var search_mode = new cljs.core.Keyword("search","mode","search/mode",1628111395).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state));
var graph_view_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(search_mode,new cljs.core.Keyword(null,"graph","graph",1558099509));
if(cljs.core.truth_(new cljs.core.Keyword(null,"file-path","file-path",-2005501162).cljs$core$IFn$_invoke$arity$1(item))){
frontend.components.cmdk.core.open_file(new cljs.core.Keyword(null,"file-path","file-path",-2005501162).cljs$core$IFn$_invoke$arity$1(item));

return (logseq.shui.ui.dialog_close_BANG_.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.dialog_close_BANG_.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"ls-dialog-cmdk","ls-dialog-cmdk",-1613937560)) : logseq.shui.ui.dialog_close_BANG_.call(null,new cljs.core.Keyword(null,"ls-dialog-cmdk","ls-dialog-cmdk",-1613937560)));
} else {
if(cljs.core.truth_((function (){var and__5000__auto__ = graph_view_QMARK_;
if(and__5000__auto__){
var and__5000__auto____$1 = page_QMARK_;
if(cljs.core.truth_(and__5000__auto____$1)){
return cljs.core.not(shift_QMARK_);
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})())){
frontend.state.add_graph_search_filter_BANG_(cljs.core.deref(new cljs.core.Keyword("frontend.components.cmdk.core","input","frontend.components.cmdk.core/input",-1679319815).cljs$core$IFn$_invoke$arity$1(state)));

return cljs.core.reset_BANG_(new cljs.core.Keyword("frontend.components.cmdk.core","input","frontend.components.cmdk.core/input",-1679319815).cljs$core$IFn$_invoke$arity$1(state),"");
} else {
if(cljs.core.truth_((function (){var and__5000__auto__ = shift_or_sidebar_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return block_QMARK_;
} else {
return and__5000__auto__;
}
})())){
return frontend.components.cmdk.core.handle_action.cljs$core$IFn$_invoke$arity$3(new cljs.core.Keyword(null,"open-block-right","open-block-right",-1593533049),state,event);
} else {
if(cljs.core.truth_((function (){var and__5000__auto__ = shift_or_sidebar_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return page_QMARK_;
} else {
return and__5000__auto__;
}
})())){
return frontend.components.cmdk.core.handle_action.cljs$core$IFn$_invoke$arity$3(new cljs.core.Keyword(null,"open-page-right","open-page-right",1037849418),state,event);
} else {
if(cljs.core.truth_(page_QMARK_)){
return frontend.components.cmdk.core.handle_action.cljs$core$IFn$_invoke$arity$3(new cljs.core.Keyword(null,"open-page","open-page",408877301),state,event);
} else {
if(block_QMARK_){
return frontend.components.cmdk.core.handle_action.cljs$core$IFn$_invoke$arity$3(new cljs.core.Keyword(null,"open-block","open-block",1952534985),state,event);
} else {
return null;
}
}
}
}
}
}
} else {
return null;
}
}));
frontend.components.cmdk.core.handle_action.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"search","search",1564939822),(function (_,state,_event){
var temp__5804__auto__ = (function (){var G__89987 = state;
if((G__89987 == null)){
return null;
} else {
return frontend.components.cmdk.core.state__GT_highlighted_item(G__89987);
}
})();
if(cljs.core.truth_(temp__5804__auto__)){
var item = temp__5804__auto__;
var search_query = new cljs.core.Keyword(null,"source-search","source-search",-401166475).cljs$core$IFn$_invoke$arity$1(item);
return cljs.core.reset_BANG_(new cljs.core.Keyword("frontend.components.cmdk.core","input","frontend.components.cmdk.core/input",-1679319815).cljs$core$IFn$_invoke$arity$1(state),search_query);
} else {
return null;
}
}));
frontend.components.cmdk.core.handle_action.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"trigger","trigger",103466139),(function (_,state,_event){
var command = (function (){var G__89989 = state;
var G__89989__$1 = (((G__89989 == null))?null:frontend.components.cmdk.core.state__GT_highlighted_item(G__89989));
if((G__89989__$1 == null)){
return null;
} else {
return new cljs.core.Keyword(null,"source-command","source-command",969630731).cljs$core$IFn$_invoke$arity$1(G__89989__$1);
}
})();
var dont_close_commands = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword("graph","open","graph/open",-1870468846),null,new cljs.core.Keyword("misc","import-edn-data","misc/import-edn-data",36006165),null,new cljs.core.Keyword("graph","remove","graph/remove",-246951656),null,new cljs.core.Keyword("dev","replace-graph-with-db-file","dev/replace-graph-with-db-file",1809442556),null], null), null);
var temp__5804__auto__ = new cljs.core.Keyword(null,"action","action",-811238024).cljs$core$IFn$_invoke$arity$1(command);
if(cljs.core.truth_(temp__5804__auto__)){
var action = temp__5804__auto__;
if(cljs.core.contains_QMARK_(dont_close_commands,new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(command))){
} else {
(logseq.shui.ui.dialog_close_BANG_.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.dialog_close_BANG_.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"ls-dialog-cmdk","ls-dialog-cmdk",-1613937560)) : logseq.shui.ui.dialog_close_BANG_.call(null,new cljs.core.Keyword(null,"ls-dialog-cmdk","ls-dialog-cmdk",-1613937560)));
}

var G__89990 = (function (){
return (action.cljs$core$IFn$_invoke$arity$0 ? action.cljs$core$IFn$_invoke$arity$0() : action.call(null));
});
var G__89991 = (32);
return (frontend.util.schedule.cljs$core$IFn$_invoke$arity$2 ? frontend.util.schedule.cljs$core$IFn$_invoke$arity$2(G__89990,G__89991) : frontend.util.schedule.call(null,G__89990,G__89991));
} else {
return null;
}
}));
frontend.components.cmdk.core.handle_action.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"create","create",-1301499256),(function (_,state,_event){
var item = frontend.components.cmdk.core.state__GT_highlighted_item(state);
var _BANG_input = new cljs.core.Keyword("frontend.components.cmdk.core","input","frontend.components.cmdk.core/input",-1679319815).cljs$core$IFn$_invoke$arity$1(state);
var create_class_QMARK_ = clojure.string.starts_with_QMARK_(cljs.core.deref(_BANG_input),"#");
var create_whiteboard_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"whiteboard","whiteboard",-1766646928),new cljs.core.Keyword(null,"source-create","source-create",-1664647972).cljs$core$IFn$_invoke$arity$1(item));
var create_page_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"page","page",849072397),new cljs.core.Keyword(null,"source-create","source-create",-1664647972).cljs$core$IFn$_invoke$arity$1(item));
var class$ = ((create_class_QMARK_)?frontend.components.cmdk.core.get_class_from_input(cljs.core.deref(_BANG_input)):null);
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(((create_class_QMARK_)?frontend.handler.db_based.page._LT_create_class_BANG_(class$,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"redirect?","redirect?",-1229259098),false], null)):((create_whiteboard_QMARK_)?frontend.handler.whiteboard._LT_create_new_whiteboard_and_redirect_BANG_.cljs$core$IFn$_invoke$arity$1(cljs.core.deref(_BANG_input)):((create_page_QMARK_)?(function (){var G__89992 = cljs.core.deref(_BANG_input);
var G__89993 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"redirect?","redirect?",-1229259098),true], null);
return (frontend.handler.page._LT_create_BANG_.cljs$core$IFn$_invoke$arity$2 ? frontend.handler.page._LT_create_BANG_.cljs$core$IFn$_invoke$arity$2(G__89992,G__89993) : frontend.handler.page._LT_create_BANG_.call(null,G__89992,G__89993));
})():null)))),(function (result){
return promesa.protocols._mcat(promesa.protocols._promise((logseq.shui.ui.dialog_close_BANG_.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.dialog_close_BANG_.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"ls-dialog-cmdk","ls-dialog-cmdk",-1613937560)) : logseq.shui.ui.dialog_close_BANG_.call(null,new cljs.core.Keyword(null,"ls-dialog-cmdk","ls-dialog-cmdk",-1613937560)))),(function (___40947__auto__){
return promesa.protocols._promise((cljs.core.truth_((function (){var and__5000__auto__ = create_class_QMARK_;
if(and__5000__auto__){
return result;
} else {
return and__5000__auto__;
}
})())?frontend.state.sidebar_add_block_BANG_(frontend.state.get_current_repo(),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(result),new cljs.core.Keyword(null,"block","block",664686210)):null));
}));
}));
}));
}));
frontend.components.cmdk.core.get_filter_user_input = (function frontend$components$cmdk$core$get_filter_user_input(input){
if(clojure.string.includes_QMARK_(input,"/")){
return cljs.core.first(logseq.common.util.split_last("/",input));
} else {
if(clojure.string.starts_with_QMARK_(input,"/")){
return "";
} else {
return input;

}
}
});
frontend.components.cmdk.core.handle_action.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"filter","filter",-948537934),(function (_,state,_event){
var item = (function (){var G__89994 = state;
if((G__89994 == null)){
return null;
} else {
return frontend.components.cmdk.core.state__GT_highlighted_item(G__89994);
}
})();
var _BANG_input = new cljs.core.Keyword("frontend.components.cmdk.core","input","frontend.components.cmdk.core/input",-1679319815).cljs$core$IFn$_invoke$arity$1(state);
cljs.core.reset_BANG_(_BANG_input,frontend.components.cmdk.core.get_filter_user_input(cljs.core.deref(_BANG_input)));

var _BANG_filter = new cljs.core.Keyword("frontend.components.cmdk.core","filter","frontend.components.cmdk.core/filter",279770674).cljs$core$IFn$_invoke$arity$1(state);
var group = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(item,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"filter","filter",-948537934),new cljs.core.Keyword(null,"group","group",582596132)], null));
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(_BANG_filter,cljs.core.assoc,new cljs.core.Keyword(null,"group","group",582596132),group);

return frontend.components.cmdk.core.load_results.cljs$core$IFn$_invoke$arity$2(group,state);
}));
frontend.components.cmdk.core.handle_action.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"theme","theme",-1247880880),(function (_,state){
var temp__5804__auto__ = (function (){var G__89995 = state;
if((G__89995 == null)){
return null;
} else {
return frontend.components.cmdk.core.state__GT_highlighted_item(G__89995);
}
})();
if(cljs.core.truth_(temp__5804__auto__)){
var item = temp__5804__auto__;
LSPluginCore.selectTheme(cljs_bean.core.__GT_js(new cljs.core.Keyword(null,"source-theme","source-theme",984403400).cljs$core$IFn$_invoke$arity$1(item)));

return (logseq.shui.ui.dialog_close_BANG_.cljs$core$IFn$_invoke$arity$0 ? logseq.shui.ui.dialog_close_BANG_.cljs$core$IFn$_invoke$arity$0() : logseq.shui.ui.dialog_close_BANG_.call(null));
} else {
return null;
}
}));
frontend.components.cmdk.core.handle_action.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"default","default",-1987822328),(function (_,state,event){
var temp__5804__auto__ = frontend.components.cmdk.core.state__GT_action(state);
if(cljs.core.truth_(temp__5804__auto__)){
var action = temp__5804__auto__;
return frontend.components.cmdk.core.handle_action.cljs$core$IFn$_invoke$arity$3(action,state,event);
} else {
return null;
}
}));
frontend.components.cmdk.core.scroll_into_view_when_invisible = (function frontend$components$cmdk$core$scroll_into_view_when_invisible(state,target){
var _STAR_container_ref = new cljs.core.Keyword("frontend.components.cmdk.core","scroll-container-ref","frontend.components.cmdk.core/scroll-container-ref",1170500984).cljs$core$IFn$_invoke$arity$1(state);
var container_rect = cljs.core.deref(_STAR_container_ref).getBoundingClientRect();
var t1 = container_rect.top;
var b1 = container_rect.bottom;
var target_rect = target.getBoundingClientRect();
var t2 = target_rect.top;
var b2 = target_rect.bottom;
if((((t1 <= t2)) && ((((t2 <= b2)) && ((b2 <= b1)))))){
return null;
} else {
return target.scrollIntoView(({"inline": "nearest", "behavior": "smooth"}));
}
});
frontend.components.cmdk.core.mouse_active_effect_BANG_ = rum.core.lazy_build(rum.core.build_defc,(function (_STAR_mouse_active_QMARK_,deps){
logseq.shui.hooks.use_effect_BANG_((function (){
return cljs.core.reset_BANG_(_STAR_mouse_active_QMARK_,false);
}),deps);

return null;
}),null,"frontend.components.cmdk.core/mouse-active-effect!");
frontend.components.cmdk.core.result_group = rum.core.lazy_build(rum.core.build_defcs,(function (state_SINGLEQUOTE_,state,title,group,visible_items,first_item,sidebar_QMARK_){
var map__89996 = (function (){var G__89997 = state;
var G__89997__$1 = (((G__89997 == null))?null:new cljs.core.Keyword("frontend.components.cmdk.core","results","frontend.components.cmdk.core/results",-2086115969).cljs$core$IFn$_invoke$arity$1(G__89997));
var G__89997__$2 = (((G__89997__$1 == null))?null:cljs.core.deref(G__89997__$1));
if((G__89997__$2 == null)){
return null;
} else {
return (group.cljs$core$IFn$_invoke$arity$1 ? group.cljs$core$IFn$_invoke$arity$1(G__89997__$2) : group.call(null,G__89997__$2));
}
})();
var map__89996__$1 = cljs.core.__destructure_map(map__89996);
var show = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__89996__$1,new cljs.core.Keyword(null,"show","show",-576705889));
var items = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__89996__$1,new cljs.core.Keyword(null,"items","items",1031954938));
var highlighted_item = (function (){var or__5002__auto__ = cljs.core.deref(new cljs.core.Keyword("frontend.components.cmdk.core","highlighted-item","frontend.components.cmdk.core/highlighted-item",-2037503100).cljs$core$IFn$_invoke$arity$1(state));
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return first_item;
}
})();
var highlighted_group = cljs.core.deref(new cljs.core.Keyword("frontend.components.cmdk.core","highlighted-group","frontend.components.cmdk.core/highlighted-group",618991410).cljs$core$IFn$_invoke$arity$1(state));
var _STAR_mouse_active_QMARK_ = new cljs.core.Keyword("frontend.components.cmdk.core","mouse-active?","frontend.components.cmdk.core/mouse-active?",1581611673).cljs$core$IFn$_invoke$arity$1(state_SINGLEQUOTE_);
var filter_SINGLEQUOTE_ = cljs.core.deref(new cljs.core.Keyword("frontend.components.cmdk.core","filter","frontend.components.cmdk.core/filter",279770674).cljs$core$IFn$_invoke$arity$1(state));
var can_show_less_QMARK_ = (frontend.components.cmdk.core.get_group_limit(group) < cljs.core.count(visible_items));
var can_show_more_QMARK_ = (cljs.core.count(visible_items) < cljs.core.count(items));
var show_less = (function (){
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(new cljs.core.Keyword("frontend.components.cmdk.core","results","frontend.components.cmdk.core/results",-2086115969).cljs$core$IFn$_invoke$arity$1(state),cljs.core.assoc_in,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [group,new cljs.core.Keyword(null,"show","show",-576705889)], null),new cljs.core.Keyword(null,"less","less",-428869198));
});
var show_more = (function (){
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(new cljs.core.Keyword("frontend.components.cmdk.core","results","frontend.components.cmdk.core/results",-2086115969).cljs$core$IFn$_invoke$arity$1(state),cljs.core.assoc_in,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [group,new cljs.core.Keyword(null,"show","show",-576705889)], null),new cljs.core.Keyword(null,"more","more",-2058821800));
});
return daiquiri.core.create_element(daiquiri.core.fragment,null,[frontend.components.cmdk.core.mouse_active_effect_BANG_(_STAR_mouse_active_QMARK_,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [highlighted_item], null)),daiquiri.core.create_element("div",{'onMouseMove':(function (){
return cljs.core.reset_BANG_(_STAR_mouse_active_QMARK_,true);
}),'className':daiquiri.util.join_classes(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(title,"Create"))?"border-b border-gray-06 last:border-b-0":"border-b border-gray-06 pb-1 last:border-b-0")], null))},[((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(title,"Create"))?null:daiquiri.core.create_element("div",{'className':"text-xs py-1.5 px-3 flex justify-between items-center gap-2 text-gray-11 bg-gray-02 h-8"},[daiquiri.core.create_element("div",{'onClick':(function (_e){
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(new cljs.core.Keyword("frontend.components.cmdk.core","results","frontend.components.cmdk.core/results",-2086115969).cljs$core$IFn$_invoke$arity$1(state),cljs.core.update_in,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [group,new cljs.core.Keyword(null,"show","show",-576705889)], null),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"more","more",-2058821800),new cljs.core.Keyword(null,"less","less",-428869198),new cljs.core.Keyword(null,"less","less",-428869198),new cljs.core.Keyword(null,"more","more",-2058821800)], null));
}),'className':"font-bold text-gray-11 pl-0.5 cursor-pointer select-none"},[daiquiri.interpreter.interpret(title)]),((cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(group,new cljs.core.Keyword(null,"create","create",-1301499256)))?daiquiri.core.create_element("div",{'style':{'fontSize':"0.7rem"},'className':"pl-1.5 text-gray-12 rounded-full"},[((((100) <= cljs.core.count(items)))?"99+":cljs.core.count(items))]):null),daiquiri.core.create_element("div",{'className':"flex-1"},null),((((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(group,highlighted_group)) && (((((can_show_more_QMARK_) || (can_show_less_QMARK_))) && (((cljs.core.empty_QMARK_(filter_SINGLEQUOTE_)) && (cljs.core.not(sidebar_QMARK_))))))))?daiquiri.core.create_element("a",{'onClick':((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(show,new cljs.core.Keyword(null,"more","more",-2058821800)))?show_less:show_more),'className':"text-link select-node opacity-50 hover:opacity-90"},[((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(show,new cljs.core.Keyword(null,"more","more",-2058821800)))?daiquiri.core.create_element("div",{'className':"flex flex-row gap-1 items-center"},["Show less",daiquiri.interpreter.interpret(logseq.shui.ui.shortcut("mod up",null))]):daiquiri.core.create_element("div",{'className':"flex flex-row gap-1 items-center"},["Show more",daiquiri.interpreter.interpret(logseq.shui.ui.shortcut("mod down",null))]))]):null)])),daiquiri.core.create_element("div",{'className':"search-results"},[cljs.core.into_array.cljs$core$IFn$_invoke$arity$1((function (){var iter__5480__auto__ = (function frontend$components$cmdk$core$iter__90000(s__90001){
return (new cljs.core.LazySeq(null,(function (){
var s__90001__$1 = s__90001;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__90001__$1);
if(temp__5804__auto__){
var s__90001__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__90001__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__90001__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__90003 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__90002 = (0);
while(true){
if((i__90002 < size__5479__auto__)){
var item = cljs.core._nth(c__5478__auto__,i__90002);
var highlighted_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(item,highlighted_item);
var page_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("file",(function (){var G__90004 = item;
if((G__90004 == null)){
return null;
} else {
return new cljs.core.Keyword(null,"icon","icon",1679606541).cljs$core$IFn$_invoke$arity$1(G__90004);
}
})());
var text = (function (){var G__90005 = item;
if((G__90005 == null)){
return null;
} else {
return new cljs.core.Keyword(null,"text","text",-1790561697).cljs$core$IFn$_invoke$arity$1(G__90005);
}
})();
var source_page = (function (){var G__90006 = item;
if((G__90006 == null)){
return null;
} else {
return new cljs.core.Keyword(null,"source-page","source-page",1338615502).cljs$core$IFn$_invoke$arity$1(G__90006);
}
})();
var hls_page_QMARK_ = (function (){var and__5000__auto__ = page_QMARK_;
if(and__5000__auto__){
return frontend.extensions.pdf.utils.hls_file_QMARK_(new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(source_page));
} else {
return and__5000__auto__;
}
})();
cljs.core.chunk_append(b__90003,(function (){var item__$1 = frontend.components.cmdk.list_item.root(cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(item,new cljs.core.Keyword(null,"group","group",582596132),group,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"query","query",-1288509510),((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(group,new cljs.core.Keyword(null,"create","create",-1301499256)))?null:cljs.core.deref(new cljs.core.Keyword("frontend.components.cmdk.core","input","frontend.components.cmdk.core/input",-1679319815).cljs$core$IFn$_invoke$arity$1(state))),new cljs.core.Keyword(null,"text","text",-1790561697),(cljs.core.truth_(hls_page_QMARK_)?frontend.extensions.pdf.utils.fix_local_asset_pagename(text):text),new cljs.core.Keyword(null,"hls-page?","hls-page?",491762704),hls_page_QMARK_,new cljs.core.Keyword(null,"compact","compact",-348732150),true,new cljs.core.Keyword(null,"rounded","rounded",85415706),false,new cljs.core.Keyword(null,"hoverable","hoverable",1153998892),cljs.core.deref(_STAR_mouse_active_QMARK_),new cljs.core.Keyword(null,"highlighted","highlighted",1723498733),highlighted_QMARK_,new cljs.core.Keyword(null,"on-highlight-dep","on-highlight-dep",-869993420),highlighted_item,new cljs.core.Keyword(null,"on-click","on-click",1632826543),((function (i__90002,highlighted_QMARK_,page_QMARK_,text,source_page,hls_page_QMARK_,item,c__5478__auto__,size__5479__auto__,b__90003,s__90001__$2,temp__5804__auto__,map__89996,map__89996__$1,show,items,highlighted_item,highlighted_group,_STAR_mouse_active_QMARK_,filter_SINGLEQUOTE_,can_show_less_QMARK_,can_show_more_QMARK_,show_less,show_more){
return (function (e){
cljs.core.reset_BANG_(new cljs.core.Keyword("frontend.components.cmdk.core","highlighted-item","frontend.components.cmdk.core/highlighted-item",-2037503100).cljs$core$IFn$_invoke$arity$1(state),item);

frontend.components.cmdk.core.handle_action.cljs$core$IFn$_invoke$arity$3(new cljs.core.Keyword(null,"default","default",-1987822328),state,item);

var temp__5804__auto____$1 = new cljs.core.Keyword(null,"on-click","on-click",1632826543).cljs$core$IFn$_invoke$arity$1(item);
if(cljs.core.truth_(temp__5804__auto____$1)){
var on_click = temp__5804__auto____$1;
return (on_click.cljs$core$IFn$_invoke$arity$1 ? on_click.cljs$core$IFn$_invoke$arity$1(e) : on_click.call(null,e));
} else {
return null;
}
});})(i__90002,highlighted_QMARK_,page_QMARK_,text,source_page,hls_page_QMARK_,item,c__5478__auto__,size__5479__auto__,b__90003,s__90001__$2,temp__5804__auto__,map__89996,map__89996__$1,show,items,highlighted_item,highlighted_group,_STAR_mouse_active_QMARK_,filter_SINGLEQUOTE_,can_show_less_QMARK_,can_show_more_QMARK_,show_less,show_more))
,new cljs.core.Keyword(null,"on-highlight","on-highlight",-1064936151),((function (i__90002,highlighted_QMARK_,page_QMARK_,text,source_page,hls_page_QMARK_,item,c__5478__auto__,size__5479__auto__,b__90003,s__90001__$2,temp__5804__auto__,map__89996,map__89996__$1,show,items,highlighted_item,highlighted_group,_STAR_mouse_active_QMARK_,filter_SINGLEQUOTE_,can_show_less_QMARK_,can_show_more_QMARK_,show_less,show_more){
return (function (ref){
cljs.core.reset_BANG_(new cljs.core.Keyword("frontend.components.cmdk.core","highlighted-group","frontend.components.cmdk.core/highlighted-group",618991410).cljs$core$IFn$_invoke$arity$1(state),group);

if(cljs.core.truth_((function (){var and__5000__auto__ = ref;
if(cljs.core.truth_(and__5000__auto__)){
var and__5000__auto____$1 = ref.current;
if(cljs.core.truth_(and__5000__auto____$1)){
return cljs.core.not(new cljs.core.Keyword(null,"mouse-enter-triggered-highlight","mouse-enter-triggered-highlight",687876854).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(new cljs.core.Keyword("frontend.components.cmdk.core","highlighted-item","frontend.components.cmdk.core/highlighted-item",-2037503100).cljs$core$IFn$_invoke$arity$1(state))));
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})())){
return frontend.components.cmdk.core.scroll_into_view_when_invisible(state,ref.current);
} else {
return null;
}
});})(i__90002,highlighted_QMARK_,page_QMARK_,text,source_page,hls_page_QMARK_,item,c__5478__auto__,size__5479__auto__,b__90003,s__90001__$2,temp__5804__auto__,map__89996,map__89996__$1,show,items,highlighted_item,highlighted_group,_STAR_mouse_active_QMARK_,filter_SINGLEQUOTE_,can_show_less_QMARK_,can_show_more_QMARK_,show_less,show_more))
], 0)),null);
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(group,new cljs.core.Keyword(null,"nodes","nodes",-2099585805))){
return frontend.ui.lazy_visible(((function (i__90002,item__$1,highlighted_QMARK_,page_QMARK_,text,source_page,hls_page_QMARK_,item,c__5478__auto__,size__5479__auto__,b__90003,s__90001__$2,temp__5804__auto__,map__89996,map__89996__$1,show,items,highlighted_item,highlighted_group,_STAR_mouse_active_QMARK_,filter_SINGLEQUOTE_,can_show_less_QMARK_,can_show_more_QMARK_,show_less,show_more){
return (function (){
return item__$1;
});})(i__90002,item__$1,highlighted_QMARK_,page_QMARK_,text,source_page,hls_page_QMARK_,item,c__5478__auto__,size__5479__auto__,b__90003,s__90001__$2,temp__5804__auto__,map__89996,map__89996__$1,show,items,highlighted_item,highlighted_group,_STAR_mouse_active_QMARK_,filter_SINGLEQUOTE_,can_show_less_QMARK_,can_show_more_QMARK_,show_less,show_more))
,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"trigger-once?","trigger-once?",1582103477),true], null));
} else {
return daiquiri.interpreter.interpret(item__$1);
}
})());

var G__90293 = (i__90002 + (1));
i__90002 = G__90293;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__90003),frontend$components$cmdk$core$iter__90000(cljs.core.chunk_rest(s__90001__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__90003),null);
}
} else {
var item = cljs.core.first(s__90001__$2);
var highlighted_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(item,highlighted_item);
var page_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("file",(function (){var G__90007 = item;
if((G__90007 == null)){
return null;
} else {
return new cljs.core.Keyword(null,"icon","icon",1679606541).cljs$core$IFn$_invoke$arity$1(G__90007);
}
})());
var text = (function (){var G__90008 = item;
if((G__90008 == null)){
return null;
} else {
return new cljs.core.Keyword(null,"text","text",-1790561697).cljs$core$IFn$_invoke$arity$1(G__90008);
}
})();
var source_page = (function (){var G__90009 = item;
if((G__90009 == null)){
return null;
} else {
return new cljs.core.Keyword(null,"source-page","source-page",1338615502).cljs$core$IFn$_invoke$arity$1(G__90009);
}
})();
var hls_page_QMARK_ = (function (){var and__5000__auto__ = page_QMARK_;
if(and__5000__auto__){
return frontend.extensions.pdf.utils.hls_file_QMARK_(new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(source_page));
} else {
return and__5000__auto__;
}
})();
return cljs.core.cons((function (){var item__$1 = frontend.components.cmdk.list_item.root(cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(item,new cljs.core.Keyword(null,"group","group",582596132),group,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"query","query",-1288509510),((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(group,new cljs.core.Keyword(null,"create","create",-1301499256)))?null:cljs.core.deref(new cljs.core.Keyword("frontend.components.cmdk.core","input","frontend.components.cmdk.core/input",-1679319815).cljs$core$IFn$_invoke$arity$1(state))),new cljs.core.Keyword(null,"text","text",-1790561697),(cljs.core.truth_(hls_page_QMARK_)?frontend.extensions.pdf.utils.fix_local_asset_pagename(text):text),new cljs.core.Keyword(null,"hls-page?","hls-page?",491762704),hls_page_QMARK_,new cljs.core.Keyword(null,"compact","compact",-348732150),true,new cljs.core.Keyword(null,"rounded","rounded",85415706),false,new cljs.core.Keyword(null,"hoverable","hoverable",1153998892),cljs.core.deref(_STAR_mouse_active_QMARK_),new cljs.core.Keyword(null,"highlighted","highlighted",1723498733),highlighted_QMARK_,new cljs.core.Keyword(null,"on-highlight-dep","on-highlight-dep",-869993420),highlighted_item,new cljs.core.Keyword(null,"on-click","on-click",1632826543),((function (highlighted_QMARK_,page_QMARK_,text,source_page,hls_page_QMARK_,item,s__90001__$2,temp__5804__auto__,map__89996,map__89996__$1,show,items,highlighted_item,highlighted_group,_STAR_mouse_active_QMARK_,filter_SINGLEQUOTE_,can_show_less_QMARK_,can_show_more_QMARK_,show_less,show_more){
return (function (e){
cljs.core.reset_BANG_(new cljs.core.Keyword("frontend.components.cmdk.core","highlighted-item","frontend.components.cmdk.core/highlighted-item",-2037503100).cljs$core$IFn$_invoke$arity$1(state),item);

frontend.components.cmdk.core.handle_action.cljs$core$IFn$_invoke$arity$3(new cljs.core.Keyword(null,"default","default",-1987822328),state,item);

var temp__5804__auto____$1 = new cljs.core.Keyword(null,"on-click","on-click",1632826543).cljs$core$IFn$_invoke$arity$1(item);
if(cljs.core.truth_(temp__5804__auto____$1)){
var on_click = temp__5804__auto____$1;
return (on_click.cljs$core$IFn$_invoke$arity$1 ? on_click.cljs$core$IFn$_invoke$arity$1(e) : on_click.call(null,e));
} else {
return null;
}
});})(highlighted_QMARK_,page_QMARK_,text,source_page,hls_page_QMARK_,item,s__90001__$2,temp__5804__auto__,map__89996,map__89996__$1,show,items,highlighted_item,highlighted_group,_STAR_mouse_active_QMARK_,filter_SINGLEQUOTE_,can_show_less_QMARK_,can_show_more_QMARK_,show_less,show_more))
,new cljs.core.Keyword(null,"on-highlight","on-highlight",-1064936151),((function (highlighted_QMARK_,page_QMARK_,text,source_page,hls_page_QMARK_,item,s__90001__$2,temp__5804__auto__,map__89996,map__89996__$1,show,items,highlighted_item,highlighted_group,_STAR_mouse_active_QMARK_,filter_SINGLEQUOTE_,can_show_less_QMARK_,can_show_more_QMARK_,show_less,show_more){
return (function (ref){
cljs.core.reset_BANG_(new cljs.core.Keyword("frontend.components.cmdk.core","highlighted-group","frontend.components.cmdk.core/highlighted-group",618991410).cljs$core$IFn$_invoke$arity$1(state),group);

if(cljs.core.truth_((function (){var and__5000__auto__ = ref;
if(cljs.core.truth_(and__5000__auto__)){
var and__5000__auto____$1 = ref.current;
if(cljs.core.truth_(and__5000__auto____$1)){
return cljs.core.not(new cljs.core.Keyword(null,"mouse-enter-triggered-highlight","mouse-enter-triggered-highlight",687876854).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(new cljs.core.Keyword("frontend.components.cmdk.core","highlighted-item","frontend.components.cmdk.core/highlighted-item",-2037503100).cljs$core$IFn$_invoke$arity$1(state))));
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})())){
return frontend.components.cmdk.core.scroll_into_view_when_invisible(state,ref.current);
} else {
return null;
}
});})(highlighted_QMARK_,page_QMARK_,text,source_page,hls_page_QMARK_,item,s__90001__$2,temp__5804__auto__,map__89996,map__89996__$1,show,items,highlighted_item,highlighted_group,_STAR_mouse_active_QMARK_,filter_SINGLEQUOTE_,can_show_less_QMARK_,can_show_more_QMARK_,show_less,show_more))
], 0)),null);
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(group,new cljs.core.Keyword(null,"nodes","nodes",-2099585805))){
return frontend.ui.lazy_visible(((function (item__$1,highlighted_QMARK_,page_QMARK_,text,source_page,hls_page_QMARK_,item,s__90001__$2,temp__5804__auto__,map__89996,map__89996__$1,show,items,highlighted_item,highlighted_group,_STAR_mouse_active_QMARK_,filter_SINGLEQUOTE_,can_show_less_QMARK_,can_show_more_QMARK_,show_less,show_more){
return (function (){
return item__$1;
});})(item__$1,highlighted_QMARK_,page_QMARK_,text,source_page,hls_page_QMARK_,item,s__90001__$2,temp__5804__auto__,map__89996,map__89996__$1,show,items,highlighted_item,highlighted_group,_STAR_mouse_active_QMARK_,filter_SINGLEQUOTE_,can_show_less_QMARK_,can_show_more_QMARK_,show_less,show_more))
,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"trigger-once?","trigger-once?",1582103477),true], null));
} else {
return daiquiri.interpreter.interpret(item__$1);
}
})(),frontend$components$cmdk$core$iter__90000(cljs.core.rest(s__90001__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(visible_items);
})())])])]);
}),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive,rum.core.local.cljs$core$IFn$_invoke$arity$2(false,new cljs.core.Keyword("frontend.components.cmdk.core","mouse-active?","frontend.components.cmdk.core/mouse-active?",1581611673))], null),"frontend.components.cmdk.core/result-group");
frontend.components.cmdk.core.move_highlight = (function frontend$components$cmdk$core$move_highlight(state,n){
var items = cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic(cljs.core.last,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([frontend.components.cmdk.core.state__GT_results_ordered(state,new cljs.core.Keyword("search","mode","search/mode",1628111395).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state)))], 0));
var highlighted_item = (function (){var G__90010 = state;
var G__90010__$1 = (((G__90010 == null))?null:new cljs.core.Keyword("frontend.components.cmdk.core","highlighted-item","frontend.components.cmdk.core/highlighted-item",-2037503100).cljs$core$IFn$_invoke$arity$1(G__90010));
var G__90010__$2 = (((G__90010__$1 == null))?null:cljs.core.deref(G__90010__$1));
if((G__90010__$2 == null)){
return null;
} else {
return cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(G__90010__$2,new cljs.core.Keyword(null,"mouse-enter-triggered-highlight","mouse-enter-triggered-highlight",687876854));
}
})();
var current_item_index = (function (){var G__90011 = highlighted_item;
if((G__90011 == null)){
return null;
} else {
return items.indexOf(G__90011);
}
})();
var next_item_index = (function (){var G__90012 = (function (){var or__5002__auto__ = current_item_index;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return (0);
}
})();
var G__90012__$1 = (((G__90012 == null))?null:(G__90012 + n));
if((G__90012__$1 == null)){
return null;
} else {
return cljs.core.mod(G__90012__$1,cljs.core.count(items));
}
})();
var temp__5802__auto__ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(items,next_item_index,null);
if(cljs.core.truth_(temp__5802__auto__)){
var next_highlighted_item = temp__5802__auto__;
return cljs.core.reset_BANG_(new cljs.core.Keyword("frontend.components.cmdk.core","highlighted-item","frontend.components.cmdk.core/highlighted-item",-2037503100).cljs$core$IFn$_invoke$arity$1(state),next_highlighted_item);
} else {
return cljs.core.reset_BANG_(new cljs.core.Keyword("frontend.components.cmdk.core","highlighted-item","frontend.components.cmdk.core/highlighted-item",-2037503100).cljs$core$IFn$_invoke$arity$1(state),null);
}
});
frontend.components.cmdk.core.handle_input_change = (function frontend$components$cmdk$core$handle_input_change(var_args){
var G__90014 = arguments.length;
switch (G__90014) {
case 2:
return frontend.components.cmdk.core.handle_input_change.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return frontend.components.cmdk.core.handle_input_change.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.components.cmdk.core.handle_input_change.cljs$core$IFn$_invoke$arity$2 = (function (state,e){
return frontend.components.cmdk.core.handle_input_change.cljs$core$IFn$_invoke$arity$3(state,e,e.target.value);
}));

(frontend.components.cmdk.core.handle_input_change.cljs$core$IFn$_invoke$arity$3 = (function (state,e,input){
var composing_QMARK_ = frontend.util.native_event_is_composing_QMARK_(e);
var e_type = frontend.components.cmdk.core.goog$module$goog$object.getValueByKeys(e,"type");
var composing_end_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(e_type,"compositionend");
var _BANG_input = new cljs.core.Keyword("frontend.components.cmdk.core","input","frontend.components.cmdk.core/input",-1679319815).cljs$core$IFn$_invoke$arity$1(state);
var input_ref = cljs.core.deref(new cljs.core.Keyword("frontend.components.cmdk.core","input-ref","frontend.components.cmdk.core/input-ref",-581377366).cljs$core$IFn$_invoke$arity$1(state));
cljs.core.reset_BANG_(_BANG_input,input);

(input_ref.value = input);

cljs.core.reset_BANG_(new cljs.core.Keyword("frontend.components.cmdk.core","input-changed?","frontend.components.cmdk.core/input-changed?",555016439).cljs$core$IFn$_invoke$arity$1(state),true);

if(((cljs.core.not(composing_QMARK_)) || (composing_end_QMARK_))){
return frontend.components.cmdk.core.load_results.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"default","default",-1987822328),state);
} else {
return null;
}
}));

(frontend.components.cmdk.core.handle_input_change.cljs$lang$maxFixedArity = 3);

/**
 * Opens a link for the current item if a page or block. For pages, opens the
 *   first :url property if a db graph or for file graphs opens first property
 *   value with a url. For blocks, opens the first url found in the block content
 */
frontend.components.cmdk.core.open_current_item_link = (function frontend$components$cmdk$core$open_current_item_link(state){
var item = (function (){var G__90016 = state;
if((G__90016 == null)){
return null;
} else {
return frontend.components.cmdk.core.state__GT_highlighted_item(G__90016);
}
})();
var repo = frontend.state.get_current_repo();
if(cljs.core.truth_(frontend.components.cmdk.core.page_item_QMARK_(item))){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((function (){var G__90017 = frontend.components.cmdk.core.get_highlighted_page_uuid_or_name(state);
if((G__90017 == null)){
return null;
} else {
return (frontend.db.get_page.cljs$core$IFn$_invoke$arity$1 ? frontend.db.get_page.cljs$core$IFn$_invoke$arity$1(G__90017) : frontend.db.get_page.call(null,G__90017));
}
})()),(function (page){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.db.async._LT_get_block.cljs$core$IFn$_invoke$arity$variadic(repo,new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(page),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"children?","children?",-1199594108),false], 0))),(function (_){
return promesa.protocols._mcat(promesa.protocols._promise((function (){var G__90018 = repo;
var G__90019 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(page)], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$2 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$2(G__90018,G__90019) : frontend.db.entity.call(null,G__90018,G__90019));
})()),(function (page_SINGLEQUOTE_){
return promesa.protocols._mcat(promesa.protocols._promise(((frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(repo))?cljs.core.some((function (p__90020){
var vec__90021 = p__90020;
var k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__90021,(0),null);
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__90021,(1),null);
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"url","url",276297046),new cljs.core.Keyword("logseq.property","type","logseq.property/type",83842404).cljs$core$IFn$_invoke$arity$1((frontend.db.entity.cljs$core$IFn$_invoke$arity$2 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$2(repo,k) : frontend.db.entity.call(null,repo,k))))){
return new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(v);
} else {
return null;
}
}),new cljs.core.Keyword("block","properties","block/properties",708347145).cljs$core$IFn$_invoke$arity$1(page_SINGLEQUOTE_)):cljs.core.some((function (p1__90015_SHARP_){
return cljs.core.re_find(frontend.handler.editor.url_regex,cljs.core.val(p1__90015_SHARP_));
}),new cljs.core.Keyword("block","properties","block/properties",708347145).cljs$core$IFn$_invoke$arity$1(page_SINGLEQUOTE_)))),(function (link){
return promesa.protocols._promise((cljs.core.truth_(link)?window.open(link):frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$2("No link found in this page's properties.",new cljs.core.Keyword(null,"warning","warning",-1685650671))));
}));
}));
}));
}));
}));
} else {
if(cljs.core.truth_(new cljs.core.Keyword(null,"source-block","source-block",-878290804).cljs$core$IFn$_invoke$arity$1(item))){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"source-block","source-block",-878290804).cljs$core$IFn$_invoke$arity$1(item))),(function (block_id){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.db.async._LT_get_block.cljs$core$IFn$_invoke$arity$variadic(repo,block_id,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"children?","children?",-1199594108),false], 0))),(function (_){
return promesa.protocols._mcat(promesa.protocols._promise((function (){var G__90024 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_id], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__90024) : frontend.db.entity.call(null,G__90024));
})()),(function (block){
return promesa.protocols._mcat(promesa.protocols._promise(cljs.core.re_find(frontend.handler.editor.url_regex,new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(block))),(function (link){
return promesa.protocols._promise((cljs.core.truth_(link)?window.open(link):frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$2("No link found in this block's content.",new cljs.core.Keyword(null,"warning","warning",-1685650671))));
}));
}));
}));
}));
}));
} else {
return frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$2("No link for this search item.",new cljs.core.Keyword(null,"warning","warning",-1685650671));

}
}
});
frontend.components.cmdk.core.keydown_handler = (function frontend$components$cmdk$core$keydown_handler(state,e){
var shift_QMARK_ = e.shiftKey;
var meta_QMARK_ = frontend.util.meta_key_QMARK_(e);
var ctrl_QMARK_ = e.ctrlKey;
var keyname = e.key;
var enter_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(keyname,"Enter");
var esc_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(keyname,"Escape");
var composing_QMARK_ = frontend.util.goog_event_is_composing_QMARK_.cljs$core$IFn$_invoke$arity$1(e);
var highlighted_group = cljs.core.deref(new cljs.core.Keyword("frontend.components.cmdk.core","highlighted-group","frontend.components.cmdk.core/highlighted-group",618991410).cljs$core$IFn$_invoke$arity$1(state));
var show_less = (function (){
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(new cljs.core.Keyword("frontend.components.cmdk.core","results","frontend.components.cmdk.core/results",-2086115969).cljs$core$IFn$_invoke$arity$1(state),cljs.core.assoc_in,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [highlighted_group,new cljs.core.Keyword(null,"show","show",-576705889)], null),new cljs.core.Keyword(null,"less","less",-428869198));
});
var show_more = (function (){
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(new cljs.core.Keyword("frontend.components.cmdk.core","results","frontend.components.cmdk.core/results",-2086115969).cljs$core$IFn$_invoke$arity$1(state),cljs.core.assoc_in,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [highlighted_group,new cljs.core.Keyword(null,"show","show",-576705889)], null),new cljs.core.Keyword(null,"more","more",-2058821800));
});
var input = cljs.core.deref(new cljs.core.Keyword("frontend.components.cmdk.core","input","frontend.components.cmdk.core/input",-1679319815).cljs$core$IFn$_invoke$arity$1(state));
var as_keydown_QMARK_ = (function (){var or__5002__auto__ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(keyname,"ArrowDown");
if(or__5002__auto__){
return or__5002__auto__;
} else {
var and__5000__auto__ = ctrl_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(keyname,"n");
} else {
return and__5000__auto__;
}
}
})();
var as_keyup_QMARK_ = (function (){var or__5002__auto__ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(keyname,"ArrowUp");
if(or__5002__auto__){
return or__5002__auto__;
} else {
var and__5000__auto__ = ctrl_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(keyname,"p");
} else {
return and__5000__auto__;
}
}
})();
cljs.core.reset_BANG_(new cljs.core.Keyword("frontend.components.cmdk.core","shift?","frontend.components.cmdk.core/shift?",1896723736).cljs$core$IFn$_invoke$arity$1(state),shift_QMARK_);

cljs.core.reset_BANG_(new cljs.core.Keyword("frontend.components.cmdk.core","meta?","frontend.components.cmdk.core/meta?",1802788391).cljs$core$IFn$_invoke$arity$1(state),meta_QMARK_);

if(cljs.core.truth_((function (){var or__5002__auto__ = as_keydown_QMARK_;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return as_keyup_QMARK_;
}
})())){
frontend.util.stop(e);
} else {
}

if(cljs.core.truth_((function (){var and__5000__auto__ = meta_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return enter_QMARK_;
} else {
return and__5000__auto__;
}
})())){
var repo = frontend.state.get_current_repo();
(logseq.shui.ui.dialog_close_BANG_.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.dialog_close_BANG_.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"ls-dialog-cmdk","ls-dialog-cmdk",-1613937560)) : logseq.shui.ui.dialog_close_BANG_.call(null,new cljs.core.Keyword(null,"ls-dialog-cmdk","ls-dialog-cmdk",-1613937560)));

return frontend.state.sidebar_add_block_BANG_(repo,input,new cljs.core.Keyword(null,"search","search",1564939822));
} else {
if(cljs.core.truth_(as_keydown_QMARK_)){
if(cljs.core.truth_(meta_QMARK_)){
return show_more();
} else {
return frontend.components.cmdk.core.move_highlight(state,(1));
}
} else {
if(cljs.core.truth_(as_keyup_QMARK_)){
if(cljs.core.truth_(meta_QMARK_)){
return show_less();
} else {
return frontend.components.cmdk.core.move_highlight(state,(-1));
}
} else {
if(((enter_QMARK_) && (cljs.core.not(composing_QMARK_)))){
frontend.components.cmdk.core.handle_action.cljs$core$IFn$_invoke$arity$3(new cljs.core.Keyword(null,"default","default",-1987822328),state,e);

return frontend.util.stop_propagation(e);
} else {
if(esc_QMARK_){
var filter_SINGLEQUOTE_ = cljs.core.deref(new cljs.core.Keyword("frontend.components.cmdk.core","filter","frontend.components.cmdk.core/filter",279770674).cljs$core$IFn$_invoke$arity$1(state));
if(clojure.string.blank_QMARK_(input)){
} else {
frontend.util.stop(e);

frontend.components.cmdk.core.handle_input_change.cljs$core$IFn$_invoke$arity$3(state,null,"");
}

if(cljs.core.truth_((function (){var and__5000__auto__ = filter_SINGLEQUOTE_;
if(cljs.core.truth_(and__5000__auto__)){
return clojure.string.blank_QMARK_(input);
} else {
return and__5000__auto__;
}
})())){
frontend.util.stop(e);

cljs.core.reset_BANG_(new cljs.core.Keyword("frontend.components.cmdk.core","filter","frontend.components.cmdk.core/filter",279770674).cljs$core$IFn$_invoke$arity$1(state),null);

return frontend.components.cmdk.core.load_results.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"default","default",-1987822328),state);
} else {
return null;
}
} else {
if(cljs.core.truth_((function (){var and__5000__auto__ = meta_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(keyname,"c");
} else {
return and__5000__auto__;
}
})())){
frontend.components.cmdk.core.copy_block_ref(state);

return frontend.util.stop_propagation(e);
} else {
if(cljs.core.truth_((function (){var and__5000__auto__ = meta_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(keyname,"o");
} else {
return and__5000__auto__;
}
})())){
return frontend.components.cmdk.core.open_current_item_link(state);
} else {
return null;

}
}
}
}
}
}
}
});
frontend.components.cmdk.core.keyup_handler = (function frontend$components$cmdk$core$keyup_handler(state,e){
var shift_QMARK_ = e.shiftKey;
var meta_QMARK_ = frontend.util.meta_key_QMARK_(e);
cljs.core.reset_BANG_(new cljs.core.Keyword("frontend.components.cmdk.core","shift?","frontend.components.cmdk.core/shift?",1896723736).cljs$core$IFn$_invoke$arity$1(state),shift_QMARK_);

return cljs.core.reset_BANG_(new cljs.core.Keyword("frontend.components.cmdk.core","meta?","frontend.components.cmdk.core/meta?",1802788391).cljs$core$IFn$_invoke$arity$1(state),meta_QMARK_);
});
frontend.components.cmdk.core.input_placeholder = (function frontend$components$cmdk$core$input_placeholder(sidebar_QMARK_){
var search_mode = new cljs.core.Keyword("search","mode","search/mode",1628111395).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state));
var search_args = new cljs.core.Keyword("search","args","search/args",-462145864).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state));
if(((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(search_mode,new cljs.core.Keyword(null,"graph","graph",1558099509))) && (cljs.core.not(sidebar_QMARK_)))){
return "Add graph filter";
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(search_args,new cljs.core.Keyword(null,"new-page","new-page",1691458376))){
return "Type a page name to create";
} else {
return "What are you looking for?";

}
}
});
frontend.components.cmdk.core.input_row = rum.core.lazy_build(rum.core.build_defc,(function (state,all_items,opts){
var highlighted_item = cljs.core.deref(new cljs.core.Keyword("frontend.components.cmdk.core","highlighted-item","frontend.components.cmdk.core/highlighted-item",-2037503100).cljs$core$IFn$_invoke$arity$1(state));
var input = cljs.core.deref(new cljs.core.Keyword("frontend.components.cmdk.core","input","frontend.components.cmdk.core/input",-1679319815).cljs$core$IFn$_invoke$arity$1(state));
var input_ref = new cljs.core.Keyword("frontend.components.cmdk.core","input-ref","frontend.components.cmdk.core/input-ref",-581377366).cljs$core$IFn$_invoke$arity$1(state);
var debounced_on_change = logseq.shui.hooks.use_callback(goog.functions.debounce((function (e){
var new_value = e.target.value;
frontend.components.cmdk.core.handle_input_change.cljs$core$IFn$_invoke$arity$2(state,e);

var temp__5804__auto__ = new cljs.core.Keyword(null,"on-input-change","on-input-change",-1203383147).cljs$core$IFn$_invoke$arity$1(opts);
if(cljs.core.truth_(temp__5804__auto__)){
var on_change = temp__5804__auto__;
return (on_change.cljs$core$IFn$_invoke$arity$1 ? on_change.cljs$core$IFn$_invoke$arity$1(new_value) : on_change.call(null,new_value));
} else {
return null;
}
}),(200)),cljs.core.PersistentVector.EMPTY);
logseq.shui.hooks.use_effect_BANG_((function (){
if(cljs.core.truth_((function (){var and__5000__auto__ = highlighted_item;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2((-1),all_items.indexOf(cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(highlighted_item,new cljs.core.Keyword(null,"mouse-enter-triggered-highlight","mouse-enter-triggered-highlight",687876854))));
} else {
return and__5000__auto__;
}
})())){
return cljs.core.reset_BANG_(new cljs.core.Keyword("frontend.components.cmdk.core","highlighted-item","frontend.components.cmdk.core/highlighted-item",-2037503100).cljs$core$IFn$_invoke$arity$1(state),null);
} else {
return null;
}
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [all_items], null));

logseq.shui.hooks.use_effect_BANG_((function (){
return frontend.components.cmdk.core.load_results.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"default","default",-1987822328),state);
}),cljs.core.PersistentVector.EMPTY);

return daiquiri.core.create_element("div",{'className':"bg-gray-02 border-b border-1 border-gray-07"},[daiquiri.core.create_element("input",{'placeholder':frontend.components.cmdk.core.input_placeholder(false),'onCompositionEnd':goog.functions.debounce((function (e){
return frontend.components.cmdk.core.handle_input_change.cljs$core$IFn$_invoke$arity$2(state,e);
}),(100)),'ref':(function (p1__90025_SHARP_){
if(cljs.core.truth_(cljs.core.deref(input_ref))){
return null;
} else {
return cljs.core.reset_BANG_(input_ref,p1__90025_SHARP_);
}
}),'autoFocus':true,'autoComplete':"off",'onBlur':(function (_e){
var temp__5804__auto__ = new cljs.core.Keyword(null,"on-input-blur","on-input-blur",938716471).cljs$core$IFn$_invoke$arity$1(opts);
if(cljs.core.truth_(temp__5804__auto__)){
var on_blur = temp__5804__auto__;
return (on_blur.cljs$core$IFn$_invoke$arity$1 ? on_blur.cljs$core$IFn$_invoke$arity$1(input) : on_blur.call(null,input));
} else {
return null;
}
}),'className':"cp__cmdk-search-input text-xl bg-transparent border-none w-full outline-none px-3 py-3",'defaultValue':input,'onKeyDown':goog.functions.debounce((function (e){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(cljs.core.deref(input_ref).value),(function (value){
return promesa.protocols._mcat(promesa.protocols._promise(cljs.core.last(value)),(function (last_char){
return promesa.protocols._mcat(promesa.protocols._promise(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(frontend.util.ekey(e),"Backspace")),(function (backspace_QMARK_){
return promesa.protocols._mcat(promesa.protocols._promise(new cljs.core.Keyword(null,"group","group",582596132).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(new cljs.core.Keyword("frontend.components.cmdk.core","filter","frontend.components.cmdk.core/filter",279770674).cljs$core$IFn$_invoke$arity$1(state)))),(function (filter_group){
return promesa.protocols._mcat(promesa.protocols._promise(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(frontend.util.ekey(e),"/")),(function (slash_QMARK_){
return promesa.protocols._mcat(promesa.protocols._promise((cljs.core.truth_((function (){var and__5000__auto__ = slash_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"whiteboards","whiteboards",710207654),null], null), null),filter_group);
} else {
return and__5000__auto__;
}
})())?frontend.search.block_search(frontend.state.get_current_repo(),[cljs.core.str.cljs$core$IFn$_invoke$arity$1(value),"/"].join(''),cljs.core.PersistentArrayMap.EMPTY):null)),(function (namespace_pages){
return promesa.protocols._mcat(promesa.protocols._promise(cljs.core.some((function (p1__90026_SHARP_){
return clojure.string.includes_QMARK_(p1__90026_SHARP_,"/");
}),namespace_pages)),(function (namespace_page_matched_QMARK_){
return promesa.protocols._promise((cljs.core.truth_((function (){var and__5000__auto__ = filter_group;
if(cljs.core.truth_(and__5000__auto__)){
var or__5002__auto__ = (function (){var and__5000__auto____$1 = slash_QMARK_;
if(cljs.core.truth_(and__5000__auto____$1)){
return cljs.core.not(namespace_page_matched_QMARK_);
} else {
return and__5000__auto____$1;
}
})();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = (function (){var and__5000__auto____$1 = backspace_QMARK_;
if(cljs.core.truth_(and__5000__auto____$1)){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(last_char,"/");
} else {
return and__5000__auto____$1;
}
})();
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
var and__5000__auto____$1 = backspace_QMARK_;
if(cljs.core.truth_(and__5000__auto____$1)){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(input,"");
} else {
return and__5000__auto____$1;
}
}
}
} else {
return and__5000__auto__;
}
})())?(function (){
cljs.core.reset_BANG_(new cljs.core.Keyword("frontend.components.cmdk.core","filter","frontend.components.cmdk.core/filter",279770674).cljs$core$IFn$_invoke$arity$1(state),null);

return frontend.components.cmdk.core.load_results.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"default","default",-1987822328),state);
})()
:null));
}));
}));
}));
}));
}));
}));
}));
}));
}),(100)),'onChange':rum.core.mark_sync_update(debounced_on_change)},[])]);
}),null,"frontend.components.cmdk.core/input-row");
frontend.components.cmdk.core.rand_tip = (function frontend$components$cmdk$core$rand_tip(){
return cljs.core.rand_nth(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.flex-row.gap-1.items-center.opacity-50.hover:opacity-100","div.flex.flex-row.gap-1.items-center.opacity-50.hover:opacity-100",815335268),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),"Type"], null),logseq.shui.ui.shortcut("/"),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),"to filter search results"], null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.flex-row.gap-1.items-center.opacity-50.hover:opacity-100","div.flex.flex-row.gap-1.items-center.opacity-50.hover:opacity-100",815335268),logseq.shui.ui.shortcut(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["mod","enter"], null)),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),"to open search in the sidebar"], null)], null)], null));
});
frontend.components.cmdk.core.tip = rum.core.lazy_build(rum.core.build_defcs,(function (inner_state,state){
var filter_SINGLEQUOTE_ = cljs.core.deref(new cljs.core.Keyword("frontend.components.cmdk.core","filter","frontend.components.cmdk.core/filter",279770674).cljs$core$IFn$_invoke$arity$1(state));
if(cljs.core.truth_(filter_SINGLEQUOTE_)){
return daiquiri.core.create_element("div",{'className':"flex flex-row gap-1 items-center opacity-50 hover:opacity-100"},[daiquiri.core.create_element("div",null,["Type"]),daiquiri.interpreter.interpret(logseq.shui.ui.shortcut("esc",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tiled","tiled",249698823),false], null))),daiquiri.core.create_element("div",null,["to clear search filter"])]);
} else {
return daiquiri.interpreter.interpret(new cljs.core.Keyword("frontend.components.cmdk.core","rand-tip","frontend.components.cmdk.core/rand-tip",1768274415).cljs$core$IFn$_invoke$arity$1(inner_state));

}
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"init","init",-1875481434),(function (state){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(state,new cljs.core.Keyword("frontend.components.cmdk.core","rand-tip","frontend.components.cmdk.core/rand-tip",1768274415),frontend.components.cmdk.core.rand_tip());
})], null)], null),"frontend.components.cmdk.core/tip");
frontend.components.cmdk.core.hint_button = rum.core.lazy_build(rum.core.build_defc,(function (text,shortcut,opts){
return daiquiri.interpreter.interpret((function (){var G__90041 = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"class","class",-2030961996),"hint-button [&>span:first-child]:hover:opacity-100 opacity-40 hover:opacity-80",new cljs.core.Keyword(null,"variant","variant",-424354234),new cljs.core.Keyword(null,"ghost","ghost",-1531157576),new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"sm","sm",-1402575065)], null),opts], 0));
var G__90042 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.opacity-60","span.opacity-60",-1080417386),text], null),(cljs.core.truth_(cljs.core.not_empty(shortcut))?(function (){var iter__5480__auto__ = (function frontend$components$cmdk$core$iter__90043(s__90044){
return (new cljs.core.LazySeq(null,(function (){
var s__90044__$1 = s__90044;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__90044__$1);
if(temp__5804__auto__){
var s__90044__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__90044__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__90044__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__90046 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__90045 = (0);
while(true){
if((i__90045 < size__5479__auto__)){
var key = cljs.core._nth(c__5478__auto__,i__90045);
cljs.core.chunk_append(b__90046,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.ui__button-shortcut-key","div.ui__button-shortcut-key",-67904771),(function (){var G__90048 = key;
switch (G__90048) {
case "cmd":
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),(cljs.core.truth_(goog.userAgent.MAC)?"\u2318":"Ctrl")], null);

break;
case "shift":
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),"\u21E7"], null);

break;
case "return":
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),"\u23CE"], null);

break;
case "esc":
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.tracking-tightest","div.tracking-tightest",173762221),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"transform","transform",1381301764),"scaleX(0.8) scaleY(1.2) ",new cljs.core.Keyword(null,"font-size","font-size",-1847940346),"0.5rem",new cljs.core.Keyword(null,"font-weight","font-weight",2085804583),"500"], null)], null),"ESC"], null);

break;
default:
var G__90049 = key;
if(typeof key === 'string'){
return G__90049.toUpperCase();
} else {
return G__90049;
}

}
})()], null));

var G__90340 = (i__90045 + (1));
i__90045 = G__90340;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__90046),frontend$components$cmdk$core$iter__90043(cljs.core.chunk_rest(s__90044__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__90046),null);
}
} else {
var key = cljs.core.first(s__90044__$2);
return cljs.core.cons(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.ui__button-shortcut-key","div.ui__button-shortcut-key",-67904771),(function (){var G__90050 = key;
switch (G__90050) {
case "cmd":
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),(cljs.core.truth_(goog.userAgent.MAC)?"\u2318":"Ctrl")], null);

break;
case "shift":
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),"\u21E7"], null);

break;
case "return":
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),"\u23CE"], null);

break;
case "esc":
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.tracking-tightest","div.tracking-tightest",173762221),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"transform","transform",1381301764),"scaleX(0.8) scaleY(1.2) ",new cljs.core.Keyword(null,"font-size","font-size",-1847940346),"0.5rem",new cljs.core.Keyword(null,"font-weight","font-weight",2085804583),"500"], null)], null),"ESC"], null);

break;
default:
var G__90051 = key;
if(typeof key === 'string'){
return G__90051.toUpperCase();
} else {
return G__90051;
}

}
})()], null),frontend$components$cmdk$core$iter__90043(cljs.core.rest(s__90044__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(shortcut);
})():null)], null);
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2(G__90041,G__90042) : logseq.shui.ui.button.call(null,G__90041,G__90042));
})());
}),null,"frontend.components.cmdk.core/hint-button");
frontend.components.cmdk.core.hints = rum.core.lazy_build(rum.core.build_defc,(function (state){
var action = frontend.components.cmdk.core.state__GT_action(state);
var button_fn = (function() { 
var G__90344__delegate = function (text,shortcut,p__90053){
var map__90054 = p__90053;
var map__90054__$1 = cljs.core.__destructure_map(map__90054);
var opts = map__90054__$1;
return frontend.components.cmdk.core.hint_button(text,shortcut,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (p1__90052_SHARP_){
return frontend.components.cmdk.core.handle_action.cljs$core$IFn$_invoke$arity$3(action,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(state,new cljs.core.Keyword(null,"opts","opts",155075701),opts),p1__90052_SHARP_);
}),new cljs.core.Keyword(null,"muted","muted",1275109029),true], null));
};
var G__90344 = function (text,shortcut,var_args){
var p__90053 = null;
if (arguments.length > 2) {
var G__90345__i = 0, G__90345__a = new Array(arguments.length -  2);
while (G__90345__i < G__90345__a.length) {G__90345__a[G__90345__i] = arguments[G__90345__i + 2]; ++G__90345__i;}
  p__90053 = new cljs.core.IndexedSeq(G__90345__a,0,null);
} 
return G__90344__delegate.call(this,text,shortcut,p__90053);};
G__90344.cljs$lang$maxFixedArity = 2;
G__90344.cljs$lang$applyTo = (function (arglist__90346){
var text = cljs.core.first(arglist__90346);
arglist__90346 = cljs.core.next(arglist__90346);
var shortcut = cljs.core.first(arglist__90346);
var p__90053 = cljs.core.rest(arglist__90346);
return G__90344__delegate(text,shortcut,p__90053);
});
G__90344.cljs$core$IFn$_invoke$arity$variadic = G__90344__delegate;
return G__90344;
})()
;
if(cljs.core.truth_(action)){
return daiquiri.core.create_element("div",{'className':"hints"},[daiquiri.core.create_element("div",{'className':"text-sm leading-6"},[daiquiri.core.create_element("div",{'className':"flex flex-row gap-1 items-center"},[daiquiri.core.create_element("div",{'className':"font-medium text-gray-12"},["Tip:"]),frontend.components.cmdk.core.tip(state)])]),daiquiri.core.create_element("div",{'style':{'marginRight':(-6)},'className':"gap-2 hidden md:flex"},[(function (){var G__90094 = action;
var G__90094__$1 = (((G__90094 instanceof cljs.core.Keyword))?G__90094.fqn:null);
switch (G__90094__$1) {
case "open":
var attrs90068 = button_fn("Open",new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["return"], null));
return daiquiri.core.create_element(daiquiri.core.fragment,((cljs.core.map_QMARK_(attrs90068))?daiquiri.interpreter.element_attributes(attrs90068):null),((cljs.core.map_QMARK_(attrs90068))?[daiquiri.interpreter.interpret(button_fn("Open in sidebar",new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["shift","return"], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"open-sidebar?","open-sidebar?",1933561166),true], null))),(cljs.core.truth_(new cljs.core.Keyword(null,"source-block","source-block",-878290804).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(new cljs.core.Keyword("frontend.components.cmdk.core","highlighted-item","frontend.components.cmdk.core/highlighted-item",-2037503100).cljs$core$IFn$_invoke$arity$1(state))))?daiquiri.interpreter.interpret(button_fn("Copy ref",new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["\u2318","c"], null))):null)]:[daiquiri.interpreter.interpret(attrs90068),daiquiri.interpreter.interpret(button_fn("Open in sidebar",new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["shift","return"], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"open-sidebar?","open-sidebar?",1933561166),true], null))),(cljs.core.truth_(new cljs.core.Keyword(null,"source-block","source-block",-878290804).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(new cljs.core.Keyword("frontend.components.cmdk.core","highlighted-item","frontend.components.cmdk.core/highlighted-item",-2037503100).cljs$core$IFn$_invoke$arity$1(state))))?daiquiri.interpreter.interpret(button_fn("Copy ref",new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["\u2318","c"], null))):null)]));

break;
case "search":
var attrs90073 = button_fn("Search",new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["return"], null));
return daiquiri.core.create_element(daiquiri.core.fragment,((cljs.core.map_QMARK_(attrs90073))?daiquiri.interpreter.element_attributes(attrs90073):null),((cljs.core.map_QMARK_(attrs90073))?null:[daiquiri.interpreter.interpret(attrs90073)]));

break;
case "trigger":
var attrs90078 = button_fn("Trigger",new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["return"], null));
return daiquiri.core.create_element(daiquiri.core.fragment,((cljs.core.map_QMARK_(attrs90078))?daiquiri.interpreter.element_attributes(attrs90078):null),((cljs.core.map_QMARK_(attrs90078))?null:[daiquiri.interpreter.interpret(attrs90078)]));

break;
case "create":
var attrs90085 = button_fn("Create",new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["return"], null));
return daiquiri.core.create_element(daiquiri.core.fragment,((cljs.core.map_QMARK_(attrs90085))?daiquiri.interpreter.element_attributes(attrs90085):null),((cljs.core.map_QMARK_(attrs90085))?null:[daiquiri.interpreter.interpret(attrs90085)]));

break;
case "filter":
var attrs90093 = button_fn("Filter",new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["return"], null));
return daiquiri.core.create_element(daiquiri.core.fragment,((cljs.core.map_QMARK_(attrs90093))?daiquiri.interpreter.element_attributes(attrs90093):null),((cljs.core.map_QMARK_(attrs90093))?null:[daiquiri.interpreter.interpret(attrs90093)]));

break;
default:
return null;

}
})()])]);
} else {
return null;
}
}),null,"frontend.components.cmdk.core/hints");
frontend.components.cmdk.core.search_only = rum.core.lazy_build(rum.core.build_defc,(function (state,group_name){
return daiquiri.core.create_element("div",{'className':"flex flex-row gap-1 items-center"},[daiquiri.core.create_element("div",null,["Search only:"]),(function (){var attrs90101 = group_name;
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs90101))?daiquiri.interpreter.element_attributes(attrs90101):null),((cljs.core.map_QMARK_(attrs90101))?null:[daiquiri.interpreter.interpret(attrs90101)]));
})(),daiquiri.interpreter.interpret((function (){var G__90120 = new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"variant","variant",-424354234),new cljs.core.Keyword(null,"ghost","ghost",-1531157576),new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"icon","icon",1679606541),new cljs.core.Keyword(null,"class","class",-2030961996),"p-1 scale-75",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return cljs.core.reset_BANG_(new cljs.core.Keyword("frontend.components.cmdk.core","filter","frontend.components.cmdk.core/filter",279770674).cljs$core$IFn$_invoke$arity$1(state),null);
})], null);
var G__90121 = logseq.shui.ui.tabler_icon("x");
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2(G__90120,G__90121) : logseq.shui.ui.button.call(null,G__90120,G__90121));
})())]);
}),null,"frontend.components.cmdk.core/search-only");
frontend.components.cmdk.core.cmdk = rum.core.lazy_build(rum.core.build_defcs,(function (state,p__90130){
var map__90132 = p__90130;
var map__90132__$1 = cljs.core.__destructure_map(map__90132);
var opts = map__90132__$1;
var sidebar_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__90132__$1,new cljs.core.Keyword(null,"sidebar?","sidebar?",-534999672));
var _STAR_input = new cljs.core.Keyword("frontend.components.cmdk.core","input","frontend.components.cmdk.core/input",-1679319815).cljs$core$IFn$_invoke$arity$1(state);
var search_mode = new cljs.core.Keyword("search","mode","search/mode",1628111395).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state));
var group_filter = new cljs.core.Keyword(null,"group","group",582596132).cljs$core$IFn$_invoke$arity$1(rum.core.react(new cljs.core.Keyword("frontend.components.cmdk.core","filter","frontend.components.cmdk.core/filter",279770674).cljs$core$IFn$_invoke$arity$1(state)));
var results_ordered = frontend.components.cmdk.core.state__GT_results_ordered(state,search_mode);
var all_items = cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic(cljs.core.last,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([results_ordered], 0));
var first_item = cljs.core.first(all_items);
return daiquiri.core.create_element("div",{'ref':(function (p1__90124_SHARP_){
if(cljs.core.truth_(cljs.core.deref(new cljs.core.Keyword("frontend.components.cmdk.core","ref","frontend.components.cmdk.core/ref",-1767389561).cljs$core$IFn$_invoke$arity$1(state)))){
return null;
} else {
return cljs.core.reset_BANG_(new cljs.core.Keyword("frontend.components.cmdk.core","ref","frontend.components.cmdk.core/ref",-1767389561).cljs$core$IFn$_invoke$arity$1(state),p1__90124_SHARP_);
}
}),'className':daiquiri.util.join_classes(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["cp__cmdk",(function (){var G__90136 = "w-full h-full relative flex flex-col justify-start";
if(cljs.core.not(sidebar_QMARK_)){
return [G__90136," rounded-lg"].join('');
} else {
return G__90136;
}
})()], null))},[frontend.components.cmdk.core.input_row(state,all_items,opts),daiquiri.core.create_element("div",{'ref':(function (p1__90125_SHARP_){
var _STAR_ref = new cljs.core.Keyword("frontend.components.cmdk.core","scroll-container-ref","frontend.components.cmdk.core/scroll-container-ref",1170500984).cljs$core$IFn$_invoke$arity$1(state);
if(cljs.core.truth_(cljs.core.deref(_STAR_ref))){
return null;
} else {
return cljs.core.reset_BANG_(_STAR_ref,p1__90125_SHARP_);
}
}),'style':{'background':"var(--lx-gray-02)",'scrollPaddingBlock':(32)},'className':daiquiri.util.join_classes(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [(function (){var G__90138 = "w-full flex-1 overflow-y-auto min-h-[65dvh] max-h-[65dvh]";
if(cljs.core.not(sidebar_QMARK_)){
return [G__90138," pb-14"].join('');
} else {
return G__90138;
}
})()], null))},[(cljs.core.truth_(group_filter)?daiquiri.core.create_element("div",{'className':"flex flex-col px-3 py-1 opacity-70 text-sm"},[frontend.components.cmdk.core.search_only(state,clojure.string.capitalize(cljs.core.name(group_filter)))]):null),(function (){var items = cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (p__90144){
var vec__90148 = p__90144;
var _group_name = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__90148,(0),null);
var group_key = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__90148,(1),null);
var group_count = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__90148,(2),null);
var _group_items = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__90148,(3),null);
var and__5000__auto__ = cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2((0),group_count);
if(and__5000__auto__){
if(cljs.core.not(group_filter)){
return true;
} else {
return ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(group_filter,group_key)) || (((((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(group_filter,new cljs.core.Keyword(null,"nodes","nodes",-2099585805))) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(group_key,new cljs.core.Keyword(null,"current-page","current-page",-101294180))))) || (((cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"create","create",-1301499256),null], null), null),group_filter)) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(group_key,new cljs.core.Keyword(null,"create","create",-1301499256))))))));
}
} else {
return and__5000__auto__;
}
}),results_ordered);
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["Filters"], null),cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.first,items))){
return null;
} else {
if(cljs.core.seq(items)){
return cljs.core.into_array.cljs$core$IFn$_invoke$arity$1((function (){var iter__5480__auto__ = (function frontend$components$cmdk$core$iter__90156(s__90157){
return (new cljs.core.LazySeq(null,(function (){
var s__90157__$1 = s__90157;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__90157__$1);
if(temp__5804__auto__){
var s__90157__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__90157__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__90157__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__90159 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__90158 = (0);
while(true){
if((i__90158 < size__5479__auto__)){
var vec__90163 = cljs.core._nth(c__5478__auto__,i__90158);
var group_name = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__90163,(0),null);
var group_key = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__90163,(1),null);
var _group_count = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__90163,(2),null);
var group_items = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__90163,(3),null);
cljs.core.chunk_append(b__90159,(function (){var title = clojure.string.capitalize(group_name);
return frontend.components.cmdk.core.result_group(state,title,group_key,group_items,first_item,sidebar_QMARK_);
})());

var G__90362 = (i__90158 + (1));
i__90158 = G__90362;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__90159),frontend$components$cmdk$core$iter__90156(cljs.core.chunk_rest(s__90157__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__90159),null);
}
} else {
var vec__90166 = cljs.core.first(s__90157__$2);
var group_name = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__90166,(0),null);
var group_key = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__90166,(1),null);
var _group_count = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__90166,(2),null);
var group_items = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__90166,(3),null);
return cljs.core.cons((function (){var title = clojure.string.capitalize(group_name);
return frontend.components.cmdk.core.result_group(state,title,group_key,group_items,first_item,sidebar_QMARK_);
})(),frontend$components$cmdk$core$iter__90156(cljs.core.rest(s__90157__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(items);
})());
} else {
return daiquiri.core.create_element("div",{'className':"flex flex-col p-4 opacity-50"},[((clojure.string.blank_QMARK_(cljs.core.deref(_STAR_input)))?null:"No matched results")]);
}
}
})()]),(cljs.core.truth_(sidebar_QMARK_)?null:frontend.components.cmdk.core.hints(state))]);
}),new cljs.core.PersistentVector(null, 13, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.static$,rum.core.reactive,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"will-mount","will-mount",-434633071),(function (state){
if(cljs.core.truth_(new cljs.core.Keyword(null,"sidebar?","sidebar?",-534999672).cljs$core$IFn$_invoke$arity$1(cljs.core.last(new cljs.core.Keyword("rum","args","rum/args",1315791754).cljs$core$IFn$_invoke$arity$1(state))))){
} else {
frontend.modules.shortcut.core.unlisten_all_BANG_.cljs$core$IFn$_invoke$arity$0();
}

return state;
}),new cljs.core.Keyword(null,"will-unmount","will-unmount",-808051550),(function (state){
if(cljs.core.truth_(new cljs.core.Keyword(null,"sidebar?","sidebar?",-534999672).cljs$core$IFn$_invoke$arity$1(cljs.core.last(new cljs.core.Keyword("rum","args","rum/args",1315791754).cljs$core$IFn$_invoke$arity$1(state))))){
} else {
frontend.modules.shortcut.core.listen_all_BANG_();
}

return state;
})], null),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"init","init",-1875481434),(function (state){
var search_mode = new cljs.core.Keyword("search","mode","search/mode",1628111395).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state));
var opts = cljs.core.last(new cljs.core.Keyword("rum","args","rum/args",1315791754).cljs$core$IFn$_invoke$arity$1(state));
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(state,new cljs.core.Keyword("frontend.components.cmdk.core","ref","frontend.components.cmdk.core/ref",-1767389561),cljs.core.atom.cljs$core$IFn$_invoke$arity$1(null),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("frontend.components.cmdk.core","filter","frontend.components.cmdk.core/filter",279770674),(cljs.core.truth_((function (){var and__5000__auto__ = search_mode;
if(cljs.core.truth_(and__5000__auto__)){
return (((!(cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"global","global",93595047),null,new cljs.core.Keyword(null,"graph","graph",1558099509),null], null), null),search_mode)))) && (cljs.core.not(new cljs.core.Keyword(null,"sidebar?","sidebar?",-534999672).cljs$core$IFn$_invoke$arity$1(opts))));
} else {
return and__5000__auto__;
}
})())?cljs.core.atom.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"group","group",582596132),search_mode], null)):cljs.core.atom.cljs$core$IFn$_invoke$arity$1(null)),new cljs.core.Keyword("frontend.components.cmdk.core","input","frontend.components.cmdk.core/input",-1679319815),cljs.core.atom.cljs$core$IFn$_invoke$arity$1((function (){var or__5002__auto__ = new cljs.core.Keyword(null,"initial-input","initial-input",1864686534).cljs$core$IFn$_invoke$arity$1(opts);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return "";
}
})())], 0));
}),new cljs.core.Keyword(null,"will-unmount","will-unmount",-808051550),(function (state){
frontend.state.set_state_BANG_(new cljs.core.Keyword("search","mode","search/mode",1628111395),null);

frontend.state.set_state_BANG_(new cljs.core.Keyword("search","args","search/args",-462145864),null);

return state;
})], null),frontend.mixins.event_mixin.cljs$core$IFn$_invoke$arity$1((function (state){
var ref = cljs.core.deref(new cljs.core.Keyword("frontend.components.cmdk.core","ref","frontend.components.cmdk.core/ref",-1767389561).cljs$core$IFn$_invoke$arity$1(state));
frontend.mixins.on_key_down.cljs$core$IFn$_invoke$arity$3(state,cljs.core.PersistentArrayMap.EMPTY,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"target","target",253001721),ref,new cljs.core.Keyword(null,"all-handler","all-handler",396726950),(function (e,_key){
return frontend.components.cmdk.core.keydown_handler(state,e);
})], null));

return frontend.mixins.on_key_up(state,cljs.core.PersistentArrayMap.EMPTY,(function (e,_key){
return frontend.components.cmdk.core.keyup_handler(state,e);
}));
})),rum.core.local.cljs$core$IFn$_invoke$arity$2(false,new cljs.core.Keyword("frontend.components.cmdk.core","shift?","frontend.components.cmdk.core/shift?",1896723736)),rum.core.local.cljs$core$IFn$_invoke$arity$2(false,new cljs.core.Keyword("frontend.components.cmdk.core","meta?","frontend.components.cmdk.core/meta?",1802788391)),rum.core.local.cljs$core$IFn$_invoke$arity$2(null,new cljs.core.Keyword("frontend.components.cmdk.core","highlighted-group","frontend.components.cmdk.core/highlighted-group",618991410)),rum.core.local.cljs$core$IFn$_invoke$arity$2(null,new cljs.core.Keyword("frontend.components.cmdk.core","highlighted-item","frontend.components.cmdk.core/highlighted-item",-2037503100)),rum.core.local.cljs$core$IFn$_invoke$arity$2(frontend.components.cmdk.core.default_results,new cljs.core.Keyword("frontend.components.cmdk.core","results","frontend.components.cmdk.core/results",-2086115969)),rum.core.local.cljs$core$IFn$_invoke$arity$2(null,new cljs.core.Keyword("frontend.components.cmdk.core","scroll-container-ref","frontend.components.cmdk.core/scroll-container-ref",1170500984)),rum.core.local.cljs$core$IFn$_invoke$arity$2(null,new cljs.core.Keyword("frontend.components.cmdk.core","input-ref","frontend.components.cmdk.core/input-ref",-581377366)),rum.core.local.cljs$core$IFn$_invoke$arity$2(false,new cljs.core.Keyword("frontend.components.cmdk.core","input-changed?","frontend.components.cmdk.core/input-changed?",555016439))], null),"frontend.components.cmdk.core/cmdk");
frontend.components.cmdk.core.cmdk_modal = rum.core.lazy_build(rum.core.build_defc,(function (props){
return daiquiri.core.create_element("div",{'className':"cp__cmdk__modal rounded-lg w-[90dvw] max-w-4xl relative"},[frontend.components.cmdk.core.cmdk(props)]);
}),null,"frontend.components.cmdk.core/cmdk-modal");
frontend.components.cmdk.core.cmdk_block = rum.core.lazy_build(rum.core.build_defc,(function (props){
return daiquiri.core.create_element("div",{'className':"cp__cmdk__block rounded-md"},[frontend.components.cmdk.core.cmdk(props)]);
}),null,"frontend.components.cmdk.core/cmdk-block");

//# sourceMappingURL=frontend.components.cmdk.core.js.map
