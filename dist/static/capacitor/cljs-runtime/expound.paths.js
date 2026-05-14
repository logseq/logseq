goog.provide('expound.paths');
cljs.spec.alpha.def_impl(new cljs.core.Keyword("expound","path","expound/path",-1026376555),cljs.core.list(new cljs.core.Symbol("cljs.spec.alpha","nilable","cljs.spec.alpha/nilable",1628308748,null),new cljs.core.Symbol("cljs.core","sequential?","cljs.core/sequential?",1777854658,null)),cljs.spec.alpha.nilable_impl(new cljs.core.Symbol("cljs.core","sequential?","cljs.core/sequential?",1777854658,null),cljs.core.sequential_QMARK_,null));

/**
* @constructor
 * @implements {cljs.core.IRecord}
 * @implements {cljs.core.IKVReduce}
 * @implements {cljs.core.IEquiv}
 * @implements {cljs.core.IHash}
 * @implements {cljs.core.ICollection}
 * @implements {cljs.core.ICounted}
 * @implements {cljs.core.ISeqable}
 * @implements {cljs.core.IMeta}
 * @implements {cljs.core.ICloneable}
 * @implements {cljs.core.IPrintWithWriter}
 * @implements {cljs.core.IIterable}
 * @implements {cljs.core.IWithMeta}
 * @implements {cljs.core.IAssociative}
 * @implements {cljs.core.IMap}
 * @implements {cljs.core.ILookup}
*/
expound.paths.KeyPathSegment = (function (key,__meta,__extmap,__hash){
this.key = key;
this.__meta = __meta;
this.__extmap = __extmap;
this.__hash = __hash;
this.cljs$lang$protocol_mask$partition0$ = 2230716170;
this.cljs$lang$protocol_mask$partition1$ = 139264;
});
(expound.paths.KeyPathSegment.prototype.cljs$core$ILookup$_lookup$arity$2 = (function (this__5300__auto__,k__5301__auto__){
var self__ = this;
var this__5300__auto____$1 = this;
return this__5300__auto____$1.cljs$core$ILookup$_lookup$arity$3(null,k__5301__auto__,null);
}));

(expound.paths.KeyPathSegment.prototype.cljs$core$ILookup$_lookup$arity$3 = (function (this__5302__auto__,k99266,else__5303__auto__){
var self__ = this;
var this__5302__auto____$1 = this;
var G__99270 = k99266;
var G__99270__$1 = (((G__99270 instanceof cljs.core.Keyword))?G__99270.fqn:null);
switch (G__99270__$1) {
case "key":
return self__.key;

break;
default:
return cljs.core.get.cljs$core$IFn$_invoke$arity$3(self__.__extmap,k99266,else__5303__auto__);

}
}));

(expound.paths.KeyPathSegment.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = (function (this__5320__auto__,f__5321__auto__,init__5322__auto__){
var self__ = this;
var this__5320__auto____$1 = this;
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (ret__5323__auto__,p__99271){
var vec__99272 = p__99271;
var k__5324__auto__ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__99272,(0),null);
var v__5325__auto__ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__99272,(1),null);
return (f__5321__auto__.cljs$core$IFn$_invoke$arity$3 ? f__5321__auto__.cljs$core$IFn$_invoke$arity$3(ret__5323__auto__,k__5324__auto__,v__5325__auto__) : f__5321__auto__.call(null,ret__5323__auto__,k__5324__auto__,v__5325__auto__));
}),init__5322__auto__,this__5320__auto____$1);
}));

(expound.paths.KeyPathSegment.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = (function (this__5315__auto__,writer__5316__auto__,opts__5317__auto__){
var self__ = this;
var this__5315__auto____$1 = this;
var pr_pair__5318__auto__ = (function (keyval__5319__auto__){
return cljs.core.pr_sequential_writer(writer__5316__auto__,cljs.core.pr_writer,""," ","",opts__5317__auto__,keyval__5319__auto__);
});
return cljs.core.pr_sequential_writer(writer__5316__auto__,pr_pair__5318__auto__,"#expound.paths.KeyPathSegment{",", ","}",opts__5317__auto__,cljs.core.concat.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [(new cljs.core.PersistentVector(null,2,(5),cljs.core.PersistentVector.EMPTY_NODE,[new cljs.core.Keyword(null,"key","key",-1516042587),self__.key],null))], null),self__.__extmap));
}));

(expound.paths.KeyPathSegment.prototype.cljs$core$IIterable$_iterator$arity$1 = (function (G__99265){
var self__ = this;
var G__99265__$1 = this;
return (new cljs.core.RecordIter((0),G__99265__$1,1,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"key","key",-1516042587)], null),(cljs.core.truth_(self__.__extmap)?cljs.core._iterator(self__.__extmap):cljs.core.nil_iter())));
}));

(expound.paths.KeyPathSegment.prototype.cljs$core$IMeta$_meta$arity$1 = (function (this__5298__auto__){
var self__ = this;
var this__5298__auto____$1 = this;
return self__.__meta;
}));

(expound.paths.KeyPathSegment.prototype.cljs$core$ICloneable$_clone$arity$1 = (function (this__5295__auto__){
var self__ = this;
var this__5295__auto____$1 = this;
return (new expound.paths.KeyPathSegment(self__.key,self__.__meta,self__.__extmap,self__.__hash));
}));

