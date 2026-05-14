goog.provide('frontend.db.async');
frontend.db.async._LT_q = frontend.db.async.util._LT_q;
frontend.db.async._LT_pull = frontend.db.async.util._LT_pull;
frontend.db.async._LT_get_files = (function frontend$db$async$_LT_get_files(graph){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((function (){var G__101610 = graph;
var G__101611 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"transact-db?","transact-db?",1279612399),false], null);
var G__101612 = new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"find","find",496279456),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.list(new cljs.core.Symbol(null,"pull","pull",779986722,null),new cljs.core.Symbol(null,"?file","?file",-1121006094,null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("file","path","file/path",-191335748),new cljs.core.Keyword("file","last-modified-at","file/last-modified-at",473527310)], null)),new cljs.core.Symbol(null,"...","...",-1926939749,null)], null),new cljs.core.Keyword(null,"where","where",-2044795965),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?file","?file",-1121006094,null),new cljs.core.Keyword("file","path","file/path",-191335748),new cljs.core.Symbol(null,"?path","?path",385070032,null)], null)], null);
return (frontend.db.async._LT_q.cljs$core$IFn$_invoke$arity$3 ? frontend.db.async._LT_q.cljs$core$IFn$_invoke$arity$3(G__101610,G__101611,G__101612) : frontend.db.async._LT_q.call(null,G__101610,G__101611,G__101612));
})()),(function (result){
return promesa.protocols._promise(cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__101609_SHARP_){
return (new cljs.core.PersistentVector(null,2,(5),cljs.core.PersistentVector.EMPTY_NODE,[new cljs.core.Keyword("file","path","file/path",-191335748).cljs$core$IFn$_invoke$arity$1(p1__101609_SHARP_),(function (){var or__5002__auto__ = new cljs.core.Keyword("file","last-modified-at","file/last-modified-at",473527310).cljs$core$IFn$_invoke$arity$1(p1__101609_SHARP_);
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
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((function (){var G__101613 = graph;
var G__101614 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"transact-db?","transact-db?",1279612399),true], null);
var G__101615 = new cljs.core.PersistentVector(null, 6, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"find","find",496279456),new cljs.core.Symbol(null,"?t","?t",1786819229,null),cljs.core.list(new cljs.core.Symbol(null,"pull","pull",779986722,null),new cljs.core.Symbol(null,"?b","?b",1575118075,null),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"*","*",345799209,null)], null)),new cljs.core.Keyword(null,"where","where",-2044795965),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?b","?b",1575118075,null),new cljs.core.Keyword("block","properties","block/properties",708347145),new cljs.core.Symbol(null,"?p","?p",-10896580,null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.list(new cljs.core.Symbol(null,"get","get",-971253014,null),new cljs.core.Symbol(null,"?p","?p",-10896580,null),new cljs.core.Keyword(null,"template","template",-702405684)),new cljs.core.Symbol(null,"?t","?t",1786819229,null)], null)], null);
return (frontend.db.async._LT_q.cljs$core$IFn$_invoke$arity$3 ? frontend.db.async._LT_q.cljs$core$IFn$_invoke$arity$3(G__101613,G__101614,G__101615) : frontend.db.async._LT_q.call(null,G__101613,G__101614,G__101615));
})()),(function (result){
return promesa.protocols._promise(cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p__101616){
var vec__101617 = p__101616;
var template = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__101617,(0),null);
var b = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__101617,(1),null);
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [template,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(b,new cljs.core.Keyword("block","title","block/title",710445684),template)], null);
}),result)));
}));
}));
});
frontend.db.async._LT_get_template_by_name = (function frontend$db$async$_LT_get_template_by_name(name){
var repo = frontend.state.get_current_repo();
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
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
var len__5726__auto___101704 = arguments.length;
var i__5727__auto___101705 = (0);
while(true){
if((i__5727__auto___101705 < len__5726__auto___101704)){
args__5732__auto__.push((arguments[i__5727__auto___101705]));

var G__101706 = (i__5727__auto___101705 + (1));
i__5727__auto___101705 = G__101706;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((0) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((0)),(0),null)):null);
return frontend.db.async._LT_get_all_properties.cljs$core$IFn$_invoke$arity$variadic(argseq__5733__auto__);
});

