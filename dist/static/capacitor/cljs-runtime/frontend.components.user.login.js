goog.provide('frontend.components.user.login');

frontend.components.user.login.sign_out_BANG_ = (function frontend$components$user$login$sign_out_BANG_(){
try{return LSAmplify.Auth.signOut();
}catch (e90095){var e = e90095;
return console.warn(e);
}});
frontend.components.user.login.setup_configure_BANG_ = (function frontend$components$user$login$setup_configure_BANG_(){
frontend.components.user.login.setupAuthConfigure_BANG_ = LSAmplify.setupAuthConfigure;

frontend.components.user.login.LSAuthenticator = frontend.rum.adapt_class.cljs$core$IFn$_invoke$arity$1(LSAmplify.LSAuthenticator);

LSAmplify.I18n.setLanguage((function (){var or__5002__auto__ = new cljs.core.Keyword(null,"preferred-language","preferred-language",-1247855017).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state));
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return "en";
}
})());

var G__90097 = ({"region": frontend.config.REGION, "userPoolId": frontend.config.USER_POOL_ID, "userPoolWebClientId": frontend.config.COGNITO_CLIENT_ID, "identityPoolId": frontend.config.IDENTITY_POOL_ID, "oauthDomain": frontend.config.OAUTH_DOMAIN});
return (frontend.components.user.login.setupAuthConfigure_BANG_.cljs$core$IFn$_invoke$arity$1 ? frontend.components.user.login.setupAuthConfigure_BANG_.cljs$core$IFn$_invoke$arity$1(G__90097) : frontend.components.user.login.setupAuthConfigure_BANG_.call(null,G__90097));
});
frontend.components.user.login.user_pane = rum.core.lazy_build(rum.core.build_defc,(function (_sign_out_BANG_,user){
var session = new cljs.core.Keyword(null,"signInUserSession","signInUserSession",1238093414).cljs$core$IFn$_invoke$arity$1(user);
var username = new cljs.core.Keyword(null,"username","username",1605666410).cljs$core$IFn$_invoke$arity$1(user);
logseq.shui.hooks.use_effect_BANG_((function (){
if(cljs.core.truth_(session)){
frontend.handler.user.login_callback(session);

frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$2(["Hi, ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(username)," :)"].join(''),new cljs.core.Keyword(null,"success","success",1890645906));

(logseq.shui.ui.dialog_close_BANG_.cljs$core$IFn$_invoke$arity$0 ? logseq.shui.ui.dialog_close_BANG_.cljs$core$IFn$_invoke$arity$0() : logseq.shui.ui.dialog_close_BANG_.call(null));

if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"user-login","user-login",1532000569),frontend.state.get_current_route())){
return frontend.handler.route.redirect_BANG_(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"to","to",192099007),new cljs.core.Keyword(null,"home","home",-74557309)], null));
} else {
return null;
}
} else {
return null;
}
}),cljs.core.PersistentVector.EMPTY);

return null;
}),null,"frontend.components.user.login/user-pane");
frontend.components.user.login.page_impl = rum.core.lazy_build(rum.core.build_defc,(function (){
var vec__90103 = rum.core.use_state(false);
var ready_QMARK_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__90103,(0),null);
var set_ready_QMARK_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__90103,(1),null);
var vec__90106 = rum.core.use_state(new cljs.core.Keyword(null,"login","login",55217519));
var tab = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__90106,(0),null);
var set_tab_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__90106,(1),null);
var _STAR_ref_el = rum.core.use_ref(null);
logseq.shui.hooks.use_effect_BANG_((function (){
frontend.components.user.login.setup_configure_BANG_();

(set_ready_QMARK_.cljs$core$IFn$_invoke$arity$1 ? set_ready_QMARK_.cljs$core$IFn$_invoke$arity$1(true) : set_ready_QMARK_.call(null,true));

return setTimeout((function (){
var temp__5804__auto__ = (function (){var G__90119 = rum.core.deref(_STAR_ref_el);
if((G__90119 == null)){
return null;
} else {
return G__90119.querySelector(".amplify-tabs");
}
})();
if(cljs.core.truth_(temp__5804__auto__)){
var el = temp__5804__auto__;
var btn1 = el.querySelector("button");
return el.addEventListener("pointerdown",(function (e){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(e.target,btn1)){
return (set_tab_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_tab_BANG_.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"login","login",55217519)) : set_tab_BANG_.call(null,new cljs.core.Keyword(null,"login","login",55217519)));
} else {
return (set_tab_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_tab_BANG_.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"create-account","create-account",-1493050940)) : set_tab_BANG_.call(null,new cljs.core.Keyword(null,"create-account","create-account",-1493050940)));
}
}));
} else {
return null;
}
}));
}),cljs.core.PersistentVector.EMPTY);

