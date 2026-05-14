goog.provide('frontend.components.file_based.query_table');
frontend.components.file_based.query_table.attach_clock_property = (function frontend$components$file_based$query_table$attach_clock_property(result){
var ks = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","properties","block/properties",708347145),new cljs.core.Keyword(null,"clock-time","clock-time",1696313975)], null);
var result__$1 = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (b){
var b__$1 = frontend.format.block.parse_title_and_body.cljs$core$IFn$_invoke$arity$1(b);
return cljs.core.assoc_in(b__$1,ks,(function (){var or__5002__auto__ = frontend.util.file_based.clock.clock_summary(new cljs.core.Keyword("block.temp","ast-body","block.temp/ast-body",-464258035).cljs$core$IFn$_invoke$arity$1(b__$1),false);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return (0);
}
})());
}),result);
if(cljs.core.every_QMARK_((function (p1__111278_SHARP_){
return (cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(p1__111278_SHARP_,ks) === (0));
}),result__$1)){
return cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__111279_SHARP_){
return medley.core.dissoc_in.cljs$core$IFn$_invoke$arity$2(p1__111279_SHARP_,ks);
}),result__$1);
} else {
return result__$1;
}
});
frontend.components.file_based.query_table.sort_by_fn = (function frontend$components$file_based$query_table$sort_by_fn(sort_by_column,item,p__111291){
var map__111292 = p__111291;
var map__111292__$1 = cljs.core.__destructure_map(map__111292);
var page_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__111292__$1,new cljs.core.Keyword(null,"page?","page?",644039860));
var G__111293 = sort_by_column;
var G__111293__$1 = (((G__111293 instanceof cljs.core.Keyword))?G__111293.fqn:null);
switch (G__111293__$1) {
case "created-at":
return new cljs.core.Keyword("block","created-at","block/created-at",1440015).cljs$core$IFn$_invoke$arity$1(item);

break;
case "updated-at":
return new cljs.core.Keyword("block","updated-at","block/updated-at",-1516550551).cljs$core$IFn$_invoke$arity$1(item);

break;
case "block":
return new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(item);

break;
case "page":
if(cljs.core.truth_(page_QMARK_)){
return new cljs.core.Keyword("block","name","block/name",1619760316).cljs$core$IFn$_invoke$arity$1(item);
} else {
return cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(item,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","page","block/page",822314108),new cljs.core.Keyword("block","name","block/name",1619760316)], null));
}

break;
default:
return cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(item,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","properties","block/properties",708347145),sort_by_column], null));

}
});
/**
 * Use locale specific comparison for strings and general comparison for others.
 */
frontend.components.file_based.query_table.locale_compare = (function frontend$components$file_based$query_table$locale_compare(x,y){
if(((typeof x === 'number') && (typeof y === 'number'))){
return (x < y);
} else {
return cljs.core.str.cljs$core$IFn$_invoke$arity$1(x).localeCompare(cljs.core.str.cljs$core$IFn$_invoke$arity$1(y),frontend.state.sub(new cljs.core.Keyword(null,"preferred-language","preferred-language",-1247855017)),({"numeric": true}));
}
});
frontend.components.file_based.query_table.sort_result = (function frontend$components$file_based$query_table$sort_result(result,p__111308){
var map__111310 = p__111308;
var map__111310__$1 = cljs.core.__destructure_map(map__111310);
var sort_by_column = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__111310__$1,new cljs.core.Keyword(null,"sort-by-column","sort-by-column",-1857171302));
var sort_desc_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__111310__$1,new cljs.core.Keyword(null,"sort-desc?","sort-desc?",-1338011224));
var sort_nlp_date_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__111310__$1,new cljs.core.Keyword(null,"sort-nlp-date?","sort-nlp-date?",-929578317));
var page_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__111310__$1,new cljs.core.Keyword(null,"page?","page?",644039860));
if((!((sort_by_column == null)))){
var comp_fn = (cljs.core.truth_(sort_desc_QMARK_)?(function (p1__111305_SHARP_,p2__111304_SHARP_){
return frontend.components.file_based.query_table.locale_compare(p2__111304_SHARP_,p1__111305_SHARP_);
}):frontend.components.file_based.query_table.locale_compare);
return cljs.core.sort_by.cljs$core$IFn$_invoke$arity$3((function (item){
return frontend.format.block.normalize_block(frontend.components.file_based.query_table.sort_by_fn(sort_by_column,item,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"page?","page?",644039860),page_QMARK_], null)),sort_nlp_date_QMARK_);
}),comp_fn,result);
} else {
return result;
}
});
/**
 * Return current sort direction and column being sorted, respectively
 *   :sort-desc? and :sort-by-column. :sort-by-column is nil if no sorting is to be
 *   done
 */
