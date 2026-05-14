goog.provide('datascript.pull_api');



datascript.pull_api.first_seq = (function datascript$pull_api$first_seq(xs){
if((xs == null)){
return null;
} else {
return cljs.core._first(xs);
}
});
datascript.pull_api.next_seq = (function datascript$pull_api$next_seq(xs){
if((xs == null)){
return null;
} else {
return cljs.core._next(xs);
}
});
datascript.pull_api.conj_seq = (function datascript$pull_api$conj_seq(xs,x){
if((xs == null)){
return (new cljs.core.List(null,x,null,(1),null));
} else {
return cljs.core._conj(xs,x);
}
});
datascript.pull_api.assoc_some_BANG_ = (function datascript$pull_api$assoc_some_BANG_(m,k,v){
if((v == null)){
return m;
} else {
return cljs.core.assoc_BANG_.cljs$core$IFn$_invoke$arity$3(m,k,v);
}
});
datascript.pull_api.conj_some_BANG_ = (function datascript$pull_api$conj_some_BANG_(xs,v){
if((v == null)){
return xs;
} else {
return cljs.core.conj_BANG_.cljs$core$IFn$_invoke$arity$2(xs,v);
}
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
datascript.pull_api.Context = (function (db,visitor,__meta,__extmap,__hash){
this.db = db;
this.visitor = visitor;
this.__meta = __meta;
this.__extmap = __extmap;
this.__hash = __hash;
this.cljs$lang$protocol_mask$partition0$ = 2230716170;
this.cljs$lang$protocol_mask$partition1$ = 139264;
});
(datascript.pull_api.Context.prototype.cljs$core$ILookup$_lookup$arity$2 = (function (this__5300__auto__,k__5301__auto__){
var self__ = this;
var this__5300__auto____$1 = this;
return this__5300__auto____$1.cljs$core$ILookup$_lookup$arity$3(null,k__5301__auto__,null);
}));

(datascript.pull_api.Context.prototype.cljs$core$ILookup$_lookup$arity$3 = (function (this__5302__auto__,k51646,else__5303__auto__){
var self__ = this;
var this__5302__auto____$1 = this;
var G__51680 = k51646;
var G__51680__$1 = (((G__51680 instanceof cljs.core.Keyword))?G__51680.fqn:null);
switch (G__51680__$1) {
case "db":
return self__.db;

break;
case "visitor":
return self__.visitor;

break;
default:
return cljs.core.get.cljs$core$IFn$_invoke$arity$3(self__.__extmap,k51646,else__5303__auto__);

}
}));

(datascript.pull_api.Context.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = (function (this__5320__auto__,f__5321__auto__,init__5322__auto__){
var self__ = this;
var this__5320__auto____$1 = this;
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (ret__5323__auto__,p__51688){
var vec__51692 = p__51688;
var k__5324__auto__ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__51692,(0),null);
var v__5325__auto__ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__51692,(1),null);
return (f__5321__auto__.cljs$core$IFn$_invoke$arity$3 ? f__5321__auto__.cljs$core$IFn$_invoke$arity$3(ret__5323__auto__,k__5324__auto__,v__5325__auto__) : f__5321__auto__.call(null,ret__5323__auto__,k__5324__auto__,v__5325__auto__));
}),init__5322__auto__,this__5320__auto____$1);
}));

(datascript.pull_api.Context.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = (function (this__5315__auto__,writer__5316__auto__,opts__5317__auto__){
var self__ = this;
var this__5315__auto____$1 = this;
var pr_pair__5318__auto__ = (function (keyval__5319__auto__){
return cljs.core.pr_sequential_writer(writer__5316__auto__,cljs.core.pr_writer,""," ","",opts__5317__auto__,keyval__5319__auto__);
});
return cljs.core.pr_sequential_writer(writer__5316__auto__,pr_pair__5318__auto__,"#datascript.pull-api.Context{",", ","}",opts__5317__auto__,cljs.core.concat.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [(new cljs.core.PersistentVector(null,2,(5),cljs.core.PersistentVector.EMPTY_NODE,[new cljs.core.Keyword(null,"db","db",993250759),self__.db],null)),(new cljs.core.PersistentVector(null,2,(5),cljs.core.PersistentVector.EMPTY_NODE,[new cljs.core.Keyword(null,"visitor","visitor",-1026865865),self__.visitor],null))], null),self__.__extmap));
}));

(datascript.pull_api.Context.prototype.cljs$core$IIterable$_iterator$arity$1 = (function (G__51645){
var self__ = this;
var G__51645__$1 = this;
return (new cljs.core.RecordIter((0),G__51645__$1,2,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"db","db",993250759),new cljs.core.Keyword(null,"visitor","visitor",-1026865865)], null),(cljs.core.truth_(self__.__extmap)?cljs.core._iterator(self__.__extmap):cljs.core.nil_iter())));
}));

(datascript.pull_api.Context.prototype.cljs$core$IMeta$_meta$arity$1 = (function (this__5298__auto__){
var self__ = this;
var this__5298__auto____$1 = this;
return self__.__meta;
}));

(datascript.pull_api.Context.prototype.cljs$core$ICloneable$_clone$arity$1 = (function (this__5295__auto__){
var self__ = this;
var this__5295__auto____$1 = this;
return (new datascript.pull_api.Context(self__.db,self__.visitor,self__.__meta,self__.__extmap,self__.__hash));
}));

(datascript.pull_api.Context.prototype.cljs$core$ICounted$_count$arity$1 = (function (this__5304__auto__){
var self__ = this;
var this__5304__auto____$1 = this;
return (2 + cljs.core.count(self__.__extmap));
}));

(datascript.pull_api.Context.prototype.cljs$core$IHash$_hash$arity$1 = (function (this__5296__auto__){
var self__ = this;
var this__5296__auto____$1 = this;
var h__5111__auto__ = self__.__hash;
if((!((h__5111__auto__ == null)))){
return h__5111__auto__;
} else {
var h__5111__auto____$1 = (function (coll__5297__auto__){
return (1727735959 ^ cljs.core.hash_unordered_coll(coll__5297__auto__));
})(this__5296__auto____$1);
(self__.__hash = h__5111__auto____$1);

return h__5111__auto____$1;
}
}));

(datascript.pull_api.Context.prototype.cljs$core$IEquiv$_equiv$arity$2 = (function (this51648,other51649){
var self__ = this;
var this51648__$1 = this;
return (((!((other51649 == null)))) && ((((this51648__$1.constructor === other51649.constructor)) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(this51648__$1.db,other51649.db)) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(this51648__$1.visitor,other51649.visitor)) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(this51648__$1.__extmap,other51649.__extmap)))))))));
}));

(datascript.pull_api.Context.prototype.cljs$core$IMap$_dissoc$arity$2 = (function (this__5310__auto__,k__5311__auto__){
var self__ = this;
var this__5310__auto____$1 = this;
if(cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"db","db",993250759),null,new cljs.core.Keyword(null,"visitor","visitor",-1026865865),null], null), null),k__5311__auto__)){
return cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(cljs.core._with_meta(cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,this__5310__auto____$1),self__.__meta),k__5311__auto__);
} else {
return (new datascript.pull_api.Context(self__.db,self__.visitor,self__.__meta,cljs.core.not_empty(cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(self__.__extmap,k__5311__auto__)),null));
}
}));

(datascript.pull_api.Context.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = (function (this__5307__auto__,k51646){
var self__ = this;
var this__5307__auto____$1 = this;
var G__51707 = k51646;
var G__51707__$1 = (((G__51707 instanceof cljs.core.Keyword))?G__51707.fqn:null);
switch (G__51707__$1) {
case "db":
case "visitor":
return true;

break;
default:
return cljs.core.contains_QMARK_(self__.__extmap,k51646);

}
}));

(datascript.pull_api.Context.prototype.cljs$core$IAssociative$_assoc$arity$3 = (function (this__5308__auto__,k__5309__auto__,G__51645){
var self__ = this;
var this__5308__auto____$1 = this;
var pred__51708 = cljs.core.keyword_identical_QMARK_;
var expr__51709 = k__5309__auto__;
if(cljs.core.truth_((pred__51708.cljs$core$IFn$_invoke$arity$2 ? pred__51708.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"db","db",993250759),expr__51709) : pred__51708.call(null,new cljs.core.Keyword(null,"db","db",993250759),expr__51709)))){
return (new datascript.pull_api.Context(G__51645,self__.visitor,self__.__meta,self__.__extmap,null));
} else {
if(cljs.core.truth_((pred__51708.cljs$core$IFn$_invoke$arity$2 ? pred__51708.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"visitor","visitor",-1026865865),expr__51709) : pred__51708.call(null,new cljs.core.Keyword(null,"visitor","visitor",-1026865865),expr__51709)))){
return (new datascript.pull_api.Context(self__.db,G__51645,self__.__meta,self__.__extmap,null));
} else {
return (new datascript.pull_api.Context(self__.db,self__.visitor,self__.__meta,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(self__.__extmap,k__5309__auto__,G__51645),null));
}
}
}));

(datascript.pull_api.Context.prototype.cljs$core$ISeqable$_seq$arity$1 = (function (this__5313__auto__){
var self__ = this;
var this__5313__auto____$1 = this;
return cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [(new cljs.core.MapEntry(new cljs.core.Keyword(null,"db","db",993250759),self__.db,null)),(new cljs.core.MapEntry(new cljs.core.Keyword(null,"visitor","visitor",-1026865865),self__.visitor,null))], null),self__.__extmap));
}));

(datascript.pull_api.Context.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = (function (this__5299__auto__,G__51645){
var self__ = this;
var this__5299__auto____$1 = this;
return (new datascript.pull_api.Context(self__.db,self__.visitor,G__51645,self__.__extmap,self__.__hash));
}));

(datascript.pull_api.Context.prototype.cljs$core$ICollection$_conj$arity$2 = (function (this__5305__auto__,entry__5306__auto__){
var self__ = this;
var this__5305__auto____$1 = this;
if(cljs.core.vector_QMARK_(entry__5306__auto__)){
return this__5305__auto____$1.cljs$core$IAssociative$_assoc$arity$3(null,cljs.core._nth(entry__5306__auto__,(0)),cljs.core._nth(entry__5306__auto__,(1)));
} else {
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3(cljs.core._conj,this__5305__auto____$1,entry__5306__auto__);
}
}));

(datascript.pull_api.Context.getBasis = (function (){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"db","db",-1661185010,null),new cljs.core.Symbol(null,"visitor","visitor",613665662,null)], null);
}));

(datascript.pull_api.Context.cljs$lang$type = true);

(datascript.pull_api.Context.cljs$lang$ctorPrSeq = (function (this__5346__auto__){
return (new cljs.core.List(null,"datascript.pull-api/Context",null,(1),null));
}));

(datascript.pull_api.Context.cljs$lang$ctorPrWriter = (function (this__5346__auto__,writer__5347__auto__){
return cljs.core._write(writer__5347__auto__,"datascript.pull-api/Context");
}));

/**
 * Positional factory function for datascript.pull-api/Context.
 */
datascript.pull_api.__GT_Context = (function datascript$pull_api$__GT_Context(db,visitor){
return (new datascript.pull_api.Context(db,visitor,null,null,null));
});

/**
 * Factory function for datascript.pull-api/Context, taking a map of keywords to field values.
 */
datascript.pull_api.map__GT_Context = (function datascript$pull_api$map__GT_Context(G__51652){
var extmap__5342__auto__ = (function (){var G__51716 = cljs.core.dissoc.cljs$core$IFn$_invoke$arity$variadic(G__51652,new cljs.core.Keyword(null,"db","db",993250759),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"visitor","visitor",-1026865865)], 0));
if(cljs.core.record_QMARK_(G__51652)){
return cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,G__51716);
} else {
return G__51716;
}
})();
return (new datascript.pull_api.Context(new cljs.core.Keyword(null,"db","db",993250759).cljs$core$IFn$_invoke$arity$1(G__51652),new cljs.core.Keyword(null,"visitor","visitor",-1026865865).cljs$core$IFn$_invoke$arity$1(G__51652),null,cljs.core.not_empty(extmap__5342__auto__),null));
});

datascript.pull_api.visit = (function datascript$pull_api$visit(context,pattern,e,a,v){
var temp__5808__auto__ = context.visitor;
if((temp__5808__auto__ == null)){
return null;
} else {
var visitor = temp__5808__auto__;
return (visitor.cljs$core$IFn$_invoke$arity$4 ? visitor.cljs$core$IFn$_invoke$arity$4(pattern,e,a,v) : visitor.call(null,pattern,e,a,v));
}
});

/**
 * @interface
 */
datascript.pull_api.IFrame = function(){};

var datascript$pull_api$IFrame$_merge$dyn_53010 = (function (this$,result){
var x__5350__auto__ = (((this$ == null))?null:this$);
var m__5351__auto__ = (datascript.pull_api._merge[goog.typeOf(x__5350__auto__)]);
if((!((m__5351__auto__ == null)))){
return (m__5351__auto__.cljs$core$IFn$_invoke$arity$2 ? m__5351__auto__.cljs$core$IFn$_invoke$arity$2(this$,result) : m__5351__auto__.call(null,this$,result));
} else {
var m__5349__auto__ = (datascript.pull_api._merge["_"]);
if((!((m__5349__auto__ == null)))){
return (m__5349__auto__.cljs$core$IFn$_invoke$arity$2 ? m__5349__auto__.cljs$core$IFn$_invoke$arity$2(this$,result) : m__5349__auto__.call(null,this$,result));
} else {
throw cljs.core.missing_protocol("IFrame.-merge",this$);
}
}
});
datascript.pull_api._merge = (function datascript$pull_api$_merge(this$,result){
if((((!((this$ == null)))) && ((!((this$.datascript$pull_api$IFrame$_merge$arity$2 == null)))))){
return this$.datascript$pull_api$IFrame$_merge$arity$2(this$,result);
} else {
return datascript$pull_api$IFrame$_merge$dyn_53010(this$,result);
}
});

var datascript$pull_api$IFrame$_run$dyn_53014 = (function (this$,context){
var x__5350__auto__ = (((this$ == null))?null:this$);
var m__5351__auto__ = (datascript.pull_api._run[goog.typeOf(x__5350__auto__)]);
if((!((m__5351__auto__ == null)))){
return (m__5351__auto__.cljs$core$IFn$_invoke$arity$2 ? m__5351__auto__.cljs$core$IFn$_invoke$arity$2(this$,context) : m__5351__auto__.call(null,this$,context));
} else {
var m__5349__auto__ = (datascript.pull_api._run["_"]);
if((!((m__5349__auto__ == null)))){
return (m__5349__auto__.cljs$core$IFn$_invoke$arity$2 ? m__5349__auto__.cljs$core$IFn$_invoke$arity$2(this$,context) : m__5349__auto__.call(null,this$,context));
} else {
throw cljs.core.missing_protocol("IFrame.-run",this$);
}
}
});
datascript.pull_api._run = (function datascript$pull_api$_run(this$,context){
if((((!((this$ == null)))) && ((!((this$.datascript$pull_api$IFrame$_run$arity$2 == null)))))){
return this$.datascript$pull_api$IFrame$_run$arity$2(this$,context);
} else {
return datascript$pull_api$IFrame$_run$dyn_53014(this$,context);
}
});

var datascript$pull_api$IFrame$_str$dyn_53018 = (function (this$){
var x__5350__auto__ = (((this$ == null))?null:this$);
var m__5351__auto__ = (datascript.pull_api._str[goog.typeOf(x__5350__auto__)]);
if((!((m__5351__auto__ == null)))){
return (m__5351__auto__.cljs$core$IFn$_invoke$arity$1 ? m__5351__auto__.cljs$core$IFn$_invoke$arity$1(this$) : m__5351__auto__.call(null,this$));
} else {
var m__5349__auto__ = (datascript.pull_api._str["_"]);
if((!((m__5349__auto__ == null)))){
return (m__5349__auto__.cljs$core$IFn$_invoke$arity$1 ? m__5349__auto__.cljs$core$IFn$_invoke$arity$1(this$) : m__5349__auto__.call(null,this$));
} else {
throw cljs.core.missing_protocol("IFrame.-str",this$);
}
}
});
datascript.pull_api._str = (function datascript$pull_api$_str(this$){
if((((!((this$ == null)))) && ((!((this$.datascript$pull_api$IFrame$_str$arity$1 == null)))))){
return this$.datascript$pull_api$IFrame$_str$arity$1(this$);
} else {
return datascript$pull_api$IFrame$_str$dyn_53018(this$);
}
});

datascript.pull_api.attr_str = (function datascript$pull_api$attr_str(attr){
var or__5002__auto__ = new cljs.core.Keyword(null,"as","as",1148689641).cljs$core$IFn$_invoke$arity$1(attr);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword(null,"name","name",1843675177).cljs$core$IFn$_invoke$arity$1(attr);
}
});

