goog.provide('frontend.idb');
var module$frontend$idbkv=shadow.js.require("module$frontend$idbkv", {});
if((typeof frontend !== 'undefined') && (typeof frontend.idb !== 'undefined') && (typeof frontend.idb.store !== 'undefined')){
} else {
frontend.idb.store = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(null);
}
frontend.idb.remove_item_BANG_ = (function frontend$idb$remove_item_BANG_(key){
if(cljs.core.truth_((function (){var and__5000__auto__ = key;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.deref(frontend.idb.store);
} else {
return and__5000__auto__;
}
})())){
return module$frontend$idbkv.del(key,cljs.core.deref(frontend.idb.store));
} else {
return null;
}
});
frontend.idb.set_item_BANG_ = (function frontend$idb$set_item_BANG_(key,value){
if(cljs.core.truth_((function (){var and__5000__auto__ = key;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.deref(frontend.idb.store);
} else {
return and__5000__auto__;
}
})())){
return module$frontend$idbkv.set(key,value,cljs.core.deref(frontend.idb.store));
} else {
return null;
}
});
frontend.idb.get_item = (function frontend$idb$get_item(key){
if(cljs.core.truth_((function (){var and__5000__auto__ = key;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.deref(frontend.idb.store);
} else {
return and__5000__auto__;
}
})())){
return module$frontend$idbkv.get(key,cljs.core.deref(frontend.idb.store));
} else {
return null;
}
});
frontend.idb.get_keys = (function frontend$idb$get_keys(){
if(cljs.core.truth_(cljs.core.deref(frontend.idb.store))){
return module$frontend$idbkv.keys(cljs.core.deref(frontend.idb.store));
} else {
return null;
}
});
frontend.idb.get_nfs_dbs = (function frontend$idb$get_nfs_dbs(){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.idb.get_keys()),(function (ks){
return promesa.protocols._promise(cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__49507_SHARP_){
return clojure.string.replace_first(p1__49507_SHARP_,frontend.config.idb_db_prefix,"");
}),cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (k){
return clojure.string.starts_with_QMARK_(k,[frontend.config.idb_db_prefix,frontend.config.local_db_prefix].join(''));
}),ks)));
}));
}));
});
frontend.idb.clear_local_db_BANG_ = (function frontend$idb$clear_local_db_BANG_(repo){
if(cljs.core.truth_(repo)){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.idb.get_keys()),(function (ks){
return promesa.protocols._mcat(promesa.protocols._promise(cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (k){
return clojure.string.starts_with_QMARK_(k,[frontend.config.local_handle,"/",cljs.core.str.cljs$core$IFn$_invoke$arity$1(repo)].join(''));
}),ks)),(function (ks__$1){
return promesa.protocols._promise(((cljs.core.seq(ks__$1))?promesa.core.all(cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (key){
return frontend.idb.remove_item_BANG_(key);
}),ks__$1)):null));
}));
}));
}));
} else {
return null;
}
});
/**
 * This component's only responsibility is to create a Store object
 */
frontend.idb.start = (function frontend$idb$start(){
if((cljs.core.deref(frontend.idb.store) == null)){
return cljs.core.reset_BANG_(frontend.idb.store,module$frontend$idbkv.newStore("localforage","keyvaluepairs",(2)));
} else {
return null;
}
});

//# sourceMappingURL=frontend.idb.js.map
