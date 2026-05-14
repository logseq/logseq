goog.provide('instaparse.auto_flatten_seq');
instaparse.auto_flatten_seq.threshold = (32);

/**
 * @interface
 */
instaparse.auto_flatten_seq.ConjFlat = function(){};

var instaparse$auto_flatten_seq$ConjFlat$conj_flat$dyn_133997 = (function (self,obj){
var x__5350__auto__ = (((self == null))?null:self);
var m__5351__auto__ = (instaparse.auto_flatten_seq.conj_flat[goog.typeOf(x__5350__auto__)]);
if((!((m__5351__auto__ == null)))){
return (m__5351__auto__.cljs$core$IFn$_invoke$arity$2 ? m__5351__auto__.cljs$core$IFn$_invoke$arity$2(self,obj) : m__5351__auto__.call(null,self,obj));
} else {
var m__5349__auto__ = (instaparse.auto_flatten_seq.conj_flat["_"]);
if((!((m__5349__auto__ == null)))){
return (m__5349__auto__.cljs$core$IFn$_invoke$arity$2 ? m__5349__auto__.cljs$core$IFn$_invoke$arity$2(self,obj) : m__5349__auto__.call(null,self,obj));
} else {
throw cljs.core.missing_protocol("ConjFlat.conj-flat",self);
}
}
});
instaparse.auto_flatten_seq.conj_flat = (function instaparse$auto_flatten_seq$conj_flat(self,obj){
if((((!((self == null)))) && ((!((self.instaparse$auto_flatten_seq$ConjFlat$conj_flat$arity$2 == null)))))){
return self.instaparse$auto_flatten_seq$ConjFlat$conj_flat$arity$2(self,obj);
} else {
return instaparse$auto_flatten_seq$ConjFlat$conj_flat$dyn_133997(self,obj);
}
});

var instaparse$auto_flatten_seq$ConjFlat$cached_QMARK_$dyn_133998 = (function (self){
var x__5350__auto__ = (((self == null))?null:self);
var m__5351__auto__ = (instaparse.auto_flatten_seq.cached_QMARK_[goog.typeOf(x__5350__auto__)]);
if((!((m__5351__auto__ == null)))){
return (m__5351__auto__.cljs$core$IFn$_invoke$arity$1 ? m__5351__auto__.cljs$core$IFn$_invoke$arity$1(self) : m__5351__auto__.call(null,self));
} else {
var m__5349__auto__ = (instaparse.auto_flatten_seq.cached_QMARK_["_"]);
if((!((m__5349__auto__ == null)))){
return (m__5349__auto__.cljs$core$IFn$_invoke$arity$1 ? m__5349__auto__.cljs$core$IFn$_invoke$arity$1(self) : m__5349__auto__.call(null,self));
} else {
throw cljs.core.missing_protocol("ConjFlat.cached?",self);
}
}
});
instaparse.auto_flatten_seq.cached_QMARK_ = (function instaparse$auto_flatten_seq$cached_QMARK_(self){
if((((!((self == null)))) && ((!((self.instaparse$auto_flatten_seq$ConjFlat$cached_QMARK_$arity$1 == null)))))){
return self.instaparse$auto_flatten_seq$ConjFlat$cached_QMARK_$arity$1(self);
} else {
return instaparse$auto_flatten_seq$ConjFlat$cached_QMARK_$dyn_133998(self);
}
});




/**
 * Returns the hash code, consistent with =, for an external ordered
 *   collection implementing Iterable.
 *   See http://clojure.org/data_structures#hash for full algorithms.
 */
