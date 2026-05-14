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
var G__134769 = (line + (1));
var G__134770 = (1);
var G__134771 = (counter + (1));
line = G__134769;
col = G__134770;
counter = G__134771;
continue;
} else {
var G__134772 = line;
var G__134773 = (col + (1));
var G__134774 = (counter + (1));
line = G__134772;
col = G__134773;
counter = G__134774;
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
var G__134775 = cljs.core.next(chars);
var G__134776 = (n__$1 - (1));
chars = G__134775;
n__$1 = G__134776;
continue;
} else {
var G__134777 = cljs.core.next(chars);
var G__134778 = n__$1;
chars = G__134777;
n__$1 = G__134778;
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
instaparse.failure.pprint_failure = (function instaparse$failure$pprint_failure(p__134750){
var map__134752 = p__134750;
var map__134752__$1 = cljs.core.__destructure_map(map__134752);
var line = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__134752__$1,new cljs.core.Keyword(null,"line","line",212345235));
var column = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__134752__$1,new cljs.core.Keyword(null,"column","column",2078222095));
var text = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__134752__$1,new cljs.core.Keyword(null,"text","text",-1790561697));
var reason = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__134752__$1,new cljs.core.Keyword(null,"reason","reason",-2070751759));
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

var seq__134756_134782 = cljs.core.seq(full_reasons);
var chunk__134757_134783 = null;
var count__134758_134784 = (0);
var i__134759_134785 = (0);
while(true){
if((i__134759_134785 < count__134758_134784)){
var r_134786 = chunk__134757_134783.cljs$core$IIndexed$_nth$arity$2(null,i__134759_134785);
instaparse.failure.print_reason(r_134786);

cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([" (followed by end-of-string)"], 0));


var G__134787 = seq__134756_134782;
var G__134788 = chunk__134757_134783;
var G__134789 = count__134758_134784;
var G__134790 = (i__134759_134785 + (1));
seq__134756_134782 = G__134787;
chunk__134757_134783 = G__134788;
count__134758_134784 = G__134789;
i__134759_134785 = G__134790;
continue;
} else {
var temp__5804__auto___134791 = cljs.core.seq(seq__134756_134782);
if(temp__5804__auto___134791){
var seq__134756_134792__$1 = temp__5804__auto___134791;
if(cljs.core.chunked_seq_QMARK_(seq__134756_134792__$1)){
var c__5525__auto___134793 = cljs.core.chunk_first(seq__134756_134792__$1);
var G__134794 = cljs.core.chunk_rest(seq__134756_134792__$1);
var G__134795 = c__5525__auto___134793;
var G__134796 = cljs.core.count(c__5525__auto___134793);
var G__134797 = (0);
seq__134756_134782 = G__134794;
chunk__134757_134783 = G__134795;
count__134758_134784 = G__134796;
i__134759_134785 = G__134797;
continue;
} else {
var r_134801 = cljs.core.first(seq__134756_134792__$1);
instaparse.failure.print_reason(r_134801);

cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([" (followed by end-of-string)"], 0));


var G__134802 = cljs.core.next(seq__134756_134792__$1);
var G__134803 = null;
var G__134804 = (0);
var G__134805 = (0);
seq__134756_134782 = G__134802;
chunk__134757_134783 = G__134803;
count__134758_134784 = G__134804;
i__134759_134785 = G__134805;
continue;
}
} else {
}
}
break;
}

var seq__134762 = cljs.core.seq(partial_reasons);
var chunk__134763 = null;
var count__134764 = (0);
var i__134765 = (0);
while(true){
if((i__134765 < count__134764)){
var r = chunk__134763.cljs$core$IIndexed$_nth$arity$2(null,i__134765);
instaparse.failure.print_reason(r);

cljs.core.println();


var G__134806 = seq__134762;
var G__134807 = chunk__134763;
var G__134808 = count__134764;
var G__134809 = (i__134765 + (1));
seq__134762 = G__134806;
chunk__134763 = G__134807;
count__134764 = G__134808;
i__134765 = G__134809;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__134762);
if(temp__5804__auto__){
var seq__134762__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__134762__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__134762__$1);
var G__134810 = cljs.core.chunk_rest(seq__134762__$1);
var G__134811 = c__5525__auto__;
var G__134812 = cljs.core.count(c__5525__auto__);
var G__134813 = (0);
seq__134762 = G__134810;
chunk__134763 = G__134811;
count__134764 = G__134812;
i__134765 = G__134813;
continue;
} else {
var r = cljs.core.first(seq__134762__$1);
instaparse.failure.print_reason(r);

cljs.core.println();


var G__134814 = cljs.core.next(seq__134762__$1);
var G__134815 = null;
var G__134816 = (0);
var G__134817 = (0);
seq__134762 = G__134814;
chunk__134763 = G__134815;
count__134764 = G__134816;
i__134765 = G__134817;
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
