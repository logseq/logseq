goog.provide('frontend.worker.rtc.remote_update');
(new cljs.core.PersistentVector(null,2,(5),cljs.core.PersistentVector.EMPTY_NODE,[new cljs.core.Keyword("frontend.worker.rtc.remote-update","need-pull-remote-data","frontend.worker.rtc.remote-update/need-pull-remote-data",-1524072067),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"doc","doc",1913296891),"\nremote-update's :remote-t-before > :local-tx,\nso need to pull earlier remote-data from websocket."], null)],null));
if((typeof frontend !== 'undefined') && (typeof frontend.worker !== 'undefined') && (typeof frontend.worker.rtc !== 'undefined') && (typeof frontend.worker.rtc.remote_update !== 'undefined') && (typeof frontend.worker.rtc.remote_update.transact_db_BANG_ !== 'undefined')){
} else {
frontend.worker.rtc.remote_update.transact_db_BANG_ = (function (){var method_table__5599__auto__ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
var prefer_table__5600__auto__ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
var method_cache__5601__auto__ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
var cached_hierarchy__5602__auto__ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
var hierarchy__5603__auto__ = cljs.core.get.cljs$core$IFn$_invoke$arity$3(cljs.core.PersistentArrayMap.EMPTY,new cljs.core.Keyword(null,"hierarchy","hierarchy",-1053470341),(function (){var fexpr__137291 = cljs.core.get_global_hierarchy;
return (fexpr__137291.cljs$core$IFn$_invoke$arity$0 ? fexpr__137291.cljs$core$IFn$_invoke$arity$0() : fexpr__137291.call(null));
})());
return (new cljs.core.MultiFn(cljs.core.symbol.cljs$core$IFn$_invoke$arity$2("frontend.worker.rtc.remote-update","transact-db!"),(function() { 
var G__137546__delegate = function (action,_args){
return action;
};
var G__137546 = function (action,var_args){
var _args = null;
if (arguments.length > 1) {
var G__137547__i = 0, G__137547__a = new Array(arguments.length -  1);
while (G__137547__i < G__137547__a.length) {G__137547__a[G__137547__i] = arguments[G__137547__i + 1]; ++G__137547__i;}
  _args = new cljs.core.IndexedSeq(G__137547__a,0,null);
} 
return G__137546__delegate.call(this,action,_args);};
G__137546.cljs$lang$maxFixedArity = 1;
G__137546.cljs$lang$applyTo = (function (arglist__137548){
var action = cljs.core.first(arglist__137548);
var _args = cljs.core.rest(arglist__137548);
return G__137546__delegate(action,_args);
});
G__137546.cljs$core$IFn$_invoke$arity$variadic = G__137546__delegate;
return G__137546;
})()
,new cljs.core.Keyword(null,"default","default",-1987822328),hierarchy__5603__auto__,method_table__5599__auto__,prefer_table__5600__auto__,method_cache__5601__auto__,cached_hierarchy__5602__auto__));
})();
}
frontend.worker.rtc.remote_update.transact_db_BANG_.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"delete-blocks","delete-blocks",-1868631596),(function() { 
var G__137549__delegate = function (_,args){
var opts__63380__auto__ = cljs.core.dissoc.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"persist-op?","persist-op?",-531287534),false,new cljs.core.Keyword(null,"gen-undo-ops?","gen-undo-ops?",324292975),false,new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"delete-blocks","delete-blocks",-1868631596),new cljs.core.Keyword(null,"transact-opts","transact-opts",187283396),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"repo","repo",-1999060679),cljs.core.first(args),new cljs.core.Keyword(null,"conn","conn",278309663),cljs.core.second(args)], null)], null),new cljs.core.Keyword(null,"transact-opts","transact-opts",187283396),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"current-block","current-block",1027687970)], 0));
if((!((logseq.outliner.batch_tx.get_batch_db_before() == null)))){
return cljs.core.apply.cljs$core$IFn$_invoke$arity$2(logseq.outliner.core.delete_blocks_BANG_,args);
} else {
try{var tx_meta__62753__auto__ = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(cljs.core.dissoc.cljs$core$IFn$_invoke$arity$variadic(opts__63380__auto__,new cljs.core.Keyword(null,"additional-tx","additional-tx",-343057604),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"transact-opts","transact-opts",187283396)], 0)),new cljs.core.Keyword("batch-tx","batch-tx-mode?","batch-tx/batch-tx-mode?",1787753099),true);
logseq.outliner.batch_tx.set_batch_opts(tx_meta__62753__auto__);

logseq.outliner.batch_tx.set_batch_db_before_BANG_(cljs.core.deref(new cljs.core.Keyword(null,"conn","conn",278309663).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"transact-opts","transact-opts",187283396).cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"persist-op?","persist-op?",-531287534),false,new cljs.core.Keyword(null,"gen-undo-ops?","gen-undo-ops?",324292975),false,new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"delete-blocks","delete-blocks",-1868631596),new cljs.core.Keyword(null,"transact-opts","transact-opts",187283396),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"repo","repo",-1999060679),cljs.core.first(args),new cljs.core.Keyword(null,"conn","conn",278309663),cljs.core.second(args)], null)], null)))));

cljs.core.apply.cljs$core$IFn$_invoke$arity$2(logseq.outliner.core.delete_blocks_BANG_,args);

if(cljs.core.seq(null)){
logseq.db.transact_BANG_.cljs$core$IFn$_invoke$arity$3(new cljs.core.Keyword(null,"conn","conn",278309663).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"transact-opts","transact-opts",187283396).cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"persist-op?","persist-op?",-531287534),false,new cljs.core.Keyword(null,"gen-undo-ops?","gen-undo-ops?",324292975),false,new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"delete-blocks","delete-blocks",-1868631596),new cljs.core.Keyword(null,"transact-opts","transact-opts",187283396),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"repo","repo",-1999060679),cljs.core.first(args),new cljs.core.Keyword(null,"conn","conn",278309663),cljs.core.second(args)], null)], null))),null,cljs.core.PersistentArrayMap.EMPTY);
} else {
}

var G__137293_137550 = new cljs.core.Keyword(null,"conn","conn",278309663).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"transact-opts","transact-opts",187283396).cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"persist-op?","persist-op?",-531287534),false,new cljs.core.Keyword(null,"gen-undo-ops?","gen-undo-ops?",324292975),false,new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"delete-blocks","delete-blocks",-1868631596),new cljs.core.Keyword(null,"transact-opts","transact-opts",187283396),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"repo","repo",-1999060679),cljs.core.first(args),new cljs.core.Keyword(null,"conn","conn",278309663),cljs.core.second(args)], null)], null)));
var G__137294_137551 = cljs.core.PersistentVector.EMPTY;
var G__137295_137552 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("batch-tx","exit?","batch-tx/exit?",-2021083148),true], null);
(datascript.core.transact_BANG_.cljs$core$IFn$_invoke$arity$3 ? datascript.core.transact_BANG_.cljs$core$IFn$_invoke$arity$3(G__137293_137550,G__137294_137551,G__137295_137552) : datascript.core.transact_BANG_.call(null,G__137293_137550,G__137294_137551,G__137295_137552));

return logseq.outliner.batch_tx.exit_batch_txs_mode_BANG_();
}catch (e137292){var e__62754__auto__ = e137292;
logseq.outliner.batch_tx.exit_batch_txs_mode_BANG_();

throw e__62754__auto__;
}}
};
var G__137549 = function (_,var_args){
var args = null;
if (arguments.length > 1) {
var G__137553__i = 0, G__137553__a = new Array(arguments.length -  1);
while (G__137553__i < G__137553__a.length) {G__137553__a[G__137553__i] = arguments[G__137553__i + 1]; ++G__137553__i;}
  args = new cljs.core.IndexedSeq(G__137553__a,0,null);
} 
return G__137549__delegate.call(this,_,args);};
G__137549.cljs$lang$maxFixedArity = 1;
G__137549.cljs$lang$applyTo = (function (arglist__137554){
var _ = cljs.core.first(arglist__137554);
var args = cljs.core.rest(arglist__137554);
return G__137549__delegate(_,args);
});
G__137549.cljs$core$IFn$_invoke$arity$variadic = G__137549__delegate;
return G__137549;
})()
);
frontend.worker.rtc.remote_update.transact_db_BANG_.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"move-blocks","move-blocks",-955702999),(function() { 
var G__137555__delegate = function (_,args){
var opts__63380__auto__ = cljs.core.dissoc.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"persist-op?","persist-op?",-531287534),false,new cljs.core.Keyword(null,"gen-undo-ops?","gen-undo-ops?",324292975),false,new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"move-blocks","move-blocks",-955702999),new cljs.core.Keyword(null,"transact-opts","transact-opts",187283396),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"repo","repo",-1999060679),cljs.core.first(args),new cljs.core.Keyword(null,"conn","conn",278309663),cljs.core.second(args)], null)], null),new cljs.core.Keyword(null,"transact-opts","transact-opts",187283396),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"current-block","current-block",1027687970)], 0));
if((!((logseq.outliner.batch_tx.get_batch_db_before() == null)))){
return cljs.core.apply.cljs$core$IFn$_invoke$arity$2(logseq.outliner.core.move_blocks_BANG_,args);
} else {
try{var tx_meta__62753__auto__ = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(cljs.core.dissoc.cljs$core$IFn$_invoke$arity$variadic(opts__63380__auto__,new cljs.core.Keyword(null,"additional-tx","additional-tx",-343057604),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"transact-opts","transact-opts",187283396)], 0)),new cljs.core.Keyword("batch-tx","batch-tx-mode?","batch-tx/batch-tx-mode?",1787753099),true);
logseq.outliner.batch_tx.set_batch_opts(tx_meta__62753__auto__);

logseq.outliner.batch_tx.set_batch_db_before_BANG_(cljs.core.deref(new cljs.core.Keyword(null,"conn","conn",278309663).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"transact-opts","transact-opts",187283396).cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"persist-op?","persist-op?",-531287534),false,new cljs.core.Keyword(null,"gen-undo-ops?","gen-undo-ops?",324292975),false,new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"move-blocks","move-blocks",-955702999),new cljs.core.Keyword(null,"transact-opts","transact-opts",187283396),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"repo","repo",-1999060679),cljs.core.first(args),new cljs.core.Keyword(null,"conn","conn",278309663),cljs.core.second(args)], null)], null)))));

cljs.core.apply.cljs$core$IFn$_invoke$arity$2(logseq.outliner.core.move_blocks_BANG_,args);

if(cljs.core.seq(null)){
logseq.db.transact_BANG_.cljs$core$IFn$_invoke$arity$3(new cljs.core.Keyword(null,"conn","conn",278309663).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"transact-opts","transact-opts",187283396).cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"persist-op?","persist-op?",-531287534),false,new cljs.core.Keyword(null,"gen-undo-ops?","gen-undo-ops?",324292975),false,new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"move-blocks","move-blocks",-955702999),new cljs.core.Keyword(null,"transact-opts","transact-opts",187283396),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"repo","repo",-1999060679),cljs.core.first(args),new cljs.core.Keyword(null,"conn","conn",278309663),cljs.core.second(args)], null)], null))),null,cljs.core.PersistentArrayMap.EMPTY);
} else {
}

var G__137297_137556 = new cljs.core.Keyword(null,"conn","conn",278309663).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"transact-opts","transact-opts",187283396).cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"persist-op?","persist-op?",-531287534),false,new cljs.core.Keyword(null,"gen-undo-ops?","gen-undo-ops?",324292975),false,new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"move-blocks","move-blocks",-955702999),new cljs.core.Keyword(null,"transact-opts","transact-opts",187283396),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"repo","repo",-1999060679),cljs.core.first(args),new cljs.core.Keyword(null,"conn","conn",278309663),cljs.core.second(args)], null)], null)));
var G__137298_137557 = cljs.core.PersistentVector.EMPTY;
var G__137299_137558 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("batch-tx","exit?","batch-tx/exit?",-2021083148),true], null);
(datascript.core.transact_BANG_.cljs$core$IFn$_invoke$arity$3 ? datascript.core.transact_BANG_.cljs$core$IFn$_invoke$arity$3(G__137297_137556,G__137298_137557,G__137299_137558) : datascript.core.transact_BANG_.call(null,G__137297_137556,G__137298_137557,G__137299_137558));

return logseq.outliner.batch_tx.exit_batch_txs_mode_BANG_();
}catch (e137296){var e__62754__auto__ = e137296;
logseq.outliner.batch_tx.exit_batch_txs_mode_BANG_();

throw e__62754__auto__;
}}
};
var G__137555 = function (_,var_args){
var args = null;
if (arguments.length > 1) {
var G__137559__i = 0, G__137559__a = new Array(arguments.length -  1);
while (G__137559__i < G__137559__a.length) {G__137559__a[G__137559__i] = arguments[G__137559__i + 1]; ++G__137559__i;}
  args = new cljs.core.IndexedSeq(G__137559__a,0,null);
} 
return G__137555__delegate.call(this,_,args);};
G__137555.cljs$lang$maxFixedArity = 1;
G__137555.cljs$lang$applyTo = (function (arglist__137560){
var _ = cljs.core.first(arglist__137560);
var args = cljs.core.rest(arglist__137560);
return G__137555__delegate(_,args);
});
G__137555.cljs$core$IFn$_invoke$arity$variadic = G__137555__delegate;
return G__137555;
})()
);
frontend.worker.rtc.remote_update.transact_db_BANG_.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"update-block-order-directly","update-block-order-directly",-912768900),(function (_,_repo,conn,block_uuid,block_parent_uuid,block_order){
var parent_ent = (cljs.core.truth_(block_parent_uuid)?(function (){var G__137300 = cljs.core.deref(conn);
var G__137301 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_parent_uuid], null);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__137300,G__137301) : datascript.core.entity.call(null,G__137300,G__137301));
})():null);
var sorted_order_PLUS_block_uuid_coll = cljs.core.sort_by.cljs$core$IFn$_invoke$arity$2(cljs.core.first,cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.juxt.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","order","block/order",-1429282437),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552)),new cljs.core.Keyword("block","_parent","block/_parent",-639389670).cljs$core$IFn$_invoke$arity$1(parent_ent)));
var block_order_STAR_ = (function (){var temp__5802__auto__ = cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (p__137302,p__137303){
var vec__137304 = p__137302;
var start_order = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__137304,(0),null);
var vec__137307 = p__137303;
var current_order = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__137307,(0),null);
var current_block_uuid = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__137307,(1),null);
if(cljs.core.truth_(start_order)){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(current_block_uuid,block_uuid)){
cljs.core.reduced(null);
} else {
cljs.core.reduced(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [start_order,current_order], null));
}
} else {
}

