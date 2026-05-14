goog.provide('logseq.outliner.tree');

/**
 * @interface
 */
logseq.outliner.tree.INode = function(){};

var logseq$outliner$tree$INode$_save$dyn_63500 = (function (this$,_STAR_txs_state,conn,repo,date_formatter,opts){
var x__5350__auto__ = (((this$ == null))?null:this$);
var m__5351__auto__ = (logseq.outliner.tree._save[goog.typeOf(x__5350__auto__)]);
if((!((m__5351__auto__ == null)))){
return (m__5351__auto__.cljs$core$IFn$_invoke$arity$6 ? m__5351__auto__.cljs$core$IFn$_invoke$arity$6(this$,_STAR_txs_state,conn,repo,date_formatter,opts) : m__5351__auto__.call(null,this$,_STAR_txs_state,conn,repo,date_formatter,opts));
} else {
var m__5349__auto__ = (logseq.outliner.tree._save["_"]);
if((!((m__5349__auto__ == null)))){
return (m__5349__auto__.cljs$core$IFn$_invoke$arity$6 ? m__5349__auto__.cljs$core$IFn$_invoke$arity$6(this$,_STAR_txs_state,conn,repo,date_formatter,opts) : m__5349__auto__.call(null,this$,_STAR_txs_state,conn,repo,date_formatter,opts));
} else {
throw cljs.core.missing_protocol("INode.-save",this$);
}
}
});
logseq.outliner.tree._save = (function logseq$outliner$tree$_save(this$,_STAR_txs_state,conn,repo,date_formatter,opts){
if((((!((this$ == null)))) && ((!((this$.logseq$outliner$tree$INode$_save$arity$6 == null)))))){
return this$.logseq$outliner$tree$INode$_save$arity$6(this$,_STAR_txs_state,conn,repo,date_formatter,opts);
} else {
return logseq$outliner$tree$INode$_save$dyn_63500(this$,_STAR_txs_state,conn,repo,date_formatter,opts);
}
});

var logseq$outliner$tree$INode$_del$dyn_63503 = (function (this$,_STAR_txs_state,db){
var x__5350__auto__ = (((this$ == null))?null:this$);
var m__5351__auto__ = (logseq.outliner.tree._del[goog.typeOf(x__5350__auto__)]);
if((!((m__5351__auto__ == null)))){
return (m__5351__auto__.cljs$core$IFn$_invoke$arity$3 ? m__5351__auto__.cljs$core$IFn$_invoke$arity$3(this$,_STAR_txs_state,db) : m__5351__auto__.call(null,this$,_STAR_txs_state,db));
} else {
var m__5349__auto__ = (logseq.outliner.tree._del["_"]);
if((!((m__5349__auto__ == null)))){
return (m__5349__auto__.cljs$core$IFn$_invoke$arity$3 ? m__5349__auto__.cljs$core$IFn$_invoke$arity$3(this$,_STAR_txs_state,db) : m__5349__auto__.call(null,this$,_STAR_txs_state,db));
} else {
throw cljs.core.missing_protocol("INode.-del",this$);
}
}
});
logseq.outliner.tree._del = (function logseq$outliner$tree$_del(this$,_STAR_txs_state,db){
if((((!((this$ == null)))) && ((!((this$.logseq$outliner$tree$INode$_del$arity$3 == null)))))){
return this$.logseq$outliner$tree$INode$_del$arity$3(this$,_STAR_txs_state,db);
} else {
return logseq$outliner$tree$INode$_del$dyn_63503(this$,_STAR_txs_state,db);
}
});

