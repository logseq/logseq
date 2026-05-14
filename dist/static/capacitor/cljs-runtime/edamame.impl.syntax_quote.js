goog.provide('edamame.impl.syntax_quote');
edamame.impl.syntax_quote.unquote_QMARK_ = (function edamame$impl$syntax_quote$unquote_QMARK_(form){
return ((cljs.core.seq_QMARK_(form)) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.first(form),new cljs.core.Symbol("clojure.core","unquote","clojure.core/unquote",843087510,null))));
});
edamame.impl.syntax_quote.unquote_splicing_QMARK_ = (function edamame$impl$syntax_quote$unquote_splicing_QMARK_(form){
return ((cljs.core.seq_QMARK_(form)) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.first(form),new cljs.core.Symbol("clojure.core","unquote-splicing","clojure.core/unquote-splicing",-552003150,null))));
});
/**
 * Expand a list by resolving its syntax quotes and unquotes
 */
edamame.impl.syntax_quote.expand_list = (function edamame$impl$syntax_quote$expand_list(ctx,reader,s){
var s__$1 = cljs.core.seq(s);
var r = cljs.core.transient$(cljs.core.PersistentVector.EMPTY);
while(true){
if(s__$1){
var item = cljs.core.first(s__$1);
var ret = cljs.core.conj_BANG_.cljs$core$IFn$_invoke$arity$2(r,((edamame.impl.syntax_quote.unquote_QMARK_(item))?(new cljs.core.List(null,new cljs.core.Symbol("clojure.core","list","clojure.core/list",-1119203325,null),(new cljs.core.List(null,cljs.core.second(item),null,(1),null)),(2),null)):((edamame.impl.syntax_quote.unquote_splicing_QMARK_(item))?cljs.core.second(item):(new cljs.core.List(null,new cljs.core.Symbol("clojure.core","list","clojure.core/list",-1119203325,null),(new cljs.core.List(null,(edamame.impl.syntax_quote.syntax_quote.cljs$core$IFn$_invoke$arity$3 ? edamame.impl.syntax_quote.syntax_quote.cljs$core$IFn$_invoke$arity$3(ctx,reader,item) : edamame.impl.syntax_quote.syntax_quote.call(null,ctx,reader,item)),null,(1),null)),(2),null))
)));
var G__71599 = cljs.core.next(s__$1);
var G__71600 = ret;
s__$1 = G__71599;
r = G__71600;
continue;
} else {
return cljs.core.seq(cljs.core.persistent_BANG_(r));
}
break;
}
});
edamame.impl.syntax_quote.syntax_quote_coll = (function edamame$impl$syntax_quote$syntax_quote_coll(ctx,reader,type,coll){
var res = (new cljs.core.List(null,new cljs.core.Symbol("clojure.core","sequence","clojure.core/sequence",1998774218,null),(new cljs.core.List(null,(new cljs.core.List(null,new cljs.core.Symbol("clojure.core","seq","clojure.core/seq",-1551838743,null),(new cljs.core.List(null,cljs.core.cons(new cljs.core.Symbol("clojure.core","concat","clojure.core/concat",-1236478952,null),edamame.impl.syntax_quote.expand_list(ctx,reader,coll)),null,(1),null)),(2),null)),null,(1),null)),(2),null));
if(cljs.core.truth_(type)){
return (new cljs.core.List(null,new cljs.core.Symbol("clojure.core","apply","clojure.core/apply",1654646389,null),(new cljs.core.List(null,type,(new cljs.core.List(null,res,null,(1),null)),(2),null)),(3),null));
} else {
return res;
}
});
/**
 * Decide which map type to use, array-map if less than 16 elements
 */
edamame.impl.syntax_quote.map_func = (function edamame$impl$syntax_quote$map_func(coll){
if((cljs.core.count(coll) >= (16))){
return new cljs.core.Symbol("clojure.core","hash-map","clojure.core/hash-map",338908405,null);
} else {
return new cljs.core.Symbol("clojure.core","array-map","clojure.core/array-map",-1351833961,null);
}
});
/**
 * Flatten a map into a seq of alternate keys and values
 */
