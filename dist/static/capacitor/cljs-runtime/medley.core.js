goog.provide('medley.core');
/**
 * Finds the first item in a collection that matches a predicate. Returns a
 *   transducer when no collection is provided.
 */
medley.core.find_first = (function medley$core$find_first(var_args){
var G__59934 = arguments.length;
switch (G__59934) {
case 1:
return medley.core.find_first.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return medley.core.find_first.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(medley.core.find_first.cljs$core$IFn$_invoke$arity$1 = (function (pred){
return (function (rf){
return (function() {
var G__60478 = null;
var G__60478__0 = (function (){
return (rf.cljs$core$IFn$_invoke$arity$0 ? rf.cljs$core$IFn$_invoke$arity$0() : rf.call(null));
});
var G__60478__1 = (function (result){
return (rf.cljs$core$IFn$_invoke$arity$1 ? rf.cljs$core$IFn$_invoke$arity$1(result) : rf.call(null,result));
});
var G__60478__2 = (function (result,x){
if(cljs.core.truth_((pred.cljs$core$IFn$_invoke$arity$1 ? pred.cljs$core$IFn$_invoke$arity$1(x) : pred.call(null,x)))){
return cljs.core.ensure_reduced((rf.cljs$core$IFn$_invoke$arity$2 ? rf.cljs$core$IFn$_invoke$arity$2(result,x) : rf.call(null,result,x)));
} else {
return result;
}
});
G__60478 = function(result,x){
switch(arguments.length){
case 0:
return G__60478__0.call(this);
case 1:
return G__60478__1.call(this,result);
case 2:
return G__60478__2.call(this,result,x);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
G__60478.cljs$core$IFn$_invoke$arity$0 = G__60478__0;
G__60478.cljs$core$IFn$_invoke$arity$1 = G__60478__1;
G__60478.cljs$core$IFn$_invoke$arity$2 = G__60478__2;
return G__60478;
})()
});
}));

(medley.core.find_first.cljs$core$IFn$_invoke$arity$2 = (function (pred,coll){
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (_,x){
if(cljs.core.truth_((pred.cljs$core$IFn$_invoke$arity$1 ? pred.cljs$core$IFn$_invoke$arity$1(x) : pred.call(null,x)))){
return cljs.core.reduced(x);
} else {
return null;
}
}),null,coll);
}));

(medley.core.find_first.cljs$lang$maxFixedArity = 2);

/**
 * Dissociate a value in a nested associative structure, identified by a sequence
 *   of keys. Any collections left empty by the operation will be dissociated from
 *   their containing structures.
 */
medley.core.dissoc_in = (function medley$core$dissoc_in(var_args){
var G__59945 = arguments.length;
switch (G__59945) {
case 2:
return medley.core.dissoc_in.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
var args_arr__5751__auto__ = [];
var len__5726__auto___60487 = arguments.length;
var i__5727__auto___60489 = (0);
while(true){
if((i__5727__auto___60489 < len__5726__auto___60487)){
args_arr__5751__auto__.push((arguments[i__5727__auto___60489]));

var G__60490 = (i__5727__auto___60489 + (1));
i__5727__auto___60489 = G__60490;
continue;
} else {
}
break;
}

var argseq__5752__auto__ = ((((2) < args_arr__5751__auto__.length))?(new cljs.core.IndexedSeq(args_arr__5751__auto__.slice((2)),(0),null)):null);
return medley.core.dissoc_in.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),(arguments[(1)]),argseq__5752__auto__);

}
});

(medley.core.dissoc_in.cljs$core$IFn$_invoke$arity$2 = (function (m,ks){
var temp__5802__auto__ = cljs.core.seq(ks);
if(temp__5802__auto__){
var vec__59948 = temp__5802__auto__;
var seq__59949 = cljs.core.seq(vec__59948);
var first__59950 = cljs.core.first(seq__59949);
var seq__59949__$1 = cljs.core.next(seq__59949);
var k = first__59950;
var ks__$1 = seq__59949__$1;
if(cljs.core.seq(ks__$1)){
var v = medley.core.dissoc_in.cljs$core$IFn$_invoke$arity$2(cljs.core.get.cljs$core$IFn$_invoke$arity$2(m,k),ks__$1);
if(cljs.core.empty_QMARK_(v)){
return cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(m,k);
} else {
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(m,k,v);
}
} else {
return cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(m,k);
}
} else {
return m;
}
}));

(medley.core.dissoc_in.cljs$core$IFn$_invoke$arity$variadic = (function (m,ks,kss){
while(true){
var temp__5802__auto__ = cljs.core.seq(kss);
if(temp__5802__auto__){
var vec__59952 = temp__5802__auto__;
var seq__59953 = cljs.core.seq(vec__59952);
var first__59954 = cljs.core.first(seq__59953);
var seq__59953__$1 = cljs.core.next(seq__59953);
var ks_SINGLEQUOTE_ = first__59954;
var kss__$1 = seq__59953__$1;
var G__60492 = medley.core.dissoc_in.cljs$core$IFn$_invoke$arity$2(m,ks);
var G__60493 = ks_SINGLEQUOTE_;
var G__60494 = kss__$1;
m = G__60492;
ks = G__60493;
kss = G__60494;
continue;
} else {
return medley.core.dissoc_in.cljs$core$IFn$_invoke$arity$2(m,ks);
}
break;
}
}));

/** @this {Function} */
(medley.core.dissoc_in.cljs$lang$applyTo = (function (seq59942){
var G__59943 = cljs.core.first(seq59942);
var seq59942__$1 = cljs.core.next(seq59942);
var G__59944 = cljs.core.first(seq59942__$1);
var seq59942__$2 = cljs.core.next(seq59942__$1);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__59943,G__59944,seq59942__$2);
}));

(medley.core.dissoc_in.cljs$lang$maxFixedArity = (2));

/**
 * Associates a key k, with a value v in a map m, if and only if v is not nil.
 */
medley.core.assoc_some = (function medley$core$assoc_some(var_args){
var G__59969 = arguments.length;
switch (G__59969) {
case 3:
return medley.core.assoc_some.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
var args_arr__5751__auto__ = [];
var len__5726__auto___60501 = arguments.length;
var i__5727__auto___60503 = (0);
while(true){
if((i__5727__auto___60503 < len__5726__auto___60501)){
args_arr__5751__auto__.push((arguments[i__5727__auto___60503]));

var G__60504 = (i__5727__auto___60503 + (1));
i__5727__auto___60503 = G__60504;
continue;
} else {
}
break;
}

var argseq__5752__auto__ = ((((3) < args_arr__5751__auto__.length))?(new cljs.core.IndexedSeq(args_arr__5751__auto__.slice((3)),(0),null)):null);
return medley.core.assoc_some.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),(arguments[(1)]),(arguments[(2)]),argseq__5752__auto__);

}
});

(medley.core.assoc_some.cljs$core$IFn$_invoke$arity$3 = (function (m,k,v){
if((v == null)){
return m;
} else {
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(m,k,v);
}
}));

(medley.core.assoc_some.cljs$core$IFn$_invoke$arity$variadic = (function (m,k,v,kvs){
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (m__$1,p__59973){
var vec__59974 = p__59973;
var k__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__59974,(0),null);
var v__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__59974,(1),null);
return medley.core.assoc_some.cljs$core$IFn$_invoke$arity$3(m__$1,k__$1,v__$1);
}),medley.core.assoc_some.cljs$core$IFn$_invoke$arity$3(m,k,v),cljs.core.partition.cljs$core$IFn$_invoke$arity$2((2),kvs));
}));

/** @this {Function} */
(medley.core.assoc_some.cljs$lang$applyTo = (function (seq59963){
var G__59964 = cljs.core.first(seq59963);
var seq59963__$1 = cljs.core.next(seq59963);
var G__59965 = cljs.core.first(seq59963__$1);
var seq59963__$2 = cljs.core.next(seq59963__$1);
var G__59966 = cljs.core.first(seq59963__$2);
var seq59963__$3 = cljs.core.next(seq59963__$2);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__59964,G__59965,G__59966,seq59963__$3);
}));

(medley.core.assoc_some.cljs$lang$maxFixedArity = (3));

/**
 * Updates a value in a map given a key and a function, if and only if the key
 *   exists in the map. See: `clojure.core/update`.
 */