var compare_order = cljs.core.compare(current_order,block_order);
if((((compare_order === (0))) && (cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(current_block_uuid,block_uuid)))){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [current_order,null], null);
} else {
if((((compare_order === (0))) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(current_block_uuid,block_uuid)))){
return cljs.core.reduced(null);
} else {
if((compare_order > (0))){
return cljs.core.reduced(null);
} else {
if((compare_order < (0))){
return null;
} else {
return null;
}
}
}
}
}),null,sorted_order_PLUS_block_uuid_coll);
if(cljs.core.truth_(temp__5802__auto__)){
var vec__137310 = temp__5802__auto__;
var start_order = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__137310,(0),null);
var end_order = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__137310,(1),null);
return logseq.clj_fractional_indexing.generate_key_between(start_order,end_order);
} else {
return block_order;
}
})();
return logseq.db.transact_BANG_.cljs$core$IFn$_invoke$arity$2(conn,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_uuid,new cljs.core.Keyword("block","order","block/order",-1429282437),block_order_STAR_], null)], null));
}));
frontend.worker.rtc.remote_update.transact_db_BANG_.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"move-blocks&persist-op","move-blocks&persist-op",2069517925),(function() { 
var G__137561__delegate = function (_,args){
var opts__63380__auto__ = cljs.core.dissoc.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"persist-op?","persist-op?",-531287534),true,new cljs.core.Keyword(null,"gen-undo-ops?","gen-undo-ops?",324292975),false,new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"move-blocks","move-blocks",-955702999),new cljs.core.Keyword(null,"transact-opts","transact-opts",187283396),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"repo","repo",-1999060679),cljs.core.first(args),new cljs.core.Keyword(null,"conn","conn",278309663),cljs.core.second(args)], null)], null),new cljs.core.Keyword(null,"transact-opts","transact-opts",187283396),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"current-block","current-block",1027687970)], 0));
if((!((logseq.outliner.batch_tx.get_batch_db_before() == null)))){
return cljs.core.apply.cljs$core$IFn$_invoke$arity$2(logseq.outliner.core.move_blocks_BANG_,args);
} else {
try{var tx_meta__62753__auto__ = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(cljs.core.dissoc.cljs$core$IFn$_invoke$arity$variadic(opts__63380__auto__,new cljs.core.Keyword(null,"additional-tx","additional-tx",-343057604),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"transact-opts","transact-opts",187283396)], 0)),new cljs.core.Keyword("batch-tx","batch-tx-mode?","batch-tx/batch-tx-mode?",1787753099),true);
logseq.outliner.batch_tx.set_batch_opts(tx_meta__62753__auto__);

logseq.outliner.batch_tx.set_batch_db_before_BANG_(cljs.core.deref(new cljs.core.Keyword(null,"conn","conn",278309663).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"transact-opts","transact-opts",187283396).cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"persist-op?","persist-op?",-531287534),true,new cljs.core.Keyword(null,"gen-undo-ops?","gen-undo-ops?",324292975),false,new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"move-blocks","move-blocks",-955702999),new cljs.core.Keyword(null,"transact-opts","transact-opts",187283396),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"repo","repo",-1999060679),cljs.core.first(args),new cljs.core.Keyword(null,"conn","conn",278309663),cljs.core.second(args)], null)], null)))));

cljs.core.apply.cljs$core$IFn$_invoke$arity$2(logseq.outliner.core.move_blocks_BANG_,args);

if(cljs.core.seq(null)){
logseq.db.transact_BANG_.cljs$core$IFn$_invoke$arity$3(new cljs.core.Keyword(null,"conn","conn",278309663).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"transact-opts","transact-opts",187283396).cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"persist-op?","persist-op?",-531287534),true,new cljs.core.Keyword(null,"gen-undo-ops?","gen-undo-ops?",324292975),false,new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"move-blocks","move-blocks",-955702999),new cljs.core.Keyword(null,"transact-opts","transact-opts",187283396),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"repo","repo",-1999060679),cljs.core.first(args),new cljs.core.Keyword(null,"conn","conn",278309663),cljs.core.second(args)], null)], null))),null,cljs.core.PersistentArrayMap.EMPTY);
} else {
}

var G__137314_137562 = new cljs.core.Keyword(null,"conn","conn",278309663).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"transact-opts","transact-opts",187283396).cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"persist-op?","persist-op?",-531287534),true,new cljs.core.Keyword(null,"gen-undo-ops?","gen-undo-ops?",324292975),false,new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"move-blocks","move-blocks",-955702999),new cljs.core.Keyword(null,"transact-opts","transact-opts",187283396),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"repo","repo",-1999060679),cljs.core.first(args),new cljs.core.Keyword(null,"conn","conn",278309663),cljs.core.second(args)], null)], null)));
var G__137315_137563 = cljs.core.PersistentVector.EMPTY;
var G__137316_137564 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("batch-tx","exit?","batch-tx/exit?",-2021083148),true], null);
(datascript.core.transact_BANG_.cljs$core$IFn$_invoke$arity$3 ? datascript.core.transact_BANG_.cljs$core$IFn$_invoke$arity$3(G__137314_137562,G__137315_137563,G__137316_137564) : datascript.core.transact_BANG_.call(null,G__137314_137562,G__137315_137563,G__137316_137564));

return logseq.outliner.batch_tx.exit_batch_txs_mode_BANG_();
}catch (e137313){var e__62754__auto__ = e137313;
logseq.outliner.batch_tx.exit_batch_txs_mode_BANG_();

throw e__62754__auto__;
}}
};
var G__137561 = function (_,var_args){
var args = null;
if (arguments.length > 1) {
var G__137565__i = 0, G__137565__a = new Array(arguments.length -  1);
while (G__137565__i < G__137565__a.length) {G__137565__a[G__137565__i] = arguments[G__137565__i + 1]; ++G__137565__i;}
  args = new cljs.core.IndexedSeq(G__137565__a,0,null);
} 
return G__137561__delegate.call(this,_,args);};
G__137561.cljs$lang$maxFixedArity = 1;
G__137561.cljs$lang$applyTo = (function (arglist__137566){
var _ = cljs.core.first(arglist__137566);
var args = cljs.core.rest(arglist__137566);
return G__137561__delegate(_,args);
});
G__137561.cljs$core$IFn$_invoke$arity$variadic = G__137561__delegate;
return G__137561;
})()
);
frontend.worker.rtc.remote_update.transact_db_BANG_.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"insert-blocks","insert-blocks",-1269782013),(function (_,repo,conn,blocks,target,opts){
var opts__63380__auto__ = cljs.core.dissoc.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"persist-op?","persist-op?",-531287534),false,new cljs.core.Keyword(null,"gen-undo-ops?","gen-undo-ops?",324292975),false,new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"insert-blocks","insert-blocks",-1269782013),new cljs.core.Keyword(null,"transact-opts","transact-opts",187283396),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"repo","repo",-1999060679),repo,new cljs.core.Keyword(null,"conn","conn",278309663),conn], null)], null),new cljs.core.Keyword(null,"transact-opts","transact-opts",187283396),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"current-block","current-block",1027687970)], 0));
if((!((logseq.outliner.batch_tx.get_batch_db_before() == null)))){
var opts_SINGLEQUOTE_ = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(opts,new cljs.core.Keyword(null,"keep-block-order?","keep-block-order?",1077761724),true);
return logseq.outliner.core.insert_blocks_BANG_(repo,conn,blocks,target,opts_SINGLEQUOTE_);
} else {
try{var tx_meta__62753__auto__ = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(cljs.core.dissoc.cljs$core$IFn$_invoke$arity$variadic(opts__63380__auto__,new cljs.core.Keyword(null,"additional-tx","additional-tx",-343057604),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"transact-opts","transact-opts",187283396)], 0)),new cljs.core.Keyword("batch-tx","batch-tx-mode?","batch-tx/batch-tx-mode?",1787753099),true);
logseq.outliner.batch_tx.set_batch_opts(tx_meta__62753__auto__);

logseq.outliner.batch_tx.set_batch_db_before_BANG_(cljs.core.deref(new cljs.core.Keyword(null,"conn","conn",278309663).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"transact-opts","transact-opts",187283396).cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"persist-op?","persist-op?",-531287534),false,new cljs.core.Keyword(null,"gen-undo-ops?","gen-undo-ops?",324292975),false,new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"insert-blocks","insert-blocks",-1269782013),new cljs.core.Keyword(null,"transact-opts","transact-opts",187283396),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"repo","repo",-1999060679),repo,new cljs.core.Keyword(null,"conn","conn",278309663),conn], null)], null)))));

var opts_SINGLEQUOTE__137567 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(opts,new cljs.core.Keyword(null,"keep-block-order?","keep-block-order?",1077761724),true);
logseq.outliner.core.insert_blocks_BANG_(repo,conn,blocks,target,opts_SINGLEQUOTE__137567);

if(cljs.core.seq(null)){
logseq.db.transact_BANG_.cljs$core$IFn$_invoke$arity$3(new cljs.core.Keyword(null,"conn","conn",278309663).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"transact-opts","transact-opts",187283396).cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"persist-op?","persist-op?",-531287534),false,new cljs.core.Keyword(null,"gen-undo-ops?","gen-undo-ops?",324292975),false,new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"insert-blocks","insert-blocks",-1269782013),new cljs.core.Keyword(null,"transact-opts","transact-opts",187283396),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"repo","repo",-1999060679),repo,new cljs.core.Keyword(null,"conn","conn",278309663),conn], null)], null))),null,cljs.core.PersistentArrayMap.EMPTY);
} else {
}

var G__137318_137568 = new cljs.core.Keyword(null,"conn","conn",278309663).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"transact-opts","transact-opts",187283396).cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"persist-op?","persist-op?",-531287534),false,new cljs.core.Keyword(null,"gen-undo-ops?","gen-undo-ops?",324292975),false,new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"insert-blocks","insert-blocks",-1269782013),new cljs.core.Keyword(null,"transact-opts","transact-opts",187283396),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"repo","repo",-1999060679),repo,new cljs.core.Keyword(null,"conn","conn",278309663),conn], null)], null)));
var G__137319_137569 = cljs.core.PersistentVector.EMPTY;
var G__137320_137570 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("batch-tx","exit?","batch-tx/exit?",-2021083148),true], null);
(datascript.core.transact_BANG_.cljs$core$IFn$_invoke$arity$3 ? datascript.core.transact_BANG_.cljs$core$IFn$_invoke$arity$3(G__137318_137568,G__137319_137569,G__137320_137570) : datascript.core.transact_BANG_.call(null,G__137318_137568,G__137319_137569,G__137320_137570));

return logseq.outliner.batch_tx.exit_batch_txs_mode_BANG_();
}catch (e137317){var e__62754__auto__ = e137317;
logseq.outliner.batch_tx.exit_batch_txs_mode_BANG_();

throw e__62754__auto__;
}}
}));
frontend.worker.rtc.remote_update.transact_db_BANG_.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"insert-no-order-blocks","insert-no-order-blocks",-576698292),(function (_,conn,block_uuid_PLUS_parent_coll){
return logseq.db.transact_BANG_.cljs$core$IFn$_invoke$arity$3(conn,cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (p__137321){
var vec__137322 = p__137321;
var block_uuid = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__137322,(0),null);
var block_parent = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__137322,(1),null);
var G__137325 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_uuid], null);
if(cljs.core.truth_(block_parent)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__137325,new cljs.core.Keyword("block","parent","block/parent",-918309064),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_parent], null));
} else {
return G__137325;
}
}),block_uuid_PLUS_parent_coll),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"persist-op?","persist-op?",-531287534),false,new cljs.core.Keyword(null,"gen-undo-ops?","gen-undo-ops?",324292975),false], null));
}));
frontend.worker.rtc.remote_update.transact_db_BANG_.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"save-block","save-block",591532560),(function() { 
var G__137571__delegate = function (_,args){
var opts__63380__auto__ = cljs.core.dissoc.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"persist-op?","persist-op?",-531287534),false,new cljs.core.Keyword(null,"gen-undo-ops?","gen-undo-ops?",324292975),false,new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"save-block","save-block",591532560),new cljs.core.Keyword(null,"transact-opts","transact-opts",187283396),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"repo","repo",-1999060679),cljs.core.first(args),new cljs.core.Keyword(null,"conn","conn",278309663),cljs.core.second(args)], null)], null),new cljs.core.Keyword(null,"transact-opts","transact-opts",187283396),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"current-block","current-block",1027687970)], 0));
if((!((logseq.outliner.batch_tx.get_batch_db_before() == null)))){
return cljs.core.apply.cljs$core$IFn$_invoke$arity$2(logseq.outliner.core.save_block_BANG_,args);
} else {
try{var tx_meta__62753__auto__ = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(cljs.core.dissoc.cljs$core$IFn$_invoke$arity$variadic(opts__63380__auto__,new cljs.core.Keyword(null,"additional-tx","additional-tx",-343057604),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"transact-opts","transact-opts",187283396)], 0)),new cljs.core.Keyword("batch-tx","batch-tx-mode?","batch-tx/batch-tx-mode?",1787753099),true);
logseq.outliner.batch_tx.set_batch_opts(tx_meta__62753__auto__);

logseq.outliner.batch_tx.set_batch_db_before_BANG_(cljs.core.deref(new cljs.core.Keyword(null,"conn","conn",278309663).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"transact-opts","transact-opts",187283396).cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"persist-op?","persist-op?",-531287534),false,new cljs.core.Keyword(null,"gen-undo-ops?","gen-undo-ops?",324292975),false,new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"save-block","save-block",591532560),new cljs.core.Keyword(null,"transact-opts","transact-opts",187283396),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"repo","repo",-1999060679),cljs.core.first(args),new cljs.core.Keyword(null,"conn","conn",278309663),cljs.core.second(args)], null)], null)))));

cljs.core.apply.cljs$core$IFn$_invoke$arity$2(logseq.outliner.core.save_block_BANG_,args);

