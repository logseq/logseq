goog.provide('datascript.query');
datascript.query._STAR_query_cache_STAR_ = datascript.lru.cache((100));




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
datascript.query.Context = (function (rels,sources,rules,__meta,__extmap,__hash){
this.rels = rels;
this.sources = sources;
this.rules = rules;
this.__meta = __meta;
this.__extmap = __extmap;
this.__hash = __hash;
this.cljs$lang$protocol_mask$partition0$ = 2230716170;
this.cljs$lang$protocol_mask$partition1$ = 139264;
});
(datascript.query.Context.prototype.cljs$core$ILookup$_lookup$arity$2 = (function (this__5300__auto__,k__5301__auto__){
var self__ = this;
var this__5300__auto____$1 = this;
return this__5300__auto____$1.cljs$core$ILookup$_lookup$arity$3(null,k__5301__auto__,null);
}));

(datascript.query.Context.prototype.cljs$core$ILookup$_lookup$arity$3 = (function (this__5302__auto__,k56451,else__5303__auto__){
var self__ = this;
var this__5302__auto____$1 = this;
var G__56473 = k56451;
var G__56473__$1 = (((G__56473 instanceof cljs.core.Keyword))?G__56473.fqn:null);
switch (G__56473__$1) {
case "rels":
return self__.rels;

break;
case "sources":
return self__.sources;

break;
case "rules":
return self__.rules;

break;
default:
return cljs.core.get.cljs$core$IFn$_invoke$arity$3(self__.__extmap,k56451,else__5303__auto__);

}
}));

(datascript.query.Context.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = (function (this__5320__auto__,f__5321__auto__,init__5322__auto__){
var self__ = this;
var this__5320__auto____$1 = this;
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (ret__5323__auto__,p__56484){
var vec__56486 = p__56484;
var k__5324__auto__ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__56486,(0),null);
var v__5325__auto__ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__56486,(1),null);
return (f__5321__auto__.cljs$core$IFn$_invoke$arity$3 ? f__5321__auto__.cljs$core$IFn$_invoke$arity$3(ret__5323__auto__,k__5324__auto__,v__5325__auto__) : f__5321__auto__.call(null,ret__5323__auto__,k__5324__auto__,v__5325__auto__));
}),init__5322__auto__,this__5320__auto____$1);
}));

(datascript.query.Context.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = (function (this__5315__auto__,writer__5316__auto__,opts__5317__auto__){
var self__ = this;
var this__5315__auto____$1 = this;
var pr_pair__5318__auto__ = (function (keyval__5319__auto__){
return cljs.core.pr_sequential_writer(writer__5316__auto__,cljs.core.pr_writer,""," ","",opts__5317__auto__,keyval__5319__auto__);
});
return cljs.core.pr_sequential_writer(writer__5316__auto__,pr_pair__5318__auto__,"#datascript.query.Context{",", ","}",opts__5317__auto__,cljs.core.concat.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [(new cljs.core.PersistentVector(null,2,(5),cljs.core.PersistentVector.EMPTY_NODE,[new cljs.core.Keyword(null,"rels","rels",1770187185),self__.rels],null)),(new cljs.core.PersistentVector(null,2,(5),cljs.core.PersistentVector.EMPTY_NODE,[new cljs.core.Keyword(null,"sources","sources",-321166424),self__.sources],null)),(new cljs.core.PersistentVector(null,2,(5),cljs.core.PersistentVector.EMPTY_NODE,[new cljs.core.Keyword(null,"rules","rules",1198912366),self__.rules],null))], null),self__.__extmap));
}));

(datascript.query.Context.prototype.cljs$core$IIterable$_iterator$arity$1 = (function (G__56450){
var self__ = this;
var G__56450__$1 = this;
return (new cljs.core.RecordIter((0),G__56450__$1,3,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"rels","rels",1770187185),new cljs.core.Keyword(null,"sources","sources",-321166424),new cljs.core.Keyword(null,"rules","rules",1198912366)], null),(cljs.core.truth_(self__.__extmap)?cljs.core._iterator(self__.__extmap):cljs.core.nil_iter())));
}));

(datascript.query.Context.prototype.cljs$core$IMeta$_meta$arity$1 = (function (this__5298__auto__){
var self__ = this;
var this__5298__auto____$1 = this;
return self__.__meta;
}));

(datascript.query.Context.prototype.cljs$core$ICloneable$_clone$arity$1 = (function (this__5295__auto__){
var self__ = this;
var this__5295__auto____$1 = this;
return (new datascript.query.Context(self__.rels,self__.sources,self__.rules,self__.__meta,self__.__extmap,self__.__hash));
}));

(datascript.query.Context.prototype.cljs$core$ICounted$_count$arity$1 = (function (this__5304__auto__){
var self__ = this;
var this__5304__auto____$1 = this;
return (3 + cljs.core.count(self__.__extmap));
}));

(datascript.query.Context.prototype.cljs$core$IHash$_hash$arity$1 = (function (this__5296__auto__){
var self__ = this;
var this__5296__auto____$1 = this;
var h__5111__auto__ = self__.__hash;
if((!((h__5111__auto__ == null)))){
return h__5111__auto__;
} else {
var h__5111__auto____$1 = (function (coll__5297__auto__){
return (1014232958 ^ cljs.core.hash_unordered_coll(coll__5297__auto__));
})(this__5296__auto____$1);
(self__.__hash = h__5111__auto____$1);

return h__5111__auto____$1;
}
}));

(datascript.query.Context.prototype.cljs$core$IEquiv$_equiv$arity$2 = (function (this56452,other56453){
var self__ = this;
var this56452__$1 = this;
return (((!((other56453 == null)))) && ((((this56452__$1.constructor === other56453.constructor)) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(this56452__$1.rels,other56453.rels)) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(this56452__$1.sources,other56453.sources)) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(this56452__$1.rules,other56453.rules)) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(this56452__$1.__extmap,other56453.__extmap)))))))))));
}));

(datascript.query.Context.prototype.cljs$core$IMap$_dissoc$arity$2 = (function (this__5310__auto__,k__5311__auto__){
var self__ = this;
var this__5310__auto____$1 = this;
if(cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"sources","sources",-321166424),null,new cljs.core.Keyword(null,"rules","rules",1198912366),null,new cljs.core.Keyword(null,"rels","rels",1770187185),null], null), null),k__5311__auto__)){
return cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(cljs.core._with_meta(cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,this__5310__auto____$1),self__.__meta),k__5311__auto__);
} else {
return (new datascript.query.Context(self__.rels,self__.sources,self__.rules,self__.__meta,cljs.core.not_empty(cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(self__.__extmap,k__5311__auto__)),null));
}
}));

(datascript.query.Context.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = (function (this__5307__auto__,k56451){
var self__ = this;
var this__5307__auto____$1 = this;
var G__56511 = k56451;
var G__56511__$1 = (((G__56511 instanceof cljs.core.Keyword))?G__56511.fqn:null);
switch (G__56511__$1) {
case "rels":
case "sources":
case "rules":
return true;

break;
default:
return cljs.core.contains_QMARK_(self__.__extmap,k56451);

}
}));

(datascript.query.Context.prototype.cljs$core$IAssociative$_assoc$arity$3 = (function (this__5308__auto__,k__5309__auto__,G__56450){
var self__ = this;
var this__5308__auto____$1 = this;
var pred__56515 = cljs.core.keyword_identical_QMARK_;
var expr__56516 = k__5309__auto__;
if(cljs.core.truth_((pred__56515.cljs$core$IFn$_invoke$arity$2 ? pred__56515.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"rels","rels",1770187185),expr__56516) : pred__56515.call(null,new cljs.core.Keyword(null,"rels","rels",1770187185),expr__56516)))){
return (new datascript.query.Context(G__56450,self__.sources,self__.rules,self__.__meta,self__.__extmap,null));
} else {
if(cljs.core.truth_((pred__56515.cljs$core$IFn$_invoke$arity$2 ? pred__56515.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"sources","sources",-321166424),expr__56516) : pred__56515.call(null,new cljs.core.Keyword(null,"sources","sources",-321166424),expr__56516)))){
return (new datascript.query.Context(self__.rels,G__56450,self__.rules,self__.__meta,self__.__extmap,null));
} else {
if(cljs.core.truth_((pred__56515.cljs$core$IFn$_invoke$arity$2 ? pred__56515.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"rules","rules",1198912366),expr__56516) : pred__56515.call(null,new cljs.core.Keyword(null,"rules","rules",1198912366),expr__56516)))){
return (new datascript.query.Context(self__.rels,self__.sources,G__56450,self__.__meta,self__.__extmap,null));
} else {
return (new datascript.query.Context(self__.rels,self__.sources,self__.rules,self__.__meta,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(self__.__extmap,k__5309__auto__,G__56450),null));
}
}
}
}));

(datascript.query.Context.prototype.cljs$core$ISeqable$_seq$arity$1 = (function (this__5313__auto__){
var self__ = this;
var this__5313__auto____$1 = this;
return cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [(new cljs.core.MapEntry(new cljs.core.Keyword(null,"rels","rels",1770187185),self__.rels,null)),(new cljs.core.MapEntry(new cljs.core.Keyword(null,"sources","sources",-321166424),self__.sources,null)),(new cljs.core.MapEntry(new cljs.core.Keyword(null,"rules","rules",1198912366),self__.rules,null))], null),self__.__extmap));
}));

(datascript.query.Context.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = (function (this__5299__auto__,G__56450){
var self__ = this;
var this__5299__auto____$1 = this;
return (new datascript.query.Context(self__.rels,self__.sources,self__.rules,G__56450,self__.__extmap,self__.__hash));
}));

(datascript.query.Context.prototype.cljs$core$ICollection$_conj$arity$2 = (function (this__5305__auto__,entry__5306__auto__){
var self__ = this;
var this__5305__auto____$1 = this;
if(cljs.core.vector_QMARK_(entry__5306__auto__)){
return this__5305__auto____$1.cljs$core$IAssociative$_assoc$arity$3(null,cljs.core._nth(entry__5306__auto__,(0)),cljs.core._nth(entry__5306__auto__,(1)));
} else {
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3(cljs.core._conj,this__5305__auto____$1,entry__5306__auto__);
}
}));

(datascript.query.Context.getBasis = (function (){
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"rels","rels",-884248584,null),new cljs.core.Symbol(null,"sources","sources",1319365103,null),new cljs.core.Symbol(null,"rules","rules",-1455523403,null)], null);
}));

(datascript.query.Context.cljs$lang$type = true);

(datascript.query.Context.cljs$lang$ctorPrSeq = (function (this__5346__auto__){
return (new cljs.core.List(null,"datascript.query/Context",null,(1),null));
}));

(datascript.query.Context.cljs$lang$ctorPrWriter = (function (this__5346__auto__,writer__5347__auto__){
return cljs.core._write(writer__5347__auto__,"datascript.query/Context");
}));

/**
 * Positional factory function for datascript.query/Context.
 */
datascript.query.__GT_Context = (function datascript$query$__GT_Context(rels,sources,rules){
return (new datascript.query.Context(rels,sources,rules,null,null,null));
});

/**
 * Factory function for datascript.query/Context, taking a map of keywords to field values.
 */
datascript.query.map__GT_Context = (function datascript$query$map__GT_Context(G__56457){
var extmap__5342__auto__ = (function (){var G__56534 = cljs.core.dissoc.cljs$core$IFn$_invoke$arity$variadic(G__56457,new cljs.core.Keyword(null,"rels","rels",1770187185),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"sources","sources",-321166424),new cljs.core.Keyword(null,"rules","rules",1198912366)], 0));
if(cljs.core.record_QMARK_(G__56457)){
return cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,G__56534);
} else {
return G__56534;
}
})();
return (new datascript.query.Context(new cljs.core.Keyword(null,"rels","rels",1770187185).cljs$core$IFn$_invoke$arity$1(G__56457),new cljs.core.Keyword(null,"sources","sources",-321166424).cljs$core$IFn$_invoke$arity$1(G__56457),new cljs.core.Keyword(null,"rules","rules",1198912366).cljs$core$IFn$_invoke$arity$1(G__56457),null,cljs.core.not_empty(extmap__5342__auto__),null));
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
datascript.query.Relation = (function (attrs,tuples,__meta,__extmap,__hash){
this.attrs = attrs;
this.tuples = tuples;
this.__meta = __meta;
this.__extmap = __extmap;
this.__hash = __hash;
this.cljs$lang$protocol_mask$partition0$ = 2230716170;
this.cljs$lang$protocol_mask$partition1$ = 139264;
});
(datascript.query.Relation.prototype.cljs$core$ILookup$_lookup$arity$2 = (function (this__5300__auto__,k__5301__auto__){
var self__ = this;
var this__5300__auto____$1 = this;
return this__5300__auto____$1.cljs$core$ILookup$_lookup$arity$3(null,k__5301__auto__,null);
}));

(datascript.query.Relation.prototype.cljs$core$ILookup$_lookup$arity$3 = (function (this__5302__auto__,k56542,else__5303__auto__){
var self__ = this;
var this__5302__auto____$1 = this;
var G__56600 = k56542;
var G__56600__$1 = (((G__56600 instanceof cljs.core.Keyword))?G__56600.fqn:null);
switch (G__56600__$1) {
case "attrs":
return self__.attrs;

break;
case "tuples":
return self__.tuples;

break;
default:
return cljs.core.get.cljs$core$IFn$_invoke$arity$3(self__.__extmap,k56542,else__5303__auto__);

}
}));

(datascript.query.Relation.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = (function (this__5320__auto__,f__5321__auto__,init__5322__auto__){
var self__ = this;
var this__5320__auto____$1 = this;
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (ret__5323__auto__,p__56663){
var vec__56666 = p__56663;
var k__5324__auto__ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__56666,(0),null);
var v__5325__auto__ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__56666,(1),null);
return (f__5321__auto__.cljs$core$IFn$_invoke$arity$3 ? f__5321__auto__.cljs$core$IFn$_invoke$arity$3(ret__5323__auto__,k__5324__auto__,v__5325__auto__) : f__5321__auto__.call(null,ret__5323__auto__,k__5324__auto__,v__5325__auto__));
}),init__5322__auto__,this__5320__auto____$1);
}));

(datascript.query.Relation.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = (function (this__5315__auto__,writer__5316__auto__,opts__5317__auto__){
var self__ = this;
var this__5315__auto____$1 = this;
var pr_pair__5318__auto__ = (function (keyval__5319__auto__){
return cljs.core.pr_sequential_writer(writer__5316__auto__,cljs.core.pr_writer,""," ","",opts__5317__auto__,keyval__5319__auto__);
});
return cljs.core.pr_sequential_writer(writer__5316__auto__,pr_pair__5318__auto__,"#datascript.query.Relation{",", ","}",opts__5317__auto__,cljs.core.concat.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [(new cljs.core.PersistentVector(null,2,(5),cljs.core.PersistentVector.EMPTY_NODE,[new cljs.core.Keyword(null,"attrs","attrs",-2090668713),self__.attrs],null)),(new cljs.core.PersistentVector(null,2,(5),cljs.core.PersistentVector.EMPTY_NODE,[new cljs.core.Keyword(null,"tuples","tuples",-676032639),self__.tuples],null))], null),self__.__extmap));
}));

(datascript.query.Relation.prototype.cljs$core$IIterable$_iterator$arity$1 = (function (G__56541){
var self__ = this;
var G__56541__$1 = this;
return (new cljs.core.RecordIter((0),G__56541__$1,2,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"attrs","attrs",-2090668713),new cljs.core.Keyword(null,"tuples","tuples",-676032639)], null),(cljs.core.truth_(self__.__extmap)?cljs.core._iterator(self__.__extmap):cljs.core.nil_iter())));
}));

(datascript.query.Relation.prototype.cljs$core$IMeta$_meta$arity$1 = (function (this__5298__auto__){
var self__ = this;
var this__5298__auto____$1 = this;
return self__.__meta;
}));

(datascript.query.Relation.prototype.cljs$core$ICloneable$_clone$arity$1 = (function (this__5295__auto__){
var self__ = this;
var this__5295__auto____$1 = this;
return (new datascript.query.Relation(self__.attrs,self__.tuples,self__.__meta,self__.__extmap,self__.__hash));
}));

(datascript.query.Relation.prototype.cljs$core$ICounted$_count$arity$1 = (function (this__5304__auto__){
var self__ = this;
var this__5304__auto____$1 = this;
return (2 + cljs.core.count(self__.__extmap));
}));

(datascript.query.Relation.prototype.cljs$core$IHash$_hash$arity$1 = (function (this__5296__auto__){
var self__ = this;
var this__5296__auto____$1 = this;
var h__5111__auto__ = self__.__hash;
if((!((h__5111__auto__ == null)))){
return h__5111__auto__;
} else {
var h__5111__auto____$1 = (function (coll__5297__auto__){
return (1107093117 ^ cljs.core.hash_unordered_coll(coll__5297__auto__));
})(this__5296__auto____$1);
(self__.__hash = h__5111__auto____$1);

return h__5111__auto____$1;
}
}));

(datascript.query.Relation.prototype.cljs$core$IEquiv$_equiv$arity$2 = (function (this56543,other56544){
var self__ = this;
var this56543__$1 = this;
return (((!((other56544 == null)))) && ((((this56543__$1.constructor === other56544.constructor)) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(this56543__$1.attrs,other56544.attrs)) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(this56543__$1.tuples,other56544.tuples)) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(this56543__$1.__extmap,other56544.__extmap)))))))));
}));

(datascript.query.Relation.prototype.cljs$core$IMap$_dissoc$arity$2 = (function (this__5310__auto__,k__5311__auto__){
var self__ = this;
var this__5310__auto____$1 = this;
if(cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"tuples","tuples",-676032639),null,new cljs.core.Keyword(null,"attrs","attrs",-2090668713),null], null), null),k__5311__auto__)){
return cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(cljs.core._with_meta(cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,this__5310__auto____$1),self__.__meta),k__5311__auto__);
} else {
return (new datascript.query.Relation(self__.attrs,self__.tuples,self__.__meta,cljs.core.not_empty(cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(self__.__extmap,k__5311__auto__)),null));
}
}));

