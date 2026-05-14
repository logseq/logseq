goog.provide('frontend.components.db_based.page');
frontend.components.db_based.page.configure_property = rum.core.lazy_build(rum.core.build_defc,(function (page){
var page__$1 = (function (){var G__124221 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(page);
return (frontend.db.sub_block.cljs$core$IFn$_invoke$arity$1 ? frontend.db.sub_block.cljs$core$IFn$_invoke$arity$1(G__124221) : frontend.db.sub_block.call(null,G__124221));
})();
return daiquiri.interpreter.interpret((function (){var G__124230 = new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"value","value",305978217),"configure",new cljs.core.Keyword(null,"class","class",-2030961996),"py-1 text-xs",new cljs.core.Keyword(null,"on-pointer-down","on-pointer-down",573334138),(function (e){
return frontend.util.stop(e);
}),new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (e){
var G__124233 = e.target;
var G__124234 = (function (){
return frontend.components.property.config.property_dropdown(page__$1,null,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"debug?","debug?",-1831756173),e.altKey], null));
});
var G__124235 = new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"content-props","content-props",687449284),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"ls-property-dropdown as-root"], null),new cljs.core.Keyword(null,"align","align",1964212802),"start",new cljs.core.Keyword(null,"as-dropdown?","as-dropdown?",-37553558),true], null);
return (logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3(G__124233,G__124234,G__124235) : logseq.shui.ui.popup_show_BANG_.call(null,G__124233,G__124234,G__124235));
})], null);
var G__124231 = "Configure property";
return (logseq.shui.ui.tabs_trigger.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.tabs_trigger.cljs$core$IFn$_invoke$arity$2(G__124230,G__124231) : logseq.shui.ui.tabs_trigger.call(null,G__124230,G__124231));
})());
}),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive,frontend.db_mixins.query], null),"frontend.components.db-based.page/configure-property");

//# sourceMappingURL=frontend.components.db_based.page.js.map
