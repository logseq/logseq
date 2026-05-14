goog.provide('cljs.repl');
cljs.repl.print_doc = (function cljs$repl$print_doc(p__41629){
var map__41631 = p__41629;
var map__41631__$1 = cljs.core.__destructure_map(map__41631);
var m = map__41631__$1;
var n = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__41631__$1,new cljs.core.Keyword(null,"ns","ns",441598760));
var nm = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__41631__$1,new cljs.core.Keyword(null,"name","name",1843675177));
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
var seq__41636_42172 = cljs.core.seq(new cljs.core.Keyword(null,"forms","forms",2045992350).cljs$core$IFn$_invoke$arity$1(m));
var chunk__41637_42173 = null;
var count__41638_42174 = (0);
var i__41639_42175 = (0);
while(true){
if((i__41639_42175 < count__41638_42174)){
var f_42179 = chunk__41637_42173.cljs$core$IIndexed$_nth$arity$2(null,i__41639_42175);
cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["  ",f_42179], 0));


var G__42180 = seq__41636_42172;
var G__42181 = chunk__41637_42173;
var G__42182 = count__41638_42174;
var G__42183 = (i__41639_42175 + (1));
seq__41636_42172 = G__42180;
chunk__41637_42173 = G__42181;
count__41638_42174 = G__42182;
i__41639_42175 = G__42183;
continue;
} else {
var temp__5804__auto___42184 = cljs.core.seq(seq__41636_42172);
if(temp__5804__auto___42184){
var seq__41636_42186__$1 = temp__5804__auto___42184;
if(cljs.core.chunked_seq_QMARK_(seq__41636_42186__$1)){
var c__5525__auto___42187 = cljs.core.chunk_first(seq__41636_42186__$1);
var G__42188 = cljs.core.chunk_rest(seq__41636_42186__$1);
var G__42189 = c__5525__auto___42187;
var G__42190 = cljs.core.count(c__5525__auto___42187);
var G__42191 = (0);
seq__41636_42172 = G__42188;
chunk__41637_42173 = G__42189;
count__41638_42174 = G__42190;
i__41639_42175 = G__42191;
continue;
} else {
var f_42192 = cljs.core.first(seq__41636_42186__$1);
cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["  ",f_42192], 0));


var G__42193 = cljs.core.next(seq__41636_42186__$1);
var G__42194 = null;
var G__42195 = (0);
var G__42196 = (0);
seq__41636_42172 = G__42193;
chunk__41637_42173 = G__42194;
count__41638_42174 = G__42195;
i__41639_42175 = G__42196;
continue;
}
} else {
}
}
break;
}
} else {
if(cljs.core.truth_(new cljs.core.Keyword(null,"arglists","arglists",1661989754).cljs$core$IFn$_invoke$arity$1(m))){
var arglists_42197 = new cljs.core.Keyword(null,"arglists","arglists",1661989754).cljs$core$IFn$_invoke$arity$1(m);
if(cljs.core.truth_((function (){var or__5002__auto__ = new cljs.core.Keyword(null,"macro","macro",-867863404).cljs$core$IFn$_invoke$arity$1(m);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword(null,"repl-special-function","repl-special-function",1262603725).cljs$core$IFn$_invoke$arity$1(m);
}
})())){
cljs.core.prn.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([arglists_42197], 0));
} else {
cljs.core.prn.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Symbol(null,"quote","quote",1377916282,null),cljs.core.first(arglists_42197)))?cljs.core.second(arglists_42197):arglists_42197)], 0));
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
var seq__41661_42200 = cljs.core.seq(new cljs.core.Keyword(null,"methods","methods",453930866).cljs$core$IFn$_invoke$arity$1(m));
var chunk__41662_42201 = null;
var count__41663_42202 = (0);
var i__41664_42203 = (0);
while(true){
if((i__41664_42203 < count__41663_42202)){
var vec__41979_42205 = chunk__41662_42201.cljs$core$IIndexed$_nth$arity$2(null,i__41664_42203);
var name_42206 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__41979_42205,(0),null);
var map__41983_42207 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__41979_42205,(1),null);
var map__41983_42208__$1 = cljs.core.__destructure_map(map__41983_42207);
var doc_42209 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__41983_42208__$1,new cljs.core.Keyword(null,"doc","doc",1913296891));
var arglists_42210 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__41983_42208__$1,new cljs.core.Keyword(null,"arglists","arglists",1661989754));
cljs.core.println();

cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([" ",name_42206], 0));

cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([" ",arglists_42210], 0));

if(cljs.core.truth_(doc_42209)){
cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([" ",doc_42209], 0));
} else {
}


var G__42212 = seq__41661_42200;
var G__42213 = chunk__41662_42201;
var G__42214 = count__41663_42202;
var G__42215 = (i__41664_42203 + (1));
seq__41661_42200 = G__42212;
chunk__41662_42201 = G__42213;
count__41663_42202 = G__42214;
i__41664_42203 = G__42215;
continue;
} else {
var temp__5804__auto___42216 = cljs.core.seq(seq__41661_42200);
if(temp__5804__auto___42216){
var seq__41661_42219__$1 = temp__5804__auto___42216;
if(cljs.core.chunked_seq_QMARK_(seq__41661_42219__$1)){
var c__5525__auto___42222 = cljs.core.chunk_first(seq__41661_42219__$1);
var G__42223 = cljs.core.chunk_rest(seq__41661_42219__$1);
var G__42224 = c__5525__auto___42222;
var G__42225 = cljs.core.count(c__5525__auto___42222);
var G__42226 = (0);
seq__41661_42200 = G__42223;
chunk__41662_42201 = G__42224;
count__41663_42202 = G__42225;
i__41664_42203 = G__42226;
continue;
} else {
var vec__41985_42227 = cljs.core.first(seq__41661_42219__$1);
var name_42228 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__41985_42227,(0),null);
var map__41988_42229 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__41985_42227,(1),null);
var map__41988_42230__$1 = cljs.core.__destructure_map(map__41988_42229);
var doc_42231 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__41988_42230__$1,new cljs.core.Keyword(null,"doc","doc",1913296891));
var arglists_42232 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__41988_42230__$1,new cljs.core.Keyword(null,"arglists","arglists",1661989754));
cljs.core.println();

cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([" ",name_42228], 0));

cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([" ",arglists_42232], 0));

if(cljs.core.truth_(doc_42231)){
cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([" ",doc_42231], 0));
} else {
}


var G__42233 = cljs.core.next(seq__41661_42219__$1);
var G__42234 = null;
var G__42235 = (0);
var G__42236 = (0);
seq__41661_42200 = G__42233;
chunk__41662_42201 = G__42234;
count__41663_42202 = G__42235;
i__41664_42203 = G__42236;
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

