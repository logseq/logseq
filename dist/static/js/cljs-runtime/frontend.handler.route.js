goog.provide('frontend.handler.route');
/**
 * If `push` is truthy, previous page will be left in history.
 */
frontend.handler.route.redirect_BANG_ = (function frontend$handler$route$redirect_BANG_(p__103729){
var map__103730 = p__103729;
var map__103730__$1 = cljs.core.__destructure_map(map__103730);
var to = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__103730__$1,new cljs.core.Keyword(null,"to","to",192099007));
var path_params = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__103730__$1,new cljs.core.Keyword(null,"path-params","path-params",-48130597));
var query_params = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__103730__$1,new cljs.core.Keyword(null,"query-params","query-params",900640534));
var push = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__103730__$1,new cljs.core.Keyword(null,"push","push",799791267),true);
(logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$0 ? logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$0() : logseq.shui.ui.popup_hide_BANG_.call(null));

var route_fn_103926 = (cljs.core.truth_(push)?reitit.frontend.easy.push_state:reitit.frontend.easy.replace_state);
(route_fn_103926.cljs$core$IFn$_invoke$arity$3 ? route_fn_103926.cljs$core$IFn$_invoke$arity$3(to,path_params,query_params) : route_fn_103926.call(null,to,path_params,query_params));

return null;
});
frontend.handler.route.redirect_to_home_BANG_ = (function frontend$handler$route$redirect_to_home_BANG_(var_args){
var G__103741 = arguments.length;
switch (G__103741) {
case 0:
return frontend.handler.route.redirect_to_home_BANG_.cljs$core$IFn$_invoke$arity$0();

break;
case 1:
return frontend.handler.route.redirect_to_home_BANG_.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.handler.route.redirect_to_home_BANG_.cljs$core$IFn$_invoke$arity$0 = (function (){
return frontend.handler.route.redirect_to_home_BANG_.cljs$core$IFn$_invoke$arity$1(true);
}));

(frontend.handler.route.redirect_to_home_BANG_.cljs$core$IFn$_invoke$arity$1 = (function (pub_event_QMARK_){
if(cljs.core.truth_(pub_event_QMARK_)){
frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"redirect-to-home","redirect-to-home",236144576)], null));
} else {
}

return frontend.handler.route.redirect_BANG_(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"to","to",192099007),new cljs.core.Keyword(null,"home","home",-74557309)], null));
}));

(frontend.handler.route.redirect_to_home_BANG_.cljs$lang$maxFixedArity = 1);

frontend.handler.route.redirect_to_all_pages_BANG_ = (function frontend$handler$route$redirect_to_all_pages_BANG_(){
return frontend.handler.route.redirect_BANG_(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"to","to",192099007),new cljs.core.Keyword(null,"all-pages","all-pages",1017563062)], null));
});
frontend.handler.route.redirect_to_graph_view_BANG_ = (function frontend$handler$route$redirect_to_graph_view_BANG_(){
return frontend.handler.route.redirect_BANG_(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"to","to",192099007),new cljs.core.Keyword(null,"graph","graph",1558099509)], null));
});
frontend.handler.route.redirect_to_all_graphs = (function frontend$handler$route$redirect_to_all_graphs(){
return frontend.handler.route.redirect_BANG_(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"to","to",192099007),new cljs.core.Keyword(null,"graphs","graphs",-1584479112)], null));
});
frontend.handler.route.redirect_to_whiteboard_dashboard_BANG_ = (function frontend$handler$route$redirect_to_whiteboard_dashboard_BANG_(){
return frontend.handler.route.redirect_BANG_(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"to","to",192099007),new cljs.core.Keyword(null,"whiteboards","whiteboards",710207654)], null));
});
if(frontend.util.web_platform_QMARK_){
frontend.handler.route.default_page_route = (function frontend$handler$route$default_page_route(page_name_or_block_uuid){
var block = ((cljs.core.uuid_QMARK_(page_name_or_block_uuid))?frontend.db.model.get_block_by_uuid(page_name_or_block_uuid):null);
if(cljs.core.truth_(frontend.handler.property.util.lookup(block,new cljs.core.Keyword("logseq.property","heading","logseq.property/heading",1858749415)))){
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"to","to",192099007),new cljs.core.Keyword(null,"page-block","page-block",504302814),new cljs.core.Keyword(null,"path-params","path-params",-48130597),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"name","name",1843675177),cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(block,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","page","block/page",822314108),new cljs.core.Keyword("block","name","block/name",1619760316)], null)),new cljs.core.Keyword(null,"block-route-name","block-route-name",1558267328),frontend.db.model.heading_content__GT_route_name(new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(block))], null)], null);
} else {
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"to","to",192099007),new cljs.core.Keyword(null,"page","page",849072397),new cljs.core.Keyword(null,"path-params","path-params",-48130597),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"name","name",1843675177),((typeof page_name_or_block_uuid === 'string')?(frontend.util.page_name_sanity_lc.cljs$core$IFn$_invoke$arity$1 ? frontend.util.page_name_sanity_lc.cljs$core$IFn$_invoke$arity$1(page_name_or_block_uuid) : frontend.util.page_name_sanity_lc.call(null,page_name_or_block_uuid)):cljs.core.str.cljs$core$IFn$_invoke$arity$1(page_name_or_block_uuid))], null)], null);
}
});
} else {
frontend.handler.route.default_page_route = (function frontend$handler$route$default_page_route(page_name){
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"to","to",192099007),new cljs.core.Keyword(null,"page","page",849072397),new cljs.core.Keyword(null,"path-params","path-params",-48130597),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"name","name",1843675177),cljs.core.str.cljs$core$IFn$_invoke$arity$1(page_name)], null)], null);
});
}
/**
 * `page-name` can be a block uuid or name, prefer to use uuid than name when possible
 */
