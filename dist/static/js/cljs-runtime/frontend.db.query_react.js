goog.provide('frontend.db.query_react');
/**
 * Wrapper around db-inputs/resolve-input which provides editor-specific state
 */
frontend.db.query_react.resolve_input = (function frontend$db$query_react$resolve_input(var_args){
var G__103275 = arguments.length;
switch (G__103275) {
case 2:
return frontend.db.query_react.resolve_input.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return frontend.db.query_react.resolve_input.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.db.query_react.resolve_input.cljs$core$IFn$_invoke$arity$2 = (function (db,input){
return frontend.db.query_react.resolve_input.cljs$core$IFn$_invoke$arity$3(db,input,cljs.core.PersistentArrayMap.EMPTY);
}));

(frontend.db.query_react.resolve_input.cljs$core$IFn$_invoke$arity$3 = (function (db,input,opts){
return logseq.db.frontend.inputs.resolve_input(db,input,cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"current-page-fn","current-page-fn",1987406514),(function (){
var or__5002__auto__ = (function (){var temp__5804__auto__ = frontend.state.get_current_page();
if(cljs.core.truth_(temp__5804__auto__)){
var name_or_uuid = temp__5804__auto__;
if(cljs.core.truth_((logseq.db.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(db) : logseq.db.db_based_graph_QMARK_.call(null,db)))){
return new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(frontend.db.model.get_block_by_uuid(name_or_uuid));
} else {
return name_or_uuid;
}
} else {
return null;
}
})();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = new cljs.core.Keyword(null,"page","page",849072397).cljs$core$IFn$_invoke$arity$1(frontend.state.get_default_home());
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
return frontend.date.today();
}
}
})], null),opts], 0)));
}));

(frontend.db.query_react.resolve_input.cljs$lang$maxFixedArity = 3);

frontend.db.query_react.custom_query_result_transform = (function frontend$db$query_react$custom_query_result_transform(query_result,remove_blocks,q){
try{var result = frontend.db.utils.seq_flatten(query_result);
var block_QMARK_ = new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(cljs.core.first(result));
var result__$1 = (cljs.core.truth_(block_QMARK_)?(function (){var result__$1 = ((cljs.core.seq(remove_blocks))?(function (){var remove_blocks__$1 = cljs.core.set(remove_blocks);
return cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (h){
return cljs.core.contains_QMARK_(remove_blocks__$1,new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(h));
}),result);
})():result);
return frontend.db.model.with_pages(result__$1);
})():result);
var result_transform_fn = new cljs.core.Keyword(null,"result-transform","result-transform",1904908186).cljs$core$IFn$_invoke$arity$1(q);
var temp__5802__auto__ = (((result_transform_fn instanceof cljs.core.Keyword))?cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(frontend.state.sub_config.cljs$core$IFn$_invoke$arity$0(),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("query","result-transforms","query/result-transforms",2023939479),result_transform_fn], null)):result_transform_fn);
if(cljs.core.truth_(temp__5802__auto__)){
var result_transform = temp__5802__auto__;
var temp__5802__auto____$1 = frontend.extensions.sci.eval_string.cljs$core$IFn$_invoke$arity$1(cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([result_transform], 0)));
if(cljs.core.truth_(temp__5802__auto____$1)){
var f = temp__5802__auto____$1;
try{return frontend.extensions.sci.call_fn.cljs$core$IFn$_invoke$arity$variadic(f,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([result__$1], 0));
}catch (e103425){var e = e103425;
lambdaisland.glogi.log.cljs$core$IFn$_invoke$arity$4("frontend.db.query-react",new cljs.core.Keyword(null,"error","error",-978969032),cljs.core.identity(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("sci","call-error","sci/call-error",-306866581),e,new cljs.core.Keyword(null,"line","line",212345235),57], null)),null);

