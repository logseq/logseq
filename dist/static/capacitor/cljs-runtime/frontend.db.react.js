goog.provide('frontend.db.react');
if((typeof frontend !== 'undefined') && (typeof frontend.db !== 'undefined') && (typeof frontend.db.react !== 'undefined') && (typeof frontend.db.react.query_state !== 'undefined')){
} else {
frontend.db.react.query_state = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
}
frontend.db.react._STAR_query_component_STAR_ = null;
frontend.db.react._STAR_reactive_queries_STAR_ = null;
if((typeof frontend !== 'undefined') && (typeof frontend.db !== 'undefined') && (typeof frontend.db.react !== 'undefined') && (typeof frontend.db.react.component__GT_query_key !== 'undefined')){
} else {
frontend.db.react.component__GT_query_key = cljs.core.volatile_BANG_(cljs.core.PersistentArrayMap.EMPTY);
}
if((typeof frontend !== 'undefined') && (typeof frontend.db !== 'undefined') && (typeof frontend.db.react !== 'undefined') && (typeof frontend.db.react.query_key__GT_components !== 'undefined')){
} else {
frontend.db.react.query_key__GT_components = cljs.core.volatile_BANG_(cljs.core.PersistentArrayMap.EMPTY);
}
frontend.db.react.set_new_result_BANG_ = (function frontend$db$react$set_new_result_BANG_(k,new_result){
var temp__5804__auto__ = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(frontend.db.react.query_state),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [k,new cljs.core.Keyword(null,"result","result",1415092211)], null));
if(cljs.core.truth_(temp__5804__auto__)){
var result_atom = temp__5804__auto__;
return cljs.core.reset_BANG_(result_atom,new_result);
} else {
return null;
}
});
frontend.db.react.clear_query_state_BANG_ = (function frontend$db$react$clear_query_state_BANG_(){
return cljs.core.reset_BANG_(frontend.db.react.query_state,cljs.core.PersistentArrayMap.EMPTY);
});
frontend.db.react.add_q_BANG_ = (function frontend$db$react$add_q_BANG_(k,query,inputs,result_atom,transform_fn,query_fn,inputs_fn){
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(frontend.db.react.query_state,cljs.core.assoc,k,new cljs.core.PersistentArrayMap(null, 6, [new cljs.core.Keyword(null,"query","query",-1288509510),query,new cljs.core.Keyword(null,"inputs","inputs",865803858),inputs,new cljs.core.Keyword(null,"result","result",1415092211),result_atom,new cljs.core.Keyword(null,"transform-fn","transform-fn",1106801327),transform_fn,new cljs.core.Keyword(null,"query-fn","query-fn",-646736760),query_fn,new cljs.core.Keyword(null,"inputs-fn","inputs-fn",-1909882296),inputs_fn], null));

return result_atom;
});
frontend.db.react.remove_q_BANG_ = (function frontend$db$react$remove_q_BANG_(k){
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$3(frontend.db.react.query_state,cljs.core.dissoc,k);
});
frontend.db.react.add_query_component_BANG_ = (function frontend$db$react$add_query_component_BANG_(k,component){
if(cljs.core.truth_((function (){var and__5000__auto__ = k;
if(cljs.core.truth_(and__5000__auto__)){
return component;
} else {
return and__5000__auto__;
}
})())){
frontend.db.react.component__GT_query_key.cljs$core$IVolatile$_vreset_BANG_$arity$2(null,cljs.core.update.cljs$core$IFn$_invoke$arity$4(frontend.db.react.component__GT_query_key.cljs$core$IDeref$_deref$arity$1(null),component,cljs.core.fnil.cljs$core$IFn$_invoke$arity$2(cljs.core.conj,cljs.core.PersistentHashSet.EMPTY),k));

return frontend.db.react.query_key__GT_components.cljs$core$IVolatile$_vreset_BANG_$arity$2(null,cljs.core.update.cljs$core$IFn$_invoke$arity$4(frontend.db.react.query_key__GT_components.cljs$core$IDeref$_deref$arity$1(null),k,cljs.core.fnil.cljs$core$IFn$_invoke$arity$2(cljs.core.conj,cljs.core.PersistentHashSet.EMPTY),component));
} else {
return null;
}
});
frontend.db.react.remove_query_component_BANG_ = (function frontend$db$react$remove_query_component_BANG_(component){
var temp__5804__auto___60534 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(frontend.db.react.component__GT_query_key),component);
if(cljs.core.truth_(temp__5804__auto___60534)){
var queries_60535 = temp__5804__auto___60534;
var seq__60393_60536 = cljs.core.seq(queries_60535);
var chunk__60394_60537 = null;
var count__60395_60538 = (0);
var i__60396_60539 = (0);
while(true){
if((i__60396_60539 < count__60395_60538)){
var query_60540 = chunk__60394_60537.cljs$core$IIndexed$_nth$arity$2(null,i__60396_60539);
frontend.db.react.query_key__GT_components.cljs$core$IVolatile$_vreset_BANG_$arity$2(null,((function (seq__60393_60536,chunk__60394_60537,count__60395_60538,i__60396_60539,query_60540,queries_60535,temp__5804__auto___60534){
return (function (m){
var temp__5802__auto__ = cljs.core.not_empty(cljs.core.disj.cljs$core$IFn$_invoke$arity$2(cljs.core.get.cljs$core$IFn$_invoke$arity$2(m,query_60540),component));
if(cljs.core.truth_(temp__5802__auto__)){
var components_STAR_ = temp__5802__auto__;
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(m,query_60540,components_STAR_);
} else {
return cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(m,query_60540);
}
});})(seq__60393_60536,chunk__60394_60537,count__60395_60538,i__60396_60539,query_60540,queries_60535,temp__5804__auto___60534))
(frontend.db.react.query_key__GT_components.cljs$core$IDeref$_deref$arity$1(null)));

if(cljs.core.empty_QMARK_(cljs.core.get.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(frontend.db.react.query_key__GT_components),query_60540))){
frontend.db.react.remove_q_BANG_(query_60540);
} else {
}


var G__60541 = seq__60393_60536;
var G__60542 = chunk__60394_60537;
var G__60543 = count__60395_60538;
var G__60544 = (i__60396_60539 + (1));
seq__60393_60536 = G__60541;
chunk__60394_60537 = G__60542;
count__60395_60538 = G__60543;
i__60396_60539 = G__60544;
continue;
} else {
var temp__5804__auto___60545__$1 = cljs.core.seq(seq__60393_60536);
if(temp__5804__auto___60545__$1){
var seq__60393_60546__$1 = temp__5804__auto___60545__$1;
if(cljs.core.chunked_seq_QMARK_(seq__60393_60546__$1)){
var c__5525__auto___60547 = cljs.core.chunk_first(seq__60393_60546__$1);
var G__60548 = cljs.core.chunk_rest(seq__60393_60546__$1);
var G__60549 = c__5525__auto___60547;
var G__60550 = cljs.core.count(c__5525__auto___60547);
var G__60551 = (0);
seq__60393_60536 = G__60548;
chunk__60394_60537 = G__60549;
count__60395_60538 = G__60550;
i__60396_60539 = G__60551;
continue;
} else {
var query_60552 = cljs.core.first(seq__60393_60546__$1);
frontend.db.react.query_key__GT_components.cljs$core$IVolatile$_vreset_BANG_$arity$2(null,((function (seq__60393_60536,chunk__60394_60537,count__60395_60538,i__60396_60539,query_60552,seq__60393_60546__$1,temp__5804__auto___60545__$1,queries_60535,temp__5804__auto___60534){
return (function (m){
var temp__5802__auto__ = cljs.core.not_empty(cljs.core.disj.cljs$core$IFn$_invoke$arity$2(cljs.core.get.cljs$core$IFn$_invoke$arity$2(m,query_60552),component));
if(cljs.core.truth_(temp__5802__auto__)){
var components_STAR_ = temp__5802__auto__;
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(m,query_60552,components_STAR_);
} else {
return cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(m,query_60552);
}
});})(seq__60393_60536,chunk__60394_60537,count__60395_60538,i__60396_60539,query_60552,seq__60393_60546__$1,temp__5804__auto___60545__$1,queries_60535,temp__5804__auto___60534))
(frontend.db.react.query_key__GT_components.cljs$core$IDeref$_deref$arity$1(null)));

if(cljs.core.empty_QMARK_(cljs.core.get.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(frontend.db.react.query_key__GT_components),query_60552))){
frontend.db.react.remove_q_BANG_(query_60552);
} else {
}


var G__60553 = cljs.core.next(seq__60393_60546__$1);
var G__60554 = null;
var G__60555 = (0);
var G__60556 = (0);
seq__60393_60536 = G__60553;
chunk__60394_60537 = G__60554;
count__60395_60538 = G__60555;
i__60396_60539 = G__60556;
continue;
}
} else {
}
}
break;
}
} else {
}

