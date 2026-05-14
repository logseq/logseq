goog.provide('datascript.storage');

/**
 * @interface
 */
datascript.storage.IStorage = function(){};

var datascript$storage$IStorage$_store$dyn_56536 = (function (_,addr_PLUS_data_seq,delete_addrs){
var x__5350__auto__ = (((_ == null))?null:_);
var m__5351__auto__ = (datascript.storage._store[goog.typeOf(x__5350__auto__)]);
if((!((m__5351__auto__ == null)))){
return (m__5351__auto__.cljs$core$IFn$_invoke$arity$3 ? m__5351__auto__.cljs$core$IFn$_invoke$arity$3(_,addr_PLUS_data_seq,delete_addrs) : m__5351__auto__.call(null,_,addr_PLUS_data_seq,delete_addrs));
} else {
var m__5349__auto__ = (datascript.storage._store["_"]);
if((!((m__5349__auto__ == null)))){
return (m__5349__auto__.cljs$core$IFn$_invoke$arity$3 ? m__5349__auto__.cljs$core$IFn$_invoke$arity$3(_,addr_PLUS_data_seq,delete_addrs) : m__5349__auto__.call(null,_,addr_PLUS_data_seq,delete_addrs));
} else {
throw cljs.core.missing_protocol("IStorage.-store",_);
}
}
});
/**
 * Gives you a sequence of `[addr data]` pairs to serialize and store.
 * 
 *   `addr`s are 64 bit integers.
 *   `data`s are clojure-serializable data structure (maps, keywords, lists, integers etc)
 */
datascript.storage._store = (function datascript$storage$_store(_,addr_PLUS_data_seq,delete_addrs){
if((((!((_ == null)))) && ((!((_.datascript$storage$IStorage$_store$arity$3 == null)))))){
return _.datascript$storage$IStorage$_store$arity$3(_,addr_PLUS_data_seq,delete_addrs);
} else {
return datascript$storage$IStorage$_store$dyn_56536(_,addr_PLUS_data_seq,delete_addrs);
}
});

var datascript$storage$IStorage$_restore$dyn_56543 = (function (_,addr){
var x__5350__auto__ = (((_ == null))?null:_);
var m__5351__auto__ = (datascript.storage._restore[goog.typeOf(x__5350__auto__)]);
if((!((m__5351__auto__ == null)))){
return (m__5351__auto__.cljs$core$IFn$_invoke$arity$2 ? m__5351__auto__.cljs$core$IFn$_invoke$arity$2(_,addr) : m__5351__auto__.call(null,_,addr));
} else {
var m__5349__auto__ = (datascript.storage._restore["_"]);
if((!((m__5349__auto__ == null)))){
return (m__5349__auto__.cljs$core$IFn$_invoke$arity$2 ? m__5349__auto__.cljs$core$IFn$_invoke$arity$2(_,addr) : m__5349__auto__.call(null,_,addr));
} else {
throw cljs.core.missing_protocol("IStorage.-restore",_);
}
}
});
/**
 * Read back and deserialize data stored under single `addr`
 */
datascript.storage._restore = (function datascript$storage$_restore(_,addr){
if((((!((_ == null)))) && ((!((_.datascript$storage$IStorage$_restore$arity$2 == null)))))){
return _.datascript$storage$IStorage$_restore$arity$2(_,addr);
} else {
return datascript$storage$IStorage$_restore$dyn_56543(_,addr);
}
});

