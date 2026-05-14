goog.provide('malli.generator');



/**
 * @interface
 */
malli.generator.Generator = function(){};

var malli$generator$Generator$_generator$dyn_133946 = (function (this$,options){
var x__5350__auto__ = (((this$ == null))?null:this$);
var m__5351__auto__ = (malli.generator._generator[goog.typeOf(x__5350__auto__)]);
if((!((m__5351__auto__ == null)))){
return (m__5351__auto__.cljs$core$IFn$_invoke$arity$2 ? m__5351__auto__.cljs$core$IFn$_invoke$arity$2(this$,options) : m__5351__auto__.call(null,this$,options));
} else {
var m__5349__auto__ = (malli.generator._generator["_"]);
if((!((m__5349__auto__ == null)))){
return (m__5349__auto__.cljs$core$IFn$_invoke$arity$2 ? m__5349__auto__.cljs$core$IFn$_invoke$arity$2(this$,options) : m__5349__auto__.call(null,this$,options));
} else {
throw cljs.core.missing_protocol("Generator.-generator",this$);
}
}
});
/**
 * returns generator for schema
 */
malli.generator._generator = (function malli$generator$_generator(this$,options){
if((((!((this$ == null)))) && ((!((this$.malli$generator$Generator$_generator$arity$2 == null)))))){
return this$.malli$generator$Generator$_generator$arity$2(this$,options);
} else {
return malli$generator$Generator$_generator$dyn_133946(this$,options);
}
});

malli.generator.nil_gen = clojure.test.check.generators.return$(null);
/**
 * Return a generator of no values that is compatible with -unreachable-gen?.
 */
malli.generator._never_gen = (function malli$generator$_never_gen(p__133808){
var map__133809 = p__133808;
var map__133809__$1 = cljs.core.__destructure_map(map__133809);
var _options = map__133809__$1;
var original_generator_schema = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__133809__$1,new cljs.core.Keyword("malli.generator","original-generator-schema","malli.generator/original-generator-schema",-1122475395));
return cljs.core.with_meta(clojure.test.check.generators.sized((function (_){
return malli.core._fail_BANG_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("malli.generator","infinitely-expanding-schema","malli.generator/infinitely-expanding-schema",-1929651484),(function (){var G__133810 = cljs.core.PersistentArrayMap.EMPTY;
if(cljs.core.truth_(original_generator_schema)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__133810,new cljs.core.Keyword(null,"schema","schema",-1582001791),original_generator_schema);
} else {
return G__133810;
}
})());
})),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("malli.generator","never-gen","malli.generator/never-gen",-887335792),true,new cljs.core.Keyword("malli.generator","original-generator-schema","malli.generator/original-generator-schema",-1122475395),original_generator_schema], null));
});
/**
 * Returns true iff generator g generators no values.
 */
malli.generator._unreachable_gen_QMARK_ = (function malli$generator$_unreachable_gen_QMARK_(g){
return cljs.core.boolean$(new cljs.core.Keyword("malli.generator","never-gen","malli.generator/never-gen",-887335792).cljs$core$IFn$_invoke$arity$1(cljs.core.meta(g)));
});
malli.generator._not_unreachable = (function malli$generator$_not_unreachable(g){
if(malli.generator._unreachable_gen_QMARK_(g)){
return null;
} else {
return g;
}
});
malli.generator._random = (function malli$generator$_random(seed){
if(cljs.core.truth_(seed)){
return clojure.test.check.random.make_random.cljs$core$IFn$_invoke$arity$1(seed);
} else {
return clojure.test.check.random.make_random.cljs$core$IFn$_invoke$arity$0();
}
});
malli.generator._recur = (function malli$generator$_recur(_schema,options){
cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([[cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Symbol("malli.generator","-recur","malli.generator/-recur",-190439331,null))," is deprecated, please update your generators. See instructions in malli.generator."].join('')], 0));

return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [true,options], null);
});
malli.generator._maybe_recur = (function malli$generator$_maybe_recur(_schema,options){
cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([[cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Symbol("malli.generator","-maybe-recur","malli.generator/-maybe-recur",775446056,null))," is deprecated, please update your generators. See instructions in malli.generator."].join('')], 0));

return options;
});
malli.generator._min_max = (function malli$generator$_min_max(schema,options){
var map__133811 = malli.core.properties.cljs$core$IFn$_invoke$arity$2(schema,options);
var map__133811__$1 = cljs.core.__destructure_map(map__133811);
var gen_min = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__133811__$1,new cljs.core.Keyword("gen","min","gen/min",444569458));
var gen_max = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__133811__$1,new cljs.core.Keyword("gen","max","gen/max",61264228));
var min = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__133811__$1,new cljs.core.Keyword(null,"min","min",444991522));
var max = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__133811__$1,new cljs.core.Keyword(null,"max","max",61366548));
if(cljs.core.truth_((function (){var and__5000__auto__ = min;
if(cljs.core.truth_(and__5000__auto__)){
var and__5000__auto____$1 = gen_min;
if(cljs.core.truth_(and__5000__auto____$1)){
return (gen_min < min);
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})())){
malli.core._fail_BANG_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("malli.generator","invalid-property","malli.generator/invalid-property",-418941875),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"key","key",-1516042587),new cljs.core.Keyword("gen","min","gen/min",444569458),new cljs.core.Keyword(null,"value","value",305978217),gen_min,new cljs.core.Keyword(null,"min","min",444991522),min], null));
} else {
}

if(cljs.core.truth_((function (){var and__5000__auto__ = max;
if(cljs.core.truth_(and__5000__auto__)){
var and__5000__auto____$1 = gen_max;
if(cljs.core.truth_(and__5000__auto____$1)){
return (gen_max > max);
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})())){
malli.core._fail_BANG_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("malli.generator","invalid-property","malli.generator/invalid-property",-418941875),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"key","key",-1516042587),new cljs.core.Keyword("gen","max","gen/max",61264228),new cljs.core.Keyword(null,"value","value",305978217),gen_min,new cljs.core.Keyword(null,"max","max",61366548),min], null));
} else {
}

