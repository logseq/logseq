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
var f = (cljs.core.truth_(vararg_idx)?(function (){var G__87761 = (fixed_arity | (0));
switch (G__87761) {
case (0):
return (function() { 
var sci$impl$fns$fun_$_arity_0__delegate = function (G__87764){
var invoc_array = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1(invoc_size);
if(cljs.core.truth_(enclosed__GT_invocation)){
(enclosed__GT_invocation.cljs$core$IFn$_invoke$arity$2 ? enclosed__GT_invocation.cljs$core$IFn$_invoke$arity$2(enclosed_array,invoc_array) : enclosed__GT_invocation.call(null,enclosed_array,invoc_array));
} else {
}

(invoc_array[vararg_idx] = G__87764);

while(true){
var ret__86494__auto__ = sci.impl.types.eval(body,ctx,invoc_array);
if(cljs.core.keyword_identical_QMARK_(new cljs.core.Keyword("sci.impl.analyzer","recur","sci.impl.analyzer/recur",2033369355),ret__86494__auto__)){
continue;
} else {
return ret__86494__auto__;
}
break;
}
};
var sci$impl$fns$fun_$_arity_0 = function (var_args){
var G__87764 = null;
if (arguments.length > 0) {
var G__88808__i = 0, G__88808__a = new Array(arguments.length -  0);
while (G__88808__i < G__88808__a.length) {G__88808__a[G__88808__i] = arguments[G__88808__i + 0]; ++G__88808__i;}
  G__87764 = new cljs.core.IndexedSeq(G__88808__a,0,null);
} 
return sci$impl$fns$fun_$_arity_0__delegate.call(this,G__87764);};
sci$impl$fns$fun_$_arity_0.cljs$lang$maxFixedArity = 0;
sci$impl$fns$fun_$_arity_0.cljs$lang$applyTo = (function (arglist__88809){
var G__87764 = cljs.core.seq(arglist__88809);
return sci$impl$fns$fun_$_arity_0__delegate(G__87764);
});
sci$impl$fns$fun_$_arity_0.cljs$core$IFn$_invoke$arity$variadic = sci$impl$fns$fun_$_arity_0__delegate;
return sci$impl$fns$fun_$_arity_0;
})()
;

break;
case (1):
var G__87768 = cljs.core._nth(params,(0));
return (function() { 
var sci$impl$fns$fun_$_arity_1__delegate = function (G__87766,G__87767){
var invoc_array = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1(invoc_size);
if(cljs.core.truth_(enclosed__GT_invocation)){
(enclosed__GT_invocation.cljs$core$IFn$_invoke$arity$2 ? enclosed__GT_invocation.cljs$core$IFn$_invoke$arity$2(enclosed_array,invoc_array) : enclosed__GT_invocation.call(null,enclosed_array,invoc_array));
} else {
}

(invoc_array[(0)] = G__87766);

(invoc_array[vararg_idx] = G__87767);

while(true){
var ret__86496__auto__ = sci.impl.types.eval(body,ctx,invoc_array);
if(cljs.core.keyword_identical_QMARK_(new cljs.core.Keyword("sci.impl.analyzer","recur","sci.impl.analyzer/recur",2033369355),ret__86496__auto__)){
continue;
} else {
return ret__86496__auto__;
}
break;
}
};
var sci$impl$fns$fun_$_arity_1 = function (G__87766,var_args){
var G__87767 = null;
if (arguments.length > 1) {
var G__88811__i = 0, G__88811__a = new Array(arguments.length -  1);
while (G__88811__i < G__88811__a.length) {G__88811__a[G__88811__i] = arguments[G__88811__i + 1]; ++G__88811__i;}
  G__87767 = new cljs.core.IndexedSeq(G__88811__a,0,null);
} 
return sci$impl$fns$fun_$_arity_1__delegate.call(this,G__87766,G__87767);};
sci$impl$fns$fun_$_arity_1.cljs$lang$maxFixedArity = 1;
sci$impl$fns$fun_$_arity_1.cljs$lang$applyTo = (function (arglist__88812){
var G__87766 = cljs.core.first(arglist__88812);
var G__87767 = cljs.core.rest(arglist__88812);
return sci$impl$fns$fun_$_arity_1__delegate(G__87766,G__87767);
});
sci$impl$fns$fun_$_arity_1.cljs$core$IFn$_invoke$arity$variadic = sci$impl$fns$fun_$_arity_1__delegate;
return sci$impl$fns$fun_$_arity_1;
})()
;

break;
case (2):
var G__87772 = cljs.core._nth(params,(0));
var G__87773 = cljs.core._nth(params,(1));
return (function() { 
var sci$impl$fns$fun_$_arity_2__delegate = function (G__87769,G__87770,G__87771){
var invoc_array = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1(invoc_size);
if(cljs.core.truth_(enclosed__GT_invocation)){
(enclosed__GT_invocation.cljs$core$IFn$_invoke$arity$2 ? enclosed__GT_invocation.cljs$core$IFn$_invoke$arity$2(enclosed_array,invoc_array) : enclosed__GT_invocation.call(null,enclosed_array,invoc_array));
} else {
}

(invoc_array[(0)] = G__87769);

(invoc_array[(1)] = G__87770);

(invoc_array[vararg_idx] = G__87771);

while(true){
var ret__86496__auto__ = sci.impl.types.eval(body,ctx,invoc_array);
if(cljs.core.keyword_identical_QMARK_(new cljs.core.Keyword("sci.impl.analyzer","recur","sci.impl.analyzer/recur",2033369355),ret__86496__auto__)){
continue;
} else {
return ret__86496__auto__;
}
break;
}
};
var sci$impl$fns$fun_$_arity_2 = function (G__87769,G__87770,var_args){
var G__87771 = null;
if (arguments.length > 2) {
var G__88813__i = 0, G__88813__a = new Array(arguments.length -  2);
while (G__88813__i < G__88813__a.length) {G__88813__a[G__88813__i] = arguments[G__88813__i + 2]; ++G__88813__i;}
  G__87771 = new cljs.core.IndexedSeq(G__88813__a,0,null);
} 
return sci$impl$fns$fun_$_arity_2__delegate.call(this,G__87769,G__87770,G__87771);};
sci$impl$fns$fun_$_arity_2.cljs$lang$maxFixedArity = 2;
sci$impl$fns$fun_$_arity_2.cljs$lang$applyTo = (function (arglist__88815){
var G__87769 = cljs.core.first(arglist__88815);
arglist__88815 = cljs.core.next(arglist__88815);
var G__87770 = cljs.core.first(arglist__88815);
var G__87771 = cljs.core.rest(arglist__88815);
return sci$impl$fns$fun_$_arity_2__delegate(G__87769,G__87770,G__87771);
});
sci$impl$fns$fun_$_arity_2.cljs$core$IFn$_invoke$arity$variadic = sci$impl$fns$fun_$_arity_2__delegate;
return sci$impl$fns$fun_$_arity_2;
})()
;

break;
case (3):
var G__87782 = cljs.core._nth(params,(0));
var G__87783 = cljs.core._nth(params,(1));
var G__87784 = cljs.core._nth(params,(2));
return (function() { 
var sci$impl$fns$fun_$_arity_3__delegate = function (G__87778,G__87779,G__87780,G__87781){
var invoc_array = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1(invoc_size);
if(cljs.core.truth_(enclosed__GT_invocation)){
(enclosed__GT_invocation.cljs$core$IFn$_invoke$arity$2 ? enclosed__GT_invocation.cljs$core$IFn$_invoke$arity$2(enclosed_array,invoc_array) : enclosed__GT_invocation.call(null,enclosed_array,invoc_array));
} else {
}

(invoc_array[(0)] = G__87778);

(invoc_array[(1)] = G__87779);

(invoc_array[(2)] = G__87780);

(invoc_array[vararg_idx] = G__87781);

while(true){
var ret__86496__auto__ = sci.impl.types.eval(body,ctx,invoc_array);
if(cljs.core.keyword_identical_QMARK_(new cljs.core.Keyword("sci.impl.analyzer","recur","sci.impl.analyzer/recur",2033369355),ret__86496__auto__)){
continue;
} else {
return ret__86496__auto__;
}
break;
}
};
var sci$impl$fns$fun_$_arity_3 = function (G__87778,G__87779,G__87780,var_args){
var G__87781 = null;
if (arguments.length > 3) {
var G__88817__i = 0, G__88817__a = new Array(arguments.length -  3);
while (G__88817__i < G__88817__a.length) {G__88817__a[G__88817__i] = arguments[G__88817__i + 3]; ++G__88817__i;}
  G__87781 = new cljs.core.IndexedSeq(G__88817__a,0,null);
} 
return sci$impl$fns$fun_$_arity_3__delegate.call(this,G__87778,G__87779,G__87780,G__87781);};
sci$impl$fns$fun_$_arity_3.cljs$lang$maxFixedArity = 3;
sci$impl$fns$fun_$_arity_3.cljs$lang$applyTo = (function (arglist__88818){
var G__87778 = cljs.core.first(arglist__88818);
arglist__88818 = cljs.core.next(arglist__88818);
var G__87779 = cljs.core.first(arglist__88818);
arglist__88818 = cljs.core.next(arglist__88818);
var G__87780 = cljs.core.first(arglist__88818);
var G__87781 = cljs.core.rest(arglist__88818);
return sci$impl$fns$fun_$_arity_3__delegate(G__87778,G__87779,G__87780,G__87781);
});
sci$impl$fns$fun_$_arity_3.cljs$core$IFn$_invoke$arity$variadic = sci$impl$fns$fun_$_arity_3__delegate;
return sci$impl$fns$fun_$_arity_3;
})()
;

break;
case (4):
var G__87790 = cljs.core._nth(params,(0));
var G__87791 = cljs.core._nth(params,(1));
var G__87792 = cljs.core._nth(params,(2));
var G__87793 = cljs.core._nth(params,(3));
return (function() { 
var sci$impl$fns$fun_$_arity_4__delegate = function (G__87785,G__87786,G__87787,G__87788,G__87789){
var invoc_array = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1(invoc_size);
if(cljs.core.truth_(enclosed__GT_invocation)){
(enclosed__GT_invocation.cljs$core$IFn$_invoke$arity$2 ? enclosed__GT_invocation.cljs$core$IFn$_invoke$arity$2(enclosed_array,invoc_array) : enclosed__GT_invocation.call(null,enclosed_array,invoc_array));
} else {
}

(invoc_array[(0)] = G__87785);

(invoc_array[(1)] = G__87786);

(invoc_array[(2)] = G__87787);

(invoc_array[(3)] = G__87788);

(invoc_array[vararg_idx] = G__87789);

while(true){
var ret__86496__auto__ = sci.impl.types.eval(body,ctx,invoc_array);
if(cljs.core.keyword_identical_QMARK_(new cljs.core.Keyword("sci.impl.analyzer","recur","sci.impl.analyzer/recur",2033369355),ret__86496__auto__)){
continue;
} else {
return ret__86496__auto__;
}
break;
}
};
var sci$impl$fns$fun_$_arity_4 = function (G__87785,G__87786,G__87787,G__87788,var_args){
var G__87789 = null;
if (arguments.length > 4) {
var G__88820__i = 0, G__88820__a = new Array(arguments.length -  4);
while (G__88820__i < G__88820__a.length) {G__88820__a[G__88820__i] = arguments[G__88820__i + 4]; ++G__88820__i;}
  G__87789 = new cljs.core.IndexedSeq(G__88820__a,0,null);
} 
return sci$impl$fns$fun_$_arity_4__delegate.call(this,G__87785,G__87786,G__87787,G__87788,G__87789);};
sci$impl$fns$fun_$_arity_4.cljs$lang$maxFixedArity = 4;
sci$impl$fns$fun_$_arity_4.cljs$lang$applyTo = (function (arglist__88821){
var G__87785 = cljs.core.first(arglist__88821);
arglist__88821 = cljs.core.next(arglist__88821);
var G__87786 = cljs.core.first(arglist__88821);
arglist__88821 = cljs.core.next(arglist__88821);
var G__87787 = cljs.core.first(arglist__88821);
arglist__88821 = cljs.core.next(arglist__88821);
var G__87788 = cljs.core.first(arglist__88821);
var G__87789 = cljs.core.rest(arglist__88821);
return sci$impl$fns$fun_$_arity_4__delegate(G__87785,G__87786,G__87787,G__87788,G__87789);
});
sci$impl$fns$fun_$_arity_4.cljs$core$IFn$_invoke$arity$variadic = sci$impl$fns$fun_$_arity_4__delegate;
return sci$impl$fns$fun_$_arity_4;
})()
;

break;
case (5):
var G__87803 = cljs.core._nth(params,(0));
var G__87804 = cljs.core._nth(params,(1));
var G__87805 = cljs.core._nth(params,(2));
var G__87806 = cljs.core._nth(params,(3));
var G__87807 = cljs.core._nth(params,(4));
return (function() { 
var sci$impl$fns$fun_$_arity_5__delegate = function (G__87797,G__87798,G__87799,G__87800,G__87801,G__87802){
var invoc_array = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1(invoc_size);
if(cljs.core.truth_(enclosed__GT_invocation)){
(enclosed__GT_invocation.cljs$core$IFn$_invoke$arity$2 ? enclosed__GT_invocation.cljs$core$IFn$_invoke$arity$2(enclosed_array,invoc_array) : enclosed__GT_invocation.call(null,enclosed_array,invoc_array));
} else {
}

(invoc_array[(0)] = G__87797);

(invoc_array[(1)] = G__87798);

(invoc_array[(2)] = G__87799);

(invoc_array[(3)] = G__87800);

(invoc_array[(4)] = G__87801);

(invoc_array[vararg_idx] = G__87802);

while(true){
var ret__86496__auto__ = sci.impl.types.eval(body,ctx,invoc_array);
if(cljs.core.keyword_identical_QMARK_(new cljs.core.Keyword("sci.impl.analyzer","recur","sci.impl.analyzer/recur",2033369355),ret__86496__auto__)){
continue;
} else {
return ret__86496__auto__;
}
break;
}
};
var sci$impl$fns$fun_$_arity_5 = function (G__87797,G__87798,G__87799,G__87800,G__87801,var_args){
var G__87802 = null;
if (arguments.length > 5) {
var G__88823__i = 0, G__88823__a = new Array(arguments.length -  5);
while (G__88823__i < G__88823__a.length) {G__88823__a[G__88823__i] = arguments[G__88823__i + 5]; ++G__88823__i;}
  G__87802 = new cljs.core.IndexedSeq(G__88823__a,0,null);
} 
return sci$impl$fns$fun_$_arity_5__delegate.call(this,G__87797,G__87798,G__87799,G__87800,G__87801,G__87802);};
sci$impl$fns$fun_$_arity_5.cljs$lang$maxFixedArity = 5;
sci$impl$fns$fun_$_arity_5.cljs$lang$applyTo = (function (arglist__88824){
var G__87797 = cljs.core.first(arglist__88824);
arglist__88824 = cljs.core.next(arglist__88824);
var G__87798 = cljs.core.first(arglist__88824);
arglist__88824 = cljs.core.next(arglist__88824);
var G__87799 = cljs.core.first(arglist__88824);
arglist__88824 = cljs.core.next(arglist__88824);
var G__87800 = cljs.core.first(arglist__88824);
arglist__88824 = cljs.core.next(arglist__88824);
var G__87801 = cljs.core.first(arglist__88824);
var G__87802 = cljs.core.rest(arglist__88824);
return sci$impl$fns$fun_$_arity_5__delegate(G__87797,G__87798,G__87799,G__87800,G__87801,G__87802);
});
sci$impl$fns$fun_$_arity_5.cljs$core$IFn$_invoke$arity$variadic = sci$impl$fns$fun_$_arity_5__delegate;
return sci$impl$fns$fun_$_arity_5;
})()
;

break;
case (6):
var G__87817 = cljs.core._nth(params,(0));
var G__87818 = cljs.core._nth(params,(1));
var G__87819 = cljs.core._nth(params,(2));
var G__87820 = cljs.core._nth(params,(3));
var G__87821 = cljs.core._nth(params,(4));
var G__87822 = cljs.core._nth(params,(5));
return (function() { 
var sci$impl$fns$fun_$_arity_6__delegate = function (G__87810,G__87811,G__87812,G__87813,G__87814,G__87815,G__87816){
var invoc_array = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1(invoc_size);
if(cljs.core.truth_(enclosed__GT_invocation)){
(enclosed__GT_invocation.cljs$core$IFn$_invoke$arity$2 ? enclosed__GT_invocation.cljs$core$IFn$_invoke$arity$2(enclosed_array,invoc_array) : enclosed__GT_invocation.call(null,enclosed_array,invoc_array));
} else {
}

(invoc_array[(0)] = G__87810);

(invoc_array[(1)] = G__87811);

(invoc_array[(2)] = G__87812);

(invoc_array[(3)] = G__87813);

(invoc_array[(4)] = G__87814);

(invoc_array[(5)] = G__87815);

(invoc_array[vararg_idx] = G__87816);

while(true){
var ret__86496__auto__ = sci.impl.types.eval(body,ctx,invoc_array);
if(cljs.core.keyword_identical_QMARK_(new cljs.core.Keyword("sci.impl.analyzer","recur","sci.impl.analyzer/recur",2033369355),ret__86496__auto__)){
continue;
} else {
return ret__86496__auto__;
}
break;
}
};
var sci$impl$fns$fun_$_arity_6 = function (G__87810,G__87811,G__87812,G__87813,G__87814,G__87815,var_args){
var G__87816 = null;
if (arguments.length > 6) {
var G__88826__i = 0, G__88826__a = new Array(arguments.length -  6);
while (G__88826__i < G__88826__a.length) {G__88826__a[G__88826__i] = arguments[G__88826__i + 6]; ++G__88826__i;}
  G__87816 = new cljs.core.IndexedSeq(G__88826__a,0,null);
} 
return sci$impl$fns$fun_$_arity_6__delegate.call(this,G__87810,G__87811,G__87812,G__87813,G__87814,G__87815,G__87816);};
sci$impl$fns$fun_$_arity_6.cljs$lang$maxFixedArity = 6;
sci$impl$fns$fun_$_arity_6.cljs$lang$applyTo = (function (arglist__88827){
var G__87810 = cljs.core.first(arglist__88827);
arglist__88827 = cljs.core.next(arglist__88827);
var G__87811 = cljs.core.first(arglist__88827);
arglist__88827 = cljs.core.next(arglist__88827);
var G__87812 = cljs.core.first(arglist__88827);
arglist__88827 = cljs.core.next(arglist__88827);
var G__87813 = cljs.core.first(arglist__88827);
arglist__88827 = cljs.core.next(arglist__88827);
var G__87814 = cljs.core.first(arglist__88827);
arglist__88827 = cljs.core.next(arglist__88827);
var G__87815 = cljs.core.first(arglist__88827);
var G__87816 = cljs.core.rest(arglist__88827);
return sci$impl$fns$fun_$_arity_6__delegate(G__87810,G__87811,G__87812,G__87813,G__87814,G__87815,G__87816);
});
sci$impl$fns$fun_$_arity_6.cljs$core$IFn$_invoke$arity$variadic = sci$impl$fns$fun_$_arity_6__delegate;
return sci$impl$fns$fun_$_arity_6;
})()
;

break;
case (7):
var G__87845 = cljs.core._nth(params,(0));
var G__87846 = cljs.core._nth(params,(1));
var G__87847 = cljs.core._nth(params,(2));
var G__87848 = cljs.core._nth(params,(3));
var G__87849 = cljs.core._nth(params,(4));
var G__87850 = cljs.core._nth(params,(5));
var G__87851 = cljs.core._nth(params,(6));
return (function() { 
var sci$impl$fns$fun_$_arity_7__delegate = function (G__87837,G__87838,G__87839,G__87840,G__87841,G__87842,G__87843,G__87844){
var invoc_array = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1(invoc_size);
if(cljs.core.truth_(enclosed__GT_invocation)){
(enclosed__GT_invocation.cljs$core$IFn$_invoke$arity$2 ? enclosed__GT_invocation.cljs$core$IFn$_invoke$arity$2(enclosed_array,invoc_array) : enclosed__GT_invocation.call(null,enclosed_array,invoc_array));
} else {
}

(invoc_array[(0)] = G__87837);

(invoc_array[(1)] = G__87838);

(invoc_array[(2)] = G__87839);

(invoc_array[(3)] = G__87840);

(invoc_array[(4)] = G__87841);

(invoc_array[(5)] = G__87842);

(invoc_array[(6)] = G__87843);

(invoc_array[vararg_idx] = G__87844);

while(true){
var ret__86496__auto__ = sci.impl.types.eval(body,ctx,invoc_array);
if(cljs.core.keyword_identical_QMARK_(new cljs.core.Keyword("sci.impl.analyzer","recur","sci.impl.analyzer/recur",2033369355),ret__86496__auto__)){
continue;
} else {
return ret__86496__auto__;
}
break;
}
};
var sci$impl$fns$fun_$_arity_7 = function (G__87837,G__87838,G__87839,G__87840,G__87841,G__87842,G__87843,var_args){
var G__87844 = null;
if (arguments.length > 7) {
var G__88829__i = 0, G__88829__a = new Array(arguments.length -  7);
while (G__88829__i < G__88829__a.length) {G__88829__a[G__88829__i] = arguments[G__88829__i + 7]; ++G__88829__i;}
  G__87844 = new cljs.core.IndexedSeq(G__88829__a,0,null);
} 
return sci$impl$fns$fun_$_arity_7__delegate.call(this,G__87837,G__87838,G__87839,G__87840,G__87841,G__87842,G__87843,G__87844);};
sci$impl$fns$fun_$_arity_7.cljs$lang$maxFixedArity = 7;
sci$impl$fns$fun_$_arity_7.cljs$lang$applyTo = (function (arglist__88830){
var G__87837 = cljs.core.first(arglist__88830);
arglist__88830 = cljs.core.next(arglist__88830);
var G__87838 = cljs.core.first(arglist__88830);
arglist__88830 = cljs.core.next(arglist__88830);
var G__87839 = cljs.core.first(arglist__88830);
arglist__88830 = cljs.core.next(arglist__88830);
var G__87840 = cljs.core.first(arglist__88830);
arglist__88830 = cljs.core.next(arglist__88830);
var G__87841 = cljs.core.first(arglist__88830);
arglist__88830 = cljs.core.next(arglist__88830);
var G__87842 = cljs.core.first(arglist__88830);
arglist__88830 = cljs.core.next(arglist__88830);
var G__87843 = cljs.core.first(arglist__88830);
var G__87844 = cljs.core.rest(arglist__88830);
return sci$impl$fns$fun_$_arity_7__delegate(G__87837,G__87838,G__87839,G__87840,G__87841,G__87842,G__87843,G__87844);
});
sci$impl$fns$fun_$_arity_7.cljs$core$IFn$_invoke$arity$variadic = sci$impl$fns$fun_$_arity_7__delegate;
return sci$impl$fns$fun_$_arity_7;
})()
;

break;
case (8):
var G__87869 = cljs.core._nth(params,(0));
var G__87870 = cljs.core._nth(params,(1));
var G__87871 = cljs.core._nth(params,(2));
var G__87872 = cljs.core._nth(params,(3));
var G__87873 = cljs.core._nth(params,(4));
var G__87874 = cljs.core._nth(params,(5));
var G__87875 = cljs.core._nth(params,(6));
var G__87876 = cljs.core._nth(params,(7));
return (function() { 
var sci$impl$fns$fun_$_arity_8__delegate = function (G__87859,G__87861,G__87862,G__87863,G__87864,G__87865,G__87866,G__87867,G__87868){
var invoc_array = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1(invoc_size);
if(cljs.core.truth_(enclosed__GT_invocation)){
(enclosed__GT_invocation.cljs$core$IFn$_invoke$arity$2 ? enclosed__GT_invocation.cljs$core$IFn$_invoke$arity$2(enclosed_array,invoc_array) : enclosed__GT_invocation.call(null,enclosed_array,invoc_array));
} else {
}

(invoc_array[(0)] = G__87859);

(invoc_array[(1)] = G__87861);

(invoc_array[(2)] = G__87862);

(invoc_array[(3)] = G__87863);

(invoc_array[(4)] = G__87864);

(invoc_array[(5)] = G__87865);

(invoc_array[(6)] = G__87866);

(invoc_array[(7)] = G__87867);

(invoc_array[vararg_idx] = G__87868);

while(true){
var ret__86496__auto__ = sci.impl.types.eval(body,ctx,invoc_array);
if(cljs.core.keyword_identical_QMARK_(new cljs.core.Keyword("sci.impl.analyzer","recur","sci.impl.analyzer/recur",2033369355),ret__86496__auto__)){
continue;
} else {
return ret__86496__auto__;
}
break;
}
};
var sci$impl$fns$fun_$_arity_8 = function (G__87859,G__87861,G__87862,G__87863,G__87864,G__87865,G__87866,G__87867,var_args){
var G__87868 = null;
if (arguments.length > 8) {
var G__88839__i = 0, G__88839__a = new Array(arguments.length -  8);
while (G__88839__i < G__88839__a.length) {G__88839__a[G__88839__i] = arguments[G__88839__i + 8]; ++G__88839__i;}
  G__87868 = new cljs.core.IndexedSeq(G__88839__a,0,null);
} 
return sci$impl$fns$fun_$_arity_8__delegate.call(this,G__87859,G__87861,G__87862,G__87863,G__87864,G__87865,G__87866,G__87867,G__87868);};
sci$impl$fns$fun_$_arity_8.cljs$lang$maxFixedArity = 8;
sci$impl$fns$fun_$_arity_8.cljs$lang$applyTo = (function (arglist__88840){
var G__87859 = cljs.core.first(arglist__88840);
arglist__88840 = cljs.core.next(arglist__88840);
var G__87861 = cljs.core.first(arglist__88840);
arglist__88840 = cljs.core.next(arglist__88840);
var G__87862 = cljs.core.first(arglist__88840);
arglist__88840 = cljs.core.next(arglist__88840);
var G__87863 = cljs.core.first(arglist__88840);
arglist__88840 = cljs.core.next(arglist__88840);
var G__87864 = cljs.core.first(arglist__88840);
arglist__88840 = cljs.core.next(arglist__88840);
var G__87865 = cljs.core.first(arglist__88840);
arglist__88840 = cljs.core.next(arglist__88840);
var G__87866 = cljs.core.first(arglist__88840);
arglist__88840 = cljs.core.next(arglist__88840);
var G__87867 = cljs.core.first(arglist__88840);
var G__87868 = cljs.core.rest(arglist__88840);
return sci$impl$fns$fun_$_arity_8__delegate(G__87859,G__87861,G__87862,G__87863,G__87864,G__87865,G__87866,G__87867,G__87868);
});
sci$impl$fns$fun_$_arity_8.cljs$core$IFn$_invoke$arity$variadic = sci$impl$fns$fun_$_arity_8__delegate;
return sci$impl$fns$fun_$_arity_8;
})()
;

break;
case (9):
var G__87897 = cljs.core._nth(params,(0));
var G__87898 = cljs.core._nth(params,(1));
var G__87899 = cljs.core._nth(params,(2));
var G__87900 = cljs.core._nth(params,(3));
var G__87901 = cljs.core._nth(params,(4));
var G__87902 = cljs.core._nth(params,(5));
var G__87903 = cljs.core._nth(params,(6));
var G__87904 = cljs.core._nth(params,(7));
var G__87905 = cljs.core._nth(params,(8));
return (function() { 
var sci$impl$fns$fun_$_arity_9__delegate = function (G__87887,G__87888,G__87889,G__87890,G__87891,G__87892,G__87893,G__87894,G__87895,G__87896){
var invoc_array = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1(invoc_size);
if(cljs.core.truth_(enclosed__GT_invocation)){
(enclosed__GT_invocation.cljs$core$IFn$_invoke$arity$2 ? enclosed__GT_invocation.cljs$core$IFn$_invoke$arity$2(enclosed_array,invoc_array) : enclosed__GT_invocation.call(null,enclosed_array,invoc_array));
} else {
}

(invoc_array[(0)] = G__87887);

(invoc_array[(1)] = G__87888);

(invoc_array[(2)] = G__87889);

(invoc_array[(3)] = G__87890);

(invoc_array[(4)] = G__87891);

(invoc_array[(5)] = G__87892);

(invoc_array[(6)] = G__87893);

(invoc_array[(7)] = G__87894);

(invoc_array[(8)] = G__87895);

(invoc_array[vararg_idx] = G__87896);

while(true){
var ret__86496__auto__ = sci.impl.types.eval(body,ctx,invoc_array);
if(cljs.core.keyword_identical_QMARK_(new cljs.core.Keyword("sci.impl.analyzer","recur","sci.impl.analyzer/recur",2033369355),ret__86496__auto__)){
continue;
} else {
return ret__86496__auto__;
}
break;
}
};
var sci$impl$fns$fun_$_arity_9 = function (G__87887,G__87888,G__87889,G__87890,G__87891,G__87892,G__87893,G__87894,G__87895,var_args){
var G__87896 = null;
if (arguments.length > 9) {
var G__88842__i = 0, G__88842__a = new Array(arguments.length -  9);
while (G__88842__i < G__88842__a.length) {G__88842__a[G__88842__i] = arguments[G__88842__i + 9]; ++G__88842__i;}
  G__87896 = new cljs.core.IndexedSeq(G__88842__a,0,null);
} 
return sci$impl$fns$fun_$_arity_9__delegate.call(this,G__87887,G__87888,G__87889,G__87890,G__87891,G__87892,G__87893,G__87894,G__87895,G__87896);};
sci$impl$fns$fun_$_arity_9.cljs$lang$maxFixedArity = 9;
sci$impl$fns$fun_$_arity_9.cljs$lang$applyTo = (function (arglist__88843){
var G__87887 = cljs.core.first(arglist__88843);
arglist__88843 = cljs.core.next(arglist__88843);
var G__87888 = cljs.core.first(arglist__88843);
arglist__88843 = cljs.core.next(arglist__88843);
var G__87889 = cljs.core.first(arglist__88843);
arglist__88843 = cljs.core.next(arglist__88843);
var G__87890 = cljs.core.first(arglist__88843);
arglist__88843 = cljs.core.next(arglist__88843);
var G__87891 = cljs.core.first(arglist__88843);
arglist__88843 = cljs.core.next(arglist__88843);
var G__87892 = cljs.core.first(arglist__88843);
arglist__88843 = cljs.core.next(arglist__88843);
var G__87893 = cljs.core.first(arglist__88843);
arglist__88843 = cljs.core.next(arglist__88843);
var G__87894 = cljs.core.first(arglist__88843);
arglist__88843 = cljs.core.next(arglist__88843);
var G__87895 = cljs.core.first(arglist__88843);
var G__87896 = cljs.core.rest(arglist__88843);
return sci$impl$fns$fun_$_arity_9__delegate(G__87887,G__87888,G__87889,G__87890,G__87891,G__87892,G__87893,G__87894,G__87895,G__87896);
});
sci$impl$fns$fun_$_arity_9.cljs$core$IFn$_invoke$arity$variadic = sci$impl$fns$fun_$_arity_9__delegate;
return sci$impl$fns$fun_$_arity_9;
})()
;

break;
case (10):
var G__87922 = cljs.core._nth(params,(0));
var G__87923 = cljs.core._nth(params,(1));
var G__87924 = cljs.core._nth(params,(2));
var G__87925 = cljs.core._nth(params,(3));
var G__87926 = cljs.core._nth(params,(4));
var G__87927 = cljs.core._nth(params,(5));
var G__87928 = cljs.core._nth(params,(6));
var G__87929 = cljs.core._nth(params,(7));
var G__87930 = cljs.core._nth(params,(8));
var G__87931 = cljs.core._nth(params,(9));
return (function() { 
var sci$impl$fns$fun_$_arity_10__delegate = function (G__87911,G__87912,G__87913,G__87914,G__87915,G__87916,G__87917,G__87918,G__87919,G__87920,G__87921){
var invoc_array = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1(invoc_size);
if(cljs.core.truth_(enclosed__GT_invocation)){
(enclosed__GT_invocation.cljs$core$IFn$_invoke$arity$2 ? enclosed__GT_invocation.cljs$core$IFn$_invoke$arity$2(enclosed_array,invoc_array) : enclosed__GT_invocation.call(null,enclosed_array,invoc_array));
} else {
}

(invoc_array[(0)] = G__87911);

(invoc_array[(1)] = G__87912);

(invoc_array[(2)] = G__87913);

(invoc_array[(3)] = G__87914);

(invoc_array[(4)] = G__87915);

(invoc_array[(5)] = G__87916);

(invoc_array[(6)] = G__87917);

(invoc_array[(7)] = G__87918);

(invoc_array[(8)] = G__87919);

(invoc_array[(9)] = G__87920);

(invoc_array[vararg_idx] = G__87921);

while(true){
var ret__86496__auto__ = sci.impl.types.eval(body,ctx,invoc_array);
if(cljs.core.keyword_identical_QMARK_(new cljs.core.Keyword("sci.impl.analyzer","recur","sci.impl.analyzer/recur",2033369355),ret__86496__auto__)){
continue;
} else {
return ret__86496__auto__;
}
break;
}
};
var sci$impl$fns$fun_$_arity_10 = function (G__87911,G__87912,G__87913,G__87914,G__87915,G__87916,G__87917,G__87918,G__87919,G__87920,var_args){
var G__87921 = null;
if (arguments.length > 10) {
var G__88846__i = 0, G__88846__a = new Array(arguments.length -  10);
while (G__88846__i < G__88846__a.length) {G__88846__a[G__88846__i] = arguments[G__88846__i + 10]; ++G__88846__i;}
  G__87921 = new cljs.core.IndexedSeq(G__88846__a,0,null);
} 
return sci$impl$fns$fun_$_arity_10__delegate.call(this,G__87911,G__87912,G__87913,G__87914,G__87915,G__87916,G__87917,G__87918,G__87919,G__87920,G__87921);};
sci$impl$fns$fun_$_arity_10.cljs$lang$maxFixedArity = 10;
sci$impl$fns$fun_$_arity_10.cljs$lang$applyTo = (function (arglist__88847){
var G__87911 = cljs.core.first(arglist__88847);
arglist__88847 = cljs.core.next(arglist__88847);
var G__87912 = cljs.core.first(arglist__88847);
arglist__88847 = cljs.core.next(arglist__88847);
var G__87913 = cljs.core.first(arglist__88847);
arglist__88847 = cljs.core.next(arglist__88847);
var G__87914 = cljs.core.first(arglist__88847);
arglist__88847 = cljs.core.next(arglist__88847);
var G__87915 = cljs.core.first(arglist__88847);
arglist__88847 = cljs.core.next(arglist__88847);
var G__87916 = cljs.core.first(arglist__88847);
arglist__88847 = cljs.core.next(arglist__88847);
var G__87917 = cljs.core.first(arglist__88847);
arglist__88847 = cljs.core.next(arglist__88847);
var G__87918 = cljs.core.first(arglist__88847);
arglist__88847 = cljs.core.next(arglist__88847);
var G__87919 = cljs.core.first(arglist__88847);
arglist__88847 = cljs.core.next(arglist__88847);
var G__87920 = cljs.core.first(arglist__88847);
var G__87921 = cljs.core.rest(arglist__88847);
return sci$impl$fns$fun_$_arity_10__delegate(G__87911,G__87912,G__87913,G__87914,G__87915,G__87916,G__87917,G__87918,G__87919,G__87920,G__87921);
});
sci$impl$fns$fun_$_arity_10.cljs$core$IFn$_invoke$arity$variadic = sci$impl$fns$fun_$_arity_10__delegate;
return sci$impl$fns$fun_$_arity_10;
})()
;

break;
case (11):
var G__87945 = cljs.core._nth(params,(0));
var G__87946 = cljs.core._nth(params,(1));
var G__87947 = cljs.core._nth(params,(2));
var G__87948 = cljs.core._nth(params,(3));
var G__87949 = cljs.core._nth(params,(4));
var G__87950 = cljs.core._nth(params,(5));
var G__87951 = cljs.core._nth(params,(6));
var G__87952 = cljs.core._nth(params,(7));
var G__87953 = cljs.core._nth(params,(8));
var G__87954 = cljs.core._nth(params,(9));
var G__87955 = cljs.core._nth(params,(10));
return (function() { 
var sci$impl$fns$fun_$_arity_11__delegate = function (G__87933,G__87934,G__87935,G__87936,G__87937,G__87938,G__87939,G__87940,G__87941,G__87942,G__87943,G__87944){
var invoc_array = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1(invoc_size);
if(cljs.core.truth_(enclosed__GT_invocation)){
(enclosed__GT_invocation.cljs$core$IFn$_invoke$arity$2 ? enclosed__GT_invocation.cljs$core$IFn$_invoke$arity$2(enclosed_array,invoc_array) : enclosed__GT_invocation.call(null,enclosed_array,invoc_array));
} else {
}

(invoc_array[(0)] = G__87933);

(invoc_array[(1)] = G__87934);

(invoc_array[(2)] = G__87935);

(invoc_array[(3)] = G__87936);

(invoc_array[(4)] = G__87937);

(invoc_array[(5)] = G__87938);

(invoc_array[(6)] = G__87939);

(invoc_array[(7)] = G__87940);

(invoc_array[(8)] = G__87941);

(invoc_array[(9)] = G__87942);

(invoc_array[(10)] = G__87943);

(invoc_array[vararg_idx] = G__87944);

while(true){
var ret__86496__auto__ = sci.impl.types.eval(body,ctx,invoc_array);
if(cljs.core.keyword_identical_QMARK_(new cljs.core.Keyword("sci.impl.analyzer","recur","sci.impl.analyzer/recur",2033369355),ret__86496__auto__)){
continue;
} else {
return ret__86496__auto__;
}
break;
}
};
var sci$impl$fns$fun_$_arity_11 = function (G__87933,G__87934,G__87935,G__87936,G__87937,G__87938,G__87939,G__87940,G__87941,G__87942,G__87943,var_args){
var G__87944 = null;
if (arguments.length > 11) {
var G__88850__i = 0, G__88850__a = new Array(arguments.length -  11);
while (G__88850__i < G__88850__a.length) {G__88850__a[G__88850__i] = arguments[G__88850__i + 11]; ++G__88850__i;}
  G__87944 = new cljs.core.IndexedSeq(G__88850__a,0,null);
} 
return sci$impl$fns$fun_$_arity_11__delegate.call(this,G__87933,G__87934,G__87935,G__87936,G__87937,G__87938,G__87939,G__87940,G__87941,G__87942,G__87943,G__87944);};
sci$impl$fns$fun_$_arity_11.cljs$lang$maxFixedArity = 11;
sci$impl$fns$fun_$_arity_11.cljs$lang$applyTo = (function (arglist__88851){
var G__87933 = cljs.core.first(arglist__88851);
arglist__88851 = cljs.core.next(arglist__88851);
var G__87934 = cljs.core.first(arglist__88851);
arglist__88851 = cljs.core.next(arglist__88851);
var G__87935 = cljs.core.first(arglist__88851);
arglist__88851 = cljs.core.next(arglist__88851);
var G__87936 = cljs.core.first(arglist__88851);
arglist__88851 = cljs.core.next(arglist__88851);
var G__87937 = cljs.core.first(arglist__88851);
arglist__88851 = cljs.core.next(arglist__88851);
var G__87938 = cljs.core.first(arglist__88851);
arglist__88851 = cljs.core.next(arglist__88851);
var G__87939 = cljs.core.first(arglist__88851);
arglist__88851 = cljs.core.next(arglist__88851);
var G__87940 = cljs.core.first(arglist__88851);
arglist__88851 = cljs.core.next(arglist__88851);
var G__87941 = cljs.core.first(arglist__88851);
arglist__88851 = cljs.core.next(arglist__88851);
var G__87942 = cljs.core.first(arglist__88851);
arglist__88851 = cljs.core.next(arglist__88851);
var G__87943 = cljs.core.first(arglist__88851);
var G__87944 = cljs.core.rest(arglist__88851);
return sci$impl$fns$fun_$_arity_11__delegate(G__87933,G__87934,G__87935,G__87936,G__87937,G__87938,G__87939,G__87940,G__87941,G__87942,G__87943,G__87944);
});
sci$impl$fns$fun_$_arity_11.cljs$core$IFn$_invoke$arity$variadic = sci$impl$fns$fun_$_arity_11__delegate;
return sci$impl$fns$fun_$_arity_11;
})()
;

break;
case (12):
var G__87973 = cljs.core._nth(params,(0));
var G__87974 = cljs.core._nth(params,(1));
var G__87975 = cljs.core._nth(params,(2));
var G__87976 = cljs.core._nth(params,(3));
var G__87977 = cljs.core._nth(params,(4));
var G__87978 = cljs.core._nth(params,(5));
var G__87979 = cljs.core._nth(params,(6));
var G__87980 = cljs.core._nth(params,(7));
var G__87981 = cljs.core._nth(params,(8));
var G__87982 = cljs.core._nth(params,(9));
var G__87983 = cljs.core._nth(params,(10));
var G__87984 = cljs.core._nth(params,(11));
return (function() { 
var sci$impl$fns$fun_$_arity_12__delegate = function (G__87960,G__87961,G__87962,G__87963,G__87964,G__87965,G__87966,G__87967,G__87968,G__87969,G__87970,G__87971,G__87972){
var invoc_array = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1(invoc_size);
if(cljs.core.truth_(enclosed__GT_invocation)){
(enclosed__GT_invocation.cljs$core$IFn$_invoke$arity$2 ? enclosed__GT_invocation.cljs$core$IFn$_invoke$arity$2(enclosed_array,invoc_array) : enclosed__GT_invocation.call(null,enclosed_array,invoc_array));
} else {
}

(invoc_array[(0)] = G__87960);

(invoc_array[(1)] = G__87961);

(invoc_array[(2)] = G__87962);

(invoc_array[(3)] = G__87963);

(invoc_array[(4)] = G__87964);

(invoc_array[(5)] = G__87965);

(invoc_array[(6)] = G__87966);

(invoc_array[(7)] = G__87967);

(invoc_array[(8)] = G__87968);

(invoc_array[(9)] = G__87969);

(invoc_array[(10)] = G__87970);

(invoc_array[(11)] = G__87971);

(invoc_array[vararg_idx] = G__87972);

while(true){
var ret__86496__auto__ = sci.impl.types.eval(body,ctx,invoc_array);
if(cljs.core.keyword_identical_QMARK_(new cljs.core.Keyword("sci.impl.analyzer","recur","sci.impl.analyzer/recur",2033369355),ret__86496__auto__)){
continue;
} else {
return ret__86496__auto__;
}
break;
}
};
var sci$impl$fns$fun_$_arity_12 = function (G__87960,G__87961,G__87962,G__87963,G__87964,G__87965,G__87966,G__87967,G__87968,G__87969,G__87970,G__87971,var_args){
var G__87972 = null;
if (arguments.length > 12) {
var G__88854__i = 0, G__88854__a = new Array(arguments.length -  12);
while (G__88854__i < G__88854__a.length) {G__88854__a[G__88854__i] = arguments[G__88854__i + 12]; ++G__88854__i;}
  G__87972 = new cljs.core.IndexedSeq(G__88854__a,0,null);
} 
return sci$impl$fns$fun_$_arity_12__delegate.call(this,G__87960,G__87961,G__87962,G__87963,G__87964,G__87965,G__87966,G__87967,G__87968,G__87969,G__87970,G__87971,G__87972);};
sci$impl$fns$fun_$_arity_12.cljs$lang$maxFixedArity = 12;
sci$impl$fns$fun_$_arity_12.cljs$lang$applyTo = (function (arglist__88857){
var G__87960 = cljs.core.first(arglist__88857);
arglist__88857 = cljs.core.next(arglist__88857);
var G__87961 = cljs.core.first(arglist__88857);
arglist__88857 = cljs.core.next(arglist__88857);
var G__87962 = cljs.core.first(arglist__88857);
arglist__88857 = cljs.core.next(arglist__88857);
var G__87963 = cljs.core.first(arglist__88857);
arglist__88857 = cljs.core.next(arglist__88857);
var G__87964 = cljs.core.first(arglist__88857);
arglist__88857 = cljs.core.next(arglist__88857);
var G__87965 = cljs.core.first(arglist__88857);
arglist__88857 = cljs.core.next(arglist__88857);
var G__87966 = cljs.core.first(arglist__88857);
arglist__88857 = cljs.core.next(arglist__88857);
var G__87967 = cljs.core.first(arglist__88857);
arglist__88857 = cljs.core.next(arglist__88857);
var G__87968 = cljs.core.first(arglist__88857);
arglist__88857 = cljs.core.next(arglist__88857);
var G__87969 = cljs.core.first(arglist__88857);
arglist__88857 = cljs.core.next(arglist__88857);
var G__87970 = cljs.core.first(arglist__88857);
arglist__88857 = cljs.core.next(arglist__88857);
var G__87971 = cljs.core.first(arglist__88857);
var G__87972 = cljs.core.rest(arglist__88857);
return sci$impl$fns$fun_$_arity_12__delegate(G__87960,G__87961,G__87962,G__87963,G__87964,G__87965,G__87966,G__87967,G__87968,G__87969,G__87970,G__87971,G__87972);
});
sci$impl$fns$fun_$_arity_12.cljs$core$IFn$_invoke$arity$variadic = sci$impl$fns$fun_$_arity_12__delegate;
return sci$impl$fns$fun_$_arity_12;
})()
;

break;
case (13):
var G__88001 = cljs.core._nth(params,(0));
var G__88002 = cljs.core._nth(params,(1));
var G__88003 = cljs.core._nth(params,(2));
var G__88004 = cljs.core._nth(params,(3));
var G__88005 = cljs.core._nth(params,(4));
var G__88006 = cljs.core._nth(params,(5));
var G__88007 = cljs.core._nth(params,(6));
var G__88008 = cljs.core._nth(params,(7));
var G__88009 = cljs.core._nth(params,(8));
var G__88010 = cljs.core._nth(params,(9));
var G__88011 = cljs.core._nth(params,(10));
var G__88012 = cljs.core._nth(params,(11));
var G__88013 = cljs.core._nth(params,(12));
return (function() { 
var sci$impl$fns$fun_$_arity_13__delegate = function (G__87987,G__87988,G__87989,G__87990,G__87991,G__87992,G__87993,G__87994,G__87995,G__87996,G__87997,G__87998,G__87999,G__88000){
var invoc_array = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1(invoc_size);
if(cljs.core.truth_(enclosed__GT_invocation)){
(enclosed__GT_invocation.cljs$core$IFn$_invoke$arity$2 ? enclosed__GT_invocation.cljs$core$IFn$_invoke$arity$2(enclosed_array,invoc_array) : enclosed__GT_invocation.call(null,enclosed_array,invoc_array));
} else {
}

(invoc_array[(0)] = G__87987);

(invoc_array[(1)] = G__87988);

(invoc_array[(2)] = G__87989);

(invoc_array[(3)] = G__87990);

(invoc_array[(4)] = G__87991);

(invoc_array[(5)] = G__87992);

(invoc_array[(6)] = G__87993);

(invoc_array[(7)] = G__87994);

(invoc_array[(8)] = G__87995);

(invoc_array[(9)] = G__87996);

(invoc_array[(10)] = G__87997);

(invoc_array[(11)] = G__87998);

(invoc_array[(12)] = G__87999);

(invoc_array[vararg_idx] = G__88000);

while(true){
var ret__86496__auto__ = sci.impl.types.eval(body,ctx,invoc_array);
if(cljs.core.keyword_identical_QMARK_(new cljs.core.Keyword("sci.impl.analyzer","recur","sci.impl.analyzer/recur",2033369355),ret__86496__auto__)){
continue;
} else {
return ret__86496__auto__;
}
break;
}
};
var sci$impl$fns$fun_$_arity_13 = function (G__87987,G__87988,G__87989,G__87990,G__87991,G__87992,G__87993,G__87994,G__87995,G__87996,G__87997,G__87998,G__87999,var_args){
var G__88000 = null;
if (arguments.length > 13) {
var G__88861__i = 0, G__88861__a = new Array(arguments.length -  13);
while (G__88861__i < G__88861__a.length) {G__88861__a[G__88861__i] = arguments[G__88861__i + 13]; ++G__88861__i;}
  G__88000 = new cljs.core.IndexedSeq(G__88861__a,0,null);
} 
return sci$impl$fns$fun_$_arity_13__delegate.call(this,G__87987,G__87988,G__87989,G__87990,G__87991,G__87992,G__87993,G__87994,G__87995,G__87996,G__87997,G__87998,G__87999,G__88000);};
sci$impl$fns$fun_$_arity_13.cljs$lang$maxFixedArity = 13;
sci$impl$fns$fun_$_arity_13.cljs$lang$applyTo = (function (arglist__88863){
var G__87987 = cljs.core.first(arglist__88863);
arglist__88863 = cljs.core.next(arglist__88863);
var G__87988 = cljs.core.first(arglist__88863);
arglist__88863 = cljs.core.next(arglist__88863);
var G__87989 = cljs.core.first(arglist__88863);
arglist__88863 = cljs.core.next(arglist__88863);
var G__87990 = cljs.core.first(arglist__88863);
arglist__88863 = cljs.core.next(arglist__88863);
var G__87991 = cljs.core.first(arglist__88863);
arglist__88863 = cljs.core.next(arglist__88863);
var G__87992 = cljs.core.first(arglist__88863);
arglist__88863 = cljs.core.next(arglist__88863);
var G__87993 = cljs.core.first(arglist__88863);
arglist__88863 = cljs.core.next(arglist__88863);
var G__87994 = cljs.core.first(arglist__88863);
arglist__88863 = cljs.core.next(arglist__88863);
var G__87995 = cljs.core.first(arglist__88863);
arglist__88863 = cljs.core.next(arglist__88863);
var G__87996 = cljs.core.first(arglist__88863);
arglist__88863 = cljs.core.next(arglist__88863);
var G__87997 = cljs.core.first(arglist__88863);
arglist__88863 = cljs.core.next(arglist__88863);
var G__87998 = cljs.core.first(arglist__88863);
arglist__88863 = cljs.core.next(arglist__88863);
var G__87999 = cljs.core.first(arglist__88863);
var G__88000 = cljs.core.rest(arglist__88863);
return sci$impl$fns$fun_$_arity_13__delegate(G__87987,G__87988,G__87989,G__87990,G__87991,G__87992,G__87993,G__87994,G__87995,G__87996,G__87997,G__87998,G__87999,G__88000);
});
sci$impl$fns$fun_$_arity_13.cljs$core$IFn$_invoke$arity$variadic = sci$impl$fns$fun_$_arity_13__delegate;
return sci$impl$fns$fun_$_arity_13;
})()
;

break;
case (14):
var G__88030 = cljs.core._nth(params,(0));
var G__88031 = cljs.core._nth(params,(1));
var G__88032 = cljs.core._nth(params,(2));
var G__88033 = cljs.core._nth(params,(3));
var G__88034 = cljs.core._nth(params,(4));
var G__88035 = cljs.core._nth(params,(5));
var G__88036 = cljs.core._nth(params,(6));
var G__88037 = cljs.core._nth(params,(7));
var G__88038 = cljs.core._nth(params,(8));
var G__88039 = cljs.core._nth(params,(9));
var G__88040 = cljs.core._nth(params,(10));
var G__88041 = cljs.core._nth(params,(11));
var G__88042 = cljs.core._nth(params,(12));
var G__88043 = cljs.core._nth(params,(13));
return (function() { 
var sci$impl$fns$fun_$_arity_14__delegate = function (G__88015,G__88016,G__88017,G__88018,G__88019,G__88020,G__88021,G__88022,G__88023,G__88024,G__88025,G__88026,G__88027,G__88028,G__88029){
var invoc_array = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1(invoc_size);
if(cljs.core.truth_(enclosed__GT_invocation)){
(enclosed__GT_invocation.cljs$core$IFn$_invoke$arity$2 ? enclosed__GT_invocation.cljs$core$IFn$_invoke$arity$2(enclosed_array,invoc_array) : enclosed__GT_invocation.call(null,enclosed_array,invoc_array));
} else {
}

(invoc_array[(0)] = G__88015);

(invoc_array[(1)] = G__88016);

(invoc_array[(2)] = G__88017);

(invoc_array[(3)] = G__88018);

(invoc_array[(4)] = G__88019);

(invoc_array[(5)] = G__88020);

(invoc_array[(6)] = G__88021);

(invoc_array[(7)] = G__88022);

(invoc_array[(8)] = G__88023);

(invoc_array[(9)] = G__88024);

(invoc_array[(10)] = G__88025);

(invoc_array[(11)] = G__88026);

(invoc_array[(12)] = G__88027);

(invoc_array[(13)] = G__88028);

(invoc_array[vararg_idx] = G__88029);

while(true){
var ret__86496__auto__ = sci.impl.types.eval(body,ctx,invoc_array);
if(cljs.core.keyword_identical_QMARK_(new cljs.core.Keyword("sci.impl.analyzer","recur","sci.impl.analyzer/recur",2033369355),ret__86496__auto__)){
continue;
} else {
return ret__86496__auto__;
}
break;
}
};
var sci$impl$fns$fun_$_arity_14 = function (G__88015,G__88016,G__88017,G__88018,G__88019,G__88020,G__88021,G__88022,G__88023,G__88024,G__88025,G__88026,G__88027,G__88028,var_args){
var G__88029 = null;
if (arguments.length > 14) {
var G__88872__i = 0, G__88872__a = new Array(arguments.length -  14);
while (G__88872__i < G__88872__a.length) {G__88872__a[G__88872__i] = arguments[G__88872__i + 14]; ++G__88872__i;}
  G__88029 = new cljs.core.IndexedSeq(G__88872__a,0,null);
} 
return sci$impl$fns$fun_$_arity_14__delegate.call(this,G__88015,G__88016,G__88017,G__88018,G__88019,G__88020,G__88021,G__88022,G__88023,G__88024,G__88025,G__88026,G__88027,G__88028,G__88029);};
sci$impl$fns$fun_$_arity_14.cljs$lang$maxFixedArity = 14;
sci$impl$fns$fun_$_arity_14.cljs$lang$applyTo = (function (arglist__88873){
var G__88015 = cljs.core.first(arglist__88873);
arglist__88873 = cljs.core.next(arglist__88873);
var G__88016 = cljs.core.first(arglist__88873);
arglist__88873 = cljs.core.next(arglist__88873);
var G__88017 = cljs.core.first(arglist__88873);
arglist__88873 = cljs.core.next(arglist__88873);
var G__88018 = cljs.core.first(arglist__88873);
arglist__88873 = cljs.core.next(arglist__88873);
var G__88019 = cljs.core.first(arglist__88873);
arglist__88873 = cljs.core.next(arglist__88873);
var G__88020 = cljs.core.first(arglist__88873);
arglist__88873 = cljs.core.next(arglist__88873);
var G__88021 = cljs.core.first(arglist__88873);
arglist__88873 = cljs.core.next(arglist__88873);
var G__88022 = cljs.core.first(arglist__88873);
arglist__88873 = cljs.core.next(arglist__88873);
var G__88023 = cljs.core.first(arglist__88873);
arglist__88873 = cljs.core.next(arglist__88873);
var G__88024 = cljs.core.first(arglist__88873);
arglist__88873 = cljs.core.next(arglist__88873);
var G__88025 = cljs.core.first(arglist__88873);
arglist__88873 = cljs.core.next(arglist__88873);
var G__88026 = cljs.core.first(arglist__88873);
arglist__88873 = cljs.core.next(arglist__88873);
var G__88027 = cljs.core.first(arglist__88873);
arglist__88873 = cljs.core.next(arglist__88873);
var G__88028 = cljs.core.first(arglist__88873);
var G__88029 = cljs.core.rest(arglist__88873);
return sci$impl$fns$fun_$_arity_14__delegate(G__88015,G__88016,G__88017,G__88018,G__88019,G__88020,G__88021,G__88022,G__88023,G__88024,G__88025,G__88026,G__88027,G__88028,G__88029);
});
sci$impl$fns$fun_$_arity_14.cljs$core$IFn$_invoke$arity$variadic = sci$impl$fns$fun_$_arity_14__delegate;
return sci$impl$fns$fun_$_arity_14;
})()
;

break;
case (15):
var G__88065 = cljs.core._nth(params,(0));
var G__88066 = cljs.core._nth(params,(1));
var G__88067 = cljs.core._nth(params,(2));
var G__88068 = cljs.core._nth(params,(3));
var G__88069 = cljs.core._nth(params,(4));
var G__88070 = cljs.core._nth(params,(5));
var G__88071 = cljs.core._nth(params,(6));
var G__88072 = cljs.core._nth(params,(7));
var G__88073 = cljs.core._nth(params,(8));
var G__88074 = cljs.core._nth(params,(9));
var G__88075 = cljs.core._nth(params,(10));
var G__88076 = cljs.core._nth(params,(11));
var G__88077 = cljs.core._nth(params,(12));
var G__88078 = cljs.core._nth(params,(13));
var G__88079 = cljs.core._nth(params,(14));
return (function() { 
var sci$impl$fns$fun_$_arity_15__delegate = function (G__88049,G__88050,G__88051,G__88052,G__88053,G__88054,G__88055,G__88056,G__88057,G__88058,G__88059,G__88060,G__88061,G__88062,G__88063,G__88064){
var invoc_array = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1(invoc_size);
if(cljs.core.truth_(enclosed__GT_invocation)){
(enclosed__GT_invocation.cljs$core$IFn$_invoke$arity$2 ? enclosed__GT_invocation.cljs$core$IFn$_invoke$arity$2(enclosed_array,invoc_array) : enclosed__GT_invocation.call(null,enclosed_array,invoc_array));
} else {
}

(invoc_array[(0)] = G__88049);

(invoc_array[(1)] = G__88050);

(invoc_array[(2)] = G__88051);

(invoc_array[(3)] = G__88052);

(invoc_array[(4)] = G__88053);

(invoc_array[(5)] = G__88054);

(invoc_array[(6)] = G__88055);

(invoc_array[(7)] = G__88056);

(invoc_array[(8)] = G__88057);

(invoc_array[(9)] = G__88058);

(invoc_array[(10)] = G__88059);

(invoc_array[(11)] = G__88060);

(invoc_array[(12)] = G__88061);

(invoc_array[(13)] = G__88062);

(invoc_array[(14)] = G__88063);

(invoc_array[vararg_idx] = G__88064);

while(true){
var ret__86496__auto__ = sci.impl.types.eval(body,ctx,invoc_array);
if(cljs.core.keyword_identical_QMARK_(new cljs.core.Keyword("sci.impl.analyzer","recur","sci.impl.analyzer/recur",2033369355),ret__86496__auto__)){
continue;
} else {
return ret__86496__auto__;
}
break;
}
};
var sci$impl$fns$fun_$_arity_15 = function (G__88049,G__88050,G__88051,G__88052,G__88053,G__88054,G__88055,G__88056,G__88057,G__88058,G__88059,G__88060,G__88061,G__88062,G__88063,var_args){
var G__88064 = null;
if (arguments.length > 15) {
var G__88876__i = 0, G__88876__a = new Array(arguments.length -  15);
while (G__88876__i < G__88876__a.length) {G__88876__a[G__88876__i] = arguments[G__88876__i + 15]; ++G__88876__i;}
  G__88064 = new cljs.core.IndexedSeq(G__88876__a,0,null);
} 
return sci$impl$fns$fun_$_arity_15__delegate.call(this,G__88049,G__88050,G__88051,G__88052,G__88053,G__88054,G__88055,G__88056,G__88057,G__88058,G__88059,G__88060,G__88061,G__88062,G__88063,G__88064);};
sci$impl$fns$fun_$_arity_15.cljs$lang$maxFixedArity = 15;
sci$impl$fns$fun_$_arity_15.cljs$lang$applyTo = (function (arglist__88877){
var G__88049 = cljs.core.first(arglist__88877);
arglist__88877 = cljs.core.next(arglist__88877);
var G__88050 = cljs.core.first(arglist__88877);
arglist__88877 = cljs.core.next(arglist__88877);
var G__88051 = cljs.core.first(arglist__88877);
arglist__88877 = cljs.core.next(arglist__88877);
var G__88052 = cljs.core.first(arglist__88877);
arglist__88877 = cljs.core.next(arglist__88877);
var G__88053 = cljs.core.first(arglist__88877);
arglist__88877 = cljs.core.next(arglist__88877);
var G__88054 = cljs.core.first(arglist__88877);
arglist__88877 = cljs.core.next(arglist__88877);
var G__88055 = cljs.core.first(arglist__88877);
arglist__88877 = cljs.core.next(arglist__88877);
var G__88056 = cljs.core.first(arglist__88877);
arglist__88877 = cljs.core.next(arglist__88877);
var G__88057 = cljs.core.first(arglist__88877);
arglist__88877 = cljs.core.next(arglist__88877);
var G__88058 = cljs.core.first(arglist__88877);
arglist__88877 = cljs.core.next(arglist__88877);
var G__88059 = cljs.core.first(arglist__88877);
arglist__88877 = cljs.core.next(arglist__88877);
var G__88060 = cljs.core.first(arglist__88877);
arglist__88877 = cljs.core.next(arglist__88877);
var G__88061 = cljs.core.first(arglist__88877);
arglist__88877 = cljs.core.next(arglist__88877);
var G__88062 = cljs.core.first(arglist__88877);
arglist__88877 = cljs.core.next(arglist__88877);
var G__88063 = cljs.core.first(arglist__88877);
var G__88064 = cljs.core.rest(arglist__88877);
return sci$impl$fns$fun_$_arity_15__delegate(G__88049,G__88050,G__88051,G__88052,G__88053,G__88054,G__88055,G__88056,G__88057,G__88058,G__88059,G__88060,G__88061,G__88062,G__88063,G__88064);
});
sci$impl$fns$fun_$_arity_15.cljs$core$IFn$_invoke$arity$variadic = sci$impl$fns$fun_$_arity_15__delegate;
return sci$impl$fns$fun_$_arity_15;
})()
;

break;
case (16):
var G__88104 = cljs.core._nth(params,(0));
var G__88105 = cljs.core._nth(params,(1));
var G__88106 = cljs.core._nth(params,(2));
var G__88107 = cljs.core._nth(params,(3));
var G__88108 = cljs.core._nth(params,(4));
var G__88109 = cljs.core._nth(params,(5));
var G__88110 = cljs.core._nth(params,(6));
var G__88111 = cljs.core._nth(params,(7));
var G__88112 = cljs.core._nth(params,(8));
var G__88113 = cljs.core._nth(params,(9));
var G__88114 = cljs.core._nth(params,(10));
var G__88115 = cljs.core._nth(params,(11));
var G__88116 = cljs.core._nth(params,(12));
var G__88117 = cljs.core._nth(params,(13));
var G__88118 = cljs.core._nth(params,(14));
var G__88119 = cljs.core._nth(params,(15));
return (function() { 
var sci$impl$fns$fun_$_arity_16__delegate = function (G__88087,G__88088,G__88089,G__88090,G__88091,G__88092,G__88093,G__88094,G__88095,G__88096,G__88097,G__88098,G__88099,G__88100,G__88101,G__88102,G__88103){
var invoc_array = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1(invoc_size);
if(cljs.core.truth_(enclosed__GT_invocation)){
(enclosed__GT_invocation.cljs$core$IFn$_invoke$arity$2 ? enclosed__GT_invocation.cljs$core$IFn$_invoke$arity$2(enclosed_array,invoc_array) : enclosed__GT_invocation.call(null,enclosed_array,invoc_array));
} else {
}

(invoc_array[(0)] = G__88087);

(invoc_array[(1)] = G__88088);

(invoc_array[(2)] = G__88089);

(invoc_array[(3)] = G__88090);

(invoc_array[(4)] = G__88091);

(invoc_array[(5)] = G__88092);

(invoc_array[(6)] = G__88093);

(invoc_array[(7)] = G__88094);

(invoc_array[(8)] = G__88095);

(invoc_array[(9)] = G__88096);

(invoc_array[(10)] = G__88097);

(invoc_array[(11)] = G__88098);

(invoc_array[(12)] = G__88099);

(invoc_array[(13)] = G__88100);

(invoc_array[(14)] = G__88101);

(invoc_array[(15)] = G__88102);

(invoc_array[vararg_idx] = G__88103);

while(true){
var ret__86496__auto__ = sci.impl.types.eval(body,ctx,invoc_array);
if(cljs.core.keyword_identical_QMARK_(new cljs.core.Keyword("sci.impl.analyzer","recur","sci.impl.analyzer/recur",2033369355),ret__86496__auto__)){
continue;
} else {
return ret__86496__auto__;
}
break;
}
};
var sci$impl$fns$fun_$_arity_16 = function (G__88087,G__88088,G__88089,G__88090,G__88091,G__88092,G__88093,G__88094,G__88095,G__88096,G__88097,G__88098,G__88099,G__88100,G__88101,G__88102,var_args){
var G__88103 = null;
if (arguments.length > 16) {
var G__88880__i = 0, G__88880__a = new Array(arguments.length -  16);
while (G__88880__i < G__88880__a.length) {G__88880__a[G__88880__i] = arguments[G__88880__i + 16]; ++G__88880__i;}
  G__88103 = new cljs.core.IndexedSeq(G__88880__a,0,null);
} 
return sci$impl$fns$fun_$_arity_16__delegate.call(this,G__88087,G__88088,G__88089,G__88090,G__88091,G__88092,G__88093,G__88094,G__88095,G__88096,G__88097,G__88098,G__88099,G__88100,G__88101,G__88102,G__88103);};
sci$impl$fns$fun_$_arity_16.cljs$lang$maxFixedArity = 16;
sci$impl$fns$fun_$_arity_16.cljs$lang$applyTo = (function (arglist__88881){
var G__88087 = cljs.core.first(arglist__88881);
arglist__88881 = cljs.core.next(arglist__88881);
var G__88088 = cljs.core.first(arglist__88881);
arglist__88881 = cljs.core.next(arglist__88881);
var G__88089 = cljs.core.first(arglist__88881);
arglist__88881 = cljs.core.next(arglist__88881);
var G__88090 = cljs.core.first(arglist__88881);
arglist__88881 = cljs.core.next(arglist__88881);
var G__88091 = cljs.core.first(arglist__88881);
arglist__88881 = cljs.core.next(arglist__88881);
var G__88092 = cljs.core.first(arglist__88881);
arglist__88881 = cljs.core.next(arglist__88881);
var G__88093 = cljs.core.first(arglist__88881);
arglist__88881 = cljs.core.next(arglist__88881);
var G__88094 = cljs.core.first(arglist__88881);
arglist__88881 = cljs.core.next(arglist__88881);
var G__88095 = cljs.core.first(arglist__88881);
arglist__88881 = cljs.core.next(arglist__88881);
var G__88096 = cljs.core.first(arglist__88881);
arglist__88881 = cljs.core.next(arglist__88881);
var G__88097 = cljs.core.first(arglist__88881);
arglist__88881 = cljs.core.next(arglist__88881);
var G__88098 = cljs.core.first(arglist__88881);
arglist__88881 = cljs.core.next(arglist__88881);
var G__88099 = cljs.core.first(arglist__88881);
arglist__88881 = cljs.core.next(arglist__88881);
var G__88100 = cljs.core.first(arglist__88881);
arglist__88881 = cljs.core.next(arglist__88881);
var G__88101 = cljs.core.first(arglist__88881);
arglist__88881 = cljs.core.next(arglist__88881);
var G__88102 = cljs.core.first(arglist__88881);
var G__88103 = cljs.core.rest(arglist__88881);
return sci$impl$fns$fun_$_arity_16__delegate(G__88087,G__88088,G__88089,G__88090,G__88091,G__88092,G__88093,G__88094,G__88095,G__88096,G__88097,G__88098,G__88099,G__88100,G__88101,G__88102,G__88103);
});
sci$impl$fns$fun_$_arity_16.cljs$core$IFn$_invoke$arity$variadic = sci$impl$fns$fun_$_arity_16__delegate;
return sci$impl$fns$fun_$_arity_16;
})()
;

break;
case (17):
var G__88141 = cljs.core._nth(params,(0));
var G__88142 = cljs.core._nth(params,(1));
var G__88143 = cljs.core._nth(params,(2));
var G__88144 = cljs.core._nth(params,(3));
var G__88146 = cljs.core._nth(params,(4));
var G__88147 = cljs.core._nth(params,(5));
var G__88148 = cljs.core._nth(params,(6));
var G__88149 = cljs.core._nth(params,(7));
var G__88150 = cljs.core._nth(params,(8));
var G__88151 = cljs.core._nth(params,(9));
var G__88152 = cljs.core._nth(params,(10));
var G__88153 = cljs.core._nth(params,(11));
var G__88154 = cljs.core._nth(params,(12));
var G__88155 = cljs.core._nth(params,(13));
var G__88156 = cljs.core._nth(params,(14));
var G__88157 = cljs.core._nth(params,(15));
var G__88158 = cljs.core._nth(params,(16));
return (function() { 
var sci$impl$fns$fun_$_arity_17__delegate = function (G__88123,G__88124,G__88125,G__88126,G__88127,G__88128,G__88129,G__88130,G__88131,G__88132,G__88133,G__88134,G__88135,G__88136,G__88137,G__88138,G__88139,G__88140){
var invoc_array = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1(invoc_size);
if(cljs.core.truth_(enclosed__GT_invocation)){
(enclosed__GT_invocation.cljs$core$IFn$_invoke$arity$2 ? enclosed__GT_invocation.cljs$core$IFn$_invoke$arity$2(enclosed_array,invoc_array) : enclosed__GT_invocation.call(null,enclosed_array,invoc_array));
} else {
}

(invoc_array[(0)] = G__88123);

(invoc_array[(1)] = G__88124);

(invoc_array[(2)] = G__88125);

(invoc_array[(3)] = G__88126);

(invoc_array[(4)] = G__88127);

(invoc_array[(5)] = G__88128);

(invoc_array[(6)] = G__88129);

(invoc_array[(7)] = G__88130);

(invoc_array[(8)] = G__88131);

(invoc_array[(9)] = G__88132);

(invoc_array[(10)] = G__88133);

(invoc_array[(11)] = G__88134);

(invoc_array[(12)] = G__88135);

(invoc_array[(13)] = G__88136);

(invoc_array[(14)] = G__88137);

(invoc_array[(15)] = G__88138);

(invoc_array[(16)] = G__88139);

(invoc_array[vararg_idx] = G__88140);

while(true){
var ret__86496__auto__ = sci.impl.types.eval(body,ctx,invoc_array);
if(cljs.core.keyword_identical_QMARK_(new cljs.core.Keyword("sci.impl.analyzer","recur","sci.impl.analyzer/recur",2033369355),ret__86496__auto__)){
continue;
} else {
return ret__86496__auto__;
}
break;
}
};
var sci$impl$fns$fun_$_arity_17 = function (G__88123,G__88124,G__88125,G__88126,G__88127,G__88128,G__88129,G__88130,G__88131,G__88132,G__88133,G__88134,G__88135,G__88136,G__88137,G__88138,G__88139,var_args){
var G__88140 = null;
if (arguments.length > 17) {
var G__88884__i = 0, G__88884__a = new Array(arguments.length -  17);
while (G__88884__i < G__88884__a.length) {G__88884__a[G__88884__i] = arguments[G__88884__i + 17]; ++G__88884__i;}
  G__88140 = new cljs.core.IndexedSeq(G__88884__a,0,null);
} 
return sci$impl$fns$fun_$_arity_17__delegate.call(this,G__88123,G__88124,G__88125,G__88126,G__88127,G__88128,G__88129,G__88130,G__88131,G__88132,G__88133,G__88134,G__88135,G__88136,G__88137,G__88138,G__88139,G__88140);};
sci$impl$fns$fun_$_arity_17.cljs$lang$maxFixedArity = 17;
sci$impl$fns$fun_$_arity_17.cljs$lang$applyTo = (function (arglist__88885){
var G__88123 = cljs.core.first(arglist__88885);
arglist__88885 = cljs.core.next(arglist__88885);
var G__88124 = cljs.core.first(arglist__88885);
arglist__88885 = cljs.core.next(arglist__88885);
var G__88125 = cljs.core.first(arglist__88885);
arglist__88885 = cljs.core.next(arglist__88885);
var G__88126 = cljs.core.first(arglist__88885);
arglist__88885 = cljs.core.next(arglist__88885);
var G__88127 = cljs.core.first(arglist__88885);
arglist__88885 = cljs.core.next(arglist__88885);
var G__88128 = cljs.core.first(arglist__88885);
arglist__88885 = cljs.core.next(arglist__88885);
var G__88129 = cljs.core.first(arglist__88885);
arglist__88885 = cljs.core.next(arglist__88885);
var G__88130 = cljs.core.first(arglist__88885);
arglist__88885 = cljs.core.next(arglist__88885);
var G__88131 = cljs.core.first(arglist__88885);
arglist__88885 = cljs.core.next(arglist__88885);
var G__88132 = cljs.core.first(arglist__88885);
arglist__88885 = cljs.core.next(arglist__88885);
var G__88133 = cljs.core.first(arglist__88885);
arglist__88885 = cljs.core.next(arglist__88885);
var G__88134 = cljs.core.first(arglist__88885);
arglist__88885 = cljs.core.next(arglist__88885);
var G__88135 = cljs.core.first(arglist__88885);
arglist__88885 = cljs.core.next(arglist__88885);
var G__88136 = cljs.core.first(arglist__88885);
arglist__88885 = cljs.core.next(arglist__88885);
var G__88137 = cljs.core.first(arglist__88885);
arglist__88885 = cljs.core.next(arglist__88885);
var G__88138 = cljs.core.first(arglist__88885);
arglist__88885 = cljs.core.next(arglist__88885);
var G__88139 = cljs.core.first(arglist__88885);
var G__88140 = cljs.core.rest(arglist__88885);
return sci$impl$fns$fun_$_arity_17__delegate(G__88123,G__88124,G__88125,G__88126,G__88127,G__88128,G__88129,G__88130,G__88131,G__88132,G__88133,G__88134,G__88135,G__88136,G__88137,G__88138,G__88139,G__88140);
});
sci$impl$fns$fun_$_arity_17.cljs$core$IFn$_invoke$arity$variadic = sci$impl$fns$fun_$_arity_17__delegate;
return sci$impl$fns$fun_$_arity_17;
})()
;

break;
case (18):
var G__88182 = cljs.core._nth(params,(0));
var G__88183 = cljs.core._nth(params,(1));
var G__88185 = cljs.core._nth(params,(2));
var G__88186 = cljs.core._nth(params,(3));
var G__88187 = cljs.core._nth(params,(4));
var G__88188 = cljs.core._nth(params,(5));
var G__88189 = cljs.core._nth(params,(6));
var G__88190 = cljs.core._nth(params,(7));
var G__88191 = cljs.core._nth(params,(8));
var G__88192 = cljs.core._nth(params,(9));
var G__88193 = cljs.core._nth(params,(10));
var G__88194 = cljs.core._nth(params,(11));
var G__88195 = cljs.core._nth(params,(12));
var G__88196 = cljs.core._nth(params,(13));
var G__88197 = cljs.core._nth(params,(14));
var G__88198 = cljs.core._nth(params,(15));
var G__88199 = cljs.core._nth(params,(16));
var G__88200 = cljs.core._nth(params,(17));
return (function() { 
var sci$impl$fns$fun_$_arity_18__delegate = function (G__88163,G__88164,G__88165,G__88166,G__88167,G__88168,G__88169,G__88170,G__88171,G__88172,G__88173,G__88174,G__88175,G__88176,G__88177,G__88178,G__88179,G__88180,G__88181){
var invoc_array = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1(invoc_size);
if(cljs.core.truth_(enclosed__GT_invocation)){
(enclosed__GT_invocation.cljs$core$IFn$_invoke$arity$2 ? enclosed__GT_invocation.cljs$core$IFn$_invoke$arity$2(enclosed_array,invoc_array) : enclosed__GT_invocation.call(null,enclosed_array,invoc_array));
} else {
}

(invoc_array[(0)] = G__88163);

(invoc_array[(1)] = G__88164);

(invoc_array[(2)] = G__88165);

(invoc_array[(3)] = G__88166);

(invoc_array[(4)] = G__88167);

(invoc_array[(5)] = G__88168);

(invoc_array[(6)] = G__88169);

(invoc_array[(7)] = G__88170);

(invoc_array[(8)] = G__88171);

(invoc_array[(9)] = G__88172);

(invoc_array[(10)] = G__88173);

(invoc_array[(11)] = G__88174);

(invoc_array[(12)] = G__88175);

(invoc_array[(13)] = G__88176);

(invoc_array[(14)] = G__88177);

(invoc_array[(15)] = G__88178);

(invoc_array[(16)] = G__88179);

(invoc_array[(17)] = G__88180);

(invoc_array[vararg_idx] = G__88181);

while(true){
var ret__86496__auto__ = sci.impl.types.eval(body,ctx,invoc_array);
if(cljs.core.keyword_identical_QMARK_(new cljs.core.Keyword("sci.impl.analyzer","recur","sci.impl.analyzer/recur",2033369355),ret__86496__auto__)){
continue;
} else {
return ret__86496__auto__;
}
break;
}
};
var sci$impl$fns$fun_$_arity_18 = function (G__88163,G__88164,G__88165,G__88166,G__88167,G__88168,G__88169,G__88170,G__88171,G__88172,G__88173,G__88174,G__88175,G__88176,G__88177,G__88178,G__88179,G__88180,var_args){
var G__88181 = null;
if (arguments.length > 18) {
var G__88889__i = 0, G__88889__a = new Array(arguments.length -  18);
while (G__88889__i < G__88889__a.length) {G__88889__a[G__88889__i] = arguments[G__88889__i + 18]; ++G__88889__i;}
  G__88181 = new cljs.core.IndexedSeq(G__88889__a,0,null);
} 
return sci$impl$fns$fun_$_arity_18__delegate.call(this,G__88163,G__88164,G__88165,G__88166,G__88167,G__88168,G__88169,G__88170,G__88171,G__88172,G__88173,G__88174,G__88175,G__88176,G__88177,G__88178,G__88179,G__88180,G__88181);};
sci$impl$fns$fun_$_arity_18.cljs$lang$maxFixedArity = 18;
sci$impl$fns$fun_$_arity_18.cljs$lang$applyTo = (function (arglist__88890){
var G__88163 = cljs.core.first(arglist__88890);
arglist__88890 = cljs.core.next(arglist__88890);
var G__88164 = cljs.core.first(arglist__88890);
arglist__88890 = cljs.core.next(arglist__88890);
var G__88165 = cljs.core.first(arglist__88890);
arglist__88890 = cljs.core.next(arglist__88890);
var G__88166 = cljs.core.first(arglist__88890);
arglist__88890 = cljs.core.next(arglist__88890);
var G__88167 = cljs.core.first(arglist__88890);
arglist__88890 = cljs.core.next(arglist__88890);
var G__88168 = cljs.core.first(arglist__88890);
arglist__88890 = cljs.core.next(arglist__88890);
var G__88169 = cljs.core.first(arglist__88890);
arglist__88890 = cljs.core.next(arglist__88890);
var G__88170 = cljs.core.first(arglist__88890);
arglist__88890 = cljs.core.next(arglist__88890);
var G__88171 = cljs.core.first(arglist__88890);
arglist__88890 = cljs.core.next(arglist__88890);
var G__88172 = cljs.core.first(arglist__88890);
arglist__88890 = cljs.core.next(arglist__88890);
var G__88173 = cljs.core.first(arglist__88890);
arglist__88890 = cljs.core.next(arglist__88890);
var G__88174 = cljs.core.first(arglist__88890);
arglist__88890 = cljs.core.next(arglist__88890);
var G__88175 = cljs.core.first(arglist__88890);
arglist__88890 = cljs.core.next(arglist__88890);
var G__88176 = cljs.core.first(arglist__88890);
arglist__88890 = cljs.core.next(arglist__88890);
var G__88177 = cljs.core.first(arglist__88890);
arglist__88890 = cljs.core.next(arglist__88890);
var G__88178 = cljs.core.first(arglist__88890);
arglist__88890 = cljs.core.next(arglist__88890);
var G__88179 = cljs.core.first(arglist__88890);
arglist__88890 = cljs.core.next(arglist__88890);
var G__88180 = cljs.core.first(arglist__88890);
var G__88181 = cljs.core.rest(arglist__88890);
return sci$impl$fns$fun_$_arity_18__delegate(G__88163,G__88164,G__88165,G__88166,G__88167,G__88168,G__88169,G__88170,G__88171,G__88172,G__88173,G__88174,G__88175,G__88176,G__88177,G__88178,G__88179,G__88180,G__88181);
});
sci$impl$fns$fun_$_arity_18.cljs$core$IFn$_invoke$arity$variadic = sci$impl$fns$fun_$_arity_18__delegate;
return sci$impl$fns$fun_$_arity_18;
})()
;

break;
case (19):
var G__88224 = cljs.core._nth(params,(0));
var G__88225 = cljs.core._nth(params,(1));
var G__88226 = cljs.core._nth(params,(2));
var G__88227 = cljs.core._nth(params,(3));
var G__88228 = cljs.core._nth(params,(4));
var G__88229 = cljs.core._nth(params,(5));
var G__88230 = cljs.core._nth(params,(6));
var G__88231 = cljs.core._nth(params,(7));
var G__88232 = cljs.core._nth(params,(8));
var G__88233 = cljs.core._nth(params,(9));
var G__88234 = cljs.core._nth(params,(10));
var G__88235 = cljs.core._nth(params,(11));
var G__88236 = cljs.core._nth(params,(12));
var G__88237 = cljs.core._nth(params,(13));
var G__88238 = cljs.core._nth(params,(14));
var G__88239 = cljs.core._nth(params,(15));
var G__88240 = cljs.core._nth(params,(16));
var G__88241 = cljs.core._nth(params,(17));
var G__88242 = cljs.core._nth(params,(18));
return (function() { 
var sci$impl$fns$fun_$_arity_19__delegate = function (G__88204,G__88205,G__88206,G__88207,G__88208,G__88209,G__88210,G__88211,G__88212,G__88213,G__88214,G__88215,G__88216,G__88217,G__88218,G__88219,G__88220,G__88221,G__88222,G__88223){
var invoc_array = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1(invoc_size);
if(cljs.core.truth_(enclosed__GT_invocation)){
(enclosed__GT_invocation.cljs$core$IFn$_invoke$arity$2 ? enclosed__GT_invocation.cljs$core$IFn$_invoke$arity$2(enclosed_array,invoc_array) : enclosed__GT_invocation.call(null,enclosed_array,invoc_array));
} else {
}

(invoc_array[(0)] = G__88204);

(invoc_array[(1)] = G__88205);

(invoc_array[(2)] = G__88206);

(invoc_array[(3)] = G__88207);

(invoc_array[(4)] = G__88208);

(invoc_array[(5)] = G__88209);

(invoc_array[(6)] = G__88210);

(invoc_array[(7)] = G__88211);

(invoc_array[(8)] = G__88212);

(invoc_array[(9)] = G__88213);

(invoc_array[(10)] = G__88214);

(invoc_array[(11)] = G__88215);

(invoc_array[(12)] = G__88216);

(invoc_array[(13)] = G__88217);

(invoc_array[(14)] = G__88218);

(invoc_array[(15)] = G__88219);

(invoc_array[(16)] = G__88220);

(invoc_array[(17)] = G__88221);

(invoc_array[(18)] = G__88222);

(invoc_array[vararg_idx] = G__88223);

while(true){
var ret__86496__auto__ = sci.impl.types.eval(body,ctx,invoc_array);
if(cljs.core.keyword_identical_QMARK_(new cljs.core.Keyword("sci.impl.analyzer","recur","sci.impl.analyzer/recur",2033369355),ret__86496__auto__)){
continue;
} else {
return ret__86496__auto__;
}
break;
}
};
var sci$impl$fns$fun_$_arity_19 = function (G__88204,G__88205,G__88206,G__88207,G__88208,G__88209,G__88210,G__88211,G__88212,G__88213,G__88214,G__88215,G__88216,G__88217,G__88218,G__88219,G__88220,G__88221,G__88222,var_args){
var G__88223 = null;
if (arguments.length > 19) {
var G__88893__i = 0, G__88893__a = new Array(arguments.length -  19);
while (G__88893__i < G__88893__a.length) {G__88893__a[G__88893__i] = arguments[G__88893__i + 19]; ++G__88893__i;}
  G__88223 = new cljs.core.IndexedSeq(G__88893__a,0,null);
} 
return sci$impl$fns$fun_$_arity_19__delegate.call(this,G__88204,G__88205,G__88206,G__88207,G__88208,G__88209,G__88210,G__88211,G__88212,G__88213,G__88214,G__88215,G__88216,G__88217,G__88218,G__88219,G__88220,G__88221,G__88222,G__88223);};
sci$impl$fns$fun_$_arity_19.cljs$lang$maxFixedArity = 19;
sci$impl$fns$fun_$_arity_19.cljs$lang$applyTo = (function (arglist__88895){
var G__88204 = cljs.core.first(arglist__88895);
arglist__88895 = cljs.core.next(arglist__88895);
var G__88205 = cljs.core.first(arglist__88895);
arglist__88895 = cljs.core.next(arglist__88895);
var G__88206 = cljs.core.first(arglist__88895);
arglist__88895 = cljs.core.next(arglist__88895);
var G__88207 = cljs.core.first(arglist__88895);
arglist__88895 = cljs.core.next(arglist__88895);
var G__88208 = cljs.core.first(arglist__88895);
arglist__88895 = cljs.core.next(arglist__88895);
var G__88209 = cljs.core.first(arglist__88895);
arglist__88895 = cljs.core.next(arglist__88895);
var G__88210 = cljs.core.first(arglist__88895);
arglist__88895 = cljs.core.next(arglist__88895);
var G__88211 = cljs.core.first(arglist__88895);
arglist__88895 = cljs.core.next(arglist__88895);
var G__88212 = cljs.core.first(arglist__88895);
arglist__88895 = cljs.core.next(arglist__88895);
var G__88213 = cljs.core.first(arglist__88895);
arglist__88895 = cljs.core.next(arglist__88895);
var G__88214 = cljs.core.first(arglist__88895);
arglist__88895 = cljs.core.next(arglist__88895);
var G__88215 = cljs.core.first(arglist__88895);
arglist__88895 = cljs.core.next(arglist__88895);
var G__88216 = cljs.core.first(arglist__88895);
arglist__88895 = cljs.core.next(arglist__88895);
var G__88217 = cljs.core.first(arglist__88895);
arglist__88895 = cljs.core.next(arglist__88895);
var G__88218 = cljs.core.first(arglist__88895);
arglist__88895 = cljs.core.next(arglist__88895);
var G__88219 = cljs.core.first(arglist__88895);
arglist__88895 = cljs.core.next(arglist__88895);
var G__88220 = cljs.core.first(arglist__88895);
arglist__88895 = cljs.core.next(arglist__88895);
var G__88221 = cljs.core.first(arglist__88895);
arglist__88895 = cljs.core.next(arglist__88895);
var G__88222 = cljs.core.first(arglist__88895);
var G__88223 = cljs.core.rest(arglist__88895);
return sci$impl$fns$fun_$_arity_19__delegate(G__88204,G__88205,G__88206,G__88207,G__88208,G__88209,G__88210,G__88211,G__88212,G__88213,G__88214,G__88215,G__88216,G__88217,G__88218,G__88219,G__88220,G__88221,G__88222,G__88223);
});
sci$impl$fns$fun_$_arity_19.cljs$core$IFn$_invoke$arity$variadic = sci$impl$fns$fun_$_arity_19__delegate;
return sci$impl$fns$fun_$_arity_19;
})()
;

break;
case (20):
var G__88266 = cljs.core._nth(params,(0));
var G__88267 = cljs.core._nth(params,(1));
var G__88268 = cljs.core._nth(params,(2));
var G__88269 = cljs.core._nth(params,(3));
var G__88270 = cljs.core._nth(params,(4));
var G__88271 = cljs.core._nth(params,(5));
var G__88272 = cljs.core._nth(params,(6));
var G__88273 = cljs.core._nth(params,(7));
var G__88274 = cljs.core._nth(params,(8));
var G__88275 = cljs.core._nth(params,(9));
var G__88276 = cljs.core._nth(params,(10));
var G__88277 = cljs.core._nth(params,(11));
var G__88278 = cljs.core._nth(params,(12));
var G__88279 = cljs.core._nth(params,(13));
var G__88280 = cljs.core._nth(params,(14));
var G__88281 = cljs.core._nth(params,(15));
var G__88282 = cljs.core._nth(params,(16));
var G__88283 = cljs.core._nth(params,(17));
var G__88284 = cljs.core._nth(params,(18));
var G__88285 = cljs.core._nth(params,(19));
return (function() { 
var sci$impl$fns$fun_$_arity_20__delegate = function (G__88245,G__88246,G__88247,G__88248,G__88249,G__88250,G__88251,G__88252,G__88253,G__88254,G__88255,G__88256,G__88257,G__88258,G__88259,G__88260,G__88261,G__88262,G__88263,G__88264,G__88265){
var invoc_array = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1(invoc_size);
if(cljs.core.truth_(enclosed__GT_invocation)){
(enclosed__GT_invocation.cljs$core$IFn$_invoke$arity$2 ? enclosed__GT_invocation.cljs$core$IFn$_invoke$arity$2(enclosed_array,invoc_array) : enclosed__GT_invocation.call(null,enclosed_array,invoc_array));
} else {
}

(invoc_array[(0)] = G__88245);

(invoc_array[(1)] = G__88246);

(invoc_array[(2)] = G__88247);

(invoc_array[(3)] = G__88248);

(invoc_array[(4)] = G__88249);

(invoc_array[(5)] = G__88250);

(invoc_array[(6)] = G__88251);

(invoc_array[(7)] = G__88252);

(invoc_array[(8)] = G__88253);

(invoc_array[(9)] = G__88254);

(invoc_array[(10)] = G__88255);

(invoc_array[(11)] = G__88256);

(invoc_array[(12)] = G__88257);

(invoc_array[(13)] = G__88258);

(invoc_array[(14)] = G__88259);

(invoc_array[(15)] = G__88260);

(invoc_array[(16)] = G__88261);

(invoc_array[(17)] = G__88262);

(invoc_array[(18)] = G__88263);

(invoc_array[(19)] = G__88264);

(invoc_array[vararg_idx] = G__88265);

while(true){
var ret__86496__auto__ = sci.impl.types.eval(body,ctx,invoc_array);
if(cljs.core.keyword_identical_QMARK_(new cljs.core.Keyword("sci.impl.analyzer","recur","sci.impl.analyzer/recur",2033369355),ret__86496__auto__)){
continue;
} else {
return ret__86496__auto__;
}
break;
}
};
var sci$impl$fns$fun_$_arity_20 = function (G__88245,G__88246,G__88247,G__88248,G__88249,G__88250,G__88251,G__88252,G__88253,G__88254,G__88255,G__88256,G__88257,G__88258,G__88259,G__88260,G__88261,G__88262,G__88263,G__88264,var_args){
var G__88265 = null;
if (arguments.length > 20) {
var G__88902__i = 0, G__88902__a = new Array(arguments.length -  20);
while (G__88902__i < G__88902__a.length) {G__88902__a[G__88902__i] = arguments[G__88902__i + 20]; ++G__88902__i;}
  G__88265 = new cljs.core.IndexedSeq(G__88902__a,0,null);
} 
return sci$impl$fns$fun_$_arity_20__delegate.call(this,G__88245,G__88246,G__88247,G__88248,G__88249,G__88250,G__88251,G__88252,G__88253,G__88254,G__88255,G__88256,G__88257,G__88258,G__88259,G__88260,G__88261,G__88262,G__88263,G__88264,G__88265);};
sci$impl$fns$fun_$_arity_20.cljs$lang$maxFixedArity = 20;
sci$impl$fns$fun_$_arity_20.cljs$lang$applyTo = (function (arglist__88903){
var G__88245 = cljs.core.first(arglist__88903);
arglist__88903 = cljs.core.next(arglist__88903);
var G__88246 = cljs.core.first(arglist__88903);
arglist__88903 = cljs.core.next(arglist__88903);
var G__88247 = cljs.core.first(arglist__88903);
arglist__88903 = cljs.core.next(arglist__88903);
var G__88248 = cljs.core.first(arglist__88903);
arglist__88903 = cljs.core.next(arglist__88903);
var G__88249 = cljs.core.first(arglist__88903);
arglist__88903 = cljs.core.next(arglist__88903);
var G__88250 = cljs.core.first(arglist__88903);
arglist__88903 = cljs.core.next(arglist__88903);
var G__88251 = cljs.core.first(arglist__88903);
arglist__88903 = cljs.core.next(arglist__88903);
var G__88252 = cljs.core.first(arglist__88903);
arglist__88903 = cljs.core.next(arglist__88903);
var G__88253 = cljs.core.first(arglist__88903);
arglist__88903 = cljs.core.next(arglist__88903);
var G__88254 = cljs.core.first(arglist__88903);
arglist__88903 = cljs.core.next(arglist__88903);
var G__88255 = cljs.core.first(arglist__88903);
arglist__88903 = cljs.core.next(arglist__88903);
var G__88256 = cljs.core.first(arglist__88903);
arglist__88903 = cljs.core.next(arglist__88903);
var G__88257 = cljs.core.first(arglist__88903);
arglist__88903 = cljs.core.next(arglist__88903);
var G__88258 = cljs.core.first(arglist__88903);
arglist__88903 = cljs.core.next(arglist__88903);
var G__88259 = cljs.core.first(arglist__88903);
arglist__88903 = cljs.core.next(arglist__88903);
var G__88260 = cljs.core.first(arglist__88903);
arglist__88903 = cljs.core.next(arglist__88903);
var G__88261 = cljs.core.first(arglist__88903);
arglist__88903 = cljs.core.next(arglist__88903);
var G__88262 = cljs.core.first(arglist__88903);
arglist__88903 = cljs.core.next(arglist__88903);
var G__88263 = cljs.core.first(arglist__88903);
arglist__88903 = cljs.core.next(arglist__88903);
var G__88264 = cljs.core.first(arglist__88903);
var G__88265 = cljs.core.rest(arglist__88903);
return sci$impl$fns$fun_$_arity_20__delegate(G__88245,G__88246,G__88247,G__88248,G__88249,G__88250,G__88251,G__88252,G__88253,G__88254,G__88255,G__88256,G__88257,G__88258,G__88259,G__88260,G__88261,G__88262,G__88263,G__88264,G__88265);
});
sci$impl$fns$fun_$_arity_20.cljs$core$IFn$_invoke$arity$variadic = sci$impl$fns$fun_$_arity_20__delegate;
return sci$impl$fns$fun_$_arity_20;
})()
;

break;
default:
throw (new Error(["No matching clause: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(G__87761)].join('')));

}
})():(function (){var G__88288 = (fixed_arity | (0));
switch (G__88288) {
case (0):
return (function sci$impl$fns$fun_$_arity_0(){
var invoc_array = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1(invoc_size);
if(cljs.core.truth_(enclosed__GT_invocation)){
(enclosed__GT_invocation.cljs$core$IFn$_invoke$arity$2 ? enclosed__GT_invocation.cljs$core$IFn$_invoke$arity$2(enclosed_array,invoc_array) : enclosed__GT_invocation.call(null,enclosed_array,invoc_array));
} else {
}

while(true){
var ret__86494__auto__ = sci.impl.types.eval(body,ctx,invoc_array);
if(cljs.core.keyword_identical_QMARK_(new cljs.core.Keyword("sci.impl.analyzer","recur","sci.impl.analyzer/recur",2033369355),ret__86494__auto__)){
continue;
} else {
return ret__86494__auto__;
}
break;
}
});

break;
case (1):
var G__88291 = cljs.core._nth(params,(0));
return (function sci$impl$fns$fun_$_arity_1(G__88290){
var invoc_array = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1(invoc_size);
if(cljs.core.truth_(enclosed__GT_invocation)){
(enclosed__GT_invocation.cljs$core$IFn$_invoke$arity$2 ? enclosed__GT_invocation.cljs$core$IFn$_invoke$arity$2(enclosed_array,invoc_array) : enclosed__GT_invocation.call(null,enclosed_array,invoc_array));
} else {
}

(invoc_array[(0)] = G__88290);

while(true){
var ret__86496__auto__ = sci.impl.types.eval(body,ctx,invoc_array);
if(cljs.core.keyword_identical_QMARK_(new cljs.core.Keyword("sci.impl.analyzer","recur","sci.impl.analyzer/recur",2033369355),ret__86496__auto__)){
continue;
} else {
return ret__86496__auto__;
}
break;
}
});

break;
case (2):
var G__88295 = cljs.core._nth(params,(0));
var G__88296 = cljs.core._nth(params,(1));
return (function sci$impl$fns$fun_$_arity_2(G__88293,G__88294){
var invoc_array = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1(invoc_size);
if(cljs.core.truth_(enclosed__GT_invocation)){
(enclosed__GT_invocation.cljs$core$IFn$_invoke$arity$2 ? enclosed__GT_invocation.cljs$core$IFn$_invoke$arity$2(enclosed_array,invoc_array) : enclosed__GT_invocation.call(null,enclosed_array,invoc_array));
} else {
}

(invoc_array[(0)] = G__88293);

(invoc_array[(1)] = G__88294);

while(true){
var ret__86496__auto__ = sci.impl.types.eval(body,ctx,invoc_array);
if(cljs.core.keyword_identical_QMARK_(new cljs.core.Keyword("sci.impl.analyzer","recur","sci.impl.analyzer/recur",2033369355),ret__86496__auto__)){
continue;
} else {
return ret__86496__auto__;
}
break;
}
});

break;
case (3):
var G__88301 = cljs.core._nth(params,(0));
var G__88302 = cljs.core._nth(params,(1));
var G__88303 = cljs.core._nth(params,(2));
return (function sci$impl$fns$fun_$_arity_3(G__88298,G__88299,G__88300){
var invoc_array = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1(invoc_size);
if(cljs.core.truth_(enclosed__GT_invocation)){
(enclosed__GT_invocation.cljs$core$IFn$_invoke$arity$2 ? enclosed__GT_invocation.cljs$core$IFn$_invoke$arity$2(enclosed_array,invoc_array) : enclosed__GT_invocation.call(null,enclosed_array,invoc_array));
} else {
}

(invoc_array[(0)] = G__88298);

(invoc_array[(1)] = G__88299);

(invoc_array[(2)] = G__88300);

while(true){
var ret__86496__auto__ = sci.impl.types.eval(body,ctx,invoc_array);
if(cljs.core.keyword_identical_QMARK_(new cljs.core.Keyword("sci.impl.analyzer","recur","sci.impl.analyzer/recur",2033369355),ret__86496__auto__)){
continue;
} else {
return ret__86496__auto__;
}
break;
}
});

break;
case (4):
var G__88309 = cljs.core._nth(params,(0));
var G__88310 = cljs.core._nth(params,(1));
var G__88311 = cljs.core._nth(params,(2));
var G__88312 = cljs.core._nth(params,(3));
return (function sci$impl$fns$fun_$_arity_4(G__88305,G__88306,G__88307,G__88308){
var invoc_array = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1(invoc_size);
if(cljs.core.truth_(enclosed__GT_invocation)){
(enclosed__GT_invocation.cljs$core$IFn$_invoke$arity$2 ? enclosed__GT_invocation.cljs$core$IFn$_invoke$arity$2(enclosed_array,invoc_array) : enclosed__GT_invocation.call(null,enclosed_array,invoc_array));
} else {
}

(invoc_array[(0)] = G__88305);

(invoc_array[(1)] = G__88306);

(invoc_array[(2)] = G__88307);

(invoc_array[(3)] = G__88308);

while(true){
var ret__86496__auto__ = sci.impl.types.eval(body,ctx,invoc_array);
if(cljs.core.keyword_identical_QMARK_(new cljs.core.Keyword("sci.impl.analyzer","recur","sci.impl.analyzer/recur",2033369355),ret__86496__auto__)){
continue;
} else {
return ret__86496__auto__;
}
break;
}
});

break;
case (5):
var G__88319 = cljs.core._nth(params,(0));
var G__88320 = cljs.core._nth(params,(1));
var G__88321 = cljs.core._nth(params,(2));
var G__88322 = cljs.core._nth(params,(3));
var G__88323 = cljs.core._nth(params,(4));
return (function sci$impl$fns$fun_$_arity_5(G__88314,G__88315,G__88316,G__88317,G__88318){
var invoc_array = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1(invoc_size);
if(cljs.core.truth_(enclosed__GT_invocation)){
(enclosed__GT_invocation.cljs$core$IFn$_invoke$arity$2 ? enclosed__GT_invocation.cljs$core$IFn$_invoke$arity$2(enclosed_array,invoc_array) : enclosed__GT_invocation.call(null,enclosed_array,invoc_array));
} else {
}

(invoc_array[(0)] = G__88314);

(invoc_array[(1)] = G__88315);

(invoc_array[(2)] = G__88316);

(invoc_array[(3)] = G__88317);

(invoc_array[(4)] = G__88318);

while(true){
var ret__86496__auto__ = sci.impl.types.eval(body,ctx,invoc_array);
if(cljs.core.keyword_identical_QMARK_(new cljs.core.Keyword("sci.impl.analyzer","recur","sci.impl.analyzer/recur",2033369355),ret__86496__auto__)){
continue;
} else {
return ret__86496__auto__;
}
break;
}
});

break;
case (6):
var G__88331 = cljs.core._nth(params,(0));
var G__88332 = cljs.core._nth(params,(1));
var G__88333 = cljs.core._nth(params,(2));
var G__88334 = cljs.core._nth(params,(3));
var G__88335 = cljs.core._nth(params,(4));
var G__88336 = cljs.core._nth(params,(5));
return (function sci$impl$fns$fun_$_arity_6(G__88325,G__88326,G__88327,G__88328,G__88329,G__88330){
var invoc_array = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1(invoc_size);
if(cljs.core.truth_(enclosed__GT_invocation)){
(enclosed__GT_invocation.cljs$core$IFn$_invoke$arity$2 ? enclosed__GT_invocation.cljs$core$IFn$_invoke$arity$2(enclosed_array,invoc_array) : enclosed__GT_invocation.call(null,enclosed_array,invoc_array));
} else {
}

(invoc_array[(0)] = G__88325);

(invoc_array[(1)] = G__88326);

(invoc_array[(2)] = G__88327);

(invoc_array[(3)] = G__88328);

(invoc_array[(4)] = G__88329);

(invoc_array[(5)] = G__88330);

while(true){
var ret__86496__auto__ = sci.impl.types.eval(body,ctx,invoc_array);
if(cljs.core.keyword_identical_QMARK_(new cljs.core.Keyword("sci.impl.analyzer","recur","sci.impl.analyzer/recur",2033369355),ret__86496__auto__)){
continue;
} else {
return ret__86496__auto__;
}
break;
}
});

break;
case (7):
var G__88345 = cljs.core._nth(params,(0));
var G__88346 = cljs.core._nth(params,(1));
var G__88347 = cljs.core._nth(params,(2));
var G__88348 = cljs.core._nth(params,(3));
var G__88349 = cljs.core._nth(params,(4));
var G__88350 = cljs.core._nth(params,(5));
var G__88351 = cljs.core._nth(params,(6));
return (function sci$impl$fns$fun_$_arity_7(G__88338,G__88339,G__88340,G__88341,G__88342,G__88343,G__88344){
var invoc_array = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1(invoc_size);
if(cljs.core.truth_(enclosed__GT_invocation)){
(enclosed__GT_invocation.cljs$core$IFn$_invoke$arity$2 ? enclosed__GT_invocation.cljs$core$IFn$_invoke$arity$2(enclosed_array,invoc_array) : enclosed__GT_invocation.call(null,enclosed_array,invoc_array));
} else {
}

(invoc_array[(0)] = G__88338);

(invoc_array[(1)] = G__88339);

(invoc_array[(2)] = G__88340);

(invoc_array[(3)] = G__88341);

(invoc_array[(4)] = G__88342);

(invoc_array[(5)] = G__88343);

(invoc_array[(6)] = G__88344);

while(true){
var ret__86496__auto__ = sci.impl.types.eval(body,ctx,invoc_array);
if(cljs.core.keyword_identical_QMARK_(new cljs.core.Keyword("sci.impl.analyzer","recur","sci.impl.analyzer/recur",2033369355),ret__86496__auto__)){
continue;
} else {
return ret__86496__auto__;
}
break;
}
});

break;
case (8):
var G__88361 = cljs.core._nth(params,(0));
var G__88362 = cljs.core._nth(params,(1));
var G__88363 = cljs.core._nth(params,(2));
var G__88364 = cljs.core._nth(params,(3));
var G__88365 = cljs.core._nth(params,(4));
var G__88366 = cljs.core._nth(params,(5));
var G__88367 = cljs.core._nth(params,(6));
var G__88368 = cljs.core._nth(params,(7));
return (function sci$impl$fns$fun_$_arity_8(G__88353,G__88354,G__88355,G__88356,G__88357,G__88358,G__88359,G__88360){
var invoc_array = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1(invoc_size);
if(cljs.core.truth_(enclosed__GT_invocation)){
(enclosed__GT_invocation.cljs$core$IFn$_invoke$arity$2 ? enclosed__GT_invocation.cljs$core$IFn$_invoke$arity$2(enclosed_array,invoc_array) : enclosed__GT_invocation.call(null,enclosed_array,invoc_array));
} else {
}

(invoc_array[(0)] = G__88353);

(invoc_array[(1)] = G__88354);

(invoc_array[(2)] = G__88355);

(invoc_array[(3)] = G__88356);

(invoc_array[(4)] = G__88357);

(invoc_array[(5)] = G__88358);

(invoc_array[(6)] = G__88359);

(invoc_array[(7)] = G__88360);

while(true){
var ret__86496__auto__ = sci.impl.types.eval(body,ctx,invoc_array);
if(cljs.core.keyword_identical_QMARK_(new cljs.core.Keyword("sci.impl.analyzer","recur","sci.impl.analyzer/recur",2033369355),ret__86496__auto__)){
continue;
} else {
return ret__86496__auto__;
}
break;
}
});

break;
case (9):
var G__88379 = cljs.core._nth(params,(0));
var G__88380 = cljs.core._nth(params,(1));
var G__88381 = cljs.core._nth(params,(2));
var G__88382 = cljs.core._nth(params,(3));
var G__88383 = cljs.core._nth(params,(4));
var G__88384 = cljs.core._nth(params,(5));
var G__88385 = cljs.core._nth(params,(6));
var G__88386 = cljs.core._nth(params,(7));
var G__88387 = cljs.core._nth(params,(8));
return (function sci$impl$fns$fun_$_arity_9(G__88370,G__88371,G__88372,G__88373,G__88374,G__88375,G__88376,G__88377,G__88378){
var invoc_array = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1(invoc_size);
if(cljs.core.truth_(enclosed__GT_invocation)){
(enclosed__GT_invocation.cljs$core$IFn$_invoke$arity$2 ? enclosed__GT_invocation.cljs$core$IFn$_invoke$arity$2(enclosed_array,invoc_array) : enclosed__GT_invocation.call(null,enclosed_array,invoc_array));
} else {
}

(invoc_array[(0)] = G__88370);

(invoc_array[(1)] = G__88371);

(invoc_array[(2)] = G__88372);

(invoc_array[(3)] = G__88373);

(invoc_array[(4)] = G__88374);

(invoc_array[(5)] = G__88375);

(invoc_array[(6)] = G__88376);

(invoc_array[(7)] = G__88377);

(invoc_array[(8)] = G__88378);

while(true){
var ret__86496__auto__ = sci.impl.types.eval(body,ctx,invoc_array);
if(cljs.core.keyword_identical_QMARK_(new cljs.core.Keyword("sci.impl.analyzer","recur","sci.impl.analyzer/recur",2033369355),ret__86496__auto__)){
continue;
} else {
return ret__86496__auto__;
}
break;
}
});

break;
case (10):
var G__88400 = cljs.core._nth(params,(0));
var G__88401 = cljs.core._nth(params,(1));
var G__88402 = cljs.core._nth(params,(2));
var G__88403 = cljs.core._nth(params,(3));
var G__88404 = cljs.core._nth(params,(4));
var G__88405 = cljs.core._nth(params,(5));
var G__88406 = cljs.core._nth(params,(6));
var G__88407 = cljs.core._nth(params,(7));
var G__88408 = cljs.core._nth(params,(8));
var G__88409 = cljs.core._nth(params,(9));
return (function sci$impl$fns$fun_$_arity_10(G__88390,G__88391,G__88392,G__88393,G__88394,G__88395,G__88396,G__88397,G__88398,G__88399){
var invoc_array = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1(invoc_size);
if(cljs.core.truth_(enclosed__GT_invocation)){
(enclosed__GT_invocation.cljs$core$IFn$_invoke$arity$2 ? enclosed__GT_invocation.cljs$core$IFn$_invoke$arity$2(enclosed_array,invoc_array) : enclosed__GT_invocation.call(null,enclosed_array,invoc_array));
} else {
}

(invoc_array[(0)] = G__88390);

(invoc_array[(1)] = G__88391);

(invoc_array[(2)] = G__88392);

(invoc_array[(3)] = G__88393);

(invoc_array[(4)] = G__88394);

(invoc_array[(5)] = G__88395);

(invoc_array[(6)] = G__88396);

(invoc_array[(7)] = G__88397);

(invoc_array[(8)] = G__88398);

(invoc_array[(9)] = G__88399);

while(true){
var ret__86496__auto__ = sci.impl.types.eval(body,ctx,invoc_array);
if(cljs.core.keyword_identical_QMARK_(new cljs.core.Keyword("sci.impl.analyzer","recur","sci.impl.analyzer/recur",2033369355),ret__86496__auto__)){
continue;
} else {
return ret__86496__auto__;
}
break;
}
});

break;
case (11):
var G__88423 = cljs.core._nth(params,(0));
var G__88424 = cljs.core._nth(params,(1));
var G__88425 = cljs.core._nth(params,(2));
var G__88426 = cljs.core._nth(params,(3));
var G__88427 = cljs.core._nth(params,(4));
var G__88428 = cljs.core._nth(params,(5));
var G__88429 = cljs.core._nth(params,(6));
var G__88430 = cljs.core._nth(params,(7));
var G__88431 = cljs.core._nth(params,(8));
var G__88432 = cljs.core._nth(params,(9));
var G__88433 = cljs.core._nth(params,(10));
return (function sci$impl$fns$fun_$_arity_11(G__88412,G__88413,G__88414,G__88415,G__88416,G__88417,G__88418,G__88419,G__88420,G__88421,G__88422){
var invoc_array = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1(invoc_size);
if(cljs.core.truth_(enclosed__GT_invocation)){
(enclosed__GT_invocation.cljs$core$IFn$_invoke$arity$2 ? enclosed__GT_invocation.cljs$core$IFn$_invoke$arity$2(enclosed_array,invoc_array) : enclosed__GT_invocation.call(null,enclosed_array,invoc_array));
} else {
}

(invoc_array[(0)] = G__88412);

(invoc_array[(1)] = G__88413);

(invoc_array[(2)] = G__88414);

(invoc_array[(3)] = G__88415);

(invoc_array[(4)] = G__88416);

(invoc_array[(5)] = G__88417);

(invoc_array[(6)] = G__88418);

(invoc_array[(7)] = G__88419);

(invoc_array[(8)] = G__88420);

(invoc_array[(9)] = G__88421);

(invoc_array[(10)] = G__88422);

while(true){
var ret__86496__auto__ = sci.impl.types.eval(body,ctx,invoc_array);
if(cljs.core.keyword_identical_QMARK_(new cljs.core.Keyword("sci.impl.analyzer","recur","sci.impl.analyzer/recur",2033369355),ret__86496__auto__)){
continue;
} else {
return ret__86496__auto__;
}
break;
}
});

break;
case (12):
var G__88447 = cljs.core._nth(params,(0));
var G__88448 = cljs.core._nth(params,(1));
var G__88449 = cljs.core._nth(params,(2));
var G__88450 = cljs.core._nth(params,(3));
var G__88451 = cljs.core._nth(params,(4));
var G__88452 = cljs.core._nth(params,(5));
var G__88453 = cljs.core._nth(params,(6));
var G__88454 = cljs.core._nth(params,(7));
var G__88455 = cljs.core._nth(params,(8));
var G__88456 = cljs.core._nth(params,(9));
var G__88457 = cljs.core._nth(params,(10));
var G__88458 = cljs.core._nth(params,(11));
return (function sci$impl$fns$fun_$_arity_12(G__88435,G__88436,G__88437,G__88438,G__88439,G__88440,G__88441,G__88442,G__88443,G__88444,G__88445,G__88446){
var invoc_array = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1(invoc_size);
if(cljs.core.truth_(enclosed__GT_invocation)){
(enclosed__GT_invocation.cljs$core$IFn$_invoke$arity$2 ? enclosed__GT_invocation.cljs$core$IFn$_invoke$arity$2(enclosed_array,invoc_array) : enclosed__GT_invocation.call(null,enclosed_array,invoc_array));
} else {
}

(invoc_array[(0)] = G__88435);

(invoc_array[(1)] = G__88436);

(invoc_array[(2)] = G__88437);

(invoc_array[(3)] = G__88438);

(invoc_array[(4)] = G__88439);

(invoc_array[(5)] = G__88440);

(invoc_array[(6)] = G__88441);

(invoc_array[(7)] = G__88442);

(invoc_array[(8)] = G__88443);

(invoc_array[(9)] = G__88444);

(invoc_array[(10)] = G__88445);

(invoc_array[(11)] = G__88446);

while(true){
var ret__86496__auto__ = sci.impl.types.eval(body,ctx,invoc_array);
if(cljs.core.keyword_identical_QMARK_(new cljs.core.Keyword("sci.impl.analyzer","recur","sci.impl.analyzer/recur",2033369355),ret__86496__auto__)){
continue;
} else {
return ret__86496__auto__;
}
break;
}
});

break;
case (13):
var G__88474 = cljs.core._nth(params,(0));
var G__88475 = cljs.core._nth(params,(1));
var G__88476 = cljs.core._nth(params,(2));
var G__88477 = cljs.core._nth(params,(3));
var G__88478 = cljs.core._nth(params,(4));
var G__88479 = cljs.core._nth(params,(5));
var G__88480 = cljs.core._nth(params,(6));
var G__88481 = cljs.core._nth(params,(7));
var G__88482 = cljs.core._nth(params,(8));
var G__88483 = cljs.core._nth(params,(9));
var G__88484 = cljs.core._nth(params,(10));
var G__88485 = cljs.core._nth(params,(11));
var G__88486 = cljs.core._nth(params,(12));
return (function sci$impl$fns$fun_$_arity_13(G__88461,G__88462,G__88463,G__88464,G__88465,G__88466,G__88467,G__88468,G__88469,G__88470,G__88471,G__88472,G__88473){
var invoc_array = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1(invoc_size);
if(cljs.core.truth_(enclosed__GT_invocation)){
(enclosed__GT_invocation.cljs$core$IFn$_invoke$arity$2 ? enclosed__GT_invocation.cljs$core$IFn$_invoke$arity$2(enclosed_array,invoc_array) : enclosed__GT_invocation.call(null,enclosed_array,invoc_array));
} else {
}

(invoc_array[(0)] = G__88461);

(invoc_array[(1)] = G__88462);

(invoc_array[(2)] = G__88463);

(invoc_array[(3)] = G__88464);

(invoc_array[(4)] = G__88465);

(invoc_array[(5)] = G__88466);

(invoc_array[(6)] = G__88467);

(invoc_array[(7)] = G__88468);

(invoc_array[(8)] = G__88469);

(invoc_array[(9)] = G__88470);

(invoc_array[(10)] = G__88471);

(invoc_array[(11)] = G__88472);

(invoc_array[(12)] = G__88473);

while(true){
var ret__86496__auto__ = sci.impl.types.eval(body,ctx,invoc_array);
if(cljs.core.keyword_identical_QMARK_(new cljs.core.Keyword("sci.impl.analyzer","recur","sci.impl.analyzer/recur",2033369355),ret__86496__auto__)){
continue;
} else {
return ret__86496__auto__;
}
break;
}
});

break;
case (14):
var G__88503 = cljs.core._nth(params,(0));
var G__88504 = cljs.core._nth(params,(1));
var G__88505 = cljs.core._nth(params,(2));
var G__88506 = cljs.core._nth(params,(3));
var G__88507 = cljs.core._nth(params,(4));
var G__88508 = cljs.core._nth(params,(5));
var G__88509 = cljs.core._nth(params,(6));
var G__88510 = cljs.core._nth(params,(7));
var G__88511 = cljs.core._nth(params,(8));
var G__88512 = cljs.core._nth(params,(9));
var G__88513 = cljs.core._nth(params,(10));
var G__88514 = cljs.core._nth(params,(11));
var G__88515 = cljs.core._nth(params,(12));
var G__88516 = cljs.core._nth(params,(13));
return (function sci$impl$fns$fun_$_arity_14(G__88489,G__88490,G__88491,G__88492,G__88493,G__88494,G__88495,G__88496,G__88497,G__88498,G__88499,G__88500,G__88501,G__88502){
var invoc_array = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1(invoc_size);
if(cljs.core.truth_(enclosed__GT_invocation)){
(enclosed__GT_invocation.cljs$core$IFn$_invoke$arity$2 ? enclosed__GT_invocation.cljs$core$IFn$_invoke$arity$2(enclosed_array,invoc_array) : enclosed__GT_invocation.call(null,enclosed_array,invoc_array));
} else {
}

(invoc_array[(0)] = G__88489);

(invoc_array[(1)] = G__88490);

(invoc_array[(2)] = G__88491);

(invoc_array[(3)] = G__88492);

(invoc_array[(4)] = G__88493);

(invoc_array[(5)] = G__88494);

(invoc_array[(6)] = G__88495);

(invoc_array[(7)] = G__88496);

(invoc_array[(8)] = G__88497);

(invoc_array[(9)] = G__88498);

(invoc_array[(10)] = G__88499);

(invoc_array[(11)] = G__88500);

(invoc_array[(12)] = G__88501);

(invoc_array[(13)] = G__88502);

while(true){
var ret__86496__auto__ = sci.impl.types.eval(body,ctx,invoc_array);
if(cljs.core.keyword_identical_QMARK_(new cljs.core.Keyword("sci.impl.analyzer","recur","sci.impl.analyzer/recur",2033369355),ret__86496__auto__)){
continue;
} else {
return ret__86496__auto__;
}
break;
}
});

break;
case (15):
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
return (function sci$impl$fns$fun_$_arity_15(G__88519,G__88520,G__88521,G__88522,G__88523,G__88524,G__88525,G__88526,G__88527,G__88528,G__88529,G__88530,G__88531,G__88532,G__88533){
var invoc_array = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1(invoc_size);
if(cljs.core.truth_(enclosed__GT_invocation)){
(enclosed__GT_invocation.cljs$core$IFn$_invoke$arity$2 ? enclosed__GT_invocation.cljs$core$IFn$_invoke$arity$2(enclosed_array,invoc_array) : enclosed__GT_invocation.call(null,enclosed_array,invoc_array));
} else {
}

(invoc_array[(0)] = G__88519);

(invoc_array[(1)] = G__88520);

(invoc_array[(2)] = G__88521);

(invoc_array[(3)] = G__88522);

(invoc_array[(4)] = G__88523);

(invoc_array[(5)] = G__88524);

(invoc_array[(6)] = G__88525);

(invoc_array[(7)] = G__88526);

(invoc_array[(8)] = G__88527);

(invoc_array[(9)] = G__88528);

(invoc_array[(10)] = G__88529);

(invoc_array[(11)] = G__88530);

(invoc_array[(12)] = G__88531);

(invoc_array[(13)] = G__88532);

(invoc_array[(14)] = G__88533);

while(true){
var ret__86496__auto__ = sci.impl.types.eval(body,ctx,invoc_array);
if(cljs.core.keyword_identical_QMARK_(new cljs.core.Keyword("sci.impl.analyzer","recur","sci.impl.analyzer/recur",2033369355),ret__86496__auto__)){
continue;
} else {
return ret__86496__auto__;
}
break;
}
});

break;
case (16):
var G__88567 = cljs.core._nth(params,(0));
var G__88568 = cljs.core._nth(params,(1));
var G__88569 = cljs.core._nth(params,(2));
var G__88570 = cljs.core._nth(params,(3));
var G__88571 = cljs.core._nth(params,(4));
var G__88572 = cljs.core._nth(params,(5));
var G__88573 = cljs.core._nth(params,(6));
var G__88574 = cljs.core._nth(params,(7));
var G__88575 = cljs.core._nth(params,(8));
var G__88576 = cljs.core._nth(params,(9));
var G__88577 = cljs.core._nth(params,(10));
var G__88578 = cljs.core._nth(params,(11));
var G__88579 = cljs.core._nth(params,(12));
var G__88580 = cljs.core._nth(params,(13));
var G__88581 = cljs.core._nth(params,(14));
var G__88582 = cljs.core._nth(params,(15));
return (function sci$impl$fns$fun_$_arity_16(G__88551,G__88552,G__88553,G__88554,G__88555,G__88556,G__88557,G__88558,G__88559,G__88560,G__88561,G__88562,G__88563,G__88564,G__88565,G__88566){
var invoc_array = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1(invoc_size);
if(cljs.core.truth_(enclosed__GT_invocation)){
(enclosed__GT_invocation.cljs$core$IFn$_invoke$arity$2 ? enclosed__GT_invocation.cljs$core$IFn$_invoke$arity$2(enclosed_array,invoc_array) : enclosed__GT_invocation.call(null,enclosed_array,invoc_array));
} else {
}

(invoc_array[(0)] = G__88551);

(invoc_array[(1)] = G__88552);

(invoc_array[(2)] = G__88553);

(invoc_array[(3)] = G__88554);

(invoc_array[(4)] = G__88555);

(invoc_array[(5)] = G__88556);

(invoc_array[(6)] = G__88557);

(invoc_array[(7)] = G__88558);

(invoc_array[(8)] = G__88559);

(invoc_array[(9)] = G__88560);

(invoc_array[(10)] = G__88561);

(invoc_array[(11)] = G__88562);

(invoc_array[(12)] = G__88563);

(invoc_array[(13)] = G__88564);

(invoc_array[(14)] = G__88565);

(invoc_array[(15)] = G__88566);

while(true){
var ret__86496__auto__ = sci.impl.types.eval(body,ctx,invoc_array);
if(cljs.core.keyword_identical_QMARK_(new cljs.core.Keyword("sci.impl.analyzer","recur","sci.impl.analyzer/recur",2033369355),ret__86496__auto__)){
continue;
} else {
return ret__86496__auto__;
}
break;
}
});

break;
case (17):
var G__88607 = cljs.core._nth(params,(0));
var G__88608 = cljs.core._nth(params,(1));
var G__88609 = cljs.core._nth(params,(2));
var G__88610 = cljs.core._nth(params,(3));
var G__88611 = cljs.core._nth(params,(4));
var G__88612 = cljs.core._nth(params,(5));
var G__88613 = cljs.core._nth(params,(6));
var G__88614 = cljs.core._nth(params,(7));
var G__88615 = cljs.core._nth(params,(8));
var G__88616 = cljs.core._nth(params,(9));
var G__88617 = cljs.core._nth(params,(10));
var G__88618 = cljs.core._nth(params,(11));
var G__88619 = cljs.core._nth(params,(12));
var G__88620 = cljs.core._nth(params,(13));
var G__88621 = cljs.core._nth(params,(14));
var G__88622 = cljs.core._nth(params,(15));
var G__88623 = cljs.core._nth(params,(16));
return (function sci$impl$fns$fun_$_arity_17(G__88590,G__88591,G__88592,G__88593,G__88594,G__88595,G__88596,G__88597,G__88598,G__88599,G__88600,G__88601,G__88602,G__88603,G__88604,G__88605,G__88606){
var invoc_array = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1(invoc_size);
if(cljs.core.truth_(enclosed__GT_invocation)){
(enclosed__GT_invocation.cljs$core$IFn$_invoke$arity$2 ? enclosed__GT_invocation.cljs$core$IFn$_invoke$arity$2(enclosed_array,invoc_array) : enclosed__GT_invocation.call(null,enclosed_array,invoc_array));
} else {
}

(invoc_array[(0)] = G__88590);

(invoc_array[(1)] = G__88591);

(invoc_array[(2)] = G__88592);

(invoc_array[(3)] = G__88593);

(invoc_array[(4)] = G__88594);

(invoc_array[(5)] = G__88595);

(invoc_array[(6)] = G__88596);

(invoc_array[(7)] = G__88597);

(invoc_array[(8)] = G__88598);

(invoc_array[(9)] = G__88599);

(invoc_array[(10)] = G__88600);

(invoc_array[(11)] = G__88601);

(invoc_array[(12)] = G__88602);

(invoc_array[(13)] = G__88603);

(invoc_array[(14)] = G__88604);

(invoc_array[(15)] = G__88605);

(invoc_array[(16)] = G__88606);

while(true){
var ret__86496__auto__ = sci.impl.types.eval(body,ctx,invoc_array);
if(cljs.core.keyword_identical_QMARK_(new cljs.core.Keyword("sci.impl.analyzer","recur","sci.impl.analyzer/recur",2033369355),ret__86496__auto__)){
continue;
} else {
return ret__86496__auto__;
}
break;
}
});

break;
case (18):
var G__88650 = cljs.core._nth(params,(0));
var G__88651 = cljs.core._nth(params,(1));
var G__88652 = cljs.core._nth(params,(2));
var G__88653 = cljs.core._nth(params,(3));
var G__88654 = cljs.core._nth(params,(4));
var G__88655 = cljs.core._nth(params,(5));
var G__88656 = cljs.core._nth(params,(6));
var G__88657 = cljs.core._nth(params,(7));
var G__88658 = cljs.core._nth(params,(8));
var G__88659 = cljs.core._nth(params,(9));
var G__88660 = cljs.core._nth(params,(10));
var G__88661 = cljs.core._nth(params,(11));
var G__88662 = cljs.core._nth(params,(12));
var G__88663 = cljs.core._nth(params,(13));
var G__88664 = cljs.core._nth(params,(14));
var G__88665 = cljs.core._nth(params,(15));
var G__88666 = cljs.core._nth(params,(16));
var G__88667 = cljs.core._nth(params,(17));
return (function sci$impl$fns$fun_$_arity_18(G__88632,G__88633,G__88634,G__88635,G__88636,G__88637,G__88638,G__88639,G__88640,G__88641,G__88642,G__88643,G__88644,G__88645,G__88646,G__88647,G__88648,G__88649){
var invoc_array = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1(invoc_size);
if(cljs.core.truth_(enclosed__GT_invocation)){
(enclosed__GT_invocation.cljs$core$IFn$_invoke$arity$2 ? enclosed__GT_invocation.cljs$core$IFn$_invoke$arity$2(enclosed_array,invoc_array) : enclosed__GT_invocation.call(null,enclosed_array,invoc_array));
} else {
}

(invoc_array[(0)] = G__88632);

(invoc_array[(1)] = G__88633);

(invoc_array[(2)] = G__88634);

(invoc_array[(3)] = G__88635);

(invoc_array[(4)] = G__88636);

(invoc_array[(5)] = G__88637);

(invoc_array[(6)] = G__88638);

(invoc_array[(7)] = G__88639);

(invoc_array[(8)] = G__88640);

(invoc_array[(9)] = G__88641);

(invoc_array[(10)] = G__88642);

(invoc_array[(11)] = G__88643);

(invoc_array[(12)] = G__88644);

(invoc_array[(13)] = G__88645);

(invoc_array[(14)] = G__88646);

(invoc_array[(15)] = G__88647);

(invoc_array[(16)] = G__88648);

(invoc_array[(17)] = G__88649);

while(true){
var ret__86496__auto__ = sci.impl.types.eval(body,ctx,invoc_array);
if(cljs.core.keyword_identical_QMARK_(new cljs.core.Keyword("sci.impl.analyzer","recur","sci.impl.analyzer/recur",2033369355),ret__86496__auto__)){
continue;
} else {
return ret__86496__auto__;
}
break;
}
});

break;
case (19):
var G__88689 = cljs.core._nth(params,(0));
var G__88690 = cljs.core._nth(params,(1));
var G__88691 = cljs.core._nth(params,(2));
var G__88692 = cljs.core._nth(params,(3));
var G__88693 = cljs.core._nth(params,(4));
var G__88694 = cljs.core._nth(params,(5));
var G__88695 = cljs.core._nth(params,(6));
var G__88696 = cljs.core._nth(params,(7));
var G__88697 = cljs.core._nth(params,(8));
var G__88698 = cljs.core._nth(params,(9));
var G__88699 = cljs.core._nth(params,(10));
var G__88700 = cljs.core._nth(params,(11));
var G__88701 = cljs.core._nth(params,(12));
var G__88702 = cljs.core._nth(params,(13));
var G__88703 = cljs.core._nth(params,(14));
var G__88704 = cljs.core._nth(params,(15));
var G__88705 = cljs.core._nth(params,(16));
var G__88706 = cljs.core._nth(params,(17));
var G__88707 = cljs.core._nth(params,(18));
return (function sci$impl$fns$fun_$_arity_19(G__88670,G__88671,G__88672,G__88673,G__88674,G__88675,G__88676,G__88677,G__88678,G__88679,G__88680,G__88681,G__88682,G__88683,G__88684,G__88685,G__88686,G__88687,G__88688){
var invoc_array = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1(invoc_size);
if(cljs.core.truth_(enclosed__GT_invocation)){
(enclosed__GT_invocation.cljs$core$IFn$_invoke$arity$2 ? enclosed__GT_invocation.cljs$core$IFn$_invoke$arity$2(enclosed_array,invoc_array) : enclosed__GT_invocation.call(null,enclosed_array,invoc_array));
} else {
}

(invoc_array[(0)] = G__88670);

(invoc_array[(1)] = G__88671);

(invoc_array[(2)] = G__88672);

(invoc_array[(3)] = G__88673);

(invoc_array[(4)] = G__88674);

(invoc_array[(5)] = G__88675);

(invoc_array[(6)] = G__88676);

(invoc_array[(7)] = G__88677);

(invoc_array[(8)] = G__88678);

(invoc_array[(9)] = G__88679);

(invoc_array[(10)] = G__88680);

(invoc_array[(11)] = G__88681);

(invoc_array[(12)] = G__88682);

(invoc_array[(13)] = G__88683);

(invoc_array[(14)] = G__88684);

(invoc_array[(15)] = G__88685);

(invoc_array[(16)] = G__88686);

(invoc_array[(17)] = G__88687);

(invoc_array[(18)] = G__88688);

while(true){
var ret__86496__auto__ = sci.impl.types.eval(body,ctx,invoc_array);
if(cljs.core.keyword_identical_QMARK_(new cljs.core.Keyword("sci.impl.analyzer","recur","sci.impl.analyzer/recur",2033369355),ret__86496__auto__)){
continue;
} else {
return ret__86496__auto__;
}
break;
}
});

break;
case (20):
var G__88738 = cljs.core._nth(params,(0));
var G__88740 = cljs.core._nth(params,(1));
var G__88741 = cljs.core._nth(params,(2));
var G__88742 = cljs.core._nth(params,(3));
var G__88743 = cljs.core._nth(params,(4));
var G__88744 = cljs.core._nth(params,(5));
var G__88745 = cljs.core._nth(params,(6));
var G__88746 = cljs.core._nth(params,(7));
var G__88747 = cljs.core._nth(params,(8));
var G__88748 = cljs.core._nth(params,(9));
var G__88749 = cljs.core._nth(params,(10));
var G__88750 = cljs.core._nth(params,(11));
var G__88751 = cljs.core._nth(params,(12));
var G__88752 = cljs.core._nth(params,(13));
var G__88753 = cljs.core._nth(params,(14));
var G__88754 = cljs.core._nth(params,(15));
var G__88755 = cljs.core._nth(params,(16));
var G__88756 = cljs.core._nth(params,(17));
var G__88757 = cljs.core._nth(params,(18));
var G__88758 = cljs.core._nth(params,(19));
return (function sci$impl$fns$fun_$_arity_20(G__88718,G__88719,G__88720,G__88721,G__88722,G__88723,G__88724,G__88725,G__88726,G__88727,G__88728,G__88729,G__88730,G__88731,G__88732,G__88733,G__88734,G__88735,G__88736,G__88737){
var invoc_array = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1(invoc_size);
if(cljs.core.truth_(enclosed__GT_invocation)){
(enclosed__GT_invocation.cljs$core$IFn$_invoke$arity$2 ? enclosed__GT_invocation.cljs$core$IFn$_invoke$arity$2(enclosed_array,invoc_array) : enclosed__GT_invocation.call(null,enclosed_array,invoc_array));
} else {
}

(invoc_array[(0)] = G__88718);

(invoc_array[(1)] = G__88719);

(invoc_array[(2)] = G__88720);

(invoc_array[(3)] = G__88721);

(invoc_array[(4)] = G__88722);

(invoc_array[(5)] = G__88723);

(invoc_array[(6)] = G__88724);

(invoc_array[(7)] = G__88725);

(invoc_array[(8)] = G__88726);

(invoc_array[(9)] = G__88727);

(invoc_array[(10)] = G__88728);

(invoc_array[(11)] = G__88729);

(invoc_array[(12)] = G__88730);

(invoc_array[(13)] = G__88731);

(invoc_array[(14)] = G__88732);

(invoc_array[(15)] = G__88733);

(invoc_array[(16)] = G__88734);

(invoc_array[(17)] = G__88735);

(invoc_array[(18)] = G__88736);

(invoc_array[(19)] = G__88737);

while(true){
var ret__86496__auto__ = sci.impl.types.eval(body,ctx,invoc_array);
if(cljs.core.keyword_identical_QMARK_(new cljs.core.Keyword("sci.impl.analyzer","recur","sci.impl.analyzer/recur",2033369355),ret__86496__auto__)){
continue;
} else {
return ret__86496__auto__;
}
break;
}
});

break;
default:
throw (new Error(["No matching clause: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(G__88288)].join('')));

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
var G__88925__delegate = function (args){
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
var G__88925 = function (var_args){
var args = null;
if (arguments.length > 0) {
var G__88926__i = 0, G__88926__a = new Array(arguments.length -  0);
while (G__88926__i < G__88926__a.length) {G__88926__a[G__88926__i] = arguments[G__88926__i + 0]; ++G__88926__i;}
  args = new cljs.core.IndexedSeq(G__88926__a,0,null);
} 
return G__88925__delegate.call(this,args);};
G__88925.cljs$lang$maxFixedArity = 0;
G__88925.cljs$lang$applyTo = (function (arglist__88927){
var args = cljs.core.seq(arglist__88927);
return G__88925__delegate(args);
});
G__88925.cljs$core$IFn$_invoke$arity$variadic = G__88925__delegate;
return G__88925;
})()
;
})());
var f__$1 = (cljs.core.truth_(macro_QMARK_)?cljs.core.vary_meta.cljs$core$IFn$_invoke$arity$2(f,(function (p1__88788_SHARP_){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(p1__88788_SHARP_,new cljs.core.Keyword("sci","macro","sci/macro",-868536151),macro_QMARK_,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("sci.impl","inner-fn","sci.impl/inner-fn",1663302998),f], 0));
})):f);
if(cljs.core.truth_(self_ref_QMARK_)){
(enclosed_array[(cljs.core.count(enclosed_array) - (1))] = f__$1);
} else {
}

return f__$1;
});
cljs.core.vreset_BANG_(sci.impl.utils.eval_fn,sci.impl.fns.eval_fn);

//# sourceMappingURL=sci.impl.fns.js.map
