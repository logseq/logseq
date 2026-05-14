goog.provide('capacitor.components.app');
capacitor.components.app.app_graphs_select = rum.core.lazy_build(rum.core.build_defc,(function (){
var current_repo = frontend.state.get_current_repo();
var graphs = frontend.state.get_repos();
var short_repo_name = (cljs.core.truth_(current_repo)?frontend.db.conn.get_short_repo_name(current_repo):"Select a Graph");
var attrs91205 = capacitor.ionic.button(new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"fill","fill",883462889),"clear",new cljs.core.Keyword(null,"mode","mode",654403691),"ios",new cljs.core.Keyword(null,"class","class",-2030961996),"border-none w-full rounded-lg",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
var buttons = cljs.core.concat.cljs$core$IFn$_invoke$arity$2((function (){var iter__5480__auto__ = (function capacitor$components$app$iter__91206(s__91207){
return (new cljs.core.LazySeq(null,(function (){
var s__91207__$1 = s__91207;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__91207__$1);
if(temp__5804__auto__){
var s__91207__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__91207__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__91207__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__91209 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__91208 = (0);
while(true){
if((i__91208 < size__5479__auto__)){
var repo = cljs.core._nth(c__5478__auto__,i__91208);
cljs.core.chunk_append(b__91209,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"text","text",-1790561697),(function (){var G__91210 = new cljs.core.Keyword(null,"url","url",276297046).cljs$core$IFn$_invoke$arity$1(repo);
if((G__91210 == null)){
return null;
} else {
return clojure.string.replace(G__91210,/^logseq_db_/,"");
}
})(),new cljs.core.Keyword(null,"role","role",-736691072),new cljs.core.Keyword(null,"url","url",276297046).cljs$core$IFn$_invoke$arity$1(repo)], null));

var G__91265 = (i__91208 + (1));
i__91208 = G__91265;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__91209),capacitor$components$app$iter__91206(cljs.core.chunk_rest(s__91207__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__91209),null);
}
} else {
var repo = cljs.core.first(s__91207__$2);
return cljs.core.cons(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"text","text",-1790561697),(function (){var G__91211 = new cljs.core.Keyword(null,"url","url",276297046).cljs$core$IFn$_invoke$arity$1(repo);
if((G__91211 == null)){
return null;
} else {
return clojure.string.replace(G__91211,/^logseq_db_/,"");
}
})(),new cljs.core.Keyword(null,"role","role",-736691072),new cljs.core.Keyword(null,"url","url",276297046).cljs$core$IFn$_invoke$arity$1(repo)], null),capacitor$components$app$iter__91206(cljs.core.rest(s__91207__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(graphs);
})(),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"text","text",-1790561697),"+ Add new graph",new cljs.core.Keyword(null,"role","role",-736691072),"add-new-graph"], null)], null));
return capacitor.components.ui.open_modal_BANG_.cljs$core$IFn$_invoke$arity$variadic("Switch graph",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"type","type",1174270348),new cljs.core.Keyword(null,"action-sheet","action-sheet",760376756),new cljs.core.Keyword(null,"buttons","buttons",-1953831197),buttons,new cljs.core.Keyword(null,"inputs","inputs",865803858),cljs.core.PersistentVector.EMPTY,new cljs.core.Keyword(null,"on-action","on-action",-894612848),(function (e){
var temp__5804__auto__ = new cljs.core.Keyword(null,"role","role",-736691072).cljs$core$IFn$_invoke$arity$1(e);
if(cljs.core.truth_(temp__5804__auto__)){
var role = temp__5804__auto__;
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("add-new-graph",role)){
var temp__5804__auto____$1 = prompt("Create new db");
if(cljs.core.truth_(temp__5804__auto____$1)){
var db_name = temp__5804__auto____$1;
if(clojure.string.blank_QMARK_(db_name)){
return null;
} else {
return frontend.handler.repo.new_db_BANG_.cljs$core$IFn$_invoke$arity$1(db_name);
}
} else {
return null;
}
} else {
if(clojure.string.starts_with_QMARK_(role,"logseq_db_")){
return frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("graph","switch","graph/switch",178853840),role], null));
} else {
return null;
}
}
} else {
return null;
}
})], null)], 0));
})], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.flex.items-center.gap-2.opacity-80.pt-1","span.flex.items-center.gap-2.opacity-80.pt-1",518521678),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"strong.overflow-hidden.text-ellipsis.block.font-normal","strong.overflow-hidden.text-ellipsis.block.font-normal",-280051948),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"max-width","max-width",-1939924051),"40vw"], null)], null),short_repo_name], null)], null));
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs91205))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["app-graph-select"], null)], null),attrs91205], 0))):{'className':"app-graph-select"}),((cljs.core.map_QMARK_(attrs91205))?null:[daiquiri.interpreter.interpret(attrs91205)]));
}),null,"capacitor.components.app/app-graphs-select");
capacitor.components.app.bottom_tabs = rum.core.lazy_build(rum.core.build_defc,(function (){
return daiquiri.interpreter.interpret(capacitor.ionic.tab_bar(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"slot","slot",240229571),"bottom"], null),capacitor.ionic.tab_button(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tab","tab",-559583621),"home"], null),capacitor.ionic.tabler_icon("home",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),(22)], null)),"Journals"),capacitor.ionic.tab_button(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tab","tab",-559583621),"search"], null),capacitor.ionic.tabler_icon("search",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),(22)], null)),"Search"),capacitor.ionic.tab_button(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tab","tab",-559583621),"settings"], null),capacitor.ionic.tabler_icon("settings",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),(22)], null)),"Settings")));
}),null,"capacitor.components.app/bottom-tabs");
capacitor.components.app.keep_keyboard_open = rum.core.lazy_build(rum.core.build_defc,(function (){
return daiquiri.core.create_element("input",{'id':"app-keep-keyboard-open-input",'className':"absolute top-4 left-0 w-1 h-1 opacity-0"},null);
}),null,"capacitor.components.app/keep-keyboard-open");
capacitor.components.app.journals = rum.core.lazy_build(rum.core.build_defc,(function (){
return capacitor.components.ui.classic_app_container_wrap(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.pt-3","div.pt-3",-2135681181),frontend.components.journal.all_journals()], null));
}),null,"capacitor.components.app/journals");
capacitor.components.app.home_inner = rum.core.lazy_build(rum.core.build_defc,(function (_STAR_page,db_restoring_QMARK_){
return daiquiri.interpreter.interpret(capacitor.ionic.page(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"id","id",-1388402092),"app-main-content",new cljs.core.Keyword(null,"ref","ref",1289896967),_STAR_page], null),capacitor.ionic.header(capacitor.ionic.toolbar(capacitor.ionic.buttons(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"slot","slot",240229571),"start"], null),capacitor.components.app.app_graphs_select()),capacitor.ionic.buttons(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"slot","slot",240229571),"end"], null),capacitor.ionic.button(new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"size","size",1098693007),"small",new cljs.core.Keyword(null,"fill","fill",883462889),"clear",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
var apply_date_BANG_ = (function (date){
var page_name = frontend.date.journal_name.cljs$core$IFn$_invoke$arity$1((new goog.date.Date((new Date(date)))));
var temp__5802__auto__ = (frontend.db.get_page.cljs$core$IFn$_invoke$arity$1 ? frontend.db.get_page.cljs$core$IFn$_invoke$arity$1(page_name) : frontend.db.get_page.call(null,page_name));
if(cljs.core.truth_(temp__5802__auto__)){
var journal = temp__5802__auto__;
return capacitor.state.open_block_modal_BANG_(journal);
} else {
return promesa.core.then.cljs$core$IFn$_invoke$arity$2((function (){var G__91224 = page_name;
var G__91225 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"redirect?","redirect?",-1229259098),false], null);
return (frontend.handler.page._LT_create_BANG_.cljs$core$IFn$_invoke$arity$2 ? frontend.handler.page._LT_create_BANG_.cljs$core$IFn$_invoke$arity$2(G__91224,G__91225) : frontend.handler.page._LT_create_BANG_.call(null,G__91224,G__91225));
})(),(function (){
return capacitor.state.open_block_modal_BANG_((frontend.db.get_page.cljs$core$IFn$_invoke$arity$1 ? frontend.db.get_page.cljs$core$IFn$_invoke$arity$1(page_name) : frontend.db.get_page.call(null,page_name)));
}));
}
});
if(cljs.core.truth_(frontend.mobile.util.native_platform_QMARK_())){
return promesa.core.then.cljs$core$IFn$_invoke$arity$2(frontend.mobile.util.ui_local.showDatePicker(),(function (e){
var G__91226 = e;
var G__91226__$1 = (((G__91226 == null))?null:G__91226.value);
if((G__91226__$1 == null)){
return null;
} else {
return apply_date_BANG_(G__91226__$1);
}
}));
} else {
return capacitor.components.ui.open_modal_BANG_((function (p__91227){
var map__91228 = p__91227;
var map__91228__$1 = cljs.core.__destructure_map(map__91228);
var close_BANG_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__91228__$1,new cljs.core.Keyword(null,"close!","close!",-2079310498));
return capacitor.ionic.datetime(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"presentation","presentation",-997269830),"date",new cljs.core.Keyword(null,"onIonChange","onIonChange",-155182027),(function (e){
var val = e.detail.value;
apply_date_BANG_(val);

return (close_BANG_.cljs$core$IFn$_invoke$arity$0 ? close_BANG_.cljs$core$IFn$_invoke$arity$0() : close_BANG_.call(null));
})], null));
}));
}
})], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.text-muted-foreground","span.text-muted-foreground",916136535),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"slot","slot",240229571),"icon-only"], null),capacitor.ionic.tabler_icon("calendar-month",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),(24)], null))], null)),(function (){var repo = frontend.state.get_current_repo();
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.flex-row.items-center.gap-2.text-muted-foreground","div.flex.flex-row.items-center.gap-2.text-muted-foreground",-1776624074),(cljs.core.truth_((function (){var and__5000__auto__ = repo;
if(cljs.core.truth_(and__5000__auto__)){
var and__5000__auto____$1 = logseq.db.get_graph_rtc_uuid((frontend.db.get_db.cljs$core$IFn$_invoke$arity$0 ? frontend.db.get_db.cljs$core$IFn$_invoke$arity$0() : frontend.db.get_db.call(null)));
if(cljs.core.truth_(and__5000__auto____$1)){
return ((frontend.handler.user.logged_in_QMARK_()) && (((frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(repo)) && (frontend.handler.user.team_member_QMARK_()))));
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})())?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"<>","<>",1280186386),frontend.components.rtc.indicator.indicator()], null):null)], null);
})()))),(cljs.core.truth_(db_restoring_QMARK_)?capacitor.ionic.content(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"strong.flex.justify-center.items-center.py-24","strong.flex.justify-center.items-center.py-24",1688462136),capacitor.ionic.tabler_icon("loader",new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"class","class",-2030961996),"animate animate-spin opacity-50",new cljs.core.Keyword(null,"size","size",1098693007),(30)], null))], null)):capacitor.ionic.content(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"scrolling ion-padding"], null),capacitor.components.app.journals()))));
}),null,"capacitor.components.app/home-inner");
capacitor.components.app.home = rum.core.lazy_build(rum.core.build_defc,(function (_STAR_page){
var db_restoring_QMARK_ = frontend.state.sub(new cljs.core.Keyword("db","restoring?","db/restoring?",-1653366233));
return capacitor.components.app.home_inner(_STAR_page,db_restoring_QMARK_);
}),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"did-mount","did-mount",918232960),(function (state){
frontend.ui.inject_document_devices_envs_BANG_();

return state;
})], null)], null),"capacitor.components.app/home");
capacitor.components.app.use_theme_effects_BANG_ = (function capacitor$components$app$use_theme_effects_BANG_(current_repo){
var __91271 = frontend.state.sync_system_theme_BANG_();
var vec__91231_91272 = frontend.rum.use_atom_in(frontend.state.state,new cljs.core.Keyword("ui","theme","ui/theme",-1247877132));
var theme_91273 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__91231_91272,(0),null);
logseq.shui.hooks.use_effect_BANG_((function (){
return frontend.ui.setup_system_theme_effect_BANG_();
}),cljs.core.PersistentVector.EMPTY);

logseq.shui.hooks.use_effect_BANG_((function (){
var doc = document.documentElement;
var cls = doc.classList;
var cls_body = document.body.classList;
doc.setAttribute("data-theme",theme_91273);

if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(theme_91273,"dark")){
cls.add("dark");

cls.add("ion-palette-dark");

var G__91237 = cls_body;
G__91237.remove("light-theme");

G__91237.add("dark-theme");

return G__91237;
} else {
cls.remove("dark");

cls.remove("ion-palette-dark");

var G__91238 = cls_body;
G__91238.remove("dark-theme");

G__91238.add("light-theme");

return G__91238;
}
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [theme_91273], null));

return logseq.shui.hooks.use_effect_BANG_((function (){
var G__91241 = window.externalsjs;
if((G__91241 == null)){
return null;
} else {
return G__91241.settleStatusBar();
}
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [current_repo], null));
});
capacitor.components.app.tabs = rum.core.lazy_build(rum.core.build_defc,(function (current_repo){
var vec__91245 = capacitor.state.use_tab();
var current_tab = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__91245,(0),null);
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__91245,(1),null);
var _STAR_home_page = (logseq.shui.hooks.use_ref.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.hooks.use_ref.cljs$core$IFn$_invoke$arity$1(null) : logseq.shui.hooks.use_ref.call(null,null));
var _STAR_search_page = (logseq.shui.hooks.use_ref.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.hooks.use_ref.cljs$core$IFn$_invoke$arity$1(null) : logseq.shui.hooks.use_ref.call(null,null));
var vec__91248 = (logseq.shui.hooks.use_state.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.hooks.use_state.cljs$core$IFn$_invoke$arity$1(null) : logseq.shui.hooks.use_state.call(null,null));
var presenting_element = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__91248,(0),null);
var set_presenting_element_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__91248,(1),null);
capacitor.components.app.use_theme_effects_BANG_(current_repo);