if(cljs.core.seq(null)){
logseq.db.transact_BANG_.cljs$core$IFn$_invoke$arity$3(new cljs.core.Keyword(null,"conn","conn",278309663).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"transact-opts","transact-opts",187283396).cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"persist-op?","persist-op?",-531287534),false,new cljs.core.Keyword(null,"gen-undo-ops?","gen-undo-ops?",324292975),false,new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"save-block","save-block",591532560),new cljs.core.Keyword(null,"transact-opts","transact-opts",187283396),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"repo","repo",-1999060679),cljs.core.first(args),new cljs.core.Keyword(null,"conn","conn",278309663),cljs.core.second(args)], null)], null))),null,cljs.core.PersistentArrayMap.EMPTY);
} else {
}

var G__137327_137572 = new cljs.core.Keyword(null,"conn","conn",278309663).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"transact-opts","transact-opts",187283396).cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"persist-op?","persist-op?",-531287534),false,new cljs.core.Keyword(null,"gen-undo-ops?","gen-undo-ops?",324292975),false,new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"save-block","save-block",591532560),new cljs.core.Keyword(null,"transact-opts","transact-opts",187283396),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"repo","repo",-1999060679),cljs.core.first(args),new cljs.core.Keyword(null,"conn","conn",278309663),cljs.core.second(args)], null)], null)));
var G__137328_137573 = cljs.core.PersistentVector.EMPTY;
var G__137329_137574 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("batch-tx","exit?","batch-tx/exit?",-2021083148),true], null);
(datascript.core.transact_BANG_.cljs$core$IFn$_invoke$arity$3 ? datascript.core.transact_BANG_.cljs$core$IFn$_invoke$arity$3(G__137327_137572,G__137328_137573,G__137329_137574) : datascript.core.transact_BANG_.call(null,G__137327_137572,G__137328_137573,G__137329_137574));

return logseq.outliner.batch_tx.exit_batch_txs_mode_BANG_();
}catch (e137326){var e__62754__auto__ = e137326;
logseq.outliner.batch_tx.exit_batch_txs_mode_BANG_();

throw e__62754__auto__;
}}
};
var G__137571 = function (_,var_args){
var args = null;
if (arguments.length > 1) {
var G__137575__i = 0, G__137575__a = new Array(arguments.length -  1);
while (G__137575__i < G__137575__a.length) {G__137575__a[G__137575__i] = arguments[G__137575__i + 1]; ++G__137575__i;}
  args = new cljs.core.IndexedSeq(G__137575__a,0,null);
} 
return G__137571__delegate.call(this,_,args);};
G__137571.cljs$lang$maxFixedArity = 1;
G__137571.cljs$lang$applyTo = (function (arglist__137576){
var _ = cljs.core.first(arglist__137576);
var args = cljs.core.rest(arglist__137576);
return G__137571__delegate(_,args);
});
G__137571.cljs$core$IFn$_invoke$arity$variadic = G__137571__delegate;
return G__137571;
})()
);
frontend.worker.rtc.remote_update.transact_db_BANG_.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"delete-whiteboard-blocks","delete-whiteboard-blocks",-881390968),(function (_,conn,block_uuids){
return logseq.db.transact_BANG_.cljs$core$IFn$_invoke$arity$3(conn,cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (block_uuid){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","retractEntity","db/retractEntity",-1452737935),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_uuid], null)], null);
}),block_uuids),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"persist-op?","persist-op?",-531287534),false,new cljs.core.Keyword(null,"gen-undo-ops?","gen-undo-ops?",324292975),false], null));
}));
frontend.worker.rtc.remote_update.transact_db_BANG_.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"upsert-whiteboard-block","upsert-whiteboard-block",765052357),(function (_,conn,blocks){
return logseq.db.transact_BANG_.cljs$core$IFn$_invoke$arity$3(conn,blocks,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"persist-op?","persist-op?",-531287534),false,new cljs.core.Keyword(null,"gen-undo-ops?","gen-undo-ops?",324292975),false], null));
}));
/**
 * return {true [<whiteboard-block-ops>], false [<other-ops>]}
 */
frontend.worker.rtc.remote_update.group_remote_remove_ops_by_whiteboard_block = (function frontend$worker$rtc$remote_update$group_remote_remove_ops_by_whiteboard_block(db,remote_remove_ops){
return cljs.core.group_by((function (p__137330){
var map__137331 = p__137330;
var map__137331__$1 = cljs.core.__destructure_map(map__137331);
var block_uuid = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__137331__$1,new cljs.core.Keyword(null,"block-uuid","block-uuid",-1558039638));
return cljs.core.boolean$((function (){var temp__5804__auto__ = (function (){var G__137332 = db;
var G__137333 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_uuid], null);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__137332,G__137333) : datascript.core.entity.call(null,G__137332,G__137333));
})();
if(cljs.core.truth_(temp__5804__auto__)){
var block = temp__5804__auto__;
var G__137334 = new cljs.core.Keyword("block","parent","block/parent",-918309064).cljs$core$IFn$_invoke$arity$1(block);
return (logseq.db.whiteboard_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.whiteboard_QMARK_.cljs$core$IFn$_invoke$arity$1(G__137334) : logseq.db.whiteboard_QMARK_.call(null,G__137334));
} else {
return null;
}
})());
}),remote_remove_ops);
});
frontend.worker.rtc.remote_update.apply_remote_remove_ops_helper = (function frontend$worker$rtc$remote_update$apply_remote_remove_ops_helper(conn,remove_ops){
var block_uuid__GT_entity = cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (op){
var temp__5804__auto__ = new cljs.core.Keyword(null,"block-uuid","block-uuid",-1558039638).cljs$core$IFn$_invoke$arity$1(op);
if(cljs.core.truth_(temp__5804__auto__)){
var block_uuid = temp__5804__auto__;
var temp__5804__auto____$1 = (function (){var G__137335 = cljs.core.deref(conn);
var G__137336 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_uuid], null);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__137335,G__137336) : datascript.core.entity.call(null,G__137335,G__137336));
})();
if(cljs.core.truth_(temp__5804__auto____$1)){
var ent = temp__5804__auto____$1;
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [block_uuid,ent], null);
} else {
return null;
}
} else {
return null;
}
}),remove_ops));
var block_uuid_set = cljs.core.set(cljs.core.keys(block_uuid__GT_entity));
var block_uuids_need_move = cljs.core.set(cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (p__137337){
var vec__137338 = p__137337;
var _block_uuid = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__137338,(0),null);
var ent = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__137338,(1),null);
return clojure.set.difference.cljs$core$IFn$_invoke$arity$2(cljs.core.set(cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Keyword("block","_parent","block/_parent",-639389670).cljs$core$IFn$_invoke$arity$1(ent))),block_uuid_set);
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([block_uuid__GT_entity], 0)));
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"block-uuids-need-move","block-uuids-need-move",-1524226903),block_uuids_need_move,new cljs.core.Keyword(null,"block-uuids-to-remove","block-uuids-to-remove",-707332000),block_uuid_set], null);
});
frontend.worker.rtc.remote_update.apply_remote_remove_ops = (function frontend$worker$rtc$remote_update$apply_remote_remove_ops(repo,conn,date_formatter,remove_ops){
var map__137341 = frontend.worker.rtc.remote_update.group_remote_remove_ops_by_whiteboard_block(cljs.core.deref(conn),remove_ops);
var map__137341__$1 = cljs.core.__destructure_map(map__137341);
var whiteboard_block_ops = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__137341__$1,true);
var other_ops = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__137341__$1,false);
frontend.worker.rtc.remote_update.transact_db_BANG_.cljs$core$IFn$_invoke$arity$3(new cljs.core.Keyword(null,"delete-whiteboard-blocks","delete-whiteboard-blocks",-881390968),conn,cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"block-uuid","block-uuid",-1558039638),whiteboard_block_ops));

var map__137342 = frontend.worker.rtc.remote_update.apply_remote_remove_ops_helper(conn,other_ops);
var map__137342__$1 = cljs.core.__destructure_map(map__137342);
var block_uuids_need_move = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__137342__$1,new cljs.core.Keyword(null,"block-uuids-need-move","block-uuids-need-move",-1524226903));
var block_uuids_to_remove = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__137342__$1,new cljs.core.Keyword(null,"block-uuids-to-remove","block-uuids-to-remove",-707332000));
var seq__137343_137577 = cljs.core.seq(block_uuids_need_move);
var chunk__137344_137578 = null;
var count__137345_137579 = (0);
var i__137346_137580 = (0);
while(true){
if((i__137346_137580 < count__137345_137579)){
var block_uuid_137581 = chunk__137344_137578.cljs$core$IIndexed$_nth$arity$2(null,i__137346_137580);
var temp__5804__auto___137582 = (function (){var G__137359 = cljs.core.deref(conn);
var G__137360 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_uuid_137581], null);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__137359,G__137360) : datascript.core.entity.call(null,G__137359,G__137360));
})();
if(cljs.core.truth_(temp__5804__auto___137582)){
var b_137583 = temp__5804__auto___137582;
var temp__5804__auto___137584__$1 = (function (){var G__137361 = cljs.core.deref(conn);
var G__137362 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","page","block/page",822314108).cljs$core$IFn$_invoke$arity$1((function (){var G__137363 = cljs.core.deref(conn);
var G__137364 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_uuid_137581], null);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__137363,G__137364) : datascript.core.entity.call(null,G__137363,G__137364));
})()));
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__137361,G__137362) : datascript.core.entity.call(null,G__137361,G__137362));
})();
if(cljs.core.truth_(temp__5804__auto___137584__$1)){
var target_b_137585 = temp__5804__auto___137584__$1;
frontend.worker.rtc.remote_update.transact_db_BANG_.cljs$core$IFn$_invoke$arity$6(new cljs.core.Keyword(null,"move-blocks&persist-op","move-blocks&persist-op",2069517925),repo,conn,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [b_137583], null),target_b_137585,false);
} else {
}
} else {
}


var G__137586 = seq__137343_137577;
var G__137587 = chunk__137344_137578;
var G__137588 = count__137345_137579;
var G__137589 = (i__137346_137580 + (1));
seq__137343_137577 = G__137586;
chunk__137344_137578 = G__137587;
count__137345_137579 = G__137588;
i__137346_137580 = G__137589;
continue;
} else {
var temp__5804__auto___137590 = cljs.core.seq(seq__137343_137577);
if(temp__5804__auto___137590){
var seq__137343_137591__$1 = temp__5804__auto___137590;
if(cljs.core.chunked_seq_QMARK_(seq__137343_137591__$1)){
var c__5525__auto___137592 = cljs.core.chunk_first(seq__137343_137591__$1);
var G__137593 = cljs.core.chunk_rest(seq__137343_137591__$1);
var G__137594 = c__5525__auto___137592;
var G__137595 = cljs.core.count(c__5525__auto___137592);
var G__137596 = (0);
seq__137343_137577 = G__137593;
chunk__137344_137578 = G__137594;
count__137345_137579 = G__137595;
i__137346_137580 = G__137596;
continue;
} else {
var block_uuid_137597 = cljs.core.first(seq__137343_137591__$1);
var temp__5804__auto___137598__$1 = (function (){var G__137365 = cljs.core.deref(conn);
var G__137366 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_uuid_137597], null);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__137365,G__137366) : datascript.core.entity.call(null,G__137365,G__137366));
})();
if(cljs.core.truth_(temp__5804__auto___137598__$1)){
var b_137599 = temp__5804__auto___137598__$1;
var temp__5804__auto___137600__$2 = (function (){var G__137367 = cljs.core.deref(conn);
var G__137368 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","page","block/page",822314108).cljs$core$IFn$_invoke$arity$1((function (){var G__137369 = cljs.core.deref(conn);
var G__137370 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_uuid_137597], null);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__137369,G__137370) : datascript.core.entity.call(null,G__137369,G__137370));
})()));
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__137367,G__137368) : datascript.core.entity.call(null,G__137367,G__137368));
})();
if(cljs.core.truth_(temp__5804__auto___137600__$2)){
var target_b_137601 = temp__5804__auto___137600__$2;
frontend.worker.rtc.remote_update.transact_db_BANG_.cljs$core$IFn$_invoke$arity$6(new cljs.core.Keyword(null,"move-blocks&persist-op","move-blocks&persist-op",2069517925),repo,conn,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [b_137599], null),target_b_137601,false);
} else {
}
} else {
}


var G__137602 = cljs.core.next(seq__137343_137591__$1);
var G__137603 = null;
var G__137604 = (0);
var G__137605 = (0);
seq__137343_137577 = G__137602;
chunk__137344_137578 = G__137603;
count__137345_137579 = G__137604;
i__137346_137580 = G__137605;
continue;
}
} else {
}
}
break;
}

var seq__137371 = cljs.core.seq(block_uuids_to_remove);
var chunk__137372 = null;
var count__137373 = (0);
var i__137374 = (0);
while(true){
if((i__137374 < count__137373)){
var block_uuid = chunk__137372.cljs$core$IIndexed$_nth$arity$2(null,i__137374);
var temp__5804__auto___137606 = (function (){var G__137379 = cljs.core.deref(conn);
var G__137380 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_uuid], null);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__137379,G__137380) : datascript.core.entity.call(null,G__137379,G__137380));
})();
if(cljs.core.truth_(temp__5804__auto___137606)){
var b_137607 = temp__5804__auto___137606;
frontend.worker.rtc.remote_update.transact_db_BANG_.cljs$core$IFn$_invoke$arity$6(new cljs.core.Keyword(null,"delete-blocks","delete-blocks",-1868631596),repo,conn,date_formatter,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [b_137607], null),cljs.core.PersistentArrayMap.EMPTY);
} else {
}


var G__137608 = seq__137371;
var G__137609 = chunk__137372;
var G__137610 = count__137373;
var G__137611 = (i__137374 + (1));
seq__137371 = G__137608;
chunk__137372 = G__137609;
count__137373 = G__137610;
i__137374 = G__137611;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__137371);
if(temp__5804__auto__){
var seq__137371__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__137371__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__137371__$1);
var G__137612 = cljs.core.chunk_rest(seq__137371__$1);
var G__137613 = c__5525__auto__;
var G__137614 = cljs.core.count(c__5525__auto__);
var G__137615 = (0);
seq__137371 = G__137612;
chunk__137372 = G__137613;
count__137373 = G__137614;
i__137374 = G__137615;
continue;
} else {
var block_uuid = cljs.core.first(seq__137371__$1);
var temp__5804__auto___137616__$1 = (function (){var G__137381 = cljs.core.deref(conn);
var G__137382 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_uuid], null);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__137381,G__137382) : datascript.core.entity.call(null,G__137381,G__137382));
})();
if(cljs.core.truth_(temp__5804__auto___137616__$1)){
var b_137617 = temp__5804__auto___137616__$1;
frontend.worker.rtc.remote_update.transact_db_BANG_.cljs$core$IFn$_invoke$arity$6(new cljs.core.Keyword(null,"delete-blocks","delete-blocks",-1868631596),repo,conn,date_formatter,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [b_137617], null),cljs.core.PersistentArrayMap.EMPTY);
} else {
}


