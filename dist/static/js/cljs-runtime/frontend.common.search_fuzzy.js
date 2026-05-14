goog.provide('frontend.common.search_fuzzy');
var module$node_modules$remove_accents$index=shadow.js.require("module$node_modules$remove_accents$index", {});
frontend.common.search_fuzzy.MAX_STRING_LENGTH = 1000.0;
frontend.common.search_fuzzy.clean_str = (function frontend$common$search_fuzzy$clean_str(s){
return clojure.string.lower_case(clojure.string.replace(clojure.string.lower_case(s),/[\[ \\\/_\]\(\)]+/,""));
});
frontend.common.search_fuzzy.char_array = (function frontend$common$search_fuzzy$char_array(s){
return cljs_bean.core.__GT_js(cljs.core.seq(s));
});
frontend.common.search_fuzzy.str_len_distance = (function frontend$common$search_fuzzy$str_len_distance(s1,s2){
var c1 = cljs.core.count(s1);
var c2 = cljs.core.count(s2);
var maxed = (function (){var x__5087__auto__ = c1;
var y__5088__auto__ = c2;
return ((x__5087__auto__ > y__5088__auto__) ? x__5087__auto__ : y__5088__auto__);
})();
var mined = (function (){var x__5090__auto__ = c1;
var y__5091__auto__ = c2;
return ((x__5090__auto__ < y__5091__auto__) ? x__5090__auto__ : y__5091__auto__);
})();
return ((1) - ((maxed - mined) / maxed));
});
frontend.common.search_fuzzy.score = (function frontend$common$search_fuzzy$score(oquery,ostr){
var query = frontend.common.search_fuzzy.clean_str(oquery);
var original_s = frontend.common.search_fuzzy.clean_str(ostr);
var q = cljs.core.seq(frontend.common.search_fuzzy.char_array(query));
var s = cljs.core.seq(frontend.common.search_fuzzy.char_array(original_s));
var mult = (1);
var idx = frontend.common.search_fuzzy.MAX_STRING_LENGTH;
var score_SINGLEQUOTE_ = (0);
while(true){
if(cljs.core.empty_QMARK_(q)){
return (((score_SINGLEQUOTE_ + frontend.common.search_fuzzy.str_len_distance(query,original_s)) + ((clojure.string.starts_with_QMARK_(original_s,query))?(frontend.common.search_fuzzy.MAX_STRING_LENGTH + (10)):((((0) <= original_s.indexOf(query)))?frontend.common.search_fuzzy.MAX_STRING_LENGTH:((((0) <= original_s.indexOf(query)))?(frontend.common.search_fuzzy.MAX_STRING_LENGTH - 0.1):(0)
)))) + ((cljs.core.empty_QMARK_(s))?(1):(0)));
} else {
if(cljs.core.empty_QMARK_(s)){
return (0);
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.first(q),cljs.core.first(s))){
var G__68783 = cljs.core.rest(q);
var G__68784 = cljs.core.rest(s);
var G__68785 = (mult + (1));
var G__68786 = (idx - (1));
var G__68787 = (mult + score_SINGLEQUOTE_);
q = G__68783;
s = G__68784;
mult = G__68785;
idx = G__68786;
score_SINGLEQUOTE_ = G__68787;
continue;
} else {
var G__68788 = q;
var G__68789 = cljs.core.rest(s);
var G__68790 = (1);
var G__68791 = (idx - (1));
var G__68792 = (score_SINGLEQUOTE_ - 0.1);
q = G__68788;
s = G__68789;
mult = G__68790;
idx = G__68791;
score_SINGLEQUOTE_ = G__68792;
continue;
}

}
}
break;
}
});
/**
 * Normalize string for searching (loose)
 */
frontend.common.search_fuzzy.search_normalize = (function frontend$common$search_fuzzy$search_normalize(s,remove_accents_QMARK_){
if(cljs.core.truth_(s)){
var normalize_str = clojure.string.lower_case(s).normalize("NFKC");
if(cljs.core.truth_(remove_accents_QMARK_)){
return module$node_modules$remove_accents$index(normalize_str);
} else {
return normalize_str;
}
} else {
return null;
}
});
frontend.common.search_fuzzy.fuzzy_search = (function frontend$common$search_fuzzy$fuzzy_search(var_args){
var args__5732__auto__ = [];
var len__5726__auto___68794 = arguments.length;
var i__5727__auto___68795 = (0);
while(true){
if((i__5727__auto___68795 < len__5726__auto___68794)){
args__5732__auto__.push((arguments[i__5727__auto___68795]));

var G__68796 = (i__5727__auto___68795 + (1));
i__5727__auto___68795 = G__68796;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((2) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((2)),(0),null)):null);
return frontend.common.search_fuzzy.fuzzy_search.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),(arguments[(1)]),argseq__5733__auto__);
});