medley.core.update_existing = (function medley$core$update_existing(var_args){
var G__59994 = arguments.length;
switch (G__59994) {
case 3:
return medley.core.update_existing.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
case 4:
return medley.core.update_existing.cljs$core$IFn$_invoke$arity$4((arguments[(0)]),(arguments[(1)]),(arguments[(2)]),(arguments[(3)]));

break;
case 5:
return medley.core.update_existing.cljs$core$IFn$_invoke$arity$5((arguments[(0)]),(arguments[(1)]),(arguments[(2)]),(arguments[(3)]),(arguments[(4)]));

break;
case 6:
return medley.core.update_existing.cljs$core$IFn$_invoke$arity$6((arguments[(0)]),(arguments[(1)]),(arguments[(2)]),(arguments[(3)]),(arguments[(4)]),(arguments[(5)]));

break;
default:
var args_arr__5751__auto__ = [];
var len__5726__auto___60514 = arguments.length;
var i__5727__auto___60515 = (0);
while(true){
if((i__5727__auto___60515 < len__5726__auto___60514)){
args_arr__5751__auto__.push((arguments[i__5727__auto___60515]));

var G__60516 = (i__5727__auto___60515 + (1));
i__5727__auto___60515 = G__60516;
continue;
} else {
}
break;
}

var argseq__5752__auto__ = ((((6) < args_arr__5751__auto__.length))?(new cljs.core.IndexedSeq(args_arr__5751__auto__.slice((6)),(0),null)):null);
return medley.core.update_existing.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),(arguments[(1)]),(arguments[(2)]),(arguments[(3)]),(arguments[(4)]),(arguments[(5)]),argseq__5752__auto__);

}
});

(medley.core.update_existing.cljs$core$IFn$_invoke$arity$3 = (function (m,k,f){
var temp__5802__auto__ = cljs.core.find(m,k);
if(cljs.core.truth_(temp__5802__auto__)){
var kv = temp__5802__auto__;
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(m,k,(function (){var G__60006 = cljs.core.val(kv);
return (f.cljs$core$IFn$_invoke$arity$1 ? f.cljs$core$IFn$_invoke$arity$1(G__60006) : f.call(null,G__60006));
})());
} else {
return m;
}
}));

(medley.core.update_existing.cljs$core$IFn$_invoke$arity$4 = (function (m,k,f,x){
var temp__5802__auto__ = cljs.core.find(m,k);
if(cljs.core.truth_(temp__5802__auto__)){
var kv = temp__5802__auto__;
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(m,k,(function (){var G__60007 = cljs.core.val(kv);
var G__60008 = x;
return (f.cljs$core$IFn$_invoke$arity$2 ? f.cljs$core$IFn$_invoke$arity$2(G__60007,G__60008) : f.call(null,G__60007,G__60008));
})());
} else {
return m;
}
}));

(medley.core.update_existing.cljs$core$IFn$_invoke$arity$5 = (function (m,k,f,x,y){
var temp__5802__auto__ = cljs.core.find(m,k);
if(cljs.core.truth_(temp__5802__auto__)){
var kv = temp__5802__auto__;
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(m,k,(function (){var G__60011 = cljs.core.val(kv);
var G__60012 = x;
var G__60013 = y;
return (f.cljs$core$IFn$_invoke$arity$3 ? f.cljs$core$IFn$_invoke$arity$3(G__60011,G__60012,G__60013) : f.call(null,G__60011,G__60012,G__60013));
})());
} else {
return m;
}
}));

(medley.core.update_existing.cljs$core$IFn$_invoke$arity$6 = (function (m,k,f,x,y,z){
var temp__5802__auto__ = cljs.core.find(m,k);
if(cljs.core.truth_(temp__5802__auto__)){
var kv = temp__5802__auto__;
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(m,k,(function (){var G__60014 = cljs.core.val(kv);
var G__60015 = x;
var G__60016 = y;
var G__60017 = z;
return (f.cljs$core$IFn$_invoke$arity$4 ? f.cljs$core$IFn$_invoke$arity$4(G__60014,G__60015,G__60016,G__60017) : f.call(null,G__60014,G__60015,G__60016,G__60017));
})());
} else {
return m;
}
}));

(medley.core.update_existing.cljs$core$IFn$_invoke$arity$variadic = (function (m,k,f,x,y,z,more){
var temp__5802__auto__ = cljs.core.find(m,k);
if(cljs.core.truth_(temp__5802__auto__)){
var kv = temp__5802__auto__;
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(m,k,cljs.core.apply.cljs$core$IFn$_invoke$arity$variadic(f,cljs.core.val(kv),x,y,z,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([more], 0)));
} else {
return m;
}
}));

/** @this {Function} */
(medley.core.update_existing.cljs$lang$applyTo = (function (seq59987){
var G__59988 = cljs.core.first(seq59987);
var seq59987__$1 = cljs.core.next(seq59987);
var G__59989 = cljs.core.first(seq59987__$1);
var seq59987__$2 = cljs.core.next(seq59987__$1);
var G__59990 = cljs.core.first(seq59987__$2);
var seq59987__$3 = cljs.core.next(seq59987__$2);
var G__59991 = cljs.core.first(seq59987__$3);
var seq59987__$4 = cljs.core.next(seq59987__$3);
var G__59992 = cljs.core.first(seq59987__$4);
var seq59987__$5 = cljs.core.next(seq59987__$4);
var G__59993 = cljs.core.first(seq59987__$5);
var seq59987__$6 = cljs.core.next(seq59987__$5);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__59988,G__59989,G__59990,G__59991,G__59992,G__59993,seq59987__$6);
}));

(medley.core.update_existing.cljs$lang$maxFixedArity = (6));

/**
 * Updates a value in a nested associative structure, if and only if the key
 *   path exists. See: `clojure.core/update-in`.
 */
medley.core.update_existing_in = (function medley$core$update_existing_in(var_args){
var args__5732__auto__ = [];
var len__5726__auto___60525 = arguments.length;
var i__5727__auto___60526 = (0);
while(true){
if((i__5727__auto___60526 < len__5726__auto___60525)){
args__5732__auto__.push((arguments[i__5727__auto___60526]));

var G__60527 = (i__5727__auto___60526 + (1));
i__5727__auto___60526 = G__60527;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((3) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((3)),(0),null)):null);
return medley.core.update_existing_in.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),(arguments[(1)]),(arguments[(2)]),argseq__5733__auto__);
});

(medley.core.update_existing_in.cljs$core$IFn$_invoke$arity$variadic = (function (m,ks,f,args){
var up = (function medley$core$up(m__$1,ks__$1,f__$1,args__$1){
var vec__60027 = ks__$1;
var seq__60028 = cljs.core.seq(vec__60027);
var first__60029 = cljs.core.first(seq__60028);
var seq__60028__$1 = cljs.core.next(seq__60028);
var k = first__60029;
var ks__$2 = seq__60028__$1;
var temp__5802__auto__ = cljs.core.find(m__$1,k);
if(cljs.core.truth_(temp__5802__auto__)){
var kv = temp__5802__auto__;
if(ks__$2){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(m__$1,k,medley$core$up(cljs.core.val(kv),ks__$2,f__$1,args__$1));
} else {
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(m__$1,k,cljs.core.apply.cljs$core$IFn$_invoke$arity$3(f__$1,cljs.core.val(kv),args__$1));
}
} else {
return m__$1;
}
});
return up(m,ks,f,args);
}));

(medley.core.update_existing_in.cljs$lang$maxFixedArity = (3));

/** @this {Function} */
(medley.core.update_existing_in.cljs$lang$applyTo = (function (seq60023){
var G__60024 = cljs.core.first(seq60023);
var seq60023__$1 = cljs.core.next(seq60023);
var G__60025 = cljs.core.first(seq60023__$1);
var seq60023__$2 = cljs.core.next(seq60023__$1);
var G__60026 = cljs.core.first(seq60023__$2);
var seq60023__$3 = cljs.core.next(seq60023__$2);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__60024,G__60025,G__60026,seq60023__$3);
}));

medley.core.editable_QMARK_ = (function medley$core$editable_QMARK_(coll){
if((!((coll == null)))){
if((((coll.cljs$lang$protocol_mask$partition1$ & (4))) || ((cljs.core.PROTOCOL_SENTINEL === coll.cljs$core$IEditableCollection$)))){
return true;
} else {
if((!coll.cljs$lang$protocol_mask$partition1$)){
return cljs.core.native_satisfies_QMARK_(cljs.core.IEditableCollection,coll);
} else {
return false;
}
}
} else {
return cljs.core.native_satisfies_QMARK_(cljs.core.IEditableCollection,coll);
}
});
medley.core.reduce_map = (function medley$core$reduce_map(f,coll){
var coll_SINGLEQUOTE_ = ((cljs.core.record_QMARK_(coll))?cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,coll):coll);
if(medley.core.editable_QMARK_(coll_SINGLEQUOTE_)){
return cljs.core.persistent_BANG_(cljs.core.reduce_kv((f.cljs$core$IFn$_invoke$arity$1 ? f.cljs$core$IFn$_invoke$arity$1(cljs.core.assoc_BANG_) : f.call(null,cljs.core.assoc_BANG_)),cljs.core.transient$(cljs.core.empty(coll_SINGLEQUOTE_)),coll_SINGLEQUOTE_));
} else {
return cljs.core.reduce_kv((f.cljs$core$IFn$_invoke$arity$1 ? f.cljs$core$IFn$_invoke$arity$1(cljs.core.assoc) : f.call(null,cljs.core.assoc)),cljs.core.empty(coll_SINGLEQUOTE_),coll_SINGLEQUOTE_);
}
});
/**
 * Create a map entry for a key and value pair.
 */
