goog.provide('frontend.worker.rtc.remote_update');
(new cljs.core.PersistentVector(null,2,(5),cljs.core.PersistentVector.EMPTY_NODE,[new cljs.core.Keyword("frontend.worker.rtc.remote-update","need-pull-remote-data","frontend.worker.rtc.remote-update/need-pull-remote-data",-1524072067),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"doc","doc",1913296891),"\nremote-update's :remote-t-before > :local-tx,\nso need to pull earlier remote-data from websocket."], null)],null));
if((typeof frontend !== 'undefined') && (typeof frontend.worker !== 'undefined') && (typeof frontend.worker.rtc !== 'undefined') && (typeof frontend.worker.rtc.remote_update !== 'undefined') && (typeof frontend.worker.rtc.remote_update.transact_db_BANG_ !== 'undefined')){
} else {
frontend.worker.rtc.remote_update.transact_db_BANG_ = (function (){var method_table__5599__auto__ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
var prefer_table__5600__auto__ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
var method_cache__5601__auto__ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
var cached_hierarchy__5602__auto__ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
var hierarchy__5603__auto__ = cljs.core.get.cljs$core$IFn$_invoke$arity$3(cljs.core.PersistentArrayMap.EMPTY,new cljs.core.Keyword(null,"hierarchy","hierarchy",-1053470341),(function (){var fexpr__187003 = cljs.core.get_global_hierarchy;
return (fexpr__187003.cljs$core$IFn$_invoke$arity$0 ? fexpr__187003.cljs$core$IFn$_invoke$arity$0() : fexpr__187003.call(null));
})());
return (new cljs.core.MultiFn(cljs.core.symbol.cljs$core$IFn$_invoke$arity$2("frontend.worker.rtc.remote-update","transact-db!"),(function() { 
var G__187270__delegate = function (action,_args){
return action;
};
var G__187270 = function (action,var_args){
var _args = null;
if (arguments.length > 1) {
var G__187271__i = 0, G__187271__a = new Array(arguments.length -  1);
while (G__187271__i < G__187271__a.length) {G__187271__a[G__187271__i] = arguments[G__187271__i + 1]; ++G__187271__i;}
  _args = new cljs.core.IndexedSeq(G__187271__a,0,null);
} 
return G__187270__delegate.call(this,action,_args);};
G__187270.cljs$lang$maxFixedArity = 1;
G__187270.cljs$lang$applyTo = (function (arglist__187272){
var action = cljs.core.first(arglist__187272);
var _args = cljs.core.rest(arglist__187272);
return G__187270__delegate(action,_args);
});
G__187270.cljs$core$IFn$_invoke$arity$variadic = G__187270__delegate;
return G__187270;
})()
,new cljs.core.Keyword(null,"default","default",-1987822328),hierarchy__5603__auto__,method_table__5599__auto__,prefer_table__5600__auto__,method_cache__5601__auto__,cached_hierarchy__5602__auto__));
})();
}
frontend.worker.rtc.remote_update.transact_db_BANG_.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"delete-blocks","delete-blocks",-1868631596),(function() { 
var G__187273__delegate = function (_,args){
var opts__41801__auto__ = cljs.core.dissoc.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"persist-op?","persist-op?",-531287534),false,new cljs.core.Keyword(null,"gen-undo-ops?","gen-undo-ops?",324292975),false,new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"delete-blocks","delete-blocks",-1868631596),new cljs.core.Keyword(null,"transact-opts","transact-opts",187283396),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"repo","repo",-1999060679),cljs.core.first(args),new cljs.core.Keyword(null,"conn","conn",278309663),cljs.core.second(args)], null)], null),new cljs.core.Keyword(null,"transact-opts","transact-opts",187283396),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"current-block","current-block",1027687970)], 0));
if((!((logseq.outliner.batch_tx.get_batch_db_before() == null)))){
return cljs.core.apply.cljs$core$IFn$_invoke$arity$2(logseq.outliner.core.delete_blocks_BANG_,args);
} else {
try{var tx_meta__41780__auto__ = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(cljs.core.dissoc.cljs$core$IFn$_invoke$arity$variadic(opts__41801__auto__,new cljs.core.Keyword(null,"additional-tx","additional-tx",-343057604),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"transact-opts","transact-opts",187283396)], 0)),new cljs.core.Keyword("batch-tx","batch-tx-mode?","batch-tx/batch-tx-mode?",1787753099),true);
logseq.outliner.batch_tx.set_batch_opts(tx_meta__41780__auto__);

logseq.outliner.batch_tx.set_batch_db_before_BANG_(cljs.core.deref(new cljs.core.Keyword(null,"conn","conn",278309663).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"transact-opts","transact-opts",187283396).cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"persist-op?","persist-op?",-531287534),false,new cljs.core.Keyword(null,"gen-undo-ops?","gen-undo-ops?",324292975),false,new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"delete-blocks","delete-blocks",-1868631596),new cljs.core.Keyword(null,"transact-opts","transact-opts",187283396),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"repo","repo",-1999060679),cljs.core.first(args),new cljs.core.Keyword(null,"conn","conn",278309663),cljs.core.second(args)], null)], null)))));

cljs.core.apply.cljs$core$IFn$_invoke$arity$2(logseq.outliner.core.delete_blocks_BANG_,args);

if(cljs.core.seq(null)){
logseq.db.transact_BANG_.cljs$core$IFn$_invoke$arity$3(new cljs.core.Keyword(null,"conn","conn",278309663).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"transact-opts","transact-opts",187283396).cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"persist-op?","persist-op?",-531287534),false,new cljs.core.Keyword(null,"gen-undo-ops?","gen-undo-ops?",324292975),false,new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"delete-blocks","delete-blocks",-1868631596),new cljs.core.Keyword(null,"transact-opts","transact-opts",187283396),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"repo","repo",-1999060679),cljs.core.first(args),new cljs.core.Keyword(null,"conn","conn",278309663),cljs.core.second(args)], null)], null))),null,cljs.core.PersistentArrayMap.EMPTY);
} else {
}

var G__187005_187274 = new cljs.core.Keyword(null,"conn","conn",278309663).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"transact-opts","transact-opts",187283396).cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"persist-op?","persist-op?",-531287534),false,new cljs.core.Keyword(null,"gen-undo-ops?","gen-undo-ops?",324292975),false,new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"delete-blocks","delete-blocks",-1868631596),new cljs.core.Keyword(null,"transact-opts","transact-opts",187283396),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"repo","repo",-1999060679),cljs.core.first(args),new cljs.core.Keyword(null,"conn","conn",278309663),cljs.core.second(args)], null)], null)));
var G__187006_187275 = cljs.core.PersistentVector.EMPTY;
var G__187007_187276 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("batch-tx","exit?","batch-tx/exit?",-2021083148),true], null);
(datascript.core.transact_BANG_.cljs$core$IFn$_invoke$arity$3 ? datascript.core.transact_BANG_.cljs$core$IFn$_invoke$arity$3(G__187005_187274,G__187006_187275,G__187007_187276) : datascript.core.transact_BANG_.call(null,G__187005_187274,G__187006_187275,G__187007_187276));

return logseq.outliner.batch_tx.exit_batch_txs_mode_BANG_();
}catch (e187004){var e__41781__auto__ = e187004;
logseq.outliner.batch_tx.exit_batch_txs_mode_BANG_();

throw e__41781__auto__;
}}
};
var G__187273 = function (_,var_args){
var args = null;
if (arguments.length > 1) {
var G__187277__i = 0, G__187277__a = new Array(arguments.length -  1);
while (G__187277__i < G__187277__a.length) {G__187277__a[G__187277__i] = arguments[G__187277__i + 1]; ++G__187277__i;}
  args = new cljs.core.IndexedSeq(G__187277__a,0,null);
} 
return G__187273__delegate.call(this,_,args);};
G__187273.cljs$lang$maxFixedArity = 1;
G__187273.cljs$lang$applyTo = (function (arglist__187278){
var _ = cljs.core.first(arglist__187278);
var args = cljs.core.rest(arglist__187278);
return G__187273__delegate(_,args);
});
G__187273.cljs$core$IFn$_invoke$arity$variadic = G__187273__delegate;
return G__187273;
})()
);
frontend.worker.rtc.remote_update.transact_db_BANG_.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"move-blocks","move-blocks",-955702999),(function() { 
var G__187279__delegate = function (_,args){
var opts__41801__auto__ = cljs.core.dissoc.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"persist-op?","persist-op?",-531287534),false,new cljs.core.Keyword(null,"gen-undo-ops?","gen-undo-ops?",324292975),false,new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"move-blocks","move-blocks",-955702999),new cljs.core.Keyword(null,"transact-opts","transact-opts",187283396),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"repo","repo",-1999060679),cljs.core.first(args),new cljs.core.Keyword(null,"conn","conn",278309663),cljs.core.second(args)], null)], null),new cljs.core.Keyword(null,"transact-opts","transact-opts",187283396),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"current-block","current-block",1027687970)], 0));
if((!((logseq.outliner.batch_tx.get_batch_db_before() == null)))){
return cljs.core.apply.cljs$core$IFn$_invoke$arity$2(logseq.outliner.core.move_blocks_BANG_,args);
} else {
try{var tx_meta__41780__auto__ = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(cljs.core.dissoc.cljs$core$IFn$_invoke$arity$variadic(opts__41801__auto__,new cljs.core.Keyword(null,"additional-tx","additional-tx",-343057604),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"transact-opts","transact-opts",187283396)], 0)),new cljs.core.Keyword("batch-tx","batch-tx-mode?","batch-tx/batch-tx-mode?",1787753099),true);
logseq.outliner.batch_tx.set_batch_opts(tx_meta__41780__auto__);

logseq.outliner.batch_tx.set_batch_db_before_BANG_(cljs.core.deref(new cljs.core.Keyword(null,"conn","conn",278309663).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"transact-opts","transact-opts",187283396).cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"persist-op?","persist-op?",-531287534),false,new cljs.core.Keyword(null,"gen-undo-ops?","gen-undo-ops?",324292975),false,new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"move-blocks","move-blocks",-955702999),new cljs.core.Keyword(null,"transact-opts","transact-opts",187283396),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"repo","repo",-1999060679),cljs.core.first(args),new cljs.core.Keyword(null,"conn","conn",278309663),cljs.core.second(args)], null)], null)))));

cljs.core.apply.cljs$core$IFn$_invoke$arity$2(logseq.outliner.core.move_blocks_BANG_,args);

if(cljs.core.seq(null)){
logseq.db.transact_BANG_.cljs$core$IFn$_invoke$arity$3(new cljs.core.Keyword(null,"conn","conn",278309663).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"transact-opts","transact-opts",187283396).cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"persist-op?","persist-op?",-531287534),false,new cljs.core.Keyword(null,"gen-undo-ops?","gen-undo-ops?",324292975),false,new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"move-blocks","move-blocks",-955702999),new cljs.core.Keyword(null,"transact-opts","transact-opts",187283396),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"repo","repo",-1999060679),cljs.core.first(args),new cljs.core.Keyword(null,"conn","conn",278309663),cljs.core.second(args)], null)], null))),null,cljs.core.PersistentArrayMap.EMPTY);
} else {
}