/**
* @constructor
 * @implements {cljs.core.IRecord}
 * @implements {datascript.pull_api.IFrame}
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
datascript.pull_api.ResultFrame = (function (value,datoms,__meta,__extmap,__hash){
this.value = value;
this.datoms = datoms;
this.__meta = __meta;
this.__extmap = __extmap;
this.__hash = __hash;
this.cljs$lang$protocol_mask$partition0$ = 2230716170;
this.cljs$lang$protocol_mask$partition1$ = 139264;
});
(datascript.pull_api.ResultFrame.prototype.cljs$core$ILookup$_lookup$arity$2 = (function (this__5300__auto__,k__5301__auto__){
var self__ = this;
var this__5300__auto____$1 = this;
return this__5300__auto____$1.cljs$core$ILookup$_lookup$arity$3(null,k__5301__auto__,null);
}));

(datascript.pull_api.ResultFrame.prototype.cljs$core$ILookup$_lookup$arity$3 = (function (this__5302__auto__,k51762,else__5303__auto__){
var self__ = this;
var this__5302__auto____$1 = this;
var G__51776 = k51762;
var G__51776__$1 = (((G__51776 instanceof cljs.core.Keyword))?G__51776.fqn:null);
switch (G__51776__$1) {
case "value":
return self__.value;

break;
case "datoms":
return self__.datoms;

break;
default:
return cljs.core.get.cljs$core$IFn$_invoke$arity$3(self__.__extmap,k51762,else__5303__auto__);

}
}));

(datascript.pull_api.ResultFrame.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = (function (this__5320__auto__,f__5321__auto__,init__5322__auto__){
var self__ = this;
var this__5320__auto____$1 = this;
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (ret__5323__auto__,p__51781){
var vec__51782 = p__51781;
var k__5324__auto__ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__51782,(0),null);
var v__5325__auto__ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__51782,(1),null);
return (f__5321__auto__.cljs$core$IFn$_invoke$arity$3 ? f__5321__auto__.cljs$core$IFn$_invoke$arity$3(ret__5323__auto__,k__5324__auto__,v__5325__auto__) : f__5321__auto__.call(null,ret__5323__auto__,k__5324__auto__,v__5325__auto__));
}),init__5322__auto__,this__5320__auto____$1);
}));

(datascript.pull_api.ResultFrame.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = (function (this__5315__auto__,writer__5316__auto__,opts__5317__auto__){
var self__ = this;
var this__5315__auto____$1 = this;
var pr_pair__5318__auto__ = (function (keyval__5319__auto__){
return cljs.core.pr_sequential_writer(writer__5316__auto__,cljs.core.pr_writer,""," ","",opts__5317__auto__,keyval__5319__auto__);
});
return cljs.core.pr_sequential_writer(writer__5316__auto__,pr_pair__5318__auto__,"#datascript.pull-api.ResultFrame{",", ","}",opts__5317__auto__,cljs.core.concat.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [(new cljs.core.PersistentVector(null,2,(5),cljs.core.PersistentVector.EMPTY_NODE,[new cljs.core.Keyword(null,"value","value",305978217),self__.value],null)),(new cljs.core.PersistentVector(null,2,(5),cljs.core.PersistentVector.EMPTY_NODE,[new cljs.core.Keyword(null,"datoms","datoms",-290874434),self__.datoms],null))], null),self__.__extmap));
}));

(datascript.pull_api.ResultFrame.prototype.cljs$core$IIterable$_iterator$arity$1 = (function (G__51761){
var self__ = this;
var G__51761__$1 = this;
return (new cljs.core.RecordIter((0),G__51761__$1,2,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"value","value",305978217),new cljs.core.Keyword(null,"datoms","datoms",-290874434)], null),(cljs.core.truth_(self__.__extmap)?cljs.core._iterator(self__.__extmap):cljs.core.nil_iter())));
}));

(datascript.pull_api.ResultFrame.prototype.cljs$core$IMeta$_meta$arity$1 = (function (this__5298__auto__){
var self__ = this;
var this__5298__auto____$1 = this;
return self__.__meta;
}));

(datascript.pull_api.ResultFrame.prototype.cljs$core$ICloneable$_clone$arity$1 = (function (this__5295__auto__){
var self__ = this;
var this__5295__auto____$1 = this;
return (new datascript.pull_api.ResultFrame(self__.value,self__.datoms,self__.__meta,self__.__extmap,self__.__hash));
}));

(datascript.pull_api.ResultFrame.prototype.cljs$core$ICounted$_count$arity$1 = (function (this__5304__auto__){
var self__ = this;
var this__5304__auto____$1 = this;
return (2 + cljs.core.count(self__.__extmap));
}));

(datascript.pull_api.ResultFrame.prototype.cljs$core$IHash$_hash$arity$1 = (function (this__5296__auto__){
var self__ = this;
var this__5296__auto____$1 = this;
var h__5111__auto__ = self__.__hash;
if((!((h__5111__auto__ == null)))){
return h__5111__auto__;
} else {
var h__5111__auto____$1 = (function (coll__5297__auto__){
return (836381841 ^ cljs.core.hash_unordered_coll(coll__5297__auto__));
})(this__5296__auto____$1);
(self__.__hash = h__5111__auto____$1);

return h__5111__auto____$1;
}
}));

(datascript.pull_api.ResultFrame.prototype.cljs$core$IEquiv$_equiv$arity$2 = (function (this51763,other51764){
var self__ = this;
var this51763__$1 = this;
return (((!((other51764 == null)))) && ((((this51763__$1.constructor === other51764.constructor)) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(this51763__$1.value,other51764.value)) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(this51763__$1.datoms,other51764.datoms)) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(this51763__$1.__extmap,other51764.__extmap)))))))));
}));

(datascript.pull_api.ResultFrame.prototype.cljs$core$IMap$_dissoc$arity$2 = (function (this__5310__auto__,k__5311__auto__){
var self__ = this;
var this__5310__auto____$1 = this;
if(cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"value","value",305978217),null,new cljs.core.Keyword(null,"datoms","datoms",-290874434),null], null), null),k__5311__auto__)){
return cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(cljs.core._with_meta(cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,this__5310__auto____$1),self__.__meta),k__5311__auto__);
} else {
return (new datascript.pull_api.ResultFrame(self__.value,self__.datoms,self__.__meta,cljs.core.not_empty(cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(self__.__extmap,k__5311__auto__)),null));
}
}));

(datascript.pull_api.ResultFrame.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = (function (this__5307__auto__,k51762){
var self__ = this;
var this__5307__auto____$1 = this;
var G__51805 = k51762;
var G__51805__$1 = (((G__51805 instanceof cljs.core.Keyword))?G__51805.fqn:null);
switch (G__51805__$1) {
case "value":
case "datoms":
return true;

break;
default:
return cljs.core.contains_QMARK_(self__.__extmap,k51762);

}
}));

(datascript.pull_api.ResultFrame.prototype.cljs$core$IAssociative$_assoc$arity$3 = (function (this__5308__auto__,k__5309__auto__,G__51761){
var self__ = this;
var this__5308__auto____$1 = this;
var pred__51808 = cljs.core.keyword_identical_QMARK_;
var expr__51809 = k__5309__auto__;
if(cljs.core.truth_((pred__51808.cljs$core$IFn$_invoke$arity$2 ? pred__51808.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"value","value",305978217),expr__51809) : pred__51808.call(null,new cljs.core.Keyword(null,"value","value",305978217),expr__51809)))){
return (new datascript.pull_api.ResultFrame(G__51761,self__.datoms,self__.__meta,self__.__extmap,null));
} else {
if(cljs.core.truth_((pred__51808.cljs$core$IFn$_invoke$arity$2 ? pred__51808.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"datoms","datoms",-290874434),expr__51809) : pred__51808.call(null,new cljs.core.Keyword(null,"datoms","datoms",-290874434),expr__51809)))){
return (new datascript.pull_api.ResultFrame(self__.value,G__51761,self__.__meta,self__.__extmap,null));
} else {
return (new datascript.pull_api.ResultFrame(self__.value,self__.datoms,self__.__meta,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(self__.__extmap,k__5309__auto__,G__51761),null));
}
}
}));

(datascript.pull_api.ResultFrame.prototype.cljs$core$ISeqable$_seq$arity$1 = (function (this__5313__auto__){
var self__ = this;
var this__5313__auto____$1 = this;
return cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [(new cljs.core.MapEntry(new cljs.core.Keyword(null,"value","value",305978217),self__.value,null)),(new cljs.core.MapEntry(new cljs.core.Keyword(null,"datoms","datoms",-290874434),self__.datoms,null))], null),self__.__extmap));
}));

(datascript.pull_api.ResultFrame.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = (function (this__5299__auto__,G__51761){
var self__ = this;
var this__5299__auto____$1 = this;
return (new datascript.pull_api.ResultFrame(self__.value,self__.datoms,G__51761,self__.__extmap,self__.__hash));
}));

(datascript.pull_api.ResultFrame.prototype.cljs$core$ICollection$_conj$arity$2 = (function (this__5305__auto__,entry__5306__auto__){
var self__ = this;
var this__5305__auto____$1 = this;
if(cljs.core.vector_QMARK_(entry__5306__auto__)){
return this__5305__auto____$1.cljs$core$IAssociative$_assoc$arity$3(null,cljs.core._nth(entry__5306__auto__,(0)),cljs.core._nth(entry__5306__auto__,(1)));
} else {
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3(cljs.core._conj,this__5305__auto____$1,entry__5306__auto__);
}
}));

(datascript.pull_api.ResultFrame.prototype.datascript$pull_api$IFrame$ = cljs.core.PROTOCOL_SENTINEL);

(datascript.pull_api.ResultFrame.prototype.datascript$pull_api$IFrame$_str$arity$1 = (function (this$){
var self__ = this;
var this$__$1 = this;
return ["ResultFrame<value=",cljs.core.str.cljs$core$IFn$_invoke$arity$1(self__.value),">"].join('');
}));

(datascript.pull_api.ResultFrame.getBasis = (function (){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"value","value",1946509744,null),new cljs.core.Symbol(null,"datoms","datoms",1349657093,null)], null);
}));

(datascript.pull_api.ResultFrame.cljs$lang$type = true);

(datascript.pull_api.ResultFrame.cljs$lang$ctorPrSeq = (function (this__5346__auto__){
return (new cljs.core.List(null,"datascript.pull-api/ResultFrame",null,(1),null));
}));

(datascript.pull_api.ResultFrame.cljs$lang$ctorPrWriter = (function (this__5346__auto__,writer__5347__auto__){
return cljs.core._write(writer__5347__auto__,"datascript.pull-api/ResultFrame");
}));

/**
 * Positional factory function for datascript.pull-api/ResultFrame.
 */
datascript.pull_api.__GT_ResultFrame = (function datascript$pull_api$__GT_ResultFrame(value,datoms){
return (new datascript.pull_api.ResultFrame(value,datoms,null,null,null));
});

/**
 * Factory function for datascript.pull-api/ResultFrame, taking a map of keywords to field values.
 */
datascript.pull_api.map__GT_ResultFrame = (function datascript$pull_api$map__GT_ResultFrame(G__51768){
var extmap__5342__auto__ = (function (){var G__51824 = cljs.core.dissoc.cljs$core$IFn$_invoke$arity$variadic(G__51768,new cljs.core.Keyword(null,"value","value",305978217),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"datoms","datoms",-290874434)], 0));
if(cljs.core.record_QMARK_(G__51768)){
return cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,G__51824);
} else {
return G__51824;
}
})();
return (new datascript.pull_api.ResultFrame(new cljs.core.Keyword(null,"value","value",305978217).cljs$core$IFn$_invoke$arity$1(G__51768),new cljs.core.Keyword(null,"datoms","datoms",-290874434).cljs$core$IFn$_invoke$arity$1(G__51768),null,cljs.core.not_empty(extmap__5342__auto__),null));
});