var seq__41994 = cljs.core.seq(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"args","args",1315556576),new cljs.core.Keyword(null,"ret","ret",-468222814),new cljs.core.Keyword(null,"fn","fn",-1175266204)], null));
var chunk__41995 = null;
var count__41996 = (0);
var i__41997 = (0);
while(true){
if((i__41997 < count__41996)){
var role = chunk__41995.cljs$core$IIndexed$_nth$arity$2(null,i__41997);
var temp__5804__auto___42238__$1 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(fnspec,role);
if(cljs.core.truth_(temp__5804__auto___42238__$1)){
var spec_42239 = temp__5804__auto___42238__$1;
cljs.core.print.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([["\n ",cljs.core.name(role),":"].join(''),cljs.spec.alpha.describe(spec_42239)], 0));
} else {
}


var G__42240 = seq__41994;
var G__42241 = chunk__41995;
var G__42242 = count__41996;
var G__42243 = (i__41997 + (1));
seq__41994 = G__42240;
chunk__41995 = G__42241;
count__41996 = G__42242;
i__41997 = G__42243;
continue;
} else {
var temp__5804__auto____$1 = cljs.core.seq(seq__41994);
if(temp__5804__auto____$1){
var seq__41994__$1 = temp__5804__auto____$1;
if(cljs.core.chunked_seq_QMARK_(seq__41994__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__41994__$1);
var G__42244 = cljs.core.chunk_rest(seq__41994__$1);
var G__42245 = c__5525__auto__;
var G__42246 = cljs.core.count(c__5525__auto__);
var G__42247 = (0);
seq__41994 = G__42244;
chunk__41995 = G__42245;
count__41996 = G__42246;
i__41997 = G__42247;
continue;
} else {
var role = cljs.core.first(seq__41994__$1);
var temp__5804__auto___42248__$2 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(fnspec,role);
if(cljs.core.truth_(temp__5804__auto___42248__$2)){
var spec_42249 = temp__5804__auto___42248__$2;
cljs.core.print.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([["\n ",cljs.core.name(role),":"].join(''),cljs.spec.alpha.describe(spec_42249)], 0));
} else {
}


var G__42253 = cljs.core.next(seq__41994__$1);
var G__42254 = null;
var G__42255 = (0);
var G__42256 = (0);
seq__41994 = G__42253;
chunk__41995 = G__42254;
count__41996 = G__42255;
i__41997 = G__42256;
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
var map__42020 = datafied_throwable;
var map__42020__$1 = cljs.core.__destructure_map(map__42020);
var via = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__42020__$1,new cljs.core.Keyword(null,"via","via",-1904457336));
var trace = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__42020__$1,new cljs.core.Keyword(null,"trace","trace",-1082747415));
var phase = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__42020__$1,new cljs.core.Keyword(null,"phase","phase",575722892),new cljs.core.Keyword(null,"execution","execution",253283524));
var map__42022 = cljs.core.last(via);
var map__42022__$1 = cljs.core.__destructure_map(map__42022);
var type = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__42022__$1,new cljs.core.Keyword(null,"type","type",1174270348));
var message = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__42022__$1,new cljs.core.Keyword(null,"message","message",-406056002));
var data = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__42022__$1,new cljs.core.Keyword(null,"data","data",-232669377));
var map__42024 = data;
var map__42024__$1 = cljs.core.__destructure_map(map__42024);
var problems = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__42024__$1,new cljs.core.Keyword("cljs.spec.alpha","problems","cljs.spec.alpha/problems",447400814));
var fn = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__42024__$1,new cljs.core.Keyword("cljs.spec.alpha","fn","cljs.spec.alpha/fn",408600443));
var caller = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__42024__$1,new cljs.core.Keyword("cljs.spec.test.alpha","caller","cljs.spec.test.alpha/caller",-398302390));
var map__42025 = new cljs.core.Keyword(null,"data","data",-232669377).cljs$core$IFn$_invoke$arity$1(cljs.core.first(via));
var map__42025__$1 = cljs.core.__destructure_map(map__42025);
var top_data = map__42025__$1;
var source = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__42025__$1,new cljs.core.Keyword("clojure.error","source","clojure.error/source",-2011936397));
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3((function (){var G__42027 = phase;
var G__42027__$1 = (((G__42027 instanceof cljs.core.Keyword))?G__42027.fqn:null);
switch (G__42027__$1) {
case "read-source":
var map__42029 = data;
var map__42029__$1 = cljs.core.__destructure_map(map__42029);
var line = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__42029__$1,new cljs.core.Keyword("clojure.error","line","clojure.error/line",-1816287471));
var column = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__42029__$1,new cljs.core.Keyword("clojure.error","column","clojure.error/column",304721553));
var G__42033 = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"data","data",-232669377).cljs$core$IFn$_invoke$arity$1(cljs.core.second(via)),top_data], 0));
var G__42033__$1 = (cljs.core.truth_(source)?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__42033,new cljs.core.Keyword("clojure.error","source","clojure.error/source",-2011936397),source):G__42033);
var G__42033__$2 = (cljs.core.truth_((function (){var fexpr__42034 = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, ["NO_SOURCE_PATH",null,"NO_SOURCE_FILE",null], null), null);
return (fexpr__42034.cljs$core$IFn$_invoke$arity$1 ? fexpr__42034.cljs$core$IFn$_invoke$arity$1(source) : fexpr__42034.call(null,source));
})())?cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(G__42033__$1,new cljs.core.Keyword("clojure.error","source","clojure.error/source",-2011936397)):G__42033__$1);
if(cljs.core.truth_(message)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__42033__$2,new cljs.core.Keyword("clojure.error","cause","clojure.error/cause",-1879175742),message);
} else {
return G__42033__$2;
}

