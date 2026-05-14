goog.provide('rewrite_clj.zip.move');
/**
 * Return zipper with location moved right to next non-whitespace/non-comment sibling of current node in `zloc`.
 */
rewrite_clj.zip.move.right = (function rewrite_clj$zip$move$right(zloc){
var G__66133 = zloc;
var G__66133__$1 = (((G__66133 == null))?null:rewrite_clj.custom_zipper.core.right(G__66133));
if((G__66133__$1 == null)){
return null;
} else {
return rewrite_clj.zip.whitespace.skip_whitespace.cljs$core$IFn$_invoke$arity$1(G__66133__$1);
}
});
/**
 * Return zipper with location moved left to next non-whitespace/non-comment sibling of current node in `zloc`.
 */
rewrite_clj.zip.move.left = (function rewrite_clj$zip$move$left(zloc){
var G__66134 = zloc;
var G__66134__$1 = (((G__66134 == null))?null:rewrite_clj.custom_zipper.core.left(G__66134));
if((G__66134__$1 == null)){
return null;
} else {
return rewrite_clj.zip.whitespace.skip_whitespace_left(G__66134__$1);
}
});
/**
 * Return zipper with location moved down to the first non-whitespace/non-comment child node of the current node in `zloc`, or nil if no applicable children.
 */
rewrite_clj.zip.move.down = (function rewrite_clj$zip$move$down(zloc){
var G__66135 = zloc;
var G__66135__$1 = (((G__66135 == null))?null:rewrite_clj.custom_zipper.core.down(G__66135));
if((G__66135__$1 == null)){
return null;
} else {
return rewrite_clj.zip.whitespace.skip_whitespace.cljs$core$IFn$_invoke$arity$1(G__66135__$1);
}
});
/**
 * Return zipper with location moved up to next non-whitespace/non-comment parent of current node in `zloc`, or `nil` if at the top.
 */
rewrite_clj.zip.move.up = (function rewrite_clj$zip$move$up(zloc){
var G__66138 = zloc;
var G__66138__$1 = (((G__66138 == null))?null:rewrite_clj.custom_zipper.core.up(G__66138));
if((G__66138__$1 == null)){
return null;
} else {
return rewrite_clj.zip.whitespace.skip_whitespace_left(G__66138__$1);
}
});
/**
 * Return zipper with location moved to the next depth-first non-whitespace/non-comment node in `zloc`.
 * End can be detected with [[end?]], if already at end, stays there.
 */
rewrite_clj.zip.move.next = (function rewrite_clj$zip$move$next(zloc){
if(cljs.core.truth_(zloc)){
var or__5002__auto__ = (function (){var G__66139 = zloc;
var G__66139__$1 = (((G__66139 == null))?null:rewrite_clj.custom_zipper.core.next(G__66139));
if((G__66139__$1 == null)){
return null;
} else {
return rewrite_clj.zip.whitespace.skip_whitespace.cljs$core$IFn$_invoke$arity$2(rewrite_clj.custom_zipper.core.next,G__66139__$1);
}
})();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.vary_meta.cljs$core$IFn$_invoke$arity$4(zloc,cljs.core.assoc,new cljs.core.Keyword("rewrite-clj.zip.move","end?","rewrite-clj.zip.move/end?",891526475),true);
}
} else {
return null;
}
});
/**
 * Return true if `zloc` is at end of depth-first traversal.
 */
rewrite_clj.zip.move.end_QMARK_ = (function rewrite_clj$zip$move$end_QMARK_(zloc){
var or__5002__auto__ = cljs.core.not(zloc);
if(or__5002__auto__){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = rewrite_clj.custom_zipper.core.end_QMARK_(zloc);
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
return new cljs.core.Keyword("rewrite-clj.zip.move","end?","rewrite-clj.zip.move/end?",891526475).cljs$core$IFn$_invoke$arity$1(cljs.core.meta(zloc));
}
}
});
/**
 * Return true if at rightmost non-whitespace/non-comment sibling node in `zloc`.
 */
rewrite_clj.zip.move.rightmost_QMARK_ = (function rewrite_clj$zip$move$rightmost_QMARK_(zloc){
return (rewrite_clj.zip.whitespace.skip_whitespace.cljs$core$IFn$_invoke$arity$1(rewrite_clj.custom_zipper.core.right(zloc)) == null);
});
/**
 * Return true if at leftmost non-whitespace/non-comment sibling node in `zloc`.
 */
rewrite_clj.zip.move.leftmost_QMARK_ = (function rewrite_clj$zip$move$leftmost_QMARK_(zloc){
return (rewrite_clj.zip.whitespace.skip_whitespace_left(rewrite_clj.custom_zipper.core.left(zloc)) == null);
});
/**
 * Return zipper with location moved to the previous depth-first non-whitespace/non-comment node in `zloc`. If already at root, returns nil.
 */
rewrite_clj.zip.move.prev = (function rewrite_clj$zip$move$prev(zloc){
var G__66143 = zloc;
var G__66143__$1 = (((G__66143 == null))?null:rewrite_clj.custom_zipper.core.prev(G__66143));
if((G__66143__$1 == null)){
return null;
} else {
return rewrite_clj.zip.whitespace.skip_whitespace.cljs$core$IFn$_invoke$arity$2(rewrite_clj.custom_zipper.core.prev,G__66143__$1);
}
});
/**
 * Return zipper with location moved to the leftmost non-whitespace/non-comment sibling of current node in `zloc`.
 */
rewrite_clj.zip.move.leftmost = (function rewrite_clj$zip$move$leftmost(zloc){
var G__66146 = zloc;
var G__66146__$1 = (((G__66146 == null))?null:rewrite_clj.custom_zipper.core.leftmost(G__66146));
if((G__66146__$1 == null)){
return null;
} else {
return rewrite_clj.zip.whitespace.skip_whitespace.cljs$core$IFn$_invoke$arity$1(G__66146__$1);
}
});
/**
 * Return zipper with location moved to the rightmost non-whitespace/non-comment sibling of current node in `zloc`.
 */
rewrite_clj.zip.move.rightmost = (function rewrite_clj$zip$move$rightmost(zloc){
var G__66148 = zloc;
var G__66148__$1 = (((G__66148 == null))?null:rewrite_clj.custom_zipper.core.rightmost(G__66148));
if((G__66148__$1 == null)){
return null;
} else {
return rewrite_clj.zip.whitespace.skip_whitespace_left(G__66148__$1);
}
});

//# sourceMappingURL=rewrite_clj.zip.move.js.map
