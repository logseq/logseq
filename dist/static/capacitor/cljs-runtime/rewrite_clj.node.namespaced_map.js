goog.provide('rewrite_clj.node.namespaced_map');

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
 * @implements {rewrite_clj.node.protocols.Node}
 * @implements {cljs.core.IWithMeta}
 * @implements {cljs.core.IAssociative}
 * @implements {cljs.core.IMap}
 * @implements {cljs.core.ILookup}
*/
rewrite_clj.node.namespaced_map.MapQualifierNode = (function (auto_resolved_QMARK_,prefix,__meta,__extmap,__hash){
this.auto_resolved_QMARK_ = auto_resolved_QMARK_;
this.prefix = prefix;
this.__meta = __meta;
this.__extmap = __extmap;
this.__hash = __hash;
this.cljs$lang$protocol_mask$partition0$ = 2230716170;
this.cljs$lang$protocol_mask$partition1$ = 139264;
});
(rewrite_clj.node.namespaced_map.MapQualifierNode.prototype.toString = (function (){
var self__ = this;
var node = this;
return node.rewrite_clj$node$protocols$Node$string$arity$1(null);
}));

(rewrite_clj.node.namespaced_map.MapQualifierNode.prototype.cljs$core$ILookup$_lookup$arity$2 = (function (this__5300__auto__,k__5301__auto__){
var self__ = this;
var this__5300__auto____$1 = this;
return this__5300__auto____$1.cljs$core$ILookup$_lookup$arity$3(null,k__5301__auto__,null);
}));

(rewrite_clj.node.namespaced_map.MapQualifierNode.prototype.cljs$core$ILookup$_lookup$arity$3 = (function (this__5302__auto__,k64232,else__5303__auto__){
var self__ = this;
var this__5302__auto____$1 = this;
var G__64253 = k64232;
var G__64253__$1 = (((G__64253 instanceof cljs.core.Keyword))?G__64253.fqn:null);
switch (G__64253__$1) {
case "auto-resolved?":
return self__.auto_resolved_QMARK_;

break;
case "prefix":
return self__.prefix;

break;
default:
return cljs.core.get.cljs$core$IFn$_invoke$arity$3(self__.__extmap,k64232,else__5303__auto__);

}
}));

(rewrite_clj.node.namespaced_map.MapQualifierNode.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = (function (this__5320__auto__,f__5321__auto__,init__5322__auto__){
var self__ = this;
var this__5320__auto____$1 = this;
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (ret__5323__auto__,p__64269){
var vec__64272 = p__64269;
var k__5324__auto__ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__64272,(0),null);
var v__5325__auto__ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__64272,(1),null);
return (f__5321__auto__.cljs$core$IFn$_invoke$arity$3 ? f__5321__auto__.cljs$core$IFn$_invoke$arity$3(ret__5323__auto__,k__5324__auto__,v__5325__auto__) : f__5321__auto__.call(null,ret__5323__auto__,k__5324__auto__,v__5325__auto__));
}),init__5322__auto__,this__5320__auto____$1);
}));

(rewrite_clj.node.namespaced_map.MapQualifierNode.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = (function (this__5315__auto__,writer__5316__auto__,opts__5317__auto__){
var self__ = this;
var this__5315__auto____$1 = this;
var pr_pair__5318__auto__ = (function (keyval__5319__auto__){
return cljs.core.pr_sequential_writer(writer__5316__auto__,cljs.core.pr_writer,""," ","",opts__5317__auto__,keyval__5319__auto__);
});
return cljs.core.pr_sequential_writer(writer__5316__auto__,pr_pair__5318__auto__,"#rewrite-clj.node.namespaced-map.MapQualifierNode{",", ","}",opts__5317__auto__,cljs.core.concat.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [(new cljs.core.PersistentVector(null,2,(5),cljs.core.PersistentVector.EMPTY_NODE,[new cljs.core.Keyword(null,"auto-resolved?","auto-resolved?",-1944476351),self__.auto_resolved_QMARK_],null)),(new cljs.core.PersistentVector(null,2,(5),cljs.core.PersistentVector.EMPTY_NODE,[new cljs.core.Keyword(null,"prefix","prefix",-265908465),self__.prefix],null))], null),self__.__extmap));
}));

(rewrite_clj.node.namespaced_map.MapQualifierNode.prototype.cljs$core$IIterable$_iterator$arity$1 = (function (G__64231){
var self__ = this;
var G__64231__$1 = this;
return (new cljs.core.RecordIter((0),G__64231__$1,2,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"auto-resolved?","auto-resolved?",-1944476351),new cljs.core.Keyword(null,"prefix","prefix",-265908465)], null),(cljs.core.truth_(self__.__extmap)?cljs.core._iterator(self__.__extmap):cljs.core.nil_iter())));
}));

(rewrite_clj.node.namespaced_map.MapQualifierNode.prototype.cljs$core$IMeta$_meta$arity$1 = (function (this__5298__auto__){
var self__ = this;
var this__5298__auto____$1 = this;
return self__.__meta;
}));