instaparse.auto_flatten_seq.hash_conj = (function instaparse$auto_flatten_seq$hash_conj(unmixed_hash,item){
return (cljs.core.imul((31),unmixed_hash) + cljs.core.hash(item));
});
instaparse.auto_flatten_seq.expt = (function instaparse$auto_flatten_seq$expt(base,pow){
if((pow === (0))){
return (1);
} else {
var n = (pow | (0));
var y = ((1) | (0));
var z = (base | (0));
while(true){
var t = cljs.core.even_QMARK_(n);
var n__$1 = cljs.core.quot(n,(2));
if(t){
var G__134000 = n__$1;
var G__134001 = y;
var G__134002 = cljs.core.imul(z,z);
n = G__134000;
y = G__134001;
z = G__134002;
continue;
} else {
if((n__$1 === (0))){
return cljs.core.imul(z,y);
} else {
var G__134003 = n__$1;
var G__134004 = cljs.core.imul(z,y);
var G__134005 = cljs.core.imul(z,z);
n = G__134003;
y = G__134004;
z = G__134005;
continue;

}
}
break;
}
}
});
instaparse.auto_flatten_seq.delve = (function instaparse$auto_flatten_seq$delve(v,index){
var v__$1 = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(v,index);
var index__$1 = index;
while(true){
if(cljs.core.truth_((instaparse.auto_flatten_seq.afs_QMARK_.cljs$core$IFn$_invoke$arity$1 ? instaparse.auto_flatten_seq.afs_QMARK_.cljs$core$IFn$_invoke$arity$1(v__$1) : instaparse.auto_flatten_seq.afs_QMARK_.call(null,v__$1)))){
var G__134008 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(v__$1,(0));
var G__134009 = cljs.core.conj.cljs$core$IFn$_invoke$arity$2(index__$1,(0));
v__$1 = G__134008;
index__$1 = G__134009;
continue;
} else {
return index__$1;
}
break;
}
});
instaparse.auto_flatten_seq.advance = (function instaparse$auto_flatten_seq$advance(v,index){
while(true){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.count(index),(1))){
if((cljs.core.peek(index) < ((instaparse.auto_flatten_seq.true_count.cljs$core$IFn$_invoke$arity$1 ? instaparse.auto_flatten_seq.true_count.cljs$core$IFn$_invoke$arity$1(v) : instaparse.auto_flatten_seq.true_count.call(null,v)) - (1)))){
return instaparse.auto_flatten_seq.delve(v,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [(cljs.core.peek(index) + (1))], null));
} else {
return null;
}
} else {
if((cljs.core.peek(index) < ((function (){var G__133918 = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(v,cljs.core.pop(index));
return (instaparse.auto_flatten_seq.true_count.cljs$core$IFn$_invoke$arity$1 ? instaparse.auto_flatten_seq.true_count.cljs$core$IFn$_invoke$arity$1(G__133918) : instaparse.auto_flatten_seq.true_count.call(null,G__133918));
})() - (1)))){
return instaparse.auto_flatten_seq.delve(v,cljs.core.conj.cljs$core$IFn$_invoke$arity$2(cljs.core.pop(index),(cljs.core.peek(index) + (1))));
} else {
var G__134010 = v;
var G__134011 = cljs.core.pop(index);
v = G__134010;
index = G__134011;
continue;

}
}
break;
}
});
instaparse.auto_flatten_seq.flat_seq = (function instaparse$auto_flatten_seq$flat_seq(var_args){
var G__133922 = arguments.length;
switch (G__133922) {
case 1:
return instaparse.auto_flatten_seq.flat_seq.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return instaparse.auto_flatten_seq.flat_seq.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(instaparse.auto_flatten_seq.flat_seq.cljs$core$IFn$_invoke$arity$1 = (function (v){
if((cljs.core.count(v) > (0))){
return instaparse.auto_flatten_seq.flat_seq.cljs$core$IFn$_invoke$arity$2(v,instaparse.auto_flatten_seq.delve(v,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [(0)], null)));
} else {
return null;
}
}));

(instaparse.auto_flatten_seq.flat_seq.cljs$core$IFn$_invoke$arity$2 = (function (v,index){
return (new cljs.core.LazySeq(null,(function (){
return cljs.core.cons(cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(v,index),(function (){var temp__5804__auto__ = instaparse.auto_flatten_seq.advance(v,index);
if(cljs.core.truth_(temp__5804__auto__)){
var next_index = temp__5804__auto__;
return instaparse.auto_flatten_seq.flat_seq.cljs$core$IFn$_invoke$arity$2(v,next_index);
} else {
return null;
}
})());
}),null,null));
}));

(instaparse.auto_flatten_seq.flat_seq.cljs$lang$maxFixedArity = 2);


/**
* @constructor
 * @implements {cljs.core.IEquiv}
 * @implements {cljs.core.IHash}
 * @implements {cljs.core.ICollection}
 * @implements {cljs.core.IEmptyableCollection}
 * @implements {cljs.core.ICounted}
 * @implements {cljs.core.ISeq}
 * @implements {cljs.core.INext}
 * @implements {instaparse.auto_flatten_seq.ConjFlat}
 * @implements {cljs.core.ISeqable}
 * @implements {cljs.core.IMeta}
 * @implements {cljs.core.ISequential}
 * @implements {cljs.core.IWithMeta}
 * @implements {cljs.core.ILookup}
*/
instaparse.auto_flatten_seq.AutoFlattenSeq = (function (v,premix_hashcode,hashcode,cnt,dirty,cached_seq){
this.v = v;
this.premix_hashcode = premix_hashcode;
this.hashcode = hashcode;
this.cnt = cnt;
this.dirty = dirty;
this.cached_seq = cached_seq;
this.cljs$lang$protocol_mask$partition0$ = 31850958;
this.cljs$lang$protocol_mask$partition1$ = 0;
});
(instaparse.auto_flatten_seq.AutoFlattenSeq.prototype.toString = (function (){
var self__ = this;
var self = this;
return cljs.core.pr_str_STAR_(cljs.core.seq(self));
}));

(instaparse.auto_flatten_seq.AutoFlattenSeq.prototype.cljs$core$ILookup$_lookup$arity$2 = (function (self,key){
var self__ = this;
var self__$1 = this;
return self__.v.cljs$core$ILookup$_lookup$arity$2(null,key);
}));

(instaparse.auto_flatten_seq.AutoFlattenSeq.prototype.cljs$core$ILookup$_lookup$arity$3 = (function (self,key,not_found){
var self__ = this;
var self__$1 = this;
return self__.v.cljs$core$ILookup$_lookup$arity$3(null,key,not_found);
}));

(instaparse.auto_flatten_seq.AutoFlattenSeq.prototype.cljs$core$IMeta$_meta$arity$1 = (function (self){
var self__ = this;
var self__$1 = this;
return cljs.core.meta(self__.v);
}));

(instaparse.auto_flatten_seq.AutoFlattenSeq.prototype.cljs$core$INext$_next$arity$1 = (function (self){
var self__ = this;
var self__$1 = this;
return cljs.core.next(cljs.core.seq(self__$1));
}));

(instaparse.auto_flatten_seq.AutoFlattenSeq.prototype.cljs$core$ICounted$_count$arity$1 = (function (self){
var self__ = this;
var self__$1 = this;
return self__.cnt;
}));

(instaparse.auto_flatten_seq.AutoFlattenSeq.prototype.cljs$core$IHash$_hash$arity$1 = (function (self){
var self__ = this;
var self__$1 = this;
return self__.hashcode;
}));

(instaparse.auto_flatten_seq.AutoFlattenSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = (function (self,other){
var self__ = this;
var self__$1 = this;
return ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(self__.hashcode,cljs.core.hash(other))) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(self__.cnt,cljs.core.count(other))) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(self__.cnt,(0))) || (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.seq(self__$1),other)))))));
}));

