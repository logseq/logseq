goog.provide('clojure.test.check.generators');

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
clojure.test.check.generators.Generator = (function (gen,__meta,__extmap,__hash){
this.gen = gen;
this.__meta = __meta;
this.__extmap = __extmap;
this.__hash = __hash;
this.cljs$lang$protocol_mask$partition0$ = 2230716170;
this.cljs$lang$protocol_mask$partition1$ = 139264;
});
(clojure.test.check.generators.Generator.prototype.cljs$core$ILookup$_lookup$arity$2 = (function (this__5300__auto__,k__5301__auto__){
var self__ = this;
var this__5300__auto____$1 = this;
return this__5300__auto____$1.cljs$core$ILookup$_lookup$arity$3(null,k__5301__auto__,null);
}));

(clojure.test.check.generators.Generator.prototype.cljs$core$ILookup$_lookup$arity$3 = (function (this__5302__auto__,k133375,else__5303__auto__){
var self__ = this;
var this__5302__auto____$1 = this;
var G__133379 = k133375;
var G__133379__$1 = (((G__133379 instanceof cljs.core.Keyword))?G__133379.fqn:null);
switch (G__133379__$1) {
case "gen":
return self__.gen;

break;
default:
return cljs.core.get.cljs$core$IFn$_invoke$arity$3(self__.__extmap,k133375,else__5303__auto__);

}
}));

(clojure.test.check.generators.Generator.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = (function (this__5320__auto__,f__5321__auto__,init__5322__auto__){
var self__ = this;
var this__5320__auto____$1 = this;
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (ret__5323__auto__,p__133380){
var vec__133381 = p__133380;
var k__5324__auto__ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__133381,(0),null);
var v__5325__auto__ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__133381,(1),null);
return (f__5321__auto__.cljs$core$IFn$_invoke$arity$3 ? f__5321__auto__.cljs$core$IFn$_invoke$arity$3(ret__5323__auto__,k__5324__auto__,v__5325__auto__) : f__5321__auto__.call(null,ret__5323__auto__,k__5324__auto__,v__5325__auto__));
}),init__5322__auto__,this__5320__auto____$1);
}));

(clojure.test.check.generators.Generator.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = (function (this__5315__auto__,writer__5316__auto__,opts__5317__auto__){
var self__ = this;
var this__5315__auto____$1 = this;
var pr_pair__5318__auto__ = (function (keyval__5319__auto__){
return cljs.core.pr_sequential_writer(writer__5316__auto__,cljs.core.pr_writer,""," ","",opts__5317__auto__,keyval__5319__auto__);
});
return cljs.core.pr_sequential_writer(writer__5316__auto__,pr_pair__5318__auto__,"#clojure.test.check.generators.Generator{",", ","}",opts__5317__auto__,cljs.core.concat.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [(new cljs.core.PersistentVector(null,2,(5),cljs.core.PersistentVector.EMPTY_NODE,[new cljs.core.Keyword(null,"gen","gen",142575302),self__.gen],null))], null),self__.__extmap));
}));

(clojure.test.check.generators.Generator.prototype.cljs$core$IIterable$_iterator$arity$1 = (function (G__133374){
var self__ = this;
var G__133374__$1 = this;
return (new cljs.core.RecordIter((0),G__133374__$1,1,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"gen","gen",142575302)], null),(cljs.core.truth_(self__.__extmap)?cljs.core._iterator(self__.__extmap):cljs.core.nil_iter())));
}));

(clojure.test.check.generators.Generator.prototype.cljs$core$IMeta$_meta$arity$1 = (function (this__5298__auto__){
var self__ = this;
var this__5298__auto____$1 = this;
return self__.__meta;
}));

(clojure.test.check.generators.Generator.prototype.cljs$core$ICloneable$_clone$arity$1 = (function (this__5295__auto__){
var self__ = this;
var this__5295__auto____$1 = this;
return (new clojure.test.check.generators.Generator(self__.gen,self__.__meta,self__.__extmap,self__.__hash));
}));

(clojure.test.check.generators.Generator.prototype.cljs$core$ICounted$_count$arity$1 = (function (this__5304__auto__){
var self__ = this;
var this__5304__auto____$1 = this;
return (1 + cljs.core.count(self__.__extmap));
}));

(clojure.test.check.generators.Generator.prototype.cljs$core$IHash$_hash$arity$1 = (function (this__5296__auto__){
var self__ = this;
var this__5296__auto____$1 = this;
var h__5111__auto__ = self__.__hash;
if((!((h__5111__auto__ == null)))){
return h__5111__auto__;
} else {
var h__5111__auto____$1 = (function (coll__5297__auto__){
return (236843149 ^ cljs.core.hash_unordered_coll(coll__5297__auto__));
})(this__5296__auto____$1);
(self__.__hash = h__5111__auto____$1);

return h__5111__auto____$1;
}
}));

(clojure.test.check.generators.Generator.prototype.cljs$core$IEquiv$_equiv$arity$2 = (function (this133376,other133377){
var self__ = this;
var this133376__$1 = this;
return (((!((other133377 == null)))) && ((((this133376__$1.constructor === other133377.constructor)) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(this133376__$1.gen,other133377.gen)) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(this133376__$1.__extmap,other133377.__extmap)))))));
}));

(clojure.test.check.generators.Generator.prototype.cljs$core$IMap$_dissoc$arity$2 = (function (this__5310__auto__,k__5311__auto__){
var self__ = this;
var this__5310__auto____$1 = this;
if(cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"gen","gen",142575302),null], null), null),k__5311__auto__)){
return cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(cljs.core._with_meta(cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,this__5310__auto____$1),self__.__meta),k__5311__auto__);
} else {
return (new clojure.test.check.generators.Generator(self__.gen,self__.__meta,cljs.core.not_empty(cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(self__.__extmap,k__5311__auto__)),null));
}
}));

(clojure.test.check.generators.Generator.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = (function (this__5307__auto__,k133375){
var self__ = this;
var this__5307__auto____$1 = this;
var G__133384 = k133375;
var G__133384__$1 = (((G__133384 instanceof cljs.core.Keyword))?G__133384.fqn:null);
switch (G__133384__$1) {
case "gen":
return true;

break;
default:
return cljs.core.contains_QMARK_(self__.__extmap,k133375);

}
}));

(clojure.test.check.generators.Generator.prototype.cljs$core$IAssociative$_assoc$arity$3 = (function (this__5308__auto__,k__5309__auto__,G__133374){
var self__ = this;
var this__5308__auto____$1 = this;
var pred__133385 = cljs.core.keyword_identical_QMARK_;
var expr__133386 = k__5309__auto__;
if(cljs.core.truth_((pred__133385.cljs$core$IFn$_invoke$arity$2 ? pred__133385.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"gen","gen",142575302),expr__133386) : pred__133385.call(null,new cljs.core.Keyword(null,"gen","gen",142575302),expr__133386)))){
return (new clojure.test.check.generators.Generator(G__133374,self__.__meta,self__.__extmap,null));
} else {
return (new clojure.test.check.generators.Generator(self__.gen,self__.__meta,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(self__.__extmap,k__5309__auto__,G__133374),null));
}
}));

(clojure.test.check.generators.Generator.prototype.cljs$core$ISeqable$_seq$arity$1 = (function (this__5313__auto__){
var self__ = this;
var this__5313__auto____$1 = this;
return cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [(new cljs.core.MapEntry(new cljs.core.Keyword(null,"gen","gen",142575302),self__.gen,null))], null),self__.__extmap));
}));

(clojure.test.check.generators.Generator.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = (function (this__5299__auto__,G__133374){
var self__ = this;
var this__5299__auto____$1 = this;
return (new clojure.test.check.generators.Generator(self__.gen,G__133374,self__.__extmap,self__.__hash));
}));

(clojure.test.check.generators.Generator.prototype.cljs$core$ICollection$_conj$arity$2 = (function (this__5305__auto__,entry__5306__auto__){
var self__ = this;
var this__5305__auto____$1 = this;
if(cljs.core.vector_QMARK_(entry__5306__auto__)){
return this__5305__auto____$1.cljs$core$IAssociative$_assoc$arity$3(null,cljs.core._nth(entry__5306__auto__,(0)),cljs.core._nth(entry__5306__auto__,(1)));
} else {
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3(cljs.core._conj,this__5305__auto____$1,entry__5306__auto__);
}
}));

(clojure.test.check.generators.Generator.getBasis = (function (){
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"gen","gen",1783106829,null)], null);
}));

(clojure.test.check.generators.Generator.cljs$lang$type = true);

(clojure.test.check.generators.Generator.cljs$lang$ctorPrSeq = (function (this__5346__auto__){
return (new cljs.core.List(null,"clojure.test.check.generators/Generator",null,(1),null));
}));

(clojure.test.check.generators.Generator.cljs$lang$ctorPrWriter = (function (this__5346__auto__,writer__5347__auto__){
return cljs.core._write(writer__5347__auto__,"clojure.test.check.generators/Generator");
}));

/**
 * Positional factory function for clojure.test.check.generators/Generator.
 */
clojure.test.check.generators.__GT_Generator = (function clojure$test$check$generators$__GT_Generator(gen){
return (new clojure.test.check.generators.Generator(gen,null,null,null));
});

/**
 * Factory function for clojure.test.check.generators/Generator, taking a map of keywords to field values.
 */
clojure.test.check.generators.map__GT_Generator = (function clojure$test$check$generators$map__GT_Generator(G__133378){
var extmap__5342__auto__ = (function (){var G__133388 = cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(G__133378,new cljs.core.Keyword(null,"gen","gen",142575302));
if(cljs.core.record_QMARK_(G__133378)){
return cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,G__133388);
} else {
return G__133388;
}
})();
return (new clojure.test.check.generators.Generator(new cljs.core.Keyword(null,"gen","gen",142575302).cljs$core$IFn$_invoke$arity$1(G__133378),null,cljs.core.not_empty(extmap__5342__auto__),null));
});

/**
 * Test if `x` is a generator. Generators should be treated as opaque values.
 */
clojure.test.check.generators.generator_QMARK_ = (function clojure$test$check$generators$generator_QMARK_(x){
return (x instanceof clojure.test.check.generators.Generator);
});
clojure.test.check.generators.make_gen = (function clojure$test$check$generators$make_gen(generator_fn){
return (new clojure.test.check.generators.Generator(generator_fn,null,null,null));
});
/**
 * Internal function.
 */
clojure.test.check.generators.call_gen = (function clojure$test$check$generators$call_gen(p__133389,rnd,size){
var map__133390 = p__133389;
var map__133390__$1 = cljs.core.__destructure_map(map__133390);
var generator_fn = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__133390__$1,new cljs.core.Keyword(null,"gen","gen",142575302));
return (generator_fn.cljs$core$IFn$_invoke$arity$2 ? generator_fn.cljs$core$IFn$_invoke$arity$2(rnd,size) : generator_fn.call(null,rnd,size));
});
/**
 * Internal function.
 */
clojure.test.check.generators.gen_pure = (function clojure$test$check$generators$gen_pure(value){
return clojure.test.check.generators.make_gen((function (rnd,size){
return value;
}));
});
/**
 * Internal function.
 */
clojure.test.check.generators.gen_fmap = (function clojure$test$check$generators$gen_fmap(k,p__133391){
var map__133392 = p__133391;
var map__133392__$1 = cljs.core.__destructure_map(map__133392);
var h = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__133392__$1,new cljs.core.Keyword(null,"gen","gen",142575302));
return clojure.test.check.generators.make_gen((function (rnd,size){
var G__133393 = (h.cljs$core$IFn$_invoke$arity$2 ? h.cljs$core$IFn$_invoke$arity$2(rnd,size) : h.call(null,rnd,size));
return (k.cljs$core$IFn$_invoke$arity$1 ? k.cljs$core$IFn$_invoke$arity$1(G__133393) : k.call(null,G__133393));
}));
});
/**
 * Internal function.
 */
clojure.test.check.generators.gen_bind = (function clojure$test$check$generators$gen_bind(p__133394,k){
var map__133395 = p__133394;
var map__133395__$1 = cljs.core.__destructure_map(map__133395);
var h = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__133395__$1,new cljs.core.Keyword(null,"gen","gen",142575302));
return clojure.test.check.generators.make_gen((function (rnd,size){
var vec__133396 = clojure.test.check.random.split(rnd);
var r1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__133396,(0),null);
var r2 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__133396,(1),null);
var inner = (h.cljs$core$IFn$_invoke$arity$2 ? h.cljs$core$IFn$_invoke$arity$2(r1,size) : h.call(null,r1,size));
var map__133399 = (k.cljs$core$IFn$_invoke$arity$1 ? k.cljs$core$IFn$_invoke$arity$1(inner) : k.call(null,inner));
var map__133399__$1 = cljs.core.__destructure_map(map__133399);
var result = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__133399__$1,new cljs.core.Keyword(null,"gen","gen",142575302));
return (result.cljs$core$IFn$_invoke$arity$2 ? result.cljs$core$IFn$_invoke$arity$2(r2,size) : result.call(null,r2,size));
}));
});
/**
 * Internal function.
 * 
 *   Given a random number generator, returns an infinite lazy sequence
 *   of random number generators.
 */
clojure.test.check.generators.lazy_random_states = (function clojure$test$check$generators$lazy_random_states(rr){
return (new cljs.core.LazySeq(null,(function (){
var vec__133400 = clojure.test.check.random.split(rr);
var r1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__133400,(0),null);
var r2 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__133400,(1),null);
return cljs.core.cons(r1,(clojure.test.check.generators.lazy_random_states.cljs$core$IFn$_invoke$arity$1 ? clojure.test.check.generators.lazy_random_states.cljs$core$IFn$_invoke$arity$1(r2) : clojure.test.check.generators.lazy_random_states.call(null,r2)));
}),null,null));
});
/**
 * Takes a collection of generators and returns a generator of vectors.
 */
clojure.test.check.generators.gen_tuple = (function clojure$test$check$generators$gen_tuple(gens){
return clojure.test.check.generators.make_gen((function (rnd,size){
return cljs.core.mapv.cljs$core$IFn$_invoke$arity$3((function (p1__133403_SHARP_,p2__133404_SHARP_){
return clojure.test.check.generators.call_gen(p1__133403_SHARP_,p2__133404_SHARP_,size);
}),gens,clojure.test.check.random.split_n(rnd,cljs.core.count(gens)));
}));
});
/**
 * Returns a generator like `gen` but with values transformed by `f`.
 *   E.g.:
 * 
 *    (gen/sample (gen/fmap str gen/nat))
 *    => ("0" "1" "0" "1" "4" "3" "6" "6" "4" "2")
 * 
 *   Also see gen/let for a macro with similar functionality.
 */
