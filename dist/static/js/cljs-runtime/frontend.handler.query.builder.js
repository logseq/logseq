goog.provide('frontend.handler.query.builder');
frontend.handler.query.builder.operators = new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"and","and",-971899817),new cljs.core.Keyword(null,"or","or",235744169),new cljs.core.Keyword(null,"not","not",-595976884)], null);
frontend.handler.query.builder.operators_set = cljs.core.set(frontend.handler.query.builder.operators);
frontend.handler.query.builder.page_filters = new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, ["all page tags","namespace","tags","property","sample"], null);
frontend.handler.query.builder.block_filters = new cljs.core.PersistentVector(null, 8, 5, cljs.core.PersistentVector.EMPTY_NODE, ["page reference","property","task","priority","page","full text search","between","sample"], null);
frontend.handler.query.builder.db_based_block_filters = new cljs.core.PersistentVector(null, 9, 5, cljs.core.PersistentVector.EMPTY_NODE, ["tags","page reference","property","task","priority","page","full text search","between","sample"], null);
frontend.handler.query.builder.vec_dissoc_item = (function frontend$handler$query$builder$vec_dissoc_item(vec,idx){
return cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.subvec.cljs$core$IFn$_invoke$arity$3(vec,(0),idx),cljs.core.subvec.cljs$core$IFn$_invoke$arity$2(vec,(idx + (1))));
});
frontend.handler.query.builder.vec_assoc_item = (function frontend$handler$query$builder$vec_assoc_item(vec,idx,item){
return cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.conj.cljs$core$IFn$_invoke$arity$2(cljs.core.subvec.cljs$core$IFn$_invoke$arity$3(vec,(0),idx),item),cljs.core.subvec.cljs$core$IFn$_invoke$arity$2(vec,idx));
});
frontend.handler.query.builder.vec_replace_item = (function frontend$handler$query$builder$vec_replace_item(v,idx,item){
return cljs.core.into.cljs$core$IFn$_invoke$arity$2(((((cljs.core.coll_QMARK_(item)) && (cljs.core.not((function (){var G__79195 = cljs.core.first(item);
return (frontend.handler.query.builder.operators_set.cljs$core$IFn$_invoke$arity$1 ? frontend.handler.query.builder.operators_set.cljs$core$IFn$_invoke$arity$1(G__79195) : frontend.handler.query.builder.operators_set.call(null,G__79195));
})()))))?cljs.core.vec(cljs.core.concat.cljs$core$IFn$_invoke$arity$2(cljs.core.subvec.cljs$core$IFn$_invoke$arity$3(v,(0),idx),item)):cljs.core.conj.cljs$core$IFn$_invoke$arity$2(cljs.core.subvec.cljs$core$IFn$_invoke$arity$3(v,(0),idx),item)),cljs.core.subvec.cljs$core$IFn$_invoke$arity$2(v,(idx + (1))));
});
frontend.handler.query.builder.add_element = (function frontend$handler$query$builder$add_element(q,loc,x){
if(cljs.core.vector_QMARK_(loc)){
} else {
throw (new Error("Assert failed: (vector? loc)"));
}

if((!((x == null)))){
} else {
throw (new Error("Assert failed: (some? x)"));
}

if(((cljs.core.seq(loc)) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2((1),cljs.core.count(loc))))){
return frontend.handler.query.builder.vec_assoc_item(q,cljs.core.first(loc),x);
} else {
if(cljs.core.seq(loc)){
return cljs.core.update_in.cljs$core$IFn$_invoke$arity$3(q,cljs.core.vec(cljs.core.butlast(loc)),(function (v){
return frontend.handler.query.builder.vec_assoc_item(v,cljs.core.last(loc),x);
}));
} else {
if(cljs.core.seq(q)){
return cljs.core.conj.cljs$core$IFn$_invoke$arity$2(q,x);
} else {
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [x], null);

}
}
}
});
frontend.handler.query.builder.append_element = (function frontend$handler$query$builder$append_element(q,loc,x){
if(cljs.core.vector_QMARK_(loc)){
} else {
throw (new Error("Assert failed: (vector? loc)"));
}

if((!((x == null)))){
} else {
throw (new Error("Assert failed: (some? x)"));
}

var idx = cljs.core.count(cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(q,cljs.core.vec(cljs.core.butlast(loc))));
var loc_SINGLEQUOTE_ = frontend.handler.query.builder.vec_replace_item(loc,(cljs.core.count(loc) - (1)),idx);
return frontend.handler.query.builder.add_element(q,loc_SINGLEQUOTE_,x);
});
frontend.handler.query.builder.remove_element = (function frontend$handler$query$builder$remove_element(q,loc){
if(cljs.core.seq(loc)){
var idx = cljs.core.last(loc);
var ks = cljs.core.vec(cljs.core.butlast(loc));
var f = (function (p1__79220_SHARP_){
return frontend.handler.query.builder.vec_dissoc_item(p1__79220_SHARP_,idx);
});
if(cljs.core.seq(ks)){
var result = cljs.core.update_in.cljs$core$IFn$_invoke$arity$3(q,ks,f);
if(cljs.core.seq(cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(result,ks))){
return result;
} else {
return (frontend.handler.query.builder.remove_element.cljs$core$IFn$_invoke$arity$2 ? frontend.handler.query.builder.remove_element.cljs$core$IFn$_invoke$arity$2(result,ks) : frontend.handler.query.builder.remove_element.call(null,result,ks));
}
} else {
return f(q);
}
} else {
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"and","and",-971899817)], null);
}
});
frontend.handler.query.builder.replace_element = (function frontend$handler$query$builder$replace_element(q,loc,x){
if(cljs.core.vector_QMARK_(loc)){
} else {
throw (new Error("Assert failed: (vector? loc)"));
}

if(cljs.core.seq(loc)){
} else {
throw (new Error("Assert failed: (seq loc)"));
}

if((!((x == null)))){
} else {
throw (new Error("Assert failed: (some? x)"));
}

if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2((1),cljs.core.count(loc))){
return frontend.handler.query.builder.vec_replace_item(q,cljs.core.first(loc),x);
} else {
return cljs.core.update_in.cljs$core$IFn$_invoke$arity$3(q,cljs.core.vec(cljs.core.butlast(loc)),(function (v){
return frontend.handler.query.builder.vec_replace_item(v,cljs.core.last(loc),x);
}));
}
});
frontend.handler.query.builder.fallback_to_default = (function frontend$handler$query$builder$fallback_to_default(result,default_value,failed_data){
if(cljs.core.empty_QMARK_(result)){
lambdaisland.glogi.log.cljs$core$IFn$_invoke$arity$4("frontend.handler.query.builder",new cljs.core.Keyword(null,"error","error",-978969032),cljs.core.identity(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("query-builder","wrap-unwrap-operator-failed","query-builder/wrap-unwrap-operator-failed",-1899620271),failed_data,new cljs.core.Keyword(null,"line","line",212345235),107], null)),null);

return default_value;
} else {
return result;
}
});
frontend.handler.query.builder.wrap_operator = (function frontend$handler$query$builder$wrap_operator(q,loc,operator){
if(cljs.core.seq(q)){
} else {
throw (new Error("Assert failed: (seq q)"));
}

if(cljs.core.truth_((frontend.handler.query.builder.operators_set.cljs$core$IFn$_invoke$arity$1 ? frontend.handler.query.builder.operators_set.cljs$core$IFn$_invoke$arity$1(operator) : frontend.handler.query.builder.operators_set.call(null,operator)))){
} else {
throw (new Error("Assert failed: (operators-set operator)"));
}

var result = ((((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(loc,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [(0)], null))) || (cljs.core.empty_QMARK_(loc))))?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [operator,q], null):(function (){var temp__5804__auto__ = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(q,loc);
if(cljs.core.truth_(temp__5804__auto__)){
var x = temp__5804__auto__;
var x_SINGLEQUOTE_ = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [operator,x], null);
return frontend.handler.query.builder.replace_element(q,loc,x_SINGLEQUOTE_);
} else {
return null;
}
})());
return frontend.handler.query.builder.fallback_to_default(result,q,new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"op","op",-1882987955),"wrap-operator",new cljs.core.Keyword(null,"q","q",689001697),q,new cljs.core.Keyword(null,"loc","loc",-584284901),loc,new cljs.core.Keyword(null,"operator","operator",-1860875338),operator], null));
});
frontend.handler.query.builder.unwrap_operator = (function frontend$handler$query$builder$unwrap_operator(q,loc){
if(cljs.core.seq(q)){
} else {
throw (new Error("Assert failed: (seq q)"));
}

if(cljs.core.seq(loc)){
} else {
throw (new Error("Assert failed: (seq loc)"));
}

var result = (cljs.core.truth_((function (){var and__5000__auto__ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(loc,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [(0)], null));
if(and__5000__auto__){
var G__79274 = cljs.core.first(q);
return (frontend.handler.query.builder.operators_set.cljs$core$IFn$_invoke$arity$1 ? frontend.handler.query.builder.operators_set.cljs$core$IFn$_invoke$arity$1(G__79274) : frontend.handler.query.builder.operators_set.call(null,G__79274));
} else {
return and__5000__auto__;
}
})())?cljs.core.second(q):(function (){var temp__5804__auto__ = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(q,loc);
if(cljs.core.truth_(temp__5804__auto__)){
var x = temp__5804__auto__;
if(cljs.core.truth_((function (){var and__5000__auto__ = (function (){var G__79277 = cljs.core.first(x);
return (frontend.handler.query.builder.operators_set.cljs$core$IFn$_invoke$arity$1 ? frontend.handler.query.builder.operators_set.cljs$core$IFn$_invoke$arity$1(G__79277) : frontend.handler.query.builder.operators_set.call(null,G__79277));
})();
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.seq(cljs.core.rest(x));
} else {
return and__5000__auto__;
}
})())){
var x_SINGLEQUOTE_ = cljs.core.rest(x);
return frontend.handler.query.builder.replace_element(q,loc,x_SINGLEQUOTE_);
} else {
return null;
}
} else {
return null;
}
})());
return frontend.handler.query.builder.fallback_to_default(result,q,new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"op","op",-1882987955),"unwrap-operator",new cljs.core.Keyword(null,"q","q",689001697),q,new cljs.core.Keyword(null,"loc","loc",-584284901),loc], null));
});
frontend.handler.query.builder.__GT_page_ref = (function frontend$handler$query$builder$__GT_page_ref(x){
if(typeof x === 'string'){
return cljs.core.symbol.cljs$core$IFn$_invoke$arity$1(logseq.common.util.page_ref.__GT_page_ref(x));
} else {
var G__79282 = cljs.core.second(x);
return (frontend.handler.query.builder.__GT_page_ref.cljs$core$IFn$_invoke$arity$1 ? frontend.handler.query.builder.__GT_page_ref.cljs$core$IFn$_invoke$arity$1(G__79282) : frontend.handler.query.builder.__GT_page_ref.call(null,G__79282));
}
});
frontend.handler.query.builder.__GT_dsl_STAR_ = (function frontend$handler$query$builder$__GT_dsl_STAR_(f){
if(((cljs.core.vector_QMARK_(f)) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"priority","priority",1431093715),cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(cljs.core.first(f)))))){
return cljs.core.vec(cljs.core.cons(cljs.core.symbol.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"priority","priority",1431093715)),cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.symbol,cljs.core.rest(f))));
} else {
if(((cljs.core.vector_QMARK_(f)) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"task","task",-1476607993),cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(cljs.core.first(f)))))){
return cljs.core.vec(cljs.core.cons(cljs.core.symbol.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"task","task",-1476607993)),cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.str,cljs.core.rest(f))));
} else {
if(((cljs.core.vector_QMARK_(f)) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"page-ref","page-ref",-1047131151),cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(cljs.core.first(f)))))){
return frontend.handler.query.builder.__GT_page_ref(cljs.core.second(f));
} else {
if(((cljs.core.vector_QMARK_(f)) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"tags","tags",1771418977),cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(cljs.core.first(f)))))){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.symbol.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"tags","tags",1771418977)),frontend.handler.query.builder.__GT_page_ref(cljs.core.second(f))], null);
} else {
if(((cljs.core.vector_QMARK_(f)) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"page-tags","page-tags",-1009436025),cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(cljs.core.first(f)))))){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.symbol.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"page-tags","page-tags",-1009436025)),frontend.handler.query.builder.__GT_page_ref(cljs.core.second(f))], null);
} else {
if(((cljs.core.vector_QMARK_(f)) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"between","between",1131099276),cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(cljs.core.first(f)))))){
return cljs.core.into.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.symbol.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"between","between",1131099276))], null),cljs.core.map.cljs$core$IFn$_invoke$arity$2(frontend.handler.query.builder.__GT_page_ref,cljs.core.rest(f)));
} else {
if(((cljs.core.vector_QMARK_(f)) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2((3),cljs.core.count(f))) && (cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"page-property","page-property",-417044665),null,new cljs.core.Keyword(null,"property","property",-1114278232),null,new cljs.core.Keyword(null,"private-property","private-property",1080779061),null], null), null),cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(cljs.core.first(f)))))))){
var l = ((logseq.common.util.page_ref.page_ref_QMARK_(cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.last(f))))?cljs.core.symbol.cljs$core$IFn$_invoke$arity$1(cljs.core.last(f)):cljs.core.last(f));
return cljs.core.into.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.symbol.cljs$core$IFn$_invoke$arity$1(cljs.core.first(f))], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.second(f),l], null));
} else {
if(((cljs.core.vector_QMARK_(f)) && (cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"tags","tags",1771418977),null,new cljs.core.Keyword(null,"page","page",849072397),null,new cljs.core.Keyword(null,"namespace","namespace",-377510372),null], null), null),cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(cljs.core.first(f)))))){
return cljs.core.into.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.symbol.cljs$core$IFn$_invoke$arity$1(cljs.core.first(f))], null),cljs.core.map.cljs$core$IFn$_invoke$arity$2(frontend.handler.query.builder.__GT_page_ref,cljs.core.rest(f)));
} else {
return f;

}
}
}
}
}
}
}
}
});
frontend.handler.query.builder.__GT_dsl = (function frontend$handler$query$builder$__GT_dsl(col){
return frontend.db.query_dsl.simplify_query(clojure.walk.prewalk((function (f){
var f_SINGLEQUOTE_ = frontend.handler.query.builder.__GT_dsl_STAR_(f);
if(cljs.core.truth_((function (){var and__5000__auto__ = cljs.core.vector_QMARK_(f_SINGLEQUOTE_);
if(and__5000__auto__){
return cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(cljs.core.first(f_SINGLEQUOTE_));
} else {
return and__5000__auto__;
}
})())){
return cljs.core.cons(cljs.core.symbol.cljs$core$IFn$_invoke$arity$1(cljs.core.first(f_SINGLEQUOTE_)),cljs.core.rest(f_SINGLEQUOTE_));
} else {
return f_SINGLEQUOTE_;

}
}),col));
});
frontend.handler.query.builder.from_dsl = (function frontend$handler$query$builder$from_dsl(dsl_form){
return clojure.walk.prewalk((function (f){
if(((cljs.core.vector_QMARK_(f)) && (cljs.core.vector_QMARK_(cljs.core.first(f))))){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"page-ref","page-ref",-1047131151),logseq.common.util.page_ref.get_page_name(cljs.core.str.cljs$core$IFn$_invoke$arity$1(f))], null);
} else {
if(cljs.core.truth_((function (){var and__5000__auto__ = typeof f === 'string';
if(and__5000__auto__){
return logseq.common.util.page_ref.get_page_name(f);
} else {
return and__5000__auto__;
}
})())){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"page-ref","page-ref",-1047131151),logseq.common.util.page_ref.get_page_name(f)], null);
} else {
if(cljs.core.truth_((function (){var and__5000__auto__ = cljs.core.list_QMARK_(f);
if(and__5000__auto__){
var and__5000__auto____$1 = (cljs.core.first(f) instanceof cljs.core.Symbol);
if(and__5000__auto____$1){
var G__79342 = cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(cljs.core.first(f));
return (frontend.handler.query.builder.operators_set.cljs$core$IFn$_invoke$arity$1 ? frontend.handler.query.builder.operators_set.cljs$core$IFn$_invoke$arity$1(G__79342) : frontend.handler.query.builder.operators_set.call(null,G__79342));
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})())){
return cljs.core.into.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(cljs.core.first(f))], null),cljs.core.rest(f));
} else {
if(cljs.core.list_QMARK_(f)){
return cljs.core.vec(f);
} else {
return f;

}
}
}
}
}),dsl_form);
});

//# sourceMappingURL=frontend.handler.query.builder.js.map
