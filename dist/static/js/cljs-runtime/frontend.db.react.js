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
var temp__5804__auto___100543 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(frontend.db.react.component__GT_query_key),component);
if(cljs.core.truth_(temp__5804__auto___100543)){
var queries_100544 = temp__5804__auto___100543;
var seq__100426_100545 = cljs.core.seq(queries_100544);
var chunk__100427_100546 = null;
var count__100428_100547 = (0);
var i__100429_100548 = (0);
while(true){
if((i__100429_100548 < count__100428_100547)){
var query_100549 = chunk__100427_100546.cljs$core$IIndexed$_nth$arity$2(null,i__100429_100548);
frontend.db.react.query_key__GT_components.cljs$core$IVolatile$_vreset_BANG_$arity$2(null,((function (seq__100426_100545,chunk__100427_100546,count__100428_100547,i__100429_100548,query_100549,queries_100544,temp__5804__auto___100543){
return (function (m){
var temp__5802__auto__ = cljs.core.not_empty(cljs.core.disj.cljs$core$IFn$_invoke$arity$2(cljs.core.get.cljs$core$IFn$_invoke$arity$2(m,query_100549),component));
if(cljs.core.truth_(temp__5802__auto__)){
var components_STAR_ = temp__5802__auto__;
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(m,query_100549,components_STAR_);
} else {
return cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(m,query_100549);
}
});})(seq__100426_100545,chunk__100427_100546,count__100428_100547,i__100429_100548,query_100549,queries_100544,temp__5804__auto___100543))
(frontend.db.react.query_key__GT_components.cljs$core$IDeref$_deref$arity$1(null)));

if(cljs.core.empty_QMARK_(cljs.core.get.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(frontend.db.react.query_key__GT_components),query_100549))){
frontend.db.react.remove_q_BANG_(query_100549);
} else {
}


var G__100550 = seq__100426_100545;
var G__100551 = chunk__100427_100546;
var G__100552 = count__100428_100547;
var G__100553 = (i__100429_100548 + (1));
seq__100426_100545 = G__100550;
chunk__100427_100546 = G__100551;
count__100428_100547 = G__100552;
i__100429_100548 = G__100553;
continue;
} else {
var temp__5804__auto___100554__$1 = cljs.core.seq(seq__100426_100545);
if(temp__5804__auto___100554__$1){
var seq__100426_100555__$1 = temp__5804__auto___100554__$1;
if(cljs.core.chunked_seq_QMARK_(seq__100426_100555__$1)){
var c__5525__auto___100556 = cljs.core.chunk_first(seq__100426_100555__$1);
var G__100557 = cljs.core.chunk_rest(seq__100426_100555__$1);
var G__100558 = c__5525__auto___100556;
var G__100559 = cljs.core.count(c__5525__auto___100556);
var G__100560 = (0);
seq__100426_100545 = G__100557;
chunk__100427_100546 = G__100558;
count__100428_100547 = G__100559;
i__100429_100548 = G__100560;
continue;
} else {
var query_100561 = cljs.core.first(seq__100426_100555__$1);
frontend.db.react.query_key__GT_components.cljs$core$IVolatile$_vreset_BANG_$arity$2(null,((function (seq__100426_100545,chunk__100427_100546,count__100428_100547,i__100429_100548,query_100561,seq__100426_100555__$1,temp__5804__auto___100554__$1,queries_100544,temp__5804__auto___100543){
return (function (m){
var temp__5802__auto__ = cljs.core.not_empty(cljs.core.disj.cljs$core$IFn$_invoke$arity$2(cljs.core.get.cljs$core$IFn$_invoke$arity$2(m,query_100561),component));
if(cljs.core.truth_(temp__5802__auto__)){
var components_STAR_ = temp__5802__auto__;
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(m,query_100561,components_STAR_);
} else {
return cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(m,query_100561);
}
});})(seq__100426_100545,chunk__100427_100546,count__100428_100547,i__100429_100548,query_100561,seq__100426_100555__$1,temp__5804__auto___100554__$1,queries_100544,temp__5804__auto___100543))
(frontend.db.react.query_key__GT_components.cljs$core$IDeref$_deref$arity$1(null)));

if(cljs.core.empty_QMARK_(cljs.core.get.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(frontend.db.react.query_key__GT_components),query_100561))){
frontend.db.react.remove_q_BANG_(query_100561);
} else {
}


var G__100562 = cljs.core.next(seq__100426_100555__$1);
var G__100563 = null;
var G__100564 = (0);
var G__100565 = (0);
seq__100426_100545 = G__100562;
chunk__100427_100546 = G__100563;
count__100428_100547 = G__100564;
i__100429_100548 = G__100565;
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
if((function (){var G__100431 = cljs.core.deref(new cljs.core.Keyword(null,"result","result",1415092211).cljs$core$IFn$_invoke$arity$1(result));
if((!((G__100431 == null)))){
if((((G__100431.cljs$lang$protocol_mask$partition0$ & (262144))) || ((cljs.core.PROTOCOL_SENTINEL === G__100431.cljs$core$IWithMeta$)))){
return true;
} else {
if((!G__100431.cljs$lang$protocol_mask$partition0$)){
return cljs.core.native_satisfies_QMARK_(cljs.core.IWithMeta,G__100431);
} else {
return false;
}
}
} else {
return cljs.core.native_satisfies_QMARK_(cljs.core.IWithMeta,G__100431);
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
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
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
var len__5726__auto___100566 = arguments.length;
var i__5727__auto___100567 = (0);
while(true){
if((i__5727__auto___100567 < len__5726__auto___100566)){
args__5732__auto__.push((arguments[i__5727__auto___100567]));

var G__100568 = (i__5727__auto___100567 + (1));
i__5727__auto___100567 = G__100568;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((4) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((4)),(0),null)):null);
return frontend.db.react.q.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),(arguments[(1)]),(arguments[(2)]),(arguments[(3)]),argseq__5733__auto__);
});

(frontend.db.react.q.cljs$core$IFn$_invoke$arity$variadic = (function (repo,k,p__100437,query,inputs){
var map__100438 = p__100437;
var map__100438__$1 = cljs.core.__destructure_map(map__100438);
var use_cache_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__100438__$1,new cljs.core.Keyword(null,"use-cache?","use-cache?",-81331778),true);
var transform_fn = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__100438__$1,new cljs.core.Keyword(null,"transform-fn","transform-fn",1106801327),cljs.core.identity);
var query_fn = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__100438__$1,new cljs.core.Keyword(null,"query-fn","query-fn",-646736760));
var inputs_fn = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__100438__$1,new cljs.core.Keyword(null,"inputs-fn","inputs-fn",-1909882296));
var disable_reactive_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__100438__$1,new cljs.core.Keyword(null,"disable-reactive?","disable-reactive?",-1162731342));
var return_promise_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__100438__$1,new cljs.core.Keyword(null,"return-promise?","return-promise?",-230582088));
var built_in_query_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__100438__$1,new cljs.core.Keyword(null,"built-in-query?","built-in-query?",-1060650385));
var origin_key = k;
var k__$1 = cljs.core.vec(cljs.core.cons(repo,k));
var temp__5804__auto__ = frontend.db.conn.get_db.cljs$core$IFn$_invoke$arity$1(repo);
if(cljs.core.truth_(temp__5804__auto__)){
var db = temp__5804__auto__;
var result_atom = frontend.db.react.get_query_cached_result(k__$1);
var temp__5804__auto___100569__$1 = frontend.db.react._STAR_query_component_STAR_;
if(cljs.core.truth_(temp__5804__auto___100569__$1)){
var component_100570 = temp__5804__auto___100569__$1;
frontend.db.react.add_query_component_BANG_(k__$1,component_100570);
} else {
}

var temp__5804__auto___100571__$1 = frontend.db.react._STAR_reactive_queries_STAR_;
if(cljs.core.truth_(temp__5804__auto___100571__$1)){
var queries_100572 = temp__5804__auto___100571__$1;
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$3(queries_100572,cljs.core.conj,origin_key);
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
promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
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
(frontend.db.react.q.cljs$lang$applyTo = (function (seq100432){
var G__100433 = cljs.core.first(seq100432);
var seq100432__$1 = cljs.core.next(seq100432);
var G__100434 = cljs.core.first(seq100432__$1);
var seq100432__$2 = cljs.core.next(seq100432__$1);
var G__100435 = cljs.core.first(seq100432__$2);
var seq100432__$3 = cljs.core.next(seq100432__$2);
var G__100436 = cljs.core.first(seq100432__$3);
var seq100432__$4 = cljs.core.next(seq100432__$3);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__100433,G__100434,G__100435,G__100436,seq100432__$4);
}));

frontend.db.react.execute_query_BANG_ = (function frontend$db$react$execute_query_BANG_(graph,db,k,p__100439){
var map__100440 = p__100439;
var map__100440__$1 = cljs.core.__destructure_map(map__100440);
var query = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__100440__$1,new cljs.core.Keyword(null,"query","query",-1288509510));
var inputs = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__100440__$1,new cljs.core.Keyword(null,"inputs","inputs",865803858));
var transform_fn = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__100440__$1,new cljs.core.Keyword(null,"transform-fn","transform-fn",1106801327),cljs.core.identity);
var query_fn = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__100440__$1,new cljs.core.Keyword(null,"query-fn","query-fn",-646736760));
var inputs_fn = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__100440__$1,new cljs.core.Keyword(null,"inputs-fn","inputs-fn",-1909882296));
var result = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__100440__$1,new cljs.core.Keyword(null,"result","result",1415092211));
var built_in_query_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__100440__$1,new cljs.core.Keyword(null,"built-in-query?","built-in-query?",-1060650385));
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.db.react._LT_q_aux(graph,db,query_fn,inputs_fn,k,query,inputs,built_in_query_QMARK_)),(function (p_or_value){
return promesa.protocols._mcat(promesa.protocols._promise((transform_fn.cljs$core$IFn$_invoke$arity$1 ? transform_fn.cljs$core$IFn$_invoke$arity$1(p_or_value) : transform_fn.call(null,p_or_value))),(function (result_SINGLEQUOTE_){
return promesa.protocols._promise(((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(result_SINGLEQUOTE_,result))?null:frontend.db.react.set_new_result_BANG_(k,result_SINGLEQUOTE_)));
}));
}));
}));
});
frontend.db.react.refresh_affected_queries_BANG_ = (function frontend$db$react$refresh_affected_queries_BANG_(var_args){
var args__5732__auto__ = [];
var len__5726__auto___100573 = arguments.length;
var i__5727__auto___100574 = (0);
while(true){
if((i__5727__auto___100574 < len__5726__auto___100573)){
args__5732__auto__.push((arguments[i__5727__auto___100574]));

var G__100575 = (i__5727__auto___100574 + (1));
i__5727__auto___100574 = G__100575;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((2) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((2)),(0),null)):null);
return frontend.db.react.refresh_affected_queries_BANG_.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),(arguments[(1)]),argseq__5733__auto__);
});