clojure.test.check.generators.fmap = (function clojure$test$check$generators$fmap(f,gen){
if(clojure.test.check.generators.generator_QMARK_(gen)){
} else {
throw (new Error(["Assert failed: ","Second arg to fmap must be a generator","\n","(generator? gen)"].join('')));
}

return clojure.test.check.generators.gen_fmap((function (p1__133405_SHARP_){
return clojure.test.check.rose_tree.fmap(f,p1__133405_SHARP_);
}),gen);
});
/**
 * Creates a generator that always returns `value`,
 *   and never shrinks. You can think of this as
 *   the `constantly` of generators. E.g.:
 * 
 *    (gen/sample (gen/return 42))
 *    => (42 42 42 42 42 42 42 42 42 42)
 */
clojure.test.check.generators.return$ = (function clojure$test$check$generators$return(value){
return clojure.test.check.generators.gen_pure(clojure.test.check.rose_tree.pure(value));
});
clojure.test.check.generators.bind_helper = (function clojure$test$check$generators$bind_helper(f){
return (function (rose){
return clojure.test.check.generators.gen_fmap(clojure.test.check.rose_tree.join,clojure.test.check.generators.make_gen((function (rnd,size){
return clojure.test.check.rose_tree.fmap((function (p1__133406_SHARP_){
return clojure.test.check.generators.call_gen((f.cljs$core$IFn$_invoke$arity$1 ? f.cljs$core$IFn$_invoke$arity$1(p1__133406_SHARP_) : f.call(null,p1__133406_SHARP_)),rnd,size);
}),rose);
})));
});
});
/**
 * Creates a new generator that passes the result of `gen` into function
 *   `f`. `f` should return a new generator. This allows you to create new
 *   generators that depend on the value of other generators. For example,
 *   to create a generator of permutations which first generates a
 *   `num-elements` and then generates a shuffling of `(range num-elements)`:
 * 
 *    (gen/bind gen/nat
 *              ;; this function takes a value generated by
 *              ;; the generator above and returns a new generator
 *              ;; which shuffles the collection returned by `range`
 *              (fn [num-elements]
 *                (gen/shuffle (range num-elements))))
 * 
 *   Also see gen/let for a macro with similar functionality.
 */
clojure.test.check.generators.bind = (function clojure$test$check$generators$bind(generator,f){
if(clojure.test.check.generators.generator_QMARK_(generator)){
} else {
throw (new Error(["Assert failed: ","First arg to bind must be a generator","\n","(generator? generator)"].join('')));
}

return clojure.test.check.generators.gen_bind(generator,clojure.test.check.generators.bind_helper(f));
});
/**
 * Internal function.
 */
clojure.test.check.generators.make_size_range_seq = (function clojure$test$check$generators$make_size_range_seq(max_size){
return cljs.core.cycle(cljs.core.range.cljs$core$IFn$_invoke$arity$2((0),max_size));
});
/**
 * Returns an infinite sequence of realized values from `generator`.
 * 
 *   Note that this function is a dev helper and is not meant to be used
 *   to build other generators.
 */
clojure.test.check.generators.sample_seq = (function clojure$test$check$generators$sample_seq(var_args){
var G__133410 = arguments.length;
switch (G__133410) {
case 1:
return clojure.test.check.generators.sample_seq.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return clojure.test.check.generators.sample_seq.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(clojure.test.check.generators.sample_seq.cljs$core$IFn$_invoke$arity$1 = (function (generator){
return clojure.test.check.generators.sample_seq.cljs$core$IFn$_invoke$arity$2(generator,(200));
}));

(clojure.test.check.generators.sample_seq.cljs$core$IFn$_invoke$arity$2 = (function (generator,max_size){
var r = clojure.test.check.random.make_random.cljs$core$IFn$_invoke$arity$0();
var size_seq = clojure.test.check.generators.make_size_range_seq(max_size);
return cljs.core.map.cljs$core$IFn$_invoke$arity$3((function (p1__133407_SHARP_,p2__133408_SHARP_){
return clojure.test.check.rose_tree.root(clojure.test.check.generators.call_gen(generator,p1__133407_SHARP_,p2__133408_SHARP_));
}),clojure.test.check.generators.lazy_random_states(r),size_seq);
}));

(clojure.test.check.generators.sample_seq.cljs$lang$maxFixedArity = 2);

/**
 * Return a sequence of `num-samples` (default 10)
 *   realized values from `generator`.
 * 
 *   The sequence starts with small values from the generator, which
 *   probably do not reflect the variety of values that will be generated
 *   during a longer test run.
 * 
 *   Note that this function is a dev helper and is not meant to be used
 *   to build other generators.
 */
clojure.test.check.generators.sample = (function clojure$test$check$generators$sample(var_args){
var G__133412 = arguments.length;
switch (G__133412) {
case 1:
return clojure.test.check.generators.sample.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return clojure.test.check.generators.sample.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(clojure.test.check.generators.sample.cljs$core$IFn$_invoke$arity$1 = (function (generator){
return clojure.test.check.generators.sample.cljs$core$IFn$_invoke$arity$2(generator,(10));
}));

(clojure.test.check.generators.sample.cljs$core$IFn$_invoke$arity$2 = (function (generator,num_samples){
if(clojure.test.check.generators.generator_QMARK_(generator)){
} else {
throw (new Error(["Assert failed: ","First arg to sample must be a generator","\n","(generator? generator)"].join('')));
}

return cljs.core.take.cljs$core$IFn$_invoke$arity$2(num_samples,clojure.test.check.generators.sample_seq.cljs$core$IFn$_invoke$arity$1(generator));
}));

(clojure.test.check.generators.sample.cljs$lang$maxFixedArity = 2);

/**
 * Returns a single sample value from the generator.
 * 
 *   Note that this function is a dev helper and is not meant to be used
 *   to build other generators.
 * 
 *   Optional args:
 * 
 *   - size: the abstract size parameter, defaults to 30
 *   - seed: the seed for the random number generator, an integer
 */
clojure.test.check.generators.generate = (function clojure$test$check$generators$generate(var_args){
var G__133414 = arguments.length;
switch (G__133414) {
case 1:
return clojure.test.check.generators.generate.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return clojure.test.check.generators.generate.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return clojure.test.check.generators.generate.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(clojure.test.check.generators.generate.cljs$core$IFn$_invoke$arity$1 = (function (generator){
return clojure.test.check.generators.generate.cljs$core$IFn$_invoke$arity$2(generator,(30));
}));

(clojure.test.check.generators.generate.cljs$core$IFn$_invoke$arity$2 = (function (generator,size){
var rng = clojure.test.check.random.make_random.cljs$core$IFn$_invoke$arity$0();
return clojure.test.check.rose_tree.root(clojure.test.check.generators.call_gen(generator,rng,size));
}));

(clojure.test.check.generators.generate.cljs$core$IFn$_invoke$arity$3 = (function (generator,size,seed){
var rng = clojure.test.check.random.make_random.cljs$core$IFn$_invoke$arity$1(seed);
return clojure.test.check.rose_tree.root(clojure.test.check.generators.call_gen(generator,rng,size));
}));

(clojure.test.check.generators.generate.cljs$lang$maxFixedArity = 3);

clojure.test.check.generators.halfs = (function clojure$test$check$generators$halfs(n){
return cljs.core.take_while.cljs$core$IFn$_invoke$arity$2((function (p1__133415_SHARP_){
return cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2((0),p1__133415_SHARP_);
}),cljs.core.iterate((function (p1__133416_SHARP_){
return cljs.core.quot(p1__133416_SHARP_,(2));
}),n));
});
clojure.test.check.generators.shrink_int = (function clojure$test$check$generators$shrink_int(integer){
return cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__133417_SHARP_){
return (integer - p1__133417_SHARP_);
}),clojure.test.check.generators.halfs(integer));
});
clojure.test.check.generators.int_rose_tree = (function clojure$test$check$generators$int_rose_tree(value){
return clojure.test.check.rose_tree.make_rose(value,cljs.core.map.cljs$core$IFn$_invoke$arity$2(clojure.test.check.generators.int_rose_tree,clojure.test.check.generators.shrink_int(value)));
});
clojure.test.check.generators.calc_long = (function clojure$test$check$generators$calc_long(factor,lower,upper){
return cljs.core.long$(Math.floor((lower + ((factor * (1.0 + upper)) - (factor * lower)))));
});
clojure.test.check.generators.rand_range = (function clojure$test$check$generators$rand_range(rnd,lower,upper){
if((lower <= upper)){
} else {
throw (new Error("Assert failed: (<= lower upper)"));
}

return clojure.test.check.generators.calc_long(clojure.test.check.random.rand_double(rnd),lower,upper);
});
/**
 * Creates a generator that depends on the size parameter.
 *   `sized-gen` is a function that takes an integer and returns
 *   a generator.
 * 
 *   Examples:
 * 
 *    ;; generates vectors of booleans where the length always exactly
 *    ;; matches the `size` parameter
 *    (gen/sample (gen/sized (fn [size] (gen/vector gen/boolean size))))
 *    => ([]
 *        [false]
 *        [true true]
 *        [false true false]
 *        [false true true true]
 *        [false false true true false]
 *        [false true false true true false]
 *        [true false true true true false false]
 *        [true true false false false true false false]
 *        [false false false true true false true false true])
 */
clojure.test.check.generators.sized = (function clojure$test$check$generators$sized(sized_gen){
return clojure.test.check.generators.make_gen((function (rnd,size){
var sized_gen__$1 = (sized_gen.cljs$core$IFn$_invoke$arity$1 ? sized_gen.cljs$core$IFn$_invoke$arity$1(size) : sized_gen.call(null,size));
return clojure.test.check.generators.call_gen(sized_gen__$1,rnd,size);
}));
});
/**
 * Creates a new generator with `size` always bound to `n`.
 * 
 *    (gen/sample (gen/set (gen/resize 200 gen/double)))
 *    => (#{}
 *        #{-4.994772362980037E147}
 *        #{-4.234418056487335E-146}
 *        #{}
 *        #{}
 *        #{}
 *        #{NaN}
 *        #{8.142414100982609E-63}
 *        #{-3.58429955903876E-159 2.8563794617604296E-154
 *          4.1021360195776005E-100 1.9084564045332549E-38}
 *        #{-2.1582818131881376E83 -5.8460065493236117E48 9.729260993803226E166})
 */
clojure.test.check.generators.resize = (function clojure$test$check$generators$resize(n,generator){
if(clojure.test.check.generators.generator_QMARK_(generator)){
} else {
throw (new Error(["Assert failed: ","Second arg to resize must be a generator","\n","(generator? generator)"].join('')));
}

var map__133418 = generator;
var map__133418__$1 = cljs.core.__destructure_map(map__133418);
var gen = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__133418__$1,new cljs.core.Keyword(null,"gen","gen",142575302));
return clojure.test.check.generators.make_gen((function (rnd,_size){
return (gen.cljs$core$IFn$_invoke$arity$2 ? gen.cljs$core$IFn$_invoke$arity$2(rnd,n) : gen.call(null,rnd,n));
}));
});
/**
 * Creates a new generator that modifies the size parameter by the
 *   given function. Intended to support generators with sizes that need
 *   to grow at different rates compared to the normal linear scaling.
 * 
 *    (gen/sample (gen/tuple (gen/scale #(/ % 10) gen/nat)
 *                           gen/nat
 *                           (gen/scale #(* % 10) gen/nat)))
 *    => ([0 0 0]  [0 1 2]  [0 2 13] [0 1 6]  [0 1 23]
 *        [0 2 42] [0 1 26] [0 1 12] [0 1 12] [0 0 3])
 */
clojure.test.check.generators.scale = (function clojure$test$check$generators$scale(f,generator){
return clojure.test.check.generators.sized((function (n){
return clojure.test.check.generators.resize((f.cljs$core$IFn$_invoke$arity$1 ? f.cljs$core$IFn$_invoke$arity$1(n) : f.call(null,n)),generator);
}));
});
/**
 * Creates a generator that generates integer numbers uniformly in
 *   the range `lower` to `upper`, inclusive.
 * 
 *       (gen/sample (gen/choose 200 800))
 *       => (331 241 593 339 643 718 688 473 247 694)
 */
clojure.test.check.generators.choose = (function clojure$test$check$generators$choose(lower,upper){
return clojure.test.check.generators.make_gen((function (rnd,_size){
var value = clojure.test.check.generators.rand_range(rnd,lower,upper);
return clojure.test.check.rose_tree.filter((function (p1__133419_SHARP_){
return (((p1__133419_SHARP_ >= lower)) && ((p1__133419_SHARP_ <= upper)));
}),clojure.test.check.generators.int_rose_tree(value));
}));
});
/**
 * Creates a generator that randomly chooses a value from the list of
 *   provided generators. Shrinks toward choosing an earlier generator,
 *   as well as shrinking the value generated by the chosen generator.
 * 
 *    (gen/sample (gen/one-of [gen/small-integer gen/boolean (gen/vector gen/small-integer)]))
 *    => (true [] -1 [0] [1 -4 -4 1] true 4 [] 6 true)
 */
clojure.test.check.generators.one_of = (function clojure$test$check$generators$one_of(generators){
if(cljs.core.every_QMARK_(clojure.test.check.generators.generator_QMARK_,generators)){
} else {
throw (new Error(["Assert failed: ","Arg to one-of must be a collection of generators","\n","(every? generator? generators)"].join('')));
}

if(cljs.core.seq(generators)){
} else {
throw (new Error(["Assert failed: ","one-of cannot be called with an empty collection","\n","(seq generators)"].join('')));
}

return clojure.test.check.generators.bind(clojure.test.check.generators.choose((0),(cljs.core.count(generators) - (1))),(function (p1__133420_SHARP_){
return cljs.core.nth.cljs$core$IFn$_invoke$arity$2(generators,p1__133420_SHARP_);
}));
});
/**
 * Returns an index into the `likelihoods` sequence.
 */
clojure.test.check.generators.pick = (function clojure$test$check$generators$pick(likelihoods,n){
return cljs.core.count(cljs.core.take_while.cljs$core$IFn$_invoke$arity$2((function (p1__133421_SHARP_){
return (p1__133421_SHARP_ <= n);
}),cljs.core.rest(cljs.core.reductions.cljs$core$IFn$_invoke$arity$3(cljs.core._PLUS_,(0),likelihoods))));
});
/**
 * Creates a generator that chooses a generator from `pairs` based on the
 *   provided likelihoods. The likelihood of a given generator being chosen is
 *   its likelihood divided by the sum of all likelihoods. Shrinks toward
 *   choosing an earlier generator, as well as shrinking the value generated
 *   by the chosen generator.
 * 
 *   Examples:
 * 
 *    (gen/sample (gen/frequency [[5 gen/small-integer] [3 (gen/vector gen/small-integer)] [2 gen/boolean]]))
 *    => (true [] -1 [0] [1 -4 -4 1] true 4 [] 6 true)
 */
clojure.test.check.generators.frequency = (function clojure$test$check$generators$frequency(pairs){
if(cljs.core.every_QMARK_((function (p__133422){
var vec__133423 = p__133422;
var x = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__133423,(0),null);
var g = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__133423,(1),null);
return ((typeof x === 'number') && (clojure.test.check.generators.generator_QMARK_(g)));
}),pairs)){
} else {
throw (new Error(["Assert failed: ","Arg to frequency must be a list of [num generator] pairs","\n","(every? (fn [[x g]] (and (number? x) (generator? g))) pairs)"].join('')));
}

var pairs__$1 = cljs.core.filter.cljs$core$IFn$_invoke$arity$2(cljs.core.comp.cljs$core$IFn$_invoke$arity$2(cljs.core.pos_QMARK_,cljs.core.first),pairs);
var total = cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core._PLUS_,cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.first,pairs__$1));
if(cljs.core.seq(pairs__$1)){
} else {
throw (new Error(["Assert failed: ","frequency must be called with at least one non-zero weight","\n","(seq pairs)"].join('')));
}

return clojure.test.check.generators.make_gen((function (rnd,size){
return clojure.test.check.generators.call_gen(clojure.test.check.generators.gen_bind(clojure.test.check.generators.choose((0),(total - (1))),(function (x){
var idx = clojure.test.check.generators.pick(cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.first,pairs__$1),clojure.test.check.rose_tree.root(x));
return clojure.test.check.generators.gen_fmap((function (rose){
return clojure.test.check.rose_tree.make_rose(clojure.test.check.rose_tree.root(rose),(new cljs.core.LazySeq(null,(function (){
return cljs.core.concat.cljs$core$IFn$_invoke$arity$2((function (){var iter__5480__auto__ = (function clojure$test$check$generators$frequency_$_iter__133426(s__133427){
return (new cljs.core.LazySeq(null,(function (){
var s__133427__$1 = s__133427;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__133427__$1);
if(temp__5804__auto__){
var s__133427__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__133427__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__133427__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__133429 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__133428 = (0);
while(true){
if((i__133428 < size__5479__auto__)){
var idx__$1 = cljs.core._nth(c__5478__auto__,i__133428);
cljs.core.chunk_append(b__133429,clojure.test.check.generators.call_gen(cljs.core.second(cljs.core.nth.cljs$core$IFn$_invoke$arity$2(pairs__$1,idx__$1)),rnd,size));

var G__133587 = (i__133428 + (1));
i__133428 = G__133587;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__133429),clojure$test$check$generators$frequency_$_iter__133426(cljs.core.chunk_rest(s__133427__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__133429),null);
}
} else {
var idx__$1 = cljs.core.first(s__133427__$2);
return cljs.core.cons(clojure.test.check.generators.call_gen(cljs.core.second(cljs.core.nth.cljs$core$IFn$_invoke$arity$2(pairs__$1,idx__$1)),rnd,size),clojure$test$check$generators$frequency_$_iter__133426(cljs.core.rest(s__133427__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(cljs.core.range.cljs$core$IFn$_invoke$arity$1(idx));
})(),clojure.test.check.rose_tree.children(rose));
}),null,null)));
}),cljs.core.second(cljs.core.nth.cljs$core$IFn$_invoke$arity$2(pairs__$1,idx)));
})),rnd,size);
}));
});
/**
 * Creates a generator that randomly chooses an element from `coll`.
 * 
 *    (gen/sample (gen/elements [:foo :bar :baz]))
 *    => (:foo :baz :baz :bar :foo :foo :bar :bar :foo :bar)
 */
clojure.test.check.generators.elements = (function clojure$test$check$generators$elements(coll){
if(cljs.core.seq(coll)){
} else {
throw (new Error(["Assert failed: ","elements cannot be called with an empty collection","\n","(seq coll)"].join('')));
}

var v = cljs.core.vec(coll);
return clojure.test.check.generators.gen_fmap((function (p1__133430_SHARP_){
return clojure.test.check.rose_tree.fmap(v,p1__133430_SHARP_);
}),clojure.test.check.generators.choose((0),(cljs.core.count(v) - (1))));
});
clojure.test.check.generators.such_that_helper = (function clojure$test$check$generators$such_that_helper(pred,gen,p__133431,rng,size){
var map__133432 = p__133431;
var map__133432__$1 = cljs.core.__destructure_map(map__133432);
var ex_fn = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__133432__$1,new cljs.core.Keyword(null,"ex-fn","ex-fn",-284925510));
var max_tries = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__133432__$1,new cljs.core.Keyword(null,"max-tries","max-tries",-1824441792));
var tries_left = max_tries;
var rng__$1 = rng;
var size__$1 = size;
while(true){
if((tries_left === (0))){
throw (function (){var G__133438 = new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"pred","pred",1927423397),pred,new cljs.core.Keyword(null,"gen","gen",142575302),gen,new cljs.core.Keyword(null,"max-tries","max-tries",-1824441792),max_tries], null);
return (ex_fn.cljs$core$IFn$_invoke$arity$1 ? ex_fn.cljs$core$IFn$_invoke$arity$1(G__133438) : ex_fn.call(null,G__133438));
})();
} else {
var vec__133439 = clojure.test.check.random.split(rng__$1);
var r1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__133439,(0),null);
var r2 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__133439,(1),null);
var value = clojure.test.check.generators.call_gen(gen,r1,size__$1);
if(cljs.core.truth_((function (){var G__133442 = clojure.test.check.rose_tree.root(value);
return (pred.cljs$core$IFn$_invoke$arity$1 ? pred.cljs$core$IFn$_invoke$arity$1(G__133442) : pred.call(null,G__133442));
})())){
return clojure.test.check.rose_tree.filter(pred,value);
} else {
var G__133588 = (tries_left - (1));
var G__133589 = r2;
var G__133590 = (size__$1 + (1));
tries_left = G__133588;
rng__$1 = G__133589;
size__$1 = G__133590;
continue;
}
}
break;
}
});
clojure.test.check.generators.default_such_that_opts = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"ex-fn","ex-fn",-284925510),(function (p__133443){
var map__133444 = p__133443;
var map__133444__$1 = cljs.core.__destructure_map(map__133444);
var arg = map__133444__$1;
var max_tries = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__133444__$1,new cljs.core.Keyword(null,"max-tries","max-tries",-1824441792));
return cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2(["Couldn't satisfy such-that predicate after ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(max_tries)," tries."].join(''),arg);
}),new cljs.core.Keyword(null,"max-tries","max-tries",-1824441792),(10)], null);
/**
 * Creates a generator that generates values from `gen` that satisfy predicate
 *   `pred`. Care is needed to ensure there is a high chance `gen` will satisfy
 *   `pred`. By default, `such-that` will try 10 times to generate a value that
 *   satisfies the predicate. If no value passes this predicate after this number
 *   of iterations, a runtime exception will be thrown. Note also that each
 *   time such-that retries, it will increase the size parameter.
 * 
 *   Examples:
 * 
 *    ;; generate non-empty vectors of integers
 *    ;; (note, gen/not-empty does exactly this)
 *    (gen/such-that not-empty (gen/vector gen/small-integer))
 * 
 *   You can customize `such-that` by passing an optional third argument, which can
 *   either be an integer representing the maximum number of times test.check
 *   will try to generate a value matching the predicate, or a map:
 * 
 *    :max-tries  positive integer, the maximum number of tries (default 10)
 *    :ex-fn      a function of one arg that will be called if test.check cannot
 *                generate a matching value; it will be passed a map with `:gen`,
 *                `:pred`, and `:max-tries` and should return an exception
 */
