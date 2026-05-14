goog.provide('cljs.repl');
cljs.repl.print_doc = (function cljs$repl$print_doc(p__41877){
var map__41878 = p__41877;
var map__41878__$1 = cljs.core.__destructure_map(map__41878);
var m = map__41878__$1;
var n = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__41878__$1,new cljs.core.Keyword(null,"ns","ns",441598760));
var nm = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__41878__$1,new cljs.core.Keyword(null,"name","name",1843675177));
cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["-------------------------"], 0));

cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([(function (){var or__5002__auto__ = new cljs.core.Keyword(null,"spec","spec",347520401).cljs$core$IFn$_invoke$arity$1(m);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return [(function (){var temp__5804__auto__ = new cljs.core.Keyword(null,"ns","ns",441598760).cljs$core$IFn$_invoke$arity$1(m);
if(cljs.core.truth_(temp__5804__auto__)){
var ns = temp__5804__auto__;
return [cljs.core.str.cljs$core$IFn$_invoke$arity$1(ns),"/"].join('');
} else {
return null;
}
})(),cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"name","name",1843675177).cljs$core$IFn$_invoke$arity$1(m))].join('');
}
})()], 0));

if(cljs.core.truth_(new cljs.core.Keyword(null,"protocol","protocol",652470118).cljs$core$IFn$_invoke$arity$1(m))){
cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["Protocol"], 0));
} else {
}

if(cljs.core.truth_(new cljs.core.Keyword(null,"forms","forms",2045992350).cljs$core$IFn$_invoke$arity$1(m))){
var seq__41882_42303 = cljs.core.seq(new cljs.core.Keyword(null,"forms","forms",2045992350).cljs$core$IFn$_invoke$arity$1(m));
var chunk__41883_42304 = null;
var count__41884_42305 = (0);
var i__41885_42306 = (0);
while(true){
if((i__41885_42306 < count__41884_42305)){
var f_42307 = chunk__41883_42304.cljs$core$IIndexed$_nth$arity$2(null,i__41885_42306);
cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["  ",f_42307], 0));


var G__42308 = seq__41882_42303;
var G__42309 = chunk__41883_42304;
var G__42310 = count__41884_42305;
var G__42311 = (i__41885_42306 + (1));
seq__41882_42303 = G__42308;
chunk__41883_42304 = G__42309;
count__41884_42305 = G__42310;
i__41885_42306 = G__42311;
continue;
} else {
var temp__5804__auto___42312 = cljs.core.seq(seq__41882_42303);
if(temp__5804__auto___42312){
var seq__41882_42313__$1 = temp__5804__auto___42312;
if(cljs.core.chunked_seq_QMARK_(seq__41882_42313__$1)){
var c__5525__auto___42314 = cljs.core.chunk_first(seq__41882_42313__$1);
var G__42315 = cljs.core.chunk_rest(seq__41882_42313__$1);
var G__42316 = c__5525__auto___42314;
var G__42317 = cljs.core.count(c__5525__auto___42314);
var G__42318 = (0);
seq__41882_42303 = G__42315;
chunk__41883_42304 = G__42316;
count__41884_42305 = G__42317;
i__41885_42306 = G__42318;
continue;
} else {
var f_42319 = cljs.core.first(seq__41882_42313__$1);
cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["  ",f_42319], 0));


var G__42321 = cljs.core.next(seq__41882_42313__$1);
var G__42322 = null;
var G__42323 = (0);
var G__42324 = (0);
seq__41882_42303 = G__42321;
chunk__41883_42304 = G__42322;
count__41884_42305 = G__42323;
i__41885_42306 = G__42324;
continue;
}
} else {
}
}
break;
}
} else {
if(cljs.core.truth_(new cljs.core.Keyword(null,"arglists","arglists",1661989754).cljs$core$IFn$_invoke$arity$1(m))){
var arglists_42325 = new cljs.core.Keyword(null,"arglists","arglists",1661989754).cljs$core$IFn$_invoke$arity$1(m);
if(cljs.core.truth_((function (){var or__5002__auto__ = new cljs.core.Keyword(null,"macro","macro",-867863404).cljs$core$IFn$_invoke$arity$1(m);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword(null,"repl-special-function","repl-special-function",1262603725).cljs$core$IFn$_invoke$arity$1(m);
}
})())){
cljs.core.prn.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([arglists_42325], 0));
} else {
cljs.core.prn.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Symbol(null,"quote","quote",1377916282,null),cljs.core.first(arglists_42325)))?cljs.core.second(arglists_42325):arglists_42325)], 0));
}
} else {
}
}

