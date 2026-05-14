goog.provide('logseq.sdk.assets');
logseq.sdk.assets.make_url = frontend.handler.assets._LT_make_asset_url;
goog.exportSymbol('logseq.sdk.assets.make_url', logseq.sdk.assets.make_url);
logseq.sdk.assets.list_files_of_current_graph = (function logseq$sdk$assets$list_files_of_current_graph(exts){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(electron.ipc.ipc.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"getAssetsFiles","getAssetsFiles",87392727),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"exts","exts",-946342126),exts], null)], 0))),(function (files){
return promesa.protocols._promise(cljs_bean.core.__GT_js(files));
}));
}));
});
goog.exportSymbol('logseq.sdk.assets.list_files_of_current_graph', logseq.sdk.assets.list_files_of_current_graph);
logseq.sdk.assets.built_in_open = (function logseq$sdk$assets$built_in_open(asset_file){
var temp__5804__auto__ = frontend.util.trim_safe(frontend.util.get_file_ext(asset_file));
if(cljs.core.truth_(temp__5804__auto__)){
var ext = temp__5804__auto__;
if(cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 1, ["pdf",null], null), null),ext)){
return frontend.state.set_current_pdf_BANG_(frontend.extensions.pdf.assets.inflate_asset(asset_file));
} else {
return false;

}
} else {
return null;
}
});
goog.exportSymbol('logseq.sdk.assets.built_in_open', logseq.sdk.assets.built_in_open);

//# sourceMappingURL=logseq.sdk.assets.js.map