clojure.test.check.generators.such_that = (function clojure$test$check$generators$such_that(var_args){
var G__133446 = arguments.length;
switch (G__133446) {
case 2:
return clojure.test.check.generators.such_that.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return clojure.test.check.generators.such_that.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(clojure.test.check.generators.such_that.cljs$core$IFn$_invoke$arity$2 = (function (pred,gen){
return clojure.test.check.generators.such_that.cljs$core$IFn$_invoke$arity$3(pred,gen,(10));
}));

(clojure.test.check.generators.such_that.cljs$core$IFn$_invoke$arity$3 = (function (pred,gen,max_tries_or_opts){
var opts = ((cljs.core.integer_QMARK_(max_tries_or_opts))?new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"max-tries","max-tries",-1824441792),max_tries_or_opts], null):((cljs.core.map_QMARK_(max_tries_or_opts))?max_tries_or_opts:(function(){throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2("Bad argument to such-that!",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"max-tries-or-opts","max-tries-or-opts",-609860571),max_tries_or_opts], null))})()
));
var opts__$1 = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([clojure.test.check.generators.default_such_that_opts,opts], 0));
if(clojure.test.check.generators.generator_QMARK_(gen)){
} else {
throw (new Error(["Assert failed: ","Second arg to such-that must be a generator","\n","(generator? gen)"].join('')));
}

return clojure.test.check.generators.make_gen((function (rand_seed,size){
return clojure.test.check.generators.such_that_helper(pred,gen,opts__$1,rand_seed,size);
}));
}));

(clojure.test.check.generators.such_that.cljs$lang$maxFixedArity = 3);

/**
 * Modifies a generator so that it doesn't generate empty collections.
 * 
 *   Examples:
 * 
 *    ;; generate a vector of booleans, but never the empty vector
 *    (gen/sample (gen/not-empty (gen/vector gen/boolean)))
 *    => ([false]
 *        [false false]
 *        [false false]
 *        [false false false]
 *        [false false false false]
 *        [false true true]
 *        [true false false false]
 *        [true]
 *        [true true true false false true false]
 *        [false true true true false true true true false])
 */
clojure.test.check.generators.not_empty = (function clojure$test$check$generators$not_empty(gen){
if(clojure.test.check.generators.generator_QMARK_(gen)){
} else {
throw (new Error(["Assert failed: ","Arg to not-empty must be a generator","\n","(generator? gen)"].join('')));
}

return clojure.test.check.generators.such_that.cljs$core$IFn$_invoke$arity$2(cljs.core.not_empty,gen);
});
/**
 * Creates a new generator that is just like `gen`, except does not shrink
 *   at all. This can be useful when shrinking is taking a long time or is not
 *   applicable to the domain.
 */
clojure.test.check.generators.no_shrink = (function clojure$test$check$generators$no_shrink(gen){
if(clojure.test.check.generators.generator_QMARK_(gen)){
} else {
throw (new Error(["Assert failed: ","Arg to no-shrink must be a generator","\n","(generator? gen)"].join('')));
}

return clojure.test.check.generators.gen_fmap((function (rose){
return clojure.test.check.rose_tree.make_rose(clojure.test.check.rose_tree.root(rose),cljs.core.PersistentVector.EMPTY);
}),gen);
});
/**
 * Creates a new generator like `gen`, but will consider nodes for shrinking
 *   even if their parent passes the test (up to one additional level).
 */
clojure.test.check.generators.shrink_2 = (function clojure$test$check$generators$shrink_2(gen){
if(clojure.test.check.generators.generator_QMARK_(gen)){
} else {
throw (new Error(["Assert failed: ","Arg to shrink-2 must be a generator","\n","(generator? gen)"].join('')));
}

return clojure.test.check.generators.gen_fmap(clojure.test.check.rose_tree.collapse,gen);
});
/**
 * Generates one of `true` or `false`. Shrinks to `false`.
 */
clojure.test.check.generators.boolean$ = clojure.test.check.generators.elements(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [false,true], null));
/**
 * Creates a generator that returns a vector, whose elements are chosen
 *   from the generators in the same position. The individual elements shrink
 *   according to their generator, but the vector will never shrink in count.
 * 
 *   Examples:
 * 
 *    (def t (gen/tuple gen/small-integer gen/boolean))
 *    (sample t)
 *    ;; => ([1 true] [2 true] [2 false] [1 false] [0 true] [-2 false] [-6 false]
 *    ;; =>  [3 true] [-4 false] [9 true]))
 */
clojure.test.check.generators.tuple = (function clojure$test$check$generators$tuple(var_args){
var args__5732__auto__ = [];
var len__5726__auto___133592 = arguments.length;
var i__5727__auto___133593 = (0);
while(true){
if((i__5727__auto___133593 < len__5726__auto___133592)){
args__5732__auto__.push((arguments[i__5727__auto___133593]));

var G__133594 = (i__5727__auto___133593 + (1));
i__5727__auto___133593 = G__133594;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((0) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((0)),(0),null)):null);
return clojure.test.check.generators.tuple.cljs$core$IFn$_invoke$arity$variadic(argseq__5733__auto__);
});

(clojure.test.check.generators.tuple.cljs$core$IFn$_invoke$arity$variadic = (function (generators){
if(cljs.core.every_QMARK_(clojure.test.check.generators.generator_QMARK_,generators)){
} else {
throw (new Error(["Assert failed: ","Args to tuple must be generators","\n","(every? generator? generators)"].join('')));
}

return clojure.test.check.generators.gen_fmap((function (roses){
return clojure.test.check.rose_tree.zip(cljs.core.vector,roses);
}),clojure.test.check.generators.gen_tuple(generators));
}));

(clojure.test.check.generators.tuple.cljs$lang$maxFixedArity = (0));

/** @this {Function} */
(clojure.test.check.generators.tuple.cljs$lang$applyTo = (function (seq133447){
var self__5712__auto__ = this;
return self__5712__auto__.cljs$core$IFn$_invoke$arity$variadic(cljs.core.seq(seq133447));
}));

/**
 * Generates non-negative integers bounded by the generator's `size`
 *   parameter. Shrinks to zero.
 */
clojure.test.check.generators.nat = clojure.test.check.generators.sized((function (size){
return clojure.test.check.generators.choose((0),size);
}));
/**
 * Generates a positive or negative integer bounded by the generator's
 *   `size` parameter. Shrinks to zero.
 */
clojure.test.check.generators.small_integer = clojure.test.check.generators.sized((function (size){
return clojure.test.check.generators.choose((- size),size);
}));
/**
 * Deprecated - use gen/small-integer instead.
 * 
 *   Generates a positive or negative integer bounded by the generator's
 *   `size` parameter.
 */