(instaparse.auto_flatten_seq.AutoFlattenSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = (function (self){
var self__ = this;
var self__$1 = this;
return cljs.core.with_meta(instaparse.auto_flatten_seq.EMPTY,cljs.core.meta(self__$1));
}));

(instaparse.auto_flatten_seq.AutoFlattenSeq.prototype.cljs$core$ISeq$_first$arity$1 = (function (self){
var self__ = this;
var self__$1 = this;
return cljs.core.first(cljs.core.seq(self__$1));
}));

(instaparse.auto_flatten_seq.AutoFlattenSeq.prototype.cljs$core$ISeq$_rest$arity$1 = (function (self){
var self__ = this;
var self__$1 = this;
return cljs.core.rest(cljs.core.seq(self__$1));
}));

(instaparse.auto_flatten_seq.AutoFlattenSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = (function (self){
var self__ = this;
var self__$1 = this;
if(cljs.core.truth_(self__.cached_seq)){
return self__.cached_seq;
} else {
(self__.cached_seq = ((self__.dirty)?instaparse.auto_flatten_seq.flat_seq.cljs$core$IFn$_invoke$arity$1(self__.v):cljs.core.seq(self__.v)));

return self__.cached_seq;
}
}));

(instaparse.auto_flatten_seq.AutoFlattenSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = (function (self,metamap){
var self__ = this;
var self__$1 = this;
return (new instaparse.auto_flatten_seq.AutoFlattenSeq(cljs.core.with_meta(self__.v,metamap),self__.premix_hashcode,self__.hashcode,self__.cnt,self__.dirty,null));
}));

(instaparse.auto_flatten_seq.AutoFlattenSeq.prototype.cljs$core$ICollection$_conj$arity$2 = (function (self,o){
var self__ = this;
var self__$1 = this;
return cljs.core.cons(o,self__$1);
}));

(instaparse.auto_flatten_seq.AutoFlattenSeq.prototype.instaparse$auto_flatten_seq$ConjFlat$ = cljs.core.PROTOCOL_SENTINEL);