var G__137618 = cljs.core.next(seq__137371__$1);
var G__137619 = null;
var G__137620 = (0);
var G__137621 = (0);
seq__137371 = G__137618;
chunk__137372 = G__137619;
count__137373 = G__137620;
i__137374 = G__137621;
continue;
}
} else {
return null;
}
}
break;
}
});
frontend.worker.rtc.remote_update.insert_or_move_block = (function frontend$worker$rtc$remote_update$insert_or_move_block(repo,conn,block_uuid,remote_parents,remote_block_order,move_QMARK_,op_value){
if(cljs.core.seq(remote_parents)){
var first_remote_parent = cljs.core.first(remote_parents);
var local_parent = (function (){var G__137383 = cljs.core.deref(conn);
var G__137384 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),first_remote_parent], null);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__137383,G__137384) : datascript.core.entity.call(null,G__137383,G__137384));
})();
var whiteboard_page_block_QMARK_ = (logseq.db.whiteboard_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.whiteboard_QMARK_.cljs$core$IFn$_invoke$arity$1(local_parent) : logseq.db.whiteboard_QMARK_.call(null,local_parent));
var b = (function (){var G__137385 = cljs.core.deref(conn);
var G__137386 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_uuid], null);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__137385,G__137386) : datascript.core.entity.call(null,G__137385,G__137386));
})();
var G__137387 = new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [whiteboard_page_block_QMARK_,(!((local_parent == null))),(!((remote_block_order == null)))], null);
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [false,true,true], null),G__137387)){
if(cljs.core.truth_(move_QMARK_)){
frontend.worker.rtc.remote_update.transact_db_BANG_.cljs$core$IFn$_invoke$arity$6(new cljs.core.Keyword(null,"move-blocks","move-blocks",-955702999),repo,conn,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [b], null),local_parent,false);
} else {
frontend.worker.rtc.remote_update.transact_db_BANG_.cljs$core$IFn$_invoke$arity$6(new cljs.core.Keyword(null,"insert-blocks","insert-blocks",-1269782013),repo,conn,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_uuid,new cljs.core.Keyword("block","title","block/title",710445684),""], null)], null),local_parent,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"sibling?","sibling?",-1086129060),false,new cljs.core.Keyword(null,"keep-uuid?","keep-uuid?",528472028),true], null));
}

return frontend.worker.rtc.remote_update.transact_db_BANG_.cljs$core$IFn$_invoke$arity$6(new cljs.core.Keyword(null,"update-block-order-directly","update-block-order-directly",-912768900),repo,conn,block_uuid,first_remote_parent,remote_block_order);
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [false,true,false], null),G__137387)){
if(cljs.core.truth_(move_QMARK_)){
return frontend.worker.rtc.remote_update.transact_db_BANG_.cljs$core$IFn$_invoke$arity$6(new cljs.core.Keyword(null,"move-blocks","move-blocks",-955702999),repo,conn,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [b], null),local_parent,false);
} else {
return frontend.worker.rtc.remote_update.transact_db_BANG_.cljs$core$IFn$_invoke$arity$3(new cljs.core.Keyword(null,"insert-no-order-blocks","insert-no-order-blocks",-576698292),conn,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [block_uuid,first_remote_parent], null)], null));
}
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [true,false,false], null),G__137387)){
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2("Not implemented yet for whiteboard",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"op-value","op-value",-67314035),op_value], null));
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [true,false,true], null),G__137387)){
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2("Not implemented yet for whiteboard",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"op-value","op-value",-67314035),op_value], null));
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [true,true,false], null),G__137387)){
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2("Not implemented yet for whiteboard",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"op-value","op-value",-67314035),op_value], null));
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [true,true,true], null),G__137387)){
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2("Not implemented yet for whiteboard",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"op-value","op-value",-67314035),op_value], null));
} else {
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2("Don't know where to insert",new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"block-uuid","block-uuid",-1558039638),block_uuid,new cljs.core.Keyword(null,"remote-parents","remote-parents",1298599492),remote_parents,new cljs.core.Keyword(null,"remote-block-order","remote-block-order",-1244896178),remote_block_order,new cljs.core.Keyword(null,"op-value","op-value",-67314035),op_value], null));

}
}
}
}
}
}
} else {
return null;
}
});
frontend.worker.rtc.remote_update.move_ops_map__GT_sorted_move_ops = (function frontend$worker$rtc$remote_update$move_ops_map__GT_sorted_move_ops(move_ops_map){
var uuid__GT_dep_uuids = cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p__137388){
var vec__137389 = p__137388;
var uuid = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__137389,(0),null);
var env = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__137389,(1),null);
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [uuid,cljs.core.set(cljs.core.conj.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"parents","parents",-2027538891).cljs$core$IFn$_invoke$arity$1(env)))], null);
}),move_ops_map));
var all_uuids = cljs.core.set(cljs.core.keys(move_ops_map));
var sorted_uuids = (function (){var r = cljs.core.PersistentVector.EMPTY;
var rest_uuids = all_uuids;
var uuid = cljs.core.first(rest_uuids);
while(true){
if(cljs.core.not(uuid)){
return r;
} else {
var dep_uuids = (uuid__GT_dep_uuids.cljs$core$IFn$_invoke$arity$1 ? uuid__GT_dep_uuids.cljs$core$IFn$_invoke$arity$1(uuid) : uuid__GT_dep_uuids.call(null,uuid));
var temp__5802__auto__ = cljs.core.first(clojure.set.intersection.cljs$core$IFn$_invoke$arity$2(dep_uuids,rest_uuids));
if(cljs.core.truth_(temp__5802__auto__)){
var next_uuid = temp__5802__auto__;
var G__137622 = r;
var G__137623 = rest_uuids;
var G__137624 = next_uuid;
r = G__137622;
rest_uuids = G__137623;
uuid = G__137624;
continue;
} else {
var rest_uuids_STAR_ = cljs.core.disj.cljs$core$IFn$_invoke$arity$2(rest_uuids,uuid);
var G__137625 = cljs.core.conj.cljs$core$IFn$_invoke$arity$2(r,uuid);
var G__137626 = rest_uuids_STAR_;
var G__137627 = cljs.core.first(rest_uuids_STAR_);
r = G__137625;
rest_uuids = G__137626;
uuid = G__137627;
continue;
}
}
break;
}
})();
return cljs.core.mapv.cljs$core$IFn$_invoke$arity$2(move_ops_map,sorted_uuids);
});
frontend.worker.rtc.remote_update.apply_remote_remove_page_ops = (function frontend$worker$rtc$remote_update$apply_remote_remove_page_ops(repo,conn,remove_page_ops){
var seq__137392 = cljs.core.seq(remove_page_ops);
var chunk__137393 = null;
var count__137394 = (0);
var i__137395 = (0);
while(true){
if((i__137395 < count__137394)){
var op = chunk__137393.cljs$core$IIndexed$_nth$arity$2(null,i__137395);
frontend.worker.handler.page.delete_BANG_.cljs$core$IFn$_invoke$arity$variadic(repo,conn,new cljs.core.Keyword(null,"block-uuid","block-uuid",-1558039638).cljs$core$IFn$_invoke$arity$1(op),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"persist-op?","persist-op?",-531287534),false], null)], 0));


var G__137628 = seq__137392;
var G__137629 = chunk__137393;
var G__137630 = count__137394;
var G__137631 = (i__137395 + (1));
seq__137392 = G__137628;
chunk__137393 = G__137629;
count__137394 = G__137630;
i__137395 = G__137631;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__137392);
if(temp__5804__auto__){
var seq__137392__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__137392__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__137392__$1);
var G__137632 = cljs.core.chunk_rest(seq__137392__$1);
var G__137633 = c__5525__auto__;
var G__137634 = cljs.core.count(c__5525__auto__);
var G__137635 = (0);
seq__137392 = G__137632;
chunk__137393 = G__137633;
count__137394 = G__137634;
i__137395 = G__137635;
continue;
} else {
var op = cljs.core.first(seq__137392__$1);
frontend.worker.handler.page.delete_BANG_.cljs$core$IFn$_invoke$arity$variadic(repo,conn,new cljs.core.Keyword(null,"block-uuid","block-uuid",-1558039638).cljs$core$IFn$_invoke$arity$1(op),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"persist-op?","persist-op?",-531287534),false], null)], 0));


var G__137636 = cljs.core.next(seq__137392__$1);
var G__137637 = null;
var G__137638 = (0);
var G__137639 = (0);
seq__137392 = G__137636;
chunk__137393 = G__137637;
count__137394 = G__137638;
i__137395 = G__137639;
continue;
}
} else {
return null;
}
}
break;
}
});
frontend.worker.rtc.remote_update.get_schema_ref_PLUS_cardinality = (function frontend$worker$rtc$remote_update$get_schema_ref_PLUS_cardinality(db_schema,attr){
var temp__5804__auto__ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(db_schema,attr);
if(cljs.core.truth_(temp__5804__auto__)){
var k_schema = temp__5804__auto__;
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db.type","ref","db.type/ref",-1728373079),new cljs.core.Keyword("db","valueType","db/valueType",1827971944).cljs$core$IFn$_invoke$arity$1(k_schema)),cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db.cardinality","many","db.cardinality/many",772806234),new cljs.core.Keyword("db","cardinality","db/cardinality",-104975659).cljs$core$IFn$_invoke$arity$1(k_schema))], null);
} else {
return null;
}
});
frontend.worker.rtc.remote_update.patch_remote_attr_map_by_local_av_coll = (function frontend$worker$rtc$remote_update$patch_remote_attr_map_by_local_av_coll(remote_attr_map,local_av_coll){
var a__GT_add__GT_v_set = cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (m,p__137396){
var vec__137397 = p__137396;
var a = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__137397,(0),null);
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__137397,(1),null);
var _t = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__137397,(2),null);
var add_QMARK_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__137397,(3),null);
var map__137400 = cljs.core.get.cljs$core$IFn$_invoke$arity$3(m,a,new cljs.core.PersistentArrayMap(null, 2, [true,cljs.core.PersistentHashSet.EMPTY,false,cljs.core.PersistentHashSet.EMPTY], null));
var map__137400__$1 = cljs.core.__destructure_map(map__137400);
var add_vset = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__137400__$1,true);
var retract_vset = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__137400__$1,false);
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(m,a,new cljs.core.PersistentArrayMap(null, 2, [true,(function (){var fexpr__137401 = (cljs.core.truth_(add_QMARK_)?cljs.core.conj:cljs.core.disj);
return (fexpr__137401.cljs$core$IFn$_invoke$arity$2 ? fexpr__137401.cljs$core$IFn$_invoke$arity$2(add_vset,v) : fexpr__137401.call(null,add_vset,v));
})(),false,(function (){var fexpr__137402 = (cljs.core.truth_(add_QMARK_)?cljs.core.disj:cljs.core.conj);
return (fexpr__137402.cljs$core$IFn$_invoke$arity$2 ? fexpr__137402.cljs$core$IFn$_invoke$arity$2(retract_vset,v) : fexpr__137402.call(null,retract_vset,v));
})()], null));
}),cljs.core.PersistentArrayMap.EMPTY,local_av_coll);
var updated_remote_attr_map1 = cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (p__137403){
var vec__137404 = p__137403;
var remote_a = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__137404,(0),null);
var remote_v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__137404,(1),null);
var temp__5804__auto__ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(a__GT_add__GT_v_set,remote_a);
if(cljs.core.truth_(temp__5804__auto__)){
var map__137407 = temp__5804__auto__;
var map__137407__$1 = cljs.core.__destructure_map(map__137407);
var add_vset = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__137407__$1,true);
var retract_vset = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__137407__$1,false);
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [remote_a,((cljs.core.coll_QMARK_(remote_v))?cljs.core.vec(clojure.set.difference.cljs$core$IFn$_invoke$arity$2(clojure.set.union.cljs$core$IFn$_invoke$arity$2(cljs.core.set(remote_v),add_vset),retract_vset)):((cljs.core.seq(add_vset))?cljs.core.first(add_vset):((cljs.core.contains_QMARK_(retract_vset,remote_v))?null:null)))], null);
} else {
return null;
}
}),remote_attr_map);
var updated_remote_attr_map2 = cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (p__137408){
var vec__137409 = p__137408;
var a = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__137409,(0),null);
var add__GT_v_set = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__137409,(1),null);
var temp__5804__auto__ = cljs.core.namespace(a);
if(cljs.core.truth_(temp__5804__auto__)){
var ns = temp__5804__auto__;
if((((!(cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 1, ["block",null], null), null),ns)))) && ((!(cljs.core.contains_QMARK_(remote_attr_map,a)))))){
var temp__5804__auto____$1 = cljs.core.not_empty(cljs.core.get.cljs$core$IFn$_invoke$arity$2(add__GT_v_set,true));
if(cljs.core.truth_(temp__5804__auto____$1)){
var v_set = temp__5804__auto____$1;
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [a,cljs.core.vec(v_set)], null);
} else {
return null;
}
} else {
return null;
}
} else {
return null;
}
}),a__GT_add__GT_v_set);
return cljs.core.into.cljs$core$IFn$_invoke$arity$2(remote_attr_map,cljs.core.concat.cljs$core$IFn$_invoke$arity$2(updated_remote_attr_map1,updated_remote_attr_map2));
});
/**
 * when remote-data request client to move/update/remove/... blocks,
 *   these updates maybe not needed or need to update, because this client just updated some of these blocks,
 *   so we need to update these remote-data by local-ops
 */
