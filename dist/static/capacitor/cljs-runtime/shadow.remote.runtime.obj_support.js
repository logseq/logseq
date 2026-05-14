goog.provide('shadow.remote.runtime.obj_support');

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
shadow.remote.runtime.obj_support.Reference = (function (obj,extra,__meta,__extmap,__hash){
this.obj = obj;
this.extra = extra;
this.__meta = __meta;
this.__extmap = __extmap;
this.__hash = __hash;
this.cljs$lang$protocol_mask$partition0$ = 2230716170;
this.cljs$lang$protocol_mask$partition1$ = 139264;
});
(shadow.remote.runtime.obj_support.Reference.prototype.cljs$core$ILookup$_lookup$arity$2 = (function (this__5300__auto__,k__5301__auto__){
var self__ = this;
var this__5300__auto____$1 = this;
return this__5300__auto____$1.cljs$core$ILookup$_lookup$arity$3(null,k__5301__auto__,null);
}));

(shadow.remote.runtime.obj_support.Reference.prototype.cljs$core$ILookup$_lookup$arity$3 = (function (this__5302__auto__,k42299,else__5303__auto__){
var self__ = this;
var this__5302__auto____$1 = this;
var G__42307 = k42299;
var G__42307__$1 = (((G__42307 instanceof cljs.core.Keyword))?G__42307.fqn:null);
switch (G__42307__$1) {
case "obj":
return self__.obj;

break;
case "extra":
return self__.extra;

break;
default:
return cljs.core.get.cljs$core$IFn$_invoke$arity$3(self__.__extmap,k42299,else__5303__auto__);

}
}));

(shadow.remote.runtime.obj_support.Reference.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = (function (this__5320__auto__,f__5321__auto__,init__5322__auto__){
var self__ = this;
var this__5320__auto____$1 = this;
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (ret__5323__auto__,p__42310){
var vec__42311 = p__42310;
var k__5324__auto__ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__42311,(0),null);
var v__5325__auto__ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__42311,(1),null);
return (f__5321__auto__.cljs$core$IFn$_invoke$arity$3 ? f__5321__auto__.cljs$core$IFn$_invoke$arity$3(ret__5323__auto__,k__5324__auto__,v__5325__auto__) : f__5321__auto__.call(null,ret__5323__auto__,k__5324__auto__,v__5325__auto__));
}),init__5322__auto__,this__5320__auto____$1);
}));

(shadow.remote.runtime.obj_support.Reference.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = (function (this__5315__auto__,writer__5316__auto__,opts__5317__auto__){
var self__ = this;
var this__5315__auto____$1 = this;
var pr_pair__5318__auto__ = (function (keyval__5319__auto__){
return cljs.core.pr_sequential_writer(writer__5316__auto__,cljs.core.pr_writer,""," ","",opts__5317__auto__,keyval__5319__auto__);
});
return cljs.core.pr_sequential_writer(writer__5316__auto__,pr_pair__5318__auto__,"#shadow.remote.runtime.obj-support.Reference{",", ","}",opts__5317__auto__,cljs.core.concat.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [(new cljs.core.PersistentVector(null,2,(5),cljs.core.PersistentVector.EMPTY_NODE,[new cljs.core.Keyword(null,"obj","obj",981763962),self__.obj],null)),(new cljs.core.PersistentVector(null,2,(5),cljs.core.PersistentVector.EMPTY_NODE,[new cljs.core.Keyword(null,"extra","extra",1612569067),self__.extra],null))], null),self__.__extmap));
}));

(shadow.remote.runtime.obj_support.Reference.prototype.cljs$core$IIterable$_iterator$arity$1 = (function (G__42298){
var self__ = this;
var G__42298__$1 = this;
return (new cljs.core.RecordIter((0),G__42298__$1,2,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"obj","obj",981763962),new cljs.core.Keyword(null,"extra","extra",1612569067)], null),(cljs.core.truth_(self__.__extmap)?cljs.core._iterator(self__.__extmap):cljs.core.nil_iter())));
}));

(shadow.remote.runtime.obj_support.Reference.prototype.cljs$core$IMeta$_meta$arity$1 = (function (this__5298__auto__){
var self__ = this;
var this__5298__auto____$1 = this;
return self__.__meta;
}));

(shadow.remote.runtime.obj_support.Reference.prototype.cljs$core$ICloneable$_clone$arity$1 = (function (this__5295__auto__){
var self__ = this;
var this__5295__auto____$1 = this;
return (new shadow.remote.runtime.obj_support.Reference(self__.obj,self__.extra,self__.__meta,self__.__extmap,self__.__hash));
}));

(shadow.remote.runtime.obj_support.Reference.prototype.cljs$core$ICounted$_count$arity$1 = (function (this__5304__auto__){
var self__ = this;
var this__5304__auto____$1 = this;
return (2 + cljs.core.count(self__.__extmap));
}));

(shadow.remote.runtime.obj_support.Reference.prototype.cljs$core$IHash$_hash$arity$1 = (function (this__5296__auto__){
var self__ = this;
var this__5296__auto____$1 = this;
var h__5111__auto__ = self__.__hash;
if((!((h__5111__auto__ == null)))){
return h__5111__auto__;
} else {
var h__5111__auto____$1 = (function (coll__5297__auto__){
return (1775716890 ^ cljs.core.hash_unordered_coll(coll__5297__auto__));
})(this__5296__auto____$1);
(self__.__hash = h__5111__auto____$1);

return h__5111__auto____$1;
}
}));

(shadow.remote.runtime.obj_support.Reference.prototype.cljs$core$IEquiv$_equiv$arity$2 = (function (this42300,other42301){
var self__ = this;
var this42300__$1 = this;
return (((!((other42301 == null)))) && ((((this42300__$1.constructor === other42301.constructor)) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(this42300__$1.obj,other42301.obj)) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(this42300__$1.extra,other42301.extra)) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(this42300__$1.__extmap,other42301.__extmap)))))))));
}));

(shadow.remote.runtime.obj_support.Reference.prototype.cljs$core$IMap$_dissoc$arity$2 = (function (this__5310__auto__,k__5311__auto__){
var self__ = this;
var this__5310__auto____$1 = this;
if(cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"extra","extra",1612569067),null,new cljs.core.Keyword(null,"obj","obj",981763962),null], null), null),k__5311__auto__)){
return cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(cljs.core._with_meta(cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,this__5310__auto____$1),self__.__meta),k__5311__auto__);
} else {
return (new shadow.remote.runtime.obj_support.Reference(self__.obj,self__.extra,self__.__meta,cljs.core.not_empty(cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(self__.__extmap,k__5311__auto__)),null));
}
}));

(shadow.remote.runtime.obj_support.Reference.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = (function (this__5307__auto__,k42299){
var self__ = this;
var this__5307__auto____$1 = this;
var G__42360 = k42299;
var G__42360__$1 = (((G__42360 instanceof cljs.core.Keyword))?G__42360.fqn:null);
switch (G__42360__$1) {
case "obj":
case "extra":
return true;

break;
default:
return cljs.core.contains_QMARK_(self__.__extmap,k42299);

}
}));

