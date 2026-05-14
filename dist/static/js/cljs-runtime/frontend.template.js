goog.provide('frontend.template');
frontend.template.variable_rules = (function frontend$template$variable_rules(){
return new cljs.core.PersistentArrayMap(null, 5, ["today",(function (){var G__103040 = frontend.date.today();
return (frontend.util.ref.__GT_page_ref.cljs$core$IFn$_invoke$arity$1 ? frontend.util.ref.__GT_page_ref.cljs$core$IFn$_invoke$arity$1(G__103040) : frontend.util.ref.__GT_page_ref.call(null,G__103040));
})(),"yesterday",(function (){var G__103043 = frontend.date.yesterday();
return (frontend.util.ref.__GT_page_ref.cljs$core$IFn$_invoke$arity$1 ? frontend.util.ref.__GT_page_ref.cljs$core$IFn$_invoke$arity$1(G__103043) : frontend.util.ref.__GT_page_ref.call(null,G__103043));
})(),"tomorrow",(function (){var G__103045 = frontend.date.tomorrow();
return (frontend.util.ref.__GT_page_ref.cljs$core$IFn$_invoke$arity$1 ? frontend.util.ref.__GT_page_ref.cljs$core$IFn$_invoke$arity$1(G__103045) : frontend.util.ref.__GT_page_ref.call(null,G__103045));
})(),"time",frontend.date.get_current_time(),"current page",(function (){var temp__5804__auto__ = (function (){var or__5002__auto__ = frontend.state.get_current_page();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return frontend.date.today();
}
})();
if(cljs.core.truth_(temp__5804__auto__)){
var current_page = temp__5804__auto__;
var block_uuid = cljs.core.parse_uuid(current_page);
var page = (cljs.core.truth_(block_uuid)?frontend.db.utils.entity.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_uuid], null)):logseq.db.get_page(frontend.db.conn.get_db.cljs$core$IFn$_invoke$arity$0(),current_page));
var current_page_SINGLEQUOTE_ = new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(page);
if(cljs.core.truth_(current_page_SINGLEQUOTE_)){
return (frontend.util.ref.__GT_page_ref.cljs$core$IFn$_invoke$arity$1 ? frontend.util.ref.__GT_page_ref.cljs$core$IFn$_invoke$arity$1(current_page_SINGLEQUOTE_) : frontend.util.ref.__GT_page_ref.call(null,current_page_SINGLEQUOTE_));
} else {
return null;
}
} else {
return null;
}
})()], null);
});
frontend.template.template_re = /<%([^%].*?)%>/;
frontend.template.resolve_dynamic_template_BANG_ = (function frontend$template$resolve_dynamic_template_BANG_(content){
return clojure.string.replace(content,frontend.template.template_re,(function (p__103066){
var vec__103069 = p__103066;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__103069,(0),null);
var match = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__103069,(1),null);
var match__$1 = clojure.string.trim(match);
if(clojure.string.blank_QMARK_(match__$1)){
return "";
} else {
if(cljs.core.truth_(cljs.core.get.cljs$core$IFn$_invoke$arity$2(frontend.template.variable_rules(),clojure.string.lower_case(match__$1)))){
return cljs.core.get.cljs$core$IFn$_invoke$arity$2(frontend.template.variable_rules(),clojure.string.lower_case(match__$1));
} else {
var temp__5802__auto__ = frontend.date.nld_parse(match__$1);
if(cljs.core.truth_(temp__5802__auto__)){
var nld = temp__5802__auto__;
var date = (function (){var G__103080 = (new goog.date.DateTime());
G__103080.setTime(nld.getTime());

return G__103080;
})();
var G__103084 = frontend.date.journal_name.cljs$core$IFn$_invoke$arity$1(date);
return (frontend.util.ref.__GT_page_ref.cljs$core$IFn$_invoke$arity$1 ? frontend.util.ref.__GT_page_ref.cljs$core$IFn$_invoke$arity$1(G__103084) : frontend.util.ref.__GT_page_ref.call(null,G__103084));
} else {
return match__$1;
}

}
}
}));
});

//# sourceMappingURL=frontend.template.js.map