(datascript.query.Relation.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = (function (this__5307__auto__,k56542){
var self__ = this;
var this__5307__auto____$1 = this;
var G__56722 = k56542;
var G__56722__$1 = (((G__56722 instanceof cljs.core.Keyword))?G__56722.fqn:null);
switch (G__56722__$1) {
case "attrs":
case "tuples":
return true;

break;
default:
return cljs.core.contains_QMARK_(self__.__extmap,k56542);

}
}));

(datascript.query.Relation.prototype.cljs$core$IAssociative$_assoc$arity$3 = (function (this__5308__auto__,k__5309__auto__,G__56541){
var self__ = this;
var this__5308__auto____$1 = this;
var pred__56728 = cljs.core.keyword_identical_QMARK_;
var expr__56729 = k__5309__auto__;
if(cljs.core.truth_((pred__56728.cljs$core$IFn$_invoke$arity$2 ? pred__56728.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"attrs","attrs",-2090668713),expr__56729) : pred__56728.call(null,new cljs.core.Keyword(null,"attrs","attrs",-2090668713),expr__56729)))){
return (new datascript.query.Relation(G__56541,self__.tuples,self__.__meta,self__.__extmap,null));
} else {
if(cljs.core.truth_((pred__56728.cljs$core$IFn$_invoke$arity$2 ? pred__56728.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"tuples","tuples",-676032639),expr__56729) : pred__56728.call(null,new cljs.core.Keyword(null,"tuples","tuples",-676032639),expr__56729)))){
return (new datascript.query.Relation(self__.attrs,G__56541,self__.__meta,self__.__extmap,null));
} else {
return (new datascript.query.Relation(self__.attrs,self__.tuples,self__.__meta,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(self__.__extmap,k__5309__auto__,G__56541),null));
}
}
}));

(datascript.query.Relation.prototype.cljs$core$ISeqable$_seq$arity$1 = (function (this__5313__auto__){
var self__ = this;
var this__5313__auto____$1 = this;
return cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [(new cljs.core.MapEntry(new cljs.core.Keyword(null,"attrs","attrs",-2090668713),self__.attrs,null)),(new cljs.core.MapEntry(new cljs.core.Keyword(null,"tuples","tuples",-676032639),self__.tuples,null))], null),self__.__extmap));
}));

(datascript.query.Relation.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = (function (this__5299__auto__,G__56541){
var self__ = this;
var this__5299__auto____$1 = this;
return (new datascript.query.Relation(self__.attrs,self__.tuples,G__56541,self__.__extmap,self__.__hash));
}));

(datascript.query.Relation.prototype.cljs$core$ICollection$_conj$arity$2 = (function (this__5305__auto__,entry__5306__auto__){
var self__ = this;
var this__5305__auto____$1 = this;
if(cljs.core.vector_QMARK_(entry__5306__auto__)){
return this__5305__auto____$1.cljs$core$IAssociative$_assoc$arity$3(null,cljs.core._nth(entry__5306__auto__,(0)),cljs.core._nth(entry__5306__auto__,(1)));
} else {
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3(cljs.core._conj,this__5305__auto____$1,entry__5306__auto__);
}
}));

(datascript.query.Relation.getBasis = (function (){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"attrs","attrs",-450137186,null),new cljs.core.Symbol(null,"tuples","tuples",964498888,null)], null);
}));

(datascript.query.Relation.cljs$lang$type = true);

(datascript.query.Relation.cljs$lang$ctorPrSeq = (function (this__5346__auto__){
return (new cljs.core.List(null,"datascript.query/Relation",null,(1),null));
}));

(datascript.query.Relation.cljs$lang$ctorPrWriter = (function (this__5346__auto__,writer__5347__auto__){
return cljs.core._write(writer__5347__auto__,"datascript.query/Relation");
}));

/**
 * Positional factory function for datascript.query/Relation.
 */
datascript.query.__GT_Relation = (function datascript$query$__GT_Relation(attrs,tuples){
return (new datascript.query.Relation(attrs,tuples,null,null,null));
});

/**
 * Factory function for datascript.query/Relation, taking a map of keywords to field values.
 */
datascript.query.map__GT_Relation = (function datascript$query$map__GT_Relation(G__56561){
var extmap__5342__auto__ = (function (){var G__56751 = cljs.core.dissoc.cljs$core$IFn$_invoke$arity$variadic(G__56561,new cljs.core.Keyword(null,"attrs","attrs",-2090668713),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"tuples","tuples",-676032639)], 0));
if(cljs.core.record_QMARK_(G__56561)){
return cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,G__56751);
} else {
return G__56751;
}
})();
return (new datascript.query.Relation(new cljs.core.Keyword(null,"attrs","attrs",-2090668713).cljs$core$IFn$_invoke$arity$1(G__56561),new cljs.core.Keyword(null,"tuples","tuples",-676032639).cljs$core$IFn$_invoke$arity$1(G__56561),null,cljs.core.not_empty(extmap__5342__auto__),null));
});

datascript.query.intersect_keys = (function datascript$query$intersect_keys(attrs1,attrs2){
return clojure.set.intersection.cljs$core$IFn$_invoke$arity$2(cljs.core.set(cljs.core.keys(attrs1)),cljs.core.set(cljs.core.keys(attrs2)));
});
datascript.query.same_keys_QMARK_ = (function datascript$query$same_keys_QMARK_(a,b){
return ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.count(a),cljs.core.count(b))) && (((cljs.core.every_QMARK_((function (p1__56756_SHARP_){
return cljs.core.contains_QMARK_(b,p1__56756_SHARP_);
}),cljs.core.keys(a))) && (cljs.core.every_QMARK_((function (p1__56757_SHARP_){
return cljs.core.contains_QMARK_(a,p1__56757_SHARP_);
}),cljs.core.keys(b))))));
});
datascript.query.looks_like_QMARK_ = (function datascript$query$looks_like_QMARK_(pattern,form){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Symbol(null,"_","_",-1201019570,null),pattern)){
return true;
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"*","*",345799209,null)], null),pattern)){
return cljs.core.sequential_QMARK_(form);
} else {
if((pattern instanceof cljs.core.Symbol)){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(form,pattern);
} else {
if(cljs.core.sequential_QMARK_(pattern)){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.last(pattern),new cljs.core.Symbol(null,"*","*",345799209,null))){
return ((cljs.core.sequential_QMARK_(form)) && (cljs.core.every_QMARK_((function (p__56768){
var vec__56769 = p__56768;
var pattern_el = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__56769,(0),null);
var form_el = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__56769,(1),null);
return (datascript.query.looks_like_QMARK_.cljs$core$IFn$_invoke$arity$2 ? datascript.query.looks_like_QMARK_.cljs$core$IFn$_invoke$arity$2(pattern_el,form_el) : datascript.query.looks_like_QMARK_.call(null,pattern_el,form_el));
}),cljs.core.map.cljs$core$IFn$_invoke$arity$3(cljs.core.vector,cljs.core.butlast(pattern),form))));
} else {
return ((cljs.core.sequential_QMARK_(form)) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.count(form),cljs.core.count(pattern))) && (cljs.core.every_QMARK_((function (p__56774){
var vec__56775 = p__56774;
var pattern_el = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__56775,(0),null);
var form_el = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__56775,(1),null);
return (datascript.query.looks_like_QMARK_.cljs$core$IFn$_invoke$arity$2 ? datascript.query.looks_like_QMARK_.cljs$core$IFn$_invoke$arity$2(pattern_el,form_el) : datascript.query.looks_like_QMARK_.call(null,pattern_el,form_el));
}),cljs.core.map.cljs$core$IFn$_invoke$arity$3(cljs.core.vector,pattern,form))))));
}
} else {
return (pattern.cljs$core$IFn$_invoke$arity$1 ? pattern.cljs$core$IFn$_invoke$arity$1(form) : pattern.call(null,form));

}
}
}
}
});
datascript.query.source_QMARK_ = (function datascript$query$source_QMARK_(sym){
return (((sym instanceof cljs.core.Symbol)) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("$",cljs.core.first(cljs.core.name(sym)))));
});
datascript.query.free_var_QMARK_ = (function datascript$query$free_var_QMARK_(sym){
return (((sym instanceof cljs.core.Symbol)) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("?",cljs.core.first(cljs.core.name(sym)))));
});
datascript.query.attr_QMARK_ = (function datascript$query$attr_QMARK_(form){
return (((form instanceof cljs.core.Keyword)) || (typeof form === 'string'));
});
datascript.query.lookup_ref_QMARK_ = (function datascript$query$lookup_ref_QMARK_(form){
return ((((cljs.core.sequential_QMARK_(form)) || (me.tonsky.persistent_sorted_set.arrays.array_QMARK_(form)))) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2((2),cljs.core.count(form))) && (datascript.query.attr_QMARK_(cljs.core.first(form))))));
});
datascript.query.join_tuples = (function datascript$query$join_tuples(t1,idxs1,t2,idxs2){
var l1 = idxs1.length;
var l2 = idxs2.length;
var res = me.tonsky.persistent_sorted_set.arrays.make_array((l1 + l2));
var n__5593__auto___57947 = l1;
var i_57948 = (0);
while(true){
if((i_57948 < n__5593__auto___57947)){
(res[i_57948] = (t1[(idxs1[i_57948])]));

var G__57949 = (i_57948 + (1));
i_57948 = G__57949;
continue;
} else {
}
break;
}

var n__5593__auto___57950 = l2;
var i_57951 = (0);
while(true){
if((i_57951 < n__5593__auto___57950)){
(res[(l1 + i_57951)] = (t2[(idxs2[i_57951])]));

var G__57952 = (i_57951 + (1));
i_57951 = G__57952;
continue;
} else {
}
break;
}

return res;
});
datascript.query.sum_rel_STAR_ = (function datascript$query$sum_rel_STAR_(attrs_a,tuples_a,attrs_b,tuples_b){
var idxb__GT_idxa = cljs.core.vec((function (){var iter__5480__auto__ = (function datascript$query$sum_rel_STAR__$_iter__56803(s__56804){
return (new cljs.core.LazySeq(null,(function (){
var s__56804__$1 = s__56804;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__56804__$1);
if(temp__5804__auto__){
var s__56804__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__56804__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__56804__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__56806 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__56805 = (0);
while(true){
if((i__56805 < size__5479__auto__)){
var vec__56812 = cljs.core._nth(c__5478__auto__,i__56805);
var sym = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__56812,(0),null);
var idx_b = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__56812,(1),null);
cljs.core.chunk_append(b__56806,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [idx_b,(attrs_a.cljs$core$IFn$_invoke$arity$1 ? attrs_a.cljs$core$IFn$_invoke$arity$1(sym) : attrs_a.call(null,sym))], null));

var G__57953 = (i__56805 + (1));
i__56805 = G__57953;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__56806),datascript$query$sum_rel_STAR__$_iter__56803(cljs.core.chunk_rest(s__56804__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__56806),null);
}
} else {
var vec__56820 = cljs.core.first(s__56804__$2);
var sym = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__56820,(0),null);
var idx_b = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__56820,(1),null);
return cljs.core.cons(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [idx_b,(attrs_a.cljs$core$IFn$_invoke$arity$1 ? attrs_a.cljs$core$IFn$_invoke$arity$1(sym) : attrs_a.call(null,sym))], null),datascript$query$sum_rel_STAR__$_iter__56803(cljs.core.rest(s__56804__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(attrs_b);
})());
var tlen = (cljs.core.reduce.cljs$core$IFn$_invoke$arity$2(cljs.core.max,cljs.core.vals(attrs_a)) + (1));
var tuples_SINGLEQUOTE_ = cljs.core.persistent_BANG_(cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (acc,tuple_b){
var tuple_SINGLEQUOTE_ = me.tonsky.persistent_sorted_set.arrays.make_array(tlen);
var seq__56829_57960 = cljs.core.seq(idxb__GT_idxa);
var chunk__56830_57961 = null;
var count__56831_57962 = (0);
var i__56832_57963 = (0);
while(true){
if((i__56832_57963 < count__56831_57962)){
var vec__56846_57965 = chunk__56830_57961.cljs$core$IIndexed$_nth$arity$2(null,i__56832_57963);
var idx_b_57966 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__56846_57965,(0),null);
var idx_a_57967 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__56846_57965,(1),null);
(tuple_SINGLEQUOTE_[idx_a_57967] = (tuple_b[idx_b_57966]));


var G__57969 = seq__56829_57960;
var G__57970 = chunk__56830_57961;
var G__57971 = count__56831_57962;
var G__57972 = (i__56832_57963 + (1));
seq__56829_57960 = G__57969;
chunk__56830_57961 = G__57970;
count__56831_57962 = G__57971;
i__56832_57963 = G__57972;
continue;
} else {
var temp__5804__auto___57973 = cljs.core.seq(seq__56829_57960);
if(temp__5804__auto___57973){
var seq__56829_57974__$1 = temp__5804__auto___57973;
if(cljs.core.chunked_seq_QMARK_(seq__56829_57974__$1)){
var c__5525__auto___57978 = cljs.core.chunk_first(seq__56829_57974__$1);
var G__57979 = cljs.core.chunk_rest(seq__56829_57974__$1);
var G__57980 = c__5525__auto___57978;
var G__57981 = cljs.core.count(c__5525__auto___57978);
var G__57982 = (0);
seq__56829_57960 = G__57979;
chunk__56830_57961 = G__57980;
count__56831_57962 = G__57981;
i__56832_57963 = G__57982;
continue;
} else {
var vec__56861_57983 = cljs.core.first(seq__56829_57974__$1);
var idx_b_57984 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__56861_57983,(0),null);
var idx_a_57985 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__56861_57983,(1),null);
(tuple_SINGLEQUOTE_[idx_a_57985] = (tuple_b[idx_b_57984]));


var G__57986 = cljs.core.next(seq__56829_57974__$1);
var G__57987 = null;
var G__57988 = (0);
var G__57989 = (0);
seq__56829_57960 = G__57986;
chunk__56830_57961 = G__57987;
count__56831_57962 = G__57988;
i__56832_57963 = G__57989;
continue;
}
} else {
}
}
break;
}

return cljs.core.conj_BANG_.cljs$core$IFn$_invoke$arity$2(acc,tuple_SINGLEQUOTE_);
}),cljs.core.transient$(cljs.core.vec(tuples_a)),tuples_b));
return (new datascript.query.Relation(attrs_a,tuples_SINGLEQUOTE_,null,null,null));
});
datascript.query.sum_rel = (function datascript$query$sum_rel(a,b){
var map__56867 = a;
var map__56867__$1 = cljs.core.__destructure_map(map__56867);
var attrs_a = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__56867__$1,new cljs.core.Keyword(null,"attrs","attrs",-2090668713));
var tuples_a = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__56867__$1,new cljs.core.Keyword(null,"tuples","tuples",-676032639));
var map__56868 = b;
var map__56868__$1 = cljs.core.__destructure_map(map__56868);
var attrs_b = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__56868__$1,new cljs.core.Keyword(null,"attrs","attrs",-2090668713));
var tuples_b = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__56868__$1,new cljs.core.Keyword(null,"tuples","tuples",-676032639));
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(attrs_a,attrs_b)){
return (new datascript.query.Relation(attrs_a,cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.vec(tuples_a),tuples_b),null,null,null));
} else {
if(cljs.core.empty_QMARK_(tuples_a)){
return b;
} else {
if(cljs.core.empty_QMARK_(tuples_b)){
return a;
} else {
if((!(datascript.query.same_keys_QMARK_(attrs_a,attrs_b)))){
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2(["Can\u2019t sum relations with different attrs: ",cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([attrs_a], 0))," and ",cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([attrs_b], 0))].join(''),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"error","error",-978969032),new cljs.core.Keyword("query","where","query/where",-1935159429)], null));
} else {
if(cljs.core.every_QMARK_(cljs.core.number_QMARK_,cljs.core.vals(attrs_a))){
return datascript.query.sum_rel_STAR_(attrs_a,tuples_a,attrs_b,tuples_b);
} else {
var number_attrs = cljs.core.zipmap(cljs.core.keys(attrs_a),cljs.core.range.cljs$core$IFn$_invoke$arity$0());
var G__56885 = datascript.query.sum_rel_STAR_(number_attrs,cljs.core.PersistentVector.EMPTY,attrs_a,tuples_a);
var G__56886 = b;
return (datascript.query.sum_rel.cljs$core$IFn$_invoke$arity$2 ? datascript.query.sum_rel.cljs$core$IFn$_invoke$arity$2(G__56885,G__56886) : datascript.query.sum_rel.call(null,G__56885,G__56886));

}
}
}
}
}
});
datascript.query.prod_rel = (function datascript$query$prod_rel(var_args){
var G__56894 = arguments.length;
switch (G__56894) {
case 0:
return datascript.query.prod_rel.cljs$core$IFn$_invoke$arity$0();

break;
case 2:
return datascript.query.prod_rel.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(datascript.query.prod_rel.cljs$core$IFn$_invoke$arity$0 = (function (){
return (new datascript.query.Relation(cljs.core.PersistentArrayMap.EMPTY,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [me.tonsky.persistent_sorted_set.arrays.make_array((0))], null),null,null,null));
}));

(datascript.query.prod_rel.cljs$core$IFn$_invoke$arity$2 = (function (rel1,rel2){
var attrs1 = cljs.core.keys(new cljs.core.Keyword(null,"attrs","attrs",-2090668713).cljs$core$IFn$_invoke$arity$1(rel1));
var attrs2 = cljs.core.keys(new cljs.core.Keyword(null,"attrs","attrs",-2090668713).cljs$core$IFn$_invoke$arity$1(rel2));
var idxs1 = cljs.core.to_array(cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"attrs","attrs",-2090668713).cljs$core$IFn$_invoke$arity$1(rel1),attrs1));
var idxs2 = cljs.core.to_array(cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"attrs","attrs",-2090668713).cljs$core$IFn$_invoke$arity$1(rel2),attrs2));
return (new datascript.query.Relation(cljs.core.zipmap(cljs.core.concat.cljs$core$IFn$_invoke$arity$2(attrs1,attrs2),cljs.core.range.cljs$core$IFn$_invoke$arity$0()),cljs.core.persistent_BANG_(cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (acc,t1){
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (acc__$1,t2){
return cljs.core.conj_BANG_.cljs$core$IFn$_invoke$arity$2(acc__$1,datascript.query.join_tuples(t1,idxs1,t2,idxs2));
}),acc,new cljs.core.Keyword(null,"tuples","tuples",-676032639).cljs$core$IFn$_invoke$arity$1(rel2));
}),cljs.core.transient$(cljs.core.PersistentVector.EMPTY),new cljs.core.Keyword(null,"tuples","tuples",-676032639).cljs$core$IFn$_invoke$arity$1(rel1))),null,null,null));
}));

