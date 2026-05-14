goog.provide('rewrite_clj.node.meta');

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
rewrite_clj.node.meta.MetaNode = (function (tag,prefix,children,__meta,__extmap,__hash){
this.tag = tag;
this.prefix = prefix;
this.children = children;
this.__meta = __meta;
this.__extmap = __extmap;
this.__hash = __hash;
this.cljs$lang$protocol_mask$partition0$ = 2230716170;
this.cljs$lang$protocol_mask$partition1$ = 139264;
});
(rewrite_clj.node.meta.MetaNode.prototype.toString = (function (){
var self__ = this;
var node = this;
return node.rewrite_clj$node$protocols$Node$string$arity$1(null);
}));

(rewrite_clj.node.meta.MetaNode.prototype.cljs$core$ILookup$_lookup$arity$2 = (function (this__5300__auto__,k__5301__auto__){
var self__ = this;
var this__5300__auto____$1 = this;
return this__5300__auto____$1.cljs$core$ILookup$_lookup$arity$3(null,k__5301__auto__,null);
}));

(rewrite_clj.node.meta.MetaNode.prototype.cljs$core$ILookup$_lookup$arity$3 = (function (this__5302__auto__,k65621,else__5303__auto__){
var self__ = this;
var this__5302__auto____$1 = this;
var G__65637 = k65621;
var G__65637__$1 = (((G__65637 instanceof cljs.core.Keyword))?G__65637.fqn:null);
switch (G__65637__$1) {
case "tag":
return self__.tag;

break;
case "prefix":
return self__.prefix;

break;
case "children":
return self__.children;

break;
default:
return cljs.core.get.cljs$core$IFn$_invoke$arity$3(self__.__extmap,k65621,else__5303__auto__);

}
}));

(rewrite_clj.node.meta.MetaNode.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = (function (this__5320__auto__,f__5321__auto__,init__5322__auto__){
var self__ = this;
var this__5320__auto____$1 = this;
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (ret__5323__auto__,p__65642){
var vec__65643 = p__65642;
var k__5324__auto__ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__65643,(0),null);
var v__5325__auto__ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__65643,(1),null);
return (f__5321__auto__.cljs$core$IFn$_invoke$arity$3 ? f__5321__auto__.cljs$core$IFn$_invoke$arity$3(ret__5323__auto__,k__5324__auto__,v__5325__auto__) : f__5321__auto__.call(null,ret__5323__auto__,k__5324__auto__,v__5325__auto__));
}),init__5322__auto__,this__5320__auto____$1);
}));

(rewrite_clj.node.meta.MetaNode.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = (function (this__5315__auto__,writer__5316__auto__,opts__5317__auto__){
var self__ = this;
var this__5315__auto____$1 = this;
var pr_pair__5318__auto__ = (function (keyval__5319__auto__){
return cljs.core.pr_sequential_writer(writer__5316__auto__,cljs.core.pr_writer,""," ","",opts__5317__auto__,keyval__5319__auto__);
});
return cljs.core.pr_sequential_writer(writer__5316__auto__,pr_pair__5318__auto__,"#rewrite-clj.node.meta.MetaNode{",", ","}",opts__5317__auto__,cljs.core.concat.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [(new cljs.core.PersistentVector(null,2,(5),cljs.core.PersistentVector.EMPTY_NODE,[new cljs.core.Keyword(null,"tag","tag",-1290361223),self__.tag],null)),(new cljs.core.PersistentVector(null,2,(5),cljs.core.PersistentVector.EMPTY_NODE,[new cljs.core.Keyword(null,"prefix","prefix",-265908465),self__.prefix],null)),(new cljs.core.PersistentVector(null,2,(5),cljs.core.PersistentVector.EMPTY_NODE,[new cljs.core.Keyword(null,"children","children",-940561982),self__.children],null))], null),self__.__extmap));
}));

(rewrite_clj.node.meta.MetaNode.prototype.cljs$core$IIterable$_iterator$arity$1 = (function (G__65620){
var self__ = this;
var G__65620__$1 = this;
return (new cljs.core.RecordIter((0),G__65620__$1,3,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"tag","tag",-1290361223),new cljs.core.Keyword(null,"prefix","prefix",-265908465),new cljs.core.Keyword(null,"children","children",-940561982)], null),(cljs.core.truth_(self__.__extmap)?cljs.core._iterator(self__.__extmap):cljs.core.nil_iter())));
}));