return frontend.db.react.component__GT_query_key.cljs$core$IVolatile$_vreset_BANG_$arity$2(null,cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(frontend.db.react.component__GT_query_key.cljs$core$IDeref$_deref$arity$1(null),component));
});
frontend.db.react.get_query_cached_result = (function frontend$db$react$get_query_cached_result(k){
var temp__5804__auto__ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(frontend.db.react.query_state),k);
if(cljs.core.truth_(temp__5804__auto__)){
var result = temp__5804__auto__;
if((function (){var G__60406 = cljs.core.deref(new cljs.core.Keyword(null,"result","result",1415092211).cljs$core$IFn$_invoke$arity$1(result));
if((!((G__60406 == null)))){
if((((G__60406.cljs$lang$protocol_mask$partition0$ & (262144))) || ((cljs.core.PROTOCOL_SENTINEL === G__60406.cljs$core$IWithMeta$)))){
return true;
} else {
if((!G__60406.cljs$lang$protocol_mask$partition0$)){
return cljs.core.native_satisfies_QMARK_(cljs.core.IWithMeta,G__60406);
} else {
return false;
}
}
} else {
return cljs.core.native_satisfies_QMARK_(cljs.core.IWithMeta,G__60406);
}
})()){
(new cljs.core.Keyword(null,"result","result",1415092211).cljs$core$IFn$_invoke$arity$1(result).state = cljs.core.deref(new cljs.core.Keyword(null,"result","result",1415092211).cljs$core$IFn$_invoke$arity$1(result)));
} else {
}

return new cljs.core.Keyword(null,"result","result",1415092211).cljs$core$IFn$_invoke$arity$1(result);
} else {
return null;
}
});
frontend.db.react._LT_q_aux = (function frontend$db$react$_LT_q_aux(repo,db,query_fn,inputs_fn,k,query,inputs,built_in_query_QMARK_){
var kv_QMARK_ = ((cljs.core.vector_QMARK_(k)) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"kv","kv",-1099920440),cljs.core.second(k))));
var q = ((frontend.util.node_test_QMARK_)?(function (query__$1,inputs__$1){
return cljs.core.apply.cljs$core$IFn$_invoke$arity$4(datascript.core.q,query__$1,db,inputs__$1);
}):(function (query__$1,inputs__$1){
var q_f = (function (){
return cljs.core.apply.cljs$core$IFn$_invoke$arity$4(frontend.db.async.util._LT_q,repo,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"transact-db?","transact-db?",1279612399),false], null),cljs.core.cons(query__$1,inputs__$1));
});
if(cljs.core.truth_(built_in_query_QMARK_)){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(promesa.core.delay.cljs$core$IFn$_invoke$arity$1((100))),(function (_){
return promesa.protocols._promise(q_f());
}));
}));
} else {
return q_f();
}
}));
if(cljs.core.truth_((function (){var or__5002__auto__ = query_fn;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = query;
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
return kv_QMARK_;
}
}
})())){
if(cljs.core.truth_(query_fn)){
return (query_fn.cljs$core$IFn$_invoke$arity$2 ? query_fn.cljs$core$IFn$_invoke$arity$2(db,null) : query_fn.call(null,db,null));
} else {
if(kv_QMARK_){
return frontend.db.utils.entity.cljs$core$IFn$_invoke$arity$2(db,cljs.core.last(k));
} else {
if(cljs.core.truth_(inputs_fn)){
var inputs__$1 = (inputs_fn.cljs$core$IFn$_invoke$arity$0 ? inputs_fn.cljs$core$IFn$_invoke$arity$0() : inputs_fn.call(null));
return q(query,inputs__$1);
} else {
if(cljs.core.seq(inputs)){
return q(query,inputs);
} else {
return q(query,null);

}
}
}
}
} else {
return null;
}
});
frontend.db.react.q = (function frontend$db$react$q(var_args){
var args__5732__auto__ = [];
var len__5726__auto___60557 = arguments.length;
var i__5727__auto___60558 = (0);
while(true){
if((i__5727__auto___60558 < len__5726__auto___60557)){
args__5732__auto__.push((arguments[i__5727__auto___60558]));

var G__60559 = (i__5727__auto___60558 + (1));
i__5727__auto___60558 = G__60559;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((4) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((4)),(0),null)):null);
return frontend.db.react.q.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),(arguments[(1)]),(arguments[(2)]),(arguments[(3)]),argseq__5733__auto__);
});