clojure.test.check.generators.int$ = clojure.test.check.generators.small_integer;
/**
 * Deprecated - use gen/nat instead (see also gen/large-integer).
 * 
 *   (this generator, despite its name, can generate 0)
 * 
 *   Generates nonnegative integers bounded by the generator's `size` parameter.
 */
clojure.test.check.generators.pos_int = clojure.test.check.generators.nat;
/**
 * Deprecated - use (gen/fmap - gen/nat) instead (see also gen/large-integer).
 * 
 *   (this generator, despite its name, can generate 0)
 * 
 *   Generates nonpositive integers bounded by the generator's `size` parameter.
 */
clojure.test.check.generators.neg_int = clojure.test.check.generators.fmap((function (p1__133449_SHARP_){
return ((-1) * p1__133449_SHARP_);
}),clojure.test.check.generators.nat);
/**
 * Deprecated - use (gen/fmap inc gen/nat) instead (see also gen/large-integer).
 * 
 *   Generates positive integers bounded by the generator's `size` + 1
 */
clojure.test.check.generators.s_pos_int = clojure.test.check.generators.fmap(cljs.core.inc,clojure.test.check.generators.nat);
/**
 * Deprecated - use (gen/fmap (comp dec -) gen/nat) instead (see also gen/large-integer).
 * 
 *   Generates negative integers bounded by the generator's `size` + 1
 */
clojure.test.check.generators.s_neg_int = clojure.test.check.generators.fmap(cljs.core.dec,clojure.test.check.generators.neg_int);
/**
 * Creates a generator of vectors whose elements are chosen from
 *   `generator`. The count of the vector will be bounded by the `size`
 *   generator parameter.
 */
clojure.test.check.generators.vector = (function clojure$test$check$generators$vector(var_args){
var G__133452 = arguments.length;
switch (G__133452) {
case 1:
return clojure.test.check.generators.vector.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return clojure.test.check.generators.vector.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return clojure.test.check.generators.vector.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(clojure.test.check.generators.vector.cljs$core$IFn$_invoke$arity$1 = (function (generator){
if(clojure.test.check.generators.generator_QMARK_(generator)){
} else {
throw (new Error(["Assert failed: ","Arg to vector must be a generator","\n","(generator? generator)"].join('')));
}

return clojure.test.check.generators.gen_bind(clojure.test.check.generators.sized((function (p1__133450_SHARP_){
return clojure.test.check.generators.choose((0),p1__133450_SHARP_);
})),(function (num_elements_rose){
return clojure.test.check.generators.gen_fmap((function (roses){
return clojure.test.check.rose_tree.shrink_vector(cljs.core.vector,roses);
}),clojure.test.check.generators.gen_tuple(cljs.core.repeat.cljs$core$IFn$_invoke$arity$2(clojure.test.check.rose_tree.root(num_elements_rose),generator)));
}));
}));

(clojure.test.check.generators.vector.cljs$core$IFn$_invoke$arity$2 = (function (generator,num_elements){
if(clojure.test.check.generators.generator_QMARK_(generator)){
} else {
throw (new Error(["Assert failed: ","First arg to vector must be a generator","\n","(generator? generator)"].join('')));
}

return cljs.core.apply.cljs$core$IFn$_invoke$arity$2(clojure.test.check.generators.tuple,cljs.core.repeat.cljs$core$IFn$_invoke$arity$2(num_elements,generator));
}));

(clojure.test.check.generators.vector.cljs$core$IFn$_invoke$arity$3 = (function (generator,min_elements,max_elements){
if(clojure.test.check.generators.generator_QMARK_(generator)){
} else {
throw (new Error(["Assert failed: ","First arg to vector must be a generator","\n","(generator? generator)"].join('')));
}

return clojure.test.check.generators.gen_bind(clojure.test.check.generators.choose(min_elements,max_elements),(function (num_elements_rose){
return clojure.test.check.generators.gen_fmap((function (roses){
return clojure.test.check.rose_tree.filter((function (v){
return (((cljs.core.count(v) >= min_elements)) && ((cljs.core.count(v) <= max_elements)));
}),clojure.test.check.rose_tree.shrink_vector(cljs.core.vector,roses));
}),clojure.test.check.generators.gen_tuple(cljs.core.repeat.cljs$core$IFn$_invoke$arity$2(clojure.test.check.rose_tree.root(num_elements_rose),generator)));
}));
}));

(clojure.test.check.generators.vector.cljs$lang$maxFixedArity = 3);

/**
 * Like `vector`, but generates lists.
 */
clojure.test.check.generators.list = (function clojure$test$check$generators$list(generator){
if(clojure.test.check.generators.generator_QMARK_(generator)){
} else {
throw (new Error(["Assert failed: ","First arg to list must be a generator","\n","(generator? generator)"].join('')));
}

return clojure.test.check.generators.gen_bind(clojure.test.check.generators.sized((function (p1__133453_SHARP_){
return clojure.test.check.generators.choose((0),p1__133453_SHARP_);
})),(function (num_elements_rose){
return clojure.test.check.generators.gen_fmap((function (roses){
return clojure.test.check.rose_tree.shrink_vector(cljs.core.list,roses);
}),clojure.test.check.generators.gen_tuple(cljs.core.repeat.cljs$core$IFn$_invoke$arity$2(clojure.test.check.rose_tree.root(num_elements_rose),generator)));
}));
});
clojure.test.check.generators.swap = (function clojure$test$check$generators$swap(coll,p__133454){
var vec__133455 = p__133454;
var i1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__133455,(0),null);
var i2 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__133455,(1),null);
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(coll,i2,(coll.cljs$core$IFn$_invoke$arity$1 ? coll.cljs$core$IFn$_invoke$arity$1(i1) : coll.call(null,i1)),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([i1,(coll.cljs$core$IFn$_invoke$arity$1 ? coll.cljs$core$IFn$_invoke$arity$1(i2) : coll.call(null,i2))], 0));
});
/**
 * Creates a generator that generates random permutations of
 *   `coll`. Shrinks toward the original collection: `coll`. `coll` will
 *   be coerced to a vector.
 */
clojure.test.check.generators.shuffle = (function clojure$test$check$generators$shuffle(coll){
var coll__$1 = ((cljs.core.vector_QMARK_(coll))?coll:cljs.core.vec(coll));
var index_gen = clojure.test.check.generators.choose((0),(cljs.core.count(coll__$1) - (1)));
return clojure.test.check.generators.fmap((function (p1__133458_SHARP_){
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3(clojure.test.check.generators.swap,coll__$1,p1__133458_SHARP_);
}),clojure.test.check.generators.vector.cljs$core$IFn$_invoke$arity$3(clojure.test.check.generators.tuple.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([index_gen,index_gen], 0)),(0),((2) * cljs.core.count(coll__$1))));
});
/**
 * Like clojure.core/hash-map, except the values are generators.
 * Returns a generator that makes maps with the supplied keys and
 * values generated using the supplied generators.
 * 
 *     (gen/sample (gen/hash-map :a gen/boolean :b gen/nat))
 *     => ({:a false, :b 0}
 *         {:a true,  :b 1}
 *         {:a false, :b 2}
 *         {:a true,  :b 2}
 *         {:a false, :b 4}
 *         {:a false, :b 2}
 *         {:a true,  :b 3}
 *         {:a true,  :b 4}
 *         {:a false, :b 1}
 *         {:a false, :b 0})
 */
clojure.test.check.generators.hash_map = (function clojure$test$check$generators$hash_map(var_args){
var args__5732__auto__ = [];
var len__5726__auto___133602 = arguments.length;
var i__5727__auto___133603 = (0);
while(true){
if((i__5727__auto___133603 < len__5726__auto___133602)){
args__5732__auto__.push((arguments[i__5727__auto___133603]));

var G__133604 = (i__5727__auto___133603 + (1));
i__5727__auto___133603 = G__133604;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((0) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((0)),(0),null)):null);
return clojure.test.check.generators.hash_map.cljs$core$IFn$_invoke$arity$variadic(argseq__5733__auto__);
});

(clojure.test.check.generators.hash_map.cljs$core$IFn$_invoke$arity$variadic = (function (kvs){
if(cljs.core.even_QMARK_(cljs.core.count(kvs))){
} else {
throw (new Error("Assert failed: (even? (count kvs))"));
}

var ks = cljs.core.take_nth.cljs$core$IFn$_invoke$arity$2((2),kvs);
var vs = cljs.core.take_nth.cljs$core$IFn$_invoke$arity$2((2),cljs.core.rest(kvs));
if(cljs.core.every_QMARK_(clojure.test.check.generators.generator_QMARK_,vs)){
} else {
throw (new Error(["Assert failed: ","Value args to hash-map must be generators","\n","(every? generator? vs)"].join('')));
}

return clojure.test.check.generators.fmap((function (p1__133459_SHARP_){
return cljs.core.zipmap(ks,p1__133459_SHARP_);
}),cljs.core.apply.cljs$core$IFn$_invoke$arity$2(clojure.test.check.generators.tuple,vs));
}));

(clojure.test.check.generators.hash_map.cljs$lang$maxFixedArity = (0));

/** @this {Function} */
(clojure.test.check.generators.hash_map.cljs$lang$applyTo = (function (seq133460){
var self__5712__auto__ = this;
return self__5712__auto__.cljs$core$IFn$_invoke$arity$variadic(cljs.core.seq(seq133460));
}));

clojure.test.check.generators.transient_set_contains_QMARK_ = (function clojure$test$check$generators$transient_set_contains_QMARK_(s,k){
return (!((cljs.core._lookup(s,k) == null)));
});
/**
 * Returns a rose tree.
 */
clojure.test.check.generators.coll_distinct_by_STAR_ = (function clojure$test$check$generators$coll_distinct_by_STAR_(empty_coll,key_fn,shuffle_fn,gen,rng,size,num_elements,min_elements,max_tries,ex_fn){
if(cljs.core.truth_(gen)){
} else {
throw (new Error("Assert failed: gen"));
}

if(cljs.core.truth_(new cljs.core.Keyword(null,"gen","gen",142575302).cljs$core$IFn$_invoke$arity$1(gen))){
} else {
throw (new Error("Assert failed: (:gen gen)"));
}

var rose_trees = cljs.core.transient$(cljs.core.PersistentVector.EMPTY);
var s = cljs.core.transient$(cljs.core.PersistentHashSet.EMPTY);
var rng__$1 = rng;
var size__$1 = size;
var tries = (0);
while(true){
if(((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(max_tries,tries)) && ((cljs.core.count(rose_trees) < min_elements)))){
throw (function (){var G__133468 = new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"gen","gen",142575302),gen,new cljs.core.Keyword(null,"max-tries","max-tries",-1824441792),max_tries,new cljs.core.Keyword(null,"num-elements","num-elements",1960422107),num_elements], null);
return (ex_fn.cljs$core$IFn$_invoke$arity$1 ? ex_fn.cljs$core$IFn$_invoke$arity$1(G__133468) : ex_fn.call(null,G__133468));
})();
} else {
if(((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(max_tries,tries)) || (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.count(rose_trees),num_elements)))){
return clojure.test.check.rose_tree.shrink_vector(((function (rose_trees,s,rng__$1,size__$1,tries){
return (function() { 
var G__133607__delegate = function (rest__133461_SHARP_){
return cljs.core.into.cljs$core$IFn$_invoke$arity$2(empty_coll,rest__133461_SHARP_);
};
var G__133607 = function (var_args){
var rest__133461_SHARP_ = null;
if (arguments.length > 0) {
var G__133608__i = 0, G__133608__a = new Array(arguments.length -  0);
while (G__133608__i < G__133608__a.length) {G__133608__a[G__133608__i] = arguments[G__133608__i + 0]; ++G__133608__i;}
  rest__133461_SHARP_ = new cljs.core.IndexedSeq(G__133608__a,0,null);
} 
return G__133607__delegate.call(this,rest__133461_SHARP_);};
G__133607.cljs$lang$maxFixedArity = 0;
G__133607.cljs$lang$applyTo = (function (arglist__133609){
var rest__133461_SHARP_ = cljs.core.seq(arglist__133609);
return G__133607__delegate(rest__133461_SHARP_);
});
G__133607.cljs$core$IFn$_invoke$arity$variadic = G__133607__delegate;
return G__133607;
})()
;})(rose_trees,s,rng__$1,size__$1,tries))
,(function (){var G__133469 = rng__$1;
var G__133470 = cljs.core.persistent_BANG_(rose_trees);
return (shuffle_fn.cljs$core$IFn$_invoke$arity$2 ? shuffle_fn.cljs$core$IFn$_invoke$arity$2(G__133469,G__133470) : shuffle_fn.call(null,G__133469,G__133470));
})());
} else {
var vec__133471 = clojure.test.check.random.split(rng__$1);
var rng1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__133471,(0),null);
var rng2 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__133471,(1),null);
var rose = clojure.test.check.generators.call_gen(gen,rng1,size__$1);
var root = clojure.test.check.rose_tree.root(rose);
var k = (key_fn.cljs$core$IFn$_invoke$arity$1 ? key_fn.cljs$core$IFn$_invoke$arity$1(root) : key_fn.call(null,root));
if(clojure.test.check.generators.transient_set_contains_QMARK_(s,k)){
var G__133612 = rose_trees;
var G__133613 = s;
var G__133614 = rng2;
var G__133615 = (size__$1 + (1));
var G__133616 = (tries + (1));
rose_trees = G__133612;
s = G__133613;
rng__$1 = G__133614;
size__$1 = G__133615;
tries = G__133616;
continue;
} else {
var G__133617 = cljs.core.conj_BANG_.cljs$core$IFn$_invoke$arity$2(rose_trees,rose);
var G__133618 = cljs.core.conj_BANG_.cljs$core$IFn$_invoke$arity$2(s,k);
var G__133619 = rng2;
var G__133620 = size__$1;
var G__133621 = (0);
rose_trees = G__133617;
s = G__133618;
rng__$1 = G__133619;
size__$1 = G__133620;
tries = G__133621;
continue;
}

}
}
break;
}
});
/**
 * Like clojure.core/distinct? but takes a collection instead of varargs,
 *   and returns true for empty collections.
 */
clojure.test.check.generators.distinct_by_QMARK_ = (function clojure$test$check$generators$distinct_by_QMARK_(f,coll){
var or__5002__auto__ = cljs.core.empty_QMARK_(coll);
if(or__5002__auto__){
return or__5002__auto__;
} else {
return cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core.distinct_QMARK_,cljs.core.map.cljs$core$IFn$_invoke$arity$2(f,coll));
}
});
/**
 * Returns a shuffled version of coll according to the rng.
 * 
 *   Note that this is not a generator, it is just a utility function.
 */