var G__187009_187280 = new cljs.core.Keyword(null,"conn","conn",278309663).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"transact-opts","transact-opts",187283396).cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"persist-op?","persist-op?",-531287534),false,new cljs.core.Keyword(null,"gen-undo-ops?","gen-undo-ops?",324292975),false,new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"move-blocks","move-blocks",-955702999),new cljs.core.Keyword(null,"transact-opts","transact-opts",187283396),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"repo","repo",-1999060679),cljs.core.first(args),new cljs.core.Keyword(null,"conn","conn",278309663),cljs.core.second(args)], null)], null)));
var G__187010_187281 = cljs.core.PersistentVector.EMPTY;
var G__187011_187282 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("batch-tx","exit?","batch-tx/exit?",-2021083148),true], null);
(datascript.core.transact_BANG_.cljs$core$IFn$_invoke$arity$3 ? datascript.core.transact_BANG_.cljs$core$IFn$_invoke$arity$3(G__187009_187280,G__187010_187281,G__187011_187282) : datascript.core.transact_BANG_.call(null,G__187009_187280,G__187010_187281,G__187011_187282));

return logseq.outliner.batch_tx.exit_batch_txs_mode_BANG_();
}catch (e187008){var e__41781__auto__ = e187008;
logseq.outliner.batch_tx.exit_batch_txs_mode_BANG_();

throw e__41781__auto__;
}}
};
var G__187279 = function (_,var_args){
var args = null;
if (arguments.length > 1) {
var G__187283__i = 0, G__187283__a = new Array(arguments.length -  1);
while (G__187283__i < G__187283__a.length) {G__187283__a[G__187283__i] = arguments[G__187283__i + 1]; ++G__187283__i;}
  args = new cljs.core.IndexedSeq(G__187283__a,0,null);
} 
return G__187279__delegate.call(this,_,args);};
G__187279.cljs$lang$maxFixedArity = 1;
G__187279.cljs$lang$applyTo = (function (arglist__187284){
var _ = cljs.core.first(arglist__187284);
var args = cljs.core.rest(arglist__187284);
return G__187279__delegate(_,args);
});
G__187279.cljs$core$IFn$_invoke$arity$variadic = G__187279__delegate;
return G__187279;
})()
);
frontend.worker.rtc.remote_update.transact_db_BANG_.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"update-block-order-directly","update-block-order-directly",-912768900),(function (_,_repo,conn,block_uuid,block_parent_uuid,block_order){
var parent_ent = (cljs.core.truth_(block_parent_uuid)?(function (){var G__187012 = cljs.core.deref(conn);
var G__187013 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_parent_uuid], null);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__187012,G__187013) : datascript.core.entity.call(null,G__187012,G__187013));
})():null);
var sorted_order_PLUS_block_uuid_coll = cljs.core.sort_by.cljs$core$IFn$_invoke$arity$2(cljs.core.first,cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.juxt.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","order","block/order",-1429282437),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552)),new cljs.core.Keyword("block","_parent","block/_parent",-639389670).cljs$core$IFn$_invoke$arity$1(parent_ent)));
var block_order_STAR_ = (function (){var temp__5802__auto__ = cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (p__187014,p__187015){
var vec__187016 = p__187014;
var start_order = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__187016,(0),null);
var vec__187019 = p__187015;
var current_order = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__187019,(0),null);
var current_block_uuid = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__187019,(1),null);
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
var vec__187022 = temp__5802__auto__;
var start_order = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__187022,(0),null);
var end_order = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__187022,(1),null);
return logseq.clj_fractional_indexing.generate_key_between(start_order,end_order);
} else {
return block_order;
}
})();
return logseq.db.transact_BANG_.cljs$core$IFn$_invoke$arity$2(conn,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_uuid,new cljs.core.Keyword("block","order","block/order",-1429282437),block_order_STAR_], null)], null));
}));
frontend.worker.rtc.remote_update.transact_db_BANG_.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"move-blocks&persist-op","move-blocks&persist-op",2069517925),(function() { 
var G__187285__delegate = function (_,args){
var opts__41801__auto__ = cljs.core.dissoc.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"persist-op?","persist-op?",-531287534),true,new cljs.core.Keyword(null,"gen-undo-ops?","gen-undo-ops?",324292975),false,new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"move-blocks","move-blocks",-955702999),new cljs.core.Keyword(null,"transact-opts","transact-opts",187283396),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"repo","repo",-1999060679),cljs.core.first(args),new cljs.core.Keyword(null,"conn","conn",278309663),cljs.core.second(args)], null)], null),new cljs.core.Keyword(null,"transact-opts","transact-opts",187283396),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"current-block","current-block",1027687970)], 0));
if((!((logseq.outliner.batch_tx.get_batch_db_before() == null)))){
return cljs.core.apply.cljs$core$IFn$_invoke$arity$2(logseq.outliner.core.move_blocks_BANG_,args);
} else {
try{var tx_meta__41780__auto__ = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(cljs.core.dissoc.cljs$core$IFn$_invoke$arity$variadic(opts__41801__auto__,new cljs.core.Keyword(null,"additional-tx","additional-tx",-343057604),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"transact-opts","transact-opts",187283396)], 0)),new cljs.core.Keyword("batch-tx","batch-tx-mode?","batch-tx/batch-tx-mode?",1787753099),true);
logseq.outliner.batch_tx.set_batch_opts(tx_meta__41780__auto__);

logseq.outliner.batch_tx.set_batch_db_before_BANG_(cljs.core.deref(new cljs.core.Keyword(null,"conn","conn",278309663).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"transact-opts","transact-opts",187283396).cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"persist-op?","persist-op?",-531287534),true,new cljs.core.Keyword(null,"gen-undo-ops?","gen-undo-ops?",324292975),false,new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"move-blocks","move-blocks",-955702999),new cljs.core.Keyword(null,"transact-opts","transact-opts",187283396),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"repo","repo",-1999060679),cljs.core.first(args),new cljs.core.Keyword(null,"conn","conn",278309663),cljs.core.second(args)], null)], null)))));

cljs.core.apply.cljs$core$IFn$_invoke$arity$2(logseq.outliner.core.move_blocks_BANG_,args);

if(cljs.core.seq(null)){
logseq.db.transact_BANG_.cljs$core$IFn$_invoke$arity$3(new cljs.core.Keyword(null,"conn","conn",278309663).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"transact-opts","transact-opts",187283396).cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"persist-op?","persist-op?",-531287534),true,new cljs.core.Keyword(null,"gen-undo-ops?","gen-undo-ops?",324292975),false,new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"move-blocks","move-blocks",-955702999),new cljs.core.Keyword(null,"transact-opts","transact-opts",187283396),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"repo","repo",-1999060679),cljs.core.first(args),new cljs.core.Keyword(null,"conn","conn",278309663),cljs.core.second(args)], null)], null))),null,cljs.core.PersistentArrayMap.EMPTY);
} else {
}

var G__187026_187286 = new cljs.core.Keyword(null,"conn","conn",278309663).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"transact-opts","transact-opts",187283396).cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"persist-op?","persist-op?",-531287534),true,new cljs.core.Keyword(null,"gen-undo-ops?","gen-undo-ops?",324292975),false,new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"move-blocks","move-blocks",-955702999),new cljs.core.Keyword(null,"transact-opts","transact-opts",187283396),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"repo","repo",-1999060679),cljs.core.first(args),new cljs.core.Keyword(null,"conn","conn",278309663),cljs.core.second(args)], null)], null)));
var G__187027_187287 = cljs.core.PersistentVector.EMPTY;
var G__187028_187288 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("batch-tx","exit?","batch-tx/exit?",-2021083148),true], null);
(datascript.core.transact_BANG_.cljs$core$IFn$_invoke$arity$3 ? datascript.core.transact_BANG_.cljs$core$IFn$_invoke$arity$3(G__187026_187286,G__187027_187287,G__187028_187288) : datascript.core.transact_BANG_.call(null,G__187026_187286,G__187027_187287,G__187028_187288));

return logseq.outliner.batch_tx.exit_batch_txs_mode_BANG_();
}catch (e187025){var e__41781__auto__ = e187025;
logseq.outliner.batch_tx.exit_batch_txs_mode_BANG_();

throw e__41781__auto__;
}}
};
var G__187285 = function (_,var_args){
var args = null;
if (arguments.length > 1) {
var G__187289__i = 0, G__187289__a = new Array(arguments.length -  1);
while (G__187289__i < G__187289__a.length) {G__187289__a[G__187289__i] = arguments[G__187289__i + 1]; ++G__187289__i;}
  args = new cljs.core.IndexedSeq(G__187289__a,0,null);
} 
return G__187285__delegate.call(this,_,args);};
G__187285.cljs$lang$maxFixedArity = 1;
G__187285.cljs$lang$applyTo = (function (arglist__187290){
var _ = cljs.core.first(arglist__187290);
var args = cljs.core.rest(arglist__187290);
return G__187285__delegate(_,args);
});
G__187285.cljs$core$IFn$_invoke$arity$variadic = G__187285__delegate;
return G__187285;
})()
);
frontend.worker.rtc.remote_update.transact_db_BANG_.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"insert-blocks","insert-blocks",-1269782013),(function (_,repo,conn,blocks,target,opts){
var opts__41801__auto__ = cljs.core.dissoc.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"persist-op?","persist-op?",-531287534),false,new cljs.core.Keyword(null,"gen-undo-ops?","gen-undo-ops?",324292975),false,new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"insert-blocks","insert-blocks",-1269782013),new cljs.core.Keyword(null,"transact-opts","transact-opts",187283396),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"repo","repo",-1999060679),repo,new cljs.core.Keyword(null,"conn","conn",278309663),conn], null)], null),new cljs.core.Keyword(null,"transact-opts","transact-opts",187283396),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"current-block","current-block",1027687970)], 0));
if((!((logseq.outliner.batch_tx.get_batch_db_before() == null)))){
var opts_SINGLEQUOTE_ = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(opts,new cljs.core.Keyword(null,"keep-block-order?","keep-block-order?",1077761724),true);
return logseq.outliner.core.insert_blocks_BANG_(repo,conn,blocks,target,opts_SINGLEQUOTE_);
} else {
try{var tx_meta__41780__auto__ = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(cljs.core.dissoc.cljs$core$IFn$_invoke$arity$variadic(opts__41801__auto__,new cljs.core.Keyword(null,"additional-tx","additional-tx",-343057604),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"transact-opts","transact-opts",187283396)], 0)),new cljs.core.Keyword("batch-tx","batch-tx-mode?","batch-tx/batch-tx-mode?",1787753099),true);
logseq.outliner.batch_tx.set_batch_opts(tx_meta__41780__auto__);

logseq.outliner.batch_tx.set_batch_db_before_BANG_(cljs.core.deref(new cljs.core.Keyword(null,"conn","conn",278309663).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"transact-opts","transact-opts",187283396).cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"persist-op?","persist-op?",-531287534),false,new cljs.core.Keyword(null,"gen-undo-ops?","gen-undo-ops?",324292975),false,new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"insert-blocks","insert-blocks",-1269782013),new cljs.core.Keyword(null,"transact-opts","transact-opts",187283396),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"repo","repo",-1999060679),repo,new cljs.core.Keyword(null,"conn","conn",278309663),conn], null)], null)))));

var opts_SINGLEQUOTE__187291 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(opts,new cljs.core.Keyword(null,"keep-block-order?","keep-block-order?",1077761724),true);
logseq.outliner.core.insert_blocks_BANG_(repo,conn,blocks,target,opts_SINGLEQUOTE__187291);

