goog.provide('logseq.db');
if((typeof logseq !== 'undefined') && (typeof logseq.db !== 'undefined') && (typeof logseq.db._STAR_transact_fn !== 'undefined')){
} else {
logseq.db._STAR_transact_fn = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(null);
}
logseq.db.register_transact_fn_BANG_ = (function logseq$db$register_transact_fn_BANG_(f){
if(cljs.core.truth_(f)){
return cljs.core.reset_BANG_(logseq.db._STAR_transact_fn,f);
} else {
return null;
}
});
logseq.db.remove_temp_block_data = (function logseq$db$remove_temp_block_data(tx_data){
var remove_block_temp_f = (function (m){
return cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (p__154638){
var vec__154641 = p__154638;
var k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__154641,(0),null);
var _v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__154641,(1),null);
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("block.temp",cljs.core.namespace(k));
}),m));
});
return cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (m){
if(cljs.core.map_QMARK_(m)){
var G__154644 = remove_block_temp_f(m);
if(((cljs.core.seq(new cljs.core.Keyword("block","refs","block/refs",-1214495349).cljs$core$IFn$_invoke$arity$1(m))) && (cljs.core.every_QMARK_(cljs.core.map_QMARK_,new cljs.core.Keyword("block","refs","block/refs",-1214495349).cljs$core$IFn$_invoke$arity$1(m))))){
return cljs.core.update.cljs$core$IFn$_invoke$arity$3(G__154644,new cljs.core.Keyword("block","refs","block/refs",-1214495349),(function (refs){
return cljs.core.map.cljs$core$IFn$_invoke$arity$2(remove_block_temp_f,refs);
}));
} else {
return G__154644;
}
} else {
return m;
}
}),tx_data);
});
logseq.db.assert_no_entities = (function logseq$db$assert_no_entities(tx_data){
return clojure.walk.prewalk((function (f){
if(datascript.impl.entity.entity_QMARK_(f)){
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2("ldb/transact! doesn't support Entity",new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"entity","entity",-450970276),f,new cljs.core.Keyword(null,"tx-data","tx-data",934159761),tx_data], null));
} else {
return f;
}
}),tx_data);
});
/**
 * `repo-or-conn`: repo for UI thread and conn for worker/node
 */
logseq.db.transact_BANG_ = (function logseq$db$transact_BANG_(var_args){
var G__154649 = arguments.length;
switch (G__154649) {
case 2:
return logseq.db.transact_BANG_.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return logseq.db.transact_BANG_.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(logseq.db.transact_BANG_.cljs$core$IFn$_invoke$arity$2 = (function (repo_or_conn,tx_data){
return logseq.db.transact_BANG_.cljs$core$IFn$_invoke$arity$3(repo_or_conn,tx_data,null);
}));

(logseq.db.transact_BANG_.cljs$core$IFn$_invoke$arity$3 = (function (repo_or_conn,tx_data,tx_meta){
if(cljs.core.truth_((function (){var or__5002__auto__ = (typeof process !== 'undefined');
if(or__5002__auto__){
return or__5002__auto__;
} else {
var and__5000__auto__ = (typeof goog !== 'undefined');
if(and__5000__auto__){
return goog.DEBUG;
} else {
return and__5000__auto__;
}
}
})())){
logseq.db.assert_no_entities(tx_data);
} else {
}

var tx_data__$1 = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (m){
if(cljs.core.map_QMARK_(m)){
return cljs.core.dissoc.cljs$core$IFn$_invoke$arity$variadic(m,new cljs.core.Keyword("block","children","block/children",-1040716209),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("block","meta","block/meta",1064819153),new cljs.core.Keyword("block","top?","block/top?",-1838733025),new cljs.core.Keyword("block","bottom?","block/bottom?",-1886197289),new cljs.core.Keyword("block","anchor","block/anchor",1325786860),new cljs.core.Keyword("block","level","block/level",1182509971),new cljs.core.Keyword("block","container","block/container",510671002),new cljs.core.Keyword("db","other-tx","db/other-tx",337296620),new cljs.core.Keyword("block","unordered","block/unordered",-772044101)], 0));
} else {
return m;
}
}),tx_data);
var tx_data__$2 = cljs.core.remove.cljs$core$IFn$_invoke$arity$2(cljs.core.empty_QMARK_,logseq.common.util.fast_remove_nils(logseq.db.remove_temp_block_data(tx_data__$1)));
var delete_blocks_tx = ((typeof repo_or_conn === 'string')?null:logseq.db.common.delete_blocks.update_refs_history_and_macros(cljs.core.deref(repo_or_conn),tx_data__$2,tx_meta));
var tx_data__$3 = cljs.core.concat.cljs$core$IFn$_invoke$arity$2(tx_data__$2,delete_blocks_tx);
if(cljs.core.truth_((function (){var or__5002__auto__ = cljs.core.seq(tx_data__$3);
if(or__5002__auto__){
return or__5002__auto__;
} else {
return new cljs.core.Keyword(null,"db-persist?","db-persist?",-380897508).cljs$core$IFn$_invoke$arity$1(tx_meta);
}
})())){
var f = (function (){var or__5002__auto__ = cljs.core.deref(logseq.db._STAR_transact_fn);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return datascript.core.transact_BANG_;
}
})();
try{return (f.cljs$core$IFn$_invoke$arity$3 ? f.cljs$core$IFn$_invoke$arity$3(repo_or_conn,tx_data__$3,tx_meta) : f.call(null,repo_or_conn,tx_data__$3,tx_meta));
}catch (e154650){var e = e154650;
console.trace();

cljs.core.prn.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"debug-tx-data","debug-tx-data",1907118992),tx_data__$3], 0));

throw e;
}} else {
return null;
}
}));

(logseq.db.transact_BANG_.cljs$lang$maxFixedArity = 3);