datascript.storage._STAR_delete_buffer = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
datascript.storage.serializable_datom = (function datascript$storage$serializable_datom(d){
return new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [d.e,d.a,d.v,d.tx], null);
});
datascript.storage.root_addr = (0);
datascript.storage.tail_addr = (1);
if((typeof datascript !== 'undefined') && (typeof datascript.storage !== 'undefined') && (typeof datascript.storage._STAR_max_addr !== 'undefined')){
} else {
datascript.storage._STAR_max_addr = cljs.core.volatile_BANG_((1000000));
}
datascript.storage.gen_addr = (function datascript$storage$gen_addr(){
return datascript.storage._STAR_max_addr.cljs$core$IVolatile$_vreset_BANG_$arity$2(null,(datascript.storage._STAR_max_addr.cljs$core$IDeref$_deref$arity$1(null) + (1)));
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
 * @implements {me.tonsky.persistent_sorted_set.protocol.IStorage}
 * @implements {cljs.core.IWithMeta}
 * @implements {cljs.core.IAssociative}
 * @implements {cljs.core.IMap}
 * @implements {cljs.core.ILookup}
*/
datascript.storage.StorageAdapter = (function (storage,__meta,__extmap,__hash){
this.storage = storage;
this.__meta = __meta;
this.__extmap = __extmap;
this.__hash = __hash;
this.cljs$lang$protocol_mask$partition0$ = 2230716170;
this.cljs$lang$protocol_mask$partition1$ = 139264;
});
(datascript.storage.StorageAdapter.prototype.cljs$core$ILookup$_lookup$arity$2 = (function (this__5300__auto__,k__5301__auto__){
var self__ = this;
var this__5300__auto____$1 = this;
return this__5300__auto____$1.cljs$core$ILookup$_lookup$arity$3(null,k__5301__auto__,null);
}));

(datascript.storage.StorageAdapter.prototype.cljs$core$ILookup$_lookup$arity$3 = (function (this__5302__auto__,k56317,else__5303__auto__){
var self__ = this;
var this__5302__auto____$1 = this;
var G__56334 = k56317;
var G__56334__$1 = (((G__56334 instanceof cljs.core.Keyword))?G__56334.fqn:null);
switch (G__56334__$1) {
case "storage":
return self__.storage;

break;
default:
return cljs.core.get.cljs$core$IFn$_invoke$arity$3(self__.__extmap,k56317,else__5303__auto__);

}
}));

(datascript.storage.StorageAdapter.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = (function (this__5320__auto__,f__5321__auto__,init__5322__auto__){
var self__ = this;
var this__5320__auto____$1 = this;
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (ret__5323__auto__,p__56341){
var vec__56342 = p__56341;
var k__5324__auto__ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__56342,(0),null);
var v__5325__auto__ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__56342,(1),null);
return (f__5321__auto__.cljs$core$IFn$_invoke$arity$3 ? f__5321__auto__.cljs$core$IFn$_invoke$arity$3(ret__5323__auto__,k__5324__auto__,v__5325__auto__) : f__5321__auto__.call(null,ret__5323__auto__,k__5324__auto__,v__5325__auto__));
}),init__5322__auto__,this__5320__auto____$1);
}));

(datascript.storage.StorageAdapter.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = (function (this__5315__auto__,writer__5316__auto__,opts__5317__auto__){
var self__ = this;
var this__5315__auto____$1 = this;
var pr_pair__5318__auto__ = (function (keyval__5319__auto__){
return cljs.core.pr_sequential_writer(writer__5316__auto__,cljs.core.pr_writer,""," ","",opts__5317__auto__,keyval__5319__auto__);
});
return cljs.core.pr_sequential_writer(writer__5316__auto__,pr_pair__5318__auto__,"#datascript.storage.StorageAdapter{",", ","}",opts__5317__auto__,cljs.core.concat.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [(new cljs.core.PersistentVector(null,2,(5),cljs.core.PersistentVector.EMPTY_NODE,[new cljs.core.Keyword(null,"storage","storage",1867247511),self__.storage],null))], null),self__.__extmap));
}));

(datascript.storage.StorageAdapter.prototype.cljs$core$IIterable$_iterator$arity$1 = (function (G__56316){
var self__ = this;
var G__56316__$1 = this;
return (new cljs.core.RecordIter((0),G__56316__$1,1,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"storage","storage",1867247511)], null),(cljs.core.truth_(self__.__extmap)?cljs.core._iterator(self__.__extmap):cljs.core.nil_iter())));
}));

(datascript.storage.StorageAdapter.prototype.cljs$core$IMeta$_meta$arity$1 = (function (this__5298__auto__){
var self__ = this;
var this__5298__auto____$1 = this;
return self__.__meta;
}));

(datascript.storage.StorageAdapter.prototype.cljs$core$ICloneable$_clone$arity$1 = (function (this__5295__auto__){
var self__ = this;
var this__5295__auto____$1 = this;
return (new datascript.storage.StorageAdapter(self__.storage,self__.__meta,self__.__extmap,self__.__hash));
}));

