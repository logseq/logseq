goog.provide('logseq.sdk.debug');
logseq.sdk.debug.log_app_state = (function logseq$sdk$debug$log_app_state(path){
return cljs_bean.core.__GT_js(((typeof path === 'string')?cljs.core.get.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(frontend.state.state),cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(path)):cljs.core.deref(frontend.state.state)));
});
goog.exportSymbol('logseq.sdk.debug.log_app_state', logseq.sdk.debug.log_app_state);

//# sourceMappingURL=logseq.sdk.debug.js.map