clojure.test.check.generators.the_shuffle_fn = (function clojure$test$check$generators$the_shuffle_fn(rng,coll){
var empty_coll = cljs.core.empty(coll);
var v = cljs.core.vec(coll);
var card = cljs.core.count(coll);
var dec_card = (card - (1));
return cljs.core.into.cljs$core$IFn$_invoke$arity$2(empty_coll,cljs.core.first(cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (p__133474,idx){
var vec__133475 = p__133474;
var v__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__133475,(0),null);
var rng__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__133475,(1),null);
var vec__133478 = clojure.test.check.random.split(rng__$1);
var rng1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__133478,(0),null);
var rng2 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__133478,(1),null);
var swap_idx = clojure.test.check.generators.rand_range(rng1,idx,dec_card);
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [clojure.test.check.generators.swap(v__$1,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [idx,swap_idx], null)),rng2], null);
}),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [v,rng], null),cljs.core.range.cljs$core$IFn$_invoke$arity$1(card))));
});
clojure.test.check.generators.coll_distinct_by = (function clojure$test$check$generators$coll_distinct_by(empty_coll,key_fn,allows_dupes_QMARK_,ordered_QMARK_,gen,p__133488){
var map__133489 = p__133488;
var map__133489__$1 = cljs.core.__destructure_map(map__133489);
var num_elements = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__133489__$1,new cljs.core.Keyword(null,"num-elements","num-elements",1960422107));
var min_elements = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__133489__$1,new cljs.core.Keyword(null,"min-elements","min-elements",949370780));
var max_elements = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__133489__$1,new cljs.core.Keyword(null,"max-elements","max-elements",433034073));
var max_tries = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__133489__$1,new cljs.core.Keyword(null,"max-tries","max-tries",-1824441792),(10));
var ex_fn = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__133489__$1,new cljs.core.Keyword(null,"ex-fn","ex-fn",-284925510),(function (p1__133481_SHARP_){
return cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2("Couldn't generate enough distinct elements!",p1__133481_SHARP_);
}));
var shuffle_fn = (cljs.core.truth_(ordered_QMARK_)?clojure.test.check.generators.the_shuffle_fn:(function (_rng,coll){
return coll;
}));
var hard_min_elements = (function (){var or__5002__auto__ = num_elements;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = min_elements;
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
return (1);
}
}
})();
if(cljs.core.truth_(num_elements)){
var size_pred = (function (p1__133482_SHARP_){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(num_elements,cljs.core.count(p1__133482_SHARP_));
});
if((((min_elements == null)) && ((max_elements == null)))){
} else {
throw (new Error("Assert failed: (and (nil? min-elements) (nil? max-elements))"));
}

return clojure.test.check.generators.make_gen((function (rng,gen_size){
return clojure.test.check.rose_tree.filter((cljs.core.truth_(allows_dupes_QMARK_)?cljs.core.every_pred.cljs$core$IFn$_invoke$arity$2(size_pred,(function (p1__133483_SHARP_){
return clojure.test.check.generators.distinct_by_QMARK_(key_fn,p1__133483_SHARP_);
})):size_pred),clojure.test.check.generators.coll_distinct_by_STAR_(empty_coll,key_fn,shuffle_fn,gen,rng,gen_size,num_elements,hard_min_elements,max_tries,ex_fn));
}));
} else {
var min_elements__$1 = (function (){var or__5002__auto__ = min_elements;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return (0);
}
})();
var size_pred = (cljs.core.truth_(max_elements)?(function (p1__133484_SHARP_){
return (((min_elements__$1 <= cljs.core.count(p1__133484_SHARP_))) && ((cljs.core.count(p1__133484_SHARP_) <= max_elements)));
}):(function (p1__133485_SHARP_){
return (min_elements__$1 <= cljs.core.count(p1__133485_SHARP_));
}));
return clojure.test.check.generators.gen_bind((cljs.core.truth_(max_elements)?clojure.test.check.generators.choose(min_elements__$1,max_elements):clojure.test.check.generators.sized((function (p1__133486_SHARP_){
return clojure.test.check.generators.choose(min_elements__$1,(min_elements__$1 + p1__133486_SHARP_));
}))),(function (num_elements_rose){
var num_elements__$1 = clojure.test.check.rose_tree.root(num_elements_rose);
return clojure.test.check.generators.make_gen((function (rng,gen_size){
return clojure.test.check.rose_tree.filter((cljs.core.truth_(allows_dupes_QMARK_)?cljs.core.every_pred.cljs$core$IFn$_invoke$arity$2(size_pred,(function (p1__133487_SHARP_){
return clojure.test.check.generators.distinct_by_QMARK_(key_fn,p1__133487_SHARP_);
})):size_pred),clojure.test.check.generators.coll_distinct_by_STAR_(empty_coll,key_fn,shuffle_fn,gen,rng,gen_size,num_elements__$1,hard_min_elements,max_tries,ex_fn));
}));
}));
}
});
/**
 * Generates a vector of elements from the given generator, with the
 *   guarantee that the elements will be distinct.
 * 
 *   If the generator cannot or is unlikely to produce enough distinct
 *   elements, this generator will fail in the same way as `such-that`.
 * 
 *   Available options:
 * 
 *  :num-elements  the fixed size of generated vectors
 *  :min-elements  the min size of generated vectors
 *  :max-elements  the max size of generated vectors
 *  :max-tries     the number of times the generator will be tried before
 *                 failing when it does not produce distinct elements
 *                 (default 10)
 *  :ex-fn         a function of one arg that will be called if test.check cannot
 *                 generate enough distinct values; it will be passed a map with
 *                 `:gen`, `:num-elements`, and `:max-tries` and should return an
 *                 exception
 */