(rewrite_clj.node.meta.MetaNode.prototype.cljs$core$IMeta$_meta$arity$1 = (function (this__5298__auto__){
var self__ = this;
var this__5298__auto____$1 = this;
return self__.__meta;
}));

(rewrite_clj.node.meta.MetaNode.prototype.cljs$core$ICloneable$_clone$arity$1 = (function (this__5295__auto__){
var self__ = this;
var this__5295__auto____$1 = this;
return (new rewrite_clj.node.meta.MetaNode(self__.tag,self__.prefix,self__.children,self__.__meta,self__.__extmap,self__.__hash));
}));

(rewrite_clj.node.meta.MetaNode.prototype.cljs$core$ICounted$_count$arity$1 = (function (this__5304__auto__){
var self__ = this;
var this__5304__auto____$1 = this;
return (3 + cljs.core.count(self__.__extmap));
}));

(rewrite_clj.node.meta.MetaNode.prototype.cljs$core$IHash$_hash$arity$1 = (function (this__5296__auto__){
var self__ = this;
var this__5296__auto____$1 = this;
var h__5111__auto__ = self__.__hash;
if((!((h__5111__auto__ == null)))){
return h__5111__auto__;
} else {
var h__5111__auto____$1 = (function (coll__5297__auto__){
return (1501447658 ^ cljs.core.hash_unordered_coll(coll__5297__auto__));
})(this__5296__auto____$1);
(self__.__hash = h__5111__auto____$1);

return h__5111__auto____$1;
}
}));

(rewrite_clj.node.meta.MetaNode.prototype.cljs$core$IEquiv$_equiv$arity$2 = (function (this65622,other65623){
var self__ = this;
var this65622__$1 = this;
return (((!((other65623 == null)))) && ((((this65622__$1.constructor === other65623.constructor)) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(this65622__$1.tag,other65623.tag)) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(this65622__$1.prefix,other65623.prefix)) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(this65622__$1.children,other65623.children)) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(this65622__$1.__extmap,other65623.__extmap)))))))))));
}));

(rewrite_clj.node.meta.MetaNode.prototype.rewrite_clj$node$protocols$Node$ = cljs.core.PROTOCOL_SENTINEL);

(rewrite_clj.node.meta.MetaNode.prototype.rewrite_clj$node$protocols$Node$tag$arity$1 = (function (_node){
var self__ = this;
var _node__$1 = this;
return self__.tag;
}));

(rewrite_clj.node.meta.MetaNode.prototype.rewrite_clj$node$protocols$Node$node_type$arity$1 = (function (_node){
var self__ = this;
var _node__$1 = this;
return new cljs.core.Keyword(null,"meta","meta",1499536964);
}));

(rewrite_clj.node.meta.MetaNode.prototype.rewrite_clj$node$protocols$Node$printable_only_QMARK_$arity$1 = (function (_node){
var self__ = this;
var _node__$1 = this;
return false;
}));

(rewrite_clj.node.meta.MetaNode.prototype.rewrite_clj$node$protocols$Node$sexpr_STAR_$arity$2 = (function (_node,opts){
var self__ = this;
var _node__$1 = this;
var vec__65774 = rewrite_clj.node.protocols.sexprs.cljs$core$IFn$_invoke$arity$2(self__.children,opts);
var mta = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__65774,(0),null);
var data = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__65774,(1),null);
if(rewrite_clj.interop.meta_available_QMARK_(data)){
} else {
throw (new Error(["Assert failed: ",["cannot attach metadata to: ",cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([data], 0))].join(''),"\n","(interop/meta-available? data)"].join('')));
}

return cljs.core.vary_meta.cljs$core$IFn$_invoke$arity$3(data,cljs.core.merge,((cljs.core.map_QMARK_(mta))?mta:(((mta instanceof cljs.core.Keyword))?cljs.core.PersistentArrayMap.createAsIfByAssoc([mta,true]):(((mta instanceof cljs.core.Symbol))?new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),mta], null):((typeof mta === 'string')?new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),mta], null):((cljs.core.vector_QMARK_(mta))?new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"param-tags","param-tags",250134169),mta], null):(function(){throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2("Metadata must be a map, keyword, symbol or string",cljs.core.PersistentArrayMap.EMPTY)})()
))))));
}));

(rewrite_clj.node.meta.MetaNode.prototype.rewrite_clj$node$protocols$Node$length$arity$1 = (function (_node){
var self__ = this;
var _node__$1 = this;
return (cljs.core.count(self__.prefix) + rewrite_clj.node.protocols.sum_lengths(self__.children));
}));