(frontend.db.async._LT_get_all_properties.cljs$core$IFn$_invoke$arity$variadic = (function (p__101622){
var map__101623 = p__101622;
var map__101623__$1 = cljs.core.__destructure_map(map__101623);
var opts = map__101623__$1;
var temp__5804__auto__ = frontend.state.get_current_repo();
if(cljs.core.truth_(temp__5804__auto__)){
var graph = temp__5804__auto__;
if(frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(graph)){
return frontend.db.model.get_all_properties.cljs$core$IFn$_invoke$arity$variadic(graph,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([opts], 0));
} else {
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.db.file_based.async._LT_file_based_get_all_properties(graph)),(function (properties){
return promesa.protocols._mcat(promesa.protocols._promise(cljs.core.set(cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.name,frontend.handler.file_based.property.util.hidden_properties()))),(function (hidden_properties){
return promesa.protocols._promise(cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (p1__101620_SHARP_){
var G__101624 = new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(p1__101620_SHARP_);
return (hidden_properties.cljs$core$IFn$_invoke$arity$1 ? hidden_properties.cljs$core$IFn$_invoke$arity$1(G__101624) : hidden_properties.call(null,G__101624));
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
(frontend.db.async._LT_get_all_properties.cljs$lang$applyTo = (function (seq101621){
var self__5712__auto__ = this;
return self__5712__auto__.cljs$core$IFn$_invoke$arity$variadic(cljs.core.seq(seq101621));
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
var len__5726__auto___101707 = arguments.length;
var i__5727__auto___101708 = (0);
while(true){
if((i__5727__auto___101708 < len__5726__auto___101707)){
args__5732__auto__.push((arguments[i__5727__auto___101708]));

var G__101709 = (i__5727__auto___101708 + (1));
i__5727__auto___101708 = G__101709;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return frontend.db.async._LT_get_property_values.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(frontend.db.async._LT_get_property_values.cljs$core$IFn$_invoke$arity$variadic = (function (property_id,p__101627){
var map__101628 = p__101627;
var map__101628__$1 = cljs.core.__destructure_map(map__101628);
var opts = map__101628__$1;
if(cljs.core.truth_(property_id)){
return frontend.state._LT_invoke_db_worker.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword("thread-api","get-property-values","thread-api/get-property-values",60992180),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([frontend.state.get_current_repo(),cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(opts,new cljs.core.Keyword(null,"property-ident","property-ident",697145839),property_id)], 0));
} else {
return null;
}
}));

(frontend.db.async._LT_get_property_values.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(frontend.db.async._LT_get_property_values.cljs$lang$applyTo = (function (seq101625){
var G__101626 = cljs.core.first(seq101625);
var seq101625__$1 = cljs.core.next(seq101625);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__101626,seq101625__$1);
}));

frontend.db.async._LT_get_block = (function frontend$db$async$_LT_get_block(var_args){
var args__5732__auto__ = [];
var len__5726__auto___101710 = arguments.length;
var i__5727__auto___101711 = (0);
while(true){
if((i__5727__auto___101711 < len__5726__auto___101710)){
args__5732__auto__.push((arguments[i__5727__auto___101711]));

var G__101712 = (i__5727__auto___101711 + (1));
i__5727__auto___101711 = G__101712;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((2) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((2)),(0),null)):null);
return frontend.db.async._LT_get_block.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),(arguments[(1)]),argseq__5733__auto__);
});

(frontend.db.async._LT_get_block.cljs$core$IFn$_invoke$arity$variadic = (function (graph,id_uuid_or_name,p__101632){
var map__101633 = p__101632;
var map__101633__$1 = cljs.core.__destructure_map(map__101633);
var opts = map__101633__$1;
var children_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__101633__$1,new cljs.core.Keyword(null,"children?","children?",-1199594108),true);
var nested_children_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__101633__$1,new cljs.core.Keyword(null,"nested-children?","nested-children?",1651323711));
var skip_transact_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__101633__$1,new cljs.core.Keyword(null,"skip-transact?","skip-transact?",-1820887310));
var skip_refresh_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__101633__$1,new cljs.core.Keyword(null,"skip-refresh?","skip-refresh?",878432095));
var children_only_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__101633__$1,new cljs.core.Keyword(null,"children-only?","children-only?",-1225782855));
var properties = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__101633__$1,new cljs.core.Keyword(null,"properties","properties",685819552));
var name_SINGLEQUOTE_ = cljs.core.str.cljs$core$IFn$_invoke$arity$1(id_uuid_or_name);
var opts__$1 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(opts,new cljs.core.Keyword(null,"children?","children?",-1199594108),children_QMARK_);
var e = ((typeof id_uuid_or_name === 'number')?(frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(id_uuid_or_name) : frontend.db.entity.call(null,id_uuid_or_name)):(cljs.core.truth_((frontend.util.uuid_string_QMARK_.cljs$core$IFn$_invoke$arity$1 ? frontend.util.uuid_string_QMARK_.cljs$core$IFn$_invoke$arity$1(name_SINGLEQUOTE_) : frontend.util.uuid_string_QMARK_.call(null,name_SINGLEQUOTE_)))?(function (){var G__101634 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),cljs.core.uuid(name_SINGLEQUOTE_)], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__101634) : frontend.db.entity.call(null,G__101634));
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
return promesa.core.catch$.cljs$core$IFn$_invoke$arity$2(promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.state._LT_invoke_db_worker.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword("thread-api","get-blocks","thread-api/get-blocks",-999880266),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([graph,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"id","id",-1388402092),id,new cljs.core.Keyword(null,"opts","opts",155075701),opts__$1], null)], null)], 0))),(function (result){
return promesa.protocols._mcat(promesa.protocols._promise(cljs.core.first(result)),(function (p__101635){
var map__101636 = p__101635;
var map__101636__$1 = cljs.core.__destructure_map(map__101636);
var block = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__101636__$1,new cljs.core.Keyword(null,"block","block",664686210));
var children = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__101636__$1,new cljs.core.Keyword(null,"children","children",-940561982));
return promesa.protocols._mcat(promesa.protocols._promise((cljs.core.truth_(skip_transact_QMARK_)?null:(function (){var conn = (frontend.db.get_db.cljs$core$IFn$_invoke$arity$2 ? frontend.db.get_db.cljs$core$IFn$_invoke$arity$2(graph,false) : frontend.db.get_db.call(null,graph,false));
var block_and_children = (cljs.core.truth_(block)?cljs.core.cons(block,children):children);
var affected_keys = new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("frontend.worker.react","block","frontend.worker.react/block",2007555355),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block)], null)], null);
var tx_data = cljs.core.remove.cljs$core$IFn$_invoke$arity$2(cljs.core.empty_QMARK_,logseq.common.util.fast_remove_nils(cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (b){
return new cljs.core.Keyword("block.temp","fully-loaded?","block.temp/fully-loaded?",-116637365).cljs$core$IFn$_invoke$arity$1((function (){var G__101637 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(b);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__101637) : frontend.db.entity.call(null,G__101637));
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
})())),(function (___41611__auto__){
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
(frontend.db.async._LT_get_block.cljs$lang$applyTo = (function (seq101629){
var G__101630 = cljs.core.first(seq101629);
var seq101629__$1 = cljs.core.next(seq101629);
var G__101631 = cljs.core.first(seq101629__$1);
var seq101629__$2 = cljs.core.next(seq101629__$1);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__101630,G__101631,seq101629__$2);
}));

frontend.db.async._LT_get_blocks = (function frontend$db$async$_LT_get_blocks(var_args){
var args__5732__auto__ = [];
var len__5726__auto___101713 = arguments.length;
var i__5727__auto___101714 = (0);
while(true){
if((i__5727__auto___101714 < len__5726__auto___101713)){
args__5732__auto__.push((arguments[i__5727__auto___101714]));

var G__101715 = (i__5727__auto___101714 + (1));
i__5727__auto___101714 = G__101715;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((2) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((2)),(0),null)):null);
return frontend.db.async._LT_get_blocks.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),(arguments[(1)]),argseq__5733__auto__);
});

(frontend.db.async._LT_get_blocks.cljs$core$IFn$_invoke$arity$variadic = (function (graph,ids_STAR_,p__101641){
var map__101642 = p__101641;
var map__101642__$1 = cljs.core.__destructure_map(map__101642);
var opts = map__101642__$1;
var ids = cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (id){
return new cljs.core.Keyword("block.temp","fully-loaded?","block.temp/fully-loaded?",-116637365).cljs$core$IFn$_invoke$arity$1((frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(id) : frontend.db.entity.call(null,id)));
}),ids_STAR_);
if(cljs.core.seq(ids)){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.state._LT_invoke_db_worker.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword("thread-api","get-blocks","thread-api/get-blocks",-999880266),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([graph,cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (id){
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"id","id",-1388402092),id,new cljs.core.Keyword(null,"opts","opts",155075701),cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(opts,new cljs.core.Keyword(null,"children?","children?",-1199594108),false)], null);
}),ids)], 0))),(function (result){
return promesa.protocols._promise((function (){var conn = (frontend.db.get_db.cljs$core$IFn$_invoke$arity$2 ? frontend.db.get_db.cljs$core$IFn$_invoke$arity$2(graph,false) : frontend.db.get_db.call(null,graph,false));
var result_SINGLEQUOTE_ = cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"block","block",664686210),result);
if(cljs.core.seq(result_SINGLEQUOTE_)){
var result_SINGLEQUOTE__SINGLEQUOTE__101716 = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (b){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(b,new cljs.core.Keyword("block.temp","fully-loaded?","block.temp/fully-loaded?",-116637365),true);
}),result_SINGLEQUOTE_);
(datascript.core.transact_BANG_.cljs$core$IFn$_invoke$arity$2 ? datascript.core.transact_BANG_.cljs$core$IFn$_invoke$arity$2(conn,result_SINGLEQUOTE__SINGLEQUOTE__101716) : datascript.core.transact_BANG_.call(null,conn,result_SINGLEQUOTE__SINGLEQUOTE__101716));
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
(frontend.db.async._LT_get_blocks.cljs$lang$applyTo = (function (seq101638){
var G__101639 = cljs.core.first(seq101638);
var seq101638__$1 = cljs.core.next(seq101638);
var G__101640 = cljs.core.first(seq101638__$1);
var seq101638__$2 = cljs.core.next(seq101638__$1);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__101639,G__101640,seq101638__$2);
}));

frontend.db.async._LT_get_block_parents = (function frontend$db$async$_LT_get_block_parents(graph,id,depth){
if(cljs.core.integer_QMARK_(id)){
} else {
throw (new Error("Assert failed: (integer? id)"));
}

if(cljs.core.truth_(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1((frontend.db.entity.cljs$core$IFn$_invoke$arity$2 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$2(graph,id) : frontend.db.entity.call(null,graph,id))))){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
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

return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
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
var G__101643 = graph;
var G__101644 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"transact-db?","transact-db?",1279612399),false], null);
var G__101645 = new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"find","find",496279456),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?refed-uuid","?refed-uuid",417914050,null),new cljs.core.Symbol(null,"...","...",-1926939749,null)], null),new cljs.core.Keyword(null,"where","where",-2044795965),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?refed-b","?refed-b",-875900233,null),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Symbol(null,"?refed-uuid","?refed-uuid",417914050,null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?referee-b","?referee-b",1661362384,null),new cljs.core.Keyword("block","refs","block/refs",-1214495349),new cljs.core.Symbol(null,"?refed-b","?refed-b",-875900233,null)], null)], null);
return (frontend.db.async._LT_q.cljs$core$IFn$_invoke$arity$3 ? frontend.db.async._LT_q.cljs$core$IFn$_invoke$arity$3(G__101643,G__101644,G__101645) : frontend.db.async._LT_q.call(null,G__101643,G__101644,G__101645));
});
frontend.db.async._LT_get_file = (function frontend$db$async$_LT_get_file(graph,path){
if(cljs.core.truth_((function (){var and__5000__auto__ = graph;
if(cljs.core.truth_(and__5000__auto__)){
return path;
} else {
return and__5000__auto__;
}
})())){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((function (){var G__101646 = graph;
var G__101647 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("file","path","file/path",-191335748),path], null);
return (frontend.db.async._LT_pull.cljs$core$IFn$_invoke$arity$2 ? frontend.db.async._LT_pull.cljs$core$IFn$_invoke$arity$2(G__101646,G__101647) : frontend.db.async._LT_pull.call(null,G__101646,G__101647));
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
var future_day = (function (){var G__101648 = future_date;
var G__101648__$1 = (((G__101648 == null))?null:cljs_time.format.unparse(date_format,G__101648));
if((G__101648__$1 == null)){
return null;
} else {
return cljs.core.parse_long(G__101648__$1);
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
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(((frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(repo))?(function (){var G__101649 = repo;
var G__101650 = cljs.core.PersistentArrayMap.EMPTY;
var G__101651 = new cljs.core.PersistentVector(null, 15, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"find","find",496279456),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.list(new cljs.core.Symbol(null,"pull","pull",779986722,null),new cljs.core.Symbol(null,"?block","?block",1541466123,null),new cljs.core.Symbol(null,"?block-attrs","?block-attrs",1362551561,null)),new cljs.core.Symbol(null,"...","...",-1926939749,null)], null),new cljs.core.Keyword(null,"in","in",-1531184865),new cljs.core.Symbol(null,"$","$",-1580747756,null),new cljs.core.Symbol(null,"?start-time","?start-time",156449407,null),new cljs.core.Symbol(null,"?end-time","?end-time",-2048774004,null),new cljs.core.Symbol(null,"?block-attrs","?block-attrs",1362551561,null),new cljs.core.Keyword(null,"where","where",-2044795965),cljs.core.list(new cljs.core.Symbol(null,"or","or",1876275696,null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?block","?block",1541466123,null),new cljs.core.Keyword("logseq.property","scheduled","logseq.property/scheduled",1644520943),new cljs.core.Symbol(null,"?n","?n",-2053238410,null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?block","?block",1541466123,null),new cljs.core.Keyword("logseq.property","deadline","logseq.property/deadline",1685901604),new cljs.core.Symbol(null,"?n","?n",-2053238410,null)], null)),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.list(new cljs.core.Symbol(null,">=",">=",1016916022,null),new cljs.core.Symbol(null,"?n","?n",-2053238410,null),new cljs.core.Symbol(null,"?start-time","?start-time",156449407,null))], null),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.list(new cljs.core.Symbol(null,"<=","<=",1244895369,null),new cljs.core.Symbol(null,"?n","?n",-2053238410,null),new cljs.core.Symbol(null,"?end-time","?end-time",-2048774004,null))], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?block","?block",1541466123,null),new cljs.core.Keyword("logseq.property","status","logseq.property/status",-907216853),new cljs.core.Symbol(null,"?status","?status",-1715705409,null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?status","?status",-1715705409,null),new cljs.core.Keyword("db","ident","db/ident",-737096),new cljs.core.Symbol(null,"?status-ident","?status-ident",735469247,null)], null),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.list(new cljs.core.Symbol(null,"not=","not=",1466536204,null),new cljs.core.Symbol(null,"?status-ident","?status-ident",735469247,null),new cljs.core.Keyword("logseq.property","status.done","logseq.property/status.done",-1827582082))], null),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.list(new cljs.core.Symbol(null,"not=","not=",1466536204,null),new cljs.core.Symbol(null,"?status-ident","?status-ident",735469247,null),new cljs.core.Keyword("logseq.property","status.canceled","logseq.property/status.canceled",752643262))], null)], null);
var G__101652 = start_time;
var G__101653 = future_time;
var G__101654 = new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"*","*",345799209,null)], null);
return (frontend.db.async._LT_q.cljs$core$IFn$_invoke$arity$6 ? frontend.db.async._LT_q.cljs$core$IFn$_invoke$arity$6(G__101649,G__101650,G__101651,G__101652,G__101653,G__101654) : frontend.db.async._LT_q.call(null,G__101649,G__101650,G__101651,G__101652,G__101653,G__101654));
})():(function (){var G__101655 = repo;
var G__101656 = cljs.core.PersistentArrayMap.EMPTY;
var G__101657 = new cljs.core.PersistentVector(null, 16, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"find","find",496279456),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.list(new cljs.core.Symbol(null,"pull","pull",779986722,null),new cljs.core.Symbol(null,"?block","?block",1541466123,null),new cljs.core.Symbol(null,"?block-attrs","?block-attrs",1362551561,null)),new cljs.core.Symbol(null,"...","...",-1926939749,null)], null),new cljs.core.Keyword(null,"in","in",-1531184865),new cljs.core.Symbol(null,"$","$",-1580747756,null),new cljs.core.Symbol(null,"?day","?day",686036275,null),new cljs.core.Symbol(null,"?future","?future",1027205190,null),new cljs.core.Symbol(null,"?block-attrs","?block-attrs",1362551561,null),new cljs.core.Keyword(null,"where","where",-2044795965),cljs.core.list(new cljs.core.Symbol(null,"or","or",1876275696,null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?block","?block",1541466123,null),new cljs.core.Keyword("block","scheduled","block/scheduled",584810412),new cljs.core.Symbol(null,"?d","?d",-1851543854,null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?block","?block",1541466123,null),new cljs.core.Keyword("block","deadline","block/deadline",660945231),new cljs.core.Symbol(null,"?d","?d",-1851543854,null)], null)),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.list(new cljs.core.Symbol(null,"get-else","get-else",1312024065,null),new cljs.core.Symbol(null,"$","$",-1580747756,null),new cljs.core.Symbol(null,"?block","?block",1541466123,null),new cljs.core.Keyword("block","repeated?","block/repeated?",-1344319799),false),new cljs.core.Symbol(null,"?repeated","?repeated",449465208,null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.list(new cljs.core.Symbol(null,"get-else","get-else",1312024065,null),new cljs.core.Symbol(null,"$","$",-1580747756,null),new cljs.core.Symbol(null,"?block","?block",1541466123,null),new cljs.core.Keyword("block","marker","block/marker",1231576318),"NIL"),new cljs.core.Symbol(null,"?marker","?marker",1230004157,null)], null),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.list(new cljs.core.Symbol(null,"not=","not=",1466536204,null),new cljs.core.Symbol(null,"?marker","?marker",1230004157,null),"DONE")], null),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.list(new cljs.core.Symbol(null,"not=","not=",1466536204,null),new cljs.core.Symbol(null,"?marker","?marker",1230004157,null),"CANCELED")], null),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.list(new cljs.core.Symbol(null,"not=","not=",1466536204,null),new cljs.core.Symbol(null,"?marker","?marker",1230004157,null),"CANCELLED")], null),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.list(new cljs.core.Symbol(null,"<=","<=",1244895369,null),new cljs.core.Symbol(null,"?d","?d",-1851543854,null),new cljs.core.Symbol(null,"?future","?future",1027205190,null))], null),cljs.core.list(new cljs.core.Symbol(null,"or-join","or-join",591375469,null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?repeated","?repeated",449465208,null),new cljs.core.Symbol(null,"?d","?d",-1851543854,null),new cljs.core.Symbol(null,"?day","?day",686036275,null)], null),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.list(new cljs.core.Symbol(null,"true?","true?",-1600332395,null),new cljs.core.Symbol(null,"?repeated","?repeated",449465208,null))], null),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.list(new cljs.core.Symbol(null,">=",">=",1016916022,null),new cljs.core.Symbol(null,"?d","?d",-1851543854,null),new cljs.core.Symbol(null,"?day","?day",686036275,null))], null))], null);
var G__101658 = date;
var G__101659 = future_day;
var G__101660 = frontend.db.file_based.model.file_graph_block_attrs;
return (frontend.db.async._LT_q.cljs$core$IFn$_invoke$arity$6 ? frontend.db.async._LT_q.cljs$core$IFn$_invoke$arity$6(G__101655,G__101656,G__101657,G__101658,G__101659,G__101660) : frontend.db.async._LT_q.call(null,G__101655,G__101656,G__101657,G__101658,G__101659,G__101660));
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
var G__101661 = graph;
var G__101662 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"transact-db?","transact-db?",1279612399),false], null);
var G__101663 = new cljs.core.PersistentVector(null, 8, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"find","find",496279456),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.list(new cljs.core.Symbol(null,"pull","pull",779986722,null),new cljs.core.Symbol(null,"?page","?page",-1343187612,null),new cljs.core.PersistentVector(null, 6, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","id","db/id",-1388397098),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Keyword("block","name","block/name",1619760316),new cljs.core.Keyword("block","title","block/title",710445684),new cljs.core.Keyword("block","created-at","block/created-at",1440015),new cljs.core.Keyword("block","updated-at","block/updated-at",-1516550551)], null)),new cljs.core.Symbol(null,"...","...",-1926939749,null)], null),new cljs.core.Keyword(null,"in","in",-1531184865),new cljs.core.Symbol(null,"$","$",-1580747756,null),new cljs.core.Symbol(null,"?tag-id","?tag-id",-748587738,null),new cljs.core.Keyword(null,"where","where",-2044795965),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?page","?page",-1343187612,null),new cljs.core.Keyword("block","tags","block/tags",1814948340),new cljs.core.Symbol(null,"?tag-id","?tag-id",-748587738,null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?page","?page",-1343187612,null),new cljs.core.Keyword("block","name","block/name",1619760316)], null)], null);
var G__101664 = tag_id;
return (frontend.db.async._LT_q.cljs$core$IFn$_invoke$arity$4 ? frontend.db.async._LT_q.cljs$core$IFn$_invoke$arity$4(G__101661,G__101662,G__101663,G__101664) : frontend.db.async._LT_q.call(null,G__101661,G__101662,G__101663,G__101664));
});
frontend.db.async._LT_get_tag_objects = (function frontend$db$async$_LT_get_tag_objects(graph,class_id){
var class_children = frontend.db.model.get_structured_children(graph,class_id);
var class_ids = cljs.core.distinct.cljs$core$IFn$_invoke$arity$1(cljs.core.conj.cljs$core$IFn$_invoke$arity$2(class_children,class_id));
var G__101665 = graph;
var G__101666 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"transact-db?","transact-db?",1279612399),true], null);
var G__101667 = new cljs.core.PersistentVector(null, 7, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"find","find",496279456),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.list(new cljs.core.Symbol(null,"pull","pull",779986722,null),new cljs.core.Symbol(null,"?b","?b",1575118075,null),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"*","*",345799209,null)], null)),new cljs.core.Symbol(null,"...","...",-1926939749,null)], null),new cljs.core.Keyword(null,"in","in",-1531184865),new cljs.core.Symbol(null,"$","$",-1580747756,null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?class-id","?class-id",-1653001743,null),new cljs.core.Symbol(null,"...","...",-1926939749,null)], null),new cljs.core.Keyword(null,"where","where",-2044795965),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?b","?b",1575118075,null),new cljs.core.Keyword("block","tags","block/tags",1814948340),new cljs.core.Symbol(null,"?class-id","?class-id",-1653001743,null)], null)], null);
var G__101668 = class_ids;
return (frontend.db.async._LT_q.cljs$core$IFn$_invoke$arity$4 ? frontend.db.async._LT_q.cljs$core$IFn$_invoke$arity$4(G__101665,G__101666,G__101667,G__101668) : frontend.db.async._LT_q.call(null,G__101665,G__101666,G__101667,G__101668));
});
frontend.db.async._LT_get_whiteboards = (function frontend$db$async$_LT_get_whiteboards(graph){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(((frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(graph))?(function (){var G__101669 = graph;
var G__101670 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"transact-db?","transact-db?",1279612399),false], null);
var G__101671 = new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"find","find",496279456),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.list(new cljs.core.Symbol(null,"pull","pull",779986722,null),new cljs.core.Symbol(null,"?page","?page",-1343187612,null),new cljs.core.PersistentVector(null, 6, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","id","db/id",-1388397098),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Keyword("block","name","block/name",1619760316),new cljs.core.Keyword("block","title","block/title",710445684),new cljs.core.Keyword("block","created-at","block/created-at",1440015),new cljs.core.Keyword("block","updated-at","block/updated-at",-1516550551)], null)),new cljs.core.Symbol(null,"...","...",-1926939749,null)], null),new cljs.core.Keyword(null,"where","where",-2044795965),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?page","?page",-1343187612,null),new cljs.core.Keyword("block","tags","block/tags",1814948340),new cljs.core.Keyword("logseq.class","Whiteboard","logseq.class/Whiteboard",1013698452)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?page","?page",-1343187612,null),new cljs.core.Keyword("block","name","block/name",1619760316)], null)], null);
return (frontend.db.async._LT_q.cljs$core$IFn$_invoke$arity$3 ? frontend.db.async._LT_q.cljs$core$IFn$_invoke$arity$3(G__101669,G__101670,G__101671) : frontend.db.async._LT_q.call(null,G__101669,G__101670,G__101671));
})():(function (){var G__101672 = graph;
var G__101673 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"transact-db?","transact-db?",1279612399),false], null);
var G__101674 = new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"find","find",496279456),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.list(new cljs.core.Symbol(null,"pull","pull",779986722,null),new cljs.core.Symbol(null,"?page","?page",-1343187612,null),new cljs.core.PersistentVector(null, 6, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","id","db/id",-1388397098),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Keyword("block","name","block/name",1619760316),new cljs.core.Keyword("block","title","block/title",710445684),new cljs.core.Keyword("block","created-at","block/created-at",1440015),new cljs.core.Keyword("block","updated-at","block/updated-at",-1516550551)], null)),new cljs.core.Symbol(null,"...","...",-1926939749,null)], null),new cljs.core.Keyword(null,"where","where",-2044795965),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?page","?page",-1343187612,null),new cljs.core.Keyword("block","type","block/type",1537584409),"whiteboard"], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?page","?page",-1343187612,null),new cljs.core.Keyword("block","name","block/name",1619760316)], null)], null);
return (frontend.db.async._LT_q.cljs$core$IFn$_invoke$arity$3 ? frontend.db.async._LT_q.cljs$core$IFn$_invoke$arity$3(G__101672,G__101673,G__101674) : frontend.db.async._LT_q.call(null,G__101672,G__101673,G__101674));
})())),(function (result){
return promesa.protocols._promise(cljs.core.reverse(cljs.core.sort_by.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","updated-at","block/updated-at",-1516550551),result)));
}));
}));
});
frontend.db.async._LT_get_views = (function frontend$db$async$_LT_get_views(graph,class_id,view_feature_type){
var G__101675 = graph;
var G__101676 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"transact-db?","transact-db?",1279612399),true], null);
var G__101677 = new cljs.core.PersistentVector(null, 9, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"find","find",496279456),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.list(new cljs.core.Symbol(null,"pull","pull",779986722,null),new cljs.core.Symbol(null,"?b","?b",1575118075,null),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"*","*",345799209,null)], null)),new cljs.core.Symbol(null,"...","...",-1926939749,null)], null),new cljs.core.Keyword(null,"in","in",-1531184865),new cljs.core.Symbol(null,"$","$",-1580747756,null),new cljs.core.Symbol(null,"?class-id","?class-id",-1653001743,null),new cljs.core.Symbol(null,"?view-feature-type","?view-feature-type",-215777938,null),new cljs.core.Keyword(null,"where","where",-2044795965),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?b","?b",1575118075,null),new cljs.core.Keyword("logseq.property","view-for","logseq.property/view-for",-36274319),new cljs.core.Symbol(null,"?class-id","?class-id",-1653001743,null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?b","?b",1575118075,null),new cljs.core.Keyword("logseq.property.view","feature-type","logseq.property.view/feature-type",-939141871),new cljs.core.Symbol(null,"?view-feature-type","?view-feature-type",-215777938,null)], null)], null);
var G__101678 = class_id;
var G__101679 = view_feature_type;
return (frontend.db.async._LT_q.cljs$core$IFn$_invoke$arity$5 ? frontend.db.async._LT_q.cljs$core$IFn$_invoke$arity$5(G__101675,G__101676,G__101677,G__101678,G__101679) : frontend.db.async._LT_q.call(null,G__101675,G__101676,G__101677,G__101678,G__101679));
});
frontend.db.async._LT_get_asset_with_checksum = (function frontend$db$async$_LT_get_asset_with_checksum(graph,checksum){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((function (){var G__101680 = graph;
var G__101681 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"transact-db?","transact-db?",1279612399),true], null);
var G__101682 = new cljs.core.PersistentVector(null, 7, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"find","find",496279456),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.list(new cljs.core.Symbol(null,"pull","pull",779986722,null),new cljs.core.Symbol(null,"?b","?b",1575118075,null),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"*","*",345799209,null)], null)),new cljs.core.Symbol(null,"...","...",-1926939749,null)], null),new cljs.core.Keyword(null,"in","in",-1531184865),new cljs.core.Symbol(null,"$","$",-1580747756,null),new cljs.core.Symbol(null,"?checksum","?checksum",-1212627352,null),new cljs.core.Keyword(null,"where","where",-2044795965),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?b","?b",1575118075,null),new cljs.core.Keyword("logseq.property.asset","checksum","logseq.property.asset/checksum",-1011416979),new cljs.core.Symbol(null,"?checksum","?checksum",-1212627352,null)], null)], null);
var G__101683 = checksum;
return (frontend.db.async._LT_q.cljs$core$IFn$_invoke$arity$4 ? frontend.db.async._LT_q.cljs$core$IFn$_invoke$arity$4(G__101680,G__101681,G__101682,G__101683) : frontend.db.async._LT_q.call(null,G__101680,G__101681,G__101682,G__101683));
})()),(function (result){
return promesa.protocols._promise((function (){var G__101684 = cljs.core.first(result);
var G__101684__$1 = (((G__101684 == null))?null:new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(G__101684));
if((G__101684__$1 == null)){
return null;
} else {
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__101684__$1) : frontend.db.entity.call(null,G__101684__$1));
}
})());
}));
}));
});
frontend.db.async._LT_get_pdf_annotations = (function frontend$db$async$_LT_get_pdf_annotations(graph,pdf_id){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((function (){var G__101685 = graph;
var G__101686 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"transact-db?","transact-db?",1279612399),true], null);
var G__101687 = new cljs.core.PersistentVector(null, 7, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"find","find",496279456),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.list(new cljs.core.Symbol(null,"pull","pull",779986722,null),new cljs.core.Symbol(null,"?b","?b",1575118075,null),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"*","*",345799209,null)], null)),new cljs.core.Symbol(null,"...","...",-1926939749,null)], null),new cljs.core.Keyword(null,"in","in",-1531184865),new cljs.core.Symbol(null,"$","$",-1580747756,null),new cljs.core.Symbol(null,"?pdf-id","?pdf-id",1534564889,null),new cljs.core.Keyword(null,"where","where",-2044795965),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?b","?b",1575118075,null),new cljs.core.Keyword("logseq.property","asset","logseq.property/asset",876856790),new cljs.core.Symbol(null,"?pdf-id","?pdf-id",1534564889,null)], null)], null);
var G__101688 = pdf_id;
return (frontend.db.async._LT_q.cljs$core$IFn$_invoke$arity$4 ? frontend.db.async._LT_q.cljs$core$IFn$_invoke$arity$4(G__101685,G__101686,G__101687,G__101688) : frontend.db.async._LT_q.call(null,G__101685,G__101686,G__101687,G__101688));
})()),(function (result){
return promesa.protocols._promise(result);
}));
}));
});
frontend.db.async._LT_get_block_properties_history = (function frontend$db$async$_LT_get_block_properties_history(graph,block_id){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((function (){var G__101689 = graph;
var G__101690 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"transact-db?","transact-db?",1279612399),true], null);
var G__101691 = new cljs.core.PersistentVector(null, 7, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"find","find",496279456),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.list(new cljs.core.Symbol(null,"pull","pull",779986722,null),new cljs.core.Symbol(null,"?b","?b",1575118075,null),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"*","*",345799209,null)], null)),new cljs.core.Symbol(null,"...","...",-1926939749,null)], null),new cljs.core.Keyword(null,"in","in",-1531184865),new cljs.core.Symbol(null,"$","$",-1580747756,null),new cljs.core.Symbol(null,"?block-id","?block-id",491120905,null),new cljs.core.Keyword(null,"where","where",-2044795965),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?b","?b",1575118075,null),new cljs.core.Keyword("logseq.property.history","block","logseq.property.history/block",114255416),new cljs.core.Symbol(null,"?block-id","?block-id",491120905,null)], null)], null);
var G__101692 = block_id;
return (frontend.db.async._LT_q.cljs$core$IFn$_invoke$arity$4 ? frontend.db.async._LT_q.cljs$core$IFn$_invoke$arity$4(G__101689,G__101690,G__101691,G__101692) : frontend.db.async._LT_q.call(null,G__101689,G__101690,G__101691,G__101692));
})()),(function (result){
return promesa.protocols._promise(cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (b){
var G__101693 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(b);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__101693) : frontend.db.entity.call(null,G__101693));
}),cljs.core.sort_by.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","created-at","block/created-at",1440015),result)));
}));
}));
});
frontend.db.async._LT_task_spent_time = (function frontend$db$async$_LT_task_spent_time(graph,block_id){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.db.async._LT_get_block_properties_history(graph,block_id)),(function (history){
return promesa.protocols._mcat(promesa.protocols._promise(cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (b){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("logseq.property","status","logseq.property/status",-907216853),new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("logseq.property.history","property","logseq.property.history/property",1600409082).cljs$core$IFn$_invoke$arity$1(b)));
}),history)),(function (status_history){
return promesa.protocols._promise(((cljs.core.seq(status_history))?(function (){var time = (function (){var G__101697 = status_history;
var vec__101698 = G__101697;
var seq__101699 = cljs.core.seq(vec__101698);
var first__101700 = cljs.core.first(seq__101699);
var seq__101699__$1 = cljs.core.next(seq__101699);
var last_item = first__101700;
var first__101700__$1 = cljs.core.first(seq__101699__$1);
var seq__101699__$2 = cljs.core.next(seq__101699__$1);
var item = first__101700__$1;
var others = seq__101699__$2;
var time = (0);
var G__101697__$1 = G__101697;
var time__$1 = time;
while(true){
var vec__101701 = G__101697__$1;
var seq__101702 = cljs.core.seq(vec__101701);
var first__101703 = cljs.core.first(seq__101702);
var seq__101702__$1 = cljs.core.next(seq__101702);
var last_item__$1 = first__101703;
var first__101703__$1 = cljs.core.first(seq__101702__$1);
var seq__101702__$2 = cljs.core.next(seq__101702__$1);
var item__$1 = first__101703__$1;
var others__$1 = seq__101702__$2;
var time__$2 = time__$1;
if(cljs.core.truth_(item__$1)){
var last_status = new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("logseq.property.history","ref-value","logseq.property.history/ref-value",-513136037).cljs$core$IFn$_invoke$arity$1(last_item__$1));
var this_status = new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("logseq.property.history","ref-value","logseq.property.history/ref-value",-513136037).cljs$core$IFn$_invoke$arity$1(item__$1));
if(((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(this_status,new cljs.core.Keyword("logseq.property","status.doing","logseq.property/status.doing",1840122908))) && (cljs.core.empty_QMARK_(others__$1)))){
return cljs.core.quot((time__$2 + (cljs_time.coerce.to_long(cljs_time.core.now()) - new cljs.core.Keyword("block","created-at","block/created-at",1440015).cljs$core$IFn$_invoke$arity$1(item__$1))),(1000));
} else {
var time_SINGLEQUOTE_ = ((((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(last_status,new cljs.core.Keyword("logseq.property","status.doing","logseq.property/status.doing",1840122908))) || ((((!(cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword("logseq.property","status.backlog","logseq.property/status.backlog",-72333491),null,new cljs.core.Keyword("logseq.property","status.canceled","logseq.property/status.canceled",752643262),null,new cljs.core.Keyword("logseq.property","status.done","logseq.property/status.done",-1827582082),null], null), null),last_status)))) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(this_status,new cljs.core.Keyword("logseq.property","status.done","logseq.property/status.done",-1827582082)))))))?(time__$2 + (new cljs.core.Keyword("block","created-at","block/created-at",1440015).cljs$core$IFn$_invoke$arity$1(item__$1) - new cljs.core.Keyword("block","created-at","block/created-at",1440015).cljs$core$IFn$_invoke$arity$1(last_item__$1))):time__$2);
var G__101717 = cljs.core.cons(item__$1,others__$1);
var G__101718 = time_SINGLEQUOTE_;
G__101697__$1 = G__101717;
time__$1 = G__101718;
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
