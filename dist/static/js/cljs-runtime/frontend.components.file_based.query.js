goog.provide('frontend.components.file_based.query');
frontend.components.file_based.query.query_refresh_button = rum.core.lazy_build(rum.core.build_defc,(function (query_time,p__113234){
var map__113237 = p__113234;
var map__113237__$1 = cljs.core.__destructure_map(map__113237);
var on_pointer_down = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__113237__$1,new cljs.core.Keyword(null,"on-pointer-down","on-pointer-down",573334138));
var full_text_search_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__113237__$1,new cljs.core.Keyword(null,"full-text-search?","full-text-search?",-1837750206));
return frontend.ui.tooltip(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"a.fade-link.flex","a.fade-link.flex",-1119199551),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-pointer-down","on-pointer-down",573334138),on_pointer_down], null),frontend.ui.icon("refresh",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"font-size","font-size",-1847940346),(20)], null)], null))], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"p","p",151049309),(cljs.core.truth_(full_text_search_QMARK_)?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span","span",1394872991),"Full-text search results will not be refreshed automatically."], null):new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span","span",1394872991),["This query takes ",cljs.core.str.cljs$core$IFn$_invoke$arity$1((query_time | (0))),"ms to finish, it's a bit slow so that auto refresh is disabled."].join('')], null))], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"p","p",151049309),"Click the refresh button instead if you want to see the latest result."], null)], null));
}),null,"frontend.components.file-based.query/query-refresh-button");
frontend.components.file_based.query.custom_query_header = rum.core.lazy_build(rum.core.build_defc,(function (p__113310,p__113311,p__113312){
var map__113313 = p__113310;
var map__113313__$1 = cljs.core.__destructure_map(map__113313);
var config = map__113313__$1;
var dsl_query_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__113313__$1,new cljs.core.Keyword(null,"dsl-query?","dsl-query?",-1061528662));
var map__113314 = p__113311;
var map__113314__$1 = cljs.core.__destructure_map(map__113314);
var q = map__113314__$1;
var title = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__113314__$1,new cljs.core.Keyword(null,"title","title",636505583));
var query = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__113314__$1,new cljs.core.Keyword(null,"query","query",-1288509510));
var map__113315 = p__113312;
var map__113315__$1 = cljs.core.__destructure_map(map__113315);
var collapsed_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__113315__$1,new cljs.core.Keyword(null,"collapsed?","collapsed?",-1661420674));
var _STAR_result = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__113315__$1,new cljs.core.Keyword(null,"*result","*result",-1157548516));
var result = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__113315__$1,new cljs.core.Keyword(null,"result","result",1415092211));
var table_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__113315__$1,new cljs.core.Keyword(null,"table?","table?",-1064705406));
var current_block = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__113315__$1,new cljs.core.Keyword(null,"current-block","current-block",1027687970));
var view_f = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__113315__$1,new cljs.core.Keyword(null,"view-f","view-f",314082005));
var page_list_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__113315__$1,new cljs.core.Keyword(null,"page-list?","page-list?",-466504566));
var query_error_atom = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__113315__$1,new cljs.core.Keyword(null,"query-error-atom","query-error-atom",-2138638607));
var dsl_page_query_QMARK_ = (function (){var and__5000__auto__ = dsl_query_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return new cljs.core.Keyword(null,"blocks?","blocks?",58578620).cljs$core$IFn$_invoke$arity$1(frontend.db.query_dsl.parse_query.cljs$core$IFn$_invoke$arity$1(query)) === false;
} else {
return and__5000__auto__;
}
})();
var full_text_search_QMARK_ = (function (){var and__5000__auto__ = dsl_query_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
var and__5000__auto____$1 = typeof query === 'string';
if(and__5000__auto____$1){
return cljs.core.re_matches(/\".*\"/,query);
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})();
var query_time = new cljs.core.Keyword(null,"query-time","query-time",128933024).cljs$core$IFn$_invoke$arity$1(cljs.core.meta(result));
var current_block_uuid = new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(current_block);
return daiquiri.core.create_element("div",{'title':["Query: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(query)].join(''),'className':"th"},[(cljs.core.truth_(dsl_query_QMARK_)?(function (){var attrs113425 = frontend.ui.icon("search",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),(14)], null));
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs113425))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","flex-1","flex-row"], null)], null),attrs113425], 0))):{'className':"flex flex-1 flex-row"}),((cljs.core.map_QMARK_(attrs113425))?[daiquiri.core.create_element("div",{'className':"ml-1"},[["Live query",(cljs.core.truth_(dsl_page_query_QMARK_)?" for pages":null)].join('')])]:[daiquiri.interpreter.interpret(attrs113425),daiquiri.core.create_element("div",{'className':"ml-1"},[["Live query",(cljs.core.truth_(dsl_page_query_QMARK_)?" for pages":null)].join('')])]));
})():daiquiri.core.create_element("div",{'style':{'fontSize':"initial"}},[daiquiri.interpreter.interpret(title)])),((((cljs.core.not(dsl_query_QMARK_)) || (cljs.core.not(collapsed_QMARK_))))?(function (){var attrs113366 = (((cljs.core.count(result) > (0)))?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.results-count.pl-2","span.results-count.pl-2",47815345),(function (){var result_count = ((((cljs.core.not(table_QMARK_)) && (cljs.core.map_QMARK_(result))))?cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core._PLUS_,cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.comp.cljs$core$IFn$_invoke$arity$2(cljs.core.count,cljs.core.val),result)):cljs.core.count(result));
return [cljs.core.str.cljs$core$IFn$_invoke$arity$1(result_count),(((result_count > (1)))?" results":" result")].join('');
})()], null):null);
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs113366))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","flex-row","items-center","fade-in"], null)], null),attrs113366], 0))):{'className':"flex flex-row items-center fade-in"}),((cljs.core.map_QMARK_(attrs113366))?[(cljs.core.truth_((function (){var and__5000__auto__ = current_block;
if(cljs.core.truth_(and__5000__auto__)){
return ((cljs.core.not(view_f)) && (cljs.core.not(page_list_QMARK_)));
} else {
return and__5000__auto__;
}
})())?(cljs.core.truth_(table_QMARK_)?daiquiri.core.create_element("a",{'title':"Switch to list view",'onClick':(function (){
return frontend.handler.property.set_block_property_BANG_(frontend.state.get_current_repo(),current_block_uuid,new cljs.core.Keyword(null,"query-table","query-table",2095143554),false);
}),'className':"flex ml-1 fade-link"},[daiquiri.interpreter.interpret(frontend.ui.icon("list",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"font-size","font-size",-1847940346),(20)], null)], null)))]):daiquiri.core.create_element("a",{'title':"Switch to table view",'onClick':(function (){
return frontend.handler.property.set_block_property_BANG_(frontend.state.get_current_repo(),current_block_uuid,new cljs.core.Keyword(null,"query-table","query-table",2095143554),true);
}),'className':"flex ml-1 fade-link"},[daiquiri.interpreter.interpret(frontend.ui.icon("table",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"font-size","font-size",-1847940346),(20)], null)], null)))])):null),daiquiri.core.create_element("a",{'title':"Setting properties",'onClick':(function (){
var all_keys = frontend.components.file_based.query_table.get_all_columns_for_result(result,page_list_QMARK_);
return frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("modal","set-query-properties","modal/set-query-properties",-724632293),current_block,all_keys], null));
}),'className':"flex ml-1 fade-link"},[daiquiri.interpreter.interpret(frontend.ui.icon("settings",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"font-size","font-size",-1847940346),(20)], null)], null)))]),(function (){var attrs113413 = (cljs.core.truth_((function (){var or__5002__auto__ = full_text_search_QMARK_;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var and__5000__auto__ = query_time;
if(cljs.core.truth_(and__5000__auto__)){
return (query_time > (50));
} else {
return and__5000__auto__;
}
}
})())?frontend.components.file_based.query.query_refresh_button(query_time,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"full-text-search?","full-text-search?",-1837750206),full_text_search_QMARK_,new cljs.core.Keyword(null,"on-pointer-down","on-pointer-down",573334138),(function (e){
frontend.util.stop(e);

return frontend.components.query.result.run_custom_query(config,q,_STAR_result,query_error_atom);
})], null)):null);
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs113413))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["ml-1"], null)], null),attrs113413], 0))):{'className':"ml-1"}),((cljs.core.map_QMARK_(attrs113413))?null:[daiquiri.interpreter.interpret(attrs113413)]));
})()]:[daiquiri.interpreter.interpret(attrs113366),(cljs.core.truth_((function (){var and__5000__auto__ = current_block;
if(cljs.core.truth_(and__5000__auto__)){
return ((cljs.core.not(view_f)) && (cljs.core.not(page_list_QMARK_)));
} else {
return and__5000__auto__;
}
})())?(cljs.core.truth_(table_QMARK_)?daiquiri.core.create_element("a",{'title':"Switch to list view",'onClick':(function (){
return frontend.handler.property.set_block_property_BANG_(frontend.state.get_current_repo(),current_block_uuid,new cljs.core.Keyword(null,"query-table","query-table",2095143554),false);
}),'className':"flex ml-1 fade-link"},[daiquiri.interpreter.interpret(frontend.ui.icon("list",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"font-size","font-size",-1847940346),(20)], null)], null)))]):daiquiri.core.create_element("a",{'title':"Switch to table view",'onClick':(function (){
return frontend.handler.property.set_block_property_BANG_(frontend.state.get_current_repo(),current_block_uuid,new cljs.core.Keyword(null,"query-table","query-table",2095143554),true);
}),'className':"flex ml-1 fade-link"},[daiquiri.interpreter.interpret(frontend.ui.icon("table",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"font-size","font-size",-1847940346),(20)], null)], null)))])):null),daiquiri.core.create_element("a",{'title':"Setting properties",'onClick':(function (){
var all_keys = frontend.components.file_based.query_table.get_all_columns_for_result(result,page_list_QMARK_);
return frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("modal","set-query-properties","modal/set-query-properties",-724632293),current_block,all_keys], null));
}),'className':"flex ml-1 fade-link"},[daiquiri.interpreter.interpret(frontend.ui.icon("settings",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"font-size","font-size",-1847940346),(20)], null)], null)))]),(function (){var attrs113424 = (cljs.core.truth_((function (){var or__5002__auto__ = full_text_search_QMARK_;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var and__5000__auto__ = query_time;
if(cljs.core.truth_(and__5000__auto__)){
return (query_time > (50));
} else {
return and__5000__auto__;
}
}
})())?frontend.components.file_based.query.query_refresh_button(query_time,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"full-text-search?","full-text-search?",-1837750206),full_text_search_QMARK_,new cljs.core.Keyword(null,"on-pointer-down","on-pointer-down",573334138),(function (e){
frontend.util.stop(e);

return frontend.components.query.result.run_custom_query(config,q,_STAR_result,query_error_atom);
})], null)):null);
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs113424))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["ml-1"], null)], null),attrs113424], 0))):{'className':"ml-1"}),((cljs.core.map_QMARK_(attrs113424))?null:[daiquiri.interpreter.interpret(attrs113424)]));
})()]));
})():null)]);
}),null,"frontend.components.file-based.query/custom-query-header");

//# sourceMappingURL=frontend.components.file_based.query.js.map