medley.core.map_entry = (function medley$core$map_entry(k,v){
return (new cljs.core.MapEntry(k,v,null));
});
/**
 * Maps a function over the key/value pairs of an associative collection. Expects
 *   a function that takes two arguments, the key and value, and returns the new
 *   key and value as a collection of two elements.
 */
medley.core.map_kv = (function medley$core$map_kv(f,coll){
return medley.core.reduce_map((function (xf){
return (function (m,k,v){
var vec__60041 = (f.cljs$core$IFn$_invoke$arity$2 ? f.cljs$core$IFn$_invoke$arity$2(k,v) : f.call(null,k,v));
var k__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__60041,(0),null);
var v__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__60041,(1),null);
return (xf.cljs$core$IFn$_invoke$arity$3 ? xf.cljs$core$IFn$_invoke$arity$3(m,k__$1,v__$1) : xf.call(null,m,k__$1,v__$1));
});
}),coll);
});
/**
 * Maps a function over the keys of an associative collection.
 */
medley.core.map_keys = (function medley$core$map_keys(f,coll){
return medley.core.reduce_map((function (xf){
return (function (m,k,v){
var G__60047 = m;
var G__60048 = (f.cljs$core$IFn$_invoke$arity$1 ? f.cljs$core$IFn$_invoke$arity$1(k) : f.call(null,k));
var G__60049 = v;
return (xf.cljs$core$IFn$_invoke$arity$3 ? xf.cljs$core$IFn$_invoke$arity$3(G__60047,G__60048,G__60049) : xf.call(null,G__60047,G__60048,G__60049));
});
}),coll);
});
/**
 * Maps a function over the values of one or more associative collections.
 *   The function should accept number-of-colls arguments. Any keys which are not
 *   shared among all collections are ignored.
 */
medley.core.map_vals = (function medley$core$map_vals(var_args){
var G__60058 = arguments.length;
switch (G__60058) {
case 2:
return medley.core.map_vals.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
var args_arr__5751__auto__ = [];
var len__5726__auto___60539 = arguments.length;
var i__5727__auto___60540 = (0);
while(true){
if((i__5727__auto___60540 < len__5726__auto___60539)){
args_arr__5751__auto__.push((arguments[i__5727__auto___60540]));

var G__60541 = (i__5727__auto___60540 + (1));
i__5727__auto___60540 = G__60541;
continue;
} else {
}
break;
}

var argseq__5752__auto__ = ((((2) < args_arr__5751__auto__.length))?(new cljs.core.IndexedSeq(args_arr__5751__auto__.slice((2)),(0),null)):null);
return medley.core.map_vals.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),(arguments[(1)]),argseq__5752__auto__);

}
});

(medley.core.map_vals.cljs$core$IFn$_invoke$arity$2 = (function (f,coll){
return medley.core.reduce_map((function (xf){
return (function (m,k,v){
var G__60069 = m;
var G__60070 = k;
var G__60071 = (f.cljs$core$IFn$_invoke$arity$1 ? f.cljs$core$IFn$_invoke$arity$1(v) : f.call(null,v));
return (xf.cljs$core$IFn$_invoke$arity$3 ? xf.cljs$core$IFn$_invoke$arity$3(G__60069,G__60070,G__60071) : xf.call(null,G__60069,G__60070,G__60071));
});
}),coll);
}));

(medley.core.map_vals.cljs$core$IFn$_invoke$arity$variadic = (function (f,c1,colls){
return medley.core.reduce_map((function (xf){
return (function (m,k,v){
if(cljs.core.every_QMARK_((function (p1__60050_SHARP_){
return cljs.core.contains_QMARK_(p1__60050_SHARP_,k);
}),colls)){
var G__60072 = m;
var G__60073 = k;
var G__60074 = cljs.core.apply.cljs$core$IFn$_invoke$arity$3(f,v,cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__60051_SHARP_){
return cljs.core.get.cljs$core$IFn$_invoke$arity$2(p1__60051_SHARP_,k);
}),colls));
return (xf.cljs$core$IFn$_invoke$arity$3 ? xf.cljs$core$IFn$_invoke$arity$3(G__60072,G__60073,G__60074) : xf.call(null,G__60072,G__60073,G__60074));
} else {
return m;
}
});
}),c1);
}));

/** @this {Function} */
(medley.core.map_vals.cljs$lang$applyTo = (function (seq60055){
var G__60056 = cljs.core.first(seq60055);
var seq60055__$1 = cljs.core.next(seq60055);
var G__60057 = cljs.core.first(seq60055__$1);
var seq60055__$2 = cljs.core.next(seq60055__$1);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__60056,G__60057,seq60055__$2);
}));

(medley.core.map_vals.cljs$lang$maxFixedArity = (2));

/**
 * Maps a function over the key/value pairs of an associative collection, using
 *   the return of the function as the new key.
 */
medley.core.map_kv_keys = (function medley$core$map_kv_keys(f,coll){
return medley.core.reduce_map((function (xf){
return (function (m,k,v){
var G__60079 = m;
var G__60080 = (f.cljs$core$IFn$_invoke$arity$2 ? f.cljs$core$IFn$_invoke$arity$2(k,v) : f.call(null,k,v));
var G__60081 = v;
return (xf.cljs$core$IFn$_invoke$arity$3 ? xf.cljs$core$IFn$_invoke$arity$3(G__60079,G__60080,G__60081) : xf.call(null,G__60079,G__60080,G__60081));
});
}),coll);
});
/**
 * Maps a function over the key/value pairs of an associative collection, using
 *   the return of the function as the new value.
 */
medley.core.map_kv_vals = (function medley$core$map_kv_vals(f,coll){
return medley.core.reduce_map((function (xf){
return (function (m,k,v){
var G__60084 = m;
var G__60085 = k;
var G__60086 = (f.cljs$core$IFn$_invoke$arity$2 ? f.cljs$core$IFn$_invoke$arity$2(k,v) : f.call(null,k,v));
return (xf.cljs$core$IFn$_invoke$arity$3 ? xf.cljs$core$IFn$_invoke$arity$3(G__60084,G__60085,G__60086) : xf.call(null,G__60084,G__60085,G__60086));
});
}),coll);
});
/**
 * Returns a new associative collection of the items in coll for which
 *   `(pred (key item) (val item))` returns true.
 */
medley.core.filter_kv = (function medley$core$filter_kv(pred,coll){
return medley.core.reduce_map((function (xf){
return (function (m,k,v){
if(cljs.core.truth_((pred.cljs$core$IFn$_invoke$arity$2 ? pred.cljs$core$IFn$_invoke$arity$2(k,v) : pred.call(null,k,v)))){
return (xf.cljs$core$IFn$_invoke$arity$3 ? xf.cljs$core$IFn$_invoke$arity$3(m,k,v) : xf.call(null,m,k,v));
} else {
return m;
}
});
}),coll);
});
/**
 * Returns a new associative collection of the items in coll for which
 *   `(pred (key item))` returns true.
 */
medley.core.filter_keys = (function medley$core$filter_keys(pred,coll){
return medley.core.reduce_map((function (xf){
return (function (m,k,v){
if(cljs.core.truth_((pred.cljs$core$IFn$_invoke$arity$1 ? pred.cljs$core$IFn$_invoke$arity$1(k) : pred.call(null,k)))){
return (xf.cljs$core$IFn$_invoke$arity$3 ? xf.cljs$core$IFn$_invoke$arity$3(m,k,v) : xf.call(null,m,k,v));
} else {
return m;
}
});
}),coll);
});
/**
 * Returns a new associative collection of the items in coll for which
 *   `(pred (val item))` returns true.
 */
