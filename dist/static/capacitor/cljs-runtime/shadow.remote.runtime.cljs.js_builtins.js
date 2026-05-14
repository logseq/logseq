goog.provide('shadow.remote.runtime.cljs.js_builtins');
goog.scope(function(){
  shadow.remote.runtime.cljs.js_builtins.goog$module$goog$object = goog.module.get('goog.object');
});
(clojure.core.protocols.Datafiable["object"] = true);

(clojure.core.protocols.datafy["object"] = (function (o){
if((!((o.__proto__ === Object.prototype)))){
return o;
} else {
return cljs.core.with_meta(cljs.core.persistent_BANG_(cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (m,key){
return cljs.core.assoc_BANG_.cljs$core$IFn$_invoke$arity$3(m,key,shadow.remote.runtime.cljs.js_builtins.goog$module$goog$object.get(o,key));
}),cljs.core.transient$(cljs.core.PersistentArrayMap.EMPTY),shadow.remote.runtime.cljs.js_builtins.goog$module$goog$object.getKeys(o))),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Symbol("clojure.core.protocols","nav","clojure.core.protocols/nav",298936762,null),(function (coll,k,v){
return shadow.remote.runtime.cljs.js_builtins.goog$module$goog$object.get(o,k);
})], null));
}
}));

(clojure.core.protocols.Datafiable["array"] = true);

(clojure.core.protocols.datafy["array"] = (function (o){
return cljs.core.vec(o);
}));

(Error.prototype.clojure$core$protocols$Datafiable$ = cljs.core.PROTOCOL_SENTINEL);

(Error.prototype.clojure$core$protocols$Datafiable$datafy$arity$1 = (function (e){
var e__$1 = this;
var data = cljs.core.ex_data(e__$1);
var file = e__$1.fileName;
var line = e__$1.lineNumber;
var column = e__$1.columnNumber;
var G__38277 = new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"message","message",-406056002),e__$1.message,new cljs.core.Keyword(null,"name","name",1843675177),e__$1.name,new cljs.core.Keyword(null,"stack","stack",-793405930),e__$1.stack], null);
var G__38277__$1 = (((!((data == null))))?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__38277,new cljs.core.Keyword(null,"data","data",-232669377),data):G__38277);
var G__38277__$2 = (cljs.core.truth_(file)?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__38277__$1,new cljs.core.Keyword(null,"file","file",-1269645878),file):G__38277__$1);
var G__38277__$3 = (cljs.core.truth_(line)?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__38277__$2,new cljs.core.Keyword(null,"line","line",212345235),line):G__38277__$2);
if(cljs.core.truth_(column)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__38277__$3,new cljs.core.Keyword(null,"column","column",2078222095),column);
} else {
return G__38277__$3;
}
}));

//# sourceMappingURL=shadow.remote.runtime.cljs.js_builtins.js.map