(instaparse.auto_flatten_seq.AutoFlattenSeq.prototype.instaparse$auto_flatten_seq$ConjFlat$conj_flat$arity$2 = (function (self,obj){
var self__ = this;
var self__$1 = this;
if((obj == null)){
return self__$1;
} else {
if(cljs.core.truth_((instaparse.auto_flatten_seq.afs_QMARK_.cljs$core$IFn$_invoke$arity$1 ? instaparse.auto_flatten_seq.afs_QMARK_.cljs$core$IFn$_invoke$arity$1(obj) : instaparse.auto_flatten_seq.afs_QMARK_.call(null,obj)))){
if((self__.cnt === (0))){
return obj;
} else {
if((cljs.core.count(obj) <= (32))){
var phc = (instaparse.auto_flatten_seq.hash_cat.cljs$core$IFn$_invoke$arity$2 ? instaparse.auto_flatten_seq.hash_cat.cljs$core$IFn$_invoke$arity$2(self__$1,obj) : instaparse.auto_flatten_seq.hash_cat.call(null,self__$1,obj));
var new_cnt = (self__.cnt + cljs.core.count(obj));
return (new instaparse.auto_flatten_seq.AutoFlattenSeq(cljs.core.into.cljs$core$IFn$_invoke$arity$2(self__.v,obj),phc,cljs.core.mix_collection_hash(phc,new_cnt),new_cnt,(function (){var or__5002__auto__ = self__.dirty;
if(or__5002__auto__){
return or__5002__auto__;
} else {
return obj.dirty;
}
})(),null));
} else {
var phc = (instaparse.auto_flatten_seq.hash_cat.cljs$core$IFn$_invoke$arity$2 ? instaparse.auto_flatten_seq.hash_cat.cljs$core$IFn$_invoke$arity$2(self__$1,obj) : instaparse.auto_flatten_seq.hash_cat.call(null,self__$1,obj));
var new_cnt = (self__.cnt + cljs.core.count(obj));
return (new instaparse.auto_flatten_seq.AutoFlattenSeq(cljs.core.conj.cljs$core$IFn$_invoke$arity$2(self__.v,obj),phc,cljs.core.mix_collection_hash(phc,new_cnt),new_cnt,true,null));

}
}
} else {
var phc = instaparse.auto_flatten_seq.hash_conj(self__.premix_hashcode,obj);
var new_cnt = (self__.cnt + (1));
return (new instaparse.auto_flatten_seq.AutoFlattenSeq(cljs.core.conj.cljs$core$IFn$_invoke$arity$2(self__.v,obj),phc,cljs.core.mix_collection_hash(phc,new_cnt),new_cnt,self__.dirty,null));

}
}
}));

(instaparse.auto_flatten_seq.AutoFlattenSeq.prototype.instaparse$auto_flatten_seq$ConjFlat$cached_QMARK_$arity$1 = (function (self){
var self__ = this;
var self__$1 = this;
return self__.cached_seq;
}));

(instaparse.auto_flatten_seq.AutoFlattenSeq.getBasis = (function (){
return new cljs.core.PersistentVector(null, 6, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.with_meta(new cljs.core.Symbol(null,"v","v",1661996586,null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),new cljs.core.Symbol(null,"PersistentVector","PersistentVector",-837570443,null)], null)),cljs.core.with_meta(new cljs.core.Symbol(null,"premix-hashcode","premix-hashcode",-1918840795,null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),new cljs.core.Symbol(null,"number","number",-1084057331,null)], null)),cljs.core.with_meta(new cljs.core.Symbol(null,"hashcode","hashcode",1350412446,null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),new cljs.core.Symbol(null,"number","number",-1084057331,null)], null)),cljs.core.with_meta(new cljs.core.Symbol(null,"cnt","cnt",1924510325,null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),new cljs.core.Symbol(null,"number","number",-1084057331,null)], null)),cljs.core.with_meta(new cljs.core.Symbol(null,"dirty","dirty",-1924882488,null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),new cljs.core.Symbol(null,"boolean","boolean",-278886877,null)], null)),cljs.core.with_meta(new cljs.core.Symbol(null,"cached-seq","cached-seq",1369780142,null),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"tag","tag",-1290361223),new cljs.core.Symbol(null,"ISeq","ISeq",1517365813,null),new cljs.core.Keyword(null,"unsynchronized-mutable","unsynchronized-mutable",-164143950),true], null))], null);
}));

(instaparse.auto_flatten_seq.AutoFlattenSeq.cljs$lang$type = true);

(instaparse.auto_flatten_seq.AutoFlattenSeq.cljs$lang$ctorStr = "instaparse.auto-flatten-seq/AutoFlattenSeq");

(instaparse.auto_flatten_seq.AutoFlattenSeq.cljs$lang$ctorPrWriter = (function (this__5287__auto__,writer__5288__auto__,opt__5289__auto__){
return cljs.core._write(writer__5288__auto__,"instaparse.auto-flatten-seq/AutoFlattenSeq");
}));

/**
 * Positional factory function for instaparse.auto-flatten-seq/AutoFlattenSeq.
 */
instaparse.auto_flatten_seq.__GT_AutoFlattenSeq = (function instaparse$auto_flatten_seq$__GT_AutoFlattenSeq(v,premix_hashcode,hashcode,cnt,dirty,cached_seq){
return (new instaparse.auto_flatten_seq.AutoFlattenSeq(v,premix_hashcode,hashcode,cnt,dirty,cached_seq));
});

instaparse.auto_flatten_seq.hash_cat = (function instaparse$auto_flatten_seq$hash_cat(v1,v2){
var c = cljs.core.count(v2);
var e = (instaparse.auto_flatten_seq.expt((31),c) | (0));
return (cljs.core.imul(e,v1.premix_hashcode) + (v2.premix_hashcode - e));
});
/**
 * Returns the partially calculated hash code, still requires a call to mix-collection-hash
 */
