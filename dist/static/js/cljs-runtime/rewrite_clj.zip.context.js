goog.provide('rewrite_clj.zip.context');
rewrite_clj.zip.context.is_map_key_QMARK_ = (function rewrite_clj$zip$context$is_map_key_QMARK_(zloc){
return cljs.core.odd_QMARK_(cljs.core.count(cljs.core.take_while.cljs$core$IFn$_invoke$arity$2(cljs.core.identity,cljs.core.iterate(rewrite_clj.custom_zipper.core.left,zloc))));
});
/**
 * Returns `zloc` with namespaced map sexpr context to all symbols and keywords reapplied from current location downward.
 * 
 *   Keywords and symbols:
 *   * that are keys in a namespaced map will have namespaced map context applied
 *   * otherwise will have any namespaced map context removed
 * 
 *   You should only need to use this function if:
 *   * you care about `sexpr` on keywords and symbols
 *   * and you are moving keywords and symbols from a namespaced map to some other location.
 */
rewrite_clj.zip.context.reapply_context = (function rewrite_clj$zip$context$reapply_context(zloc){
return rewrite_clj.zip.walk.postwalk.cljs$core$IFn$_invoke$arity$3(zloc,(function (p1__67705_SHARP_){
var G__67706 = rewrite_clj.custom_zipper.core.node(p1__67705_SHARP_);
if((!((G__67706 == null)))){
if(((false) || ((cljs.core.PROTOCOL_SENTINEL === G__67706.rewrite_clj$node$protocols$MapQualifiable$)))){
return true;
} else {
if((!G__67706.cljs$lang$protocol_mask$partition$)){
return cljs.core.native_satisfies_QMARK_(rewrite_clj.node.protocols.MapQualifiable,G__67706);
} else {
return false;
}
}
} else {
return cljs.core.native_satisfies_QMARK_(rewrite_clj.node.protocols.MapQualifiable,G__67706);
}
}),(function (zloc__$1){
var parent = rewrite_clj.custom_zipper.core.up(rewrite_clj.custom_zipper.core.up(zloc__$1));
var nsmap = (cljs.core.truth_((function (){var and__5000__auto__ = parent;
if(cljs.core.truth_(and__5000__auto__)){
return rewrite_clj.zip.seqz.namespaced_map_QMARK_(parent);
} else {
return and__5000__auto__;
}
})())?parent:null);
if(cljs.core.truth_((function (){var and__5000__auto__ = nsmap;
if(cljs.core.truth_(and__5000__auto__)){
return rewrite_clj.zip.context.is_map_key_QMARK_(zloc__$1);
} else {
return and__5000__auto__;
}
})())){
return rewrite_clj.custom_zipper.core.replace(zloc__$1,rewrite_clj.node.protocols.map_context_apply(rewrite_clj.custom_zipper.core.node(zloc__$1),cljs.core.first(rewrite_clj.node.protocols.children(rewrite_clj.custom_zipper.core.node(nsmap)))));
} else {
return rewrite_clj.custom_zipper.core.replace(zloc__$1,rewrite_clj.node.protocols.map_context_clear(rewrite_clj.custom_zipper.core.node(zloc__$1)));
}
}));
});

//# sourceMappingURL=rewrite_clj.zip.context.js.map
