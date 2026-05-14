goog.provide('sci.impl.parser');
sci.impl.parser.eof = new cljs.core.Keyword("sci.impl.parser.edamame","eof","sci.impl.parser.edamame/eof",-917261517);
sci.impl.parser.read_eval = sci.impl.vars.new_var.cljs$core$IFn$_invoke$arity$3(new cljs.core.Symbol(null,"*read-eval","*read-eval",-538712777,null),true,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"ns","ns",441598760),sci.impl.vars.clojure_core_ns,new cljs.core.Keyword(null,"dynamic","dynamic",704819571),true], null));
sci.impl.parser.data_readers = sci.impl.vars.new_var.cljs$core$IFn$_invoke$arity$3(new cljs.core.Symbol(null,"*default-data-reader-fn*","*default-data-reader-fn*",758795499,null),cljs.core.PersistentArrayMap.EMPTY,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"ns","ns",441598760),sci.impl.vars.clojure_core_ns,new cljs.core.Keyword(null,"dynamic","dynamic",704819571),true], null));
sci.impl.parser.default_data_reader_fn = sci.impl.vars.new_var.cljs$core$IFn$_invoke$arity$3(new cljs.core.Symbol(null,"*default-data-reader-fn*","*default-data-reader-fn*",758795499,null),null,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"ns","ns",441598760),sci.impl.vars.clojure_core_ns,new cljs.core.Keyword(null,"dynamic","dynamic",704819571),true], null));
sci.impl.parser.reader_resolver = sci.impl.vars.new_var.cljs$core$IFn$_invoke$arity$3(new cljs.core.Symbol(null,"*reader-resolver*","*reader-resolver*",309718590,null),null,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"ns","ns",441598760),sci.impl.vars.clojure_core_ns,new cljs.core.Keyword(null,"dynamic","dynamic",704819571),true], null));
sci.impl.parser.default_opts = edamame.core.normalize_opts(new cljs.core.PersistentArrayMap(null, 7, [new cljs.core.Keyword(null,"all","all",892129742),true,new cljs.core.Keyword(null,"read-eval","read-eval",1788733932),false,new cljs.core.Keyword(null,"row-key","row-key",-1189010712),new cljs.core.Keyword(null,"line","line",212345235),new cljs.core.Keyword(null,"col-key","col-key",-2009675766),new cljs.core.Keyword(null,"column","column",2078222095),new cljs.core.Keyword(null,"read-cond","read-cond",1056899244),new cljs.core.Keyword(null,"allow","allow",-1857325745),new cljs.core.Keyword(null,"location?","location?",425878086),cljs.core.seq_QMARK_,new cljs.core.Keyword(null,"end-location","end-location",-1199449467),false], null));
sci.impl.parser.var__GT_sym = (function sci$impl$parser$var__GT_sym(v){
var temp__5804__auto__ = cljs.core.meta(v);
if(cljs.core.truth_(temp__5804__auto__)){
var m = temp__5804__auto__;
var temp__5804__auto____$1 = new cljs.core.Keyword(null,"name","name",1843675177).cljs$core$IFn$_invoke$arity$1(m);
if(cljs.core.truth_(temp__5804__auto____$1)){
var var_name = temp__5804__auto____$1;
var temp__5804__auto____$2 = new cljs.core.Keyword(null,"ns","ns",441598760).cljs$core$IFn$_invoke$arity$1(m);
if(cljs.core.truth_(temp__5804__auto____$2)){
var ns = temp__5804__auto____$2;
return cljs.core.symbol.cljs$core$IFn$_invoke$arity$2(cljs.core.str.cljs$core$IFn$_invoke$arity$1(sci.impl.vars.getName(ns)),cljs.core.str.cljs$core$IFn$_invoke$arity$1(var_name));
} else {
return null;
}
} else {
return null;
}
} else {
return null;
}
});
sci.impl.parser.fully_qualify = (function sci$impl$parser$fully_qualify(ctx,sym){
var env = cljs.core.deref(new cljs.core.Keyword(null,"env","env",-1815813235).cljs$core$IFn$_invoke$arity$1(ctx));
var sym_ns = (function (){var temp__5804__auto__ = cljs.core.namespace(sym);
if(cljs.core.truth_(temp__5804__auto__)){
var n = temp__5804__auto__;
return cljs.core.symbol.cljs$core$IFn$_invoke$arity$1(n);
} else {
return null;
}
})();
var sym_name_str = cljs.core.name(sym);
var current_ns = sci.impl.vars.current_ns_name();
var current_ns_str = cljs.core.str.cljs$core$IFn$_invoke$arity$1(current_ns);
var namespaces = cljs.core.get.cljs$core$IFn$_invoke$arity$2(env,new cljs.core.Keyword(null,"namespaces","namespaces",-1444157469));
var the_current_ns = cljs.core.get.cljs$core$IFn$_invoke$arity$2(namespaces,current_ns);
var aliases = new cljs.core.Keyword(null,"aliases","aliases",1346874714).cljs$core$IFn$_invoke$arity$1(the_current_ns);
var ret = ((cljs.core.not(sym_ns))?(function (){var or__5002__auto__ = (function (){var temp__5804__auto__ = new cljs.core.Keyword(null,"refers","refers",158076809).cljs$core$IFn$_invoke$arity$1(the_current_ns);
if(cljs.core.truth_(temp__5804__auto__)){
var refers = temp__5804__auto__;
var temp__5804__auto____$1 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(refers,sym);
if(cljs.core.truth_(temp__5804__auto____$1)){
var v = temp__5804__auto____$1;
return sci.impl.parser.var__GT_sym(v);
} else {
return null;
}
} else {
return null;
}
})();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = (function (){var temp__5804__auto__ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(the_current_ns,sym);
if(cljs.core.truth_(temp__5804__auto__)){
var v = temp__5804__auto__;
return sci.impl.parser.var__GT_sym(v);
} else {
return null;
}
})();
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
var or__5002__auto____$2 = ((((((cljs.core.contains_QMARK_(cljs.core.get.cljs$core$IFn$_invoke$arity$2(namespaces,new cljs.core.Symbol(null,"clojure.core","clojure.core",-189332625,null)),sym)) && (cljs.core.not((function (){var G__79594 = the_current_ns;
var G__79594__$1 = (((G__79594 == null))?null:new cljs.core.Keyword(null,"refer","refer",-964295553).cljs$core$IFn$_invoke$arity$1(G__79594));
var G__79594__$2 = (((G__79594__$1 == null))?null:cljs.core.get.cljs$core$IFn$_invoke$arity$2(G__79594__$1,new cljs.core.Symbol(null,"clojure.core","clojure.core",-189332625,null)));
var G__79594__$3 = (((G__79594__$2 == null))?null:new cljs.core.Keyword(null,"exclude","exclude",-1230250334).cljs$core$IFn$_invoke$arity$1(G__79594__$2));
if((G__79594__$3 == null)){
return null;
} else {
return cljs.core.contains_QMARK_(G__79594__$3,sym);
}
})())))) || (cljs.core.contains_QMARK_(sci.impl.utils.ana_macros,sym))))?cljs.core.symbol.cljs$core$IFn$_invoke$arity$2("clojure.core",sym_name_str):null);
if(cljs.core.truth_(or__5002__auto____$2)){
return or__5002__auto____$2;
} else {
var or__5002__auto____$3 = sci.impl.interop.fully_qualify_class(ctx,sym);
if(cljs.core.truth_(or__5002__auto____$3)){
return or__5002__auto____$3;
} else {
return cljs.core.symbol.cljs$core$IFn$_invoke$arity$2(current_ns_str,sym_name_str);
}
}
}
}
})():(cljs.core.truth_(cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(env,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"namespaces","namespaces",-1444157469),sym_ns], null)))?sym:(function (){var temp__5802__auto__ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(aliases,sym_ns);
if(cljs.core.truth_(temp__5802__auto__)){
var ns = temp__5802__auto__;
return cljs.core.symbol.cljs$core$IFn$_invoke$arity$2(cljs.core.str.cljs$core$IFn$_invoke$arity$1(ns),sym_name_str);
} else {
return sym;
}
})()));
return ret;
});
sci.impl.parser.throw_eval_read = (function sci$impl$parser$throw_eval_read(_){
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2("EvalReader not allowed when *read-eval* is false.",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"type","type",1174270348),new cljs.core.Keyword("sci.error","parse","sci.error/parse",-264338844)], null));
});
sci.impl.parser.auto_resolve = (function sci$impl$parser$auto_resolve(ctx,opts){
var or__5002__auto__ = new cljs.core.Keyword(null,"auto-resolve","auto-resolve",1851201983).cljs$core$IFn$_invoke$arity$1(opts);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var env = new cljs.core.Keyword(null,"env","env",-1815813235).cljs$core$IFn$_invoke$arity$1(ctx);
var env_val = cljs.core.deref(env);
var current_ns = sci.impl.vars.current_ns_name();
var the_current_ns = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(env_val,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"namespaces","namespaces",-1444157469),current_ns], null));
var aliases = new cljs.core.Keyword(null,"aliases","aliases",1346874714).cljs$core$IFn$_invoke$arity$1(the_current_ns);
var auto_resolve = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(aliases,new cljs.core.Keyword(null,"current","current",-1088038603),current_ns);
return auto_resolve;
}
});
sci.impl.parser.get_line_number = (function sci$impl$parser$get_line_number(reader){
return cljs.tools.reader.reader_types.get_line_number(reader);
});
sci.impl.parser.get_column_number = (function sci$impl$parser$get_column_number(reader){
return cljs.tools.reader.reader_types.get_column_number(reader);
});
sci.impl.parser.parse_next = (function sci$impl$parser$parse_next(var_args){
var G__79649 = arguments.length;
switch (G__79649) {
case 2:
return sci.impl.parser.parse_next.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return sci.impl.parser.parse_next.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(sci.impl.parser.parse_next.cljs$core$IFn$_invoke$arity$2 = (function (ctx,r){
return sci.impl.parser.parse_next.cljs$core$IFn$_invoke$arity$3(ctx,r,null);
}));

(sci.impl.parser.parse_next.cljs$core$IFn$_invoke$arity$3 = (function (ctx,r,opts){
var features = new cljs.core.Keyword(null,"features","features",-1146962336).cljs$core$IFn$_invoke$arity$1(ctx);
var readers = new cljs.core.Keyword(null,"readers","readers",-2118263030).cljs$core$IFn$_invoke$arity$1(ctx);
var readers__$1 = ((sci.impl.vars.var_QMARK_(readers))?cljs.core.deref(readers):readers);
var auto_resolve = sci.impl.parser.auto_resolve(ctx,opts);
var parse_opts = (function (){var G__79667 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(sci.impl.parser.default_opts,new cljs.core.Keyword(null,"features","features",-1146962336),features,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"auto-resolve","auto-resolve",1851201983),auto_resolve,new cljs.core.Keyword(null,"syntax-quote","syntax-quote",-1233164847),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"resolve-symbol","resolve-symbol",-319166964),(function (p1__79643_SHARP_){
return sci.impl.parser.fully_qualify(ctx,p1__79643_SHARP_);
})], null),new cljs.core.Keyword(null,"readers","readers",-2118263030),(function (t){
var or__5002__auto__ = (function (){var and__5000__auto__ = readers__$1;
if(cljs.core.truth_(and__5000__auto__)){
return (readers__$1.cljs$core$IFn$_invoke$arity$1 ? readers__$1.cljs$core$IFn$_invoke$arity$1(t) : readers__$1.call(null,t));
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = (function (){var fexpr__79673 = cljs.core.deref(sci.impl.parser.data_readers);
return (fexpr__79673.cljs$core$IFn$_invoke$arity$1 ? fexpr__79673.cljs$core$IFn$_invoke$arity$1(t) : fexpr__79673.call(null,t));
})();
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
var or__5002__auto____$2 = (function (){var G__79674 = (function (){var G__79676 = ctx;
var G__79677 = cljs.core.PersistentArrayMap.EMPTY;
var G__79678 = t;
var fexpr__79675 = cljs.core.deref(sci.impl.utils.eval_resolve_state);
return (fexpr__79675.cljs$core$IFn$_invoke$arity$3 ? fexpr__79675.cljs$core$IFn$_invoke$arity$3(G__79676,G__79677,G__79678) : fexpr__79675.call(null,G__79676,G__79677,G__79678));
})();
var G__79674__$1 = (((G__79674 == null))?null:cljs.core.meta(G__79674));
if((G__79674__$1 == null)){
return null;
} else {
return new cljs.core.Keyword("sci.impl.record","map-constructor","sci.impl.record/map-constructor",1072184780).cljs$core$IFn$_invoke$arity$1(G__79674__$1);
}
})();
if(cljs.core.truth_(or__5002__auto____$2)){
return or__5002__auto____$2;
} else {
var temp__5804__auto__ = cljs.core.deref(sci.impl.parser.default_data_reader_fn);
if(cljs.core.truth_(temp__5804__auto__)){
var f = temp__5804__auto__;
return (function (form){
return (f.cljs$core$IFn$_invoke$arity$2 ? f.cljs$core$IFn$_invoke$arity$2(t,form) : f.call(null,t,form));
});
} else {
return null;
}
}
}
}
}),new cljs.core.Keyword(null,"read-eval","read-eval",1788733932),(cljs.core.truth_(cljs.core.deref(sci.impl.parser.read_eval))?(function (x){
return sci.impl.utils.eval(ctx,x);
}):sci.impl.parser.throw_eval_read)], 0));
if(cljs.core.truth_(opts)){
return cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([G__79667,opts], 0));
} else {
return G__79667;
}
})();
var ret = (function (){try{var v = edamame.core.parse_next.cljs$core$IFn$_invoke$arity$2(r,parse_opts);
if(cljs.core.keyword_identical_QMARK_(v,new cljs.core.Keyword("edamame.core","eof","edamame.core/eof",1855384188))){
return new cljs.core.Keyword("sci.impl.parser.edamame","eof","sci.impl.parser.edamame/eof",-917261517);
} else {
if((v instanceof cljs.core.Symbol)){
return cljs.core.vary_meta.cljs$core$IFn$_invoke$arity$6(v,cljs.core.assoc,new cljs.core.Keyword(null,"line","line",212345235),sci.impl.parser.get_line_number(r),new cljs.core.Keyword(null,"column","column",2078222095),(sci.impl.parser.get_column_number(r) - cljs.core.str.cljs$core$IFn$_invoke$arity$1(v).length));
} else {
return v;
}
}
}catch (e79685){if((e79685 instanceof cljs.core.ExceptionInfo)){
var e = e79685;
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$3(e.message,cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(cljs.core.ex_data(e),new cljs.core.Keyword(null,"type","type",1174270348),new cljs.core.Keyword("sci.error","parse","sci.error/parse",-264338844),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"phase","phase",575722892),"parse",new cljs.core.Keyword(null,"file","file",-1269645878),cljs.core.deref(sci.impl.vars.current_file)], 0)),e);
} else {
throw e79685;

}
}})();
return ret;
}));

(sci.impl.parser.parse_next.cljs$lang$maxFixedArity = 3);

sci.impl.parser.reader = (function sci$impl$parser$reader(x){
var string_reader = cljs.tools.reader.reader_types.string_reader(x);
var buf_len = (1);
var pushback_reader = (new cljs.tools.reader.reader_types.PushbackReader(string_reader,cljs.core.object_array.cljs$core$IFn$_invoke$arity$1(buf_len),buf_len,buf_len));
return cljs.tools.reader.reader_types.indexing_push_back_reader.cljs$core$IFn$_invoke$arity$1(pushback_reader);
});
sci.impl.parser.parse_string = (function sci$impl$parser$parse_string(ctx,s){
var r = sci.impl.parser.reader(s);
var v = sci.impl.parser.parse_next.cljs$core$IFn$_invoke$arity$2(ctx,r);
if(cljs.core.keyword_identical_QMARK_(new cljs.core.Keyword("sci.impl.parser.edamame","eof","sci.impl.parser.edamame/eof",-917261517),v)){
return null;
} else {
return v;
}
});

//# sourceMappingURL=sci.impl.parser.js.map
