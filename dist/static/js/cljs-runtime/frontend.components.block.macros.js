goog.provide('frontend.components.block.macros');
/**
 * Given a block from a query result, returns a map of its properties indexed by
 *   property idents and titles
 */
frontend.components.block.macros.properties_by_name = (function frontend$components$block$macros$properties_by_name(db,block){
return cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (p__107358){
var vec__107359 = p__107358;
var k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__107359,(0),null);
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__107359,(1),null);
if(cljs.core.set_QMARK_(v)){
return null;
} else {
var prop_val = (function (){var G__107362 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(v);
var G__107362__$1 = (((G__107362 == null))?null:(datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db,G__107362) : datascript.core.entity.call(null,db,G__107362)));
if((G__107362__$1 == null)){
return null;
} else {
return logseq.db.frontend.property.property_value_content(G__107362__$1);
}
})();
var property = (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db,k) : datascript.core.entity.call(null,db,k));
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(property)),prop_val], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(property),prop_val], null)], null);
}
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([logseq.db.frontend.property.properties(block)], 0)));
});
frontend.components.block.macros.normalize_query_function = (function frontend$components$block$macros$normalize_query_function(ast_STAR_,repo,result){
var ast = clojure.walk.prewalk((function (f){
if(((cljs.core.list_QMARK_(f)) && ((((cljs.core.second(f) instanceof cljs.core.Keyword)) && (cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Symbol(null,"average","average",1148175359,null),null,new cljs.core.Symbol(null,"count","count",-514511684,null),null,new cljs.core.Symbol(null,"sum","sum",1777518341,null),null,new cljs.core.Symbol(null,"min","min",2085523049,null),null,new cljs.core.Symbol(null,"max","max",1701898075,null),null], null), null),cljs.core.first(f))))))){
if(cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Symbol(null,"min","min",2085523049,null),null,new cljs.core.Symbol(null,"max","max",1701898075,null),null], null), null),cljs.core.first(f))){
return (new cljs.core.List(null,new cljs.core.Symbol(null,"apply","apply",-1334050276,null),(new cljs.core.List(null,cljs.core.first(f),(new cljs.core.List(null,(new cljs.core.List(null,new cljs.core.Symbol(null,"map","map",-1282745308,null),(new cljs.core.List(null,cljs.core.second(f),(new cljs.core.List(null,new cljs.core.Symbol(null,"result","result",-1239343558,null),null,(1),null)),(2),null)),(3),null)),null,(1),null)),(2),null)),(3),null));
} else {
return (new cljs.core.List(null,cljs.core.first(f),(new cljs.core.List(null,(new cljs.core.List(null,new cljs.core.Symbol(null,"map","map",-1282745308,null),(new cljs.core.List(null,cljs.core.second(f),(new cljs.core.List(null,new cljs.core.Symbol(null,"result","result",-1239343558,null),null,(1),null)),(2),null)),(3),null)),null,(1),null)),(2),null));
}
} else {
return f;
}
}),ast_STAR_);
var db_based_graph_QMARK_ = frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(repo);
var special_file_graph_keywords = new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"block","block",664686210),new cljs.core.Keyword("block","title","block/title",710445684),new cljs.core.Keyword(null,"page","page",849072397),new cljs.core.Keyword("block","name","block/name",1619760316),new cljs.core.Keyword(null,"created-at","created-at",-89248644),new cljs.core.Keyword("block","created-at","block/created-at",1440015),new cljs.core.Keyword(null,"updated-at","updated-at",-1592622336),new cljs.core.Keyword("block","updated-at","block/updated-at",-1516550551)], null);
return clojure.walk.postwalk((function (f){
if((f instanceof cljs.core.Keyword)){
var temp__5802__auto__ = (function (){var and__5000__auto__ = (!(db_based_graph_QMARK_));
if(and__5000__auto__){
return cljs.core.get.cljs$core$IFn$_invoke$arity$2(special_file_graph_keywords,f);
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5802__auto__)){
var kw = temp__5802__auto__;
return kw;
} else {
var vals = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__107375_SHARP_){
return cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(p1__107375_SHARP_,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","properties","block/properties",708347145),f], null));
}),result);
var int_QMARK_ = cljs.core.some(cljs.core.integer_QMARK_,vals);
return cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic((new cljs.core.List(null,new cljs.core.Symbol(null,"fn","fn",465265323,null),null,(1),null)),(new cljs.core.List(null,cljs.core.vec(cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$1((new cljs.core.List(null,new cljs.core.Symbol(null,"b","b",-1172211299,null),null,(1),null)))))),null,(1),null)),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([(new cljs.core.List(null,cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic((new cljs.core.List(null,new cljs.core.Symbol(null,"let","let",358118826,null),null,(1),null)),(new cljs.core.List(null,cljs.core.vec(cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic((new cljs.core.List(null,new cljs.core.Symbol(null,"result-str","result-str",977122937,null),null,(1),null)),(new cljs.core.List(null,cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic((new cljs.core.List(null,new cljs.core.Symbol(null,"get-in","get-in",-1965644065,null),null,(1),null)),(new cljs.core.List(null,new cljs.core.Symbol(null,"b","b",-1172211299,null),null,(1),null)),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([(new cljs.core.List(null,cljs.core.vec(cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$2((new cljs.core.List(null,new cljs.core.Keyword("block","properties","block/properties",708347145),null,(1),null)),(new cljs.core.List(null,f,null,(1),null)))))),null,(1),null))], 0)))),null,(1),null)),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([(new cljs.core.List(null,new cljs.core.Symbol(null,"result-num","result-num",1133657783,null),null,(1),null)),(new cljs.core.List(null,cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$2((new cljs.core.List(null,new cljs.core.Symbol(null,"parseFloat","parseFloat",1048011182,null),null,(1),null)),(new cljs.core.List(null,new cljs.core.Symbol(null,"result-str","result-str",977122937,null),null,(1),null))))),null,(1),null)),(new cljs.core.List(null,new cljs.core.Symbol(null,"result","result",-1239343558,null),null,(1),null)),(new cljs.core.List(null,cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic((new cljs.core.List(null,new cljs.core.Symbol(null,"if","if",1181717262,null),null,(1),null)),(new cljs.core.List(null,cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$2((new cljs.core.List(null,new cljs.core.Symbol(null,"isNaN","isNaN",74904266,null),null,(1),null)),(new cljs.core.List(null,new cljs.core.Symbol(null,"result-num","result-num",1133657783,null),null,(1),null))))),null,(1),null)),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([(new cljs.core.List(null,new cljs.core.Symbol(null,"result-str","result-str",977122937,null),null,(1),null)),(new cljs.core.List(null,new cljs.core.Symbol(null,"result-num","result-num",1133657783,null),null,(1),null))], 0)))),null,(1),null))], 0))))),null,(1),null)),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([(new cljs.core.List(null,cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic((new cljs.core.List(null,new cljs.core.Symbol(null,"or","or",1876275696,null),null,(1),null)),(new cljs.core.List(null,new cljs.core.Symbol(null,"result","result",-1239343558,null),null,(1),null)),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([(new cljs.core.List(null,cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic((new cljs.core.List(null,new cljs.core.Symbol(null,"when","when",1064114221,null),null,(1),null)),(new cljs.core.List(null,int_QMARK_,null,(1),null)),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([(new cljs.core.List(null,(0),null,(1),null))], 0)))),null,(1),null))], 0)))),null,(1),null))], 0)))),null,(1),null))], 0))));
}
} else {
return f;

}
}),ast);
});
/**
 * Provides functionality for {{function}}
 */