instaparse.auto_flatten_seq.hash_ordered_coll_without_mix = (function instaparse$auto_flatten_seq$hash_ordered_coll_without_mix(var_args){
var G__133948 = arguments.length;
switch (G__133948) {
case 1:
return instaparse.auto_flatten_seq.hash_ordered_coll_without_mix.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return instaparse.auto_flatten_seq.hash_ordered_coll_without_mix.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(instaparse.auto_flatten_seq.hash_ordered_coll_without_mix.cljs$core$IFn$_invoke$arity$1 = (function (coll){
return instaparse.auto_flatten_seq.hash_ordered_coll_without_mix.cljs$core$IFn$_invoke$arity$2((1),coll);
}));

(instaparse.auto_flatten_seq.hash_ordered_coll_without_mix.cljs$core$IFn$_invoke$arity$2 = (function (existing_unmixed_hash,coll){
var unmixed_hash = existing_unmixed_hash;
var coll__$1 = cljs.core.seq(coll);
while(true){
if((!((coll__$1 == null)))){
var G__134034 = ((cljs.core.imul((31),unmixed_hash) + cljs.core.hash(cljs.core.first(coll__$1))) | (0));
var G__134035 = cljs.core.next(coll__$1);
unmixed_hash = G__134034;
coll__$1 = G__134035;
continue;
} else {
return unmixed_hash;
}
break;
}
}));

(instaparse.auto_flatten_seq.hash_ordered_coll_without_mix.cljs$lang$maxFixedArity = 2);

(instaparse.auto_flatten_seq.AutoFlattenSeq.prototype.cljs$core$IPrintWithWriter$ = cljs.core.PROTOCOL_SENTINEL);

(instaparse.auto_flatten_seq.AutoFlattenSeq.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = (function (afs,writer,opts){
var afs__$1 = this;
return cljs.core._pr_writer(cljs.core.seq(afs__$1),writer,opts);
}));
instaparse.auto_flatten_seq.auto_flatten_seq = (function instaparse$auto_flatten_seq$auto_flatten_seq(v){
var v__$1 = cljs.core.vec(v);
return (new instaparse.auto_flatten_seq.AutoFlattenSeq(v__$1,instaparse.auto_flatten_seq.hash_ordered_coll_without_mix.cljs$core$IFn$_invoke$arity$1(v__$1),cljs.core.hash(v__$1),cljs.core.count(v__$1),false,null));
});
instaparse.auto_flatten_seq.EMPTY = instaparse.auto_flatten_seq.auto_flatten_seq(cljs.core.PersistentVector.EMPTY);
instaparse.auto_flatten_seq.afs_QMARK_ = (function instaparse$auto_flatten_seq$afs_QMARK_(s){
return (s instanceof instaparse.auto_flatten_seq.AutoFlattenSeq);
});
instaparse.auto_flatten_seq.true_count = (function instaparse$auto_flatten_seq$true_count(v){
if(instaparse.auto_flatten_seq.afs_QMARK_(v)){
return cljs.core.count(v.v);
} else {
return cljs.core.count(v);
}
});
instaparse.auto_flatten_seq.flat_vec_helper = (function instaparse$auto_flatten_seq$flat_vec_helper(acc,v){
while(true){
var temp__5802__auto__ = cljs.core.seq(v);
if(temp__5802__auto__){
var s = temp__5802__auto__;
var fst = cljs.core.first(v);
if(instaparse.auto_flatten_seq.afs_QMARK_(fst)){
var G__134040 = (instaparse.auto_flatten_seq.flat_vec_helper.cljs$core$IFn$_invoke$arity$2 ? instaparse.auto_flatten_seq.flat_vec_helper.cljs$core$IFn$_invoke$arity$2(acc,fst) : instaparse.auto_flatten_seq.flat_vec_helper.call(null,acc,fst));
var G__134041 = cljs.core.next(v);
acc = G__134040;
v = G__134041;
continue;
} else {
var G__134042 = cljs.core.conj_BANG_.cljs$core$IFn$_invoke$arity$2(acc,fst);
var G__134043 = cljs.core.next(v);
acc = G__134042;
v = G__134043;
continue;
}
} else {
return acc;
}
break;
}
});
/**
 * Turns deep vector (like the vector inside of FlattenOnDemandVector) into a flat vec
 */
instaparse.auto_flatten_seq.flat_vec = (function instaparse$auto_flatten_seq$flat_vec(v){
return cljs.core.persistent_BANG_(instaparse.auto_flatten_seq.flat_vec_helper(cljs.core.transient$(cljs.core.PersistentVector.EMPTY),v));
});

/**
 * @interface
 */
instaparse.auto_flatten_seq.GetVec = function(){};

var instaparse$auto_flatten_seq$GetVec$get_vec$dyn_134044 = (function (self){
var x__5350__auto__ = (((self == null))?null:self);
var m__5351__auto__ = (instaparse.auto_flatten_seq.get_vec[goog.typeOf(x__5350__auto__)]);
if((!((m__5351__auto__ == null)))){
return (m__5351__auto__.cljs$core$IFn$_invoke$arity$1 ? m__5351__auto__.cljs$core$IFn$_invoke$arity$1(self) : m__5351__auto__.call(null,self));
} else {
var m__5349__auto__ = (instaparse.auto_flatten_seq.get_vec["_"]);
if((!((m__5349__auto__ == null)))){
return (m__5349__auto__.cljs$core$IFn$_invoke$arity$1 ? m__5349__auto__.cljs$core$IFn$_invoke$arity$1(self) : m__5349__auto__.call(null,self));
} else {
throw cljs.core.missing_protocol("GetVec.get-vec",self);
}
}
});
instaparse.auto_flatten_seq.get_vec = (function instaparse$auto_flatten_seq$get_vec(self){
if((((!((self == null)))) && ((!((self.instaparse$auto_flatten_seq$GetVec$get_vec$arity$1 == null)))))){
return self.instaparse$auto_flatten_seq$GetVec$get_vec$arity$1(self);
} else {
return instaparse$auto_flatten_seq$GetVec$get_vec$dyn_134044(self);
}
});


/**
* @constructor
 * @implements {cljs.core.IIndexed}
 * @implements {cljs.core.IVector}
 * @implements {cljs.core.IReversible}
 * @implements {cljs.core.IKVReduce}
 * @implements {cljs.core.IEquiv}
 * @implements {cljs.core.IHash}
 * @implements {cljs.core.IFn}
 * @implements {cljs.core.ICollection}
 * @implements {cljs.core.IEmptyableCollection}
 * @implements {cljs.core.ICounted}
 * @implements {instaparse.auto_flatten_seq.GetVec}
 * @implements {cljs.core.ISeqable}
 * @implements {cljs.core.IMeta}
 * @implements {cljs.core.IStack}
 * @implements {cljs.core.IComparable}
 * @implements {cljs.core.ISequential}
 * @implements {cljs.core.IWithMeta}
 * @implements {cljs.core.IAssociative}
 * @implements {cljs.core.ILookup}
*/
instaparse.auto_flatten_seq.FlattenOnDemandVector = (function (v,hashcode,cnt,flat){
this.v = v;
this.hashcode = hashcode;
this.cnt = cnt;
this.flat = flat;
this.cljs$lang$protocol_mask$partition0$ = 167142175;
this.cljs$lang$protocol_mask$partition1$ = 2048;
});
(instaparse.auto_flatten_seq.FlattenOnDemandVector.prototype.toString = (function (){
var self__ = this;
var self = this;
return cljs.core.pr_str_STAR_(self.instaparse$auto_flatten_seq$GetVec$get_vec$arity$1(null));
}));

(instaparse.auto_flatten_seq.FlattenOnDemandVector.prototype.cljs$core$ILookup$_lookup$arity$2 = (function (self,key){
var self__ = this;
var self__$1 = this;
return self__$1.instaparse$auto_flatten_seq$GetVec$get_vec$arity$1(null).cljs$core$ILookup$_lookup$arity$2(null,key);
}));

(instaparse.auto_flatten_seq.FlattenOnDemandVector.prototype.cljs$core$ILookup$_lookup$arity$3 = (function (self,key,not_found){
var self__ = this;
var self__$1 = this;
return self__$1.instaparse$auto_flatten_seq$GetVec$get_vec$arity$1(null).cljs$core$ILookup$_lookup$arity$3(null,key,not_found);
}));

(instaparse.auto_flatten_seq.FlattenOnDemandVector.prototype.instaparse$auto_flatten_seq$GetVec$ = cljs.core.PROTOCOL_SENTINEL);

(instaparse.auto_flatten_seq.FlattenOnDemandVector.prototype.instaparse$auto_flatten_seq$GetVec$get_vec$arity$1 = (function (self){
var self__ = this;
var self__$1 = this;
if(cljs.core.not(cljs.core.deref(self__.flat))){
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$2(self__.flat,(function (_){
return cljs.core.with_meta(instaparse.auto_flatten_seq.flat_vec(cljs.core.deref(self__.v)),cljs.core.meta(cljs.core.deref(self__.v)));
}));

cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$2(self__.v,(function (_){
return null;
}));
} else {
}

return cljs.core.deref(self__.flat);
}));

(instaparse.auto_flatten_seq.FlattenOnDemandVector.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = (function (self,f,init){
var self__ = this;
var self__$1 = this;
return self__$1.instaparse$auto_flatten_seq$GetVec$get_vec$arity$1(null).cljs$core$IKVReduce$_kv_reduce$arity$3(null,f,init);
}));

(instaparse.auto_flatten_seq.FlattenOnDemandVector.prototype.cljs$core$IIndexed$_nth$arity$2 = (function (self,i){
var self__ = this;
var self__$1 = this;
return self__$1.instaparse$auto_flatten_seq$GetVec$get_vec$arity$1(null).cljs$core$IIndexed$_nth$arity$2(null,i);
}));

(instaparse.auto_flatten_seq.FlattenOnDemandVector.prototype.cljs$core$IIndexed$_nth$arity$3 = (function (self,i,not_found){
var self__ = this;
var self__$1 = this;
return self__$1.instaparse$auto_flatten_seq$GetVec$get_vec$arity$1(null).cljs$core$IIndexed$_nth$arity$3(null,i,not_found);
}));

(instaparse.auto_flatten_seq.FlattenOnDemandVector.prototype.cljs$core$IVector$_assoc_n$arity$3 = (function (self,i,val){
var self__ = this;
var self__$1 = this;
return self__$1.instaparse$auto_flatten_seq$GetVec$get_vec$arity$1(null).cljs$core$IVector$_assoc_n$arity$3(null,i,val);
}));

(instaparse.auto_flatten_seq.FlattenOnDemandVector.prototype.cljs$core$IMeta$_meta$arity$1 = (function (self){
var self__ = this;
var self__$1 = this;
if(cljs.core.truth_(cljs.core.deref(self__.flat))){
return cljs.core.meta(cljs.core.deref(self__.flat));
} else {
return cljs.core.meta(cljs.core.deref(self__.v));
}
}));

(instaparse.auto_flatten_seq.FlattenOnDemandVector.prototype.cljs$core$ICounted$_count$arity$1 = (function (self){
var self__ = this;
var self__$1 = this;
return self__.cnt;
}));

(instaparse.auto_flatten_seq.FlattenOnDemandVector.prototype.cljs$core$IStack$_peek$arity$1 = (function (self){
var self__ = this;
var self__$1 = this;
return self__$1.instaparse$auto_flatten_seq$GetVec$get_vec$arity$1(null).cljs$core$IStack$_peek$arity$1(null);
}));

(instaparse.auto_flatten_seq.FlattenOnDemandVector.prototype.cljs$core$IStack$_pop$arity$1 = (function (self){
var self__ = this;
var self__$1 = this;
return self__$1.instaparse$auto_flatten_seq$GetVec$get_vec$arity$1(null).cljs$core$IStack$_pop$arity$1(null);
}));

(instaparse.auto_flatten_seq.FlattenOnDemandVector.prototype.cljs$core$IReversible$_rseq$arity$1 = (function (self){
var self__ = this;
var self__$1 = this;
if((self__.cnt > (0))){
return cljs.core.rseq(self__$1.instaparse$auto_flatten_seq$GetVec$get_vec$arity$1(null));
} else {
return null;
}
}));

(instaparse.auto_flatten_seq.FlattenOnDemandVector.prototype.cljs$core$IHash$_hash$arity$1 = (function (self){
var self__ = this;
var self__$1 = this;
return self__.hashcode;
}));

(instaparse.auto_flatten_seq.FlattenOnDemandVector.prototype.cljs$core$IEquiv$_equiv$arity$2 = (function (self,other){
var self__ = this;
var self__$1 = this;
return ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(self__.hashcode,cljs.core.hash(other))) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(self__.cnt,cljs.core.count(other))) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(self__$1.instaparse$auto_flatten_seq$GetVec$get_vec$arity$1(null),other)))));
}));