(shadow.remote.runtime.obj_support.Reference.prototype.cljs$core$IAssociative$_assoc$arity$3 = (function (this__5308__auto__,k__5309__auto__,G__42298){
var self__ = this;
var this__5308__auto____$1 = this;
var pred__42363 = cljs.core.keyword_identical_QMARK_;
var expr__42364 = k__5309__auto__;
if(cljs.core.truth_((pred__42363.cljs$core$IFn$_invoke$arity$2 ? pred__42363.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"obj","obj",981763962),expr__42364) : pred__42363.call(null,new cljs.core.Keyword(null,"obj","obj",981763962),expr__42364)))){
return (new shadow.remote.runtime.obj_support.Reference(G__42298,self__.extra,self__.__meta,self__.__extmap,null));
} else {
if(cljs.core.truth_((pred__42363.cljs$core$IFn$_invoke$arity$2 ? pred__42363.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"extra","extra",1612569067),expr__42364) : pred__42363.call(null,new cljs.core.Keyword(null,"extra","extra",1612569067),expr__42364)))){
return (new shadow.remote.runtime.obj_support.Reference(self__.obj,G__42298,self__.__meta,self__.__extmap,null));
} else {
return (new shadow.remote.runtime.obj_support.Reference(self__.obj,self__.extra,self__.__meta,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(self__.__extmap,k__5309__auto__,G__42298),null));
}
}
}));

(shadow.remote.runtime.obj_support.Reference.prototype.cljs$core$ISeqable$_seq$arity$1 = (function (this__5313__auto__){
var self__ = this;
var this__5313__auto____$1 = this;
return cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [(new cljs.core.MapEntry(new cljs.core.Keyword(null,"obj","obj",981763962),self__.obj,null)),(new cljs.core.MapEntry(new cljs.core.Keyword(null,"extra","extra",1612569067),self__.extra,null))], null),self__.__extmap));
}));

(shadow.remote.runtime.obj_support.Reference.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = (function (this__5299__auto__,G__42298){
var self__ = this;
var this__5299__auto____$1 = this;
return (new shadow.remote.runtime.obj_support.Reference(self__.obj,self__.extra,G__42298,self__.__extmap,self__.__hash));
}));

(shadow.remote.runtime.obj_support.Reference.prototype.cljs$core$ICollection$_conj$arity$2 = (function (this__5305__auto__,entry__5306__auto__){
var self__ = this;
var this__5305__auto____$1 = this;
if(cljs.core.vector_QMARK_(entry__5306__auto__)){
return this__5305__auto____$1.cljs$core$IAssociative$_assoc$arity$3(null,cljs.core._nth(entry__5306__auto__,(0)),cljs.core._nth(entry__5306__auto__,(1)));
} else {
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3(cljs.core._conj,this__5305__auto____$1,entry__5306__auto__);
}
}));

(shadow.remote.runtime.obj_support.Reference.getBasis = (function (){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"obj","obj",-1672671807,null),new cljs.core.Symbol(null,"extra","extra",-1041866702,null)], null);
}));

(shadow.remote.runtime.obj_support.Reference.cljs$lang$type = true);

(shadow.remote.runtime.obj_support.Reference.cljs$lang$ctorPrSeq = (function (this__5346__auto__){
return (new cljs.core.List(null,"shadow.remote.runtime.obj-support/Reference",null,(1),null));
}));

(shadow.remote.runtime.obj_support.Reference.cljs$lang$ctorPrWriter = (function (this__5346__auto__,writer__5347__auto__){
return cljs.core._write(writer__5347__auto__,"shadow.remote.runtime.obj-support/Reference");
}));

/**
 * Positional factory function for shadow.remote.runtime.obj-support/Reference.
 */
shadow.remote.runtime.obj_support.__GT_Reference = (function shadow$remote$runtime$obj_support$__GT_Reference(obj,extra){
return (new shadow.remote.runtime.obj_support.Reference(obj,extra,null,null,null));
});

/**
 * Factory function for shadow.remote.runtime.obj-support/Reference, taking a map of keywords to field values.
 */
shadow.remote.runtime.obj_support.map__GT_Reference = (function shadow$remote$runtime$obj_support$map__GT_Reference(G__42303){
var extmap__5342__auto__ = (function (){var G__42384 = cljs.core.dissoc.cljs$core$IFn$_invoke$arity$variadic(G__42303,new cljs.core.Keyword(null,"obj","obj",981763962),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"extra","extra",1612569067)], 0));
if(cljs.core.record_QMARK_(G__42303)){
return cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,G__42384);
} else {
return G__42384;
}
})();
return (new shadow.remote.runtime.obj_support.Reference(new cljs.core.Keyword(null,"obj","obj",981763962).cljs$core$IFn$_invoke$arity$1(G__42303),new cljs.core.Keyword(null,"extra","extra",1612569067).cljs$core$IFn$_invoke$arity$1(G__42303),null,cljs.core.not_empty(extmap__5342__auto__),null));
});

