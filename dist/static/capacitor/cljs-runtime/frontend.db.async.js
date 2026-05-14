goog.provide('frontend.db.async');
frontend.db.async._LT_q = frontend.db.async.util._LT_q;
frontend.db.async._LT_pull = frontend.db.async.util._LT_pull;
frontend.db.async._LT_get_files = (function frontend$db$async$_LT_get_files(graph){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((function (){var G__60958 = graph;
var G__60959 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"transact-db?","transact-db?",1279612399),false], null);
var G__60960 = new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"find","find",496279456),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.list(new cljs.core.Symbol(null,"pull","pull",779986722,null),new cljs.core.Symbol(null,"?file","?file",-1121006094,null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("file","path","file/path",-191335748),new cljs.core.Keyword("file","last-modified-at","file/last-modified-at",473527310)], null)),new cljs.core.Symbol(null,"...","...",-1926939749,null)], null),new cljs.core.Keyword(null,"where","where",-2044795965),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?file","?file",-1121006094,null),new cljs.core.Keyword("file","path","file/path",-191335748),new cljs.core.Symbol(null,"?path","?path",385070032,null)], null)], null);
return (frontend.db.async._LT_q.cljs$core$IFn$_invoke$arity$3 ? frontend.db.async._LT_q.cljs$core$IFn$_invoke$arity$3(G__60958,G__60959,G__60960) : frontend.db.async._LT_q.call(null,G__60958,G__60959,G__60960));
})()),(function (result){
return promesa.protocols._promise(cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__60955_SHARP_){
return (new cljs.core.PersistentVector(null,2,(5),cljs.core.PersistentVector.EMPTY_NODE,[new cljs.core.Keyword("file","path","file/path",-191335748).cljs$core$IFn$_invoke$arity$1(p1__60955_SHARP_),(function (){var or__5002__auto__ = new cljs.core.Keyword("file","last-modified-at","file/last-modified-at",473527310).cljs$core$IFn$_invoke$arity$1(p1__60955_SHARP_);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return (0);
}
})()],null));
}),cljs.core.reverse(cljs.core.seq(result))));
}));
}));
});
frontend.db.async._LT_get_all_templates = (function frontend$db$async$_LT_get_all_templates(graph){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((function (){var G__60962 = graph;
var G__60963 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"transact-db?","transact-db?",1279612399),true], null);
var G__60964 = new cljs.core.PersistentVector(null, 6, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"find","find",496279456),new cljs.core.Symbol(null,"?t","?t",1786819229,null),cljs.core.list(new cljs.core.Symbol(null,"pull","pull",779986722,null),new cljs.core.Symbol(null,"?b","?b",1575118075,null),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"*","*",345799209,null)], null)),new cljs.core.Keyword(null,"where","where",-2044795965),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?b","?b",1575118075,null),new cljs.core.Keyword("block","properties","block/properties",708347145),new cljs.core.Symbol(null,"?p","?p",-10896580,null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.list(new cljs.core.Symbol(null,"get","get",-971253014,null),new cljs.core.Symbol(null,"?p","?p",-10896580,null),new cljs.core.Keyword(null,"template","template",-702405684)),new cljs.core.Symbol(null,"?t","?t",1786819229,null)], null)], null);
return (frontend.db.async._LT_q.cljs$core$IFn$_invoke$arity$3 ? frontend.db.async._LT_q.cljs$core$IFn$_invoke$arity$3(G__60962,G__60963,G__60964) : frontend.db.async._LT_q.call(null,G__60962,G__60963,G__60964));
})()),(function (result){
return promesa.protocols._promise(cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p__60965){
var vec__60966 = p__60965;
var template = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__60966,(0),null);
var b = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__60966,(1),null);
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [template,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(b,new cljs.core.Keyword("block","title","block/title",710445684),template)], null);
}),result)));
}));
}));
});
frontend.db.async._LT_get_template_by_name = (function frontend$db$async$_LT_get_template_by_name(name){
var repo = frontend.state.get_current_repo();
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.db.async._LT_get_all_templates(repo)),(function (templates){
return promesa.protocols._promise(cljs.core.get.cljs$core$IFn$_invoke$arity$2(templates,name));
}));
}));
});
/**
 * Returns all public properties as property maps including their
 *   :block/title and :db/ident. For file graphs the map only contains
 *   :block/title
 */
frontend.db.async._LT_get_all_properties = (function frontend$db$async$_LT_get_all_properties(var_args){
var args__5732__auto__ = [];
var len__5726__auto___61091 = arguments.length;
var i__5727__auto___61092 = (0);
while(true){
if((i__5727__auto___61092 < len__5726__auto___61091)){
args__5732__auto__.push((arguments[i__5727__auto___61092]));

var G__61093 = (i__5727__auto___61092 + (1));
i__5727__auto___61092 = G__61093;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((0) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((0)),(0),null)):null);
return frontend.db.async._LT_get_all_properties.cljs$core$IFn$_invoke$arity$variadic(argseq__5733__auto__);
});

(frontend.db.async._LT_get_all_properties.cljs$core$IFn$_invoke$arity$variadic = (function (p__60978){
var map__60979 = p__60978;
var map__60979__$1 = cljs.core.__destructure_map(map__60979);
var opts = map__60979__$1;
var temp__5804__auto__ = frontend.state.get_current_repo();
if(cljs.core.truth_(temp__5804__auto__)){
var graph = temp__5804__auto__;
if(frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(graph)){
return frontend.db.model.get_all_properties.cljs$core$IFn$_invoke$arity$variadic(graph,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([opts], 0));
} else {
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.db.file_based.async._LT_file_based_get_all_properties(graph)),(function (properties){
return promesa.protocols._mcat(promesa.protocols._promise(cljs.core.set(cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.name,frontend.handler.file_based.property.util.hidden_properties()))),(function (hidden_properties){
return promesa.protocols._promise(cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (p1__60976_SHARP_){
var G__60981 = new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(p1__60976_SHARP_);
return (hidden_properties.cljs$core$IFn$_invoke$arity$1 ? hidden_properties.cljs$core$IFn$_invoke$arity$1(G__60981) : hidden_properties.call(null,G__60981));
}),properties));
}));
}));
}));
}
} else {
return null;
}
}));

(frontend.db.async._LT_get_all_properties.cljs$lang$maxFixedArity = (0));

