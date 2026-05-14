goog.provide('rewrite_clj.node.integer');

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
rewrite_clj.node.integer.IntNode = (function (value,base,__meta,__extmap,__hash){
this.value = value;
this.base = base;
this.__meta = __meta;
this.__extmap = __extmap;
this.__hash = __hash;
this.cljs$lang$protocol_mask$partition0$ = 2230716170;
this.cljs$lang$protocol_mask$partition1$ = 139264;
});
(rewrite_clj.node.integer.IntNode.prototype.toString = (function (){
var self__ = this;
var node = this;
return node.rewrite_clj$node$protocols$Node$string$arity$1(null);
}));

(rewrite_clj.node.integer.IntNode.prototype.cljs$core$ILookup$_lookup$arity$2 = (function (this__5300__auto__,k__5301__auto__){
var self__ = this;
var this__5300__auto____$1 = this;
return this__5300__auto____$1.cljs$core$ILookup$_lookup$arity$3(null,k__5301__auto__,null);
}));

(rewrite_clj.node.integer.IntNode.prototype.cljs$core$ILookup$_lookup$arity$3 = (function (this__5302__auto__,k64235,else__5303__auto__){
var self__ = this;
var this__5302__auto____$1 = this;
var G__64240 = k64235;
var G__64240__$1 = (((G__64240 instanceof cljs.core.Keyword))?G__64240.fqn:null);
switch (G__64240__$1) {
case "value":
return self__.value;

break;
case "base":
return self__.base;

break;
default:
return cljs.core.get.cljs$core$IFn$_invoke$arity$3(self__.__extmap,k64235,else__5303__auto__);

}
}));

(rewrite_clj.node.integer.IntNode.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = (function (this__5320__auto__,f__5321__auto__,init__5322__auto__){
var self__ = this;
var this__5320__auto____$1 = this;
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (ret__5323__auto__,p__64246){
var vec__64247 = p__64246;
var k__5324__auto__ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__64247,(0),null);
var v__5325__auto__ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__64247,(1),null);
return (f__5321__auto__.cljs$core$IFn$_invoke$arity$3 ? f__5321__auto__.cljs$core$IFn$_invoke$arity$3(ret__5323__auto__,k__5324__auto__,v__5325__auto__) : f__5321__auto__.call(null,ret__5323__auto__,k__5324__auto__,v__5325__auto__));
}),init__5322__auto__,this__5320__auto____$1);
}));

(rewrite_clj.node.integer.IntNode.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = (function (this__5315__auto__,writer__5316__auto__,opts__5317__auto__){
var self__ = this;
var this__5315__auto____$1 = this;
var pr_pair__5318__auto__ = (function (keyval__5319__auto__){
return cljs.core.pr_sequential_writer(writer__5316__auto__,cljs.core.pr_writer,""," ","",opts__5317__auto__,keyval__5319__auto__);
});
return cljs.core.pr_sequential_writer(writer__5316__auto__,pr_pair__5318__auto__,"#rewrite-clj.node.integer.IntNode{",", ","}",opts__5317__auto__,cljs.core.concat.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [(new cljs.core.PersistentVector(null,2,(5),cljs.core.PersistentVector.EMPTY_NODE,[new cljs.core.Keyword(null,"value","value",305978217),self__.value],null)),(new cljs.core.PersistentVector(null,2,(5),cljs.core.PersistentVector.EMPTY_NODE,[new cljs.core.Keyword(null,"base","base",185279322),self__.base],null))], null),self__.__extmap));
}));

(rewrite_clj.node.integer.IntNode.prototype.cljs$core$IIterable$_iterator$arity$1 = (function (G__64234){
var self__ = this;
var G__64234__$1 = this;
return (new cljs.core.RecordIter((0),G__64234__$1,2,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"value","value",305978217),new cljs.core.Keyword(null,"base","base",185279322)], null),(cljs.core.truth_(self__.__extmap)?cljs.core._iterator(self__.__extmap):cljs.core.nil_iter())));
}));