frontend.components.block.macros.function_macro = (function frontend$components$block$macros$function_macro(query_result_STAR_,arguments$){
var query_result = ((cljs.core.map_QMARK_(query_result_STAR_))?cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic(cljs.core.val,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([query_result_STAR_], 0)):query_result_STAR_);
var repo = frontend.state.get_current_repo();
var db = frontend.db.conn.get_db.cljs$core$IFn$_invoke$arity$1(repo);
var query_result_SINGLEQUOTE_ = ((frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(repo))?cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__107405_SHARP_){
return cljs.core.PersistentHashMap.fromArrays([new cljs.core.Keyword("block","properties","block/properties",708347145)],[frontend.components.block.macros.properties_by_name(db,p1__107405_SHARP_)]);
}),cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__107404_SHARP_){
var G__107417 = db;
var G__107418 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(p1__107404_SHARP_);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__107417,G__107418) : datascript.core.entity.call(null,G__107417,G__107418));
}),query_result)):query_result);
var fn_string = cljs.core.str.cljs$core$IFn$_invoke$arity$1(frontend.components.block.macros.normalize_query_function(frontend.handler.common.safe_read_string(goog.string.format("(fn [result] %s)",cljs.core.first(arguments$)),"failed to parse function"),repo,query_result_SINGLEQUOTE_));
var f = frontend.extensions.sci.eval_string.cljs$core$IFn$_invoke$arity$1(fn_string);
if(cljs.core.fn_QMARK_(f)){
try{return (f.cljs$core$IFn$_invoke$arity$1 ? f.cljs$core$IFn$_invoke$arity$1(query_result_SINGLEQUOTE_) : f.call(null,query_result_SINGLEQUOTE_));
}catch (e107422){var e = e107422;
return console.error(e);
}} else {
return null;
}
});

//# sourceMappingURL=frontend.components.block.macros.js.map