/**
* @constructor
 * @implements {cljs.core.IRecord}
 * @implements {datascript.pull_api.IFrame}
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
datascript.pull_api.MultivalAttrFrame = (function (acc,attr,datoms,__meta,__extmap,__hash){
this.acc = acc;
this.attr = attr;
this.datoms = datoms;
this.__meta = __meta;
this.__extmap = __extmap;
this.__hash = __hash;
this.cljs$lang$protocol_mask$partition0$ = 2230716170;
this.cljs$lang$protocol_mask$partition1$ = 139264;
});
(datascript.pull_api.MultivalAttrFrame.prototype.cljs$core$ILookup$_lookup$arity$2 = (function (this__5300__auto__,k__5301__auto__){
var self__ = this;
var this__5300__auto____$1 = this;
return this__5300__auto____$1.cljs$core$ILookup$_lookup$arity$3(null,k__5301__auto__,null);
}));

(datascript.pull_api.MultivalAttrFrame.prototype.cljs$core$ILookup$_lookup$arity$3 = (function (this__5302__auto__,k51836,else__5303__auto__){
var self__ = this;
var this__5302__auto____$1 = this;
var G__51856 = k51836;
var G__51856__$1 = (((G__51856 instanceof cljs.core.Keyword))?G__51856.fqn:null);
switch (G__51856__$1) {
case "acc":
return self__.acc;

break;
case "attr":
return self__.attr;

break;
case "datoms":
return self__.datoms;

break;
default:
return cljs.core.get.cljs$core$IFn$_invoke$arity$3(self__.__extmap,k51836,else__5303__auto__);

}
}));

(datascript.pull_api.MultivalAttrFrame.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = (function (this__5320__auto__,f__5321__auto__,init__5322__auto__){
var self__ = this;
var this__5320__auto____$1 = this;
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (ret__5323__auto__,p__51863){
var vec__51868 = p__51863;
var k__5324__auto__ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__51868,(0),null);
var v__5325__auto__ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__51868,(1),null);
return (f__5321__auto__.cljs$core$IFn$_invoke$arity$3 ? f__5321__auto__.cljs$core$IFn$_invoke$arity$3(ret__5323__auto__,k__5324__auto__,v__5325__auto__) : f__5321__auto__.call(null,ret__5323__auto__,k__5324__auto__,v__5325__auto__));
}),init__5322__auto__,this__5320__auto____$1);
}));

(datascript.pull_api.MultivalAttrFrame.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = (function (this__5315__auto__,writer__5316__auto__,opts__5317__auto__){
var self__ = this;
var this__5315__auto____$1 = this;
var pr_pair__5318__auto__ = (function (keyval__5319__auto__){
return cljs.core.pr_sequential_writer(writer__5316__auto__,cljs.core.pr_writer,""," ","",opts__5317__auto__,keyval__5319__auto__);
});
return cljs.core.pr_sequential_writer(writer__5316__auto__,pr_pair__5318__auto__,"#datascript.pull-api.MultivalAttrFrame{",", ","}",opts__5317__auto__,cljs.core.concat.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [(new cljs.core.PersistentVector(null,2,(5),cljs.core.PersistentVector.EMPTY_NODE,[new cljs.core.Keyword(null,"acc","acc",838566312),self__.acc],null)),(new cljs.core.PersistentVector(null,2,(5),cljs.core.PersistentVector.EMPTY_NODE,[new cljs.core.Keyword(null,"attr","attr",-604132353),self__.attr],null)),(new cljs.core.PersistentVector(null,2,(5),cljs.core.PersistentVector.EMPTY_NODE,[new cljs.core.Keyword(null,"datoms","datoms",-290874434),self__.datoms],null))], null),self__.__extmap));
}));

(datascript.pull_api.MultivalAttrFrame.prototype.cljs$core$IIterable$_iterator$arity$1 = (function (G__51835){
var self__ = this;
var G__51835__$1 = this;
return (new cljs.core.RecordIter((0),G__51835__$1,3,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"acc","acc",838566312),new cljs.core.Keyword(null,"attr","attr",-604132353),new cljs.core.Keyword(null,"datoms","datoms",-290874434)], null),(cljs.core.truth_(self__.__extmap)?cljs.core._iterator(self__.__extmap):cljs.core.nil_iter())));
}));

(datascript.pull_api.MultivalAttrFrame.prototype.cljs$core$IMeta$_meta$arity$1 = (function (this__5298__auto__){
var self__ = this;
var this__5298__auto____$1 = this;
return self__.__meta;
}));

(datascript.pull_api.MultivalAttrFrame.prototype.cljs$core$ICloneable$_clone$arity$1 = (function (this__5295__auto__){
var self__ = this;
var this__5295__auto____$1 = this;
return (new datascript.pull_api.MultivalAttrFrame(self__.acc,self__.attr,self__.datoms,self__.__meta,self__.__extmap,self__.__hash));
}));

(datascript.pull_api.MultivalAttrFrame.prototype.cljs$core$ICounted$_count$arity$1 = (function (this__5304__auto__){
var self__ = this;
var this__5304__auto____$1 = this;
return (3 + cljs.core.count(self__.__extmap));
}));

(datascript.pull_api.MultivalAttrFrame.prototype.cljs$core$IHash$_hash$arity$1 = (function (this__5296__auto__){
var self__ = this;
var this__5296__auto____$1 = this;
var h__5111__auto__ = self__.__hash;
if((!((h__5111__auto__ == null)))){
return h__5111__auto__;
} else {
var h__5111__auto____$1 = (function (coll__5297__auto__){
return (1829867699 ^ cljs.core.hash_unordered_coll(coll__5297__auto__));
})(this__5296__auto____$1);
(self__.__hash = h__5111__auto____$1);

return h__5111__auto____$1;
}
}));

(datascript.pull_api.MultivalAttrFrame.prototype.cljs$core$IEquiv$_equiv$arity$2 = (function (this51837,other51838){
var self__ = this;
var this51837__$1 = this;
return (((!((other51838 == null)))) && ((((this51837__$1.constructor === other51838.constructor)) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(this51837__$1.acc,other51838.acc)) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(this51837__$1.attr,other51838.attr)) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(this51837__$1.datoms,other51838.datoms)) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(this51837__$1.__extmap,other51838.__extmap)))))))))));
}));

(datascript.pull_api.MultivalAttrFrame.prototype.cljs$core$IMap$_dissoc$arity$2 = (function (this__5310__auto__,k__5311__auto__){
var self__ = this;
var this__5310__auto____$1 = this;
if(cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"acc","acc",838566312),null,new cljs.core.Keyword(null,"datoms","datoms",-290874434),null,new cljs.core.Keyword(null,"attr","attr",-604132353),null], null), null),k__5311__auto__)){
return cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(cljs.core._with_meta(cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,this__5310__auto____$1),self__.__meta),k__5311__auto__);
} else {
return (new datascript.pull_api.MultivalAttrFrame(self__.acc,self__.attr,self__.datoms,self__.__meta,cljs.core.not_empty(cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(self__.__extmap,k__5311__auto__)),null));
}
}));

(datascript.pull_api.MultivalAttrFrame.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = (function (this__5307__auto__,k51836){
var self__ = this;
var this__5307__auto____$1 = this;
var G__51893 = k51836;
var G__51893__$1 = (((G__51893 instanceof cljs.core.Keyword))?G__51893.fqn:null);
switch (G__51893__$1) {
case "acc":
case "attr":
case "datoms":
return true;

break;
default:
return cljs.core.contains_QMARK_(self__.__extmap,k51836);

}
}));

(datascript.pull_api.MultivalAttrFrame.prototype.cljs$core$IAssociative$_assoc$arity$3 = (function (this__5308__auto__,k__5309__auto__,G__51835){
var self__ = this;
var this__5308__auto____$1 = this;
var pred__51896 = cljs.core.keyword_identical_QMARK_;
var expr__51897 = k__5309__auto__;
if(cljs.core.truth_((pred__51896.cljs$core$IFn$_invoke$arity$2 ? pred__51896.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"acc","acc",838566312),expr__51897) : pred__51896.call(null,new cljs.core.Keyword(null,"acc","acc",838566312),expr__51897)))){
return (new datascript.pull_api.MultivalAttrFrame(G__51835,self__.attr,self__.datoms,self__.__meta,self__.__extmap,null));
} else {
if(cljs.core.truth_((pred__51896.cljs$core$IFn$_invoke$arity$2 ? pred__51896.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"attr","attr",-604132353),expr__51897) : pred__51896.call(null,new cljs.core.Keyword(null,"attr","attr",-604132353),expr__51897)))){
return (new datascript.pull_api.MultivalAttrFrame(self__.acc,G__51835,self__.datoms,self__.__meta,self__.__extmap,null));
} else {
if(cljs.core.truth_((pred__51896.cljs$core$IFn$_invoke$arity$2 ? pred__51896.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"datoms","datoms",-290874434),expr__51897) : pred__51896.call(null,new cljs.core.Keyword(null,"datoms","datoms",-290874434),expr__51897)))){
return (new datascript.pull_api.MultivalAttrFrame(self__.acc,self__.attr,G__51835,self__.__meta,self__.__extmap,null));
} else {
return (new datascript.pull_api.MultivalAttrFrame(self__.acc,self__.attr,self__.datoms,self__.__meta,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(self__.__extmap,k__5309__auto__,G__51835),null));
}
}
}
}));

(datascript.pull_api.MultivalAttrFrame.prototype.cljs$core$ISeqable$_seq$arity$1 = (function (this__5313__auto__){
var self__ = this;
var this__5313__auto____$1 = this;
return cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [(new cljs.core.MapEntry(new cljs.core.Keyword(null,"acc","acc",838566312),self__.acc,null)),(new cljs.core.MapEntry(new cljs.core.Keyword(null,"attr","attr",-604132353),self__.attr,null)),(new cljs.core.MapEntry(new cljs.core.Keyword(null,"datoms","datoms",-290874434),self__.datoms,null))], null),self__.__extmap));
}));

(datascript.pull_api.MultivalAttrFrame.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = (function (this__5299__auto__,G__51835){
var self__ = this;
var this__5299__auto____$1 = this;
return (new datascript.pull_api.MultivalAttrFrame(self__.acc,self__.attr,self__.datoms,G__51835,self__.__extmap,self__.__hash));
}));

(datascript.pull_api.MultivalAttrFrame.prototype.cljs$core$ICollection$_conj$arity$2 = (function (this__5305__auto__,entry__5306__auto__){
var self__ = this;
var this__5305__auto____$1 = this;
if(cljs.core.vector_QMARK_(entry__5306__auto__)){
return this__5305__auto____$1.cljs$core$IAssociative$_assoc$arity$3(null,cljs.core._nth(entry__5306__auto__,(0)),cljs.core._nth(entry__5306__auto__,(1)));
} else {
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3(cljs.core._conj,this__5305__auto____$1,entry__5306__auto__);
}
}));

(datascript.pull_api.MultivalAttrFrame.prototype.datascript$pull_api$IFrame$ = cljs.core.PROTOCOL_SENTINEL);

(datascript.pull_api.MultivalAttrFrame.prototype.datascript$pull_api$IFrame$_run$arity$2 = (function (this$,context){
var self__ = this;
var this$__$1 = this;
var acc__$1 = self__.acc;
var datoms__$1 = self__.datoms;
while(true){
var datom = datascript.pull_api.first_seq(datoms__$1);
if((((datom == null)) || (cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(datom.a,self__.attr.name)))){
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [(new datascript.pull_api.ResultFrame(cljs.core.not_empty(cljs.core.persistent_BANG_(acc__$1)),(function (){var or__5002__auto__ = datoms__$1;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.List.EMPTY;
}
})(),null,null,null))], null);
} else {
if(cljs.core.truth_((function (){var and__5000__auto__ = self__.attr.limit;
if(cljs.core.truth_(and__5000__auto__)){
return (((cljs.core.count(acc__$1) >= self__.attr.limit)) && (true));
} else {
return and__5000__auto__;
}
})())){
var datoms__$2 = datoms__$1;
while(true){
var datom__$1 = datascript.pull_api.first_seq(datoms__$2);
if((((datom__$1 == null)) || (cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(datom__$1.a,self__.attr.name)))){
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [(new datascript.pull_api.ResultFrame(cljs.core.persistent_BANG_(acc__$1),(function (){var or__5002__auto__ = datoms__$2;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.List.EMPTY;
}
})(),null,null,null))], null);
} else {
var G__53046 = datascript.pull_api.next_seq(datoms__$2);
datoms__$2 = G__53046;
continue;
}
break;
}
} else {
var G__53047 = cljs.core.conj_BANG_.cljs$core$IFn$_invoke$arity$2(acc__$1,datom.v);
var G__53048 = datascript.pull_api.next_seq(datoms__$1);
acc__$1 = G__53047;
datoms__$1 = G__53048;
continue;

}
}
break;
}
}));

(datascript.pull_api.MultivalAttrFrame.prototype.datascript$pull_api$IFrame$_str$arity$1 = (function (this$){
var self__ = this;
var this$__$1 = this;
return ["MultivalAttrFrame<attr=",cljs.core.str.cljs$core$IFn$_invoke$arity$1(datascript.pull_api.attr_str(self__.attr)),">"].join('');
}));

(datascript.pull_api.MultivalAttrFrame.getBasis = (function (){
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"acc","acc",-1815869457,null),cljs.core.with_meta(new cljs.core.Symbol(null,"attr","attr",1036399174,null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),new cljs.core.Symbol(null,"PullAttr","PullAttr",1557473458,null)], null)),new cljs.core.Symbol(null,"datoms","datoms",1349657093,null)], null);
}));

(datascript.pull_api.MultivalAttrFrame.cljs$lang$type = true);

(datascript.pull_api.MultivalAttrFrame.cljs$lang$ctorPrSeq = (function (this__5346__auto__){
return (new cljs.core.List(null,"datascript.pull-api/MultivalAttrFrame",null,(1),null));
}));

(datascript.pull_api.MultivalAttrFrame.cljs$lang$ctorPrWriter = (function (this__5346__auto__,writer__5347__auto__){
return cljs.core._write(writer__5347__auto__,"datascript.pull-api/MultivalAttrFrame");
}));

/**
 * Positional factory function for datascript.pull-api/MultivalAttrFrame.
 */
datascript.pull_api.__GT_MultivalAttrFrame = (function datascript$pull_api$__GT_MultivalAttrFrame(acc,attr,datoms){
return (new datascript.pull_api.MultivalAttrFrame(acc,attr,datoms,null,null,null));
});

/**
 * Factory function for datascript.pull-api/MultivalAttrFrame, taking a map of keywords to field values.
 */
datascript.pull_api.map__GT_MultivalAttrFrame = (function datascript$pull_api$map__GT_MultivalAttrFrame(G__51840){
var extmap__5342__auto__ = (function (){var G__51913 = cljs.core.dissoc.cljs$core$IFn$_invoke$arity$variadic(G__51840,new cljs.core.Keyword(null,"acc","acc",838566312),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"attr","attr",-604132353),new cljs.core.Keyword(null,"datoms","datoms",-290874434)], 0));
if(cljs.core.record_QMARK_(G__51840)){
return cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,G__51913);
} else {
return G__51913;
}
})();
return (new datascript.pull_api.MultivalAttrFrame(new cljs.core.Keyword(null,"acc","acc",838566312).cljs$core$IFn$_invoke$arity$1(G__51840),new cljs.core.Keyword(null,"attr","attr",-604132353).cljs$core$IFn$_invoke$arity$1(G__51840),new cljs.core.Keyword(null,"datoms","datoms",-290874434).cljs$core$IFn$_invoke$arity$1(G__51840),null,cljs.core.not_empty(extmap__5342__auto__),null));
});


