goog.provide('frontend.mobile.core');
var module$node_modules$$capacitor$app$dist$plugin_cjs=shadow.js.require("module$node_modules$$capacitor$app$dist$plugin_cjs", {});
var module$node_modules$$capacitor$keyboard$dist$plugin_cjs=shadow.js.require("module$node_modules$$capacitor$keyboard$dist$plugin_cjs", {});
frontend.mobile.core._STAR_init_url = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(null);
frontend.mobile.core._STAR_last_shared_url = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(null);
frontend.mobile.core._STAR_last_shared_seconds = cljs.core.atom.cljs$core$IFn$_invoke$arity$1((0));
/**
 * postinit logic of mobile platforms: handle deeplink and intent
 */
frontend.mobile.core.mobile_postinit = (function frontend$mobile$core$mobile_postinit(){
if(cljs.core.truth_(frontend.mobile.util.native_ios_QMARK_())){
if(cljs.core.truth_(cljs.core.deref(frontend.mobile.core._STAR_init_url))){
frontend.mobile.deeplink.deeplink(cljs.core.deref(frontend.mobile.core._STAR_init_url));

return cljs.core.reset_BANG_(frontend.mobile.core._STAR_init_url,null);
} else {
return null;
}
} else {
return null;
}
});
/**
 * Initialize iOS-specified event listeners
 */
frontend.mobile.core.ios_init = (function frontend$mobile$core$ios_init(){
return frontend.mobile.util.check_ios_zoomed_display();
});
/**
 * Initialize Android-specified event listeners
 */
frontend.mobile.core.android_init = (function frontend$mobile$core$android_init(){
module$node_modules$$capacitor$app$dist$plugin_cjs.App.addListener("backButton",(function (){
var href = window.location.href;
if((cljs.core.truth_(frontend.state.settings_open_QMARK_())?frontend.state.close_settings_BANG_():(cljs.core.truth_(frontend.state.modal_opened_QMARK_())?frontend.state.close_modal_BANG_():(cljs.core.truth_(frontend.state.get_left_sidebar_open_QMARK_())?frontend.state.set_left_sidebar_open_BANG_(false):(cljs.core.truth_(frontend.state.action_bar_open_QMARK_())?frontend.state.set_state_BANG_(new cljs.core.Keyword("mobile","show-action-bar?","mobile/show-action-bar?",-1280463440),false):(cljs.core.truth_(cljs.core.not_empty(frontend.state.get_selection_blocks()))?(frontend.handler.editor.clear_selection_BANG_.cljs$core$IFn$_invoke$arity$0 ? frontend.handler.editor.clear_selection_BANG_.cljs$core$IFn$_invoke$arity$0() : frontend.handler.editor.clear_selection_BANG_.call(null)):((frontend.state.editing_QMARK_())?frontend.handler.editor.escape_editing():true
)))))) === true){
if(((clojure.string.ends_with_QMARK_(href,"#/")) || (((clojure.string.ends_with_QMARK_(href,"/")) || ((!(clojure.string.includes_QMARK_(href,"#/")))))))){
return module$node_modules$$capacitor$app$dist$plugin_cjs.App.exitApp();
} else {
return window.history.back();
}
} else {
return null;
}
}));

return window.addEventListener("sendIntentReceived",(function (){
return frontend.mobile.intent.handle_received();
}));
});
frontend.mobile.core.app_state_change_handler = (function frontend$mobile$core$app_state_change_handler(state){
cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"debug","debug",-1608172596),new cljs.core.Keyword(null,"app-state-change-handler","app-state-change-handler",18142314),state,(new Date())], 0));

if(cljs.core.truth_(frontend.state.get_current_repo())){
var is_active_QMARK_ = state.isActive;
if(cljs.core.truth_(is_active_QMARK_)){
return null;
} else {
return frontend.handler.editor.save_current_block_BANG_.cljs$core$IFn$_invoke$arity$0();
}
} else {
return null;
}
});
/**
 * Initialize event listeners used by both iOS and Android
 */
frontend.mobile.core.general_init = (function frontend$mobile$core$general_init(){
module$node_modules$$capacitor$app$dist$plugin_cjs.App.addListener("appUrlOpen",(function (data){
var temp__5804__auto__ = data.url;
if(cljs.core.truth_(temp__5804__auto__)){
var url = temp__5804__auto__;
if((!(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(document.readyState,"complete")))){
return cljs.core.reset_BANG_(frontend.mobile.core._STAR_init_url,url);
} else {
if(((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(frontend.mobile.core._STAR_last_shared_url),url)) && ((((new Date()).getSeconds() - cljs.core.deref(frontend.mobile.core._STAR_last_shared_seconds)) <= (1))))){
return null;
} else {
cljs.core.reset_BANG_(frontend.mobile.core._STAR_last_shared_url,url);

cljs.core.reset_BANG_(frontend.mobile.core._STAR_last_shared_seconds,(new Date()).getSeconds());

return frontend.mobile.deeplink.deeplink(url);
}
}
} else {
return null;
}
}));

module$node_modules$$capacitor$keyboard$dist$plugin_cjs.Keyboard.addListener("keyboardWillShow",(function (info){
var keyboard_height = info.keyboardHeight;
return frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("mobile","keyboard-will-show","mobile/keyboard-will-show",2010922836),keyboard_height], null));
}));

module$node_modules$$capacitor$keyboard$dist$plugin_cjs.Keyboard.addListener("keyboardWillHide",(function (){
return frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("mobile","keyboard-will-hide","mobile/keyboard-will-hide",-1974048806)], null));
}));

window.addEventListener("statusTap",(function (){
return frontend.util.scroll_to_top.cljs$core$IFn$_invoke$arity$1(true);
}));

return module$node_modules$$capacitor$app$dist$plugin_cjs.App.addListener("appStateChange",frontend.mobile.core.app_state_change_handler);
});
frontend.mobile.core.init_BANG_ = (function frontend$mobile$core$init_BANG_(){
if(cljs.core.truth_(frontend.mobile.util.native_android_QMARK_())){
frontend.mobile.core.android_init();
} else {
}

if(cljs.core.truth_(frontend.mobile.util.native_ios_QMARK_())){
frontend.mobile.core.ios_init();
} else {
}

if(cljs.core.truth_(frontend.mobile.util.native_platform_QMARK_())){
return frontend.mobile.core.general_init();
} else {
return null;
}
});

//# sourceMappingURL=frontend.mobile.core.js.map