(frontend.db.react.refresh_affected_queries_BANG_.cljs$core$IFn$_invoke$arity$variadic = (function (repo_url,affected_keys,p__100445){
var map__100446 = p__100445;
var map__100446__$1 = cljs.core.__destructure_map(map__100446);
var skip_kv_custom_keys_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__100446__$1,new cljs.core.Keyword(null,"skip-kv-custom-keys?","skip-kv-custom-keys?",-1568075009),false);
if(cljs.core.truth_(goog.DEBUG)){
var k__99485__auto__ = "refresh!";
console.time(k__99485__auto__);

var res__99486__auto__ = (function (){var db = frontend.db.conn.get_db.cljs$core$IFn$_invoke$arity$1(repo_url);
var affected_keys_set = cljs.core.set(affected_keys);
var state = cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (p__100447){
var vec__100448 = p__100447;
var k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__100448,(0),null);
var cache = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__100448,(1),null);
var k_SINGLEQUOTE_ = cljs.core.vec(cljs.core.rest(k));
if(((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.first(k),repo_url)) && (((cljs.core.contains_QMARK_(affected_keys_set,k_SINGLEQUOTE_)) || (cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"kv","kv",-1099920440),null,new cljs.core.Keyword(null,"custom","custom",340151948),null], null), null),cljs.core.first(k_SINGLEQUOTE_))))))){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [k_SINGLEQUOTE_,cache], null);
} else {
return null;
}
}),cljs.core.deref(frontend.db.react.query_state)));
var all_keys = cljs.core.concat.cljs$core$IFn$_invoke$arity$2(cljs.core.distinct.cljs$core$IFn$_invoke$arity$1(affected_keys),(cljs.core.truth_(skip_kv_custom_keys_QMARK_)?null:cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (p1__100441_SHARP_){
return cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"kv","kv",-1099920440),null,new cljs.core.Keyword(null,"custom","custom",340151948),null], null), null),cljs.core.first(p1__100441_SHARP_));
}),cljs.core.keys(state))));
var seq__100451 = cljs.core.seq(all_keys);
var chunk__100452 = null;
var count__100453 = (0);
var i__100454 = (0);
while(true){
if((i__100454 < count__100453)){
var k = chunk__100452.cljs$core$IIndexed$_nth$arity$2(null,i__100454);
var temp__5804__auto___100580 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(state,k);
if(cljs.core.truth_(temp__5804__auto___100580)){
var cache_100581 = temp__5804__auto___100580;
var map__100459_100582 = cache_100581;
var map__100459_100583__$1 = cljs.core.__destructure_map(map__100459_100582);
var query_100584 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__100459_100583__$1,new cljs.core.Keyword(null,"query","query",-1288509510));
var query_fn_100585 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__100459_100583__$1,new cljs.core.Keyword(null,"query-fn","query-fn",-646736760));
var custom_QMARK__100586 = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"custom","custom",340151948),cljs.core.first(k));
if(cljs.core.truth_((function (){var or__5002__auto__ = query_100584;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return query_fn_100585;
}
})())){
try{var f_100587 = ((function (seq__100451,chunk__100452,count__100453,i__100454,map__100459_100582,map__100459_100583__$1,query_100584,query_fn_100585,custom_QMARK__100586,cache_100581,temp__5804__auto___100580,k,db,affected_keys_set,state,all_keys,k__99485__auto__,map__100446,map__100446__$1,skip_kv_custom_keys_QMARK_){
return (function (){
return frontend.db.react.execute_query_BANG_(repo_url,db,cljs.core.vec(cljs.core.cons(repo_url,k)),cache_100581);
});})(seq__100451,chunk__100452,count__100453,i__100454,map__100459_100582,map__100459_100583__$1,query_100584,query_fn_100585,custom_QMARK__100586,cache_100581,temp__5804__auto___100580,k,db,affected_keys_set,state,all_keys,k__99485__auto__,map__100446,map__100446__$1,skip_kv_custom_keys_QMARK_))
;
if(custom_QMARK__100586){
cljs.core.async.put_BANG_.cljs$core$IFn$_invoke$arity$2(frontend.state.get_reactive_custom_queries_chan(),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [f_100587,query_100584], null));
} else {
f_100587();
}
}catch (e100460){var e_100589 = e100460;
console.error(e_100589);

}} else {
}
} else {
}


