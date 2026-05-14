goog.provide('frontend.worker.undo_redo');
(new cljs.core.PersistentVector(null,6,(5),cljs.core.PersistentVector.EMPTY_NODE,[new cljs.core.Keyword("frontend.worker.undo-redo","record-editor-info","frontend.worker.undo-redo/record-editor-info",713803536),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"doc","doc",1913296891),"record current editor and cursor"], null),new cljs.core.Keyword("frontend.worker.undo-redo","db-transact","frontend.worker.undo-redo/db-transact",1204250472),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"doc","doc",1913296891),"db tx"], null),new cljs.core.Keyword("frontend.worker.undo-redo","ui-state","frontend.worker.undo-redo/ui-state",-396823612),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"doc","doc",1913296891),"ui state such as route && sidebar blocks"], null)],null));
frontend.worker.undo_redo.undo_op_item_schema = malli.util.closed_schema.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"multi","multi",-190293005),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"dispatch","dispatch",1319337009),cljs.core.first], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("frontend.worker.undo-redo","db-transact","frontend.worker.undo-redo/db-transact",1204250472),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"cat","cat",-1457810207),new cljs.core.Keyword(null,"keyword","keyword",811389747),new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"map","map",1371690461),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"tx-data","tx-data",934159761),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"sequential","sequential",-1082983960),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"fn","fn",-1175266204),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("error","message","error/message",-502809098),"should be a Datom"], null),datascript.core.datom_QMARK_], null)], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"tx-meta","tx-meta",1159283194),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"map","map",1371690461),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"closed","closed",-919675359),false], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"keyword","keyword",811389747)], null)], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"added-ids","added-ids",-422897273),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"set","set",304602554),new cljs.core.Keyword(null,"int","int",-1741416922)], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"retracted-ids","retracted-ids",351906643),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"set","set",304602554),new cljs.core.Keyword(null,"int","int",-1741416922)], null)], null)], null)], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("frontend.worker.undo-redo","record-editor-info","frontend.worker.undo-redo/record-editor-info",713803536),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"cat","cat",-1457810207),new cljs.core.Keyword(null,"keyword","keyword",811389747),new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"map","map",1371690461),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"block-uuid","block-uuid",-1558039638),new cljs.core.Keyword(null,"uuid","uuid",-2145095719)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"container-id","container-id",1274665684),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"or","or",235744169),new cljs.core.Keyword(null,"int","int",-1741416922),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"enum","enum",1679018432),new cljs.core.Keyword(null,"unknown-container","unknown-container",1739831473)], null)], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"start-pos","start-pos",668789086),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"maybe","maybe",-314397560),new cljs.core.Keyword(null,"int","int",-1741416922)], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"end-pos","end-pos",-1643883926),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"maybe","maybe",-314397560),new cljs.core.Keyword(null,"int","int",-1741416922)], null)], null)], null)], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("frontend.worker.undo-redo","ui-state","frontend.worker.undo-redo/ui-state",-396823612),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"cat","cat",-1457810207),new cljs.core.Keyword(null,"keyword","keyword",811389747),new cljs.core.Keyword(null,"string","string",-1989541586)], null)], null)], null));
frontend.worker.undo_redo.undo_op_validator = malli.core.validator.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"sequential","sequential",-1082983960),frontend.worker.undo_redo.undo_op_item_schema], null));
if((typeof frontend !== 'undefined') && (typeof frontend.worker !== 'undefined') && (typeof frontend.worker.undo_redo !== 'undefined') && (typeof frontend.worker.undo_redo.max_stack_length !== 'undefined')){
} else {
frontend.worker.undo_redo.max_stack_length = (100);
}
if((typeof frontend !== 'undefined') && (typeof frontend.worker !== 'undefined') && (typeof frontend.worker.undo_redo !== 'undefined') && (typeof frontend.worker.undo_redo._STAR_undo_ops !== 'undefined')){
} else {
frontend.worker.undo_redo._STAR_undo_ops = new cljs.core.Keyword("undo","repo->ops","undo/repo->ops",-1082692245).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.worker.state._STAR_state));
}
if((typeof frontend !== 'undefined') && (typeof frontend.worker !== 'undefined') && (typeof frontend.worker.undo_redo !== 'undefined') && (typeof frontend.worker.undo_redo._STAR_redo_ops !== 'undefined')){
} else {
frontend.worker.undo_redo._STAR_redo_ops = new cljs.core.Keyword("redo","repo->ops","redo/repo->ops",-1083184563).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.worker.state._STAR_state));
}
frontend.worker.undo_redo.conj_op = (function frontend$worker$undo_redo$conj_op(col,op){
var result = cljs.core.conj.cljs$core$IFn$_invoke$arity$2(((cljs.core.empty_QMARK_(col))?cljs.core.PersistentVector.EMPTY:col),op);
if((cljs.core.count(result) >= frontend.worker.undo_redo.max_stack_length)){
return cljs.core.subvec.cljs$core$IFn$_invoke$arity$3(result,(0),(frontend.worker.undo_redo.max_stack_length / (2)));
} else {
return result;
}
});
frontend.worker.undo_redo.pop_stack = (function frontend$worker$undo_redo$pop_stack(stack){
if(cljs.core.seq(stack)){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.last(stack),cljs.core.pop(stack)], null);
} else {
return null;
}
});
frontend.worker.undo_redo.push_undo_op = (function frontend$worker$undo_redo$push_undo_op(repo,op){
if(cljs.core.truth_((frontend.worker.undo_redo.undo_op_validator.cljs$core$IFn$_invoke$arity$1 ? frontend.worker.undo_redo.undo_op_validator.cljs$core$IFn$_invoke$arity$1(op) : frontend.worker.undo_redo.undo_op_validator.call(null,op)))){
} else {
throw (new Error(["Assert failed: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"op","op",-1882987955),op], null)),"\n","(undo-op-validator op)"].join('')));
}

return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$variadic(frontend.worker.undo_redo._STAR_undo_ops,cljs.core.update,repo,frontend.worker.undo_redo.conj_op,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([op], 0));
});
frontend.worker.undo_redo.push_redo_op = (function frontend$worker$undo_redo$push_redo_op(repo,op){
if(cljs.core.truth_((frontend.worker.undo_redo.undo_op_validator.cljs$core$IFn$_invoke$arity$1 ? frontend.worker.undo_redo.undo_op_validator.cljs$core$IFn$_invoke$arity$1(op) : frontend.worker.undo_redo.undo_op_validator.call(null,op)))){
} else {
throw (new Error(["Assert failed: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"op","op",-1882987955),op], null)),"\n","(undo-op-validator op)"].join('')));
}

return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$variadic(frontend.worker.undo_redo._STAR_redo_ops,cljs.core.update,repo,frontend.worker.undo_redo.conj_op,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([op], 0));
});
frontend.worker.undo_redo.pop_undo_op = (function frontend$worker$undo_redo$pop_undo_op(repo){
var undo_stack = cljs.core.get.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(frontend.worker.undo_redo._STAR_undo_ops),repo);
var vec__105417 = frontend.worker.undo_redo.pop_stack(undo_stack);
var op = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__105417,(0),null);
var undo_stack_STAR_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__105417,(1),null);
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(frontend.worker.undo_redo._STAR_undo_ops,cljs.core.assoc,repo,undo_stack_STAR_);

var op_SINGLEQUOTE_ = cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (item){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.first(item),new cljs.core.Keyword("frontend.worker.undo-redo","db-transact","frontend.worker.undo-redo/db-transact",1204250472))){
var m = cljs.core.second(item);
var tx_data_SINGLEQUOTE_ = cljs.core.vec(new cljs.core.Keyword(null,"tx-data","tx-data",934159761).cljs$core$IFn$_invoke$arity$1(m));
if(cljs.core.seq(tx_data_SINGLEQUOTE_)){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("frontend.worker.undo-redo","db-transact","frontend.worker.undo-redo/db-transact",1204250472),cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(m,new cljs.core.Keyword(null,"tx-data","tx-data",934159761),tx_data_SINGLEQUOTE_)], null);
} else {
return new cljs.core.Keyword("frontend.worker.undo-redo","db-transact-no-tx-data","frontend.worker.undo-redo/db-transact-no-tx-data",1006339365);
}
} else {
return item;
}
}),op);
if(cljs.core.truth_(cljs.core.some(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("frontend.worker.undo-redo","db-transact-no-tx-data","frontend.worker.undo-redo/db-transact-no-tx-data",1006339365),null], null), null),op_SINGLEQUOTE_))){
return null;
} else {
return op_SINGLEQUOTE_;
}
});
frontend.worker.undo_redo.pop_redo_op = (function frontend$worker$undo_redo$pop_redo_op(repo){
var redo_stack = cljs.core.get.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(frontend.worker.undo_redo._STAR_redo_ops),repo);
var vec__105431 = frontend.worker.undo_redo.pop_stack(redo_stack);
var op = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__105431,(0),null);
var redo_stack_STAR_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__105431,(1),null);
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(frontend.worker.undo_redo._STAR_redo_ops,cljs.core.assoc,repo,redo_stack_STAR_);

