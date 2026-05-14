goog.provide('malli.dev.pretty');
malli.dev.pretty._printer = (function malli$dev$pretty$_printer(var_args){
var G__74592 = arguments.length;
switch (G__74592) {
case 0:
return malli.dev.pretty._printer.cljs$core$IFn$_invoke$arity$0();

break;
case 1:
return malli.dev.pretty._printer.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(malli.dev.pretty._printer.cljs$core$IFn$_invoke$arity$0 = (function (){
return malli.dev.pretty._printer.cljs$core$IFn$_invoke$arity$1(null);
}));

(malli.dev.pretty._printer.cljs$core$IFn$_invoke$arity$1 = (function (options){
return malli.dev.virhe._printer.cljs$core$IFn$_invoke$arity$1(cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 6, [new cljs.core.Keyword(null,"title","title",636505583),"Schema Error",new cljs.core.Keyword(null,"width","width",-384071477),(80),new cljs.core.Keyword(null,"colors","colors",1157174732),malli.dev.virhe._dark_colors,new cljs.core.Keyword(null,"unknown","unknown",-935977881),(function (x){
if(malli.core.schema_QMARK_(x)){
return malli.core.form.cljs$core$IFn$_invoke$arity$1(x);
} else {
return null;
}
}),new cljs.core.Keyword(null,"throwing-fn-top-level-ns-names","throwing-fn-top-level-ns-names",1959105244),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, ["malli","clojure","malli","nrepl"], null),new cljs.core.Keyword("malli.error","mask-valid-values","malli.error/mask-valid-values",1682135332),new cljs.core.Symbol(null,"...","...",-1926939749,null)], null),options], 0)));
}));

(malli.dev.pretty._printer.cljs$lang$maxFixedArity = 1);