var G__100590 = seq__100451;
var G__100591 = chunk__100452;
var G__100592 = count__100453;
var G__100593 = (i__100454 + (1));
seq__100451 = G__100590;
chunk__100452 = G__100591;
count__100453 = G__100592;
i__100454 = G__100593;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__100451);
if(temp__5804__auto__){
var seq__100451__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__100451__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__100451__$1);
var G__100594 = cljs.core.chunk_rest(seq__100451__$1);
var G__100595 = c__5525__auto__;
var G__100596 = cljs.core.count(c__5525__auto__);
var G__100597 = (0);
seq__100451 = G__100594;
chunk__100452 = G__100595;
count__100453 = G__100596;
i__100454 = G__100597;
continue;
} else {
var k = cljs.core.first(seq__100451__$1);
var temp__5804__auto___100598__$1 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(state,k);
if(cljs.core.truth_(temp__5804__auto___100598__$1)){
var cache_100599 = temp__5804__auto___100598__$1;
var map__100461_100600 = cache_100599;
var map__100461_100601__$1 = cljs.core.__destructure_map(map__100461_100600);
var query_100602 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__100461_100601__$1,new cljs.core.Keyword(null,"query","query",-1288509510));
var query_fn_100603 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__100461_100601__$1,new cljs.core.Keyword(null,"query-fn","query-fn",-646736760));
var custom_QMARK__100604 = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"custom","custom",340151948),cljs.core.first(k));
if(cljs.core.truth_((function (){var or__5002__auto__ = query_100602;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return query_fn_100603;
}
})())){
try{var f_100605 = ((function (seq__100451,chunk__100452,count__100453,i__100454,map__100461_100600,map__100461_100601__$1,query_100602,query_fn_100603,custom_QMARK__100604,cache_100599,temp__5804__auto___100598__$1,k,seq__100451__$1,temp__5804__auto__,db,affected_keys_set,state,all_keys,k__99485__auto__,map__100446,map__100446__$1,skip_kv_custom_keys_QMARK_){
return (function (){
return frontend.db.react.execute_query_BANG_(repo_url,db,cljs.core.vec(cljs.core.cons(repo_url,k)),cache_100599);
});})(seq__100451,chunk__100452,count__100453,i__100454,map__100461_100600,map__100461_100601__$1,query_100602,query_fn_100603,custom_QMARK__100604,cache_100599,temp__5804__auto___100598__$1,k,seq__100451__$1,temp__5804__auto__,db,affected_keys_set,state,all_keys,k__99485__auto__,map__100446,map__100446__$1,skip_kv_custom_keys_QMARK_))
;
if(custom_QMARK__100604){
cljs.core.async.put_BANG_.cljs$core$IFn$_invoke$arity$2(frontend.state.get_reactive_custom_queries_chan(),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [f_100605,query_100602], null));
} else {
f_100605();
}
}catch (e100462){var e_100606 = e100462;
console.error(e_100606);

}} else {
}
} else {
}


