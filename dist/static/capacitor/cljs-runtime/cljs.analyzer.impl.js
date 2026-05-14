goog.provide('cljs.analyzer.impl');
cljs.analyzer.impl.ANY_SYM = new cljs.core.Symbol(null,"any","any",-948528346,null);
cljs.analyzer.impl.BOOLEAN_OR_SEQ = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Symbol(null,"seq","seq",-177272256,null),"null",new cljs.core.Symbol(null,"boolean","boolean",-278886877,null),"null"], null), null);
cljs.analyzer.impl.BOOLEAN_SYM = new cljs.core.Symbol(null,"boolean","boolean",-278886877,null);
cljs.analyzer.impl.CLJ_NIL_SYM = new cljs.core.Symbol(null,"clj-nil","clj-nil",1321798654,null);
cljs.analyzer.impl.CLJS_CORE_MACROS_SYM = new cljs.core.Symbol(null,"cljs.core$macros","cljs.core$macros",-2057787548,null);
cljs.analyzer.impl.CLJS_CORE_SYM = new cljs.core.Symbol(null,"cljs.core","cljs.core",770546058,null);
cljs.analyzer.impl.DOT_SYM = new cljs.core.Symbol(null,".",".",1975675962,null);
cljs.analyzer.impl.IGNORE_SYM = new cljs.core.Symbol(null,"ignore","ignore",8989494,null);
cljs.analyzer.impl.JS_STAR_SYM = new cljs.core.Symbol(null,"js*","js*",-1134233646,null);
cljs.analyzer.impl.NEW_SYM = new cljs.core.Symbol(null,"new","new",-444906321,null);
cljs.analyzer.impl.NOT_NATIVE = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Symbol(null,"clj","clj",980036099,null),"null",new cljs.core.Symbol(null,"not-native","not-native",-236392494,null),"null"], null), null);
cljs.analyzer.impl.NUMBER_SYM = new cljs.core.Symbol(null,"number","number",-1084057331,null);
cljs.analyzer.impl.STRING_SYM = new cljs.core.Symbol(null,"string","string",-349010059,null);
cljs.analyzer.impl.cljs_map_QMARK_ = (function cljs$analyzer$impl$cljs_map_QMARK_(x){
if((!((x == null)))){
if((((x.cljs$lang$protocol_mask$partition0$ & (1024))) || ((cljs.core.PROTOCOL_SENTINEL === x.cljs$core$IMap$)))){
return true;
} else {
return false;
}
} else {
return false;
}
});
cljs.analyzer.impl.cljs_seq_QMARK_ = (function cljs$analyzer$impl$cljs_seq_QMARK_(x){
if((!((x == null)))){
if((((x.cljs$lang$protocol_mask$partition0$ & (64))) || ((cljs.core.PROTOCOL_SENTINEL === x.cljs$core$ISeq$)))){
return true;
} else {
return false;
}
} else {
return false;
}
});
cljs.analyzer.impl.cljs_vector_QMARK_ = (function cljs$analyzer$impl$cljs_vector_QMARK_(x){
if((!((x == null)))){
if((((x.cljs$lang$protocol_mask$partition0$ & (16384))) || ((cljs.core.PROTOCOL_SENTINEL === x.cljs$core$IVector$)))){
return true;
} else {
return false;
}
} else {
return false;
}
});
cljs.analyzer.impl.cljs_set_QMARK_ = (function cljs$analyzer$impl$cljs_set_QMARK_(x){
if((!((x == null)))){
if((((x.cljs$lang$protocol_mask$partition0$ & (4096))) || ((cljs.core.PROTOCOL_SENTINEL === x.cljs$core$ISet$)))){
return true;
} else {
return false;
}
} else {
return false;
}
});

//# sourceMappingURL=cljs.analyzer.impl.js.map
