goog.provide('flatland.ordered.map');
flatland.ordered.map.print_ordered_map = (function flatland$ordered$map$print_ordered_map(writer,kvs,ks,opts){
return cljs.core.pr_sequential_writer(writer,(function (k,w,opts__$1){
cljs.core._write(w,"[");

cljs.core._write(w,cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([k], 0)));

cljs.core._write(w," ");

cljs.core._write(w,cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.get.cljs$core$IFn$_invoke$arity$2(kvs,k)], 0)));

return cljs.core._write(w,"]");
}),"("," ",")",opts,ks);
});

/**
* @constructor
 * @implements {cljs.core.IReversible}
 * @implements {cljs.core.IKVReduce}
 * @implements {cljs.core.IEquiv}
 * @implements {cljs.core.IHash}
 * @implements {cljs.core.IFn}
 * @implements {cljs.core.ICollection}
 * @implements {cljs.core.IFind}
 * @implements {cljs.core.IEmptyableCollection}
 * @implements {cljs.core.ICounted}
 * @implements {cljs.core.ISeqable}
 * @implements {cljs.core.IMeta}
 * @implements {cljs.core.ICloneable}
 * @implements {cljs.core.IPrintWithWriter}
 * @implements {cljs.core.IWithMeta}
 * @implements {cljs.core.IAssociative}
 * @implements {cljs.core.IMap}
 * @implements {cljs.core.ILookup}
*/
flatland.ordered.map.OrderedMap = (function (kvs,ks){
this.kvs = kvs;
this.ks = ks;
this.cljs$lang$protocol_mask$partition0$ = 2297825039;
this.cljs$lang$protocol_mask$partition1$ = 8192;
});
(flatland.ordered.map.OrderedMap.prototype.cljs$core$IFind$ = cljs.core.PROTOCOL_SENTINEL);

(flatland.ordered.map.OrderedMap.prototype.cljs$core$IFind$_find$arity$2 = (function (this$,k){
var self__ = this;
var this$__$1 = this;
return cljs.core._find(self__.kvs,k);
}));

(flatland.ordered.map.OrderedMap.prototype.entry_set = (function (){
var self__ = this;
var this$ = this;
return cljs.core.to_array(cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.to_array,self__.kvs));
}));