(datascript.storage.StorageAdapter.prototype.cljs$core$ICounted$_count$arity$1 = (function (this__5304__auto__){
var self__ = this;
var this__5304__auto____$1 = this;
return (1 + cljs.core.count(self__.__extmap));
}));

(datascript.storage.StorageAdapter.prototype.cljs$core$IHash$_hash$arity$1 = (function (this__5296__auto__){
var self__ = this;
var this__5296__auto____$1 = this;
var h__5111__auto__ = self__.__hash;
if((!((h__5111__auto__ == null)))){
return h__5111__auto__;
} else {
var h__5111__auto____$1 = (function (coll__5297__auto__){
return (1627330428 ^ cljs.core.hash_unordered_coll(coll__5297__auto__));
})(this__5296__auto____$1);
(self__.__hash = h__5111__auto____$1);

return h__5111__auto____$1;
}
}));

(datascript.storage.StorageAdapter.prototype.cljs$core$IEquiv$_equiv$arity$2 = (function (this56318,other56319){
var self__ = this;
var this56318__$1 = this;
return (((!((other56319 == null)))) && ((((this56318__$1.constructor === other56319.constructor)) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(this56318__$1.storage,other56319.storage)) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(this56318__$1.__extmap,other56319.__extmap)))))));
}));

(datascript.storage.StorageAdapter.prototype.cljs$core$IMap$_dissoc$arity$2 = (function (this__5310__auto__,k__5311__auto__){
var self__ = this;
var this__5310__auto____$1 = this;
if(cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"storage","storage",1867247511),null], null), null),k__5311__auto__)){
return cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(cljs.core._with_meta(cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,this__5310__auto____$1),self__.__meta),k__5311__auto__);
} else {
return (new datascript.storage.StorageAdapter(self__.storage,self__.__meta,cljs.core.not_empty(cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(self__.__extmap,k__5311__auto__)),null));
}
}));

(datascript.storage.StorageAdapter.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = (function (this__5307__auto__,k56317){
var self__ = this;
var this__5307__auto____$1 = this;
var G__56376 = k56317;
var G__56376__$1 = (((G__56376 instanceof cljs.core.Keyword))?G__56376.fqn:null);
switch (G__56376__$1) {
case "storage":
return true;

break;
default:
return cljs.core.contains_QMARK_(self__.__extmap,k56317);

}
}));

(datascript.storage.StorageAdapter.prototype.cljs$core$IAssociative$_assoc$arity$3 = (function (this__5308__auto__,k__5309__auto__,G__56316){
var self__ = this;
var this__5308__auto____$1 = this;
var pred__56388 = cljs.core.keyword_identical_QMARK_;
var expr__56389 = k__5309__auto__;
if(cljs.core.truth_((pred__56388.cljs$core$IFn$_invoke$arity$2 ? pred__56388.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"storage","storage",1867247511),expr__56389) : pred__56388.call(null,new cljs.core.Keyword(null,"storage","storage",1867247511),expr__56389)))){
return (new datascript.storage.StorageAdapter(G__56316,self__.__meta,self__.__extmap,null));
} else {
return (new datascript.storage.StorageAdapter(self__.storage,self__.__meta,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(self__.__extmap,k__5309__auto__,G__56316),null));
}
}));

(datascript.storage.StorageAdapter.prototype.cljs$core$ISeqable$_seq$arity$1 = (function (this__5313__auto__){
var self__ = this;
var this__5313__auto____$1 = this;
return cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [(new cljs.core.MapEntry(new cljs.core.Keyword(null,"storage","storage",1867247511),self__.storage,null))], null),self__.__extmap));
}));

(datascript.storage.StorageAdapter.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = (function (this__5299__auto__,G__56316){
var self__ = this;
var this__5299__auto____$1 = this;
return (new datascript.storage.StorageAdapter(self__.storage,G__56316,self__.__extmap,self__.__hash));
}));