(expound.paths.KeyPathSegment.prototype.cljs$core$ICounted$_count$arity$1 = (function (this__5304__auto__){
var self__ = this;
var this__5304__auto____$1 = this;
return (1 + cljs.core.count(self__.__extmap));
}));

(expound.paths.KeyPathSegment.prototype.cljs$core$IHash$_hash$arity$1 = (function (this__5296__auto__){
var self__ = this;
var this__5296__auto____$1 = this;
var h__5111__auto__ = self__.__hash;
if((!((h__5111__auto__ == null)))){
return h__5111__auto__;
} else {
var h__5111__auto____$1 = (function (coll__5297__auto__){
return (233526946 ^ cljs.core.hash_unordered_coll(coll__5297__auto__));
})(this__5296__auto____$1);
(self__.__hash = h__5111__auto____$1);

return h__5111__auto____$1;
}
}));

(expound.paths.KeyPathSegment.prototype.cljs$core$IEquiv$_equiv$arity$2 = (function (this99267,other99268){
var self__ = this;
var this99267__$1 = this;
return (((!((other99268 == null)))) && ((((this99267__$1.constructor === other99268.constructor)) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(this99267__$1.key,other99268.key)) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(this99267__$1.__extmap,other99268.__extmap)))))));
}));

(expound.paths.KeyPathSegment.prototype.cljs$core$IMap$_dissoc$arity$2 = (function (this__5310__auto__,k__5311__auto__){
var self__ = this;
var this__5310__auto____$1 = this;
if(cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"key","key",-1516042587),null], null), null),k__5311__auto__)){
return cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(cljs.core._with_meta(cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,this__5310__auto____$1),self__.__meta),k__5311__auto__);
} else {
return (new expound.paths.KeyPathSegment(self__.key,self__.__meta,cljs.core.not_empty(cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(self__.__extmap,k__5311__auto__)),null));
}
}));

(expound.paths.KeyPathSegment.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = (function (this__5307__auto__,k99266){
var self__ = this;
var this__5307__auto____$1 = this;
var G__99275 = k99266;
var G__99275__$1 = (((G__99275 instanceof cljs.core.Keyword))?G__99275.fqn:null);
switch (G__99275__$1) {
case "key":
return true;

break;
default:
return cljs.core.contains_QMARK_(self__.__extmap,k99266);

}
}));

(expound.paths.KeyPathSegment.prototype.cljs$core$IAssociative$_assoc$arity$3 = (function (this__5308__auto__,k__5309__auto__,G__99265){
var self__ = this;
var this__5308__auto____$1 = this;
var pred__99276 = cljs.core.keyword_identical_QMARK_;
var expr__99277 = k__5309__auto__;
if(cljs.core.truth_((pred__99276.cljs$core$IFn$_invoke$arity$2 ? pred__99276.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"key","key",-1516042587),expr__99277) : pred__99276.call(null,new cljs.core.Keyword(null,"key","key",-1516042587),expr__99277)))){
return (new expound.paths.KeyPathSegment(G__99265,self__.__meta,self__.__extmap,null));
} else {
return (new expound.paths.KeyPathSegment(self__.key,self__.__meta,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(self__.__extmap,k__5309__auto__,G__99265),null));
}
}));

(expound.paths.KeyPathSegment.prototype.cljs$core$ISeqable$_seq$arity$1 = (function (this__5313__auto__){
var self__ = this;
var this__5313__auto____$1 = this;
return cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [(new cljs.core.MapEntry(new cljs.core.Keyword(null,"key","key",-1516042587),self__.key,null))], null),self__.__extmap));
}));

(expound.paths.KeyPathSegment.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = (function (this__5299__auto__,G__99265){
var self__ = this;
var this__5299__auto____$1 = this;
return (new expound.paths.KeyPathSegment(self__.key,G__99265,self__.__extmap,self__.__hash));
}));

(expound.paths.KeyPathSegment.prototype.cljs$core$ICollection$_conj$arity$2 = (function (this__5305__auto__,entry__5306__auto__){
var self__ = this;
var this__5305__auto____$1 = this;
if(cljs.core.vector_QMARK_(entry__5306__auto__)){
return this__5305__auto____$1.cljs$core$IAssociative$_assoc$arity$3(null,cljs.core._nth(entry__5306__auto__,(0)),cljs.core._nth(entry__5306__auto__,(1)));
} else {
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3(cljs.core._conj,this__5305__auto____$1,entry__5306__auto__);
}
}));

(expound.paths.KeyPathSegment.getBasis = (function (){
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"key","key",124488940,null)], null);
}));

(expound.paths.KeyPathSegment.cljs$lang$type = true);

(expound.paths.KeyPathSegment.cljs$lang$ctorPrSeq = (function (this__5346__auto__){
return (new cljs.core.List(null,"expound.paths/KeyPathSegment",null,(1),null));
}));

(expound.paths.KeyPathSegment.cljs$lang$ctorPrWriter = (function (this__5346__auto__,writer__5347__auto__){
return cljs.core._write(writer__5347__auto__,"expound.paths/KeyPathSegment");
}));

/**
 * Positional factory function for expound.paths/KeyPathSegment.
 */
