goog.provide('sci.impl.records');
if((typeof sci !== 'undefined') && (typeof sci.impl !== 'undefined') && (typeof sci.impl.records !== 'undefined') && (typeof sci.impl.records.to_string !== 'undefined')){
} else {
sci.impl.records.to_string = (function (){var method_table__5599__auto__ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
var prefer_table__5600__auto__ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
var method_cache__5601__auto__ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
var cached_hierarchy__5602__auto__ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
var hierarchy__5603__auto__ = cljs.core.get.cljs$core$IFn$_invoke$arity$3(cljs.core.PersistentArrayMap.EMPTY,new cljs.core.Keyword(null,"hierarchy","hierarchy",-1053470341),(function (){var fexpr__79233 = cljs.core.get_global_hierarchy;
return (fexpr__79233.cljs$core$IFn$_invoke$arity$0 ? fexpr__79233.cljs$core$IFn$_invoke$arity$0() : fexpr__79233.call(null));
})());
return (new cljs.core.MultiFn(cljs.core.symbol.cljs$core$IFn$_invoke$arity$2("sci.impl.records","to-string"),sci.impl.types.type_impl,new cljs.core.Keyword(null,"default","default",-1987822328),hierarchy__5603__auto__,method_table__5599__auto__,prefer_table__5600__auto__,method_cache__5601__auto__,cached_hierarchy__5602__auto__));
})();
}
sci.impl.records.to_string.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"default","default",-1987822328),(function (this$){
var t = sci.impl.types.type_impl(this$);
return [cljs.core.namespace(t),".",cljs.core.name(t),"@",cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.hash(this$).toString((16)))].join('');
}));
sci.impl.records.clojure_str = (function sci$impl$records$clojure_str(v){
var t = sci.impl.types.type_impl(v);
return ["#",cljs.core.namespace(t),".",cljs.core.name(t),cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,v))].join('');
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
sci.impl.records.SciRecord = (function (__meta,__extmap,__hash){
this.__meta = __meta;
this.__extmap = __extmap;
this.__hash = __hash;
this.cljs$lang$protocol_mask$partition0$ = 2230716170;
this.cljs$lang$protocol_mask$partition1$ = 139264;
});
(sci.impl.records.SciRecord.prototype.toString = (function (){
var self__ = this;
var this$ = this;
return sci.impl.records.to_string.cljs$core$IFn$_invoke$arity$1(this$);
}));

(sci.impl.records.SciRecord.prototype.cljs$core$ILookup$_lookup$arity$2 = (function (this__5300__auto__,k__5301__auto__){
var self__ = this;
var this__5300__auto____$1 = this;
return this__5300__auto____$1.cljs$core$ILookup$_lookup$arity$3(null,k__5301__auto__,null);
}));

(sci.impl.records.SciRecord.prototype.cljs$core$ILookup$_lookup$arity$3 = (function (this__5302__auto__,k79239,else__5303__auto__){
var self__ = this;
var this__5302__auto____$1 = this;
var G__79247 = k79239;
switch (G__79247) {
default:
return cljs.core.get.cljs$core$IFn$_invoke$arity$3(self__.__extmap,k79239,else__5303__auto__);

}
}));

(sci.impl.records.SciRecord.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = (function (this__5320__auto__,f__5321__auto__,init__5322__auto__){
var self__ = this;
var this__5320__auto____$1 = this;
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (ret__5323__auto__,p__79248){
var vec__79249 = p__79248;
var k__5324__auto__ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__79249,(0),null);
var v__5325__auto__ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__79249,(1),null);
return (f__5321__auto__.cljs$core$IFn$_invoke$arity$3 ? f__5321__auto__.cljs$core$IFn$_invoke$arity$3(ret__5323__auto__,k__5324__auto__,v__5325__auto__) : f__5321__auto__.call(null,ret__5323__auto__,k__5324__auto__,v__5325__auto__));
}),init__5322__auto__,this__5320__auto____$1);
}));