return result__$1;
}} else {
return result__$1;
}
} else {
return result__$1;
}
}catch (e103419){var e = e103419;
return lambdaisland.glogi.log.cljs$core$IFn$_invoke$arity$4("frontend.db.query-react",new cljs.core.Keyword(null,"error","error",-978969032),cljs.core.identity(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("query","failed","query/failed",-1572631082),e,new cljs.core.Keyword(null,"line","line",212345235),62], null)),null);
}});
frontend.db.query_react.resolve_query = (function frontend$db$query_react$resolve_query(query){
var page_ref_QMARK_ = (function (p1__103428_SHARP_){
return ((typeof p1__103428_SHARP_ === 'string') && (logseq.common.util.page_ref.page_ref_QMARK_(p1__103428_SHARP_)));
});
return clojure.walk.postwalk((function (f){
if((((f instanceof cljs.core.Keyword)) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("page",cljs.core.namespace(f))))){
return cljs.core.keyword.cljs$core$IFn$_invoke$arity$2("block",cljs.core.name(f));
} else {
if((((f instanceof cljs.core.Keyword)) && (cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("block","ref-blocks","block/ref-blocks",-375256927),null,new cljs.core.Keyword("block","ref-pages","block/ref-pages",379552702),null], null), null),f)))){
return new cljs.core.Keyword("block","refs","block/refs",-1214495349);
} else {
if(cljs.core.truth_((function (){var and__5000__auto__ = cljs.core.list_QMARK_(f);
if(and__5000__auto__){
var and__5000__auto____$1 = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.first(f),new cljs.core.Symbol(null,"=","=",-1501502141,null));
if(and__5000__auto____$1){
var and__5000__auto____$2 = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2((3),cljs.core.count(f));
if(and__5000__auto____$2){
return cljs.core.some(page_ref_QMARK_,cljs.core.rest(f));
} else {
return and__5000__auto____$2;
}
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})())){
var vec__103444 = cljs.core.rest(f);
var x = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__103444,(0),null);
var y = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__103444,(1),null);
var vec__103447 = ((page_ref_QMARK_(x))?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [x,y], null):new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [y,x], null));
var page_ref = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__103447,(0),null);
var sym = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__103447,(1),null);
var page_ref__$1 = clojure.string.lower_case(page_ref);
return (new cljs.core.List(null,new cljs.core.Symbol(null,"contains?","contains?",-1676812576,null),(new cljs.core.List(null,sym,(new cljs.core.List(null,logseq.common.util.page_ref.get_page_name(page_ref__$1),null,(1),null)),(2),null)),(3),null));
} else {
if(((cljs.core.vector_QMARK_(f)) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.first(f),new cljs.core.Symbol(null,"page-property","page-property",1223486862,null))) && ((frontend.util.nth_safe(f,(2)) instanceof cljs.core.Keyword)))))){
return cljs.core.update.cljs$core$IFn$_invoke$arity$3(f,(2),(function (k){
return cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(clojure.string.replace(cljs.core.name(k),"_","-"));
}));
} else {
return f;

}
}
}
}
}),query);
});
frontend.db.query_react.react_query = (function frontend$db$query_react$react_query(repo,p__103464,query_opts){
var map__103466 = p__103464;
var map__103466__$1 = cljs.core.__destructure_map(map__103466);
var query_SINGLEQUOTE_ = map__103466__$1;
var query = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__103466__$1,new cljs.core.Keyword(null,"query","query",-1288509510));
var inputs = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__103466__$1,new cljs.core.Keyword(null,"inputs","inputs",865803858));
var rules = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__103466__$1,new cljs.core.Keyword(null,"rules","rules",1198912366));
var pprint = (cljs.core.truth_(frontend.config.dev_QMARK_)?(function() { 
var G__103514__delegate = function (rest__103457_SHARP_){
if(cljs.core.truth_(frontend.state.developer_mode_QMARK_())){
return cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core.prn,rest__103457_SHARP_);
} else {
return null;
}
};
var G__103514 = function (var_args){
var rest__103457_SHARP_ = null;
if (arguments.length > 0) {
var G__103515__i = 0, G__103515__a = new Array(arguments.length -  0);
while (G__103515__i < G__103515__a.length) {G__103515__a[G__103515__i] = arguments[G__103515__i + 0]; ++G__103515__i;}
  rest__103457_SHARP_ = new cljs.core.IndexedSeq(G__103515__a,0,null);
} 
return G__103514__delegate.call(this,rest__103457_SHARP_);};
G__103514.cljs$lang$maxFixedArity = 0;
G__103514.cljs$lang$applyTo = (function (arglist__103516){
var rest__103457_SHARP_ = cljs.core.seq(arglist__103516);
return G__103514__delegate(rest__103457_SHARP_);
});
G__103514.cljs$core$IFn$_invoke$arity$variadic = G__103514__delegate;
return G__103514;
})()
:(function (_){
return null;
}));
var start_time = performance.now();
if(cljs.core.truth_(frontend.config.dev_QMARK_)){
console.groupCollapsed("react-query logs:");
} else {
}

pprint("================");

pprint("Use the following to debug your datalog queries:");

pprint(query_SINGLEQUOTE_);

var query__$1 = frontend.db.query_react.resolve_query(query);
var repo__$1 = (function (){var or__5002__auto__ = repo;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return frontend.state.get_current_repo();
}
})();
var db = frontend.db.conn.get_db.cljs$core$IFn$_invoke$arity$1(repo__$1);
var resolve_with = cljs.core.select_keys(query_opts,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"current-page-fn","current-page-fn",1987406514),new cljs.core.Keyword(null,"current-block-uuid","current-block-uuid",-559721957)], null));
var resolved_inputs = cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (p1__103462_SHARP_){
return frontend.db.query_react.resolve_input.cljs$core$IFn$_invoke$arity$3(db,p1__103462_SHARP_,resolve_with);
}),inputs);
var inputs__$1 = (function (){var G__103480 = resolved_inputs;
if(cljs.core.truth_(rules)){
return cljs.core.conj.cljs$core$IFn$_invoke$arity$2(G__103480,rules);
} else {
return G__103480;
}
})();
var k = new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"custom","custom",340151948),(function (){var or__5002__auto__ = new cljs.core.Keyword(null,"query-string","query-string",-1018845061).cljs$core$IFn$_invoke$arity$1(query_SINGLEQUOTE_);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return query_SINGLEQUOTE_;
}
})(),inputs__$1], null);
pprint("inputs (post-resolution):",resolved_inputs);

pprint("query-opts:",query_opts);

pprint(["time elapsed: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1((performance.now() - start_time).toFixed((2))),"ms"].join(''));

if(cljs.core.truth_(frontend.config.dev_QMARK_)){
console.groupEnd();
} else {
}

return cljs.core.apply.cljs$core$IFn$_invoke$arity$variadic(frontend.db.react.q,repo__$1,k,query_opts,query__$1,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([inputs__$1], 0));
});

//# sourceMappingURL=frontend.db.query_react.js.map