expound.paths.__GT_KeyPathSegment = (function expound$paths$__GT_KeyPathSegment(key){
return (new expound.paths.KeyPathSegment(key,null,null,null));
});

/**
 * Factory function for expound.paths/KeyPathSegment, taking a map of keywords to field values.
 */
expound.paths.map__GT_KeyPathSegment = (function expound$paths$map__GT_KeyPathSegment(G__99269){
var extmap__5342__auto__ = (function (){var G__99279 = cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(G__99269,new cljs.core.Keyword(null,"key","key",-1516042587));
if(cljs.core.record_QMARK_(G__99269)){
return cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,G__99279);
} else {
return G__99279;
}
})();
return (new expound.paths.KeyPathSegment(new cljs.core.Keyword(null,"key","key",-1516042587).cljs$core$IFn$_invoke$arity$1(G__99269),null,cljs.core.not_empty(extmap__5342__auto__),null));
});


/**
* @constructor
 * @implements {cljs.core.IRecord}
 * @implements {cljs.core.IKVReduce}
 * @implements {cljs.core.IEquiv}
 * @implements {cljs.core.IHash}
 * @implements {cljs.core.ICollection}
 * @implements {cljs.core.ICounted}
 * @implements {cljs.core.ISeqable}
 * @implements {cljs.core.IMeta}
 * @implements {cljs.core.ICloneable}
 * @implements {cljs.core.IPrintWithWriter}
 * @implements {cljs.core.IIterable}
 * @implements {cljs.core.IWithMeta}
 * @implements {cljs.core.IAssociative}
 * @implements {cljs.core.IMap}
 * @implements {cljs.core.ILookup}
*/
expound.paths.KeyValuePathSegment = (function (idx,__meta,__extmap,__hash){
this.idx = idx;
this.__meta = __meta;
this.__extmap = __extmap;
this.__hash = __hash;
this.cljs$lang$protocol_mask$partition0$ = 2230716170;
this.cljs$lang$protocol_mask$partition1$ = 139264;
});
(expound.paths.KeyValuePathSegment.prototype.cljs$core$ILookup$_lookup$arity$2 = (function (this__5300__auto__,k__5301__auto__){
var self__ = this;
var this__5300__auto____$1 = this;
return this__5300__auto____$1.cljs$core$ILookup$_lookup$arity$3(null,k__5301__auto__,null);
}));

(expound.paths.KeyValuePathSegment.prototype.cljs$core$ILookup$_lookup$arity$3 = (function (this__5302__auto__,k99281,else__5303__auto__){
var self__ = this;
var this__5302__auto____$1 = this;
var G__99285 = k99281;
var G__99285__$1 = (((G__99285 instanceof cljs.core.Keyword))?G__99285.fqn:null);
switch (G__99285__$1) {
case "idx":
return self__.idx;

break;
default:
return cljs.core.get.cljs$core$IFn$_invoke$arity$3(self__.__extmap,k99281,else__5303__auto__);

}
}));

(expound.paths.KeyValuePathSegment.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = (function (this__5320__auto__,f__5321__auto__,init__5322__auto__){
var self__ = this;
var this__5320__auto____$1 = this;
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (ret__5323__auto__,p__99286){
var vec__99287 = p__99286;
var k__5324__auto__ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__99287,(0),null);
var v__5325__auto__ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__99287,(1),null);
return (f__5321__auto__.cljs$core$IFn$_invoke$arity$3 ? f__5321__auto__.cljs$core$IFn$_invoke$arity$3(ret__5323__auto__,k__5324__auto__,v__5325__auto__) : f__5321__auto__.call(null,ret__5323__auto__,k__5324__auto__,v__5325__auto__));
}),init__5322__auto__,this__5320__auto____$1);
}));

(expound.paths.KeyValuePathSegment.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = (function (this__5315__auto__,writer__5316__auto__,opts__5317__auto__){
var self__ = this;
var this__5315__auto____$1 = this;
var pr_pair__5318__auto__ = (function (keyval__5319__auto__){
return cljs.core.pr_sequential_writer(writer__5316__auto__,cljs.core.pr_writer,""," ","",opts__5317__auto__,keyval__5319__auto__);
});
return cljs.core.pr_sequential_writer(writer__5316__auto__,pr_pair__5318__auto__,"#expound.paths.KeyValuePathSegment{",", ","}",opts__5317__auto__,cljs.core.concat.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [(new cljs.core.PersistentVector(null,2,(5),cljs.core.PersistentVector.EMPTY_NODE,[new cljs.core.Keyword(null,"idx","idx",1053688473),self__.idx],null))], null),self__.__extmap));
}));

(expound.paths.KeyValuePathSegment.prototype.cljs$core$IIterable$_iterator$arity$1 = (function (G__99280){
var self__ = this;
var G__99280__$1 = this;
return (new cljs.core.RecordIter((0),G__99280__$1,1,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"idx","idx",1053688473)], null),(cljs.core.truth_(self__.__extmap)?cljs.core._iterator(self__.__extmap):cljs.core.nil_iter())));
}));

(expound.paths.KeyValuePathSegment.prototype.cljs$core$IMeta$_meta$arity$1 = (function (this__5298__auto__){
var self__ = this;
var this__5298__auto____$1 = this;
return self__.__meta;
}));