if(cljs.core.seq(null)){
logseq.db.transact_BANG_.cljs$core$IFn$_invoke$arity$3(new cljs.core.Keyword(null,"conn","conn",278309663).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"transact-opts","transact-opts",187283396).cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"persist-op?","persist-op?",-531287534),false,new cljs.core.Keyword(null,"gen-undo-ops?","gen-undo-ops?",324292975),false,new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"insert-blocks","insert-blocks",-1269782013),new cljs.core.Keyword(null,"transact-opts","transact-opts",187283396),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"repo","repo",-1999060679),repo,new cljs.core.Keyword(null,"conn","conn",278309663),conn], null)], null))),null,cljs.core.PersistentArrayMap.EMPTY);
} else {
}

var G__187030_187292 = new cljs.core.Keyword(null,"conn","conn",278309663).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"transact-opts","transact-opts",187283396).cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"persist-op?","persist-op?",-531287534),false,new cljs.core.Keyword(null,"gen-undo-ops?","gen-undo-ops?",324292975),false,new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"insert-blocks","insert-blocks",-1269782013),new cljs.core.Keyword(null,"transact-opts","transact-opts",187283396),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"repo","repo",-1999060679),repo,new cljs.core.Keyword(null,"conn","conn",278309663),conn], null)], null)));
var G__187031_187293 = cljs.core.PersistentVector.EMPTY;
var G__187032_187294 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("batch-tx","exit?","batch-tx/exit?",-2021083148),true], null);
(datascript.core.transact_BANG_.cljs$core$IFn$_invoke$arity$3 ? datascript.core.transact_BANG_.cljs$core$IFn$_invoke$arity$3(G__187030_187292,G__187031_187293,G__187032_187294) : datascript.core.transact_BANG_.call(null,G__187030_187292,G__187031_187293,G__187032_187294));

return logseq.outliner.batch_tx.exit_batch_txs_mode_BANG_();
}catch (e187029){var e__41781__auto__ = e187029;
logseq.outliner.batch_tx.exit_batch_txs_mode_BANG_();

throw e__41781__auto__;
}}
}));
frontend.worker.rtc.remote_update.transact_db_BANG_.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"insert-no-order-blocks","insert-no-order-blocks",-576698292),(function (_,conn,block_uuid_PLUS_parent_coll){
return logseq.db.transact_BANG_.cljs$core$IFn$_invoke$arity$3(conn,cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (p__187033){
var vec__187034 = p__187033;
var block_uuid = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__187034,(0),null);
var block_parent = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__187034,(1),null);
var G__187037 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_uuid], null);
if(cljs.core.truth_(block_parent)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__187037,new cljs.core.Keyword("block","parent","block/parent",-918309064),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_parent], null));
} else {
return G__187037;
}
}),block_uuid_PLUS_parent_coll),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"persist-op?","persist-op?",-531287534),false,new cljs.core.Keyword(null,"gen-undo-ops?","gen-undo-ops?",324292975),false], null));
}));
frontend.worker.rtc.remote_update.transact_db_BANG_.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"save-block","save-block",591532560),(function() { 
var G__187295__delegate = function (_,args){
var opts__41801__auto__ = cljs.core.dissoc.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"persist-op?","persist-op?",-531287534),false,new cljs.core.Keyword(null,"gen-undo-ops?","gen-undo-ops?",324292975),false,new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"save-block","save-block",591532560),new cljs.core.Keyword(null,"transact-opts","transact-opts",187283396),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"repo","repo",-1999060679),cljs.core.first(args),new cljs.core.Keyword(null,"conn","conn",278309663),cljs.core.second(args)], null)], null),new cljs.core.Keyword(null,"transact-opts","transact-opts",187283396),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"current-block","current-block",1027687970)], 0));
if((!((logseq.outliner.batch_tx.get_batch_db_before() == null)))){
return cljs.core.apply.cljs$core$IFn$_invoke$arity$2(logseq.outliner.core.save_block_BANG_,args);
} else {
try{var tx_meta__41780__auto__ = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(cljs.core.dissoc.cljs$core$IFn$_invoke$arity$variadic(opts__41801__auto__,new cljs.core.Keyword(null,"additional-tx","additional-tx",-343057604),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"transact-opts","transact-opts",187283396)], 0)),new cljs.core.Keyword("batch-tx","batch-tx-mode?","batch-tx/batch-tx-mode?",1787753099),true);
logseq.outliner.batch_tx.set_batch_opts(tx_meta__41780__auto__);

logseq.outliner.batch_tx.set_batch_db_before_BANG_(cljs.core.deref(new cljs.core.Keyword(null,"conn","conn",278309663).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"transact-opts","transact-opts",187283396).cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"persist-op?","persist-op?",-531287534),false,new cljs.core.Keyword(null,"gen-undo-ops?","gen-undo-ops?",324292975),false,new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"save-block","save-block",591532560),new cljs.core.Keyword(null,"transact-opts","transact-opts",187283396),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"repo","repo",-1999060679),cljs.core.first(args),new cljs.core.Keyword(null,"conn","conn",278309663),cljs.core.second(args)], null)], null)))));

cljs.core.apply.cljs$core$IFn$_invoke$arity$2(logseq.outliner.core.save_block_BANG_,args);

if(cljs.core.seq(null)){
logseq.db.transact_BANG_.cljs$core$IFn$_invoke$arity$3(new cljs.core.Keyword(null,"conn","conn",278309663).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"transact-opts","transact-opts",187283396).cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"persist-op?","persist-op?",-531287534),false,new cljs.core.Keyword(null,"gen-undo-ops?","gen-undo-ops?",324292975),false,new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"save-block","save-block",591532560),new cljs.core.Keyword(null,"transact-opts","transact-opts",187283396),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"repo","repo",-1999060679),cljs.core.first(args),new cljs.core.Keyword(null,"conn","conn",278309663),cljs.core.second(args)], null)], null))),null,cljs.core.PersistentArrayMap.EMPTY);
} else {
}

var G__187039_187297 = new cljs.core.Keyword(null,"conn","conn",278309663).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"transact-opts","transact-opts",187283396).cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"persist-op?","persist-op?",-531287534),false,new cljs.core.Keyword(null,"gen-undo-ops?","gen-undo-ops?",324292975),false,new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"save-block","save-block",591532560),new cljs.core.Keyword(null,"transact-opts","transact-opts",187283396),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"repo","repo",-1999060679),cljs.core.first(args),new cljs.core.Keyword(null,"conn","conn",278309663),cljs.core.second(args)], null)], null)));
var G__187040_187298 = cljs.core.PersistentVector.EMPTY;
var G__187041_187299 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("batch-tx","exit?","batch-tx/exit?",-2021083148),true], null);
(datascript.core.transact_BANG_.cljs$core$IFn$_invoke$arity$3 ? datascript.core.transact_BANG_.cljs$core$IFn$_invoke$arity$3(G__187039_187297,G__187040_187298,G__187041_187299) : datascript.core.transact_BANG_.call(null,G__187039_187297,G__187040_187298,G__187041_187299));

return logseq.outliner.batch_tx.exit_batch_txs_mode_BANG_();
}catch (e187038){var e__41781__auto__ = e187038;
logseq.outliner.batch_tx.exit_batch_txs_mode_BANG_();

throw e__41781__auto__;
}}
};
var G__187295 = function (_,var_args){
var args = null;
if (arguments.length > 1) {
var G__187300__i = 0, G__187300__a = new Array(arguments.length -  1);
while (G__187300__i < G__187300__a.length) {G__187300__a[G__187300__i] = arguments[G__187300__i + 1]; ++G__187300__i;}
  args = new cljs.core.IndexedSeq(G__187300__a,0,null);
} 
return G__187295__delegate.call(this,_,args);};
G__187295.cljs$lang$maxFixedArity = 1;
G__187295.cljs$lang$applyTo = (function (arglist__187301){
var _ = cljs.core.first(arglist__187301);
var args = cljs.core.rest(arglist__187301);
return G__187295__delegate(_,args);
});
G__187295.cljs$core$IFn$_invoke$arity$variadic = G__187295__delegate;
return G__187295;
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
return cljs.core.group_by((function (p__187042){
var map__187043 = p__187042;
var map__187043__$1 = cljs.core.__destructure_map(map__187043);
var block_uuid = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__187043__$1,new cljs.core.Keyword(null,"block-uuid","block-uuid",-1558039638));
return cljs.core.boolean$((function (){var temp__5804__auto__ = (function (){var G__187044 = db;
var G__187045 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_uuid], null);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__187044,G__187045) : datascript.core.entity.call(null,G__187044,G__187045));
})();
if(cljs.core.truth_(temp__5804__auto__)){
var block = temp__5804__auto__;
var G__187046 = new cljs.core.Keyword("block","parent","block/parent",-918309064).cljs$core$IFn$_invoke$arity$1(block);
return (logseq.db.whiteboard_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.whiteboard_QMARK_.cljs$core$IFn$_invoke$arity$1(G__187046) : logseq.db.whiteboard_QMARK_.call(null,G__187046));
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
var temp__5804__auto____$1 = (function (){var G__187047 = cljs.core.deref(conn);
var G__187048 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_uuid], null);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__187047,G__187048) : datascript.core.entity.call(null,G__187047,G__187048));
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
var block_uuids_need_move = cljs.core.set(cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (p__187049){
var vec__187050 = p__187049;
var _block_uuid = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__187050,(0),null);
var ent = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__187050,(1),null);
return clojure.set.difference.cljs$core$IFn$_invoke$arity$2(cljs.core.set(cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Keyword("block","_parent","block/_parent",-639389670).cljs$core$IFn$_invoke$arity$1(ent))),block_uuid_set);
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([block_uuid__GT_entity], 0)));
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"block-uuids-need-move","block-uuids-need-move",-1524226903),block_uuids_need_move,new cljs.core.Keyword(null,"block-uuids-to-remove","block-uuids-to-remove",-707332000),block_uuid_set], null);
});
frontend.worker.rtc.remote_update.apply_remote_remove_ops = (function frontend$worker$rtc$remote_update$apply_remote_remove_ops(repo,conn,date_formatter,remove_ops){
var map__187053 = frontend.worker.rtc.remote_update.group_remote_remove_ops_by_whiteboard_block(cljs.core.deref(conn),remove_ops);
var map__187053__$1 = cljs.core.__destructure_map(map__187053);
var whiteboard_block_ops = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__187053__$1,true);
var other_ops = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__187053__$1,false);
frontend.worker.rtc.remote_update.transact_db_BANG_.cljs$core$IFn$_invoke$arity$3(new cljs.core.Keyword(null,"delete-whiteboard-blocks","delete-whiteboard-blocks",-881390968),conn,cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"block-uuid","block-uuid",-1558039638),whiteboard_block_ops));