frontend.components.file_based.query_table.get_sort_state = (function frontend$components$file_based$query_table$get_sort_state(current_block){
var properties = new cljs.core.Keyword("block","properties","block/properties",708347145).cljs$core$IFn$_invoke$arity$1(current_block);
var p_desc_QMARK_ = new cljs.core.Keyword(null,"query-sort-desc","query-sort-desc",123730008).cljs$core$IFn$_invoke$arity$1(properties);
var desc_QMARK_ = (((!((p_desc_QMARK_ == null))))?p_desc_QMARK_:true);
var properties__$1 = new cljs.core.Keyword("block","properties","block/properties",708347145).cljs$core$IFn$_invoke$arity$1(current_block);
var query_sort_by = new cljs.core.Keyword(null,"query-sort-by","query-sort-by",488160033).cljs$core$IFn$_invoke$arity$1(properties__$1);
var nlp_date_QMARK_ = new cljs.core.Keyword("logseq.query","nlp-date","logseq.query/nlp-date",-145078221).cljs$core$IFn$_invoke$arity$1(properties__$1);
var sort_by_column = (function (){var or__5002__auto__ = cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(query_sort_by);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
if(frontend.db.query_dsl.query_contains_filter_QMARK_(new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(current_block),"sort-by")){
return null;
} else {
return new cljs.core.Keyword(null,"updated-at","updated-at",-1592622336);
}
}
})();
return new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"sort-desc?","sort-desc?",-1338011224),desc_QMARK_,new cljs.core.Keyword(null,"sort-by-column","sort-by-column",-1857171302),sort_by_column,new cljs.core.Keyword(null,"sort-nlp-date?","sort-nlp-date?",-929578317),nlp_date_QMARK_], null);
});
frontend.components.file_based.query_table.sortable_title = rum.core.lazy_build(rum.core.build_defc,(function (title,column,p__111418,block_id){
var map__111420 = p__111418;
var map__111420__$1 = cljs.core.__destructure_map(map__111420);
var sort_by_column = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__111420__$1,new cljs.core.Keyword(null,"sort-by-column","sort-by-column",-1857171302));
var sort_desc_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__111420__$1,new cljs.core.Keyword(null,"sort-desc?","sort-desc?",-1338011224));
var repo = frontend.state.get_current_repo();
return daiquiri.core.create_element("th",{'className':"whitespace-nowrap"},[daiquiri.core.create_element("a",{'onClick':(function (){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41621__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.property.set_block_property_BANG_(repo,block_id,new cljs.core.Keyword(null,"query-sort-by","query-sort-by",488160033),cljs.core.name(column))),(function (___41611__auto__){
return promesa.protocols._promise(frontend.handler.property.set_block_property_BANG_(repo,block_id,new cljs.core.Keyword(null,"query-sort-desc","query-sort-desc",123730008),cljs.core.not(sort_desc_QMARK_)));
}));
}));
})},[daiquiri.core.create_element("div",{'className':"flex items-center"},[(function (){var attrs111453 = title;
return daiquiri.core.create_element("span",((cljs.core.map_QMARK_(attrs111453))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["mr-1"], null)], null),attrs111453], 0))):{'className':"mr-1"}),((cljs.core.map_QMARK_(attrs111453))?null:[daiquiri.interpreter.interpret(attrs111453)]));
})(),((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(sort_by_column,column))?(function (){var attrs111466 = (cljs.core.truth_(sort_desc_QMARK_)?frontend.components.svg.caret_down():frontend.components.svg.caret_up());
return daiquiri.core.create_element("span",((cljs.core.map_QMARK_(attrs111466))?daiquiri.interpreter.element_attributes(attrs111466):null),((cljs.core.map_QMARK_(attrs111466))?null:[daiquiri.interpreter.interpret(attrs111466)]));
})():null)])])]);
}),null,"frontend.components.file-based.query-table/sortable-title");
/**
 * Gets all possible columns for a given result. Property names are keywords
 */
frontend.components.file_based.query_table.get_all_columns_for_result = (function frontend$components$file_based$query_table$get_all_columns_for_result(result,page_QMARK_){
var hidden_properties = cljs.core.conj.cljs$core$IFn$_invoke$arity$2((frontend.handler.file_based.property.built_in_properties.cljs$core$IFn$_invoke$arity$0 ? frontend.handler.file_based.property.built_in_properties.cljs$core$IFn$_invoke$arity$0() : frontend.handler.file_based.property.built_in_properties.call(null)),new cljs.core.Keyword(null,"template","template",-702405684));
var prop_keys_STAR_ = cljs.core.remove.cljs$core$IFn$_invoke$arity$2(hidden_properties,cljs.core.distinct.cljs$core$IFn$_invoke$arity$1(cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic(cljs.core.keys,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","properties","block/properties",708347145),result)], 0))));
var prop_keys = (function (){var G__111473 = (cljs.core.truth_(page_QMARK_)?cljs.core.cons(new cljs.core.Keyword(null,"page","page",849072397),prop_keys_STAR_):cljs.core.concat.cljs$core$IFn$_invoke$arity$2(cljs.core.list(new cljs.core.Keyword(null,"block","block",664686210),new cljs.core.Keyword(null,"page","page",849072397)),prop_keys_STAR_));
if(cljs.core.truth_(page_QMARK_)){
return cljs.core.concat.cljs$core$IFn$_invoke$arity$2(G__111473,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"created-at","created-at",-89248644),new cljs.core.Keyword(null,"updated-at","updated-at",-1592622336)], null));
} else {
return G__111473;
}
})();
return prop_keys;
});
frontend.components.file_based.query_table.get_columns = (function frontend$components$file_based$query_table$get_columns(current_block,result,p__111479){
var map__111480 = p__111479;
var map__111480__$1 = cljs.core.__destructure_map(map__111480);
var page_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__111480__$1,new cljs.core.Keyword(null,"page?","page?",644039860));
var properties = new cljs.core.Keyword("block","properties","block/properties",708347145).cljs$core$IFn$_invoke$arity$1(current_block);
var query_properties = (function (){var G__111484 = new cljs.core.Keyword(null,"query-properties","query-properties",-953532199).cljs$core$IFn$_invoke$arity$1(properties);
if((G__111484 == null)){
return null;
} else {
return frontend.handler.common.safe_read_string(G__111484,"Parsing query properties failed");
}
})();
var query_properties__$1 = (cljs.core.truth_(page_QMARK_)?cljs.core.remove.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"block","block",664686210),null], null), null),query_properties):query_properties);
var columns = ((cljs.core.seq(query_properties__$1))?query_properties__$1:frontend.components.file_based.query_table.get_all_columns_for_result(result,page_QMARK_));
return cljs.core.distinct.cljs$core$IFn$_invoke$arity$1(columns);
});
/**
 * Builds a column's tuple value for a query table given a row, column and
 *   options
 */
