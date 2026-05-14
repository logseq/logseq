goog.provide('camel_snake_kebab.core');



























/**
 * Converts the case of a string according to the rule for the first
 *   word, remaining words, and the separator.
 */
camel_snake_kebab.core.convert_case = (function camel_snake_kebab$core$convert_case(var_args){
var args__5732__auto__ = [];
var len__5726__auto___69756 = arguments.length;
var i__5727__auto___69757 = (0);
while(true){
if((i__5727__auto___69757 < len__5726__auto___69756)){
args__5732__auto__.push((arguments[i__5727__auto___69757]));

var G__69758 = (i__5727__auto___69757 + (1));
i__5727__auto___69757 = G__69758;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((4) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((4)),(0),null)):null);
return camel_snake_kebab.core.convert_case.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),(arguments[(1)]),(arguments[(2)]),(arguments[(3)]),argseq__5733__auto__);
});

(camel_snake_kebab.core.convert_case.cljs$core$IFn$_invoke$arity$variadic = (function (first_fn,rest_fn,sep,s,rest){
return cljs.core.apply.cljs$core$IFn$_invoke$arity$variadic(camel_snake_kebab.internals.misc.convert_case,first_fn,rest_fn,sep,s,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([rest], 0));
}));

(camel_snake_kebab.core.convert_case.cljs$lang$maxFixedArity = (4));

/** @this {Function} */
(camel_snake_kebab.core.convert_case.cljs$lang$applyTo = (function (seq69416){
var G__69420 = cljs.core.first(seq69416);
var seq69416__$1 = cljs.core.next(seq69416);
var G__69421 = cljs.core.first(seq69416__$1);
var seq69416__$2 = cljs.core.next(seq69416__$1);
var G__69423 = cljs.core.first(seq69416__$2);
var seq69416__$3 = cljs.core.next(seq69416__$2);
var G__69427 = cljs.core.first(seq69416__$3);
var seq69416__$4 = cljs.core.next(seq69416__$3);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__69420,G__69421,G__69423,G__69427,seq69416__$4);
}));