(frontend.db.react.q.cljs$core$IFn$_invoke$arity$variadic = (function (repo,k,p__60417,query,inputs){
var map__60418 = p__60417;
var map__60418__$1 = cljs.core.__destructure_map(map__60418);
var use_cache_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__60418__$1,new cljs.core.Keyword(null,"use-cache?","use-cache?",-81331778),true);
var transform_fn = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__60418__$1,new cljs.core.Keyword(null,"transform-fn","transform-fn",1106801327),cljs.core.identity);
var query_fn = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__60418__$1,new cljs.core.Keyword(null,"query-fn","query-fn",-646736760));
var inputs_fn = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__60418__$1,new cljs.core.Keyword(null,"inputs-fn","inputs-fn",-1909882296));
var disable_reactive_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__60418__$1,new cljs.core.Keyword(null,"disable-reactive?","disable-reactive?",-1162731342));
var return_promise_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__60418__$1,new cljs.core.Keyword(null,"return-promise?","return-promise?",-230582088));
var built_in_query_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__60418__$1,new cljs.core.Keyword(null,"built-in-query?","built-in-query?",-1060650385));
var origin_key = k;
var k__$1 = cljs.core.vec(cljs.core.cons(repo,k));
var temp__5804__auto__ = frontend.db.conn.get_db.cljs$core$IFn$_invoke$arity$1(repo);
if(cljs.core.truth_(temp__5804__auto__)){
var db = temp__5804__auto__;
var result_atom = frontend.db.react.get_query_cached_result(k__$1);
var temp__5804__auto___60560__$1 = frontend.db.react._STAR_query_component_STAR_;
if(cljs.core.truth_(temp__5804__auto___60560__$1)){
var component_60561 = temp__5804__auto___60560__$1;
frontend.db.react.add_query_component_BANG_(k__$1,component_60561);
} else {
}

var temp__5804__auto___60562__$1 = frontend.db.react._STAR_reactive_queries_STAR_;
if(cljs.core.truth_(temp__5804__auto___60562__$1)){
var queries_60563 = temp__5804__auto___60562__$1;
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$3(queries_60563,cljs.core.conj,origin_key);
} else {
}

if(cljs.core.truth_((function (){var and__5000__auto__ = use_cache_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return result_atom;
} else {
return and__5000__auto__;
}
})())){
return result_atom;
} else {
var result_atom__$1 = (function (){var or__5002__auto__ = result_atom;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.atom.cljs$core$IFn$_invoke$arity$1(null);
}
})();
var p_or_value = frontend.db.react._LT_q_aux(repo,db,query_fn,inputs_fn,k__$1,query,inputs,built_in_query_QMARK_);
if(cljs.core.truth_(disable_reactive_QMARK_)){
} else {
frontend.db.react.add_q_BANG_(k__$1,query,inputs,result_atom__$1,transform_fn,query_fn,inputs_fn);
}

if(cljs.core.truth_(return_promise_QMARK_)){
return p_or_value;
} else {
if(promesa.core.promise_QMARK_(p_or_value)){
promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(p_or_value),(function (result){
return promesa.protocols._mcat(promesa.protocols._promise((transform_fn.cljs$core$IFn$_invoke$arity$1 ? transform_fn.cljs$core$IFn$_invoke$arity$1(result) : transform_fn.call(null,result))),(function (result_SINGLEQUOTE_){
return promesa.protocols._promise(cljs.core.reset_BANG_(result_atom__$1,result_SINGLEQUOTE_));
}));
}));
}));

