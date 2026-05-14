goog.provide('lambdaisland.glogi.print');
goog.scope(function(){
  lambdaisland.glogi.print.goog$module$goog$object = goog.module.get('goog.object');
});
lambdaisland.glogi.print.colors = cljs.core.PersistentHashMap.fromArrays([new cljs.core.Keyword(null,"orange","orange",73816386),new cljs.core.Keyword(null,"gray1","gray1",23549221),new cljs.core.Keyword(null,"white","white",-483998618),new cljs.core.Keyword(null,"gray3","gray3",-617553786),new cljs.core.Keyword(null,"gray4","gray4",460735815),new cljs.core.Keyword(null,"yellow","yellow",-881035449),new cljs.core.Keyword(null,"green","green",-945526839),new cljs.core.Keyword(null,"turqoise","turqoise",1674869457),new cljs.core.Keyword(null,"gray2","gray2",-1424527469),new cljs.core.Keyword(null,"red","red",-969428204),new cljs.core.Keyword(null,"blue","blue",-622100620),new cljs.core.Keyword(null,"purple","purple",-876021126),new cljs.core.Keyword(null,"gray6","gray6",-2106469670),new cljs.core.Keyword(null,"gray5","gray5",1481094938),new cljs.core.Keyword(null,"brown","brown",1414854429),new cljs.core.Keyword(null,"black","black",1294279647)],["#f5871f","#e0e0e0","#ffffff","#8e908c","#969896","#eab700","#718c00","#3e999f","#d6d6d6","#c82829","#4271ae","#8959a8","#282a2e","#4d4d4c","#a3685a","#1d1f21"]);
lambdaisland.glogi.print.level_color = (function lambdaisland$glogi$print$level_color(level){
var pred__135105 = cljs.core._LT__EQ_;
var expr__135106 = lambdaisland.glogi.level_value(level);
if(cljs.core.truth_((function (){var G__135110 = lambdaisland.glogi.level_value(new cljs.core.Keyword(null,"severe","severe",-1364500238));
var G__135111 = expr__135106;
return (pred__135105.cljs$core$IFn$_invoke$arity$2 ? pred__135105.cljs$core$IFn$_invoke$arity$2(G__135110,G__135111) : pred__135105.call(null,G__135110,G__135111));
})())){
return new cljs.core.Keyword(null,"red","red",-969428204);
} else {
if(cljs.core.truth_((function (){var G__135113 = lambdaisland.glogi.level_value(new cljs.core.Keyword(null,"warning","warning",-1685650671));
var G__135114 = expr__135106;
return (pred__135105.cljs$core$IFn$_invoke$arity$2 ? pred__135105.cljs$core$IFn$_invoke$arity$2(G__135113,G__135114) : pred__135105.call(null,G__135113,G__135114));
})())){
return new cljs.core.Keyword(null,"orange","orange",73816386);
} else {
if(cljs.core.truth_((function (){var G__135115 = lambdaisland.glogi.level_value(new cljs.core.Keyword(null,"info","info",-317069002));
var G__135116 = expr__135106;
return (pred__135105.cljs$core$IFn$_invoke$arity$2 ? pred__135105.cljs$core$IFn$_invoke$arity$2(G__135115,G__135116) : pred__135105.call(null,G__135115,G__135116));
})())){
return new cljs.core.Keyword(null,"blue","blue",-622100620);
} else {
if(cljs.core.truth_((function (){var G__135118 = lambdaisland.glogi.level_value(new cljs.core.Keyword(null,"config","config",994861415));
var G__135119 = expr__135106;
return (pred__135105.cljs$core$IFn$_invoke$arity$2 ? pred__135105.cljs$core$IFn$_invoke$arity$2(G__135118,G__135119) : pred__135105.call(null,G__135118,G__135119));
})())){
return new cljs.core.Keyword(null,"green","green",-945526839);
} else {
if(cljs.core.truth_((function (){var G__135121 = lambdaisland.glogi.level_value(new cljs.core.Keyword(null,"fine","fine",-873037193));
var G__135122 = expr__135106;
return (pred__135105.cljs$core$IFn$_invoke$arity$2 ? pred__135105.cljs$core$IFn$_invoke$arity$2(G__135121,G__135122) : pred__135105.call(null,G__135121,G__135122));
})())){
return new cljs.core.Keyword(null,"yellow","yellow",-881035449);
} else {
if(cljs.core.truth_((function (){var G__135123 = lambdaisland.glogi.level_value(new cljs.core.Keyword(null,"finer","finer",974902846));
var G__135124 = expr__135106;
return (pred__135105.cljs$core$IFn$_invoke$arity$2 ? pred__135105.cljs$core$IFn$_invoke$arity$2(G__135123,G__135124) : pred__135105.call(null,G__135123,G__135124));
})())){
return new cljs.core.Keyword(null,"gray3","gray3",-617553786);
} else {
if(cljs.core.truth_((function (){var G__135126 = lambdaisland.glogi.level_value(new cljs.core.Keyword(null,"finest","finest",-1359568890));
var G__135127 = expr__135106;
return (pred__135105.cljs$core$IFn$_invoke$arity$2 ? pred__135105.cljs$core$IFn$_invoke$arity$2(G__135126,G__135127) : pred__135105.call(null,G__135126,G__135127));
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
var G__135134 = arguments.length;
switch (G__135134) {
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

(lambdaisland.glogi.print.add.cljs$core$IFn$_invoke$arity$2 = (function (p__135140,s){
var vec__135141 = p__135140;
var res = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__135141,(0),null);
var res_css = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__135141,(1),null);
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [[cljs.core.str.cljs$core$IFn$_invoke$arity$1(res),cljs.core.str.cljs$core$IFn$_invoke$arity$1(s)].join(''),res_css], null);
}));

(lambdaisland.glogi.print.add.cljs$core$IFn$_invoke$arity$3 = (function (p__135145,s,color){
var vec__135146 = p__135145;
var res = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__135146,(0),null);
var res_css = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__135146,(1),null);
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [[cljs.core.str.cljs$core$IFn$_invoke$arity$1(res),"%c",cljs.core.str.cljs$core$IFn$_invoke$arity$1(s),"%c"].join(''),cljs.core.conj.cljs$core$IFn$_invoke$arity$variadic(res_css,["color:",cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.get.cljs$core$IFn$_invoke$arity$2(lambdaisland.glogi.print.colors,color))].join(''),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["color:black"], 0))], null);
}));

(lambdaisland.glogi.print.add.cljs$core$IFn$_invoke$arity$4 = (function (p__135149,s,fg,bg){
var vec__135150 = p__135149;
var res = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__135150,(0),null);
var res_css = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__135150,(1),null);
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
var G__135166 = lambdaisland.glogi.print.add.cljs$core$IFn$_invoke$arity$2((function (){var G__135169 = res;
var G__135170 = cljs.core.key(value);
return (lambdaisland.glogi.print.print_console_log_css.cljs$core$IFn$_invoke$arity$2 ? lambdaisland.glogi.print.print_console_log_css.cljs$core$IFn$_invoke$arity$2(G__135169,G__135170) : lambdaisland.glogi.print.print_console_log_css.call(null,G__135169,G__135170));
})()," ");
var G__135167 = cljs.core.val(value);
return (lambdaisland.glogi.print.print_console_log_css.cljs$core$IFn$_invoke$arity$2 ? lambdaisland.glogi.print.print_console_log_css.cljs$core$IFn$_invoke$arity$2(G__135166,G__135167) : lambdaisland.glogi.print.print_console_log_css.call(null,G__135166,G__135167));
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
var G__135230 = lambdaisland.glogi.print.add.cljs$core$IFn$_invoke$arity$3(res,"#queue ",new cljs.core.Keyword(null,"brown","brown",1414854429));
var G__135231 = cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentVector.EMPTY,value);
res = G__135230;
value = G__135231;
continue;
} else {
if(cljs.core.seq_QMARK_(value)){
var _PERCENT_ = res;
var _PERCENT___$1 = lambdaisland.glogi.print.add.cljs$core$IFn$_invoke$arity$3(_PERCENT_,"(",new cljs.core.Keyword(null,"brown","brown",1414854429));
var _PERCENT___$2 = cljs.core.reduce.cljs$core$IFn$_invoke$arity$3(lambdaisland.glogi.print.print_console_log_css,_PERCENT___$1,cljs.core.interpose.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("lambdaisland.glogi.print","space","lambdaisland.glogi.print/space",1682088588),value));
return lambdaisland.glogi.print.add.cljs$core$IFn$_invoke$arity$3(_PERCENT___$2,")",new cljs.core.Keyword(null,"brown","brown",1414854429));
} else {
if((((!((value == null))))?(((((value.cljs$lang$protocol_mask$partition1$ & (16384))) || ((cljs.core.PROTOCOL_SENTINEL === value.cljs$core$IAtom$))))?true:(((!value.cljs$lang$protocol_mask$partition1$))?cljs.core.native_satisfies_QMARK_(cljs.core.IAtom,value):false)):cljs.core.native_satisfies_QMARK_(cljs.core.IAtom,value))){
var G__135236 = lambdaisland.glogi.print.add.cljs$core$IFn$_invoke$arity$3(res,"#atom ",new cljs.core.Keyword(null,"brown","brown",1414854429));
var G__135237 = cljs.core.deref(value);
res = G__135236;
value = G__135237;
continue;
} else {
if(cljs.core.uuid_QMARK_(value)){
var G__135239 = lambdaisland.glogi.print.add.cljs$core$IFn$_invoke$arity$3(res,"#uuid ",new cljs.core.Keyword(null,"brown","brown",1414854429));
var G__135240 = cljs.core.str.cljs$core$IFn$_invoke$arity$1(value);
res = G__135239;
value = G__135240;
continue;
} else {
if(cljs.core.object_QMARK_(value)){
var G__135248 = lambdaisland.glogi.print.add.cljs$core$IFn$_invoke$arity$3(res,"#js ",new cljs.core.Keyword(null,"brown","brown",1414854429));
var G__135249 = cljs.core.reduce.cljs$core$IFn$_invoke$arity$3(((function (res,value){
return (function (p1__135163_SHARP_,p2__135164_SHARP_){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(p1__135163_SHARP_,cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(p2__135164_SHARP_),lambdaisland.glogi.print.goog$module$goog$object.get(value,p2__135164_SHARP_));
});})(res,value))
,cljs.core.PersistentArrayMap.EMPTY,Object.keys(value));
res = G__135248;
value = G__135249;
continue;
} else {
if(cljs.core.array_QMARK_(value)){
var G__135251 = lambdaisland.glogi.print.add.cljs$core$IFn$_invoke$arity$3(res,"#js ",new cljs.core.Keyword(null,"brown","brown",1414854429));
var G__135252 = cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentVector.EMPTY,value);
res = G__135251;
value = G__135252;
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
var vec__135189 = lambdaisland.glogi.print.print_console_log_css(lambdaisland.glogi.print.add.cljs$core$IFn$_invoke$arity$2(lambdaisland.glogi.print.add.cljs$core$IFn$_invoke$arity$4(lambdaisland.glogi.print.add.cljs$core$IFn$_invoke$arity$4(lambdaisland.glogi.print.add.cljs$core$IFn$_invoke$arity$4(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["",cljs.core.PersistentVector.EMPTY], null),"[",new cljs.core.Keyword(null,"white","white",-483998618),color),logger_name,new cljs.core.Keyword(null,"white","white",-483998618),color),"]",new cljs.core.Keyword(null,"white","white",-483998618),color)," "),value);
var res = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__135189,(0),null);
var res_css = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__135189,(1),null);
return cljs.core.cons(res,res_css);
});

//# sourceMappingURL=lambdaisland.glogi.print.js.map
