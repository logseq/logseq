goog.provide('instaparse.viz');
/**
 * Takes a subtree of the parse tree and returns a [start-index end-index] pair
 * indicating the span of text parsed by this subtree.
 * start-index is inclusive and end-index is exclusive, as is customary
 * with substrings.
 * Returns nil if no span metadata is attached.
 */
instaparse.viz.span = (function instaparse$viz$span(tree){
var m = cljs.core.meta(tree);
var s = new cljs.core.Keyword("instaparse.gll","start-index","instaparse.gll/start-index",404653620).cljs$core$IFn$_invoke$arity$1(m);
var e = new cljs.core.Keyword("instaparse.gll","end-index","instaparse.gll/end-index",-1851404441).cljs$core$IFn$_invoke$arity$1(m);
if(cljs.core.truth_((function (){var and__5000__auto__ = s;
if(cljs.core.truth_(and__5000__auto__)){
return e;
} else {
return and__5000__auto__;
}
})())){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [s,e], null);
} else {
return null;
}
});

//# sourceMappingURL=instaparse.viz.js.map