/**
* @constructor
 * @implements {cljs.core.IRecord}
 * @implements {datascript.pull_api.IFrame}
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
datascript.pull_api.MultivalRefAttrFrame = (function (seen,recursion_limits,acc,pattern,attr,datoms,__meta,__extmap,__hash){
this.seen = seen;
this.recursion_limits = recursion_limits;
this.acc = acc;
this.pattern = pattern;
this.attr = attr;
this.datoms = datoms;
this.__meta = __meta;
this.__extmap = __extmap;
this.__hash = __hash;
this.cljs$lang$protocol_mask$partition0$ = 2230716170;
this.cljs$lang$protocol_mask$partition1$ = 139264;
});
(datascript.pull_api.MultivalRefAttrFrame.prototype.cljs$core$ILookup$_lookup$arity$2 = (function (this__5300__auto__,k__5301__auto__){
var self__ = this;
var this__5300__auto____$1 = this;
return this__5300__auto____$1.cljs$core$ILookup$_lookup$arity$3(null,k__5301__auto__,null);
}));

(datascript.pull_api.MultivalRefAttrFrame.prototype.cljs$core$ILookup$_lookup$arity$3 = (function (this__5302__auto__,k51918,else__5303__auto__){
var self__ = this;
var this__5302__auto____$1 = this;
var G__51941 = k51918;
var G__51941__$1 = (((G__51941 instanceof cljs.core.Keyword))?G__51941.fqn:null);
switch (G__51941__$1) {
case "seen":
return self__.seen;

break;
case "recursion-limits":
return self__.recursion_limits;

break;
case "acc":
return self__.acc;

break;
case "pattern":
return self__.pattern;

break;
case "attr":
return self__.attr;

break;
case "datoms":
return self__.datoms;

break;
default:
return cljs.core.get.cljs$core$IFn$_invoke$arity$3(self__.__extmap,k51918,else__5303__auto__);

}
}));

(datascript.pull_api.MultivalRefAttrFrame.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = (function (this__5320__auto__,f__5321__auto__,init__5322__auto__){
var self__ = this;
var this__5320__auto____$1 = this;
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (ret__5323__auto__,p__51951){
var vec__51952 = p__51951;
var k__5324__auto__ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__51952,(0),null);
var v__5325__auto__ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__51952,(1),null);
return (f__5321__auto__.cljs$core$IFn$_invoke$arity$3 ? f__5321__auto__.cljs$core$IFn$_invoke$arity$3(ret__5323__auto__,k__5324__auto__,v__5325__auto__) : f__5321__auto__.call(null,ret__5323__auto__,k__5324__auto__,v__5325__auto__));
}),init__5322__auto__,this__5320__auto____$1);
}));

(datascript.pull_api.MultivalRefAttrFrame.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = (function (this__5315__auto__,writer__5316__auto__,opts__5317__auto__){
var self__ = this;
var this__5315__auto____$1 = this;
var pr_pair__5318__auto__ = (function (keyval__5319__auto__){
return cljs.core.pr_sequential_writer(writer__5316__auto__,cljs.core.pr_writer,""," ","",opts__5317__auto__,keyval__5319__auto__);
});
return cljs.core.pr_sequential_writer(writer__5316__auto__,pr_pair__5318__auto__,"#datascript.pull-api.MultivalRefAttrFrame{",", ","}",opts__5317__auto__,cljs.core.concat.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 6, 5, cljs.core.PersistentVector.EMPTY_NODE, [(new cljs.core.PersistentVector(null,2,(5),cljs.core.PersistentVector.EMPTY_NODE,[new cljs.core.Keyword(null,"seen","seen",-518999789),self__.seen],null)),(new cljs.core.PersistentVector(null,2,(5),cljs.core.PersistentVector.EMPTY_NODE,[new cljs.core.Keyword(null,"recursion-limits","recursion-limits",1762857814),self__.recursion_limits],null)),(new cljs.core.PersistentVector(null,2,(5),cljs.core.PersistentVector.EMPTY_NODE,[new cljs.core.Keyword(null,"acc","acc",838566312),self__.acc],null)),(new cljs.core.PersistentVector(null,2,(5),cljs.core.PersistentVector.EMPTY_NODE,[new cljs.core.Keyword(null,"pattern","pattern",242135423),self__.pattern],null)),(new cljs.core.PersistentVector(null,2,(5),cljs.core.PersistentVector.EMPTY_NODE,[new cljs.core.Keyword(null,"attr","attr",-604132353),self__.attr],null)),(new cljs.core.PersistentVector(null,2,(5),cljs.core.PersistentVector.EMPTY_NODE,[new cljs.core.Keyword(null,"datoms","datoms",-290874434),self__.datoms],null))], null),self__.__extmap));
}));

(datascript.pull_api.MultivalRefAttrFrame.prototype.cljs$core$IIterable$_iterator$arity$1 = (function (G__51917){
var self__ = this;
var G__51917__$1 = this;
return (new cljs.core.RecordIter((0),G__51917__$1,6,new cljs.core.PersistentVector(null, 6, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"seen","seen",-518999789),new cljs.core.Keyword(null,"recursion-limits","recursion-limits",1762857814),new cljs.core.Keyword(null,"acc","acc",838566312),new cljs.core.Keyword(null,"pattern","pattern",242135423),new cljs.core.Keyword(null,"attr","attr",-604132353),new cljs.core.Keyword(null,"datoms","datoms",-290874434)], null),(cljs.core.truth_(self__.__extmap)?cljs.core._iterator(self__.__extmap):cljs.core.nil_iter())));
}));

(datascript.pull_api.MultivalRefAttrFrame.prototype.cljs$core$IMeta$_meta$arity$1 = (function (this__5298__auto__){
var self__ = this;
var this__5298__auto____$1 = this;
return self__.__meta;
}));

(datascript.pull_api.MultivalRefAttrFrame.prototype.cljs$core$ICloneable$_clone$arity$1 = (function (this__5295__auto__){
var self__ = this;
var this__5295__auto____$1 = this;
return (new datascript.pull_api.MultivalRefAttrFrame(self__.seen,self__.recursion_limits,self__.acc,self__.pattern,self__.attr,self__.datoms,self__.__meta,self__.__extmap,self__.__hash));
}));

(datascript.pull_api.MultivalRefAttrFrame.prototype.cljs$core$ICounted$_count$arity$1 = (function (this__5304__auto__){
var self__ = this;
var this__5304__auto____$1 = this;
return (6 + cljs.core.count(self__.__extmap));
}));

(datascript.pull_api.MultivalRefAttrFrame.prototype.cljs$core$IHash$_hash$arity$1 = (function (this__5296__auto__){
var self__ = this;
var this__5296__auto____$1 = this;
var h__5111__auto__ = self__.__hash;
if((!((h__5111__auto__ == null)))){
return h__5111__auto__;
} else {
var h__5111__auto____$1 = (function (coll__5297__auto__){
return (1769511936 ^ cljs.core.hash_unordered_coll(coll__5297__auto__));
})(this__5296__auto____$1);
(self__.__hash = h__5111__auto____$1);

return h__5111__auto____$1;
}
}));

(datascript.pull_api.MultivalRefAttrFrame.prototype.cljs$core$IEquiv$_equiv$arity$2 = (function (this51919,other51920){
var self__ = this;
var this51919__$1 = this;
return (((!((other51920 == null)))) && ((((this51919__$1.constructor === other51920.constructor)) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(this51919__$1.seen,other51920.seen)) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(this51919__$1.recursion_limits,other51920.recursion_limits)) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(this51919__$1.acc,other51920.acc)) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(this51919__$1.pattern,other51920.pattern)) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(this51919__$1.attr,other51920.attr)) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(this51919__$1.datoms,other51920.datoms)) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(this51919__$1.__extmap,other51920.__extmap)))))))))))))))));
}));

(datascript.pull_api.MultivalRefAttrFrame.prototype.cljs$core$IMap$_dissoc$arity$2 = (function (this__5310__auto__,k__5311__auto__){
var self__ = this;
var this__5310__auto____$1 = this;
if(cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 6, [new cljs.core.Keyword(null,"acc","acc",838566312),null,new cljs.core.Keyword(null,"seen","seen",-518999789),null,new cljs.core.Keyword(null,"recursion-limits","recursion-limits",1762857814),null,new cljs.core.Keyword(null,"datoms","datoms",-290874434),null,new cljs.core.Keyword(null,"pattern","pattern",242135423),null,new cljs.core.Keyword(null,"attr","attr",-604132353),null], null), null),k__5311__auto__)){
return cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(cljs.core._with_meta(cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,this__5310__auto____$1),self__.__meta),k__5311__auto__);
} else {
return (new datascript.pull_api.MultivalRefAttrFrame(self__.seen,self__.recursion_limits,self__.acc,self__.pattern,self__.attr,self__.datoms,self__.__meta,cljs.core.not_empty(cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(self__.__extmap,k__5311__auto__)),null));
}
}));

(datascript.pull_api.MultivalRefAttrFrame.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = (function (this__5307__auto__,k51918){
var self__ = this;
var this__5307__auto____$1 = this;
var G__51997 = k51918;
var G__51997__$1 = (((G__51997 instanceof cljs.core.Keyword))?G__51997.fqn:null);
switch (G__51997__$1) {
case "seen":
case "recursion-limits":
case "acc":
case "pattern":
case "attr":
case "datoms":
return true;

break;
default:
return cljs.core.contains_QMARK_(self__.__extmap,k51918);

}
}));

(datascript.pull_api.MultivalRefAttrFrame.prototype.cljs$core$IAssociative$_assoc$arity$3 = (function (this__5308__auto__,k__5309__auto__,G__51917){
var self__ = this;
var this__5308__auto____$1 = this;
var pred__52005 = cljs.core.keyword_identical_QMARK_;
var expr__52006 = k__5309__auto__;
if(cljs.core.truth_((pred__52005.cljs$core$IFn$_invoke$arity$2 ? pred__52005.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"seen","seen",-518999789),expr__52006) : pred__52005.call(null,new cljs.core.Keyword(null,"seen","seen",-518999789),expr__52006)))){
return (new datascript.pull_api.MultivalRefAttrFrame(G__51917,self__.recursion_limits,self__.acc,self__.pattern,self__.attr,self__.datoms,self__.__meta,self__.__extmap,null));
} else {
if(cljs.core.truth_((pred__52005.cljs$core$IFn$_invoke$arity$2 ? pred__52005.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"recursion-limits","recursion-limits",1762857814),expr__52006) : pred__52005.call(null,new cljs.core.Keyword(null,"recursion-limits","recursion-limits",1762857814),expr__52006)))){
return (new datascript.pull_api.MultivalRefAttrFrame(self__.seen,G__51917,self__.acc,self__.pattern,self__.attr,self__.datoms,self__.__meta,self__.__extmap,null));
} else {
if(cljs.core.truth_((pred__52005.cljs$core$IFn$_invoke$arity$2 ? pred__52005.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"acc","acc",838566312),expr__52006) : pred__52005.call(null,new cljs.core.Keyword(null,"acc","acc",838566312),expr__52006)))){
return (new datascript.pull_api.MultivalRefAttrFrame(self__.seen,self__.recursion_limits,G__51917,self__.pattern,self__.attr,self__.datoms,self__.__meta,self__.__extmap,null));
} else {
if(cljs.core.truth_((pred__52005.cljs$core$IFn$_invoke$arity$2 ? pred__52005.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"pattern","pattern",242135423),expr__52006) : pred__52005.call(null,new cljs.core.Keyword(null,"pattern","pattern",242135423),expr__52006)))){
return (new datascript.pull_api.MultivalRefAttrFrame(self__.seen,self__.recursion_limits,self__.acc,G__51917,self__.attr,self__.datoms,self__.__meta,self__.__extmap,null));
} else {
if(cljs.core.truth_((pred__52005.cljs$core$IFn$_invoke$arity$2 ? pred__52005.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"attr","attr",-604132353),expr__52006) : pred__52005.call(null,new cljs.core.Keyword(null,"attr","attr",-604132353),expr__52006)))){
return (new datascript.pull_api.MultivalRefAttrFrame(self__.seen,self__.recursion_limits,self__.acc,self__.pattern,G__51917,self__.datoms,self__.__meta,self__.__extmap,null));
} else {
if(cljs.core.truth_((pred__52005.cljs$core$IFn$_invoke$arity$2 ? pred__52005.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"datoms","datoms",-290874434),expr__52006) : pred__52005.call(null,new cljs.core.Keyword(null,"datoms","datoms",-290874434),expr__52006)))){
return (new datascript.pull_api.MultivalRefAttrFrame(self__.seen,self__.recursion_limits,self__.acc,self__.pattern,self__.attr,G__51917,self__.__meta,self__.__extmap,null));
} else {
return (new datascript.pull_api.MultivalRefAttrFrame(self__.seen,self__.recursion_limits,self__.acc,self__.pattern,self__.attr,self__.datoms,self__.__meta,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(self__.__extmap,k__5309__auto__,G__51917),null));
}
}
}
}
}
}
}));

(datascript.pull_api.MultivalRefAttrFrame.prototype.cljs$core$ISeqable$_seq$arity$1 = (function (this__5313__auto__){
var self__ = this;
var this__5313__auto____$1 = this;
return cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 6, 5, cljs.core.PersistentVector.EMPTY_NODE, [(new cljs.core.MapEntry(new cljs.core.Keyword(null,"seen","seen",-518999789),self__.seen,null)),(new cljs.core.MapEntry(new cljs.core.Keyword(null,"recursion-limits","recursion-limits",1762857814),self__.recursion_limits,null)),(new cljs.core.MapEntry(new cljs.core.Keyword(null,"acc","acc",838566312),self__.acc,null)),(new cljs.core.MapEntry(new cljs.core.Keyword(null,"pattern","pattern",242135423),self__.pattern,null)),(new cljs.core.MapEntry(new cljs.core.Keyword(null,"attr","attr",-604132353),self__.attr,null)),(new cljs.core.MapEntry(new cljs.core.Keyword(null,"datoms","datoms",-290874434),self__.datoms,null))], null),self__.__extmap));
}));

(datascript.pull_api.MultivalRefAttrFrame.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = (function (this__5299__auto__,G__51917){
var self__ = this;
var this__5299__auto____$1 = this;
return (new datascript.pull_api.MultivalRefAttrFrame(self__.seen,self__.recursion_limits,self__.acc,self__.pattern,self__.attr,self__.datoms,G__51917,self__.__extmap,self__.__hash));
}));

(datascript.pull_api.MultivalRefAttrFrame.prototype.cljs$core$ICollection$_conj$arity$2 = (function (this__5305__auto__,entry__5306__auto__){
var self__ = this;
var this__5305__auto____$1 = this;
if(cljs.core.vector_QMARK_(entry__5306__auto__)){
return this__5305__auto____$1.cljs$core$IAssociative$_assoc$arity$3(null,cljs.core._nth(entry__5306__auto__,(0)),cljs.core._nth(entry__5306__auto__,(1)));
} else {
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3(cljs.core._conj,this__5305__auto____$1,entry__5306__auto__);
}
}));

(datascript.pull_api.MultivalRefAttrFrame.prototype.datascript$pull_api$IFrame$ = cljs.core.PROTOCOL_SENTINEL);

(datascript.pull_api.MultivalRefAttrFrame.prototype.datascript$pull_api$IFrame$_merge$arity$2 = (function (this$,result){
var self__ = this;
var this$__$1 = this;
return (new datascript.pull_api.MultivalRefAttrFrame(self__.seen,self__.recursion_limits,datascript.pull_api.conj_some_BANG_(self__.acc,result.value),self__.pattern,self__.attr,datascript.pull_api.next_seq(self__.datoms),null,null,null));
}));

(datascript.pull_api.MultivalRefAttrFrame.prototype.datascript$pull_api$IFrame$_run$arity$2 = (function (this$,context){
var self__ = this;
var this$__$1 = this;
var datom = datascript.pull_api.first_seq(self__.datoms);
if((((datom == null)) || (cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(datom.a,self__.attr.name)))){
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [(new datascript.pull_api.ResultFrame(cljs.core.not_empty(cljs.core.persistent_BANG_(self__.acc)),(function (){var or__5002__auto__ = self__.datoms;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.List.EMPTY;
}
})(),null,null,null))], null);
} else {
if(cljs.core.truth_((function (){var and__5000__auto__ = self__.attr.limit;
if(cljs.core.truth_(and__5000__auto__)){
return (((cljs.core.count(self__.acc) >= self__.attr.limit)) && (true));
} else {
return and__5000__auto__;
}
})())){
var datoms__$1 = self__.datoms;
while(true){
var datom__$1 = datascript.pull_api.first_seq(datoms__$1);
if((((datom__$1 == null)) || (cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(datom__$1.a,self__.attr.name)))){
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [(new datascript.pull_api.ResultFrame(cljs.core.persistent_BANG_(self__.acc),(function (){var or__5002__auto__ = datoms__$1;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.List.EMPTY;
}
})(),null,null,null))], null);
} else {
var G__53094 = datascript.pull_api.next_seq(datoms__$1);
datoms__$1 = G__53094;
continue;
}
break;
}
} else {
var id = (cljs.core.truth_(self__.attr.reverse_QMARK_)?datom.e:datom.v);
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [this$__$1,(datascript.pull_api.ref_frame.cljs$core$IFn$_invoke$arity$6 ? datascript.pull_api.ref_frame.cljs$core$IFn$_invoke$arity$6(context,self__.seen,self__.recursion_limits,self__.pattern,self__.attr,id) : datascript.pull_api.ref_frame.call(null,context,self__.seen,self__.recursion_limits,self__.pattern,self__.attr,id))], null);

}
}
}));

(datascript.pull_api.MultivalRefAttrFrame.prototype.datascript$pull_api$IFrame$_str$arity$1 = (function (this$){
var self__ = this;
var this$__$1 = this;
return ["MultivalAttrFrame<attr=",cljs.core.str.cljs$core$IFn$_invoke$arity$1(datascript.pull_api.attr_str(self__.attr)),">"].join('');
}));

(datascript.pull_api.MultivalRefAttrFrame.getBasis = (function (){
return new cljs.core.PersistentVector(null, 6, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"seen","seen",1121531738,null),new cljs.core.Symbol(null,"recursion-limits","recursion-limits",-891577955,null),new cljs.core.Symbol(null,"acc","acc",-1815869457,null),new cljs.core.Symbol(null,"pattern","pattern",1882666950,null),cljs.core.with_meta(new cljs.core.Symbol(null,"attr","attr",1036399174,null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),new cljs.core.Symbol(null,"PullAttr","PullAttr",1557473458,null)], null)),new cljs.core.Symbol(null,"datoms","datoms",1349657093,null)], null);
}));

(datascript.pull_api.MultivalRefAttrFrame.cljs$lang$type = true);

(datascript.pull_api.MultivalRefAttrFrame.cljs$lang$ctorPrSeq = (function (this__5346__auto__){
return (new cljs.core.List(null,"datascript.pull-api/MultivalRefAttrFrame",null,(1),null));
}));

(datascript.pull_api.MultivalRefAttrFrame.cljs$lang$ctorPrWriter = (function (this__5346__auto__,writer__5347__auto__){
return cljs.core._write(writer__5347__auto__,"datascript.pull-api/MultivalRefAttrFrame");
}));

/**
 * Positional factory function for datascript.pull-api/MultivalRefAttrFrame.
 */
datascript.pull_api.__GT_MultivalRefAttrFrame = (function datascript$pull_api$__GT_MultivalRefAttrFrame(seen,recursion_limits,acc,pattern,attr,datoms){
return (new datascript.pull_api.MultivalRefAttrFrame(seen,recursion_limits,acc,pattern,attr,datoms,null,null,null));
});

/**
 * Factory function for datascript.pull-api/MultivalRefAttrFrame, taking a map of keywords to field values.
 */
datascript.pull_api.map__GT_MultivalRefAttrFrame = (function datascript$pull_api$map__GT_MultivalRefAttrFrame(G__51922){
var extmap__5342__auto__ = (function (){var G__52065 = cljs.core.dissoc.cljs$core$IFn$_invoke$arity$variadic(G__51922,new cljs.core.Keyword(null,"seen","seen",-518999789),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"recursion-limits","recursion-limits",1762857814),new cljs.core.Keyword(null,"acc","acc",838566312),new cljs.core.Keyword(null,"pattern","pattern",242135423),new cljs.core.Keyword(null,"attr","attr",-604132353),new cljs.core.Keyword(null,"datoms","datoms",-290874434)], 0));
if(cljs.core.record_QMARK_(G__51922)){
return cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,G__52065);
} else {
return G__52065;
}
})();
return (new datascript.pull_api.MultivalRefAttrFrame(new cljs.core.Keyword(null,"seen","seen",-518999789).cljs$core$IFn$_invoke$arity$1(G__51922),new cljs.core.Keyword(null,"recursion-limits","recursion-limits",1762857814).cljs$core$IFn$_invoke$arity$1(G__51922),new cljs.core.Keyword(null,"acc","acc",838566312).cljs$core$IFn$_invoke$arity$1(G__51922),new cljs.core.Keyword(null,"pattern","pattern",242135423).cljs$core$IFn$_invoke$arity$1(G__51922),new cljs.core.Keyword(null,"attr","attr",-604132353).cljs$core$IFn$_invoke$arity$1(G__51922),new cljs.core.Keyword(null,"datoms","datoms",-290874434).cljs$core$IFn$_invoke$arity$1(G__51922),null,cljs.core.not_empty(extmap__5342__auto__),null));
});