(datascript.query.prod_rel.cljs$lang$maxFixedArity = 2);

datascript.query.parse_rules = (function datascript$query$parse_rules(rules){
var rules__$1 = ((typeof rules === 'string')?cljs.reader.read_string.cljs$core$IFn$_invoke$arity$1(rules):rules);
datascript.parser.parse_rules(rules__$1);

return cljs.core.group_by(cljs.core.ffirst,rules__$1);
});
datascript.query.empty_rel = (function datascript$query$empty_rel(binding){
var vars = cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"symbol","symbol",-1038572696),datascript.parser.collect_vars_distinct(binding));
return (new datascript.query.Relation(cljs.core.zipmap(vars,cljs.core.range.cljs$core$IFn$_invoke$arity$0()),cljs.core.PersistentVector.EMPTY,null,null,null));
});

/**
 * @interface
 */
datascript.query.IBinding = function(){};

var datascript$query$IBinding$in__GT_rel$dyn_58006 = (function (binding,value){
var x__5350__auto__ = (((binding == null))?null:binding);
var m__5351__auto__ = (datascript.query.in__GT_rel[goog.typeOf(x__5350__auto__)]);
if((!((m__5351__auto__ == null)))){
return (m__5351__auto__.cljs$core$IFn$_invoke$arity$2 ? m__5351__auto__.cljs$core$IFn$_invoke$arity$2(binding,value) : m__5351__auto__.call(null,binding,value));
} else {
var m__5349__auto__ = (datascript.query.in__GT_rel["_"]);
if((!((m__5349__auto__ == null)))){
return (m__5349__auto__.cljs$core$IFn$_invoke$arity$2 ? m__5349__auto__.cljs$core$IFn$_invoke$arity$2(binding,value) : m__5349__auto__.call(null,binding,value));
} else {
throw cljs.core.missing_protocol("IBinding.in->rel",binding);
}
}
});
datascript.query.in__GT_rel = (function datascript$query$in__GT_rel(binding,value){
if((((!((binding == null)))) && ((!((binding.datascript$query$IBinding$in__GT_rel$arity$2 == null)))))){
return binding.datascript$query$IBinding$in__GT_rel$arity$2(binding,value);
} else {
return datascript$query$IBinding$in__GT_rel$dyn_58006(binding,value);
}
});

(datascript.parser.BindIgnore.prototype.datascript$query$IBinding$ = cljs.core.PROTOCOL_SENTINEL);

(datascript.parser.BindIgnore.prototype.datascript$query$IBinding$in__GT_rel$arity$2 = (function (_,___$1){
var ___$2 = this;
return datascript.query.prod_rel.cljs$core$IFn$_invoke$arity$0();
}));

(datascript.parser.BindScalar.prototype.datascript$query$IBinding$ = cljs.core.PROTOCOL_SENTINEL);

(datascript.parser.BindScalar.prototype.datascript$query$IBinding$in__GT_rel$arity$2 = (function (binding,value){
var binding__$1 = this;
return (new datascript.query.Relation(cljs.core.PersistentArrayMap.createAsIfByAssoc([cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(binding__$1,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"variable","variable",-281346492),new cljs.core.Keyword(null,"symbol","symbol",-1038572696)], null)),(0)]),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.into_array.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [value], null))], null),null,null,null));
}));

(datascript.parser.BindColl.prototype.datascript$query$IBinding$ = cljs.core.PROTOCOL_SENTINEL);

(datascript.parser.BindColl.prototype.datascript$query$IBinding$in__GT_rel$arity$2 = (function (binding,coll){
var binding__$1 = this;
if((!(datascript.db.seqable_QMARK_(coll)))){
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2(["Cannot bind value ",cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([coll], 0))," to collection ",cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([datascript.parser.source(binding__$1)], 0))].join(''),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"error","error",-978969032),new cljs.core.Keyword("query","binding","query/binding",698240489),new cljs.core.Keyword(null,"value","value",305978217),coll,new cljs.core.Keyword(null,"binding","binding",539932593),datascript.parser.source(binding__$1)], null));
} else {
if(cljs.core.empty_QMARK_(coll)){
return datascript.query.empty_rel(binding__$1);
} else {
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$2(datascript.query.sum_rel,cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__56969_SHARP_){
return datascript.query.in__GT_rel(binding__$1.binding,p1__56969_SHARP_);
}),coll));

}
}
}));

(datascript.parser.BindTuple.prototype.datascript$query$IBinding$ = cljs.core.PROTOCOL_SENTINEL);

(datascript.parser.BindTuple.prototype.datascript$query$IBinding$in__GT_rel$arity$2 = (function (binding,coll){
var binding__$1 = this;
if((!(datascript.db.seqable_QMARK_(coll)))){
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2(["Cannot bind value ",cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([coll], 0))," to tuple ",cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([datascript.parser.source(binding__$1)], 0))].join(''),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"error","error",-978969032),new cljs.core.Keyword("query","binding","query/binding",698240489),new cljs.core.Keyword(null,"value","value",305978217),coll,new cljs.core.Keyword(null,"binding","binding",539932593),datascript.parser.source(binding__$1)], null));
} else {
if((cljs.core.count(coll) < cljs.core.count(binding__$1.bindings))){
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2(["Not enough elements in a collection ",cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([coll], 0))," to bind tuple ",cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([datascript.parser.source(binding__$1)], 0))].join(''),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"error","error",-978969032),new cljs.core.Keyword("query","binding","query/binding",698240489),new cljs.core.Keyword(null,"value","value",305978217),coll,new cljs.core.Keyword(null,"binding","binding",539932593),datascript.parser.source(binding__$1)], null));
} else {
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$2(datascript.query.prod_rel,cljs.core.map.cljs$core$IFn$_invoke$arity$3((function (p1__56970_SHARP_,p2__56971_SHARP_){
return datascript.query.in__GT_rel(p1__56970_SHARP_,p2__56971_SHARP_);
}),binding__$1.bindings,coll));

}
}
}));
datascript.query.resolve_in = (function datascript$query$resolve_in(context,p__57041){
var vec__57044 = p__57041;
var binding = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__57044,(0),null);
var value = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__57044,(1),null);
if((((binding instanceof datascript.parser.BindScalar)) && ((new cljs.core.Keyword(null,"variable","variable",-281346492).cljs$core$IFn$_invoke$arity$1(binding) instanceof datascript.parser.SrcVar)))){
return cljs.core.update.cljs$core$IFn$_invoke$arity$5(context,new cljs.core.Keyword(null,"sources","sources",-321166424),cljs.core.assoc,cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(binding,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"variable","variable",-281346492),new cljs.core.Keyword(null,"symbol","symbol",-1038572696)], null)),value);
} else {
if((((binding instanceof datascript.parser.BindScalar)) && ((new cljs.core.Keyword(null,"variable","variable",-281346492).cljs$core$IFn$_invoke$arity$1(binding) instanceof datascript.parser.RulesVar)))){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(context,new cljs.core.Keyword(null,"rules","rules",1198912366),datascript.query.parse_rules(value));
} else {
return cljs.core.update.cljs$core$IFn$_invoke$arity$4(context,new cljs.core.Keyword(null,"rels","rels",1770187185),cljs.core.conj,datascript.query.in__GT_rel(binding,value));

}
}
});
datascript.query.resolve_ins = (function datascript$query$resolve_ins(context,bindings,values){
var cb = cljs.core.count(bindings);
var cv = cljs.core.count(values);
if((cb < cv)){
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2(["Extra inputs passed, expected: ",cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (p1__57055_SHARP_){
return new cljs.core.Keyword(null,"source","source",-433931539).cljs$core$IFn$_invoke$arity$1(cljs.core.meta(p1__57055_SHARP_));
}),bindings)], 0)),", got: ",cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cv], 0))].join(''),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"error","error",-978969032),new cljs.core.Keyword("query","inputs","query/inputs",1042810394),new cljs.core.Keyword(null,"expected","expected",1583670997),bindings,new cljs.core.Keyword(null,"got","got",-1674745710),values], null));
} else {
if((cb > cv)){
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2(["Too few inputs passed, expected: ",cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (p1__57056_SHARP_){
return new cljs.core.Keyword(null,"source","source",-433931539).cljs$core$IFn$_invoke$arity$1(cljs.core.meta(p1__57056_SHARP_));
}),bindings)], 0)),", got: ",cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cv], 0))].join(''),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"error","error",-978969032),new cljs.core.Keyword("query","inputs","query/inputs",1042810394),new cljs.core.Keyword(null,"expected","expected",1583670997),bindings,new cljs.core.Keyword(null,"got","got",-1674745710),values], null));
} else {
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3(datascript.query.resolve_in,context,cljs.core.zipmap(bindings,values));

}
}
});
/**
 * List of symbols in current pattern that might potentiall be resolved to refs
 */
datascript.query._STAR_lookup_attrs_STAR_ = null;
/**
 * Default pattern source. Lookup refs, patterns, rules will be resolved with it
 */