return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"min","min",444991522),(function (){var or__5002__auto__ = gen_min;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return min;
}
})(),new cljs.core.Keyword(null,"max","max",61366548),(function (){var or__5002__auto__ = gen_max;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return max;
}
})()], null);
});
malli.generator._double_gen = (function malli$generator$_double_gen(options){
return clojure.test.check.generators.double_STAR_(cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"infinite?","infinite?",-2017886608),false,new cljs.core.Keyword(null,"NaN?","NaN?",-1917767651),false], null),options], 0)));
});
malli.generator.gen_vector_min = (function malli$generator$gen_vector_min(gen,min,options){
var G__133813 = clojure.test.check.generators.sized((function (p1__133812_SHARP_){
return clojure.test.check.generators.vector.cljs$core$IFn$_invoke$arity$3(gen,min,(min + p1__133812_SHARP_));
}));
if(cljs.core.truth_(new cljs.core.Keyword("malli.generator","generator-ast","malli.generator/generator-ast",-1769943051).cljs$core$IFn$_invoke$arity$1(options))){
return cljs.core.vary_meta.cljs$core$IFn$_invoke$arity$4(G__133813,cljs.core.assoc,new cljs.core.Keyword("malli.generator","generator-ast","malli.generator/generator-ast",-1769943051),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"op","op",-1882987955),new cljs.core.Keyword(null,"vector-min","vector-min",-2065952790),new cljs.core.Keyword(null,"generator","generator",-572962281),gen,new cljs.core.Keyword(null,"min","min",444991522),min], null));
} else {
return G__133813;
}
});
malli.generator._string_gen = (function malli$generator$_string_gen(schema,options){
var map__133814 = malli.generator._min_max(schema,options);
var map__133814__$1 = cljs.core.__destructure_map(map__133814);
var min = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__133814__$1,new cljs.core.Keyword(null,"min","min",444991522));
var max = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__133814__$1,new cljs.core.Keyword(null,"max","max",61366548));
if(cljs.core.truth_((function (){var and__5000__auto__ = min;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(min,max);
} else {
return and__5000__auto__;
}
})())){
return clojure.test.check.generators.fmap(clojure.string.join,clojure.test.check.generators.vector.cljs$core$IFn$_invoke$arity$2(clojure.test.check.generators.char_alphanumeric,min));
} else {
if(cljs.core.truth_((function (){var and__5000__auto__ = min;
if(cljs.core.truth_(and__5000__auto__)){
return max;
} else {
return and__5000__auto__;
}
})())){
return clojure.test.check.generators.fmap(clojure.string.join,clojure.test.check.generators.vector.cljs$core$IFn$_invoke$arity$3(clojure.test.check.generators.char_alphanumeric,min,max));
} else {
if(cljs.core.truth_(min)){
return clojure.test.check.generators.fmap(clojure.string.join,malli.generator.gen_vector_min(clojure.test.check.generators.char_alphanumeric,min,options));
} else {
if(cljs.core.truth_(max)){
return clojure.test.check.generators.fmap(clojure.string.join,clojure.test.check.generators.vector.cljs$core$IFn$_invoke$arity$3(clojure.test.check.generators.char_alphanumeric,(0),max));
} else {
return clojure.test.check.generators.string_alphanumeric;

}
}
}
}
});
malli.generator._coll_gen = (function malli$generator$_coll_gen(schema,f,options){
var map__133815 = malli.generator._min_max(schema,options);
var map__133815__$1 = cljs.core.__destructure_map(map__133815);
var min = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__133815__$1,new cljs.core.Keyword(null,"min","min",444991522));
var max = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__133815__$1,new cljs.core.Keyword(null,"max","max",61366548));
var child = cljs.core.first(malli.core.children.cljs$core$IFn$_invoke$arity$1(schema));
var gen = (malli.generator.generator.cljs$core$IFn$_invoke$arity$2 ? malli.generator.generator.cljs$core$IFn$_invoke$arity$2(child,options) : malli.generator.generator.call(null,child,options));
if(malli.generator._unreachable_gen_QMARK_(gen)){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2((0),(function (){var or__5002__auto__ = min;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return (0);
}
})())){
return clojure.test.check.generators.fmap(f,clojure.test.check.generators.return$(cljs.core.PersistentVector.EMPTY));
} else {
return malli.generator._never_gen(options);
}
} else {
return clojure.test.check.generators.fmap(f,(cljs.core.truth_((function (){var and__5000__auto__ = min;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(min,max);
} else {
return and__5000__auto__;
}
})())?clojure.test.check.generators.vector.cljs$core$IFn$_invoke$arity$2(gen,min):(cljs.core.truth_((function (){var and__5000__auto__ = min;
if(cljs.core.truth_(and__5000__auto__)){
return max;
} else {
return and__5000__auto__;
}
})())?clojure.test.check.generators.vector.cljs$core$IFn$_invoke$arity$3(gen,min,max):(cljs.core.truth_(min)?malli.generator.gen_vector_min(gen,min,options):(cljs.core.truth_(max)?clojure.test.check.generators.vector.cljs$core$IFn$_invoke$arity$3(gen,(0),max):clojure.test.check.generators.vector.cljs$core$IFn$_invoke$arity$1(gen)
)))));
}
});
malli.generator._coll_distinct_gen = (function malli$generator$_coll_distinct_gen(schema,f,options){
var map__133817 = malli.generator._min_max(schema,options);
var map__133817__$1 = cljs.core.__destructure_map(map__133817);
var min = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__133817__$1,new cljs.core.Keyword(null,"min","min",444991522));
var max = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__133817__$1,new cljs.core.Keyword(null,"max","max",61366548));
var child = cljs.core.first(malli.core.children.cljs$core$IFn$_invoke$arity$1(schema));
var gen = (malli.generator.generator.cljs$core$IFn$_invoke$arity$2 ? malli.generator.generator.cljs$core$IFn$_invoke$arity$2(child,options) : malli.generator.generator.call(null,child,options));
if(malli.generator._unreachable_gen_QMARK_(gen)){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2((0),(function (){var or__5002__auto__ = min;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return (0);
}
})())){
return clojure.test.check.generators.return$((function (){var G__133818 = cljs.core.PersistentVector.EMPTY;
return (f.cljs$core$IFn$_invoke$arity$1 ? f.cljs$core$IFn$_invoke$arity$1(G__133818) : f.call(null,G__133818));
})());
} else {
return malli.generator._never_gen(options);
}
} else {
return clojure.test.check.generators.fmap(f,clojure.test.check.generators.vector_distinct.cljs$core$IFn$_invoke$arity$2(gen,new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"min-elements","min-elements",949370780),min,new cljs.core.Keyword(null,"max-elements","max-elements",433034073),max,new cljs.core.Keyword(null,"max-tries","max-tries",-1824441792),(100),new cljs.core.Keyword(null,"ex-fn","ex-fn",-284925510),(function (p1__133816_SHARP_){
return malli.core._exception(new cljs.core.Keyword("malli.generator","distinct-generator-failure","malli.generator/distinct-generator-failure",-2085139904),cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(p1__133816_SHARP_,new cljs.core.Keyword(null,"schema","schema",-1582001791),schema));
})], null)));
}
});
malli.generator._and_gen = (function malli$generator$_and_gen(schema,options){
var temp__5806__auto__ = malli.generator._not_unreachable((function (){var G__133820 = cljs.core.first(malli.core.children.cljs$core$IFn$_invoke$arity$2(schema,options));
var G__133821 = options;
return (malli.generator.generator.cljs$core$IFn$_invoke$arity$2 ? malli.generator.generator.cljs$core$IFn$_invoke$arity$2(G__133820,G__133821) : malli.generator.generator.call(null,G__133820,G__133821));
})());
if((temp__5806__auto__ == null)){
return malli.generator._never_gen(options);
} else {
var gen = temp__5806__auto__;
return clojure.test.check.generators.such_that.cljs$core$IFn$_invoke$arity$3(malli.core.validator.cljs$core$IFn$_invoke$arity$2(schema,options),gen,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"max-tries","max-tries",-1824441792),(100),new cljs.core.Keyword(null,"ex-fn","ex-fn",-284925510),(function (p1__133819_SHARP_){
return malli.core._exception(new cljs.core.Keyword("malli.generator","and-generator-failure","malli.generator/and-generator-failure",-233160940),cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(p1__133819_SHARP_,new cljs.core.Keyword(null,"schema","schema",-1582001791),schema));
})], null));
}
});
malli.generator.gen_one_of = (function malli$generator$gen_one_of(gs){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2((1),cljs.core.count(gs))){
return cljs.core.first(gs);
} else {
return clojure.test.check.generators.one_of(gs);
}
});
malli.generator._or_gen = (function malli$generator$_or_gen(schema,options){
var temp__5806__auto__ = cljs.core.not_empty(cljs.core.into.cljs$core$IFn$_invoke$arity$3(cljs.core.PersistentVector.EMPTY,cljs.core.keep.cljs$core$IFn$_invoke$arity$1((function (p1__133822_SHARP_){
return malli.generator._not_unreachable((malli.generator.generator.cljs$core$IFn$_invoke$arity$2 ? malli.generator.generator.cljs$core$IFn$_invoke$arity$2(p1__133822_SHARP_,options) : malli.generator.generator.call(null,p1__133822_SHARP_,options)));
})),malli.core.children.cljs$core$IFn$_invoke$arity$2(schema,options)));
if((temp__5806__auto__ == null)){
return malli.generator._never_gen(options);
} else {
var gs = temp__5806__auto__;
return malli.generator.gen_one_of(gs);
}
});
malli.generator._multi_gen = (function malli$generator$_multi_gen(schema,options){
var temp__5806__auto__ = cljs.core.not_empty(cljs.core.into.cljs$core$IFn$_invoke$arity$3(cljs.core.PersistentVector.EMPTY,cljs.core.keep.cljs$core$IFn$_invoke$arity$1((function (p1__133823_SHARP_){
return malli.generator._not_unreachable((function (){var G__133824 = cljs.core.last(p1__133823_SHARP_);
var G__133825 = options;
return (malli.generator.generator.cljs$core$IFn$_invoke$arity$2 ? malli.generator.generator.cljs$core$IFn$_invoke$arity$2(G__133824,G__133825) : malli.generator.generator.call(null,G__133824,G__133825));
})());
})),malli.core.entries.cljs$core$IFn$_invoke$arity$2(schema,options)));
if((temp__5806__auto__ == null)){
return malli.generator._never_gen(options);
} else {
var gs = temp__5806__auto__;
return malli.generator.gen_one_of(gs);
}
});
malli.generator._build_map = (function malli$generator$_build_map(kvs){
return cljs.core.persistent_BANG_(cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (acc,p__133826){
var vec__133827 = p__133826;
var k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__133827,(0),null);
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__133827,(1),null);
if(((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(k,new cljs.core.Keyword("malli.core","default","malli.core/default",-1706204176))) && (cljs.core.map_QMARK_(v)))){
return cljs.core.reduce_kv(cljs.core.assoc_BANG_,acc,v);
} else {
if((k == null)){
return acc;
} else {
return cljs.core.assoc_BANG_.cljs$core$IFn$_invoke$arity$3(acc,k,v);

}
}
}),cljs.core.transient$(cljs.core.PersistentArrayMap.EMPTY),kvs));
});
malli.generator._value_gen = (function malli$generator$_value_gen(k,s,options){
var g = (malli.generator.generator.cljs$core$IFn$_invoke$arity$2 ? malli.generator.generator.cljs$core$IFn$_invoke$arity$2(s,options) : malli.generator.generator.call(null,s,options));
var G__133830 = g;
if(cljs.core.truth_(malli.generator._not_unreachable(g))){
return clojure.test.check.generators.fmap((function (v){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [k,v], null);
}),G__133830);
} else {
return G__133830;
}
});
malli.generator._map_gen = (function malli$generator$_map_gen(schema,options){
var G__133837 = malli.core.entries.cljs$core$IFn$_invoke$arity$1(schema);
var vec__133838 = G__133837;
var seq__133839 = cljs.core.seq(vec__133838);
var first__133840 = cljs.core.first(seq__133839);
var seq__133839__$1 = cljs.core.next(seq__133839);
var vec__133841 = first__133840;
var k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__133841,(0),null);
var s = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__133841,(1),null);
var e = vec__133841;
var entries = seq__133839__$1;
var gens = cljs.core.PersistentVector.EMPTY;
var G__133837__$1 = G__133837;
var gens__$1 = gens;
while(true){
var vec__133850 = G__133837__$1;
var seq__133851 = cljs.core.seq(vec__133850);
var first__133852 = cljs.core.first(seq__133851);
var seq__133851__$1 = cljs.core.next(seq__133851);
var vec__133853 = first__133852;
var k__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__133853,(0),null);
var s__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__133853,(1),null);
var e__$1 = vec__133853;
var entries__$1 = seq__133851__$1;
var gens__$2 = gens__$1;
if((e__$1 == null)){
return clojure.test.check.generators.fmap(malli.generator._build_map,cljs.core.apply.cljs$core$IFn$_invoke$arity$2(clojure.test.check.generators.tuple,gens__$2));
} else {
if(cljs.core.truth_(new cljs.core.Keyword(null,"optional","optional",2053951509).cljs$core$IFn$_invoke$arity$1(malli.core.properties.cljs$core$IFn$_invoke$arity$1(malli.impl.util._last(e__$1))))){
var G__133952 = entries__$1;
var G__133953 = cljs.core.conj.cljs$core$IFn$_invoke$arity$2(gens__$2,(function (){var temp__5802__auto__ = malli.generator._not_unreachable(malli.generator._value_gen(k__$1,s__$1,options));
if(cljs.core.truth_(temp__5802__auto__)){
var g = temp__5802__auto__;
return malli.generator.gen_one_of(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [malli.generator.nil_gen,g], null));
} else {
return malli.generator.nil_gen;
}
})());
G__133837__$1 = G__133952;
gens__$1 = G__133953;
continue;
} else {
var g = malli.generator._value_gen(k__$1,s__$1,options);
if(malli.generator._unreachable_gen_QMARK_(g)){
return malli.generator._never_gen(options);
} else {
var G__133955 = entries__$1;
var G__133956 = cljs.core.conj.cljs$core$IFn$_invoke$arity$2(gens__$2,g);
G__133837__$1 = G__133955;
gens__$1 = G__133956;
continue;
}
}
}
break;
}
});
malli.generator._map_of_gen = (function malli$generator$_map_of_gen(schema,options){
var map__133859 = malli.generator._min_max(schema,options);
var map__133859__$1 = cljs.core.__destructure_map(map__133859);
var min = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__133859__$1,new cljs.core.Keyword(null,"min","min",444991522));
var max = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__133859__$1,new cljs.core.Keyword(null,"max","max",61366548));
var vec__133860 = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__133856_SHARP_){
return (malli.generator.generator.cljs$core$IFn$_invoke$arity$2 ? malli.generator.generator.cljs$core$IFn$_invoke$arity$2(p1__133856_SHARP_,options) : malli.generator.generator.call(null,p1__133856_SHARP_,options));
}),malli.core.children.cljs$core$IFn$_invoke$arity$2(schema,options));
var k_gen = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__133860,(0),null);
var v_gen = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__133860,(1),null);
var gs = vec__133860;
if(cljs.core.truth_(cljs.core.some(malli.generator._unreachable_gen_QMARK_,gs))){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2((0),(function (){var or__5002__auto__ = min;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return (0);
}
})())){
return clojure.test.check.generators.return$(cljs.core.PersistentArrayMap.EMPTY);
} else {
return malli.generator._never_gen(options);
}
} else {
var opts = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3((cljs.core.truth_((function (){var and__5000__auto__ = min;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(min,max);
} else {
return and__5000__auto__;
}
})())?new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"num-elements","num-elements",1960422107),min], null):(cljs.core.truth_((function (){var and__5000__auto__ = min;
if(cljs.core.truth_(and__5000__auto__)){
return max;
} else {
return and__5000__auto__;
}
})())?new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"min-elements","min-elements",949370780),min,new cljs.core.Keyword(null,"max-elements","max-elements",433034073),max], null):(cljs.core.truth_(min)?new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"min-elements","min-elements",949370780),min], null):(cljs.core.truth_(max)?new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"max-elements","max-elements",433034073),max], null):null)))),new cljs.core.Keyword(null,"ex-fn","ex-fn",-284925510),(function (p1__133857_SHARP_){
return malli.core._exception(new cljs.core.Keyword("malli.generator","distinct-generator-failure","malli.generator/distinct-generator-failure",-2085139904),cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(p1__133857_SHARP_,new cljs.core.Keyword(null,"schema","schema",-1582001791),schema));
}));
return clojure.test.check.generators.fmap((function (p1__133858_SHARP_){
return cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,p1__133858_SHARP_);
}),clojure.test.check.generators.vector_distinct_by.cljs$core$IFn$_invoke$arity$3(cljs.core.first,clojure.test.check.generators.tuple.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([k_gen,v_gen], 0)),opts));
}
});
malli.generator._identify_ref_schema = (function malli$generator$_identify_ref_schema(schema){
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"scope","scope",-439358418),malli.registry._schemas(malli.core._registry.cljs$core$IFn$_invoke$arity$1(malli.core._options(schema))),new cljs.core.Keyword(null,"name","name",1843675177),malli.core._ref(schema)], null);
});
malli.generator._ref_gen = (function malli$generator$_ref_gen(schema,options){
var ref_id = malli.generator._identify_ref_schema(schema);
var or__5002__auto__ = cljs.core.force(cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(options,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("malli.generator","rec-gen","malli.generator/rec-gen",65631558),ref_id], null)));
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var scalar_ref_gen = (new cljs.core.Delay((function (){
return malli.generator._never_gen(options);
}),null));
var dschema = malli.core.deref.cljs$core$IFn$_invoke$arity$1(schema);
var G__133864 = (function (){var G__133865 = dschema;
var G__133866 = cljs.core.assoc_in(options,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("malli.generator","rec-gen","malli.generator/rec-gen",65631558),ref_id], null),scalar_ref_gen);
return (malli.generator.generator.cljs$core$IFn$_invoke$arity$2 ? malli.generator.generator.cljs$core$IFn$_invoke$arity$2(G__133865,G__133866) : malli.generator.generator.call(null,G__133865,G__133866));
})();
if(cljs.core.realized_QMARK_(scalar_ref_gen)){
return clojure.test.check.generators.recursive_gen((function (p1__133863_SHARP_){
var G__133867 = dschema;
var G__133868 = cljs.core.assoc_in(options,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("malli.generator","rec-gen","malli.generator/rec-gen",65631558),ref_id], null),p1__133863_SHARP_);
return (malli.generator.generator.cljs$core$IFn$_invoke$arity$2 ? malli.generator.generator.cljs$core$IFn$_invoke$arity$2(G__133867,G__133868) : malli.generator.generator.call(null,G__133867,G__133868));
}),G__133864);
} else {
return G__133864;
}
}
});
malli.generator.__EQ__GT__gen = (function malli$generator$__EQ__GT__gen(schema,options){
var output_generator = (function (){var G__133869 = new cljs.core.Keyword(null,"output","output",-1105869043).cljs$core$IFn$_invoke$arity$1(malli.core._function_info(schema));
var G__133870 = options;
return (malli.generator.generator.cljs$core$IFn$_invoke$arity$2 ? malli.generator.generator.cljs$core$IFn$_invoke$arity$2(G__133869,G__133870) : malli.generator.generator.call(null,G__133869,G__133870));
})();
return clojure.test.check.generators.return$(malli.core._instrument.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"schema","schema",-1582001791),schema], null),(function() { 
var G__133957__delegate = function (_){
return (malli.generator.generate.cljs$core$IFn$_invoke$arity$2 ? malli.generator.generate.cljs$core$IFn$_invoke$arity$2(output_generator,options) : malli.generator.generate.call(null,output_generator,options));
};
var G__133957 = function (var_args){
var _ = null;
if (arguments.length > 0) {
var G__133959__i = 0, G__133959__a = new Array(arguments.length -  0);
while (G__133959__i < G__133959__a.length) {G__133959__a[G__133959__i] = arguments[G__133959__i + 0]; ++G__133959__i;}
  _ = new cljs.core.IndexedSeq(G__133959__a,0,null);
} 
return G__133957__delegate.call(this,_);};
G__133957.cljs$lang$maxFixedArity = 0;
G__133957.cljs$lang$applyTo = (function (arglist__133960){
var _ = cljs.core.seq(arglist__133960);
return G__133957__delegate(_);
});
G__133957.cljs$core$IFn$_invoke$arity$variadic = G__133957__delegate;
return G__133957;
})()
));
});
malli.generator._function_gen = (function malli$generator$_function_gen(schema,options){
return clojure.test.check.generators.return$(malli.core._instrument.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"schema","schema",-1582001791),schema,new cljs.core.Keyword(null,"gen","gen",142575302),(function (p1__133871_SHARP_){
return (malli.generator.generate.cljs$core$IFn$_invoke$arity$2 ? malli.generator.generate.cljs$core$IFn$_invoke$arity$2(p1__133871_SHARP_,options) : malli.generator.generate.call(null,p1__133871_SHARP_,options));
})], null),options));
});
malli.generator._regex_generator = (function malli$generator$_regex_generator(schema,options){
if(cljs.core.truth_(malli.core._regex_op_QMARK_(schema))){
return (malli.generator.generator.cljs$core$IFn$_invoke$arity$2 ? malli.generator.generator.cljs$core$IFn$_invoke$arity$2(schema,options) : malli.generator.generator.call(null,schema,options));
} else {
var g = (malli.generator.generator.cljs$core$IFn$_invoke$arity$2 ? malli.generator.generator.cljs$core$IFn$_invoke$arity$2(schema,options) : malli.generator.generator.call(null,schema,options));
var G__133872 = g;
if(cljs.core.truth_(malli.generator._not_unreachable(g))){
return clojure.test.check.generators.tuple.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([G__133872], 0));
} else {
return G__133872;
}
}
});
malli.generator.entry__GT_schema = (function malli$generator$entry__GT_schema(e){
if(cljs.core.vector_QMARK_(e)){
return cljs.core.get.cljs$core$IFn$_invoke$arity$2(e,(2));
} else {
return e;
}
});
malli.generator._cat_gen = (function malli$generator$_cat_gen(schema,options){
var gs = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__133873_SHARP_){
return malli.generator._regex_generator(malli.generator.entry__GT_schema(p1__133873_SHARP_),options);
}),malli.core.children.cljs$core$IFn$_invoke$arity$2(schema,options));
if(cljs.core.truth_(cljs.core.some(malli.generator._unreachable_gen_QMARK_,gs))){
return malli.generator._never_gen(options);
} else {
return clojure.test.check.generators.fmap((function (p1__133874_SHARP_){
return cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core.concat,p1__133874_SHARP_);
}),cljs.core.apply.cljs$core$IFn$_invoke$arity$2(clojure.test.check.generators.tuple,gs));
}
});
malli.generator._alt_gen = (function malli$generator$_alt_gen(schema,options){
var gs = cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (p1__133875_SHARP_){
return malli.generator._regex_generator(malli.generator.entry__GT_schema(p1__133875_SHARP_),options);
}),malli.core.children.cljs$core$IFn$_invoke$arity$2(schema,options));
if(cljs.core.every_QMARK_(malli.generator._unreachable_gen_QMARK_,gs)){
return malli.generator._never_gen(options);
} else {
return malli.generator.gen_one_of(cljs.core.into.cljs$core$IFn$_invoke$arity$3(cljs.core.PersistentVector.EMPTY,cljs.core.keep.cljs$core$IFn$_invoke$arity$1(malli.generator._not_unreachable),gs));
}
});
malli.generator.__QMARK__gen = (function malli$generator$__QMARK__gen(schema,options){
var child = malli.core._get(schema,(0),null);
var temp__5806__auto__ = malli.generator._not_unreachable((malli.generator.generator.cljs$core$IFn$_invoke$arity$2 ? malli.generator.generator.cljs$core$IFn$_invoke$arity$2(child,options) : malli.generator.generator.call(null,child,options)));
if((temp__5806__auto__ == null)){
return clojure.test.check.generators.return$(cljs.core.List.EMPTY);
} else {
var g = temp__5806__auto__;
if(cljs.core.truth_(malli.core._regex_op_QMARK_(child))){
return clojure.test.check.generators.one_of(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [g,clojure.test.check.generators.return$(cljs.core.List.EMPTY)], null));
} else {
return clojure.test.check.generators.vector.cljs$core$IFn$_invoke$arity$3(g,(0),(1));
}
}
});
malli.generator.__STAR__gen = (function malli$generator$__STAR__gen(schema,options){
var child = malli.core._get(schema,(0),null);
var mode = new cljs.core.Keyword("malli.generator","-*-gen-mode","malli.generator/-*-gen-mode",-571864514).cljs$core$IFn$_invoke$arity$2(options,new cljs.core.Keyword(null,"*","*",-1294732318));
var options__$1 = cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(options,new cljs.core.Keyword("malli.generator","-*-gen-mode","malli.generator/-*-gen-mode",-571864514));
var temp__5806__auto__ = malli.generator._not_unreachable((malli.generator.generator.cljs$core$IFn$_invoke$arity$2 ? malli.generator.generator.cljs$core$IFn$_invoke$arity$2(child,options__$1) : malli.generator.generator.call(null,child,options__$1)));
if((temp__5806__auto__ == null)){
var G__133877 = mode;
var G__133877__$1 = (((G__133877 instanceof cljs.core.Keyword))?G__133877.fqn:null);
switch (G__133877__$1) {
case "*":
return clojure.test.check.generators.return$(cljs.core.List.EMPTY);

break;
case "+":
return malli.generator._never_gen(options__$1);

break;
default:
throw (new Error(["No matching clause: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(G__133877__$1)].join('')));

}
} else {
var g = temp__5806__auto__;
var G__133878 = (function (){var G__133879 = mode;
var G__133879__$1 = (((G__133879 instanceof cljs.core.Keyword))?G__133879.fqn:null);
switch (G__133879__$1) {
case "*":
return clojure.test.check.generators.vector.cljs$core$IFn$_invoke$arity$1(g);

break;
case "+":
return malli.generator.gen_vector_min(g,(1),options__$1);

break;
default:
throw (new Error(["No matching clause: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(G__133879__$1)].join('')));

}
})();
if(cljs.core.truth_(malli.core._regex_op_QMARK_(child))){
return clojure.test.check.generators.fmap((function (p1__133876_SHARP_){
return cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core.concat,p1__133876_SHARP_);
}),G__133878);
} else {
return G__133878;
}
}
});
malli.generator.__PLUS__gen = (function malli$generator$__PLUS__gen(schema,options){
return malli.generator.__STAR__gen(schema,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(options,new cljs.core.Keyword("malli.generator","-*-gen-mode","malli.generator/-*-gen-mode",-571864514),new cljs.core.Keyword(null,"+","+",1913524883)));
});
malli.generator._repeat_gen = (function malli$generator$_repeat_gen(schema,options){
var child = malli.core._get(schema,(0),null);
var temp__5806__auto__ = malli.generator._not_unreachable(malli.generator._coll_gen(schema,cljs.core.identity,options));
if((temp__5806__auto__ == null)){
return clojure.test.check.generators.return$(cljs.core.List.EMPTY);
} else {
var g = temp__5806__auto__;
var G__133881 = g;
if(cljs.core.truth_(malli.core._regex_op_QMARK_(child))){
return clojure.test.check.generators.fmap((function (p1__133880_SHARP_){
return cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core.concat,p1__133880_SHARP_);
}),G__133881);
} else {
return G__133881;
}
}
});
malli.generator._qualified_ident_gen = (function malli$generator$_qualified_ident_gen(schema,mk_value_with_ns,value_with_ns_gen_size,pred,gen){
var temp__5802__auto__ = new cljs.core.Keyword(null,"namespace","namespace",-377510372).cljs$core$IFn$_invoke$arity$1(malli.core.properties.cljs$core$IFn$_invoke$arity$1(schema));
if(cljs.core.truth_(temp__5802__auto__)){
var namespace_unparsed = temp__5802__auto__;
return clojure.test.check.generators.fmap((function (k){
var G__133883 = cljs.core.name(namespace_unparsed);
var G__133884 = cljs.core.name(k);
return (mk_value_with_ns.cljs$core$IFn$_invoke$arity$2 ? mk_value_with_ns.cljs$core$IFn$_invoke$arity$2(G__133883,G__133884) : mk_value_with_ns.call(null,G__133883,G__133884));
}),value_with_ns_gen_size);
} else {
return clojure.test.check.generators.such_that.cljs$core$IFn$_invoke$arity$3(pred,gen,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"ex-fn","ex-fn",-284925510),(function (p1__133882_SHARP_){
return malli.core._exception(new cljs.core.Keyword("malli.generator","qualified-ident-gen-failure","malli.generator/qualified-ident-gen-failure",-989501892),cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(p1__133882_SHARP_,new cljs.core.Keyword(null,"schema","schema",-1582001791),schema));
})], null));
}
});
malli.generator._qualified_keyword_gen = (function malli$generator$_qualified_keyword_gen(schema){
return malli.generator._qualified_ident_gen(schema,cljs.core.keyword,clojure.test.check.generators.keyword,cljs.core.qualified_keyword_QMARK_,clojure.test.check.generators.keyword_ns);
});
malli.generator._qualified_symbol_gen = (function malli$generator$_qualified_symbol_gen(schema){
return malli.generator._qualified_ident_gen(schema,cljs.core.symbol,clojure.test.check.generators.symbol,cljs.core.qualified_symbol_QMARK_,clojure.test.check.generators.symbol_ns);
});
malli.generator.gen_elements = (function malli$generator$gen_elements(es){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2((1),cljs.core.count(es))){
return clojure.test.check.generators.return$(cljs.core.first(es));
} else {
return clojure.test.check.generators.elements(es);
}
});
if((typeof malli !== 'undefined') && (typeof malli.generator !== 'undefined') && (typeof malli.generator._schema_generator !== 'undefined')){
} else {
malli.generator._schema_generator = (function (){var method_table__5599__auto__ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
var prefer_table__5600__auto__ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
var method_cache__5601__auto__ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
var cached_hierarchy__5602__auto__ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
var hierarchy__5603__auto__ = cljs.core.get.cljs$core$IFn$_invoke$arity$3(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"default","default",-1987822328),new cljs.core.Keyword("malli.generator","default","malli.generator/default",-943988734)], null),new cljs.core.Keyword(null,"hierarchy","hierarchy",-1053470341),(function (){var fexpr__133885 = cljs.core.get_global_hierarchy;
return (fexpr__133885.cljs$core$IFn$_invoke$arity$0 ? fexpr__133885.cljs$core$IFn$_invoke$arity$0() : fexpr__133885.call(null));
})());
return (new cljs.core.MultiFn(cljs.core.symbol.cljs$core$IFn$_invoke$arity$2("malli.generator","-schema-generator"),(function (schema,options){
return malli.core.type.cljs$core$IFn$_invoke$arity$2(schema,options);
}),new cljs.core.Keyword("malli.generator","default","malli.generator/default",-943988734),hierarchy__5603__auto__,method_table__5599__auto__,prefer_table__5600__auto__,method_cache__5601__auto__,cached_hierarchy__5602__auto__));
})();
}
malli.generator._schema_generator.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("malli.generator","default","malli.generator/default",-943988734),(function (schema,options){
return cljs.spec.gen.alpha.gen_for_pred(malli.core.validator.cljs$core$IFn$_invoke$arity$2(schema,options));
}));
malli.generator._schema_generator.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,">",">",-555517146),(function (schema,options){
return malli.generator._double_gen(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"min","min",444991522),(cljs.core.first(malli.core.children.cljs$core$IFn$_invoke$arity$2(schema,options)) + (1))], null));
}));
malli.generator._schema_generator.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,">=",">=",-623615505),(function (schema,options){
return malli.generator._double_gen(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"min","min",444991522),cljs.core.first(malli.core.children.cljs$core$IFn$_invoke$arity$2(schema,options))], null));
}));
malli.generator._schema_generator.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"<","<",-646864291),(function (schema,options){
return malli.generator._double_gen(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"max","max",61366548),(cljs.core.first(malli.core.children.cljs$core$IFn$_invoke$arity$2(schema,options)) - (1))], null));
}));
malli.generator._schema_generator.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"<=","<=",-395636158),(function (schema,options){
return malli.generator._double_gen(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"max","max",61366548),cljs.core.first(malli.core.children.cljs$core$IFn$_invoke$arity$2(schema,options))], null));
}));
malli.generator._schema_generator.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"=","=",1152933628),(function (schema,options){
return clojure.test.check.generators.return$(cljs.core.first(malli.core.children.cljs$core$IFn$_invoke$arity$2(schema,options)));
}));
malli.generator._schema_generator.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"not=","not=",-173995323),(function (schema,options){
return clojure.test.check.generators.such_that.cljs$core$IFn$_invoke$arity$3((function (p1__133886_SHARP_){
return cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(p1__133886_SHARP_,cljs.core.first(malli.core.children.cljs$core$IFn$_invoke$arity$2(schema,options)));
}),clojure.test.check.generators.any_printable,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"max-tries","max-tries",-1824441792),(100),new cljs.core.Keyword(null,"ex-fn","ex-fn",-284925510),(function (p1__133887_SHARP_){
return malli.core._exception(new cljs.core.Keyword("malli.generator","not=-generator-failure","malli.generator/not=-generator-failure",149363311),cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(p1__133887_SHARP_,new cljs.core.Keyword(null,"schema","schema",-1582001791),schema));
})], null));
}));
malli.generator._schema_generator.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Symbol(null,"pos?","pos?",-244377722,null),(function (_,___$1){
return clojure.test.check.generators.one_of(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [malli.generator._double_gen(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"min","min",444991522),1.0E-5], null)),clojure.test.check.generators.fmap(cljs.core.inc,clojure.test.check.generators.nat)], null));
}));
malli.generator._schema_generator.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Symbol(null,"neg?","neg?",-1902175577,null),(function (_,___$1){
return clojure.test.check.generators.one_of(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [malli.generator._double_gen(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"max","max",61366548),-1.0E-4], null)),clojure.test.check.generators.fmap(cljs.core.comp.cljs$core$IFn$_invoke$arity$2(cljs.core.dec,cljs.core._),clojure.test.check.generators.nat)], null));
}));
malli.generator._schema_generator.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"not","not",-595976884),(function (schema,options){
return clojure.test.check.generators.such_that.cljs$core$IFn$_invoke$arity$3(malli.core.validator.cljs$core$IFn$_invoke$arity$2(schema,options),cljs.spec.gen.alpha.gen_for_pred(cljs.core.any_QMARK_),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"max-tries","max-tries",-1824441792),(100),new cljs.core.Keyword(null,"ex-fn","ex-fn",-284925510),(function (p1__133888_SHARP_){
return malli.core._exception(new cljs.core.Keyword("malli.generator","not-generator-failure","malli.generator/not-generator-failure",-1123712279),cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(p1__133888_SHARP_,new cljs.core.Keyword(null,"schema","schema",-1582001791),schema));
})], null));
}));
malli.generator._schema_generator.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"and","and",-971899817),(function (schema,options){
return malli.generator._and_gen(schema,options);
}));
malli.generator._schema_generator.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"or","or",235744169),(function (schema,options){
return malli.generator._or_gen(schema,options);
}));
malli.generator._schema_generator.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"orn","orn",738436484),(function (schema,options){
return malli.generator._or_gen(malli.core.into_schema.cljs$core$IFn$_invoke$arity$4(new cljs.core.Keyword(null,"or","or",235744169),malli.core.properties.cljs$core$IFn$_invoke$arity$1(schema),cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.last,malli.core.children.cljs$core$IFn$_invoke$arity$1(schema)),malli.core.options.cljs$core$IFn$_invoke$arity$1(schema)),options);
}));
malli.generator._schema_generator.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("malli.core","val","malli.core/val",39501268),(function (schema,options){
var G__133889 = cljs.core.first(malli.core.children.cljs$core$IFn$_invoke$arity$1(schema));
var G__133890 = options;
return (malli.generator.generator.cljs$core$IFn$_invoke$arity$2 ? malli.generator.generator.cljs$core$IFn$_invoke$arity$2(G__133889,G__133890) : malli.generator.generator.call(null,G__133889,G__133890));
}));
malli.generator._schema_generator.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"map","map",1371690461),(function (schema,options){
return malli.generator._map_gen(schema,options);
}));
malli.generator._schema_generator.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"map-of","map-of",1189682355),(function (schema,options){
return malli.generator._map_of_gen(schema,options);
}));
malli.generator._schema_generator.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"multi","multi",-190293005),(function (schema,options){
return malli.generator._multi_gen(schema,options);
}));
malli.generator._schema_generator.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"vector","vector",1902966158),(function (schema,options){
return malli.generator._coll_gen(schema,cljs.core.identity,options);
}));
malli.generator._schema_generator.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"sequential","sequential",-1082983960),(function (schema,options){
return malli.generator._coll_gen(schema,cljs.core.identity,options);
}));
malli.generator._schema_generator.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"set","set",304602554),(function (schema,options){
return malli.generator._coll_distinct_gen(schema,cljs.core.set,options);
}));
malli.generator._schema_generator.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"enum","enum",1679018432),(function (schema,options){
return malli.generator.gen_elements(malli.core.children.cljs$core$IFn$_invoke$arity$2(schema,options));
}));
malli.generator._schema_generator.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"maybe","maybe",-314397560),(function (schema,options){
var g = malli.generator._not_unreachable((function (){var G__133891 = cljs.core.first(malli.core.children.cljs$core$IFn$_invoke$arity$2(schema,options));
var G__133892 = options;
return (malli.generator.generator.cljs$core$IFn$_invoke$arity$2 ? malli.generator.generator.cljs$core$IFn$_invoke$arity$2(G__133891,G__133892) : malli.generator.generator.call(null,G__133891,G__133892));
})());
return malli.generator.gen_one_of((function (){var G__133893 = new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [malli.generator.nil_gen], null);
if(cljs.core.truth_(g)){
return cljs.core.conj.cljs$core$IFn$_invoke$arity$2(G__133893,g);
} else {
return G__133893;
}
})());
}));
malli.generator._schema_generator.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"tuple","tuple",-472667284),(function (schema,options){
var gs = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__133894_SHARP_){
return (malli.generator.generator.cljs$core$IFn$_invoke$arity$2 ? malli.generator.generator.cljs$core$IFn$_invoke$arity$2(p1__133894_SHARP_,options) : malli.generator.generator.call(null,p1__133894_SHARP_,options));
}),malli.core.children.cljs$core$IFn$_invoke$arity$2(schema,options));
if(cljs.core.not_any_QMARK_(malli.generator._unreachable_gen_QMARK_,gs)){
return cljs.core.apply.cljs$core$IFn$_invoke$arity$2(clojure.test.check.generators.tuple,gs);
} else {
return malli.generator._never_gen(options);
}
}));
malli.generator._schema_generator.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"any","any",1705907423),(function (_,___$1){
return cljs.spec.gen.alpha.gen_for_pred(cljs.core.any_QMARK_);
}));
malli.generator._schema_generator.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"some","some",-1951079573),(function (_,___$1){
return clojure.test.check.generators.any_printable;
}));
malli.generator._schema_generator.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"nil","nil",99600501),(function (_,___$1){
return malli.generator.nil_gen;
}));
malli.generator._schema_generator.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"string","string",-1989541586),(function (schema,options){
return malli.generator._string_gen(schema,options);
}));
malli.generator._schema_generator.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"int","int",-1741416922),(function (schema,options){
return clojure.test.check.generators.large_integer_STAR_(malli.generator._min_max(schema,options));
}));
malli.generator._schema_generator.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"double","double",884886883),(function (schema,options){
return clojure.test.check.generators.double_STAR_(cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([(function (){var props = malli.core.properties.cljs$core$IFn$_invoke$arity$2(schema,options);
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"infinite?","infinite?",-2017886608),cljs.core.get.cljs$core$IFn$_invoke$arity$3(props,new cljs.core.Keyword("gen","infinite?","gen/infinite?",-2017652832),false),new cljs.core.Keyword(null,"NaN?","NaN?",-1917767651),cljs.core.get.cljs$core$IFn$_invoke$arity$3(props,new cljs.core.Keyword("gen","NaN?","gen/NaN?",-1917993267),false)], null);
})(),malli.generator._min_max(schema,options)], 0)));
}));
malli.generator._schema_generator.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"boolean","boolean",-1919418404),(function (_,___$1){
return clojure.test.check.generators.boolean$;
}));
malli.generator._schema_generator.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"keyword","keyword",811389747),(function (_,___$1){
return clojure.test.check.generators.keyword;
}));
malli.generator._schema_generator.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"symbol","symbol",-1038572696),(function (_,___$1){
return clojure.test.check.generators.symbol;
}));
malli.generator._schema_generator.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"qualified-keyword","qualified-keyword",736041675),(function (schema,_){
return malli.generator._qualified_keyword_gen(schema);
}));
malli.generator._schema_generator.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"qualified-symbol","qualified-symbol",-665513695),(function (schema,_){
return malli.generator._qualified_symbol_gen(schema);
}));
malli.generator._schema_generator.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"uuid","uuid",-2145095719),(function (_,___$1){
return clojure.test.check.generators.uuid;
}));
malli.generator._schema_generator.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"=>","=>",1841166128),(function (schema,options){
return malli.generator.__EQ__GT__gen(schema,options);
}));
malli.generator._schema_generator.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"function","function",-2127255473),(function (schema,options){
return malli.generator._function_gen(schema,options);
}));
malli.generator._schema_generator.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Symbol(null,"ifn?","ifn?",-2106461064,null),(function (_,___$1){
return clojure.test.check.generators.keyword;
}));
malli.generator._schema_generator.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"ref","ref",1289896967),(function (schema,options){
return malli.generator._ref_gen(schema,options);
}));
malli.generator._schema_generator.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"schema","schema",-1582001791),(function (schema,options){
var G__133895 = malli.core.deref.cljs$core$IFn$_invoke$arity$1(schema);
var G__133896 = options;
return (malli.generator.generator.cljs$core$IFn$_invoke$arity$2 ? malli.generator.generator.cljs$core$IFn$_invoke$arity$2(G__133895,G__133896) : malli.generator.generator.call(null,G__133895,G__133896));
}));
malli.generator._schema_generator.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("malli.core","schema","malli.core/schema",-1780373863),(function (schema,options){
var G__133897 = malli.core.deref.cljs$core$IFn$_invoke$arity$1(schema);
var G__133898 = options;
return (malli.generator.generator.cljs$core$IFn$_invoke$arity$2 ? malli.generator.generator.cljs$core$IFn$_invoke$arity$2(G__133897,G__133898) : malli.generator.generator.call(null,G__133897,G__133898));
}));
malli.generator._schema_generator.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"merge","merge",-1804319409),(function (schema,options){
var G__133899 = malli.core.deref.cljs$core$IFn$_invoke$arity$1(schema);
var G__133900 = options;
return (malli.generator.generator.cljs$core$IFn$_invoke$arity$2 ? malli.generator.generator.cljs$core$IFn$_invoke$arity$2(G__133899,G__133900) : malli.generator.generator.call(null,G__133899,G__133900));
}));
malli.generator._schema_generator.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"union","union",2142937499),(function (schema,options){
var G__133901 = malli.core.deref.cljs$core$IFn$_invoke$arity$1(schema);
var G__133902 = options;
return (malli.generator.generator.cljs$core$IFn$_invoke$arity$2 ? malli.generator.generator.cljs$core$IFn$_invoke$arity$2(G__133901,G__133902) : malli.generator.generator.call(null,G__133901,G__133902));
}));
malli.generator._schema_generator.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"select-keys","select-keys",1945879180),(function (schema,options){
var G__133903 = malli.core.deref.cljs$core$IFn$_invoke$arity$1(schema);
var G__133904 = options;
return (malli.generator.generator.cljs$core$IFn$_invoke$arity$2 ? malli.generator.generator.cljs$core$IFn$_invoke$arity$2(G__133903,G__133904) : malli.generator.generator.call(null,G__133903,G__133904));
}));
malli.generator._schema_generator.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"cat","cat",-1457810207),(function (schema,options){
return malli.generator._cat_gen(schema,options);
}));
malli.generator._schema_generator.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"catn","catn",-48807277),(function (schema,options){
return malli.generator._cat_gen(schema,options);
}));
malli.generator._schema_generator.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"alt","alt",-3214426),(function (schema,options){
return malli.generator._alt_gen(schema,options);
}));
malli.generator._schema_generator.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"altn","altn",1717854417),(function (schema,options){
return malli.generator._alt_gen(schema,options);
}));
malli.generator._schema_generator.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"?","?",-1703165233),(function (schema,options){
return malli.generator.__QMARK__gen(schema,options);
}));
malli.generator._schema_generator.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"*","*",-1294732318),(function (schema,options){
return malli.generator.__STAR__gen(schema,options);
}));
malli.generator._schema_generator.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"+","+",1913524883),(function (schema,options){
return malli.generator.__PLUS__gen(schema,options);
}));
malli.generator._schema_generator.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"repeat","repeat",832692087),(function (schema,options){
return malli.generator._repeat_gen(schema,options);
}));
malli.generator._create_from_return = (function malli$generator$_create_from_return(props){
if(cljs.core.contains_QMARK_(props,new cljs.core.Keyword("gen","return","gen/return",-1891612265))){
return clojure.test.check.generators.return$(new cljs.core.Keyword("gen","return","gen/return",-1891612265).cljs$core$IFn$_invoke$arity$1(props));
} else {
return null;
}
});
malli.generator._create_from_elements = (function malli$generator$_create_from_elements(props){
var G__133905 = new cljs.core.Keyword("gen","elements","gen/elements",657813311).cljs$core$IFn$_invoke$arity$1(props);
if((G__133905 == null)){
return null;
} else {
return malli.generator.gen_elements(G__133905);
}
});
(malli.generator.Generator["_"] = true);

