goog.provide('rewrite_clj.node.whitespace');
/**
 * This function is applied to every newline string.
 */
rewrite_clj.node.whitespace._STAR_newline_fn_STAR_ = cljs.core.identity;
/**
 * This function is applied to every newline string and should produce
 * the eventual character count.
 */
rewrite_clj.node.whitespace._STAR_count_fn_STAR_ = cljs.core.count;
rewrite_clj.node.whitespace.sexpr_unsupported = (function rewrite_clj$node$whitespace$sexpr_unsupported(){
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2("unsupported operation",cljs.core.PersistentArrayMap.EMPTY);
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
 * @implements {rewrite_clj.node.protocols.Node}
 * @implements {cljs.core.IWithMeta}
 * @implements {cljs.core.IAssociative}
 * @implements {cljs.core.IMap}
 * @implements {cljs.core.ILookup}
*/
rewrite_clj.node.whitespace.WhitespaceNode = (function (whitespace,__meta,__extmap,__hash){
this.whitespace = whitespace;
this.__meta = __meta;
this.__extmap = __extmap;
this.__hash = __hash;
this.cljs$lang$protocol_mask$partition0$ = 2230716170;
this.cljs$lang$protocol_mask$partition1$ = 139264;
});
(rewrite_clj.node.whitespace.WhitespaceNode.prototype.toString = (function (){
var self__ = this;
var node = this;
return node.rewrite_clj$node$protocols$Node$string$arity$1(null);
}));

(rewrite_clj.node.whitespace.WhitespaceNode.prototype.cljs$core$ILookup$_lookup$arity$2 = (function (this__5300__auto__,k__5301__auto__){
var self__ = this;
var this__5300__auto____$1 = this;
return this__5300__auto____$1.cljs$core$ILookup$_lookup$arity$3(null,k__5301__auto__,null);
}));

(rewrite_clj.node.whitespace.WhitespaceNode.prototype.cljs$core$ILookup$_lookup$arity$3 = (function (this__5302__auto__,k65115,else__5303__auto__){
var self__ = this;
var this__5302__auto____$1 = this;
var G__65141 = k65115;
var G__65141__$1 = (((G__65141 instanceof cljs.core.Keyword))?G__65141.fqn:null);
switch (G__65141__$1) {
case "whitespace":
return self__.whitespace;

break;
default:
return cljs.core.get.cljs$core$IFn$_invoke$arity$3(self__.__extmap,k65115,else__5303__auto__);

}
}));

(rewrite_clj.node.whitespace.WhitespaceNode.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = (function (this__5320__auto__,f__5321__auto__,init__5322__auto__){
var self__ = this;
var this__5320__auto____$1 = this;
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (ret__5323__auto__,p__65169){
var vec__65170 = p__65169;
var k__5324__auto__ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__65170,(0),null);
var v__5325__auto__ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__65170,(1),null);
return (f__5321__auto__.cljs$core$IFn$_invoke$arity$3 ? f__5321__auto__.cljs$core$IFn$_invoke$arity$3(ret__5323__auto__,k__5324__auto__,v__5325__auto__) : f__5321__auto__.call(null,ret__5323__auto__,k__5324__auto__,v__5325__auto__));
}),init__5322__auto__,this__5320__auto____$1);
}));

(rewrite_clj.node.whitespace.WhitespaceNode.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = (function (this__5315__auto__,writer__5316__auto__,opts__5317__auto__){
var self__ = this;
var this__5315__auto____$1 = this;
var pr_pair__5318__auto__ = (function (keyval__5319__auto__){
return cljs.core.pr_sequential_writer(writer__5316__auto__,cljs.core.pr_writer,""," ","",opts__5317__auto__,keyval__5319__auto__);
});
return cljs.core.pr_sequential_writer(writer__5316__auto__,pr_pair__5318__auto__,"#rewrite-clj.node.whitespace.WhitespaceNode{",", ","}",opts__5317__auto__,cljs.core.concat.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [(new cljs.core.PersistentVector(null,2,(5),cljs.core.PersistentVector.EMPTY_NODE,[new cljs.core.Keyword(null,"whitespace","whitespace",-1340035483),self__.whitespace],null))], null),self__.__extmap));
}));

(rewrite_clj.node.whitespace.WhitespaceNode.prototype.cljs$core$IIterable$_iterator$arity$1 = (function (G__65114){
var self__ = this;
var G__65114__$1 = this;
return (new cljs.core.RecordIter((0),G__65114__$1,1,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"whitespace","whitespace",-1340035483)], null),(cljs.core.truth_(self__.__extmap)?cljs.core._iterator(self__.__extmap):cljs.core.nil_iter())));
}));

(rewrite_clj.node.whitespace.WhitespaceNode.prototype.cljs$core$IMeta$_meta$arity$1 = (function (this__5298__auto__){
var self__ = this;
var this__5298__auto____$1 = this;
return self__.__meta;
}));

(rewrite_clj.node.whitespace.WhitespaceNode.prototype.cljs$core$ICloneable$_clone$arity$1 = (function (this__5295__auto__){
var self__ = this;
var this__5295__auto____$1 = this;
return (new rewrite_clj.node.whitespace.WhitespaceNode(self__.whitespace,self__.__meta,self__.__extmap,self__.__hash));
}));

(rewrite_clj.node.whitespace.WhitespaceNode.prototype.cljs$core$ICounted$_count$arity$1 = (function (this__5304__auto__){
var self__ = this;
var this__5304__auto____$1 = this;
return (1 + cljs.core.count(self__.__extmap));
}));

(rewrite_clj.node.whitespace.WhitespaceNode.prototype.cljs$core$IHash$_hash$arity$1 = (function (this__5296__auto__){
var self__ = this;
var this__5296__auto____$1 = this;
var h__5111__auto__ = self__.__hash;
if((!((h__5111__auto__ == null)))){
return h__5111__auto__;
} else {
var h__5111__auto____$1 = (function (coll__5297__auto__){
return (1595850179 ^ cljs.core.hash_unordered_coll(coll__5297__auto__));
})(this__5296__auto____$1);
(self__.__hash = h__5111__auto____$1);

return h__5111__auto____$1;
}
}));