/** @this {Function} */
(frontend.db.async._LT_get_all_properties.cljs$lang$applyTo = (function (seq60977){
var self__5712__auto__ = this;
return self__5712__auto__.cljs$core$IFn$_invoke$arity$variadic(cljs.core.seq(seq60977));
}));

/**
 * For file graphs, returns property value names for given property name
 */
frontend.db.async._LT_file_get_property_values = (function frontend$db$async$_LT_file_get_property_values(graph,property){
if(frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(graph)){
return null;
} else {
return frontend.db.file_based.async._LT_get_file_based_property_values(graph,property);
}
});
/**
 * For db graphs, returns a vec of property value maps for given property
 *   db-ident.  The map contains a :label key which can be a string or number (for
 *   query builder) and a :value key which contains the entity or scalar property value
 */
frontend.db.async._LT_get_property_values = (function frontend$db$async$_LT_get_property_values(var_args){
var args__5732__auto__ = [];
var len__5726__auto___61095 = arguments.length;
var i__5727__auto___61096 = (0);
while(true){
if((i__5727__auto___61096 < len__5726__auto___61095)){
args__5732__auto__.push((arguments[i__5727__auto___61096]));

var G__61097 = (i__5727__auto___61096 + (1));
i__5727__auto___61096 = G__61097;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return frontend.db.async._LT_get_property_values.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(frontend.db.async._LT_get_property_values.cljs$core$IFn$_invoke$arity$variadic = (function (property_id,p__60993){
var map__60994 = p__60993;
var map__60994__$1 = cljs.core.__destructure_map(map__60994);
var opts = map__60994__$1;
if(cljs.core.truth_(property_id)){
return frontend.state._LT_invoke_db_worker.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword("thread-api","get-property-values","thread-api/get-property-values",60992180),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([frontend.state.get_current_repo(),cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(opts,new cljs.core.Keyword(null,"property-ident","property-ident",697145839),property_id)], 0));
} else {
return null;
}
}));

(frontend.db.async._LT_get_property_values.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(frontend.db.async._LT_get_property_values.cljs$lang$applyTo = (function (seq60986){
var G__60987 = cljs.core.first(seq60986);
var seq60986__$1 = cljs.core.next(seq60986);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__60987,seq60986__$1);
}));

frontend.db.async._LT_get_block = (function frontend$db$async$_LT_get_block(var_args){
var args__5732__auto__ = [];
var len__5726__auto___61098 = arguments.length;
var i__5727__auto___61099 = (0);
while(true){
if((i__5727__auto___61099 < len__5726__auto___61098)){
args__5732__auto__.push((arguments[i__5727__auto___61099]));

var G__61100 = (i__5727__auto___61099 + (1));
i__5727__auto___61099 = G__61100;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((2) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((2)),(0),null)):null);
return frontend.db.async._LT_get_block.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),(arguments[(1)]),argseq__5733__auto__);
});

(frontend.db.async._LT_get_block.cljs$core$IFn$_invoke$arity$variadic = (function (graph,id_uuid_or_name,p__60999){
var map__61000 = p__60999;
var map__61000__$1 = cljs.core.__destructure_map(map__61000);
var opts = map__61000__$1;
var children_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__61000__$1,new cljs.core.Keyword(null,"children?","children?",-1199594108),true);
var nested_children_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__61000__$1,new cljs.core.Keyword(null,"nested-children?","nested-children?",1651323711));
var skip_transact_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__61000__$1,new cljs.core.Keyword(null,"skip-transact?","skip-transact?",-1820887310));
var skip_refresh_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__61000__$1,new cljs.core.Keyword(null,"skip-refresh?","skip-refresh?",878432095));
var children_only_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__61000__$1,new cljs.core.Keyword(null,"children-only?","children-only?",-1225782855));
var properties = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__61000__$1,new cljs.core.Keyword(null,"properties","properties",685819552));
var name_SINGLEQUOTE_ = cljs.core.str.cljs$core$IFn$_invoke$arity$1(id_uuid_or_name);
var opts__$1 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(opts,new cljs.core.Keyword(null,"children?","children?",-1199594108),children_QMARK_);
var e = ((typeof id_uuid_or_name === 'number')?(frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(id_uuid_or_name) : frontend.db.entity.call(null,id_uuid_or_name)):(cljs.core.truth_((frontend.util.uuid_string_QMARK_.cljs$core$IFn$_invoke$arity$1 ? frontend.util.uuid_string_QMARK_.cljs$core$IFn$_invoke$arity$1(name_SINGLEQUOTE_) : frontend.util.uuid_string_QMARK_.call(null,name_SINGLEQUOTE_)))?(function (){var G__61001 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),cljs.core.uuid(name_SINGLEQUOTE_)], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__61001) : frontend.db.entity.call(null,G__61001));
})():(frontend.db.get_page.cljs$core$IFn$_invoke$arity$1 ? frontend.db.get_page.cljs$core$IFn$_invoke$arity$1(name_SINGLEQUOTE_) : frontend.db.get_page.call(null,name_SINGLEQUOTE_))
));
var id = (function (){var or__5002__auto__ = (function (){var and__5000__auto__ = new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(e);
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(e));
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = (function (){var and__5000__auto__ = (frontend.util.uuid_string_QMARK_.cljs$core$IFn$_invoke$arity$1 ? frontend.util.uuid_string_QMARK_.cljs$core$IFn$_invoke$arity$1(name_SINGLEQUOTE_) : frontend.util.uuid_string_QMARK_.call(null,name_SINGLEQUOTE_));
if(cljs.core.truth_(and__5000__auto__)){
return name_SINGLEQUOTE_;
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
return id_uuid_or_name;
}
}
})();
if(cljs.core.truth_((function (){var and__5000__auto__ = new cljs.core.Keyword("block.temp","fully-loaded?","block.temp/fully-loaded?",-116637365).cljs$core$IFn$_invoke$arity$1(e);
if(cljs.core.truth_(and__5000__auto__)){
return ((cljs.core.not(children_only_QMARK_)) && (((cljs.core.not(children_QMARK_)) && (((cljs.core.not(nested_children_QMARK_)) && (cljs.core.not(cljs.core.some(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("block.temp","refs-count","block.temp/refs-count",-598132499),null], null), null),properties))))))));
} else {
return and__5000__auto__;
}
})())){
return promesa.core.promise.cljs$core$IFn$_invoke$arity$1(e);
} else {
return promesa.core.catch$.cljs$core$IFn$_invoke$arity$2(promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.state._LT_invoke_db_worker.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword("thread-api","get-blocks","thread-api/get-blocks",-999880266),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([graph,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"id","id",-1388402092),id,new cljs.core.Keyword(null,"opts","opts",155075701),opts__$1], null)], null)], 0))),(function (result){
return promesa.protocols._mcat(promesa.protocols._promise(cljs.core.first(result)),(function (p__61003){
var map__61004 = p__61003;
var map__61004__$1 = cljs.core.__destructure_map(map__61004);
var block = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__61004__$1,new cljs.core.Keyword(null,"block","block",664686210));
var children = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__61004__$1,new cljs.core.Keyword(null,"children","children",-940561982));
return promesa.protocols._mcat(promesa.protocols._promise((cljs.core.truth_(skip_transact_QMARK_)?null:(function (){var conn = (frontend.db.get_db.cljs$core$IFn$_invoke$arity$2 ? frontend.db.get_db.cljs$core$IFn$_invoke$arity$2(graph,false) : frontend.db.get_db.call(null,graph,false));
var block_and_children = (cljs.core.truth_(block)?cljs.core.cons(block,children):children);
var affected_keys = new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("frontend.worker.react","block","frontend.worker.react/block",2007555355),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block)], null)], null);
var tx_data = cljs.core.remove.cljs$core$IFn$_invoke$arity$2(cljs.core.empty_QMARK_,logseq.common.util.fast_remove_nils(cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (b){
return new cljs.core.Keyword("block.temp","fully-loaded?","block.temp/fully-loaded?",-116637365).cljs$core$IFn$_invoke$arity$1((function (){var G__61005 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(b);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__61005) : frontend.db.entity.call(null,G__61005));
})());
}),block_and_children)));
if(cljs.core.seq(tx_data)){
(datascript.core.transact_BANG_.cljs$core$IFn$_invoke$arity$2 ? datascript.core.transact_BANG_.cljs$core$IFn$_invoke$arity$2(conn,tx_data) : datascript.core.transact_BANG_.call(null,conn,tx_data));
} else {
}