(malli.generator._generator["_"] = (function (schema,options){
return malli.generator._schema_generator.cljs$core$IFn$_invoke$arity$2(schema,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(options,new cljs.core.Keyword("malli.generator","original-generator-schema","malli.generator/original-generator-schema",-1122475395),schema));
}));
malli.generator._create_from_gen = (function malli$generator$_create_from_gen(props,schema,options){
var or__5002__auto__ = new cljs.core.Keyword("gen","gen","gen/gen",142743606).cljs$core$IFn$_invoke$arity$1(props);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
if(cljs.core.truth_(new cljs.core.Keyword("gen","elements","gen/elements",657813311).cljs$core$IFn$_invoke$arity$1(props))){
return null;
} else {
return malli.generator._generator(schema,options);
}
}
});
malli.generator._create_from_schema = (function malli$generator$_create_from_schema(props,options){
var G__133906 = new cljs.core.Keyword("gen","schema","gen/schema",-1582038959).cljs$core$IFn$_invoke$arity$1(props);
if((G__133906 == null)){
return null;
} else {
return (malli.generator.generator.cljs$core$IFn$_invoke$arity$2 ? malli.generator.generator.cljs$core$IFn$_invoke$arity$2(G__133906,options) : malli.generator.generator.call(null,G__133906,options));
}
});
malli.generator._create_from_fmap = (function malli$generator$_create_from_fmap(props,schema,options){
var temp__5808__auto__ = new cljs.core.Keyword("gen","fmap","gen/fmap",-1585733563).cljs$core$IFn$_invoke$arity$1(props);
if((temp__5808__auto__ == null)){
return null;
} else {
var fmap = temp__5808__auto__;
return clojure.test.check.generators.fmap(malli.core.eval.cljs$core$IFn$_invoke$arity$2(fmap,(function (){var or__5002__auto__ = options;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return malli.core.options.cljs$core$IFn$_invoke$arity$1(schema);
}
})()),(function (){var or__5002__auto__ = malli.generator._create_from_return(props);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = malli.generator._create_from_elements(props);
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
var or__5002__auto____$2 = malli.generator._create_from_schema(props,options);
if(cljs.core.truth_(or__5002__auto____$2)){
return or__5002__auto____$2;
} else {
var or__5002__auto____$3 = malli.generator._create_from_gen(props,schema,options);
if(cljs.core.truth_(or__5002__auto____$3)){
return or__5002__auto____$3;
} else {
return malli.generator.nil_gen;
}
}
}
}
})());
}
});
malli.generator._create = (function malli$generator$_create(schema,options){
var props = malli.impl.util._merge(malli.core.type_properties.cljs$core$IFn$_invoke$arity$1(schema),malli.core.properties.cljs$core$IFn$_invoke$arity$1(schema));
var or__5002__auto__ = malli.generator._create_from_fmap(props,schema,options);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = malli.generator._create_from_return(props);
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
var or__5002__auto____$2 = malli.generator._create_from_elements(props);
if(cljs.core.truth_(or__5002__auto____$2)){
return or__5002__auto____$2;
} else {
var or__5002__auto____$3 = malli.generator._create_from_schema(props,options);
if(cljs.core.truth_(or__5002__auto____$3)){
return or__5002__auto____$3;
} else {
var or__5002__auto____$4 = malli.generator._create_from_gen(props,schema,options);
if(cljs.core.truth_(or__5002__auto____$4)){
return or__5002__auto____$4;
} else {
return malli.core._fail_BANG_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("malli.generator","no-generator","malli.generator/no-generator",934332770),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"options","options",99638489),options,new cljs.core.Keyword(null,"schema","schema",-1582001791),schema], null));
}
}
}
}
}
});
malli.generator.generator = (function malli$generator$generator(var_args){
var G__133909 = arguments.length;
switch (G__133909) {
case 1:
return malli.generator.generator.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return malli.generator.generator.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(malli.generator.generator.cljs$core$IFn$_invoke$arity$1 = (function (_QMARK_schema){
return malli.generator.generator.cljs$core$IFn$_invoke$arity$2(_QMARK_schema,null);
}));

(malli.generator.generator.cljs$core$IFn$_invoke$arity$2 = (function (_QMARK_schema,options){
if(cljs.core.truth_(new cljs.core.Keyword("malli.generator","rec-gen","malli.generator/rec-gen",65631558).cljs$core$IFn$_invoke$arity$1(options))){
return malli.generator._create(malli.core.schema.cljs$core$IFn$_invoke$arity$2(_QMARK_schema,options),options);
} else {
return malli.core._cached(malli.core.schema.cljs$core$IFn$_invoke$arity$2(_QMARK_schema,options),new cljs.core.Keyword(null,"generator","generator",-572962281),(function (p1__133907_SHARP_){
return malli.generator._create(p1__133907_SHARP_,options);
}));
}
}));

(malli.generator.generator.cljs$lang$maxFixedArity = 2);

malli.generator.generate = (function malli$generator$generate(var_args){
var G__133911 = arguments.length;
switch (G__133911) {
case 1:
return malli.generator.generate.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return malli.generator.generate.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(malli.generator.generate.cljs$core$IFn$_invoke$arity$1 = (function (_QMARK_gen_or_schema){
return malli.generator.generate.cljs$core$IFn$_invoke$arity$2(_QMARK_gen_or_schema,null);
}));

(malli.generator.generate.cljs$core$IFn$_invoke$arity$2 = (function (_QMARK_gen_or_schema,p__133912){
var map__133913 = p__133912;
var map__133913__$1 = cljs.core.__destructure_map(map__133913);
var options = map__133913__$1;
var seed = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__133913__$1,new cljs.core.Keyword(null,"seed","seed",68613327));
var size = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__133913__$1,new cljs.core.Keyword(null,"size","size",1098693007),(30));
var gen = ((clojure.test.check.generators.generator_QMARK_(_QMARK_gen_or_schema))?_QMARK_gen_or_schema:malli.generator.generator.cljs$core$IFn$_invoke$arity$2(_QMARK_gen_or_schema,options));
return clojure.test.check.rose_tree.root(clojure.test.check.generators.call_gen(gen,malli.generator._random(seed),size));
}));

(malli.generator.generate.cljs$lang$maxFixedArity = 2);

malli.generator.sample = (function malli$generator$sample(var_args){
var G__133917 = arguments.length;
switch (G__133917) {
case 1:
return malli.generator.sample.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return malli.generator.sample.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(malli.generator.sample.cljs$core$IFn$_invoke$arity$1 = (function (_QMARK_gen_or_schema){
return malli.generator.sample.cljs$core$IFn$_invoke$arity$2(_QMARK_gen_or_schema,null);
}));

(malli.generator.sample.cljs$core$IFn$_invoke$arity$2 = (function (_QMARK_gen_or_schema,p__133919){
var map__133920 = p__133919;
var map__133920__$1 = cljs.core.__destructure_map(map__133920);
var options = map__133920__$1;
var seed = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__133920__$1,new cljs.core.Keyword(null,"seed","seed",68613327));
var size = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__133920__$1,new cljs.core.Keyword(null,"size","size",1098693007),(10));
var gen = ((clojure.test.check.generators.generator_QMARK_(_QMARK_gen_or_schema))?_QMARK_gen_or_schema:malli.generator.generator.cljs$core$IFn$_invoke$arity$2(_QMARK_gen_or_schema,options));
return cljs.core.take.cljs$core$IFn$_invoke$arity$2(size,cljs.core.map.cljs$core$IFn$_invoke$arity$3((function (p1__133914_SHARP_,p2__133915_SHARP_){
return clojure.test.check.rose_tree.root(clojure.test.check.generators.call_gen(gen,p1__133914_SHARP_,p2__133915_SHARP_));
}),clojure.test.check.generators.lazy_random_states(malli.generator._random(seed)),clojure.test.check.generators.make_size_range_seq(size)));
}));

(malli.generator.sample.cljs$lang$maxFixedArity = 2);

malli.generator.function_checker = (function malli$generator$function_checker(var_args){
var G__133927 = arguments.length;
switch (G__133927) {
case 1:
return malli.generator.function_checker.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return malli.generator.function_checker.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(malli.generator.function_checker.cljs$core$IFn$_invoke$arity$1 = (function (_QMARK_schema){
return malli.generator.function_checker.cljs$core$IFn$_invoke$arity$2(_QMARK_schema,null);
}));

(malli.generator.function_checker.cljs$core$IFn$_invoke$arity$2 = (function (_QMARK_schema,p__133928){
var map__133929 = p__133928;
var map__133929__$1 = cljs.core.__destructure_map(map__133929);
var options = map__133929__$1;
var _EQ__GT_iterations = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__133929__$1,new cljs.core.Keyword("malli.generator","=>iterations","malli.generator/=>iterations",-1726832707),(100));
var schema = malli.core.schema.cljs$core$IFn$_invoke$arity$2(_QMARK_schema,options);
var _try = (function (f){
try{return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [(f.cljs$core$IFn$_invoke$arity$0 ? f.cljs$core$IFn$_invoke$arity$0() : f.call(null)),true], null);
}catch (e133930){if((e133930 instanceof Error)){
var e = e133930;
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [e,false], null);
} else {
throw e133930;

}
}});
var check = (function (schema__$1){
var map__133931 = malli.core._function_info(schema__$1);
var map__133931__$1 = cljs.core.__destructure_map(map__133931);
var input = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__133931__$1,new cljs.core.Keyword(null,"input","input",556931961));
var output = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__133931__$1,new cljs.core.Keyword(null,"output","output",-1105869043));
var guard = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__133931__$1,new cljs.core.Keyword(null,"guard","guard",-873147811));
var input_generator = malli.generator.generator.cljs$core$IFn$_invoke$arity$2(input,options);
var valid_output_QMARK_ = malli.core.validator.cljs$core$IFn$_invoke$arity$2(output,options);
var valid_guard_QMARK_ = (cljs.core.truth_(guard)?malli.core.validator.cljs$core$IFn$_invoke$arity$2(guard,options):cljs.core.constantly(true));
var validate = (function (f,args){
var $ = cljs.core.apply.cljs$core$IFn$_invoke$arity$2(f,args);
var and__5000__auto__ = (valid_output_QMARK_.cljs$core$IFn$_invoke$arity$1 ? valid_output_QMARK_.cljs$core$IFn$_invoke$arity$1($) : valid_output_QMARK_.call(null,$));
if(cljs.core.truth_(and__5000__auto__)){
var G__133932 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [args,$], null);
return (valid_guard_QMARK_.cljs$core$IFn$_invoke$arity$1 ? valid_guard_QMARK_.cljs$core$IFn$_invoke$arity$1(G__133932) : valid_guard_QMARK_.call(null,G__133932));
} else {
return and__5000__auto__;
}
});
return (function (f){
var map__133933 = clojure.test.check.quick_check(_EQ__GT_iterations,clojure.test.check.properties.for_all_STAR_(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [input_generator], null),(function (p1__133923_SHARP_){
return validate(f,p1__133923_SHARP_);
})));
var map__133933__$1 = cljs.core.__destructure_map(map__133933);
var result = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__133933__$1,new cljs.core.Keyword(null,"result","result",1415092211));
var shrunk = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__133933__$1,new cljs.core.Keyword(null,"shrunk","shrunk",-2041664412));
var smallest = cljs.core.first(new cljs.core.Keyword(null,"smallest","smallest",-152623883).cljs$core$IFn$_invoke$arity$1(shrunk));
if(result === true){
return null;
} else {
var explain_input = malli.core.explain.cljs$core$IFn$_invoke$arity$2(input,smallest);
var vec__133934 = (cljs.core.truth_(explain_input)?null:_try((function (){
return cljs.core.apply.cljs$core$IFn$_invoke$arity$2(f,smallest);
})));
var result__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__133934,(0),null);
var success = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__133934,(1),null);
var explain_output = (cljs.core.truth_((function (){var and__5000__auto__ = success;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.not(explain_input);
} else {
return and__5000__auto__;
}
})())?malli.core.explain.cljs$core$IFn$_invoke$arity$2(output,result__$1):null);
var explain_guard = (cljs.core.truth_((function (){var and__5000__auto__ = success;
if(cljs.core.truth_(and__5000__auto__)){
var and__5000__auto____$1 = guard;
if(cljs.core.truth_(and__5000__auto____$1)){
return cljs.core.not(explain_output);
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})())?malli.core.explain.cljs$core$IFn$_invoke$arity$2(guard,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [smallest,result__$1], null)):null);
var G__133937 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(shrunk,new cljs.core.Keyword("malli.core","result","malli.core/result",1538632379),result__$1);
var G__133937__$1 = (cljs.core.truth_(explain_input)?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__133937,new cljs.core.Keyword("malli.core","explain-input","malli.core/explain-input",1441627811),explain_input):G__133937);
var G__133937__$2 = (cljs.core.truth_(explain_output)?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__133937__$1,new cljs.core.Keyword("malli.core","explain-output","malli.core/explain-output",-124321573),explain_output):G__133937__$1);
var G__133937__$3 = (cljs.core.truth_(explain_guard)?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__133937__$2,new cljs.core.Keyword("malli.core","explain-guard","malli.core/explain-guard",-1119572847),explain_guard):G__133937__$2);
if(cljs.core.truth_(cljs.core.ex_message(result__$1))){
return cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(cljs.core.update.cljs$core$IFn$_invoke$arity$3(G__133937__$3,new cljs.core.Keyword(null,"result","result",1415092211),cljs.core.ex_message),new cljs.core.Keyword(null,"result-data","result-data",-1724248844));
} else {
return G__133937__$3;
}
}
});
});
var pred__133938 = cljs.core._EQ_;
var expr__133939 = malli.core.type.cljs$core$IFn$_invoke$arity$1(schema);
if(cljs.core.truth_((pred__133938.cljs$core$IFn$_invoke$arity$2 ? pred__133938.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"=>","=>",1841166128),expr__133939) : pred__133938.call(null,new cljs.core.Keyword(null,"=>","=>",1841166128),expr__133939)))){
return check(schema);
} else {
if(cljs.core.truth_((pred__133938.cljs$core$IFn$_invoke$arity$2 ? pred__133938.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"function","function",-2127255473),expr__133939) : pred__133938.call(null,new cljs.core.Keyword(null,"function","function",-2127255473),expr__133939)))){
var checkers = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__133924_SHARP_){
return malli.generator.function_checker.cljs$core$IFn$_invoke$arity$2(p1__133924_SHARP_,options);
}),malli.core._children(schema));
return (function (x){
return cljs.core.seq(cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (p1__133925_SHARP_){
return (p1__133925_SHARP_.cljs$core$IFn$_invoke$arity$1 ? p1__133925_SHARP_.cljs$core$IFn$_invoke$arity$1(x) : p1__133925_SHARP_.call(null,x));
}),checkers));
});
} else {
return malli.core._fail_BANG_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("malli.generator","invalid-function-schema","malli.generator/invalid-function-schema",-1857583937),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"type","type",1174270348),malli.core._type(schema)], null));
}
}
}));

(malli.generator.function_checker.cljs$lang$maxFixedArity = 2);

malli.generator.check = (function malli$generator$check(var_args){
var G__133944 = arguments.length;
switch (G__133944) {
case 2:
return malli.generator.check.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return malli.generator.check.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(malli.generator.check.cljs$core$IFn$_invoke$arity$2 = (function (_QMARK_schema,f){
return malli.generator.check.cljs$core$IFn$_invoke$arity$3(_QMARK_schema,f,null);
}));

(malli.generator.check.cljs$core$IFn$_invoke$arity$3 = (function (_QMARK_schema,f,options){
var schema = malli.core.schema.cljs$core$IFn$_invoke$arity$2(_QMARK_schema,options);
return malli.core.explain.cljs$core$IFn$_invoke$arity$2(malli.core._update_options(schema,(function (p1__133941_SHARP_){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(p1__133941_SHARP_,new cljs.core.Keyword("malli.core","function-checker","malli.core/function-checker",-792030936),malli.generator.function_checker);
})),f);
}));

(malli.generator.check.cljs$lang$maxFixedArity = 3);


//# sourceMappingURL=malli.generator.js.map
