goog.provide('frontend.db.file_based.async');
frontend.db.file_based.async._LT_q = frontend.db.async.util._LT_q;
frontend.db.file_based.async._LT_file_based_get_all_properties = (function frontend$db$file_based$async$_LT_file_based_get_all_properties(graph){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((function (){var G__51000 = graph;
var G__51001 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"transact-db?","transact-db?",1279612399),false], null);
var G__51002 = new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"find","find",496279456),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?p","?p",-10896580,null),new cljs.core.Symbol(null,"...","...",-1926939749,null)], null),new cljs.core.Keyword(null,"where","where",-2044795965),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"_","_",-1201019570,null),new cljs.core.Keyword("block","properties","block/properties",708347145),new cljs.core.Symbol(null,"?p","?p",-10896580,null)], null)], null);
return (frontend.db.file_based.async._LT_q.cljs$core$IFn$_invoke$arity$3 ? frontend.db.file_based.async._LT_q.cljs$core$IFn$_invoke$arity$3(G__51000,G__51001,G__51002) : frontend.db.file_based.async._LT_q.call(null,G__51000,G__51001,G__51002));
})()),(function (properties){
return promesa.protocols._mcat(promesa.protocols._promise(cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (m){
return cljs.core.empty_QMARK_(m);
}),properties)),(function (properties__$1){
return promesa.protocols._promise(cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__50999_SHARP_){
return cljs.core.PersistentHashMap.fromArrays([new cljs.core.Keyword("block","title","block/title",710445684)],[p1__50999_SHARP_]);
}),cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.name,cljs.core.sort.cljs$core$IFn$_invoke$arity$1(cljs.core.distinct.cljs$core$IFn$_invoke$arity$1(cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core.concat,cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.keys,properties__$1)))))));
}));
}));
}));
});
/**
 * Given a property value's refs and full text, determines the value to
 *   autocomplete
 */
frontend.db.file_based.async.property_value_for_refs_and_text = (function frontend$db$file_based$async$property_value_for_refs_and_text(p__51006){
var vec__51007 = p__51006;
var refs = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__51007,(0),null);
var text = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__51007,(1),null);
if((((!(cljs.core.coll_QMARK_(refs)))) || (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2((1),cljs.core.count(refs))))){
return text;
} else {
return cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__51005_SHARP_){
if(clojure.string.includes_QMARK_(text,logseq.common.util.page_ref.__GT_page_ref(p1__51005_SHARP_))){
return logseq.common.util.page_ref.__GT_page_ref(p1__51005_SHARP_);
} else {
if(clojure.string.includes_QMARK_(text,["#",cljs.core.str.cljs$core$IFn$_invoke$arity$1(p1__51005_SHARP_)].join(''))){
return ["#",cljs.core.str.cljs$core$IFn$_invoke$arity$1(p1__51005_SHARP_)].join('');
} else {
return p1__51005_SHARP_;

}
}
}),refs);
}
});
frontend.db.file_based.async._LT_get_file_based_property_values = (function frontend$db$file_based$async$_LT_get_file_based_property_values(graph,property){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((function (){var G__51024 = graph;
var G__51025 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"transact-db?","transact-db?",1279612399),false], null);
var G__51026 = new cljs.core.PersistentVector(null, 11, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"find","find",496279456),new cljs.core.Symbol(null,"?property-val","?property-val",-1623962467,null),new cljs.core.Symbol(null,"?text-property-val","?text-property-val",-1877071407,null),new cljs.core.Keyword(null,"in","in",-1531184865),new cljs.core.Symbol(null,"$","$",-1580747756,null),new cljs.core.Symbol(null,"?property","?property",-192641124,null),new cljs.core.Keyword(null,"where","where",-2044795965),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?b","?b",1575118075,null),new cljs.core.Keyword("block","properties","block/properties",708347145),new cljs.core.Symbol(null,"?p","?p",-10896580,null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?b","?b",1575118075,null),new cljs.core.Keyword("block","properties-text-values","block/properties-text-values",1271244708),new cljs.core.Symbol(null,"?p2","?p2",2122867810,null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.list(new cljs.core.Symbol(null,"get","get",-971253014,null),new cljs.core.Symbol(null,"?p","?p",-10896580,null),new cljs.core.Symbol(null,"?property","?property",-192641124,null)),new cljs.core.Symbol(null,"?property-val","?property-val",-1623962467,null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.list(new cljs.core.Symbol(null,"get","get",-971253014,null),new cljs.core.Symbol(null,"?p2","?p2",2122867810,null),new cljs.core.Symbol(null,"?property","?property",-192641124,null)),new cljs.core.Symbol(null,"?text-property-val","?text-property-val",-1877071407,null)], null)], null);
var G__51027 = property;
return (frontend.db.file_based.async._LT_q.cljs$core$IFn$_invoke$arity$4 ? frontend.db.file_based.async._LT_q.cljs$core$IFn$_invoke$arity$4(G__51024,G__51025,G__51026,G__51027) : frontend.db.file_based.async._LT_q.call(null,G__51024,G__51025,G__51026,G__51027));
})()),(function (result){
return promesa.protocols._promise(cljs.core.sort.cljs$core$IFn$_invoke$arity$1(cljs.core.distinct.cljs$core$IFn$_invoke$arity$1(cljs.core.remove.cljs$core$IFn$_invoke$arity$2(clojure.string.blank_QMARK_,cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.str,cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core.concat,cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (x){
if(cljs.core.coll_QMARK_(x)){
return x;
} else {
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [x], null);
}
}),cljs.core.map.cljs$core$IFn$_invoke$arity$2(frontend.db.file_based.async.property_value_for_refs_and_text,result))))))));
}));
}));
});

//# sourceMappingURL=frontend.db.file_based.async.js.map