(rewrite_clj.node.namespaced_map.MapQualifierNode.prototype.cljs$core$ICloneable$_clone$arity$1 = (function (this__5295__auto__){
var self__ = this;
var this__5295__auto____$1 = this;
return (new rewrite_clj.node.namespaced_map.MapQualifierNode(self__.auto_resolved_QMARK_,self__.prefix,self__.__meta,self__.__extmap,self__.__hash));
}));

(rewrite_clj.node.namespaced_map.MapQualifierNode.prototype.cljs$core$ICounted$_count$arity$1 = (function (this__5304__auto__){
var self__ = this;
var this__5304__auto____$1 = this;
return (2 + cljs.core.count(self__.__extmap));
}));

(rewrite_clj.node.namespaced_map.MapQualifierNode.prototype.cljs$core$IHash$_hash$arity$1 = (function (this__5296__auto__){
var self__ = this;
var this__5296__auto____$1 = this;
var h__5111__auto__ = self__.__hash;
if((!((h__5111__auto__ == null)))){
return h__5111__auto__;
} else {
var h__5111__auto____$1 = (function (coll__5297__auto__){
return (-426705749 ^ cljs.core.hash_unordered_coll(coll__5297__auto__));
})(this__5296__auto____$1);
(self__.__hash = h__5111__auto____$1);

return h__5111__auto____$1;
}
}));

(rewrite_clj.node.namespaced_map.MapQualifierNode.prototype.cljs$core$IEquiv$_equiv$arity$2 = (function (this64233,other64234){
var self__ = this;
var this64233__$1 = this;
return (((!((other64234 == null)))) && ((((this64233__$1.constructor === other64234.constructor)) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(this64233__$1.auto_resolved_QMARK_,other64234.auto_resolved_QMARK_)) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(this64233__$1.prefix,other64234.prefix)) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(this64233__$1.__extmap,other64234.__extmap)))))))));
}));

(rewrite_clj.node.namespaced_map.MapQualifierNode.prototype.rewrite_clj$node$protocols$Node$ = cljs.core.PROTOCOL_SENTINEL);

(rewrite_clj.node.namespaced_map.MapQualifierNode.prototype.rewrite_clj$node$protocols$Node$tag$arity$1 = (function (_node){
var self__ = this;
var _node__$1 = this;
return new cljs.core.Keyword(null,"map-qualifier","map-qualifier",-1248117720);
}));

(rewrite_clj.node.namespaced_map.MapQualifierNode.prototype.rewrite_clj$node$protocols$Node$node_type$arity$1 = (function (_node){
var self__ = this;
var _node__$1 = this;
return new cljs.core.Keyword(null,"map-qualifier","map-qualifier",-1248117720);
}));

(rewrite_clj.node.namespaced_map.MapQualifierNode.prototype.rewrite_clj$node$protocols$Node$printable_only_QMARK_$arity$1 = (function (_node){
var self__ = this;
var _node__$1 = this;
return false;
}));

(rewrite_clj.node.namespaced_map.MapQualifierNode.prototype.rewrite_clj$node$protocols$Node$sexpr_STAR_$arity$2 = (function (_node,opts){
var self__ = this;
var _node__$1 = this;
if(cljs.core.truth_(self__.auto_resolved_QMARK_)){
var G__64314 = (cljs.core.truth_(self__.prefix)?cljs.core.symbol.cljs$core$IFn$_invoke$arity$1(self__.prefix):new cljs.core.Keyword(null,"current","current",-1088038603));
var fexpr__64313 = (function (){var or__5002__auto__ = new cljs.core.Keyword(null,"auto-resolve","auto-resolve",1851201983).cljs$core$IFn$_invoke$arity$1(opts);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return rewrite_clj.node.protocols.default_auto_resolve;
}
})();
return (fexpr__64313.cljs$core$IFn$_invoke$arity$1 ? fexpr__64313.cljs$core$IFn$_invoke$arity$1(G__64314) : fexpr__64313.call(null,G__64314));
} else {
return cljs.core.symbol.cljs$core$IFn$_invoke$arity$1(self__.prefix);
}
}));

(rewrite_clj.node.namespaced_map.MapQualifierNode.prototype.rewrite_clj$node$protocols$Node$length$arity$1 = (function (_node){
var self__ = this;
var _node__$1 = this;
return (((1) + (cljs.core.truth_(self__.auto_resolved_QMARK_)?(1):(0))) + cljs.core.count(self__.prefix));
}));

(rewrite_clj.node.namespaced_map.MapQualifierNode.prototype.rewrite_clj$node$protocols$Node$string$arity$1 = (function (_node){
var self__ = this;
var _node__$1 = this;
return [":",(cljs.core.truth_(self__.auto_resolved_QMARK_)?":":null),cljs.core.str.cljs$core$IFn$_invoke$arity$1(self__.prefix)].join('');
}));