(flatland.ordered.map.OrderedMap.prototype.forEach = (function() {
var G__58697 = null;
var G__58697__1 = (function (f){
var self__ = this;
var this$ = this;
var seq__58519 = cljs.core.seq(self__.ks);
var chunk__58520 = null;
var count__58521 = (0);
var i__58522 = (0);
while(true){
if((i__58522 < count__58521)){
var k = chunk__58520.cljs$core$IIndexed$_nth$arity$2(null,i__58522);
var G__58539_58699 = k;
var G__58540_58700 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(self__.kvs,k);
var G__58541_58701 = this$;
(f.cljs$core$IFn$_invoke$arity$3 ? f.cljs$core$IFn$_invoke$arity$3(G__58539_58699,G__58540_58700,G__58541_58701) : f.call(null,G__58539_58699,G__58540_58700,G__58541_58701));


var G__58702 = seq__58519;
var G__58703 = chunk__58520;
var G__58704 = count__58521;
var G__58705 = (i__58522 + (1));
seq__58519 = G__58702;
chunk__58520 = G__58703;
count__58521 = G__58704;
i__58522 = G__58705;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__58519);
if(temp__5804__auto__){
var seq__58519__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__58519__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__58519__$1);
var G__58708 = cljs.core.chunk_rest(seq__58519__$1);
var G__58709 = c__5525__auto__;
var G__58710 = cljs.core.count(c__5525__auto__);
var G__58711 = (0);
seq__58519 = G__58708;
chunk__58520 = G__58709;
count__58521 = G__58710;
i__58522 = G__58711;
continue;
} else {
var k = cljs.core.first(seq__58519__$1);
var G__58544_58712 = k;
var G__58545_58713 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(self__.kvs,k);
var G__58546_58714 = this$;
(f.cljs$core$IFn$_invoke$arity$3 ? f.cljs$core$IFn$_invoke$arity$3(G__58544_58712,G__58545_58713,G__58546_58714) : f.call(null,G__58544_58712,G__58545_58713,G__58546_58714));


var G__58715 = cljs.core.next(seq__58519__$1);
var G__58716 = null;
var G__58717 = (0);
var G__58718 = (0);
seq__58519 = G__58715;
chunk__58520 = G__58716;
count__58521 = G__58717;
i__58522 = G__58718;
continue;
}
} else {
return null;
}
}
break;
}
});
var G__58697__2 = (function (f,use_as_this){
var self__ = this;
var this$ = this;
var seq__58551 = cljs.core.seq(self__.ks);
var chunk__58552 = null;
var count__58553 = (0);
var i__58554 = (0);
while(true){
if((i__58554 < count__58553)){
var k = chunk__58552.cljs$core$IIndexed$_nth$arity$2(null,i__58554);
f.call(use_as_this,k,cljs.core.get.cljs$core$IFn$_invoke$arity$2(self__.kvs,k),this$);


var G__58723 = seq__58551;
var G__58724 = chunk__58552;
var G__58725 = count__58553;
var G__58726 = (i__58554 + (1));
seq__58551 = G__58723;
chunk__58552 = G__58724;
count__58553 = G__58725;
i__58554 = G__58726;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__58551);
if(temp__5804__auto__){
var seq__58551__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__58551__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__58551__$1);
var G__58727 = cljs.core.chunk_rest(seq__58551__$1);
var G__58728 = c__5525__auto__;
var G__58729 = cljs.core.count(c__5525__auto__);
var G__58730 = (0);
seq__58551 = G__58727;
chunk__58552 = G__58728;
count__58553 = G__58729;
i__58554 = G__58730;
continue;
} else {
var k = cljs.core.first(seq__58551__$1);
f.call(use_as_this,k,cljs.core.get.cljs$core$IFn$_invoke$arity$2(self__.kvs,k),this$);


var G__58731 = cljs.core.next(seq__58551__$1);
var G__58732 = null;
var G__58733 = (0);
var G__58734 = (0);
seq__58551 = G__58731;
chunk__58552 = G__58732;
count__58553 = G__58733;
i__58554 = G__58734;
continue;
}
} else {
return null;
}
}
break;
}
});
G__58697 = function(f,use_as_this){
switch(arguments.length){
case 1:
return G__58697__1.call(this,f);
case 2:
return G__58697__2.call(this,f,use_as_this);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
G__58697.cljs$core$IFn$_invoke$arity$1 = G__58697__1;
G__58697.cljs$core$IFn$_invoke$arity$2 = G__58697__2;
return G__58697;
})()
);

(flatland.ordered.map.OrderedMap.prototype.get = (function (k){
var self__ = this;
var this$ = this;
return self__.kvs.get(k);
}));

(flatland.ordered.map.OrderedMap.prototype.key_set = (function (){
var self__ = this;
var this$ = this;
return cljs.core.to_array(cljs.core.keys(self__.kvs));
}));

(flatland.ordered.map.OrderedMap.prototype.entries = (function (){
var self__ = this;
var this$ = this;
return cljs.core.es6_entries_iterator(cljs.core.seq(self__.kvs));
}));

(flatland.ordered.map.OrderedMap.prototype.value_set = (function (){
var self__ = this;
var this$ = this;
return cljs.core.to_array(cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.val,self__.kvs));
}));

(flatland.ordered.map.OrderedMap.prototype.toString = (function (){
var self__ = this;
var this$ = this;
return cljs.core.pr_str_STAR_(this$);
}));

(flatland.ordered.map.OrderedMap.prototype.keys = (function (){
var self__ = this;
var this$ = this;
return cljs.core.es6_iterator(self__.ks);
}));

(flatland.ordered.map.OrderedMap.prototype.values = (function (){
var self__ = this;
var this$ = this;
return cljs.core.es6_iterator(cljs.core.vals(self__.kvs));
}));