(rewrite_clj.node.whitespace.WhitespaceNode.prototype.cljs$core$IEquiv$_equiv$arity$2 = (function (this65116,other65117){
var self__ = this;
var this65116__$1 = this;
return (((!((other65117 == null)))) && ((((this65116__$1.constructor === other65117.constructor)) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(this65116__$1.whitespace,other65117.whitespace)) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(this65116__$1.__extmap,other65117.__extmap)))))));
}));

(rewrite_clj.node.whitespace.WhitespaceNode.prototype.rewrite_clj$node$protocols$Node$ = cljs.core.PROTOCOL_SENTINEL);

(rewrite_clj.node.whitespace.WhitespaceNode.prototype.rewrite_clj$node$protocols$Node$tag$arity$1 = (function (_node){
var self__ = this;
var _node__$1 = this;
return new cljs.core.Keyword(null,"whitespace","whitespace",-1340035483);
}));

(rewrite_clj.node.whitespace.WhitespaceNode.prototype.rewrite_clj$node$protocols$Node$node_type$arity$1 = (function (_node){
var self__ = this;
var _node__$1 = this;
return new cljs.core.Keyword(null,"whitespace","whitespace",-1340035483);
}));

(rewrite_clj.node.whitespace.WhitespaceNode.prototype.rewrite_clj$node$protocols$Node$printable_only_QMARK_$arity$1 = (function (_node){
var self__ = this;
var _node__$1 = this;
return true;
}));

(rewrite_clj.node.whitespace.WhitespaceNode.prototype.rewrite_clj$node$protocols$Node$sexpr_STAR_$arity$2 = (function (_node,_opts){
var self__ = this;
var _node__$1 = this;
return rewrite_clj.node.whitespace.sexpr_unsupported();
}));

(rewrite_clj.node.whitespace.WhitespaceNode.prototype.rewrite_clj$node$protocols$Node$length$arity$1 = (function (_node){
var self__ = this;
var _node__$1 = this;
return cljs.core.count(self__.whitespace);
}));

(rewrite_clj.node.whitespace.WhitespaceNode.prototype.rewrite_clj$node$protocols$Node$string$arity$1 = (function (_node){
var self__ = this;
var _node__$1 = this;
return self__.whitespace;
}));

(rewrite_clj.node.whitespace.WhitespaceNode.prototype.cljs$core$IMap$_dissoc$arity$2 = (function (this__5310__auto__,k__5311__auto__){
var self__ = this;
var this__5310__auto____$1 = this;
if(cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"whitespace","whitespace",-1340035483),null], null), null),k__5311__auto__)){
return cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(cljs.core._with_meta(cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,this__5310__auto____$1),self__.__meta),k__5311__auto__);
} else {
return (new rewrite_clj.node.whitespace.WhitespaceNode(self__.whitespace,self__.__meta,cljs.core.not_empty(cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(self__.__extmap,k__5311__auto__)),null));
}
}));

(rewrite_clj.node.whitespace.WhitespaceNode.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = (function (this__5307__auto__,k65115){
var self__ = this;
var this__5307__auto____$1 = this;
var G__65236 = k65115;
var G__65236__$1 = (((G__65236 instanceof cljs.core.Keyword))?G__65236.fqn:null);
switch (G__65236__$1) {
case "whitespace":
return true;

break;
default:
return cljs.core.contains_QMARK_(self__.__extmap,k65115);

}
}));

(rewrite_clj.node.whitespace.WhitespaceNode.prototype.cljs$core$IAssociative$_assoc$arity$3 = (function (this__5308__auto__,k__5309__auto__,G__65114){
var self__ = this;
var this__5308__auto____$1 = this;
var pred__65244 = cljs.core.keyword_identical_QMARK_;
var expr__65245 = k__5309__auto__;
if(cljs.core.truth_((pred__65244.cljs$core$IFn$_invoke$arity$2 ? pred__65244.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"whitespace","whitespace",-1340035483),expr__65245) : pred__65244.call(null,new cljs.core.Keyword(null,"whitespace","whitespace",-1340035483),expr__65245)))){
return (new rewrite_clj.node.whitespace.WhitespaceNode(G__65114,self__.__meta,self__.__extmap,null));
} else {
return (new rewrite_clj.node.whitespace.WhitespaceNode(self__.whitespace,self__.__meta,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(self__.__extmap,k__5309__auto__,G__65114),null));
}
}));

(rewrite_clj.node.whitespace.WhitespaceNode.prototype.cljs$core$ISeqable$_seq$arity$1 = (function (this__5313__auto__){
var self__ = this;
var this__5313__auto____$1 = this;
return cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [(new cljs.core.MapEntry(new cljs.core.Keyword(null,"whitespace","whitespace",-1340035483),self__.whitespace,null))], null),self__.__extmap));
}));

(rewrite_clj.node.whitespace.WhitespaceNode.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = (function (this__5299__auto__,G__65114){
var self__ = this;
var this__5299__auto____$1 = this;
return (new rewrite_clj.node.whitespace.WhitespaceNode(self__.whitespace,G__65114,self__.__extmap,self__.__hash));
}));

(rewrite_clj.node.whitespace.WhitespaceNode.prototype.cljs$core$ICollection$_conj$arity$2 = (function (this__5305__auto__,entry__5306__auto__){
var self__ = this;
var this__5305__auto____$1 = this;
if(cljs.core.vector_QMARK_(entry__5306__auto__)){
return this__5305__auto____$1.cljs$core$IAssociative$_assoc$arity$3(null,cljs.core._nth(entry__5306__auto__,(0)),cljs.core._nth(entry__5306__auto__,(1)));
} else {
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3(cljs.core._conj,this__5305__auto____$1,entry__5306__auto__);
}
}));