(rewrite_clj.node.namespaced_map.MapQualifierNode.prototype.cljs$core$IMap$_dissoc$arity$2 = (function (this__5310__auto__,k__5311__auto__){
var self__ = this;
var this__5310__auto____$1 = this;
if(cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"auto-resolved?","auto-resolved?",-1944476351),null,new cljs.core.Keyword(null,"prefix","prefix",-265908465),null], null), null),k__5311__auto__)){
return cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(cljs.core._with_meta(cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,this__5310__auto____$1),self__.__meta),k__5311__auto__);
} else {
return (new rewrite_clj.node.namespaced_map.MapQualifierNode(self__.auto_resolved_QMARK_,self__.prefix,self__.__meta,cljs.core.not_empty(cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(self__.__extmap,k__5311__auto__)),null));
}
}));

(rewrite_clj.node.namespaced_map.MapQualifierNode.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = (function (this__5307__auto__,k64232){
var self__ = this;
var this__5307__auto____$1 = this;
var G__64319 = k64232;
var G__64319__$1 = (((G__64319 instanceof cljs.core.Keyword))?G__64319.fqn:null);
switch (G__64319__$1) {
case "auto-resolved?":
case "prefix":
return true;

break;
default:
return cljs.core.contains_QMARK_(self__.__extmap,k64232);

}
}));

(rewrite_clj.node.namespaced_map.MapQualifierNode.prototype.cljs$core$IAssociative$_assoc$arity$3 = (function (this__5308__auto__,k__5309__auto__,G__64231){
var self__ = this;
var this__5308__auto____$1 = this;
var pred__64323 = cljs.core.keyword_identical_QMARK_;
var expr__64324 = k__5309__auto__;
if(cljs.core.truth_((pred__64323.cljs$core$IFn$_invoke$arity$2 ? pred__64323.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"auto-resolved?","auto-resolved?",-1944476351),expr__64324) : pred__64323.call(null,new cljs.core.Keyword(null,"auto-resolved?","auto-resolved?",-1944476351),expr__64324)))){
return (new rewrite_clj.node.namespaced_map.MapQualifierNode(G__64231,self__.prefix,self__.__meta,self__.__extmap,null));
} else {
if(cljs.core.truth_((pred__64323.cljs$core$IFn$_invoke$arity$2 ? pred__64323.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"prefix","prefix",-265908465),expr__64324) : pred__64323.call(null,new cljs.core.Keyword(null,"prefix","prefix",-265908465),expr__64324)))){
return (new rewrite_clj.node.namespaced_map.MapQualifierNode(self__.auto_resolved_QMARK_,G__64231,self__.__meta,self__.__extmap,null));
} else {
return (new rewrite_clj.node.namespaced_map.MapQualifierNode(self__.auto_resolved_QMARK_,self__.prefix,self__.__meta,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(self__.__extmap,k__5309__auto__,G__64231),null));
}
}
}));

(rewrite_clj.node.namespaced_map.MapQualifierNode.prototype.cljs$core$ISeqable$_seq$arity$1 = (function (this__5313__auto__){
var self__ = this;
var this__5313__auto____$1 = this;
return cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [(new cljs.core.MapEntry(new cljs.core.Keyword(null,"auto-resolved?","auto-resolved?",-1944476351),self__.auto_resolved_QMARK_,null)),(new cljs.core.MapEntry(new cljs.core.Keyword(null,"prefix","prefix",-265908465),self__.prefix,null))], null),self__.__extmap));
}));

(rewrite_clj.node.namespaced_map.MapQualifierNode.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = (function (this__5299__auto__,G__64231){
var self__ = this;
var this__5299__auto____$1 = this;
return (new rewrite_clj.node.namespaced_map.MapQualifierNode(self__.auto_resolved_QMARK_,self__.prefix,G__64231,self__.__extmap,self__.__hash));
}));

(rewrite_clj.node.namespaced_map.MapQualifierNode.prototype.cljs$core$ICollection$_conj$arity$2 = (function (this__5305__auto__,entry__5306__auto__){
var self__ = this;
var this__5305__auto____$1 = this;
if(cljs.core.vector_QMARK_(entry__5306__auto__)){
return this__5305__auto____$1.cljs$core$IAssociative$_assoc$arity$3(null,cljs.core._nth(entry__5306__auto__,(0)),cljs.core._nth(entry__5306__auto__,(1)));
} else {
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3(cljs.core._conj,this__5305__auto____$1,entry__5306__auto__);
}
}));

(rewrite_clj.node.namespaced_map.MapQualifierNode.getBasis = (function (){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"auto-resolved?","auto-resolved?",-303944824,null),new cljs.core.Symbol(null,"prefix","prefix",1374623062,null)], null);
}));

(rewrite_clj.node.namespaced_map.MapQualifierNode.cljs$lang$type = true);

(rewrite_clj.node.namespaced_map.MapQualifierNode.cljs$lang$ctorPrSeq = (function (this__5346__auto__){
return (new cljs.core.List(null,"rewrite-clj.node.namespaced-map/MapQualifierNode",null,(1),null));
}));