var op_SINGLEQUOTE_ = cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (item){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.first(item),new cljs.core.Keyword("frontend.worker.undo-redo","db-transact","frontend.worker.undo-redo/db-transact",1204250472))){
var m = cljs.core.second(item);
var tx_data_SINGLEQUOTE_ = cljs.core.vec(new cljs.core.Keyword(null,"tx-data","tx-data",934159761).cljs$core$IFn$_invoke$arity$1(m));
if(cljs.core.seq(tx_data_SINGLEQUOTE_)){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("frontend.worker.undo-redo","db-transact","frontend.worker.undo-redo/db-transact",1204250472),cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(m,new cljs.core.Keyword(null,"tx-data","tx-data",934159761),tx_data_SINGLEQUOTE_)], null);
} else {
return new cljs.core.Keyword("frontend.worker.undo-redo","db-transact-no-tx-data","frontend.worker.undo-redo/db-transact-no-tx-data",1006339365);
}
} else {
return item;
}
}),op);
if(cljs.core.truth_(cljs.core.some(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("frontend.worker.undo-redo","db-transact-no-tx-data","frontend.worker.undo-redo/db-transact-no-tx-data",1006339365),null], null), null),op_SINGLEQUOTE_))){
return null;
} else {
return op_SINGLEQUOTE_;
}
});
frontend.worker.undo_redo.empty_undo_stack_QMARK_ = (function frontend$worker$undo_redo$empty_undo_stack_QMARK_(repo){
return cljs.core.empty_QMARK_(cljs.core.get.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(frontend.worker.undo_redo._STAR_undo_ops),repo));
});
frontend.worker.undo_redo.empty_redo_stack_QMARK_ = (function frontend$worker$undo_redo$empty_redo_stack_QMARK_(repo){
return cljs.core.empty_QMARK_(cljs.core.get.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(frontend.worker.undo_redo._STAR_redo_ops),repo));
});
frontend.worker.undo_redo.get_moved_blocks = (function frontend$worker$undo_redo$get_moved_blocks(e__GT_datoms){
return cljs.core.set(cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (p__105442){
var vec__105443 = p__105442;
var e = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__105443,(0),null);
var datoms = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__105443,(1),null);
if(cljs.core.truth_(cljs.core.some((function (k){
var and__5000__auto__ = cljs.core.some((function (d){
var and__5000__auto__ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(k,new cljs.core.Keyword(null,"a","a",-2123407586).cljs$core$IFn$_invoke$arity$1(d));
if(and__5000__auto__){
return new cljs.core.Keyword(null,"added","added",2057651688).cljs$core$IFn$_invoke$arity$1(d);
} else {
return and__5000__auto__;
}
}),datoms);
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.some((function (d){
return ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(k,new cljs.core.Keyword(null,"a","a",-2123407586).cljs$core$IFn$_invoke$arity$1(d))) && (cljs.core.not(new cljs.core.Keyword(null,"added","added",2057651688).cljs$core$IFn$_invoke$arity$1(d))));
}),datoms);
} else {
return and__5000__auto__;
}
}),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","parent","block/parent",-918309064),new cljs.core.Keyword("block","order","block/order",-1429282437)], null)))){
return e;
} else {
return null;
}
}),e__GT_datoms));
});
/**
 * return true if there are other children existing(not included in `ids`)
 */