if(cljs.core.truth_(new cljs.core.Keyword(null,"special-form","special-form",-1326536374).cljs$core$IFn$_invoke$arity$1(m))){
cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["Special Form"], 0));

cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([" ",new cljs.core.Keyword(null,"doc","doc",1913296891).cljs$core$IFn$_invoke$arity$1(m)], 0));

if(cljs.core.contains_QMARK_(m,new cljs.core.Keyword(null,"url","url",276297046))){
if(cljs.core.truth_(new cljs.core.Keyword(null,"url","url",276297046).cljs$core$IFn$_invoke$arity$1(m))){
return cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([["\n  Please see http://clojure.org/",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"url","url",276297046).cljs$core$IFn$_invoke$arity$1(m))].join('')], 0));
} else {
return null;
}
} else {
return cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([["\n  Please see http://clojure.org/special_forms#",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"name","name",1843675177).cljs$core$IFn$_invoke$arity$1(m))].join('')], 0));
}
} else {
if(cljs.core.truth_(new cljs.core.Keyword(null,"macro","macro",-867863404).cljs$core$IFn$_invoke$arity$1(m))){
cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["Macro"], 0));
} else {
}

if(cljs.core.truth_(new cljs.core.Keyword(null,"spec","spec",347520401).cljs$core$IFn$_invoke$arity$1(m))){
cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["Spec"], 0));
} else {
}

if(cljs.core.truth_(new cljs.core.Keyword(null,"repl-special-function","repl-special-function",1262603725).cljs$core$IFn$_invoke$arity$1(m))){
cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["REPL Special Function"], 0));
} else {
}

cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([" ",new cljs.core.Keyword(null,"doc","doc",1913296891).cljs$core$IFn$_invoke$arity$1(m)], 0));

if(cljs.core.truth_(new cljs.core.Keyword(null,"protocol","protocol",652470118).cljs$core$IFn$_invoke$arity$1(m))){
var seq__41910_42332 = cljs.core.seq(new cljs.core.Keyword(null,"methods","methods",453930866).cljs$core$IFn$_invoke$arity$1(m));
var chunk__41911_42333 = null;
var count__41912_42334 = (0);
var i__41913_42335 = (0);
while(true){
if((i__41913_42335 < count__41912_42334)){
var vec__41955_42336 = chunk__41911_42333.cljs$core$IIndexed$_nth$arity$2(null,i__41913_42335);
var name_42337 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__41955_42336,(0),null);
var map__41958_42338 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__41955_42336,(1),null);
var map__41958_42339__$1 = cljs.core.__destructure_map(map__41958_42338);
var doc_42340 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__41958_42339__$1,new cljs.core.Keyword(null,"doc","doc",1913296891));
var arglists_42341 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__41958_42339__$1,new cljs.core.Keyword(null,"arglists","arglists",1661989754));
cljs.core.println();

cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([" ",name_42337], 0));

cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([" ",arglists_42341], 0));

if(cljs.core.truth_(doc_42340)){
cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([" ",doc_42340], 0));
} else {
}