return result_atom__$1;
} else {
var result_SINGLEQUOTE_ = (transform_fn.cljs$core$IFn$_invoke$arity$1 ? transform_fn.cljs$core$IFn$_invoke$arity$1(p_or_value) : transform_fn.call(null,p_or_value));
(result_atom__$1.state = result_SINGLEQUOTE_);

return result_atom__$1;

}
}
}
} else {
return null;
}
}));

(frontend.db.react.q.cljs$lang$maxFixedArity = (4));

/** @this {Function} */
(frontend.db.react.q.cljs$lang$applyTo = (function (seq60412){
var G__60413 = cljs.core.first(seq60412);
var seq60412__$1 = cljs.core.next(seq60412);
var G__60414 = cljs.core.first(seq60412__$1);
var seq60412__$2 = cljs.core.next(seq60412__$1);
var G__60415 = cljs.core.first(seq60412__$2);
var seq60412__$3 = cljs.core.next(seq60412__$2);
var G__60416 = cljs.core.first(seq60412__$3);
var seq60412__$4 = cljs.core.next(seq60412__$3);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__60413,G__60414,G__60415,G__60416,seq60412__$4);
}));

frontend.db.react.execute_query_BANG_ = (function frontend$db$react$execute_query_BANG_(graph,db,k,p__60420){
var map__60424 = p__60420;
var map__60424__$1 = cljs.core.__destructure_map(map__60424);
var query = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__60424__$1,new cljs.core.Keyword(null,"query","query",-1288509510));
var inputs = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__60424__$1,new cljs.core.Keyword(null,"inputs","inputs",865803858));
var transform_fn = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__60424__$1,new cljs.core.Keyword(null,"transform-fn","transform-fn",1106801327),cljs.core.identity);
var query_fn = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__60424__$1,new cljs.core.Keyword(null,"query-fn","query-fn",-646736760));
var inputs_fn = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__60424__$1,new cljs.core.Keyword(null,"inputs-fn","inputs-fn",-1909882296));
var result = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__60424__$1,new cljs.core.Keyword(null,"result","result",1415092211));
var built_in_query_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__60424__$1,new cljs.core.Keyword(null,"built-in-query?","built-in-query?",-1060650385));
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.db.react._LT_q_aux(graph,db,query_fn,inputs_fn,k,query,inputs,built_in_query_QMARK_)),(function (p_or_value){
return promesa.protocols._mcat(promesa.protocols._promise((transform_fn.cljs$core$IFn$_invoke$arity$1 ? transform_fn.cljs$core$IFn$_invoke$arity$1(p_or_value) : transform_fn.call(null,p_or_value))),(function (result_SINGLEQUOTE_){
return promesa.protocols._promise(((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(result_SINGLEQUOTE_,result))?null:frontend.db.react.set_new_result_BANG_(k,result_SINGLEQUOTE_)));
}));
}));
}));
});
frontend.db.react.refresh_affected_queries_BANG_ = (function frontend$db$react$refresh_affected_queries_BANG_(var_args){
var args__5732__auto__ = [];
var len__5726__auto___60564 = arguments.length;
var i__5727__auto___60565 = (0);
while(true){
if((i__5727__auto___60565 < len__5726__auto___60564)){
args__5732__auto__.push((arguments[i__5727__auto___60565]));

var G__60566 = (i__5727__auto___60565 + (1));
i__5727__auto___60565 = G__60566;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((2) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((2)),(0),null)):null);
return frontend.db.react.refresh_affected_queries_BANG_.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),(arguments[(1)]),argseq__5733__auto__);
});