(flatland.ordered.map.OrderedMap.prototype.equiv = (function (that){
var self__ = this;
var this$ = this;
return (flatland.ordered.map.equiv_impl.cljs$core$IFn$_invoke$arity$2 ? flatland.ordered.map.equiv_impl.cljs$core$IFn$_invoke$arity$2(self__.kvs,that) : flatland.ordered.map.equiv_impl.call(null,self__.kvs,that));
}));

(flatland.ordered.map.OrderedMap.prototype.has = (function (k){
var self__ = this;
var this$ = this;
return (!((self__.kvs.get(k) == null)));
}));

(flatland.ordered.map.OrderedMap.prototype.cljs$core$ILookup$_lookup$arity$2 = (function (this$,attr){
var self__ = this;
var this$__$1 = this;
return cljs.core._lookup(self__.kvs,attr);
}));

(flatland.ordered.map.OrderedMap.prototype.cljs$core$ILookup$_lookup$arity$3 = (function (this$,attr,not_found){
var self__ = this;
var this$__$1 = this;
return cljs.core._lookup(self__.kvs,attr,not_found);
}));

(flatland.ordered.map.OrderedMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = (function (coll,f,init){
var self__ = this;
var coll__$1 = this;
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (acc,k){
var G__58600 = acc;
var G__58601 = k;
var G__58602 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(self__.kvs,k);
return (f.cljs$core$IFn$_invoke$arity$3 ? f.cljs$core$IFn$_invoke$arity$3(G__58600,G__58601,G__58602) : f.call(null,G__58600,G__58601,G__58602));
}),init,self__.ks);
}));

(flatland.ordered.map.OrderedMap.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = (function (_,writer,opts){
var self__ = this;
var ___$1 = this;
cljs.core._write(writer,"#ordered/map ");

return flatland.ordered.map.print_ordered_map(writer,self__.kvs,self__.ks,opts);
}));

(flatland.ordered.map.OrderedMap.prototype.cljs$core$IMeta$_meta$arity$1 = (function (this$){
var self__ = this;
var this$__$1 = this;
return cljs.core.meta(self__.kvs);
}));

(flatland.ordered.map.OrderedMap.prototype.cljs$core$ICloneable$_clone$arity$1 = (function (_){
var self__ = this;
var ___$1 = this;
return (new flatland.ordered.map.OrderedMap(self__.kvs,self__.ks));
}));

(flatland.ordered.map.OrderedMap.prototype.cljs$core$ICounted$_count$arity$1 = (function (this$){
var self__ = this;
var this$__$1 = this;
return cljs.core.count(self__.kvs);
}));

(flatland.ordered.map.OrderedMap.prototype.cljs$core$IReversible$_rseq$arity$1 = (function (this$){
var self__ = this;
var this$__$1 = this;
if(cljs.core.seq(self__.ks)){
return cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__58491_SHARP_){
return cljs.core._find(self__.kvs,p1__58491_SHARP_);
}),cljs.core.rseq(self__.ks));
} else {
return null;
}
}));

(flatland.ordered.map.OrderedMap.prototype.cljs$core$IHash$_hash$arity$1 = (function (_){
var self__ = this;
var ___$1 = this;
return cljs.core.hash(self__.kvs);
}));

(flatland.ordered.map.OrderedMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = (function (this$,that){
var self__ = this;
var this$__$1 = this;
return (flatland.ordered.map.equiv_impl.cljs$core$IFn$_invoke$arity$2 ? flatland.ordered.map.equiv_impl.cljs$core$IFn$_invoke$arity$2(self__.kvs,that) : flatland.ordered.map.equiv_impl.call(null,self__.kvs,that));
}));

(flatland.ordered.map.OrderedMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = (function (this$){
var self__ = this;
var this$__$1 = this;
if(cljs.core.seq(self__.ks)){
return (new flatland.ordered.map.OrderedMap(cljs.core._empty(self__.kvs),cljs.core.PersistentVector.EMPTY));
} else {
return this$__$1;
}
}));