(rewrite_clj.node.whitespace.WhitespaceNode.getBasis = (function (){
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"whitespace","whitespace",300496044,null)], null);
}));

(rewrite_clj.node.whitespace.WhitespaceNode.cljs$lang$type = true);

(rewrite_clj.node.whitespace.WhitespaceNode.cljs$lang$ctorPrSeq = (function (this__5346__auto__){
return (new cljs.core.List(null,"rewrite-clj.node.whitespace/WhitespaceNode",null,(1),null));
}));

(rewrite_clj.node.whitespace.WhitespaceNode.cljs$lang$ctorPrWriter = (function (this__5346__auto__,writer__5347__auto__){
return cljs.core._write(writer__5347__auto__,"rewrite-clj.node.whitespace/WhitespaceNode");
}));

/**
 * Positional factory function for rewrite-clj.node.whitespace/WhitespaceNode.
 */
rewrite_clj.node.whitespace.__GT_WhitespaceNode = (function rewrite_clj$node$whitespace$__GT_WhitespaceNode(whitespace){
return (new rewrite_clj.node.whitespace.WhitespaceNode(whitespace,null,null,null));
});

/**
 * Factory function for rewrite-clj.node.whitespace/WhitespaceNode, taking a map of keywords to field values.
 */
rewrite_clj.node.whitespace.map__GT_WhitespaceNode = (function rewrite_clj$node$whitespace$map__GT_WhitespaceNode(G__65119){
var extmap__5342__auto__ = (function (){var G__65278 = cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(G__65119,new cljs.core.Keyword(null,"whitespace","whitespace",-1340035483));
if(cljs.core.record_QMARK_(G__65119)){
return cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,G__65278);
} else {
return G__65278;
}
})();
return (new rewrite_clj.node.whitespace.WhitespaceNode(new cljs.core.Keyword(null,"whitespace","whitespace",-1340035483).cljs$core$IFn$_invoke$arity$1(G__65119),null,cljs.core.not_empty(extmap__5342__auto__),null));
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
 * @implements {rewrite_clj.node.protocols.Node}
 * @implements {cljs.core.IWithMeta}
 * @implements {cljs.core.IAssociative}
 * @implements {cljs.core.IMap}
 * @implements {cljs.core.ILookup}
*/
rewrite_clj.node.whitespace.CommaNode = (function (commas,__meta,__extmap,__hash){
this.commas = commas;
this.__meta = __meta;
this.__extmap = __extmap;
this.__hash = __hash;
this.cljs$lang$protocol_mask$partition0$ = 2230716170;
this.cljs$lang$protocol_mask$partition1$ = 139264;
});
(rewrite_clj.node.whitespace.CommaNode.prototype.toString = (function (){
var self__ = this;
var node = this;
return node.rewrite_clj$node$protocols$Node$string$arity$1(null);
}));

(rewrite_clj.node.whitespace.CommaNode.prototype.cljs$core$ILookup$_lookup$arity$2 = (function (this__5300__auto__,k__5301__auto__){
var self__ = this;
var this__5300__auto____$1 = this;
return this__5300__auto____$1.cljs$core$ILookup$_lookup$arity$3(null,k__5301__auto__,null);
}));

(rewrite_clj.node.whitespace.CommaNode.prototype.cljs$core$ILookup$_lookup$arity$3 = (function (this__5302__auto__,k65292,else__5303__auto__){
var self__ = this;
var this__5302__auto____$1 = this;
var G__65305 = k65292;
var G__65305__$1 = (((G__65305 instanceof cljs.core.Keyword))?G__65305.fqn:null);
switch (G__65305__$1) {
case "commas":
return self__.commas;

break;
default:
return cljs.core.get.cljs$core$IFn$_invoke$arity$3(self__.__extmap,k65292,else__5303__auto__);

}
}));

(rewrite_clj.node.whitespace.CommaNode.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = (function (this__5320__auto__,f__5321__auto__,init__5322__auto__){
var self__ = this;
var this__5320__auto____$1 = this;
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (ret__5323__auto__,p__65312){
var vec__65314 = p__65312;
var k__5324__auto__ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__65314,(0),null);
var v__5325__auto__ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__65314,(1),null);
return (f__5321__auto__.cljs$core$IFn$_invoke$arity$3 ? f__5321__auto__.cljs$core$IFn$_invoke$arity$3(ret__5323__auto__,k__5324__auto__,v__5325__auto__) : f__5321__auto__.call(null,ret__5323__auto__,k__5324__auto__,v__5325__auto__));
}),init__5322__auto__,this__5320__auto____$1);
}));

(rewrite_clj.node.whitespace.CommaNode.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = (function (this__5315__auto__,writer__5316__auto__,opts__5317__auto__){
var self__ = this;
var this__5315__auto____$1 = this;
var pr_pair__5318__auto__ = (function (keyval__5319__auto__){
return cljs.core.pr_sequential_writer(writer__5316__auto__,cljs.core.pr_writer,""," ","",opts__5317__auto__,keyval__5319__auto__);
});
return cljs.core.pr_sequential_writer(writer__5316__auto__,pr_pair__5318__auto__,"#rewrite-clj.node.whitespace.CommaNode{",", ","}",opts__5317__auto__,cljs.core.concat.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [(new cljs.core.PersistentVector(null,2,(5),cljs.core.PersistentVector.EMPTY_NODE,[new cljs.core.Keyword(null,"commas","commas",1094507436),self__.commas],null))], null),self__.__extmap));
}));

(rewrite_clj.node.whitespace.CommaNode.prototype.cljs$core$IIterable$_iterator$arity$1 = (function (G__65291){
var self__ = this;
var G__65291__$1 = this;
return (new cljs.core.RecordIter((0),G__65291__$1,1,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"commas","commas",1094507436)], null),(cljs.core.truth_(self__.__extmap)?cljs.core._iterator(self__.__extmap):cljs.core.nil_iter())));
}));

