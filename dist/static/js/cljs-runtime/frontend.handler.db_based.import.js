goog.provide('frontend.handler.db_based.import$');
frontend.handler.db_based.import$.import_from_sqlite_db_BANG_ = (function frontend$handler$db_based$import$import_from_sqlite_db_BANG_(buffer,bare_graph_name,finished_ok_handler){
var graph = [frontend.config.db_version_prefix,cljs.core.str.cljs$core$IFn$_invoke$arity$1(bare_graph_name)].join('');
return promesa.core.catch$.cljs$core$IFn$_invoke$arity$2(promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41621__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.persist_db._LT_import_db(graph,buffer)),(function (___41611__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.state.add_repo_BANG_(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"url","url",276297046),graph], null))),(function (___41611__auto____$1){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.repo.restore_and_setup_repo_BANG_.cljs$core$IFn$_invoke$arity$variadic(graph,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"import-type","import-type",-499283032),new cljs.core.Keyword(null,"sqlite-db","sqlite-db",-17073529)], null)], 0))),(function (___41611__auto____$2){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.state.set_current_repo_BANG_(graph)),(function (___41611__auto____$3){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.persist_db._LT_export_db(graph,cljs.core.PersistentArrayMap.EMPTY)),(function (___41611__auto____$4){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.db.transact_BANG_.cljs$core$IFn$_invoke$arity$2(graph,logseq.db.sqlite.util.import_tx(new cljs.core.Keyword(null,"sqlite-db","sqlite-db",-17073529)))),(function (___41611__auto____$5){
return promesa.protocols._promise((finished_ok_handler.cljs$core$IFn$_invoke$arity$0 ? finished_ok_handler.cljs$core$IFn$_invoke$arity$0() : finished_ok_handler.call(null)));
}));
}));
}));
}));
}));
}));
})),(function (e){
console.error(e);

return frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$2(cljs.core.str.cljs$core$IFn$_invoke$arity$1(e.message),new cljs.core.Keyword(null,"error","error",-978969032));
}));
});
frontend.handler.db_based.import$.import_from_debug_transit_BANG_ = (function frontend$handler$db_based$import$import_from_debug_transit_BANG_(bare_graph_name,raw,finished_ok_handler){
var graph = [frontend.config.db_version_prefix,cljs.core.str.cljs$core$IFn$_invoke$arity$1(bare_graph_name)].join('');
var datoms = logseq.db.read_transit_str(raw);
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41621__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.persist_db._LT_new(graph,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"import-type","import-type",-499283032),new cljs.core.Keyword(null,"debug-transit","debug-transit",1290387396),new cljs.core.Keyword(null,"datoms","datoms",-290874434),datoms], null))),(function (___41611__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.state.add_repo_BANG_(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"url","url",276297046),graph], null))),(function (___41611__auto____$1){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.repo.restore_and_setup_repo_BANG_.cljs$core$IFn$_invoke$arity$variadic(graph,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"import-type","import-type",-499283032),new cljs.core.Keyword(null,"debug-transit","debug-transit",1290387396)], null)], 0))),(function (___41611__auto____$2){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.db.transact_BANG_.cljs$core$IFn$_invoke$arity$2(graph,logseq.db.sqlite.util.import_tx(new cljs.core.Keyword(null,"debug-transit","debug-transit",1290387396)))),(function (___41611__auto____$3){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.state.set_current_repo_BANG_(graph)),(function (___41611__auto____$4){
return promesa.protocols._promise((finished_ok_handler.cljs$core$IFn$_invoke$arity$0 ? finished_ok_handler.cljs$core$IFn$_invoke$arity$0() : finished_ok_handler.call(null)));
}));
}));
}));
}));
}));
}));
});
frontend.handler.db_based.import$.safe_build_edn_import = (function frontend$handler$db_based$import$safe_build_edn_import(export_map,import_options){
try{return logseq.db.sqlite.export$.build_import(export_map,(frontend.db.get_db.cljs$core$IFn$_invoke$arity$0 ? frontend.db.get_db.cljs$core$IFn$_invoke$arity$0() : frontend.db.get_db.call(null)),import_options);
}catch (e131124){var e = e131124;
console.error("Import EDN error: ",e);

return new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"error","error",-978969032),"An unexpected error occurred building the import. See the javascript console for details."], null);
}});
frontend.handler.db_based.import$.import_edn_data_from_file = (function frontend$handler$db_based$import$import_edn_data_from_file(export_map){
var map__131125 = frontend.handler.db_based.import$.safe_build_edn_import(export_map,cljs.core.PersistentArrayMap.EMPTY);
var map__131125__$1 = cljs.core.__destructure_map(map__131125);
var _txs = map__131125__$1;
var init_tx = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__131125__$1,new cljs.core.Keyword(null,"init-tx","init-tx",191693574));
var block_props_tx = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__131125__$1,new cljs.core.Keyword(null,"block-props-tx","block-props-tx",414649));
var misc_tx = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__131125__$1,new cljs.core.Keyword(null,"misc-tx","misc-tx",-622781628));
var error = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__131125__$1,new cljs.core.Keyword(null,"error","error",-978969032));
if(cljs.core.truth_(error)){
return frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$2(error,new cljs.core.Keyword(null,"error","error",-978969032));
} else {
var tx_meta = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("logseq.db.sqlite.export","imported-data?","logseq.db.sqlite.export/imported-data?",51416120),true], null);
var repo = frontend.state.get_current_repo();
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41621__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.db.transact_BANG_.cljs$core$IFn$_invoke$arity$3(repo,init_tx,tx_meta)),(function (___41611__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(((cljs.core.seq(block_props_tx))?frontend.db.transact_BANG_.cljs$core$IFn$_invoke$arity$3(repo,block_props_tx,tx_meta):null)),(function (___41611__auto____$1){
return promesa.protocols._promise(((cljs.core.seq(misc_tx))?frontend.db.transact_BANG_.cljs$core$IFn$_invoke$arity$3(repo,misc_tx,tx_meta):null));
}));
}));
}));
}
});
/**
 * Creates a new DB graph and imports sqlite.build EDN file
 */