(datascript.storage.StorageAdapter.prototype.cljs$core$ICollection$_conj$arity$2 = (function (this__5305__auto__,entry__5306__auto__){
var self__ = this;
var this__5305__auto____$1 = this;
if(cljs.core.vector_QMARK_(entry__5306__auto__)){
return this__5305__auto____$1.cljs$core$IAssociative$_assoc$arity$3(null,cljs.core._nth(entry__5306__auto__,(0)),cljs.core._nth(entry__5306__auto__,(1)));
} else {
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3(cljs.core._conj,this__5305__auto____$1,entry__5306__auto__);
}
}));

(datascript.storage.StorageAdapter.prototype.me$tonsky$persistent_sorted_set$protocol$IStorage$ = cljs.core.PROTOCOL_SENTINEL);

(datascript.storage.StorageAdapter.prototype.me$tonsky$persistent_sorted_set$protocol$IStorage$store$arity$3 = (function (_,node,address){
var self__ = this;
var ___$1 = this;
var addr = (cljs.core.truth_((function (){var and__5000__auto__ = address;
if(cljs.core.truth_(and__5000__auto__)){
return (((node instanceof me.tonsky.persistent_sorted_set.Node)) && (cljs.core.contains_QMARK_(cljs.core.set(node._addresses),address)));
} else {
return and__5000__auto__;
}
})())?datascript.storage.gen_addr():(function (){var or__5002__auto__ = address;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return datascript.storage.gen_addr();
}
})()
);
var keys = cljs.core.mapv.cljs$core$IFn$_invoke$arity$2(datascript.storage.serializable_datom,node.keys);
var data = (function (){var G__56418 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"keys","keys",1068423698),keys], null);
if((node instanceof me.tonsky.persistent_sorted_set.Node)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__56418,new cljs.core.Keyword(null,"addresses","addresses",-559529694),node._addresses);
} else {
return G__56418;
}
})();
cljs.core._vreset_BANG_(datascript.storage._STAR_store_buffer_STAR_,cljs.core.conj_BANG_.cljs$core$IFn$_invoke$arity$2(cljs.core._deref(datascript.storage._STAR_store_buffer_STAR_),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [addr,data], null)));

return addr;
}));

(datascript.storage.StorageAdapter.prototype.me$tonsky$persistent_sorted_set$protocol$IStorage$restore$arity$2 = (function (_,addr){
var self__ = this;
var ___$1 = this;
if(cljs.core.truth_(addr)){
var map__56422 = datascript.storage._restore(self__.storage,addr);
var map__56422__$1 = cljs.core.__destructure_map(map__56422);
var keys = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__56422__$1,new cljs.core.Keyword(null,"keys","keys",1068423698));
var addresses = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__56422__$1,new cljs.core.Keyword(null,"addresses","addresses",-559529694));
if(cljs.core.truth_(keys)){
var keys_SINGLEQUOTE_ = me.tonsky.persistent_sorted_set.arrays.into_array(cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p__56426){
var vec__56427 = p__56426;
var e = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__56427,(0),null);
var a = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__56427,(1),null);
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__56427,(2),null);
var tx = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__56427,(3),null);
return datascript.db.datom.cljs$core$IFn$_invoke$arity$4(e,a,v,tx);
}),keys));
if(cljs.core.truth_(addresses)){
var children = me.tonsky.persistent_sorted_set.arrays.make_array(cljs.core.count(addresses));
return me.tonsky.persistent_sorted_set.new_node.cljs$core$IFn$_invoke$arity$5(keys_SINGLEQUOTE_,children,addresses,addr,false);
} else {
return me.tonsky.persistent_sorted_set.new_leaf.cljs$core$IFn$_invoke$arity$3(keys_SINGLEQUOTE_,addr,false);
}
} else {
return null;
}
} else {
return null;
}
}));

(datascript.storage.StorageAdapter.prototype.me$tonsky$persistent_sorted_set$protocol$IStorage$accessed$arity$2 = (function (_,_addr){
var self__ = this;
var ___$1 = this;
return null;
}));

(datascript.storage.StorageAdapter.prototype.me$tonsky$persistent_sorted_set$protocol$IStorage$delete$arity$2 = (function (_,unused_addresses){
var self__ = this;
var ___$1 = this;
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(datascript.storage._STAR_delete_buffer,cljs.core.update,self__.storage,(function (buffer){
return cljs.core.into.cljs$core$IFn$_invoke$arity$2(buffer,cljs.core.remove.cljs$core$IFn$_invoke$arity$2(cljs.core.nil_QMARK_,unused_addresses));
}));
}));