var map__187054 = frontend.worker.rtc.remote_update.apply_remote_remove_ops_helper(conn,other_ops);
var map__187054__$1 = cljs.core.__destructure_map(map__187054);
var block_uuids_need_move = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__187054__$1,new cljs.core.Keyword(null,"block-uuids-need-move","block-uuids-need-move",-1524226903));
var block_uuids_to_remove = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__187054__$1,new cljs.core.Keyword(null,"block-uuids-to-remove","block-uuids-to-remove",-707332000));
var seq__187055_187306 = cljs.core.seq(block_uuids_need_move);
var chunk__187056_187307 = null;
var count__187057_187308 = (0);
var i__187058_187309 = (0);
while(true){
if((i__187058_187309 < count__187057_187308)){
var block_uuid_187310 = chunk__187056_187307.cljs$core$IIndexed$_nth$arity$2(null,i__187058_187309);
var temp__5804__auto___187311 = (function (){var G__187071 = cljs.core.deref(conn);
var G__187072 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_uuid_187310], null);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__187071,G__187072) : datascript.core.entity.call(null,G__187071,G__187072));
})();
if(cljs.core.truth_(temp__5804__auto___187311)){
var b_187312 = temp__5804__auto___187311;
var temp__5804__auto___187313__$1 = (function (){var G__187073 = cljs.core.deref(conn);
var G__187074 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","page","block/page",822314108).cljs$core$IFn$_invoke$arity$1((function (){var G__187075 = cljs.core.deref(conn);
var G__187076 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_uuid_187310], null);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__187075,G__187076) : datascript.core.entity.call(null,G__187075,G__187076));
})()));
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__187073,G__187074) : datascript.core.entity.call(null,G__187073,G__187074));
})();
if(cljs.core.truth_(temp__5804__auto___187313__$1)){
var target_b_187314 = temp__5804__auto___187313__$1;
frontend.worker.rtc.remote_update.transact_db_BANG_.cljs$core$IFn$_invoke$arity$6(new cljs.core.Keyword(null,"move-blocks&persist-op","move-blocks&persist-op",2069517925),repo,conn,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [b_187312], null),target_b_187314,false);
} else {
}
} else {
}


var G__187315 = seq__187055_187306;
var G__187316 = chunk__187056_187307;
var G__187317 = count__187057_187308;
var G__187318 = (i__187058_187309 + (1));
seq__187055_187306 = G__187315;
chunk__187056_187307 = G__187316;
count__187057_187308 = G__187317;
i__187058_187309 = G__187318;
continue;
} else {
var temp__5804__auto___187319 = cljs.core.seq(seq__187055_187306);
if(temp__5804__auto___187319){
var seq__187055_187320__$1 = temp__5804__auto___187319;
if(cljs.core.chunked_seq_QMARK_(seq__187055_187320__$1)){
var c__5525__auto___187321 = cljs.core.chunk_first(seq__187055_187320__$1);
var G__187322 = cljs.core.chunk_rest(seq__187055_187320__$1);
var G__187323 = c__5525__auto___187321;
var G__187324 = cljs.core.count(c__5525__auto___187321);
var G__187325 = (0);
seq__187055_187306 = G__187322;
chunk__187056_187307 = G__187323;
count__187057_187308 = G__187324;
i__187058_187309 = G__187325;
continue;
} else {
var block_uuid_187326 = cljs.core.first(seq__187055_187320__$1);
var temp__5804__auto___187327__$1 = (function (){var G__187077 = cljs.core.deref(conn);
var G__187078 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_uuid_187326], null);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__187077,G__187078) : datascript.core.entity.call(null,G__187077,G__187078));
})();
if(cljs.core.truth_(temp__5804__auto___187327__$1)){
var b_187328 = temp__5804__auto___187327__$1;
var temp__5804__auto___187329__$2 = (function (){var G__187079 = cljs.core.deref(conn);
var G__187080 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","page","block/page",822314108).cljs$core$IFn$_invoke$arity$1((function (){var G__187081 = cljs.core.deref(conn);
var G__187082 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_uuid_187326], null);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__187081,G__187082) : datascript.core.entity.call(null,G__187081,G__187082));
})()));
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__187079,G__187080) : datascript.core.entity.call(null,G__187079,G__187080));
})();
if(cljs.core.truth_(temp__5804__auto___187329__$2)){
var target_b_187330 = temp__5804__auto___187329__$2;
frontend.worker.rtc.remote_update.transact_db_BANG_.cljs$core$IFn$_invoke$arity$6(new cljs.core.Keyword(null,"move-blocks&persist-op","move-blocks&persist-op",2069517925),repo,conn,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [b_187328], null),target_b_187330,false);
} else {
}
} else {
}


var G__187331 = cljs.core.next(seq__187055_187320__$1);
var G__187332 = null;
var G__187333 = (0);
var G__187334 = (0);
seq__187055_187306 = G__187331;
chunk__187056_187307 = G__187332;
count__187057_187308 = G__187333;
i__187058_187309 = G__187334;
continue;
}
} else {
}
}
break;
}

var seq__187083 = cljs.core.seq(block_uuids_to_remove);
var chunk__187084 = null;
var count__187085 = (0);
var i__187086 = (0);
while(true){
if((i__187086 < count__187085)){
var block_uuid = chunk__187084.cljs$core$IIndexed$_nth$arity$2(null,i__187086);
var temp__5804__auto___187335 = (function (){var G__187091 = cljs.core.deref(conn);
var G__187092 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_uuid], null);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__187091,G__187092) : datascript.core.entity.call(null,G__187091,G__187092));
})();
if(cljs.core.truth_(temp__5804__auto___187335)){
var b_187336 = temp__5804__auto___187335;
frontend.worker.rtc.remote_update.transact_db_BANG_.cljs$core$IFn$_invoke$arity$6(new cljs.core.Keyword(null,"delete-blocks","delete-blocks",-1868631596),repo,conn,date_formatter,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [b_187336], null),cljs.core.PersistentArrayMap.EMPTY);
} else {
}


var G__187337 = seq__187083;
var G__187338 = chunk__187084;
var G__187339 = count__187085;
var G__187340 = (i__187086 + (1));
seq__187083 = G__187337;
chunk__187084 = G__187338;
count__187085 = G__187339;
i__187086 = G__187340;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__187083);
if(temp__5804__auto__){
var seq__187083__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__187083__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__187083__$1);
var G__187341 = cljs.core.chunk_rest(seq__187083__$1);
var G__187342 = c__5525__auto__;
var G__187343 = cljs.core.count(c__5525__auto__);
var G__187344 = (0);
seq__187083 = G__187341;
chunk__187084 = G__187342;
count__187085 = G__187343;
i__187086 = G__187344;
continue;
} else {
var block_uuid = cljs.core.first(seq__187083__$1);
var temp__5804__auto___187345__$1 = (function (){var G__187093 = cljs.core.deref(conn);
var G__187094 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_uuid], null);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__187093,G__187094) : datascript.core.entity.call(null,G__187093,G__187094));
})();
if(cljs.core.truth_(temp__5804__auto___187345__$1)){
var b_187346 = temp__5804__auto___187345__$1;
frontend.worker.rtc.remote_update.transact_db_BANG_.cljs$core$IFn$_invoke$arity$6(new cljs.core.Keyword(null,"delete-blocks","delete-blocks",-1868631596),repo,conn,date_formatter,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [b_187346], null),cljs.core.PersistentArrayMap.EMPTY);
} else {
}


var G__187347 = cljs.core.next(seq__187083__$1);
var G__187348 = null;
var G__187349 = (0);
var G__187350 = (0);
seq__187083 = G__187347;
chunk__187084 = G__187348;
count__187085 = G__187349;
i__187086 = G__187350;
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
var local_parent = (function (){var G__187095 = cljs.core.deref(conn);
var G__187096 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),first_remote_parent], null);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__187095,G__187096) : datascript.core.entity.call(null,G__187095,G__187096));
})();
var whiteboard_page_block_QMARK_ = (logseq.db.whiteboard_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.whiteboard_QMARK_.cljs$core$IFn$_invoke$arity$1(local_parent) : logseq.db.whiteboard_QMARK_.call(null,local_parent));
var b = (function (){var G__187097 = cljs.core.deref(conn);
var G__187098 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_uuid], null);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__187097,G__187098) : datascript.core.entity.call(null,G__187097,G__187098));
})();
var G__187099 = new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [whiteboard_page_block_QMARK_,(!((local_parent == null))),(!((remote_block_order == null)))], null);
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [false,true,true], null),G__187099)){
if(cljs.core.truth_(move_QMARK_)){
frontend.worker.rtc.remote_update.transact_db_BANG_.cljs$core$IFn$_invoke$arity$6(new cljs.core.Keyword(null,"move-blocks","move-blocks",-955702999),repo,conn,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [b], null),local_parent,false);
} else {
frontend.worker.rtc.remote_update.transact_db_BANG_.cljs$core$IFn$_invoke$arity$6(new cljs.core.Keyword(null,"insert-blocks","insert-blocks",-1269782013),repo,conn,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_uuid,new cljs.core.Keyword("block","title","block/title",710445684),""], null)], null),local_parent,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"sibling?","sibling?",-1086129060),false,new cljs.core.Keyword(null,"keep-uuid?","keep-uuid?",528472028),true], null));
}

return frontend.worker.rtc.remote_update.transact_db_BANG_.cljs$core$IFn$_invoke$arity$6(new cljs.core.Keyword(null,"update-block-order-directly","update-block-order-directly",-912768900),repo,conn,block_uuid,first_remote_parent,remote_block_order);
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [false,true,false], null),G__187099)){
if(cljs.core.truth_(move_QMARK_)){
return frontend.worker.rtc.remote_update.transact_db_BANG_.cljs$core$IFn$_invoke$arity$6(new cljs.core.Keyword(null,"move-blocks","move-blocks",-955702999),repo,conn,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [b], null),local_parent,false);
} else {
return frontend.worker.rtc.remote_update.transact_db_BANG_.cljs$core$IFn$_invoke$arity$3(new cljs.core.Keyword(null,"insert-no-order-blocks","insert-no-order-blocks",-576698292),conn,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [block_uuid,first_remote_parent], null)], null));
}
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [true,false,false], null),G__187099)){
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2("Not implemented yet for whiteboard",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"op-value","op-value",-67314035),op_value], null));
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [true,false,true], null),G__187099)){
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2("Not implemented yet for whiteboard",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"op-value","op-value",-67314035),op_value], null));
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [true,true,false], null),G__187099)){
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2("Not implemented yet for whiteboard",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"op-value","op-value",-67314035),op_value], null));
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [true,true,true], null),G__187099)){
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
var uuid__GT_dep_uuids = cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p__187100){
var vec__187101 = p__187100;
var uuid = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__187101,(0),null);
var env = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__187101,(1),null);
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
var G__187353 = r;
var G__187354 = rest_uuids;
var G__187355 = next_uuid;
r = G__187353;
rest_uuids = G__187354;
uuid = G__187355;
continue;
} else {
var rest_uuids_STAR_ = cljs.core.disj.cljs$core$IFn$_invoke$arity$2(rest_uuids,uuid);
var G__187356 = cljs.core.conj.cljs$core$IFn$_invoke$arity$2(r,uuid);
var G__187357 = rest_uuids_STAR_;
var G__187358 = cljs.core.first(rest_uuids_STAR_);
r = G__187356;
rest_uuids = G__187357;
uuid = G__187358;
continue;
}
}
break;
}
})();
return cljs.core.mapv.cljs$core$IFn$_invoke$arity$2(move_ops_map,sorted_uuids);
});
frontend.worker.rtc.remote_update.apply_remote_remove_page_ops = (function frontend$worker$rtc$remote_update$apply_remote_remove_page_ops(repo,conn,remove_page_ops){
var seq__187104 = cljs.core.seq(remove_page_ops);
var chunk__187105 = null;
var count__187106 = (0);
var i__187107 = (0);
while(true){
if((i__187107 < count__187106)){
var op = chunk__187105.cljs$core$IIndexed$_nth$arity$2(null,i__187107);
frontend.worker.handler.page.delete_BANG_.cljs$core$IFn$_invoke$arity$variadic(repo,conn,new cljs.core.Keyword(null,"block-uuid","block-uuid",-1558039638).cljs$core$IFn$_invoke$arity$1(op),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"persist-op?","persist-op?",-531287534),false], null)], 0));