frontend.handler.db_based.import$.import_from_edn_file_BANG_ = (function frontend$handler$db_based$import$import_from_edn_file_BANG_(bare_graph_name,file_body,finished_ok_handler){
var graph = [frontend.config.db_version_prefix,cljs.core.str.cljs$core$IFn$_invoke$arity$1(bare_graph_name)].join('');
var finished_error_handler = (function (){
frontend.state.set_state_BANG_(new cljs.core.Keyword("graph","importing","graph/importing",1647644617),null);

return (logseq.shui.ui.dialog_close_all_BANG_.cljs$core$IFn$_invoke$arity$0 ? logseq.shui.ui.dialog_close_all_BANG_.cljs$core$IFn$_invoke$arity$0() : logseq.shui.ui.dialog_close_all_BANG_.call(null));
});
var edn_data = (function (){try{return clojure.edn.read_string.cljs$core$IFn$_invoke$arity$1(file_body);
}catch (e131126){var e = e131126;
console.error(e);

frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$2("The given EDN file is not valid EDN. Please fix and try again.",new cljs.core.Keyword(null,"error","error",-978969032));

finished_error_handler();

return null;
}})();
if((!((edn_data == null)))){
return promesa.core.catch$.cljs$core$IFn$_invoke$arity$2(promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41621__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.persist_db._LT_new(graph,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"import-type","import-type",-499283032),new cljs.core.Keyword(null,"edn","edn",1317840885)], null))),(function (___41611__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.state.add_repo_BANG_(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"url","url",276297046),graph], null))),(function (___41611__auto____$1){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.repo.restore_and_setup_repo_BANG_.cljs$core$IFn$_invoke$arity$variadic(graph,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"import-type","import-type",-499283032),new cljs.core.Keyword(null,"edn","edn",1317840885)], null)], 0))),(function (___41611__auto____$2){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.state.set_current_repo_BANG_(graph)),(function (___41611__auto____$3){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.db_based.import$.import_edn_data_from_file(edn_data)),(function (___41611__auto____$4){
return promesa.protocols._promise((finished_ok_handler.cljs$core$IFn$_invoke$arity$0 ? finished_ok_handler.cljs$core$IFn$_invoke$arity$0() : finished_ok_handler.call(null)));
}));
}));
}));
}));
}));
})),(function (e){
console.error(e);

frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$2(["Unexpected error: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(e.message)].join(''),new cljs.core.Keyword(null,"error","error",-978969032));

return finished_error_handler();
}));
} else {
return null;
}
});
frontend.handler.db_based.import$.import_edn_data_from_form = (function frontend$handler$db_based$import$import_edn_data_from_form(import_inputs,_e){
var export_map = (function (){try{return clojure.edn.read_string.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"import-data","import-data",1112436948).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(import_inputs)));
}catch (e131127){var _err = e131127;
return new cljs.core.Keyword("frontend.handler.db-based.import","invalid-import","frontend.handler.db-based.import/invalid-import",1379978555);
}})();
var import_block_QMARK_ = new cljs.core.Keyword("logseq.db.sqlite.export","block","logseq.db.sqlite.export/block",469582025).cljs$core$IFn$_invoke$arity$1(export_map);
var block = (cljs.core.truth_(import_block_QMARK_)?(function (){var temp__5802__auto__ = new cljs.core.Keyword(null,"block-id","block-id",-70582834).cljs$core$IFn$_invoke$arity$1(cljs.core.first(frontend.state.get_editor_args()));
if(cljs.core.truth_(temp__5802__auto__)){
var eid = temp__5802__auto__;
var G__131128 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),eid], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__131128) : frontend.db.entity.call(null,G__131128));
} else {
return frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$2("No block found",new cljs.core.Keyword(null,"warning","warning",-1685650671));
}
})():null);
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("frontend.handler.db-based.import","invalid-import","frontend.handler.db-based.import/invalid-import",1379978555),export_map)){
return frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$2("The submitted EDN data is invalid! Please fix and try again.",new cljs.core.Keyword(null,"warning","warning",-1685650671));
} else {
var map__131129 = frontend.handler.db_based.import$.safe_build_edn_import(export_map,(cljs.core.truth_(block)?new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"current-block","current-block",1027687970),block], null):null));
var map__131129__$1 = cljs.core.__destructure_map(map__131129);
var txs = map__131129__$1;
var init_tx = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__131129__$1,new cljs.core.Keyword(null,"init-tx","init-tx",191693574));
var block_props_tx = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__131129__$1,new cljs.core.Keyword(null,"block-props-tx","block-props-tx",414649));
var misc_tx = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__131129__$1,new cljs.core.Keyword(null,"misc-tx","misc-tx",-622781628));
var error = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__131129__$1,new cljs.core.Keyword(null,"error","error",-978969032));
cljs.pprint.pprint.cljs$core$IFn$_invoke$arity$1(txs);

