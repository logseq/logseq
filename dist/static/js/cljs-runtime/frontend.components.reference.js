goog.provide('frontend.components.reference');
frontend.components.reference.references_aux = rum.core.lazy_build(rum.core.build_defc,(function (page_entity,config){
var filters = logseq.db.common.view.get_filters((frontend.db.get_db.cljs$core$IFn$_invoke$arity$0 ? frontend.db.get_db.cljs$core$IFn$_invoke$arity$0() : frontend.db.get_db.call(null)),page_entity);
var reference_filter = (function (p__124584){
var map__124585 = p__124584;
var map__124585__$1 = cljs.core.__destructure_map(map__124585);
var ref_pages_count = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__124585__$1,new cljs.core.Keyword(null,"ref-pages-count","ref-pages-count",-74477634));
var G__124586 = new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"title","title",636505583),"Page filter",new cljs.core.Keyword(null,"variant","variant",-424354234),"ghost",new cljs.core.Keyword(null,"class","class",-2030961996),"text-muted-foreground !px-1",new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"sm","sm",-1402575065),new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (e){
var G__124588 = e.target;
var G__124589 = (function (){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.p-4","div.p-4",-165933168),frontend.components.reference_filters.filter_dialog(page_entity,ref_pages_count)], null);
});
var G__124590 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"align","align",1964212802),"end"], null);
return (logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3(G__124588,G__124589,G__124590) : logseq.shui.ui.popup_show_BANG_.call(null,G__124588,G__124589,G__124590));
})], null);
var G__124587 = frontend.ui.icon("filter-cog",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),((((cljs.core.empty_QMARK_(new cljs.core.Keyword(null,"included","included",-1002787476).cljs$core$IFn$_invoke$arity$1(filters))) && (cljs.core.empty_QMARK_(new cljs.core.Keyword(null,"excluded","excluded",-715952088).cljs$core$IFn$_invoke$arity$1(filters)))))?"":((((cljs.core.seq(new cljs.core.Keyword(null,"included","included",-1002787476).cljs$core$IFn$_invoke$arity$1(filters))) && (cljs.core.empty_QMARK_(new cljs.core.Keyword(null,"excluded","excluded",-715952088).cljs$core$IFn$_invoke$arity$1(filters)))))?"text-success":((((cljs.core.empty_QMARK_(new cljs.core.Keyword(null,"included","included",-1002787476).cljs$core$IFn$_invoke$arity$1(filters))) && (cljs.core.seq(new cljs.core.Keyword(null,"excluded","excluded",-715952088).cljs$core$IFn$_invoke$arity$1(filters)))))?"text-error":"text-warning"
)))], null));
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2(G__124586,G__124587) : logseq.shui.ui.button.call(null,G__124586,G__124587));
});
return frontend.components.views.view(new cljs.core.PersistentArrayMap(null, 6, [new cljs.core.Keyword(null,"view-parent","view-parent",675596601),page_entity,new cljs.core.Keyword(null,"view-feature-type","view-feature-type",-945869610),new cljs.core.Keyword(null,"linked-references","linked-references",-2117592379),new cljs.core.Keyword(null,"show-items-count?","show-items-count?",-1022363900),true,new cljs.core.Keyword(null,"additional-actions","additional-actions",1699457595),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [reference_filter], null),new cljs.core.Keyword(null,"columns","columns",1998437288),frontend.components.views.build_columns.cljs$core$IFn$_invoke$arity$variadic(config,cljs.core.PersistentVector.EMPTY,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.PersistentArrayMap.EMPTY], 0)),new cljs.core.Keyword(null,"config","config",994861415),config], null));
}),null,"frontend.components.reference/references-aux");
frontend.components.reference.references_cp = rum.core.lazy_build(rum.core.build_defc,(function (entity,config){
var block = (function (){var G__124591 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(entity);
return (frontend.db.sub_block.cljs$core$IFn$_invoke$arity$1 ? frontend.db.sub_block.cljs$core$IFn$_invoke$arity$1(G__124591) : frontend.db.sub_block.call(null,G__124591));
})();
return frontend.components.reference.references_aux(block,config);
}),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive,frontend.db_mixins.query], null),"frontend.components.reference/references-cp");
frontend.components.reference.references = rum.core.lazy_build(rum.core.build_defc,(function (entity,config){
return daiquiri.interpreter.interpret((function (){var temp__5804__auto__ = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(entity);
if(cljs.core.truth_(temp__5804__auto__)){
var id = temp__5804__auto__;
var vec__124659 = (logseq.shui.hooks.use_state.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.hooks.use_state.cljs$core$IFn$_invoke$arity$1(null) : logseq.shui.hooks.use_state.call(null,null));
var has_references_QMARK_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__124659,(0),null);
var set_has_references_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__124659,(1),null);
logseq.shui.hooks.use_effect_BANG_((function (){
return frontend.common.missionary.run_task_STAR_(cljs.core.partial.cljs$core$IFn$_invoke$arity$2((function (){var cr124662_block_0 = (function frontend$components$reference$cr124662_block_0(cr124662_state){
try{var cr124662_place_0 = frontend.common.missionary._LT__BANG_;
var cr124662_place_1 = frontend.state._LT_invoke_db_worker;
var cr124662_place_2 = new cljs.core.Keyword("thread-api","block-refs-check","thread-api/block-refs-check",-41022236);
var cr124662_place_3 = frontend.state.get_current_repo;
var cr124662_place_4 = (function (){var fexpr__124677 = cr124662_place_3;
return (fexpr__124677.cljs$core$IFn$_invoke$arity$0 ? fexpr__124677.cljs$core$IFn$_invoke$arity$0() : fexpr__124677.call(null));
})();
var cr124662_place_5 = id;
var cr124662_place_6 = cljs.core.with_meta(cljs.core.PersistentArrayMap.EMPTY,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr124662_place_7 = (function (){var G__124679 = cr124662_place_2;
var G__124680 = cr124662_place_4;
var G__124681 = cr124662_place_5;
var G__124682 = cr124662_place_6;
var fexpr__124678 = cr124662_place_1;
return (fexpr__124678.cljs$core$IFn$_invoke$arity$4 ? fexpr__124678.cljs$core$IFn$_invoke$arity$4(G__124679,G__124680,G__124681,G__124682) : fexpr__124678.call(null,G__124679,G__124680,G__124681,G__124682));
})();
var cr124662_place_8 = (function (){var G__124686 = cr124662_place_7;
var fexpr__124685 = cr124662_place_0;
return (fexpr__124685.cljs$core$IFn$_invoke$arity$1 ? fexpr__124685.cljs$core$IFn$_invoke$arity$1(G__124686) : fexpr__124685.call(null,G__124686));
})();
(cr124662_state[(0)] = cr124662_block_1);

return missionary.core.park(cr124662_place_8);
}catch (e124676){var cr124662_exception = e124676;
(cr124662_state[(0)] = null);

throw cr124662_exception;
}});
var cr124662_block_1 = (function frontend$components$reference$cr124662_block_1(cr124662_state){
try{var cr124662_place_9 = missionary.core.unpark();
var cr124662_place_10 = set_has_references_BANG_;
var cr124662_place_11 = cr124662_place_9;
var cr124662_place_12 = (function (){var G__124691 = cr124662_place_11;
var fexpr__124689 = cr124662_place_10;
return (fexpr__124689.cljs$core$IFn$_invoke$arity$1 ? fexpr__124689.cljs$core$IFn$_invoke$arity$1(G__124691) : fexpr__124689.call(null,G__124691));
})();
(cr124662_state[(0)] = null);

return cr124662_place_12;
}catch (e124688){var cr124662_exception = e124688;
(cr124662_state[(0)] = null);

throw cr124662_exception;
}});
return cloroutine.impl.coroutine((function (){var G__124692 = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1((1));
(G__124692[(0)] = cr124662_block_0);

return G__124692;
})());
})(),missionary.core.sp_run));
}),cljs.core.PersistentVector.EMPTY);

if(cljs.core.truth_(has_references_QMARK_)){
return frontend.ui.catch_error(frontend.ui.component_error(((frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(frontend.state.get_current_repo()))?"Linked References: Unexpected error.":"Linked References: Unexpected error. Please re-index your graph first.")),frontend.components.reference.references_cp(entity,config));
} else {
return null;
}
} else {
return null;
}
})());
}),null,"frontend.components.reference/references");
frontend.components.reference.unlinked_references = rum.core.lazy_build(rum.core.build_defc,(function (entity,config){
return daiquiri.interpreter.interpret((function (){var temp__5804__auto__ = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(entity);
if(cljs.core.truth_(temp__5804__auto__)){
var id = temp__5804__auto__;
var vec__124770 = (logseq.shui.hooks.use_state.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.hooks.use_state.cljs$core$IFn$_invoke$arity$1(null) : logseq.shui.hooks.use_state.call(null,null));
var has_references_QMARK_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__124770,(0),null);
var set_has_references_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__124770,(1),null);
logseq.shui.hooks.use_effect_BANG_((function (){
return frontend.common.missionary.run_task_STAR_(cljs.core.partial.cljs$core$IFn$_invoke$arity$2((function (){var cr124775_block_0 = (function frontend$components$reference$cr124775_block_0(cr124775_state){
try{var cr124775_place_0 = frontend.common.missionary._LT__BANG_;
var cr124775_place_1 = frontend.state._LT_invoke_db_worker;
var cr124775_place_2 = new cljs.core.Keyword("thread-api","block-refs-check","thread-api/block-refs-check",-41022236);
var cr124775_place_3 = frontend.state.get_current_repo;
var cr124775_place_4 = (function (){var fexpr__124803 = cr124775_place_3;
return (fexpr__124803.cljs$core$IFn$_invoke$arity$0 ? fexpr__124803.cljs$core$IFn$_invoke$arity$0() : fexpr__124803.call(null));
})();
var cr124775_place_5 = id;
var cr124775_place_6 = new cljs.core.Keyword(null,"unlinked?","unlinked?",440907520);
var cr124775_place_7 = true;
var cr124775_place_8 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr124775_place_6,cr124775_place_7]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr124775_place_9 = (function (){var G__124805 = cr124775_place_2;
var G__124806 = cr124775_place_4;
var G__124807 = cr124775_place_5;
var G__124808 = cr124775_place_8;
var fexpr__124804 = cr124775_place_1;
return (fexpr__124804.cljs$core$IFn$_invoke$arity$4 ? fexpr__124804.cljs$core$IFn$_invoke$arity$4(G__124805,G__124806,G__124807,G__124808) : fexpr__124804.call(null,G__124805,G__124806,G__124807,G__124808));
})();
var cr124775_place_10 = (function (){var G__124810 = cr124775_place_9;
var fexpr__124809 = cr124775_place_0;
return (fexpr__124809.cljs$core$IFn$_invoke$arity$1 ? fexpr__124809.cljs$core$IFn$_invoke$arity$1(G__124810) : fexpr__124809.call(null,G__124810));
})();
(cr124775_state[(0)] = cr124775_block_1);

return missionary.core.park(cr124775_place_10);
}catch (e124800){var cr124775_exception = e124800;
(cr124775_state[(0)] = null);

throw cr124775_exception;
}});
var cr124775_block_1 = (function frontend$components$reference$cr124775_block_1(cr124775_state){
try{var cr124775_place_11 = missionary.core.unpark();
var cr124775_place_12 = set_has_references_BANG_;
var cr124775_place_13 = cr124775_place_11;
var cr124775_place_14 = (function (){var G__124813 = cr124775_place_13;
var fexpr__124812 = cr124775_place_12;
return (fexpr__124812.cljs$core$IFn$_invoke$arity$1 ? fexpr__124812.cljs$core$IFn$_invoke$arity$1(G__124813) : fexpr__124812.call(null,G__124813));
})();
(cr124775_state[(0)] = null);

return cr124775_place_14;
}catch (e124811){var cr124775_exception = e124811;
(cr124775_state[(0)] = null);

throw cr124775_exception;
}});
return cloroutine.impl.coroutine((function (){var G__124814 = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1((1));
(G__124814[(0)] = cr124775_block_0);

return G__124814;
})());
})(),missionary.core.sp_run));
}),cljs.core.PersistentVector.EMPTY);

if(cljs.core.truth_(has_references_QMARK_)){
return frontend.components.views.view(new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"view-parent","view-parent",675596601),entity,new cljs.core.Keyword(null,"view-feature-type","view-feature-type",-945869610),new cljs.core.Keyword(null,"unlinked-references","unlinked-references",1918870007),new cljs.core.Keyword(null,"columns","columns",1998437288),frontend.components.views.build_columns.cljs$core$IFn$_invoke$arity$variadic(config,cljs.core.PersistentVector.EMPTY,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.PersistentArrayMap.EMPTY], 0)),new cljs.core.Keyword(null,"foldable-options","foldable-options",1611436976),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"default-collapsed?","default-collapsed?",-1350393823),true], null),new cljs.core.Keyword(null,"config","config",994861415),config], null));
} else {
return null;
}
} else {
return null;
}
})());
}),null,"frontend.components.reference/unlinked-references");

//# sourceMappingURL=frontend.components.reference.js.map