datascript.query._STAR_implicit_source_STAR_ = null;
datascript.query.getter_fn = (function datascript$query$getter_fn(attrs,attr){
var idx = (attrs.cljs$core$IFn$_invoke$arity$1 ? attrs.cljs$core$IFn$_invoke$arity$1(attr) : attrs.call(null,attr));
if(cljs.core.contains_QMARK_(datascript.query._STAR_lookup_attrs_STAR_,attr)){
if(cljs.core.int_QMARK_(idx)){
var idx__$1 = (idx | (0));
return (function datascript$query$getter_fn_$_contained_int_getter_fn(tuple){
var eid = (tuple[idx__$1]);
if(typeof eid === 'number'){
return eid;
} else {
if(cljs.core.sequential_QMARK_(eid)){
return datascript.db.entid(datascript.query._STAR_implicit_source_STAR_,eid);
} else {
if(me.tonsky.persistent_sorted_set.arrays.array_QMARK_(eid)){
return datascript.db.entid(datascript.query._STAR_implicit_source_STAR_,eid);
} else {
return eid;

}
}
}
});
} else {
return (function datascript$query$getter_fn_$_contained_getter_fn(tuple){
var eid = (tuple[idx]);
if(typeof eid === 'number'){
return eid;
} else {
if(cljs.core.sequential_QMARK_(eid)){
return datascript.db.entid(datascript.query._STAR_implicit_source_STAR_,eid);
} else {
if(me.tonsky.persistent_sorted_set.arrays.array_QMARK_(eid)){
return datascript.db.entid(datascript.query._STAR_implicit_source_STAR_,eid);
} else {
return eid;

}
}
}
});
}
} else {
if(cljs.core.int_QMARK_(idx)){
var idx__$1 = (idx | (0));
return (function datascript$query$getter_fn_$_int_getter(tuple){
return (tuple[idx__$1]);
});
} else {
return (function datascript$query$getter_fn_$_getter(tuple){
return (tuple[idx]);
});
}
}
});
datascript.query.tuple_key_fn = (function datascript$query$tuple_key_fn(attrs,common_attrs){
var n = cljs.core.count(common_attrs);
if((n === (1))){
return datascript.query.getter_fn(attrs,cljs.core.first(common_attrs));
} else {
var getters_arr = cljs.core.into_array.cljs$core$IFn$_invoke$arity$1(common_attrs);
var i = (0);
while(true){
if((i < n)){
(getters_arr[i] = datascript.query.getter_fn(attrs,(getters_arr[i])));

var G__58015 = (i + (1));
i = G__58015;
continue;
} else {
return ((function (i,getters_arr,n){
return (function (tuple){
return cljs.core.list_STAR_.cljs$core$IFn$_invoke$arity$1(getters_arr.map(((function (i,getters_arr,n){
return (function (p1__57087_SHARP_){
return (p1__57087_SHARP_.cljs$core$IFn$_invoke$arity$1 ? p1__57087_SHARP_.cljs$core$IFn$_invoke$arity$1(tuple) : p1__57087_SHARP_.call(null,tuple));
});})(i,getters_arr,n))
));
});
;})(i,getters_arr,n))
}
break;
}
}
});
datascript.query._group_by = (function datascript$query$_group_by(f,init,coll){
return cljs.core.persistent_BANG_(cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (ret,x){
var k = (f.cljs$core$IFn$_invoke$arity$1 ? f.cljs$core$IFn$_invoke$arity$1(x) : f.call(null,x));
return cljs.core.assoc_BANG_.cljs$core$IFn$_invoke$arity$3(ret,k,cljs.core.conj.cljs$core$IFn$_invoke$arity$2(cljs.core.get.cljs$core$IFn$_invoke$arity$3(ret,k,init),x));
}),cljs.core.transient$(cljs.core.PersistentArrayMap.EMPTY),coll));
});
datascript.query.hash_attrs = (function datascript$query$hash_attrs(key_fn,tuples){
return datascript.query._group_by(key_fn,cljs.core.List.EMPTY,tuples);
});
datascript.query.hash_join = (function datascript$query$hash_join(rel1,rel2){
var tuples1 = new cljs.core.Keyword(null,"tuples","tuples",-676032639).cljs$core$IFn$_invoke$arity$1(rel1);
var tuples2 = new cljs.core.Keyword(null,"tuples","tuples",-676032639).cljs$core$IFn$_invoke$arity$1(rel2);
var attrs1 = new cljs.core.Keyword(null,"attrs","attrs",-2090668713).cljs$core$IFn$_invoke$arity$1(rel1);
var attrs2 = new cljs.core.Keyword(null,"attrs","attrs",-2090668713).cljs$core$IFn$_invoke$arity$1(rel2);
var common_attrs = cljs.core.vec(datascript.query.intersect_keys(new cljs.core.Keyword(null,"attrs","attrs",-2090668713).cljs$core$IFn$_invoke$arity$1(rel1),new cljs.core.Keyword(null,"attrs","attrs",-2090668713).cljs$core$IFn$_invoke$arity$1(rel2)));
var keep_attrs1 = cljs.core.keys(attrs1);
var keep_attrs2 = cljs.core.persistent_BANG_(cljs.core.reduce_kv((function datascript$query$hash_join_$_keeper(vec,k,_){
if(cljs.core.truth_((attrs1.cljs$core$IFn$_invoke$arity$1 ? attrs1.cljs$core$IFn$_invoke$arity$1(k) : attrs1.call(null,k)))){
return vec;
} else {
return cljs.core.conj_BANG_.cljs$core$IFn$_invoke$arity$2(vec,k);
}
}),cljs.core.transient$(cljs.core.PersistentVector.EMPTY),attrs2));
var keep_idxs1 = cljs.core.to_array(cljs.core.vals(attrs1));
var keep_idxs2 = cljs.core.to_array(cljs.core.__GT_Eduction(cljs.core.map.cljs$core$IFn$_invoke$arity$1(attrs2),keep_attrs2));
var key_fn1 = datascript.query.tuple_key_fn(attrs1,common_attrs);
var key_fn2 = datascript.query.tuple_key_fn(attrs2,common_attrs);
var hash = datascript.query.hash_attrs(key_fn1,tuples1);
var new_tuples = cljs.core.persistent_BANG_(cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function datascript$query$hash_join_$_outer(acc,tuple2){
var key = key_fn2(tuple2);
var temp__5806__auto__ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(hash,key);
if((temp__5806__auto__ == null)){
return acc;
} else {
var tuples1__$1 = temp__5806__auto__;
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function datascript$query$hash_join_$_outer_$_inner(acc__$1,tuple1){
return cljs.core.conj_BANG_.cljs$core$IFn$_invoke$arity$2(acc__$1,datascript.query.join_tuples(tuple1,keep_idxs1,tuple2,keep_idxs2));
}),acc,tuples1__$1);
}
}),cljs.core.transient$(cljs.core.PersistentVector.EMPTY),tuples2));
return (new datascript.query.Relation(cljs.core.zipmap(cljs.core.concat.cljs$core$IFn$_invoke$arity$2(keep_attrs1,keep_attrs2),cljs.core.range.cljs$core$IFn$_invoke$arity$0()),new_tuples,null,null,null));
});
datascript.query.subtract_rel = (function datascript$query$subtract_rel(a,b){
var map__57112 = a;
var map__57112__$1 = cljs.core.__destructure_map(map__57112);
var attrs_a = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__57112__$1,new cljs.core.Keyword(null,"attrs","attrs",-2090668713));
var tuples_a = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__57112__$1,new cljs.core.Keyword(null,"tuples","tuples",-676032639));
var map__57113 = b;
var map__57113__$1 = cljs.core.__destructure_map(map__57113);
var attrs_b = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__57113__$1,new cljs.core.Keyword(null,"attrs","attrs",-2090668713));
var tuples_b = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__57113__$1,new cljs.core.Keyword(null,"tuples","tuples",-676032639));
var attrs = cljs.core.vec(datascript.query.intersect_keys(attrs_a,attrs_b));
var key_fn_b = datascript.query.tuple_key_fn(attrs_b,attrs);
var hash = datascript.query.hash_attrs(key_fn_b,tuples_b);
var key_fn_a = datascript.query.tuple_key_fn(attrs_a,attrs);
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(a,new cljs.core.Keyword(null,"tuples","tuples",-676032639),cljs.core.filterv((function (p1__57111_SHARP_){
return ((function (){var G__57114 = key_fn_a(p1__57111_SHARP_);
return (hash.cljs$core$IFn$_invoke$arity$1 ? hash.cljs$core$IFn$_invoke$arity$1(G__57114) : hash.call(null,G__57114));
})() == null);
}),tuples_a));
});
datascript.query.rel_with_attr = (function datascript$query$rel_with_attr(context,sym){
return cljs.core.some((function (p1__57116_SHARP_){
if(cljs.core.contains_QMARK_(new cljs.core.Keyword(null,"attrs","attrs",-2090668713).cljs$core$IFn$_invoke$arity$1(p1__57116_SHARP_),sym)){
return p1__57116_SHARP_;
} else {
return null;
}
}),new cljs.core.Keyword(null,"rels","rels",1770187185).cljs$core$IFn$_invoke$arity$1(context));
});
datascript.query.substitute_constant = (function datascript$query$substitute_constant(context,pattern_el){
if(datascript.query.free_var_QMARK_(pattern_el)){
var temp__5808__auto__ = datascript.query.rel_with_attr(context,pattern_el);
if((temp__5808__auto__ == null)){
return null;
} else {
var rel = temp__5808__auto__;
var temp__5808__auto____$1 = cljs.core.first(new cljs.core.Keyword(null,"tuples","tuples",-676032639).cljs$core$IFn$_invoke$arity$1(rel));
if((temp__5808__auto____$1 == null)){
return null;
} else {
var tuple = temp__5808__auto____$1;
if((cljs.core.fnext(new cljs.core.Keyword(null,"tuples","tuples",-676032639).cljs$core$IFn$_invoke$arity$1(rel)) == null)){
var idx = cljs.core.get.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"attrs","attrs",-2090668713).cljs$core$IFn$_invoke$arity$1(rel),pattern_el);
return (tuple[idx]);
} else {
return null;
}
}
}
} else {
return null;
}
});
datascript.query.substitute_constants = (function datascript$query$substitute_constants(context,pattern){
return cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (p1__57136_SHARP_){
var or__5002__auto__ = datascript.query.substitute_constant(context,p1__57136_SHARP_);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return p1__57136_SHARP_;
}
}),pattern);
});
datascript.query.resolve_pattern_lookup_refs = (function datascript$query$resolve_pattern_lookup_refs(source,pattern){
if((((!((source == null))))?((((false) || ((cljs.core.PROTOCOL_SENTINEL === source.datascript$db$IDB$))))?true:(((!source.cljs$lang$protocol_mask$partition$))?cljs.core.native_satisfies_QMARK_(datascript.db.IDB,source):false)):cljs.core.native_satisfies_QMARK_(datascript.db.IDB,source))){
var vec__57144 = pattern;
var e = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__57144,(0),null);
var a = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__57144,(1),null);
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__57144,(2),null);
var tx = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__57144,(3),null);
var e_SINGLEQUOTE_ = ((((datascript.query.lookup_ref_QMARK_(e)) || (datascript.query.attr_QMARK_(e))))?datascript.db.entid_strict(source,e):e);
var v_SINGLEQUOTE_ = (cljs.core.truth_((function (){var and__5000__auto__ = v;
if(cljs.core.truth_(and__5000__auto__)){
return ((datascript.query.attr_QMARK_(a)) && (((datascript.db.ref_QMARK_(source,a)) && (((datascript.query.lookup_ref_QMARK_(v)) || (datascript.query.attr_QMARK_(v)))))));
} else {
return and__5000__auto__;
}
})())?datascript.db.entid_strict(source,v):v);
var tx_SINGLEQUOTE_ = ((datascript.query.lookup_ref_QMARK_(tx))?datascript.db.entid_strict(source,tx):tx);
return cljs.core.subvec.cljs$core$IFn$_invoke$arity$3(new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [e_SINGLEQUOTE_,a,v_SINGLEQUOTE_,tx_SINGLEQUOTE_], null),(0),cljs.core.count(pattern));
} else {
return pattern;
}
});
datascript.query.lookup_pattern_db = (function datascript$query$lookup_pattern_db(context,db,pattern){
var search_pattern = cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (p1__57153_SHARP_){
if(((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(p1__57153_SHARP_,new cljs.core.Symbol(null,"_","_",-1201019570,null))) || (datascript.query.free_var_QMARK_(p1__57153_SHARP_)))){
return null;
} else {
return p1__57153_SHARP_;
}
}),datascript.query.resolve_pattern_lookup_refs(db,datascript.query.substitute_constants(context,pattern)));
var datoms = datascript.db._search(db,search_pattern);
var attr__GT_prop = cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (p__57157){
var vec__57158 = p__57157;
var s = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__57158,(0),null);
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__57158,(1),null);
return datascript.query.free_var_QMARK_(s);
}),cljs.core.map.cljs$core$IFn$_invoke$arity$3(cljs.core.vector,pattern,new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, ["e","a","v","tx"], null))));
return (new datascript.query.Relation(attr__GT_prop,datoms,null,null,null));
});
datascript.query.matches_pattern_QMARK_ = (function datascript$query$matches_pattern_QMARK_(pattern,tuple){
var tuple__$1 = tuple;
var pattern__$1 = pattern;
while(true){
if(cljs.core.truth_((function (){var and__5000__auto__ = tuple__$1;
if(cljs.core.truth_(and__5000__auto__)){
return pattern__$1;
} else {
return and__5000__auto__;
}
})())){
var t = cljs.core.first(tuple__$1);
var p = cljs.core.first(pattern__$1);
if(((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(p,new cljs.core.Symbol(null,"_","_",-1201019570,null))) || (((datascript.query.free_var_QMARK_(p)) || (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(t,p)))))){
var G__58029 = cljs.core.next(tuple__$1);
var G__58030 = cljs.core.next(pattern__$1);
tuple__$1 = G__58029;
pattern__$1 = G__58030;
continue;
} else {
return false;
}
} else {
return true;
}
break;
}
});
datascript.query.lookup_pattern_coll = (function datascript$query$lookup_pattern_coll(context,coll,pattern){
var data = cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (p1__57164_SHARP_){
return datascript.query.matches_pattern_QMARK_(pattern,p1__57164_SHARP_);
}),coll);
var attr__GT_idx = cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (p__57168){
var vec__57169 = p__57168;
var s = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__57169,(0),null);
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__57169,(1),null);
return datascript.query.free_var_QMARK_(s);
}),cljs.core.map.cljs$core$IFn$_invoke$arity$3(cljs.core.vector,pattern,cljs.core.range.cljs$core$IFn$_invoke$arity$0())));
return (new datascript.query.Relation(attr__GT_idx,cljs.core.mapv.cljs$core$IFn$_invoke$arity$2(cljs.core.to_array,data),null,null,null));
});
datascript.query.normalize_pattern_clause = (function datascript$query$normalize_pattern_clause(clause){
if(datascript.query.source_QMARK_(cljs.core.first(clause))){
return clause;
} else {
return cljs.core.concat.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"$","$",-1580747756,null)], null),clause);
}
});
datascript.query.lookup_pattern = (function datascript$query$lookup_pattern(context,source,pattern){
if((((!((source == null))))?((((false) || ((cljs.core.PROTOCOL_SENTINEL === source.datascript$db$ISearch$))))?true:(((!source.cljs$lang$protocol_mask$partition$))?cljs.core.native_satisfies_QMARK_(datascript.db.ISearch,source):false)):cljs.core.native_satisfies_QMARK_(datascript.db.ISearch,source))){
return datascript.query.lookup_pattern_db(context,source,pattern);
} else {
return datascript.query.lookup_pattern_coll(context,source,pattern);
}
});
datascript.query.collapse_rels = (function datascript$query$collapse_rels(rels,new_rel){
var rels__$1 = rels;
var new_rel__$1 = new_rel;
var acc = cljs.core.PersistentVector.EMPTY;
while(true){
var temp__5806__auto__ = cljs.core.first(rels__$1);
if((temp__5806__auto__ == null)){
return cljs.core.conj.cljs$core$IFn$_invoke$arity$2(acc,new_rel__$1);
} else {
var rel = temp__5806__auto__;
if(cljs.core.truth_(cljs.core.not_empty(datascript.query.intersect_keys(new cljs.core.Keyword(null,"attrs","attrs",-2090668713).cljs$core$IFn$_invoke$arity$1(new_rel__$1),new cljs.core.Keyword(null,"attrs","attrs",-2090668713).cljs$core$IFn$_invoke$arity$1(rel))))){
var G__58033 = cljs.core.next(rels__$1);
var G__58034 = datascript.query.hash_join(rel,new_rel__$1);
var G__58035 = acc;
rels__$1 = G__58033;
new_rel__$1 = G__58034;
acc = G__58035;
continue;
} else {
var G__58036 = cljs.core.next(rels__$1);
var G__58037 = new_rel__$1;
var G__58038 = cljs.core.conj.cljs$core$IFn$_invoke$arity$2(acc,rel);
rels__$1 = G__58036;
new_rel__$1 = G__58037;
acc = G__58038;
continue;
}
}
break;
}
});
datascript.query.context_resolve_val = (function datascript$query$context_resolve_val(context,sym){
var temp__5808__auto__ = datascript.query.rel_with_attr(context,sym);
if((temp__5808__auto__ == null)){
return null;
} else {
var rel = temp__5808__auto__;
var temp__5808__auto____$1 = cljs.core.first(new cljs.core.Keyword(null,"tuples","tuples",-676032639).cljs$core$IFn$_invoke$arity$1(rel));
if((temp__5808__auto____$1 == null)){
return null;
} else {
var tuple = temp__5808__auto____$1;
return (tuple[(function (){var fexpr__57186 = new cljs.core.Keyword(null,"attrs","attrs",-2090668713).cljs$core$IFn$_invoke$arity$1(rel);
return (fexpr__57186.cljs$core$IFn$_invoke$arity$1 ? fexpr__57186.cljs$core$IFn$_invoke$arity$1(sym) : fexpr__57186.call(null,sym));
})()]);
}
}
});
datascript.query.rel_contains_attrs_QMARK_ = (function datascript$query$rel_contains_attrs_QMARK_(rel,attrs){
return cljs.core.some((function (p1__57190_SHARP_){
return cljs.core.contains_QMARK_(new cljs.core.Keyword(null,"attrs","attrs",-2090668713).cljs$core$IFn$_invoke$arity$1(rel),p1__57190_SHARP_);
}),attrs);
});
datascript.query.rel_prod_by_attrs = (function datascript$query$rel_prod_by_attrs(context,attrs){
var rels = cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (p1__57197_SHARP_){
return datascript.query.rel_contains_attrs_QMARK_(p1__57197_SHARP_,attrs);
}),new cljs.core.Keyword(null,"rels","rels",1770187185).cljs$core$IFn$_invoke$arity$1(context));
var production = cljs.core.reduce.cljs$core$IFn$_invoke$arity$2(datascript.query.prod_rel,rels);
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.update.cljs$core$IFn$_invoke$arity$3(context,new cljs.core.Keyword(null,"rels","rels",1770187185),(function (p1__57198_SHARP_){
return cljs.core.remove.cljs$core$IFn$_invoke$arity$2(cljs.core.set(rels),p1__57198_SHARP_);
})),production], null);
});
datascript.query._call_fn = (function datascript$query$_call_fn(context,rel,f,args){
var sources = new cljs.core.Keyword(null,"sources","sources",-321166424).cljs$core$IFn$_invoke$arity$1(context);
var attrs = new cljs.core.Keyword(null,"attrs","attrs",-2090668713).cljs$core$IFn$_invoke$arity$1(rel);
var len = cljs.core.count(args);
var static_args = me.tonsky.persistent_sorted_set.arrays.make_array(len);
var tuples_args = me.tonsky.persistent_sorted_set.arrays.make_array(len);
var n__5593__auto___58039 = len;
var i_58040 = (0);
while(true){
if((i_58040 < n__5593__auto___58039)){
var arg_58041 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(args,i_58040);
if((arg_58041 instanceof cljs.core.Symbol)){
var temp__5806__auto___58042 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(sources,arg_58041);
if((temp__5806__auto___58042 == null)){
(tuples_args[i_58040] = cljs.core.get.cljs$core$IFn$_invoke$arity$2(attrs,arg_58041));
} else {
var source_58044 = temp__5806__auto___58042;
(static_args[i_58040] = source_58044);
}
} else {
(static_args[i_58040] = arg_58041);
}

var G__58045 = (i_58040 + (1));
i_58040 = G__58045;
continue;
} else {
}
break;
}

if((f === cljs.core.vector)){
return (function (tuple){
var args__$1 = me.tonsky.persistent_sorted_set.arrays.aclone(static_args);
var n__5593__auto___58046 = len;
var i_58048 = (0);
while(true){
if((i_58048 < n__5593__auto___58046)){
var temp__5808__auto___58049 = (tuples_args[i_58048]);
if((temp__5808__auto___58049 == null)){
} else {
var tuple_idx_58050 = temp__5808__auto___58049;
var v_58051 = (tuple[tuple_idx_58050]);
(args__$1[i_58048] = v_58051);
}

var G__58052 = (i_58048 + (1));
i_58048 = G__58052;
continue;
} else {
}
break;
}

return cljs.core.apply.cljs$core$IFn$_invoke$arity$2(f,args__$1);
});
} else {
return (function (tuple){
var n__5593__auto___58053 = len;
var i_58054 = (0);
while(true){
if((i_58054 < n__5593__auto___58053)){
var temp__5808__auto___58055 = (tuples_args[i_58054]);
if((temp__5808__auto___58055 == null)){
} else {
var tuple_idx_58056 = temp__5808__auto___58055;
var v_58057 = (tuple[tuple_idx_58056]);
(static_args[i_58054] = v_58057);
}

var G__58058 = (i_58054 + (1));
i_58054 = G__58058;
continue;
} else {
}
break;
}

return cljs.core.apply.cljs$core$IFn$_invoke$arity$2(f,static_args);
});
}
});
datascript.query.resolve_sym = (function datascript$query$resolve_sym(sym){
return null;
});
datascript.query.filter_by_pred = (function datascript$query$filter_by_pred(context,clause){
var vec__57216 = clause;
var vec__57219 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__57216,(0),null);
var seq__57220 = cljs.core.seq(vec__57219);
var first__57221 = cljs.core.first(seq__57220);
var seq__57220__$1 = cljs.core.next(seq__57220);
var f = first__57221;
var args = seq__57220__$1;
var pred = (function (){var or__5002__auto__ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(datascript.built_ins.query_fns,f);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = datascript.query.context_resolve_val(context,f);
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
var or__5002__auto____$2 = datascript.query.resolve_sym(f);
if(cljs.core.truth_(or__5002__auto____$2)){
return or__5002__auto____$2;
} else {
if((datascript.query.rel_with_attr(context,f) == null)){
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2(["Unknown predicate '",cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([f], 0))," in ",cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([clause], 0))].join(''),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"error","error",-978969032),new cljs.core.Keyword("query","where","query/where",-1935159429),new cljs.core.Keyword(null,"form","form",-1624062471),clause,new cljs.core.Keyword(null,"var","var",-769682797),f], null));
} else {
return null;
}
}
}
}
})();
var vec__57222 = datascript.query.rel_prod_by_attrs(context,cljs.core.filter.cljs$core$IFn$_invoke$arity$2(cljs.core.symbol_QMARK_,args));
var context__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__57222,(0),null);
var production = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__57222,(1),null);
var new_rel = (cljs.core.truth_(pred)?(function (){var tuple_pred = datascript.query._call_fn(context__$1,production,pred,args);
return cljs.core.update.cljs$core$IFn$_invoke$arity$3(production,new cljs.core.Keyword(null,"tuples","tuples",-676032639),(function (p1__57215_SHARP_){
return cljs.core.filter.cljs$core$IFn$_invoke$arity$2(tuple_pred,p1__57215_SHARP_);
}));
})():cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(production,new cljs.core.Keyword(null,"tuples","tuples",-676032639),cljs.core.PersistentVector.EMPTY));
return cljs.core.update.cljs$core$IFn$_invoke$arity$4(context__$1,new cljs.core.Keyword(null,"rels","rels",1770187185),cljs.core.conj,new_rel);
});
datascript.query.bind_by_fn = (function datascript$query$bind_by_fn(context,clause){
var vec__57232 = clause;
var vec__57235 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__57232,(0),null);
var seq__57236 = cljs.core.seq(vec__57235);
var first__57237 = cljs.core.first(seq__57236);
var seq__57236__$1 = cljs.core.next(seq__57236);
var f = first__57237;
var args = seq__57236__$1;
var out = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__57232,(1),null);
var binding = datascript.parser.parse_binding(out);
var fun = (function (){var or__5002__auto__ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(datascript.built_ins.query_fns,f);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = datascript.query.context_resolve_val(context,f);
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
var or__5002__auto____$2 = datascript.query.resolve_sym(f);
if(cljs.core.truth_(or__5002__auto____$2)){
return or__5002__auto____$2;
} else {
if((datascript.query.rel_with_attr(context,f) == null)){
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2(["Unknown function '",cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([f], 0))," in ",cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([clause], 0))].join(''),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"error","error",-978969032),new cljs.core.Keyword("query","where","query/where",-1935159429),new cljs.core.Keyword(null,"form","form",-1624062471),clause,new cljs.core.Keyword(null,"var","var",-769682797),f], null));
} else {
return null;
}
}
}
}
})();
var vec__57238 = datascript.query.rel_prod_by_attrs(context,cljs.core.filter.cljs$core$IFn$_invoke$arity$2(cljs.core.symbol_QMARK_,args));
var context__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__57238,(0),null);
var production = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__57238,(1),null);
var new_rel = (cljs.core.truth_(fun)?(function (){var tuple_fn = datascript.query._call_fn(context__$1,production,fun,args);
var rels = (function (){var iter__5480__auto__ = (function datascript$query$bind_by_fn_$_iter__57246(s__57247){
return (new cljs.core.LazySeq(null,(function (){
var s__57247__$1 = s__57247;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__57247__$1);
if(temp__5804__auto__){
var s__57247__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__57247__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__57247__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__57249 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__57248 = (0);
while(true){
if((i__57248 < size__5479__auto__)){
var tuple = cljs.core._nth(c__5478__auto__,i__57248);
var val = tuple_fn(tuple);
if((!((val == null)))){
cljs.core.chunk_append(b__57249,datascript.query.prod_rel.cljs$core$IFn$_invoke$arity$2((new datascript.query.Relation(new cljs.core.Keyword(null,"attrs","attrs",-2090668713).cljs$core$IFn$_invoke$arity$1(production),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [tuple], null),null,null,null)),datascript.query.in__GT_rel(binding,val)));

var G__58061 = (i__57248 + (1));
i__57248 = G__58061;
continue;
} else {
var G__58062 = (i__57248 + (1));
i__57248 = G__58062;
continue;
}
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__57249),datascript$query$bind_by_fn_$_iter__57246(cljs.core.chunk_rest(s__57247__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__57249),null);
}
} else {
var tuple = cljs.core.first(s__57247__$2);
var val = tuple_fn(tuple);
if((!((val == null)))){
return cljs.core.cons(datascript.query.prod_rel.cljs$core$IFn$_invoke$arity$2((new datascript.query.Relation(new cljs.core.Keyword(null,"attrs","attrs",-2090668713).cljs$core$IFn$_invoke$arity$1(production),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [tuple], null),null,null,null)),datascript.query.in__GT_rel(binding,val)),datascript$query$bind_by_fn_$_iter__57246(cljs.core.rest(s__57247__$2)));
} else {
var G__58063 = cljs.core.rest(s__57247__$2);
s__57247__$1 = G__58063;
continue;
}
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(new cljs.core.Keyword(null,"tuples","tuples",-676032639).cljs$core$IFn$_invoke$arity$1(production));
})();
if(cljs.core.empty_QMARK_(rels)){
return datascript.query.prod_rel.cljs$core$IFn$_invoke$arity$2(production,datascript.query.empty_rel(binding));
} else {
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$2(datascript.query.sum_rel,rels);
}
})():datascript.query.prod_rel.cljs$core$IFn$_invoke$arity$2(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(production,new cljs.core.Keyword(null,"tuples","tuples",-676032639),cljs.core.PersistentVector.EMPTY),datascript.query.empty_rel(binding)));
return cljs.core.update.cljs$core$IFn$_invoke$arity$4(context__$1,new cljs.core.Keyword(null,"rels","rels",1770187185),datascript.query.collapse_rels,new_rel);
});
datascript.query.rule_QMARK_ = (function datascript$query$rule_QMARK_(context,clause){
if((!(cljs.core.sequential_QMARK_(clause)))){
return false;
} else {
var head = ((datascript.query.source_QMARK_(cljs.core.first(clause)))?cljs.core.second(clause):cljs.core.first(clause));
if((!((head instanceof cljs.core.Symbol)))){
return false;
} else {
if(datascript.query.free_var_QMARK_(head)){
return false;
} else {
if(cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 6, [new cljs.core.Symbol(null,"and","and",668631710,null),null,new cljs.core.Symbol(null,"not","not",1044554643,null),null,new cljs.core.Symbol(null,"not-join","not-join",-645515756,null),null,new cljs.core.Symbol(null,"or-join","or-join",591375469,null),null,new cljs.core.Symbol(null,"or","or",1876275696,null),null,new cljs.core.Symbol(null,"_","_",-1201019570,null),null], null), null),head)){
return false;
} else {
if((!(cljs.core.contains_QMARK_(new cljs.core.Keyword(null,"rules","rules",1198912366).cljs$core$IFn$_invoke$arity$1(context),head)))){
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2(["Unknown rule '",cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([head], 0))," in ",cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([clause], 0))].join(''),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"error","error",-978969032),new cljs.core.Keyword("query","where","query/where",-1935159429),new cljs.core.Keyword(null,"form","form",-1624062471),clause], null));
} else {
return true;

}
}
}
}
}
});
datascript.query.rule_seqid = cljs.core.atom.cljs$core$IFn$_invoke$arity$1((0));
datascript.query.expand_rule = (function datascript$query$expand_rule(clause,context,used_args){
var vec__57275 = clause;
var seq__57276 = cljs.core.seq(vec__57275);
var first__57277 = cljs.core.first(seq__57276);
var seq__57276__$1 = cljs.core.next(seq__57276);
var rule = first__57277;
var call_args = seq__57276__$1;
var seqid = cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$2(datascript.query.rule_seqid,cljs.core.inc);
var branches = cljs.core.get.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"rules","rules",1198912366).cljs$core$IFn$_invoke$arity$1(context),rule);
var iter__5480__auto__ = (function datascript$query$expand_rule_$_iter__57278(s__57279){
return (new cljs.core.LazySeq(null,(function (){
var s__57279__$1 = s__57279;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__57279__$1);
if(temp__5804__auto__){
var s__57279__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__57279__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__57279__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__57281 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__57280 = (0);
while(true){
if((i__57280 < size__5479__auto__)){
var branch = cljs.core._nth(c__5478__auto__,i__57280);
var vec__57285 = branch;
var seq__57286 = cljs.core.seq(vec__57285);
var first__57287 = cljs.core.first(seq__57286);
var seq__57286__$1 = cljs.core.next(seq__57286);
var vec__57288 = first__57287;
var seq__57289 = cljs.core.seq(vec__57288);
var first__57290 = cljs.core.first(seq__57289);
var seq__57289__$1 = cljs.core.next(seq__57289);
var _ = first__57290;
var rule_args = seq__57289__$1;
var clauses = seq__57286__$1;
var replacements = cljs.core.zipmap(rule_args,call_args);
cljs.core.chunk_append(b__57281,clojure.walk.postwalk(((function (i__57280,vec__57285,seq__57286,first__57287,seq__57286__$1,vec__57288,seq__57289,first__57290,seq__57289__$1,_,rule_args,clauses,replacements,branch,c__5478__auto__,size__5479__auto__,b__57281,s__57279__$2,temp__5804__auto__,vec__57275,seq__57276,first__57277,seq__57276__$1,rule,call_args,seqid,branches){
return (function (p1__57269_SHARP_){
if(datascript.query.free_var_QMARK_(p1__57269_SHARP_)){
var x__44552__auto__ = (replacements.cljs$core$IFn$_invoke$arity$1 ? replacements.cljs$core$IFn$_invoke$arity$1(p1__57269_SHARP_) : replacements.call(null,p1__57269_SHARP_));
if((x__44552__auto__ == null)){
return cljs.core.symbol.cljs$core$IFn$_invoke$arity$1([cljs.core.name(p1__57269_SHARP_),"__auto__",cljs.core.str.cljs$core$IFn$_invoke$arity$1(seqid)].join(''));
} else {
return x__44552__auto__;
}
} else {
return p1__57269_SHARP_;
}
});})(i__57280,vec__57285,seq__57286,first__57287,seq__57286__$1,vec__57288,seq__57289,first__57290,seq__57289__$1,_,rule_args,clauses,replacements,branch,c__5478__auto__,size__5479__auto__,b__57281,s__57279__$2,temp__5804__auto__,vec__57275,seq__57276,first__57277,seq__57276__$1,rule,call_args,seqid,branches))
,clauses));

var G__58069 = (i__57280 + (1));
i__57280 = G__58069;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__57281),datascript$query$expand_rule_$_iter__57278(cljs.core.chunk_rest(s__57279__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__57281),null);
}
} else {
var branch = cljs.core.first(s__57279__$2);
var vec__57295 = branch;
var seq__57296 = cljs.core.seq(vec__57295);
var first__57297 = cljs.core.first(seq__57296);
var seq__57296__$1 = cljs.core.next(seq__57296);
var vec__57298 = first__57297;
var seq__57299 = cljs.core.seq(vec__57298);
var first__57300 = cljs.core.first(seq__57299);
var seq__57299__$1 = cljs.core.next(seq__57299);
var _ = first__57300;
var rule_args = seq__57299__$1;
var clauses = seq__57296__$1;
var replacements = cljs.core.zipmap(rule_args,call_args);
return cljs.core.cons(clojure.walk.postwalk(((function (vec__57295,seq__57296,first__57297,seq__57296__$1,vec__57298,seq__57299,first__57300,seq__57299__$1,_,rule_args,clauses,replacements,branch,s__57279__$2,temp__5804__auto__,vec__57275,seq__57276,first__57277,seq__57276__$1,rule,call_args,seqid,branches){
return (function (p1__57269_SHARP_){
if(datascript.query.free_var_QMARK_(p1__57269_SHARP_)){
var x__44552__auto__ = (replacements.cljs$core$IFn$_invoke$arity$1 ? replacements.cljs$core$IFn$_invoke$arity$1(p1__57269_SHARP_) : replacements.call(null,p1__57269_SHARP_));
if((x__44552__auto__ == null)){
return cljs.core.symbol.cljs$core$IFn$_invoke$arity$1([cljs.core.name(p1__57269_SHARP_),"__auto__",cljs.core.str.cljs$core$IFn$_invoke$arity$1(seqid)].join(''));
} else {
return x__44552__auto__;
}
} else {
return p1__57269_SHARP_;
}
});})(vec__57295,seq__57296,first__57297,seq__57296__$1,vec__57298,seq__57299,first__57300,seq__57299__$1,_,rule_args,clauses,replacements,branch,s__57279__$2,temp__5804__auto__,vec__57275,seq__57276,first__57277,seq__57276__$1,rule,call_args,seqid,branches))
,clauses),datascript$query$expand_rule_$_iter__57278(cljs.core.rest(s__57279__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(branches);
});
datascript.query.remove_pairs = (function datascript$query$remove_pairs(xs,ys){
var pairs = cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (p__57302){
var vec__57303 = p__57302;
var x = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__57303,(0),null);
var y = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__57303,(1),null);
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(x,y);
}),cljs.core.map.cljs$core$IFn$_invoke$arity$3(cljs.core.vector,xs,ys));
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.first,pairs),cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.second,pairs)], null);
});
datascript.query.rule_gen_guards = (function datascript$query$rule_gen_guards(rule_clause,used_args){
var vec__57306 = rule_clause;
var seq__57307 = cljs.core.seq(vec__57306);
var first__57308 = cljs.core.first(seq__57307);
var seq__57307__$1 = cljs.core.next(seq__57307);
var rule = first__57308;
var call_args = seq__57307__$1;
var prev_call_args = cljs.core.get.cljs$core$IFn$_invoke$arity$2(used_args,rule);
var iter__5480__auto__ = (function datascript$query$rule_gen_guards_$_iter__57311(s__57312){
return (new cljs.core.LazySeq(null,(function (){
var s__57312__$1 = s__57312;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__57312__$1);
if(temp__5804__auto__){
var s__57312__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__57312__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__57312__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__57314 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__57313 = (0);
while(true){
if((i__57313 < size__5479__auto__)){
var prev_args = cljs.core._nth(c__5478__auto__,i__57313);
var vec__57326 = datascript.query.remove_pairs(call_args,prev_args);
var call_args__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__57326,(0),null);
var prev_args__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__57326,(1),null);
cljs.core.chunk_append(b__57314,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"-differ?","-differ?",1465687357,null)], null),call_args__$1,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([prev_args__$1], 0))], null));

var G__58075 = (i__57313 + (1));
i__57313 = G__58075;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__57314),datascript$query$rule_gen_guards_$_iter__57311(cljs.core.chunk_rest(s__57312__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__57314),null);
}
} else {
var prev_args = cljs.core.first(s__57312__$2);
var vec__57334 = datascript.query.remove_pairs(call_args,prev_args);
var call_args__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__57334,(0),null);
var prev_args__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__57334,(1),null);
return cljs.core.cons(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"-differ?","-differ?",1465687357,null)], null),call_args__$1,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([prev_args__$1], 0))], null),datascript$query$rule_gen_guards_$_iter__57311(cljs.core.rest(s__57312__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(prev_call_args);
});
datascript.query.walk_collect = (function datascript$query$walk_collect(form,pred){
var res = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentVector.EMPTY);
clojure.walk.postwalk((function (p1__57337_SHARP_){
if(cljs.core.truth_((pred.cljs$core$IFn$_invoke$arity$1 ? pred.cljs$core$IFn$_invoke$arity$1(p1__57337_SHARP_) : pred.call(null,p1__57337_SHARP_)))){
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$3(res,cljs.core.conj,p1__57337_SHARP_);
} else {
}

return p1__57337_SHARP_;
}),form);

return cljs.core.deref(res);
});
datascript.query.collect_vars = (function datascript$query$collect_vars(clause){
return cljs.core.set(datascript.query.walk_collect(clause,datascript.query.free_var_QMARK_));
});
datascript.query.split_guards = (function datascript$query$split_guards(clauses,guards){
var bound_vars = datascript.query.collect_vars(clauses);
var pred = (function (p__57339){
var vec__57340 = p__57339;
var vec__57343 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__57340,(0),null);
var seq__57344 = cljs.core.seq(vec__57343);
var first__57345 = cljs.core.first(seq__57344);
var seq__57344__$1 = cljs.core.next(seq__57344);
var _ = first__57345;
var vars = seq__57344__$1;
return cljs.core.every_QMARK_(bound_vars,vars);
});
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.filter.cljs$core$IFn$_invoke$arity$2(pred,guards),cljs.core.remove.cljs$core$IFn$_invoke$arity$2(pred,guards)], null);
});
datascript.query.solve_rule = (function datascript$query$solve_rule(context,clause){
var final_attrs = cljs.core.filter.cljs$core$IFn$_invoke$arity$2(datascript.query.free_var_QMARK_,clause);
var final_attrs_map = cljs.core.zipmap(final_attrs,cljs.core.range.cljs$core$IFn$_invoke$arity$0());
var solve = (function (prefix_context,clauses){
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3(datascript.query._resolve_clause,prefix_context,clauses);
});
var empty_rels_QMARK_ = (function (context__$1){
return cljs.core.some((function (p1__57346_SHARP_){
return cljs.core.empty_QMARK_(new cljs.core.Keyword(null,"tuples","tuples",-676032639).cljs$core$IFn$_invoke$arity$1(p1__57346_SHARP_));
}),new cljs.core.Keyword(null,"rels","rels",1770187185).cljs$core$IFn$_invoke$arity$1(context__$1));
});
var stack = (new cljs.core.List(null,new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"prefix-clauses","prefix-clauses",1294180028),cljs.core.PersistentVector.EMPTY,new cljs.core.Keyword(null,"prefix-context","prefix-context",-1269613591),context,new cljs.core.Keyword(null,"clauses","clauses",1454841241),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [clause], null),new cljs.core.Keyword(null,"used-args","used-args",23596256),cljs.core.PersistentArrayMap.EMPTY,new cljs.core.Keyword(null,"pending-guards","pending-guards",-1255527308),cljs.core.PersistentArrayMap.EMPTY], null),null,(1),null));
var rel = (new datascript.query.Relation(final_attrs_map,cljs.core.PersistentVector.EMPTY,null,null,null));
while(true){
var temp__5806__auto__ = cljs.core.first(stack);
if((temp__5806__auto__ == null)){
return rel;
} else {
var frame = temp__5806__auto__;
var vec__57379 = cljs.core.split_with(((function (stack,rel,frame,temp__5806__auto__,final_attrs,final_attrs_map,solve,empty_rels_QMARK_){
return (function (p1__57347_SHARP_){
return (!(datascript.query.rule_QMARK_(context,p1__57347_SHARP_)));
});})(stack,rel,frame,temp__5806__auto__,final_attrs,final_attrs_map,solve,empty_rels_QMARK_))
,new cljs.core.Keyword(null,"clauses","clauses",1454841241).cljs$core$IFn$_invoke$arity$1(frame));
var clauses = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__57379,(0),null);
var vec__57382 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__57379,(1),null);
var seq__57383 = cljs.core.seq(vec__57382);
var first__57384 = cljs.core.first(seq__57383);
var seq__57383__$1 = cljs.core.next(seq__57383);
var rule_clause = first__57384;
var next_clauses = seq__57383__$1;
if((rule_clause == null)){
var context__$1 = solve(new cljs.core.Keyword(null,"prefix-context","prefix-context",-1269613591).cljs$core$IFn$_invoke$arity$1(frame),clauses);
var tuples = datascript.util.distinct_by(cljs.core.vec,(datascript.query._collect.cljs$core$IFn$_invoke$arity$2 ? datascript.query._collect.cljs$core$IFn$_invoke$arity$2(context__$1,final_attrs) : datascript.query._collect.call(null,context__$1,final_attrs)));
var new_rel = (new datascript.query.Relation(final_attrs_map,tuples,null,null,null));
var G__58082 = cljs.core.next(stack);
var G__58083 = datascript.query.sum_rel(rel,new_rel);
stack = G__58082;
rel = G__58083;
continue;
} else {
var vec__57387 = rule_clause;
var seq__57388 = cljs.core.seq(vec__57387);
var first__57389 = cljs.core.first(seq__57388);
var seq__57388__$1 = cljs.core.next(seq__57388);
var rule = first__57389;
var call_args = seq__57388__$1;
var guards = datascript.query.rule_gen_guards(rule_clause,new cljs.core.Keyword(null,"used-args","used-args",23596256).cljs$core$IFn$_invoke$arity$1(frame));
var vec__57390 = datascript.query.split_guards(cljs.core.concat.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"prefix-clauses","prefix-clauses",1294180028).cljs$core$IFn$_invoke$arity$1(frame),clauses),cljs.core.concat.cljs$core$IFn$_invoke$arity$2(guards,new cljs.core.Keyword(null,"pending-guards","pending-guards",-1255527308).cljs$core$IFn$_invoke$arity$1(frame)));
var active_gs = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__57390,(0),null);
var pending_gs = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__57390,(1),null);
if(cljs.core.truth_(cljs.core.some(((function (stack,rel,vec__57387,seq__57388,first__57389,seq__57388__$1,rule,call_args,guards,vec__57390,active_gs,pending_gs,vec__57379,clauses,vec__57382,seq__57383,first__57384,seq__57383__$1,rule_clause,next_clauses,frame,temp__5806__auto__,final_attrs,final_attrs_map,solve,empty_rels_QMARK_){
return (function (p1__57348_SHARP_){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(p1__57348_SHARP_,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.list(new cljs.core.Symbol(null,"-differ?","-differ?",1465687357,null))], null));
});})(stack,rel,vec__57387,seq__57388,first__57389,seq__57388__$1,rule,call_args,guards,vec__57390,active_gs,pending_gs,vec__57379,clauses,vec__57382,seq__57383,first__57384,seq__57383__$1,rule_clause,next_clauses,frame,temp__5806__auto__,final_attrs,final_attrs_map,solve,empty_rels_QMARK_))
,active_gs))){
var G__58085 = cljs.core.next(stack);
var G__58086 = rel;
stack = G__58085;
rel = G__58086;
continue;
} else {
var prefix_clauses = cljs.core.concat.cljs$core$IFn$_invoke$arity$2(clauses,active_gs);
var prefix_context = solve(new cljs.core.Keyword(null,"prefix-context","prefix-context",-1269613591).cljs$core$IFn$_invoke$arity$1(frame),prefix_clauses);
if(cljs.core.truth_(empty_rels_QMARK_(prefix_context))){
var G__58088 = cljs.core.next(stack);
var G__58089 = rel;
stack = G__58088;
rel = G__58089;
continue;
} else {
var used_args = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(new cljs.core.Keyword(null,"used-args","used-args",23596256).cljs$core$IFn$_invoke$arity$1(frame),rule,cljs.core.conj.cljs$core$IFn$_invoke$arity$2(cljs.core.get.cljs$core$IFn$_invoke$arity$3(new cljs.core.Keyword(null,"used-args","used-args",23596256).cljs$core$IFn$_invoke$arity$1(frame),rule,cljs.core.PersistentVector.EMPTY),call_args));
var branches = datascript.query.expand_rule(rule_clause,context,used_args);
var G__58091 = cljs.core.concat.cljs$core$IFn$_invoke$arity$2((function (){var iter__5480__auto__ = ((function (stack,rel,used_args,branches,prefix_clauses,prefix_context,vec__57387,seq__57388,first__57389,seq__57388__$1,rule,call_args,guards,vec__57390,active_gs,pending_gs,vec__57379,clauses,vec__57382,seq__57383,first__57384,seq__57383__$1,rule_clause,next_clauses,frame,temp__5806__auto__,final_attrs,final_attrs_map,solve,empty_rels_QMARK_){
return (function datascript$query$solve_rule_$_iter__57400(s__57401){
return (new cljs.core.LazySeq(null,((function (stack,rel,used_args,branches,prefix_clauses,prefix_context,vec__57387,seq__57388,first__57389,seq__57388__$1,rule,call_args,guards,vec__57390,active_gs,pending_gs,vec__57379,clauses,vec__57382,seq__57383,first__57384,seq__57383__$1,rule_clause,next_clauses,frame,temp__5806__auto__,final_attrs,final_attrs_map,solve,empty_rels_QMARK_){
return (function (){
var s__57401__$1 = s__57401;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__57401__$1);
if(temp__5804__auto__){
var s__57401__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__57401__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__57401__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__57403 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__57402 = (0);
while(true){
if((i__57402 < size__5479__auto__)){
var branch = cljs.core._nth(c__5478__auto__,i__57402);
cljs.core.chunk_append(b__57403,new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"prefix-clauses","prefix-clauses",1294180028),prefix_clauses,new cljs.core.Keyword(null,"prefix-context","prefix-context",-1269613591),prefix_context,new cljs.core.Keyword(null,"clauses","clauses",1454841241),datascript.util.concatv.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([branch,next_clauses], 0)),new cljs.core.Keyword(null,"used-args","used-args",23596256),used_args,new cljs.core.Keyword(null,"pending-guards","pending-guards",-1255527308),pending_gs], null));

var G__58097 = (i__57402 + (1));
i__57402 = G__58097;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__57403),datascript$query$solve_rule_$_iter__57400(cljs.core.chunk_rest(s__57401__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__57403),null);
}
} else {
var branch = cljs.core.first(s__57401__$2);
return cljs.core.cons(new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"prefix-clauses","prefix-clauses",1294180028),prefix_clauses,new cljs.core.Keyword(null,"prefix-context","prefix-context",-1269613591),prefix_context,new cljs.core.Keyword(null,"clauses","clauses",1454841241),datascript.util.concatv.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([branch,next_clauses], 0)),new cljs.core.Keyword(null,"used-args","used-args",23596256),used_args,new cljs.core.Keyword(null,"pending-guards","pending-guards",-1255527308),pending_gs], null),datascript$query$solve_rule_$_iter__57400(cljs.core.rest(s__57401__$2)));
}
} else {
return null;
}
break;
}
});})(stack,rel,used_args,branches,prefix_clauses,prefix_context,vec__57387,seq__57388,first__57389,seq__57388__$1,rule,call_args,guards,vec__57390,active_gs,pending_gs,vec__57379,clauses,vec__57382,seq__57383,first__57384,seq__57383__$1,rule_clause,next_clauses,frame,temp__5806__auto__,final_attrs,final_attrs_map,solve,empty_rels_QMARK_))
,null,null));
});})(stack,rel,used_args,branches,prefix_clauses,prefix_context,vec__57387,seq__57388,first__57389,seq__57388__$1,rule,call_args,guards,vec__57390,active_gs,pending_gs,vec__57379,clauses,vec__57382,seq__57383,first__57384,seq__57383__$1,rule_clause,next_clauses,frame,temp__5806__auto__,final_attrs,final_attrs_map,solve,empty_rels_QMARK_))
;
return iter__5480__auto__(branches);
})(),cljs.core.next(stack));
var G__58092 = rel;
stack = G__58091;
rel = G__58092;
continue;
}
}
}
}
break;
}
});
datascript.query.dynamic_lookup_attrs = (function datascript$query$dynamic_lookup_attrs(source,pattern){
var vec__57422 = pattern;
var e = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__57422,(0),null);
var a = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__57422,(1),null);
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__57422,(2),null);
var tx = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__57422,(3),null);
var G__57426 = cljs.core.PersistentHashSet.EMPTY;
var G__57426__$1 = ((datascript.query.free_var_QMARK_(e))?cljs.core.conj.cljs$core$IFn$_invoke$arity$2(G__57426,e):G__57426);
var G__57426__$2 = ((datascript.query.free_var_QMARK_(tx))?cljs.core.conj.cljs$core$IFn$_invoke$arity$2(G__57426__$1,tx):G__57426__$1);
if(((datascript.query.free_var_QMARK_(v)) && ((((!(datascript.query.free_var_QMARK_(a)))) && (datascript.db.ref_QMARK_(source,a)))))){
return cljs.core.conj.cljs$core$IFn$_invoke$arity$2(G__57426__$2,v);
} else {
return G__57426__$2;
}
});
datascript.query.limit_rel = (function datascript$query$limit_rel(rel,vars){
var temp__5808__auto__ = cljs.core.not_empty(cljs.core.select_keys(new cljs.core.Keyword(null,"attrs","attrs",-2090668713).cljs$core$IFn$_invoke$arity$1(rel),vars));
if((temp__5808__auto__ == null)){
return null;
} else {
var attrs_SINGLEQUOTE_ = temp__5808__auto__;
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(rel,new cljs.core.Keyword(null,"attrs","attrs",-2090668713),attrs_SINGLEQUOTE_);
}
});
datascript.query.limit_context = (function datascript$query$limit_context(context,vars){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(context,new cljs.core.Keyword(null,"rels","rels",1770187185),cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (p1__57431_SHARP_){
return datascript.query.limit_rel(p1__57431_SHARP_,vars);
}),new cljs.core.Keyword(null,"rels","rels",1770187185).cljs$core$IFn$_invoke$arity$1(context)));
});
datascript.query.bound_vars = (function datascript$query$bound_vars(context){
return cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentHashSet.EMPTY,cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (p1__57438_SHARP_){
return cljs.core.keys(new cljs.core.Keyword(null,"attrs","attrs",-2090668713).cljs$core$IFn$_invoke$arity$1(p1__57438_SHARP_));
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"rels","rels",1770187185).cljs$core$IFn$_invoke$arity$1(context)], 0)));
});
datascript.query.check_bound = (function datascript$query$check_bound(bound,vars,form){
if(clojure.set.subset_QMARK_(vars,bound)){
return null;
} else {
var missing = clojure.set.difference.cljs$core$IFn$_invoke$arity$2(cljs.core.set(vars),bound);
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2(["Insufficient bindings: ",cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([missing], 0))," not bound in ",cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([form], 0))].join(''),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"error","error",-978969032),new cljs.core.Keyword("query","where","query/where",-1935159429),new cljs.core.Keyword(null,"form","form",-1624062471),form,new cljs.core.Keyword(null,"vars","vars",-2046957217),missing], null));
}
});
datascript.query.check_free_same = (function datascript$query$check_free_same(bound,branches,form){
var free = cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (p1__57452_SHARP_){
return clojure.set.difference.cljs$core$IFn$_invoke$arity$2(datascript.query.collect_vars(p1__57452_SHARP_),bound);
}),branches);
if(cljs.core.truth_(cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core._EQ_,free))){
return null;
} else {
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2(["All clauses in 'or' must use same set of free vars, had ",cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([free], 0))," in ",cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([form], 0))].join(''),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"error","error",-978969032),new cljs.core.Keyword("query","where","query/where",-1935159429),new cljs.core.Keyword(null,"form","form",-1624062471),form,new cljs.core.Keyword(null,"vars","vars",-2046957217),free], null));
}
});
datascript.query.check_free_subset = (function datascript$query$check_free_subset(bound,vars,branches){
var free = cljs.core.set(cljs.core.remove.cljs$core$IFn$_invoke$arity$2(bound,vars));
var seq__57459 = cljs.core.seq(branches);
var chunk__57460 = null;
var count__57461 = (0);
var i__57462 = (0);
while(true){
if((i__57462 < count__57461)){
var branch = chunk__57460.cljs$core$IIndexed$_nth$arity$2(null,i__57462);
var temp__5808__auto___58098 = cljs.core.not_empty(clojure.set.difference.cljs$core$IFn$_invoke$arity$2(free,datascript.query.collect_vars(branch)));
if((temp__5808__auto___58098 == null)){
} else {
var missing_58099 = temp__5808__auto___58098;
cljs.core.prn.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([branch,bound,vars,free], 0));

throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2(["All clauses in 'or' must use same set of free vars, had ",cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([missing_58099], 0))," not bound in ",cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([branch], 0))].join(''),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"error","error",-978969032),new cljs.core.Keyword("query","where","query/where",-1935159429),new cljs.core.Keyword(null,"form","form",-1624062471),branch,new cljs.core.Keyword(null,"vars","vars",-2046957217),missing_58099], null));
}