edamame.impl.syntax_quote.flatten_map = (function edamame$impl$syntax_quote$flatten_map(form){
var s = cljs.core.seq(form);
var key_vals = cljs.core.transient$(cljs.core.PersistentVector.EMPTY);
while(true){
if(s){
var e = cljs.core.first(s);
var G__71601 = cljs.core.next(s);
var G__71602 = cljs.core.conj_BANG_.cljs$core$IFn$_invoke$arity$2(cljs.core.conj_BANG_.cljs$core$IFn$_invoke$arity$2(key_vals,cljs.core.key(e)),cljs.core.val(e));
s = G__71601;
key_vals = G__71602;
continue;
} else {
return cljs.core.seq(cljs.core.persistent_BANG_(key_vals));
}
break;
}
});
edamame.impl.syntax_quote.syntax_quote_STAR_ = (function edamame$impl$syntax_quote$syntax_quote_STAR_(p__71545,reader,form){
var map__71546 = p__71545;
var map__71546__$1 = cljs.core.__destructure_map(map__71546);
var ctx = map__71546__$1;
var gensyms = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__71546__$1,new cljs.core.Keyword(null,"gensyms","gensyms",248713782));
if(cljs.core.special_symbol_QMARK_(form)){
return (new cljs.core.List(null,new cljs.core.Symbol(null,"quote","quote",1377916282,null),(new cljs.core.List(null,form,null,(1),null)),(2),null));
} else {
if((form instanceof cljs.core.Symbol)){
return (new cljs.core.List(null,new cljs.core.Symbol(null,"quote","quote",1377916282,null),(new cljs.core.List(null,(function (){var sym_name = cljs.core.name(form);
if(cljs.core.special_symbol_QMARK_(form)){
return form;
} else {
if(clojure.string.ends_with_QMARK_(sym_name,"#")){
var temp__5802__auto__ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(gensyms),form);
if(cljs.core.truth_(temp__5802__auto__)){
var generated = temp__5802__auto__;
return generated;
} else {
var n = cljs.core.subs.cljs$core$IFn$_invoke$arity$3(sym_name,(0),(((sym_name).length) - (1)));
var generated = cljs.core.gensym.cljs$core$IFn$_invoke$arity$1([n,"__"].join(''));
var generated__$1 = cljs.core.symbol.cljs$core$IFn$_invoke$arity$1([cljs.core.name(generated),"__auto__"].join(''));
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(gensyms,cljs.core.assoc,form,generated__$1);

return generated__$1;
}
} else {
var f = new cljs.core.Keyword(null,"resolve-symbol","resolve-symbol",-319166964).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"syntax-quote","syntax-quote",-1233164847).cljs$core$IFn$_invoke$arity$1(ctx));
var fexpr__71547 = (function (){var or__5002__auto__ = f;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.identity;
}
})();
return (fexpr__71547.cljs$core$IFn$_invoke$arity$1 ? fexpr__71547.cljs$core$IFn$_invoke$arity$1(form) : fexpr__71547.call(null,form));

}
}
})(),null,(1),null)),(2),null));
} else {
if(edamame.impl.syntax_quote.unquote_QMARK_(form)){
return cljs.core.second(form);
} else {
if(edamame.impl.syntax_quote.unquote_splicing_QMARK_(form)){
throw (new Error("unquote-splice not in list"));
} else {
if(cljs.core.coll_QMARK_(form)){
if((form instanceof cljs.core.IRecord)){
return form;
} else {
if(cljs.core.map_QMARK_(form)){
return edamame.impl.syntax_quote.syntax_quote_coll(ctx,reader,edamame.impl.syntax_quote.map_func(form),edamame.impl.syntax_quote.flatten_map(form));
} else {
if(cljs.core.vector_QMARK_(form)){
return (new cljs.core.List(null,new cljs.core.Symbol("clojure.core","vec","clojure.core/vec",146271141,null),(new cljs.core.List(null,edamame.impl.syntax_quote.syntax_quote_coll(ctx,reader,null,form),null,(1),null)),(2),null));
} else {
if(cljs.core.set_QMARK_(form)){
return edamame.impl.syntax_quote.syntax_quote_coll(ctx,reader,new cljs.core.Symbol("clojure.core","hash-set","clojure.core/hash-set",1229125967,null),form);
} else {
if(((cljs.core.seq_QMARK_(form)) || (cljs.core.list_QMARK_(form)))){
var seq = cljs.core.seq(form);
if(seq){
return edamame.impl.syntax_quote.syntax_quote_coll(ctx,reader,null,seq);
} else {
return cljs.core.list(new cljs.core.Symbol("clojure.core","list","clojure.core/list",-1119203325,null));
}
} else {
throw (new Error("Unknown Collection type"));

}
}
}
}
}
} else {
if((((form instanceof cljs.core.Keyword)) || (((typeof form === 'number') || (((cljs.core.char_QMARK_(form)) || (((typeof form === 'string') || ((((form == null)) || (((cljs.core.boolean_QMARK_(form)) || (cljs.core.regexp_QMARK_(form)))))))))))))){
return form;
} else {
return (new cljs.core.List(null,new cljs.core.Symbol(null,"quote","quote",1377916282,null),(new cljs.core.List(null,form,null,(1),null)),(2),null));

}
}
}
}
}
}
});
edamame.impl.syntax_quote.add_meta = (function edamame$impl$syntax_quote$add_meta(ctx,reader,form,ret){
if((function (){var and__5000__auto__ = (((!((form == null))))?(((((form.cljs$lang$protocol_mask$partition0$ & (262144))) || ((cljs.core.PROTOCOL_SENTINEL === form.cljs$core$IWithMeta$))))?true:false):false);
if(and__5000__auto__){
return cljs.core.seq(cljs.core.dissoc.cljs$core$IFn$_invoke$arity$variadic(cljs.core.meta(form),new cljs.core.Keyword(null,"row-key","row-key",-1189010712).cljs$core$IFn$_invoke$arity$1(ctx),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"col-key","col-key",-2009675766).cljs$core$IFn$_invoke$arity$1(ctx),new cljs.core.Keyword(null,"end-row-key","end-row-key",-1126662680).cljs$core$IFn$_invoke$arity$1(ctx),new cljs.core.Keyword(null,"end-col-key","end-col-key",81813304).cljs$core$IFn$_invoke$arity$1(ctx)], 0)));
} else {
return and__5000__auto__;
}
})()){
return (new cljs.core.List(null,new cljs.core.Symbol("cljs.core","with-meta","cljs.core/with-meta",749126446,null),(new cljs.core.List(null,ret,(new cljs.core.List(null,edamame.impl.syntax_quote.syntax_quote_STAR_(ctx,reader,cljs.core.meta(form)),null,(1),null)),(2),null)),(3),null));
} else {
return ret;
}
});
edamame.impl.syntax_quote.syntax_quote = (function edamame$impl$syntax_quote$syntax_quote(ctx,reader,form){
var ret = edamame.impl.syntax_quote.syntax_quote_STAR_(ctx,reader,form);
return edamame.impl.syntax_quote.add_meta(ctx,reader,form,ret);
});

//# sourceMappingURL=edamame.impl.syntax_quote.js.map
