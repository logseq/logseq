goog.provide('instaparse.failure');
/**
 * Takes an index into text, and determines the line and column info
 */
instaparse.failure.index__GT_line_column = (function instaparse$failure$index__GT_line_column(index,text){
var line = (1);
var col = (1);
var counter = (0);
while(true){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(index,counter)){
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"line","line",212345235),line,new cljs.core.Keyword(null,"column","column",2078222095),col], null);
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("\n",cljs.core.get.cljs$core$IFn$_invoke$arity$2(text,counter))){
var G__128849 = (line + (1));
var G__128850 = (1);
var G__128851 = (counter + (1));
line = G__128849;
col = G__128850;
counter = G__128851;
continue;
} else {
var G__128852 = line;
var G__128853 = (col + (1));
var G__128854 = (counter + (1));
line = G__128852;
col = G__128853;
counter = G__128854;
continue;

}
}
break;
}
});
instaparse.failure.get_line = (function instaparse$failure$get_line(n,text){
var chars = cljs.core.seq(clojure.string.replace(text,"\r\n","\n"));
var n__$1 = n;
while(true){
if(cljs.core.empty_QMARK_(chars)){
return "";
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(n__$1,(1))){
return cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core.str,cljs.core.take_while.cljs$core$IFn$_invoke$arity$2(cljs.core.complement(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 1, ["\n",null], null), null)),chars));
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("\n",cljs.core.first(chars))){
var G__128855 = cljs.core.next(chars);
var G__128856 = (n__$1 - (1));
chars = G__128855;
n__$1 = G__128856;
continue;
} else {
var G__128857 = cljs.core.next(chars);
var G__128858 = n__$1;
chars = G__128857;
n__$1 = G__128858;
continue;

}
}
}
break;
}
});
/**
 * Creates string with caret at nth position, 1-based
 */
instaparse.failure.marker = (function instaparse$failure$marker(n){
if(cljs.core.integer_QMARK_(n)){
if((n <= (1))){
return "^";
} else {
return cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core.str,cljs.core.concat.cljs$core$IFn$_invoke$arity$2(cljs.core.repeat.cljs$core$IFn$_invoke$arity$2((n - (1))," "),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["^"], null)));
}
} else {
return null;
}
});
/**
 * Adds text, line, and column info to failure object.
 */
instaparse.failure.augment_failure = (function instaparse$failure$augment_failure(failure,text){
var lc = instaparse.failure.index__GT_line_column(new cljs.core.Keyword(null,"index","index",-1531685915).cljs$core$IFn$_invoke$arity$1(failure),text);
return cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([failure,lc,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"text","text",-1790561697),instaparse.failure.get_line(new cljs.core.Keyword(null,"line","line",212345235).cljs$core$IFn$_invoke$arity$1(lc),text)], null)], 0));
});
/**
 * Provides special case for printing negative lookahead reasons
 */
instaparse.failure.print_reason = (function instaparse$failure$print_reason(r){
if(cljs.core.truth_(new cljs.core.Keyword(null,"NOT","NOT",-1689245341).cljs$core$IFn$_invoke$arity$1(r))){
cljs.core.print.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["NOT "], 0));

return cljs.core.print.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"NOT","NOT",-1689245341).cljs$core$IFn$_invoke$arity$1(r)], 0));
} else {
if(cljs.core.truth_(new cljs.core.Keyword(null,"char-range","char-range",1443391389).cljs$core$IFn$_invoke$arity$1(r))){
return cljs.core.print.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([instaparse.print.char_range__GT_str(r)], 0));
} else {
if((r instanceof RegExp)){
return cljs.core.print.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([instaparse.print.regexp__GT_str(r)], 0));
} else {
return cljs.core.pr.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([r], 0));

}
}
}
});
/**
 * Takes an augmented failure object and prints the error message
 */
instaparse.failure.pprint_failure = (function instaparse$failure$pprint_failure(p__128839){
var map__128840 = p__128839;
var map__128840__$1 = cljs.core.__destructure_map(map__128840);
var line = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__128840__$1,new cljs.core.Keyword(null,"line","line",212345235));
var column = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__128840__$1,new cljs.core.Keyword(null,"column","column",2078222095));
var text = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__128840__$1,new cljs.core.Keyword(null,"text","text",-1790561697));
var reason = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__128840__$1,new cljs.core.Keyword(null,"reason","reason",-2070751759));
cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([["Parse error at line ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(line),", column ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(column),":"].join('')], 0));

cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([text], 0));

cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([instaparse.failure.marker(column)], 0));

var full_reasons = cljs.core.distinct.cljs$core$IFn$_invoke$arity$1(cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"expecting","expecting",-57706705),cljs.core.filter.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"full","full",436801220),reason)));
var partial_reasons = cljs.core.distinct.cljs$core$IFn$_invoke$arity$1(cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"expecting","expecting",-57706705),cljs.core.filter.cljs$core$IFn$_invoke$arity$2(cljs.core.complement(new cljs.core.Keyword(null,"full","full",436801220)),reason)));
var total = (cljs.core.count(full_reasons) + cljs.core.count(partial_reasons));
if((total === (0))){
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2((1),total)){
cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["Expected:"], 0));
} else {
cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["Expected one of:"], 0));

}
}

var seq__128841_128859 = cljs.core.seq(full_reasons);
var chunk__128842_128860 = null;
var count__128843_128861 = (0);
var i__128844_128862 = (0);
while(true){
if((i__128844_128862 < count__128843_128861)){
var r_128863 = chunk__128842_128860.cljs$core$IIndexed$_nth$arity$2(null,i__128844_128862);
instaparse.failure.print_reason(r_128863);

cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([" (followed by end-of-string)"], 0));


var G__128864 = seq__128841_128859;
var G__128865 = chunk__128842_128860;
var G__128866 = count__128843_128861;
var G__128867 = (i__128844_128862 + (1));
seq__128841_128859 = G__128864;
chunk__128842_128860 = G__128865;
count__128843_128861 = G__128866;
i__128844_128862 = G__128867;
continue;
} else {
var temp__5804__auto___128868 = cljs.core.seq(seq__128841_128859);
if(temp__5804__auto___128868){
var seq__128841_128869__$1 = temp__5804__auto___128868;
if(cljs.core.chunked_seq_QMARK_(seq__128841_128869__$1)){
var c__5525__auto___128870 = cljs.core.chunk_first(seq__128841_128869__$1);
var G__128871 = cljs.core.chunk_rest(seq__128841_128869__$1);
var G__128872 = c__5525__auto___128870;
var G__128873 = cljs.core.count(c__5525__auto___128870);
var G__128874 = (0);
seq__128841_128859 = G__128871;
chunk__128842_128860 = G__128872;
count__128843_128861 = G__128873;
i__128844_128862 = G__128874;
continue;
} else {
var r_128875 = cljs.core.first(seq__128841_128869__$1);
instaparse.failure.print_reason(r_128875);

cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([" (followed by end-of-string)"], 0));


var G__128876 = cljs.core.next(seq__128841_128869__$1);
var G__128877 = null;
var G__128878 = (0);
var G__128879 = (0);
seq__128841_128859 = G__128876;
chunk__128842_128860 = G__128877;
count__128843_128861 = G__128878;
i__128844_128862 = G__128879;
continue;
}
} else {
}
}
break;
}

var seq__128845 = cljs.core.seq(partial_reasons);
var chunk__128846 = null;
var count__128847 = (0);
var i__128848 = (0);
while(true){
if((i__128848 < count__128847)){
var r = chunk__128846.cljs$core$IIndexed$_nth$arity$2(null,i__128848);
instaparse.failure.print_reason(r);

cljs.core.println();


var G__128880 = seq__128845;
var G__128881 = chunk__128846;
var G__128882 = count__128847;
var G__128883 = (i__128848 + (1));
seq__128845 = G__128880;
chunk__128846 = G__128881;
count__128847 = G__128882;
i__128848 = G__128883;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__128845);
if(temp__5804__auto__){
var seq__128845__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__128845__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__128845__$1);
var G__128884 = cljs.core.chunk_rest(seq__128845__$1);
var G__128885 = c__5525__auto__;
var G__128886 = cljs.core.count(c__5525__auto__);
var G__128887 = (0);
seq__128845 = G__128884;
chunk__128846 = G__128885;
count__128847 = G__128886;
i__128848 = G__128887;
continue;
} else {
var r = cljs.core.first(seq__128845__$1);
instaparse.failure.print_reason(r);

cljs.core.println();


var G__128888 = cljs.core.next(seq__128845__$1);
var G__128889 = null;
var G__128890 = (0);
var G__128891 = (0);
seq__128845 = G__128888;
chunk__128846 = G__128889;
count__128847 = G__128890;
i__128848 = G__128891;
continue;
}
} else {
return null;
}
}
break;
}
});

//# sourceMappingURL=instaparse.failure.js.map