frontend.worker.rtc.remote_update.update_remote_data_by_local_unpushed_ops = (function frontend$worker$rtc$remote_update$update_remote_data_by_local_unpushed_ops(affected_blocks_map,local_unpushed_ops){
if(cljs.core.truth_((frontend.worker.rtc.client_op.ops_coercer.cljs$core$IFn$_invoke$arity$1 ? frontend.worker.rtc.client_op.ops_coercer.cljs$core$IFn$_invoke$arity$1(local_unpushed_ops) : frontend.worker.rtc.client_op.ops_coercer.call(null,local_unpushed_ops)))){
} else {
throw (new Error(["Assert failed: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(local_unpushed_ops),"\n","(client-op/ops-coercer local-unpushed-ops)"].join('')));
}

return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (affected_blocks_map__$1,local_op){
var local_op_value = cljs.core.last(local_op);
var G__137412 = cljs.core.first(local_op);
var G__137412__$1 = (((G__137412 instanceof cljs.core.Keyword))?G__137412.fqn:null);
switch (G__137412__$1) {
case "move":
var block_uuid = new cljs.core.Keyword(null,"block-uuid","block-uuid",-1558039638).cljs$core$IFn$_invoke$arity$1(local_op_value);
var remote_op = cljs.core.get.cljs$core$IFn$_invoke$arity$2(affected_blocks_map__$1,block_uuid);
var G__137413 = new cljs.core.Keyword(null,"op","op",-1882987955).cljs$core$IFn$_invoke$arity$1(remote_op);
var G__137413__$1 = (((G__137413 instanceof cljs.core.Keyword))?G__137413.fqn:null);
switch (G__137413__$1) {
case "remove":
return cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(affected_blocks_map__$1,new cljs.core.Keyword(null,"block-uuid","block-uuid",-1558039638).cljs$core$IFn$_invoke$arity$1(remote_op));

break;
case "move":
return cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(affected_blocks_map__$1,new cljs.core.Keyword(null,"self","self",-1547428899).cljs$core$IFn$_invoke$arity$1(remote_op));

break;
case "update-attrs":
case "move+update-attrs":
return cljs.core.update.cljs$core$IFn$_invoke$arity$5(affected_blocks_map__$1,new cljs.core.Keyword(null,"self","self",-1547428899).cljs$core$IFn$_invoke$arity$1(remote_op),cljs.core.dissoc,new cljs.core.Keyword("block","order","block/order",-1429282437),new cljs.core.Keyword(null,"parents","parents",-2027538891));

break;
default:
return affected_blocks_map__$1;

}

break;
case "update":
var block_uuid = new cljs.core.Keyword(null,"block-uuid","block-uuid",-1558039638).cljs$core$IFn$_invoke$arity$1(local_op_value);
var temp__5802__auto__ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(affected_blocks_map__$1,block_uuid);
if(cljs.core.truth_(temp__5802__auto__)){
var remote_op = temp__5802__auto__;
var remote_op_STAR_ = (cljs.core.truth_((function (){var G__137415 = new cljs.core.Keyword(null,"op","op",-1882987955).cljs$core$IFn$_invoke$arity$1(remote_op);
var fexpr__137414 = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"move","move",-2110884309),null,new cljs.core.Keyword(null,"update-attrs","update-attrs",1528055735),null,new cljs.core.Keyword(null,"move+update-attrs","move+update-attrs",-1039623395),null], null), null);
return (fexpr__137414.cljs$core$IFn$_invoke$arity$1 ? fexpr__137414.cljs$core$IFn$_invoke$arity$1(G__137415) : fexpr__137414.call(null,G__137415));
})())?frontend.worker.rtc.remote_update.patch_remote_attr_map_by_local_av_coll(remote_op,new cljs.core.Keyword(null,"av-coll","av-coll",1589194401).cljs$core$IFn$_invoke$arity$1(local_op_value)):remote_op);
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(affected_blocks_map__$1,block_uuid,remote_op_STAR_);
} else {
return affected_blocks_map__$1;
}

break;
case "remove":
var block_uuid = new cljs.core.Keyword(null,"block-uuid","block-uuid",-1558039638).cljs$core$IFn$_invoke$arity$1(local_op_value);
return cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(affected_blocks_map__$1,block_uuid);

break;
default:
return affected_blocks_map__$1;

}
}),affected_blocks_map,local_unpushed_ops);
});
frontend.worker.rtc.remote_update.affected_blocks__GT_diff_type_ops = (function frontend$worker$rtc$remote_update$affected_blocks__GT_diff_type_ops(repo,affected_blocks){
var unpushed_block_ops = frontend.worker.rtc.client_op.get_all_block_ops(repo);
var affected_blocks_map_STAR_ = (cljs.core.truth_(unpushed_block_ops)?frontend.worker.rtc.remote_update.update_remote_data_by_local_unpushed_ops(affected_blocks,unpushed_block_ops):affected_blocks);
var map__137416 = cljs.core.update_vals(cljs.core.group_by((function (p__137417){
var vec__137418 = p__137417;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__137418,(0),null);
var env = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__137418,(1),null);
return cljs.core.get.cljs$core$IFn$_invoke$arity$2(env,new cljs.core.Keyword(null,"op","op",-1882987955));
}),affected_blocks_map_STAR_),cljs.core.partial.cljs$core$IFn$_invoke$arity$2(cljs.core.into,cljs.core.PersistentArrayMap.EMPTY));
var map__137416__$1 = cljs.core.__destructure_map(map__137416);
var remove_ops_map = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__137416__$1,new cljs.core.Keyword(null,"remove","remove",-131428414));
var move_ops_map = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__137416__$1,new cljs.core.Keyword(null,"move","move",-2110884309));
var update_ops_map = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__137416__$1,new cljs.core.Keyword(null,"update-attrs","update-attrs",1528055735));
var move_PLUS_update_ops_map = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__137416__$1,new cljs.core.Keyword(null,"move+update-attrs","move+update-attrs",-1039623395));
var update_page_ops_map = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__137416__$1,new cljs.core.Keyword(null,"update-page","update-page",-503479891));
var remove_page_ops_map = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__137416__$1,new cljs.core.Keyword(null,"remove-page","remove-page",-1679345876));
return new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"remove-ops-map","remove-ops-map",-223802527),remove_ops_map,new cljs.core.Keyword(null,"move-ops-map","move-ops-map",827650136),cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([move_ops_map,move_PLUS_update_ops_map], 0)),new cljs.core.Keyword(null,"update-ops-map","update-ops-map",1929446072),cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([update_ops_map,move_PLUS_update_ops_map], 0)),new cljs.core.Keyword(null,"update-page-ops-map","update-page-ops-map",-705251299),update_page_ops_map,new cljs.core.Keyword(null,"remove-page-ops-map","remove-page-ops-map",673661601),remove_page_ops_map], null);
});
/**
 * NOTE: some blocks don't have :block/order (e.g. whiteboard blocks)
 */
frontend.worker.rtc.remote_update.check_block_pos = (function frontend$worker$rtc$remote_update$check_block_pos(db,block_uuid,remote_parents,remote_block_order){
var local_b = (function (){var G__137421 = db;
var G__137422 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_uuid], null);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__137421,G__137422) : datascript.core.entity.call(null,G__137421,G__137422));
})();
var remote_parent_uuid = cljs.core.first(remote_parents);
if((local_b == null)){
return new cljs.core.Keyword(null,"not-exist","not-exist",-1832922632);
} else {
if(cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [remote_block_order,remote_parent_uuid], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","order","block/order",-1429282437).cljs$core$IFn$_invoke$arity$1(local_b),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","parent","block/parent",-918309064).cljs$core$IFn$_invoke$arity$1(local_b))], null))){
return new cljs.core.Keyword(null,"wrong-pos","wrong-pos",-1024799173);
} else {
return null;

}
}
});
frontend.worker.rtc.remote_update.upsert_whiteboard_block = (function frontend$worker$rtc$remote_update$upsert_whiteboard_block(repo,conn,p__137423){
var map__137424 = p__137423;
var map__137424__$1 = cljs.core.__destructure_map(map__137424);
var _op_value = map__137424__$1;
var parents = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__137424__$1,new cljs.core.Keyword(null,"parents","parents",-2027538891));
var properties = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__137424__$1,new cljs.core.Keyword(null,"properties","properties",685819552));
var db = cljs.core.deref(conn);
var first_remote_parent = cljs.core.first(parents);
var temp__5804__auto__ = (function (){var G__137425 = db;
var G__137426 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),first_remote_parent], null);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__137425,G__137426) : datascript.core.entity.call(null,G__137425,G__137426));
})();
if(cljs.core.truth_(temp__5804__auto__)){
var local_parent = temp__5804__auto__;
var page_id = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(local_parent);
var properties_STAR_ = logseq.db.read_transit_str(properties);
var shape_property_id = logseq.db.common.property_util.get_pid(repo,new cljs.core.Keyword("logseq.property.tldraw","shape","logseq.property.tldraw/shape",-1313245420));
var shape = (function (){var and__5000__auto__ = cljs.core.map_QMARK_(properties_STAR_);
if(and__5000__auto__){
return cljs.core.get.cljs$core$IFn$_invoke$arity$2(properties_STAR_,shape_property_id);
} else {
return and__5000__auto__;
}
})();
if((!((page_id == null)))){
} else {
throw (new Error(["Assert failed: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(local_parent),"\n","(some? page-id)"].join('')));
}

if((!((shape == null)))){
} else {
throw (new Error(["Assert failed: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(properties_STAR_),"\n","(some? shape)"].join('')));
}

return frontend.worker.rtc.remote_update.transact_db_BANG_.cljs$core$IFn$_invoke$arity$3(new cljs.core.Keyword(null,"upsert-whiteboard-block","upsert-whiteboard-block",765052357),conn,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [logseq.graph_parser.whiteboard.shape__GT_block(repo,shape,page_id)], null));
} else {
return null;
}
});
frontend.worker.rtc.remote_update.update_op_watched_attrs = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 9, [new cljs.core.Keyword("logseq.property","value","logseq.property/value",1396524865),null,new cljs.core.Keyword("block","alias","block/alias",-2112644699),null,new cljs.core.Keyword("block","link","block/link",-1872399993),null,new cljs.core.Keyword("block","updated-at","block/updated-at",-1516550551),null,new cljs.core.Keyword("block","created-at","block/created-at",1440015),null,new cljs.core.Keyword("block","journal-day","block/journal-day",-145748366),null,new cljs.core.Keyword("block","tags","block/tags",1814948340),null,new cljs.core.Keyword("block","title","block/title",710445684),null,new cljs.core.Keyword("logseq.property","classes","logseq.property/classes",913750486),null], null), null);
frontend.worker.rtc.remote_update.watched_attr_ns = cljs.core.conj.cljs$core$IFn$_invoke$arity$2(logseq.db.frontend.property.logseq_property_namespaces,"logseq.class");
frontend.worker.rtc.remote_update.update_op_watched_attr_QMARK_ = (function frontend$worker$rtc$remote_update$update_op_watched_attr_QMARK_(attr){
var or__5002__auto__ = cljs.core.contains_QMARK_(frontend.worker.rtc.remote_update.update_op_watched_attrs,attr);
if(or__5002__auto__){
return or__5002__auto__;
} else {
var temp__5804__auto__ = cljs.core.namespace(attr);
if(cljs.core.truth_(temp__5804__auto__)){
var ns = temp__5804__auto__;
return ((cljs.core.contains_QMARK_(frontend.worker.rtc.remote_update.watched_attr_ns,ns)) || (((clojure.string.ends_with_QMARK_(ns,".property")) || (clojure.string.ends_with_QMARK_(ns,".class")))));
} else {
return null;
}
}
});
frontend.worker.rtc.remote_update.diff_block_kv__GT_tx_data = (function frontend$worker$rtc$remote_update$diff_block_kv__GT_tx_data(db,db_schema,e,k,local_v,remote_v){
var temp__5804__auto__ = frontend.worker.rtc.remote_update.get_schema_ref_PLUS_cardinality(db_schema,k);
if(cljs.core.truth_(temp__5804__auto__)){
var vec__137427 = temp__5804__auto__;
var ref_QMARK_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__137427,(0),null);
var card_many_QMARK_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__137427,(1),null);
var G__137430 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [ref_QMARK_,card_many_QMARK_], null);
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [true,true], null),G__137430)){
var vec__137431 = clojure.data.diff(cljs.core.set(local_v),cljs.core.set(remote_v));
var local_only = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__137431,(0),null);
var remote_only = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__137431,(1),null);
var G__137434 = cljs.core.PersistentVector.EMPTY;
var G__137434__$1 = ((cljs.core.seq(local_only))?cljs.core.concat.cljs$core$IFn$_invoke$arity$2(G__137434,cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (block_uuid){
return new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","retract","db/retract",-1549825231),e,k,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_uuid], null)], null);
}),local_only)):G__137434);
if(cljs.core.seq(remote_only)){
return cljs.core.concat.cljs$core$IFn$_invoke$arity$2(G__137434__$1,cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (block_uuid){
var temp__5804__auto____$1 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1((function (){var G__137435 = db;
var G__137436 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_uuid], null);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__137435,G__137436) : datascript.core.entity.call(null,G__137435,G__137436));
})());
if(cljs.core.truth_(temp__5804__auto____$1)){
var db_id = temp__5804__auto____$1;
return new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","add","db/add",235286841),e,k,db_id], null);
} else {
return null;
}
}),remote_only));
} else {
return G__137434__$1;
}
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [true,false], null),G__137430)){
var remote_block_uuid = ((cljs.core.coll_QMARK_(remote_v))?cljs.core.first(remote_v):remote_v);
if(cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(local_v,remote_block_uuid)){
if((remote_block_uuid == null)){
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","retract","db/retract",-1549825231),e,k], null)], null);
} else {
var temp__5804__auto____$1 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1((function (){var G__137437 = db;
var G__137438 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),remote_block_uuid], null);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__137437,G__137438) : datascript.core.entity.call(null,G__137437,G__137438));
})());
if(cljs.core.truth_(temp__5804__auto____$1)){
var db_id = temp__5804__auto____$1;
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","add","db/add",235286841),e,k,db_id], null)], null);
} else {
return null;
}
}
} else {
return null;
}
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [false,false], null),G__137430)){
var remote_v_STAR_ = ((cljs.core.coll_QMARK_(remote_v))?cljs.core.first(cljs.core.map.cljs$core$IFn$_invoke$arity$2(logseq.db.read_transit_str,remote_v)):logseq.db.read_transit_str(remote_v));
if(cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(local_v,remote_v_STAR_)){
if((remote_v_STAR_ == null)){
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","retract","db/retract",-1549825231),e,k], null)], null);
} else {
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","add","db/add",235286841),e,k,remote_v_STAR_], null)], null);
}
} else {
return null;
}
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [false,true], null),G__137430)){
var _ = (((((remote_v == null)) || (cljs.core.coll_QMARK_(remote_v))))?null:(function(){throw (new Error(["Assert failed: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"remote-v","remote-v",1633384261),remote_v,new cljs.core.Keyword(null,"a","a",-2123407586),k,new cljs.core.Keyword(null,"e","e",1381269198),e], null)),"\n","(or (nil? remote-v) (coll? remote-v))"].join('')))})());
var remote_v_STAR_ = cljs.core.set(cljs.core.map.cljs$core$IFn$_invoke$arity$2(logseq.db.read_transit_str,remote_v));
var vec__137440 = clojure.data.diff(cljs.core.set(local_v),remote_v_STAR_);
var local_only = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__137440,(0),null);
var remote_only = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__137440,(1),null);
var G__137443 = cljs.core.PersistentVector.EMPTY;
var G__137443__$1 = ((cljs.core.seq(local_only))?cljs.core.concat.cljs$core$IFn$_invoke$arity$2(G__137443,cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (v){
return new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","retract","db/retract",-1549825231),e,k,v], null);
}),local_only)):G__137443);
if(cljs.core.seq(remote_only)){
return cljs.core.concat.cljs$core$IFn$_invoke$arity$2(G__137443__$1,cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (v){
return new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","add","db/add",235286841),e,k,v], null);
}),remote_only));
} else {
return G__137443__$1;
}
} else {
throw (new Error(["No matching clause: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(G__137430)].join('')));

}
}
}
}
} else {
return null;
}
});
frontend.worker.rtc.remote_update.diff_block_map__GT_tx_data = (function frontend$worker$rtc$remote_update$diff_block_map__GT_tx_data(db,e,local_block_map,remote_block_map){
var db_schema = (datascript.core.schema.cljs$core$IFn$_invoke$arity$1 ? datascript.core.schema.cljs$core$IFn$_invoke$arity$1(db) : datascript.core.schema.call(null,db));
var tx_data1 = cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (p__137444){
var vec__137445 = p__137444;
var k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__137445,(0),null);
var local_v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__137445,(1),null);
var remote_v = cljs.core.get.cljs$core$IFn$_invoke$arity$2(remote_block_map,k);
return cljs.core.seq(frontend.worker.rtc.remote_update.diff_block_kv__GT_tx_data(db,db_schema,e,k,local_v,remote_v));
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([local_block_map], 0));
var tx_data2 = cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (p__137448){
var vec__137449 = p__137448;
var k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__137449,(0),null);
var remote_v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__137449,(1),null);
var local_v = cljs.core.get.cljs$core$IFn$_invoke$arity$2(local_block_map,k);
return cljs.core.seq(frontend.worker.rtc.remote_update.diff_block_kv__GT_tx_data(db,db_schema,e,k,local_v,remote_v));
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.apply.cljs$core$IFn$_invoke$arity$3(cljs.core.dissoc,remote_block_map,cljs.core.keys(local_block_map))], 0));
return cljs.core.concat.cljs$core$IFn$_invoke$arity$2(tx_data1,tx_data2);
});
/**
 * ignore-attr-set: don't update local attrs in this set
 */
