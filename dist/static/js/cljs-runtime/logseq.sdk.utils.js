goog.provide('logseq.sdk.utils');
goog.scope(function(){
  logseq.sdk.utils.goog$module$goog$object = goog.module.get('goog.object');
});
logseq.sdk.utils.keep_json_keyword_QMARK_ = (function logseq$sdk$utils$keep_json_keyword_QMARK_(k){
var G__131259 = cljs.core.namespace(k);
var G__131259__$1 = (((G__131259 == null))?null:cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 3, ["block",null,"db",null,"file",null], null), null),G__131259));
if((G__131259__$1 == null)){
return null;
} else {
return cljs.core.not(G__131259__$1);
}
});
/**
 * Convert a db Entity to a map
 */
logseq.sdk.utils.entity__GT_map = (function logseq$sdk$utils$entity__GT_map(e){
if(datascript.impl.entity.entity_QMARK_(e)){
} else {
throw (new Error("Assert failed: (de/entity? e)"));
}

return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,e),new cljs.core.Keyword("db","id","db/id",-1388397098),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(e));
});
logseq.sdk.utils.normalize_keyword_for_json = (function logseq$sdk$utils$normalize_keyword_for_json(var_args){
var G__131263 = arguments.length;
switch (G__131263) {
case 1:
return logseq.sdk.utils.normalize_keyword_for_json.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return logseq.sdk.utils.normalize_keyword_for_json.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(logseq.sdk.utils.normalize_keyword_for_json.cljs$core$IFn$_invoke$arity$1 = (function (input){
return logseq.sdk.utils.normalize_keyword_for_json.cljs$core$IFn$_invoke$arity$2(input,true);
}));

(logseq.sdk.utils.normalize_keyword_for_json.cljs$core$IFn$_invoke$arity$2 = (function (input,camel_case_QMARK_){
if(cljs.core.truth_(input)){
var input__$1 = ((datascript.impl.entity.entity_QMARK_(input))?logseq.sdk.utils.entity__GT_map(input):((cljs.core.sequential_QMARK_(input))?cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__131261_SHARP_){
if(datascript.impl.entity.entity_QMARK_(p1__131261_SHARP_)){
return logseq.sdk.utils.entity__GT_map(p1__131261_SHARP_);
} else {
return p1__131261_SHARP_;
}
}),input):input
));
return clojure.walk.prewalk((function (a){
if((a instanceof cljs.core.Keyword)){
if(cljs.core.truth_(logseq.sdk.utils.keep_json_keyword_QMARK_(a))){
return cljs.core.str.cljs$core$IFn$_invoke$arity$1(a);
} else {
var G__131264 = cljs.core.name(a);
if(cljs.core.truth_(camel_case_QMARK_)){
return camel_snake_kebab.core.__GT_camelCase(G__131264);
} else {
return G__131264;
}
}
} else {
if(cljs.core.uuid_QMARK_(a)){
return cljs.core.str.cljs$core$IFn$_invoke$arity$1(a);
} else {
if(cljs.core.truth_((function (){var and__5000__auto__ = cljs.core.map_QMARK_(a);
if(and__5000__auto__){
return new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(a);
} else {
return and__5000__auto__;
}
})())){
var or__5002__auto__ = (function (){var G__131265 = new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(a);
if((G__131265 == null)){
return null;
} else {
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(a,new cljs.core.Keyword("block","content","block/content",-161885195),G__131265);
}
})();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return a;
}
} else {
return a;

}
}
}
}),input__$1);
} else {
return null;
}
}));

(logseq.sdk.utils.normalize_keyword_for_json.cljs$lang$maxFixedArity = 2);

logseq.sdk.utils.uuid_or_throw_error = (function logseq$sdk$utils$uuid_or_throw_error(s){
if(cljs.core.uuid_QMARK_(s)){
return s;
} else {
if(cljs.core.truth_((frontend.util.uuid_string_QMARK_.cljs$core$IFn$_invoke$arity$1 ? frontend.util.uuid_string_QMARK_.cljs$core$IFn$_invoke$arity$1(s) : frontend.util.uuid_string_QMARK_.call(null,s)))){
return cljs.core.uuid(s);
} else {
throw (new Error([cljs.core.str.cljs$core$IFn$_invoke$arity$1(s)," is not a valid UUID string."].join('')));

}
}
});
logseq.sdk.utils.jsx__GT_clj = (function logseq$sdk$utils$jsx__GT_clj(obj){
if(cljs.core.truth_(goog.isObject(obj))){
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (result,k){
var v = logseq.sdk.utils.goog$module$goog$object.get(obj,k);
var k__$1 = cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(camel_snake_kebab.core.__GT_kebab_case(k));
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("function",goog.typeOf(v))){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(result,k__$1,v);
} else {
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(result,k__$1,(logseq.sdk.utils.jsx__GT_clj.cljs$core$IFn$_invoke$arity$1 ? logseq.sdk.utils.jsx__GT_clj.cljs$core$IFn$_invoke$arity$1(v) : logseq.sdk.utils.jsx__GT_clj.call(null,v)));
}
}),cljs.core.PersistentArrayMap.EMPTY,logseq.sdk.utils.goog$module$goog$object.getKeys(obj));
} else {
return obj;
}
});
logseq.sdk.utils.to_clj = cljs_bean.core.__GT_clj;
goog.exportSymbol('logseq.sdk.utils.to_clj', logseq.sdk.utils.to_clj);
logseq.sdk.utils.jsx_to_clj = logseq.sdk.utils.jsx__GT_clj;
goog.exportSymbol('logseq.sdk.utils.jsx_to_clj', logseq.sdk.utils.jsx_to_clj);
logseq.sdk.utils.to_js = cljs_bean.core.__GT_js;
goog.exportSymbol('logseq.sdk.utils.to_js', logseq.sdk.utils.to_js);
logseq.sdk.utils.to_keyword = cljs.core.keyword;
goog.exportSymbol('logseq.sdk.utils.to_keyword', logseq.sdk.utils.to_keyword);
logseq.sdk.utils.to_symbol = cljs.core.symbol;
goog.exportSymbol('logseq.sdk.utils.to_symbol', logseq.sdk.utils.to_symbol);

//# sourceMappingURL=logseq.sdk.utils.js.map
