goog.provide('frontend.modules.outliner.tree');
/**
 * `blocks` need to be in the same page.
 */
frontend.modules.outliner.tree.blocks__GT_vec_tree = (function frontend$modules$outliner$tree$blocks__GT_vec_tree(var_args){
var G__63459 = arguments.length;
switch (G__63459) {
case 2:
return frontend.modules.outliner.tree.blocks__GT_vec_tree.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
var args_arr__5751__auto__ = [];
var len__5726__auto___63522 = arguments.length;
var i__5727__auto___63523 = (0);
while(true){
if((i__5727__auto___63523 < len__5726__auto___63522)){
args_arr__5751__auto__.push((arguments[i__5727__auto___63523]));

var G__63524 = (i__5727__auto___63523 + (1));
i__5727__auto___63523 = G__63524;
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

(frontend.modules.outliner.tree.blocks__GT_vec_tree.cljs$core$IFn$_invoke$arity$variadic = (function (repo,blocks,root_id,p__63460){
var map__63461 = p__63460;
var map__63461__$1 = cljs.core.__destructure_map(map__63461);
var option = map__63461__$1;
var db = (frontend.db.get_db.cljs$core$IFn$_invoke$arity$1 ? frontend.db.get_db.cljs$core$IFn$_invoke$arity$1(repo) : frontend.db.get_db.call(null,repo));
return logseq.outliner.tree.blocks__GT_vec_tree.cljs$core$IFn$_invoke$arity$variadic(repo,db,blocks,root_id,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([option], 0));
}));

/** @this {Function} */
(frontend.modules.outliner.tree.blocks__GT_vec_tree.cljs$lang$applyTo = (function (seq63455){
var G__63456 = cljs.core.first(seq63455);
var seq63455__$1 = cljs.core.next(seq63455);
var G__63457 = cljs.core.first(seq63455__$1);
var seq63455__$2 = cljs.core.next(seq63455__$1);
var G__63458 = cljs.core.first(seq63455__$2);
var seq63455__$3 = cljs.core.next(seq63455__$2);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__63456,G__63457,G__63458,seq63455__$3);
}));

(frontend.modules.outliner.tree.blocks__GT_vec_tree.cljs$lang$maxFixedArity = (3));

frontend.modules.outliner.tree.filter_top_level_blocks = logseq.outliner.tree.filter_top_level_blocks;
frontend.modules.outliner.tree.non_consecutive_blocks__GT_vec_tree = logseq.outliner.tree.non_consecutive_blocks__GT_vec_tree;
frontend.modules.outliner.tree.get_sorted_block_and_children = (function frontend$modules$outliner$tree$get_sorted_block_and_children(var_args){
var args__5732__auto__ = [];
var len__5726__auto___63525 = arguments.length;
var i__5727__auto___63526 = (0);
while(true){
if((i__5727__auto___63526 < len__5726__auto___63525)){
args__5732__auto__.push((arguments[i__5727__auto___63526]));

var G__63527 = (i__5727__auto___63526 + (1));
i__5727__auto___63526 = G__63527;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((2) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((2)),(0),null)):null);
return frontend.modules.outliner.tree.get_sorted_block_and_children.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),(arguments[(1)]),argseq__5733__auto__);
});

(frontend.modules.outliner.tree.get_sorted_block_and_children.cljs$core$IFn$_invoke$arity$variadic = (function (repo,db_id,p__63500){
var map__63501 = p__63500;
var map__63501__$1 = cljs.core.__destructure_map(map__63501);
var opts = map__63501__$1;
var db = (frontend.db.get_db.cljs$core$IFn$_invoke$arity$1 ? frontend.db.get_db.cljs$core$IFn$_invoke$arity$1(repo) : frontend.db.get_db.call(null,repo));
return logseq.outliner.tree.get_sorted_block_and_children.cljs$core$IFn$_invoke$arity$variadic(db,db_id,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([opts], 0));
}));

(frontend.modules.outliner.tree.get_sorted_block_and_children.cljs$lang$maxFixedArity = (2));

/** @this {Function} */
(frontend.modules.outliner.tree.get_sorted_block_and_children.cljs$lang$applyTo = (function (seq63474){
var G__63475 = cljs.core.first(seq63474);
var seq63474__$1 = cljs.core.next(seq63474);
var G__63476 = cljs.core.first(seq63474__$1);
var seq63474__$2 = cljs.core.next(seq63474__$1);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__63475,G__63476,seq63474__$2);
}));


//# sourceMappingURL=frontend.modules.outliner.tree.js.map
