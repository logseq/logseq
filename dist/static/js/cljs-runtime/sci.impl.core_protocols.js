goog.provide('sci.impl.core_protocols');
if((typeof sci !== 'undefined') && (typeof sci.impl !== 'undefined') && (typeof sci.impl.core_protocols !== 'undefined') && (typeof sci.impl.core_protocols._deref !== 'undefined')){
} else {
sci.impl.core_protocols._deref = (function (){var method_table__5599__auto__ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
var prefer_table__5600__auto__ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
var method_cache__5601__auto__ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
var cached_hierarchy__5602__auto__ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
var hierarchy__5603__auto__ = cljs.core.get.cljs$core$IFn$_invoke$arity$3(cljs.core.PersistentArrayMap.EMPTY,new cljs.core.Keyword(null,"hierarchy","hierarchy",-1053470341),(function (){var fexpr__85505 = cljs.core.get_global_hierarchy;
return (fexpr__85505.cljs$core$IFn$_invoke$arity$0 ? fexpr__85505.cljs$core$IFn$_invoke$arity$0() : fexpr__85505.call(null));
})());
return (new cljs.core.MultiFn(cljs.core.symbol.cljs$core$IFn$_invoke$arity$2("sci.impl.core-protocols","-deref"),sci.impl.types.type_impl,new cljs.core.Keyword(null,"default","default",-1987822328),hierarchy__5603__auto__,method_table__5599__auto__,prefer_table__5600__auto__,method_cache__5601__auto__,cached_hierarchy__5602__auto__));
})();
}
sci.impl.core_protocols._deref.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("sci.impl.protocols","reified","sci.impl.protocols/reified",-2019939396),(function (ref){
var methods$ = sci.impl.types.getMethods(ref);
var fexpr__85506 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(methods$,new cljs.core.Symbol(null,"-deref","-deref",-283116853,null));
return (fexpr__85506.cljs$core$IFn$_invoke$arity$1 ? fexpr__85506.cljs$core$IFn$_invoke$arity$1(ref) : fexpr__85506.call(null,ref));
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
var hierarchy__5603__auto__ = cljs.core.get.cljs$core$IFn$_invoke$arity$3(cljs.core.PersistentArrayMap.EMPTY,new cljs.core.Keyword(null,"hierarchy","hierarchy",-1053470341),(function (){var fexpr__85510 = cljs.core.get_global_hierarchy;
return (fexpr__85510.cljs$core$IFn$_invoke$arity$0 ? fexpr__85510.cljs$core$IFn$_invoke$arity$0() : fexpr__85510.call(null));
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
var hierarchy__5603__auto__ = cljs.core.get.cljs$core$IFn$_invoke$arity$3(cljs.core.PersistentArrayMap.EMPTY,new cljs.core.Keyword(null,"hierarchy","hierarchy",-1053470341),(function (){var fexpr__85511 = cljs.core.get_global_hierarchy;
return (fexpr__85511.cljs$core$IFn$_invoke$arity$0 ? fexpr__85511.cljs$core$IFn$_invoke$arity$0() : fexpr__85511.call(null));
})());
return (new cljs.core.MultiFn(cljs.core.symbol.cljs$core$IFn$_invoke$arity$2("sci.impl.core-protocols","-reset!"),sci.impl.types.type_impl,new cljs.core.Keyword(null,"default","default",-1987822328),hierarchy__5603__auto__,method_table__5599__auto__,prefer_table__5600__auto__,method_cache__5601__auto__,cached_hierarchy__5602__auto__));
})();
}
sci.impl.core_protocols._swap_BANG_.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("sci.impl.protocols","reified","sci.impl.protocols/reified",-2019939396),(function() {
var G__85536 = null;
var G__85536__2 = (function (ref,f){
var methods$ = sci.impl.types.getMethods(ref);
var fexpr__85517 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(methods$,new cljs.core.Symbol(null,"-swap!","-swap!",-535359318,null));
return (fexpr__85517.cljs$core$IFn$_invoke$arity$2 ? fexpr__85517.cljs$core$IFn$_invoke$arity$2(ref,f) : fexpr__85517.call(null,ref,f));
});
var G__85536__3 = (function (ref,f,a1){
var methods$ = sci.impl.types.getMethods(ref);
var fexpr__85518 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(methods$,new cljs.core.Symbol(null,"-swap!","-swap!",-535359318,null));
return (fexpr__85518.cljs$core$IFn$_invoke$arity$3 ? fexpr__85518.cljs$core$IFn$_invoke$arity$3(ref,f,a1) : fexpr__85518.call(null,ref,f,a1));
});
var G__85536__4 = (function (ref,f,a1,a2){
var methods$ = sci.impl.types.getMethods(ref);
var fexpr__85519 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(methods$,new cljs.core.Symbol(null,"-swap!","-swap!",-535359318,null));
return (fexpr__85519.cljs$core$IFn$_invoke$arity$4 ? fexpr__85519.cljs$core$IFn$_invoke$arity$4(ref,f,a1,a2) : fexpr__85519.call(null,ref,f,a1,a2));
});
var G__85536__5 = (function() { 
var G__85537__delegate = function (ref,f,a1,a2,args){
var methods$ = sci.impl.types.getMethods(ref);
return cljs.core.apply.cljs$core$IFn$_invoke$arity$variadic(cljs.core.get.cljs$core$IFn$_invoke$arity$2(methods$,new cljs.core.Symbol(null,"-swap!","-swap!",-535359318,null)),ref,f,a1,a2,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([args], 0));
};
var G__85537 = function (ref,f,a1,a2,var_args){
var args = null;
if (arguments.length > 4) {
var G__85538__i = 0, G__85538__a = new Array(arguments.length -  4);
while (G__85538__i < G__85538__a.length) {G__85538__a[G__85538__i] = arguments[G__85538__i + 4]; ++G__85538__i;}
  args = new cljs.core.IndexedSeq(G__85538__a,0,null);
} 
return G__85537__delegate.call(this,ref,f,a1,a2,args);};
G__85537.cljs$lang$maxFixedArity = 4;
G__85537.cljs$lang$applyTo = (function (arglist__85539){
var ref = cljs.core.first(arglist__85539);
arglist__85539 = cljs.core.next(arglist__85539);
var f = cljs.core.first(arglist__85539);
arglist__85539 = cljs.core.next(arglist__85539);
var a1 = cljs.core.first(arglist__85539);
arglist__85539 = cljs.core.next(arglist__85539);
var a2 = cljs.core.first(arglist__85539);
var args = cljs.core.rest(arglist__85539);
return G__85537__delegate(ref,f,a1,a2,args);
});
G__85537.cljs$core$IFn$_invoke$arity$variadic = G__85537__delegate;
return G__85537;
})()
;
G__85536 = function(ref,f,a1,a2,var_args){
var args = var_args;
switch(arguments.length){
case 2:
return G__85536__2.call(this,ref,f);
case 3:
return G__85536__3.call(this,ref,f,a1);
case 4:
return G__85536__4.call(this,ref,f,a1,a2);
default:
var G__85540 = null;
if (arguments.length > 4) {
var G__85541__i = 0, G__85541__a = new Array(arguments.length -  4);
while (G__85541__i < G__85541__a.length) {G__85541__a[G__85541__i] = arguments[G__85541__i + 4]; ++G__85541__i;}
G__85540 = new cljs.core.IndexedSeq(G__85541__a,0,null);
}
return G__85536__5.cljs$core$IFn$_invoke$arity$variadic(ref,f,a1,a2, G__85540);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
G__85536.cljs$lang$maxFixedArity = 4;
G__85536.cljs$lang$applyTo = G__85536__5.cljs$lang$applyTo;
G__85536.cljs$core$IFn$_invoke$arity$2 = G__85536__2;
G__85536.cljs$core$IFn$_invoke$arity$3 = G__85536__3;
G__85536.cljs$core$IFn$_invoke$arity$4 = G__85536__4;
G__85536.cljs$core$IFn$_invoke$arity$variadic = G__85536__5.cljs$core$IFn$_invoke$arity$variadic;
return G__85536;
})()
);
sci.impl.core_protocols._reset_BANG_.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("sci.impl.protocols","reified","sci.impl.protocols/reified",-2019939396),(function (ref,v){
var methods$ = sci.impl.types.getMethods(ref);
var fexpr__85520 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(methods$,new cljs.core.Symbol(null,"-reset!","-reset!",1965723739,null));
return (fexpr__85520.cljs$core$IFn$_invoke$arity$2 ? fexpr__85520.cljs$core$IFn$_invoke$arity$2(ref,v) : fexpr__85520.call(null,ref,v));
}));
sci.impl.core_protocols.iatom_defaults = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [sci.impl.core_protocols._swap_BANG_.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"default","default",-1987822328),(function() { 
var G__85543__delegate = function (ref,f,args){
return cljs.core.apply.cljs$core$IFn$_invoke$arity$4(cljs.core.swap_BANG_,ref,f,args);
};
var G__85543 = function (ref,f,var_args){
var args = null;
if (arguments.length > 2) {
var G__85544__i = 0, G__85544__a = new Array(arguments.length -  2);
while (G__85544__i < G__85544__a.length) {G__85544__a[G__85544__i] = arguments[G__85544__i + 2]; ++G__85544__i;}
  args = new cljs.core.IndexedSeq(G__85544__a,0,null);
} 
return G__85543__delegate.call(this,ref,f,args);};
G__85543.cljs$lang$maxFixedArity = 2;
G__85543.cljs$lang$applyTo = (function (arglist__85545){
var ref = cljs.core.first(arglist__85545);
arglist__85545 = cljs.core.next(arglist__85545);
var f = cljs.core.first(arglist__85545);
var args = cljs.core.rest(arglist__85545);
return G__85543__delegate(ref,f,args);
});
G__85543.cljs$core$IFn$_invoke$arity$variadic = G__85543__delegate;
return G__85543;
})()
),sci.impl.core_protocols._reset_BANG_.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"default","default",-1987822328),(function (ref,v){
return cljs.core.reset_BANG_(ref,v);
}))], null);
sci.impl.core_protocols.swap_BANG__STAR_ = (function sci$impl$core_protocols$swap_BANG__STAR_(var_args){
var args__5732__auto__ = [];
var len__5726__auto___85546 = arguments.length;
var i__5727__auto___85547 = (0);
while(true){
if((i__5727__auto___85547 < len__5726__auto___85546)){
args__5732__auto__.push((arguments[i__5727__auto___85547]));

var G__85548 = (i__5727__auto___85547 + (1));
i__5727__auto___85547 = G__85548;
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
(sci.impl.core_protocols.swap_BANG__STAR_.cljs$lang$applyTo = (function (seq85525){
var G__85526 = cljs.core.first(seq85525);
var seq85525__$1 = cljs.core.next(seq85525);
var G__85527 = cljs.core.first(seq85525__$1);
var seq85525__$2 = cljs.core.next(seq85525__$1);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__85526,G__85527,seq85525__$2);
}));

sci.impl.core_protocols.reset_BANG__STAR_ = (function sci$impl$core_protocols$reset_BANG__STAR_(ref,v){
return sci.impl.core_protocols._reset_BANG_.cljs$core$IFn$_invoke$arity$2(ref,v);
});
sci.impl.core_protocols.swap_protocol = sci.impl.vars.new_var.cljs$core$IFn$_invoke$arity$3(new cljs.core.Symbol(null,"cljs.core.ISwap","cljs.core.ISwap",2045511362,null),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"protocol","protocol",652470118),cljs.core.ISwap,new cljs.core.Keyword(null,"methods","methods",453930866),cljs.core.PersistentHashSet.createAsIfByAssoc([sci.impl.core_protocols._swap_BANG_]),new cljs.core.Keyword(null,"ns","ns",441598760),sci.impl.core_protocols.cljs_core_ns], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"ns","ns",441598760),sci.impl.core_protocols.cljs_core_ns], null));
sci.impl.core_protocols.reset_protocol = sci.impl.vars.new_var.cljs$core$IFn$_invoke$arity$3(new cljs.core.Symbol(null,"cljs.core.IReset","cljs.core.IReset",348905844,null),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"protocol","protocol",652470118),cljs.core.IReset,new cljs.core.Keyword(null,"methods","methods",453930866),cljs.core.PersistentHashSet.createAsIfByAssoc([sci.impl.core_protocols._reset_BANG_]),new cljs.core.Keyword(null,"ns","ns",441598760),sci.impl.core_protocols.cljs_core_ns], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"ns","ns",441598760),sci.impl.core_protocols.cljs_core_ns], null));
sci.impl.core_protocols.defaults = cljs.core.set(cljs.core.conj.cljs$core$IFn$_invoke$arity$2(sci.impl.core_protocols.iatom_defaults,sci.impl.core_protocols.ideref_default));

//# sourceMappingURL=sci.impl.core_protocols.js.map