var G__42342 = seq__41910_42332;
var G__42343 = chunk__41911_42333;
var G__42344 = count__41912_42334;
var G__42345 = (i__41913_42335 + (1));
seq__41910_42332 = G__42342;
chunk__41911_42333 = G__42343;
count__41912_42334 = G__42344;
i__41913_42335 = G__42345;
continue;
} else {
var temp__5804__auto___42346 = cljs.core.seq(seq__41910_42332);
if(temp__5804__auto___42346){
var seq__41910_42347__$1 = temp__5804__auto___42346;
if(cljs.core.chunked_seq_QMARK_(seq__41910_42347__$1)){
var c__5525__auto___42348 = cljs.core.chunk_first(seq__41910_42347__$1);
var G__42349 = cljs.core.chunk_rest(seq__41910_42347__$1);
var G__42350 = c__5525__auto___42348;
var G__42351 = cljs.core.count(c__5525__auto___42348);
var G__42352 = (0);
seq__41910_42332 = G__42349;
chunk__41911_42333 = G__42350;
count__41912_42334 = G__42351;
i__41913_42335 = G__42352;
continue;
} else {
var vec__41977_42353 = cljs.core.first(seq__41910_42347__$1);
var name_42354 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__41977_42353,(0),null);
var map__41980_42355 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__41977_42353,(1),null);
var map__41980_42356__$1 = cljs.core.__destructure_map(map__41980_42355);
var doc_42357 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__41980_42356__$1,new cljs.core.Keyword(null,"doc","doc",1913296891));
var arglists_42358 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__41980_42356__$1,new cljs.core.Keyword(null,"arglists","arglists",1661989754));
cljs.core.println();

cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([" ",name_42354], 0));

cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([" ",arglists_42358], 0));

if(cljs.core.truth_(doc_42357)){
cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([" ",doc_42357], 0));
} else {
}


var G__42360 = cljs.core.next(seq__41910_42347__$1);
var G__42361 = null;
var G__42362 = (0);
var G__42363 = (0);
seq__41910_42332 = G__42360;
chunk__41911_42333 = G__42361;
count__41912_42334 = G__42362;
i__41913_42335 = G__42363;
continue;
}
} else {
}
}
break;
}
} else {
}

if(cljs.core.truth_(n)){
var temp__5804__auto__ = cljs.spec.alpha.get_spec(cljs.core.symbol.cljs$core$IFn$_invoke$arity$2(cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.ns_name(n)),cljs.core.name(nm)));
if(cljs.core.truth_(temp__5804__auto__)){
var fnspec = temp__5804__auto__;
cljs.core.print.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["Spec"], 0));

var seq__41993 = cljs.core.seq(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"args","args",1315556576),new cljs.core.Keyword(null,"ret","ret",-468222814),new cljs.core.Keyword(null,"fn","fn",-1175266204)], null));
var chunk__41994 = null;
var count__41995 = (0);
var i__41996 = (0);
while(true){
if((i__41996 < count__41995)){
var role = chunk__41994.cljs$core$IIndexed$_nth$arity$2(null,i__41996);
var temp__5804__auto___42365__$1 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(fnspec,role);
if(cljs.core.truth_(temp__5804__auto___42365__$1)){
var spec_42368 = temp__5804__auto___42365__$1;
cljs.core.print.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([["\n ",cljs.core.name(role),":"].join(''),cljs.spec.alpha.describe(spec_42368)], 0));
} else {
}


var G__42369 = seq__41993;
var G__42370 = chunk__41994;
var G__42371 = count__41995;
var G__42372 = (i__41996 + (1));
seq__41993 = G__42369;
chunk__41994 = G__42370;
count__41995 = G__42371;
i__41996 = G__42372;
continue;
} else {
var temp__5804__auto____$1 = cljs.core.seq(seq__41993);
if(temp__5804__auto____$1){
var seq__41993__$1 = temp__5804__auto____$1;
if(cljs.core.chunked_seq_QMARK_(seq__41993__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__41993__$1);
var G__42375 = cljs.core.chunk_rest(seq__41993__$1);
var G__42376 = c__5525__auto__;
var G__42377 = cljs.core.count(c__5525__auto__);
var G__42378 = (0);
seq__41993 = G__42375;
chunk__41994 = G__42376;
count__41995 = G__42377;
i__41996 = G__42378;
continue;
} else {
var role = cljs.core.first(seq__41993__$1);
var temp__5804__auto___42379__$2 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(fnspec,role);
if(cljs.core.truth_(temp__5804__auto___42379__$2)){
var spec_42380 = temp__5804__auto___42379__$2;
cljs.core.print.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([["\n ",cljs.core.name(role),":"].join(''),cljs.spec.alpha.describe(spec_42380)], 0));
} else {
}


var G__42381 = cljs.core.next(seq__41993__$1);
var G__42382 = null;
var G__42383 = (0);
var G__42384 = (0);
seq__41993 = G__42381;
chunk__41994 = G__42382;
count__41995 = G__42383;
i__41996 = G__42384;
continue;
}
} else {
return null;
}
}
break;
}
} else {
return null;
}
} else {
return null;
}
}
});
/**
 * Constructs a data representation for a Error with keys:
 *  :cause - root cause message
 *  :phase - error phase
 *  :via - cause chain, with cause keys:
 *           :type - exception class symbol
 *           :message - exception message
 *           :data - ex-data
 *           :at - top stack element
 *  :trace - root cause stack elements
 */