frontend.worker.rtc.remote_update.remote_op_value__GT_tx_data = (function frontend$worker$rtc$remote_update$remote_op_value__GT_tx_data(db,ent,op_value,ignore_attr_set){
if((!((new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(ent) == null)))){
} else {
throw (new Error(["Assert failed: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(ent),"\n","(some? (:db/id ent))"].join('')));
}

var db_schema = (datascript.core.schema.cljs$core$IFn$_invoke$arity$1 ? datascript.core.schema.cljs$core$IFn$_invoke$arity$1(db) : datascript.core.schema.call(null,db));
var local_block_map = cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (p__137452){
var vec__137453 = p__137452;
var k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__137453,(0),null);
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__137453,(1),null);
var temp__5804__auto__ = frontend.worker.rtc.remote_update.get_schema_ref_PLUS_cardinality(db_schema,k);
if(cljs.core.truth_(temp__5804__auto__)){
var vec__137456 = temp__5804__auto__;
var ref_QMARK_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__137456,(0),null);
var card_many_QMARK_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__137456,(1),null);
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [k,(function (){var G__137459 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [ref_QMARK_,card_many_QMARK_], null);
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [true,true], null),G__137459)){
return cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (x){
var temp__5804__auto____$1 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(x);
if(cljs.core.truth_(temp__5804__auto____$1)){
var e = temp__5804__auto____$1;
return new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1((datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db,e) : datascript.core.entity.call(null,db,e)));
} else {
return null;
}
}),v);
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [true,false], null),G__137459)){
var v_STAR_ = (function (){var G__137460 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(v);
var G__137460__$1 = (((G__137460 == null))?null:(datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db,G__137460) : datascript.core.entity.call(null,db,G__137460)));
if((G__137460__$1 == null)){
return null;
} else {
return new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(G__137460__$1);
}
})();
if((!((v_STAR_ == null)))){
} else {
throw (new Error(["Assert failed: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(v),"\n","(some? v*)"].join('')));
}

return v_STAR_;
} else {
return v;

}
}
})()], null);
} else {
return null;
}
}),cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (p__137461){
var vec__137462 = p__137461;
var attr = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__137462,(0),null);
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__137462,(1),null);
var and__5000__auto__ = frontend.worker.rtc.remote_update.update_op_watched_attr_QMARK_(attr);
if(cljs.core.truth_(and__5000__auto__)){
return (!(cljs.core.contains_QMARK_(ignore_attr_set,attr)));
} else {
return and__5000__auto__;
}
}),ent)));
var remote_block_map = cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (p__137465){
var vec__137466 = p__137465;
var k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__137466,(0),null);
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__137466,(1),null);
var temp__5804__auto__ = frontend.worker.rtc.remote_update.get_schema_ref_PLUS_cardinality(db_schema,k);
if(cljs.core.truth_(temp__5804__auto__)){
var vec__137469 = temp__5804__auto__;
var _ref_QMARK_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__137469,(0),null);
var card_many_QMARK_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__137469,(1),null);
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [k,((((cljs.core.coll_QMARK_(v)) && (cljs.core.not(card_many_QMARK_))))?cljs.core.first(v):v)], null);
} else {
return null;
}
}),cljs.core.filter.cljs$core$IFn$_invoke$arity$2(cljs.core.comp.cljs$core$IFn$_invoke$arity$2(frontend.worker.rtc.remote_update.update_op_watched_attr_QMARK_,cljs.core.first),op_value)));
return frontend.worker.rtc.remote_update.diff_block_map__GT_tx_data(db,new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(ent),local_block_map,remote_block_map);
});
frontend.worker.rtc.remote_update.remote_op_value__GT_schema_tx_data = (function frontend$worker$rtc$remote_update$remote_op_value__GT_schema_tx_data(block_uuid,op_value){
var temp__5804__auto__ = (function (){var G__137472 = op_value;
var G__137472__$1 = (((G__137472 == null))?null:new cljs.core.Keyword("client","schema","client/schema",-238707506).cljs$core$IFn$_invoke$arity$1(G__137472));
if((G__137472__$1 == null)){
return null;
} else {
return logseq.db.read_transit_str(G__137472__$1);
}
})();
if(cljs.core.truth_(temp__5804__auto__)){
var schema_map = temp__5804__auto__;
var temp__5804__auto____$1 = new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(op_value);
if(cljs.core.truth_(temp__5804__auto____$1)){
var db_ident = temp__5804__auto____$1;
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_uuid,new cljs.core.Keyword("db","ident","db/ident",-737096),db_ident], null),schema_map], 0))], null);
} else {
return null;
}
} else {
return null;
}
});
frontend.worker.rtc.remote_update.update_block_order = (function frontend$worker$rtc$remote_update$update_block_order(e,op_value){
var temp__5802__auto__ = new cljs.core.Keyword("block","order","block/order",-1429282437).cljs$core$IFn$_invoke$arity$1(op_value);
if(cljs.core.truth_(temp__5802__auto__)){
var order = temp__5802__auto__;
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"op-value","op-value",-67314035),cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(op_value,new cljs.core.Keyword("block","order","block/order",-1429282437)),new cljs.core.Keyword(null,"tx-data","tx-data",934159761),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","add","db/add",235286841),e,new cljs.core.Keyword("block","order","block/order",-1429282437),order], null)], null)], null);
} else {
return new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"op-value","op-value",-67314035),op_value], null);
}
});
frontend.worker.rtc.remote_update.update_block_attrs = (function frontend$worker$rtc$remote_update$update_block_attrs(repo,conn,block_uuid,p__137473){
var map__137474 = p__137473;
var map__137474__$1 = cljs.core.__destructure_map(map__137474);
var op_value = map__137474__$1;
var parents = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__137474__$1,new cljs.core.Keyword(null,"parents","parents",-2027538891));
var temp__5804__auto__ = (function (){var G__137475 = cljs.core.deref(conn);
var G__137476 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_uuid], null);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__137475,G__137476) : datascript.core.entity.call(null,G__137475,G__137476));
})();
if(cljs.core.truth_(temp__5804__auto__)){
var ent = temp__5804__auto__;
if(cljs.core.truth_(cljs.core.some((function (k){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("block",cljs.core.namespace(k));
}),cljs.core.keys(op_value)))){
var map__137477 = frontend.worker.rtc.remote_update.update_block_order(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(ent),op_value);
var map__137477__$1 = cljs.core.__destructure_map(map__137477);
var update_block_order_tx_data = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__137477__$1,new cljs.core.Keyword(null,"tx-data","tx-data",934159761));
var op_value__$1 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__137477__$1,new cljs.core.Keyword(null,"op-value","op-value",-67314035));
var first_remote_parent = cljs.core.first(parents);
var local_parent = (function (){var G__137478 = cljs.core.deref(conn);
var G__137479 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),first_remote_parent], null);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__137478,G__137479) : datascript.core.entity.call(null,G__137478,G__137479));
})();
var whiteboard_page_block_QMARK_ = (logseq.db.whiteboard_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.whiteboard_QMARK_.cljs$core$IFn$_invoke$arity$1(local_parent) : logseq.db.whiteboard_QMARK_.call(null,local_parent));
if(cljs.core.truth_(whiteboard_page_block_QMARK_)){
return frontend.worker.rtc.remote_update.upsert_whiteboard_block(repo,conn,op_value__$1);
} else {
var temp__5804__auto___137642__$1 = frontend.worker.rtc.remote_update.remote_op_value__GT_schema_tx_data(block_uuid,op_value__$1);
if(cljs.core.truth_(temp__5804__auto___137642__$1)){
var schema_tx_data_137643 = temp__5804__auto___137642__$1;
logseq.db.transact_BANG_.cljs$core$IFn$_invoke$arity$3(conn,schema_tx_data_137643,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"persist-op?","persist-op?",-531287534),false,new cljs.core.Keyword(null,"gen-undo-ops?","gen-undo-ops?",324292975),false], null));
} else {
}

var temp__5804__auto____$1 = cljs.core.seq(frontend.worker.rtc.remote_update.remote_op_value__GT_tx_data(cljs.core.deref(conn),ent,cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(op_value__$1,new cljs.core.Keyword("client","schema","client/schema",-238707506)),frontend.worker.rtc.const$.ignore_attrs_when_syncing));
if(temp__5804__auto____$1){
var tx_data = temp__5804__auto____$1;
return logseq.db.transact_BANG_.cljs$core$IFn$_invoke$arity$3(conn,cljs.core.concat.cljs$core$IFn$_invoke$arity$2(tx_data,update_block_order_tx_data),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"persist-op?","persist-op?",-531287534),false,new cljs.core.Keyword(null,"gen-undo-ops?","gen-undo-ops?",324292975),false], null));
} else {
return null;
}
}
} else {
return null;
}
} else {
return null;
}
});
frontend.worker.rtc.remote_update.apply_remote_update_ops = (function frontend$worker$rtc$remote_update$apply_remote_update_ops(repo,conn,update_ops){
var seq__137480 = cljs.core.seq(update_ops);
var chunk__137481 = null;
var count__137482 = (0);
var i__137483 = (0);
while(true){
if((i__137483 < count__137482)){
var map__137488 = chunk__137481.cljs$core$IIndexed$_nth$arity$2(null,i__137483);
var map__137488__$1 = cljs.core.__destructure_map(map__137488);
var op_value = map__137488__$1;
var block_order = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__137488__$1,new cljs.core.Keyword("block","order","block/order",-1429282437));
var parents = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__137488__$1,new cljs.core.Keyword(null,"parents","parents",-2027538891));
var self = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__137488__$1,new cljs.core.Keyword(null,"self","self",-1547428899));
if(cljs.core.truth_((function (){var and__5000__auto__ = parents;
if(cljs.core.truth_(and__5000__auto__)){
return block_order;
} else {
return and__5000__auto__;
}
})())){
var r_137646 = frontend.worker.rtc.remote_update.check_block_pos(cljs.core.deref(conn),self,parents,block_order);
var G__137489_137647 = r_137646;
var G__137489_137648__$1 = (((G__137489_137647 instanceof cljs.core.Keyword))?G__137489_137647.fqn:null);
switch (G__137489_137648__$1) {
case "not-exist":
frontend.worker.rtc.remote_update.insert_or_move_block(repo,conn,self,parents,block_order,false,op_value);

break;
case "wrong-pos":
frontend.worker.rtc.remote_update.insert_or_move_block(repo,conn,self,parents,block_order,true,op_value);

break;
default:

}
} else {
}

frontend.worker.rtc.remote_update.update_block_attrs(repo,conn,self,op_value);


var G__137651 = seq__137480;
var G__137652 = chunk__137481;
var G__137653 = count__137482;
var G__137654 = (i__137483 + (1));
seq__137480 = G__137651;
chunk__137481 = G__137652;
count__137482 = G__137653;
i__137483 = G__137654;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__137480);
if(temp__5804__auto__){
var seq__137480__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__137480__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__137480__$1);
var G__137655 = cljs.core.chunk_rest(seq__137480__$1);
var G__137656 = c__5525__auto__;
var G__137657 = cljs.core.count(c__5525__auto__);
var G__137658 = (0);
seq__137480 = G__137655;
chunk__137481 = G__137656;
count__137482 = G__137657;
i__137483 = G__137658;
continue;
} else {
var map__137490 = cljs.core.first(seq__137480__$1);
var map__137490__$1 = cljs.core.__destructure_map(map__137490);
var op_value = map__137490__$1;
var block_order = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__137490__$1,new cljs.core.Keyword("block","order","block/order",-1429282437));
var parents = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__137490__$1,new cljs.core.Keyword(null,"parents","parents",-2027538891));
var self = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__137490__$1,new cljs.core.Keyword(null,"self","self",-1547428899));
if(cljs.core.truth_((function (){var and__5000__auto__ = parents;
if(cljs.core.truth_(and__5000__auto__)){
return block_order;
} else {
return and__5000__auto__;
}
})())){
var r_137659 = frontend.worker.rtc.remote_update.check_block_pos(cljs.core.deref(conn),self,parents,block_order);
var G__137491_137660 = r_137659;
var G__137491_137661__$1 = (((G__137491_137660 instanceof cljs.core.Keyword))?G__137491_137660.fqn:null);
switch (G__137491_137661__$1) {
case "not-exist":
frontend.worker.rtc.remote_update.insert_or_move_block(repo,conn,self,parents,block_order,false,op_value);

break;
case "wrong-pos":
frontend.worker.rtc.remote_update.insert_or_move_block(repo,conn,self,parents,block_order,true,op_value);

break;
default:

}
} else {
}