logseq.shui.hooks.use_effect_BANG_((function (){
var temp__5804__auto__ = rum.core.deref(_STAR_ref_el);
if(cljs.core.truth_(temp__5804__auto__)){
var el = temp__5804__auto__;
return setTimeout((function (){
var G__90123 = el.querySelector(["input[name=",((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(tab,new cljs.core.Keyword(null,"login","login",55217519)))?"username":"email"),"]"].join(''));
if((G__90123 == null)){
return null;
} else {
return G__90123.focus();
}
}),(100));
} else {
return null;
}
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [tab], null));

return daiquiri.core.create_element("div",{'ref':_STAR_ref_el,'className':"cp__user-login"},[(cljs.core.truth_(ready_QMARK_)?daiquiri.interpreter.interpret((function (){var G__90133 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"termsLink","termsLink",-238784098),"https://blog.logseq.com/terms/"], null);
var G__90134 = (function (op){
var sign_out_BANG__SINGLEQUOTE_ = op.signOut;
var user_proxy = op.user;
var user = (function (){try{return JSON.parse(JSON.stringify(user_proxy));
}catch (e90135){if((e90135 instanceof Error)){
var e = e90135;
return console.error("Error: Amplify user payload:",e);
} else {
throw e90135;

}
}})();
var user_SINGLEQUOTE_ = cljs_bean.core.__GT_clj(user);
return frontend.components.user.login.user_pane(sign_out_BANG__SINGLEQUOTE_,user_SINGLEQUOTE_);
});
return (frontend.components.user.login.LSAuthenticator.cljs$core$IFn$_invoke$arity$2 ? frontend.components.user.login.LSAuthenticator.cljs$core$IFn$_invoke$arity$2(G__90133,G__90134) : frontend.components.user.login.LSAuthenticator.call(null,G__90133,G__90134));
})()):null)]);
}),null,"frontend.components.user.login/page-impl");
frontend.components.user.login.modal_inner = rum.core.lazy_build(rum.core.build_defcs,(function (_state){
return frontend.components.user.login.page_impl();
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [frontend.modules.shortcut.core.disable_all_shortcuts], null),"frontend.components.user.login/modal-inner");
frontend.components.user.login.page = rum.core.lazy_build(rum.core.build_defc,(function (){
return daiquiri.core.create_element("div",{'className':"pt-10"},[frontend.components.user.login.page_impl()]);
}),null,"frontend.components.user.login/page");
frontend.components.user.login.open_login_modal_BANG_ = (function frontend$components$user$login$open_login_modal_BANG_(){
var G__90142 = (function (_close){
return frontend.components.user.login.modal_inner();
});
var G__90143 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"label","label",1718410804),"user-login",new cljs.core.Keyword(null,"content-props","content-props",687449284),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"onPointerDownOutside","onPointerDownOutside",404933036),(function (p1__90141_SHARP_){
var inputs = dommy.utils.__GT_Array(document.querySelectorAll("form[data-amplify-form] input:not([type=checkbox])"));
var inputs__$1 = (function (){var G__90151 = inputs;
var G__90151__$1 = (((G__90151 == null))?null:cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (e){
return e.value;
}),G__90151));
if((G__90151__$1 == null)){
return null;
} else {
return cljs.core.remove.cljs$core$IFn$_invoke$arity$2(clojure.string.blank_QMARK_,G__90151__$1);
}
})();
if(cljs.core.seq(inputs__$1)){
return p1__90141_SHARP_.preventDefault();
} else {
return null;
}
})], null)], null);
return (logseq.shui.ui.dialog_open_BANG_.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dialog_open_BANG_.cljs$core$IFn$_invoke$arity$2(G__90142,G__90143) : logseq.shui.ui.dialog_open_BANG_.call(null,G__90142,G__90143));
});

//# sourceMappingURL=frontend.components.user.login.js.map