logseq.db.page_QMARK_ = logseq.db.common.entity_util.page_QMARK_;
logseq.db.internal_page_QMARK_ = logseq.db.frontend.entity_util.internal_page_QMARK_;
logseq.db.class_QMARK_ = logseq.db.frontend.entity_util.class_QMARK_;
logseq.db.property_QMARK_ = logseq.db.frontend.entity_util.property_QMARK_;
logseq.db.closed_value_QMARK_ = logseq.db.frontend.entity_util.closed_value_QMARK_;
logseq.db.whiteboard_QMARK_ = logseq.db.common.entity_util.whiteboard_QMARK_;
logseq.db.journal_QMARK_ = logseq.db.common.entity_util.journal_QMARK_;
logseq.db.hidden_QMARK_ = logseq.db.frontend.entity_util.hidden_QMARK_;
logseq.db.object_QMARK_ = logseq.db.frontend.entity_util.object_QMARK_;
logseq.db.asset_QMARK_ = logseq.db.frontend.entity_util.asset_QMARK_;
logseq.db.public_built_in_property_QMARK_ = logseq.db.frontend.property.public_built_in_property_QMARK_;
logseq.db.get_entity_types = logseq.db.frontend.entity_util.get_entity_types;
logseq.db.internal_tags = logseq.db.frontend.class$.internal_tags;
logseq.db.private_tags = logseq.db.frontend.class$.private_tags;
logseq.db.hidden_tags = logseq.db.frontend.class$.hidden_tags;
logseq.db.sort_by_order = (function logseq$db$sort_by_order(blocks){
return cljs.core.sort_by.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","order","block/order",-1429282437),blocks);
});
logseq.db.get_block_and_children_aux = (function logseq$db$get_block_and_children_aux(var_args){
var args__5732__auto__ = [];
var len__5726__auto___154827 = arguments.length;
var i__5727__auto___154828 = (0);
while(true){
if((i__5727__auto___154828 < len__5726__auto___154827)){
args__5732__auto__.push((arguments[i__5727__auto___154828]));

var G__154829 = (i__5727__auto___154828 + (1));
i__5727__auto___154828 = G__154829;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return logseq.db.get_block_and_children_aux.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(logseq.db.get_block_and_children_aux.cljs$core$IFn$_invoke$arity$variadic = (function (entity,p__154657){
var map__154658 = p__154657;
var map__154658__$1 = cljs.core.__destructure_map(map__154658);
var opts = map__154658__$1;
var include_property_block_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__154658__$1,new cljs.core.Keyword(null,"include-property-block?","include-property-block?",-211563499),false);
var temp__5802__auto__ = logseq.db.sort_by_order((cljs.core.truth_(include_property_block_QMARK_)?new cljs.core.Keyword("block","_raw-parent","block/_raw-parent",628025875).cljs$core$IFn$_invoke$arity$1(entity):new cljs.core.Keyword("block","_parent","block/_parent",-639389670).cljs$core$IFn$_invoke$arity$1(entity)));
if(cljs.core.truth_(temp__5802__auto__)){
var children = temp__5802__auto__;
return cljs.core.cons(entity,cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (p1__154654_SHARP_){
return logseq.db.get_block_and_children_aux.cljs$core$IFn$_invoke$arity$variadic(p1__154654_SHARP_,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([opts], 0));
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([children], 0)));
} else {
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [entity], null);
}
}));

(logseq.db.get_block_and_children_aux.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(logseq.db.get_block_and_children_aux.cljs$lang$applyTo = (function (seq154655){
var G__154656 = cljs.core.first(seq154655);
var seq154655__$1 = cljs.core.next(seq154655);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__154656,seq154655__$1);
}));

logseq.db.get_block_and_children = (function logseq$db$get_block_and_children(var_args){
var args__5732__auto__ = [];
var len__5726__auto___154835 = arguments.length;
var i__5727__auto___154836 = (0);
while(true){
if((i__5727__auto___154836 < len__5726__auto___154835)){
args__5732__auto__.push((arguments[i__5727__auto___154836]));

var G__154837 = (i__5727__auto___154836 + (1));
i__5727__auto___154836 = G__154837;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((2) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((2)),(0),null)):null);
return logseq.db.get_block_and_children.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),(arguments[(1)]),argseq__5733__auto__);
});

(logseq.db.get_block_and_children.cljs$core$IFn$_invoke$arity$variadic = (function (db,block_uuid,p__154662){
var map__154663 = p__154662;
var map__154663__$1 = cljs.core.__destructure_map(map__154663);
var opts = map__154663__$1;
var temp__5804__auto__ = (function (){var G__154664 = db;
var G__154665 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_uuid], null);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__154664,G__154665) : datascript.core.entity.call(null,G__154664,G__154665));
})();
if(cljs.core.truth_(temp__5804__auto__)){
var e = temp__5804__auto__;
return logseq.db.get_block_and_children_aux.cljs$core$IFn$_invoke$arity$variadic(e,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([opts], 0));
} else {
return null;
}
}));

(logseq.db.get_block_and_children.cljs$lang$maxFixedArity = (2));

/** @this {Function} */
(logseq.db.get_block_and_children.cljs$lang$applyTo = (function (seq154659){
var G__154660 = cljs.core.first(seq154659);
var seq154659__$1 = cljs.core.next(seq154659);
var G__154661 = cljs.core.first(seq154659__$1);
var seq154659__$2 = cljs.core.next(seq154659__$1);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__154660,G__154661,seq154659__$2);
}));

/**
 * Return blocks of the designated page, without using cache.
 * page-id - eid
 */
logseq.db.get_page_blocks = (function logseq$db$get_page_blocks(var_args){
var args__5732__auto__ = [];
var len__5726__auto___154853 = arguments.length;
var i__5727__auto___154854 = (0);
while(true){
if((i__5727__auto___154854 < len__5726__auto___154853)){
args__5732__auto__.push((arguments[i__5727__auto___154854]));

var G__154855 = (i__5727__auto___154854 + (1));
i__5727__auto___154854 = G__154855;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((2) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((2)),(0),null)):null);
return logseq.db.get_page_blocks.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),(arguments[(1)]),argseq__5733__auto__);
});

(logseq.db.get_page_blocks.cljs$core$IFn$_invoke$arity$variadic = (function (db,page_id,p__154669){
var map__154670 = p__154669;
var map__154670__$1 = cljs.core.__destructure_map(map__154670);
var pull_keys = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__154670__$1,new cljs.core.Keyword(null,"pull-keys","pull-keys",-768938808),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"*","*",345799209,null)], null));
if(cljs.core.truth_(page_id)){
var datoms = datascript.core.datoms.cljs$core$IFn$_invoke$arity$4(db,new cljs.core.Keyword(null,"avet","avet",1383857032),new cljs.core.Keyword("block","page","block/page",822314108),page_id);
var block_eids = cljs.core.mapv.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"e","e",1381269198),datoms);
return (datascript.core.pull_many.cljs$core$IFn$_invoke$arity$3 ? datascript.core.pull_many.cljs$core$IFn$_invoke$arity$3(db,pull_keys,block_eids) : datascript.core.pull_many.call(null,db,pull_keys,block_eids));
} else {
return null;
}
}));

(logseq.db.get_page_blocks.cljs$lang$maxFixedArity = (2));

/** @this {Function} */
(logseq.db.get_page_blocks.cljs$lang$applyTo = (function (seq154666){
var G__154667 = cljs.core.first(seq154666);
var seq154666__$1 = cljs.core.next(seq154666);
var G__154668 = cljs.core.first(seq154666__$1);
var seq154666__$2 = cljs.core.next(seq154666__$1);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__154667,G__154668,seq154666__$2);
}));