frontend.handler.route.redirect_to_page_BANG_ = (function frontend$handler$route$redirect_to_page_BANG_(var_args){
var G__103764 = arguments.length;
switch (G__103764) {
case 1:
return frontend.handler.route.redirect_to_page_BANG_.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return frontend.handler.route.redirect_to_page_BANG_.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.handler.route.redirect_to_page_BANG_.cljs$core$IFn$_invoke$arity$1 = (function (page_name){
return frontend.handler.route.redirect_to_page_BANG_.cljs$core$IFn$_invoke$arity$2(page_name,cljs.core.PersistentArrayMap.EMPTY);
}));

(frontend.handler.route.redirect_to_page_BANG_.cljs$core$IFn$_invoke$arity$2 = (function (page_name,p__103765){
var map__103766 = p__103765;
var map__103766__$1 = cljs.core.__destructure_map(map__103766);
var opts = map__103766__$1;
var anchor = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__103766__$1,new cljs.core.Keyword(null,"anchor","anchor",1549638489));
var push = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__103766__$1,new cljs.core.Keyword(null,"push","push",799791267));
var click_from_recent_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__103766__$1,new cljs.core.Keyword(null,"click-from-recent?","click-from-recent?",-1191845464),false);
var block_id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__103766__$1,new cljs.core.Keyword(null,"block-id","block-id",-70582834));
var new_whiteboard_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__103766__$1,new cljs.core.Keyword(null,"new-whiteboard?","new-whiteboard?",-360865129));
var ignore_alias_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__103766__$1,new cljs.core.Keyword(null,"ignore-alias?","ignore-alias?",1336725364));
if(((cljs.core.uuid_QMARK_(page_name)) || (((typeof page_name === 'string') && ((!(clojure.string.blank_QMARK_(page_name)))))))){
var page = (frontend.db.get_page.cljs$core$IFn$_invoke$arity$1 ? frontend.db.get_page.cljs$core$IFn$_invoke$arity$1(page_name) : frontend.db.get_page.call(null,page_name));
var whiteboard_QMARK_ = (frontend.db.whiteboard_page_QMARK_.cljs$core$IFn$_invoke$arity$1 ? frontend.db.whiteboard_page_QMARK_.cljs$core$IFn$_invoke$arity$1(page) : frontend.db.whiteboard_page_QMARK_.call(null,page));
if(cljs.core.truth_((function (){var and__5000__auto__ = cljs.core.not(frontend.config.dev_QMARK_);
if(and__5000__auto__){
var or__5002__auto__ = (function (){var and__5000__auto____$1 = (logseq.db.hidden_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.hidden_QMARK_.cljs$core$IFn$_invoke$arity$1(page) : logseq.db.hidden_QMARK_.call(null,page));
if(cljs.core.truth_(and__5000__auto____$1)){
return cljs.core.not((logseq.db.property_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.property_QMARK_.cljs$core$IFn$_invoke$arity$1(page) : logseq.db.property_QMARK_.call(null,page)));
} else {
return and__5000__auto____$1;
}
})();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var and__5000__auto____$1 = (logseq.db.built_in_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.built_in_QMARK_.cljs$core$IFn$_invoke$arity$1(page) : logseq.db.built_in_QMARK_.call(null,page));
if(cljs.core.truth_(and__5000__auto____$1)){
return (logseq.db.private_built_in_page_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.private_built_in_page_QMARK_.cljs$core$IFn$_invoke$arity$1(page) : logseq.db.private_built_in_page_QMARK_.call(null,page));
} else {
return and__5000__auto____$1;
}
}
} else {
return and__5000__auto__;
}
})())){
return frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$2("Cannot go to an internal page.",new cljs.core.Keyword(null,"warning","warning",-1685650671));
} else {
var temp__5802__auto__ = (function (){var and__5000__auto__ = cljs.core.not(ignore_alias_QMARK_);
if(and__5000__auto__){
var G__103771 = frontend.state.get_current_repo();
var G__103772 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(page);
return (frontend.db.get_alias_source_page.cljs$core$IFn$_invoke$arity$2 ? frontend.db.get_alias_source_page.cljs$core$IFn$_invoke$arity$2(G__103771,G__103772) : frontend.db.get_alias_source_page.call(null,G__103771,G__103772));
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5802__auto__)){
var source = temp__5802__auto__;
return frontend.handler.route.redirect_to_page_BANG_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(source),opts);
} else {
if(cljs.core.truth_(new_whiteboard_QMARK_)){
} else {
frontend.state.set_onboarding_whiteboard_BANG_(true);
}

var temp__5804__auto___103934 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(page);
if(cljs.core.truth_(temp__5804__auto___103934)){
var db_id_103935 = temp__5804__auto___103934;
frontend.handler.recent.add_page_to_recent_BANG_(db_id_103935,click_from_recent_QMARK_);
} else {
}

if(cljs.core.truth_((function (){var and__5000__auto__ = whiteboard_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
var and__5000__auto____$1 = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.str.cljs$core$IFn$_invoke$arity$1(page_name),frontend.state.get_current_page());
if(and__5000__auto____$1){
return block_id;
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})())){
return frontend.state.focus_whiteboard_shape.cljs$core$IFn$_invoke$arity$1(block_id);
} else {
var m = (function (){var G__103774 = frontend.handler.route.default_page_route(cljs.core.str.cljs$core$IFn$_invoke$arity$1(page_name));
var G__103774__$1 = (cljs.core.truth_(block_id)?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__103774,new cljs.core.Keyword(null,"query-params","query-params",900640534),(cljs.core.truth_(whiteboard_QMARK_)?new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"block-id","block-id",-70582834),block_id], null):new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"anchor","anchor",1549638489),["ls-block-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(block_id)].join('')], null))):G__103774);
var G__103774__$2 = (cljs.core.truth_(anchor)?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__103774__$1,new cljs.core.Keyword(null,"query-params","query-params",900640534),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"anchor","anchor",1549638489),anchor], null)):G__103774__$1);
if(cljs.core.boolean_QMARK_(push)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__103774__$2,new cljs.core.Keyword(null,"push","push",799791267),push);
} else {
return G__103774__$2;
}
})();
return frontend.handler.route.redirect_BANG_(m);
}
}
}
} else {
return null;
}
}));