(rewrite_clj.node.whitespace.CommaNode.prototype.cljs$core$IMeta$_meta$arity$1 = (function (this__5298__auto__){
var self__ = this;
var this__5298__auto____$1 = this;
return self__.__meta;
}));

(rewrite_clj.node.whitespace.CommaNode.prototype.cljs$core$ICloneable$_clone$arity$1 = (function (this__5295__auto__){
var self__ = this;
var this__5295__auto____$1 = this;
return (new rewrite_clj.node.whitespace.CommaNode(self__.commas,self__.__meta,self__.__extmap,self__.__hash));
}));

(rewrite_clj.node.whitespace.CommaNode.prototype.cljs$core$ICounted$_count$arity$1 = (function (this__5304__auto__){
var self__ = this;
var this__5304__auto____$1 = this;
return (1 + cljs.core.count(self__.__extmap));
}));

(rewrite_clj.node.whitespace.CommaNode.prototype.cljs$core$IHash$_hash$arity$1 = (function (this__5296__auto__){
var self__ = this;
var this__5296__auto____$1 = this;
var h__5111__auto__ = self__.__hash;
if((!((h__5111__auto__ == null)))){
return h__5111__auto__;
} else {
var h__5111__auto____$1 = (function (coll__5297__auto__){
return (-551131754 ^ cljs.core.hash_unordered_coll(coll__5297__auto__));
})(this__5296__auto____$1);
(self__.__hash = h__5111__auto____$1);

return h__5111__auto____$1;
}
}));

(rewrite_clj.node.whitespace.CommaNode.prototype.cljs$core$IEquiv$_equiv$arity$2 = (function (this65293,other65294){
var self__ = this;
var this65293__$1 = this;
return (((!((other65294 == null)))) && ((((this65293__$1.constructor === other65294.constructor)) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(this65293__$1.commas,other65294.commas)) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(this65293__$1.__extmap,other65294.__extmap)))))));
}));

(rewrite_clj.node.whitespace.CommaNode.prototype.rewrite_clj$node$protocols$Node$ = cljs.core.PROTOCOL_SENTINEL);

(rewrite_clj.node.whitespace.CommaNode.prototype.rewrite_clj$node$protocols$Node$tag$arity$1 = (function (_node){
var self__ = this;
var _node__$1 = this;
return new cljs.core.Keyword(null,"comma","comma",1699024745);
}));

(rewrite_clj.node.whitespace.CommaNode.prototype.rewrite_clj$node$protocols$Node$node_type$arity$1 = (function (_node){
var self__ = this;
var _node__$1 = this;
return new cljs.core.Keyword(null,"comma","comma",1699024745);
}));

(rewrite_clj.node.whitespace.CommaNode.prototype.rewrite_clj$node$protocols$Node$printable_only_QMARK_$arity$1 = (function (_node){
var self__ = this;
var _node__$1 = this;
return true;
}));

(rewrite_clj.node.whitespace.CommaNode.prototype.rewrite_clj$node$protocols$Node$sexpr_STAR_$arity$2 = (function (_node,_opts){
var self__ = this;
var _node__$1 = this;
return rewrite_clj.node.whitespace.sexpr_unsupported();
}));

(rewrite_clj.node.whitespace.CommaNode.prototype.rewrite_clj$node$protocols$Node$length$arity$1 = (function (_node){
var self__ = this;
var _node__$1 = this;
return cljs.core.count(self__.commas);
}));

(rewrite_clj.node.whitespace.CommaNode.prototype.rewrite_clj$node$protocols$Node$string$arity$1 = (function (_node){
var self__ = this;
var _node__$1 = this;
return self__.commas;
}));

(rewrite_clj.node.whitespace.CommaNode.prototype.cljs$core$IMap$_dissoc$arity$2 = (function (this__5310__auto__,k__5311__auto__){
var self__ = this;
var this__5310__auto____$1 = this;
if(cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"commas","commas",1094507436),null], null), null),k__5311__auto__)){
return cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(cljs.core._with_meta(cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,this__5310__auto____$1),self__.__meta),k__5311__auto__);
} else {
return (new rewrite_clj.node.whitespace.CommaNode(self__.commas,self__.__meta,cljs.core.not_empty(cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(self__.__extmap,k__5311__auto__)),null));
}
}));

(rewrite_clj.node.whitespace.CommaNode.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = (function (this__5307__auto__,k65292){
var self__ = this;
var this__5307__auto____$1 = this;
var G__65369 = k65292;
var G__65369__$1 = (((G__65369 instanceof cljs.core.Keyword))?G__65369.fqn:null);
switch (G__65369__$1) {
case "commas":
return true;

break;
default:
return cljs.core.contains_QMARK_(self__.__extmap,k65292);

}
}));

(rewrite_clj.node.whitespace.CommaNode.prototype.cljs$core$IAssociative$_assoc$arity$3 = (function (this__5308__auto__,k__5309__auto__,G__65291){
var self__ = this;
var this__5308__auto____$1 = this;
var pred__65378 = cljs.core.keyword_identical_QMARK_;
var expr__65379 = k__5309__auto__;
if(cljs.core.truth_((pred__65378.cljs$core$IFn$_invoke$arity$2 ? pred__65378.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"commas","commas",1094507436),expr__65379) : pred__65378.call(null,new cljs.core.Keyword(null,"commas","commas",1094507436),expr__65379)))){
return (new rewrite_clj.node.whitespace.CommaNode(G__65291,self__.__meta,self__.__extmap,null));
} else {
return (new rewrite_clj.node.whitespace.CommaNode(self__.commas,self__.__meta,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(self__.__extmap,k__5309__auto__,G__65291),null));
}
}));

