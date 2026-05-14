goog.provide('frontend.worker.db_metadata');
var module$frontend$idbkv=shadow.js.require("module$frontend$idbkv", {});
if((typeof frontend !== 'undefined') && (typeof frontend.worker !== 'undefined') && (typeof frontend.worker.db_metadata !== 'undefined') && (typeof frontend.worker.db_metadata.store !== 'undefined')){
} else {
frontend.worker.db_metadata.store = (new cljs.core.Delay((function (){
return module$frontend$idbkv.newStore("localforage","keyvaluepairs",(2));
}),null));
}
frontend.worker.db_metadata.gen_key = (function frontend$worker$db_metadata$gen_key(repo){
return ["metadata###",cljs.core.str.cljs$core$IFn$_invoke$arity$1(repo)].join('');
});
frontend.worker.db_metadata._LT_store = (function frontend$worker$db_metadata$_LT_store(repo,metadata_str){
return module$frontend$idbkv.set(frontend.worker.db_metadata.gen_key(repo),metadata_str,cljs.core.deref(frontend.worker.db_metadata.store));
});
frontend.worker.db_metadata._LT_get = (function frontend$worker$db_metadata$_LT_get(repo){
return module$frontend$idbkv.get(frontend.worker.db_metadata.gen_key(repo),cljs.core.deref(frontend.worker.db_metadata.store));
});

//# sourceMappingURL=frontend.worker.db_metadata.js.map