logseq.db.get_page_blocks_count = (function logseq$db$get_page_blocks_count(db,page_id){
return cljs.core.count(datascript.core.datoms.cljs$core$IFn$_invoke$arity$4(db,new cljs.core.Keyword(null,"avet","avet",1383857032),new cljs.core.Keyword("block","page","block/page",822314108),page_id));
});
logseq.db.get_block_children_or_property_children = (function logseq$db$get_block_children_or_property_children(block,parent){
var from_property = new cljs.core.Keyword("logseq.property","created-from-property","logseq.property/created-from-property",-861892267).cljs$core$IFn$_invoke$arity$1(block);
var closed_property = new cljs.core.Keyword("block","closed-value-property","block/closed-value-property",1157792813).cljs$core$IFn$_invoke$arity$1(block);
return logseq.db.sort_by_order((cljs.core.truth_(closed_property)?new cljs.core.Keyword("property","closed-values","property/closed-values",1261280952).cljs$core$IFn$_invoke$arity$1(closed_property):(cljs.core.truth_(from_property)?cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (e){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("logseq.property","created-from-property","logseq.property/created-from-property",-861892267).cljs$core$IFn$_invoke$arity$1(e)),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(from_property));
}),new cljs.core.Keyword("block","_raw-parent","block/_raw-parent",628025875).cljs$core$IFn$_invoke$arity$1(parent)):new cljs.core.Keyword("block","_parent","block/_parent",-639389670).cljs$core$IFn$_invoke$arity$1(parent)
)));
});
logseq.db.get_right_sibling = (function logseq$db$get_right_sibling(block){
if(((datascript.impl.entity.entity_QMARK_(block)) || ((block == null)))){
} else {
throw (new Error("Assert failed: (or (de/entity? block) (nil? block))"));
}

var temp__5804__auto__ = new cljs.core.Keyword("block","parent","block/parent",-918309064).cljs$core$IFn$_invoke$arity$1(block);
if(cljs.core.truth_(temp__5804__auto__)){
var parent = temp__5804__auto__;
var children = logseq.db.get_block_children_or_property_children(block,parent);
var right = cljs.core.some((function (child){
if((cljs.core.compare(new cljs.core.Keyword("block","order","block/order",-1429282437).cljs$core$IFn$_invoke$arity$1(child),new cljs.core.Keyword("block","order","block/order",-1429282437).cljs$core$IFn$_invoke$arity$1(block)) > (0))){
return child;
} else {
return null;
}
}),children);
if(cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(right),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block))){
return right;
} else {
return null;
}
} else {
return null;
}
});
logseq.db.get_left_sibling = (function logseq$db$get_left_sibling(block){
if(((datascript.impl.entity.entity_QMARK_(block)) || ((block == null)))){
} else {
throw (new Error("Assert failed: (or (de/entity? block) (nil? block))"));
}

var temp__5804__auto__ = new cljs.core.Keyword("block","parent","block/parent",-918309064).cljs$core$IFn$_invoke$arity$1(block);
if(cljs.core.truth_(temp__5804__auto__)){
var parent = temp__5804__auto__;
var children = cljs.core.reverse(logseq.db.get_block_children_or_property_children(block,parent));
var left = cljs.core.some((function (child){
if((cljs.core.compare(new cljs.core.Keyword("block","order","block/order",-1429282437).cljs$core$IFn$_invoke$arity$1(child),new cljs.core.Keyword("block","order","block/order",-1429282437).cljs$core$IFn$_invoke$arity$1(block)) < (0))){
return child;
} else {
return null;
}
}),children);
if(cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(left),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block))){
return left;
} else {
return null;
}
} else {
return null;
}
});
logseq.db.get_down = (function logseq$db$get_down(block){
if(((datascript.impl.entity.entity_QMARK_(block)) || ((block == null)))){
} else {
throw (new Error("Assert failed: (or (de/entity? block) (nil? block))"));
}

return cljs.core.first(logseq.db.sort_by_order(new cljs.core.Keyword("block","_parent","block/_parent",-639389670).cljs$core$IFn$_invoke$arity$1(block)));
});
logseq.db.get_pages = (function logseq$db$get_pages(db){
return cljs.core.remove.cljs$core$IFn$_invoke$arity$2(logseq.db.hidden_QMARK_,cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.first,(function (){var G__154686 = new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"find","find",496279456),new cljs.core.Symbol(null,"?page-title","?page-title",-2070092934,null),new cljs.core.Keyword(null,"where","where",-2044795965),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?page","?page",-1343187612,null),new cljs.core.Keyword("block","name","block/name",1619760316),new cljs.core.Symbol(null,"?page-name","?page-name",-1643414076,null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.list(new cljs.core.Symbol(null,"get-else","get-else",1312024065,null),new cljs.core.Symbol(null,"$","$",-1580747756,null),new cljs.core.Symbol(null,"?page","?page",-1343187612,null),new cljs.core.Keyword("block","title","block/title",710445684),new cljs.core.Symbol(null,"?page-name","?page-name",-1643414076,null)),new cljs.core.Symbol(null,"?page-title","?page-title",-2070092934,null)], null)], null);
var G__154687 = db;
return (datascript.core.q.cljs$core$IFn$_invoke$arity$2 ? datascript.core.q.cljs$core$IFn$_invoke$arity$2(G__154686,G__154687) : datascript.core.q.call(null,G__154686,G__154687));
})()));
});
logseq.db.get_first_page_by_name = logseq.db.common.initial_data.get_first_page_by_name;
logseq.db.db_based_graph_QMARK_ = logseq.db.common.entity_plus.db_based_graph_QMARK_;
/**
 * Returns truthy value if page exists.
 * For db graphs, returns all page db ids that given title and one of the given `tags`.
 * For file graphs, returns page entity if it exists
 */
logseq.db.page_exists_QMARK_ = (function logseq$db$page_exists_QMARK_(db,page_name,tags){
if(cljs.core.truth_(page_name)){
if(cljs.core.truth_((logseq.db.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(db) : logseq.db.db_based_graph_QMARK_.call(null,db)))){
var tags_SINGLEQUOTE_ = ((cljs.core.coll_QMARK_(tags))?cljs.core.set(tags):cljs.core.PersistentHashSet.createAsIfByAssoc([tags]));
if(((cljs.core.seq(tags_SINGLEQUOTE_)) && (cljs.core.every_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("logseq.class","Property","logseq.class/Property",1038767048),null,new cljs.core.Keyword("logseq.class","Tag","logseq.class/Tag",-538902083),null], null), null),tags_SINGLEQUOTE_)))){
return cljs.core.seq((function (){var G__154698 = new cljs.core.PersistentVector(null, 10, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"find","find",496279456),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?p","?p",-10896580,null),new cljs.core.Symbol(null,"...","...",-1926939749,null)], null),new cljs.core.Keyword(null,"in","in",-1531184865),new cljs.core.Symbol(null,"$","$",-1580747756,null),new cljs.core.Symbol(null,"?name","?name",2050703390,null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?tag-ident","?tag-ident",-1384320875,null),new cljs.core.Symbol(null,"...","...",-1926939749,null)], null),new cljs.core.Keyword(null,"where","where",-2044795965),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?p","?p",-10896580,null),new cljs.core.Keyword("block","title","block/title",710445684),new cljs.core.Symbol(null,"?name","?name",2050703390,null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?p","?p",-10896580,null),new cljs.core.Keyword("block","tags","block/tags",1814948340),new cljs.core.Symbol(null,"?tag","?tag",157764474,null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?tag","?tag",157764474,null),new cljs.core.Keyword("db","ident","db/ident",-737096),new cljs.core.Symbol(null,"?tag-ident","?tag-ident",-1384320875,null)], null)], null);
var G__154699 = db;
var G__154700 = page_name;
var G__154701 = tags_SINGLEQUOTE_;
return (datascript.core.q.cljs$core$IFn$_invoke$arity$4 ? datascript.core.q.cljs$core$IFn$_invoke$arity$4(G__154698,G__154699,G__154700,G__154701) : datascript.core.q.call(null,G__154698,G__154699,G__154700,G__154701));
})());
} else {
return cljs.core.seq((function (){var G__154703 = new cljs.core.PersistentVector(null, 10, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"find","find",496279456),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?p","?p",-10896580,null),new cljs.core.Symbol(null,"...","...",-1926939749,null)], null),new cljs.core.Keyword(null,"in","in",-1531184865),new cljs.core.Symbol(null,"$","$",-1580747756,null),new cljs.core.Symbol(null,"?name","?name",2050703390,null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?tag-ident","?tag-ident",-1384320875,null),new cljs.core.Symbol(null,"...","...",-1926939749,null)], null),new cljs.core.Keyword(null,"where","where",-2044795965),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?p","?p",-10896580,null),new cljs.core.Keyword("block","name","block/name",1619760316),new cljs.core.Symbol(null,"?name","?name",2050703390,null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?p","?p",-10896580,null),new cljs.core.Keyword("block","tags","block/tags",1814948340),new cljs.core.Symbol(null,"?tag","?tag",157764474,null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?tag","?tag",157764474,null),new cljs.core.Keyword("db","ident","db/ident",-737096),new cljs.core.Symbol(null,"?tag-ident","?tag-ident",-1384320875,null)], null)], null);
var G__154704 = db;
var G__154705 = logseq.common.util.page_name_sanity_lc(page_name);
var G__154706 = tags_SINGLEQUOTE_;
return (datascript.core.q.cljs$core$IFn$_invoke$arity$4 ? datascript.core.q.cljs$core$IFn$_invoke$arity$4(G__154703,G__154704,G__154705,G__154706) : datascript.core.q.call(null,G__154703,G__154704,G__154705,G__154706));
})());
}
} else {
var G__154711 = db;
var G__154712 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","name","block/name",1619760316),logseq.common.util.page_name_sanity_lc(page_name)], null);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__154711,G__154712) : datascript.core.entity.call(null,G__154711,G__154712));
}
} else {
return null;
}
});
/**
 * Get a page given its unsanitized name
 */
