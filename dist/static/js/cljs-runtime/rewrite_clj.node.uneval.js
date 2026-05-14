goog.provide('rewrite_clj.node.uneval');

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
rewrite_clj.node.uneval.UnevalNode = (function (children,__meta,__extmap,__hash){
this.children = children;
this.__meta = __meta;
this.__extmap = __extmap;
this.__hash = __hash;
this.cljs$lang$protocol_mask$partition0$ = 2230716170;
this.cljs$lang$protocol_mask$partition1$ = 139264;
});
(rewrite_clj.node.uneval.UnevalNode.prototype.toString = (function (){
var self__ = this;
var node = this;
return node.rewrite_clj$node$protocols$Node$string$arity$1(null);
}));

(rewrite_clj.node.uneval.UnevalNode.prototype.cljs$core$ILookup$_lookup$arity$2 = (function (this__5300__auto__,k__5301__auto__){
var self__ = this;
var this__5300__auto____$1 = this;
return this__5300__auto____$1.cljs$core$ILookup$_lookup$arity$3(null,k__5301__auto__,null);
}));

(rewrite_clj.node.uneval.UnevalNode.prototype.cljs$core$ILookup$_lookup$arity$3 = (function (this__5302__auto__,k65087,else__5303__auto__){
var self__ = this;
var this__5302__auto____$1 = this;
var G__65124 = k65087;
var G__65124__$1 = (((G__65124 instanceof cljs.core.Keyword))?G__65124.fqn:null);
switch (G__65124__$1) {
case "children":
return self__.children;

break;
default:
return cljs.core.get.cljs$core$IFn$_invoke$arity$3(self__.__extmap,k65087,else__5303__auto__);

}
}));

(rewrite_clj.node.uneval.UnevalNode.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = (function (this__5320__auto__,f__5321__auto__,init__5322__auto__){
var self__ = this;
var this__5320__auto____$1 = this;
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (ret__5323__auto__,p__65133){
var vec__65135 = p__65133;
var k__5324__auto__ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__65135,(0),null);
var v__5325__auto__ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__65135,(1),null);
return (f__5321__auto__.cljs$core$IFn$_invoke$arity$3 ? f__5321__auto__.cljs$core$IFn$_invoke$arity$3(ret__5323__auto__,k__5324__auto__,v__5325__auto__) : f__5321__auto__.call(null,ret__5323__auto__,k__5324__auto__,v__5325__auto__));
}),init__5322__auto__,this__5320__auto____$1);
}));

(rewrite_clj.node.uneval.UnevalNode.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = (function (this__5315__auto__,writer__5316__auto__,opts__5317__auto__){
var self__ = this;
var this__5315__auto____$1 = this;
var pr_pair__5318__auto__ = (function (keyval__5319__auto__){
return cljs.core.pr_sequential_writer(writer__5316__auto__,cljs.core.pr_writer,""," ","",opts__5317__auto__,keyval__5319__auto__);
});
return cljs.core.pr_sequential_writer(writer__5316__auto__,pr_pair__5318__auto__,"#rewrite-clj.node.uneval.UnevalNode{",", ","}",opts__5317__auto__,cljs.core.concat.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [(new cljs.core.PersistentVector(null,2,(5),cljs.core.PersistentVector.EMPTY_NODE,[new cljs.core.Keyword(null,"children","children",-940561982),self__.children],null))], null),self__.__extmap));
}));

(rewrite_clj.node.uneval.UnevalNode.prototype.cljs$core$IIterable$_iterator$arity$1 = (function (G__65085){
var self__ = this;
var G__65085__$1 = this;
return (new cljs.core.RecordIter((0),G__65085__$1,1,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"children","children",-940561982)], null),(cljs.core.truth_(self__.__extmap)?cljs.core._iterator(self__.__extmap):cljs.core.nil_iter())));
}));

(rewrite_clj.node.uneval.UnevalNode.prototype.cljs$core$IMeta$_meta$arity$1 = (function (this__5298__auto__){
var self__ = this;
var this__5298__auto____$1 = this;
return self__.__meta;
}));

(rewrite_clj.node.uneval.UnevalNode.prototype.cljs$core$ICloneable$_clone$arity$1 = (function (this__5295__auto__){
var self__ = this;
var this__5295__auto____$1 = this;
return (new rewrite_clj.node.uneval.UnevalNode(self__.children,self__.__meta,self__.__extmap,self__.__hash));
}));

(rewrite_clj.node.uneval.UnevalNode.prototype.cljs$core$ICounted$_count$arity$1 = (function (this__5304__auto__){
var self__ = this;
var this__5304__auto____$1 = this;
return (1 + cljs.core.count(self__.__extmap));
}));

(rewrite_clj.node.uneval.UnevalNode.prototype.cljs$core$IHash$_hash$arity$1 = (function (this__5296__auto__){
var self__ = this;
var this__5296__auto____$1 = this;
var h__5111__auto__ = self__.__hash;
if((!((h__5111__auto__ == null)))){
return h__5111__auto__;
} else {
var h__5111__auto____$1 = (function (coll__5297__auto__){
return (-1883175395 ^ cljs.core.hash_unordered_coll(coll__5297__auto__));
})(this__5296__auto____$1);
(self__.__hash = h__5111__auto____$1);

return h__5111__auto____$1;
}
}));

