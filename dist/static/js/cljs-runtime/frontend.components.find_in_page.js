goog.provide('frontend.components.find_in_page');
goog.scope(function(){
  frontend.components.find_in_page.goog$module$goog$object = goog.module.get('goog.object');
});
frontend.components.find_in_page.search_input = rum.core.lazy_build(rum.core.build_defc,(function (q,matches){
var _STAR_composing_QMARK_ = rum.core.use_ref(false);
var on_change_fn = (function (e){
var value = frontend.util.evalue(e);
var e_type = frontend.components.find_in_page.goog$module$goog$object.getValueByKeys(e,"type");
frontend.state.set_state_BANG_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("ui","find-in-page","ui/find-in-page",-941396467),new cljs.core.Keyword(null,"q","q",689001697)], null),value);

if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(e_type,"compositionstart")){
rum.core.set_ref_BANG_(_STAR_composing_QMARK_,true);

(frontend.handler.search.stop_debounced_search_BANG_.cljs$core$IFn$_invoke$arity$0 ? frontend.handler.search.stop_debounced_search_BANG_.cljs$core$IFn$_invoke$arity$0() : frontend.handler.search.stop_debounced_search_BANG_.call(null));
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(e_type,"compositionend")){
rum.core.set_ref_BANG_(_STAR_composing_QMARK_,false);
} else {
}
}

if(cljs.core.truth_(rum.core.deref(_STAR_composing_QMARK_))){
return null;
} else {
return (frontend.handler.search.debounced_search.cljs$core$IFn$_invoke$arity$0 ? frontend.handler.search.debounced_search.cljs$core$IFn$_invoke$arity$0() : frontend.handler.search.debounced_search.call(null));
}
});
return daiquiri.core.create_element("div",{'className':"flex w-48 relative"},[daiquiri.core.create_element("input",{'placeholder':"Find in page",'onCompositionEnd':on_change_fn,'autoFocus':true,'value':q,'className':"form-input block sm:text-sm sm:leading-5 my-2 border-none mr-4 outline-none",'id':"search-in-page-input",'onCompositionStart':on_change_fn,'aria-label':"Find in page",'onChange':rum.core.mark_sync_update(on_change_fn)},[]),((clojure.string.blank_QMARK_(q))?null:daiquiri.interpreter.interpret((function (){var temp__5804__auto__ = new cljs.core.Keyword(null,"matches","matches",635497998).cljs$core$IFn$_invoke$arity$1(matches);
if(cljs.core.truth_(temp__5804__auto__)){
var total = temp__5804__auto__;
return new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.text-sm.absolute.top-2.right-0.py-2.px-4","div.text-sm.absolute.top-2.right-0.py-2.px-4",-1595919410),new cljs.core.Keyword(null,"activeMatchOrdinal","activeMatchOrdinal",-867250467).cljs$core$IFn$_invoke$arity$2(matches,(0)),"/",total], null);
} else {
return null;
}
})())),daiquiri.core.create_element("div",{'id':"search-in-page-placeholder",'className':"absolute top-2 left-0 p-2 sm:text-sm"},null)]);
}),null,"frontend.components.find-in-page/search-input");
frontend.components.find_in_page.search_inner = rum.core.lazy_build(rum.core.build_defc,(function (p__128680){
var map__128683 = p__128680;
var map__128683__$1 = cljs.core.__destructure_map(map__128683);
var matches = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__128683__$1,new cljs.core.Keyword(null,"matches","matches",635497998));
var match_case_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__128683__$1,new cljs.core.Keyword(null,"match-case?","match-case?",-1836393163));
var q = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__128683__$1,new cljs.core.Keyword(null,"q","q",689001697));
return daiquiri.core.create_element("div",{'id':"search-in-page",'className':"flex flex-row absolute top-10 right-4 shadow-lg px-2 py-1 faster fade-in items-center"},[frontend.components.find_in_page.search_input(q,matches),daiquiri.interpreter.interpret(frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic(frontend.ui.icon("letter-case"),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
frontend.state.update_state_BANG_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("ui","find-in-page","ui/find-in-page",-941396467),new cljs.core.Keyword(null,"match-case?","match-case?",-1836393163)], null),cljs.core.not);

return (frontend.handler.search.debounced_search.cljs$core$IFn$_invoke$arity$0 ? frontend.handler.search.debounced_search.cljs$core$IFn$_invoke$arity$0() : frontend.handler.search.debounced_search.call(null));
}),new cljs.core.Keyword(null,"intent","intent",-390846953),"link",new cljs.core.Keyword(null,"small?","small?",95242445),true,new cljs.core.Keyword(null,"title","title",636505583),"Match case",new cljs.core.Keyword(null,"class","class",-2030961996),[(cljs.core.truth_(match_case_QMARK_)?"active ":null),"text-lg"].join('')], 0))),daiquiri.interpreter.interpret(frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic(frontend.ui.icon("caret-up"),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
frontend.state.set_state_BANG_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("ui","find-in-page","ui/find-in-page",-941396467),new cljs.core.Keyword(null,"backward?","backward?",-1388361117)], null),true);

