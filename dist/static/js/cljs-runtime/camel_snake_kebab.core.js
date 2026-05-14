goog.provide('camel_snake_kebab.core');



























/**
 * Converts the case of a string according to the rule for the first
 *   word, remaining words, and the separator.
 */
camel_snake_kebab.core.convert_case = (function camel_snake_kebab$core$convert_case(var_args){
var args__5732__auto__ = [];
var len__5726__auto___74252 = arguments.length;
var i__5727__auto___74253 = (0);
while(true){
if((i__5727__auto___74253 < len__5726__auto___74252)){
args__5732__auto__.push((arguments[i__5727__auto___74253]));

var G__74254 = (i__5727__auto___74253 + (1));
i__5727__auto___74253 = G__74254;
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
(camel_snake_kebab.core.convert_case.cljs$lang$applyTo = (function (seq73940){
var G__73941 = cljs.core.first(seq73940);
var seq73940__$1 = cljs.core.next(seq73940);
var G__73942 = cljs.core.first(seq73940__$1);
var seq73940__$2 = cljs.core.next(seq73940__$1);
var G__73943 = cljs.core.first(seq73940__$2);
var seq73940__$3 = cljs.core.next(seq73940__$2);
var G__73944 = cljs.core.first(seq73940__$3);
var seq73940__$4 = cljs.core.next(seq73940__$3);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__73941,G__73942,G__73943,G__73944,seq73940__$4);
}));

camel_snake_kebab.core.__GT_PascalCase = (function camel_snake_kebab$core$__GT_PascalCase(var_args){
var args__5732__auto__ = [];
var len__5726__auto___74255 = arguments.length;
var i__5727__auto___74256 = (0);
while(true){
if((i__5727__auto___74256 < len__5726__auto___74255)){
args__5732__auto__.push((arguments[i__5727__auto___74256]));

var G__74257 = (i__5727__auto___74256 + (1));
i__5727__auto___74256 = G__74257;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return camel_snake_kebab.core.__GT_PascalCase.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(camel_snake_kebab.core.__GT_PascalCase.cljs$core$IFn$_invoke$arity$variadic = (function (s__73899__auto__,rest__73900__auto__){
var convert_case__73901__auto__ = (function (p1__73898__73902__auto__){
return cljs.core.apply.cljs$core$IFn$_invoke$arity$variadic(camel_snake_kebab.internals.misc.convert_case,clojure.string.capitalize,clojure.string.capitalize,"",p1__73898__73902__auto__,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([rest__73900__auto__], 0));
});
return camel_snake_kebab.internals.alter_name.alter_name(s__73899__auto__,convert_case__73901__auto__);
}));

(camel_snake_kebab.core.__GT_PascalCase.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(camel_snake_kebab.core.__GT_PascalCase.cljs$lang$applyTo = (function (seq73957){
var G__73958 = cljs.core.first(seq73957);
var seq73957__$1 = cljs.core.next(seq73957);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__73958,seq73957__$1);
}));


camel_snake_kebab.core.__GT_PascalCaseString = (function camel_snake_kebab$core$__GT_PascalCaseString(var_args){
var args__5732__auto__ = [];
var len__5726__auto___74259 = arguments.length;
var i__5727__auto___74260 = (0);
while(true){
if((i__5727__auto___74260 < len__5726__auto___74259)){
args__5732__auto__.push((arguments[i__5727__auto___74260]));

var G__74261 = (i__5727__auto___74260 + (1));
i__5727__auto___74260 = G__74261;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return camel_snake_kebab.core.__GT_PascalCaseString.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(camel_snake_kebab.core.__GT_PascalCaseString.cljs$core$IFn$_invoke$arity$variadic = (function (s__73904__auto__,rest__73905__auto__){
return cljs.core.identity(cljs.core.apply.cljs$core$IFn$_invoke$arity$variadic(camel_snake_kebab.internals.misc.convert_case,clojure.string.capitalize,clojure.string.capitalize,"",cljs.core.name(s__73904__auto__),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([rest__73905__auto__], 0)));
}));

(camel_snake_kebab.core.__GT_PascalCaseString.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(camel_snake_kebab.core.__GT_PascalCaseString.cljs$lang$applyTo = (function (seq73969){
var G__73970 = cljs.core.first(seq73969);
var seq73969__$1 = cljs.core.next(seq73969);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__73970,seq73969__$1);
}));


camel_snake_kebab.core.__GT_PascalCaseSymbol = (function camel_snake_kebab$core$__GT_PascalCaseSymbol(var_args){
var args__5732__auto__ = [];
var len__5726__auto___74266 = arguments.length;
var i__5727__auto___74267 = (0);
while(true){
if((i__5727__auto___74267 < len__5726__auto___74266)){
args__5732__auto__.push((arguments[i__5727__auto___74267]));

var G__74268 = (i__5727__auto___74267 + (1));
i__5727__auto___74267 = G__74268;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return camel_snake_kebab.core.__GT_PascalCaseSymbol.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(camel_snake_kebab.core.__GT_PascalCaseSymbol.cljs$core$IFn$_invoke$arity$variadic = (function (s__73904__auto__,rest__73905__auto__){
return cljs.core.symbol.cljs$core$IFn$_invoke$arity$1(cljs.core.apply.cljs$core$IFn$_invoke$arity$variadic(camel_snake_kebab.internals.misc.convert_case,clojure.string.capitalize,clojure.string.capitalize,"",cljs.core.name(s__73904__auto__),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([rest__73905__auto__], 0)));
}));

(camel_snake_kebab.core.__GT_PascalCaseSymbol.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(camel_snake_kebab.core.__GT_PascalCaseSymbol.cljs$lang$applyTo = (function (seq73978){
var G__73979 = cljs.core.first(seq73978);
var seq73978__$1 = cljs.core.next(seq73978);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__73979,seq73978__$1);
}));


camel_snake_kebab.core.__GT_PascalCaseKeyword = (function camel_snake_kebab$core$__GT_PascalCaseKeyword(var_args){
var args__5732__auto__ = [];
var len__5726__auto___74269 = arguments.length;
var i__5727__auto___74270 = (0);
while(true){
if((i__5727__auto___74270 < len__5726__auto___74269)){
args__5732__auto__.push((arguments[i__5727__auto___74270]));

var G__74271 = (i__5727__auto___74270 + (1));
i__5727__auto___74270 = G__74271;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return camel_snake_kebab.core.__GT_PascalCaseKeyword.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(camel_snake_kebab.core.__GT_PascalCaseKeyword.cljs$core$IFn$_invoke$arity$variadic = (function (s__73904__auto__,rest__73905__auto__){
return cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(cljs.core.apply.cljs$core$IFn$_invoke$arity$variadic(camel_snake_kebab.internals.misc.convert_case,clojure.string.capitalize,clojure.string.capitalize,"",cljs.core.name(s__73904__auto__),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([rest__73905__auto__], 0)));
}));

(camel_snake_kebab.core.__GT_PascalCaseKeyword.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(camel_snake_kebab.core.__GT_PascalCaseKeyword.cljs$lang$applyTo = (function (seq73980){
var G__73981 = cljs.core.first(seq73980);
var seq73980__$1 = cljs.core.next(seq73980);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__73981,seq73980__$1);
}));

camel_snake_kebab.core.__GT_Camel_Snake_Case = (function camel_snake_kebab$core$__GT_Camel_Snake_Case(var_args){
var args__5732__auto__ = [];
var len__5726__auto___74272 = arguments.length;
var i__5727__auto___74273 = (0);
while(true){
if((i__5727__auto___74273 < len__5726__auto___74272)){
args__5732__auto__.push((arguments[i__5727__auto___74273]));

var G__74274 = (i__5727__auto___74273 + (1));
i__5727__auto___74273 = G__74274;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return camel_snake_kebab.core.__GT_Camel_Snake_Case.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(camel_snake_kebab.core.__GT_Camel_Snake_Case.cljs$core$IFn$_invoke$arity$variadic = (function (s__73899__auto__,rest__73900__auto__){
var convert_case__73901__auto__ = (function (p1__73898__73902__auto__){
return cljs.core.apply.cljs$core$IFn$_invoke$arity$variadic(camel_snake_kebab.internals.misc.convert_case,clojure.string.capitalize,clojure.string.capitalize,"_",p1__73898__73902__auto__,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([rest__73900__auto__], 0));
});
return camel_snake_kebab.internals.alter_name.alter_name(s__73899__auto__,convert_case__73901__auto__);
}));

(camel_snake_kebab.core.__GT_Camel_Snake_Case.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(camel_snake_kebab.core.__GT_Camel_Snake_Case.cljs$lang$applyTo = (function (seq74008){
var G__74009 = cljs.core.first(seq74008);
var seq74008__$1 = cljs.core.next(seq74008);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__74009,seq74008__$1);
}));


camel_snake_kebab.core.__GT_Camel_Snake_Case_String = (function camel_snake_kebab$core$__GT_Camel_Snake_Case_String(var_args){
var args__5732__auto__ = [];
var len__5726__auto___74275 = arguments.length;
var i__5727__auto___74276 = (0);
while(true){
if((i__5727__auto___74276 < len__5726__auto___74275)){
args__5732__auto__.push((arguments[i__5727__auto___74276]));

var G__74277 = (i__5727__auto___74276 + (1));
i__5727__auto___74276 = G__74277;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return camel_snake_kebab.core.__GT_Camel_Snake_Case_String.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(camel_snake_kebab.core.__GT_Camel_Snake_Case_String.cljs$core$IFn$_invoke$arity$variadic = (function (s__73904__auto__,rest__73905__auto__){
return cljs.core.identity(cljs.core.apply.cljs$core$IFn$_invoke$arity$variadic(camel_snake_kebab.internals.misc.convert_case,clojure.string.capitalize,clojure.string.capitalize,"_",cljs.core.name(s__73904__auto__),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([rest__73905__auto__], 0)));
}));

(camel_snake_kebab.core.__GT_Camel_Snake_Case_String.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(camel_snake_kebab.core.__GT_Camel_Snake_Case_String.cljs$lang$applyTo = (function (seq74010){
var G__74011 = cljs.core.first(seq74010);
var seq74010__$1 = cljs.core.next(seq74010);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__74011,seq74010__$1);
}));


camel_snake_kebab.core.__GT_Camel_Snake_Case_Symbol = (function camel_snake_kebab$core$__GT_Camel_Snake_Case_Symbol(var_args){
var args__5732__auto__ = [];
var len__5726__auto___74278 = arguments.length;
var i__5727__auto___74280 = (0);
while(true){
if((i__5727__auto___74280 < len__5726__auto___74278)){
args__5732__auto__.push((arguments[i__5727__auto___74280]));

var G__74282 = (i__5727__auto___74280 + (1));
i__5727__auto___74280 = G__74282;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return camel_snake_kebab.core.__GT_Camel_Snake_Case_Symbol.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(camel_snake_kebab.core.__GT_Camel_Snake_Case_Symbol.cljs$core$IFn$_invoke$arity$variadic = (function (s__73904__auto__,rest__73905__auto__){
return cljs.core.symbol.cljs$core$IFn$_invoke$arity$1(cljs.core.apply.cljs$core$IFn$_invoke$arity$variadic(camel_snake_kebab.internals.misc.convert_case,clojure.string.capitalize,clojure.string.capitalize,"_",cljs.core.name(s__73904__auto__),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([rest__73905__auto__], 0)));
}));

(camel_snake_kebab.core.__GT_Camel_Snake_Case_Symbol.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(camel_snake_kebab.core.__GT_Camel_Snake_Case_Symbol.cljs$lang$applyTo = (function (seq74020){
var G__74021 = cljs.core.first(seq74020);
var seq74020__$1 = cljs.core.next(seq74020);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__74021,seq74020__$1);
}));


camel_snake_kebab.core.__GT_Camel_Snake_Case_Keyword = (function camel_snake_kebab$core$__GT_Camel_Snake_Case_Keyword(var_args){
var args__5732__auto__ = [];
var len__5726__auto___74283 = arguments.length;
var i__5727__auto___74284 = (0);
while(true){
if((i__5727__auto___74284 < len__5726__auto___74283)){
args__5732__auto__.push((arguments[i__5727__auto___74284]));

var G__74285 = (i__5727__auto___74284 + (1));
i__5727__auto___74284 = G__74285;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return camel_snake_kebab.core.__GT_Camel_Snake_Case_Keyword.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(camel_snake_kebab.core.__GT_Camel_Snake_Case_Keyword.cljs$core$IFn$_invoke$arity$variadic = (function (s__73904__auto__,rest__73905__auto__){
return cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(cljs.core.apply.cljs$core$IFn$_invoke$arity$variadic(camel_snake_kebab.internals.misc.convert_case,clojure.string.capitalize,clojure.string.capitalize,"_",cljs.core.name(s__73904__auto__),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([rest__73905__auto__], 0)));
}));

(camel_snake_kebab.core.__GT_Camel_Snake_Case_Keyword.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(camel_snake_kebab.core.__GT_Camel_Snake_Case_Keyword.cljs$lang$applyTo = (function (seq74031){
var G__74032 = cljs.core.first(seq74031);
var seq74031__$1 = cljs.core.next(seq74031);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__74032,seq74031__$1);
}));

camel_snake_kebab.core.__GT_camelCase = (function camel_snake_kebab$core$__GT_camelCase(var_args){
var args__5732__auto__ = [];
var len__5726__auto___74286 = arguments.length;
var i__5727__auto___74287 = (0);
while(true){
if((i__5727__auto___74287 < len__5726__auto___74286)){
args__5732__auto__.push((arguments[i__5727__auto___74287]));

var G__74289 = (i__5727__auto___74287 + (1));
i__5727__auto___74287 = G__74289;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return camel_snake_kebab.core.__GT_camelCase.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(camel_snake_kebab.core.__GT_camelCase.cljs$core$IFn$_invoke$arity$variadic = (function (s__73899__auto__,rest__73900__auto__){
var convert_case__73901__auto__ = (function (p1__73898__73902__auto__){
return cljs.core.apply.cljs$core$IFn$_invoke$arity$variadic(camel_snake_kebab.internals.misc.convert_case,clojure.string.lower_case,clojure.string.capitalize,"",p1__73898__73902__auto__,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([rest__73900__auto__], 0));
});
return camel_snake_kebab.internals.alter_name.alter_name(s__73899__auto__,convert_case__73901__auto__);
}));

(camel_snake_kebab.core.__GT_camelCase.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(camel_snake_kebab.core.__GT_camelCase.cljs$lang$applyTo = (function (seq74041){
var G__74042 = cljs.core.first(seq74041);
var seq74041__$1 = cljs.core.next(seq74041);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__74042,seq74041__$1);
}));


camel_snake_kebab.core.__GT_camelCaseString = (function camel_snake_kebab$core$__GT_camelCaseString(var_args){
var args__5732__auto__ = [];
var len__5726__auto___74290 = arguments.length;
var i__5727__auto___74291 = (0);
while(true){
if((i__5727__auto___74291 < len__5726__auto___74290)){
args__5732__auto__.push((arguments[i__5727__auto___74291]));

var G__74292 = (i__5727__auto___74291 + (1));
i__5727__auto___74291 = G__74292;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return camel_snake_kebab.core.__GT_camelCaseString.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(camel_snake_kebab.core.__GT_camelCaseString.cljs$core$IFn$_invoke$arity$variadic = (function (s__73904__auto__,rest__73905__auto__){
return cljs.core.identity(cljs.core.apply.cljs$core$IFn$_invoke$arity$variadic(camel_snake_kebab.internals.misc.convert_case,clojure.string.lower_case,clojure.string.capitalize,"",cljs.core.name(s__73904__auto__),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([rest__73905__auto__], 0)));
}));

(camel_snake_kebab.core.__GT_camelCaseString.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(camel_snake_kebab.core.__GT_camelCaseString.cljs$lang$applyTo = (function (seq74056){
var G__74057 = cljs.core.first(seq74056);
var seq74056__$1 = cljs.core.next(seq74056);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__74057,seq74056__$1);
}));


camel_snake_kebab.core.__GT_camelCaseSymbol = (function camel_snake_kebab$core$__GT_camelCaseSymbol(var_args){
var args__5732__auto__ = [];
var len__5726__auto___74295 = arguments.length;
var i__5727__auto___74296 = (0);
while(true){
if((i__5727__auto___74296 < len__5726__auto___74295)){
args__5732__auto__.push((arguments[i__5727__auto___74296]));

var G__74297 = (i__5727__auto___74296 + (1));
i__5727__auto___74296 = G__74297;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return camel_snake_kebab.core.__GT_camelCaseSymbol.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(camel_snake_kebab.core.__GT_camelCaseSymbol.cljs$core$IFn$_invoke$arity$variadic = (function (s__73904__auto__,rest__73905__auto__){
return cljs.core.symbol.cljs$core$IFn$_invoke$arity$1(cljs.core.apply.cljs$core$IFn$_invoke$arity$variadic(camel_snake_kebab.internals.misc.convert_case,clojure.string.lower_case,clojure.string.capitalize,"",cljs.core.name(s__73904__auto__),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([rest__73905__auto__], 0)));
}));

(camel_snake_kebab.core.__GT_camelCaseSymbol.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(camel_snake_kebab.core.__GT_camelCaseSymbol.cljs$lang$applyTo = (function (seq74061){
var G__74062 = cljs.core.first(seq74061);
var seq74061__$1 = cljs.core.next(seq74061);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__74062,seq74061__$1);
}));


camel_snake_kebab.core.__GT_camelCaseKeyword = (function camel_snake_kebab$core$__GT_camelCaseKeyword(var_args){
var args__5732__auto__ = [];
var len__5726__auto___74298 = arguments.length;
var i__5727__auto___74299 = (0);
while(true){
if((i__5727__auto___74299 < len__5726__auto___74298)){
args__5732__auto__.push((arguments[i__5727__auto___74299]));

var G__74300 = (i__5727__auto___74299 + (1));
i__5727__auto___74299 = G__74300;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return camel_snake_kebab.core.__GT_camelCaseKeyword.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(camel_snake_kebab.core.__GT_camelCaseKeyword.cljs$core$IFn$_invoke$arity$variadic = (function (s__73904__auto__,rest__73905__auto__){
return cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(cljs.core.apply.cljs$core$IFn$_invoke$arity$variadic(camel_snake_kebab.internals.misc.convert_case,clojure.string.lower_case,clojure.string.capitalize,"",cljs.core.name(s__73904__auto__),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([rest__73905__auto__], 0)));
}));

(camel_snake_kebab.core.__GT_camelCaseKeyword.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(camel_snake_kebab.core.__GT_camelCaseKeyword.cljs$lang$applyTo = (function (seq74067){
var G__74068 = cljs.core.first(seq74067);
var seq74067__$1 = cljs.core.next(seq74067);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__74068,seq74067__$1);
}));

camel_snake_kebab.core.__GT_SCREAMING_SNAKE_CASE = (function camel_snake_kebab$core$__GT_SCREAMING_SNAKE_CASE(var_args){
var args__5732__auto__ = [];
var len__5726__auto___74305 = arguments.length;
var i__5727__auto___74306 = (0);
while(true){
if((i__5727__auto___74306 < len__5726__auto___74305)){
args__5732__auto__.push((arguments[i__5727__auto___74306]));

var G__74307 = (i__5727__auto___74306 + (1));
i__5727__auto___74306 = G__74307;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return camel_snake_kebab.core.__GT_SCREAMING_SNAKE_CASE.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(camel_snake_kebab.core.__GT_SCREAMING_SNAKE_CASE.cljs$core$IFn$_invoke$arity$variadic = (function (s__73899__auto__,rest__73900__auto__){
var convert_case__73901__auto__ = (function (p1__73898__73902__auto__){
return cljs.core.apply.cljs$core$IFn$_invoke$arity$variadic(camel_snake_kebab.internals.misc.convert_case,clojure.string.upper_case,clojure.string.upper_case,"_",p1__73898__73902__auto__,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([rest__73900__auto__], 0));
});
return camel_snake_kebab.internals.alter_name.alter_name(s__73899__auto__,convert_case__73901__auto__);
}));

(camel_snake_kebab.core.__GT_SCREAMING_SNAKE_CASE.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(camel_snake_kebab.core.__GT_SCREAMING_SNAKE_CASE.cljs$lang$applyTo = (function (seq74075){
var G__74076 = cljs.core.first(seq74075);
var seq74075__$1 = cljs.core.next(seq74075);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__74076,seq74075__$1);
}));


camel_snake_kebab.core.__GT_SCREAMING_SNAKE_CASE_STRING = (function camel_snake_kebab$core$__GT_SCREAMING_SNAKE_CASE_STRING(var_args){
var args__5732__auto__ = [];
var len__5726__auto___74310 = arguments.length;
var i__5727__auto___74311 = (0);
while(true){
if((i__5727__auto___74311 < len__5726__auto___74310)){
args__5732__auto__.push((arguments[i__5727__auto___74311]));

var G__74312 = (i__5727__auto___74311 + (1));
i__5727__auto___74311 = G__74312;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return camel_snake_kebab.core.__GT_SCREAMING_SNAKE_CASE_STRING.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(camel_snake_kebab.core.__GT_SCREAMING_SNAKE_CASE_STRING.cljs$core$IFn$_invoke$arity$variadic = (function (s__73904__auto__,rest__73905__auto__){
return cljs.core.identity(cljs.core.apply.cljs$core$IFn$_invoke$arity$variadic(camel_snake_kebab.internals.misc.convert_case,clojure.string.upper_case,clojure.string.upper_case,"_",cljs.core.name(s__73904__auto__),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([rest__73905__auto__], 0)));
}));

(camel_snake_kebab.core.__GT_SCREAMING_SNAKE_CASE_STRING.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(camel_snake_kebab.core.__GT_SCREAMING_SNAKE_CASE_STRING.cljs$lang$applyTo = (function (seq74083){
var G__74084 = cljs.core.first(seq74083);
var seq74083__$1 = cljs.core.next(seq74083);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__74084,seq74083__$1);
}));


camel_snake_kebab.core.__GT_SCREAMING_SNAKE_CASE_SYMBOL = (function camel_snake_kebab$core$__GT_SCREAMING_SNAKE_CASE_SYMBOL(var_args){
var args__5732__auto__ = [];
var len__5726__auto___74318 = arguments.length;
var i__5727__auto___74319 = (0);
while(true){
if((i__5727__auto___74319 < len__5726__auto___74318)){
args__5732__auto__.push((arguments[i__5727__auto___74319]));

var G__74320 = (i__5727__auto___74319 + (1));
i__5727__auto___74319 = G__74320;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return camel_snake_kebab.core.__GT_SCREAMING_SNAKE_CASE_SYMBOL.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(camel_snake_kebab.core.__GT_SCREAMING_SNAKE_CASE_SYMBOL.cljs$core$IFn$_invoke$arity$variadic = (function (s__73904__auto__,rest__73905__auto__){
return cljs.core.symbol.cljs$core$IFn$_invoke$arity$1(cljs.core.apply.cljs$core$IFn$_invoke$arity$variadic(camel_snake_kebab.internals.misc.convert_case,clojure.string.upper_case,clojure.string.upper_case,"_",cljs.core.name(s__73904__auto__),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([rest__73905__auto__], 0)));
}));

(camel_snake_kebab.core.__GT_SCREAMING_SNAKE_CASE_SYMBOL.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(camel_snake_kebab.core.__GT_SCREAMING_SNAKE_CASE_SYMBOL.cljs$lang$applyTo = (function (seq74092){
var G__74093 = cljs.core.first(seq74092);
var seq74092__$1 = cljs.core.next(seq74092);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__74093,seq74092__$1);
}));


camel_snake_kebab.core.__GT_SCREAMING_SNAKE_CASE_KEYWORD = (function camel_snake_kebab$core$__GT_SCREAMING_SNAKE_CASE_KEYWORD(var_args){
var args__5732__auto__ = [];
var len__5726__auto___74326 = arguments.length;
var i__5727__auto___74327 = (0);
while(true){
if((i__5727__auto___74327 < len__5726__auto___74326)){
args__5732__auto__.push((arguments[i__5727__auto___74327]));

var G__74329 = (i__5727__auto___74327 + (1));
i__5727__auto___74327 = G__74329;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return camel_snake_kebab.core.__GT_SCREAMING_SNAKE_CASE_KEYWORD.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(camel_snake_kebab.core.__GT_SCREAMING_SNAKE_CASE_KEYWORD.cljs$core$IFn$_invoke$arity$variadic = (function (s__73904__auto__,rest__73905__auto__){
return cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(cljs.core.apply.cljs$core$IFn$_invoke$arity$variadic(camel_snake_kebab.internals.misc.convert_case,clojure.string.upper_case,clojure.string.upper_case,"_",cljs.core.name(s__73904__auto__),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([rest__73905__auto__], 0)));
}));

(camel_snake_kebab.core.__GT_SCREAMING_SNAKE_CASE_KEYWORD.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(camel_snake_kebab.core.__GT_SCREAMING_SNAKE_CASE_KEYWORD.cljs$lang$applyTo = (function (seq74103){
var G__74104 = cljs.core.first(seq74103);
var seq74103__$1 = cljs.core.next(seq74103);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__74104,seq74103__$1);
}));

camel_snake_kebab.core.__GT_snake_case = (function camel_snake_kebab$core$__GT_snake_case(var_args){
var args__5732__auto__ = [];
var len__5726__auto___74333 = arguments.length;
var i__5727__auto___74334 = (0);
while(true){
if((i__5727__auto___74334 < len__5726__auto___74333)){
args__5732__auto__.push((arguments[i__5727__auto___74334]));

var G__74335 = (i__5727__auto___74334 + (1));
i__5727__auto___74334 = G__74335;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return camel_snake_kebab.core.__GT_snake_case.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(camel_snake_kebab.core.__GT_snake_case.cljs$core$IFn$_invoke$arity$variadic = (function (s__73899__auto__,rest__73900__auto__){
var convert_case__73901__auto__ = (function (p1__73898__73902__auto__){
return cljs.core.apply.cljs$core$IFn$_invoke$arity$variadic(camel_snake_kebab.internals.misc.convert_case,clojure.string.lower_case,clojure.string.lower_case,"_",p1__73898__73902__auto__,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([rest__73900__auto__], 0));
});
return camel_snake_kebab.internals.alter_name.alter_name(s__73899__auto__,convert_case__73901__auto__);
}));

(camel_snake_kebab.core.__GT_snake_case.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(camel_snake_kebab.core.__GT_snake_case.cljs$lang$applyTo = (function (seq74120){
var G__74121 = cljs.core.first(seq74120);
var seq74120__$1 = cljs.core.next(seq74120);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__74121,seq74120__$1);
}));


camel_snake_kebab.core.__GT_snake_case_string = (function camel_snake_kebab$core$__GT_snake_case_string(var_args){
var args__5732__auto__ = [];
var len__5726__auto___74336 = arguments.length;
var i__5727__auto___74337 = (0);
while(true){
if((i__5727__auto___74337 < len__5726__auto___74336)){
args__5732__auto__.push((arguments[i__5727__auto___74337]));

var G__74338 = (i__5727__auto___74337 + (1));
i__5727__auto___74337 = G__74338;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return camel_snake_kebab.core.__GT_snake_case_string.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(camel_snake_kebab.core.__GT_snake_case_string.cljs$core$IFn$_invoke$arity$variadic = (function (s__73904__auto__,rest__73905__auto__){
return cljs.core.identity(cljs.core.apply.cljs$core$IFn$_invoke$arity$variadic(camel_snake_kebab.internals.misc.convert_case,clojure.string.lower_case,clojure.string.lower_case,"_",cljs.core.name(s__73904__auto__),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([rest__73905__auto__], 0)));
}));

(camel_snake_kebab.core.__GT_snake_case_string.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(camel_snake_kebab.core.__GT_snake_case_string.cljs$lang$applyTo = (function (seq74133){
var G__74134 = cljs.core.first(seq74133);
var seq74133__$1 = cljs.core.next(seq74133);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__74134,seq74133__$1);
}));


camel_snake_kebab.core.__GT_snake_case_symbol = (function camel_snake_kebab$core$__GT_snake_case_symbol(var_args){
var args__5732__auto__ = [];
var len__5726__auto___74340 = arguments.length;
var i__5727__auto___74341 = (0);
while(true){
if((i__5727__auto___74341 < len__5726__auto___74340)){
args__5732__auto__.push((arguments[i__5727__auto___74341]));

var G__74343 = (i__5727__auto___74341 + (1));
i__5727__auto___74341 = G__74343;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return camel_snake_kebab.core.__GT_snake_case_symbol.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(camel_snake_kebab.core.__GT_snake_case_symbol.cljs$core$IFn$_invoke$arity$variadic = (function (s__73904__auto__,rest__73905__auto__){
return cljs.core.symbol.cljs$core$IFn$_invoke$arity$1(cljs.core.apply.cljs$core$IFn$_invoke$arity$variadic(camel_snake_kebab.internals.misc.convert_case,clojure.string.lower_case,clojure.string.lower_case,"_",cljs.core.name(s__73904__auto__),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([rest__73905__auto__], 0)));
}));

(camel_snake_kebab.core.__GT_snake_case_symbol.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(camel_snake_kebab.core.__GT_snake_case_symbol.cljs$lang$applyTo = (function (seq74146){
var G__74147 = cljs.core.first(seq74146);
var seq74146__$1 = cljs.core.next(seq74146);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__74147,seq74146__$1);
}));


camel_snake_kebab.core.__GT_snake_case_keyword = (function camel_snake_kebab$core$__GT_snake_case_keyword(var_args){
var args__5732__auto__ = [];
var len__5726__auto___74344 = arguments.length;
var i__5727__auto___74345 = (0);
while(true){
if((i__5727__auto___74345 < len__5726__auto___74344)){
args__5732__auto__.push((arguments[i__5727__auto___74345]));

var G__74346 = (i__5727__auto___74345 + (1));
i__5727__auto___74345 = G__74346;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return camel_snake_kebab.core.__GT_snake_case_keyword.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(camel_snake_kebab.core.__GT_snake_case_keyword.cljs$core$IFn$_invoke$arity$variadic = (function (s__73904__auto__,rest__73905__auto__){
return cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(cljs.core.apply.cljs$core$IFn$_invoke$arity$variadic(camel_snake_kebab.internals.misc.convert_case,clojure.string.lower_case,clojure.string.lower_case,"_",cljs.core.name(s__73904__auto__),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([rest__73905__auto__], 0)));
}));

(camel_snake_kebab.core.__GT_snake_case_keyword.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(camel_snake_kebab.core.__GT_snake_case_keyword.cljs$lang$applyTo = (function (seq74152){
var G__74153 = cljs.core.first(seq74152);
var seq74152__$1 = cljs.core.next(seq74152);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__74153,seq74152__$1);
}));

camel_snake_kebab.core.__GT_kebab_case = (function camel_snake_kebab$core$__GT_kebab_case(var_args){
var args__5732__auto__ = [];
var len__5726__auto___74350 = arguments.length;
var i__5727__auto___74351 = (0);
while(true){
if((i__5727__auto___74351 < len__5726__auto___74350)){
args__5732__auto__.push((arguments[i__5727__auto___74351]));

var G__74355 = (i__5727__auto___74351 + (1));
i__5727__auto___74351 = G__74355;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return camel_snake_kebab.core.__GT_kebab_case.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(camel_snake_kebab.core.__GT_kebab_case.cljs$core$IFn$_invoke$arity$variadic = (function (s__73899__auto__,rest__73900__auto__){
var convert_case__73901__auto__ = (function (p1__73898__73902__auto__){
return cljs.core.apply.cljs$core$IFn$_invoke$arity$variadic(camel_snake_kebab.internals.misc.convert_case,clojure.string.lower_case,clojure.string.lower_case,"-",p1__73898__73902__auto__,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([rest__73900__auto__], 0));
});
return camel_snake_kebab.internals.alter_name.alter_name(s__73899__auto__,convert_case__73901__auto__);
}));

(camel_snake_kebab.core.__GT_kebab_case.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(camel_snake_kebab.core.__GT_kebab_case.cljs$lang$applyTo = (function (seq74159){
var G__74160 = cljs.core.first(seq74159);
var seq74159__$1 = cljs.core.next(seq74159);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__74160,seq74159__$1);
}));


camel_snake_kebab.core.__GT_kebab_case_string = (function camel_snake_kebab$core$__GT_kebab_case_string(var_args){
var args__5732__auto__ = [];
var len__5726__auto___74356 = arguments.length;
var i__5727__auto___74357 = (0);
while(true){
if((i__5727__auto___74357 < len__5726__auto___74356)){
args__5732__auto__.push((arguments[i__5727__auto___74357]));

var G__74358 = (i__5727__auto___74357 + (1));
i__5727__auto___74357 = G__74358;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return camel_snake_kebab.core.__GT_kebab_case_string.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(camel_snake_kebab.core.__GT_kebab_case_string.cljs$core$IFn$_invoke$arity$variadic = (function (s__73904__auto__,rest__73905__auto__){
return cljs.core.identity(cljs.core.apply.cljs$core$IFn$_invoke$arity$variadic(camel_snake_kebab.internals.misc.convert_case,clojure.string.lower_case,clojure.string.lower_case,"-",cljs.core.name(s__73904__auto__),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([rest__73905__auto__], 0)));
}));

(camel_snake_kebab.core.__GT_kebab_case_string.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(camel_snake_kebab.core.__GT_kebab_case_string.cljs$lang$applyTo = (function (seq74169){
var G__74170 = cljs.core.first(seq74169);
var seq74169__$1 = cljs.core.next(seq74169);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__74170,seq74169__$1);
}));


camel_snake_kebab.core.__GT_kebab_case_symbol = (function camel_snake_kebab$core$__GT_kebab_case_symbol(var_args){
var args__5732__auto__ = [];
var len__5726__auto___74359 = arguments.length;
var i__5727__auto___74360 = (0);
while(true){
if((i__5727__auto___74360 < len__5726__auto___74359)){
args__5732__auto__.push((arguments[i__5727__auto___74360]));

var G__74361 = (i__5727__auto___74360 + (1));
i__5727__auto___74360 = G__74361;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return camel_snake_kebab.core.__GT_kebab_case_symbol.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(camel_snake_kebab.core.__GT_kebab_case_symbol.cljs$core$IFn$_invoke$arity$variadic = (function (s__73904__auto__,rest__73905__auto__){
return cljs.core.symbol.cljs$core$IFn$_invoke$arity$1(cljs.core.apply.cljs$core$IFn$_invoke$arity$variadic(camel_snake_kebab.internals.misc.convert_case,clojure.string.lower_case,clojure.string.lower_case,"-",cljs.core.name(s__73904__auto__),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([rest__73905__auto__], 0)));
}));

(camel_snake_kebab.core.__GT_kebab_case_symbol.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(camel_snake_kebab.core.__GT_kebab_case_symbol.cljs$lang$applyTo = (function (seq74176){
var G__74177 = cljs.core.first(seq74176);
var seq74176__$1 = cljs.core.next(seq74176);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__74177,seq74176__$1);
}));


camel_snake_kebab.core.__GT_kebab_case_keyword = (function camel_snake_kebab$core$__GT_kebab_case_keyword(var_args){
var args__5732__auto__ = [];
var len__5726__auto___74363 = arguments.length;
var i__5727__auto___74364 = (0);
while(true){
if((i__5727__auto___74364 < len__5726__auto___74363)){
args__5732__auto__.push((arguments[i__5727__auto___74364]));

var G__74365 = (i__5727__auto___74364 + (1));
i__5727__auto___74364 = G__74365;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return camel_snake_kebab.core.__GT_kebab_case_keyword.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(camel_snake_kebab.core.__GT_kebab_case_keyword.cljs$core$IFn$_invoke$arity$variadic = (function (s__73904__auto__,rest__73905__auto__){
return cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(cljs.core.apply.cljs$core$IFn$_invoke$arity$variadic(camel_snake_kebab.internals.misc.convert_case,clojure.string.lower_case,clojure.string.lower_case,"-",cljs.core.name(s__73904__auto__),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([rest__73905__auto__], 0)));
}));

(camel_snake_kebab.core.__GT_kebab_case_keyword.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(camel_snake_kebab.core.__GT_kebab_case_keyword.cljs$lang$applyTo = (function (seq74188){
var G__74189 = cljs.core.first(seq74188);
var seq74188__$1 = cljs.core.next(seq74188);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__74189,seq74188__$1);
}));

camel_snake_kebab.core.__GT_HTTP_Header_Case = (function camel_snake_kebab$core$__GT_HTTP_Header_Case(var_args){
var args__5732__auto__ = [];
var len__5726__auto___74368 = arguments.length;
var i__5727__auto___74369 = (0);
while(true){
if((i__5727__auto___74369 < len__5726__auto___74368)){
args__5732__auto__.push((arguments[i__5727__auto___74369]));

var G__74370 = (i__5727__auto___74369 + (1));
i__5727__auto___74369 = G__74370;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return camel_snake_kebab.core.__GT_HTTP_Header_Case.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(camel_snake_kebab.core.__GT_HTTP_Header_Case.cljs$core$IFn$_invoke$arity$variadic = (function (s__73899__auto__,rest__73900__auto__){
var convert_case__73901__auto__ = (function (p1__73898__73902__auto__){
return cljs.core.apply.cljs$core$IFn$_invoke$arity$variadic(camel_snake_kebab.internals.misc.convert_case,camel_snake_kebab.internals.misc.capitalize_http_header,camel_snake_kebab.internals.misc.capitalize_http_header,"-",p1__73898__73902__auto__,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([rest__73900__auto__], 0));
});
return camel_snake_kebab.internals.alter_name.alter_name(s__73899__auto__,convert_case__73901__auto__);
}));

(camel_snake_kebab.core.__GT_HTTP_Header_Case.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(camel_snake_kebab.core.__GT_HTTP_Header_Case.cljs$lang$applyTo = (function (seq74197){
var G__74198 = cljs.core.first(seq74197);
var seq74197__$1 = cljs.core.next(seq74197);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__74198,seq74197__$1);
}));


camel_snake_kebab.core.__GT_HTTP_Header_Case_String = (function camel_snake_kebab$core$__GT_HTTP_Header_Case_String(var_args){
var args__5732__auto__ = [];
var len__5726__auto___74373 = arguments.length;
var i__5727__auto___74374 = (0);
while(true){
if((i__5727__auto___74374 < len__5726__auto___74373)){
args__5732__auto__.push((arguments[i__5727__auto___74374]));

var G__74375 = (i__5727__auto___74374 + (1));
i__5727__auto___74374 = G__74375;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return camel_snake_kebab.core.__GT_HTTP_Header_Case_String.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(camel_snake_kebab.core.__GT_HTTP_Header_Case_String.cljs$core$IFn$_invoke$arity$variadic = (function (s__73904__auto__,rest__73905__auto__){
return cljs.core.identity(cljs.core.apply.cljs$core$IFn$_invoke$arity$variadic(camel_snake_kebab.internals.misc.convert_case,camel_snake_kebab.internals.misc.capitalize_http_header,camel_snake_kebab.internals.misc.capitalize_http_header,"-",cljs.core.name(s__73904__auto__),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([rest__73905__auto__], 0)));
}));

(camel_snake_kebab.core.__GT_HTTP_Header_Case_String.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(camel_snake_kebab.core.__GT_HTTP_Header_Case_String.cljs$lang$applyTo = (function (seq74209){
var G__74210 = cljs.core.first(seq74209);
var seq74209__$1 = cljs.core.next(seq74209);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__74210,seq74209__$1);
}));


camel_snake_kebab.core.__GT_HTTP_Header_Case_Symbol = (function camel_snake_kebab$core$__GT_HTTP_Header_Case_Symbol(var_args){
var args__5732__auto__ = [];
var len__5726__auto___74377 = arguments.length;
var i__5727__auto___74378 = (0);
while(true){
if((i__5727__auto___74378 < len__5726__auto___74377)){
args__5732__auto__.push((arguments[i__5727__auto___74378]));

var G__74380 = (i__5727__auto___74378 + (1));
i__5727__auto___74378 = G__74380;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return camel_snake_kebab.core.__GT_HTTP_Header_Case_Symbol.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(camel_snake_kebab.core.__GT_HTTP_Header_Case_Symbol.cljs$core$IFn$_invoke$arity$variadic = (function (s__73904__auto__,rest__73905__auto__){
return cljs.core.symbol.cljs$core$IFn$_invoke$arity$1(cljs.core.apply.cljs$core$IFn$_invoke$arity$variadic(camel_snake_kebab.internals.misc.convert_case,camel_snake_kebab.internals.misc.capitalize_http_header,camel_snake_kebab.internals.misc.capitalize_http_header,"-",cljs.core.name(s__73904__auto__),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([rest__73905__auto__], 0)));
}));

(camel_snake_kebab.core.__GT_HTTP_Header_Case_Symbol.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(camel_snake_kebab.core.__GT_HTTP_Header_Case_Symbol.cljs$lang$applyTo = (function (seq74219){
var G__74220 = cljs.core.first(seq74219);
var seq74219__$1 = cljs.core.next(seq74219);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__74220,seq74219__$1);
}));


camel_snake_kebab.core.__GT_HTTP_Header_Case_Keyword = (function camel_snake_kebab$core$__GT_HTTP_Header_Case_Keyword(var_args){
var args__5732__auto__ = [];
var len__5726__auto___74382 = arguments.length;
var i__5727__auto___74383 = (0);
while(true){
if((i__5727__auto___74383 < len__5726__auto___74382)){
args__5732__auto__.push((arguments[i__5727__auto___74383]));

var G__74384 = (i__5727__auto___74383 + (1));
i__5727__auto___74383 = G__74384;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return camel_snake_kebab.core.__GT_HTTP_Header_Case_Keyword.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(camel_snake_kebab.core.__GT_HTTP_Header_Case_Keyword.cljs$core$IFn$_invoke$arity$variadic = (function (s__73904__auto__,rest__73905__auto__){
return cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(cljs.core.apply.cljs$core$IFn$_invoke$arity$variadic(camel_snake_kebab.internals.misc.convert_case,camel_snake_kebab.internals.misc.capitalize_http_header,camel_snake_kebab.internals.misc.capitalize_http_header,"-",cljs.core.name(s__73904__auto__),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([rest__73905__auto__], 0)));
}));

(camel_snake_kebab.core.__GT_HTTP_Header_Case_Keyword.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(camel_snake_kebab.core.__GT_HTTP_Header_Case_Keyword.cljs$lang$applyTo = (function (seq74234){
var G__74235 = cljs.core.first(seq74234);
var seq74234__$1 = cljs.core.next(seq74234);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__74235,seq74234__$1);
}));


//# sourceMappingURL=camel_snake_kebab.core.js.map