shadow.remote.runtime.obj_support.obj_ref = (function shadow$remote$runtime$obj_support$obj_ref(var_args){
var G__42396 = arguments.length;
switch (G__42396) {
case 1:
return shadow.remote.runtime.obj_support.obj_ref.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return shadow.remote.runtime.obj_support.obj_ref.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(shadow.remote.runtime.obj_support.obj_ref.cljs$core$IFn$_invoke$arity$1 = (function (obj){
return shadow.remote.runtime.obj_support.obj_ref.cljs$core$IFn$_invoke$arity$2(obj,null);
}));

(shadow.remote.runtime.obj_support.obj_ref.cljs$core$IFn$_invoke$arity$2 = (function (obj,extra){
if((!((obj == null)))){
return (new shadow.remote.runtime.obj_support.Reference(obj,extra,null,null,null));
} else {
return null;
}
}));

(shadow.remote.runtime.obj_support.obj_ref.cljs$lang$maxFixedArity = 2);

shadow.remote.runtime.obj_support.obj_ref_QMARK_ = (function shadow$remote$runtime$obj_support$obj_ref_QMARK_(result){
return (result instanceof shadow.remote.runtime.obj_support.Reference);
});
shadow.remote.runtime.obj_support.now = (function shadow$remote$runtime$obj_support$now(){
return Date.now();
});
shadow.remote.runtime.obj_support.next_oid = (function shadow$remote$runtime$obj_support$next_oid(){
return cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.random_uuid());
});
shadow.remote.runtime.obj_support.register_STAR_ = (function shadow$remote$runtime$obj_support$register_STAR_(state,oid,obj,obj_info){
var ts = shadow.remote.runtime.obj_support.now();
var entry = new cljs.core.PersistentArrayMap(null, 6, [new cljs.core.Keyword(null,"obj","obj",981763962),obj,new cljs.core.Keyword(null,"data","data",-232669377),clojure.datafy.datafy(obj),new cljs.core.Keyword(null,"obj-info","obj-info",-373842651),obj_info,new cljs.core.Keyword(null,"added-at","added-at",-352499434),ts,new cljs.core.Keyword(null,"access-at","access-at",-1487162729),ts,new cljs.core.Keyword(null,"oid","oid",-768692334),oid], null);
return cljs.core.assoc_in(state,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"objects","objects",2099713734),oid], null),entry);
});
shadow.remote.runtime.obj_support.obj_type_string = (function shadow$remote$runtime$obj_support$obj_type_string(obj){
if((obj == null)){
return "nil";
} else {
return cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.type(obj)], 0));
}
});
shadow.remote.runtime.obj_support.get_data_type = (function shadow$remote$runtime$obj_support$get_data_type(summary,p__42457){
var map__42459 = p__42457;
var map__42459__$1 = cljs.core.__destructure_map(map__42459);
var entry = map__42459__$1;
var data = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__42459__$1,new cljs.core.Keyword(null,"data","data",-232669377));
try{if((data == null)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(summary,new cljs.core.Keyword(null,"data-type","data-type",-326421468),new cljs.core.Keyword(null,"nil","nil",99600501));
} else {
if(typeof data === 'string'){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(summary,new cljs.core.Keyword(null,"data-type","data-type",-326421468),new cljs.core.Keyword(null,"string","string",-1989541586),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"data-count","data-count",1898198662),((data).length)], 0));
} else {
if(cljs.core.boolean_QMARK_(data)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(summary,new cljs.core.Keyword(null,"data-type","data-type",-326421468),new cljs.core.Keyword(null,"boolean","boolean",-1919418404));
} else {
if(typeof data === 'number'){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(summary,new cljs.core.Keyword(null,"data-type","data-type",-326421468),new cljs.core.Keyword(null,"number","number",1570378438));
} else {
if((data instanceof cljs.core.Keyword)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(summary,new cljs.core.Keyword(null,"data-type","data-type",-326421468),new cljs.core.Keyword(null,"keyword","keyword",811389747));
} else {
if((data instanceof cljs.core.Symbol)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(summary,new cljs.core.Keyword(null,"data-type","data-type",-326421468),new cljs.core.Keyword(null,"symbol","symbol",-1038572696));
} else {
if(cljs.core.map_QMARK_(data)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(summary,new cljs.core.Keyword(null,"data-type","data-type",-326421468),new cljs.core.Keyword(null,"map","map",1371690461),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"data-count","data-count",1898198662),cljs.core.count(data)], 0));
} else {
if(cljs.core.vector_QMARK_(data)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(summary,new cljs.core.Keyword(null,"data-type","data-type",-326421468),new cljs.core.Keyword(null,"vec","vec",-657847931),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"data-count","data-count",1898198662),cljs.core.count(data)], 0));
} else {
if(cljs.core.set_QMARK_(data)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(summary,new cljs.core.Keyword(null,"data-type","data-type",-326421468),new cljs.core.Keyword(null,"set","set",304602554),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"data-count","data-count",1898198662),cljs.core.count(data)], 0));
} else {
if(cljs.core.list_QMARK_(data)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(summary,new cljs.core.Keyword(null,"data-type","data-type",-326421468),new cljs.core.Keyword(null,"list","list",765357683),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"data-count","data-count",1898198662),cljs.core.count(data)], 0));
} else {
if(cljs.core.seq_QMARK_(data)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(summary,new cljs.core.Keyword(null,"data-type","data-type",-326421468),new cljs.core.Keyword(null,"seq","seq",-1817803783));
} else {
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(summary,new cljs.core.Keyword(null,"data-type","data-type",-326421468),new cljs.core.Keyword(null,"unsupported","unsupported",-1045607016));

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
}
}catch (e42460){var e = e42460;
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(summary,new cljs.core.Keyword(null,"data-type","data-type",-326421468),new cljs.core.Keyword(null,"unsupported","unsupported",-1045607016),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"data-type-fail","data-type-fail",1917235450),true], 0));
}});
shadow.remote.runtime.obj_support.merge_source_info = (function shadow$remote$runtime$obj_support$merge_source_info(summary,p__42556){
var map__42557 = p__42556;
var map__42557__$1 = cljs.core.__destructure_map(map__42557);
var obj_info = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__42557__$1,new cljs.core.Keyword(null,"obj-info","obj-info",-373842651));
return cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([summary,cljs.core.select_keys(obj_info,new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"ns","ns",441598760),new cljs.core.Keyword(null,"line","line",212345235),new cljs.core.Keyword(null,"column","column",2078222095),new cljs.core.Keyword(null,"label","label",1718410804)], null))], 0));
});
shadow.remote.runtime.obj_support.inspect_entry_BANG_ = (function shadow$remote$runtime$obj_support$inspect_entry_BANG_(p__42570,p__42571){
var map__42573 = p__42570;
var map__42573__$1 = cljs.core.__destructure_map(map__42573);
var this$ = map__42573__$1;
var state_ref = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__42573__$1,new cljs.core.Keyword(null,"state-ref","state-ref",2127874952));
var map__42574 = p__42571;
var map__42574__$1 = cljs.core.__destructure_map(map__42574);
var entry = map__42574__$1;
var obj = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__42574__$1,new cljs.core.Keyword(null,"obj","obj",981763962));
var data = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__42574__$1,new cljs.core.Keyword(null,"data","data",-232669377));
var added_at = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__42574__$1,new cljs.core.Keyword(null,"added-at","added-at",-352499434));
var $ = shadow.remote.runtime.obj_support.merge_source_info(shadow.remote.runtime.obj_support.get_data_type(new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"added-at","added-at",-352499434),added_at,new cljs.core.Keyword(null,"datafied","datafied",2076148104),(!((data === obj))),new cljs.core.Keyword(null,"obj-type","obj-type",-1658555496),shadow.remote.runtime.obj_support.obj_type_string(obj),new cljs.core.Keyword(null,"preview","preview",451279890),shadow.remote.runtime.writer.pr_str_limit(obj,(250)),new cljs.core.Keyword(null,"supports","supports",1501242067),cljs.core.PersistentHashSet.EMPTY], null),entry),entry);
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (summary,inspect_fn){
return (inspect_fn.cljs$core$IFn$_invoke$arity$2 ? inspect_fn.cljs$core$IFn$_invoke$arity$2(summary,entry) : inspect_fn.call(null,summary,entry));
}),$,new cljs.core.Keyword(null,"inspectors","inspectors",-426448246).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(state_ref)));
});
shadow.remote.runtime.obj_support.obj_describe_STAR_ = (function shadow$remote$runtime$obj_support$obj_describe_STAR_(p__42591,oid){
var map__42592 = p__42591;
var map__42592__$1 = cljs.core.__destructure_map(map__42592);
var this$ = map__42592__$1;
var state_ref = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__42592__$1,new cljs.core.Keyword(null,"state-ref","state-ref",2127874952));
var temp__5808__auto__ = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(state_ref),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"objects","objects",2099713734),oid], null));
if((temp__5808__auto__ == null)){
return null;
} else {
var entry = temp__5808__auto__;
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(state_ref,cljs.core.assoc_in,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"objects","objects",2099713734),oid,new cljs.core.Keyword(null,"access-at","access-at",-1487162729)], null),shadow.remote.runtime.obj_support.now());