(expound.paths.KeyValuePathSegment.prototype.cljs$core$ICloneable$_clone$arity$1 = (function (this__5295__auto__){
var self__ = this;
var this__5295__auto____$1 = this;
return (new expound.paths.KeyValuePathSegment(self__.idx,self__.__meta,self__.__extmap,self__.__hash));
}));

(expound.paths.KeyValuePathSegment.prototype.cljs$core$ICounted$_count$arity$1 = (function (this__5304__auto__){
var self__ = this;
var this__5304__auto____$1 = this;
return (1 + cljs.core.count(self__.__extmap));
}));

(expound.paths.KeyValuePathSegment.prototype.cljs$core$IHash$_hash$arity$1 = (function (this__5296__auto__){
var self__ = this;
var this__5296__auto____$1 = this;
var h__5111__auto__ = self__.__hash;
if((!((h__5111__auto__ == null)))){
return h__5111__auto__;
} else {
var h__5111__auto____$1 = (function (coll__5297__auto__){
return (1269438429 ^ cljs.core.hash_unordered_coll(coll__5297__auto__));
})(this__5296__auto____$1);
(self__.__hash = h__5111__auto____$1);

return h__5111__auto____$1;
}
}));

(expound.paths.KeyValuePathSegment.prototype.cljs$core$IEquiv$_equiv$arity$2 = (function (this99282,other99283){
var self__ = this;
var this99282__$1 = this;
return (((!((other99283 == null)))) && ((((this99282__$1.constructor === other99283.constructor)) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(this99282__$1.idx,other99283.idx)) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(this99282__$1.__extmap,other99283.__extmap)))))));
}));

(expound.paths.KeyValuePathSegment.prototype.cljs$core$IMap$_dissoc$arity$2 = (function (this__5310__auto__,k__5311__auto__){
var self__ = this;
var this__5310__auto____$1 = this;
if(cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"idx","idx",1053688473),null], null), null),k__5311__auto__)){
return cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(cljs.core._with_meta(cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,this__5310__auto____$1),self__.__meta),k__5311__auto__);
} else {
return (new expound.paths.KeyValuePathSegment(self__.idx,self__.__meta,cljs.core.not_empty(cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(self__.__extmap,k__5311__auto__)),null));
}
}));

(expound.paths.KeyValuePathSegment.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = (function (this__5307__auto__,k99281){
var self__ = this;
var this__5307__auto____$1 = this;
var G__99291 = k99281;
var G__99291__$1 = (((G__99291 instanceof cljs.core.Keyword))?G__99291.fqn:null);
switch (G__99291__$1) {
case "idx":
return true;

break;
default:
return cljs.core.contains_QMARK_(self__.__extmap,k99281);

}
}));

(expound.paths.KeyValuePathSegment.prototype.cljs$core$IAssociative$_assoc$arity$3 = (function (this__5308__auto__,k__5309__auto__,G__99280){
var self__ = this;
var this__5308__auto____$1 = this;
var pred__99292 = cljs.core.keyword_identical_QMARK_;
var expr__99293 = k__5309__auto__;
if(cljs.core.truth_((pred__99292.cljs$core$IFn$_invoke$arity$2 ? pred__99292.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"idx","idx",1053688473),expr__99293) : pred__99292.call(null,new cljs.core.Keyword(null,"idx","idx",1053688473),expr__99293)))){
return (new expound.paths.KeyValuePathSegment(G__99280,self__.__meta,self__.__extmap,null));
} else {
return (new expound.paths.KeyValuePathSegment(self__.idx,self__.__meta,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(self__.__extmap,k__5309__auto__,G__99280),null));
}
}));

(expound.paths.KeyValuePathSegment.prototype.cljs$core$ISeqable$_seq$arity$1 = (function (this__5313__auto__){
var self__ = this;
var this__5313__auto____$1 = this;
return cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [(new cljs.core.MapEntry(new cljs.core.Keyword(null,"idx","idx",1053688473),self__.idx,null))], null),self__.__extmap));
}));

(expound.paths.KeyValuePathSegment.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = (function (this__5299__auto__,G__99280){
var self__ = this;
var this__5299__auto____$1 = this;
return (new expound.paths.KeyValuePathSegment(self__.idx,G__99280,self__.__extmap,self__.__hash));
}));

(expound.paths.KeyValuePathSegment.prototype.cljs$core$ICollection$_conj$arity$2 = (function (this__5305__auto__,entry__5306__auto__){
var self__ = this;
var this__5305__auto____$1 = this;
if(cljs.core.vector_QMARK_(entry__5306__auto__)){
return this__5305__auto____$1.cljs$core$IAssociative$_assoc$arity$3(null,cljs.core._nth(entry__5306__auto__,(0)),cljs.core._nth(entry__5306__auto__,(1)));
} else {
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3(cljs.core._conj,this__5305__auto____$1,entry__5306__auto__);
}
}));

(expound.paths.KeyValuePathSegment.getBasis = (function (){
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"idx","idx",-1600747296,null)], null);
}));

(expound.paths.KeyValuePathSegment.cljs$lang$type = true);