frontend.worker.rtc.remote_update.update_block_attrs(repo,conn,self,op_value);


var G__137663 = cljs.core.next(seq__137480__$1);
var G__137664 = null;
var G__137665 = (0);
var G__137666 = (0);
seq__137480 = G__137663;
chunk__137481 = G__137664;
count__137482 = G__137665;
i__137483 = G__137666;
continue;
}
} else {
return null;
}
}
break;
}
});
frontend.worker.rtc.remote_update.apply_remote_move_ops = (function frontend$worker$rtc$remote_update$apply_remote_move_ops(repo,conn,sorted_move_ops){
var seq__137492 = cljs.core.seq(sorted_move_ops);
var chunk__137493 = null;
var count__137494 = (0);
var i__137495 = (0);
while(true){
if((i__137495 < count__137494)){
var map__137500 = chunk__137493.cljs$core$IIndexed$_nth$arity$2(null,i__137495);
var map__137500__$1 = cljs.core.__destructure_map(map__137500);
var op_value = map__137500__$1;
var block_order = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__137500__$1,new cljs.core.Keyword("block","order","block/order",-1429282437));
var parents = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__137500__$1,new cljs.core.Keyword(null,"parents","parents",-2027538891));
var self = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__137500__$1,new cljs.core.Keyword(null,"self","self",-1547428899));
var r_137667 = frontend.worker.rtc.remote_update.check_block_pos(cljs.core.deref(conn),self,parents,block_order);
var G__137501_137668 = r_137667;
var G__137501_137669__$1 = (((G__137501_137668 instanceof cljs.core.Keyword))?G__137501_137668.fqn:null);
switch (G__137501_137669__$1) {
case "not-exist":
frontend.worker.rtc.remote_update.insert_or_move_block(repo,conn,self,parents,block_order,false,op_value);

frontend.worker.rtc.remote_update.update_block_attrs(repo,conn,self,op_value);

break;
case "wrong-pos":
frontend.worker.rtc.remote_update.insert_or_move_block(repo,conn,self,parents,block_order,true,op_value);

break;
default:

}


var G__137671 = seq__137492;
var G__137672 = chunk__137493;
var G__137673 = count__137494;
var G__137674 = (i__137495 + (1));
seq__137492 = G__137671;
chunk__137493 = G__137672;
count__137494 = G__137673;
i__137495 = G__137674;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__137492);
if(temp__5804__auto__){
var seq__137492__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__137492__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__137492__$1);
var G__137675 = cljs.core.chunk_rest(seq__137492__$1);
var G__137676 = c__5525__auto__;
var G__137677 = cljs.core.count(c__5525__auto__);
var G__137678 = (0);
seq__137492 = G__137675;
chunk__137493 = G__137676;
count__137494 = G__137677;
i__137495 = G__137678;
continue;
} else {
var map__137502 = cljs.core.first(seq__137492__$1);
var map__137502__$1 = cljs.core.__destructure_map(map__137502);
var op_value = map__137502__$1;
var block_order = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__137502__$1,new cljs.core.Keyword("block","order","block/order",-1429282437));
var parents = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__137502__$1,new cljs.core.Keyword(null,"parents","parents",-2027538891));
var self = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__137502__$1,new cljs.core.Keyword(null,"self","self",-1547428899));
var r_137679 = frontend.worker.rtc.remote_update.check_block_pos(cljs.core.deref(conn),self,parents,block_order);
var G__137503_137680 = r_137679;
var G__137503_137681__$1 = (((G__137503_137680 instanceof cljs.core.Keyword))?G__137503_137680.fqn:null);
switch (G__137503_137681__$1) {
case "not-exist":
frontend.worker.rtc.remote_update.insert_or_move_block(repo,conn,self,parents,block_order,false,op_value);

frontend.worker.rtc.remote_update.update_block_attrs(repo,conn,self,op_value);

break;
case "wrong-pos":
frontend.worker.rtc.remote_update.insert_or_move_block(repo,conn,self,parents,block_order,true,op_value);

break;
default:

}


var G__137683 = cljs.core.next(seq__137492__$1);
var G__137684 = null;
var G__137685 = (0);
var G__137686 = (0);
seq__137492 = G__137683;
chunk__137493 = G__137684;
count__137494 = G__137685;
i__137495 = G__137686;
continue;
}
} else {
return null;
}
}
break;
}
});
frontend.worker.rtc.remote_update.apply_remote_update_page_ops = (function frontend$worker$rtc$remote_update$apply_remote_update_page_ops(repo,conn,update_page_ops){
var config = frontend.worker.state.get_config(repo);
var seq__137504 = cljs.core.seq(update_page_ops);
var chunk__137505 = null;
var count__137506 = (0);
var i__137507 = (0);
while(true){
if((i__137507 < count__137506)){
var map__137516 = chunk__137505.cljs$core$IIndexed$_nth$arity$2(null,i__137507);
var map__137516__$1 = cljs.core.__destructure_map(map__137516);
var op_value = map__137516__$1;
var title = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__137516__$1,new cljs.core.Keyword("block","title","block/title",710445684));
var self = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__137516__$1,new cljs.core.Keyword(null,"self","self",-1547428899));
var _page_name = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__137516__$1,new cljs.core.Keyword(null,"_page-name","_page-name",1086354033));
var create_opts_137688 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"uuid","uuid",-2145095719),self], null);
var vec__137517_137689 = frontend.worker.handler.page.rtc_create_page_BANG_(conn,config,logseq.db.read_transit_str(title),create_opts_137688);
var __137690 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__137517_137689,(0),null);
var page_name_137691 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__137517_137689,(1),null);
var page_uuid_137692 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__137517_137689,(2),null);
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(page_uuid_137692,self)){
} else {
throw (new Error(["Assert failed: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"page-name","page-name",974981762),page_name_137691,new cljs.core.Keyword(null,"page-uuid","page-uuid",1152600915),page_uuid_137692,new cljs.core.Keyword(null,"should-be","should-be",1953553709),self], null)),"\n","(= page-uuid self)"].join('')));
}

frontend.worker.rtc.remote_update.update_block_attrs(repo,conn,self,op_value);


var G__137693 = seq__137504;
var G__137694 = chunk__137505;
var G__137695 = count__137506;
var G__137696 = (i__137507 + (1));
seq__137504 = G__137693;
chunk__137505 = G__137694;
count__137506 = G__137695;
i__137507 = G__137696;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__137504);
if(temp__5804__auto__){
var seq__137504__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__137504__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__137504__$1);
var G__137698 = cljs.core.chunk_rest(seq__137504__$1);
var G__137699 = c__5525__auto__;
var G__137700 = cljs.core.count(c__5525__auto__);
var G__137701 = (0);
seq__137504 = G__137698;
chunk__137505 = G__137699;
count__137506 = G__137700;
i__137507 = G__137701;
continue;
} else {
var map__137520 = cljs.core.first(seq__137504__$1);
var map__137520__$1 = cljs.core.__destructure_map(map__137520);
var op_value = map__137520__$1;
var title = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__137520__$1,new cljs.core.Keyword("block","title","block/title",710445684));
var self = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__137520__$1,new cljs.core.Keyword(null,"self","self",-1547428899));
var _page_name = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__137520__$1,new cljs.core.Keyword(null,"_page-name","_page-name",1086354033));
var create_opts_137702 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"uuid","uuid",-2145095719),self], null);
var vec__137521_137703 = frontend.worker.handler.page.rtc_create_page_BANG_(conn,config,logseq.db.read_transit_str(title),create_opts_137702);
var __137704 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__137521_137703,(0),null);
var page_name_137705 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__137521_137703,(1),null);
var page_uuid_137706 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__137521_137703,(2),null);
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(page_uuid_137706,self)){
} else {
throw (new Error(["Assert failed: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"page-name","page-name",974981762),page_name_137705,new cljs.core.Keyword(null,"page-uuid","page-uuid",1152600915),page_uuid_137706,new cljs.core.Keyword(null,"should-be","should-be",1953553709),self], null)),"\n","(= page-uuid self)"].join('')));
}

frontend.worker.rtc.remote_update.update_block_attrs(repo,conn,self,op_value);


var G__137710 = cljs.core.next(seq__137504__$1);
var G__137711 = null;
var G__137712 = (0);
var G__137713 = (0);
seq__137504 = G__137710;
chunk__137505 = G__137711;
count__137506 = G__137712;
i__137507 = G__137713;
continue;
}
} else {
return null;
}
}
break;
}
});
/**
 * Ensure refed-blocks from remote existing in client
 */
frontend.worker.rtc.remote_update.ensure_refed_blocks_exist = (function frontend$worker$rtc$remote_update$ensure_refed_blocks_exist(repo,conn,refed_blocks){
var sorted_refed_blocks = logseq.common.util.sort_coll_by_dependency(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Keyword("block","parent","block/parent",-918309064),refed_blocks);
var seq__137524 = cljs.core.seq(sorted_refed_blocks);
var chunk__137525 = null;
var count__137526 = (0);
var i__137527 = (0);
while(true){
if((i__137527 < count__137526)){
var refed_block = chunk__137525.cljs$core$IIndexed$_nth$arity$2(null,i__137527);
var ent_137715 = (function (){var G__137532 = cljs.core.deref(conn);
var G__137533 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(refed_block)], null);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__137532,G__137533) : datascript.core.entity.call(null,G__137532,G__137533));
})();
if(cljs.core.truth_(ent_137715)){
} else {
lambdaisland.glogi.log.cljs$core$IFn$_invoke$arity$4("frontend.worker.rtc.remote-update",new cljs.core.Keyword(null,"info","info",-317069002),cljs.core.identity(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"ensure-refed-blocks-exist","ensure-refed-blocks-exist",-2129444193),refed_block,new cljs.core.Keyword(null,"line","line",212345235),553], null)),null);

if(cljs.core.truth_(new cljs.core.Keyword("block","name","block/name",1619760316).cljs$core$IFn$_invoke$arity$1(refed_block))){
frontend.worker.rtc.remote_update.apply_remote_update_page_ops(repo,conn,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(refed_block,new cljs.core.Keyword(null,"self","self",-1547428899),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(refed_block)),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552))], null));
} else {
frontend.worker.rtc.remote_update.apply_remote_move_ops(repo,conn,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(refed_block,new cljs.core.Keyword(null,"self","self",-1547428899),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(refed_block),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"parents","parents",-2027538891),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","parent","block/parent",-918309064).cljs$core$IFn$_invoke$arity$1(refed_block)], null)], 0)),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552))], null));
}
}


var G__137717 = seq__137524;
var G__137718 = chunk__137525;
var G__137719 = count__137526;
var G__137720 = (i__137527 + (1));
seq__137524 = G__137717;
chunk__137525 = G__137718;
count__137526 = G__137719;
i__137527 = G__137720;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__137524);
if(temp__5804__auto__){
var seq__137524__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__137524__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__137524__$1);
var G__137721 = cljs.core.chunk_rest(seq__137524__$1);
var G__137722 = c__5525__auto__;
var G__137723 = cljs.core.count(c__5525__auto__);
var G__137724 = (0);
seq__137524 = G__137721;
chunk__137525 = G__137722;
count__137526 = G__137723;
i__137527 = G__137724;
continue;
} else {
var refed_block = cljs.core.first(seq__137524__$1);
var ent_137725 = (function (){var G__137534 = cljs.core.deref(conn);
var G__137535 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(refed_block)], null);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__137534,G__137535) : datascript.core.entity.call(null,G__137534,G__137535));
})();
if(cljs.core.truth_(ent_137725)){
} else {
lambdaisland.glogi.log.cljs$core$IFn$_invoke$arity$4("frontend.worker.rtc.remote-update",new cljs.core.Keyword(null,"info","info",-317069002),cljs.core.identity(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"ensure-refed-blocks-exist","ensure-refed-blocks-exist",-2129444193),refed_block,new cljs.core.Keyword(null,"line","line",212345235),553], null)),null);

if(cljs.core.truth_(new cljs.core.Keyword("block","name","block/name",1619760316).cljs$core$IFn$_invoke$arity$1(refed_block))){
frontend.worker.rtc.remote_update.apply_remote_update_page_ops(repo,conn,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(refed_block,new cljs.core.Keyword(null,"self","self",-1547428899),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(refed_block)),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552))], null));
} else {
frontend.worker.rtc.remote_update.apply_remote_move_ops(repo,conn,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(refed_block,new cljs.core.Keyword(null,"self","self",-1547428899),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(refed_block),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"parents","parents",-2027538891),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","parent","block/parent",-918309064).cljs$core$IFn$_invoke$arity$1(refed_block)], null)], 0)),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552))], null));
}
}


