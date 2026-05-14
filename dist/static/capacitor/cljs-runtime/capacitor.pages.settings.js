goog.provide('capacitor.pages.settings');
capacitor.pages.settings.page = rum.core.lazy_build(rum.core.build_defc,(function (){
var vec__98132 = capacitor.state.use_nav_root();
var nav = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__98132,(0),null);
return daiquiri.interpreter.interpret(capacitor.ionic.ion_page(capacitor.ionic.ion_header(capacitor.ionic.ion_toolbar(capacitor.ionic.ion_buttons(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"slot","slot",240229571),"start"], null),capacitor.ionic.ion_button(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"fill","fill",883462889),"clear",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return nav.pop();
})], null),capacitor.ionic.tabler_icon("arrow-left",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),(26)], null)))),capacitor.ionic.ion_buttons(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"slot","slot",240229571),"end"], null),capacitor.ionic.ion_button(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"fill","fill",883462889),"clear",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return nav.pop();
})], null),capacitor.ionic.tabler_icon("share",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),(26)], null)))),capacitor.ionic.ion_title("Settings"))),capacitor.ionic.ion_content(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"ion-padding"], null),capacitor.ionic.ion_refresher(new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"slot","slot",240229571),"fixed",new cljs.core.Keyword(null,"pull-factor","pull-factor",1428236013),0.5,new cljs.core.Keyword(null,"pull-min","pull-min",-2031488524),(100),new cljs.core.Keyword(null,"pull-max","pull-max",-103911866),(200),new cljs.core.Keyword(null,"on-ion-refresh","on-ion-refresh",-1806220105),(function (e){
return setTimeout((function (){
return e.detail.complete();
}),(3000));
})], null),capacitor.ionic.ion_refresher_content()),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"p.text-xl","p.text-xl",-9059021),"settings page!",capacitor.ionic.ion_list(capacitor.ionic.ion_item(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"label","label",1718410804),"text 1"], null),capacitor.ionic.ion_input(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"placeholder","placeholder",-104873083),"hi"], null))),capacitor.ionic.ion_item(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"label","label",1718410804),"number 2"], null),capacitor.ionic.ion_input()))], null))));
}),null,"capacitor.pages.settings/page");

//# sourceMappingURL=capacitor.pages.settings.js.map