var G__187359 = seq__187104;
var G__187360 = chunk__187105;
var G__187361 = count__187106;
var G__187362 = (i__187107 + (1));
seq__187104 = G__187359;
chunk__187105 = G__187360;
count__187106 = G__187361;
i__187107 = G__187362;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__187104);
if(temp__5804__auto__){
var seq__187104__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__187104__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__187104__$1);
var G__187363 = cljs.core.chunk_rest(seq__187104__$1);
var G__187364 = c__5525__auto__;
var G__187365 = cljs.core.count(c__5525__auto__);
var G__187366 = (0);
seq__187104 = G__187363;
chunk__187105 = G__187364;
count__187106 = G__187365;
i__187107 = G__187366;
continue;
} else {
var op = cljs.core.first(seq__187104__$1);
frontend.worker.handler.page.delete_BANG_.cljs$core$IFn$_invoke$arity$variadic(repo,conn,new cljs.core.Keyword(null,"block-uuid","block-uuid",-1558039638).cljs$core$IFn$_invoke$arity$1(op),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"persist-op?","persist-op?",-531287534),false], null)], 0));


var G__187367 = cljs.core.next(seq__187104__$1);
var G__187368 = null;
var G__187369 = (0);
var G__187370 = (0);
seq__187104 = G__187367;
chunk__187105 = G__187368;
count__187106 = G__187369;
i__187107 = G__187370;
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
var a__GT_add__GT_v_set = cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (m,p__187108){
var vec__187109 = p__187108;
var a = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__187109,(0),null);
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__187109,(1),null);
var _t = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__187109,(2),null);
var add_QMARK_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__187109,(3),null);
var map__187112 = cljs.core.get.cljs$core$IFn$_invoke$arity$3(m,a,new cljs.core.PersistentArrayMap(null, 2, [true,cljs.core.PersistentHashSet.EMPTY,false,cljs.core.PersistentHashSet.EMPTY], null));
var map__187112__$1 = cljs.core.__destructure_map(map__187112);
var add_vset = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__187112__$1,true);
var retract_vset = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__187112__$1,false);
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(m,a,new cljs.core.PersistentArrayMap(null, 2, [true,(function (){var fexpr__187113 = (cljs.core.truth_(add_QMARK_)?cljs.core.conj:cljs.core.disj);
return (fexpr__187113.cljs$core$IFn$_invoke$arity$2 ? fexpr__187113.cljs$core$IFn$_invoke$arity$2(add_vset,v) : fexpr__187113.call(null,add_vset,v));
})(),false,(function (){var fexpr__187114 = (cljs.core.truth_(add_QMARK_)?cljs.core.disj:cljs.core.conj);
return (fexpr__187114.cljs$core$IFn$_invoke$arity$2 ? fexpr__187114.cljs$core$IFn$_invoke$arity$2(retract_vset,v) : fexpr__187114.call(null,retract_vset,v));
})()], null));
}),cljs.core.PersistentArrayMap.EMPTY,local_av_coll);
var updated_remote_attr_map1 = cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (p__187115){
var vec__187116 = p__187115;
var remote_a = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__187116,(0),null);
var remote_v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__187116,(1),null);
var temp__5804__auto__ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(a__GT_add__GT_v_set,remote_a);
if(cljs.core.truth_(temp__5804__auto__)){
var map__187119 = temp__5804__auto__;
var map__187119__$1 = cljs.core.__destructure_map(map__187119);
var add_vset = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__187119__$1,true);
var retract_vset = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__187119__$1,false);
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [remote_a,((cljs.core.coll_QMARK_(remote_v))?cljs.core.vec(clojure.set.difference.cljs$core$IFn$_invoke$arity$2(clojure.set.union.cljs$core$IFn$_invoke$arity$2(cljs.core.set(remote_v),add_vset),retract_vset)):((cljs.core.seq(add_vset))?cljs.core.first(add_vset):((cljs.core.contains_QMARK_(retract_vset,remote_v))?null:null)))], null);
} else {
return null;
}
}),remote_attr_map);
var updated_remote_attr_map2 = cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (p__187120){
var vec__187121 = p__187120;
var a = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__187121,(0),null);
var add__GT_v_set = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__187121,(1),null);
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
var G__187124 = cljs.core.first(local_op);
var G__187124__$1 = (((G__187124 instanceof cljs.core.Keyword))?G__187124.fqn:null);
switch (G__187124__$1) {
case "move":
var block_uuid = new cljs.core.Keyword(null,"block-uuid","block-uuid",-1558039638).cljs$core$IFn$_invoke$arity$1(local_op_value);
var remote_op = cljs.core.get.cljs$core$IFn$_invoke$arity$2(affected_blocks_map__$1,block_uuid);
var G__187125 = new cljs.core.Keyword(null,"op","op",-1882987955).cljs$core$IFn$_invoke$arity$1(remote_op);
var G__187125__$1 = (((G__187125 instanceof cljs.core.Keyword))?G__187125.fqn:null);
switch (G__187125__$1) {
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
var remote_op_STAR_ = (cljs.core.truth_((function (){var G__187127 = new cljs.core.Keyword(null,"op","op",-1882987955).cljs$core$IFn$_invoke$arity$1(remote_op);
var fexpr__187126 = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"move","move",-2110884309),null,new cljs.core.Keyword(null,"update-attrs","update-attrs",1528055735),null,new cljs.core.Keyword(null,"move+update-attrs","move+update-attrs",-1039623395),null], null), null);
return (fexpr__187126.cljs$core$IFn$_invoke$arity$1 ? fexpr__187126.cljs$core$IFn$_invoke$arity$1(G__187127) : fexpr__187126.call(null,G__187127));
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
var map__187128 = cljs.core.update_vals(cljs.core.group_by((function (p__187129){
var vec__187130 = p__187129;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__187130,(0),null);
var env = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__187130,(1),null);
return cljs.core.get.cljs$core$IFn$_invoke$arity$2(env,new cljs.core.Keyword(null,"op","op",-1882987955));
}),affected_blocks_map_STAR_),cljs.core.partial.cljs$core$IFn$_invoke$arity$2(cljs.core.into,cljs.core.PersistentArrayMap.EMPTY));
var map__187128__$1 = cljs.core.__destructure_map(map__187128);
var remove_ops_map = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__187128__$1,new cljs.core.Keyword(null,"remove","remove",-131428414));
var move_ops_map = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__187128__$1,new cljs.core.Keyword(null,"move","move",-2110884309));
var update_ops_map = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__187128__$1,new cljs.core.Keyword(null,"update-attrs","update-attrs",1528055735));
var move_PLUS_update_ops_map = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__187128__$1,new cljs.core.Keyword(null,"move+update-attrs","move+update-attrs",-1039623395));
var update_page_ops_map = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__187128__$1,new cljs.core.Keyword(null,"update-page","update-page",-503479891));
var remove_page_ops_map = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__187128__$1,new cljs.core.Keyword(null,"remove-page","remove-page",-1679345876));
return new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"remove-ops-map","remove-ops-map",-223802527),remove_ops_map,new cljs.core.Keyword(null,"move-ops-map","move-ops-map",827650136),cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([move_ops_map,move_PLUS_update_ops_map], 0)),new cljs.core.Keyword(null,"update-ops-map","update-ops-map",1929446072),cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([update_ops_map,move_PLUS_update_ops_map], 0)),new cljs.core.Keyword(null,"update-page-ops-map","update-page-ops-map",-705251299),update_page_ops_map,new cljs.core.Keyword(null,"remove-page-ops-map","remove-page-ops-map",673661601),remove_page_ops_map], null);
});
/**
 * NOTE: some blocks don't have :block/order (e.g. whiteboard blocks)
 */