clojure.test.check.generators.vector_distinct = (function clojure$test$check$generators$vector_distinct(var_args){
var G__133491 = arguments.length;
switch (G__133491) {
case 1:
return clojure.test.check.generators.vector_distinct.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return clojure.test.check.generators.vector_distinct.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(clojure.test.check.generators.vector_distinct.cljs$core$IFn$_invoke$arity$1 = (function (gen){
return clojure.test.check.generators.vector_distinct.cljs$core$IFn$_invoke$arity$2(gen,cljs.core.PersistentArrayMap.EMPTY);
}));

(clojure.test.check.generators.vector_distinct.cljs$core$IFn$_invoke$arity$2 = (function (gen,opts){
if(clojure.test.check.generators.generator_QMARK_(gen)){
} else {
throw (new Error(["Assert failed: ","First arg to vector-distinct must be a generator!","\n","(generator? gen)"].join('')));
}

return clojure.test.check.generators.coll_distinct_by(cljs.core.PersistentVector.EMPTY,cljs.core.identity,true,true,gen,opts);
}));

(clojure.test.check.generators.vector_distinct.cljs$lang$maxFixedArity = 2);

/**
 * Generates a list of elements from the given generator, with the
 *   guarantee that the elements will be distinct.
 * 
 *   If the generator cannot or is unlikely to produce enough distinct
 *   elements, this generator will fail in the same way as `such-that`.
 * 
 *   Available options:
 * 
 *  :num-elements  the fixed size of generated list
 *  :min-elements  the min size of generated list
 *  :max-elements  the max size of generated list
 *  :max-tries     the number of times the generator will be tried before
 *                 failing when it does not produce distinct elements
 *                 (default 10)
 *  :ex-fn         a function of one arg that will be called if test.check cannot
 *                 generate enough distinct values; it will be passed a map with
 *                 `:gen`, `:num-elements`, and `:max-tries` and should return an
 *                 exception
 */
clojure.test.check.generators.list_distinct = (function clojure$test$check$generators$list_distinct(var_args){
var G__133493 = arguments.length;
switch (G__133493) {
case 1:
return clojure.test.check.generators.list_distinct.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return clojure.test.check.generators.list_distinct.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(clojure.test.check.generators.list_distinct.cljs$core$IFn$_invoke$arity$1 = (function (gen){
return clojure.test.check.generators.list_distinct.cljs$core$IFn$_invoke$arity$2(gen,cljs.core.PersistentArrayMap.EMPTY);
}));

(clojure.test.check.generators.list_distinct.cljs$core$IFn$_invoke$arity$2 = (function (gen,opts){
if(clojure.test.check.generators.generator_QMARK_(gen)){
} else {
throw (new Error(["Assert failed: ","First arg to list-distinct must be a generator!","\n","(generator? gen)"].join('')));
}

return clojure.test.check.generators.coll_distinct_by(cljs.core.List.EMPTY,cljs.core.identity,true,true,gen,opts);
}));

(clojure.test.check.generators.list_distinct.cljs$lang$maxFixedArity = 2);

/**
 * Generates a vector of elements from the given generator, with the
 *   guarantee that (map key-fn the-vector) will be distinct.
 * 
 *   If the generator cannot or is unlikely to produce enough distinct
 *   elements, this generator will fail in the same way as `such-that`.
 * 
 *   Available options:
 * 
 *  :num-elements  the fixed size of generated vectors
 *  :min-elements  the min size of generated vectors
 *  :max-elements  the max size of generated vectors
 *  :max-tries     the number of times the generator will be tried before
 *                 failing when it does not produce distinct elements
 *                 (default 10)
 *  :ex-fn         a function of one arg that will be called if test.check cannot
 *                 generate enough distinct values; it will be passed a map with
 *                 `:gen`, `:num-elements`, and `:max-tries` and should return an
 *                 exception
 */
clojure.test.check.generators.vector_distinct_by = (function clojure$test$check$generators$vector_distinct_by(var_args){
var G__133495 = arguments.length;
switch (G__133495) {
case 2:
return clojure.test.check.generators.vector_distinct_by.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return clojure.test.check.generators.vector_distinct_by.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(clojure.test.check.generators.vector_distinct_by.cljs$core$IFn$_invoke$arity$2 = (function (key_fn,gen){
return clojure.test.check.generators.vector_distinct_by.cljs$core$IFn$_invoke$arity$3(key_fn,gen,cljs.core.PersistentArrayMap.EMPTY);
}));

(clojure.test.check.generators.vector_distinct_by.cljs$core$IFn$_invoke$arity$3 = (function (key_fn,gen,opts){
if(clojure.test.check.generators.generator_QMARK_(gen)){
} else {
throw (new Error(["Assert failed: ","Second arg to vector-distinct-by must be a generator!","\n","(generator? gen)"].join('')));
}

return clojure.test.check.generators.coll_distinct_by(cljs.core.PersistentVector.EMPTY,key_fn,true,true,gen,opts);
}));

(clojure.test.check.generators.vector_distinct_by.cljs$lang$maxFixedArity = 3);

/**
 * Generates a list of elements from the given generator, with the
 *   guarantee that (map key-fn the-list) will be distinct.
 * 
 *   If the generator cannot or is unlikely to produce enough distinct
 *   elements, this generator will fail in the same way as `such-that`.
 * 
 *   Available options:
 * 
 *  :num-elements  the fixed size of generated list
 *  :min-elements  the min size of generated list
 *  :max-elements  the max size of generated list
 *  :max-tries     the number of times the generator will be tried before
 *                 failing when it does not produce distinct elements
 *                 (default 10)
 *  :ex-fn         a function of one arg that will be called if test.check cannot
 *                 generate enough distinct values; it will be passed a map with
 *                 `:gen`, `:num-elements`, and `:max-tries` and should return an
 *                 exception
 */
clojure.test.check.generators.list_distinct_by = (function clojure$test$check$generators$list_distinct_by(var_args){
var G__133497 = arguments.length;
switch (G__133497) {
case 2:
return clojure.test.check.generators.list_distinct_by.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return clojure.test.check.generators.list_distinct_by.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(clojure.test.check.generators.list_distinct_by.cljs$core$IFn$_invoke$arity$2 = (function (key_fn,gen){
return clojure.test.check.generators.list_distinct_by.cljs$core$IFn$_invoke$arity$3(key_fn,gen,cljs.core.PersistentArrayMap.EMPTY);
}));

(clojure.test.check.generators.list_distinct_by.cljs$core$IFn$_invoke$arity$3 = (function (key_fn,gen,opts){
if(clojure.test.check.generators.generator_QMARK_(gen)){
} else {
throw (new Error(["Assert failed: ","Second arg to list-distinct-by must be a generator!","\n","(generator? gen)"].join('')));
}

return clojure.test.check.generators.coll_distinct_by(cljs.core.List.EMPTY,key_fn,true,true,gen,opts);
}));

(clojure.test.check.generators.list_distinct_by.cljs$lang$maxFixedArity = 3);

/**
 * Generates a set of elements from the given generator.
 * 
 *   If the generator cannot or is unlikely to produce enough distinct
 *   elements, this generator will fail in the same way as `such-that`.
 * 
 *   Available options:
 * 
 *  :num-elements  the fixed size of generated set
 *  :min-elements  the min size of generated set
 *  :max-elements  the max size of generated set
 *  :max-tries     the number of times the generator will be tried before
 *                 failing when it does not produce distinct elements
 *                 (default 10)
 *  :ex-fn         a function of one arg that will be called if test.check cannot
 *                 generate enough distinct values; it will be passed a map with
 *                 `:gen`, `:num-elements`, and `:max-tries` and should return an
 *                 exception
 */
clojure.test.check.generators.set = (function clojure$test$check$generators$set(var_args){
var G__133499 = arguments.length;
switch (G__133499) {
case 1:
return clojure.test.check.generators.set.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return clojure.test.check.generators.set.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(clojure.test.check.generators.set.cljs$core$IFn$_invoke$arity$1 = (function (gen){
return clojure.test.check.generators.set.cljs$core$IFn$_invoke$arity$2(gen,cljs.core.PersistentArrayMap.EMPTY);
}));

(clojure.test.check.generators.set.cljs$core$IFn$_invoke$arity$2 = (function (gen,opts){
if(clojure.test.check.generators.generator_QMARK_(gen)){
} else {
throw (new Error(["Assert failed: ","First arg to set must be a generator!","\n","(generator? gen)"].join('')));
}

return clojure.test.check.generators.coll_distinct_by(cljs.core.PersistentHashSet.EMPTY,cljs.core.identity,false,false,gen,opts);
}));

(clojure.test.check.generators.set.cljs$lang$maxFixedArity = 2);

/**
 * Generates a sorted set of elements from the given generator.
 * 
 *   If the generator cannot or is unlikely to produce enough distinct
 *   elements, this generator will fail in the same way as `such-that`.
 * 
 *   Available options:
 * 
 *  :num-elements  the fixed size of generated set
 *  :min-elements  the min size of generated set
 *  :max-elements  the max size of generated set
 *  :max-tries     the number of times the generator will be tried before
 *                 failing when it does not produce distinct elements
 *                 (default 10)
 *  :ex-fn         a function of one arg that will be called if test.check cannot
 *                 generate enough distinct values; it will be passed a map with
 *                 `:gen`, `:num-elements`, and `:max-tries` and should return an
 *                 exception
 */
clojure.test.check.generators.sorted_set = (function clojure$test$check$generators$sorted_set(var_args){
var G__133501 = arguments.length;
switch (G__133501) {
case 1:
return clojure.test.check.generators.sorted_set.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return clojure.test.check.generators.sorted_set.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(clojure.test.check.generators.sorted_set.cljs$core$IFn$_invoke$arity$1 = (function (gen){
return clojure.test.check.generators.sorted_set.cljs$core$IFn$_invoke$arity$2(gen,cljs.core.PersistentArrayMap.EMPTY);
}));

(clojure.test.check.generators.sorted_set.cljs$core$IFn$_invoke$arity$2 = (function (gen,opts){
if(clojure.test.check.generators.generator_QMARK_(gen)){
} else {
throw (new Error(["Assert failed: ","First arg to sorted-set must be a generator!","\n","(generator? gen)"].join('')));
}

return clojure.test.check.generators.coll_distinct_by(cljs.core.sorted_set(),cljs.core.identity,false,false,gen,opts);
}));

(clojure.test.check.generators.sorted_set.cljs$lang$maxFixedArity = 2);

/**
 * Creates a generator that generates maps, with keys chosen from
 *   `key-gen` and values chosen from `val-gen`.
 * 
 *   If the key generator cannot or is unlikely to produce enough distinct
 *   elements, this generator will fail in the same way as `such-that`.
 * 
 *   Available options:
 * 
 *  :num-elements  the fixed size of generated maps
 *  :min-elements  the min size of generated maps
 *  :max-elements  the max size of generated maps
 *  :max-tries     the number of times the generator will be tried before
 *                 failing when it does not produce distinct elements
 *                 (default 10)
 *  :ex-fn         a function of one arg that will be called if test.check cannot
 *                 generate enough distinct keys; it will be passed a map with
 *                 `:gen` (the key-gen), `:num-elements`, and `:max-tries` and
 *                 should return an exception
 */
clojure.test.check.generators.map = (function clojure$test$check$generators$map(var_args){
var G__133503 = arguments.length;
switch (G__133503) {
case 2:
return clojure.test.check.generators.map.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return clojure.test.check.generators.map.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(clojure.test.check.generators.map.cljs$core$IFn$_invoke$arity$2 = (function (key_gen,val_gen){
return clojure.test.check.generators.map.cljs$core$IFn$_invoke$arity$3(key_gen,val_gen,cljs.core.PersistentArrayMap.EMPTY);
}));

(clojure.test.check.generators.map.cljs$core$IFn$_invoke$arity$3 = (function (key_gen,val_gen,opts){
return clojure.test.check.generators.coll_distinct_by(cljs.core.PersistentArrayMap.EMPTY,cljs.core.first,false,false,clojure.test.check.generators.tuple.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([key_gen,val_gen], 0)),opts);
}));

(clojure.test.check.generators.map.cljs$lang$maxFixedArity = 3);

/**
 * Generates a single uniformly random long, does not shrink.
 */
clojure.test.check.generators.gen_raw_long = clojure.test.check.generators.make_gen((function (rnd,_size){
return clojure.test.check.rose_tree.pure(clojure.test.check.random.rand_long(rnd));
}));
clojure.test.check.generators.MAX_INTEGER = (cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core._STAR_,cljs.core.repeat.cljs$core$IFn$_invoke$arity$2((53),(2))) - (1));
clojure.test.check.generators.MIN_INTEGER = (- clojure.test.check.generators.MAX_INTEGER);
clojure.test.check.generators.abs = (function clojure$test$check$generators$abs(x){
return Math.abs(x);
});
clojure.test.check.generators.long__GT_large_integer = (function clojure$test$check$generators$long__GT_large_integer(bit_count,x,min,max){
var res = (function (){var G__133504 = x.shiftRight(((64) - bit_count)).toNumber();
if((min === (0))){
return clojure.test.check.generators.abs(G__133504);
} else {
return G__133504;
}
})();
while(true){
if((((min <= res)) && ((res <= max)))){
return res;
} else {
var res_SINGLEQUOTE_ = (- res);
if((((min <= res_SINGLEQUOTE_)) && ((res_SINGLEQUOTE_ <= max)))){
return res_SINGLEQUOTE_;
} else {
var G__133649 = ((function (){var G__133505 = res;
if(cljs.core.odd_QMARK_(res)){
var fexpr__133506 = (((res < (0)))?cljs.core.inc:cljs.core.dec);
return (fexpr__133506.cljs$core$IFn$_invoke$arity$1 ? fexpr__133506.cljs$core$IFn$_invoke$arity$1(G__133505) : fexpr__133506.call(null,G__133505));
} else {
return G__133505;
}
})() / (2));
res = G__133649;
continue;
}
}
break;
}
});
/**
 * Like large-integer*, but assumes range includes zero.
 */
clojure.test.check.generators.large_integer_STAR__STAR_ = (function clojure$test$check$generators$large_integer_STAR__STAR_(min,max){
return clojure.test.check.generators.sized((function (size){
var size__$1 = (function (){var x__5087__auto__ = size;
var y__5088__auto__ = (1);
return ((x__5087__auto__ > y__5088__auto__) ? x__5087__auto__ : y__5088__auto__);
})();
var max_bit_count = (function (){var x__5090__auto__ = size__$1;
var y__5091__auto__ = (54);
return ((x__5090__auto__ < y__5091__auto__) ? x__5090__auto__ : y__5091__auto__);
})();
return clojure.test.check.generators.gen_fmap((function (rose){
var vec__133507 = clojure.test.check.rose_tree.root(rose);
var bit_count = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__133507,(0),null);
var x = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__133507,(1),null);
return clojure.test.check.generators.int_rose_tree(clojure.test.check.generators.long__GT_large_integer(bit_count,x,min,max));
}),clojure.test.check.generators.tuple.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([clojure.test.check.generators.choose((1),max_bit_count),clojure.test.check.generators.gen_raw_long], 0)));
}));
});
/**
 * Like large-integer, but accepts options:
 * 
 *  :min  the minimum integer (inclusive)
 *  :max  the maximum integer (inclusive)
 * 
 *   Both :min and :max are optional.
 * 
 *    (gen/sample (gen/large-integer* {:min 9000 :max 10000}))
 *    => (9000 9001 9001 9002 9000 9003 9006 9030 9005 9044)
 */
clojure.test.check.generators.large_integer_STAR_ = (function clojure$test$check$generators$large_integer_STAR_(p__133513){
var map__133514 = p__133513;
var map__133514__$1 = cljs.core.__destructure_map(map__133514);
var min = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__133514__$1,new cljs.core.Keyword(null,"min","min",444991522));
var max = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__133514__$1,new cljs.core.Keyword(null,"max","max",61366548));
var min__$1 = (function (){var or__5002__auto__ = min;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return clojure.test.check.generators.MIN_INTEGER;
}
})();
var max__$1 = (function (){var or__5002__auto__ = max;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return clojure.test.check.generators.MAX_INTEGER;
}
})();
if((min__$1 <= max__$1)){
} else {
throw (new Error("Assert failed: (<= min max)"));
}

return clojure.test.check.generators.such_that.cljs$core$IFn$_invoke$arity$2((function (p1__133510_SHARP_){
return (((min__$1 <= p1__133510_SHARP_)) && ((p1__133510_SHARP_ <= max__$1)));
}),(((((min__$1 <= (0))) && (((0) <= max__$1))))?clojure.test.check.generators.large_integer_STAR__STAR_(min__$1,max__$1):(((max__$1 < (0)))?clojure.test.check.generators.fmap((function (p1__133511_SHARP_){
return (max__$1 + p1__133511_SHARP_);
}),clojure.test.check.generators.large_integer_STAR__STAR_((min__$1 - max__$1),(0))):clojure.test.check.generators.fmap((function (p1__133512_SHARP_){
return (min__$1 + p1__133512_SHARP_);
}),clojure.test.check.generators.large_integer_STAR__STAR_((0),(max__$1 - min__$1))))));
});
/**
 * Generates a platform-native integer from the full available range
 *   (in clj, 64-bit Longs, and in cljs, numbers between -(2^53 - 1) and
 *   (2^53 - 1)).
 * 
 *   Use large-integer* for more control.
 */
clojure.test.check.generators.large_integer = clojure.test.check.generators.large_integer_STAR_(cljs.core.PersistentArrayMap.EMPTY);
clojure.test.check.generators.POS_INFINITY = Number.POSITIVE_INFINITY;
clojure.test.check.generators.NEG_INFINITY = Number.NEGATIVE_INFINITY;
clojure.test.check.generators.MAX_POS_VALUE = Number.MAX_VALUE;
clojure.test.check.generators.MIN_NEG_VALUE = (- clojure.test.check.generators.MAX_POS_VALUE);
clojure.test.check.generators.NAN = Number.NaN;
/**
 * Generates an integer uniformly in the range 0..(2^bit-count-1).
 */
clojure.test.check.generators.uniform_integer = (function clojure$test$check$generators$uniform_integer(bit_count){
if((bit_count <= (32))){
return clojure.test.check.generators.choose((0),(function (){var G__133515 = cljs.core.long$(bit_count);
switch (G__133515) {
case (32):
return (4294967295);

break;
case (31):
return (2147483647);

break;
default:
return (((1) << bit_count) - (1));

}
})());
} else {
return clojure.test.check.generators.fmap((function (p__133516){
var vec__133517 = p__133516;
var upper = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__133517,(0),null);
var lower = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__133517,(1),null);
return ((upper * (4294967296)) + lower);
}),clojure.test.check.generators.tuple.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([(function (){var G__133520 = (bit_count - (32));
return (clojure.test.check.generators.uniform_integer.cljs$core$IFn$_invoke$arity$1 ? clojure.test.check.generators.uniform_integer.cljs$core$IFn$_invoke$arity$1(G__133520) : clojure.test.check.generators.uniform_integer.call(null,G__133520));
})(),(clojure.test.check.generators.uniform_integer.cljs$core$IFn$_invoke$arity$1 ? clojure.test.check.generators.uniform_integer.cljs$core$IFn$_invoke$arity$1((32)) : clojure.test.check.generators.uniform_integer.call(null,(32)))], 0)));
}
});
clojure.test.check.generators.scalb = (function clojure$test$check$generators$scalb(x,exp){
return (x * Math.pow((2),exp));
});
/**
 * Bit-reverses an integer in the range [0, 2^52).
 */
clojure.test.check.generators.fifty_two_bit_reverse = (function clojure$test$check$generators$fifty_two_bit_reverse(n){
var out = (0);
var n__$1 = n;
var out_shifter = Math.pow((2),(52));
while(true){
if((n__$1 < (1))){
return (out * out_shifter);
} else {
var G__133674 = ((out * (2)) + (n__$1 & (1)));
var G__133675 = (n__$1 / (2));
var G__133676 = (out_shifter / (2));
out = G__133674;
n__$1 = G__133675;
out_shifter = G__133676;
continue;
}
break;
}
});
/**
 * Generates a 52-bit non-negative integer that shrinks toward having
 *   fewer lower-order bits (and shrinks to 0 if possible).
 */
clojure.test.check.generators.backwards_shrinking_significand = clojure.test.check.generators.fmap(clojure.test.check.generators.fifty_two_bit_reverse,clojure.test.check.generators.sized((function (size){
return clojure.test.check.generators.gen_bind(clojure.test.check.generators.choose((0),(function (){var x__5090__auto__ = size;
var y__5091__auto__ = (52);
return ((x__5090__auto__ < y__5091__auto__) ? x__5090__auto__ : y__5091__auto__);
})()),(function (rose){
return clojure.test.check.generators.uniform_integer(clojure.test.check.rose_tree.root(rose));
}));
})));
clojure.test.check.generators.get_exponent = (function clojure$test$check$generators$get_exponent(x){
if((x === (0))){
return (-1023);
} else {
var x__$1 = Math.abs(x);
var res = Math.floor((Math.log(x__$1) * Math.LOG2E));
var t = clojure.test.check.generators.scalb(x__$1,(- res));
if((t < (1))){
return (res - (1));
} else {
if(((2) <= t)){
return (res + (1));
} else {
return res;

}
}
}
});
/**
 * Generates [exp sign], where exp is in [-1023, 1023] and sign is 1
 *   or -1. Only generates values for exp and sign for which there are
 *   doubles within the given bounds.
 */
clojure.test.check.generators.double_exp_and_sign = (function clojure$test$check$generators$double_exp_and_sign(lower_bound,upper_bound){
var gen_exp = (function clojure$test$check$generators$double_exp_and_sign_$_gen_exp(lb,ub){
return clojure.test.check.generators.sized((function (size){
var qs8 = ((1) << cljs.core.quot((function (){var x__5090__auto__ = (200);
var y__5091__auto__ = size;
return ((x__5090__auto__ < y__5091__auto__) ? x__5090__auto__ : y__5091__auto__);
})(),(8)));
if((((lb <= (0))) && (((0) <= ub)))){
return clojure.test.check.generators.choose((function (){var x__5087__auto__ = lb;
var y__5088__auto__ = (- qs8);
return ((x__5087__auto__ > y__5088__auto__) ? x__5087__auto__ : y__5088__auto__);
})(),(function (){var x__5090__auto__ = ub;
var y__5091__auto__ = qs8;
return ((x__5090__auto__ < y__5091__auto__) ? x__5090__auto__ : y__5091__auto__);
})());
} else {
if((ub < (0))){
return clojure.test.check.generators.choose((function (){var x__5087__auto__ = lb;
var y__5088__auto__ = (ub - qs8);
return ((x__5087__auto__ > y__5088__auto__) ? x__5087__auto__ : y__5088__auto__);
})(),ub);
} else {
return clojure.test.check.generators.choose(lb,(function (){var x__5090__auto__ = ub;
var y__5091__auto__ = (lb + qs8);
return ((x__5090__auto__ < y__5091__auto__) ? x__5090__auto__ : y__5091__auto__);
})());

}
}
}));
});
if((((lower_bound == null)) && ((upper_bound == null)))){
return clojure.test.check.generators.tuple.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([gen_exp((-1023),(1023)),clojure.test.check.generators.elements(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [1.0,-1.0], null))], 0));
} else {
var lower_bound__$1 = (function (){var or__5002__auto__ = lower_bound;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return clojure.test.check.generators.MIN_NEG_VALUE;
}
})();
var upper_bound__$1 = (function (){var or__5002__auto__ = upper_bound;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return clojure.test.check.generators.MAX_POS_VALUE;
}
})();
var lbexp = (function (){var x__5087__auto__ = (-1023);
var y__5088__auto__ = clojure.test.check.generators.get_exponent(lower_bound__$1);
return ((x__5087__auto__ > y__5088__auto__) ? x__5087__auto__ : y__5088__auto__);
})();
var ubexp = (function (){var x__5087__auto__ = (-1023);
var y__5088__auto__ = clojure.test.check.generators.get_exponent(upper_bound__$1);
return ((x__5087__auto__ > y__5088__auto__) ? x__5087__auto__ : y__5088__auto__);
})();
if((0.0 <= lower_bound__$1)){
return clojure.test.check.generators.tuple.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([gen_exp(lbexp,ubexp),clojure.test.check.generators.return$(1.0)], 0));
} else {
if((upper_bound__$1 <= 0.0)){
return clojure.test.check.generators.tuple.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([gen_exp(ubexp,lbexp),clojure.test.check.generators.return$(-1.0)], 0));
} else {
return clojure.test.check.generators.fmap((function (p__133521){
var vec__133522 = p__133521;
var exp = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__133522,(0),null);
var sign = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__133522,(1),null);
var pair = vec__133522;
if((((((sign < (0))) && ((lbexp < exp)))) || ((((sign > (0))) && ((ubexp < exp)))))){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [exp,(- sign)], null);
} else {
return pair;
}
}),clojure.test.check.generators.tuple.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([gen_exp((-1023),(function (){var x__5087__auto__ = ubexp;
var y__5088__auto__ = lbexp;
return ((x__5087__auto__ > y__5088__auto__) ? x__5087__auto__ : y__5088__auto__);
})()),clojure.test.check.generators.elements(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [1.0,-1.0], null))], 0)));

}
}
}
});
/**
 * Returns [low high], the smallest and largest numbers in the given
 *   range.
 */