var G__137728 = cljs.core.next(seq__137524__$1);
var G__137729 = null;
var G__137730 = (0);
var G__137731 = (0);
seq__137524 = G__137728;
chunk__137525 = G__137729;
count__137526 = G__137730;
i__137527 = G__137731;
continue;
}
} else {
return null;
}
}
break;
}
});
/**
 * Apply remote-update(`remote-update-event`)
 */
frontend.worker.rtc.remote_update.apply_remote_update = (function frontend$worker$rtc$remote_update$apply_remote_update(graph_uuid,repo,conn,date_formatter,remote_update_event,add_log_fn){
var remote_update_data = new cljs.core.Keyword(null,"value","value",305978217).cljs$core$IFn$_invoke$arity$1(remote_update_event);
if(cljs.core.truth_((frontend.worker.rtc.malli_schema.data_from_ws_validator.cljs$core$IFn$_invoke$arity$1 ? frontend.worker.rtc.malli_schema.data_from_ws_validator.cljs$core$IFn$_invoke$arity$1(remote_update_data) : frontend.worker.rtc.malli_schema.data_from_ws_validator.call(null,remote_update_data)))){
} else {
throw (new Error(["Assert failed: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(remote_update_data),"\n","(rtc-schema/data-from-ws-validator remote-update-data)"].join('')));
}

var remote_t = new cljs.core.Keyword(null,"t","t",-1397832519).cljs$core$IFn$_invoke$arity$1(remote_update_data);
var remote_t_before = new cljs.core.Keyword(null,"t-before","t-before",-507640180).cljs$core$IFn$_invoke$arity$1(remote_update_data);
var local_tx = frontend.worker.rtc.client_op.get_local_tx(repo);
frontend.worker.rtc.log_and_state.update_remote_t(graph_uuid,remote_t);

if((!((((remote_t > (0))) && ((remote_t_before > (0))))))){
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2("invalid remote-data",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"data","data",-232669377),remote_update_data], null));
} else {
if((remote_t <= local_tx)){
var G__137536 = new cljs.core.Keyword("rtc.log","apply-remote-update","rtc.log/apply-remote-update",-1307545458);
var G__137537 = new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"sub-type","sub-type",-997954412),new cljs.core.Keyword(null,"skip","skip",602715391),new cljs.core.Keyword(null,"remote-t","remote-t",-1375604239),remote_t,new cljs.core.Keyword(null,"local-t","local-t",-2128577077),local_tx], null);
return (add_log_fn.cljs$core$IFn$_invoke$arity$2 ? add_log_fn.cljs$core$IFn$_invoke$arity$2(G__137536,G__137537) : add_log_fn.call(null,G__137536,G__137537));
} else {
if((local_tx < remote_t_before)){
var G__137538_137737 = new cljs.core.Keyword("rtc.log","apply-remote-update","rtc.log/apply-remote-update",-1307545458);
var G__137539_137738 = new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"sub-type","sub-type",-997954412),new cljs.core.Keyword(null,"need-pull-remote-data","need-pull-remote-data",-832637362),new cljs.core.Keyword(null,"remote-t","remote-t",-1375604239),remote_t,new cljs.core.Keyword(null,"local-t","local-t",-2128577077),local_tx,new cljs.core.Keyword(null,"remote-t-before","remote-t-before",-1778889484),remote_t_before], null);
(add_log_fn.cljs$core$IFn$_invoke$arity$2 ? add_log_fn.cljs$core$IFn$_invoke$arity$2(G__137538_137737,G__137539_137738) : add_log_fn.call(null,G__137538_137737,G__137539_137738));

throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2("need pull earlier remote-data",new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"type","type",1174270348),new cljs.core.Keyword("frontend.worker.rtc.remote-update","need-pull-remote-data","frontend.worker.rtc.remote-update/need-pull-remote-data",-1524072067),new cljs.core.Keyword(null,"local-tx","local-tx",1729212201),local_tx], null));
} else {
if((((remote_t_before <= local_tx)) && ((local_tx <= remote_t)))){
var map__137540 = remote_update_data;
var map__137540__$1 = cljs.core.__destructure_map(map__137540);
var affected_blocks_map = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__137540__$1,new cljs.core.Keyword(null,"affected-blocks","affected-blocks",1873706240));
var refed_blocks = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__137540__$1,new cljs.core.Keyword(null,"refed-blocks","refed-blocks",1894942062));
var map__137541 = frontend.worker.rtc.remote_update.affected_blocks__GT_diff_type_ops(repo,affected_blocks_map);
var map__137541__$1 = cljs.core.__destructure_map(map__137541);
var remove_ops_map = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__137541__$1,new cljs.core.Keyword(null,"remove-ops-map","remove-ops-map",-223802527));
var move_ops_map = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__137541__$1,new cljs.core.Keyword(null,"move-ops-map","move-ops-map",827650136));
var update_ops_map = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__137541__$1,new cljs.core.Keyword(null,"update-ops-map","update-ops-map",1929446072));
var update_page_ops_map = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__137541__$1,new cljs.core.Keyword(null,"update-page-ops-map","update-page-ops-map",-705251299));
var remove_page_ops_map = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__137541__$1,new cljs.core.Keyword(null,"remove-page-ops-map","remove-page-ops-map",673661601));
var remove_ops = cljs.core.vals(remove_ops_map);
var sorted_move_ops = frontend.worker.rtc.remote_update.move_ops_map__GT_sorted_move_ops(move_ops_map);
var update_ops = cljs.core.vals(update_ops_map);
var update_page_ops = cljs.core.vals(update_page_ops_map);
var remove_page_ops = cljs.core.vals(remove_page_ops_map);
var db_before = cljs.core.deref(conn);
console.groupCollapsed("rtc/apply-remote-ops-log");

if((!((logseq.outliner.batch_tx.get_batch_db_before() == null)))){
if(cljs.core.truth_(goog.DEBUG)){
var k__67652__auto___137744 = new cljs.core.Keyword(null,"ensure-refed-blocks-exist","ensure-refed-blocks-exist",-2129444193);
console.time(k__67652__auto___137744);

var res__67653__auto___137745 = frontend.worker.rtc.remote_update.ensure_refed_blocks_exist(repo,conn,refed_blocks);
console.timeEnd(k__67652__auto___137744);

} else {
frontend.worker.rtc.remote_update.ensure_refed_blocks_exist(repo,conn,refed_blocks);
}

if(cljs.core.truth_(goog.DEBUG)){
var k__67652__auto___137747 = new cljs.core.Keyword(null,"apply-remote-update-page-ops","apply-remote-update-page-ops",-1428664455);
console.time(k__67652__auto___137747);

var res__67653__auto___137748 = frontend.worker.rtc.remote_update.apply_remote_update_page_ops(repo,conn,update_page_ops);
console.timeEnd(k__67652__auto___137747);

} else {
frontend.worker.rtc.remote_update.apply_remote_update_page_ops(repo,conn,update_page_ops);
}

if(cljs.core.truth_(goog.DEBUG)){
var k__67652__auto___137749 = new cljs.core.Keyword(null,"apply-remote-move-ops","apply-remote-move-ops",1600501517);
console.time(k__67652__auto___137749);

var res__67653__auto___137750 = frontend.worker.rtc.remote_update.apply_remote_move_ops(repo,conn,sorted_move_ops);
console.timeEnd(k__67652__auto___137749);

} else {
frontend.worker.rtc.remote_update.apply_remote_move_ops(repo,conn,sorted_move_ops);
}

if(cljs.core.truth_(goog.DEBUG)){
var k__67652__auto___137751 = new cljs.core.Keyword(null,"apply-remote-update-ops","apply-remote-update-ops",-38907266);
console.time(k__67652__auto___137751);

var res__67653__auto___137754 = frontend.worker.rtc.remote_update.apply_remote_update_ops(repo,conn,update_ops);
console.timeEnd(k__67652__auto___137751);

} else {
frontend.worker.rtc.remote_update.apply_remote_update_ops(repo,conn,update_ops);
}

if(cljs.core.truth_(goog.DEBUG)){
var k__67652__auto___137755 = new cljs.core.Keyword(null,"apply-remote-remove-page-ops","apply-remote-remove-page-ops",-917701158);
console.time(k__67652__auto___137755);

var res__67653__auto___137759 = frontend.worker.rtc.remote_update.apply_remote_remove_page_ops(repo,conn,remove_page_ops);
console.timeEnd(k__67652__auto___137755);

} else {
frontend.worker.rtc.remote_update.apply_remote_remove_page_ops(repo,conn,remove_page_ops);
}
} else {
try{var tx_meta__62753__auto___137760 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(cljs.core.dissoc.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"rtc-tx?","rtc-tx?",-82304745),true,new cljs.core.Keyword(null,"persist-op?","persist-op?",-531287534),false,new cljs.core.Keyword(null,"gen-undo-ops?","gen-undo-ops?",324292975),false,new cljs.core.Keyword("frontend.worker.pipeline","skip-store-conn","frontend.worker.pipeline/skip-store-conn",-1426692178),frontend.worker.rtc.const$.RTC_E2E_TEST], null),new cljs.core.Keyword(null,"additional-tx","additional-tx",-343057604),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"transact-opts","transact-opts",187283396)], 0)),new cljs.core.Keyword("batch-tx","batch-tx-mode?","batch-tx/batch-tx-mode?",1787753099),true);
logseq.outliner.batch_tx.set_batch_opts(tx_meta__62753__auto___137760);

logseq.outliner.batch_tx.set_batch_db_before_BANG_(cljs.core.deref(conn));

if(cljs.core.truth_(goog.DEBUG)){
var k__67652__auto___137766 = new cljs.core.Keyword(null,"ensure-refed-blocks-exist","ensure-refed-blocks-exist",-2129444193);
console.time(k__67652__auto___137766);

var res__67653__auto___137767 = frontend.worker.rtc.remote_update.ensure_refed_blocks_exist(repo,conn,refed_blocks);
console.timeEnd(k__67652__auto___137766);

} else {
frontend.worker.rtc.remote_update.ensure_refed_blocks_exist(repo,conn,refed_blocks);
}

if(cljs.core.truth_(goog.DEBUG)){
var k__67652__auto___137768 = new cljs.core.Keyword(null,"apply-remote-update-page-ops","apply-remote-update-page-ops",-1428664455);
console.time(k__67652__auto___137768);

var res__67653__auto___137769 = frontend.worker.rtc.remote_update.apply_remote_update_page_ops(repo,conn,update_page_ops);
console.timeEnd(k__67652__auto___137768);

} else {
frontend.worker.rtc.remote_update.apply_remote_update_page_ops(repo,conn,update_page_ops);
}

if(cljs.core.truth_(goog.DEBUG)){
var k__67652__auto___137770 = new cljs.core.Keyword(null,"apply-remote-move-ops","apply-remote-move-ops",1600501517);
console.time(k__67652__auto___137770);

var res__67653__auto___137772 = frontend.worker.rtc.remote_update.apply_remote_move_ops(repo,conn,sorted_move_ops);
console.timeEnd(k__67652__auto___137770);

} else {
frontend.worker.rtc.remote_update.apply_remote_move_ops(repo,conn,sorted_move_ops);
}

if(cljs.core.truth_(goog.DEBUG)){
var k__67652__auto___137773 = new cljs.core.Keyword(null,"apply-remote-update-ops","apply-remote-update-ops",-38907266);
console.time(k__67652__auto___137773);

var res__67653__auto___137774 = frontend.worker.rtc.remote_update.apply_remote_update_ops(repo,conn,update_ops);
console.timeEnd(k__67652__auto___137773);

} else {
frontend.worker.rtc.remote_update.apply_remote_update_ops(repo,conn,update_ops);
}

if(cljs.core.truth_(goog.DEBUG)){
var k__67652__auto___137775 = new cljs.core.Keyword(null,"apply-remote-remove-page-ops","apply-remote-remove-page-ops",-917701158);
console.time(k__67652__auto___137775);

var res__67653__auto___137779 = frontend.worker.rtc.remote_update.apply_remote_remove_page_ops(repo,conn,remove_page_ops);
console.timeEnd(k__67652__auto___137775);

} else {
frontend.worker.rtc.remote_update.apply_remote_remove_page_ops(repo,conn,remove_page_ops);
}

if(cljs.core.seq(null)){
logseq.db.transact_BANG_.cljs$core$IFn$_invoke$arity$3(conn,null,cljs.core.PersistentArrayMap.EMPTY);
} else {
}

var G__137543_137780 = conn;
var G__137544_137781 = cljs.core.PersistentVector.EMPTY;
var G__137545_137782 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("batch-tx","exit?","batch-tx/exit?",-2021083148),true], null);
(datascript.core.transact_BANG_.cljs$core$IFn$_invoke$arity$3 ? datascript.core.transact_BANG_.cljs$core$IFn$_invoke$arity$3(G__137543_137780,G__137544_137781,G__137545_137782) : datascript.core.transact_BANG_.call(null,G__137543_137780,G__137544_137781,G__137545_137782));

logseq.outliner.batch_tx.exit_batch_txs_mode_BANG_();
}catch (e137542){var e__62754__auto___137784 = e137542;
logseq.outliner.batch_tx.exit_batch_txs_mode_BANG_();

throw e__62754__auto___137784;
}}

if(cljs.core.truth_(goog.DEBUG)){
var k__67652__auto___137785 = new cljs.core.Keyword(null,"apply-remote-remove-ops","apply-remote-remove-ops",-1032543236);
console.time(k__67652__auto___137785);

var res__67653__auto___137786 = frontend.worker.rtc.remote_update.apply_remote_remove_ops(repo,conn,date_formatter,remove_ops);
console.timeEnd(k__67652__auto___137785);

} else {
frontend.worker.rtc.remote_update.apply_remote_remove_ops(repo,conn,date_formatter,remove_ops);
}

frontend.worker.rtc.asset.emit_remote_asset_updates_from_block_ops(db_before,remove_ops);

console.groupEnd();

frontend.worker.rtc.client_op.update_local_tx(repo,remote_t);

return frontend.worker.rtc.log_and_state.update_local_t(graph_uuid,remote_t);
} else {
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2("unreachable",new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"remote-t","remote-t",-1375604239),remote_t,new cljs.core.Keyword(null,"remote-t-before","remote-t-before",-1778889484),remote_t_before,new cljs.core.Keyword(null,"local-t","local-t",-2128577077),local_tx], null));

}
}
}
}
});

//# sourceMappingURL=frontend.worker.rtc.remote_update.js.map