(rewrite_clj.node.meta.MetaNode.prototype.rewrite_clj$node$protocols$Node$string$arity$1 = (function (_node){
var self__ = this;
var _node__$1 = this;
return [cljs.core.str.cljs$core$IFn$_invoke$arity$1(self__.prefix),cljs.core.str.cljs$core$IFn$_invoke$arity$1(rewrite_clj.node.protocols.concat_strings(self__.children))].join('');
}));

(rewrite_clj.node.meta.MetaNode.prototype.cljs$core$IMap$_dissoc$arity$2 = (function (this__5310__auto__,k__5311__auto__){
var self__ = this;
var this__5310__auto____$1 = this;
if(cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"children","children",-940561982),null,new cljs.core.Keyword(null,"prefix","prefix",-265908465),null,new cljs.core.Keyword(null,"tag","tag",-1290361223),null], null), null),k__5311__auto__)){
return cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(cljs.core._with_meta(cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,this__5310__auto____$1),self__.__meta),k__5311__auto__);
} else {
return (new rewrite_clj.node.meta.MetaNode(self__.tag,self__.prefix,self__.children,self__.__meta,cljs.core.not_empty(cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(self__.__extmap,k__5311__auto__)),null));
}
}));

(rewrite_clj.node.meta.MetaNode.prototype.rewrite_clj$node$protocols$InnerNode$ = cljs.core.PROTOCOL_SENTINEL);

(rewrite_clj.node.meta.MetaNode.prototype.rewrite_clj$node$protocols$InnerNode$inner_QMARK_$arity$1 = (function (_node){
var self__ = this;
var _node__$1 = this;
return true;
}));

(rewrite_clj.node.meta.MetaNode.prototype.rewrite_clj$node$protocols$InnerNode$children$arity$1 = (function (_node){
var self__ = this;
var _node__$1 = this;
return self__.children;
}));

(rewrite_clj.node.meta.MetaNode.prototype.rewrite_clj$node$protocols$InnerNode$replace_children$arity$2 = (function (this$,children_SINGLEQUOTE_){
var self__ = this;
var this$__$1 = this;
rewrite_clj.node.protocols.assert_sexpr_count(children_SINGLEQUOTE_,(2));

return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(this$__$1,new cljs.core.Keyword(null,"children","children",-940561982),children_SINGLEQUOTE_);
}));

(rewrite_clj.node.meta.MetaNode.prototype.rewrite_clj$node$protocols$InnerNode$leader_length$arity$1 = (function (_node){
var self__ = this;
var _node__$1 = this;
return cljs.core.count(self__.prefix);
}));

(rewrite_clj.node.meta.MetaNode.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = (function (this__5307__auto__,k65621){
var self__ = this;
var this__5307__auto____$1 = this;
var G__65837 = k65621;
var G__65837__$1 = (((G__65837 instanceof cljs.core.Keyword))?G__65837.fqn:null);
switch (G__65837__$1) {
case "tag":
case "prefix":
case "children":
return true;

break;
default:
return cljs.core.contains_QMARK_(self__.__extmap,k65621);

}
}));

(rewrite_clj.node.meta.MetaNode.prototype.cljs$core$IAssociative$_assoc$arity$3 = (function (this__5308__auto__,k__5309__auto__,G__65620){
var self__ = this;
var this__5308__auto____$1 = this;
var pred__65844 = cljs.core.keyword_identical_QMARK_;
var expr__65845 = k__5309__auto__;
if(cljs.core.truth_((pred__65844.cljs$core$IFn$_invoke$arity$2 ? pred__65844.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"tag","tag",-1290361223),expr__65845) : pred__65844.call(null,new cljs.core.Keyword(null,"tag","tag",-1290361223),expr__65845)))){
return (new rewrite_clj.node.meta.MetaNode(G__65620,self__.prefix,self__.children,self__.__meta,self__.__extmap,null));
} else {
if(cljs.core.truth_((pred__65844.cljs$core$IFn$_invoke$arity$2 ? pred__65844.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"prefix","prefix",-265908465),expr__65845) : pred__65844.call(null,new cljs.core.Keyword(null,"prefix","prefix",-265908465),expr__65845)))){
return (new rewrite_clj.node.meta.MetaNode(self__.tag,G__65620,self__.children,self__.__meta,self__.__extmap,null));
} else {
if(cljs.core.truth_((pred__65844.cljs$core$IFn$_invoke$arity$2 ? pred__65844.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"children","children",-940561982),expr__65845) : pred__65844.call(null,new cljs.core.Keyword(null,"children","children",-940561982),expr__65845)))){
return (new rewrite_clj.node.meta.MetaNode(self__.tag,self__.prefix,G__65620,self__.__meta,self__.__extmap,null));
} else {
return (new rewrite_clj.node.meta.MetaNode(self__.tag,self__.prefix,self__.children,self__.__meta,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(self__.__extmap,k__5309__auto__,G__65620),null));
}
}
}
}));

