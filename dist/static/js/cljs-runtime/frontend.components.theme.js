goog.provide('frontend.components.theme');
frontend.components.theme.scrollbar_measure = rum.core.lazy_build(rum.core.build_defc,(function (){
var _STAR_el = rum.core.use_ref(null);
logseq.shui.hooks.use_effect_BANG_((function (){
var temp__5804__auto__ = rum.core.deref(_STAR_el);
if(cljs.core.truth_(temp__5804__auto__)){
var el = temp__5804__auto__;
var w = (el.offsetWidth - el.clientWidth);
var c = "custom-scrollbar";
var l = document.documentElement.classList;
if(((cljs.core.not(frontend.util.mac_QMARK_)) || ((w > (2))))){
return l.add(c);
} else {
return l.remove(c);
}
} else {
return null;
}
}),cljs.core.PersistentVector.EMPTY);

return daiquiri.core.create_element("div",{'ref':_STAR_el,'className':"fixed w-16 h-16 overflow-scroll opacity-0 top-1/2 -left-1/2 z-[-999]"},[]);
}),null,"frontend.components.theme/scrollbar-measure");
if((typeof frontend !== 'undefined') && (typeof frontend.components !== 'undefined') && (typeof frontend.components.theme !== 'undefined') && (typeof frontend.components.theme._STAR_once_theme_loaded_QMARK_ !== 'undefined')){
} else {
frontend.components.theme._STAR_once_theme_loaded_QMARK_ = cljs.core.volatile_BANG_(false);
}
frontend.components.theme.container = rum.core.lazy_build(rum.core.build_defc,(function (p__130675,child){
var map__130676 = p__130675;
var map__130676__$1 = cljs.core.__destructure_map(map__130676);
var system_theme_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__130676__$1,new cljs.core.Keyword(null,"system-theme?","system-theme?",1330394234));
var settings_open_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__130676__$1,new cljs.core.Keyword(null,"settings-open?","settings-open?",1491874651));
var sidebar_open_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__130676__$1,new cljs.core.Keyword(null,"sidebar-open?","sidebar-open?",-1099774467));
var onboarding_state = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__130676__$1,new cljs.core.Keyword(null,"onboarding-state","onboarding-state",2059697923));
var current_repo = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__130676__$1,new cljs.core.Keyword(null,"current-repo","current-repo",134812359));
var db_restoring_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__130676__$1,new cljs.core.Keyword(null,"db-restoring?","db-restoring?",-1548628664));
var sidebar_blocks_len = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__130676__$1,new cljs.core.Keyword(null,"sidebar-blocks-len","sidebar-blocks-len",235708585));
var accent_color = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__130676__$1,new cljs.core.Keyword(null,"accent-color","accent-color",908336425));
var editor_font = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__130676__$1,new cljs.core.Keyword(null,"editor-font","editor-font",582015595));
var route = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__130676__$1,new cljs.core.Keyword(null,"route","route",329891309));
var on_click = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__130676__$1,new cljs.core.Keyword(null,"on-click","on-click",1632826543));
var theme = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__130676__$1,new cljs.core.Keyword(null,"theme","theme",-1247880880));
var preferred_language = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__130676__$1,new cljs.core.Keyword(null,"preferred-language","preferred-language",-1247855017));
var mounted_fn = frontend.rum.use_mounted();
var vec__130677 = rum.core.use_state(false);
var restored_sidebar_QMARK_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__130677,(0),null);
var set_restored_sidebar_QMARK_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__130677,(1),null);
logseq.shui.hooks.use_effect_BANG_((function (){
var doc = document.documentElement;
var cls = doc.classList;
var cls_body = document.body.classList;
doc.setAttribute("data-theme",theme);

if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(theme,"dark")){
cls.add("dark");

var G__130680_130686 = cls_body;
G__130680_130686.remove("white-theme","light-theme");

G__130680_130686.add("dark-theme");

} else {
cls.remove("dark");

var G__130681_130687 = cls_body;
G__130681_130687.remove("dark-theme");

G__130681_130687.add("white-theme","light-theme");

}

frontend.ui.apply_custom_theme_effect_BANG_(theme);

return frontend.handler.plugin.hook_plugin_app.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"theme-mode-changed","theme-mode-changed",-761875935),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"mode","mode",654403691),theme], null));
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [theme], null));

logseq.shui.hooks.use_effect_BANG_((function (){
var G__130682 = document.documentElement;
if((G__130682 == null)){
return null;
} else {
return G__130682.setAttribute("data-color",(function (){var or__5002__auto__ = accent_color;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return "logseq";
}
})());
}
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [accent_color], null));

logseq.shui.hooks.use_effect_BANG_((function (){
var G__130683 = document.documentElement;
if((G__130683 == null)){
return null;
} else {
return G__130683.setAttribute("data-font",(function (){var or__5002__auto__ = editor_font;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return "default";
}
})());
}
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [editor_font], null));

logseq.shui.hooks.use_effect_BANG_.cljs$core$IFn$_invoke$arity$1((function (){
var doc = document.documentElement;
return doc.setAttribute("lang",preferred_language);
}));

logseq.shui.hooks.use_effect_BANG_((function (){
return setTimeout((function (){
if(cljs.core.truth_(cljs.core.deref(frontend.components.theme._STAR_once_theme_loaded_QMARK_))){
return null;
} else {
electron.ipc.ipc.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"theme-loaded","theme-loaded",405446380)], 0));

return cljs.core.vreset_BANG_(frontend.components.theme._STAR_once_theme_loaded_QMARK_,true);
}
}),(100));
}),cljs.core.PersistentVector.EMPTY);

