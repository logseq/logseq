goog.provide('lambdaisland.glogi.print');
goog.scope(function(){
  lambdaisland.glogi.print.goog$module$goog$object = goog.module.get('goog.object');
});
lambdaisland.glogi.print.colors = cljs.core.PersistentHashMap.fromArrays([new cljs.core.Keyword(null,"orange","orange",73816386),new cljs.core.Keyword(null,"gray1","gray1",23549221),new cljs.core.Keyword(null,"white","white",-483998618),new cljs.core.Keyword(null,"gray3","gray3",-617553786),new cljs.core.Keyword(null,"gray4","gray4",460735815),new cljs.core.Keyword(null,"yellow","yellow",-881035449),new cljs.core.Keyword(null,"green","green",-945526839),new cljs.core.Keyword(null,"turqoise","turqoise",1674869457),new cljs.core.Keyword(null,"gray2","gray2",-1424527469),new cljs.core.Keyword(null,"red","red",-969428204),new cljs.core.Keyword(null,"blue","blue",-622100620),new cljs.core.Keyword(null,"purple","purple",-876021126),new cljs.core.Keyword(null,"gray6","gray6",-2106469670),new cljs.core.Keyword(null,"gray5","gray5",1481094938),new cljs.core.Keyword(null,"brown","brown",1414854429),new cljs.core.Keyword(null,"black","black",1294279647)],["#f5871f","#e0e0e0","#ffffff","#8e908c","#969896","#eab700","#718c00","#3e999f","#d6d6d6","#c82829","#4271ae","#8959a8","#282a2e","#4d4d4c","#a3685a","#1d1f21"]);
lambdaisland.glogi.print.level_color = (function lambdaisland$glogi$print$level_color(level){
var pred__68628 = cljs.core._LT__EQ_;
var expr__68629 = lambdaisland.glogi.level_value(level);
if(cljs.core.truth_((function (){var G__68631 = lambdaisland.glogi.level_value(new cljs.core.Keyword(null,"severe","severe",-1364500238));
var G__68632 = expr__68629;
return (pred__68628.cljs$core$IFn$_invoke$arity$2 ? pred__68628.cljs$core$IFn$_invoke$arity$2(G__68631,G__68632) : pred__68628.call(null,G__68631,G__68632));
})())){
return new cljs.core.Keyword(null,"red","red",-969428204);
} else {
if(cljs.core.truth_((function (){var G__68633 = lambdaisland.glogi.level_value(new cljs.core.Keyword(null,"warning","warning",-1685650671));
var G__68634 = expr__68629;
return (pred__68628.cljs$core$IFn$_invoke$arity$2 ? pred__68628.cljs$core$IFn$_invoke$arity$2(G__68633,G__68634) : pred__68628.call(null,G__68633,G__68634));
})())){
return new cljs.core.Keyword(null,"orange","orange",73816386);
} else {
if(cljs.core.truth_((function (){var G__68635 = lambdaisland.glogi.level_value(new cljs.core.Keyword(null,"info","info",-317069002));
var G__68636 = expr__68629;
return (pred__68628.cljs$core$IFn$_invoke$arity$2 ? pred__68628.cljs$core$IFn$_invoke$arity$2(G__68635,G__68636) : pred__68628.call(null,G__68635,G__68636));
})())){
return new cljs.core.Keyword(null,"blue","blue",-622100620);
} else {
if(cljs.core.truth_((function (){var G__68637 = lambdaisland.glogi.level_value(new cljs.core.Keyword(null,"config","config",994861415));
var G__68638 = expr__68629;
return (pred__68628.cljs$core$IFn$_invoke$arity$2 ? pred__68628.cljs$core$IFn$_invoke$arity$2(G__68637,G__68638) : pred__68628.call(null,G__68637,G__68638));
})())){
return new cljs.core.Keyword(null,"green","green",-945526839);
} else {
if(cljs.core.truth_((function (){var G__68639 = lambdaisland.glogi.level_value(new cljs.core.Keyword(null,"fine","fine",-873037193));
var G__68640 = expr__68629;
return (pred__68628.cljs$core$IFn$_invoke$arity$2 ? pred__68628.cljs$core$IFn$_invoke$arity$2(G__68639,G__68640) : pred__68628.call(null,G__68639,G__68640));
})())){
return new cljs.core.Keyword(null,"yellow","yellow",-881035449);
} else {
if(cljs.core.truth_((function (){var G__68641 = lambdaisland.glogi.level_value(new cljs.core.Keyword(null,"finer","finer",974902846));
var G__68642 = expr__68629;
return (pred__68628.cljs$core$IFn$_invoke$arity$2 ? pred__68628.cljs$core$IFn$_invoke$arity$2(G__68641,G__68642) : pred__68628.call(null,G__68641,G__68642));
})())){
return new cljs.core.Keyword(null,"gray3","gray3",-617553786);
} else {
if(cljs.core.truth_((function (){var G__68643 = lambdaisland.glogi.level_value(new cljs.core.Keyword(null,"finest","finest",-1359568890));
var G__68644 = expr__68629;
return (pred__68628.cljs$core$IFn$_invoke$arity$2 ? pred__68628.cljs$core$IFn$_invoke$arity$2(G__68643,G__68644) : pred__68628.call(null,G__68643,G__68644));
})())){
return new cljs.core.Keyword(null,"gray4","gray4",460735815);
} else {
return new cljs.core.Keyword(null,"gray2","gray2",-1424527469);
}
}
}
}
}
}
}
});
lambdaisland.glogi.print.add = (function lambdaisland$glogi$print$add(var_args){
var G__68657 = arguments.length;
switch (G__68657) {
case 2:
return lambdaisland.glogi.print.add.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return lambdaisland.glogi.print.add.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
case 4:
return lambdaisland.glogi.print.add.cljs$core$IFn$_invoke$arity$4((arguments[(0)]),(arguments[(1)]),(arguments[(2)]),(arguments[(3)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(lambdaisland.glogi.print.add.cljs$core$IFn$_invoke$arity$2 = (function (p__68667,s){
var vec__68669 = p__68667;
var res = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__68669,(0),null);
var res_css = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__68669,(1),null);
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [[cljs.core.str.cljs$core$IFn$_invoke$arity$1(res),cljs.core.str.cljs$core$IFn$_invoke$arity$1(s)].join(''),res_css], null);
}));

(lambdaisland.glogi.print.add.cljs$core$IFn$_invoke$arity$3 = (function (p__68676,s,color){
var vec__68677 = p__68676;
var res = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__68677,(0),null);
var res_css = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__68677,(1),null);
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [[cljs.core.str.cljs$core$IFn$_invoke$arity$1(res),"%c",cljs.core.str.cljs$core$IFn$_invoke$arity$1(s),"%c"].join(''),cljs.core.conj.cljs$core$IFn$_invoke$arity$variadic(res_css,["color:",cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.get.cljs$core$IFn$_invoke$arity$2(lambdaisland.glogi.print.colors,color))].join(''),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["color:black"], 0))], null);
}));