(frontend.db.react.refresh_affected_queries_BANG_.cljs$core$IFn$_invoke$arity$variadic = (function (repo_url,affected_keys,p__60434){
var map__60435 = p__60434;
var map__60435__$1 = cljs.core.__destructure_map(map__60435);
var skip_kv_custom_keys_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__60435__$1,new cljs.core.Keyword(null,"skip-kv-custom-keys?","skip-kv-custom-keys?",-1568075009),false);
if(cljs.core.truth_(goog.DEBUG)){
var k__50701__auto__ = "refresh!";
console.time(k__50701__auto__);

var res__50702__auto__ = (function (){var db = frontend.db.conn.get_db.cljs$core$IFn$_invoke$arity$1(repo_url);
var affected_keys_set = cljs.core.set(affected_keys);
var state = cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (p__60436){
var vec__60437 = p__60436;
var k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__60437,(0),null);
var cache = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__60437,(1),null);
var k_SINGLEQUOTE_ = cljs.core.vec(cljs.core.rest(k));
if(((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.first(k),repo_url)) && (((cljs.core.contains_QMARK_(affected_keys_set,k_SINGLEQUOTE_)) || (cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"kv","kv",-1099920440),null,new cljs.core.Keyword(null,"custom","custom",340151948),null], null), null),cljs.core.first(k_SINGLEQUOTE_))))))){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [k_SINGLEQUOTE_,cache], null);
} else {
return null;
}
}),cljs.core.deref(frontend.db.react.query_state)));
var all_keys = cljs.core.concat.cljs$core$IFn$_invoke$arity$2(cljs.core.distinct.cljs$core$IFn$_invoke$arity$1(affected_keys),(cljs.core.truth_(skip_kv_custom_keys_QMARK_)?null:cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (p1__60430_SHARP_){
return cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"kv","kv",-1099920440),null,new cljs.core.Keyword(null,"custom","custom",340151948),null], null), null),cljs.core.first(p1__60430_SHARP_));
}),cljs.core.keys(state))));
var seq__60440 = cljs.core.seq(all_keys);
var chunk__60441 = null;
var count__60442 = (0);
var i__60443 = (0);
while(true){
if((i__60443 < count__60442)){
var k = chunk__60441.cljs$core$IIndexed$_nth$arity$2(null,i__60443);
var temp__5804__auto___60567 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(state,k);
if(cljs.core.truth_(temp__5804__auto___60567)){
var cache_60568 = temp__5804__auto___60567;
var map__60449_60569 = cache_60568;
var map__60449_60570__$1 = cljs.core.__destructure_map(map__60449_60569);
var query_60571 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__60449_60570__$1,new cljs.core.Keyword(null,"query","query",-1288509510));
var query_fn_60572 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__60449_60570__$1,new cljs.core.Keyword(null,"query-fn","query-fn",-646736760));
var custom_QMARK__60573 = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"custom","custom",340151948),cljs.core.first(k));
if(cljs.core.truth_((function (){var or__5002__auto__ = query_60571;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return query_fn_60572;
}
})())){
try{var f_60574 = ((function (seq__60440,chunk__60441,count__60442,i__60443,map__60449_60569,map__60449_60570__$1,query_60571,query_fn_60572,custom_QMARK__60573,cache_60568,temp__5804__auto___60567,k,db,affected_keys_set,state,all_keys,k__50701__auto__,map__60435,map__60435__$1,skip_kv_custom_keys_QMARK_){
return (function (){
return frontend.db.react.execute_query_BANG_(repo_url,db,cljs.core.vec(cljs.core.cons(repo_url,k)),cache_60568);
});})(seq__60440,chunk__60441,count__60442,i__60443,map__60449_60569,map__60449_60570__$1,query_60571,query_fn_60572,custom_QMARK__60573,cache_60568,temp__5804__auto___60567,k,db,affected_keys_set,state,all_keys,k__50701__auto__,map__60435,map__60435__$1,skip_kv_custom_keys_QMARK_))
;
if(custom_QMARK__60573){
cljs.core.async.put_BANG_.cljs$core$IFn$_invoke$arity$2(frontend.state.get_reactive_custom_queries_chan(),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [f_60574,query_60571], null));
} else {
f_60574();
}
}catch (e60450){var e_60575 = e60450;
console.error(e_60575);

}} else {
}
} else {
}


var G__60576 = seq__60440;
var G__60577 = chunk__60441;
var G__60578 = count__60442;
var G__60579 = (i__60443 + (1));
seq__60440 = G__60576;
chunk__60441 = G__60577;
count__60442 = G__60578;
i__60443 = G__60579;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__60440);
if(temp__5804__auto__){
var seq__60440__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__60440__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__60440__$1);
var G__60580 = cljs.core.chunk_rest(seq__60440__$1);
var G__60581 = c__5525__auto__;
var G__60582 = cljs.core.count(c__5525__auto__);
var G__60583 = (0);
seq__60440 = G__60580;
chunk__60441 = G__60581;
count__60442 = G__60582;
i__60443 = G__60583;
continue;
} else {
var k = cljs.core.first(seq__60440__$1);
var temp__5804__auto___60584__$1 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(state,k);
if(cljs.core.truth_(temp__5804__auto___60584__$1)){
var cache_60585 = temp__5804__auto___60584__$1;
var map__60451_60586 = cache_60585;
var map__60451_60587__$1 = cljs.core.__destructure_map(map__60451_60586);
var query_60588 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__60451_60587__$1,new cljs.core.Keyword(null,"query","query",-1288509510));
var query_fn_60589 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__60451_60587__$1,new cljs.core.Keyword(null,"query-fn","query-fn",-646736760));
var custom_QMARK__60590 = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"custom","custom",340151948),cljs.core.first(k));
if(cljs.core.truth_((function (){var or__5002__auto__ = query_60588;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return query_fn_60589;
}
})())){
try{var f_60591 = ((function (seq__60440,chunk__60441,count__60442,i__60443,map__60451_60586,map__60451_60587__$1,query_60588,query_fn_60589,custom_QMARK__60590,cache_60585,temp__5804__auto___60584__$1,k,seq__60440__$1,temp__5804__auto__,db,affected_keys_set,state,all_keys,k__50701__auto__,map__60435,map__60435__$1,skip_kv_custom_keys_QMARK_){
return (function (){
return frontend.db.react.execute_query_BANG_(repo_url,db,cljs.core.vec(cljs.core.cons(repo_url,k)),cache_60585);
});})(seq__60440,chunk__60441,count__60442,i__60443,map__60451_60586,map__60451_60587__$1,query_60588,query_fn_60589,custom_QMARK__60590,cache_60585,temp__5804__auto___60584__$1,k,seq__60440__$1,temp__5804__auto__,db,affected_keys_set,state,all_keys,k__50701__auto__,map__60435,map__60435__$1,skip_kv_custom_keys_QMARK_))
;
if(custom_QMARK__60590){
cljs.core.async.put_BANG_.cljs$core$IFn$_invoke$arity$2(frontend.state.get_reactive_custom_queries_chan(),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [f_60591,query_60588], null));
} else {
f_60591();
}
}catch (e60452){var e_60592 = e60452;
console.error(e_60592);

}} else {
}
} else {
}


var G__60593 = cljs.core.next(seq__60440__$1);
var G__60594 = null;
var G__60595 = (0);
var G__60596 = (0);
seq__60440 = G__60593;
chunk__60441 = G__60594;
count__60442 = G__60595;
i__60443 = G__60596;
continue;
}
} else {
return null;
}
}
break;
}
})();
console.timeEnd(k__50701__auto__);

