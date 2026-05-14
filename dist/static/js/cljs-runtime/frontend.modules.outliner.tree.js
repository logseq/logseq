goog.provide('frontend.modules.outliner.tree');
/**
 * `blocks` need to be in the same page.
 */
frontend.modules.outliner.tree.blocks__GT_vec_tree = (function frontend$modules$outliner$tree$blocks__GT_vec_tree(var_args){
var G__102712 = arguments.length;
switch (G__102712) {
case 2:
return frontend.modules.outliner.tree.blocks__GT_vec_tree.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
var args_arr__5751__auto__ = [];
var len__5726__auto___102721 = arguments.length;
var i__5727__auto___102722 = (0);
while(true){
if((i__5727__auto___102722 < len__5726__auto___102721)){
args_arr__5751__auto__.push((arguments[i__5727__auto___102722]));

var G__102723 = (i__5727__auto___102722 + (1));
i__5727__auto___102722 = G__102723;
continue;
} else {
}
break;
}

var argseq__5752__auto__ = ((((3) < args_arr__5751__auto__.length))?(new cljs.core.IndexedSeq(args_arr__5751__auto__.slice((3)),(0),null)):null);
return frontend.modules.outliner.tree.blocks__GT_vec_tree.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),(arguments[(1)]),(arguments[(2)]),argseq__5752__auto__);

}
});

(frontend.modules.outliner.tree.blocks__GT_vec_tree.cljs$core$IFn$_invoke$arity$2 = (function (blocks,root_id){
return frontend.modules.outliner.tree.blocks__GT_vec_tree(frontend.state.get_current_repo(),blocks,root_id);
}));

(frontend.modules.outliner.tree.blocks__GT_vec_tree.cljs$core$IFn$_invoke$arity$variadic = (function (repo,blocks,root_id,p__102713){
var map__102714 = p__102713;
var map__102714__$1 = cljs.core.__destructure_map(map__102714);
var option = map__102714__$1;
var db = (frontend.db.get_db.cljs$core$IFn$_invoke$arity$1 ? frontend.db.get_db.cljs$core$IFn$_invoke$arity$1(repo) : frontend.db.get_db.call(null,repo));
return logseq.outliner.tree.blocks__GT_vec_tree.cljs$core$IFn$_invoke$arity$variadic(repo,db,blocks,root_id,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([option], 0));
}));

/** @this {Function} */
(frontend.modules.outliner.tree.blocks__GT_vec_tree.cljs$lang$applyTo = (function (seq102708){
var G__102709 = cljs.core.first(seq102708);
var seq102708__$1 = cljs.core.next(seq102708);
var G__102710 = cljs.core.first(seq102708__$1);
var seq102708__$2 = cljs.core.next(seq102708__$1);
var G__102711 = cljs.core.first(seq102708__$2);
var seq102708__$3 = cljs.core.next(seq102708__$2);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__102709,G__102710,G__102711,seq102708__$3);
}));

(frontend.modules.outliner.tree.blocks__GT_vec_tree.cljs$lang$maxFixedArity = (3));

frontend.modules.outliner.tree.filter_top_level_blocks = logseq.outliner.tree.filter_top_level_blocks;
frontend.modules.outliner.tree.non_consecutive_blocks__GT_vec_tree = logseq.outliner.tree.non_consecutive_blocks__GT_vec_tree;
frontend.modules.outliner.tree.get_sorted_block_and_children = (function frontend$modules$outliner$tree$get_sorted_block_and_children(var_args){
var args__5732__auto__ = [];
var len__5726__auto___102724 = arguments.length;
var i__5727__auto___102725 = (0);
while(true){
if((i__5727__auto___102725 < len__5726__auto___102724)){
args__5732__auto__.push((arguments[i__5727__auto___102725]));

var G__102726 = (i__5727__auto___102725 + (1));
i__5727__auto___102725 = G__102726;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((2) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((2)),(0),null)):null);
return frontend.modules.outliner.tree.get_sorted_block_and_children.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),(arguments[(1)]),argseq__5733__auto__);
});

(frontend.modules.outliner.tree.get_sorted_block_and_children.cljs$core$IFn$_invoke$arity$variadic = (function (repo,db_id,p__102718){
var map__102719 = p__102718;
var map__102719__$1 = cljs.core.__destructure_map(map__102719);
var opts = map__102719__$1;
var db = (frontend.db.get_db.cljs$core$IFn$_invoke$arity$1 ? frontend.db.get_db.cljs$core$IFn$_invoke$arity$1(repo) : frontend.db.get_db.call(null,repo));
return logseq.outliner.tree.get_sorted_block_and_children.cljs$core$IFn$_invoke$arity$variadic(db,db_id,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([opts], 0));
}));

(frontend.modules.outliner.tree.get_sorted_block_and_children.cljs$lang$maxFixedArity = (2));

/** @this {Function} */
(frontend.modules.outliner.tree.get_sorted_block_and_children.cljs$lang$applyTo = (function (seq102715){
var G__102716 = cljs.core.first(seq102715);
var seq102715__$1 = cljs.core.next(seq102715);
var G__102717 = cljs.core.first(seq102715__$1);
var seq102715__$2 = cljs.core.next(seq102715__$1);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__102716,G__102717,seq102715__$2);
}));


//# sourceMappingURL=frontend.modules.outliner.tree.js.map