(lambdaisland.glogi.print.add.cljs$core$IFn$_invoke$arity$4 = (function (p__68690,s,fg,bg){
var vec__68694 = p__68690;
var res = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__68694,(0),null);
var res_css = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__68694,(1),null);
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [[cljs.core.str.cljs$core$IFn$_invoke$arity$1(res),"%c",cljs.core.str.cljs$core$IFn$_invoke$arity$1(s),"%c"].join(''),cljs.core.conj.cljs$core$IFn$_invoke$arity$variadic(res_css,["color:",cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.get.cljs$core$IFn$_invoke$arity$2(lambdaisland.glogi.print.colors,fg)),";background-color:",cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.get.cljs$core$IFn$_invoke$arity$2(lambdaisland.glogi.print.colors,bg))].join(''),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["color:black;background-color:inherit"], 0))], null);
}));

(lambdaisland.glogi.print.add.cljs$lang$maxFixedArity = 4);

lambdaisland.glogi.print.print_console_log_css = (function lambdaisland$glogi$print$print_console_log_css(res,value){
while(true){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("lambdaisland.glogi.print","comma","lambdaisland.glogi.print/comma",-725182078),value)){
return lambdaisland.glogi.print.add.cljs$core$IFn$_invoke$arity$3(res,", ",new cljs.core.Keyword(null,"gray2","gray2",-1424527469));
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("lambdaisland.glogi.print","space","lambdaisland.glogi.print/space",1682088588),value)){
return lambdaisland.glogi.print.add.cljs$core$IFn$_invoke$arity$2(res," ");
} else {
if((value instanceof cljs.core.Keyword)){
return lambdaisland.glogi.print.add.cljs$core$IFn$_invoke$arity$3(res,value,new cljs.core.Keyword(null,"blue","blue",-622100620));
} else {
if((value instanceof cljs.core.Symbol)){
return lambdaisland.glogi.print.add.cljs$core$IFn$_invoke$arity$3(res,value,new cljs.core.Keyword(null,"green","green",-945526839));
} else {
if(typeof value === 'string'){
return lambdaisland.glogi.print.add.cljs$core$IFn$_invoke$arity$3(res,cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([value], 0)),new cljs.core.Keyword(null,"turqoise","turqoise",1674869457));
} else {
if(cljs.core.map_entry_QMARK_(value)){
var G__68727 = lambdaisland.glogi.print.add.cljs$core$IFn$_invoke$arity$2((function (){var G__68730 = res;
var G__68731 = cljs.core.key(value);
return (lambdaisland.glogi.print.print_console_log_css.cljs$core$IFn$_invoke$arity$2 ? lambdaisland.glogi.print.print_console_log_css.cljs$core$IFn$_invoke$arity$2(G__68730,G__68731) : lambdaisland.glogi.print.print_console_log_css.call(null,G__68730,G__68731));
})()," ");
var G__68728 = cljs.core.val(value);
return (lambdaisland.glogi.print.print_console_log_css.cljs$core$IFn$_invoke$arity$2 ? lambdaisland.glogi.print.print_console_log_css.cljs$core$IFn$_invoke$arity$2(G__68727,G__68728) : lambdaisland.glogi.print.print_console_log_css.call(null,G__68727,G__68728));
} else {
if((((value instanceof cljs.core.PersistentArrayMap)) || ((value instanceof cljs.core.PersistentHashMap)))){
var _PERCENT_ = res;
var _PERCENT___$1 = lambdaisland.glogi.print.add.cljs$core$IFn$_invoke$arity$3(_PERCENT_,"{",new cljs.core.Keyword(null,"purple","purple",-876021126));
var _PERCENT___$2 = cljs.core.reduce.cljs$core$IFn$_invoke$arity$3(lambdaisland.glogi.print.print_console_log_css,_PERCENT___$1,cljs.core.interpose.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("lambdaisland.glogi.print","comma","lambdaisland.glogi.print/comma",-725182078),value));
return lambdaisland.glogi.print.add.cljs$core$IFn$_invoke$arity$3(_PERCENT___$2,"}",new cljs.core.Keyword(null,"purple","purple",-876021126));
} else {
if(cljs.core.map_QMARK_(value)){
var _PERCENT_ = res;
var _PERCENT___$1 = lambdaisland.glogi.print.add.cljs$core$IFn$_invoke$arity$3(_PERCENT_,["#",cljs.core.str.cljs$core$IFn$_invoke$arity$1((function (){var t = cljs.core.type(value);
var n = t.name;
if(cljs.core.empty_QMARK_(n)){
return cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([t], 0));
} else {
return n;
}
})())," "].join(''),new cljs.core.Keyword(null,"brown","brown",1414854429));
var _PERCENT___$2 = lambdaisland.glogi.print.add.cljs$core$IFn$_invoke$arity$3(_PERCENT___$1,"{",new cljs.core.Keyword(null,"purple","purple",-876021126));
var _PERCENT___$3 = cljs.core.reduce.cljs$core$IFn$_invoke$arity$3(lambdaisland.glogi.print.print_console_log_css,_PERCENT___$2,cljs.core.interpose.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("lambdaisland.glogi.print","comma","lambdaisland.glogi.print/comma",-725182078),value));
return lambdaisland.glogi.print.add.cljs$core$IFn$_invoke$arity$3(_PERCENT___$3,"}",new cljs.core.Keyword(null,"purple","purple",-876021126));
} else {
if(cljs.core.set_QMARK_(value)){
var _PERCENT_ = res;
var _PERCENT___$1 = lambdaisland.glogi.print.add.cljs$core$IFn$_invoke$arity$3(_PERCENT_,"#{",new cljs.core.Keyword(null,"purple","purple",-876021126));
var _PERCENT___$2 = cljs.core.reduce.cljs$core$IFn$_invoke$arity$3(lambdaisland.glogi.print.print_console_log_css,_PERCENT___$1,cljs.core.interpose.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("lambdaisland.glogi.print","space","lambdaisland.glogi.print/space",1682088588),value));
return lambdaisland.glogi.print.add.cljs$core$IFn$_invoke$arity$3(_PERCENT___$2,"}",new cljs.core.Keyword(null,"purple","purple",-876021126));
} else {
if(cljs.core.vector_QMARK_(value)){
var _PERCENT_ = res;
var _PERCENT___$1 = lambdaisland.glogi.print.add.cljs$core$IFn$_invoke$arity$3(_PERCENT_,"[",new cljs.core.Keyword(null,"purple","purple",-876021126));
var _PERCENT___$2 = cljs.core.reduce.cljs$core$IFn$_invoke$arity$3(lambdaisland.glogi.print.print_console_log_css,_PERCENT___$1,cljs.core.interpose.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("lambdaisland.glogi.print","space","lambdaisland.glogi.print/space",1682088588),value));
return lambdaisland.glogi.print.add.cljs$core$IFn$_invoke$arity$3(_PERCENT___$2,"]",new cljs.core.Keyword(null,"purple","purple",-876021126));
} else {
if((value instanceof cljs.core.PersistentQueue)){
var G__68921 = lambdaisland.glogi.print.add.cljs$core$IFn$_invoke$arity$3(res,"#queue ",new cljs.core.Keyword(null,"brown","brown",1414854429));
var G__68922 = cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentVector.EMPTY,value);
res = G__68921;
value = G__68922;
continue;
} else {
if(cljs.core.seq_QMARK_(value)){
var _PERCENT_ = res;
var _PERCENT___$1 = lambdaisland.glogi.print.add.cljs$core$IFn$_invoke$arity$3(_PERCENT_,"(",new cljs.core.Keyword(null,"brown","brown",1414854429));
var _PERCENT___$2 = cljs.core.reduce.cljs$core$IFn$_invoke$arity$3(lambdaisland.glogi.print.print_console_log_css,_PERCENT___$1,cljs.core.interpose.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("lambdaisland.glogi.print","space","lambdaisland.glogi.print/space",1682088588),value));
return lambdaisland.glogi.print.add.cljs$core$IFn$_invoke$arity$3(_PERCENT___$2,")",new cljs.core.Keyword(null,"brown","brown",1414854429));
} else {
if((((!((value == null))))?(((((value.cljs$lang$protocol_mask$partition1$ & (16384))) || ((cljs.core.PROTOCOL_SENTINEL === value.cljs$core$IAtom$))))?true:(((!value.cljs$lang$protocol_mask$partition1$))?cljs.core.native_satisfies_QMARK_(cljs.core.IAtom,value):false)):cljs.core.native_satisfies_QMARK_(cljs.core.IAtom,value))){
var G__68923 = lambdaisland.glogi.print.add.cljs$core$IFn$_invoke$arity$3(res,"#atom ",new cljs.core.Keyword(null,"brown","brown",1414854429));
var G__68924 = cljs.core.deref(value);
res = G__68923;
value = G__68924;
continue;
} else {
if(cljs.core.uuid_QMARK_(value)){
var G__68929 = lambdaisland.glogi.print.add.cljs$core$IFn$_invoke$arity$3(res,"#uuid ",new cljs.core.Keyword(null,"brown","brown",1414854429));
var G__68930 = cljs.core.str.cljs$core$IFn$_invoke$arity$1(value);
res = G__68929;
value = G__68930;
continue;
} else {
if(cljs.core.object_QMARK_(value)){
var G__68932 = lambdaisland.glogi.print.add.cljs$core$IFn$_invoke$arity$3(res,"#js ",new cljs.core.Keyword(null,"brown","brown",1414854429));
var G__68933 = cljs.core.reduce.cljs$core$IFn$_invoke$arity$3(((function (res,value){
return (function (p1__68705_SHARP_,p2__68706_SHARP_){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(p1__68705_SHARP_,cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(p2__68706_SHARP_),lambdaisland.glogi.print.goog$module$goog$object.get(value,p2__68706_SHARP_));
});})(res,value))
,cljs.core.PersistentArrayMap.EMPTY,Object.keys(value));
res = G__68932;
value = G__68933;
continue;
} else {
if(cljs.core.array_QMARK_(value)){
var G__68935 = lambdaisland.glogi.print.add.cljs$core$IFn$_invoke$arity$3(res,"#js ",new cljs.core.Keyword(null,"brown","brown",1414854429));
var G__68936 = cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentVector.EMPTY,value);
res = G__68935;
value = G__68936;
continue;
} else {
return lambdaisland.glogi.print.add.cljs$core$IFn$_invoke$arity$3(res,cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([value], 0)),new cljs.core.Keyword(null,"gray5","gray5",1481094938));

}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
break;
}
});
lambdaisland.glogi.print.format = (function lambdaisland$glogi$print$format(level,logger_name,value){
var color = lambdaisland.glogi.print.level_color(level);
var vec__68865 = lambdaisland.glogi.print.print_console_log_css(lambdaisland.glogi.print.add.cljs$core$IFn$_invoke$arity$2(lambdaisland.glogi.print.add.cljs$core$IFn$_invoke$arity$4(lambdaisland.glogi.print.add.cljs$core$IFn$_invoke$arity$4(lambdaisland.glogi.print.add.cljs$core$IFn$_invoke$arity$4(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["",cljs.core.PersistentVector.EMPTY], null),"[",new cljs.core.Keyword(null,"white","white",-483998618),color),logger_name,new cljs.core.Keyword(null,"white","white",-483998618),color),"]",new cljs.core.Keyword(null,"white","white",-483998618),color)," "),value);
var res = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__68865,(0),null);
var res_css = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__68865,(1),null);
return cljs.core.cons(res,res_css);
});

//# sourceMappingURL=lambdaisland.glogi.print.js.map