camel_snake_kebab.core.__GT_PascalCase = (function camel_snake_kebab$core$__GT_PascalCase(var_args){
var args__5732__auto__ = [];
var len__5726__auto___69759 = arguments.length;
var i__5727__auto___69760 = (0);
while(true){
if((i__5727__auto___69760 < len__5726__auto___69759)){
args__5732__auto__.push((arguments[i__5727__auto___69760]));

var G__69761 = (i__5727__auto___69760 + (1));
i__5727__auto___69760 = G__69761;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return camel_snake_kebab.core.__GT_PascalCase.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(camel_snake_kebab.core.__GT_PascalCase.cljs$core$IFn$_invoke$arity$variadic = (function (s__69352__auto__,rest__69353__auto__){
var convert_case__69354__auto__ = (function (p1__69351__69355__auto__){
return cljs.core.apply.cljs$core$IFn$_invoke$arity$variadic(camel_snake_kebab.internals.misc.convert_case,clojure.string.capitalize,clojure.string.capitalize,"",p1__69351__69355__auto__,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([rest__69353__auto__], 0));
});
return camel_snake_kebab.internals.alter_name.alter_name(s__69352__auto__,convert_case__69354__auto__);
}));

(camel_snake_kebab.core.__GT_PascalCase.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(camel_snake_kebab.core.__GT_PascalCase.cljs$lang$applyTo = (function (seq69548){
var G__69552 = cljs.core.first(seq69548);
var seq69548__$1 = cljs.core.next(seq69548);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__69552,seq69548__$1);
}));


camel_snake_kebab.core.__GT_PascalCaseString = (function camel_snake_kebab$core$__GT_PascalCaseString(var_args){
var args__5732__auto__ = [];
var len__5726__auto___69763 = arguments.length;
var i__5727__auto___69764 = (0);
while(true){
if((i__5727__auto___69764 < len__5726__auto___69763)){
args__5732__auto__.push((arguments[i__5727__auto___69764]));

var G__69765 = (i__5727__auto___69764 + (1));
i__5727__auto___69764 = G__69765;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return camel_snake_kebab.core.__GT_PascalCaseString.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(camel_snake_kebab.core.__GT_PascalCaseString.cljs$core$IFn$_invoke$arity$variadic = (function (s__69357__auto__,rest__69358__auto__){
return cljs.core.identity(cljs.core.apply.cljs$core$IFn$_invoke$arity$variadic(camel_snake_kebab.internals.misc.convert_case,clojure.string.capitalize,clojure.string.capitalize,"",cljs.core.name(s__69357__auto__),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([rest__69358__auto__], 0)));
}));

(camel_snake_kebab.core.__GT_PascalCaseString.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(camel_snake_kebab.core.__GT_PascalCaseString.cljs$lang$applyTo = (function (seq69563){
var G__69564 = cljs.core.first(seq69563);
var seq69563__$1 = cljs.core.next(seq69563);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__69564,seq69563__$1);
}));


camel_snake_kebab.core.__GT_PascalCaseSymbol = (function camel_snake_kebab$core$__GT_PascalCaseSymbol(var_args){
var args__5732__auto__ = [];
var len__5726__auto___69766 = arguments.length;
var i__5727__auto___69767 = (0);
while(true){
if((i__5727__auto___69767 < len__5726__auto___69766)){
args__5732__auto__.push((arguments[i__5727__auto___69767]));

var G__69768 = (i__5727__auto___69767 + (1));
i__5727__auto___69767 = G__69768;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return camel_snake_kebab.core.__GT_PascalCaseSymbol.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(camel_snake_kebab.core.__GT_PascalCaseSymbol.cljs$core$IFn$_invoke$arity$variadic = (function (s__69357__auto__,rest__69358__auto__){
return cljs.core.symbol.cljs$core$IFn$_invoke$arity$1(cljs.core.apply.cljs$core$IFn$_invoke$arity$variadic(camel_snake_kebab.internals.misc.convert_case,clojure.string.capitalize,clojure.string.capitalize,"",cljs.core.name(s__69357__auto__),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([rest__69358__auto__], 0)));
}));

(camel_snake_kebab.core.__GT_PascalCaseSymbol.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(camel_snake_kebab.core.__GT_PascalCaseSymbol.cljs$lang$applyTo = (function (seq69578){
var G__69579 = cljs.core.first(seq69578);
var seq69578__$1 = cljs.core.next(seq69578);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__69579,seq69578__$1);
}));


camel_snake_kebab.core.__GT_PascalCaseKeyword = (function camel_snake_kebab$core$__GT_PascalCaseKeyword(var_args){
var args__5732__auto__ = [];
var len__5726__auto___69771 = arguments.length;
var i__5727__auto___69772 = (0);
while(true){
if((i__5727__auto___69772 < len__5726__auto___69771)){
args__5732__auto__.push((arguments[i__5727__auto___69772]));

var G__69774 = (i__5727__auto___69772 + (1));
i__5727__auto___69772 = G__69774;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return camel_snake_kebab.core.__GT_PascalCaseKeyword.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(camel_snake_kebab.core.__GT_PascalCaseKeyword.cljs$core$IFn$_invoke$arity$variadic = (function (s__69357__auto__,rest__69358__auto__){
return cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(cljs.core.apply.cljs$core$IFn$_invoke$arity$variadic(camel_snake_kebab.internals.misc.convert_case,clojure.string.capitalize,clojure.string.capitalize,"",cljs.core.name(s__69357__auto__),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([rest__69358__auto__], 0)));
}));

(camel_snake_kebab.core.__GT_PascalCaseKeyword.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(camel_snake_kebab.core.__GT_PascalCaseKeyword.cljs$lang$applyTo = (function (seq69596){
var G__69597 = cljs.core.first(seq69596);
var seq69596__$1 = cljs.core.next(seq69596);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__69597,seq69596__$1);
}));

camel_snake_kebab.core.__GT_Camel_Snake_Case = (function camel_snake_kebab$core$__GT_Camel_Snake_Case(var_args){
var args__5732__auto__ = [];
var len__5726__auto___69776 = arguments.length;
var i__5727__auto___69777 = (0);
while(true){
if((i__5727__auto___69777 < len__5726__auto___69776)){
args__5732__auto__.push((arguments[i__5727__auto___69777]));

var G__69779 = (i__5727__auto___69777 + (1));
i__5727__auto___69777 = G__69779;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return camel_snake_kebab.core.__GT_Camel_Snake_Case.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(camel_snake_kebab.core.__GT_Camel_Snake_Case.cljs$core$IFn$_invoke$arity$variadic = (function (s__69352__auto__,rest__69353__auto__){
var convert_case__69354__auto__ = (function (p1__69351__69355__auto__){
return cljs.core.apply.cljs$core$IFn$_invoke$arity$variadic(camel_snake_kebab.internals.misc.convert_case,clojure.string.capitalize,clojure.string.capitalize,"_",p1__69351__69355__auto__,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([rest__69353__auto__], 0));
});
return camel_snake_kebab.internals.alter_name.alter_name(s__69352__auto__,convert_case__69354__auto__);
}));

(camel_snake_kebab.core.__GT_Camel_Snake_Case.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(camel_snake_kebab.core.__GT_Camel_Snake_Case.cljs$lang$applyTo = (function (seq69598){
var G__69599 = cljs.core.first(seq69598);
var seq69598__$1 = cljs.core.next(seq69598);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__69599,seq69598__$1);
}));


camel_snake_kebab.core.__GT_Camel_Snake_Case_String = (function camel_snake_kebab$core$__GT_Camel_Snake_Case_String(var_args){
var args__5732__auto__ = [];
var len__5726__auto___69782 = arguments.length;
var i__5727__auto___69783 = (0);
while(true){
if((i__5727__auto___69783 < len__5726__auto___69782)){
args__5732__auto__.push((arguments[i__5727__auto___69783]));

var G__69784 = (i__5727__auto___69783 + (1));
i__5727__auto___69783 = G__69784;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return camel_snake_kebab.core.__GT_Camel_Snake_Case_String.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(camel_snake_kebab.core.__GT_Camel_Snake_Case_String.cljs$core$IFn$_invoke$arity$variadic = (function (s__69357__auto__,rest__69358__auto__){
return cljs.core.identity(cljs.core.apply.cljs$core$IFn$_invoke$arity$variadic(camel_snake_kebab.internals.misc.convert_case,clojure.string.capitalize,clojure.string.capitalize,"_",cljs.core.name(s__69357__auto__),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([rest__69358__auto__], 0)));
}));

(camel_snake_kebab.core.__GT_Camel_Snake_Case_String.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(camel_snake_kebab.core.__GT_Camel_Snake_Case_String.cljs$lang$applyTo = (function (seq69622){
var G__69623 = cljs.core.first(seq69622);
var seq69622__$1 = cljs.core.next(seq69622);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__69623,seq69622__$1);
}));


camel_snake_kebab.core.__GT_Camel_Snake_Case_Symbol = (function camel_snake_kebab$core$__GT_Camel_Snake_Case_Symbol(var_args){
var args__5732__auto__ = [];
var len__5726__auto___69787 = arguments.length;
var i__5727__auto___69788 = (0);
while(true){
if((i__5727__auto___69788 < len__5726__auto___69787)){
args__5732__auto__.push((arguments[i__5727__auto___69788]));

var G__69789 = (i__5727__auto___69788 + (1));
i__5727__auto___69788 = G__69789;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return camel_snake_kebab.core.__GT_Camel_Snake_Case_Symbol.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(camel_snake_kebab.core.__GT_Camel_Snake_Case_Symbol.cljs$core$IFn$_invoke$arity$variadic = (function (s__69357__auto__,rest__69358__auto__){
return cljs.core.symbol.cljs$core$IFn$_invoke$arity$1(cljs.core.apply.cljs$core$IFn$_invoke$arity$variadic(camel_snake_kebab.internals.misc.convert_case,clojure.string.capitalize,clojure.string.capitalize,"_",cljs.core.name(s__69357__auto__),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([rest__69358__auto__], 0)));
}));

(camel_snake_kebab.core.__GT_Camel_Snake_Case_Symbol.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(camel_snake_kebab.core.__GT_Camel_Snake_Case_Symbol.cljs$lang$applyTo = (function (seq69628){
var G__69629 = cljs.core.first(seq69628);
var seq69628__$1 = cljs.core.next(seq69628);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__69629,seq69628__$1);
}));


camel_snake_kebab.core.__GT_Camel_Snake_Case_Keyword = (function camel_snake_kebab$core$__GT_Camel_Snake_Case_Keyword(var_args){
var args__5732__auto__ = [];
var len__5726__auto___69791 = arguments.length;
var i__5727__auto___69792 = (0);
while(true){
if((i__5727__auto___69792 < len__5726__auto___69791)){
args__5732__auto__.push((arguments[i__5727__auto___69792]));

var G__69793 = (i__5727__auto___69792 + (1));
i__5727__auto___69792 = G__69793;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return camel_snake_kebab.core.__GT_Camel_Snake_Case_Keyword.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(camel_snake_kebab.core.__GT_Camel_Snake_Case_Keyword.cljs$core$IFn$_invoke$arity$variadic = (function (s__69357__auto__,rest__69358__auto__){
return cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(cljs.core.apply.cljs$core$IFn$_invoke$arity$variadic(camel_snake_kebab.internals.misc.convert_case,clojure.string.capitalize,clojure.string.capitalize,"_",cljs.core.name(s__69357__auto__),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([rest__69358__auto__], 0)));
}));

(camel_snake_kebab.core.__GT_Camel_Snake_Case_Keyword.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(camel_snake_kebab.core.__GT_Camel_Snake_Case_Keyword.cljs$lang$applyTo = (function (seq69633){
var G__69635 = cljs.core.first(seq69633);
var seq69633__$1 = cljs.core.next(seq69633);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__69635,seq69633__$1);
}));

camel_snake_kebab.core.__GT_camelCase = (function camel_snake_kebab$core$__GT_camelCase(var_args){
var args__5732__auto__ = [];
var len__5726__auto___69800 = arguments.length;
var i__5727__auto___69801 = (0);
while(true){
if((i__5727__auto___69801 < len__5726__auto___69800)){
args__5732__auto__.push((arguments[i__5727__auto___69801]));

var G__69802 = (i__5727__auto___69801 + (1));
i__5727__auto___69801 = G__69802;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return camel_snake_kebab.core.__GT_camelCase.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(camel_snake_kebab.core.__GT_camelCase.cljs$core$IFn$_invoke$arity$variadic = (function (s__69352__auto__,rest__69353__auto__){
var convert_case__69354__auto__ = (function (p1__69351__69355__auto__){
return cljs.core.apply.cljs$core$IFn$_invoke$arity$variadic(camel_snake_kebab.internals.misc.convert_case,clojure.string.lower_case,clojure.string.capitalize,"",p1__69351__69355__auto__,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([rest__69353__auto__], 0));
});
return camel_snake_kebab.internals.alter_name.alter_name(s__69352__auto__,convert_case__69354__auto__);
}));

(camel_snake_kebab.core.__GT_camelCase.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(camel_snake_kebab.core.__GT_camelCase.cljs$lang$applyTo = (function (seq69640){
var G__69641 = cljs.core.first(seq69640);
var seq69640__$1 = cljs.core.next(seq69640);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__69641,seq69640__$1);
}));


camel_snake_kebab.core.__GT_camelCaseString = (function camel_snake_kebab$core$__GT_camelCaseString(var_args){
var args__5732__auto__ = [];
var len__5726__auto___69809 = arguments.length;
var i__5727__auto___69810 = (0);
while(true){
if((i__5727__auto___69810 < len__5726__auto___69809)){
args__5732__auto__.push((arguments[i__5727__auto___69810]));

var G__69811 = (i__5727__auto___69810 + (1));
i__5727__auto___69810 = G__69811;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return camel_snake_kebab.core.__GT_camelCaseString.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(camel_snake_kebab.core.__GT_camelCaseString.cljs$core$IFn$_invoke$arity$variadic = (function (s__69357__auto__,rest__69358__auto__){
return cljs.core.identity(cljs.core.apply.cljs$core$IFn$_invoke$arity$variadic(camel_snake_kebab.internals.misc.convert_case,clojure.string.lower_case,clojure.string.capitalize,"",cljs.core.name(s__69357__auto__),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([rest__69358__auto__], 0)));
}));

(camel_snake_kebab.core.__GT_camelCaseString.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(camel_snake_kebab.core.__GT_camelCaseString.cljs$lang$applyTo = (function (seq69644){
var G__69645 = cljs.core.first(seq69644);
var seq69644__$1 = cljs.core.next(seq69644);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__69645,seq69644__$1);
}));


camel_snake_kebab.core.__GT_camelCaseSymbol = (function camel_snake_kebab$core$__GT_camelCaseSymbol(var_args){
var args__5732__auto__ = [];
var len__5726__auto___69812 = arguments.length;
var i__5727__auto___69813 = (0);
while(true){
if((i__5727__auto___69813 < len__5726__auto___69812)){
args__5732__auto__.push((arguments[i__5727__auto___69813]));

var G__69814 = (i__5727__auto___69813 + (1));
i__5727__auto___69813 = G__69814;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return camel_snake_kebab.core.__GT_camelCaseSymbol.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(camel_snake_kebab.core.__GT_camelCaseSymbol.cljs$core$IFn$_invoke$arity$variadic = (function (s__69357__auto__,rest__69358__auto__){
return cljs.core.symbol.cljs$core$IFn$_invoke$arity$1(cljs.core.apply.cljs$core$IFn$_invoke$arity$variadic(camel_snake_kebab.internals.misc.convert_case,clojure.string.lower_case,clojure.string.capitalize,"",cljs.core.name(s__69357__auto__),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([rest__69358__auto__], 0)));
}));

(camel_snake_kebab.core.__GT_camelCaseSymbol.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(camel_snake_kebab.core.__GT_camelCaseSymbol.cljs$lang$applyTo = (function (seq69648){
var G__69649 = cljs.core.first(seq69648);
var seq69648__$1 = cljs.core.next(seq69648);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__69649,seq69648__$1);
}));


camel_snake_kebab.core.__GT_camelCaseKeyword = (function camel_snake_kebab$core$__GT_camelCaseKeyword(var_args){
var args__5732__auto__ = [];
var len__5726__auto___69815 = arguments.length;
var i__5727__auto___69816 = (0);
while(true){
if((i__5727__auto___69816 < len__5726__auto___69815)){
args__5732__auto__.push((arguments[i__5727__auto___69816]));

var G__69817 = (i__5727__auto___69816 + (1));
i__5727__auto___69816 = G__69817;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return camel_snake_kebab.core.__GT_camelCaseKeyword.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(camel_snake_kebab.core.__GT_camelCaseKeyword.cljs$core$IFn$_invoke$arity$variadic = (function (s__69357__auto__,rest__69358__auto__){
return cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(cljs.core.apply.cljs$core$IFn$_invoke$arity$variadic(camel_snake_kebab.internals.misc.convert_case,clojure.string.lower_case,clojure.string.capitalize,"",cljs.core.name(s__69357__auto__),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([rest__69358__auto__], 0)));
}));

(camel_snake_kebab.core.__GT_camelCaseKeyword.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(camel_snake_kebab.core.__GT_camelCaseKeyword.cljs$lang$applyTo = (function (seq69654){
var G__69655 = cljs.core.first(seq69654);
var seq69654__$1 = cljs.core.next(seq69654);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__69655,seq69654__$1);
}));

camel_snake_kebab.core.__GT_SCREAMING_SNAKE_CASE = (function camel_snake_kebab$core$__GT_SCREAMING_SNAKE_CASE(var_args){
var args__5732__auto__ = [];
var len__5726__auto___69820 = arguments.length;
var i__5727__auto___69821 = (0);
while(true){
if((i__5727__auto___69821 < len__5726__auto___69820)){
args__5732__auto__.push((arguments[i__5727__auto___69821]));

var G__69822 = (i__5727__auto___69821 + (1));
i__5727__auto___69821 = G__69822;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return camel_snake_kebab.core.__GT_SCREAMING_SNAKE_CASE.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(camel_snake_kebab.core.__GT_SCREAMING_SNAKE_CASE.cljs$core$IFn$_invoke$arity$variadic = (function (s__69352__auto__,rest__69353__auto__){
var convert_case__69354__auto__ = (function (p1__69351__69355__auto__){
return cljs.core.apply.cljs$core$IFn$_invoke$arity$variadic(camel_snake_kebab.internals.misc.convert_case,clojure.string.upper_case,clojure.string.upper_case,"_",p1__69351__69355__auto__,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([rest__69353__auto__], 0));
});
return camel_snake_kebab.internals.alter_name.alter_name(s__69352__auto__,convert_case__69354__auto__);
}));

(camel_snake_kebab.core.__GT_SCREAMING_SNAKE_CASE.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(camel_snake_kebab.core.__GT_SCREAMING_SNAKE_CASE.cljs$lang$applyTo = (function (seq69669){
var G__69670 = cljs.core.first(seq69669);
var seq69669__$1 = cljs.core.next(seq69669);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__69670,seq69669__$1);
}));


camel_snake_kebab.core.__GT_SCREAMING_SNAKE_CASE_STRING = (function camel_snake_kebab$core$__GT_SCREAMING_SNAKE_CASE_STRING(var_args){
var args__5732__auto__ = [];
var len__5726__auto___69823 = arguments.length;
var i__5727__auto___69824 = (0);
while(true){
if((i__5727__auto___69824 < len__5726__auto___69823)){
args__5732__auto__.push((arguments[i__5727__auto___69824]));

var G__69827 = (i__5727__auto___69824 + (1));
i__5727__auto___69824 = G__69827;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return camel_snake_kebab.core.__GT_SCREAMING_SNAKE_CASE_STRING.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(camel_snake_kebab.core.__GT_SCREAMING_SNAKE_CASE_STRING.cljs$core$IFn$_invoke$arity$variadic = (function (s__69357__auto__,rest__69358__auto__){
return cljs.core.identity(cljs.core.apply.cljs$core$IFn$_invoke$arity$variadic(camel_snake_kebab.internals.misc.convert_case,clojure.string.upper_case,clojure.string.upper_case,"_",cljs.core.name(s__69357__auto__),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([rest__69358__auto__], 0)));
}));

(camel_snake_kebab.core.__GT_SCREAMING_SNAKE_CASE_STRING.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(camel_snake_kebab.core.__GT_SCREAMING_SNAKE_CASE_STRING.cljs$lang$applyTo = (function (seq69677){
var G__69678 = cljs.core.first(seq69677);
var seq69677__$1 = cljs.core.next(seq69677);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__69678,seq69677__$1);
}));


camel_snake_kebab.core.__GT_SCREAMING_SNAKE_CASE_SYMBOL = (function camel_snake_kebab$core$__GT_SCREAMING_SNAKE_CASE_SYMBOL(var_args){
var args__5732__auto__ = [];
var len__5726__auto___69828 = arguments.length;
var i__5727__auto___69829 = (0);
while(true){
if((i__5727__auto___69829 < len__5726__auto___69828)){
args__5732__auto__.push((arguments[i__5727__auto___69829]));

var G__69830 = (i__5727__auto___69829 + (1));
i__5727__auto___69829 = G__69830;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return camel_snake_kebab.core.__GT_SCREAMING_SNAKE_CASE_SYMBOL.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(camel_snake_kebab.core.__GT_SCREAMING_SNAKE_CASE_SYMBOL.cljs$core$IFn$_invoke$arity$variadic = (function (s__69357__auto__,rest__69358__auto__){
return cljs.core.symbol.cljs$core$IFn$_invoke$arity$1(cljs.core.apply.cljs$core$IFn$_invoke$arity$variadic(camel_snake_kebab.internals.misc.convert_case,clojure.string.upper_case,clojure.string.upper_case,"_",cljs.core.name(s__69357__auto__),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([rest__69358__auto__], 0)));
}));

(camel_snake_kebab.core.__GT_SCREAMING_SNAKE_CASE_SYMBOL.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(camel_snake_kebab.core.__GT_SCREAMING_SNAKE_CASE_SYMBOL.cljs$lang$applyTo = (function (seq69681){
var G__69682 = cljs.core.first(seq69681);
var seq69681__$1 = cljs.core.next(seq69681);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__69682,seq69681__$1);
}));


camel_snake_kebab.core.__GT_SCREAMING_SNAKE_CASE_KEYWORD = (function camel_snake_kebab$core$__GT_SCREAMING_SNAKE_CASE_KEYWORD(var_args){
var args__5732__auto__ = [];
var len__5726__auto___69832 = arguments.length;
var i__5727__auto___69833 = (0);
while(true){
if((i__5727__auto___69833 < len__5726__auto___69832)){
args__5732__auto__.push((arguments[i__5727__auto___69833]));

var G__69836 = (i__5727__auto___69833 + (1));
i__5727__auto___69833 = G__69836;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return camel_snake_kebab.core.__GT_SCREAMING_SNAKE_CASE_KEYWORD.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(camel_snake_kebab.core.__GT_SCREAMING_SNAKE_CASE_KEYWORD.cljs$core$IFn$_invoke$arity$variadic = (function (s__69357__auto__,rest__69358__auto__){
return cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(cljs.core.apply.cljs$core$IFn$_invoke$arity$variadic(camel_snake_kebab.internals.misc.convert_case,clojure.string.upper_case,clojure.string.upper_case,"_",cljs.core.name(s__69357__auto__),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([rest__69358__auto__], 0)));
}));

(camel_snake_kebab.core.__GT_SCREAMING_SNAKE_CASE_KEYWORD.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(camel_snake_kebab.core.__GT_SCREAMING_SNAKE_CASE_KEYWORD.cljs$lang$applyTo = (function (seq69685){
var G__69686 = cljs.core.first(seq69685);
var seq69685__$1 = cljs.core.next(seq69685);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__69686,seq69685__$1);
}));

camel_snake_kebab.core.__GT_snake_case = (function camel_snake_kebab$core$__GT_snake_case(var_args){
var args__5732__auto__ = [];
var len__5726__auto___69838 = arguments.length;
var i__5727__auto___69839 = (0);
while(true){
if((i__5727__auto___69839 < len__5726__auto___69838)){
args__5732__auto__.push((arguments[i__5727__auto___69839]));

var G__69840 = (i__5727__auto___69839 + (1));
i__5727__auto___69839 = G__69840;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return camel_snake_kebab.core.__GT_snake_case.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(camel_snake_kebab.core.__GT_snake_case.cljs$core$IFn$_invoke$arity$variadic = (function (s__69352__auto__,rest__69353__auto__){
var convert_case__69354__auto__ = (function (p1__69351__69355__auto__){
return cljs.core.apply.cljs$core$IFn$_invoke$arity$variadic(camel_snake_kebab.internals.misc.convert_case,clojure.string.lower_case,clojure.string.lower_case,"_",p1__69351__69355__auto__,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([rest__69353__auto__], 0));
});
return camel_snake_kebab.internals.alter_name.alter_name(s__69352__auto__,convert_case__69354__auto__);
}));

(camel_snake_kebab.core.__GT_snake_case.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(camel_snake_kebab.core.__GT_snake_case.cljs$lang$applyTo = (function (seq69687){
var G__69688 = cljs.core.first(seq69687);
var seq69687__$1 = cljs.core.next(seq69687);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__69688,seq69687__$1);
}));


camel_snake_kebab.core.__GT_snake_case_string = (function camel_snake_kebab$core$__GT_snake_case_string(var_args){
var args__5732__auto__ = [];
var len__5726__auto___69841 = arguments.length;
var i__5727__auto___69842 = (0);
while(true){
if((i__5727__auto___69842 < len__5726__auto___69841)){
args__5732__auto__.push((arguments[i__5727__auto___69842]));

var G__69844 = (i__5727__auto___69842 + (1));
i__5727__auto___69842 = G__69844;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return camel_snake_kebab.core.__GT_snake_case_string.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(camel_snake_kebab.core.__GT_snake_case_string.cljs$core$IFn$_invoke$arity$variadic = (function (s__69357__auto__,rest__69358__auto__){
return cljs.core.identity(cljs.core.apply.cljs$core$IFn$_invoke$arity$variadic(camel_snake_kebab.internals.misc.convert_case,clojure.string.lower_case,clojure.string.lower_case,"_",cljs.core.name(s__69357__auto__),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([rest__69358__auto__], 0)));
}));

(camel_snake_kebab.core.__GT_snake_case_string.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(camel_snake_kebab.core.__GT_snake_case_string.cljs$lang$applyTo = (function (seq69706){
var G__69707 = cljs.core.first(seq69706);
var seq69706__$1 = cljs.core.next(seq69706);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__69707,seq69706__$1);
}));


camel_snake_kebab.core.__GT_snake_case_symbol = (function camel_snake_kebab$core$__GT_snake_case_symbol(var_args){
var args__5732__auto__ = [];
var len__5726__auto___69848 = arguments.length;
var i__5727__auto___69849 = (0);
while(true){
if((i__5727__auto___69849 < len__5726__auto___69848)){
args__5732__auto__.push((arguments[i__5727__auto___69849]));

var G__69850 = (i__5727__auto___69849 + (1));
i__5727__auto___69849 = G__69850;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return camel_snake_kebab.core.__GT_snake_case_symbol.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(camel_snake_kebab.core.__GT_snake_case_symbol.cljs$core$IFn$_invoke$arity$variadic = (function (s__69357__auto__,rest__69358__auto__){
return cljs.core.symbol.cljs$core$IFn$_invoke$arity$1(cljs.core.apply.cljs$core$IFn$_invoke$arity$variadic(camel_snake_kebab.internals.misc.convert_case,clojure.string.lower_case,clojure.string.lower_case,"_",cljs.core.name(s__69357__auto__),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([rest__69358__auto__], 0)));
}));

(camel_snake_kebab.core.__GT_snake_case_symbol.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(camel_snake_kebab.core.__GT_snake_case_symbol.cljs$lang$applyTo = (function (seq69712){
var G__69713 = cljs.core.first(seq69712);
var seq69712__$1 = cljs.core.next(seq69712);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__69713,seq69712__$1);
}));


camel_snake_kebab.core.__GT_snake_case_keyword = (function camel_snake_kebab$core$__GT_snake_case_keyword(var_args){
var args__5732__auto__ = [];
var len__5726__auto___69851 = arguments.length;
var i__5727__auto___69852 = (0);
while(true){
if((i__5727__auto___69852 < len__5726__auto___69851)){
args__5732__auto__.push((arguments[i__5727__auto___69852]));

var G__69854 = (i__5727__auto___69852 + (1));
i__5727__auto___69852 = G__69854;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return camel_snake_kebab.core.__GT_snake_case_keyword.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(camel_snake_kebab.core.__GT_snake_case_keyword.cljs$core$IFn$_invoke$arity$variadic = (function (s__69357__auto__,rest__69358__auto__){
return cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(cljs.core.apply.cljs$core$IFn$_invoke$arity$variadic(camel_snake_kebab.internals.misc.convert_case,clojure.string.lower_case,clojure.string.lower_case,"_",cljs.core.name(s__69357__auto__),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([rest__69358__auto__], 0)));
}));

(camel_snake_kebab.core.__GT_snake_case_keyword.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(camel_snake_kebab.core.__GT_snake_case_keyword.cljs$lang$applyTo = (function (seq69717){
var G__69718 = cljs.core.first(seq69717);
var seq69717__$1 = cljs.core.next(seq69717);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__69718,seq69717__$1);
}));

camel_snake_kebab.core.__GT_kebab_case = (function camel_snake_kebab$core$__GT_kebab_case(var_args){
var args__5732__auto__ = [];
var len__5726__auto___69858 = arguments.length;
var i__5727__auto___69859 = (0);
while(true){
if((i__5727__auto___69859 < len__5726__auto___69858)){
args__5732__auto__.push((arguments[i__5727__auto___69859]));

var G__69860 = (i__5727__auto___69859 + (1));
i__5727__auto___69859 = G__69860;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return camel_snake_kebab.core.__GT_kebab_case.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(camel_snake_kebab.core.__GT_kebab_case.cljs$core$IFn$_invoke$arity$variadic = (function (s__69352__auto__,rest__69353__auto__){
var convert_case__69354__auto__ = (function (p1__69351__69355__auto__){
return cljs.core.apply.cljs$core$IFn$_invoke$arity$variadic(camel_snake_kebab.internals.misc.convert_case,clojure.string.lower_case,clojure.string.lower_case,"-",p1__69351__69355__auto__,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([rest__69353__auto__], 0));
});
return camel_snake_kebab.internals.alter_name.alter_name(s__69352__auto__,convert_case__69354__auto__);
}));

(camel_snake_kebab.core.__GT_kebab_case.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(camel_snake_kebab.core.__GT_kebab_case.cljs$lang$applyTo = (function (seq69724){
var G__69725 = cljs.core.first(seq69724);
var seq69724__$1 = cljs.core.next(seq69724);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__69725,seq69724__$1);
}));


camel_snake_kebab.core.__GT_kebab_case_string = (function camel_snake_kebab$core$__GT_kebab_case_string(var_args){
var args__5732__auto__ = [];
var len__5726__auto___69865 = arguments.length;
var i__5727__auto___69866 = (0);
while(true){
if((i__5727__auto___69866 < len__5726__auto___69865)){
args__5732__auto__.push((arguments[i__5727__auto___69866]));

var G__69867 = (i__5727__auto___69866 + (1));
i__5727__auto___69866 = G__69867;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return camel_snake_kebab.core.__GT_kebab_case_string.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(camel_snake_kebab.core.__GT_kebab_case_string.cljs$core$IFn$_invoke$arity$variadic = (function (s__69357__auto__,rest__69358__auto__){
return cljs.core.identity(cljs.core.apply.cljs$core$IFn$_invoke$arity$variadic(camel_snake_kebab.internals.misc.convert_case,clojure.string.lower_case,clojure.string.lower_case,"-",cljs.core.name(s__69357__auto__),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([rest__69358__auto__], 0)));
}));

(camel_snake_kebab.core.__GT_kebab_case_string.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(camel_snake_kebab.core.__GT_kebab_case_string.cljs$lang$applyTo = (function (seq69728){
var G__69729 = cljs.core.first(seq69728);
var seq69728__$1 = cljs.core.next(seq69728);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__69729,seq69728__$1);
}));


camel_snake_kebab.core.__GT_kebab_case_symbol = (function camel_snake_kebab$core$__GT_kebab_case_symbol(var_args){
var args__5732__auto__ = [];
var len__5726__auto___69872 = arguments.length;
var i__5727__auto___69873 = (0);
while(true){
if((i__5727__auto___69873 < len__5726__auto___69872)){
args__5732__auto__.push((arguments[i__5727__auto___69873]));

var G__69874 = (i__5727__auto___69873 + (1));
i__5727__auto___69873 = G__69874;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return camel_snake_kebab.core.__GT_kebab_case_symbol.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(camel_snake_kebab.core.__GT_kebab_case_symbol.cljs$core$IFn$_invoke$arity$variadic = (function (s__69357__auto__,rest__69358__auto__){
return cljs.core.symbol.cljs$core$IFn$_invoke$arity$1(cljs.core.apply.cljs$core$IFn$_invoke$arity$variadic(camel_snake_kebab.internals.misc.convert_case,clojure.string.lower_case,clojure.string.lower_case,"-",cljs.core.name(s__69357__auto__),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([rest__69358__auto__], 0)));
}));

(camel_snake_kebab.core.__GT_kebab_case_symbol.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(camel_snake_kebab.core.__GT_kebab_case_symbol.cljs$lang$applyTo = (function (seq69730){
var G__69731 = cljs.core.first(seq69730);
var seq69730__$1 = cljs.core.next(seq69730);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__69731,seq69730__$1);
}));


camel_snake_kebab.core.__GT_kebab_case_keyword = (function camel_snake_kebab$core$__GT_kebab_case_keyword(var_args){
var args__5732__auto__ = [];
var len__5726__auto___69875 = arguments.length;
var i__5727__auto___69876 = (0);
while(true){
if((i__5727__auto___69876 < len__5726__auto___69875)){
args__5732__auto__.push((arguments[i__5727__auto___69876]));

var G__69877 = (i__5727__auto___69876 + (1));
i__5727__auto___69876 = G__69877;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return camel_snake_kebab.core.__GT_kebab_case_keyword.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(camel_snake_kebab.core.__GT_kebab_case_keyword.cljs$core$IFn$_invoke$arity$variadic = (function (s__69357__auto__,rest__69358__auto__){
return cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(cljs.core.apply.cljs$core$IFn$_invoke$arity$variadic(camel_snake_kebab.internals.misc.convert_case,clojure.string.lower_case,clojure.string.lower_case,"-",cljs.core.name(s__69357__auto__),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([rest__69358__auto__], 0)));
}));

(camel_snake_kebab.core.__GT_kebab_case_keyword.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(camel_snake_kebab.core.__GT_kebab_case_keyword.cljs$lang$applyTo = (function (seq69734){
var G__69735 = cljs.core.first(seq69734);
var seq69734__$1 = cljs.core.next(seq69734);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__69735,seq69734__$1);
}));

camel_snake_kebab.core.__GT_HTTP_Header_Case = (function camel_snake_kebab$core$__GT_HTTP_Header_Case(var_args){
var args__5732__auto__ = [];
var len__5726__auto___69878 = arguments.length;
var i__5727__auto___69879 = (0);
while(true){
if((i__5727__auto___69879 < len__5726__auto___69878)){
args__5732__auto__.push((arguments[i__5727__auto___69879]));

var G__69880 = (i__5727__auto___69879 + (1));
i__5727__auto___69879 = G__69880;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return camel_snake_kebab.core.__GT_HTTP_Header_Case.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(camel_snake_kebab.core.__GT_HTTP_Header_Case.cljs$core$IFn$_invoke$arity$variadic = (function (s__69352__auto__,rest__69353__auto__){
var convert_case__69354__auto__ = (function (p1__69351__69355__auto__){
return cljs.core.apply.cljs$core$IFn$_invoke$arity$variadic(camel_snake_kebab.internals.misc.convert_case,camel_snake_kebab.internals.misc.capitalize_http_header,camel_snake_kebab.internals.misc.capitalize_http_header,"-",p1__69351__69355__auto__,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([rest__69353__auto__], 0));
});
return camel_snake_kebab.internals.alter_name.alter_name(s__69352__auto__,convert_case__69354__auto__);
}));

(camel_snake_kebab.core.__GT_HTTP_Header_Case.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(camel_snake_kebab.core.__GT_HTTP_Header_Case.cljs$lang$applyTo = (function (seq69736){
var G__69737 = cljs.core.first(seq69736);
var seq69736__$1 = cljs.core.next(seq69736);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__69737,seq69736__$1);
}));


camel_snake_kebab.core.__GT_HTTP_Header_Case_String = (function camel_snake_kebab$core$__GT_HTTP_Header_Case_String(var_args){
var args__5732__auto__ = [];
var len__5726__auto___69881 = arguments.length;
var i__5727__auto___69882 = (0);
while(true){
if((i__5727__auto___69882 < len__5726__auto___69881)){
args__5732__auto__.push((arguments[i__5727__auto___69882]));

var G__69883 = (i__5727__auto___69882 + (1));
i__5727__auto___69882 = G__69883;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return camel_snake_kebab.core.__GT_HTTP_Header_Case_String.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(camel_snake_kebab.core.__GT_HTTP_Header_Case_String.cljs$core$IFn$_invoke$arity$variadic = (function (s__69357__auto__,rest__69358__auto__){
return cljs.core.identity(cljs.core.apply.cljs$core$IFn$_invoke$arity$variadic(camel_snake_kebab.internals.misc.convert_case,camel_snake_kebab.internals.misc.capitalize_http_header,camel_snake_kebab.internals.misc.capitalize_http_header,"-",cljs.core.name(s__69357__auto__),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([rest__69358__auto__], 0)));
}));

(camel_snake_kebab.core.__GT_HTTP_Header_Case_String.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(camel_snake_kebab.core.__GT_HTTP_Header_Case_String.cljs$lang$applyTo = (function (seq69740){
var G__69741 = cljs.core.first(seq69740);
var seq69740__$1 = cljs.core.next(seq69740);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__69741,seq69740__$1);
}));


camel_snake_kebab.core.__GT_HTTP_Header_Case_Symbol = (function camel_snake_kebab$core$__GT_HTTP_Header_Case_Symbol(var_args){
var args__5732__auto__ = [];
var len__5726__auto___69886 = arguments.length;
var i__5727__auto___69887 = (0);
while(true){
if((i__5727__auto___69887 < len__5726__auto___69886)){
args__5732__auto__.push((arguments[i__5727__auto___69887]));

var G__69888 = (i__5727__auto___69887 + (1));
i__5727__auto___69887 = G__69888;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return camel_snake_kebab.core.__GT_HTTP_Header_Case_Symbol.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(camel_snake_kebab.core.__GT_HTTP_Header_Case_Symbol.cljs$core$IFn$_invoke$arity$variadic = (function (s__69357__auto__,rest__69358__auto__){
return cljs.core.symbol.cljs$core$IFn$_invoke$arity$1(cljs.core.apply.cljs$core$IFn$_invoke$arity$variadic(camel_snake_kebab.internals.misc.convert_case,camel_snake_kebab.internals.misc.capitalize_http_header,camel_snake_kebab.internals.misc.capitalize_http_header,"-",cljs.core.name(s__69357__auto__),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([rest__69358__auto__], 0)));
}));

(camel_snake_kebab.core.__GT_HTTP_Header_Case_Symbol.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(camel_snake_kebab.core.__GT_HTTP_Header_Case_Symbol.cljs$lang$applyTo = (function (seq69744){
var G__69745 = cljs.core.first(seq69744);
var seq69744__$1 = cljs.core.next(seq69744);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__69745,seq69744__$1);
}));


camel_snake_kebab.core.__GT_HTTP_Header_Case_Keyword = (function camel_snake_kebab$core$__GT_HTTP_Header_Case_Keyword(var_args){
var args__5732__auto__ = [];
var len__5726__auto___69889 = arguments.length;
var i__5727__auto___69890 = (0);
while(true){
if((i__5727__auto___69890 < len__5726__auto___69889)){
args__5732__auto__.push((arguments[i__5727__auto___69890]));

var G__69891 = (i__5727__auto___69890 + (1));
i__5727__auto___69890 = G__69891;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return camel_snake_kebab.core.__GT_HTTP_Header_Case_Keyword.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(camel_snake_kebab.core.__GT_HTTP_Header_Case_Keyword.cljs$core$IFn$_invoke$arity$variadic = (function (s__69357__auto__,rest__69358__auto__){
return cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(cljs.core.apply.cljs$core$IFn$_invoke$arity$variadic(camel_snake_kebab.internals.misc.convert_case,camel_snake_kebab.internals.misc.capitalize_http_header,camel_snake_kebab.internals.misc.capitalize_http_header,"-",cljs.core.name(s__69357__auto__),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([rest__69358__auto__], 0)));
}));

(camel_snake_kebab.core.__GT_HTTP_Header_Case_Keyword.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(camel_snake_kebab.core.__GT_HTTP_Header_Case_Keyword.cljs$lang$applyTo = (function (seq69748){
var G__69749 = cljs.core.first(seq69748);
var seq69748__$1 = cljs.core.next(seq69748);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__69749,seq69748__$1);
}));


//# sourceMappingURL=camel_snake_kebab.core.js.map