(frontend.handler.route.redirect_to_page_BANG_.cljs$lang$maxFixedArity = 2);

frontend.handler.route.get_title = (function frontend$handler$route$get_title(name,path_params){
var G__103780 = name;
var G__103780__$1 = (((G__103780 instanceof cljs.core.Keyword))?G__103780.fqn:null);
switch (G__103780__$1) {
case "home":
return "Logseq";

break;
case "whiteboards":
return frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"whiteboards","whiteboards",710207654)], 0));

break;
case "graphs":
return "Graphs";

break;
case "graph":
return frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"graph","graph",1558099509)], 0));

break;
case "all-files":
return frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"all-files","all-files",1120339891)], 0));

break;
case "all-pages":
return frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"all-pages","all-pages",1017563062)], 0));

break;
case "all-journals":
return frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"all-journals","all-journals",-347015095)], 0));

break;
case "file":
return ["File ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"path","path",-188191168).cljs$core$IFn$_invoke$arity$1(path_params))].join('');

break;
case "new-page":
return "Create a new page";

break;
case "page":
var name__$1 = new cljs.core.Keyword(null,"name","name",1843675177).cljs$core$IFn$_invoke$arity$1(path_params);
var page = (frontend.db.get_page.cljs$core$IFn$_invoke$arity$1 ? frontend.db.get_page.cljs$core$IFn$_invoke$arity$1(name__$1) : frontend.db.get_page.call(null,name__$1));
var page__$1 = (function (){var and__5000__auto__ = (frontend.db.page_QMARK_.cljs$core$IFn$_invoke$arity$1 ? frontend.db.page_QMARK_.cljs$core$IFn$_invoke$arity$1(page) : frontend.db.page_QMARK_.call(null,page));
if(cljs.core.truth_(and__5000__auto__)){
return page;
} else {
return and__5000__auto__;
}
})();
var block_QMARK_ = (frontend.util.uuid_string_QMARK_.cljs$core$IFn$_invoke$arity$1 ? frontend.util.uuid_string_QMARK_.cljs$core$IFn$_invoke$arity$1(name__$1) : frontend.util.uuid_string_QMARK_.call(null,name__$1));
var block_title = (cljs.core.truth_((function (){var and__5000__auto__ = block_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.not(page__$1);
} else {
return and__5000__auto__;
}
})())?(function (){var temp__5804__auto__ = (function (){var G__103789 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),cljs.core.uuid(name__$1)], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__103789) : frontend.db.entity.call(null,G__103789));
})();
if(cljs.core.truth_(temp__5804__auto__)){
var block = temp__5804__auto__;
var content = logseq.graph_parser.text.remove_level_spaces.cljs$core$IFn$_invoke$arity$3(new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(block),cljs.core.get.cljs$core$IFn$_invoke$arity$3(block,new cljs.core.Keyword("block","format","block/format",-1212045901),new cljs.core.Keyword(null,"markdown","markdown",1227225089)),frontend.config.get_block_pattern(cljs.core.get.cljs$core$IFn$_invoke$arity$3(block,new cljs.core.Keyword("block","format","block/format",-1212045901),new cljs.core.Keyword(null,"markdown","markdown",1227225089))));
if((cljs.core.count(content) > (48))){
return [cljs.core.subs.cljs$core$IFn$_invoke$arity$3(content,(0),(48)),"..."].join('');
} else {
return content;
}
} else {
return null;
}
})():null);
var block_name = new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(page__$1);
var block_name_SINGLEQUOTE_ = (cljs.core.truth_(block_name)?((logseq.common.util.uuid_string_QMARK_(block_name))?"Untitled":block_name):null);
var or__5002__auto__ = block_name_SINGLEQUOTE_;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = block_title;
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
return "Logseq";
}
}