frontend.worker.rtc.remote_update.check_block_pos = (function frontend$worker$rtc$remote_update$check_block_pos(db,block_uuid,remote_parents,remote_block_order){
var local_b = (function (){var G__187133 = db;
var G__187134 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_uuid], null);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__187133,G__187134) : datascript.core.entity.call(null,G__187133,G__187134));
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
frontend.worker.rtc.remote_update.upsert_whiteboard_block = (function frontend$worker$rtc$remote_update$upsert_whiteboard_block(repo,conn,p__187135){
var map__187136 = p__187135;
var map__187136__$1 = cljs.core.__destructure_map(map__187136);
var _op_value = map__187136__$1;
var parents = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__187136__$1,new cljs.core.Keyword(null,"parents","parents",-2027538891));
var properties = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__187136__$1,new cljs.core.Keyword(null,"properties","properties",685819552));
var db = cljs.core.deref(conn);
var first_remote_parent = cljs.core.first(parents);
var temp__5804__auto__ = (function (){var G__187137 = db;
var G__187138 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),first_remote_parent], null);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__187137,G__187138) : datascript.core.entity.call(null,G__187137,G__187138));
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
var vec__187144 = temp__5804__auto__;
var ref_QMARK_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__187144,(0),null);
var card_many_QMARK_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__187144,(1),null);
var G__187150 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [ref_QMARK_,card_many_QMARK_], null);
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [true,true], null),G__187150)){
var vec__187151 = clojure.data.diff(cljs.core.set(local_v),cljs.core.set(remote_v));
var local_only = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__187151,(0),null);
var remote_only = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__187151,(1),null);
var G__187154 = cljs.core.PersistentVector.EMPTY;
var G__187154__$1 = ((cljs.core.seq(local_only))?cljs.core.concat.cljs$core$IFn$_invoke$arity$2(G__187154,cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (block_uuid){
return new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","retract","db/retract",-1549825231),e,k,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_uuid], null)], null);
}),local_only)):G__187154);
if(cljs.core.seq(remote_only)){
return cljs.core.concat.cljs$core$IFn$_invoke$arity$2(G__187154__$1,cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (block_uuid){
var temp__5804__auto____$1 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1((function (){var G__187159 = db;
var G__187160 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_uuid], null);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__187159,G__187160) : datascript.core.entity.call(null,G__187159,G__187160));
})());
if(cljs.core.truth_(temp__5804__auto____$1)){
var db_id = temp__5804__auto____$1;
return new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","add","db/add",235286841),e,k,db_id], null);
} else {
return null;
}
}),remote_only));
} else {
return G__187154__$1;
}
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [true,false], null),G__187150)){
var remote_block_uuid = ((cljs.core.coll_QMARK_(remote_v))?cljs.core.first(remote_v):remote_v);
if(cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(local_v,remote_block_uuid)){
if((remote_block_uuid == null)){
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","retract","db/retract",-1549825231),e,k], null)], null);
} else {
var temp__5804__auto____$1 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1((function (){var G__187161 = db;
var G__187162 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),remote_block_uuid], null);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__187161,G__187162) : datascript.core.entity.call(null,G__187161,G__187162));
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
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [false,false], null),G__187150)){
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
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [false,true], null),G__187150)){
var _ = (((((remote_v == null)) || (cljs.core.coll_QMARK_(remote_v))))?null:(function(){throw (new Error(["Assert failed: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"remote-v","remote-v",1633384261),remote_v,new cljs.core.Keyword(null,"a","a",-2123407586),k,new cljs.core.Keyword(null,"e","e",1381269198),e], null)),"\n","(or (nil? remote-v) (coll? remote-v))"].join('')))})());
var remote_v_STAR_ = cljs.core.set(cljs.core.map.cljs$core$IFn$_invoke$arity$2(logseq.db.read_transit_str,remote_v));
var vec__187163 = clojure.data.diff(cljs.core.set(local_v),remote_v_STAR_);
var local_only = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__187163,(0),null);
var remote_only = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__187163,(1),null);
var G__187166 = cljs.core.PersistentVector.EMPTY;
var G__187166__$1 = ((cljs.core.seq(local_only))?cljs.core.concat.cljs$core$IFn$_invoke$arity$2(G__187166,cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (v){
return new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","retract","db/retract",-1549825231),e,k,v], null);
}),local_only)):G__187166);
if(cljs.core.seq(remote_only)){
return cljs.core.concat.cljs$core$IFn$_invoke$arity$2(G__187166__$1,cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (v){
return new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","add","db/add",235286841),e,k,v], null);
}),remote_only));
} else {
return G__187166__$1;
}
} else {
throw (new Error(["No matching clause: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(G__187150)].join('')));

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
var tx_data1 = cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (p__187168){
var vec__187169 = p__187168;
var k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__187169,(0),null);
var local_v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__187169,(1),null);
var remote_v = cljs.core.get.cljs$core$IFn$_invoke$arity$2(remote_block_map,k);
return cljs.core.seq(frontend.worker.rtc.remote_update.diff_block_kv__GT_tx_data(db,db_schema,e,k,local_v,remote_v));
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([local_block_map], 0));
var tx_data2 = cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (p__187172){
var vec__187173 = p__187172;
var k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__187173,(0),null);
var remote_v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__187173,(1),null);
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
var local_block_map = cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (p__187176){
var vec__187177 = p__187176;
var k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__187177,(0),null);
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__187177,(1),null);
var temp__5804__auto__ = frontend.worker.rtc.remote_update.get_schema_ref_PLUS_cardinality(db_schema,k);
if(cljs.core.truth_(temp__5804__auto__)){
var vec__187180 = temp__5804__auto__;
var ref_QMARK_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__187180,(0),null);
var card_many_QMARK_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__187180,(1),null);
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [k,(function (){var G__187183 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [ref_QMARK_,card_many_QMARK_], null);
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [true,true], null),G__187183)){
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
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [true,false], null),G__187183)){
var v_STAR_ = (function (){var G__187184 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(v);
var G__187184__$1 = (((G__187184 == null))?null:(datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db,G__187184) : datascript.core.entity.call(null,db,G__187184)));
if((G__187184__$1 == null)){
return null;
} else {
return new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(G__187184__$1);
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
}),cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (p__187185){
var vec__187186 = p__187185;
var attr = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__187186,(0),null);
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__187186,(1),null);
var and__5000__auto__ = frontend.worker.rtc.remote_update.update_op_watched_attr_QMARK_(attr);
if(cljs.core.truth_(and__5000__auto__)){
return (!(cljs.core.contains_QMARK_(ignore_attr_set,attr)));
} else {
return and__5000__auto__;
}
}),ent)));
var remote_block_map = cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (p__187189){
var vec__187190 = p__187189;
var k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__187190,(0),null);
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__187190,(1),null);
var temp__5804__auto__ = frontend.worker.rtc.remote_update.get_schema_ref_PLUS_cardinality(db_schema,k);
if(cljs.core.truth_(temp__5804__auto__)){
var vec__187193 = temp__5804__auto__;
var _ref_QMARK_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__187193,(0),null);
var card_many_QMARK_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__187193,(1),null);
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [k,((((cljs.core.coll_QMARK_(v)) && (cljs.core.not(card_many_QMARK_))))?cljs.core.first(v):v)], null);
} else {
return null;
}
}),cljs.core.filter.cljs$core$IFn$_invoke$arity$2(cljs.core.comp.cljs$core$IFn$_invoke$arity$2(frontend.worker.rtc.remote_update.update_op_watched_attr_QMARK_,cljs.core.first),op_value)));
return frontend.worker.rtc.remote_update.diff_block_map__GT_tx_data(db,new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(ent),local_block_map,remote_block_map);
});
frontend.worker.rtc.remote_update.remote_op_value__GT_schema_tx_data = (function frontend$worker$rtc$remote_update$remote_op_value__GT_schema_tx_data(block_uuid,op_value){
var temp__5804__auto__ = (function (){var G__187196 = op_value;
var G__187196__$1 = (((G__187196 == null))?null:new cljs.core.Keyword("client","schema","client/schema",-238707506).cljs$core$IFn$_invoke$arity$1(G__187196));
if((G__187196__$1 == null)){
return null;
} else {
return logseq.db.read_transit_str(G__187196__$1);
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
frontend.worker.rtc.remote_update.update_block_attrs = (function frontend$worker$rtc$remote_update$update_block_attrs(repo,conn,block_uuid,p__187197){
var map__187198 = p__187197;
var map__187198__$1 = cljs.core.__destructure_map(map__187198);
var op_value = map__187198__$1;
var parents = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__187198__$1,new cljs.core.Keyword(null,"parents","parents",-2027538891));
var temp__5804__auto__ = (function (){var G__187199 = cljs.core.deref(conn);
var G__187200 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_uuid], null);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__187199,G__187200) : datascript.core.entity.call(null,G__187199,G__187200));
})();
if(cljs.core.truth_(temp__5804__auto__)){
var ent = temp__5804__auto__;
if(cljs.core.truth_(cljs.core.some((function (k){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("block",cljs.core.namespace(k));
}),cljs.core.keys(op_value)))){
var map__187201 = frontend.worker.rtc.remote_update.update_block_order(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(ent),op_value);
var map__187201__$1 = cljs.core.__destructure_map(map__187201);
var update_block_order_tx_data = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__187201__$1,new cljs.core.Keyword(null,"tx-data","tx-data",934159761));
var op_value__$1 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__187201__$1,new cljs.core.Keyword(null,"op-value","op-value",-67314035));
var first_remote_parent = cljs.core.first(parents);
var local_parent = (function (){var G__187202 = cljs.core.deref(conn);
var G__187203 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),first_remote_parent], null);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__187202,G__187203) : datascript.core.entity.call(null,G__187202,G__187203));
})();
var whiteboard_page_block_QMARK_ = (logseq.db.whiteboard_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.whiteboard_QMARK_.cljs$core$IFn$_invoke$arity$1(local_parent) : logseq.db.whiteboard_QMARK_.call(null,local_parent));
if(cljs.core.truth_(whiteboard_page_block_QMARK_)){
return frontend.worker.rtc.remote_update.upsert_whiteboard_block(repo,conn,op_value__$1);
} else {
var temp__5804__auto___187373__$1 = frontend.worker.rtc.remote_update.remote_op_value__GT_schema_tx_data(block_uuid,op_value__$1);
if(cljs.core.truth_(temp__5804__auto___187373__$1)){
var schema_tx_data_187374 = temp__5804__auto___187373__$1;
logseq.db.transact_BANG_.cljs$core$IFn$_invoke$arity$3(conn,schema_tx_data_187374,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"persist-op?","persist-op?",-531287534),false,new cljs.core.Keyword(null,"gen-undo-ops?","gen-undo-ops?",324292975),false], null));
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
var seq__187204 = cljs.core.seq(update_ops);
var chunk__187205 = null;
var count__187206 = (0);
var i__187207 = (0);
while(true){
if((i__187207 < count__187206)){
var map__187212 = chunk__187205.cljs$core$IIndexed$_nth$arity$2(null,i__187207);
var map__187212__$1 = cljs.core.__destructure_map(map__187212);
var op_value = map__187212__$1;
var block_order = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__187212__$1,new cljs.core.Keyword("block","order","block/order",-1429282437));
var parents = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__187212__$1,new cljs.core.Keyword(null,"parents","parents",-2027538891));
var self = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__187212__$1,new cljs.core.Keyword(null,"self","self",-1547428899));
if(cljs.core.truth_((function (){var and__5000__auto__ = parents;
if(cljs.core.truth_(and__5000__auto__)){
return block_order;
} else {
return and__5000__auto__;
}
})())){
var r_187375 = frontend.worker.rtc.remote_update.check_block_pos(cljs.core.deref(conn),self,parents,block_order);
var G__187213_187376 = r_187375;
var G__187213_187377__$1 = (((G__187213_187376 instanceof cljs.core.Keyword))?G__187213_187376.fqn:null);
switch (G__187213_187377__$1) {
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


var G__187379 = seq__187204;
var G__187380 = chunk__187205;
var G__187381 = count__187206;
var G__187382 = (i__187207 + (1));
seq__187204 = G__187379;
chunk__187205 = G__187380;
count__187206 = G__187381;
i__187207 = G__187382;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__187204);
if(temp__5804__auto__){
var seq__187204__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__187204__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__187204__$1);
var G__187383 = cljs.core.chunk_rest(seq__187204__$1);
var G__187384 = c__5525__auto__;
var G__187385 = cljs.core.count(c__5525__auto__);
var G__187386 = (0);
seq__187204 = G__187383;
chunk__187205 = G__187384;
count__187206 = G__187385;
i__187207 = G__187386;
continue;
} else {
var map__187214 = cljs.core.first(seq__187204__$1);
var map__187214__$1 = cljs.core.__destructure_map(map__187214);
var op_value = map__187214__$1;
var block_order = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__187214__$1,new cljs.core.Keyword("block","order","block/order",-1429282437));
var parents = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__187214__$1,new cljs.core.Keyword(null,"parents","parents",-2027538891));
var self = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__187214__$1,new cljs.core.Keyword(null,"self","self",-1547428899));
if(cljs.core.truth_((function (){var and__5000__auto__ = parents;
if(cljs.core.truth_(and__5000__auto__)){
return block_order;
} else {
return and__5000__auto__;
}
})())){
var r_187387 = frontend.worker.rtc.remote_update.check_block_pos(cljs.core.deref(conn),self,parents,block_order);
var G__187215_187388 = r_187387;
var G__187215_187389__$1 = (((G__187215_187388 instanceof cljs.core.Keyword))?G__187215_187388.fqn:null);
switch (G__187215_187389__$1) {
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


var G__187391 = cljs.core.next(seq__187204__$1);
var G__187392 = null;
var G__187393 = (0);
var G__187394 = (0);
seq__187204 = G__187391;
chunk__187205 = G__187392;
count__187206 = G__187393;
i__187207 = G__187394;
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
var seq__187216 = cljs.core.seq(sorted_move_ops);
var chunk__187217 = null;
var count__187218 = (0);
var i__187219 = (0);
while(true){
if((i__187219 < count__187218)){
var map__187224 = chunk__187217.cljs$core$IIndexed$_nth$arity$2(null,i__187219);
var map__187224__$1 = cljs.core.__destructure_map(map__187224);
var op_value = map__187224__$1;
var block_order = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__187224__$1,new cljs.core.Keyword("block","order","block/order",-1429282437));
var parents = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__187224__$1,new cljs.core.Keyword(null,"parents","parents",-2027538891));
var self = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__187224__$1,new cljs.core.Keyword(null,"self","self",-1547428899));
var r_187395 = frontend.worker.rtc.remote_update.check_block_pos(cljs.core.deref(conn),self,parents,block_order);
var G__187225_187396 = r_187395;
var G__187225_187397__$1 = (((G__187225_187396 instanceof cljs.core.Keyword))?G__187225_187396.fqn:null);
switch (G__187225_187397__$1) {
case "not-exist":
frontend.worker.rtc.remote_update.insert_or_move_block(repo,conn,self,parents,block_order,false,op_value);

frontend.worker.rtc.remote_update.update_block_attrs(repo,conn,self,op_value);

break;
case "wrong-pos":
frontend.worker.rtc.remote_update.insert_or_move_block(repo,conn,self,parents,block_order,true,op_value);

break;
default:

}


var G__187399 = seq__187216;
var G__187400 = chunk__187217;
var G__187401 = count__187218;
var G__187402 = (i__187219 + (1));
seq__187216 = G__187399;
chunk__187217 = G__187400;
count__187218 = G__187401;
i__187219 = G__187402;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__187216);
if(temp__5804__auto__){
var seq__187216__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__187216__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__187216__$1);
var G__187403 = cljs.core.chunk_rest(seq__187216__$1);
var G__187404 = c__5525__auto__;
var G__187405 = cljs.core.count(c__5525__auto__);
var G__187406 = (0);
seq__187216 = G__187403;
chunk__187217 = G__187404;
count__187218 = G__187405;
i__187219 = G__187406;
continue;
} else {
var map__187226 = cljs.core.first(seq__187216__$1);
var map__187226__$1 = cljs.core.__destructure_map(map__187226);
var op_value = map__187226__$1;
var block_order = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__187226__$1,new cljs.core.Keyword("block","order","block/order",-1429282437));
var parents = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__187226__$1,new cljs.core.Keyword(null,"parents","parents",-2027538891));
var self = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__187226__$1,new cljs.core.Keyword(null,"self","self",-1547428899));
var r_187407 = frontend.worker.rtc.remote_update.check_block_pos(cljs.core.deref(conn),self,parents,block_order);
var G__187227_187408 = r_187407;
var G__187227_187409__$1 = (((G__187227_187408 instanceof cljs.core.Keyword))?G__187227_187408.fqn:null);
switch (G__187227_187409__$1) {
case "not-exist":
frontend.worker.rtc.remote_update.insert_or_move_block(repo,conn,self,parents,block_order,false,op_value);

frontend.worker.rtc.remote_update.update_block_attrs(repo,conn,self,op_value);

break;
case "wrong-pos":
frontend.worker.rtc.remote_update.insert_or_move_block(repo,conn,self,parents,block_order,true,op_value);

break;
default:

}