/**
* @constructor
 * @implements {cljs.core.IRecord}
 * @implements {datascript.pull_api.IFrame}
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
datascript.pull_api.AttrsFrame = (function (seen,recursion_limits,acc,pattern,attr,attrs,datoms,id,__meta,__extmap,__hash){
this.seen = seen;
this.recursion_limits = recursion_limits;
this.acc = acc;
this.pattern = pattern;
this.attr = attr;
this.attrs = attrs;
this.datoms = datoms;
this.id = id;
this.__meta = __meta;
this.__extmap = __extmap;
this.__hash = __hash;
this.cljs$lang$protocol_mask$partition0$ = 2230716170;
this.cljs$lang$protocol_mask$partition1$ = 139264;
});
(datascript.pull_api.AttrsFrame.prototype.cljs$core$ILookup$_lookup$arity$2 = (function (this__5300__auto__,k__5301__auto__){
var self__ = this;
var this__5300__auto____$1 = this;
return this__5300__auto____$1.cljs$core$ILookup$_lookup$arity$3(null,k__5301__auto__,null);
}));

(datascript.pull_api.AttrsFrame.prototype.cljs$core$ILookup$_lookup$arity$3 = (function (this__5302__auto__,k52088,else__5303__auto__){
var self__ = this;
var this__5302__auto____$1 = this;
var G__52098 = k52088;
var G__52098__$1 = (((G__52098 instanceof cljs.core.Keyword))?G__52098.fqn:null);
switch (G__52098__$1) {
case "seen":
return self__.seen;

break;
case "recursion-limits":
return self__.recursion_limits;

break;
case "acc":
return self__.acc;

break;
case "pattern":
return self__.pattern;

break;
case "attr":
return self__.attr;

break;
case "attrs":
return self__.attrs;

break;
case "datoms":
return self__.datoms;

break;
case "id":
return self__.id;

break;
default:
return cljs.core.get.cljs$core$IFn$_invoke$arity$3(self__.__extmap,k52088,else__5303__auto__);

}
}));

(datascript.pull_api.AttrsFrame.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = (function (this__5320__auto__,f__5321__auto__,init__5322__auto__){
var self__ = this;
var this__5320__auto____$1 = this;
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (ret__5323__auto__,p__52099){
var vec__52100 = p__52099;
var k__5324__auto__ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__52100,(0),null);
var v__5325__auto__ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__52100,(1),null);
return (f__5321__auto__.cljs$core$IFn$_invoke$arity$3 ? f__5321__auto__.cljs$core$IFn$_invoke$arity$3(ret__5323__auto__,k__5324__auto__,v__5325__auto__) : f__5321__auto__.call(null,ret__5323__auto__,k__5324__auto__,v__5325__auto__));
}),init__5322__auto__,this__5320__auto____$1);
}));

(datascript.pull_api.AttrsFrame.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = (function (this__5315__auto__,writer__5316__auto__,opts__5317__auto__){
var self__ = this;
var this__5315__auto____$1 = this;
var pr_pair__5318__auto__ = (function (keyval__5319__auto__){
return cljs.core.pr_sequential_writer(writer__5316__auto__,cljs.core.pr_writer,""," ","",opts__5317__auto__,keyval__5319__auto__);
});
return cljs.core.pr_sequential_writer(writer__5316__auto__,pr_pair__5318__auto__,"#datascript.pull-api.AttrsFrame{",", ","}",opts__5317__auto__,cljs.core.concat.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 8, 5, cljs.core.PersistentVector.EMPTY_NODE, [(new cljs.core.PersistentVector(null,2,(5),cljs.core.PersistentVector.EMPTY_NODE,[new cljs.core.Keyword(null,"seen","seen",-518999789),self__.seen],null)),(new cljs.core.PersistentVector(null,2,(5),cljs.core.PersistentVector.EMPTY_NODE,[new cljs.core.Keyword(null,"recursion-limits","recursion-limits",1762857814),self__.recursion_limits],null)),(new cljs.core.PersistentVector(null,2,(5),cljs.core.PersistentVector.EMPTY_NODE,[new cljs.core.Keyword(null,"acc","acc",838566312),self__.acc],null)),(new cljs.core.PersistentVector(null,2,(5),cljs.core.PersistentVector.EMPTY_NODE,[new cljs.core.Keyword(null,"pattern","pattern",242135423),self__.pattern],null)),(new cljs.core.PersistentVector(null,2,(5),cljs.core.PersistentVector.EMPTY_NODE,[new cljs.core.Keyword(null,"attr","attr",-604132353),self__.attr],null)),(new cljs.core.PersistentVector(null,2,(5),cljs.core.PersistentVector.EMPTY_NODE,[new cljs.core.Keyword(null,"attrs","attrs",-2090668713),self__.attrs],null)),(new cljs.core.PersistentVector(null,2,(5),cljs.core.PersistentVector.EMPTY_NODE,[new cljs.core.Keyword(null,"datoms","datoms",-290874434),self__.datoms],null)),(new cljs.core.PersistentVector(null,2,(5),cljs.core.PersistentVector.EMPTY_NODE,[new cljs.core.Keyword(null,"id","id",-1388402092),self__.id],null))], null),self__.__extmap));
}));

(datascript.pull_api.AttrsFrame.prototype.cljs$core$IIterable$_iterator$arity$1 = (function (G__52087){
var self__ = this;
var G__52087__$1 = this;
return (new cljs.core.RecordIter((0),G__52087__$1,8,new cljs.core.PersistentVector(null, 8, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"seen","seen",-518999789),new cljs.core.Keyword(null,"recursion-limits","recursion-limits",1762857814),new cljs.core.Keyword(null,"acc","acc",838566312),new cljs.core.Keyword(null,"pattern","pattern",242135423),new cljs.core.Keyword(null,"attr","attr",-604132353),new cljs.core.Keyword(null,"attrs","attrs",-2090668713),new cljs.core.Keyword(null,"datoms","datoms",-290874434),new cljs.core.Keyword(null,"id","id",-1388402092)], null),(cljs.core.truth_(self__.__extmap)?cljs.core._iterator(self__.__extmap):cljs.core.nil_iter())));
}));

(datascript.pull_api.AttrsFrame.prototype.cljs$core$IMeta$_meta$arity$1 = (function (this__5298__auto__){
var self__ = this;
var this__5298__auto____$1 = this;
return self__.__meta;
}));

(datascript.pull_api.AttrsFrame.prototype.cljs$core$ICloneable$_clone$arity$1 = (function (this__5295__auto__){
var self__ = this;
var this__5295__auto____$1 = this;
return (new datascript.pull_api.AttrsFrame(self__.seen,self__.recursion_limits,self__.acc,self__.pattern,self__.attr,self__.attrs,self__.datoms,self__.id,self__.__meta,self__.__extmap,self__.__hash));
}));

(datascript.pull_api.AttrsFrame.prototype.cljs$core$ICounted$_count$arity$1 = (function (this__5304__auto__){
var self__ = this;
var this__5304__auto____$1 = this;
return (8 + cljs.core.count(self__.__extmap));
}));

(datascript.pull_api.AttrsFrame.prototype.cljs$core$IHash$_hash$arity$1 = (function (this__5296__auto__){
var self__ = this;
var this__5296__auto____$1 = this;
var h__5111__auto__ = self__.__hash;
if((!((h__5111__auto__ == null)))){
return h__5111__auto__;
} else {
var h__5111__auto____$1 = (function (coll__5297__auto__){
return (1127179791 ^ cljs.core.hash_unordered_coll(coll__5297__auto__));
})(this__5296__auto____$1);
(self__.__hash = h__5111__auto____$1);

return h__5111__auto____$1;
}
}));

(datascript.pull_api.AttrsFrame.prototype.cljs$core$IEquiv$_equiv$arity$2 = (function (this52090,other52091){
var self__ = this;
var this52090__$1 = this;
return (((!((other52091 == null)))) && ((((this52090__$1.constructor === other52091.constructor)) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(this52090__$1.seen,other52091.seen)) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(this52090__$1.recursion_limits,other52091.recursion_limits)) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(this52090__$1.acc,other52091.acc)) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(this52090__$1.pattern,other52091.pattern)) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(this52090__$1.attr,other52091.attr)) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(this52090__$1.attrs,other52091.attrs)) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(this52090__$1.datoms,other52091.datoms)) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(this52090__$1.id,other52091.id)) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(this52090__$1.__extmap,other52091.__extmap)))))))))))))))))))));
}));

(datascript.pull_api.AttrsFrame.prototype.cljs$core$IMap$_dissoc$arity$2 = (function (this__5310__auto__,k__5311__auto__){
var self__ = this;
var this__5310__auto____$1 = this;
if(cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 8, [new cljs.core.Keyword(null,"acc","acc",838566312),null,new cljs.core.Keyword(null,"seen","seen",-518999789),null,new cljs.core.Keyword(null,"id","id",-1388402092),null,new cljs.core.Keyword(null,"recursion-limits","recursion-limits",1762857814),null,new cljs.core.Keyword(null,"attrs","attrs",-2090668713),null,new cljs.core.Keyword(null,"datoms","datoms",-290874434),null,new cljs.core.Keyword(null,"pattern","pattern",242135423),null,new cljs.core.Keyword(null,"attr","attr",-604132353),null], null), null),k__5311__auto__)){
return cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(cljs.core._with_meta(cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,this__5310__auto____$1),self__.__meta),k__5311__auto__);
} else {
return (new datascript.pull_api.AttrsFrame(self__.seen,self__.recursion_limits,self__.acc,self__.pattern,self__.attr,self__.attrs,self__.datoms,self__.id,self__.__meta,cljs.core.not_empty(cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(self__.__extmap,k__5311__auto__)),null));
}
}));

(datascript.pull_api.AttrsFrame.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = (function (this__5307__auto__,k52088){
var self__ = this;
var this__5307__auto____$1 = this;
var G__52128 = k52088;
var G__52128__$1 = (((G__52128 instanceof cljs.core.Keyword))?G__52128.fqn:null);
switch (G__52128__$1) {
case "seen":
case "recursion-limits":
case "acc":
case "pattern":
case "attr":
case "attrs":
case "datoms":
case "id":
return true;

break;
default:
return cljs.core.contains_QMARK_(self__.__extmap,k52088);

}
}));

(datascript.pull_api.AttrsFrame.prototype.cljs$core$IAssociative$_assoc$arity$3 = (function (this__5308__auto__,k__5309__auto__,G__52087){
var self__ = this;
var this__5308__auto____$1 = this;
var pred__52130 = cljs.core.keyword_identical_QMARK_;
var expr__52131 = k__5309__auto__;
if(cljs.core.truth_((pred__52130.cljs$core$IFn$_invoke$arity$2 ? pred__52130.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"seen","seen",-518999789),expr__52131) : pred__52130.call(null,new cljs.core.Keyword(null,"seen","seen",-518999789),expr__52131)))){
return (new datascript.pull_api.AttrsFrame(G__52087,self__.recursion_limits,self__.acc,self__.pattern,self__.attr,self__.attrs,self__.datoms,self__.id,self__.__meta,self__.__extmap,null));
} else {
if(cljs.core.truth_((pred__52130.cljs$core$IFn$_invoke$arity$2 ? pred__52130.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"recursion-limits","recursion-limits",1762857814),expr__52131) : pred__52130.call(null,new cljs.core.Keyword(null,"recursion-limits","recursion-limits",1762857814),expr__52131)))){
return (new datascript.pull_api.AttrsFrame(self__.seen,G__52087,self__.acc,self__.pattern,self__.attr,self__.attrs,self__.datoms,self__.id,self__.__meta,self__.__extmap,null));
} else {
if(cljs.core.truth_((pred__52130.cljs$core$IFn$_invoke$arity$2 ? pred__52130.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"acc","acc",838566312),expr__52131) : pred__52130.call(null,new cljs.core.Keyword(null,"acc","acc",838566312),expr__52131)))){
return (new datascript.pull_api.AttrsFrame(self__.seen,self__.recursion_limits,G__52087,self__.pattern,self__.attr,self__.attrs,self__.datoms,self__.id,self__.__meta,self__.__extmap,null));
} else {
if(cljs.core.truth_((pred__52130.cljs$core$IFn$_invoke$arity$2 ? pred__52130.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"pattern","pattern",242135423),expr__52131) : pred__52130.call(null,new cljs.core.Keyword(null,"pattern","pattern",242135423),expr__52131)))){
return (new datascript.pull_api.AttrsFrame(self__.seen,self__.recursion_limits,self__.acc,G__52087,self__.attr,self__.attrs,self__.datoms,self__.id,self__.__meta,self__.__extmap,null));
} else {
if(cljs.core.truth_((pred__52130.cljs$core$IFn$_invoke$arity$2 ? pred__52130.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"attr","attr",-604132353),expr__52131) : pred__52130.call(null,new cljs.core.Keyword(null,"attr","attr",-604132353),expr__52131)))){
return (new datascript.pull_api.AttrsFrame(self__.seen,self__.recursion_limits,self__.acc,self__.pattern,G__52087,self__.attrs,self__.datoms,self__.id,self__.__meta,self__.__extmap,null));
} else {
if(cljs.core.truth_((pred__52130.cljs$core$IFn$_invoke$arity$2 ? pred__52130.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"attrs","attrs",-2090668713),expr__52131) : pred__52130.call(null,new cljs.core.Keyword(null,"attrs","attrs",-2090668713),expr__52131)))){
return (new datascript.pull_api.AttrsFrame(self__.seen,self__.recursion_limits,self__.acc,self__.pattern,self__.attr,G__52087,self__.datoms,self__.id,self__.__meta,self__.__extmap,null));
} else {
if(cljs.core.truth_((pred__52130.cljs$core$IFn$_invoke$arity$2 ? pred__52130.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"datoms","datoms",-290874434),expr__52131) : pred__52130.call(null,new cljs.core.Keyword(null,"datoms","datoms",-290874434),expr__52131)))){
return (new datascript.pull_api.AttrsFrame(self__.seen,self__.recursion_limits,self__.acc,self__.pattern,self__.attr,self__.attrs,G__52087,self__.id,self__.__meta,self__.__extmap,null));
} else {
if(cljs.core.truth_((pred__52130.cljs$core$IFn$_invoke$arity$2 ? pred__52130.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"id","id",-1388402092),expr__52131) : pred__52130.call(null,new cljs.core.Keyword(null,"id","id",-1388402092),expr__52131)))){
return (new datascript.pull_api.AttrsFrame(self__.seen,self__.recursion_limits,self__.acc,self__.pattern,self__.attr,self__.attrs,self__.datoms,G__52087,self__.__meta,self__.__extmap,null));
} else {
return (new datascript.pull_api.AttrsFrame(self__.seen,self__.recursion_limits,self__.acc,self__.pattern,self__.attr,self__.attrs,self__.datoms,self__.id,self__.__meta,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(self__.__extmap,k__5309__auto__,G__52087),null));
}
}
}
}
}
}
}
}
}));

(datascript.pull_api.AttrsFrame.prototype.cljs$core$ISeqable$_seq$arity$1 = (function (this__5313__auto__){
var self__ = this;
var this__5313__auto____$1 = this;
return cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 8, 5, cljs.core.PersistentVector.EMPTY_NODE, [(new cljs.core.MapEntry(new cljs.core.Keyword(null,"seen","seen",-518999789),self__.seen,null)),(new cljs.core.MapEntry(new cljs.core.Keyword(null,"recursion-limits","recursion-limits",1762857814),self__.recursion_limits,null)),(new cljs.core.MapEntry(new cljs.core.Keyword(null,"acc","acc",838566312),self__.acc,null)),(new cljs.core.MapEntry(new cljs.core.Keyword(null,"pattern","pattern",242135423),self__.pattern,null)),(new cljs.core.MapEntry(new cljs.core.Keyword(null,"attr","attr",-604132353),self__.attr,null)),(new cljs.core.MapEntry(new cljs.core.Keyword(null,"attrs","attrs",-2090668713),self__.attrs,null)),(new cljs.core.MapEntry(new cljs.core.Keyword(null,"datoms","datoms",-290874434),self__.datoms,null)),(new cljs.core.MapEntry(new cljs.core.Keyword(null,"id","id",-1388402092),self__.id,null))], null),self__.__extmap));
}));

(datascript.pull_api.AttrsFrame.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = (function (this__5299__auto__,G__52087){
var self__ = this;
var this__5299__auto____$1 = this;
return (new datascript.pull_api.AttrsFrame(self__.seen,self__.recursion_limits,self__.acc,self__.pattern,self__.attr,self__.attrs,self__.datoms,self__.id,G__52087,self__.__extmap,self__.__hash));
}));

(datascript.pull_api.AttrsFrame.prototype.cljs$core$ICollection$_conj$arity$2 = (function (this__5305__auto__,entry__5306__auto__){
var self__ = this;
var this__5305__auto____$1 = this;
if(cljs.core.vector_QMARK_(entry__5306__auto__)){
return this__5305__auto____$1.cljs$core$IAssociative$_assoc$arity$3(null,cljs.core._nth(entry__5306__auto__,(0)),cljs.core._nth(entry__5306__auto__,(1)));
} else {
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3(cljs.core._conj,this__5305__auto____$1,entry__5306__auto__);
}
}));

(datascript.pull_api.AttrsFrame.prototype.datascript$pull_api$IFrame$ = cljs.core.PROTOCOL_SENTINEL);

(datascript.pull_api.AttrsFrame.prototype.datascript$pull_api$IFrame$_merge$arity$2 = (function (this$,result){
var self__ = this;
var this$__$1 = this;
return (new datascript.pull_api.AttrsFrame(self__.seen,self__.recursion_limits,datascript.pull_api.assoc_some_BANG_(self__.acc,self__.attr.as,(function (){var G__52166 = result.value;
var fexpr__52165 = self__.attr.xform;
return (fexpr__52165.cljs$core$IFn$_invoke$arity$1 ? fexpr__52165.cljs$core$IFn$_invoke$arity$1(G__52166) : fexpr__52165.call(null,G__52166));
})()),self__.pattern,datascript.pull_api.first_seq(self__.attrs),datascript.pull_api.next_seq(self__.attrs),cljs.core.not_empty((function (){var or__5002__auto__ = result.datoms;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return datascript.pull_api.next_seq(self__.datoms);
}
})()),self__.id,null,null,null));
}));

(datascript.pull_api.AttrsFrame.prototype.datascript$pull_api$IFrame$_run$arity$2 = (function (this$,context){
var self__ = this;
var this$__$1 = this;
var acc__$1 = self__.acc;
var attr__$1 = self__.attr;
var attrs__$1 = self__.attrs;
var datoms__$1 = self__.datoms;
while(true){
if((((datoms__$1 == null)) && ((((attr__$1 == null)) && (true))))){
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [(function (){var G__52273 = self__.seen;
var G__52274 = self__.recursion_limits;
var G__52275 = acc__$1;
var G__52276 = self__.pattern;
var G__52277 = datascript.pull_api.first_seq(self__.pattern.reverse_attrs);
var G__52278 = datascript.pull_api.next_seq(self__.pattern.reverse_attrs);
var G__52279 = self__.id;
return (datascript.pull_api.__GT_ReverseAttrsFrame.cljs$core$IFn$_invoke$arity$7 ? datascript.pull_api.__GT_ReverseAttrsFrame.cljs$core$IFn$_invoke$arity$7(G__52273,G__52274,G__52275,G__52276,G__52277,G__52278,G__52279) : datascript.pull_api.__GT_ReverseAttrsFrame.call(null,G__52273,G__52274,G__52275,G__52276,G__52277,G__52278,G__52279));
})()], null);
} else {
if((((!((attr__$1 == null)))) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","id","db/id",-1388397098),attr__$1.name)) && (true))))){
var G__53168 = cljs.core.assoc_BANG_.cljs$core$IFn$_invoke$arity$3(acc__$1,attr__$1.as,(function (){var fexpr__52299 = attr__$1.xform;
return (fexpr__52299.cljs$core$IFn$_invoke$arity$1 ? fexpr__52299.cljs$core$IFn$_invoke$arity$1(self__.id) : fexpr__52299.call(null,self__.id));
})());
var G__53169 = datascript.pull_api.first_seq(attrs__$1);
var G__53170 = datascript.pull_api.next_seq(attrs__$1);
var G__53171 = datoms__$1;
acc__$1 = G__53168;
attr__$1 = G__53169;
attrs__$1 = G__53170;
datoms__$1 = G__53171;
continue;
} else {
var datom = datascript.pull_api.first_seq(datoms__$1);
var cmp = (cljs.core.truth_((function (){var and__5000__auto__ = datom;
if(cljs.core.truth_(and__5000__auto__)){
return attr__$1;
} else {
return and__5000__auto__;
}
})())?cljs.core.compare(attr__$1.name,datom.a):null);
var attr_ahead_QMARK_ = (function (){var or__5002__auto__ = (attr__$1 == null);
if(or__5002__auto__){
return or__5002__auto__;
} else {
var and__5000__auto__ = cmp;
if(cljs.core.truth_(and__5000__auto__)){
return (cmp > (0));
} else {
return and__5000__auto__;
}
}
})();
var datom_ahead_QMARK_ = (function (){var or__5002__auto__ = (datom == null);
if(or__5002__auto__){
return or__5002__auto__;
} else {
var and__5000__auto__ = cmp;
if(cljs.core.truth_(and__5000__auto__)){
return (cmp < (0));
} else {
return and__5000__auto__;
}
}
})();
if(cljs.core.truth_((function (){var and__5000__auto__ = self__.pattern.wildcard_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
var and__5000__auto____$1 = (!((datom == null)));
if(and__5000__auto____$1){
var and__5000__auto____$2 = attr_ahead_QMARK_;
if(cljs.core.truth_(and__5000__auto____$2)){
return true;
} else {
return and__5000__auto____$2;
}
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})())){
var datom_attr = datascript.lru._get(datascript.db.unfiltered_db(context.db).pull_attrs,datom.a,((function (acc__$1,attr__$1,attrs__$1,datoms__$1,datom,cmp,attr_ahead_QMARK_,datom_ahead_QMARK_,this$__$1){
return (function (){
return datascript.pull_parser.parse_attr_name(context.db,datom.a);
});})(acc__$1,attr__$1,attrs__$1,datoms__$1,datom,cmp,attr_ahead_QMARK_,datom_ahead_QMARK_,this$__$1))
);
var G__53178 = acc__$1;
var G__53179 = datom_attr;
var G__53180 = (cljs.core.truth_(attr__$1)?datascript.pull_api.conj_seq(attrs__$1,attr__$1):null);
var G__53181 = datoms__$1;
acc__$1 = G__53178;
attr__$1 = G__53179;
attrs__$1 = G__53180;
datoms__$1 = G__53181;
continue;
} else {
if(cljs.core.truth_(attr_ahead_QMARK_)){
var G__53183 = acc__$1;
var G__53184 = attr__$1;
var G__53185 = attrs__$1;
var G__53186 = datascript.pull_api.next_seq(datoms__$1);
acc__$1 = G__53183;
attr__$1 = G__53184;
attrs__$1 = G__53185;
datoms__$1 = G__53186;
continue;
} else {
datascript.pull_api.visit(context,new cljs.core.Keyword("db.pull","attr","db.pull/attr",-533298746),self__.id,attr__$1.name,null);

if(cljs.core.truth_((function (){var and__5000__auto__ = datom_ahead_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return (((attr__$1 == null)) && (true));
} else {
return and__5000__auto__;
}
})())){
var G__53194 = acc__$1;
var G__53195 = datascript.pull_api.first_seq(attrs__$1);
var G__53196 = datascript.pull_api.next_seq(attrs__$1);
var G__53197 = datoms__$1;
acc__$1 = G__53194;
attr__$1 = G__53195;
attrs__$1 = G__53196;
datoms__$1 = G__53197;
continue;
} else {
if(cljs.core.truth_((function (){var and__5000__auto__ = datom_ahead_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return (((!((new cljs.core.Keyword(null,"default","default",-1987822328).cljs$core$IFn$_invoke$arity$1(attr__$1) == null)))) && (true));
} else {
return and__5000__auto__;
}
})())){
var G__53199 = cljs.core.assoc_BANG_.cljs$core$IFn$_invoke$arity$3(acc__$1,attr__$1.as,new cljs.core.Keyword(null,"default","default",-1987822328).cljs$core$IFn$_invoke$arity$1(attr__$1));
var G__53200 = datascript.pull_api.first_seq(attrs__$1);
var G__53201 = datascript.pull_api.next_seq(attrs__$1);
var G__53202 = datoms__$1;
acc__$1 = G__53199;
attr__$1 = G__53200;
attrs__$1 = G__53201;
datoms__$1 = G__53202;
continue;
} else {
if(cljs.core.truth_(datom_ahead_QMARK_)){
var temp__5806__auto__ = (function (){var fexpr__52377 = attr__$1.xform;
return (fexpr__52377.cljs$core$IFn$_invoke$arity$1 ? fexpr__52377.cljs$core$IFn$_invoke$arity$1(null) : fexpr__52377.call(null,null));
})();
if((temp__5806__auto__ == null)){
var G__53210 = acc__$1;
var G__53211 = datascript.pull_api.first_seq(attrs__$1);
var G__53212 = datascript.pull_api.next_seq(attrs__$1);
var G__53213 = datoms__$1;
acc__$1 = G__53210;
attr__$1 = G__53211;
attrs__$1 = G__53212;
datoms__$1 = G__53213;
continue;
} else {
var value = temp__5806__auto__;
var G__53214 = cljs.core.assoc_BANG_.cljs$core$IFn$_invoke$arity$3(acc__$1,attr__$1.as,value);
var G__53215 = datascript.pull_api.first_seq(attrs__$1);
var G__53216 = datascript.pull_api.next_seq(attrs__$1);
var G__53217 = datoms__$1;
acc__$1 = G__53214;
attr__$1 = G__53215;
attrs__$1 = G__53216;
datoms__$1 = G__53217;
continue;
}
} else {
if(cljs.core.truth_((function (){var and__5000__auto__ = attr__$1.multival_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
var and__5000__auto____$1 = attr__$1.ref_QMARK_;
if(cljs.core.truth_(and__5000__auto____$1)){
return true;
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})())){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [(new datascript.pull_api.AttrsFrame(self__.seen,self__.recursion_limits,acc__$1,self__.pattern,attr__$1,attrs__$1,datoms__$1,self__.id,null,null,null)),(new datascript.pull_api.MultivalRefAttrFrame(self__.seen,self__.recursion_limits,cljs.core.transient$(cljs.core.PersistentVector.EMPTY),self__.pattern,attr__$1,datoms__$1,null,null,null))], null);
} else {
if(cljs.core.truth_(attr__$1.multival_QMARK_)){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [(new datascript.pull_api.AttrsFrame(self__.seen,self__.recursion_limits,acc__$1,self__.pattern,attr__$1,attrs__$1,datoms__$1,self__.id,null,null,null)),(new datascript.pull_api.MultivalAttrFrame(cljs.core.transient$(cljs.core.PersistentVector.EMPTY),attr__$1,datoms__$1,null,null,null))], null);
} else {
if(cljs.core.truth_(attr__$1.ref_QMARK_)){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [(new datascript.pull_api.AttrsFrame(self__.seen,self__.recursion_limits,acc__$1,self__.pattern,attr__$1,attrs__$1,datoms__$1,self__.id,null,null,null)),(function (){var G__52417 = context;
var G__52418 = self__.seen;
var G__52419 = self__.recursion_limits;
var G__52420 = self__.pattern;
var G__52421 = attr__$1;
var G__52422 = datom.v;
return (datascript.pull_api.ref_frame.cljs$core$IFn$_invoke$arity$6 ? datascript.pull_api.ref_frame.cljs$core$IFn$_invoke$arity$6(G__52417,G__52418,G__52419,G__52420,G__52421,G__52422) : datascript.pull_api.ref_frame.call(null,G__52417,G__52418,G__52419,G__52420,G__52421,G__52422));
})()], null);
} else {
var G__53224 = cljs.core.assoc_BANG_.cljs$core$IFn$_invoke$arity$3(acc__$1,attr__$1.as,(function (){var G__52429 = datom.v;
var fexpr__52428 = attr__$1.xform;
return (fexpr__52428.cljs$core$IFn$_invoke$arity$1 ? fexpr__52428.cljs$core$IFn$_invoke$arity$1(G__52429) : fexpr__52428.call(null,G__52429));
})());
var G__53225 = datascript.pull_api.first_seq(attrs__$1);
var G__53226 = datascript.pull_api.next_seq(attrs__$1);
var G__53227 = datascript.pull_api.next_seq(datoms__$1);
acc__$1 = G__53224;
attr__$1 = G__53225;
attrs__$1 = G__53226;
datoms__$1 = G__53227;
continue;

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

(datascript.pull_api.AttrsFrame.prototype.datascript$pull_api$IFrame$_str$arity$1 = (function (this$){
var self__ = this;
var this$__$1 = this;
return ["AttrsFrame<id=",cljs.core.str.cljs$core$IFn$_invoke$arity$1(self__.id),", attr=",cljs.core.str.cljs$core$IFn$_invoke$arity$1(datascript.pull_api.attr_str(self__.attr)),", attrs=",clojure.string.join.cljs$core$IFn$_invoke$arity$2(" ",cljs.core.map.cljs$core$IFn$_invoke$arity$2(datascript.pull_api.attr_str,self__.attrs)),">"].join('');
}));

(datascript.pull_api.AttrsFrame.getBasis = (function (){
return new cljs.core.PersistentVector(null, 8, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"seen","seen",1121531738,null),new cljs.core.Symbol(null,"recursion-limits","recursion-limits",-891577955,null),new cljs.core.Symbol(null,"acc","acc",-1815869457,null),cljs.core.with_meta(new cljs.core.Symbol(null,"pattern","pattern",1882666950,null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),new cljs.core.Symbol(null,"PullPattern","PullPattern",1378528189,null)], null)),cljs.core.with_meta(new cljs.core.Symbol(null,"attr","attr",1036399174,null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),new cljs.core.Symbol(null,"PullAttr","PullAttr",1557473458,null)], null)),new cljs.core.Symbol(null,"attrs","attrs",-450137186,null),new cljs.core.Symbol(null,"datoms","datoms",1349657093,null),new cljs.core.Symbol(null,"id","id",252129435,null)], null);
}));

(datascript.pull_api.AttrsFrame.cljs$lang$type = true);

(datascript.pull_api.AttrsFrame.cljs$lang$ctorPrSeq = (function (this__5346__auto__){
return (new cljs.core.List(null,"datascript.pull-api/AttrsFrame",null,(1),null));
}));

(datascript.pull_api.AttrsFrame.cljs$lang$ctorPrWriter = (function (this__5346__auto__,writer__5347__auto__){
return cljs.core._write(writer__5347__auto__,"datascript.pull-api/AttrsFrame");
}));

/**
 * Positional factory function for datascript.pull-api/AttrsFrame.
 */