frontend.worker.undo_redo.other_children_exist_QMARK_ = (function frontend$worker$undo_redo$other_children_exist_QMARK_(entity,ids){
return cljs.core.seq(clojure.set.difference.cljs$core$IFn$_invoke$arity$2(cljs.core.set(cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","id","db/id",-1388397098),new cljs.core.Keyword("block","_parent","block/_parent",-639389670).cljs$core$IFn$_invoke$arity$1(entity))),ids));
});
frontend.worker.undo_redo.reverse_datoms = (function frontend$worker$undo_redo$reverse_datoms(conn,datoms,schema,added_ids,retracted_ids,undo_QMARK_,redo_QMARK_){
return cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (p__105458){
var vec__105459 = p__105458;
var e = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__105459,(0),null);
var a = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__105459,(1),null);
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__105459,(2),null);
var _tx = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__105459,(3),null);
var add_QMARK_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__105459,(4),null);
var ref_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db.type","ref","db.type/ref",-1728373079),cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(schema,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [a,new cljs.core.Keyword("db","valueType","db/valueType",1827971944)], null)));
var op = (cljs.core.truth_((function (){var or__5002__auto__ = (function (){var and__5000__auto__ = redo_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return add_QMARK_;
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var and__5000__auto__ = undo_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.not(add_QMARK_);
} else {
return and__5000__auto__;
}
}
})())?new cljs.core.Keyword("db","add","db/add",235286841):new cljs.core.Keyword("db","retract","db/retract",-1549825231));
if(cljs.core.truth_((function (){var or__5002__auto__ = (!(ref_QMARK_));
if(or__5002__auto__){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = (function (){var G__105466 = cljs.core.deref(conn);
var G__105467 = v;
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__105466,G__105467) : datascript.core.entity.call(null,G__105466,G__105467));
})();
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
var or__5002__auto____$2 = (function (){var and__5000__auto__ = (retracted_ids.cljs$core$IFn$_invoke$arity$1 ? retracted_ids.cljs$core$IFn$_invoke$arity$1(v) : retracted_ids.call(null,v));
if(cljs.core.truth_(and__5000__auto__)){
return undo_QMARK_;
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(or__5002__auto____$2)){
return or__5002__auto____$2;
} else {
var and__5000__auto__ = (added_ids.cljs$core$IFn$_invoke$arity$1 ? added_ids.cljs$core$IFn$_invoke$arity$1(v) : added_ids.call(null,v));
if(cljs.core.truth_(and__5000__auto__)){
return redo_QMARK_;
} else {
return and__5000__auto__;
}
}
}
}
})())){
return new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [op,e,a,v], null);
} else {
return null;
}
}),datoms);
});
frontend.worker.undo_redo.moved_block_or_target_deleted_QMARK_ = (function frontend$worker$undo_redo$moved_block_or_target_deleted_QMARK_(conn,e__GT_datoms,e,moved_blocks,redo_QMARK_){
var datoms = cljs.core.get.cljs$core$IFn$_invoke$arity$2(e__GT_datoms,e);
var and__5000__auto__ = (moved_blocks.cljs$core$IFn$_invoke$arity$1 ? moved_blocks.cljs$core$IFn$_invoke$arity$1(e) : moved_blocks.call(null,e));
if(cljs.core.truth_(and__5000__auto__)){
var b = (function (){var G__105473 = cljs.core.deref(conn);
var G__105474 = e;
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__105473,G__105474) : datascript.core.entity.call(null,G__105473,G__105474));
})();
var cur_parent = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","parent","block/parent",-918309064).cljs$core$IFn$_invoke$arity$1(b));
var move_datoms = cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (d){
return cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("block","parent","block/parent",-918309064),null], null), null),new cljs.core.Keyword(null,"a","a",-2123407586).cljs$core$IFn$_invoke$arity$1(d));
}),datoms);
if(cljs.core.truth_(cur_parent)){
var before_parent = cljs.core.some((function (d){
if(((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","parent","block/parent",-918309064),new cljs.core.Keyword(null,"a","a",-2123407586).cljs$core$IFn$_invoke$arity$1(d))) && (cljs.core.not(new cljs.core.Keyword(null,"added","added",2057651688).cljs$core$IFn$_invoke$arity$1(d))))){
return new cljs.core.Keyword(null,"v","v",21465059).cljs$core$IFn$_invoke$arity$1(d);
} else {
return null;
}
}),move_datoms);
var after_parent = cljs.core.some((function (d){
if(cljs.core.truth_((function (){var and__5000__auto____$1 = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","parent","block/parent",-918309064),new cljs.core.Keyword(null,"a","a",-2123407586).cljs$core$IFn$_invoke$arity$1(d));
if(and__5000__auto____$1){
return new cljs.core.Keyword(null,"added","added",2057651688).cljs$core$IFn$_invoke$arity$1(d);
} else {
return and__5000__auto____$1;
}
})())){
return new cljs.core.Keyword(null,"v","v",21465059).cljs$core$IFn$_invoke$arity$1(d);
} else {
return null;
}
}),move_datoms);
var and__5000__auto____$1 = before_parent;
if(cljs.core.truth_(and__5000__auto____$1)){
var and__5000__auto____$2 = after_parent;
if(cljs.core.truth_(and__5000__auto____$2)){
if(cljs.core.truth_(redo_QMARK_)){
return ((cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(cur_parent,before_parent)) || (((function (){var G__105477 = cljs.core.deref(conn);
var G__105478 = after_parent;
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__105477,G__105478) : datascript.core.entity.call(null,G__105477,G__105478));
})() == null)));
} else {
return ((cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(cur_parent,after_parent)) || (((function (){var G__105481 = cljs.core.deref(conn);
var G__105482 = before_parent;
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__105481,G__105482) : datascript.core.entity.call(null,G__105481,G__105482));
})() == null)));
}
} else {
return and__5000__auto____$2;
}
} else {
return and__5000__auto____$1;
}
} else {
return null;
}
} else {
return and__5000__auto__;
}
});
frontend.worker.undo_redo.get_reversed_datoms = (function frontend$worker$undo_redo$get_reversed_datoms(conn,undo_QMARK_,p__105484,_tx_meta){
var map__105485 = p__105484;
var map__105485__$1 = cljs.core.__destructure_map(map__105485);
var op = map__105485__$1;
var tx_data = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__105485__$1,new cljs.core.Keyword(null,"tx-data","tx-data",934159761));
var added_ids = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__105485__$1,new cljs.core.Keyword(null,"added-ids","added-ids",-422897273));
var retracted_ids = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__105485__$1,new cljs.core.Keyword(null,"retracted-ids","retracted-ids",351906643));
try{var redo_QMARK_ = cljs.core.not(undo_QMARK_);
var e__GT_datoms = cljs.core.group_by(new cljs.core.Keyword(null,"e","e",1381269198),((redo_QMARK_)?tx_data:cljs.core.reverse(tx_data)));
var schema = new cljs.core.Keyword(null,"schema","schema",-1582001791).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(conn));
var added_and_retracted_ids = clojure.set.union.cljs$core$IFn$_invoke$arity$2(added_ids,retracted_ids);
var moved_blocks = frontend.worker.undo_redo.get_moved_blocks(e__GT_datoms);
return cljs.core.remove.cljs$core$IFn$_invoke$arity$2(cljs.core.nil_QMARK_,cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (p__105487){
var vec__105488 = p__105487;
var e = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__105488,(0),null);
var datoms = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__105488,(1),null);
var entity = (function (){var G__105491 = cljs.core.deref(conn);
var G__105492 = e;
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__105491,G__105492) : datascript.core.entity.call(null,G__105491,G__105492));
})();
if((((entity == null)) && ((!(cljs.core.contains_QMARK_(added_and_retracted_ids,e)))))){
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2("Entity has been deleted",cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([op,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"error","error",-978969032),new cljs.core.Keyword(null,"entity-deleted","entity-deleted",335436271),new cljs.core.Keyword(null,"undo?","undo?",85877626),undo_QMARK_], null)], 0)));
} else {
if(cljs.core.truth_((function (){var or__5002__auto__ = ((cljs.core.contains_QMARK_(retracted_ids,e)) && (((redo_QMARK_) && (frontend.worker.undo_redo.other_children_exist_QMARK_(entity,retracted_ids)))));
if(or__5002__auto__){
return or__5002__auto__;
} else {
var and__5000__auto__ = cljs.core.contains_QMARK_(added_ids,e);
if(and__5000__auto__){
var and__5000__auto____$1 = undo_QMARK_;
if(cljs.core.truth_(and__5000__auto____$1)){
return frontend.worker.undo_redo.other_children_exist_QMARK_(entity,added_ids);
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
}
})())){
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2("Children still exists",cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([op,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"error","error",-978969032),new cljs.core.Keyword(null,"block-children-exists","block-children-exists",-1904721242),new cljs.core.Keyword(null,"undo?","undo?",85877626),undo_QMARK_], null)], 0)));
} else {
if(cljs.core.truth_(frontend.worker.undo_redo.moved_block_or_target_deleted_QMARK_(conn,e__GT_datoms,e,moved_blocks,redo_QMARK_))){
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2("This block has been moved or its target has been deleted",cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([op,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"error","error",-978969032),new cljs.core.Keyword(null,"block-moved-or-target-deleted","block-moved-or-target-deleted",1474106302),new cljs.core.Keyword(null,"undo?","undo?",85877626),undo_QMARK_], null)], 0)));
} else {
if(cljs.core.truth_((function (){var and__5000__auto__ = entity;
if(cljs.core.truth_(and__5000__auto__)){
var or__5002__auto__ = ((cljs.core.contains_QMARK_(retracted_ids,e)) && (redo_QMARK_));
if(or__5002__auto__){
return or__5002__auto__;
} else {
var and__5000__auto____$1 = cljs.core.contains_QMARK_(added_ids,e);
if(and__5000__auto____$1){
return undo_QMARK_;
} else {
return and__5000__auto____$1;
}
}
} else {
return and__5000__auto__;
}
})())){
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","retractEntity","db/retractEntity",-1452737935),e], null)], null);
} else {
return frontend.worker.undo_redo.reverse_datoms(conn,datoms,schema,added_ids,retracted_ids,undo_QMARK_,redo_QMARK_);

}
}
}
}
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([e__GT_datoms], 0)));
}catch (e105486){var e = e105486;
cljs.core.prn.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"debug","debug",-1608172596),new cljs.core.Keyword(null,"undo-redo","undo-redo",568614235),new cljs.core.Keyword(null,"error","error",-978969032),new cljs.core.Keyword(null,"error","error",-978969032).cljs$core$IFn$_invoke$arity$1(cljs.core.ex_data(e))], 0));