if(cljs.core.truth_(error)){
frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$2(error,new cljs.core.Keyword(null,"error","error",-978969032));
} else {
var tx_meta_131134 = (cljs.core.truth_(import_block_QMARK_)?new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"save-block","save-block",591532560)], null):new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("logseq.db.sqlite.export","imported-data?","logseq.db.sqlite.export/imported-data?",51416120),true], null));
var repo_131135 = frontend.state.get_current_repo();
promesa.core.catch$.cljs$core$IFn$_invoke$arity$2(promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41621__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.db.transact_BANG_.cljs$core$IFn$_invoke$arity$3(repo_131135,init_tx,tx_meta_131134)),(function (___41611__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(((cljs.core.seq(block_props_tx))?frontend.db.transact_BANG_.cljs$core$IFn$_invoke$arity$3(repo_131135,block_props_tx,tx_meta_131134):null)),(function (___41611__auto____$1){
return promesa.protocols._mcat(promesa.protocols._promise(((cljs.core.seq(misc_tx))?frontend.db.transact_BANG_.cljs$core$IFn$_invoke$arity$3(repo_131135,misc_tx,tx_meta_131134):null)),(function (___41611__auto____$2){
return promesa.protocols._promise((cljs.core.truth_(import_block_QMARK_)?null:(function (){
frontend.handler.ui.re_render_root_BANG_.cljs$core$IFn$_invoke$arity$0();

return frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$2("Import successful!",new cljs.core.Keyword(null,"success","success",1890645906));
})()
));
}));
}));
}));
})),(function (e){
console.error("Import EDN error: ",e);

return frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$2("An unexpected error occurred during import. See the javascript console for details.",new cljs.core.Keyword(null,"error","error",-978969032));
}));
}

return (logseq.shui.ui.dialog_close_all_BANG_.cljs$core$IFn$_invoke$arity$0 ? logseq.shui.ui.dialog_close_all_BANG_.cljs$core$IFn$_invoke$arity$0() : logseq.shui.ui.dialog_close_all_BANG_.call(null));
}
});
/**
 * Displays dialog which allows users to paste and import sqlite.build EDN Data
 */
frontend.handler.db_based.import$.import_edn_data_dialog = (function frontend$handler$db_based$import$import_edn_data_dialog(){
var import_inputs = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"import-data","import-data",1112436948),"",new cljs.core.Keyword(null,"import-block?","import-block?",444201492),false], null));
var G__131130 = new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"label.flex.my-2.text-lg","label.flex.my-2.text-lg",563662984),"Import EDN Data"], null),(function (){var G__131131 = new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"placeholder","placeholder",-104873083),"{}",new cljs.core.Keyword(null,"class","class",-2030961996),"overflow-y-auto",new cljs.core.Keyword(null,"rows","rows",850049680),(10),new cljs.core.Keyword(null,"auto-focus","auto-focus",1250006231),true,new cljs.core.Keyword(null,"on-change","on-change",-732046149),(function (e){
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(import_inputs,cljs.core.assoc,new cljs.core.Keyword(null,"import-data","import-data",1112436948),frontend.util.evalue(e));
})], null);
return (logseq.shui.ui.textarea.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.textarea.cljs$core$IFn$_invoke$arity$1(G__131131) : logseq.shui.ui.textarea.call(null,G__131131));
})(),(function (){var G__131132 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"class","class",-2030961996),"mt-3",new cljs.core.Keyword(null,"on-click","on-click",1632826543),cljs.core.partial.cljs$core$IFn$_invoke$arity$2(frontend.handler.db_based.import$.import_edn_data_from_form,import_inputs)], null);
var G__131133 = "Import";
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2(G__131132,G__131133) : logseq.shui.ui.button.call(null,G__131132,G__131133));
})()], null);
return (logseq.shui.ui.dialog_open_BANG_.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.dialog_open_BANG_.cljs$core$IFn$_invoke$arity$1(G__131130) : logseq.shui.ui.dialog_open_BANG_.call(null,G__131130));
});
goog.exportSymbol('frontend.handler.db_based.import$.import_edn_data_dialog', frontend.handler.db_based.import$.import_edn_data_dialog);

//# sourceMappingURL=frontend.handler.db_based.import.js.map
