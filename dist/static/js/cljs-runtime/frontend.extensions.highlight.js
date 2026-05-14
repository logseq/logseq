goog.provide('frontend.extensions.highlight');
frontend.extensions.highlight.highlight_BANG_ = (function frontend$extensions$highlight$highlight_BANG_(state){
var vec__113261 = new cljs.core.Keyword("rum","args","rum/args",1315791754).cljs$core$IFn$_invoke$arity$1(state);
var id = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__113261,(0),null);
var attr = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__113261,(1),null);
if(cljs.core.truth_(new cljs.core.Keyword(null,"data-lang","data-lang",969460304).cljs$core$IFn$_invoke$arity$1(attr))){
var temp__5804__auto__ = document.getElementById(id);
if(cljs.core.truth_(temp__5804__auto__)){
var element = temp__5804__auto__;
return hljs.highlightBlock(element);
} else {
return null;
}
} else {
return null;
}
});
frontend.extensions.highlight.highlight = rum.core.lazy_build(rum.core.build_defcs,(function (state,id,attr,code){
return daiquiri.core.create_element("pre",{'className':"code pre-wrap-white-space"},[(function (){var attrs113302 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(attr,new cljs.core.Keyword(null,"id","id",-1388402092),id);
return daiquiri.core.create_element("code",((cljs.core.map_QMARK_(attrs113302))?daiquiri.interpreter.element_attributes(attrs113302):null),((cljs.core.map_QMARK_(attrs113302))?[daiquiri.interpreter.interpret(code)]:[daiquiri.interpreter.interpret(attrs113302),daiquiri.interpreter.interpret(code)]));
})()]);
}),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"did-mount","did-mount",918232960),(function (state){
frontend.extensions.highlight.highlight_BANG_(state);

return state;
})], null)], null),"frontend.extensions.highlight/highlight");
frontend.extensions.highlight.html_export = (function frontend$extensions$highlight$html_export(attr,code){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"pre.pre-wrap-white-space","pre.pre-wrap-white-space",-614870903),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"code","code",1586293142),attr,code], null)], null);
});

//# sourceMappingURL=frontend.extensions.highlight.js.map
