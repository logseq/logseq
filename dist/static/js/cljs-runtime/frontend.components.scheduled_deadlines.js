goog.provide('frontend.components.scheduled_deadlines');
frontend.components.scheduled_deadlines.scheduled_or_deadlines_QMARK_ = (function frontend$components$scheduled_deadlines$scheduled_or_deadlines_QMARK_(page_name){
return ((frontend.date.valid_journal_title_QMARK_(clojure.string.capitalize(page_name))) && ((((!(frontend.state.scheduled_deadlines_disabled_QMARK_() === true))) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(clojure.string.lower_case(page_name),clojure.string.lower_case(frontend.date.journal_name.cljs$core$IFn$_invoke$arity$0()))))));
});
frontend.components.scheduled_deadlines.scheduled_and_deadlines_inner = rum.core.lazy_build(rum.core.build_defcs,(function (state,page_name){
var scheduled_or_deadlines = rum.core.react(new cljs.core.Keyword("frontend.components.scheduled-deadlines","result","frontend.components.scheduled-deadlines/result",-945197964).cljs$core$IFn$_invoke$arity$1(state));
if(cljs.core.seq(scheduled_or_deadlines)){
return daiquiri.core.create_element("div",{'className':"scheduled-or-deadlines mt-8"},[frontend.ui.foldable(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"h2.font-medium","h2.font-medium",-613933304),"SCHEDULED AND DEADLINE"], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.scheduled-deadlines.references-blocks.mb-6","div.scheduled-deadlines.references-blocks.mb-6",563614237),(function (){var ref_hiccup = frontend.components.block.__GT_hiccup(scheduled_or_deadlines,new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"id","id",-1388402092),[cljs.core.str.cljs$core$IFn$_invoke$arity$1(page_name),"-agenda"].join(''),new cljs.core.Keyword(null,"ref?","ref?",1932693720),true,new cljs.core.Keyword(null,"group-by-page?","group-by-page?",1520059448),true,new cljs.core.Keyword(null,"editor-box","editor-box",708759870),frontend.components.editor.box], null),cljs.core.PersistentArrayMap.EMPTY);
return frontend.components.content.content(page_name,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"hiccup","hiccup",1218876238),ref_hiccup], null));
})()], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"title-trigger?","title-trigger?",-613599873),true], null))]);
} else {
return null;
}
}),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"init","init",-1875481434),(function (state){
var _STAR_result = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(null);
var page_name = cljs.core.first(new cljs.core.Keyword("rum","args","rum/args",1315791754).cljs$core$IFn$_invoke$arity$1(state));
promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(((frontend.components.scheduled_deadlines.scheduled_or_deadlines_QMARK_(page_name))?frontend.db.async._LT_get_date_scheduled_or_deadlines(clojure.string.capitalize(page_name)):null)),(function (result){
return promesa.protocols._promise(cljs.core.reset_BANG_(_STAR_result,result));
}));
}));

return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(state,new cljs.core.Keyword("frontend.components.scheduled-deadlines","result","frontend.components.scheduled-deadlines/result",-945197964),_STAR_result);
})], null)], null),"frontend.components.scheduled-deadlines/scheduled-and-deadlines-inner");
frontend.components.scheduled_deadlines.scheduled_and_deadlines = rum.core.lazy_build(rum.core.build_defc,(function (page_name){
return frontend.ui.lazy_visible((function (){
return frontend.components.scheduled_deadlines.scheduled_and_deadlines_inner(page_name);
}),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"debug-id","debug-id",-938947038),"scheduled-and-deadlines"], null));
}),null,"frontend.components.scheduled-deadlines/scheduled-and-deadlines");

//# sourceMappingURL=frontend.components.scheduled_deadlines.js.map