break;
case "compile-syntax-check":
case "compilation":
case "macro-syntax-check":
case "macroexpansion":
var G__42036 = top_data;
var G__42036__$1 = (cljs.core.truth_(source)?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__42036,new cljs.core.Keyword("clojure.error","source","clojure.error/source",-2011936397),source):G__42036);
var G__42036__$2 = (cljs.core.truth_((function (){var fexpr__42037 = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, ["NO_SOURCE_PATH",null,"NO_SOURCE_FILE",null], null), null);
return (fexpr__42037.cljs$core$IFn$_invoke$arity$1 ? fexpr__42037.cljs$core$IFn$_invoke$arity$1(source) : fexpr__42037.call(null,source));
})())?cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(G__42036__$1,new cljs.core.Keyword("clojure.error","source","clojure.error/source",-2011936397)):G__42036__$1);
var G__42036__$3 = (cljs.core.truth_(type)?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__42036__$2,new cljs.core.Keyword("clojure.error","class","clojure.error/class",278435890),type):G__42036__$2);
var G__42036__$4 = (cljs.core.truth_(message)?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__42036__$3,new cljs.core.Keyword("clojure.error","cause","clojure.error/cause",-1879175742),message):G__42036__$3);
if(cljs.core.truth_(problems)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__42036__$4,new cljs.core.Keyword("clojure.error","spec","clojure.error/spec",2055032595),data);
} else {
return G__42036__$4;
}

break;
case "read-eval-result":
case "print-eval-result":
var vec__42040 = cljs.core.first(trace);
var source__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__42040,(0),null);
var method = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__42040,(1),null);
var file = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__42040,(2),null);
var line = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__42040,(3),null);
var G__42043 = top_data;
var G__42043__$1 = (cljs.core.truth_(line)?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__42043,new cljs.core.Keyword("clojure.error","line","clojure.error/line",-1816287471),line):G__42043);
var G__42043__$2 = (cljs.core.truth_(file)?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__42043__$1,new cljs.core.Keyword("clojure.error","source","clojure.error/source",-2011936397),file):G__42043__$1);
var G__42043__$3 = (cljs.core.truth_((function (){var and__5000__auto__ = source__$1;
if(cljs.core.truth_(and__5000__auto__)){
return method;
} else {
return and__5000__auto__;
}
})())?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__42043__$2,new cljs.core.Keyword("clojure.error","symbol","clojure.error/symbol",1544821994),(new cljs.core.PersistentVector(null,2,(5),cljs.core.PersistentVector.EMPTY_NODE,[source__$1,method],null))):G__42043__$2);
var G__42043__$4 = (cljs.core.truth_(type)?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__42043__$3,new cljs.core.Keyword("clojure.error","class","clojure.error/class",278435890),type):G__42043__$3);
if(cljs.core.truth_(message)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__42043__$4,new cljs.core.Keyword("clojure.error","cause","clojure.error/cause",-1879175742),message);
} else {
return G__42043__$4;
}