(flatland.ordered.map.OrderedMap.prototype.cljs$core$IMap$_dissoc$arity$2 = (function (this$,k){
var self__ = this;
var this$__$1 = this;
if(cljs.core.contains_QMARK_(self__.kvs,k)){
return (new flatland.ordered.map.OrderedMap(cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(self__.kvs,k),cljs.core.into.cljs$core$IFn$_invoke$arity$3(cljs.core.PersistentVector.EMPTY,cljs.core.remove.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentHashSet.createAsIfByAssoc([k])),self__.ks)));
} else {
return this$__$1;
}
}));

(flatland.ordered.map.OrderedMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = (function (coll,k,v){
var self__ = this;
var coll__$1 = this;
return (new flatland.ordered.map.OrderedMap(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(self__.kvs,k,v),((cljs.core.contains_QMARK_(self__.kvs,k))?self__.ks:cljs.core.conj.cljs$core$IFn$_invoke$arity$2(self__.ks,k))));
}));

(flatland.ordered.map.OrderedMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = (function (this$,k){
var self__ = this;
var this$__$1 = this;
return cljs.core.contains_QMARK_(self__.kvs,k);
}));

(flatland.ordered.map.OrderedMap.prototype.cljs$core$ISeqable$_seq$arity$1 = (function (this$){
var self__ = this;
var this$__$1 = this;
if(cljs.core.seq(self__.ks)){
return cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__58489_SHARP_){
return cljs.core._find(self__.kvs,p1__58489_SHARP_);
}),self__.ks);
} else {
return null;
}
}));

(flatland.ordered.map.OrderedMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = (function (this$,new_meta){
var self__ = this;
var this$__$1 = this;
if((cljs.core.meta(self__.kvs) === new_meta)){
return this$__$1;
} else {
return (new flatland.ordered.map.OrderedMap(cljs.core.with_meta(self__.kvs,new_meta),self__.ks));
}
}));

(flatland.ordered.map.OrderedMap.prototype.cljs$core$ICollection$_conj$arity$2 = (function (coll,entry){
var self__ = this;
var coll__$1 = this;
if(cljs.core.vector_QMARK_(entry)){
return (new flatland.ordered.map.OrderedMap(cljs.core.conj.cljs$core$IFn$_invoke$arity$2(self__.kvs,entry),((cljs.core.contains_QMARK_(self__.kvs,cljs.core._nth(entry,(0))))?self__.ks:cljs.core.conj.cljs$core$IFn$_invoke$arity$2(self__.ks,cljs.core._nth(entry,(0))))));
} else {
return (new flatland.ordered.map.OrderedMap(cljs.core.conj.cljs$core$IFn$_invoke$arity$2(self__.kvs,entry),cljs.core.into.cljs$core$IFn$_invoke$arity$3(self__.ks,cljs.core.comp.cljs$core$IFn$_invoke$arity$2(cljs.core.map.cljs$core$IFn$_invoke$arity$1((function (p1__58484_SHARP_){
return cljs.core._nth(p1__58484_SHARP_,(0));
})),cljs.core.remove.cljs$core$IFn$_invoke$arity$1((function (p1__58486_SHARP_){
return cljs.core.contains_QMARK_(self__.kvs,p1__58486_SHARP_);
}))),entry)));
}
}));

(flatland.ordered.map.OrderedMap.prototype.call = (function (unused__11818__auto__){
var self__ = this;
var self__ = this;
var G__58656 = (arguments.length - (1));
switch (G__58656) {
case (1):
return self__.cljs$core$IFn$_invoke$arity$1((arguments[(1)]));

break;
case (2):
return self__.cljs$core$IFn$_invoke$arity$2((arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1((arguments.length - (1)))].join('')));

}
}));

(flatland.ordered.map.OrderedMap.prototype.apply = (function (self__,args58503){
var self__ = this;
var self____$1 = this;
return self____$1.call.apply(self____$1,[self____$1].concat(cljs.core.aclone(args58503)));
}));

(flatland.ordered.map.OrderedMap.prototype.cljs$core$IFn$_invoke$arity$1 = (function (k){
var self__ = this;
var this$ = this;
return (self__.kvs.cljs$core$IFn$_invoke$arity$1 ? self__.kvs.cljs$core$IFn$_invoke$arity$1(k) : self__.kvs.call(null,k));
}));

