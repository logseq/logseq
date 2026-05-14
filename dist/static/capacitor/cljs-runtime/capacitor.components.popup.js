goog.provide('capacitor.components.popup');
capacitor.components.popup.popup_show_BANG_ = (function capacitor$components$popup$popup_show_BANG_(_event,content_fn,p__89484){
var map__89485 = p__89484;
var map__89485__$1 = cljs.core.__destructure_map(map__89485);
var opts = map__89485__$1;
var id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__89485__$1,new cljs.core.Keyword(null,"id","id",-1388402092));
if((((id instanceof cljs.core.Keyword)) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("editor.commands",cljs.core.namespace(id))))){
return logseq.shui.popup.core.show_BANG_.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [(0),(86)], null),content_fn,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([opts], 0));
} else {
if(cljs.core.fn_QMARK_(content_fn)){
return capacitor.state.set_popup_BANG_(new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"open?","open?",1238443125),true,new cljs.core.Keyword(null,"content-fn","content-fn",-1280686114),content_fn,new cljs.core.Keyword(null,"opts","opts",155075701),opts], null));
} else {
return null;
}
}
});
(logseq.shui.ui.popup_show_BANG_ = capacitor.components.popup.popup_show_BANG_);
capacitor.components.popup.popup = rum.core.lazy_build(rum.core.build_defc,(function (){
var map__89489 = rum.core.react(capacitor.state._STAR_popup_data);
var map__89489__$1 = cljs.core.__destructure_map(map__89489);
var open_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__89489__$1,new cljs.core.Keyword(null,"open?","open?",1238443125));
var content_fn = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__89489__$1,new cljs.core.Keyword(null,"content-fn","content-fn",-1280686114));
var _opts = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__89489__$1,new cljs.core.Keyword(null,"_opts","_opts",-5907458));
return daiquiri.interpreter.interpret(capacitor.ionic.modal(new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"isOpen","isOpen",-973300387),cljs.core.boolean$(open_QMARK_),new cljs.core.Keyword(null,"initialBreakpoint","initialBreakpoint",1051764275),0.75,new cljs.core.Keyword(null,"breakpoints","breakpoints",1018731739),[(0),0.75,(1)],new cljs.core.Keyword(null,"onDidDismiss","onDidDismiss",-1789722241),(function (){
return capacitor.state.set_popup_BANG_(null);
}),new cljs.core.Keyword(null,"expand","expand",595248157),"block"], null),capacitor.ionic.content(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"ion-padding"], null),(cljs.core.truth_(content_fn)?(content_fn.cljs$core$IFn$_invoke$arity$0 ? content_fn.cljs$core$IFn$_invoke$arity$0() : content_fn.call(null)):null))));
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive], null),"capacitor.components.popup/popup");

//# sourceMappingURL=capacitor.components.popup.js.map
