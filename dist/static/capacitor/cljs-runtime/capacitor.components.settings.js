goog.provide('capacitor.components.settings');
capacitor.components.settings.user_profile = rum.core.lazy_build(rum.core.build_defc,(function (){
var login_QMARK_ = (function (){var and__5000__auto__ = frontend.state.sub(new cljs.core.Keyword("auth","id-token","auth/id-token",-332149946));
if(cljs.core.truth_(and__5000__auto__)){
return frontend.handler.user.logged_in_QMARK_();
} else {
return and__5000__auto__;
}
})();
if(cljs.core.not(login_QMARK_)){
return daiquiri.core.create_element("h1",{'className':"text-3xl font-bold underline"},[daiquiri.core.create_element("a",{'onClick':(function (){
var G__90555 = frontend.components.user.login.page_impl;
var G__90556 = new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"close-btn?","close-btn?",336318726),false,new cljs.core.Keyword(null,"align","align",1964212802),new cljs.core.Keyword(null,"top","top",-1856271961),new cljs.core.Keyword(null,"content-props","content-props",687449284),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"app-login-modal"], null)], null);
return (logseq.shui.ui.dialog_open_BANG_.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dialog_open_BANG_.cljs$core$IFn$_invoke$arity$2(G__90555,G__90556) : logseq.shui.ui.dialog_open_BANG_.call(null,G__90555,G__90556));
})},["login"])]);
} else {
return daiquiri.core.create_element("div",{'className':"py-2"},[daiquiri.core.create_element("h2",{'className':"py-3 flex justify-between items-center"},[(function (){var attrs90558 = frontend.handler.user.username();
return daiquiri.core.create_element("strong",((cljs.core.map_QMARK_(attrs90558))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["text-4xl","font-semibold"], null)], null),attrs90558], 0))):{'className':"text-4xl font-semibold"}),((cljs.core.map_QMARK_(attrs90558))?null:[daiquiri.interpreter.interpret(attrs90558)]));
})(),daiquiri.interpreter.interpret(capacitor.ionic.button(new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"size","size",1098693007),"small",new cljs.core.Keyword(null,"mode","mode",654403691),"ios",new cljs.core.Keyword(null,"fill","fill",883462889),"outline",new cljs.core.Keyword(null,"color","color",1011675173),"danger",new cljs.core.Keyword(null,"on-click","on-click",1632826543),frontend.handler.user.logout], null),"logout"))]),(function (){var attrs90557 = frontend.handler.user.email();
return daiquiri.core.create_element("code",((cljs.core.map_QMARK_(attrs90557))?daiquiri.interpreter.element_attributes(attrs90557):null),((cljs.core.map_QMARK_(attrs90557))?null:[daiquiri.interpreter.interpret(attrs90557)]));
})()]);
}
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive], null),"capacitor.components.settings/user-profile");
capacitor.components.settings.page = rum.core.lazy_build(rum.core.build_defc,(function (){
var vec__90559 = capacitor.state.use_nav_root();
var nav = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__90559,(0),null);
return daiquiri.interpreter.interpret(capacitor.ionic.page(capacitor.ionic.header(capacitor.ionic.toolbar(capacitor.ionic.title("Settings"),capacitor.ionic.buttons(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"slot","slot",240229571),"end"], null),capacitor.ionic.button(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"fill","fill",883462889),"clear",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return nav.pop();
})], null),capacitor.ionic.tabler_icon("help",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),(26)], null)))))),capacitor.ionic.content(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"ion-padding"], null),capacitor.ionic.refresher(new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"slot","slot",240229571),"fixed",new cljs.core.Keyword(null,"pull-factor","pull-factor",1428236013),0.5,new cljs.core.Keyword(null,"pull-min","pull-min",-2031488524),(100),new cljs.core.Keyword(null,"pull-max","pull-max",-103911866),(200),new cljs.core.Keyword(null,"on-ion-refresh","on-ion-refresh",-1806220105),(function (e){
return setTimeout((function (){
return e.detail.complete();
}),(3000));
})], null),capacitor.ionic.refresher_content()),capacitor.components.settings.user_profile(),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.mt-8","div.mt-8",-1083568847),frontend.components.repo.repos_cp()], null))));
}),null,"capacitor.components.settings/page");

//# sourceMappingURL=capacitor.components.settings.js.map