logseq.db.get_page = (function logseq$db$get_page(db,page_id_name_or_uuid){
if(cljs.core.truth_(db)){
if(typeof page_id_name_or_uuid === 'number'){
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db,page_id_name_or_uuid) : datascript.core.entity.call(null,db,page_id_name_or_uuid));
} else {
var temp__5802__auto__ = ((cljs.core.uuid_QMARK_(page_id_name_or_uuid))?page_id_name_or_uuid:cljs.core.parse_uuid(page_id_name_or_uuid));
if(cljs.core.truth_(temp__5802__auto__)){
var id = temp__5802__auto__;
var G__154719 = db;
var G__154720 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),id], null);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__154719,G__154720) : datascript.core.entity.call(null,G__154719,G__154720));
} else {
var G__154722 = db;
var G__154723 = (function (){var G__154724 = db;
var G__154725 = cljs.core.name(page_id_name_or_uuid);
return (logseq.db.get_first_page_by_name.cljs$core$IFn$_invoke$arity$2 ? logseq.db.get_first_page_by_name.cljs$core$IFn$_invoke$arity$2(G__154724,G__154725) : logseq.db.get_first_page_by_name.call(null,G__154724,G__154725));
})();
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__154722,G__154723) : datascript.core.entity.call(null,G__154722,G__154723));
}
}
} else {
return null;
}
});
/**
 * Case sensitive version of get-page. For use with DB graphs
 */
logseq.db.get_case_page = (function logseq$db$get_case_page(db,page_name_or_uuid){
if(cljs.core.truth_(db)){
var temp__5802__auto__ = ((cljs.core.uuid_QMARK_(page_name_or_uuid))?page_name_or_uuid:cljs.core.parse_uuid(page_name_or_uuid));
if(cljs.core.truth_(temp__5802__auto__)){
var id = temp__5802__auto__;
var G__154732 = db;
var G__154733 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),id], null);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__154732,G__154733) : datascript.core.entity.call(null,G__154732,G__154733));
} else {
var G__154734 = db;
var G__154735 = logseq.db.common.initial_data.get_first_page_by_title(db,page_name_or_uuid);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__154734,G__154735) : datascript.core.entity.call(null,G__154734,G__154735));
}
} else {
return null;
}
});
/**
 * Whether a page is empty. Does it has a non-page block?
 *   `page-id` could be either a string or a db/id.
 */