cljs.repl.Error__GT_map = (function cljs$repl$Error__GT_map(o){
return cljs.core.Throwable__GT_map(o);
});
/**
 * Returns an analysis of the phase, error, cause, and location of an error that occurred
 *   based on Throwable data, as returned by Throwable->map. All attributes other than phase
 *   are optional:
 *  :clojure.error/phase - keyword phase indicator, one of:
 *    :read-source :compile-syntax-check :compilation :macro-syntax-check :macroexpansion
 *    :execution :read-eval-result :print-eval-result
 *  :clojure.error/source - file name (no path)
 *  :clojure.error/line - integer line number
 *  :clojure.error/column - integer column number
 *  :clojure.error/symbol - symbol being expanded/compiled/invoked
 *  :clojure.error/class - cause exception class symbol
 *  :clojure.error/cause - cause exception message
 *  :clojure.error/spec - explain-data for spec error
 */
cljs.repl.ex_triage = (function cljs$repl$ex_triage(datafied_throwable){
var map__42093 = datafied_throwable;
var map__42093__$1 = cljs.core.__destructure_map(map__42093);
var via = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__42093__$1,new cljs.core.Keyword(null,"via","via",-1904457336));
var trace = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__42093__$1,new cljs.core.Keyword(null,"trace","trace",-1082747415));
var phase = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__42093__$1,new cljs.core.Keyword(null,"phase","phase",575722892),new cljs.core.Keyword(null,"execution","execution",253283524));
var map__42095 = cljs.core.last(via);
var map__42095__$1 = cljs.core.__destructure_map(map__42095);
var type = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__42095__$1,new cljs.core.Keyword(null,"type","type",1174270348));
var message = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__42095__$1,new cljs.core.Keyword(null,"message","message",-406056002));
var data = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__42095__$1,new cljs.core.Keyword(null,"data","data",-232669377));
var map__42096 = data;
var map__42096__$1 = cljs.core.__destructure_map(map__42096);
var problems = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__42096__$1,new cljs.core.Keyword("cljs.spec.alpha","problems","cljs.spec.alpha/problems",447400814));
var fn = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__42096__$1,new cljs.core.Keyword("cljs.spec.alpha","fn","cljs.spec.alpha/fn",408600443));
var caller = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__42096__$1,new cljs.core.Keyword("cljs.spec.test.alpha","caller","cljs.spec.test.alpha/caller",-398302390));
var map__42098 = new cljs.core.Keyword(null,"data","data",-232669377).cljs$core$IFn$_invoke$arity$1(cljs.core.first(via));
var map__42098__$1 = cljs.core.__destructure_map(map__42098);
var top_data = map__42098__$1;
var source = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__42098__$1,new cljs.core.Keyword("clojure.error","source","clojure.error/source",-2011936397));
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3((function (){var G__42146 = phase;
var G__42146__$1 = (((G__42146 instanceof cljs.core.Keyword))?G__42146.fqn:null);
switch (G__42146__$1) {
case "read-source":
var map__42160 = data;
var map__42160__$1 = cljs.core.__destructure_map(map__42160);
var line = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__42160__$1,new cljs.core.Keyword("clojure.error","line","clojure.error/line",-1816287471));
var column = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__42160__$1,new cljs.core.Keyword("clojure.error","column","clojure.error/column",304721553));
var G__42161 = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"data","data",-232669377).cljs$core$IFn$_invoke$arity$1(cljs.core.second(via)),top_data], 0));
var G__42161__$1 = (cljs.core.truth_(source)?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__42161,new cljs.core.Keyword("clojure.error","source","clojure.error/source",-2011936397),source):G__42161);
var G__42161__$2 = (cljs.core.truth_((function (){var fexpr__42166 = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, ["NO_SOURCE_PATH",null,"NO_SOURCE_FILE",null], null), null);
return (fexpr__42166.cljs$core$IFn$_invoke$arity$1 ? fexpr__42166.cljs$core$IFn$_invoke$arity$1(source) : fexpr__42166.call(null,source));
})())?cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(G__42161__$1,new cljs.core.Keyword("clojure.error","source","clojure.error/source",-2011936397)):G__42161__$1);
if(cljs.core.truth_(message)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__42161__$2,new cljs.core.Keyword("clojure.error","cause","clojure.error/cause",-1879175742),message);
} else {
return G__42161__$2;
}