(rewrite_clj.node.meta.MetaNode.prototype.cljs$core$ISeqable$_seq$arity$1 = (function (this__5313__auto__){
var self__ = this;
var this__5313__auto____$1 = this;
return cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [(new cljs.core.MapEntry(new cljs.core.Keyword(null,"tag","tag",-1290361223),self__.tag,null)),(new cljs.core.MapEntry(new cljs.core.Keyword(null,"prefix","prefix",-265908465),self__.prefix,null)),(new cljs.core.MapEntry(new cljs.core.Keyword(null,"children","children",-940561982),self__.children,null))], null),self__.__extmap));
}));

(rewrite_clj.node.meta.MetaNode.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = (function (this__5299__auto__,G__65620){
var self__ = this;
var this__5299__auto____$1 = this;
return (new rewrite_clj.node.meta.MetaNode(self__.tag,self__.prefix,self__.children,G__65620,self__.__extmap,self__.__hash));
}));

(rewrite_clj.node.meta.MetaNode.prototype.cljs$core$ICollection$_conj$arity$2 = (function (this__5305__auto__,entry__5306__auto__){
var self__ = this;
var this__5305__auto____$1 = this;
if(cljs.core.vector_QMARK_(entry__5306__auto__)){
return this__5305__auto____$1.cljs$core$IAssociative$_assoc$arity$3(null,cljs.core._nth(entry__5306__auto__,(0)),cljs.core._nth(entry__5306__auto__,(1)));
} else {
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3(cljs.core._conj,this__5305__auto____$1,entry__5306__auto__);
}
}));

(rewrite_clj.node.meta.MetaNode.getBasis = (function (){
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"tag","tag",350170304,null),new cljs.core.Symbol(null,"prefix","prefix",1374623062,null),new cljs.core.Symbol(null,"children","children",699969545,null)], null);
}));

(rewrite_clj.node.meta.MetaNode.cljs$lang$type = true);

(rewrite_clj.node.meta.MetaNode.cljs$lang$ctorPrSeq = (function (this__5346__auto__){
return (new cljs.core.List(null,"rewrite-clj.node.meta/MetaNode",null,(1),null));
}));

(rewrite_clj.node.meta.MetaNode.cljs$lang$ctorPrWriter = (function (this__5346__auto__,writer__5347__auto__){
return cljs.core._write(writer__5347__auto__,"rewrite-clj.node.meta/MetaNode");
}));

/**
 * Positional factory function for rewrite-clj.node.meta/MetaNode.
 */
rewrite_clj.node.meta.__GT_MetaNode = (function rewrite_clj$node$meta$__GT_MetaNode(tag,prefix,children){
return (new rewrite_clj.node.meta.MetaNode(tag,prefix,children,null,null,null));
});

/**
 * Factory function for rewrite-clj.node.meta/MetaNode, taking a map of keywords to field values.
 */
rewrite_clj.node.meta.map__GT_MetaNode = (function rewrite_clj$node$meta$map__GT_MetaNode(G__65624){
var extmap__5342__auto__ = (function (){var G__65892 = cljs.core.dissoc.cljs$core$IFn$_invoke$arity$variadic(G__65624,new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"prefix","prefix",-265908465),new cljs.core.Keyword(null,"children","children",-940561982)], 0));
if(cljs.core.record_QMARK_(G__65624)){
return cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,G__65892);
} else {
return G__65892;
}
})();
return (new rewrite_clj.node.meta.MetaNode(new cljs.core.Keyword(null,"tag","tag",-1290361223).cljs$core$IFn$_invoke$arity$1(G__65624),new cljs.core.Keyword(null,"prefix","prefix",-265908465).cljs$core$IFn$_invoke$arity$1(G__65624),new cljs.core.Keyword(null,"children","children",-940561982).cljs$core$IFn$_invoke$arity$1(G__65624),null,cljs.core.not_empty(extmap__5342__auto__),null));
});