var G__187411 = cljs.core.next(seq__187216__$1);
var G__187412 = null;
var G__187413 = (0);
var G__187414 = (0);
seq__187216 = G__187411;
chunk__187217 = G__187412;
count__187218 = G__187413;
i__187219 = G__187414;
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
var seq__187228 = cljs.core.seq(update_page_ops);
var chunk__187229 = null;
var count__187230 = (0);
var i__187231 = (0);
while(true){
if((i__187231 < count__187230)){
var map__187240 = chunk__187229.cljs$core$IIndexed$_nth$arity$2(null,i__187231);
var map__187240__$1 = cljs.core.__destructure_map(map__187240);
var op_value = map__187240__$1;
var title = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__187240__$1,new cljs.core.Keyword("block","title","block/title",710445684));
var self = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__187240__$1,new cljs.core.Keyword(null,"self","self",-1547428899));
var _page_name = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__187240__$1,new cljs.core.Keyword(null,"_page-name","_page-name",1086354033));
var create_opts_187415 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"uuid","uuid",-2145095719),self], null);
var vec__187241_187416 = frontend.worker.handler.page.rtc_create_page_BANG_(conn,config,logseq.db.read_transit_str(title),create_opts_187415);
var __187417 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__187241_187416,(0),null);
var page_name_187418 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__187241_187416,(1),null);
var page_uuid_187419 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__187241_187416,(2),null);
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(page_uuid_187419,self)){
} else {
throw (new Error(["Assert failed: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"page-name","page-name",974981762),page_name_187418,new cljs.core.Keyword(null,"page-uuid","page-uuid",1152600915),page_uuid_187419,new cljs.core.Keyword(null,"should-be","should-be",1953553709),self], null)),"\n","(= page-uuid self)"].join('')));
}

frontend.worker.rtc.remote_update.update_block_attrs(repo,conn,self,op_value);


var G__187420 = seq__187228;
var G__187421 = chunk__187229;
var G__187422 = count__187230;
var G__187423 = (i__187231 + (1));
seq__187228 = G__187420;
chunk__187229 = G__187421;
count__187230 = G__187422;
i__187231 = G__187423;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__187228);
if(temp__5804__auto__){
var seq__187228__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__187228__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__187228__$1);
var G__187424 = cljs.core.chunk_rest(seq__187228__$1);
var G__187425 = c__5525__auto__;
var G__187426 = cljs.core.count(c__5525__auto__);
var G__187427 = (0);
seq__187228 = G__187424;
chunk__187229 = G__187425;
count__187230 = G__187426;
i__187231 = G__187427;
continue;
} else {
var map__187244 = cljs.core.first(seq__187228__$1);
var map__187244__$1 = cljs.core.__destructure_map(map__187244);
var op_value = map__187244__$1;
var title = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__187244__$1,new cljs.core.Keyword("block","title","block/title",710445684));
var self = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__187244__$1,new cljs.core.Keyword(null,"self","self",-1547428899));
var _page_name = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__187244__$1,new cljs.core.Keyword(null,"_page-name","_page-name",1086354033));
var create_opts_187428 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"uuid","uuid",-2145095719),self], null);
var vec__187245_187429 = frontend.worker.handler.page.rtc_create_page_BANG_(conn,config,logseq.db.read_transit_str(title),create_opts_187428);
var __187430 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__187245_187429,(0),null);
var page_name_187431 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__187245_187429,(1),null);
var page_uuid_187432 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__187245_187429,(2),null);
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(page_uuid_187432,self)){
} else {
throw (new Error(["Assert failed: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"page-name","page-name",974981762),page_name_187431,new cljs.core.Keyword(null,"page-uuid","page-uuid",1152600915),page_uuid_187432,new cljs.core.Keyword(null,"should-be","should-be",1953553709),self], null)),"\n","(= page-uuid self)"].join('')));
}

frontend.worker.rtc.remote_update.update_block_attrs(repo,conn,self,op_value);


var G__187433 = cljs.core.next(seq__187228__$1);
var G__187434 = null;
var G__187435 = (0);
var G__187436 = (0);
seq__187228 = G__187433;
chunk__187229 = G__187434;
count__187230 = G__187435;
i__187231 = G__187436;
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
var seq__187248 = cljs.core.seq(sorted_refed_blocks);
var chunk__187249 = null;
var count__187250 = (0);
var i__187251 = (0);
while(true){
if((i__187251 < count__187250)){
var refed_block = chunk__187249.cljs$core$IIndexed$_nth$arity$2(null,i__187251);
var ent_187437 = (function (){var G__187256 = cljs.core.deref(conn);
var G__187257 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(refed_block)], null);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__187256,G__187257) : datascript.core.entity.call(null,G__187256,G__187257));
})();
if(cljs.core.truth_(ent_187437)){
} else {
lambdaisland.glogi.log.cljs$core$IFn$_invoke$arity$4("frontend.worker.rtc.remote-update",new cljs.core.Keyword(null,"info","info",-317069002),cljs.core.identity(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"ensure-refed-blocks-exist","ensure-refed-blocks-exist",-2129444193),refed_block,new cljs.core.Keyword(null,"line","line",212345235),553], null)),null);

if(cljs.core.truth_(new cljs.core.Keyword("block","name","block/name",1619760316).cljs$core$IFn$_invoke$arity$1(refed_block))){
frontend.worker.rtc.remote_update.apply_remote_update_page_ops(repo,conn,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(refed_block,new cljs.core.Keyword(null,"self","self",-1547428899),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(refed_block)),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552))], null));
} else {
frontend.worker.rtc.remote_update.apply_remote_move_ops(repo,conn,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(refed_block,new cljs.core.Keyword(null,"self","self",-1547428899),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(refed_block),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"parents","parents",-2027538891),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","parent","block/parent",-918309064).cljs$core$IFn$_invoke$arity$1(refed_block)], null)], 0)),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552))], null));
}
}


var G__187438 = seq__187248;
var G__187439 = chunk__187249;
var G__187440 = count__187250;
var G__187441 = (i__187251 + (1));
seq__187248 = G__187438;
chunk__187249 = G__187439;
count__187250 = G__187440;
i__187251 = G__187441;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__187248);
if(temp__5804__auto__){
var seq__187248__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__187248__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__187248__$1);
var G__187442 = cljs.core.chunk_rest(seq__187248__$1);
var G__187443 = c__5525__auto__;
var G__187444 = cljs.core.count(c__5525__auto__);
var G__187445 = (0);
seq__187248 = G__187442;
chunk__187249 = G__187443;
count__187250 = G__187444;
i__187251 = G__187445;
continue;
} else {
var refed_block = cljs.core.first(seq__187248__$1);
var ent_187446 = (function (){var G__187258 = cljs.core.deref(conn);
var G__187259 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(refed_block)], null);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__187258,G__187259) : datascript.core.entity.call(null,G__187258,G__187259));
})();
if(cljs.core.truth_(ent_187446)){
} else {
lambdaisland.glogi.log.cljs$core$IFn$_invoke$arity$4("frontend.worker.rtc.remote-update",new cljs.core.Keyword(null,"info","info",-317069002),cljs.core.identity(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"ensure-refed-blocks-exist","ensure-refed-blocks-exist",-2129444193),refed_block,new cljs.core.Keyword(null,"line","line",212345235),553], null)),null);

if(cljs.core.truth_(new cljs.core.Keyword("block","name","block/name",1619760316).cljs$core$IFn$_invoke$arity$1(refed_block))){
frontend.worker.rtc.remote_update.apply_remote_update_page_ops(repo,conn,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(refed_block,new cljs.core.Keyword(null,"self","self",-1547428899),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(refed_block)),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552))], null));
} else {
frontend.worker.rtc.remote_update.apply_remote_move_ops(repo,conn,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(refed_block,new cljs.core.Keyword(null,"self","self",-1547428899),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(refed_block),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"parents","parents",-2027538891),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","parent","block/parent",-918309064).cljs$core$IFn$_invoke$arity$1(refed_block)], null)], 0)),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552))], null));
}
}