(expound.paths.KeyValuePathSegment.cljs$lang$ctorPrSeq = (function (this__5346__auto__){
return (new cljs.core.List(null,"expound.paths/KeyValuePathSegment",null,(1),null));
}));

(expound.paths.KeyValuePathSegment.cljs$lang$ctorPrWriter = (function (this__5346__auto__,writer__5347__auto__){
return cljs.core._write(writer__5347__auto__,"expound.paths/KeyValuePathSegment");
}));

/**
 * Positional factory function for expound.paths/KeyValuePathSegment.
 */
expound.paths.__GT_KeyValuePathSegment = (function expound$paths$__GT_KeyValuePathSegment(idx){
return (new expound.paths.KeyValuePathSegment(idx,null,null,null));
});

/**
 * Factory function for expound.paths/KeyValuePathSegment, taking a map of keywords to field values.
 */
expound.paths.map__GT_KeyValuePathSegment = (function expound$paths$map__GT_KeyValuePathSegment(G__99284){
var extmap__5342__auto__ = (function (){var G__99297 = cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(G__99284,new cljs.core.Keyword(null,"idx","idx",1053688473));
if(cljs.core.record_QMARK_(G__99284)){
return cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,G__99297);
} else {
return G__99297;
}
})();
return (new expound.paths.KeyValuePathSegment(new cljs.core.Keyword(null,"idx","idx",1053688473).cljs$core$IFn$_invoke$arity$1(G__99284),null,cljs.core.not_empty(extmap__5342__auto__),null));
});