(rewrite_clj.node.integer.IntNode.prototype.cljs$core$IMeta$_meta$arity$1 = (function (this__5298__auto__){
var self__ = this;
var this__5298__auto____$1 = this;
return self__.__meta;
}));

(rewrite_clj.node.integer.IntNode.prototype.cljs$core$ICloneable$_clone$arity$1 = (function (this__5295__auto__){
var self__ = this;
var this__5295__auto____$1 = this;
return (new rewrite_clj.node.integer.IntNode(self__.value,self__.base,self__.__meta,self__.__extmap,self__.__hash));
}));

(rewrite_clj.node.integer.IntNode.prototype.cljs$core$ICounted$_count$arity$1 = (function (this__5304__auto__){
var self__ = this;
var this__5304__auto____$1 = this;
return (2 + cljs.core.count(self__.__extmap));
}));

(rewrite_clj.node.integer.IntNode.prototype.cljs$core$IHash$_hash$arity$1 = (function (this__5296__auto__){
var self__ = this;
var this__5296__auto____$1 = this;
var h__5111__auto__ = self__.__hash;
if((!((h__5111__auto__ == null)))){
return h__5111__auto__;
} else {
var h__5111__auto____$1 = (function (coll__5297__auto__){
return (-2088146928 ^ cljs.core.hash_unordered_coll(coll__5297__auto__));
})(this__5296__auto____$1);
(self__.__hash = h__5111__auto____$1);

return h__5111__auto____$1;
}
}));

(rewrite_clj.node.integer.IntNode.prototype.cljs$core$IEquiv$_equiv$arity$2 = (function (this64236,other64237){
var self__ = this;
var this64236__$1 = this;
return (((!((other64237 == null)))) && ((((this64236__$1.constructor === other64237.constructor)) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(this64236__$1.value,other64237.value)) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(this64236__$1.base,other64237.base)) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(this64236__$1.__extmap,other64237.__extmap)))))))));
}));

(rewrite_clj.node.integer.IntNode.prototype.rewrite_clj$node$protocols$Node$ = cljs.core.PROTOCOL_SENTINEL);

(rewrite_clj.node.integer.IntNode.prototype.rewrite_clj$node$protocols$Node$tag$arity$1 = (function (_node){
var self__ = this;
var _node__$1 = this;
return new cljs.core.Keyword(null,"token","token",-1211463215);
}));

(rewrite_clj.node.integer.IntNode.prototype.rewrite_clj$node$protocols$Node$node_type$arity$1 = (function (_node){
var self__ = this;
var _node__$1 = this;
return new cljs.core.Keyword(null,"int","int",-1741416922);
}));

(rewrite_clj.node.integer.IntNode.prototype.rewrite_clj$node$protocols$Node$printable_only_QMARK_$arity$1 = (function (_node){
var self__ = this;
var _node__$1 = this;
return false;
}));

(rewrite_clj.node.integer.IntNode.prototype.rewrite_clj$node$protocols$Node$sexpr_STAR_$arity$2 = (function (_node,_opts){
var self__ = this;
var _node__$1 = this;
return self__.value;
}));

(rewrite_clj.node.integer.IntNode.prototype.rewrite_clj$node$protocols$Node$length$arity$1 = (function (node){
var self__ = this;
var node__$1 = this;
return cljs.core.count(node__$1.rewrite_clj$node$protocols$Node$string$arity$1(null));
}));

(rewrite_clj.node.integer.IntNode.prototype.rewrite_clj$node$protocols$Node$string$arity$1 = (function (_node){
var self__ = this;
var _node__$1 = this;
var sign = (((self__.value < (0)))?"-":null);
var abs_value = (function (){var G__64267 = self__.value;
if((self__.value < (0))){
return (- G__64267);
} else {
return G__64267;
}
})();
var s = rewrite_clj.interop.int__GT_str(abs_value,self__.base);
var prefix = (function (){var G__64269 = cljs.core.long$(self__.base);
switch (G__64269) {
case (8):
return "0";

break;
case (10):
return "";

break;
case (16):
return "0x";

break;
default:
return [cljs.core.str.cljs$core$IFn$_invoke$arity$1(self__.base),"r"].join('');

}
})();
return [sign,cljs.core.str.cljs$core$IFn$_invoke$arity$1(prefix),cljs.core.str.cljs$core$IFn$_invoke$arity$1(s)].join('');
}));

