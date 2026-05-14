goog.provide('capacitor.components.modal');
capacitor.components.modal.modal = rum.core.lazy_build(rum.core.build_defc,(function (presenting_element){
var map__91117 = rum.core.react(capacitor.state._STAR_modal_data);
var map__91117__$1 = cljs.core.__destructure_map(map__91117);
var open_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__91117__$1,new cljs.core.Keyword(null,"open?","open?",1238443125));
var block = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__91117__$1,new cljs.core.Keyword(null,"block","block",664686210));
var show_action_bar_QMARK_ = frontend.state.sub(new cljs.core.Keyword("mobile","show-action-bar?","mobile/show-action-bar?",-1280463440));
return daiquiri.interpreter.interpret(capacitor.ionic.modal(new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"isOpen","isOpen",-973300387),cljs.core.boolean$(open_QMARK_),new cljs.core.Keyword(null,"presenting-element","presenting-element",-1511581935),presenting_element,new cljs.core.Keyword(null,"onDidDismiss","onDidDismiss",-1789722241),(function (){
return capacitor.state.set_modal_BANG_(null);
}),new cljs.core.Keyword(null,"expand","expand",595248157),"block"], null),capacitor.ionic.content(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"ion-padding scrolling"], null),capacitor.components.ui.classic_app_container_wrap(frontend.components.page.page_cp((function (){var G__91120 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block)], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__91120) : frontend.db.entity.call(null,G__91120));
})())),frontend.mobile.mobile_bar.mobile_bar(),(cljs.core.truth_(show_action_bar_QMARK_)?frontend.mobile.action_bar.action_bar():null))));
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive], null),"capacitor.components.modal/modal");

//# sourceMappingURL=capacitor.components.modal.js.map
