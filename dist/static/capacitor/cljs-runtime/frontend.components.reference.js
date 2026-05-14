goog.provide('frontend.components.reference');
frontend.components.reference.references_aux = rum.core.lazy_build(rum.core.build_defc,(function (page_entity,config){
var filters = logseq.db.common.view.get_filters((frontend.db.get_db.cljs$core$IFn$_invoke$arity$0 ? frontend.db.get_db.cljs$core$IFn$_invoke$arity$0() : frontend.db.get_db.call(null)),page_entity);
var reference_filter = (function (p__87564){
var map__87565 = p__87564;
var map__87565__$1 = cljs.core.__destructure_map(map__87565);
var ref_pages_count = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__87565__$1,new cljs.core.Keyword(null,"ref-pages-count","ref-pages-count",-74477634));
var G__87566 = new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"title","title",636505583),"Page filter",new cljs.core.Keyword(null,"variant","variant",-424354234),"ghost",new cljs.core.Keyword(null,"class","class",-2030961996),"text-muted-foreground !px-1",new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"sm","sm",-1402575065),new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (e){
var G__87568 = e.target;
var G__87569 = (function (){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.p-4","div.p-4",-165933168),frontend.components.reference_filters.filter_dialog(page_entity,ref_pages_count)], null);
});
var G__87570 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"align","align",1964212802),"end"], null);
return (logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3(G__87568,G__87569,G__87570) : logseq.shui.ui.popup_show_BANG_.call(null,G__87568,G__87569,G__87570));
})], null);
var G__87567 = frontend.ui.icon("filter-cog",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),((((cljs.core.empty_QMARK_(new cljs.core.Keyword(null,"included","included",-1002787476).cljs$core$IFn$_invoke$arity$1(filters))) && (cljs.core.empty_QMARK_(new cljs.core.Keyword(null,"excluded","excluded",-715952088).cljs$core$IFn$_invoke$arity$1(filters)))))?"":((((cljs.core.seq(new cljs.core.Keyword(null,"included","included",-1002787476).cljs$core$IFn$_invoke$arity$1(filters))) && (cljs.core.empty_QMARK_(new cljs.core.Keyword(null,"excluded","excluded",-715952088).cljs$core$IFn$_invoke$arity$1(filters)))))?"text-success":((((cljs.core.empty_QMARK_(new cljs.core.Keyword(null,"included","included",-1002787476).cljs$core$IFn$_invoke$arity$1(filters))) && (cljs.core.seq(new cljs.core.Keyword(null,"excluded","excluded",-715952088).cljs$core$IFn$_invoke$arity$1(filters)))))?"text-error":"text-warning"
)))], null));
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2(G__87566,G__87567) : logseq.shui.ui.button.call(null,G__87566,G__87567));
});
return frontend.components.views.view(new cljs.core.PersistentArrayMap(null, 6, [new cljs.core.Keyword(null,"view-parent","view-parent",675596601),page_entity,new cljs.core.Keyword(null,"view-feature-type","view-feature-type",-945869610),new cljs.core.Keyword(null,"linked-references","linked-references",-2117592379),new cljs.core.Keyword(null,"show-items-count?","show-items-count?",-1022363900),true,new cljs.core.Keyword(null,"additional-actions","additional-actions",1699457595),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [reference_filter], null),new cljs.core.Keyword(null,"columns","columns",1998437288),frontend.components.views.build_columns.cljs$core$IFn$_invoke$arity$variadic(config,cljs.core.PersistentVector.EMPTY,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.PersistentArrayMap.EMPTY], 0)),new cljs.core.Keyword(null,"config","config",994861415),config], null));
}),null,"frontend.components.reference/references-aux");
frontend.components.reference.references_cp = rum.core.lazy_build(rum.core.build_defc,(function (entity,config){
var block = (function (){var G__87579 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(entity);
return (frontend.db.sub_block.cljs$core$IFn$_invoke$arity$1 ? frontend.db.sub_block.cljs$core$IFn$_invoke$arity$1(G__87579) : frontend.db.sub_block.call(null,G__87579));
})();
return frontend.components.reference.references_aux(block,config);
}),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive,frontend.db_mixins.query], null),"frontend.components.reference/references-cp");
frontend.components.reference.references = rum.core.lazy_build(rum.core.build_defc,(function (entity,config){
return daiquiri.interpreter.interpret((function (){var temp__5804__auto__ = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(entity);
if(cljs.core.truth_(temp__5804__auto__)){
var id = temp__5804__auto__;
var vec__87629 = (logseq.shui.hooks.use_state.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.hooks.use_state.cljs$core$IFn$_invoke$arity$1(null) : logseq.shui.hooks.use_state.call(null,null));
var has_references_QMARK_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__87629,(0),null);
var set_has_references_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__87629,(1),null);
logseq.shui.hooks.use_effect_BANG_((function (){
return frontend.common.missionary.run_task_STAR_(cljs.core.partial.cljs$core$IFn$_invoke$arity$2((function (){var cr87632_block_0 = (function frontend$components$reference$cr87632_block_0(cr87632_state){
try{var cr87632_place_0 = frontend.common.missionary._LT__BANG_;
var cr87632_place_1 = frontend.state._LT_invoke_db_worker;
var cr87632_place_2 = new cljs.core.Keyword("thread-api","block-refs-check","thread-api/block-refs-check",-41022236);
var cr87632_place_3 = frontend.state.get_current_repo;
var cr87632_place_4 = (function (){var fexpr__87650 = cr87632_place_3;
return (fexpr__87650.cljs$core$IFn$_invoke$arity$0 ? fexpr__87650.cljs$core$IFn$_invoke$arity$0() : fexpr__87650.call(null));
})();
var cr87632_place_5 = id;
var cr87632_place_6 = cljs.core.with_meta(cljs.core.PersistentArrayMap.EMPTY,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr87632_place_7 = (function (){var G__87652 = cr87632_place_2;
var G__87653 = cr87632_place_4;
var G__87654 = cr87632_place_5;
var G__87655 = cr87632_place_6;
var fexpr__87651 = cr87632_place_1;
return (fexpr__87651.cljs$core$IFn$_invoke$arity$4 ? fexpr__87651.cljs$core$IFn$_invoke$arity$4(G__87652,G__87653,G__87654,G__87655) : fexpr__87651.call(null,G__87652,G__87653,G__87654,G__87655));
})();
var cr87632_place_8 = (function (){var G__87657 = cr87632_place_7;
var fexpr__87656 = cr87632_place_0;
return (fexpr__87656.cljs$core$IFn$_invoke$arity$1 ? fexpr__87656.cljs$core$IFn$_invoke$arity$1(G__87657) : fexpr__87656.call(null,G__87657));
})();
(cr87632_state[(0)] = cr87632_block_1);

return missionary.core.park(cr87632_place_8);
}catch (e87649){var cr87632_exception = e87649;
(cr87632_state[(0)] = null);

throw cr87632_exception;
}});
var cr87632_block_1 = (function frontend$components$reference$cr87632_block_1(cr87632_state){
try{var cr87632_place_9 = missionary.core.unpark();
var cr87632_place_10 = set_has_references_BANG_;
var cr87632_place_11 = cr87632_place_9;
var cr87632_place_12 = (function (){var G__87660 = cr87632_place_11;
var fexpr__87659 = cr87632_place_10;
return (fexpr__87659.cljs$core$IFn$_invoke$arity$1 ? fexpr__87659.cljs$core$IFn$_invoke$arity$1(G__87660) : fexpr__87659.call(null,G__87660));
})();
(cr87632_state[(0)] = null);

return cr87632_place_12;
}catch (e87658){var cr87632_exception = e87658;
(cr87632_state[(0)] = null);

throw cr87632_exception;
}});
return cloroutine.impl.coroutine((function (){var G__87663 = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1((1));
(G__87663[(0)] = cr87632_block_0);

return G__87663;
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
var vec__87714 = (logseq.shui.hooks.use_state.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.hooks.use_state.cljs$core$IFn$_invoke$arity$1(null) : logseq.shui.hooks.use_state.call(null,null));
var has_references_QMARK_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__87714,(0),null);
var set_has_references_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__87714,(1),null);
logseq.shui.hooks.use_effect_BANG_((function (){
return frontend.common.missionary.run_task_STAR_(cljs.core.partial.cljs$core$IFn$_invoke$arity$2((function (){var cr87717_block_0 = (function frontend$components$reference$cr87717_block_0(cr87717_state){
try{var cr87717_place_0 = frontend.common.missionary._LT__BANG_;
var cr87717_place_1 = frontend.state._LT_invoke_db_worker;
var cr87717_place_2 = new cljs.core.Keyword("thread-api","block-refs-check","thread-api/block-refs-check",-41022236);
var cr87717_place_3 = frontend.state.get_current_repo;
var cr87717_place_4 = (function (){var fexpr__87741 = cr87717_place_3;
return (fexpr__87741.cljs$core$IFn$_invoke$arity$0 ? fexpr__87741.cljs$core$IFn$_invoke$arity$0() : fexpr__87741.call(null));
})();
var cr87717_place_5 = id;
var cr87717_place_6 = new cljs.core.Keyword(null,"unlinked?","unlinked?",440907520);
var cr87717_place_7 = true;
var cr87717_place_8 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr87717_place_6,cr87717_place_7]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr87717_place_9 = (function (){var G__87743 = cr87717_place_2;
var G__87744 = cr87717_place_4;
var G__87745 = cr87717_place_5;
var G__87746 = cr87717_place_8;
var fexpr__87742 = cr87717_place_1;
return (fexpr__87742.cljs$core$IFn$_invoke$arity$4 ? fexpr__87742.cljs$core$IFn$_invoke$arity$4(G__87743,G__87744,G__87745,G__87746) : fexpr__87742.call(null,G__87743,G__87744,G__87745,G__87746));
})();
var cr87717_place_10 = (function (){var G__87751 = cr87717_place_9;
var fexpr__87750 = cr87717_place_0;
return (fexpr__87750.cljs$core$IFn$_invoke$arity$1 ? fexpr__87750.cljs$core$IFn$_invoke$arity$1(G__87751) : fexpr__87750.call(null,G__87751));
})();
(cr87717_state[(0)] = cr87717_block_1);

return missionary.core.park(cr87717_place_10);
}catch (e87740){var cr87717_exception = e87740;
(cr87717_state[(0)] = null);

throw cr87717_exception;
}});
var cr87717_block_1 = (function frontend$components$reference$cr87717_block_1(cr87717_state){
try{var cr87717_place_11 = missionary.core.unpark();
var cr87717_place_12 = set_has_references_BANG_;
var cr87717_place_13 = cr87717_place_11;
var cr87717_place_14 = (function (){var G__87754 = cr87717_place_13;
var fexpr__87753 = cr87717_place_12;
return (fexpr__87753.cljs$core$IFn$_invoke$arity$1 ? fexpr__87753.cljs$core$IFn$_invoke$arity$1(G__87754) : fexpr__87753.call(null,G__87754));
})();
(cr87717_state[(0)] = null);

return cr87717_place_14;
}catch (e87752){var cr87717_exception = e87752;
(cr87717_state[(0)] = null);

throw cr87717_exception;
}});
return cloroutine.impl.coroutine((function (){var G__87755 = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1((1));
(G__87755[(0)] = cr87717_block_0);

return G__87755;
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