(flatland.ordered.map.OrderedMap.prototype.cljs$core$IFn$_invoke$arity$2 = (function (k,not_found){
var self__ = this;
var this$ = this;
return (self__.kvs.cljs$core$IFn$_invoke$arity$2 ? self__.kvs.cljs$core$IFn$_invoke$arity$2(k,not_found) : self__.kvs.call(null,k,not_found));
}));

(flatland.ordered.map.OrderedMap.getBasis = (function (){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"kvs","kvs",-1695980277,null),new cljs.core.Symbol(null,"ks","ks",-754231827,null)], null);
}));

(flatland.ordered.map.OrderedMap.cljs$lang$type = true);

(flatland.ordered.map.OrderedMap.cljs$lang$ctorStr = "flatland.ordered.map/OrderedMap");

(flatland.ordered.map.OrderedMap.cljs$lang$ctorPrWriter = (function (this__5287__auto__,writer__5288__auto__,opt__5289__auto__){
return cljs.core._write(writer__5288__auto__,"flatland.ordered.map/OrderedMap");
}));

/**
 * Positional factory function for flatland.ordered.map/OrderedMap.
 */
flatland.ordered.map.__GT_OrderedMap = (function flatland$ordered$map$__GT_OrderedMap(kvs,ks){
return (new flatland.ordered.map.OrderedMap(kvs,ks));
});

flatland.ordered.map.equiv_impl = (function flatland$ordered$map$equiv_impl(kvs,that){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(kvs,(((that instanceof flatland.ordered.map.OrderedMap))?that.kvs:that));
});
flatland.ordered.map.empty_ordered_map = (new flatland.ordered.map.OrderedMap(cljs.core.PersistentArrayMap.EMPTY,cljs.core.PersistentVector.EMPTY));
flatland.ordered.map.ordered_map = (function flatland$ordered$map$ordered_map(var_args){
var G__58670 = arguments.length;
switch (G__58670) {
case 0:
return flatland.ordered.map.ordered_map.cljs$core$IFn$_invoke$arity$0();

break;
case 1:
return flatland.ordered.map.ordered_map.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
default:
var args_arr__5751__auto__ = [];
var len__5726__auto___58757 = arguments.length;
var i__5727__auto___58758 = (0);
while(true){
if((i__5727__auto___58758 < len__5726__auto___58757)){
args_arr__5751__auto__.push((arguments[i__5727__auto___58758]));

var G__58760 = (i__5727__auto___58758 + (1));
i__5727__auto___58758 = G__58760;
continue;
} else {
}
break;
}

var argseq__5752__auto__ = ((((2) < args_arr__5751__auto__.length))?(new cljs.core.IndexedSeq(args_arr__5751__auto__.slice((2)),(0),null)):null);
return flatland.ordered.map.ordered_map.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),(arguments[(1)]),argseq__5752__auto__);

}
});

(flatland.ordered.map.ordered_map.cljs$core$IFn$_invoke$arity$0 = (function (){
return flatland.ordered.map.empty_ordered_map;
}));

(flatland.ordered.map.ordered_map.cljs$core$IFn$_invoke$arity$1 = (function (coll){
return cljs.core.into.cljs$core$IFn$_invoke$arity$2(flatland.ordered.map.empty_ordered_map,coll);
}));

(flatland.ordered.map.ordered_map.cljs$core$IFn$_invoke$arity$variadic = (function (k,v,kvs){
return cljs.core.apply.cljs$core$IFn$_invoke$arity$5(cljs.core.assoc,flatland.ordered.map.empty_ordered_map,k,v,kvs);
}));

/** @this {Function} */
(flatland.ordered.map.ordered_map.cljs$lang$applyTo = (function (seq58667){
var G__58668 = cljs.core.first(seq58667);
var seq58667__$1 = cljs.core.next(seq58667);
var G__58669 = cljs.core.first(seq58667__$1);
var seq58667__$2 = cljs.core.next(seq58667__$1);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__58668,G__58669,seq58667__$2);
}));

(flatland.ordered.map.ordered_map.cljs$lang$maxFixedArity = (2));


//# sourceMappingURL=flatland.ordered.map.js.map