datascript.pull_api.__GT_AttrsFrame = (function datascript$pull_api$__GT_AttrsFrame(seen,recursion_limits,acc,pattern,attr,attrs,datoms,id){
return (new datascript.pull_api.AttrsFrame(seen,recursion_limits,acc,pattern,attr,attrs,datoms,id,null,null,null));
});

/**
 * Factory function for datascript.pull-api/AttrsFrame, taking a map of keywords to field values.
 */
datascript.pull_api.map__GT_AttrsFrame = (function datascript$pull_api$map__GT_AttrsFrame(G__52095){
var extmap__5342__auto__ = (function (){var G__52472 = cljs.core.dissoc.cljs$core$IFn$_invoke$arity$variadic(G__52095,new cljs.core.Keyword(null,"seen","seen",-518999789),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"recursion-limits","recursion-limits",1762857814),new cljs.core.Keyword(null,"acc","acc",838566312),new cljs.core.Keyword(null,"pattern","pattern",242135423),new cljs.core.Keyword(null,"attr","attr",-604132353),new cljs.core.Keyword(null,"attrs","attrs",-2090668713),new cljs.core.Keyword(null,"datoms","datoms",-290874434),new cljs.core.Keyword(null,"id","id",-1388402092)], 0));
if(cljs.core.record_QMARK_(G__52095)){
return cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,G__52472);
} else {
return G__52472;
}
})();
return (new datascript.pull_api.AttrsFrame(new cljs.core.Keyword(null,"seen","seen",-518999789).cljs$core$IFn$_invoke$arity$1(G__52095),new cljs.core.Keyword(null,"recursion-limits","recursion-limits",1762857814).cljs$core$IFn$_invoke$arity$1(G__52095),new cljs.core.Keyword(null,"acc","acc",838566312).cljs$core$IFn$_invoke$arity$1(G__52095),new cljs.core.Keyword(null,"pattern","pattern",242135423).cljs$core$IFn$_invoke$arity$1(G__52095),new cljs.core.Keyword(null,"attr","attr",-604132353).cljs$core$IFn$_invoke$arity$1(G__52095),new cljs.core.Keyword(null,"attrs","attrs",-2090668713).cljs$core$IFn$_invoke$arity$1(G__52095),new cljs.core.Keyword(null,"datoms","datoms",-290874434).cljs$core$IFn$_invoke$arity$1(G__52095),new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(G__52095),null,cljs.core.not_empty(extmap__5342__auto__),null));
});