medley.core.filter_vals = (function medley$core$filter_vals(pred,coll){
return medley.core.reduce_map((function (xf){
return (function (m,k,v){
if(cljs.core.truth_((pred.cljs$core$IFn$_invoke$arity$1 ? pred.cljs$core$IFn$_invoke$arity$1(v) : pred.call(null,v)))){
return (xf.cljs$core$IFn$_invoke$arity$3 ? xf.cljs$core$IFn$_invoke$arity$3(m,k,v) : xf.call(null,m,k,v));
} else {
return m;
}
});
}),coll);
});
/**
 * Returns a new associative collection of the items in coll for which
 *   `(pred (key item) (val item))` returns false.
 */
medley.core.remove_kv = (function medley$core$remove_kv(pred,coll){
return medley.core.filter_kv(cljs.core.complement(pred),coll);
});
/**
 * Returns a new associative collection of the items in coll for which
 *   `(pred (key item))` returns false.
 */
medley.core.remove_keys = (function medley$core$remove_keys(pred,coll){
return medley.core.filter_keys(cljs.core.complement(pred),coll);
});
/**
 * Returns a new associative collection of the items in coll for which
 *   `(pred (val item))` returns false.
 */
medley.core.remove_vals = (function medley$core$remove_vals(pred,coll){
return medley.core.filter_vals(cljs.core.complement(pred),coll);
});
/**
 * Creates an empty persistent queue, or one populated with a collection.
 */
medley.core.queue = (function medley$core$queue(var_args){
var G__60088 = arguments.length;
switch (G__60088) {
case 0:
return medley.core.queue.cljs$core$IFn$_invoke$arity$0();

break;
case 1:
return medley.core.queue.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(medley.core.queue.cljs$core$IFn$_invoke$arity$0 = (function (){
return cljs.core.PersistentQueue.EMPTY;
}));

(medley.core.queue.cljs$core$IFn$_invoke$arity$1 = (function (coll){
return cljs.core.into.cljs$core$IFn$_invoke$arity$2(medley.core.queue.cljs$core$IFn$_invoke$arity$0(),coll);
}));

(medley.core.queue.cljs$lang$maxFixedArity = 1);

/**
 * Returns true if x implements clojure.lang.PersistentQueue.
 */
medley.core.queue_QMARK_ = (function medley$core$queue_QMARK_(x){
return (x instanceof cljs.core.PersistentQueue);
});
/**
 * Returns true if x is a boolean.
 */
medley.core.boolean_QMARK_ = (function medley$core$boolean_QMARK_(x){
return ((x === true) || (x === false));
});
/**
 * Return the least argument (as defined by the compare function) in O(n) time.
 */
medley.core.least = (function medley$core$least(var_args){
var G__60096 = arguments.length;
switch (G__60096) {
case 0:
return medley.core.least.cljs$core$IFn$_invoke$arity$0();

break;
case 1:
return medley.core.least.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return medley.core.least.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
var args_arr__5751__auto__ = [];
var len__5726__auto___60569 = arguments.length;
var i__5727__auto___60570 = (0);
while(true){
if((i__5727__auto___60570 < len__5726__auto___60569)){
args_arr__5751__auto__.push((arguments[i__5727__auto___60570]));

var G__60571 = (i__5727__auto___60570 + (1));
i__5727__auto___60570 = G__60571;
continue;
} else {
}
break;
}

var argseq__5752__auto__ = ((((2) < args_arr__5751__auto__.length))?(new cljs.core.IndexedSeq(args_arr__5751__auto__.slice((2)),(0),null)):null);
return medley.core.least.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),(arguments[(1)]),argseq__5752__auto__);

}
});

(medley.core.least.cljs$core$IFn$_invoke$arity$0 = (function (){
return null;
}));

(medley.core.least.cljs$core$IFn$_invoke$arity$1 = (function (a){
return a;
}));

(medley.core.least.cljs$core$IFn$_invoke$arity$2 = (function (a,b){
if((cljs.core.compare(a,b) < (0))){
return a;
} else {
return b;
}
}));

(medley.core.least.cljs$core$IFn$_invoke$arity$variadic = (function (a,b,more){
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3(medley.core.least,medley.core.least.cljs$core$IFn$_invoke$arity$2(a,b),more);
}));

/** @this {Function} */
(medley.core.least.cljs$lang$applyTo = (function (seq60093){
var G__60094 = cljs.core.first(seq60093);
var seq60093__$1 = cljs.core.next(seq60093);
var G__60095 = cljs.core.first(seq60093__$1);
var seq60093__$2 = cljs.core.next(seq60093__$1);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__60094,G__60095,seq60093__$2);
}));

(medley.core.least.cljs$lang$maxFixedArity = (2));

/**
 * Find the greatest argument (as defined by the compare function) in O(n) time.
 */
medley.core.greatest = (function medley$core$greatest(var_args){
var G__60109 = arguments.length;
switch (G__60109) {
case 0:
return medley.core.greatest.cljs$core$IFn$_invoke$arity$0();

break;
case 1:
return medley.core.greatest.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return medley.core.greatest.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
var args_arr__5751__auto__ = [];
var len__5726__auto___60579 = arguments.length;
var i__5727__auto___60580 = (0);
while(true){
if((i__5727__auto___60580 < len__5726__auto___60579)){
args_arr__5751__auto__.push((arguments[i__5727__auto___60580]));

var G__60584 = (i__5727__auto___60580 + (1));
i__5727__auto___60580 = G__60584;
continue;
} else {
}
break;
}

var argseq__5752__auto__ = ((((2) < args_arr__5751__auto__.length))?(new cljs.core.IndexedSeq(args_arr__5751__auto__.slice((2)),(0),null)):null);
return medley.core.greatest.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),(arguments[(1)]),argseq__5752__auto__);

}
});

(medley.core.greatest.cljs$core$IFn$_invoke$arity$0 = (function (){
return null;
}));

(medley.core.greatest.cljs$core$IFn$_invoke$arity$1 = (function (a){
return a;
}));

(medley.core.greatest.cljs$core$IFn$_invoke$arity$2 = (function (a,b){
if((cljs.core.compare(a,b) > (0))){
return a;
} else {
return b;
}
}));

(medley.core.greatest.cljs$core$IFn$_invoke$arity$variadic = (function (a,b,more){
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3(medley.core.greatest,medley.core.greatest.cljs$core$IFn$_invoke$arity$2(a,b),more);
}));

/** @this {Function} */
(medley.core.greatest.cljs$lang$applyTo = (function (seq60106){
var G__60107 = cljs.core.first(seq60106);
var seq60106__$1 = cljs.core.next(seq60106);
var G__60108 = cljs.core.first(seq60106__$1);
var seq60106__$2 = cljs.core.next(seq60106__$1);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__60107,G__60108,seq60106__$2);
}));

(medley.core.greatest.cljs$lang$maxFixedArity = (2));

/**
 * Lazily concatenates a collection of collections into a flat sequence.
 */
medley.core.join = (function medley$core$join(colls){
return (new cljs.core.LazySeq(null,(function (){
var temp__5804__auto__ = cljs.core.seq(colls);
if(temp__5804__auto__){
var s = temp__5804__auto__;
return cljs.core.concat.cljs$core$IFn$_invoke$arity$2(cljs.core.first(s),(function (){var G__60126 = cljs.core.rest(s);
return (medley.core.join.cljs$core$IFn$_invoke$arity$1 ? medley.core.join.cljs$core$IFn$_invoke$arity$1(G__60126) : medley.core.join.call(null,G__60126));
})());
} else {
return null;
}
}),null,null));
});
/**
 * Recursively merges maps together. If all the maps supplied have nested maps
 *   under the same keys, these nested maps are merged. Otherwise the value is
 *   overwritten, as in `clojure.core/merge`.
 */
medley.core.deep_merge = (function medley$core$deep_merge(var_args){
var G__60133 = arguments.length;
switch (G__60133) {
case 0:
return medley.core.deep_merge.cljs$core$IFn$_invoke$arity$0();

break;
case 1:
return medley.core.deep_merge.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return medley.core.deep_merge.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
var args_arr__5751__auto__ = [];
var len__5726__auto___60604 = arguments.length;
var i__5727__auto___60605 = (0);
while(true){
if((i__5727__auto___60605 < len__5726__auto___60604)){
args_arr__5751__auto__.push((arguments[i__5727__auto___60605]));

var G__60606 = (i__5727__auto___60605 + (1));
i__5727__auto___60605 = G__60606;
continue;
} else {
}
break;
}

var argseq__5752__auto__ = ((((2) < args_arr__5751__auto__.length))?(new cljs.core.IndexedSeq(args_arr__5751__auto__.slice((2)),(0),null)):null);
return medley.core.deep_merge.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),(arguments[(1)]),argseq__5752__auto__);

}
});

(medley.core.deep_merge.cljs$core$IFn$_invoke$arity$0 = (function (){
return null;
}));

(medley.core.deep_merge.cljs$core$IFn$_invoke$arity$1 = (function (a){
return a;
}));