if(cljs.core.truth_(skip_refresh_QMARK_)){
return null;
} else {
return frontend.db.react.refresh_affected_queries_BANG_.cljs$core$IFn$_invoke$arity$variadic(graph,affected_keys,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"skip-kv-custom-keys?","skip-kv-custom-keys?",-1568075009),true], null)], 0));
}
})())),(function (___40947__auto__){
return promesa.protocols._promise((cljs.core.truth_(children_only_QMARK_)?children:block));
}));
}));
}));
})),(function (error){
console.error(error);

throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2("get-block error",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"block","block",664686210),id_uuid_or_name], null));
}));

}
}));

(frontend.db.async._LT_get_block.cljs$lang$maxFixedArity = (2));

/** @this {Function} */
(frontend.db.async._LT_get_block.cljs$lang$applyTo = (function (seq60995){
var G__60996 = cljs.core.first(seq60995);
var seq60995__$1 = cljs.core.next(seq60995);
var G__60997 = cljs.core.first(seq60995__$1);
var seq60995__$2 = cljs.core.next(seq60995__$1);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__60996,G__60997,seq60995__$2);
}));

frontend.db.async._LT_get_blocks = (function frontend$db$async$_LT_get_blocks(var_args){
var args__5732__auto__ = [];
var len__5726__auto___61101 = arguments.length;
var i__5727__auto___61102 = (0);
while(true){
if((i__5727__auto___61102 < len__5726__auto___61101)){
args__5732__auto__.push((arguments[i__5727__auto___61102]));

var G__61103 = (i__5727__auto___61102 + (1));
i__5727__auto___61102 = G__61103;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((2) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((2)),(0),null)):null);
return frontend.db.async._LT_get_blocks.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),(arguments[(1)]),argseq__5733__auto__);
});

(frontend.db.async._LT_get_blocks.cljs$core$IFn$_invoke$arity$variadic = (function (graph,ids_STAR_,p__61014){
var map__61015 = p__61014;
var map__61015__$1 = cljs.core.__destructure_map(map__61015);
var opts = map__61015__$1;
var ids = cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (id){
return new cljs.core.Keyword("block.temp","fully-loaded?","block.temp/fully-loaded?",-116637365).cljs$core$IFn$_invoke$arity$1((frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(id) : frontend.db.entity.call(null,id)));
}),ids_STAR_);
if(cljs.core.seq(ids)){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.state._LT_invoke_db_worker.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword("thread-api","get-blocks","thread-api/get-blocks",-999880266),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([graph,cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (id){
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"id","id",-1388402092),id,new cljs.core.Keyword(null,"opts","opts",155075701),cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(opts,new cljs.core.Keyword(null,"children?","children?",-1199594108),false)], null);
}),ids)], 0))),(function (result){
return promesa.protocols._promise((function (){var conn = (frontend.db.get_db.cljs$core$IFn$_invoke$arity$2 ? frontend.db.get_db.cljs$core$IFn$_invoke$arity$2(graph,false) : frontend.db.get_db.call(null,graph,false));
var result_SINGLEQUOTE_ = cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"block","block",664686210),result);
if(cljs.core.seq(result_SINGLEQUOTE_)){
var result_SINGLEQUOTE__SINGLEQUOTE__61104 = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (b){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(b,new cljs.core.Keyword("block.temp","fully-loaded?","block.temp/fully-loaded?",-116637365),true);
}),result_SINGLEQUOTE_);
(datascript.core.transact_BANG_.cljs$core$IFn$_invoke$arity$2 ? datascript.core.transact_BANG_.cljs$core$IFn$_invoke$arity$2(conn,result_SINGLEQUOTE__SINGLEQUOTE__61104) : datascript.core.transact_BANG_.call(null,conn,result_SINGLEQUOTE__SINGLEQUOTE__61104));
} else {
}

return result_SINGLEQUOTE_;
})());
}));
}));
} else {
return null;
}
}));

(frontend.db.async._LT_get_blocks.cljs$lang$maxFixedArity = (2));

/** @this {Function} */
(frontend.db.async._LT_get_blocks.cljs$lang$applyTo = (function (seq61009){
var G__61010 = cljs.core.first(seq61009);
var seq61009__$1 = cljs.core.next(seq61009);
var G__61011 = cljs.core.first(seq61009__$1);
var seq61009__$2 = cljs.core.next(seq61009__$1);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__61010,G__61011,seq61009__$2);
}));

