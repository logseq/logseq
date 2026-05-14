goog.provide('camel_snake_kebab.extras');
/**
 * Recursively transforms all map keys in coll with t.
 */
camel_snake_kebab.extras.transform_keys = (function camel_snake_kebab$extras$transform_keys(t,coll){
var transform = (function camel_snake_kebab$extras$transform_keys_$_transform(p__115842){
var vec__115843 = p__115842;
var k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__115843,(0),null);
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__115843,(1),null);
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [(t.cljs$core$IFn$_invoke$arity$1 ? t.cljs$core$IFn$_invoke$arity$1(k) : t.call(null,k)),v], null);
});
return clojure.walk.postwalk((function (x){
if(cljs.core.map_QMARK_(x)){
return cljs.core.with_meta(cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,cljs.core.map.cljs$core$IFn$_invoke$arity$2(transform,x)),cljs.core.meta(x));
} else {
return x;
}
}),coll);
});

//# sourceMappingURL=camel_snake_kebab.extras.js.map