logseq.outliner.tree.blocks__GT_vec_tree_aux = (function logseq$outliner$tree$blocks__GT_vec_tree_aux(repo,db,blocks,root){
var root_id = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(root);
var blocks__$1 = cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (p1__63423_SHARP_){
return logseq.db.common.property_util.shape_block_QMARK_(repo,db,p1__63423_SHARP_);
}),blocks);
var parent_blocks = cljs.core.group_by((function (p1__63424_SHARP_){
return cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(p1__63424_SHARP_,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","parent","block/parent",-918309064),new cljs.core.Keyword("db","id","db/id",-1388397098)], null));
}),blocks__$1);
var sort_fn = (function (parent){
var temp__5804__auto__ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(parent_blocks,parent);
if(cljs.core.truth_(temp__5804__auto__)){
var children = temp__5804__auto__;
return logseq.db.sort_by_order(children);
} else {
return null;
}
});
var block_children = (function logseq$outliner$tree$blocks__GT_vec_tree_aux_$_block_children(parent,level){
return cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (m){
var id = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(m);
var children = logseq.db.sort_by_order(logseq$outliner$tree$blocks__GT_vec_tree_aux_$_block_children(id,(level + (1))));
return cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(m,new cljs.core.Keyword("block","level","block/level",1182509971),level,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("block","children","block/children",-1040716209),children,new cljs.core.Keyword("block","parent","block/parent",-918309064),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("db","id","db/id",-1388397098),parent], null)], 0)),new cljs.core.Keyword("block","tx-id","block/tx-id",547556161));
}),sort_fn(parent));
});
return block_children(root_id,(1));
});
logseq.outliner.tree.get_root_and_page = (function logseq$outliner$tree$get_root_and_page(db,root_id){
if(cljs.core.uuid_QMARK_(root_id)){
var e = (function (){var G__63439 = db;
var G__63440 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),root_id], null);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__63439,G__63440) : datascript.core.entity.call(null,G__63439,G__63440));
})();
if(cljs.core.truth_((logseq.db.page_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.page_QMARK_.cljs$core$IFn$_invoke$arity$1(e) : logseq.db.page_QMARK_.call(null,e)))){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [true,e], null);
} else {
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [false,e], null);
}
} else {
if(typeof root_id === 'number'){
var e = (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db,root_id) : datascript.core.entity.call(null,db,root_id));
if(cljs.core.truth_((logseq.db.page_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.page_QMARK_.cljs$core$IFn$_invoke$arity$1(e) : logseq.db.page_QMARK_.call(null,e)))){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [true,e], null);
} else {
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [false,e], null);
}
} else {
if(typeof root_id === 'string'){
var temp__5802__auto__ = cljs.core.parse_uuid(root_id);
if(cljs.core.truth_(temp__5802__auto__)){
var id = temp__5802__auto__;
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [false,(function (){var G__63444 = db;
var G__63445 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),id], null);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__63444,G__63445) : datascript.core.entity.call(null,G__63444,G__63445));
})()], null);
} else {
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [true,logseq.db.get_page(db,root_id)], null);
}
} else {
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [false,root_id], null);

}
}
}
});
/**
 * `blocks` need to be in the same page.
 */
logseq.outliner.tree.blocks__GT_vec_tree = (function logseq$outliner$tree$blocks__GT_vec_tree(var_args){
var args__5732__auto__ = [];
var len__5726__auto___63505 = arguments.length;
var i__5727__auto___63506 = (0);
while(true){
if((i__5727__auto___63506 < len__5726__auto___63505)){
args__5732__auto__.push((arguments[i__5727__auto___63506]));

var G__63507 = (i__5727__auto___63506 + (1));
i__5727__auto___63506 = G__63507;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((4) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((4)),(0),null)):null);
return logseq.outliner.tree.blocks__GT_vec_tree.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),(arguments[(1)]),(arguments[(2)]),(arguments[(3)]),argseq__5733__auto__);
});

(logseq.outliner.tree.blocks__GT_vec_tree.cljs$core$IFn$_invoke$arity$variadic = (function (repo,db,blocks,root_id,p__63461){
var map__63462 = p__63461;
var map__63462__$1 = cljs.core.__destructure_map(map__63462);
var option = map__63462__$1;
var blocks__$1 = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (b){
if(datascript.impl.entity.entity_QMARK_(b)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,b),new cljs.core.Keyword("db","id","db/id",-1388397098),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(b));
} else {
return b;
}
}),blocks);
var vec__63463 = logseq.outliner.tree.get_root_and_page(db,root_id);
var page_QMARK_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__63463,(0),null);
var root = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__63463,(1),null);
if(cljs.core.not(root)){
return blocks__$1;
} else {
var result = logseq.outliner.tree.blocks__GT_vec_tree_aux(repo,db,blocks__$1,root);
if(cljs.core.truth_((function (){var and__5000__auto__ = page_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.not(new cljs.core.Keyword(null,"link","link",-1769163468).cljs$core$IFn$_invoke$arity$1(option));
} else {
return and__5000__auto__;
}
})())){
return result;
} else {
var root_block = cljs.core.some((function (p1__63452_SHARP_){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(p1__63452_SHARP_),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(root))){
return p1__63452_SHARP_;
} else {
return null;
}
}),blocks__$1);
var root_block__$1 = cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(root_block,new cljs.core.Keyword("block","children","block/children",-1040716209),result),new cljs.core.Keyword("block","tx-id","block/tx-id",547556161));
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [root_block__$1], null);
}
}
}));