var G__100607 = cljs.core.next(seq__100451__$1);
var G__100608 = null;
var G__100609 = (0);
var G__100610 = (0);
seq__100451 = G__100607;
chunk__100452 = G__100608;
count__100453 = G__100609;
i__100454 = G__100610;
continue;
}
} else {
return null;
}
}
break;
}
})();
console.timeEnd(k__99485__auto__);

return res__99486__auto__;
} else {
var db = frontend.db.conn.get_db.cljs$core$IFn$_invoke$arity$1(repo_url);
var affected_keys_set = cljs.core.set(affected_keys);
var state = cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (p__100463){
var vec__100464 = p__100463;
var k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__100464,(0),null);
var cache = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__100464,(1),null);
var k_SINGLEQUOTE_ = cljs.core.vec(cljs.core.rest(k));
if(((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.first(k),repo_url)) && (((cljs.core.contains_QMARK_(affected_keys_set,k_SINGLEQUOTE_)) || (cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"kv","kv",-1099920440),null,new cljs.core.Keyword(null,"custom","custom",340151948),null], null), null),cljs.core.first(k_SINGLEQUOTE_))))))){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [k_SINGLEQUOTE_,cache], null);
} else {
return null;
}
}),cljs.core.deref(frontend.db.react.query_state)));
var all_keys = cljs.core.concat.cljs$core$IFn$_invoke$arity$2(cljs.core.distinct.cljs$core$IFn$_invoke$arity$1(affected_keys),(cljs.core.truth_(skip_kv_custom_keys_QMARK_)?null:cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (p1__100441_SHARP_){
return cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"kv","kv",-1099920440),null,new cljs.core.Keyword(null,"custom","custom",340151948),null], null), null),cljs.core.first(p1__100441_SHARP_));
}),cljs.core.keys(state))));
var seq__100467 = cljs.core.seq(all_keys);
var chunk__100468 = null;
var count__100469 = (0);
var i__100470 = (0);
while(true){
if((i__100470 < count__100469)){
var k = chunk__100468.cljs$core$IIndexed$_nth$arity$2(null,i__100470);
var temp__5804__auto___100617 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(state,k);
if(cljs.core.truth_(temp__5804__auto___100617)){
var cache_100618 = temp__5804__auto___100617;
var map__100475_100619 = cache_100618;
var map__100475_100620__$1 = cljs.core.__destructure_map(map__100475_100619);
var query_100621 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__100475_100620__$1,new cljs.core.Keyword(null,"query","query",-1288509510));
var query_fn_100622 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__100475_100620__$1,new cljs.core.Keyword(null,"query-fn","query-fn",-646736760));
var custom_QMARK__100623 = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"custom","custom",340151948),cljs.core.first(k));
if(cljs.core.truth_((function (){var or__5002__auto__ = query_100621;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return query_fn_100622;
}
})())){
try{var f_100629 = ((function (seq__100467,chunk__100468,count__100469,i__100470,map__100475_100619,map__100475_100620__$1,query_100621,query_fn_100622,custom_QMARK__100623,cache_100618,temp__5804__auto___100617,k,db,affected_keys_set,state,all_keys,map__100446,map__100446__$1,skip_kv_custom_keys_QMARK_){
return (function (){
return frontend.db.react.execute_query_BANG_(repo_url,db,cljs.core.vec(cljs.core.cons(repo_url,k)),cache_100618);
});})(seq__100467,chunk__100468,count__100469,i__100470,map__100475_100619,map__100475_100620__$1,query_100621,query_fn_100622,custom_QMARK__100623,cache_100618,temp__5804__auto___100617,k,db,affected_keys_set,state,all_keys,map__100446,map__100446__$1,skip_kv_custom_keys_QMARK_))
;
if(custom_QMARK__100623){
cljs.core.async.put_BANG_.cljs$core$IFn$_invoke$arity$2(frontend.state.get_reactive_custom_queries_chan(),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [f_100629,query_100621], null));
} else {
f_100629();
}
}catch (e100476){var e_100630 = e100476;
console.error(e_100630);

}} else {
}
} else {
}