frontend.components.file_based.query_table.build_column_value = (function frontend$components$file_based$query_table$build_column_value(row,column,p__111495){
var map__111496 = p__111495;
var map__111496__$1 = cljs.core.__destructure_map(map__111496);
var page_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__111496__$1,new cljs.core.Keyword(null,"page?","page?",644039860));
var __GT_elem = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__111496__$1,new cljs.core.Keyword(null,"->elem","->elem",-260360654));
var map_inline = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__111496__$1,new cljs.core.Keyword(null,"map-inline","map-inline",-1498071144));
var comma_separated_property_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__111496__$1,new cljs.core.Keyword(null,"comma-separated-property?","comma-separated-property?",-580287681));
var G__111499 = column;
var G__111499__$1 = (((G__111499 instanceof cljs.core.Keyword))?G__111499.fqn:null);
switch (G__111499__$1) {
case "page":
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"string","string",-1989541586),(cljs.core.truth_(page_QMARK_)?(function (){var or__5002__auto__ = new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(row);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword("block","name","block/name",1619760316).cljs$core$IFn$_invoke$arity$1(row);
}
})():(function (){var or__5002__auto__ = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(row,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","page","block/page",822314108),new cljs.core.Keyword("block","title","block/title",710445684)], null));
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(row,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","page","block/page",822314108),new cljs.core.Keyword("block","name","block/name",1619760316)], null));
}
})())], null);

break;
case "block":
var content = new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(row);
var uuid = new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(row);
var map__111501 = frontend.format.block.parse_title_and_body.cljs$core$IFn$_invoke$arity$4(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(row),cljs.core.get.cljs$core$IFn$_invoke$arity$3(row,new cljs.core.Keyword("block","format","block/format",-1212045901),new cljs.core.Keyword(null,"markdown","markdown",1227225089)),new cljs.core.Keyword("block","pre-block?","block/pre-block?",-1671958521).cljs$core$IFn$_invoke$arity$1(row),content);
var map__111501__$1 = cljs.core.__destructure_map(map__111501);
var title = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__111501__$1,new cljs.core.Keyword("block","title","block/title",710445684));
if(cljs.core.seq(title)){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"element","element",1974019749),(function (){var G__111507 = new cljs.core.Keyword(null,"div","div",1057191632);
var G__111508 = (function (){var G__111510 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),uuid], null);
var G__111511 = title;
return (map_inline.cljs$core$IFn$_invoke$arity$2 ? map_inline.cljs$core$IFn$_invoke$arity$2(G__111510,G__111511) : map_inline.call(null,G__111510,G__111511));
})();
return (__GT_elem.cljs$core$IFn$_invoke$arity$2 ? __GT_elem.cljs$core$IFn$_invoke$arity$2(G__111507,G__111508) : __GT_elem.call(null,G__111507,G__111508));
})()], null);
} else {
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"string","string",-1989541586),content], null);
}

break;
case "created-at":
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"string","string",-1989541586),(function (){var temp__5804__auto__ = new cljs.core.Keyword("block","created-at","block/created-at",1440015).cljs$core$IFn$_invoke$arity$1(row);
if(cljs.core.truth_(temp__5804__auto__)){
var created_at = temp__5804__auto__;
return frontend.date.int__GT_local_time_2(created_at);
} else {
return null;
}
})()], null);

break;
case "updated-at":
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"string","string",-1989541586),(function (){var temp__5804__auto__ = new cljs.core.Keyword("block","updated-at","block/updated-at",-1516550551).cljs$core$IFn$_invoke$arity$1(row);
if(cljs.core.truth_(temp__5804__auto__)){
var updated_at = temp__5804__auto__;
return frontend.date.int__GT_local_time_2(updated_at);
} else {
return null;
}
})()], null);