break;
case "compile-syntax-check":
case "compilation":
case "macro-syntax-check":
case "macroexpansion":
var G__42170 = top_data;
var G__42170__$1 = (cljs.core.truth_(source)?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__42170,new cljs.core.Keyword("clojure.error","source","clojure.error/source",-2011936397),source):G__42170);
var G__42170__$2 = (cljs.core.truth_((function (){var fexpr__42173 = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, ["NO_SOURCE_PATH",null,"NO_SOURCE_FILE",null], null), null);
return (fexpr__42173.cljs$core$IFn$_invoke$arity$1 ? fexpr__42173.cljs$core$IFn$_invoke$arity$1(source) : fexpr__42173.call(null,source));
})())?cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(G__42170__$1,new cljs.core.Keyword("clojure.error","source","clojure.error/source",-2011936397)):G__42170__$1);
var G__42170__$3 = (cljs.core.truth_(type)?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__42170__$2,new cljs.core.Keyword("clojure.error","class","clojure.error/class",278435890),type):G__42170__$2);
var G__42170__$4 = (cljs.core.truth_(message)?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__42170__$3,new cljs.core.Keyword("clojure.error","cause","clojure.error/cause",-1879175742),message):G__42170__$3);
if(cljs.core.truth_(problems)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__42170__$4,new cljs.core.Keyword("clojure.error","spec","clojure.error/spec",2055032595),data);
} else {
return G__42170__$4;
}

break;
case "read-eval-result":
case "print-eval-result":
var vec__42190 = cljs.core.first(trace);
var source__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__42190,(0),null);
var method = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__42190,(1),null);
var file = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__42190,(2),null);
var line = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__42190,(3),null);
var G__42195 = top_data;
var G__42195__$1 = (cljs.core.truth_(line)?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__42195,new cljs.core.Keyword("clojure.error","line","clojure.error/line",-1816287471),line):G__42195);
var G__42195__$2 = (cljs.core.truth_(file)?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__42195__$1,new cljs.core.Keyword("clojure.error","source","clojure.error/source",-2011936397),file):G__42195__$1);
var G__42195__$3 = (cljs.core.truth_((function (){var and__5000__auto__ = source__$1;
if(cljs.core.truth_(and__5000__auto__)){
return method;
} else {
return and__5000__auto__;
}
})())?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__42195__$2,new cljs.core.Keyword("clojure.error","symbol","clojure.error/symbol",1544821994),(new cljs.core.PersistentVector(null,2,(5),cljs.core.PersistentVector.EMPTY_NODE,[source__$1,method],null))):G__42195__$2);
var G__42195__$4 = (cljs.core.truth_(type)?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__42195__$3,new cljs.core.Keyword("clojure.error","class","clojure.error/class",278435890),type):G__42195__$3);
if(cljs.core.truth_(message)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__42195__$4,new cljs.core.Keyword("clojure.error","cause","clojure.error/cause",-1879175742),message);
} else {
return G__42195__$4;
}