var G__58100 = seq__57459;
var G__58101 = chunk__57460;
var G__58102 = count__57461;
var G__58103 = (i__57462 + (1));
seq__57459 = G__58100;
chunk__57460 = G__58101;
count__57461 = G__58102;
i__57462 = G__58103;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__57459);
if(temp__5804__auto__){
var seq__57459__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__57459__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__57459__$1);
var G__58104 = cljs.core.chunk_rest(seq__57459__$1);
var G__58105 = c__5525__auto__;
var G__58106 = cljs.core.count(c__5525__auto__);
var G__58107 = (0);
seq__57459 = G__58104;
chunk__57460 = G__58105;
count__57461 = G__58106;
i__57462 = G__58107;
continue;
} else {
var branch = cljs.core.first(seq__57459__$1);
var temp__5808__auto___58108 = cljs.core.not_empty(clojure.set.difference.cljs$core$IFn$_invoke$arity$2(free,datascript.query.collect_vars(branch)));
if((temp__5808__auto___58108 == null)){
} else {
var missing_58109 = temp__5808__auto___58108;
cljs.core.prn.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([branch,bound,vars,free], 0));

throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2(["All clauses in 'or' must use same set of free vars, had ",cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([missing_58109], 0))," not bound in ",cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([branch], 0))].join(''),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"error","error",-978969032),new cljs.core.Keyword("query","where","query/where",-1935159429),new cljs.core.Keyword(null,"form","form",-1624062471),branch,new cljs.core.Keyword(null,"vars","vars",-2046957217),missing_58109], null));
}


