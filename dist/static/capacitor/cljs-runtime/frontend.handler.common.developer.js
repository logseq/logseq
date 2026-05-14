goog.provide('frontend.handler.common.developer');
frontend.handler.common.developer.show_entity_data = (function frontend$handler$common$developer$show_entity_data(eid){
var result_STAR_ = (frontend.db.pull.cljs$core$IFn$_invoke$arity$1 ? frontend.db.pull.cljs$core$IFn$_invoke$arity$1(eid) : frontend.db.pull.call(null,eid));
var entity = (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(eid) : frontend.db.entity.call(null,eid));
var result = (function (){var G__69265 = result_STAR_;
var G__69265__$1 = ((((cljs.core.seq(new cljs.core.Keyword("block","properties","block/properties",708347145).cljs$core$IFn$_invoke$arity$1(entity))) && (frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(frontend.state.get_current_repo()))))?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__69265,new cljs.core.Keyword("block.debug","properties","block.debug/properties",1532223470),cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p__69271){
var vec__69272 = p__69271;
var k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__69272,(0),null);
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__69272,(1),null);
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [k,((datascript.impl.entity.entity_QMARK_(v))?logseq.db.frontend.property.property_value_content(v):((((cljs.core.set_QMARK_(v)) && (cljs.core.every_QMARK_(datascript.impl.entity.entity_QMARK_,v))))?cljs.core.set(cljs.core.map.cljs$core$IFn$_invoke$arity$2(logseq.db.frontend.property.property_value_content,v)):v
))], null);
}),new cljs.core.Keyword("block","properties","block/properties",708347145).cljs$core$IFn$_invoke$arity$1(entity)))):G__69265);
if(cljs.core.seq(new cljs.core.Keyword("block","refs","block/refs",-1214495349).cljs$core$IFn$_invoke$arity$1(result_STAR_))){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__69265__$1,new cljs.core.Keyword("block.debug","refs","block.debug/refs",-1504277838),cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (p1__69258_SHARP_){
var or__5002__auto__ = new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1((function (){var G__69280 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(p1__69258_SHARP_);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__69280) : frontend.db.entity.call(null,G__69280));
})());
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return p1__69258_SHARP_;
}
}),new cljs.core.Keyword("block","refs","block/refs",-1214495349).cljs$core$IFn$_invoke$arity$1(result_STAR_)));
} else {
return G__69265__$1;
}
})();
var pull_data = (function (){var sb__5647__auto__ = (new goog.string.StringBuffer());
var _STAR_print_newline_STAR__orig_val__69281_69332 = cljs.core._STAR_print_newline_STAR_;
var _STAR_print_fn_STAR__orig_val__69282_69333 = cljs.core._STAR_print_fn_STAR_;
var _STAR_print_newline_STAR__temp_val__69283_69334 = true;
var _STAR_print_fn_STAR__temp_val__69284_69335 = (function (x__5648__auto__){
return sb__5647__auto__.append(x__5648__auto__);
});
(cljs.core._STAR_print_newline_STAR_ = _STAR_print_newline_STAR__temp_val__69283_69334);

(cljs.core._STAR_print_fn_STAR_ = _STAR_print_fn_STAR__temp_val__69284_69335);

try{cljs.pprint.pprint.cljs$core$IFn$_invoke$arity$1(result);
}finally {(cljs.core._STAR_print_fn_STAR_ = _STAR_print_fn_STAR__orig_val__69282_69333);

(cljs.core._STAR_print_newline_STAR_ = _STAR_print_newline_STAR__orig_val__69281_69332);
}
return cljs.core.str.cljs$core$IFn$_invoke$arity$1(sb__5647__auto__);
})();
cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([pull_data], 0));

return frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$3(new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.ls-wrap-widen","div.ls-wrap-widen",-1882036990),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"pre.code","pre.code",2043838796),["ID: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(result)),"\n",pull_data].join('')], null),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"br","br",934104792)], null),frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic("Copy to clipboard",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return navigator.clipboard.writeText(pull_data);
})], 0))], null),new cljs.core.Keyword(null,"success","success",1890645906),false);
});
frontend.handler.common.developer.show_content_ast = (function frontend$handler$common$developer$show_content_ast(content,format){
var ast_data = (function (){var sb__5647__auto__ = (new goog.string.StringBuffer());
var _STAR_print_newline_STAR__orig_val__69295_69340 = cljs.core._STAR_print_newline_STAR_;
var _STAR_print_fn_STAR__orig_val__69296_69341 = cljs.core._STAR_print_fn_STAR_;
var _STAR_print_newline_STAR__temp_val__69297_69342 = true;
var _STAR_print_fn_STAR__temp_val__69298_69343 = (function (x__5648__auto__){
return sb__5647__auto__.append(x__5648__auto__);
});
(cljs.core._STAR_print_newline_STAR_ = _STAR_print_newline_STAR__temp_val__69297_69342);

(cljs.core._STAR_print_fn_STAR_ = _STAR_print_fn_STAR__temp_val__69298_69343);

try{cljs.pprint.pprint.cljs$core$IFn$_invoke$arity$1(frontend.format.mldoc.__GT_edn(content,format));
}finally {(cljs.core._STAR_print_fn_STAR_ = _STAR_print_fn_STAR__orig_val__69296_69341);

(cljs.core._STAR_print_newline_STAR_ = _STAR_print_newline_STAR__orig_val__69295_69340);
}
return cljs.core.str.cljs$core$IFn$_invoke$arity$1(sb__5647__auto__);
})();
cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([ast_data], 0));

return frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$3(new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.ls-wrap-widen","div.ls-wrap-widen",-1882036990),frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic("Copy to clipboard",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return navigator.clipboard.writeText(ast_data);
})], 0)),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"br","br",934104792)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"pre.code","pre.code",2043838796),ast_data], null)], null),new cljs.core.Keyword(null,"success","success",1890645906),false);
});
frontend.handler.common.developer.show_block_data = (function frontend$handler$common$developer$show_block_data(){
var temp__5802__auto__ = new cljs.core.Keyword(null,"block-id","block-id",-70582834).cljs$core$IFn$_invoke$arity$1(cljs.core.first(frontend.state.get_editor_args()));
if(cljs.core.truth_(temp__5802__auto__)){
var block_uuid = temp__5802__auto__;
return frontend.handler.common.developer.show_entity_data(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_uuid], null));
} else {
return frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$2("No block found",new cljs.core.Keyword(null,"warning","warning",-1685650671));
}
});
goog.exportSymbol('frontend.handler.common.developer.show_block_data', frontend.handler.common.developer.show_block_data);
frontend.handler.common.developer.show_block_ast = (function frontend$handler$common$developer$show_block_ast(){
var temp__5802__auto__ = new cljs.core.Keyword(null,"block","block",664686210).cljs$core$IFn$_invoke$arity$1(cljs.core.first(frontend.state.get_editor_args()));
if(cljs.core.truth_(temp__5802__auto__)){
var map__69304 = temp__5802__auto__;
var map__69304__$1 = cljs.core.__destructure_map(map__69304);
var title = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__69304__$1,new cljs.core.Keyword("block","title","block/title",710445684));
var format = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__69304__$1,new cljs.core.Keyword("block","format","block/format",-1212045901));
return frontend.handler.common.developer.show_content_ast(title,(function (){var or__5002__auto__ = format;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword(null,"markdown","markdown",1227225089);
}
})());
} else {
return frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$2("No block found",new cljs.core.Keyword(null,"warning","warning",-1685650671));
}
});
goog.exportSymbol('frontend.handler.common.developer.show_block_ast', frontend.handler.common.developer.show_block_ast);
frontend.handler.common.developer.show_page_data = (function frontend$handler$common$developer$show_page_data(){
var temp__5802__auto__ = frontend.util.page.get_current_page_id();
if(cljs.core.truth_(temp__5802__auto__)){
var page_id = temp__5802__auto__;
return frontend.handler.common.developer.show_entity_data(page_id);
} else {
return frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$2("No page found",new cljs.core.Keyword(null,"warning","warning",-1685650671));
}
});
goog.exportSymbol('frontend.handler.common.developer.show_page_data', frontend.handler.common.developer.show_page_data);
frontend.handler.common.developer.show_page_ast = (function frontend$handler$common$developer$show_page_ast(){
if(frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(frontend.state.get_current_repo())){
return frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$2("Command not available yet for DB graphs",new cljs.core.Keyword(null,"warning","warning",-1685650671));
} else {
var page_data = (function (){var G__69315 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","format","block/format",-1212045901),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("block","file","block/file",183171933),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("file","content","file/content",12680964)], null)], null)], null);
var G__69317 = frontend.util.page.get_current_page_id();
return (frontend.db.pull.cljs$core$IFn$_invoke$arity$2 ? frontend.db.pull.cljs$core$IFn$_invoke$arity$2(G__69315,G__69317) : frontend.db.pull.call(null,G__69315,G__69317));
})();
if(cljs.core.truth_(cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(page_data,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","file","block/file",183171933),new cljs.core.Keyword("file","content","file/content",12680964)], null)))){
return frontend.handler.common.developer.show_content_ast(cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(page_data,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","file","block/file",183171933),new cljs.core.Keyword("file","content","file/content",12680964)], null)),cljs.core.get.cljs$core$IFn$_invoke$arity$3(page_data,new cljs.core.Keyword("block","format","block/format",-1212045901),new cljs.core.Keyword(null,"markdown","markdown",1227225089)));
} else {
return frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$2("No page found",new cljs.core.Keyword(null,"warning","warning",-1685650671));
}
}
});
goog.exportSymbol('frontend.handler.common.developer.show_page_ast', frontend.handler.common.developer.show_page_ast);
frontend.handler.common.developer.validate_db = (function frontend$handler$common$developer$validate_db(){
return frontend.state._LT_invoke_db_worker.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword("thread-api","validate-db","thread-api/validate-db",2061031012),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([frontend.state.get_current_repo()], 0));
});
goog.exportSymbol('frontend.handler.common.developer.validate_db', frontend.handler.common.developer.validate_db);
frontend.handler.common.developer.import_chosen_graph = (function frontend$handler$common$developer$import_chosen_graph(repo){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.persist_db._LT_unsafe_delete(repo)),(function (_){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$2("Graph updated! Switching to graph ...",new cljs.core.Keyword(null,"success","success",1890645906))),(function (___40947__auto__){
return promesa.protocols._promise(frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("graph","switch","graph/switch",178853840),repo], null)));
}));
}));
}));
});
frontend.handler.common.developer.replace_graph_with_db_file = (function frontend$handler$common$developer$replace_graph_with_db_file(){
return frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("dialog-select","db-graph-replace","dialog-select/db-graph-replace",1491312407)], null));
});
goog.exportSymbol('frontend.handler.common.developer.replace_graph_with_db_file', frontend.handler.common.developer.replace_graph_with_db_file);
frontend.handler.common.developer.rtc_stop = (function frontend$handler$common$developer$rtc_stop(){
return frontend.handler.db_based.rtc._LT_rtc_stop_BANG_();
});
goog.exportSymbol('frontend.handler.common.developer.rtc_stop', frontend.handler.common.developer.rtc_stop);
frontend.handler.common.developer.rtc_start = (function frontend$handler$common$developer$rtc_start(){
return frontend.handler.db_based.rtc._LT_rtc_start_BANG_(frontend.state.get_current_repo());
});
goog.exportSymbol('frontend.handler.common.developer.rtc_start', frontend.handler.common.developer.rtc_start);

//# sourceMappingURL=frontend.handler.common.developer.js.map