malli.dev.pretty._errors = (function malli$dev$pretty$_errors(explanation,printer){
return cljs.core.interpose.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"break","break",126570225),(function (){var iter__5480__auto__ = (function malli$dev$pretty$_errors_$_iter__74596(s__74597){
return (new cljs.core.LazySeq(null,(function (){
var s__74597__$1 = s__74597;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__74597__$1);
if(temp__5804__auto__){
var s__74597__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__74597__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__74597__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__74599 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__74598 = (0);
while(true){
if((i__74598 < size__5479__auto__)){
var error = cljs.core._nth(c__5478__auto__,i__74598);
cljs.core.chunk_append(b__74599,malli.dev.virhe._visit(cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,error),printer));

var G__74798 = (i__74598 + (1));
i__74598 = G__74798;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__74599),malli$dev$pretty$_errors_$_iter__74596(cljs.core.chunk_rest(s__74597__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__74599),null);
}
} else {
var error = cljs.core.first(s__74597__$2);
return cljs.core.cons(malli.dev.virhe._visit(cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,error),printer),malli$dev$pretty$_errors_$_iter__74596(cljs.core.rest(s__74597__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(new cljs.core.Keyword(null,"errors","errors",-908790718).cljs$core$IFn$_invoke$arity$1(malli.error.with_error_messages.cljs$core$IFn$_invoke$arity$1(explanation)));
})());
});
malli.dev.pretty._explain = (function malli$dev$pretty$_explain(schema,value,printer){
return malli.dev.pretty._errors(malli.core.explain.cljs$core$IFn$_invoke$arity$2(schema,value),printer);
});
malli.dev.pretty._log_BANG_ = (function malli$dev$pretty$_log_BANG_(text,printer){
return malli.dev.virhe._print_doc(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"group","group",582596132),malli.dev.virhe._color(new cljs.core.Keyword(null,"title","title",636505583),"malli: ",printer),text], null),printer);
});
malli.dev.pretty._ref_text = (function malli$dev$pretty$_ref_text(printer){
return new cljs.core.PersistentVector(null, 15, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"group","group",582596132),"Reference should be one of the following",new cljs.core.Keyword(null,"break","break",126570225),new cljs.core.Keyword(null,"break","break",126570225),"- a qualified keyword, ",malli.dev.virhe._visit(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"ref","ref",1289896967),new cljs.core.Keyword("user","id","user/id",-1375756663)], null),printer),new cljs.core.Keyword(null,"break","break",126570225),"- a qualified symbol,  ",malli.dev.virhe._visit(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"ref","ref",1289896967),cljs.core.symbol.cljs$core$IFn$_invoke$arity$2("'user","id")], null),printer),new cljs.core.Keyword(null,"break","break",126570225),"- a string,            ",malli.dev.virhe._visit(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"ref","ref",1289896967),"user/id"], null),printer),new cljs.core.Keyword(null,"break","break",126570225),"- a Var,               ",malli.dev.virhe._visit(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"ref","ref",1289896967),cljs.core.symbol.cljs$core$IFn$_invoke$arity$2("#'user","id")], null),printer)], null);
});
malli.dev.virhe._format.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("malli.core","explain","malli.core/explain",36932858),(function (_,p__74610,printer){
var map__74611 = p__74610;
var map__74611__$1 = cljs.core.__destructure_map(map__74611);
var explanation = map__74611__$1;
var schema = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__74611__$1,new cljs.core.Keyword(null,"schema","schema",-1582001791));
return new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"body","body",-2049205669),new cljs.core.PersistentVector(null, 11, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"group","group",582596132),malli.dev.virhe._block("Value",malli.dev.virhe._visit(malli.error.error_value.cljs$core$IFn$_invoke$arity$2(explanation,printer),printer),printer),new cljs.core.Keyword(null,"break","break",126570225),new cljs.core.Keyword(null,"break","break",126570225),malli.dev.virhe._block("Errors",malli.dev.virhe._visit(malli.error.humanize.cljs$core$IFn$_invoke$arity$1(malli.error.with_spell_checking.cljs$core$IFn$_invoke$arity$1(explanation)),printer),printer),new cljs.core.Keyword(null,"break","break",126570225),new cljs.core.Keyword(null,"break","break",126570225),malli.dev.virhe._block("Schema",malli.dev.virhe._visit(schema,printer),printer),new cljs.core.Keyword(null,"break","break",126570225),new cljs.core.Keyword(null,"break","break",126570225),malli.dev.virhe._block("More information",malli.dev.virhe._link("https://cljdoc.org/d/metosin/malli/CURRENT",printer),printer)], null)], null);
}));
malli.dev.virhe._format.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("malli.core","coercion","malli.core/coercion",698994541),(function (_,p__74613,printer){
var map__74614 = p__74613;
var map__74614__$1 = cljs.core.__destructure_map(map__74614);
var explain = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__74614__$1,new cljs.core.Keyword(null,"explain","explain",484226146));
return malli.dev.virhe.format(malli.core._exception(new cljs.core.Keyword("malli.core","explain","malli.core/explain",36932858),explain),printer);
}));
malli.dev.virhe._format.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("malli.core","invalid-input","malli.core/invalid-input",2010057279),(function (_,p__74616,printer){
var map__74617 = p__74616;
var map__74617__$1 = cljs.core.__destructure_map(map__74617);
var args = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__74617__$1,new cljs.core.Keyword(null,"args","args",1315556576));
var input = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__74617__$1,new cljs.core.Keyword(null,"input","input",556931961));
var fn_name = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__74617__$1,new cljs.core.Keyword(null,"fn-name","fn-name",-766594004));
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"title","title",636505583),"Invalid Function Input",new cljs.core.Keyword(null,"body","body",-2049205669),new cljs.core.PersistentVector(null, 12, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"group","group",582596132),malli.dev.virhe._block("Invalid function arguments",malli.dev.virhe._visit(args,printer),printer),new cljs.core.Keyword(null,"break","break",126570225),new cljs.core.Keyword(null,"break","break",126570225),(cljs.core.truth_(fn_name)?new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span","span",1394872991),malli.dev.virhe._block("Function Var",malli.dev.virhe._visit(fn_name,printer),printer),new cljs.core.Keyword(null,"break","break",126570225),new cljs.core.Keyword(null,"break","break",126570225)], null):null),malli.dev.virhe._block("Input Schema",malli.dev.virhe._visit(input,printer),printer),new cljs.core.Keyword(null,"break","break",126570225),new cljs.core.Keyword(null,"break","break",126570225),malli.dev.virhe._block("Errors",malli.dev.pretty._explain(input,args,printer),printer),new cljs.core.Keyword(null,"break","break",126570225),new cljs.core.Keyword(null,"break","break",126570225),malli.dev.virhe._block("More information",malli.dev.virhe._link("https://cljdoc.org/d/metosin/malli/CURRENT/doc/function-schemas",printer),printer)], null)], null);
}));
malli.dev.virhe._format.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("malli.core","invalid-output","malli.core/invalid-output",-147363519),(function (_,p__74620,printer){
var map__74621 = p__74620;
var map__74621__$1 = cljs.core.__destructure_map(map__74621);
var value = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__74621__$1,new cljs.core.Keyword(null,"value","value",305978217));
var args = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__74621__$1,new cljs.core.Keyword(null,"args","args",1315556576));
var output = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__74621__$1,new cljs.core.Keyword(null,"output","output",-1105869043));
var fn_name = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__74621__$1,new cljs.core.Keyword(null,"fn-name","fn-name",-766594004));
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"title","title",636505583),"Invalid Function Output",new cljs.core.Keyword(null,"body","body",-2049205669),new cljs.core.PersistentVector(null, 15, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"group","group",582596132),malli.dev.virhe._block("Invalid function return value",malli.dev.virhe._visit(value,printer),printer),new cljs.core.Keyword(null,"break","break",126570225),new cljs.core.Keyword(null,"break","break",126570225),(cljs.core.truth_(fn_name)?new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span","span",1394872991),malli.dev.virhe._block("Function Var",malli.dev.virhe._visit(fn_name,printer),printer),new cljs.core.Keyword(null,"break","break",126570225),new cljs.core.Keyword(null,"break","break",126570225)], null):null),malli.dev.virhe._block("Function arguments",malli.dev.virhe._visit(args,printer),printer),new cljs.core.Keyword(null,"break","break",126570225),new cljs.core.Keyword(null,"break","break",126570225),malli.dev.virhe._block("Output Schema",malli.dev.virhe._visit(output,printer),printer),new cljs.core.Keyword(null,"break","break",126570225),new cljs.core.Keyword(null,"break","break",126570225),malli.dev.virhe._block("Errors",malli.dev.pretty._explain(output,value,printer),printer),new cljs.core.Keyword(null,"break","break",126570225),new cljs.core.Keyword(null,"break","break",126570225),malli.dev.virhe._block("More information",malli.dev.virhe._link("https://cljdoc.org/d/metosin/malli/CURRENT/doc/function-schemas",printer),printer)], null)], null);
}));
malli.dev.virhe._format.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("malli.core","invalid-guard","malli.core/invalid-guard",-946413611),(function (_,p__74628,printer){
var map__74629 = p__74628;
var map__74629__$1 = cljs.core.__destructure_map(map__74629);
var value = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__74629__$1,new cljs.core.Keyword(null,"value","value",305978217));
var args = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__74629__$1,new cljs.core.Keyword(null,"args","args",1315556576));
var guard = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__74629__$1,new cljs.core.Keyword(null,"guard","guard",-873147811));
var fn_name = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__74629__$1,new cljs.core.Keyword(null,"fn-name","fn-name",-766594004));
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"title","title",636505583),"Function Guard Error",new cljs.core.Keyword(null,"body","body",-2049205669),new cljs.core.PersistentVector(null, 12, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"group","group",582596132),(cljs.core.truth_(fn_name)?new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span","span",1394872991),malli.dev.virhe._block("Function Var",malli.dev.virhe._visit(fn_name,printer),printer),new cljs.core.Keyword(null,"break","break",126570225),new cljs.core.Keyword(null,"break","break",126570225)], null):null),malli.dev.virhe._block("Guard arguments",malli.dev.virhe._visit(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [args,value], null),printer),printer),new cljs.core.Keyword(null,"break","break",126570225),new cljs.core.Keyword(null,"break","break",126570225),malli.dev.virhe._block("Guard Schema",malli.dev.virhe._visit(guard,printer),printer),new cljs.core.Keyword(null,"break","break",126570225),new cljs.core.Keyword(null,"break","break",126570225),malli.dev.virhe._block("Errors",malli.dev.pretty._explain(guard,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [args,value], null),printer),printer),new cljs.core.Keyword(null,"break","break",126570225),new cljs.core.Keyword(null,"break","break",126570225),malli.dev.virhe._block("More information",malli.dev.virhe._link("https://cljdoc.org/d/metosin/malli/CURRENT/doc/function-schemas",printer),printer)], null)], null);
}));
malli.dev.virhe._format.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("malli.core","invalid-arity","malli.core/invalid-arity",577014581),(function (_,p__74632,printer){
var map__74634 = p__74632;
var map__74634__$1 = cljs.core.__destructure_map(map__74634);
var args = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__74634__$1,new cljs.core.Keyword(null,"args","args",1315556576));
var arity = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__74634__$1,new cljs.core.Keyword(null,"arity","arity",-1808556135));
var schema = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__74634__$1,new cljs.core.Keyword(null,"schema","schema",-1582001791));
var fn_name = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__74634__$1,new cljs.core.Keyword(null,"fn-name","fn-name",-766594004));
return new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"body","body",-2049205669),new cljs.core.PersistentVector(null, 11, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"group","group",582596132),malli.dev.virhe._block(["Invalid function arity (",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arity),")"].join(''),malli.dev.virhe._visit(args,printer),printer),new cljs.core.Keyword(null,"break","break",126570225),new cljs.core.Keyword(null,"break","break",126570225),malli.dev.virhe._block("Function Schema",malli.dev.virhe._visit(schema,printer),printer),new cljs.core.Keyword(null,"break","break",126570225),new cljs.core.Keyword(null,"break","break",126570225),malli.dev.virhe._block("Function Var",malli.dev.virhe._visit(fn_name,printer),printer),new cljs.core.Keyword(null,"break","break",126570225),new cljs.core.Keyword(null,"break","break",126570225),malli.dev.virhe._block("More information",malli.dev.virhe._link("https://cljdoc.org/d/metosin/malli/CURRENT/doc/function-schemas",printer),printer)], null)], null);
}));
malli.dev.virhe._format.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("malli.core","register-function-schema","malli.core/register-function-schema",-1224381998),(function (_,p__74636,printer){
var map__74637 = p__74636;
var map__74637__$1 = cljs.core.__destructure_map(map__74637);
var ns = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__74637__$1,new cljs.core.Keyword(null,"ns","ns",441598760));
var name = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__74637__$1,new cljs.core.Keyword(null,"name","name",1843675177));
var schema = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__74637__$1,new cljs.core.Keyword(null,"schema","schema",-1582001791));
var _data = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__74637__$1,new cljs.core.Keyword(null,"_data","_data",-1394265439));
var key = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__74637__$1,new cljs.core.Keyword(null,"key","key",-1516042587));
var _exception = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__74637__$1,new cljs.core.Keyword(null,"_exception","_exception",69029009));
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"title","title",636505583),"Error in registering a Function Schema",new cljs.core.Keyword(null,"body","body",-2049205669),new cljs.core.PersistentVector(null, 8, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"group","group",582596132),malli.dev.virhe._block("Function Var",new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"group","group",582596132),malli.dev.virhe._visit(cljs.core.symbol.cljs$core$IFn$_invoke$arity$2(cljs.core.str.cljs$core$IFn$_invoke$arity$1(ns),cljs.core.str.cljs$core$IFn$_invoke$arity$1(name)),printer)," (",malli.dev.virhe._visit(key,printer),")"], null),printer),new cljs.core.Keyword(null,"break","break",126570225),new cljs.core.Keyword(null,"break","break",126570225),malli.dev.virhe._block("Function Schema",malli.dev.virhe._visit(schema,printer),printer),new cljs.core.Keyword(null,"break","break",126570225),new cljs.core.Keyword(null,"break","break",126570225),malli.dev.virhe._block("More information",malli.dev.virhe._link("https://cljdoc.org/d/metosin/malli/CURRENT/doc/function-schemas",printer),printer)], null)], null);
}));
malli.dev.virhe._format.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("malli.core","invalid-ref","malli.core/invalid-ref",-1109933109),(function (_,p__74640,printer){
var map__74642 = p__74640;
var map__74642__$1 = cljs.core.__destructure_map(map__74642);
var ref = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__74642__$1,new cljs.core.Keyword(null,"ref","ref",1289896967));
return new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"body","body",-2049205669),new cljs.core.PersistentVector(null, 8, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"group","group",582596132),malli.dev.virhe._block("Invalid Reference",malli.dev.virhe._visit(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"ref","ref",1289896967),ref], null),printer),printer),new cljs.core.Keyword(null,"break","break",126570225),new cljs.core.Keyword(null,"break","break",126570225),malli.dev.virhe._block("Reason",malli.dev.pretty._ref_text(printer),printer),new cljs.core.Keyword(null,"break","break",126570225),new cljs.core.Keyword(null,"break","break",126570225),malli.dev.virhe._block("More information",malli.dev.virhe._link("https://cljdoc.org/d/metosin/malli/CURRENT",printer),printer)], null)], null);
}));
malli.dev.virhe._format.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("malli.core","invalid-schema","malli.core/invalid-schema",1923990979),(function (_,p__74644,printer){
var map__74650 = p__74644;
var map__74650__$1 = cljs.core.__destructure_map(map__74650);
var schema = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__74650__$1,new cljs.core.Keyword(null,"schema","schema",-1582001791));
var form = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__74650__$1,new cljs.core.Keyword(null,"form","form",-1624062471));
var proposals = cljs.core.seq(malli.error._most_similar_to(cljs.core.PersistentHashSet.createAsIfByAssoc([schema]),schema,cljs.core.set(cljs.core.keys(malli.registry.schemas(malli.core.default_registry)))));
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"title","title",636505583),"Schema Creation Error",new cljs.core.Keyword(null,"body","body",-2049205669),new cljs.core.PersistentVector(null, 6, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"group","group",582596132),malli.dev.virhe._block("Invalid Schema",malli.dev.virhe._visit(form,printer),printer),new cljs.core.Keyword(null,"break","break",126570225),new cljs.core.Keyword(null,"break","break",126570225),((proposals)?new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"group","group",582596132),malli.dev.virhe._block("Did you mean",cljs.core.interpose.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"break","break",126570225),(function (){var iter__5480__auto__ = (function malli$dev$pretty$iter__74654(s__74655){
return (new cljs.core.LazySeq(null,(function (){
var s__74655__$1 = s__74655;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__74655__$1);
if(temp__5804__auto__){
var s__74655__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__74655__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__74655__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__74657 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__74656 = (0);
while(true){
if((i__74656 < size__5479__auto__)){
var proposal = cljs.core._nth(c__5478__auto__,i__74656);
cljs.core.chunk_append(b__74657,malli.dev.virhe._visit(proposal,printer));

var G__74822 = (i__74656 + (1));
i__74656 = G__74822;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__74657),malli$dev$pretty$iter__74654(cljs.core.chunk_rest(s__74655__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__74657),null);
}
} else {
var proposal = cljs.core.first(s__74655__$2);
return cljs.core.cons(malli.dev.virhe._visit(proposal,printer),malli$dev$pretty$iter__74654(cljs.core.rest(s__74655__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(proposals);
})()),printer),new cljs.core.Keyword(null,"break","break",126570225),new cljs.core.Keyword(null,"break","break",126570225)], null):null),malli.dev.virhe._block("More information",malli.dev.virhe._link("https://cljdoc.org/d/metosin/malli/CURRENT",printer),printer)], null)], null);
}));
malli.dev.virhe._format.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("malli.core","child-error","malli.core/child-error",-473817473),(function (_,p__74671,printer){
var map__74672 = p__74671;
var map__74672__$1 = cljs.core.__destructure_map(map__74672);
var data = map__74672__$1;
var type = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__74672__$1,new cljs.core.Keyword(null,"type","type",1174270348));
var children = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__74672__$1,new cljs.core.Keyword(null,"children","children",-940561982));
var properties = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__74672__$1,new cljs.core.Keyword(null,"properties","properties",685819552));
var form = malli.core._raw_form(type,properties,children);
var constraints = cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (acc,k){
var temp__5802__auto__ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(data,k);
if(cljs.core.truth_(temp__5802__auto__)){
var v = temp__5802__auto__;
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(acc,k,v);
} else {
return acc;
}
}),null,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"min","min",444991522),new cljs.core.Keyword(null,"max","max",61366548)], null));
var size = cljs.core.count(children);
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"title","title",636505583),"Schema Creation Error",new cljs.core.Keyword(null,"body","body",-2049205669),new cljs.core.PersistentVector(null, 8, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"group","group",582596132),malli.dev.virhe._block("Invalid Schema",malli.dev.virhe._visit(form,printer),printer),new cljs.core.Keyword(null,"break","break",126570225),new cljs.core.Keyword(null,"break","break",126570225),malli.dev.virhe._block("Reason",new cljs.core.PersistentVector(null, 6, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"group","group",582596132),"Schema has ",malli.dev.virhe._visit(size,printer),((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2((1),size))?" child":" children"),", expected ",malli.dev.virhe._visit(constraints,printer)], null),printer),new cljs.core.Keyword(null,"break","break",126570225),new cljs.core.Keyword(null,"break","break",126570225),malli.dev.virhe._block("More information",malli.dev.virhe._link("https://cljdoc.org/d/metosin/malli/CURRENT",printer),printer)], null)], null);
}));
malli.dev.virhe._format.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("malli.core","invalid-entry","malli.core/invalid-entry",-1401097281),(function (_,p__74677,printer){
var map__74678 = p__74677;
var map__74678__$1 = cljs.core.__destructure_map(map__74678);
var entry = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__74678__$1,new cljs.core.Keyword(null,"entry","entry",505168823));
var wrap = ((cljs.core.sequential_QMARK_(entry))?cljs.core.vec:cljs.core.vector);
var wrapped = (wrap.cljs$core$IFn$_invoke$arity$1 ? wrap.cljs$core$IFn$_invoke$arity$1(entry) : wrap.call(null,entry));
var example = (function (){var G__74683 = wrapped;
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2((1),cljs.core.count(wrapped))){
return cljs.core.conj.cljs$core$IFn$_invoke$arity$2(G__74683,new cljs.core.Keyword(null,"any","any",1705907423));
} else {
return G__74683;
}
})();
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"title","title",636505583),"Schema Creation Error",new cljs.core.Keyword(null,"body","body",-2049205669),new cljs.core.PersistentVector(null, 8, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"group","group",582596132),malli.dev.virhe._block("Invalid Entry",malli.dev.virhe._visit(entry,printer),printer),new cljs.core.Keyword(null,"break","break",126570225),new cljs.core.Keyword(null,"break","break",126570225),malli.dev.virhe._block("Did you mean",malli.dev.virhe._visit(example,printer),printer),new cljs.core.Keyword(null,"break","break",126570225),new cljs.core.Keyword(null,"break","break",126570225),malli.dev.virhe._block("More information",malli.dev.virhe._link("https://cljdoc.org/d/metosin/malli/CURRENT",printer),printer)], null)], null);
}));
malli.dev.virhe._format.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("malli.core","duplicate-keys","malli.core/duplicate-keys",1684166326),(function (_,p__74692,printer){
var map__74693 = p__74692;
var map__74693__$1 = cljs.core.__destructure_map(map__74693);
var arr = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__74693__$1,new cljs.core.Keyword(null,"arr","arr",474961448));
var keys = cljs.core.take_nth.cljs$core$IFn$_invoke$arity$2((2),cljs.core.vec(arr));
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"title","title",636505583),"Schema Creation Error",new cljs.core.Keyword(null,"body","body",-2049205669),new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"group","group",582596132),malli.dev.virhe._block("Duplicate Keys",malli.dev.virhe._visit(keys,printer),printer),new cljs.core.Keyword(null,"break","break",126570225),new cljs.core.Keyword(null,"break","break",126570225),malli.dev.virhe._block("More information",malli.dev.virhe._link("https://cljdoc.org/d/metosin/malli/CURRENT",printer),printer)], null)], null);
}));
malli.dev.virhe._format.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("malli.edn","var-parsing-not-supported","malli.edn/var-parsing-not-supported",-283037656),(function (_,p__74705,printer){
var map__74706 = p__74705;
var map__74706__$1 = cljs.core.__destructure_map(map__74706);
var string = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__74706__$1,new cljs.core.Keyword(null,"string","string",-1989541586));
var var$ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__74706__$1,new cljs.core.Keyword(null,"var","var",-769682797));
var parse = (function (string__$1){
try{return malli.edn._parse_string.cljs$core$IFn$_invoke$arity$2(string__$1,new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"regex","regex",939488856),true,new cljs.core.Keyword(null,"fn","fn",-1175266204),true,new cljs.core.Keyword(null,"var","var",-769682797),malli.edn._var_symbol], null));
}catch (e74712){if((e74712 instanceof Error)){
var ___$1 = e74712;
return string__$1;
} else {
throw e74712;

}
}});
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"title","title",636505583),"Deserialization Error",new cljs.core.Keyword(null,"body","body",-2049205669),new cljs.core.PersistentVector(null, 14, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"group","group",582596132),malli.dev.virhe._block("Var",malli.dev.virhe._visit(var$,printer),printer),new cljs.core.Keyword(null,"break","break",126570225),new cljs.core.Keyword(null,"break","break",126570225),malli.dev.virhe._block("Data",malli.dev.virhe._visit(parse(string),printer),printer),new cljs.core.Keyword(null,"break","break",126570225),new cljs.core.Keyword(null,"break","break",126570225),malli.dev.virhe._block("Error",new cljs.core.PersistentVector(null, 7, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"group","group",582596132),"Var deserialization is disabled by default, because:",new cljs.core.Keyword(null,"break","break",126570225),new cljs.core.Keyword(null,"break","break",126570225),"- Vars don't work at runtime in ClojureScript",new cljs.core.Keyword(null,"break","break",126570225),"- Var resolutions has overhead with GraalVM Native Image"], null),printer),new cljs.core.Keyword(null,"break","break",126570225),new cljs.core.Keyword(null,"break","break",126570225),malli.dev.virhe._block("Resolution",new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"group","group",582596132),"To deserialize Var with Clojure:",new cljs.core.Keyword(null,"break","break",126570225),new cljs.core.Keyword(null,"break","break",126570225),malli.dev.virhe._visit(cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic((new cljs.core.List(null,new cljs.core.Symbol("malli.edn","read-string","malli.edn/read-string",1383595859,null),null,(1),null)),(new cljs.core.List(null,string,null,(1),null)),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([(new cljs.core.List(null,cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core.array_map,cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$2((new cljs.core.List(null,new cljs.core.Keyword("malli.edn","edamame-options","malli.edn/edamame-options",1062392066),null,(1),null)),(new cljs.core.List(null,cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core.array_map,cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic((new cljs.core.List(null,new cljs.core.Keyword(null,"regex","regex",939488856),null,(1),null)),(new cljs.core.List(null,true,null,(1),null)),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([(new cljs.core.List(null,new cljs.core.Keyword(null,"fn","fn",-1175266204),null,(1),null)),(new cljs.core.List(null,true,null,(1),null)),(new cljs.core.List(null,new cljs.core.Keyword(null,"var","var",-769682797),null,(1),null)),(new cljs.core.List(null,new cljs.core.Symbol("cljs.core","resolve","cljs.core/resolve",1796776582,null),null,(1),null))], 0))))),null,(1),null)))))),null,(1),null))], 0)))),printer)], null),printer),new cljs.core.Keyword(null,"break","break",126570225),new cljs.core.Keyword(null,"break","break",126570225),malli.dev.virhe._block("More information",malli.dev.virhe._link("https://cljdoc.org/d/metosin/malli/CURRENT",printer),printer)], null)], null);
}));
malli.dev.pretty.reporter = (function malli$dev$pretty$reporter(var_args){
var G__74734 = arguments.length;
switch (G__74734) {
case 0:
return malli.dev.pretty.reporter.cljs$core$IFn$_invoke$arity$0();

break;
case 1:
return malli.dev.pretty.reporter.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(malli.dev.pretty.reporter.cljs$core$IFn$_invoke$arity$0 = (function (){
return malli.dev.pretty.reporter.cljs$core$IFn$_invoke$arity$1(malli.dev.pretty._printer.cljs$core$IFn$_invoke$arity$0());
}));

(malli.dev.pretty.reporter.cljs$core$IFn$_invoke$arity$1 = (function (printer){
return (function (type,data){
return cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([(function (){var sb__5647__auto__ = (new goog.string.StringBuffer());
var _STAR_print_newline_STAR__orig_val__74744_74842 = cljs.core._STAR_print_newline_STAR_;
var _STAR_print_fn_STAR__orig_val__74745_74843 = cljs.core._STAR_print_fn_STAR_;
var _STAR_print_newline_STAR__temp_val__74746_74844 = true;
var _STAR_print_fn_STAR__temp_val__74747_74845 = (function (x__5648__auto__){
return sb__5647__auto__.append(x__5648__auto__);
});
(cljs.core._STAR_print_newline_STAR_ = _STAR_print_newline_STAR__temp_val__74746_74844);

(cljs.core._STAR_print_fn_STAR_ = _STAR_print_fn_STAR__temp_val__74747_74845);

try{malli.dev.virhe._print_doc(malli.dev.virhe.exception_document(cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2(cljs.core.str.cljs$core$IFn$_invoke$arity$1(type),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"type","type",1174270348),type,new cljs.core.Keyword(null,"data","data",-232669377),data], null)),printer),printer);
}finally {(cljs.core._STAR_print_fn_STAR_ = _STAR_print_fn_STAR__orig_val__74745_74843);

(cljs.core._STAR_print_newline_STAR_ = _STAR_print_newline_STAR__orig_val__74744_74842);
}
return cljs.core.str.cljs$core$IFn$_invoke$arity$1(sb__5647__auto__);
})()], 0));
});
}));