var G__58110 = cljs.core.next(seq__57459__$1);
var G__58111 = null;
var G__58112 = (0);
var G__58113 = (0);
seq__57459 = G__58110;
chunk__57460 = G__58111;
count__57461 = G__58112;
i__57462 = G__58113;
continue;
}
} else {
return null;
}
}
break;
}
});
datascript.query._resolve_clause = (function datascript$query$_resolve_clause(var_args){
var G__57498 = arguments.length;
switch (G__57498) {
case 2:
return datascript.query._resolve_clause.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return datascript.query._resolve_clause.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(datascript.query._resolve_clause.cljs$core$IFn$_invoke$arity$2 = (function (context,clause){
return datascript.query._resolve_clause.cljs$core$IFn$_invoke$arity$3(context,clause,clause);
}));

(datascript.query._resolve_clause.cljs$core$IFn$_invoke$arity$3 = (function (context,clause,orig_clause){
while(true){
var pred__57505 = datascript.query.looks_like_QMARK_;
var expr__57506 = clause;
if(cljs.core.truth_((function (){var G__57509 = new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.symbol_QMARK_,new cljs.core.Symbol(null,"*","*",345799209,null)], null)], null);
var G__57510 = expr__57506;
return (pred__57505.cljs$core$IFn$_invoke$arity$2 ? pred__57505.cljs$core$IFn$_invoke$arity$2(G__57509,G__57510) : pred__57505.call(null,G__57509,G__57510));
})())){
datascript.query.check_bound(datascript.query.bound_vars(context),cljs.core.filter.cljs$core$IFn$_invoke$arity$2(datascript.query.free_var_QMARK_,cljs.core.nfirst(clause)),clause);

return datascript.query.filter_by_pred(context,clause);
} else {
if(cljs.core.truth_((function (){var G__57513 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.symbol_QMARK_,new cljs.core.Symbol(null,"*","*",345799209,null)], null),new cljs.core.Symbol(null,"_","_",-1201019570,null)], null);
var G__57514 = expr__57506;
return (pred__57505.cljs$core$IFn$_invoke$arity$2 ? pred__57505.cljs$core$IFn$_invoke$arity$2(G__57513,G__57514) : pred__57505.call(null,G__57513,G__57514));
})())){
datascript.query.check_bound(datascript.query.bound_vars(context),cljs.core.filter.cljs$core$IFn$_invoke$arity$2(datascript.query.free_var_QMARK_,cljs.core.nfirst(clause)),clause);

return datascript.query.bind_by_fn(context,clause);
} else {
if(cljs.core.truth_((function (){var G__57515 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [datascript.query.source_QMARK_,new cljs.core.Symbol(null,"*","*",345799209,null)], null);
var G__57516 = expr__57506;
return (pred__57505.cljs$core$IFn$_invoke$arity$2 ? pred__57505.cljs$core$IFn$_invoke$arity$2(G__57515,G__57516) : pred__57505.call(null,G__57515,G__57516));
})())){
var vec__57519 = clause;
var seq__57520 = cljs.core.seq(vec__57519);
var first__57522 = cljs.core.first(seq__57520);
var seq__57520__$1 = cljs.core.next(seq__57520);
var source_sym = first__57522;
var rest = seq__57520__$1;
var _STAR_implicit_source_STAR__orig_val__57526 = datascript.query._STAR_implicit_source_STAR_;
var _STAR_implicit_source_STAR__temp_val__57527 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"sources","sources",-321166424).cljs$core$IFn$_invoke$arity$1(context),source_sym);
(datascript.query._STAR_implicit_source_STAR_ = _STAR_implicit_source_STAR__temp_val__57527);