(instaparse.auto_flatten_seq.FlattenOnDemandVector.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = (function (self){
var self__ = this;
var self__$1 = this;
return cljs.core.with_meta(cljs.core.PersistentVector.EMPTY,cljs.core.meta(self__$1));
}));

(instaparse.auto_flatten_seq.FlattenOnDemandVector.prototype.cljs$core$IAssociative$_assoc$arity$3 = (function (self,i,val){
var self__ = this;
var self__$1 = this;
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(self__$1.instaparse$auto_flatten_seq$GetVec$get_vec$arity$1(null),i,val);
}));

(instaparse.auto_flatten_seq.FlattenOnDemandVector.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = (function (self,k){
var self__ = this;
var self__$1 = this;
return self__$1.instaparse$auto_flatten_seq$GetVec$get_vec$arity$1(null).cljs$core$IAssociative$_contains_key_QMARK_$arity$2(null,k);
}));

(instaparse.auto_flatten_seq.FlattenOnDemandVector.prototype.cljs$core$ISeqable$_seq$arity$1 = (function (self){
var self__ = this;
var self__$1 = this;
return cljs.core.seq(self__$1.instaparse$auto_flatten_seq$GetVec$get_vec$arity$1(null));
}));

(instaparse.auto_flatten_seq.FlattenOnDemandVector.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = (function (self,metamap){
var self__ = this;
var self__$1 = this;
if(cljs.core.truth_(cljs.core.deref(self__.flat))){
return (new instaparse.auto_flatten_seq.FlattenOnDemandVector(cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.deref(self__.v)),self__.hashcode,self__.cnt,cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.with_meta(cljs.core.deref(self__.flat),metamap))));
} else {
return (new instaparse.auto_flatten_seq.FlattenOnDemandVector(cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.with_meta(cljs.core.deref(self__.v),metamap)),self__.hashcode,self__.cnt,cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.deref(self__.flat))));
}
}));