(sci.impl.records.SciRecord.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = (function (this__5315__auto__,writer__5316__auto__,opts__5317__auto__){
var self__ = this;
var this__5315__auto____$1 = this;
var pr_pair__5318__auto__ = (function (keyval__5319__auto__){
return cljs.core.pr_sequential_writer(writer__5316__auto__,cljs.core.pr_writer,""," ","",opts__5317__auto__,keyval__5319__auto__);
});
return cljs.core.pr_sequential_writer(writer__5316__auto__,pr_pair__5318__auto__,"#sci.impl.records.SciRecord{",", ","}",opts__5317__auto__,cljs.core.concat.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentVector.EMPTY,self__.__extmap));
}));

(sci.impl.records.SciRecord.prototype.cljs$core$IIterable$_iterator$arity$1 = (function (G__79238){
var self__ = this;
var G__79238__$1 = this;
return (new cljs.core.RecordIter((0),G__79238__$1,0,cljs.core.PersistentVector.EMPTY,(cljs.core.truth_(self__.__extmap)?cljs.core._iterator(self__.__extmap):cljs.core.nil_iter())));
}));

(sci.impl.records.SciRecord.prototype.cljs$core$IMeta$_meta$arity$1 = (function (this__5298__auto__){
var self__ = this;
var this__5298__auto____$1 = this;
return self__.__meta;
}));

(sci.impl.records.SciRecord.prototype.cljs$core$ICloneable$_clone$arity$1 = (function (this__5295__auto__){
var self__ = this;
var this__5295__auto____$1 = this;
return (new sci.impl.records.SciRecord(self__.__meta,self__.__extmap,self__.__hash));
}));

(sci.impl.records.SciRecord.prototype.cljs$core$ICounted$_count$arity$1 = (function (this__5304__auto__){
var self__ = this;
var this__5304__auto____$1 = this;
return (0 + cljs.core.count(self__.__extmap));
}));

(sci.impl.records.SciRecord.prototype.cljs$core$IHash$_hash$arity$1 = (function (this__5296__auto__){
var self__ = this;
var this__5296__auto____$1 = this;
var h__5111__auto__ = self__.__hash;
if((!((h__5111__auto__ == null)))){
return h__5111__auto__;
} else {
var h__5111__auto____$1 = (function (coll__5297__auto__){
return (1162423961 ^ cljs.core.hash_unordered_coll(coll__5297__auto__));
})(this__5296__auto____$1);
(self__.__hash = h__5111__auto____$1);

return h__5111__auto____$1;
}
}));

(sci.impl.records.SciRecord.prototype.cljs$core$IEquiv$_equiv$arity$2 = (function (this79240,other79241){
var self__ = this;
var this79240__$1 = this;
return (((!((other79241 == null)))) && ((((this79240__$1.constructor === other79241.constructor)) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(this79240__$1.__extmap,other79241.__extmap)))));
}));

(sci.impl.records.SciRecord.prototype.cljs$core$IMap$_dissoc$arity$2 = (function (this__5310__auto__,k__5311__auto__){
var self__ = this;
var this__5310__auto____$1 = this;
if(cljs.core.contains_QMARK_(cljs.core.PersistentHashSet.EMPTY,k__5311__auto__)){
return cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(cljs.core._with_meta(cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,this__5310__auto____$1),self__.__meta),k__5311__auto__);
} else {
return (new sci.impl.records.SciRecord(self__.__meta,cljs.core.not_empty(cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(self__.__extmap,k__5311__auto__)),null));
}
}));

(sci.impl.records.SciRecord.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = (function (this__5307__auto__,k79239){
var self__ = this;
var this__5307__auto____$1 = this;
return cljs.core.contains_QMARK_(self__.__extmap,k79239);
}));

(sci.impl.records.SciRecord.prototype.cljs$core$IAssociative$_assoc$arity$3 = (function (this__5308__auto__,k__5309__auto__,G__79238){
var self__ = this;
var this__5308__auto____$1 = this;
var pred__79258 = cljs.core.keyword_identical_QMARK_;
var expr__79259 = k__5309__auto__;
return (new sci.impl.records.SciRecord(self__.__meta,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(self__.__extmap,k__5309__auto__,G__79238),null));
}));

(sci.impl.records.SciRecord.prototype.cljs$core$ISeqable$_seq$arity$1 = (function (this__5313__auto__){
var self__ = this;
var this__5313__auto____$1 = this;
return cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentVector.EMPTY,self__.__extmap));
}));

