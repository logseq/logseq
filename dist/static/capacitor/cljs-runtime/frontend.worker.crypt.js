goog.provide('frontend.worker.crypt');
if((typeof frontend !== 'undefined') && (typeof frontend.worker !== 'undefined') && (typeof frontend.worker.crypt !== 'undefined') && (typeof frontend.worker.crypt.encoder !== 'undefined')){
} else {
frontend.worker.crypt.encoder = (new TextEncoder("utf-8"));
}
frontend.worker.crypt.string_EQ__GT_arraybuffer = (function frontend$worker$crypt$string_EQ__GT_arraybuffer(s){
return frontend.worker.crypt.encoder.encode(s);
});
/**
 * Return an arraybuffer
 */
frontend.worker.crypt._LT_rsa_encrypt = (function frontend$worker$crypt$_LT_rsa_encrypt(message,public_key){
if(typeof message === 'string'){
} else {
throw (new Error("Assert failed: (string? message)"));
}

var data = frontend.worker.crypt.string_EQ__GT_arraybuffer(message);
return crypto.subtle.encrypt(({"name": "RSA-OAEP"}),public_key,data);
});
if((typeof frontend !== 'undefined') && (typeof frontend.worker !== 'undefined') && (typeof frontend.worker.crypt !== 'undefined') && (typeof frontend.worker.crypt.key_algorithm !== 'undefined')){
} else {
frontend.worker.crypt.key_algorithm = ({"name": "RSA-OAEP", "modulusLength": (4096), "publicExponent": (new Uint8Array([(1),(0),(1)])), "hash": "SHA-256"});
}
frontend.worker.crypt._LT_gen_key_pair = (function frontend$worker$crypt$_LT_gen_key_pair(){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___48218__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(crypto.subtle.generateKey(frontend.worker.crypt.key_algorithm,true,["encrypt","decrypt"])),(function (result){
return promesa.protocols._promise(cljs.core.js__GT_clj.cljs$core$IFn$_invoke$arity$variadic(result,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"keywordize-keys","keywordize-keys",1310784252),true], 0)));
}));
}));
});
if((typeof frontend !== 'undefined') && (typeof frontend.worker !== 'undefined') && (typeof frontend.worker.crypt !== 'undefined') && (typeof frontend.worker.crypt.aes_key_algorithm !== 'undefined')){
} else {
frontend.worker.crypt.aes_key_algorithm = ({"name": "AES-GCM", "length": (256)});
}
frontend.worker.crypt._LT_gen_aes_key = (function frontend$worker$crypt$_LT_gen_aes_key(){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___48218__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(crypto.subtle.generateKey(frontend.worker.crypt.aes_key_algorithm,true,["encrypt","decrypt"])),(function (result){
return promesa.protocols._promise(cljs.core.js__GT_clj.cljs$core$IFn$_invoke$arity$variadic(result,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"keywordize-keys","keywordize-keys",1310784252),true], 0)));
}));
}));
});
frontend.worker.crypt._LT_export_key = (function frontend$worker$crypt$_LT_export_key(key_SINGLEQUOTE_){
if((key_SINGLEQUOTE_ instanceof CryptoKey)){
} else {
throw (new Error(["Assert failed: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(key_SINGLEQUOTE_),"\n","(instance? js/CryptoKey key')"].join('')));
}

return crypto.subtle.exportKey("jwk",key_SINGLEQUOTE_);
});
frontend.worker.crypt._LT_import_public_key = (function frontend$worker$crypt$_LT_import_public_key(jwk){
if((jwk instanceof Object)){
} else {
throw (new Error(["Assert failed: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(jwk),"\n","(instance? js/Object jwk)"].join('')));
}

return crypto.subtle.importKey("jwk",jwk,frontend.worker.crypt.key_algorithm,true,["encrypt"]);
});
frontend.worker.crypt._LT_import_private_key = (function frontend$worker$crypt$_LT_import_private_key(jwk){
if((jwk instanceof Object)){
} else {
throw (new Error(["Assert failed: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(jwk),"\n","(instance? js/Object jwk)"].join('')));
}

return crypto.subtle.importKey("jwk",jwk,frontend.worker.crypt.key_algorithm,true,["decrypt"]);
});
frontend.worker.crypt.store_graph_keys_jwk = (function frontend$worker$crypt$store_graph_keys_jwk(repo,aes_key_jwk){
var conn = frontend.worker.state.get_client_ops_conn(repo);
if((!((conn == null)))){
} else {
throw (new Error(["Assert failed: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(repo),"\n","(some? conn)"].join('')));
}

var aes_key_datom = cljs.core.first(datascript.core.datoms.cljs$core$IFn$_invoke$arity$3(cljs.core.deref(conn),new cljs.core.Keyword(null,"avet","avet",1383857032),new cljs.core.Keyword(null,"aes-key-jwk","aes-key-jwk",967413902)));
if((aes_key_datom == null)){
} else {
throw (new Error(["Assert failed: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(aes_key_datom),"\n","(nil? aes-key-datom)"].join('')));
}

var G__132308 = conn;
var G__132309 = new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","add","db/add",235286841),"e1",new cljs.core.Keyword(null,"aes-key-jwk","aes-key-jwk",967413902),aes_key_jwk], null)], null);
return (datascript.core.transact_BANG_.cljs$core$IFn$_invoke$arity$2 ? datascript.core.transact_BANG_.cljs$core$IFn$_invoke$arity$2(G__132308,G__132309) : datascript.core.transact_BANG_.call(null,G__132308,G__132309));
});
frontend.worker.crypt.get_graph_keys_jwk = (function frontend$worker$crypt$get_graph_keys_jwk(repo){
var conn = frontend.worker.state.get_client_ops_conn(repo);
if((!((conn == null)))){
} else {
throw (new Error(["Assert failed: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(repo),"\n","(some? conn)"].join('')));
}

var aes_key_datom = cljs.core.first(datascript.core.datoms.cljs$core$IFn$_invoke$arity$3(cljs.core.deref(conn),new cljs.core.Keyword(null,"avet","avet",1383857032),new cljs.core.Keyword(null,"aes-key-jwk","aes-key-jwk",967413902)));
return new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"aes-key-jwk","aes-key-jwk",967413902),new cljs.core.Keyword(null,"v","v",21465059).cljs$core$IFn$_invoke$arity$1(aes_key_datom)], null);
});
frontend.common.thread_api._STAR_thread_apis.cljs$core$IVolatile$_vreset_BANG_$arity$2(null,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(frontend.common.thread_api._STAR_thread_apis.cljs$core$IDeref$_deref$arity$1(null),new cljs.core.Keyword("thread-api","rtc-get-graph-keys","thread-api/rtc-get-graph-keys",1361272123),(function frontend$worker$crypt$thread_api__rtc_get_graph_keys(repo){
return frontend.worker.crypt.get_graph_keys_jwk(repo);
})));

//# sourceMappingURL=frontend.worker.crypt.js.map