(rewrite_clj.node.uneval.UnevalNode.prototype.cljs$core$IEquiv$_equiv$arity$2 = (function (this65093,other65094){
var self__ = this;
var this65093__$1 = this;
return (((!((other65094 == null)))) && ((((this65093__$1.constructor === other65094.constructor)) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(this65093__$1.children,other65094.children)) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(this65093__$1.__extmap,other65094.__extmap)))))));
}));

(rewrite_clj.node.uneval.UnevalNode.prototype.rewrite_clj$node$protocols$Node$ = cljs.core.PROTOCOL_SENTINEL);

(rewrite_clj.node.uneval.UnevalNode.prototype.rewrite_clj$node$protocols$Node$tag$arity$1 = (function (_node){
var self__ = this;
var _node__$1 = this;
return new cljs.core.Keyword(null,"uneval","uneval",1932037707);
}));

(rewrite_clj.node.uneval.UnevalNode.prototype.rewrite_clj$node$protocols$Node$node_type$arity$1 = (function (_node){
var self__ = this;
var _node__$1 = this;
return new cljs.core.Keyword(null,"uneval","uneval",1932037707);
}));

(rewrite_clj.node.uneval.UnevalNode.prototype.rewrite_clj$node$protocols$Node$printable_only_QMARK_$arity$1 = (function (_node){
var self__ = this;
var _node__$1 = this;
return true;
}));

(rewrite_clj.node.uneval.UnevalNode.prototype.rewrite_clj$node$protocols$Node$sexpr_STAR_$arity$2 = (function (_node,_opts){
var self__ = this;
var _node__$1 = this;
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2("unsupported operation",cljs.core.PersistentArrayMap.EMPTY);
}));

(rewrite_clj.node.uneval.UnevalNode.prototype.rewrite_clj$node$protocols$Node$length$arity$1 = (function (_node){
var self__ = this;
var _node__$1 = this;
return ((2) + rewrite_clj.node.protocols.sum_lengths(self__.children));
}));

(rewrite_clj.node.uneval.UnevalNode.prototype.rewrite_clj$node$protocols$Node$string$arity$1 = (function (_node){
var self__ = this;
var _node__$1 = this;
return ["#_",cljs.core.str.cljs$core$IFn$_invoke$arity$1(rewrite_clj.node.protocols.concat_strings(self__.children))].join('');
}));

(rewrite_clj.node.uneval.UnevalNode.prototype.cljs$core$IMap$_dissoc$arity$2 = (function (this__5310__auto__,k__5311__auto__){
var self__ = this;
var this__5310__auto____$1 = this;
if(cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"children","children",-940561982),null], null), null),k__5311__auto__)){
return cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(cljs.core._with_meta(cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,this__5310__auto____$1),self__.__meta),k__5311__auto__);
} else {
return (new rewrite_clj.node.uneval.UnevalNode(self__.children,self__.__meta,cljs.core.not_empty(cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(self__.__extmap,k__5311__auto__)),null));
}
}));

(rewrite_clj.node.uneval.UnevalNode.prototype.rewrite_clj$node$protocols$InnerNode$ = cljs.core.PROTOCOL_SENTINEL);

(rewrite_clj.node.uneval.UnevalNode.prototype.rewrite_clj$node$protocols$InnerNode$inner_QMARK_$arity$1 = (function (_node){
var self__ = this;
var _node__$1 = this;
return true;
}));

(rewrite_clj.node.uneval.UnevalNode.prototype.rewrite_clj$node$protocols$InnerNode$children$arity$1 = (function (_node){
var self__ = this;
var _node__$1 = this;
return self__.children;
}));

(rewrite_clj.node.uneval.UnevalNode.prototype.rewrite_clj$node$protocols$InnerNode$replace_children$arity$2 = (function (node,children_SINGLEQUOTE_){
var self__ = this;
var node__$1 = this;
rewrite_clj.node.protocols.assert_single_sexpr(children_SINGLEQUOTE_);

return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(node__$1,new cljs.core.Keyword(null,"children","children",-940561982),children_SINGLEQUOTE_);
}));

(rewrite_clj.node.uneval.UnevalNode.prototype.rewrite_clj$node$protocols$InnerNode$leader_length$arity$1 = (function (_node){
var self__ = this;
var _node__$1 = this;
return (2);
}));

(rewrite_clj.node.uneval.UnevalNode.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = (function (this__5307__auto__,k65087){
var self__ = this;
var this__5307__auto____$1 = this;
var G__65215 = k65087;
var G__65215__$1 = (((G__65215 instanceof cljs.core.Keyword))?G__65215.fqn:null);
switch (G__65215__$1) {
case "children":
return true;

break;
default:
return cljs.core.contains_QMARK_(self__.__extmap,k65087);

}
}));