return shadow.remote.runtime.obj_support.inspect_entry_BANG_(this$,entry);
}
});
shadow.remote.runtime.obj_support.handler_with_object = (function shadow$remote$runtime$obj_support$handler_with_object(handler_fn){
return (function (p__42600,p__42601){
var map__42603 = p__42600;
var map__42603__$1 = cljs.core.__destructure_map(map__42603);
var this$ = map__42603__$1;
var state_ref = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__42603__$1,new cljs.core.Keyword(null,"state-ref","state-ref",2127874952));
var runtime = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__42603__$1,new cljs.core.Keyword(null,"runtime","runtime",-1331573996));
var map__42604 = p__42601;
var map__42604__$1 = cljs.core.__destructure_map(map__42604);
var msg = map__42604__$1;
var op = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__42604__$1,new cljs.core.Keyword(null,"op","op",-1882987955));
var oid = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__42604__$1,new cljs.core.Keyword(null,"oid","oid",-768692334));
var entry = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(state_ref),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"objects","objects",2099713734),oid], null));
if(cljs.core.not(entry)){
return shadow.remote.runtime.shared.reply(runtime,msg,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"op","op",-1882987955),new cljs.core.Keyword(null,"obj-not-found","obj-not-found",1577257696),new cljs.core.Keyword(null,"oid","oid",-768692334),oid], null));
} else {
try{cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(state_ref,cljs.core.assoc_in,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"objects","objects",2099713734),oid,new cljs.core.Keyword(null,"access-at","access-at",-1487162729)], null),shadow.remote.runtime.obj_support.now());

var result = (handler_fn.cljs$core$IFn$_invoke$arity$3 ? handler_fn.cljs$core$IFn$_invoke$arity$3(this$,entry,msg) : handler_fn.call(null,this$,entry,msg));
if((!(shadow.remote.runtime.obj_support.obj_ref_QMARK_(result)))){
return shadow.remote.runtime.shared.reply(runtime,msg,new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"op","op",-1882987955),new cljs.core.Keyword(null,"obj-result","obj-result",-486300152),new cljs.core.Keyword(null,"oid","oid",-768692334),oid,new cljs.core.Keyword(null,"result","result",1415092211),result], null));
} else {
var new_oid = (function (){var G__42616 = this$;
var G__42617 = new cljs.core.Keyword(null,"obj","obj",981763962).cljs$core$IFn$_invoke$arity$1(result);
var G__42618 = cljs.core.PersistentArrayMap.EMPTY;
return (shadow.remote.runtime.obj_support.register.cljs$core$IFn$_invoke$arity$3 ? shadow.remote.runtime.obj_support.register.cljs$core$IFn$_invoke$arity$3(G__42616,G__42617,G__42618) : shadow.remote.runtime.obj_support.register.call(null,G__42616,G__42617,G__42618));
})();
var reply_msg = (function (){var G__42619 = new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"op","op",-1882987955),new cljs.core.Keyword(null,"obj-result-ref","obj-result-ref",1537374891),new cljs.core.Keyword(null,"oid","oid",-768692334),oid,new cljs.core.Keyword(null,"ref-oid","ref-oid",-526648644),new_oid], null);
var G__42619__$1 = (cljs.core.truth_(new cljs.core.Keyword(null,"summary","summary",380847952).cljs$core$IFn$_invoke$arity$1(msg))?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__42619,new cljs.core.Keyword(null,"summary","summary",380847952),shadow.remote.runtime.obj_support.obj_describe_STAR_(this$,new_oid)):G__42619);
if(cljs.core.truth_(new cljs.core.Keyword(null,"extra","extra",1612569067).cljs$core$IFn$_invoke$arity$1(result))){
return cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([G__42619__$1,new cljs.core.Keyword(null,"extra","extra",1612569067).cljs$core$IFn$_invoke$arity$1(result)], 0));
} else {
return G__42619__$1;
}
})();
return shadow.remote.runtime.shared.reply(runtime,msg,reply_msg);
}
}catch (e42610){var e = e42610;
console.warn("action-request-action failed",new cljs.core.Keyword(null,"obj","obj",981763962).cljs$core$IFn$_invoke$arity$1(entry),e);

return shadow.remote.runtime.shared.reply(runtime,msg,new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"op","op",-1882987955),new cljs.core.Keyword(null,"obj-request-failed","obj-request-failed",-1782005406),new cljs.core.Keyword(null,"oid","oid",-768692334),oid,new cljs.core.Keyword(null,"msg","msg",-1386103444),msg,new cljs.core.Keyword(null,"ex-oid","ex-oid",-650256737),(function (){var G__42612 = this$;
var G__42613 = e;
var G__42614 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"msg","msg",-1386103444),msg], null);
return (shadow.remote.runtime.obj_support.register.cljs$core$IFn$_invoke$arity$3 ? shadow.remote.runtime.obj_support.register.cljs$core$IFn$_invoke$arity$3(G__42612,G__42613,G__42614) : shadow.remote.runtime.obj_support.register.call(null,G__42612,G__42613,G__42614));
})()], null));
}}
});
});
shadow.remote.runtime.obj_support.obj_get_value = shadow.remote.runtime.obj_support.handler_with_object((function (this$,p__42621,msg){
var map__42622 = p__42621;
var map__42622__$1 = cljs.core.__destructure_map(map__42622);
var entry = map__42622__$1;
var obj = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__42622__$1,new cljs.core.Keyword(null,"obj","obj",981763962));
return obj;
}));
shadow.remote.runtime.obj_support.default_max_print_size = (((1) * (1024)) * (1024));
shadow.remote.runtime.obj_support.pick_target = (function shadow$remote$runtime$obj_support$pick_target(entry,msg){
if(cljs.core.truth_(new cljs.core.Keyword(null,"original","original",-445386197).cljs$core$IFn$_invoke$arity$1(msg))){
return new cljs.core.Keyword(null,"obj","obj",981763962).cljs$core$IFn$_invoke$arity$1(entry);
} else {
return new cljs.core.Keyword(null,"data","data",-232669377).cljs$core$IFn$_invoke$arity$1(entry);
}
});
shadow.remote.runtime.obj_support.obj_edn = shadow.remote.runtime.obj_support.handler_with_object((function (this$,entry,p__42634){
var map__42635 = p__42634;
var map__42635__$1 = cljs.core.__destructure_map(map__42635);
var msg = map__42635__$1;
var limit = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__42635__$1,new cljs.core.Keyword(null,"limit","limit",-1355822363),shadow.remote.runtime.obj_support.default_max_print_size);
var target = shadow.remote.runtime.obj_support.pick_target(entry,msg);
var lw = shadow.remote.runtime.writer.limit_writer(limit);
cljs.core.pr_writer(target,lw,cljs.core.pr_opts());

return shadow.remote.runtime.writer.get_string(lw);
}));
shadow.remote.runtime.obj_support.obj_pprint = shadow.remote.runtime.obj_support.handler_with_object((function (this$,entry,p__42641){
var map__42642 = p__42641;
var map__42642__$1 = cljs.core.__destructure_map(map__42642);
var msg = map__42642__$1;
var limit = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__42642__$1,new cljs.core.Keyword(null,"limit","limit",-1355822363),shadow.remote.runtime.obj_support.default_max_print_size);
var target = shadow.remote.runtime.obj_support.pick_target(entry,msg);
var lw = shadow.remote.runtime.writer.limit_writer(limit);
cljs.pprint.pprint.cljs$core$IFn$_invoke$arity$2(target,lw);

return shadow.remote.runtime.writer.get_string(lw);
}));
shadow.remote.runtime.obj_support.obj_edn_limit = shadow.remote.runtime.obj_support.handler_with_object((function (this$,entry,p__42643){
var map__42644 = p__42643;
var map__42644__$1 = cljs.core.__destructure_map(map__42644);
var msg = map__42644__$1;
var limit = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__42644__$1,new cljs.core.Keyword(null,"limit","limit",-1355822363));
return shadow.remote.runtime.writer.pr_str_limit(shadow.remote.runtime.obj_support.pick_target(entry,msg),limit);
}));
shadow.remote.runtime.obj_support.obj_str = shadow.remote.runtime.obj_support.handler_with_object((function (this$,p__42645,msg){
var map__42646 = p__42645;
var map__42646__$1 = cljs.core.__destructure_map(map__42646);
var entry = map__42646__$1;
var obj = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__42646__$1,new cljs.core.Keyword(null,"obj","obj",981763962));
return cljs.core.str.cljs$core$IFn$_invoke$arity$1(obj);
}));
shadow.remote.runtime.obj_support.obj_ex_str = shadow.remote.runtime.obj_support.handler_with_object((function (this$,p__42647,msg){
var map__42648 = p__42647;
var map__42648__$1 = cljs.core.__destructure_map(map__42648);
var entry = map__42648__$1;
var ex = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__42648__$1,new cljs.core.Keyword(null,"obj","obj",981763962));
if((ex instanceof Error)){
return cljs.repl.error__GT_str(ex);
} else {
return ["Execution error:\n","  ",cljs.core.subs.cljs$core$IFn$_invoke$arity$2(shadow.remote.runtime.writer.pr_str_limit(ex,(200)),(2)),"\n","\n"].join('');
}
}));
shadow.remote.runtime.obj_support.exception_QMARK_ = (function shadow$remote$runtime$obj_support$exception_QMARK_(x){
return true;
});
shadow.remote.runtime.obj_support.simple_value_QMARK_ = (function shadow$remote$runtime$obj_support$simple_value_QMARK_(val){
return (((val == null)) || (((cljs.core.boolean_QMARK_(val)) || (((typeof val === 'number') || ((((val instanceof cljs.core.Keyword)) || ((((((val instanceof cljs.core.Symbol)) && ((cljs.core.meta(val) == null)))) || (((((typeof val === 'string') && (((64) > cljs.core.count(val))))) || (((cljs.core.coll_QMARK_(val)) && (((cljs.core.empty_QMARK_(val)) && ((cljs.core.meta(val) == null)))))))))))))))));
});
shadow.remote.runtime.obj_support.rank_predicates = new cljs.core.PersistentVector(null, 9, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.nil_QMARK_,cljs.core.boolean_QMARK_,cljs.core.number_QMARK_,cljs.core.string_QMARK_,cljs.core.keyword_QMARK_,cljs.core.symbol_QMARK_,cljs.core.vector_QMARK_,cljs.core.map_QMARK_,cljs.core.list_QMARK_], null);
shadow.remote.runtime.obj_support.rank_val = (function shadow$remote$runtime$obj_support$rank_val(val){
return cljs.core.reduce_kv((function (res,idx,pred){
if(cljs.core.truth_((pred.cljs$core$IFn$_invoke$arity$1 ? pred.cljs$core$IFn$_invoke$arity$1(val) : pred.call(null,val)))){
return cljs.core.reduced(idx);
} else {
return res;
}
}),(-1),shadow.remote.runtime.obj_support.rank_predicates);
});
shadow.remote.runtime.obj_support.smart_comp = (function shadow$remote$runtime$obj_support$smart_comp(a,b){
try{return cljs.core.compare(a,b);
}catch (e42654){if((e42654 instanceof Error)){
var e = e42654;
var ar = shadow.remote.runtime.obj_support.rank_val(a);
var br = shadow.remote.runtime.obj_support.rank_val(b);
return cljs.core.compare(ar,br);
} else {
throw e42654;

}
}});
shadow.remote.runtime.obj_support.attempt_to_sort = (function shadow$remote$runtime$obj_support$attempt_to_sort(coll){
return cljs.core.vec((function (){try{return cljs.core.sort.cljs$core$IFn$_invoke$arity$2(shadow.remote.runtime.obj_support.smart_comp,coll);
}catch (e42658){var e = e42658;
return coll;
}})());
});
shadow.remote.runtime.obj_support.cache_view_order = (function shadow$remote$runtime$obj_support$cache_view_order(state_ref,p__42662,coll){
var map__42663 = p__42662;
var map__42663__$1 = cljs.core.__destructure_map(map__42663);
var oid = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__42663__$1,new cljs.core.Keyword(null,"oid","oid",-768692334));
var view_order = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__42663__$1,new cljs.core.Keyword(null,"view-order","view-order",566761574));
var or__5002__auto__ = view_order;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var view_order__$1 = shadow.remote.runtime.obj_support.attempt_to_sort(coll);
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(state_ref,cljs.core.assoc_in,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"objects","objects",2099713734),oid,new cljs.core.Keyword(null,"view-order","view-order",566761574)], null),view_order__$1);