(logseq.outliner.tree.blocks__GT_vec_tree.cljs$lang$maxFixedArity = (4));

/** @this {Function} */
(logseq.outliner.tree.blocks__GT_vec_tree.cljs$lang$applyTo = (function (seq63453){
var G__63454 = cljs.core.first(seq63453);
var seq63453__$1 = cljs.core.next(seq63453);
var G__63455 = cljs.core.first(seq63453__$1);
var seq63453__$2 = cljs.core.next(seq63453__$1);
var G__63456 = cljs.core.first(seq63453__$2);
var seq63453__$3 = cljs.core.next(seq63453__$2);
var G__63457 = cljs.core.first(seq63453__$3);
var seq63453__$4 = cljs.core.next(seq63453__$3);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__63454,G__63455,G__63456,G__63457,seq63453__$4);
}));

logseq.outliner.tree.tree = (function logseq$outliner$tree$tree(parent__GT_children,root,default_level){
var root_id = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(root);
var nodes = (function logseq$outliner$tree$tree_$_nodes(parent_id,level){
return cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (b){
var b_SINGLEQUOTE_ = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(b,new cljs.core.Keyword("block","level","block/level",1182509971),(level + (1)));
var children = logseq$outliner$tree$tree_$_nodes(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(b),(level + (1)));
if(cljs.core.seq(children)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(b_SINGLEQUOTE_,new cljs.core.Keyword("block","children","block/children",-1040716209),children);
} else {
return b_SINGLEQUOTE_;
}
}),(function (){var parent = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("db","id","db/id",-1388397098),parent_id], null);
return logseq.db.sort_by_order(cljs.core.get.cljs$core$IFn$_invoke$arity$2(parent__GT_children,parent));
})());
});
var children = nodes(root_id,(1));
var root_SINGLEQUOTE_ = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(root,new cljs.core.Keyword("block","level","block/level",1182509971),(function (){var or__5002__auto__ = default_level;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return (1);
}
})());
if(cljs.core.seq(children)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(root_SINGLEQUOTE_,new cljs.core.Keyword("block","children","block/children",-1040716209),children);
} else {
return root_SINGLEQUOTE_;
}
});
logseq.outliner.tree.block_entity__GT_map = (function logseq$outliner$tree$block_entity__GT_map(e){
var G__63473 = new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword("db","id","db/id",-1388397098),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(e),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(e),new cljs.core.Keyword("block","parent","block/parent",-918309064),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("db","id","db/id",-1388397098),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","parent","block/parent",-918309064).cljs$core$IFn$_invoke$arity$1(e))], null),new cljs.core.Keyword("block","page","block/page",822314108),new cljs.core.Keyword("block","page","block/page",822314108).cljs$core$IFn$_invoke$arity$1(e)], null);
var G__63473__$1 = (cljs.core.truth_(new cljs.core.Keyword("block","refs","block/refs",-1214495349).cljs$core$IFn$_invoke$arity$1(e))?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__63473,new cljs.core.Keyword("block","refs","block/refs",-1214495349),new cljs.core.Keyword("block","refs","block/refs",-1214495349).cljs$core$IFn$_invoke$arity$1(e)):G__63473);
if(cljs.core.truth_(new cljs.core.Keyword("block","children","block/children",-1040716209).cljs$core$IFn$_invoke$arity$1(e))){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__63473__$1,new cljs.core.Keyword("block","children","block/children",-1040716209),new cljs.core.Keyword("block","children","block/children",-1040716209).cljs$core$IFn$_invoke$arity$1(e));
} else {
return G__63473__$1;
}
});
logseq.outliner.tree.filter_top_level_blocks = (function logseq$outliner$tree$filter_top_level_blocks(blocks){
var id__GT_blocks = cljs.core.zipmap(cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","id","db/id",-1388397098),blocks),blocks);
return cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (p1__63480_SHARP_){
return ((function (){var G__63481 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","parent","block/parent",-918309064).cljs$core$IFn$_invoke$arity$1((function (){var G__63482 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(p1__63480_SHARP_);
return (id__GT_blocks.cljs$core$IFn$_invoke$arity$1 ? id__GT_blocks.cljs$core$IFn$_invoke$arity$1(G__63482) : id__GT_blocks.call(null,G__63482));
})()));
return (id__GT_blocks.cljs$core$IFn$_invoke$arity$1 ? id__GT_blocks.cljs$core$IFn$_invoke$arity$1(G__63481) : id__GT_blocks.call(null,G__63481));
})() == null);
}),blocks);
});
/**
 * `blocks` need to be in the same page.
 */
