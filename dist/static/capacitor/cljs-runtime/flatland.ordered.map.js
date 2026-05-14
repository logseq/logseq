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
var G__58848 = null;
var G__58848__1 = (function (f){
var self__ = this;
var this$ = this;
var seq__58681 = cljs.core.seq(self__.ks);
var chunk__58682 = null;
var count__58683 = (0);
var i__58684 = (0);
while(true){
if((i__58684 < count__58683)){
var k = chunk__58682.cljs$core$IIndexed$_nth$arity$2(null,i__58684);
var G__58701_58850 = k;
var G__58702_58851 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(self__.kvs,k);
var G__58703_58852 = this$;
(f.cljs$core$IFn$_invoke$arity$3 ? f.cljs$core$IFn$_invoke$arity$3(G__58701_58850,G__58702_58851,G__58703_58852) : f.call(null,G__58701_58850,G__58702_58851,G__58703_58852));


var G__58857 = seq__58681;
var G__58858 = chunk__58682;
var G__58859 = count__58683;
var G__58860 = (i__58684 + (1));
seq__58681 = G__58857;
chunk__58682 = G__58858;
count__58683 = G__58859;
i__58684 = G__58860;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__58681);
if(temp__5804__auto__){
var seq__58681__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__58681__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__58681__$1);
var G__58864 = cljs.core.chunk_rest(seq__58681__$1);
var G__58865 = c__5525__auto__;
var G__58866 = cljs.core.count(c__5525__auto__);
var G__58867 = (0);
seq__58681 = G__58864;
chunk__58682 = G__58865;
count__58683 = G__58866;
i__58684 = G__58867;
continue;
} else {
var k = cljs.core.first(seq__58681__$1);
var G__58710_58868 = k;
var G__58711_58869 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(self__.kvs,k);
var G__58712_58870 = this$;
(f.cljs$core$IFn$_invoke$arity$3 ? f.cljs$core$IFn$_invoke$arity$3(G__58710_58868,G__58711_58869,G__58712_58870) : f.call(null,G__58710_58868,G__58711_58869,G__58712_58870));


var G__58876 = cljs.core.next(seq__58681__$1);
var G__58877 = null;
var G__58878 = (0);
var G__58879 = (0);
seq__58681 = G__58876;
chunk__58682 = G__58877;
count__58683 = G__58878;
i__58684 = G__58879;
continue;
}
} else {
return null;
}
}
break;
}
});
var G__58848__2 = (function (f,use_as_this){
var self__ = this;
var this$ = this;
var seq__58724 = cljs.core.seq(self__.ks);
var chunk__58725 = null;
var count__58726 = (0);
var i__58727 = (0);
while(true){
if((i__58727 < count__58726)){
var k = chunk__58725.cljs$core$IIndexed$_nth$arity$2(null,i__58727);
f.call(use_as_this,k,cljs.core.get.cljs$core$IFn$_invoke$arity$2(self__.kvs,k),this$);


var G__58888 = seq__58724;
var G__58889 = chunk__58725;
var G__58890 = count__58726;
var G__58891 = (i__58727 + (1));
seq__58724 = G__58888;
chunk__58725 = G__58889;
count__58726 = G__58890;
i__58727 = G__58891;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__58724);
if(temp__5804__auto__){
var seq__58724__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__58724__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__58724__$1);
var G__58894 = cljs.core.chunk_rest(seq__58724__$1);
var G__58895 = c__5525__auto__;
var G__58896 = cljs.core.count(c__5525__auto__);
var G__58897 = (0);
seq__58724 = G__58894;
chunk__58725 = G__58895;
count__58726 = G__58896;
i__58727 = G__58897;
continue;
} else {
var k = cljs.core.first(seq__58724__$1);
f.call(use_as_this,k,cljs.core.get.cljs$core$IFn$_invoke$arity$2(self__.kvs,k),this$);


var G__58898 = cljs.core.next(seq__58724__$1);
var G__58899 = null;
var G__58900 = (0);
var G__58901 = (0);
seq__58724 = G__58898;
chunk__58725 = G__58899;
count__58726 = G__58900;
i__58727 = G__58901;
continue;
}
} else {
return null;
}
}
break;
}
});
G__58848 = function(f,use_as_this){
switch(arguments.length){
case 1:
return G__58848__1.call(this,f);
case 2:
return G__58848__2.call(this,f,use_as_this);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
G__58848.cljs$core$IFn$_invoke$arity$1 = G__58848__1;
G__58848.cljs$core$IFn$_invoke$arity$2 = G__58848__2;
return G__58848;
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
var G__58754 = acc;
var G__58755 = k;
var G__58756 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(self__.kvs,k);
return (f.cljs$core$IFn$_invoke$arity$3 ? f.cljs$core$IFn$_invoke$arity$3(G__58754,G__58755,G__58756) : f.call(null,G__58754,G__58755,G__58756));
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
return cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__58664_SHARP_){
return cljs.core._find(self__.kvs,p1__58664_SHARP_);
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
return cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__58663_SHARP_){
return cljs.core._find(self__.kvs,p1__58663_SHARP_);
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
return (new flatland.ordered.map.OrderedMap(cljs.core.conj.cljs$core$IFn$_invoke$arity$2(self__.kvs,entry),cljs.core.into.cljs$core$IFn$_invoke$arity$3(self__.ks,cljs.core.comp.cljs$core$IFn$_invoke$arity$2(cljs.core.map.cljs$core$IFn$_invoke$arity$1((function (p1__58658_SHARP_){
return cljs.core._nth(p1__58658_SHARP_,(0));
})),cljs.core.remove.cljs$core$IFn$_invoke$arity$1((function (p1__58659_SHARP_){
return cljs.core.contains_QMARK_(self__.kvs,p1__58659_SHARP_);
}))),entry)));
}
}));

(flatland.ordered.map.OrderedMap.prototype.call = (function (unused__11818__auto__){
var self__ = this;
var self__ = this;
var G__58786 = (arguments.length - (1));
switch (G__58786) {
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

(flatland.ordered.map.OrderedMap.prototype.apply = (function (self__,args58675){
var self__ = this;
var self____$1 = this;
return self____$1.call.apply(self____$1,[self____$1].concat(cljs.core.aclone(args58675)));
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
var G__58818 = arguments.length;
switch (G__58818) {
case 0:
return flatland.ordered.map.ordered_map.cljs$core$IFn$_invoke$arity$0();

break;
case 1:
return flatland.ordered.map.ordered_map.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
default:
var args_arr__5751__auto__ = [];
var len__5726__auto___58928 = arguments.length;
var i__5727__auto___58930 = (0);
while(true){
if((i__5727__auto___58930 < len__5726__auto___58928)){
args_arr__5751__auto__.push((arguments[i__5727__auto___58930]));

var G__58931 = (i__5727__auto___58930 + (1));
i__5727__auto___58930 = G__58931;
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
(flatland.ordered.map.ordered_map.cljs$lang$applyTo = (function (seq58814){
var G__58815 = cljs.core.first(seq58814);
var seq58814__$1 = cljs.core.next(seq58814);
var G__58816 = cljs.core.first(seq58814__$1);
var seq58814__$2 = cljs.core.next(seq58814__$1);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__58815,G__58816,seq58814__$2);
}));

(flatland.ordered.map.ordered_map.cljs$lang$maxFixedArity = (2));


//# sourceMappingURL=flatland.ordered.map.js.map
