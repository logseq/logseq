goog.provide('frontend.util.list');
frontend.util.list.newline_QMARK_ = (function frontend$util$list$newline_QMARK_(line){
return ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(line,"\n")) || (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(line,"\r\n")));
});
frontend.util.list.re_order_items = (function frontend$util$list$re_order_items(lines,start_idx){
var lines__$1 = lines;
var idx = start_idx;
var result = cljs.core.PersistentVector.EMPTY;
var double_newlines_QMARK_ = false;
while(true){
var vec__96763 = lines__$1;
var seq__96764 = cljs.core.seq(vec__96763);
var first__96765 = cljs.core.first(seq__96764);
var seq__96764__$1 = cljs.core.next(seq__96764);
var line = first__96765;
var others = seq__96764__$1;
if(cljs.core.empty_QMARK_(lines__$1)){
return clojure.string.join.cljs$core$IFn$_invoke$arity$2("\n",cljs.core.map.cljs$core$IFn$_invoke$arity$2(((function (lines__$1,idx,result,double_newlines_QMARK_,vec__96763,seq__96764,first__96765,seq__96764__$1,line,others){
return (function (line__$1){
if(frontend.util.list.newline_QMARK_(line__$1)){
return "";
} else {
return line__$1;
}
});})(lines__$1,idx,result,double_newlines_QMARK_,vec__96763,seq__96764,first__96765,seq__96764__$1,line,others))
,result));
} else {
var vec__96769 = cljs.core.re_find(/^(\d+){1}\./,line);
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__96769,(0),null);
var num_str = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__96769,(1),null);
var num = (cljs.core.truth_(num_str)?cljs.core.parse_long(num_str):null);
var double_newlines_QMARK__SINGLEQUOTE_ = ((double_newlines_QMARK_) || (((frontend.util.list.newline_QMARK_(line)) && (((cljs.core.seq(others)) && (frontend.util.list.newline_QMARK_(cljs.core.first(others))))))));
var vec__96772 = (cljs.core.truth_((function (){var and__5000__auto__ = (!(double_newlines_QMARK__SINGLEQUOTE_));
if(and__5000__auto__){
return num;
} else {
return and__5000__auto__;
}
})())?(function (){var idx_SINGLEQUOTE_ = (idx + (1));
var line_SINGLEQUOTE_ = clojure.string.replace_first(line,[cljs.core.str.cljs$core$IFn$_invoke$arity$1(num),"."].join(''),[cljs.core.str.cljs$core$IFn$_invoke$arity$1(idx_SINGLEQUOTE_),"."].join(''));
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [idx_SINGLEQUOTE_,cljs.core.conj.cljs$core$IFn$_invoke$arity$2(result,line_SINGLEQUOTE_)], null);
})():new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [idx,cljs.core.conj.cljs$core$IFn$_invoke$arity$2(result,line)], null));
var idx_SINGLEQUOTE_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__96772,(0),null);
var result_SINGLEQUOTE_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__96772,(1),null);
var G__96789 = others;
var G__96790 = idx_SINGLEQUOTE_;
var G__96791 = result_SINGLEQUOTE_;
var G__96792 = double_newlines_QMARK__SINGLEQUOTE_;
lines__$1 = G__96789;
idx = G__96790;
result = G__96791;
double_newlines_QMARK_ = G__96792;
continue;
}
break;
}
});

//# sourceMappingURL=frontend.util.list.js.map
