goog.provide('sci.impl.callstack');
sci.impl.callstack.sci_ns_name = (function sci$impl$callstack$sci_ns_name(ns){
return ns.sci$impl$vars$HasName$getName$arity$1(null);
});
sci.impl.callstack.select = (function sci$impl$callstack$select(m){
var new_m = cljs.core.select_keys(m,new cljs.core.PersistentVector(null, 8, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"ns","ns",441598760),new cljs.core.Keyword(null,"name","name",1843675177),new cljs.core.Keyword(null,"local","local",-1497766724),new cljs.core.Keyword(null,"file","file",-1269645878),new cljs.core.Keyword(null,"line","line",212345235),new cljs.core.Keyword(null,"column","column",2078222095),new cljs.core.Keyword("sci","built-in","sci/built-in",1244659599),new cljs.core.Keyword(null,"macro","macro",-867863404)], null));
return new_m;
});
sci.impl.callstack.expr__GT_data = (function sci$impl$callstack$expr__GT_data(expr){
var m = (function (){var or__5002__auto__ = cljs.core.meta(expr);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return expr;
}
})();
var f = ((cljs.core.seqable_QMARK_(expr))?cljs.core.first(expr):null);
var fm = (function (){var or__5002__auto__ = new cljs.core.Keyword("sci.impl","f-meta","sci.impl/f-meta",-1735495322).cljs$core$IFn$_invoke$arity$1(m);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var G__85508 = f;
if((G__85508 == null)){
return null;
} else {
return cljs.core.meta(G__85508);
}
}
})();
var fm__$1 = ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"resolve-sym","resolve-sym",-1193683260),new cljs.core.Keyword("sci.impl","op","sci.impl/op",950953978).cljs$core$IFn$_invoke$arity$1(fm)))?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(fm,new cljs.core.Keyword(null,"ns","ns",441598760),new cljs.core.Keyword(null,"ns","ns",441598760).cljs$core$IFn$_invoke$arity$1(m)):fm);
return cljs.core.filter.cljs$core$IFn$_invoke$arity$2(cljs.core.not_empty,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [sci.impl.callstack.select(m),sci.impl.callstack.select(fm__$1)], null));
});
sci.impl.callstack.clean_ns = (function sci$impl$callstack$clean_ns(m){
var temp__5802__auto__ = new cljs.core.Keyword(null,"ns","ns",441598760).cljs$core$IFn$_invoke$arity$1(m);
if(cljs.core.truth_(temp__5802__auto__)){
var ns = temp__5802__auto__;
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(m,new cljs.core.Keyword(null,"ns","ns",441598760),sci.impl.callstack.sci_ns_name(ns));
} else {
return m;
}
});
sci.impl.callstack.stacktrace = (function sci$impl$callstack$stacktrace(callstack){
var callstack__$1 = cljs.core.deref(callstack);
var callstack__$2 = cljs.core.dedupe.cljs$core$IFn$_invoke$arity$1(callstack__$1);
var data = cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic(sci.impl.callstack.expr__GT_data,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([callstack__$2], 0));
var data__$1 = cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (p__85513,entry){
var vec__85514 = p__85513;
var acc = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__85514,(0),null);
var last_file = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__85514,(1),null);
var last_ns = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__85514,(2),null);
var last_name = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__85514,(3),null);
var new_last_name = (function (){var or__5002__auto__ = new cljs.core.Keyword(null,"name","name",1843675177).cljs$core$IFn$_invoke$arity$1(entry);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return last_name;
}
})();
var new_last_file = (function (){var or__5002__auto__ = new cljs.core.Keyword(null,"file","file",-1269645878).cljs$core$IFn$_invoke$arity$1(entry);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return last_file;
}
})();
var new_entry = (((last_ns === new cljs.core.Keyword(null,"ns","ns",441598760).cljs$core$IFn$_invoke$arity$1(entry)))?cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(entry,new cljs.core.Keyword(null,"name","name",1843675177),new_last_name,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"file","file",-1269645878),new_last_file], 0)):entry);
return new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.conj.cljs$core$IFn$_invoke$arity$2(acc,new_entry),new_last_file,new cljs.core.Keyword(null,"ns","ns",441598760).cljs$core$IFn$_invoke$arity$1(entry),new_last_name], null);
}),(function (){var fd = cljs.core.first(data);
return new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.List.EMPTY,new cljs.core.Keyword(null,"file","file",-1269645878).cljs$core$IFn$_invoke$arity$1(fd),new cljs.core.Keyword(null,"ns","ns",441598760).cljs$core$IFn$_invoke$arity$1(fd),new cljs.core.Keyword(null,"name","name",1843675177).cljs$core$IFn$_invoke$arity$1(fd)], null);
})(),data);
return cljs.core.mapv.cljs$core$IFn$_invoke$arity$2(sci.impl.callstack.clean_ns,cljs.core.first(data__$1));
});
sci.impl.callstack.right_pad = (function sci$impl$callstack$right_pad(s,n){
var n__$1 = (n - cljs.core.count(s));
return [cljs.core.str.cljs$core$IFn$_invoke$arity$1(s),clojure.string.join.cljs$core$IFn$_invoke$arity$1(cljs.core.repeat.cljs$core$IFn$_invoke$arity$2(n__$1," "))].join('');
});
sci.impl.callstack.format_stacktrace = (function sci$impl$callstack$format_stacktrace(st){
var st__$1 = cljs.core.force(st);
var data = cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (p__85521){
var map__85522 = p__85521;
var map__85522__$1 = cljs.core.__destructure_map(map__85522);
var nom = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__85522__$1,new cljs.core.Keyword(null,"name","name",1843675177));
var file = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__85522__$1,new cljs.core.Keyword(null,"file","file",-1269645878));
var ns = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__85522__$1,new cljs.core.Keyword(null,"ns","ns",441598760));
var line = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__85522__$1,new cljs.core.Keyword(null,"line","line",212345235));
var column = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__85522__$1,new cljs.core.Keyword(null,"column","column",2078222095));
var built_in = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__85522__$1,new cljs.core.Keyword("sci","built-in","sci/built-in",1244659599));
var local = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__85522__$1,new cljs.core.Keyword(null,"local","local",-1497766724));
if(cljs.core.truth_((function (){var or__5002__auto__ = line;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return built_in;
}
})())){
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"name","name",1843675177),[cljs.core.str.cljs$core$IFn$_invoke$arity$1((cljs.core.truth_(nom)?[cljs.core.str.cljs$core$IFn$_invoke$arity$1(ns),"/",cljs.core.str.cljs$core$IFn$_invoke$arity$1(nom)].join(''):ns)),(cljs.core.truth_(local)?["#",cljs.core.str.cljs$core$IFn$_invoke$arity$1(local)].join(''):null)].join(''),new cljs.core.Keyword(null,"loc","loc",-584284901),[cljs.core.str.cljs$core$IFn$_invoke$arity$1((function (){var or__5002__auto__ = file;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
if(cljs.core.truth_(built_in)){
return "<built-in>";
} else {
return "<expr>";
}
}
})()),(cljs.core.truth_(line)?[":",cljs.core.str.cljs$core$IFn$_invoke$arity$1(line),":",cljs.core.str.cljs$core$IFn$_invoke$arity$1(column)].join(''):null)].join('')], null);
} else {
return null;
}
}),st__$1);
var max_name = cljs.core.reduce.cljs$core$IFn$_invoke$arity$3(cljs.core.max,(0),cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.comp.cljs$core$IFn$_invoke$arity$2(cljs.core.count,new cljs.core.Keyword(null,"name","name",1843675177)),data));
return cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p__85528){
var map__85529 = p__85528;
var map__85529__$1 = cljs.core.__destructure_map(map__85529);
var name = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__85529__$1,new cljs.core.Keyword(null,"name","name",1843675177));
var loc = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__85529__$1,new cljs.core.Keyword(null,"loc","loc",-584284901));
return [sci.impl.callstack.right_pad(name,max_name)," - ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(loc)].join('');
}),data);
});

//# sourceMappingURL=sci.impl.callstack.js.map