logseq.db.page_empty_QMARK_ = (function logseq$db$page_empty_QMARK_(db,page_id){
var page_id__$1 = ((typeof page_id === 'string')?(logseq.db.get_first_page_by_name.cljs$core$IFn$_invoke$arity$2 ? logseq.db.get_first_page_by_name.cljs$core$IFn$_invoke$arity$2(db,page_id) : logseq.db.get_first_page_by_name.call(null,db,page_id)):page_id);
var page = (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db,page_id__$1) : datascript.core.entity.call(null,db,page_id__$1));
return cljs.core.empty_QMARK_(new cljs.core.Keyword("block","_parent","block/_parent",-639389670).cljs$core$IFn$_invoke$arity$1(page));
});
logseq.db.get_first_child = (function logseq$db$get_first_child(db,id){
return cljs.core.first(logseq.db.sort_by_order(new cljs.core.Keyword("block","_parent","block/_parent",-639389670).cljs$core$IFn$_invoke$arity$1((datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db,id) : datascript.core.entity.call(null,db,id)))));
});
logseq.db.get_orphaned_pages = (function logseq$db$get_orphaned_pages(db,p__154748){
var map__154749 = p__154748;
var map__154749__$1 = cljs.core.__destructure_map(map__154749);
var pages = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__154749__$1,new cljs.core.Keyword(null,"pages","pages",-285406513));
var empty_ref_f = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__154749__$1,new cljs.core.Keyword(null,"empty-ref-f","empty-ref-f",666507359),(function (page){
return (cljs.core.count(new cljs.core.Keyword("block","_refs","block/_refs",830218531).cljs$core$IFn$_invoke$arity$1(page)) === (0));
}));
var built_in_pages_names = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__154749__$1,new cljs.core.Keyword(null,"built-in-pages-names","built-in-pages-names",-104089994),cljs.core.PersistentHashSet.EMPTY);
var pages__$1 = cljs.core.remove.cljs$core$IFn$_invoke$arity$2(cljs.core.nil_QMARK_,(function (){var or__5002__auto__ = pages;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return logseq.db.get_pages(db);
}
})());
var built_in_pages = cljs.core.set(cljs.core.map.cljs$core$IFn$_invoke$arity$2(clojure.string.lower_case,built_in_pages_names));
var orphaned_pages = cljs.core.remove.cljs$core$IFn$_invoke$arity$2(logseq.db.hidden_QMARK_,cljs.core.remove.cljs$core$IFn$_invoke$arity$2(cljs.core.nil_QMARK_,cljs.core.remove.cljs$core$IFn$_invoke$arity$2(cljs.core.false_QMARK_,cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (page){
var temp__5804__auto__ = logseq.db.get_page(db,page);
if(cljs.core.truth_(temp__5804__auto__)){
var page__$1 = temp__5804__auto__;
var name_SINGLEQUOTE_ = new cljs.core.Keyword("block","name","block/name",1619760316).cljs$core$IFn$_invoke$arity$1(page__$1);
var and__5000__auto__ = (empty_ref_f.cljs$core$IFn$_invoke$arity$1 ? empty_ref_f.cljs$core$IFn$_invoke$arity$1(page__$1) : empty_ref_f.call(null,page__$1));
if(cljs.core.truth_(and__5000__auto__)){
var and__5000__auto____$1 = (function (){var or__5002__auto__ = logseq.db.page_empty_QMARK_(db,new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(page__$1));
if(or__5002__auto__){
return or__5002__auto__;
} else {
var first_child = logseq.db.get_first_child(db,new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(page__$1));
var children = new cljs.core.Keyword("block","_page","block/_page",1150043350).cljs$core$IFn$_invoke$arity$1(page__$1);
var and__5000__auto____$1 = first_child;
if(cljs.core.truth_(and__5000__auto____$1)){
return ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2((1),cljs.core.count(children))) && (cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 3, ["",null,"*",null,"-",null], null), null),clojure.string.trim(new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(first_child)))));
} else {
return and__5000__auto____$1;
}
}
})();
if(cljs.core.truth_(and__5000__auto____$1)){
var and__5000__auto____$2 = (!(cljs.core.contains_QMARK_(built_in_pages,name_SINGLEQUOTE_)));
if(and__5000__auto____$2){
var and__5000__auto____$3 = cljs.core.not((logseq.db.whiteboard_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.whiteboard_QMARK_.cljs$core$IFn$_invoke$arity$1(page__$1) : logseq.db.whiteboard_QMARK_.call(null,page__$1)));
if(and__5000__auto____$3){
var and__5000__auto____$4 = cljs.core.not(new cljs.core.Keyword("block","_namespace","block/_namespace",1151541806).cljs$core$IFn$_invoke$arity$1(page__$1));
if(and__5000__auto____$4){
var and__5000__auto____$5 = cljs.core.not((logseq.db.property_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.property_QMARK_.cljs$core$IFn$_invoke$arity$1(page__$1) : logseq.db.property_QMARK_.call(null,page__$1)));
if(and__5000__auto____$5){
var and__5000__auto____$6 = (!(((clojure.string.includes_QMARK_(name_SINGLEQUOTE_,"/")) && (cljs.core.not((logseq.db.journal_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.journal_QMARK_.cljs$core$IFn$_invoke$arity$1(page__$1) : logseq.db.journal_QMARK_.call(null,page__$1)))))));
if(and__5000__auto____$6){
var and__5000__auto____$7 = cljs.core.not(new cljs.core.Keyword("block","properties","block/properties",708347145).cljs$core$IFn$_invoke$arity$1(page__$1));
if(and__5000__auto____$7){
return page__$1;
} else {
return and__5000__auto____$7;
}
} else {
return and__5000__auto____$6;
}
} else {
return and__5000__auto____$5;
}
} else {
return and__5000__auto____$4;
}
} else {
return and__5000__auto____$3;
}
} else {
return and__5000__auto____$2;
}
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
} else {
return null;
}
}),pages__$1))));
return orphaned_pages;
});
logseq.db.has_children_QMARK_ = (function logseq$db$has_children_QMARK_(db,block_id){
var eid = ((cljs.core.uuid_QMARK_(block_id))?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_id], null):block_id);
return (!((new cljs.core.Keyword("block","_parent","block/_parent",-639389670).cljs$core$IFn$_invoke$arity$1((datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db,eid) : datascript.core.entity.call(null,db,eid))) == null)));
});
logseq.db.collapsed_and_has_children_QMARK_ = (function logseq$db$collapsed_and_has_children_QMARK_(db,block){
var and__5000__auto__ = new cljs.core.Keyword("block","collapsed?","block/collapsed?",2140210991).cljs$core$IFn$_invoke$arity$1(block);
if(cljs.core.truth_(and__5000__auto__)){
return logseq.db.has_children_QMARK_(db,new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block));
} else {
return and__5000__auto__;
}
});
/**
 * Notice: if `not-collapsed?` is true, will skip searching for any collapsed block.
 */
logseq.db.get_block_last_direct_child_id = (function logseq$db$get_block_last_direct_child_id(var_args){
var G__154763 = arguments.length;
switch (G__154763) {
case 2:
return logseq.db.get_block_last_direct_child_id.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return logseq.db.get_block_last_direct_child_id.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(logseq.db.get_block_last_direct_child_id.cljs$core$IFn$_invoke$arity$2 = (function (db,db_id){
return logseq.db.get_block_last_direct_child_id.cljs$core$IFn$_invoke$arity$3(db,db_id,false);
}));

(logseq.db.get_block_last_direct_child_id.cljs$core$IFn$_invoke$arity$3 = (function (db,db_id,not_collapsed_QMARK_){
var temp__5804__auto__ = (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db,db_id) : datascript.core.entity.call(null,db,db_id));
if(cljs.core.truth_(temp__5804__auto__)){
var block = temp__5804__auto__;
if((cljs.core.truth_(not_collapsed_QMARK_)?cljs.core.not(logseq.db.collapsed_and_has_children_QMARK_(db,block)):true)){
var children = cljs.core.sort_by.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","order","block/order",-1429282437),new cljs.core.Keyword("block","_parent","block/_parent",-639389670).cljs$core$IFn$_invoke$arity$1(block));
return new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(cljs.core.last(children));
} else {
return null;
}
} else {
return null;
}
}));

(logseq.db.get_block_last_direct_child_id.cljs$lang$maxFixedArity = 3);

/**
 * Doesn't include nested children.
 */
logseq.db.get_children = (function logseq$db$get_children(var_args){
var G__154765 = arguments.length;
switch (G__154765) {
case 1:
return logseq.db.get_children.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return logseq.db.get_children.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(logseq.db.get_children.cljs$core$IFn$_invoke$arity$1 = (function (block_entity){
return logseq.db.get_children.cljs$core$IFn$_invoke$arity$2(null,block_entity);
}));

(logseq.db.get_children.cljs$core$IFn$_invoke$arity$2 = (function (db,block_entity_or_eid){
var temp__5804__auto__ = ((typeof block_entity_or_eid === 'number')?(datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db,block_entity_or_eid) : datascript.core.entity.call(null,db,block_entity_or_eid)):((cljs.core.uuid_QMARK_(block_entity_or_eid))?(function (){var G__154773 = db;
var G__154774 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_entity_or_eid], null);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__154773,G__154774) : datascript.core.entity.call(null,G__154773,G__154774));
})():block_entity_or_eid
));
if(cljs.core.truth_(temp__5804__auto__)){
var parent = temp__5804__auto__;
return logseq.db.sort_by_order(new cljs.core.Keyword("block","_parent","block/_parent",-639389670).cljs$core$IFn$_invoke$arity$1(parent));
} else {
return null;
}
}));

(logseq.db.get_children.cljs$lang$maxFixedArity = 2);

logseq.db.get_block_parents = (function logseq$db$get_block_parents(var_args){
var args__5732__auto__ = [];
var len__5726__auto___154949 = arguments.length;
var i__5727__auto___154950 = (0);
while(true){
if((i__5727__auto___154950 < len__5726__auto___154949)){
args__5732__auto__.push((arguments[i__5727__auto___154950]));

var G__154951 = (i__5727__auto___154950 + (1));
i__5727__auto___154950 = G__154951;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((2) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((2)),(0),null)):null);
return logseq.db.get_block_parents.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),(arguments[(1)]),argseq__5733__auto__);
});