(datascript.storage.StorageAdapter.getBasis = (function (){
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"storage","storage",-787188258,null)], null);
}));

(datascript.storage.StorageAdapter.cljs$lang$type = true);

(datascript.storage.StorageAdapter.cljs$lang$ctorPrSeq = (function (this__5346__auto__){
return (new cljs.core.List(null,"datascript.storage/StorageAdapter",null,(1),null));
}));

(datascript.storage.StorageAdapter.cljs$lang$ctorPrWriter = (function (this__5346__auto__,writer__5347__auto__){
return cljs.core._write(writer__5347__auto__,"datascript.storage/StorageAdapter");
}));

/**
 * Positional factory function for datascript.storage/StorageAdapter.
 */
datascript.storage.__GT_StorageAdapter = (function datascript$storage$__GT_StorageAdapter(storage){
return (new datascript.storage.StorageAdapter(storage,null,null,null));
});

/**
 * Factory function for datascript.storage/StorageAdapter, taking a map of keywords to field values.
 */
datascript.storage.map__GT_StorageAdapter = (function datascript$storage$map__GT_StorageAdapter(G__56328){
var extmap__5342__auto__ = (function (){var G__56441 = cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(G__56328,new cljs.core.Keyword(null,"storage","storage",1867247511));
if(cljs.core.record_QMARK_(G__56328)){
return cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,G__56441);
} else {
return G__56441;
}
})();
return (new datascript.storage.StorageAdapter(new cljs.core.Keyword(null,"storage","storage",1867247511).cljs$core$IFn$_invoke$arity$1(G__56328),null,cljs.core.not_empty(extmap__5342__auto__),null));
});