/**
* @constructor
 * @implements {cljs.core.IRecord}
 * @implements {datascript.pull_api.IFrame}
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
datascript.pull_api.ReverseAttrsFrame = (function (seen,recursion_limits,acc,pattern,attr,attrs,id,__meta,__extmap,__hash){
this.seen = seen;
this.recursion_limits = recursion_limits;
this.acc = acc;
this.pattern = pattern;
this.attr = attr;
this.attrs = attrs;
this.id = id;
this.__meta = __meta;
this.__extmap = __extmap;
this.__hash = __hash;
this.cljs$lang$protocol_mask$partition0$ = 2230716170;
this.cljs$lang$protocol_mask$partition1$ = 139264;
});
(datascript.pull_api.ReverseAttrsFrame.prototype.cljs$core$ILookup$_lookup$arity$2 = (function (this__5300__auto__,k__5301__auto__){
var self__ = this;
var this__5300__auto____$1 = this;
return this__5300__auto____$1.cljs$core$ILookup$_lookup$arity$3(null,k__5301__auto__,null);
}));

(datascript.pull_api.ReverseAttrsFrame.prototype.cljs$core$ILookup$_lookup$arity$3 = (function (this__5302__auto__,k52496,else__5303__auto__){
var self__ = this;
var this__5302__auto____$1 = this;
var G__52531 = k52496;
var G__52531__$1 = (((G__52531 instanceof cljs.core.Keyword))?G__52531.fqn:null);
switch (G__52531__$1) {
case "seen":
return self__.seen;

break;
case "recursion-limits":
return self__.recursion_limits;

break;
case "acc":
return self__.acc;

break;
case "pattern":
return self__.pattern;

break;
case "attr":
return self__.attr;

break;
case "attrs":
return self__.attrs;

break;
case "id":
return self__.id;

break;
default:
return cljs.core.get.cljs$core$IFn$_invoke$arity$3(self__.__extmap,k52496,else__5303__auto__);

}
}));

(datascript.pull_api.ReverseAttrsFrame.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = (function (this__5320__auto__,f__5321__auto__,init__5322__auto__){
var self__ = this;
var this__5320__auto____$1 = this;
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (ret__5323__auto__,p__52533){
var vec__52534 = p__52533;
var k__5324__auto__ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__52534,(0),null);
var v__5325__auto__ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__52534,(1),null);
return (f__5321__auto__.cljs$core$IFn$_invoke$arity$3 ? f__5321__auto__.cljs$core$IFn$_invoke$arity$3(ret__5323__auto__,k__5324__auto__,v__5325__auto__) : f__5321__auto__.call(null,ret__5323__auto__,k__5324__auto__,v__5325__auto__));
}),init__5322__auto__,this__5320__auto____$1);
}));

(datascript.pull_api.ReverseAttrsFrame.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = (function (this__5315__auto__,writer__5316__auto__,opts__5317__auto__){
var self__ = this;
var this__5315__auto____$1 = this;
var pr_pair__5318__auto__ = (function (keyval__5319__auto__){
return cljs.core.pr_sequential_writer(writer__5316__auto__,cljs.core.pr_writer,""," ","",opts__5317__auto__,keyval__5319__auto__);
});
return cljs.core.pr_sequential_writer(writer__5316__auto__,pr_pair__5318__auto__,"#datascript.pull-api.ReverseAttrsFrame{",", ","}",opts__5317__auto__,cljs.core.concat.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 7, 5, cljs.core.PersistentVector.EMPTY_NODE, [(new cljs.core.PersistentVector(null,2,(5),cljs.core.PersistentVector.EMPTY_NODE,[new cljs.core.Keyword(null,"seen","seen",-518999789),self__.seen],null)),(new cljs.core.PersistentVector(null,2,(5),cljs.core.PersistentVector.EMPTY_NODE,[new cljs.core.Keyword(null,"recursion-limits","recursion-limits",1762857814),self__.recursion_limits],null)),(new cljs.core.PersistentVector(null,2,(5),cljs.core.PersistentVector.EMPTY_NODE,[new cljs.core.Keyword(null,"acc","acc",838566312),self__.acc],null)),(new cljs.core.PersistentVector(null,2,(5),cljs.core.PersistentVector.EMPTY_NODE,[new cljs.core.Keyword(null,"pattern","pattern",242135423),self__.pattern],null)),(new cljs.core.PersistentVector(null,2,(5),cljs.core.PersistentVector.EMPTY_NODE,[new cljs.core.Keyword(null,"attr","attr",-604132353),self__.attr],null)),(new cljs.core.PersistentVector(null,2,(5),cljs.core.PersistentVector.EMPTY_NODE,[new cljs.core.Keyword(null,"attrs","attrs",-2090668713),self__.attrs],null)),(new cljs.core.PersistentVector(null,2,(5),cljs.core.PersistentVector.EMPTY_NODE,[new cljs.core.Keyword(null,"id","id",-1388402092),self__.id],null))], null),self__.__extmap));
}));

(datascript.pull_api.ReverseAttrsFrame.prototype.cljs$core$IIterable$_iterator$arity$1 = (function (G__52495){
var self__ = this;
var G__52495__$1 = this;
return (new cljs.core.RecordIter((0),G__52495__$1,7,new cljs.core.PersistentVector(null, 7, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"seen","seen",-518999789),new cljs.core.Keyword(null,"recursion-limits","recursion-limits",1762857814),new cljs.core.Keyword(null,"acc","acc",838566312),new cljs.core.Keyword(null,"pattern","pattern",242135423),new cljs.core.Keyword(null,"attr","attr",-604132353),new cljs.core.Keyword(null,"attrs","attrs",-2090668713),new cljs.core.Keyword(null,"id","id",-1388402092)], null),(cljs.core.truth_(self__.__extmap)?cljs.core._iterator(self__.__extmap):cljs.core.nil_iter())));
}));

(datascript.pull_api.ReverseAttrsFrame.prototype.cljs$core$IMeta$_meta$arity$1 = (function (this__5298__auto__){
var self__ = this;
var this__5298__auto____$1 = this;
return self__.__meta;
}));

(datascript.pull_api.ReverseAttrsFrame.prototype.cljs$core$ICloneable$_clone$arity$1 = (function (this__5295__auto__){
var self__ = this;
var this__5295__auto____$1 = this;
return (new datascript.pull_api.ReverseAttrsFrame(self__.seen,self__.recursion_limits,self__.acc,self__.pattern,self__.attr,self__.attrs,self__.id,self__.__meta,self__.__extmap,self__.__hash));
}));

(datascript.pull_api.ReverseAttrsFrame.prototype.cljs$core$ICounted$_count$arity$1 = (function (this__5304__auto__){
var self__ = this;
var this__5304__auto____$1 = this;
return (7 + cljs.core.count(self__.__extmap));
}));

(datascript.pull_api.ReverseAttrsFrame.prototype.cljs$core$IHash$_hash$arity$1 = (function (this__5296__auto__){
var self__ = this;
var this__5296__auto____$1 = this;
var h__5111__auto__ = self__.__hash;
if((!((h__5111__auto__ == null)))){
return h__5111__auto__;
} else {
var h__5111__auto____$1 = (function (coll__5297__auto__){
return (470210558 ^ cljs.core.hash_unordered_coll(coll__5297__auto__));
})(this__5296__auto____$1);
(self__.__hash = h__5111__auto____$1);

return h__5111__auto____$1;
}
}));

(datascript.pull_api.ReverseAttrsFrame.prototype.cljs$core$IEquiv$_equiv$arity$2 = (function (this52497,other52498){
var self__ = this;
var this52497__$1 = this;
return (((!((other52498 == null)))) && ((((this52497__$1.constructor === other52498.constructor)) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(this52497__$1.seen,other52498.seen)) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(this52497__$1.recursion_limits,other52498.recursion_limits)) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(this52497__$1.acc,other52498.acc)) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(this52497__$1.pattern,other52498.pattern)) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(this52497__$1.attr,other52498.attr)) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(this52497__$1.attrs,other52498.attrs)) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(this52497__$1.id,other52498.id)) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(this52497__$1.__extmap,other52498.__extmap)))))))))))))))))));
}));

(datascript.pull_api.ReverseAttrsFrame.prototype.cljs$core$IMap$_dissoc$arity$2 = (function (this__5310__auto__,k__5311__auto__){
var self__ = this;
var this__5310__auto____$1 = this;
if(cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 7, [new cljs.core.Keyword(null,"acc","acc",838566312),null,new cljs.core.Keyword(null,"seen","seen",-518999789),null,new cljs.core.Keyword(null,"id","id",-1388402092),null,new cljs.core.Keyword(null,"recursion-limits","recursion-limits",1762857814),null,new cljs.core.Keyword(null,"attrs","attrs",-2090668713),null,new cljs.core.Keyword(null,"pattern","pattern",242135423),null,new cljs.core.Keyword(null,"attr","attr",-604132353),null], null), null),k__5311__auto__)){
return cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(cljs.core._with_meta(cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,this__5310__auto____$1),self__.__meta),k__5311__auto__);
} else {
return (new datascript.pull_api.ReverseAttrsFrame(self__.seen,self__.recursion_limits,self__.acc,self__.pattern,self__.attr,self__.attrs,self__.id,self__.__meta,cljs.core.not_empty(cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(self__.__extmap,k__5311__auto__)),null));
}
}));

(datascript.pull_api.ReverseAttrsFrame.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = (function (this__5307__auto__,k52496){
var self__ = this;
var this__5307__auto____$1 = this;
var G__52560 = k52496;
var G__52560__$1 = (((G__52560 instanceof cljs.core.Keyword))?G__52560.fqn:null);
switch (G__52560__$1) {
case "seen":
case "recursion-limits":
case "acc":
case "pattern":
case "attr":
case "attrs":
case "id":
return true;

break;
default:
return cljs.core.contains_QMARK_(self__.__extmap,k52496);

}
}));

(datascript.pull_api.ReverseAttrsFrame.prototype.cljs$core$IAssociative$_assoc$arity$3 = (function (this__5308__auto__,k__5309__auto__,G__52495){
var self__ = this;
var this__5308__auto____$1 = this;
var pred__52580 = cljs.core.keyword_identical_QMARK_;
var expr__52581 = k__5309__auto__;
if(cljs.core.truth_((pred__52580.cljs$core$IFn$_invoke$arity$2 ? pred__52580.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"seen","seen",-518999789),expr__52581) : pred__52580.call(null,new cljs.core.Keyword(null,"seen","seen",-518999789),expr__52581)))){
return (new datascript.pull_api.ReverseAttrsFrame(G__52495,self__.recursion_limits,self__.acc,self__.pattern,self__.attr,self__.attrs,self__.id,self__.__meta,self__.__extmap,null));
} else {
if(cljs.core.truth_((pred__52580.cljs$core$IFn$_invoke$arity$2 ? pred__52580.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"recursion-limits","recursion-limits",1762857814),expr__52581) : pred__52580.call(null,new cljs.core.Keyword(null,"recursion-limits","recursion-limits",1762857814),expr__52581)))){
return (new datascript.pull_api.ReverseAttrsFrame(self__.seen,G__52495,self__.acc,self__.pattern,self__.attr,self__.attrs,self__.id,self__.__meta,self__.__extmap,null));
} else {
if(cljs.core.truth_((pred__52580.cljs$core$IFn$_invoke$arity$2 ? pred__52580.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"acc","acc",838566312),expr__52581) : pred__52580.call(null,new cljs.core.Keyword(null,"acc","acc",838566312),expr__52581)))){
return (new datascript.pull_api.ReverseAttrsFrame(self__.seen,self__.recursion_limits,G__52495,self__.pattern,self__.attr,self__.attrs,self__.id,self__.__meta,self__.__extmap,null));
} else {
if(cljs.core.truth_((pred__52580.cljs$core$IFn$_invoke$arity$2 ? pred__52580.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"pattern","pattern",242135423),expr__52581) : pred__52580.call(null,new cljs.core.Keyword(null,"pattern","pattern",242135423),expr__52581)))){
return (new datascript.pull_api.ReverseAttrsFrame(self__.seen,self__.recursion_limits,self__.acc,G__52495,self__.attr,self__.attrs,self__.id,self__.__meta,self__.__extmap,null));
} else {
if(cljs.core.truth_((pred__52580.cljs$core$IFn$_invoke$arity$2 ? pred__52580.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"attr","attr",-604132353),expr__52581) : pred__52580.call(null,new cljs.core.Keyword(null,"attr","attr",-604132353),expr__52581)))){
return (new datascript.pull_api.ReverseAttrsFrame(self__.seen,self__.recursion_limits,self__.acc,self__.pattern,G__52495,self__.attrs,self__.id,self__.__meta,self__.__extmap,null));
} else {
if(cljs.core.truth_((pred__52580.cljs$core$IFn$_invoke$arity$2 ? pred__52580.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"attrs","attrs",-2090668713),expr__52581) : pred__52580.call(null,new cljs.core.Keyword(null,"attrs","attrs",-2090668713),expr__52581)))){
return (new datascript.pull_api.ReverseAttrsFrame(self__.seen,self__.recursion_limits,self__.acc,self__.pattern,self__.attr,G__52495,self__.id,self__.__meta,self__.__extmap,null));
} else {
if(cljs.core.truth_((pred__52580.cljs$core$IFn$_invoke$arity$2 ? pred__52580.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"id","id",-1388402092),expr__52581) : pred__52580.call(null,new cljs.core.Keyword(null,"id","id",-1388402092),expr__52581)))){
return (new datascript.pull_api.ReverseAttrsFrame(self__.seen,self__.recursion_limits,self__.acc,self__.pattern,self__.attr,self__.attrs,G__52495,self__.__meta,self__.__extmap,null));
} else {
return (new datascript.pull_api.ReverseAttrsFrame(self__.seen,self__.recursion_limits,self__.acc,self__.pattern,self__.attr,self__.attrs,self__.id,self__.__meta,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(self__.__extmap,k__5309__auto__,G__52495),null));
}
}
}
}
}
}
}
}));

(datascript.pull_api.ReverseAttrsFrame.prototype.cljs$core$ISeqable$_seq$arity$1 = (function (this__5313__auto__){
var self__ = this;
var this__5313__auto____$1 = this;
return cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 7, 5, cljs.core.PersistentVector.EMPTY_NODE, [(new cljs.core.MapEntry(new cljs.core.Keyword(null,"seen","seen",-518999789),self__.seen,null)),(new cljs.core.MapEntry(new cljs.core.Keyword(null,"recursion-limits","recursion-limits",1762857814),self__.recursion_limits,null)),(new cljs.core.MapEntry(new cljs.core.Keyword(null,"acc","acc",838566312),self__.acc,null)),(new cljs.core.MapEntry(new cljs.core.Keyword(null,"pattern","pattern",242135423),self__.pattern,null)),(new cljs.core.MapEntry(new cljs.core.Keyword(null,"attr","attr",-604132353),self__.attr,null)),(new cljs.core.MapEntry(new cljs.core.Keyword(null,"attrs","attrs",-2090668713),self__.attrs,null)),(new cljs.core.MapEntry(new cljs.core.Keyword(null,"id","id",-1388402092),self__.id,null))], null),self__.__extmap));
}));

(datascript.pull_api.ReverseAttrsFrame.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = (function (this__5299__auto__,G__52495){
var self__ = this;
var this__5299__auto____$1 = this;
return (new datascript.pull_api.ReverseAttrsFrame(self__.seen,self__.recursion_limits,self__.acc,self__.pattern,self__.attr,self__.attrs,self__.id,G__52495,self__.__extmap,self__.__hash));
}));

(datascript.pull_api.ReverseAttrsFrame.prototype.cljs$core$ICollection$_conj$arity$2 = (function (this__5305__auto__,entry__5306__auto__){
var self__ = this;
var this__5305__auto____$1 = this;
if(cljs.core.vector_QMARK_(entry__5306__auto__)){
return this__5305__auto____$1.cljs$core$IAssociative$_assoc$arity$3(null,cljs.core._nth(entry__5306__auto__,(0)),cljs.core._nth(entry__5306__auto__,(1)));
} else {
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3(cljs.core._conj,this__5305__auto____$1,entry__5306__auto__);
}
}));

(datascript.pull_api.ReverseAttrsFrame.prototype.datascript$pull_api$IFrame$ = cljs.core.PROTOCOL_SENTINEL);

(datascript.pull_api.ReverseAttrsFrame.prototype.datascript$pull_api$IFrame$_merge$arity$2 = (function (this$,result){
var self__ = this;
var this$__$1 = this;
return (new datascript.pull_api.ReverseAttrsFrame(self__.seen,self__.recursion_limits,datascript.pull_api.assoc_some_BANG_(self__.acc,self__.attr.as,(function (){var G__52612 = result.value;
var fexpr__52611 = self__.attr.xform;
return (fexpr__52611.cljs$core$IFn$_invoke$arity$1 ? fexpr__52611.cljs$core$IFn$_invoke$arity$1(G__52612) : fexpr__52611.call(null,G__52612));
})()),self__.pattern,datascript.pull_api.first_seq(self__.attrs),datascript.pull_api.next_seq(self__.attrs),self__.id,null,null,null));
}));

(datascript.pull_api.ReverseAttrsFrame.prototype.datascript$pull_api$IFrame$_run$arity$2 = (function (this$,context){
var self__ = this;
var this$__$1 = this;
var acc__$1 = self__.acc;
var attr__$1 = self__.attr;
var attrs__$1 = self__.attrs;
while(true){
if((attr__$1 == null)){
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [(new datascript.pull_api.ResultFrame(cljs.core.not_empty(cljs.core.persistent_BANG_(acc__$1)),null,null,null,null))], null);
} else {
var name = attr__$1.name;
var db = context.db;
var datoms = (((db instanceof datascript.db.DB))?me.tonsky.persistent_sorted_set.slice.cljs$core$IFn$_invoke$arity$3(db.avet,datascript.db.datom.cljs$core$IFn$_invoke$arity$4((0),name,self__.id,(536870912)),datascript.db.datom.cljs$core$IFn$_invoke$arity$4((2147483647),name,self__.id,(2147483647))):datascript.db._search(db,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [null,name,self__.id], null)));
datascript.pull_api.visit(context,new cljs.core.Keyword("db.pull","reverse","db.pull/reverse",1999788297),null,name,self__.id);

if(((cljs.core.empty_QMARK_(datoms)) && ((((!((new cljs.core.Keyword(null,"default","default",-1987822328).cljs$core$IFn$_invoke$arity$1(attr__$1) == null)))) && (true))))){
var G__53269 = cljs.core.assoc_BANG_.cljs$core$IFn$_invoke$arity$3(acc__$1,attr__$1.as,new cljs.core.Keyword(null,"default","default",-1987822328).cljs$core$IFn$_invoke$arity$1(attr__$1));
var G__53270 = datascript.pull_api.first_seq(attrs__$1);
var G__53271 = datascript.pull_api.next_seq(attrs__$1);
acc__$1 = G__53269;
attr__$1 = G__53270;
attrs__$1 = G__53271;
continue;
} else {
if(cljs.core.empty_QMARK_(datoms)){
var G__53272 = acc__$1;
var G__53273 = datascript.pull_api.first_seq(attrs__$1);
var G__53274 = datascript.pull_api.next_seq(attrs__$1);
acc__$1 = G__53272;
attr__$1 = G__53273;
attrs__$1 = G__53274;
continue;
} else {
if(cljs.core.truth_(attr__$1.component_QMARK_)){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [(new datascript.pull_api.ReverseAttrsFrame(self__.seen,self__.recursion_limits,acc__$1,self__.pattern,attr__$1,attrs__$1,self__.id,null,null,null)),(function (){var G__52630 = context;
var G__52631 = self__.seen;
var G__52632 = self__.recursion_limits;
var G__52633 = self__.pattern;
var G__52634 = attr__$1;
var G__52635 = datascript.pull_api.first_seq(datoms).e;
return (datascript.pull_api.ref_frame.cljs$core$IFn$_invoke$arity$6 ? datascript.pull_api.ref_frame.cljs$core$IFn$_invoke$arity$6(G__52630,G__52631,G__52632,G__52633,G__52634,G__52635) : datascript.pull_api.ref_frame.call(null,G__52630,G__52631,G__52632,G__52633,G__52634,G__52635));
})()], null);
} else {
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [(new datascript.pull_api.ReverseAttrsFrame(self__.seen,self__.recursion_limits,acc__$1,self__.pattern,attr__$1,attrs__$1,self__.id,null,null,null)),(new datascript.pull_api.MultivalRefAttrFrame(self__.seen,self__.recursion_limits,cljs.core.transient$(cljs.core.PersistentVector.EMPTY),self__.pattern,attr__$1,datoms,null,null,null))], null);

}
}
}
}
break;
}
}));

(datascript.pull_api.ReverseAttrsFrame.prototype.datascript$pull_api$IFrame$_str$arity$1 = (function (this$){
var self__ = this;
var this$__$1 = this;
return ["ReverseAttrsFrame<id=",cljs.core.str.cljs$core$IFn$_invoke$arity$1(self__.id),", attr=",cljs.core.str.cljs$core$IFn$_invoke$arity$1(datascript.pull_api.attr_str(self__.attr)),", attrs=",clojure.string.join.cljs$core$IFn$_invoke$arity$2(" ",cljs.core.map.cljs$core$IFn$_invoke$arity$2(datascript.pull_api.attr_str,self__.attrs)),">"].join('');
}));

(datascript.pull_api.ReverseAttrsFrame.getBasis = (function (){
return new cljs.core.PersistentVector(null, 7, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"seen","seen",1121531738,null),new cljs.core.Symbol(null,"recursion-limits","recursion-limits",-891577955,null),new cljs.core.Symbol(null,"acc","acc",-1815869457,null),new cljs.core.Symbol(null,"pattern","pattern",1882666950,null),cljs.core.with_meta(new cljs.core.Symbol(null,"attr","attr",1036399174,null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),new cljs.core.Symbol(null,"PullAttr","PullAttr",1557473458,null)], null)),new cljs.core.Symbol(null,"attrs","attrs",-450137186,null),new cljs.core.Symbol(null,"id","id",252129435,null)], null);
}));

(datascript.pull_api.ReverseAttrsFrame.cljs$lang$type = true);

(datascript.pull_api.ReverseAttrsFrame.cljs$lang$ctorPrSeq = (function (this__5346__auto__){
return (new cljs.core.List(null,"datascript.pull-api/ReverseAttrsFrame",null,(1),null));
}));

(datascript.pull_api.ReverseAttrsFrame.cljs$lang$ctorPrWriter = (function (this__5346__auto__,writer__5347__auto__){
return cljs.core._write(writer__5347__auto__,"datascript.pull-api/ReverseAttrsFrame");
}));

/**
 * Positional factory function for datascript.pull-api/ReverseAttrsFrame.
 */