(rewrite_clj.node.namespaced_map.MapQualifierNode.cljs$lang$ctorPrWriter = (function (this__5346__auto__,writer__5347__auto__){
return cljs.core._write(writer__5347__auto__,"rewrite-clj.node.namespaced-map/MapQualifierNode");
}));

/**
 * Positional factory function for rewrite-clj.node.namespaced-map/MapQualifierNode.
 */
rewrite_clj.node.namespaced_map.__GT_MapQualifierNode = (function rewrite_clj$node$namespaced_map$__GT_MapQualifierNode(auto_resolved_QMARK_,prefix){
return (new rewrite_clj.node.namespaced_map.MapQualifierNode(auto_resolved_QMARK_,prefix,null,null,null));
});

/**
 * Factory function for rewrite-clj.node.namespaced-map/MapQualifierNode, taking a map of keywords to field values.
 */
rewrite_clj.node.namespaced_map.map__GT_MapQualifierNode = (function rewrite_clj$node$namespaced_map$map__GT_MapQualifierNode(G__64236){
var extmap__5342__auto__ = (function (){var G__64340 = cljs.core.dissoc.cljs$core$IFn$_invoke$arity$variadic(G__64236,new cljs.core.Keyword(null,"auto-resolved?","auto-resolved?",-1944476351),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"prefix","prefix",-265908465)], 0));
if(cljs.core.record_QMARK_(G__64236)){
return cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,G__64340);
} else {
return G__64340;
}
})();
return (new rewrite_clj.node.namespaced_map.MapQualifierNode(new cljs.core.Keyword(null,"auto-resolved?","auto-resolved?",-1944476351).cljs$core$IFn$_invoke$arity$1(G__64236),new cljs.core.Keyword(null,"prefix","prefix",-265908465).cljs$core$IFn$_invoke$arity$1(G__64236),null,cljs.core.not_empty(extmap__5342__auto__),null));
});

/**
 * A map node's children are a list of nodes that can contain non-sexpr-able elements (ex. whitespace).
 * 
 *   Returns `children` with `f` applied sexpressable children.
 * 
 *   `f` is called with
 *   - `n` - node
 *   - `is-map-key?` true if the node is in keyword position
 *   and should return `n` or a new version of `n`.
 */
rewrite_clj.node.namespaced_map.edit_map_children = (function rewrite_clj$node$namespaced_map$edit_map_children(children,f){
var r = children;
var last_key = null;
var new_children = cljs.core.PersistentVector.EMPTY;
while(true){
var temp__5802__auto__ = cljs.core.first(r);
if(cljs.core.truth_(temp__5802__auto__)){
var n = temp__5802__auto__;
if(cljs.core.truth_(rewrite_clj.node.protocols.printable_only_QMARK_(n))){
var G__64608 = cljs.core.rest(r);
var G__64609 = last_key;
var G__64610 = cljs.core.conj.cljs$core$IFn$_invoke$arity$2(new_children,n);
r = G__64608;
last_key = G__64609;
new_children = G__64610;
continue;
} else {
if(cljs.core.truth_(last_key)){
var G__64611 = cljs.core.rest(r);
var G__64612 = null;
var G__64613 = cljs.core.conj.cljs$core$IFn$_invoke$arity$2(new_children,(f.cljs$core$IFn$_invoke$arity$2 ? f.cljs$core$IFn$_invoke$arity$2(n,false) : f.call(null,n,false)));
r = G__64611;
last_key = G__64612;
new_children = G__64613;
continue;
} else {
var G__64614 = cljs.core.rest(r);
var G__64615 = n;
var G__64616 = cljs.core.conj.cljs$core$IFn$_invoke$arity$2(new_children,(f.cljs$core$IFn$_invoke$arity$2 ? f.cljs$core$IFn$_invoke$arity$2(n,true) : f.call(null,n,true)));
r = G__64614;
last_key = G__64615;
new_children = G__64616;
continue;
}
}
} else {
return new_children;
}
break;
}
});
/**
 * Apply the context of the qualified map to the keyword keys in the map.
 * 
 *   Strips context from keyword-nodes not in keyword position and adds context to keyword nodes in keyword position.
 */