logseq.shui.hooks.use_effect_BANG_((function (){
var G__91251 = current_tab;
switch (G__91251) {
case "home":
var G__91252 = rum.core.deref(_STAR_home_page);
return (set_presenting_element_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_presenting_element_BANG_.cljs$core$IFn$_invoke$arity$1(G__91252) : set_presenting_element_BANG_.call(null,G__91252));

break;
case "search":
var G__91253 = rum.core.deref(_STAR_search_page);
return (set_presenting_element_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_presenting_element_BANG_.cljs$core$IFn$_invoke$arity$1(G__91253) : set_presenting_element_BANG_.call(null,G__91253));

break;
default:
return null;

}
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [current_tab], null));

return daiquiri.interpreter.interpret(capacitor.ionic.tabs(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"onIonTabsDidChange","onIonTabsDidChange",-1944562016),(function (e){
return capacitor.state.set_tab_BANG_(e.detail.tab);
})], null),capacitor.ionic.tab(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tab","tab",-559583621),"home"], null),capacitor.ionic.content(capacitor.components.app.home(_STAR_home_page))),capacitor.ionic.tab(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tab","tab",-559583621),"search"], null),capacitor.ionic.content(capacitor.components.search.search(_STAR_search_page))),capacitor.ionic.tab(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tab","tab",-559583621),"settings"], null),capacitor.ionic.content(capacitor.components.settings.page())),capacitor.components.app.bottom_tabs(),capacitor.components.app.keep_keyboard_open(),capacitor.components.ui.install_notifications(),capacitor.components.ui.install_modals(),logseq.shui.toaster.core.install_toaster(),logseq.shui.dialog.core.install_modals(),logseq.shui.popup.core.install_popups(),capacitor.components.modal.modal(presenting_element),capacitor.components.popup.popup()));
}),null,"capacitor.components.app/tabs");
capacitor.components.app.main = rum.core.lazy_build(rum.core.build_defc,(function (){
var current_repo = frontend.state.sub(new cljs.core.Keyword("git","current-repo","git/current-repo",107438825));
var show_action_bar_QMARK_ = frontend.state.sub(new cljs.core.Keyword("mobile","show-action-bar?","mobile/show-action-bar?",-1280463440));
var map__91254 = rum.core.react(capacitor.state._STAR_modal_data);
var map__91254__$1 = cljs.core.__destructure_map(map__91254);
var open_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__91254__$1,new cljs.core.Keyword(null,"open?","open?",1238443125));
var search_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("search",rum.core.react(capacitor.state._STAR_tab));
return daiquiri.interpreter.interpret(capacitor.ionic.app(capacitor.components.app.tabs(current_repo),(cljs.core.truth_((function (){var or__5002__auto__ = open_QMARK_;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return search_QMARK_;
}
})())?null:new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"<>","<>",1280186386),frontend.mobile.mobile_bar.mobile_bar(),(cljs.core.truth_(show_action_bar_QMARK_)?frontend.mobile.action_bar.action_bar():null)], null))));
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive], null),"capacitor.components.app/main");

//# sourceMappingURL=capacitor.components.app.js.map