var G__187447 = cljs.core.next(seq__187248__$1);
var G__187448 = null;
var G__187449 = (0);
var G__187450 = (0);
seq__187248 = G__187447;
chunk__187249 = G__187448;
count__187250 = G__187449;
i__187251 = G__187450;
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
var G__187260 = new cljs.core.Keyword("rtc.log","apply-remote-update","rtc.log/apply-remote-update",-1307545458);
var G__187261 = new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"sub-type","sub-type",-997954412),new cljs.core.Keyword(null,"skip","skip",602715391),new cljs.core.Keyword(null,"remote-t","remote-t",-1375604239),remote_t,new cljs.core.Keyword(null,"local-t","local-t",-2128577077),local_tx], null);
return (add_log_fn.cljs$core$IFn$_invoke$arity$2 ? add_log_fn.cljs$core$IFn$_invoke$arity$2(G__187260,G__187261) : add_log_fn.call(null,G__187260,G__187261));
} else {
if((local_tx < remote_t_before)){
var G__187262_187451 = new cljs.core.Keyword("rtc.log","apply-remote-update","rtc.log/apply-remote-update",-1307545458);
var G__187263_187452 = new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"sub-type","sub-type",-997954412),new cljs.core.Keyword(null,"need-pull-remote-data","need-pull-remote-data",-832637362),new cljs.core.Keyword(null,"remote-t","remote-t",-1375604239),remote_t,new cljs.core.Keyword(null,"local-t","local-t",-2128577077),local_tx,new cljs.core.Keyword(null,"remote-t-before","remote-t-before",-1778889484),remote_t_before], null);
(add_log_fn.cljs$core$IFn$_invoke$arity$2 ? add_log_fn.cljs$core$IFn$_invoke$arity$2(G__187262_187451,G__187263_187452) : add_log_fn.call(null,G__187262_187451,G__187263_187452));

throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2("need pull earlier remote-data",new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"type","type",1174270348),new cljs.core.Keyword("frontend.worker.rtc.remote-update","need-pull-remote-data","frontend.worker.rtc.remote-update/need-pull-remote-data",-1524072067),new cljs.core.Keyword(null,"local-tx","local-tx",1729212201),local_tx], null));
} else {
if((((remote_t_before <= local_tx)) && ((local_tx <= remote_t)))){
var map__187264 = remote_update_data;
var map__187264__$1 = cljs.core.__destructure_map(map__187264);
var affected_blocks_map = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__187264__$1,new cljs.core.Keyword(null,"affected-blocks","affected-blocks",1873706240));
var refed_blocks = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__187264__$1,new cljs.core.Keyword(null,"refed-blocks","refed-blocks",1894942062));
var map__187265 = frontend.worker.rtc.remote_update.affected_blocks__GT_diff_type_ops(repo,affected_blocks_map);
var map__187265__$1 = cljs.core.__destructure_map(map__187265);
var remove_ops_map = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__187265__$1,new cljs.core.Keyword(null,"remove-ops-map","remove-ops-map",-223802527));
var move_ops_map = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__187265__$1,new cljs.core.Keyword(null,"move-ops-map","move-ops-map",827650136));
var update_ops_map = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__187265__$1,new cljs.core.Keyword(null,"update-ops-map","update-ops-map",1929446072));
var update_page_ops_map = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__187265__$1,new cljs.core.Keyword(null,"update-page-ops-map","update-page-ops-map",-705251299));
var remove_page_ops_map = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__187265__$1,new cljs.core.Keyword(null,"remove-page-ops-map","remove-page-ops-map",673661601));
var remove_ops = cljs.core.vals(remove_ops_map);
var sorted_move_ops = frontend.worker.rtc.remote_update.move_ops_map__GT_sorted_move_ops(move_ops_map);
var update_ops = cljs.core.vals(update_ops_map);
var update_page_ops = cljs.core.vals(update_page_ops_map);
var remove_page_ops = cljs.core.vals(remove_page_ops_map);
var db_before = cljs.core.deref(conn);
console.groupCollapsed("rtc/apply-remote-ops-log");

if((!((logseq.outliner.batch_tx.get_batch_db_before() == null)))){
if(cljs.core.truth_(goog.DEBUG)){
var k__43674__auto___187453 = new cljs.core.Keyword(null,"ensure-refed-blocks-exist","ensure-refed-blocks-exist",-2129444193);
console.time(k__43674__auto___187453);

var res__43675__auto___187454 = frontend.worker.rtc.remote_update.ensure_refed_blocks_exist(repo,conn,refed_blocks);
console.timeEnd(k__43674__auto___187453);

} else {
frontend.worker.rtc.remote_update.ensure_refed_blocks_exist(repo,conn,refed_blocks);
}

if(cljs.core.truth_(goog.DEBUG)){
var k__43674__auto___187455 = new cljs.core.Keyword(null,"apply-remote-update-page-ops","apply-remote-update-page-ops",-1428664455);
console.time(k__43674__auto___187455);

var res__43675__auto___187456 = frontend.worker.rtc.remote_update.apply_remote_update_page_ops(repo,conn,update_page_ops);
console.timeEnd(k__43674__auto___187455);

} else {
frontend.worker.rtc.remote_update.apply_remote_update_page_ops(repo,conn,update_page_ops);
}

if(cljs.core.truth_(goog.DEBUG)){
var k__43674__auto___187457 = new cljs.core.Keyword(null,"apply-remote-move-ops","apply-remote-move-ops",1600501517);
console.time(k__43674__auto___187457);

var res__43675__auto___187458 = frontend.worker.rtc.remote_update.apply_remote_move_ops(repo,conn,sorted_move_ops);
console.timeEnd(k__43674__auto___187457);

} else {
frontend.worker.rtc.remote_update.apply_remote_move_ops(repo,conn,sorted_move_ops);
}

if(cljs.core.truth_(goog.DEBUG)){
var k__43674__auto___187459 = new cljs.core.Keyword(null,"apply-remote-update-ops","apply-remote-update-ops",-38907266);
console.time(k__43674__auto___187459);

var res__43675__auto___187460 = frontend.worker.rtc.remote_update.apply_remote_update_ops(repo,conn,update_ops);
console.timeEnd(k__43674__auto___187459);

} else {
frontend.worker.rtc.remote_update.apply_remote_update_ops(repo,conn,update_ops);
}

if(cljs.core.truth_(goog.DEBUG)){
var k__43674__auto___187461 = new cljs.core.Keyword(null,"apply-remote-remove-page-ops","apply-remote-remove-page-ops",-917701158);
console.time(k__43674__auto___187461);

var res__43675__auto___187462 = frontend.worker.rtc.remote_update.apply_remote_remove_page_ops(repo,conn,remove_page_ops);
console.timeEnd(k__43674__auto___187461);

} else {
frontend.worker.rtc.remote_update.apply_remote_remove_page_ops(repo,conn,remove_page_ops);
}
} else {
try{var tx_meta__41780__auto___187463 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(cljs.core.dissoc.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"rtc-tx?","rtc-tx?",-82304745),true,new cljs.core.Keyword(null,"persist-op?","persist-op?",-531287534),false,new cljs.core.Keyword(null,"gen-undo-ops?","gen-undo-ops?",324292975),false,new cljs.core.Keyword("frontend.worker.pipeline","skip-store-conn","frontend.worker.pipeline/skip-store-conn",-1426692178),frontend.worker.rtc.const$.RTC_E2E_TEST], null),new cljs.core.Keyword(null,"additional-tx","additional-tx",-343057604),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"transact-opts","transact-opts",187283396)], 0)),new cljs.core.Keyword("batch-tx","batch-tx-mode?","batch-tx/batch-tx-mode?",1787753099),true);
logseq.outliner.batch_tx.set_batch_opts(tx_meta__41780__auto___187463);

logseq.outliner.batch_tx.set_batch_db_before_BANG_(cljs.core.deref(conn));

if(cljs.core.truth_(goog.DEBUG)){
var k__43674__auto___187464 = new cljs.core.Keyword(null,"ensure-refed-blocks-exist","ensure-refed-blocks-exist",-2129444193);
console.time(k__43674__auto___187464);

var res__43675__auto___187465 = frontend.worker.rtc.remote_update.ensure_refed_blocks_exist(repo,conn,refed_blocks);
console.timeEnd(k__43674__auto___187464);

} else {
frontend.worker.rtc.remote_update.ensure_refed_blocks_exist(repo,conn,refed_blocks);
}

if(cljs.core.truth_(goog.DEBUG)){
var k__43674__auto___187466 = new cljs.core.Keyword(null,"apply-remote-update-page-ops","apply-remote-update-page-ops",-1428664455);
console.time(k__43674__auto___187466);

var res__43675__auto___187467 = frontend.worker.rtc.remote_update.apply_remote_update_page_ops(repo,conn,update_page_ops);
console.timeEnd(k__43674__auto___187466);

} else {
frontend.worker.rtc.remote_update.apply_remote_update_page_ops(repo,conn,update_page_ops);
}

if(cljs.core.truth_(goog.DEBUG)){
var k__43674__auto___187468 = new cljs.core.Keyword(null,"apply-remote-move-ops","apply-remote-move-ops",1600501517);
console.time(k__43674__auto___187468);

var res__43675__auto___187469 = frontend.worker.rtc.remote_update.apply_remote_move_ops(repo,conn,sorted_move_ops);
console.timeEnd(k__43674__auto___187468);

} else {
frontend.worker.rtc.remote_update.apply_remote_move_ops(repo,conn,sorted_move_ops);
}

if(cljs.core.truth_(goog.DEBUG)){
var k__43674__auto___187470 = new cljs.core.Keyword(null,"apply-remote-update-ops","apply-remote-update-ops",-38907266);
console.time(k__43674__auto___187470);

var res__43675__auto___187471 = frontend.worker.rtc.remote_update.apply_remote_update_ops(repo,conn,update_ops);
console.timeEnd(k__43674__auto___187470);

} else {
frontend.worker.rtc.remote_update.apply_remote_update_ops(repo,conn,update_ops);
}

if(cljs.core.truth_(goog.DEBUG)){
var k__43674__auto___187472 = new cljs.core.Keyword(null,"apply-remote-remove-page-ops","apply-remote-remove-page-ops",-917701158);
console.time(k__43674__auto___187472);

var res__43675__auto___187473 = frontend.worker.rtc.remote_update.apply_remote_remove_page_ops(repo,conn,remove_page_ops);
console.timeEnd(k__43674__auto___187472);

} else {
frontend.worker.rtc.remote_update.apply_remote_remove_page_ops(repo,conn,remove_page_ops);
}

if(cljs.core.seq(null)){
logseq.db.transact_BANG_.cljs$core$IFn$_invoke$arity$3(conn,null,cljs.core.PersistentArrayMap.EMPTY);
} else {
}

var G__187267_187474 = conn;
var G__187268_187475 = cljs.core.PersistentVector.EMPTY;
var G__187269_187476 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("batch-tx","exit?","batch-tx/exit?",-2021083148),true], null);
(datascript.core.transact_BANG_.cljs$core$IFn$_invoke$arity$3 ? datascript.core.transact_BANG_.cljs$core$IFn$_invoke$arity$3(G__187267_187474,G__187268_187475,G__187269_187476) : datascript.core.transact_BANG_.call(null,G__187267_187474,G__187268_187475,G__187269_187476));

logseq.outliner.batch_tx.exit_batch_txs_mode_BANG_();
}catch (e187266){var e__41781__auto___187477 = e187266;
logseq.outliner.batch_tx.exit_batch_txs_mode_BANG_();

throw e__41781__auto___187477;
}}

if(cljs.core.truth_(goog.DEBUG)){
var k__43674__auto___187478 = new cljs.core.Keyword(null,"apply-remote-remove-ops","apply-remote-remove-ops",-1032543236);
console.time(k__43674__auto___187478);

var res__43675__auto___187479 = frontend.worker.rtc.remote_update.apply_remote_remove_ops(repo,conn,date_formatter,remove_ops);
console.timeEnd(k__43674__auto___187478);

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