(instaparse.auto_flatten_seq.FlattenOnDemandVector.prototype.cljs$core$ICollection$_conj$arity$2 = (function (self,obj){
var self__ = this;
var self__$1 = this;
return cljs.core.conj.cljs$core$IFn$_invoke$arity$2(self__$1.instaparse$auto_flatten_seq$GetVec$get_vec$arity$1(null),obj);
}));

(instaparse.auto_flatten_seq.FlattenOnDemandVector.prototype.call = (function (unused__11818__auto__){
var self__ = this;
var self__ = this;
var G__133974 = (arguments.length - (1));
switch (G__133974) {
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

(instaparse.auto_flatten_seq.FlattenOnDemandVector.prototype.apply = (function (self__,args133962){
var self__ = this;
var self____$1 = this;
return self____$1.call.apply(self____$1,[self____$1].concat(cljs.core.aclone(args133962)));
}));

(instaparse.auto_flatten_seq.FlattenOnDemandVector.prototype.cljs$core$IFn$_invoke$arity$1 = (function (arg){
var self__ = this;
var self = this;
return self.instaparse$auto_flatten_seq$GetVec$get_vec$arity$1(null).cljs$core$IFn$_invoke$arity$2(null,arg);
}));

(instaparse.auto_flatten_seq.FlattenOnDemandVector.prototype.cljs$core$IFn$_invoke$arity$2 = (function (arg,not_found){
var self__ = this;
var self = this;
return self.instaparse$auto_flatten_seq$GetVec$get_vec$arity$1(null).cljs$core$IFn$_invoke$arity$3(null,arg,not_found);
}));

(instaparse.auto_flatten_seq.FlattenOnDemandVector.prototype.cljs$core$IComparable$_compare$arity$2 = (function (self,that){
var self__ = this;
var self__$1 = this;
return cljs.core._compare(self__$1.instaparse$auto_flatten_seq$GetVec$get_vec$arity$1(null),that);
}));

(instaparse.auto_flatten_seq.FlattenOnDemandVector.getBasis = (function (){
return new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"v","v",1661996586,null),cljs.core.with_meta(new cljs.core.Symbol(null,"hashcode","hashcode",1350412446,null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),new cljs.core.Symbol(null,"number","number",-1084057331,null)], null)),cljs.core.with_meta(new cljs.core.Symbol(null,"cnt","cnt",1924510325,null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),new cljs.core.Symbol(null,"number","number",-1084057331,null)], null)),new cljs.core.Symbol(null,"flat","flat",-2076841507,null)], null);
}));