(medley.core.deep_merge.cljs$core$IFn$_invoke$arity$2 = (function (a,b){
if(cljs.core.truth_((function (){var or__5002__auto__ = a;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return b;
}
})())){
var merge_entry = (function medley$core$merge_entry(m,e){
var k = cljs.core.key(e);
var v_SINGLEQUOTE_ = cljs.core.val(e);
if(cljs.core.contains_QMARK_(m,k)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(m,k,(function (){var v = cljs.core.get.cljs$core$IFn$_invoke$arity$2(m,k);
if(((cljs.core.map_QMARK_(v)) && (cljs.core.map_QMARK_(v_SINGLEQUOTE_)))){
return medley.core.deep_merge.cljs$core$IFn$_invoke$arity$2(v,v_SINGLEQUOTE_);
} else {
return v_SINGLEQUOTE_;
}
})());
} else {
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(m,k,v_SINGLEQUOTE_);
}
});
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3(merge_entry,(function (){var or__5002__auto__ = a;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.PersistentArrayMap.EMPTY;
}
})(),cljs.core.seq(b));
} else {
return null;
}
}));

(medley.core.deep_merge.cljs$core$IFn$_invoke$arity$variadic = (function (a,b,more){
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3(medley.core.deep_merge,(function (){var or__5002__auto__ = a;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.PersistentArrayMap.EMPTY;
}
})(),cljs.core.cons(b,more));
}));

/** @this {Function} */
(medley.core.deep_merge.cljs$lang$applyTo = (function (seq60130){
var G__60131 = cljs.core.first(seq60130);
var seq60130__$1 = cljs.core.next(seq60130);
var G__60132 = cljs.core.first(seq60130__$1);
var seq60130__$2 = cljs.core.next(seq60130__$1);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__60131,G__60132,seq60130__$2);
}));

(medley.core.deep_merge.cljs$lang$maxFixedArity = (2));

/**
 * Applies a function f to the argument list formed by concatenating
 *   everything but the last element of args with the last element of
 *   args. This is useful for applying a function that accepts keyword
 *   arguments to a map.
 */
medley.core.mapply = (function medley$core$mapply(var_args){
var G__60329 = arguments.length;
switch (G__60329) {
case 2:
return medley.core.mapply.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
var args_arr__5751__auto__ = [];
var len__5726__auto___60610 = arguments.length;
var i__5727__auto___60611 = (0);
while(true){
if((i__5727__auto___60611 < len__5726__auto___60610)){
args_arr__5751__auto__.push((arguments[i__5727__auto___60611]));

var G__60612 = (i__5727__auto___60611 + (1));
i__5727__auto___60611 = G__60612;
continue;
} else {
}
break;
}

var argseq__5752__auto__ = ((((2) < args_arr__5751__auto__.length))?(new cljs.core.IndexedSeq(args_arr__5751__auto__.slice((2)),(0),null)):null);
return medley.core.mapply.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),(arguments[(1)]),argseq__5752__auto__);

}
});

(medley.core.mapply.cljs$core$IFn$_invoke$arity$2 = (function (f,m){
return cljs.core.apply.cljs$core$IFn$_invoke$arity$2(f,cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core.concat,m));
}));

(medley.core.mapply.cljs$core$IFn$_invoke$arity$variadic = (function (f,a,args){
return cljs.core.apply.cljs$core$IFn$_invoke$arity$3(f,a,cljs.core.apply.cljs$core$IFn$_invoke$arity$3(cljs.core.concat,cljs.core.butlast(args),cljs.core.last(args)));
}));

/** @this {Function} */
(medley.core.mapply.cljs$lang$applyTo = (function (seq60320){
var G__60322 = cljs.core.first(seq60320);
var seq60320__$1 = cljs.core.next(seq60320);
var G__60323 = cljs.core.first(seq60320__$1);
var seq60320__$2 = cljs.core.next(seq60320__$1);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__60322,G__60323,seq60320__$2);
}));

(medley.core.mapply.cljs$lang$maxFixedArity = (2));

/**
 * Returns a map of the elements of coll keyed by the result of f on each
 *   element. The value at each key will be the last element in coll associated
 *   with that key. This function is similar to `clojure.core/group-by`, except
 *   that elements with the same key are overwritten, rather than added to a
 *   vector of values.
 */
medley.core.index_by = (function medley$core$index_by(f,coll){
return cljs.core.persistent_BANG_(cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (p1__60346_SHARP_,p2__60347_SHARP_){
return cljs.core.assoc_BANG_.cljs$core$IFn$_invoke$arity$3(p1__60346_SHARP_,(f.cljs$core$IFn$_invoke$arity$1 ? f.cljs$core$IFn$_invoke$arity$1(p2__60347_SHARP_) : f.call(null,p2__60347_SHARP_)),p2__60347_SHARP_);
}),cljs.core.transient$(cljs.core.PersistentArrayMap.EMPTY),coll));
});
/**
 * Returns a lazy seq of the first item in each coll, then the second, etc.
 *   Unlike `clojure.core/interleave`, the returned seq contains all items in the
 *   supplied collections, even if the collections are different sizes.
 */
medley.core.interleave_all = (function medley$core$interleave_all(var_args){
var G__60364 = arguments.length;
switch (G__60364) {
case 0:
return medley.core.interleave_all.cljs$core$IFn$_invoke$arity$0();

break;
case 1:
return medley.core.interleave_all.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return medley.core.interleave_all.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
var args_arr__5751__auto__ = [];
var len__5726__auto___60615 = arguments.length;
var i__5727__auto___60616 = (0);
while(true){
if((i__5727__auto___60616 < len__5726__auto___60615)){
args_arr__5751__auto__.push((arguments[i__5727__auto___60616]));

var G__60617 = (i__5727__auto___60616 + (1));
i__5727__auto___60616 = G__60617;
continue;
} else {
}
break;
}

var argseq__5752__auto__ = ((((2) < args_arr__5751__auto__.length))?(new cljs.core.IndexedSeq(args_arr__5751__auto__.slice((2)),(0),null)):null);
return medley.core.interleave_all.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),(arguments[(1)]),argseq__5752__auto__);

}
});

(medley.core.interleave_all.cljs$core$IFn$_invoke$arity$0 = (function (){
return cljs.core.List.EMPTY;
}));

(medley.core.interleave_all.cljs$core$IFn$_invoke$arity$1 = (function (c1){
return (new cljs.core.LazySeq(null,(function (){
return c1;
}),null,null));
}));

(medley.core.interleave_all.cljs$core$IFn$_invoke$arity$2 = (function (c1,c2){
return (new cljs.core.LazySeq(null,(function (){
var s1 = cljs.core.seq(c1);
var s2 = cljs.core.seq(c2);
if(((s1) && (s2))){
return cljs.core.cons(cljs.core.first(s1),cljs.core.cons(cljs.core.first(s2),medley.core.interleave_all.cljs$core$IFn$_invoke$arity$2(cljs.core.rest(s1),cljs.core.rest(s2))));
} else {
return ((s1) || (s2));
}
}),null,null));
}));

(medley.core.interleave_all.cljs$core$IFn$_invoke$arity$variadic = (function (c1,c2,colls){
return (new cljs.core.LazySeq(null,(function (){
var ss = cljs.core.remove.cljs$core$IFn$_invoke$arity$2(cljs.core.nil_QMARK_,cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.seq,cljs.core.conj.cljs$core$IFn$_invoke$arity$variadic(colls,c2,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([c1], 0))));
if(cljs.core.seq(ss)){
return cljs.core.concat.cljs$core$IFn$_invoke$arity$2(cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.first,ss),cljs.core.apply.cljs$core$IFn$_invoke$arity$2(medley.core.interleave_all,cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.rest,ss)));
} else {
return null;
}
}),null,null));
}));

/** @this {Function} */
(medley.core.interleave_all.cljs$lang$applyTo = (function (seq60358){
var G__60359 = cljs.core.first(seq60358);
var seq60358__$1 = cljs.core.next(seq60358);
var G__60360 = cljs.core.first(seq60358__$1);
var seq60358__$2 = cljs.core.next(seq60358__$1);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__60359,G__60360,seq60358__$2);
}));

(medley.core.interleave_all.cljs$lang$maxFixedArity = (2));

/**
 * Returns a lazy sequence of the elements of coll, removing any elements that
 *   return duplicate values when passed to a function f. Returns a transducer
 *   when no collection is provided.
 */