break;
case "execution":
var vec__42209 = cljs.core.first(trace);
var source__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__42209,(0),null);
var method = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__42209,(1),null);
var file = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__42209,(2),null);
var line = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__42209,(3),null);
var file__$1 = cljs.core.first(cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (p1__42079_SHARP_){
var or__5002__auto__ = (p1__42079_SHARP_ == null);
if(or__5002__auto__){
return or__5002__auto__;
} else {
var fexpr__42212 = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, ["NO_SOURCE_PATH",null,"NO_SOURCE_FILE",null], null), null);
return (fexpr__42212.cljs$core$IFn$_invoke$arity$1 ? fexpr__42212.cljs$core$IFn$_invoke$arity$1(p1__42079_SHARP_) : fexpr__42212.call(null,p1__42079_SHARP_));
}
}),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"file","file",-1269645878).cljs$core$IFn$_invoke$arity$1(caller),file], null)));
var err_line = (function (){var or__5002__auto__ = new cljs.core.Keyword(null,"line","line",212345235).cljs$core$IFn$_invoke$arity$1(caller);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return line;
}
})();
var G__42218 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("clojure.error","class","clojure.error/class",278435890),type], null);
var G__42218__$1 = (cljs.core.truth_(err_line)?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__42218,new cljs.core.Keyword("clojure.error","line","clojure.error/line",-1816287471),err_line):G__42218);
var G__42218__$2 = (cljs.core.truth_(message)?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__42218__$1,new cljs.core.Keyword("clojure.error","cause","clojure.error/cause",-1879175742),message):G__42218__$1);
var G__42218__$3 = (cljs.core.truth_((function (){var or__5002__auto__ = fn;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var and__5000__auto__ = source__$1;
if(cljs.core.truth_(and__5000__auto__)){
return method;
} else {
return and__5000__auto__;
}
}
})())?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__42218__$2,new cljs.core.Keyword("clojure.error","symbol","clojure.error/symbol",1544821994),(function (){var or__5002__auto__ = fn;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return (new cljs.core.PersistentVector(null,2,(5),cljs.core.PersistentVector.EMPTY_NODE,[source__$1,method],null));
}
})()):G__42218__$2);
var G__42218__$4 = (cljs.core.truth_(file__$1)?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__42218__$3,new cljs.core.Keyword("clojure.error","source","clojure.error/source",-2011936397),file__$1):G__42218__$3);
if(cljs.core.truth_(problems)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__42218__$4,new cljs.core.Keyword("clojure.error","spec","clojure.error/spec",2055032595),data);
} else {
return G__42218__$4;
}

break;
default:
throw (new Error(["No matching clause: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(G__42146__$1)].join('')));

}
})(),new cljs.core.Keyword("clojure.error","phase","clojure.error/phase",275140358),phase);
});
/**
 * Returns a string from exception data, as produced by ex-triage.
 *   The first line summarizes the exception phase and location.
 *   The subsequent lines describe the cause.
 */
