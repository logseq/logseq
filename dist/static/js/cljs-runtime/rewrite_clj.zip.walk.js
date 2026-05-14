goog.provide('rewrite_clj.zip.walk');
rewrite_clj.zip.walk.downmost = (function rewrite_clj$zip$walk$downmost(zloc){
return cljs.core.last(cljs.core.take_while.cljs$core$IFn$_invoke$arity$2(cljs.core.identity,cljs.core.iterate(rewrite_clj.zip.move.down,zloc)));
});
rewrite_clj.zip.walk.process_loc = (function rewrite_clj$zip$walk$process_loc(zloc,p_QMARK_,f){
if(cljs.core.truth_((p_QMARK_.cljs$core$IFn$_invoke$arity$1 ? p_QMARK_.cljs$core$IFn$_invoke$arity$1(zloc) : p_QMARK_.call(null,zloc)))){
var or__5002__auto__ = (f.cljs$core$IFn$_invoke$arity$1 ? f.cljs$core$IFn$_invoke$arity$1(zloc) : f.call(null,zloc));
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return zloc;
}
} else {
return zloc;
}
});
rewrite_clj.zip.walk.prewalk_subtree = (function rewrite_clj$zip$walk$prewalk_subtree(p_QMARK_,f,zloc){
var loc = zloc;
while(true){
if(cljs.core.truth_(rewrite_clj.zip.move.end_QMARK_(loc))){
return loc;
} else {
var G__67629 = rewrite_clj.zip.move.next(rewrite_clj.zip.walk.process_loc(loc,p_QMARK_,f));
loc = G__67629;
continue;
}
break;
}
});
/**
 * Return zipper modified by an isolated depth-first pre-order traversal.
 * 
 * Pre-order traversal visits root before children.
 * For example, traversal order of `(1 (2 3 (4 5) 6 (7 8)) 9)` is:
 * 
 * 1. `(1 (2 3 (4 5) 6 (7 8)) 9)`
 * 2. `1`
 * 3. `(2 3 (4 5) 6 (7 8))`
 * 4. `2`
 * 5. `3`
 * 6. `(4 5)`
 * 7. `4`
 * 8. `5`
 * 9. `6`
 * 10. `(7 8)`
 * 11. `7`
 * 12. `8`
 * 13. `9`
 * 
 * Traversal starts at the current node in `zloc` and continues to the end of the isolated sub-tree.
 * 
 * Function `f` is called on the zipper locations satisfying predicate `p?` and must return either
 * - nil to indicate no changes
 * - or a valid zipper
 * WARNING: when function `f` changes the location in the zipper, normal traversal will be affected.
 * 
 * When `p?` is not specified `f` is called on all locations.
 * 
 * To walk all nodes, you'll want to walk from the root node.
 * You can do this by, for example, using [[of-string*]] instead of [[of-string]].
 * 
 * ```Clojure
 * (-> (zip/of-string* "my clojure forms")
 *     (zip/prewalk ...))
 * ```
 * 
 * See [docs on sub editing](/doc/01-user-guide.adoc#sub-editing).
 */
rewrite_clj.zip.walk.prewalk = (function rewrite_clj$zip$walk$prewalk(var_args){
var G__67615 = arguments.length;
switch (G__67615) {
case 2:
return rewrite_clj.zip.walk.prewalk.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return rewrite_clj.zip.walk.prewalk.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(rewrite_clj.zip.walk.prewalk.cljs$core$IFn$_invoke$arity$2 = (function (zloc,f){
return rewrite_clj.zip.walk.prewalk.cljs$core$IFn$_invoke$arity$3(zloc,cljs.core.constantly(true),f);
}));

(rewrite_clj.zip.walk.prewalk.cljs$core$IFn$_invoke$arity$3 = (function (zloc,p_QMARK_,f){
return rewrite_clj.zip.subedit.subedit_node(zloc,cljs.core.partial.cljs$core$IFn$_invoke$arity$3(rewrite_clj.zip.walk.prewalk_subtree,p_QMARK_,f));
}));

(rewrite_clj.zip.walk.prewalk.cljs$lang$maxFixedArity = 3);

rewrite_clj.zip.walk.postwalk_subtree = (function rewrite_clj$zip$walk$postwalk_subtree(p_QMARK_,f,zloc){
var loc = rewrite_clj.zip.walk.downmost(zloc);
while(true){
var loc__$1 = rewrite_clj.zip.walk.process_loc(loc,p_QMARK_,f);
if(cljs.core.truth_(rewrite_clj.zip.move.right(loc__$1))){
var G__67632 = rewrite_clj.zip.walk.downmost(rewrite_clj.zip.move.right(loc__$1));
loc = G__67632;
continue;
} else {
if(cljs.core.truth_(rewrite_clj.zip.move.up(loc__$1))){
var G__67633 = rewrite_clj.zip.move.up(loc__$1);
loc = G__67633;
continue;
} else {
return loc__$1;

}
}
break;
}
});
/**
 * Return zipper modified by an isolated depth-first post-order traversal.
 * 
 * Post-order traversal visits children before root.
 * For example, traversal order of `(1 (2 3 (4 5) 6 (7 8)) 9)` is:
 * 
 * 1. `1`
 * 2. `2`
 * 3. `3`
 * 4. `4`
 * 5. `5`
 * 6. `(4 5)`
 * 7. `6`
 * 8. `7`
 * 9. `8`
 * 10. `(7 8)`
 * 11. `(2 3 (4 5) 6 (7 8))`
 * 12. `9`
 * 13. `(1 (2 3 (4 5) 6 (7 8)) 9)`
 * 
 * Traversal starts at the current node in `zloc` and continues to the end of the isolated sub-tree.
 * 
 * Function `f` is called on the zipper locations satisfying predicate `p?` and must return either
 * - nil to indicate no changes
 * - or a valid zipper
 * WARNING: when function `f` changes the location in the zipper, normal traversal will be affected.
 * 
 * When `p?` is not specified `f` is called on all locations.
 * 
 * To walk all nodes, you'll want to walk from the root node.
 * You can do this by, for example, using [[of-string*]] instead of [[of-string]].
 * 
 * ```Clojure
 * (-> (zip/of-string* "my clojure forms")
 *     (zip/postwalk ...))
 * ```
 * 
 * See [docs on sub editing](/doc/01-user-guide.adoc#sub-editing).
 */
rewrite_clj.zip.walk.postwalk = (function rewrite_clj$zip$walk$postwalk(var_args){
var G__67622 = arguments.length;
switch (G__67622) {
case 2:
return rewrite_clj.zip.walk.postwalk.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return rewrite_clj.zip.walk.postwalk.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(rewrite_clj.zip.walk.postwalk.cljs$core$IFn$_invoke$arity$2 = (function (zloc,f){
return rewrite_clj.zip.walk.postwalk.cljs$core$IFn$_invoke$arity$3(zloc,cljs.core.constantly(true),f);
}));

(rewrite_clj.zip.walk.postwalk.cljs$core$IFn$_invoke$arity$3 = (function (zloc,p_QMARK_,f){
return rewrite_clj.zip.subedit.subedit_node(zloc,(function (p1__67620_SHARP_){
return rewrite_clj.zip.walk.postwalk_subtree(p_QMARK_,f,p1__67620_SHARP_);
}));
}));

(rewrite_clj.zip.walk.postwalk.cljs$lang$maxFixedArity = 3);


//# sourceMappingURL=rewrite_clj.zip.walk.js.map