return (frontend.handler.search.debounced_search.cljs$core$IFn$_invoke$arity$0 ? frontend.handler.search.debounced_search.cljs$core$IFn$_invoke$arity$0() : frontend.handler.search.debounced_search.call(null));
}),new cljs.core.Keyword(null,"intent","intent",-390846953),"link",new cljs.core.Keyword(null,"small?","small?",95242445),true,new cljs.core.Keyword(null,"class","class",-2030961996),"text-lg",new cljs.core.Keyword(null,"title","title",636505583),"Previous result"], 0))),daiquiri.interpreter.interpret(frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic(frontend.ui.icon("caret-down"),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
frontend.state.set_state_BANG_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("ui","find-in-page","ui/find-in-page",-941396467),new cljs.core.Keyword(null,"backward?","backward?",-1388361117)], null),false);

return (frontend.handler.search.debounced_search.cljs$core$IFn$_invoke$arity$0 ? frontend.handler.search.debounced_search.cljs$core$IFn$_invoke$arity$0() : frontend.handler.search.debounced_search.call(null));
}),new cljs.core.Keyword(null,"intent","intent",-390846953),"link",new cljs.core.Keyword(null,"small?","small?",95242445),true,new cljs.core.Keyword(null,"class","class",-2030961996),"text-lg",new cljs.core.Keyword(null,"title","title",636505583),"Next result"], 0))),daiquiri.interpreter.interpret(frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic(frontend.ui.icon("x"),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return frontend.handler.search.electron_exit_find_in_page_BANG_();
}),new cljs.core.Keyword(null,"intent","intent",-390846953),"link",new cljs.core.Keyword(null,"small?","small?",95242445),true,new cljs.core.Keyword(null,"class","class",-2030961996),"text-lg",new cljs.core.Keyword(null,"title","title",636505583),"Close"], 0)))]);
}),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.static$,frontend.mixins.event_mixin.cljs$core$IFn$_invoke$arity$1((function (state){
return frontend.mixins.hide_when_esc_or_outside.cljs$core$IFn$_invoke$arity$variadic(state,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"node","node",581201198),goog.dom.getElement("search-in-page"),new cljs.core.Keyword(null,"on-hide","on-hide",1263105709),(function (){
return frontend.handler.search.electron_exit_find_in_page_BANG_();
})], 0));
}))], null),"frontend.components.find-in-page/search-inner");
frontend.components.find_in_page.search = rum.core.lazy_build(rum.core.build_defc,(function (){
var map__128686 = frontend.state.sub(new cljs.core.Keyword("ui","find-in-page","ui/find-in-page",-941396467));
var map__128686__$1 = cljs.core.__destructure_map(map__128686);
var opt = map__128686__$1;
var active_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__128686__$1,new cljs.core.Keyword(null,"active?","active?",459499776));
if(cljs.core.truth_(active_QMARK_)){
return frontend.components.find_in_page.search_inner(opt);
} else {
return null;
}
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive], null),"frontend.components.find-in-page/search");

//# sourceMappingURL=frontend.components.find_in_page.js.map