cljs.repl.ex_str = (function cljs$repl$ex_str(p__42232){
var map__42233 = p__42232;
var map__42233__$1 = cljs.core.__destructure_map(map__42233);
var triage_data = map__42233__$1;
var phase = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__42233__$1,new cljs.core.Keyword("clojure.error","phase","clojure.error/phase",275140358));
var source = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__42233__$1,new cljs.core.Keyword("clojure.error","source","clojure.error/source",-2011936397));
var line = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__42233__$1,new cljs.core.Keyword("clojure.error","line","clojure.error/line",-1816287471));
var column = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__42233__$1,new cljs.core.Keyword("clojure.error","column","clojure.error/column",304721553));
var symbol = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__42233__$1,new cljs.core.Keyword("clojure.error","symbol","clojure.error/symbol",1544821994));
var class$ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__42233__$1,new cljs.core.Keyword("clojure.error","class","clojure.error/class",278435890));
var cause = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__42233__$1,new cljs.core.Keyword("clojure.error","cause","clojure.error/cause",-1879175742));
var spec = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__42233__$1,new cljs.core.Keyword("clojure.error","spec","clojure.error/spec",2055032595));
var loc = [cljs.core.str.cljs$core$IFn$_invoke$arity$1((function (){var or__5002__auto__ = source;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return "<cljs repl>";
}
})()),":",cljs.core.str.cljs$core$IFn$_invoke$arity$1((function (){var or__5002__auto__ = line;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return (1);
}
})()),(cljs.core.truth_(column)?[":",cljs.core.str.cljs$core$IFn$_invoke$arity$1(column)].join(''):"")].join('');
var class_name = cljs.core.name((function (){var or__5002__auto__ = class$;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return "";
}
})());
var simple_class = class_name;
var cause_type = ((cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, ["RuntimeException",null,"Exception",null], null), null),simple_class))?"":[" (",simple_class,")"].join(''));
var format = goog.string.format;
var G__42243 = phase;
var G__42243__$1 = (((G__42243 instanceof cljs.core.Keyword))?G__42243.fqn:null);
switch (G__42243__$1) {
case "read-source":
return (format.cljs$core$IFn$_invoke$arity$3 ? format.cljs$core$IFn$_invoke$arity$3("Syntax error reading source at (%s).\n%s\n",loc,cause) : format.call(null,"Syntax error reading source at (%s).\n%s\n",loc,cause));

break;
case "macro-syntax-check":
var G__42245 = "Syntax error macroexpanding %sat (%s).\n%s";
var G__42246 = (cljs.core.truth_(symbol)?[cljs.core.str.cljs$core$IFn$_invoke$arity$1(symbol)," "].join(''):"");
var G__42247 = loc;
var G__42248 = (cljs.core.truth_(spec)?(function (){var sb__5647__auto__ = (new goog.string.StringBuffer());
var _STAR_print_newline_STAR__orig_val__42249_42406 = cljs.core._STAR_print_newline_STAR_;
var _STAR_print_fn_STAR__orig_val__42250_42407 = cljs.core._STAR_print_fn_STAR_;
var _STAR_print_newline_STAR__temp_val__42251_42408 = true;
var _STAR_print_fn_STAR__temp_val__42252_42409 = (function (x__5648__auto__){
return sb__5647__auto__.append(x__5648__auto__);
});
(cljs.core._STAR_print_newline_STAR_ = _STAR_print_newline_STAR__temp_val__42251_42408);

(cljs.core._STAR_print_fn_STAR_ = _STAR_print_fn_STAR__temp_val__42252_42409);

try{cljs.spec.alpha.explain_out(cljs.core.update.cljs$core$IFn$_invoke$arity$3(spec,new cljs.core.Keyword("cljs.spec.alpha","problems","cljs.spec.alpha/problems",447400814),(function (probs){
return cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__42225_SHARP_){
return cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(p1__42225_SHARP_,new cljs.core.Keyword(null,"in","in",-1531184865));
}),probs);
}))
);
}finally {(cljs.core._STAR_print_fn_STAR_ = _STAR_print_fn_STAR__orig_val__42250_42407);

(cljs.core._STAR_print_newline_STAR_ = _STAR_print_newline_STAR__orig_val__42249_42406);
}
return cljs.core.str.cljs$core$IFn$_invoke$arity$1(sb__5647__auto__);
})():(format.cljs$core$IFn$_invoke$arity$2 ? format.cljs$core$IFn$_invoke$arity$2("%s\n",cause) : format.call(null,"%s\n",cause)));
return (format.cljs$core$IFn$_invoke$arity$4 ? format.cljs$core$IFn$_invoke$arity$4(G__42245,G__42246,G__42247,G__42248) : format.call(null,G__42245,G__42246,G__42247,G__42248));

break;
case "macroexpansion":
var G__42256 = "Unexpected error%s macroexpanding %sat (%s).\n%s\n";
var G__42257 = cause_type;
var G__42258 = (cljs.core.truth_(symbol)?[cljs.core.str.cljs$core$IFn$_invoke$arity$1(symbol)," "].join(''):"");
var G__42259 = loc;
var G__42260 = cause;
return (format.cljs$core$IFn$_invoke$arity$5 ? format.cljs$core$IFn$_invoke$arity$5(G__42256,G__42257,G__42258,G__42259,G__42260) : format.call(null,G__42256,G__42257,G__42258,G__42259,G__42260));

break;
case "compile-syntax-check":
var G__42263 = "Syntax error%s compiling %sat (%s).\n%s\n";
var G__42264 = cause_type;
var G__42265 = (cljs.core.truth_(symbol)?[cljs.core.str.cljs$core$IFn$_invoke$arity$1(symbol)," "].join(''):"");
var G__42266 = loc;
var G__42267 = cause;
return (format.cljs$core$IFn$_invoke$arity$5 ? format.cljs$core$IFn$_invoke$arity$5(G__42263,G__42264,G__42265,G__42266,G__42267) : format.call(null,G__42263,G__42264,G__42265,G__42266,G__42267));