(logseq.db.get_block_parents.cljs$core$IFn$_invoke$arity$variadic = (function (db,block_id,p__154794){
var map__154799 = p__154794;
var map__154799__$1 = cljs.core.__destructure_map(map__154799);
var depth = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__154799__$1,new cljs.core.Keyword(null,"depth","depth",1768663640),(100));
var block_id__$1 = block_id;
var parents_SINGLEQUOTE_ = cljs.core.List.EMPTY;
var d = (1);
while(true){
if((d > depth)){
return parents_SINGLEQUOTE_;
} else {
var temp__5802__auto__ = new cljs.core.Keyword("block","parent","block/parent",-918309064).cljs$core$IFn$_invoke$arity$1((function (){var G__154800 = db;
var G__154801 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_id__$1], null);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__154800,G__154801) : datascript.core.entity.call(null,G__154800,G__154801));
})());
if(cljs.core.truth_(temp__5802__auto__)){
var parent = temp__5802__auto__;
var G__154955 = new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(parent);
var G__154956 = cljs.core.conj.cljs$core$IFn$_invoke$arity$2(parents_SINGLEQUOTE_,parent);
var G__154957 = (d + (1));
block_id__$1 = G__154955;
parents_SINGLEQUOTE_ = G__154956;
d = G__154957;
continue;
} else {
return parents_SINGLEQUOTE_;
}
}
break;
}
}));

(logseq.db.get_block_parents.cljs$lang$maxFixedArity = (2));

/** @this {Function} */
(logseq.db.get_block_parents.cljs$lang$applyTo = (function (seq154782){
var G__154783 = cljs.core.first(seq154782);
var seq154782__$1 = cljs.core.next(seq154782);
var G__154785 = cljs.core.first(seq154782__$1);
var seq154782__$2 = cljs.core.next(seq154782__$1);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__154783,G__154785,seq154782__$2);
}));

logseq.db.get_block_children_ids = logseq.db.common.initial_data.get_block_children_ids;
logseq.db.get_block_children = logseq.db.common.initial_data.get_block_children;
logseq.db.get_sorted_page_block_ids = (function logseq$db$get_sorted_page_block_ids(db,page_id){
var root = (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db,page_id) : datascript.core.entity.call(null,db,page_id));
var result = cljs.core.PersistentVector.EMPTY;
var children = logseq.db.sort_by_order(new cljs.core.Keyword("block","_parent","block/_parent",-639389670).cljs$core$IFn$_invoke$arity$1(root));
while(true){
if(cljs.core.seq(children)){
var child = cljs.core.first(children);
var G__154960 = cljs.core.conj.cljs$core$IFn$_invoke$arity$2(result,new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(child));
var G__154961 = cljs.core.concat.cljs$core$IFn$_invoke$arity$2(logseq.db.sort_by_order(new cljs.core.Keyword("block","_parent","block/_parent",-639389670).cljs$core$IFn$_invoke$arity$1(child)),cljs.core.rest(children));
result = G__154960;
children = G__154961;
continue;
} else {
return result;
}
break;
}
});
/**
 * Blocks could be non consecutive.
 */
logseq.db.sort_page_random_blocks = (function logseq$db$sort_page_random_blocks(db,blocks){
if(cljs.core.every_QMARK_((function (p1__154802_SHARP_){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","page","block/page",822314108).cljs$core$IFn$_invoke$arity$1(p1__154802_SHARP_),new cljs.core.Keyword("block","page","block/page",822314108).cljs$core$IFn$_invoke$arity$1(cljs.core.first(blocks)));
}),blocks)){
} else {
throw (new Error(["Assert failed: ","Blocks must to be in a same page.","\n","(every? (fn* [p1__154802#] (= (:block/page p1__154802#) (:block/page (first blocks)))) blocks)"].join('')));
}

var page_id = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","page","block/page",822314108).cljs$core$IFn$_invoke$arity$1(cljs.core.first(blocks)));
var sorted_ids = logseq.db.get_sorted_page_block_ids(db,page_id);
var blocks_map = cljs.core.zipmap(cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","id","db/id",-1388397098),blocks),blocks);
return cljs.core.keep.cljs$core$IFn$_invoke$arity$2(blocks_map,sorted_ids);
});
/**
 * The child block could be collapsed.
 */
logseq.db.last_child_block_QMARK_ = (function logseq$db$last_child_block_QMARK_(db,parent_id,child_id){
var temp__5804__auto__ = (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db,child_id) : datascript.core.entity.call(null,db,child_id));
if(cljs.core.truth_(temp__5804__auto__)){
var child = temp__5804__auto__;
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(parent_id,child_id)){
return true;
} else {
if(cljs.core.truth_(logseq.db.get_right_sibling(child))){
return false;
} else {
var G__154803 = db;
var G__154804 = parent_id;
var G__154805 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","parent","block/parent",-918309064).cljs$core$IFn$_invoke$arity$1(child));
return (logseq.db.last_child_block_QMARK_.cljs$core$IFn$_invoke$arity$3 ? logseq.db.last_child_block_QMARK_.cljs$core$IFn$_invoke$arity$3(G__154803,G__154804,G__154805) : logseq.db.last_child_block_QMARK_.call(null,G__154803,G__154804,G__154805));

}
}
} else {
return null;
}
});
logseq.db.consecutive_block_QMARK_ = (function logseq$db$consecutive_block_QMARK_(db,block_1,block_2){
var aux_fn = (function (block_1__$1,block_2__$1){
var and__5000__auto__ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","page","block/page",822314108).cljs$core$IFn$_invoke$arity$1(block_1__$1),new cljs.core.Keyword("block","page","block/page",822314108).cljs$core$IFn$_invoke$arity$1(block_2__$1));
if(and__5000__auto__){
var or__5002__auto__ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(logseq.db.get_left_sibling(block_2__$1)),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block_1__$1));
if(or__5002__auto__){
return or__5002__auto__;
} else {
var temp__5804__auto__ = logseq.db.get_left_sibling((function (){var G__154806 = db;
var G__154807 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block_2__$1);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__154806,G__154807) : datascript.core.entity.call(null,G__154806,G__154807));
})());
if(cljs.core.truth_(temp__5804__auto__)){
var prev_sibling = temp__5804__auto__;
return logseq.db.last_child_block_QMARK_(db,new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(prev_sibling),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block_1__$1));
} else {
return null;
}
}
} else {
return and__5000__auto__;
}
});
var or__5002__auto__ = aux_fn(block_1,block_2);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return aux_fn(block_2,block_1);
}
});
logseq.db.get_non_consecutive_blocks = (function logseq$db$get_non_consecutive_blocks(db,blocks){
return cljs.core.vec(cljs.core.keep_indexed.cljs$core$IFn$_invoke$arity$2((function (i,_block){
if(((i + (1)) < cljs.core.count(blocks))){
if(cljs.core.truth_(logseq.db.consecutive_block_QMARK_(db,cljs.core.nth.cljs$core$IFn$_invoke$arity$2(blocks,i),cljs.core.nth.cljs$core$IFn$_invoke$arity$2(blocks,(i + (1)))))){
return null;
} else {
return cljs.core.nth.cljs$core$IFn$_invoke$arity$2(blocks,i);
}
} else {
return null;
}
}),blocks));
});
logseq.db.new_block_id = (function logseq$db$new_block_id(){
return logseq.common.uuid.gen_uuid.cljs$core$IFn$_invoke$arity$0();
});
/**
 * return the source page (page-name) of an alias
 */