(malli.dev.pretty.reporter.cljs$lang$maxFixedArity = 1);

malli.dev.pretty.thrower = (function malli$dev$pretty$thrower(var_args){
var G__74757 = arguments.length;
switch (G__74757) {
case 0:
return malli.dev.pretty.thrower.cljs$core$IFn$_invoke$arity$0();

break;
case 1:
return malli.dev.pretty.thrower.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(malli.dev.pretty.thrower.cljs$core$IFn$_invoke$arity$0 = (function (){
return malli.dev.pretty.thrower.cljs$core$IFn$_invoke$arity$1(malli.dev.pretty._printer.cljs$core$IFn$_invoke$arity$0());
}));

(malli.dev.pretty.thrower.cljs$core$IFn$_invoke$arity$1 = (function (printer){
var report = malli.dev.pretty.reporter.cljs$core$IFn$_invoke$arity$1(printer);
return (function (type,data){
var message = (function (){var sb__5647__auto__ = (new goog.string.StringBuffer());
var _STAR_print_newline_STAR__orig_val__74769_74854 = cljs.core._STAR_print_newline_STAR_;
var _STAR_print_fn_STAR__orig_val__74770_74855 = cljs.core._STAR_print_fn_STAR_;
var _STAR_print_newline_STAR__temp_val__74771_74856 = true;
var _STAR_print_fn_STAR__temp_val__74772_74857 = (function (x__5648__auto__){
return sb__5647__auto__.append(x__5648__auto__);
});
(cljs.core._STAR_print_newline_STAR_ = _STAR_print_newline_STAR__temp_val__74771_74856);

(cljs.core._STAR_print_fn_STAR_ = _STAR_print_fn_STAR__temp_val__74772_74857);

try{report(type,data);
}finally {(cljs.core._STAR_print_fn_STAR_ = _STAR_print_fn_STAR__orig_val__74770_74855);

(cljs.core._STAR_print_newline_STAR_ = _STAR_print_newline_STAR__orig_val__74769_74854);
}
return cljs.core.str.cljs$core$IFn$_invoke$arity$1(sb__5647__auto__);
})();
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2(message,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"type","type",1174270348),type,new cljs.core.Keyword(null,"data","data",-232669377),data], null));
});
}));