(rewrite_clj.node.whitespace.CommaNode.prototype.cljs$core$ISeqable$_seq$arity$1 = (function (this__5313__auto__){
var self__ = this;
var this__5313__auto____$1 = this;
return cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [(new cljs.core.MapEntry(new cljs.core.Keyword(null,"commas","commas",1094507436),self__.commas,null))], null),self__.__extmap));
}));

(rewrite_clj.node.whitespace.CommaNode.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = (function (this__5299__auto__,G__65291){
var self__ = this;
var this__5299__auto____$1 = this;
return (new rewrite_clj.node.whitespace.CommaNode(self__.commas,G__65291,self__.__extmap,self__.__hash));
}));

(rewrite_clj.node.whitespace.CommaNode.prototype.cljs$core$ICollection$_conj$arity$2 = (function (this__5305__auto__,entry__5306__auto__){
var self__ = this;
var this__5305__auto____$1 = this;
if(cljs.core.vector_QMARK_(entry__5306__auto__)){
return this__5305__auto____$1.cljs$core$IAssociative$_assoc$arity$3(null,cljs.core._nth(entry__5306__auto__,(0)),cljs.core._nth(entry__5306__auto__,(1)));
} else {
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3(cljs.core._conj,this__5305__auto____$1,entry__5306__auto__);
}
}));

(rewrite_clj.node.whitespace.CommaNode.getBasis = (function (){
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"commas","commas",-1559928333,null)], null);
}));

(rewrite_clj.node.whitespace.CommaNode.cljs$lang$type = true);

(rewrite_clj.node.whitespace.CommaNode.cljs$lang$ctorPrSeq = (function (this__5346__auto__){
return (new cljs.core.List(null,"rewrite-clj.node.whitespace/CommaNode",null,(1),null));
}));

(rewrite_clj.node.whitespace.CommaNode.cljs$lang$ctorPrWriter = (function (this__5346__auto__,writer__5347__auto__){
return cljs.core._write(writer__5347__auto__,"rewrite-clj.node.whitespace/CommaNode");
}));

/**
 * Positional factory function for rewrite-clj.node.whitespace/CommaNode.
 */
rewrite_clj.node.whitespace.__GT_CommaNode = (function rewrite_clj$node$whitespace$__GT_CommaNode(commas){
return (new rewrite_clj.node.whitespace.CommaNode(commas,null,null,null));
});

/**
 * Factory function for rewrite-clj.node.whitespace/CommaNode, taking a map of keywords to field values.
 */
rewrite_clj.node.whitespace.map__GT_CommaNode = (function rewrite_clj$node$whitespace$map__GT_CommaNode(G__65303){
var extmap__5342__auto__ = (function (){var G__65409 = cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(G__65303,new cljs.core.Keyword(null,"commas","commas",1094507436));
if(cljs.core.record_QMARK_(G__65303)){
return cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,G__65409);
} else {
return G__65409;
}
})();
return (new rewrite_clj.node.whitespace.CommaNode(new cljs.core.Keyword(null,"commas","commas",1094507436).cljs$core$IFn$_invoke$arity$1(G__65303),null,cljs.core.not_empty(extmap__5342__auto__),null));
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
 * @implements {rewrite_clj.node.protocols.Node}
 * @implements {cljs.core.IWithMeta}
 * @implements {cljs.core.IAssociative}
 * @implements {cljs.core.IMap}
 * @implements {cljs.core.ILookup}
*/
rewrite_clj.node.whitespace.NewlineNode = (function (newlines,__meta,__extmap,__hash){
this.newlines = newlines;
this.__meta = __meta;
this.__extmap = __extmap;
this.__hash = __hash;
this.cljs$lang$protocol_mask$partition0$ = 2230716170;
this.cljs$lang$protocol_mask$partition1$ = 139264;
});
(rewrite_clj.node.whitespace.NewlineNode.prototype.toString = (function (){
var self__ = this;
var node = this;
return node.rewrite_clj$node$protocols$Node$string$arity$1(null);
}));

(rewrite_clj.node.whitespace.NewlineNode.prototype.cljs$core$ILookup$_lookup$arity$2 = (function (this__5300__auto__,k__5301__auto__){
var self__ = this;
var this__5300__auto____$1 = this;
return this__5300__auto____$1.cljs$core$ILookup$_lookup$arity$3(null,k__5301__auto__,null);
}));

(rewrite_clj.node.whitespace.NewlineNode.prototype.cljs$core$ILookup$_lookup$arity$3 = (function (this__5302__auto__,k65411,else__5303__auto__){
var self__ = this;
var this__5302__auto____$1 = this;
var G__65429 = k65411;
var G__65429__$1 = (((G__65429 instanceof cljs.core.Keyword))?G__65429.fqn:null);
switch (G__65429__$1) {
case "newlines":
return self__.newlines;

break;
default:
return cljs.core.get.cljs$core$IFn$_invoke$arity$3(self__.__extmap,k65411,else__5303__auto__);

}
}));

(rewrite_clj.node.whitespace.NewlineNode.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = (function (this__5320__auto__,f__5321__auto__,init__5322__auto__){
var self__ = this;
var this__5320__auto____$1 = this;
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (ret__5323__auto__,p__65436){
var vec__65437 = p__65436;
var k__5324__auto__ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__65437,(0),null);
var v__5325__auto__ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__65437,(1),null);
return (f__5321__auto__.cljs$core$IFn$_invoke$arity$3 ? f__5321__auto__.cljs$core$IFn$_invoke$arity$3(ret__5323__auto__,k__5324__auto__,v__5325__auto__) : f__5321__auto__.call(null,ret__5323__auto__,k__5324__auto__,v__5325__auto__));
}),init__5322__auto__,this__5320__auto____$1);
}));