break;
case "tag":
return ["#",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"name","name",1843675177).cljs$core$IFn$_invoke$arity$1(path_params))].join('');

break;
case "diff":
return "Git diff";

break;
case "draw":
return "Draw";

break;
case "settings":
return "Settings";

break;
case "import":
return "Import data into Logseq";

break;
default:
return "Logseq";

}
});
frontend.handler.route.update_page_title_BANG_ = (function frontend$handler$route$update_page_title_BANG_(route){
var map__103805 = route;
var map__103805__$1 = cljs.core.__destructure_map(map__103805);
var data = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__103805__$1,new cljs.core.Keyword(null,"data","data",-232669377));
var path_params = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__103805__$1,new cljs.core.Keyword(null,"path-params","path-params",-48130597));
var title = frontend.handler.route.get_title(new cljs.core.Keyword(null,"name","name",1843675177).cljs$core$IFn$_invoke$arity$1(data),path_params);
var hls_QMARK_ = frontend.extensions.pdf.utils.hls_file_QMARK_(title);
return frontend.util.set_title_BANG_((cljs.core.truth_(hls_QMARK_)?frontend.extensions.pdf.utils.fix_local_asset_pagename(title):title));
});
frontend.handler.route.update_page_label_BANG_ = (function frontend$handler$route$update_page_label_BANG_(route){
var map__103815 = route;
var map__103815__$1 = cljs.core.__destructure_map(map__103815);
var data = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__103815__$1,new cljs.core.Keyword(null,"data","data",-232669377));
var temp__5804__auto__ = new cljs.core.Keyword(null,"name","name",1843675177).cljs$core$IFn$_invoke$arity$1(data);
if(cljs.core.truth_(temp__5804__auto__)){
var data_name = temp__5804__auto__;
return (document.body.dataset.page = frontend.handler.route.get_title(data_name,new cljs.core.Keyword(null,"path-params","path-params",-48130597).cljs$core$IFn$_invoke$arity$1(route)));
} else {
return null;
}
});
frontend.handler.route.update_page_title_and_label_BANG_ = (function frontend$handler$route$update_page_title_and_label_BANG_(route){
frontend.handler.route.update_page_title_BANG_(route);

return frontend.handler.route.update_page_label_BANG_(route);
});
frontend.handler.route.jump_to_anchor_BANG_ = (function frontend$handler$route$jump_to_anchor_BANG_(anchor_text){
if(cljs.core.truth_(anchor_text)){
setTimeout((function (){
return frontend.handler.ui.highlight_element_BANG_(anchor_text);
}),(200));

var temp__5804__auto__ = new cljs.core.Keyword("editor","virtualized-scroll-fn","editor/virtualized-scroll-fn",-343790237).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state));
if(cljs.core.truth_(temp__5804__auto__)){
var f = temp__5804__auto__;
return (f.cljs$core$IFn$_invoke$arity$0 ? f.cljs$core$IFn$_invoke$arity$0() : f.call(null));
} else {
return null;
}
} else {
return null;
}
});
frontend.handler.route.set_route_match_BANG_ = (function frontend$handler$route$set_route_match_BANG_(route){
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(frontend.state.state,cljs.core.assoc,new cljs.core.Keyword(null,"route-match","route-match",-1450985937),route);

frontend.handler.route.update_page_title_BANG_(route);

frontend.handler.route.update_page_label_BANG_(route);

var temp__5804__auto__ = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(route,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"query-params","query-params",900640534),new cljs.core.Keyword(null,"anchor","anchor",1549638489)], null));
if(cljs.core.truth_(temp__5804__auto__)){
var anchor = temp__5804__auto__;
return frontend.handler.route.jump_to_anchor_BANG_(anchor);
} else {
return null;
}
});
frontend.handler.route.restore_scroll_pos = (function frontend$handler$route$restore_scroll_pos(){
return setTimeout((function (){
return frontend.util.scroll_to.cljs$core$IFn$_invoke$arity$3(frontend.util.app_scroll_container_node.cljs$core$IFn$_invoke$arity$0(),frontend.state.get_saved_scroll_position.cljs$core$IFn$_invoke$arity$0(),false);
}),(100));
});
frontend.handler.route.go_to_search_BANG_ = (function frontend$handler$route$go_to_search_BANG_(var_args){
var G__103856 = arguments.length;
switch (G__103856) {
case 1:
return frontend.handler.route.go_to_search_BANG_.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return frontend.handler.route.go_to_search_BANG_.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.handler.route.go_to_search_BANG_.cljs$core$IFn$_invoke$arity$1 = (function (search_mode){
return frontend.handler.route.go_to_search_BANG_.cljs$core$IFn$_invoke$arity$2(search_mode,null);
}));

(frontend.handler.route.go_to_search_BANG_.cljs$core$IFn$_invoke$arity$2 = (function (search_mode,args){
frontend.handler.search.clear_search_BANG_.cljs$core$IFn$_invoke$arity$1(false);

if(cljs.core.truth_(search_mode)){
frontend.state.set_search_mode_BANG_.cljs$core$IFn$_invoke$arity$2(search_mode,args);
} else {
}

return frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("go","search","go/search",1564957958)], null));
}));

(frontend.handler.route.go_to_search_BANG_.cljs$lang$maxFixedArity = 2);

frontend.handler.route.sidebar_journals_BANG_ = (function frontend$handler$route$sidebar_journals_BANG_(){
return frontend.state.sidebar_add_block_BANG_(frontend.state.get_current_repo(),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1((function (){var G__103881 = frontend.date.today();
return (frontend.db.get_page.cljs$core$IFn$_invoke$arity$1 ? frontend.db.get_page.cljs$core$IFn$_invoke$arity$1(G__103881) : frontend.db.get_page.call(null,G__103881));
})()),new cljs.core.Keyword(null,"page","page",849072397));
});
frontend.handler.route.go_to_journals_BANG_ = (function frontend$handler$route$go_to_journals_BANG_(){
var route_103941 = ((frontend.state.custom_home_page_QMARK_())?new cljs.core.Keyword(null,"all-journals","all-journals",-347015095):new cljs.core.Keyword(null,"home","home",-74557309));
frontend.handler.route.redirect_BANG_(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"to","to",192099007),route_103941], null));

return frontend.util.scroll_to_top.cljs$core$IFn$_invoke$arity$0();
});

//# sourceMappingURL=frontend.handler.route.js.map