return res__50702__auto__;
} else {
var db = frontend.db.conn.get_db.cljs$core$IFn$_invoke$arity$1(repo_url);
var affected_keys_set = cljs.core.set(affected_keys);
var state = cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (p__60453){
var vec__60454 = p__60453;
var k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__60454,(0),null);
var cache = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__60454,(1),null);
var k_SINGLEQUOTE_ = cljs.core.vec(cljs.core.rest(k));
if(((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.first(k),repo_url)) && (((cljs.core.contains_QMARK_(affected_keys_set,k_SINGLEQUOTE_)) || (cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"kv","kv",-1099920440),null,new cljs.core.Keyword(null,"custom","custom",340151948),null], null), null),cljs.core.first(k_SINGLEQUOTE_))))))){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [k_SINGLEQUOTE_,cache], null);
} else {
return null;
}
}),cljs.core.deref(frontend.db.react.query_state)));
var all_keys = cljs.core.concat.cljs$core$IFn$_invoke$arity$2(cljs.core.distinct.cljs$core$IFn$_invoke$arity$1(affected_keys),(cljs.core.truth_(skip_kv_custom_keys_QMARK_)?null:cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (p1__60430_SHARP_){
return cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"kv","kv",-1099920440),null,new cljs.core.Keyword(null,"custom","custom",340151948),null], null), null),cljs.core.first(p1__60430_SHARP_));
}),cljs.core.keys(state))));
var seq__60457 = cljs.core.seq(all_keys);
var chunk__60458 = null;
var count__60459 = (0);
var i__60460 = (0);
while(true){
if((i__60460 < count__60459)){
var k = chunk__60458.cljs$core$IIndexed$_nth$arity$2(null,i__60460);
var temp__5804__auto___60597 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(state,k);
if(cljs.core.truth_(temp__5804__auto___60597)){
var cache_60598 = temp__5804__auto___60597;
var map__60466_60599 = cache_60598;
var map__60466_60600__$1 = cljs.core.__destructure_map(map__60466_60599);
var query_60601 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__60466_60600__$1,new cljs.core.Keyword(null,"query","query",-1288509510));
var query_fn_60602 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__60466_60600__$1,new cljs.core.Keyword(null,"query-fn","query-fn",-646736760));
var custom_QMARK__60603 = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"custom","custom",340151948),cljs.core.first(k));
if(cljs.core.truth_((function (){var or__5002__auto__ = query_60601;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return query_fn_60602;
}
})())){
try{var f_60604 = ((function (seq__60457,chunk__60458,count__60459,i__60460,map__60466_60599,map__60466_60600__$1,query_60601,query_fn_60602,custom_QMARK__60603,cache_60598,temp__5804__auto___60597,k,db,affected_keys_set,state,all_keys,map__60435,map__60435__$1,skip_kv_custom_keys_QMARK_){
return (function (){
return frontend.db.react.execute_query_BANG_(repo_url,db,cljs.core.vec(cljs.core.cons(repo_url,k)),cache_60598);
});})(seq__60457,chunk__60458,count__60459,i__60460,map__60466_60599,map__60466_60600__$1,query_60601,query_fn_60602,custom_QMARK__60603,cache_60598,temp__5804__auto___60597,k,db,affected_keys_set,state,all_keys,map__60435,map__60435__$1,skip_kv_custom_keys_QMARK_))
;
if(custom_QMARK__60603){
cljs.core.async.put_BANG_.cljs$core$IFn$_invoke$arity$2(frontend.state.get_reactive_custom_queries_chan(),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [f_60604,query_60601], null));
} else {
f_60604();
}
}catch (e60467){var e_60605 = e60467;
console.error(e_60605);

}} else {
}
} else {
}


var G__60606 = seq__60457;
var G__60607 = chunk__60458;
var G__60608 = count__60459;
var G__60609 = (i__60460 + (1));
seq__60457 = G__60606;
chunk__60458 = G__60607;
count__60459 = G__60608;
i__60460 = G__60609;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__60457);
if(temp__5804__auto__){
var seq__60457__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__60457__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__60457__$1);
var G__60610 = cljs.core.chunk_rest(seq__60457__$1);
var G__60611 = c__5525__auto__;
var G__60612 = cljs.core.count(c__5525__auto__);
var G__60613 = (0);
seq__60457 = G__60610;
chunk__60458 = G__60611;
count__60459 = G__60612;
i__60460 = G__60613;
continue;
} else {
var k = cljs.core.first(seq__60457__$1);
var temp__5804__auto___60614__$1 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(state,k);
if(cljs.core.truth_(temp__5804__auto___60614__$1)){
var cache_60615 = temp__5804__auto___60614__$1;
var map__60468_60616 = cache_60615;
var map__60468_60617__$1 = cljs.core.__destructure_map(map__60468_60616);
var query_60618 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__60468_60617__$1,new cljs.core.Keyword(null,"query","query",-1288509510));
var query_fn_60619 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__60468_60617__$1,new cljs.core.Keyword(null,"query-fn","query-fn",-646736760));
var custom_QMARK__60620 = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"custom","custom",340151948),cljs.core.first(k));
if(cljs.core.truth_((function (){var or__5002__auto__ = query_60618;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return query_fn_60619;
}
})())){
try{var f_60621 = ((function (seq__60457,chunk__60458,count__60459,i__60460,map__60468_60616,map__60468_60617__$1,query_60618,query_fn_60619,custom_QMARK__60620,cache_60615,temp__5804__auto___60614__$1,k,seq__60457__$1,temp__5804__auto__,db,affected_keys_set,state,all_keys,map__60435,map__60435__$1,skip_kv_custom_keys_QMARK_){
return (function (){
return frontend.db.react.execute_query_BANG_(repo_url,db,cljs.core.vec(cljs.core.cons(repo_url,k)),cache_60615);
});})(seq__60457,chunk__60458,count__60459,i__60460,map__60468_60616,map__60468_60617__$1,query_60618,query_fn_60619,custom_QMARK__60620,cache_60615,temp__5804__auto___60614__$1,k,seq__60457__$1,temp__5804__auto__,db,affected_keys_set,state,all_keys,map__60435,map__60435__$1,skip_kv_custom_keys_QMARK_))
;
if(custom_QMARK__60620){
cljs.core.async.put_BANG_.cljs$core$IFn$_invoke$arity$2(frontend.state.get_reactive_custom_queries_chan(),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [f_60621,query_60618], null));
} else {
f_60621();
}
}catch (e60469){var e_60622 = e60469;
console.error(e_60622);

}} else {
}
} else {
}


