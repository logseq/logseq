goog.provide('rewrite_clj.zip.removez');
/**
 * Return current node location depth in `zloc`, top is 0.
 */
rewrite_clj.zip.removez.node_depth = (function rewrite_clj$zip$removez$node_depth(zloc){
return (cljs.core.count(cljs.core.take_while.cljs$core$IFn$_invoke$arity$2(cljs.core.identity,cljs.core.iterate(rewrite_clj.custom_zipper.core.up,zloc))) - (1));
});
/**
 * Returns true when current node is last node in zipper and trailing whitespace contains
 *   at least 1 newline.
 */
rewrite_clj.zip.removez.has_trailing_linebreak_at_eoi_QMARK_ = (function rewrite_clj$zip$removez$has_trailing_linebreak_at_eoi_QMARK_(zloc){
var and__5000__auto__ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2((1),rewrite_clj.zip.removez.node_depth(zloc));
if(and__5000__auto__){
var and__5000__auto____$1 = cljs.core.not(rewrite_clj.zip.move.right(zloc));
if(and__5000__auto____$1){
return cljs.core.some(rewrite_clj.zip.whitespace.linebreak_QMARK_,cljs.core.take_while.cljs$core$IFn$_invoke$arity$2(cljs.core.identity,cljs.core.iterate(rewrite_clj.custom_zipper.core.right,zloc)));
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
});
rewrite_clj.zip.removez.left_ws_trim = (function rewrite_clj$zip$removez$left_ws_trim(var_args){
var G__66126 = arguments.length;
switch (G__66126) {
case 1:
return rewrite_clj.zip.removez.left_ws_trim.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return rewrite_clj.zip.removez.left_ws_trim.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(rewrite_clj.zip.removez.left_ws_trim.cljs$core$IFn$_invoke$arity$1 = (function (zloc){
return rewrite_clj.zip.removez.left_ws_trim.cljs$core$IFn$_invoke$arity$2(zloc,rewrite_clj.zip.whitespace.whitespace_QMARK_);
}));

(rewrite_clj.zip.removez.left_ws_trim.cljs$core$IFn$_invoke$arity$2 = (function (zloc,p_QMARK_){
if(((rewrite_clj.zip.move.rightmost_QMARK_(zloc)) || (rewrite_clj.zip.move.leftmost_QMARK_(zloc)))){
return rewrite_clj.custom_zipper.utils.remove_left_while(zloc,p_QMARK_);
} else {
return zloc;
}
}));

(rewrite_clj.zip.removez.left_ws_trim.cljs$lang$maxFixedArity = 2);

rewrite_clj.zip.removez.right_ws_trim = (function rewrite_clj$zip$removez$right_ws_trim(var_args){
var G__66130 = arguments.length;
switch (G__66130) {
case 1:
return rewrite_clj.zip.removez.right_ws_trim.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return rewrite_clj.zip.removez.right_ws_trim.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(rewrite_clj.zip.removez.right_ws_trim.cljs$core$IFn$_invoke$arity$1 = (function (zloc){
return rewrite_clj.zip.removez.right_ws_trim.cljs$core$IFn$_invoke$arity$2(zloc,rewrite_clj.zip.whitespace.whitespace_QMARK_);
}));

(rewrite_clj.zip.removez.right_ws_trim.cljs$core$IFn$_invoke$arity$2 = (function (zloc,p_QMARK_){
return rewrite_clj.custom_zipper.utils.remove_right_while(zloc,p_QMARK_);
}));

(rewrite_clj.zip.removez.right_ws_trim.cljs$lang$maxFixedArity = 2);

rewrite_clj.zip.removez.right_ws_trim_keep_trailing_linebreak = (function rewrite_clj$zip$removez$right_ws_trim_keep_trailing_linebreak(zloc){
var right_trimmed = rewrite_clj.zip.removez.right_ws_trim.cljs$core$IFn$_invoke$arity$1(zloc);
if(cljs.core.truth_(rewrite_clj.zip.removez.has_trailing_linebreak_at_eoi_QMARK_(zloc))){
return rewrite_clj.zip.whitespace.insert_newline_right.cljs$core$IFn$_invoke$arity$1(right_trimmed);
} else {
return right_trimmed;
}
});
rewrite_clj.zip.removez.remove_with_trim = (function rewrite_clj$zip$removez$remove_with_trim(zloc,left_ws_trim_fn,right_ws_trim_fn){
return rewrite_clj.zip.whitespace.skip_whitespace.cljs$core$IFn$_invoke$arity$2(rewrite_clj.custom_zipper.core.prev,rewrite_clj.custom_zipper.core.remove((function (){var G__66131 = (left_ws_trim_fn.cljs$core$IFn$_invoke$arity$1 ? left_ws_trim_fn.cljs$core$IFn$_invoke$arity$1(zloc) : left_ws_trim_fn.call(null,zloc));
return (right_ws_trim_fn.cljs$core$IFn$_invoke$arity$1 ? right_ws_trim_fn.cljs$core$IFn$_invoke$arity$1(G__66131) : right_ws_trim_fn.call(null,G__66131));
})()));
});
/**
 * Return `zloc` with current node removed. Returned zipper location
 * is moved to the first non-whitespace node preceding removed node in a depth-first walk.
 * Removes whitespace appropriately.
 * 
 *   - `[1 |2  3]    => [|1 3]`
 *   - `[1 |2]       => [|1]`
 *   - `[|1 2]       => |[2]`
 *   - `[|1]         => |[]`
 *   - `[  |1  ]     => |[]`
 *   - `[1 [2 3] |4] => [1 [2 |3]]`
 *   - `[|1 [2 3] 4] => |[[2 3] 4]`
 * 
 * If the removed node is a rightmost sibling, both leading and trailing whitespace
 * is removed, otherwise only trailing whitespace is removed.
 * 
 * The result is that a following element (no matter whether it is on the same line
 * or not) will end up at same positon (line/column) as the removed one.
 * If a comment lies betwen the original node and the neighbour this will not hold true.
 * 
 * If the removed node is at end of input and is trailed by 1 or more newlines,
 * a single trailing newline will be preserved.
 * 
 * Use [[remove*]] to remove node without removing any surrounding whitespace.
 */
rewrite_clj.zip.removez.remove = (function rewrite_clj$zip$removez$remove(zloc){
if(cljs.core.truth_(zloc)){
} else {
throw (new Error("Assert failed: zloc"));
}

var _PERCENT_ = rewrite_clj.zip.removez.remove_with_trim(zloc,rewrite_clj.zip.removez.left_ws_trim,rewrite_clj.zip.removez.right_ws_trim_keep_trailing_linebreak);
if(cljs.core.truth_(_PERCENT_)){
} else {
throw (new Error("Assert failed: %"));
}

return _PERCENT_;
});
/**
 * Same as [[remove]] but preserves newlines.
 * Specifically: will trim all whitespace - or whitespace up to first linebreak if present.
 */
rewrite_clj.zip.removez.remove_preserve_newline = (function rewrite_clj$zip$removez$remove_preserve_newline(zloc){
if(cljs.core.truth_(zloc)){
} else {
throw (new Error("Assert failed: zloc"));
}

var _PERCENT_ = (function (){var ws_pred_fn = (function (p1__66132_SHARP_){
var and__5000__auto__ = rewrite_clj.zip.whitespace.whitespace_QMARK_(p1__66132_SHARP_);
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.not(rewrite_clj.zip.whitespace.linebreak_QMARK_(p1__66132_SHARP_));
} else {
return and__5000__auto__;
}
});
return rewrite_clj.zip.removez.remove_with_trim(zloc,(function (p1__66133_SHARP_){
return rewrite_clj.zip.removez.left_ws_trim.cljs$core$IFn$_invoke$arity$2(p1__66133_SHARP_,ws_pred_fn);
}),(function (p1__66134_SHARP_){
return rewrite_clj.zip.removez.right_ws_trim.cljs$core$IFn$_invoke$arity$2(p1__66134_SHARP_,ws_pred_fn);
}));
})();
if(cljs.core.truth_(_PERCENT_)){
} else {
throw (new Error("Assert failed: %"));
}

return _PERCENT_;
});

//# sourceMappingURL=rewrite_clj.zip.removez.js.map