var G__100631 = seq__100467;
var G__100632 = chunk__100468;
var G__100633 = count__100469;
var G__100634 = (i__100470 + (1));
seq__100467 = G__100631;
chunk__100468 = G__100632;
count__100469 = G__100633;
i__100470 = G__100634;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__100467);
if(temp__5804__auto__){
var seq__100467__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__100467__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__100467__$1);
var G__100635 = cljs.core.chunk_rest(seq__100467__$1);
var G__100636 = c__5525__auto__;
var G__100637 = cljs.core.count(c__5525__auto__);
var G__100638 = (0);
seq__100467 = G__100635;
chunk__100468 = G__100636;
count__100469 = G__100637;
i__100470 = G__100638;
continue;
} else {
var k = cljs.core.first(seq__100467__$1);
var temp__5804__auto___100639__$1 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(state,k);
if(cljs.core.truth_(temp__5804__auto___100639__$1)){
var cache_100640 = temp__5804__auto___100639__$1;
var map__100477_100641 = cache_100640;
var map__100477_100642__$1 = cljs.core.__destructure_map(map__100477_100641);
var query_100643 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__100477_100642__$1,new cljs.core.Keyword(null,"query","query",-1288509510));
var query_fn_100644 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__100477_100642__$1,new cljs.core.Keyword(null,"query-fn","query-fn",-646736760));
var custom_QMARK__100645 = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"custom","custom",340151948),cljs.core.first(k));
if(cljs.core.truth_((function (){var or__5002__auto__ = query_100643;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return query_fn_100644;
}
})())){
try{var f_100646 = ((function (seq__100467,chunk__100468,count__100469,i__100470,map__100477_100641,map__100477_100642__$1,query_100643,query_fn_100644,custom_QMARK__100645,cache_100640,temp__5804__auto___100639__$1,k,seq__100467__$1,temp__5804__auto__,db,affected_keys_set,state,all_keys,map__100446,map__100446__$1,skip_kv_custom_keys_QMARK_){
return (function (){
return frontend.db.react.execute_query_BANG_(repo_url,db,cljs.core.vec(cljs.core.cons(repo_url,k)),cache_100640);
});})(seq__100467,chunk__100468,count__100469,i__100470,map__100477_100641,map__100477_100642__$1,query_100643,query_fn_100644,custom_QMARK__100645,cache_100640,temp__5804__auto___100639__$1,k,seq__100467__$1,temp__5804__auto__,db,affected_keys_set,state,all_keys,map__100446,map__100446__$1,skip_kv_custom_keys_QMARK_))
;
if(custom_QMARK__100645){
cljs.core.async.put_BANG_.cljs$core$IFn$_invoke$arity$2(frontend.state.get_reactive_custom_queries_chan(),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [f_100646,query_100643], null));
} else {
f_100646();
}
}catch (e100478){var e_100647 = e100478;
console.error(e_100647);

}} else {
}
} else {
}


