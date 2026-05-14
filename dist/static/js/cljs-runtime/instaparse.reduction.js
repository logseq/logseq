goog.provide('instaparse.reduction');
instaparse.reduction.singleton_QMARK_ = (function instaparse$reduction$singleton_QMARK_(s){
return ((cljs.core.seq(s)) && (cljs.core.not(cljs.core.next(s))));
});
instaparse.reduction.red = (function instaparse$reduction$red(parser,f){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(parser,new cljs.core.Keyword(null,"red","red",-969428204),f);
});
instaparse.reduction.raw_non_terminal_reduction = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"reduction-type","reduction-type",-488293450),new cljs.core.Keyword(null,"raw","raw",1604651272)], null);
instaparse.reduction.HiccupNonTerminalReduction = (function instaparse$reduction$HiccupNonTerminalReduction(key){
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"reduction-type","reduction-type",-488293450),new cljs.core.Keyword(null,"hiccup","hiccup",1218876238),new cljs.core.Keyword(null,"key","key",-1516042587),key], null);
});
instaparse.reduction.EnliveNonTerminalReduction = (function instaparse$reduction$EnliveNonTerminalReduction(key){
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"reduction-type","reduction-type",-488293450),new cljs.core.Keyword(null,"enlive","enlive",1679023921),new cljs.core.Keyword(null,"key","key",-1516042587),key], null);
});
instaparse.reduction.reduction_types = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"hiccup","hiccup",1218876238),instaparse.reduction.HiccupNonTerminalReduction,new cljs.core.Keyword(null,"enlive","enlive",1679023921),instaparse.reduction.EnliveNonTerminalReduction], null);
instaparse.reduction.node_builders = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"enlive","enlive",1679023921),(function (tag,item){
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"tag","tag",-1290361223),tag,new cljs.core.Keyword(null,"content","content",15833224),(new cljs.core.List(null,item,null,(1),null))], null);
}),new cljs.core.Keyword(null,"hiccup","hiccup",1218876238),(function (tag,item){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [tag,item], null);
})], null);
instaparse.reduction.standard_non_terminal_reduction = new cljs.core.Keyword(null,"hiccup","hiccup",1218876238);
instaparse.reduction.apply_reduction = (function instaparse$reduction$apply_reduction(f,result){
var G__134831 = new cljs.core.Keyword(null,"reduction-type","reduction-type",-488293450).cljs$core$IFn$_invoke$arity$1(f);
var G__134831__$1 = (((G__134831 instanceof cljs.core.Keyword))?G__134831.fqn:null);
switch (G__134831__$1) {
case "raw":
return instaparse.auto_flatten_seq.EMPTY.instaparse$auto_flatten_seq$ConjFlat$conj_flat$arity$2(null,result);

break;
case "hiccup":
return instaparse.auto_flatten_seq.convert_afs_to_vec(instaparse.auto_flatten_seq.auto_flatten_seq(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"key","key",-1516042587).cljs$core$IFn$_invoke$arity$1(f)], null)).instaparse$auto_flatten_seq$ConjFlat$conj_flat$arity$2(null,result));

break;
case "enlive":
var content = instaparse.auto_flatten_seq.EMPTY.instaparse$auto_flatten_seq$ConjFlat$conj_flat$arity$2(null,result);
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"tag","tag",-1290361223),new cljs.core.Keyword(null,"key","key",-1516042587).cljs$core$IFn$_invoke$arity$1(f),new cljs.core.Keyword(null,"content","content",15833224),(((cljs.core.count(content) === (0)))?null:content)], null);

break;
default:
return (f.cljs$core$IFn$_invoke$arity$1 ? f.cljs$core$IFn$_invoke$arity$1(result) : f.call(null,result));

}
});
instaparse.reduction.apply_standard_reductions = (function instaparse$reduction$apply_standard_reductions(var_args){
var G__134836 = arguments.length;
switch (G__134836) {
case 1:
return instaparse.reduction.apply_standard_reductions.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return instaparse.reduction.apply_standard_reductions.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(instaparse.reduction.apply_standard_reductions.cljs$core$IFn$_invoke$arity$1 = (function (grammar){
return instaparse.reduction.apply_standard_reductions.cljs$core$IFn$_invoke$arity$2(instaparse.reduction.standard_non_terminal_reduction,grammar);
}));

(instaparse.reduction.apply_standard_reductions.cljs$core$IFn$_invoke$arity$2 = (function (reduction_type,grammar){
var temp__5802__auto__ = (instaparse.reduction.reduction_types.cljs$core$IFn$_invoke$arity$1 ? instaparse.reduction.reduction_types.cljs$core$IFn$_invoke$arity$1(reduction_type) : instaparse.reduction.reduction_types.call(null,reduction_type));
if(cljs.core.truth_(temp__5802__auto__)){
var reduction = temp__5802__auto__;
return cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,(function (){var iter__5480__auto__ = (function instaparse$reduction$iter__134838(s__134839){
return (new cljs.core.LazySeq(null,(function (){
var s__134839__$1 = s__134839;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__134839__$1);
if(temp__5804__auto__){
var s__134839__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__134839__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__134839__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__134841 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__134840 = (0);
while(true){
if((i__134840 < size__5479__auto__)){
var vec__134842 = cljs.core._nth(c__5478__auto__,i__134840);
var k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__134842,(0),null);
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__134842,(1),null);
cljs.core.chunk_append(b__134841,(cljs.core.truth_(new cljs.core.Keyword(null,"red","red",-969428204).cljs$core$IFn$_invoke$arity$1(v))?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [k,v], null):new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [k,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(v,new cljs.core.Keyword(null,"red","red",-969428204),(reduction.cljs$core$IFn$_invoke$arity$1 ? reduction.cljs$core$IFn$_invoke$arity$1(k) : reduction.call(null,k)))], null)));

var G__134874 = (i__134840 + (1));
i__134840 = G__134874;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__134841),instaparse$reduction$iter__134838(cljs.core.chunk_rest(s__134839__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__134841),null);
}
} else {
var vec__134846 = cljs.core.first(s__134839__$2);
var k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__134846,(0),null);
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__134846,(1),null);
return cljs.core.cons((cljs.core.truth_(new cljs.core.Keyword(null,"red","red",-969428204).cljs$core$IFn$_invoke$arity$1(v))?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [k,v], null):new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [k,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(v,new cljs.core.Keyword(null,"red","red",-969428204),(reduction.cljs$core$IFn$_invoke$arity$1 ? reduction.cljs$core$IFn$_invoke$arity$1(k) : reduction.call(null,k)))], null)),instaparse$reduction$iter__134838(cljs.core.rest(s__134839__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(grammar);
})());
} else {
return instaparse.util.throw_illegal_argument_exception.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["Invalid output format ",reduction_type,". Use :enlive or :hiccup."], 0));
}
}));

(instaparse.reduction.apply_standard_reductions.cljs$lang$maxFixedArity = 2);


//# sourceMappingURL=instaparse.reduction.js.map