datascript.storage.make_storage_adapter = (function datascript$storage$make_storage_adapter(storage,_opts){
return (new datascript.storage.StorageAdapter(storage,null,null,null));
});
datascript.storage.storage_adapter = (function datascript$storage$storage_adapter(db){
if(cljs.core.truth_(db)){
return new cljs.core.Keyword(null,"eavt","eavt",-666437073).cljs$core$IFn$_invoke$arity$1(db).storage;
} else {
return null;
}
});
datascript.storage.storage = (function datascript$storage$storage(db){
var temp__5808__auto__ = datascript.storage.storage_adapter(db);
if((temp__5808__auto__ == null)){
return null;
} else {
var adapter = temp__5808__auto__;
return new cljs.core.Keyword(null,"storage","storage",1867247511).cljs$core$IFn$_invoke$arity$1(adapter);
}
});
datascript.storage.stored_dbs = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentVector.EMPTY);
datascript.storage.remember_db = (function datascript$storage$remember_db(db){
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$3(datascript.storage.stored_dbs,cljs.core.conj,db);
});
datascript.storage.store_impl_BANG_ = (function datascript$storage$store_impl_BANG_(db,adapter,force_QMARK_){
datascript.storage.remember_db(db);

var _STAR_store_buffer_STAR__orig_val__56452 = datascript.storage._STAR_store_buffer_STAR_;
var _STAR_store_buffer_STAR__temp_val__56453 = cljs.core.volatile_BANG_(cljs.core.transient$(cljs.core.PersistentVector.EMPTY));
(datascript.storage._STAR_store_buffer_STAR_ = _STAR_store_buffer_STAR__temp_val__56453);

try{var eavt_set = new cljs.core.Keyword(null,"eavt","eavt",-666437073).cljs$core$IFn$_invoke$arity$1(db);
var aevt_set = new cljs.core.Keyword(null,"aevt","aevt",-585148059).cljs$core$IFn$_invoke$arity$1(db);
var avet_set = new cljs.core.Keyword(null,"avet","avet",1383857032).cljs$core$IFn$_invoke$arity$1(db);
var eavt_addr = me.tonsky.persistent_sorted_set.store.cljs$core$IFn$_invoke$arity$2(eavt_set,adapter);
var aevt_addr = me.tonsky.persistent_sorted_set.store.cljs$core$IFn$_invoke$arity$2(aevt_set,adapter);
var avet_addr = me.tonsky.persistent_sorted_set.store.cljs$core$IFn$_invoke$arity$2(avet_set,adapter);
var meta = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.PersistentHashMap.fromArrays([new cljs.core.Keyword(null,"schema","schema",-1582001791),new cljs.core.Keyword(null,"max-tx","max-tx",1119558339),new cljs.core.Keyword(null,"aevt","aevt",-585148059),new cljs.core.Keyword(null,"max-addr","max-addr",1373100454),new cljs.core.Keyword(null,"avet","avet",1383857032),new cljs.core.Keyword(null,"max-eid","max-eid",2134868075),new cljs.core.Keyword(null,"eavt","eavt",-666437073),new cljs.core.Keyword(null,"aevt-metadata","aevt-metadata",-1844063817),new cljs.core.Keyword(null,"avet-metadata","avet-metadata",1556019837),new cljs.core.Keyword(null,"eavt-metadata","eavt-metadata",-1384819842)],[new cljs.core.Keyword(null,"schema","schema",-1582001791).cljs$core$IFn$_invoke$arity$1(db),new cljs.core.Keyword(null,"max-tx","max-tx",1119558339).cljs$core$IFn$_invoke$arity$1(db),aevt_addr,cljs.core.deref(datascript.storage._STAR_max_addr),avet_addr,new cljs.core.Keyword(null,"max-eid","max-eid",2134868075).cljs$core$IFn$_invoke$arity$1(db),eavt_addr,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"count","count",2139924085),aevt_set.cnt,new cljs.core.Keyword(null,"shift","shift",997140064),aevt_set.shift], null),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"count","count",2139924085),avet_set.cnt,new cljs.core.Keyword(null,"shift","shift",997140064),avet_set.shift], null),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"count","count",2139924085),eavt_set.cnt,new cljs.core.Keyword(null,"shift","shift",997140064),eavt_set.shift], null)]),me.tonsky.persistent_sorted_set.settings(new cljs.core.Keyword(null,"eavt","eavt",-666437073).cljs$core$IFn$_invoke$arity$1(db))], 0));
if(cljs.core.truth_((function (){var or__5002__auto__ = force_QMARK_;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return (cljs.core.count(cljs.core.deref(datascript.storage._STAR_store_buffer_STAR_)) > (0));
}
})())){
cljs.core._vreset_BANG_(datascript.storage._STAR_store_buffer_STAR_,cljs.core.conj_BANG_.cljs$core$IFn$_invoke$arity$2(cljs.core._deref(datascript.storage._STAR_store_buffer_STAR_),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [datascript.storage.root_addr,meta], null)));

cljs.core._vreset_BANG_(datascript.storage._STAR_store_buffer_STAR_,cljs.core.conj_BANG_.cljs$core$IFn$_invoke$arity$2(cljs.core._deref(datascript.storage._STAR_store_buffer_STAR_),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [datascript.storage.tail_addr,cljs.core.PersistentVector.EMPTY], null)));

var storage_56606 = new cljs.core.Keyword(null,"storage","storage",1867247511).cljs$core$IFn$_invoke$arity$1(adapter);
var delete_addrs_56607 = cljs.core.distinct.cljs$core$IFn$_invoke$arity$1(cljs.core.get.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(datascript.storage._STAR_delete_buffer),storage_56606));
var __56608 = cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(datascript.storage._STAR_delete_buffer,cljs.core.assoc,storage_56606,null);
datascript.storage._store(storage_56606,cljs.core.persistent_BANG_(cljs.core.deref(datascript.storage._STAR_store_buffer_STAR_)),delete_addrs_56607);
} else {
}