(instaparse.auto_flatten_seq.FlattenOnDemandVector.cljs$lang$type = true);

(instaparse.auto_flatten_seq.FlattenOnDemandVector.cljs$lang$ctorStr = "instaparse.auto-flatten-seq/FlattenOnDemandVector");

(instaparse.auto_flatten_seq.FlattenOnDemandVector.cljs$lang$ctorPrWriter = (function (this__5287__auto__,writer__5288__auto__,opt__5289__auto__){
return cljs.core._write(writer__5288__auto__,"instaparse.auto-flatten-seq/FlattenOnDemandVector");
}));

/**
 * Positional factory function for instaparse.auto-flatten-seq/FlattenOnDemandVector.
 */
instaparse.auto_flatten_seq.__GT_FlattenOnDemandVector = (function instaparse$auto_flatten_seq$__GT_FlattenOnDemandVector(v,hashcode,cnt,flat){
return (new instaparse.auto_flatten_seq.FlattenOnDemandVector(v,hashcode,cnt,flat));
});

(instaparse.auto_flatten_seq.FlattenOnDemandVector.prototype.cljs$core$IPrintWithWriter$ = cljs.core.PROTOCOL_SENTINEL);

(instaparse.auto_flatten_seq.FlattenOnDemandVector.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = (function (v,writer,opts){
var v__$1 = this;
return cljs.core._pr_writer(v__$1.instaparse$auto_flatten_seq$GetVec$get_vec$arity$1(null),writer,opts);
}));
instaparse.auto_flatten_seq.convert_afs_to_vec = (function instaparse$auto_flatten_seq$convert_afs_to_vec(afs){
if(cljs.core.truth_(afs.dirty)){
if(cljs.core.truth_(afs.instaparse$auto_flatten_seq$ConjFlat$cached_QMARK_$arity$1(null))){
return cljs.core.vec(cljs.core.seq(afs));
} else {
return (new instaparse.auto_flatten_seq.FlattenOnDemandVector(cljs.core.atom.cljs$core$IFn$_invoke$arity$1(afs.v),afs.hashcode,afs.cnt,cljs.core.atom.cljs$core$IFn$_invoke$arity$1(null)));
}
} else {
return afs.v;

}
});

//# sourceMappingURL=instaparse.auto_flatten_seq.js.map