(malli.dev.pretty.thrower.cljs$lang$maxFixedArity = 1);

malli.dev.pretty.prettifier = (function malli$dev$pretty$prettifier(type,title,f,options){
var printer = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3((function (){var or__5002__auto__ = new cljs.core.Keyword("malli.dev.pretty","printer","malli.dev.pretty/printer",-1293932392).cljs$core$IFn$_invoke$arity$1(options);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(malli.dev.pretty._printer.cljs$core$IFn$_invoke$arity$0(),new cljs.core.Keyword(null,"width","width",-384071477),(60));
}
})(),new cljs.core.Keyword(null,"title","title",636505583),title);
var actor = new cljs.core.Keyword("malli.dev.pretty","actor","malli.dev.pretty/actor",-1785917433).cljs$core$IFn$_invoke$arity$2(options,malli.dev.pretty.reporter);
return (function() { 
var G__74862__delegate = function (args){
var temp__5804__auto__ = cljs.core.apply.cljs$core$IFn$_invoke$arity$2(f,args);
if(cljs.core.truth_(temp__5804__auto__)){
var res = temp__5804__auto__;
var fexpr__74782_74863 = (actor.cljs$core$IFn$_invoke$arity$1 ? actor.cljs$core$IFn$_invoke$arity$1(printer) : actor.call(null,printer));
(fexpr__74782_74863.cljs$core$IFn$_invoke$arity$2 ? fexpr__74782_74863.cljs$core$IFn$_invoke$arity$2(type,res) : fexpr__74782_74863.call(null,type,res));

return res;
} else {
return null;
}
};
var G__74862 = function (var_args){
var args = null;
if (arguments.length > 0) {
var G__74864__i = 0, G__74864__a = new Array(arguments.length -  0);
while (G__74864__i < G__74864__a.length) {G__74864__a[G__74864__i] = arguments[G__74864__i + 0]; ++G__74864__i;}
  args = new cljs.core.IndexedSeq(G__74864__a,0,null);
} 
return G__74862__delegate.call(this,args);};
G__74862.cljs$lang$maxFixedArity = 0;
G__74862.cljs$lang$applyTo = (function (arglist__74865){
var args = cljs.core.seq(arglist__74865);
return G__74862__delegate(args);
});
G__74862.cljs$core$IFn$_invoke$arity$variadic = G__74862__delegate;
return G__74862;
})()
;
});
malli.dev.pretty.explain = (function malli$dev$pretty$explain(var_args){
var G__74786 = arguments.length;
switch (G__74786) {
case 2:
return malli.dev.pretty.explain.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return malli.dev.pretty.explain.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(malli.dev.pretty.explain.cljs$core$IFn$_invoke$arity$2 = (function (_QMARK_schema,value){
return malli.dev.pretty.explain.cljs$core$IFn$_invoke$arity$3(_QMARK_schema,value,null);
}));

(malli.dev.pretty.explain.cljs$core$IFn$_invoke$arity$3 = (function (_QMARK_schema,value,options){
var explain = (function (){
return malli.error.with_error_messages.cljs$core$IFn$_invoke$arity$1(malli.core.explain.cljs$core$IFn$_invoke$arity$3(_QMARK_schema,value,options));
});
return malli.dev.pretty.prettifier(new cljs.core.Keyword("malli.core","explain","malli.core/explain",36932858),"Validation Error",explain,options)();
}));

(malli.dev.pretty.explain.cljs$lang$maxFixedArity = 3);


//# sourceMappingURL=malli.dev.pretty.js.map