clojure.test.check.generators.block_bounds = (function clojure$test$check$generators$block_bounds(exp,sign){
if((sign < (0))){
var vec__133525 = (function (){var G__133528 = exp;
var G__133529 = (- sign);
return (clojure.test.check.generators.block_bounds.cljs$core$IFn$_invoke$arity$2 ? clojure.test.check.generators.block_bounds.cljs$core$IFn$_invoke$arity$2(G__133528,G__133529) : clojure.test.check.generators.block_bounds.call(null,G__133528,G__133529));
})();
var low = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__133525,(0),null);
var high = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__133525,(1),null);
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [(- high),(- low)], null);
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2((-1023),exp)){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [0.0,clojure.test.check.generators.scalb((clojure.test.check.generators.scalb(1.0,(52)) - (1)),(-1074))], null);
} else {
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [clojure.test.check.generators.scalb(1.0,exp),clojure.test.check.generators.scalb((clojure.test.check.generators.scalb(1.0,(52)) - (1)),(exp - (51)))], null);
}
}
});
clojure.test.check.generators.double_finite = (function clojure$test$check$generators$double_finite(lower_bound,upper_bound){
if((((lower_bound == null)) || ((((upper_bound == null)) || ((lower_bound <= upper_bound)))))){
} else {
throw (new Error("Assert failed: (or (nil? lower-bound) (nil? upper-bound) (<= lower-bound upper-bound))"));
}

var pred = (cljs.core.truth_(lower_bound)?(cljs.core.truth_(upper_bound)?(function (p1__133530_SHARP_){
return (((lower_bound <= p1__133530_SHARP_)) && ((p1__133530_SHARP_ <= upper_bound)));
}):(function (p1__133531_SHARP_){
return (lower_bound <= p1__133531_SHARP_);
})):(cljs.core.truth_(upper_bound)?(function (p1__133532_SHARP_){
return (p1__133532_SHARP_ <= upper_bound);
}):null));
var gen = clojure.test.check.generators.fmap((function (p__133533){
var vec__133534 = p__133533;
var vec__133537 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__133534,(0),null);
var exp = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__133537,(0),null);
var sign = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__133537,(1),null);
var significand = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__133534,(1),null);
var base = ((significand / Math.pow((2),(52))) + (1));
var x = (clojure.test.check.generators.scalb(base,exp) * sign);
if(cljs.core.truth_((function (){var or__5002__auto__ = (pred == null);
if(or__5002__auto__){
return or__5002__auto__;
} else {
return (pred.cljs$core$IFn$_invoke$arity$1 ? pred.cljs$core$IFn$_invoke$arity$1(x) : pred.call(null,x));
}
})())){
return x;
} else {
var vec__133540 = clojure.test.check.generators.block_bounds(exp,sign);
var low = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__133540,(0),null);
var high = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__133540,(1),null);
var block_lb = (function (){var G__133543 = low;
if(cljs.core.truth_(lower_bound)){
var x__5087__auto__ = G__133543;
var y__5088__auto__ = lower_bound;
return ((x__5087__auto__ > y__5088__auto__) ? x__5087__auto__ : y__5088__auto__);
} else {
return G__133543;
}
})();
var block_ub = (function (){var G__133544 = high;
if(cljs.core.truth_(upper_bound)){
var x__5090__auto__ = G__133544;
var y__5091__auto__ = upper_bound;
return ((x__5090__auto__ < y__5091__auto__) ? x__5090__auto__ : y__5091__auto__);
} else {
return G__133544;
}
})();
var x__$1 = (block_lb + ((block_ub - block_lb) * (base - (1))));
var x__5087__auto__ = (function (){var x__5090__auto__ = x__$1;
var y__5091__auto__ = block_ub;
return ((x__5090__auto__ < y__5091__auto__) ? x__5090__auto__ : y__5091__auto__);
})();
var y__5088__auto__ = block_lb;
return ((x__5087__auto__ > y__5088__auto__) ? x__5087__auto__ : y__5088__auto__);
}
}),clojure.test.check.generators.tuple.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([clojure.test.check.generators.double_exp_and_sign(lower_bound,upper_bound),clojure.test.check.generators.backwards_shrinking_significand], 0)));
var G__133545 = gen;
if(cljs.core.truth_(pred)){
return clojure.test.check.generators.such_that.cljs$core$IFn$_invoke$arity$2(pred,G__133545);
} else {
return G__133545;
}
});
/**
 * Generates a 64-bit floating point number. Options:
 * 
 *  :infinite? - whether +/- infinity can be generated (default true)
 *  :NaN?      - whether NaN can be generated (default true)
 *  :min       - minimum value (inclusive, default none)
 *  :max       - maximum value (inclusive, default none)
 * 
 *   Note that the min/max options must be finite numbers. Supplying a
 *   min precludes -Infinity, and supplying a max precludes +Infinity.
 */
clojure.test.check.generators.double_STAR_ = (function clojure$test$check$generators$double_STAR_(p__133546){
var map__133547 = p__133546;
var map__133547__$1 = cljs.core.__destructure_map(map__133547);
var infinite_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__133547__$1,new cljs.core.Keyword(null,"infinite?","infinite?",-2017886608),true);
var NaN_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__133547__$1,new cljs.core.Keyword(null,"NaN?","NaN?",-1917767651),true);
var min = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__133547__$1,new cljs.core.Keyword(null,"min","min",444991522));
var max = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__133547__$1,new cljs.core.Keyword(null,"max","max",61366548));
var frequency_arg = (function (){var G__133548 = new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [(95),clojure.test.check.generators.double_finite(min,max)], null)], null);
var G__133548__$1 = (((((min == null))?(((max == null)) || ((0.0 <= max))):(((max == null))?(min <= 0.0):(((min <= 0.0)) && ((0.0 <= max))))))?cljs.core.conj.cljs$core$IFn$_invoke$arity$variadic(G__133548,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [(1),clojure.test.check.generators.return$(0.0)], null),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [(1),clojure.test.check.generators.return$(-0.0)], null)], 0)):G__133548);
var G__133548__$2 = (cljs.core.truth_((function (){var and__5000__auto__ = infinite_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return (max == null);
} else {
return and__5000__auto__;
}
})())?cljs.core.conj.cljs$core$IFn$_invoke$arity$2(G__133548__$1,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [(1),clojure.test.check.generators.return$(clojure.test.check.generators.POS_INFINITY)], null)):G__133548__$1);
var G__133548__$3 = (cljs.core.truth_((function (){var and__5000__auto__ = infinite_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return (min == null);
} else {
return and__5000__auto__;
}
})())?cljs.core.conj.cljs$core$IFn$_invoke$arity$2(G__133548__$2,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [(1),clojure.test.check.generators.return$(clojure.test.check.generators.NEG_INFINITY)], null)):G__133548__$2);
if(cljs.core.truth_(NaN_QMARK_)){
return cljs.core.conj.cljs$core$IFn$_invoke$arity$2(G__133548__$3,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [(1),clojure.test.check.generators.return$(clojure.test.check.generators.NAN)], null));
} else {
return G__133548__$3;
}
})();
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2((1),cljs.core.count(frequency_arg))){
return cljs.core.second(cljs.core.first(frequency_arg));
} else {
return clojure.test.check.generators.frequency(frequency_arg);
}
});
/**
 * Generates 64-bit floating point numbers from the entire range,
 *   including +/- infinity and NaN. Use double* for more control.
 */
clojure.test.check.generators.double$ = clojure.test.check.generators.double_STAR_(cljs.core.PersistentArrayMap.EMPTY);
/**
 * Generates character from 0-255.
 */
clojure.test.check.generators.char$ = clojure.test.check.generators.fmap(cljs.core.char$,clojure.test.check.generators.choose((0),(255)));
/**
 * Generates only ascii characters.
 */
clojure.test.check.generators.char_ascii = clojure.test.check.generators.fmap(cljs.core.char$,clojure.test.check.generators.choose((32),(126)));
/**
 * Generates alphanumeric characters.
 */
clojure.test.check.generators.char_alphanumeric = clojure.test.check.generators.fmap(cljs.core.char$,clojure.test.check.generators.one_of(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [clojure.test.check.generators.choose((48),(57)),clojure.test.check.generators.choose((65),(90)),clojure.test.check.generators.choose((97),(122))], null)));
/**
 * Deprecated - use char-alphanumeric instead.
 * 
 *   Generates alphanumeric characters.
 */
clojure.test.check.generators.char_alpha_numeric = clojure.test.check.generators.char_alphanumeric;
/**
 * Generates alpha characters.
 */
clojure.test.check.generators.char_alpha = clojure.test.check.generators.fmap(cljs.core.char$,clojure.test.check.generators.one_of(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [clojure.test.check.generators.choose((65),(90)),clojure.test.check.generators.choose((97),(122))], null)));
/**
 * Generates non-alphanumeric characters that can be in a symbol.
 */
clojure.test.check.generators.char_symbol_special = clojure.test.check.generators.elements(new cljs.core.PersistentVector(null, 7, 5, cljs.core.PersistentVector.EMPTY_NODE, ["*","+","!","-","_","?","."], null));
/**
 * Generates characters that can be the char following first of a keyword or symbol.
 */
clojure.test.check.generators.char_symbol_noninitial = clojure.test.check.generators.frequency(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [(14),clojure.test.check.generators.char_alphanumeric], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [(7),clojure.test.check.generators.char_symbol_special], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [(1),clojure.test.check.generators.return$(":")], null)], null));
/**
 * Generates characters that can be the first char of a keyword or symbol.
 */
clojure.test.check.generators.char_symbol_initial = clojure.test.check.generators.frequency(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [(2),clojure.test.check.generators.char_alpha], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [(1),clojure.test.check.generators.char_symbol_special], null)], null));
/**
 * Generates strings. May generate unprintable characters.
 */
clojure.test.check.generators.string = clojure.test.check.generators.fmap(clojure.string.join,clojure.test.check.generators.vector.cljs$core$IFn$_invoke$arity$1(clojure.test.check.generators.char$));
/**
 * Generates ascii strings.
 */
clojure.test.check.generators.string_ascii = clojure.test.check.generators.fmap(clojure.string.join,clojure.test.check.generators.vector.cljs$core$IFn$_invoke$arity$1(clojure.test.check.generators.char_ascii));
/**
 * Generates alphanumeric strings.
 */
clojure.test.check.generators.string_alphanumeric = clojure.test.check.generators.fmap(clojure.string.join,clojure.test.check.generators.vector.cljs$core$IFn$_invoke$arity$1(clojure.test.check.generators.char_alphanumeric));
/**
 * Deprecated - use string-alphanumeric instead.
 * 
 *   Generates alphanumeric strings.
 */
clojure.test.check.generators.string_alpha_numeric = clojure.test.check.generators.string_alphanumeric;
clojure.test.check.generators.digit_QMARK_ = (function clojure$test$check$generators$digit_QMARK_(d){
return goog.string.isNumeric(d);
});
/**
 * Returns true if c is \+ or \- and d is non-nil and a digit.
 * 
 *   Symbols that start with +3 or -2 are not readable because they look
 *   like numbers.
 */
clojure.test.check.generators._PLUS__or___digit_QMARK_ = (function clojure$test$check$generators$_PLUS__or___digit_QMARK_(c,d){
return cljs.core.boolean$((function (){var and__5000__auto__ = d;
if(cljs.core.truth_(and__5000__auto__)){
var and__5000__auto____$1 = ((("+" === c)) || (("-" === c)));
if(and__5000__auto____$1){
return clojure.test.check.generators.digit_QMARK_(d);
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})());
});
/**
 * Generates a namespace string for a symbol/keyword.
 */
clojure.test.check.generators.symbol_name_or_namespace = clojure.test.check.generators.fmap((function (p__133550){
var vec__133551 = p__133550;
var c = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__133551,(0),null);
var cs = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__133551,(1),null);
var s = clojure.string.join.cljs$core$IFn$_invoke$arity$1(cljs.core.cons(c,cs));
return clojure.string.replace(clojure.string.replace(s,/:{2,}/,":"),/:$/,"");
}),clojure.test.check.generators.such_that.cljs$core$IFn$_invoke$arity$2((function (p__133554){
var vec__133555 = p__133554;
var c = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__133555,(0),null);
var vec__133558 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__133555,(1),null);
var d = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__133558,(0),null);
return (!(clojure.test.check.generators._PLUS__or___digit_QMARK_(c,d)));
}),clojure.test.check.generators.tuple.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([clojure.test.check.generators.char_symbol_initial,clojure.test.check.generators.vector.cljs$core$IFn$_invoke$arity$1(clojure.test.check.generators.char_symbol_noninitial)], 0))));
/**
 * Scales the sizing down on a keyword or symbol generator so as to
 *   make it reasonable.
 */