return view_order__$1;
}
});
shadow.remote.runtime.obj_support.obj_nav = shadow.remote.runtime.obj_support.handler_with_object((function (p__42665,p__42666,p__42667){
var map__42668 = p__42665;
var map__42668__$1 = cljs.core.__destructure_map(map__42668);
var state_ref = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__42668__$1,new cljs.core.Keyword(null,"state-ref","state-ref",2127874952));
var map__42669 = p__42666;
var map__42669__$1 = cljs.core.__destructure_map(map__42669);
var entry = map__42669__$1;
var data = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__42669__$1,new cljs.core.Keyword(null,"data","data",-232669377));
var map__42670 = p__42667;
var map__42670__$1 = cljs.core.__destructure_map(map__42670);
var msg = map__42670__$1;
var idx = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__42670__$1,new cljs.core.Keyword(null,"idx","idx",1053688473));
if(((cljs.core.vector_QMARK_(data)) || (cljs.core.list_QMARK_(data)))){
var val = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(data,idx);
var nav = clojure.datafy.nav(data,idx,val);
return shadow.remote.runtime.obj_support.obj_ref.cljs$core$IFn$_invoke$arity$2(nav,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"nav?","nav?",1269039770),cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(val,nav)], null));
} else {
if(cljs.core.map_QMARK_(data)){
var view_order = shadow.remote.runtime.obj_support.cache_view_order(state_ref,entry,cljs.core.keys(data));
var key = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(view_order,idx);
var val = cljs.core.get.cljs$core$IFn$_invoke$arity$2(data,key);
var nav = clojure.datafy.nav(data,key,val);
return shadow.remote.runtime.obj_support.obj_ref.cljs$core$IFn$_invoke$arity$2(nav,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"nav?","nav?",1269039770),cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(val,nav)], null));
} else {
if(cljs.core.set_QMARK_(data)){
var view_order = shadow.remote.runtime.obj_support.cache_view_order(state_ref,entry,data);
var val = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(view_order,idx);
var nav = clojure.datafy.nav(data,idx,val);
return shadow.remote.runtime.obj_support.obj_ref.cljs$core$IFn$_invoke$arity$2(nav,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"nav?","nav?",1269039770),cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(val,nav)], null));
} else {
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2("nav not supported?",entry);

}
}
}
}));
shadow.remote.runtime.obj_support.obj_fragment = shadow.remote.runtime.obj_support.handler_with_object((function (p__42671,p__42672,p__42673){
var map__42674 = p__42671;
var map__42674__$1 = cljs.core.__destructure_map(map__42674);
var state_ref = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__42674__$1,new cljs.core.Keyword(null,"state-ref","state-ref",2127874952));
var map__42675 = p__42672;
var map__42675__$1 = cljs.core.__destructure_map(map__42675);
var entry = map__42675__$1;
var data = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__42675__$1,new cljs.core.Keyword(null,"data","data",-232669377));
var map__42676 = p__42673;
var map__42676__$1 = cljs.core.__destructure_map(map__42676);
var msg = map__42676__$1;
var start = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__42676__$1,new cljs.core.Keyword(null,"start","start",-355208981));
var num = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__42676__$1,new cljs.core.Keyword(null,"num","num",1985240673));
var val_limit = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__42676__$1,new cljs.core.Keyword(null,"val-limit","val-limit",1428666181),(100));
if(cljs.core.map_QMARK_(data)){
var map__42680 = msg;
var map__42680__$1 = cljs.core.__destructure_map(map__42680);
var key_limit = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__42680__$1,new cljs.core.Keyword(null,"key-limit","key-limit",259239169),(100));
var view_order = shadow.remote.runtime.obj_support.cache_view_order(state_ref,entry,cljs.core.keys(data));
var end = (function (){var x__5090__auto__ = cljs.core.count(view_order);
var y__5091__auto__ = (start + num);
return ((x__5090__auto__ < y__5091__auto__) ? x__5090__auto__ : y__5091__auto__);
})();
var idxs = cljs.core.range.cljs$core$IFn$_invoke$arity$2(start,end);
var fragment = cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (m,idx){
var key = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(view_order,idx);
var val = cljs.core.get.cljs$core$IFn$_invoke$arity$2(data,key);
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(m,idx,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"key","key",-1516042587),(function (){try{return shadow.remote.runtime.writer.pr_str_limit(key,key_limit);
}catch (e42684){var e = e42684;
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [true,"... print failed ..."], null);
}})(),new cljs.core.Keyword(null,"val","val",128701612),(function (){try{return shadow.remote.runtime.writer.pr_str_limit(val,val_limit);
}catch (e42685){var e = e42685;
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [true,"... print failed ..."], null);
}})()], null));
}),cljs.core.PersistentArrayMap.EMPTY,idxs);
return fragment;
} else {
if(cljs.core.vector_QMARK_(data)){
var end = (function (){var x__5090__auto__ = cljs.core.count(data);
var y__5091__auto__ = (start + num);
return ((x__5090__auto__ < y__5091__auto__) ? x__5090__auto__ : y__5091__auto__);
})();
var idxs = cljs.core.range.cljs$core$IFn$_invoke$arity$2(start,end);
var fragment = cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (m,idx){
var val = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(data,idx);
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(m,idx,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"val","val",128701612),shadow.remote.runtime.writer.pr_str_limit(val,val_limit)], null));
}),cljs.core.PersistentArrayMap.EMPTY,idxs);
return fragment;
} else {
if(cljs.core.list_QMARK_(data)){
var end = (function (){var x__5090__auto__ = cljs.core.count(data);
var y__5091__auto__ = (start + num);
return ((x__5090__auto__ < y__5091__auto__) ? x__5090__auto__ : y__5091__auto__);
})();
var idxs = cljs.core.range.cljs$core$IFn$_invoke$arity$2(start,end);
var fragment = cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (m,idx){
var val = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(data,idx);
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(m,idx,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"val","val",128701612),shadow.remote.runtime.writer.pr_str_limit(val,val_limit)], null));
}),cljs.core.PersistentArrayMap.EMPTY,idxs);
return fragment;
} else {
if(cljs.core.set_QMARK_(data)){
var view_order = shadow.remote.runtime.obj_support.cache_view_order(state_ref,entry,data);
var end = (function (){var x__5090__auto__ = cljs.core.count(view_order);
var y__5091__auto__ = (start + num);
return ((x__5090__auto__ < y__5091__auto__) ? x__5090__auto__ : y__5091__auto__);
})();
var idxs = cljs.core.range.cljs$core$IFn$_invoke$arity$2(start,end);
var fragment = cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (m,idx){
var val = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(view_order,idx);
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(m,idx,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"val","val",128701612),shadow.remote.runtime.writer.pr_str_limit(val,val_limit)], null));
}),cljs.core.PersistentArrayMap.EMPTY,idxs);
return fragment;
} else {
return null;
}
}
}
}
}));
shadow.remote.runtime.obj_support.obj_request = (function shadow$remote$runtime$obj_support$obj_request(this$,p__42691){
var map__42692 = p__42691;
var map__42692__$1 = cljs.core.__destructure_map(map__42692);
var msg = map__42692__$1;
var request_op = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__42692__$1,new cljs.core.Keyword(null,"request-op","request-op",1472997246));
var real_handler = (function (){var G__42693 = request_op;
var G__42693__$1 = (((G__42693 instanceof cljs.core.Keyword))?G__42693.fqn:null);
switch (G__42693__$1) {
case "str":
return shadow.remote.runtime.obj_support.obj_str;

break;
case "ex-str":
return shadow.remote.runtime.obj_support.obj_ex_str;

break;
case "edn":
return shadow.remote.runtime.obj_support.obj_edn;

break;
case "edn-limit":
return shadow.remote.runtime.obj_support.obj_edn;

break;
case "pprint":
return this$;

break;
case "nav":
return this$;

break;
case "fragment":
return shadow.remote.runtime.obj_support.obj_fragment;

break;
default:
throw (new Error(["No matching clause: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(G__42693__$1)].join('')));

}
})();
return (real_handler.cljs$core$IFn$_invoke$arity$2 ? real_handler.cljs$core$IFn$_invoke$arity$2(this$,msg) : real_handler.call(null,this$,msg));
});
shadow.remote.runtime.obj_support.obj_describe = (function shadow$remote$runtime$obj_support$obj_describe(p__42706,p__42707){
var map__42708 = p__42706;
var map__42708__$1 = cljs.core.__destructure_map(map__42708);
var this$ = map__42708__$1;
var runtime = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__42708__$1,new cljs.core.Keyword(null,"runtime","runtime",-1331573996));
var map__42709 = p__42707;
var map__42709__$1 = cljs.core.__destructure_map(map__42709);
var msg = map__42709__$1;
var oid = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__42709__$1,new cljs.core.Keyword(null,"oid","oid",-768692334));
var temp__5802__auto__ = shadow.remote.runtime.obj_support.obj_describe_STAR_(this$,oid);
if(cljs.core.truth_(temp__5802__auto__)){
var summary = temp__5802__auto__;
return shadow.remote.runtime.shared.reply(runtime,msg,new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"op","op",-1882987955),new cljs.core.Keyword(null,"obj-summary","obj-summary",-1372191064),new cljs.core.Keyword(null,"oid","oid",-768692334),oid,new cljs.core.Keyword(null,"summary","summary",380847952),summary], null));
} else {
return shadow.remote.runtime.shared.reply(runtime,msg,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"op","op",-1882987955),new cljs.core.Keyword(null,"obj-not-found","obj-not-found",1577257696),new cljs.core.Keyword(null,"oid","oid",-768692334),oid], null));
}
});
shadow.remote.runtime.obj_support.obj_forget = (function shadow$remote$runtime$obj_support$obj_forget(p__42716,p__42717){
var map__42718 = p__42716;
var map__42718__$1 = cljs.core.__destructure_map(map__42718);
var svc = map__42718__$1;
var state_ref = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__42718__$1,new cljs.core.Keyword(null,"state-ref","state-ref",2127874952));
var map__42719 = p__42717;
var map__42719__$1 = cljs.core.__destructure_map(map__42719);
var msg = map__42719__$1;
var oid = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__42719__$1,new cljs.core.Keyword(null,"oid","oid",-768692334));
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$variadic(state_ref,cljs.core.update,new cljs.core.Keyword(null,"objects","objects",2099713734),cljs.core.dissoc,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([oid], 0));
});
shadow.remote.runtime.obj_support.obj_forget_all = (function shadow$remote$runtime$obj_support$obj_forget_all(p__42723,msg){
var map__42724 = p__42723;
var map__42724__$1 = cljs.core.__destructure_map(map__42724);
var svc = map__42724__$1;
var state_ref = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__42724__$1,new cljs.core.Keyword(null,"state-ref","state-ref",2127874952));
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(state_ref,cljs.core.assoc,new cljs.core.Keyword(null,"objects","objects",2099713734),cljs.core.PersistentArrayMap.EMPTY);
});
shadow.remote.runtime.obj_support.basic_gc_BANG_ = (function shadow$remote$runtime$obj_support$basic_gc_BANG_(state){
var objs_to_drop = cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"oid","oid",-768692334),cljs.core.drop.cljs$core$IFn$_invoke$arity$2((100),cljs.core.reverse(cljs.core.sort_by.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"access-at","access-at",-1487162729),cljs.core.vals(new cljs.core.Keyword(null,"objects","objects",2099713734).cljs$core$IFn$_invoke$arity$1(state))))));
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (state__$1,oid){
return cljs.core.update.cljs$core$IFn$_invoke$arity$4(state__$1,new cljs.core.Keyword(null,"objects","objects",2099713734),cljs.core.dissoc,oid);
}),state,objs_to_drop);
});
shadow.remote.runtime.obj_support.add_inspector = (function shadow$remote$runtime$obj_support$add_inspector(p__42725,inspect_fn){
var map__42726 = p__42725;
var map__42726__$1 = cljs.core.__destructure_map(map__42726);
var this$ = map__42726__$1;
var state_ref = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__42726__$1,new cljs.core.Keyword(null,"state-ref","state-ref",2127874952));
if(cljs.core.fn_QMARK_(inspect_fn)){
} else {
throw (new Error("Assert failed: (fn? inspect-fn)"));
}

cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$variadic(state_ref,cljs.core.update,new cljs.core.Keyword(null,"inspectors","inspectors",-426448246),cljs.core.conj,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([inspect_fn], 0));

return this$;
});
shadow.remote.runtime.obj_support.start = (function shadow$remote$runtime$obj_support$start(runtime){
var state_ref = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"objects","objects",2099713734),cljs.core.PersistentArrayMap.EMPTY,new cljs.core.Keyword(null,"inspectors","inspectors",-426448246),cljs.core.PersistentHashSet.EMPTY,new cljs.core.Keyword(null,"id-seq-ref","id-seq-ref",-98357047),(0)], null));
var svc = shadow.remote.runtime.obj_support.add_inspector(shadow.remote.runtime.obj_support.add_inspector(shadow.remote.runtime.obj_support.add_inspector(shadow.remote.runtime.obj_support.add_inspector(shadow.remote.runtime.obj_support.add_inspector(shadow.remote.runtime.obj_support.add_inspector(shadow.remote.runtime.obj_support.add_inspector(shadow.remote.runtime.obj_support.add_inspector(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"runtime","runtime",-1331573996),runtime,new cljs.core.Keyword(null,"state-ref","state-ref",2127874952),state_ref], null),(function (summary,p__42746){
var map__42747 = p__42746;
var map__42747__$1 = cljs.core.__destructure_map(map__42747);
var entry = map__42747__$1;
var obj = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__42747__$1,new cljs.core.Keyword(null,"obj","obj",981763962));
if((!(shadow.remote.runtime.obj_support.simple_value_QMARK_(obj)))){
return summary;
} else {
return cljs.core.update.cljs$core$IFn$_invoke$arity$4(summary,new cljs.core.Keyword(null,"supports","supports",1501242067),cljs.core.conj,new cljs.core.Keyword(null,"obj-get-value","obj-get-value",281897170));
}
})),(function (summary,entry){
return cljs.core.update.cljs$core$IFn$_invoke$arity$4(summary,new cljs.core.Keyword(null,"supports","supports",1501242067),cljs.core.conj,new cljs.core.Keyword(null,"obj-str","obj-str",1815115325));
})),(function (summary,p__42748){
var map__42749 = p__42748;
var map__42749__$1 = cljs.core.__destructure_map(map__42749);
var entry = map__42749__$1;
var obj = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__42749__$1,new cljs.core.Keyword(null,"obj","obj",981763962));
if(shadow.remote.runtime.obj_support.exception_QMARK_(obj)){
return cljs.core.update.cljs$core$IFn$_invoke$arity$4(summary,new cljs.core.Keyword(null,"supports","supports",1501242067),cljs.core.conj,new cljs.core.Keyword(null,"obj-ex-str","obj-ex-str",-639656467));
} else {
return summary;
}
})),(function (summary,entry){
return cljs.core.update.cljs$core$IFn$_invoke$arity$4(summary,new cljs.core.Keyword(null,"supports","supports",1501242067),cljs.core.conj,new cljs.core.Keyword(null,"obj-edn","obj-edn",809365133));
})),(function (summary,entry){
return cljs.core.update.cljs$core$IFn$_invoke$arity$4(summary,new cljs.core.Keyword(null,"supports","supports",1501242067),cljs.core.conj,new cljs.core.Keyword(null,"obj-edn-limit","obj-edn-limit",-1550136004));
})),(function (summary,p__42752){
var map__42753 = p__42752;
var map__42753__$1 = cljs.core.__destructure_map(map__42753);
var entry = map__42753__$1;
var data = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__42753__$1,new cljs.core.Keyword(null,"data","data",-232669377));
if(((cljs.core.coll_QMARK_(data)) || (cljs.core.seq_QMARK_(data)))){
return cljs.core.update.cljs$core$IFn$_invoke$arity$4(summary,new cljs.core.Keyword(null,"supports","supports",1501242067),cljs.core.conj,new cljs.core.Keyword(null,"obj-pprint","obj-pprint",-1831226802));
} else {
return summary;
}
})),(function (summary,p__42754){
var map__42755 = p__42754;
var map__42755__$1 = cljs.core.__destructure_map(map__42755);
var entry = map__42755__$1;
var data = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__42755__$1,new cljs.core.Keyword(null,"data","data",-232669377));
if(((((cljs.core.map_QMARK_(data)) || (((cljs.core.vector_QMARK_(data)) || (((cljs.core.set_QMARK_(data)) || (cljs.core.list_QMARK_(data)))))))) && (cljs.core.seq(data)))){
return cljs.core.update.cljs$core$IFn$_invoke$arity$4(summary,new cljs.core.Keyword(null,"supports","supports",1501242067),cljs.core.conj,new cljs.core.Keyword(null,"obj-nav","obj-nav",1248750622));
} else {
return summary;
}
})),(function (summary,p__42756){
var map__42757 = p__42756;
var map__42757__$1 = cljs.core.__destructure_map(map__42757);
var entry = map__42757__$1;
var data = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__42757__$1,new cljs.core.Keyword(null,"data","data",-232669377));
if(((((cljs.core.map_QMARK_(data)) || (((cljs.core.vector_QMARK_(data)) || (((cljs.core.set_QMARK_(data)) || (cljs.core.list_QMARK_(data)))))))) && (cljs.core.seq(data)))){
return cljs.core.update.cljs$core$IFn$_invoke$arity$4(summary,new cljs.core.Keyword(null,"supports","supports",1501242067),cljs.core.conj,new cljs.core.Keyword(null,"obj-fragment","obj-fragment",1857463161));
} else {
return summary;
}
}));
shadow.remote.runtime.api.add_extension(runtime,new cljs.core.Keyword("shadow.remote.runtime.obj-support","ext","shadow.remote.runtime.obj-support/ext",-1896569346),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"ops","ops",1237330063),cljs.core.PersistentHashMap.fromArrays([new cljs.core.Keyword(null,"obj-forget","obj-forget",2003566115),new cljs.core.Keyword(null,"obj-describe","obj-describe",-34922904),new cljs.core.Keyword(null,"obj-ex-str","obj-ex-str",-639656467),new cljs.core.Keyword(null,"obj-request","obj-request",-1709325811),new cljs.core.Keyword(null,"obj-edn","obj-edn",809365133),new cljs.core.Keyword(null,"obj-pprint","obj-pprint",-1831226802),new cljs.core.Keyword(null,"obj-get-value","obj-get-value",281897170),new cljs.core.Keyword(null,"obj-forget-all","obj-forget-all",1418682131),new cljs.core.Keyword(null,"obj-fragment","obj-fragment",1857463161),new cljs.core.Keyword(null,"obj-edn-limit","obj-edn-limit",-1550136004),new cljs.core.Keyword(null,"obj-str","obj-str",1815115325),new cljs.core.Keyword(null,"obj-nav","obj-nav",1248750622)],[(function (p1__42739_SHARP_){
return shadow.remote.runtime.obj_support.obj_forget(svc,p1__42739_SHARP_);
}),(function (p1__42729_SHARP_){
return shadow.remote.runtime.obj_support.obj_describe(svc,p1__42729_SHARP_);
}),(function (p1__42735_SHARP_){
return shadow.remote.runtime.obj_support.obj_ex_str(svc,p1__42735_SHARP_);
}),(function (p1__42730_SHARP_){
return shadow.remote.runtime.obj_support.obj_request(svc,p1__42730_SHARP_);
}),(function (p1__42731_SHARP_){
return shadow.remote.runtime.obj_support.obj_edn(svc,p1__42731_SHARP_);
}),(function (p1__42736_SHARP_){
return shadow.remote.runtime.obj_support.obj_pprint(svc,p1__42736_SHARP_);
}),(function (p1__42732_SHARP_){
return shadow.remote.runtime.obj_support.obj_get_value(svc,p1__42732_SHARP_);
}),(function (p1__42740_SHARP_){
return shadow.remote.runtime.obj_support.obj_forget_all(svc,p1__42740_SHARP_);
}),(function (p1__42738_SHARP_){
return shadow.remote.runtime.obj_support.obj_fragment(svc,p1__42738_SHARP_);
}),(function (p1__42733_SHARP_){
return shadow.remote.runtime.obj_support.obj_edn_limit(svc,p1__42733_SHARP_);
}),(function (p1__42734_SHARP_){
return shadow.remote.runtime.obj_support.obj_str(svc,p1__42734_SHARP_);
}),(function (p1__42737_SHARP_){
return shadow.remote.runtime.obj_support.obj_nav(svc,p1__42737_SHARP_);
})]),new cljs.core.Keyword(null,"on-idle","on-idle",2044706602),(function (){
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$2(state_ref,shadow.remote.runtime.obj_support.basic_gc_BANG_);
})], null));