break;
default:
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"string","string",-1989541586),(function (){var value = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(row,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","properties","block/properties",708347145),column], null));
if(cljs.core.truth_((function (){var or__5002__auto__ = comma_separated_property_QMARK_;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.coll_QMARK_(value);
}
})())){
return value;
} else {
var or__5002__auto__ = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(row,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","properties-text-values","block/properties-text-values",1271244708),column], null));
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return value;
}
}
})()], null);

}
});
frontend.components.file_based.query_table.render_column_value = (function frontend$components$file_based$query_table$render_column_value(p__111520,page_cp,inline_text){
var map__111524 = p__111520;
var map__111524__$1 = cljs.core.__destructure_map(map__111524);
var row_block = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__111524__$1,new cljs.core.Keyword(null,"row-block","row-block",-1024640241));
var row_format = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__111524__$1,new cljs.core.Keyword(null,"row-format","row-format",-595828600));
var cell_format = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__111524__$1,new cljs.core.Keyword(null,"cell-format","cell-format",1949729107));
var value = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__111524__$1,new cljs.core.Keyword(null,"value","value",305978217));
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"element","element",1974019749),cell_format)){
return value;
} else {
if(cljs.core.coll_QMARK_(value)){
return cljs.core.interpose.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span","span",1394872991),", "], null),cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__111517_SHARP_){
var G__111528 = cljs.core.PersistentArrayMap.EMPTY;
var G__111529 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("block","name","block/name",1619760316),p1__111517_SHARP_], null);
return (page_cp.cljs$core$IFn$_invoke$arity$2 ? page_cp.cljs$core$IFn$_invoke$arity$2(G__111528,G__111529) : page_cp.call(null,G__111528,G__111529));
}),value));
} else {
if(cljs.core.boolean_QMARK_(value)){
return cljs.core.str.cljs$core$IFn$_invoke$arity$1(value);
} else {
if(typeof value === 'string'){
var temp__5802__auto__ = (function (){var and__5000__auto__ = typeof value === 'string';
if(and__5000__auto__){
return (frontend.db.get_page.cljs$core$IFn$_invoke$arity$1 ? frontend.db.get_page.cljs$core$IFn$_invoke$arity$1(value) : frontend.db.get_page.call(null,value));
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5802__auto__)){
var page = temp__5802__auto__;
var G__111534 = cljs.core.PersistentArrayMap.EMPTY;
var G__111535 = page;
return (page_cp.cljs$core$IFn$_invoke$arity$2 ? page_cp.cljs$core$IFn$_invoke$arity$2(G__111534,G__111535) : page_cp.call(null,G__111534,G__111535));
} else {
return (inline_text.cljs$core$IFn$_invoke$arity$3 ? inline_text.cljs$core$IFn$_invoke$arity$3(row_block,row_format,value) : inline_text.call(null,row_block,row_format,value));
}
} else {
return value;

}
}
}
}
});
frontend.components.file_based.query_table.result_table_v1 = rum.core.lazy_build(rum.core.build_defcs,(function (state,config,current_block,sort_result_SINGLEQUOTE_,sort_state,columns,p__111543,map_inline,page_cp,__GT_elem,inline_text){
var map__111546 = p__111543;
var map__111546__$1 = cljs.core.__destructure_map(map__111546);
var page_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__111546__$1,new cljs.core.Keyword(null,"page?","page?",644039860));
var select_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(state,new cljs.core.Keyword("frontend.components.file-based.query-table","select?","frontend.components.file-based.query-table/select?",1859548156));
var _STAR_mouse_down_QMARK_ = new cljs.core.Keyword("frontend.components.file-based.query-table","mouse-down?","frontend.components.file-based.query-table/mouse-down?",-1864483577).cljs$core$IFn$_invoke$arity$1(state);
var clock_time_total = (cljs.core.truth_(page_QMARK_)?null:cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core._PLUS_,cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__111536_SHARP_){
return cljs.core.get_in.cljs$core$IFn$_invoke$arity$3(p1__111536_SHARP_,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","properties","block/properties",708347145),new cljs.core.Keyword(null,"clock-time","clock-time",1696313975)], null),(0));
}),sort_result_SINGLEQUOTE_)));
var property_separated_by_commas_QMARK_ = cljs.core.partial.cljs$core$IFn$_invoke$arity$2(logseq.graph_parser.text.separated_by_commas_QMARK_,frontend.state.get_config.cljs$core$IFn$_invoke$arity$0());
return daiquiri.core.create_element("div",{'onPointerDown':(function (e){
return e.stopPropagation();
}),'style':{'width':"100%"},'className':"overflow-x-auto query-table"},[daiquiri.core.create_element("table",{'className':"table-auto"},[daiquiri.core.create_element("thead",null,[daiquiri.core.create_element("tr",{'className':"cursor"},[cljs.core.into_array.cljs$core$IFn$_invoke$arity$1((function (){var iter__5480__auto__ = (function frontend$components$file_based$query_table$iter__111550(s__111551){
return (new cljs.core.LazySeq(null,(function (){
var s__111551__$1 = s__111551;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__111551__$1);
if(temp__5804__auto__){
var s__111551__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__111551__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__111551__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__111553 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__111552 = (0);
while(true){
if((i__111552 < size__5479__auto__)){
var column = cljs.core._nth(c__5478__auto__,i__111552);
cljs.core.chunk_append(b__111553,(function (){var title = ((((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(column,new cljs.core.Keyword(null,"clock-time","clock-time",1696313975))) && (cljs.core.integer_QMARK_(clock_time_total))))?(function (){var G__111558 = "clock-time(total: %s)";
var G__111559 = frontend.util.file_based.clock.seconds__GT_days_COLON_hours_COLON_minutes_COLON_seconds(clock_time_total);
return (frontend.util.format.cljs$core$IFn$_invoke$arity$2 ? frontend.util.format.cljs$core$IFn$_invoke$arity$2(G__111558,G__111559) : frontend.util.format.call(null,G__111558,G__111559));
})():cljs.core.name(column));
return frontend.components.file_based.query_table.sortable_title(title,column,sort_state,new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(current_block));
})());

var G__111974 = (i__111552 + (1));
i__111552 = G__111974;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__111553),frontend$components$file_based$query_table$iter__111550(cljs.core.chunk_rest(s__111551__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__111553),null);
}
} else {
var column = cljs.core.first(s__111551__$2);
return cljs.core.cons((function (){var title = ((((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(column,new cljs.core.Keyword(null,"clock-time","clock-time",1696313975))) && (cljs.core.integer_QMARK_(clock_time_total))))?(function (){var G__111563 = "clock-time(total: %s)";
var G__111564 = frontend.util.file_based.clock.seconds__GT_days_COLON_hours_COLON_minutes_COLON_seconds(clock_time_total);
return (frontend.util.format.cljs$core$IFn$_invoke$arity$2 ? frontend.util.format.cljs$core$IFn$_invoke$arity$2(G__111563,G__111564) : frontend.util.format.call(null,G__111563,G__111564));
})():cljs.core.name(column));
return frontend.components.file_based.query_table.sortable_title(title,column,sort_state,new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(current_block));
})(),frontend$components$file_based$query_table$iter__111550(cljs.core.rest(s__111551__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(columns);
})())])]),daiquiri.core.create_element("tbody",null,[cljs.core.into_array.cljs$core$IFn$_invoke$arity$1((function (){var iter__5480__auto__ = (function frontend$components$file_based$query_table$iter__111565(s__111566){
return (new cljs.core.LazySeq(null,(function (){
var s__111566__$1 = s__111566;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__111566__$1);
if(temp__5804__auto__){
var s__111566__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__111566__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__111566__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__111568 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__111567 = (0);
while(true){
if((i__111567 < size__5479__auto__)){
var row = cljs.core._nth(c__5478__auto__,i__111567);
cljs.core.chunk_append(b__111568,(function (){var format = cljs.core.get.cljs$core$IFn$_invoke$arity$3(row,new cljs.core.Keyword("block","format","block/format",-1212045901),new cljs.core.Keyword(null,"markdown","markdown",1227225089));
return daiquiri.core.create_element("tr",{'className':"cursor"},[cljs.core.into_array.cljs$core$IFn$_invoke$arity$1((function (){var iter__5480__auto__ = ((function (i__111567,format,row,c__5478__auto__,size__5479__auto__,b__111568,s__111566__$2,temp__5804__auto__,select_QMARK_,_STAR_mouse_down_QMARK_,clock_time_total,property_separated_by_commas_QMARK_,map__111546,map__111546__$1,page_QMARK_){
return (function frontend$components$file_based$query_table$iter__111565_$_iter__111574(s__111575){
return (new cljs.core.LazySeq(null,((function (i__111567,format,row,c__5478__auto__,size__5479__auto__,b__111568,s__111566__$2,temp__5804__auto__,select_QMARK_,_STAR_mouse_down_QMARK_,clock_time_total,property_separated_by_commas_QMARK_,map__111546,map__111546__$1,page_QMARK_){
return (function (){
var s__111575__$1 = s__111575;
while(true){
var temp__5804__auto____$1 = cljs.core.seq(s__111575__$1);
if(temp__5804__auto____$1){
var s__111575__$2 = temp__5804__auto____$1;
if(cljs.core.chunked_seq_QMARK_(s__111575__$2)){
var c__5478__auto____$1 = cljs.core.chunk_first(s__111575__$2);
var size__5479__auto____$1 = cljs.core.count(c__5478__auto____$1);
var b__111577 = cljs.core.chunk_buffer(size__5479__auto____$1);
if((function (){var i__111576 = (0);
while(true){
if((i__111576 < size__5479__auto____$1)){
var column = cljs.core._nth(c__5478__auto____$1,i__111576);
cljs.core.chunk_append(b__111577,(function (){var vec__111582 = frontend.components.file_based.query_table.build_column_value(row,column,new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"page?","page?",644039860),page_QMARK_,new cljs.core.Keyword(null,"->elem","->elem",-260360654),__GT_elem,new cljs.core.Keyword(null,"map-inline","map-inline",-1498071144),map_inline,new cljs.core.Keyword(null,"config","config",994861415),config,new cljs.core.Keyword(null,"comma-separated-property?","comma-separated-property?",-580287681),property_separated_by_commas_QMARK_(column)], null));
var cell_format = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__111582,(0),null);
var value = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__111582,(1),null);
return daiquiri.core.create_element("td",{'data-key':cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([column], 0)),'onPointerDown':((function (i__111576,i__111567,vec__111582,cell_format,value,column,c__5478__auto____$1,size__5479__auto____$1,b__111577,s__111575__$2,temp__5804__auto____$1,format,row,c__5478__auto__,size__5479__auto__,b__111568,s__111566__$2,temp__5804__auto__,select_QMARK_,_STAR_mouse_down_QMARK_,clock_time_total,property_separated_by_commas_QMARK_,map__111546,map__111546__$1,page_QMARK_){
return (function (){
cljs.core.reset_BANG_(_STAR_mouse_down_QMARK_,true);

return cljs.core.reset_BANG_(select_QMARK_,false);
});})(i__111576,i__111567,vec__111582,cell_format,value,column,c__5478__auto____$1,size__5479__auto____$1,b__111577,s__111575__$2,temp__5804__auto____$1,format,row,c__5478__auto__,size__5479__auto__,b__111568,s__111566__$2,temp__5804__auto__,select_QMARK_,_STAR_mouse_down_QMARK_,clock_time_total,property_separated_by_commas_QMARK_,map__111546,map__111546__$1,page_QMARK_))
,'onMouseMove':((function (i__111576,i__111567,vec__111582,cell_format,value,column,c__5478__auto____$1,size__5479__auto____$1,b__111577,s__111575__$2,temp__5804__auto____$1,format,row,c__5478__auto__,size__5479__auto__,b__111568,s__111566__$2,temp__5804__auto__,select_QMARK_,_STAR_mouse_down_QMARK_,clock_time_total,property_separated_by_commas_QMARK_,map__111546,map__111546__$1,page_QMARK_){
return (function (){
return cljs.core.reset_BANG_(select_QMARK_,true);
});})(i__111576,i__111567,vec__111582,cell_format,value,column,c__5478__auto____$1,size__5479__auto____$1,b__111577,s__111575__$2,temp__5804__auto____$1,format,row,c__5478__auto__,size__5479__auto__,b__111568,s__111566__$2,temp__5804__auto__,select_QMARK_,_STAR_mouse_down_QMARK_,clock_time_total,property_separated_by_commas_QMARK_,map__111546,map__111546__$1,page_QMARK_))
,'onPointerUp':((function (i__111576,i__111567,vec__111582,cell_format,value,column,c__5478__auto____$1,size__5479__auto____$1,b__111577,s__111575__$2,temp__5804__auto____$1,format,row,c__5478__auto__,size__5479__auto__,b__111568,s__111566__$2,temp__5804__auto__,select_QMARK_,_STAR_mouse_down_QMARK_,clock_time_total,property_separated_by_commas_QMARK_,map__111546,map__111546__$1,page_QMARK_){
return (function (){
if(cljs.core.truth_((function (){var and__5000__auto__ = cljs.core.deref(_STAR_mouse_down_QMARK_);
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.not(cljs.core.deref(select_QMARK_));
} else {
return and__5000__auto__;
}
})())){
frontend.state.sidebar_add_block_BANG_(frontend.state.get_current_repo(),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(row),new cljs.core.Keyword(null,"block-ref","block-ref",362929756));

return cljs.core.reset_BANG_(_STAR_mouse_down_QMARK_,false);
} else {
return null;
}
});})(i__111576,i__111567,vec__111582,cell_format,value,column,c__5478__auto____$1,size__5479__auto____$1,b__111577,s__111575__$2,temp__5804__auto____$1,format,row,c__5478__auto__,size__5479__auto__,b__111568,s__111566__$2,temp__5804__auto__,select_QMARK_,_STAR_mouse_down_QMARK_,clock_time_total,property_separated_by_commas_QMARK_,map__111546,map__111546__$1,page_QMARK_))
,'className':"whitespace-nowrap"},[(((!((value == null))))?daiquiri.interpreter.interpret(frontend.components.file_based.query_table.render_column_value(new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"row-block","row-block",-1024640241),row,new cljs.core.Keyword(null,"row-format","row-format",-595828600),format,new cljs.core.Keyword(null,"cell-format","cell-format",1949729107),cell_format,new cljs.core.Keyword(null,"value","value",305978217),value], null),page_cp,inline_text)):null)]);
})());

var G__111996 = (i__111576 + (1));
i__111576 = G__111996;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__111577),frontend$components$file_based$query_table$iter__111565_$_iter__111574(cljs.core.chunk_rest(s__111575__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__111577),null);
}
} else {
var column = cljs.core.first(s__111575__$2);
return cljs.core.cons((function (){var vec__111588 = frontend.components.file_based.query_table.build_column_value(row,column,new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"page?","page?",644039860),page_QMARK_,new cljs.core.Keyword(null,"->elem","->elem",-260360654),__GT_elem,new cljs.core.Keyword(null,"map-inline","map-inline",-1498071144),map_inline,new cljs.core.Keyword(null,"config","config",994861415),config,new cljs.core.Keyword(null,"comma-separated-property?","comma-separated-property?",-580287681),property_separated_by_commas_QMARK_(column)], null));
var cell_format = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__111588,(0),null);
var value = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__111588,(1),null);
return daiquiri.core.create_element("td",{'data-key':cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([column], 0)),'onPointerDown':((function (i__111567,vec__111588,cell_format,value,column,s__111575__$2,temp__5804__auto____$1,format,row,c__5478__auto__,size__5479__auto__,b__111568,s__111566__$2,temp__5804__auto__,select_QMARK_,_STAR_mouse_down_QMARK_,clock_time_total,property_separated_by_commas_QMARK_,map__111546,map__111546__$1,page_QMARK_){
return (function (){
cljs.core.reset_BANG_(_STAR_mouse_down_QMARK_,true);

return cljs.core.reset_BANG_(select_QMARK_,false);
});})(i__111567,vec__111588,cell_format,value,column,s__111575__$2,temp__5804__auto____$1,format,row,c__5478__auto__,size__5479__auto__,b__111568,s__111566__$2,temp__5804__auto__,select_QMARK_,_STAR_mouse_down_QMARK_,clock_time_total,property_separated_by_commas_QMARK_,map__111546,map__111546__$1,page_QMARK_))
,'onMouseMove':((function (i__111567,vec__111588,cell_format,value,column,s__111575__$2,temp__5804__auto____$1,format,row,c__5478__auto__,size__5479__auto__,b__111568,s__111566__$2,temp__5804__auto__,select_QMARK_,_STAR_mouse_down_QMARK_,clock_time_total,property_separated_by_commas_QMARK_,map__111546,map__111546__$1,page_QMARK_){
return (function (){
return cljs.core.reset_BANG_(select_QMARK_,true);
});})(i__111567,vec__111588,cell_format,value,column,s__111575__$2,temp__5804__auto____$1,format,row,c__5478__auto__,size__5479__auto__,b__111568,s__111566__$2,temp__5804__auto__,select_QMARK_,_STAR_mouse_down_QMARK_,clock_time_total,property_separated_by_commas_QMARK_,map__111546,map__111546__$1,page_QMARK_))
,'onPointerUp':((function (i__111567,vec__111588,cell_format,value,column,s__111575__$2,temp__5804__auto____$1,format,row,c__5478__auto__,size__5479__auto__,b__111568,s__111566__$2,temp__5804__auto__,select_QMARK_,_STAR_mouse_down_QMARK_,clock_time_total,property_separated_by_commas_QMARK_,map__111546,map__111546__$1,page_QMARK_){
return (function (){
if(cljs.core.truth_((function (){var and__5000__auto__ = cljs.core.deref(_STAR_mouse_down_QMARK_);
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.not(cljs.core.deref(select_QMARK_));
} else {
return and__5000__auto__;
}
})())){
frontend.state.sidebar_add_block_BANG_(frontend.state.get_current_repo(),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(row),new cljs.core.Keyword(null,"block-ref","block-ref",362929756));

return cljs.core.reset_BANG_(_STAR_mouse_down_QMARK_,false);
} else {
return null;
}
});})(i__111567,vec__111588,cell_format,value,column,s__111575__$2,temp__5804__auto____$1,format,row,c__5478__auto__,size__5479__auto__,b__111568,s__111566__$2,temp__5804__auto__,select_QMARK_,_STAR_mouse_down_QMARK_,clock_time_total,property_separated_by_commas_QMARK_,map__111546,map__111546__$1,page_QMARK_))
,'className':"whitespace-nowrap"},[(((!((value == null))))?daiquiri.interpreter.interpret(frontend.components.file_based.query_table.render_column_value(new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"row-block","row-block",-1024640241),row,new cljs.core.Keyword(null,"row-format","row-format",-595828600),format,new cljs.core.Keyword(null,"cell-format","cell-format",1949729107),cell_format,new cljs.core.Keyword(null,"value","value",305978217),value], null),page_cp,inline_text)):null)]);
})(),frontend$components$file_based$query_table$iter__111565_$_iter__111574(cljs.core.rest(s__111575__$2)));
}
} else {
return null;
}
break;
}
});})(i__111567,format,row,c__5478__auto__,size__5479__auto__,b__111568,s__111566__$2,temp__5804__auto__,select_QMARK_,_STAR_mouse_down_QMARK_,clock_time_total,property_separated_by_commas_QMARK_,map__111546,map__111546__$1,page_QMARK_))
,null,null));
});})(i__111567,format,row,c__5478__auto__,size__5479__auto__,b__111568,s__111566__$2,temp__5804__auto__,select_QMARK_,_STAR_mouse_down_QMARK_,clock_time_total,property_separated_by_commas_QMARK_,map__111546,map__111546__$1,page_QMARK_))
;
return iter__5480__auto__(columns);
})())]);
})());

var G__112001 = (i__111567 + (1));
i__111567 = G__112001;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__111568),frontend$components$file_based$query_table$iter__111565(cljs.core.chunk_rest(s__111566__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__111568),null);
}
} else {
var row = cljs.core.first(s__111566__$2);
return cljs.core.cons((function (){var format = cljs.core.get.cljs$core$IFn$_invoke$arity$3(row,new cljs.core.Keyword("block","format","block/format",-1212045901),new cljs.core.Keyword(null,"markdown","markdown",1227225089));
return daiquiri.core.create_element("tr",{'className':"cursor"},[cljs.core.into_array.cljs$core$IFn$_invoke$arity$1((function (){var iter__5480__auto__ = ((function (format,row,s__111566__$2,temp__5804__auto__,select_QMARK_,_STAR_mouse_down_QMARK_,clock_time_total,property_separated_by_commas_QMARK_,map__111546,map__111546__$1,page_QMARK_){
return (function frontend$components$file_based$query_table$iter__111565_$_iter__111601(s__111602){
return (new cljs.core.LazySeq(null,(function (){
var s__111602__$1 = s__111602;
while(true){
var temp__5804__auto____$1 = cljs.core.seq(s__111602__$1);
if(temp__5804__auto____$1){
var s__111602__$2 = temp__5804__auto____$1;
if(cljs.core.chunked_seq_QMARK_(s__111602__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__111602__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__111604 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__111603 = (0);
while(true){
if((i__111603 < size__5479__auto__)){
var column = cljs.core._nth(c__5478__auto__,i__111603);
cljs.core.chunk_append(b__111604,(function (){var vec__111613 = frontend.components.file_based.query_table.build_column_value(row,column,new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"page?","page?",644039860),page_QMARK_,new cljs.core.Keyword(null,"->elem","->elem",-260360654),__GT_elem,new cljs.core.Keyword(null,"map-inline","map-inline",-1498071144),map_inline,new cljs.core.Keyword(null,"config","config",994861415),config,new cljs.core.Keyword(null,"comma-separated-property?","comma-separated-property?",-580287681),property_separated_by_commas_QMARK_(column)], null));
var cell_format = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__111613,(0),null);
var value = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__111613,(1),null);
return daiquiri.core.create_element("td",{'data-key':cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([column], 0)),'onPointerDown':((function (i__111603,vec__111613,cell_format,value,column,c__5478__auto__,size__5479__auto__,b__111604,s__111602__$2,temp__5804__auto____$1,format,row,s__111566__$2,temp__5804__auto__,select_QMARK_,_STAR_mouse_down_QMARK_,clock_time_total,property_separated_by_commas_QMARK_,map__111546,map__111546__$1,page_QMARK_){
return (function (){
cljs.core.reset_BANG_(_STAR_mouse_down_QMARK_,true);

return cljs.core.reset_BANG_(select_QMARK_,false);
});})(i__111603,vec__111613,cell_format,value,column,c__5478__auto__,size__5479__auto__,b__111604,s__111602__$2,temp__5804__auto____$1,format,row,s__111566__$2,temp__5804__auto__,select_QMARK_,_STAR_mouse_down_QMARK_,clock_time_total,property_separated_by_commas_QMARK_,map__111546,map__111546__$1,page_QMARK_))
,'onMouseMove':((function (i__111603,vec__111613,cell_format,value,column,c__5478__auto__,size__5479__auto__,b__111604,s__111602__$2,temp__5804__auto____$1,format,row,s__111566__$2,temp__5804__auto__,select_QMARK_,_STAR_mouse_down_QMARK_,clock_time_total,property_separated_by_commas_QMARK_,map__111546,map__111546__$1,page_QMARK_){
return (function (){
return cljs.core.reset_BANG_(select_QMARK_,true);
});})(i__111603,vec__111613,cell_format,value,column,c__5478__auto__,size__5479__auto__,b__111604,s__111602__$2,temp__5804__auto____$1,format,row,s__111566__$2,temp__5804__auto__,select_QMARK_,_STAR_mouse_down_QMARK_,clock_time_total,property_separated_by_commas_QMARK_,map__111546,map__111546__$1,page_QMARK_))
,'onPointerUp':((function (i__111603,vec__111613,cell_format,value,column,c__5478__auto__,size__5479__auto__,b__111604,s__111602__$2,temp__5804__auto____$1,format,row,s__111566__$2,temp__5804__auto__,select_QMARK_,_STAR_mouse_down_QMARK_,clock_time_total,property_separated_by_commas_QMARK_,map__111546,map__111546__$1,page_QMARK_){
return (function (){
if(cljs.core.truth_((function (){var and__5000__auto__ = cljs.core.deref(_STAR_mouse_down_QMARK_);
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.not(cljs.core.deref(select_QMARK_));
} else {
return and__5000__auto__;
}
})())){
frontend.state.sidebar_add_block_BANG_(frontend.state.get_current_repo(),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(row),new cljs.core.Keyword(null,"block-ref","block-ref",362929756));

return cljs.core.reset_BANG_(_STAR_mouse_down_QMARK_,false);
} else {
return null;
}
});})(i__111603,vec__111613,cell_format,value,column,c__5478__auto__,size__5479__auto__,b__111604,s__111602__$2,temp__5804__auto____$1,format,row,s__111566__$2,temp__5804__auto__,select_QMARK_,_STAR_mouse_down_QMARK_,clock_time_total,property_separated_by_commas_QMARK_,map__111546,map__111546__$1,page_QMARK_))
,'className':"whitespace-nowrap"},[(((!((value == null))))?daiquiri.interpreter.interpret(frontend.components.file_based.query_table.render_column_value(new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"row-block","row-block",-1024640241),row,new cljs.core.Keyword(null,"row-format","row-format",-595828600),format,new cljs.core.Keyword(null,"cell-format","cell-format",1949729107),cell_format,new cljs.core.Keyword(null,"value","value",305978217),value], null),page_cp,inline_text)):null)]);
})());

var G__112019 = (i__111603 + (1));
i__111603 = G__112019;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__111604),frontend$components$file_based$query_table$iter__111565_$_iter__111601(cljs.core.chunk_rest(s__111602__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__111604),null);
}
} else {
var column = cljs.core.first(s__111602__$2);
return cljs.core.cons((function (){var vec__111655 = frontend.components.file_based.query_table.build_column_value(row,column,new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"page?","page?",644039860),page_QMARK_,new cljs.core.Keyword(null,"->elem","->elem",-260360654),__GT_elem,new cljs.core.Keyword(null,"map-inline","map-inline",-1498071144),map_inline,new cljs.core.Keyword(null,"config","config",994861415),config,new cljs.core.Keyword(null,"comma-separated-property?","comma-separated-property?",-580287681),property_separated_by_commas_QMARK_(column)], null));
var cell_format = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__111655,(0),null);
var value = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__111655,(1),null);
return daiquiri.core.create_element("td",{'data-key':cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([column], 0)),'onPointerDown':((function (vec__111655,cell_format,value,column,s__111602__$2,temp__5804__auto____$1,format,row,s__111566__$2,temp__5804__auto__,select_QMARK_,_STAR_mouse_down_QMARK_,clock_time_total,property_separated_by_commas_QMARK_,map__111546,map__111546__$1,page_QMARK_){
return (function (){
cljs.core.reset_BANG_(_STAR_mouse_down_QMARK_,true);

return cljs.core.reset_BANG_(select_QMARK_,false);
});})(vec__111655,cell_format,value,column,s__111602__$2,temp__5804__auto____$1,format,row,s__111566__$2,temp__5804__auto__,select_QMARK_,_STAR_mouse_down_QMARK_,clock_time_total,property_separated_by_commas_QMARK_,map__111546,map__111546__$1,page_QMARK_))
,'onMouseMove':((function (vec__111655,cell_format,value,column,s__111602__$2,temp__5804__auto____$1,format,row,s__111566__$2,temp__5804__auto__,select_QMARK_,_STAR_mouse_down_QMARK_,clock_time_total,property_separated_by_commas_QMARK_,map__111546,map__111546__$1,page_QMARK_){
return (function (){
return cljs.core.reset_BANG_(select_QMARK_,true);
});})(vec__111655,cell_format,value,column,s__111602__$2,temp__5804__auto____$1,format,row,s__111566__$2,temp__5804__auto__,select_QMARK_,_STAR_mouse_down_QMARK_,clock_time_total,property_separated_by_commas_QMARK_,map__111546,map__111546__$1,page_QMARK_))
,'onPointerUp':((function (vec__111655,cell_format,value,column,s__111602__$2,temp__5804__auto____$1,format,row,s__111566__$2,temp__5804__auto__,select_QMARK_,_STAR_mouse_down_QMARK_,clock_time_total,property_separated_by_commas_QMARK_,map__111546,map__111546__$1,page_QMARK_){
return (function (){
if(cljs.core.truth_((function (){var and__5000__auto__ = cljs.core.deref(_STAR_mouse_down_QMARK_);
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.not(cljs.core.deref(select_QMARK_));
} else {
return and__5000__auto__;
}
})())){
frontend.state.sidebar_add_block_BANG_(frontend.state.get_current_repo(),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(row),new cljs.core.Keyword(null,"block-ref","block-ref",362929756));

return cljs.core.reset_BANG_(_STAR_mouse_down_QMARK_,false);
} else {
return null;
}
});})(vec__111655,cell_format,value,column,s__111602__$2,temp__5804__auto____$1,format,row,s__111566__$2,temp__5804__auto__,select_QMARK_,_STAR_mouse_down_QMARK_,clock_time_total,property_separated_by_commas_QMARK_,map__111546,map__111546__$1,page_QMARK_))
,'className':"whitespace-nowrap"},[(((!((value == null))))?daiquiri.interpreter.interpret(frontend.components.file_based.query_table.render_column_value(new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"row-block","row-block",-1024640241),row,new cljs.core.Keyword(null,"row-format","row-format",-595828600),format,new cljs.core.Keyword(null,"cell-format","cell-format",1949729107),cell_format,new cljs.core.Keyword(null,"value","value",305978217),value], null),page_cp,inline_text)):null)]);
})(),frontend$components$file_based$query_table$iter__111565_$_iter__111601(cljs.core.rest(s__111602__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});})(format,row,s__111566__$2,temp__5804__auto__,select_QMARK_,_STAR_mouse_down_QMARK_,clock_time_total,property_separated_by_commas_QMARK_,map__111546,map__111546__$1,page_QMARK_))
;
return iter__5480__auto__(columns);
})())]);
})(),frontend$components$file_based$query_table$iter__111565(cljs.core.rest(s__111566__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(sort_result_SINGLEQUOTE_);
})())])])]);
}),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive,rum.core.local.cljs$core$IFn$_invoke$arity$2(false,new cljs.core.Keyword("frontend.components.file-based.query-table","select?","frontend.components.file-based.query-table/select?",1859548156)),rum.core.local.cljs$core$IFn$_invoke$arity$2(false,new cljs.core.Keyword("frontend.components.file-based.query-table","mouse-down?","frontend.components.file-based.query-table/mouse-down?",-1864483577))], null),"frontend.components.file-based.query-table/result-table-v1");
frontend.components.file_based.query_table.result_table = rum.core.lazy_build(rum.core.build_defc,(function (config,current_block,result,p__111691,map_inline,page_cp,__GT_elem,inline_text){
var map__111697 = p__111691;
var map__111697__$1 = cljs.core.__destructure_map(map__111697);
var options = map__111697__$1;
var page_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__111697__$1,new cljs.core.Keyword(null,"page?","page?",644039860));
if(cljs.core.truth_(current_block)){
var result_SINGLEQUOTE_ = (cljs.core.truth_(page_QMARK_)?result:frontend.components.file_based.query_table.attach_clock_property(result));
var columns = frontend.components.file_based.query_table.get_columns(current_block,result_SINGLEQUOTE_,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"page?","page?",644039860),page_QMARK_], null));
var sort_state = frontend.components.file_based.query_table.get_sort_state(current_block);
var sort_result_SINGLEQUOTE_ = frontend.components.file_based.query_table.sort_result(result_SINGLEQUOTE_,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(sort_state,new cljs.core.Keyword(null,"page?","page?",644039860),page_QMARK_));
return frontend.components.file_based.query_table.result_table_v1(config,current_block,sort_result_SINGLEQUOTE_,sort_state,columns,options,map_inline,page_cp,__GT_elem,inline_text);
} else {
return null;
}
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive], null),"frontend.components.file-based.query-table/result-table");

//# sourceMappingURL=frontend.components.file_based.query_table.js.map