(sci.impl.records.SciRecord.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = (function (this__5299__auto__,G__79238){
var self__ = this;
var this__5299__auto____$1 = this;
return (new sci.impl.records.SciRecord(G__79238,self__.__extmap,self__.__hash));
}));

(sci.impl.records.SciRecord.prototype.cljs$core$ICollection$_conj$arity$2 = (function (this__5305__auto__,entry__5306__auto__){
var self__ = this;
var this__5305__auto____$1 = this;
if(cljs.core.vector_QMARK_(entry__5306__auto__)){
return this__5305__auto____$1.cljs$core$IAssociative$_assoc$arity$3(null,cljs.core._nth(entry__5306__auto__,(0)),cljs.core._nth(entry__5306__auto__,(1)));
} else {
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3(cljs.core._conj,this__5305__auto____$1,entry__5306__auto__);
}
}));

(sci.impl.records.SciRecord.getBasis = (function (){
return cljs.core.PersistentVector.EMPTY;
}));

(sci.impl.records.SciRecord.cljs$lang$type = true);

(sci.impl.records.SciRecord.cljs$lang$ctorPrSeq = (function (this__5346__auto__){
return (new cljs.core.List(null,"sci.impl.records/SciRecord",null,(1),null));
}));

(sci.impl.records.SciRecord.cljs$lang$ctorPrWriter = (function (this__5346__auto__,writer__5347__auto__){
return cljs.core._write(writer__5347__auto__,"sci.impl.records/SciRecord");
}));

/**
 * Positional factory function for sci.impl.records/SciRecord.
 */
sci.impl.records.__GT_SciRecord = (function sci$impl$records$__GT_SciRecord(){
return (new sci.impl.records.SciRecord(null,null,null));
});

/**
 * Factory function for sci.impl.records/SciRecord, taking a map of keywords to field values.
 */
sci.impl.records.map__GT_SciRecord = (function sci$impl$records$map__GT_SciRecord(G__79242){
var extmap__5342__auto__ = (function (){var G__79266 = cljs.core.dissoc.cljs$core$IFn$_invoke$arity$1(G__79242);
if(cljs.core.record_QMARK_(G__79242)){
return cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,G__79266);
} else {
return G__79266;
}
})();
return (new sci.impl.records.SciRecord(null,cljs.core.not_empty(extmap__5342__auto__),null));
});

(sci.impl.records.SciRecord.prototype.cljs$core$IPrintWithWriter$ = cljs.core.PROTOCOL_SENTINEL);

(sci.impl.records.SciRecord.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = (function (new_obj,writer,_){
var new_obj__$1 = this;
return cljs.core.write_all.cljs$core$IFn$_invoke$arity$variadic(writer,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([sci.impl.records.clojure_str(new_obj__$1)], 0));
}));
sci.impl.records.__GT_record_impl = (function sci$impl$records$__GT_record_impl(m){
return sci.impl.records.map__GT_SciRecord(m);
});
sci.impl.records.defrecord = (function sci$impl$records$defrecord(var_args){
var args__5732__auto__ = [];
var len__5726__auto___79385 = arguments.length;
var i__5727__auto___79387 = (0);
while(true){
if((i__5727__auto___79387 < len__5726__auto___79385)){
args__5732__auto__.push((arguments[i__5727__auto___79387]));

var G__79390 = (i__5727__auto___79387 + (1));
i__5727__auto___79387 = G__79390;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((5) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((5)),(0),null)):null);
return sci.impl.records.defrecord.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),(arguments[(1)]),(arguments[(2)]),(arguments[(3)]),(arguments[(4)]),argseq__5733__auto__);
});