logseq.outliner.tree.non_consecutive_blocks__GT_vec_tree = (function logseq$outliner$tree$non_consecutive_blocks__GT_vec_tree(var_args){
var G__63489 = arguments.length;
switch (G__63489) {
case 1:
return logseq.outliner.tree.non_consecutive_blocks__GT_vec_tree.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return logseq.outliner.tree.non_consecutive_blocks__GT_vec_tree.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(logseq.outliner.tree.non_consecutive_blocks__GT_vec_tree.cljs$core$IFn$_invoke$arity$1 = (function (blocks){
return logseq.outliner.tree.non_consecutive_blocks__GT_vec_tree.cljs$core$IFn$_invoke$arity$2(blocks,(1));
}));

(logseq.outliner.tree.non_consecutive_blocks__GT_vec_tree.cljs$core$IFn$_invoke$arity$2 = (function (blocks,default_level){
var blocks__$1 = cljs.core.map.cljs$core$IFn$_invoke$arity$2(logseq.outliner.tree.block_entity__GT_map,blocks);
var top_level_blocks = logseq.outliner.tree.filter_top_level_blocks(blocks__$1);
var top_level_blocks_SINGLEQUOTE_ = logseq.db.sort_by_order(top_level_blocks);
var parent__GT_children = cljs.core.group_by(new cljs.core.Keyword("block","parent","block/parent",-918309064),blocks__$1);
return cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__63484_SHARP_){
return logseq.outliner.tree.tree(parent__GT_children,p1__63484_SHARP_,(function (){var or__5002__auto__ = default_level;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return (1);
}
})());
}),top_level_blocks_SINGLEQUOTE_);
}));

(logseq.outliner.tree.non_consecutive_blocks__GT_vec_tree.cljs$lang$maxFixedArity = 2);

logseq.outliner.tree.get_sorted_block_and_children = (function logseq$outliner$tree$get_sorted_block_and_children(var_args){
var args__5732__auto__ = [];
var len__5726__auto___63515 = arguments.length;
var i__5727__auto___63516 = (0);
while(true){
if((i__5727__auto___63516 < len__5726__auto___63515)){
args__5732__auto__.push((arguments[i__5727__auto___63516]));

var G__63518 = (i__5727__auto___63516 + (1));
i__5727__auto___63516 = G__63518;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((2) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((2)),(0),null)):null);
return logseq.outliner.tree.get_sorted_block_and_children.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),(arguments[(1)]),argseq__5733__auto__);
});

(logseq.outliner.tree.get_sorted_block_and_children.cljs$core$IFn$_invoke$arity$variadic = (function (db,db_id,p__63498){
var map__63499 = p__63498;
var map__63499__$1 = cljs.core.__destructure_map(map__63499);
var opts = map__63499__$1;
if(cljs.core.truth_(db_id)){
var temp__5804__auto__ = (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db,db_id) : datascript.core.entity.call(null,db,db_id));
if(cljs.core.truth_(temp__5804__auto__)){
var root_block = temp__5804__auto__;
return logseq.db.get_block_and_children.cljs$core$IFn$_invoke$arity$variadic(db,new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(root_block),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([opts], 0));
} else {
return null;
}
} else {
return null;
}
}));

(logseq.outliner.tree.get_sorted_block_and_children.cljs$lang$maxFixedArity = (2));

/** @this {Function} */
(logseq.outliner.tree.get_sorted_block_and_children.cljs$lang$applyTo = (function (seq63494){
var G__63495 = cljs.core.first(seq63494);
var seq63494__$1 = cljs.core.next(seq63494);
var G__63496 = cljs.core.first(seq63494__$1);
var seq63494__$2 = cljs.core.next(seq63494__$1);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__63495,G__63496,seq63494__$2);
}));


//# sourceMappingURL=logseq.outliner.tree.js.map
