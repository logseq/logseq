goog.provide('sci.impl.core_protocols');
if((typeof sci !== 'undefined') && (typeof sci.impl !== 'undefined') && (typeof sci.impl.core_protocols !== 'undefined') && (typeof sci.impl.core_protocols._deref !== 'undefined')){
} else {
sci.impl.core_protocols._deref = (function (){var method_table__5599__auto__ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
var prefer_table__5600__auto__ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
var method_cache__5601__auto__ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
var cached_hierarchy__5602__auto__ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
var hierarchy__5603__auto__ = cljs.core.get.cljs$core$IFn$_invoke$arity$3(cljs.core.PersistentArrayMap.EMPTY,new cljs.core.Keyword(null,"hierarchy","hierarchy",-1053470341),(function (){var fexpr__78881 = cljs.core.get_global_hierarchy;
return (fexpr__78881.cljs$core$IFn$_invoke$arity$0 ? fexpr__78881.cljs$core$IFn$_invoke$arity$0() : fexpr__78881.call(null));
})());
return (new cljs.core.MultiFn(cljs.core.symbol.cljs$core$IFn$_invoke$arity$2("sci.impl.core-protocols","-deref"),sci.impl.types.type_impl,new cljs.core.Keyword(null,"default","default",-1987822328),hierarchy__5603__auto__,method_table__5599__auto__,prefer_table__5600__auto__,method_cache__5601__auto__,cached_hierarchy__5602__auto__));
})();
}
sci.impl.core_protocols._deref.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("sci.impl.protocols","reified","sci.impl.protocols/reified",-2019939396),(function (ref){
var methods$ = sci.impl.types.getMethods(ref);
var fexpr__78885 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(methods$,new cljs.core.Symbol(null,"-deref","-deref",-283116853,null));
return (fexpr__78885.cljs$core$IFn$_invoke$arity$1 ? fexpr__78885.cljs$core$IFn$_invoke$arity$1(ref) : fexpr__78885.call(null,ref));
}));
sci.impl.core_protocols.ideref_default = sci.impl.core_protocols._deref.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"default","default",-1987822328),(function (ref){
return cljs.core.deref(ref);
}));
sci.impl.core_protocols.deref_STAR_ = (function sci$impl$core_protocols$deref_STAR_(x){
return sci.impl.core_protocols._deref.cljs$core$IFn$_invoke$arity$1(x);
});
sci.impl.core_protocols.cljs_core_ns = sci.impl.vars.__GT_SciNamespace(new cljs.core.Symbol(null,"cljs.core","cljs.core",770546058,null),null);
sci.impl.core_protocols.deref_protocol = sci.impl.vars.new_var.cljs$core$IFn$_invoke$arity$3(new cljs.core.Symbol(null,"cljs.core.IDeref","cljs.core.IDeref",-783543206,null),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"protocol","protocol",652470118),cljs.core.IDeref,new cljs.core.Keyword(null,"methods","methods",453930866),cljs.core.PersistentHashSet.createAsIfByAssoc([sci.impl.core_protocols._deref]),new cljs.core.Keyword(null,"ns","ns",441598760),sci.impl.core_protocols.cljs_core_ns], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"ns","ns",441598760),sci.impl.core_protocols.cljs_core_ns], null));
if((typeof sci !== 'undefined') && (typeof sci.impl !== 'undefined') && (typeof sci.impl.core_protocols !== 'undefined') && (typeof sci.impl.core_protocols._swap_BANG_ !== 'undefined')){
} else {
sci.impl.core_protocols._swap_BANG_ = (function (){var method_table__5599__auto__ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
var prefer_table__5600__auto__ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
var method_cache__5601__auto__ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
var cached_hierarchy__5602__auto__ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
var hierarchy__5603__auto__ = cljs.core.get.cljs$core$IFn$_invoke$arity$3(cljs.core.PersistentArrayMap.EMPTY,new cljs.core.Keyword(null,"hierarchy","hierarchy",-1053470341),(function (){var fexpr__78894 = cljs.core.get_global_hierarchy;
return (fexpr__78894.cljs$core$IFn$_invoke$arity$0 ? fexpr__78894.cljs$core$IFn$_invoke$arity$0() : fexpr__78894.call(null));
})());
return (new cljs.core.MultiFn(cljs.core.symbol.cljs$core$IFn$_invoke$arity$2("sci.impl.core-protocols","-swap!"),sci.impl.types.type_impl,new cljs.core.Keyword(null,"default","default",-1987822328),hierarchy__5603__auto__,method_table__5599__auto__,prefer_table__5600__auto__,method_cache__5601__auto__,cached_hierarchy__5602__auto__));
})();
}
if((typeof sci !== 'undefined') && (typeof sci.impl !== 'undefined') && (typeof sci.impl.core_protocols !== 'undefined') && (typeof sci.impl.core_protocols._reset_BANG_ !== 'undefined')){
} else {
sci.impl.core_protocols._reset_BANG_ = (function (){var method_table__5599__auto__ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
var prefer_table__5600__auto__ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
var method_cache__5601__auto__ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
var cached_hierarchy__5602__auto__ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
var hierarchy__5603__auto__ = cljs.core.get.cljs$core$IFn$_invoke$arity$3(cljs.core.PersistentArrayMap.EMPTY,new cljs.core.Keyword(null,"hierarchy","hierarchy",-1053470341),(function (){var fexpr__78895 = cljs.core.get_global_hierarchy;
return (fexpr__78895.cljs$core$IFn$_invoke$arity$0 ? fexpr__78895.cljs$core$IFn$_invoke$arity$0() : fexpr__78895.call(null));
})());
return (new cljs.core.MultiFn(cljs.core.symbol.cljs$core$IFn$_invoke$arity$2("sci.impl.core-protocols","-reset!"),sci.impl.types.type_impl,new cljs.core.Keyword(null,"default","default",-1987822328),hierarchy__5603__auto__,method_table__5599__auto__,prefer_table__5600__auto__,method_cache__5601__auto__,cached_hierarchy__5602__auto__));
})();
}
sci.impl.core_protocols._swap_BANG_.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("sci.impl.protocols","reified","sci.impl.protocols/reified",-2019939396),(function() {
var G__78909 = null;
var G__78909__2 = (function (ref,f){
var methods$ = sci.impl.types.getMethods(ref);
var fexpr__78896 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(methods$,new cljs.core.Symbol(null,"-swap!","-swap!",-535359318,null));
return (fexpr__78896.cljs$core$IFn$_invoke$arity$2 ? fexpr__78896.cljs$core$IFn$_invoke$arity$2(ref,f) : fexpr__78896.call(null,ref,f));
});
var G__78909__3 = (function (ref,f,a1){
var methods$ = sci.impl.types.getMethods(ref);
var fexpr__78897 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(methods$,new cljs.core.Symbol(null,"-swap!","-swap!",-535359318,null));
return (fexpr__78897.cljs$core$IFn$_invoke$arity$3 ? fexpr__78897.cljs$core$IFn$_invoke$arity$3(ref,f,a1) : fexpr__78897.call(null,ref,f,a1));
});
var G__78909__4 = (function (ref,f,a1,a2){
var methods$ = sci.impl.types.getMethods(ref);
var fexpr__78898 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(methods$,new cljs.core.Symbol(null,"-swap!","-swap!",-535359318,null));
return (fexpr__78898.cljs$core$IFn$_invoke$arity$4 ? fexpr__78898.cljs$core$IFn$_invoke$arity$4(ref,f,a1,a2) : fexpr__78898.call(null,ref,f,a1,a2));
});
var G__78909__5 = (function() { 
var G__78914__delegate = function (ref,f,a1,a2,args){
var methods$ = sci.impl.types.getMethods(ref);
return cljs.core.apply.cljs$core$IFn$_invoke$arity$variadic(cljs.core.get.cljs$core$IFn$_invoke$arity$2(methods$,new cljs.core.Symbol(null,"-swap!","-swap!",-535359318,null)),ref,f,a1,a2,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([args], 0));
};
var G__78914 = function (ref,f,a1,a2,var_args){
var args = null;
if (arguments.length > 4) {
var G__78915__i = 0, G__78915__a = new Array(arguments.length -  4);
while (G__78915__i < G__78915__a.length) {G__78915__a[G__78915__i] = arguments[G__78915__i + 4]; ++G__78915__i;}
  args = new cljs.core.IndexedSeq(G__78915__a,0,null);
} 
return G__78914__delegate.call(this,ref,f,a1,a2,args);};
G__78914.cljs$lang$maxFixedArity = 4;
G__78914.cljs$lang$applyTo = (function (arglist__78916){
var ref = cljs.core.first(arglist__78916);
arglist__78916 = cljs.core.next(arglist__78916);
var f = cljs.core.first(arglist__78916);
arglist__78916 = cljs.core.next(arglist__78916);
var a1 = cljs.core.first(arglist__78916);
arglist__78916 = cljs.core.next(arglist__78916);
var a2 = cljs.core.first(arglist__78916);
var args = cljs.core.rest(arglist__78916);
return G__78914__delegate(ref,f,a1,a2,args);
});
G__78914.cljs$core$IFn$_invoke$arity$variadic = G__78914__delegate;
return G__78914;
})()
;
G__78909 = function(ref,f,a1,a2,var_args){
var args = var_args;
switch(arguments.length){
case 2:
return G__78909__2.call(this,ref,f);
case 3:
return G__78909__3.call(this,ref,f,a1);
case 4:
return G__78909__4.call(this,ref,f,a1,a2);
default:
var G__78917 = null;
if (arguments.length > 4) {
var G__78918__i = 0, G__78918__a = new Array(arguments.length -  4);
while (G__78918__i < G__78918__a.length) {G__78918__a[G__78918__i] = arguments[G__78918__i + 4]; ++G__78918__i;}
G__78917 = new cljs.core.IndexedSeq(G__78918__a,0,null);
}
return G__78909__5.cljs$core$IFn$_invoke$arity$variadic(ref,f,a1,a2, G__78917);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
G__78909.cljs$lang$maxFixedArity = 4;
G__78909.cljs$lang$applyTo = G__78909__5.cljs$lang$applyTo;
G__78909.cljs$core$IFn$_invoke$arity$2 = G__78909__2;
G__78909.cljs$core$IFn$_invoke$arity$3 = G__78909__3;
G__78909.cljs$core$IFn$_invoke$arity$4 = G__78909__4;
G__78909.cljs$core$IFn$_invoke$arity$variadic = G__78909__5.cljs$core$IFn$_invoke$arity$variadic;
return G__78909;
})()
);
sci.impl.core_protocols._reset_BANG_.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("sci.impl.protocols","reified","sci.impl.protocols/reified",-2019939396),(function (ref,v){
var methods$ = sci.impl.types.getMethods(ref);
var fexpr__78899 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(methods$,new cljs.core.Symbol(null,"-reset!","-reset!",1965723739,null));
return (fexpr__78899.cljs$core$IFn$_invoke$arity$2 ? fexpr__78899.cljs$core$IFn$_invoke$arity$2(ref,v) : fexpr__78899.call(null,ref,v));
}));
sci.impl.core_protocols.iatom_defaults = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [sci.impl.core_protocols._swap_BANG_.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"default","default",-1987822328),(function() { 
var G__78919__delegate = function (ref,f,args){
return cljs.core.apply.cljs$core$IFn$_invoke$arity$4(cljs.core.swap_BANG_,ref,f,args);
};
var G__78919 = function (ref,f,var_args){
var args = null;
if (arguments.length > 2) {
var G__78920__i = 0, G__78920__a = new Array(arguments.length -  2);
while (G__78920__i < G__78920__a.length) {G__78920__a[G__78920__i] = arguments[G__78920__i + 2]; ++G__78920__i;}
  args = new cljs.core.IndexedSeq(G__78920__a,0,null);
} 
return G__78919__delegate.call(this,ref,f,args);};
G__78919.cljs$lang$maxFixedArity = 2;
G__78919.cljs$lang$applyTo = (function (arglist__78921){
var ref = cljs.core.first(arglist__78921);
arglist__78921 = cljs.core.next(arglist__78921);
var f = cljs.core.first(arglist__78921);
var args = cljs.core.rest(arglist__78921);
return G__78919__delegate(ref,f,args);
});
G__78919.cljs$core$IFn$_invoke$arity$variadic = G__78919__delegate;
return G__78919;
})()
),sci.impl.core_protocols._reset_BANG_.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"default","default",-1987822328),(function (ref,v){
return cljs.core.reset_BANG_(ref,v);
}))], null);
sci.impl.core_protocols.swap_BANG__STAR_ = (function sci$impl$core_protocols$swap_BANG__STAR_(var_args){
var args__5732__auto__ = [];
var len__5726__auto___78922 = arguments.length;
var i__5727__auto___78923 = (0);
while(true){
if((i__5727__auto___78923 < len__5726__auto___78922)){
args__5732__auto__.push((arguments[i__5727__auto___78923]));

var G__78924 = (i__5727__auto___78923 + (1));
i__5727__auto___78923 = G__78924;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((2) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((2)),(0),null)):null);
return sci.impl.core_protocols.swap_BANG__STAR_.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),(arguments[(1)]),argseq__5733__auto__);
});

