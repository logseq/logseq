goog.provide('frontend.db.async.util');
frontend.db.async.util._LT_q = (function frontend$db$async$util$_LT_q(var_args){
var args__5732__auto__ = [];
var len__5726__auto___100375 = arguments.length;
var i__5727__auto___100377 = (0);
while(true){
if((i__5727__auto___100377 < len__5726__auto___100375)){
args__5732__auto__.push((arguments[i__5727__auto___100377]));

var G__100378 = (i__5727__auto___100377 + (1));
i__5727__auto___100377 = G__100378;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((2) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((2)),(0),null)):null);
return frontend.db.async.util._LT_q.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),(arguments[(1)]),argseq__5733__auto__);
});

(frontend.db.async.util._LT_q.cljs$core$IFn$_invoke$arity$variadic = (function (graph,p__100349,inputs){
var map__100350 = p__100349;
var map__100350__$1 = cljs.core.__destructure_map(map__100350);
var opts = map__100350__$1;
var transact_db_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__100350__$1,new cljs.core.Keyword(null,"transact-db?","transact-db?",1279612399),true);
if(cljs.core.not_any_QMARK_(cljs.core.fn_QMARK_,inputs)){
} else {
throw (new Error(["Assert failed: ","Async query inputs can't include fns because fn can't be serialized","\n","(not-any? fn? inputs)"].join('')));
}

var _STAR_async_queries = new cljs.core.Keyword("db","async-queries","db/async-queries",1853808854).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state));
var async_requested_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(_STAR_async_queries),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [inputs,opts], null));
if(cljs.core.truth_((function (){var and__5000__auto__ = async_requested_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return transact_db_QMARK_;
} else {
return and__5000__auto__;
}
})())){
return promesa.core.promise.cljs$core$IFn$_invoke$arity$1((function (){var db = frontend.db.conn.get_db.cljs$core$IFn$_invoke$arity$1(graph);
return cljs.core.apply.cljs$core$IFn$_invoke$arity$4(datascript.core.q,cljs.core.first(inputs),db,cljs.core.rest(inputs));
})());
} else {
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.state._LT_invoke_db_worker.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword("thread-api","q","thread-api/q",-245089616),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([graph,inputs], 0))),(function (result){
return promesa.protocols._mcat(promesa.protocols._promise(cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(_STAR_async_queries,cljs.core.assoc,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [inputs,opts], null),true)),(function (___41611__auto__){
return promesa.protocols._promise((cljs.core.truth_(result)?(function (){
if(cljs.core.truth_((function (){var and__5000__auto__ = transact_db_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return ((cljs.core.seq(result)) && (cljs.core.coll_QMARK_(result)));
} else {
return and__5000__auto__;
}
})())){
var temp__5804__auto___100379 = frontend.db.conn.get_db.cljs$core$IFn$_invoke$arity$2(graph,false);
if(cljs.core.truth_(temp__5804__auto___100379)){
var conn_100380 = temp__5804__auto___100379;
var tx_data_100381 = cljs.core.remove.cljs$core$IFn$_invoke$arity$2(cljs.core.nil_QMARK_,((((cljs.core.coll_QMARK_(cljs.core.first(result))) && ((!(cljs.core.map_QMARK_(cljs.core.first(result)))))))?cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core.concat,result):result));
if(cljs.core.every_QMARK_(cljs.core.map_QMARK_,tx_data_100381)){
try{(datascript.core.transact_BANG_.cljs$core$IFn$_invoke$arity$2 ? datascript.core.transact_BANG_.cljs$core$IFn$_invoke$arity$2(conn_100380,tx_data_100381) : datascript.core.transact_BANG_.call(null,conn_100380,tx_data_100381));
}catch (e100363){var e_100382 = e100363;
console.error("<q failed with:",e_100382);

}} else {
console.log("<q skipped tx for inputs:",inputs);
}
} else {
}
} else {
}

return result;
})()
:null));
}));
}));
}));
}
}));

(frontend.db.async.util._LT_q.cljs$lang$maxFixedArity = (2));

/** @this {Function} */
(frontend.db.async.util._LT_q.cljs$lang$applyTo = (function (seq100344){
var G__100345 = cljs.core.first(seq100344);
var seq100344__$1 = cljs.core.next(seq100344);
var G__100346 = cljs.core.first(seq100344__$1);
var seq100344__$2 = cljs.core.next(seq100344__$1);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__100345,G__100346,seq100344__$2);
}));

frontend.db.async.util._LT_pull = (function frontend$db$async$util$_LT_pull(var_args){
var G__100369 = arguments.length;
switch (G__100369) {
case 2:
return frontend.db.async.util._LT_pull.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return frontend.db.async.util._LT_pull.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.db.async.util._LT_pull.cljs$core$IFn$_invoke$arity$2 = (function (graph,id){
return frontend.db.async.util._LT_pull.cljs$core$IFn$_invoke$arity$3(graph,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"*","*",345799209,null)], null),id);
}));

(frontend.db.async.util._LT_pull.cljs$core$IFn$_invoke$arity$3 = (function (graph,selector,id){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.state._LT_invoke_db_worker.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword("thread-api","pull","thread-api/pull",861948100),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([graph,selector,id], 0))),(function (result_SINGLEQUOTE_){
return promesa.protocols._promise((cljs.core.truth_(result_SINGLEQUOTE_)?(function (){
var temp__5804__auto___100385 = frontend.db.conn.get_db.cljs$core$IFn$_invoke$arity$2(graph,false);
if(cljs.core.truth_(temp__5804__auto___100385)){
var conn_100386 = temp__5804__auto___100385;
var G__100370_100387 = conn_100386;
var G__100371_100388 = new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [result_SINGLEQUOTE_], null);
(datascript.core.transact_BANG_.cljs$core$IFn$_invoke$arity$2 ? datascript.core.transact_BANG_.cljs$core$IFn$_invoke$arity$2(G__100370_100387,G__100371_100388) : datascript.core.transact_BANG_.call(null,G__100370_100387,G__100371_100388));
} else {
}

return result_SINGLEQUOTE_;
})()
:null));
}));
}));
}));

(frontend.db.async.util._LT_pull.cljs$lang$maxFixedArity = 3);


//# sourceMappingURL=frontend.db.async.util.js.map