break;
case "execution":
var vec__42048 = cljs.core.first(trace);
var source__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__42048,(0),null);
var method = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__42048,(1),null);
var file = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__42048,(2),null);
var line = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__42048,(3),null);
var file__$1 = cljs.core.first(cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (p1__42017_SHARP_){
var or__5002__auto__ = (p1__42017_SHARP_ == null);
if(or__5002__auto__){
return or__5002__auto__;
} else {
var fexpr__42052 = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, ["NO_SOURCE_PATH",null,"NO_SOURCE_FILE",null], null), null);
return (fexpr__42052.cljs$core$IFn$_invoke$arity$1 ? fexpr__42052.cljs$core$IFn$_invoke$arity$1(p1__42017_SHARP_) : fexpr__42052.call(null,p1__42017_SHARP_));
}
}),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"file","file",-1269645878).cljs$core$IFn$_invoke$arity$1(caller),file], null)));
var err_line = (function (){var or__5002__auto__ = new cljs.core.Keyword(null,"line","line",212345235).cljs$core$IFn$_invoke$arity$1(caller);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return line;
}
})();
var G__42053 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("clojure.error","class","clojure.error/class",278435890),type], null);
var G__42053__$1 = (cljs.core.truth_(err_line)?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__42053,new cljs.core.Keyword("clojure.error","line","clojure.error/line",-1816287471),err_line):G__42053);
var G__42053__$2 = (cljs.core.truth_(message)?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__42053__$1,new cljs.core.Keyword("clojure.error","cause","clojure.error/cause",-1879175742),message):G__42053__$1);
var G__42053__$3 = (cljs.core.truth_((function (){var or__5002__auto__ = fn;
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
})())?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__42053__$2,new cljs.core.Keyword("clojure.error","symbol","clojure.error/symbol",1544821994),(function (){var or__5002__auto__ = fn;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return (new cljs.core.PersistentVector(null,2,(5),cljs.core.PersistentVector.EMPTY_NODE,[source__$1,method],null));
}
})()):G__42053__$2);
var G__42053__$4 = (cljs.core.truth_(file__$1)?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__42053__$3,new cljs.core.Keyword("clojure.error","source","clojure.error/source",-2011936397),file__$1):G__42053__$3);
if(cljs.core.truth_(problems)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__42053__$4,new cljs.core.Keyword("clojure.error","spec","clojure.error/spec",2055032595),data);
} else {
return G__42053__$4;
}

break;
default:
throw (new Error(["No matching clause: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(G__42027__$1)].join('')));

}
})(),new cljs.core.Keyword("clojure.error","phase","clojure.error/phase",275140358),phase);
});
/**
 * Returns a string from exception data, as produced by ex-triage.
 *   The first line summarizes the exception phase and location.
 *   The subsequent lines describe the cause.
 */
