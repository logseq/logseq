goog.provide('rum.derived_atom');
rum.derived_atom.derived_atom = (function rum$derived_atom$derived_atom(var_args){
var G__70429 = arguments.length;
switch (G__70429) {
case 3:
return rum.derived_atom.derived_atom.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
case 4:
return rum.derived_atom.derived_atom.cljs$core$IFn$_invoke$arity$4((arguments[(0)]),(arguments[(1)]),(arguments[(2)]),(arguments[(3)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(rum.derived_atom.derived_atom.cljs$core$IFn$_invoke$arity$3 = (function (refs,key,f){
return rum.derived_atom.derived_atom.cljs$core$IFn$_invoke$arity$4(refs,key,f,cljs.core.PersistentArrayMap.EMPTY);
}));

(rum.derived_atom.derived_atom.cljs$core$IFn$_invoke$arity$4 = (function (refs,key,f,opts){
var map__70432 = opts;
var map__70432__$1 = cljs.core.__destructure_map(map__70432);
var ref = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__70432__$1,new cljs.core.Keyword(null,"ref","ref",1289896967));
var check_equals_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__70432__$1,new cljs.core.Keyword(null,"check-equals?","check-equals?",-2005755315),true);
var recalc = (function (){var G__70433 = cljs.core.count(refs);
switch (G__70433) {
case (1):
var vec__70434 = refs;
var a = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__70434,(0),null);
return (function (){
var G__70437 = cljs.core.deref(a);
return (f.cljs$core$IFn$_invoke$arity$1 ? f.cljs$core$IFn$_invoke$arity$1(G__70437) : f.call(null,G__70437));
});

break;
case (2):
var vec__70440 = refs;
var a = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__70440,(0),null);
var b = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__70440,(1),null);
return (function (){
var G__70446 = cljs.core.deref(a);
var G__70447 = cljs.core.deref(b);
return (f.cljs$core$IFn$_invoke$arity$2 ? f.cljs$core$IFn$_invoke$arity$2(G__70446,G__70447) : f.call(null,G__70446,G__70447));
});

break;
case (3):
var vec__70464 = refs;
var a = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__70464,(0),null);
var b = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__70464,(1),null);
var c = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__70464,(2),null);
return (function (){
var G__70467 = cljs.core.deref(a);
var G__70468 = cljs.core.deref(b);
var G__70469 = cljs.core.deref(c);
return (f.cljs$core$IFn$_invoke$arity$3 ? f.cljs$core$IFn$_invoke$arity$3(G__70467,G__70468,G__70469) : f.call(null,G__70467,G__70468,G__70469));
});

break;
default:
return (function (){
return cljs.core.apply.cljs$core$IFn$_invoke$arity$2(f,cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.deref,refs));
});

}
})();
var sink = (cljs.core.truth_(ref)?(function (){var G__70480 = ref;
cljs.core.reset_BANG_(G__70480,(recalc.cljs$core$IFn$_invoke$arity$0 ? recalc.cljs$core$IFn$_invoke$arity$0() : recalc.call(null)));

return G__70480;
})():cljs.core.atom.cljs$core$IFn$_invoke$arity$1((recalc.cljs$core$IFn$_invoke$arity$0 ? recalc.cljs$core$IFn$_invoke$arity$0() : recalc.call(null))));
var watch = (cljs.core.truth_(check_equals_QMARK_)?(function (_,___$1,___$2,___$3){
var new_val = (recalc.cljs$core$IFn$_invoke$arity$0 ? recalc.cljs$core$IFn$_invoke$arity$0() : recalc.call(null));
if(cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(sink),new_val)){
return cljs.core.reset_BANG_(sink,new_val);
} else {
return null;
}
}):(function (_,___$1,___$2,___$3){
return cljs.core.reset_BANG_(sink,(recalc.cljs$core$IFn$_invoke$arity$0 ? recalc.cljs$core$IFn$_invoke$arity$0() : recalc.call(null)));
}));
var seq__70489_70495 = cljs.core.seq(refs);
var chunk__70490_70496 = null;
var count__70491_70497 = (0);
var i__70492_70498 = (0);
while(true){
if((i__70492_70498 < count__70491_70497)){
var ref_70499__$1 = chunk__70490_70496.cljs$core$IIndexed$_nth$arity$2(null,i__70492_70498);
cljs.core.add_watch(ref_70499__$1,key,watch);


var G__70500 = seq__70489_70495;
var G__70501 = chunk__70490_70496;
var G__70502 = count__70491_70497;
var G__70503 = (i__70492_70498 + (1));
seq__70489_70495 = G__70500;
chunk__70490_70496 = G__70501;
count__70491_70497 = G__70502;
i__70492_70498 = G__70503;
continue;
} else {
var temp__5804__auto___70504 = cljs.core.seq(seq__70489_70495);
if(temp__5804__auto___70504){
var seq__70489_70505__$1 = temp__5804__auto___70504;
if(cljs.core.chunked_seq_QMARK_(seq__70489_70505__$1)){
var c__5525__auto___70506 = cljs.core.chunk_first(seq__70489_70505__$1);
var G__70507 = cljs.core.chunk_rest(seq__70489_70505__$1);
var G__70508 = c__5525__auto___70506;
var G__70509 = cljs.core.count(c__5525__auto___70506);
var G__70510 = (0);
seq__70489_70495 = G__70507;
chunk__70490_70496 = G__70508;
count__70491_70497 = G__70509;
i__70492_70498 = G__70510;
continue;
} else {
var ref_70511__$1 = cljs.core.first(seq__70489_70505__$1);
cljs.core.add_watch(ref_70511__$1,key,watch);


var G__70512 = cljs.core.next(seq__70489_70505__$1);
var G__70513 = null;
var G__70514 = (0);
var G__70515 = (0);
seq__70489_70495 = G__70512;
chunk__70490_70496 = G__70513;
count__70491_70497 = G__70514;
i__70492_70498 = G__70515;
continue;
}
} else {
}
}
break;
}

return sink;
}));

(rum.derived_atom.derived_atom.cljs$lang$maxFixedArity = 4);


//# sourceMappingURL=rum.derived_atom.js.map