rewrite_clj.node.namespaced_map.apply_context_to_map = (function rewrite_clj$node$namespaced_map$apply_context_to_map(m_node,q_node){
return rewrite_clj.node.protocols.replace_children(m_node,rewrite_clj.node.namespaced_map.edit_map_children(rewrite_clj.node.protocols.children(m_node),(function (n,is_map_key_QMARK_){
if((((!((n == null))))?((((false) || ((cljs.core.PROTOCOL_SENTINEL === n.rewrite_clj$node$protocols$MapQualifiable$))))?true:(((!n.cljs$lang$protocol_mask$partition$))?cljs.core.native_satisfies_QMARK_(rewrite_clj.node.protocols.MapQualifiable,n):false)):cljs.core.native_satisfies_QMARK_(rewrite_clj.node.protocols.MapQualifiable,n))){
if(cljs.core.truth_(is_map_key_QMARK_)){
return rewrite_clj.node.protocols.map_context_apply(n,q_node);
} else {
return rewrite_clj.node.protocols.map_context_clear(n);
}
} else {
return n;
}
})));
});
rewrite_clj.node.namespaced_map.apply_context = (function rewrite_clj$node$namespaced_map$apply_context(children){
var q_node = cljs.core.first(children);
var m_node = cljs.core.last(children);
return cljs.core.concat.cljs$core$IFn$_invoke$arity$2(cljs.core.drop_last.cljs$core$IFn$_invoke$arity$1(children),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rewrite_clj.node.namespaced_map.apply_context_to_map(m_node,q_node)], null));
});
/**
 * Namespaced map qualifier context is automatically applied to keyword children of contained map automatically on:
 *   - [[node/namespaced-map-node]] creation (i.e. at parse time)
 *   - [[node/replace-children]]
 * 
 *   If you make changes outside these techniques, call this function to reapply the qualifier context.
 * 
 *   This is only necessary if you need `sexpr` on map keywords to reflect the namespaced map qualifier.
 * 
 *   Returns `n` if not a namespaced map node.
 */
rewrite_clj.node.namespaced_map.reapply_namespaced_map_context = (function rewrite_clj$node$namespaced_map$reapply_namespaced_map_context(n){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"namespaced-map","namespaced-map",1235665380),rewrite_clj.node.protocols.tag(n))){
return rewrite_clj.node.protocols.replace_children(n,rewrite_clj.node.namespaced_map.apply_context(rewrite_clj.node.protocols.children(n)));
} else {
return n;
}
});
/**
 * Assumes that appropriate qualifier context has been applied to contained map.
 */
rewrite_clj.node.namespaced_map.namespaced_map_sexpr = (function rewrite_clj$node$namespaced_map$namespaced_map_sexpr(children,opts){
return rewrite_clj.node.protocols.sexpr.cljs$core$IFn$_invoke$arity$2(cljs.core.last(children),opts);
});

/**
* @constructor
 * @implements {cljs.core.IRecord}
 * @implements {cljs.core.IKVReduce}
 * @implements {cljs.core.IEquiv}
 * @implements {cljs.core.IHash}
 * @implements {cljs.core.ICollection}
 * @implements {cljs.core.ICounted}
 * @implements {rewrite_clj.node.protocols.InnerNode}
 * @implements {cljs.core.ISeqable}
 * @implements {cljs.core.IMeta}
 * @implements {cljs.core.ICloneable}
 * @implements {cljs.core.IPrintWithWriter}
 * @implements {cljs.core.IIterable}
 * @implements {rewrite_clj.node.protocols.Node}
 * @implements {cljs.core.IWithMeta}
 * @implements {cljs.core.IAssociative}
 * @implements {cljs.core.IMap}
 * @implements {cljs.core.ILookup}
*/
rewrite_clj.node.namespaced_map.NamespacedMapNode = (function (children,__meta,__extmap,__hash){
this.children = children;
this.__meta = __meta;
this.__extmap = __extmap;
this.__hash = __hash;
this.cljs$lang$protocol_mask$partition0$ = 2230716170;
this.cljs$lang$protocol_mask$partition1$ = 139264;
});
(rewrite_clj.node.namespaced_map.NamespacedMapNode.prototype.toString = (function (){
var self__ = this;
var node = this;
return node.rewrite_clj$node$protocols$Node$string$arity$1(null);
}));

(rewrite_clj.node.namespaced_map.NamespacedMapNode.prototype.cljs$core$ILookup$_lookup$arity$2 = (function (this__5300__auto__,k__5301__auto__){
var self__ = this;
var this__5300__auto____$1 = this;
return this__5300__auto____$1.cljs$core$ILookup$_lookup$arity$3(null,k__5301__auto__,null);
}));

(rewrite_clj.node.namespaced_map.NamespacedMapNode.prototype.cljs$core$ILookup$_lookup$arity$3 = (function (this__5302__auto__,k64382,else__5303__auto__){
var self__ = this;
var this__5302__auto____$1 = this;
var G__64396 = k64382;
var G__64396__$1 = (((G__64396 instanceof cljs.core.Keyword))?G__64396.fqn:null);
switch (G__64396__$1) {
case "children":
return self__.children;

break;
default:
return cljs.core.get.cljs$core$IFn$_invoke$arity$3(self__.__extmap,k64382,else__5303__auto__);

}
}));

(rewrite_clj.node.namespaced_map.NamespacedMapNode.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = (function (this__5320__auto__,f__5321__auto__,init__5322__auto__){
var self__ = this;
var this__5320__auto____$1 = this;
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (ret__5323__auto__,p__64399){
var vec__64401 = p__64399;
var k__5324__auto__ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__64401,(0),null);
var v__5325__auto__ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__64401,(1),null);
return (f__5321__auto__.cljs$core$IFn$_invoke$arity$3 ? f__5321__auto__.cljs$core$IFn$_invoke$arity$3(ret__5323__auto__,k__5324__auto__,v__5325__auto__) : f__5321__auto__.call(null,ret__5323__auto__,k__5324__auto__,v__5325__auto__));
}),init__5322__auto__,this__5320__auto____$1);
}));