break;
case "compilation":
var G__42272 = "Unexpected error%s compiling %sat (%s).\n%s\n";
var G__42273 = cause_type;
var G__42274 = (cljs.core.truth_(symbol)?[cljs.core.str.cljs$core$IFn$_invoke$arity$1(symbol)," "].join(''):"");
var G__42275 = loc;
var G__42276 = cause;
return (format.cljs$core$IFn$_invoke$arity$5 ? format.cljs$core$IFn$_invoke$arity$5(G__42272,G__42273,G__42274,G__42275,G__42276) : format.call(null,G__42272,G__42273,G__42274,G__42275,G__42276));

break;
case "read-eval-result":
return (format.cljs$core$IFn$_invoke$arity$5 ? format.cljs$core$IFn$_invoke$arity$5("Error reading eval result%s at %s (%s).\n%s\n",cause_type,symbol,loc,cause) : format.call(null,"Error reading eval result%s at %s (%s).\n%s\n",cause_type,symbol,loc,cause));

break;
case "print-eval-result":
return (format.cljs$core$IFn$_invoke$arity$5 ? format.cljs$core$IFn$_invoke$arity$5("Error printing return value%s at %s (%s).\n%s\n",cause_type,symbol,loc,cause) : format.call(null,"Error printing return value%s at %s (%s).\n%s\n",cause_type,symbol,loc,cause));

break;
case "execution":
if(cljs.core.truth_(spec)){
var G__42278 = "Execution error - invalid arguments to %s at (%s).\n%s";
var G__42279 = symbol;
var G__42280 = loc;
var G__42281 = (function (){var sb__5647__auto__ = (new goog.string.StringBuffer());
var _STAR_print_newline_STAR__orig_val__42282_42411 = cljs.core._STAR_print_newline_STAR_;
var _STAR_print_fn_STAR__orig_val__42283_42412 = cljs.core._STAR_print_fn_STAR_;
var _STAR_print_newline_STAR__temp_val__42284_42413 = true;
var _STAR_print_fn_STAR__temp_val__42285_42414 = (function (x__5648__auto__){
return sb__5647__auto__.append(x__5648__auto__);
});
(cljs.core._STAR_print_newline_STAR_ = _STAR_print_newline_STAR__temp_val__42284_42413);

(cljs.core._STAR_print_fn_STAR_ = _STAR_print_fn_STAR__temp_val__42285_42414);

try{cljs.spec.alpha.explain_out(cljs.core.update.cljs$core$IFn$_invoke$arity$3(spec,new cljs.core.Keyword("cljs.spec.alpha","problems","cljs.spec.alpha/problems",447400814),(function (probs){
return cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__42230_SHARP_){
return cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(p1__42230_SHARP_,new cljs.core.Keyword(null,"in","in",-1531184865));
}),probs);
}))
);
}finally {(cljs.core._STAR_print_fn_STAR_ = _STAR_print_fn_STAR__orig_val__42283_42412);

(cljs.core._STAR_print_newline_STAR_ = _STAR_print_newline_STAR__orig_val__42282_42411);
}
return cljs.core.str.cljs$core$IFn$_invoke$arity$1(sb__5647__auto__);
})();
return (format.cljs$core$IFn$_invoke$arity$4 ? format.cljs$core$IFn$_invoke$arity$4(G__42278,G__42279,G__42280,G__42281) : format.call(null,G__42278,G__42279,G__42280,G__42281));
} else {
var G__42290 = "Execution error%s at %s(%s).\n%s\n";
var G__42291 = cause_type;
var G__42292 = (cljs.core.truth_(symbol)?[cljs.core.str.cljs$core$IFn$_invoke$arity$1(symbol)," "].join(''):"");
var G__42293 = loc;
var G__42294 = cause;
return (format.cljs$core$IFn$_invoke$arity$5 ? format.cljs$core$IFn$_invoke$arity$5(G__42290,G__42291,G__42292,G__42293,G__42294) : format.call(null,G__42290,G__42291,G__42292,G__42293,G__42294));
}

break;
default:
throw (new Error(["No matching clause: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(G__42243__$1)].join('')));

}
});
cljs.repl.error__GT_str = (function cljs$repl$error__GT_str(error){
return cljs.repl.ex_str(cljs.repl.ex_triage(cljs.repl.Error__GT_map(error)));
});

//# sourceMappingURL=cljs.repl.js.map