return db;
}finally {(datascript.storage._STAR_store_buffer_STAR_ = _STAR_store_buffer_STAR__orig_val__56452);
}});
datascript.storage.store = (function datascript$storage$store(var_args){
var G__56475 = arguments.length;
switch (G__56475) {
case 1:
return datascript.storage.store.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return datascript.storage.store.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(datascript.storage.store.cljs$core$IFn$_invoke$arity$1 = (function (db){
var temp__5806__auto__ = datascript.storage.storage_adapter(db);
if((temp__5806__auto__ == null)){
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2("Database has no associated storage",cljs.core.PersistentArrayMap.EMPTY);
} else {
var adapter = temp__5806__auto__;
return datascript.storage.store_impl_BANG_(db,adapter,false);
}
}));

(datascript.storage.store.cljs$core$IFn$_invoke$arity$2 = (function (db,storage){
var temp__5806__auto__ = datascript.storage.storage_adapter(db);
if((temp__5806__auto__ == null)){
var settings = new cljs.core.Keyword(null,"eavt","eavt",-666437073).cljs$core$IFn$_invoke$arity$1(db)._settings;
var adapter = (new datascript.storage.StorageAdapter(storage,null,null,null));
return datascript.storage.store_impl_BANG_(db,adapter,false);
} else {
var adapter = temp__5806__auto__;
var current_storage = new cljs.core.Keyword(null,"storage","storage",1867247511).cljs$core$IFn$_invoke$arity$1(adapter);
if((current_storage === storage)){
return datascript.storage.store_impl_BANG_(db,adapter,false);
} else {
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2("Database is already stored with another IStorage",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"storage","storage",1867247511),current_storage], null));
}
}
}));

(datascript.storage.store.cljs$lang$maxFixedArity = 2);

datascript.storage.store_tail = (function datascript$storage$store_tail(db,tail){
return datascript.storage._store(datascript.storage.storage(db),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [datascript.storage.tail_addr,cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (p1__56484_SHARP_){
return cljs.core.mapv.cljs$core$IFn$_invoke$arity$2(datascript.storage.serializable_datom,p1__56484_SHARP_);
}),tail)], null)], null),null);
});
datascript.storage.restore_impl = (function datascript$storage$restore_impl(storage,opts){
var temp__5808__auto__ = datascript.storage._restore(storage,datascript.storage.root_addr);
if((temp__5808__auto__ == null)){
return null;
} else {
var root = temp__5808__auto__;
var tail = datascript.storage._restore(storage,datascript.storage.tail_addr);
var map__56489 = root;
var map__56489__$1 = cljs.core.__destructure_map(map__56489);
var avet_metadata = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__56489__$1,new cljs.core.Keyword(null,"avet-metadata","avet-metadata",1556019837));
var eavt_metadata = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__56489__$1,new cljs.core.Keyword(null,"eavt-metadata","eavt-metadata",-1384819842));
var schema = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__56489__$1,new cljs.core.Keyword(null,"schema","schema",-1582001791));
var max_tx = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__56489__$1,new cljs.core.Keyword(null,"max-tx","max-tx",1119558339));
var aevt = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__56489__$1,new cljs.core.Keyword(null,"aevt","aevt",-585148059));
var max_addr = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__56489__$1,new cljs.core.Keyword(null,"max-addr","max-addr",1373100454));
var avet = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__56489__$1,new cljs.core.Keyword(null,"avet","avet",1383857032));
var max_eid = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__56489__$1,new cljs.core.Keyword(null,"max-eid","max-eid",2134868075));
var eavt = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__56489__$1,new cljs.core.Keyword(null,"eavt","eavt",-666437073));
var aevt_metadata = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__56489__$1,new cljs.core.Keyword(null,"aevt-metadata","aevt-metadata",-1844063817));
var _ = datascript.storage._STAR_max_addr.cljs$core$IVolatile$_vreset_BANG_$arity$2(null,(function (){var x__5087__auto__ = datascript.storage._STAR_max_addr.cljs$core$IDeref$_deref$arity$1(null);
var y__5088__auto__ = max_addr;
return ((x__5087__auto__ > y__5088__auto__) ? x__5087__auto__ : y__5088__auto__);
})());
var opts__$1 = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([root,opts], 0));
var adapter = datascript.storage.make_storage_adapter(storage,opts__$1);
var db = datascript.db.restore_db(new cljs.core.PersistentArrayMap(null, 6, [new cljs.core.Keyword(null,"schema","schema",-1582001791),schema,new cljs.core.Keyword(null,"eavt","eavt",-666437073),me.tonsky.persistent_sorted_set.restore_by.cljs$core$IFn$_invoke$arity$4(datascript.db.cmp_datoms_eavt,eavt,adapter,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(opts__$1,new cljs.core.Keyword(null,"set-metadata","set-metadata",1293757705),eavt_metadata)),new cljs.core.Keyword(null,"aevt","aevt",-585148059),me.tonsky.persistent_sorted_set.restore_by.cljs$core$IFn$_invoke$arity$4(datascript.db.cmp_datoms_aevt,aevt,adapter,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(opts__$1,new cljs.core.Keyword(null,"set-metadata","set-metadata",1293757705),aevt_metadata)),new cljs.core.Keyword(null,"avet","avet",1383857032),me.tonsky.persistent_sorted_set.restore_by.cljs$core$IFn$_invoke$arity$4(datascript.db.cmp_datoms_avet,avet,adapter,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(opts__$1,new cljs.core.Keyword(null,"set-metadata","set-metadata",1293757705),avet_metadata)),new cljs.core.Keyword(null,"max-eid","max-eid",2134868075),max_eid,new cljs.core.Keyword(null,"max-tx","max-tx",1119558339),max_tx], null));
datascript.storage.remember_db(db);