(sci.impl.core_protocols.swap_BANG__STAR_.cljs$core$IFn$_invoke$arity$variadic = (function (ref,f,args){
if(cljs.core.truth_(args)){
return cljs.core.apply.cljs$core$IFn$_invoke$arity$4(sci.impl.core_protocols._swap_BANG_,ref,f,args);
} else {
return sci.impl.core_protocols._swap_BANG_.cljs$core$IFn$_invoke$arity$2(ref,f);
}
}));

(sci.impl.core_protocols.swap_BANG__STAR_.cljs$lang$maxFixedArity = (2));

/** @this {Function} */
(sci.impl.core_protocols.swap_BANG__STAR_.cljs$lang$applyTo = (function (seq78902){
var G__78903 = cljs.core.first(seq78902);
var seq78902__$1 = cljs.core.next(seq78902);
var G__78904 = cljs.core.first(seq78902__$1);
var seq78902__$2 = cljs.core.next(seq78902__$1);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__78903,G__78904,seq78902__$2);
}));

sci.impl.core_protocols.reset_BANG__STAR_ = (function sci$impl$core_protocols$reset_BANG__STAR_(ref,v){
return sci.impl.core_protocols._reset_BANG_.cljs$core$IFn$_invoke$arity$2(ref,v);
});
sci.impl.core_protocols.swap_protocol = sci.impl.vars.new_var.cljs$core$IFn$_invoke$arity$3(new cljs.core.Symbol(null,"cljs.core.ISwap","cljs.core.ISwap",2045511362,null),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"protocol","protocol",652470118),cljs.core.ISwap,new cljs.core.Keyword(null,"methods","methods",453930866),cljs.core.PersistentHashSet.createAsIfByAssoc([sci.impl.core_protocols._swap_BANG_]),new cljs.core.Keyword(null,"ns","ns",441598760),sci.impl.core_protocols.cljs_core_ns], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"ns","ns",441598760),sci.impl.core_protocols.cljs_core_ns], null));
sci.impl.core_protocols.reset_protocol = sci.impl.vars.new_var.cljs$core$IFn$_invoke$arity$3(new cljs.core.Symbol(null,"cljs.core.IReset","cljs.core.IReset",348905844,null),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"protocol","protocol",652470118),cljs.core.IReset,new cljs.core.Keyword(null,"methods","methods",453930866),cljs.core.PersistentHashSet.createAsIfByAssoc([sci.impl.core_protocols._reset_BANG_]),new cljs.core.Keyword(null,"ns","ns",441598760),sci.impl.core_protocols.cljs_core_ns], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"ns","ns",441598760),sci.impl.core_protocols.cljs_core_ns], null));
sci.impl.core_protocols.defaults = cljs.core.set(cljs.core.conj.cljs$core$IFn$_invoke$arity$2(sci.impl.core_protocols.iatom_defaults,sci.impl.core_protocols.ideref_default));

//# sourceMappingURL=sci.impl.core_protocols.js.map