datascript.pull_api.__GT_ReverseAttrsFrame = (function datascript$pull_api$__GT_ReverseAttrsFrame(seen,recursion_limits,acc,pattern,attr,attrs,id){
return (new datascript.pull_api.ReverseAttrsFrame(seen,recursion_limits,acc,pattern,attr,attrs,id,null,null,null));
});

/**
 * Factory function for datascript.pull-api/ReverseAttrsFrame, taking a map of keywords to field values.
 */
datascript.pull_api.map__GT_ReverseAttrsFrame = (function datascript$pull_api$map__GT_ReverseAttrsFrame(G__52499){
var extmap__5342__auto__ = (function (){var G__52686 = cljs.core.dissoc.cljs$core$IFn$_invoke$arity$variadic(G__52499,new cljs.core.Keyword(null,"seen","seen",-518999789),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"recursion-limits","recursion-limits",1762857814),new cljs.core.Keyword(null,"acc","acc",838566312),new cljs.core.Keyword(null,"pattern","pattern",242135423),new cljs.core.Keyword(null,"attr","attr",-604132353),new cljs.core.Keyword(null,"attrs","attrs",-2090668713),new cljs.core.Keyword(null,"id","id",-1388402092)], 0));
if(cljs.core.record_QMARK_(G__52499)){
return cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,G__52686);
} else {
return G__52686;
}
})();
return (new datascript.pull_api.ReverseAttrsFrame(new cljs.core.Keyword(null,"seen","seen",-518999789).cljs$core$IFn$_invoke$arity$1(G__52499),new cljs.core.Keyword(null,"recursion-limits","recursion-limits",1762857814).cljs$core$IFn$_invoke$arity$1(G__52499),new cljs.core.Keyword(null,"acc","acc",838566312).cljs$core$IFn$_invoke$arity$1(G__52499),new cljs.core.Keyword(null,"pattern","pattern",242135423).cljs$core$IFn$_invoke$arity$1(G__52499),new cljs.core.Keyword(null,"attr","attr",-604132353).cljs$core$IFn$_invoke$arity$1(G__52499),new cljs.core.Keyword(null,"attrs","attrs",-2090668713).cljs$core$IFn$_invoke$arity$1(G__52499),new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(G__52499),null,cljs.core.not_empty(extmap__5342__auto__),null));
});

datascript.pull_api.auto_expanding_QMARK_ = (function datascript$pull_api$auto_expanding_QMARK_(attr){
var or__5002__auto__ = attr.recursive_QMARK_;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var and__5000__auto__ = attr.component_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return attr.pattern.wildcard_QMARK_;
} else {
return and__5000__auto__;
}
}
});
datascript.pull_api.ref_frame = (function datascript$pull_api$ref_frame(context,seen,recursion_limits,pattern,attr,id){
if(cljs.core.not(datascript.pull_api.auto_expanding_QMARK_(attr))){
var G__52745 = context;
var G__52746 = seen;
var G__52747 = recursion_limits;
var G__52748 = attr.pattern;
var G__52749 = id;
return (datascript.pull_api.attrs_frame.cljs$core$IFn$_invoke$arity$5 ? datascript.pull_api.attrs_frame.cljs$core$IFn$_invoke$arity$5(G__52745,G__52746,G__52747,G__52748,G__52749) : datascript.pull_api.attrs_frame.call(null,G__52745,G__52746,G__52747,G__52748,G__52749));
} else {
if(cljs.core.truth_((seen.cljs$core$IFn$_invoke$arity$1 ? seen.cljs$core$IFn$_invoke$arity$1(id) : seen.call(null,id)))){
return (new datascript.pull_api.ResultFrame(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("db","id","db/id",-1388397098),id], null),null,null,null,null));
} else {
var lim = (recursion_limits.cljs$core$IFn$_invoke$arity$1 ? recursion_limits.cljs$core$IFn$_invoke$arity$1(attr) : recursion_limits.call(null,attr));
if(cljs.core.truth_((function (){var and__5000__auto__ = lim;
if(cljs.core.truth_(and__5000__auto__)){
return (((lim <= (0))) && (true));
} else {
return and__5000__auto__;
}
})())){
return (new datascript.pull_api.ResultFrame(null,null,null,null,null));
} else {
var seen_SINGLEQUOTE_ = cljs.core.conj.cljs$core$IFn$_invoke$arity$2(seen,id);
var recursion_limits_SINGLEQUOTE_ = (cljs.core.truth_(lim)?cljs.core.update.cljs$core$IFn$_invoke$arity$3(recursion_limits,attr,cljs.core.dec):(cljs.core.truth_(attr.recursion_limit)?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(recursion_limits,attr,(attr.recursion_limit - (1))):recursion_limits
));
var G__52772 = context;
var G__52773 = seen_SINGLEQUOTE_;
var G__52774 = recursion_limits_SINGLEQUOTE_;
var G__52775 = (cljs.core.truth_(attr.recursive_QMARK_)?pattern:attr.pattern);
var G__52776 = id;
return (datascript.pull_api.attrs_frame.cljs$core$IFn$_invoke$arity$5 ? datascript.pull_api.attrs_frame.cljs$core$IFn$_invoke$arity$5(G__52772,G__52773,G__52774,G__52775,G__52776) : datascript.pull_api.attrs_frame.call(null,G__52772,G__52773,G__52774,G__52775,G__52776));

}
}
}
});
datascript.pull_api.attrs_frame = (function datascript$pull_api$attrs_frame(context,seen,recursion_limits,pattern,id){
var db = context.db;
var datoms = (function (){if(cljs.core.truth_((function (){var and__5000__auto__ = pattern.wildcard_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return (((db instanceof datascript.db.DB)) && (true));
} else {
return and__5000__auto__;
}
})())){
return me.tonsky.persistent_sorted_set.slice.cljs$core$IFn$_invoke$arity$3(db.eavt,datascript.db.datom.cljs$core$IFn$_invoke$arity$4(id,null,null,(536870912)),datascript.db.datom.cljs$core$IFn$_invoke$arity$4(id,null,null,(2147483647)));
} else {
if(cljs.core.truth_(pattern.wildcard_QMARK_)){
return datascript.db._search(db,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [id], null));
} else {
if((pattern.first_attr == null)){
return null;
} else {
var from = pattern.first_attr.name;
var to = pattern.last_attr.name;
if((db instanceof datascript.db.DB)){
return me.tonsky.persistent_sorted_set.slice.cljs$core$IFn$_invoke$arity$3(db.eavt,datascript.db.datom.cljs$core$IFn$_invoke$arity$4(id,from,null,(536870912)),datascript.db.datom.cljs$core$IFn$_invoke$arity$4(id,to,null,(2147483647)));
} else {
return datascript.db._seek_datoms(db,new cljs.core.Keyword(null,"eavt","eavt",-666437073),id,null,null,null);

}
}
}
}
})();
if(cljs.core.truth_(pattern.wildcard_QMARK_)){
datascript.pull_api.visit(context,new cljs.core.Keyword("db.pull","wildcard","db.pull/wildcard",116316031),id,null,null);
} else {
}

return (new datascript.pull_api.AttrsFrame(seen,recursion_limits,cljs.core.transient$(cljs.core.PersistentArrayMap.EMPTY),pattern,datascript.pull_api.first_seq(pattern.attrs),datascript.pull_api.next_seq(pattern.attrs),datoms,id,null,null,null));
});
datascript.pull_api.pull_impl = (function datascript$pull_api$pull_impl(parsed_opts,id){
var map__52857 = parsed_opts;
var map__52857__$1 = cljs.core.__destructure_map(map__52857);
var context = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__52857__$1,new cljs.core.Keyword(null,"context","context",-830191113));
var pattern = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__52857__$1,new cljs.core.Keyword(null,"pattern","pattern",242135423));
var temp__5808__auto__ = datascript.db.entid(context.db,id);
if((temp__5808__auto__ == null)){
return null;
} else {
var eid = temp__5808__auto__;
var stack = (new cljs.core.List(null,datascript.pull_api.attrs_frame(context,cljs.core.PersistentHashSet.EMPTY,cljs.core.PersistentArrayMap.EMPTY,pattern,eid),null,(1),null));
while(true){
var last = datascript.pull_api.first_seq(stack);
var stack_SINGLEQUOTE_ = datascript.pull_api.next_seq(stack);
if((!((last instanceof datascript.pull_api.ResultFrame)))){
var G__53282 = cljs.core.reduce.cljs$core$IFn$_invoke$arity$3(datascript.pull_api.conj_seq,stack_SINGLEQUOTE_,datascript.pull_api._run(last,context));
stack = G__53282;
continue;
} else {
if((stack_SINGLEQUOTE_ == null)){
return last.value;
} else {
var penultimate = datascript.pull_api.first_seq(stack_SINGLEQUOTE_);
var stack_SINGLEQUOTE__SINGLEQUOTE_ = datascript.pull_api.next_seq(stack_SINGLEQUOTE_);
var G__53283 = datascript.pull_api.conj_seq(stack_SINGLEQUOTE__SINGLEQUOTE_,datascript.pull_api._merge(penultimate,last));
stack = G__53283;
continue;

}
}
break;
}
}
});
datascript.pull_api.parse_opts = (function datascript$pull_api$parse_opts(var_args){
var G__52909 = arguments.length;
switch (G__52909) {
case 2:
return datascript.pull_api.parse_opts.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return datascript.pull_api.parse_opts.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(datascript.pull_api.parse_opts.cljs$core$IFn$_invoke$arity$2 = (function (db,pattern){
return datascript.pull_api.parse_opts.cljs$core$IFn$_invoke$arity$3(db,pattern,null);
}));

(datascript.pull_api.parse_opts.cljs$core$IFn$_invoke$arity$3 = (function (db,pattern,p__52930){
var map__52934 = p__52930;
var map__52934__$1 = cljs.core.__destructure_map(map__52934);
var visitor = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__52934__$1,new cljs.core.Keyword(null,"visitor","visitor",-1026865865));
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"pattern","pattern",242135423),datascript.lru._get(datascript.db.unfiltered_db(db).pull_patterns,pattern,(function (){
return datascript.pull_parser.parse_pattern(db,pattern);
})),new cljs.core.Keyword(null,"context","context",-830191113),(new datascript.pull_api.Context(db,visitor,null,null,null))], null);
}));

(datascript.pull_api.parse_opts.cljs$lang$maxFixedArity = 3);

/**
 * Supported opts:
 * 
 * :visitor a fn of 4 arguments, will be called for every entity/attribute pull touches
 * 
 * (:db.pull/attr     e   a   nil) - when pulling a normal attribute, no matter if it has value or not
 * (:db.pull/wildcard e   nil nil) - when pulling every attribute on an entity
 * (:db.pull/reverse  nil a   v  ) - when pulling reverse attribute
 */
datascript.pull_api.pull = (function datascript$pull_api$pull(var_args){
var G__52940 = arguments.length;
switch (G__52940) {
case 3:
return datascript.pull_api.pull.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
case 4:
return datascript.pull_api.pull.cljs$core$IFn$_invoke$arity$4((arguments[(0)]),(arguments[(1)]),(arguments[(2)]),(arguments[(3)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(datascript.pull_api.pull.cljs$core$IFn$_invoke$arity$3 = (function (db,pattern,id){
return datascript.pull_api.pull.cljs$core$IFn$_invoke$arity$4(db,pattern,id,cljs.core.PersistentArrayMap.EMPTY);
}));

(datascript.pull_api.pull.cljs$core$IFn$_invoke$arity$4 = (function (db,pattern,id,opts){
if(datascript.db.db_QMARK_(db)){
} else {
throw (new Error("Assert failed: (db/db? db)"));
}

var parsed_opts = datascript.pull_api.parse_opts.cljs$core$IFn$_invoke$arity$3(db,pattern,opts);
return datascript.pull_api.pull_impl(parsed_opts,id);
}));

(datascript.pull_api.pull.cljs$lang$maxFixedArity = 4);

datascript.pull_api.pull_many = (function datascript$pull_api$pull_many(var_args){
var G__52983 = arguments.length;
switch (G__52983) {
case 3:
return datascript.pull_api.pull_many.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
case 4:
return datascript.pull_api.pull_many.cljs$core$IFn$_invoke$arity$4((arguments[(0)]),(arguments[(1)]),(arguments[(2)]),(arguments[(3)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(datascript.pull_api.pull_many.cljs$core$IFn$_invoke$arity$3 = (function (db,pattern,ids){
return datascript.pull_api.pull_many.cljs$core$IFn$_invoke$arity$4(db,pattern,ids,cljs.core.PersistentArrayMap.EMPTY);
}));

(datascript.pull_api.pull_many.cljs$core$IFn$_invoke$arity$4 = (function (db,pattern,ids,opts){
if(datascript.db.db_QMARK_(db)){
} else {
throw (new Error("Assert failed: (db/db? db)"));
}

var parsed_opts = datascript.pull_api.parse_opts.cljs$core$IFn$_invoke$arity$3(db,pattern,opts);
return cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (p1__52981_SHARP_){
return datascript.pull_api.pull_impl(parsed_opts,p1__52981_SHARP_);
}),ids);
}));

(datascript.pull_api.pull_many.cljs$lang$maxFixedArity = 4);


//# sourceMappingURL=datascript.pull_api.js.map