logseq.db.get_alias_source_page = (function logseq$db$get_alias_source_page(db,alias_id){
if(cljs.core.truth_(alias_id)){
return cljs.core.first(new cljs.core.Keyword("block","_alias","block/_alias",444442061).cljs$core$IFn$_invoke$arity$1((datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db,alias_id) : datascript.core.entity.call(null,db,alias_id))));
} else {
return null;
}
});
logseq.db.get_block_alias = logseq.db.common.initial_data.get_block_alias;
logseq.db.page_alias_set = (function logseq$db$page_alias_set(db,page_id){
return clojure.set.union.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentHashSet.createAsIfByAssoc([page_id]),cljs.core.set((logseq.db.get_block_alias.cljs$core$IFn$_invoke$arity$2 ? logseq.db.get_block_alias.cljs$core$IFn$_invoke$arity$2(db,page_id) : logseq.db.get_block_alias.call(null,db,page_id))));
});
logseq.db.get_block_refs = (function logseq$db$get_block_refs(db,id){
var entity = (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db,id) : datascript.core.entity.call(null,db,id));
var db_based_QMARK_ = (logseq.db.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(db) : logseq.db.db_based_graph_QMARK_.call(null,db));
var alias = cljs.core.distinct.cljs$core$IFn$_invoke$arity$1(cljs.core.cons(id,(logseq.db.get_block_alias.cljs$core$IFn$_invoke$arity$2 ? logseq.db.get_block_alias.cljs$core$IFn$_invoke$arity$2(db,id) : logseq.db.get_block_alias.call(null,db,id))));
var ref_ids = cljs.core.distinct.cljs$core$IFn$_invoke$arity$1(cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (id__$1){
var G__154808 = new cljs.core.Keyword("block","_refs","block/_refs",830218531).cljs$core$IFn$_invoke$arity$1((datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db,id__$1) : datascript.core.entity.call(null,db,id__$1)));
var G__154808__$1 = (cljs.core.truth_(db_based_QMARK_)?cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (ref){
var or__5002__auto__ = (function (){var and__5000__auto__ = (logseq.db.class_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.class_QMARK_.cljs$core$IFn$_invoke$arity$1(entity) : logseq.db.class_QMARK_.call(null,entity));
if(cljs.core.truth_(and__5000__auto__)){
var G__154809 = db;
var G__154810 = new cljs.core.Keyword(null,"eavt","eavt",-666437073);
var G__154811 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(ref);
var G__154812 = new cljs.core.Keyword("block","tags","block/tags",1814948340);
var G__154813 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(entity);
return (datascript.core.datom.cljs$core$IFn$_invoke$arity$5 ? datascript.core.datom.cljs$core$IFn$_invoke$arity$5(G__154809,G__154810,G__154811,G__154812,G__154813) : datascript.core.datom.call(null,G__154809,G__154810,G__154811,G__154812,G__154813));
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var and__5000__auto__ = (logseq.db.property_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.property_QMARK_.cljs$core$IFn$_invoke$arity$1(entity) : logseq.db.property_QMARK_.call(null,entity));
if(cljs.core.truth_(and__5000__auto__)){
var G__154814 = db;
var G__154815 = new cljs.core.Keyword(null,"eavt","eavt",-666437073);
var G__154816 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(ref);
var G__154817 = new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(entity);
return (datascript.core.datom.cljs$core$IFn$_invoke$arity$4 ? datascript.core.datom.cljs$core$IFn$_invoke$arity$4(G__154814,G__154815,G__154816,G__154817) : datascript.core.datom.call(null,G__154814,G__154815,G__154816,G__154817));
} else {
return and__5000__auto__;
}
}
}),G__154808):G__154808);
return cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","id","db/id",-1388397098),G__154808__$1);

}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([alias], 0)));
if(cljs.core.seq(ref_ids)){
var G__154818 = db;
var G__154819 = new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"*","*",345799209,null)], null);
var G__154820 = ref_ids;
return (datascript.core.pull_many.cljs$core$IFn$_invoke$arity$3 ? datascript.core.pull_many.cljs$core$IFn$_invoke$arity$3(G__154818,G__154819,G__154820) : datascript.core.pull_many.call(null,G__154818,G__154819,G__154820));
} else {
return null;
}
});
logseq.db.get_block_refs_count = logseq.db.common.initial_data.get_block_refs_count;
logseq.db.hidden_or_internal_tag_QMARK_ = (function logseq$db$hidden_or_internal_tag_QMARK_(e){
var or__5002__auto__ = logseq.db.frontend.entity_util.hidden_QMARK_(e);
if(or__5002__auto__){
return or__5002__auto__;
} else {
var G__154821 = new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(e);
return (logseq.db.frontend.class$.internal_tags.cljs$core$IFn$_invoke$arity$1 ? logseq.db.frontend.class$.internal_tags.cljs$core$IFn$_invoke$arity$1(G__154821) : logseq.db.frontend.class$.internal_tags.call(null,G__154821));
}
});
logseq.db.get_all_pages = (function logseq$db$get_all_pages(db){
return cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (d){
var e = (function (){var G__154822 = db;
var G__154823 = new cljs.core.Keyword(null,"e","e",1381269198).cljs$core$IFn$_invoke$arity$1(d);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__154822,G__154823) : datascript.core.entity.call(null,G__154822,G__154823));
})();
if(cljs.core.truth_(logseq.db.hidden_or_internal_tag_QMARK_(e))){
return null;
} else {
return e;
}
}),datascript.core.datoms.cljs$core$IFn$_invoke$arity$3(db,new cljs.core.Keyword(null,"avet","avet",1383857032),new cljs.core.Keyword("block","name","block/name",1619760316)));
});
logseq.db.built_in_QMARK_ = logseq.db.frontend.entity_util.built_in_QMARK_;
logseq.db.built_in_class_property_QMARK_ = logseq.db.frontend.db.built_in_class_property_QMARK_;
logseq.db.private_built_in_page_QMARK_ = logseq.db.frontend.db.private_built_in_page_QMARK_;
logseq.db.write_transit_str = logseq.db.sqlite.util.write_transit_str;
logseq.db.read_transit_str = logseq.db.sqlite.util.read_transit_str;
logseq.db.build_favorite_tx = logseq.db.frontend.db.build_favorite_tx;
logseq.db.get_key_value = (function logseq$db$get_key_value(db,key_ident){
return new cljs.core.Keyword("kv","value","kv/value",305981670).cljs$core$IFn$_invoke$arity$1((datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db,key_ident) : datascript.core.entity.call(null,db,key_ident)));
});
logseq.db.kv = logseq.db.sqlite.util.kv;
logseq.db.get_graph_rtc_uuid = (function logseq$db$get_graph_rtc_uuid(db){
if(cljs.core.truth_(db)){
return logseq.db.get_key_value(db,new cljs.core.Keyword("logseq.kv","graph-uuid","logseq.kv/graph-uuid",339522676));
} else {
return null;
}
});
logseq.db.get_graph_schema_version = (function logseq$db$get_graph_schema_version(db){
if(cljs.core.truth_(db)){
return logseq.db.get_key_value(db,new cljs.core.Keyword("logseq.kv","schema-version","logseq.kv/schema-version",-1467606676));
} else {
return null;
}
});
logseq.db.get_graph_remote_schema_version = (function logseq$db$get_graph_remote_schema_version(db){
if(cljs.core.truth_(db)){
return logseq.db.get_key_value(db,new cljs.core.Keyword("logseq.kv","remote-schema-version","logseq.kv/remote-schema-version",988970829));
} else {
return null;
}
});
logseq.db.get_all_properties = logseq.db.frontend.db.get_all_properties;
logseq.db.get_page_parents = logseq.db.frontend.db.get_page_parents;
logseq.db.get_classes_parents = logseq.db.frontend.db.get_classes_parents;
logseq.db.get_title_with_parents = logseq.db.frontend.db.get_title_with_parents;
logseq.db.class_instance_QMARK_ = logseq.db.frontend.db.class_instance_QMARK_;
logseq.db.inline_tag_QMARK_ = logseq.db.frontend.db.inline_tag_QMARK_;
logseq.db.node_display_type_classes = logseq.db.frontend.db.node_display_type_classes;
logseq.db.get_class_ident_by_display_type = logseq.db.frontend.db.get_class_ident_by_display_type;
logseq.db.get_display_type_by_class_ident = logseq.db.frontend.db.get_display_type_by_class_ident;
logseq.db.get_recent_updated_pages = logseq.db.common.initial_data.get_recent_updated_pages;
logseq.db.get_latest_journals = logseq.db.common.initial_data.get_latest_journals;
logseq.db.get_pages_relation = (function logseq$db$get_pages_relation(db,with_journal_QMARK_){
if(cljs.core.truth_(logseq.db.common.entity_plus.db_based_graph_QMARK_(db))){
var q = (cljs.core.truth_(with_journal_QMARK_)?new cljs.core.PersistentVector(null, 6, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"find","find",496279456),new cljs.core.Symbol(null,"?p","?p",-10896580,null),new cljs.core.Symbol(null,"?ref-page","?ref-page",-893277661,null),new cljs.core.Keyword(null,"where","where",-2044795965),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?block","?block",1541466123,null),new cljs.core.Keyword("block","page","block/page",822314108),new cljs.core.Symbol(null,"?p","?p",-10896580,null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?block","?block",1541466123,null),new cljs.core.Keyword("block","refs","block/refs",-1214495349),new cljs.core.Symbol(null,"?ref-page","?ref-page",-893277661,null)], null)], null):new cljs.core.PersistentVector(null, 8, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"find","find",496279456),new cljs.core.Symbol(null,"?p","?p",-10896580,null),new cljs.core.Symbol(null,"?ref-page","?ref-page",-893277661,null),new cljs.core.Keyword(null,"where","where",-2044795965),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?block","?block",1541466123,null),new cljs.core.Keyword("block","page","block/page",822314108),new cljs.core.Symbol(null,"?p","?p",-10896580,null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?p","?p",-10896580,null),new cljs.core.Keyword("block","tags","block/tags",1814948340)], null),cljs.core.list(new cljs.core.Symbol(null,"not","not",1044554643,null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?p","?p",-10896580,null),new cljs.core.Keyword("block","tags","block/tags",1814948340),new cljs.core.Keyword("logseq.class","Journal","logseq.class/Journal",1979741081)], null)),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?block","?block",1541466123,null),new cljs.core.Keyword("block","refs","block/refs",-1214495349),new cljs.core.Symbol(null,"?ref-page","?ref-page",-893277661,null)], null)], null));
return (datascript.core.q.cljs$core$IFn$_invoke$arity$2 ? datascript.core.q.cljs$core$IFn$_invoke$arity$2(q,db) : datascript.core.q.call(null,q,db));
} else {
var q = (cljs.core.truth_(with_journal_QMARK_)?new cljs.core.PersistentVector(null, 6, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"find","find",496279456),new cljs.core.Symbol(null,"?p","?p",-10896580,null),new cljs.core.Symbol(null,"?ref-page","?ref-page",-893277661,null),new cljs.core.Keyword(null,"where","where",-2044795965),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?block","?block",1541466123,null),new cljs.core.Keyword("block","page","block/page",822314108),new cljs.core.Symbol(null,"?p","?p",-10896580,null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?block","?block",1541466123,null),new cljs.core.Keyword("block","refs","block/refs",-1214495349),new cljs.core.Symbol(null,"?ref-page","?ref-page",-893277661,null)], null)], null):new cljs.core.PersistentVector(null, 7, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"find","find",496279456),new cljs.core.Symbol(null,"?p","?p",-10896580,null),new cljs.core.Symbol(null,"?ref-page","?ref-page",-893277661,null),new cljs.core.Keyword(null,"where","where",-2044795965),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?block","?block",1541466123,null),new cljs.core.Keyword("block","page","block/page",822314108),new cljs.core.Symbol(null,"?p","?p",-10896580,null)], null),cljs.core.list(new cljs.core.Symbol(null,"not","not",1044554643,null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?p","?p",-10896580,null),new cljs.core.Keyword("block","type","block/type",1537584409),"journal"], null)),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?block","?block",1541466123,null),new cljs.core.Keyword("block","refs","block/refs",-1214495349),new cljs.core.Symbol(null,"?ref-page","?ref-page",-893277661,null)], null)], null));
return (datascript.core.q.cljs$core$IFn$_invoke$arity$2 ? datascript.core.q.cljs$core$IFn$_invoke$arity$2(q,db) : datascript.core.q.call(null,q,db));
}
});
logseq.db.get_all_tagged_pages = (function logseq$db$get_all_tagged_pages(db){
var G__154824 = new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"find","find",496279456),new cljs.core.Symbol(null,"?page","?page",-1343187612,null),new cljs.core.Symbol(null,"?tag","?tag",157764474,null),new cljs.core.Keyword(null,"where","where",-2044795965),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?page","?page",-1343187612,null),new cljs.core.Keyword("block","tags","block/tags",1814948340),new cljs.core.Symbol(null,"?tag","?tag",157764474,null)], null)], null);
var G__154825 = db;
return (datascript.core.q.cljs$core$IFn$_invoke$arity$2 ? datascript.core.q.cljs$core$IFn$_invoke$arity$2(G__154824,G__154825) : datascript.core.q.call(null,G__154824,G__154825));
});
/**
 * Returns schema for given repo
 */
logseq.db.get_schema = (function logseq$db$get_schema(repo){
if(cljs.core.truth_(logseq.db.sqlite.util.db_based_graph_QMARK_(repo))){
return logseq.db.frontend.schema.schema;
} else {
return logseq.db.file_based.schema.schema;
}
});

//# sourceMappingURL=logseq.db.js.map
