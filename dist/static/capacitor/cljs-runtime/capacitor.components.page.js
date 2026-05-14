goog.provide('capacitor.components.page');
capacitor.components.page.page = rum.core.lazy_build(rum.core.build_defc,(function() { 
var G__88405__delegate = function (block,p__88386){
var map__88387 = p__88386;
var map__88387__$1 = cljs.core.__destructure_map(map__88387);
var reload_pages_BANG_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__88387__$1,new cljs.core.Keyword(null,"reload-pages!","reload-pages!",622669889));
var vec__88388 = capacitor.state.use_nav_root();
var nav = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__88388,(0),null);
var vec__88391 = rum.core.use_state((function (){var eid = (function (){var or__5002__auto__ = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var temp__5804__auto__ = new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block);
if(cljs.core.truth_(temp__5804__auto__)){
var id = temp__5804__auto__;
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),id], null);
} else {
return null;
}
}
})();
return frontend.db.utils.entity.cljs$core$IFn$_invoke$arity$1(eid);
})());
var page = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__88391,(0),null);
var set_page_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__88391,(1),null);
var title = (function (){var or__5002__auto__ = new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(block);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(page);
}
})();
var vec__88394 = rum.core.use_state(true);
var loading_QMARK_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__88394,(0),null);
var set_loading_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__88394,(1),null);
var rerender_BANG_ = (function (){
var G__88397 = frontend.db.utils.entity.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block));
return (set_page_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_page_BANG_.cljs$core$IFn$_invoke$arity$1(G__88397) : set_page_BANG_.call(null,G__88397));
});
rum.core.use_effect_BANG_.cljs$core$IFn$_invoke$arity$2((function (){
promesa.core.finally$.cljs$core$IFn$_invoke$arity$2(promesa.core.then.cljs$core$IFn$_invoke$arity$2(frontend.db.async._LT_get_block(frontend.state.get_current_repo(),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block)),(function (p1__88385_SHARP_){
var G__88398 = frontend.db.utils.entity.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(p1__88385_SHARP_));
return (set_page_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_page_BANG_.cljs$core$IFn$_invoke$arity$1(G__88398) : set_page_BANG_.call(null,G__88398));
})),(function (){
return (set_loading_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_loading_BANG_.cljs$core$IFn$_invoke$arity$1(false) : set_loading_BANG_.call(null,false));
}));

return (function (){
return cljs.core.List.EMPTY;
});
}),cljs.core.PersistentVector.EMPTY);

return daiquiri.interpreter.interpret(capacitor.ionic.page(capacitor.ionic.header(capacitor.ionic.toolbar(capacitor.ionic.buttons(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"slot","slot",240229571),"start"], null),capacitor.ionic.button(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"fill","fill",883462889),"clear",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return nav.pop();
})], null),capacitor.ionic.tabler_icon("arrow-left",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),(26)], null)))),capacitor.ionic.buttons(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"slot","slot",240229571),"end"], null),capacitor.ionic.button(new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"fill","fill",883462889),"clear",new cljs.core.Keyword(null,"class","class",-2030961996),"opacity-80",new cljs.core.Keyword(null,"on-click","on-click",1632826543),rerender_BANG_], null),capacitor.ionic.tabler_icon("refresh",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),(26)], null))),capacitor.ionic.button(new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"fill","fill",883462889),"clear",new cljs.core.Keyword(null,"class","class",-2030961996),"opacity-80 text-red-500",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
var G__88402 = new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block);
var G__88403 = (function (){
nav.pop();

if(cljs.core.fn_QMARK_(reload_pages_BANG_)){
return (reload_pages_BANG_.cljs$core$IFn$_invoke$arity$0 ? reload_pages_BANG_.cljs$core$IFn$_invoke$arity$0() : reload_pages_BANG_.call(null));
} else {
return null;
}
});
var G__88404 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"error-handler","error-handler",-484945776),(function (e){
return console.error(e);
})], null);
return (frontend.handler.page._LT_delete_BANG_.cljs$core$IFn$_invoke$arity$3 ? frontend.handler.page._LT_delete_BANG_.cljs$core$IFn$_invoke$arity$3(G__88402,G__88403,G__88404) : frontend.handler.page._LT_delete_BANG_.call(null,G__88402,G__88403,G__88404));
})], null),capacitor.ionic.tabler_icon("trash",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),(26)], null)))),capacitor.ionic.title(title))),capacitor.ionic.content(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"ion-padding"], null),capacitor.components.ui.classic_app_container_wrap((cljs.core.truth_(loading_QMARK_)?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"p.text-xl.text-center","p.text-xl.text-center",858386954),"Loading ..."], null):frontend.components.page.page_blocks_cp(page,cljs.core.PersistentArrayMap.EMPTY))))));
};
var G__88405 = function (block,var_args){
var p__88386 = null;
if (arguments.length > 1) {
var G__88406__i = 0, G__88406__a = new Array(arguments.length -  1);
while (G__88406__i < G__88406__a.length) {G__88406__a[G__88406__i] = arguments[G__88406__i + 1]; ++G__88406__i;}
  p__88386 = new cljs.core.IndexedSeq(G__88406__a,0,null);
} 
return G__88405__delegate.call(this,block,p__88386);};
G__88405.cljs$lang$maxFixedArity = 1;
G__88405.cljs$lang$applyTo = (function (arglist__88407){
var block = cljs.core.first(arglist__88407);
var p__88386 = cljs.core.rest(arglist__88407);
return G__88405__delegate(block,p__88386);
});
G__88405.cljs$core$IFn$_invoke$arity$variadic = G__88405__delegate;
return G__88405;
})()
,null,"capacitor.components.page/page");

//# sourceMappingURL=capacitor.components.page.js.map
