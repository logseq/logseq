goog.provide('frontend.handler.journal');
frontend.handler.journal.redirect_to_journal_BANG_ = (function frontend$handler$journal$redirect_to_journal_BANG_(page){
if(cljs.core.truth_((function (){var and__5000__auto__ = page;
if(cljs.core.truth_(and__5000__auto__)){
return frontend.state.enable_journals_QMARK_.cljs$core$IFn$_invoke$arity$1(frontend.state.get_current_repo());
} else {
return and__5000__auto__;
}
})())){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41621__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.db.async._LT_get_block.cljs$core$IFn$_invoke$arity$variadic(frontend.state.get_current_repo(),page,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"children?","children?",-1199594108),false], 0))),(function (___41611__auto__){
return promesa.protocols._promise((cljs.core.truth_(frontend.db.model.page_exists_QMARK_(page,new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("logseq.class","Journal","logseq.class/Journal",1979741081),null], null), null)))?frontend.handler.route.redirect_BANG_(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"to","to",192099007),new cljs.core.Keyword(null,"page","page",849072397),new cljs.core.Keyword(null,"path-params","path-params",-48130597),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"name","name",1843675177),page], null)], null)):(frontend.handler.page._LT_create_BANG_.cljs$core$IFn$_invoke$arity$1 ? frontend.handler.page._LT_create_BANG_.cljs$core$IFn$_invoke$arity$1(page) : frontend.handler.page._LT_create_BANG_.call(null,page))));
}));
}));
} else {
return null;
}
});
frontend.handler.journal.go_to_tomorrow_BANG_ = (function frontend$handler$journal$go_to_tomorrow_BANG_(){
return frontend.handler.journal.redirect_to_journal_BANG_(frontend.date.tomorrow());
});
frontend.handler.journal.get_current_journal = (function frontend$handler$journal$get_current_journal(){
var current_page = frontend.state.get_current_page();
var or__5002__auto__ = (cljs.core.truth_(current_page)?frontend.date.journal_title__GT_long(new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(frontend.db.model.get_block_by_uuid(current_page))):null);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return (frontend.util.time_ms.cljs$core$IFn$_invoke$arity$0 ? frontend.util.time_ms.cljs$core$IFn$_invoke$arity$0() : frontend.util.time_ms.call(null));
}
});
frontend.handler.journal.go_to_prev_journal_BANG_ = (function frontend$handler$journal$go_to_prev_journal_BANG_(){
var current_journal = frontend.handler.journal.get_current_journal();
var day = cljs_time.coerce.from_long(current_journal);
var page = frontend.date.journal_name.cljs$core$IFn$_invoke$arity$1(cljs_time.core.minus.cljs$core$IFn$_invoke$arity$2(day,cljs_time.core.days.cljs$core$IFn$_invoke$arity$1((1))));
return frontend.handler.journal.redirect_to_journal_BANG_(page);
});
frontend.handler.journal.go_to_next_journal_BANG_ = (function frontend$handler$journal$go_to_next_journal_BANG_(){
var current_journal = frontend.handler.journal.get_current_journal();
var day = cljs_time.coerce.from_long(current_journal);
var page = frontend.date.journal_name.cljs$core$IFn$_invoke$arity$1(cljs_time.core.plus.cljs$core$IFn$_invoke$arity$2(day,cljs_time.core.days.cljs$core$IFn$_invoke$arity$1((1))));
return frontend.handler.journal.redirect_to_journal_BANG_(page);
});

//# sourceMappingURL=frontend.handler.journal.js.map
