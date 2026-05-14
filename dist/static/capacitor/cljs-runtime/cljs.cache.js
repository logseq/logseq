goog.provide('cljs.cache');

/**
 * This is the protocol describing the basic cache capability.
 * @interface
 */
cljs.cache.CacheProtocol = function(){};

var cljs$cache$CacheProtocol$lookup$dyn_69175 = (function() {
var G__69176 = null;
var G__69176__2 = (function (cache,e){
var x__5350__auto__ = (((cache == null))?null:cache);
var m__5351__auto__ = (cljs.cache.lookup[goog.typeOf(x__5350__auto__)]);
if((!((m__5351__auto__ == null)))){
return (m__5351__auto__.cljs$core$IFn$_invoke$arity$2 ? m__5351__auto__.cljs$core$IFn$_invoke$arity$2(cache,e) : m__5351__auto__.call(null,cache,e));
} else {
var m__5349__auto__ = (cljs.cache.lookup["_"]);
if((!((m__5349__auto__ == null)))){
return (m__5349__auto__.cljs$core$IFn$_invoke$arity$2 ? m__5349__auto__.cljs$core$IFn$_invoke$arity$2(cache,e) : m__5349__auto__.call(null,cache,e));
} else {
throw cljs.core.missing_protocol("CacheProtocol.lookup",cache);
}
}
});
var G__69176__3 = (function (cache,e,not_found){
var x__5350__auto__ = (((cache == null))?null:cache);
var m__5351__auto__ = (cljs.cache.lookup[goog.typeOf(x__5350__auto__)]);
if((!((m__5351__auto__ == null)))){
return (m__5351__auto__.cljs$core$IFn$_invoke$arity$3 ? m__5351__auto__.cljs$core$IFn$_invoke$arity$3(cache,e,not_found) : m__5351__auto__.call(null,cache,e,not_found));
} else {
var m__5349__auto__ = (cljs.cache.lookup["_"]);
if((!((m__5349__auto__ == null)))){
return (m__5349__auto__.cljs$core$IFn$_invoke$arity$3 ? m__5349__auto__.cljs$core$IFn$_invoke$arity$3(cache,e,not_found) : m__5349__auto__.call(null,cache,e,not_found));
} else {
throw cljs.core.missing_protocol("CacheProtocol.lookup",cache);
}
}
});
G__69176 = function(cache,e,not_found){
switch(arguments.length){
case 2:
return G__69176__2.call(this,cache,e);
case 3:
return G__69176__3.call(this,cache,e,not_found);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
G__69176.cljs$core$IFn$_invoke$arity$2 = G__69176__2;
G__69176.cljs$core$IFn$_invoke$arity$3 = G__69176__3;
return G__69176;
})()
;
/**
 * Retrieve the value associated with `e` if it exists, else `nil` in
 *   the 2-arg case. Retrieve the value associated with `e` if it exists,
 *   else `not-found` in the 3-arg case.
 */
cljs.cache.lookup = (function cljs$cache$lookup(var_args){
var G__68860 = arguments.length;
switch (G__68860) {
case 2:
return cljs.cache.lookup.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return cljs.cache.lookup.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(cljs.cache.lookup.cljs$core$IFn$_invoke$arity$2 = (function (cache,e){
if((((!((cache == null)))) && ((!((cache.cljs$cache$CacheProtocol$lookup$arity$2 == null)))))){
return cache.cljs$cache$CacheProtocol$lookup$arity$2(cache,e);
} else {
return cljs$cache$CacheProtocol$lookup$dyn_69175(cache,e);
}
}));

(cljs.cache.lookup.cljs$core$IFn$_invoke$arity$3 = (function (cache,e,not_found){
if((((!((cache == null)))) && ((!((cache.cljs$cache$CacheProtocol$lookup$arity$3 == null)))))){
return cache.cljs$cache$CacheProtocol$lookup$arity$3(cache,e,not_found);
} else {
return cljs$cache$CacheProtocol$lookup$dyn_69175(cache,e,not_found);
}
}));

(cljs.cache.lookup.cljs$lang$maxFixedArity = 3);


var cljs$cache$CacheProtocol$has_QMARK_$dyn_69191 = (function (cache,e){
var x__5350__auto__ = (((cache == null))?null:cache);
var m__5351__auto__ = (cljs.cache.has_QMARK_[goog.typeOf(x__5350__auto__)]);
if((!((m__5351__auto__ == null)))){
return (m__5351__auto__.cljs$core$IFn$_invoke$arity$2 ? m__5351__auto__.cljs$core$IFn$_invoke$arity$2(cache,e) : m__5351__auto__.call(null,cache,e));
} else {
var m__5349__auto__ = (cljs.cache.has_QMARK_["_"]);
if((!((m__5349__auto__ == null)))){
return (m__5349__auto__.cljs$core$IFn$_invoke$arity$2 ? m__5349__auto__.cljs$core$IFn$_invoke$arity$2(cache,e) : m__5349__auto__.call(null,cache,e));
} else {
throw cljs.core.missing_protocol("CacheProtocol.has?",cache);
}
}
});
/**
 * Checks if the cache contains a value associated with `e`
 */
cljs.cache.has_QMARK_ = (function cljs$cache$has_QMARK_(cache,e){
if((((!((cache == null)))) && ((!((cache.cljs$cache$CacheProtocol$has_QMARK_$arity$2 == null)))))){
return cache.cljs$cache$CacheProtocol$has_QMARK_$arity$2(cache,e);
} else {
return cljs$cache$CacheProtocol$has_QMARK_$dyn_69191(cache,e);
}
});

var cljs$cache$CacheProtocol$hit$dyn_69195 = (function (cache,e){
var x__5350__auto__ = (((cache == null))?null:cache);
var m__5351__auto__ = (cljs.cache.hit[goog.typeOf(x__5350__auto__)]);
if((!((m__5351__auto__ == null)))){
return (m__5351__auto__.cljs$core$IFn$_invoke$arity$2 ? m__5351__auto__.cljs$core$IFn$_invoke$arity$2(cache,e) : m__5351__auto__.call(null,cache,e));
} else {
var m__5349__auto__ = (cljs.cache.hit["_"]);
if((!((m__5349__auto__ == null)))){
return (m__5349__auto__.cljs$core$IFn$_invoke$arity$2 ? m__5349__auto__.cljs$core$IFn$_invoke$arity$2(cache,e) : m__5349__auto__.call(null,cache,e));
} else {
throw cljs.core.missing_protocol("CacheProtocol.hit",cache);
}
}
});
/**
 * Is meant to be called if the cache is determined to contain a value
 *   associated with `e`
 */
cljs.cache.hit = (function cljs$cache$hit(cache,e){
if((((!((cache == null)))) && ((!((cache.cljs$cache$CacheProtocol$hit$arity$2 == null)))))){
return cache.cljs$cache$CacheProtocol$hit$arity$2(cache,e);
} else {
return cljs$cache$CacheProtocol$hit$dyn_69195(cache,e);
}
});

var cljs$cache$CacheProtocol$miss$dyn_69198 = (function (cache,e,ret){
var x__5350__auto__ = (((cache == null))?null:cache);
var m__5351__auto__ = (cljs.cache.miss[goog.typeOf(x__5350__auto__)]);
if((!((m__5351__auto__ == null)))){
return (m__5351__auto__.cljs$core$IFn$_invoke$arity$3 ? m__5351__auto__.cljs$core$IFn$_invoke$arity$3(cache,e,ret) : m__5351__auto__.call(null,cache,e,ret));
} else {
var m__5349__auto__ = (cljs.cache.miss["_"]);
if((!((m__5349__auto__ == null)))){
return (m__5349__auto__.cljs$core$IFn$_invoke$arity$3 ? m__5349__auto__.cljs$core$IFn$_invoke$arity$3(cache,e,ret) : m__5349__auto__.call(null,cache,e,ret));
} else {
throw cljs.core.missing_protocol("CacheProtocol.miss",cache);
}
}
});
/**
 * Is meant to be called if the cache is determined to **not** contain a
 *   value associated with `e`
 */
cljs.cache.miss = (function cljs$cache$miss(cache,e,ret){
if((((!((cache == null)))) && ((!((cache.cljs$cache$CacheProtocol$miss$arity$3 == null)))))){
return cache.cljs$cache$CacheProtocol$miss$arity$3(cache,e,ret);
} else {
return cljs$cache$CacheProtocol$miss$dyn_69198(cache,e,ret);
}
});

var cljs$cache$CacheProtocol$evict$dyn_69199 = (function (cache,e){
var x__5350__auto__ = (((cache == null))?null:cache);
var m__5351__auto__ = (cljs.cache.evict[goog.typeOf(x__5350__auto__)]);
if((!((m__5351__auto__ == null)))){
return (m__5351__auto__.cljs$core$IFn$_invoke$arity$2 ? m__5351__auto__.cljs$core$IFn$_invoke$arity$2(cache,e) : m__5351__auto__.call(null,cache,e));
} else {
var m__5349__auto__ = (cljs.cache.evict["_"]);
if((!((m__5349__auto__ == null)))){
return (m__5349__auto__.cljs$core$IFn$_invoke$arity$2 ? m__5349__auto__.cljs$core$IFn$_invoke$arity$2(cache,e) : m__5349__auto__.call(null,cache,e));
} else {
throw cljs.core.missing_protocol("CacheProtocol.evict",cache);
}
}
});
/**
 * Removes an entry from the cache
 */
cljs.cache.evict = (function cljs$cache$evict(cache,e){
if((((!((cache == null)))) && ((!((cache.cljs$cache$CacheProtocol$evict$arity$2 == null)))))){
return cache.cljs$cache$CacheProtocol$evict$arity$2(cache,e);
} else {
return cljs$cache$CacheProtocol$evict$dyn_69199(cache,e);
}
});

var cljs$cache$CacheProtocol$seed$dyn_69202 = (function (cache,base){
var x__5350__auto__ = (((cache == null))?null:cache);
var m__5351__auto__ = (cljs.cache.seed[goog.typeOf(x__5350__auto__)]);
if((!((m__5351__auto__ == null)))){
return (m__5351__auto__.cljs$core$IFn$_invoke$arity$2 ? m__5351__auto__.cljs$core$IFn$_invoke$arity$2(cache,base) : m__5351__auto__.call(null,cache,base));
} else {
var m__5349__auto__ = (cljs.cache.seed["_"]);
if((!((m__5349__auto__ == null)))){
return (m__5349__auto__.cljs$core$IFn$_invoke$arity$2 ? m__5349__auto__.cljs$core$IFn$_invoke$arity$2(cache,base) : m__5349__auto__.call(null,cache,base));
} else {
throw cljs.core.missing_protocol("CacheProtocol.seed",cache);
}
}
});
/**
 * Is used to signal that the cache should be created with a seed.
 *   The contract is that said cache should return an instance of its
 *   own type.
 */
cljs.cache.seed = (function cljs$cache$seed(cache,base){
if((((!((cache == null)))) && ((!((cache.cljs$cache$CacheProtocol$seed$arity$2 == null)))))){
return cache.cljs$cache$CacheProtocol$seed$arity$2(cache,base);
} else {
return cljs$cache$CacheProtocol$seed$dyn_69202(cache,base);
}
});

cljs.cache.default_wrapper_fn = (function cljs$cache$default_wrapper_fn(p1__68946_SHARP_,p2__68947_SHARP_){
return (p1__68946_SHARP_.cljs$core$IFn$_invoke$arity$1 ? p1__68946_SHARP_.cljs$core$IFn$_invoke$arity$1(p2__68947_SHARP_) : p1__68946_SHARP_.call(null,p2__68947_SHARP_));
});
/**
 * The basic hit/miss logic for the cache system. Expects a wrap function and
 *   value function.  The wrap function takes the value function and the item in
 *   question and is expected to run the value function with the item whenever a
 *   cache miss occurs.  The intent is to hide any cache-specific cells from
 *   leaking into the cache logic itelf.
 */
cljs.cache.through = (function cljs$cache$through(var_args){
var G__68953 = arguments.length;
switch (G__68953) {
case 2:
return cljs.cache.through.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return cljs.cache.through.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
case 4:
return cljs.cache.through.cljs$core$IFn$_invoke$arity$4((arguments[(0)]),(arguments[(1)]),(arguments[(2)]),(arguments[(3)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(cljs.cache.through.cljs$core$IFn$_invoke$arity$2 = (function (cache,item){
return cljs.cache.through.cljs$core$IFn$_invoke$arity$4(cljs.cache.default_wrapper_fn,cljs.core.identity,cache,item);
}));

(cljs.cache.through.cljs$core$IFn$_invoke$arity$3 = (function (value_fn,cache,item){
return cljs.cache.through.cljs$core$IFn$_invoke$arity$4(cljs.cache.default_wrapper_fn,value_fn,cache,item);
}));

(cljs.cache.through.cljs$core$IFn$_invoke$arity$4 = (function (wrap_fn,value_fn,cache,item){
if(cljs.core.truth_(cljs.cache.has_QMARK_(cache,item))){
return cljs.cache.hit(cache,item);
} else {
return cljs.cache.miss(cache,item,(function (){var G__68959 = (function (p1__68949_SHARP_){
return (value_fn.cljs$core$IFn$_invoke$arity$1 ? value_fn.cljs$core$IFn$_invoke$arity$1(p1__68949_SHARP_) : value_fn.call(null,p1__68949_SHARP_));
});
var G__68960 = item;
return (wrap_fn.cljs$core$IFn$_invoke$arity$2 ? wrap_fn.cljs$core$IFn$_invoke$arity$2(G__68959,G__68960) : wrap_fn.call(null,G__68959,G__68960));
})());
}
}));

(cljs.cache.through.cljs$lang$maxFixedArity = 4);


/**
* @constructor
 * @implements {cljs.core.IEquiv}
 * @implements {cljs.core.ICollection}
 * @implements {cljs.core.IEmptyableCollection}
 * @implements {cljs.core.ICounted}
 * @implements {cljs.cache.CacheProtocol}
 * @implements {cljs.core.ISeqable}
 * @implements {cljs.core.IIterable}
 * @implements {cljs.core.IAssociative}
 * @implements {cljs.core.IMap}
 * @implements {cljs.core.ILookup}
*/
cljs.cache.BasicCache = (function (cache){
this.cache = cache;
this.cljs$lang$protocol_mask$partition0$ = 10487566;
this.cljs$lang$protocol_mask$partition1$ = 131072;
});
(cljs.cache.BasicCache.prototype.toString = (function (){
var self__ = this;
var _ = this;
return cljs.core.str.cljs$core$IFn$_invoke$arity$1(self__.cache);
}));

(cljs.cache.BasicCache.prototype.cljs$core$IEquiv$_equiv$arity$2 = (function (this__68827__auto__,other__68834__auto__){
var self__ = this;
var this__68827__auto____$1 = this;
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(other__68834__auto__,self__.cache);
}));

(cljs.cache.BasicCache.prototype.cljs$core$ICollection$_conj$arity$2 = (function (this__68827__auto__,elem__68833__auto__){
var self__ = this;
var this__68827__auto____$1 = this;
return this__68827__auto____$1.cljs$cache$CacheProtocol$seed$arity$2(null,(function (){var fexpr__68974 = new cljs.core.Symbol("cljs.cache","-conj","cljs.cache/-conj",837886777,null);
return (fexpr__68974.cljs$core$IFn$_invoke$arity$2 ? fexpr__68974.cljs$core$IFn$_invoke$arity$2(self__.cache,elem__68833__auto__) : fexpr__68974.call(null,self__.cache,elem__68833__auto__));
})());
}));

(cljs.cache.BasicCache.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = (function (this__68827__auto__){
var self__ = this;
var this__68827__auto____$1 = this;
return this__68827__auto____$1.cljs$cache$CacheProtocol$seed$arity$2(null,(function (){var fexpr__68977 = new cljs.core.Symbol("cljs.cache","-empty","cljs.cache/-empty",-190310872,null);
return (fexpr__68977.cljs$core$IFn$_invoke$arity$1 ? fexpr__68977.cljs$core$IFn$_invoke$arity$1(self__.cache) : fexpr__68977.call(null,self__.cache));
})());
}));

(cljs.cache.BasicCache.prototype.cljs$core$ICounted$_count$arity$1 = (function (this__68827__auto__){
var self__ = this;
var this__68827__auto____$1 = this;
return cljs.core._count(self__.cache);
}));

(cljs.cache.BasicCache.prototype.cljs$core$ISeqable$_seq$arity$1 = (function (___68830__auto__){
var self__ = this;
var ___68830__auto____$1 = this;
return cljs.core._seq(self__.cache);
}));

(cljs.cache.BasicCache.prototype.cljs$cache$CacheProtocol$ = cljs.core.PROTOCOL_SENTINEL);

(cljs.cache.BasicCache.prototype.cljs$cache$CacheProtocol$lookup$arity$2 = (function (_,item){
var self__ = this;
var ___$1 = this;
return cljs.core.get.cljs$core$IFn$_invoke$arity$2(self__.cache,item);
}));

(cljs.cache.BasicCache.prototype.cljs$cache$CacheProtocol$lookup$arity$3 = (function (_,item,not_found){
var self__ = this;
var ___$1 = this;
return cljs.core.get.cljs$core$IFn$_invoke$arity$3(self__.cache,item,not_found);
}));

(cljs.cache.BasicCache.prototype.cljs$cache$CacheProtocol$has_QMARK_$arity$2 = (function (_,item){
var self__ = this;
var ___$1 = this;
return cljs.core.contains_QMARK_(self__.cache,item);
}));

(cljs.cache.BasicCache.prototype.cljs$cache$CacheProtocol$hit$arity$2 = (function (this$,item){
var self__ = this;
var this$__$1 = this;
return this$__$1;
}));

(cljs.cache.BasicCache.prototype.cljs$cache$CacheProtocol$miss$arity$3 = (function (_,item,result){
var self__ = this;
var ___$1 = this;
return (new cljs.cache.BasicCache(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(self__.cache,item,result)));
}));

(cljs.cache.BasicCache.prototype.cljs$cache$CacheProtocol$evict$arity$2 = (function (_,key){
var self__ = this;
var ___$1 = this;
return (new cljs.cache.BasicCache(cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(self__.cache,key)));
}));

(cljs.cache.BasicCache.prototype.cljs$cache$CacheProtocol$seed$arity$2 = (function (_,base){
var self__ = this;
var ___$1 = this;
return (new cljs.cache.BasicCache(base));
}));

(cljs.cache.BasicCache.prototype.cljs$core$IIterable$_iterator$arity$1 = (function (___68830__auto__){
var self__ = this;
var ___68830__auto____$1 = this;
return self__.cache.iterator();
}));

(cljs.cache.BasicCache.prototype.cljs$core$IAssociative$_assoc$arity$3 = (function (this__68827__auto__,k__68831__auto__,v__68832__auto__){
var self__ = this;
var this__68827__auto____$1 = this;
return this__68827__auto____$1.cljs$cache$CacheProtocol$miss$arity$3(null,k__68831__auto__,v__68832__auto__);
}));

(cljs.cache.BasicCache.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = (function (this__68827__auto__,k__68831__auto__){
var self__ = this;
var this__68827__auto____$1 = this;
return this__68827__auto____$1.cljs$cache$CacheProtocol$has_QMARK_$arity$2(null,k__68831__auto__);
}));

(cljs.cache.BasicCache.prototype.cljs$core$IMap$_dissoc$arity$2 = (function (this__68827__auto__,k__68831__auto__){
var self__ = this;
var this__68827__auto____$1 = this;
return this__68827__auto____$1.cljs$cache$CacheProtocol$evict$arity$2(null,k__68831__auto__);
}));

(cljs.cache.BasicCache.prototype.cljs$core$ILookup$_lookup$arity$2 = (function (this__68827__auto__,key__68828__auto__){
var self__ = this;
var this__68827__auto____$1 = this;
return this__68827__auto____$1.cljs$core$ILookup$_lookup$arity$3(null,key__68828__auto__,null);
}));

(cljs.cache.BasicCache.prototype.cljs$core$ILookup$_lookup$arity$3 = (function (this__68827__auto__,key__68828__auto__,not_found__68829__auto__){
var self__ = this;
var this__68827__auto____$1 = this;
if(cljs.core.truth_(this__68827__auto____$1.cljs$cache$CacheProtocol$has_QMARK_$arity$2(null,key__68828__auto__))){
return this__68827__auto____$1.cljs$cache$CacheProtocol$lookup$arity$2(null,key__68828__auto__);
} else {
return not_found__68829__auto__;
}
}));

(cljs.cache.BasicCache.getBasis = (function (){
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"cache","cache",403508473,null)], null);
}));

(cljs.cache.BasicCache.cljs$lang$type = true);

(cljs.cache.BasicCache.cljs$lang$ctorStr = "cljs.cache/BasicCache");

(cljs.cache.BasicCache.cljs$lang$ctorPrWriter = (function (this__5287__auto__,writer__5288__auto__,opt__5289__auto__){
return cljs.core._write(writer__5288__auto__,"cljs.cache/BasicCache");
}));

/**
 * Positional factory function for cljs.cache/BasicCache.
 */
cljs.cache.__GT_BasicCache = (function cljs$cache$__GT_BasicCache(cache){
return (new cljs.cache.BasicCache(cache));
});

cljs.cache.get_time = (function cljs$cache$get_time(){
return (new Date()).getTime();
});
/**
 * returns a fn that dissocs expired keys from a map
 */
cljs.cache.key_killer_fn = (function cljs$cache$key_killer_fn(ttl,expiry,now){
var ks = cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.key,cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (p1__68999_SHARP_){
return ((now - cljs.core.val(p1__68999_SHARP_)) > expiry);
}),ttl));
return (function (p1__69000_SHARP_){
return cljs.core.apply.cljs$core$IFn$_invoke$arity$3(cljs.core.dissoc,p1__69000_SHARP_,ks);
});
});

/**
* @constructor
 * @implements {cljs.core.IEquiv}
 * @implements {cljs.core.ICollection}
 * @implements {cljs.core.IEmptyableCollection}
 * @implements {cljs.core.ICounted}
 * @implements {cljs.cache.CacheProtocol}
 * @implements {cljs.core.ISeqable}
 * @implements {cljs.core.IIterable}
 * @implements {cljs.core.IAssociative}
 * @implements {cljs.core.IMap}
 * @implements {cljs.core.ILookup}
*/
cljs.cache.TTLCache = (function (cache,ttl,ttl_ms){
this.cache = cache;
this.ttl = ttl;
this.ttl_ms = ttl_ms;
this.cljs$lang$protocol_mask$partition0$ = 10487566;
this.cljs$lang$protocol_mask$partition1$ = 131072;
});
(cljs.cache.TTLCache.prototype.toString = (function (){
var self__ = this;
var _ = this;
return [cljs.core.str.cljs$core$IFn$_invoke$arity$1(self__.cache),","," ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(self__.ttl),","," ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(self__.ttl_ms)].join('');
}));

(cljs.cache.TTLCache.prototype.cljs$core$IEquiv$_equiv$arity$2 = (function (this__68827__auto__,other__68834__auto__){
var self__ = this;
var this__68827__auto____$1 = this;
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(other__68834__auto__,self__.cache);
}));

(cljs.cache.TTLCache.prototype.cljs$core$ICollection$_conj$arity$2 = (function (this__68827__auto__,elem__68833__auto__){
var self__ = this;
var this__68827__auto____$1 = this;
return this__68827__auto____$1.cljs$cache$CacheProtocol$seed$arity$2(null,(function (){var fexpr__69005 = new cljs.core.Symbol("cljs.cache","-conj","cljs.cache/-conj",837886777,null);
return (fexpr__69005.cljs$core$IFn$_invoke$arity$2 ? fexpr__69005.cljs$core$IFn$_invoke$arity$2(self__.cache,elem__68833__auto__) : fexpr__69005.call(null,self__.cache,elem__68833__auto__));
})());
}));

(cljs.cache.TTLCache.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = (function (this__68827__auto__){
var self__ = this;
var this__68827__auto____$1 = this;
return this__68827__auto____$1.cljs$cache$CacheProtocol$seed$arity$2(null,(function (){var fexpr__69006 = new cljs.core.Symbol("cljs.cache","-empty","cljs.cache/-empty",-190310872,null);
return (fexpr__69006.cljs$core$IFn$_invoke$arity$1 ? fexpr__69006.cljs$core$IFn$_invoke$arity$1(self__.cache) : fexpr__69006.call(null,self__.cache));
})());
}));

(cljs.cache.TTLCache.prototype.cljs$core$ICounted$_count$arity$1 = (function (this__68827__auto__){
var self__ = this;
var this__68827__auto____$1 = this;
return cljs.core._count(self__.cache);
}));

(cljs.cache.TTLCache.prototype.cljs$core$ISeqable$_seq$arity$1 = (function (___68830__auto__){
var self__ = this;
var ___68830__auto____$1 = this;
return cljs.core._seq(self__.cache);
}));

(cljs.cache.TTLCache.prototype.cljs$cache$CacheProtocol$ = cljs.core.PROTOCOL_SENTINEL);

(cljs.cache.TTLCache.prototype.cljs$cache$CacheProtocol$lookup$arity$2 = (function (this$,item){
var self__ = this;
var this$__$1 = this;
var ret = this$__$1.cljs$cache$CacheProtocol$lookup$arity$3(null,item,new cljs.core.Keyword("cljs.cache","nope","cljs.cache/nope",968062453));
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(ret,new cljs.core.Keyword("cljs.cache","nope","cljs.cache/nope",968062453))){
return null;
} else {
return ret;
}
}));

(cljs.cache.TTLCache.prototype.cljs$cache$CacheProtocol$lookup$arity$3 = (function (this$,item,not_found){
var self__ = this;
var this$__$1 = this;
if(cljs.core.truth_(this$__$1.cljs$cache$CacheProtocol$has_QMARK_$arity$2(null,item))){
return cljs.core.get.cljs$core$IFn$_invoke$arity$2(self__.cache,item);
} else {
return not_found;
}
}));

(cljs.cache.TTLCache.prototype.cljs$cache$CacheProtocol$has_QMARK_$arity$2 = (function (_,item){
var self__ = this;
var ___$1 = this;
var t = cljs.core.get.cljs$core$IFn$_invoke$arity$3(self__.ttl,item,(- self__.ttl_ms));
return ((cljs.cache.get_time() - t) < self__.ttl_ms);
}));

(cljs.cache.TTLCache.prototype.cljs$cache$CacheProtocol$hit$arity$2 = (function (this$,item){
var self__ = this;
var this$__$1 = this;
return this$__$1;
}));

(cljs.cache.TTLCache.prototype.cljs$cache$CacheProtocol$miss$arity$3 = (function (this$,item,result){
var self__ = this;
var this$__$1 = this;
var now = cljs.cache.get_time();
var kill_old = cljs.cache.key_killer_fn(self__.ttl,self__.ttl_ms,now);
return (new cljs.cache.TTLCache(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(kill_old(self__.cache),item,result),cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(kill_old(self__.ttl),item,now),self__.ttl_ms));
}));

(cljs.cache.TTLCache.prototype.cljs$cache$CacheProtocol$seed$arity$2 = (function (_,base){
var self__ = this;
var ___$1 = this;
var now = cljs.cache.get_time();
return (new cljs.cache.TTLCache(base,cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,(function (){var iter__5480__auto__ = (function cljs$cache$iter__69022(s__69023){
return (new cljs.core.LazySeq(null,(function (){
var s__69023__$1 = s__69023;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__69023__$1);
if(temp__5804__auto__){
var s__69023__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__69023__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__69023__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__69025 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__69024 = (0);
while(true){
if((i__69024 < size__5479__auto__)){
var x = cljs.core._nth(c__5478__auto__,i__69024);
cljs.core.chunk_append(b__69025,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.key(x),now], null));

var G__69222 = (i__69024 + (1));
i__69024 = G__69222;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__69025),cljs$cache$iter__69022(cljs.core.chunk_rest(s__69023__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__69025),null);
}
} else {
var x = cljs.core.first(s__69023__$2);
return cljs.core.cons(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.key(x),now], null),cljs$cache$iter__69022(cljs.core.rest(s__69023__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(base);
})()),self__.ttl_ms));
}));

(cljs.cache.TTLCache.prototype.cljs$cache$CacheProtocol$evict$arity$2 = (function (_,key){
var self__ = this;
var ___$1 = this;
return (new cljs.cache.TTLCache(cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(self__.cache,key),cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(self__.ttl,key),self__.ttl_ms));
}));

(cljs.cache.TTLCache.prototype.cljs$core$IIterable$_iterator$arity$1 = (function (___68830__auto__){
var self__ = this;
var ___68830__auto____$1 = this;
return self__.cache.iterator();
}));

(cljs.cache.TTLCache.prototype.cljs$core$IAssociative$_assoc$arity$3 = (function (this__68827__auto__,k__68831__auto__,v__68832__auto__){
var self__ = this;
var this__68827__auto____$1 = this;
return this__68827__auto____$1.cljs$cache$CacheProtocol$miss$arity$3(null,k__68831__auto__,v__68832__auto__);
}));

(cljs.cache.TTLCache.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = (function (this__68827__auto__,k__68831__auto__){
var self__ = this;
var this__68827__auto____$1 = this;
return this__68827__auto____$1.cljs$cache$CacheProtocol$has_QMARK_$arity$2(null,k__68831__auto__);
}));

(cljs.cache.TTLCache.prototype.cljs$core$IMap$_dissoc$arity$2 = (function (this__68827__auto__,k__68831__auto__){
var self__ = this;
var this__68827__auto____$1 = this;
return this__68827__auto____$1.cljs$cache$CacheProtocol$evict$arity$2(null,k__68831__auto__);
}));

(cljs.cache.TTLCache.prototype.cljs$core$ILookup$_lookup$arity$2 = (function (this__68827__auto__,key__68828__auto__){
var self__ = this;
var this__68827__auto____$1 = this;
return this__68827__auto____$1.cljs$core$ILookup$_lookup$arity$3(null,key__68828__auto__,null);
}));

(cljs.cache.TTLCache.prototype.cljs$core$ILookup$_lookup$arity$3 = (function (this__68827__auto__,key__68828__auto__,not_found__68829__auto__){
var self__ = this;
var this__68827__auto____$1 = this;
if(cljs.core.truth_(this__68827__auto____$1.cljs$cache$CacheProtocol$has_QMARK_$arity$2(null,key__68828__auto__))){
return this__68827__auto____$1.cljs$cache$CacheProtocol$lookup$arity$2(null,key__68828__auto__);
} else {
return not_found__68829__auto__;
}
}));

(cljs.cache.TTLCache.getBasis = (function (){
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"cache","cache",403508473,null),new cljs.core.Symbol(null,"ttl","ttl",525256409,null),new cljs.core.Symbol(null,"ttl-ms","ttl-ms",-1349172894,null)], null);
}));

(cljs.cache.TTLCache.cljs$lang$type = true);

(cljs.cache.TTLCache.cljs$lang$ctorStr = "cljs.cache/TTLCache");

(cljs.cache.TTLCache.cljs$lang$ctorPrWriter = (function (this__5287__auto__,writer__5288__auto__,opt__5289__auto__){
return cljs.core._write(writer__5288__auto__,"cljs.cache/TTLCache");
}));

/**
 * Positional factory function for cljs.cache/TTLCache.
 */
cljs.cache.__GT_TTLCache = (function cljs$cache$__GT_TTLCache(cache,ttl,ttl_ms){
return (new cljs.cache.TTLCache(cache,ttl,ttl_ms));
});

cljs.cache.build_leastness_queue = (function cljs$cache$build_leastness_queue(base,limit,start_at){
return cljs.core.into.cljs$core$IFn$_invoke$arity$2(tailrecursion.priority_map.priority_map(),cljs.core.concat.cljs$core$IFn$_invoke$arity$2(cljs.core.take.cljs$core$IFn$_invoke$arity$2((limit - cljs.core.count(base)),(function (){var iter__5480__auto__ = (function cljs$cache$build_leastness_queue_$_iter__69044(s__69045){
return (new cljs.core.LazySeq(null,(function (){
var s__69045__$1 = s__69045;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__69045__$1);
if(temp__5804__auto__){
var s__69045__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__69045__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__69045__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__69047 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__69046 = (0);
while(true){
if((i__69046 < size__5479__auto__)){
var k = cljs.core._nth(c__5478__auto__,i__69046);
cljs.core.chunk_append(b__69047,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [k,k], null));

var G__69226 = (i__69046 + (1));
i__69046 = G__69226;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__69047),cljs$cache$build_leastness_queue_$_iter__69044(cljs.core.chunk_rest(s__69045__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__69047),null);
}
} else {
var k = cljs.core.first(s__69045__$2);
return cljs.core.cons(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [k,k], null),cljs$cache$build_leastness_queue_$_iter__69044(cljs.core.rest(s__69045__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(cljs.core.range.cljs$core$IFn$_invoke$arity$2((- limit),(0)));
})()),(function (){var iter__5480__auto__ = (function cljs$cache$build_leastness_queue_$_iter__69051(s__69052){
return (new cljs.core.LazySeq(null,(function (){
var s__69052__$1 = s__69052;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__69052__$1);
if(temp__5804__auto__){
var s__69052__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__69052__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__69052__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__69054 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__69053 = (0);
while(true){
if((i__69053 < size__5479__auto__)){
var vec__69056 = cljs.core._nth(c__5478__auto__,i__69053);
var k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__69056,(0),null);
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__69056,(1),null);
cljs.core.chunk_append(b__69054,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [k,start_at], null));

var G__69228 = (i__69053 + (1));
i__69053 = G__69228;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__69054),cljs$cache$build_leastness_queue_$_iter__69051(cljs.core.chunk_rest(s__69052__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__69054),null);
}
} else {
var vec__69061 = cljs.core.first(s__69052__$2);
var k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__69061,(0),null);
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__69061,(1),null);
return cljs.core.cons(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [k,start_at], null),cljs$cache$build_leastness_queue_$_iter__69051(cljs.core.rest(s__69052__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(base);
})()));
});

/**
* @constructor
 * @implements {cljs.core.IEquiv}
 * @implements {cljs.core.ICollection}
 * @implements {cljs.core.IEmptyableCollection}
 * @implements {cljs.core.ICounted}
 * @implements {cljs.cache.CacheProtocol}
 * @implements {cljs.core.ISeqable}
 * @implements {cljs.core.IIterable}
 * @implements {cljs.core.IAssociative}
 * @implements {cljs.core.IMap}
 * @implements {cljs.core.ILookup}
*/
cljs.cache.LRUCache = (function (cache,lru,tick,limit){
this.cache = cache;
this.lru = lru;
this.tick = tick;
this.limit = limit;
this.cljs$lang$protocol_mask$partition0$ = 10487566;
this.cljs$lang$protocol_mask$partition1$ = 131072;
});
(cljs.cache.LRUCache.prototype.toString = (function (){
var self__ = this;
var _ = this;
return [cljs.core.str.cljs$core$IFn$_invoke$arity$1(self__.cache),","," ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(self__.lru),","," ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(self__.tick),","," ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(self__.limit)].join('');
}));

(cljs.cache.LRUCache.prototype.cljs$core$IEquiv$_equiv$arity$2 = (function (this__68827__auto__,other__68834__auto__){
var self__ = this;
var this__68827__auto____$1 = this;
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(other__68834__auto__,self__.cache);
}));

(cljs.cache.LRUCache.prototype.cljs$core$ICollection$_conj$arity$2 = (function (this__68827__auto__,elem__68833__auto__){
var self__ = this;
var this__68827__auto____$1 = this;
return this__68827__auto____$1.cljs$cache$CacheProtocol$seed$arity$2(null,(function (){var fexpr__69070 = new cljs.core.Symbol("cljs.cache","-conj","cljs.cache/-conj",837886777,null);
return (fexpr__69070.cljs$core$IFn$_invoke$arity$2 ? fexpr__69070.cljs$core$IFn$_invoke$arity$2(self__.cache,elem__68833__auto__) : fexpr__69070.call(null,self__.cache,elem__68833__auto__));
})());
}));

(cljs.cache.LRUCache.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = (function (this__68827__auto__){
var self__ = this;
var this__68827__auto____$1 = this;
return this__68827__auto____$1.cljs$cache$CacheProtocol$seed$arity$2(null,(function (){var fexpr__69075 = new cljs.core.Symbol("cljs.cache","-empty","cljs.cache/-empty",-190310872,null);
return (fexpr__69075.cljs$core$IFn$_invoke$arity$1 ? fexpr__69075.cljs$core$IFn$_invoke$arity$1(self__.cache) : fexpr__69075.call(null,self__.cache));
})());
}));

(cljs.cache.LRUCache.prototype.cljs$core$ICounted$_count$arity$1 = (function (this__68827__auto__){
var self__ = this;
var this__68827__auto____$1 = this;
return cljs.core._count(self__.cache);
}));

(cljs.cache.LRUCache.prototype.cljs$core$ISeqable$_seq$arity$1 = (function (___68830__auto__){
var self__ = this;
var ___68830__auto____$1 = this;
return cljs.core._seq(self__.cache);
}));

(cljs.cache.LRUCache.prototype.cljs$cache$CacheProtocol$ = cljs.core.PROTOCOL_SENTINEL);

(cljs.cache.LRUCache.prototype.cljs$cache$CacheProtocol$lookup$arity$2 = (function (_,item){
var self__ = this;
var ___$1 = this;
return cljs.core.get.cljs$core$IFn$_invoke$arity$2(self__.cache,item);
}));

(cljs.cache.LRUCache.prototype.cljs$cache$CacheProtocol$lookup$arity$3 = (function (_,item,not_found){
var self__ = this;
var ___$1 = this;
return cljs.core.get.cljs$core$IFn$_invoke$arity$3(self__.cache,item,not_found);
}));

(cljs.cache.LRUCache.prototype.cljs$cache$CacheProtocol$has_QMARK_$arity$2 = (function (_,item){
var self__ = this;
var ___$1 = this;
return cljs.core.contains_QMARK_(self__.cache,item);
}));

(cljs.cache.LRUCache.prototype.cljs$cache$CacheProtocol$hit$arity$2 = (function (_,item){
var self__ = this;
var ___$1 = this;
var tick_PLUS_ = (self__.tick + (1));
return (new cljs.cache.LRUCache(self__.cache,((cljs.core.contains_QMARK_(self__.cache,item))?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(self__.lru,item,tick_PLUS_):self__.lru),tick_PLUS_,self__.limit));
}));

(cljs.cache.LRUCache.prototype.cljs$cache$CacheProtocol$miss$arity$3 = (function (_,item,result){
var self__ = this;
var ___$1 = this;
var tick_PLUS_ = (self__.tick + (1));
if((cljs.core.count(self__.lru) >= self__.limit)){
var k = ((cljs.core.contains_QMARK_(self__.lru,item))?item:cljs.core.first(cljs.core.peek(self__.lru)));
var c = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(self__.cache,k),item,result);
var l = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(self__.lru,k),item,tick_PLUS_);
return (new cljs.cache.LRUCache(c,l,tick_PLUS_,self__.limit));
} else {
return (new cljs.cache.LRUCache(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(self__.cache,item,result),cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(self__.lru,item,tick_PLUS_),tick_PLUS_,self__.limit));
}
}));

(cljs.cache.LRUCache.prototype.cljs$cache$CacheProtocol$evict$arity$2 = (function (this$,key){
var self__ = this;
var this$__$1 = this;
if(cljs.core.contains_QMARK_(self__.cache,key)){
return (new cljs.cache.LRUCache(cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(self__.cache,key),cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(self__.lru,key),(self__.tick + (1)),self__.limit));
} else {
return this$__$1;
}
}));

(cljs.cache.LRUCache.prototype.cljs$cache$CacheProtocol$seed$arity$2 = (function (_,base){
var self__ = this;
var ___$1 = this;
return (new cljs.cache.LRUCache(base,cljs.cache.build_leastness_queue(base,self__.limit,(0)),(0),self__.limit));
}));

(cljs.cache.LRUCache.prototype.cljs$core$IIterable$_iterator$arity$1 = (function (___68830__auto__){
var self__ = this;
var ___68830__auto____$1 = this;
return self__.cache.iterator();
}));

(cljs.cache.LRUCache.prototype.cljs$core$IAssociative$_assoc$arity$3 = (function (this__68827__auto__,k__68831__auto__,v__68832__auto__){
var self__ = this;
var this__68827__auto____$1 = this;
return this__68827__auto____$1.cljs$cache$CacheProtocol$miss$arity$3(null,k__68831__auto__,v__68832__auto__);
}));

(cljs.cache.LRUCache.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = (function (this__68827__auto__,k__68831__auto__){
var self__ = this;
var this__68827__auto____$1 = this;
return this__68827__auto____$1.cljs$cache$CacheProtocol$has_QMARK_$arity$2(null,k__68831__auto__);
}));

(cljs.cache.LRUCache.prototype.cljs$core$IMap$_dissoc$arity$2 = (function (this__68827__auto__,k__68831__auto__){
var self__ = this;
var this__68827__auto____$1 = this;
return this__68827__auto____$1.cljs$cache$CacheProtocol$evict$arity$2(null,k__68831__auto__);
}));

(cljs.cache.LRUCache.prototype.cljs$core$ILookup$_lookup$arity$2 = (function (this__68827__auto__,key__68828__auto__){
var self__ = this;
var this__68827__auto____$1 = this;
return this__68827__auto____$1.cljs$core$ILookup$_lookup$arity$3(null,key__68828__auto__,null);
}));

(cljs.cache.LRUCache.prototype.cljs$core$ILookup$_lookup$arity$3 = (function (this__68827__auto__,key__68828__auto__,not_found__68829__auto__){
var self__ = this;
var this__68827__auto____$1 = this;
if(cljs.core.truth_(this__68827__auto____$1.cljs$cache$CacheProtocol$has_QMARK_$arity$2(null,key__68828__auto__))){
return this__68827__auto____$1.cljs$cache$CacheProtocol$lookup$arity$2(null,key__68828__auto__);
} else {
return not_found__68829__auto__;
}
}));

(cljs.cache.LRUCache.getBasis = (function (){
return new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"cache","cache",403508473,null),new cljs.core.Symbol(null,"lru","lru",-315566379,null),new cljs.core.Symbol(null,"tick","tick",804644551,null),new cljs.core.Symbol(null,"limit","limit",284709164,null)], null);
}));

(cljs.cache.LRUCache.cljs$lang$type = true);

(cljs.cache.LRUCache.cljs$lang$ctorStr = "cljs.cache/LRUCache");

(cljs.cache.LRUCache.cljs$lang$ctorPrWriter = (function (this__5287__auto__,writer__5288__auto__,opt__5289__auto__){
return cljs.core._write(writer__5288__auto__,"cljs.cache/LRUCache");
}));

/**
 * Positional factory function for cljs.cache/LRUCache.
 */
cljs.cache.__GT_LRUCache = (function cljs$cache$__GT_LRUCache(cache,lru,tick__$1,limit){
return (new cljs.cache.LRUCache(cache,lru,tick__$1,limit));
});

/**
 * Returns a pluggable basic cache initialied to `base`
 */
cljs.cache.basic_cache_factory = (function cljs$cache$basic_cache_factory(base){
if(cljs.core.map_QMARK_(base)){
} else {
throw (new Error("Assert failed: (map? base)"));
}

return (new cljs.cache.BasicCache(base));
});
/**
 * Returns a TTL cache with the cache and expiration-table initialied to `base` --
 * each with the same time-to-live.
 * 
 * This function also allows an optional `:ttl` argument that defines the default
 * time in milliseconds that entries are allowed to reside in the cache.
 */
cljs.cache.ttl_cache_factory = (function cljs$cache$ttl_cache_factory(var_args){
var args__5732__auto__ = [];
var len__5726__auto___69236 = arguments.length;
var i__5727__auto___69237 = (0);
while(true){
if((i__5727__auto___69237 < len__5726__auto___69236)){
args__5732__auto__.push((arguments[i__5727__auto___69237]));

var G__69238 = (i__5727__auto___69237 + (1));
i__5727__auto___69237 = G__69238;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return cljs.cache.ttl_cache_factory.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(cljs.cache.ttl_cache_factory.cljs$core$IFn$_invoke$arity$variadic = (function (base,p__69142){
var map__69144 = p__69142;
var map__69144__$1 = cljs.core.__destructure_map(map__69144);
var ttl = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__69144__$1,new cljs.core.Keyword(null,"ttl","ttl",-1115275118),(2000));
if(typeof ttl === 'number'){
} else {
throw (new Error("Assert failed: (number? ttl)"));
}

if(((0) <= ttl)){
} else {
throw (new Error("Assert failed: (<= 0 ttl)"));
}

if(cljs.core.map_QMARK_(base)){
} else {
throw (new Error("Assert failed: (map? base)"));
}

return (new cljs.cache.TTLCache(cljs.core.PersistentArrayMap.EMPTY,cljs.core.PersistentArrayMap.EMPTY,ttl)).cljs$cache$CacheProtocol$seed$arity$2(null,base);
}));

(cljs.cache.ttl_cache_factory.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(cljs.cache.ttl_cache_factory.cljs$lang$applyTo = (function (seq69138){
var G__69139 = cljs.core.first(seq69138);
var seq69138__$1 = cljs.core.next(seq69138);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__69139,seq69138__$1);
}));

/**
 * Returns an LRU cache with the cache and usage-table initialied to `base` --
 * each entry is initialized with the same usage value.
 * This function takes an optional `:threshold` argument that defines the maximum number
 * of elements in the cache before the LRU semantics apply (default is 32).
 */
cljs.cache.lru_cache_factory = (function cljs$cache$lru_cache_factory(var_args){
var args__5732__auto__ = [];
var len__5726__auto___69239 = arguments.length;
var i__5727__auto___69240 = (0);
while(true){
if((i__5727__auto___69240 < len__5726__auto___69239)){
args__5732__auto__.push((arguments[i__5727__auto___69240]));

var G__69241 = (i__5727__auto___69240 + (1));
i__5727__auto___69240 = G__69241;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return cljs.cache.lru_cache_factory.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(cljs.cache.lru_cache_factory.cljs$core$IFn$_invoke$arity$variadic = (function (base,p__69158){
var map__69159 = p__69158;
var map__69159__$1 = cljs.core.__destructure_map(map__69159);
var threshold = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__69159__$1,new cljs.core.Keyword(null,"threshold","threshold",204221583),(32));
if(typeof threshold === 'number'){
} else {
throw (new Error("Assert failed: (number? threshold)"));
}

if(((0) < threshold)){
} else {
throw (new Error("Assert failed: (< 0 threshold)"));
}

if(cljs.core.map_QMARK_(base)){
} else {
throw (new Error("Assert failed: (map? base)"));
}

return (new cljs.cache.LRUCache(cljs.core.PersistentArrayMap.EMPTY,tailrecursion.priority_map.priority_map(),(0),threshold)).cljs$cache$CacheProtocol$seed$arity$2(null,base);
}));

(cljs.cache.lru_cache_factory.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(cljs.cache.lru_cache_factory.cljs$lang$applyTo = (function (seq69149){
var G__69150 = cljs.core.first(seq69149);
var seq69149__$1 = cljs.core.next(seq69149);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__69150,seq69149__$1);
}));


//# sourceMappingURL=cljs.cache.js.map