(rewrite_clj.node.namespaced_map.NamespacedMapNode.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = (function (this__5315__auto__,writer__5316__auto__,opts__5317__auto__){
var self__ = this;
var this__5315__auto____$1 = this;
var pr_pair__5318__auto__ = (function (keyval__5319__auto__){
return cljs.core.pr_sequential_writer(writer__5316__auto__,cljs.core.pr_writer,""," ","",opts__5317__auto__,keyval__5319__auto__);
});
return cljs.core.pr_sequential_writer(writer__5316__auto__,pr_pair__5318__auto__,"#rewrite-clj.node.namespaced-map.NamespacedMapNode{",", ","}",opts__5317__auto__,cljs.core.concat.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [(new cljs.core.PersistentVector(null,2,(5),cljs.core.PersistentVector.EMPTY_NODE,[new cljs.core.Keyword(null,"children","children",-940561982),self__.children],null))], null),self__.__extmap));
}));

(rewrite_clj.node.namespaced_map.NamespacedMapNode.prototype.cljs$core$IIterable$_iterator$arity$1 = (function (G__64381){
var self__ = this;
var G__64381__$1 = this;
return (new cljs.core.RecordIter((0),G__64381__$1,1,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"children","children",-940561982)], null),(cljs.core.truth_(self__.__extmap)?cljs.core._iterator(self__.__extmap):cljs.core.nil_iter())));
}));

(rewrite_clj.node.namespaced_map.NamespacedMapNode.prototype.cljs$core$IMeta$_meta$arity$1 = (function (this__5298__auto__){
var self__ = this;
var this__5298__auto____$1 = this;
return self__.__meta;
}));

(rewrite_clj.node.namespaced_map.NamespacedMapNode.prototype.cljs$core$ICloneable$_clone$arity$1 = (function (this__5295__auto__){
var self__ = this;
var this__5295__auto____$1 = this;
return (new rewrite_clj.node.namespaced_map.NamespacedMapNode(self__.children,self__.__meta,self__.__extmap,self__.__hash));
}));

(rewrite_clj.node.namespaced_map.NamespacedMapNode.prototype.cljs$core$ICounted$_count$arity$1 = (function (this__5304__auto__){
var self__ = this;
var this__5304__auto____$1 = this;
return (1 + cljs.core.count(self__.__extmap));
}));

(rewrite_clj.node.namespaced_map.NamespacedMapNode.prototype.cljs$core$IHash$_hash$arity$1 = (function (this__5296__auto__){
var self__ = this;
var this__5296__auto____$1 = this;
var h__5111__auto__ = self__.__hash;
if((!((h__5111__auto__ == null)))){
return h__5111__auto__;
} else {
var h__5111__auto____$1 = (function (coll__5297__auto__){
return (679326169 ^ cljs.core.hash_unordered_coll(coll__5297__auto__));
})(this__5296__auto____$1);
(self__.__hash = h__5111__auto____$1);

return h__5111__auto____$1;
}
}));

(rewrite_clj.node.namespaced_map.NamespacedMapNode.prototype.cljs$core$IEquiv$_equiv$arity$2 = (function (this64383,other64384){
var self__ = this;
var this64383__$1 = this;
return (((!((other64384 == null)))) && ((((this64383__$1.constructor === other64384.constructor)) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(this64383__$1.children,other64384.children)) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(this64383__$1.__extmap,other64384.__extmap)))))));
}));

(rewrite_clj.node.namespaced_map.NamespacedMapNode.prototype.rewrite_clj$node$protocols$Node$ = cljs.core.PROTOCOL_SENTINEL);

(rewrite_clj.node.namespaced_map.NamespacedMapNode.prototype.rewrite_clj$node$protocols$Node$tag$arity$1 = (function (_node){
var self__ = this;
var _node__$1 = this;
return new cljs.core.Keyword(null,"namespaced-map","namespaced-map",1235665380);
}));

(rewrite_clj.node.namespaced_map.NamespacedMapNode.prototype.rewrite_clj$node$protocols$Node$node_type$arity$1 = (function (_node){
var self__ = this;
var _node__$1 = this;
return new cljs.core.Keyword(null,"namespaced-map","namespaced-map",1235665380);
}));

(rewrite_clj.node.namespaced_map.NamespacedMapNode.prototype.rewrite_clj$node$protocols$Node$printable_only_QMARK_$arity$1 = (function (_node){
var self__ = this;
var _node__$1 = this;
return false;
}));

(rewrite_clj.node.namespaced_map.NamespacedMapNode.prototype.rewrite_clj$node$protocols$Node$sexpr_STAR_$arity$2 = (function (_node,opts){
var self__ = this;
var _node__$1 = this;
return rewrite_clj.node.namespaced_map.namespaced_map_sexpr(self__.children,opts);
}));