(rewrite_clj.node.whitespace.NewlineNode.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = (function (this__5315__auto__,writer__5316__auto__,opts__5317__auto__){
var self__ = this;
var this__5315__auto____$1 = this;
var pr_pair__5318__auto__ = (function (keyval__5319__auto__){
return cljs.core.pr_sequential_writer(writer__5316__auto__,cljs.core.pr_writer,""," ","",opts__5317__auto__,keyval__5319__auto__);
});
return cljs.core.pr_sequential_writer(writer__5316__auto__,pr_pair__5318__auto__,"#rewrite-clj.node.whitespace.NewlineNode{",", ","}",opts__5317__auto__,cljs.core.concat.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [(new cljs.core.PersistentVector(null,2,(5),cljs.core.PersistentVector.EMPTY_NODE,[new cljs.core.Keyword(null,"newlines","newlines",-1185451518),self__.newlines],null))], null),self__.__extmap));
}));

(rewrite_clj.node.whitespace.NewlineNode.prototype.cljs$core$IIterable$_iterator$arity$1 = (function (G__65410){
var self__ = this;
var G__65410__$1 = this;
return (new cljs.core.RecordIter((0),G__65410__$1,1,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"newlines","newlines",-1185451518)], null),(cljs.core.truth_(self__.__extmap)?cljs.core._iterator(self__.__extmap):cljs.core.nil_iter())));
}));

(rewrite_clj.node.whitespace.NewlineNode.prototype.cljs$core$IMeta$_meta$arity$1 = (function (this__5298__auto__){
var self__ = this;
var this__5298__auto____$1 = this;
return self__.__meta;
}));

(rewrite_clj.node.whitespace.NewlineNode.prototype.cljs$core$ICloneable$_clone$arity$1 = (function (this__5295__auto__){
var self__ = this;
var this__5295__auto____$1 = this;
return (new rewrite_clj.node.whitespace.NewlineNode(self__.newlines,self__.__meta,self__.__extmap,self__.__hash));
}));

(rewrite_clj.node.whitespace.NewlineNode.prototype.cljs$core$ICounted$_count$arity$1 = (function (this__5304__auto__){
var self__ = this;
var this__5304__auto____$1 = this;
return (1 + cljs.core.count(self__.__extmap));
}));

(rewrite_clj.node.whitespace.NewlineNode.prototype.cljs$core$IHash$_hash$arity$1 = (function (this__5296__auto__){
var self__ = this;
var this__5296__auto____$1 = this;
var h__5111__auto__ = self__.__hash;
if((!((h__5111__auto__ == null)))){
return h__5111__auto__;
} else {
var h__5111__auto____$1 = (function (coll__5297__auto__){
return (979711303 ^ cljs.core.hash_unordered_coll(coll__5297__auto__));
})(this__5296__auto____$1);
(self__.__hash = h__5111__auto____$1);

return h__5111__auto____$1;
}
}));

(rewrite_clj.node.whitespace.NewlineNode.prototype.cljs$core$IEquiv$_equiv$arity$2 = (function (this65412,other65413){
var self__ = this;
var this65412__$1 = this;
return (((!((other65413 == null)))) && ((((this65412__$1.constructor === other65413.constructor)) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(this65412__$1.newlines,other65413.newlines)) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(this65412__$1.__extmap,other65413.__extmap)))))));
}));

(rewrite_clj.node.whitespace.NewlineNode.prototype.rewrite_clj$node$protocols$Node$ = cljs.core.PROTOCOL_SENTINEL);

(rewrite_clj.node.whitespace.NewlineNode.prototype.rewrite_clj$node$protocols$Node$tag$arity$1 = (function (_node){
var self__ = this;
var _node__$1 = this;
return new cljs.core.Keyword(null,"newline","newline",1790071323);
}));

(rewrite_clj.node.whitespace.NewlineNode.prototype.rewrite_clj$node$protocols$Node$node_type$arity$1 = (function (_node){
var self__ = this;
var _node__$1 = this;
return new cljs.core.Keyword(null,"newline","newline",1790071323);
}));

(rewrite_clj.node.whitespace.NewlineNode.prototype.rewrite_clj$node$protocols$Node$printable_only_QMARK_$arity$1 = (function (_node){
var self__ = this;
var _node__$1 = this;
return true;
}));

(rewrite_clj.node.whitespace.NewlineNode.prototype.rewrite_clj$node$protocols$Node$sexpr_STAR_$arity$2 = (function (_node,_opts){
var self__ = this;
var _node__$1 = this;
return rewrite_clj.node.whitespace.sexpr_unsupported();
}));

(rewrite_clj.node.whitespace.NewlineNode.prototype.rewrite_clj$node$protocols$Node$length$arity$1 = (function (_node){
var self__ = this;
var _node__$1 = this;
return rewrite_clj.node.whitespace._STAR_count_fn_STAR_.call(null,self__.newlines);
}));

(rewrite_clj.node.whitespace.NewlineNode.prototype.rewrite_clj$node$protocols$Node$string$arity$1 = (function (_node){
var self__ = this;
var _node__$1 = this;
return rewrite_clj.node.whitespace._STAR_newline_fn_STAR_.call(null,self__.newlines);
}));

(rewrite_clj.node.whitespace.NewlineNode.prototype.cljs$core$IMap$_dissoc$arity$2 = (function (this__5310__auto__,k__5311__auto__){
var self__ = this;
var this__5310__auto____$1 = this;
if(cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"newlines","newlines",-1185451518),null], null), null),k__5311__auto__)){
return cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(cljs.core._with_meta(cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,this__5310__auto____$1),self__.__meta),k__5311__auto__);
} else {
return (new rewrite_clj.node.whitespace.NewlineNode(self__.newlines,self__.__meta,cljs.core.not_empty(cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(self__.__extmap,k__5311__auto__)),null));
}
}));

(rewrite_clj.node.whitespace.NewlineNode.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = (function (this__5307__auto__,k65411){
var self__ = this;
var this__5307__auto____$1 = this;
var G__65475 = k65411;
var G__65475__$1 = (((G__65475 instanceof cljs.core.Keyword))?G__65475.fqn:null);
switch (G__65475__$1) {
case "newlines":
return true;

break;
default:
return cljs.core.contains_QMARK_(self__.__extmap,k65411);

}
}));