expound.paths.kps_QMARK_ = (function expound$paths$kps_QMARK_(x){
return (x instanceof expound.paths.KeyPathSegment);
});
expound.paths.kvps_QMARK_ = (function expound$paths$kvps_QMARK_(x){
return (x instanceof expound.paths.KeyValuePathSegment);
});
expound.paths.fn_equal = (function expound$paths$fn_equal(x,y){
return ((cljs.core.fn_QMARK_(x)) && (((cljs.core.fn_QMARK_(y)) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([x], 0)),cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([y], 0)))))));
});
expound.paths.both_nan_QMARK_ = (function expound$paths$both_nan_QMARK_(x,y){
var and__5000__auto__ = expound.util.nan_QMARK_(x);
if(cljs.core.truth_(and__5000__auto__)){
return expound.util.nan_QMARK_(y);
} else {
return and__5000__auto__;
}
});
expound.paths.equalish_QMARK_ = (function expound$paths$equalish_QMARK_(x,y){
var or__5002__auto__ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(x,y);
if(or__5002__auto__){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = expound.paths.fn_equal(x,y);
if(or__5002__auto____$1){
return or__5002__auto____$1;
} else {
return expound.paths.both_nan_QMARK_(x,y);
}
}
});
expound.paths.in_with_kps_maps_as_seqs = (function expound$paths$in_with_kps_maps_as_seqs(form,val,in$,in_SINGLEQUOTE_){
var vec__99299 = in$;
var seq__99300 = cljs.core.seq(vec__99299);
var first__99301 = cljs.core.first(seq__99300);
var seq__99300__$1 = cljs.core.next(seq__99300);
var k = first__99301;
var rst = seq__99300__$1;
var vec__99302 = rst;
var seq__99303 = cljs.core.seq(vec__99302);
var first__99304 = cljs.core.first(seq__99303);
var seq__99303__$1 = cljs.core.next(seq__99303);
var idx = first__99304;
var rst2 = seq__99303__$1;
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("expound.paths","not-found","expound.paths/not-found",-195785795),form)){
return new cljs.core.Keyword("expound.paths","not-found","expound.paths/not-found",-195785795);
} else {
if(cljs.core.truth_((function (){var and__5000__auto__ = cljs.core.empty_QMARK_(in$);
if(and__5000__auto__){
return expound.paths.equalish_QMARK_(form,val);
} else {
return and__5000__auto__;
}
})())){
return in_SINGLEQUOTE_;
} else {
if(((cljs.core.map_QMARK_(form)) && (((cljs.core.nat_int_QMARK_(k)) && ((cljs.core.long$(k) < cljs.core.count(cljs.core.seq(form)))))))){
var G__99305 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.seq(form),k);
var G__99306 = val;
var G__99307 = rst;
var G__99308 = cljs.core.conj.cljs$core$IFn$_invoke$arity$2(in_SINGLEQUOTE_,expound.paths.__GT_KeyValuePathSegment(k));
return (expound.paths.in_with_kps_STAR_.cljs$core$IFn$_invoke$arity$4 ? expound.paths.in_with_kps_STAR_.cljs$core$IFn$_invoke$arity$4(G__99305,G__99306,G__99307,G__99308) : expound.paths.in_with_kps_STAR_.call(null,G__99305,G__99306,G__99307,G__99308));
} else {
if(((cljs.core.map_QMARK_(form)) && (((cljs.core.nat_int_QMARK_(k)) && (((cljs.core.int_QMARK_(idx)) && ((((cljs.core.long$(k) < cljs.core.count(cljs.core.seq(form)))) && ((cljs.core.long$(idx) < cljs.core.count(cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.seq(form),k)))))))))))){
var G__99311 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.seq(form),k),idx);
var G__99312 = val;
var G__99313 = rst2;
var G__99314 = cljs.core.conj.cljs$core$IFn$_invoke$arity$variadic(in_SINGLEQUOTE_,expound.paths.__GT_KeyValuePathSegment(k),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([idx], 0));
return (expound.paths.in_with_kps_STAR_.cljs$core$IFn$_invoke$arity$4 ? expound.paths.in_with_kps_STAR_.cljs$core$IFn$_invoke$arity$4(G__99311,G__99312,G__99313,G__99314) : expound.paths.in_with_kps_STAR_.call(null,G__99311,G__99312,G__99313,G__99314));
} else {
return new cljs.core.Keyword("expound.paths","not-found","expound.paths/not-found",-195785795);

}
}
}
}
});
expound.paths.in_with_kps_fuzzy_match_for_regex_failures = (function expound$paths$in_with_kps_fuzzy_match_for_regex_failures(form,val,in$,in_SINGLEQUOTE_){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(form,new cljs.core.Keyword("expound.paths","not-found","expound.paths/not-found",-195785795))){
return form;
} else {
var vec__99316 = in$;
var seq__99317 = cljs.core.seq(vec__99316);
var first__99318 = cljs.core.first(seq__99317);
var seq__99317__$1 = cljs.core.next(seq__99317);
var k = first__99318;
var rst = seq__99317__$1;
if(((cljs.core.empty_QMARK_(in$)) && (((cljs.core.seqable_QMARK_(form)) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(val,cljs.core.List.EMPTY)))))){
return in_SINGLEQUOTE_;
} else {
if(((cljs.core.empty_QMARK_(in$)) && (((cljs.core.seq_QMARK_(val)) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(form,cljs.core.first(val))))))){
return in_SINGLEQUOTE_;
} else {
if(((cljs.core.nat_int_QMARK_(k)) && (cljs.core.seqable_QMARK_(form)))){
var G__99319 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(cljs.core.seq(form),k,new cljs.core.Keyword("expound.paths","not-found","expound.paths/not-found",-195785795));
var G__99320 = val;
var G__99321 = rst;
var G__99322 = cljs.core.conj.cljs$core$IFn$_invoke$arity$2(in_SINGLEQUOTE_,k);
return (expound.paths.in_with_kps_STAR_.cljs$core$IFn$_invoke$arity$4 ? expound.paths.in_with_kps_STAR_.cljs$core$IFn$_invoke$arity$4(G__99319,G__99320,G__99321,G__99322) : expound.paths.in_with_kps_STAR_.call(null,G__99319,G__99320,G__99321,G__99322));
} else {
return new cljs.core.Keyword("expound.paths","not-found","expound.paths/not-found",-195785795);

}
}
}
}
});
expound.paths.in_with_kps_ints_are_keys = (function expound$paths$in_with_kps_ints_are_keys(form,val,in$,in_SINGLEQUOTE_){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(form,new cljs.core.Keyword("expound.paths","not-found","expound.paths/not-found",-195785795))){
return form;
} else {
var vec__99327 = in$;
var seq__99328 = cljs.core.seq(vec__99327);
var first__99329 = cljs.core.first(seq__99328);
var seq__99328__$1 = cljs.core.next(seq__99328);
var k = first__99329;
var rst = seq__99328__$1;
if(cljs.core.truth_((function (){var and__5000__auto__ = cljs.core.empty_QMARK_(in$);
if(and__5000__auto__){
return expound.paths.equalish_QMARK_(form,val);
} else {
return and__5000__auto__;
}
})())){
return in_SINGLEQUOTE_;
} else {
if(cljs.core.associative_QMARK_(form)){
var G__99330 = cljs.core.get.cljs$core$IFn$_invoke$arity$3(form,k,new cljs.core.Keyword("expound.paths","not-found","expound.paths/not-found",-195785795));
var G__99331 = val;
var G__99332 = rst;
var G__99333 = cljs.core.conj.cljs$core$IFn$_invoke$arity$2(in_SINGLEQUOTE_,k);
return (expound.paths.in_with_kps_STAR_.cljs$core$IFn$_invoke$arity$4 ? expound.paths.in_with_kps_STAR_.cljs$core$IFn$_invoke$arity$4(G__99330,G__99331,G__99332,G__99333) : expound.paths.in_with_kps_STAR_.call(null,G__99330,G__99331,G__99332,G__99333));
} else {
if(((cljs.core.int_QMARK_(k)) && (cljs.core.seqable_QMARK_(form)))){
var G__99336 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(cljs.core.seq(form),k,new cljs.core.Keyword("expound.paths","not-found","expound.paths/not-found",-195785795));
var G__99337 = val;
var G__99338 = rst;
var G__99339 = cljs.core.conj.cljs$core$IFn$_invoke$arity$2(in_SINGLEQUOTE_,k);
return (expound.paths.in_with_kps_STAR_.cljs$core$IFn$_invoke$arity$4 ? expound.paths.in_with_kps_STAR_.cljs$core$IFn$_invoke$arity$4(G__99336,G__99337,G__99338,G__99339) : expound.paths.in_with_kps_STAR_.call(null,G__99336,G__99337,G__99338,G__99339));
} else {
return new cljs.core.Keyword("expound.paths","not-found","expound.paths/not-found",-195785795);

}
}
}
}
});
expound.paths.in_with_kps_ints_are_key_value_indicators = (function expound$paths$in_with_kps_ints_are_key_value_indicators(form,val,in$,in_SINGLEQUOTE_){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(form,new cljs.core.Keyword("expound.paths","not-found","expound.paths/not-found",-195785795))){
return form;
} else {
var vec__99347 = in$;
var seq__99348 = cljs.core.seq(vec__99347);
var first__99349 = cljs.core.first(seq__99348);
var seq__99348__$1 = cljs.core.next(seq__99348);
var k = first__99349;
var rst = seq__99348__$1;
var vec__99350 = rst;
var seq__99351 = cljs.core.seq(vec__99350);
var first__99352 = cljs.core.first(seq__99351);
var seq__99351__$1 = cljs.core.next(seq__99351);
var idx = first__99352;
var rst2 = seq__99351__$1;
if(cljs.core.truth_((function (){var and__5000__auto__ = cljs.core.empty_QMARK_(in$);
if(and__5000__auto__){
return expound.paths.equalish_QMARK_(form,val);
} else {
return and__5000__auto__;
}
})())){
return in_SINGLEQUOTE_;
} else {
if(((cljs.core.map_QMARK_(form)) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2((0),idx)))){
var G__99358 = k;
var G__99359 = val;
var G__99360 = rst2;
var G__99361 = cljs.core.conj.cljs$core$IFn$_invoke$arity$2(in_SINGLEQUOTE_,expound.paths.__GT_KeyPathSegment(k));
return (expound.paths.in_with_kps_STAR_.cljs$core$IFn$_invoke$arity$4 ? expound.paths.in_with_kps_STAR_.cljs$core$IFn$_invoke$arity$4(G__99358,G__99359,G__99360,G__99361) : expound.paths.in_with_kps_STAR_.call(null,G__99358,G__99359,G__99360,G__99361));
} else {
if(((cljs.core.map_QMARK_(form)) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2((1),idx)))){
var G__99364 = cljs.core.get.cljs$core$IFn$_invoke$arity$3(form,k,new cljs.core.Keyword("expound.paths","not-found","expound.paths/not-found",-195785795));
var G__99365 = val;
var G__99366 = rst2;
var G__99367 = cljs.core.conj.cljs$core$IFn$_invoke$arity$2(in_SINGLEQUOTE_,k);
return (expound.paths.in_with_kps_STAR_.cljs$core$IFn$_invoke$arity$4 ? expound.paths.in_with_kps_STAR_.cljs$core$IFn$_invoke$arity$4(G__99364,G__99365,G__99366,G__99367) : expound.paths.in_with_kps_STAR_.call(null,G__99364,G__99365,G__99366,G__99367));
} else {
return new cljs.core.Keyword("expound.paths","not-found","expound.paths/not-found",-195785795);

}
}
}
}
});
expound.paths.in_with_kps_STAR_ = (function expound$paths$in_with_kps_STAR_(form,val,in$,in_SINGLEQUOTE_){
if(cljs.core.fn_QMARK_(form)){
return in_SINGLEQUOTE_;
} else {
var br1 = expound.paths.in_with_kps_ints_are_key_value_indicators(form,val,in$,in_SINGLEQUOTE_);
if(cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("expound.paths","not-found","expound.paths/not-found",-195785795),br1)){
return br1;
} else {
var br2 = expound.paths.in_with_kps_maps_as_seqs(form,val,in$,in_SINGLEQUOTE_);
if(cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("expound.paths","not-found","expound.paths/not-found",-195785795),br2)){
return br2;
} else {
var br3 = expound.paths.in_with_kps_ints_are_keys(form,val,in$,in_SINGLEQUOTE_);
if(cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("expound.paths","not-found","expound.paths/not-found",-195785795),br3)){
return br3;
} else {
var br4 = expound.paths.in_with_kps_fuzzy_match_for_regex_failures(form,val,in$,in_SINGLEQUOTE_);
if(cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("expound.paths","not-found","expound.paths/not-found",-195785795),br4)){
return br4;
} else {
return new cljs.core.Keyword("expound.paths","not-found","expound.paths/not-found",-195785795);
}
}
}
}
}
});
expound.paths.paths_to_value = (function expound$paths$paths_to_value(form,val,path,paths){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(form,val)){
return cljs.core.conj.cljs$core$IFn$_invoke$arity$2(paths,path);
} else {
if(((cljs.core.sequential_QMARK_(form)) || (cljs.core.set_QMARK_(form)))){
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (ps,p__99368){
var vec__99369 = p__99368;
var x = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__99369,(0),null);
var i = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__99369,(1),null);
var G__99372 = x;
var G__99373 = val;
var G__99374 = cljs.core.conj.cljs$core$IFn$_invoke$arity$2(path,i);
var G__99375 = ps;
return (expound.paths.paths_to_value.cljs$core$IFn$_invoke$arity$4 ? expound.paths.paths_to_value.cljs$core$IFn$_invoke$arity$4(G__99372,G__99373,G__99374,G__99375) : expound.paths.paths_to_value.call(null,G__99372,G__99373,G__99374,G__99375));
}),paths,cljs.core.map.cljs$core$IFn$_invoke$arity$3(cljs.core.vector,form,cljs.core.range.cljs$core$IFn$_invoke$arity$0()));
} else {
if(cljs.core.map_QMARK_(form)){
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (ps,p__99376){
var vec__99377 = p__99376;
var k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__99377,(0),null);
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__99377,(1),null);
var G__99380 = v;
var G__99381 = val;
var G__99382 = cljs.core.conj.cljs$core$IFn$_invoke$arity$2(path,k);
var G__99383 = (function (){var G__99384 = k;
var G__99385 = val;
var G__99386 = cljs.core.conj.cljs$core$IFn$_invoke$arity$2(path,expound.paths.__GT_KeyPathSegment(k));
var G__99387 = ps;
return (expound.paths.paths_to_value.cljs$core$IFn$_invoke$arity$4 ? expound.paths.paths_to_value.cljs$core$IFn$_invoke$arity$4(G__99384,G__99385,G__99386,G__99387) : expound.paths.paths_to_value.call(null,G__99384,G__99385,G__99386,G__99387));
})();
return (expound.paths.paths_to_value.cljs$core$IFn$_invoke$arity$4 ? expound.paths.paths_to_value.cljs$core$IFn$_invoke$arity$4(G__99380,G__99381,G__99382,G__99383) : expound.paths.paths_to_value.call(null,G__99380,G__99381,G__99382,G__99383));
}),paths,form);
} else {
return paths;

}
}
}
});
expound.paths.in_with_kps = (function expound$paths$in_with_kps(form,val,in$,in_SINGLEQUOTE_){
var res = expound.paths.in_with_kps_STAR_(form,val,in$,in_SINGLEQUOTE_);
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("expound.paths","not-found","expound.paths/not-found",-195785795),res)){
return null;
} else {
return res;
}
});
expound.paths.compare_path_segment = (function expound$paths$compare_path_segment(x,y){
if(((cljs.core.int_QMARK_(x)) && (expound.paths.kvps_QMARK_(y)))){
return cljs.core.compare(x,new cljs.core.Keyword(null,"idx","idx",1053688473).cljs$core$IFn$_invoke$arity$1(y));
} else {
if(((expound.paths.kvps_QMARK_(x)) && (cljs.core.int_QMARK_(y)))){
return cljs.core.compare(new cljs.core.Keyword(null,"idx","idx",1053688473).cljs$core$IFn$_invoke$arity$1(x),y);
} else {
if(((expound.paths.kps_QMARK_(x)) && ((!(expound.paths.kps_QMARK_(y)))))){
return (-1);
} else {
if((((!(expound.paths.kps_QMARK_(x)))) && (expound.paths.kps_QMARK_(y)))){
return (1);
} else {
if(((cljs.core.vector_QMARK_(x)) && (cljs.core.vector_QMARK_(y)))){
return (expound.paths.compare_paths.cljs$core$IFn$_invoke$arity$2 ? expound.paths.compare_paths.cljs$core$IFn$_invoke$arity$2(x,y) : expound.paths.compare_paths.call(null,x,y));
} else {
return cljs.core.compare(x,y);

}
}
}
}
}
});
expound.paths.compare_paths = (function expound$paths$compare_paths(path1,path2){
return cljs.core.first(cljs.core.remove.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 1, [(0),null], null), null),cljs.core.map.cljs$core$IFn$_invoke$arity$3(expound.paths.compare_path_segment,path1,path2)));
});
/**
 * Similar to get-in, but works with paths that reference map keys
 */
