goog.provide('frontend.diff');
goog.scope(function(){
  frontend.diff.goog$module$goog$object = goog.module.get('goog.object');
});
var module$node_modules$diff$lib$index=shadow.js.require("module$node_modules$diff$lib$index", {});
frontend.diff.diff = (function frontend$diff$diff(s1,s2){
return cljs_bean.core.__GT_clj((function (){var G__102574 = s1;
var G__102575 = s2;
var G__102576 = cljs.core.clj__GT_js(new cljs.core.PersistentArrayMap(null, 1, ["newlineIsToken",true], null));
var fexpr__102573 = frontend.diff.goog$module$goog$object.get(module$node_modules$diff$lib$index,"diffLines");
return (fexpr__102573.cljs$core$IFn$_invoke$arity$3 ? fexpr__102573.cljs$core$IFn$_invoke$arity$3(G__102574,G__102575,G__102576) : fexpr__102573.call(null,G__102574,G__102575,G__102576));
})());
});
frontend.diff.inline_special_chars = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 8, ["`",null,"$",null,"*",null,"+",null,"/",null,"^",null,"~",null,"_",null], null), null);
frontend.diff.markdown_link_QMARK_ = (function frontend$diff$markdown_link_QMARK_(markup,current_line,pos){
var and__5000__auto__ = current_line;
if(cljs.core.truth_(and__5000__auto__)){
return ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(frontend.util.nth_safe(markup,pos),"]")) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(frontend.util.nth_safe(markup,(pos + (1))),"(")) && (((clojure.string.includes_QMARK_(cljs.core.subs.cljs$core$IFn$_invoke$arity$3(current_line,(0),pos),"[")) && (clojure.string.includes_QMARK_(cljs.core.subs.cljs$core$IFn$_invoke$arity$2(current_line,pos),")")))))));
} else {
return and__5000__auto__;
}
});
frontend.diff.find_position = (function frontend$diff$find_position(markup,text){
if(((typeof markup === 'string') && (typeof text === 'string'))){
try{var pos = (function (){var t1 = cljs.core.seq(clojure.string.lower_case(markup));
var t2 = cljs.core.seq(clojure.string.lower_case(text));
var i1 = (0);
var i2 = (0);
while(true){
var vec__102592 = t1;
var seq__102593 = cljs.core.seq(vec__102592);
var first__102594 = cljs.core.first(seq__102593);
var seq__102593__$1 = cljs.core.next(seq__102593);
var h1 = first__102594;
var r1 = seq__102593__$1;
var vec__102595 = t2;
var seq__102596 = cljs.core.seq(vec__102595);
var first__102597 = cljs.core.first(seq__102596);
var seq__102596__$1 = cljs.core.next(seq__102596);
var h2 = first__102597;
var r2 = seq__102596__$1;
if(((cljs.core.empty_QMARK_(t1)) || (cljs.core.empty_QMARK_(t2)))){
return i1;
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(h1,h2)){
var G__102602 = r1;
var G__102603 = r2;
var G__102604 = (i1 + (1));
var G__102605 = (i2 + (1));
t1 = G__102602;
t2 = G__102603;
i1 = G__102604;
i2 = G__102605;
continue;
} else {
if(cljs.core.truth_((function (){var fexpr__102598 = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 3, [" ",null,"[",null,"]",null], null), null);
return (fexpr__102598.cljs$core$IFn$_invoke$arity$1 ? fexpr__102598.cljs$core$IFn$_invoke$arity$1(h2) : fexpr__102598.call(null,h2));
})())){
var G__102606 = t1;
var G__102607 = r2;
var G__102608 = i1;
var G__102609 = (i2 + (1));
t1 = G__102606;
t2 = G__102607;
i1 = G__102608;
i2 = G__102609;
continue;
} else {
var G__102610 = r1;
var G__102611 = t2;
var G__102612 = (i1 + (1));
var G__102613 = i2;
t1 = G__102610;
t2 = G__102611;
i1 = G__102612;
i2 = G__102613;
continue;

}
}
}
break;
}
})();
var current_line = new cljs.core.Keyword(null,"line","line",212345235).cljs$core$IFn$_invoke$arity$1(frontend.util.text.get_current_line_by_pos(markup,pos));
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$variadic(frontend.util.nth_safe(markup,pos),frontend.util.nth_safe(markup,(pos + (1))),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["]"], 0))){
return (pos + (2));
} else {
if(cljs.core.contains_QMARK_(frontend.diff.inline_special_chars,frontend.util.nth_safe(markup,pos))){
var matched = cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core.str,cljs.core.take_while.cljs$core$IFn$_invoke$arity$2(frontend.diff.inline_special_chars,logseq.common.util.safe_subs.cljs$core$IFn$_invoke$arity$2(markup,pos)));
var matched_QMARK_ = (function (){var and__5000__auto__ = current_line;
if(cljs.core.truth_(and__5000__auto__)){
return clojure.string.includes_QMARK_(current_line,clojure.string.reverse(matched));
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(matched_QMARK_)){
return (pos + cljs.core.count(matched));
} else {
return pos;
}
} else {
if(cljs.core.truth_(frontend.diff.markdown_link_QMARK_(markup,current_line,pos))){
var idx = clojure.string.index_of.cljs$core$IFn$_invoke$arity$2(cljs.core.subs.cljs$core$IFn$_invoke$arity$2(current_line,pos),")");
return (pos + (idx + (1)));
} else {
return pos;

}
}
}
}catch (e102584){var e = e102584;
lambdaisland.glogi.log.cljs$core$IFn$_invoke$arity$4("frontend.diff",new cljs.core.Keyword(null,"error","error",-978969032),cljs.core.identity(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("diff","find-position","diff/find-position",-780421417),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"error","error",-978969032),e], null),new cljs.core.Keyword(null,"line","line",212345235),72], null)),null);

return cljs.core.count(markup);
}} else {
return null;
}
});

//# sourceMappingURL=frontend.diff.js.map