try{return datascript.query._resolve_clause.cljs$core$IFn$_invoke$arity$3(context,rest,clause);
}finally {(datascript.query._STAR_implicit_source_STAR_ = _STAR_implicit_source_STAR__orig_val__57526);
}} else {
if(cljs.core.truth_((function (){var G__57533 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"or","or",1876275696,null),new cljs.core.Symbol(null,"*","*",345799209,null)], null);
var G__57534 = expr__57506;
return (pred__57505.cljs$core$IFn$_invoke$arity$2 ? pred__57505.cljs$core$IFn$_invoke$arity$2(G__57533,G__57534) : pred__57505.call(null,G__57533,G__57534));
})())){
var vec__57535 = clause;
var seq__57536 = cljs.core.seq(vec__57535);
var first__57537 = cljs.core.first(seq__57536);
var seq__57536__$1 = cljs.core.next(seq__57536);
var _ = first__57537;
var branches = seq__57536__$1;
var ___$1 = datascript.query.check_free_same(datascript.query.bound_vars(context),branches,clause);
var contexts = cljs.core.map.cljs$core$IFn$_invoke$arity$2(((function (context,clause,orig_clause,vec__57535,seq__57536,first__57537,seq__57536__$1,_,branches,___$1,pred__57505,expr__57506){
return (function (p1__57485_SHARP_){
return (datascript.query.resolve_clause.cljs$core$IFn$_invoke$arity$2 ? datascript.query.resolve_clause.cljs$core$IFn$_invoke$arity$2(context,p1__57485_SHARP_) : datascript.query.resolve_clause.call(null,context,p1__57485_SHARP_));
});})(context,clause,orig_clause,vec__57535,seq__57536,first__57537,seq__57536__$1,_,branches,___$1,pred__57505,expr__57506))
,branches);
var rels = cljs.core.map.cljs$core$IFn$_invoke$arity$2(((function (context,clause,orig_clause,vec__57535,seq__57536,first__57537,seq__57536__$1,_,branches,___$1,contexts,pred__57505,expr__57506){
return (function (p1__57486_SHARP_){
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$2(datascript.query.hash_join,new cljs.core.Keyword(null,"rels","rels",1770187185).cljs$core$IFn$_invoke$arity$1(p1__57486_SHARP_));
});})(context,clause,orig_clause,vec__57535,seq__57536,first__57537,seq__57536__$1,_,branches,___$1,contexts,pred__57505,expr__57506))
,contexts);
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(cljs.core.first(contexts),new cljs.core.Keyword(null,"rels","rels",1770187185),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.reduce.cljs$core$IFn$_invoke$arity$2(datascript.query.sum_rel,rels)], null));
} else {
if(cljs.core.truth_((function (){var G__57538 = new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"or-join","or-join",591375469,null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"*","*",345799209,null)], null),new cljs.core.Symbol(null,"*","*",345799209,null)], null),new cljs.core.Symbol(null,"*","*",345799209,null)], null);
var G__57539 = expr__57506;
return (pred__57505.cljs$core$IFn$_invoke$arity$2 ? pred__57505.cljs$core$IFn$_invoke$arity$2(G__57538,G__57539) : pred__57505.call(null,G__57538,G__57539));
})())){
var vec__57542 = clause;
var seq__57543 = cljs.core.seq(vec__57542);
var first__57544 = cljs.core.first(seq__57543);
var seq__57543__$1 = cljs.core.next(seq__57543);
var _ = first__57544;
var first__57544__$1 = cljs.core.first(seq__57543__$1);
var seq__57543__$2 = cljs.core.next(seq__57543__$1);
var vec__57545 = first__57544__$1;
var seq__57546 = cljs.core.seq(vec__57545);
var first__57547 = cljs.core.first(seq__57546);
var seq__57546__$1 = cljs.core.next(seq__57546);
var req_vars = first__57547;
var vars = seq__57546__$1;
var branches = seq__57543__$2;
var bound = datascript.query.bound_vars(context);
datascript.query.check_bound(bound,req_vars,orig_clause);

datascript.query.check_free_subset(bound,vars,branches);

var G__58115 = context;
var G__58116 = cljs.core.list_STAR_.cljs$core$IFn$_invoke$arity$3(new cljs.core.Symbol(null,"or-join","or-join",591375469,null),cljs.core.concat.cljs$core$IFn$_invoke$arity$2(req_vars,vars),branches);
var G__58117 = clause;
context = G__58115;
clause = G__58116;
orig_clause = G__58117;
continue;
} else {
if(cljs.core.truth_((function (){var G__57550 = new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"or-join","or-join",591375469,null),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"*","*",345799209,null)], null),new cljs.core.Symbol(null,"*","*",345799209,null)], null);
var G__57551 = expr__57506;
return (pred__57505.cljs$core$IFn$_invoke$arity$2 ? pred__57505.cljs$core$IFn$_invoke$arity$2(G__57550,G__57551) : pred__57505.call(null,G__57550,G__57551));
})())){
var vec__57553 = clause;
var seq__57554 = cljs.core.seq(vec__57553);
var first__57555 = cljs.core.first(seq__57554);
var seq__57554__$1 = cljs.core.next(seq__57554);
var _ = first__57555;
var first__57555__$1 = cljs.core.first(seq__57554__$1);
var seq__57554__$2 = cljs.core.next(seq__57554__$1);
var vars = first__57555__$1;
var branches = seq__57554__$2;
var vars__$1 = cljs.core.set(vars);
var ___$1 = datascript.query.check_free_subset(datascript.query.bound_vars(context),vars__$1,branches);
var join_context = datascript.query.limit_context(context,vars__$1);
var contexts = cljs.core.map.cljs$core$IFn$_invoke$arity$2(((function (context,clause,orig_clause,vec__57553,seq__57554,first__57555,seq__57554__$1,_,first__57555__$1,seq__57554__$2,vars,branches,vars__$1,___$1,join_context,pred__57505,expr__57506){
return (function (p1__57489_SHARP_){
return datascript.query.limit_context((datascript.query.resolve_clause.cljs$core$IFn$_invoke$arity$2 ? datascript.query.resolve_clause.cljs$core$IFn$_invoke$arity$2(join_context,p1__57489_SHARP_) : datascript.query.resolve_clause.call(null,join_context,p1__57489_SHARP_)),vars__$1);
});})(context,clause,orig_clause,vec__57553,seq__57554,first__57555,seq__57554__$1,_,first__57555__$1,seq__57554__$2,vars,branches,vars__$1,___$1,join_context,pred__57505,expr__57506))
,branches);
var rels = cljs.core.map.cljs$core$IFn$_invoke$arity$2(((function (context,clause,orig_clause,vec__57553,seq__57554,first__57555,seq__57554__$1,_,first__57555__$1,seq__57554__$2,vars,branches,vars__$1,___$1,join_context,contexts,pred__57505,expr__57506){
return (function (p1__57490_SHARP_){
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$2(datascript.query.hash_join,new cljs.core.Keyword(null,"rels","rels",1770187185).cljs$core$IFn$_invoke$arity$1(p1__57490_SHARP_));
});})(context,clause,orig_clause,vec__57553,seq__57554,first__57555,seq__57554__$1,_,first__57555__$1,seq__57554__$2,vars,branches,vars__$1,___$1,join_context,contexts,pred__57505,expr__57506))
,contexts);
var sum_rel = cljs.core.reduce.cljs$core$IFn$_invoke$arity$2(datascript.query.sum_rel,rels);
return cljs.core.update.cljs$core$IFn$_invoke$arity$4(context,new cljs.core.Keyword(null,"rels","rels",1770187185),datascript.query.collapse_rels,sum_rel);
} else {
if(cljs.core.truth_((function (){var G__57562 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"and","and",668631710,null),new cljs.core.Symbol(null,"*","*",345799209,null)], null);
var G__57563 = expr__57506;
return (pred__57505.cljs$core$IFn$_invoke$arity$2 ? pred__57505.cljs$core$IFn$_invoke$arity$2(G__57562,G__57563) : pred__57505.call(null,G__57562,G__57563));
})())){
var vec__57565 = clause;
var seq__57566 = cljs.core.seq(vec__57565);
var first__57567 = cljs.core.first(seq__57566);
var seq__57566__$1 = cljs.core.next(seq__57566);
var _ = first__57567;
var clauses = seq__57566__$1;
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3(datascript.query.resolve_clause,context,clauses);
} else {
if(cljs.core.truth_((function (){var G__57570 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"not","not",1044554643,null),new cljs.core.Symbol(null,"*","*",345799209,null)], null);
var G__57571 = expr__57506;
return (pred__57505.cljs$core$IFn$_invoke$arity$2 ? pred__57505.cljs$core$IFn$_invoke$arity$2(G__57570,G__57571) : pred__57505.call(null,G__57570,G__57571));
})())){
var vec__57574 = clause;
var seq__57575 = cljs.core.seq(vec__57574);
var first__57576 = cljs.core.first(seq__57575);
var seq__57575__$1 = cljs.core.next(seq__57575);
var _ = first__57576;
var clauses = seq__57575__$1;
var bound = datascript.query.bound_vars(context);
var negation_vars = datascript.query.collect_vars(clauses);
var ___$1 = ((cljs.core.empty_QMARK_(clojure.set.intersection.cljs$core$IFn$_invoke$arity$2(bound,negation_vars)))?(function(){throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2(["Insufficient bindings: none of ",cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([negation_vars], 0))," is bound in ",cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([orig_clause], 0))].join(''),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"error","error",-978969032),new cljs.core.Keyword("query","where","query/where",-1935159429),new cljs.core.Keyword(null,"form","form",-1624062471),orig_clause], null))})():null);
var context_SINGLEQUOTE_ = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(context,new cljs.core.Keyword(null,"rels","rels",1770187185),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.reduce.cljs$core$IFn$_invoke$arity$2(datascript.query.hash_join,new cljs.core.Keyword(null,"rels","rels",1770187185).cljs$core$IFn$_invoke$arity$1(context))], null));
var negation_context = cljs.core.reduce.cljs$core$IFn$_invoke$arity$3(datascript.query.resolve_clause,context_SINGLEQUOTE_,clauses);
var negation = datascript.query.subtract_rel(datascript.util.single(new cljs.core.Keyword(null,"rels","rels",1770187185).cljs$core$IFn$_invoke$arity$1(context_SINGLEQUOTE_)),cljs.core.reduce.cljs$core$IFn$_invoke$arity$2(datascript.query.hash_join,new cljs.core.Keyword(null,"rels","rels",1770187185).cljs$core$IFn$_invoke$arity$1(negation_context)));
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(context_SINGLEQUOTE_,new cljs.core.Keyword(null,"rels","rels",1770187185),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [negation], null));
} else {
if(cljs.core.truth_((function (){var G__57582 = new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"not-join","not-join",-645515756,null),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"*","*",345799209,null)], null),new cljs.core.Symbol(null,"*","*",345799209,null)], null);
var G__57583 = expr__57506;
return (pred__57505.cljs$core$IFn$_invoke$arity$2 ? pred__57505.cljs$core$IFn$_invoke$arity$2(G__57582,G__57583) : pred__57505.call(null,G__57582,G__57583));
})())){
var vec__57584 = clause;
var seq__57585 = cljs.core.seq(vec__57584);
var first__57586 = cljs.core.first(seq__57585);
var seq__57585__$1 = cljs.core.next(seq__57585);
var _ = first__57586;
var first__57586__$1 = cljs.core.first(seq__57585__$1);
var seq__57585__$2 = cljs.core.next(seq__57585__$1);
var vars = first__57586__$1;
var clauses = seq__57585__$2;
var bound = datascript.query.bound_vars(context);
var ___$1 = datascript.query.check_bound(bound,vars,orig_clause);
var context_SINGLEQUOTE_ = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(context,new cljs.core.Keyword(null,"rels","rels",1770187185),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.reduce.cljs$core$IFn$_invoke$arity$2(datascript.query.hash_join,new cljs.core.Keyword(null,"rels","rels",1770187185).cljs$core$IFn$_invoke$arity$1(context))], null));
var join_context = datascript.query.limit_context(context_SINGLEQUOTE_,vars);
var negation_context = datascript.query.limit_context(cljs.core.reduce.cljs$core$IFn$_invoke$arity$3(datascript.query.resolve_clause,join_context,clauses),vars);
var negation = datascript.query.subtract_rel(datascript.util.single(new cljs.core.Keyword(null,"rels","rels",1770187185).cljs$core$IFn$_invoke$arity$1(context_SINGLEQUOTE_)),cljs.core.reduce.cljs$core$IFn$_invoke$arity$2(datascript.query.hash_join,new cljs.core.Keyword(null,"rels","rels",1770187185).cljs$core$IFn$_invoke$arity$1(negation_context)));
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(context_SINGLEQUOTE_,new cljs.core.Keyword(null,"rels","rels",1770187185),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [negation], null));
} else {
if(cljs.core.truth_((function (){var G__57591 = new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"*","*",345799209,null)], null);
var G__57592 = expr__57506;
return (pred__57505.cljs$core$IFn$_invoke$arity$2 ? pred__57505.cljs$core$IFn$_invoke$arity$2(G__57591,G__57592) : pred__57505.call(null,G__57591,G__57592));
})())){
var source = datascript.query._STAR_implicit_source_STAR_;
var pattern_SINGLEQUOTE_ = datascript.query.resolve_pattern_lookup_refs(source,clause);
var relation = datascript.query.lookup_pattern(context,source,pattern_SINGLEQUOTE_);
var _STAR_lookup_attrs_STAR__orig_val__57596 = datascript.query._STAR_lookup_attrs_STAR_;
var _STAR_lookup_attrs_STAR__temp_val__57597 = (((((!((source == null))))?((((false) || ((cljs.core.PROTOCOL_SENTINEL === source.datascript$db$IDB$))))?true:(((!source.cljs$lang$protocol_mask$partition$))?cljs.core.native_satisfies_QMARK_(datascript.db.IDB,source):false)):cljs.core.native_satisfies_QMARK_(datascript.db.IDB,source)))?datascript.query.dynamic_lookup_attrs(source,pattern_SINGLEQUOTE_):datascript.query._STAR_lookup_attrs_STAR_);
(datascript.query._STAR_lookup_attrs_STAR_ = _STAR_lookup_attrs_STAR__temp_val__57597);

try{return cljs.core.update.cljs$core$IFn$_invoke$arity$4(context,new cljs.core.Keyword(null,"rels","rels",1770187185),datascript.query.collapse_rels,relation);
}finally {(datascript.query._STAR_lookup_attrs_STAR_ = _STAR_lookup_attrs_STAR__orig_val__57596);
}} else {
throw (new Error(["No matching clause: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(expr__57506)].join('')));
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
break;
}
}));

(datascript.query._resolve_clause.cljs$lang$maxFixedArity = 3);

datascript.query.resolve_clause = (function datascript$query$resolve_clause(context,clause){
if(cljs.core.truth_(cljs.core.some(cljs.core.comp.cljs$core$IFn$_invoke$arity$2(cljs.core.empty_QMARK_,new cljs.core.Keyword(null,"tuples","tuples",-676032639)),new cljs.core.Keyword(null,"rels","rels",1770187185).cljs$core$IFn$_invoke$arity$1(context)))){
return context;
} else {
if(datascript.query.rule_QMARK_(context,clause)){
if(datascript.query.source_QMARK_(cljs.core.first(clause))){
var _STAR_implicit_source_STAR__orig_val__57626 = datascript.query._STAR_implicit_source_STAR_;
var _STAR_implicit_source_STAR__temp_val__57627 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"sources","sources",-321166424).cljs$core$IFn$_invoke$arity$1(context),cljs.core.first(clause));
(datascript.query._STAR_implicit_source_STAR_ = _STAR_implicit_source_STAR__temp_val__57627);

try{var G__57629 = context;
var G__57630 = cljs.core.next(clause);
return (datascript.query.resolve_clause.cljs$core$IFn$_invoke$arity$2 ? datascript.query.resolve_clause.cljs$core$IFn$_invoke$arity$2(G__57629,G__57630) : datascript.query.resolve_clause.call(null,G__57629,G__57630));
}finally {(datascript.query._STAR_implicit_source_STAR_ = _STAR_implicit_source_STAR__orig_val__57626);
}} else {
return cljs.core.update.cljs$core$IFn$_invoke$arity$4(context,new cljs.core.Keyword(null,"rels","rels",1770187185),datascript.query.collapse_rels,datascript.query.solve_rule(context,clause));
}
} else {
return datascript.query._resolve_clause.cljs$core$IFn$_invoke$arity$2(context,clause);
}
}
});
datascript.query._q = (function datascript$query$_q(context,clauses){
var _STAR_implicit_source_STAR__orig_val__57644 = datascript.query._STAR_implicit_source_STAR_;
var _STAR_implicit_source_STAR__temp_val__57645 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"sources","sources",-321166424).cljs$core$IFn$_invoke$arity$1(context),new cljs.core.Symbol(null,"$","$",-1580747756,null));
(datascript.query._STAR_implicit_source_STAR_ = _STAR_implicit_source_STAR__temp_val__57645);

try{return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3(datascript.query.resolve_clause,context,clauses);
}finally {(datascript.query._STAR_implicit_source_STAR_ = _STAR_implicit_source_STAR__orig_val__57644);
}});
datascript.query._collect_tuples = (function datascript$query$_collect_tuples(acc,rel,len,copy_map){
return cljs.core.__GT_Eduction(cljs.core.comp.cljs$core$IFn$_invoke$arity$2(cljs.core.map.cljs$core$IFn$_invoke$arity$1((function (t1){
return cljs.core.__GT_Eduction(cljs.core.map.cljs$core$IFn$_invoke$arity$1((function (t2){
var res = cljs.core.aclone(t1);
var n__5593__auto___58120 = len;
var i_58121 = (0);
while(true){
if((i_58121 < n__5593__auto___58120)){
var temp__5808__auto___58122 = (copy_map[i_58121]);
if((temp__5808__auto___58122 == null)){
} else {
var idx_58123 = temp__5808__auto___58122;
(res[i_58121] = (t2[idx_58123]));
}

var G__58124 = (i_58121 + (1));
i_58121 = G__58124;
continue;
} else {
}
break;
}

return res;
})),new cljs.core.Keyword(null,"tuples","tuples",-676032639).cljs$core$IFn$_invoke$arity$1(rel));
})),cljs.core.cat),acc);
});
datascript.query._collect = (function datascript$query$_collect(var_args){
var G__57668 = arguments.length;
switch (G__57668) {
case 2:
return datascript.query._collect.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return datascript.query._collect.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(datascript.query._collect.cljs$core$IFn$_invoke$arity$2 = (function (context,symbols){
var rels = new cljs.core.Keyword(null,"rels","rels",1770187185).cljs$core$IFn$_invoke$arity$1(context);
return datascript.query._collect.cljs$core$IFn$_invoke$arity$3(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [me.tonsky.persistent_sorted_set.arrays.make_array(cljs.core.count(symbols))], null),rels,symbols);
}));

(datascript.query._collect.cljs$core$IFn$_invoke$arity$3 = (function (acc,rels,symbols){
while(true){
var rel = cljs.core.first(rels);
if((rel == null)){
return acc;
} else {
if(cljs.core.empty_QMARK_(new cljs.core.Keyword(null,"tuples","tuples",-676032639).cljs$core$IFn$_invoke$arity$1(rel))){
return cljs.core.PersistentVector.EMPTY;
} else {
var keep_attrs = cljs.core.select_keys(new cljs.core.Keyword(null,"attrs","attrs",-2090668713).cljs$core$IFn$_invoke$arity$1(rel),symbols);
if(cljs.core.empty_QMARK_(keep_attrs)){
var G__58126 = acc;
var G__58127 = cljs.core.next(rels);
var G__58128 = symbols;
acc = G__58126;
rels = G__58127;
symbols = G__58128;
continue;
} else {
var copy_map = cljs.core.to_array(cljs.core.map.cljs$core$IFn$_invoke$arity$2(((function (acc,rels,symbols,keep_attrs,rel){
return (function (p1__57662_SHARP_){
return cljs.core.get.cljs$core$IFn$_invoke$arity$2(keep_attrs,p1__57662_SHARP_);
});})(acc,rels,symbols,keep_attrs,rel))
,symbols));
var len = cljs.core.count(symbols);
var G__58129 = datascript.query._collect_tuples(acc,rel,len,copy_map);
var G__58130 = cljs.core.next(rels);
var G__58131 = symbols;
acc = G__58129;
rels = G__58130;
symbols = G__58131;
continue;

}
}
}
break;
}
}));

(datascript.query._collect.cljs$lang$maxFixedArity = 3);

datascript.query.collect = (function datascript$query$collect(context,symbols){
return cljs.core.into.cljs$core$IFn$_invoke$arity$3(cljs.core.PersistentHashSet.EMPTY,cljs.core.map.cljs$core$IFn$_invoke$arity$1(cljs.core.vec),datascript.query._collect.cljs$core$IFn$_invoke$arity$2(context,symbols));
});

/**
 * @interface
 */
datascript.query.IContextResolve = function(){};

var datascript$query$IContextResolve$_context_resolve$dyn_58132 = (function (var$,context){
var x__5350__auto__ = (((var$ == null))?null:var$);
var m__5351__auto__ = (datascript.query._context_resolve[goog.typeOf(x__5350__auto__)]);
if((!((m__5351__auto__ == null)))){
return (m__5351__auto__.cljs$core$IFn$_invoke$arity$2 ? m__5351__auto__.cljs$core$IFn$_invoke$arity$2(var$,context) : m__5351__auto__.call(null,var$,context));
} else {
var m__5349__auto__ = (datascript.query._context_resolve["_"]);
if((!((m__5349__auto__ == null)))){
return (m__5349__auto__.cljs$core$IFn$_invoke$arity$2 ? m__5349__auto__.cljs$core$IFn$_invoke$arity$2(var$,context) : m__5349__auto__.call(null,var$,context));
} else {
throw cljs.core.missing_protocol("IContextResolve.-context-resolve",var$);
}
}
});
datascript.query._context_resolve = (function datascript$query$_context_resolve(var$,context){
if((((!((var$ == null)))) && ((!((var$.datascript$query$IContextResolve$_context_resolve$arity$2 == null)))))){
return var$.datascript$query$IContextResolve$_context_resolve$arity$2(var$,context);
} else {
return datascript$query$IContextResolve$_context_resolve$dyn_58132(var$,context);
}
});

(datascript.parser.Variable.prototype.datascript$query$IContextResolve$ = cljs.core.PROTOCOL_SENTINEL);

(datascript.parser.Variable.prototype.datascript$query$IContextResolve$_context_resolve$arity$2 = (function (var$,context){
var var$__$1 = this;
return datascript.query.context_resolve_val(context,var$__$1.symbol);
}));

(datascript.parser.SrcVar.prototype.datascript$query$IContextResolve$ = cljs.core.PROTOCOL_SENTINEL);

(datascript.parser.SrcVar.prototype.datascript$query$IContextResolve$_context_resolve$arity$2 = (function (var$,context){
var var$__$1 = this;
return cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(context,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"sources","sources",-321166424),var$__$1.symbol], null));
}));