(rewrite_clj.node.uneval.UnevalNode.prototype.cljs$core$IAssociative$_assoc$arity$3 = (function (this__5308__auto__,k__5309__auto__,G__65085){
var self__ = this;
var this__5308__auto____$1 = this;
var pred__65228 = cljs.core.keyword_identical_QMARK_;
var expr__65229 = k__5309__auto__;
if(cljs.core.truth_((pred__65228.cljs$core$IFn$_invoke$arity$2 ? pred__65228.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"children","children",-940561982),expr__65229) : pred__65228.call(null,new cljs.core.Keyword(null,"children","children",-940561982),expr__65229)))){
return (new rewrite_clj.node.uneval.UnevalNode(G__65085,self__.__meta,self__.__extmap,null));
} else {
return (new rewrite_clj.node.uneval.UnevalNode(self__.children,self__.__meta,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(self__.__extmap,k__5309__auto__,G__65085),null));
}
}));

(rewrite_clj.node.uneval.UnevalNode.prototype.cljs$core$ISeqable$_seq$arity$1 = (function (this__5313__auto__){
var self__ = this;
var this__5313__auto____$1 = this;
return cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [(new cljs.core.MapEntry(new cljs.core.Keyword(null,"children","children",-940561982),self__.children,null))], null),self__.__extmap));
}));

(rewrite_clj.node.uneval.UnevalNode.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = (function (this__5299__auto__,G__65085){
var self__ = this;
var this__5299__auto____$1 = this;
return (new rewrite_clj.node.uneval.UnevalNode(self__.children,G__65085,self__.__extmap,self__.__hash));
}));

(rewrite_clj.node.uneval.UnevalNode.prototype.cljs$core$ICollection$_conj$arity$2 = (function (this__5305__auto__,entry__5306__auto__){
var self__ = this;
var this__5305__auto____$1 = this;
if(cljs.core.vector_QMARK_(entry__5306__auto__)){
return this__5305__auto____$1.cljs$core$IAssociative$_assoc$arity$3(null,cljs.core._nth(entry__5306__auto__,(0)),cljs.core._nth(entry__5306__auto__,(1)));
} else {
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3(cljs.core._conj,this__5305__auto____$1,entry__5306__auto__);
}
}));

(rewrite_clj.node.uneval.UnevalNode.getBasis = (function (){
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"children","children",699969545,null)], null);
}));

(rewrite_clj.node.uneval.UnevalNode.cljs$lang$type = true);

(rewrite_clj.node.uneval.UnevalNode.cljs$lang$ctorPrSeq = (function (this__5346__auto__){
return (new cljs.core.List(null,"rewrite-clj.node.uneval/UnevalNode",null,(1),null));
}));

(rewrite_clj.node.uneval.UnevalNode.cljs$lang$ctorPrWriter = (function (this__5346__auto__,writer__5347__auto__){
return cljs.core._write(writer__5347__auto__,"rewrite-clj.node.uneval/UnevalNode");
}));

/**
 * Positional factory function for rewrite-clj.node.uneval/UnevalNode.
 */
rewrite_clj.node.uneval.__GT_UnevalNode = (function rewrite_clj$node$uneval$__GT_UnevalNode(children){
return (new rewrite_clj.node.uneval.UnevalNode(children,null,null,null));
});

/**
 * Factory function for rewrite-clj.node.uneval/UnevalNode, taking a map of keywords to field values.
 */
rewrite_clj.node.uneval.map__GT_UnevalNode = (function rewrite_clj$node$uneval$map__GT_UnevalNode(G__65107){
var extmap__5342__auto__ = (function (){var G__65255 = cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(G__65107,new cljs.core.Keyword(null,"children","children",-940561982));
if(cljs.core.record_QMARK_(G__65107)){
return cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,G__65255);
} else {
return G__65255;
}
})();
return (new rewrite_clj.node.uneval.UnevalNode(new cljs.core.Keyword(null,"children","children",-940561982).cljs$core$IFn$_invoke$arity$1(G__65107),null,cljs.core.not_empty(extmap__5342__auto__),null));
});

rewrite_clj.node.protocols.make_printable_BANG_(rewrite_clj.node.uneval.UnevalNode);
/**
 * Create node representing an unevaled form with `children`.
 * 
 * ```Clojure
 * (require '[rewrite-clj.node :as n])
 * 
 * (-> (n/uneval-node [(n/spaces 1)
 *                     (n/token-node 42)])
 *     n/string)
 * ;; => "#_ 42"
 * ```
 */
rewrite_clj.node.uneval.uneval_node = (function rewrite_clj$node$uneval$uneval_node(children){
while(true){
if(cljs.core.sequential_QMARK_(children)){
rewrite_clj.node.protocols.assert_single_sexpr(children);

return rewrite_clj.node.uneval.__GT_UnevalNode(children);
} else {
var G__65339 = new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [children], null);
children = G__65339;
continue;
}
break;
}
});

//# sourceMappingURL=rewrite_clj.node.uneval.js.map