(sci.impl.records.defrecord.cljs$core$IFn$_invoke$arity$variadic = (function (form,_,ctx,record_name,fields,raw_protocol_impls){
if(cljs.core.truth_(new cljs.core.Keyword("sci.impl","macroexpanding","sci.impl/macroexpanding",2113471825).cljs$core$IFn$_invoke$arity$1(ctx))){
return cljs.core.cons(new cljs.core.Symbol("clojure.core","defrecord","clojure.core/defrecord",581689476,null),cljs.core.rest(form));
} else {
var factory_fn_str = ["->",cljs.core.str.cljs$core$IFn$_invoke$arity$1(record_name)].join('');
var factory_fn_sym = cljs.core.symbol.cljs$core$IFn$_invoke$arity$1(factory_fn_str);
var map_factory_sym = cljs.core.symbol.cljs$core$IFn$_invoke$arity$1(["map",factory_fn_str].join(''));
var keys = cljs.core.mapv.cljs$core$IFn$_invoke$arity$2(cljs.core.keyword,fields);
var rec_type = cljs.core.symbol.cljs$core$IFn$_invoke$arity$2(cljs.core.str.cljs$core$IFn$_invoke$arity$1(sci.impl.vars.current_ns_name()),cljs.core.str.cljs$core$IFn$_invoke$arity$1(record_name));
var protocol_impls = sci.impl.utils.split_when(cljs.core.symbol_QMARK_,raw_protocol_impls);
var field_set = cljs.core.set(fields);
var protocol_impls__$1 = cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (p__79302,expr){
var vec__79303 = p__79302;
var seq__79304 = cljs.core.seq(vec__79303);
var first__79305 = cljs.core.first(seq__79304);
var seq__79304__$1 = cljs.core.next(seq__79304);
var protocol_name = first__79305;
var impls = seq__79304__$1;
var impls__$1 = cljs.core.group_by(cljs.core.first,impls);
var protocol = (function (){var G__79307 = ctx;
var G__79308 = new cljs.core.Keyword(null,"bindings","bindings",1271397192).cljs$core$IFn$_invoke$arity$1(ctx);
var G__79309 = protocol_name;
var fexpr__79306 = cljs.core.deref(sci.impl.utils.eval_resolve_state);
return (fexpr__79306.cljs$core$IFn$_invoke$arity$3 ? fexpr__79306.cljs$core$IFn$_invoke$arity$3(G__79307,G__79308,G__79309) : fexpr__79306.call(null,G__79307,G__79308,G__79309));
})();
var protocol__$1 = (function (){var or__5002__auto__ = protocol;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Symbol(null,"Object","Object",61210754,null),protocol_name)){
return new cljs.core.Keyword("sci.impl.records","object","sci.impl.records/object",-590699738);
} else {
return null;
}
}
})();
var ___$1 = (cljs.core.truth_(protocol__$1)?null:sci.impl.utils.throw_error_with_location.cljs$core$IFn$_invoke$arity$2(["Protocol not found: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(protocol_name)].join(''),expr));
var protocol__$2 = ((sci.impl.vars.var_QMARK_(protocol__$1))?cljs.core.deref(protocol__$1):protocol__$1);
var protocol_ns = new cljs.core.Keyword(null,"ns","ns",441598760).cljs$core$IFn$_invoke$arity$1(protocol__$2);
var pns = (cljs.core.truth_(protocol_ns)?cljs.core.str.cljs$core$IFn$_invoke$arity$1(sci.impl.vars.getName(protocol_ns)):((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("sci.impl.records","object","sci.impl.records/object",-590699738),protocol__$2))?"sci.impl.records":null));
var fq_meth_name = (function (p1__79278_SHARP_){
if(cljs.core.simple_symbol_QMARK_(p1__79278_SHARP_)){
return cljs.core.symbol.cljs$core$IFn$_invoke$arity$2(pns,cljs.core.str.cljs$core$IFn$_invoke$arity$1(p1__79278_SHARP_));
} else {
return p1__79278_SHARP_;
}
});
return cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p__79317){
var vec__79318 = p__79317;
var method_name = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__79318,(0),null);
var bodies = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__79318,(1),null);
var bodies__$1 = cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.rest,bodies);
var bodies__$2 = cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (impl){
var args = cljs.core.first(impl);
var body = cljs.core.rest(impl);
var destr = sci.impl.utils.maybe_destructured(args,body);
var args__$1 = new cljs.core.Keyword(null,"params","params",710516235).cljs$core$IFn$_invoke$arity$1(destr);
var orig_this_sym = cljs.core.first(args__$1);
var rest_args = cljs.core.rest(args__$1);
var shadows_this_QMARK_ = cljs.core.some((function (p1__79279_SHARP_){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(orig_this_sym,p1__79279_SHARP_);
}),rest_args);
var this_sym = (cljs.core.truth_(shadows_this_QMARK_)?cljs.core.gensym.cljs$core$IFn$_invoke$arity$1("this_"):orig_this_sym);
var args__$2 = (cljs.core.truth_(shadows_this_QMARK_)?cljs.core.vec(cljs.core.cons(this_sym,rest_args)):args__$1);
var bindings = cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (field){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [field,(new cljs.core.List(null,cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(field),(new cljs.core.List(null,this_sym,null,(1),null)),(2),null))], null);
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.reduce.cljs$core$IFn$_invoke$arity$3(cljs.core.disj,field_set,args__$2)], 0));
var bindings__$1 = (cljs.core.truth_(shadows_this_QMARK_)?cljs.core.concat.cljs$core$IFn$_invoke$arity$2(bindings,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [orig_this_sym,this_sym], null)):bindings);
var bindings__$2 = cljs.core.vec(bindings__$1);
return cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$2((new cljs.core.List(null,args__$2,null,(1),null)),(new cljs.core.List(null,cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic((new cljs.core.List(null,new cljs.core.Symbol("cljs.core","let","cljs.core/let",-308701135,null),null,(1),null)),(new cljs.core.List(null,bindings__$2,null,(1),null)),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([body], 0)))),null,(1),null)))));
}),bodies__$1);
return cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic((new cljs.core.List(null,new cljs.core.Symbol("cljs.core","defmethod","cljs.core/defmethod",-180785162,null),null,(1),null)),(new cljs.core.List(null,fq_meth_name(method_name),null,(1),null)),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([(new cljs.core.List(null,cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$2((new cljs.core.List(null,new cljs.core.Symbol(null,"quote","quote",1377916282,null),null,(1),null)),(new cljs.core.List(null,rec_type,null,(1),null))))),null,(1),null)),bodies__$2], 0))));
}),impls__$1);
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([protocol_impls,raw_protocol_impls], 0));
return cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic((new cljs.core.List(null,new cljs.core.Symbol(null,"do","do",1686842252,null),null,(1),null)),(new cljs.core.List(null,cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic((new cljs.core.List(null,new cljs.core.Symbol("cljs.core","defn","cljs.core/defn",-1606493717,null),null,(1),null)),(new cljs.core.List(null,map_factory_sym,null,(1),null)),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([(new cljs.core.List(null,cljs.core.vec(cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$1((new cljs.core.List(null,new cljs.core.Symbol(null,"m__79282__auto__","m__79282__auto__",-1645045596,null),null,(1),null)))))),null,(1),null)),(new cljs.core.List(null,cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic((new cljs.core.List(null,new cljs.core.Symbol("cljs.core","vary-meta","cljs.core/vary-meta",-938366546,null),null,(1),null)),(new cljs.core.List(null,cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$2((new cljs.core.List(null,new cljs.core.Symbol("cljs.core","->record-impl","cljs.core/->record-impl",1673017880,null),null,(1),null)),(new cljs.core.List(null,new cljs.core.Symbol(null,"m__79282__auto__","m__79282__auto__",-1645045596,null),null,(1),null))))),null,(1),null)),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([(new cljs.core.List(null,new cljs.core.Symbol("cljs.core","assoc","cljs.core/assoc",322326297,null),null,(1),null)),(new cljs.core.List(null,new cljs.core.Keyword("sci.impl","record","sci.impl/record",-1939193950),null,(1),null)),(new cljs.core.List(null,true,null,(1),null)),(new cljs.core.List(null,new cljs.core.Keyword(null,"type","type",1174270348),null,(1),null)),(new cljs.core.List(null,cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$2((new cljs.core.List(null,new cljs.core.Symbol(null,"quote","quote",1377916282,null),null,(1),null)),(new cljs.core.List(null,rec_type,null,(1),null))))),null,(1),null))], 0)))),null,(1),null))], 0)))),null,(1),null)),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([(new cljs.core.List(null,cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic((new cljs.core.List(null,new cljs.core.Symbol("cljs.core","defn","cljs.core/defn",-1606493717,null),null,(1),null)),(new cljs.core.List(null,factory_fn_sym,null,(1),null)),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([(new cljs.core.List(null,cljs.core.vec(cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$2((new cljs.core.List(null,new cljs.core.Symbol(null,"&","&",-2144855648,null),null,(1),null)),(new cljs.core.List(null,new cljs.core.Symbol(null,"args__79283__auto__","args__79283__auto__",-759211372,null),null,(1),null)))))),null,(1),null)),(new cljs.core.List(null,cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic((new cljs.core.List(null,new cljs.core.Symbol("cljs.core","vary-meta","cljs.core/vary-meta",-938366546,null),null,(1),null)),(new cljs.core.List(null,cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$2((new cljs.core.List(null,new cljs.core.Symbol("cljs.core","->record-impl","cljs.core/->record-impl",1673017880,null),null,(1),null)),(new cljs.core.List(null,cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic((new cljs.core.List(null,new cljs.core.Symbol("cljs.core","zipmap","cljs.core/zipmap",-1902130674,null),null,(1),null)),(new cljs.core.List(null,keys,null,(1),null)),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([(new cljs.core.List(null,new cljs.core.Symbol(null,"args__79283__auto__","args__79283__auto__",-759211372,null),null,(1),null))], 0)))),null,(1),null))))),null,(1),null)),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([(new cljs.core.List(null,new cljs.core.Symbol("cljs.core","assoc","cljs.core/assoc",322326297,null),null,(1),null)),(new cljs.core.List(null,new cljs.core.Keyword("sci.impl","record","sci.impl/record",-1939193950),null,(1),null)),(new cljs.core.List(null,true,null,(1),null)),(new cljs.core.List(null,new cljs.core.Keyword(null,"type","type",1174270348),null,(1),null)),(new cljs.core.List(null,cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$2((new cljs.core.List(null,new cljs.core.Symbol(null,"quote","quote",1377916282,null),null,(1),null)),(new cljs.core.List(null,rec_type,null,(1),null))))),null,(1),null))], 0)))),null,(1),null))], 0)))),null,(1),null)),(new cljs.core.List(null,cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic((new cljs.core.List(null,new cljs.core.Symbol(null,"def","def",597100991,null),null,(1),null)),(new cljs.core.List(null,record_name,null,(1),null)),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([(new cljs.core.List(null,cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic((new cljs.core.List(null,new cljs.core.Symbol("cljs.core","with-meta","cljs.core/with-meta",749126446,null),null,(1),null)),(new cljs.core.List(null,cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$2((new cljs.core.List(null,new cljs.core.Symbol(null,"quote","quote",1377916282,null),null,(1),null)),(new cljs.core.List(null,rec_type,null,(1),null))))),null,(1),null)),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([(new cljs.core.List(null,cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core.array_map,cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic((new cljs.core.List(null,new cljs.core.Keyword("sci.impl","record","sci.impl/record",-1939193950),null,(1),null)),(new cljs.core.List(null,true,null,(1),null)),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([(new cljs.core.List(null,new cljs.core.Keyword("sci.impl.record","map-constructor","sci.impl.record/map-constructor",1072184780),null,(1),null)),(new cljs.core.List(null,map_factory_sym,null,(1),null)),(new cljs.core.List(null,new cljs.core.Keyword("sci.impl.record","constructor","sci.impl.record/constructor",-2025684209),null,(1),null)),(new cljs.core.List(null,factory_fn_sym,null,(1),null))], 0))))),null,(1),null))], 0)))),null,(1),null))], 0)))),null,(1),null)),protocol_impls__$1], 0))));
}
}));