(datascript.parser.PlainSymbol.prototype.datascript$query$IContextResolve$ = cljs.core.PROTOCOL_SENTINEL);

(datascript.parser.PlainSymbol.prototype.datascript$query$IContextResolve$_context_resolve$arity$2 = (function (var$,_){
var var$__$1 = this;
var or__5002__auto__ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(datascript.built_ins.aggregates,var$__$1.symbol);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return datascript.query.resolve_sym(var$__$1.symbol);
}
}));

(datascript.parser.Constant.prototype.datascript$query$IContextResolve$ = cljs.core.PROTOCOL_SENTINEL);

(datascript.parser.Constant.prototype.datascript$query$IContextResolve$_context_resolve$arity$2 = (function (var$,_){
var var$__$1 = this;
return var$__$1.value;
}));
datascript.query._aggregate = (function datascript$query$_aggregate(find_elements,context,tuples){
return cljs.core.mapv.cljs$core$IFn$_invoke$arity$4((function (element,fixed_value,i){
if(datascript.parser.aggregate_QMARK_(element)){
var f = datascript.query._context_resolve(new cljs.core.Keyword(null,"fn","fn",-1175266204).cljs$core$IFn$_invoke$arity$1(element),context);
var args = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__57719_SHARP_){
return datascript.query._context_resolve(p1__57719_SHARP_,context);
}),cljs.core.butlast(new cljs.core.Keyword(null,"args","args",1315556576).cljs$core$IFn$_invoke$arity$1(element)));
var vals = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__57720_SHARP_){
return cljs.core.nth.cljs$core$IFn$_invoke$arity$2(p1__57720_SHARP_,i);
}),tuples);
return cljs.core.apply.cljs$core$IFn$_invoke$arity$2(f,cljs.core.concat.cljs$core$IFn$_invoke$arity$2(args,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [vals], null)));
} else {
return fixed_value;
}
}),find_elements,cljs.core.first(tuples),cljs.core.range.cljs$core$IFn$_invoke$arity$0());
});
datascript.query.idxs_of = (function datascript$query$idxs_of(pred,coll){
return cljs.core.remove.cljs$core$IFn$_invoke$arity$2(cljs.core.nil_QMARK_,cljs.core.map.cljs$core$IFn$_invoke$arity$3((function (p1__57735_SHARP_,p2__57736_SHARP_){
if(cljs.core.truth_((pred.cljs$core$IFn$_invoke$arity$1 ? pred.cljs$core$IFn$_invoke$arity$1(p1__57735_SHARP_) : pred.call(null,p1__57735_SHARP_)))){
return p2__57736_SHARP_;
} else {
return null;
}
}),coll,cljs.core.range.cljs$core$IFn$_invoke$arity$0()));
});
datascript.query.aggregate = (function datascript$query$aggregate(find_elements,context,resultset){
var group_idxs = datascript.query.idxs_of(cljs.core.complement(datascript.parser.aggregate_QMARK_),find_elements);
var group_fn = (function (tuple){
return cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__57750_SHARP_){
return cljs.core.nth.cljs$core$IFn$_invoke$arity$2(tuple,p1__57750_SHARP_);
}),group_idxs);
});
var grouped = cljs.core.group_by(group_fn,resultset);
var iter__5480__auto__ = (function datascript$query$aggregate_$_iter__57754(s__57755){
return (new cljs.core.LazySeq(null,(function (){
var s__57755__$1 = s__57755;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__57755__$1);
if(temp__5804__auto__){
var s__57755__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__57755__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__57755__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__57757 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__57756 = (0);
while(true){
if((i__57756 < size__5479__auto__)){
var vec__57765 = cljs.core._nth(c__5478__auto__,i__57756);
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__57765,(0),null);
var tuples = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__57765,(1),null);
cljs.core.chunk_append(b__57757,datascript.query._aggregate(find_elements,context,tuples));

var G__58147 = (i__57756 + (1));
i__57756 = G__58147;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__57757),datascript$query$aggregate_$_iter__57754(cljs.core.chunk_rest(s__57755__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__57757),null);
}
} else {
var vec__57778 = cljs.core.first(s__57755__$2);
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__57778,(0),null);
var tuples = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__57778,(1),null);
return cljs.core.cons(datascript.query._aggregate(find_elements,context,tuples),datascript$query$aggregate_$_iter__57754(cljs.core.rest(s__57755__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(grouped);
});
datascript.query.map_STAR_ = (function datascript$query$map_STAR_(f,xs){
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (p1__57784_SHARP_,p2__57785_SHARP_){
return cljs.core.conj.cljs$core$IFn$_invoke$arity$2(p1__57784_SHARP_,(f.cljs$core$IFn$_invoke$arity$1 ? f.cljs$core$IFn$_invoke$arity$1(p2__57785_SHARP_) : f.call(null,p2__57785_SHARP_)));
}),cljs.core.empty(xs),xs);
});
datascript.query.tuples__GT_return_map = (function datascript$query$tuples__GT_return_map(return_map,tuples){
var symbols = new cljs.core.Keyword(null,"symbols","symbols",1211743).cljs$core$IFn$_invoke$arity$1(return_map);
var idxs = cljs.core.range.cljs$core$IFn$_invoke$arity$2((0),cljs.core.count(symbols));
return datascript.query.map_STAR_((function (tuple){
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (m,i){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(m,cljs.core.nth.cljs$core$IFn$_invoke$arity$2(symbols,i),cljs.core.nth.cljs$core$IFn$_invoke$arity$2(tuple,i));
}),cljs.core.PersistentArrayMap.EMPTY,idxs);
}),tuples);
});

/**
 * @interface
 */
datascript.query.IPostProcess = function(){};

var datascript$query$IPostProcess$_post_process$dyn_58149 = (function (find,return_map,tuples){
var x__5350__auto__ = (((find == null))?null:find);
var m__5351__auto__ = (datascript.query._post_process[goog.typeOf(x__5350__auto__)]);
if((!((m__5351__auto__ == null)))){
return (m__5351__auto__.cljs$core$IFn$_invoke$arity$3 ? m__5351__auto__.cljs$core$IFn$_invoke$arity$3(find,return_map,tuples) : m__5351__auto__.call(null,find,return_map,tuples));
} else {
var m__5349__auto__ = (datascript.query._post_process["_"]);
if((!((m__5349__auto__ == null)))){
return (m__5349__auto__.cljs$core$IFn$_invoke$arity$3 ? m__5349__auto__.cljs$core$IFn$_invoke$arity$3(find,return_map,tuples) : m__5349__auto__.call(null,find,return_map,tuples));
} else {
throw cljs.core.missing_protocol("IPostProcess.-post-process",find);
}
}
});
datascript.query._post_process = (function datascript$query$_post_process(find,return_map,tuples){
if((((!((find == null)))) && ((!((find.datascript$query$IPostProcess$_post_process$arity$3 == null)))))){
return find.datascript$query$IPostProcess$_post_process$arity$3(find,return_map,tuples);
} else {
return datascript$query$IPostProcess$_post_process$dyn_58149(find,return_map,tuples);
}
});

(datascript.parser.FindRel.prototype.datascript$query$IPostProcess$ = cljs.core.PROTOCOL_SENTINEL);

(datascript.parser.FindRel.prototype.datascript$query$IPostProcess$_post_process$arity$3 = (function (_,return_map,tuples){
var ___$1 = this;
if((return_map == null)){
return tuples;
} else {
return datascript.query.tuples__GT_return_map(return_map,tuples);
}
}));

(datascript.parser.FindColl.prototype.datascript$query$IPostProcess$ = cljs.core.PROTOCOL_SENTINEL);

(datascript.parser.FindColl.prototype.datascript$query$IPostProcess$_post_process$arity$3 = (function (_,return_map,tuples){
var ___$1 = this;
return cljs.core.into.cljs$core$IFn$_invoke$arity$3(cljs.core.PersistentVector.EMPTY,cljs.core.map.cljs$core$IFn$_invoke$arity$1(cljs.core.first),tuples);
}));

(datascript.parser.FindScalar.prototype.datascript$query$IPostProcess$ = cljs.core.PROTOCOL_SENTINEL);

(datascript.parser.FindScalar.prototype.datascript$query$IPostProcess$_post_process$arity$3 = (function (_,return_map,tuples){
var ___$1 = this;
return cljs.core.ffirst(tuples);
}));

(datascript.parser.FindTuple.prototype.datascript$query$IPostProcess$ = cljs.core.PROTOCOL_SENTINEL);

(datascript.parser.FindTuple.prototype.datascript$query$IPostProcess$_post_process$arity$3 = (function (_,return_map,tuples){
var ___$1 = this;
if((!((return_map == null)))){
return cljs.core.first(datascript.query.tuples__GT_return_map(return_map,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.first(tuples)], null)));
} else {
return cljs.core.first(tuples);
}
}));
datascript.query.pull = (function datascript$query$pull(find_elements,context,resultset){
var resolved = (function (){var iter__5480__auto__ = (function datascript$query$pull_$_iter__57832(s__57833){
return (new cljs.core.LazySeq(null,(function (){
var s__57833__$1 = s__57833;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__57833__$1);
if(temp__5804__auto__){
var s__57833__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__57833__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__57833__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__57835 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__57834 = (0);
while(true){
if((i__57834 < size__5479__auto__)){
var find = cljs.core._nth(c__5478__auto__,i__57834);
cljs.core.chunk_append(b__57835,((datascript.parser.pull_QMARK_(find))?(function (){var db = datascript.query._context_resolve(new cljs.core.Keyword(null,"source","source",-433931539).cljs$core$IFn$_invoke$arity$1(find),context);
var pattern = datascript.query._context_resolve(new cljs.core.Keyword(null,"pattern","pattern",242135423).cljs$core$IFn$_invoke$arity$1(find),context);
return datascript.pull_api.parse_opts.cljs$core$IFn$_invoke$arity$2(db,pattern);
})():null));

var G__58162 = (i__57834 + (1));
i__57834 = G__58162;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__57835),datascript$query$pull_$_iter__57832(cljs.core.chunk_rest(s__57833__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__57835),null);
}
} else {
var find = cljs.core.first(s__57833__$2);
return cljs.core.cons(((datascript.parser.pull_QMARK_(find))?(function (){var db = datascript.query._context_resolve(new cljs.core.Keyword(null,"source","source",-433931539).cljs$core$IFn$_invoke$arity$1(find),context);
var pattern = datascript.query._context_resolve(new cljs.core.Keyword(null,"pattern","pattern",242135423).cljs$core$IFn$_invoke$arity$1(find),context);
return datascript.pull_api.parse_opts.cljs$core$IFn$_invoke$arity$2(db,pattern);
})():null),datascript$query$pull_$_iter__57832(cljs.core.rest(s__57833__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(find_elements);
})();
var iter__5480__auto__ = (function datascript$query$pull_$_iter__57848(s__57849){
return (new cljs.core.LazySeq(null,(function (){
var s__57849__$1 = s__57849;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__57849__$1);
if(temp__5804__auto__){
var s__57849__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__57849__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__57849__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__57851 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__57850 = (0);
while(true){
if((i__57850 < size__5479__auto__)){
var tuple = cljs.core._nth(c__5478__auto__,i__57850);
cljs.core.chunk_append(b__57851,cljs.core.mapv.cljs$core$IFn$_invoke$arity$3(((function (i__57850,tuple,c__5478__auto__,size__5479__auto__,b__57851,s__57849__$2,temp__5804__auto__,resolved){
return (function (parsed_opts,el){
if(cljs.core.truth_(parsed_opts)){
return datascript.pull_api.pull_impl(parsed_opts,el);
} else {
return el;
}
});})(i__57850,tuple,c__5478__auto__,size__5479__auto__,b__57851,s__57849__$2,temp__5804__auto__,resolved))
,resolved,tuple));

var G__58167 = (i__57850 + (1));
i__57850 = G__58167;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__57851),datascript$query$pull_$_iter__57848(cljs.core.chunk_rest(s__57849__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__57851),null);
}
} else {
var tuple = cljs.core.first(s__57849__$2);
return cljs.core.cons(cljs.core.mapv.cljs$core$IFn$_invoke$arity$3(((function (tuple,s__57849__$2,temp__5804__auto__,resolved){
return (function (parsed_opts,el){
if(cljs.core.truth_(parsed_opts)){
return datascript.pull_api.pull_impl(parsed_opts,el);
} else {
return el;
}
});})(tuple,s__57849__$2,temp__5804__auto__,resolved))
,resolved,tuple),datascript$query$pull_$_iter__57848(cljs.core.rest(s__57849__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(resultset);
});
datascript.query.q = (function datascript$query$q(var_args){
var args__5732__auto__ = [];
var len__5726__auto___58169 = arguments.length;
var i__5727__auto___58170 = (0);
while(true){
if((i__5727__auto___58170 < len__5726__auto___58169)){
args__5732__auto__.push((arguments[i__5727__auto___58170]));

var G__58171 = (i__5727__auto___58170 + (1));
i__5727__auto___58170 = G__58171;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return datascript.query.q.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(datascript.query.q.cljs$core$IFn$_invoke$arity$variadic = (function (q,inputs){
var parsed_q = datascript.lru._get(datascript.query._STAR_query_cache_STAR_,q,(function (){
return datascript.parser.parse_query(q);
}));
var find = new cljs.core.Keyword(null,"qfind","qfind",1529332972).cljs$core$IFn$_invoke$arity$1(parsed_q);
var find_elements = datascript.parser.find_elements(find);
var find_vars = datascript.parser.find_vars(find);
var result_arity = cljs.core.count(find_elements);
var with$ = new cljs.core.Keyword(null,"qwith","qwith",-45809392).cljs$core$IFn$_invoke$arity$1(parsed_q);
var all_vars = cljs.core.concat.cljs$core$IFn$_invoke$arity$2(find_vars,cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"symbol","symbol",-1038572696),with$));
var q__$1 = (function (){var G__57878 = q;
if(cljs.core.sequential_QMARK_(q)){
return datascript.parser.query__GT_map(G__57878);
} else {
return G__57878;
}
})();
var wheres = new cljs.core.Keyword(null,"where","where",-2044795965).cljs$core$IFn$_invoke$arity$1(q__$1);
var context = datascript.query.resolve_ins((new datascript.query.Context(cljs.core.PersistentVector.EMPTY,cljs.core.PersistentArrayMap.EMPTY,cljs.core.PersistentArrayMap.EMPTY,null,null,null)),new cljs.core.Keyword(null,"qin","qin",1372651151).cljs$core$IFn$_invoke$arity$1(parsed_q),inputs);
var resultset = datascript.query.collect(datascript.query._q(context,wheres),all_vars);
var G__57885 = resultset;
var G__57885__$1 = (cljs.core.truth_(new cljs.core.Keyword(null,"with","with",-1536296876).cljs$core$IFn$_invoke$arity$1(q__$1))?cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (p1__57868_SHARP_){
return cljs.core.vec(cljs.core.subvec.cljs$core$IFn$_invoke$arity$3(p1__57868_SHARP_,(0),result_arity));
}),G__57885):G__57885);
var G__57885__$2 = (cljs.core.truth_(cljs.core.some(datascript.parser.aggregate_QMARK_,find_elements))?datascript.query.aggregate(find_elements,context,G__57885__$1):G__57885__$1);
var G__57885__$3 = (cljs.core.truth_(cljs.core.some(datascript.parser.pull_QMARK_,find_elements))?datascript.query.pull(find_elements,context,G__57885__$2):G__57885__$2);
return datascript.query._post_process(find,new cljs.core.Keyword(null,"qreturn-map","qreturn-map",1841215994).cljs$core$IFn$_invoke$arity$1(parsed_q),G__57885__$3);

}));

(datascript.query.q.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(datascript.query.q.cljs$lang$applyTo = (function (seq57869){
var G__57870 = cljs.core.first(seq57869);
var seq57869__$1 = cljs.core.next(seq57869);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__57870,seq57869__$1);
}));


//# sourceMappingURL=datascript.query.js.map
