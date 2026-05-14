goog.provide('logseq.sdk.experiments');
logseq.sdk.experiments.cp_page_editor = (function logseq$sdk$experiments$cp_page_editor(props){
var props1 = logseq.sdk.utils.jsx__GT_clj(props);
var page_name = (function (){var G__131653 = props1;
if((G__131653 == null)){
return null;
} else {
return new cljs.core.Keyword(null,"page","page",849072397).cljs$core$IFn$_invoke$arity$1(G__131653);
}
})();
var linked_refs_QMARK_ = (function (){var G__131654 = props1;
if((G__131654 == null)){
return null;
} else {
return new cljs.core.Keyword(null,"include-linked-refs","include-linked-refs",-35557267).cljs$core$IFn$_invoke$arity$1(G__131654);
}
})();
var unlinked_refs_QMARK_ = (function (){var G__131655 = props1;
if((G__131655 == null)){
return null;
} else {
return new cljs.core.Keyword(null,"include-unlinked-refs","include-unlinked-refs",487448096).cljs$core$IFn$_invoke$arity$1(G__131655);
}
})();
var config = (function (){var G__131656 = props1;
if((G__131656 == null)){
return null;
} else {
return cljs.core.dissoc.cljs$core$IFn$_invoke$arity$variadic(G__131656,new cljs.core.Keyword(null,"page","page",849072397),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"include-linked-refs","include-linked-refs",-35557267),new cljs.core.Keyword(null,"include-unlinked-refs","include-unlinked-refs",487448096)], 0));
}
})();
var temp__5804__auto__ = frontend.components.page.get_page_entity(page_name);
if(cljs.core.truth_(temp__5804__auto__)){
var _entity = temp__5804__auto__;
return frontend.components.page.page_cp(new cljs.core.PersistentArrayMap(null, 7, [new cljs.core.Keyword(null,"repo","repo",-1999060679),frontend.state.get_current_repo(),new cljs.core.Keyword(null,"page-name","page-name",974981762),page_name,new cljs.core.Keyword(null,"preview?","preview?",590561578),false,new cljs.core.Keyword(null,"sidebar?","sidebar?",-534999672),false,new cljs.core.Keyword(null,"linked-refs?","linked-refs?",-119740497),(!(linked_refs_QMARK_ === false)),new cljs.core.Keyword(null,"unlinked-refs?","unlinked-refs?",-1047663389),(!(unlinked_refs_QMARK_ === false)),new cljs.core.Keyword(null,"config","config",994861415),config], null));
} else {
return null;
}
});
goog.exportSymbol('logseq.sdk.experiments.cp_page_editor', logseq.sdk.experiments.cp_page_editor);
logseq.sdk.experiments.register_fenced_code_renderer = (function logseq$sdk$experiments$register_fenced_code_renderer(pid,type,opts){
var temp__5804__auto__ = frontend.handler.plugin.get_plugin_inst(pid);
if(cljs.core.truth_(temp__5804__auto__)){
var _pl = temp__5804__auto__;
return frontend.handler.plugin.register_fenced_code_renderer(cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(pid),type,cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (p1__131657_SHARP_,p2__131658_SHARP_){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(p1__131657_SHARP_,p2__131658_SHARP_,(opts[cljs.core.name(p2__131658_SHARP_)]));
}),cljs.core.PersistentArrayMap.EMPTY,new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"edit","edit",-1641834166),new cljs.core.Keyword(null,"before","before",-1633692388),new cljs.core.Keyword(null,"subs","subs",-186681991),new cljs.core.Keyword(null,"render","render",-1408033454)], null)));
} else {
return null;
}
});
goog.exportSymbol('logseq.sdk.experiments.register_fenced_code_renderer', logseq.sdk.experiments.register_fenced_code_renderer);
logseq.sdk.experiments.register_route_renderer = (function logseq$sdk$experiments$register_route_renderer(pid,key,opts){
var temp__5804__auto__ = frontend.handler.plugin.get_plugin_inst(pid);
if(cljs.core.truth_(temp__5804__auto__)){
var _pl = temp__5804__auto__;
var key__$1 = frontend.util.safe_keyword(key);
return frontend.handler.plugin.register_route_renderer(cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(pid),key__$1,cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (r,k){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(r,k,(function (){var G__131660 = (opts[cljs.core.name(k)]);
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"name","name",1843675177),k)){
return (function (p1__131659_SHARP_){
if(cljs.core.truth_(p1__131659_SHARP_)){
return frontend.util.safe_keyword(p1__131659_SHARP_);
} else {
return key__$1;
}
})(G__131660);
} else {
return G__131660;
}
})());
}),cljs.core.PersistentArrayMap.EMPTY,new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"v","v",21465059),new cljs.core.Keyword(null,"name","name",1843675177),new cljs.core.Keyword(null,"path","path",-188191168),new cljs.core.Keyword(null,"subs","subs",-186681991),new cljs.core.Keyword(null,"render","render",-1408033454)], null)));
} else {
return null;
}
});
goog.exportSymbol('logseq.sdk.experiments.register_route_renderer', logseq.sdk.experiments.register_route_renderer);
logseq.sdk.experiments.register_daemon_renderer = (function logseq$sdk$experiments$register_daemon_renderer(pid,key,opts){
var temp__5804__auto__ = frontend.handler.plugin.get_plugin_inst(pid);
if(cljs.core.truth_(temp__5804__auto__)){
var _pl = temp__5804__auto__;
return frontend.handler.plugin.register_daemon_renderer(cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(pid),key,cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (p1__131661_SHARP_,p2__131662_SHARP_){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(p1__131661_SHARP_,p2__131662_SHARP_,(opts[cljs.core.name(p2__131662_SHARP_)]));
}),cljs.core.PersistentArrayMap.EMPTY,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"before","before",-1633692388),new cljs.core.Keyword(null,"subs","subs",-186681991),new cljs.core.Keyword(null,"render","render",-1408033454)], null)));
} else {
return null;
}
});
goog.exportSymbol('logseq.sdk.experiments.register_daemon_renderer', logseq.sdk.experiments.register_daemon_renderer);
logseq.sdk.experiments.register_extensions_enhancer = (function logseq$sdk$experiments$register_extensions_enhancer(pid,type,enhancer){
var temp__5804__auto__ = (function (){var and__5000__auto__ = cljs.core.fn_QMARK_(enhancer);
if(and__5000__auto__){
return frontend.handler.plugin.get_plugin_inst(pid);
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5804__auto__)){
var _pl = temp__5804__auto__;
return frontend.handler.plugin.register_extensions_enhancer(cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(pid),type,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"enhancer","enhancer",-929020171),enhancer], null));
} else {
return null;
}
});
goog.exportSymbol('logseq.sdk.experiments.register_extensions_enhancer', logseq.sdk.experiments.register_extensions_enhancer);

//# sourceMappingURL=logseq.sdk.experiments.js.map