medley.core.distinct_by = (function medley$core$distinct_by(var_args){
var G__60372 = arguments.length;
switch (G__60372) {
case 1:
return medley.core.distinct_by.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return medley.core.distinct_by.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(medley.core.distinct_by.cljs$core$IFn$_invoke$arity$1 = (function (f){
return (function (rf){
var seen = cljs.core.volatile_BANG_(cljs.core.PersistentHashSet.EMPTY);
return (function() {
var G__60620 = null;
var G__60620__0 = (function (){
return (rf.cljs$core$IFn$_invoke$arity$0 ? rf.cljs$core$IFn$_invoke$arity$0() : rf.call(null));
});
var G__60620__1 = (function (result){
return (rf.cljs$core$IFn$_invoke$arity$1 ? rf.cljs$core$IFn$_invoke$arity$1(result) : rf.call(null,result));
});
var G__60620__2 = (function (result,x){
var fx = (f.cljs$core$IFn$_invoke$arity$1 ? f.cljs$core$IFn$_invoke$arity$1(x) : f.call(null,x));
if(cljs.core.contains_QMARK_(cljs.core.deref(seen),fx)){
return result;
} else {
seen.cljs$core$IVolatile$_vreset_BANG_$arity$2(null,cljs.core.conj.cljs$core$IFn$_invoke$arity$2(seen.cljs$core$IDeref$_deref$arity$1(null),fx));

return (rf.cljs$core$IFn$_invoke$arity$2 ? rf.cljs$core$IFn$_invoke$arity$2(result,x) : rf.call(null,result,x));
}
});
G__60620 = function(result,x){
switch(arguments.length){
case 0:
return G__60620__0.call(this);
case 1:
return G__60620__1.call(this,result);
case 2:
return G__60620__2.call(this,result,x);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
G__60620.cljs$core$IFn$_invoke$arity$0 = G__60620__0;
G__60620.cljs$core$IFn$_invoke$arity$1 = G__60620__1;
G__60620.cljs$core$IFn$_invoke$arity$2 = G__60620__2;
return G__60620;
})()
});
}));

(medley.core.distinct_by.cljs$core$IFn$_invoke$arity$2 = (function (f,coll){
var step = (function medley$core$step(xs,seen){
return (new cljs.core.LazySeq(null,(function (){
return (function (p__60384,seen__$1){
while(true){
var vec__60385 = p__60384;
var x = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__60385,(0),null);
var xs__$1 = vec__60385;
var temp__5804__auto__ = cljs.core.seq(xs__$1);
if(temp__5804__auto__){
var s = temp__5804__auto__;
var fx = (f.cljs$core$IFn$_invoke$arity$1 ? f.cljs$core$IFn$_invoke$arity$1(x) : f.call(null,x));
if(cljs.core.contains_QMARK_(seen__$1,fx)){
var G__60622 = cljs.core.rest(s);
var G__60623 = seen__$1;
p__60384 = G__60622;
seen__$1 = G__60623;
continue;
} else {
return cljs.core.cons(x,medley$core$step(cljs.core.rest(s),cljs.core.conj.cljs$core$IFn$_invoke$arity$2(seen__$1,fx)));
}
} else {
return null;
}
break;
}
})(xs,seen);
}),null,null));
});
return step(coll,cljs.core.PersistentHashSet.EMPTY);
}));

(medley.core.distinct_by.cljs$lang$maxFixedArity = 2);

/**
 * Returns a lazy sequence of the elements of coll, removing any **consecutive**
 *   elements that return duplicate values when passed to a function f. Returns a
 *   transducer when no collection is provided.
 */
medley.core.dedupe_by = (function medley$core$dedupe_by(var_args){
var G__60396 = arguments.length;
switch (G__60396) {
case 1:
return medley.core.dedupe_by.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return medley.core.dedupe_by.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(medley.core.dedupe_by.cljs$core$IFn$_invoke$arity$1 = (function (f){
return (function (rf){
var pv = cljs.core.volatile_BANG_(new cljs.core.Keyword("medley.core","none","medley.core/none",60848325));
return (function() {
var G__60625 = null;
var G__60625__0 = (function (){
return (rf.cljs$core$IFn$_invoke$arity$0 ? rf.cljs$core$IFn$_invoke$arity$0() : rf.call(null));
});
var G__60625__1 = (function (result){
return (rf.cljs$core$IFn$_invoke$arity$1 ? rf.cljs$core$IFn$_invoke$arity$1(result) : rf.call(null,result));
});
var G__60625__2 = (function (result,x){
var prior = cljs.core.deref(pv);
var fx = (f.cljs$core$IFn$_invoke$arity$1 ? f.cljs$core$IFn$_invoke$arity$1(x) : f.call(null,x));
cljs.core.vreset_BANG_(pv,fx);

if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(prior,fx)){
return result;
} else {
return (rf.cljs$core$IFn$_invoke$arity$2 ? rf.cljs$core$IFn$_invoke$arity$2(result,x) : rf.call(null,result,x));
}
});
G__60625 = function(result,x){
switch(arguments.length){
case 0:
return G__60625__0.call(this);
case 1:
return G__60625__1.call(this,result);
case 2:
return G__60625__2.call(this,result,x);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
G__60625.cljs$core$IFn$_invoke$arity$0 = G__60625__0;
G__60625.cljs$core$IFn$_invoke$arity$1 = G__60625__1;
G__60625.cljs$core$IFn$_invoke$arity$2 = G__60625__2;
return G__60625;
})()
});
}));

(medley.core.dedupe_by.cljs$core$IFn$_invoke$arity$2 = (function (f,coll){
return cljs.core.sequence.cljs$core$IFn$_invoke$arity$2(medley.core.dedupe_by.cljs$core$IFn$_invoke$arity$1(f),coll);
}));

(medley.core.dedupe_by.cljs$lang$maxFixedArity = 2);

/**
 * Returns a lazy sequence of successive items from coll up to and including
 *   the first item for which `(pred item)` returns true. Returns a transducer
 *   when no collection is provided.
 */
medley.core.take_upto = (function medley$core$take_upto(var_args){
var G__60406 = arguments.length;
switch (G__60406) {
case 1:
return medley.core.take_upto.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return medley.core.take_upto.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(medley.core.take_upto.cljs$core$IFn$_invoke$arity$1 = (function (pred){
return (function (rf){
return (function() {
var G__60636 = null;
var G__60636__0 = (function (){
return (rf.cljs$core$IFn$_invoke$arity$0 ? rf.cljs$core$IFn$_invoke$arity$0() : rf.call(null));
});
var G__60636__1 = (function (result){
return (rf.cljs$core$IFn$_invoke$arity$1 ? rf.cljs$core$IFn$_invoke$arity$1(result) : rf.call(null,result));
});
var G__60636__2 = (function (result,x){
var result__$1 = (rf.cljs$core$IFn$_invoke$arity$2 ? rf.cljs$core$IFn$_invoke$arity$2(result,x) : rf.call(null,result,x));
if(cljs.core.truth_((pred.cljs$core$IFn$_invoke$arity$1 ? pred.cljs$core$IFn$_invoke$arity$1(x) : pred.call(null,x)))){
return cljs.core.ensure_reduced(result__$1);
} else {
return result__$1;
}
});
G__60636 = function(result,x){
switch(arguments.length){
case 0:
return G__60636__0.call(this);
case 1:
return G__60636__1.call(this,result);
case 2:
return G__60636__2.call(this,result,x);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
G__60636.cljs$core$IFn$_invoke$arity$0 = G__60636__0;
G__60636.cljs$core$IFn$_invoke$arity$1 = G__60636__1;
G__60636.cljs$core$IFn$_invoke$arity$2 = G__60636__2;
return G__60636;
})()
});
}));

(medley.core.take_upto.cljs$core$IFn$_invoke$arity$2 = (function (pred,coll){
return (new cljs.core.LazySeq(null,(function (){
var temp__5804__auto__ = cljs.core.seq(coll);
if(temp__5804__auto__){
var s = temp__5804__auto__;
var x = cljs.core.first(s);
return cljs.core.cons(x,(cljs.core.truth_((pred.cljs$core$IFn$_invoke$arity$1 ? pred.cljs$core$IFn$_invoke$arity$1(x) : pred.call(null,x)))?null:medley.core.take_upto.cljs$core$IFn$_invoke$arity$2(pred,cljs.core.rest(s))));
} else {
return null;
}
}),null,null));
}));

(medley.core.take_upto.cljs$lang$maxFixedArity = 2);

/**
 * Returns a lazy sequence of the items in coll starting *after* the first item
 *   for which `(pred item)` returns true. Returns a transducer when no collection
 *   is provided.
 */
medley.core.drop_upto = (function medley$core$drop_upto(var_args){
var G__60413 = arguments.length;
switch (G__60413) {
case 1:
return medley.core.drop_upto.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return medley.core.drop_upto.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(medley.core.drop_upto.cljs$core$IFn$_invoke$arity$1 = (function (pred){
return (function (rf){
var dv = cljs.core.volatile_BANG_(true);
return (function() {
var G__60638 = null;
var G__60638__0 = (function (){
return (rf.cljs$core$IFn$_invoke$arity$0 ? rf.cljs$core$IFn$_invoke$arity$0() : rf.call(null));
});
var G__60638__1 = (function (result){
return (rf.cljs$core$IFn$_invoke$arity$1 ? rf.cljs$core$IFn$_invoke$arity$1(result) : rf.call(null,result));
});
var G__60638__2 = (function (result,x){
if(cljs.core.truth_(cljs.core.deref(dv))){
if(cljs.core.truth_((pred.cljs$core$IFn$_invoke$arity$1 ? pred.cljs$core$IFn$_invoke$arity$1(x) : pred.call(null,x)))){
cljs.core.vreset_BANG_(dv,false);
} else {
}

return result;
} else {
return (rf.cljs$core$IFn$_invoke$arity$2 ? rf.cljs$core$IFn$_invoke$arity$2(result,x) : rf.call(null,result,x));
}
});
G__60638 = function(result,x){
switch(arguments.length){
case 0:
return G__60638__0.call(this);
case 1:
return G__60638__1.call(this,result);
case 2:
return G__60638__2.call(this,result,x);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
G__60638.cljs$core$IFn$_invoke$arity$0 = G__60638__0;
G__60638.cljs$core$IFn$_invoke$arity$1 = G__60638__1;
G__60638.cljs$core$IFn$_invoke$arity$2 = G__60638__2;
return G__60638;
})()
});
}));

(medley.core.drop_upto.cljs$core$IFn$_invoke$arity$2 = (function (pred,coll){
return cljs.core.rest(cljs.core.drop_while.cljs$core$IFn$_invoke$arity$2(cljs.core.complement(pred),coll));
}));

(medley.core.drop_upto.cljs$lang$maxFixedArity = 2);

/**
 * Returns an ordered, lazy sequence of vectors `[index item]`, where item is a
 *   value in coll, and index its position starting from zero. Returns a transducer
 *   when no collection is provided.
 */
medley.core.indexed = (function medley$core$indexed(var_args){
var G__60425 = arguments.length;
switch (G__60425) {
case 0:
return medley.core.indexed.cljs$core$IFn$_invoke$arity$0();

break;
case 1:
return medley.core.indexed.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(medley.core.indexed.cljs$core$IFn$_invoke$arity$0 = (function (){
return (function (rf){
var i = cljs.core.volatile_BANG_((-1));
return (function() {
var G__60641 = null;
var G__60641__0 = (function (){
return (rf.cljs$core$IFn$_invoke$arity$0 ? rf.cljs$core$IFn$_invoke$arity$0() : rf.call(null));
});
var G__60641__1 = (function (result){
return (rf.cljs$core$IFn$_invoke$arity$1 ? rf.cljs$core$IFn$_invoke$arity$1(result) : rf.call(null,result));
});
var G__60641__2 = (function (result,x){
var G__60426 = result;
var G__60427 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [i.cljs$core$IVolatile$_vreset_BANG_$arity$2(null,(i.cljs$core$IDeref$_deref$arity$1(null) + (1))),x], null);
return (rf.cljs$core$IFn$_invoke$arity$2 ? rf.cljs$core$IFn$_invoke$arity$2(G__60426,G__60427) : rf.call(null,G__60426,G__60427));
});
G__60641 = function(result,x){
switch(arguments.length){
case 0:
return G__60641__0.call(this);
case 1:
return G__60641__1.call(this,result);
case 2:
return G__60641__2.call(this,result,x);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
G__60641.cljs$core$IFn$_invoke$arity$0 = G__60641__0;
G__60641.cljs$core$IFn$_invoke$arity$1 = G__60641__1;
G__60641.cljs$core$IFn$_invoke$arity$2 = G__60641__2;
return G__60641;
})()
});
}));

(medley.core.indexed.cljs$core$IFn$_invoke$arity$1 = (function (coll){
return cljs.core.map_indexed.cljs$core$IFn$_invoke$arity$2(cljs.core.vector,coll);
}));

(medley.core.indexed.cljs$lang$maxFixedArity = 1);

/**
 * Returns a lazy sequence of the items in coll, with a new item inserted at
 *   the supplied index, followed by all subsequent items of the collection. Runs
 *   in O(n) time. Returns a transducer when no collection is provided.
 */
medley.core.insert_nth = (function medley$core$insert_nth(var_args){
var G__60429 = arguments.length;
switch (G__60429) {
case 2:
return medley.core.insert_nth.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return medley.core.insert_nth.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(medley.core.insert_nth.cljs$core$IFn$_invoke$arity$2 = (function (index,item){
return (function (rf){
var idx = cljs.core.volatile_BANG_((index + (1)));
return (function() {
var G__60643 = null;
var G__60643__0 = (function (){
return (rf.cljs$core$IFn$_invoke$arity$0 ? rf.cljs$core$IFn$_invoke$arity$0() : rf.call(null));
});
var G__60643__1 = (function (result){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(idx),(1))){
var G__60431 = (rf.cljs$core$IFn$_invoke$arity$2 ? rf.cljs$core$IFn$_invoke$arity$2(result,item) : rf.call(null,result,item));
return (rf.cljs$core$IFn$_invoke$arity$1 ? rf.cljs$core$IFn$_invoke$arity$1(G__60431) : rf.call(null,G__60431));
} else {
return (rf.cljs$core$IFn$_invoke$arity$1 ? rf.cljs$core$IFn$_invoke$arity$1(result) : rf.call(null,result));
}
});
var G__60643__2 = (function (result,x){
if((idx.cljs$core$IVolatile$_vreset_BANG_$arity$2(null,(idx.cljs$core$IDeref$_deref$arity$1(null) - (1))) === (0))){
var G__60432 = (rf.cljs$core$IFn$_invoke$arity$2 ? rf.cljs$core$IFn$_invoke$arity$2(result,item) : rf.call(null,result,item));
var G__60433 = x;
return (rf.cljs$core$IFn$_invoke$arity$2 ? rf.cljs$core$IFn$_invoke$arity$2(G__60432,G__60433) : rf.call(null,G__60432,G__60433));
} else {
return (rf.cljs$core$IFn$_invoke$arity$2 ? rf.cljs$core$IFn$_invoke$arity$2(result,x) : rf.call(null,result,x));
}
});
G__60643 = function(result,x){
switch(arguments.length){
case 0:
return G__60643__0.call(this);
case 1:
return G__60643__1.call(this,result);
case 2:
return G__60643__2.call(this,result,x);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
G__60643.cljs$core$IFn$_invoke$arity$0 = G__60643__0;
G__60643.cljs$core$IFn$_invoke$arity$1 = G__60643__1;
G__60643.cljs$core$IFn$_invoke$arity$2 = G__60643__2;
return G__60643;
})()
});
}));

(medley.core.insert_nth.cljs$core$IFn$_invoke$arity$3 = (function (index,item,coll){
return (new cljs.core.LazySeq(null,(function (){
if((index === (0))){
return cljs.core.cons(item,coll);
} else {
if(cljs.core.seq(coll)){
return cljs.core.cons(cljs.core.first(coll),medley.core.insert_nth.cljs$core$IFn$_invoke$arity$3((index - (1)),item,cljs.core.rest(coll)));
} else {
return null;
}
}
}),null,null));
}));

(medley.core.insert_nth.cljs$lang$maxFixedArity = 3);

/**
 * Returns a lazy sequence of the items in coll, except for the item at the
 *   supplied index. Runs in O(n) time. Returns a transducer when no collection is
 *   provided.
 */
medley.core.remove_nth = (function medley$core$remove_nth(var_args){
var G__60436 = arguments.length;
switch (G__60436) {
case 1:
return medley.core.remove_nth.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return medley.core.remove_nth.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(medley.core.remove_nth.cljs$core$IFn$_invoke$arity$1 = (function (index){
return (function (rf){
var idx = cljs.core.volatile_BANG_((index + (1)));
return (function() {
var G__60645 = null;
var G__60645__0 = (function (){
return (rf.cljs$core$IFn$_invoke$arity$0 ? rf.cljs$core$IFn$_invoke$arity$0() : rf.call(null));
});
var G__60645__1 = (function (result){
return (rf.cljs$core$IFn$_invoke$arity$1 ? rf.cljs$core$IFn$_invoke$arity$1(result) : rf.call(null,result));
});
var G__60645__2 = (function (result,x){
if((idx.cljs$core$IVolatile$_vreset_BANG_$arity$2(null,(idx.cljs$core$IDeref$_deref$arity$1(null) - (1))) === (0))){
return result;
} else {
return (rf.cljs$core$IFn$_invoke$arity$2 ? rf.cljs$core$IFn$_invoke$arity$2(result,x) : rf.call(null,result,x));
}
});
G__60645 = function(result,x){
switch(arguments.length){
case 0:
return G__60645__0.call(this);
case 1:
return G__60645__1.call(this,result);
case 2:
return G__60645__2.call(this,result,x);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
G__60645.cljs$core$IFn$_invoke$arity$0 = G__60645__0;
G__60645.cljs$core$IFn$_invoke$arity$1 = G__60645__1;
G__60645.cljs$core$IFn$_invoke$arity$2 = G__60645__2;
return G__60645;
})()
});
}));

(medley.core.remove_nth.cljs$core$IFn$_invoke$arity$2 = (function (index,coll){
return (new cljs.core.LazySeq(null,(function (){
if((index === (0))){
return cljs.core.rest(coll);
} else {
if(cljs.core.seq(coll)){
return cljs.core.cons(cljs.core.first(coll),medley.core.remove_nth.cljs$core$IFn$_invoke$arity$2((index - (1)),cljs.core.rest(coll)));
} else {
return null;
}
}
}),null,null));
}));

(medley.core.remove_nth.cljs$lang$maxFixedArity = 2);

/**
 * Returns a lazy sequence of the items in coll, with a new item replacing the
 *   item at the supplied index. Runs in O(n) time. Returns a transducer when no
 *   collection is provided.
 */
medley.core.replace_nth = (function medley$core$replace_nth(var_args){
var G__60440 = arguments.length;
switch (G__60440) {
case 2:
return medley.core.replace_nth.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return medley.core.replace_nth.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(medley.core.replace_nth.cljs$core$IFn$_invoke$arity$2 = (function (index,item){
return (function (rf){
var idx = cljs.core.volatile_BANG_((index + (1)));
return (function() {
var G__60647 = null;
var G__60647__0 = (function (){
return (rf.cljs$core$IFn$_invoke$arity$0 ? rf.cljs$core$IFn$_invoke$arity$0() : rf.call(null));
});
var G__60647__1 = (function (result){
return (rf.cljs$core$IFn$_invoke$arity$1 ? rf.cljs$core$IFn$_invoke$arity$1(result) : rf.call(null,result));
});
var G__60647__2 = (function (result,x){
if((idx.cljs$core$IVolatile$_vreset_BANG_$arity$2(null,(idx.cljs$core$IDeref$_deref$arity$1(null) - (1))) === (0))){
return (rf.cljs$core$IFn$_invoke$arity$2 ? rf.cljs$core$IFn$_invoke$arity$2(result,item) : rf.call(null,result,item));
} else {
return (rf.cljs$core$IFn$_invoke$arity$2 ? rf.cljs$core$IFn$_invoke$arity$2(result,x) : rf.call(null,result,x));
}
});
G__60647 = function(result,x){
switch(arguments.length){
case 0:
return G__60647__0.call(this);
case 1:
return G__60647__1.call(this,result);
case 2:
return G__60647__2.call(this,result,x);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
G__60647.cljs$core$IFn$_invoke$arity$0 = G__60647__0;
G__60647.cljs$core$IFn$_invoke$arity$1 = G__60647__1;
G__60647.cljs$core$IFn$_invoke$arity$2 = G__60647__2;
return G__60647;
})()
});
}));

(medley.core.replace_nth.cljs$core$IFn$_invoke$arity$3 = (function (index,item,coll){
return (new cljs.core.LazySeq(null,(function (){
if((index === (0))){
return cljs.core.cons(item,cljs.core.rest(coll));
} else {
if(cljs.core.seq(coll)){
return cljs.core.cons(cljs.core.first(coll),medley.core.replace_nth.cljs$core$IFn$_invoke$arity$3((index - (1)),item,cljs.core.rest(coll)));
} else {
return null;
}
}
}),null,null));
}));

(medley.core.replace_nth.cljs$lang$maxFixedArity = 3);

/**
 * Returns the absolute value of a number.
 */
medley.core.abs = (function medley$core$abs(x){
if((x < (0))){
return (- x);
} else {
return x;
}
});
/**
 * Atomically swaps the value of the atom to be `(apply f x args)`, where x is
 *   the current value of the atom, then returns the original value of the atom.
 *   This function therefore acts like an atomic `deref` then `swap!`.
 */
medley.core.deref_swap_BANG_ = (function medley$core$deref_swap_BANG_(var_args){
var G__60447 = arguments.length;
switch (G__60447) {
case 2:
return medley.core.deref_swap_BANG_.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
var args_arr__5751__auto__ = [];
var len__5726__auto___60656 = arguments.length;
var i__5727__auto___60657 = (0);
while(true){
if((i__5727__auto___60657 < len__5726__auto___60656)){
args_arr__5751__auto__.push((arguments[i__5727__auto___60657]));

var G__60658 = (i__5727__auto___60657 + (1));
i__5727__auto___60657 = G__60658;
continue;
} else {
}
break;
}

var argseq__5752__auto__ = ((((2) < args_arr__5751__auto__.length))?(new cljs.core.IndexedSeq(args_arr__5751__auto__.slice((2)),(0),null)):null);
return medley.core.deref_swap_BANG_.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),(arguments[(1)]),argseq__5752__auto__);

}
});

(medley.core.deref_swap_BANG_.cljs$core$IFn$_invoke$arity$2 = (function (atom,f){
var value = cljs.core.deref(atom);
cljs.core.reset_BANG_(atom,(f.cljs$core$IFn$_invoke$arity$1 ? f.cljs$core$IFn$_invoke$arity$1(value) : f.call(null,value)));

return value;
}));

(medley.core.deref_swap_BANG_.cljs$core$IFn$_invoke$arity$variadic = (function (atom,f,args){
return medley.core.deref_swap_BANG_.cljs$core$IFn$_invoke$arity$2(atom,(function (p1__60441_SHARP_){
return cljs.core.apply.cljs$core$IFn$_invoke$arity$3(f,p1__60441_SHARP_,args);
}));
}));

/** @this {Function} */
(medley.core.deref_swap_BANG_.cljs$lang$applyTo = (function (seq60443){
var G__60444 = cljs.core.first(seq60443);
var seq60443__$1 = cljs.core.next(seq60443);
var G__60445 = cljs.core.first(seq60443__$1);
var seq60443__$2 = cljs.core.next(seq60443__$1);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__60444,G__60445,seq60443__$2);
}));

(medley.core.deref_swap_BANG_.cljs$lang$maxFixedArity = (2));

/**
 * Sets the value of the atom without regard for the current value, then returns
 *   the original value of the atom. See also: [[deref-swap!]].
 */
medley.core.deref_reset_BANG_ = (function medley$core$deref_reset_BANG_(atom,newval){
return medley.core.deref_swap_BANG_.cljs$core$IFn$_invoke$arity$2(atom,cljs.core.constantly(newval));
});
/**
 * Returns the message attached to the given Error/Throwable object. For all
 *   other types returns nil. Same as `cljs.core/ex-message` except it works for
 *   Clojure as well as ClojureScript.
 */
medley.core.ex_message = (function medley$core$ex_message(ex){
return cljs.core.ex_message(ex);
});
/**
 * Returns the cause attached to the given ExceptionInfo/Throwable object. For
 *   all other types returns nil. Same as `cljs.core/ex-cause` except it works for
 *   Clojure as well as ClojureScript.
 */
medley.core.ex_cause = (function medley$core$ex_cause(ex){
return cljs.core.ex_cause(ex);
});
/**
 * Returns true if the value is a UUID.
 */
medley.core.uuid_QMARK_ = (function medley$core$uuid_QMARK_(x){
return (x instanceof cljs.core.UUID);
});
/**
 * Returns a UUID generated from the supplied string. Same as `cljs.core/uuid`
 *   in ClojureScript, while in Clojure it returns a `java.util.UUID` object.
 */
medley.core.uuid = (function medley$core$uuid(s){
return cljs.core.uuid(s);
});
/**
 * Generates a new random UUID. Same as `cljs.core/random-uuid` except it works
 *   for Clojure as well as ClojureScript.
 */
medley.core.random_uuid = (function medley$core$random_uuid(){
return cljs.core.random_uuid();
});
/**
 * Returns true if the value is a regular expression.
 */
medley.core.regexp_QMARK_ = (function medley$core$regexp_QMARK_(x){
return (x instanceof RegExp);
});

//# sourceMappingURL=medley.core.js.map