cljs.repl.ex_str = (function cljs$repl$ex_str(p__42063){
var map__42064 = p__42063;
var map__42064__$1 = cljs.core.__destructure_map(map__42064);
var triage_data = map__42064__$1;
var phase = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__42064__$1,new cljs.core.Keyword("clojure.error","phase","clojure.error/phase",275140358));
var source = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__42064__$1,new cljs.core.Keyword("clojure.error","source","clojure.error/source",-2011936397));
var line = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__42064__$1,new cljs.core.Keyword("clojure.error","line","clojure.error/line",-1816287471));
var column = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__42064__$1,new cljs.core.Keyword("clojure.error","column","clojure.error/column",304721553));
var symbol = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__42064__$1,new cljs.core.Keyword("clojure.error","symbol","clojure.error/symbol",1544821994));
var class$ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__42064__$1,new cljs.core.Keyword("clojure.error","class","clojure.error/class",278435890));
var cause = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__42064__$1,new cljs.core.Keyword("clojure.error","cause","clojure.error/cause",-1879175742));
var spec = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__42064__$1,new cljs.core.Keyword("clojure.error","spec","clojure.error/spec",2055032595));
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
var G__42085 = phase;
var G__42085__$1 = (((G__42085 instanceof cljs.core.Keyword))?G__42085.fqn:null);
switch (G__42085__$1) {
case "read-source":
return (format.cljs$core$IFn$_invoke$arity$3 ? format.cljs$core$IFn$_invoke$arity$3("Syntax error reading source at (%s).\n%s\n",loc,cause) : format.call(null,"Syntax error reading source at (%s).\n%s\n",loc,cause));

break;
case "macro-syntax-check":
var G__42086 = "Syntax error macroexpanding %sat (%s).\n%s";
var G__42087 = (cljs.core.truth_(symbol)?[cljs.core.str.cljs$core$IFn$_invoke$arity$1(symbol)," "].join(''):"");
var G__42088 = loc;
var G__42089 = (cljs.core.truth_(spec)?(function (){var sb__5647__auto__ = (new goog.string.StringBuffer());
var _STAR_print_newline_STAR__orig_val__42099_42279 = cljs.core._STAR_print_newline_STAR_;
var _STAR_print_fn_STAR__orig_val__42100_42280 = cljs.core._STAR_print_fn_STAR_;
var _STAR_print_newline_STAR__temp_val__42101_42281 = true;
var _STAR_print_fn_STAR__temp_val__42102_42282 = (function (x__5648__auto__){
return sb__5647__auto__.append(x__5648__auto__);
});
(cljs.core._STAR_print_newline_STAR_ = _STAR_print_newline_STAR__temp_val__42101_42281);

(cljs.core._STAR_print_fn_STAR_ = _STAR_print_fn_STAR__temp_val__42102_42282);

try{cljs.spec.alpha.explain_out(cljs.core.update.cljs$core$IFn$_invoke$arity$3(spec,new cljs.core.Keyword("cljs.spec.alpha","problems","cljs.spec.alpha/problems",447400814),(function (probs){
return cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__42056_SHARP_){
return cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(p1__42056_SHARP_,new cljs.core.Keyword(null,"in","in",-1531184865));
}),probs);
}))
);
}finally {(cljs.core._STAR_print_fn_STAR_ = _STAR_print_fn_STAR__orig_val__42100_42280);

(cljs.core._STAR_print_newline_STAR_ = _STAR_print_newline_STAR__orig_val__42099_42279);
}
return cljs.core.str.cljs$core$IFn$_invoke$arity$1(sb__5647__auto__);
})():(format.cljs$core$IFn$_invoke$arity$2 ? format.cljs$core$IFn$_invoke$arity$2("%s\n",cause) : format.call(null,"%s\n",cause)));
return (format.cljs$core$IFn$_invoke$arity$4 ? format.cljs$core$IFn$_invoke$arity$4(G__42086,G__42087,G__42088,G__42089) : format.call(null,G__42086,G__42087,G__42088,G__42089));

break;
case "macroexpansion":
var G__42108 = "Unexpected error%s macroexpanding %sat (%s).\n%s\n";
var G__42109 = cause_type;
var G__42110 = (cljs.core.truth_(symbol)?[cljs.core.str.cljs$core$IFn$_invoke$arity$1(symbol)," "].join(''):"");
var G__42111 = loc;
var G__42112 = cause;
return (format.cljs$core$IFn$_invoke$arity$5 ? format.cljs$core$IFn$_invoke$arity$5(G__42108,G__42109,G__42110,G__42111,G__42112) : format.call(null,G__42108,G__42109,G__42110,G__42111,G__42112));

break;
case "compile-syntax-check":
var G__42117 = "Syntax error%s compiling %sat (%s).\n%s\n";
var G__42118 = cause_type;
var G__42119 = (cljs.core.truth_(symbol)?[cljs.core.str.cljs$core$IFn$_invoke$arity$1(symbol)," "].join(''):"");
var G__42120 = loc;
var G__42121 = cause;
return (format.cljs$core$IFn$_invoke$arity$5 ? format.cljs$core$IFn$_invoke$arity$5(G__42117,G__42118,G__42119,G__42120,G__42121) : format.call(null,G__42117,G__42118,G__42119,G__42120,G__42121));

break;
case "compilation":
var G__42123 = "Unexpected error%s compiling %sat (%s).\n%s\n";
var G__42124 = cause_type;
var G__42125 = (cljs.core.truth_(symbol)?[cljs.core.str.cljs$core$IFn$_invoke$arity$1(symbol)," "].join(''):"");
var G__42126 = loc;
var G__42127 = cause;
return (format.cljs$core$IFn$_invoke$arity$5 ? format.cljs$core$IFn$_invoke$arity$5(G__42123,G__42124,G__42125,G__42126,G__42127) : format.call(null,G__42123,G__42124,G__42125,G__42126,G__42127));