frontend.db.async._LT_get_block_parents = (function frontend$db$async$_LT_get_block_parents(graph,id,depth){
if(cljs.core.integer_QMARK_(id)){
} else {
throw (new Error("Assert failed: (integer? id)"));
}

if(cljs.core.truth_(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1((frontend.db.entity.cljs$core$IFn$_invoke$arity$2 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$2(graph,id) : frontend.db.entity.call(null,graph,id))))){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.state._LT_invoke_db_worker.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword("thread-api","get-block-parents","thread-api/get-block-parents",-1793488563),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([graph,id,depth], 0))),(function (result){
return promesa.protocols._mcat(promesa.protocols._promise((frontend.db.get_db.cljs$core$IFn$_invoke$arity$2 ? frontend.db.get_db.cljs$core$IFn$_invoke$arity$2(graph,false) : frontend.db.get_db.call(null,graph,false))),(function (conn){
return promesa.protocols._mcat(promesa.protocols._promise((datascript.core.transact_BANG_.cljs$core$IFn$_invoke$arity$2 ? datascript.core.transact_BANG_.cljs$core$IFn$_invoke$arity$2(conn,result) : datascript.core.transact_BANG_.call(null,conn,result))),(function (_){
return promesa.protocols._promise(result);
}));
}));
}));
}));
} else {
return null;
}
});
frontend.db.async._LT_get_block_refs = (function frontend$db$async$_LT_get_block_refs(graph,eid){
if(cljs.core.integer_QMARK_(eid)){
} else {
throw (new Error("Assert failed: (integer? eid)"));
}

return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.state._LT_invoke_db_worker.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword("thread-api","get-block-refs","thread-api/get-block-refs",-862947599),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([graph,eid], 0))),(function (result){
return promesa.protocols._mcat(promesa.protocols._promise((frontend.db.get_db.cljs$core$IFn$_invoke$arity$2 ? frontend.db.get_db.cljs$core$IFn$_invoke$arity$2(graph,false) : frontend.db.get_db.call(null,graph,false))),(function (conn){
return promesa.protocols._mcat(promesa.protocols._promise((datascript.core.transact_BANG_.cljs$core$IFn$_invoke$arity$2 ? datascript.core.transact_BANG_.cljs$core$IFn$_invoke$arity$2(conn,result) : datascript.core.transact_BANG_.call(null,conn,result))),(function (_){
return promesa.protocols._promise(result);
}));
}));
}));
}));
});
frontend.db.async._LT_get_block_refs_count = (function frontend$db$async$_LT_get_block_refs_count(graph,eid){
if(cljs.core.integer_QMARK_(eid)){
} else {
throw (new Error("Assert failed: (integer? eid)"));
}

return frontend.state._LT_invoke_db_worker.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword("thread-api","get-block-refs-count","thread-api/get-block-refs-count",1389941875),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([graph,eid], 0));
});
/**
 * Get all uuids of blocks with any back link exists.
 */
