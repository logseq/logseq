goog.provide('frontend.storage');
frontend.storage.get = (function frontend$storage$get(key){
if(frontend.util.node_test_QMARK_){
return null;
} else {
return cljs.reader.read_string.cljs$core$IFn$_invoke$arity$1(localStorage.getItem(cljs.core.name(key)));
}
});
frontend.storage.set = (function frontend$storage$set(key,value){
if(cljs.core.truth_(cljs.spec.alpha._STAR_compile_asserts_STAR_)){
if(cljs.core.truth_(cljs.core.deref(new cljs.core.Var(function(){return cljs.spec.alpha._STAR_runtime_asserts_STAR_;},new cljs.core.Symbol("cljs.spec.alpha","*runtime-asserts*","cljs.spec.alpha/*runtime-asserts*",-1060443587,null),cljs.core.PersistentHashMap.fromArrays([new cljs.core.Keyword(null,"private","private",-558947994),new cljs.core.Keyword(null,"ns","ns",441598760),new cljs.core.Keyword(null,"name","name",1843675177),new cljs.core.Keyword(null,"file","file",-1269645878),new cljs.core.Keyword(null,"end-column","end-column",1425389514),new cljs.core.Keyword(null,"column","column",2078222095),new cljs.core.Keyword(null,"dynamic","dynamic",704819571),new cljs.core.Keyword(null,"line","line",212345235),new cljs.core.Keyword(null,"end-line","end-line",1837326455),new cljs.core.Keyword(null,"arglists","arglists",1661989754),new cljs.core.Keyword(null,"doc","doc",1913296891),new cljs.core.Keyword(null,"test","test",577538877)],[true,new cljs.core.Symbol(null,"cljs.spec.alpha","cljs.spec.alpha",505122844,null),new cljs.core.Symbol(null,"*runtime-asserts*","*runtime-asserts*",1632801956,null),"cljs/spec/alpha.cljs",(20),(1),true,(1480),(1482),cljs.core.List.EMPTY,null,(cljs.core.truth_(cljs.spec.alpha._STAR_runtime_asserts_STAR_)?cljs.spec.alpha._STAR_runtime_asserts_STAR_.cljs$lang$test:null)]))))){
cljs.spec.alpha.assert_STAR_(new cljs.core.Keyword("frontend.spec.storage","local-storage","frontend.spec.storage/local-storage",-1653431304),cljs.core.PersistentArrayMap.createAsIfByAssoc([cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(key),value]));
} else {
cljs.core.PersistentArrayMap.createAsIfByAssoc([cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(key),value]);
}
} else {
cljs.core.PersistentArrayMap.createAsIfByAssoc([cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(key),value]);
}

if(frontend.util.node_test_QMARK_){
return null;
} else {
return localStorage.setItem(cljs.core.name(key),cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([value], 0)));
}
});
frontend.storage.remove = (function frontend$storage$remove(key){
if(frontend.util.node_test_QMARK_){
return null;
} else {
return localStorage.removeItem(cljs.core.name(key));
}
});

//# sourceMappingURL=frontend.storage.js.map
