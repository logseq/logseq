goog.provide('frontend.handler.db_based.recent');
frontend.handler.db_based.recent.add_page_to_recent_BANG_ = (function frontend$handler$db_based$recent$add_page_to_recent_BANG_(db_id,_click_from_recent_QMARK_){
if(cljs.core.truth_(db_id)){
} else {
throw (new Error(["Assert failed: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(typeof db_id === 'number'),"\n","db-id"].join('')));
}

if(cljs.core.truth_(new cljs.core.Keyword("db","restoring?","db/restoring?",-1653366233).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state)))){
return null;
} else {
var temp__5804__auto__ = (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(db_id) : frontend.db.entity.call(null,db_id));
if(cljs.core.truth_(temp__5804__auto__)){
var page = temp__5804__auto__;
var pages = frontend.state.get_recent_pages();
if(cljs.core.truth_((function (){var or__5002__auto__ = (logseq.db.hidden_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.hidden_QMARK_.cljs$core$IFn$_invoke$arity$1(page) : logseq.db.hidden_QMARK_.call(null,page));
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var fexpr__103620 = cljs.core.set(pages);
return (fexpr__103620.cljs$core$IFn$_invoke$arity$1 ? fexpr__103620.cljs$core$IFn$_invoke$arity$1(db_id) : fexpr__103620.call(null,db_id));
}
})())){
return null;
} else {
var new_pages = cljs.core.vec(cljs.core.take.cljs$core$IFn$_invoke$arity$2((15),cljs.core.distinct.cljs$core$IFn$_invoke$arity$1(cljs.core.cons(db_id,pages))));
return frontend.state.set_recent_pages_BANG_(new_pages);
}
} else {
return null;
}
}
});
frontend.handler.db_based.recent.get_recent_pages = (function frontend$handler$db_based$recent$get_recent_pages(){
return cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (e){
var and__5000__auto__ = (logseq.db.property_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.property_QMARK_.cljs$core$IFn$_invoke$arity$1(e) : logseq.db.property_QMARK_.call(null,e));
if(cljs.core.truth_(and__5000__auto__)){
return new cljs.core.Keyword("logseq.property","hide?","logseq.property/hide?",68365746).cljs$core$IFn$_invoke$arity$1(e) === true;
} else {
return and__5000__auto__;
}
}),cljs.core.remove.cljs$core$IFn$_invoke$arity$2(logseq.db.hidden_QMARK_,cljs.core.filter.cljs$core$IFn$_invoke$arity$2(frontend.db.page_QMARK_,cljs.core.keep.cljs$core$IFn$_invoke$arity$2(frontend.db.entity,cljs.core.take.cljs$core$IFn$_invoke$arity$2((20),cljs.core.distinct.cljs$core$IFn$_invoke$arity$1(frontend.state.get_recent_pages()))))));
});

//# sourceMappingURL=frontend.handler.db_based.recent.js.map