frontend.db.async._LT_get_all_referenced_blocks_uuid = (function frontend$db$async$_LT_get_all_referenced_blocks_uuid(graph){
var G__61016 = graph;
var G__61017 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"transact-db?","transact-db?",1279612399),false], null);
var G__61018 = new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"find","find",496279456),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?refed-uuid","?refed-uuid",417914050,null),new cljs.core.Symbol(null,"...","...",-1926939749,null)], null),new cljs.core.Keyword(null,"where","where",-2044795965),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?refed-b","?refed-b",-875900233,null),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Symbol(null,"?refed-uuid","?refed-uuid",417914050,null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?referee-b","?referee-b",1661362384,null),new cljs.core.Keyword("block","refs","block/refs",-1214495349),new cljs.core.Symbol(null,"?refed-b","?refed-b",-875900233,null)], null)], null);
return (frontend.db.async._LT_q.cljs$core$IFn$_invoke$arity$3 ? frontend.db.async._LT_q.cljs$core$IFn$_invoke$arity$3(G__61016,G__61017,G__61018) : frontend.db.async._LT_q.call(null,G__61016,G__61017,G__61018));
});
frontend.db.async._LT_get_file = (function frontend$db$async$_LT_get_file(graph,path){
if(cljs.core.truth_((function (){var and__5000__auto__ = graph;
if(cljs.core.truth_(and__5000__auto__)){
return path;
} else {
return and__5000__auto__;
}
})())){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((function (){var G__61023 = graph;
var G__61024 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("file","path","file/path",-191335748),path], null);
return (frontend.db.async._LT_pull.cljs$core$IFn$_invoke$arity$2 ? frontend.db.async._LT_pull.cljs$core$IFn$_invoke$arity$2(G__61023,G__61024) : frontend.db.async._LT_pull.call(null,G__61023,G__61024));
})()),(function (result){
return promesa.protocols._promise(new cljs.core.Keyword("file","content","file/content",12680964).cljs$core$IFn$_invoke$arity$1(result));
}));
}));
} else {
return null;
}
});
frontend.db.async._LT_get_date_scheduled_or_deadlines = (function frontend$db$async$_LT_get_date_scheduled_or_deadlines(journal_title){
var temp__5804__auto__ = frontend.date.journal_title__GT_int(journal_title);
if(cljs.core.truth_(temp__5804__auto__)){
var date = temp__5804__auto__;
var future_days = frontend.state.get_scheduled_future_days();
var date_format = cljs_time.format.formatter.cljs$core$IFn$_invoke$arity$1("yyyyMMdd");
var current_day = cljs_time.format.parse.cljs$core$IFn$_invoke$arity$2(date_format,cljs.core.str.cljs$core$IFn$_invoke$arity$1(date));
var future_date = cljs_time.core.plus.cljs$core$IFn$_invoke$arity$2(current_day,cljs_time.core.days.cljs$core$IFn$_invoke$arity$1(future_days));
var future_day = (function (){var G__61026 = future_date;
var G__61026__$1 = (((G__61026 == null))?null:cljs_time.format.unparse(date_format,G__61026));
if((G__61026__$1 == null)){
return null;
} else {
return cljs.core.parse_long(G__61026__$1);
}
})();
var start_time = (frontend.date.journal_day__GT_utc_ms.cljs$core$IFn$_invoke$arity$1 ? frontend.date.journal_day__GT_utc_ms.cljs$core$IFn$_invoke$arity$1(date) : frontend.date.journal_day__GT_utc_ms.call(null,date));
var future_time = cljs_time.coerce.to_long(future_date);
var temp__5804__auto____$1 = (function (){var and__5000__auto__ = future_day;
if(cljs.core.truth_(and__5000__auto__)){
return frontend.state.get_current_repo();
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5804__auto____$1)){
var repo = temp__5804__auto____$1;
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(((frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(repo))?(function (){var G__61032 = repo;
var G__61033 = cljs.core.PersistentArrayMap.EMPTY;
var G__61034 = new cljs.core.PersistentVector(null, 15, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"find","find",496279456),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.list(new cljs.core.Symbol(null,"pull","pull",779986722,null),new cljs.core.Symbol(null,"?block","?block",1541466123,null),new cljs.core.Symbol(null,"?block-attrs","?block-attrs",1362551561,null)),new cljs.core.Symbol(null,"...","...",-1926939749,null)], null),new cljs.core.Keyword(null,"in","in",-1531184865),new cljs.core.Symbol(null,"$","$",-1580747756,null),new cljs.core.Symbol(null,"?start-time","?start-time",156449407,null),new cljs.core.Symbol(null,"?end-time","?end-time",-2048774004,null),new cljs.core.Symbol(null,"?block-attrs","?block-attrs",1362551561,null),new cljs.core.Keyword(null,"where","where",-2044795965),cljs.core.list(new cljs.core.Symbol(null,"or","or",1876275696,null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?block","?block",1541466123,null),new cljs.core.Keyword("logseq.property","scheduled","logseq.property/scheduled",1644520943),new cljs.core.Symbol(null,"?n","?n",-2053238410,null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?block","?block",1541466123,null),new cljs.core.Keyword("logseq.property","deadline","logseq.property/deadline",1685901604),new cljs.core.Symbol(null,"?n","?n",-2053238410,null)], null)),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.list(new cljs.core.Symbol(null,">=",">=",1016916022,null),new cljs.core.Symbol(null,"?n","?n",-2053238410,null),new cljs.core.Symbol(null,"?start-time","?start-time",156449407,null))], null),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.list(new cljs.core.Symbol(null,"<=","<=",1244895369,null),new cljs.core.Symbol(null,"?n","?n",-2053238410,null),new cljs.core.Symbol(null,"?end-time","?end-time",-2048774004,null))], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?block","?block",1541466123,null),new cljs.core.Keyword("logseq.property","status","logseq.property/status",-907216853),new cljs.core.Symbol(null,"?status","?status",-1715705409,null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?status","?status",-1715705409,null),new cljs.core.Keyword("db","ident","db/ident",-737096),new cljs.core.Symbol(null,"?status-ident","?status-ident",735469247,null)], null),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.list(new cljs.core.Symbol(null,"not=","not=",1466536204,null),new cljs.core.Symbol(null,"?status-ident","?status-ident",735469247,null),new cljs.core.Keyword("logseq.property","status.done","logseq.property/status.done",-1827582082))], null),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.list(new cljs.core.Symbol(null,"not=","not=",1466536204,null),new cljs.core.Symbol(null,"?status-ident","?status-ident",735469247,null),new cljs.core.Keyword("logseq.property","status.canceled","logseq.property/status.canceled",752643262))], null)], null);
var G__61035 = start_time;
var G__61036 = future_time;
var G__61037 = new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"*","*",345799209,null)], null);
return (frontend.db.async._LT_q.cljs$core$IFn$_invoke$arity$6 ? frontend.db.async._LT_q.cljs$core$IFn$_invoke$arity$6(G__61032,G__61033,G__61034,G__61035,G__61036,G__61037) : frontend.db.async._LT_q.call(null,G__61032,G__61033,G__61034,G__61035,G__61036,G__61037));
})():(function (){var G__61038 = repo;
var G__61039 = cljs.core.PersistentArrayMap.EMPTY;
var G__61040 = new cljs.core.PersistentVector(null, 16, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"find","find",496279456),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.list(new cljs.core.Symbol(null,"pull","pull",779986722,null),new cljs.core.Symbol(null,"?block","?block",1541466123,null),new cljs.core.Symbol(null,"?block-attrs","?block-attrs",1362551561,null)),new cljs.core.Symbol(null,"...","...",-1926939749,null)], null),new cljs.core.Keyword(null,"in","in",-1531184865),new cljs.core.Symbol(null,"$","$",-1580747756,null),new cljs.core.Symbol(null,"?day","?day",686036275,null),new cljs.core.Symbol(null,"?future","?future",1027205190,null),new cljs.core.Symbol(null,"?block-attrs","?block-attrs",1362551561,null),new cljs.core.Keyword(null,"where","where",-2044795965),cljs.core.list(new cljs.core.Symbol(null,"or","or",1876275696,null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?block","?block",1541466123,null),new cljs.core.Keyword("block","scheduled","block/scheduled",584810412),new cljs.core.Symbol(null,"?d","?d",-1851543854,null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?block","?block",1541466123,null),new cljs.core.Keyword("block","deadline","block/deadline",660945231),new cljs.core.Symbol(null,"?d","?d",-1851543854,null)], null)),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.list(new cljs.core.Symbol(null,"get-else","get-else",1312024065,null),new cljs.core.Symbol(null,"$","$",-1580747756,null),new cljs.core.Symbol(null,"?block","?block",1541466123,null),new cljs.core.Keyword("block","repeated?","block/repeated?",-1344319799),false),new cljs.core.Symbol(null,"?repeated","?repeated",449465208,null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.list(new cljs.core.Symbol(null,"get-else","get-else",1312024065,null),new cljs.core.Symbol(null,"$","$",-1580747756,null),new cljs.core.Symbol(null,"?block","?block",1541466123,null),new cljs.core.Keyword("block","marker","block/marker",1231576318),"NIL"),new cljs.core.Symbol(null,"?marker","?marker",1230004157,null)], null),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.list(new cljs.core.Symbol(null,"not=","not=",1466536204,null),new cljs.core.Symbol(null,"?marker","?marker",1230004157,null),"DONE")], null),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.list(new cljs.core.Symbol(null,"not=","not=",1466536204,null),new cljs.core.Symbol(null,"?marker","?marker",1230004157,null),"CANCELED")], null),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.list(new cljs.core.Symbol(null,"not=","not=",1466536204,null),new cljs.core.Symbol(null,"?marker","?marker",1230004157,null),"CANCELLED")], null),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.list(new cljs.core.Symbol(null,"<=","<=",1244895369,null),new cljs.core.Symbol(null,"?d","?d",-1851543854,null),new cljs.core.Symbol(null,"?future","?future",1027205190,null))], null),cljs.core.list(new cljs.core.Symbol(null,"or-join","or-join",591375469,null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?repeated","?repeated",449465208,null),new cljs.core.Symbol(null,"?d","?d",-1851543854,null),new cljs.core.Symbol(null,"?day","?day",686036275,null)], null),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.list(new cljs.core.Symbol(null,"true?","true?",-1600332395,null),new cljs.core.Symbol(null,"?repeated","?repeated",449465208,null))], null),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.list(new cljs.core.Symbol(null,">=",">=",1016916022,null),new cljs.core.Symbol(null,"?d","?d",-1851543854,null),new cljs.core.Symbol(null,"?day","?day",686036275,null))], null))], null);
var G__61041 = date;
var G__61042 = future_day;
var G__61043 = frontend.db.file_based.model.file_graph_block_attrs;
return (frontend.db.async._LT_q.cljs$core$IFn$_invoke$arity$6 ? frontend.db.async._LT_q.cljs$core$IFn$_invoke$arity$6(G__61038,G__61039,G__61040,G__61041,G__61042,G__61043) : frontend.db.async._LT_q.call(null,G__61038,G__61039,G__61040,G__61041,G__61042,G__61043));
})())),(function (result){
return promesa.protocols._promise(frontend.db.utils.group_by_page(frontend.db.model.sort_by_order_recursive(result)));
}));
}));
} else {
return null;
}
} else {
return null;
}
});
frontend.db.async._LT_get_tag_pages = (function frontend$db$async$_LT_get_tag_pages(graph,tag_id){
var G__61044 = graph;
var G__61045 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"transact-db?","transact-db?",1279612399),false], null);
var G__61046 = new cljs.core.PersistentVector(null, 8, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"find","find",496279456),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.list(new cljs.core.Symbol(null,"pull","pull",779986722,null),new cljs.core.Symbol(null,"?page","?page",-1343187612,null),new cljs.core.PersistentVector(null, 6, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","id","db/id",-1388397098),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Keyword("block","name","block/name",1619760316),new cljs.core.Keyword("block","title","block/title",710445684),new cljs.core.Keyword("block","created-at","block/created-at",1440015),new cljs.core.Keyword("block","updated-at","block/updated-at",-1516550551)], null)),new cljs.core.Symbol(null,"...","...",-1926939749,null)], null),new cljs.core.Keyword(null,"in","in",-1531184865),new cljs.core.Symbol(null,"$","$",-1580747756,null),new cljs.core.Symbol(null,"?tag-id","?tag-id",-748587738,null),new cljs.core.Keyword(null,"where","where",-2044795965),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?page","?page",-1343187612,null),new cljs.core.Keyword("block","tags","block/tags",1814948340),new cljs.core.Symbol(null,"?tag-id","?tag-id",-748587738,null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?page","?page",-1343187612,null),new cljs.core.Keyword("block","name","block/name",1619760316)], null)], null);
var G__61047 = tag_id;
return (frontend.db.async._LT_q.cljs$core$IFn$_invoke$arity$4 ? frontend.db.async._LT_q.cljs$core$IFn$_invoke$arity$4(G__61044,G__61045,G__61046,G__61047) : frontend.db.async._LT_q.call(null,G__61044,G__61045,G__61046,G__61047));
});
frontend.db.async._LT_get_tag_objects = (function frontend$db$async$_LT_get_tag_objects(graph,class_id){
var class_children = frontend.db.model.get_structured_children(graph,class_id);
var class_ids = cljs.core.distinct.cljs$core$IFn$_invoke$arity$1(cljs.core.conj.cljs$core$IFn$_invoke$arity$2(class_children,class_id));
var G__61048 = graph;
var G__61049 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"transact-db?","transact-db?",1279612399),true], null);
var G__61050 = new cljs.core.PersistentVector(null, 7, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"find","find",496279456),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.list(new cljs.core.Symbol(null,"pull","pull",779986722,null),new cljs.core.Symbol(null,"?b","?b",1575118075,null),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"*","*",345799209,null)], null)),new cljs.core.Symbol(null,"...","...",-1926939749,null)], null),new cljs.core.Keyword(null,"in","in",-1531184865),new cljs.core.Symbol(null,"$","$",-1580747756,null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?class-id","?class-id",-1653001743,null),new cljs.core.Symbol(null,"...","...",-1926939749,null)], null),new cljs.core.Keyword(null,"where","where",-2044795965),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?b","?b",1575118075,null),new cljs.core.Keyword("block","tags","block/tags",1814948340),new cljs.core.Symbol(null,"?class-id","?class-id",-1653001743,null)], null)], null);
var G__61051 = class_ids;
return (frontend.db.async._LT_q.cljs$core$IFn$_invoke$arity$4 ? frontend.db.async._LT_q.cljs$core$IFn$_invoke$arity$4(G__61048,G__61049,G__61050,G__61051) : frontend.db.async._LT_q.call(null,G__61048,G__61049,G__61050,G__61051));
});
frontend.db.async._LT_get_whiteboards = (function frontend$db$async$_LT_get_whiteboards(graph){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(((frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(graph))?(function (){var G__61052 = graph;
var G__61053 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"transact-db?","transact-db?",1279612399),false], null);
var G__61054 = new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"find","find",496279456),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.list(new cljs.core.Symbol(null,"pull","pull",779986722,null),new cljs.core.Symbol(null,"?page","?page",-1343187612,null),new cljs.core.PersistentVector(null, 6, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","id","db/id",-1388397098),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Keyword("block","name","block/name",1619760316),new cljs.core.Keyword("block","title","block/title",710445684),new cljs.core.Keyword("block","created-at","block/created-at",1440015),new cljs.core.Keyword("block","updated-at","block/updated-at",-1516550551)], null)),new cljs.core.Symbol(null,"...","...",-1926939749,null)], null),new cljs.core.Keyword(null,"where","where",-2044795965),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?page","?page",-1343187612,null),new cljs.core.Keyword("block","tags","block/tags",1814948340),new cljs.core.Keyword("logseq.class","Whiteboard","logseq.class/Whiteboard",1013698452)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?page","?page",-1343187612,null),new cljs.core.Keyword("block","name","block/name",1619760316)], null)], null);
return (frontend.db.async._LT_q.cljs$core$IFn$_invoke$arity$3 ? frontend.db.async._LT_q.cljs$core$IFn$_invoke$arity$3(G__61052,G__61053,G__61054) : frontend.db.async._LT_q.call(null,G__61052,G__61053,G__61054));
})():(function (){var G__61055 = graph;
var G__61056 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"transact-db?","transact-db?",1279612399),false], null);
var G__61057 = new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"find","find",496279456),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.list(new cljs.core.Symbol(null,"pull","pull",779986722,null),new cljs.core.Symbol(null,"?page","?page",-1343187612,null),new cljs.core.PersistentVector(null, 6, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","id","db/id",-1388397098),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Keyword("block","name","block/name",1619760316),new cljs.core.Keyword("block","title","block/title",710445684),new cljs.core.Keyword("block","created-at","block/created-at",1440015),new cljs.core.Keyword("block","updated-at","block/updated-at",-1516550551)], null)),new cljs.core.Symbol(null,"...","...",-1926939749,null)], null),new cljs.core.Keyword(null,"where","where",-2044795965),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?page","?page",-1343187612,null),new cljs.core.Keyword("block","type","block/type",1537584409),"whiteboard"], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?page","?page",-1343187612,null),new cljs.core.Keyword("block","name","block/name",1619760316)], null)], null);
return (frontend.db.async._LT_q.cljs$core$IFn$_invoke$arity$3 ? frontend.db.async._LT_q.cljs$core$IFn$_invoke$arity$3(G__61055,G__61056,G__61057) : frontend.db.async._LT_q.call(null,G__61055,G__61056,G__61057));
})())),(function (result){
return promesa.protocols._promise(cljs.core.reverse(cljs.core.sort_by.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","updated-at","block/updated-at",-1516550551),result)));
}));
}));
});
frontend.db.async._LT_get_views = (function frontend$db$async$_LT_get_views(graph,class_id,view_feature_type){
var G__61061 = graph;
var G__61062 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"transact-db?","transact-db?",1279612399),true], null);
var G__61063 = new cljs.core.PersistentVector(null, 9, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"find","find",496279456),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.list(new cljs.core.Symbol(null,"pull","pull",779986722,null),new cljs.core.Symbol(null,"?b","?b",1575118075,null),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"*","*",345799209,null)], null)),new cljs.core.Symbol(null,"...","...",-1926939749,null)], null),new cljs.core.Keyword(null,"in","in",-1531184865),new cljs.core.Symbol(null,"$","$",-1580747756,null),new cljs.core.Symbol(null,"?class-id","?class-id",-1653001743,null),new cljs.core.Symbol(null,"?view-feature-type","?view-feature-type",-215777938,null),new cljs.core.Keyword(null,"where","where",-2044795965),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?b","?b",1575118075,null),new cljs.core.Keyword("logseq.property","view-for","logseq.property/view-for",-36274319),new cljs.core.Symbol(null,"?class-id","?class-id",-1653001743,null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?b","?b",1575118075,null),new cljs.core.Keyword("logseq.property.view","feature-type","logseq.property.view/feature-type",-939141871),new cljs.core.Symbol(null,"?view-feature-type","?view-feature-type",-215777938,null)], null)], null);
var G__61064 = class_id;
var G__61065 = view_feature_type;
return (frontend.db.async._LT_q.cljs$core$IFn$_invoke$arity$5 ? frontend.db.async._LT_q.cljs$core$IFn$_invoke$arity$5(G__61061,G__61062,G__61063,G__61064,G__61065) : frontend.db.async._LT_q.call(null,G__61061,G__61062,G__61063,G__61064,G__61065));
});
frontend.db.async._LT_get_asset_with_checksum = (function frontend$db$async$_LT_get_asset_with_checksum(graph,checksum){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((function (){var G__61066 = graph;
var G__61067 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"transact-db?","transact-db?",1279612399),true], null);
var G__61068 = new cljs.core.PersistentVector(null, 7, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"find","find",496279456),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.list(new cljs.core.Symbol(null,"pull","pull",779986722,null),new cljs.core.Symbol(null,"?b","?b",1575118075,null),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"*","*",345799209,null)], null)),new cljs.core.Symbol(null,"...","...",-1926939749,null)], null),new cljs.core.Keyword(null,"in","in",-1531184865),new cljs.core.Symbol(null,"$","$",-1580747756,null),new cljs.core.Symbol(null,"?checksum","?checksum",-1212627352,null),new cljs.core.Keyword(null,"where","where",-2044795965),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?b","?b",1575118075,null),new cljs.core.Keyword("logseq.property.asset","checksum","logseq.property.asset/checksum",-1011416979),new cljs.core.Symbol(null,"?checksum","?checksum",-1212627352,null)], null)], null);
var G__61069 = checksum;
return (frontend.db.async._LT_q.cljs$core$IFn$_invoke$arity$4 ? frontend.db.async._LT_q.cljs$core$IFn$_invoke$arity$4(G__61066,G__61067,G__61068,G__61069) : frontend.db.async._LT_q.call(null,G__61066,G__61067,G__61068,G__61069));
})()),(function (result){
return promesa.protocols._promise((function (){var G__61070 = cljs.core.first(result);
var G__61070__$1 = (((G__61070 == null))?null:new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(G__61070));
if((G__61070__$1 == null)){
return null;
} else {
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__61070__$1) : frontend.db.entity.call(null,G__61070__$1));
}
})());
}));
}));
});
frontend.db.async._LT_get_pdf_annotations = (function frontend$db$async$_LT_get_pdf_annotations(graph,pdf_id){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((function (){var G__61071 = graph;
var G__61072 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"transact-db?","transact-db?",1279612399),true], null);
var G__61073 = new cljs.core.PersistentVector(null, 7, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"find","find",496279456),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.list(new cljs.core.Symbol(null,"pull","pull",779986722,null),new cljs.core.Symbol(null,"?b","?b",1575118075,null),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"*","*",345799209,null)], null)),new cljs.core.Symbol(null,"...","...",-1926939749,null)], null),new cljs.core.Keyword(null,"in","in",-1531184865),new cljs.core.Symbol(null,"$","$",-1580747756,null),new cljs.core.Symbol(null,"?pdf-id","?pdf-id",1534564889,null),new cljs.core.Keyword(null,"where","where",-2044795965),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?b","?b",1575118075,null),new cljs.core.Keyword("logseq.property","asset","logseq.property/asset",876856790),new cljs.core.Symbol(null,"?pdf-id","?pdf-id",1534564889,null)], null)], null);
var G__61074 = pdf_id;
return (frontend.db.async._LT_q.cljs$core$IFn$_invoke$arity$4 ? frontend.db.async._LT_q.cljs$core$IFn$_invoke$arity$4(G__61071,G__61072,G__61073,G__61074) : frontend.db.async._LT_q.call(null,G__61071,G__61072,G__61073,G__61074));
})()),(function (result){
return promesa.protocols._promise(result);
}));
}));
});
frontend.db.async._LT_get_block_properties_history = (function frontend$db$async$_LT_get_block_properties_history(graph,block_id){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((function (){var G__61075 = graph;
var G__61076 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"transact-db?","transact-db?",1279612399),true], null);
var G__61077 = new cljs.core.PersistentVector(null, 7, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"find","find",496279456),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.list(new cljs.core.Symbol(null,"pull","pull",779986722,null),new cljs.core.Symbol(null,"?b","?b",1575118075,null),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"*","*",345799209,null)], null)),new cljs.core.Symbol(null,"...","...",-1926939749,null)], null),new cljs.core.Keyword(null,"in","in",-1531184865),new cljs.core.Symbol(null,"$","$",-1580747756,null),new cljs.core.Symbol(null,"?block-id","?block-id",491120905,null),new cljs.core.Keyword(null,"where","where",-2044795965),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?b","?b",1575118075,null),new cljs.core.Keyword("logseq.property.history","block","logseq.property.history/block",114255416),new cljs.core.Symbol(null,"?block-id","?block-id",491120905,null)], null)], null);
var G__61078 = block_id;
return (frontend.db.async._LT_q.cljs$core$IFn$_invoke$arity$4 ? frontend.db.async._LT_q.cljs$core$IFn$_invoke$arity$4(G__61075,G__61076,G__61077,G__61078) : frontend.db.async._LT_q.call(null,G__61075,G__61076,G__61077,G__61078));
})()),(function (result){
return promesa.protocols._promise(cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (b){
var G__61079 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(b);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__61079) : frontend.db.entity.call(null,G__61079));
}),cljs.core.sort_by.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","created-at","block/created-at",1440015),result)));
}));
}));
});
frontend.db.async._LT_task_spent_time = (function frontend$db$async$_LT_task_spent_time(graph,block_id){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.db.async._LT_get_block_properties_history(graph,block_id)),(function (history){
return promesa.protocols._mcat(promesa.protocols._promise(cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (b){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("logseq.property","status","logseq.property/status",-907216853),new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("logseq.property.history","property","logseq.property.history/property",1600409082).cljs$core$IFn$_invoke$arity$1(b)));
}),history)),(function (status_history){
return promesa.protocols._promise(((cljs.core.seq(status_history))?(function (){var time = (function (){var G__61083 = status_history;
var vec__61084 = G__61083;
var seq__61085 = cljs.core.seq(vec__61084);
var first__61086 = cljs.core.first(seq__61085);
var seq__61085__$1 = cljs.core.next(seq__61085);
var last_item = first__61086;
var first__61086__$1 = cljs.core.first(seq__61085__$1);
var seq__61085__$2 = cljs.core.next(seq__61085__$1);
var item = first__61086__$1;
var others = seq__61085__$2;
var time = (0);
var G__61083__$1 = G__61083;
var time__$1 = time;
while(true){
var vec__61087 = G__61083__$1;
var seq__61088 = cljs.core.seq(vec__61087);
var first__61089 = cljs.core.first(seq__61088);
var seq__61088__$1 = cljs.core.next(seq__61088);
var last_item__$1 = first__61089;
var first__61089__$1 = cljs.core.first(seq__61088__$1);
var seq__61088__$2 = cljs.core.next(seq__61088__$1);
var item__$1 = first__61089__$1;
var others__$1 = seq__61088__$2;
var time__$2 = time__$1;
if(cljs.core.truth_(item__$1)){
var last_status = new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("logseq.property.history","ref-value","logseq.property.history/ref-value",-513136037).cljs$core$IFn$_invoke$arity$1(last_item__$1));
var this_status = new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("logseq.property.history","ref-value","logseq.property.history/ref-value",-513136037).cljs$core$IFn$_invoke$arity$1(item__$1));
if(((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(this_status,new cljs.core.Keyword("logseq.property","status.doing","logseq.property/status.doing",1840122908))) && (cljs.core.empty_QMARK_(others__$1)))){
return cljs.core.quot((time__$2 + (cljs_time.coerce.to_long(cljs_time.core.now()) - new cljs.core.Keyword("block","created-at","block/created-at",1440015).cljs$core$IFn$_invoke$arity$1(item__$1))),(1000));
} else {
var time_SINGLEQUOTE_ = ((((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(last_status,new cljs.core.Keyword("logseq.property","status.doing","logseq.property/status.doing",1840122908))) || ((((!(cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword("logseq.property","status.backlog","logseq.property/status.backlog",-72333491),null,new cljs.core.Keyword("logseq.property","status.canceled","logseq.property/status.canceled",752643262),null,new cljs.core.Keyword("logseq.property","status.done","logseq.property/status.done",-1827582082),null], null), null),last_status)))) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(this_status,new cljs.core.Keyword("logseq.property","status.done","logseq.property/status.done",-1827582082)))))))?(time__$2 + (new cljs.core.Keyword("block","created-at","block/created-at",1440015).cljs$core$IFn$_invoke$arity$1(item__$1) - new cljs.core.Keyword("block","created-at","block/created-at",1440015).cljs$core$IFn$_invoke$arity$1(last_item__$1))):time__$2);
var G__61114 = cljs.core.cons(item__$1,others__$1);
var G__61115 = time_SINGLEQUOTE_;
G__61083__$1 = G__61114;
time__$1 = G__61115;
continue;
}
} else {
return cljs.core.quot(time__$2,(1000));
}
break;
}
})();
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [status_history,time], null);
})():null));
}));
}));
}));
});

//# sourceMappingURL=frontend.db.async.js.map