if(cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"block-children-exists","block-children-exists",-1904721242),null,new cljs.core.Keyword(null,"entity-deleted","entity-deleted",335436271),null,new cljs.core.Keyword(null,"block-moved-or-target-deleted","block-moved-or-target-deleted",1474106302),null], null), null),new cljs.core.Keyword(null,"error","error",-978969032).cljs$core$IFn$_invoke$arity$1(cljs.core.ex_data(e)))){
return null;
} else {
throw e;
}
}});
frontend.worker.undo_redo.undo_redo_aux = (function frontend$worker$undo_redo$undo_redo_aux(repo,conn,undo_QMARK_){
var temp__5802__auto__ = cljs.core.not_empty((function (){var fexpr__105505 = (cljs.core.truth_(undo_QMARK_)?frontend.worker.undo_redo.pop_undo_op:frontend.worker.undo_redo.pop_redo_op);
return (fexpr__105505.cljs$core$IFn$_invoke$arity$1 ? fexpr__105505.cljs$core$IFn$_invoke$arity$1(repo) : fexpr__105505.call(null,repo));
})());
if(cljs.core.truth_(temp__5802__auto__)){
var op = temp__5802__auto__;
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("frontend.worker.undo-redo","ui-state","frontend.worker.undo-redo/ui-state",-396823612),cljs.core.ffirst(op))){
var fexpr__105506_105542 = (cljs.core.truth_(undo_QMARK_)?frontend.worker.undo_redo.push_redo_op:frontend.worker.undo_redo.push_undo_op);
(fexpr__105506_105542.cljs$core$IFn$_invoke$arity$2 ? fexpr__105506_105542.cljs$core$IFn$_invoke$arity$2(repo,op) : fexpr__105506_105542.call(null,repo,op));

var ui_state_str = cljs.core.second(cljs.core.first(op));
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"undo?","undo?",85877626),undo_QMARK_,new cljs.core.Keyword(null,"ui-state-str","ui-state-str",1589208687),ui_state_str], null);
} else {
var map__105508 = cljs.core.some((function (p1__105498_SHARP_){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("frontend.worker.undo-redo","db-transact","frontend.worker.undo-redo/db-transact",1204250472),cljs.core.first(p1__105498_SHARP_))){
return cljs.core.second(p1__105498_SHARP_);
} else {
return null;
}
}),op);
var map__105508__$1 = cljs.core.__destructure_map(map__105508);
var data = map__105508__$1;
var tx_data = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__105508__$1,new cljs.core.Keyword(null,"tx-data","tx-data",934159761));
var tx_meta = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__105508__$1,new cljs.core.Keyword(null,"tx-meta","tx-meta",1159283194));
if(cljs.core.seq(tx_data)){
var reversed_tx_data = frontend.worker.undo_redo.get_reversed_datoms(conn,undo_QMARK_,data,tx_meta);
var tx_meta_SINGLEQUOTE_ = cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(cljs.core.dissoc.cljs$core$IFn$_invoke$arity$variadic(tx_meta,new cljs.core.Keyword(null,"pipeline-replace?","pipeline-replace?",-758892518),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("batch-tx","batch-tx-mode?","batch-tx/batch-tx-mode?",1787753099)], 0)),new cljs.core.Keyword(null,"gen-undo-ops?","gen-undo-ops?",324292975),false,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"undo?","undo?",85877626),undo_QMARK_], 0));
if(cljs.core.seq(reversed_tx_data)){
logseq.db.transact_BANG_.cljs$core$IFn$_invoke$arity$3(conn,reversed_tx_data,tx_meta_SINGLEQUOTE_);

var fexpr__105513_105543 = (cljs.core.truth_(undo_QMARK_)?frontend.worker.undo_redo.push_redo_op:frontend.worker.undo_redo.push_undo_op);
(fexpr__105513_105543.cljs$core$IFn$_invoke$arity$2 ? fexpr__105513_105543.cljs$core$IFn$_invoke$arity$2(repo,op) : fexpr__105513_105543.call(null,repo,op));

var editor_cursors = cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.second,cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (p1__105499_SHARP_){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("frontend.worker.undo-redo","record-editor-info","frontend.worker.undo-redo/record-editor-info",713803536),cljs.core.first(p1__105499_SHARP_));
}),op));
var block_content = new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1((function (){var G__105514 = cljs.core.deref(conn);
var G__105515 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Keyword(null,"block-uuid","block-uuid",-1558039638).cljs$core$IFn$_invoke$arity$1((cljs.core.truth_(undo_QMARK_)?cljs.core.first(editor_cursors):cljs.core.last(editor_cursors)))], null);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__105514,G__105515) : datascript.core.entity.call(null,G__105514,G__105515));
})());
return new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"undo?","undo?",85877626),undo_QMARK_,new cljs.core.Keyword(null,"editor-cursors","editor-cursors",1786594845),editor_cursors,new cljs.core.Keyword(null,"block-content","block-content",476919690),block_content], null);
} else {
return null;
}
} else {
return null;
}

}
} else {
if(cljs.core.truth_((function (){var fexpr__105517 = (cljs.core.truth_(undo_QMARK_)?frontend.worker.undo_redo.empty_undo_stack_QMARK_:frontend.worker.undo_redo.empty_redo_stack_QMARK_);
return (fexpr__105517.cljs$core$IFn$_invoke$arity$1 ? fexpr__105517.cljs$core$IFn$_invoke$arity$1(repo) : fexpr__105517.call(null,repo));
})())){
cljs.core.prn.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([["No further ",(cljs.core.truth_(undo_QMARK_)?"undo":"redo")," information"].join('')], 0));

if(cljs.core.truth_(undo_QMARK_)){
return new cljs.core.Keyword("frontend.worker.undo-redo","empty-undo-stack","frontend.worker.undo-redo/empty-undo-stack",-189693427);
} else {
return new cljs.core.Keyword("frontend.worker.undo-redo","empty-redo-stack","frontend.worker.undo-redo/empty-redo-stack",725373865);
}
} else {
return null;
}
}
});
frontend.worker.undo_redo.undo = (function frontend$worker$undo_redo$undo(repo,conn){
return frontend.worker.undo_redo.undo_redo_aux(repo,conn,true);
});
frontend.worker.undo_redo.redo = (function frontend$worker$undo_redo$redo(repo,conn){
return frontend.worker.undo_redo.undo_redo_aux(repo,conn,false);
});
frontend.worker.undo_redo.record_editor_info_BANG_ = (function frontend$worker$undo_redo$record_editor_info_BANG_(repo,editor_info){
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(frontend.worker.undo_redo._STAR_undo_ops,cljs.core.update,repo,(function (stack){
if(cljs.core.seq(stack)){
return cljs.core.update.cljs$core$IFn$_invoke$arity$3(stack,(cljs.core.count(stack) - (1)),(function (op){
return cljs.core.conj.cljs$core$IFn$_invoke$arity$2(cljs.core.vec(op),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("frontend.worker.undo-redo","record-editor-info","frontend.worker.undo-redo/record-editor-info",713803536),editor_info], null));
}));
} else {
return stack;
}
}));
});
frontend.worker.undo_redo.record_ui_state_BANG_ = (function frontend$worker$undo_redo$record_ui_state_BANG_(repo,ui_state_str){
if(cljs.core.truth_(ui_state_str)){
return frontend.worker.undo_redo.push_undo_op(repo,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("frontend.worker.undo-redo","ui-state","frontend.worker.undo-redo/ui-state",-396823612),ui_state_str], null)], null));
} else {
return null;
}
});
frontend.worker.db_listener.listen_db_changes.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"gen-undo-ops","gen-undo-ops",-1876513030),(function (_,p__105529,p__105530){
var map__105531 = p__105529;
var map__105531__$1 = cljs.core.__destructure_map(map__105531);
var repo = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__105531__$1,new cljs.core.Keyword(null,"repo","repo",-1999060679));
var map__105532 = p__105530;
var map__105532__$1 = cljs.core.__destructure_map(map__105532);
var tx_data = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__105532__$1,new cljs.core.Keyword(null,"tx-data","tx-data",934159761));
var tx_meta = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__105532__$1,new cljs.core.Keyword(null,"tx-meta","tx-meta",1159283194));
var db_after = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__105532__$1,new cljs.core.Keyword(null,"db-after","db-after",-571884666));
var db_before = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__105532__$1,new cljs.core.Keyword(null,"db-before","db-before",-553691536));
var map__105534 = tx_meta;
var map__105534__$1 = cljs.core.__destructure_map(map__105534);
var outliner_op = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__105534__$1,new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450));
if(cljs.core.truth_((function (){var and__5000__auto__ = outliner_op;
if(cljs.core.truth_(and__5000__auto__)){
return (((!(new cljs.core.Keyword(null,"gen-undo-ops?","gen-undo-ops?",324292975).cljs$core$IFn$_invoke$arity$1(tx_meta) === false))) && (cljs.core.not(new cljs.core.Keyword(null,"create-today-journal?","create-today-journal?",136893930).cljs$core$IFn$_invoke$arity$1(tx_meta))));
} else {
return and__5000__auto__;
}
})())){
var editor_info = new cljs.core.Keyword(null,"editor-info","editor-info",566372086).cljs$core$IFn$_invoke$arity$1(tx_meta);
var all_ids = cljs.core.distinct.cljs$core$IFn$_invoke$arity$1(cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"e","e",1381269198),tx_data));
var retracted_ids = cljs.core.set(cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (id){
var and__5000__auto__ = ((datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db_after,id) : datascript.core.entity.call(null,db_after,id)) == null);
if(and__5000__auto__){
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db_before,id) : datascript.core.entity.call(null,db_before,id));
} else {
return and__5000__auto__;
}
}),all_ids));
var added_ids = cljs.core.set(cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (id){
var and__5000__auto__ = ((datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db_before,id) : datascript.core.entity.call(null,db_before,id)) == null);
if(and__5000__auto__){
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db_after,id) : datascript.core.entity.call(null,db_after,id));
} else {
return and__5000__auto__;
}
}),all_ids));
var tx_data_SINGLEQUOTE_ = cljs.core.vec(cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (d){
return cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("block","path-refs","block/path-refs",-2109181352),null], null), null),new cljs.core.Keyword(null,"a","a",-2123407586).cljs$core$IFn$_invoke$arity$1(d));
}),tx_data));
var op = cljs.core.vec(cljs.core.remove.cljs$core$IFn$_invoke$arity$2(cljs.core.nil_QMARK_,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [(cljs.core.truth_(editor_info)?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("frontend.worker.undo-redo","record-editor-info","frontend.worker.undo-redo/record-editor-info",713803536),editor_info], null):null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("frontend.worker.undo-redo","db-transact","frontend.worker.undo-redo/db-transact",1204250472),new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"tx-data","tx-data",934159761),tx_data_SINGLEQUOTE_,new cljs.core.Keyword(null,"tx-meta","tx-meta",1159283194),tx_meta,new cljs.core.Keyword(null,"added-ids","added-ids",-422897273),added_ids,new cljs.core.Keyword(null,"retracted-ids","retracted-ids",351906643),retracted_ids], null)], null)], null)));
return frontend.worker.undo_redo.push_undo_op(repo,op);
} else {
return null;
}
}));

//# sourceMappingURL=frontend.worker.undo_redo.js.map
