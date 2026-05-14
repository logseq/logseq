goog.provide('sci.impl.fns');
sci.impl.fns.fun = (function sci$impl$fns$fun(ctx,enclosed_array,bindings,fn_body,fn_name,macro_QMARK_){
var fixed_arity = new cljs.core.Keyword(null,"fixed-arity","fixed-arity",1586445869).cljs$core$IFn$_invoke$arity$1(fn_body);
var enclosed__GT_invocation = new cljs.core.Keyword(null,"copy-enclosed->invocation","copy-enclosed->invocation",-1322388729).cljs$core$IFn$_invoke$arity$1(fn_body);
var var_arg_name = new cljs.core.Keyword(null,"var-arg-name","var-arg-name",-1100024887).cljs$core$IFn$_invoke$arity$1(fn_body);
var params = new cljs.core.Keyword(null,"params","params",710516235).cljs$core$IFn$_invoke$arity$1(fn_body);
var body = new cljs.core.Keyword(null,"body","body",-2049205669).cljs$core$IFn$_invoke$arity$1(fn_body);
var invoc_size = new cljs.core.Keyword(null,"invoc-size","invoc-size",2053298058).cljs$core$IFn$_invoke$arity$1(fn_body);
var self_ref_idx = new cljs.core.Keyword(null,"self-ref-idx","self-ref-idx",-1384537812).cljs$core$IFn$_invoke$arity$1(fn_body);
var nsm = sci.impl.vars.current_ns_name();
var vararg_idx = new cljs.core.Keyword(null,"vararg-idx","vararg-idx",-590991228).cljs$core$IFn$_invoke$arity$1(fn_body);
var f = (cljs.core.truth_(vararg_idx)?(function (){var G__88227 = (fixed_arity | (0));
switch (G__88227) {
case (0):
return (function() { 
var sci$impl$fns$fun_$_arity_0__delegate = function (G__88228){
var invoc_array = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1(invoc_size);
if(cljs.core.truth_(enclosed__GT_invocation)){
(enclosed__GT_invocation.cljs$core$IFn$_invoke$arity$2 ? enclosed__GT_invocation.cljs$core$IFn$_invoke$arity$2(enclosed_array,invoc_array) : enclosed__GT_invocation.call(null,enclosed_array,invoc_array));
} else {
}

(invoc_array[vararg_idx] = G__88228);

while(true){
var ret__87203__auto__ = sci.impl.types.eval(body,ctx,invoc_array);
if(cljs.core.keyword_identical_QMARK_(new cljs.core.Keyword("sci.impl.analyzer","recur","sci.impl.analyzer/recur",2033369355),ret__87203__auto__)){
continue;
} else {
return ret__87203__auto__;
}
break;
}
};
var sci$impl$fns$fun_$_arity_0 = function (var_args){
var G__88228 = null;
if (arguments.length > 0) {
var G__89254__i = 0, G__89254__a = new Array(arguments.length -  0);
while (G__89254__i < G__89254__a.length) {G__89254__a[G__89254__i] = arguments[G__89254__i + 0]; ++G__89254__i;}
  G__88228 = new cljs.core.IndexedSeq(G__89254__a,0,null);
} 
return sci$impl$fns$fun_$_arity_0__delegate.call(this,G__88228);};
sci$impl$fns$fun_$_arity_0.cljs$lang$maxFixedArity = 0;
sci$impl$fns$fun_$_arity_0.cljs$lang$applyTo = (function (arglist__89255){
var G__88228 = cljs.core.seq(arglist__89255);
return sci$impl$fns$fun_$_arity_0__delegate(G__88228);
});
sci$impl$fns$fun_$_arity_0.cljs$core$IFn$_invoke$arity$variadic = sci$impl$fns$fun_$_arity_0__delegate;
return sci$impl$fns$fun_$_arity_0;
})()
;

break;
case (1):
var G__88233 = cljs.core._nth(params,(0));
return (function() { 
var sci$impl$fns$fun_$_arity_1__delegate = function (G__88231,G__88232){
var invoc_array = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1(invoc_size);
if(cljs.core.truth_(enclosed__GT_invocation)){
(enclosed__GT_invocation.cljs$core$IFn$_invoke$arity$2 ? enclosed__GT_invocation.cljs$core$IFn$_invoke$arity$2(enclosed_array,invoc_array) : enclosed__GT_invocation.call(null,enclosed_array,invoc_array));
} else {
}

(invoc_array[(0)] = G__88231);

(invoc_array[vararg_idx] = G__88232);

while(true){
var ret__87204__auto__ = sci.impl.types.eval(body,ctx,invoc_array);
if(cljs.core.keyword_identical_QMARK_(new cljs.core.Keyword("sci.impl.analyzer","recur","sci.impl.analyzer/recur",2033369355),ret__87204__auto__)){
continue;
} else {
return ret__87204__auto__;
}
break;
}
};
var sci$impl$fns$fun_$_arity_1 = function (G__88231,var_args){
var G__88232 = null;
if (arguments.length > 1) {
var G__89257__i = 0, G__89257__a = new Array(arguments.length -  1);
while (G__89257__i < G__89257__a.length) {G__89257__a[G__89257__i] = arguments[G__89257__i + 1]; ++G__89257__i;}
  G__88232 = new cljs.core.IndexedSeq(G__89257__a,0,null);
} 
return sci$impl$fns$fun_$_arity_1__delegate.call(this,G__88231,G__88232);};
sci$impl$fns$fun_$_arity_1.cljs$lang$maxFixedArity = 1;
sci$impl$fns$fun_$_arity_1.cljs$lang$applyTo = (function (arglist__89258){
var G__88231 = cljs.core.first(arglist__89258);
var G__88232 = cljs.core.rest(arglist__89258);
return sci$impl$fns$fun_$_arity_1__delegate(G__88231,G__88232);
});
sci$impl$fns$fun_$_arity_1.cljs$core$IFn$_invoke$arity$variadic = sci$impl$fns$fun_$_arity_1__delegate;
return sci$impl$fns$fun_$_arity_1;
})()
;

break;
case (2):
var G__88240 = cljs.core._nth(params,(0));
var G__88241 = cljs.core._nth(params,(1));
return (function() { 
var sci$impl$fns$fun_$_arity_2__delegate = function (G__88237,G__88238,G__88239){
var invoc_array = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1(invoc_size);
if(cljs.core.truth_(enclosed__GT_invocation)){
(enclosed__GT_invocation.cljs$core$IFn$_invoke$arity$2 ? enclosed__GT_invocation.cljs$core$IFn$_invoke$arity$2(enclosed_array,invoc_array) : enclosed__GT_invocation.call(null,enclosed_array,invoc_array));
} else {
}

(invoc_array[(0)] = G__88237);

(invoc_array[(1)] = G__88238);

(invoc_array[vararg_idx] = G__88239);

while(true){
var ret__87204__auto__ = sci.impl.types.eval(body,ctx,invoc_array);
if(cljs.core.keyword_identical_QMARK_(new cljs.core.Keyword("sci.impl.analyzer","recur","sci.impl.analyzer/recur",2033369355),ret__87204__auto__)){
continue;
} else {
return ret__87204__auto__;
}
break;
}
};
var sci$impl$fns$fun_$_arity_2 = function (G__88237,G__88238,var_args){
var G__88239 = null;
if (arguments.length > 2) {
var G__89259__i = 0, G__89259__a = new Array(arguments.length -  2);
while (G__89259__i < G__89259__a.length) {G__89259__a[G__89259__i] = arguments[G__89259__i + 2]; ++G__89259__i;}
  G__88239 = new cljs.core.IndexedSeq(G__89259__a,0,null);
} 
return sci$impl$fns$fun_$_arity_2__delegate.call(this,G__88237,G__88238,G__88239);};
sci$impl$fns$fun_$_arity_2.cljs$lang$maxFixedArity = 2;
sci$impl$fns$fun_$_arity_2.cljs$lang$applyTo = (function (arglist__89260){
var G__88237 = cljs.core.first(arglist__89260);
arglist__89260 = cljs.core.next(arglist__89260);
var G__88238 = cljs.core.first(arglist__89260);
var G__88239 = cljs.core.rest(arglist__89260);
return sci$impl$fns$fun_$_arity_2__delegate(G__88237,G__88238,G__88239);
});
sci$impl$fns$fun_$_arity_2.cljs$core$IFn$_invoke$arity$variadic = sci$impl$fns$fun_$_arity_2__delegate;
return sci$impl$fns$fun_$_arity_2;
})()
;

break;
case (3):
var G__88247 = cljs.core._nth(params,(0));
var G__88248 = cljs.core._nth(params,(1));
var G__88249 = cljs.core._nth(params,(2));
return (function() { 
var sci$impl$fns$fun_$_arity_3__delegate = function (G__88243,G__88244,G__88245,G__88246){
var invoc_array = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1(invoc_size);
if(cljs.core.truth_(enclosed__GT_invocation)){
(enclosed__GT_invocation.cljs$core$IFn$_invoke$arity$2 ? enclosed__GT_invocation.cljs$core$IFn$_invoke$arity$2(enclosed_array,invoc_array) : enclosed__GT_invocation.call(null,enclosed_array,invoc_array));
} else {
}

(invoc_array[(0)] = G__88243);

(invoc_array[(1)] = G__88244);

(invoc_array[(2)] = G__88245);

(invoc_array[vararg_idx] = G__88246);

while(true){
var ret__87204__auto__ = sci.impl.types.eval(body,ctx,invoc_array);
if(cljs.core.keyword_identical_QMARK_(new cljs.core.Keyword("sci.impl.analyzer","recur","sci.impl.analyzer/recur",2033369355),ret__87204__auto__)){
continue;
} else {
return ret__87204__auto__;
}
break;
}
};
var sci$impl$fns$fun_$_arity_3 = function (G__88243,G__88244,G__88245,var_args){
var G__88246 = null;
if (arguments.length > 3) {
var G__89261__i = 0, G__89261__a = new Array(arguments.length -  3);
while (G__89261__i < G__89261__a.length) {G__89261__a[G__89261__i] = arguments[G__89261__i + 3]; ++G__89261__i;}
  G__88246 = new cljs.core.IndexedSeq(G__89261__a,0,null);
} 
return sci$impl$fns$fun_$_arity_3__delegate.call(this,G__88243,G__88244,G__88245,G__88246);};
sci$impl$fns$fun_$_arity_3.cljs$lang$maxFixedArity = 3;
sci$impl$fns$fun_$_arity_3.cljs$lang$applyTo = (function (arglist__89262){
var G__88243 = cljs.core.first(arglist__89262);
arglist__89262 = cljs.core.next(arglist__89262);
var G__88244 = cljs.core.first(arglist__89262);
arglist__89262 = cljs.core.next(arglist__89262);
var G__88245 = cljs.core.first(arglist__89262);
var G__88246 = cljs.core.rest(arglist__89262);
return sci$impl$fns$fun_$_arity_3__delegate(G__88243,G__88244,G__88245,G__88246);
});
sci$impl$fns$fun_$_arity_3.cljs$core$IFn$_invoke$arity$variadic = sci$impl$fns$fun_$_arity_3__delegate;
return sci$impl$fns$fun_$_arity_3;
})()
;

break;
case (4):
var G__88255 = cljs.core._nth(params,(0));
var G__88256 = cljs.core._nth(params,(1));
var G__88257 = cljs.core._nth(params,(2));
var G__88258 = cljs.core._nth(params,(3));
return (function() { 
var sci$impl$fns$fun_$_arity_4__delegate = function (G__88250,G__88251,G__88252,G__88253,G__88254){
var invoc_array = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1(invoc_size);
if(cljs.core.truth_(enclosed__GT_invocation)){
(enclosed__GT_invocation.cljs$core$IFn$_invoke$arity$2 ? enclosed__GT_invocation.cljs$core$IFn$_invoke$arity$2(enclosed_array,invoc_array) : enclosed__GT_invocation.call(null,enclosed_array,invoc_array));
} else {
}

(invoc_array[(0)] = G__88250);

(invoc_array[(1)] = G__88251);

(invoc_array[(2)] = G__88252);

(invoc_array[(3)] = G__88253);

(invoc_array[vararg_idx] = G__88254);

while(true){
var ret__87204__auto__ = sci.impl.types.eval(body,ctx,invoc_array);
if(cljs.core.keyword_identical_QMARK_(new cljs.core.Keyword("sci.impl.analyzer","recur","sci.impl.analyzer/recur",2033369355),ret__87204__auto__)){
continue;
} else {
return ret__87204__auto__;
}
break;
}
};
var sci$impl$fns$fun_$_arity_4 = function (G__88250,G__88251,G__88252,G__88253,var_args){
var G__88254 = null;
if (arguments.length > 4) {
var G__89263__i = 0, G__89263__a = new Array(arguments.length -  4);
while (G__89263__i < G__89263__a.length) {G__89263__a[G__89263__i] = arguments[G__89263__i + 4]; ++G__89263__i;}
  G__88254 = new cljs.core.IndexedSeq(G__89263__a,0,null);
} 
return sci$impl$fns$fun_$_arity_4__delegate.call(this,G__88250,G__88251,G__88252,G__88253,G__88254);};
sci$impl$fns$fun_$_arity_4.cljs$lang$maxFixedArity = 4;
sci$impl$fns$fun_$_arity_4.cljs$lang$applyTo = (function (arglist__89264){
var G__88250 = cljs.core.first(arglist__89264);
arglist__89264 = cljs.core.next(arglist__89264);
var G__88251 = cljs.core.first(arglist__89264);
arglist__89264 = cljs.core.next(arglist__89264);
var G__88252 = cljs.core.first(arglist__89264);
arglist__89264 = cljs.core.next(arglist__89264);
var G__88253 = cljs.core.first(arglist__89264);
var G__88254 = cljs.core.rest(arglist__89264);
return sci$impl$fns$fun_$_arity_4__delegate(G__88250,G__88251,G__88252,G__88253,G__88254);
});
sci$impl$fns$fun_$_arity_4.cljs$core$IFn$_invoke$arity$variadic = sci$impl$fns$fun_$_arity_4__delegate;
return sci$impl$fns$fun_$_arity_4;
})()
;

break;
case (5):
var G__88265 = cljs.core._nth(params,(0));
var G__88266 = cljs.core._nth(params,(1));
var G__88267 = cljs.core._nth(params,(2));
var G__88268 = cljs.core._nth(params,(3));
var G__88269 = cljs.core._nth(params,(4));
return (function() { 
var sci$impl$fns$fun_$_arity_5__delegate = function (G__88259,G__88260,G__88261,G__88262,G__88263,G__88264){
var invoc_array = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1(invoc_size);
if(cljs.core.truth_(enclosed__GT_invocation)){
(enclosed__GT_invocation.cljs$core$IFn$_invoke$arity$2 ? enclosed__GT_invocation.cljs$core$IFn$_invoke$arity$2(enclosed_array,invoc_array) : enclosed__GT_invocation.call(null,enclosed_array,invoc_array));
} else {
}

(invoc_array[(0)] = G__88259);

(invoc_array[(1)] = G__88260);

(invoc_array[(2)] = G__88261);

(invoc_array[(3)] = G__88262);

(invoc_array[(4)] = G__88263);

(invoc_array[vararg_idx] = G__88264);

while(true){
var ret__87204__auto__ = sci.impl.types.eval(body,ctx,invoc_array);
if(cljs.core.keyword_identical_QMARK_(new cljs.core.Keyword("sci.impl.analyzer","recur","sci.impl.analyzer/recur",2033369355),ret__87204__auto__)){
continue;
} else {
return ret__87204__auto__;
}
break;
}
};
var sci$impl$fns$fun_$_arity_5 = function (G__88259,G__88260,G__88261,G__88262,G__88263,var_args){
var G__88264 = null;
if (arguments.length > 5) {
var G__89267__i = 0, G__89267__a = new Array(arguments.length -  5);
while (G__89267__i < G__89267__a.length) {G__89267__a[G__89267__i] = arguments[G__89267__i + 5]; ++G__89267__i;}
  G__88264 = new cljs.core.IndexedSeq(G__89267__a,0,null);
} 
return sci$impl$fns$fun_$_arity_5__delegate.call(this,G__88259,G__88260,G__88261,G__88262,G__88263,G__88264);};
sci$impl$fns$fun_$_arity_5.cljs$lang$maxFixedArity = 5;
sci$impl$fns$fun_$_arity_5.cljs$lang$applyTo = (function (arglist__89268){
var G__88259 = cljs.core.first(arglist__89268);
arglist__89268 = cljs.core.next(arglist__89268);
var G__88260 = cljs.core.first(arglist__89268);
arglist__89268 = cljs.core.next(arglist__89268);
var G__88261 = cljs.core.first(arglist__89268);
arglist__89268 = cljs.core.next(arglist__89268);
var G__88262 = cljs.core.first(arglist__89268);
arglist__89268 = cljs.core.next(arglist__89268);
var G__88263 = cljs.core.first(arglist__89268);
var G__88264 = cljs.core.rest(arglist__89268);
return sci$impl$fns$fun_$_arity_5__delegate(G__88259,G__88260,G__88261,G__88262,G__88263,G__88264);
});
sci$impl$fns$fun_$_arity_5.cljs$core$IFn$_invoke$arity$variadic = sci$impl$fns$fun_$_arity_5__delegate;
return sci$impl$fns$fun_$_arity_5;
})()
;

break;
case (6):
var G__88279 = cljs.core._nth(params,(0));
var G__88280 = cljs.core._nth(params,(1));
var G__88281 = cljs.core._nth(params,(2));
var G__88282 = cljs.core._nth(params,(3));
var G__88283 = cljs.core._nth(params,(4));
var G__88284 = cljs.core._nth(params,(5));
return (function() { 
var sci$impl$fns$fun_$_arity_6__delegate = function (G__88272,G__88273,G__88274,G__88275,G__88276,G__88277,G__88278){
var invoc_array = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1(invoc_size);
if(cljs.core.truth_(enclosed__GT_invocation)){
(enclosed__GT_invocation.cljs$core$IFn$_invoke$arity$2 ? enclosed__GT_invocation.cljs$core$IFn$_invoke$arity$2(enclosed_array,invoc_array) : enclosed__GT_invocation.call(null,enclosed_array,invoc_array));
} else {
}

(invoc_array[(0)] = G__88272);

(invoc_array[(1)] = G__88273);

(invoc_array[(2)] = G__88274);

(invoc_array[(3)] = G__88275);

(invoc_array[(4)] = G__88276);

(invoc_array[(5)] = G__88277);

(invoc_array[vararg_idx] = G__88278);

while(true){
var ret__87204__auto__ = sci.impl.types.eval(body,ctx,invoc_array);
if(cljs.core.keyword_identical_QMARK_(new cljs.core.Keyword("sci.impl.analyzer","recur","sci.impl.analyzer/recur",2033369355),ret__87204__auto__)){
continue;
} else {
return ret__87204__auto__;
}
break;
}
};
var sci$impl$fns$fun_$_arity_6 = function (G__88272,G__88273,G__88274,G__88275,G__88276,G__88277,var_args){
var G__88278 = null;
if (arguments.length > 6) {
var G__89271__i = 0, G__89271__a = new Array(arguments.length -  6);
while (G__89271__i < G__89271__a.length) {G__89271__a[G__89271__i] = arguments[G__89271__i + 6]; ++G__89271__i;}
  G__88278 = new cljs.core.IndexedSeq(G__89271__a,0,null);
} 
return sci$impl$fns$fun_$_arity_6__delegate.call(this,G__88272,G__88273,G__88274,G__88275,G__88276,G__88277,G__88278);};
sci$impl$fns$fun_$_arity_6.cljs$lang$maxFixedArity = 6;
sci$impl$fns$fun_$_arity_6.cljs$lang$applyTo = (function (arglist__89272){
var G__88272 = cljs.core.first(arglist__89272);
arglist__89272 = cljs.core.next(arglist__89272);
var G__88273 = cljs.core.first(arglist__89272);
arglist__89272 = cljs.core.next(arglist__89272);
var G__88274 = cljs.core.first(arglist__89272);
arglist__89272 = cljs.core.next(arglist__89272);
var G__88275 = cljs.core.first(arglist__89272);
arglist__89272 = cljs.core.next(arglist__89272);
var G__88276 = cljs.core.first(arglist__89272);
arglist__89272 = cljs.core.next(arglist__89272);
var G__88277 = cljs.core.first(arglist__89272);
var G__88278 = cljs.core.rest(arglist__89272);
return sci$impl$fns$fun_$_arity_6__delegate(G__88272,G__88273,G__88274,G__88275,G__88276,G__88277,G__88278);
});
sci$impl$fns$fun_$_arity_6.cljs$core$IFn$_invoke$arity$variadic = sci$impl$fns$fun_$_arity_6__delegate;
return sci$impl$fns$fun_$_arity_6;
})()
;

break;
case (7):
var G__88295 = cljs.core._nth(params,(0));
var G__88296 = cljs.core._nth(params,(1));
var G__88297 = cljs.core._nth(params,(2));
var G__88298 = cljs.core._nth(params,(3));
var G__88299 = cljs.core._nth(params,(4));
var G__88300 = cljs.core._nth(params,(5));
var G__88301 = cljs.core._nth(params,(6));
return (function() { 
var sci$impl$fns$fun_$_arity_7__delegate = function (G__88287,G__88288,G__88289,G__88290,G__88291,G__88292,G__88293,G__88294){
var invoc_array = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1(invoc_size);
if(cljs.core.truth_(enclosed__GT_invocation)){
(enclosed__GT_invocation.cljs$core$IFn$_invoke$arity$2 ? enclosed__GT_invocation.cljs$core$IFn$_invoke$arity$2(enclosed_array,invoc_array) : enclosed__GT_invocation.call(null,enclosed_array,invoc_array));
} else {
}

(invoc_array[(0)] = G__88287);

(invoc_array[(1)] = G__88288);

(invoc_array[(2)] = G__88289);

(invoc_array[(3)] = G__88290);

(invoc_array[(4)] = G__88291);

(invoc_array[(5)] = G__88292);

(invoc_array[(6)] = G__88293);

(invoc_array[vararg_idx] = G__88294);

while(true){
var ret__87204__auto__ = sci.impl.types.eval(body,ctx,invoc_array);
if(cljs.core.keyword_identical_QMARK_(new cljs.core.Keyword("sci.impl.analyzer","recur","sci.impl.analyzer/recur",2033369355),ret__87204__auto__)){
continue;
} else {
return ret__87204__auto__;
}
break;
}
};
var sci$impl$fns$fun_$_arity_7 = function (G__88287,G__88288,G__88289,G__88290,G__88291,G__88292,G__88293,var_args){
var G__88294 = null;
if (arguments.length > 7) {
var G__89276__i = 0, G__89276__a = new Array(arguments.length -  7);
while (G__89276__i < G__89276__a.length) {G__89276__a[G__89276__i] = arguments[G__89276__i + 7]; ++G__89276__i;}
  G__88294 = new cljs.core.IndexedSeq(G__89276__a,0,null);
} 
return sci$impl$fns$fun_$_arity_7__delegate.call(this,G__88287,G__88288,G__88289,G__88290,G__88291,G__88292,G__88293,G__88294);};
sci$impl$fns$fun_$_arity_7.cljs$lang$maxFixedArity = 7;
sci$impl$fns$fun_$_arity_7.cljs$lang$applyTo = (function (arglist__89277){
var G__88287 = cljs.core.first(arglist__89277);
arglist__89277 = cljs.core.next(arglist__89277);
var G__88288 = cljs.core.first(arglist__89277);
arglist__89277 = cljs.core.next(arglist__89277);
var G__88289 = cljs.core.first(arglist__89277);
arglist__89277 = cljs.core.next(arglist__89277);
var G__88290 = cljs.core.first(arglist__89277);
arglist__89277 = cljs.core.next(arglist__89277);
var G__88291 = cljs.core.first(arglist__89277);
arglist__89277 = cljs.core.next(arglist__89277);
var G__88292 = cljs.core.first(arglist__89277);
arglist__89277 = cljs.core.next(arglist__89277);
var G__88293 = cljs.core.first(arglist__89277);
var G__88294 = cljs.core.rest(arglist__89277);
return sci$impl$fns$fun_$_arity_7__delegate(G__88287,G__88288,G__88289,G__88290,G__88291,G__88292,G__88293,G__88294);
});
sci$impl$fns$fun_$_arity_7.cljs$core$IFn$_invoke$arity$variadic = sci$impl$fns$fun_$_arity_7__delegate;
return sci$impl$fns$fun_$_arity_7;
})()
;

break;
case (8):
var G__88315 = cljs.core._nth(params,(0));
var G__88316 = cljs.core._nth(params,(1));
var G__88317 = cljs.core._nth(params,(2));
var G__88318 = cljs.core._nth(params,(3));
var G__88319 = cljs.core._nth(params,(4));
var G__88320 = cljs.core._nth(params,(5));
var G__88321 = cljs.core._nth(params,(6));
var G__88322 = cljs.core._nth(params,(7));
return (function() { 
var sci$impl$fns$fun_$_arity_8__delegate = function (G__88306,G__88307,G__88308,G__88309,G__88310,G__88311,G__88312,G__88313,G__88314){
var invoc_array = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1(invoc_size);
if(cljs.core.truth_(enclosed__GT_invocation)){
(enclosed__GT_invocation.cljs$core$IFn$_invoke$arity$2 ? enclosed__GT_invocation.cljs$core$IFn$_invoke$arity$2(enclosed_array,invoc_array) : enclosed__GT_invocation.call(null,enclosed_array,invoc_array));
} else {
}

(invoc_array[(0)] = G__88306);

(invoc_array[(1)] = G__88307);

(invoc_array[(2)] = G__88308);

(invoc_array[(3)] = G__88309);

(invoc_array[(4)] = G__88310);

(invoc_array[(5)] = G__88311);

(invoc_array[(6)] = G__88312);

(invoc_array[(7)] = G__88313);

(invoc_array[vararg_idx] = G__88314);

while(true){
var ret__87204__auto__ = sci.impl.types.eval(body,ctx,invoc_array);
if(cljs.core.keyword_identical_QMARK_(new cljs.core.Keyword("sci.impl.analyzer","recur","sci.impl.analyzer/recur",2033369355),ret__87204__auto__)){
continue;
} else {
return ret__87204__auto__;
}
break;
}
};
var sci$impl$fns$fun_$_arity_8 = function (G__88306,G__88307,G__88308,G__88309,G__88310,G__88311,G__88312,G__88313,var_args){
var G__88314 = null;
if (arguments.length > 8) {
var G__89279__i = 0, G__89279__a = new Array(arguments.length -  8);
while (G__89279__i < G__89279__a.length) {G__89279__a[G__89279__i] = arguments[G__89279__i + 8]; ++G__89279__i;}
  G__88314 = new cljs.core.IndexedSeq(G__89279__a,0,null);
} 
return sci$impl$fns$fun_$_arity_8__delegate.call(this,G__88306,G__88307,G__88308,G__88309,G__88310,G__88311,G__88312,G__88313,G__88314);};
sci$impl$fns$fun_$_arity_8.cljs$lang$maxFixedArity = 8;
sci$impl$fns$fun_$_arity_8.cljs$lang$applyTo = (function (arglist__89280){
var G__88306 = cljs.core.first(arglist__89280);
arglist__89280 = cljs.core.next(arglist__89280);
var G__88307 = cljs.core.first(arglist__89280);
arglist__89280 = cljs.core.next(arglist__89280);
var G__88308 = cljs.core.first(arglist__89280);
arglist__89280 = cljs.core.next(arglist__89280);
var G__88309 = cljs.core.first(arglist__89280);
arglist__89280 = cljs.core.next(arglist__89280);
var G__88310 = cljs.core.first(arglist__89280);
arglist__89280 = cljs.core.next(arglist__89280);
var G__88311 = cljs.core.first(arglist__89280);
arglist__89280 = cljs.core.next(arglist__89280);
var G__88312 = cljs.core.first(arglist__89280);
arglist__89280 = cljs.core.next(arglist__89280);
var G__88313 = cljs.core.first(arglist__89280);
var G__88314 = cljs.core.rest(arglist__89280);
return sci$impl$fns$fun_$_arity_8__delegate(G__88306,G__88307,G__88308,G__88309,G__88310,G__88311,G__88312,G__88313,G__88314);
});
sci$impl$fns$fun_$_arity_8.cljs$core$IFn$_invoke$arity$variadic = sci$impl$fns$fun_$_arity_8__delegate;
return sci$impl$fns$fun_$_arity_8;
})()
;

break;
case (9):
var G__88337 = cljs.core._nth(params,(0));
var G__88338 = cljs.core._nth(params,(1));
var G__88339 = cljs.core._nth(params,(2));
var G__88340 = cljs.core._nth(params,(3));
var G__88341 = cljs.core._nth(params,(4));
var G__88342 = cljs.core._nth(params,(5));
var G__88343 = cljs.core._nth(params,(6));
var G__88344 = cljs.core._nth(params,(7));
var G__88345 = cljs.core._nth(params,(8));
return (function() { 
var sci$impl$fns$fun_$_arity_9__delegate = function (G__88327,G__88328,G__88329,G__88330,G__88331,G__88332,G__88333,G__88334,G__88335,G__88336){
var invoc_array = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1(invoc_size);
if(cljs.core.truth_(enclosed__GT_invocation)){
(enclosed__GT_invocation.cljs$core$IFn$_invoke$arity$2 ? enclosed__GT_invocation.cljs$core$IFn$_invoke$arity$2(enclosed_array,invoc_array) : enclosed__GT_invocation.call(null,enclosed_array,invoc_array));
} else {
}

(invoc_array[(0)] = G__88327);

(invoc_array[(1)] = G__88328);

(invoc_array[(2)] = G__88329);

(invoc_array[(3)] = G__88330);

(invoc_array[(4)] = G__88331);

(invoc_array[(5)] = G__88332);

(invoc_array[(6)] = G__88333);

(invoc_array[(7)] = G__88334);

(invoc_array[(8)] = G__88335);

(invoc_array[vararg_idx] = G__88336);

while(true){
var ret__87204__auto__ = sci.impl.types.eval(body,ctx,invoc_array);
if(cljs.core.keyword_identical_QMARK_(new cljs.core.Keyword("sci.impl.analyzer","recur","sci.impl.analyzer/recur",2033369355),ret__87204__auto__)){
continue;
} else {
return ret__87204__auto__;
}
break;
}
};
var sci$impl$fns$fun_$_arity_9 = function (G__88327,G__88328,G__88329,G__88330,G__88331,G__88332,G__88333,G__88334,G__88335,var_args){
var G__88336 = null;
if (arguments.length > 9) {
var G__89285__i = 0, G__89285__a = new Array(arguments.length -  9);
while (G__89285__i < G__89285__a.length) {G__89285__a[G__89285__i] = arguments[G__89285__i + 9]; ++G__89285__i;}
  G__88336 = new cljs.core.IndexedSeq(G__89285__a,0,null);
} 
return sci$impl$fns$fun_$_arity_9__delegate.call(this,G__88327,G__88328,G__88329,G__88330,G__88331,G__88332,G__88333,G__88334,G__88335,G__88336);};
sci$impl$fns$fun_$_arity_9.cljs$lang$maxFixedArity = 9;
sci$impl$fns$fun_$_arity_9.cljs$lang$applyTo = (function (arglist__89286){
var G__88327 = cljs.core.first(arglist__89286);
arglist__89286 = cljs.core.next(arglist__89286);
var G__88328 = cljs.core.first(arglist__89286);
arglist__89286 = cljs.core.next(arglist__89286);
var G__88329 = cljs.core.first(arglist__89286);
arglist__89286 = cljs.core.next(arglist__89286);
var G__88330 = cljs.core.first(arglist__89286);
arglist__89286 = cljs.core.next(arglist__89286);
var G__88331 = cljs.core.first(arglist__89286);
arglist__89286 = cljs.core.next(arglist__89286);
var G__88332 = cljs.core.first(arglist__89286);
arglist__89286 = cljs.core.next(arglist__89286);
var G__88333 = cljs.core.first(arglist__89286);
arglist__89286 = cljs.core.next(arglist__89286);
var G__88334 = cljs.core.first(arglist__89286);
arglist__89286 = cljs.core.next(arglist__89286);
var G__88335 = cljs.core.first(arglist__89286);
var G__88336 = cljs.core.rest(arglist__89286);
return sci$impl$fns$fun_$_arity_9__delegate(G__88327,G__88328,G__88329,G__88330,G__88331,G__88332,G__88333,G__88334,G__88335,G__88336);
});
sci$impl$fns$fun_$_arity_9.cljs$core$IFn$_invoke$arity$variadic = sci$impl$fns$fun_$_arity_9__delegate;
return sci$impl$fns$fun_$_arity_9;
})()
;

break;
case (10):
var G__88361 = cljs.core._nth(params,(0));
var G__88362 = cljs.core._nth(params,(1));
var G__88363 = cljs.core._nth(params,(2));
var G__88364 = cljs.core._nth(params,(3));
var G__88365 = cljs.core._nth(params,(4));
var G__88366 = cljs.core._nth(params,(5));
var G__88367 = cljs.core._nth(params,(6));
var G__88368 = cljs.core._nth(params,(7));
var G__88369 = cljs.core._nth(params,(8));
var G__88370 = cljs.core._nth(params,(9));
return (function() { 
var sci$impl$fns$fun_$_arity_10__delegate = function (G__88350,G__88351,G__88352,G__88353,G__88354,G__88355,G__88356,G__88357,G__88358,G__88359,G__88360){
var invoc_array = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1(invoc_size);
if(cljs.core.truth_(enclosed__GT_invocation)){
(enclosed__GT_invocation.cljs$core$IFn$_invoke$arity$2 ? enclosed__GT_invocation.cljs$core$IFn$_invoke$arity$2(enclosed_array,invoc_array) : enclosed__GT_invocation.call(null,enclosed_array,invoc_array));
} else {
}

(invoc_array[(0)] = G__88350);

(invoc_array[(1)] = G__88351);

(invoc_array[(2)] = G__88352);

(invoc_array[(3)] = G__88353);

(invoc_array[(4)] = G__88354);

(invoc_array[(5)] = G__88355);

(invoc_array[(6)] = G__88356);

(invoc_array[(7)] = G__88357);

(invoc_array[(8)] = G__88358);

(invoc_array[(9)] = G__88359);

(invoc_array[vararg_idx] = G__88360);

while(true){
var ret__87204__auto__ = sci.impl.types.eval(body,ctx,invoc_array);
if(cljs.core.keyword_identical_QMARK_(new cljs.core.Keyword("sci.impl.analyzer","recur","sci.impl.analyzer/recur",2033369355),ret__87204__auto__)){
continue;
} else {
return ret__87204__auto__;
}
break;
}
};
var sci$impl$fns$fun_$_arity_10 = function (G__88350,G__88351,G__88352,G__88353,G__88354,G__88355,G__88356,G__88357,G__88358,G__88359,var_args){
var G__88360 = null;
if (arguments.length > 10) {
var G__89288__i = 0, G__89288__a = new Array(arguments.length -  10);
while (G__89288__i < G__89288__a.length) {G__89288__a[G__89288__i] = arguments[G__89288__i + 10]; ++G__89288__i;}
  G__88360 = new cljs.core.IndexedSeq(G__89288__a,0,null);
} 
return sci$impl$fns$fun_$_arity_10__delegate.call(this,G__88350,G__88351,G__88352,G__88353,G__88354,G__88355,G__88356,G__88357,G__88358,G__88359,G__88360);};
sci$impl$fns$fun_$_arity_10.cljs$lang$maxFixedArity = 10;
sci$impl$fns$fun_$_arity_10.cljs$lang$applyTo = (function (arglist__89289){
var G__88350 = cljs.core.first(arglist__89289);
arglist__89289 = cljs.core.next(arglist__89289);
var G__88351 = cljs.core.first(arglist__89289);
arglist__89289 = cljs.core.next(arglist__89289);
var G__88352 = cljs.core.first(arglist__89289);
arglist__89289 = cljs.core.next(arglist__89289);
var G__88353 = cljs.core.first(arglist__89289);
arglist__89289 = cljs.core.next(arglist__89289);
var G__88354 = cljs.core.first(arglist__89289);
arglist__89289 = cljs.core.next(arglist__89289);
var G__88355 = cljs.core.first(arglist__89289);
arglist__89289 = cljs.core.next(arglist__89289);
var G__88356 = cljs.core.first(arglist__89289);
arglist__89289 = cljs.core.next(arglist__89289);
var G__88357 = cljs.core.first(arglist__89289);
arglist__89289 = cljs.core.next(arglist__89289);
var G__88358 = cljs.core.first(arglist__89289);
arglist__89289 = cljs.core.next(arglist__89289);
var G__88359 = cljs.core.first(arglist__89289);
var G__88360 = cljs.core.rest(arglist__89289);
return sci$impl$fns$fun_$_arity_10__delegate(G__88350,G__88351,G__88352,G__88353,G__88354,G__88355,G__88356,G__88357,G__88358,G__88359,G__88360);
});
sci$impl$fns$fun_$_arity_10.cljs$core$IFn$_invoke$arity$variadic = sci$impl$fns$fun_$_arity_10__delegate;
return sci$impl$fns$fun_$_arity_10;
})()
;

break;
case (11):
var G__88387 = cljs.core._nth(params,(0));
var G__88388 = cljs.core._nth(params,(1));
var G__88389 = cljs.core._nth(params,(2));
var G__88390 = cljs.core._nth(params,(3));
var G__88391 = cljs.core._nth(params,(4));
var G__88392 = cljs.core._nth(params,(5));
var G__88393 = cljs.core._nth(params,(6));
var G__88394 = cljs.core._nth(params,(7));
var G__88395 = cljs.core._nth(params,(8));
var G__88396 = cljs.core._nth(params,(9));
var G__88397 = cljs.core._nth(params,(10));
return (function() { 
var sci$impl$fns$fun_$_arity_11__delegate = function (G__88375,G__88376,G__88377,G__88378,G__88379,G__88380,G__88381,G__88382,G__88383,G__88384,G__88385,G__88386){
var invoc_array = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1(invoc_size);
if(cljs.core.truth_(enclosed__GT_invocation)){
(enclosed__GT_invocation.cljs$core$IFn$_invoke$arity$2 ? enclosed__GT_invocation.cljs$core$IFn$_invoke$arity$2(enclosed_array,invoc_array) : enclosed__GT_invocation.call(null,enclosed_array,invoc_array));
} else {
}

(invoc_array[(0)] = G__88375);

(invoc_array[(1)] = G__88376);

(invoc_array[(2)] = G__88377);

(invoc_array[(3)] = G__88378);

(invoc_array[(4)] = G__88379);

(invoc_array[(5)] = G__88380);

(invoc_array[(6)] = G__88381);

(invoc_array[(7)] = G__88382);

(invoc_array[(8)] = G__88383);

(invoc_array[(9)] = G__88384);

(invoc_array[(10)] = G__88385);

(invoc_array[vararg_idx] = G__88386);

while(true){
var ret__87204__auto__ = sci.impl.types.eval(body,ctx,invoc_array);
if(cljs.core.keyword_identical_QMARK_(new cljs.core.Keyword("sci.impl.analyzer","recur","sci.impl.analyzer/recur",2033369355),ret__87204__auto__)){
continue;
} else {
return ret__87204__auto__;
}
break;
}
};
var sci$impl$fns$fun_$_arity_11 = function (G__88375,G__88376,G__88377,G__88378,G__88379,G__88380,G__88381,G__88382,G__88383,G__88384,G__88385,var_args){
var G__88386 = null;
if (arguments.length > 11) {
var G__89290__i = 0, G__89290__a = new Array(arguments.length -  11);
while (G__89290__i < G__89290__a.length) {G__89290__a[G__89290__i] = arguments[G__89290__i + 11]; ++G__89290__i;}
  G__88386 = new cljs.core.IndexedSeq(G__89290__a,0,null);
} 
return sci$impl$fns$fun_$_arity_11__delegate.call(this,G__88375,G__88376,G__88377,G__88378,G__88379,G__88380,G__88381,G__88382,G__88383,G__88384,G__88385,G__88386);};
sci$impl$fns$fun_$_arity_11.cljs$lang$maxFixedArity = 11;
sci$impl$fns$fun_$_arity_11.cljs$lang$applyTo = (function (arglist__89291){
var G__88375 = cljs.core.first(arglist__89291);
arglist__89291 = cljs.core.next(arglist__89291);
var G__88376 = cljs.core.first(arglist__89291);
arglist__89291 = cljs.core.next(arglist__89291);
var G__88377 = cljs.core.first(arglist__89291);
arglist__89291 = cljs.core.next(arglist__89291);
var G__88378 = cljs.core.first(arglist__89291);
arglist__89291 = cljs.core.next(arglist__89291);
var G__88379 = cljs.core.first(arglist__89291);
arglist__89291 = cljs.core.next(arglist__89291);
var G__88380 = cljs.core.first(arglist__89291);
arglist__89291 = cljs.core.next(arglist__89291);
var G__88381 = cljs.core.first(arglist__89291);
arglist__89291 = cljs.core.next(arglist__89291);
var G__88382 = cljs.core.first(arglist__89291);
arglist__89291 = cljs.core.next(arglist__89291);
var G__88383 = cljs.core.first(arglist__89291);
arglist__89291 = cljs.core.next(arglist__89291);
var G__88384 = cljs.core.first(arglist__89291);
arglist__89291 = cljs.core.next(arglist__89291);
var G__88385 = cljs.core.first(arglist__89291);
var G__88386 = cljs.core.rest(arglist__89291);
return sci$impl$fns$fun_$_arity_11__delegate(G__88375,G__88376,G__88377,G__88378,G__88379,G__88380,G__88381,G__88382,G__88383,G__88384,G__88385,G__88386);
});
sci$impl$fns$fun_$_arity_11.cljs$core$IFn$_invoke$arity$variadic = sci$impl$fns$fun_$_arity_11__delegate;
return sci$impl$fns$fun_$_arity_11;
})()
;

break;
case (12):
var G__88411 = cljs.core._nth(params,(0));
var G__88412 = cljs.core._nth(params,(1));
var G__88413 = cljs.core._nth(params,(2));
var G__88414 = cljs.core._nth(params,(3));
var G__88415 = cljs.core._nth(params,(4));
var G__88416 = cljs.core._nth(params,(5));
var G__88417 = cljs.core._nth(params,(6));
var G__88418 = cljs.core._nth(params,(7));
var G__88419 = cljs.core._nth(params,(8));
var G__88420 = cljs.core._nth(params,(9));
var G__88421 = cljs.core._nth(params,(10));
var G__88422 = cljs.core._nth(params,(11));
return (function() { 
var sci$impl$fns$fun_$_arity_12__delegate = function (G__88398,G__88399,G__88400,G__88401,G__88402,G__88403,G__88404,G__88405,G__88406,G__88407,G__88408,G__88409,G__88410){
var invoc_array = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1(invoc_size);
if(cljs.core.truth_(enclosed__GT_invocation)){
(enclosed__GT_invocation.cljs$core$IFn$_invoke$arity$2 ? enclosed__GT_invocation.cljs$core$IFn$_invoke$arity$2(enclosed_array,invoc_array) : enclosed__GT_invocation.call(null,enclosed_array,invoc_array));
} else {
}

(invoc_array[(0)] = G__88398);

(invoc_array[(1)] = G__88399);

(invoc_array[(2)] = G__88400);

(invoc_array[(3)] = G__88401);

(invoc_array[(4)] = G__88402);

(invoc_array[(5)] = G__88403);

(invoc_array[(6)] = G__88404);

(invoc_array[(7)] = G__88405);

(invoc_array[(8)] = G__88406);

(invoc_array[(9)] = G__88407);

(invoc_array[(10)] = G__88408);

(invoc_array[(11)] = G__88409);

(invoc_array[vararg_idx] = G__88410);

while(true){
var ret__87204__auto__ = sci.impl.types.eval(body,ctx,invoc_array);
if(cljs.core.keyword_identical_QMARK_(new cljs.core.Keyword("sci.impl.analyzer","recur","sci.impl.analyzer/recur",2033369355),ret__87204__auto__)){
continue;
} else {
return ret__87204__auto__;
}
break;
}
};
var sci$impl$fns$fun_$_arity_12 = function (G__88398,G__88399,G__88400,G__88401,G__88402,G__88403,G__88404,G__88405,G__88406,G__88407,G__88408,G__88409,var_args){
var G__88410 = null;
if (arguments.length > 12) {
var G__89295__i = 0, G__89295__a = new Array(arguments.length -  12);
while (G__89295__i < G__89295__a.length) {G__89295__a[G__89295__i] = arguments[G__89295__i + 12]; ++G__89295__i;}
  G__88410 = new cljs.core.IndexedSeq(G__89295__a,0,null);
} 
return sci$impl$fns$fun_$_arity_12__delegate.call(this,G__88398,G__88399,G__88400,G__88401,G__88402,G__88403,G__88404,G__88405,G__88406,G__88407,G__88408,G__88409,G__88410);};
sci$impl$fns$fun_$_arity_12.cljs$lang$maxFixedArity = 12;
sci$impl$fns$fun_$_arity_12.cljs$lang$applyTo = (function (arglist__89296){
var G__88398 = cljs.core.first(arglist__89296);
arglist__89296 = cljs.core.next(arglist__89296);
var G__88399 = cljs.core.first(arglist__89296);
arglist__89296 = cljs.core.next(arglist__89296);
var G__88400 = cljs.core.first(arglist__89296);
arglist__89296 = cljs.core.next(arglist__89296);
var G__88401 = cljs.core.first(arglist__89296);
arglist__89296 = cljs.core.next(arglist__89296);
var G__88402 = cljs.core.first(arglist__89296);
arglist__89296 = cljs.core.next(arglist__89296);
var G__88403 = cljs.core.first(arglist__89296);
arglist__89296 = cljs.core.next(arglist__89296);
var G__88404 = cljs.core.first(arglist__89296);
arglist__89296 = cljs.core.next(arglist__89296);
var G__88405 = cljs.core.first(arglist__89296);
arglist__89296 = cljs.core.next(arglist__89296);
var G__88406 = cljs.core.first(arglist__89296);
arglist__89296 = cljs.core.next(arglist__89296);
var G__88407 = cljs.core.first(arglist__89296);
arglist__89296 = cljs.core.next(arglist__89296);
var G__88408 = cljs.core.first(arglist__89296);
arglist__89296 = cljs.core.next(arglist__89296);
var G__88409 = cljs.core.first(arglist__89296);
var G__88410 = cljs.core.rest(arglist__89296);
return sci$impl$fns$fun_$_arity_12__delegate(G__88398,G__88399,G__88400,G__88401,G__88402,G__88403,G__88404,G__88405,G__88406,G__88407,G__88408,G__88409,G__88410);
});
sci$impl$fns$fun_$_arity_12.cljs$core$IFn$_invoke$arity$variadic = sci$impl$fns$fun_$_arity_12__delegate;
return sci$impl$fns$fun_$_arity_12;
})()
;

break;
case (13):
var G__88437 = cljs.core._nth(params,(0));
var G__88438 = cljs.core._nth(params,(1));
var G__88439 = cljs.core._nth(params,(2));
var G__88440 = cljs.core._nth(params,(3));
var G__88441 = cljs.core._nth(params,(4));
var G__88442 = cljs.core._nth(params,(5));
var G__88443 = cljs.core._nth(params,(6));
var G__88444 = cljs.core._nth(params,(7));
var G__88445 = cljs.core._nth(params,(8));
var G__88446 = cljs.core._nth(params,(9));
var G__88447 = cljs.core._nth(params,(10));
var G__88448 = cljs.core._nth(params,(11));
var G__88449 = cljs.core._nth(params,(12));
return (function() { 
var sci$impl$fns$fun_$_arity_13__delegate = function (G__88423,G__88424,G__88425,G__88426,G__88427,G__88428,G__88429,G__88430,G__88431,G__88432,G__88433,G__88434,G__88435,G__88436){
var invoc_array = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1(invoc_size);
if(cljs.core.truth_(enclosed__GT_invocation)){
(enclosed__GT_invocation.cljs$core$IFn$_invoke$arity$2 ? enclosed__GT_invocation.cljs$core$IFn$_invoke$arity$2(enclosed_array,invoc_array) : enclosed__GT_invocation.call(null,enclosed_array,invoc_array));
} else {
}

(invoc_array[(0)] = G__88423);

(invoc_array[(1)] = G__88424);

(invoc_array[(2)] = G__88425);

(invoc_array[(3)] = G__88426);

(invoc_array[(4)] = G__88427);

(invoc_array[(5)] = G__88428);

(invoc_array[(6)] = G__88429);

(invoc_array[(7)] = G__88430);

(invoc_array[(8)] = G__88431);

(invoc_array[(9)] = G__88432);

(invoc_array[(10)] = G__88433);

(invoc_array[(11)] = G__88434);

(invoc_array[(12)] = G__88435);

(invoc_array[vararg_idx] = G__88436);

while(true){
var ret__87204__auto__ = sci.impl.types.eval(body,ctx,invoc_array);
if(cljs.core.keyword_identical_QMARK_(new cljs.core.Keyword("sci.impl.analyzer","recur","sci.impl.analyzer/recur",2033369355),ret__87204__auto__)){
continue;
} else {
return ret__87204__auto__;
}
break;
}
};
var sci$impl$fns$fun_$_arity_13 = function (G__88423,G__88424,G__88425,G__88426,G__88427,G__88428,G__88429,G__88430,G__88431,G__88432,G__88433,G__88434,G__88435,var_args){
var G__88436 = null;
if (arguments.length > 13) {
var G__89300__i = 0, G__89300__a = new Array(arguments.length -  13);
while (G__89300__i < G__89300__a.length) {G__89300__a[G__89300__i] = arguments[G__89300__i + 13]; ++G__89300__i;}
  G__88436 = new cljs.core.IndexedSeq(G__89300__a,0,null);
} 
return sci$impl$fns$fun_$_arity_13__delegate.call(this,G__88423,G__88424,G__88425,G__88426,G__88427,G__88428,G__88429,G__88430,G__88431,G__88432,G__88433,G__88434,G__88435,G__88436);};
sci$impl$fns$fun_$_arity_13.cljs$lang$maxFixedArity = 13;
sci$impl$fns$fun_$_arity_13.cljs$lang$applyTo = (function (arglist__89301){
var G__88423 = cljs.core.first(arglist__89301);
arglist__89301 = cljs.core.next(arglist__89301);
var G__88424 = cljs.core.first(arglist__89301);
arglist__89301 = cljs.core.next(arglist__89301);
var G__88425 = cljs.core.first(arglist__89301);
arglist__89301 = cljs.core.next(arglist__89301);
var G__88426 = cljs.core.first(arglist__89301);
arglist__89301 = cljs.core.next(arglist__89301);
var G__88427 = cljs.core.first(arglist__89301);
arglist__89301 = cljs.core.next(arglist__89301);
var G__88428 = cljs.core.first(arglist__89301);
arglist__89301 = cljs.core.next(arglist__89301);
var G__88429 = cljs.core.first(arglist__89301);
arglist__89301 = cljs.core.next(arglist__89301);
var G__88430 = cljs.core.first(arglist__89301);
arglist__89301 = cljs.core.next(arglist__89301);
var G__88431 = cljs.core.first(arglist__89301);
arglist__89301 = cljs.core.next(arglist__89301);
var G__88432 = cljs.core.first(arglist__89301);
arglist__89301 = cljs.core.next(arglist__89301);
var G__88433 = cljs.core.first(arglist__89301);
arglist__89301 = cljs.core.next(arglist__89301);
var G__88434 = cljs.core.first(arglist__89301);
arglist__89301 = cljs.core.next(arglist__89301);
var G__88435 = cljs.core.first(arglist__89301);
var G__88436 = cljs.core.rest(arglist__89301);
return sci$impl$fns$fun_$_arity_13__delegate(G__88423,G__88424,G__88425,G__88426,G__88427,G__88428,G__88429,G__88430,G__88431,G__88432,G__88433,G__88434,G__88435,G__88436);
});
sci$impl$fns$fun_$_arity_13.cljs$core$IFn$_invoke$arity$variadic = sci$impl$fns$fun_$_arity_13__delegate;
return sci$impl$fns$fun_$_arity_13;
})()
;

break;
case (14):
var G__88465 = cljs.core._nth(params,(0));
var G__88466 = cljs.core._nth(params,(1));
var G__88467 = cljs.core._nth(params,(2));
var G__88468 = cljs.core._nth(params,(3));
var G__88469 = cljs.core._nth(params,(4));
var G__88470 = cljs.core._nth(params,(5));
var G__88471 = cljs.core._nth(params,(6));
var G__88472 = cljs.core._nth(params,(7));
var G__88473 = cljs.core._nth(params,(8));
var G__88474 = cljs.core._nth(params,(9));
var G__88475 = cljs.core._nth(params,(10));
var G__88476 = cljs.core._nth(params,(11));
var G__88477 = cljs.core._nth(params,(12));
var G__88478 = cljs.core._nth(params,(13));
return (function() { 
var sci$impl$fns$fun_$_arity_14__delegate = function (G__88450,G__88451,G__88452,G__88453,G__88454,G__88455,G__88456,G__88457,G__88458,G__88459,G__88460,G__88461,G__88462,G__88463,G__88464){
var invoc_array = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1(invoc_size);
if(cljs.core.truth_(enclosed__GT_invocation)){
(enclosed__GT_invocation.cljs$core$IFn$_invoke$arity$2 ? enclosed__GT_invocation.cljs$core$IFn$_invoke$arity$2(enclosed_array,invoc_array) : enclosed__GT_invocation.call(null,enclosed_array,invoc_array));
} else {
}

(invoc_array[(0)] = G__88450);

(invoc_array[(1)] = G__88451);

(invoc_array[(2)] = G__88452);

(invoc_array[(3)] = G__88453);

(invoc_array[(4)] = G__88454);

(invoc_array[(5)] = G__88455);

(invoc_array[(6)] = G__88456);

(invoc_array[(7)] = G__88457);

(invoc_array[(8)] = G__88458);

(invoc_array[(9)] = G__88459);

(invoc_array[(10)] = G__88460);

(invoc_array[(11)] = G__88461);

(invoc_array[(12)] = G__88462);

(invoc_array[(13)] = G__88463);

(invoc_array[vararg_idx] = G__88464);

while(true){
var ret__87204__auto__ = sci.impl.types.eval(body,ctx,invoc_array);
if(cljs.core.keyword_identical_QMARK_(new cljs.core.Keyword("sci.impl.analyzer","recur","sci.impl.analyzer/recur",2033369355),ret__87204__auto__)){
continue;
} else {
return ret__87204__auto__;
}
break;
}
};
var sci$impl$fns$fun_$_arity_14 = function (G__88450,G__88451,G__88452,G__88453,G__88454,G__88455,G__88456,G__88457,G__88458,G__88459,G__88460,G__88461,G__88462,G__88463,var_args){
var G__88464 = null;
if (arguments.length > 14) {
var G__89303__i = 0, G__89303__a = new Array(arguments.length -  14);
while (G__89303__i < G__89303__a.length) {G__89303__a[G__89303__i] = arguments[G__89303__i + 14]; ++G__89303__i;}
  G__88464 = new cljs.core.IndexedSeq(G__89303__a,0,null);
} 
return sci$impl$fns$fun_$_arity_14__delegate.call(this,G__88450,G__88451,G__88452,G__88453,G__88454,G__88455,G__88456,G__88457,G__88458,G__88459,G__88460,G__88461,G__88462,G__88463,G__88464);};
sci$impl$fns$fun_$_arity_14.cljs$lang$maxFixedArity = 14;
sci$impl$fns$fun_$_arity_14.cljs$lang$applyTo = (function (arglist__89304){
var G__88450 = cljs.core.first(arglist__89304);
arglist__89304 = cljs.core.next(arglist__89304);
var G__88451 = cljs.core.first(arglist__89304);
arglist__89304 = cljs.core.next(arglist__89304);
var G__88452 = cljs.core.first(arglist__89304);
arglist__89304 = cljs.core.next(arglist__89304);
var G__88453 = cljs.core.first(arglist__89304);
arglist__89304 = cljs.core.next(arglist__89304);
var G__88454 = cljs.core.first(arglist__89304);
arglist__89304 = cljs.core.next(arglist__89304);
var G__88455 = cljs.core.first(arglist__89304);
arglist__89304 = cljs.core.next(arglist__89304);
var G__88456 = cljs.core.first(arglist__89304);
arglist__89304 = cljs.core.next(arglist__89304);
var G__88457 = cljs.core.first(arglist__89304);
arglist__89304 = cljs.core.next(arglist__89304);
var G__88458 = cljs.core.first(arglist__89304);
arglist__89304 = cljs.core.next(arglist__89304);
var G__88459 = cljs.core.first(arglist__89304);
arglist__89304 = cljs.core.next(arglist__89304);
var G__88460 = cljs.core.first(arglist__89304);
arglist__89304 = cljs.core.next(arglist__89304);
var G__88461 = cljs.core.first(arglist__89304);
arglist__89304 = cljs.core.next(arglist__89304);
var G__88462 = cljs.core.first(arglist__89304);
arglist__89304 = cljs.core.next(arglist__89304);
var G__88463 = cljs.core.first(arglist__89304);
var G__88464 = cljs.core.rest(arglist__89304);
return sci$impl$fns$fun_$_arity_14__delegate(G__88450,G__88451,G__88452,G__88453,G__88454,G__88455,G__88456,G__88457,G__88458,G__88459,G__88460,G__88461,G__88462,G__88463,G__88464);
});
sci$impl$fns$fun_$_arity_14.cljs$core$IFn$_invoke$arity$variadic = sci$impl$fns$fun_$_arity_14__delegate;
return sci$impl$fns$fun_$_arity_14;
})()
;

break;
case (15):
var G__88497 = cljs.core._nth(params,(0));
var G__88498 = cljs.core._nth(params,(1));
var G__88499 = cljs.core._nth(params,(2));
var G__88500 = cljs.core._nth(params,(3));
var G__88501 = cljs.core._nth(params,(4));
var G__88502 = cljs.core._nth(params,(5));
var G__88503 = cljs.core._nth(params,(6));
var G__88504 = cljs.core._nth(params,(7));
var G__88505 = cljs.core._nth(params,(8));
var G__88506 = cljs.core._nth(params,(9));
var G__88507 = cljs.core._nth(params,(10));
var G__88508 = cljs.core._nth(params,(11));
var G__88509 = cljs.core._nth(params,(12));
var G__88510 = cljs.core._nth(params,(13));
var G__88511 = cljs.core._nth(params,(14));
return (function() { 
var sci$impl$fns$fun_$_arity_15__delegate = function (G__88481,G__88482,G__88483,G__88484,G__88485,G__88486,G__88487,G__88488,G__88489,G__88490,G__88491,G__88492,G__88493,G__88494,G__88495,G__88496){
var invoc_array = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1(invoc_size);
if(cljs.core.truth_(enclosed__GT_invocation)){
(enclosed__GT_invocation.cljs$core$IFn$_invoke$arity$2 ? enclosed__GT_invocation.cljs$core$IFn$_invoke$arity$2(enclosed_array,invoc_array) : enclosed__GT_invocation.call(null,enclosed_array,invoc_array));
} else {
}

(invoc_array[(0)] = G__88481);

(invoc_array[(1)] = G__88482);

(invoc_array[(2)] = G__88483);

(invoc_array[(3)] = G__88484);

(invoc_array[(4)] = G__88485);

(invoc_array[(5)] = G__88486);

(invoc_array[(6)] = G__88487);

(invoc_array[(7)] = G__88488);

(invoc_array[(8)] = G__88489);

(invoc_array[(9)] = G__88490);

(invoc_array[(10)] = G__88491);

(invoc_array[(11)] = G__88492);

(invoc_array[(12)] = G__88493);

(invoc_array[(13)] = G__88494);

(invoc_array[(14)] = G__88495);

(invoc_array[vararg_idx] = G__88496);

while(true){
var ret__87204__auto__ = sci.impl.types.eval(body,ctx,invoc_array);
if(cljs.core.keyword_identical_QMARK_(new cljs.core.Keyword("sci.impl.analyzer","recur","sci.impl.analyzer/recur",2033369355),ret__87204__auto__)){
continue;
} else {
return ret__87204__auto__;
}
break;
}
};
var sci$impl$fns$fun_$_arity_15 = function (G__88481,G__88482,G__88483,G__88484,G__88485,G__88486,G__88487,G__88488,G__88489,G__88490,G__88491,G__88492,G__88493,G__88494,G__88495,var_args){
var G__88496 = null;
if (arguments.length > 15) {
var G__89306__i = 0, G__89306__a = new Array(arguments.length -  15);
while (G__89306__i < G__89306__a.length) {G__89306__a[G__89306__i] = arguments[G__89306__i + 15]; ++G__89306__i;}
  G__88496 = new cljs.core.IndexedSeq(G__89306__a,0,null);
} 
return sci$impl$fns$fun_$_arity_15__delegate.call(this,G__88481,G__88482,G__88483,G__88484,G__88485,G__88486,G__88487,G__88488,G__88489,G__88490,G__88491,G__88492,G__88493,G__88494,G__88495,G__88496);};
sci$impl$fns$fun_$_arity_15.cljs$lang$maxFixedArity = 15;
sci$impl$fns$fun_$_arity_15.cljs$lang$applyTo = (function (arglist__89307){
var G__88481 = cljs.core.first(arglist__89307);
arglist__89307 = cljs.core.next(arglist__89307);
var G__88482 = cljs.core.first(arglist__89307);
arglist__89307 = cljs.core.next(arglist__89307);
var G__88483 = cljs.core.first(arglist__89307);
arglist__89307 = cljs.core.next(arglist__89307);
var G__88484 = cljs.core.first(arglist__89307);
arglist__89307 = cljs.core.next(arglist__89307);
var G__88485 = cljs.core.first(arglist__89307);
arglist__89307 = cljs.core.next(arglist__89307);
var G__88486 = cljs.core.first(arglist__89307);
arglist__89307 = cljs.core.next(arglist__89307);
var G__88487 = cljs.core.first(arglist__89307);
arglist__89307 = cljs.core.next(arglist__89307);
var G__88488 = cljs.core.first(arglist__89307);
arglist__89307 = cljs.core.next(arglist__89307);
var G__88489 = cljs.core.first(arglist__89307);
arglist__89307 = cljs.core.next(arglist__89307);
var G__88490 = cljs.core.first(arglist__89307);
arglist__89307 = cljs.core.next(arglist__89307);
var G__88491 = cljs.core.first(arglist__89307);
arglist__89307 = cljs.core.next(arglist__89307);
var G__88492 = cljs.core.first(arglist__89307);
arglist__89307 = cljs.core.next(arglist__89307);
var G__88493 = cljs.core.first(arglist__89307);
arglist__89307 = cljs.core.next(arglist__89307);
var G__88494 = cljs.core.first(arglist__89307);
arglist__89307 = cljs.core.next(arglist__89307);
var G__88495 = cljs.core.first(arglist__89307);
var G__88496 = cljs.core.rest(arglist__89307);
return sci$impl$fns$fun_$_arity_15__delegate(G__88481,G__88482,G__88483,G__88484,G__88485,G__88486,G__88487,G__88488,G__88489,G__88490,G__88491,G__88492,G__88493,G__88494,G__88495,G__88496);
});
sci$impl$fns$fun_$_arity_15.cljs$core$IFn$_invoke$arity$variadic = sci$impl$fns$fun_$_arity_15__delegate;
return sci$impl$fns$fun_$_arity_15;
})()
;

break;
case (16):
var G__88534 = cljs.core._nth(params,(0));
var G__88535 = cljs.core._nth(params,(1));
var G__88536 = cljs.core._nth(params,(2));
var G__88537 = cljs.core._nth(params,(3));
var G__88538 = cljs.core._nth(params,(4));
var G__88539 = cljs.core._nth(params,(5));
var G__88540 = cljs.core._nth(params,(6));
var G__88541 = cljs.core._nth(params,(7));
var G__88542 = cljs.core._nth(params,(8));
var G__88543 = cljs.core._nth(params,(9));
var G__88544 = cljs.core._nth(params,(10));
var G__88545 = cljs.core._nth(params,(11));
var G__88546 = cljs.core._nth(params,(12));
var G__88547 = cljs.core._nth(params,(13));
var G__88548 = cljs.core._nth(params,(14));
var G__88549 = cljs.core._nth(params,(15));
return (function() { 
var sci$impl$fns$fun_$_arity_16__delegate = function (G__88517,G__88518,G__88519,G__88520,G__88521,G__88522,G__88523,G__88524,G__88525,G__88526,G__88527,G__88528,G__88529,G__88530,G__88531,G__88532,G__88533){
var invoc_array = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1(invoc_size);
if(cljs.core.truth_(enclosed__GT_invocation)){
(enclosed__GT_invocation.cljs$core$IFn$_invoke$arity$2 ? enclosed__GT_invocation.cljs$core$IFn$_invoke$arity$2(enclosed_array,invoc_array) : enclosed__GT_invocation.call(null,enclosed_array,invoc_array));
} else {
}

(invoc_array[(0)] = G__88517);

(invoc_array[(1)] = G__88518);

(invoc_array[(2)] = G__88519);

(invoc_array[(3)] = G__88520);

(invoc_array[(4)] = G__88521);

(invoc_array[(5)] = G__88522);

(invoc_array[(6)] = G__88523);

(invoc_array[(7)] = G__88524);

(invoc_array[(8)] = G__88525);

(invoc_array[(9)] = G__88526);

(invoc_array[(10)] = G__88527);

(invoc_array[(11)] = G__88528);

(invoc_array[(12)] = G__88529);

(invoc_array[(13)] = G__88530);

(invoc_array[(14)] = G__88531);

(invoc_array[(15)] = G__88532);

(invoc_array[vararg_idx] = G__88533);

while(true){
var ret__87204__auto__ = sci.impl.types.eval(body,ctx,invoc_array);
if(cljs.core.keyword_identical_QMARK_(new cljs.core.Keyword("sci.impl.analyzer","recur","sci.impl.analyzer/recur",2033369355),ret__87204__auto__)){
continue;
} else {
return ret__87204__auto__;
}
break;
}
};
var sci$impl$fns$fun_$_arity_16 = function (G__88517,G__88518,G__88519,G__88520,G__88521,G__88522,G__88523,G__88524,G__88525,G__88526,G__88527,G__88528,G__88529,G__88530,G__88531,G__88532,var_args){
var G__88533 = null;
if (arguments.length > 16) {
var G__89309__i = 0, G__89309__a = new Array(arguments.length -  16);
while (G__89309__i < G__89309__a.length) {G__89309__a[G__89309__i] = arguments[G__89309__i + 16]; ++G__89309__i;}
  G__88533 = new cljs.core.IndexedSeq(G__89309__a,0,null);
} 
return sci$impl$fns$fun_$_arity_16__delegate.call(this,G__88517,G__88518,G__88519,G__88520,G__88521,G__88522,G__88523,G__88524,G__88525,G__88526,G__88527,G__88528,G__88529,G__88530,G__88531,G__88532,G__88533);};
sci$impl$fns$fun_$_arity_16.cljs$lang$maxFixedArity = 16;
sci$impl$fns$fun_$_arity_16.cljs$lang$applyTo = (function (arglist__89310){
var G__88517 = cljs.core.first(arglist__89310);
arglist__89310 = cljs.core.next(arglist__89310);
var G__88518 = cljs.core.first(arglist__89310);
arglist__89310 = cljs.core.next(arglist__89310);
var G__88519 = cljs.core.first(arglist__89310);
arglist__89310 = cljs.core.next(arglist__89310);
var G__88520 = cljs.core.first(arglist__89310);
arglist__89310 = cljs.core.next(arglist__89310);
var G__88521 = cljs.core.first(arglist__89310);
arglist__89310 = cljs.core.next(arglist__89310);
var G__88522 = cljs.core.first(arglist__89310);
arglist__89310 = cljs.core.next(arglist__89310);
var G__88523 = cljs.core.first(arglist__89310);
arglist__89310 = cljs.core.next(arglist__89310);
var G__88524 = cljs.core.first(arglist__89310);
arglist__89310 = cljs.core.next(arglist__89310);
var G__88525 = cljs.core.first(arglist__89310);
arglist__89310 = cljs.core.next(arglist__89310);
var G__88526 = cljs.core.first(arglist__89310);
arglist__89310 = cljs.core.next(arglist__89310);
var G__88527 = cljs.core.first(arglist__89310);
arglist__89310 = cljs.core.next(arglist__89310);
var G__88528 = cljs.core.first(arglist__89310);
arglist__89310 = cljs.core.next(arglist__89310);
var G__88529 = cljs.core.first(arglist__89310);
arglist__89310 = cljs.core.next(arglist__89310);
var G__88530 = cljs.core.first(arglist__89310);
arglist__89310 = cljs.core.next(arglist__89310);
var G__88531 = cljs.core.first(arglist__89310);
arglist__89310 = cljs.core.next(arglist__89310);
var G__88532 = cljs.core.first(arglist__89310);
var G__88533 = cljs.core.rest(arglist__89310);
return sci$impl$fns$fun_$_arity_16__delegate(G__88517,G__88518,G__88519,G__88520,G__88521,G__88522,G__88523,G__88524,G__88525,G__88526,G__88527,G__88528,G__88529,G__88530,G__88531,G__88532,G__88533);
});
sci$impl$fns$fun_$_arity_16.cljs$core$IFn$_invoke$arity$variadic = sci$impl$fns$fun_$_arity_16__delegate;
return sci$impl$fns$fun_$_arity_16;
})()
;

break;
case (17):
var G__88576 = cljs.core._nth(params,(0));
var G__88577 = cljs.core._nth(params,(1));
var G__88578 = cljs.core._nth(params,(2));
var G__88579 = cljs.core._nth(params,(3));
var G__88580 = cljs.core._nth(params,(4));
var G__88581 = cljs.core._nth(params,(5));
var G__88582 = cljs.core._nth(params,(6));
var G__88583 = cljs.core._nth(params,(7));
var G__88584 = cljs.core._nth(params,(8));
var G__88585 = cljs.core._nth(params,(9));
var G__88586 = cljs.core._nth(params,(10));
var G__88587 = cljs.core._nth(params,(11));
var G__88588 = cljs.core._nth(params,(12));
var G__88589 = cljs.core._nth(params,(13));
var G__88590 = cljs.core._nth(params,(14));
var G__88591 = cljs.core._nth(params,(15));
var G__88592 = cljs.core._nth(params,(16));
return (function() { 
var sci$impl$fns$fun_$_arity_17__delegate = function (G__88558,G__88559,G__88560,G__88561,G__88562,G__88563,G__88564,G__88565,G__88566,G__88567,G__88568,G__88569,G__88570,G__88571,G__88572,G__88573,G__88574,G__88575){
var invoc_array = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1(invoc_size);
if(cljs.core.truth_(enclosed__GT_invocation)){
(enclosed__GT_invocation.cljs$core$IFn$_invoke$arity$2 ? enclosed__GT_invocation.cljs$core$IFn$_invoke$arity$2(enclosed_array,invoc_array) : enclosed__GT_invocation.call(null,enclosed_array,invoc_array));
} else {
}

(invoc_array[(0)] = G__88558);

(invoc_array[(1)] = G__88559);

(invoc_array[(2)] = G__88560);

(invoc_array[(3)] = G__88561);

(invoc_array[(4)] = G__88562);

(invoc_array[(5)] = G__88563);

(invoc_array[(6)] = G__88564);

(invoc_array[(7)] = G__88565);

(invoc_array[(8)] = G__88566);

(invoc_array[(9)] = G__88567);

(invoc_array[(10)] = G__88568);

(invoc_array[(11)] = G__88569);

(invoc_array[(12)] = G__88570);

(invoc_array[(13)] = G__88571);

(invoc_array[(14)] = G__88572);

(invoc_array[(15)] = G__88573);

(invoc_array[(16)] = G__88574);

(invoc_array[vararg_idx] = G__88575);

while(true){
var ret__87204__auto__ = sci.impl.types.eval(body,ctx,invoc_array);
if(cljs.core.keyword_identical_QMARK_(new cljs.core.Keyword("sci.impl.analyzer","recur","sci.impl.analyzer/recur",2033369355),ret__87204__auto__)){
continue;
} else {
return ret__87204__auto__;
}
break;
}
};
var sci$impl$fns$fun_$_arity_17 = function (G__88558,G__88559,G__88560,G__88561,G__88562,G__88563,G__88564,G__88565,G__88566,G__88567,G__88568,G__88569,G__88570,G__88571,G__88572,G__88573,G__88574,var_args){
var G__88575 = null;
if (arguments.length > 17) {
var G__89312__i = 0, G__89312__a = new Array(arguments.length -  17);
while (G__89312__i < G__89312__a.length) {G__89312__a[G__89312__i] = arguments[G__89312__i + 17]; ++G__89312__i;}
  G__88575 = new cljs.core.IndexedSeq(G__89312__a,0,null);
} 
return sci$impl$fns$fun_$_arity_17__delegate.call(this,G__88558,G__88559,G__88560,G__88561,G__88562,G__88563,G__88564,G__88565,G__88566,G__88567,G__88568,G__88569,G__88570,G__88571,G__88572,G__88573,G__88574,G__88575);};
sci$impl$fns$fun_$_arity_17.cljs$lang$maxFixedArity = 17;
sci$impl$fns$fun_$_arity_17.cljs$lang$applyTo = (function (arglist__89313){
var G__88558 = cljs.core.first(arglist__89313);
arglist__89313 = cljs.core.next(arglist__89313);
var G__88559 = cljs.core.first(arglist__89313);
arglist__89313 = cljs.core.next(arglist__89313);
var G__88560 = cljs.core.first(arglist__89313);
arglist__89313 = cljs.core.next(arglist__89313);
var G__88561 = cljs.core.first(arglist__89313);
arglist__89313 = cljs.core.next(arglist__89313);
var G__88562 = cljs.core.first(arglist__89313);
arglist__89313 = cljs.core.next(arglist__89313);
var G__88563 = cljs.core.first(arglist__89313);
arglist__89313 = cljs.core.next(arglist__89313);
var G__88564 = cljs.core.first(arglist__89313);
arglist__89313 = cljs.core.next(arglist__89313);
var G__88565 = cljs.core.first(arglist__89313);
arglist__89313 = cljs.core.next(arglist__89313);
var G__88566 = cljs.core.first(arglist__89313);
arglist__89313 = cljs.core.next(arglist__89313);
var G__88567 = cljs.core.first(arglist__89313);
arglist__89313 = cljs.core.next(arglist__89313);
var G__88568 = cljs.core.first(arglist__89313);
arglist__89313 = cljs.core.next(arglist__89313);
var G__88569 = cljs.core.first(arglist__89313);
arglist__89313 = cljs.core.next(arglist__89313);
var G__88570 = cljs.core.first(arglist__89313);
arglist__89313 = cljs.core.next(arglist__89313);
var G__88571 = cljs.core.first(arglist__89313);
arglist__89313 = cljs.core.next(arglist__89313);
var G__88572 = cljs.core.first(arglist__89313);
arglist__89313 = cljs.core.next(arglist__89313);
var G__88573 = cljs.core.first(arglist__89313);
arglist__89313 = cljs.core.next(arglist__89313);
var G__88574 = cljs.core.first(arglist__89313);
var G__88575 = cljs.core.rest(arglist__89313);
return sci$impl$fns$fun_$_arity_17__delegate(G__88558,G__88559,G__88560,G__88561,G__88562,G__88563,G__88564,G__88565,G__88566,G__88567,G__88568,G__88569,G__88570,G__88571,G__88572,G__88573,G__88574,G__88575);
});
sci$impl$fns$fun_$_arity_17.cljs$core$IFn$_invoke$arity$variadic = sci$impl$fns$fun_$_arity_17__delegate;
return sci$impl$fns$fun_$_arity_17;
})()
;

break;
case (18):
var G__88621 = cljs.core._nth(params,(0));
var G__88622 = cljs.core._nth(params,(1));
var G__88623 = cljs.core._nth(params,(2));
var G__88624 = cljs.core._nth(params,(3));
var G__88625 = cljs.core._nth(params,(4));
var G__88626 = cljs.core._nth(params,(5));
var G__88627 = cljs.core._nth(params,(6));
var G__88628 = cljs.core._nth(params,(7));
var G__88629 = cljs.core._nth(params,(8));
var G__88630 = cljs.core._nth(params,(9));
var G__88631 = cljs.core._nth(params,(10));
var G__88632 = cljs.core._nth(params,(11));
var G__88633 = cljs.core._nth(params,(12));
var G__88634 = cljs.core._nth(params,(13));
var G__88635 = cljs.core._nth(params,(14));
var G__88636 = cljs.core._nth(params,(15));
var G__88637 = cljs.core._nth(params,(16));
var G__88638 = cljs.core._nth(params,(17));
return (function() { 
var sci$impl$fns$fun_$_arity_18__delegate = function (G__88602,G__88603,G__88604,G__88605,G__88606,G__88607,G__88608,G__88609,G__88610,G__88611,G__88612,G__88613,G__88614,G__88615,G__88616,G__88617,G__88618,G__88619,G__88620){
var invoc_array = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1(invoc_size);
if(cljs.core.truth_(enclosed__GT_invocation)){
(enclosed__GT_invocation.cljs$core$IFn$_invoke$arity$2 ? enclosed__GT_invocation.cljs$core$IFn$_invoke$arity$2(enclosed_array,invoc_array) : enclosed__GT_invocation.call(null,enclosed_array,invoc_array));
} else {
}

(invoc_array[(0)] = G__88602);

(invoc_array[(1)] = G__88603);

(invoc_array[(2)] = G__88604);

(invoc_array[(3)] = G__88605);

(invoc_array[(4)] = G__88606);

(invoc_array[(5)] = G__88607);

(invoc_array[(6)] = G__88608);

(invoc_array[(7)] = G__88609);

(invoc_array[(8)] = G__88610);

(invoc_array[(9)] = G__88611);

(invoc_array[(10)] = G__88612);

(invoc_array[(11)] = G__88613);

(invoc_array[(12)] = G__88614);

(invoc_array[(13)] = G__88615);

(invoc_array[(14)] = G__88616);

(invoc_array[(15)] = G__88617);

(invoc_array[(16)] = G__88618);

(invoc_array[(17)] = G__88619);

(invoc_array[vararg_idx] = G__88620);

while(true){
var ret__87204__auto__ = sci.impl.types.eval(body,ctx,invoc_array);
if(cljs.core.keyword_identical_QMARK_(new cljs.core.Keyword("sci.impl.analyzer","recur","sci.impl.analyzer/recur",2033369355),ret__87204__auto__)){
continue;
} else {
return ret__87204__auto__;
}
break;
}
};
var sci$impl$fns$fun_$_arity_18 = function (G__88602,G__88603,G__88604,G__88605,G__88606,G__88607,G__88608,G__88609,G__88610,G__88611,G__88612,G__88613,G__88614,G__88615,G__88616,G__88617,G__88618,G__88619,var_args){
var G__88620 = null;
if (arguments.length > 18) {
var G__89316__i = 0, G__89316__a = new Array(arguments.length -  18);
while (G__89316__i < G__89316__a.length) {G__89316__a[G__89316__i] = arguments[G__89316__i + 18]; ++G__89316__i;}
  G__88620 = new cljs.core.IndexedSeq(G__89316__a,0,null);
} 
return sci$impl$fns$fun_$_arity_18__delegate.call(this,G__88602,G__88603,G__88604,G__88605,G__88606,G__88607,G__88608,G__88609,G__88610,G__88611,G__88612,G__88613,G__88614,G__88615,G__88616,G__88617,G__88618,G__88619,G__88620);};
sci$impl$fns$fun_$_arity_18.cljs$lang$maxFixedArity = 18;
sci$impl$fns$fun_$_arity_18.cljs$lang$applyTo = (function (arglist__89317){
var G__88602 = cljs.core.first(arglist__89317);
arglist__89317 = cljs.core.next(arglist__89317);
var G__88603 = cljs.core.first(arglist__89317);
arglist__89317 = cljs.core.next(arglist__89317);
var G__88604 = cljs.core.first(arglist__89317);
arglist__89317 = cljs.core.next(arglist__89317);
var G__88605 = cljs.core.first(arglist__89317);
arglist__89317 = cljs.core.next(arglist__89317);
var G__88606 = cljs.core.first(arglist__89317);
arglist__89317 = cljs.core.next(arglist__89317);
var G__88607 = cljs.core.first(arglist__89317);
arglist__89317 = cljs.core.next(arglist__89317);
var G__88608 = cljs.core.first(arglist__89317);
arglist__89317 = cljs.core.next(arglist__89317);
var G__88609 = cljs.core.first(arglist__89317);
arglist__89317 = cljs.core.next(arglist__89317);
var G__88610 = cljs.core.first(arglist__89317);
arglist__89317 = cljs.core.next(arglist__89317);
var G__88611 = cljs.core.first(arglist__89317);
arglist__89317 = cljs.core.next(arglist__89317);
var G__88612 = cljs.core.first(arglist__89317);
arglist__89317 = cljs.core.next(arglist__89317);
var G__88613 = cljs.core.first(arglist__89317);
arglist__89317 = cljs.core.next(arglist__89317);
var G__88614 = cljs.core.first(arglist__89317);
arglist__89317 = cljs.core.next(arglist__89317);
var G__88615 = cljs.core.first(arglist__89317);
arglist__89317 = cljs.core.next(arglist__89317);
var G__88616 = cljs.core.first(arglist__89317);
arglist__89317 = cljs.core.next(arglist__89317);
var G__88617 = cljs.core.first(arglist__89317);
arglist__89317 = cljs.core.next(arglist__89317);
var G__88618 = cljs.core.first(arglist__89317);
arglist__89317 = cljs.core.next(arglist__89317);
var G__88619 = cljs.core.first(arglist__89317);
var G__88620 = cljs.core.rest(arglist__89317);
return sci$impl$fns$fun_$_arity_18__delegate(G__88602,G__88603,G__88604,G__88605,G__88606,G__88607,G__88608,G__88609,G__88610,G__88611,G__88612,G__88613,G__88614,G__88615,G__88616,G__88617,G__88618,G__88619,G__88620);
});
sci$impl$fns$fun_$_arity_18.cljs$core$IFn$_invoke$arity$variadic = sci$impl$fns$fun_$_arity_18__delegate;
return sci$impl$fns$fun_$_arity_18;
})()
;

break;
case (19):
var G__88663 = cljs.core._nth(params,(0));
var G__88664 = cljs.core._nth(params,(1));
var G__88665 = cljs.core._nth(params,(2));
var G__88666 = cljs.core._nth(params,(3));
var G__88667 = cljs.core._nth(params,(4));
var G__88668 = cljs.core._nth(params,(5));
var G__88669 = cljs.core._nth(params,(6));
var G__88670 = cljs.core._nth(params,(7));
var G__88671 = cljs.core._nth(params,(8));
var G__88672 = cljs.core._nth(params,(9));
var G__88673 = cljs.core._nth(params,(10));
var G__88674 = cljs.core._nth(params,(11));
var G__88675 = cljs.core._nth(params,(12));
var G__88676 = cljs.core._nth(params,(13));
var G__88677 = cljs.core._nth(params,(14));
var G__88678 = cljs.core._nth(params,(15));
var G__88679 = cljs.core._nth(params,(16));
var G__88680 = cljs.core._nth(params,(17));
var G__88681 = cljs.core._nth(params,(18));
return (function() { 
var sci$impl$fns$fun_$_arity_19__delegate = function (G__88643,G__88644,G__88645,G__88646,G__88647,G__88648,G__88649,G__88650,G__88651,G__88652,G__88653,G__88654,G__88655,G__88656,G__88657,G__88658,G__88659,G__88660,G__88661,G__88662){
var invoc_array = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1(invoc_size);
if(cljs.core.truth_(enclosed__GT_invocation)){
(enclosed__GT_invocation.cljs$core$IFn$_invoke$arity$2 ? enclosed__GT_invocation.cljs$core$IFn$_invoke$arity$2(enclosed_array,invoc_array) : enclosed__GT_invocation.call(null,enclosed_array,invoc_array));
} else {
}

(invoc_array[(0)] = G__88643);

(invoc_array[(1)] = G__88644);

(invoc_array[(2)] = G__88645);

(invoc_array[(3)] = G__88646);

(invoc_array[(4)] = G__88647);

(invoc_array[(5)] = G__88648);

(invoc_array[(6)] = G__88649);

(invoc_array[(7)] = G__88650);

(invoc_array[(8)] = G__88651);

(invoc_array[(9)] = G__88652);

(invoc_array[(10)] = G__88653);

(invoc_array[(11)] = G__88654);

(invoc_array[(12)] = G__88655);

(invoc_array[(13)] = G__88656);

(invoc_array[(14)] = G__88657);

(invoc_array[(15)] = G__88658);

(invoc_array[(16)] = G__88659);

(invoc_array[(17)] = G__88660);

(invoc_array[(18)] = G__88661);

(invoc_array[vararg_idx] = G__88662);

while(true){
var ret__87204__auto__ = sci.impl.types.eval(body,ctx,invoc_array);
if(cljs.core.keyword_identical_QMARK_(new cljs.core.Keyword("sci.impl.analyzer","recur","sci.impl.analyzer/recur",2033369355),ret__87204__auto__)){
continue;
} else {
return ret__87204__auto__;
}
break;
}
};
var sci$impl$fns$fun_$_arity_19 = function (G__88643,G__88644,G__88645,G__88646,G__88647,G__88648,G__88649,G__88650,G__88651,G__88652,G__88653,G__88654,G__88655,G__88656,G__88657,G__88658,G__88659,G__88660,G__88661,var_args){
var G__88662 = null;
if (arguments.length > 19) {
var G__89324__i = 0, G__89324__a = new Array(arguments.length -  19);
while (G__89324__i < G__89324__a.length) {G__89324__a[G__89324__i] = arguments[G__89324__i + 19]; ++G__89324__i;}
  G__88662 = new cljs.core.IndexedSeq(G__89324__a,0,null);
} 
return sci$impl$fns$fun_$_arity_19__delegate.call(this,G__88643,G__88644,G__88645,G__88646,G__88647,G__88648,G__88649,G__88650,G__88651,G__88652,G__88653,G__88654,G__88655,G__88656,G__88657,G__88658,G__88659,G__88660,G__88661,G__88662);};
sci$impl$fns$fun_$_arity_19.cljs$lang$maxFixedArity = 19;
sci$impl$fns$fun_$_arity_19.cljs$lang$applyTo = (function (arglist__89325){
var G__88643 = cljs.core.first(arglist__89325);
arglist__89325 = cljs.core.next(arglist__89325);
var G__88644 = cljs.core.first(arglist__89325);
arglist__89325 = cljs.core.next(arglist__89325);
var G__88645 = cljs.core.first(arglist__89325);
arglist__89325 = cljs.core.next(arglist__89325);
var G__88646 = cljs.core.first(arglist__89325);
arglist__89325 = cljs.core.next(arglist__89325);
var G__88647 = cljs.core.first(arglist__89325);
arglist__89325 = cljs.core.next(arglist__89325);
var G__88648 = cljs.core.first(arglist__89325);
arglist__89325 = cljs.core.next(arglist__89325);
var G__88649 = cljs.core.first(arglist__89325);
arglist__89325 = cljs.core.next(arglist__89325);
var G__88650 = cljs.core.first(arglist__89325);
arglist__89325 = cljs.core.next(arglist__89325);
var G__88651 = cljs.core.first(arglist__89325);
arglist__89325 = cljs.core.next(arglist__89325);
var G__88652 = cljs.core.first(arglist__89325);
arglist__89325 = cljs.core.next(arglist__89325);
var G__88653 = cljs.core.first(arglist__89325);
arglist__89325 = cljs.core.next(arglist__89325);
var G__88654 = cljs.core.first(arglist__89325);
arglist__89325 = cljs.core.next(arglist__89325);
var G__88655 = cljs.core.first(arglist__89325);
arglist__89325 = cljs.core.next(arglist__89325);
var G__88656 = cljs.core.first(arglist__89325);
arglist__89325 = cljs.core.next(arglist__89325);
var G__88657 = cljs.core.first(arglist__89325);
arglist__89325 = cljs.core.next(arglist__89325);
var G__88658 = cljs.core.first(arglist__89325);
arglist__89325 = cljs.core.next(arglist__89325);
var G__88659 = cljs.core.first(arglist__89325);
arglist__89325 = cljs.core.next(arglist__89325);
var G__88660 = cljs.core.first(arglist__89325);
arglist__89325 = cljs.core.next(arglist__89325);
var G__88661 = cljs.core.first(arglist__89325);
var G__88662 = cljs.core.rest(arglist__89325);
return sci$impl$fns$fun_$_arity_19__delegate(G__88643,G__88644,G__88645,G__88646,G__88647,G__88648,G__88649,G__88650,G__88651,G__88652,G__88653,G__88654,G__88655,G__88656,G__88657,G__88658,G__88659,G__88660,G__88661,G__88662);
});
sci$impl$fns$fun_$_arity_19.cljs$core$IFn$_invoke$arity$variadic = sci$impl$fns$fun_$_arity_19__delegate;
return sci$impl$fns$fun_$_arity_19;
})()
;

break;
case (20):
var G__88709 = cljs.core._nth(params,(0));
var G__88710 = cljs.core._nth(params,(1));
var G__88711 = cljs.core._nth(params,(2));
var G__88712 = cljs.core._nth(params,(3));
var G__88713 = cljs.core._nth(params,(4));
var G__88714 = cljs.core._nth(params,(5));
var G__88715 = cljs.core._nth(params,(6));
var G__88716 = cljs.core._nth(params,(7));
var G__88717 = cljs.core._nth(params,(8));
var G__88718 = cljs.core._nth(params,(9));
var G__88719 = cljs.core._nth(params,(10));
var G__88720 = cljs.core._nth(params,(11));
var G__88721 = cljs.core._nth(params,(12));
var G__88722 = cljs.core._nth(params,(13));
var G__88723 = cljs.core._nth(params,(14));
var G__88724 = cljs.core._nth(params,(15));
var G__88725 = cljs.core._nth(params,(16));
var G__88726 = cljs.core._nth(params,(17));
var G__88727 = cljs.core._nth(params,(18));
var G__88728 = cljs.core._nth(params,(19));
return (function() { 
var sci$impl$fns$fun_$_arity_20__delegate = function (G__88688,G__88689,G__88690,G__88691,G__88692,G__88693,G__88694,G__88695,G__88696,G__88697,G__88698,G__88699,G__88700,G__88701,G__88702,G__88703,G__88704,G__88705,G__88706,G__88707,G__88708){
var invoc_array = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1(invoc_size);
if(cljs.core.truth_(enclosed__GT_invocation)){
(enclosed__GT_invocation.cljs$core$IFn$_invoke$arity$2 ? enclosed__GT_invocation.cljs$core$IFn$_invoke$arity$2(enclosed_array,invoc_array) : enclosed__GT_invocation.call(null,enclosed_array,invoc_array));
} else {
}

(invoc_array[(0)] = G__88688);

(invoc_array[(1)] = G__88689);

(invoc_array[(2)] = G__88690);

(invoc_array[(3)] = G__88691);

(invoc_array[(4)] = G__88692);

(invoc_array[(5)] = G__88693);

(invoc_array[(6)] = G__88694);

(invoc_array[(7)] = G__88695);

(invoc_array[(8)] = G__88696);

(invoc_array[(9)] = G__88697);

(invoc_array[(10)] = G__88698);

(invoc_array[(11)] = G__88699);

(invoc_array[(12)] = G__88700);

(invoc_array[(13)] = G__88701);

(invoc_array[(14)] = G__88702);

(invoc_array[(15)] = G__88703);

(invoc_array[(16)] = G__88704);

(invoc_array[(17)] = G__88705);

(invoc_array[(18)] = G__88706);

(invoc_array[(19)] = G__88707);

(invoc_array[vararg_idx] = G__88708);

while(true){
var ret__87204__auto__ = sci.impl.types.eval(body,ctx,invoc_array);
if(cljs.core.keyword_identical_QMARK_(new cljs.core.Keyword("sci.impl.analyzer","recur","sci.impl.analyzer/recur",2033369355),ret__87204__auto__)){
continue;
} else {
return ret__87204__auto__;
}
break;
}
};
var sci$impl$fns$fun_$_arity_20 = function (G__88688,G__88689,G__88690,G__88691,G__88692,G__88693,G__88694,G__88695,G__88696,G__88697,G__88698,G__88699,G__88700,G__88701,G__88702,G__88703,G__88704,G__88705,G__88706,G__88707,var_args){
var G__88708 = null;
if (arguments.length > 20) {
var G__89330__i = 0, G__89330__a = new Array(arguments.length -  20);
while (G__89330__i < G__89330__a.length) {G__89330__a[G__89330__i] = arguments[G__89330__i + 20]; ++G__89330__i;}
  G__88708 = new cljs.core.IndexedSeq(G__89330__a,0,null);
} 
return sci$impl$fns$fun_$_arity_20__delegate.call(this,G__88688,G__88689,G__88690,G__88691,G__88692,G__88693,G__88694,G__88695,G__88696,G__88697,G__88698,G__88699,G__88700,G__88701,G__88702,G__88703,G__88704,G__88705,G__88706,G__88707,G__88708);};
sci$impl$fns$fun_$_arity_20.cljs$lang$maxFixedArity = 20;
sci$impl$fns$fun_$_arity_20.cljs$lang$applyTo = (function (arglist__89331){
var G__88688 = cljs.core.first(arglist__89331);
arglist__89331 = cljs.core.next(arglist__89331);
var G__88689 = cljs.core.first(arglist__89331);
arglist__89331 = cljs.core.next(arglist__89331);
var G__88690 = cljs.core.first(arglist__89331);
arglist__89331 = cljs.core.next(arglist__89331);
var G__88691 = cljs.core.first(arglist__89331);
arglist__89331 = cljs.core.next(arglist__89331);
var G__88692 = cljs.core.first(arglist__89331);
arglist__89331 = cljs.core.next(arglist__89331);
var G__88693 = cljs.core.first(arglist__89331);
arglist__89331 = cljs.core.next(arglist__89331);
var G__88694 = cljs.core.first(arglist__89331);
arglist__89331 = cljs.core.next(arglist__89331);
var G__88695 = cljs.core.first(arglist__89331);
arglist__89331 = cljs.core.next(arglist__89331);
var G__88696 = cljs.core.first(arglist__89331);
arglist__89331 = cljs.core.next(arglist__89331);
var G__88697 = cljs.core.first(arglist__89331);
arglist__89331 = cljs.core.next(arglist__89331);
var G__88698 = cljs.core.first(arglist__89331);
arglist__89331 = cljs.core.next(arglist__89331);
var G__88699 = cljs.core.first(arglist__89331);
arglist__89331 = cljs.core.next(arglist__89331);
var G__88700 = cljs.core.first(arglist__89331);
arglist__89331 = cljs.core.next(arglist__89331);
var G__88701 = cljs.core.first(arglist__89331);
arglist__89331 = cljs.core.next(arglist__89331);
var G__88702 = cljs.core.first(arglist__89331);
arglist__89331 = cljs.core.next(arglist__89331);
var G__88703 = cljs.core.first(arglist__89331);
arglist__89331 = cljs.core.next(arglist__89331);
var G__88704 = cljs.core.first(arglist__89331);
arglist__89331 = cljs.core.next(arglist__89331);
var G__88705 = cljs.core.first(arglist__89331);
arglist__89331 = cljs.core.next(arglist__89331);
var G__88706 = cljs.core.first(arglist__89331);
arglist__89331 = cljs.core.next(arglist__89331);
var G__88707 = cljs.core.first(arglist__89331);
var G__88708 = cljs.core.rest(arglist__89331);
return sci$impl$fns$fun_$_arity_20__delegate(G__88688,G__88689,G__88690,G__88691,G__88692,G__88693,G__88694,G__88695,G__88696,G__88697,G__88698,G__88699,G__88700,G__88701,G__88702,G__88703,G__88704,G__88705,G__88706,G__88707,G__88708);
});
sci$impl$fns$fun_$_arity_20.cljs$core$IFn$_invoke$arity$variadic = sci$impl$fns$fun_$_arity_20__delegate;
return sci$impl$fns$fun_$_arity_20;
})()
;

break;
default:
throw (new Error(["No matching clause: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(G__88227)].join('')));

}
})():(function (){var G__88734 = (fixed_arity | (0));
switch (G__88734) {
case (0):
return (function sci$impl$fns$fun_$_arity_0(){
var invoc_array = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1(invoc_size);
if(cljs.core.truth_(enclosed__GT_invocation)){
(enclosed__GT_invocation.cljs$core$IFn$_invoke$arity$2 ? enclosed__GT_invocation.cljs$core$IFn$_invoke$arity$2(enclosed_array,invoc_array) : enclosed__GT_invocation.call(null,enclosed_array,invoc_array));
} else {
}

while(true){
var ret__87203__auto__ = sci.impl.types.eval(body,ctx,invoc_array);
if(cljs.core.keyword_identical_QMARK_(new cljs.core.Keyword("sci.impl.analyzer","recur","sci.impl.analyzer/recur",2033369355),ret__87203__auto__)){
continue;
} else {
return ret__87203__auto__;
}
break;
}
});

break;
case (1):
var G__88736 = cljs.core._nth(params,(0));
return (function sci$impl$fns$fun_$_arity_1(G__88735){
var invoc_array = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1(invoc_size);
if(cljs.core.truth_(enclosed__GT_invocation)){
(enclosed__GT_invocation.cljs$core$IFn$_invoke$arity$2 ? enclosed__GT_invocation.cljs$core$IFn$_invoke$arity$2(enclosed_array,invoc_array) : enclosed__GT_invocation.call(null,enclosed_array,invoc_array));
} else {
}

(invoc_array[(0)] = G__88735);

while(true){
var ret__87204__auto__ = sci.impl.types.eval(body,ctx,invoc_array);
if(cljs.core.keyword_identical_QMARK_(new cljs.core.Keyword("sci.impl.analyzer","recur","sci.impl.analyzer/recur",2033369355),ret__87204__auto__)){
continue;
} else {
return ret__87204__auto__;
}
break;
}
});

break;
case (2):
var G__88741 = cljs.core._nth(params,(0));
var G__88742 = cljs.core._nth(params,(1));
return (function sci$impl$fns$fun_$_arity_2(G__88739,G__88740){
var invoc_array = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1(invoc_size);
if(cljs.core.truth_(enclosed__GT_invocation)){
(enclosed__GT_invocation.cljs$core$IFn$_invoke$arity$2 ? enclosed__GT_invocation.cljs$core$IFn$_invoke$arity$2(enclosed_array,invoc_array) : enclosed__GT_invocation.call(null,enclosed_array,invoc_array));
} else {
}

(invoc_array[(0)] = G__88739);

(invoc_array[(1)] = G__88740);

while(true){
var ret__87204__auto__ = sci.impl.types.eval(body,ctx,invoc_array);
if(cljs.core.keyword_identical_QMARK_(new cljs.core.Keyword("sci.impl.analyzer","recur","sci.impl.analyzer/recur",2033369355),ret__87204__auto__)){
continue;
} else {
return ret__87204__auto__;
}
break;
}
});

break;
case (3):
var G__88748 = cljs.core._nth(params,(0));
var G__88749 = cljs.core._nth(params,(1));
var G__88750 = cljs.core._nth(params,(2));
return (function sci$impl$fns$fun_$_arity_3(G__88745,G__88746,G__88747){
var invoc_array = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1(invoc_size);
if(cljs.core.truth_(enclosed__GT_invocation)){
(enclosed__GT_invocation.cljs$core$IFn$_invoke$arity$2 ? enclosed__GT_invocation.cljs$core$IFn$_invoke$arity$2(enclosed_array,invoc_array) : enclosed__GT_invocation.call(null,enclosed_array,invoc_array));
} else {
}

(invoc_array[(0)] = G__88745);

(invoc_array[(1)] = G__88746);

(invoc_array[(2)] = G__88747);

while(true){
var ret__87204__auto__ = sci.impl.types.eval(body,ctx,invoc_array);
if(cljs.core.keyword_identical_QMARK_(new cljs.core.Keyword("sci.impl.analyzer","recur","sci.impl.analyzer/recur",2033369355),ret__87204__auto__)){
continue;
} else {
return ret__87204__auto__;
}
break;
}
});

break;
case (4):
var G__88757 = cljs.core._nth(params,(0));
var G__88758 = cljs.core._nth(params,(1));
var G__88759 = cljs.core._nth(params,(2));
var G__88760 = cljs.core._nth(params,(3));
return (function sci$impl$fns$fun_$_arity_4(G__88753,G__88754,G__88755,G__88756){
var invoc_array = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1(invoc_size);
if(cljs.core.truth_(enclosed__GT_invocation)){
(enclosed__GT_invocation.cljs$core$IFn$_invoke$arity$2 ? enclosed__GT_invocation.cljs$core$IFn$_invoke$arity$2(enclosed_array,invoc_array) : enclosed__GT_invocation.call(null,enclosed_array,invoc_array));
} else {
}

(invoc_array[(0)] = G__88753);

(invoc_array[(1)] = G__88754);

(invoc_array[(2)] = G__88755);

(invoc_array[(3)] = G__88756);

while(true){
var ret__87204__auto__ = sci.impl.types.eval(body,ctx,invoc_array);
if(cljs.core.keyword_identical_QMARK_(new cljs.core.Keyword("sci.impl.analyzer","recur","sci.impl.analyzer/recur",2033369355),ret__87204__auto__)){
continue;
} else {
return ret__87204__auto__;
}
break;
}
});

break;
case (5):
var G__88770 = cljs.core._nth(params,(0));
var G__88771 = cljs.core._nth(params,(1));
var G__88772 = cljs.core._nth(params,(2));
var G__88773 = cljs.core._nth(params,(3));
var G__88774 = cljs.core._nth(params,(4));
return (function sci$impl$fns$fun_$_arity_5(G__88765,G__88766,G__88767,G__88768,G__88769){
var invoc_array = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1(invoc_size);
if(cljs.core.truth_(enclosed__GT_invocation)){
(enclosed__GT_invocation.cljs$core$IFn$_invoke$arity$2 ? enclosed__GT_invocation.cljs$core$IFn$_invoke$arity$2(enclosed_array,invoc_array) : enclosed__GT_invocation.call(null,enclosed_array,invoc_array));
} else {
}

(invoc_array[(0)] = G__88765);

(invoc_array[(1)] = G__88766);

(invoc_array[(2)] = G__88767);

(invoc_array[(3)] = G__88768);

(invoc_array[(4)] = G__88769);

while(true){
var ret__87204__auto__ = sci.impl.types.eval(body,ctx,invoc_array);
if(cljs.core.keyword_identical_QMARK_(new cljs.core.Keyword("sci.impl.analyzer","recur","sci.impl.analyzer/recur",2033369355),ret__87204__auto__)){
continue;
} else {
return ret__87204__auto__;
}
break;
}
});

break;
case (6):
var G__88783 = cljs.core._nth(params,(0));
var G__88784 = cljs.core._nth(params,(1));
var G__88785 = cljs.core._nth(params,(2));
var G__88786 = cljs.core._nth(params,(3));
var G__88787 = cljs.core._nth(params,(4));
var G__88788 = cljs.core._nth(params,(5));
return (function sci$impl$fns$fun_$_arity_6(G__88777,G__88778,G__88779,G__88780,G__88781,G__88782){
var invoc_array = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1(invoc_size);
if(cljs.core.truth_(enclosed__GT_invocation)){
(enclosed__GT_invocation.cljs$core$IFn$_invoke$arity$2 ? enclosed__GT_invocation.cljs$core$IFn$_invoke$arity$2(enclosed_array,invoc_array) : enclosed__GT_invocation.call(null,enclosed_array,invoc_array));
} else {
}

(invoc_array[(0)] = G__88777);

(invoc_array[(1)] = G__88778);

(invoc_array[(2)] = G__88779);

(invoc_array[(3)] = G__88780);

(invoc_array[(4)] = G__88781);

(invoc_array[(5)] = G__88782);

while(true){
var ret__87204__auto__ = sci.impl.types.eval(body,ctx,invoc_array);
if(cljs.core.keyword_identical_QMARK_(new cljs.core.Keyword("sci.impl.analyzer","recur","sci.impl.analyzer/recur",2033369355),ret__87204__auto__)){
continue;
} else {
return ret__87204__auto__;
}
break;
}
});

break;
case (7):
var G__88798 = cljs.core._nth(params,(0));
var G__88799 = cljs.core._nth(params,(1));
var G__88800 = cljs.core._nth(params,(2));
var G__88801 = cljs.core._nth(params,(3));
var G__88802 = cljs.core._nth(params,(4));
var G__88803 = cljs.core._nth(params,(5));
var G__88804 = cljs.core._nth(params,(6));
return (function sci$impl$fns$fun_$_arity_7(G__88791,G__88792,G__88793,G__88794,G__88795,G__88796,G__88797){
var invoc_array = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1(invoc_size);
if(cljs.core.truth_(enclosed__GT_invocation)){
(enclosed__GT_invocation.cljs$core$IFn$_invoke$arity$2 ? enclosed__GT_invocation.cljs$core$IFn$_invoke$arity$2(enclosed_array,invoc_array) : enclosed__GT_invocation.call(null,enclosed_array,invoc_array));
} else {
}

(invoc_array[(0)] = G__88791);

(invoc_array[(1)] = G__88792);

(invoc_array[(2)] = G__88793);

(invoc_array[(3)] = G__88794);

(invoc_array[(4)] = G__88795);

(invoc_array[(5)] = G__88796);

(invoc_array[(6)] = G__88797);

while(true){
var ret__87204__auto__ = sci.impl.types.eval(body,ctx,invoc_array);
if(cljs.core.keyword_identical_QMARK_(new cljs.core.Keyword("sci.impl.analyzer","recur","sci.impl.analyzer/recur",2033369355),ret__87204__auto__)){
continue;
} else {
return ret__87204__auto__;
}
break;
}
});

break;
case (8):
var G__88814 = cljs.core._nth(params,(0));
var G__88815 = cljs.core._nth(params,(1));
var G__88816 = cljs.core._nth(params,(2));
var G__88817 = cljs.core._nth(params,(3));
var G__88818 = cljs.core._nth(params,(4));
var G__88819 = cljs.core._nth(params,(5));
var G__88820 = cljs.core._nth(params,(6));
var G__88821 = cljs.core._nth(params,(7));
return (function sci$impl$fns$fun_$_arity_8(G__88806,G__88807,G__88808,G__88809,G__88810,G__88811,G__88812,G__88813){
var invoc_array = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1(invoc_size);
if(cljs.core.truth_(enclosed__GT_invocation)){
(enclosed__GT_invocation.cljs$core$IFn$_invoke$arity$2 ? enclosed__GT_invocation.cljs$core$IFn$_invoke$arity$2(enclosed_array,invoc_array) : enclosed__GT_invocation.call(null,enclosed_array,invoc_array));
} else {
}

(invoc_array[(0)] = G__88806);

(invoc_array[(1)] = G__88807);

(invoc_array[(2)] = G__88808);

(invoc_array[(3)] = G__88809);

(invoc_array[(4)] = G__88810);

(invoc_array[(5)] = G__88811);

(invoc_array[(6)] = G__88812);

(invoc_array[(7)] = G__88813);

while(true){
var ret__87204__auto__ = sci.impl.types.eval(body,ctx,invoc_array);
if(cljs.core.keyword_identical_QMARK_(new cljs.core.Keyword("sci.impl.analyzer","recur","sci.impl.analyzer/recur",2033369355),ret__87204__auto__)){
continue;
} else {
return ret__87204__auto__;
}
break;
}
});

break;
case (9):
var G__88832 = cljs.core._nth(params,(0));
var G__88833 = cljs.core._nth(params,(1));
var G__88834 = cljs.core._nth(params,(2));
var G__88835 = cljs.core._nth(params,(3));
var G__88836 = cljs.core._nth(params,(4));
var G__88837 = cljs.core._nth(params,(5));
var G__88838 = cljs.core._nth(params,(6));
var G__88839 = cljs.core._nth(params,(7));
var G__88840 = cljs.core._nth(params,(8));
return (function sci$impl$fns$fun_$_arity_9(G__88823,G__88824,G__88825,G__88826,G__88827,G__88828,G__88829,G__88830,G__88831){
var invoc_array = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1(invoc_size);
if(cljs.core.truth_(enclosed__GT_invocation)){
(enclosed__GT_invocation.cljs$core$IFn$_invoke$arity$2 ? enclosed__GT_invocation.cljs$core$IFn$_invoke$arity$2(enclosed_array,invoc_array) : enclosed__GT_invocation.call(null,enclosed_array,invoc_array));
} else {
}

(invoc_array[(0)] = G__88823);

(invoc_array[(1)] = G__88824);

(invoc_array[(2)] = G__88825);

(invoc_array[(3)] = G__88826);

(invoc_array[(4)] = G__88827);

(invoc_array[(5)] = G__88828);

(invoc_array[(6)] = G__88829);

(invoc_array[(7)] = G__88830);

(invoc_array[(8)] = G__88831);

while(true){
var ret__87204__auto__ = sci.impl.types.eval(body,ctx,invoc_array);
if(cljs.core.keyword_identical_QMARK_(new cljs.core.Keyword("sci.impl.analyzer","recur","sci.impl.analyzer/recur",2033369355),ret__87204__auto__)){
continue;
} else {
return ret__87204__auto__;
}
break;
}
});

break;
case (10):
var G__88852 = cljs.core._nth(params,(0));
var G__88853 = cljs.core._nth(params,(1));
var G__88854 = cljs.core._nth(params,(2));
var G__88855 = cljs.core._nth(params,(3));
var G__88856 = cljs.core._nth(params,(4));
var G__88857 = cljs.core._nth(params,(5));
var G__88858 = cljs.core._nth(params,(6));
var G__88859 = cljs.core._nth(params,(7));
var G__88860 = cljs.core._nth(params,(8));
var G__88861 = cljs.core._nth(params,(9));
return (function sci$impl$fns$fun_$_arity_10(G__88842,G__88843,G__88844,G__88845,G__88846,G__88847,G__88848,G__88849,G__88850,G__88851){
var invoc_array = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1(invoc_size);
if(cljs.core.truth_(enclosed__GT_invocation)){
(enclosed__GT_invocation.cljs$core$IFn$_invoke$arity$2 ? enclosed__GT_invocation.cljs$core$IFn$_invoke$arity$2(enclosed_array,invoc_array) : enclosed__GT_invocation.call(null,enclosed_array,invoc_array));
} else {
}

(invoc_array[(0)] = G__88842);

(invoc_array[(1)] = G__88843);

(invoc_array[(2)] = G__88844);

(invoc_array[(3)] = G__88845);

(invoc_array[(4)] = G__88846);

(invoc_array[(5)] = G__88847);

(invoc_array[(6)] = G__88848);

(invoc_array[(7)] = G__88849);

(invoc_array[(8)] = G__88850);

(invoc_array[(9)] = G__88851);

while(true){
var ret__87204__auto__ = sci.impl.types.eval(body,ctx,invoc_array);
if(cljs.core.keyword_identical_QMARK_(new cljs.core.Keyword("sci.impl.analyzer","recur","sci.impl.analyzer/recur",2033369355),ret__87204__auto__)){
continue;
} else {
return ret__87204__auto__;
}
break;
}
});

break;
case (11):
var G__88875 = cljs.core._nth(params,(0));
var G__88876 = cljs.core._nth(params,(1));
var G__88877 = cljs.core._nth(params,(2));
var G__88878 = cljs.core._nth(params,(3));
var G__88879 = cljs.core._nth(params,(4));
var G__88880 = cljs.core._nth(params,(5));
var G__88881 = cljs.core._nth(params,(6));
var G__88882 = cljs.core._nth(params,(7));
var G__88883 = cljs.core._nth(params,(8));
var G__88884 = cljs.core._nth(params,(9));
var G__88885 = cljs.core._nth(params,(10));
return (function sci$impl$fns$fun_$_arity_11(G__88864,G__88865,G__88866,G__88867,G__88868,G__88869,G__88870,G__88871,G__88872,G__88873,G__88874){
var invoc_array = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1(invoc_size);
if(cljs.core.truth_(enclosed__GT_invocation)){
(enclosed__GT_invocation.cljs$core$IFn$_invoke$arity$2 ? enclosed__GT_invocation.cljs$core$IFn$_invoke$arity$2(enclosed_array,invoc_array) : enclosed__GT_invocation.call(null,enclosed_array,invoc_array));
} else {
}

(invoc_array[(0)] = G__88864);

(invoc_array[(1)] = G__88865);

(invoc_array[(2)] = G__88866);

(invoc_array[(3)] = G__88867);

(invoc_array[(4)] = G__88868);

(invoc_array[(5)] = G__88869);

(invoc_array[(6)] = G__88870);

(invoc_array[(7)] = G__88871);

(invoc_array[(8)] = G__88872);

(invoc_array[(9)] = G__88873);

(invoc_array[(10)] = G__88874);

while(true){
var ret__87204__auto__ = sci.impl.types.eval(body,ctx,invoc_array);
if(cljs.core.keyword_identical_QMARK_(new cljs.core.Keyword("sci.impl.analyzer","recur","sci.impl.analyzer/recur",2033369355),ret__87204__auto__)){
continue;
} else {
return ret__87204__auto__;
}
break;
}
});

break;
case (12):
var G__88898 = cljs.core._nth(params,(0));
var G__88899 = cljs.core._nth(params,(1));
var G__88900 = cljs.core._nth(params,(2));
var G__88901 = cljs.core._nth(params,(3));
var G__88902 = cljs.core._nth(params,(4));
var G__88903 = cljs.core._nth(params,(5));
var G__88904 = cljs.core._nth(params,(6));
var G__88905 = cljs.core._nth(params,(7));
var G__88906 = cljs.core._nth(params,(8));
var G__88907 = cljs.core._nth(params,(9));
var G__88908 = cljs.core._nth(params,(10));
var G__88909 = cljs.core._nth(params,(11));
return (function sci$impl$fns$fun_$_arity_12(G__88886,G__88887,G__88888,G__88889,G__88890,G__88891,G__88892,G__88893,G__88894,G__88895,G__88896,G__88897){
var invoc_array = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1(invoc_size);
if(cljs.core.truth_(enclosed__GT_invocation)){
(enclosed__GT_invocation.cljs$core$IFn$_invoke$arity$2 ? enclosed__GT_invocation.cljs$core$IFn$_invoke$arity$2(enclosed_array,invoc_array) : enclosed__GT_invocation.call(null,enclosed_array,invoc_array));
} else {
}

(invoc_array[(0)] = G__88886);

(invoc_array[(1)] = G__88887);

(invoc_array[(2)] = G__88888);

(invoc_array[(3)] = G__88889);

(invoc_array[(4)] = G__88890);

(invoc_array[(5)] = G__88891);

(invoc_array[(6)] = G__88892);

(invoc_array[(7)] = G__88893);

(invoc_array[(8)] = G__88894);

(invoc_array[(9)] = G__88895);

(invoc_array[(10)] = G__88896);

(invoc_array[(11)] = G__88897);

while(true){
var ret__87204__auto__ = sci.impl.types.eval(body,ctx,invoc_array);
if(cljs.core.keyword_identical_QMARK_(new cljs.core.Keyword("sci.impl.analyzer","recur","sci.impl.analyzer/recur",2033369355),ret__87204__auto__)){
continue;
} else {
return ret__87204__auto__;
}
break;
}
});

break;
case (13):
var G__88927 = cljs.core._nth(params,(0));
var G__88928 = cljs.core._nth(params,(1));
var G__88929 = cljs.core._nth(params,(2));
var G__88930 = cljs.core._nth(params,(3));
var G__88931 = cljs.core._nth(params,(4));
var G__88932 = cljs.core._nth(params,(5));
var G__88933 = cljs.core._nth(params,(6));
var G__88934 = cljs.core._nth(params,(7));
var G__88935 = cljs.core._nth(params,(8));
var G__88936 = cljs.core._nth(params,(9));
var G__88937 = cljs.core._nth(params,(10));
var G__88938 = cljs.core._nth(params,(11));
var G__88939 = cljs.core._nth(params,(12));
return (function sci$impl$fns$fun_$_arity_13(G__88914,G__88915,G__88916,G__88917,G__88918,G__88919,G__88920,G__88921,G__88922,G__88923,G__88924,G__88925,G__88926){
var invoc_array = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1(invoc_size);
if(cljs.core.truth_(enclosed__GT_invocation)){
(enclosed__GT_invocation.cljs$core$IFn$_invoke$arity$2 ? enclosed__GT_invocation.cljs$core$IFn$_invoke$arity$2(enclosed_array,invoc_array) : enclosed__GT_invocation.call(null,enclosed_array,invoc_array));
} else {
}

(invoc_array[(0)] = G__88914);

(invoc_array[(1)] = G__88915);

(invoc_array[(2)] = G__88916);

(invoc_array[(3)] = G__88917);

(invoc_array[(4)] = G__88918);

(invoc_array[(5)] = G__88919);

(invoc_array[(6)] = G__88920);

(invoc_array[(7)] = G__88921);

(invoc_array[(8)] = G__88922);

(invoc_array[(9)] = G__88923);

(invoc_array[(10)] = G__88924);

(invoc_array[(11)] = G__88925);

(invoc_array[(12)] = G__88926);

while(true){
var ret__87204__auto__ = sci.impl.types.eval(body,ctx,invoc_array);
if(cljs.core.keyword_identical_QMARK_(new cljs.core.Keyword("sci.impl.analyzer","recur","sci.impl.analyzer/recur",2033369355),ret__87204__auto__)){
continue;
} else {
return ret__87204__auto__;
}
break;
}
});

break;
case (14):
var G__88958 = cljs.core._nth(params,(0));
var G__88959 = cljs.core._nth(params,(1));
var G__88960 = cljs.core._nth(params,(2));
var G__88961 = cljs.core._nth(params,(3));
var G__88962 = cljs.core._nth(params,(4));
var G__88963 = cljs.core._nth(params,(5));
var G__88964 = cljs.core._nth(params,(6));
var G__88965 = cljs.core._nth(params,(7));
var G__88966 = cljs.core._nth(params,(8));
var G__88967 = cljs.core._nth(params,(9));
var G__88968 = cljs.core._nth(params,(10));
var G__88969 = cljs.core._nth(params,(11));
var G__88970 = cljs.core._nth(params,(12));
var G__88971 = cljs.core._nth(params,(13));
return (function sci$impl$fns$fun_$_arity_14(G__88944,G__88945,G__88946,G__88947,G__88948,G__88949,G__88950,G__88951,G__88952,G__88953,G__88954,G__88955,G__88956,G__88957){
var invoc_array = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1(invoc_size);
if(cljs.core.truth_(enclosed__GT_invocation)){
(enclosed__GT_invocation.cljs$core$IFn$_invoke$arity$2 ? enclosed__GT_invocation.cljs$core$IFn$_invoke$arity$2(enclosed_array,invoc_array) : enclosed__GT_invocation.call(null,enclosed_array,invoc_array));
} else {
}

(invoc_array[(0)] = G__88944);

(invoc_array[(1)] = G__88945);

(invoc_array[(2)] = G__88946);

(invoc_array[(3)] = G__88947);

(invoc_array[(4)] = G__88948);

(invoc_array[(5)] = G__88949);

(invoc_array[(6)] = G__88950);

(invoc_array[(7)] = G__88951);

(invoc_array[(8)] = G__88952);

(invoc_array[(9)] = G__88953);

(invoc_array[(10)] = G__88954);

(invoc_array[(11)] = G__88955);

(invoc_array[(12)] = G__88956);

(invoc_array[(13)] = G__88957);

while(true){
var ret__87204__auto__ = sci.impl.types.eval(body,ctx,invoc_array);
if(cljs.core.keyword_identical_QMARK_(new cljs.core.Keyword("sci.impl.analyzer","recur","sci.impl.analyzer/recur",2033369355),ret__87204__auto__)){
continue;
} else {
return ret__87204__auto__;
}
break;
}
});

break;
case (15):
var G__88991 = cljs.core._nth(params,(0));
var G__88992 = cljs.core._nth(params,(1));
var G__88993 = cljs.core._nth(params,(2));
var G__88994 = cljs.core._nth(params,(3));
var G__88995 = cljs.core._nth(params,(4));
var G__88996 = cljs.core._nth(params,(5));
var G__88997 = cljs.core._nth(params,(6));
var G__88998 = cljs.core._nth(params,(7));
var G__88999 = cljs.core._nth(params,(8));
var G__89000 = cljs.core._nth(params,(9));
var G__89001 = cljs.core._nth(params,(10));
var G__89002 = cljs.core._nth(params,(11));
var G__89003 = cljs.core._nth(params,(12));
var G__89004 = cljs.core._nth(params,(13));
var G__89005 = cljs.core._nth(params,(14));
return (function sci$impl$fns$fun_$_arity_15(G__88976,G__88977,G__88978,G__88979,G__88980,G__88981,G__88982,G__88983,G__88984,G__88985,G__88986,G__88987,G__88988,G__88989,G__88990){
var invoc_array = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1(invoc_size);
if(cljs.core.truth_(enclosed__GT_invocation)){
(enclosed__GT_invocation.cljs$core$IFn$_invoke$arity$2 ? enclosed__GT_invocation.cljs$core$IFn$_invoke$arity$2(enclosed_array,invoc_array) : enclosed__GT_invocation.call(null,enclosed_array,invoc_array));
} else {
}

(invoc_array[(0)] = G__88976);

(invoc_array[(1)] = G__88977);

(invoc_array[(2)] = G__88978);

(invoc_array[(3)] = G__88979);

(invoc_array[(4)] = G__88980);

(invoc_array[(5)] = G__88981);

(invoc_array[(6)] = G__88982);

(invoc_array[(7)] = G__88983);

(invoc_array[(8)] = G__88984);

(invoc_array[(9)] = G__88985);

(invoc_array[(10)] = G__88986);

(invoc_array[(11)] = G__88987);

(invoc_array[(12)] = G__88988);

(invoc_array[(13)] = G__88989);

(invoc_array[(14)] = G__88990);

while(true){
var ret__87204__auto__ = sci.impl.types.eval(body,ctx,invoc_array);
if(cljs.core.keyword_identical_QMARK_(new cljs.core.Keyword("sci.impl.analyzer","recur","sci.impl.analyzer/recur",2033369355),ret__87204__auto__)){
continue;
} else {
return ret__87204__auto__;
}
break;
}
});

break;
case (16):
var G__89024 = cljs.core._nth(params,(0));
var G__89025 = cljs.core._nth(params,(1));
var G__89026 = cljs.core._nth(params,(2));
var G__89027 = cljs.core._nth(params,(3));
var G__89028 = cljs.core._nth(params,(4));
var G__89029 = cljs.core._nth(params,(5));
var G__89030 = cljs.core._nth(params,(6));
var G__89031 = cljs.core._nth(params,(7));
var G__89032 = cljs.core._nth(params,(8));
var G__89033 = cljs.core._nth(params,(9));
var G__89034 = cljs.core._nth(params,(10));
var G__89035 = cljs.core._nth(params,(11));
var G__89036 = cljs.core._nth(params,(12));
var G__89037 = cljs.core._nth(params,(13));
var G__89038 = cljs.core._nth(params,(14));
var G__89039 = cljs.core._nth(params,(15));
return (function sci$impl$fns$fun_$_arity_16(G__89008,G__89009,G__89010,G__89011,G__89012,G__89013,G__89014,G__89015,G__89016,G__89017,G__89018,G__89019,G__89020,G__89021,G__89022,G__89023){
var invoc_array = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1(invoc_size);
if(cljs.core.truth_(enclosed__GT_invocation)){
(enclosed__GT_invocation.cljs$core$IFn$_invoke$arity$2 ? enclosed__GT_invocation.cljs$core$IFn$_invoke$arity$2(enclosed_array,invoc_array) : enclosed__GT_invocation.call(null,enclosed_array,invoc_array));
} else {
}

(invoc_array[(0)] = G__89008);

(invoc_array[(1)] = G__89009);

(invoc_array[(2)] = G__89010);

(invoc_array[(3)] = G__89011);

(invoc_array[(4)] = G__89012);

(invoc_array[(5)] = G__89013);

(invoc_array[(6)] = G__89014);

(invoc_array[(7)] = G__89015);

(invoc_array[(8)] = G__89016);

(invoc_array[(9)] = G__89017);

(invoc_array[(10)] = G__89018);

(invoc_array[(11)] = G__89019);

(invoc_array[(12)] = G__89020);

(invoc_array[(13)] = G__89021);

(invoc_array[(14)] = G__89022);

(invoc_array[(15)] = G__89023);

while(true){
var ret__87204__auto__ = sci.impl.types.eval(body,ctx,invoc_array);
if(cljs.core.keyword_identical_QMARK_(new cljs.core.Keyword("sci.impl.analyzer","recur","sci.impl.analyzer/recur",2033369355),ret__87204__auto__)){
continue;
} else {
return ret__87204__auto__;
}
break;
}
});

break;
case (17):
var G__89059 = cljs.core._nth(params,(0));
var G__89060 = cljs.core._nth(params,(1));
var G__89061 = cljs.core._nth(params,(2));
var G__89062 = cljs.core._nth(params,(3));
var G__89063 = cljs.core._nth(params,(4));
var G__89064 = cljs.core._nth(params,(5));
var G__89065 = cljs.core._nth(params,(6));
var G__89066 = cljs.core._nth(params,(7));
var G__89067 = cljs.core._nth(params,(8));
var G__89068 = cljs.core._nth(params,(9));
var G__89069 = cljs.core._nth(params,(10));
var G__89070 = cljs.core._nth(params,(11));
var G__89071 = cljs.core._nth(params,(12));
var G__89072 = cljs.core._nth(params,(13));
var G__89073 = cljs.core._nth(params,(14));
var G__89074 = cljs.core._nth(params,(15));
var G__89075 = cljs.core._nth(params,(16));
return (function sci$impl$fns$fun_$_arity_17(G__89042,G__89043,G__89044,G__89045,G__89046,G__89047,G__89048,G__89049,G__89050,G__89051,G__89052,G__89053,G__89054,G__89055,G__89056,G__89057,G__89058){
var invoc_array = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1(invoc_size);
if(cljs.core.truth_(enclosed__GT_invocation)){
(enclosed__GT_invocation.cljs$core$IFn$_invoke$arity$2 ? enclosed__GT_invocation.cljs$core$IFn$_invoke$arity$2(enclosed_array,invoc_array) : enclosed__GT_invocation.call(null,enclosed_array,invoc_array));
} else {
}

(invoc_array[(0)] = G__89042);

(invoc_array[(1)] = G__89043);

(invoc_array[(2)] = G__89044);

(invoc_array[(3)] = G__89045);

(invoc_array[(4)] = G__89046);

(invoc_array[(5)] = G__89047);

(invoc_array[(6)] = G__89048);

(invoc_array[(7)] = G__89049);

(invoc_array[(8)] = G__89050);

(invoc_array[(9)] = G__89051);

(invoc_array[(10)] = G__89052);

(invoc_array[(11)] = G__89053);

(invoc_array[(12)] = G__89054);

(invoc_array[(13)] = G__89055);

(invoc_array[(14)] = G__89056);

(invoc_array[(15)] = G__89057);

(invoc_array[(16)] = G__89058);

while(true){
var ret__87204__auto__ = sci.impl.types.eval(body,ctx,invoc_array);
if(cljs.core.keyword_identical_QMARK_(new cljs.core.Keyword("sci.impl.analyzer","recur","sci.impl.analyzer/recur",2033369355),ret__87204__auto__)){
continue;
} else {
return ret__87204__auto__;
}
break;
}
});

break;
case (18):
var G__89095 = cljs.core._nth(params,(0));
var G__89096 = cljs.core._nth(params,(1));
var G__89097 = cljs.core._nth(params,(2));
var G__89098 = cljs.core._nth(params,(3));
var G__89099 = cljs.core._nth(params,(4));
var G__89100 = cljs.core._nth(params,(5));
var G__89101 = cljs.core._nth(params,(6));
var G__89102 = cljs.core._nth(params,(7));
var G__89103 = cljs.core._nth(params,(8));
var G__89104 = cljs.core._nth(params,(9));
var G__89105 = cljs.core._nth(params,(10));
var G__89106 = cljs.core._nth(params,(11));
var G__89107 = cljs.core._nth(params,(12));
var G__89108 = cljs.core._nth(params,(13));
var G__89109 = cljs.core._nth(params,(14));
var G__89110 = cljs.core._nth(params,(15));
var G__89111 = cljs.core._nth(params,(16));
var G__89112 = cljs.core._nth(params,(17));
return (function sci$impl$fns$fun_$_arity_18(G__89077,G__89078,G__89079,G__89080,G__89081,G__89082,G__89083,G__89084,G__89085,G__89086,G__89087,G__89088,G__89089,G__89090,G__89091,G__89092,G__89093,G__89094){
var invoc_array = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1(invoc_size);
if(cljs.core.truth_(enclosed__GT_invocation)){
(enclosed__GT_invocation.cljs$core$IFn$_invoke$arity$2 ? enclosed__GT_invocation.cljs$core$IFn$_invoke$arity$2(enclosed_array,invoc_array) : enclosed__GT_invocation.call(null,enclosed_array,invoc_array));
} else {
}

(invoc_array[(0)] = G__89077);

(invoc_array[(1)] = G__89078);

(invoc_array[(2)] = G__89079);

(invoc_array[(3)] = G__89080);

(invoc_array[(4)] = G__89081);

(invoc_array[(5)] = G__89082);

(invoc_array[(6)] = G__89083);

(invoc_array[(7)] = G__89084);

(invoc_array[(8)] = G__89085);

(invoc_array[(9)] = G__89086);

(invoc_array[(10)] = G__89087);

(invoc_array[(11)] = G__89088);

(invoc_array[(12)] = G__89089);

(invoc_array[(13)] = G__89090);

(invoc_array[(14)] = G__89091);

(invoc_array[(15)] = G__89092);

(invoc_array[(16)] = G__89093);

(invoc_array[(17)] = G__89094);

while(true){
var ret__87204__auto__ = sci.impl.types.eval(body,ctx,invoc_array);
if(cljs.core.keyword_identical_QMARK_(new cljs.core.Keyword("sci.impl.analyzer","recur","sci.impl.analyzer/recur",2033369355),ret__87204__auto__)){
continue;
} else {
return ret__87204__auto__;
}
break;
}
});

break;
case (19):
var G__89134 = cljs.core._nth(params,(0));
var G__89135 = cljs.core._nth(params,(1));
var G__89136 = cljs.core._nth(params,(2));
var G__89137 = cljs.core._nth(params,(3));
var G__89138 = cljs.core._nth(params,(4));
var G__89139 = cljs.core._nth(params,(5));
var G__89140 = cljs.core._nth(params,(6));
var G__89141 = cljs.core._nth(params,(7));
var G__89142 = cljs.core._nth(params,(8));
var G__89143 = cljs.core._nth(params,(9));
var G__89144 = cljs.core._nth(params,(10));
var G__89145 = cljs.core._nth(params,(11));
var G__89146 = cljs.core._nth(params,(12));
var G__89147 = cljs.core._nth(params,(13));
var G__89148 = cljs.core._nth(params,(14));
var G__89149 = cljs.core._nth(params,(15));
var G__89150 = cljs.core._nth(params,(16));
var G__89151 = cljs.core._nth(params,(17));
var G__89152 = cljs.core._nth(params,(18));
return (function sci$impl$fns$fun_$_arity_19(G__89115,G__89116,G__89117,G__89118,G__89119,G__89120,G__89121,G__89122,G__89123,G__89124,G__89125,G__89126,G__89127,G__89128,G__89129,G__89130,G__89131,G__89132,G__89133){
var invoc_array = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1(invoc_size);
if(cljs.core.truth_(enclosed__GT_invocation)){
(enclosed__GT_invocation.cljs$core$IFn$_invoke$arity$2 ? enclosed__GT_invocation.cljs$core$IFn$_invoke$arity$2(enclosed_array,invoc_array) : enclosed__GT_invocation.call(null,enclosed_array,invoc_array));
} else {
}

(invoc_array[(0)] = G__89115);

(invoc_array[(1)] = G__89116);

(invoc_array[(2)] = G__89117);

(invoc_array[(3)] = G__89118);

(invoc_array[(4)] = G__89119);

(invoc_array[(5)] = G__89120);

(invoc_array[(6)] = G__89121);

(invoc_array[(7)] = G__89122);

(invoc_array[(8)] = G__89123);

(invoc_array[(9)] = G__89124);

(invoc_array[(10)] = G__89125);

(invoc_array[(11)] = G__89126);

(invoc_array[(12)] = G__89127);

(invoc_array[(13)] = G__89128);

(invoc_array[(14)] = G__89129);

(invoc_array[(15)] = G__89130);

(invoc_array[(16)] = G__89131);

(invoc_array[(17)] = G__89132);

(invoc_array[(18)] = G__89133);

while(true){
var ret__87204__auto__ = sci.impl.types.eval(body,ctx,invoc_array);
if(cljs.core.keyword_identical_QMARK_(new cljs.core.Keyword("sci.impl.analyzer","recur","sci.impl.analyzer/recur",2033369355),ret__87204__auto__)){
continue;
} else {
return ret__87204__auto__;
}
break;
}
});

break;
case (20):
var G__89179 = cljs.core._nth(params,(0));
var G__89180 = cljs.core._nth(params,(1));
var G__89181 = cljs.core._nth(params,(2));
var G__89182 = cljs.core._nth(params,(3));
var G__89183 = cljs.core._nth(params,(4));
var G__89184 = cljs.core._nth(params,(5));
var G__89185 = cljs.core._nth(params,(6));
var G__89186 = cljs.core._nth(params,(7));
var G__89187 = cljs.core._nth(params,(8));
var G__89188 = cljs.core._nth(params,(9));
var G__89189 = cljs.core._nth(params,(10));
var G__89190 = cljs.core._nth(params,(11));
var G__89191 = cljs.core._nth(params,(12));
var G__89192 = cljs.core._nth(params,(13));
var G__89193 = cljs.core._nth(params,(14));
var G__89194 = cljs.core._nth(params,(15));
var G__89195 = cljs.core._nth(params,(16));
var G__89196 = cljs.core._nth(params,(17));
var G__89197 = cljs.core._nth(params,(18));
var G__89198 = cljs.core._nth(params,(19));
return (function sci$impl$fns$fun_$_arity_20(G__89159,G__89160,G__89161,G__89162,G__89163,G__89164,G__89165,G__89166,G__89167,G__89168,G__89169,G__89170,G__89171,G__89172,G__89173,G__89174,G__89175,G__89176,G__89177,G__89178){
var invoc_array = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1(invoc_size);
if(cljs.core.truth_(enclosed__GT_invocation)){
(enclosed__GT_invocation.cljs$core$IFn$_invoke$arity$2 ? enclosed__GT_invocation.cljs$core$IFn$_invoke$arity$2(enclosed_array,invoc_array) : enclosed__GT_invocation.call(null,enclosed_array,invoc_array));
} else {
}

(invoc_array[(0)] = G__89159);

(invoc_array[(1)] = G__89160);

(invoc_array[(2)] = G__89161);

(invoc_array[(3)] = G__89162);

(invoc_array[(4)] = G__89163);

(invoc_array[(5)] = G__89164);

(invoc_array[(6)] = G__89165);

(invoc_array[(7)] = G__89166);

(invoc_array[(8)] = G__89167);

(invoc_array[(9)] = G__89168);

(invoc_array[(10)] = G__89169);

(invoc_array[(11)] = G__89170);

(invoc_array[(12)] = G__89171);

(invoc_array[(13)] = G__89172);

(invoc_array[(14)] = G__89173);

(invoc_array[(15)] = G__89174);

(invoc_array[(16)] = G__89175);

(invoc_array[(17)] = G__89176);

(invoc_array[(18)] = G__89177);

(invoc_array[(19)] = G__89178);

while(true){
var ret__87204__auto__ = sci.impl.types.eval(body,ctx,invoc_array);
if(cljs.core.keyword_identical_QMARK_(new cljs.core.Keyword("sci.impl.analyzer","recur","sci.impl.analyzer/recur",2033369355),ret__87204__auto__)){
continue;
} else {
return ret__87204__auto__;
}
break;
}
});

break;
default:
throw (new Error(["No matching clause: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(G__88734)].join('')));

}
})());
return f;
});
sci.impl.fns.lookup_by_arity = (function sci$impl$fns$lookup_by_arity(arities,arity){
var or__5002__auto__ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(arities,arity);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword(null,"variadic","variadic",882626057).cljs$core$IFn$_invoke$arity$1(arities);
}
});
sci.impl.fns.fn_arity_map = (function sci$impl$fns$fn_arity_map(ctx,enclosed_array,bindings,fn_name,macro_QMARK_,fn_bodies){
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (arity_map,fn_body){
var f = sci.impl.fns.fun(ctx,enclosed_array,bindings,fn_body,fn_name,macro_QMARK_);
var var_arg_QMARK_ = new cljs.core.Keyword(null,"var-arg-name","var-arg-name",-1100024887).cljs$core$IFn$_invoke$arity$1(fn_body);
var fixed_arity = new cljs.core.Keyword(null,"fixed-arity","fixed-arity",1586445869).cljs$core$IFn$_invoke$arity$1(fn_body);
if(cljs.core.truth_(var_arg_QMARK_)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(arity_map,new cljs.core.Keyword(null,"variadic","variadic",882626057),f);
} else {
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(arity_map,fixed_arity,f);
}
}),cljs.core.PersistentArrayMap.EMPTY,fn_bodies);
});
sci.impl.fns.eval_fn = (function sci$impl$fns$eval_fn(ctx,bindings,fn_name,fn_bodies,macro_QMARK_,single_arity,self_ref_QMARK_,bindings_fn){
var enclosed_array = (bindings_fn.cljs$core$IFn$_invoke$arity$1 ? bindings_fn.cljs$core$IFn$_invoke$arity$1(bindings) : bindings_fn.call(null,bindings));
var f = (cljs.core.truth_(single_arity)?sci.impl.fns.fun(ctx,enclosed_array,bindings,single_arity,fn_name,macro_QMARK_):(function (){var arities = sci.impl.fns.fn_arity_map(ctx,enclosed_array,bindings,fn_name,macro_QMARK_,fn_bodies);
return (function() { 
var G__89369__delegate = function (args){
var arg_count = cljs.core.count(args);
var temp__5802__auto__ = sci.impl.fns.lookup_by_arity(arities,arg_count);
if(cljs.core.truth_(temp__5802__auto__)){
var f = temp__5802__auto__;
return cljs.core.apply.cljs$core$IFn$_invoke$arity$2(f,args);
} else {
throw (new Error((function (){var actual_count = (cljs.core.truth_(macro_QMARK_)?(arg_count - (2)):arg_count);
return ["Cannot call ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(fn_name)," with ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(actual_count)," arguments"].join('');
})()));
}
};
var G__89369 = function (var_args){
var args = null;
if (arguments.length > 0) {
var G__89370__i = 0, G__89370__a = new Array(arguments.length -  0);
while (G__89370__i < G__89370__a.length) {G__89370__a[G__89370__i] = arguments[G__89370__i + 0]; ++G__89370__i;}
  args = new cljs.core.IndexedSeq(G__89370__a,0,null);
} 
return G__89369__delegate.call(this,args);};
G__89369.cljs$lang$maxFixedArity = 0;
G__89369.cljs$lang$applyTo = (function (arglist__89371){
var args = cljs.core.seq(arglist__89371);
return G__89369__delegate(args);
});
G__89369.cljs$core$IFn$_invoke$arity$variadic = G__89369__delegate;
return G__89369;
})()
;
})());
var f__$1 = (cljs.core.truth_(macro_QMARK_)?cljs.core.vary_meta.cljs$core$IFn$_invoke$arity$2(f,(function (p1__89209_SHARP_){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(p1__89209_SHARP_,new cljs.core.Keyword("sci","macro","sci/macro",-868536151),macro_QMARK_,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("sci.impl","inner-fn","sci.impl/inner-fn",1663302998),f], 0));
})):f);
if(cljs.core.truth_(self_ref_QMARK_)){
(enclosed_array[(cljs.core.count(enclosed_array) - (1))] = f__$1);
} else {
}

return f__$1;
});
cljs.core.vreset_BANG_(sci.impl.utils.eval_fn,sci.impl.fns.eval_fn);

//# sourceMappingURL=sci.impl.fns.js.map