var G__60623 = cljs.core.next(seq__60457__$1);
var G__60624 = null;
var G__60625 = (0);
var G__60626 = (0);
seq__60457 = G__60623;
chunk__60458 = G__60624;
count__60459 = G__60625;
i__60460 = G__60626;
continue;
}
} else {
return null;
}
}
break;
}
}
}));

(frontend.db.react.refresh_affected_queries_BANG_.cljs$lang$maxFixedArity = (2));

/** @this {Function} */
(frontend.db.react.refresh_affected_queries_BANG_.cljs$lang$applyTo = (function (seq60431){
var G__60432 = cljs.core.first(seq60431);
var seq60431__$1 = cljs.core.next(seq60431);
var G__60433 = cljs.core.first(seq60431__$1);
var seq60431__$2 = cljs.core.next(seq60431__$1);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__60432,G__60433,seq60431__$2);
}));

/**
 * Re-compute corresponding queries (from tx) and refresh the related react components.
 */
frontend.db.react.refresh_BANG_ = (function frontend$db$react$refresh_BANG_(repo_url,affected_keys){
if(cljs.core.truth_((function (){var and__5000__auto__ = repo_url;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.seq(affected_keys);
} else {
return and__5000__auto__;
}
})())){
return frontend.db.react.refresh_affected_queries_BANG_(repo_url,affected_keys);
} else {
return null;
}
});
frontend.db.react.run_custom_queries_when_idle_BANG_ = (function frontend$db$react$run_custom_queries_when_idle_BANG_(){
var chan = frontend.state.get_reactive_custom_queries_chan();
var c__32124__auto___60627 = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run((function (){
var f__32125__auto__ = (function (){var switch__32050__auto__ = (function (state_60508){
var state_val_60509 = (state_60508[(1)]);
if((state_val_60509 === (7))){
var inst_60477 = (state_60508[(7)]);
var inst_60478 = (state_60508[(2)]);
var inst_60479 = [cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("custom-query","failed","custom-query/failed",310909234)),"\n",cljs.core.str.cljs$core$IFn$_invoke$arity$1(inst_60477)].join('');
var inst_60480 = console.error(inst_60479);
var inst_60481 = console.error(inst_60478);
var state_60508__$1 = (function (){var statearr_60510 = state_60508;
(statearr_60510[(8)] = inst_60480);

return statearr_60510;
})();
var statearr_60511_60628 = state_60508__$1;
(statearr_60511_60628[(2)] = inst_60481);

(statearr_60511_60628[(1)] = (6));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_60509 === (1))){
var state_60508__$1 = state_60508;
var statearr_60512_60629 = state_60508__$1;
(statearr_60512_60629[(2)] = null);

(statearr_60512_60629[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_60509 === (4))){
var inst_60475 = (state_60508[(2)]);
var inst_60476 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(inst_60475,(0),null);
var inst_60477 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(inst_60475,(1),null);
var state_60508__$1 = (function (){var statearr_60513 = state_60508;
(statearr_60513[(9)] = inst_60476);

(statearr_60513[(7)] = inst_60477);

return statearr_60513;
})();
var statearr_60514_60630 = state_60508__$1;
(statearr_60514_60630[(2)] = null);

(statearr_60514_60630[(1)] = (5));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_60509 === (6))){
var inst_60503 = (state_60508[(2)]);
var state_60508__$1 = (function (){var statearr_60515 = state_60508;
(statearr_60515[(10)] = inst_60503);

return statearr_60515;
})();
var statearr_60516_60631 = state_60508__$1;
(statearr_60516_60631[(2)] = null);

(statearr_60516_60631[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_60509 === (3))){
var inst_60506 = (state_60508[(2)]);
var state_60508__$1 = state_60508;
return cljs.core.async.impl.ioc_helpers.return_chan(state_60508__$1,inst_60506);
} else {
if((state_val_60509 === (12))){
var inst_60476 = (state_60508[(9)]);
var inst_60477 = (state_60508[(7)]);
var inst_60494 = (state_60508[(2)]);
var inst_60495 = cljs.core.PersistentVector.EMPTY_NODE;
var inst_60496 = [inst_60476,inst_60477];
var inst_60497 = (new cljs.core.PersistentVector(null,2,(5),inst_60495,inst_60496,null));
var inst_60498 = cljs.core.async.put_BANG_.cljs$core$IFn$_invoke$arity$2(chan,inst_60497);
var state_60508__$1 = (function (){var statearr_60517 = state_60508;
(statearr_60517[(11)] = inst_60494);

return statearr_60517;
})();
var statearr_60518_60632 = state_60508__$1;
(statearr_60518_60632[(2)] = inst_60498);

(statearr_60518_60632[(1)] = (11));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_60509 === (2))){
var state_60508__$1 = state_60508;
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_60508__$1,(4),chan);
} else {
if((state_val_60509 === (11))){
var inst_60500 = (state_60508[(2)]);
var _ = (function (){var statearr_60519 = state_60508;
(statearr_60519[(4)] = cljs.core.rest((state_60508[(4)])));

return statearr_60519;
})();
var state_60508__$1 = state_60508;
var statearr_60520_60633 = state_60508__$1;
(statearr_60520_60633[(2)] = inst_60500);

(statearr_60520_60633[(1)] = (6));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_60509 === (9))){
var inst_60476 = (state_60508[(9)]);
var inst_60490 = (inst_60476.cljs$core$IFn$_invoke$arity$0 ? inst_60476.cljs$core$IFn$_invoke$arity$0() : inst_60476.call(null));
var state_60508__$1 = state_60508;
var statearr_60521_60634 = state_60508__$1;
(statearr_60521_60634[(2)] = inst_60490);

(statearr_60521_60634[(1)] = (11));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_60509 === (5))){
var _ = (function (){var statearr_60523 = state_60508;
(statearr_60523[(4)] = cljs.core.cons((8),(state_60508[(4)])));

return statearr_60523;
})();
var inst_60487 = frontend.state.get_current_repo();
var inst_60488 = frontend.state.input_idle_QMARK_(inst_60487);
var state_60508__$1 = state_60508;
if(cljs.core.truth_(inst_60488)){
var statearr_60524_60635 = state_60508__$1;
(statearr_60524_60635[(1)] = (9));

} else {
var statearr_60525_60636 = state_60508__$1;
(statearr_60525_60636[(1)] = (10));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_60509 === (10))){
var inst_60492 = cljs.core.async.timeout((2000));
var state_60508__$1 = state_60508;
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_60508__$1,(12),inst_60492);
} else {
if((state_val_60509 === (8))){
var _ = (function (){var statearr_60526 = state_60508;
(statearr_60526[(4)] = cljs.core.rest((state_60508[(4)])));

return statearr_60526;
})();
var state_60508__$1 = state_60508;
var ex60522 = (state_60508__$1[(2)]);
var statearr_60527_60637 = state_60508__$1;
(statearr_60527_60637[(5)] = ex60522);


var statearr_60528_60638 = state_60508__$1;
(statearr_60528_60638[(1)] = (7));

(statearr_60528_60638[(5)] = null);



return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
return null;
}
}
}
}
}
}
}
}
}
}
}
}
});
return (function() {
var frontend$db$react$run_custom_queries_when_idle_BANG__$_state_machine__32051__auto__ = null;
var frontend$db$react$run_custom_queries_when_idle_BANG__$_state_machine__32051__auto____0 = (function (){
var statearr_60529 = [null,null,null,null,null,null,null,null,null,null,null,null];
(statearr_60529[(0)] = frontend$db$react$run_custom_queries_when_idle_BANG__$_state_machine__32051__auto__);

(statearr_60529[(1)] = (1));

return statearr_60529;
});
var frontend$db$react$run_custom_queries_when_idle_BANG__$_state_machine__32051__auto____1 = (function (state_60508){
while(true){
var ret_value__32052__auto__ = (function (){try{while(true){
var result__32053__auto__ = switch__32050__auto__(state_60508);
if(cljs.core.keyword_identical_QMARK_(result__32053__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__32053__auto__;
}
break;
}
}catch (e60530){var ex__32054__auto__ = e60530;
var statearr_60531_60639 = state_60508;
(statearr_60531_60639[(2)] = ex__32054__auto__);


if(cljs.core.seq((state_60508[(4)]))){
var statearr_60532_60640 = state_60508;
(statearr_60532_60640[(1)] = cljs.core.first((state_60508[(4)])));

} else {
throw ex__32054__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__32052__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__60641 = state_60508;
state_60508 = G__60641;
continue;
} else {
return ret_value__32052__auto__;
}
break;
}
});
frontend$db$react$run_custom_queries_when_idle_BANG__$_state_machine__32051__auto__ = function(state_60508){
switch(arguments.length){
case 0:
return frontend$db$react$run_custom_queries_when_idle_BANG__$_state_machine__32051__auto____0.call(this);
case 1:
return frontend$db$react$run_custom_queries_when_idle_BANG__$_state_machine__32051__auto____1.call(this,state_60508);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
frontend$db$react$run_custom_queries_when_idle_BANG__$_state_machine__32051__auto__.cljs$core$IFn$_invoke$arity$0 = frontend$db$react$run_custom_queries_when_idle_BANG__$_state_machine__32051__auto____0;
frontend$db$react$run_custom_queries_when_idle_BANG__$_state_machine__32051__auto__.cljs$core$IFn$_invoke$arity$1 = frontend$db$react$run_custom_queries_when_idle_BANG__$_state_machine__32051__auto____1;
return frontend$db$react$run_custom_queries_when_idle_BANG__$_state_machine__32051__auto__;
})()
})();
var state__32126__auto__ = (function (){var statearr_60533 = f__32125__auto__();
(statearr_60533[(6)] = c__32124__auto___60627);

return statearr_60533;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__32126__auto__);
}));


return chan;
});

//# sourceMappingURL=frontend.db.react.js.map