(rewrite_clj.node.namespaced_map.NamespacedMapNode.prototype.rewrite_clj$node$protocols$Node$length$arity$1 = (function (_node){
var self__ = this;
var _node__$1 = this;
return ((1) + rewrite_clj.node.protocols.sum_lengths(self__.children));
}));

(rewrite_clj.node.namespaced_map.NamespacedMapNode.prototype.rewrite_clj$node$protocols$Node$string$arity$1 = (function (_node){
var self__ = this;
var _node__$1 = this;
return ["#",cljs.core.str.cljs$core$IFn$_invoke$arity$1(rewrite_clj.node.protocols.concat_strings(self__.children))].join('');
}));

(rewrite_clj.node.namespaced_map.NamespacedMapNode.prototype.cljs$core$IMap$_dissoc$arity$2 = (function (this__5310__auto__,k__5311__auto__){
var self__ = this;
var this__5310__auto____$1 = this;
if(cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"children","children",-940561982),null], null), null),k__5311__auto__)){
return cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(cljs.core._with_meta(cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,this__5310__auto____$1),self__.__meta),k__5311__auto__);
} else {
return (new rewrite_clj.node.namespaced_map.NamespacedMapNode(self__.children,self__.__meta,cljs.core.not_empty(cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(self__.__extmap,k__5311__auto__)),null));
}
}));

(rewrite_clj.node.namespaced_map.NamespacedMapNode.prototype.rewrite_clj$node$protocols$InnerNode$ = cljs.core.PROTOCOL_SENTINEL);

(rewrite_clj.node.namespaced_map.NamespacedMapNode.prototype.rewrite_clj$node$protocols$InnerNode$inner_QMARK_$arity$1 = (function (_node){
var self__ = this;
var _node__$1 = this;
return true;
}));

(rewrite_clj.node.namespaced_map.NamespacedMapNode.prototype.rewrite_clj$node$protocols$InnerNode$children$arity$1 = (function (_node){
var self__ = this;
var _node__$1 = this;
return self__.children;
}));

(rewrite_clj.node.namespaced_map.NamespacedMapNode.prototype.rewrite_clj$node$protocols$InnerNode$replace_children$arity$2 = (function (node,children_SINGLEQUOTE_){
var self__ = this;
var node__$1 = this;
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(node__$1,new cljs.core.Keyword(null,"children","children",-940561982),rewrite_clj.node.namespaced_map.apply_context(children_SINGLEQUOTE_));
}));

(rewrite_clj.node.namespaced_map.NamespacedMapNode.prototype.rewrite_clj$node$protocols$InnerNode$leader_length$arity$1 = (function (_node){
var self__ = this;
var _node__$1 = this;
return ((2) - (1));
}));

(rewrite_clj.node.namespaced_map.NamespacedMapNode.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = (function (this__5307__auto__,k64382){
var self__ = this;
var this__5307__auto____$1 = this;
var G__64464 = k64382;
var G__64464__$1 = (((G__64464 instanceof cljs.core.Keyword))?G__64464.fqn:null);
switch (G__64464__$1) {
case "children":
return true;

break;
default:
return cljs.core.contains_QMARK_(self__.__extmap,k64382);

}
}));

(rewrite_clj.node.namespaced_map.NamespacedMapNode.prototype.cljs$core$IAssociative$_assoc$arity$3 = (function (this__5308__auto__,k__5309__auto__,G__64381){
var self__ = this;
var this__5308__auto____$1 = this;
var pred__64467 = cljs.core.keyword_identical_QMARK_;
var expr__64468 = k__5309__auto__;
if(cljs.core.truth_((pred__64467.cljs$core$IFn$_invoke$arity$2 ? pred__64467.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"children","children",-940561982),expr__64468) : pred__64467.call(null,new cljs.core.Keyword(null,"children","children",-940561982),expr__64468)))){
return (new rewrite_clj.node.namespaced_map.NamespacedMapNode(G__64381,self__.__meta,self__.__extmap,null));
} else {
return (new rewrite_clj.node.namespaced_map.NamespacedMapNode(self__.children,self__.__meta,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(self__.__extmap,k__5309__auto__,G__64381),null));
}
}));

(rewrite_clj.node.namespaced_map.NamespacedMapNode.prototype.cljs$core$ISeqable$_seq$arity$1 = (function (this__5313__auto__){
var self__ = this;
var this__5313__auto____$1 = this;
return cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [(new cljs.core.MapEntry(new cljs.core.Keyword(null,"children","children",-940561982),self__.children,null))], null),self__.__extmap));
}));

(rewrite_clj.node.namespaced_map.NamespacedMapNode.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = (function (this__5299__auto__,G__64381){
var self__ = this;
var this__5299__auto____$1 = this;
return (new rewrite_clj.node.namespaced_map.NamespacedMapNode(self__.children,G__64381,self__.__extmap,self__.__hash));
}));

