goog.provide('logseq.db.common.delete_blocks');
logseq.db.common.delete_blocks.replace_ref_with_deleted_block_title = (function logseq$db$common$delete_blocks$replace_ref_with_deleted_block_title(block,ref_raw_title){
var block_content = ((logseq.db.frontend.entity_util.asset_QMARK_(block))?"":new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(block));
var G__59693 = ref_raw_title;
var G__59693__$1 = (((G__59693 == null))?null:clojure.string.replace(G__59693,cljs.core.re_pattern(logseq.common.util.format.cljs$core$IFn$_invoke$arity$variadic("(?i){{embed \\(\\(%s\\)\\)\\s?}}",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block))], 0))),block_content));
var G__59693__$2 = (((G__59693__$1 == null))?null:clojure.string.replace(G__59693__$1,logseq.common.util.block_ref.__GT_block_ref(cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block))),block_content));
if((G__59693__$2 == null)){
return null;
} else {
return clojure.string.replace(G__59693__$2,logseq.common.util.page_ref.__GT_page_ref(cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block))),block_content);
}
});
logseq.db.common.delete_blocks.build_retracted_tx = (function logseq$db$common$delete_blocks$build_retracted_tx(retracted_blocks){
var refs = logseq.common.util.distinct_by(new cljs.core.Keyword("db","id","db/id",-1388397098),cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (block){
return new cljs.core.Keyword("block","_refs","block/_refs",830218531).cljs$core$IFn$_invoke$arity$1(block);
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([retracted_blocks], 0)));
return cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (ref){
var id = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(ref);
var replaced_title = (function (){var temp__5804__auto__ = new cljs.core.Keyword("block","raw-title","block/raw-title",1833669090).cljs$core$IFn$_invoke$arity$1(ref);
if(cljs.core.truth_(temp__5804__auto__)){
var raw_title = temp__5804__auto__;
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (raw_title__$1,block){
return logseq.db.common.delete_blocks.replace_ref_with_deleted_block_title(block,raw_title__$1);
}),raw_title,retracted_blocks);
} else {
return null;
}
})();
var tx = (function (){var G__59702 = cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (block){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","retract","db/retract",-1549825231),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(ref),new cljs.core.Keyword("block","refs","block/refs",-1214495349),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block)], null),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","retract","db/retract",-1549825231),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(ref),new cljs.core.Keyword("block","path-refs","block/path-refs",-2109181352),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block)], null)], null);
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([retracted_blocks], 0));
if(cljs.core.truth_(replaced_title)){
return cljs.core.conj.cljs$core$IFn$_invoke$arity$2(G__59702,new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","add","db/add",235286841),id,new cljs.core.Keyword("block","title","block/title",710445684),replaced_title], null));
} else {
return G__59702;
}
})();
return tx;
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([refs], 0));
});
/**
 * When a block is deleted, refs are updated, property history are deleted. For file graphs, macros associated
 *   with the block are also deleted
 */
logseq.db.common.delete_blocks.update_refs_history_and_macros = (function logseq$db$common$delete_blocks$update_refs_history_and_macros(db,txs,_opts){
var retracted_block_ids = cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (id){
return cljs.core.not(logseq.db.common.entity_util.page_QMARK_((datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db,id) : datascript.core.entity.call(null,db,id))));
}),cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (tx){
if(((cljs.core.vector_QMARK_(tx)) && (cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("db.fn","retractEntity","db.fn/retractEntity",-1423535441),null,new cljs.core.Keyword("db","retractEntity","db/retractEntity",-1452737935),null], null), null),cljs.core.first(tx))))){
return cljs.core.second(tx);
} else {
return null;
}
}),txs));
if(cljs.core.seq(retracted_block_ids)){
var retracted_blocks = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__59711_SHARP_){
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db,p1__59711_SHARP_) : datascript.core.entity.call(null,db,p1__59711_SHARP_));
}),retracted_block_ids);
var retracted_tx = logseq.db.common.delete_blocks.build_retracted_tx(retracted_blocks);
var retract_history_tx = cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (e){
return cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (history){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","retractEntity","db/retractEntity",-1452737935),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(history)], null);
}),new cljs.core.Keyword("logseq.property.history","_block","logseq.property.history/_block",404702816).cljs$core$IFn$_invoke$arity$1(e));
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([retracted_blocks], 0));
var macros_tx = (cljs.core.truth_(logseq.db.common.entity_plus.db_based_graph_QMARK_(db))?null:cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (b){
return cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (p1__59714_SHARP_){
if((cljs.core.count(new cljs.core.Keyword("block","_macros","block/_macros",1753994265).cljs$core$IFn$_invoke$arity$1((function (){var G__59736 = db;
var G__59737 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(p1__59714_SHARP_);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__59736,G__59737) : datascript.core.entity.call(null,G__59736,G__59737));
})())) <= (1))){
if(cljs.core.truth_(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(p1__59714_SHARP_))){
return (new cljs.core.PersistentVector(null,2,(5),cljs.core.PersistentVector.EMPTY_NODE,[new cljs.core.Keyword("db.fn","retractEntity","db.fn/retractEntity",-1423535441),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(p1__59714_SHARP_)],null));
} else {
return null;
}
} else {
return null;
}
}),new cljs.core.Keyword("block","macros","block/macros",650396438).cljs$core$IFn$_invoke$arity$1(b));
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([retracted_blocks], 0)));
return cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic(txs,retracted_tx,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([retract_history_tx,macros_tx], 0));
} else {
return null;
}
});

//# sourceMappingURL=logseq.db.common.delete_blocks.js.map
