goog.provide('shadow.json');
goog.scope(function(){
  shadow.json.goog$module$goog$object = goog.module.get('goog.object');
});
/**
 * simplified js->clj for JSON data, :key-fn default to keyword
 */
shadow.json.to_clj = (function shadow$json$to_clj(var_args){
var G__33223 = arguments.length;
switch (G__33223) {
case 1:
return shadow.json.to_clj.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return shadow.json.to_clj.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(shadow.json.to_clj.cljs$core$IFn$_invoke$arity$1 = (function (x){
return shadow.json.to_clj.cljs$core$IFn$_invoke$arity$2(x,cljs.core.PersistentArrayMap.EMPTY);
}));

(shadow.json.to_clj.cljs$core$IFn$_invoke$arity$2 = (function (x,opts){
if((x == null)){
return x;
} else {
if(typeof x === 'number'){
return x;
} else {
if(typeof x === 'string'){
return x;
} else {
if(cljs.core.boolean_QMARK_(x)){
return x;
} else {
if(cljs.core.array_QMARK_(x)){
return cljs.core.into.cljs$core$IFn$_invoke$arity$3(cljs.core.PersistentVector.EMPTY,cljs.core.map.cljs$core$IFn$_invoke$arity$1((function (p1__33218_SHARP_){
return shadow.json.to_clj.cljs$core$IFn$_invoke$arity$2(p1__33218_SHARP_,opts);
})),cljs.core.array_seq.cljs$core$IFn$_invoke$arity$1(x));
} else {
var key_fn = cljs.core.get.cljs$core$IFn$_invoke$arity$3(opts,new cljs.core.Keyword(null,"key-fn","key-fn",-636154479),cljs.core.keyword);
return cljs.core.persistent_BANG_(cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (result,key){
var value = shadow.json.goog$module$goog$object.get(x,key);
return cljs.core.assoc_BANG_.cljs$core$IFn$_invoke$arity$3(result,((typeof key === 'string')?(key_fn.cljs$core$IFn$_invoke$arity$1 ? key_fn.cljs$core$IFn$_invoke$arity$1(key) : key_fn.call(null,key)):shadow.json.to_clj.cljs$core$IFn$_invoke$arity$2(key,opts)),shadow.json.to_clj.cljs$core$IFn$_invoke$arity$2(value,opts));
}),cljs.core.transient$(cljs.core.PersistentArrayMap.EMPTY),shadow.json.goog$module$goog$object.getKeys(x)));

}
}
}
}
}
}));

(shadow.json.to_clj.cljs$lang$maxFixedArity = 2);

shadow.json.read_str = (function shadow$json$read_str(str,opts){
return shadow.json.to_clj.cljs$core$IFn$_invoke$arity$2(JSON.parse(str),opts);
});
shadow.json.write_str = (function shadow$json$write_str(obj){
return JSON.stringify(cljs.core.clj__GT_js(obj));
});

//# sourceMappingURL=shadow.json.js.map