break;
case "read-eval-result":
return (format.cljs$core$IFn$_invoke$arity$5 ? format.cljs$core$IFn$_invoke$arity$5("Error reading eval result%s at %s (%s).\n%s\n",cause_type,symbol,loc,cause) : format.call(null,"Error reading eval result%s at %s (%s).\n%s\n",cause_type,symbol,loc,cause));

break;
case "print-eval-result":
return (format.cljs$core$IFn$_invoke$arity$5 ? format.cljs$core$IFn$_invoke$arity$5("Error printing return value%s at %s (%s).\n%s\n",cause_type,symbol,loc,cause) : format.call(null,"Error printing return value%s at %s (%s).\n%s\n",cause_type,symbol,loc,cause));

break;
case "execution":
if(cljs.core.truth_(spec)){
var G__42135 = "Execution error - invalid arguments to %s at (%s).\n%s";
var G__42136 = symbol;
var G__42137 = loc;
var G__42138 = (function (){var sb__5647__auto__ = (new goog.string.StringBuffer());
var _STAR_print_newline_STAR__orig_val__42143_42284 = cljs.core._STAR_print_newline_STAR_;
var _STAR_print_fn_STAR__orig_val__42144_42285 = cljs.core._STAR_print_fn_STAR_;
var _STAR_print_newline_STAR__temp_val__42145_42286 = true;
var _STAR_print_fn_STAR__temp_val__42146_42287 = (function (x__5648__auto__){
return sb__5647__auto__.append(x__5648__auto__);
});
(cljs.core._STAR_print_newline_STAR_ = _STAR_print_newline_STAR__temp_val__42145_42286);

(cljs.core._STAR_print_fn_STAR_ = _STAR_print_fn_STAR__temp_val__42146_42287);

try{cljs.spec.alpha.explain_out(cljs.core.update.cljs$core$IFn$_invoke$arity$3(spec,new cljs.core.Keyword("cljs.spec.alpha","problems","cljs.spec.alpha/problems",447400814),(function (probs){
return cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__42059_SHARP_){
return cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(p1__42059_SHARP_,new cljs.core.Keyword(null,"in","in",-1531184865));
}),probs);
}))
);
}finally {(cljs.core._STAR_print_fn_STAR_ = _STAR_print_fn_STAR__orig_val__42144_42285);

(cljs.core._STAR_print_newline_STAR_ = _STAR_print_newline_STAR__orig_val__42143_42284);
}
return cljs.core.str.cljs$core$IFn$_invoke$arity$1(sb__5647__auto__);
})();
return (format.cljs$core$IFn$_invoke$arity$4 ? format.cljs$core$IFn$_invoke$arity$4(G__42135,G__42136,G__42137,G__42138) : format.call(null,G__42135,G__42136,G__42137,G__42138));
} else {
var G__42153 = "Execution error%s at %s(%s).\n%s\n";
var G__42154 = cause_type;
var G__42155 = (cljs.core.truth_(symbol)?[cljs.core.str.cljs$core$IFn$_invoke$arity$1(symbol)," "].join(''):"");
var G__42156 = loc;
var G__42157 = cause;
return (format.cljs$core$IFn$_invoke$arity$5 ? format.cljs$core$IFn$_invoke$arity$5(G__42153,G__42154,G__42155,G__42156,G__42157) : format.call(null,G__42153,G__42154,G__42155,G__42156,G__42157));
}

break;
default:
throw (new Error(["No matching clause: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(G__42085__$1)].join('')));

}
});
cljs.repl.error__GT_str = (function cljs$repl$error__GT_str(error){
return cljs.repl.ex_str(cljs.repl.ex_triage(cljs.repl.Error__GT_map(error)));
});

//# sourceMappingURL=cljs.repl.js.map