(frontend.common.search_fuzzy.fuzzy_search.cljs$core$IFn$_invoke$arity$variadic = (function (data,query,p__68716){
var map__68717 = p__68716;
var map__68717__$1 = cljs.core.__destructure_map(map__68717);
var limit = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__68717__$1,new cljs.core.Keyword(null,"limit","limit",-1355822363),(20));
var extract_fn = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__68717__$1,new cljs.core.Keyword(null,"extract-fn","extract-fn",-339752723));
var query__$1 = frontend.common.search_fuzzy.search_normalize(query,true);
return cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"data","data",-232669377),cljs.core.take.cljs$core$IFn$_invoke$arity$2(limit,cljs.core.sort_by.cljs$core$IFn$_invoke$arity$3(new cljs.core.Keyword(null,"score","score",-1963588780),cljs.core.comp.cljs$core$IFn$_invoke$arity$2(cljs.core._,cljs.core.compare),cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (p1__68698_SHARP_){
return ((0) < new cljs.core.Keyword(null,"score","score",-1963588780).cljs$core$IFn$_invoke$arity$1(p1__68698_SHARP_));
}),(function (){var iter__5480__auto__ = (function frontend$common$search_fuzzy$iter__68723(s__68724){
return (new cljs.core.LazySeq(null,(function (){
var s__68724__$1 = s__68724;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__68724__$1);
if(temp__5804__auto__){
var s__68724__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__68724__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__68724__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__68726 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__68725 = (0);
while(true){
if((i__68725 < size__5479__auto__)){
var item = cljs.core._nth(c__5478__auto__,i__68725);
cljs.core.chunk_append(b__68726,(function (){var s = cljs.core.str.cljs$core$IFn$_invoke$arity$1((cljs.core.truth_(extract_fn)?(extract_fn.cljs$core$IFn$_invoke$arity$1 ? extract_fn.cljs$core$IFn$_invoke$arity$1(item) : extract_fn.call(null,item)):item));
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"data","data",-232669377),item,new cljs.core.Keyword(null,"score","score",-1963588780),frontend.common.search_fuzzy.score(query__$1,frontend.common.search_fuzzy.search_normalize(s,true))], null);
})());

var G__68802 = (i__68725 + (1));
i__68725 = G__68802;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__68726),frontend$common$search_fuzzy$iter__68723(cljs.core.chunk_rest(s__68724__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__68726),null);
}
} else {
var item = cljs.core.first(s__68724__$2);
return cljs.core.cons((function (){var s = cljs.core.str.cljs$core$IFn$_invoke$arity$1((cljs.core.truth_(extract_fn)?(extract_fn.cljs$core$IFn$_invoke$arity$1 ? extract_fn.cljs$core$IFn$_invoke$arity$1(item) : extract_fn.call(null,item)):item));
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"data","data",-232669377),item,new cljs.core.Keyword(null,"score","score",-1963588780),frontend.common.search_fuzzy.score(query__$1,frontend.common.search_fuzzy.search_normalize(s,true))], null);
})(),frontend$common$search_fuzzy$iter__68723(cljs.core.rest(s__68724__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(data);
})()))));
}));

(frontend.common.search_fuzzy.fuzzy_search.cljs$lang$maxFixedArity = (2));

/** @this {Function} */
(frontend.common.search_fuzzy.fuzzy_search.cljs$lang$applyTo = (function (seq68699){
var G__68700 = cljs.core.first(seq68699);
var seq68699__$1 = cljs.core.next(seq68699);
var G__68701 = cljs.core.first(seq68699__$1);
var seq68699__$2 = cljs.core.next(seq68699__$1);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__68700,G__68701,seq68699__$2);
}));


//# sourceMappingURL=frontend.common.search_fuzzy.js.map