(rewrite_clj.node.whitespace.NewlineNode.prototype.cljs$core$IAssociative$_assoc$arity$3 = (function (this__5308__auto__,k__5309__auto__,G__65410){
var self__ = this;
var this__5308__auto____$1 = this;
var pred__65481 = cljs.core.keyword_identical_QMARK_;
var expr__65482 = k__5309__auto__;
if(cljs.core.truth_((pred__65481.cljs$core$IFn$_invoke$arity$2 ? pred__65481.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"newlines","newlines",-1185451518),expr__65482) : pred__65481.call(null,new cljs.core.Keyword(null,"newlines","newlines",-1185451518),expr__65482)))){
return (new rewrite_clj.node.whitespace.NewlineNode(G__65410,self__.__meta,self__.__extmap,null));
} else {
return (new rewrite_clj.node.whitespace.NewlineNode(self__.newlines,self__.__meta,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(self__.__extmap,k__5309__auto__,G__65410),null));
}
}));

(rewrite_clj.node.whitespace.NewlineNode.prototype.cljs$core$ISeqable$_seq$arity$1 = (function (this__5313__auto__){
var self__ = this;
var this__5313__auto____$1 = this;
return cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [(new cljs.core.MapEntry(new cljs.core.Keyword(null,"newlines","newlines",-1185451518),self__.newlines,null))], null),self__.__extmap));
}));

(rewrite_clj.node.whitespace.NewlineNode.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = (function (this__5299__auto__,G__65410){
var self__ = this;
var this__5299__auto____$1 = this;
return (new rewrite_clj.node.whitespace.NewlineNode(self__.newlines,G__65410,self__.__extmap,self__.__hash));
}));

(rewrite_clj.node.whitespace.NewlineNode.prototype.cljs$core$ICollection$_conj$arity$2 = (function (this__5305__auto__,entry__5306__auto__){
var self__ = this;
var this__5305__auto____$1 = this;
if(cljs.core.vector_QMARK_(entry__5306__auto__)){
return this__5305__auto____$1.cljs$core$IAssociative$_assoc$arity$3(null,cljs.core._nth(entry__5306__auto__,(0)),cljs.core._nth(entry__5306__auto__,(1)));
} else {
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3(cljs.core._conj,this__5305__auto____$1,entry__5306__auto__);
}
}));

(rewrite_clj.node.whitespace.NewlineNode.getBasis = (function (){
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"newlines","newlines",455080009,null)], null);
}));

(rewrite_clj.node.whitespace.NewlineNode.cljs$lang$type = true);

(rewrite_clj.node.whitespace.NewlineNode.cljs$lang$ctorPrSeq = (function (this__5346__auto__){
return (new cljs.core.List(null,"rewrite-clj.node.whitespace/NewlineNode",null,(1),null));
}));

(rewrite_clj.node.whitespace.NewlineNode.cljs$lang$ctorPrWriter = (function (this__5346__auto__,writer__5347__auto__){
return cljs.core._write(writer__5347__auto__,"rewrite-clj.node.whitespace/NewlineNode");
}));

/**
 * Positional factory function for rewrite-clj.node.whitespace/NewlineNode.
 */
rewrite_clj.node.whitespace.__GT_NewlineNode = (function rewrite_clj$node$whitespace$__GT_NewlineNode(newlines){
return (new rewrite_clj.node.whitespace.NewlineNode(newlines,null,null,null));
});

/**
 * Factory function for rewrite-clj.node.whitespace/NewlineNode, taking a map of keywords to field values.
 */
rewrite_clj.node.whitespace.map__GT_NewlineNode = (function rewrite_clj$node$whitespace$map__GT_NewlineNode(G__65415){
var extmap__5342__auto__ = (function (){var G__65503 = cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(G__65415,new cljs.core.Keyword(null,"newlines","newlines",-1185451518));
if(cljs.core.record_QMARK_(G__65415)){
return cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,G__65503);
} else {
return G__65503;
}
})();
return (new rewrite_clj.node.whitespace.NewlineNode(new cljs.core.Keyword(null,"newlines","newlines",-1185451518).cljs$core$IFn$_invoke$arity$1(G__65415),null,cljs.core.not_empty(extmap__5342__auto__),null));
});

rewrite_clj.node.protocols.make_printable_BANG_(rewrite_clj.node.whitespace.WhitespaceNode);
rewrite_clj.node.protocols.make_printable_BANG_(rewrite_clj.node.whitespace.CommaNode);
rewrite_clj.node.protocols.make_printable_BANG_(rewrite_clj.node.whitespace.NewlineNode);
rewrite_clj.node.whitespace.string_of_QMARK_ = (function rewrite_clj$node$whitespace$string_of_QMARK_(s,pred){
var and__5000__auto__ = s;
if(cljs.core.truth_(and__5000__auto__)){
return ((typeof s === 'string') && ((((cljs.core.count(s) > (0))) && (cljs.core.every_QMARK_(pred,s)))));
} else {
return and__5000__auto__;
}
});
/**
 * Create whitespace node of string `s`, where `s` is one or more space characters.
 */
rewrite_clj.node.whitespace.whitespace_node = (function rewrite_clj$node$whitespace$whitespace_node(s){
if(cljs.core.truth_(rewrite_clj.node.whitespace.string_of_QMARK_(s,rewrite_clj.reader.space_QMARK_))){
} else {
throw (new Error("Assert failed: (string-of? s r/space?)"));
}

return rewrite_clj.node.whitespace.__GT_WhitespaceNode(s);
});
/**
 * Create comma node of string `s`, where `s` is one or more comma characters.
 */
