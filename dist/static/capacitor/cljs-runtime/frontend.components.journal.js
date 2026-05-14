goog.provide('frontend.components.journal');
frontend.components.journal.journal_cp = rum.core.lazy_build(rum.core.build_defc,(function (id,last_QMARK_){
var attrs91119 = (cljs.core.truth_(last_QMARK_)?new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"journal-last-item"], null):null);
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs91119))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["journal-item","content"], null)], null),attrs91119], 0))):{'className':"journal-item content"}),((cljs.core.map_QMARK_(attrs91119))?[frontend.components.page.page_cp(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("db","id","db/id",-1388397098),id], null))]:[daiquiri.interpreter.interpret(attrs91119),frontend.components.page.page_cp(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("db","id","db/id",-1388397098),id], null))]));
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.static$], null),"frontend.components.journal/journal-cp");
frontend.components.journal.sub_journals = (function frontend$components$journal$sub_journals(){
var temp__5804__auto__ = frontend.state.get_current_repo();
if(cljs.core.truth_(temp__5804__auto__)){
var repo = temp__5804__auto__;
var G__91121 = frontend.db.react.q(repo,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("frontend.worker.react","journals","frontend.worker.react/journals",2109493976)], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"query-fn","query-fn",-646736760),(function (_){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.components.views._LT_load_view_data(null,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"journals?","journals?",1584679180),true], null))),(function (p__91122){
var map__91123 = p__91122;
var map__91123__$1 = cljs.core.__destructure_map(map__91123);
var data = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__91123__$1,new cljs.core.Keyword(null,"data","data",-232669377));
return promesa.protocols._promise(cljs.core.remove.cljs$core$IFn$_invoke$arity$2(cljs.core.nil_QMARK_,data));
}));
}));
})], null),null);
if((G__91121 == null)){
return null;
} else {
return frontend.util.react(G__91121);
}
} else {
return null;
}
});
frontend.components.journal.all_journals = rum.core.lazy_build(rum.core.build_defc,(function (){
var data = frontend.components.journal.sub_journals();
if(cljs.core.seq(data)){
var attrs91126 = (function (){var G__91127 = new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"custom-scroll-parent","custom-scroll-parent",1031485618),frontend.util.app_scroll_container_node.cljs$core$IFn$_invoke$arity$0(),new cljs.core.Keyword(null,"increase-viewport-by","increase-viewport-by",1517073864),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"top","top",-1856271961),(300),new cljs.core.Keyword(null,"bottom","bottom",-1550509018),(300)], null),new cljs.core.Keyword(null,"compute-item-key","compute-item-key",-621146487),(function (idx){
var id = frontend.util.nth_safe(data,idx);
return ["journal-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(id)].join('');
}),new cljs.core.Keyword(null,"total-count","total-count",-1999441386),cljs.core.count(data),new cljs.core.Keyword(null,"item-content","item-content",1656730280),(function (idx){
var id = frontend.util.nth_safe(data,idx);
var last_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2((idx + (1)),cljs.core.count(data));
return frontend.components.journal.journal_cp(id,last_QMARK_);
})], null);
return (frontend.ui.virtualized_list.cljs$core$IFn$_invoke$arity$1 ? frontend.ui.virtualized_list.cljs$core$IFn$_invoke$arity$1(G__91127) : frontend.ui.virtualized_list.call(null,G__91127));
})();
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs91126))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"id","id",-1388402092),"journals"], null),attrs91126], 0))):{'id':"journals"}),((cljs.core.map_QMARK_(attrs91126))?null:[daiquiri.interpreter.interpret(attrs91126)]));
} else {
return null;
}
}),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive,frontend.db_mixins.query], null),"frontend.components.journal/all-journals");

//# sourceMappingURL=frontend.components.journal.js.map
