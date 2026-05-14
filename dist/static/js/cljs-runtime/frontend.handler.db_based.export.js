goog.provide('frontend.handler.db_based.export$');
frontend.handler.db_based.export$.export_block_data = (function frontend$handler$db_based$export$export_block_data(){
var temp__5802__auto__ = new cljs.core.Keyword(null,"block-id","block-id",-70582834).cljs$core$IFn$_invoke$arity$1(cljs.core.first(frontend.state.get_editor_args()));
if(cljs.core.truth_(temp__5802__auto__)){
var block_uuid = temp__5802__auto__;
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.state._LT_invoke_db_worker.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword("thread-api","export-edn","thread-api/export-edn",507686782),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([frontend.state.get_current_repo(),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"export-type","export-type",-2087639167),new cljs.core.Keyword(null,"block","block",664686210),new cljs.core.Keyword(null,"block-id","block-id",-70582834),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_uuid], null)], null)], 0))),(function (result){
return promesa.protocols._mcat(promesa.protocols._promise((function (){var sb__5647__auto__ = (new goog.string.StringBuffer());
var _STAR_print_newline_STAR__orig_val__114976_115093 = cljs.core._STAR_print_newline_STAR_;
var _STAR_print_fn_STAR__orig_val__114978_115094 = cljs.core._STAR_print_fn_STAR_;
var _STAR_print_newline_STAR__temp_val__114979_115095 = true;
var _STAR_print_fn_STAR__temp_val__114980_115096 = (function (x__5648__auto__){
return sb__5647__auto__.append(x__5648__auto__);
});
(cljs.core._STAR_print_newline_STAR_ = _STAR_print_newline_STAR__temp_val__114979_115095);

(cljs.core._STAR_print_fn_STAR_ = _STAR_print_fn_STAR__temp_val__114980_115096);

try{cljs.pprint.pprint.cljs$core$IFn$_invoke$arity$1(result);
}finally {(cljs.core._STAR_print_fn_STAR_ = _STAR_print_fn_STAR__orig_val__114978_115094);

(cljs.core._STAR_print_newline_STAR_ = _STAR_print_newline_STAR__orig_val__114976_115093);
}
return cljs.core.str.cljs$core$IFn$_invoke$arity$1(sb__5647__auto__);
})()),(function (pull_data){
return promesa.protocols._promise(((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"export-edn-error","export-edn-error",867881458),result))?null:(function (){
navigator.clipboard.writeText(pull_data);

cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([pull_data], 0));

return frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$2("Copied block's data!",new cljs.core.Keyword(null,"success","success",1890645906));
})()
));
}));
}));
}));
} else {
return frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$2("No block found",new cljs.core.Keyword(null,"warning","warning",-1685650671));
}
});
goog.exportSymbol('frontend.handler.db_based.export$.export_block_data', frontend.handler.db_based.export$.export_block_data);
frontend.handler.db_based.export$.export_view_nodes_data = (function frontend$handler$db_based$export$export_view_nodes_data(node_ids){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.state._LT_invoke_db_worker.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword("thread-api","export-edn","thread-api/export-edn",507686782),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([frontend.state.get_current_repo(),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"export-type","export-type",-2087639167),new cljs.core.Keyword(null,"view-nodes","view-nodes",-190176378),new cljs.core.Keyword(null,"node-ids","node-ids",2015830052),node_ids], null)], 0))),(function (result){
return promesa.protocols._mcat(promesa.protocols._promise((function (){var sb__5647__auto__ = (new goog.string.StringBuffer());
var _STAR_print_newline_STAR__orig_val__115034_115127 = cljs.core._STAR_print_newline_STAR_;
var _STAR_print_fn_STAR__orig_val__115035_115128 = cljs.core._STAR_print_fn_STAR_;
var _STAR_print_newline_STAR__temp_val__115036_115131 = true;
var _STAR_print_fn_STAR__temp_val__115037_115132 = (function (x__5648__auto__){
return sb__5647__auto__.append(x__5648__auto__);
});
(cljs.core._STAR_print_newline_STAR_ = _STAR_print_newline_STAR__temp_val__115036_115131);

(cljs.core._STAR_print_fn_STAR_ = _STAR_print_fn_STAR__temp_val__115037_115132);

try{cljs.pprint.pprint.cljs$core$IFn$_invoke$arity$1(result);
}finally {(cljs.core._STAR_print_fn_STAR_ = _STAR_print_fn_STAR__orig_val__115035_115128);

(cljs.core._STAR_print_newline_STAR_ = _STAR_print_newline_STAR__orig_val__115034_115127);
}
return cljs.core.str.cljs$core$IFn$_invoke$arity$1(sb__5647__auto__);
})()),(function (pull_data){
return promesa.protocols._promise(((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"export-edn-error","export-edn-error",867881458),result))?null:(function (){
navigator.clipboard.writeText(pull_data);

cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([pull_data], 0));

return frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$2("Copied view nodes' data!",new cljs.core.Keyword(null,"success","success",1890645906));
})()
));
}));
}));
}));
});
frontend.handler.db_based.export$.export_page_data = (function frontend$handler$db_based$export$export_page_data(){
var temp__5802__auto__ = frontend.util.page.get_current_page_id();
if(cljs.core.truth_(temp__5802__auto__)){
var page_id = temp__5802__auto__;
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.state._LT_invoke_db_worker.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword("thread-api","export-edn","thread-api/export-edn",507686782),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([frontend.state.get_current_repo(),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"export-type","export-type",-2087639167),new cljs.core.Keyword(null,"page","page",849072397),new cljs.core.Keyword(null,"page-id","page-id",-872941168),page_id], null)], 0))),(function (result){
return promesa.protocols._mcat(promesa.protocols._promise((function (){var sb__5647__auto__ = (new goog.string.StringBuffer());
var _STAR_print_newline_STAR__orig_val__115049_115173 = cljs.core._STAR_print_newline_STAR_;
var _STAR_print_fn_STAR__orig_val__115050_115174 = cljs.core._STAR_print_fn_STAR_;
var _STAR_print_newline_STAR__temp_val__115051_115175 = true;
var _STAR_print_fn_STAR__temp_val__115052_115176 = (function (x__5648__auto__){
return sb__5647__auto__.append(x__5648__auto__);
});
(cljs.core._STAR_print_newline_STAR_ = _STAR_print_newline_STAR__temp_val__115051_115175);

(cljs.core._STAR_print_fn_STAR_ = _STAR_print_fn_STAR__temp_val__115052_115176);

try{cljs.pprint.pprint.cljs$core$IFn$_invoke$arity$1(result);
}finally {(cljs.core._STAR_print_fn_STAR_ = _STAR_print_fn_STAR__orig_val__115050_115174);

(cljs.core._STAR_print_newline_STAR_ = _STAR_print_newline_STAR__orig_val__115049_115173);
}
return cljs.core.str.cljs$core$IFn$_invoke$arity$1(sb__5647__auto__);
})()),(function (pull_data){
return promesa.protocols._promise(((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"export-edn-error","export-edn-error",867881458),result))?null:(function (){
navigator.clipboard.writeText(pull_data);

cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([pull_data], 0));

return frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$2("Copied page's data!",new cljs.core.Keyword(null,"success","success",1890645906));
})()
));
}));
}));
}));
} else {
return frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$2("No page found",new cljs.core.Keyword(null,"warning","warning",-1685650671));
}
});
goog.exportSymbol('frontend.handler.db_based.export$.export_page_data', frontend.handler.db_based.export$.export_page_data);
frontend.handler.db_based.export$.export_graph_ontology_data = (function frontend$handler$db_based$export$export_graph_ontology_data(){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.state._LT_invoke_db_worker.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword("thread-api","export-edn","thread-api/export-edn",507686782),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([frontend.state.get_current_repo(),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"export-type","export-type",-2087639167),new cljs.core.Keyword(null,"graph-ontology","graph-ontology",-1663150820)], null)], 0))),(function (result){
return promesa.protocols._mcat(promesa.protocols._promise((function (){var sb__5647__auto__ = (new goog.string.StringBuffer());
var _STAR_print_newline_STAR__orig_val__115058_115206 = cljs.core._STAR_print_newline_STAR_;
var _STAR_print_fn_STAR__orig_val__115059_115207 = cljs.core._STAR_print_fn_STAR_;
var _STAR_print_newline_STAR__temp_val__115060_115208 = true;
var _STAR_print_fn_STAR__temp_val__115061_115209 = (function (x__5648__auto__){
return sb__5647__auto__.append(x__5648__auto__);
});
(cljs.core._STAR_print_newline_STAR_ = _STAR_print_newline_STAR__temp_val__115060_115208);

(cljs.core._STAR_print_fn_STAR_ = _STAR_print_fn_STAR__temp_val__115061_115209);

try{cljs.pprint.pprint.cljs$core$IFn$_invoke$arity$1(result);
}finally {(cljs.core._STAR_print_fn_STAR_ = _STAR_print_fn_STAR__orig_val__115059_115207);

(cljs.core._STAR_print_newline_STAR_ = _STAR_print_newline_STAR__orig_val__115058_115206);
}
return cljs.core.str.cljs$core$IFn$_invoke$arity$1(sb__5647__auto__);
})()),(function (pull_data){
return promesa.protocols._promise(((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"export-edn-error","export-edn-error",867881458),result))?null:(function (){
navigator.clipboard.writeText(pull_data);

cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([pull_data], 0));

console.log(["Exported ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.count(new cljs.core.Keyword(null,"classes","classes",2037804510).cljs$core$IFn$_invoke$arity$1(result)))," classes and ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.count(new cljs.core.Keyword(null,"properties","properties",685819552).cljs$core$IFn$_invoke$arity$1(result)))," properties"].join(''));

return frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$2("Copied graphs's ontology data!",new cljs.core.Keyword(null,"success","success",1890645906));
})()
));
}));
}));
}));
});
goog.exportSymbol('frontend.handler.db_based.export$.export_graph_ontology_data', frontend.handler.db_based.export$.export_graph_ontology_data);
frontend.handler.db_based.export$.file_name = (function frontend$handler$db_based$export$file_name(repo,extension){
return [[clojure.string.replace(clojure.string.replace(repo,frontend.config.local_db_prefix,""),/^\/+/,""),"_",cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.quot((frontend.util.time_ms.cljs$core$IFn$_invoke$arity$0 ? frontend.util.time_ms.cljs$core$IFn$_invoke$arity$0() : frontend.util.time_ms.call(null)),(1000)))].join(''),".",clojure.string.lower_case(cljs.core.name(extension))].join('');
});
frontend.handler.db_based.export$.export_repo_as_db_edn_BANG_ = (function frontend$handler$db_based$export$export_repo_as_db_edn_BANG_(repo){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.state._LT_invoke_db_worker.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword("thread-api","export-edn","thread-api/export-edn",507686782),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([frontend.state.get_current_repo(),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"export-type","export-type",-2087639167),new cljs.core.Keyword(null,"graph","graph",1558099509),new cljs.core.Keyword(null,"graph-options","graph-options",1082521635),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"include-timestamps?","include-timestamps?",158216918),true], null)], null)], 0))),(function (result){
return promesa.protocols._mcat(promesa.protocols._promise((function (){var sb__5647__auto__ = (new goog.string.StringBuffer());
var _STAR_print_newline_STAR__orig_val__115080_115215 = cljs.core._STAR_print_newline_STAR_;
var _STAR_print_fn_STAR__orig_val__115081_115216 = cljs.core._STAR_print_fn_STAR_;
var _STAR_print_newline_STAR__temp_val__115082_115217 = true;
var _STAR_print_fn_STAR__temp_val__115083_115218 = (function (x__5648__auto__){
return sb__5647__auto__.append(x__5648__auto__);
});
(cljs.core._STAR_print_newline_STAR_ = _STAR_print_newline_STAR__temp_val__115082_115217);

(cljs.core._STAR_print_fn_STAR_ = _STAR_print_fn_STAR__temp_val__115083_115218);

try{cljs.pprint.pprint.cljs$core$IFn$_invoke$arity$1(result);
}finally {(cljs.core._STAR_print_fn_STAR_ = _STAR_print_fn_STAR__orig_val__115081_115216);

(cljs.core._STAR_print_newline_STAR_ = _STAR_print_newline_STAR__orig_val__115080_115215);
}
return cljs.core.str.cljs$core$IFn$_invoke$arity$1(sb__5647__auto__);
})()),(function (pull_data){
return promesa.protocols._promise(((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"export-edn-error","export-edn-error",867881458),result))?null:(function (){var data_str = (function (){var G__115085 = pull_data;
var G__115085__$1 = (((G__115085 == null))?null:encodeURIComponent(G__115085));
if((G__115085__$1 == null)){
return null;
} else {
return ["data:text/edn;charset=utf-8,",cljs.core.str.cljs$core$IFn$_invoke$arity$1(G__115085__$1)].join('');
}
})();
var filename = frontend.handler.db_based.export$.file_name(repo,new cljs.core.Keyword(null,"edn","edn",1317840885));
var temp__5804__auto__ = goog.dom.getElement("download-as-db-edn");
if(cljs.core.truth_(temp__5804__auto__)){
var anchor = temp__5804__auto__;
anchor.setAttribute("href",data_str);

anchor.setAttribute("download",filename);

return anchor.click();
} else {
return null;
}
})()));
}));
}));
}));
});

//# sourceMappingURL=frontend.handler.db_based.export.js.map