rewrite_clj.node.whitespace.comma_node = (function rewrite_clj$node$whitespace$comma_node(s){
if(cljs.core.truth_(rewrite_clj.node.whitespace.string_of_QMARK_(s,rewrite_clj.reader.comma_QMARK_))){
} else {
throw (new Error("Assert failed: (string-of? s r/comma?)"));
}

return rewrite_clj.node.whitespace.__GT_CommaNode(s);
});
/**
 * Create newline node of string `s`, where `s` is one or more linebreak characters.
 */
rewrite_clj.node.whitespace.newline_node = (function rewrite_clj$node$whitespace$newline_node(s){
if(cljs.core.truth_(rewrite_clj.node.whitespace.string_of_QMARK_(s,rewrite_clj.reader.linebreak_QMARK_))){
} else {
throw (new Error("Assert failed: (string-of? s r/linebreak?)"));
}

return rewrite_clj.node.whitespace.__GT_NewlineNode(s);
});
rewrite_clj.node.whitespace.classify_whitespace = (function rewrite_clj$node$whitespace$classify_whitespace(c){
if(rewrite_clj.reader.comma_QMARK_(c)){
return new cljs.core.Keyword(null,"comma","comma",1699024745);
} else {
if(rewrite_clj.reader.linebreak_QMARK_(c)){
return new cljs.core.Keyword(null,"newline","newline",1790071323);
} else {
return new cljs.core.Keyword(null,"whitespace","whitespace",-1340035483);

}
}
});
/**
 * Convert string `s` of whitespace to whitespace/newline nodes.
 */
rewrite_clj.node.whitespace.whitespace_nodes = (function rewrite_clj$node$whitespace$whitespace_nodes(s){
if(cljs.core.truth_(rewrite_clj.node.whitespace.string_of_QMARK_(s,rewrite_clj.reader.whitespace_QMARK_))){
} else {
throw (new Error("Assert failed: (string-of? s r/whitespace?)"));
}

return cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (char_seq){
var s__$1 = cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core.str,char_seq);
var G__65549 = rewrite_clj.node.whitespace.classify_whitespace(cljs.core.first(char_seq));
var G__65549__$1 = (((G__65549 instanceof cljs.core.Keyword))?G__65549.fqn:null);
switch (G__65549__$1) {
case "comma":
return rewrite_clj.node.whitespace.comma_node(s__$1);

break;
case "newline":
return rewrite_clj.node.whitespace.newline_node(s__$1);

break;
default:
return rewrite_clj.node.whitespace.whitespace_node(s__$1);

}
}),cljs.core.partition_by.cljs$core$IFn$_invoke$arity$2(rewrite_clj.node.whitespace.classify_whitespace,s));
});
/**
 * Create node representing `n` spaces.
 */
rewrite_clj.node.whitespace.spaces = (function rewrite_clj$node$whitespace$spaces(n){
return rewrite_clj.node.whitespace.whitespace_node(cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core.str,cljs.core.repeat.cljs$core$IFn$_invoke$arity$2(n," ")));
});
/**
 * Create node representing `n` newline characters.
 */
rewrite_clj.node.whitespace.newlines = (function rewrite_clj$node$whitespace$newlines(n){
return rewrite_clj.node.whitespace.newline_node(cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core.str,cljs.core.repeat.cljs$core$IFn$_invoke$arity$2(n,"\n")));
});
var comma_65708 = rewrite_clj.node.whitespace.whitespace_nodes(", ");
/**
 * Interleave `nodes` with `", "` nodes.
 */
rewrite_clj.node.whitespace.comma_separated = (function rewrite_clj$node$whitespace$comma_separated(nodes){
return cljs.core.drop_last.cljs$core$IFn$_invoke$arity$2(cljs.core.count(comma_65708),cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (p1__65554_SHARP_){
return cljs.core.cons(p1__65554_SHARP_,comma_65708);
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([nodes], 0)));
});
var nl_65709 = rewrite_clj.node.whitespace.newline_node("\n");
/**
 * Interleave `nodes` with newline nodes.
 */
rewrite_clj.node.whitespace.line_separated = (function rewrite_clj$node$whitespace$line_separated(nodes){
return cljs.core.butlast(cljs.core.interleave.cljs$core$IFn$_invoke$arity$2(nodes,cljs.core.repeat.cljs$core$IFn$_invoke$arity$1(nl_65709)));
});
var space_65710 = rewrite_clj.node.whitespace.whitespace_node(" ");
/**
 * Interleave `nodes` with `" "` nodes.
 */
rewrite_clj.node.whitespace.space_separated = (function rewrite_clj$node$whitespace$space_separated(nodes){
return cljs.core.butlast(cljs.core.interleave.cljs$core$IFn$_invoke$arity$2(nodes,cljs.core.repeat.cljs$core$IFn$_invoke$arity$1(space_65710)));
});
/**
 * Returns true if `node` represents Clojure whitespace.
 */
rewrite_clj.node.whitespace.whitespace_QMARK_ = (function rewrite_clj$node$whitespace$whitespace_QMARK_(node){
return cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"whitespace","whitespace",-1340035483),null,new cljs.core.Keyword(null,"comma","comma",1699024745),null,new cljs.core.Keyword(null,"newline","newline",1790071323),null], null), null),rewrite_clj.node.protocols.tag(node));
});
/**
 * Returns true if `node` represents one or more linebreaks.
 */
rewrite_clj.node.whitespace.linebreak_QMARK_ = (function rewrite_clj$node$whitespace$linebreak_QMARK_(node){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(rewrite_clj.node.protocols.tag(node),new cljs.core.Keyword(null,"newline","newline",1790071323));
});
/**
 * Returns true if `node` represents one or more commas.
 */
rewrite_clj.node.whitespace.comma_QMARK_ = (function rewrite_clj$node$whitespace$comma_QMARK_(node){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(rewrite_clj.node.protocols.tag(node),new cljs.core.Keyword(null,"comma","comma",1699024745));
});

//# sourceMappingURL=rewrite_clj.node.whitespace.js.map