logseq.shui.hooks.use_effect_BANG_((function (){
if(cljs.core.truth_((function (){var and__5000__auto__ = restored_sidebar_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return mounted_fn();
} else {
return and__5000__auto__;
}
})())){
frontend.handler.plugin.hook_plugin_app.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"sidebar-visible-changed","sidebar-visible-changed",946926799),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"visible","visible",-1024216805),sidebar_open_QMARK_], null));

return frontend.handler.ui.persist_right_sidebar_state_BANG_();
} else {
return null;
}
}),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [sidebar_open_QMARK_,restored_sidebar_QMARK_,sidebar_blocks_len], null));

logseq.shui.hooks.use_effect_BANG_((function (){
if(cljs.core.truth_(frontend.config.lsp_enabled_QMARK_)){
frontend.handler.plugin.load_plugin_preferences();

return cljs.core.comp.cljs$core$IFn$_invoke$arity$2(frontend.handler.plugin.setup_install_listener_BANG_(),frontend.handler.plugin_config.setup_install_listener_BANG_());
} else {
return null;
}
}),cljs.core.PersistentVector.EMPTY);

logseq.shui.hooks.use_effect_BANG_((function (){
frontend.handler.ui.reset_custom_css_BANG_();

frontend.extensions.pdf.core.reset_current_pdf_BANG_();

return frontend.handler.plugin.hook_plugin_app.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"current-graph-changed","current-graph-changed",1449126454),cljs.core.PersistentArrayMap.EMPTY);
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [current_repo], null));

logseq.shui.hooks.use_effect_BANG_((function (){
var db_restored_QMARK_ = db_restoring_QMARK_ === false;
if(cljs.core.truth_(db_restoring_QMARK_)){
return frontend.util.set_title_BANG_(frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"loading","loading",-737050189)], 0)));
} else {
if(db_restored_QMARK_){
return frontend.handler.route.update_page_title_BANG_(route);
} else {
return null;
}
}
}),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [db_restoring_QMARK_,route], null));

logseq.shui.hooks.use_effect_BANG_((function (){
if(cljs.core.truth_(db_restoring_QMARK_)){
return null;
} else {
var repos = frontend.state.get_repos();
if((!(((frontend.config.publishing_QMARK_) || (cljs.core.seq(repos)))))){
return frontend.handler.route.redirect_BANG_(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"to","to",192099007),new cljs.core.Keyword(null,"graphs","graphs",-1584479112)], null));
} else {
frontend.handler.ui.restore_right_sidebar_state_BANG_();

return (set_restored_sidebar_QMARK_.cljs$core$IFn$_invoke$arity$1 ? set_restored_sidebar_QMARK_.cljs$core$IFn$_invoke$arity$1(true) : set_restored_sidebar_QMARK_.call(null,true));
}
}
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [db_restoring_QMARK_], null));

logseq.shui.hooks.use_effect_BANG_((function (){
if(cljs.core.truth_(system_theme_QMARK_)){
return frontend.ui.setup_system_theme_effect_BANG_();
} else {
return null;
}
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [system_theme_QMARK_], null));

logseq.shui.hooks.use_effect_BANG_((function (){
if(cljs.core.truth_(settings_open_QMARK_)){
var G__130684 = (function (){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.settings-modal","div.settings-modal",666226730),frontend.components.settings.settings(settings_open_QMARK_)], null);
});
var G__130685 = new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"label","label",1718410804),"app-settings",new cljs.core.Keyword(null,"align","align",1964212802),new cljs.core.Keyword(null,"top","top",-1856271961),new cljs.core.Keyword(null,"content-props","content-props",687449284),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"onOpenAutoFocus","onOpenAutoFocus",-99363202),(function (p1__130674_SHARP_){
return p1__130674_SHARP_.preventDefault();
})], null),new cljs.core.Keyword(null,"id","id",-1388402092),new cljs.core.Keyword(null,"app-settings","app-settings",-105159640)], null);
return (logseq.shui.ui.dialog_open_BANG_.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dialog_open_BANG_.cljs$core$IFn$_invoke$arity$2(G__130684,G__130685) : logseq.shui.ui.dialog_open_BANG_.call(null,G__130684,G__130685));
} else {
return (logseq.shui.ui.dialog_close_BANG_.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.dialog_close_BANG_.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"app-settings","app-settings",-105159640)) : logseq.shui.ui.dialog_close_BANG_.call(null,new cljs.core.Keyword(null,"app-settings","app-settings",-105159640)));
}
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [settings_open_QMARK_], null));

logseq.shui.hooks.use_effect_BANG_((function (){
return frontend.storage.set(new cljs.core.Keyword("file-sync","onboarding-state","file-sync/onboarding-state",-864081833),onboarding_state);
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [onboarding_state], null));

return daiquiri.core.create_element("div",{'id':"root-container",'onClick':on_click,'tabIndex':(-1),'className':"theme-container"},[daiquiri.interpreter.interpret(child),frontend.extensions.pdf.core.default_embed_playground(),frontend.components.theme.scrollbar_measure()]);
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.static$], null),"frontend.components.theme/container");

//# sourceMappingURL=frontend.components.theme.js.map