(rewrite_clj.node.integer.IntNode.prototype.cljs$core$IMap$_dissoc$arity$2 = (function (this__5310__auto__,k__5311__auto__){
var self__ = this;
var this__5310__auto____$1 = this;
if(cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"value","value",305978217),null,new cljs.core.Keyword(null,"base","base",185279322),null], null), null),k__5311__auto__)){
return cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(cljs.core._with_meta(cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,this__5310__auto____$1),self__.__meta),k__5311__auto__);
} else {
return (new rewrite_clj.node.integer.IntNode(self__.value,self__.base,self__.__meta,cljs.core.not_empty(cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(self__.__extmap,k__5311__auto__)),null));
}
}));

(rewrite_clj.node.integer.IntNode.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = (function (this__5307__auto__,k64235){
var self__ = this;
var this__5307__auto____$1 = this;
var G__64273 = k64235;
var G__64273__$1 = (((G__64273 instanceof cljs.core.Keyword))?G__64273.fqn:null);
switch (G__64273__$1) {
case "value":
case "base":
return true;

break;
default:
return cljs.core.contains_QMARK_(self__.__extmap,k64235);

}
}));

(rewrite_clj.node.integer.IntNode.prototype.cljs$core$IAssociative$_assoc$arity$3 = (function (this__5308__auto__,k__5309__auto__,G__64234){
var self__ = this;
var this__5308__auto____$1 = this;
var pred__64274 = cljs.core.keyword_identical_QMARK_;
var expr__64275 = k__5309__auto__;
if(cljs.core.truth_((pred__64274.cljs$core$IFn$_invoke$arity$2 ? pred__64274.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"value","value",305978217),expr__64275) : pred__64274.call(null,new cljs.core.Keyword(null,"value","value",305978217),expr__64275)))){
return (new rewrite_clj.node.integer.IntNode(G__64234,self__.base,self__.__meta,self__.__extmap,null));
} else {
if(cljs.core.truth_((pred__64274.cljs$core$IFn$_invoke$arity$2 ? pred__64274.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"base","base",185279322),expr__64275) : pred__64274.call(null,new cljs.core.Keyword(null,"base","base",185279322),expr__64275)))){
return (new rewrite_clj.node.integer.IntNode(self__.value,G__64234,self__.__meta,self__.__extmap,null));
} else {
return (new rewrite_clj.node.integer.IntNode(self__.value,self__.base,self__.__meta,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(self__.__extmap,k__5309__auto__,G__64234),null));
}
}
}));

(rewrite_clj.node.integer.IntNode.prototype.cljs$core$ISeqable$_seq$arity$1 = (function (this__5313__auto__){
var self__ = this;
var this__5313__auto____$1 = this;
return cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [(new cljs.core.MapEntry(new cljs.core.Keyword(null,"value","value",305978217),self__.value,null)),(new cljs.core.MapEntry(new cljs.core.Keyword(null,"base","base",185279322),self__.base,null))], null),self__.__extmap));
}));

(rewrite_clj.node.integer.IntNode.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = (function (this__5299__auto__,G__64234){
var self__ = this;
var this__5299__auto____$1 = this;
return (new rewrite_clj.node.integer.IntNode(self__.value,self__.base,G__64234,self__.__extmap,self__.__hash));
}));

(rewrite_clj.node.integer.IntNode.prototype.cljs$core$ICollection$_conj$arity$2 = (function (this__5305__auto__,entry__5306__auto__){
var self__ = this;
var this__5305__auto____$1 = this;
if(cljs.core.vector_QMARK_(entry__5306__auto__)){
return this__5305__auto____$1.cljs$core$IAssociative$_assoc$arity$3(null,cljs.core._nth(entry__5306__auto__,(0)),cljs.core._nth(entry__5306__auto__,(1)));
} else {
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3(cljs.core._conj,this__5305__auto____$1,entry__5306__auto__);
}
}));

