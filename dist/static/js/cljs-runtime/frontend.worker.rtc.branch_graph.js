goog.provide('frontend.worker.rtc.branch_graph');
/**
 * Return one of [:create-branch :download nil].
 *   when nil, nothing need to do
 */
frontend.worker.rtc.branch_graph.compare_schemas = (function frontend$worker$rtc$branch_graph$compare_schemas(server_graph_schema,app_schema,client_graph_schema){
var vec__139325 = cljs.core.map.cljs$core$IFn$_invoke$arity$2(logseq.db.frontend.schema.major_version,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [server_graph_schema,app_schema,client_graph_schema], null));
var server_graph_schema__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__139325,(0),null);
var app_schema__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__139325,(1),null);
var client_graph_schema__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__139325,(2),null);
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(server_graph_schema__$1,client_graph_schema__$1)){
return null;
} else {
if((server_graph_schema__$1 > client_graph_schema__$1)){
if((server_graph_schema__$1 < app_schema__$1)){
return null;
} else {
if((server_graph_schema__$1 > app_schema__$1)){
return null;
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(server_graph_schema__$1,app_schema__$1)){
return new cljs.core.Keyword(null,"download","download",-300081668);
} else {
return null;
}
}
}
} else {
if((server_graph_schema__$1 < client_graph_schema__$1)){
if((server_graph_schema__$1 >= app_schema__$1)){
return null;
} else {
if((server_graph_schema__$1 < app_schema__$1)){
return new cljs.core.Keyword(null,"create-branch","create-branch",213642468);
} else {
return null;
}
}
} else {
return null;
}
}
}
});

//# sourceMappingURL=frontend.worker.rtc.branch_graph.js.map