(rewrite_clj.node.namespaced_map.NamespacedMapNode.prototype.cljs$core$ICollection$_conj$arity$2 = (function (this__5305__auto__,entry__5306__auto__){
var self__ = this;
var this__5305__auto____$1 = this;
if(cljs.core.vector_QMARK_(entry__5306__auto__)){
return this__5305__auto____$1.cljs$core$IAssociative$_assoc$arity$3(null,cljs.core._nth(entry__5306__auto__,(0)),cljs.core._nth(entry__5306__auto__,(1)));
} else {
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3(cljs.core._conj,this__5305__auto____$1,entry__5306__auto__);
}
}));

(rewrite_clj.node.namespaced_map.NamespacedMapNode.getBasis = (function (){
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"children","children",699969545,null)], null);
}));

(rewrite_clj.node.namespaced_map.NamespacedMapNode.cljs$lang$type = true);

(rewrite_clj.node.namespaced_map.NamespacedMapNode.cljs$lang$ctorPrSeq = (function (this__5346__auto__){
return (new cljs.core.List(null,"rewrite-clj.node.namespaced-map/NamespacedMapNode",null,(1),null));
}));

(rewrite_clj.node.namespaced_map.NamespacedMapNode.cljs$lang$ctorPrWriter = (function (this__5346__auto__,writer__5347__auto__){
return cljs.core._write(writer__5347__auto__,"rewrite-clj.node.namespaced-map/NamespacedMapNode");
}));

/**
 * Positional factory function for rewrite-clj.node.namespaced-map/NamespacedMapNode.
 */
rewrite_clj.node.namespaced_map.__GT_NamespacedMapNode = (function rewrite_clj$node$namespaced_map$__GT_NamespacedMapNode(children){
return (new rewrite_clj.node.namespaced_map.NamespacedMapNode(children,null,null,null));
});

/**
 * Factory function for rewrite-clj.node.namespaced-map/NamespacedMapNode, taking a map of keywords to field values.
 */
rewrite_clj.node.namespaced_map.map__GT_NamespacedMapNode = (function rewrite_clj$node$namespaced_map$map__GT_NamespacedMapNode(G__64390){
var extmap__5342__auto__ = (function (){var G__64479 = cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(G__64390,new cljs.core.Keyword(null,"children","children",-940561982));
if(cljs.core.record_QMARK_(G__64390)){
return cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,G__64479);
} else {
return G__64479;
}
})();
return (new rewrite_clj.node.namespaced_map.NamespacedMapNode(new cljs.core.Keyword(null,"children","children",-940561982).cljs$core$IFn$_invoke$arity$1(G__64390),null,cljs.core.not_empty(extmap__5342__auto__),null));
});

rewrite_clj.node.protocols.make_printable_BANG_(rewrite_clj.node.namespaced_map.MapQualifierNode);
rewrite_clj.node.protocols.make_printable_BANG_(rewrite_clj.node.namespaced_map.NamespacedMapNode);
/**
 * Create a map qualifier node.
 * The map qualifier node is a child node of [[namespaced-map-node]].
 * 
 * ```Clojure
 * (require '[rewrite-clj.node :as n])
 * 
 * ;; qualified
 * (-> (n/map-qualifier-node false "my-prefix")
 *     n/string)
 * ;; => ":my-prefix"
 * 
 * ;; auto-resolved to current ns
 * (-> (n/map-qualifier-node true nil)
 *     n/string)
 * ;; => "::"
 * 
 * ;; auto-resolve to namespace with alias
 * (-> (n/map-qualifier-node true "my-ns-alias")
 *     n/string)
 * ;; => "::my-ns-alias"
 * ```
 */
rewrite_clj.node.namespaced_map.map_qualifier_node = (function rewrite_clj$node$namespaced_map$map_qualifier_node(auto_resolved_QMARK_,prefix){
return rewrite_clj.node.namespaced_map.__GT_MapQualifierNode(auto_resolved_QMARK_,prefix);
});
/**
 * Create a namespaced map node with `children`.
 * 
 * ```Clojure
 * (require '[rewrite-clj.node :as n])
 * 
 * (-> (n/namespaced-map-node [(n/map-qualifier-node true "my-ns-alias")
 *                             (n/spaces 1)
 *                             (n/map-node [(n/keyword-node :a)
 *                                          (n/spaces 1)
 *                                          (n/token-node 1)])])
 *     n/string)
 * ;; => "#::my-ns-alias {:a 1}"
 * ```
 * 
 * Map qualifier context is automatically applied to map keys for sexpr support.
 * 
 * See also [[map-qualifier-node]] and [[map-node]].
 */
rewrite_clj.node.namespaced_map.namespaced_map_node = (function rewrite_clj$node$namespaced_map$namespaced_map_node(children){
return rewrite_clj.node.namespaced_map.__GT_NamespacedMapNode(rewrite_clj.node.namespaced_map.apply_context(children));
});

//# sourceMappingURL=rewrite_clj.node.namespaced_map.js.map