(rewrite_clj.node.integer.IntNode.getBasis = (function (){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"value","value",1946509744,null),new cljs.core.Symbol(null,"base","base",1825810849,null)], null);
}));

(rewrite_clj.node.integer.IntNode.cljs$lang$type = true);

(rewrite_clj.node.integer.IntNode.cljs$lang$ctorPrSeq = (function (this__5346__auto__){
return (new cljs.core.List(null,"rewrite-clj.node.integer/IntNode",null,(1),null));
}));

(rewrite_clj.node.integer.IntNode.cljs$lang$ctorPrWriter = (function (this__5346__auto__,writer__5347__auto__){
return cljs.core._write(writer__5347__auto__,"rewrite-clj.node.integer/IntNode");
}));

/**
 * Positional factory function for rewrite-clj.node.integer/IntNode.
 */
rewrite_clj.node.integer.__GT_IntNode = (function rewrite_clj$node$integer$__GT_IntNode(value,base){
return (new rewrite_clj.node.integer.IntNode(value,base,null,null,null));
});

/**
 * Factory function for rewrite-clj.node.integer/IntNode, taking a map of keywords to field values.
 */
rewrite_clj.node.integer.map__GT_IntNode = (function rewrite_clj$node$integer$map__GT_IntNode(G__64238){
var extmap__5342__auto__ = (function (){var G__64277 = cljs.core.dissoc.cljs$core$IFn$_invoke$arity$variadic(G__64238,new cljs.core.Keyword(null,"value","value",305978217),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"base","base",185279322)], 0));
if(cljs.core.record_QMARK_(G__64238)){
return cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,G__64277);
} else {
return G__64277;
}
})();
return (new rewrite_clj.node.integer.IntNode(new cljs.core.Keyword(null,"value","value",305978217).cljs$core$IFn$_invoke$arity$1(G__64238),new cljs.core.Keyword(null,"base","base",185279322).cljs$core$IFn$_invoke$arity$1(G__64238),null,cljs.core.not_empty(extmap__5342__auto__),null));
});

rewrite_clj.node.protocols.make_printable_BANG_(rewrite_clj.node.integer.IntNode);
/**
 * Create node representing an integer `value` in `base`.
 * 
 *   `base` defaults to 10.
 * 
 * ```Clojure
 * (require '[rewrite-clj.node :as n])
 * 
 * (-> (n/integer-node 42)
 *     n/string)
 * ;; => "42"
 * 
 * (-> (n/integer-node 31 2)
 *     n/string)
 * ;; => "2r11111"
 * ```
 * 
 * Note: the parser does not currently parse to integer-nodes, but they fully supported for output.
 */
rewrite_clj.node.integer.integer_node = (function rewrite_clj$node$integer$integer_node(var_args){
var G__64281 = arguments.length;
switch (G__64281) {
case 1:
return rewrite_clj.node.integer.integer_node.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return rewrite_clj.node.integer.integer_node.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(rewrite_clj.node.integer.integer_node.cljs$core$IFn$_invoke$arity$1 = (function (value){
return rewrite_clj.node.integer.integer_node.cljs$core$IFn$_invoke$arity$2(value,(10));
}));

(rewrite_clj.node.integer.integer_node.cljs$core$IFn$_invoke$arity$2 = (function (value,base){
if(cljs.core.integer_QMARK_(value)){
} else {
throw (new Error("Assert failed: (integer? value)"));
}

if(cljs.core.integer_QMARK_(base)){
} else {
throw (new Error("Assert failed: (integer? base)"));
}

if(((((1) < base)) && ((base < (37))))){
} else {
throw (new Error("Assert failed: (< 1 base 37)"));
}

return rewrite_clj.node.integer.__GT_IntNode(value,base);
}));

(rewrite_clj.node.integer.integer_node.cljs$lang$maxFixedArity = 2);


//# sourceMappingURL=rewrite_clj.node.integer.js.map