return svc;
});
shadow.remote.runtime.obj_support.get_tap_history = (function shadow$remote$runtime$obj_support$get_tap_history(p__42759,num){
var map__42761 = p__42759;
var map__42761__$1 = cljs.core.__destructure_map(map__42761);
var svc = map__42761__$1;
var state_ref = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__42761__$1,new cljs.core.Keyword(null,"state-ref","state-ref",2127874952));
return cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentVector.EMPTY,cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"oid","oid",-768692334),cljs.core.take.cljs$core$IFn$_invoke$arity$2(num,cljs.core.reverse(cljs.core.sort_by.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"added-at","added-at",-352499434),cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (p1__42758_SHARP_){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"tap","tap",-1086702463),cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(p1__42758_SHARP_,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"obj-info","obj-info",-373842651),new cljs.core.Keyword(null,"from","from",1815293044)], null)));
}),cljs.core.vals(new cljs.core.Keyword(null,"objects","objects",2099713734).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(state_ref)))))))));
});
shadow.remote.runtime.obj_support.register = (function shadow$remote$runtime$obj_support$register(p__42763,obj,obj_info){
var map__42764 = p__42763;
var map__42764__$1 = cljs.core.__destructure_map(map__42764);
var svc = map__42764__$1;
var state_ref = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__42764__$1,new cljs.core.Keyword(null,"state-ref","state-ref",2127874952));
var oid = shadow.remote.runtime.obj_support.next_oid();
if((!(((cljs.core.vector_QMARK_(obj)) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("shadow.remote","wrap","shadow.remote/wrap",996267199),cljs.core.first(obj))) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.count(obj),(3))))))))){
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$variadic(state_ref,shadow.remote.runtime.obj_support.register_STAR_,oid,obj,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([obj_info], 0));
} else {
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$variadic(state_ref,shadow.remote.runtime.obj_support.register_STAR_,oid,cljs.core.nth.cljs$core$IFn$_invoke$arity$2(obj,(1)),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([obj_info,cljs.core.nth.cljs$core$IFn$_invoke$arity$2(obj,(2))], 0))], 0));
}

return oid;
});
shadow.remote.runtime.obj_support.get_ref = (function shadow$remote$runtime$obj_support$get_ref(p__42766,obj_id){
var map__42767 = p__42766;
var map__42767__$1 = cljs.core.__destructure_map(map__42767);
var state_ref = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__42767__$1,new cljs.core.Keyword(null,"state-ref","state-ref",2127874952));
return cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(state_ref),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"objects","objects",2099713734),obj_id], null));
});
shadow.remote.runtime.obj_support.stop = (function shadow$remote$runtime$obj_support$stop(p__42779){
var map__42781 = p__42779;
var map__42781__$1 = cljs.core.__destructure_map(map__42781);
var runtime = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__42781__$1,new cljs.core.Keyword(null,"runtime","runtime",-1331573996));
return shadow.remote.runtime.api.del_extension(runtime,new cljs.core.Keyword("shadow.remote.runtime.obj-support","ext","shadow.remote.runtime.obj-support/ext",-1896569346));
});

//# sourceMappingURL=shadow.remote.runtime.obj_support.js.map