rewrite_clj.node.protocols.make_printable_BANG_(rewrite_clj.node.meta.MetaNode);
/**
 * Create a node representing a form with metadata.
 * 
 * When creating manually, you can specify `metadata` and `data` and spacing between the 2 elems will be included:
 * 
 * ```Clojure
 * (require '[rewrite-clj.node :as n])
 * 
 * (-> (n/meta-node (n/keyword-node :foo)
 *                  (n/vector-node [(n/token-node 1)]))
 *     n/string)
 * ;; => "^:foo [1]"
 * 
 * (-> (n/meta-node (n/map-node [:foo (n/spaces 1) 42])
 *                  (n/vector-node [(n/token-node 1)]))
 *     n/string)
 * ;; => "^{:foo 42} [1]"
 * ```
 * When specifying a sequence of `children`, spacing is explicit:
 * 
 * ```Clojure
 * (-> (n/meta-node [(n/keyword-node :foo)
 *                   (n/spaces 1)
 *                   (n/vector-node [(n/token-node 1)])])
 *     n/string)
 * ;; => "^:foo [1]"
 * ```
 * See also: [[raw-meta-node]]
 */
rewrite_clj.node.meta.meta_node = (function rewrite_clj$node$meta$meta_node(var_args){
var G__65908 = arguments.length;
switch (G__65908) {
case 1:
return rewrite_clj.node.meta.meta_node.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return rewrite_clj.node.meta.meta_node.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(rewrite_clj.node.meta.meta_node.cljs$core$IFn$_invoke$arity$1 = (function (children){
rewrite_clj.node.protocols.assert_sexpr_count(children,(2));

return rewrite_clj.node.meta.__GT_MetaNode(new cljs.core.Keyword(null,"meta","meta",1499536964),"^",children);
}));

(rewrite_clj.node.meta.meta_node.cljs$core$IFn$_invoke$arity$2 = (function (metadata,data){
return rewrite_clj.node.meta.meta_node.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [metadata,rewrite_clj.node.whitespace.spaces((1)),data], null));
}));

(rewrite_clj.node.meta.meta_node.cljs$lang$maxFixedArity = 2);

/**
 * Create a node representing a form with metadata that renders to the reader syntax.
 * 
 * When creating manually, you can specify `metadata` and `data` and spacing between the 2 elems will be included:
 * 
 * ```Clojure
 * (require '[rewrite-clj.node :as n])
 * 
 * (-> (n/raw-meta-node (n/keyword-node :foo)
 *                      (n/vector-node [(n/token-node 2)]))
 *      n/string)
 * ;; => "#^:foo [2]"
 * 
 * (-> (n/raw-meta-node (n/map-node [:foo (n/spaces 1) 42])
 *                      (n/vector-node [(n/token-node 2)]))
 *     n/string)
 * ;; => "#^{:foo 42} [2]"
 * ```
 * When specifying a sequence of `children`, spacing is explicit:
 * 
 * ```Clojure
 * (require '[rewrite-clj.node :as n])
 * 
 * (-> (n/raw-meta-node [(n/keyword-node :foo)
 *                       (n/spaces 1)
 *                       (n/vector-node [(n/token-node 2)])])
 *     n/string)
 * ;; => "#^:foo [2]"
 * ```
 * See also: [[meta-node]]
 */
rewrite_clj.node.meta.raw_meta_node = (function rewrite_clj$node$meta$raw_meta_node(var_args){
var G__65916 = arguments.length;
switch (G__65916) {
case 1:
return rewrite_clj.node.meta.raw_meta_node.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return rewrite_clj.node.meta.raw_meta_node.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(rewrite_clj.node.meta.raw_meta_node.cljs$core$IFn$_invoke$arity$1 = (function (children){
rewrite_clj.node.protocols.assert_sexpr_count(children,(2));

return rewrite_clj.node.meta.__GT_MetaNode(new cljs.core.Keyword(null,"meta*","meta*",-949431606),"#^",children);
}));

(rewrite_clj.node.meta.raw_meta_node.cljs$core$IFn$_invoke$arity$2 = (function (metadata,data){
return rewrite_clj.node.meta.raw_meta_node.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [metadata,rewrite_clj.node.whitespace.spaces((1)),data], null));
}));

(rewrite_clj.node.meta.raw_meta_node.cljs$lang$maxFixedArity = 2);


//# sourceMappingURL=rewrite_clj.node.meta.js.map