return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [db,cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (p1__56488_SHARP_){
return cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (p__56497){
var vec__56499 = p__56497;
var e = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__56499,(0),null);
var a = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__56499,(1),null);
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__56499,(2),null);
var tx = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__56499,(3),null);
var datom_exists_QMARK_ = (!((datascript.db._datoms(db,new cljs.core.Keyword(null,"eavt","eavt",-666437073),e,a,v,null) == null)));
var added_QMARK_ = (tx > (0));
if(((datom_exists_QMARK_) && (added_QMARK_))){
return null;
} else {
return datascript.db.datom.cljs$core$IFn$_invoke$arity$4(e,a,v,tx);
}
}),p1__56488_SHARP_);
}),tail)], null);
}
});
datascript.storage.db_with_tail = (function datascript$storage$db_with_tail(db,tail){
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (db__$1,datoms){
if(cljs.core.empty_QMARK_(datoms)){
return db__$1;
} else {
try{var _PERCENT_ = db__$1;
var _PERCENT___$1 = cljs.core.reduce.cljs$core$IFn$_invoke$arity$3(datascript.db.with_datom,_PERCENT_,datoms);
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(_PERCENT___$1,new cljs.core.Keyword(null,"max-tx","max-tx",1119558339),new cljs.core.Keyword(null,"tx","tx",466630418).cljs$core$IFn$_invoke$arity$1(cljs.core.first(datoms)));
}catch (e56503){var e = e56503;
console.error(e);

return db__$1;
}}
}),db,tail);
});
datascript.storage.restore = (function datascript$storage$restore(var_args){
var G__56505 = arguments.length;
switch (G__56505) {
case 1:
return datascript.storage.restore.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return datascript.storage.restore.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(datascript.storage.restore.cljs$core$IFn$_invoke$arity$1 = (function (storage){
return datascript.storage.restore.cljs$core$IFn$_invoke$arity$2(storage,cljs.core.PersistentArrayMap.EMPTY);
}));

(datascript.storage.restore.cljs$core$IFn$_invoke$arity$2 = (function (storage,opts){
var vec__56519 = datascript.storage.restore_impl(storage,opts);
var db = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__56519,(0),null);
var tail = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__56519,(1),null);
return datascript.storage.db_with_tail(db,tail);
}));

(datascript.storage.restore.cljs$lang$maxFixedArity = 2);

datascript.storage.maybe_adapt_storage = (function datascript$storage$maybe_adapt_storage(opts){
var temp__5806__auto__ = new cljs.core.Keyword(null,"storage","storage",1867247511).cljs$core$IFn$_invoke$arity$1(opts);
if((temp__5806__auto__ == null)){
return opts;
} else {
var storage = temp__5806__auto__;
return cljs.core.update.cljs$core$IFn$_invoke$arity$4(opts,new cljs.core.Keyword(null,"storage","storage",1867247511),datascript.storage.make_storage_adapter,opts);
}
});

//# sourceMappingURL=datascript.storage.js.map
