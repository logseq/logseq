goog.provide('rum.derived_atom');
rum.derived_atom.derived_atom = (function rum$derived_atom$derived_atom(var_args){
var G__69400 = arguments.length;
switch (G__69400) {
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
var map__69419 = opts;
var map__69419__$1 = cljs.core.__destructure_map(map__69419);
var ref = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__69419__$1,new cljs.core.Keyword(null,"ref","ref",1289896967));
var check_equals_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__69419__$1,new cljs.core.Keyword(null,"check-equals?","check-equals?",-2005755315),true);
var recalc = (function (){var G__69428 = cljs.core.count(refs);
switch (G__69428) {
case (1):
var vec__69436 = refs;
var a = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__69436,(0),null);
return (function (){
var G__69439 = cljs.core.deref(a);
return (f.cljs$core$IFn$_invoke$arity$1 ? f.cljs$core$IFn$_invoke$arity$1(G__69439) : f.call(null,G__69439));
});

break;
case (2):
var vec__69442 = refs;
var a = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__69442,(0),null);
var b = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__69442,(1),null);
return (function (){
var G__69448 = cljs.core.deref(a);
var G__69449 = cljs.core.deref(b);
return (f.cljs$core$IFn$_invoke$arity$2 ? f.cljs$core$IFn$_invoke$arity$2(G__69448,G__69449) : f.call(null,G__69448,G__69449));
});

break;
case (3):
var vec__69455 = refs;
var a = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__69455,(0),null);
var b = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__69455,(1),null);
var c = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__69455,(2),null);
return (function (){
var G__69462 = cljs.core.deref(a);
var G__69463 = cljs.core.deref(b);
var G__69464 = cljs.core.deref(c);
return (f.cljs$core$IFn$_invoke$arity$3 ? f.cljs$core$IFn$_invoke$arity$3(G__69462,G__69463,G__69464) : f.call(null,G__69462,G__69463,G__69464));
});

break;
default:
return (function (){
return cljs.core.apply.cljs$core$IFn$_invoke$arity$2(f,cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.deref,refs));
});

}
})();
var sink = (cljs.core.truth_(ref)?(function (){var G__69474 = ref;
cljs.core.reset_BANG_(G__69474,(recalc.cljs$core$IFn$_invoke$arity$0 ? recalc.cljs$core$IFn$_invoke$arity$0() : recalc.call(null)));

return G__69474;
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
var seq__69483_69523 = cljs.core.seq(refs);
var chunk__69484_69524 = null;
var count__69485_69525 = (0);
var i__69486_69526 = (0);
while(true){
if((i__69486_69526 < count__69485_69525)){
var ref_69527__$1 = chunk__69484_69524.cljs$core$IIndexed$_nth$arity$2(null,i__69486_69526);
cljs.core.add_watch(ref_69527__$1,key,watch);


var G__69528 = seq__69483_69523;
var G__69529 = chunk__69484_69524;
var G__69530 = count__69485_69525;
var G__69531 = (i__69486_69526 + (1));
seq__69483_69523 = G__69528;
chunk__69484_69524 = G__69529;
count__69485_69525 = G__69530;
i__69486_69526 = G__69531;
continue;
} else {
var temp__5804__auto___69532 = cljs.core.seq(seq__69483_69523);
if(temp__5804__auto___69532){
var seq__69483_69533__$1 = temp__5804__auto___69532;
if(cljs.core.chunked_seq_QMARK_(seq__69483_69533__$1)){
var c__5525__auto___69534 = cljs.core.chunk_first(seq__69483_69533__$1);
var G__69535 = cljs.core.chunk_rest(seq__69483_69533__$1);
var G__69536 = c__5525__auto___69534;
var G__69537 = cljs.core.count(c__5525__auto___69534);
var G__69538 = (0);
seq__69483_69523 = G__69535;
chunk__69484_69524 = G__69536;
count__69485_69525 = G__69537;
i__69486_69526 = G__69538;
continue;
} else {
var ref_69539__$1 = cljs.core.first(seq__69483_69533__$1);
cljs.core.add_watch(ref_69539__$1,key,watch);


var G__69542 = cljs.core.next(seq__69483_69533__$1);
var G__69543 = null;
var G__69544 = (0);
var G__69545 = (0);
seq__69483_69523 = G__69542;
chunk__69484_69524 = G__69543;
count__69485_69525 = G__69544;
i__69486_69526 = G__69545;
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
