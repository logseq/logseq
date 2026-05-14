goog.provide('frontend.ref');
frontend.ref.__GT_block_ref = (function frontend$ref$__GT_block_ref(id){
if(cljs.core.truth_(frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$0())){
return logseq.common.util.page_ref.__GT_page_ref(id);
} else {
return logseq.common.util.block_ref.__GT_block_ref(id);
}
});
frontend.ref.__GT_page_ref = logseq.common.util.page_ref.__GT_page_ref;

//# sourceMappingURL=frontend.ref.js.map