(sci.impl.records.defrecord.cljs$lang$maxFixedArity = (5));

/** @this {Function} */
(sci.impl.records.defrecord.cljs$lang$applyTo = (function (seq79284){
var G__79285 = cljs.core.first(seq79284);
var seq79284__$1 = cljs.core.next(seq79284);
var G__79286 = cljs.core.first(seq79284__$1);
var seq79284__$2 = cljs.core.next(seq79284__$1);
var G__79287 = cljs.core.first(seq79284__$2);
var seq79284__$3 = cljs.core.next(seq79284__$2);
var G__79288 = cljs.core.first(seq79284__$3);
var seq79284__$4 = cljs.core.next(seq79284__$3);
var G__79289 = cljs.core.first(seq79284__$4);
var seq79284__$5 = cljs.core.next(seq79284__$4);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__79285,G__79286,G__79287,G__79288,G__79289,seq79284__$5);
}));

sci.impl.records.sci_record_QMARK_ = (function sci$impl$records$sci_record_QMARK_(x){
var or__5002__auto__ = ((cljs.core.map_QMARK_(x))?(function (){var G__79342 = x;
var G__79342__$1 = (((G__79342 == null))?null:cljs.core.meta(G__79342));
if((G__79342__$1 == null)){
return null;
} else {
return new cljs.core.Keyword("sci.impl","record","sci.impl/record",-1939193950).cljs$core$IFn$_invoke$arity$1(G__79342__$1);
}
})():null);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.record_QMARK_(x);
}
});
/**
 * A record class is represented by a symbol with metadata (currently). This is only an implementation detail.
 * A protocol is represented by a map with :ns, :methods and optionally :class. This is also an implementation detail.
 */