var G__100648 = cljs.core.next(seq__100467__$1);
var G__100649 = null;
var G__100650 = (0);
var G__100651 = (0);
seq__100467 = G__100648;
chunk__100468 = G__100649;
count__100469 = G__100650;
i__100470 = G__100651;
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
(frontend.db.react.refresh_affected_queries_BANG_.cljs$lang$applyTo = (function (seq100442){
var G__100443 = cljs.core.first(seq100442);
var seq100442__$1 = cljs.core.next(seq100442);
var G__100444 = cljs.core.first(seq100442__$1);
var seq100442__$2 = cljs.core.next(seq100442__$1);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__100443,G__100444,seq100442__$2);
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
var c__32195__auto___100653 = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run((function (){
var f__32196__auto__ = (function (){var switch__32003__auto__ = (function (state_100517){
var state_val_100518 = (state_100517[(1)]);
if((state_val_100518 === (7))){
var inst_100486 = (state_100517[(7)]);
var inst_100487 = (state_100517[(2)]);
var inst_100488 = [cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("custom-query","failed","custom-query/failed",310909234)),"\n",cljs.core.str.cljs$core$IFn$_invoke$arity$1(inst_100486)].join('');
var inst_100489 = console.error(inst_100488);
var inst_100490 = console.error(inst_100487);
var state_100517__$1 = (function (){var statearr_100519 = state_100517;
(statearr_100519[(8)] = inst_100489);

return statearr_100519;
})();
var statearr_100520_100654 = state_100517__$1;
(statearr_100520_100654[(2)] = inst_100490);

(statearr_100520_100654[(1)] = (6));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_100518 === (1))){
var state_100517__$1 = state_100517;
var statearr_100521_100655 = state_100517__$1;
(statearr_100521_100655[(2)] = null);

(statearr_100521_100655[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_100518 === (4))){
var inst_100484 = (state_100517[(2)]);
var inst_100485 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(inst_100484,(0),null);
var inst_100486 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(inst_100484,(1),null);
var state_100517__$1 = (function (){var statearr_100522 = state_100517;
(statearr_100522[(9)] = inst_100485);

(statearr_100522[(7)] = inst_100486);

return statearr_100522;
})();
var statearr_100523_100656 = state_100517__$1;
(statearr_100523_100656[(2)] = null);

(statearr_100523_100656[(1)] = (5));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_100518 === (6))){
var inst_100512 = (state_100517[(2)]);
var state_100517__$1 = (function (){var statearr_100524 = state_100517;
(statearr_100524[(10)] = inst_100512);

return statearr_100524;
})();
var statearr_100525_100657 = state_100517__$1;
(statearr_100525_100657[(2)] = null);

(statearr_100525_100657[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_100518 === (3))){
var inst_100515 = (state_100517[(2)]);
var state_100517__$1 = state_100517;
return cljs.core.async.impl.ioc_helpers.return_chan(state_100517__$1,inst_100515);
} else {
if((state_val_100518 === (12))){
var inst_100485 = (state_100517[(9)]);
var inst_100486 = (state_100517[(7)]);
var inst_100503 = (state_100517[(2)]);
var inst_100504 = cljs.core.PersistentVector.EMPTY_NODE;
var inst_100505 = [inst_100485,inst_100486];
var inst_100506 = (new cljs.core.PersistentVector(null,2,(5),inst_100504,inst_100505,null));
var inst_100507 = cljs.core.async.put_BANG_.cljs$core$IFn$_invoke$arity$2(chan,inst_100506);
var state_100517__$1 = (function (){var statearr_100526 = state_100517;
(statearr_100526[(11)] = inst_100503);

return statearr_100526;
})();
var statearr_100527_100658 = state_100517__$1;
(statearr_100527_100658[(2)] = inst_100507);

(statearr_100527_100658[(1)] = (11));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_100518 === (2))){
var state_100517__$1 = state_100517;
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_100517__$1,(4),chan);
} else {
if((state_val_100518 === (11))){
var inst_100509 = (state_100517[(2)]);
var _ = (function (){var statearr_100528 = state_100517;
(statearr_100528[(4)] = cljs.core.rest((state_100517[(4)])));

return statearr_100528;
})();
var state_100517__$1 = state_100517;
var statearr_100529_100659 = state_100517__$1;
(statearr_100529_100659[(2)] = inst_100509);

(statearr_100529_100659[(1)] = (6));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_100518 === (9))){
var inst_100485 = (state_100517[(9)]);
var inst_100499 = (inst_100485.cljs$core$IFn$_invoke$arity$0 ? inst_100485.cljs$core$IFn$_invoke$arity$0() : inst_100485.call(null));
var state_100517__$1 = state_100517;
var statearr_100530_100660 = state_100517__$1;
(statearr_100530_100660[(2)] = inst_100499);

(statearr_100530_100660[(1)] = (11));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_100518 === (5))){
var _ = (function (){var statearr_100532 = state_100517;
(statearr_100532[(4)] = cljs.core.cons((8),(state_100517[(4)])));

return statearr_100532;
})();
var inst_100496 = frontend.state.get_current_repo();
var inst_100497 = frontend.state.input_idle_QMARK_(inst_100496);
var state_100517__$1 = state_100517;
if(cljs.core.truth_(inst_100497)){
var statearr_100533_100661 = state_100517__$1;
(statearr_100533_100661[(1)] = (9));

} else {
var statearr_100534_100662 = state_100517__$1;
(statearr_100534_100662[(1)] = (10));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_100518 === (10))){
var inst_100501 = cljs.core.async.timeout((2000));
var state_100517__$1 = state_100517;
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_100517__$1,(12),inst_100501);
} else {
if((state_val_100518 === (8))){
var _ = (function (){var statearr_100535 = state_100517;
(statearr_100535[(4)] = cljs.core.rest((state_100517[(4)])));

return statearr_100535;
})();
var state_100517__$1 = state_100517;
var ex100531 = (state_100517__$1[(2)]);
var statearr_100536_100663 = state_100517__$1;
(statearr_100536_100663[(5)] = ex100531);


var statearr_100537_100664 = state_100517__$1;
(statearr_100537_100664[(1)] = (7));

(statearr_100537_100664[(5)] = null);



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
var frontend$db$react$run_custom_queries_when_idle_BANG__$_state_machine__32004__auto__ = null;
var frontend$db$react$run_custom_queries_when_idle_BANG__$_state_machine__32004__auto____0 = (function (){
var statearr_100538 = [null,null,null,null,null,null,null,null,null,null,null,null];
(statearr_100538[(0)] = frontend$db$react$run_custom_queries_when_idle_BANG__$_state_machine__32004__auto__);

(statearr_100538[(1)] = (1));

return statearr_100538;
});
var frontend$db$react$run_custom_queries_when_idle_BANG__$_state_machine__32004__auto____1 = (function (state_100517){
while(true){
var ret_value__32005__auto__ = (function (){try{while(true){
var result__32006__auto__ = switch__32003__auto__(state_100517);
if(cljs.core.keyword_identical_QMARK_(result__32006__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__32006__auto__;
}
break;
}
}catch (e100539){var ex__32007__auto__ = e100539;
var statearr_100540_100665 = state_100517;
(statearr_100540_100665[(2)] = ex__32007__auto__);


if(cljs.core.seq((state_100517[(4)]))){
var statearr_100541_100666 = state_100517;
(statearr_100541_100666[(1)] = cljs.core.first((state_100517[(4)])));

} else {
throw ex__32007__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__32005__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__100667 = state_100517;
state_100517 = G__100667;
continue;
} else {
return ret_value__32005__auto__;
}
break;
}
});
frontend$db$react$run_custom_queries_when_idle_BANG__$_state_machine__32004__auto__ = function(state_100517){
switch(arguments.length){
case 0:
return frontend$db$react$run_custom_queries_when_idle_BANG__$_state_machine__32004__auto____0.call(this);
case 1:
return frontend$db$react$run_custom_queries_when_idle_BANG__$_state_machine__32004__auto____1.call(this,state_100517);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
frontend$db$react$run_custom_queries_when_idle_BANG__$_state_machine__32004__auto__.cljs$core$IFn$_invoke$arity$0 = frontend$db$react$run_custom_queries_when_idle_BANG__$_state_machine__32004__auto____0;
frontend$db$react$run_custom_queries_when_idle_BANG__$_state_machine__32004__auto__.cljs$core$IFn$_invoke$arity$1 = frontend$db$react$run_custom_queries_when_idle_BANG__$_state_machine__32004__auto____1;
return frontend$db$react$run_custom_queries_when_idle_BANG__$_state_machine__32004__auto__;
})()
})();
var state__32197__auto__ = (function (){var statearr_100542 = f__32196__auto__();
(statearr_100542[(6)] = c__32195__auto___100653);

return statearr_100542;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__32197__auto__);
}));


return chan;
});

//# sourceMappingURL=frontend.db.react.js.map