expound.paths.value_in = (function expound$paths$value_in(form,in$){
while(true){
if((in$ == null)){
return form;
} else {
var vec__99389 = in$;
var seq__99390 = cljs.core.seq(vec__99389);
var first__99391 = cljs.core.first(seq__99390);
var seq__99390__$1 = cljs.core.next(seq__99390);
var k = first__99391;
var rst = seq__99390__$1;
if(cljs.core.empty_QMARK_(in$)){
return form;
} else {
if(((cljs.core.map_QMARK_(form)) && (expound.paths.kps_QMARK_(k)))){
var G__99396 = new cljs.core.Keyword(null,"key","key",-1516042587).cljs$core$IFn$_invoke$arity$1(k);
var G__99397 = rst;
form = G__99396;
in$ = G__99397;
continue;
} else {
if(((cljs.core.map_QMARK_(form)) && (expound.paths.kvps_QMARK_(k)))){
var G__99398 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.seq(form),new cljs.core.Keyword(null,"idx","idx",1053688473).cljs$core$IFn$_invoke$arity$1(k));
var G__99399 = rst;
form = G__99398;
in$ = G__99399;
continue;
} else {
if(cljs.core.associative_QMARK_(form)){
var G__99400 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(form,k);
var G__99401 = rst;
form = G__99400;
in$ = G__99401;
continue;
} else {
if(((cljs.core.int_QMARK_(k)) && (cljs.core.seqable_QMARK_(form)))){
var G__99402 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.seq(form),k);
var G__99403 = rst;
form = G__99402;
in$ = G__99403;
continue;
} else {
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2("No value found",new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"form","form",-1624062471),form,new cljs.core.Keyword(null,"in","in",-1531184865),in$], null));

}
}
}
}
}
}
break;
}
});

//# sourceMappingURL=expound.paths.js.map