sci.impl.records.resolve_record_or_protocol_class = (function sci$impl$records$resolve_record_or_protocol_class(var_args){
var G__79348 = arguments.length;
switch (G__79348) {
case 2:
return sci.impl.records.resolve_record_or_protocol_class.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return sci.impl.records.resolve_record_or_protocol_class.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(sci.impl.records.resolve_record_or_protocol_class.cljs$core$IFn$_invoke$arity$2 = (function (ctx,sym){
var sym_str = cljs.core.str.cljs$core$IFn$_invoke$arity$1(sym);
var last_dot = clojure.string.last_index_of.cljs$core$IFn$_invoke$arity$2(sym_str,".");
var class_name = (cljs.core.truth_(last_dot)?cljs.core.subs.cljs$core$IFn$_invoke$arity$3(sym_str,(last_dot + (1)),((sym_str).length)):sym_str);
var namespace = (cljs.core.truth_(last_dot)?cljs.core.symbol.cljs$core$IFn$_invoke$arity$1(cljs.core.subs.cljs$core$IFn$_invoke$arity$3(sym_str,(0),last_dot)):sci.impl.vars.current_ns_name());
return sci.impl.records.resolve_record_or_protocol_class.cljs$core$IFn$_invoke$arity$3(ctx,namespace,cljs.core.symbol.cljs$core$IFn$_invoke$arity$1(class_name));
}));

(sci.impl.records.resolve_record_or_protocol_class.cljs$core$IFn$_invoke$arity$3 = (function (ctx,package$,class$){
var namespace = cljs.core.symbol.cljs$core$IFn$_invoke$arity$1(clojure.string.replace(cljs.core.str.cljs$core$IFn$_invoke$arity$1(package$),"_","-"));
var temp__5804__auto__ = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(new cljs.core.Keyword(null,"env","env",-1815813235).cljs$core$IFn$_invoke$arity$1(ctx)),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"namespaces","namespaces",-1444157469),namespace,class$], null));
if(cljs.core.truth_(temp__5804__auto__)){
var sci_var = temp__5804__auto__;
if(sci.impl.vars.var_QMARK_(sci_var)){
return cljs.core.deref(sci_var);
} else {
return sci_var;
}
} else {
return null;
}
}));

(sci.impl.records.resolve_record_or_protocol_class.cljs$lang$maxFixedArity = 3);

sci.impl.records.resolve_record_class = (function sci$impl$records$resolve_record_class(ctx,class_sym){
var temp__5804__auto__ = sci.impl.records.resolve_record_or_protocol_class.cljs$core$IFn$_invoke$arity$2(ctx,class_sym);
if(cljs.core.truth_(temp__5804__auto__)){
var x = temp__5804__auto__;
if((x instanceof cljs.core.Symbol)){
return x;
} else {
return null;
}
} else {
return null;
}
});

//# sourceMappingURL=sci.impl.records.js.map