clojure.test.check.generators.resize_symbolish_generator = (function clojure$test$check$generators$resize_symbolish_generator(g){
return clojure.test.check.generators.scale((function (p1__133561_SHARP_){
return cljs.core.long$(Math.pow(p1__133561_SHARP_,0.6));
}),g);
});
/**
 * Generates keywords without namespaces.
 */
clojure.test.check.generators.keyword = clojure.test.check.generators.resize_symbolish_generator(clojure.test.check.generators.fmap(cljs.core.keyword,clojure.test.check.generators.symbol_name_or_namespace));
/**
 * Generates keywords with namespaces.
 */
clojure.test.check.generators.keyword_ns = clojure.test.check.generators.resize_symbolish_generator(clojure.test.check.generators.fmap((function (p__133562){
var vec__133563 = p__133562;
var ns = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__133563,(0),null);
var name = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__133563,(1),null);
return cljs.core.keyword.cljs$core$IFn$_invoke$arity$2(ns,name);
}),clojure.test.check.generators.tuple.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([clojure.test.check.generators.symbol_name_or_namespace,clojure.test.check.generators.symbol_name_or_namespace], 0))));
/**
 * Generates symbols without namespaces.
 */
clojure.test.check.generators.symbol = clojure.test.check.generators.frequency(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [(100),clojure.test.check.generators.resize_symbolish_generator(clojure.test.check.generators.fmap(cljs.core.symbol,clojure.test.check.generators.symbol_name_or_namespace))], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [(1),clojure.test.check.generators.return$(new cljs.core.Symbol(null,"/","/",-1371932971,null))], null)], null));
/**
 * Generates symbols with namespaces.
 */
clojure.test.check.generators.symbol_ns = clojure.test.check.generators.resize_symbolish_generator(clojure.test.check.generators.fmap((function (p__133566){
var vec__133567 = p__133566;
var ns = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__133567,(0),null);
var name = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__133567,(1),null);
return cljs.core.symbol.cljs$core$IFn$_invoke$arity$2(ns,name);
}),clojure.test.check.generators.tuple.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([clojure.test.check.generators.symbol_name_or_namespace,clojure.test.check.generators.symbol_name_or_namespace], 0))));
/**
 * Generates a small ratio (or integer) using gen/small-integer. Shrinks
 *   toward simpler ratios, which may be larger or smaller.
 */
clojure.test.check.generators.ratio = clojure.test.check.generators.fmap((function (p__133570){
var vec__133571 = p__133570;
var a = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__133571,(0),null);
var b = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__133571,(1),null);
return (a / b);
}),clojure.test.check.generators.tuple.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([clojure.test.check.generators.small_integer,clojure.test.check.generators.fmap(cljs.core.inc,clojure.test.check.generators.nat)], 0)));
/**
 * Generates a random type-4 UUID. Does not shrink.
 */
clojure.test.check.generators.uuid = clojure.test.check.generators.no_shrink(clojure.test.check.generators.fmap((function (nibbles){
var hex = (function clojure$test$check$generators$hex(idx){
return (nibbles.cljs$core$IFn$_invoke$arity$1 ? nibbles.cljs$core$IFn$_invoke$arity$1(idx) : nibbles.call(null,idx)).toString((16));
});
var rhex = (((nibbles.cljs$core$IFn$_invoke$arity$1 ? nibbles.cljs$core$IFn$_invoke$arity$1((15)) : nibbles.call(null,(15))) & (3)) + (8)).toString((16));
return cljs.core.uuid([cljs.core.str.cljs$core$IFn$_invoke$arity$1(hex((0))),cljs.core.str.cljs$core$IFn$_invoke$arity$1(hex((1))),cljs.core.str.cljs$core$IFn$_invoke$arity$1(hex((2))),cljs.core.str.cljs$core$IFn$_invoke$arity$1(hex((3))),cljs.core.str.cljs$core$IFn$_invoke$arity$1(hex((4))),cljs.core.str.cljs$core$IFn$_invoke$arity$1(hex((5))),cljs.core.str.cljs$core$IFn$_invoke$arity$1(hex((6))),cljs.core.str.cljs$core$IFn$_invoke$arity$1(hex((7))),"-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(hex((8))),cljs.core.str.cljs$core$IFn$_invoke$arity$1(hex((9))),cljs.core.str.cljs$core$IFn$_invoke$arity$1(hex((10))),cljs.core.str.cljs$core$IFn$_invoke$arity$1(hex((11))),"-","4",cljs.core.str.cljs$core$IFn$_invoke$arity$1(hex((12))),cljs.core.str.cljs$core$IFn$_invoke$arity$1(hex((13))),cljs.core.str.cljs$core$IFn$_invoke$arity$1(hex((14))),"-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(rhex),cljs.core.str.cljs$core$IFn$_invoke$arity$1(hex((16))),cljs.core.str.cljs$core$IFn$_invoke$arity$1(hex((17))),cljs.core.str.cljs$core$IFn$_invoke$arity$1(hex((18))),"-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(hex((19))),cljs.core.str.cljs$core$IFn$_invoke$arity$1(hex((20))),cljs.core.str.cljs$core$IFn$_invoke$arity$1(hex((21))),cljs.core.str.cljs$core$IFn$_invoke$arity$1(hex((22))),cljs.core.str.cljs$core$IFn$_invoke$arity$1(hex((23))),cljs.core.str.cljs$core$IFn$_invoke$arity$1(hex((24))),cljs.core.str.cljs$core$IFn$_invoke$arity$1(hex((25))),cljs.core.str.cljs$core$IFn$_invoke$arity$1(hex((26))),cljs.core.str.cljs$core$IFn$_invoke$arity$1(hex((27))),cljs.core.str.cljs$core$IFn$_invoke$arity$1(hex((28))),cljs.core.str.cljs$core$IFn$_invoke$arity$1(hex((29))),cljs.core.str.cljs$core$IFn$_invoke$arity$1(hex((30)))].join(''));
}),clojure.test.check.generators.vector.cljs$core$IFn$_invoke$arity$2(clojure.test.check.generators.choose((0),(15)),(31))));
clojure.test.check.generators.base_simple_type = (function clojure$test$check$generators$base_simple_type(double_gen,char_gen,string_gen){
return clojure.test.check.generators.one_of(new cljs.core.PersistentVector(null, 12, 5, cljs.core.PersistentVector.EMPTY_NODE, [clojure.test.check.generators.int$,clojure.test.check.generators.large_integer,double_gen,char_gen,string_gen,clojure.test.check.generators.ratio,clojure.test.check.generators.boolean$,clojure.test.check.generators.keyword,clojure.test.check.generators.keyword_ns,clojure.test.check.generators.symbol,clojure.test.check.generators.symbol_ns,clojure.test.check.generators.uuid], null));
});
/**
 * Generates a variety of scalar types.
 */
clojure.test.check.generators.simple_type = clojure.test.check.generators.base_simple_type(clojure.test.check.generators.double$,clojure.test.check.generators.char$,clojure.test.check.generators.string);
/**
 * Generates a variety of scalar types, with printable strings.
 */
clojure.test.check.generators.simple_type_printable = clojure.test.check.generators.base_simple_type(clojure.test.check.generators.double$,clojure.test.check.generators.char_ascii,clojure.test.check.generators.string_ascii);
/**
 * Like gen/simple-type, but only generates objects that can be
 *   equal to other objects (e.g., not a NaN).
 */
clojure.test.check.generators.simple_type_equatable = clojure.test.check.generators.base_simple_type(clojure.test.check.generators.double_STAR_(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"NaN?","NaN?",-1917767651),false], null)),clojure.test.check.generators.char$,clojure.test.check.generators.string);
/**
 * Like gen/simple-type-printable, but only generates objects that
 *   can be equal to other objects (e.g., not a NaN).
 */
clojure.test.check.generators.simple_type_printable_equatable = clojure.test.check.generators.base_simple_type(clojure.test.check.generators.double_STAR_(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"NaN?","NaN?",-1917767651),false], null)),clojure.test.check.generators.char_ascii,clojure.test.check.generators.string_ascii);
clojure.test.check.generators.hashable_QMARK_ = (function clojure$test$check$generators$hashable_QMARK_(x){
if(typeof x === 'number'){
return cljs.core.not((function (){var or__5002__auto__ = isNaN(x);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(clojure.test.check.generators.NEG_INFINITY,x)) || (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(clojure.test.check.generators.POS_INFINITY,x)));
}
})());
} else {
return true;
}
});
clojure.test.check.generators.container_type = (function clojure$test$check$generators$container_type(inner_type){
return clojure.test.check.generators.one_of(new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [clojure.test.check.generators.vector.cljs$core$IFn$_invoke$arity$1(inner_type),clojure.test.check.generators.list(inner_type),clojure.test.check.generators.set.cljs$core$IFn$_invoke$arity$1(clojure.test.check.generators.such_that.cljs$core$IFn$_invoke$arity$2(clojure.test.check.generators.hashable_QMARK_,inner_type)),clojure.test.check.generators.scale((function (p1__133574_SHARP_){
return cljs.core.quot(p1__133574_SHARP_,(2));
}),clojure.test.check.generators.map.cljs$core$IFn$_invoke$arity$2(clojure.test.check.generators.such_that.cljs$core$IFn$_invoke$arity$2(clojure.test.check.generators.hashable_QMARK_,inner_type),inner_type))], null));
});
clojure.test.check.generators.size__GT_max_leaf_count = (function clojure$test$check$generators$size__GT_max_leaf_count(size){
return cljs.core.long$(Math.pow(size,1.1));
});
var log2_133713 = Math.log((2));
/**
 * Returns (not generates) a random collection of integers `xs`
 *   greater than 1 such that (<= (apply * xs) n).
 */
clojure.test.check.generators.random_pseudofactoring = (function clojure$test$check$generators$random_pseudofactoring(n,rng){
if((n <= (2))){
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [n], null);
} else {
var log = Math.log(n);
var vec__133575 = clojure.test.check.random.split(rng);
var r1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__133575,(0),null);
var r2 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__133575,(1),null);
var n1 = cljs.core.long$(Math.exp(((clojure.test.check.random.rand_double(r1) * (log - log2_133713)) + log2_133713)));
var n2 = cljs.core.quot(n,n1);
if(((((1) < n1)) && (((1) < n2)))){
return cljs.core.cons(n1,(clojure.test.check.generators.random_pseudofactoring.cljs$core$IFn$_invoke$arity$2 ? clojure.test.check.generators.random_pseudofactoring.cljs$core$IFn$_invoke$arity$2(n2,r2) : clojure.test.check.generators.random_pseudofactoring.call(null,n2,r2)));
} else {
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [n], null);
}
}
});
/**
 * Like sized, but passes an rng instead of a size.
 */
clojure.test.check.generators.randomized = (function clojure$test$check$generators$randomized(func){
return clojure.test.check.generators.make_gen((function (rng,size){
var vec__133578 = clojure.test.check.random.split(rng);
var r1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__133578,(0),null);
var r2 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__133578,(1),null);
return clojure.test.check.generators.call_gen((func.cljs$core$IFn$_invoke$arity$1 ? func.cljs$core$IFn$_invoke$arity$1(r1) : func.call(null,r1)),r2,size);
}));
});
/**
 * This is a helper for writing recursive (tree-shaped) generators. The first
 *   argument should be a function that takes a generator as an argument, and
 *   produces another generator that 'contains' that generator. The vector function
 *   in this namespace is a simple example. The second argument is a scalar
 *   generator, like boolean. For example, to produce a tree of booleans:
 * 
 *  (gen/recursive-gen gen/vector gen/boolean)
 * 
 *   Vectors or maps either recurring or containing booleans or integers:
 * 
 *  (gen/recursive-gen (fn [inner] (gen/one-of [(gen/vector inner)
 *                                              (gen/map inner inner)]))
 *                     (gen/one-of [gen/boolean gen/small-integer]))
 * 
 *   Note that raw scalar values will be generated as well. To prevent this, you
 *   can wrap the returned generator with the function passed as the first arg,
 *   e.g.:
 * 
 *  (gen/vector (gen/recursive-gen gen/vector gen/boolean))
 */
clojure.test.check.generators.recursive_gen = (function clojure$test$check$generators$recursive_gen(container_gen_fn,scalar_gen){
if(clojure.test.check.generators.generator_QMARK_(scalar_gen)){
} else {
throw (new Error(["Assert failed: ","Second arg to recursive-gen must be a generator","\n","(generator? scalar-gen)"].join('')));
}

return clojure.test.check.generators.sized((function (size){
return clojure.test.check.generators.bind(clojure.test.check.generators.choose((0),clojure.test.check.generators.size__GT_max_leaf_count(size)),(function (max_leaf_count){
return clojure.test.check.generators.randomized((function (rng){
var sizes = clojure.test.check.generators.random_pseudofactoring(max_leaf_count,rng);
var sized_scalar_gen = clojure.test.check.generators.resize(size,scalar_gen);
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (g,size__$1){
return clojure.test.check.generators.bind(clojure.test.check.generators.choose((0),(10)),(function (x){
if((x === (0))){
return sized_scalar_gen;
} else {
return clojure.test.check.generators.resize(size__$1,(container_gen_fn.cljs$core$IFn$_invoke$arity$1 ? container_gen_fn.cljs$core$IFn$_invoke$arity$1(g) : container_gen_fn.call(null,g)));
}
}));
}),sized_scalar_gen,sizes);
}));
}));
}));
});
/**
 * A recursive generator that will generate many different, often nested, values
 */
clojure.test.check.generators.any = clojure.test.check.generators.recursive_gen(clojure.test.check.generators.container_type,clojure.test.check.generators.simple_type);
/**
 * Like any, but avoids characters that the shell will interpret as actions,
 *   like 7 and 14 (bell and alternate character set command)
 */
clojure.test.check.generators.any_printable = clojure.test.check.generators.recursive_gen(clojure.test.check.generators.container_type,clojure.test.check.generators.simple_type_printable);
/**
 * Like any, but only generates objects that can be equal to other objects (e.g., do
 *   not contain a NaN)
 */
clojure.test.check.generators.any_equatable = clojure.test.check.generators.recursive_gen(clojure.test.check.generators.container_type,clojure.test.check.generators.simple_type_equatable);
/**
 * Like any, but avoids characters that the shell will interpret as actions,
 *   like 7 and 14 (bell and alternate character set command), and only generates
 *   objects that can be equal to other objects (e.g., do not contain a NaN)
 */
clojure.test.check.generators.any_printable_equatable = clojure.test.check.generators.recursive_gen(clojure.test.check.generators.container_type,clojure.test.check.generators.simple_type_printable_equatable);

//# sourceMappingURL=clojure.test.check.generators.js.map
